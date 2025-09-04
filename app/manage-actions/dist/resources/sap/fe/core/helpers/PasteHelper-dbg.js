/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/MetaModelConverter", "sap/m/MessageBox", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/util/PasteHelper", "../converters/ManifestSettings", "../templating/UIFormatters"], function (Log, MetaModelConverter, MessageBox, Library, Messaging, CorePasteHelper, ManifestSettings, UIFormatters) {
  "use strict";

  var FieldEditMode = UIFormatters.FieldEditMode;
  var CreationMode = ManifestSettings.CreationMode;
  const getInfoForEntityProperty = function (propertyPath, rowBindingPath, metaContext, metaModel) {
    let enablePastingOfComputedProperties = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    let forceIgnore = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    const property = metaContext.getProperty(propertyPath),
      formatOptions = {
        parseKeepsEmptyString: true
      },
      type = metaModel.getUI5Type(`${rowBindingPath}/${propertyPath}`, formatOptions);
    let isIgnored, computed;
    if (enablePastingOfComputedProperties === true) {
      isIgnored = !property;
      computed = metaContext.getProperty(`${propertyPath}@Org.OData.Core.V1.Computed`);
    } else {
      isIgnored = !property || metaContext.getProperty(`${propertyPath}@Org.OData.Core.V1.Computed`);
    }
    return {
      property: propertyPath,
      ignore: forceIgnore || isIgnored,
      computed: computed,
      type: type
    };
  };
  const displayErrorMessages = function (errorMessages) {
    const messageDetails = [...errorMessages];
    const resourceBundle = Library.getResourceBundleFor("sap.fe.core"),
      errorCorrectionMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_MESSAGE"),
      noteMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_NOTE");
    let pasteErrorMessage;
    if (messageDetails.length > 1) {
      pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_PLURAL", [messageDetails.length]);
    } else {
      pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_SINGULAR");
    }
    messageDetails.unshift(""); // To show space between the short text and the list of errors
    messageDetails.unshift(noteMessage);
    messageDetails.unshift(errorCorrectionMessage);
    MessageBox.error(pasteErrorMessage, {
      title: resourceBundle.getText("C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR"),
      details: messageDetails.join("<br>")
    });
  };
  const PasteHelper = {
    displayErrorMessages: displayErrorMessages,
    formatCustomMessage: function (validationMessages, iRowNumber) {
      let errorMessage = "";
      const numberMessages = validationMessages.length;
      const resourceBundle = Library.getResourceBundleFor("sap.fe.core"),
        i18nRow = resourceBundle.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW");
      if (numberMessages > 0) {
        errorMessage += `${i18nRow} ${iRowNumber}: `;
        validationMessages.forEach((message, indexMessage) => {
          if (message.messageText) {
            errorMessage += message.messageText + (indexMessage + 1 !== numberMessages ? " " : "");
          }
        });
      }
      return errorMessage;
    },
    /**
     * Get details about table columns.
     * @param table The table which contains the columns to be analyzed
     * @param columns A list of columns to be analyzed. If undefined, all columns from the table are analyzed
     * @param ignoreNavigationProperty If true, navigation properties are ignored
     * @returns An array of objects providing details about columns.
     */
    getColumnInfo: function (table, columns) {
      let ignoreNavigationProperty = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      const model = table.getRowBinding().getModel(),
        metaModel = model.getMetaModel(),
        rowBindingPath = model.resolve(table.getRowBinding().getPath(), table.getRowBinding().getContext()),
        metaContext = metaModel.getMetaContext(rowBindingPath),
        entityTypeProperties = MetaModelConverter.getInvolvedDataModelObjects(metaContext).targetEntityType.entityProperties,
        columnArrangementProperty = [],
        tableDefinition = table.getParent().getTableDefinition();
      function getColumnFromPropertyInfos(dataProperty, hasValueHelp, property) {
        // If we have a textArrangement, we want to remove it if it has a ValueList associated.
        if (dataProperty.text && hasValueHelp) {
          columnArrangementProperty.push(dataProperty.text);
        }
        // Non exported columns should be part of the columnInfos
        if (dataProperty.exportSettings !== null) {
          // Check a navigation property within the current Complex property --> ignore
          if (ignoreNavigationProperty && property.includes("/")) {
            return {
              property: dataProperty.path,
              ignore: true
            };
          } else {
            let forceIgnore = false;
            if (dataProperty.path) {
              forceIgnore = columnArrangementProperty.includes(dataProperty.path);
            }
            // The object this is weird in a function, so changing it to PasteHelper instead.
            return PasteHelper.getInfoForEntityProperty(dataProperty.path, rowBindingPath, metaContext, metaModel, tableDefinition.control.enablePastingOfComputedProperties, forceIgnore);
          }
        }
      }
      const propertyInfo = table.getParent().getEnhancedFetchedPropertyInfos();
      const propertyInfoDict = Object.assign({}, ...propertyInfo.map(property => ({
        [property.name]: property
      })));
      const columnInfos = [];
      (columns ?? table.getColumns()).forEach(column => {
        const infoProperty = propertyInfoDict[column.getPropertyKey()];
        // Check if it's a complex property (property associated to multiple simple properties)
        if (infoProperty.propertyInfos) {
          // Get data from simple property
          infoProperty.propertyInfos.forEach(property => {
            const dataProperty = propertyInfoDict[property],
              hasValueHelp = this.hasValueHelpProperty(entityTypeProperties, dataProperty),
              columnToPush = getColumnFromPropertyInfos(dataProperty, hasValueHelp, property);
            if (columnToPush) {
              columnInfos.push(columnToPush);
            }
          });
          if (infoProperty.exportDataPointTargetValue) {
            columnInfos.push({
              property: "targetValueFromDataPoint",
              ignore: true
            });
          }
          // Non exported columns should be part of the columnInfos
        } else if (infoProperty.exportSettings !== null) {
          if (infoProperty.path) {
            columnInfos.push(PasteHelper.getInfoForEntityProperty(infoProperty.path, rowBindingPath, metaContext, metaModel, tableDefinition.control.enablePastingOfComputedProperties));
          } else {
            // Empty column --> ignore
            columnInfos.push({
              property: "unused",
              type: null,
              ignore: true
            });
          }
        }
      });
      return columnInfos;
    },
    getInfoForEntityProperty: getInfoForEntityProperty,
    /**
     * Returns whether a property has a value list or not.
     * @param entityTypeProperties The entity properties
     * @param dataProperty The property we want to check
     * @returns Boolean `true` if the property has a value list.
     */
    hasValueHelpProperty: function (entityTypeProperties, dataProperty) {
      const property = entityTypeProperties.find(p => p.name === dataProperty.path);
      if (property) {
        return !!property.annotations?.Common?.ValueList;
      }
      return false;
    },
    /**
     * Transform an array of data by parsing it into an array of objects, facilitating the mapping of columns and data.
     * @param rawData The table which contains the columns to be analyzed
     * @param table The table which receives the data
     * @param columns A list of columns to be used to map the data. If undefined, all table columns are used
     * @param ignoreNavigationProperty If true, navigation properties are ignored
     * @returns A collection of objects that associates data with corresponding columns.
     */
    parsePastedData: async function (rawData, table, columns) {
      let ignoreNavigationProperty = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      const pasteInfos = await this.getColumnInfo(table, columns, ignoreNavigationProperty);
      const tableDefinition = table.getParent().getTableDefinition();
      // Check if we have data for at least the first editable column
      const pastedColumnCount = rawData.length ? rawData[0].length : 0;
      let firstEditableColumnIndex = -1;
      for (let I = 0; I < pasteInfos.length && firstEditableColumnIndex < 0; I++) {
        if (!pasteInfos[I].ignore && !pasteInfos[I].computed) {
          firstEditableColumnIndex = I;
        }
      }
      if (tableDefinition.control.enablePastingOfComputedProperties) {
        const computedProperties = pasteInfos.filter(function (info) {
          return info.computed;
        });
        //for each computed property, check if the column is empty . If yes, ignore it
        computedProperties.forEach(function (computedProperty) {
          const columnPosition = pasteInfos.indexOf(computedProperty);
          const isColEmpty = rawData.every(row => row[columnPosition] === "");
          if (isColEmpty) {
            computedProperty.ignore = true;
          }
        });
      }
      const parseResult = await (firstEditableColumnIndex < 0 || firstEditableColumnIndex > pastedColumnCount - 1 ? {
        parsedData: [],
        errors: null
      } // We don't have data for an editable column --> return empty parsed data
      : CorePasteHelper.parse(rawData, pasteInfos));
      if (parseResult.errors) {
        const errorMessages = parseResult.errors.map(function (oElement) {
          return oElement.message;
        });
        this.displayErrorMessages(errorMessages);
        return []; // Errors --> return nothing
      } else {
        return parseResult.parsedData;
      }
    },
    /**
     * Update an array of contexts.
     * @param table The table which contains the contexts to be updated
     * @param contexts Array of contexts to be updated
     * @param data Array of object containing the data to be used to update the contexts
     * @returns Promise
     */
    _updateContexts: async function (table, contexts, data) {
      let index = 0;
      const setPropertyPromises = [];
      for (const row of data) {
        const rowContext = contexts[index++];
        if (rowContext) {
          for (const dataProperty in row) {
            if (table.getParent().getPropertyEditMode(dataProperty, rowContext) === FieldEditMode.Editable) {
              setPropertyPromises.push(rowContext.setProperty(dataProperty, row[dataProperty]));
            } else {
              Log.warning(`Property ${dataProperty} is not editable for row ${rowContext.getIndex()}`);
            }
          }
        }
      }
      await Promise.allSettled(setPropertyPromises);
    },
    /**
     *  Get information about the paste operation on ResponsiveTable.
     * @param rawData
     * @param cellSelection
     * @param cellSelection.columns
     * @param cellSelection.rows
     * @param posFirstSelectedRow
     * @param table
     * @returns Objet containing Information about the pasting operation
     */
    getPasteInformationForReponsiveTable: function (rawData, cellSelection, posFirstSelectedRow, table) {
      let numberOfNewCreationRows = 0;
      const posFirstInlineCreationRowInTable = table.getRowBinding().getCurrentContexts().findIndex(context => context.isTransient());
      const rows = cellSelection.rows;
      let updatedRowCount = 0;
      const columns = cellSelection.columns.length > 1 ? cellSelection.columns : table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));

      // only one cell is selected
      if (cellSelection.columns.length === 1 && cellSelection.rows.length === 1) {
        // check if the inline creation row is in the targeted range
        if (posFirstSelectedRow <= posFirstInlineCreationRowInTable && posFirstSelectedRow + rawData.length > posFirstInlineCreationRowInTable) {
          numberOfNewCreationRows = rawData.length - (posFirstInlineCreationRowInTable - posFirstSelectedRow) - 1;
          updatedRowCount = rawData.length;
        } else {
          // the inline creation row is not in the targeted range
          numberOfNewCreationRows = 0;
          updatedRowCount = rawData.length;
        }
      } else {
        // multiple cells are selected
        const lastInlineCreationRowInSelection = rows.filter(context => context.isTransient())?.pop();
        const posLastInlineCreationRowInSelection = lastInlineCreationRowInSelection ? rows.indexOf(lastInlineCreationRowInSelection) : -1;
        updatedRowCount = Math.min(rawData.length, cellSelection.rows.length);
        // check if the inline creation row is in the selected range
        if (posLastInlineCreationRowInSelection > -1) {
          updatedRowCount = posLastInlineCreationRowInSelection === cellSelection.rows.length - 1 ? rawData.length : updatedRowCount;
          numberOfNewCreationRows = posLastInlineCreationRowInSelection === cellSelection.rows.length - 1 ? rawData.length - posLastInlineCreationRowInSelection - 1 : 0;
        }
      }
      return {
        rows,
        columns,
        updatedRowCount,
        numberOfNewCreationRows
      };
    },
    /**
     *  Get information about the paste operation on GridTable.
     * @param rawData
     * @param cellSelection
     * @param cellSelection.columns
     * @param cellSelection.rows
     * @param posFirstSelectedRow
     * @param table
     * @returns Objet containing Information about the pasting operation
     */
    getPasteInformationForGridTable: function (rawData, cellSelection, posFirstSelectedRow, table) {
      let numberOfNewCreationRows = 0;
      const rows = cellSelection.rows;
      let updatedRowCount = 0;
      const tableRowcCount = table.getRowBinding().getLength();
      let columns = cellSelection.columns.length > 1 ? cellSelection.columns : table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));
      if (cellSelection.columns.length === 1 && cellSelection.rows.length === 1) {
        numberOfNewCreationRows = posFirstSelectedRow + rawData.length > tableRowcCount ? posFirstSelectedRow + rawData.length - tableRowcCount : 0;
        columns = table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));
        updatedRowCount = rawData.length;
      } else {
        // multiple cells are selected
        numberOfNewCreationRows = posFirstSelectedRow + rows.length >= tableRowcCount ? posFirstSelectedRow + rawData.length - tableRowcCount : 0;
        updatedRowCount = numberOfNewCreationRows === 0 ? Math.min(rawData.length, cellSelection.rows.length) : rawData.length;
      }
      return {
        rows,
        columns,
        updatedRowCount,
        numberOfNewCreationRows
      };
    },
    /**
     *  Get information about the paste operation.
     * @param rawData
     * @param cellSelection
     * @param cellSelection.columns
     * @param cellSelection.rows
     * @param posFirstSelectedRow
     * @param table
     * @returns Objet containing Information about the pasting operation
     */
    getPasteInformation: function (rawData, cellSelection, posFirstSelectedRow, table) {
      let pasteInformation = null;
      switch (table.data("tableType")) {
        case "GridTable":
          pasteInformation = this.getPasteInformationForGridTable(rawData, cellSelection, posFirstSelectedRow, table);
          break;
        case "ResponsiveTable":
          pasteInformation = this.getPasteInformationForReponsiveTable(rawData, cellSelection, posFirstSelectedRow, table);
          break;
        default:
          Log.warning(`Paste operation is not supported for table type ${table.data("tableType")}`);
      }
      if (pasteInformation && pasteInformation?.numberOfNewCreationRows > 0 && table.getParent().getCreationMode().getName() !== CreationMode.InlineCreationRows) {
        pasteInformation.updatedRowCount -= pasteInformation.numberOfNewCreationRows;
        pasteInformation.numberOfNewCreationRows = 0;
      }
      return pasteInformation;
    },
    /**
     * Paste data into a table using a selection of column and rows.
     * @param rawData The data to be pasted into the table
     * @param cellSelection The columns and the rows to be updated
     * @param cellSelection.columns The columns to be updated
     * @param cellSelection.rows The rows to be updated
     * @param table The table
     * @returns Object containing information about the paste
     */
    pasteRangeData: async function (rawData, cellSelection, table) {
      const posFirstSelectedRow = cellSelection.rows[0].getIndex();
      const pasteInfo = this.getPasteInformation(rawData, cellSelection, posFirstSelectedRow, table);
      if (!pasteInfo) return;
      const parsedData = await this.parsePastedData(rawData, table, pasteInfo.columns, false);
      if (parsedData.length > 0) {
        if (pasteInfo.numberOfNewCreationRows > 0) {
          await table.getParent().createEmptyRows(table.getRowBinding(), table, false, pasteInfo.numberOfNewCreationRows, true);
        }

        //load missing rows if needed including the newly created rows
        pasteInfo.rows = await table.getRowBinding().requestContexts(posFirstSelectedRow, pasteInfo.updatedRowCount);
        await this._updateContexts(table, pasteInfo.rows, parsedData);

        // focusing on the first available creation row
        const posFirstInlineCreationRow = pasteInfo.rows.find(context => context.isTransient())?.getIndex();
        if (posFirstInlineCreationRow) {
          table.focusRow(posFirstInlineCreationRow);
        }
        return {
          updatedRowCount: pasteInfo.updatedRowCount,
          updatedColCount: Object.keys(parsedData[0]).length,
          numberOfNewCreationRows: pasteInfo.numberOfNewCreationRows < 0 ? 0 : pasteInfo.numberOfNewCreationRows,
          posFirstInlineCreationRow
        };
      }
    },
    pasteData: async function (rawData, table, controller) {
      const editFlow = controller.editFlow;
      const tableDefinition = table.getParent().getTableDefinition();
      let aData = [];
      return this.parsePastedData(rawData, table).then(async aParsedData => {
        aData = aParsedData || [];
        return Promise.all(aData.map(async mData => editFlow.validateDocument(table.getBindingContext(), {
          data: mData,
          customValidationFunction: tableDefinition?.control?.customValidationFunction
        })));
      }).then(aValidationMessages => {
        const aErrorMessages = aValidationMessages.reduce(function (aMessages, aCustomMessages, index) {
          if (aCustomMessages.length > 0) {
            aMessages.push({
              messages: aCustomMessages,
              row: index + 1
            });
          }
          return aMessages;
        }, []);
        if (aErrorMessages.length > 0) {
          const aRowMessages = aErrorMessages.map(mError => this.formatCustomMessage(mError.messages, mError.row));
          this.displayErrorMessages(aRowMessages);
          return [];
        }
        return aData;
      }).then(async aValidatedData => {
        // remove the last transient context if it exists
        const transientContexts = table.getRowBinding().getCurrentContexts().filter(context => context.isTransient());
        const lastTransientContext = transientContexts.pop();
        //check if the last transient context has an error message
        const lastTransientContextHasErrorMessage = !!Messaging.getMessageModel().getData().find(message => lastTransientContext && message.getTargets()[0].includes(lastTransientContext.getPath()));
        const newContexts = aValidatedData.length > 0 ? await editFlow.createMultipleDocuments(table.getRowBinding(), aValidatedData, tableDefinition?.control?.createAtEnd, true, controller.editFlow.onBeforeCreate) : undefined;
        // if the last transient context has no error message, delete it and recreate a new one at the last position
        if (lastTransientContext && !lastTransientContextHasErrorMessage) {
          lastTransientContext?.delete();
          await table.getParent().createEmptyRows(table.getRowBinding(), table, false, 1);
        }
        return newContexts;
      }).catch(oError => {
        Log.error("Error while pasting data", oError);
        return undefined;
      });
    }
  };
  return PasteHelper;
}, false);
//# sourceMappingURL=PasteHelper-dbg.js.map

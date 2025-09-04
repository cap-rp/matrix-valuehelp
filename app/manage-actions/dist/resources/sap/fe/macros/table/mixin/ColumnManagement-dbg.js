/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StandardRecommendationHelper", "sap/fe/core/templating/DataFieldFormatters"], function (BindingToolkit, MetaModelConverter, ResourceModelHelper, StandardRecommendationHelper, DataFieldFormatters) {
  "use strict";

  var _exports = {};
  var generateVisibleExpression = DataFieldFormatters.generateVisibleExpression;
  var standardRecommendationHelper = StandardRecommendationHelper.standardRecommendationHelper;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getInvolvedDataModelObjectEntityKeys = MetaModelConverter.getInvolvedDataModelObjectEntityKeys;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * A mixin for column-related logic in the table.
   */
  let ColumnManagement = /*#__PURE__*/function () {
    function ColumnManagement() {}
    _exports = ColumnManagement;
    var _proto = ColumnManagement.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    };
    _proto.getPropertyUIHiddenCache = function getPropertyUIHiddenCache() {
      if (this.propertyUIHiddenCache === undefined) {
        this.propertyUIHiddenCache = {};
      }
      return this.propertyUIHiddenCache;
    };
    _proto.getDynamicVisibilityForColumns = function getDynamicVisibilityForColumns() {
      if (this.dynamicVisibilityForColumns === undefined) {
        this.dynamicVisibilityForColumns = [];
      }
      return this.dynamicVisibilityForColumns;
    };
    _proto.checkIfColumnExists = function checkIfColumnExists(aFilteredColummns, columnName) {
      return aFilteredColummns.some(function (oColumn) {
        if (oColumn?.columnName === columnName && oColumn?.sColumnNameVisible || oColumn?.sTextArrangement !== undefined && oColumn?.sTextArrangement === columnName) {
          return columnName;
        }
      });
    };
    _proto.getTableIdentifierColumnInfo = function getTableIdentifierColumnInfo() {
      const oTable = this.getContent();
      const headerInfoTitlePath = this.getTableDefinition().headerInfoTitle;
      const oMetaModel = oTable && oTable.getModel()?.getMetaModel(),
        sCurrentEntitySetName = oTable.data("metaPath");
      const aTechnicalKeys = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/$Key`);
      const filteredTechnicalKeys = [];
      if (aTechnicalKeys && aTechnicalKeys.length > 0) {
        aTechnicalKeys.forEach(function (technicalKey) {
          if (technicalKey !== "IsActiveEntity") {
            filteredTechnicalKeys.push(technicalKey);
          }
        });
      }
      const semanticKeyColumns = this.getTableDefinition().semanticKeys;
      const aVisibleColumns = [];
      const aFilteredColummns = [];
      const aTableColumns = oTable.getColumns();
      aTableColumns.forEach(function (oColumn) {
        const column = oColumn?.getPropertyKey?.();
        if (column) {
          aVisibleColumns.push(column);
        }
      });
      aVisibleColumns.forEach(function (oColumn) {
        const oTextArrangement = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/${oColumn}@`);
        const sTextArrangement = oTextArrangement && oTextArrangement["@com.sap.vocabularies.Common.v1.Text"]?.$Path;
        const sTextPlacement = oTextArrangement && oTextArrangement["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]?.$EnumMember;
        aFilteredColummns.push({
          columnName: oColumn,
          sTextArrangement: sTextArrangement,
          sColumnNameVisible: !(sTextPlacement === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly")
        });
      });
      return {
        headerInfoTitlePath,
        filteredTechnicalKeys,
        semanticKeyColumns,
        aFilteredColummns
      };
    };
    _proto.getIdentifierColumn = function getIdentifierColumn(isRecommendationRelevant) {
      const {
        headerInfoTitlePath,
        filteredTechnicalKeys,
        semanticKeyColumns,
        aFilteredColummns
      } = this.getTableIdentifierColumnInfo();
      let column;
      if (isRecommendationRelevant) {
        const rootContext = standardRecommendationHelper.getCurrentRootContext();
        const rootKeys = getInvolvedDataModelObjectEntityKeys(rootContext);
        if (semanticKeyColumns.length > 0) {
          column = semanticKeyColumns.filter(key => !rootKeys.semanticKeys.includes(key));
        } else if (filteredTechnicalKeys.length > 0) {
          column = filteredTechnicalKeys.filter(key => !rootKeys.technicalKeys.includes(key));
        }
        return column;
      }
      if (headerInfoTitlePath !== undefined && this.checkIfColumnExists(aFilteredColummns, headerInfoTitlePath)) {
        column = headerInfoTitlePath;
      } else if (semanticKeyColumns !== undefined && semanticKeyColumns.length === 1 && this.checkIfColumnExists(aFilteredColummns, semanticKeyColumns[0])) {
        column = semanticKeyColumns[0];
      } else if (filteredTechnicalKeys.length === 1 && this.checkIfColumnExists(aFilteredColummns, filteredTechnicalKeys[0])) {
        column = filteredTechnicalKeys[0];
      }
      return column;
    }

    /**
     * Computes the column value with text arrangement.
     * @param key Modified key with text annotation path.
     * @param tableRowContext
     * @param textAnnotationPath
     * @param textArrangement
     * @returns Computed column value.
     */;
    _proto.computeColumnValue = function computeColumnValue(key, tableRowContext, textAnnotationPath, textArrangement) {
      const sCodeValue = tableRowContext.getObject(key);
      let sTextValue;
      let sComputedValue = sCodeValue;
      if (textAnnotationPath) {
        if (key.lastIndexOf("/") > 0) {
          // the target property is replaced with the text annotation path
          key = key.slice(0, key.lastIndexOf("/") + 1);
          key = key.concat(textAnnotationPath);
        } else {
          key = textAnnotationPath;
        }
        sTextValue = tableRowContext.getObject(key);
        if (sTextValue) {
          if (textArrangement) {
            const sEnumNumber = textArrangement.slice(textArrangement.indexOf("/") + 1);
            switch (sEnumNumber) {
              case "TextOnly":
                sComputedValue = sTextValue;
                break;
              case "TextFirst":
                sComputedValue = `${sTextValue} (${sCodeValue})`;
                break;
              case "TextLast":
                sComputedValue = `${sCodeValue} (${sTextValue})`;
                break;
              case "TextSeparate":
                sComputedValue = sCodeValue;
                break;
              default:
            }
          } else {
            sComputedValue = `${sTextValue} (${sCodeValue})`;
          }
        }
      }
      return sComputedValue;
    }

    /**
     * This function will get the value of first Column of Table with its text Arrangement.
     * @param tableRowContext
     * @param textAnnotationPath
     * @param textArrangement
     * @param tableColProperty
     * @returns Column Name with Visibility and its Value.
     */;
    _proto.getTableColValue = function getTableColValue(tableRowContext, textAnnotationPath, textArrangement, tableColProperty) {
      const resourceModel = getResourceModel(this.getContent());
      let labelNameWithVisibilityAndValue = "";
      const [{
        key,
        visibility
      }] = tableColProperty;
      const columnLabel = this.getKeyColumnInfo(key)?.label;
      const sComputedValue = this.computeColumnValue(key, tableRowContext, textAnnotationPath, textArrangement);
      labelNameWithVisibilityAndValue = visibility ? `${columnLabel}: ${sComputedValue}` : `${columnLabel} (${resourceModel.getText("T_COLUMN_INDICATOR_IN_TABLE_DEFINITION")}): ${sComputedValue}`;
      return labelNameWithVisibilityAndValue;
    }

    /**
     * The method that is called to retrieve the column info from the associated message of the message popover.
     * @param keyColumn string or undefined
     * @returns Returns the column info.
     */;
    _proto.getKeyColumnInfo = function getKeyColumnInfo(keyColumn) {
      return this.getTableDefinition().columns.find(function (oColumn) {
        return oColumn.key.split("::").pop() === keyColumn;
      });
    }

    /**
     * This method is used to check if the column is Path based UI.Hidden.
     * @param columnName string
     * @param rowContext Context
     * @returns Returns true if the column is Path based UI.Hidden and value visible on the UI, else returns false. Returns string 'true' if the column is not UI.Hidden, else returns 'false'.
     */;
    _proto.isColumnValueVisible = function isColumnValueVisible(columnName, rowContext) {
      let anyObject;
      if (!this.getPropertyUIHiddenCache()[columnName]) {
        const dataModelPath = this.getDataModelAndConvertedTargetObject(columnName)?.dataModelPath;
        if (!dataModelPath) {
          return false;
        }
        const visibleExpression = compileExpression(generateVisibleExpression(dataModelPath));
        anyObject = this.createAnyControl(visibleExpression, rowContext);
        this.getPropertyUIHiddenCache()[columnName] = anyObject;
        anyObject.setBindingContext(null); // we need to set the binding context to null otherwise the following addDependent will set it to the context of the table
        this.addDependent(anyObject);
      } else {
        anyObject = this.getPropertyUIHiddenCache()[columnName];
      }
      anyObject.setBindingContext(rowContext);
      const columnValueVisible = anyObject.getAny();
      anyObject.setBindingContext(null);
      return columnValueVisible;
    }

    /**
     * Checks whether the column is UI.Hidden or not.
     * @param columnName string | string[]
     * @param tableRowContext Context
     * @returns string[] if the column name is not UI.Hidden.
     */;
    _proto.checkColumnValueVisible = function checkColumnValueVisible(columnName, tableRowContext) {
      const columnAvailability = Array.isArray(columnName) ? columnName : [columnName];
      const availableColumn = [];
      for (const column of columnAvailability) {
        const availability = this.isColumnValueVisible(column, tableRowContext);
        if (availability === "true" || availability === true) {
          availableColumn.push(column);
        }
      }
      if (availableColumn.length > 0) {
        return availableColumn;
      }
    }

    /**
     * Checks whether the column is present in the table view.
     * @param key string
     * @param aFilteredColumns
     * @returns `true` if the column is visible in the table view.
     */;
    _proto.checkVisibility = function checkVisibility(key, aFilteredColumns) {
      const column = aFilteredColumns.find(col => col.columnName === key);
      if (column) {
        return {
          visibility: column.sColumnNameVisible
        };
      }
      return {
        visibility: false
      };
    }

    /**
     * Retrieves the columns, visibility, and text arrangement based on priority order.
     * @param tableRowContext Context
     * @returns An object containing the column name and visibility.
     */;
    _proto.getTableColumnVisibilityInfo = function getTableColumnVisibilityInfo(tableRowContext) {
      const {
        headerInfoTitlePath,
        filteredTechnicalKeys,
        semanticKeyColumns,
        aFilteredColummns
      } = this.getTableIdentifierColumnInfo();
      const columnPropertyAndVisibility = [];
      if (headerInfoTitlePath !== undefined && this.checkColumnValueVisible(headerInfoTitlePath, tableRowContext)) {
        // If the headerInfoTitlePath is not undefined and not UI.Hidden, the headerInfoTitlePath is returned.
        const {
          visibility
        } = this.checkVisibility(headerInfoTitlePath, aFilteredColummns);
        columnPropertyAndVisibility.push({
          key: headerInfoTitlePath,
          visibility
        });
      } else if (semanticKeyColumns !== undefined && semanticKeyColumns.length === 1 && this.checkColumnValueVisible(semanticKeyColumns[0], tableRowContext)) {
        // if there is only one semanticKey and it is not undefined and not UI.Hidden, the single sematicKey is returned.
        const {
          visibility
        } = this.checkVisibility(semanticKeyColumns[0], aFilteredColummns);
        columnPropertyAndVisibility.push({
          key: semanticKeyColumns[0],
          visibility
        });
      } else if (filteredTechnicalKeys.length === 1 && this.checkColumnValueVisible(filteredTechnicalKeys[0], tableRowContext)) {
        // if there is only one technicalKey and it is not undefined and not UI.Hidden, the single technicalKey is returned.
        const {
          visibility
        } = this.checkVisibility(filteredTechnicalKeys[0], aFilteredColummns);
        columnPropertyAndVisibility.push({
          key: filteredTechnicalKeys[0],
          visibility
        });
      } else if (semanticKeyColumns !== undefined && semanticKeyColumns.length > 0 && this.checkColumnValueVisible(semanticKeyColumns, tableRowContext)) {
        // if there are multiple semanticKey and it is not undefined and not UI.Hidden, the multiple sematicKey is returned.
        const availableKeys = this.checkColumnValueVisible(semanticKeyColumns, tableRowContext);
        if (availableKeys) {
          for (const key of availableKeys) {
            const {
              visibility
            } = this.checkVisibility(key, aFilteredColummns);
            columnPropertyAndVisibility.push({
              key: key,
              visibility
            });
          }
        }
      } else if (filteredTechnicalKeys.length > 0 && this.checkColumnValueVisible(filteredTechnicalKeys, tableRowContext)) {
        // if there are multiple technicalKey and it is not undefined and not UI.Hidden, the multiple technicalKey is returned.
        const availableKeys = this.checkColumnValueVisible(filteredTechnicalKeys, tableRowContext);
        if (availableKeys) {
          for (const key of availableKeys) {
            const {
              visibility
            } = this.checkVisibility(key, aFilteredColummns);
            columnPropertyAndVisibility.push({
              key: key,
              visibility
            });
          }
        }
      }
      return columnPropertyAndVisibility;
    };
    _proto.modifyDynamicVisibilityForColumn = function modifyDynamicVisibilityForColumn(columnKey, visible) {
      const existingDynamicVisibility = this.getDynamicVisibilityForColumns().find(dynamicVisibility => dynamicVisibility.columnKey === columnKey);
      if (existingDynamicVisibility) {
        existingDynamicVisibility.visible = visible;
      } else {
        this.getDynamicVisibilityForColumns().push({
          columnKey: columnKey,
          visible: visible
        });
      }
    }

    /**
     * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
     * @param ignoredFields
     * @param tableDefinition
     */;
    _proto.updateColumnsVisibility = function updateColumnsVisibility(ignoredFields, tableDefinition) {
      ColumnManagement.updateColumnsVisibilityStatic(ignoredFields, this.getDynamicVisibilityForColumns(), tableDefinition);
    }

    /**
     * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
     * This static version is needed temporarily to expose a static method in TableAPI (used in Table.block).
     * @param ignoredFields
     * @param dynamicVisibilityForColumns
     * @param tableDefinition
     */;
    ColumnManagement.updateColumnsVisibilityStatic = function updateColumnsVisibilityStatic(ignoredFields, dynamicVisibilityForColumns, tableDefinition) {
      if (!ignoredFields && !dynamicVisibilityForColumns.length) {
        return;
      }
      const ignoredFieldNames = ignoredFields ? ignoredFields.split(",").map(name => name.trim()) : [];
      const columns = tableDefinition.columns;

      // If a columns in the table definition contains an ignored field, mark it as hidden
      columns.forEach(column => {
        let ignoreColumn = ignoredFieldNames.includes(column.relativePath); // Standard column
        if (!ignoreColumn && column.propertyInfos) {
          // Complex column
          ignoreColumn = column.propertyInfos.some(relatedColumnName => {
            const relatedColumn = columns.find(col => col.name === relatedColumnName);
            return relatedColumn?.relativePath && ignoredFieldNames.includes(relatedColumn.relativePath);
          });
        }
        if (ignoreColumn) {
          column.availability = "Hidden";
          if ("sortable" in column) {
            column.sortable = false;
          }
          if ("filterable" in column) {
            column.filterable = false;
          }
          if ("isGroupable" in column) {
            column.isGroupable = false;
          }
        }
        const dynamicVisibility = dynamicVisibilityForColumns.find(dynamicVisibility => dynamicVisibility.columnKey === column.key);
        if (dynamicVisibility) {
          column.availability = dynamicVisibility.visible ? "Default" : "Hidden";
        }
      });
    };
    return ColumnManagement;
  }();
  _exports = ColumnManagement;
  return _exports;
}, false);
//# sourceMappingURL=ColumnManagement-dbg.js.map

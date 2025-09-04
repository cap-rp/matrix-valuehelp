/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepEqual", "sap/base/util/deepExtend", "sap/fe/base/BindingToolkit", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/controllerextensions/cards/CollaborationManager", "sap/fe/core/converters/controls/Common/table/Columns", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/ExcelFormatHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/type/EDM", "sap/fe/macros/CollectionBindingInfo", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/filterBar/FilterBarDelegate", "sap/fe/macros/table/MdcTableTemplate", "sap/fe/macros/table/TableHelper", "sap/fe/macros/table/TableRuntime", "sap/fe/macros/table/TableSizeHelper", "sap/fe/macros/table/Utils", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageType", "sap/ui/core/Fragment", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/odata/v4/TableDelegate", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/Filter", "sap/ui/model/Sorter", "sap/ui/model/json/JSONModel", "../TableEventHandlerProvider"], function (Log, deepEqual, deepExtend, BindingToolkit, jsx, ActionRuntime, CommonUtils, MetaModelConverter, CollaborationManager, Columns, ValueFormatter, DeleteHelper, ExcelFormat, ModelHelper, PromiseKeeper, ResourceModelHelper, SizeHelper, DataModelPathHelper, EDM, CollectionBindingInfoAPI, CommonHelper, DelegateUtil, FilterBarDelegate, MdcTableTemplate, TableHelper, TableRuntime, TableSizeHelper, TableUtils, IllustratedMessage, IllustratedMessageType, Fragment, XMLPreprocessor, TableDelegateBase, TypeMap, Filter, Sorter, JSONModel, TableEventHandlerProvider) {
  "use strict";

  var getSlotColumn = MdcTableTemplate.getSlotColumn;
  var getComputedColumn = MdcTableTemplate.getComputedColumn;
  var getColumnTemplate = MdcTableTemplate.getColumnTemplate;
  var isTypeFilterable = EDM.isTypeFilterable;
  var isPathFilterable = DataModelPathHelper.isPathFilterable;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  var ColumnType = Columns.ColumnType;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var isConstant = BindingToolkit.isConstant;
  const SEMANTICKEY_HAS_DRAFTINDICATOR = "/semanticKeyHasDraftIndicator";
  const SEARCH_HAS_BEEN_FIRED = "searchFired";
  const COLUMN_HAS_BEEN_ADDED = "columnAdded";
  const PREVIOUS_SORTERS = "previousSorters";

  /**
   * Helper class for sap.ui.mdc.Table.
   * <h3><b>Note:</b></h3>
   * The class is experimental and the API and the behavior are not finalized. This class is not intended for productive usage.
   * @author SAP SE
   * @private
   * @experimental
   * @since 1.69.0
   * @alias sap.fe.macros.TableDelegate
   */
  return Object.assign({}, TableDelegateBase, {
    apiVersion: 2,
    /**
     * This function calculates the width of a FieldGroup column.
     * The width of the FieldGroup is the width of the widest property contained in the FieldGroup (including the label if showDataFieldsLabel is true)
     * The result of this calculation is stored in the visualSettings.widthCalculation.minWidth property, which is used by the MDCtable.
     * @param table Instance of the MDCtable
     * @param propertyInfo Current propertyInfo
     * @param propertyInfos Array of properties
     * @private
     * @alias sap.fe.macros.TableDelegate
     */
    _computeVisualSettingsForFieldGroup: function (table, propertyInfo, propertyInfos) {
      if (propertyInfo.key.indexOf("DataFieldForAnnotation::FieldGroup::") === 0) {
        const column = table.getColumns().find(col => {
          return col.getPropertyKey() === propertyInfo.key;
        });
        const showDataFieldsLabel = column ? column.data("showDataFieldsLabel") === "true" : false;
        const oMetaModel = table.getModel().getMetaModel();
        const involvedDataModelObjects = getInvolvedDataModelObjects(oMetaModel.getContext(propertyInfo.annotationPath));
        const convertedMetaData = involvedDataModelObjects.convertedTypes;
        const oDataField = involvedDataModelObjects.targetObject;
        const oFieldGroup = oDataField.Target.$target;
        const aFieldWidth = [];
        oFieldGroup.Data.forEach(function (oData) {
          let oDataFieldWidth;
          switch (oData.$Type) {
            case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
              oDataFieldWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(oData, false, propertyInfos, convertedMetaData, showDataFieldsLabel);
              break;
            case "com.sap.vocabularies.UI.v1.DataField":
              oDataFieldWidth = TableSizeHelper.getWidthForDataField(oData, showDataFieldsLabel, propertyInfos, convertedMetaData, false);
              break;
            case "com.sap.vocabularies.UI.v1.DataFieldForAction":
              oDataFieldWidth = {
                labelWidth: 0,
                propertyWidth: SizeHelper.getButtonWidth(oData.Label?.toString())
              };
              break;
            default:
          }
          if (oDataFieldWidth) {
            aFieldWidth.push(oDataFieldWidth.labelWidth + oDataFieldWidth.propertyWidth);
          }
        });
        const nWidest = aFieldWidth.reduce(function (acc, value) {
          return Math.max(acc, value);
        }, 0);
        propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings, {
          widthCalculation: {
            verticalArrangement: true,
            minWidth: Math.ceil(nWidest)
          }
        });
      }
    },
    _computeVisualSettingsForPropertyWithValueHelp: function (table, property) {
      const tableAPI = table.getParent();
      if (!property.propertyInfos) {
        const metaModel = table.getModel().getMetaModel();
        if (property.annotationPath && metaModel) {
          const dataField = metaModel.getObject(`${property.annotationPath}@`);
          if (dataField && dataField["@com.sap.vocabularies.Common.v1.ValueList"]) {
            property.visualSettings = deepExtend(property.visualSettings || {}, {
              widthCalculation: {
                gap: tableAPI.getProperty("readOnly") ? 0 : 4
              }
            });
          }
        }
      }
    },
    _computeVisualSettingsForPropertyWithUnit: function (table, propertyInfo, unit, unitText, timezoneText) {
      const oTableAPI = table ? table.getParent() : null;
      // update gap for properties with string unit
      const text = unitText || timezoneText;
      if (text) {
        propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings, {
          widthCalculation: {
            gap: Math.ceil(SizeHelper.getButtonWidth(text))
          }
        });
      }
      if (unit) {
        propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings, {
          widthCalculation: {
            // For properties with unit, a gap needs to be added to properly render the column width on edit mode
            gap: oTableAPI && oTableAPI.getReadOnly() ? 0 : 6
          }
        });
      }
    },
    _computeLabel: function (property, labelMap) {
      if (property.label) {
        const propertiesWithSameLabel = labelMap[property.label];
        // This computation is only for duplicate labels on navigation properties.
        // Exclude text navigation properties referenced as text on a property annotated with text arrangement set as TextOnly.
        // Exclude navigation properties created only for filtering purposes with a text arrangement set to TextOnly.
        const isPropertyUsedAsTextOnlyProperty = propertiesWithSameLabel?.some(prop => prop.text === property.path && prop?.mode === "Description");
        if (propertiesWithSameLabel?.length > 1 && property.path?.includes("/") && property.additionalLabels && !isPropertyUsedAsTextOnlyProperty && !(property?.mode === "Description" && property.filterable)) {
          property.label = property.label + " (" + property.additionalLabels.join(" / ") + ")";
        }
        delete property.additionalLabels;
      }
    },
    //Update VisualSetting for columnWidth calculation and labels on navigation properties
    _updatePropertyInfo: function (table, properties) {
      const labelMap = {};
      // Check available p13n modes
      const p13nMode = table.getP13nMode();
      properties.forEach(property => {
        if (!property.propertyInfos && property.label) {
          // Only for non-complex properties
          if (p13nMode?.includes("Sort") && property.sortable || p13nMode?.includes("Filter") && property.filterable || p13nMode?.includes("Group") && property.groupable) {
            labelMap[property.label] = labelMap[property.label] !== undefined ? labelMap[property.label].concat([property]) : [property];
          }
        }
      });
      properties.forEach(property => {
        this._computeVisualSettingsForFieldGroup(table, property, properties);
        this._computeVisualSettingsForPropertyWithValueHelp(table, property);
        this._computeLabel(property, labelMap);
      });
      // Add the $editState property
      properties.push({
        key: "$editState",
        path: "$editState",
        groupLabel: "",
        group: "",
        label: "",
        dataType: "sap.ui.model.odata.type.String",
        visible: false,
        groupable: false,
        sortable: false,
        filterable: false
      });
      return properties;
    },
    getColumnsFor: function (table) {
      return table.getParent().getTableDefinition().columns;
    },
    /**
     * Returns the export capabilities for the given sap.ui.mdc.Table instance.
     * @param oTable Instance of the table
     * @returns Promise representing the export capabilities of the table instance
     */
    fetchExportCapabilities: async function (oTable) {
      const oCapabilities = {
        XLSX: {}
      };
      let oModel;
      return DelegateUtil.fetchModel(oTable).then(function (model) {
        oModel = model;
        return oModel.getMetaModel().getObject("/$EntityContainer@Org.OData.Capabilities.V1.SupportedFormats");
      }).then(function (aSupportedFormats) {
        const aLowerFormats = (aSupportedFormats || []).map(element => {
          return element.toLowerCase();
        });
        if (aLowerFormats.includes("application/pdf")) {
          return oModel.getMetaModel().getObject("/$EntityContainer@com.sap.vocabularies.PDF.v1.Features");
        }
        return undefined;
      }).then(function (oAnnotation) {
        if (oAnnotation) {
          oCapabilities["PDF"] = Object.assign({}, oAnnotation);
        }
        return;
      }).catch(function (err) {
        Log.error(`An error occurs while computing export capabilities: ${err}`);
      }).then(function () {
        return oCapabilities;
      });
    },
    /**
     * Filtering on navigation properties that are not part of the LineItem annotation nor of the custom columns is forbidden.
     * @param columnInfo
     * @param columnDataModelObjectPath
     * @returns Boolean true if filtering is allowed, false otherwise
     */
    _isFilterableNavigationProperty: function (columnInfo, columnDataModelObjectPath) {
      const isFilterable = isPathFilterable(columnDataModelObjectPath);
      return !columnInfo.relativePath.includes("/") || (columnInfo.isPartOfLineItem === true || columnInfo.isPartOfCustomColumn === true) && !(isConstant(isFilterable) && isFilterable.value === false);
    },
    _fetchPropertyInfo: function (metaModel, columnInfo, table, appComponent) {
      const sAbsoluteNavigationPath = columnInfo.annotationPath,
        oDataField = metaModel.getObject(sAbsoluteNavigationPath),
        oNavigationContext = metaModel.createBindingContext(sAbsoluteNavigationPath),
        isComplexType = columnInfo.typeConfig?.className && columnInfo.typeConfig.className?.indexOf("Edm.") !== 0,
        bFilterable = CommonHelper.isPropertyFilterable(oNavigationContext, oDataField),
        bIsAnalyticalTable = DelegateUtil.getCustomData(table, "enableAnalytics") === "true",
        label = getLocalizedText(columnInfo.label ?? "", appComponent ?? table),
        tooltip = getLocalizedText(columnInfo.tooltip ?? "", appComponent ?? table),
        typeConfig = this._getTypeConfig(columnInfo, isComplexType),
        propertyInfo = {
          name: columnInfo.name,
          key: columnInfo.name,
          annotationPath: sAbsoluteNavigationPath,
          groupLabel: columnInfo.groupLabel,
          group: columnInfo.group,
          label: label,
          tooltip: tooltip,
          dataType: typeConfig.className,
          typeConfig: typeConfig,
          formatOptions: columnInfo.typeConfig?.baseType === "Edm.DateTimeOffset" ? {
            style: "medium/short"
          } : columnInfo.typeConfig?.formatOptions,
          constraints: typeConfig.typeInstance?.oConstraints,
          // typeInstance is a SimpleType from MDC typeMap, the type is overwritten to get the constraints. It's possible to use the getConstraints method on the typeInstance but it adds unknown constraints ("isV4") so keeping as it's for now
          visible: columnInfo.availability !== "Hidden" && !isComplexType,
          exportSettings: this._setPropertyInfoExportSettings(columnInfo.exportSettings, columnInfo),
          unit: columnInfo.unit,
          type: ColumnType.Annotation,
          relativePath: columnInfo.relativePath
        };
      if (propertyInfo.exportSettings?.template) {
        propertyInfo.clipboardSettings = {
          template: propertyInfo.exportSettings.template
        };
        // if I set this clipBoardSettings the copy provider extract the data according to the template in the html property and it is properly copied in excel
        // but when we copy elsewhere we only get the raw data and not the templated data
      }

      // Set visualSettings only if it exists
      if (columnInfo.visualSettings && Object.keys(columnInfo.visualSettings).length > 0) {
        propertyInfo.visualSettings = columnInfo.visualSettings;
      }
      if (columnInfo.exportDataPointTargetValue) {
        propertyInfo.exportDataPointTargetValue = columnInfo.exportDataPointTargetValue;
      }

      // MDC expects  'propertyInfos' only for complex properties.
      // An empty array throws validation error and undefined value is unhandled.
      if (columnInfo.propertyInfos?.length) {
        propertyInfo.propertyInfos = columnInfo.propertyInfos;
      } else {
        // Add properties which are supported only by simple PropertyInfos.

        //get the DataModelObjectPath for the column
        const columnDataModelObjectPath = getInvolvedDataModelObjects(metaModel.getContext(columnInfo.annotationPath), metaModel.getContext(DelegateUtil.getCustomData(table, "metaPath")));
        propertyInfo.path = columnInfo.relativePath;
        // TODO with the new complex property info, a lot of "Description" fields are added as filter/sort fields
        propertyInfo.sortable = columnInfo.sortable;
        if (bIsAnalyticalTable) {
          this._updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo);
        }
        propertyInfo.filterable = columnInfo.filterable !== false && !!bFilterable && this._isFilterableNavigationProperty(columnInfo, columnDataModelObjectPath);
        propertyInfo.isKey = columnInfo.isKey;
        propertyInfo.groupable = columnInfo.isGroupable;
        if (columnInfo.textArrangement) {
          this._setTextArrangementInfo(propertyInfo, columnInfo, table);
        }
        if (propertyInfo.isKey) {
          propertyInfo.extension = {
            // MDC needs to fix this, it doesn't make sense for a non Analytical Table
            technicallyGroupable: true
          };
        }
        propertyInfo.caseSensitive = columnInfo.caseSensitive;
        if (columnInfo.additionalLabels) {
          propertyInfo.additionalLabels = columnInfo.additionalLabels.map(additionalLabel => {
            return getLocalizedText(additionalLabel, appComponent || table);
          });
        }
      }
      this._computeVisualSettingsForPropertyWithUnit(table, propertyInfo, columnInfo.unit, columnInfo.unitText, columnInfo.timezoneText);
      return propertyInfo;
    },
    /**
     * Extend the export settings based on the column info.
     * @param exportSettings The export settings to be extended
     * @param columnInfo The columnInfo object
     * @returns The extended export settings
     */
    _setPropertyInfoExportSettings: function (exportSettings, columnInfo) {
      const exportFormat = this._getExportFormat(columnInfo.typeConfig?.className);
      if (exportFormat && exportSettings) {
        exportSettings.format = exportFormat;
      }
      return exportSettings;
    },
    /**
     * Gets the type config for the given column info.
     * @param columnInfo The columnInfo object.
     * @param isComplexType Indicates if the dataType is complex.
     * @returns The MDC type config.
     */
    _getTypeConfig(columnInfo, isComplexType) {
      let typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String"); // MDC expects always a dataType
      if (columnInfo.typeConfig?.className && isTypeFilterable(columnInfo.typeConfig.className)) {
        typeConfig = TypeMap.getTypeConfig(columnInfo.typeConfig.className, columnInfo.typeConfig.formatOptions, columnInfo.typeConfig.constraints);
      } else if (columnInfo.typeConfig?.className && columnInfo.typeConfig?.className !== "Edm.Stream" && !isComplexType) {
        // Stream isn't supported as a DataType on MDC typeMap
        typeConfig = TypeMap.getTypeConfig(columnInfo.typeConfig.className);
      }
      return typeConfig;
    },
    /**
     * Set the text arrangement info for the column info.
     * @param propertyInfo The current propertyInfo object.
     * @param columnInfo The columnInfo object.
     * @param table The mdc table control.
     */
    _setTextArrangementInfo: function (propertyInfo, columnInfo, table) {
      const descriptionColumn = this.getColumnsFor(table).find(function (oCol) {
        return oCol.name === columnInfo.textArrangement?.textProperty;
      });
      if (descriptionColumn) {
        propertyInfo.mode = columnInfo.textArrangement.mode;
        propertyInfo.valueProperty = columnInfo.relativePath;
        propertyInfo.descriptionProperty = descriptionColumn.relativePath;
      }
      propertyInfo.text = columnInfo.textArrangement?.textProperty;
    },
    _updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo) {
      if (columnInfo.aggregatable) {
        propertyInfo.aggregatable = columnInfo.aggregatable;
      }
      if (columnInfo.extension) {
        propertyInfo.extension = columnInfo.extension;
      }
    },
    _fetchComputedPropertyInfo: function (columnInfo, table) {
      const label = getLocalizedText(columnInfo.label, table); // Todo: To be removed once MDC provides translation support
      const propertyInfo = {
        key: columnInfo.name,
        label: label.toString(),
        dataType: "sap.ui.model.odata.type.String",
        visible: columnInfo.availability !== "Hidden",
        filterable: false,
        sortable: false,
        groupable: false,
        exportSettings: columnInfo.exportSettings,
        clipboardSettings: columnInfo.clipboardSettings
      };
      if (columnInfo.propertyInfos !== undefined && columnInfo.propertyInfos.length > 0) {
        propertyInfo.propertyInfos = columnInfo.propertyInfos;
      }
      return propertyInfo;
    },
    _fetchCustomPropertyInfo: function (columnInfo, table, appComponent) {
      let label;
      if (columnInfo.header) {
        if (columnInfo.header.startsWith("{metaModel>")) {
          label = ModelHelper.fetchTextFromMetaModel(columnInfo.header, undefined, table.getModel().getMetaModel());
        } else {
          label = getLocalizedText(columnInfo.header, appComponent); // Todo: To be removed once MDC provides translation support
        }
      }
      const propertyInfo = {
        key: columnInfo.name,
        groupLabel: undefined,
        group: undefined,
        label: label ?? "",
        dataType: "sap.ui.model.odata.type.String",
        visible: columnInfo.availability !== "Hidden",
        exportSettings: columnInfo.exportSettings,
        visualSettings: columnInfo.visualSettings
      };

      // MDC expects 'propertyInfos' only for complex properties.
      // An empty array throws validation error and undefined value is unhandled.
      if (columnInfo.propertyInfos && columnInfo.propertyInfos.length) {
        propertyInfo.propertyInfos = columnInfo.propertyInfos;
      } else {
        // Add properties which are supported only by simple PropertyInfos.
        propertyInfo.path = columnInfo.name;
        propertyInfo.sortable = false;
        propertyInfo.filterable = false;
      }
      return propertyInfo;
    },
    _bColumnHasPropertyWithDraftIndicator: function (oColumnInfo) {
      return !!(oColumnInfo.formatOptions && oColumnInfo.formatOptions.hasDraftIndicator || oColumnInfo.formatOptions && oColumnInfo.formatOptions.fieldGroupDraftIndicatorPropertyPath);
    },
    _updateDraftIndicatorModel: function (_oTable, _oColumnInfo) {
      const aVisibleColumns = _oTable.getColumns();
      const oInternalBindingContext = _oTable.getBindingContext("internal");
      const sInternalPath = oInternalBindingContext && oInternalBindingContext.getPath();
      if (aVisibleColumns && oInternalBindingContext) {
        for (const index in aVisibleColumns) {
          if (this._bColumnHasPropertyWithDraftIndicator(_oColumnInfo) && _oColumnInfo.name === aVisibleColumns[index].getPropertyKey()) {
            if (oInternalBindingContext.getProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR) === undefined) {
              oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, _oColumnInfo.name);
              break;
            }
          }
        }
      }
    },
    _fetchPropertiesForEntity: async function (table, entityTypePath, metaModel, appComponent) {
      // when fetching properties, this binding context is needed - so lets create it only once and use if for all properties/data-fields/line-items
      const bindingPath = ModelHelper.getEntitySetPath(entityTypePath);
      let fetchedProperties = [];
      const nonFilterableProperties = CommonUtils.getFilterRestrictionsByPath(bindingPath, metaModel).NonFilterableProperties;
      return Promise.resolve(this.getColumnsFor(table)).then(columns => {
        // DraftAdministrativeData does not work via 'entitySet/$NavigationPropertyBinding/DraftAdministrativeData'
        if (columns) {
          let propertyInfo;
          columns.forEach(columnInfo => {
            this._updateDraftIndicatorModel(table, columnInfo);
            switch (columnInfo.type) {
              case "Annotation":
                propertyInfo = this._fetchPropertyInfo(metaModel, columnInfo, table, appComponent);
                if (propertyInfo && !nonFilterableProperties.includes(propertyInfo.name)) {
                  propertyInfo.maxConditions = DelegateUtil.isMultiValue(propertyInfo) ? -1 : 1;
                }
                break;
              case "Computed":
                propertyInfo = this._fetchComputedPropertyInfo(columnInfo, table);
                break;
              case "Slot":
              case "Default":
                propertyInfo = this._fetchCustomPropertyInfo(columnInfo, table, appComponent);
                break;
              default:
                throw new Error(`unhandled switch case ${columnInfo.type}`);
            }
            fetchedProperties.push(propertyInfo);
          });
        }
        return;
      }).then(() => {
        fetchedProperties = this._updatePropertyInfo(table, fetchedProperties);
        const tableAPI = table.getParent();
        tableAPI.setEnhancedFetchedPropertyInfos(fetchedProperties);
        fetchedProperties = tableAPI.getPropertyInfos();
        return;
      }).catch(function (err) {
        Log.error(`An error occurs while updating fetched properties: ${err}`);
      }).then(function () {
        return fetchedProperties;
      });
    },
    _getCachedOrFetchPropertiesForEntity: async function (table, entityTypePath, metaModel, appComponent) {
      const tableAPI = table.getParent();
      const fetchedProperties = tableAPI.getCachedPropertyInfos();
      if (fetchedProperties.length) {
        return Promise.resolve(fetchedProperties);
      }
      return this._fetchPropertiesForEntity(table, entityTypePath, metaModel, appComponent).then(function (subFetchedProperties) {
        tableAPI.setCachedPropertyInfos(subFetchedProperties);
        return subFetchedProperties;
      });
    },
    setNoDataInformation: function (table, illustratedMessageInformation) {
      const noDataAggregation = table.getNoData();
      if (typeof noDataAggregation != "string" && noDataAggregation?.isA("sap.m.IllustratedMessage")) {
        const currentIllustratedMessage = noDataAggregation;
        // We override the current values of the IllustratedMessage
        currentIllustratedMessage.setTitle(illustratedMessageInformation.title);
        currentIllustratedMessage.setDescription(illustratedMessageInformation.description);
        currentIllustratedMessage.setIllustrationType(illustratedMessageInformation.illustrationType);
        currentIllustratedMessage.setIllustrationSize(illustratedMessageInformation.illustrationSize);
      } else {
        const illustratedMessage = new IllustratedMessage({
          ...illustratedMessageInformation
        });
        table.setNoData(illustratedMessage);
      }
    },
    setTableNoDataIllustratedMessage: function (table, bindingInfo) {
      const tableFilterInfo = TableUtils.getAllFilterInfo(table);
      const resourceModel = getResourceModel(table);
      const suffixResourceKey = bindingInfo.path?.startsWith("/") ? bindingInfo.path.substring(1) : bindingInfo.path;
      let illustratedInformation;
      const getNoDataIllustratedMessageWithFilters = function () {
        if (table.data("hiddenFilters") || table.getQuickFilter()) {
          return {
            title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
            description: resourceModel.getText("M_TABLE_AND_CHART_NO_DATA_TEXT_MULTI_VIEW", undefined, suffixResourceKey),
            illustrationType: IllustratedMessageType.NoSearchResults
          };
        }
        return {
          title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
          description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER", undefined, suffixResourceKey),
          illustrationType: IllustratedMessageType.NoSearchResults
        };
      };
      const filterAssociation = table.getFilter();
      const hasFilterOrSearch = tableFilterInfo.search || tableFilterInfo.filters?.length;
      if (filterAssociation && !/BasicSearch$/.test(filterAssociation)) {
        // check if a FilterBar is associated to the Table (basic search on toolBar is excluded)
        if (hasFilterOrSearch) {
          // check if table has any Filterbar filters or personalization filters
          illustratedInformation = getNoDataIllustratedMessageWithFilters();
        } else {
          illustratedInformation = {
            title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
            description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT", undefined, suffixResourceKey),
            illustrationType: IllustratedMessageType.NoSearchResults
          };
        }
      } else if (hasFilterOrSearch) {
        //check if table has any personalization filters
        illustratedInformation = getNoDataIllustratedMessageWithFilters();
      } else {
        illustratedInformation = {
          title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NODATA"),
          description: resourceModel.getText("M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT", undefined, suffixResourceKey),
          illustrationType: IllustratedMessageType.NoData
        };
      }
      if (CommonUtils.getTargetView(table).getViewData().liveMode) {
        illustratedInformation = {
          title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
          description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER"),
          illustrationType: IllustratedMessageType.NoSearchResults
        };
      }
      illustratedInformation.illustrationSize = table.getParent().getNoDataMessageMode();
      if (illustratedInformation.illustrationSize === "text") {
        const currentNoData = table.getNoData();
        if (typeof currentNoData === "string" && currentNoData === illustratedInformation.description) {
          // We don't change the noData aggregation unnecessary.
          return;
        }
        table.setNoData(illustratedInformation.description);
      } else {
        this.setNoDataInformation(table, illustratedInformation);
      }
    },
    handleTableDataReceived: function (oTable, oInternalModelContext) {
      const oBinding = oTable && oTable.getRowBinding(),
        bDataReceivedAttached = oInternalModelContext && oInternalModelContext.getProperty("dataReceivedAttached");
      if (oInternalModelContext && !bDataReceivedAttached) {
        oBinding.attachDataReceived(() => {
          // as the dataReceived event is fired multiple times, we need to ensure that the event is only handled once
          if (!oInternalModelContext.getProperty("dataReceivedTimeoutSet")) {
            oInternalModelContext.setProperty("dataReceivedTimeoutSet", true);
            setTimeout(() => {
              oInternalModelContext.setProperty("dataReceivedTimeoutSet", false);
              // Refresh the selected contexts to trigger re-calculation of enabled state of actions.
              oInternalModelContext.setProperty("selectedContexts", []);
              const aSelectedContexts = oTable.getSelectedContexts();
              oInternalModelContext.setProperty("selectedContexts", aSelectedContexts);
              oInternalModelContext.setProperty("numberOfSelectedContexts", aSelectedContexts.length);
              const tableAPI = oTable.getParent();
              const oActionOperationAvailableMap = JSON.parse(tableAPI.tableDefinition.operationAvailableMap);
              ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, "table");
              // Refresh enablement of delete button
              DeleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);
              const oTableAPI = oTable ? oTable.getParent() : null;
              if (oTableAPI) {
                oTableAPI.setUpEmptyRows(oTable);
              }
              this._updateAvailableCards(oTable);
            }, 0);
          }
        });
        oInternalModelContext.setProperty("dataReceivedAttached", true);
      }
    },
    /**
     * Set the optimistic batch promise for the enabler callback function.
     * @param controller The controller
     * @param tableAPI The TableAPI
     */
    setOptimisticBatchPromiseForModel: function (controller, tableAPI) {
      const model = controller.getAppComponent().getModel();
      if (model) {
        tableAPI.setOptimisticBatchEnablerPromise(new PromiseKeeper());
        this.setOptimisticBatchForModel(controller, model, tableAPI);
      }
    },
    /**
     * Enable the optimistic batch mode if available.
     * @param controller
     * @param table
     */
    enableOptimisticBatchMode: function (controller, table) {
      const filtersPropertiesAsPotentiallySensitiveDataOrDateType = table && TableUtils.isFilterEligibleForOptimisticBatch(table, controller._getFilterBarControl());
      table.getParent().getOptimisticBatchEnablerPromise()?.resolve(!filtersPropertiesAsPotentiallySensitiveDataOrDateType);
    },
    /**
     * Setter for the optimistic batch enabler callback function.
     * @param controller
     * @param dataModel The OData Model
     * @param tableAPI The TableAPI
     * @see {sap.ui.model.odata.v4.ODataModel#setOptimisticBatchEnabler} for further information.
     */
    setOptimisticBatchForModel: function (controller, dataModel, tableAPI) {
      const isOptimisticBatchHasToBeEnabled = controller.getAppComponent().getShellServices().isFlpOptimisticBatchPluginLoaded();
      if (dataModel.getOptimisticBatchEnabler() === null && !tableAPI.isOptimisticBatchDisabled() && isOptimisticBatchHasToBeEnabled) {
        const optimisticBatchEnablerPromiseKeeper = tableAPI.getOptimisticBatchEnablerPromise();
        dataModel.setOptimisticBatchEnabler(function () {
          return optimisticBatchEnablerPromiseKeeper?.promise;
        });
      }
    },
    rebind: async function (oTable, oBindingInfo) {
      const oTableAPI = oTable.getParent();
      const bIsSuspended = oTableAPI?.getProperty("bindingSuspended");
      oTableAPI?.setProperty("outDatedBinding", bIsSuspended);
      if (!bIsSuspended) {
        TableRuntime.clearSelection(oTable);
        TableDelegateBase.rebind.apply(this, [oTable, oBindingInfo]);
        TableUtils.onTableBound(oTable);
        return TableUtils.whenBound(oTable).then(table => {
          this.handleTableDataReceived(table, table.getBindingContext("internal"));
          return;
        }).catch(function (oError) {
          Log.error("Error while waiting for the table to be bound", oError);
        });
      }
      return Promise.resolve();
    },
    /**
     * Fetches the relevant metadata for the table and returns property info array.
     * @param table Instance of the MDCtable
     * @returns Array of property info
     */
    fetchProperties: async function (table) {
      return DelegateUtil.fetchModel(table).then(async model => {
        const appComponent = CommonUtils.getAppComponent(table);
        return this._getCachedOrFetchPropertiesForEntity(table, DelegateUtil.getCustomData(table, "entityType") ?? "", model.getMetaModel(), appComponent);
      }).then(properties => {
        table.getBindingContext("internal")?.setProperty("tablePropertiesAvailable", true);
        return properties;
      });
    },
    preInit: async function (table) {
      return TableDelegateBase.preInit.apply(this, [table]).then(() => {
        /**
         * Set the binding context to null for every fast creation row to avoid inheriting
         * the wrong context and requesting the table columns on the parent entity
         * Set the correct binding context in ObjectPageController.enableFastCreationRow()
         */
        const fastCreationRow = table.getCreationRow();
        if (fastCreationRow) {
          fastCreationRow.setBindingContext(null);
        }
        return;
      });
    },
    updateBindingInfo: function (table, bindingInfo) {
      const internalBindingContext = table.getBindingContext("internal");
      internalBindingContext?.setProperty("isInsightsEnabled", true);
      TableDelegateBase.updateBindingInfo.apply(this, [table, bindingInfo]);
      try {
        this._handleSortersOnCurrenciesOrUoM(table, bindingInfo);
        this._internalUpdateBindingInfo(table, bindingInfo);
        this.setTableNoDataIllustratedMessage(table, bindingInfo);
        this._handleRecommendationOutputFields(table, bindingInfo);
        this._handleFiltersForExternalID(table, bindingInfo);
        table.getParent()?.fireEvent("beforeRebindTable", {
          collectionBindingInfo: new CollectionBindingInfoAPI(bindingInfo)
        });
        /**
         * We have to set the binding context to null for every fast creation row to avoid it inheriting
         * the wrong context and requesting the table columns for the parent entity
         * The correct binding context is set in ObjectPageController.enableFastCreationRow()
         */
        const context = table.getBindingContext();
        // eslint-disable-next-line deprecation/deprecation
        if (table.getCreationRow()?.getBindingContext() === null && bindingInfo.path && context) {
          TableHelper.enableFastCreationRow(
          // eslint-disable-next-line deprecation/deprecation
          table.getCreationRow(), bindingInfo.path, context, table.getModel(), Promise.resolve());
        }
      } catch (e) {
        Log.error("Error while updating the binding info", e);
      }
    },
    _handleSortersOnCurrenciesOrUoM: function (table, bindingInfo) {
      const sorters = bindingInfo.sorter;
      const newSortersToBeApplied = [];
      if (sorters?.length) {
        const tableAPI = table.getParent();
        const tableProperties = tableAPI.getCachedPropertyInfos();
        for (const sorter of sorters) {
          const tableProperty = tableProperties?.find(property => property.path === sorter.getPath());
          if (tableProperty?.unit) {
            const unitProperty = tableProperties?.find(property => property.key === tableProperty?.unit);
            const unitSorterAvailable = unitProperty?.path && sorters.some(sort => sort.getPath() === unitProperty.path);
            if (!unitSorterAvailable && unitProperty?.sortable !== false && unitProperty?.path) {
              newSortersToBeApplied.push(new Sorter(unitProperty.path, false));
            }
          }
          newSortersToBeApplied.push(sorter);
        }
        bindingInfo.sorter = newSortersToBeApplied;
      }
    },
    _handleFiltersForExternalID: function (table, bindingInfo) {
      const metaModel = table.getModel()?.getMetaModel();
      const entityTypePath = bindingInfo.path + "/";
      const filters = bindingInfo.filters?.getFilters();
      if (filters !== undefined) {
        TableUtils.updateFiltersForExternalID(metaModel, filters, entityTypePath);
      }
    },
    _handleRecommendationOutputFields: function (table, oBindingInfo) {
      const tableAPI = table.getParent();
      const controller = tableAPI?.getPageController();
      if (controller?.recommendations.isRecommendationEnabled()) {
        const appComponent = controller.getAppComponent();
        const tableDef = tableAPI.getTableDefinition();
        const recommendationOutputProperties = appComponent.getSideEffectsService().getRecommendationOutputFields(tableDef.annotation.entityTypeName);
        if (recommendationOutputProperties && recommendationOutputProperties.length > 0 && oBindingInfo.parameters) {
          oBindingInfo.parameters.$select = oBindingInfo.parameters?.$select?.concat(",", recommendationOutputProperties.join());
        }
      }
    },
    /**
     * Update the cards when the binding is refreshed.
     * @param table The mdc table control.
     */
    _updateAvailableCards: async function (table) {
      const tableAPI = table.getParent();
      if (tableAPI.getPageController().getView().getViewData()?.converterType === "ListReport") {
        const appComponent = tableAPI?.getPageController()?.getAppComponent();
        const cards = [];
        await tableAPI.collectAvailableCards(cards);
        const collaborationManager = new CollaborationManager();
        const cardObject = collaborationManager.updateCards(cards);
        const parentAppId = appComponent.getId();
        appComponent.getCollaborationManagerService().addCardsToCollaborationManager(cardObject, parentAppId);
        appComponent.getCollaborationManagerService().shareAvailableCards();
      }
    },
    /**
     * The hook implemented by MDC that we can override.
     * This allows us to define properties to be requested in the MDC table (Main case is for the analytical table).
     * @param table The mdc table control.
     * @returns An array of property name to be requested.
     */
    getInResultPropertyKeys: function (table) {
      const tableAPI = table.getParent();
      if (tableAPI.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
        const allKkeysRequested = this.checkAllKeysAreRequested(tableAPI);
        const internalBindingContext = table.getBindingContext("internal");
        // if a rowpress is overridden, we  should enable the navigation at the node level
        internalBindingContext?.setProperty("isNodeLevelNavigable", tableAPI.overrideRowPress ? true : allKkeysRequested);
        return Object.keys(tableAPI.tableDefinition.requestAtLeast)
        // for analytic tables with aggregationOnLeafLevel we should not request the semanticKey expected when all keys are requested ->  it will permits to navigate from a node level when semanticKey are enabled
        // restriction are also excluded as we cannot destinguish between a node and a aggregation level
        .filter(fieldName => !allKkeysRequested ? tableAPI.tableDefinition.requestAtLeast[fieldName].some(origin => origin !== "restriction" && origin !== "semanticKey") : true);
      }
      return Object.keys(tableAPI.tableDefinition.requestAtLeast ?? {});
    },
    /**
     * Check if all keys() excepted IsActiveEntity) are requested in the table.
     * @param tableAPI The table API
     * @returns  True if all keys are requested, false otherwise
     */
    checkAllKeysAreRequested: function (tableAPI) {
      const table = tableAPI.getContent();
      const allColumns = tableAPI.getTableDefinition().columns;
      const keyPropertyNames = allColumns.filter(c => c.isKey && c.relativePath && c.relativePath !== "IsActiveEntity").map(c => c.relativePath);
      const displayedColumns = table.getColumns().map(column => tableAPI.getTableDefinition().columns.find(c => c.name === column.getPropertyKey()));

      // Store all properties referenced by displayed columns in a Set
      const referencedPropertyPaths = new Set();
      function processColumn(col) {
        // Add the property name from column itself if it's not a complex propertyInfo
        if (col.relativePath && col.propertyInfos === undefined) {
          referencedPropertyPaths.add(col.relativePath);
        }

        // Add the additional properties referenced by the column
        col.extension?.additionalProperties?.forEach(additionalColumnName => {
          const additionalColumn = allColumns.find(c => c.name === additionalColumnName);
          if (additionalColumn?.relativePath) {
            referencedPropertyPaths.add(additionalColumn.relativePath);
          }
        });
      }
      displayedColumns.forEach(column => {
        if (!column) {
          return;
        }
        // Process the column itself
        processColumn(column);

        // Process the columns referenced by the column
        column.propertyInfos?.forEach(relatedColumnName => {
          const relatedColumn = allColumns.find(c => c.name === relatedColumnName);
          if (relatedColumn) {
            processColumn(relatedColumn);
          }
        });
      });
      return keyPropertyNames.every(propName => propName && referencedPropertyPaths.has(propName));
    },
    updateBinding: function (table, bindingInfo, binding) {
      const tableAPI = table.getParent();
      const bIsSuspended = tableAPI?.getProperty("bindingSuspended");
      if (!bIsSuspended) {
        let needManualRefresh = false;
        const view = CommonUtils.getTargetView(table);
        const internalBindingContext = table.getBindingContext("internal");
        const manualUpdatePropertyKey = "pendingManualBindingUpdate";
        const pendingManualUpdate = internalBindingContext?.getProperty(manualUpdatePropertyKey);
        const newSorters = JSON.stringify(bindingInfo.sorter ?? []);
        if (binding) {
          /**
           * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
           * is not enough to trigger a batch request.
           * Removing columns creates one batch request that was not executed before
           */
          const viewData = view?.getViewData();
          const oldFilters = binding.getFilters("Application");
          const previousSorters = internalBindingContext?.getProperty(PREVIOUS_SORTERS) ?? "[]";
          const filterNotChanged = deepEqual(bindingInfo.filters, oldFilters[0]) && newSorters === previousSorters && bindingInfo.path === binding.getPath() &&
          // The path can be changed in case of a parametrized entity
          binding.getQueryOptionsFromParameters().$search === bindingInfo?.parameters?.$search;
          const LRMultiViewEnabled = !!viewData.views;
          needManualRefresh = filterNotChanged && (internalBindingContext?.getProperty(SEARCH_HAS_BEEN_FIRED) ||
          // check if the search has been triggered
          internalBindingContext?.getProperty(COLUMN_HAS_BEEN_ADDED) ||
          // check if a column has been added
          LRMultiViewEnabled) &&
          // if the multi view is enabled the request should be refreshed as we don't known if the content of the table is outdated due to an action on another table
          !pendingManualUpdate;
        }
        // Cleanup groupConditions and aggregateConditions if they don't make sense
        if (tableAPI.getTableDefinition().enableAnalytics !== true) {
          // Aggregate conditions never make sense outside of an analytical table
          table.setAggregateConditions();

          // Group conditions don't make sense in a Tree or Grid table
          if (tableAPI.getTableDefinition().control.type === "GridTable" || tableAPI.getTableDefinition().control.type === "TreeTable") {
            table.setGroupConditions();
          }
        }
        TableDelegateBase.updateBinding.apply(this, [table, bindingInfo, binding]);
        // we store the table binding info that was used to bind the table in the table API
        // this needs to be done after the call to TableDelegateBase.updateBinding other wise we don't get the aggregate parameters
        // otherwise there is no way to retrieve sorters added in the onBeforeRebindTable event
        tableAPI.setTableBindingInfo(bindingInfo);
        // we make the call to update the download url but do not await it
        tableAPI.setDownloadUrl();
        table.fireEvent("bindingUpdated");
        if (needManualRefresh && table.getFilter() && binding) {
          binding.requestRefresh(binding.getGroupId()).finally(() => {
            internalBindingContext?.setProperty(manualUpdatePropertyKey, false);
          }).catch(function (oError) {
            Log.error("Error while refreshing the table", oError);
          });
          internalBindingContext?.setProperty(manualUpdatePropertyKey, true);
        }
        internalBindingContext?.setProperty(SEARCH_HAS_BEEN_FIRED, false);
        internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, false);
        internalBindingContext?.setProperty(PREVIOUS_SORTERS, newSorters);

        //for Treetable, it's necessary to clear the pastableContexts since the binding destroys previous contexts.
        if (tableAPI.getTableDefinition().control.type === "TreeTable") {
          internalBindingContext?.setProperty("pastableContexts", []);
        }
      }
      tableAPI?.setProperty("outDatedBinding", bIsSuspended);
    },
    _computeRowBindingInfoFromTemplate: function (oTable) {
      const tableAPI = oTable.getParent();
      const rowBindingInfo = tableAPI.getTableTemplateBindingInfo();
      const bindingContext = oTable.getBindingContext();
      let tableCanBeInInlineEdit = false;
      if (bindingContext === undefined && oTable.getBindingContext("ui")?.getProperty("isEditable") === false && oTable.getModel("viewData")?.getProperty("/isInlineEditEnabled")) {
        tableCanBeInInlineEdit = true;
      } else if (bindingContext?.getBinding().getUpdateGroupId() == CommonUtils.INLINEEDIT_UPDATEGROUPID) {
        tableCanBeInInlineEdit = true;
      }
      if (tableCanBeInInlineEdit) {
        rowBindingInfo.parameters ??= {};
        rowBindingInfo.parameters.$$updateGroupId = CommonUtils.INLINEEDIT_UPDATEGROUPID;
      }

      // if the rowBindingInfo has a $$getKeepAliveContext parameter we need to check it is the only Table with such a
      // parameter for the collectionMetaPath
      if (rowBindingInfo.parameters?.$$getKeepAliveContext === true) {
        const collectionPath = DelegateUtil.getCustomData(oTable, "targetCollectionPath") ?? "";
        const internalModel = oTable.getModel("internal");
        const keptAliveLists = internalModel?.getObject("/keptAliveLists") ?? {};
        if (!keptAliveLists[collectionPath]) {
          keptAliveLists[collectionPath] = oTable.getId();
          internalModel?.setProperty("/keptAliveLists", keptAliveLists);
        } else if (keptAliveLists[collectionPath] !== oTable.getId()) {
          delete rowBindingInfo.parameters.$$getKeepAliveContext;
        }
      }
      return rowBindingInfo;
    },
    _internalUpdateBindingInfo: function (oTable, oBindingInfo) {
      const oInternalModelContext = oTable.getBindingContext("internal");
      Object.assign(oBindingInfo, this._computeRowBindingInfoFromTemplate(oTable));
      /**
       * Binding info might be suspended at the beginning when the first bindRows is called:
       * To avoid duplicate requests but still have a binding to create new entries.				 *
       * After the initial binding step, follow up bindings should no longer be suspended.
       */
      if (oTable.getRowBinding()) {
        oBindingInfo.suspended = false;
      }
      // The previously added handler for the event 'dataReceived' is not anymore there
      // since the bindingInfo is recreated from scratch so we need to set the flag to false in order
      // to again add the handler on this event if needed
      if (oInternalModelContext) {
        oInternalModelContext.setProperty("dataReceivedAttached", false);
      }
      let oFilter;
      const oFilterInfo = TableUtils.getAllFilterInfo(oTable);
      // Prepare binding info with filter/search parameters
      if (oFilterInfo.filters.length > 0) {
        oFilter = new Filter({
          filters: oFilterInfo.filters,
          and: true
        });
      }
      if (oFilterInfo.bindingPath) {
        oBindingInfo.path = oFilterInfo.bindingPath;
      }
      const oDataStateIndicator = oTable.getDataStateIndicator();
      if (oDataStateIndicator && oDataStateIndicator.isFiltering()) {
        // Include filters on messageStrip
        if (oBindingInfo.filters.length > 0) {
          oFilter = new Filter({
            filters: oBindingInfo.filters.concat(oFilterInfo.filters),
            and: true
          });
          this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
        }
      } else {
        this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
      }
      this.addFilterOnActiveEntities(oTable, oBindingInfo);
    },
    updateBindingInfoWithSearchQuery: function (bindingInfo, filterInfo, filter) {
      bindingInfo.filters = filter;
      bindingInfo.parameters ??= {};
      if (filterInfo.search) {
        bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterInfo.search);
      } else {
        bindingInfo.parameters.$search = undefined;
      }
    },
    /**
     * If specified in the payload, adds a filter to display only active entities.
     * @param table
     * @param bindingInfo
     */
    addFilterOnActiveEntities: function (table, bindingInfo) {
      const payload = table.getPayload();
      if (payload?.filterOnActiveEntities === true) {
        const filterOnActive = new Filter({
          path: "IsActiveEntity",
          operator: "EQ",
          value1: true
        });
        if (bindingInfo.filters) {
          bindingInfo.filters = new Filter({
            filters: [filterOnActive, bindingInfo.filters],
            and: true
          });
        } else {
          bindingInfo.filters = filterOnActive;
        }
      }
    },
    /**
     * Creates a template from the fragment of a slot column.
     * @param columnInfo The custom table column
     * @param view The current view
     * @param modifier The control tree modifier
     * @param tableId The id of the underlying table
     * @returns The loaded fragment
     */
    _templateSlotColumnFragment: async function (columnInfo, view, modifier, tableId) {
      const slotColumnsXML = new DOMParser().parseFromString(jsx.renderAsXML(() => {
        return getSlotColumn(tableId, columnInfo, false);
      }), "text/xml");
      if (!slotColumnsXML) {
        return Promise.resolve(null);
      }
      const slotXML = slotColumnsXML.getElementsByTagName("slot")[0];
      if (columnInfo.template) {
        if (slotXML) {
          const oTemplate = new DOMParser().parseFromString(columnInfo.template, "text/xml");
          if (oTemplate.firstElementChild && oTemplate.firstElementChild.nodeName !== "html") {
            slotXML.replaceWith(oTemplate.firstElementChild);
          } else {
            slotXML.remove();
          }
        }
      } else {
        Log.error(`Please provide content inside this Building Block Column: ${columnInfo.header}`);
        return Promise.resolve(null);
      }
      const resultXML = await XMLPreprocessor.process(slotColumnsXML.firstElementChild, {
        models: {}
      }, view.getController().getOwnerComponent().getPreprocessorContext());
      if (modifier?.targets !== "jsControlTree") {
        return resultXML.firstElementChild;
      }
      return Fragment.load({
        type: "XML",
        definition: resultXML,
        controller: view.getController()
      });
    },
    _getExportFormat: function (dataType) {
      switch (dataType) {
        case "Edm.Date":
          return ExcelFormat.getExcelDatefromJSDate();
        case "Edm.DateTimeOffset":
          return ExcelFormat.getExcelDateTimefromJSDateTime();
        case "Edm.TimeOfDay":
          return ExcelFormat.getExcelTimefromJSTime();
        default:
          return undefined;
      }
    },
    _getVHRelevantFields: function (oMetaModel, sMetadataPath, sBindingPath) {
      let aFields = [],
        oDataFieldData = oMetaModel.getObject(sMetadataPath);
      if (oDataFieldData.$kind && oDataFieldData.$kind === "Property") {
        oDataFieldData = oMetaModel.getObject(`${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
        sMetadataPath = `${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`;
      }
      switch (oDataFieldData.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          if (oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath`).includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
            oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath/Data`).forEach((oValue, iIndex) => {
              aFields = aFields.concat(this._getVHRelevantFields(oMetaModel, `${sMetadataPath}/Target/$AnnotationPath/Data/${iIndex}`));
            });
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          aFields.push(oMetaModel.getObject(`${sMetadataPath}/Value/$Path`));
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          break;
        default:
          // property
          // temporary workaround to make sure VH relevant field path do not contain the bindingpath
          if (sBindingPath && sMetadataPath.indexOf(sBindingPath) === 0) {
            aFields.push(sMetadataPath.substring(sBindingPath.length + 1));
            break;
          }
          aFields.push(CommonHelper.getNavigationPath(sMetadataPath, true));
          break;
      }
      return aFields;
    },
    _setDraftIndicatorOnVisibleColumn: function (oTable, aColumns, oColumnInfo) {
      const oInternalBindingContext = oTable.getBindingContext("internal");
      if (!oInternalBindingContext) {
        return;
      }
      const sInternalPath = oInternalBindingContext.getPath();
      const aColumnsWithDraftIndicator = aColumns.filter(oColumn => {
        return this._bColumnHasPropertyWithDraftIndicator(oColumn);
      });
      const aVisibleColumns = oTable.getColumns();
      let sAddVisibleColumnName, sVisibleColumnName, bFoundColumnVisibleWithDraft, sColumnNameWithDraftIndicator;
      for (const i in aVisibleColumns) {
        sVisibleColumnName = aVisibleColumns[i].getPropertyKey();
        for (const j in aColumnsWithDraftIndicator) {
          sColumnNameWithDraftIndicator = aColumnsWithDraftIndicator[j].name;
          if (sVisibleColumnName === sColumnNameWithDraftIndicator) {
            bFoundColumnVisibleWithDraft = true;
            break;
          }
          if (oColumnInfo && oColumnInfo.name === sColumnNameWithDraftIndicator) {
            sAddVisibleColumnName = oColumnInfo.name;
          }
        }
        if (bFoundColumnVisibleWithDraft) {
          oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sVisibleColumnName);
          break;
        }
      }
      if (!bFoundColumnVisibleWithDraft && sAddVisibleColumnName) {
        oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sAddVisibleColumnName);
      }
    },
    removeItem: async function (oTable, oPropertyInfoName, mPropertyBag) {
      let doRemoveItem = true;
      if (!oPropertyInfoName) {
        // 1. Application removed the property from their data model
        // 2. addItem failed before revertData created
        return Promise.resolve(doRemoveItem);
      }
      const oModifier = mPropertyBag.modifier;
      const sDataProperty = await oModifier.getProperty(oPropertyInfoName, "dataProperty");
      if (sDataProperty && sDataProperty.includes && sDataProperty.includes("InlineXML")) {
        oModifier.insertAggregation(oTable, "dependents", oPropertyInfoName);
        doRemoveItem = false;
      }
      if (oTable.isA && oModifier.targets === "jsControlTree") {
        this._setDraftIndicatorStatus(oModifier, oTable, this.getColumnsFor(oTable));
      }
      return Promise.resolve(doRemoveItem);
    },
    _getMetaModel: function (mPropertyBag) {
      return mPropertyBag.appComponent && mPropertyBag.appComponent.getModel().getMetaModel();
    },
    _setDraftIndicatorStatus: function (oModifier, oTable, aColumns, oColumnInfo) {
      if (oModifier.targets === "jsControlTree") {
        this._setDraftIndicatorOnVisibleColumn(oTable, aColumns, oColumnInfo);
      }
    },
    _getGroupId: function (sRetrievedGroupId) {
      return sRetrievedGroupId || undefined;
    },
    _insertAggregation: async function (oValueHelp, oModifier, oTable) {
      if (oValueHelp) {
        return oModifier.insertAggregation(oTable, "dependents", oValueHelp, 0);
      }
      return;
    },
    /**
     * Invoked when a column is added using the table personalization dialog.
     * @param oTable Instance of table control
     * @param sPropertyInfoName Name of the property for which the column is added
     * @param mPropertyBag Instance of property bag from the flexibility API
     * @param mPropertyBag.modifier Instance of the control tree modifier
     * @param mPropertyBag.appComponent Instance of the app component
     * @param mPropertyBag.view Instance of the view
     * @returns Once resolved, a table column definition is returned
     */
    addItem: async function (table, propertyInfoName, mPropertyBag) {
      const oMetaModel = this._getMetaModel(mPropertyBag),
        oModifier = mPropertyBag.modifier,
        sTableId = oModifier.getId(table),
        aColumns = table.isA ? this.getColumnsFor(table) : null;
      if (!aColumns) {
        // We return null here because everything should apply at runtime
        return Promise.resolve(null);
      }
      const columnInfo = aColumns.find(function (oColumn) {
        return oColumn.name === propertyInfoName;
      });
      if (!columnInfo) {
        Log.error(`${propertyInfoName} not found while adding column`);
        return Promise.resolve(null);
      }
      if (columnInfo.availability === "Hidden") {
        Log.warning(`Column for ${propertyInfoName} not added because it's hidden`);
        return Promise.resolve(null);
      }
      const internalBindingContext = table.getBindingContext("internal");
      internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, true);
      this._setDraftIndicatorStatus(oModifier, table, aColumns, columnInfo);
      const sPath = await DelegateUtil.getCustomDataWithModifier(table, "metaPath", oModifier);
      const oTableContext = oMetaModel.createBindingContext(sPath);
      // If view is not provided try to get it by accessing to the parental hierarchy
      // If it doesn't work (table into an unattached OP section) get the view via the AppComponent
      const view = mPropertyBag.view || CommonUtils.getTargetView(table) || (mPropertyBag.appComponent ? CommonUtils.getCurrentPageView(mPropertyBag.appComponent) : undefined);
      if (columnInfo.type === "Default") {
        Log.error("Custom columns defined in the manifest are not supported when using a table building block.");
        throw new Error("Custom columns defined in the manifest are not supported when using a table building block.");
      }
      if (columnInfo.type === "Slot") {
        return this._templateSlotColumnFragment(columnInfo, view, oModifier, sTableId);
      }
      if (columnInfo.type === "Computed") {
        const enableAnalytics = table.getParent().getTableDefinition().enableAnalytics;
        return getComputedColumn(sTableId, columnInfo, oTableContext, enableAnalytics);
      }

      // fall-back
      if (!oMetaModel) {
        return Promise.resolve(null);
      }
      const propertyInfo = table.getParent().getEnhancedFetchedPropertyInfos().find(function (propInfo) {
        return propInfo.name === propertyInfoName;
      });
      const oPropertyContext = oMetaModel.createBindingContext(propertyInfo.annotationPath);
      const fnTemplateFragment = async (oInPropertyInfo, oView) => {
        let bDisplayMode;
        let sTableTypeCustomData;
        let sCreationModeCustomData;
        return Promise.all([DelegateUtil.getCustomDataWithModifier(table, "displayModePropertyBinding", oModifier), DelegateUtil.getCustomDataWithModifier(table, "tableType", oModifier), DelegateUtil.getCustomDataWithModifier(table, "creationMode", oModifier)]).then(async aCustomData => {
          bDisplayMode = aCustomData[0];
          sTableTypeCustomData = aCustomData[1];
          sCreationModeCustomData = aCustomData[2];
          // Read Only and Column Edit Mode can both have three state
          // Undefined means that the framework decides what to do
          // True / Display means always read only
          // False / Editable means editable but while still respecting the low level principle (immutable property will not be editable)
          if (bDisplayMode !== undefined && typeof bDisplayMode !== "boolean") {
            bDisplayMode = bDisplayMode === "true";
          }
          const tableAPI = table.getParent();
          const oThis = new JSONModel({
              enableAutoColumnWidth: tableAPI.getTableDefinition().control.enableAutoColumnWidth,
              readOnly: bDisplayMode,
              tableType: sTableTypeCustomData,
              id: sTableId,
              navigationPropertyPath: propertyInfoName,
              columnInfo: columnInfo,
              collection: oMetaModel.createBindingContext(sPath),
              creationMode: {
                name: sCreationModeCustomData
              },
              widthIncludingColumnHeader: tableAPI.getTableDefinition().control.widthIncludingColumnHeader
            }),
            oPreprocessorSettings = {
              bindingContexts: {
                entitySet: oTableContext,
                collection: oTableContext,
                dataField: oPropertyContext,
                this: oThis.createBindingContext("/"),
                column: oThis.createBindingContext("/columnInfo")
              },
              models: {
                this: oThis,
                entitySet: oMetaModel,
                collection: oMetaModel,
                dataField: oMetaModel,
                metaModel: oMetaModel,
                column: oThis
              },
              appComponent: mPropertyBag.appComponent
            };
          const tableCollection = getInvolvedDataModelObjects(oMetaModel.createBindingContext(tableAPI.tableDefinition.annotation.collection));
          const handlerProvider = new TableEventHandlerProvider(tableAPI, {
            collectionEntity: tableCollection.targetObject,
            metaModel: oMetaModel
          }, tableAPI);
          const computedColumnXML = new DOMParser().parseFromString(jsx.renderAsXML(() => {
            return getColumnTemplate(sTableId, tableAPI, columnInfo, oMetaModel.createBindingContext(sPath), handlerProvider) ?? "";
          }), "text/xml");
          return DelegateUtil.templateControlFragment(computedColumnXML.firstElementChild, oPreprocessorSettings, {
            view: oView
          }, oModifier).finally(function () {
            oThis.destroy();
          });
        });
      };
      return fnTemplateFragment(propertyInfo, view);
    },
    /**
     * Provide the Table's filter delegate to provide basic filter functionality such as adding FilterFields.
     * @returns Object for the Tables filter personalization.
     */
    getFilterDelegate: function () {
      return Object.assign({
        apiVersion: 2
      }, FilterBarDelegate, {
        addItem: async function (oParentControl, sPropertyInfoName) {
          if (sPropertyInfoName.indexOf("Property::") === 0) {
            // Correct the name of complex property info references.
            sPropertyInfoName = sPropertyInfoName.replace("Property::", "");
          }
          return FilterBarDelegate.addItem(oParentControl, sPropertyInfoName);
        }
      });
    },
    /**
     * Returns the TypeMap attached to this delegate.
     * @returns Any instance of TypeMap
     */
    getTypeMap: function /*oPayload: object*/
    () {
      return TypeMap;
    },
    /**
     * Format the title of the group header .
     * @param table Instance of table control
     * @param context Context
     * @param property Name of the property
     * @returns Formatted title of the group header.
     */
    formatGroupHeader(table, context, property) {
      const propertyInfos = table.getParent().getEnhancedFetchedPropertyInfos();
      const propertyInfo = propertyInfos?.find(obj => {
        return obj.name === property;
      });
      /*For a Date, DateTime, Boolean or Decimal property, the value is returned in external format using a UI5 type for the
             given property path that formats corresponding to the property's EDM type and constraints*/
      const dataBaseType = TypeMap.getTypeConfig(propertyInfo?.dataType).baseType;
      const externalFormat = dataBaseType === "DateTime" || dataBaseType === "Date" || dataBaseType === "Boolean" || dataBaseType === "Numeric";
      let value;
      if (!context) {
        value = getResourceModel(CommonUtils.getTargetView(table)).getText("M_TABLE_GROUP_HEADER_TITLE_VALUE");
        return getResourceModel(table).getText("M_TABLE_GROUP_HEADER_TITLE", [propertyInfo?.label, value]);
      }
      if (propertyInfo?.mode) {
        switch (propertyInfo.mode) {
          case "Description":
            value = propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null;
            break;
          case "DescriptionValue":
            value = ValueFormatter.formatWithBrackets(propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null, propertyInfo.valueProperty ? context.getProperty(propertyInfo.valueProperty, externalFormat) : null);
            break;
          case "ValueDescription":
            value = ValueFormatter.formatWithBrackets(propertyInfo.valueProperty ? context.getProperty(propertyInfo.valueProperty, externalFormat) : null, propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null);
            break;
          default:
            break;
        }
      } else {
        value = propertyInfo?.path ? context.getProperty(propertyInfo.path, externalFormat) : null;
      }
      if (value === null || value === "") {
        value = getResourceModel(CommonUtils.getTargetView(table)).getText("M_TABLE_GROUP_HEADER_TITLE_VALUE");
      }
      return getResourceModel(table).getText("M_TABLE_GROUP_HEADER_TITLE", [propertyInfo?.label, value]);
    }
  });
}, false);
//# sourceMappingURL=TableDelegate-dbg.js.map

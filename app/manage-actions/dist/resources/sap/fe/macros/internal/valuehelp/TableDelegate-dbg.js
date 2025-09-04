/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepEqual", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/type/EDM", "sap/fe/macros/DelegateUtil", "sap/fe/macros/internal/valuehelp/TableDelegateHelper", "sap/ui/core/Element", "sap/ui/mdc/odata/v4/TableDelegate", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/mdc/odata/v4/util/DelegateUtil", "sap/ui/mdc/util/FilterUtil", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter"], function (Log, deepEqual, CommonUtils, MetaModelConverter, FilterBar, MetaModelFunction, ModelHelper, DataModelPathHelper, DisplayModeFormatter, PropertyHelper, EDM, MacrosDelegateUtil, TableDelegateHelper, Element, TableDelegate, TypeMap, DelegateUtil, FilterUtil, Filter, FilterOperator, Sorter) {
  "use strict";

  var isSortableProperty = TableDelegateHelper.isSortableProperty;
  var isFilterableProperty = TableDelegateHelper.isFilterableProperty;
  var getPath = TableDelegateHelper.getPath;
  var isTypeFilterable = EDM.isTypeFilterable;
  var getLabel = PropertyHelper.getLabel;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedTimezonePropertyPath = PropertyHelper.getAssociatedTimezonePropertyPath;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isMultiValueFilterExpression = MetaModelFunction.isMultiValueFilterExpression;
  var getSortRestrictionsInfo = MetaModelFunction.getSortRestrictionsInfo;
  var getFilterRestrictionsInfo = MetaModelFunction.getFilterRestrictionsInfo;
  var fetchTypeConfig = FilterBar.fetchTypeConfig;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  /**
   * Test delegate for OData V4.
   */
  const ODataTableDelegate = Object.assign({}, TableDelegate);

  /**
   * Fetches the relevant metadata for the table and returns property info array.
   * @param table Instance of the MDCtable
   * @returns Array of property info
   */
  ODataTableDelegate.fetchProperties = async function (table) {
    const model = await this._getModel(table);
    const properties = await this._createPropertyInfos(table, model);
    ODataTableDelegate.createInternalBindingContext(table);
    MacrosDelegateUtil.setCachedProperties(table, properties);
    table.getBindingContext("internal").setProperty("tablePropertiesAvailable", true);
    return properties;
  };
  ODataTableDelegate.createInternalBindingContext = function (table) {
    let dialog = table;
    while (dialog && !dialog.isA("sap.ui.mdc.valuehelp.Dialog")) {
      dialog = dialog.getParent();
    }
    const internalModel = table.getModel("internal");
    if (dialog && internalModel) {
      const internalBindingContext = dialog.getBindingContext("internal");
      let newInternalBindingContextPath;
      if (internalBindingContext) {
        newInternalBindingContextPath = internalBindingContext.getPath() + `::VHDialog::${dialog.getId()}::table`;
      } else {
        newInternalBindingContextPath = `/buildingblocks/${table.getId()}`;
        internalModel.setProperty("/buildingblocks", {
          ...internalModel.getProperty("/buildingblocks")
        });
      }
      const newInternalBindingContext = internalModel.bindContext(newInternalBindingContextPath).getBoundContext();
      table.setBindingContext(newInternalBindingContext, "internal");
    }
  };

  /**
   * Collect related properties from a property's annotations.
   * @param dataModelPropertyPath The model object path of the property.
   * @returns The related properties that were identified.
   * @private
   */
  function collectRelatedProperties(dataModelPropertyPath) {
    const dataModelAdditionalPropertyPath = getAdditionalProperty(dataModelPropertyPath);
    const relatedProperties = {};
    if (dataModelAdditionalPropertyPath?.targetObject) {
      const additionalProperty = dataModelAdditionalPropertyPath.targetObject;
      const additionalPropertyPath = getTargetObjectPath(dataModelAdditionalPropertyPath, true);
      const property = dataModelPropertyPath.targetObject;
      const propertyPath = getTargetObjectPath(dataModelPropertyPath, true);
      const textAnnotation = property.annotations?.Common?.Text,
        textArrangement = textAnnotation?.annotations?.UI?.TextArrangement?.toString(),
        displayMode = textAnnotation && textArrangement && getDisplayMode(property);
      if (displayMode === "Description") {
        relatedProperties[additionalPropertyPath] = additionalProperty;
      } else if (displayMode && displayMode !== "Value" || !textAnnotation) {
        relatedProperties[propertyPath] = property;
        relatedProperties[additionalPropertyPath] = additionalProperty;
      }
    }
    return relatedProperties;
  }
  ODataTableDelegate._createPropertyInfos = async function (table, model) {
    const metadataInfo = table.getDelegate().payload;
    const properties = [];
    const entitySetPath = `/${metadataInfo.collectionName}`;
    const metaModel = model.getMetaModel();
    return metaModel.requestObject(`${entitySetPath}@`).then(function (entitySetAnnotations) {
      const sortRestrictionsInfo = getSortRestrictionsInfo(entitySetAnnotations);
      const filterRestrictions = entitySetAnnotations["@Org.OData.Capabilities.V1.FilterRestrictions"];
      const filterRestrictionsInfo = getFilterRestrictionsInfo(filterRestrictions);
      const filterFunctions = entitySetAnnotations["@Org.OData.Capabilities.V1.FilterFunctions"];
      const caseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel, filterFunctions);
      const customDataForColumns = MacrosDelegateUtil.getCustomData(table, "columns");
      const propertiesToBeCreated = {};
      const dataModelEntityPath = getInvolvedDataModelObjects(table.getModel().getMetaModel().getContext(entitySetPath));
      customDataForColumns.customData.forEach(function (columnDef) {
        let typeConfig = isTypeFilterable(columnDef.$Type) ? table.getTypeMap().getTypeConfig(columnDef.$Type) : TypeMap.getTypeConfig("sap.ui.model.odata.type.String");
        const propertyInfo = {
          key: columnDef.path,
          label: columnDef.label
        };
        const dataModelPropertyPath = enhanceDataModelPath(dataModelEntityPath, columnDef.path);
        const property = dataModelPropertyPath.targetObject;
        if (property) {
          const targetPropertyPath = getTargetObjectPath(dataModelPropertyPath, true);
          if (isTypeFilterable(property.type)) {
            const propertyTypeConfig = fetchTypeConfig(property);
            typeConfig = TypeMap.getTypeConfig(propertyTypeConfig.type ?? "sap.ui.model.odata.type.String", propertyTypeConfig.formatOptions, propertyTypeConfig.constraints) ?? typeConfig;
          }
          //Check if there is an additional property linked to the property as a Unit, Currency, Timezone or textArrangement
          const relatedPropertiesInfo = collectRelatedProperties(dataModelPropertyPath);
          const relatedPropertyPaths = Object.keys(relatedPropertiesInfo);
          if (relatedPropertyPaths.length) {
            propertyInfo.propertyInfos = relatedPropertyPaths;
            // Collect information of related columns to be created.
            relatedPropertyPaths.forEach(path => {
              propertiesToBeCreated[path] = relatedPropertiesInfo[path];
            });
            // Also add property for the inOut Parameters on the ValueHelp when textArrangement is set to #TextOnly
            // It will not be linked to the complex Property (BCP 2270141154)
            if (!relatedPropertyPaths.find(path => relatedPropertiesInfo[path] === property)) {
              propertiesToBeCreated[targetPropertyPath] = property;
            }
          } else {
            propertyInfo.path = columnDef.path;
            propertyInfo.dataType = typeConfig.className;
            propertyInfo.constraints = typeConfig.typeInstance?.oConstraints;
            propertyInfo.formatOptions = typeConfig.typeInstance?.oFormatOptions;
            propertyInfo.sortable = isSortableProperty(sortRestrictionsInfo, columnDef);
            propertyInfo.filterable = isFilterableProperty(filterRestrictionsInfo, columnDef);
            propertyInfo.maxConditions = getPropertyMaxConditions(filterRestrictionsInfo, columnDef);
            propertyInfo.caseSensitive = caseSensitive;
          }
        } else {
          propertyInfo.path = columnDef.path;
          propertyInfo.caseSensitive = caseSensitive;
          propertyInfo.dataType = typeConfig.className;
        }
        properties.push(propertyInfo);
      });
      const relatedColumns = createRelatedProperties(propertiesToBeCreated, properties, sortRestrictionsInfo, filterRestrictionsInfo, caseSensitive);
      return properties.concat(relatedColumns);
    });
  };

  /**
   * Updates the binding info with the relevant path and model from the metadata.
   * @param mdcTable The MDCTable instance
   * @param bindingInfo The bindingInfo of the table
   */
  ODataTableDelegate.updateBindingInfo = function (mdcTable, bindingInfo) {
    TableDelegate.updateBindingInfo.apply(this, [mdcTable, bindingInfo]);
    const metadataInfo = mdcTable.getDelegate().payload;
    if (metadataInfo) {
      bindingInfo.path = bindingInfo?.path || metadataInfo.collectionPath || `/${metadataInfo.collectionName}`;
    }
    bindingInfo.parameters = bindingInfo.parameters || {};
    const filterBar = Element.getElementById(mdcTable.getFilter()),
      isFilterEnabled = mdcTable.isFilteringEnabled();
    let conditions;
    let innerFilterInfo, outerFilterInfo;
    const filters = [];
    const tableProperties = MacrosDelegateUtil.getCachedProperties(mdcTable);

    //TODO: consider a mechanism ('FilterMergeUtil' or enhance 'FilterUtil') to allow the connection between different filters)
    if (isFilterEnabled) {
      conditions = mdcTable.getConditions();
      innerFilterInfo = FilterUtil.getFilterInfo(mdcTable, conditions, tableProperties, []);
      if (innerFilterInfo.filters) {
        filters.push(innerFilterInfo.filters);
      }
    }
    const isTreeTable = !!metadataInfo?.hierarchyQualifier;
    if (isTreeTable) {
      bindingInfo.parameters.$$aggregation = {
        hierarchyQualifier: metadataInfo.hierarchyQualifier,
        expandTo: metadataInfo.initialExpansionLevel
      };
    }
    if (filterBar) {
      conditions = filterBar.getConditions();
      if (conditions) {
        const parameterNames = DelegateUtil.getParameterNames(filterBar);
        // The table properties needs to updated with the filter field if no Selectionfields are annotated and not part as value help parameter
        ODataTableDelegate._updatePropertyInfo(tableProperties, mdcTable, conditions, metadataInfo);
        outerFilterInfo = FilterUtil.getFilterInfo(filterBar, conditions, tableProperties, parameterNames);
        if (outerFilterInfo.filters) {
          filters.push(outerFilterInfo.filters);
        }
        const parameterPath = DelegateUtil.getParametersInfo(filterBar, conditions);
        if (parameterPath) {
          bindingInfo.path = parameterPath;
        }
      }
      if (!isTreeTable) {
        // get the basic search
        bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterBar.getSearch()) || undefined;
      } else if (filterBar.getSearch()) {
        if (!bindingInfo.parameters.$$aggregation) {
          bindingInfo.parameters.$$aggregation = {};
        }
        bindingInfo.parameters.$$aggregation.search = CommonUtils.normalizeSearchTerm(filterBar.getSearch());
        bindingInfo.parameters.$$aggregation.expandTo = Number.MAX_SAFE_INTEGER;
      }
    }
    // BCP: 2370078660 - sharedRequest is set to false in order to avoid deadlock situation where the the oData
    // model cache is neither changeable (result of ListBinding.$$sharedRequest = true) nor deletable
    // (result of Context.setSelected(true) -> ListBinding.keepAlive)
    bindingInfo.parameters.$$sharedRequest = false;
    this._applyDefaultSorting(bindingInfo, mdcTable.getDelegate().payload);
    // add select to bindingInfo (BCP 2170163012)
    bindingInfo.parameters.$select = tableProperties?.reduce(function (query, property) {
      // Navigation properties (represented by X/Y) should not be added to $select.
      // ToDo : They should be added as $expand=X($select=Y) instead
      if (property.path && !property.path.includes("/")) {
        query = query ? `${query},${property.path}` : property.path;
      }
      return query;
    }, "");

    // Add $count
    bindingInfo.parameters.$count = true;

    //If the entity is DraftEnabled add a DraftFilter
    if (bindingInfo.path && ModelHelper.isDraftSupported(mdcTable.getModel()?.getMetaModel(), bindingInfo.path)) {
      filters.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
    }
    bindingInfo.filters = new Filter(filters, true);
  };
  ODataTableDelegate.getTypeMap = function () {
    return TypeMap;
  };

  /**
   * Get table Model.
   * @param table Instance of the MDCtable
   * @returns Model
   */
  ODataTableDelegate._getModel = async function (table) {
    const metadataInfo = table.getDelegate().payload;
    let model = table.getModel(metadataInfo.model);
    if (!model) {
      await new Promise(resolve => {
        table.attachEventOnce("modelContextChange", resolve);
      });
      model = table.getModel(metadataInfo.model);
    }
    return model;
  };

  /**
   * Applies a default sort order if needed. This is only the case if the request is not a $search request
   * (means the parameter $search of the bindingInfo is undefined) and if a sort order has not been set already,
   * for example, using a presentation variant or manually set by the user.
   * @param bindingInfo The bindingInfo of the table
   * @param payload The payload of the TableDelegate
   */
  ODataTableDelegate._applyDefaultSorting = function (bindingInfo, payload) {
    if (bindingInfo.parameters && bindingInfo.parameters.$search == undefined && bindingInfo.parameters.$$aggregation?.search == undefined && bindingInfo.sorter && bindingInfo.sorter.length == 0) {
      const defaultSortPropertyName = payload ? payload.defaultSortPropertyName : undefined;
      if (defaultSortPropertyName) {
        bindingInfo.sorter.push(new Sorter(defaultSortPropertyName, false));
      }
    }
  };

  /**
   * Updates the table properties with filter field infos.
   * @param aTableProperties Array with table properties
   * @param oMDCTable The MDCTable instance
   * @param mConditions The conditions of the table
   * @param oMetadataInfo The metadata info of the filter field
   */
  ODataTableDelegate._updatePropertyInfo = function (aTableProperties, oMDCTable, mConditions, oMetadataInfo) {
    const aConditionKey = Object.keys(mConditions),
      oMetaModel = oMDCTable.getModel().getMetaModel();
    aConditionKey.forEach(function (conditionKey) {
      // The typeConfig is not set in the table propertyInfos, but we need to set it for the filter fields
      const conditionKeyType = oMetaModel.getObject(`/${oMetadataInfo.collectionName}/${conditionKey}`)?.$Type ?? "Edm.String";
      const typeConfig = oMDCTable.getTypeMap().getTypeConfig(conditionKeyType);
      aTableProperties.forEach((tableProperty, index) => {
        if (tableProperty.path === conditionKey) {
          aTableProperties[index].typeConfig = typeConfig;
        }
      });
      if (aTableProperties.findIndex(function (tableProperty) {
        return tableProperty.path === conditionKey;
      }) === -1) {
        const oColumnDef = {
          key: conditionKey,
          label: conditionKey,
          path: conditionKey,
          dataType: typeConfig.typeInstance.baseType,
          formatOptions: typeConfig.typeInstance?.oFormatOptions,
          constraints: typeConfig.typeInstance?.oConstraints
        };
        aTableProperties.push(oColumnDef);
      }
    });
  };
  ODataTableDelegate.updateBinding = function (oTable, oBindingInfo, oBinding) {
    let bNeedManualRefresh = false;
    const oInternalBindingContext = oTable.getBindingContext("internal");
    const sManualUpdatePropertyKey = "pendingManualBindingUpdate";
    const sLastSearch = "lastSearch";
    const sLastFilter = "lastFilter";
    const bPendingManualUpdate = oInternalBindingContext?.getProperty(sManualUpdatePropertyKey);
    const lastSearch = oInternalBindingContext?.getProperty(sLastSearch);
    const lastFilter = oInternalBindingContext?.getProperty(sLastFilter);
    let oRowBinding = oTable.getRowBinding();

    //oBinding=null means that a rebinding needs to be forced via updateBinding in mdc TableDelegate
    TableDelegate.updateBinding.apply(ODataTableDelegate, [oTable, oBindingInfo, oBinding]);
    //get row binding after rebind from TableDelegate.updateBinding in case oBinding was null
    if (!oRowBinding) {
      oRowBinding = oTable.getRowBinding();
    }
    if (oRowBinding) {
      /**
       * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
       * is not enough to trigger a batch request.
       * In case there is no internalBindingContext (see BCP 2280161524) we can not determine if a manual
       * refresh is needed or not. Therefore, we always refresh in this special case
       */
      bNeedManualRefresh = oInternalBindingContext ? deepEqual(oBindingInfo.filters, lastFilter) && oBindingInfo.parameters?.$search === lastSearch && !bPendingManualUpdate : true;
    }
    oInternalBindingContext?.setProperty(sLastSearch, oBindingInfo.parameters?.$search);
    oInternalBindingContext?.setProperty(sLastFilter, oBindingInfo.filters);
    if (bNeedManualRefresh && oTable.getFilter()) {
      oInternalBindingContext?.setProperty(sManualUpdatePropertyKey, true);
      oRowBinding.requestRefresh(oRowBinding.getGroupId()).finally(function () {
        oInternalBindingContext?.setProperty(sManualUpdatePropertyKey, false);
      }).catch(function (oError) {
        Log.error("Error while refreshing a filterBar VH table", oError);
      });
    }
    oTable.fireEvent("bindingUpdated");
    //no need to check for semantic targets here since we are in a VH and don't want to allow further navigation
  };

  /**
   * Creates a simple property for each identified complex property.
   * @param propertiesToBeCreated Identified properties.
   * @param existingColumns The list of columns created for properties defined on the Value List.
   * @param sortRestrictionsInfo An object containing the sort restriction information
   * @param filterRestrictionsInfo An object containing the filter restriction information
   * @returns The array of properties created.
   * @private
   */
  function createRelatedProperties(propertiesToBeCreated, existingColumns, sortRestrictionsInfo, filterRestrictionsInfo, caseSensitive) {
    const relatedPropertyNameMap = {},
      relatedColumns = [];
    Object.keys(propertiesToBeCreated).forEach(path => {
      const property = propertiesToBeCreated[path],
        relatedColumn = existingColumns.find(column => column.path === path); // Complex properties doesn't have path so only simple column are found
      if (!relatedColumn) {
        const newName = `Property::${path}`;
        relatedPropertyNameMap[path] = newName;
        const propertyTypeConfig = fetchTypeConfig(property);
        const valueHelpColumnTypeConfig = TypeMap.getTypeConfig(propertyTypeConfig.type ?? "sap.ui.model.odata.type.String", propertyTypeConfig.formatOptions, propertyTypeConfig.constraints);
        const valueHelpTableColumn = {
          key: newName,
          label: getLabel(property),
          path,
          sortable: isSortableProperty(sortRestrictionsInfo, property),
          filterable: isFilterableProperty(filterRestrictionsInfo, property),
          dataType: valueHelpColumnTypeConfig.className,
          formatOptions: isTypeFilterable(property.type) ? valueHelpColumnTypeConfig.typeInstance?.oFormatOptions : undefined,
          constraints: isTypeFilterable(property.type) ? valueHelpColumnTypeConfig.typeInstance?.oConstraints : undefined,
          caseSensitive
        };
        valueHelpTableColumn.maxConditions = getPropertyMaxConditions(filterRestrictionsInfo, valueHelpTableColumn);
        relatedColumns.push(valueHelpTableColumn);
      }
    });
    // The property 'key' has been prefixed with 'Property::' for uniqueness.
    // Update the same in other propertyInfos[] references which point to this property.
    existingColumns.forEach(column => {
      if (column.propertyInfos) {
        column.propertyInfos = column.propertyInfos?.map(columnName => relatedPropertyNameMap[columnName] ?? columnName);
      }
    });
    return relatedColumns;
  }

  /**
   * Identifies the maxConditions for a given property.
   * @param filterRestrictionsInfo The filter restriction information from the restriction annotation.
   * @param property The target property.
   * @returns `-1` or `1` if the property is a MultiValueFilterExpression.
   * @private
   */

  function getPropertyMaxConditions(filterRestrictionsInfo, property) {
    const propertyPath = getPath(property);
    return propertyPath && filterRestrictionsInfo.propertyInfo?.hasOwnProperty(propertyPath) && isMultiValueFilterExpression(filterRestrictionsInfo.propertyInfo[propertyPath]) ? -1 : 1;
  }

  /**
   * Identifies the additional property which references to the unit, timezone, textArrangement or currency.
   * @param dataModelPropertyPath The model object path of the property.
   * @returns The additional property.
   * @private
   */
  function getAdditionalProperty(dataModelPropertyPath) {
    const property = dataModelPropertyPath.targetObject;
    const additionalPropertyPath = property && (getAssociatedTextPropertyPath(property) || getAssociatedCurrencyPropertyPath(property) || getAssociatedUnitPropertyPath(property) || getAssociatedTimezonePropertyPath(property));
    if (!additionalPropertyPath) {
      return undefined;
    }
    const dataModelAdditionalProperty = enhanceDataModelPath(dataModelPropertyPath, additionalPropertyPath);

    //Additional Property could refer to a navigation property, keep the key and path as navigation property
    const additionalProperty = dataModelAdditionalProperty.targetObject;
    if (!additionalProperty) {
      return undefined;
    }
    return dataModelAdditionalProperty;
  }
  return ODataTableDelegate;
}, false);
//# sourceMappingURL=TableDelegate-dbg.js.map

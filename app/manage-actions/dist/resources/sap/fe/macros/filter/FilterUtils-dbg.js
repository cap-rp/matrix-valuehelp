/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/filterBar/SemanticDateOperators", "sap/ui/core/Element", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/condition/ConditionConverter", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/mdc/p13n/StateUtil", "sap/ui/mdc/util/FilterUtil", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/odata/v4/ODataUtils", "../filterBar/DraftEditState"], function (Log, merge, CommonUtils, ConverterContext, ManifestWrapper, MetaModelConverter, FilterBarConverter, MetaModelFunction, ModelHelper, DisplayModeFormatter, CommonHelper, DelegateUtil, SemanticDateOperators, Element, Condition, ConditionConverter, ConditionValidated, TypeMap, StateUtil, FilterUtil, Filter, FilterOperator, ODataUtils, EDITSTATE) {
  "use strict";

  var ODATA_TYPE_MAPPING = DisplayModeFormatter.ODATA_TYPE_MAPPING;
  var getAllCustomAggregates = MetaModelFunction.getAllCustomAggregates;
  var PropertyInfoKeys = /*#__PURE__*/function (PropertyInfoKeys) {
    PropertyInfoKeys["hiddenFilter"] = "hiddenFilter";
    PropertyInfoKeys["required"] = "required";
    PropertyInfoKeys["path"] = "path";
    PropertyInfoKeys["tooltip"] = "tooltip";
    PropertyInfoKeys["visible"] = "visible";
    PropertyInfoKeys["maxConditions"] = "maxConditions";
    PropertyInfoKeys["formatOptions"] = "formatOptions";
    PropertyInfoKeys["constraints"] = "constraints";
    PropertyInfoKeys["group"] = "group";
    PropertyInfoKeys["groupLabel"] = "groupLabel";
    PropertyInfoKeys["caseSensitive"] = "caseSensitive";
    return PropertyInfoKeys;
  }(PropertyInfoKeys || {});
  const oFilterUtils = {
    getFilter: function (vIFilter) {
      const aFilters = oFilterUtils.getFilterInfo(vIFilter).filters;
      return aFilters?.length ? new Filter(aFilters, false) : undefined;
    },
    getFilterField: function (propertyPath, converterContext, entityType) {
      return FilterBarConverter.getFilterField(propertyPath, converterContext, entityType);
    },
    buildProperyInfo: function (propertyInfoField, converterContext) {
      let oPropertyInfo;
      const aTypeConfig = {};
      const propertyConvertyContext = converterContext.getConverterContextFor(propertyInfoField.annotationPath);
      const propertyTargetObject = propertyConvertyContext.getDataModelObjectPath().targetObject;
      const oTypeConfig = FilterBarConverter.fetchTypeConfig(propertyTargetObject);
      oPropertyInfo = FilterBarConverter.fetchPropertyInfo(converterContext, propertyInfoField, oTypeConfig);
      aTypeConfig[propertyInfoField.key] = oTypeConfig;
      oPropertyInfo = FilterBarConverter.assignDataTypeToPropertyInfo(oPropertyInfo, converterContext, [], aTypeConfig);
      return oPropertyInfo;
    },
    createConverterContext: function (oFilterControl, sEntityTypePath, metaModel, appComponent) {
      const sFilterEntityTypePath = DelegateUtil.getCustomData(oFilterControl, "entityType"),
        contextPath = sEntityTypePath || sFilterEntityTypePath;
      const oView = oFilterControl.isA ? CommonUtils.getTargetView(oFilterControl) : null;
      const oMetaModel = metaModel || oFilterControl.getModel().getMetaModel();
      const oAppComponent = appComponent || oView && CommonUtils.getAppComponent(oView);
      const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath));
      let manifestSettings;
      if (oFilterControl.isA && !oFilterControl.isA("sap.ui.mdc.valuehelp.FilterBar")) {
        manifestSettings = oView && oView.getViewData() || {};
      }
      return ConverterContext.createConverterContextForMacro(oVisualizationObjectPath.startingEntitySet.name, oMetaModel, oAppComponent?.getDiagnostics(), merge, oVisualizationObjectPath.contextLocation, new ManifestWrapper(manifestSettings ?? {}));
    },
    getConvertedFilterFields: function (oFilterControl, sEntityTypePath, includeHidden, metaModel, appComponent, oModifier, lineItemTerm) {
      const oMetaModel = this._getFilterMetaModel(oFilterControl, metaModel);
      const sFilterEntityTypePath = DelegateUtil.getCustomData(oFilterControl, "entityType");
      const annotationPath = DelegateUtil.getCustomData(oFilterControl, "annotationPath"),
        contextPath = sEntityTypePath || sFilterEntityTypePath;
      const lrTables = this._getFieldsForTable(oFilterControl, sEntityTypePath);
      const oConverterContext = this.createConverterContext(oFilterControl, sEntityTypePath, metaModel, appComponent);

      //aSelectionFields = FilterBarConverter.getSelectionFields(oConverterContext);
      return this._getSelectionFields(oFilterControl, sEntityTypePath, sFilterEntityTypePath, contextPath, lrTables, oMetaModel, oConverterContext, includeHidden, oModifier, lineItemTerm, annotationPath);
    },
    getBindingPathForParameters: function (oIFilter, mConditions, aFilterPropertiesMetadata, aParameters) {
      const aParams = [];
      aFilterPropertiesMetadata = oFilterUtils.setTypeConfigToProperties(aFilterPropertiesMetadata);
      // Collecting all parameter values from conditions
      for (const sFieldPath of aParameters) {
        if (mConditions[sFieldPath] && mConditions[sFieldPath].length > 0) {
          // We would be using only the first condition for parameter value.
          const oConditionInternal = merge({}, mConditions[sFieldPath][0]);
          const oProperty = FilterUtil.getPropertyByKey(aFilterPropertiesMetadata, sFieldPath);
          const oTypeConfig = oProperty.typeConfig || TypeMap.getTypeConfig(oProperty.dataType, oProperty.formatOptions, oProperty.constraints);
          const mInternalParameterCondition = ConditionConverter.toType(oConditionInternal, oTypeConfig, oIFilter.getTypeMap());
          const sEdmType = ODATA_TYPE_MAPPING[oTypeConfig.className];
          aParams.push(`${sFieldPath}=${encodeURIComponent(ODataUtils.formatLiteral(mInternalParameterCondition.values[0], sEdmType))}`);
        }
      }

      // Binding path from EntityType
      const sEntityTypePath = oIFilter.data("entityType");
      const sEntitySetPath = sEntityTypePath.substring(0, sEntityTypePath.length - 1);
      const sParameterEntitySet = sEntitySetPath.slice(0, sEntitySetPath.lastIndexOf("/"));
      const sTargetNavigation = sEntitySetPath.substring(sEntitySetPath.lastIndexOf("/") + 1);
      // create parameter context
      return `${sParameterEntitySet}(${aParams.toString()})/${sTargetNavigation}`;
    },
    getEditStateIsHideDraft: function (mConditions) {
      let bIsHideDraft = false;
      if (mConditions && mConditions.$editState) {
        const oCondition = mConditions.$editState.find(function (condition) {
          return condition.operator === "DRAFT_EDIT_STATE";
        });
        if (oCondition && (oCondition.values.includes("ALL_HIDING_DRAFTS") || oCondition.values.includes("SAVED_ONLY"))) {
          bIsHideDraft = true;
        }
      }
      return bIsHideDraft;
    },
    /**
     * Gets all filters that originate from the MDC FilterBar.
     * @param vIFilter String or object instance related to MDC_FilterBar/Table/Chart
     * @param mProperties Properties on filters that are to be retrieved. Available parameters:
     * @param mProperties.ignoredProperties Array of property names which should be not considered for filtering
     * @param mProperties.propertiesMetadata Array with all the property metadata. If not provided, properties will be retrieved from vIFilter.
     * @param mProperties.targetControl MDC_table or chart. If provided, property names which are not relevant for the target control entitySet are not considered.
     * @param mFilterConditions Map with externalized filter conditions.
     * @returns FilterBar filters and basic search
     * @private
     */
    getFilterInfo: function (vIFilter, mProperties, mFilterConditions) {
      let aIgnoreProperties = mProperties && mProperties.ignoredProperties || [];
      const oTargetControl = mProperties && mProperties.targetControl,
        sTargetEntityPath = oTargetControl ? oTargetControl.data("entityType") : undefined;
      const mParameters = {};
      let oIFilter = vIFilter,
        sSearch,
        aFilters = [],
        sBindingPath,
        aPropertiesMetadata = mProperties && mProperties.propertiesMetadata;
      if (typeof vIFilter === "string") {
        oIFilter = Element.getElementById(vIFilter);
      }
      if (oIFilter) {
        sSearch = this._getSearchField(oIFilter, aIgnoreProperties);
        const mConditions = this._getFilterConditions(mProperties, mFilterConditions, oIFilter);
        let aFilterPropertiesMetadata;
        if (oIFilter.isA("sap.ui.mdc.FilterBar")) {
          aFilterPropertiesMetadata = this.getFilterPropertyInfo(oIFilter);
        } else {
          aFilterPropertiesMetadata = oIFilter.getPropertyInfoSet ? oIFilter.getPropertyInfoSet() : null;
        }
        aFilterPropertiesMetadata = this._getFilterPropertiesMetadata(aFilterPropertiesMetadata, oIFilter);
        if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
          Object.keys(mConditions).forEach(function (sKey) {
            if (sKey === "$editState") {
              delete mConditions["$editState"];
            }
          });
        }
        let aParameters = oIFilter.data("parameters") || [];
        aParameters = typeof aParameters === "string" ? JSON.parse(aParameters) : aParameters;
        if (aParameters && aParameters.length > 0) {
          // Binding path changes in case of parameters.
          sBindingPath = oFilterUtils.getBindingPathForParameters(oIFilter, mConditions, aFilterPropertiesMetadata, aParameters);
          if (Object.keys(mConditions).length) {
            Object.keys(mConditions).forEach(param => {
              aParameters.forEach(requiredParam => {
                if (param === requiredParam) {
                  const mParametersValue = mConditions[param][0].values;
                  mParameters[requiredParam] = mParametersValue[0];
                }
              });
            });
          }
        }
        if (mConditions) {
          //Exclude Interface Filter properties that are not relevant for the Target control entitySet
          if (sTargetEntityPath && oIFilter.data("entityType") && oIFilter.data("entityType") !== sTargetEntityPath) {
            const oMetaModel = oIFilter.getModel().getMetaModel();
            const aTargetPropertiesMetadata = oIFilter.getControlDelegate?.().fetchPropertiesForEntity(sTargetEntityPath, oMetaModel, oIFilter);
            aPropertiesMetadata = aTargetPropertiesMetadata;
            const _aIgnoreProperties = this._getIgnoredProperties(aFilterPropertiesMetadata, aTargetPropertiesMetadata);
            if (_aIgnoreProperties.length > 0) {
              aIgnoreProperties = aIgnoreProperties.concat(_aIgnoreProperties);
            }
          } else if (!aPropertiesMetadata && aFilterPropertiesMetadata) {
            aPropertiesMetadata = aFilterPropertiesMetadata;
          }
          // var aParamKeys = [];
          // aParameters.forEach(function (oParam) {
          // 	aParamKeys.push(oParam.key);
          // });
          aFilters = this.getEditStateAndFilter({
            oIFilter,
            mConditions,
            aPropertiesMetadata,
            aIgnoreProperties,
            aParameters
          });
        }
      }
      return {
        parameters: mParameters,
        filters: aFilters,
        search: sSearch || undefined,
        bindingPath: sBindingPath
      };
    },
    /**
     * Gets the Filter params taking in consideration the Editing Status field,
     * merges/overrides the data that's coming from FilterUtil.getFilterInfo, and,
     * returns a mapped data to be sent to the backend.
     * @param param Object
     * @param param.oIFilter Object FilterBar instance
     * @param param.mConditions Object Conditions that comes from the Filter Fields
     * @param param.aPropertiesMetadata Array Filter metadata
     * @param param.aIgnoreProperties Array of strings with the field keys which need to be ignored
     * @param param.aParameters Array URL params that also need to be ignore and are merged into the aIgnoreProperties
     * @returns FilterBar filters array
     */
    getEditStateAndFilter: function (_ref) {
      let {
        oIFilter,
        mConditions,
        aPropertiesMetadata,
        aIgnoreProperties,
        aParameters
      } = _ref;
      const oFilter = FilterUtil.getFilterInfo(oIFilter, mConditions, oFilterUtils.setTypeConfigToProperties(aPropertiesMetadata), aIgnoreProperties.concat(aParameters)).filters;
      const currState = oIFilter?.getCurrentState?.();
      const hasEditStateFieldVisible = currState?.items?.some(cs => cs?.key === "$editState");
      const hasEditStateMetadata = Array.isArray(aPropertiesMetadata) && aPropertiesMetadata?.some(cs => cs?.key === "$editState");
      let editStateFilter;
      if (!aIgnoreProperties.includes("$editState") && hasEditStateFieldVisible === true && hasEditStateMetadata) {
        if (mConditions.hasOwnProperty("$editState")) {
          const editStateValue = mConditions["$editState"];
          editStateFilter = EDITSTATE.getFilterForEditState(editStateValue?.[0]?.values?.[0]);
        } else {
          editStateFilter = EDITSTATE.getFilterForEditState("");
        }
      }
      let aFilters = oFilter ? [oFilter] : [];
      if (editStateFilter) {
        const hasEditStateFilter = this.hasEditStateFilterRecursively(aFilters);
        if (hasEditStateFilter) {
          aFilters = this.exchangeEditStateFilterRecursively(editStateFilter, aFilters);
        } else {
          aFilters.push(editStateFilter);
        }
      }
      return aFilters;
    },
    hasEditStateFilterRecursively: function (filters) {
      return filters.some(filter => {
        if (filter.getPath() === "$editState") {
          return true;
        } else if (filter.getFilters() !== undefined) {
          return this.hasEditStateFilterRecursively(filter.getFilters());
        } else {
          return false;
        }
      });
    },
    exchangeEditStateFilterRecursively: function (editStateFilter, filters) {
      return filters.map(filter => {
        if (filter.getPath() === "$editState") {
          return editStateFilter;
        } else if (filter.getFilters() !== undefined) {
          filter = new Filter({
            filters: this.exchangeEditStateFilterRecursively(editStateFilter, filter.getFilters()),
            and: filter.isAnd()
          });
          return filter;
        }
        return filter;
      });
    },
    setTypeConfigToProperties: function (aProperties) {
      if (aProperties && aProperties.length) {
        aProperties.forEach(function (oIFilterProperty) {
          if (oIFilterProperty.typeConfig && oIFilterProperty.typeConfig.typeInstance && oIFilterProperty.typeConfig.typeInstance.getConstraints instanceof Function) {
            return;
          }
          if (oIFilterProperty.path === "$editState") {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
          } else if (oIFilterProperty.path === "$search") {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
          } else if (oIFilterProperty.dataType || oIFilterProperty.typeConfig && oIFilterProperty.typeConfig.className) {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig(oIFilterProperty.dataType || oIFilterProperty.typeConfig?.className, oIFilterProperty.formatOptions, oIFilterProperty.constraints);
          }
        });
      }
      return aProperties;
    },
    getNotApplicableFilters: function (oFilterBar, oControl) {
      const sTargetEntityTypePath = oControl.data("entityType"),
        oFilterBarEntityPath = oFilterBar.data("entityType"),
        oMetaModel = oFilterBar.getModel().getMetaModel(),
        oFilterBarEntitySetAnnotations = oMetaModel.getObject(oFilterBarEntityPath),
        aNotApplicable = [],
        mConditions = oFilterBar.getConditions(),
        bIsFilterBarEntityType = sTargetEntityTypePath === oFilterBarEntityPath,
        bIsChart = oControl.isA("sap.ui.mdc.Chart"),
        bIsAnalyticalTable = !bIsChart && oControl.getParent().getTableDefinition().enableAnalytics,
        bIsTreeTable = !bIsChart && oControl.getParent().getTableDefinition().control.type === "TreeTable",
        bEnableSearch = bIsChart ? CommonHelper.parseCustomData(DelegateUtil.getCustomData(oControl, "applySupported")).enableSearch : !(bIsAnalyticalTable || bIsTreeTable) || oControl.getParent().getTableDefinition().enableBasicSearch;
      if (mConditions && (!bIsFilterBarEntityType || bIsAnalyticalTable || bIsChart || bIsTreeTable)) {
        // We don't need to calculate the difference on property Level if entity sets are identical
        const aTargetProperties = bIsFilterBarEntityType ? [] : oFilterBar.getControlDelegate().fetchPropertiesForEntity(sTargetEntityTypePath, oMetaModel, oFilterBar),
          mTargetProperties = aTargetProperties.reduce(function (mProp, oProp) {
            mProp[oProp.name] = oProp;
            return mProp;
          }, {}),
          mAggregatedProperties = {};
        const chartEntityTypeAnnotations = oControl.getModel().getMetaModel().getObject(oControl.data("targetCollectionPath") + "/");
        if (oControl.isA("sap.ui.mdc.Chart")) {
          const oEntitySetAnnotations = oControl.getModel().getMetaModel().getObject(`${oControl.data("targetCollectionPath")}@`),
            mChartCustomAggregates = getAllCustomAggregates(oEntitySetAnnotations);
          Object.keys(mChartCustomAggregates).forEach(function (sAggregateName) {
            if (!mAggregatedProperties[sAggregateName]) {
              const oAggregate = mChartCustomAggregates[sAggregateName];
              mAggregatedProperties[sAggregateName] = oAggregate;
            }
          });
        }
        for (const sProperty in mConditions) {
          // Need to check the length of mConditions[sProperty] since previous filtered properties are kept into mConditions with empty array as definition
          const aConditionProperty = mConditions[sProperty];
          let typeCheck = true;
          if (chartEntityTypeAnnotations[sProperty] && oFilterBarEntitySetAnnotations[sProperty]) {
            typeCheck = chartEntityTypeAnnotations[sProperty]["$Type"] === oFilterBarEntitySetAnnotations[sProperty]["$Type"];
          }
          if (Array.isArray(aConditionProperty) && aConditionProperty.length > 0 && (
          //has a filter value
          (!mTargetProperties[sProperty] ||
          // no target property found by property name
          mTargetProperties[sProperty].isCustomFilter && mTargetProperties[sProperty].annotationPath == undefined ||
          // custom filter that is not part of the current entitySet
          mTargetProperties[sProperty] && !typeCheck) && (!bIsFilterBarEntityType || sProperty === "$editState" && (bIsChart || bIsTreeTable || bIsAnalyticalTable)) ||
          //type does not match OR $editState on secondary entity set
          mAggregatedProperties[sProperty])) {
            aNotApplicable.push(sProperty.replace(/[+|*]/g, ""));
          }
        }
      }
      if (!bEnableSearch && oFilterBar.getSearch()) {
        aNotApplicable.push("$search");
      }
      return aNotApplicable;
    },
    /**
     * Gets the value list information of a property as defined for a given filter bar.
     * @param filterBar The filter bar to get the value list information for
     * @param propertyName The property to get the value list information for
     * @returns The value list information
     */
    async _getValueListInfo(filterBar, propertyName) {
      const metaModel = filterBar.getModel()?.getMetaModel();
      if (!metaModel) {
        return undefined;
      }
      const entityType = filterBar.data("entityType") ?? "";
      const valueListInfos = await metaModel.requestValueListInfo(entityType + propertyName, true).catch(() => null);
      return valueListInfos?.[""];
    },
    /**
     * Gets the value list of all the filter properties.
     * @param filterBar Instance of FilterBar
     * @returns Array of filter properties for FilterBar
     */
    getFilterPropertyInfo(filterBar) {
      let _propertyInfo = filterBar.data("feFilterInfo");
      if (typeof _propertyInfo === "string") {
        _propertyInfo = JSON.parse(_propertyInfo);
      }
      return _propertyInfo || [];
    },
    /**
     * Gets the {@link ConditionValidated} state for a single value. This decides whether the value is treated as a selected value
     * in a value help, meaning that its description is loaded and displayed if existing, or whether it is displayed as a
     * condition (e.g. "=1").
     *
     * Values for properties without value list info are always treated as {@link ConditionValidated.NotValidated}.
     * @param valueListInfo The value list info from the {@link MetaModel}
     * @param conditionPath Path to the property to set the value as condition for
     * @param value The single value to get the state for
     * @returns The {@link ConditionValidated} state for the value
     */
    _getConditionValidated: async function (valueListInfo, conditionPath, value) {
      if (!valueListInfo) {
        return ConditionValidated.NotValidated;
      }
      try {
        const valueListProperties = valueListInfo.Parameters.filter(parameter => ["com.sap.vocabularies.Common.v1.ValueListParameterInOut".valueOf(), "com.sap.vocabularies.Common.v1.ValueListParameterOut".valueOf()].includes(parameter.$Type)).filter(parameter => parameter.LocalDataProperty?.$PropertyPath === conditionPath).map(parameter => parameter.ValueListProperty);
        const valueListPropertyPath = valueListProperties[0] ?? conditionPath;
        const filter = new Filter({
          path: valueListPropertyPath,
          operator: FilterOperator.EQ,
          value1: value
        });
        const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, filter, {
          $select: valueListPropertyPath
        });
        const valueExists = (await listBinding.requestContexts()).length > 0;
        if (valueExists) {
          return ConditionValidated.Validated;
        } else {
          return ConditionValidated.NotValidated;
        }
      } catch (error) {
        Log.error("FilterUtils: Error while retrieving ConditionValidated", error);
        return ConditionValidated.NotValidated;
      }
    },
    /**
     * Clear the filter value for a specific property in the filter bar.
     * This is a prerequisite before new values can be set cleanly.
     * @param filterBar The filter bar that contains the filter field
     * @param conditionPath The path to the property as a condition path
     */
    async _clearFilterValue(filterBar, conditionPath) {
      const oState = await StateUtil.retrieveExternalState(filterBar);
      if (oState.filter[conditionPath]) {
        oState.filter[conditionPath].forEach(oCondition => {
          oCondition.filtered = false;
        });
        await StateUtil.applyExternalState(filterBar, {
          filter: {
            [conditionPath]: oState.filter[conditionPath]
          }
        });
      }
    },
    /**
     * Set the filter values for the given property in the filter bar.
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     * @param oFilterBar The filter bar that contains the filter field
     * @param sConditionPath The path to the property as a condition path
     * @param args List of optional parameters
     *  [sOperator] The operator to be used - if not set, the default operator (EQ) will be used
     *  [vValues] The values to be applied - if sOperator is missing, vValues is used as 3rd parameter
     */
    setFilterValues: async function (oFilterBar, sConditionPath) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      await this._setFilterValues(oFilterBar, false, sConditionPath, ...args);
    },
    /**
     * Add the filter values for the given property in the filter bar.
     *
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     * @param filterBar The filter bar that contains the filter field
     * @param conditionPath The path to the property as a condition path
     * @param args List of optional parameters
     */
    addFilterValues: async function (filterBar, conditionPath) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }
      await this._setFilterValues(filterBar, true, conditionPath, ...args);
    },
    _setFilterValues: async function (oFilterBar, append, sConditionPath) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
        args[_key3 - 3] = arguments[_key3];
      }
      let sOperator = args?.[0];
      let vValues = args?.[1];

      // Do nothing when the filter bar is hidden
      if (!oFilterBar) {
        return;
      }

      // common filter Operators need a value. Do nothing if this value is undefined
      // BCP: 2270135274
      if (args.length === 2 && (vValues === undefined || vValues === null || vValues === "") && sOperator && Object.keys(FilterOperator).includes(sOperator)) {
        Log.warning(`An empty filter value cannot be applied with the ${sOperator} operator`);
        return;
      }

      // The 4th parameter is optional; if sOperator is missing, vValues is used as 3rd parameter
      // This does not apply for semantic dates, as these do not require vValues (exception: "LASTDAYS", 3)
      if (vValues === undefined && !SemanticDateOperators.getSemanticDateOperations().includes(sOperator || "")) {
        vValues = sOperator ?? [];
        sOperator = undefined;
      }

      // If sOperator is not set, use EQ as default
      if (!sOperator) {
        sOperator = FilterOperator.EQ;
      }

      // Supported array types:
      //  - Single Values:	"2" | ["2"]
      //  - Multiple Values:	["2", "3"]
      //  - Ranges:			["2","3"]
      // Unsupported array types:
      //  - Multiple Ranges:	[["2","3"]] | [["2","3"],["4","5"]]
      const supportedValueTypes = ["string", "number", "boolean"];
      if (vValues !== undefined && (!Array.isArray(vValues) && !supportedValueTypes.includes(typeof vValues) || Array.isArray(vValues) && vValues.length > 0 && !supportedValueTypes.includes(typeof vValues[0]))) {
        throw new Error("FilterUtils.js#_setFilterValues: Filter value not supported; only primitive values or an array thereof can be used.");
      }
      let values;
      if (vValues !== undefined) {
        values = Array.isArray(vValues) ? vValues : [vValues];
      }

      // Get the value list info of the property to later check whether the values exist
      const valueListInfo = await this._getValueListInfo(oFilterBar, sConditionPath);
      const filter = {};
      if (sConditionPath) {
        if (values && values.length) {
          if (sOperator === FilterOperator.BT) {
            // The operator BT requires one condition with both thresholds
            filter[sConditionPath] = [Condition.createCondition(sOperator, values, null, null, ConditionValidated.NotValidated)];
          } else {
            // Regular single and multi value conditions, if there are no values, we do not want any conditions
            filter[sConditionPath] = await Promise.all(values.map(async value => {
              // For the EQ case, tell MDC to validate the value (e.g. display the description), if it exists in the associated entity, otherwise never validate
              const conditionValidatedStatus = sOperator === FilterOperator.EQ ? await this._getConditionValidated(valueListInfo, sConditionPath, value) : ConditionValidated.NotValidated;
              return Condition.createCondition(sOperator, [value], null, null, conditionValidatedStatus);
            }));
          }
        } else if (SemanticDateOperators.getSemanticDateOperations().includes(sOperator || "")) {
          // vValues is undefined, so the operator is a semantic date that does not need values (see above)
          filter[sConditionPath] = [Condition.createCondition(sOperator, [], null, null, ConditionValidated.NotValidated)];
        }
      }
      if (!append) {
        // Clear the current value as we do not want to add filter values but replace them
        await this._clearFilterValue(oFilterBar, sConditionPath);
      }
      if (filter[sConditionPath]) {
        // This is not called in the reset case, i.e. setFilterValue("Property")
        await StateUtil.applyExternalState(oFilterBar, {
          filter
        });
      }
    },
    conditionToModelPath: function (sConditionPath) {
      // make the path usable as model property, therefore slashes become backslashes
      return sConditionPath.replace(/\//g, "\\");
    },
    _getFilterMetaModel: function (oFilterControl, metaModel) {
      return metaModel || oFilterControl.getModel().getMetaModel();
    },
    _getEntitySetPath: function (sEntityTypePath) {
      return sEntityTypePath && ModelHelper.getEntitySetPath(sEntityTypePath);
    },
    _getFieldsForTable: function (oFilterControl, sEntityTypePath) {
      const lrTables = [];
      /**
       * Gets fields from
       * 	- direct entity properties,
       * 	- navigateProperties key in the manifest if these properties are known by the entity
       *  - annotation "SelectionFields"
       */
      if (sEntityTypePath) {
        const oView = CommonUtils.getTargetView(oFilterControl);
        const tableControls = oView && oView.getController() && oView.getController()._getControls && oView.getController()._getControls("table");
        if (tableControls) {
          tableControls.forEach(function (oTable) {
            lrTables.push(oTable.getParent().getTableDefinition());
          });
        }
        return lrTables;
      }
      return [];
    },
    _getSelectionFields: function (oFilterControl, sEntityTypePath, sFilterEntityTypePath, contextPath, lrTables, oMetaModel, oConverterContext, includeHidden, oModifier, lineItemTerm, annotationPath) {
      const filterFields = FilterBarConverter.getSelectionFields(oConverterContext, lrTables, annotationPath, includeHidden, lineItemTerm);
      let selectionFields = filterFields.selectionFields;
      const propertyInfos = oFilterControl.data ? this.getFilterPropertyInfo(oFilterControl) : JSON.parse(filterFields.sPropertyInfo.replace(/\\\{/g, "{").replace(/\\\}/g, "}")); // propertyInfo string is returned from the getSelectionFields
      if ((oModifier ? oModifier.getControlType(oFilterControl) === "sap.ui.mdc.FilterBar" : oFilterControl.isA("sap.ui.mdc.FilterBar")) && sEntityTypePath !== sFilterEntityTypePath) {
        /**
         * We are in a multi-entity set scenario so we add annotation "SelectionFields"
         * from FilterBar entity if these properties are known by the entity
         */
        const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath));
        const oPageContext = oConverterContext.getConverterContextFor(sFilterEntityTypePath);
        const aFilterBarSelectionFieldsAnnotation = oPageContext.getEntityTypeAnnotation("@com.sap.vocabularies.UI.v1.SelectionFields").annotation || [];
        const mapSelectionFields = {};
        selectionFields.forEach(function (oSelectionField) {
          mapSelectionFields[oSelectionField.conditionPath] = true;
        });
        aFilterBarSelectionFieldsAnnotation.forEach(function (oFilterBarSelectionFieldAnnotation) {
          const sPath = oFilterBarSelectionFieldAnnotation.value;
          if (!mapSelectionFields[sPath]) {
            const oFilterField = FilterBarConverter.getFilterField(sPath, oConverterContext, oVisualizationObjectPath.startingEntitySet.entityType);
            if (oFilterField) {
              selectionFields.push(oFilterField);
            }
          }
        });
      }
      if (selectionFields) {
        const fieldNames = [];
        selectionFields.forEach(function (oField) {
          fieldNames.push(oField.key);
        });
        selectionFields = this._getSelectionFieldsFromPropertyInfos(fieldNames, selectionFields, propertyInfos);
      }
      return selectionFields;
    },
    /**
     * Adds the properties from propertyInfos for the filter field.
     * @param fieldNames The names of fields present in the selectionField array.
     * @param selectionFields Selection field array of all the possible fields that can be in the selection field.
     * @param propertyInfo PropertyInfos filters that are available or present in selection field annotation.
     * @returns FilterField array of all the possible filter fields after adding properties from propertyInfos
     */
    _getSelectionFieldsFromPropertyInfos: function (fieldNames, selectionFields, propertyInfo) {
      propertyInfo.forEach(function (oProp) {
        if (oProp.name === "$search" || oProp.name === "$editState" || oProp.key === undefined) {
          return;
        }
        const selField = selectionFields[fieldNames.indexOf(oProp.key)];
        if (fieldNames.includes(oProp.key) && selField.annotationPath) {
          oProp.group = selField.group;
          oProp.groupLabel = selField.groupLabel;
          oProp.settings = selField.settings;
          oProp.visualFilter = selField.visualFilter;
          oProp.label = oProp.label ? oProp.label : selField.label; // if a label is coming for the manifest we need to take that as priority.
          oProp.annotationPath = oProp.annotationPath ?? selField.annotationPath;
          selectionFields[fieldNames.indexOf(oProp.key)] = oProp;
        }
        if (!fieldNames.includes(oProp.key) && !oProp.annotationPath) {
          selectionFields.push(oProp);
        }
      });
      return selectionFields;
    },
    _getSearchField: function (oIFilter, aIgnoreProperties) {
      return oIFilter.getSearch && !aIgnoreProperties.includes("search") ? oIFilter.getSearch() : null;
    },
    _getFilterConditions: function (mProperties, mFilterConditions, oIFilter) {
      const mConditions = mFilterConditions || oIFilter.getConditions();
      if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
        Object.keys(mConditions).forEach(function (sKey) {
          if (sKey === "$editState") {
            delete mConditions["$editState"];
          }
        });
      }
      return mConditions;
    },
    _getFilterPropertiesMetadata: function (aFilterPropertiesMetadata, oIFilter) {
      if (!(aFilterPropertiesMetadata && aFilterPropertiesMetadata.length)) {
        if (oIFilter.getPropertyInfo) {
          aFilterPropertiesMetadata = oIFilter.getPropertyInfo();
        } else {
          aFilterPropertiesMetadata = null;
        }
      }
      return aFilterPropertiesMetadata;
    },
    _getIgnoredProperties: function (filterPropertiesMetadata, entityProperties) {
      const ignoreProperties = [];
      filterPropertiesMetadata.forEach(function (filterProperty) {
        const filterPropertyName = filterProperty.name;
        const entityPropertiesCurrent = entityProperties.find(entity => entity.name === filterPropertyName);
        if (entityPropertiesCurrent && (!filterProperty.isCustomFilter && filterProperty.dataType !== entityPropertiesCurrent.dataType ||
        // custom filters will have an annotation path applied in the converter when there is a matching property found
        filterProperty.isCustomFilter && entityPropertiesCurrent.annotationPath === undefined)) {
          ignoreProperties.push(filterPropertyName);
        }
      });
      return ignoreProperties;
    },
    getFilters: function (filterBar) {
      if (!filterBar || typeof filterBar.isInitialized !== "function" || !filterBar.isInitialized()) {
        return;
      }
      const {
        parameters,
        filters,
        search
      } = this.getFilterInfo(filterBar);
      return {
        parameters,
        filters,
        search
      };
    },
    /**
     * Prepares propertyInfo for sharing it outside FE, removes unwanted property.
     * @param propertyInfos Array of propertyInfo
     * @returns Array or String (for FilterBar templating) of PropertyInfos after removing the unwanted properties
     */
    formatPropertyInfo: function (propertyInfos) {
      if (typeof propertyInfos === "string") {
        let propInfo = propertyInfos.replace(/\\\{/g, "{");
        propInfo = propInfo.replace(/\\\}/g, "}");
        let propInfos = JSON.parse(propInfo);
        propInfos = this._formatPropertyInfo(propInfos);
        let propertyInfoForFilterBar = JSON.stringify(propInfos);
        propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\{/g, "\\{");
        propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\}/g, "\\}");
        return propertyInfoForFilterBar;
      } else {
        return this._formatPropertyInfo(propertyInfos);
      }
    },
    /**
     * Removes unwanted property from PropertyInfos.
     * @param propertyInfos Array of propertyInfo
     * @returns Array of PropertyInfos after removing the unwanted properties
     */
    _formatPropertyInfo: function (propertyInfos) {
      return propertyInfos.map(property => {
        const _propertyInfo = {
          key: property.key || property.name,
          dataType: "",
          label: ""
        };
        for (const key in PropertyInfoKeys) {
          if (property.hasOwnProperty(key)) {
            switch (key) {
              case "hiddenFilter":
                _propertyInfo.hiddenFilter = property.hiddenFilter;
                break;
              case "required":
                _propertyInfo.required = property.required;
                break;
              case "path":
                _propertyInfo.path = property.path;
                break;
              case "tooltip":
                _propertyInfo.tooltip = property.tooltip;
                break;
              case "visible":
                _propertyInfo.visible = property.visible;
                break;
              case "maxConditions":
                _propertyInfo.maxConditions = property.maxConditions;
                break;
              case "formatOptions":
                _propertyInfo.formatOptions = property.formatOptions;
                break;
              case "constraints":
                _propertyInfo.constraints = property.constraints;
                break;
              case "group":
                _propertyInfo.group = property.group;
                break;
              case "groupLabel":
                _propertyInfo.groupLabel = property.groupLabel;
                break;
              case "caseSensitive":
                _propertyInfo.caseSensitive = property.caseSensitive;
            }
          }
        }
        if (property.dataType) {
          _propertyInfo.dataType = property.dataType;
        } else {
          throw new Error(`Missing mandatory property dataType for filter-bar filter field: ${property}`);
        }
        if (property.label) {
          _propertyInfo.label = property.label;
        }
        return _propertyInfo;
      });
    }
  };
  return oFilterUtils;
}, false);
//# sourceMappingURL=FilterUtils-dbg.js.map

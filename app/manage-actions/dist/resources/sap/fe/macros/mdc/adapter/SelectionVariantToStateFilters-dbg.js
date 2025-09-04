/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/macros/CommonHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filterBar/FilterHelper", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/util/FilterUtil"], function (BindingToolkit, MetaModelConverter, TypeGuards, DisplayModeFormatter, CommonHelper, FilterFieldHelper, FilterHelper, ConditionValidated, FilterUtil) {
  "use strict";

  var getConditions = FilterHelper.getConditions;
  var maxConditions = FilterFieldHelper.maxConditions;
  var ODATA_TYPE_MAPPING = DisplayModeFormatter.ODATA_TYPE_MAPPING;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  const IGNORED_PROPERTYNAMES = ["$search", "$editState"];
  function getPropertyObjectPath(filteredPropertyPath, metaModel) {
    const metaContext = metaModel.createBindingContext(filteredPropertyPath);
    return metaContext !== null ? getInvolvedDataModelObjects(metaContext).targetObject : undefined;
  }

  /**
   * Function to add the description of a code in a filter (to avoid fetching it with a query).
   * @param filter The filter to update
   * @param propertyObjectPath Property object path
   * @param selectionVariant The whole selection variant where we look for the description
   */
  function prefillDescriptionInFilter(filter, propertyObjectPath, selectionVariant) {
    if (filter.length !== 1 || filter[0].operator !== "EQ") {
      // We search for text properties only for single-value filters
      return;
    }
    const textProperty = propertyObjectPath.annotations.Common?.Text;
    if (textProperty && isPathAnnotationExpression(textProperty)) {
      // Search for the Text value in the selection variant definition
      const selectOnText = selectionVariant.getSelectOption(textProperty.path);
      if (selectOnText?.length === 1 && selectOnText[0].Option === "EQ" && selectOnText[0].Sign === "I") {
        // Adding a second value in the condition will be interpreted as the Text value by the field
        // In case this value is empty, we use " "
        filter[0].values.push(selectOnText[0].Low.length >= 1 ? selectOnText[0].Low : " ");
      }
    }
    if (filter[0].values.length === 1 && filter[0].values[0] === "" && propertyObjectPath.annotations.Common?.ValueListWithFixedValues?.valueOf() !== true) {
      // Special case: an empty property value was provided in the selection variant, and the VH is not with fixed values
      // --> we use a default string for the description (empty string doesn't work)
      filter[0].values.push(" ");
    }
  }
  const selectionVariantToStateFilters = {
    /**
     * Get conditions from the selection variant.
     * @param selectionVariant Selection variant
     * @param controlInfoForConversion Control information needed for the conversion of the selection variant to conditions
     * @param controlPropertyInfos Property information of the filterbar
     * @param prefillDescriptions
     * @param metaModel
     * @returns Conditions after conversion of selection variant
     */
    getStateFiltersFromSV: function (selectionVariant, controlInfoForConversion, controlPropertyInfos, prefillDescriptions, metaModel) {
      const {
        contextPath
      } = controlInfoForConversion;
      const conditions = {};
      controlPropertyInfos.forEach(function (propertyMetadata) {
        if (!IGNORED_PROPERTYNAMES.includes(propertyMetadata.name)) {
          let filterPathConditions = [];
          const {
            conditionPath,
            annotationPath
          } = propertyMetadata;
          const propPath = conditionPath.replaceAll("*", "");
          const navPath = propPath.substring(0, propPath.lastIndexOf("/"));
          const propertyName = propPath.substring(propPath.lastIndexOf("/") + 1);

          // Note: Conversion parameters
          const propertyConversionInfo = {
            propertyName,
            navPath,
            propertyContextPath: `${contextPath}${navPath ? navPath + "/" : ""}`,
            propertyMetadata,
            selectionVariant,
            controlInfo: controlInfoForConversion
          };
          if (propertyMetadata.isParameter && annotationPath) {
            // parameter
            propertyConversionInfo.propertyContextPath = annotationPath.substring(0, annotationPath.lastIndexOf("/") + 1);
            filterPathConditions = selectionVariantToStateFilters._getConditionsForParameter(propertyConversionInfo);
          } else if (conditionPath.includes("/")) {
            // navigation property
            filterPathConditions = selectionVariantToStateFilters._getConditionsForNavProperty(propertyConversionInfo);
          } else {
            // normal property
            filterPathConditions = selectionVariantToStateFilters._getConditionsForProperty(propertyConversionInfo);
          }
          if (filterPathConditions.length > 0) {
            const propertyObjectPath = getPropertyObjectPath(annotationPath, metaModel);
            if (propertyObjectPath) {
              if (propertyObjectPath.annotations.Common?.ValueListWithFixedValues) {
                // In case of fixed values, we would convert Empty operator to EQ->''.
                filterPathConditions.forEach(selectionVariantToStateFilters._adjustValueListWithFixedValuesCondition);
              }
              if (prefillDescriptions) {
                prefillDescriptionInFilter(filterPathConditions, propertyObjectPath, selectionVariant);
              }
            }
            conditions[conditionPath] = filterPathConditions;
          }
        }
      });
      return conditions;
    },
    /**
     * Method returns filters and filterfield items to apply and add. Also checks whether the property is configured with hiddenFilter.
     * @param propertyInfos Property information of the control
     * @param conditions Condtions to apply as filters to the control
     * @returns The object containing filters and items.
     */
    getStateToApply: (propertyInfos, conditions) => {
      const items = Object.keys(conditions).reduce((cummulativeItems, path) => {
        const propertyInfo = FilterUtil.getPropertyByKey(propertyInfos, path);
        if (propertyInfo.hiddenFilter === undefined || !propertyInfo.hiddenFilter) {
          cummulativeItems.push({
            name: path
          });
        }
        return cummulativeItems;
      }, []);
      return {
        filter: conditions,
        items: items
      };
    },
    /**
     * Get the filter field configuration of a property.
     * @param property Filter field Path
     * @param filterFieldsConfig Manifest Configuration of the control
     * @returns The Filter Field Configuration
     */
    _getPropertyFilterConfigurationSetting: function (property, filterFieldsConfig) {
      return filterFieldsConfig?.[property]?.settings ?? {};
    },
    /**
     * Create filter conditions for a parameter property.
     * @param propertyConversionInfo Property info used for conversion
     * @returns The filter condtions for parameter property
     */
    _getConditionsForParameter: function (propertyConversionInfo) {
      let conditionObjects = [];
      const {
        propertyMetadata,
        selectionVariant
      } = propertyConversionInfo;
      const conditionPath = propertyMetadata.name;
      const selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, conditionPath, true);
      if (selectOptionName) {
        conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, true);
      }
      return conditionObjects;
    },
    /**
     * Create filter conditions for a normal property.
     * @param propertyConversionInfo Property info used for conversion
     * @returns The filter conditions for a normal property
     */
    _getConditionsForProperty: function (propertyConversionInfo) {
      const {
        propertyMetadata,
        selectionVariant
      } = propertyConversionInfo;
      const conditonPath = propertyMetadata.name;
      const selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, conditonPath);
      let conditionObjects = [];
      if (selectOptionName) {
        conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, false);
      }
      return conditionObjects;
    },
    /**
     * Create filter conditions from navigation properties.
     * @param propertyConversionInfo Property info used for conversion
     * @returns The filter condtions for navigation property
     */
    _getConditionsForNavProperty: function (propertyConversionInfo) {
      const {
        controlInfo,
        selectionVariant,
        propertyName,
        navPath
      } = propertyConversionInfo;
      const {
        contextPath
      } = controlInfo;
      let conditionObjects = [];

      // We check with '/SalesOrderManage/_Item/Name'.
      // '/SalesOrderManage/_Item' => 'SalesOrderManage._Item'
      let selectOptionPathPrefix = `${contextPath.substring(1)}${navPath}`.replaceAll("/", ".");
      let selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, propertyName, false, selectOptionPathPrefix);
      if (!selectOptionName) {
        // We check with '_Item/Name'.
        selectOptionPathPrefix = navPath.replaceAll("/", ".");
        selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, propertyName, false, selectOptionPathPrefix);
      }
      if (selectOptionName) {
        conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, false);
      }
      return conditionObjects;
    },
    /**
     * Get the possible select option name based on priority order.
     * @param selectionVariant SelectionVariant to be converted.
     * @param propertyName Metadata property name
     * @param isParameter Property is a parameter
     * @param navigationPath Navigation path to be considered
     * @returns The correct select option name of a property to fetch the select options for conversion.
     */
    _getSelectOptionName: function (selectionVariant, propertyName, isParameter, navigationPath) {
      // possible SelectOption Names based on priority.
      const possibleSelectOptionNames = [];
      const selectOptionsPropertyNames = selectionVariant.getSelectOptionsPropertyNames();
      if (isParameter) {
        // Currency ==> $Parameter.Currency
        // P_Currency ==> $Parameter.P_Currency
        possibleSelectOptionNames.push(`$Parameter.${propertyName}`);

        // Currency ==> Currency
        // P_Currency ==> P_Currency
        possibleSelectOptionNames.push(propertyName);
        if (propertyName.startsWith("P_")) {
          // P_Currency ==> $Parameter.Currency
          possibleSelectOptionNames.push(`$Parameter.${propertyName.slice(2, propertyName.length)}`);

          // P_Currency ==> Currency
          possibleSelectOptionNames.push(propertyName.slice(2, propertyName.length));
        } else {
          // Currency ==> $Parameter.P_Currency
          possibleSelectOptionNames.push(`$Parameter.P_${propertyName}`);

          // Currency ==> P_Currency
          possibleSelectOptionNames.push(`P_${propertyName}`);
        }
      } else {
        // Name => Name
        possibleSelectOptionNames.push(propertyName);
        possibleSelectOptionNames.push(`$Parameter.${propertyName}`);
        if (propertyName.startsWith("P_")) {
          // P_Name => Name
          const temp1 = propertyName.slice(2, propertyName.length);

          // Name => $Parameter.Name
          possibleSelectOptionNames.push(`$Parameter.${temp1}`);

          // Name => Name
          possibleSelectOptionNames.push(temp1);
        } else {
          // Name => P_Name
          const temp2 = `P_${propertyName}`;

          // P_Name => $Parameter.P_Name
          possibleSelectOptionNames.push(`$Parameter.${temp2}`);

          // P_Name => P_Name
          possibleSelectOptionNames.push(temp2);
        }
      }
      let selectOptionName = "";
      // Find the correct select option name based on the priority
      possibleSelectOptionNames.some(testName => {
        const pathToCheck = navigationPath ? `${navigationPath}.${testName}` : testName;
        // Name => Name
        // Name => _Item.Name (incase _Item is navigationPath)

        return selectOptionsPropertyNames.includes(pathToCheck) ? selectOptionName = pathToCheck : false;
      });
      return selectOptionName;
    },
    /**
     * Get maximum conditions supported for a property as filter.
     * @param propertyConversionInfo Property info used for conversion
     * @returns Number of maximum conditions
     */
    _getMaxConditions(propertyConversionInfo) {
      const {
        controlInfo,
        propertyContextPath,
        propertyName
      } = propertyConversionInfo;
      const {
        metaModel
      } = controlInfo;
      const completePropertyPath = `${propertyContextPath}${propertyName}`;
      const propertyContext = metaModel.createBindingContext(completePropertyPath);
      let maximumConditions = 0;
      if (propertyContext) {
        maximumConditions = maxConditions(propertyName, {
          context: propertyContext
        });
      }
      return maximumConditions;
    },
    /**
     * Convert select options to property conditions.
     * @param propertyConversionInfo Property info used for conversion
     * @param selectOptionName Select option name
     * @param isParameter Boolean which determines if a property is parameterized
     * @returns The conditions of a property for control
     */
    _getPropertyConditions: function (propertyConversionInfo, selectOptionName, isParameter) {
      const {
        controlInfo,
        propertyMetadata,
        selectionVariant,
        propertyContextPath,
        propertyName
      } = propertyConversionInfo;
      const selectOptions = selectionVariant.getSelectOption(selectOptionName);
      const {
        metaModel
      } = controlInfo;
      const maximumConditions = selectionVariantToStateFilters._getMaxConditions(propertyConversionInfo);
      let conditionObjects = [];
      if (selectOptions?.length && maximumConditions !== 0) {
        const semanticDateOperators = selectionVariantToStateFilters._getSemanticDateOperators(propertyConversionInfo, isParameter);
        const propertyEntitySetPath = propertyContextPath.substring(0, propertyContextPath.length - 1);
        const validOperators = isParameter ? ["EQ"] : CommonHelper.getOperatorsForProperty(propertyName, propertyEntitySetPath, metaModel);

        // multiple select options => multiple conditions

        conditionObjects = this._getConditionsFromSelectOptions(selectOptions, propertyMetadata, validOperators, semanticDateOperators, maximumConditions === 1);
      }
      return conditionObjects;
    },
    /**
     * Fetch semantic date operators.
     * @param propertyConversionInfo Object which is used for conversion
     * @param isParameter Boolean which determines if a property is parameterized
     * @returns The semantic date operators supported for a property
     */
    _getSemanticDateOperators: function (propertyConversionInfo, isParameter) {
      const {
        controlInfo,
        propertyMetadata,
        propertyName,
        propertyContextPath
      } = propertyConversionInfo;
      const conditionPath = propertyMetadata.name;
      let semanticDateOperators = [];
      const {
        useSemanticDateRange,
        filterFieldsConfig,
        metaModel
      } = controlInfo;
      if (useSemanticDateRange) {
        if (isParameter) {
          semanticDateOperators = ["EQ"];
        } else {
          const propertyEntitySetPath = propertyContextPath.substring(0, propertyContextPath.length - 1),
            filterSettings = selectionVariantToStateFilters._getPropertyFilterConfigurationSetting(conditionPath, filterFieldsConfig);
          semanticDateOperators = CommonHelper.getOperatorsForProperty(propertyName, propertyEntitySetPath, metaModel, ODATA_TYPE_MAPPING[propertyMetadata.dataType], useSemanticDateRange, filterSettings);
        }
      }
      return semanticDateOperators;
    },
    /**
     * Get the filter conditions from selection options.
     * @param selectOptions Select options array
     * @param propertyMetadata Property metadata information
     * @param validOperators All valid operators
     * @param semanticDateOperators Semantic date operators
     * @param singleCondition Boolean which determines if a property takes only one condtition
     * @returns Converted filter conditions
     */
    _getConditionsFromSelectOptions: function (selectOptions, propertyMetadata, validOperators, semanticDateOperators, singleCondition) {
      let conditionObjects = [];
      // Create conditions for all the selectOptions of the property
      if (selectOptions.length) {
        conditionObjects = singleCondition ? selectionVariantToStateFilters._addConditionFromSelectOption(propertyMetadata, validOperators, semanticDateOperators, conditionObjects, selectOptions[0]) : selectOptions.reduce(selectionVariantToStateFilters._addConditionFromSelectOption.bind(null, propertyMetadata, validOperators, semanticDateOperators), conditionObjects);
      }
      return conditionObjects;
    },
    /**
     * Cumulatively add select option to condition.
     * @param propertyMetadata Property metadata information
     * @param validOperators Operators for all the data types
     * @param semanticDateOperators Operators for the Date type
     * @param cumulativeConditions Filter conditions
     * @param selectOption Selectoption of selection variant
     * @returns The filter conditions
     */
    _addConditionFromSelectOption: function (propertyMetadata, validOperators, semanticDateOperators, cumulativeConditions, selectOption) {
      const {
        hasValueHelp,
        dataType
      } = propertyMetadata;
      const edmType = selectionVariantToStateFilters._getEdmType(dataType);
      const condition = getConditions(selectOption, edmType ?? dataType, !!hasValueHelp, validOperators);
      if (selectOption.SemanticDates && semanticDateOperators.length && semanticDateOperators.includes(selectOption.SemanticDates.operator)) {
        const semanticDates = selectionVariantToStateFilters._addSemanticDatesToConditions(selectOption.SemanticDates);
        if (Object.keys(semanticDates).length > 0) {
          cumulativeConditions.push(semanticDates);
        }
      } else if (condition) {
        if (validOperators.length === 0 || validOperators.includes(condition.operator)) {
          cumulativeConditions.push(condition);
        }
      }
      return cumulativeConditions;
    },
    /**
     * Create filter conditions for a parameter property.
     * @param semanticDates Semantic date infomation
     * @returns The filter conditions containing semantic dates
     */
    _addSemanticDatesToConditions: semanticDates => {
      const values = [];
      if (semanticDates.high !== null) {
        values.push(semanticDates.high);
      }
      if (semanticDates.low !== null) {
        values.push(semanticDates.low);
      }
      return {
        values: values,
        operator: semanticDates.operator,
        isEmpty: undefined
      };
    },
    /**
     * Get EDM type from data type.
     * @param dataType V4 model data type
     * @returns EDM type equivalent of data type
     */
    _getEdmType: dataType => {
      const TYPE_EDM_MAPPING = Object.fromEntries(Object.entries(EDM_TYPE_MAPPING).map(_ref => {
        let [k, v] = _ref;
        return [v.type, k];
      }));
      return TYPE_EDM_MAPPING[dataType];
    },
    /**
     * Change value depending on condition operator(Empty and NotEmpty) for properties with ValueList with fixed values.
     * @param condition Condition to change
     */
    _adjustValueListWithFixedValuesCondition: condition => {
      // in case the condition is meant for a field having a VH, the format required by MDC differs
      condition.validated = ConditionValidated.Validated;
      if (condition.operator === "Empty") {
        condition.operator = "EQ";
        condition.values = [""];
      } else if (condition.operator === "NotEmpty") {
        condition.operator = "NE";
        condition.values = [""];
      }
      delete condition.isEmpty;
    }
  };
  return selectionVariantToStateFilters;
}, false);
//# sourceMappingURL=SelectionVariantToStateFilters-dbg.js.map

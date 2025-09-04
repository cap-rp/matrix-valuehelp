/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/templating/DisplayModeFormatter", "sap/fe/macros/filterBar/DefaultSemanticDateOperators", "sap/fe/macros/filterBar/ExtendedSemanticDateOperators", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (DisplayModeFormatter, DefaultSemanticDateOperators, ExtendedSemanticDateOperators, Filter, FilterOperator) {
  "use strict";

  var ODATA_TYPE_MAPPING = DisplayModeFormatter.ODATA_TYPE_MAPPING;
  const fixedDateOperators = ["TODAY", "TOMORROW", "YESTERDAY"];
  const basicOperators = ["DATE", "FROM", "TO", "DATERANGE"];
  /**
   * Check if the filter operation is supported by user configurations.
   *
   * Scenarios:
   * 1. If no configuration is maintained, then only all default semantic date operators shall be shown for the filter field.
   * 2. If configurations are maintained, then configuration shall be applied to the particular filter field.
   *
   * In case of extended operators that are a combination of single date operator like "TODAY", "TOMORROW" etc. with "TO"/"FROM" operators,
   * they shall not be shown by default.
   * The user will have to maintain configuration to enable them.
   * @param oOperation Operation
   * @param oOperation.key Operator identifier
   * @param oOperation.category Type of semantic date operation
   * @param aOperatorConfiguration User configurations for filter fields
   * @returns Extended Operator names
   */
  function _filterOperation(oOperation, aOperatorConfiguration) {
    if (!aOperatorConfiguration) {
      return true;
    }
    aOperatorConfiguration = Array.isArray(aOperatorConfiguration) ? aOperatorConfiguration : [aOperatorConfiguration];
    const operationKey = oOperation["key"];
    const isExtendedOperator = ExtendedSemanticDateOperators.isExtendedOperator(operationKey);
    let bResult;
    const configFound = aOperatorConfiguration.some(function (oOperatorConfiguration) {
      let j;
      if (!oOperatorConfiguration.path) {
        return false;
      }
      const sValue = oOperation[oOperatorConfiguration.path];
      const bExclude = oOperatorConfiguration.exclude ?? isExtendedOperator ?? false;
      let aOperatorValues;
      if (oOperatorConfiguration.contains && sValue) {
        aOperatorValues = oOperatorConfiguration.contains.split(",");
        for (j = 0; j < aOperatorValues.length; j++) {
          if (bExclude && sValue.includes(aOperatorValues[j])) {
            bResult = false;
            return true;
          } else if (!bExclude && sValue.includes(aOperatorValues[j])) {
            bResult = true;
            return true;
          }
        }
      }
      if (oOperatorConfiguration.equals && sValue) {
        aOperatorValues = oOperatorConfiguration.equals.split(",");
        for (j = 0; j < aOperatorValues.length; j++) {
          if (bExclude && sValue === aOperatorValues[j]) {
            bResult = false;
            return true;
          } else if (!bExclude && sValue === aOperatorValues[j]) {
            bResult = true;
            return true;
          }
        }
      }
      return false;
    });
    return configFound ? bResult : !isExtendedOperator;
  }
  // Get the operators based on type
  function getOperatorsInfo(type) {
    return {
      ...DefaultSemanticDateOperators.getOperatorsInfo(type),
      ...ExtendedSemanticDateOperators.getOperatorsInfo()
    };
  }
  const SemanticDateOperators = {
    /**
     * Get basic semantic date operator names.
     * @returns Basic Operator names like "DATE", "FROM", "TO", "DATERANGE".
     */
    getBasicSemanticDateOperations: function () {
      return [...basicOperators];
    },
    /**
     * Get all supported semantic date operator names that can be used via FE macro filter bar.
     * @param type
     * @returns Operator names.
     */
    getSemanticDateOperations: function (type) {
      return [...DefaultSemanticDateOperators.getSemanticDateOperations(type), ...ExtendedSemanticDateOperators.getSemanticDateOperations()];
    },
    // TODO: Would need to check with MDC for removeOperator method
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeSemanticDateOperators: function () {},
    // To filter operators based on manifest aOperatorConfiguration settings
    getFilterOperations: function (aOperatorConfiguration, type) {
      const aOperations = [];
      const operators = getOperatorsInfo(type);
      for (const n in operators) {
        const oOperation = operators[n];
        if (_filterOperation(oOperation, aOperatorConfiguration)) {
          aOperations.push(oOperation);
        }
      }
      return aOperations.map(function (oOperation) {
        return oOperation.key;
      });
    },
    /**
     * The function will check if any of the filter conditions does not have a semantic operator or a date operator.
     * This includes actual date fields along with Semantic operator.
     * If the 2nd parameter is false, we only check if filter has the semantic Operator.
     * @param filterConditions Filter conditions
     * @param includeCheckForBasicOperators Should include basic operator along with semantic operator
     * @returns True if any of the filter conditions is not semantic field
     */
    hasSemanticDateOperations: function (filterConditions) {
      let includeCheckForBasicOperators = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      const semanticDateOps = this.getSemanticDateOperations();
      for (const key in filterConditions) {
        const filterCondtion = filterConditions[key];
        const conditionWithSemanticOperator = filterCondtion.find(function (condition) {
          return semanticDateOps.includes(condition.operator);
        });
        if (conditionWithSemanticOperator) {
          if (includeCheckForBasicOperators) {
            return true;
          } else {
            // if operator is one of basic operator and not a semantic operator then we return false
            return !basicOperators.includes(conditionWithSemanticOperator.operator);
          }
        }
      }
      return false;
    },
    getSemanticOpsFilterProperties: function (filterSelectOptions) {
      const filtersWithSemanticOperators = [];
      for (const [filterName, filterInfo] of Object.entries(filterSelectOptions)) {
        const filterSemanticInfo = filterInfo[0].SemanticDates;
        if (filterSemanticInfo && !basicOperators.includes(filterSemanticInfo.operator)) {
          filtersWithSemanticOperators.push({
            filterName,
            filterSemanticInfo,
            filterType: ""
          });
        }
      }
      return filtersWithSemanticOperators;
    },
    getSemanticDateFiltersWithFlpPlaceholders(filtersWithSemanticOpsInfo, propertiesInfo) {
      const semanticDateFilters = [];
      const flpMappedPlaceholders = {};
      filtersWithSemanticOpsInfo.forEach(_ref => {
        let {
          filterName,
          filterSemanticInfo,
          filterType
        } = _ref;
        const correspondingPropertyInfo = propertiesInfo.find(propertyInfo => propertyInfo.key === filterName);
        if (correspondingPropertyInfo && correspondingPropertyInfo.typeConfig?.className) {
          filterType = ODATA_TYPE_MAPPING[correspondingPropertyInfo.typeConfig?.className];
        }
        const semanticOperator = filterSemanticInfo.operator;
        const value1 = filterSemanticInfo.high;
        const value2 = filterSemanticInfo.low;
        if (semanticOperator) {
          let filter;
          const isExtendedOperator = ExtendedSemanticDateOperators.isExtendedOperator(semanticOperator);
          // FLP only understands single date operators like TODAY, YESTERDAY etc.
          // So in case of extended operators, we would need to use the single date operator(primitive semantic date operator) used in creating the extended operator.
          const operatorKeyForFlpPlaceholder = isExtendedOperator ? ExtendedSemanticDateOperators.getCorrespondingSingleDateOperator(semanticOperator) : semanticOperator;
          if ((isExtendedOperator || fixedDateOperators.includes(semanticOperator)) && filterType !== "Edm.DateTimeOffset") {
            const key = `${filterName}placeholder`;
            const operator = isExtendedOperator ? ExtendedSemanticDateOperators.getFilterOperator(semanticOperator) : "EQ";
            filter = new Filter({
              path: filterName,
              operator,
              value1: key
            });
            flpMappedPlaceholders[key] = `{${filterType}%%DynamicDate.${operatorKeyForFlpPlaceholder}%%}`;
          } else {
            const commonOperatorSuffix = [operatorKeyForFlpPlaceholder, value1, value2].filter(val => val !== undefined && val !== null).join(".");
            const startFilterKey = `${filterName}placeholderStart`;
            const endFilterKey = `${filterName}placeholderEnd`;
            const commonPrefixPlaceholder = `${filterType}%%DynamicDate.${commonOperatorSuffix}`;
            const geFilter = new Filter({
              path: filterName,
              operator: "GE",
              value1: startFilterKey
            });
            const leFilter = new Filter({
              path: filterName,
              operator: "LE",
              value1: endFilterKey
            });
            if (isExtendedOperator) {
              // Extended operators are combination of single date operators like TODAY with range operator like FROM or TO.
              // In such case, single date is the anchor for the filter and the operator LE or GE is decided based on the range TO or FROM.
              const filterOperator = ExtendedSemanticDateOperators.getFilterOperator(semanticOperator);
              filter = filterOperator === FilterOperator.GE ? geFilter : leFilter;
            } else {
              // The dates' end points(start and end) shall create the range for the filter.
              filter = new Filter({
                filters: [geFilter, leFilter],
                and: true
              });
            }
            flpMappedPlaceholders[startFilterKey] = `{${commonPrefixPlaceholder}.start%%}`;
            flpMappedPlaceholders[endFilterKey] = `{${commonPrefixPlaceholder}.end%%}`;
          }
          semanticDateFilters.push(filter);
        }
      });
      return [flpMappedPlaceholders, semanticDateFilters];
    },
    /**
     * Add all semantic date operators that can be supported by FE FilterBar building block to MDC environment.
     */
    addSemanticDateOperators() {
      DefaultSemanticDateOperators.addSemanticDateOperators();
      ExtendedSemanticDateOperators.addExtendedFilterOperators();
    }
  };
  return SemanticDateOperators;
}, false);
//# sourceMappingURL=SemanticDateOperators-dbg.js.map

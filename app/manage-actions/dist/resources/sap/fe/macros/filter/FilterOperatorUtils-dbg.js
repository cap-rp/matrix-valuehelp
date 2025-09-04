/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/LoaderUtils", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/condition/Operator", "sap/ui/mdc/enums/OperatorValueType"], function (Log, LoaderUtils, FilterOperatorUtil, Operator, OperatorValueType) {
  "use strict";

  var requireDependencies = LoaderUtils.requireDependencies;
  const FilterOperatorUtils = {
    /**
     * Process all custom operators to be created that are referenced in the application manifest.
     * @param appComponent AppComponent
     * @returns Promise that resolves on creating and adding the operator to MDC environment
     */
    async processCustomFilterOperators(appComponent) {
      const sapFeConfig = appComponent.getManifestEntry("sap.fe");
      const {
        customFilterOperators
      } = sapFeConfig?.macros?.filter || {};
      if (customFilterOperators) {
        await FilterOperatorUtils.registerCustomOperators(customFilterOperators);
      }
    },
    /**
     * Register custom operators.
     * @param customFilterOperators Custom operator info
     * @returns Promise that resolves to an array of operators
     */
    async registerCustomOperators(customFilterOperators) {
      const modelFilterNames = customFilterOperators.map(customFilterOperatorInfo => customFilterOperatorInfo.name);
      const customOperatorHandlerFileNames = modelFilterNames.map(opName => opName.substring(0, opName.lastIndexOf(".")).replace(/\./g, "/"));
      const customOperatorModules = await requireDependencies(customOperatorHandlerFileNames);
      const operators = customFilterOperators.reduce((accOperators, customFilterOperatorInfo, currentIndex) => {
        const module = customOperatorModules?.[currentIndex];
        const {
          name,
          multiValue
        } = customFilterOperatorInfo;
        if (module) {
          const operator = FilterOperatorUtils.createSingleCustomOperator(name, module, multiValue ?? false);
          if (operator) {
            accOperators.push(operator);
          }
        } else {
          Log.error(`Failed to load custom operator module: ${customOperatorHandlerFileNames[currentIndex]}`);
        }
        return accOperators;
      }, []);
      FilterOperatorUtil.addOperators(operators);
      return operators;
    },
    /**
     * Create custom operator.
     * @param operatorName The binding operator name
     * @param customOperatorModule Custom operator module
     * @param multiValue Custom operator expected to work with multiple values
     * @returns Operator
     */
    createSingleCustomOperator(operatorName, customOperatorModule, multiValue) {
      const methodName = operatorName.substring(operatorName.lastIndexOf(".") + 1);
      if (customOperatorModule?.[methodName]) {
        return new Operator({
          filterOperator: "",
          tokenFormat: "",
          name: operatorName,
          valueTypes: [OperatorValueType.Self],
          tokenParse: "^(.*)$",
          format: value => {
            return FilterOperatorUtils.formatConditionValues(value.values, multiValue);
          },
          parse: function (text, type, displayFormat, defaultOperator) {
            if (typeof text === "object") {
              if (text.operator !== operatorName) {
                throw Error("not matching operator");
              }
              return text.values;
            }
            return Operator.prototype.parse.apply(this, [text, type, displayFormat, defaultOperator]);
          },
          getModelFilter: condition => {
            const formatedValues = FilterOperatorUtils.getValuesForModelFilter(condition.values, multiValue);
            return customOperatorModule[methodName].call(customOperatorModule, formatedValues);
          }
        });
      } else {
        Log.error(`Failed to create custom operator: model filter function ${operatorName} not found`);
      }
    },
    /**
     * Values for model filter.
     * @param values Input condition values
     * @param multiValue Custom operator expected to work with multiple values
     * @returns Unchanged input condition value
     */
    getValuesForModelFilter(values, multiValue) {
      if (multiValue) {
        const result = values[0];
        return (typeof result === "string" ? result.split(",") : result) || [];
      }
      return Array.isArray(values) && values.length ? values[0] : values;
    },
    /**
     * Condition values for format.
     * @param values Input condition value
     * @param multiValue
     * @returns Input condition value
     */
    formatConditionValues(values) {
      let multiValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (values && Array.isArray(values) && values.length > 0) {
        return multiValue ? values : values[0];
      }
      return values;
    }
  };
  return FilterOperatorUtils;
}, false);
//# sourceMappingURL=FilterOperatorUtils-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (CommonUtils, MetaModelConverter, TypeGuards, Filter, FilterOperator) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var convertTypes = MetaModelConverter.convertTypes;
  /**
   * Generates a filter for the key property of a value list.
   * @param valueList The value list information.
   * @param keyProperty The key property of the value list.
   * @param operator The filter operator.
   * @param valueToMatch The value to match.
   * @returns A filter for the key property.
   */
  function getKeyPropertyFilter(valueList, keyProperty, operator, valueToMatch) {
    let filterValue = valueToMatch;

    // If the key property is known to contain only uppercase values, convert the filter value to uppercase as well
    if (typeof filterValue === "string" && keyProperty.annotations.Common?.IsUpperCase?.valueOf() === true) {
      filterValue = filterValue.toUpperCase();
    }
    return new Filter({
      path: valueList.keyPath,
      operator,
      value1: filterValue
    });
  }

  /**
   * Resolves a single scalar value using a value list.
   * @param valueList The value list information.
   * @param keyProperty The key property of the value list.
   * @param operator The filter operator.
   * @param valueToMatch The value to match.
   * @returns A promise that resolves to the selected values.
   */
  async function resolveValueUsingValueList(valueList, keyProperty, operator, valueToMatch) {
    const model = valueList.valueListInfo.$model;
    const path = `/${valueList.valueListInfo.CollectionPath}`;
    const $select = generateSelectParameter(valueList);
    const $search = CommonUtils.normalizeSearchTerm(valueToMatch instanceof Date ? valueToMatch.toISOString() : valueToMatch.toString());
    const keyPropertyFilter = getKeyPropertyFilter(valueList, keyProperty, operator, valueToMatch);
    const [valueHelpKeyQuery, valueHelpSearchQuery] = await Promise.allSettled([model.bindList(path, undefined, undefined, keyPropertyFilter, {
      $select
    }).requestContexts(0, 1),
    // $filter on the key property of the value list
    model.bindList(path, undefined, undefined, undefined, {
      $search,
      $select
    }).requestContexts() // $search on the value list
    ]);
    const mapResult = mapValueListToCodeList(valueList, true);
    if (valueHelpKeyQuery.status === "fulfilled" && valueHelpKeyQuery.value.length > 0) {
      // There is at least one match in the key column:
      // - If the operator is EQ: This indicates an exact key match, so the returned data will be used.
      // - For other operators: One or more keys match the value based on the operator, so the original condition is preserved.
      return operator === FilterOperator.EQ ? {
        operator,
        selectedValues: valueHelpKeyQuery.value.map(mapResult)
      } : {
        operator,
        selectedValues: [{
          value: valueToMatch,
          description: valueToMatch
        }]
      };
    }
    if (valueHelpSearchQuery.status === "fulfilled" && valueHelpSearchQuery.value.length > 0) {
      // The key query did not return any matches, but the search query found results. Use the search results instead.
      return {
        operator: FilterOperator.EQ,
        selectedValues: valueHelpSearchQuery.value.map(mapResult)
      };
    }

    // No matches were found in either query; the original value will be used as a fallback.
    return {
      operator,
      selectedValues: [{
        value: valueToMatch,
        description: valueToMatch
      }]
    };
  }

  /**
   * Create a mapping function for mapping a value list query result to a code list.
   * @param valueList The value list information used to identify the key and description properties.
   * @param ensureDescription Whether to ensure that the description is always returned.
   * @returns A function that maps a single value list query result to a code list entry.
   */

  function mapValueListToCodeList(valueList) {
    let ensureDescription = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return context => {
      const data = context.getObject();
      const value = data[valueList.keyPath];
      const description = valueList.descriptionPath ? data[valueList.descriptionPath] : undefined;
      return {
        value,
        description: ensureDescription ? description ?? value : description
      };
    };
  }

  /**
   * Generates the $select parameter for a value list query.
   * @param valueList The value list information.
   * @returns The $select parameter as a string.
   */
  _exports.mapValueListToCodeList = mapValueListToCodeList;
  function generateSelectParameter(valueList) {
    return [valueList.keyPath, valueList.descriptionPath].filter(path => path && !path.includes("/")).join(",");
  }
  _exports.generateSelectParameter = generateSelectParameter;
  function handleIntervals(operator, resolvedValues) {
    const [resolvedLowerBound, resolvedUpperBound] = resolvedValues;
    const result = [];
    for (const {
      value: lowerBound,
      description: lowerBoundText
    } of resolvedLowerBound.selectedValues) {
      for (const {
        value: upperBound,
        description: upperBoundText
      } of resolvedUpperBound.selectedValues) {
        result.push({
          operator,
          selectedValues: [{
            value: lowerBound,
            description: lowerBoundText ?? lowerBound
          }, {
            value: upperBound,
            description: upperBoundText ?? upperBound
          }]
        });
      }
    }
    return result;
  }

  /**
   * Resolves token-based filter values using a value list.
   * @param valueList The value list used for resolving values.
   * @param value The token-based filter values to resolve.
   * @returns A promise that resolves to an array of resolved filter values.
   */
  async function resolveTokenValue(valueList, value) {
    const {
      operator,
      selectedValues
    } = value;
    const model = valueList.valueListInfo.$model;

    // Make sure all values are resolved, even if some requests fail. It can happen that the backend cannot process the $filter queries we
    // run on the value list, but we still want to get the fallback $search results.
    model.setContinueOnError("$auto");
    const valueListMetamodel = convertTypes(model.getMetaModel());
    const keyProperty = valueListMetamodel.resolvePath(`/${valueList.valueListInfo.CollectionPath}/${valueList.keyPath}`)?.target;
    if (!isProperty(keyProperty)) {
      // something went wrong - the key property is not a property of the value list entity
      return unresolvedResult([value]);
    }
    const resolvedOperator = operator === FilterOperator.BT || operator === FilterOperator.NB ? FilterOperator.EQ : operator; // BT/NB: Use EQ for resolving the lower/upper bounds
    const resolvedValues = await Promise.all(selectedValues.map(async selectedValue => resolveValueUsingValueList(valueList, keyProperty, resolvedOperator, selectedValue)));
    return operator === FilterOperator.BT || operator === FilterOperator.NB ? handleIntervals(operator, resolvedValues) : resolvedValues.flat();
  }

  /**
   * Returns the unresolved values in the format expected by the Easy Filter Bar.
   * @param values The values to be resolved.
   * @returns An array of unresolved values.
   */
  _exports.resolveTokenValue = resolveTokenValue;
  function unresolvedResult(values) {
    return values.map(_ref => {
      let {
        operator,
        selectedValues
      } = _ref;
      return {
        operator,
        selectedValues: selectedValues.map(value => ({
          value,
          description: value
        }))
      };
    });
  }
  _exports.unresolvedResult = unresolvedResult;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterDataFetcher-dbg.js.map

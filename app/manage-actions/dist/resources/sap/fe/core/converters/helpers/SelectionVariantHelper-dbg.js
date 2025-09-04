/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  function getRangeDefinition(range, propertyType) {
    let operator;
    const bInclude = range.Sign !== "UI.SelectionRangeSignType/E" ? true : false;
    switch (range.Option) {
      case "UI.SelectionRangeOptionType/BT":
        operator = bInclude ? "BT" : "NB";
        break;
      case "UI.SelectionRangeOptionType/CP":
        operator = bInclude ? "Contains" : "NotContains";
        break;
      case "UI.SelectionRangeOptionType/EQ":
        operator = bInclude ? "EQ" : "NE";
        break;
      case "UI.SelectionRangeOptionType/GE":
        operator = bInclude ? "GE" : "LT";
        break;
      case "UI.SelectionRangeOptionType/GT":
        operator = bInclude ? "GT" : "LE";
        break;
      case "UI.SelectionRangeOptionType/LE":
        operator = bInclude ? "LE" : "GT";
        break;
      case "UI.SelectionRangeOptionType/LT":
        operator = bInclude ? "LT" : "GE";
        break;
      case "UI.SelectionRangeOptionType/NB":
        operator = bInclude ? "NB" : "BT";
        break;
      case "UI.SelectionRangeOptionType/NE":
        operator = bInclude ? "NE" : "EQ";
        break;
      case "UI.SelectionRangeOptionType/NP":
        operator = bInclude ? "NotContains" : "Contains";
        break;
      default:
        operator = "EQ";
    }
    return {
      operator: operator,
      rangeLow: propertyType && propertyType.indexOf("Edm.Date") === 0 ? new Date(range.Low) : range.Low,
      rangeHigh: range.High && propertyType && propertyType.indexOf("Edm.Date") === 0 ? new Date(range.High) : range.High
    };
  }

  /**
   * Parses a SelectionVariant annotations and creates the corresponding filter definitions.
   * @param selectionVariant SelectionVariant annotation
   * @returns Returns an array of filter definitions corresponding to the SelectionVariant.
   */
  _exports.getRangeDefinition = getRangeDefinition;
  function getFilterDefinitionsFromSelectionVariant(selectionVariant) {
    const aFilterDefs = [];
    if (selectionVariant.SelectOptions) {
      selectionVariant.SelectOptions.forEach(selectOption => {
        if (selectOption.PropertyName?.$target && selectOption.Ranges.length > 0) {
          const propertyType = selectOption.PropertyName.$target.type;
          aFilterDefs.push({
            propertyPath: selectOption.PropertyName.value,
            propertyType: propertyType,
            ranges: selectOption.Ranges.map(range => getRangeDefinition(range, propertyType))
          });
        }
      });
    }
    return aFilterDefs;
  }
  _exports.getFilterDefinitionsFromSelectionVariant = getFilterDefinitionsFromSelectionVariant;
  return _exports;
}, false);
//# sourceMappingURL=SelectionVariantHelper-dbg.js.map

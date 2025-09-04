/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit"], function (BindingToolkit) {
  "use strict";

  var _exports = {};
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var not = BindingToolkit.not;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Method to compute the headerVisible property.
   * @param header Object containing the table properties
   * @param tabTitle Object containing the tab properties
   * @param headerVisible Boolean value to determine if the header is visible
   * @returns Expression binding for headerVisible
   */
  const buildExpressionForHeaderVisible = (header, tabTitle, headerVisible) => {
    const headerBindingExpression = resolveBindingString(header);
    const tabTileBindingExpression = resolveBindingString(tabTitle);
    const headerVisibleBindingExpression = constant(headerVisible);
    return compileExpression(and(headerVisibleBindingExpression, not(equal(headerBindingExpression, tabTileBindingExpression))));
  };
  _exports.buildExpressionForHeaderVisible = buildExpressionForHeaderVisible;
  return _exports;
}, false);
//# sourceMappingURL=TableTemplating-dbg.js.map

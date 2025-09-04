/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit"], function (BindingToolkit) {
  "use strict";

  var _exports = {};
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const getPath = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return oInterface.context.getPath();
    }
    return "";
  };
  getPath.requiresIContext = true;
  _exports.getPath = getPath;
  const getValue = function (oContext) {
    return compileExpression(constant(oContext));
  };
  getValue.requiresIContext = true;
  _exports.getValue = getValue;
  return _exports;
}, false);
//# sourceMappingURL=MacroTemplating-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/fe/core/helpers/FPMHelper"], function (ObjectPath, FPMHelper) {
  "use strict";

  const customBooleanPropertyCheck = async function (oView, modulePath, aSelectedContexts) {
    const parts = modulePath.split(".");
    const methodName = parts.pop();
    const moduleName = parts.join("/");
    return FPMHelper.loadModuleAndCallMethod(moduleName, methodName, oView, this.getBindingContext(), aSelectedContexts || []);
  };
  customBooleanPropertyCheck.__functionName = "sap.fe.core.formatters.FPMFormatter#customBooleanPropertyCheck";

  /**
   * Collection of table formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const fpmFormatter = function (sName) {
    if (fpmFormatter.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return fpmFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  fpmFormatter.customBooleanPropertyCheck = customBooleanPropertyCheck;
  ObjectPath.set("sap.fe.core.formatters.FPMFormatter", fpmFormatter);
  return fpmFormatter;
}, false);
//# sourceMappingURL=FPMFormatter-dbg.js.map

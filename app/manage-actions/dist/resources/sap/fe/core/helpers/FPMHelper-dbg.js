/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/core/CommonUtils"], function (Log, ObjectPath, CommonUtils) {
  "use strict";

  const FPMHelper = {
    loadModuleAndCallMethod: async function (module, method, source) {
      for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }
      return new Promise(function (resolve) {
        let extensionAPI;
        let view;
        if (source.isA("sap.ui.base.Event")) {
          view = CommonUtils.getTargetView(source.getSource());
        } else {
          view = source;
        }
        if (view.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" || view.getControllerName() === "sap.fe.templates.ListReport.ListReportController") {
          extensionAPI = view.getController().getExtensionAPI();
        }
        if (module.startsWith("/extension/")) {
          const fnTarget = ObjectPath.get(module.replace(/\//g, ".").substring(1), extensionAPI);
          resolve(fnTarget[method](...args));
        } else {
          sap.ui.require([module], function (loadedModule) {
            // - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
            // - we provide the context as API, maybe if needed further properties
            resolve(loadedModule[method].bind(extensionAPI)(...args));
          });
        }
      });
    },
    actionWrapper: async function (oEvent, sModule, sMethod, oParameters) {
      if (!sModule || !sMethod) {
        Log.debug("Both the module and the method must be defined to execute a custom action");
        return;
      }

      //The source would be command execution, in case a command is defined for the action in the manifest.
      const oSource = oEvent.getSource ? oEvent.getSource() : oEvent.oSource,
        oView = CommonUtils.getTargetView(oSource),
        oBindingContext = oSource.getBindingContext();
      let listBinding;
      let aSelectedContexts;
      if (oParameters !== undefined) {
        aSelectedContexts = oParameters.contexts || [];
      } else if (oBindingContext !== undefined) {
        aSelectedContexts = [oBindingContext];
      } else {
        aSelectedContexts = [];
      }
      if (oSource.getParent()?.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction") || oSource.getParent()?.isA("sap.m.Menu")) {
        listBinding = FPMHelper.getMdcTable(oSource)?.getRowBinding();
      }
      return FPMHelper.loadModuleAndCallMethod(sModule, sMethod, oView, oBindingContext, aSelectedContexts, listBinding);
    },
    getMdcTable: function (control) {
      const parent = control.getParent();
      if (!parent || parent.isA("sap.ui.mdc.Table")) {
        return parent;
      }
      return FPMHelper.getMdcTable(parent);
    },
    validationWrapper: async function (sModule, sMethod, oValidationContexts, oView, oBindingContext) {
      return FPMHelper.loadModuleAndCallMethod(sModule, sMethod, oView, oBindingContext, oValidationContexts);
    },
    /**
     * Returns an external custom function defined either in a custom controller extension or in an external module.
     * @param moduleName The external module name, or /extension/<path to the custom controller extension module>
     * @param functionName The name of the function
     * @param source A control in the view or an event triggered by a control in the view
     * @returns The function (or undefined if it couldn't be found)
     */
    getCustomFunction(moduleName, functionName, source) {
      let control;
      if (source.isA("sap.ui.base.Event")) {
        control = source.getSource();
      } else {
        control = source;
      }
      const view = CommonUtils.getTargetView(control);
      const extensionAPI = view.getController().getExtensionAPI();
      let customFunction;
      if (moduleName.startsWith("/extension/")) {
        const controllerExt = ObjectPath.get(moduleName.replace(/\//g, ".").substring(1), extensionAPI);
        customFunction = controllerExt ? controllerExt[functionName] : undefined;
      } else {
        const module = sap.ui.require(moduleName);
        customFunction = module ? module[functionName]?.bind(extensionAPI) : undefined;
      }
      if (!customFunction) {
        Log.error(`Couldn't find method ${functionName} in ${moduleName}`);
      }
      return customFunction;
    }
  };
  return FPMHelper;
}, false);
//# sourceMappingURL=FPMHelper-dbg.js.map

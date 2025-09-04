/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/Component"], function (Log, Component) {
  "use strict";

  var _exports = {};
  /**
   * Determines the resource model for a given control, view, controller or appComponent.
   * @param scope The control, view, controller or appComponent for which the resource model should be determined.
   * @returns The resource model
   */
  function getResourceModel(scope) {
    if (scope.isA("sap.ui.core.mvc.Controller") || scope.isA("sap.ui.core.mvc.ControllerExtension")) {
      return scope.getView()?.getModel("sap.fe.i18n");
    } else {
      let i18nModel = scope.getModel("sap.fe.i18n");
      if (!i18nModel) {
        i18nModel = Component.getOwnerComponentFor(scope)?.getModel("sap.fe.i18n");
      }
      return i18nModel;
    }
  }

  /**
   * Determines the resource model text for a reference.
   * @param textOrToken Text reference like {i18n>TOKEN} or {sap.fe.i18n>TOKEN}.
   * @param control A control, app component or page controller.
   * @returns The translated text
   */
  _exports.getResourceModel = getResourceModel;
  function getLocalizedText(textOrToken, control) {
    const matches = /{([A-Za-z0-9_.|@]+)>([A-Za-z0-9_.|]+)}/.exec(textOrToken);
    if (matches) {
      try {
        if (matches[1] === "sap.fe.i18n") {
          // Since our internal resource model is asynchronous we need to access the text like below, otherwise we
          // get back a promise
          return getResourceModel(control).getText(matches[2]);
        } else {
          // For synchronous resource models like i18n used for custom columns we access the text like below
          const resourceBundle = control.getModel(matches[1]).getResourceBundle();
          return resourceBundle.getText(matches[2]);
        }
      } catch (e) {
        Log.info(`Unable to retrieve localized text ${textOrToken}`);
      }
    }
    return textOrToken;
  }
  _exports.getLocalizedText = getLocalizedText;
  return {
    getResourceModel,
    getLocalizedText
  };
}, false);
//# sourceMappingURL=ResourceModelHelper-dbg.js.map

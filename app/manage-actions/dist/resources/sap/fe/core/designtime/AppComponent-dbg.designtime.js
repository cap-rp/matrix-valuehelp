/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["../AppStateHandler"], function (AppStateHandler) {
  "use strict";

  var _exports = {};
  const urlParams = new URLSearchParams(window.location.search);
  const fioriToolsRtaMode = urlParams.get("fiori-tools-rta-mode")?.toLowerCase() === "true";
  const getAllowList = function (element) {
    let allowList = {};
    const elementName = element.getMetadata().getName();
    if (fioriToolsRtaMode) {
      // build the allow list for Fiori tools (developers)
      allowList = {
        "sap.fe.macros.controls.FilterBar": true,
        "sap.ui.fl.variants.VariantManagement": true,
        "sap.ui.mdc.Table": true
      };
    } else {
      // build the allow list for UI Adaptation (key users)
      allowList = {
        "sap.fe.macros.controls.FilterBar": true,
        "sap.fe.templates.ObjectPage.controls.StashableHBox": true,
        "sap.fe.templates.ObjectPage.controls.StashableVBox": true,
        "sap.m.IconTabBar": true,
        "sap.ui.fl.util.IFrame": true,
        "sap.ui.fl.variants.VariantManagement": true,
        "sap.ui.layout.form.Form": true,
        "sap.ui.layout.form.FormContainer": true,
        "sap.ui.layout.form.FormElement": true,
        "sap.ui.mdc.Table": true,
        "sap.uxap.AnchorBar": true,
        "sap.m.IconTabHeader": true,
        "sap.uxap.ObjectPageLayout": true,
        "sap.fe.macros.controls.Section": true,
        "sap.fe.macros.controls.section.SubSection": true,
        "sap.uxap.ObjectPageSection": true,
        "sap.uxap.ObjectPageSubSection": true,
        "sap.f.DynamicPage": true,
        "sap.uxap.ObjectPageDynamicHeaderTitle": true,
        "sap.m.OverflowToolbar": true,
        "sap.m.ToggleButton": true,
        "sap.m.Button": true,
        "sap.m.MenuButton": true,
        "sap.ui.mdc.actiontoolbar.ActionToolbarAction": true,
        "sap.ui.mdc.ActionToolbar": true,
        "sap.f.DynamicPageTitle": true
      };
      // currently we support the adaptation of IconTabfilter only for the IconTabHeader on Object Page (adaptation of sections and subsections)
      if (elementName === "sap.m.IconTabFilter" && element.getParent()?.getMetadata().getName() === "sap.m.IconTabHeader") {
        allowList["sap.m.IconTabFilter"] = true;
      }
      if (elementName === "sap.m.FlexBox" && element.getId().includes("--fe::HeaderContentContainer")) {
        allowList["sap.m.FlexBox"] = true;
      }
    }
    return allowList;
  };

  /**
   * Retrieves the Extension API for the current page from the provided app component.
   * If the current view or controller does not provide an Extension API, the function will either return `undefined` or throw an error.
   * @param appComponent An instance of the app component or page controller from which to retrieve the Extension API.
   * @returns The Extension API for the current page, or `undefined` if it cannot be retrieved.
   * @throws {Error} If the controller does not expose the `getExtensionAPI` method.
   */
  function getExtensionAPI(appComponent) {
    if (appComponent) {
      const rootViewController = appComponent.getRootViewController();
      const appContentContainer = rootViewController.getAppContentContainer();
      if (appContentContainer?.isA("sap.m.NavContainer")) {
        const currentPage = appContentContainer.getCurrentPage();
        const currentView = rootViewController.getViewFromContainer(currentPage);
        if (!currentView) return undefined;
        const controller = currentView.getController();
        if (controller.getExtensionAPI) {
          return controller.getExtensionAPI();
        }
      } else if (appContentContainer?.isA("sap.f.FlexibleColumnLayout")) {
        const currentPage = appContentContainer.getCurrentBeginColumnPage();
        const currentView = rootViewController.getViewFromContainer(currentPage);
        if (!currentView) return undefined;
        const controller = currentView.getController();
        if (controller.getExtensionAPI) {
          return controller.getExtensionAPI();
        }
      }
    }

    // To handle cases where `appComponent` is undefined, you may explicitly return undefined.
    return undefined;
  }

  // To enable all actions, remove the propagateMetadata function. Or, remove this file and its entry in AppComponent.js referring 'designTime'.
  _exports.getExtensionAPI = getExtensionAPI;
  const AppComponentDesignTime = {
    actions: "not-adaptable",
    aggregations: {
      rootControl: {
        actions: "not-adaptable",
        propagateMetadata: function (element) {
          const allowList = getAllowList(element);
          if (allowList[element.getMetadata().getName()]) {
            // by returning the empty object, the same will be merged with element's native designtime definition, i.e. all actions will be enabled for this element
            return {};
          } else {
            // not-adaptable will be interpreted by flex to disable all actions for this element
            return {
              actions: "not-adaptable"
            };
          }
        }
      }
    },
    tool: {
      start: function (appComponent) {
        appComponent.setAdaptationMode(true);
        appComponent.getEnvironmentCapabilities().setCapability("AppState", false);
      },
      stop: function (appComponent, versionWasActivated) {
        appComponent.setAdaptationMode(false);
        appComponent.getEnvironmentCapabilities().setCapability("AppState", true);
        AppStateHandler.setRTAVersionWasActivated(appComponent.getId(), versionWasActivated?.versionWasActivated ?? false);
        // Access the extension API and call updateAppState()
        const extensionAPI = getExtensionAPI(appComponent);
        extensionAPI?.updateAppState();
      }
    }
  };
  return AppComponentDesignTime;
}, false);
//# sourceMappingURL=AppComponent-dbg.designtime.js.map

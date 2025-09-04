/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/library"], function (Log, CommonUtils, KeepAliveHelper, ModelHelper, CoreLibrary) {
  "use strict";

  const VariantManagement = CoreLibrary.VariantManagement;
  const opControlHandlers = {
    retrieve: function (oOPLayout) {
      return {
        selectedSection: oOPLayout.getSelectedSection()
      };
    },
    apply: function (opLayout, controlState) {
      const selectedSection = controlState?.selectedSection;
      if (selectedSection) {
        const opSectionToSelect = opLayout.getSections().find(section => section.getId() === selectedSection);
        if (opSectionToSelect?.getVisible() === false) {
          const controller = this.getView().getController();
          controller.pageReady.waitPageReady().then(function () {
            opLayout.setSelectedSection(selectedSection);
            return undefined;
          }).catch(err => {
            const message = err instanceof Error ? err.message : String(err);
            Log.error(`FE V4 : OP : ViewState : ObjectPageLayout state couldn't be applied : ${message}`);
          });
        } else {
          opLayout.setSelectedSection(selectedSection);
        }
      }
    },
    refreshBinding: function (oOPLayout) {
      const oBindingContext = oOPLayout.getBindingContext();
      const oBinding = oBindingContext && oBindingContext.getBinding();
      if (oBinding) {
        const sMetaPath = ModelHelper.getMetaPathForContext(oBindingContext);
        const sStrategy = KeepAliveHelper.getControlRefreshStrategyForContextPath(oOPLayout, sMetaPath);
        if (sStrategy === "self") {
          // Refresh main context and 1-1 navigation properties or OP
          const oModel = oBindingContext.getModel(),
            oMetaModel = oModel.getMetaModel(),
            oNavigationProperties = CommonUtils.getContextPathProperties(oMetaModel, sMetaPath, {
              $kind: "NavigationProperty"
            }) || {},
            aNavPropertiesToRequest = Object.keys(oNavigationProperties).reduce(function (aPrev, sNavProp) {
              if (oNavigationProperties[sNavProp].$isCollection !== true) {
                aPrev.push({
                  $NavigationPropertyPath: sNavProp
                });
              }
              return aPrev;
            }, []),
            aProperties = [{
              $PropertyPath: "*"
            }],
            sGroupId = oBinding.getGroupId();
          oBindingContext.requestSideEffects(aProperties.concat(aNavPropertiesToRequest), sGroupId);
        } else if (sStrategy === "includingDependents") {
          // Complete refresh
          oBinding.refresh();
        }
      } else {
        Log.info(`ObjectPage: ${oOPLayout.getId()} was not refreshed. No binding found!`);
      }
    }
  };
  const ViewStateExtensionOverride = {
    _getObjectPageLayout: function () {
      const view = this.getView();
      const controller = view.getController();
      return controller._getObjectPageLayoutControl();
    },
    /**
     * Get the state handler for ObjectPageLayout in view.
     * @param control The control for state interaction
     * @returns State handler
     */
    _getOPStateHandler: function (control) {
      const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
      if (viewOP === control) {
        return {
          retrieve: opControlHandlers.retrieve,
          apply: opControlHandlers.apply
        };
      }
    },
    /**
     * Get the refresh handler for ObjectPageLayout in view.
     * @param control The control being refreshed
     * @returns Refresh handler
     */
    _getOPRefreshHandler: function (control) {
      const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
      if (viewOP === control) {
        return {
          refreshBinding: opControlHandlers.refreshBinding
        };
      }
    },
    /**
     * Pass the state handlers of object page view according to the control in concern.
     * @param control The control for state interaction
     * @param controlStateHandlers State handlers
     */
    adaptControlStateHandler: function (control, controlStateHandlers) {
      const opStateHandler = ViewStateExtensionOverride._getOPStateHandler.call(this, control);
      if (opStateHandler) {
        controlStateHandlers.push(opStateHandler);
      }
    },
    /**
     * Pass the refresh handlers of object page view according to the control being refreshed.
     * @param control The control being refreshed
     * @param controlRefreshHandlers Refresh handlers
     */
    adaptBindingRefreshHandler: function (control, controlRefreshHandlers) {
      const opStateHandler = ViewStateExtensionOverride._getOPRefreshHandler.call(this, control);
      if (opStateHandler) {
        controlRefreshHandlers.refreshBinding = opStateHandler.refreshBinding;
      }
    },
    applyInitialStateOnly: function () {
      return false;
    },
    adaptStateControls: function (aStateControls) {
      const oView = this.base.getView(),
        oViewData = oView.getViewData();
      switch (oViewData.variantManagement) {
        case VariantManagement.Control:
          break;
        case VariantManagement.Page:
        case VariantManagement.None:
          break;
        default:
          throw new Error(`unhandled variant setting: ${oViewData.variantManagement}`);
      }
      aStateControls.push(oView.byId("fe::ObjectPage"));
    },
    adaptBindingRefreshControls: function (aControls) {
      const oView = this.base.getView(),
        sRefreshStrategy = KeepAliveHelper.getViewRefreshInfo(oView),
        oController = oView.getController();
      let aControlsToRefresh = [];
      if (sRefreshStrategy) {
        const oObjectPageControl = oController._getObjectPageLayoutControl();
        aControlsToRefresh.push(oObjectPageControl);
      }
      if (sRefreshStrategy !== "includingDependents") {
        const aViewControls = oController._findTables();
        aControlsToRefresh = aControlsToRefresh.concat(KeepAliveHelper.getControlsForRefresh(oView, aViewControls) || []);
      }
      return aControlsToRefresh.reduce(function (aPrevControls, oControl) {
        if (!aPrevControls.includes(oControl)) {
          aPrevControls.push(oControl);
        }
        return aPrevControls;
      }, aControls);
    }
  };
  return ViewStateExtensionOverride;
}, false);
//# sourceMappingURL=ViewState-dbg.js.map

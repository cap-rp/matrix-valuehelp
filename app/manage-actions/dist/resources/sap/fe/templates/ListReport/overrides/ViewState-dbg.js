/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/library", "sap/fe/navigation/library", "sap/ui/Device", "sap/ui/mdc/p13n/StateUtil"], function (Log, KeepAliveHelper, CoreLibrary, NavLibrary, Device, StateUtil) {
  "use strict";

  const NavType = NavLibrary.NavType,
    VariantManagementType = CoreLibrary.VariantManagement,
    TemplateContentView = CoreLibrary.TemplateContentView;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ViewStateOverride = {
    _bSearchTriggered: false,
    applyInitialStateOnly: function () {
      return true;
    },
    onBeforeStateApplied: function (aPromises, navigationType) {
      const oView = this.getView(),
        oController = oView.getController(),
        oFilterBar = oController._getFilterBarControl(),
        aTables = oController._getControls("table");
      if (oFilterBar) {
        oFilterBar.setSuspendSelection(true);
        aPromises.push(oFilterBar.waitForInitialization());
        //This is required to remove any existing or default filter conditions before restoring the filter bar state in hybrid navigation mode.
        if (navigationType === NavType.hybrid) {
          this._clearFilterConditions(oFilterBar);
        }
      }
      aTables.forEach(function (oTable) {
        aPromises.push(oTable.initialized());
      });
      delete this._bSearchTriggered;
    },
    adaptBindingRefreshControls: function (aControls) {
      const oView = this.base.getView(),
        oController = oView.getController(),
        aViewControls = oController._getControls(),
        aControlsToRefresh = KeepAliveHelper.getControlsForRefresh(oView, aViewControls);
      Array.prototype.push.apply(aControls, aControlsToRefresh);
    },
    adaptStateControls: function (aStateControls) {
      const oView = this.base.getView(),
        oController = oView.getController();
      const oFilterBarVM = this._getFilterBarVM(oView);
      if (oFilterBarVM) {
        aStateControls.push(oFilterBarVM);
      }
      if (oController._isMultiMode()) {
        aStateControls.push(oController._getMultiModeControl());
      }
      if (oController._hasMultiVisualizations()) {
        aStateControls.push(oController._getSegmentedButton(TemplateContentView.Chart));
        aStateControls.push(oController._getSegmentedButton(TemplateContentView.Table));
      }
      aStateControls.push(oView.byId("fe::ListReport"));
    },
    retrieveAdditionalStates: function (mAdditionalStates) {
      const oView = this.getView(),
        oController = oView.getController(),
        bPendingFilter = oView.getBindingContext("internal").getProperty("hasPendingFilters");
      mAdditionalStates.dataLoaded = !bPendingFilter || !!this._bSearchTriggered;
      if (oController._hasMultiVisualizations()) {
        const sAlpContentView = oView.getBindingContext("internal").getProperty("alpContentView");
        mAdditionalStates.alpContentView = sAlpContentView;
      }
      delete this._bSearchTriggered;
    },
    applyAdditionalStates: function (oAdditionalStates) {
      const oView = this.getView(),
        oController = oView.getController(),
        oFilterBar = oController._getFilterBarControl();
      if (oAdditionalStates) {
        if (oFilterBar) {
          const filterBarAPI = oFilterBar.getParent();

          // Trigger search if live mode is enabled or data is loaded
          if (oFilterBar.getLiveMode() || oAdditionalStates.dataLoaded === true) {
            filterBarAPI.triggerSearch();
            this._bSearchTriggered = true;
          }
          // Handle case when data is not yet loaded
          else if (oAdditionalStates.dataLoaded === false) {
            // Prevent data from being loaded on navigating back
            oFilterBar._bSearchTriggered = false;
          }
        }
        if (oController._hasMultiVisualizations()) {
          const oInternalModelContext = oView.getBindingContext("internal");
          if (!Device.system.desktop && oAdditionalStates.alpContentView == TemplateContentView.Hybrid) {
            oAdditionalStates.alpContentView = TemplateContentView.Chart;
          }
          oInternalModelContext.getModel().setProperty(`${oInternalModelContext.getPath()}/alpContentView`, oAdditionalStates.alpContentView);
        }
      }
    },
    /************************************* private helper *****************************************/

    /**
     * Variant management used by filter bar.
     * @param view View of the LR filter bar
     * @returns VariantManagement if used
     */
    _getFilterBarVM: view => {
      let variantManagement;
      const viewData = view.getViewData();
      switch (viewData.variantManagement) {
        case VariantManagementType.Page:
          variantManagement = view.byId("fe::PageVariantManagement");
          break;
        case VariantManagementType.Control:
          variantManagement = view.getController()._getFilterBarVariantControl();
          break;
        case VariantManagementType.None:
        default:
          break;
      }
      return variantManagement;
    },
    /*
     * Sets filtered: false flag to every field so that it can be cleared out
     *
     * @param oFilterBar filterbar control is used to display filter properties in a user-friendly manner to populate values for a query
     * @returns promise which will be resolved to object
     * @private
     */
    _fnClearStateBeforexAppNav: async function (oFilterBar) {
      return StateUtil.retrieveExternalState(oFilterBar).then(oExternalState => {
        const oCondition = oExternalState.filter;
        for (const field in oCondition) {
          if (field !== "$editState" && field !== "$search" && oCondition[field]) {
            oCondition[field].forEach(condition => {
              condition["filtered"] = false;
            });
          }
        }
        return oCondition;
      }).catch(function (oError) {
        Log.error("Error while retrieving the external state", oError);
      });
    },
    _clearFilterConditions: async function (oFilterBar) {
      const aItems = [];
      return oFilterBar.waitForInitialization().then(async () => {
        const oClearConditions = await this._fnClearStateBeforexAppNav(oFilterBar);
        return StateUtil.applyExternalState(oFilterBar, {
          filter: oClearConditions,
          items: aItems
        });
      });
    }
  };
  return ViewStateOverride;
}, false);
//# sourceMappingURL=ViewState-dbg.js.map

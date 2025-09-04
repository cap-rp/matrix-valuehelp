/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin", "sap/fe/core/library", "sap/fe/navigation/library", "sap/ui/Device", "sap/ui/mdc/p13n/StateUtil"], function (Log, IViewStateContributorMixin, library, navigationLibrary, Device, StateUtil) {
  "use strict";

  var _exports = {};
  var NavType = navigationLibrary.NavType;
  var InitialLoadMode = library.InitialLoadMode;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let FilterBarAPIStateHandler = /*#__PURE__*/function (_IViewStateContributo) {
    function FilterBarAPIStateHandler() {
      return _IViewStateContributo.apply(this, arguments) || this;
    }
    _exports = FilterBarAPIStateHandler;
    _inheritsLoose(FilterBarAPIStateHandler, _IViewStateContributo);
    var _proto = FilterBarAPIStateHandler.prototype;
    _proto.applyLegacyState = async function applyLegacyState(getControlState, _navParameters, shouldApplyDiffState, skipMerge) {
      const filterBar = this.content;
      const filterBarState = getControlState(filterBar);
      const controlState = {};
      if (filterBarState) {
        controlState.innerState = {
          ...filterBarState,
          fullState: {
            ...controlState.innerState?.fullState,
            ...filterBarState.fullState
          },
          initialState: {
            ...controlState.innerState?.initialState,
            ...filterBarState.initialState
          }
        };
      }
      if (controlState && Object.keys(controlState).length > 0) {
        await this.applyState(controlState, _navParameters, shouldApplyDiffState, skipMerge);
      }
    };
    _proto.applyState = async function applyState(controlState, navParameter, shouldApplyDiffState, skipMerge) {
      try {
        if (controlState && navParameter) {
          const navigationType = navParameter.navigationType;
          //When navigation type is hybrid, we override the filter conditions in IAppState with SV received from XappState
          if (navigationType === NavType.hybrid && controlState.innerState?.fullState !== undefined) {
            const xAppStateFilters = await this.convertSelectionVariantToStateFilters(navParameter.selectionVariant, true);
            const mergedFullState = {
              ...controlState.innerState?.fullState,
              filter: {
                ...controlState.innerState?.fullState.filter,
                ...xAppStateFilters
              }
            };
            //when navigating from card, remove all existing filters values (default or otherwise) and then apply the state
            await this._clearFilterValuesWithOptions(this.content, {
              clearEditFilter: true
            });
            return await StateUtil.applyExternalState(this.content, mergedFullState);
          }
          if (shouldApplyDiffState) {
            const diffState = await StateUtil.diffState(this.content, controlState.innerState?.initialState, controlState.innerState?.fullState);
            return await StateUtil.applyExternalState(this.content, diffState);
          } else if (skipMerge) {
            //skipMerge is true when coming from the dynamic tile, in this case, remove all existing filters values (default or otherwise)
            await this._clearFilterValuesWithOptions(this.content, {
              clearEditFilter: true
            });
          }
          return await StateUtil.applyExternalState(this.content, controlState?.innerState?.fullState ?? controlState);
        }
      } catch (error) {
        Log.error(error);
      } finally {
        this._initialStatePromise.resolve();
      }
    };
    _proto.retrieveState = async function retrieveState() {
      const filterBarState = {};
      filterBarState.innerState = this.getControlState(await StateUtil.retrieveExternalState(this.content));
      // remove sensitive or view state irrelevant fields
      const propertiesInfo = this.content.getPropertyInfoSet();
      const filter = filterBarState.innerState?.filter || {};
      propertiesInfo.filter(function (propertyInfo) {
        return Object.keys(filter).length > 0 && propertyInfo.path && filter[propertyInfo.path] && (propertyInfo.removeFromAppState || filter[propertyInfo.path].length === 0);
      }).forEach(function (PropertyInfo) {
        if (PropertyInfo.path) {
          delete filter[PropertyInfo.path];
        }
      });
      return filterBarState;
    };
    _proto.setInitialState = async function setInitialState() {
      try {
        const initialControlState = await StateUtil.retrieveExternalState(this.content);
        this.initialControlState = initialControlState;
      } catch (e) {
        Log.error(e);
      }
    };
    _proto.applyNavigationParameters = async function applyNavigationParameters(navigationParameter) {
      return new Promise(async resolve => {
        try {
          const view = this.getPageController()?.getView();
          const controller = this.getPageController();
          const appComponent = controller.getAppComponent();
          const componentData = appComponent.getComponentData();
          const startupParameters = componentData && componentData.startupParameters || {};
          const variantStatus = await this.handleVariantIdPassedViaURLParams(startupParameters);
          let filterVariantApplied = false;
          if (variantStatus && variantStatus?.length > 0) {
            // check if filter bar variant is applied or not.
            if (variantStatus[0] === true || variantStatus[1] === true) {
              filterVariantApplied = true;
            }
          }

          // if variant from URL does not exist or did not apply properly then apply to LR either default variant or standard variant required.
          const filterBar = this.getContent();
          const {
            selectionVariant: sv,
            requiresStandardVariant: reqStdVariant = false
          } = navigationParameter;
          if (!filterBar || !sv) {
            resolve();
          }
          await this._applySelectionVariant(view, navigationParameter, filterVariantApplied);
          let bPreventInitialSearch = false;
          const variantManagement = this._getFilterBarVM(view);
          if (filterBar) {
            if (navigationParameter.navigationType !== NavType.initial && reqStdVariant || !variantManagement && view.getViewData().initialLoad === InitialLoadMode.Enabled || controller._shouldAutoTriggerSearch(variantManagement)) {
              const filterBarAPI = filterBar.getParent();
              filterBarAPI.triggerSearch();
            } else {
              bPreventInitialSearch = this._preventInitialSearch(variantManagement);
            }
            //collapse or expand shall be available only for non-desktop systems
            if (!Device.system.desktop) {
              const internalModelContext = view.getBindingContext("internal");
              const searchTriggeredByInitialLoad = this.isSearchTriggeredByInitialLoad(navigationParameter.navigationType);
              internalModelContext.setProperty("searchTriggeredByInitialLoad", searchTriggeredByInitialLoad);
            }
            this._enableFilterBar(filterBar, bPreventInitialSearch);
          } else {
            Log.warning("Did not finish applying navigation parameters - Filter bar not found.");
          }
          resolve();
        } catch {
          resolve();
          Log.warning("Could not apply navigation parameters.");
        }
      });
    };
    return FilterBarAPIStateHandler;
  }(IViewStateContributorMixin);
  _exports = FilterBarAPIStateHandler;
  return _exports;
}, false);
//# sourceMappingURL=FilterBarAPIStateHandler-dbg.js.map

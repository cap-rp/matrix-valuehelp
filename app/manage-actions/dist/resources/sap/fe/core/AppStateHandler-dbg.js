/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepEqual", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/ToES6Promise", "sap/fe/navigation/library", "sap/ui/base/Object", "./controllerextensions/BusyLocker", "./helpers/ModelHelper"], function (Log, deepEqual, ClassSupport, toES6Promise, library, BaseObject, BusyLocker, ModelHelper) {
  "use strict";

  var _dec, _class, _AppStateHandler;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const NavType = library.NavType;
  const SKIP_MERGE_KEY = "skipMerge";
  const REPLACE_COMPLETE_APPSTATE = "REPLACE_COMPLETE_APPSTATE";
  let AppStateHandler = (_dec = defineUI5Class("sap.fe.core.AppStateHandler"), _dec(_class = (_AppStateHandler = /*#__PURE__*/function (_BaseObject) {
    function AppStateHandler(oAppComponent) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this._mCurrentAppState = {};
      _this.oAppComponent = oAppComponent;
      _this.sId = `${oAppComponent.getId()}/AppStateHandler`;
      _this.simultaneousCreateRequest = {};
      _this.bNoRouteChange = false;
      Log.info("APPSTATE : Appstate handler initialized");
      return _this;
    }
    _inheritsLoose(AppStateHandler, _BaseObject);
    var _proto = AppStateHandler.prototype;
    _proto.getId = function getId() {
      return this.sId;
    }

    /**
     * Get view specific appstate.
     * @param innerAppState Overall appstate
     * @param stateIdentifier State identifier. Id of the local view
     * @returns Inner appstate
     */;
    _proto._getInnerAppStateForView = function _getInnerAppStateForView(innerAppState, stateIdentifier) {
      if (stateIdentifier === REPLACE_COMPLETE_APPSTATE || !innerAppState) {
        // overall app state needs to be considered.
        return innerAppState;
      }

      // we take the subset of the app state wrt to the local view id.
      return {
        [stateIdentifier]: innerAppState[stateIdentifier] || {}
      };
    }

    /**
     * Add appstate in hash.
     * @param appStateKey Appstate key
     * @param stateIdentifier State identifier. Id of the local view
     */;
    _proto._addAppStateInHash = function _addAppStateInHash(appStateKey, stateIdentifier) {
      const appComponent = this.oAppComponent,
        navigationService = appComponent.getNavigationService(),
        routerProxy = appComponent.getRouterProxy(),
        hash = routerProxy.getHash(),
        isStickyMode = ModelHelper.isStickySessionSupported(appComponent.getMetaModel()),
        newHash = navigationService.replaceInnerAppStateKey(routerProxy.getHash(), appStateKey);
      if (newHash && this.simultaneousCreateRequest[stateIdentifier] === 0 && newHash !== hash) {
        routerProxy.navToHash(newHash, undefined, undefined, undefined, !isStickyMode);
        this.bNoRouteChange = true;
      }
      Log.info("APPSTATE: navToHash");
    }

    /**
     * Create Appstate Key.
     * @param appStateData Appstate
     * @param stateIdentifier State identifier. Id of the local view
     * @returns Appstate Key
     */;
    _proto._createAppStateKey = async function _createAppStateKey(appStateData, stateIdentifier) {
      const appComponent = this.oAppComponent,
        navigationService = appComponent.getNavigationService();
      if (this.simultaneousCreateRequest[stateIdentifier]) {
        // any other value
        this.simultaneousCreateRequest[stateIdentifier]++;
      } else {
        // 0 or undefined
        this.simultaneousCreateRequest[stateIdentifier] = 1;
      }
      const appStateKey = await navigationService.storeInnerAppStateAsync(appStateData, true, true);
      this.simultaneousCreateRequest[stateIdentifier]--;
      Log.info("APPSTATE: Appstate stored");
      return appStateKey;
    }

    /**
     * Creates appstate info.
     * @param innerAppState
     * @param createAppParameters Parameters for creating new appstate
     * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
     * @param createAppParameters.viewId Id of the view for which we need to create the app state. This is to create or update view specific appstate.
     * @returns A promise resolving the stored data or appstate key
     */;
    _proto._getAppStateInfo = async function _getAppStateInfo(innerAppState, createAppParameters) {
      const appComponent = this.oAppComponent;
      const {
        replaceHash = true,
        viewId: stateIdentifier = REPLACE_COMPLETE_APPSTATE
      } = createAppParameters ?? {};
      let appStateKey = null;
      let appStateData = {
        appState: this._mCurrentAppState
      };
      const currentStateToUpdate = this._getInnerAppStateForView(this._mCurrentAppState, stateIdentifier);
      if (innerAppState && !deepEqual(currentStateToUpdate, innerAppState)) {
        //
        this._mCurrentAppState = {
          ...this._mCurrentAppState,
          ...innerAppState
        };
        appStateData = {
          appState: this._mCurrentAppState
        };
        try {
          appStateKey = await this._createAppStateKey(appStateData, stateIdentifier);
          if (replaceHash === true) {
            this._addAppStateInHash(appStateKey, stateIdentifier);
          }
        } catch (oError) {
          Log.error(oError);
        }
      } else {
        const routerProxy = appComponent.getRouterProxy(),
          hash = routerProxy.getHash();
        appStateKey = routerProxy.findAppStateInHash(hash);
      }
      return {
        appStateData,
        appStateKey
      };
    }

    /**
     * Creates or updates the appstate.
     * Replaces the hash with the new appstate based on replaceHash.
     * @param createAppParameters Parameters for creating new appstate
     * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
     * @param createAppParameters.skipMerge Boolean which determines to skip the key user shine through
     * @param createAppParameters.viewId Id of the view for which we need to create the app state. This is to create or update view specific appstate
     * @returns A promise resolving the stored data or appstate key
     */;
    _proto.createAppState = async function createAppState(createAppParameters) {
      const appComponent = this.oAppComponent;
      if (!appComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
        return;
      }
      const {
          skipMerge = false,
          viewId: stateIdentifier = REPLACE_COMPLETE_APPSTATE
        } = createAppParameters ?? {},
        rootController = appComponent.getRootControl().getController();
      if (!rootController.viewState) {
        throw new Error(`viewState controller extension not available for controller: ${rootController.getMetadata().getName()}`);
      }

      // In case, on load of FCL app we have multiple views(LR, OP, sub-OP...) and url has iAppState(1).
      // The LR view loads with applied iAppState(1) and calls createAppState(example: onSearch event in LR) before OP is loaded.
      // This creates iAppState(2) before iAppState(1) is applied to OP.
      // So, we try to wait till the routing is complete.
      await rootController.routingIsComplete();

      // Get appState to update
      let innerAppState = await rootController.viewState.retrieveViewState();
      innerAppState = this._getInnerAppStateForView(innerAppState, stateIdentifier);
      if (skipMerge) {
        innerAppState = {
          ...innerAppState,
          ...{
            skipMerge
          }
        };
      }
      return this._getAppStateInfo(innerAppState, createAppParameters);
    };
    _proto._createNavigationParameters = function _createNavigationParameters(oAppData, sNavType) {
      return Object.assign({}, oAppData, {
        selectionVariantDefaults: oAppData.oDefaultedSelectionVariant,
        selectionVariant: oAppData.oSelectionVariant,
        requiresStandardVariant: !oAppData.bNavSelVarHasDefaultsOnly,
        navigationType: sNavType
      });
    }

    /**
     * Sets the RTA (Runtime Adaptation) version activation status for a specific ID.
     * @param id The unique identifier.
     * @param value The value indicating whether the RTA version was activated.
     */;
    AppStateHandler.setRTAVersionWasActivated = function setRTAVersionWasActivated(id, value) {
      this.versionActivationStatus[id] = value;
    }

    /**
     * Retrieves the RTA (Runtime Adaptation) version activation status for a specific ID.
     * @param id The unique identifier.
     * @returns The activation status or undefined if not set.
     */;
    AppStateHandler.getRTAVersionWasActivated = function getRTAVersionWasActivated(id) {
      return this.versionActivationStatus[id];
    };
    _proto._checkIfLastSeenRecord = function _checkIfLastSeenRecord(view) {
      //getting the internal model context in order to fetch the technicalkeys of last seen record and close column flag set in the internalrouting for retaining settings in persistence mode
      const internalModelContext = view && view.getBindingContext("internal");
      if (internalModelContext && internalModelContext.getProperty("fclColumnClosed") === true) {
        const technicalKeysObject = internalModelContext.getProperty("technicalKeysOfLastSeenRecord");
        const bindingContext = view?.getBindingContext();
        const path = bindingContext && bindingContext.getPath() || "";
        const metaModel = bindingContext?.getModel().getMetaModel();
        const metaPath = metaModel?.getMetaPath(path);
        const technicalKeys = metaModel?.getObject(`${metaPath}/$Type/$Key`);
        if (technicalKeys) {
          for (const element of technicalKeys) {
            const keyValue = bindingContext.getObject()[element];
            if (keyValue !== technicalKeysObject[element]) {
              internalModelContext.setProperty("fclColumnClosed", false);
              return true;
            }
          }
        }
        //the record opened is not the last seen one : no need to persist the changes, reset to default instead
      }
      return false;
    };
    _proto._getAppStateData = function _getAppStateData(oAppData, viewId, navType) {
      let key = "",
        i = 0;
      const appStateData = navType === NavType.hybrid ? oAppData.iAppState : oAppData;
      if (appStateData?.appState) {
        for (i; i < Object.keys(appStateData.appState).length; i++) {
          if (Object.keys(appStateData.appState)[i] === viewId) {
            key = Object.keys(appStateData.appState)[i];
            break;
          }
        }
      }
      if (appStateData?.appState) {
        return {
          [Object.keys(appStateData.appState)[i]]: appStateData.appState[key] || {}
        };
      }
    }

    /**
     * Applies an appstate by fetching appdata and passing it to _applyAppstateToPage.
     * @param viewId
     * @param view
     * @returns A promise for async handling
     */;
    _proto.applyAppState = async function applyAppState(viewId, view) {
      if (AppStateHandler.getRTAVersionWasActivated(this.oAppComponent.getId())) {
        AppStateHandler.setRTAVersionWasActivated(this.oAppComponent.getId(), false);
        return Promise.resolve();
      }
      if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
        return Promise.resolve();
      }
      const checkIfLastSeenRecord = this._checkIfLastSeenRecord(view);
      if (checkIfLastSeenRecord === true) {
        return Promise.resolve();
      }
      BusyLocker.lock(this);
      // Done for busy indicator
      BusyLocker.lock(this.oAppComponent.getRootControl());
      const oNavigationService = this.oAppComponent.getNavigationService();
      // TODO oNavigationService.parseNavigation() should return ES6 promise instead jQuery.promise
      return toES6Promise(oNavigationService.parseNavigation()).catch(function (aErrorData) {
        if (!aErrorData) {
          aErrorData = [];
        }
        Log.warning("APPSTATE: Parse Navigation failed", aErrorData[0]);
        return [{
          /* app data */
        }, aErrorData[1], aErrorData[2]];
      }).then(async aResults => {
        Log.info("APPSTATE: Parse Navigation done");

        // aResults[1] => oStartupParameters (not evaluated)
        const oAppData = aResults[0] || {},
          sNavType = aResults[2] || NavType.initial,
          oRootController = this.oAppComponent.getRootControl().getController();
        // apply the appstate depending upon the view (LR/OP)
        const appStateData = this._getAppStateData(oAppData, viewId, sNavType);
        // fetch the skipMerge flag from appState for save as tile
        const skipMerge = oAppData?.appState?.[SKIP_MERGE_KEY];
        this._mCurrentAppState = sNavType === NavType.iAppState || sNavType === NavType.hybrid ? {
          ...this._mCurrentAppState,
          ...appStateData
        } : {};
        let shouldApplyState = true;
        if (!oRootController.viewState) {
          throw new Error(`viewState extension required for controller ${oRootController.getMetadata().getName()}`);
        }
        if (oRootController.viewState._isStateEmptyForIAppStateNavType(oAppData, sNavType)) {
          if (!oRootController.viewState._getInitialStateApplied()) {
            oRootController.viewState._setInitialStateApplied();
          }
          shouldApplyState = false;
        }
        const applyViewState = await oRootController.viewState.applyViewState(this._mCurrentAppState, this._createNavigationParameters(oAppData, sNavType), skipMerge);
        if (!shouldApplyState) {
          return {};
        } else {
          return applyViewState;
        }
      }).catch(function (oError) {
        Log.error("appState could not be applied", oError);
        throw oError;
      }).finally(() => {
        BusyLocker.unlock(this);
        BusyLocker.unlock(this.oAppComponent.getRootControl());
      });
    }

    /**
     * To check is route is changed by change in the iAPPState.
     * @returns `true` if the route has chnaged
     */;
    _proto.checkIfRouteChangedByIApp = function checkIfRouteChangedByIApp() {
      return this.bNoRouteChange;
    }

    /**
     * Reset the route changed by iAPPState.
     */;
    _proto.resetRouteChangedByIApp = function resetRouteChangedByIApp() {
      if (this.bNoRouteChange) {
        this.bNoRouteChange = false;
      }
    }

    // Reset all activation statuses in AppStateHandler.versionActivationStatus to false
    ;
    AppStateHandler.resetVersionActivationStatus = function resetVersionActivationStatus() {
      for (const id in this.versionActivationStatus) {
        if (Object.prototype.hasOwnProperty.call(this.versionActivationStatus, id)) {
          this.versionActivationStatus[id] = false;
        }
      }
    };
    return AppStateHandler;
  }(BaseObject), _AppStateHandler.versionActivationStatus = {}, _AppStateHandler)) || _class);
  /**
   * @global
   */
  return AppStateHandler;
}, true);
//# sourceMappingURL=AppStateHandler-dbg.js.map

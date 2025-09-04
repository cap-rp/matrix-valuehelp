/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/Synchronization", "sap/ui/base/Object", "sap/ui/core/Element", "sap/ui/core/Lib"], function (Log, ClassSupport, Synchronization, BaseObject, Element, Library) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const enumState = {
    EQUAL: 0,
    COMPATIBLE: 1,
    ANCESTOR: 2,
    DIFFERENT: 3
  };
  const enumURLParams = {
    LAYOUTPARAM: "layout",
    IAPPSTATEPARAM: "sap-iapp-state"
  };
  /**
   * Creates a HashGuard object.
   * @param sGuardHash The hash used for the guard
   * @returns The created hash guard
   */
  function createGuardFromHash(sGuardHash) {
    return {
      _guardHash: sGuardHash.replace(/\?[^?]*$/, ""),
      // Remove query part
      check: function (sHash) {
        return sHash.indexOf(this._guardHash) === 0;
      }
    };
  }
  /**
   * Returns a hash without its iAppState part.
   * @param sHash The hash
   * @returns The hash without the iAppState
   */
  function removeAppStateInHash(sHash) {
    return sHash.replace(new RegExp(`[&?]*${enumURLParams.IAPPSTATEPARAM}=[^&]*`), "");
  }
  let RouterProxy = (_dec = defineUI5Class("sap.fe.core.RouterProxy"), _dec(_class = /*#__PURE__*/function (_BaseObject) {
    function RouterProxy() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseObject.call(this, ...args) || this;
      _this.bIsRebuildHistoryRunning = false;
      _this.bIsComputingTitleHierachy = false;
      _this.bIsGuardCrossAllowed = false;
      _this.sIAppStateKey = null;
      _this._bActivateRouteMatchSynchro = false;
      _this._bApplyRestore = false;
      _this._pathMappings = [];
      _this.restoreHistoryTriggered = false;
      return _this;
    }
    _inheritsLoose(RouterProxy, _BaseObject);
    var _proto = RouterProxy.prototype;
    _proto.init = function init(oAppComponent, isfclEnabled) {
      // Save the name of the app (including startup parameters) for rebuilding full hashes later
      oAppComponent.getService("shellServices").then(() => this.asyncInit(oAppComponent, isfclEnabled)).catch(function (oError) {
        Log.error("Cannot retrieve the shell services", oError);
      });
      this._fnHashGuard = this.hashGuard.bind(this);
      window.addEventListener("popstate", this._fnHashGuard);
      this._bDisableOnHashChange = false;
      this._bIgnoreRestore = false;
      this._bForceFocus = true; // Trigger the focus mechanism for the first view displayed by the app
    };
    _proto.asyncInit = function asyncInit(oAppComponent, isfclEnabled) {
      this._oShellServices = oAppComponent.getShellServices();
      this.initRaw(oAppComponent.getRouter());
      this.routingHints = oAppComponent.getRoutingService().getRoutingHints();
      // We want to wait until the initial routeMatched is done before doing any navigation
      this.waitForRouteMatchBeforeNavigation();

      // Set feLevel=0 for the first Application page in the history
      history.replaceState(Object.assign({
        feLevel: 0
      }, history.state), "", window.location);
      this.fclEnabled = isfclEnabled;
      this._fnBlockingNavFilter = this._blockingNavigationFilter.bind(this);
      this._oShellServices.registerNavigationFilter(this._fnBlockingNavFilter);
    };
    _proto.destroy = function destroy() {
      if (this._oShellServices) {
        this._oShellServices.unregisterNavigationFilter(this._fnBlockingNavFilter);
      }
      window.removeEventListener("popstate", this._fnHashGuard);
    }

    /**
     * Adds an iAppState inside a hash (or replaces an existing one).
     * @param sHash The hash
     * @param sAppStateKey The iAppState to add
     * @returns The hash with the app state
     */;
    _proto.setAppStateInHash = function setAppStateInHash(sHash, sAppStateKey) {
      let sNewHash;
      if (sHash.includes(enumURLParams.IAPPSTATEPARAM)) {
        // If there's already an iAppState parameter in the hash, replace it
        sNewHash = sHash.replace(new RegExp(`${enumURLParams.IAPPSTATEPARAM}=[^&]*`), `${enumURLParams.IAPPSTATEPARAM}=${sAppStateKey}`);
      } else {
        // Add the iAppState parameter in the hash
        if (!sHash.includes("?")) {
          sNewHash = `${sHash}?`;
        } else {
          sNewHash = `${sHash}&`;
        }
        sNewHash += `${enumURLParams.IAPPSTATEPARAM}=${sAppStateKey}`;
      }
      return sNewHash;
    }

    /**
     * Returns the iAppState part from a hash (or null if not found).
     * @param sHash The hash
     * @returns The iAppState part of the hash
     */;
    _proto.findAppStateInHash = function findAppStateInHash(sHash) {
      const aAppState = sHash.match(new RegExp(`\\?.*${enumURLParams.IAPPSTATEPARAM}=([^&]*)`));
      return aAppState && aAppState.length > 1 ? aAppState[1] : null;
    };
    _proto.getDecodedWindowHash = function getDecodedWindowHash() {
      return decodeURI(window.location.hash);
    }

    /**
     * Raw initialization (for unit tests).
     * @param oRouter The router used by this proxy
     */;
    _proto.initRaw = function initRaw(oRouter) {
      this._oRouter = oRouter;
      this._oManagedHistory = [];
      this._oNavigationGuard = null;
      const sCurrentAppHash = this.getHash();
      this._oManagedHistory.push(this._extractStateFromHash(sCurrentAppHash));
      this.appName = this.getAppNameFromHash(this.getDecodedWindowHash());

      // Set the iAppState if the initial hash contains one
      this.sIAppStateKey = this.findAppStateInHash(sCurrentAppHash);
    }

    /**
     * Return the full app-specific hash part from window.location.hash.
     *
     * Compared to {@link getHash} this function includes sub-routes of nested components.
     * @returns The app-specific hash part (i.e., without the shell part), or an empty string if there is none.
     */;
    _proto.getFullHash = function getFullHash() {
      const splitHash = this._oShellServices.splitHash(this.getDecodedWindowHash());
      if ("appSpecificRoute" in splitHash) {
        return splitHash.appSpecificRoute?.replace(/^&\//, "") ?? ""; // remove the leading "&/"
      }
      return "";
    };
    _proto.getHash = function getHash() {
      return this._oRouter.getHashChanger().getHash() ?? "";
    };
    _proto.getAppNameFromHash = function getAppNameFromHash(hash) {
      const splitHash = this._oShellServices?.splitHash(hash);
      return splitHash?.shellPart ?? "";
    };
    _proto.isFocusForced = function isFocusForced() {
      return this._bForceFocus;
    };
    _proto.setFocusForced = function setFocusForced(bForced) {
      this._bForceFocus = bForced;
    }

    /**
     * Resets the internal variable sIAppStateKey.
     *
     */;
    _proto.removeIAppStateKey = function removeIAppStateKey() {
      this.sIAppStateKey = null;
    };
    _proto.removeRestoreHistoryFlagFromHash = function removeRestoreHistoryFlagFromHash(hash) {
      return hash.replace("restoreHistory=true&", "").replace(/[?&]restoreHistory=true/, "");
    }

    /**
     * Navigates to a specific hash.
     * @param sHash Hash to be navigated to
     * @param bPreserveHistory If set to true, non-ancestor entries in history will be retained
     * @param bDisablePreservationCache If set to true, cache preservation mechanism is disabled for the current navigation
     * @param bForceFocus If set to true, the logic to set the focus once the navigation is finalized will be triggered (onPageReady)
     * @param bPreserveShellBackNavigationHandler If not set to false, the back navigation is set to undefined
     * @returns Promise (resolved when the navigation is finalized) that returns 'true' if a navigation took place, 'false' if the navigation didn't happen
     */;
    _proto.navToHash = async function navToHash(sHash, bPreserveHistory, bDisablePreservationCache, bForceFocus, bPreserveShellBackNavigationHandler) {
      if (bPreserveShellBackNavigationHandler !== false) {
        await this._oShellServices.setBackNavigation();
      }
      sHash = this.removeRestoreHistoryFlagFromHash(sHash);
      if (this._oRouteMatchSynchronization) {
        return this._oRouteMatchSynchronization.waitFor().then(async () => {
          this._oRouteMatchSynchronization = undefined;
          return this._internalNavToHash(sHash, bPreserveHistory, bDisablePreservationCache, bForceFocus);
        });
      } else {
        if (this._bActivateRouteMatchSynchro) {
          this.waitForRouteMatchBeforeNavigation();
        }
        return this._internalNavToHash(sHash, bPreserveHistory, bDisablePreservationCache, bForceFocus);
      }
    };
    _proto._internalNavToHash = async function _internalNavToHash(sHash, bPreserveHistory, bDisablePreservationCache, bForceFocus) {
      // Add the app state in the hash if needed
      if (this.fclEnabled && this.sIAppStateKey && !this.findAppStateInHash(sHash)) {
        sHash = this.setAppStateInHash(sHash, this.sIAppStateKey);
      }
      if (!this.checkHashWithGuard(sHash)) {
        if (!this.oResourceBundle) {
          this.oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
        }

        // We have to use a confirm here for UI consistency reasons, as with some scenarios
        // in the EditFlow we rely on a UI5 mechanism that displays a confirm dialog.
        // eslint-disable-next-line no-alert
        if (!confirm(this.oResourceBundle.getText("C_ROUTER_PROXY_SAPFE_EXIT_NOTSAVED_MESSAGE"))) {
          // The user clicked on Cancel --> cancel navigation
          return Promise.resolve(false);
        }
        this.bIsGuardCrossAllowed = true;
      }

      // In case the navigation will cause a new view to be displayed, we force the focus
      // I.e. if the keys for the hash we're navigating to is a superset of the current hash keys.
      const oNewState = this._extractStateFromHash(sHash);
      if (!this._bForceFocus) {
        // If the focus was already forced, keep it
        const aCurrentHashKeys = RouterProxy.extractEntitySetsFromHash(this.getHash());
        this._bForceFocus = bForceFocus || aCurrentHashKeys.length < oNewState.keys.length && aCurrentHashKeys.every(function (key, index) {
          return key === oNewState.keys[index];
        });
      }
      const oHistoryAction = this._pushNewState(oNewState, false, bPreserveHistory, bDisablePreservationCache);
      this.storeFocusInfoForCurrentHash();
      return this._rebuildBrowserHistory(oHistoryAction, false);
    }

    /**
     * Clears browser history if entries have been added without using the RouterProxy.
     * Updates the internal history accordingly.
     * @returns Promise that is resolved once the history is rebuilt
     */;
    _proto.restoreHistory = async function restoreHistory() {
      if (this._bApplyRestore) {
        this._bApplyRestore = false;
        let sTargetHash = this.getHash();
        sTargetHash = this.removeRestoreHistoryFlagFromHash(sTargetHash);
        const oNewState = this._extractStateFromHash(sTargetHash);
        const oHistoryAction = this._pushNewState(oNewState, true, false, true);
        this.restoreHistoryTriggered = true;
        return this._rebuildBrowserHistory(oHistoryAction, true);
      } else {
        return Promise.resolve();
      }
    }

    /**
     * Checks if RestoreHistory has been triggered on the RouterProxy.
     * @returns True if it has been triggered
     */;
    _proto.checkRestoreHistoryWasTriggered = function checkRestoreHistoryWasTriggered() {
      return this.restoreHistoryTriggered;
    }

    /**
     * Resets the flag that says if RestoreHistory has been triggered on the RouterProxy.
     */;
    _proto.resetRestoreHistoryFlag = function resetRestoreHistoryFlag() {
      this.restoreHistoryTriggered = false;
    }

    /**
     * Navigates back in the history.
     * @returns Promise that is resolved when the navigation is finalized
     */;
    _proto.navBack = async function navBack() {
      const sCurrentHash = this.getHash();
      let sPreviousHash;

      // Look for the current hash in the managed history
      for (let i = this._oManagedHistory.length - 1; i > 0; i--) {
        if (this._oManagedHistory[i].hash === sCurrentHash) {
          sPreviousHash = this._oManagedHistory[i - 1].hash;
          break;
        }
      }
      if (sPreviousHash) {
        return this.navToHash(sPreviousHash);
      } else {
        // We couldn't find a previous hash in history
        // This can happen when navigating from a transient hash in a create app, and
        // in that case history.back would go back to the FLP
        window.history.back();
        return Promise.resolve();
      }
    }

    /**
     * Navigates to a route with parameters.
     * @param sRouteName The route name to be navigated to
     * @param oParameters Parameters for the navigation
     * @param oParameters.noPreservationCache
     * @param oParameters.bIsStickyMode
     * @returns Promise that is resolved when the navigation is finalized
     */;
    _proto.navTo = async function navTo(sRouteName, oParameters) {
      const sHash = this._oRouter.getURL(sRouteName, oParameters);
      return this.navToHash(sHash, false, oParameters?.noPreservationCache, false, !oParameters?.bIsStickyMode);
    }

    /**
     * Exits the current app by navigating back
     * to the previous app (if any) or the FLP.
     * @returns Promise that is resolved when we exit the app
     */;
    _proto.exitFromApp = function exitFromApp() {
      return this._oShellServices.backToPreviousApp();
    }

    /**
     * Checks whether a given hash can have an impact on the current state
     * i.e. if the hash is equal, compatible or an ancestor of the current state.
     * @param sHash `true` if there is an impact
     * @returns If there is an impact
     */;
    _proto.isCurrentStateImpactedBy = function isCurrentStateImpactedBy(sHash) {
      if (sHash[0] === "/") {
        sHash = sHash.substring(1);
      }
      const oLocalGuard = createGuardFromHash(sHash);
      return oLocalGuard.check(this.getHash());
    }

    /**
     * Checks if a navigation is currently being processed.
     * @returns `false` if a navigation has been triggered in the RouterProxy and is not yet finalized
     */;
    _proto.isNavigationFinalized = function isNavigationFinalized() {
      return !this.bIsRebuildHistoryRunning;
    }

    /**
     * Sets the last state as a guard.
     * Each future navigation will be checked against this guard, and a confirmation dialog will
     * be displayed before the navigation crosses the guard (i.e. goes to an ancestor of the guard).
     * @param sHash The hash for the guard
     */;
    _proto.setNavigationGuard = function setNavigationGuard(sHash) {
      this._oNavigationGuard = createGuardFromHash(sHash);
      this.bIsGuardCrossAllowed = false;
    }

    /**
     * Disables the navigation guard.
     */;
    _proto.discardNavigationGuard = function discardNavigationGuard() {
      this._oNavigationGuard = null;
    }

    /**
     * Checks for the availability of the navigation guard.
     * @returns `true` if navigating guard is available
     */;
    _proto.hasNavigationGuard = function hasNavigationGuard() {
      return this._oNavigationGuard !== null;
    }

    /**
     * Tests a hash against the navigation guard.
     * @param sHash The hash to be tested
     * @returns `true` if navigating to the hash doesn't cross the guard
     */;
    _proto.checkHashWithGuard = function checkHashWithGuard(sHash) {
      return this._oNavigationGuard === null || this._oNavigationGuard.check(sHash);
    }

    /**
     * Checks if the user allowed the navigation guard to be crossed.
     * @returns `true` if crossing the guard has been allowed by the user
     */;
    _proto.isGuardCrossAllowedByUser = function isGuardCrossAllowedByUser() {
      return this.bIsGuardCrossAllowed;
    }

    /**
     * Activates the synchronization for routeMatchedEvent.
     * The next NavToHash call will create a Synchronization object that will be resolved
     * by the corresponding onRouteMatched event, preventing another NavToHash to happen in parallel.
     */;
    _proto.activateRouteMatchSynchronization = function activateRouteMatchSynchronization() {
      this._bActivateRouteMatchSynchro = true;
    }

    /**
     * Resolve the routeMatch synchronization object, unlocking potential pending NavToHash calls.
     */;
    _proto.resolveRouteMatch = function resolveRouteMatch() {
      if (this._oRouteMatchSynchronization) {
        this._oRouteMatchSynchronization.resolve();
      }
    }

    /**
     * Makes sure no navigation can happen before a routeMatch happened.
     */;
    _proto.waitForRouteMatchBeforeNavigation = function waitForRouteMatchBeforeNavigation() {
      this._oRouteMatchSynchronization = new Synchronization();
      this._bActivateRouteMatchSynchro = false;
    };
    RouterProxy.extractEntitySetsFromHash = function extractEntitySetsFromHash(sHash) {
      if (sHash === undefined) {
        sHash = "";
      }
      const sHashNoParams = sHash.split("?")[0]; // remove params
      const aTokens = sHashNoParams.split("/");
      const names = [];
      aTokens.forEach(sToken => {
        if (sToken.length) {
          names.push(sToken.split("(")[0]);
        }
      });
      return names;
    }

    /**
     * Builds a state from a hash.
     * @param sHash The hash to be used as entry
     * @returns The state
     */;
    _proto._extractStateFromHash = function _extractStateFromHash(sHash) {
      if (sHash === undefined) {
        sHash = "";
      }
      const oState = {
        keys: RouterProxy.extractEntitySetsFromHash(sHash),
        hash: sHash,
        screenMode: 0 // will be updated in a sec
      };

      // Retrieve layout (if any)
      const aLayout = sHash.match(new RegExp(`\\?.*${enumURLParams.LAYOUTPARAM}=([^&]*)`));
      oState.sLayout = aLayout && aLayout.length > 1 ? aLayout[1] : undefined;
      if (oState.sLayout === "MidColumnFullScreen") {
        oState.screenMode = 1;
      } else if (oState.sLayout === "EndColumnFullScreen") {
        oState.screenMode = 2;
      } else {
        oState.screenMode = 0;
      }
      return oState;
    }

    /**
     * Adds a new state into the internal history structure.
     * Makes sure this new state is added after an ancestor.
     * Also sets the iAppState key in the whole history.
     * @param oNewState The new state to be added
     * @param bRebuildOnly `true` if we're rebuilding the history after a shell menu navigation
     * @param bPreserveHistory If set to true, non-ancestor entries in history will be retained
     * @param bDisableHistoryPreservation Disable the mechanism to retained marked entries in cache
     * @returns The new state
     * @final
     */;
    _proto._pushNewState = function _pushNewState(oNewState, bRebuildOnly, bPreserveHistory, bDisableHistoryPreservation) {
      const sCurrentHash = this.removeRestoreHistoryFlagFromHash(this.getHash());
      let lastIndex = this._oManagedHistory.length - 1;
      let iPopCount = bRebuildOnly ? 1 : 0;

      // 1. Do some cleanup in the managed history : in case the user has navigated back in the browser history, we need to remove
      // the states ahead in history and make sure the top state corresponds to the current page
      // We don't do that when restoring the history, as the current state has been added on top of the browser history
      // and is not reflected in the managed history
      if (!bRebuildOnly) {
        while (lastIndex >= 0 && this._oManagedHistory[lastIndex].hash !== sCurrentHash) {
          this._oManagedHistory.pop();
          lastIndex--;
        }
        if (this._oManagedHistory.length === 0) {
          // We couldn't find the current location in the history. This can happen if a browser reload
          // happened, causing a reinitialization of the managed history.
          // In that case, we use the current location as the new starting point in the managed history
          this._oManagedHistory.push(this._extractStateFromHash(sCurrentHash));
          history.replaceState(Object.assign({
            feLevel: 0
          }, history.state), "");
        }
      }

      // 2. Mark the top state as preserved if required
      if (bPreserveHistory && !bDisableHistoryPreservation) {
        this._oManagedHistory[this._oManagedHistory.length - 1].preserved = true;
      }

      // 3. Then pop all states until we find an ancestor of the new state, or we find a state that need to be preserved
      let oLastRemovedItem;
      while (this._oManagedHistory.length > 0) {
        const oTopState = this._oManagedHistory[this._oManagedHistory.length - 1];
        if ((bDisableHistoryPreservation || !oTopState.preserved) && this._compareCacheStates(oTopState, oNewState) !== enumState.ANCESTOR) {
          // The top state is not an ancestor of oNewState and is not preserved --> we can pop it
          oLastRemovedItem = this._oManagedHistory.pop();
          iPopCount++;
        } else if (oTopState.preserved && removeAppStateInHash(oTopState.hash) === removeAppStateInHash(oNewState.hash)) {
          // We try to add a state that is already in cache (due to preserved flag) but with a different iapp-state
          // --> we should delete the previous entry (it will be later replaced by the new one) and stop popping
          oLastRemovedItem = this._oManagedHistory.pop();
          iPopCount++;
          oNewState.preserved = true;
          break;
        } else {
          break; // Ancestor or preserved state found --> we stop popping out states
        }
      }

      // 4. iAppState management
      this.sIAppStateKey = this.findAppStateInHash(oNewState.hash);
      if (!this.fclEnabled && oLastRemovedItem) {
        const sPreviousIAppStateKey = this.findAppStateInHash(oLastRemovedItem.hash);
        const oComparisonStateResult = this._compareCacheStates(oLastRemovedItem, oNewState);
        // if current state doesn't contain a i-appstate and this state should replace a state containing a iAppState
        // then the previous iAppState is preserved
        if (!this.sIAppStateKey && sPreviousIAppStateKey && (oComparisonStateResult === enumState.EQUAL || oComparisonStateResult === enumState.COMPATIBLE)) {
          oNewState.hash = this.setAppStateInHash(oNewState.hash, sPreviousIAppStateKey);
        }
      }

      // 5. Now we can push the state at the top of the internal history
      const bHasSameHash = oLastRemovedItem && oNewState.hash === oLastRemovedItem.hash;
      if (this._oManagedHistory.length === 0 || this._oManagedHistory[this._oManagedHistory.length - 1].hash !== oNewState.hash) {
        this._oManagedHistory.push(oNewState);
        if (oLastRemovedItem && removeAppStateInHash(oLastRemovedItem.hash) === removeAppStateInHash(oNewState.hash)) {
          oNewState.focusControlId = oLastRemovedItem.focusControlId;
          oNewState.secondaryFocusControlId = oLastRemovedItem.secondaryFocusControlId;
          oNewState.focusInfo = oLastRemovedItem.focusInfo;
          oNewState.secondaryFocusInfo = oLastRemovedItem.secondaryFocusInfo;
        }
      }

      // 6. Determine which actions to do on the history
      if (iPopCount === 0) {
        // No state was popped --> append
        return {
          type: "append"
        };
      } else if (iPopCount === 1) {
        // Only 1 state was popped --> replace current hash unless hash is the same (then nothing to do)
        return bHasSameHash ? {
          type: "none"
        } : {
          type: "replace"
        };
      } else {
        // More than 1 state was popped --> go bakc in history and replace hash if necessary
        return bHasSameHash ? {
          type: "back",
          steps: iPopCount - 1
        } : {
          type: "back-replace",
          steps: iPopCount - 1
        };
      }
    };
    _proto._blockingNavigationFilter = function _blockingNavigationFilter() {
      return this._bDisableOnHashChange ? "Custom" : "Continue";
    }

    /**
     * Disable the routing by calling the router stop method.
     * @final
     */;
    _proto._disableEventOnHashChange = function _disableEventOnHashChange() {
      this._bDisableOnHashChange = true;
      this._oRouter.stop();
    }

    /**
     * Enable the routing by calling the router initialize method.
     * @param [bIgnoreCurrentHash] Ignore the last hash event triggered before the router has initialized
     * @final
     */;
    _proto._enableEventOnHashChange = function _enableEventOnHashChange(bIgnoreCurrentHash) {
      this._bDisableOnHashChange = false;
      this._oRouter.initialize(bIgnoreCurrentHash);
    }

    /**
     * Synchronizes the browser history with the internal history of the routerProxy, and triggers a navigation if needed.
     * @param oHistoryAction Specifies the navigation action to be performed
     * @param bRebuildOnly `true` if internal history is currently being rebuilt
     * @returns Promise (resolved when the navigation is finalized) that returns 'true' if a navigation took place, 'false' if the navigation didn't happen
     * @final
     */;
    _proto._rebuildBrowserHistory = async function _rebuildBrowserHistory(oHistoryAction, bRebuildOnly) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      return new Promise(resolve => {
        this.bIsRebuildHistoryRunning = true;
        const oTargetState = this._oManagedHistory[this._oManagedHistory.length - 1],
          newLevel = this._oManagedHistory.length - 1;
        function replaceAsync() {
          if (!bRebuildOnly) {
            that._enableEventOnHashChange(true);
          }
          that._oRouter.getHashChanger().replaceHash(oTargetState.hash);
          history.replaceState(Object.assign({
            feLevel: newLevel
          }, history.state), "");
          if (bRebuildOnly) {
            setTimeout(function () {
              // Timeout to let 'hashchange' event be processed before by the HashChanger, so that
              // onRouteMatched notification isn't raised
              that._enableEventOnHashChange(true);
            }, 0);
          }
          that.bIsRebuildHistoryRunning = false;
          resolve(true); // a navigation occurred
        }

        // Async callbacks when navigating back, in order to let all notifications and events get processed
        function backReplaceAsync() {
          window.removeEventListener("popstate", backReplaceAsync);
          setTimeout(function () {
            // Timeout to let 'hashchange' event be processed before by the HashChanger
            replaceAsync();
          }, 0);
        }
        function backAsync() {
          window.removeEventListener("popstate", backAsync);
          that.bIsRebuildHistoryRunning = false;
          resolve(true); // a navigation occurred
        }
        that._bIgnoreRestore = true;
        switch (oHistoryAction.type) {
          case "replace":
            const focusInfo = history.state?.focusInfo;
            that._oRouter.getHashChanger().replaceHash(oTargetState.hash);
            history.replaceState(Object.assign({
              feLevel: newLevel,
              focusInfo: focusInfo
            }, history.state), "");
            that.bIsRebuildHistoryRunning = false;
            resolve(true); // a navigation occurred
            break;
          case "append":
            that._oRouter.getHashChanger().setHash(oTargetState.hash);
            history.replaceState(Object.assign({
              feLevel: newLevel
            }, history.state), "");
            that.bIsRebuildHistoryRunning = false;
            resolve(true); // a navigation occurred
            break;
          case "back":
            window.addEventListener("popstate", backAsync);
            history.go(-oHistoryAction.steps);
            break;
          case "back-replace":
            this._disableEventOnHashChange();
            window.addEventListener("popstate", backReplaceAsync);
            history.go(-oHistoryAction.steps);
            break;
          default:
            // No navigation
            this.bIsRebuildHistoryRunning = false;
            resolve(false);
          // no navigation --> resolve to false
        }
      });
    };
    _proto.getLastHistoryEntry = function getLastHistoryEntry() {
      return this._oManagedHistory[this._oManagedHistory.length - 1];
    };
    _proto.setPathMapping = function setPathMapping(mappings) {
      this._pathMappings = mappings.filter(mapping => {
        return mapping.oldPath !== mapping.newPath;
      });
    };
    _proto.hashGuard = function hashGuard() {
      let sHash = this.getDecodedWindowHash();
      const currentAppName = this.getAppNameFromHash(sHash);
      if (currentAppName != this.appName) {
        // When doing external navigation in another window, the current window location is temporarily modified with the URL of the target app
        // In this case, we don't want to update the internally managed history, so we simply do nothing
        return;
      }
      if (sHash.includes("restoreHistory=true")) {
        this._bApplyRestore = true;
      } else if (!this.bIsRebuildHistoryRunning) {
        // Check if the hash needs to be changed (this happens in FCL when switching b/w edit and read-only with 3 columns open)
        const mapping = this._pathMappings.find(m => {
          return sHash.includes(m.oldPath);
        });
        if (mapping) {
          // Replace the current hash
          sHash = sHash.replace(mapping.oldPath, mapping.newPath);
          history.replaceState(Object.assign({}, history.state), "", encodeURI(sHash));
        }
        const aHashSplit = sHash.split("&/");
        const sAppHash = aHashSplit[1] ? aHashSplit[1] : "";
        if (this.checkHashWithGuard(sAppHash)) {
          const oNewState = this._extractStateFromHash(sAppHash);
          this._pushNewState(oNewState, false, false, true);
        }
      }
    }

    /**
     * Compares 2 states.
     * @param {object} oState1
     * @param {object} oState2
     * @returns {number} The result of the comparison:
     *        - enumState.EQUAL if oState1 and oState2 are equal
     *        - enumState.COMPATIBLE if oState1 and oState2 are compatible
     *        - enumState.ANCESTOR if oState1 is an ancestor of oState2
     *        - enumState.DIFFERENT if the 2 states are different
     */;
    _proto._compareCacheStates = function _compareCacheStates(oState1, oState2) {
      // First compare object keys
      if (oState1.keys.length > oState2.keys.length) {
        return enumState.DIFFERENT;
      }
      let equal = true;
      let index;
      for (index = 0; equal && index < oState1.keys.length; index++) {
        if (oState1.keys[index] !== oState2.keys[index]) {
          equal = false;
        }
      }
      if (!equal) {
        // Check routingHints
        if (oState1.keys.length === 1 && oState2.keys.length === 1 && this.routingHints?.[oState1.keys[0]]) {
          if (this.routingHints[oState1.keys[0]].parentOf && this.routingHints[oState1.keys[0]].parentOf.includes(oState2.keys[0])) {
            return enumState.ANCESTOR;
          }
        }
        // Some objects keys are different
        return enumState.DIFFERENT;
      }

      // All keys from oState1 are in oState2 --> check if ancestor
      if (oState1.keys.length < oState2.keys.length || oState1.screenMode < oState2.screenMode) {
        return enumState.ANCESTOR;
      }
      if (oState1.screenMode > oState2.screenMode) {
        return enumState.DIFFERENT; // Not sure this case can happen...
      }

      // At this stage, the 2 states have the same object keys (in the same order) and same screenmode
      // They can be either compatible or equal
      return oState1.sLayout === oState2.sLayout ? enumState.EQUAL : enumState.COMPATIBLE;
    }

    /**
     * Split the app-specific route at the "&/" separator.
     *
     * The app-specific route consists of one or more segments separated by "&/".
     * @example
     * splitAppSpecificRoute("&/Entity('abc')/NextEntity('xyz')");
     * // ["Entity('abc')/NextEntity('xyz')"]
     *
     * splitAppSpecificRoute("&/Entity('abc')/NextEntity('xyz')&/Prefix/NestedRoute");
     * // ["Entity('abc')/NextEntity('xyz')", "Prefix/NestedRoute"]
     * @param appSpecificRoute	The app-specific route.
     * @returns An array of app-specific route segments.
     */;
    RouterProxy.splitAppSpecificRoute = function splitAppSpecificRoute(appSpecificRoute) {
      const routeSplit = appSpecificRoute?.split("&/") ?? [];
      if (!routeSplit[0]) {
        routeSplit.shift(); // remove the leading empty segment (the app-specific route starts with "&/")
      }
      return routeSplit;
    }

    /**
     * Checks if back exits the present guard set.
     * @returns `true` if back exits the guard
     */;
    _proto.checkIfBackIsOutOfGuard = function checkIfBackIsOutOfGuard() {
      // We use window.location.hash instead of HashChanger.getInstance().getHash() because the latter
      // replaces characters in the URL (e.g. %24 replaced by $) and it causes issues when comparing
      // with the URLs in the managed history
      const splitHash = this.getFullHash();
      const segments = RouterProxy.splitAppSpecificRoute(splitHash);
      if (segments.length > 1) {
        // there is a nested route involved -> assume we are still inside the guard
        return false;
      }
      const hash = segments[0] ?? "";
      let previousHash;
      if (this._oNavigationGuard) {
        for (let i = this._oManagedHistory.length - 1; i > 0; i--) {
          if (this._oManagedHistory[i].hash === hash) {
            previousHash = this._oManagedHistory[i - 1].hash;
            break;
          }
        }
        return !previousHash || !this.checkHashWithGuard(previousHash);
      }
      return false;
    }

    /**
     * Checks if a back navigation will exit the app.
     * @returns True if back exits the app
     */;
    _proto.checkIfBackExitsApp = function checkIfBackExitsApp() {
      const splitHash = this.getFullHash();
      const segments = RouterProxy.splitAppSpecificRoute(splitHash);
      if (segments.length > 1) {
        // there is a nested route involved -> assume we are still inside the app
        return false;
      }

      // If the current hash is the first one in the history, then a navback will exit the app
      const hash = segments[0] ?? "";
      return this._oManagedHistory.length > 0 && this._oManagedHistory[0].hash === hash;
    }

    /**
     * Checks if the last 2 entries in the history share the same context.
     * @returns `true` if they share the same context.
     */;
    _proto.checkIfBackHasSameContext = function checkIfBackHasSameContext() {
      if (this._oManagedHistory.length < 2) {
        return false;
      }
      const oCurrentState = this._oManagedHistory[this._oManagedHistory.length - 1];
      const oPreviousState = this._oManagedHistory[this._oManagedHistory.length - 2];
      return oCurrentState.hash.split("?")[0] === oPreviousState.hash.split("?")[0];
    }

    /**
     * Restores the focus for the current hash, if we can find it in the history.
     * @returns True if focus was set, false otherwise.
     */;
    _proto.restoreFocusForCurrentHash = function restoreFocusForCurrentHash() {
      const currentHash = removeAppStateInHash(this.getHash());
      const stateForHash = this._oManagedHistory.find(state => {
        return removeAppStateInHash(state.hash) === currentHash;
      });
      let focusApplied = false;
      if (stateForHash?.focusControlId) {
        let focusControl = Element.getElementById(stateForHash.focusControlId);
        let focusInfo = stateForHash.focusInfo;
        if ((!focusControl || !focusControl.getFocusDomRef()) && stateForHash.secondaryFocusControlId) {
          // The control for focus is either not found or is not displayed on screen (no focusDomRef)
          // --> try the secondary control if there's one
          focusControl = Element.getElementById(stateForHash.secondaryFocusControlId);
          focusInfo = stateForHash.secondaryFocusInfo;
        }
        if (
        // if the control is a busy table, we don't want to focus it.
        // tables have their own handling to restore focus, so we don't want to interfere with that
        focusControl?.getParent()?.isA("sap.ui.mdc.Table") && focusControl.getBusy()) {
          return false;
        }
        focusControl?.focus(focusInfo);
        focusApplied = focusControl !== undefined;
      }
      return focusApplied;
    }

    /**
     * Stores the ID of the currently focused control in the history for the current hash.
     *
     */;
    _proto.storeFocusInfoForCurrentHash = function storeFocusInfoForCurrentHash() {
      const currentHash = removeAppStateInHash(this.getHash());
      const stateForHash = this._oManagedHistory.find(state => {
        return removeAppStateInHash(state.hash) === currentHash;
      });
      if (stateForHash) {
        const focusControl = Element.getActiveElement();
        stateForHash.focusControlId = focusControl?.getId();
        if (focusControl) {
          // The secondary focus control is the parent table if there's one
          let parentTable = focusControl.getParent();
          while (parentTable && !parentTable.isA("sap.ui.table.Table") && !parentTable.isA("sap.m.Table")) {
            parentTable = parentTable.getParent();
          }
          stateForHash.secondaryFocusControlId = parentTable?.getId();
          stateForHash.secondaryFocusInfo = {
            preventScroll: true
          };
        }
        stateForHash.focusInfo = focusControl?.getFocusInfo();
      }
    }

    /**
     * Finds a layout value for a hash in the history.
     * @param hash The hash to look for in the history.
     * @returns A layout value if it could be found, undefined otherwise.
     */;
    _proto.findLayoutForHash = function findLayoutForHash(hash) {
      if (!this.fclEnabled) {
        return undefined;
      }

      // Remove all query parameters from the hash
      const hashNoParam = hash.split("?")[0];

      // Look for the state backwards, so that we find the last state in the history (e.g. if we have 2 states with the same hash but 2 different layouts)
      let targetState;
      for (let index = this._oManagedHistory.length - 1; index >= 0 && targetState === undefined; index--) {
        if (this._oManagedHistory[index].hash.split("?")[0] === hashNoParam) {
          targetState = this._oManagedHistory[index];
        }
      }
      return targetState?.sLayout;
    };
    return RouterProxy;
  }(BaseObject)) || _class);
  return RouterProxy;
}, false);
//# sourceMappingURL=RouterProxy-dbg.js.map

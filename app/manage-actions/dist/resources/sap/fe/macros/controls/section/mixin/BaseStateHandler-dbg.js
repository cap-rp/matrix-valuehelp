/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin", "sap/fe/core/helpers/LoaderUtils"], function (Log, CommonUtils, IViewStateContributorMixin, LoaderUtils) {
  "use strict";

  var _exports = {};
  var requireDependencies = LoaderUtils.requireDependencies;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let BaseStateHandler = /*#__PURE__*/function (_IViewStateContributo) {
    function BaseStateHandler() {
      return _IViewStateContributo.apply(this, arguments) || this;
    }
    _exports = BaseStateHandler;
    _inheritsLoose(BaseStateHandler, _IViewStateContributo);
    var _proto = BaseStateHandler.prototype;
    /**
     * Store the state to be applied until the section is ready.
     */
    /**
     * Apply state is pending.
     */
    /**
     * Retrieve state is pending.
     */
    /**
     * Promise that resolves on state handlers' creation.
     */
    /**
     * The instance of the apply-state handler provided by the control user.
     */
    /**
     * The instance of the retrieve-state handler provided by the control user.
     */
    _proto.setupMixin = function setupMixin(baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
      _IViewStateContributo.prototype.setupMixin.call(this, baseClass);
      const baseInit = baseClass.prototype.init;
      baseClass.prototype.init = function () {
        baseInit?.call(this);

        // The control is ready for state interactions if the blocks are available,
        // Else we wait for blocks to be added.
        this.setupStateInteractionsForLazyRendering();
      };
    }

    /**
     * Listen to subsections rendering to enable state interactions.
     */;
    _proto.setupStateInteractionsForLazyRendering = function setupStateInteractionsForLazyRendering() {};
    _proto.isBlocksAvailable = function isBlocksAvailable() {
      return false;
    }

    /**
     * Register subsection delegate to enable state interactions.
     * We use onBeforeRendering, as when a parent is set for a newly available block, the subsection is rerendered.
     * @param subSection Subsection control
     */;
    _proto.registerSubSectionDelegate = function registerSubSectionDelegate(subSection) {
      const eventDelegates = {
        onBeforeRendering: () => {
          if (this.checkForStateInteractions()) {
            subSection.removeEventDelegate(eventDelegates);
          }
        }
      };
      subSection.addEventDelegate(eventDelegates);
    }

    /**
     * Hook to set the initial state.
     */;
    _proto.setInitialState = async function setInitialState() {}

    /**
     * Retrieve the state to store as part of the view state.
     * @returns StateContributor state
     */;
    _proto.retrieveState = async function retrieveState() {
      await this._stateHandlersAvailable;
      if (this._retrieveHandler) {
        const blocksAvailable = this.isBlocksAvailable();
        if (blocksAvailable) {
          // blocks are available, we carry on with the retrieve state
          this._retrieveStatePending = false;
          const view = CommonUtils.getTargetView(this);
          const extensionAPI = view.getController().getExtensionAPI();
          return this._retrieveHandler.call(extensionAPI, this);
        } else if (this._applyStatePending) {
          // blocks are not available but applyState is already pending, hence we return the state that is on hold.
          this._retrieveStatePending = false;
          return this._stateToApply ?? null;
        } else {
          // blocks are not available hence we sent the retrieve state to pending.
          this._retrieveStatePending = true;
        }
      }
      return null;
    }

    /**
     * Apply state to the contributor.
     * @param getControlState Function to fetch the state to apply.
     * @returns Promise that resolves on state application.
     */;
    _proto.applyLegacyState = async function applyLegacyState(getControlState) {
      const controlState = getControlState(this);
      return this.applyState(controlState);
    }

    /**
     * Apply state to the contributor.
     * @param controlState State to apply
     * @returns Promise that resolves on state application.
     */;
    _proto.applyState = async function applyState(controlState) {
      await this._stateHandlersAvailable;
      if (this._applyHandler) {
        const blocksAvailable = this.isBlocksAvailable();
        if (blocksAvailable) {
          // blocks are available, we carry on with the apply state
          const view = CommonUtils.getTargetView(this);
          const extensionAPI = view.getController().getExtensionAPI();
          this.resetStateToApply();
          return this._applyHandler?.call(extensionAPI, this, controlState);
        } else {
          // blocks are not available hence we sent the apply state to pending.
          this._stateToApply = controlState;
          this._applyStatePending = true;
        }
      }
    }

    /**
     * Trigger state interactions.
     */;
    _proto.triggerStateInteractions = async function triggerStateInteractions() {
      await this._stateHandlersAvailable;
      const retrieveIsRelevant = this._retrieveHandler && this._retrieveStatePending;
      const applyIsRelevant = this._applyHandler && this._applyStatePending;
      if (retrieveIsRelevant) {
        if (applyIsRelevant) {
          // Both retrieve and apply are pending
          this.applyState(this._stateToApply);
        }
        this._retrieveStatePending = false;
        const view = CommonUtils.getTargetView(this);
        const extensionAPI = view.getController().getExtensionAPI();
        // appState update would call the retrieveState.
        await extensionAPI.updateAppState();
      } else if (applyIsRelevant) {
        this.applyState(this._stateToApply);
      }
    }

    /**
     * Reset the state to apply.
     */;
    _proto.resetStateToApply = function resetStateToApply() {
      this._stateToApply = undefined;
      this._applyStatePending = false;
    }

    /**
     * Check for state interactions to trigger.
     * @returns Boolean true if any pending state interactions are executed.
     */;
    _proto.checkForStateInteractions = function checkForStateInteractions() {
      const blocksAvailable = this.isBlocksAvailable();
      if (blocksAvailable) {
        this.triggerStateInteractions();
        return true;
      }
      return false;
    }

    /**
     * Create an instance of a state handler from a function's path.
     * @param stateHandler Path to the state handler.
     * @returns Handler instance to use for state handling.
     */;
    _proto.getStateHandlerInstance = async function getStateHandlerInstance(stateHandler) {
      try {
        if (stateHandler) {
          const handlerModuleName = this.getModulePath(stateHandler);
          const modules = await requireDependencies([handlerModuleName]);
          const handlerName = stateHandler.substring(stateHandler.lastIndexOf(".") + 1);
          const handlerInstance = modules[0][handlerName];
          if (handlerInstance) {
            return handlerInstance;
          } else {
            throw new Error("handler not found");
          }
        }
      } catch (err) {
        Log.warning(`'${this.getId()}' control's state handler '${stateHandler}' couldn't be resolved: ${err}`);
      }
    }

    /**
     * Set the instance of the state handler.
     * @param handlerType Apply or Retrieve.
     * @param stateHandler Path to the handler instance.
     */;
    _proto._setStateHandler = async function _setStateHandler(handlerType, stateHandler) {
      this[`_${handlerType}Handler`] = await this.getStateHandlerInstance(stateHandler);
      this[`${handlerType}StateHandler`] = stateHandler;
    }

    /**
     * Set the apply-state handler.
     * @param applyStateHandler Path to the instance of the apply-state handler.
     * @returns Promise
     */;
    _proto.setApplyStateHandler = async function setApplyStateHandler(applyStateHandler) {
      this._stateHandlersAvailable = (this._stateHandlersAvailable || Promise.resolve()).then(async () => {
        return this._setStateHandler("apply", applyStateHandler);
      });
      return this._stateHandlersAvailable;
    }

    /**
     * Set the retrieve-state handler.
     * @param retrieveStateHandler Path to the instance of the retrieve-state handler.
     * @returns Promise
     */;
    _proto.setRetrieveStateHandler = async function setRetrieveStateHandler(retrieveStateHandler) {
      this._stateHandlersAvailable = (this._stateHandlersAvailable || Promise.resolve()).then(async () => {
        return this._setStateHandler("retrieve", retrieveStateHandler);
      });
      return this._stateHandlersAvailable;
    }

    /**
     * Get the module path of the function.
     * @param handlerPath Path to the handler instance.
     * @returns Module Path
     */;
    _proto.getModulePath = function getModulePath(handlerPath) {
      return handlerPath.substring(0, handlerPath.lastIndexOf(".")).replace(/\./g, "/");
    };
    return BaseStateHandler;
  }(IViewStateContributorMixin);
  _exports = BaseStateHandler;
  return _exports;
}, false);
//# sourceMappingURL=BaseStateHandler-dbg.js.map

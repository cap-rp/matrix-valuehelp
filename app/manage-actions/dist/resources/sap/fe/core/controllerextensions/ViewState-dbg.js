/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/navigation/library", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (Log, mergeObjects, ClassSupport, NavLibrary, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _class, _class2;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  // additionalStates are stored next to control IDs, so name clash avoidance needed. Fortunately IDs have restrictions:
  // "Allowed is a sequence of characters (capital/lowercase), digits, underscores, dashes, points and/or colons."
  // Therefore adding a symbol like # or @
  const NavType = NavLibrary.NavType;

  /**
   * Definition of a navigation parameter
   * @public
   */

  const ADDITIONAL_STATES_KEY = "#additionalStates";

  ///////////////////////////////////////////////////////////////////
  // methods to retrieve & apply states for the different controls //
  ///////////////////////////////////////////////////////////////////

  const getStateUtil = async function () {
    return (await __ui5_require_async("sap/ui/mdc/p13n/StateUtil")).default;
  };
  const _mControlStateHandlerMap = {
    "sap.ui.fl.variants.VariantManagement": {
      retrieve: function (oVM) {
        return {
          variantId: oVM.getCurrentVariantKey()
        };
      },
      apply: async function (oVM, controlState) {
        try {
          if (controlState && controlState.variantId !== undefined && controlState.variantId !== oVM.getCurrentVariantKey()) {
            const isVariantIdAvailable = this._checkIfVariantIdIsAvailable(oVM, controlState.variantId);
            let sVariantReference;
            if (isVariantIdAvailable) {
              sVariantReference = controlState.variantId;
            } else {
              sVariantReference = oVM.getStandardVariantKey();
              this.controlsVariantIdUnavailable.push(...oVM.getFor());
            }
            try {
              const ControlVariantApplyAPI = (await __ui5_require_async("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
              await ControlVariantApplyAPI.activateVariant({
                element: oVM,
                variantReference: sVariantReference
              });
              await this._setInitialStatesForDeltaCompute(oVM);
            } catch (error) {
              Log.error(error);
              this.invalidateInitialStateForApply.push(...oVM.getFor());
              await this._setInitialStatesForDeltaCompute(oVM);
            }
          } else {
            this._setInitialStatesForDeltaCompute(oVM);
          }
        } catch (error) {
          Log.error(error);
        }
      }
    },
    "sap.fe.templates.ListReport.controls.MultipleModeControl": {
      retrieve: function (multipleModeControl) {
        return {
          selectedKey: multipleModeControl.content.getSelectedKey()
        };
      },
      apply: function (multipleModeControl, controlState) {
        if (controlState?.selectedKey) {
          const tabBar = multipleModeControl.content;
          const selectedItem = tabBar.getItems().find(item => item.getKey() === controlState.selectedKey);
          if (selectedItem) {
            tabBar.setSelectedKey(controlState.selectedKey);
            if (multipleModeControl.getModel("_pageModel")?.getProperty("/hideFilterBar") === true) {
              multipleModeControl.refreshSelectedInnerControlContent();
            }
          }
        }
      }
    },
    "sap.ui.mdc.Table": {
      refreshBinding: function (oTable) {
        const oTableBinding = oTable.getRowBinding();
        if (oTableBinding) {
          const oRootBinding = oTableBinding.getRootBinding();
          const aggregation = oTableBinding.getAggregation();
          if (oRootBinding === oTableBinding && aggregation?.hierarchyQualifier === undefined) {
            // absolute binding (except TreeTable, where we want to keep expansion states)
            oTableBinding.refresh();
          } else {
            // relative binding or TreeTable
            const oHeaderContext = oTableBinding.getHeaderContext();
            const sGroupId = oTableBinding.getGroupId();
            if (oHeaderContext) {
              oHeaderContext.requestSideEffects([{
                $NavigationPropertyPath: ""
              }], sGroupId);
            }
          }
        } else {
          Log.info(`Table: ${oTable.getId()} was not refreshed. No binding found!`);
        }
      }
    },
    "sap.m.SegmentedButton": {
      retrieve: function (oSegmentedButton) {
        return {
          selectedKey: oSegmentedButton.getSelectedKey()
        };
      },
      apply: function (oSegmentedButton, oControlState) {
        if (oControlState?.selectedKey && oControlState.selectedKey !== oSegmentedButton.getSelectedKey()) {
          oSegmentedButton.setSelectedKey(oControlState.selectedKey);
          if (oSegmentedButton.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
            oSegmentedButton.fireEvent("selectionChange");
          }
        }
      }
    },
    "sap.m.Select": {
      retrieve: function (oSelect) {
        return {
          selectedKey: oSelect.getSelectedKey()
        };
      },
      apply: function (oSelect, oControlState) {
        if (oControlState?.selectedKey && oControlState.selectedKey !== oSelect.getSelectedKey()) {
          oSelect.setSelectedKey(oControlState.selectedKey);
          if (oSelect.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
            oSelect.fireEvent("change");
          }
        }
      }
    },
    "sap.f.DynamicPage": {
      retrieve: function (oDynamicPage) {
        return {
          headerExpanded: oDynamicPage.getHeaderExpanded()
        };
      },
      apply: function (oDynamicPage, oControlState) {
        if (oControlState) {
          oDynamicPage.setHeaderExpanded(oControlState.headerExpanded);
        }
      }
    },
    "sap.ui.core.mvc.View": {
      retrieve: function (oView) {
        const oController = oView.getController();
        if (oController && oController.viewState) {
          return oController.viewState.retrieveViewState();
        }
        return {};
      },
      apply: async function (oView, oControlState, oNavParameters, skipMerge) {
        const oController = oView.getController();
        if (oController && oController.viewState && oNavParameters) {
          return oController.viewState.applyViewState(oControlState, oNavParameters, skipMerge);
        }
      },
      refreshBinding: async function (oView) {
        const oController = oView.getController();
        if (oController && oController.viewState) {
          return oController.viewState.refreshViewBindings();
        }
      }
    },
    "sap.ui.core.ComponentContainer": {
      retrieve: async function (oComponentContainer) {
        const oComponent = oComponentContainer.getComponentInstance();
        if (oComponent) {
          return this.retrieveControlState(oComponent.getRootControl());
        }
        return {};
      },
      apply: async function (oComponentContainer, oControlState, oNavParameters) {
        const oComponent = oComponentContainer.getComponentInstance();
        if (oComponent) {
          return this.applyControlState(oComponent.getRootControl(), oControlState, oNavParameters);
        }
      }
    }
  };
  /**
   * A controller extension offering hooks for state handling
   *
   * If you need to maintain a specific state for your application, you can use the controller extension.
   * @hideconstructor
   * @public
   * @since 1.85.0
   */
  let ViewState = (_dec = defineUI5Class("sap.fe.core.controllerextensions.ViewState"), _dec2 = publicExtension(), _dec3 = finalExtension(), _dec4 = publicExtension(), _dec5 = extensible(OverrideExecution.After), _dec6 = privateExtension(), _dec7 = finalExtension(), _dec8 = privateExtension(), _dec9 = finalExtension(), _dec10 = publicExtension(), _dec11 = extensible(OverrideExecution.After), _dec12 = publicExtension(), _dec13 = extensible(OverrideExecution.After), _dec14 = publicExtension(), _dec15 = extensible(OverrideExecution.After), _dec16 = privateExtension(), _dec17 = finalExtension(), _dec18 = publicExtension(), _dec19 = extensible(OverrideExecution.After), _dec20 = privateExtension(), _dec21 = finalExtension(), _dec22 = publicExtension(), _dec23 = extensible(OverrideExecution.After), _dec24 = publicExtension(), _dec25 = finalExtension(), _dec26 = privateExtension(), _dec27 = finalExtension(), _dec28 = publicExtension(), _dec29 = finalExtension(), _dec30 = publicExtension(), _dec31 = extensible(OverrideExecution.After), _dec32 = privateExtension(), _dec33 = finalExtension(), _dec34 = publicExtension(), _dec35 = extensible(OverrideExecution.Instead), _dec36 = publicExtension(), _dec37 = finalExtension(), _dec38 = privateExtension(), _dec39 = publicExtension(), _dec40 = extensible(OverrideExecution.After), _dec41 = publicExtension(), _dec42 = extensible(OverrideExecution.After), _dec43 = publicExtension(), _dec44 = extensible(OverrideExecution.After), _dec45 = publicExtension(), _dec46 = extensible(OverrideExecution.After), _dec47 = privateExtension(), _dec48 = finalExtension(), _dec49 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    /**
     * Constructor.
     */
    function ViewState() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this._retrieveCalls = [];
      _this.initialControlStatesMapper = {};
      _this.controlsVariantIdUnavailable = [];
      _this.invalidateInitialStateForApply = [];
      _this.viewStateControls = [];
      _this.stateContributors = [];
      //method to store the initial states for delta computation of mdc controls
      _this._setInitialStatesForDeltaCompute = async variantManagement => {
        try {
          const adaptControls = _this.viewStateControls;
          const externalStatePromises = [];
          const controlStateKey = [];
          let initialControlStates = [];
          const variantControls = variantManagement?.getFor() ?? [];
          _this.updateInitialState(variantControls);
          await Promise.all(adaptControls.filter(function (control) {
            return control && (!variantManagement || variantControls.includes(control.getId())) && (control.isA("sap.ui.mdc.Table") || control.isA("sap.ui.mdc.FilterBar") || control.isA("sap.ui.mdc.Chart"));
          }).map(async control => {
            if (variantManagement) {
              _this._addEventListenersToVariantManagement(variantManagement, variantControls);
            }
            const externalStatePromise = (await getStateUtil()).retrieveExternalState(control);
            externalStatePromises.push(externalStatePromise);
            controlStateKey.push(_this.getStateKey(control));
          }));
          initialControlStates = await Promise.all(externalStatePromises);
          initialControlStates.forEach((initialControlState, i) => {
            _this.initialControlStatesMapper[controlStateKey[i]] = initialControlState;
          });
        } catch (e) {
          Log.error(e);
        }
      };
      _this._retrieveCalls = [];
      _this._pInitialStateApplied = new Promise(resolve => {
        _this._pInitialStateAppliedResolve = resolve;
      });
      return _this;
    }
    _inheritsLoose(ViewState, _ControllerExtension);
    var _proto = ViewState.prototype;
    _proto.refreshViewBindings = async function refreshViewBindings() {
      const aControls = await this.collectResults(this.base.viewState.adaptBindingRefreshControls);
      let oPromiseChain = Promise.resolve();
      aControls.filter(oControl => {
        return oControl && oControl.isA && oControl.isA("sap.ui.base.ManagedObject");
      }).forEach(oControl => {
        oPromiseChain = oPromiseChain.then(this.refreshControlBinding.bind(this, oControl));
      });
      return oPromiseChain;
    }

    /**
     * This function should add all controls relevant for refreshing to the provided control array.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param aCollectedControls The collected controls
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptBindingRefreshControls = function adaptBindingRefreshControls(aCollectedControls) {
      // to be overriden
    };
    _proto.refreshControlBinding = async function refreshControlBinding(oControl) {
      const oControlRefreshBindingHandler = this.getControlRefreshBindingHandler(oControl);
      let oPromiseChain = Promise.resolve();
      if (typeof oControlRefreshBindingHandler.refreshBinding !== "function") {
        Log.info(`refreshBinding handler for control: ${oControl.getMetadata().getName()} is not provided`);
      } else {
        oPromiseChain = oPromiseChain.then(oControlRefreshBindingHandler.refreshBinding.bind(this, oControl));
      }
      return oPromiseChain;
    }

    /**
     * Returns a map of <code>refreshBinding</code> function for a certain control.
     * @param oControl The control to get state handler for
     * @returns A plain object with one function: <code>refreshBinding</code>
     */;
    _proto.getControlRefreshBindingHandler = function getControlRefreshBindingHandler(oControl) {
      const oRefreshBindingHandler = {};
      if (oControl) {
        for (const sType in _mControlStateHandlerMap) {
          if (oControl.isA(sType)) {
            // pass only the refreshBinding handler in an object so that :
            // 1. Application has access only to refreshBinding and not apply and reterive at this stage
            // 2. Application modifications to the object will be reflected here (as we pass by reference)
            oRefreshBindingHandler["refreshBinding"] = _mControlStateHandlerMap[sType].refreshBinding || {};
            break;
          }
        }
      }
      this.base.viewState.adaptBindingRefreshHandler(oControl, oRefreshBindingHandler);
      return oRefreshBindingHandler;
    }

    /**
     * Customize the <code>refreshBinding</code> function for a certain control.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _oControl The control for which the refresh handler is adapted.
     * @param _oControlHandler A plain object which can have one function: <code>refreshBinding</code>
     * @param _oControlHandler.refreshBinding
     * @protected
     */;
    _proto.adaptBindingRefreshHandler = function adaptBindingRefreshHandler(_oControl, _oControlHandler) {
      // to be overriden
    }

    /**
     * Called when the application is suspended due to keep-alive mode.
     * @public
     */;
    _proto.onSuspend = function onSuspend() {
      // to be overriden
    }

    /**
     * Called when the application is restored due to keep-alive mode.
     * @public
     */;
    _proto.onRestore = function onRestore() {
      // to be overriden
    }

    /**
     * Destructor method for objects.
     */;
    _proto.destroy = function destroy() {
      delete this._pInitialStateAppliedResolve;
      _ControllerExtension.prototype.destroy.call(this);
    }

    /**
     * Helper function to enable multi override. It is adding an additional parameter (array) to the provided
     * function (and its parameters), that will be evaluated via <code>Promise.all</code>.
     * @param fnCall The function to be called
     * @param args
     * @returns A promise to be resolved with the result of all overrides
     */;
    _proto.collectResults = async function collectResults(fnCall) {
      const aResults = [];
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      args.push(aResults);
      fnCall.apply(this, args);
      return Promise.all(aResults);
    }

    /**
     * Customize the <code>retrieve</code> and <code>apply</code> functions for a certain control.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param oControl The control to get state handler for
     * @param aControlHandler A list of plain objects with two functions: <code>retrieve</code> and <code>apply</code>
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptControlStateHandler = function adaptControlStateHandler(oControl, aControlHandler) {
      // to be overridden if needed
    }

    /**
     * Returns a map of <code>retrieve</code> and <code>apply</code> functions for a certain control.
     * @param oControl The control to get state handler for
     * @returns A plain object with two functions: <code>retrieve</code> and <code>apply</code>
     */;
    _proto.getControlStateHandler = function getControlStateHandler(oControl) {
      const aInternalControlStateHandler = [],
        aCustomControlStateHandler = [];
      if (oControl) {
        if (oControl.isA("sap.fe.core.controllerextensions.viewState.IViewStateContributor") && oControl.retrieveState && oControl.applyState) {
          aInternalControlStateHandler.push({
            // eslint-disable-next-line @typescript-eslint/require-await
            retrieve: async _control => oControl.retrieveState.bind(oControl)(),
            apply: async (_control, controlState, oNavParameters, skipMerge) => {
              const shouldApplyDiffState = !this.invalidateInitialStateForApply.includes(oControl.getId()) && !this.controlsVariantIdUnavailable.includes(oControl.getId()) && oNavParameters?.navigationType !== NavType.hybrid && skipMerge !== true;
              if (!controlState) {
                if (oControl.applyLegacyState) {
                  await oControl.applyLegacyState.bind(oControl)(this.getControlState.bind(this), oNavParameters, shouldApplyDiffState, skipMerge);
                }
              } else {
                await oControl.applyState.bind(oControl)(controlState, oNavParameters, shouldApplyDiffState, skipMerge);
              }
            }
          });
        } else {
          for (const sType in _mControlStateHandlerMap) {
            if (oControl.isA(sType)) {
              // avoid direct manipulation of internal _mControlStateHandlerMap
              aInternalControlStateHandler.push(Object.assign({}, _mControlStateHandlerMap[sType]));
              break;
            }
          }
        }
      }
      this.base.viewState.adaptControlStateHandler(oControl, aCustomControlStateHandler);
      return aInternalControlStateHandler.concat(aCustomControlStateHandler);
    }

    /**
     * This function should add all controls for given view that should be considered for the state handling to the provided control array.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _aCollectedControls The collected controls
     * @protected
     */;
    _proto.adaptStateControls = function adaptStateControls(_aCollectedControls) {
      _aCollectedControls.push(...this.stateContributors);
    }

    /**
     * Returns the key to be used for given control.
     * @param oControl The control to get state key for
     * @returns The key to be used for storing the controls state
     */;
    _proto.getStateKey = function getStateKey(oControl) {
      return this.getView().getLocalId(oControl.getId()) || oControl.getId();
    }

    /**
     * Retrieve the view state of this extensions view.
     * @returns A promise resolving the view state
     */;
    _proto._retrieveViewState = async function _retrieveViewState() {
      let oViewState = {};
      try {
        await this._pInitialStateApplied;
        const aControls = await this.collectResults(this.base.viewState.adaptStateControls);
        const aResolvedStates = await Promise.all(aControls.filter(function (oControl) {
          return oControl && oControl.isA && oControl.isA("sap.ui.base.ManagedObject");
        }).map(async oControl => {
          return this.retrieveControlState(oControl).then(vResult => {
            return {
              key: this.getStateKey(oControl),
              value: vResult
            };
          });
        }));
        oViewState = aResolvedStates.reduce(function (oStates, mState) {
          const oCurrentState = {};
          oCurrentState[mState.key] = mState.value;
          return mergeObjects(oStates, oCurrentState);
        }, {});
        const prevState = this._currentViewState;
        if (prevState && Object.keys(prevState).length > 0) {
          this._addMissingState(oViewState, prevState);
        }
        const mAdditionalStates = await Promise.resolve(this._retrieveAdditionalStates());
        if (mAdditionalStates && Object.keys(mAdditionalStates).length) {
          oViewState[ADDITIONAL_STATES_KEY] = mAdditionalStates;
        }
      } catch (err) {
        const viewId = this.getView().getId();
        Log.error(`ViewState : ${viewId} : failed to retrieve state!`);
      }
      return oViewState;
    }

    /**
     * Retrieve the view state of this extensions view.
     * @returns A promise resolving the view state
     * @public
     */;
    _proto.retrieveViewState = async function retrieveViewState() {
      const presentRetrieveCall = this._retrieveViewState();
      this._retrieveCalls.push(presentRetrieveCall);
      await presentRetrieveCall;

      // If there have been subsequent retrieve calls on the same view state controller extension before earlier retrieval is complete, we await for the latest result.
      // We shall return the same view state for all pending retrieve calls.
      const viewStateResults = await Promise.allSettled(this._retrieveCalls);
      const viewStateSettledPromise = viewStateResults[viewStateResults.length - 1];
      const viewState = viewStateSettledPromise.status === "fulfilled" ? viewStateSettledPromise.value : undefined;
      this._currentViewState = viewState;
      return viewState;
    }

    // To carry forward unapplied state lost due to lazy loading of controls.
    //
    // If user 1 changes a control's state in a lazy-loaded section and navigates away, then shares the URL with user 2,
    // who doesn't visit the lazy-loaded section, the control's state is missed in the new app state.
    // This ensures the full state from user 1 is preserved and transferred to user 3 when the URL is shared.
    ;
    _proto._addMissingState = function _addMissingState(oViewState, prevState) {
      for (const key in prevState) {
        if (!(key in oViewState)) {
          oViewState[key] = prevState[key];
        }
      }
    }

    /**
     * Extend the map of additional states (not control bound) to be added to the current view state of the given view.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param mAdditionalStates The additional state
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    retrieveAdditionalStates = function retrieveAdditionalStates(mAdditionalStates) {
      // to be overridden if needed
    }

    /**
     * Returns a map of additional states (not control bound) to be added to the current view state of the given view.
     * @returns Additional view states
     */;
    _proto._retrieveAdditionalStates = function _retrieveAdditionalStates() {
      const mAdditionalStates = {};
      this.base.viewState.retrieveAdditionalStates(mAdditionalStates);
      return mAdditionalStates;
    }

    /**
     * Returns the current state for the given control.
     * @param oControl The object to get the state for
     * @returns The state for the given control
     */;
    _proto.retrieveControlState = async function retrieveControlState(oControl) {
      const aControlStateHandlers = this.getControlStateHandler(oControl);
      return Promise.all(aControlStateHandlers.map(async mControlStateHandler => {
        if (typeof mControlStateHandler.retrieve !== "function") {
          throw new Error(`controlStateHandler.retrieve is not a function for control: ${oControl.getMetadata().getName()}`);
        }
        return mControlStateHandler.retrieve.call(this, oControl);
      })).then(aStates => {
        return aStates.reduce(function (oFinalState, oCurrentState) {
          return mergeObjects(oFinalState, oCurrentState);
        }, {});
      });
    }

    /**
     * Defines whether the view state should only be applied once initially.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
     *
     * Important:
     * You should only override this method for custom pages and not for the standard ListReportPage and ObjectPage!
     * @returns If <code>true</code>, only the initial view state is applied once,
     * else any new view state is also applied on follow-up calls (default)
     * @protected
     */;
    _proto.applyInitialStateOnly = function applyInitialStateOnly() {
      return true;
    }

    /**
     * Retrieves the state of a specific control.
     * @param control The managed control object whose state is to be retrieved.
     * @returns - The state of the specified control.
     */;
    _proto.getControlState = function getControlState(control) {
      const oViewState = this._currentViewState;
      let controlState = {};
      if (oViewState) {
        const controlKey = this.getStateKey(control);
        controlState = oViewState[controlKey];
      }
      return controlState;
    }

    /**
     * Applies the given view state to this extensions view.
     * @param oViewState The view state to apply (can be undefined)
     * @param oNavParameter The current navigation parameter
     * @param oNavParameter.navigationType The actual navigation type
     * @param oNavParameter.selectionVariant The selectionVariant from the navigation
     * @param oNavParameter.selectionVariantDefaults The selectionVariant defaults from the navigation
     * @param oNavParameter.requiresStandardVariant Defines whether the standard variant must be used in variant management
     * @param skipMerge Boolean which determines to skip the key user shine through
     * @returns Promise for async state handling
     * @public
     */;
    _proto.applyViewState = async function applyViewState(oViewState, oNavParameter, skipMerge) {
      if (this.base.viewState.applyInitialStateOnly() && this._getInitialStateApplied()) {
        return;
      }
      try {
        //SNOW: CS20230006765897 For transient AppState, we return without applying the state to controls in RootContainer's children views as there is no state to apply
        //Only need is to resolve the _pInitialStateApplied so that update of AppState can still happen
        if (this._isStateEmptyForIAppStateNavType(oViewState, oNavParameter.navigationType) && !this.__isRootViewController()) {
          return;
        }
        await this.collectResults(this.base.viewState.onBeforeStateApplied, [], oNavParameter.navigationType);
        const aControls = await this.collectResults(this.base.viewState.adaptStateControls);
        this.viewStateControls = aControls;
        let oPromiseChain = Promise.resolve();
        let hasVariantManagement = false;
        this._currentViewState = oViewState;
        this.configOfStateApply = this.configOfStateApply ?? {};
        this.configOfStateApply.skipMerge = skipMerge;
        this.configOfStateApply.navTypeParameters = oNavParameter;
        this.configOfStateApply.state = oViewState;

        /**
         * This ensures that variantManagement control is applied first to calculate the initial state for delta logic
         */
        const sortedAdaptStateControls = aControls.reduce((modifiedControls, control) => {
          if (!control) {
            return modifiedControls;
          }
          const isVariantManagementControl = control.isA("sap.ui.fl.variants.VariantManagement");
          if (!hasVariantManagement) {
            hasVariantManagement = isVariantManagementControl;
          }
          modifiedControls = isVariantManagementControl ? [control, ...modifiedControls] : [...modifiedControls, control];
          return modifiedControls;
        }, []);

        // In case of no Variant Management, this ensures that initial states is set
        if (!hasVariantManagement) {
          this._setInitialStatesForDeltaCompute();
        }
        sortedAdaptStateControls.filter(function (oControl) {
          return oControl.isA("sap.ui.base.ManagedObject");
        }).forEach(oControl => {
          const sKey = this.getStateKey(oControl);
          oPromiseChain = oPromiseChain.then(this.applyControlState.bind(this, oControl, oViewState ? oViewState[sKey] : undefined, oNavParameter, skipMerge ?? false));
        });
        await oPromiseChain;
        if (oNavParameter.navigationType === NavType.iAppState || oNavParameter.navigationType === NavType.hybrid) {
          await this.collectResults(this.base.viewState.applyAdditionalStates, oViewState ? oViewState[ADDITIONAL_STATES_KEY] : undefined);
        } else {
          await this.collectResults(this.base.viewState.applyNavigationParameters, oNavParameter);
          const promises = [];
          this._getPromisesForAdaptControls(sortedAdaptStateControls, oNavParameter, promises);
          await Promise.all(promises);
        }
      } finally {
        try {
          if (!this._isStateEmptyForIAppStateNavType(oViewState, oNavParameter.navigationType)) {
            await this.collectResults(this.base.viewState.onAfterStateApplied);
          }
          this._setInitialStateApplied();
        } catch (e) {
          Log.error(e);
        }
      }
    };
    _proto._getPromisesForAdaptControls = function _getPromisesForAdaptControls(sortedAdaptStateControls, navParameter, promises) {
      sortedAdaptStateControls.filter(function (control) {
        return control.isA("sap.ui.base.ManagedObject");
      }).forEach(control => {
        if (control.isA("sap.fe.core.controllerextensions.viewState.IViewStateContributor") && control.applyNavigationParameters) promises.push(control.applyNavigationParameters(navParameter));
      });
      return promises;
    };
    _proto._checkIfVariantIdIsAvailable = function _checkIfVariantIdIsAvailable(oVM, sVariantId) {
      const aVariants = oVM.getVariants();
      let bIsControlStateVariantAvailable = false;
      aVariants.forEach(function (oVariant) {
        if (oVariant.getKey() === sVariantId) {
          bIsControlStateVariantAvailable = true;
        }
      });
      return bIsControlStateVariantAvailable;
    };
    _proto._setInitialStateApplied = function _setInitialStateApplied() {
      if (this._pInitialStateAppliedResolve) {
        const pInitialStateAppliedResolve = this._pInitialStateAppliedResolve;
        delete this._pInitialStateAppliedResolve;
        pInitialStateAppliedResolve();
      }
    };
    _proto._getInitialStateApplied = function _getInitialStateApplied() {
      return !this._pInitialStateAppliedResolve;
    };
    _proto._isStateEmptyForIAppStateNavType = function _isStateEmptyForIAppStateNavType(viewState, navType) {
      return (!viewState || Object.keys(viewState).length === 0) && navType == NavType.iAppState;
    };
    _proto.__isRootViewController = function __isRootViewController() {
      const rootViewController = this.base.getView().getController();
      return rootViewController.isA("sap.fe.core.rootView.NavContainer") || rootViewController.isA("sap.fe.core.rootView.Fcl");
    }

    /**
     * Hook to react before a state for given view is applied.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @param navigationType Navigation type responsible for the applying the state
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeStateApplied = function onBeforeStateApplied(aPromises, navigationType) {
      // to be overriden
    }

    /**
     * Hook to react when state for given view was applied.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterStateApplied = function onAfterStateApplied(aPromises) {
      // to be overriden
    }

    /**
     * Applying additional, not control related, states - is called only if navigation type is iAppState.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param oViewState The current view state
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applyAdditionalStates = function applyAdditionalStates(oViewState, aPromises) {
      // to be overridden if needed
    }

    /**
     * Apply navigation parameters is not called if the navigation type is iAppState
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param oNavParameter The current navigation parameter
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.applyNavigationParameters = function applyNavigationParameters(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    oNavParameter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    aPromises) {
      // to be overridden if needed
    }

    /**
     * Applying the given state to the given control.
     * @param oControl The object to apply the given state
     * @param oControlState The state for the given control
     * @param [oNavParameters] The current navigation parameters
     * @param [skipMerge] Whether merge should be skipped or not
     * @returns Return a promise for async state handling
     */;
    _proto.applyControlState = async function applyControlState(oControl, oControlState, oNavParameters, skipMerge) {
      const aControlStateHandlers = this.getControlStateHandler(oControl);
      let oPromiseChain = Promise.resolve();
      aControlStateHandlers.forEach(mControlStateHandler => {
        if (typeof mControlStateHandler.apply !== "function") {
          throw new Error(`controlStateHandler.apply is not a function for control: ${oControl.getMetadata().getName()}`);
        }
        oPromiseChain = oPromiseChain.then(mControlStateHandler.apply.bind(this, oControl, oControlState, oNavParameters, skipMerge));
      });
      return oPromiseChain;
    };
    _proto.updateAppStateDebounced = function updateAppStateDebounced() {
      if (this.updateAppStateTimer) {
        clearTimeout(this.updateAppStateTimer);
      }
      this.updateAppStateTimer = setTimeout(() => {
        this.base.getExtensionAPI().updateAppState();
      }, 200);
    }

    /**
     * Register a dedicated IViewStateContributor into the whole view state handling.
     * @param stateContributor The ViewStateContributor to register
     */;
    _proto.registerStateContributor = function registerStateContributor(stateContributor) {
      if (this.stateContributors.includes(stateContributor)) {
        // no need to register the same control again
        return;
      }
      this.stateContributors.push(stateContributor);
      if (this._currentViewState) {
        const controlKey = this.getStateKey(stateContributor);
        const controlState = this._currentViewState[controlKey];
        const navigationType = this.configOfStateApply?.navTypeParameters?.navigationType;
        const skipMerge = this.configOfStateApply?.skipMerge;
        if (controlState && controlState === this.configOfStateApply?.state?.[controlKey]) {
          // To check whether diffstate shuold be called or not to applyExternalState
          const shouldApplyDiffState = !this.invalidateInitialStateForApply.includes(stateContributor.getId()) && !this.controlsVariantIdUnavailable.includes(stateContributor.getId()) && navigationType !== NavType.hybrid && skipMerge !== true;
          stateContributor.applyState(controlState, undefined, shouldApplyDiffState);
        } else {
          this.updateAppStateDebounced();
        }
      }
    }

    /**
     * Deregister a dedicated IViewStateContributor from the whole view state handling.
     * @param stateContributor The ViewStateContributor to deregister
     */;
    _proto.deregisterStateContributor = function deregisterStateContributor(stateContributor) {
      const targetIndex = this.stateContributors.findIndex(contributor => contributor == stateContributor);
      if (targetIndex !== -1) {
        this.stateContributors.splice(targetIndex, 1);
      }
    };
    _proto.getInterface = function getInterface() {
      return this;
    }

    // method to get the control state for mdc controls applying the delta logic
    ;
    _proto._getControlState = function _getControlState(controlStateKey, controlState) {
      const initialControlStatesMapper = this.initialControlStatesMapper;
      if (Object.keys(initialControlStatesMapper).length > 0 && initialControlStatesMapper[controlStateKey]) {
        if (Object.keys(initialControlStatesMapper[controlStateKey]).length === 0) {
          initialControlStatesMapper[controlStateKey] = {
            ...controlState
          };
        }
        return {
          fullState: controlState,
          initialState: initialControlStatesMapper[controlStateKey]
        };
      }
      return controlState;
    };
    // Attach event to save and select of Variant Management to update the initial Control States on variant change
    _proto._addEventListenersToVariantManagement = function _addEventListenersToVariantManagement(variantManagement, variantControls) {
      const oPayload = {
        variantManagedControls: variantControls
      };
      const fnEvent = () => {
        this._updateInitialStatesOnVariantChange(variantControls);
      };
      variantManagement.attachSave(oPayload, fnEvent, {});
      variantManagement.attachSelect(oPayload, fnEvent, {});
    };
    _proto._updateInitialStatesOnVariantChange = function _updateInitialStatesOnVariantChange(vmAssociatedControlsToReset) {
      const initialControlStatesMapper = this.initialControlStatesMapper;
      Object.keys(initialControlStatesMapper).forEach(controlKey => {
        for (const vmAssociatedcontrolKey of vmAssociatedControlsToReset) {
          if (vmAssociatedcontrolKey.includes(controlKey)) {
            initialControlStatesMapper[controlKey] = {};
          }
        }
      });
      this.updateInitialState(vmAssociatedControlsToReset);
    }

    /**
     * Updates the initial state of the specified variant controls.
     * @param variantControls An array of control IDs for which the initial state needs to be updated.
     * @returns A promise that resolves when the initial state update is complete.
     */;
    _proto.updateInitialState = async function updateInitialState(variantControls) {
      const viewControls = this.stateContributors;
      await Promise.all(viewControls.map(async control => {
        const controlId = control?.getId();
        if (variantControls.includes(controlId) && control?.isA("sap.fe.core.controllerextensions.viewState.IViewStateContributor") && control.setInitialState) {
          await control.setInitialState();
        }
      }));
    };
    _proto._isInitialStatesApplicable = function _isInitialStatesApplicable(initialState, control, skipMerge, isNavHybrid) {
      return !!initialState && !this.invalidateInitialStateForApply.includes(control.getId()) && !this.controlsVariantIdUnavailable.includes(control.getId()) && (isNavHybrid ?? true) && skipMerge !== true;
    };
    return ViewState;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "refreshViewBindings", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "refreshViewBindings"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptBindingRefreshControls", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptBindingRefreshControls"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "refreshControlBinding", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "refreshControlBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getControlRefreshBindingHandler", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "getControlRefreshBindingHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptBindingRefreshHandler", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptBindingRefreshHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onSuspend", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "onSuspend"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRestore", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "onRestore"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectResults", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "collectResults"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptControlStateHandler", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptControlStateHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getControlStateHandler", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "getControlStateHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptStateControls", [_dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptStateControls"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getStateKey", [_dec24, _dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "getStateKey"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_retrieveViewState", [_dec26, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "_retrieveViewState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveViewState", [_dec28, _dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveViewState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveAdditionalStates", [_dec30, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveAdditionalStates"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveControlState", [_dec32, _dec33], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveControlState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyInitialStateOnly", [_dec34, _dec35], Object.getOwnPropertyDescriptor(_class2.prototype, "applyInitialStateOnly"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyViewState", [_dec36, _dec37], Object.getOwnPropertyDescriptor(_class2.prototype, "applyViewState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_checkIfVariantIdIsAvailable", [_dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "_checkIfVariantIdIsAvailable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeStateApplied", [_dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeStateApplied"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterStateApplied", [_dec41, _dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterStateApplied"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyAdditionalStates", [_dec43, _dec44], Object.getOwnPropertyDescriptor(_class2.prototype, "applyAdditionalStates"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyNavigationParameters", [_dec45, _dec46], Object.getOwnPropertyDescriptor(_class2.prototype, "applyNavigationParameters"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyControlState", [_dec47, _dec48], Object.getOwnPropertyDescriptor(_class2.prototype, "applyControlState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "updateAppStateDebounced", [_dec49], Object.getOwnPropertyDescriptor(_class2.prototype, "updateAppStateDebounced"), _class2.prototype), _class2)) || _class);
  return ViewState;
}, false);
//# sourceMappingURL=ViewState-dbg.js.map

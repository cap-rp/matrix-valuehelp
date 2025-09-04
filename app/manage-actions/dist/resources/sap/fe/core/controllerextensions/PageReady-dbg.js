/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/controllerextensions/pageReady/DataQueryWatcher", "sap/fe/core/services/TemplatedViewServiceFactory", "sap/ui/base/EventProvider", "sap/ui/core/Component", "sap/ui/core/Rendering", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../CommonUtils"], function (Log, ClassSupport, DataQueryWatcher, TemplatedViewServiceFactory, EventProvider, Component, Rendering, ControllerExtension, OverrideExecution, CommonUtils) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  let PageReadyControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.PageReady"), _dec2 = methodOverride(), _dec3 = methodOverride(), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = methodOverride("_routing"), _dec7 = methodOverride("_routing"), _dec8 = methodOverride("_routing"), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = publicExtension(), _dec12 = finalExtension(), _dec13 = publicExtension(), _dec14 = finalExtension(), _dec15 = publicExtension(), _dec16 = finalExtension(), _dec17 = publicExtension(), _dec18 = finalExtension(), _dec19 = privateExtension(), _dec20 = extensible(OverrideExecution.Instead), _dec21 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function PageReadyControllerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.pageReadyTimeoutDefault = 7000;
      return _this;
    }
    _inheritsLoose(PageReadyControllerExtension, _ControllerExtension);
    var _proto = PageReadyControllerExtension.prototype;
    _proto.onInit = function onInit() {
      this._nbWaits = 0;
      this._oEventProvider = this._oEventProvider ? this._oEventProvider : new EventProvider();
      this.view = this.getView();
      this.appComponent = CommonUtils.getAppComponent(this.view);
      this.pageComponent = Component.getOwnerComponentFor(this.view);
      const manifestContent = this.appComponent.getManifest();
      this.pageReadyTimeout = manifestContent["sap.ui5"]?.pageReadyTimeout ?? this.pageReadyTimeoutDefault;
      if (this.pageComponent?.attachContainerDefined) {
        this.pageComponent.attachContainerDefined(oEvent => this.registerContainer(oEvent.getParameter("container")));
      } else {
        this.registerContainer(this.view);
      }
      const rootControlController = this.appComponent.getRootControl().getController();
      const placeholder = rootControlController?.getPlaceholder?.();
      if (placeholder?.isPlaceholderDebugEnabled()) {
        this.attachEvent("pageReady", null, () => {
          placeholder.getPlaceholderDebugStats().iPageReadyEventTimestamp = Date.now();
        }, this);
        this.attachEvent("heroesBatchReceived", null, () => {
          placeholder.getPlaceholderDebugStats().iHeroesBatchReceivedEventTimestamp = Date.now();
        }, this);
      }
      this.queryWatcher = new DataQueryWatcher(this._oEventProvider, this.checkPageReadyDebounced.bind(this));
    };
    _proto.onExit = function onExit() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oAppComponent;
      if (this._oContainer && this._fnContainerDelegate) {
        this._oContainer.removeEventDelegate(this._fnContainerDelegate);
      }
    };
    _proto.waitFor = function waitFor(oPromise) {
      this._nbWaits++;
      oPromise.finally(() => {
        setTimeout(() => {
          this._nbWaits--;
        }, 0);
      }).catch(null);
    };
    _proto.onRouteMatched = function onRouteMatched() {
      this._bIsPageReady = false;
    };
    _proto.onRouteMatchedFinished = async function onRouteMatchedFinished() {
      await this.onAfterBindingPromise;
      this.checkPageReadyDebounced();
    };
    _proto.registerAggregatedControls = function registerAggregatedControls(mainBindingContext) {
      if (mainBindingContext) {
        const mainObjectBinding = mainBindingContext.getBinding();
        this.queryWatcher.registerBinding(mainObjectBinding);
      }
      const promises = [];
      const controls = this.getView().findAggregatedObjects(true);
      controls.forEach(element => {
        const objectBinding = element.getObjectBinding();
        if (objectBinding) {
          // Register on all object binding (mostly used on object pages)
          this.queryWatcher.registerBinding(objectBinding);
        } else {
          const aBindingKeys = Object.keys(element?.mBindingInfos ?? {});
          aBindingKeys.forEach(propertyName => {
            const listBinding = element?.mBindingInfos?.[propertyName].binding;
            if (listBinding && listBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
              this.queryWatcher.registerBinding(listBinding);
            }
          });
        }
        // This is dirty but MDCTables and MDCCharts have a weird loading lifecycle
        if (element.isA("sap.fe.macros.table.TableAPI") || element.isA("sap.fe.macros.Chart")) {
          const tableOrChart = element.getContent?.() ?? element.getChartControl();
          this.bTablesChartsLoaded = false;
          promises.push(this.queryWatcher.registerTableOrChart(tableOrChart));
        } else if (element.isA("sap.fe.macros.controls.FilterBar")) {
          this.queryWatcher.registerFilterBar(element);
        }
      });
      return promises;
    };
    _proto.onAfterBinding = function onAfterBinding(oBindingContext, parameters) {
      // In case the page is rebind we need to clear the timer (eg: in FCL, the user can select 2 items successively in the list report)
      if (this.pageReadyTimeoutTimer) {
        clearTimeout(this.pageReadyTimeoutTimer);
      }
      if (!parameters?.deferredCreation || !this.isContextExpected() || oBindingContext) {
        this.pageReadyTimeoutTimer = setTimeout(() => {
          Log.error(`The PageReady Event was not fired within the ${this.pageReadyTimeout} ms timeout . It has been forced. Please contact your application developer for further analysis`);
          this._oEventProvider.fireEvent("pageReady");
        }, this.pageReadyTimeout);
      } else {
        // We are in deferred creation with no context, we need to wait for the context to be set by the create dialog
        // We also need to disable the placeholder animation
        const rootControlController = this.appComponent.getRootControl().getController();
        const placeholder = rootControlController?.getPlaceholder?.();
        placeholder?.disableAnimation();
      }
      if (this.isContextExpected() && !oBindingContext) {
        // Force to mention we are expecting data
        this.bHasContext = false;
        return;
      } else {
        this.bHasContext = true;
      }
      if (this._bAfterBindingAlreadyApplied) {
        return;
      }
      this._bAfterBindingAlreadyApplied = true;
      this.attachEventOnce("pageReady", null, () => {
        clearTimeout(this.pageReadyTimeoutTimer);
        this.pageReadyTimeoutTimer = undefined;
        this._bAfterBindingAlreadyApplied = false;
        this.queryWatcher.reset();
      });
      this.onAfterBindingPromise = new Promise(async resolve => {
        const aTableChartInitializedPromises = this.registerAggregatedControls(oBindingContext);
        if (aTableChartInitializedPromises.length > 0) {
          await Promise.all(aTableChartInitializedPromises);
          this.bTablesChartsLoaded = true;
          this.checkPageReadyDebounced();
          resolve();
        } else {
          this.checkPageReadyDebounced();
          resolve();
        }
      });
    };
    _proto.isPageReady = function isPageReady() {
      return this._bIsPageReady;
    };
    _proto.waitPageReady = async function waitPageReady() {
      return new Promise(resolve => {
        if (this.isPageReady()) {
          resolve();
        } else {
          if (!this._oEventProvider) {
            this._oEventProvider = new EventProvider();
          }
          this.attachEventOnce("pageReady", null, () => {
            resolve();
          }, this);
        }
      });
    };
    _proto.attachEventOnce = function attachEventOnce(sEventId, oData, fnFunction, oListener) {
      // eslint-disable-next-line prefer-rest-params
      return this._oEventProvider.attachEventOnce(sEventId, oData, fnFunction, oListener);
    };
    _proto.attachEvent = function attachEvent(sEventId, oData, fnFunction, oListener) {
      // eslint-disable-next-line prefer-rest-params
      return this._oEventProvider.attachEvent(sEventId, oData, fnFunction, oListener);
    };
    _proto.detachEvent = function detachEvent(sEventId, fnFunction) {
      // eslint-disable-next-line prefer-rest-params
      return this._oEventProvider.detachEvent(sEventId, fnFunction);
    };
    _proto.registerContainer = function registerContainer(oContainer) {
      this._oContainer = oContainer;
      this._fnContainerDelegate = {
        onBeforeShow: () => {
          this.bShown = false;
          this._bIsPageReady = false;
        },
        onBeforeHide: () => {
          this.bShown = false;
          this._bIsPageReady = false;
        },
        onAfterShow: () => {
          this.bShown = true;
          this.onAfterBindingPromise?.then(() => {
            return this.checkPageReadyDebounced(true);
          });
        }
      };
      this._oContainer?.addEventDelegate(this._fnContainerDelegate, this);
    };
    _proto.isContextExpected = function isContextExpected() {
      return false;
    };
    _proto.checkPageReadyDebounced = function checkPageReadyDebounced() {
      let bFromNav = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (this.pageReadyTimer) {
        clearTimeout(this.pageReadyTimer);
      }
      const model = this.getView().getModel();
      let timeOut;
      // isContextExpected = true when Object Page is displayed
      if (model && model.getOptimisticBatchEnabler() === null || this.isContextExpected()) {
        timeOut = 200;
      } else {
        // We are waiting less time because data is already there (optimisticBatch)
        timeOut = 20;
      }
      this.pageReadyTimer = setTimeout(() => {
        this._checkPageReady(bFromNav);
      }, timeOut);
    };
    _proto._checkPageReady = function _checkPageReady() {
      let bFromNav = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      const fnUIUpdated = () => {
        // Wait until the UI is no longer dirty
        if (!Rendering.isPending()) {
          Rendering.detachUIUpdated(fnUIUpdated);
          this._bWaitingForRefresh = false;
          this.checkPageReadyDebounced();
        }
      };

      // In case UIUpdate does not get called, check if UI is not dirty and then call _checkPageReady
      const checkUIUpdated = () => {
        if (Rendering.isPending()) {
          setTimeout(checkUIUpdated, 500);
        } else if (this._bWaitingForRefresh) {
          this._bWaitingForRefresh = false;
          Rendering.detachUIUpdated(fnUIUpdated);
          this.checkPageReadyDebounced();
        }
      };
      if (this.bShown && this.queryWatcher.isDataReceived() !== false && this.bTablesChartsLoaded !== false && (!this.isContextExpected() || this.bHasContext) // Either no context is expected or there is one
      ) {
        if (this.queryWatcher.isDataReceived() === true && !bFromNav && !this._bWaitingForRefresh && Rendering.isPending()) {
          // If we requested data we get notified as soon as the data arrived, so before the next rendering tick
          this.queryWatcher.resetDataReceived();
          this._bWaitingForRefresh = true;
          Rendering.attachUIUpdated(fnUIUpdated);
          setTimeout(checkUIUpdated, 500);
        } else if (!this._bWaitingForRefresh && Rendering.isPending() || this._nbWaits !== 0 || TemplatedViewServiceFactory.getNumberOfViewsInCreationState() > 0 || this.queryWatcher.isSearchPending()) {
          this._bWaitingForRefresh = true;
          Rendering.attachUIUpdated(fnUIUpdated);
          setTimeout(checkUIUpdated, 500);
        } else if (!this._bWaitingForRefresh) {
          // In the case we're not waiting for any data (navigating back to a page we already have loaded)
          // just wait for a frame to fire the event.
          this._bIsPageReady = true;
          this._oEventProvider.fireEvent("pageReady");
        }
      }
    }

    /**
     * Forces the 'pageReady' event to be sent.
     */;
    _proto.forcePageReady = function forcePageReady() {
      this._oEventProvider.fireEvent("pageReady");
    };
    return PageReadyControllerExtension;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "waitFor", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "waitFor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRouteMatched", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "onRouteMatched"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRouteMatchedFinished", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onRouteMatchedFinished"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isPageReady", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "isPageReady"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "waitPageReady", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "waitPageReady"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "attachEventOnce", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "attachEventOnce"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "attachEvent", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "attachEvent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "detachEvent", [_dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "detachEvent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isContextExpected", [_dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "isContextExpected"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "checkPageReadyDebounced", [_dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "checkPageReadyDebounced"), _class2.prototype), _class2)) || _class);
  return PageReadyControllerExtension;
}, false);
//# sourceMappingURL=PageReady-dbg.js.map

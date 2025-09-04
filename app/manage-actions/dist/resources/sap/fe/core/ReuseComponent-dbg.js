/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/fpm/Component", "sap/ui/core/Component"], function (Log, ClassSupport, CommonUtils, FPMComponent, Component) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ReuseComponent = (_dec = defineUI5Class("sap.fe.core.ReuseComponent"), _dec2 = property({
    type: "object"
  }), _dec3 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_FPMComponent) {
    function ReuseComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _FPMComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "override", _descriptor, _this);
      // event that is fired once the component is initialized
      _initializerDefineProperty(_this, "initialized", _descriptor2, _this);
      _this.hooksApplied = false;
      return _this;
    }
    _inheritsLoose(ReuseComponent, _FPMComponent);
    var _proto = ReuseComponent.prototype;
    /**
     * Sets the container of the component.
     *
     * This is being called by UI5. We override this method to keep track of the container and to initialize the router.
     * @param container The container
     * @returns The instance of the component
     */
    _proto.setContainer = function setContainer(container) {
      _FPMComponent.prototype.setContainer.call(this, container);
      this.container = container;
      const router = this.getRouter();
      if (router) {
        // once the container is set, we can initialize the router
        router.initialize();
      }
      return this;
    };
    _proto.applyHooks = function applyHooks() {
      if (this.hooksApplied || !this.container) {
        return;
      }
      const pageController = this.getPageComponent().getRootController();
      if (!pageController) {
        return;
      }
      for (const controllerExtensionOverrideName in this.override) {
        const controllerExtensionOverride = this.override[controllerExtensionOverrideName];
        const pageControllerExtension = pageController[controllerExtensionOverrideName];
        if (!pageControllerExtension) {
          Log.error(`The controller extension ${controllerExtensionOverrideName} does not exist in the page controller.`);
          continue;
        }
        for (const hookName in controllerExtensionOverride) {
          const attachHook = pageControllerExtension[`attach${String(hookName)}`];
          if (!attachHook) {
            Log.error(`The hook ${hookName} does not exist in the page controller extension ${controllerExtensionOverrideName}.`);
            continue;
          }
          const handlerFunction = controllerExtensionOverride[hookName];
          attachHook(handlerFunction);
          pageController.getView().attachBeforeExit(() => {
            this.hooksApplied = false;
            pageControllerExtension[`detach${String(hookName)}`](handlerFunction);
          });
        }
      }
      this.hooksApplied = true;
      this.fireEvent("initialized");
    }

    /**
     * Creates the content of the component.
     *
     * This is being called by UI5. We override this method to implement our own template logic
     * and to inform UI5 when the root control is being created.
     * @returns A promise that resolves with the root control
     */;
    _proto.createContent = async function createContent() {
      this.attachModelContextChange(this.applyHooks.bind(this));
      return new Promise(resolve => {
        this.rootControlCreated = resolve;
      });
    }

    /**
     * Sets an aggregation of the component.
     *
     * This is being called by UI5. We override this method to know when the rootControl is being set.
     * @param aggregationName The name of the aggregation
     * @param object The object to set
     * @param suppressInvalidate Whether to suppress invalidation
     * @returns The instance of the component
     */;
    _proto.setAggregation = function setAggregation(aggregationName, object, suppressInvalidate) {
      if (aggregationName === "rootControl") {
        const rootControl = object;
        this.rootControlCreated(rootControl);
      }
      return _FPMComponent.prototype.setAggregation.call(this, aggregationName, object, suppressInvalidate);
    };
    _proto.getContextPath = function getContextPath() {
      const contextPath = this.contextPath;
      if (contextPath?.startsWith("/")) {
        // absolute path
        return contextPath;
      } else {
        // relative path - we need to prepend the context path of the parent view
        const currentView = CommonUtils.getCurrentPageView(this.getAppComponent());
        const parentContextPath = currentView.getViewData().contextPath || "/" + currentView.getViewData().entitySet;
        if (contextPath) {
          return parentContextPath + "/" + contextPath;
        } else {
          return parentContextPath;
        }
      }
    }

    /**
     * Returns the view name of the reuse component.
     * This is being called by the template service to create the view.
     * @returns The view name
     */;
    _proto.getViewName = function getViewName() {
      const rootViewName = this.getManifestEntry("sap.ui5").rootView?.viewName;
      if (!rootViewName && !this.viewName) {
        throw new Error("No root view defined in the manifest nor viewName set in the component");
      }
      return rootViewName || this.viewName;
    }

    /**
     * Returns the page component that owns the reuse component.
     * @returns The page component
     */;
    _proto.getPageComponent = function getPageComponent() {
      // the owner of the reuse component is not the page component but the app component.
      // we rely on the parent of the container to be the owned by the page component
      // and get the extensionAPI from there. If the parent is not a control, we throw an error
      const parent = this.container?.getParent();
      if (!parent) {
        throw new Error("The parent of the reuse component is not yet set. Thus, the page component cannot be retrieved.");
      }
      return Component.getOwnerComponentFor(parent);
    }

    /**
     * Returns the extension API of the page component that owns the reuse component.
     * @returns The extension API
     */;
    _proto.getExtensionAPI = function getExtensionAPI() {
      return this.getPageComponent().getExtensionAPI();
    };
    return ReuseComponent;
  }(FPMComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "override", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "initialized", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ReuseComponent;
}, false);
//# sourceMappingURL=ReuseComponent-dbg.js.map

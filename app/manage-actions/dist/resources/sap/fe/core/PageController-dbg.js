/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/BaseController", "sap/fe/core/ExtensionAPI", "sap/fe/core/controllerextensions/CollaborativeDraft", "sap/fe/core/controllerextensions/EditFlow", "sap/fe/core/controllerextensions/InlineEditFlow", "sap/fe/core/controllerextensions/IntentBasedNavigation", "sap/fe/core/controllerextensions/InternalIntentBasedNavigation", "sap/fe/core/controllerextensions/InternalRouting", "sap/fe/core/controllerextensions/MessageHandler", "sap/fe/core/controllerextensions/PageReady", "sap/fe/core/controllerextensions/Paginator", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/Recommendations", "sap/fe/core/controllerextensions/Routing", "sap/fe/core/controllerextensions/Share", "sap/fe/core/controllerextensions/SideEffects", "sap/fe/core/controllerextensions/Telemetry", "sap/fe/core/controllerextensions/ViewState", "sap/m/MessageBox", "sap/ui/core/Component", "sap/ui/core/Lib", "./controllerextensions/ContextSharing", "./controllerextensions/cards/CollaborationManager"], function (ClassSupport, BaseController, ExtensionAPI, CollaborativeDraft, EditFlow, InlineEditFlow, IntentBasedNavigation, InternalIntentBasedNavigation, InternalRouting, MessageHandler, PageReady, Paginator, Placeholder, Recommendations, Routing, Share, SideEffects, Telemetry, ViewState, MessageBox, Component, Library, ContextSharing, CollaborationManager) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18;
  var usingExtension = ClassSupport.usingExtension;
  var publicExtension = ClassSupport.publicExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Base controller class for your custom page used inside an SAP Fiori elements application.
   *
   * This controller provides preconfigured extensions that will ensure you have the basic functionalities required to use the building blocks.
   * @hideconstructor
   * @public
   * @since 1.88.0
   */
  let PageController = (_dec = defineUI5Class("sap.fe.core.PageController"), _dec2 = usingExtension(Routing), _dec3 = usingExtension(CollaborativeDraft), _dec4 = usingExtension(InternalRouting), _dec5 = usingExtension(EditFlow), _dec6 = usingExtension(IntentBasedNavigation), _dec7 = usingExtension(InternalIntentBasedNavigation), _dec8 = usingExtension(PageReady), _dec9 = usingExtension(MessageHandler), _dec10 = usingExtension(Share), _dec11 = usingExtension(Paginator), _dec12 = usingExtension(ViewState), _dec13 = usingExtension(Placeholder), _dec14 = usingExtension(SideEffects), _dec15 = usingExtension(Recommendations), _dec16 = usingExtension(Telemetry), _dec17 = usingExtension(ContextSharing), _dec18 = usingExtension(CollaborationManager), _dec19 = usingExtension(InlineEditFlow), _dec20 = publicExtension(), _dec21 = publicExtension(), _dec22 = publicExtension(), _dec23 = publicExtension(), _dec24 = extensible("After"), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    function PageController(name) {
      var _this;
      _this = _BaseController.call(this, name) || this;
      _initializerDefineProperty(_this, "routing", _descriptor, _this);
      _initializerDefineProperty(_this, "collaborativeDraft", _descriptor2, _this);
      _initializerDefineProperty(_this, "_routing", _descriptor3, _this);
      _initializerDefineProperty(_this, "editFlow", _descriptor4, _this);
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor5, _this);
      _initializerDefineProperty(_this, "_intentBasedNavigation", _descriptor6, _this);
      _initializerDefineProperty(_this, "pageReady", _descriptor7, _this);
      _initializerDefineProperty(_this, "messageHandler", _descriptor8, _this);
      _initializerDefineProperty(_this, "share", _descriptor9, _this);
      _initializerDefineProperty(_this, "paginator", _descriptor10, _this);
      _initializerDefineProperty(_this, "viewState", _descriptor11, _this);
      _initializerDefineProperty(_this, "placeholder", _descriptor12, _this);
      _initializerDefineProperty(_this, "_sideEffects", _descriptor13, _this);
      _initializerDefineProperty(_this, "recommendations", _descriptor14, _this);
      _initializerDefineProperty(_this, "telemetry", _descriptor15, _this);
      _initializerDefineProperty(_this, "contextSharing", _descriptor16, _this);
      _initializerDefineProperty(_this, "collaborationManager", _descriptor17, _this);
      _initializerDefineProperty(_this, "inlineEditFlow", _descriptor18, _this);
      const ownProps = Object.getOwnPropertyNames(_this.constructor.prototype);
      for (const ownProp of ownProps) {
        if (ownProp !== "constructor" && ownProp !== "getMetadata" && ownProp !== "extension") {
          const fnProp = _this[ownProp];
          if (fnProp && typeof fnProp === "function" && !fnProp.getMetadata) {
            _this[ownProp] = function () {
              for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }
              const ownerComponent = Component.getOwnerComponentFor(_this.getView());
              if (ownerComponent) {
                return ownerComponent.runAsOwner(() => fnProp.apply(_this, args));
              } else {
                return fnProp.apply(_this, args);
              }
            };
          }
        }
      }
      Object.defineProperty(_this, "oView", {
        get() {
          return this._oView;
        },
        set(v) {
          this._oView = v;
          // On the initial view instantiation from XML the templating process may be finished before the view is completely created
          // When that happens we need to ensure that the root controller is available on the TemplateComponent
          this.getOwnerComponent()?.setRootController?.(this);
        }
      });
      return _this;
    }
    _inheritsLoose(PageController, _BaseController);
    var _proto = PageController.prototype;
    _proto.onInit = function onInit() {
      const oUIModel = this.getAppComponent().getModel("ui"),
        oInternalModel = this.getAppComponent().getModel("internal"),
        sPath = `/pages/${this.getView().getId()}`;
      oUIModel.setProperty(sPath, {
        controls: {}
      });
      oInternalModel.setProperty(sPath, {
        controls: {},
        collaboration: {}
      });
      this.getView().bindElement({
        path: "/",
        model: "ui"
      });
      this.getView().bindElement({
        path: sPath,
        model: "internal"
      });

      // for the time being provide it also pageInternal as some macros access it - to be removed
      this.getView().bindElement({
        path: sPath,
        model: "pageInternal"
      });
      this.getView().setModel(oInternalModel, "pageInternal");

      // as the model propagation happens after init but we actually want to access the binding context in the
      // init phase already setting the model here
      this.getView().setModel(oUIModel, "ui");
      this.getView().setModel(oInternalModel, "internal");
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      if (this.placeholder.attachHideCallback) {
        this.placeholder.attachHideCallback();
      }
    }

    /**
     * Get the extension API for the current page.
     * @param id PRIVATE
     * @public
     * @returns The extension API.
     */;
    _proto.getExtensionAPI = function getExtensionAPI(id) {
      if (!this.extensionAPI) {
        this.extensionAPI = new ExtensionAPI(this, id);
      }
      return this.extensionAPI;
    }

    // We specify the extensibility here the same way as it is done in the object page controller
    // since the specification here overrides it and if we do not specify anything here, the
    // behavior defaults to an execute instead!
    // TODO This may not be ideal, since it also influences the list report controller but currently it's the best solution.
    ;
    _proto.onPageReady = function onPageReady(_mParameters) {
      // Apply app state only after the page is ready with the first section selected
      const view = this.getView();
      this.getAppComponent().getAppStateHandler().applyAppState(view.getId(), view);
    };
    _proto._getPageTitleInformation = function _getPageTitleInformation() {
      return {};
    };
    _proto._getPageModel = function _getPageModel() {
      const pageComponent = Component.getOwnerComponentFor(this.getView());
      return pageComponent?.getModel("_pageModel");
    }

    /**
     * Opens one or more new tabs with the given outbound target for the selected contexts.
     * @param outboundTarget The outbound target
     * @param contexts The selected contexts
     * @param createPath The create path
     * @param maxNumberOfSelectedItems The maximum number of selected items
     */;
    _proto.onOpenInNewTabNavigateOutBound = function onOpenInNewTabNavigateOutBound(outboundTarget, contexts, createPath, maxNumberOfSelectedItems) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      if (contexts.length <= maxNumberOfSelectedItems) {
        contexts.forEach(function (context) {
          that._intentBasedNavigation.onChevronPressNavigateOutBound(that, outboundTarget, context, createPath, "explace");
        });
      } else {
        MessageBox.warning(Library.getResourceBundleFor("sap.fe.macros").getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [maxNumberOfSelectedItems]));
      }
    }

    /**
     * Get the name of the page as defined in the manifest routing section.
     * @returns The name of the page
     */;
    _proto.getRoutingTargetName = function getRoutingTargetName() {
      if (!this.routingTargetName) {
        this.routingTargetName = this.getAppComponent().getRoutingService().getTargetNameForView(this.getView()) ?? "";
      }
      return this.routingTargetName;
    }

    /**
     * Method to forward setShowFooter on the first content of the view if recognized.
     * @param show
     */;
    _proto.setShowFooter = function setShowFooter() {
      let show = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      const page = this.getView().getContent()[0];
      if (page.isA("sap.f.DynamicPage") || page.isA("sap.uxap.ObjectPageLayout")) {
        page.setShowFooter(show);
      }
    }

    /**
     * Method to get the footer.
     * @returns The footer of the page if it exists
     */;
    _proto.getFooter = function getFooter() {
      const page = this.getView().getContent()[0];
      if (page.isA("sap.f.DynamicPage") || page.isA("sap.uxap.ObjectPageLayout")) {
        return page.getFooter();
      }
      return undefined;
    };
    return PageController;
  }(BaseController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "routing", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "collaborativeDraft", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_routing", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "editFlow", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_intentBasedNavigation", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "pageReady", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "messageHandler", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "paginator", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "placeholder", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_sideEffects", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "recommendations", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "telemetry", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "contextSharing", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "collaborationManager", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "inlineEditFlow", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeRendering", [_dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeRendering"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getExtensionAPI", [_dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "getExtensionAPI"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPageReady", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "onPageReady"), _class2.prototype), _class2)) || _class);
  return PageController;
}, false);
//# sourceMappingURL=PageController-dbg.js.map

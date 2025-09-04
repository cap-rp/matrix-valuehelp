/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/fe/base/ClassSupport", "sap/fe/placeholder/library", "sap/ui/core/Placeholder", "sap/ui/core/mvc/ControllerExtension"], function (ObjectPath, ClassSupport, _library, Placeholder, ControllerExtension) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * {@link sap.ui.core.mvc.ControllerExtension Controller extension} for Placeholder
   *
   */
  let PlaceholderControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Placeholder"), _dec2 = publicExtension(), _dec3 = publicExtension(), _dec4 = publicExtension(), _dec5 = publicExtension(), _dec6 = publicExtension(), _dec7 = publicExtension(), _dec8 = publicExtension(), _dec9 = publicExtension(), _dec10 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function PlaceholderControllerExtension() {
      return _ControllerExtension.call(this) || this;
    }
    _inheritsLoose(PlaceholderControllerExtension, _ControllerExtension);
    var _proto = PlaceholderControllerExtension.prototype;
    _proto.attachHideCallback = function attachHideCallback() {
      if (this.isPlaceholderEnabled()) {
        const oView = this.base.getView();
        const oPage = oView.getParent() && oView.getParent().oContainer;
        const oNavContainer = oPage && oPage.getParent();
        if (!oNavContainer || !oPage) {
          return;
        }
        const _fnContainerDelegate = {
          onAfterShow: function (oEvent) {
            if (oEvent.isBackToPage || new URLSearchParams(window.location.hash.replace(/#.*\?/, "")).get("restoreHistory") === "true") {
              // in case we navigate to the listreport using the shell
              oNavContainer.hidePlaceholder();
            }
          }
        };
        oPage.addEventDelegate(_fnContainerDelegate);
        const oPageReady = oView.getController().pageReady;
        //In case of objectPage, the placeholder should be hidden when heroes requests are received
        // But for some scenario like "Create item", heroes requests are not sent .
        // The pageReady event is then used as fallback

        const aAttachEvents = ["pageReady"];
        if (oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController") {
          aAttachEvents.push("heroesBatchReceived");
        }
        aAttachEvents.forEach(sEvent => {
          oPageReady.attachEvent(sEvent, null, function () {
            oNavContainer.hidePlaceholder();
          }, this);
        });
      }
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this._init();
    };
    _proto.hideRootPlaceholder = function hideRootPlaceholder() {
      this.oRootContainer = this.oAppComponent.getRootContainer();
      this.oRootContainer.hidePlaceholder();
    };
    _proto._init = function _init() {
      this.oAppComponent = this.base.getAppComponent();
      this.oRootContainer = this.oAppComponent.getRootContainer();

      // eslint-disable-next-line no-constant-condition
      if (this.isPlaceholderEnabled()) {
        Placeholder.registerProvider(function (oConfig) {
          switch (oConfig.name) {
            case "sap.fe.templates.ListReport":
              return {
                html: "sap/fe/placeholder/view/PlaceholderLR.fragment.html",
                autoClose: false
              };
            case "sap.fe.templates.ObjectPage":
              return {
                html: "sap/fe/placeholder/view/PlaceholderOP.fragment.html",
                autoClose: false
              };
            default:
          }
        });
      }
      if (this.isPlaceholderDebugEnabled()) {
        this.initPlaceholderDebug();
      }
    };
    _proto.initPlaceholderDebug = function initPlaceholderDebug() {
      this.resetPlaceholderDebugStats();
      const handler = {
        apply: target => {
          if (this.oRootContainer._placeholder && this.oRootContainer._placeholder.placeholder) {
            this.debugStats.iHidePlaceholderTimestamp = Date.now();
          }
          return target.bind(this.oRootContainer)();
        }
      };
      // eslint-disable-next-line no-undef
      const proxy1 = new Proxy(this.oRootContainer.hidePlaceholder, handler);
      this.oRootContainer.hidePlaceholder = proxy1;
    };
    _proto.isPlaceholderDebugEnabled = function isPlaceholderDebugEnabled() {
      if (new URLSearchParams(window.location.search).get("sap-ui-xx-placeholder-debug") === "true") {
        return true;
      }
      return false;
    };
    _proto.resetPlaceholderDebugStats = function resetPlaceholderDebugStats() {
      this.debugStats = {
        iHidePlaceholderTimestamp: 0,
        iPageReadyEventTimestamp: 0,
        iHeroesBatchReceivedEventTimestamp: 0
      };
    };
    _proto.getPlaceholderDebugStats = function getPlaceholderDebugStats() {
      return this.debugStats;
    };
    _proto.isPlaceholderEnabled = function isPlaceholderEnabled() {
      const bPlaceholderEnabledInFLP = ObjectPath.get("sap-ushell-config.apps.placeholder.enabled");
      if (bPlaceholderEnabledInFLP === false) {
        return false;
      }
      return Placeholder.isEnabled();
    };
    _proto.disableAnimation = function disableAnimation() {
      this.base.getAppComponent().getRootControl().addStyleClass("sapFeNoAnimation");
    };
    _proto.enableAnimation = function enableAnimation() {
      this.base.getAppComponent().getRootControl().removeStyleClass("sapFeNoAnimation");
    };
    return PlaceholderControllerExtension;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "attachHideCallback", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "attachHideCallback"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "attachRouteMatchers", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "attachRouteMatchers"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "initPlaceholderDebug", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "initPlaceholderDebug"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isPlaceholderDebugEnabled", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "isPlaceholderDebugEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "resetPlaceholderDebugStats", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "resetPlaceholderDebugStats"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getPlaceholderDebugStats", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "getPlaceholderDebugStats"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isPlaceholderEnabled", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "isPlaceholderEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "disableAnimation", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "disableAnimation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableAnimation", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "enableAnimation"), _class2.prototype), _class2)) || _class);
  return PlaceholderControllerExtension;
}, false);
//# sourceMappingURL=Placeholder-dbg.js.map

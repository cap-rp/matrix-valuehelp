/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/ui/core/mvc/ControllerExtension"], function (ClassSupport, CommonUtils, ControllerExtension) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2;
  var _exports = {};
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * An implementation for controller extension used internally in sap.fe for central functionalities to serve collaboration manager use cases.
   * @since 1.120.0
   */
  let CollaborationManagerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.cards.CollaborationManager"), _dec2 = methodOverride(), _dec3 = methodOverride("_routing"), _dec4 = methodOverride(), _dec5 = publicExtension(), _dec6 = extensible("AfterAsync"), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function CollaborationManagerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.init();
      return _this;
    }
    _exports = CollaborationManagerExtension;
    _inheritsLoose(CollaborationManagerExtension, _ControllerExtension);
    var _proto = CollaborationManagerExtension.prototype;
    _proto.onInit = function onInit() {
      const asyncOnInit = async function () {
        this.feView = this.base.getView();
        this.appComponent = CommonUtils.getAppComponent(this.feView);
        const environmentCapabilities = await this.appComponent.getService("environmentCapabilities");
        this.serviceEnabled = true;
        // Only connect to the Collaboration Manager if it is explicitly enabled and the sap.insights library is loaded
        if (!this.appComponent["isCollaborationManagerServiceEnabled"]() || !environmentCapabilities.getCapabilities().InsightsSupported || !(await environmentCapabilities.isInsightsEnabled())) {
          this.serviceEnabled = false;
        }
      };
      asyncOnInit.apply(this);
    };
    _proto.onAfterBinding = async function onAfterBinding() {
      if (this.serviceEnabled === false) {
        return;
      }
      await this.getService().connect(this.appComponent.getId(), async () => {
        const cards = [];
        await this.collectAvailableCards(cards);
        const cardObject = this.updateCards(cards);
        const parentAppId = this.appComponent.getId();
        this.getService().addCardsToCollaborationManager(cardObject, parentAppId);
      });
    };
    _proto.updateCards = function updateCards(cards) {
      return cards.reduce((acc, cur) => {
        if (cur?.card["sap.app"]?.id) {
          acc[cur?.card["sap.app"]?.id] = cur;
        }
        return acc;
      }, {});
    }

    /**
     * Automatic unregistering on exit of the application.
     *
     */;
    _proto.onExit = function onExit() {
      this.getService().unregisterProvider();
    };
    _proto.getService = function getService() {
      return this.appComponent.getCollaborationManagerService();
    };
    _proto.collectAvailableCards = async function collectAvailableCards(cards) {
      return Promise.resolve();
    };
    return CollaborationManagerExtension;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectAvailableCards", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "collectAvailableCards"), _class2.prototype), _class2)) || _class);
  _exports = CollaborationManagerExtension;
  return _exports;
}, false);
//# sourceMappingURL=CollaborationManager-dbg.js.map

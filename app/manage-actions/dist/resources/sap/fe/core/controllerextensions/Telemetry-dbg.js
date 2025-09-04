/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/controllerextensions/BaseControllerExtension"], function (ClassSupport, BaseControllerExtension) {
  "use strict";

  var _dec, _dec2, _class, _class2;
  var _exports = {};
  var publicExtension = ClassSupport.publicExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  let Telemetry = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Telemetry"), _dec2 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseControllerExtens) {
    function Telemetry() {
      return _BaseControllerExtens.apply(this, arguments) || this;
    }
    _exports = Telemetry;
    _inheritsLoose(Telemetry, _BaseControllerExtens);
    var _proto = Telemetry.prototype;
    _proto.storeAction = function storeAction(actionDefinition) {
      this.base.getAppComponent().getTelemetryService().storeAction(actionDefinition, (this.base.getView()?.getViewData()).converterType);
    };
    return Telemetry;
  }(BaseControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "storeAction", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "storeAction"), _class2.prototype), _class2)) || _class);
  _exports = Telemetry;
  return _exports;
}, false);
//# sourceMappingURL=Telemetry-dbg.js.map

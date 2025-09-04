/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/VBox", "sap/ui/core/StashedControlSupport"], function (ClassSupport, VBox, StashedControlSupport) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let StashableVBox = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.controls.StashableVBox", {
    designtime: "sap/fe/templates/ObjectPage/designtime/StashableVBox.designtime"
  }), _dec2 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_VBox) {
    function StashableVBox() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _VBox.call(this, ...args) || this;
      _initializerDefineProperty(_this, "_disconnected", _descriptor, _this);
      return _this;
    }
    _inheritsLoose(StashableVBox, _VBox);
    var _proto = StashableVBox.prototype;
    _proto.set_disconnected = function set_disconnected(disconnected) {
      this._disconnected = disconnected;
      // By setting the binding context to `null` we are preventing data loading
      // Setting it back to `undefined` ensures that the parent context is applied
      if (disconnected) {
        this.setBindingContext(null);
      } else {
        this.setBindingContext(undefined);
      }
      return this;
    };
    return StashableVBox;
  }(VBox), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_disconnected", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  StashedControlSupport.mixInto(StashableVBox);
  return StashableVBox;
}, false);
//# sourceMappingURL=StashableVBox-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Fragment"], function (ClassSupport, Fragment) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let CustomFragmentFragment = (_dec = defineUI5Class("sap.fe.macros.fpm.CustomFragmentFragment"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Fragment) {
    function CustomFragmentFragment() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Fragment.call(this, ...args) || this;
      /*
       * Event to hold and resolve functions for runtime building blocks
       */
      _initializerDefineProperty(_this, "childCustomData", _descriptor, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      return _this;
    }
    _exports = CustomFragmentFragment;
    _inheritsLoose(CustomFragmentFragment, _Fragment);
    return CustomFragmentFragment;
  }(Fragment), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "childCustomData", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CustomFragmentFragment;
  return _exports;
}, false);
//# sourceMappingURL=CustomFragmentFragment-dbg.js.map

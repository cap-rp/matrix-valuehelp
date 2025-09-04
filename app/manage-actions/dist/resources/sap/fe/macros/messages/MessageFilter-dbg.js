/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element", "sap/ui/model/FilterOperator"], function (ClassSupport, Element, FilterOperator) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let MessageFilter = (_dec = defineUI5Class("sap.fe.macros.messages.MessageFilter"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "sap.ui.model.FilterOperator"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Element) {
    function MessageFilter() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Element.call(this, ...args) || this;
      _initializerDefineProperty(_this, "path", _descriptor, _this);
      _initializerDefineProperty(_this, "operator", _descriptor2, _this);
      _initializerDefineProperty(_this, "value1", _descriptor3, _this);
      _initializerDefineProperty(_this, "value2", _descriptor4, _this);
      return _this;
    }
    _inheritsLoose(MessageFilter, _Element);
    return MessageFilter;
  }(Element), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "operator", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return FilterOperator.Contains;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "value1", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "value2", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return MessageFilter;
}, false);
//# sourceMappingURL=MessageFilter-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/section/mixin/SubSectionStateHandler", "sap/uxap/ObjectPageSubSection"], function (ClassSupport, SubSectionStateHandler, ObjectPageSubSection) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  let SubSection = (_dec = defineUI5Class("sap.fe.macros.controls.section.SubSection", {
    designtime: "sap/uxap/designtime/ObjectPageSubSection.designtime"
  }), _dec2 = mixin(SubSectionStateHandler), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec(_class = _dec2(_class = (_class2 = /*#__PURE__*/function (_ObjectPageSubSection) {
    function SubSection() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ObjectPageSubSection.call(this, ...args) || this;
      /**
       * Path to the apply-state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "applyStateHandler", _descriptor, _this);
      /**
       * Path to the retrieve-state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "retrieveStateHandler", _descriptor2, _this);
      return _this;
    }
    _inheritsLoose(SubSection, _ObjectPageSubSection);
    return SubSection;
  }(ObjectPageSubSection), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "applyStateHandler", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "retrieveStateHandler", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class) || _class);
  return SubSection;
}, false);
//# sourceMappingURL=SubSection-dbg.js.map

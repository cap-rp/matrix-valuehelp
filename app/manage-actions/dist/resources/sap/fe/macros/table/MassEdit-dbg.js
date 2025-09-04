/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Definition of the mass edit to be used inside the table.
   * @public
   */
  let MassEdit = (_dec = defineUI5Class("sap.fe.macros.table.MassEdit"), _dec2 = aggregation({
    type: "sap.ui.layout.form.FormContainer",
    isDefault: true
  }), _dec3 = property({
    type: "string[]"
  }), _dec4 = property({
    type: "string[]"
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function MassEdit(settings) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, settings) || this;
      /**
       * The custom form container that can be displayed at the top of the mass edit dialog
       * @public
       */
      _initializerDefineProperty(_this, "customContent", _descriptor, _this);
      /**
       * Defines the list of fields that should be visible in the mass edit dialog
       * @public
       */
      _initializerDefineProperty(_this, "visibleFields", _descriptor2, _this);
      /**
       * Defines the list of fields that should be ignored in the mass edit dialog
       * @public
       */
      _initializerDefineProperty(_this, "ignoredFields", _descriptor3, _this);
      /**
       * Defines the mode of the operation grouping to save the new values
       * Allowed values are `ChangeSet` and `Isolated`
       * @public
       */
      _initializerDefineProperty(_this, "operationGroupingMode", _descriptor4, _this);
      return _this;
    }
    _exports = MassEdit;
    _inheritsLoose(MassEdit, _BuildingBlockObjectP);
    return MassEdit;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "customContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visibleFields", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "ignoredFields", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "operationGroupingMode", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = MassEdit;
  return _exports;
}, false);
//# sourceMappingURL=MassEdit-dbg.js.map

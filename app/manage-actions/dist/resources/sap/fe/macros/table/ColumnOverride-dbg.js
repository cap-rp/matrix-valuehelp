/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
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
   * Definition of an override for the column to be used inside the Table building block.
   * @public
   */
  let ColumnOverride = (_dec = defineUI5Class("sap.fe.macros.table.ColumnOverride"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = aggregation({
    type: "sap.fe.macros.table.ColumnExportSettings"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function ColumnOverride(settings) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, settings) || this;
      /**
       * Unique identifier of the column to overridden.
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor, _this);
      /**
       * Determines the column's width.
       *
       * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
       * @public
       */
      _initializerDefineProperty(_this, "width", _descriptor2, _this);
      /**
       * Defines the importance of the column.
       *
       * You can define which columns should be automatically moved to the pop-in area based on their importance
       * @public
       */
      _initializerDefineProperty(_this, "importance", _descriptor3, _this);
      /**
       * Aligns the header as well as the content horizontally
       * @public
       */
      _initializerDefineProperty(_this, "horizontalAlign", _descriptor4, _this);
      /**
       * Indicates if the column header should be a part of the width calculation.
       * @public
       */
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor5, _this);
      /**
       * The column availability
       */
      _initializerDefineProperty(_this, "availability", _descriptor6, _this);
      /**
       * Determines the export settings for the column.
       * @public
       */
      _initializerDefineProperty(_this, "exportSettings", _descriptor7, _this);
      return _this;
    }
    _exports = ColumnOverride;
    _inheritsLoose(ColumnOverride, _BuildingBlockObjectP);
    return ColumnOverride;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "importance", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "horizontalAlign", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "availability", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "exportSettings", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ColumnOverride;
  return _exports;
}, false);
//# sourceMappingURL=ColumnOverride-dbg.js.map

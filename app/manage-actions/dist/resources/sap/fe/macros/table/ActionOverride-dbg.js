/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Definition of an override for the action to be used inside the Table building block.
   * @public
   */
  let ActionOverride = (_dec = defineUI5Class("sap.fe.macros.table.ActionOverride"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "boolean"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "boolean"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function ActionOverride(settings) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, settings) || this;
      /**
       * Unique identifier of the action to overridden.
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor, _this);
      /**
       * Reference to the key of another action already displayed in the toolbar to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor2, _this);
      /**
       * Defines where this action should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor3, _this);
      /**
       * Enables or disables the action
       * @public
       */
      _initializerDefineProperty(_this, "enabled", _descriptor4, _this);
      /**
       * Determines the shortcut combination to trigger the action
       * @public
       */
      _initializerDefineProperty(_this, "command", _descriptor5, _this);
      /**
       * Determines whether the action requires selecting one item or multiple items.
       * Allowed values are `single` and `multi`
       * @public
       */
      _initializerDefineProperty(_this, "enableOnSelect", _descriptor6, _this);
      /**
       * Determines if the auto scroll is enabled after executing the action.
       * @public
       */
      _initializerDefineProperty(_this, "enableAutoScroll", _descriptor7, _this);
      /**
       * Determines whether the action is visible.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor8, _this);
      /**
       * Determines whether there is a navigation after executing the action.
       * @public
       */
      _initializerDefineProperty(_this, "navigateToInstance", _descriptor9, _this);
      /**
       * Determines the function to get the default values of the action.
       * @public
       */
      _initializerDefineProperty(_this, "defaultValuesFunction", _descriptor10, _this);
      return _this;
    }
    _exports = ActionOverride;
    _inheritsLoose(ActionOverride, _BuildingBlockObjectP);
    return ActionOverride;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "command", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "enableOnSelect", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoScroll", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigateToInstance", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "defaultValuesFunction", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ActionOverride;
  return _exports;
}, false);
//# sourceMappingURL=ActionOverride-dbg.js.map

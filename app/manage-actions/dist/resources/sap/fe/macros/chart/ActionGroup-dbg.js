/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/chart/Action"], function (ClassSupport, Action) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
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
   * Definition of a custom action group to be used inside the chart toolbar
   * @public
   */
  let ActionGroup = (_dec = defineUI5Class("sap.fe.macros.chart.ActionGroup"), _dec2 = property({
    type: "string"
  }), _dec3 = aggregation({
    type: "sap.fe.macros.chart.Action",
    multiple: true,
    defaultClass: Action,
    isDefault: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Action) {
    function ActionGroup() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Action.call(this, ...args) || this;
      /**
       * Unique identifier of the action
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor, _this);
      /**
       * Defines nested actions
       * @public
       */
      _initializerDefineProperty(_this, "actions", _descriptor2, _this);
      /**
       * The text that will be displayed for this action group
       * @public
       */
      _initializerDefineProperty(_this, "text", _descriptor3, _this);
      /**
       * Defines where this action group should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor4, _this);
      /**
       * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor5, _this);
      return _this;
    }
    _exports = ActionGroup;
    _inheritsLoose(ActionGroup, _Action);
    return ActionGroup;
  }(Action), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return [];
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ActionGroup;
  return _exports;
}, false);
//# sourceMappingURL=ActionGroup-dbg.js.map

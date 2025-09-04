/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element"], function (ClassSupport, UI5Element) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Button configurations for the RichTextEditor.
   * @public
   */
  let ButtonGroup = (_dec = defineUI5Class("sap.fe.macros.richtexteditor.ButtonGroup"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "int"
  }), _dec5 = property({
    type: "int"
  }), _dec6 = property({
    type: "int"
  }), _dec7 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_UI5Element) {
    function ButtonGroup() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UI5Element.call(this, ...args) || this;
      /**
       * The name of the group.
       * @public
       */
      _initializerDefineProperty(_this, "name", _descriptor, _this);
      /**
       * Whether the group is visible.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor2, _this);
      /**
       * The priority of the group.
       * @public
       */
      _initializerDefineProperty(_this, "priority", _descriptor3, _this);
      /**
       * Row number in which the button should be
       * @public
       */
      _initializerDefineProperty(_this, "row", _descriptor4, _this);
      /**
       * The priority of the group in the custom toolbar.
       * @public
       */
      _initializerDefineProperty(_this, "customToolbarPriority", _descriptor5, _this);
      /**
       * The buttons to be displayed in the group.
       * @public
       */
      _initializerDefineProperty(_this, "buttons", _descriptor6, _this);
      return _this;
    }
    _exports = ButtonGroup;
    _inheritsLoose(ButtonGroup, _UI5Element);
    return ButtonGroup;
  }(UI5Element), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "priority", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "row", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "customToolbarPriority", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "buttons", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ButtonGroup;
  return _exports;
}, false);
//# sourceMappingURL=ButtonGroup-dbg.js.map

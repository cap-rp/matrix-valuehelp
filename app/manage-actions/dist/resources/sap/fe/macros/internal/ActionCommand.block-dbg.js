/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/macros/ActionCommand"], function (BuildingBlockSupport, BuildingBlockTemplatingBase, ActionCommand) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var getCommandExecutionForAction = ActionCommand.getCommandExecutionForAction;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Content of an action command
   * @private
   * @experimental
   */
  let ActionCommandBlock = (_dec = defineBuildingBlock({
    name: "ActionCommand",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "object",
    required: true
  }), _dec4 = blockAttribute({
    type: "boolean"
  }), _dec5 = blockAttribute({
    type: "boolean"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockEvent(), _dec10 = blockEvent(), _dec11 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function ActionCommandBlock(props, _controlConfiguration, _visitorSettings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, _controlConfiguration, _visitorSettings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "action", _descriptor2, _this);
      _initializerDefineProperty(_this, "isActionEnabled", _descriptor3, _this);
      _initializerDefineProperty(_this, "isIBNEnabled", _descriptor4, _this);
      _initializerDefineProperty(_this, "isEnabled", _descriptor5, _this);
      _initializerDefineProperty(_this, "visible", _descriptor6, _this);
      _initializerDefineProperty(_this, "command", _descriptor7, _this);
      _initializerDefineProperty(_this, "onExecuteAction", _descriptor8, _this);
      _initializerDefineProperty(_this, "onExecuteIBN", _descriptor9, _this);
      _initializerDefineProperty(_this, "onExecuteManifest", _descriptor10, _this);
      return _this;
    }

    /**
     * The building block template function.
     * @returns An XML-based string
     */
    _exports = ActionCommandBlock;
    _inheritsLoose(ActionCommandBlock, _BuildingBlockTemplat);
    var _proto = ActionCommandBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      return getCommandExecutionForAction(this.command, this.action, {
        visible: this.visible,
        onExecuteAction: this.onExecuteAction,
        onExecuteIBN: this.onExecuteIBN,
        onExecuteManifest: this.onExecuteManifest,
        isActionEnabled: this.isActionEnabled,
        isIBNEnabled: this.isIBNEnabled,
        isEnabled: this.isEnabled
      });
    };
    return ActionCommandBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "action", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "isActionEnabled", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "isIBNEnabled", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isEnabled", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "command", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteAction", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteIBN", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteManifest", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ActionCommandBlock;
  return _exports;
}, false);
//# sourceMappingURL=ActionCommand.block-dbg.js.map

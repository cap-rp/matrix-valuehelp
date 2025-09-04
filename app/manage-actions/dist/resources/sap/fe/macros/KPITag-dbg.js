/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/GenericTag", "sap/m/ObjectNumber", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, GenericTag, ObjectNumber, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a KPI tag.
   * @public
   */
  let KPITag = (_dec = defineUI5Class("sap.fe.macros.KPITag"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "any",
    isBindingInfo: true
  }), _dec4 = property({
    type: "any",
    defaultValue: "None",
    allowedValues: ["Success", "Error", "Warning", "None", "Information"],
    isBindingInfo: true
  }), _dec5 = property({
    type: "any",
    isBindingInfo: true
  }), _dec6 = event(), _dec7 = property({
    type: "any",
    required: true,
    isBindingInfo: true
  }), _dec8 = property({
    type: "any",
    isBindingInfo: true
  }), _dec9 = property({
    type: "boolean",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function KPITag(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * The ID of the KPI
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * The Text to be displayed.
       * @public
       */
      _initializerDefineProperty(_this, "text", _descriptor2, _this);
      /**
       * The Status to be displayed.
       * @public
       */
      _initializerDefineProperty(_this, "status", _descriptor3, _this);
      /**
       * The Tooltip to be displayed.
       * @public
       */
      _initializerDefineProperty(_this, "tooltip", _descriptor4, _this);
      /**
       * An event is triggered when the KPI is pressed.
       * @public
       */
      _initializerDefineProperty(_this, "press", _descriptor5, _this);
      /**
       * The Number to be displayed.
       * @public
       */
      _initializerDefineProperty(_this, "number", _descriptor6, _this);
      /**
       * The Unit of Measure of the number to be displayed.
       * @public
       */
      _initializerDefineProperty(_this, "unit", _descriptor7, _this);
      /**
       * Set it to `true` if the KPI should display its status icon.
       * @public
       */
      _initializerDefineProperty(_this, "showIcon", _descriptor8, _this);
      return _this;
    }
    _exports = KPITag;
    _inheritsLoose(KPITag, _BuildingBlock);
    var _proto = KPITag.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this._getOwner()?.runAsOwner(() => {
          this.content = this.createContent();
        });
      }
    };
    _proto.createContent = function createContent() {
      return _jsx(GenericTag, {
        id: this.createId("_kpi"),
        text: this.text,
        design: this.showIcon ? "Full" : "StatusIconHidden",
        status: this.status,
        class: "sapUiTinyMarginBegin",
        tooltip: this.tooltip,
        press: () => {
          this.fireEvent("press");
        },
        children: _jsx(ObjectNumber, {
          state: this.status,
          emphasized: false,
          number: this.number,
          unit: this.unit
        })
      });
    };
    return KPITag;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "status", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "tooltip", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "press", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "number", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "unit", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "showIcon", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  _exports = KPITag;
  return _exports;
}, false);
//# sourceMappingURL=KPITag-dbg.js.map

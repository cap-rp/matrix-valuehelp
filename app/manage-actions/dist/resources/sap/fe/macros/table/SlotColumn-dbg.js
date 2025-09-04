/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/ui/core/Element"], function (ClassSupport, BuildingBlock, UI5Element) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let SlotColumn = (_dec = defineUI5Class("sap.fe.macros.table.SlotColumn"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function SlotColumn(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "templateId", _descriptor, _this);
      return _this;
    }

    /**
     * Retrieve the content of the slot column based on the id used by the template if it doesn't exist anymore.
     */
    _exports = SlotColumn;
    _inheritsLoose(SlotColumn, _BuildingBlock);
    var _proto = SlotColumn.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (this.templateId && !this.content) {
        this.content = UI5Element.getElementById(this.templateId)?.clone();
      }
    };
    return SlotColumn;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "templateId", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = SlotColumn;
  return _exports;
}, false);
//# sourceMappingURL=SlotColumn-dbg.js.map

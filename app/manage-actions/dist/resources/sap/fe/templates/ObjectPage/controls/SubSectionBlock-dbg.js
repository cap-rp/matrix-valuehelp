/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/uxap/BlockBase", "sap/uxap/library"], function (ClassSupport, BlockBase, uxapLib) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const BlockBaseFormAdjustment = uxapLib.BlockBaseFormAdjustment;
  let SubSectionBlock = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.controls.SubSectionBlock"), _dec2 = property({
    type: "sap.uxap.BlockBaseColumnLayout",
    group: "Behavior",
    defaultValue: "4"
  }), _dec3 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BlockBase) {
    function SubSectionBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "columnLayout", _descriptor, _this);
      _initializerDefineProperty(_this, "content", _descriptor2, _this);
      return _this;
    }
    _inheritsLoose(SubSectionBlock, _BlockBase);
    var _proto = SubSectionBlock.prototype;
    _proto.init = function init() {
      _BlockBase.prototype.init.call(this);
      this._bConnected = true;
    };
    _proto._applyFormAdjustment = function _applyFormAdjustment() {
      const sFormAdjustment = this.getFormAdjustment(),
        oView = this._getSelectedViewContent(),
        oParent = this._oParentObjectPageSubSection;
      let oFormAdjustmentFields;
      if (sFormAdjustment !== BlockBaseFormAdjustment.None && oView && oParent) {
        oFormAdjustmentFields = this._computeFormAdjustmentFields(sFormAdjustment, oParent._oLayoutConfig);
        this._adjustForm(oView, oFormAdjustmentFields);
      }
    };
    _proto.setMode = function setMode(sMode) {
      this.setProperty("mode", sMode);
      // OPTIONAL: this.internalModel.setProperty("/mode", sMode);
    };
    _proto.connectToModels = function connectToModels() {
      // View is already connected to the UI5 model tree, hence no extra logic required here
    }

    /// SubSectionBlock use aggregation instead of a view, i.e. return that as the view content
    ;
    _proto._getSelectedViewContent = function _getSelectedViewContent() {
      return this.getAggregation("content");
    };
    return SubSectionBlock;
  }(BlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "columnLayout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return SubSectionBlock;
}, false);
//# sourceMappingURL=SubSectionBlock-dbg.js.map

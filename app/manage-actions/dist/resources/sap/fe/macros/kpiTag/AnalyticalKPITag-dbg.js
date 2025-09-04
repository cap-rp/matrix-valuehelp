/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/formatters/KPIFormatter", "../KPITag", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, kpiFormatters, KPITag, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var formatResult = BindingToolkit.formatResult;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * A building block used to display a KPI in the Analytical List Page
   *
   */
  let AnalyticalKPITag = (_dec = defineUI5Class("sap.fe.macros.kpiTag.AnalyticalKPITag"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string",
    required: true
  }), _dec5 = property({
    type: "boolean",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function AnalyticalKPITag(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * The ID of the KPI
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Path to the DataPoint annotation of the KPI
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      /**
       * The name of the runtime model from where we fetch the KPI properties
       */
      _initializerDefineProperty(_this, "kpiModelName", _descriptor3, _this);
      /**
       * Set it to `true` if the KPI value has an associated currency or unit of measure
       */
      _initializerDefineProperty(_this, "hasUnit", _descriptor4, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = AnalyticalKPITag;
    _inheritsLoose(AnalyticalKPITag, _BuildingBlock);
    var _proto = AnalyticalKPITag.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.content = this.createContent();
      }
    }

    /**
     * Creates a binding expression for a specific property in the KPI model.
     * @param view
     * @param propertyName This is the name of the property that finds the KPI data in the associated KPI model.
     * @returns A binding expression
     */;
    _proto.getKpiPropertyExpression = function getKpiPropertyExpression(view, propertyName) {
      return pathInModel(`/${view.getLocalId(this.id) ?? this.id}/manifest/sap.card/data/json/${propertyName}`, this.kpiModelName);
    }

    /**
     * Creates binding expressions for the KPITag's text and tooltip.
     * @param view
     * @returns Object containing the binding expressions for the text and the tooltip
     */;
    _proto.getBindingExpressions = function getBindingExpressions(view) {
      const owner = this._getOwner();
      const metaModel = owner?.preprocessorContext?.models.metaModel;
      const context = metaModel.getContext(this.metaPath);
      const kpiTitle = context.getProperty("Title");
      if (!kpiTitle) {
        return {
          text: undefined,
          tooltip: undefined
        };
      }
      const titleExpression = resolveBindingString(kpiTitle);
      return {
        text: formatResult([titleExpression], kpiFormatters.labelFormat),
        tooltip: formatResult([titleExpression, this.getKpiPropertyExpression(view, "mainValueUnscaled"), this.getKpiPropertyExpression(view, "mainUnit"), this.getKpiPropertyExpression(view, "mainCriticality"), String(this.hasUnit)], kpiFormatters.tooltipFormat)
      };
    };
    _proto.createContent = function createContent() {
      const owner = this._getOwner();
      const controller = owner?.getRootController();
      const view = controller?.getView();
      const {
        text,
        tooltip
      } = this.getBindingExpressions(view);
      const kpiTag = _jsx(KPITag, {
        id: this.createId("_akt"),
        text: text,
        status: this.getKpiPropertyExpression(view, "mainCriticality"),
        tooltip: tooltip,
        press: async event => controller.kpiManagement.onKPIPressed(event.getSource(), view.getLocalId(this.id) ?? this.id),
        number: this.getKpiPropertyExpression(view, "mainValue"),
        unit: this.getKpiPropertyExpression(view, "mainUnit")
      });
      return kpiTag;
    };
    return AnalyticalKPITag;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "kpiModelName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hasUnit", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = AnalyticalKPITag;
  return _exports;
}, false);
//# sourceMappingURL=AnalyticalKPITag-dbg.js.map

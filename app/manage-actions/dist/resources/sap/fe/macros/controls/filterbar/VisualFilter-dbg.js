/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/macros/CommonHelper", "sap/fe/macros/controls/filterbar/utils/VisualFilterUtils", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/FilterHelper", "sap/m/VBox", "sap/ui/core/Lib"], function (ClassSupport, CommonUtils, CommonHelper, VisualFilterUtils, FilterUtils, FilterHelper, VBox, Library) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var getFiltersConditionsFromSelectionVariant = FilterHelper.getFiltersConditionsFromSelectionVariant;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Constructor for a new filterBar/aligned/FilterItemLayout.
   * @param {string} [sId] ID for the new control, generated automatically if no ID is given
   * @param {object} [mSettings] Initial settings for the new control
   * @since 1.61.0
   */
  let VisualFilter = (_dec = defineUI5Class("sap.fe.macros.controls.filterbar.VisualFilter"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec(_class = (_class2 = /*#__PURE__*/function (_VBox) {
    function VisualFilter() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _VBox.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      return _this;
    }
    _inheritsLoose(VisualFilter, _VBox);
    var _proto = VisualFilter.prototype;
    _proto.onAfterRendering = function onAfterRendering() {
      let sLabel;
      const oInteractiveChart = this.getInteractiveChart();
      const sInternalContextPath = this.data("infoPath");
      const oInteractiveChartListBinding = oInteractiveChart.getBinding("segments") || oInteractiveChart.getBinding("bars") || oInteractiveChart.getBinding("points");
      const oInternalModelContext = oInteractiveChart.getBindingContext("internal");
      const oResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      const bShowOverLayInitially = oInteractiveChart.data("showOverlayInitially");
      const oSelectionVariantAnnotation = oInteractiveChart.data("selectionVariantAnnotation") ? oInteractiveChart.data("selectionVariantAnnotation") : {
        SelectOptions: []
      };
      const aRequiredProperties = oInteractiveChart.data("requiredProperties") ? CommonHelper.parseCustomData(oInteractiveChart.data("requiredProperties")) : [];
      const oMetaModel = oInteractiveChart.getModel().getMetaModel();
      const sEntitySetPath = oInteractiveChartListBinding ? oInteractiveChartListBinding.getPath() : "";
      let oFilterBar = this.getParent()?.getParent()?.getParent();
      // TODO: Remove this part once 2170204347 is fixed
      if (oFilterBar.getMetadata().getElementName() === "sap.ui.mdc.filterbar.p13n.AdaptationFilterBar") {
        oFilterBar = oFilterBar.getParent()?.getParent()?.getParent();
      }
      let oFilterBarConditions = {};
      let aPropertyInfoSet = [];
      let sFilterEntityName;
      if (oFilterBar.isA("sap.fe.macros.controls.FilterBar")) {
        oFilterBarConditions = oFilterBar.getConditions();
        aPropertyInfoSet = FilterUtils.getFilterPropertyInfo(oFilterBar);
        sFilterEntityName = oFilterBar.data("entityType").split("/")[1];
      }
      const aParameters = oInteractiveChart.data("parameters") ? oInteractiveChart.data("parameters") : [];
      const filterConditions = getFiltersConditionsFromSelectionVariant(sEntitySetPath, oMetaModel, oSelectionVariantAnnotation, VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils));
      const oSelectionVariantConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
      const mConditions = {};
      Object.keys(oFilterBarConditions).forEach(function (sKey) {
        if (oFilterBarConditions[sKey].length) {
          mConditions[sKey] = oFilterBarConditions[sKey];
        }
      });
      Object.keys(oSelectionVariantConditions).forEach(function (sKey) {
        if (!mConditions[sKey]) {
          mConditions[sKey] = oSelectionVariantConditions[sKey];
        }
      });
      if (bShowOverLayInitially === true) {
        if (!Object.keys(oSelectionVariantAnnotation).length) {
          if (aRequiredProperties.length > 1) {
            oInternalModelContext.setProperty(sInternalContextPath, {
              showError: true,
              errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
              errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF")
            });
          } else {
            sLabel = oMetaModel.getObject(`${sEntitySetPath}/${aRequiredProperties[0]}@com.sap.vocabularies.Common.v1.Label`) || aRequiredProperties[0];
            oInternalModelContext.setProperty(sInternalContextPath, {
              showError: true,
              errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
              errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF", sLabel)
            });
          }
        } else {
          const aSelectOptions = [];
          const aNotMatchedConditions = [];
          if (oSelectionVariantAnnotation.SelectOptions) {
            oSelectionVariantAnnotation.SelectOptions.forEach(function (oSelectOption) {
              aSelectOptions.push(oSelectOption.PropertyName.$PropertyPath);
            });
          }
          if (oSelectionVariantAnnotation.Parameters) {
            oSelectionVariantAnnotation.Parameters.forEach(function (oParameter) {
              aSelectOptions.push(oParameter.PropertyName.$PropertyPath);
            });
          }
          aRequiredProperties.forEach(function (sPath) {
            if (!aSelectOptions.includes(sPath)) {
              aNotMatchedConditions.push(sPath);
            }
          });
          const errorInfo = VisualFilterUtils.getErrorInfoForNoInitialOverlay(aNotMatchedConditions, oResourceBundle, sEntitySetPath, oMetaModel);
          oInternalModelContext.setProperty(sInternalContextPath, errorInfo);
        }
      }
      if (!this._oChartBinding || this._oChartBinding !== oInteractiveChartListBinding) {
        if (this._oChartBinding) {
          this.detachDataReceivedHandler(this._oChartBinding);
        }
        this.attachDataRecivedHandler(oInteractiveChartListBinding);
        this._oChartBinding = oInteractiveChartListBinding;
      }
      const bShowOverlay = oInternalModelContext.getProperty(sInternalContextPath) && oInternalModelContext.getProperty(sInternalContextPath).showError;
      const sChartEntityName = sEntitySetPath !== "" ? sEntitySetPath.split("/")[1].split("(")[0] : "";
      if (aParameters && aParameters.length && sFilterEntityName === sChartEntityName) {
        const sBindingPath = FilterUtils.getBindingPathForParameters(oFilterBar, mConditions, aPropertyInfoSet, aParameters);
        if (sBindingPath) {
          oInteractiveChartListBinding.sPath = sBindingPath;
        }
      }
      // resume binding for only those visual filters that do not have a in parameter attached.
      // Bindings of visual filters with inParameters will be resumed later after considering in parameters.
      if (oInteractiveChartListBinding && oInteractiveChartListBinding.isSuspended() && !bShowOverlay) {
        oInteractiveChartListBinding.resume();
      }
    };
    _proto.attachDataRecivedHandler = function attachDataRecivedHandler(oInteractiveChartListBinding) {
      if (oInteractiveChartListBinding) {
        oInteractiveChartListBinding.attachEvent("dataReceived", {}, this.onInternalDataReceived, this);
        this._oChartBinding = oInteractiveChartListBinding;
      }
    };
    _proto.detachDataReceivedHandler = function detachDataReceivedHandler(oInteractiveChartListBinding) {
      if (oInteractiveChartListBinding) {
        oInteractiveChartListBinding.detachEvent("dataReceived", this.onInternalDataReceived, this);
        this._oChartBinding = undefined;
      }
    };
    _proto.getInteractiveChart = function getInteractiveChart() {
      return this.getItems()[1].getItems()[0];
    };
    _proto.onInternalDataReceived = function onInternalDataReceived(oEvent) {
      const sId = this.getId();
      const oView = CommonUtils.getTargetView(this);
      const oInteractiveChart = this.getInteractiveChart();
      const sInternalContextPath = this.data("infoPath");
      const oInternalModelContext = oInteractiveChart.getBindingContext("internal");
      const oResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      const vUOM = oInteractiveChart.data("uom");
      VisualFilterUtils.updateChartScaleFactorTitle(oInteractiveChart, oView, sId, sInternalContextPath);
      if (oEvent.getParameter("error")) {
        const s18nMessageTitle = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE");
        const s18nMessage = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_DATA_TEXT");
        VisualFilterUtils.applyErrorMessageAndTitle(s18nMessageTitle, s18nMessage, sInternalContextPath, oView);
      } else if (oEvent.getParameter("data")) {
        const oData = oEvent.getSource().getCurrentContexts();
        if (oData && oData.length === 0) {
          VisualFilterUtils.setNoDataMessage(sInternalContextPath, oResourceBundle, oView);
        } else {
          oInternalModelContext.setProperty(sInternalContextPath, {});
        }
        VisualFilterUtils.setMultiUOMMessage(oData, oInteractiveChart, sInternalContextPath, oResourceBundle, oView);
      }
      if (vUOM && (vUOM["ISOCurrency"] && vUOM["ISOCurrency"].$Path || vUOM["Unit"] && vUOM["Unit"].$Path)) {
        const oContexts = oEvent.getSource().getContexts();
        const oContextData = oContexts && oContexts[0].getObject();
        VisualFilterUtils.applyUOMToTitle(oInteractiveChart, oContextData, oView, sInternalContextPath);
      }
    };
    return VisualFilter;
  }(VBox), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _class2)) || _class);
  return VisualFilter;
}, false);
//# sourceMappingURL=VisualFilter-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/m/Button", "sap/m/Label", "sap/m/OverflowToolbar", "sap/m/OverflowToolbarLayoutData", "sap/m/Title", "sap/m/ToolbarSpacer", "sap/m/VBox", "sap/ui/core/CustomData", "../controls/filterbar/VisualFilter", "./InteractiveChartHelper", "./VisualFilterRuntime", "./fragments/InteractiveCharts", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Log, merge, ClassSupport, BuildingBlock, ConverterContext, ManifestWrapper, DataVisualization, Aggregation, ModelHelper, StableIdHelper, Button, Label, OverflowToolbar, OverflowToolbarLayoutData, Title, ToolbarSpacer, VBox, CustomData, VisualFilterControl, InteractiveChartHelper, VisualFilterRuntime, InteractiveCharts, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29;
  var _exports = {};
  var getVisualFilterChart = InteractiveCharts.getVisualFilterChart;
  var generate = StableIdHelper.generate;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getDefaultSelectionVariant = DataVisualization.getDefaultSelectionVariant;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a VisualFilter based on the metadata provided by OData V4.
   * <br>
   * A Chart annotation is required to bring up an interactive chart
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:VisualFilter
   * collection="{entitySet&gt;}"
   * chartAnnotation="{chartAnnotation&gt;}"
   * id="someID"
   * groupId="someGroupID"
   * title="some Title"
   * /&gt;
   * </pre>
   * @private
   * @experimental
   */
  let VisualFilter = (_dec = defineUI5Class("sap.fe.macros.visualfilters.VisualFilter"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "boolean"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = event(), _dec6 = property({
    type: "string",
    required: true
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "string",
    required: true
  }), _dec9 = property({
    type: "string",
    required: true
  }), _dec10 = property({
    type: "string"
  }), _dec11 = property({
    type: "string"
  }), _dec12 = property({
    type: "string"
  }), _dec13 = property({
    type: "array"
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = property({
    type: "boolean"
  }), _dec16 = property({
    type: "boolean"
  }), _dec17 = property({
    type: "boolean"
  }), _dec18 = property({
    type: "array"
  }), _dec19 = property({
    type: "string"
  }), _dec20 = property({
    type: "boolean"
  }), _dec21 = property({
    type: "string"
  }), _dec22 = property({
    type: "boolean"
  }), _dec23 = property({
    type: "boolean"
  }), _dec24 = property({
    type: "boolean"
  }), _dec25 = property({
    type: "string"
  }), _dec26 = property({
    type: "string"
  }), _dec27 = property({
    type: "string"
  }), _dec28 = property({
    type: "string"
  }), _dec29 = property({
    type: "boolean"
  }), _dec30 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    /******************************************************
     * Internal Properties
     * ***************************************************/

    function VisualFilter(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "showValueHelp", _descriptor2, _this);
      _initializerDefineProperty(_this, "valueHelpIconSrc", _descriptor3, _this);
      _initializerDefineProperty(_this, "valueHelpRequest", _descriptor4, _this);
      _initializerDefineProperty(_this, "id", _descriptor5, _this);
      _initializerDefineProperty(_this, "title", _descriptor6, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor7, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor8, _this);
      _initializerDefineProperty(_this, "outParameter", _descriptor9, _this);
      _initializerDefineProperty(_this, "valuelistProperty", _descriptor10, _this);
      _initializerDefineProperty(_this, "selectionVariantAnnotation", _descriptor11, _this);
      _initializerDefineProperty(_this, "inParameters", _descriptor12, _this);
      _initializerDefineProperty(_this, "multipleSelectionAllowed", _descriptor13, _this);
      _initializerDefineProperty(_this, "required", _descriptor14, _this);
      _initializerDefineProperty(_this, "showOverlayInitially", _descriptor15, _this);
      _initializerDefineProperty(_this, "renderLineChart", _descriptor16, _this);
      _initializerDefineProperty(_this, "requiredProperties", _descriptor17, _this);
      _initializerDefineProperty(_this, "filterBarEntityType", _descriptor18, _this);
      _initializerDefineProperty(_this, "showError", _descriptor19, _this);
      _initializerDefineProperty(_this, "chartMeasure", _descriptor20, _this);
      _initializerDefineProperty(_this, "UoMHasCustomAggregate", _descriptor21, _this);
      _initializerDefineProperty(_this, "showValueHelpButton", _descriptor22, _this);
      _initializerDefineProperty(_this, "customAggregate", _descriptor23, _this);
      _initializerDefineProperty(_this, "groupId", _descriptor24, _this);
      _initializerDefineProperty(_this, "errorMessageTitle", _descriptor25, _this);
      _initializerDefineProperty(_this, "errorMessage", _descriptor26, _this);
      _initializerDefineProperty(_this, "_contentId", _descriptor27, _this);
      _initializerDefineProperty(_this, "draftSupported", _descriptor28, _this);
      _initializerDefineProperty(_this, "isValueListWithFixedValues", _descriptor29, _this);
      return _this;
    }
    _exports = VisualFilter;
    _inheritsLoose(VisualFilter, _BuildingBlock);
    var _proto = VisualFilter.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      this.groupId = "$auto.visualFilters";
      this.path = this.metaPath;
      const owner = this._getOwner();
      this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
      const contextObjectPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (this.contextPath) {
        this._resolvedContextPath = this.contextPath.endsWith("/") ? this.contextPath : this.contextPath + "/";
      }
      const metaModel = this.getMetaModel();
      const diagnostics = this.getAppComponent()?.getDiagnostics() ?? {};
      const viewData = this._getOwner()?.getRootController()?.getView().getViewData() ?? this._getOwner()?.getViewData();
      const converterContext = ConverterContext.createConverterContextForMacro(contextObjectPath?.startingEntitySet?.name, metaModel, diagnostics, merge, contextObjectPath?.contextLocation, new ManifestWrapper(viewData, this.getAppComponent()));
      const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext);
      const customAggregates = aggregationHelper.getCustomAggregateDefinitions();
      const pvAnnotation = contextObjectPath?.targetObject;
      let measure;
      const visualizations = pvAnnotation && pvAnnotation.Visualizations;
      this.getChartAnnotation(visualizations, converterContext);
      let aggregations = [],
        custAggMeasure = [];
      if (this.chartAnnotation?.Measures?.length) {
        custAggMeasure = customAggregates.filter(custAgg => {
          return custAgg.qualifier === this.chartAnnotation?.Measures[0].value;
        });
        measure = custAggMeasure.length > 0 ? custAggMeasure[0].qualifier : this.chartAnnotation.Measures[0].value;
        aggregations = aggregationHelper.getAggregatedProperties()[0];
      }
      // if there are AggregatedProperty objects but no dynamic measures, rather there are transformation aggregates found in measures
      if (aggregations && aggregations.length > 0 && !this.chartAnnotation?.DynamicMeasures && custAggMeasure.length === 0 && this.chartAnnotation?.Measures && this.chartAnnotation?.Measures.length > 0) {
        Log.warning("The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly.");
      }
      //if the chart has dynamic measures, but with no other custom aggregate measures then consider the dynamic measures
      if (this.chartAnnotation?.DynamicMeasures) {
        if (custAggMeasure.length === 0) {
          measure = converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(this.chartAnnotation.DynamicMeasures[0].value)).getDataModelObjectPath().targetObject?.Name.toString();
          aggregations = aggregationHelper.getAggregatedProperty();
        } else {
          Log.warning("The dynamic measures have been ignored as visual filters can deal with only 1 measure and the first (custom aggregate) measure defined under Chart.Measures is considered.");
        }
      }
      if (customAggregates.some(function (custAgg) {
        return custAgg.qualifier === measure;
      })) {
        this.customAggregate = true;
      }
      const defaultSelectionVariant = getDefaultSelectionVariant(converterContext.getEntityType());
      this.checkSelectionVariant(defaultSelectionVariant);
      const aggregation = this.getAggregateProperties(aggregations, measure);
      if (aggregation) {
        this.aggregateProperties = aggregation;
      }
      const propertyAnnotations = visualizations && this.chartAnnotation?.Measures && this.chartAnnotation?.Measures[0]?.$target?.annotations;
      const aggregatablePropertyAnnotations = aggregation?.AggregatableProperty?.$target?.annotations;
      this.checkIfUOMHasCustomAggregate(customAggregates, propertyAnnotations, aggregatablePropertyAnnotations);
      const propertyHidden = propertyAnnotations?.UI?.Hidden;
      const hiddenMeasure = propertyHidden?.valueOf();
      const chartType = this.chartAnnotation?.ChartType;
      this.chartType = chartType;
      this.showValueHelpButton = this.getshowValueHelpButton(chartType, hiddenMeasure);
      this.draftSupported = ModelHelper.isDraftSupported(metaModel, this.contextPath);
      /**
       * If the measure of the chart is marked as 'hidden', or if the chart type is invalid, or if the data type for the line chart is invalid,
       * the call is made to the InteractiveChartWithError fragment (using error-message related APIs, but avoiding batch calls)
       */
      this.errorMessage = this.getErrorMessage(hiddenMeasure, measure);
      this.chartMeasure = measure;
      this.measureDimensionTitle = InteractiveChartHelper.getMeasureDimensionTitle(this.chartAnnotation, this.customAggregate, this.aggregateProperties);
      const collection = this.getDataModelObjectForMetaPath(this.contextPath);
      this.toolTip = InteractiveChartHelper.getToolTip(this.chartAnnotation, collection, this.path, this.customAggregate, this.aggregateProperties, this.renderLineChart);
      this.UoMVisibility = InteractiveChartHelper.getUoMVisiblity(this.chartAnnotation, this.showError);
      this.scaleUoMTitle = InteractiveChartHelper.getScaleUoMTitle(this.chartAnnotation, collection, this.path, this.customAggregate, this.aggregateProperties);
      this.collection = collection;
      this.sortOrder = pvAnnotation?.SortOrder;
      this.filterCountBinding = InteractiveChartHelper.getfilterCountBinding(this.chartAnnotation);
      const viewId = this.getPageController()?.getView().getId();
      if (this._contentId) {
        this._contentId = `${viewId}--${this._contentId}`;
      }
      this.selectionVariant = this.selectionVariantAnnotation ? this.getDataModelObjectForMetaPath(this.selectionVariantAnnotation)?.targetObject : undefined;
      this.content = this.createContent();
    }

    /**
     * Check if the UoM has custom aggregate
     * @param customAggregates - Custom aggregates
     * @param propertyAnnotations - Property annotations
     * @param aggregatablePropertyAnnotations - Aggregatable property annotations
     */;
    _proto.checkIfUOMHasCustomAggregate = function checkIfUOMHasCustomAggregate(customAggregates, propertyAnnotations, aggregatablePropertyAnnotations) {
      const measures = propertyAnnotations?.Measures;
      const aggregatablePropertyMeasures = aggregatablePropertyAnnotations?.Measures;
      const UOM = this.getUoM(measures, aggregatablePropertyMeasures);
      if (UOM && customAggregates.some(function (custAgg) {
        return custAgg.qualifier === UOM;
      })) {
        this.UoMHasCustomAggregate = true;
      } else {
        this.UoMHasCustomAggregate = false;
      }
    }

    /**
     * Get the chart annotation.
     * @param visualizations Visualizations
     * @param converterContext Converter context
     */;
    _proto.getChartAnnotation = function getChartAnnotation(visualizations, converterContext) {
      if (visualizations) {
        for (let visualization of visualizations) {
          const sAnnotationPath = visualization && visualization.value;
          this.chartAnnotation = converterContext.getEntityTypeAnnotation(sAnnotationPath) && converterContext.getEntityTypeAnnotation(sAnnotationPath).annotation;
        }
      }
    }

    /**
     * Sets the flag to show or hide the value help for the visual filter.
     * @param bShowValueHelp Flag indicating whether to show or hide the value help.
     */;
    _proto.setShowValueHelp = function setShowValueHelp(bShowValueHelp) {
      if (this.content?.isA("sap.fe.macros.controls.filterbar.VisualFilter")) {
        if (this.content?.getItems().length > 0) {
          const oVisualFilterControl = this.getVisualFilterControl();
          oVisualFilterControl?.getContent().some(function (oInnerControl) {
            if (oInnerControl.isA("sap.m.Button")) {
              oInnerControl.setVisible(bShowValueHelp);
            }
          });
          this.setProperty("showValueHelp", bShowValueHelp);
        }
      }
    }

    /**
     * Sets the source of the value help icon.
     * @param sIconSrc The source of the value help icon
     */;
    _proto.setValueHelpIconSrc = function setValueHelpIconSrc(sIconSrc) {
      if (this.content?.isA("sap.fe.macros.controls.filterbar.VisualFilter")) {
        if (this.content?.getItems().length > 0) {
          const oVisualFilterControl = this.getVisualFilterControl();
          oVisualFilterControl?.getContent().some(function (oInnerControl) {
            if (oInnerControl.isA("sap.m.Button")) {
              oInnerControl.setIcon(sIconSrc);
            }
          });
          this.setProperty("valueHelpIconSrc", sIconSrc);
        }
      }
    }

    /**
     * Retrieves the visual filter control from the content.
     * @returns The visual filter control or undefined if not found
     */;
    _proto.getVisualFilterControl = function getVisualFilterControl() {
      if (this.content?.isA("sap.fe.macros.controls.filterbar.VisualFilter")) {
        return (this.content?.getItems()[0]).getItems()[0];
      }
    }

    /**
     * Retrieves the error message for a hidden measure.
     * @param hiddenMeasure The hidden measure object
     * @param measure The measure name
     * @returns The error message, if any
     */;
    _proto.getErrorMessage = function getErrorMessage(hiddenMeasure, measure) {
      let validChartType;
      if (this.chartAnnotation) {
        if (this.chartAnnotation.ChartType === "UI.ChartType/Line" || this.chartAnnotation.ChartType === "UI.ChartType/Bar") {
          validChartType = true;
        } else {
          validChartType = false;
        }
      }
      if (typeof hiddenMeasure === "boolean" && hiddenMeasure || !validChartType || this.renderLineChart === false) {
        this.showError = true;
        this.errorMessageTitle = hiddenMeasure || !validChartType ? this.getTranslatedText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE") : this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_INVALID_DATATYPE");
        if (hiddenMeasure) {
          return this.getTranslatedText("M_VISUAL_FILTER_HIDDEN_MEASURE", [measure]);
        } else if (!validChartType) {
          return this.getTranslatedText("M_VISUAL_FILTER_UNSUPPORTED_CHART_TYPE");
        } else {
          return this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_UNSUPPORTED_DIMENSION");
        }
      }
    }

    /**
     * Determines whether to show the value help button for the visual filter.
     *
     * @param chartType The type of chart used in the visual filter
     * @param hiddenMeasure The hidden measure object
     * @returns A boolean indicating whether to show the value help button
     */;
    _proto.getshowValueHelpButton = function getshowValueHelpButton(chartType, hiddenMeasure) {
      const sDimensionType = this.chartAnnotation?.Dimensions[0] && this.chartAnnotation?.Dimensions[0].$target && this.chartAnnotation.Dimensions[0].$target.type;
      if (sDimensionType === "Edm.Date" || sDimensionType === "Edm.Time" || sDimensionType === "Edm.DateTimeOffset") {
        return false;
      } else if (typeof hiddenMeasure === "boolean" && hiddenMeasure) {
        return false;
      } else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
        return false;
      } else if (this.renderLineChart === false && chartType === "UI.ChartType/Line") {
        return false;
      } else if (this.isValueListWithFixedValues === true) {
        return false;
      } else {
        return true;
      }
    }

    /**
     * Checks the selection variant for the visual filter.
     *
     * @param defaultSelectionVariant The default selection variant to be checked
     * @returns void
     */;
    _proto.checkSelectionVariant = function checkSelectionVariant(defaultSelectionVariant) {
      let selectionVariant;
      if (this.selectionVariantAnnotation) {
        selectionVariant = this.getDataModelObjectForMetaPath(this.selectionVariantAnnotation)?.targetObject;
      }
      if (!selectionVariant && defaultSelectionVariant) {
        selectionVariant = defaultSelectionVariant;
      }
      if (selectionVariant && selectionVariant.SelectOptions && !this.multipleSelectionAllowed) {
        for (const selectOption of selectionVariant.SelectOptions) {
          if (selectOption.PropertyName?.value === this.chartAnnotation?.Dimensions[0].value) {
            if (selectOption.Ranges.length > 1) {
              Log.error("Multiple SelectOptions for FilterField having SingleValue Allowed Expression");
            }
          }
        }
      }
    }

    /**
     * Retrieves the aggregate properties based on the provided aggregations and measure.
     * @param aggregations The list of aggregated properties
     * @param measure The optional measure to filter the aggregated properties
     * @returns The matching aggregated property, if found; otherwise, undefined
     */;
    _proto.getAggregateProperties = function getAggregateProperties(aggregations, measure) {
      let matchedAggregate;
      if (!aggregations) {
        return;
      }
      aggregations.some(function (aggregate) {
        if (aggregate.Name === measure) {
          matchedAggregate = aggregate;
          return true;
        }
      });
      return matchedAggregate;
    }

    /**
     * Retrieves the unit of measure (UoM) for the visual filter.
     *
     * @param measures The measures for the visual filter
     * @param aggregatablePropertyMeasures The aggregatable property measures for the visual filter
     * @returns The unit of measure for the visual filter
     */;
    _proto.getUoM = function getUoM(measures, aggregatablePropertyMeasures) {
      let ISOCurrency = measures?.ISOCurrency;
      let unit = measures?.Unit;
      if (!ISOCurrency && !unit && aggregatablePropertyMeasures) {
        ISOCurrency = aggregatablePropertyMeasures.ISOCurrency;
        unit = aggregatablePropertyMeasures.Unit;
      }
      return ISOCurrency?.path || unit?.path;
    };
    _proto.getRequired = function getRequired() {
      if (this.required) {
        return _jsx(Label, {
          text: "",
          width: "0.5rem",
          required: "true",
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: "Never"
            })
          }
        });
      } else {
        return "";
      }
    };
    _proto.getTitle = function getTitle() {
      return _jsx(Title, {
        id: generate([this._contentId, "MeasureDimensionTitle"]),
        text: this.measureDimensionTitle,
        tooltip: this.toolTip,
        titleStyle: "H6",
        level: "H3",
        class: "sapUiTinyMarginEnd sapUiNoMarginBegin"
      });
    };
    _proto.getUoMTitle = function getUoMTitle(showErrorExpression) {
      if (this.UoMVisibility) {
        return _jsx(Title, {
          id: generate([this._contentId, "ScaleUoMTitle"]),
          visible: showErrorExpression,
          text: this.scaleUoMTitle,
          titleStyle: "H6",
          level: "H3",
          width: "4.15rem"
        });
      } else {
        return "";
      }
    };
    _proto.getToolBarSpacer = function getToolBarSpacer() {
      if (this.showValueHelpButton) {
        return _jsx(ToolbarSpacer, {});
      } else {
        return "";
      }
    };
    _proto.getValueHelp = function getValueHelp(showErrorExpression) {
      if (this.showValueHelpButton) {
        return _jsx(Button, {
          id: generate([this._contentId, "VisualFilterValueHelpButton"]),
          type: "Transparent",
          ariaHasPopup: "Dialog",
          text: this.filterCountBinding,
          enabled: showErrorExpression,
          press: event => {
            VisualFilterRuntime.fireValueHelp(event);
          },
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: "Never"
            }),
            customData: _jsx(CustomData, {
              value: this.multipleSelectionAllowed
            }, "multipleSelectionAllowed")
          }
        });
      } else {
        return "";
      }
    };
    _proto.getToolbar = function getToolbar(showErrorExpression) {
      return _jsx(OverflowToolbar, {
        style: "Clear",
        children: {
          content: _jsxs(_Fragment, {
            children: [this.getRequired(), this.getTitle(), this.getUoMTitle(showErrorExpression), this.getToolBarSpacer(), this.getValueHelp(showErrorExpression)]
          })
        }
      });
    };
    _proto.createContent = function createContent() {
      const id = generate([this.path]);
      const showErrorExpression = "{= !${internal>" + id + "/showError}}";
      const cozyMode = document.body.classList.contains("sapUiSizeCozy");
      const overallHeight = cozyMode ? "13rem" : "100%";
      const chartHeight = cozyMode ? "100%" : "7.5rem";
      const vfControlId = this._contentId ? generate([this._contentId]) : undefined;
      return _jsx(VisualFilterControl, {
        id: vfControlId,
        height: overallHeight,
        width: "20.5rem",
        class: "sapUiSmallMarginBeginEnd",
        children: {
          customData: _jsx(CustomData, {
            value: generate([this.path])
          }, "infoPath"),
          items: _jsxs(_Fragment, {
            children: [_jsx(VBox, {
              height: "2rem",
              class: "sapUiTinyMarginTopBottom",
              children: this.getToolbar(showErrorExpression)
            }), _jsx(VBox, {
              height: chartHeight,
              width: "100%",
              children: getVisualFilterChart(this)
            })]
          })
        }
      });
    };
    return VisualFilter;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "showValueHelp", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "valueHelpIconSrc", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "valueHelpRequest", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "outParameter", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "valuelistProperty", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "selectionVariantAnnotation", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "inParameters", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "multipleSelectionAllowed", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "showOverlayInitially", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "renderLineChart", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "requiredProperties", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "filterBarEntityType", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "showError", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "chartMeasure", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "UoMHasCustomAggregate", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "showValueHelpButton", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "customAggregate", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "groupId", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "$auto.visualFilters";
    }
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "errorMessageTitle", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "errorMessage", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "_contentId", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "draftSupported", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "isValueListWithFixedValues", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = VisualFilter;
  return _exports;
}, false);
//# sourceMappingURL=VisualFilter-dbg.js.map

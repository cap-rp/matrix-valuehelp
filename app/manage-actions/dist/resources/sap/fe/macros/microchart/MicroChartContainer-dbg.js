/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/m/FlexBox", "sap/m/Label", "sap/m/library", "sap/ui/core/Control", "sap/ui/core/format/NumberFormat", "sap/ui/model/odata/v4/ODataListBinding", "sap/ui/model/odata/v4/ODataMetaModel", "sap/ui/model/type/Date"], function (Log, ClassSupport, FlexBox, Label, mobilelibrary, Control, NumberFormat, ODataV4ListBinding, ODataMetaModel, DateType) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  const ValueColor = mobilelibrary.ValueColor;
  /**
   *  Container Control for Micro Chart and UoM.
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  let MicroChartContainer = (_dec = defineUI5Class("sap.fe.macros.microchart.MicroChartContainer"), _dec2 = property({
    type: "boolean",
    defaultValue: false
  }), _dec3 = property({
    type: "string",
    defaultValue: undefined
  }), _dec4 = property({
    type: "string[]",
    defaultValue: []
  }), _dec5 = property({
    type: "string",
    defaultValue: undefined
  }), _dec6 = property({
    type: "string[]",
    defaultValue: []
  }), _dec7 = property({
    type: "int",
    defaultValue: undefined
  }), _dec8 = property({
    type: "int",
    defaultValue: 1
  }), _dec9 = property({
    type: "int",
    defaultValue: undefined
  }), _dec10 = property({
    type: "string",
    defaultValue: ""
  }), _dec11 = property({
    type: "string",
    defaultValue: ""
  }), _dec12 = property({
    type: "string",
    defaultValue: ""
  }), _dec13 = event(), _dec14 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec15 = aggregation({
    type: "sap.m.Label",
    multiple: false
  }), _dec16 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function MicroChartContainer(id, settings) {
      var _this;
      _this = _Control.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "showOnlyChart", _descriptor, _this);
      _initializerDefineProperty(_this, "uomPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "measures", _descriptor3, _this);
      _initializerDefineProperty(_this, "dimension", _descriptor4, _this);
      _initializerDefineProperty(_this, "dataPointQualifiers", _descriptor5, _this);
      _initializerDefineProperty(_this, "measurePrecision", _descriptor6, _this);
      _initializerDefineProperty(_this, "measureScale", _descriptor7, _this);
      _initializerDefineProperty(_this, "dimensionPrecision", _descriptor8, _this);
      _initializerDefineProperty(_this, "chartTitle", _descriptor9, _this);
      _initializerDefineProperty(_this, "chartDescription", _descriptor10, _this);
      _initializerDefineProperty(_this, "calendarPattern", _descriptor11, _this);
      _initializerDefineProperty(_this, "onTitlePressed", _descriptor12, _this);
      _initializerDefineProperty(_this, "microChart", _descriptor13, _this);
      _initializerDefineProperty(_this, "_uomLabel", _descriptor14, _this);
      _initializerDefineProperty(_this, "microChartTitle", _descriptor15, _this);
      return _this;
    }
    _inheritsLoose(MicroChartContainer, _Control);
    MicroChartContainer.render = function render(renderManager, control) {
      renderManager.openStart("div", control);
      renderManager.openEnd();
      if (!control.showOnlyChart) {
        const chartTitle = control.microChartTitle;
        if (chartTitle) {
          chartTitle.forEach(function (subChartTitle) {
            renderManager.openStart("div");
            renderManager.openEnd();
            renderManager.renderControl(subChartTitle);
            renderManager.close("div");
          });
        }
        renderManager.openStart("div");
        renderManager.openEnd();
        const chartDescription = new Label({
          text: control.chartDescription
        });
        renderManager.renderControl(chartDescription);
        renderManager.close("div");
      }
      const microChart = control.microChart;
      if (microChart) {
        microChart.addStyleClass("sapUiTinyMarginTopBottom");
        renderManager.renderControl(microChart);
        if (!control.showOnlyChart && control.uomPath) {
          const settings = control._checkIfChartRequiresRuntimeLabels() ? undefined : {
              text: {
                path: control.uomPath
              }
            },
            label = new Label(settings),
            flexBox = new FlexBox({
              alignItems: "Start",
              justifyContent: "End",
              items: [label]
            });
          renderManager.renderControl(flexBox);
          control.setAggregation("_uomLabel", label);
        }
      }
      renderManager.close("div");
    };
    var _proto = MicroChartContainer.prototype;
    _proto.onBeforeRendering = function onBeforeRendering() {
      const binding = this._getListBindingForRuntimeLabels();
      if (binding) {
        binding.detachEvent("change", this._setRuntimeChartLabelsAndUnitOfMeasure, this);
        this._olistBinding = undefined;
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      const binding = this._getListBindingForRuntimeLabels();
      if (!this._checkIfChartRequiresRuntimeLabels()) {
        return;
      }
      if (binding) {
        binding.attachEvent("change", undefined, this._setRuntimeChartLabelsAndUnitOfMeasure, this);
        this._olistBinding = binding;
      }
    };
    _proto.setShowOnlyChart = function setShowOnlyChart(value) {
      if (!value && this._olistBinding) {
        this._setChartLabels();
      }
      this.setProperty("showOnlyChart", value, false /*re-rendering*/);
    };
    _proto._checkIfChartRequiresRuntimeLabels = function _checkIfChartRequiresRuntimeLabels() {
      const microChart = this.microChart;
      if (microChart) {
        return Boolean(microChart.isA("sap.suite.ui.microchart.AreaMicroChart") || microChart.isA("sap.suite.ui.microchart.ColumnMicroChart") || microChart.isA("sap.suite.ui.microchart.LineMicroChart") || microChart.isA("sap.suite.ui.microchart.ComparisonMicroChart"));
      }
      return false;
    };
    _proto._checkForChartLabelAggregations = function _checkForChartLabelAggregations() {
      const microChart = this.microChart;
      if (microChart) {
        return Boolean(microChart.isA("sap.suite.ui.microchart.AreaMicroChart") && microChart.getAggregation("firstYLabel") && microChart.getAggregation("lastYLabel") && microChart.getAggregation("firstXLabel") && microChart.getAggregation("lastXLabel") || microChart.isA("sap.suite.ui.microchart.ColumnMicroChart") && microChart.getAggregation("leftTopLabel") && microChart.getAggregation("rightTopLabel") && microChart.getAggregation("leftBottomLabel") && microChart.getAggregation("rightBottomLabel") || microChart.isA("sap.suite.ui.microchart.LineMicroChart"));
      }
      return false;
    };
    _proto._getListBindingForRuntimeLabels = function _getListBindingForRuntimeLabels() {
      const microChart = this.microChart;
      let binding;
      if (microChart) {
        if (microChart.isA("sap.suite.ui.microchart.AreaMicroChart")) {
          const chart = microChart.getChart();
          binding = chart && chart.getBinding("points");
        } else if (microChart.isA("sap.suite.ui.microchart.ColumnMicroChart")) {
          binding = microChart.getBinding("columns");
        } else if (microChart.isA("sap.suite.ui.microchart.LineMicroChart")) {
          const lines = microChart.getLines();
          binding = lines && lines.length && lines[0].getBinding("points");
        } else if (microChart.isA("sap.suite.ui.microchart.ComparisonMicroChart")) {
          binding = microChart.getBinding("data");
        }
      }
      return binding instanceof ODataV4ListBinding ? binding : false;
    };
    _proto._setRuntimeChartLabelsAndUnitOfMeasure = async function _setRuntimeChartLabelsAndUnitOfMeasure() {
      const listBinding = this._olistBinding,
        contexts = listBinding?.getContexts(),
        measures = this.measures,
        dimension = this.dimension,
        unitOfMeasurePath = this.uomPath,
        microChart = this.microChart,
        unitOfMeasureLabel = this._uomLabel;
      if (unitOfMeasureLabel && unitOfMeasurePath && contexts && contexts.length && !this.showOnlyChart) {
        unitOfMeasureLabel.setText(contexts[0].getObject(unitOfMeasurePath));
      } else if (unitOfMeasureLabel) {
        unitOfMeasureLabel.setText("");
      }
      if (!this._checkForChartLabelAggregations()) {
        return;
      }
      if (!contexts || !contexts.length) {
        this._setChartLabels();
        return;
      }
      const firstContext = contexts[0],
        lastContext = contexts[contexts.length - 1],
        linesPomises = [],
        lineChart = microChart?.isA("sap.suite.ui.microchart.LineMicroChart"),
        currentMinX = firstContext.getObject(dimension),
        currentMaxX = lastContext.getObject(dimension);
      let currentMinY,
        currentMaxY,
        minX = {
          value: Infinity
        },
        maxX = {
          value: -Infinity
        },
        minY = {
          value: Infinity
        },
        maxY = {
          value: -Infinity
        };
      minX = currentMinX == undefined ? minX : {
        context: firstContext,
        value: currentMinX
      };
      maxX = currentMaxX == undefined ? maxX : {
        context: lastContext,
        value: currentMaxX
      };
      if (measures?.length) {
        measures.forEach((measure, i) => {
          currentMinY = firstContext.getObject(measure);
          currentMaxY = lastContext.getObject(measure);
          maxY = currentMaxY > maxY.value ? {
            context: lastContext,
            value: currentMaxY,
            index: lineChart ? i : 0
          } : maxY;
          minY = currentMinY < minY.value ? {
            context: firstContext,
            value: currentMinY,
            index: lineChart ? i : 0
          } : minY;
          if (lineChart) {
            linesPomises.push(this._getCriticalityFromPoint({
              context: lastContext,
              value: currentMaxY,
              index: i
            }));
          }
        });
      }
      this._setChartLabels(minY.value, maxY.value, minX.value, maxX.value);
      if (lineChart) {
        const colors = await Promise.all(linesPomises);
        if (colors?.length) {
          const lines = microChart.getLines();
          lines.forEach(function (line, i) {
            line.setColor(colors[i]);
          });
        }
      } else {
        await this._setChartLabelsColors(maxY, minY);
      }
    };
    _proto._setChartLabelsColors = async function _setChartLabelsColors(maxY, minY) {
      const microChart = this.microChart;
      const criticality = await Promise.all([this._getCriticalityFromPoint(minY), this._getCriticalityFromPoint(maxY)]);
      if (microChart?.isA("sap.suite.ui.microchart.AreaMicroChart")) {
        microChart.getAggregation("firstYLabel").setProperty("color", criticality[0], true);
        microChart.getAggregation("lastYLabel").setProperty("color", criticality[1], true);
      } else if (microChart?.isA("sap.suite.ui.microchart.ColumnMicroChart")) {
        microChart.getAggregation("leftTopLabel").setProperty("color", criticality[0], true);
        microChart.getAggregation("rightTopLabel").setProperty("color", criticality[1], true);
      }
    };
    _proto._setChartLabels = function _setChartLabels(leftTop, rightTop, leftBottom, rightBottom) {
      const microChart = this.microChart;
      leftTop = this._formatDateAndNumberValue(leftTop, this.measurePrecision, this.measureScale);
      rightTop = this._formatDateAndNumberValue(rightTop, this.measurePrecision, this.measureScale);
      leftBottom = this._formatDateAndNumberValue(leftBottom, this.dimensionPrecision, undefined, this.calendarPattern);
      rightBottom = this._formatDateAndNumberValue(rightBottom, this.dimensionPrecision, undefined, this.calendarPattern);
      if (microChart?.isA("sap.suite.ui.microchart.AreaMicroChart")) {
        microChart.getAggregation("firstYLabel").setProperty("label", leftTop, false);
        microChart.getAggregation("lastYLabel").setProperty("label", rightTop, false);
        microChart.getAggregation("firstXLabel").setProperty("label", leftBottom, false);
        microChart.getAggregation("lastXLabel").setProperty("label", rightBottom, false);
      } else if (microChart?.isA("sap.suite.ui.microchart.ColumnMicroChart")) {
        microChart.getAggregation("leftTopLabel").setProperty("label", leftTop, false);
        microChart.getAggregation("rightTopLabel").setProperty("label", rightTop, false);
        microChart.getAggregation("leftBottomLabel").setProperty("label", leftBottom, false);
        microChart.getAggregation("rightBottomLabel").setProperty("label", rightBottom, false);
      } else if (microChart?.isA("sap.suite.ui.microchart.LineMicroChart")) {
        microChart.setProperty("leftTopLabel", leftTop, false);
        microChart.setProperty("rightTopLabel", rightTop, false);
        microChart.setProperty("leftBottomLabel", leftBottom, false);
        microChart.setProperty("rightBottomLabel", rightBottom, false);
      }
    };
    _proto._getCriticalityFromPoint = async function _getCriticalityFromPoint(point) {
      if (point?.context) {
        const metaModel = this.getModel() && this.getModel().getMetaModel(),
          dataPointQualifiers = this.dataPointQualifiers,
          metaPath = metaModel instanceof ODataMetaModel && point.context.getPath() && metaModel.getMetaPath(point.context.getPath());
        if (metaModel && typeof metaPath === "string") {
          const dataPoint = await metaModel.requestObject(`${metaPath}/@${"com.sap.vocabularies.UI.v1.DataPoint"}${point.index !== undefined && dataPointQualifiers[point.index] ? `#${dataPointQualifiers[point.index]}` : ""}`);
          if (dataPoint) {
            let criticality = ValueColor.Neutral;
            const context = point.context;
            if (dataPoint.Criticality) {
              criticality = this._criticality(dataPoint.Criticality, context);
            } else if (dataPoint.CriticalityCalculation) {
              const criticalityCalculation = dataPoint.CriticalityCalculation;
              const getValue = function (valueProperty) {
                let valueResponse;
                if (valueProperty?.$Path) {
                  valueResponse = context.getObject(valueProperty.$Path);
                } else if (valueProperty?.hasOwnProperty("$Decimal")) {
                  valueResponse = valueProperty.$Decimal;
                }
                return valueResponse;
              };
              criticality = this._criticalityCalculation(criticalityCalculation.ImprovementDirection.$EnumMember, point.value, getValue(criticalityCalculation.DeviationRangeLowValue), getValue(criticalityCalculation.ToleranceRangeLowValue), getValue(criticalityCalculation.AcceptanceRangeLowValue), getValue(criticalityCalculation.AcceptanceRangeHighValue), getValue(criticalityCalculation.ToleranceRangeHighValue), getValue(criticalityCalculation.DeviationRangeHighValue));
            }
            return criticality;
          }
        }
      }
      return Promise.resolve(ValueColor.Neutral);
    };
    _proto._criticality = function _criticality(criticality, context) {
      let criticalityValue, result;
      if (criticality.$Path) {
        criticalityValue = context.getObject(criticality.$Path);
        if (criticalityValue === "Negative" || criticalityValue.toString() === "1") {
          result = ValueColor.Error;
        } else if (criticalityValue === "Critical" || criticalityValue.toString() === "2") {
          result = ValueColor.Critical;
        } else if (criticalityValue === "Positive" || criticalityValue.toString() === "3") {
          result = ValueColor.Good;
        }
      } else if (criticality.$EnumMember) {
        criticalityValue = criticality.$EnumMember;
        if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Negative")) {
          result = ValueColor.Error;
        } else if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Positive")) {
          result = ValueColor.Good;
        } else if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Critical")) {
          result = ValueColor.Critical;
        }
      }
      if (result === undefined) {
        Log.warning("Case not supported, returning the default Value Neutral");
        return ValueColor.Neutral;
      }
      return result;
    };
    _proto._criticalityCalculation = function _criticalityCalculation(improvementDirection, value, deviationLow, toleranceLow, acceptanceLow, acceptanceHigh, toleranceHigh, deviationHigh) {
      let result;

      // Dealing with Decimal and Path based bingdings
      deviationLow = deviationLow == undefined ? -Infinity : deviationLow;
      toleranceLow = toleranceLow == undefined ? deviationLow : toleranceLow;
      acceptanceLow = acceptanceLow == undefined ? toleranceLow : acceptanceLow;
      deviationHigh = deviationHigh == undefined ? Infinity : deviationHigh;
      toleranceHigh = toleranceHigh == undefined ? deviationHigh : toleranceHigh;
      acceptanceHigh = acceptanceHigh == undefined ? toleranceHigh : acceptanceHigh;

      // Creating runtime expression binding from criticality calculation for Criticality State
      if (improvementDirection.includes("Minimize")) {
        if (value <= acceptanceHigh) {
          result = ValueColor.Good;
        } else if (value <= toleranceHigh) {
          result = ValueColor.Neutral;
        } else if (value <= deviationHigh) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      } else if (improvementDirection.includes("Maximize")) {
        if (value >= acceptanceLow) {
          result = ValueColor.Good;
        } else if (value >= toleranceLow) {
          result = ValueColor.Neutral;
        } else if (value >= deviationLow) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      } else if (improvementDirection.includes("Target")) {
        if (value <= acceptanceHigh && value >= acceptanceLow) {
          result = ValueColor.Good;
        } else if (value >= toleranceLow && value < acceptanceLow || value > acceptanceHigh && value <= toleranceHigh) {
          result = ValueColor.Neutral;
        } else if (value >= deviationLow && value < toleranceLow || value > toleranceHigh && value <= deviationHigh) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      }
      if (result === undefined) {
        Log.warning("Case not supported, returning the default Value Neutral");
        return ValueColor.Neutral;
      }
      return result;
    };
    _proto._formatDateAndNumberValue = function _formatDateAndNumberValue(value, precision, scale, pattern) {
      if (pattern) {
        return this._getSemanticsValueFormatter(pattern).formatValue(value, "string");
      } else if (!isNaN(value)) {
        return this._getLabelNumberFormatter(precision, scale).format(value);
      }
      return value;
    };
    _proto._getSemanticsValueFormatter = function _getSemanticsValueFormatter(pattern) {
      if (!this._oDateType) {
        this._oDateType = new DateType({
          style: "short",
          source: {
            pattern
          }
        });
      }
      return this._oDateType;
    };
    _proto._getLabelNumberFormatter = function _getLabelNumberFormatter(precision, scale) {
      return NumberFormat.getFloatInstance({
        style: "short",
        showScale: true,
        precision: typeof precision === "number" && precision || 0,
        decimals: typeof scale === "number" && scale || 0
      });
    };
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      return this.microChart?.getAccessibilityInfo();
    };
    return MicroChartContainer;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "showOnlyChart", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "uomPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "measures", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "dimension", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "dataPointQualifiers", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "measurePrecision", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "measureScale", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "dimensionPrecision", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "chartTitle", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "chartDescription", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "calendarPattern", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "onTitlePressed", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "microChart", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_uomLabel", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "microChartTitle", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return MicroChartContainer;
}, false);
//# sourceMappingURL=MicroChartContainer-dbg.js.map

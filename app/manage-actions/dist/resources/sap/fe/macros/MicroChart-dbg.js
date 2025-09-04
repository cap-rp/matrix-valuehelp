/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/m/Text", "sap/ui/core/Lib", "./CommonHelper", "./controls/ConditionalWrapper", "./internal/TitleLink", "./microchart/MicroChartContainer", "./microchart/MicroChartHelper", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, ID, CriticalityFormatters, DataModelPathHelper, UIFormatters, Text, Lib, CommonHelper, ConditionalWrapper, TitleLink, MicroChartContainer, MicroChartHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var getExpressionForMeasureUnit = UIFormatters.getExpressionForMeasureUnit;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var buildExpressionForCriticalityColorMicroChart = CriticalityFormatters.buildExpressionForCriticalityColorMicroChart;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  var NavigationType = /*#__PURE__*/function (NavigationType) {
    /**
     * For External Navigation
     */
    NavigationType["External"] = "External";
    /**
     * For In-Page Navigation
     */
    NavigationType["InPage"] = "InPage";
    /**
     * For No Navigation
     */
    NavigationType["None"] = "None";
    return NavigationType;
  }(NavigationType || {});
  /**
   * Building block used to create a MicroChart based on the metadata provided by OData V4.
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/microchart/ Overview of Micro Chart Building Block}
   * <br>
   * Usually, a contextPath and metaPath is expected.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:MicroChart id="MyMicroChart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
   * </pre>
   *  <pre>
   * sap.ui.require(["sap/fe/macros/MicroChart"], function(MicroChart) {
   * 	 ...
   * 	 new MicroChart("myMicroChart", {metaPath:"@com.sap.vocabularies.UI.v1.Chart"})
   * })
   * </pre>
   * @alias sap.fe.macros.MicroChart
   * @ui5-metamodel
   * @public
   * @since 1.93.0
   */
  let MicroChart = (_dec = defineUI5Class("sap.fe.macros.MicroChart", {
    returnTypes: ["sap.fe.macros.microchart.MicroChartContainer", "sap.fe.macros.controls.ConditionalWrapper"]
  }), _dec2 = property({
    type: "boolean"
  }), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string"
  }), _dec10 = property({
    type: "string"
  }), _dec11 = event(), _dec12 = property({
    type: "object"
  }), _dec13 = property({
    type: "object"
  }), _dec14 = property({
    type: "object"
  }), _dec15 = property({
    type: "object"
  }), _dec16 = property({
    type: "string"
  }), _dec17 = property({
    type: "object"
  }), _dec18 = property({
    type: "object"
  }), _dec19 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function MicroChart(settings, others) {
      var _this;
      _this = _BuildingBlock.call(this, settings, others) || this;
      /**
       * To control the rendering of Title, Subtitle and Currency Labels. When the size is xs then we do
       * not see the inner labels of the MicroChart as well.
       * @public
       */
      _initializerDefineProperty(_this, "showOnlyChart", _descriptor, _this);
      /**
       * Metadata path to the  MicroChart.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      /**
       * context path to the MicroChart.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * Type of navigation, that is, External or InPage
       */
      _initializerDefineProperty(_this, "navigationType", _descriptor4, _this);
      /**
       * Batch group ID along with which this call should be grouped.
       */
      _initializerDefineProperty(_this, "batchGroupId", _descriptor5, _this);
      /**
       * Size of the MicroChart
       * @public
       */
      _initializerDefineProperty(_this, "size", _descriptor6, _this);
      /**
       * Show blank space in case there is no data in the chart
       * @public
       */
      _initializerDefineProperty(_this, "hideOnNoData", _descriptor7, _this);
      _initializerDefineProperty(_this, "title", _descriptor8, _this);
      _initializerDefineProperty(_this, "description", _descriptor9, _this);
      _initializerDefineProperty(_this, "titlePress", _descriptor10, _this);
      _initializerDefineProperty(_this, "_chartTarget", _descriptor11, _this);
      _initializerDefineProperty(_this, "_dataPoint", _descriptor12, _this);
      _initializerDefineProperty(_this, "_targetNavigationPath", _descriptor13, _this);
      _initializerDefineProperty(_this, "_microChartDataModelObjectPath", _descriptor14, _this);
      _initializerDefineProperty(_this, "_binding", _descriptor15, _this);
      _initializerDefineProperty(_this, "_sortOrder", _descriptor16, _this);
      _initializerDefineProperty(_this, "_measureDataPath", _descriptor17, _this);
      _initializerDefineProperty(_this, "isAnalytics", _descriptor18, _this);
      return _this;
    }

    /**
     * Gets the sortOrder for the microChart as mentioned in the PresentationVariant.
     * @param sortingProps Sorters from PresentationVariant.
     * @returns SortOrder
     */
    _exports = MicroChart;
    _inheritsLoose(MicroChart, _BuildingBlock);
    var _proto = MicroChart.prototype;
    _proto.getSortOrder = function getSortOrder(sortingProps) {
      return sortingProps.map(sortingProp => {
        return {
          Property: sortingProp.Property?.value,
          Descending: sortingProp.Descending,
          fullyQualifiedName: "",
          $Type: "com.sap.vocabularies.Common.v1.SortOrderType"
        };
      });
    }

    /**
     * Sets the key with the given value for MicroChart.
     * @param key The name of the property to set
     * @param value The value to set the property to
     * @param suppressInvalidate  If true, the managed object is not marked as changed
     * @returns MicroChart
     */;
    _proto.setProperty = function setProperty(key, value, suppressInvalidate) {
      if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getProperties()).includes(key)) {
        _BuildingBlock.prototype.setProperty.call(this, key, value, true);
        if (this.content) {
          this.content.destroy();
          this.content = this.createContent();
          this.createMicroChart();
        }
      } else {
        _BuildingBlock.prototype.setProperty.call(this, key, value, suppressInvalidate);
      }
      return this;
    }

    /**
     * Overrides the clone method of the UI5 control to ensure that the suite micro chart is created asynchronously on the clone.
     *
     * Clone is a UI5 core Control method, which is not async and is called in a sync manner throughout UI5.
     * Hence we need to create the chart in a fire and forget fashion.
     *
     * @param idSuffix A suffix to be appended to the cloned element id
     * @param localIds An array of local IDs within the cloned hierarchy (internally used)
     * @returns The reference to the newly create clone
     */;
    _proto.clone = function clone(idSuffix, localIds) {
      const clonedMicroChart = _BuildingBlock.prototype.clone.call(this, idSuffix, localIds);
      clonedMicroChart.createMicroChart();
      return clonedMicroChart;
    };
    _proto.onMetadataAvailable = async function onMetadataAvailable(_ownerComponent) {
      if (!this.content) {
        const owner = this._getOwner();
        this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
        const odataMetaModel = owner?.getMetaModel();
        this._microChartDataModelObjectPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
        if (this._microChartDataModelObjectPath?.targetObject?.term === "com.sap.vocabularies.UI.v1.PresentationVariant") {
          if (this._microChartDataModelObjectPath.targetObject.SortOrder?.length) {
            this._sortOrder = this.getSortOrder(this._microChartDataModelObjectPath.targetObject.SortOrder);
          }
          this._microChartDataModelObjectPath = this.getDataModelObjectForMetaPath(`${this._microChartDataModelObjectPath.targetObject.Visualizations[0].value}`, getTargetNavigationPath(this._microChartDataModelObjectPath) + "/");
        }
        if (this._microChartDataModelObjectPath) {
          if (this._microChartDataModelObjectPath.targetObject?.term === "com.sap.vocabularies.UI.v1.PresentationVariant") {
            if (this._microChartDataModelObjectPath.targetObject.SortOrder?.length != null) {
              this._sortOrder = this.getSortOrder(this._microChartDataModelObjectPath.targetObject.SortOrder);
            }
          }
          this._chartTarget = this._microChartDataModelObjectPath.targetObject;
          this._measureDataPath = enhanceDataModelPath(this._microChartDataModelObjectPath, this._chartTarget.Measures[0].value);
          if (MicroChartHelper.shouldRenderMicroChart(this._chartTarget)) {
            this._dataPoint = this._chartTarget?.MeasureAttributes[0]?.DataPoint?.$target;
            this._targetNavigationPath = odataMetaModel?.createBindingContext(getTargetNavigationPath(this._microChartDataModelObjectPath));
            this.showOnlyChart = typeof this.showOnlyChart === "string" ? this.showOnlyChart === "true" : this.showOnlyChart;
            this.content = this.createContent();
            await this.createMicroChart();
          } else {
            this.logWarning();
          }
        }
      }
    };
    _proto.createMicroChart = async function createMicroChart() {
      const chartMap = {
        "UI.ChartType/Bullet": `sap/suite/ui/microchart/BulletMicroChart`,
        "UI.ChartType/Donut": `sap/suite/ui/microchart/RadialMicroChart`,
        "UI.ChartType/Pie": `sap/suite/ui/microchart/HarveyBallMicroChart`,
        "UI.ChartType/BarStacked": `sap/suite/ui/microchart/StackedBarMicroChart`,
        "UI.ChartType/Column": `sap/suite/ui/microchart/ColumnMicroChart`,
        "UI.ChartType/Bar": `sap/suite/ui/microchart/ComparisonMicroChart`,
        "UI.ChartType/Line": `sap/suite/ui/microchart/LineMicroChart`,
        "UI.ChartType/Area": `sap/suite/ui/microchart/AreaMicroChart`
      };
      const type1 = this._chartTarget.ChartType;
      if (Object.keys(chartMap).includes(type1)) {
        const ChartComponent = (await __ui5_require_async(chartMap[type1])).default;
        const microChartAggregations = await this.getMicroChartAggregations();
        if (this.isAnalytics) {
          (this.content?.getAggregation("contentTrue")).setAggregation("microChart", _jsx(ChartComponent, {
            ...this.getMicroChartProperties(),
            children: microChartAggregations
          }));
        } else {
          this.content.setAggregation("microChart", _jsx(ChartComponent, {
            ...this.getMicroChartProperties(),
            children: microChartAggregations
          }));
        }
      }
    };
    _proto.logWarning = function logWarning() {
      const errorObject = {};
      if (this._chartTarget.ChartType === "UI.ChartType/Bullet") {
        errorObject["DataPoint_Value"] = this._dataPoint?.Value || undefined;
      }
      MicroChartHelper.logWarning(this._chartTarget.ChartType, errorObject);
    };
    _proto.getMicroChartProperties = function getMicroChartProperties() {
      let microChartProperties = {
        size: this.size,
        hideOnNoData: this.hideOnNoData
      };
      const dataPointPath = enhanceDataModelPath(this._microChartDataModelObjectPath, this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value);
      const microChartAggregations = MicroChartHelper.getAggregationForMicrochart(this._chartTarget.ChartType, this._targetNavigationPath?.getObject(), dataPointPath, this._targetNavigationPath?.getObject("@sapui.name"), undefined, this._measureDataPath, this._sortOrder, this._microChartDataModelObjectPath?.targetObject?.Dimensions?.[0]?.value, true);
      switch (this._chartTarget.ChartType) {
        case "UI.ChartType/Bullet":
          microChartProperties = MicroChartHelper.getBulletMicroChartProperties(microChartProperties, this._dataPoint);
          break;
        case "UI.ChartType/Donut":
          microChartProperties = MicroChartHelper.getRadialMicroChartProperties(microChartProperties, this._dataPoint);
          break;
        case "UI.ChartType/Pie":
          microChartProperties = MicroChartHelper.getHarveyMicroChartProperties(microChartProperties, this._dataPoint);
          break;
        case "UI.ChartType/BarStacked":
          microChartProperties.bars = microChartAggregations;
          break;
        case "UI.ChartType/Column":
          microChartProperties.columns = MicroChartHelper.getAggregationForMicrochart(this._chartTarget.ChartType, this._targetNavigationPath?.getObject(), dataPointPath, this._targetNavigationPath?.getObject("@sapui.name"), this._chartTarget?.Dimensions?.[0], this._measureDataPath, this._sortOrder, this._microChartDataModelObjectPath?.targetObject?.Dimensions?.[0]?.value, true);
          break;
        case "UI.ChartType/Bar":
          microChartProperties.maxValue = this._dataPoint.MaximumValue ? compileExpression(constant(this._dataPoint.MaximumValue?.valueOf())) : undefined;
          microChartProperties.minValue = this._dataPoint.MinimumValue ? compileExpression(constant(this._dataPoint.MinimumValue?.valueOf())) : undefined;
          microChartProperties.colorPalette = MicroChartHelper.getColorPaletteForMicroChart(this._dataPoint);
          microChartProperties.data = microChartAggregations;
          break;
        case "UI.ChartType/Line":
          microChartProperties.showThresholdLine = false;
          break;
        default:
          break;
      }
      return microChartProperties;
    };
    _proto.getMicroChartAggregations = async function getMicroChartAggregations() {
      const criticalityExpressionForMicrochart = this._dataPoint.Criticality ? buildExpressionForCriticalityColorMicroChart(this._dataPoint) : undefined;
      if (this._chartTarget.ChartType === "UI.ChartType/Bullet") {
        return MicroChartHelper.getBulletMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/BarStacked") {
        return MicroChartHelper.getStackMicroChartAggregations(this._dataPoint, this._measureDataPath, criticalityExpressionForMicrochart);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Pie") {
        return MicroChartHelper.getHarveyMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Bar") {
        return MicroChartHelper.getComparisonMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart, this._chartTarget);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Area") {
        return MicroChartHelper.getAreaMicroChartAggregations(this._chartTarget, this._microChartDataModelObjectPath, this._targetNavigationPath, this.showOnlyChart);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Column") {
        return MicroChartHelper.getColumnMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart, this.showOnlyChart);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Line") {
        if (this._microChartDataModelObjectPath && this._targetNavigationPath) {
          return MicroChartHelper.getLineMicroChartAggragations(this._microChartDataModelObjectPath, this._chartTarget, this._targetNavigationPath);
        }
      }
      return;
    };
    _proto.createMicroChartId = function createMicroChartId(chartType) {
      let chartIDPrefix;
      switch (chartType) {
        case "UI.ChartType/Bullet":
          chartIDPrefix = "BulletMicroChart";
          break;
        case "UI.ChartType/Donut":
          chartIDPrefix = "RadialMicroChart";
          break;
        case "UI.ChartType/Pie":
          chartIDPrefix = "HarveyBallMicroChart";
          break;
        case "UI.ChartType/BarStacked":
          chartIDPrefix = "StackedBarMicroChart";
          break;
        case "UI.ChartType/Area":
          chartIDPrefix = "AreaMicroChart";
          break;
        case "UI.ChartType/Column":
          chartIDPrefix = "ColumnMicroChart";
          break;
        case "UI.ChartType/Bar":
          chartIDPrefix = "ComparisonMicroChart";
          break;
        case "UI.ChartType/Line":
          chartIDPrefix = "LineMicroChart";
          break;
      }
      return this.createId(chartIDPrefix);
    };
    _proto.getMicroChartContainerProperties = function getMicroChartContainerProperties() {
      const microChartContainerProperties = {
        chartTitle: this.title || this._chartTarget.Title?.valueOf() || undefined
      };
      microChartContainerProperties.showOnlyChart = this.showOnlyChart;
      microChartContainerProperties.chartTitle = this._chartTarget.Title || undefined;
      microChartContainerProperties.chartDescription = this.description || this._chartTarget.Description?.valueOf() || undefined;
      this._binding = MicroChartHelper.getBindingExpressionForMicrochart(this._chartTarget.ChartType, this._measureDataPath, this, this._targetNavigationPath?.getObject(), this._targetNavigationPath?.getObject("@sapui.name"));
      microChartContainerProperties.uomPath = MicroChartHelper.getUOMPathForMicrochart(this.showOnlyChart, this._measureDataPath, this._chartTarget.ChartType);
      microChartContainerProperties.id = this.createMicroChartId(this._chartTarget.ChartType);
      const chartsWithVisibleProperty = ["UI.ChartType/Bullet", "UI.ChartType/Pie", "UI.ChartType/Radial"];
      if (chartsWithVisibleProperty.includes(this._chartTarget.ChartType)) {
        microChartContainerProperties.visible = compileExpression(not(ifElse(getExpressionFromAnnotation(this._chartTarget.Measures[0].$target?.annotations.UI?.Hidden), constant(true), constant(false))));
      } else {
        microChartContainerProperties.visible = undefined;
      }
      if (this._chartTarget.ChartType === "UI.ChartType/BarStacked") {
        microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMicroChart(this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Area" || this._chartTarget.ChartType === "UI.ChartType/Column") {
        microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMicroChart(this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value);
        microChartContainerProperties.measures = [this._measureDataPath?.targetObject?.name];
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Line") {
        microChartContainerProperties.measures = MicroChartHelper.getMeasurePropertyPaths(this._chartTarget, this._microChartDataModelObjectPath?.targetEntityType.annotations, "Line", true);
        microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMeasures(this._chartTarget, this._microChartDataModelObjectPath?.targetEntityType.annotations, "Line", true);
      }
      if (this._chartTarget.ChartType === "UI.ChartType/Area" || this._chartTarget.ChartType === "UI.ChartType/Column" || this._chartTarget.ChartType === "UI.ChartType/Line") {
        const dimensionDataPath = enhanceDataModelPath(this._microChartDataModelObjectPath, this._chartTarget.Dimensions[0].value);
        microChartContainerProperties.dimension = dimensionDataPath?.targetObject?.annotations?.Common?.Text ? dimensionDataPath?.targetObject?.annotations?.Common?.Text?.path : dimensionDataPath?.targetObject?.name;
        microChartContainerProperties.measurePrecision = this._dataPoint?.Value?.$target?.precision;
        microChartContainerProperties.measureScale = MicroChartHelper.getMeasureScaleForMicroChart(this._dataPoint);
        microChartContainerProperties.dimensionPrecision = dimensionDataPath?.targetObject?.precision;
        microChartContainerProperties.calendarPattern = MicroChartHelper.getCalendarPattern(dimensionDataPath?.targetObject?.type, dimensionDataPath?.targetObject?.annotations, true);
      }
      return microChartContainerProperties;
    };
    _proto.createTitle = function createTitle(titleText) {
      if (titleText) {
        // The title had this id in template time and we need to maintain the same id.
        const localLegacyTitleId = ID.generate(["fe", "MicroChartLink", this._targetNavigationPath?.getObject("@sapui.name"), this._microChartDataModelObjectPath?.targetObject?.term, this._microChartDataModelObjectPath?.targetObject?.qualifier]);
        const viewId = this.getPageController()?.getView().getId();
        const legacyTitleId = `${viewId}--${localLegacyTitleId}`;
        const titleLinkProperties = {
          id: legacyTitleId,
          text: titleText
        };
        const resourceBundle = Lib.getResourceBundleFor("sap.fe.macros");
        if (this.navigationType === "InPage") {
          const ariaTranslatedText = resourceBundle?.getText("T_COMMON_HEADERDP_TITLE_LINK_INPAGE_ARIA");
          titleLinkProperties.showAsLink = true;
          titleLinkProperties.linkAriaText = ariaTranslatedText;
        } else if (this.navigationType === "External") {
          const showLink = CommonHelper.getHeaderDataPointLinkVisibility(localLegacyTitleId, true);
          const ariaTranslatedText = resourceBundle?.getText("M_MICROCHART_TITLE_FRAGMENT_HEADER_MICROCHART_LINK_ARIA");
          titleLinkProperties.showAsLink = showLink;
          titleLinkProperties.linkAriaText = ariaTranslatedText;
        }
        return _jsx(TitleLink, {
          ...titleLinkProperties,
          linkPress: pressEvent => {
            this.fireEvent("titlePress", pressEvent);
          }
        });
      }
    }

    /**
     * The function to create microchart content.
     * @returns MicroChartContainer which will contain Title and micro chart content for each of the microchart.
     */;
    _proto.createContent = function createContent() {
      const isValidChartType = ["UI.ChartType/Bullet", "UI.ChartType/Donut", "UI.ChartType/Pie", "UI.ChartType/BarStacked", "UI.ChartType/Area", "UI.ChartType/Column", "UI.ChartType/Bar", "UI.ChartType/Line"].includes(this._chartTarget.ChartType);
      if (!isValidChartType) {
        return _jsx(Text, {
          text: "This chart type is not supported. Other Types yet to be implemented.."
        });
      } else if (this.isAnalytics) {
        return _jsx(ConditionalWrapper, {
          condition: compileExpression(or(not(pathInModel("@$ui5.node.isExpanded")), equal(pathInModel("@$ui5.node.level"), 0))),
          visible: getExpressionForMeasureUnit(this._dataPoint.Value.$target),
          children: {
            contentTrue: this.createChartContent(),
            contentFalse: _jsx(Text, {
              text: "*"
            })
          }
        });
      } else {
        return this.createChartContent();
      }
    };
    _proto.createChartContent = function createChartContent() {
      const microChartContainerProperties = {
        ...this.getMicroChartContainerProperties(),
        binding: this._binding
      };
      return _jsx(MicroChartContainer, {
        ...microChartContainerProperties,
        children: {
          microChartTitle: !this.showOnlyChart ? this.createTitle(microChartContainerProperties.chartTitle) : undefined
        }
      });
    };
    return MicroChart;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "showOnlyChart", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "navigationType", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return NavigationType.None;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "batchGroupId", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "size", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "hideOnNoData", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "description", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "titlePress", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_chartTarget", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_dataPoint", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_targetNavigationPath", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_microChartDataModelObjectPath", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_binding", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "_sortOrder", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_measureDataPath", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "isAnalytics", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = MicroChart;
  return _exports;
}, false);
//# sourceMappingURL=MicroChart-dbg.js.map

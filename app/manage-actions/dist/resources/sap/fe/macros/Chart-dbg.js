/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/chart/Action", "sap/fe/macros/chart/ChartRuntime", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/fe/navigation/PresentationVariant", "sap/ui/core/library", "sap/ui/mdc/p13n/StateUtil", "sap/ui/model/Filter", "./MacroAPI", "./chart/MdcChartTemplate", "./chart/adapter/ChartPvToStateUtils", "./insights/AnalyticalInsightsHelper", "./insights/CommonInsightsHelper", "./insights/InsightsService", "./mdc/adapter/StateHelper"], function (Log, merge, ClassSupport, HookSupport, MetaModelConverter, StableIdHelper, Action, ChartRuntime, ChartUtils, FilterUtils, PresentationVariant, library, StateUtil, Filter, MacroAPI, MdcChartTemplate, PresentationVariantToStateUtilsPV, AnalyticalInsightsHelper, CommonInsightsHelper, InsightsService, StateHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22;
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
  var showInsightsCardPreview = InsightsService.showInsightsCardPreview;
  var showCollaborationManagerCardPreview = InsightsService.showCollaborationManagerCardPreview;
  var getCardManifest = InsightsService.getCardManifest;
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  var hasInsightActionEnabled = CommonInsightsHelper.hasInsightActionEnabled;
  var createChartCardParams = AnalyticalInsightsHelper.createChartCardParams;
  var getMdcChartTemplate = MdcChartTemplate.getMdcChartTemplate;
  var TitleLevel = library.TitleLevel;
  var generate = StableIdHelper.generate;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a chart based on the metadata provided by OData V4.
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/chart/chartDefault Overview of Building Blocks}
   * <br>
   * Usually, a contextPath and metaPath is expected.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:Chart id="MyChart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
   * </pre>
   * @alias sap.fe.macros.Chart
   * @ignoreInterface sap.fe.macros.controls.section.ISingleSectionContributor
   * @ui5-metamodel
   * @public
   */
  let Chart = (_dec = defineUI5Class("sap.fe.macros.Chart", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec2 = implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor"), _dec3 = implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor"), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string",
    required: true,
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.Chart", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"]
  }), _dec6 = property({
    type: "string",
    required: true,
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: []
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean",
    defaultValue: true
  }), _dec9 = property({
    type: "string",
    defaultValue: "Multiple",
    allowedValues: ["None", "Single", "Multiple"]
  }), _dec10 = property({
    type: "string",
    allowedValues: ["Control"]
  }), _dec11 = property({
    type: "string",
    defaultValue: true
  }), _dec12 = property({
    type: "string"
  }), _dec13 = property({
    type: "object"
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = property({
    type: "string"
  }), _dec16 = association({
    type: "sap.ui.core.Control"
  }), _dec17 = aggregation({
    type: "sap.ui.core.LayoutData"
  }), _dec18 = aggregation({
    type: "sap.fe.macros.chart.Action",
    altTypes: ["sap.fe.macros.chart.ActionGroup"],
    multiple: true,
    defaultClass: Action
  }), _dec19 = event(), _dec20 = event(), _dec21 = event(), _dec22 = event(), _dec23 = event(), _dec24 = xmlEventHandler(), _dec25 = xmlEventHandler(), _dec26 = controllerExtensionHandler("collaborationManager", "collectAvailableCards"), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function Chart(settings, others) {
      var _this;
      if (settings?._applyIdToContent) {
        settings.id = generate([settings.id, "::Chart"]);
      }
      _this = _MacroAPI.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", _descriptor2, _this);
      /**
       * ID of the chart
       */
      _initializerDefineProperty(_this, "id", _descriptor3, _this);
      /**
       * Metadata path to the presentation context (UI.Chart with or without a qualifier)
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      /**
       * Metadata path to the entitySet or navigationProperty
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _this);
      /**
       * Specifies the header text that is shown in the chart
       * @public
       */
      _initializerDefineProperty(_this, "header", _descriptor6, _this);
      /**
       * Controls if the header text should be shown or not
       * @public
       */
      _initializerDefineProperty(_this, "headerVisible", _descriptor7, _this);
      /**
       * Defines the selection mode to be used by the chart.
       *
       * Allowed values are `None`, `Single` or `Multiple`
       * @public
       */
      _initializerDefineProperty(_this, "selectionMode", _descriptor8, _this);
      /**
       * Controls the kind of variant management that should be enabled for the chart.
       *
       * Allowed value is `Control`.<br/>
       * If set with value `Control`, a variant management control is seen within the chart and the chart is linked to this.<br/>
       * If not set with any value, variant management control is not available for this chart.
       * @public
       */
      _initializerDefineProperty(_this, "variantManagement", _descriptor9, _this);
      /**
       * Controls which options should be enabled for the chart personalization dialog.
       *
       * If it is set to `true`, all possible options for this kind of chart are enabled.<br/>
       * If it is set to `false`, personalization is disabled.<br/>
       * <br/>
       * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
       * Available options are:<br/>
       * - Sort<br/>
       * - Type<br/>
       * - Item<br/>
       * - Filter<br/>
       * @public
       */
      _initializerDefineProperty(_this, "personalization", _descriptor10, _this);
      /**
       * Header level of chart
       * @private
       */
      _initializerDefineProperty(_this, "headerLevel", _descriptor11, _this);
      /**
       * Chart delegate
       * @private
       */
      _initializerDefineProperty(_this, "chartDelegate", _descriptor12, _this);
      /**
       * Used internally for LR and OP
       * @private
       */
      _initializerDefineProperty(_this, "_applyIdToContent", _descriptor13, _this);
      /**
       * No data text
       * @private
       */
      _initializerDefineProperty(_this, "noDataText", _descriptor14, _this);
      /**
       * Parameter with drillstack on a drill up/ drill down of the MDC_Chart
       * @private
       */
      _this.prevDrillStack = [];
      _this.initialControlState = {};
      _this.chartActions = [];
      _this._commandActions = [];
      /**
       * Id of the FilterBar building block associated with the chart.
       * @public
       */
      _initializerDefineProperty(_this, "filterBar", _descriptor15, _this);
      _initializerDefineProperty(_this, "layoutData", _descriptor16, _this);
      /**
       * Aggregate actions of the chart.
       * @public
       */
      _initializerDefineProperty(_this, "actions", _descriptor17, _this);
      /**
       * An event triggered when chart selections are changed. The event contains information about the data selected/deselected and the Boolean flag that indicates whether data is selected or deselected.
       * @public
       */
      _initializerDefineProperty(_this, "selectionChange", _descriptor18, _this);
      /**
       * An event triggered when the chart requests data.
       * @private
       */
      _initializerDefineProperty(_this, "internalDataRequested", _descriptor19, _this);
      /**
       * Event triggered when chart's variant is selected.
       * @private
       */
      _initializerDefineProperty(_this, "variantSelected", _descriptor20, _this);
      /**
       * Event triggered when chart's variant is saved.
       * @private
       */
      _initializerDefineProperty(_this, "variantSaved", _descriptor21, _this);
      /**
       * Event triggered when chart's segmented button i.e., mode between table, chart and chart with table view is selected
       * @private
       */
      _initializerDefineProperty(_this, "segmentedButtonPressed", _descriptor22, _this);
      return _this;
    }

    /**
     * Function is overridden to ensure backward incompatibility
     * @override
     */
    _exports = Chart;
    _inheritsLoose(Chart, _MacroAPI);
    var _proto = Chart.prototype;
    _proto.getSectionContentRole = function getSectionContentRole() {
      return "consumer";
    }

    /**
     * Implementation of the sendDataToConsumer method which is a part of the ISingleSectionContributor
     *
     * Will be called from the sap.fe.macros.controls.Section control when there is a Chart building block rendered within a section
     * along with the consumerData i.e. section's data such as title and title level which is then applied to the chart using the implementation below accordingly.
     *
     */;
    _proto.sendDataToConsumer = function sendDataToConsumer(consumerData) {
      this.content?.setHeader(consumerData.title);
      this.content?.setHeaderStyle("H4");
      this.content?.setHeaderLevel(consumerData.titleLevel);
    };
    /**
     * Gets contexts from the chart that have been selected by the user.
     * @returns Contexts of the rows selected by the user
     * @public
     */
    _proto.getSelectedContexts = function getSelectedContexts() {
      return this.content?.getBindingContext("internal")?.getProperty("selectedContexts") || [];
    };
    _proto.isA = function isA(typeName) {
      const oldValidType = "sap.fe.macros.chart.ChartAPI";
      if (Array.isArray(typeName) && typeName.includes(oldValidType) || typeName === oldValidType) return true;
      return _MacroAPI.prototype.isA.call(this, typeName);
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.content = this.createContent();
      }
    };
    _proto.onAfterRendering = function onAfterRendering(afterRenderingEvent) {
      const view = this.getPageController()?.getView();
      const internalModelContext = view?.getBindingContext("internal");
      const chart = this.getContent();
      const showMessageStrip = internalModelContext?.getProperty("controls/showMessageStrip") || {};
      const sChartEntityPath = chart.data("entitySet"),
        sCacheKey = `${sChartEntityPath}Chart`,
        oBindingContext = view?.getBindingContext();
      showMessageStrip[sCacheKey] = chart.data("draftSupported") === "true" && !!oBindingContext && !oBindingContext.getObject("IsActiveEntity");
      internalModelContext.setProperty("controls/showMessageStrip", showMessageStrip);
      this.attachStateChangeHandler();
      _MacroAPI.prototype.onAfterRendering.call(this, afterRenderingEvent);
    };
    _proto.attachStateChangeHandler = function attachStateChangeHandler() {
      StateUtil.detachStateChange(this.stateChangeHandler);
      StateUtil.attachStateChange(this.stateChangeHandler);
    };
    _proto.stateChangeHandler = function stateChangeHandler(oEvent) {
      const control = oEvent.getParameter("control");
      if (control.isA("sap.ui.mdc.Chart")) {
        const chartBlock = control.getParent();
        if (chartBlock?.handleStateChange) {
          chartBlock.handleStateChange();
        }
      }
    };
    _proto.refreshNotApplicableFields = function refreshNotApplicableFields(oFilterControl) {
      const oChart = this.getContent();
      return FilterUtils.getNotApplicableFilters(oFilterControl, oChart);
    };
    _proto.handleSelectionChange = function handleSelectionChange(oEvent) {
      const aData = oEvent.getParameter("data");
      const bSelected = oEvent.getParameter("name") === "selectData";
      ChartRuntime.fnUpdateChart(oEvent);
      this.fireEvent("selectionChange", merge({}, {
        data: aData,
        selected: bSelected
      }));
    };
    _proto.onInternalDataRequested = function onInternalDataRequested() {
      this.fireEvent("internalDataRequested");
    };
    _proto.collectAvailableCards = async function collectAvailableCards(cards) {
      const actionToolbarItems = this.content.getActions();
      if (hasInsightActionEnabled(actionToolbarItems, this.content.getFilter())) {
        const card = await this.getCardManifestChart();
        if (Object.keys(card).length > 0) {
          cards.push({
            card: card,
            title: this.getChartControl().getHeader(),
            callback: this.onAddCardToCollaborationManagerCallback.bind(this)
          });
        }
      }
    };
    _proto.hasSelections = function hasSelections() {
      // consider chart selections in the current drill stack or on any further drill downs
      const mdcChart = this.content;
      if (mdcChart) {
        try {
          const chart = mdcChart.getControlDelegate()?.getInnerChart(mdcChart);
          if (chart) {
            const aDimensions = ChartUtils.getDimensionsFromDrillStack(chart);
            const bIsDrillDown = aDimensions.length > this.prevDrillStack.length;
            const bIsDrillUp = aDimensions.length < this.prevDrillStack.length;
            const bNoChange = aDimensions.toString() === this.prevDrillStack.toString();
            let aFilters;
            if (bIsDrillUp && aDimensions.length === 1) {
              // drilling up to level0 would clear all selections
              aFilters = ChartUtils.getChartSelections(mdcChart, true);
            } else {
              // apply filters of selections of previous drillstack when drilling up/down
              // to the chart and table
              aFilters = ChartUtils.getChartSelections(mdcChart);
            }
            if (bIsDrillDown || bIsDrillUp) {
              // update the drillstack on a drill up/ drill down
              this.prevDrillStack = aDimensions;
              return aFilters.length > 0;
            } else if (bNoChange) {
              // bNoChange is true when chart is selected
              return aFilters.length > 0;
            }
          }
        } catch (err) {
          Log.error(`Error while checking for selections in Chart: ${err}`);
        }
      }
      return false;
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for charts.
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToInsightsPressed = async function onAddCardToInsightsPressed() {
      try {
        const insightsParams = await createChartCardParams(this);
        if (insightsParams) {
          showInsightsCardPreview(insightsParams);
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    }

    /**
     * Gets the card manifest optimized for the chart case.
     * @returns Promise of CardManifest
     */;
    _proto.getCardManifestChart = async function getCardManifestChart() {
      const insightsParams = await createChartCardParams(this);
      return getCardManifest(insightsParams);
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     * @param card The card manifest to be used for the callback
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToCollaborationManagerCallback = async function onAddCardToCollaborationManagerCallback(card) {
      try {
        if (card) {
          await showCollaborationManagerCardPreview(card, this.getPageController()?.collaborationManager.getService());
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    }

    /**
     * Gets the filters related to the chart.
     * @returns  The filter configured on the chart or undefined if none
     */;
    _proto.getFilter = function getFilter() {
      const chartFilterInfo = ChartUtils.getAllFilterInfo(this.content);
      if (chartFilterInfo.filters.length) {
        chartFilterInfo.filters.forEach(filter => {
          if (filter.getPath()) {
            filter.sPath = this.getChartPropertiesWithoutPrefixes(filter.getPath());
          }
        });
        return new Filter({
          filters: chartFilterInfo.filters,
          and: true
        });
      }
      return undefined;
    }

    /**
     * Gets the chart control from the Chart API.
     * @returns The Chart control inside the Chart API
     */;
    _proto.getChartControl = function getChartControl() {
      return this.content;
    }

    /**
     * Gets the datamodel object path for the dimension.
     * @param propertyName  Name of the dimension
     * @returns The datamodel object path for the dimension
     */;
    _proto.getPropertyDataModel = function getPropertyDataModel(propertyName) {
      const metaPath = this.content.data("targetCollectionPath");
      const metaModel = this.content.getModel().getMetaModel();
      const dimensionContext = metaModel.createBindingContext(`${metaPath}/${propertyName}`);
      return getInvolvedDataModelObjects(dimensionContext);
    }

    /**
     * This function returns an array of chart properties by removing _fe_groupable and _fe_aggregatable prefix.
     * @param {Array} aProperties Chart filter properties
     * @returns Chart properties without prefixes
     */;
    _proto.getChartPropertiesWithoutPrefixes = function getChartPropertiesWithoutPrefixes(chartProperty) {
      if (chartProperty && chartProperty.includes("fe_groupable")) {
        chartProperty = this.getInternalChartNameFromPropertyNameAndKind(chartProperty, "groupable");
      } else if (chartProperty && chartProperty.includes("fe_aggregatable")) {
        chartProperty = this.getInternalChartNameFromPropertyNameAndKind(chartProperty, "aggregatable");
      }
      return chartProperty;
    }

    /**
     * This function returns an ID which should be used in the internal chart for the measure or dimension.
     * @param name ID of the property
     * @param kind Type of the property (measure or dimension)
     * @returns Internal ID for the sap.chart.Chart
     */;
    _proto.getInternalChartNameFromPropertyNameAndKind = function getInternalChartNameFromPropertyNameAndKind(name, kind) {
      return name.replace("_fe_" + kind + "_", "");
    }

    /**
     * This function converts the chart's stateUtil  to Chart Presentation Variant.
     * @param chartState Chart AppState util PV
     * @returns Presentation Variant structure for the chart
     */;
    _proto._convertStateUtilToPresentationVariant = function _convertStateUtilToPresentationVariant(chartState) {
      const sortOrder = chartState.sorters?.map(sorter => {
        return {
          Property: this.getChartPropertiesWithoutPrefixes(sorter.name),
          Descending: sorter.descending
        };
      });
      const type = chartState.supplementaryConfig?.properties?.chartType;
      const chartTypeInRequiredFormat = type ? type.charAt(0).toUpperCase() + type.slice(1) : undefined;
      const chartType = "com.sap.vocabularies.UI.v1.ChartType/" + chartTypeInRequiredFormat;
      const dimensions = [],
        measures = [],
        dimensionAttributes = [],
        measureAttributes = [];
      (chartState.items ?? []).forEach(item => {
        item.name = this.getChartPropertiesWithoutPrefixes(item.name);
        const role = item.role?.length ? item.role.substring(0, 1).toUpperCase() + item.role?.substring(1, item.role.length) : undefined;
        if (item.role === "category" || item.role === "series" || item.role === "category2") {
          dimensions.push(item.name);
          dimensionAttributes.push({
            Dimension: item.name,
            Role: `com.sap.vocabularies.UI.v1.ChartDimensionRoleType/${role}`
          });
        } else {
          measures.push(item.name);
          measureAttributes.push({
            Measure: item.name,
            Role: "com.sap.vocabularies.UI.v1.ChartDimensionRoleType/" + role
          });
        }
      });
      const chartViz = {
        Content: {
          ChartType: chartType,
          DimensionAttributes: dimensionAttributes,
          Dimensions: dimensions,
          MeasureAttributes: measureAttributes,
          Measures: measures
        },
        Type: "Chart"
      };
      const chartPV = new PresentationVariant();
      chartPV.setChartVisualization(chartViz);
      chartPV.setProperties({
        SortOrder: sortOrder ?? []
      });
      return chartPV;
    }

    /**
     * Get the presentation variant that is currently applied on the chart.
     * @returns The presentation variant {@link sap.fe.navigation.PresentationVariant} applied to the chart
     * @public
     */;
    _proto.getPresentationVariant = async function getPresentationVariant() {
      try {
        const chartState = await StateUtil.retrieveExternalState(this.content);
        return this._convertStateUtilToPresentationVariant(chartState);
      } catch (error) {
        const id = this.getId();
        const message = error instanceof Error ? error.message : String(error);
        Log.error(`Chart Building Block (${id}) - get presentation variant failed : ${message}`);
        throw Error(message);
      }
    }

    /**
     * Set the presentation variant for the mdc chart.
     *
     * The json format retrieved by using the get PresentationVariant button in the linked FPM sample should be followed while trying to set the PresentationVariant as needed.
     * The values dimensions, measures and other properties should also be given in the valid format and null or empty values should be avoided.
     * One dimension attribute should have only one role associated with it on a given chart.
     * @param presentationVariant the presentation variant {@link sap.fe.navigation.PresentationVariant} to be set
     * @public
     */;
    _proto.setPresentationVariant = async function setPresentationVariant(presentationVariant) {
      try {
        const chart = this.content;
        const existingPresentationVariant = await this.getPresentationVariant();
        const propertiesInfo = await chart.getControlDelegate()?.fetchProperties(chart);
        const stateUtilPv = PresentationVariantToStateUtilsPV.convertPvToStateUtilPv(presentationVariant, existingPresentationVariant, propertiesInfo);
        await StateUtil.applyExternalState(chart, stateUtilPv);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE: Chart Building Block setPresentationVariant API failed with error: ${message}`);
        throw Error(message);
      }
    }

    /**
     * Gets the key of the current variant in the associated variant management.
     * @returns Variant key of {@link sap.ui.fl.variants.VariantManagement} applied to the chart
     * @public
     */;
    _proto.getCurrentVariantKey = function getCurrentVariantKey() {
      return this.content.getVariant().getCurrentVariantKey();
    }

    /**
     * Sets the variant of the provided key in the associated variant management.
     * @param key The variant key of {@link sap.ui.fl.variants.VariantManagement} to be set
     * @public
     */;
    _proto.setCurrentVariantKey = function setCurrentVariantKey(key) {
      const variantManagement = this.content.getVariant();
      variantManagement.setCurrentVariantKey(key);
    }

    /**
     * Get the selection variant from the chart. This function considers only the selection variant applied at the control level.
     * @returns A promise that resolves with {@link sap.fe.navigation.SelectionVariant}.
     * @public
     */;
    _proto.getSelectionVariant = async function getSelectionVariant() {
      return StateHelper.getSelectionVariant(this.content);
    }

    /**
     * Sets {@link sap.fe.navigation.SelectionVariant} to the chart. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
     * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the chart
     * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the SelectionVariant) to display the filter value descriptions, instead of loading them from the backend
     * @returns A promise for asynchronous handling
     * @public
     */;
    _proto.setSelectionVariant = async function setSelectionVariant(selectionVariant) {
      let prefillDescriptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      return StateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
    }

    /**
     * Retrieves the control state based on the given control state key.
     * @param controlState The current state of the control.
     * @returns - The full state of the control along with the initial state if available.
     */;
    _proto.getControlState = function getControlState(controlState) {
      const initialControlState = this.initialControlState;
      if (controlState) {
        return {
          fullState: controlState,
          initialState: initialControlState
        };
      }
      return controlState;
    }

    /**
     * Sets the initial state of the control by retrieving the external state.
     * @returns A promise that resolves when the initial state is set.
     */;
    _proto.setInitialState = async function setInitialState() {
      try {
        const initialControlState = await StateUtil.retrieveExternalState(this.content);
        this.initialControlState = initialControlState;
      } catch (e) {
        Log.error(e);
      }
    }

    /**
     * Asynchronously retrieves the state of the chart based on the provided viewstate.
     * @returns A promise that resolves to the chart state or null if not found.
     */;
    _proto.retrieveState = async function retrieveState() {
      const chartState = {};
      chartState.innerChart = this.getControlState(await StateUtil.retrieveExternalState(this.content));
      const variantToRetrieve = this.content.getVariant()?.getId();
      if (variantToRetrieve) {
        const variantManagementControl = this.content.getVariant();
        if (!chartState.variantManagement) {
          chartState.variantManagement = {
            variantId: variantManagementControl?.getCurrentVariantKey()
          };
        } else {
          chartState.variantManagement.variantId = variantManagementControl?.getCurrentVariantKey();
        }
      }
      return chartState;
    }

    /**
     * Applies the legacy state to the chart based on the provided control state retrieval function.
     * @param getControlState Function to retrieve the control state.
     * @param [_navParameters] Optional navigation parameters.
     * @param [shouldApplyDiffState] Flag indicating whether to apply the diff state.
     * @returns - A promise that resolves when the state has been applied.
     */;
    _proto.applyLegacyState = async function applyLegacyState(getControlState, _navParameters, shouldApplyDiffState) {
      const chart = this.content;
      const vm = chart.getVariant();
      const chartState = getControlState(chart);
      const vmState = vm ? getControlState(vm) : null;
      const controlState = {};
      if (chartState) {
        controlState.innerChart = {
          ...controlState.innerChart,
          ...chartState,
          fullState: {
            ...controlState.innerChart?.fullState,
            ...chartState.fullState
          },
          initialState: {
            ...controlState.innerChart?.initialState,
            ...chartState.initialState
          }
        };
      }
      if (vmState?.variantId) {
        controlState.variantManagement = {
          ...controlState.variantManagement,
          variantId: vmState.variantId.toString()
        };
      }
      if (controlState && Object.keys(controlState).length > 0) {
        await this.applyState(controlState, _navParameters, shouldApplyDiffState);
      }
    }

    /**
     * Asynchronously applies the provided control state to the viewstate.
     * @param controlState The state to be applied to the control.
     * @param [_navParameters] Optional navigation parameters.
     * @param [shouldApplyDiffState] Optional flag to skip merging states.
     * @returns A promise that resolves when the state has been applied.
     */;
    _proto.applyState = async function applyState(controlState, _navParameters, shouldApplyDiffState) {
      if (!controlState) return;
      const variantId = controlState.variantManagement?.variantId;
      const currentVariant = this.content?.getVariant();

      // Handle Variant Management
      if (variantId !== undefined && variantId !== currentVariant.getCurrentVariantKey()) {
        const ovM = this.content?.getVariant();
        const aVariants = ovM?.getVariants();
        const sVariantReference = aVariants?.some(oVariant => oVariant.getKey() === variantId) ? variantId : ovM?.getStandardVariantKey;
        try {
          const ControlVariantApplyAPI = (await __ui5_require_async("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
          await ControlVariantApplyAPI.activateVariant({
            element: ovM,
            variantReference: sVariantReference
          });
          await this.setInitialState();
        } catch (error) {
          Log.error(error);
          await this.setInitialState();
        }
      } else {
        // we need to update initial state even if above condition not satisfied
        await this.setInitialState();
      }

      // Handle Inner Chart State
      const innerChartState = controlState.innerChart;
      let finalState;
      if (innerChartState) {
        if (shouldApplyDiffState && innerChartState.initialState) {
          finalState = await StateUtil.diffState(this.content, innerChartState.initialState, innerChartState.fullState);
        } else {
          finalState = innerChartState.fullState;
        }
        await StateUtil.applyExternalState(this.content, finalState);
      }
    }

    /**
     * Called by the MDC state util when the state for this control's child has changed.
     */;
    _proto.handleStateChange = function handleStateChange() {
      this.getPageController()?.getExtensionAPI().updateAppState();
    };
    _proto._createContent = function _createContent() {
      const owner = this._getOwner();
      if (owner?.isA("sap.fe.core.TemplateComponent")) {
        // We need to remove the current filter from the old (to be destroyed) Chart instance because if we don't then for some strange reason, the old Chart instance used to
        // react for filter bar action, for example, on Click of Go.
        this.content.setFilter("");
        this.content.destroy();
        this.content = this.createContent();
      }
    };
    _proto.setProperty = function setProperty(key, value, suppressInvalidate) {
      if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getProperties()).includes(key)) {
        _MacroAPI.prototype.setProperty.call(this, key, value, true);
        this._createContent();
      } else {
        _MacroAPI.prototype.setProperty.call(this, key, value, suppressInvalidate);
      }
      return this;
    };
    _proto.removeAggregation = function removeAggregation(name, value, suppressInvalidate) {
      let removed;
      if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
        removed = _MacroAPI.prototype.removeAggregation.call(this, name, value, suppressInvalidate);
        this._createContent();
      } else {
        removed = _MacroAPI.prototype.removeAggregation.call(this, name, value, suppressInvalidate);
      }
      return removed;
    };
    _proto.addAggregation = function addAggregation(name, value, suppressInvalidate) {
      if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
        _MacroAPI.prototype.addAggregation.call(this, name, value, suppressInvalidate);
        this._createContent();
      } else {
        _MacroAPI.prototype.addAggregation.call(this, name, value, suppressInvalidate);
      }
      return this;
    };
    _proto.insertAggregation = function insertAggregation(name, value, index, suppressInvalidate) {
      if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
        _MacroAPI.prototype.insertAggregation.call(this, name, value, index, suppressInvalidate);
        this._createContent();
      } else {
        _MacroAPI.prototype.insertAggregation.call(this, name, value, index, suppressInvalidate);
      }
      return this;
    };
    _proto.createContent = function createContent() {
      if (this.contextPath) {
        this._resolvedContextPath = this.contextPath.endsWith("/") ? this.contextPath : this.contextPath + "/";
      }
      return getMdcChartTemplate(this, this._getOwner()?.getRootController()?.getView().getViewData() ?? this._getOwner()?.getViewData(), this.getAppComponent()?.getDiagnostics() ?? {}, this.getDataModelObjectForMetaPath(this.metaPath, this._resolvedContextPath));
    };
    return Chart;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "chartDelegate", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_applyIdToContent", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "noDataText", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "layoutData", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "internalDataRequested", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "variantSelected", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "variantSaved", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "segmentedButtonPressed", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "handleSelectionChange", [_dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "handleSelectionChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataRequested", [_dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataRequested"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectAvailableCards", [_dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "collectAvailableCards"), _class2.prototype), _class2)) || _class);
  _exports = Chart;
  return _exports;
}, false);
//# sourceMappingURL=Chart-dbg.js.map

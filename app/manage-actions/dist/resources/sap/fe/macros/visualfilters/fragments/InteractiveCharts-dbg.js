/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/suite/ui/microchart/InteractiveBarChart", "sap/suite/ui/microchart/InteractiveBarChartBar", "sap/suite/ui/microchart/InteractiveLineChart", "sap/suite/ui/microchart/InteractiveLineChartPoint", "sap/ui/core/CustomData", "../InteractiveChartHelper", "../VisualFilterRuntime", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (StableIdHelper, TypeGuards, InteractiveBarChart, InteractiveBarChartBar, InteractiveLineChart, InteractiveLineChartPoint, CustomData, InteractiveChartHelper, VisualFilterRuntime, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  function getVisualFilterChart(visualFilter) {
    if (visualFilter.showError) {
      return getInteractiveChartWithError(visualFilter);
    } else if (visualFilter.chartType) {
      return getInteractiveChart(visualFilter);
    } else {
      return "";
    }
  }
  _exports.getVisualFilterChart = getVisualFilterChart;
  function getInteractiveChartWithError(visualFilter) {
    const chartAnnotation = visualFilter.chartAnnotation;
    if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
      return _jsx(InteractiveLineChart, {
        showError: visualFilter.showError,
        errorMessageTitle: visualFilter.errorMessageTitle,
        errorMessage: visualFilter.errorMessage
      });
    }
    return "";
  }
  _exports.getInteractiveChartWithError = getInteractiveChartWithError;
  function getInteractiveChart(visualFilter) {
    const interactiveChartProperties = InteractiveChartHelper.getInteractiveChartProperties(visualFilter);
    if (visualFilter.chartType === "UI.ChartType/Bar") {
      return _jsxs(InteractiveBarChart, {
        selectionChanged: event => {
          VisualFilterRuntime.selectionChanged(event);
        },
        ...getChartProperties(interactiveChartProperties, visualFilter),
        children: [getBarChartAggregations(interactiveChartProperties), {
          customData: getCustomData(visualFilter, interactiveChartProperties)
        }]
      });
    } else if (visualFilter.chartType === "UI.ChartType/Line") {
      return _jsxs(InteractiveLineChart, {
        selectionChanged: event => {
          VisualFilterRuntime.selectionChanged(event);
        },
        ...getChartProperties(interactiveChartProperties, visualFilter),
        children: [getLineChartAggregations(interactiveChartProperties), {
          customData: getCustomData(visualFilter, interactiveChartProperties)
        }]
      });
    }
    return "";
  }
  _exports.getInteractiveChart = getInteractiveChart;
  function getChartProperties(interactiveChartProperties, visualFilter) {
    const visualFilterChartProperties = {
      visible: interactiveChartProperties.showErrorExpression,
      showError: interactiveChartProperties.showErrorExpression,
      errorMessageTitle: interactiveChartProperties.errorMessageTitleExpression,
      errorMessage: interactiveChartProperties.errorMessageExpression
    };
    if (visualFilter.chartType === "UI.ChartType/Bar") {
      visualFilterChartProperties.bars = interactiveChartProperties.aggregationBinding;
    } else if (visualFilter.chartType === "UI.ChartType/Line") {
      visualFilterChartProperties.points = interactiveChartProperties.aggregationBinding;
    }
    return visualFilterChartProperties;
  }
  function getBarChartAggregations(interactiveChartProperties) {
    const barChartAggregations = {};
    barChartAggregations.bars = _jsx(InteractiveBarChartBar, {
      label: interactiveChartProperties.chartLabel,
      value: interactiveChartProperties.measure,
      displayedValue: interactiveChartProperties.displayedValue,
      color: interactiveChartProperties.color,
      selected: "{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
    });
    return barChartAggregations;
  }
  function getLineChartAggregations(interactiveChartProperties) {
    const lineChartAggregations = {};
    lineChartAggregations.points = _jsx(InteractiveLineChartPoint, {
      label: interactiveChartProperties.chartLabel,
      value: interactiveChartProperties.measure,
      displayedValue: interactiveChartProperties.displayedValue,
      color: interactiveChartProperties.color,
      selected: "{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
    });
    return lineChartAggregations;
  }
  function getCustomData(visualFilter, interactiveChartProperties) {
    const id = generate([visualFilter.metaPath]);
    const dimension = visualFilter.chartAnnotation?.Dimensions[0];
    return [_jsx(CustomData, {
      value: visualFilter.outParameter
    }, "outParameter"), _jsx(CustomData, {
      value: visualFilter.valuelistProperty
    }, "valuelistProperty"), _jsx(CustomData, {
      value: visualFilter.multipleSelectionAllowed
    }, "multipleSelectionAllowed"), _jsx(CustomData, {
      value: dimension?.$target?.name
    }, "dimension"), _jsx(CustomData, {
      value: isPathAnnotationExpression(dimension?.$target?.annotations.Common?.Text) ? dimension?.$target?.annotations.Common?.Text.path : undefined
    }, "dimensionText"), _jsx(CustomData, {
      value: interactiveChartProperties.scalefactor
    }, "scalefactor"), _jsx(CustomData, {
      value: visualFilter.chartMeasure
    }, "measure"), _jsx(CustomData, {
      value: interactiveChartProperties.uom
    }, "uom"), _jsx(CustomData, {
      value: interactiveChartProperties.inParameters
    }, "inParameters"), _jsx(CustomData, {
      value: interactiveChartProperties.inParameterFilters
    }, "inParameterFilters"), _jsx(CustomData, {
      value: dimension?.$target?.type
    }, "dimensionType"), _jsx(CustomData, {
      value: interactiveChartProperties.selectionVariant
    }, "selectionVariantAnnotation"), _jsx(CustomData, {
      value: visualFilter.required
    }, "required"), _jsx(CustomData, {
      value: visualFilter.showOverlayInitially
    }, "showOverlayInitially"), _jsx(CustomData, {
      value: visualFilter.requiredProperties
    }, "requiredProperties"), _jsx(CustomData, {
      value: id
    }, "infoPath"), _jsx(CustomData, {
      value: interactiveChartProperties.stringifiedParameters
    }, "parameters"), _jsx(CustomData, {
      value: visualFilter.draftSupported
    }, "draftSupported")];
  }
  return _exports;
}, false);
//# sourceMappingURL=InteractiveCharts-dbg.js.map

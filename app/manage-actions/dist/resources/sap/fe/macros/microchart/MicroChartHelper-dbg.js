/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/CommonHelper", "sap/m/library", "sap/ui/core/format/NumberFormat", "../field/FieldTemplating", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/base/jsx-runtime/jsx"], function (Log, BindingToolkit, DataModelPathHelper, CommonHelper, library, NumberFormat, FieldTemplating, MetaModelConverter, valueFormatters, CriticalityFormatters, _jsx) {
  "use strict";

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
  var buildExpressionForCriticalityColorMicroChart = CriticalityFormatters.buildExpressionForCriticalityColorMicroChart;
  var getValueBinding = FieldTemplating.getValueBinding;
  var ValueColor = library.ValueColor;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  /**
   * Helper class used by MDC_Controls to handle SAP Fiori elements for OData V4
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const MicroChartHelper = {
    /**
     * This function returns the Threshold Color for bullet micro chart.
     * @param value Threshold value provided in the annotations
     * @param iContext InterfaceContext with path to the threshold
     * @returns The indicator for Threshold Color
     */
    getThresholdColor: function (value, iContext) {
      const path = iContext.context.getPath();
      if (path.includes("DeviationRange")) {
        return ValueColor.Error;
      } else if (path.includes("ToleranceRange")) {
        return ValueColor.Critical;
      }
      return ValueColor.Neutral;
    },
    /**
     * To fetch measures from DataPoints.
     * @param chartAnnotations Chart Annotations
     * @param entityTypeAnnotations EntityType Annotations
     * @param chartType Chart Type used
     * @returns Containing all measures.
     * @private
     */
    getMeasurePropertyPaths: function (chartAnnotations, entityTypeAnnotations, chartType, isRunTimeInstance) {
      const propertyPath = [];
      if (!entityTypeAnnotations) {
        Log.warning("FE:Macro:MicroChart : Couldn't find annotations for the DataPoint.");
        return undefined;
      }
      for (const measureIndex in chartAnnotations.Measures) {
        const iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(measureIndex, chartAnnotations, isRunTimeInstance),
          measureAttribute = iMeasureAttribute > -1 && chartAnnotations.MeasureAttributes && chartAnnotations.MeasureAttributes[iMeasureAttribute];
        let dataPoint;
        if (isRunTimeInstance) {
          dataPoint = measureAttribute && measureAttribute?.DataPoint?.$target || undefined;
        } else {
          dataPoint = measureAttribute && entityTypeAnnotations && entityTypeAnnotations[measureAttribute.DataPoint?.$AnnotationPath];
        }
        const path = isRunTimeInstance ? dataPoint?.Value.path : dataPoint?.Value.$Path;
        if (path) {
          propertyPath.push(path);
        } else {
          Log.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute ${chartType} MicroChart.`);
        }
      }
      return isRunTimeInstance ? propertyPath : propertyPath.join(",");
    },
    /**
     * This function returns the visible expression path.
     * @param args
     * @returns Expression Binding for the visible.
     */
    getHiddenPathExpression: function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (!args[0] && !args[1]) {
        return true;
      }
      if (args[0] === true || args[1] === true) {
        return false;
      }
      const hiddenPaths = [];
      [].forEach.call(args, function (hiddenProperty) {
        if (hiddenProperty && hiddenProperty.$Path) {
          hiddenPaths.push("%{" + hiddenProperty.$Path + "}");
        }
      });
      return hiddenPaths.length ? "{= " + hiddenPaths.join(" || ") + " === true ? false : true }" : false;
    },
    /**
     * This function returns the true/false to display chart.
     * @param chartType The chart type
     * @param value Data point value of Value
     * @param value.$Path
     * @param maxValue Data point value of MaximumValue
     * @param maxValue.$Path
     * @param valueHidden Hidden path object/boolean value for the referenced property of value
     * @param valueHidden.$Path
     * @param maxValueHidden Hidden path object/boolean value for the referenced property of MaxValue
     * @param maxValueHidden.$Path
     * @returns `true` or `false` to hide/show chart
     */
    isNotAlwaysHidden: function (chartType, value, maxValue, valueHidden, maxValueHidden) {
      if (valueHidden === true) {
        this.logError(chartType, value);
      }
      if (maxValueHidden === true) {
        this.logError(chartType, maxValue);
      }
      if (valueHidden === undefined && maxValueHidden === undefined) {
        return true;
      } else {
        return (!valueHidden || valueHidden.$Path) && valueHidden !== undefined || (!maxValueHidden || maxValueHidden.$Path) && maxValueHidden !== undefined ? true : false;
      }
    },
    /**
     * This function is to log errors for missing data point properties.
     * @param chartType The chart type.
     * @param value Dynamic hidden property name.
     * @param value.$Path Dynamic hidden property name.
     */
    logError: function (chartType, value) {
      Log.error(`Measure Property ${value?.$Path} is hidden for the ${chartType} Micro Chart`);
    },
    /**
     * This function returns the formatted value with scale factor for the value displayed.
     * @param path Property path for the value
     * @param property The Property for constraints
     * @param fractionDigits No. of fraction digits specified from annotations
     * @param value Static value of the property
     * @returns Expression Binding for the value with scale.
     */
    formatDecimal: function (path, property, fractionDigits, value) {
      if (path) {
        const constraints = [],
          formatOptions = ["style: 'short'"];
        const scale = typeof fractionDigits === "number" ? fractionDigits : property && property?.$Scale || 1;
        if (property.$Nullable != undefined) {
          constraints.push("nullable: " + property.$Nullable);
        }
        if (property.$Precision != undefined) {
          formatOptions.push("precision: " + (property.$Precision ? property.$Precision : "1"));
        }
        constraints.push("scale: " + (scale === "variable" ? "'" + scale + "'" : scale));
        return "{ path: '" + path + "'" + ", type: 'sap.ui.model.odata.type.Decimal', constraints: { " + constraints.join(",") + " }, formatOptions: { " + formatOptions.join(",") + " } }";
      } else if (value) {
        const decimals = typeof fractionDigits === "number" ? fractionDigits : 1;
        return NumberFormat.getFloatInstance({
          style: "short",
          preserveDecimals: true,
          decimals: decimals
        }).format(value);
      }
    },
    /**
     * To fetch, the $select parameters from annotations to add to the list binding.
     * @param groupId GroupId to be used
     * @param sortOrder Sort order to be used
     * @param criticalityCalculation Criticality calculation object property path
     * @param criticality Criticality for the chart
     * @param otherPaths All other paths
     * @param returnObject
     * @returns String containing all the property paths needed to be added to the $select query of the list binding.
     * @private
     */
    getSelectParameters: function (groupId, sortOrder, criticalityCalculation, criticality, otherPaths, returnObject) {
      const propertyPath = [],
        sorters = [];
      const parameters = returnObject ? {} : [];
      if (sortOrder) {
        sortOrder.forEach(sorter => {
          sorters.push(`${sorter.Property}${sorter.Descending ? " desc" : ""}`);
        });
      }
      if (criticality) {
        propertyPath.push(criticality);
      } else if (criticalityCalculation) {
        const cricticalityCalculationKeys = ["ImprovementDirection", "DeviationRangeLowValue", "ToleranceRangeLowValue", "AcceptanceRangeLowValue", "AcceptanceRangeHighValue", "ToleranceRangeHighValue", "DeviationRangeHighValue"];
        Object.keys(criticalityCalculation).forEach(key => {
          if (cricticalityCalculationKeys.includes(key) && criticalityCalculation[key].path) {
            propertyPath.push(criticalityCalculation[key].path);
          }
        });
      }
      otherPaths?.forEach(path => {
        if (path) {
          propertyPath.push(path);
        }
      });
      if (returnObject) {
        if (groupId) {
          parameters.$$groupId = groupId;
        }
        if (propertyPath.length) {
          parameters.$select = propertyPath;
        }
        if (sorters.length) {
          parameters.$orderby = sorters;
        }
        return parameters;
      } else {
        if (groupId) {
          parameters.push(`$$groupId : '${groupId}'`);
        }
        if (propertyPath.length) {
          parameters.push(`$select : '${propertyPath.join(",")}'`);
        }
        if (sorters.length) {
          parameters.push(`$orderby : '${sorters.join(",")}'`);
        }
        return parameters.join(",");
      }
    },
    /**
     * To fetch DataPoint qualifiers of measures.
     * @param chartAnnotations Chart annotations
     * @param entityTypeAnnotations EntityType annotations
     * @param chartType Chart type used
     * @returns Containing all data point qualifiers.
     * @private
     */
    getDataPointQualifiersForMeasures: function (chartAnnotations, entityTypeAnnotations, chartType, isMicroChartRunTime) {
      const qualifiers = [],
        measureAttributes = chartAnnotations.MeasureAttributes,
        fnAddDataPointQualifier = function (chartMeasure) {
          let qualifier;
          if (entityTypeAnnotations) {
            measureAttributes?.forEach(function (measureAttribute) {
              let path, measure;
              if (isMicroChartRunTime) {
                path = measureAttribute.Measure?.value;
                measure = chartMeasure.value;
                if (path == measure) {
                  qualifiers.push(measureAttribute?.DataPoint?.$target?.qualifier);
                }
              } else {
                path = measureAttribute.Measure?.$PropertyPath;
                measure = chartMeasure.$PropertyPath;
                if (path === measure && measureAttribute.DataPoint?.$AnnotationPath) {
                  const annotationPath = measureAttribute?.DataPoint?.$AnnotationPath;
                  if (entityTypeAnnotations[annotationPath]) {
                    qualifier = annotationPath?.split("#")[1];
                    if (qualifier) {
                      qualifiers.push(qualifier);
                    }
                  }
                }
              }
            });
          }
          if (qualifier === undefined) {
            Log.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute for ${chartType} MicroChart.`);
          }
        };
      if (!entityTypeAnnotations) {
        Log.warning(`FE:Macro:MicroChart : Couldn't find annotations for the DataPoint ${chartType} MicroChart.`);
      }
      chartAnnotations.Measures?.forEach(fnAddDataPointQualifier);
      return isMicroChartRunTime ? qualifiers : qualifiers.join(",");
    },
    /**
     * This function is to log warnings for missing datapoint properties.
     * @param chartType The Chart type.
     * @param error Object with properties from DataPoint.
     */
    logWarning: function (chartType, error) {
      for (const key in error) {
        if (!error[key]) {
          Log.warning(`${key} parameter is missing for the ${chartType} Micro Chart`);
        }
      }
    },
    /**
     * This function is used to get DisplayValue for comparison micro chart data aggregation.
     * @param dataPoint Data point object.
     * @param pathText Object after evaluating @com.sap.vocabularies.Common.v1.Text annotation
     * @param pathText.$Path The target path
     * @param valueTextPath Evaluation of @com.sap.vocabularies.Common.v1.Text/$Path/$ value of the annotation
     * @param valueDataPointPath DataPoint>Value/$Path/$ value after evaluating annotation
     * @returns Expression binding for Display Value for comparison micro chart's aggregation data.
     */
    getDisplayValueForMicroChart: function (dataPoint, pathText, valueTextPath, valueDataPointPath) {
      const valueFormat = dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits;
      if (pathText) {
        return MicroChartHelper.formatDecimal(pathText["$Path"], valueTextPath, valueFormat);
      }
      return MicroChartHelper.formatDecimal(dataPoint.Value["$Path"], valueDataPointPath, valueFormat);
    },
    shouldRenderMicroChart: function (chartAnnotation) {
      const availableChartTypes = ["UI.ChartType/Area", "UI.ChartType/Column", "UI.ChartType/Bar"],
        chartType = chartAnnotation.ChartType,
        dataPoint = chartAnnotation.MeasureAttributes[0].DataPoint?.$target,
        dataPointValue = dataPoint?.Value,
        dataPointValueHiddenPath = dataPointValue?.annotations?.UI?.Hidden,
        chartAnnotationDimension = chartAnnotation?.Dimensions && chartAnnotation?.Dimensions[0],
        finalDataPointValue = availableChartTypes.includes(chartType) ? dataPointValue && chartAnnotationDimension : dataPointValue; // only for three charts in array
      if (chartType === "UI.ChartType/Pie") {
        const dataPointMaximumValue = dataPoint && dataPoint.MaximumValue;
        const dataPointMaximumValueHiddenPath = dataPointMaximumValue?.annotations?.UI?.Hidden;
        return dataPointValue && dataPointMaximumValue && MicroChartHelper.isNotAlwaysHidden(chartType, dataPointValue, dataPointMaximumValue, dataPointValueHiddenPath, dataPointMaximumValueHiddenPath);
      }
      return finalDataPointValue && MicroChartHelper.isNotAlwaysHidden(chartType, dataPointValue, dataPointValueHiddenPath);
    },
    /**
     * This function is used to check whether micro chart is enabled or not by checking properties, chart annotations, hidden properties.
     * @param chartType MicroChart Type,such as Bullet.
     * @param dataPoint Data point object.
     * @param dataPointValueHidden Object with $Path annotation to get the hidden value path
     * @param targetAnnotations ChartAnnotation object
     * @param dataPointMaxValue Object with $Path annotation to get hidden max value path
     * @returns `true` if the chart has all values and properties and also it is not always hidden sFinalDataPointValue && bMicrochartVisible.
     */
    shouldMicroChartRender: function (chartType, dataPoint, dataPointValueHidden, targetAnnotations, dataPointMaxValue) {
      const availableChartTypes = ["Area", "Column", "Comparison"],
        dataPointValue = dataPoint && dataPoint.Value,
        hiddenPath = dataPointValueHidden && dataPointValueHidden["com.sap.vocabularies.UI.v1.Hidden"],
        chartAnnotationDimension = targetAnnotations && targetAnnotations.Dimensions && targetAnnotations.Dimensions[0],
        finalDataPointValue = availableChartTypes.includes(chartType) ? dataPointValue && chartAnnotationDimension : dataPointValue; // only for three charts in array
      if (chartType === "Harvey") {
        const dataPointMaximumValue = dataPoint && dataPoint.MaximumValue,
          maxValueHiddenPath = dataPointMaxValue && dataPointMaxValue["com.sap.vocabularies.UI.v1.Hidden"];
        return dataPointValue && dataPointMaximumValue && MicroChartHelper.isNotAlwaysHidden("Bullet", dataPointValue, dataPointMaximumValue, hiddenPath, maxValueHiddenPath);
      }
      return finalDataPointValue && MicroChartHelper.isNotAlwaysHidden(chartType, dataPointValue, undefined, hiddenPath);
    },
    /**
     * This function is used to get dataPointQualifiers for Column, Comparison and StackedBar micro charts.
     * @param annotationPath
     * @returns Result string or undefined.
     */
    getDataPointQualifiersForMicroChart: function (annotationPath) {
      if (!annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")) {
        return undefined;
      }
      return annotationPath.split("#")[1] ?? "";
    },
    /**
     * This function is used to get colorPalette for comparison and HarveyBall Microcharts.
     * @param dataPoint Data point object.
     * @returns Result string for colorPalette or undefined.
     */
    getColorPaletteForMicroChart: function (dataPoint) {
      return dataPoint.Criticality ? undefined : "sapUiChartPaletteQualitativeHue1, sapUiChartPaletteQualitativeHue2, sapUiChartPaletteQualitativeHue3,          sapUiChartPaletteQualitativeHue4, sapUiChartPaletteQualitativeHue5, sapUiChartPaletteQualitativeHue6, sapUiChartPaletteQualitativeHue7,          sapUiChartPaletteQualitativeHue8, sapUiChartPaletteQualitativeHue9, sapUiChartPaletteQualitativeHue10, sapUiChartPaletteQualitativeHue11";
    },
    /**
     * This function is used to get MeasureScale for Area, Column and Line micro charts.
     * @param dataPoint Data point object.
     * @returns Data point value format fractional digits or data point scale or 1.
     */
    getMeasureScaleForMicroChart: function (dataPoint) {
      if (dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits) {
        return dataPoint.ValueFormat.NumberOfFractionalDigits.valueOf();
      }
      if (dataPoint.Value && dataPoint.Value["$Path"] && dataPoint.Value["$Path"]["$Scale"]) {
        return dataPoint.Value["$Path"]["$Scale"];
      }
      return 1;
    },
    /**
     * This function is to return the binding expression of microchart.
     * @param chartType The type of micro chart (Bullet, Radial etc.)
     * @param measure Measure value for micro chart.
     * @param microChart `this`/current model for micro chart.
     * @param collection Collection object.
     * @param uiName The @sapui.name in collection model is not accessible here from model hence need to pass it.
     * @param dataPoint Data point object used in case of Harvey Ball micro chart
     * @returns The binding expression for micro chart.
     * @private
     */
    getBindingExpressionForMicrochart: function (chartType, measure, microChart, collection, uiName, dataPoint) {
      const chartsWithBindingExpression = ["UI.ChartType/Bullet", "UI.ChartType/Pie", "UI.ChartType/Donut", "Radial", "Bullet", "Harvey"];
      if (!chartType || chartsWithBindingExpression.includes(chartType)) {
        const condition = collection["$isCollection"] || collection["$kind"] === "EntitySet";
        const path = condition ? "" : uiName;
        let currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(microChart.showOnlyChart, measure);
        let dataPointCriticallity = "";
        switch (chartType) {
          case "Radial":
          case "UI.ChartType/Donut":
            currencyOrUnit = "";
            break;
          case "Harvey":
          case "UI.ChartType/Pie":
            dataPointCriticallity = dataPoint?.targetObject?.Criticality ? dataPoint.targetObject?.Criticality?.path : "";
            break;
        }
        const functionValue = MicroChartHelper.getSelectParameters(microChart.batchGroupId, undefined, undefined, dataPointCriticallity, [currencyOrUnit]);
        return `{ path: '${path}'` + `, parameters : {${functionValue}} }`;
      } else {
        return microChart.batchGroupId ? "{path:'', parameters : { $$groupId: '" + microChart.batchGroupId + "'} }" : "";
      }
    },
    /**
     * This function is to return the UOMPath expression of the micro chart.
     * @param showOnlyChart Whether only chart should be rendered or not.
     * @param measure Measures for the micro chart.
     * @param chartType Type of the micro chart.
     * @returns UOMPath String for the micro chart.
     * @private
     */
    getUOMPathForMicrochart: function (showOnlyChart, measure, chartType) {
      const chartsWithUOMParts = ["UI.ChartType/Bullet", "UI.ChartType/Pie", "UI.ChartType/Area", "UI.ChartType/Column", "UI.ChartType/Line", "UI.ChartType/Bar"];
      if (!chartType || chartType && chartsWithUOMParts.includes(chartType)) {
        return measure && !showOnlyChart ? measure.targetObject?.annotations?.Measures?.ISOCurrency?.path || measure.targetObject?.annotations?.Measures?.Unit?.path || "" : "";
      } else {
        return undefined;
      }
    },
    /**
     * This function is to return the aggregation binding expression of micro chart.
     * @param aggregationType Aggregation type of chart (for example, Point for AreaMicrochart)
     * @param collection Collection object.
     * @param dataPoint Data point info for micro chart.
     * @param uiName The @sapui.name in collection model is not accessible here from model hence need to pass it.
     * @param dimension Micro chart Dimensions.
     * @param measure Measure value for micro chart.
     * @param sortOrder SortOrder for micro chart.
     * @param measureOrDimensionBar The measure or dimension passed specifically in the case of bar chart.
     * @param returnObject Flag which specifies if the return value should be string or object.
     * @returns Aggregation binding expression for micro chart.
     * @private
     */
    getAggregationForMicrochart: function (aggregationType, collection, dataPoint, uiName, dimension, measure, sortOrder, measureOrDimensionBar, returnObject) {
      let path = collection["$kind"] === "EntitySet" ? "/" : "";
      path = path + uiName;
      const groupId = "";
      let dataPointCriticallityCalc;
      let dataPointCriticallity = dataPoint.targetObject?.Criticality ? dataPoint.targetObject?.Criticality?.path : "";
      const currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(false, measure);
      let targetValuePath = "";
      let dimensionPropertyPath = "";
      if (dimension?.targetObject) {
        dimension = dimension.targetObject;
      }
      if (dimension?.$target?.annotations?.Common?.Text) {
        dimensionPropertyPath = dimension?.$target?.annotations?.Common?.Text?.path;
      } else if (dimension) {
        dimensionPropertyPath = dimension?.value;
      }
      switch (aggregationType) {
        case "Points":
        case "UI.ChartType/Area":
          dataPointCriticallityCalc = dataPoint?.targetObject?.CriticalityCalculation;
          targetValuePath = dataPoint?.targetObject?.TargetValue?.path;
          dataPointCriticallity = "";
          break;
        case "Columns":
        case "UI.ChartType/Column":
          dataPointCriticallityCalc = dataPoint?.targetObject?.CriticalityCalculation;
          break;
        case "LinePoints":
        case "UI.ChartType/Line":
          dataPointCriticallity = "";
          break;
        case "Bars":
        case "UI.ChartType/BarStacked":
          dimensionPropertyPath = "";
          break;
      }
      const parameters = MicroChartHelper.getSelectParameters(groupId, sortOrder, dataPointCriticallityCalc, dataPointCriticallity, [currencyOrUnit, targetValuePath, dimensionPropertyPath, measureOrDimensionBar || ""], returnObject);
      if (returnObject) {
        return {
          path,
          parameters: parameters
        };
      }
      return `{path:'${path}'` + `, parameters : {${parameters}} }`;
    },
    getCurrencyOrUnit: function (measure) {
      if (measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`]) {
        return measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`].$Path || measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`];
      }
      if (measure[`@${"Org.OData.Measures.V1.Unit"}`]) {
        return measure[`@${"Org.OData.Measures.V1.Unit"}`].$Path || measure[`@${"Org.OData.Measures.V1.Unit"}`];
      }
      return "";
    },
    getCalendarPattern: function (propertyType, annotations, isMicroChartRunTime) {
      if (isMicroChartRunTime) {
        return MicroChartHelper.checkPatternForRuntimeInstance(annotations, propertyType);
      } else {
        return MicroChartHelper.checkPatternForTemplateTimeInstance(annotations, propertyType);
      }
    },
    checkPatternForRuntimeInstance: function (annotations, propertyType) {
      return annotations.Common?.IsCalendarYear && "yyyy" || annotations.Common?.IsCalendarQuarter && "Q" || annotations.Common?.IsCalendarMonth && "MM" || annotations.Common?.IsCalendarWeek && "ww" || annotations.Common?.IsCalendarDate && "yyyyMMdd" || annotations.Common?.IsCalendarYearMonth && "yyyyMM" || propertyType === "Edm.Date" && "yyyy-MM-dd" || undefined;
    },
    checkPatternForTemplateTimeInstance: function (annotations, propertyType) {
      return annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarYear"}`] && "yyyy" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarQuarter"}`] && "Q" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarMonth"}`] && "MM" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarWeek"}`] && "ww" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarDate"}`] && "yyyyMMdd" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarYearMonth"}`] && "yyyyMM" || propertyType === "Edm.Date" && "yyyy-MM-dd" || undefined;
    },
    getX: function (propertyPath, propertyType, annotations) {
      const pattern = annotations && MicroChartHelper.getCalendarPattern(propertyType, annotations);
      if (pattern && ["Edm.Date", "Edm.String"].some(type => type === propertyType)) {
        return compileExpression(formatResult([pathInModel(propertyPath), constant(pattern), constant(propertyPath)], "sap.fe.core.formatters.ValueFormatter#formatStringDimension"));
      }
    },
    getExpressionWithType(value, formatOptions) {
      if (value && value.$target) {
        const expression = formatWithTypeInformation(value.$target, getExpressionFromAnnotation(value));
        expression.formatOptions = {
          ...expression.formatOptions,
          ...formatOptions
        };
        return compileExpression(expression);
      }
    },
    calculateColorBinding(dataPoint, actualValueExpression, criticalityExpressionForMicrochart) {
      let colorBinding;
      if (dataPoint.Criticality || !dataPoint.Criticality && !dataPoint.CriticalityCalculation) {
        colorBinding = criticalityExpressionForMicrochart;
      } else if (dataPoint.CriticalityCalculation) {
        const criticalityCalculation = dataPoint.CriticalityCalculation;
        const direction = criticalityCalculation?.ImprovementDirection;
        const deviationRangeLowValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeLowValue)) ?? 0;
        const toleranceRangeLowValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeLowValue)) ?? 0;
        const acceptanceRangeLowValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.AcceptanceRangeLowValue)) ?? 0;
        const acceptanceRangeHighValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.AcceptanceRangeHighValue));
        const toleranceRangeHighValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeHighValue));
        const deviationRangeHighValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeHighValue));
        colorBinding = CommonHelper.getCriticalityCalculationBinding(direction, actualValueExpression, deviationRangeLowValue, toleranceRangeLowValue, acceptanceRangeLowValue, acceptanceRangeHighValue, toleranceRangeHighValue, deviationRangeHighValue);
      }
      return colorBinding;
    },
    async getBulletMicroChartAggregations(dataPoint, criticalityExpressionForMicrochart) {
      const BulletMicroChartData = (await __ui5_require_async("sap/suite/ui/microchart/BulletMicroChartData")).default;
      const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
      const thresholds = [];
      const colorBinding = this.calculateColorBinding(dataPoint, actualValueExpression, criticalityExpressionForMicrochart);
      if (dataPoint.CriticalityCalculation) {
        const criticalityCalculation = dataPoint.CriticalityCalculation;
        const direction = criticalityCalculation?.ImprovementDirection;
        // thresholds
        if (!direction.includes("Minimize") && criticalityCalculation?.DeviationRangeLowValue) {
          thresholds.push(_jsx(BulletMicroChartData, {
            value: compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeLowValue)),
            color: "Error"
          }));
        }
        if (!direction.includes("Minimize") && criticalityCalculation?.ToleranceRangeLowValue) {
          thresholds.push(_jsx(BulletMicroChartData, {
            value: compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeLowValue)),
            color: "Critical"
          }));
        }
        if (!direction.includes("Maximize") && criticalityCalculation?.ToleranceRangeHighValue) {
          thresholds.push(_jsx(BulletMicroChartData, {
            value: compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeHighValue)),
            color: "Critical"
          }));
        }
        if (!direction.includes("Maximize") && criticalityCalculation?.DeviationRangeHighValue) {
          thresholds.push(_jsx(BulletMicroChartData, {
            value: compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeHighValue)),
            color: "Error"
          }));
        }
      }
      const actual = _jsx(BulletMicroChartData, {
        value: actualValueExpression,
        color: colorBinding
      });
      return {
        actual,
        thresholds
      };
    },
    async getStackMicroChartAggregations(dataPoint, measureDataPath, criticalityExpressionForMicrochart) {
      const StackedBarMicroChartBar = (await __ui5_require_async("sap/suite/ui/microchart/StackedBarMicroChartBar")).default;
      const value = this.getExpressionWithType(dataPoint.Value);
      const valueColor = criticalityExpressionForMicrochart;
      const displayValue = measureDataPath?.targetObject?.annotations?.Common?.Text ? this.getExpressionWithType(measureDataPath?.targetObject?.annotations?.Common?.Text) : undefined;
      return {
        bars: _jsx(StackedBarMicroChartBar, {
          value: value,
          displayValue: displayValue,
          valueColor: valueColor
        })
      };
    },
    async getHarveyMicroChartAggregations(dataPoint, criticalityExpressionForMicrochart) {
      const HarveyBallMicroChartItem = (await __ui5_require_async("sap/suite/ui/microchart/HarveyBallMicroChartItem")).default;
      const fractionLabel = this.getExpressionWithType(dataPoint.Value, {
        style: "short"
      });
      const fractionValue = this.getExpressionWithType(dataPoint.Value);
      const colorValue = criticalityExpressionForMicrochart;
      return {
        items: _jsx(HarveyBallMicroChartItem, {
          formattedLabel: true,
          fractionLabel: fractionLabel,
          fraction: fractionValue,
          color: colorValue
        })
      };
    },
    async getComparisonMicroChartAggregations(dataPoint, criticalityExpressionForMicrochart, chart) {
      const ComparisonMicroChartData = (await __ui5_require_async("sap/suite/ui/microchart/ComparisonMicroChartData")).default;
      const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
      const displayValue = this.getExpressionWithType(dataPoint.Value, {
        style: "short"
      });
      const commonTextAnnotation = chart.Dimensions[0].$target?.annotations.Common?.Text;
      const titleExpression = commonTextAnnotation ? compileExpression(getExpressionFromAnnotation(commonTextAnnotation)) : compileExpression(pathInModel(chart.Dimensions[0].value));
      return _jsx(ComparisonMicroChartData, {
        value: actualValueExpression,
        color: criticalityExpressionForMicrochart,
        title: titleExpression,
        displayValue: displayValue
      });
    },
    async getColumnMicroChartAggregations(dataPoint, criticalityExpressionForMicrochart, showOnlyChart) {
      const ColumnMicroChartData = (await __ui5_require_async("sap/suite/ui/microchart/ColumnMicroChartData")).default;
      const ColumnMicroChartLabel = (await __ui5_require_async("sap/suite/ui/microchart/ColumnMicroChartLabel")).default;
      const columnChartAggregations = {};
      const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
      const colorBinding = this.calculateColorBinding(dataPoint, actualValueExpression, criticalityExpressionForMicrochart);
      columnChartAggregations.columns = _jsx(ColumnMicroChartData, {
        value: actualValueExpression,
        color: colorBinding
      });
      if (!showOnlyChart) {
        columnChartAggregations.leftBottomLabel = _jsx(ColumnMicroChartLabel, {});
        columnChartAggregations.leftTopLabel = _jsx(ColumnMicroChartLabel, {});
        columnChartAggregations.rightBottomLabel = _jsx(ColumnMicroChartLabel, {});
        columnChartAggregations.rightTopLabel = _jsx(ColumnMicroChartLabel, {});
      }
      return columnChartAggregations;
    },
    async getLineMicroChartAggragations(microChartDataModelObjectPath, chartTarget, targetNavigationPath) {
      const LineMicroChartLine = (await __ui5_require_async("sap/suite/ui/microchart/LineMicroChartLine")).default;
      const LineMicroChartPoint = (await __ui5_require_async("sap/suite/ui/microchart/LineMicroChartPoint")).default;
      const dimensionDataPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget.Dimensions[0].value);
      const measures = chartTarget.Measures;
      const lines = [];
      for (let i = 0; i < measures.length; i++) {
        const DataPointPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget?.MeasureAttributes[i]?.DataPoint?.value);
        const measureDataPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget.Measures[i].value);
        const points = MicroChartHelper.getAggregationForMicrochart("LinePoints", targetNavigationPath?.getObject(), DataPointPath, targetNavigationPath?.getObject("@sapui.name"), chartTarget.Dimensions[0], measureDataPath, microChartDataModelObjectPath?.targetObject?.SortOrder, undefined, true);
        const xData = this.getXData(dimensionDataPath, microChartDataModelObjectPath);
        const yData = compileExpression(getExpressionFromAnnotation(DataPointPath.targetObject?.Value));
        lines.push(_jsx(LineMicroChartLine, {
          points: points,
          children: {
            points: _jsx(LineMicroChartPoint, {
              x: xData,
              y: yData
            })
          }
        }));
      }
      return {
        lines: lines
      };
    },
    getXData(dimensionDataPath, microChartDataModelObjectPath) {
      let xData;
      const propertyType = dimensionDataPath?.targetObject?.type;
      const propAnnotations = dimensionDataPath.targetObject?.annotations;
      if (propertyType === "Edm.Date" || dimensionDataPath.targetObject?.type === "Edm.String" && MicroChartHelper.getCalendarPattern(propertyType, dimensionDataPath.targetObject?.annotations, true)) {
        const propertyPath = dimensionDataPath?.targetObject?.name;
        const pattern = propAnnotations && MicroChartHelper.getCalendarPattern(propertyType, propAnnotations, true);
        if (pattern && ["Edm.Date", "Edm.String"].some(type => type === propertyType)) {
          xData = compileExpression(formatResult([pathInModel(propertyPath), pattern, propertyPath], valueFormatters.formatStringDimension));
        }
      } else {
        dimensionDataPath.contextLocation = microChartDataModelObjectPath;
        xData = getValueBinding(dimensionDataPath, {});
      }
      return xData;
    },
    async getAreaMicroChartAggregations(chartTarget, microChartDataModelObjectPath, targetNavigationPath, showOnlyChart) {
      const AreaMicroChartItem = (await __ui5_require_async("sap/suite/ui/microchart/AreaMicroChartItem")).default;
      const AreaMicroChartPoint = (await __ui5_require_async("sap/suite/ui/microchart/AreaMicroChartPoint")).default;
      const AreaMicroChartLabel = (await __ui5_require_async("sap/suite/ui/microchart/AreaMicroChartLabel")).default;
      const dataPoint = chartTarget?.MeasureAttributes[0]?.DataPoint?.$target;
      const measureDataPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget.Measures[0].value);
      const dimensionDataPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget.Dimensions[0].value);
      const DataPointPath = enhanceDataModelPath(microChartDataModelObjectPath, chartTarget?.MeasureAttributes[0]?.DataPoint?.value);
      const targetNavigationDataModelObject = MetaModelConverter.getInvolvedDataModelObjects(targetNavigationPath);
      const getAreaMicroChartItem = (y, color, isChartAggregation) => {
        let points;
        if (isChartAggregation) {
          points = MicroChartHelper.getAggregationForMicrochart("Points", targetNavigationPath?.getObject(), DataPointPath, targetNavigationPath?.getObject("@sapui.name"), chartTarget.Dimensions[0], measureDataPath, microChartDataModelObjectPath?.targetObject?.SortOrder, "", true);
        } else {
          points = {
            path: (targetNavigationDataModelObject.targetObject?._type === "EntitySet" ? "/" : "") + targetNavigationDataModelObject.targetObject?.name
          };
        }
        return _jsx(AreaMicroChartItem, {
          color: color,
          points: points,
          children: {
            points: _jsx(AreaMicroChartPoint, {
              x: x,
              y: compileExpression(getExpressionFromAnnotation(y))
            })
          }
        });
      };
      const aggregation = {};
      const x = this.getXData(dimensionDataPath, microChartDataModelObjectPath);
      aggregation.chart = getAreaMicroChartItem(dataPoint.Value, "", true);
      aggregation.target = getAreaMicroChartItem(dataPoint.TargetValue);
      if (!showOnlyChart) {
        aggregation.firstXLabel = _jsx(AreaMicroChartLabel, {});
        aggregation.firstYLabel = _jsx(AreaMicroChartLabel, {});
        aggregation.lastXLabel = _jsx(AreaMicroChartLabel, {});
        aggregation.lastYLabel = _jsx(AreaMicroChartLabel, {});
      }
      const improvementDirection = DataPointPath?.targetObject?.CriticalityCalculation?.ImprovementDirection;
      if (improvementDirection === "UI.ImprovementDirectionType/Minimize") {
        aggregation.minThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.ToleranceRangeHighValue, "Good");
        aggregation.maxThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.DeviationRangeHighValue, "Error");
      } else if (improvementDirection === "UI.ImprovementDirectionType/Maximize") {
        aggregation.minThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.DeviationRangeLowValue, "Error");
        aggregation.maxThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.ToleranceRangeLowValue, "Good");
      } else if (improvementDirection === "UI.ImprovementDirectionType/Target") {
        aggregation.minThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.DeviationRangeLowValue, "Error");
        aggregation.maxThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.DeviationRangeHighValue, "Error");
        aggregation.innerMinThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.ToleranceRangeLowValue, "Good");
        aggregation.innerMaxThreshold = getAreaMicroChartItem(dataPoint?.CriticalityCalculation?.ToleranceRangeHighValue, "Good");
      }
      return aggregation;
    },
    getBulletMicroChartProperties(microChartProperties, dataPoint) {
      microChartProperties.targetValue = dataPoint.TargetValue ? compileExpression(getExpressionFromAnnotation(dataPoint.TargetValue)) : undefined;
      microChartProperties.forecastValue = dataPoint.ForecastValue ? compileExpression(getExpressionFromAnnotation(dataPoint.ForecastValue)) : undefined;
      microChartProperties.maxValue = dataPoint.MaximumValue ? compileExpression(constant(dataPoint.MaximumValue?.valueOf())) : undefined;
      microChartProperties.minValue = dataPoint.MinimumValue ? compileExpression(constant(dataPoint.MinimumValue?.valueOf())) : undefined;
      microChartProperties.actualValueLabel = dataPoint.Value ? MicroChartHelper.getExpressionWithType(dataPoint.Value, {
        style: "short"
      }) : undefined;
      microChartProperties.targetValueLabel = dataPoint.TargetValue ? MicroChartHelper.getExpressionWithType(dataPoint.TargetValue, {
        style: "short"
      }) : undefined;
      microChartProperties.showDeltaValue = dataPoint.Visualization && dataPoint.Visualization === "UI.VisualizationType/DeltaBulletChart";
      microChartProperties.mode = microChartProperties.showDeltaValue ? "Delta" : undefined;
      return microChartProperties;
    },
    getRadialMicroChartProperties(microChartProperties, dataPoint) {
      microChartProperties.total = dataPoint.TargetValue ? compileExpression(getExpressionFromAnnotation(dataPoint.TargetValue)) : 100;
      const value = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
      microChartProperties.fraction = value;
      microChartProperties.percentage = !dataPoint.TargetValue ? value : undefined;
      const colorExpression = dataPoint.Criticality ? buildExpressionForCriticalityColorMicroChart(dataPoint) : undefined;
      microChartProperties.valueColor = MicroChartHelper.calculateColorBinding(dataPoint, value, colorExpression);
      return microChartProperties;
    },
    getHarveyMicroChartProperties(microChartProperties, dataPoint) {
      microChartProperties.formattedLabel = true;
      microChartProperties.totalLabel = MicroChartHelper.getExpressionWithType(dataPoint.MaximumValue, {
        style: "short"
      });
      microChartProperties.total = MicroChartHelper.getExpressionWithType(dataPoint.MaximumValue);
      microChartProperties.colorPalette = MicroChartHelper.getColorPaletteForMicroChart(dataPoint);
      return microChartProperties;
    }
  };
  return MicroChartHelper;
}, false);
//# sourceMappingURL=MicroChartHelper-dbg.js.map

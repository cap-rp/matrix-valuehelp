/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/JSTokenizer", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/controls/filterbar/utils/VisualFilterUtils", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filterBar/FilterHelper", "sap/m/library", "sap/ui/core/Lib", "sap/ui/core/format/NumberFormat", "sap/ui/mdc/condition/ConditionConverter", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/Filter", "sap/ui/model/odata/v4/ODataUtils", "../field/FieldTemplating"], function (JSTokenizer, CommonUtils, StableIdHelper, TypeGuards, CriticalityFormatters, CommonHelper, VisualFilterUtils, FilterFieldHelper, FilterHelper, mLibrary, Library, NumberFormat, ConditionConverter, TypeMap, Filter, ODataUtils, FieldTemplating) {
  "use strict";

  var getTextBinding = FieldTemplating.getTextBinding;
  var getFiltersConditionsFromSelectionVariant = FilterHelper.getFiltersConditionsFromSelectionVariant;
  var formatOptions = FilterFieldHelper.formatOptions;
  var constraints = FilterFieldHelper.constraints;
  var buildExpressionForCriticalityColorMicroChart = CriticalityFormatters.buildExpressionForCriticalityColorMicroChart;
  var isSingleton = TypeGuards.isSingleton;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var generate = StableIdHelper.generate;
  const InteractiveChartHelper = {
    getChartDisplayedValue: function (value, valueFormat, metaPath) {
      const infoPath = generate([metaPath]);
      return "{parts:[{path:'" + value + "',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}" + (valueFormat && valueFormat.ScaleFactor ? ",{value:'" + valueFormat.ScaleFactor.valueOf() + "'}" : ",{path:'internal>scalefactorNumber/" + infoPath + "'}") + (valueFormat && valueFormat.NumberOfFractionalDigits ? ",{value:'" + valueFormat.NumberOfFractionalDigits + "'}" : ",{value:'0'}") + ",{path:'internal>currency/" + infoPath + "'}" + ",{path:'" + value + "',type:'sap.ui.model.odata.type.String', constraints:{'nullable':false}}" + "], formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.scaleVisualFilterValue'}"; //+ sType.split('#').length ? sType.split('#')[1] : 'Decimal' + "}";
    },
    getChartValue: function (value) {
      return "{path:'" + value + "',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}";
    },
    _getCollectionName: function (collection, contextPath, parameters) {
      const collectionObject = collection?.targetObject;
      if (isNavigationProperty(collectionObject)) {
        return parameters ? contextPath : collectionObject.name;
      } else if (isEntitySet(collectionObject)) {
        return "/" + collectionObject.name;
      } else {
        return collectionObject.name;
      }
    },
    _getBindingPathForParameters: function (filterConditions, metaModel, collectionName, parameters, entitySetPath) {
      const params = [];
      const convertedFilterConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
      const parameterProperties = CommonUtils.getParameterInfo(metaModel, collectionName).parameterProperties;
      if (parameterProperties) {
        for (const i in parameters) {
          const parameter = parameters[i];
          const property = parameterProperties[parameter];
          const entityPath = entitySetPath.split("/")[1];
          const propertyContext = metaModel?.createBindingContext(`/${entityPath}/${parameter}`);
          let typeConfig;
          if (propertyContext) {
            typeConfig = TypeMap.getTypeConfig(property.$Type, JSTokenizer.parseJS(formatOptions(property, {
              context: propertyContext
            }) || "{}"), JSTokenizer.parseJS(constraints(property, {
              context: propertyContext
            }) || "{}"));
          }
          const condition = convertedFilterConditions[parameter];
          const conditionInternal = condition ? condition[0] : undefined;
          if (conditionInternal) {
            const internalParameterCondition = ConditionConverter.toType(conditionInternal, typeConfig, TypeMap);
            const edmType = property.$Type;
            let value = encodeURIComponent(ODataUtils.formatLiteral(internalParameterCondition.values[0], edmType));
            params.push(`${parameter}=${value}`);
          }
        }
      }
      const parameterEntitySet = collectionName.slice(0, collectionName.lastIndexOf("/"));
      const targetNavigation = collectionName.substring(collectionName.lastIndexOf("/") + 1);
      // create parameter context
      return `${parameterEntitySet}(${params.toString()})/${targetNavigation}`;
    },
    _getUOMAggregationExpression: function (customAggregate, UoMHasCustomAggregate, UOM, aggregation) {
      let aggregationExpression, UOMExpression;
      const path = UOM && isPathAnnotationExpression(UOM) && UOM.path;
      if (customAggregate) {
        //custom aggregate for a currency or unit of measure corresponding to this aggregatable property
        if (UoMHasCustomAggregate) {
          aggregationExpression = path ? {
            unit: path
          } : {};
          UOMExpression = {};
        } else {
          aggregationExpression = {};
          UOMExpression = path ? {
            [path]: {}
          } : {};
        }
      } else if (aggregation && aggregation.AggregatableProperty && aggregation.AggregatableProperty.value && aggregation.AggregationMethod) {
        aggregationExpression = {
          name: aggregation.AggregatableProperty.value,
          with: aggregation.AggregationMethod
        };
        UOMExpression = path ? {
          [path]: {}
        } : {};
      }
      return {
        aggregationExpression: aggregationExpression,
        UOMExpression: UOMExpression
      };
    },
    getAggregationBinding: function (chartAnnotations, collection, contextPath, textAssociation, dimensionType, sortOrder, selectionVariant, customAggregate, aggregation, UoMHasCustomAggregate, parameters, filterBarEntityType, draftSupported, chartMeasure, metaModel) {
      const selectionVariantAnnotation = selectionVariant;
      const entityType = filterBarEntityType;
      const entitySetPath = contextPath;
      const dimension = chartAnnotations.Dimensions[0].value;
      const filters = [];
      let filterConditions;
      let collectionName = this._getCollectionName(collection, contextPath, parameters);
      const UOM = InteractiveChartHelper.getUoM(chartAnnotations, collection, undefined, customAggregate, aggregation);
      if (draftSupported) {
        filters.push(new Filter({
          operator: "EQ",
          value1: "true",
          value2: null,
          path: "IsActiveEntity"
        }));
      }
      if (selectionVariantAnnotation) {
        filterConditions = getFiltersConditionsFromSelectionVariant(entitySetPath, metaModel, selectionVariantAnnotation, VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils));
        for (const path in filterConditions) {
          const conditions = filterConditions[path];
          conditions.forEach(function (condition) {
            if (!condition.isParameter) {
              filters.push(new Filter({
                operator: condition.operator,
                value1: condition.value1,
                value2: condition.value2,
                path: condition.path
              }));
            }
          });
        }
      }
      if (entityType !== `${collectionName}/` && parameters && parameters.length && filterConditions) {
        const bindingPath = this._getBindingPathForParameters(filterConditions, metaModel, collectionName, parameters, entitySetPath);
        collectionName = bindingPath;
      }
      const UOMAggregationExpression = this._getUOMAggregationExpression(customAggregate, UoMHasCustomAggregate, UOM, aggregation);
      const aggregationExpression = UOMAggregationExpression.aggregationExpression;
      const UOMExpression = UOMAggregationExpression.UOMExpression;
      const textAssociationExpression = textAssociation ? {
        additionally: [textAssociation.path]
      } : {};
      const finalparameters = {
        ...this.getSortOrder(chartAnnotations, dimensionType, sortOrder, chartMeasure),
        $$aggregation: {
          aggregate: {
            [chartMeasure]: aggregationExpression
          },
          group: {
            [dimension]: {
              ...textAssociationExpression
            },
            ...UOMExpression
          }
        }
      };
      return {
        path: collectionName,
        templateShareable: true,
        suspended: true,
        filters: filters,
        parameters: finalparameters,
        ...InteractiveChartHelper.getMaxItems(chartAnnotations)
      };
    },
    _getOrderExpressionFromMeasure: function (sortOrder, chartMeasure) {
      let sortPropertyName;
      if (sortOrder && sortOrder.length) {
        if (sortOrder[0].DynamicProperty) {
          sortPropertyName = sortOrder[0].DynamicProperty.$target?.Name;
        } else {
          sortPropertyName = sortOrder[0].Property?.value;
        }
        if (sortPropertyName === chartMeasure) {
          return {
            $orderby: chartMeasure + (sortOrder[0].Descending ? " desc" : "")
          };
        }
        return {
          $orderby: chartMeasure + " desc"
        };
      }
      return {
        $orderby: chartMeasure + " desc"
      };
    },
    getSortOrder: function (chartAnnotations, dimensionType, sortOrder, chartMeasure) {
      if (chartAnnotations.ChartType === "UI.ChartType/Donut" || chartAnnotations.ChartType === "UI.ChartType/Bar") {
        return this._getOrderExpressionFromMeasure(sortOrder, chartMeasure);
      } else if (dimensionType === "Edm.Date" || dimensionType === "Edm.Time" || dimensionType === "Edm.DateTimeOffset") {
        return {
          $orderby: chartAnnotations.Dimensions[0].value
        };
      } else if (sortOrder && sortOrder.length && sortOrder[0].Property?.$target?.path === chartAnnotations.Dimensions[0].value) {
        return {
          $orderby: sortOrder[0].Property?.$target?.name + (sortOrder[0].Descending ? "desc'" : "'")
        };
      } else {
        return {
          $orderby: chartAnnotations.Dimensions[0].$target?.name
        };
      }
    },
    getMaxItems: function (chartAnnotations) {
      if (chartAnnotations.ChartType === "UI.ChartType/Bar") {
        return {
          startIndex: 0,
          length: 3
        };
      } else if (chartAnnotations.ChartType === "UI.ChartType/Line") {
        return {
          startIndex: 0,
          length: 6
        };
      } else {
        return "";
      }
    },
    getColorBinding: function (dataPoint, dimension) {
      const valueCriticality = dimension?.$target?.annotations?.UI?.ValueCriticality;
      if (dataPoint?.Criticality) {
        return buildExpressionForCriticalityColorMicroChart(dataPoint);
      } else if (dataPoint?.CriticalityCalculation) {
        const oDirection = dataPoint.CriticalityCalculation.ImprovementDirection;
        const oDataPointValue = dataPoint.Value;
        const oDeviationRangeLowValue = dataPoint.CriticalityCalculation.DeviationRangeLowValue.valueOf();
        const oToleranceRangeLowValue = dataPoint.CriticalityCalculation.ToleranceRangeLowValue.valueOf();
        const oAcceptanceRangeLowValue = dataPoint.CriticalityCalculation.AcceptanceRangeLowValue.valueOf();
        const oAcceptanceRangeHighValue = dataPoint.CriticalityCalculation.AcceptanceRangeHighValue.valueOf();
        const oToleranceRangeHighValue = dataPoint.CriticalityCalculation.ToleranceRangeHighValue.valueOf();
        const oDeviationRangeHighValue = dataPoint.CriticalityCalculation.DeviationRangeHighValue.valueOf();
        return CommonHelper.getCriticalityCalculationBinding(oDirection, oDataPointValue, oDeviationRangeLowValue, oToleranceRangeLowValue, oAcceptanceRangeLowValue, oAcceptanceRangeHighValue, oToleranceRangeHighValue, oDeviationRangeHighValue);
      } else if (valueCriticality && valueCriticality.length) {
        return InteractiveChartHelper.getValueCriticality(dimension.value, valueCriticality);
      } else {
        return undefined;
      }
    },
    getValueCriticality: function (dimension, valueCriticality) {
      let result;
      const values = [];
      if (valueCriticality && valueCriticality.length > 0) {
        valueCriticality.forEach(function (valueCriticalityType) {
          if (valueCriticalityType.Value && valueCriticalityType.Criticality) {
            const value = "${" + dimension + "} === '" + valueCriticalityType.Value + "' ? '" + InteractiveChartHelper._getCriticalityFromEnum(valueCriticalityType.Criticality) + "'";
            values.push(value);
          }
        });
        result = values.length > 0 && values.join(" : ") + " : undefined";
      }
      return result ? "{= " + result + " }" : undefined;
    },
    /**
     * This function returns the criticality indicator from annotations if criticality is EnumMember.
     * @param criticality Criticality provided in the annotations
     * @returns Return the indicator for criticality
     * @private
     */
    _getCriticalityFromEnum: function (criticality) {
      const valueColor = mLibrary.ValueColor;
      let indicator;
      if (criticality === "UI.CriticalityType/Negative") {
        indicator = valueColor.Error;
      } else if (criticality === "UI.CriticalityType/Positive") {
        indicator = valueColor.Good;
      } else if (criticality === "UI.CriticalityType/Critical") {
        indicator = valueColor.Critical;
      } else {
        indicator = valueColor.Neutral;
      }
      return indicator;
    },
    getScaleUoMTitle: function (chartAnnotation, collection, metaPath, customAggregate, aggregation, seperator, toolTip) {
      const scaleFactor = chartAnnotation?.MeasureAttributes ? chartAnnotation.MeasureAttributes[0]?.DataPoint?.$target?.ValueFormat?.ScaleFactor?.valueOf() : undefined;
      const infoPath = generate([metaPath]);
      const fixedInteger = NumberFormat.getIntegerInstance({
        style: "short",
        showScale: false,
        shortRefNumber: scaleFactor
      });
      let scale = fixedInteger.getScale();
      let UOM = InteractiveChartHelper.getUoM(chartAnnotation, collection, undefined, customAggregate, aggregation);
      UOM = UOM && (UOM.path ? "${internal>uom/" + infoPath + "}" : "'" + UOM + "'");
      scale = scale ? "'" + scale + "'" : "${internal>scalefactor/" + infoPath + "}";
      if (!seperator) {
        seperator = "|";
      }
      seperator = "' " + seperator + " ' + ";
      const expression = scale && UOM ? seperator + scale + " + ' ' + " + UOM : seperator + (scale || UOM);
      return toolTip ? expression : "{= " + expression + "}";
    },
    getMeasureDimensionTitle: function (chartAnnotation, customAggregate, aggregation) {
      let measureLabel;
      let measurePath;
      if (customAggregate) {
        measurePath = chartAnnotation?.Measures[0]?.$target?.name;
      }
      if (chartAnnotation?.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
        measurePath = chartAnnotation.DynamicMeasures[0]?.$target?.AggregatableProperty?.value;
      } else if (!customAggregate && chartAnnotation?.Measures && chartAnnotation?.Measures.length > 0) {
        measurePath = chartAnnotation.Measures[0]?.$target?.name;
      }
      const dimensionPath = chartAnnotation?.Dimensions[0]?.value;
      let dimensionLabel = chartAnnotation?.Dimensions[0]?.$target?.annotations?.Common?.Label;
      if (!customAggregate && aggregation) {
        // check if the label is part of aggregated properties (Transformation aggregates)
        measureLabel = aggregation.annotations && aggregation.annotations.Common && aggregation.annotations.Common.Label;
        if (measureLabel === undefined) {
          measureLabel = chartAnnotation?.Measures?.[0]?.$target?.annotations?.Common?.Label;
        }
      } else {
        measureLabel = chartAnnotation?.Measures?.[0]?.$target?.annotations?.Common?.Label;
      }
      if (measureLabel === undefined) {
        measureLabel = measurePath;
      }
      if (dimensionLabel === undefined) {
        dimensionLabel = dimensionPath;
      }
      return Library.getResourceBundleFor("sap.fe.macros").getText("M_INTERACTIVE_CHART_HELPER_VISUALFILTER_MEASURE_DIMENSION_TITLE", [measureLabel, dimensionLabel]);
    },
    getToolTip: function (chartAnnotation, collection, metaPath, customAggregate, aggregation, renderLineChart) {
      const chartType = chartAnnotation && chartAnnotation["ChartType"];
      let measureDimensionToolTip = InteractiveChartHelper.getMeasureDimensionTitle(chartAnnotation, customAggregate, aggregation);
      measureDimensionToolTip = CommonHelper.escapeSingleQuotes(measureDimensionToolTip);
      if (renderLineChart === false && chartType === "UI.ChartType/Line") {
        return `{= '${measureDimensionToolTip}'}`;
      }
      const seperator = Library.getResourceBundleFor("sap.fe.macros")?.getText("M_INTERACTIVE_CHART_HELPER_VISUALFILTER_TOOLTIP_SEPERATOR");
      const infoPath = generate([metaPath]);
      const scaleUOMTooltip = InteractiveChartHelper.getScaleUoMTitle(chartAnnotation, collection, infoPath, customAggregate, aggregation, seperator, true);
      return "{= '" + measureDimensionToolTip + (scaleUOMTooltip ? "' + " + scaleUOMTooltip : "'") + "}";
    },
    _getUOM: function (UOMObjectPath, UOM, collection, customData, aggregatablePropertyPath) {
      const UOMObject = {};
      const collectionObject = collection?.targetObject;
      if (UOMObjectPath && UOM && isPathAnnotationExpression(UOMObjectPath)) {
        // check if the UOM is part of Measure annotations(Custom aggregates)
        UOMObject[UOM] = {
          $Path: UOMObjectPath.path
        };
        return customData && UOMObjectPath.path ? UOMObject : UOMObjectPath;
      } else if (aggregatablePropertyPath) {
        // check if the UOM is part of base property annotations(Transformation aggregates)
        const entityProperties = isEntitySet(collectionObject) || isSingleton(collectionObject) ? collectionObject.entityType.entityProperties : collectionObject?.targetType?.entityProperties;
        const propertyAnnotations = entityProperties?.find(property => property.name == aggregatablePropertyPath);
        if (propertyAnnotations?.annotations?.Measures && UOM) {
          UOMObjectPath = propertyAnnotations?.annotations?.Measures[UOM];
          UOMObject[UOM] = {
            $Path: UOMObjectPath?.path
          };
        }
        return UOMObjectPath && customData && isPathAnnotationExpression(UOMObjectPath) && UOMObjectPath.path ? UOMObject : UOMObjectPath;
      }
    },
    getUoM: function (chartAnnotation, collection, customData, customAggregate, aggregation) {
      let measure = {};
      if (customAggregate) {
        measure = chartAnnotation?.Measures[0];
      }
      if (chartAnnotation?.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
        measure = chartAnnotation.DynamicMeasures[0]?.$target?.AggregatableProperty?.$target?.annotations?.Measures;
      } else if (!customAggregate && chartAnnotation?.Measures && chartAnnotation.Measures.length > 0) {
        measure = chartAnnotation.Measures[0];
      }
      const ISOCurrency = measure?.ISOCurrency;
      const unit = measure?.Unit;
      let aggregatablePropertyPath;
      if (!customAggregate && aggregation) {
        aggregatablePropertyPath = aggregation.AggregatableProperty && aggregation.AggregatableProperty.value;
      } else {
        aggregatablePropertyPath = measure?.value;
      }
      return this._getUOM(ISOCurrency, "ISOCurrency", collection, customData, aggregatablePropertyPath) || this._getUOM(unit, "Unit", collection, customData, aggregatablePropertyPath);
    },
    getScaleFactor: function (valueFormat) {
      if (valueFormat && valueFormat.ScaleFactor) {
        return valueFormat.ScaleFactor.valueOf();
      }
      return undefined;
    },
    getUoMVisiblity: function (chartAnnotation, showError) {
      const chartType = chartAnnotation && chartAnnotation["ChartType"];
      if (showError) {
        return false;
      } else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
        return false;
      } else {
        return true;
      }
    },
    getInParameterFiltersBinding: function (inParameters) {
      if (inParameters.length > 0) {
        const parts = [];
        let paths = "";
        inParameters.forEach(function (inParameter) {
          if (inParameter.localDataProperty) {
            parts.push(`{path:'$filters>/conditions/${inParameter.localDataProperty}'}`);
          }
        });
        if (parts.length > 0) {
          paths = parts.join();
          return `{parts:[${paths}], formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.getFiltersFromConditions'}`;
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    },
    getfilterCountBinding: function (chartAnnotation) {
      const dimension = chartAnnotation?.Dimensions[0]?.$target?.name;
      return "{path:'$filters>/conditions/" + dimension + "', formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.getFilterCounts'}";
    },
    getInteractiveChartProperties: function (visualFilter) {
      const chartAnnotation = visualFilter.chartAnnotation;
      const interactiveChartProperties = {};
      if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
        const id = generate([visualFilter.metaPath]);
        interactiveChartProperties.showErrorExpression = "{= ${internal>" + id + "/showError}}";
        interactiveChartProperties.errorMessageExpression = "{= ${internal>" + id + "/errorMessage}}";
        interactiveChartProperties.errorMessageTitleExpression = "{= ${internal>" + id + "/errorMessageTitle}}";
        let dataPointAnnotation;
        if (chartAnnotation?.MeasureAttributes && chartAnnotation?.MeasureAttributes[0]) {
          dataPointAnnotation = chartAnnotation?.MeasureAttributes[0]?.DataPoint ? chartAnnotation?.MeasureAttributes[0].DataPoint.$target : chartAnnotation?.MeasureAttributes[0];
        }
        const dimension = chartAnnotation?.Dimensions[0];
        const parameters = CommonHelper.getParameters(visualFilter.contextPath, visualFilter.getMetaModel());
        const dimensionText = dimension?.$target?.annotations?.Common?.Text;
        interactiveChartProperties.aggregationBinding = InteractiveChartHelper.getAggregationBinding(chartAnnotation, visualFilter.collection, visualFilter.contextPath, dimensionText, dimension.$target?.type, visualFilter?.sortOrder, visualFilter.selectionVariant, visualFilter.customAggregate, visualFilter.aggregateProperties, visualFilter.UoMHasCustomAggregate, parameters, visualFilter.filterBarEntityType, visualFilter.draftSupported, visualFilter.chartMeasure, visualFilter.getMetaModel());
        interactiveChartProperties.scalefactor = InteractiveChartHelper.getScaleFactor(dataPointAnnotation?.ValueFormat);
        interactiveChartProperties.uom = InteractiveChartHelper.getUoM(chartAnnotation, visualFilter.collection, true, visualFilter.customAggregate, visualFilter.aggregateProperties);
        interactiveChartProperties.inParameters = visualFilter.inParameters;
        const inParameters = CommonHelper.parseCustomData(visualFilter.inParameters);
        interactiveChartProperties.inParameterFilters = visualFilter.inParameters ? InteractiveChartHelper.getInParameterFiltersBinding(inParameters) : undefined;
        interactiveChartProperties.selectionVariant = visualFilter.selectionVariant ? visualFilter.selectionVariant : undefined;
        interactiveChartProperties.stringifiedParameters = parameters;
        const dimensionContext = visualFilter.getMetaModel()?.createBindingContext(visualFilter.contextPath + "/@" + dimension.fullyQualifiedName.split("@")[1]);
        if (dimensionContext) {
          const dimensionObject = visualFilter.getDataModelObjectForMetaPath(dimensionContext.getPath(), visualFilter.contextPath);
          interactiveChartProperties.chartLabel = getTextBinding(dimensionObject, {});
        }
        interactiveChartProperties.measure = InteractiveChartHelper.getChartValue(visualFilter.chartMeasure);
        interactiveChartProperties.displayedValue = InteractiveChartHelper.getChartDisplayedValue(visualFilter.chartMeasure, dataPointAnnotation?.ValueFormat, visualFilter.metaPath);
        interactiveChartProperties.color = InteractiveChartHelper.getColorBinding(dataPointAnnotation, dimension);
      }
      return interactiveChartProperties;
    }
  };
  return InteractiveChartHelper;
}, false);
//# sourceMappingURL=InteractiveChartHelper-dbg.js.map

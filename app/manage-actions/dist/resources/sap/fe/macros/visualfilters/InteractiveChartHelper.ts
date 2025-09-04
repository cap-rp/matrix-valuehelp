import type { PathAnnotationExpression, Property, PropertyAnnotationValue, PropertyPath } from "@sap-ux/vocabularies-types";
import type { AggregatedProperty, AggregatedPropertyType } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import type { Label, SortOrderType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type {
	Chart,
	DataPoint,
	NumberFormat as NumberFormatType,
	SelectionVariant,
	ValueCriticalityType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import JSTokenizer from "sap/base/util/JSTokenizer";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { ParameterType } from "sap/fe/core/converters/controls/ListReport/VisualFilters";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isEntitySet, isNavigationProperty, isPathAnnotationExpression, isSingleton } from "sap/fe/core/helpers/TypeGuards";
import { buildExpressionForCriticalityColorMicroChart } from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import VisualFilterUtils from "sap/fe/macros/controls/filterbar/utils/VisualFilterUtils";
import { constraints, formatOptions } from "sap/fe/macros/filter/FilterFieldHelper";
import type { FilterConditions } from "sap/fe/macros/filterBar/FilterHelper";
import { getFiltersConditionsFromSelectionVariant } from "sap/fe/macros/filterBar/FilterHelper";
import type { ValueColor } from "sap/m/library";
import mLibrary from "sap/m/library";
import Library from "sap/ui/core/Lib";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import ConditionConverter from "sap/ui/mdc/condition/ConditionConverter";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import Filter from "sap/ui/model/Filter";
import type FilterOperator from "sap/ui/model/FilterOperator";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import ODataUtils from "sap/ui/model/odata/v4/ODataUtils";
import { getTextBinding } from "../field/FieldTemplating";
import type VisualFilter from "./VisualFilter";

type MeasureType = {
	value?: string;
	ISOCurrency?: PathAnnotationExpression<string>;
	Unit?: PathAnnotationExpression<string>;
};
export type InteractiveChartType = {
	chartLabel?: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
	aggregationBinding?: aggregationBinding;
	errorMessageTitleExpression?: string;
	errorMessageExpression?: string;
	showErrorExpression?: string;
	inParameters?: ParameterType[];
	displayedValue?: string;
	measure?: string;
	stringifiedParameters?: string[];
	inParameterFilters?: string;
	color?: string;
	uom?: string | PropertyAnnotationValue<unknown> | Record<string, unknown>;
	scalefactor?: number | object;
	selectionVariant?: SelectionVariant;
};

type aggregationBinding = {
	path: string;
	templateShareable: boolean;
	suspended: boolean;
	filters: Filter[];
	parameters: {
		$$aggregation: {
			aggregate: { [x: string]: {} | { unit: string } | { name: string; with: string } | undefined };
			group: { [x: string]: { additionally: string[] } | { additionally: undefined } };
		};
		$orderby: string | undefined;
	};
};

const InteractiveChartHelper = {
	getChartDisplayedValue: function (value: string, valueFormat?: NumberFormatType, metaPath?: string): string {
		const infoPath = generate([metaPath]);
		return (
			"{parts:[{path:'" +
			value +
			"',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}" +
			(valueFormat && valueFormat.ScaleFactor
				? ",{value:'" + valueFormat.ScaleFactor.valueOf() + "'}"
				: ",{path:'internal>scalefactorNumber/" + infoPath + "'}") +
			(valueFormat && valueFormat.NumberOfFractionalDigits
				? ",{value:'" + valueFormat.NumberOfFractionalDigits + "'}"
				: ",{value:'0'}") +
			",{path:'internal>currency/" +
			infoPath +
			"'}" +
			",{path:'" +
			value +
			"',type:'sap.ui.model.odata.type.String', constraints:{'nullable':false}}" +
			"], formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.scaleVisualFilterValue'}"
		); //+ sType.split('#').length ? sType.split('#')[1] : 'Decimal' + "}";
	},
	getChartValue: function (value: string): string {
		return "{path:'" + value + "',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}";
	},
	_getCollectionName: function (
		collection: DataModelObjectPath<PageContextPathTarget> | undefined,
		contextPath: string,
		parameters?: Array<string>
	): string {
		const collectionObject = collection?.targetObject;
		if (isNavigationProperty(collectionObject)) {
			return parameters ? contextPath : collectionObject.name;
		} else if (isEntitySet(collectionObject)) {
			return "/" + collectionObject.name;
		} else {
			return collectionObject!.name;
		}
	},
	_getBindingPathForParameters: function (
		filterConditions: Record<string, FilterConditions[]>,
		metaModel: ODataMetaModel | undefined,
		collectionName: string,
		parameters: Array<string>,
		entitySetPath: string
	): string {
		const params = [];
		const convertedFilterConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
		const parameterProperties = CommonUtils.getParameterInfo(
			metaModel as unknown as ODataMetaModel,
			collectionName
		).parameterProperties;
		if (parameterProperties) {
			for (const i in parameters) {
				const parameter = parameters[i];
				const property = parameterProperties[parameter];
				const entityPath = entitySetPath.split("/")[1];
				const propertyContext = metaModel?.createBindingContext(`/${entityPath}/${parameter}`);
				let typeConfig;
				if (propertyContext) {
					typeConfig = TypeMap.getTypeConfig(
						property.$Type,
						JSTokenizer.parseJS(formatOptions(property, { context: propertyContext }) || "{}"),
						JSTokenizer.parseJS(constraints(property, { context: propertyContext }) || "{}")
					);
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
	_getUOMAggregationExpression: function (
		customAggregate?: boolean,
		UoMHasCustomAggregate?: boolean,
		UOM?: PropertyAnnotationValue<unknown> | string | Record<string, unknown>,
		aggregation?: AggregatedPropertyType
	): {
		aggregationExpression: { unit: string } | {} | { name: string; with: string } | undefined;
		UOMExpression: { [x: string]: {} } | undefined | string;
	} {
		let aggregationExpression, UOMExpression;
		const path = UOM && isPathAnnotationExpression(UOM) && UOM.path;
		if (customAggregate) {
			//custom aggregate for a currency or unit of measure corresponding to this aggregatable property
			if (UoMHasCustomAggregate) {
				aggregationExpression = path ? { unit: path } : {};
				UOMExpression = {};
			} else {
				aggregationExpression = {};
				UOMExpression = path ? { [path]: {} } : {};
			}
		} else if (
			aggregation &&
			aggregation.AggregatableProperty &&
			aggregation.AggregatableProperty.value &&
			aggregation.AggregationMethod
		) {
			aggregationExpression = { name: aggregation.AggregatableProperty.value, with: aggregation.AggregationMethod };
			UOMExpression = path ? { [path]: {} } : {};
		}

		return {
			aggregationExpression: aggregationExpression,
			UOMExpression: UOMExpression
		};
	},
	getAggregationBinding: function (
		chartAnnotations: Chart,
		collection: DataModelObjectPath<PageContextPathTarget> | undefined,
		contextPath: string,
		textAssociation?: PathAnnotationExpression<string>,
		dimensionType?: string,
		sortOrder?: SortOrderType[],
		selectionVariant?: SelectionVariant,
		customAggregate?: boolean,
		aggregation?: AggregatedPropertyType,
		UoMHasCustomAggregate?: boolean,
		parameters?: Array<string>,
		filterBarEntityType?: string,
		draftSupported?: boolean,
		chartMeasure?: string,
		metaModel?: ODataMetaModel
	): aggregationBinding {
		const selectionVariantAnnotation = selectionVariant;
		const entityType = filterBarEntityType;
		const entitySetPath = contextPath;
		const dimension = chartAnnotations.Dimensions[0].value;
		const filters: Filter[] = [];
		let filterConditions;
		let collectionName = this._getCollectionName(collection, contextPath, parameters);
		const UOM: PropertyAnnotationValue<unknown> | string | undefined | Record<string, unknown> = InteractiveChartHelper.getUoM(
			chartAnnotations,
			collection,
			undefined,
			customAggregate,
			aggregation
		);
		if (draftSupported) {
			filters.push(new Filter({ operator: "EQ", value1: "true", value2: null, path: "IsActiveEntity" }));
		}
		if (selectionVariantAnnotation) {
			filterConditions = getFiltersConditionsFromSelectionVariant(
				entitySetPath,
				metaModel as unknown as ODataMetaModel,
				selectionVariantAnnotation,
				VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils)
			);
			for (const path in filterConditions) {
				const conditions = filterConditions[path];
				conditions.forEach(function (condition: FilterConditions) {
					if (!condition.isParameter) {
						filters.push(
							new Filter({
								operator: condition.operator as FilterOperator,
								value1: condition.value1,
								value2: condition.value2,
								path: condition.path
							})
						);
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
		const textAssociationExpression = textAssociation ? { additionally: [textAssociation.path] } : {};
		const finalparameters = {
			...this.getSortOrder(chartAnnotations, dimensionType, sortOrder, chartMeasure),
			$$aggregation: {
				aggregate: {
					[chartMeasure as string]: aggregationExpression
				},
				group: {
					[dimension]: { ...textAssociationExpression },
					...(UOMExpression as object)
				}
			}
		};
		return {
			path: collectionName,
			templateShareable: true,
			suspended: true,
			filters: filters,
			parameters: finalparameters,
			...(InteractiveChartHelper.getMaxItems(chartAnnotations) as object)
		};
	},

	_getOrderExpressionFromMeasure: function (sortOrder?: SortOrderType[], chartMeasure?: string): { $orderby: string } {
		let sortPropertyName;
		if (sortOrder && sortOrder.length) {
			if (sortOrder[0].DynamicProperty) {
				sortPropertyName = (sortOrder[0].DynamicProperty.$target as AggregatedProperty)?.Name;
			} else {
				sortPropertyName = sortOrder[0].Property?.value;
			}
			if (sortPropertyName === chartMeasure) {
				return { $orderby: chartMeasure + (sortOrder[0].Descending ? " desc" : "") };
			}
			return { $orderby: chartMeasure + " desc" };
		}
		return { $orderby: chartMeasure + " desc" };
	},

	getSortOrder: function (
		chartAnnotations: Chart,
		dimensionType?: string,
		sortOrder?: SortOrderType[],
		chartMeasure?: string
	): { $orderby: string | undefined } {
		if (chartAnnotations.ChartType === "UI.ChartType/Donut" || chartAnnotations.ChartType === "UI.ChartType/Bar") {
			return this._getOrderExpressionFromMeasure(sortOrder, chartMeasure);
		} else if (dimensionType === "Edm.Date" || dimensionType === "Edm.Time" || dimensionType === "Edm.DateTimeOffset") {
			return { $orderby: chartAnnotations.Dimensions[0].value };
		} else if (
			sortOrder &&
			sortOrder.length &&
			(sortOrder[0].Property?.$target as unknown as PathAnnotationExpression<string>)?.path === chartAnnotations.Dimensions[0].value
		) {
			return { $orderby: sortOrder[0].Property?.$target?.name + (sortOrder[0].Descending ? "desc'" : "'") };
		} else {
			return { $orderby: chartAnnotations.Dimensions[0].$target?.name };
		}
	},

	getMaxItems: function (chartAnnotations: Chart): string | { startIndex: number; length: number } {
		if (chartAnnotations.ChartType === "UI.ChartType/Bar") {
			return { startIndex: 0, length: 3 };
		} else if (chartAnnotations.ChartType === "UI.ChartType/Line") {
			return { startIndex: 0, length: 6 };
		} else {
			return "";
		}
	},

	getColorBinding: function (dataPoint: DataPoint, dimension: PropertyPath): string | undefined {
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
			return CommonHelper.getCriticalityCalculationBinding(
				oDirection,
				oDataPointValue,
				oDeviationRangeLowValue,
				oToleranceRangeLowValue,
				oAcceptanceRangeLowValue,
				oAcceptanceRangeHighValue,
				oToleranceRangeHighValue,
				oDeviationRangeHighValue
			);
		} else if (valueCriticality && valueCriticality.length) {
			return InteractiveChartHelper.getValueCriticality(dimension.value, valueCriticality);
		} else {
			return undefined;
		}
	},
	getValueCriticality: function (dimension: string, valueCriticality: Array<ValueCriticalityType>): string | undefined {
		let result;
		const values: string[] = [];
		if (valueCriticality && valueCriticality.length > 0) {
			valueCriticality.forEach(function (valueCriticalityType: ValueCriticalityType) {
				if (valueCriticalityType.Value && valueCriticalityType.Criticality) {
					const value =
						"${" +
						dimension +
						"} === '" +
						valueCriticalityType.Value +
						"' ? '" +
						InteractiveChartHelper._getCriticalityFromEnum(valueCriticalityType.Criticality) +
						"'";
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
	_getCriticalityFromEnum: function (criticality: string): ValueColor {
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
	getScaleUoMTitle: function (
		chartAnnotation?: Chart,
		collection?: DataModelObjectPath<PageContextPathTarget>,
		metaPath?: string,
		customAggregate?: boolean,
		aggregation?: AggregatedPropertyType,
		seperator?: string,
		toolTip?: boolean
	): string {
		const scaleFactor = chartAnnotation?.MeasureAttributes
			? chartAnnotation.MeasureAttributes[0]?.DataPoint?.$target?.ValueFormat?.ScaleFactor?.valueOf()
			: undefined;
		const infoPath = generate([metaPath]);
		const fixedInteger = NumberFormat.getIntegerInstance({
			style: "short",
			showScale: false,
			shortRefNumber: scaleFactor as number
		});
		let scale = fixedInteger.getScale();
		let UOM = InteractiveChartHelper.getUoM(chartAnnotation, collection, undefined, customAggregate, aggregation);
		UOM = UOM && ((UOM as PathAnnotationExpression<string>).path ? "${internal>uom/" + infoPath + "}" : "'" + UOM + "'");
		scale = scale ? "'" + scale + "'" : "${internal>scalefactor/" + infoPath + "}";
		if (!seperator) {
			seperator = "|";
		}
		seperator = "' " + seperator + " ' + ";
		const expression = scale && UOM ? seperator + scale + " + ' ' + " + UOM : seperator + (scale || UOM);
		return toolTip ? expression : "{= " + expression + "}";
	},
	getMeasureDimensionTitle: function (chartAnnotation?: Chart, customAggregate?: boolean, aggregation?: AggregatedPropertyType): string {
		let measureLabel;
		let measurePath;
		if (customAggregate) {
			measurePath = chartAnnotation?.Measures[0]?.$target?.name;
		}
		if (chartAnnotation?.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
			measurePath = (chartAnnotation.DynamicMeasures[0]?.$target as AggregatedPropertyType)?.AggregatableProperty?.value;
		} else if (!customAggregate && chartAnnotation?.Measures && chartAnnotation?.Measures.length > 0) {
			measurePath = chartAnnotation.Measures[0]?.$target?.name;
		}
		const dimensionPath = chartAnnotation?.Dimensions[0]?.value as unknown as Label;
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
		return Library.getResourceBundleFor("sap.fe.macros")!.getText("M_INTERACTIVE_CHART_HELPER_VISUALFILTER_MEASURE_DIMENSION_TITLE", [
			measureLabel,
			dimensionLabel
		]);
	},

	getToolTip: function (
		chartAnnotation?: Chart,
		collection?: DataModelObjectPath<PageContextPathTarget>,
		metaPath?: string,
		customAggregate?: boolean,
		aggregation?: AggregatedPropertyType,
		renderLineChart?: boolean | string
	): string {
		const chartType = chartAnnotation && chartAnnotation["ChartType"];
		let measureDimensionToolTip = InteractiveChartHelper.getMeasureDimensionTitle(chartAnnotation, customAggregate, aggregation);
		measureDimensionToolTip = CommonHelper.escapeSingleQuotes(measureDimensionToolTip);
		if (renderLineChart === false && chartType === "UI.ChartType/Line") {
			return `{= '${measureDimensionToolTip}'}`;
		}

		const seperator = Library.getResourceBundleFor("sap.fe.macros")?.getText(
			"M_INTERACTIVE_CHART_HELPER_VISUALFILTER_TOOLTIP_SEPERATOR"
		);
		const infoPath = generate([metaPath]);
		const scaleUOMTooltip = InteractiveChartHelper.getScaleUoMTitle(
			chartAnnotation,
			collection,
			infoPath,
			customAggregate,
			aggregation,
			seperator,
			true
		);
		return "{= '" + measureDimensionToolTip + (scaleUOMTooltip ? "' + " + scaleUOMTooltip : "'") + "}";
	},
	_getUOM: function (
		UOMObjectPath?: PropertyAnnotationValue<unknown>,
		UOM?: "ISOCurrency" | "Unit",
		collection?: DataModelObjectPath<PageContextPathTarget>,
		customData?: boolean,
		aggregatablePropertyPath?: string
	): string | PathAnnotationExpression<unknown> | Record<string, unknown> | undefined {
		const UOMObject: Record<string, unknown> = {};
		const collectionObject = collection?.targetObject;
		if (UOMObjectPath && UOM && isPathAnnotationExpression(UOMObjectPath)) {
			// check if the UOM is part of Measure annotations(Custom aggregates)
			UOMObject[UOM] = { $Path: UOMObjectPath.path };
			return customData && UOMObjectPath.path ? UOMObject : UOMObjectPath;
		} else if (aggregatablePropertyPath) {
			// check if the UOM is part of base property annotations(Transformation aggregates)
			const entityProperties =
				isEntitySet(collectionObject) || isSingleton(collectionObject)
					? collectionObject.entityType.entityProperties
					: collectionObject?.targetType?.entityProperties;
			const propertyAnnotations = entityProperties?.find((property: Property) => property.name == aggregatablePropertyPath);
			if (propertyAnnotations?.annotations?.Measures && UOM) {
				UOMObjectPath = propertyAnnotations?.annotations?.Measures[UOM] as PathAnnotationExpression<unknown>;
				UOMObject[UOM] = { $Path: UOMObjectPath?.path };
			}
			return UOMObjectPath && customData && isPathAnnotationExpression(UOMObjectPath) && UOMObjectPath.path
				? UOMObject
				: UOMObjectPath;
		}
	},
	getUoM: function (
		chartAnnotation?: Chart,
		collection?: DataModelObjectPath<PageContextPathTarget>,
		customData?: boolean,
		customAggregate?: boolean,
		aggregation?: AggregatedPropertyType
	): string | PropertyAnnotationValue<unknown> | Record<string, unknown> | undefined {
		let measure: MeasureType = {};
		if (customAggregate) {
			measure = chartAnnotation?.Measures[0] as MeasureType;
		}
		if (chartAnnotation?.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
			measure = (chartAnnotation.DynamicMeasures[0]?.$target as AggregatedPropertyType)?.AggregatableProperty?.$target?.annotations
				?.Measures as MeasureType;
		} else if (!customAggregate && chartAnnotation?.Measures && chartAnnotation.Measures.length > 0) {
			measure = chartAnnotation.Measures[0];
		}
		const ISOCurrency = measure?.ISOCurrency;
		const unit = measure?.Unit;
		let aggregatablePropertyPath: string | undefined;
		if (!customAggregate && aggregation) {
			aggregatablePropertyPath = aggregation.AggregatableProperty && aggregation.AggregatableProperty.value;
		} else {
			aggregatablePropertyPath = measure?.value;
		}
		return (
			this._getUOM(ISOCurrency, "ISOCurrency", collection, customData, aggregatablePropertyPath) ||
			this._getUOM(unit, "Unit", collection, customData, aggregatablePropertyPath)
		);
	},
	getScaleFactor: function (valueFormat?: NumberFormatType): number | undefined {
		if (valueFormat && valueFormat.ScaleFactor) {
			return valueFormat.ScaleFactor.valueOf();
		}
		return undefined;
	},
	getUoMVisiblity: function (chartAnnotation?: Chart, showError?: boolean): boolean {
		const chartType = chartAnnotation && chartAnnotation["ChartType"];
		if (showError) {
			return false;
		} else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
			return false;
		} else {
			return true;
		}
	},
	getInParameterFiltersBinding: function (inParameters: Array<ParameterType>): string | undefined {
		if (inParameters.length > 0) {
			const parts: string[] = [];
			let paths = "";
			inParameters.forEach(function (inParameter: ParameterType) {
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

	getfilterCountBinding: function (chartAnnotation?: Chart): string {
		const dimension = chartAnnotation?.Dimensions[0]?.$target?.name;
		return (
			"{path:'$filters>/conditions/" + dimension + "', formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.getFilterCounts'}"
		);
	},

	getInteractiveChartProperties: function (visualFilter: VisualFilter): InteractiveChartType {
		const chartAnnotation = visualFilter.chartAnnotation;
		const interactiveChartProperties: InteractiveChartType = {};
		if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
			const id = generate([visualFilter.metaPath]);
			interactiveChartProperties.showErrorExpression = "{= ${internal>" + id + "/showError}}";
			interactiveChartProperties.errorMessageExpression = "{= ${internal>" + id + "/errorMessage}}";
			interactiveChartProperties.errorMessageTitleExpression = "{= ${internal>" + id + "/errorMessageTitle}}";
			let dataPointAnnotation;
			if (chartAnnotation?.MeasureAttributes && chartAnnotation?.MeasureAttributes[0]) {
				dataPointAnnotation = chartAnnotation?.MeasureAttributes[0]?.DataPoint
					? chartAnnotation?.MeasureAttributes[0].DataPoint.$target
					: chartAnnotation?.MeasureAttributes[0];
			}
			const dimension = chartAnnotation?.Dimensions[0];
			const parameters = CommonHelper.getParameters(visualFilter.contextPath, visualFilter.getMetaModel());
			const dimensionText = dimension?.$target?.annotations?.Common?.Text as unknown as PathAnnotationExpression<string>;
			interactiveChartProperties.aggregationBinding = InteractiveChartHelper.getAggregationBinding(
				chartAnnotation,
				visualFilter.collection,
				visualFilter.contextPath,
				dimensionText,
				dimension.$target?.type,
				visualFilter?.sortOrder,
				visualFilter.selectionVariant,
				visualFilter.customAggregate,
				visualFilter.aggregateProperties,
				visualFilter.UoMHasCustomAggregate,
				parameters,
				visualFilter.filterBarEntityType,
				visualFilter.draftSupported,
				visualFilter.chartMeasure,
				visualFilter.getMetaModel()
			);
			interactiveChartProperties.scalefactor = InteractiveChartHelper.getScaleFactor((dataPointAnnotation as DataPoint)?.ValueFormat);
			interactiveChartProperties.uom = InteractiveChartHelper.getUoM(
				chartAnnotation,
				visualFilter.collection,
				true,
				visualFilter.customAggregate,
				visualFilter.aggregateProperties
			);
			interactiveChartProperties.inParameters = visualFilter.inParameters;
			const inParameters = CommonHelper.parseCustomData(visualFilter.inParameters as unknown as string);
			interactiveChartProperties.inParameterFilters = visualFilter.inParameters
				? InteractiveChartHelper.getInParameterFiltersBinding(inParameters as Array<ParameterType>)
				: undefined;
			interactiveChartProperties.selectionVariant = visualFilter.selectionVariant ? visualFilter.selectionVariant : undefined;
			interactiveChartProperties.stringifiedParameters = parameters;
			const dimensionContext = visualFilter
				.getMetaModel()
				?.createBindingContext(visualFilter.contextPath + "/@" + dimension.fullyQualifiedName.split("@")[1]);
			if (dimensionContext) {
				const dimensionObject = visualFilter.getDataModelObjectForMetaPath<Property>(
					dimensionContext.getPath(),
					visualFilter.contextPath
				);
				interactiveChartProperties.chartLabel = getTextBinding(dimensionObject as DataModelObjectPath<Property>, {});
			}
			interactiveChartProperties.measure = InteractiveChartHelper.getChartValue(visualFilter.chartMeasure);
			interactiveChartProperties.displayedValue = InteractiveChartHelper.getChartDisplayedValue(
				visualFilter.chartMeasure,
				(dataPointAnnotation as DataPoint)?.ValueFormat,
				visualFilter.metaPath
			);
			interactiveChartProperties.color = InteractiveChartHelper.getColorBinding(dataPointAnnotation as DataPoint, dimension);
		}
		return interactiveChartProperties;
	}
};

export default InteractiveChartHelper;

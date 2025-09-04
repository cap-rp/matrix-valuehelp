import type {
	Property as DataModelProperty,
	EntitySet,
	NavigationProperty,
	PathAnnotationExpression,
	PrimitiveType,
	PropertyAnnotationValue,
	PropertyPath
} from "@sap-ux/vocabularies-types/Edm";
import type { Measure } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import type { SortOrderType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import { MeasuresAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Measures";
import type { PropertyAnnotations_Measures } from "@sap-ux/vocabularies-types/vocabularies/Measures_Edm";
import type {
	Chart,
	ChartMeasureAttributeTypeTypes,
	CriticalityCalculationType,
	DataPoint,
	DataPointType,
	PresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { ChartType, UIAnnotationTerms, VisualizationType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	constant,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	pathInModel
} from "sap/fe/base/BindingToolkit";
import type { MetaModelEntityTypeAnnotations, MetaModelPropertyAnnotations } from "sap/fe/core/converters/MetaModelConverter";
import { enhanceDataModelPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { ComputedAnnotationInterface } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import { ValueColor } from "sap/m/library";
import type { $AreaMicroChartSettings } from "sap/suite/ui/microchart/AreaMicroChart";
import type { $BulletMicroChartSettings } from "sap/suite/ui/microchart/BulletMicroChart";
import type { $HarveyBallMicroChartSettings } from "sap/suite/ui/microchart/HarveyBallMicroChart";
import type { $StackedBarMicroChartSettings } from "sap/suite/ui/microchart/StackedBarMicroChart";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import type { MetaModelNavProperty, MetaModelType } from "types/metamodel_types";
import type MicroChart from "../MicroChart";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { $ColumnMicroChartSettings } from "sap/suite/ui/microchart/ColumnMicroChart";
import type { $ComparisonMicroChartSettings } from "sap/suite/ui/microchart/ComparisonMicroChart";
import type Context from "sap/ui/model/odata/v4/Context";
import { getValueBinding } from "../field/FieldTemplating";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { PropertyAnnotations } from "@sap-ux/vocabularies-types/vocabularies/Edm_Types";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { buildExpressionForCriticalityColorMicroChart } from "sap/fe/core/templating/CriticalityFormatters";
import type { $LineMicroChartSettings } from "sap/suite/ui/microchart/LineMicroChart";
import type { $RadialMicroChartSettings } from "sap/suite/ui/microchart/RadialMicroChart";
import type { AggregationBindingInfo } from "sap/ui/base/ManagedObject";

type Property = {
	$kind?: string;
	$Type?: string;
	$Name?: string;
	$Nullable?: boolean;
	$MaxLength?: number;
	$Precision?: number;
	$Scale?: number | string;
};

export type ParameterType = {
	$$groupId?: string;
	$select?: string[];
	$orderby?: string[];
};

export type MicroChartAggregation =
	| Pick<$BulletMicroChartSettings, "actual" | "thresholds">
	| Pick<$HarveyBallMicroChartSettings, "items">
	| Pick<$StackedBarMicroChartSettings, "bars">
	| Pick<
			$AreaMicroChartSettings,
			| "chart"
			| "target"
			| "firstXLabel"
			| "firstYLabel"
			| "lastXLabel"
			| "lastYLabel"
			| "minThreshold"
			| "maxThreshold"
			| "innerMinThreshold"
			| "innerMaxThreshold"
	  >
	| Pick<$ColumnMicroChartSettings, "columns" | "leftBottomLabel" | "rightBottomLabel" | "leftTopLabel" | "rightTopLabel">
	| Pick<$ComparisonMicroChartSettings, "data">
	| Pick<$LineMicroChartSettings, "lines">;

export type MicroChartSettings =
	| $BulletMicroChartSettings
	| $HarveyBallMicroChartSettings
	| $StackedBarMicroChartSettings
	| $ComparisonMicroChartSettings
	| $AreaMicroChartSettings
	| $ColumnMicroChartSettings
	| $RadialMicroChartSettings;

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
	getThresholdColor: function (value: string, iContext: ComputedAnnotationInterface): ValueColor {
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
	getMeasurePropertyPaths: function (
		chartAnnotations: MetaModelType<Chart> | Chart,
		entityTypeAnnotations: MetaModelEntityTypeAnnotations | undefined,
		chartType: string,
		isRunTimeInstance?: boolean
	): string | string[] | undefined {
		const propertyPath: string[] = [];

		if (!entityTypeAnnotations) {
			Log.warning("FE:Macro:MicroChart : Couldn't find annotations for the DataPoint.");
			return undefined;
		}

		for (const measureIndex in chartAnnotations.Measures) {
			const iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(
					measureIndex as unknown as number,
					chartAnnotations,
					isRunTimeInstance
				),
				measureAttribute =
					iMeasureAttribute > -1 && chartAnnotations.MeasureAttributes && chartAnnotations.MeasureAttributes[iMeasureAttribute];
			let dataPoint;
			if (isRunTimeInstance) {
				dataPoint = (measureAttribute && (measureAttribute as ChartMeasureAttributeTypeTypes)?.DataPoint?.$target) || undefined;
			} else {
				dataPoint = (measureAttribute &&
					entityTypeAnnotations &&
					entityTypeAnnotations[
						(
							measureAttribute.DataPoint as {
								$AnnotationPath: string;
							}
						)?.$AnnotationPath as keyof MetaModelEntityTypeAnnotations
					]) as MetaModelType<DataPointType> | undefined;
			}

			const path = isRunTimeInstance ? dataPoint?.Value.path : dataPoint?.Value.$Path;
			if (path) {
				propertyPath.push(path);
			} else {
				Log.warning(
					`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute ${chartType} MicroChart.`
				);
			}
		}

		return isRunTimeInstance ? propertyPath : propertyPath.join(",");
	},

	/**
	 * This function returns the visible expression path.
	 * @param args
	 * @returns Expression Binding for the visible.
	 */
	getHiddenPathExpression: function (...args: unknown[]): string | boolean {
		if (!args[0] && !args[1]) {
			return true;
		}
		if (args[0] === true || args[1] === true) {
			return false;
		}

		const hiddenPaths: string[] = [];
		[].forEach.call(args, function (hiddenProperty: unknown) {
			if (hiddenProperty && (hiddenProperty as { $Path: string }).$Path) {
				hiddenPaths.push("%{" + (hiddenProperty as { $Path: string }).$Path + "}");
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
	isNotAlwaysHidden: function (
		chartType: string,
		value: { $Path: string },
		maxValue: { $Path: string } | undefined,
		valueHidden?: boolean | { $Path: string },
		maxValueHidden?: boolean | { $Path: string }
	): boolean {
		if (valueHidden === true) {
			this.logError(chartType, value);
		}
		if (maxValueHidden === true) {
			this.logError(chartType, maxValue);
		}
		if (valueHidden === undefined && maxValueHidden === undefined) {
			return true;
		} else {
			return ((!valueHidden || (valueHidden as { $Path: string }).$Path) && valueHidden !== undefined) ||
				((!maxValueHidden || (maxValueHidden as { $Path: string }).$Path) && maxValueHidden !== undefined)
				? true
				: false;
		}
	},

	/**
	 * This function is to log errors for missing data point properties.
	 * @param chartType The chart type.
	 * @param value Dynamic hidden property name.
	 * @param value.$Path Dynamic hidden property name.
	 */
	logError: function (chartType: string, value?: { $Path: string }): void {
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
	formatDecimal: function (path: string, property: Property, fractionDigits: number | undefined, value?: number): string | undefined {
		if (path) {
			const constraints = [],
				formatOptions = ["style: 'short'"];
			const scale = typeof fractionDigits === "number" ? fractionDigits : (property && property?.$Scale) || 1;

			if (property.$Nullable != undefined) {
				constraints.push("nullable: " + property.$Nullable);
			}
			if (property.$Precision != undefined) {
				formatOptions.push("precision: " + (property.$Precision ? property.$Precision : "1"));
			}
			constraints.push("scale: " + (scale === "variable" ? "'" + scale + "'" : scale));

			return (
				"{ path: '" +
				path +
				"'" +
				", type: 'sap.ui.model.odata.type.Decimal', constraints: { " +
				constraints.join(",") +
				" }, formatOptions: { " +
				formatOptions.join(",") +
				" } }"
			);
		} else if (value) {
			const decimals = typeof fractionDigits === "number" ? fractionDigits : 1;
			return NumberFormat.getFloatInstance({ style: "short", preserveDecimals: true, decimals: decimals }).format(value);
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
	getSelectParameters: function (
		groupId: string,
		sortOrder?: SortOrderType[],
		criticalityCalculation?: CriticalityCalculationType,
		criticality?: string,
		otherPaths?: string[],
		returnObject?: boolean
	): string | ParameterType {
		const propertyPath: string[] = [],
			sorters: string[] = [];
		const parameters: string[] | ParameterType = returnObject ? {} : [];

		if (sortOrder) {
			sortOrder.forEach((sorter: SortOrderType) => {
				sorters.push(`${sorter.Property}${sorter.Descending ? " desc" : ""}`);
			});
		}

		if (criticality) {
			propertyPath.push(criticality);
		} else if (criticalityCalculation) {
			const cricticalityCalculationKeys = [
				"ImprovementDirection",
				"DeviationRangeLowValue",
				"ToleranceRangeLowValue",
				"AcceptanceRangeLowValue",
				"AcceptanceRangeHighValue",
				"ToleranceRangeHighValue",
				"DeviationRangeHighValue"
			];
			Object.keys(criticalityCalculation).forEach((key: string) => {
				if (
					cricticalityCalculationKeys.includes(key) &&
					((criticalityCalculation as unknown as Record<string, string>)[key] as unknown as PathAnnotationExpression<string>).path
				) {
					propertyPath.push(
						((criticalityCalculation as unknown as Record<string, string>)[key] as unknown as PathAnnotationExpression<string>)
							.path
					);
				}
			});
		}

		otherPaths?.forEach((path) => {
			if (path) {
				propertyPath.push(path);
			}
		});

		if (returnObject) {
			if (groupId) {
				(parameters as ParameterType).$$groupId = groupId;
			}
			if (propertyPath.length) {
				(parameters as ParameterType).$select = propertyPath;
			}
			if (sorters.length) {
				(parameters as ParameterType).$orderby = sorters;
			}
			return parameters as ParameterType;
		} else {
			if (groupId) {
				(parameters as string[]).push(`$$groupId : '${groupId}'`);
			}
			if (propertyPath.length) {
				(parameters as string[]).push(`$select : '${propertyPath.join(",")}'`);
			}
			if (sorters.length) {
				(parameters as string[]).push(`$orderby : '${sorters.join(",")}'`);
			}
			return (parameters as string[]).join(",");
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
	getDataPointQualifiersForMeasures: function (
		chartAnnotations: MetaModelType<Chart> | Chart,
		entityTypeAnnotations: MetaModelEntityTypeAnnotations | undefined,
		chartType: string,
		isMicroChartRunTime?: boolean
	): string[] | string {
		const qualifiers: string[] = [],
			measureAttributes = chartAnnotations.MeasureAttributes,
			fnAddDataPointQualifier = function (chartMeasure: { $PropertyPath: string } | PropertyPath): void {
				let qualifier: string | undefined;
				if (entityTypeAnnotations) {
					measureAttributes?.forEach(function (
						measureAttribute: MetaModelType<ChartMeasureAttributeTypeTypes> | ChartMeasureAttributeTypeTypes
					) {
						let path, measure;
						if (isMicroChartRunTime) {
							path = (measureAttribute as ChartMeasureAttributeTypeTypes).Measure?.value;
							measure = (chartMeasure as PropertyPath).value;
							if (path == measure) {
								qualifiers.push(
									(measureAttribute as ChartMeasureAttributeTypeTypes)?.DataPoint?.$target?.qualifier as string
								);
							}
						} else {
							path = (measureAttribute as MetaModelType<ChartMeasureAttributeTypeTypes>).Measure?.$PropertyPath;
							measure = (chartMeasure as { $PropertyPath: string }).$PropertyPath;
							if (
								path === measure &&
								(measureAttribute as MetaModelType<ChartMeasureAttributeTypeTypes>).DataPoint?.$AnnotationPath
							) {
								const annotationPath = (measureAttribute as MetaModelType<ChartMeasureAttributeTypeTypes>)?.DataPoint
									?.$AnnotationPath;
								if (entityTypeAnnotations[annotationPath as keyof MetaModelEntityTypeAnnotations]) {
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
					Log.warning(
						`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute for ${chartType} MicroChart.`
					);
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
	logWarning: function (chartType: string, error: object): void {
		for (const key in error) {
			if (!error[key as keyof typeof error]) {
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
	getDisplayValueForMicroChart: function (
		dataPoint: MetaModelType<DataPointType>,
		pathText: { $Path: string } | undefined,
		valueTextPath: object,
		valueDataPointPath: object
	): string | undefined {
		const valueFormat = dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits;
		if (pathText) {
			return MicroChartHelper.formatDecimal(pathText["$Path"], valueTextPath as Property, valueFormat);
		}
		return MicroChartHelper.formatDecimal(dataPoint.Value["$Path"], valueDataPointPath as Property, valueFormat);
	},
	shouldRenderMicroChart: function (chartAnnotation: Chart): boolean {
		const availableChartTypes = [ChartType.Area, ChartType.Column, ChartType.Bar],
			chartType = chartAnnotation.ChartType,
			dataPoint = chartAnnotation.MeasureAttributes[0].DataPoint?.$target,
			dataPointValue = dataPoint?.Value,
			dataPointValueHiddenPath = dataPointValue?.annotations?.UI?.Hidden,
			chartAnnotationDimension = chartAnnotation?.Dimensions && chartAnnotation?.Dimensions[0],
			finalDataPointValue = availableChartTypes.includes(chartType) ? dataPointValue && chartAnnotationDimension : dataPointValue; // only for three charts in array
		if (chartType === ChartType.Pie) {
			const dataPointMaximumValue = dataPoint && (dataPoint.MaximumValue as PrimitiveType);
			const dataPointMaximumValueHiddenPath = dataPointMaximumValue?.annotations?.UI?.Hidden;
			return (
				dataPointValue &&
				dataPointMaximumValue &&
				MicroChartHelper.isNotAlwaysHidden(
					chartType,
					dataPointValue,
					dataPointMaximumValue,
					dataPointValueHiddenPath,
					dataPointMaximumValueHiddenPath
				)
			);
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
	shouldMicroChartRender: function (
		chartType: string,
		dataPoint: DataPointType,
		dataPointValueHidden: Record<string, boolean>,
		targetAnnotations: Chart,
		dataPointMaxValue: Record<string, boolean>
	): boolean {
		const availableChartTypes = ["Area", "Column", "Comparison"],
			dataPointValue = dataPoint && dataPoint.Value,
			hiddenPath = dataPointValueHidden && dataPointValueHidden[UIAnnotationTerms.Hidden],
			chartAnnotationDimension = targetAnnotations && targetAnnotations.Dimensions && targetAnnotations.Dimensions[0],
			finalDataPointValue = availableChartTypes.includes(chartType) ? dataPointValue && chartAnnotationDimension : dataPointValue; // only for three charts in array
		if (chartType === "Harvey") {
			const dataPointMaximumValue = dataPoint && dataPoint.MaximumValue,
				maxValueHiddenPath = dataPointMaxValue && dataPointMaxValue[UIAnnotationTerms.Hidden];
			return (
				dataPointValue &&
				dataPointMaximumValue &&
				MicroChartHelper.isNotAlwaysHidden(
					"Bullet",
					dataPointValue,
					dataPointMaximumValue as unknown as { $Path: string },
					hiddenPath,
					maxValueHiddenPath
				)
			);
		}
		return finalDataPointValue && MicroChartHelper.isNotAlwaysHidden(chartType, dataPointValue, undefined, hiddenPath);
	},

	/**
	 * This function is used to get dataPointQualifiers for Column, Comparison and StackedBar micro charts.
	 * @param annotationPath
	 * @returns Result string or undefined.
	 */
	getDataPointQualifiersForMicroChart: function (annotationPath: string): string | undefined {
		if (!annotationPath.includes(UIAnnotationTerms.DataPoint)) {
			return undefined;
		}
		return annotationPath.split("#")[1] ?? "";
	},

	/**
	 * This function is used to get colorPalette for comparison and HarveyBall Microcharts.
	 * @param dataPoint Data point object.
	 * @returns Result string for colorPalette or undefined.
	 */
	getColorPaletteForMicroChart: function (dataPoint: DataPointType): string | undefined {
		return dataPoint.Criticality
			? undefined
			: "sapUiChartPaletteQualitativeHue1, sapUiChartPaletteQualitativeHue2, sapUiChartPaletteQualitativeHue3,          sapUiChartPaletteQualitativeHue4, sapUiChartPaletteQualitativeHue5, sapUiChartPaletteQualitativeHue6, sapUiChartPaletteQualitativeHue7,          sapUiChartPaletteQualitativeHue8, sapUiChartPaletteQualitativeHue9, sapUiChartPaletteQualitativeHue10, sapUiChartPaletteQualitativeHue11";
	},

	/**
	 * This function is used to get MeasureScale for Area, Column and Line micro charts.
	 * @param dataPoint Data point object.
	 * @returns Data point value format fractional digits or data point scale or 1.
	 */
	getMeasureScaleForMicroChart: function (dataPoint: DataPointType): number {
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
	getBindingExpressionForMicrochart: function (
		chartType: string,
		measure: DataModelObjectPath<Measure>,
		microChart: MicroChart,
		collection: MetaModelNavProperty,
		uiName: string,
		dataPoint?: DataModelObjectPath<DataPointType>
	): string {
		const chartsWithBindingExpression = [ChartType.Bullet, ChartType.Pie, ChartType.Donut, "Radial", "Bullet", "Harvey"];
		if (!chartType || chartsWithBindingExpression.includes(chartType)) {
			const condition = collection["$isCollection"] || collection["$kind"] === "EntitySet";
			const path = condition ? "" : uiName;
			let currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(microChart.showOnlyChart as boolean, measure);
			let dataPointCriticallity = "";
			switch (chartType) {
				case "Radial":
				case ChartType.Donut:
					currencyOrUnit = "";
					break;
				case "Harvey":
				case ChartType.Pie:
					dataPointCriticallity = dataPoint?.targetObject?.Criticality
						? (dataPoint.targetObject?.Criticality as PathAnnotationExpression<string>)?.path
						: "";
					break;
			}
			const functionValue = MicroChartHelper.getSelectParameters(
				microChart.batchGroupId as string,
				undefined,
				undefined,
				dataPointCriticallity,
				[currencyOrUnit] as string[]
			);
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
	getUOMPathForMicrochart: function (
		showOnlyChart: boolean,
		measure?: DataModelObjectPath<Measure>,
		chartType?: string
	): string | undefined {
		const chartsWithUOMParts = [ChartType.Bullet, ChartType.Pie, ChartType.Area, ChartType.Column, ChartType.Line, ChartType.Bar];
		if (!chartType || (chartType && chartsWithUOMParts.includes(chartType as ChartType))) {
			return measure && !showOnlyChart
				? (
						(measure.targetObject?.annotations?.Measures as PropertyAnnotations_Measures)
							?.ISOCurrency as unknown as PathAnnotationExpression<string>
				  )?.path ||
						(
							(measure.targetObject?.annotations?.Measures as PropertyAnnotations_Measures)
								?.Unit as unknown as PathAnnotationExpression<string>
						)?.path ||
						""
				: "";
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
	getAggregationForMicrochart: function (
		aggregationType: string,
		collection: MetaModelNavProperty,
		dataPoint: DataModelObjectPath<DataPointType>,
		uiName: string,
		dimension: DataModelObjectPath<PropertyPath> | PropertyPath | undefined,
		measure: DataModelObjectPath<Measure>,
		sortOrder?: SortOrderType[],
		measureOrDimensionBar?: string,
		returnObject?: boolean
	): string | AggregationBindingInfo {
		let path = collection["$kind"] === "EntitySet" ? "/" : "";
		path = path + uiName;
		const groupId = "";
		let dataPointCriticallityCalc;
		let dataPointCriticallity = dataPoint.targetObject?.Criticality
			? (dataPoint.targetObject?.Criticality as PathAnnotationExpression<string>)?.path
			: "";
		const currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(false, measure);
		let targetValuePath = "";
		let dimensionPropertyPath = "";
		if ((dimension as DataModelObjectPath<PropertyPath>)?.targetObject) {
			dimension = (dimension as DataModelObjectPath<PropertyPath>).targetObject;
		}
		if ((dimension as PropertyPath)?.$target?.annotations?.Common?.Text) {
			dimensionPropertyPath = (
				(dimension as PropertyPath)?.$target?.annotations?.Common?.Text as unknown as PathAnnotationExpression<string>
			)?.path;
		} else if (dimension) {
			dimensionPropertyPath = (dimension as PropertyPath)?.value;
		}
		switch (aggregationType) {
			case "Points":
			case ChartType.Area:
				dataPointCriticallityCalc = dataPoint?.targetObject?.CriticalityCalculation;
				targetValuePath = dataPoint?.targetObject?.TargetValue?.path;
				dataPointCriticallity = "";
				break;
			case "Columns":
			case ChartType.Column:
				dataPointCriticallityCalc = dataPoint?.targetObject?.CriticalityCalculation;
				break;
			case "LinePoints":
			case ChartType.Line:
				dataPointCriticallity = "";
				break;
			case "Bars":
			case ChartType.BarStacked:
				dimensionPropertyPath = "";
				break;
		}
		const parameters = MicroChartHelper.getSelectParameters(
			groupId,
			sortOrder,
			dataPointCriticallityCalc,
			dataPointCriticallity,
			[currencyOrUnit as string, targetValuePath, dimensionPropertyPath, measureOrDimensionBar || ""],
			returnObject
		);
		if (returnObject) {
			return {
				path,
				parameters: parameters as ParameterType
			};
		}
		return `{path:'${path}'` + `, parameters : {${parameters}} }`;
	},

	getCurrencyOrUnit: function (measure: MetaModelPropertyAnnotations): string | undefined {
		if (measure[`@${MeasuresAnnotationTerms.ISOCurrency}`]) {
			return (
				(measure[`@${MeasuresAnnotationTerms.ISOCurrency}`] as { $Path: string }).$Path ||
				(measure[`@${MeasuresAnnotationTerms.ISOCurrency}`] as string)
			);
		}
		if (measure[`@${MeasuresAnnotationTerms.Unit}`]) {
			return (
				(measure[`@${MeasuresAnnotationTerms.Unit}`] as { $Path: string }).$Path ||
				(measure[`@${MeasuresAnnotationTerms.Unit}`] as string)
			);
		}
		return "";
	},

	getCalendarPattern: function (
		propertyType: string,
		annotations: Record<string, unknown> | PropertyAnnotations,
		isMicroChartRunTime?: boolean
	): string | undefined {
		if (isMicroChartRunTime) {
			return MicroChartHelper.checkPatternForRuntimeInstance(annotations, propertyType);
		} else {
			return MicroChartHelper.checkPatternForTemplateTimeInstance(annotations, propertyType);
		}
	},

	checkPatternForRuntimeInstance: function (annotations: PropertyAnnotations, propertyType: string): string | undefined {
		return ((annotations.Common?.IsCalendarYear && "yyyy") ||
			(annotations.Common?.IsCalendarQuarter && "Q") ||
			(annotations.Common?.IsCalendarMonth && "MM") ||
			(annotations.Common?.IsCalendarWeek && "ww") ||
			(annotations.Common?.IsCalendarDate && "yyyyMMdd") ||
			(annotations.Common?.IsCalendarYearMonth && "yyyyMM") ||
			(propertyType === "Edm.Date" && "yyyy-MM-dd") ||
			undefined) as string | undefined;
	},

	checkPatternForTemplateTimeInstance: function (annotations: Record<string, unknown>, propertyType: string): string | undefined {
		return ((annotations[`@${CommonAnnotationTerms.IsCalendarYear}`] && "yyyy") ||
			(annotations[`@${CommonAnnotationTerms.IsCalendarQuarter}`] && "Q") ||
			(annotations[`@${CommonAnnotationTerms.IsCalendarMonth}`] && "MM") ||
			(annotations[`@${CommonAnnotationTerms.IsCalendarWeek}`] && "ww") ||
			(annotations[`@${CommonAnnotationTerms.IsCalendarDate}`] && "yyyyMMdd") ||
			(annotations[`@${CommonAnnotationTerms.IsCalendarYearMonth}`] && "yyyyMM") ||
			(propertyType === "Edm.Date" && "yyyy-MM-dd") ||
			undefined) as string | undefined;
	},

	getX: function (propertyPath: string, propertyType: string, annotations?: Record<string, unknown>): CompiledBindingToolkitExpression {
		const pattern = annotations && MicroChartHelper.getCalendarPattern(propertyType, annotations);
		if (pattern && ["Edm.Date", "Edm.String"].some((type) => type === propertyType)) {
			return compileExpression(
				formatResult(
					[pathInModel(propertyPath), constant(pattern), constant(propertyPath)],
					"sap.fe.core.formatters.ValueFormatter#formatStringDimension"
				)
			);
		}
	},
	getExpressionWithType(value: PrimitiveType, formatOptions?: { style: string }): CompiledBindingToolkitExpression | undefined {
		if (value && value.$target) {
			const expression = formatWithTypeInformation(value.$target, getExpressionFromAnnotation(value));
			expression.formatOptions = {
				...expression.formatOptions,
				...formatOptions
			};
			return compileExpression(expression);
		}
	},
	calculateColorBinding(
		dataPoint: DataPoint,
		actualValueExpression: CompiledBindingToolkitExpression,
		criticalityExpressionForMicrochart: string | undefined
	): string | undefined {
		let colorBinding;
		if (dataPoint.Criticality || (!dataPoint.Criticality && !dataPoint.CriticalityCalculation)) {
			colorBinding = criticalityExpressionForMicrochart;
		} else if (dataPoint.CriticalityCalculation) {
			const criticalityCalculation = dataPoint.CriticalityCalculation;
			const direction = criticalityCalculation?.ImprovementDirection;
			const deviationRangeLowValue =
				compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeLowValue)) ?? 0;
			const toleranceRangeLowValue =
				compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeLowValue)) ?? 0;
			const acceptanceRangeLowValue =
				compileExpression(getExpressionFromAnnotation(criticalityCalculation?.AcceptanceRangeLowValue)) ?? 0;
			const acceptanceRangeHighValue = compileExpression(
				getExpressionFromAnnotation(criticalityCalculation?.AcceptanceRangeHighValue)
			);
			const toleranceRangeHighValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeHighValue));
			const deviationRangeHighValue = compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeHighValue));

			colorBinding = CommonHelper.getCriticalityCalculationBinding(
				direction as string,
				actualValueExpression as string,
				deviationRangeLowValue as string,
				toleranceRangeLowValue as string,
				acceptanceRangeLowValue as string,
				acceptanceRangeHighValue as string,
				toleranceRangeHighValue as string,
				deviationRangeHighValue as string
			);
		}
		return colorBinding;
	},
	async getBulletMicroChartAggregations(
		dataPoint: DataPoint,
		criticalityExpressionForMicrochart: string | undefined
	): Promise<Pick<$BulletMicroChartSettings, "actual" | "thresholds"> | undefined> {
		const BulletMicroChartData = (await import("sap/suite/ui/microchart/BulletMicroChartData")).default;
		const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
		const thresholds: InstanceType<typeof BulletMicroChartData>[] = [];
		const colorBinding = this.calculateColorBinding(dataPoint, actualValueExpression, criticalityExpressionForMicrochart);
		if (dataPoint.CriticalityCalculation) {
			const criticalityCalculation = dataPoint.CriticalityCalculation;
			const direction = criticalityCalculation?.ImprovementDirection;
			// thresholds
			if (!direction.includes("Minimize") && criticalityCalculation?.DeviationRangeLowValue) {
				thresholds.push(
					<BulletMicroChartData
						value={compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeLowValue))}
						color="Error"
					/>
				);
			}
			if (!direction.includes("Minimize") && criticalityCalculation?.ToleranceRangeLowValue) {
				thresholds.push(
					<BulletMicroChartData
						value={compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeLowValue))}
						color="Critical"
					/>
				);
			}
			if (!direction.includes("Maximize") && criticalityCalculation?.ToleranceRangeHighValue) {
				thresholds.push(
					<BulletMicroChartData
						value={compileExpression(getExpressionFromAnnotation(criticalityCalculation?.ToleranceRangeHighValue))}
						color="Critical"
					/>
				);
			}
			if (!direction.includes("Maximize") && criticalityCalculation?.DeviationRangeHighValue) {
				thresholds.push(
					<BulletMicroChartData
						value={compileExpression(getExpressionFromAnnotation(criticalityCalculation?.DeviationRangeHighValue))}
						color="Error"
					/>
				);
			}
		}
		const actual: InstanceType<typeof BulletMicroChartData> = (
			<BulletMicroChartData value={actualValueExpression} color={colorBinding} />
		);

		return { actual, thresholds };
	},

	async getStackMicroChartAggregations(
		dataPoint: DataPoint,
		measureDataPath: DataModelObjectPath<Measure> | undefined,
		criticalityExpressionForMicrochart: string | undefined
	): Promise<Pick<$StackedBarMicroChartSettings, "bars"> | undefined> {
		const StackedBarMicroChartBar = (await import("sap/suite/ui/microchart/StackedBarMicroChartBar")).default;
		const value = this.getExpressionWithType(dataPoint.Value);
		const valueColor = criticalityExpressionForMicrochart;
		const displayValue = (measureDataPath?.targetObject?.annotations?.Common as PropertyAnnotations_Common)?.Text
			? this.getExpressionWithType(
					(measureDataPath?.targetObject?.annotations?.Common as PropertyAnnotations_Common)
						?.Text as unknown as PathAnnotationExpression<string>
			  )
			: undefined;
		return {
			bars: <StackedBarMicroChartBar value={value} displayValue={displayValue} valueColor={valueColor} />
		};
	},

	async getHarveyMicroChartAggregations(
		dataPoint: DataPoint,
		criticalityExpressionForMicrochart: string | undefined
	): Promise<Pick<$HarveyBallMicroChartSettings, "items"> | undefined> {
		const HarveyBallMicroChartItem = (await import("sap/suite/ui/microchart/HarveyBallMicroChartItem")).default;
		const fractionLabel = this.getExpressionWithType(dataPoint.Value, { style: "short" });
		const fractionValue = this.getExpressionWithType(dataPoint.Value);
		const colorValue = criticalityExpressionForMicrochart;
		return {
			items: (
				<HarveyBallMicroChartItem formattedLabel={true} fractionLabel={fractionLabel} fraction={fractionValue} color={colorValue} />
			)
		};
	},

	async getComparisonMicroChartAggregations(
		dataPoint: DataPoint,
		criticalityExpressionForMicrochart: string | undefined,
		chart: Chart
	): Promise<Pick<$ComparisonMicroChartSettings, "data">> {
		const ComparisonMicroChartData = (await import("sap/suite/ui/microchart/ComparisonMicroChartData")).default;
		const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
		const displayValue = this.getExpressionWithType(dataPoint.Value, { style: "short" });
		const commonTextAnnotation = chart.Dimensions[0].$target?.annotations.Common?.Text;
		const titleExpression = commonTextAnnotation
			? compileExpression(getExpressionFromAnnotation(commonTextAnnotation))
			: compileExpression(pathInModel(chart.Dimensions[0].value));
		return (
			<ComparisonMicroChartData
				value={actualValueExpression}
				color={criticalityExpressionForMicrochart}
				title={titleExpression}
				displayValue={displayValue}
			/>
		);
	},

	async getColumnMicroChartAggregations(
		dataPoint: DataPoint,
		criticalityExpressionForMicrochart: string | undefined,
		showOnlyChart?: boolean
	): Promise<MicroChartAggregation> {
		const ColumnMicroChartData = (await import("sap/suite/ui/microchart/ColumnMicroChartData")).default;
		const ColumnMicroChartLabel = (await import("sap/suite/ui/microchart/ColumnMicroChartLabel")).default;
		const columnChartAggregations: $ColumnMicroChartSettings = {};
		const actualValueExpression = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
		const colorBinding = this.calculateColorBinding(dataPoint, actualValueExpression, criticalityExpressionForMicrochart);
		columnChartAggregations.columns = <ColumnMicroChartData value={actualValueExpression} color={colorBinding} />;
		if (!showOnlyChart) {
			columnChartAggregations.leftBottomLabel = <ColumnMicroChartLabel />;
			columnChartAggregations.leftTopLabel = <ColumnMicroChartLabel />;
			columnChartAggregations.rightBottomLabel = <ColumnMicroChartLabel />;
			columnChartAggregations.rightTopLabel = <ColumnMicroChartLabel />;
		}
		return columnChartAggregations;
	},

	async getLineMicroChartAggragations(
		microChartDataModelObjectPath: DataModelObjectPath<Chart | PresentationVariant> | undefined,
		chartTarget: Chart,
		targetNavigationPath: Context
	): Promise<Pick<$LineMicroChartSettings, "lines">> {
		const LineMicroChartLine = (await import("sap/suite/ui/microchart/LineMicroChartLine")).default;
		const LineMicroChartPoint = (await import("sap/suite/ui/microchart/LineMicroChartPoint")).default;
		const dimensionDataPath = enhanceDataModelPath<DataModelProperty>(
			microChartDataModelObjectPath as DataModelObjectPath<Chart | PresentationVariant>,
			chartTarget.Dimensions[0].value
		);
		const measures = chartTarget.Measures;
		const lines = [];

		for (let i = 0; i < measures.length; i++) {
			const DataPointPath = enhanceDataModelPath<DataPointType>(
				microChartDataModelObjectPath as DataModelObjectPath<unknown>,
				chartTarget?.MeasureAttributes[i]?.DataPoint?.value
			);
			const measureDataPath = enhanceDataModelPath<Measure>(
				microChartDataModelObjectPath as DataModelObjectPath<unknown>,
				chartTarget.Measures[i].value
			);

			const points = MicroChartHelper.getAggregationForMicrochart(
				"LinePoints",
				targetNavigationPath?.getObject(),
				DataPointPath,
				targetNavigationPath?.getObject("@sapui.name"),
				chartTarget.Dimensions[0],
				measureDataPath,
				(microChartDataModelObjectPath?.targetObject as PresentationVariant)?.SortOrder as unknown as SortOrderType[],
				undefined,
				true
			) as `{${string}}`;

			const xData = this.getXData(dimensionDataPath, microChartDataModelObjectPath);
			const yData = compileExpression(getExpressionFromAnnotation(DataPointPath.targetObject?.Value));

			lines.push(
				<LineMicroChartLine points={points}>
					{{ points: <LineMicroChartPoint x={xData} y={yData}></LineMicroChartPoint> }}
				</LineMicroChartLine>
			);
		}

		return { lines: lines };
	},

	getXData(
		dimensionDataPath: DataModelObjectPath<DataModelProperty>,
		microChartDataModelObjectPath: DataModelObjectPath<Chart | PresentationVariant> | undefined
	): CompiledBindingToolkitExpression {
		let xData;
		const propertyType = dimensionDataPath?.targetObject?.type as string;
		const propAnnotations = dimensionDataPath.targetObject?.annotations;
		if (
			propertyType === "Edm.Date" ||
			(dimensionDataPath.targetObject?.type === "Edm.String" &&
				MicroChartHelper.getCalendarPattern(propertyType, dimensionDataPath.targetObject?.annotations, true))
		) {
			const propertyPath = dimensionDataPath?.targetObject?.name;
			const pattern = propAnnotations && MicroChartHelper.getCalendarPattern(propertyType, propAnnotations, true);
			if (pattern && ["Edm.Date", "Edm.String"].some((type) => type === propertyType)) {
				xData = compileExpression(
					formatResult([pathInModel(propertyPath), pattern, propertyPath], valueFormatters.formatStringDimension)
				);
			}
		} else {
			dimensionDataPath.contextLocation = microChartDataModelObjectPath;
			xData = getValueBinding(dimensionDataPath, {});
		}
		return xData;
	},
	async getAreaMicroChartAggregations(
		chartTarget: Chart,
		microChartDataModelObjectPath: DataModelObjectPath<PresentationVariant | Chart>,
		targetNavigationPath: Context,
		showOnlyChart?: boolean
	): Promise<
		Pick<
			$AreaMicroChartSettings,
			| "chart"
			| "target"
			| "firstXLabel"
			| "firstYLabel"
			| "lastXLabel"
			| "lastYLabel"
			| "minThreshold"
			| "maxThreshold"
			| "innerMinThreshold"
			| "innerMaxThreshold"
		>
	> {
		const AreaMicroChartItem = (await import("sap/suite/ui/microchart/AreaMicroChartItem")).default;
		const AreaMicroChartPoint = (await import("sap/suite/ui/microchart/AreaMicroChartPoint")).default;
		const AreaMicroChartLabel = (await import("sap/suite/ui/microchart/AreaMicroChartLabel")).default;
		const dataPoint = chartTarget?.MeasureAttributes[0]?.DataPoint?.$target as DataPoint;
		const measureDataPath = enhanceDataModelPath<Measure>(microChartDataModelObjectPath, chartTarget.Measures[0].value);
		const dimensionDataPath = enhanceDataModelPath<DataModelProperty>(microChartDataModelObjectPath, chartTarget.Dimensions[0].value);
		const DataPointPath = enhanceDataModelPath<DataPointType>(
			microChartDataModelObjectPath as DataModelObjectPath<unknown>,
			chartTarget?.MeasureAttributes[0]?.DataPoint?.value
		);
		const targetNavigationDataModelObject: DataModelObjectPath<EntitySet | NavigationProperty> =
			MetaModelConverter.getInvolvedDataModelObjects(targetNavigationPath);
		const getAreaMicroChartItem = (
			y: PropertyAnnotationValue<PrimitiveType>,
			color?: string,
			isChartAggregation?: boolean
		): InstanceType<typeof AreaMicroChartItem> => {
			let points;
			if (isChartAggregation) {
				points = MicroChartHelper.getAggregationForMicrochart(
					"Points",
					targetNavigationPath?.getObject(),
					DataPointPath,
					targetNavigationPath?.getObject("@sapui.name"),
					chartTarget.Dimensions[0],
					measureDataPath,
					(microChartDataModelObjectPath?.targetObject as PresentationVariant)?.SortOrder as unknown as
						| SortOrderType[]
						| undefined,
					"",
					true
				) as `{${string}}`;
			} else {
				points = {
					path:
						(targetNavigationDataModelObject.targetObject?._type === "EntitySet" ? "/" : "") +
						targetNavigationDataModelObject.targetObject?.name
				};
			}
			return (
				<AreaMicroChartItem color={color} points={points}>
					{{
						points: <AreaMicroChartPoint x={x} y={compileExpression(getExpressionFromAnnotation(y))}></AreaMicroChartPoint>
					}}
				</AreaMicroChartItem>
			);
		};
		const aggregation: $AreaMicroChartSettings = {};
		const x = this.getXData(dimensionDataPath, microChartDataModelObjectPath);
		aggregation.chart = getAreaMicroChartItem(dataPoint.Value, "", true);
		aggregation.target = getAreaMicroChartItem(dataPoint.TargetValue);
		if (!showOnlyChart) {
			aggregation.firstXLabel = <AreaMicroChartLabel />;
			aggregation.firstYLabel = <AreaMicroChartLabel />;
			aggregation.lastXLabel = <AreaMicroChartLabel />;
			aggregation.lastYLabel = <AreaMicroChartLabel />;
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

	getBulletMicroChartProperties(
		microChartProperties: MicroChartSettings,
		dataPoint: DataPoint
	): Partial<PropertiesOf<MicroChartSettings>> {
		(microChartProperties as $BulletMicroChartSettings).targetValue = dataPoint.TargetValue
			? compileExpression(getExpressionFromAnnotation(dataPoint.TargetValue))
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).forecastValue = dataPoint.ForecastValue
			? compileExpression(getExpressionFromAnnotation(dataPoint.ForecastValue))
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).maxValue = dataPoint.MaximumValue
			? compileExpression(constant(dataPoint.MaximumValue?.valueOf()))
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).minValue = dataPoint.MinimumValue
			? compileExpression(constant(dataPoint.MinimumValue?.valueOf()))
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).actualValueLabel = dataPoint.Value
			? MicroChartHelper.getExpressionWithType(dataPoint.Value, { style: "short" })
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).targetValueLabel = dataPoint.TargetValue
			? MicroChartHelper.getExpressionWithType(dataPoint.TargetValue, { style: "short" })
			: undefined;
		(microChartProperties as $BulletMicroChartSettings).showDeltaValue =
			dataPoint.Visualization && dataPoint.Visualization === VisualizationType.DeltaBulletChart;
		(microChartProperties as $BulletMicroChartSettings).mode = (microChartProperties as $BulletMicroChartSettings).showDeltaValue
			? "Delta"
			: undefined;

		return microChartProperties;
	},

	getRadialMicroChartProperties(
		microChartProperties: MicroChartSettings,
		dataPoint: DataPoint
	): Partial<PropertiesOf<MicroChartSettings>> {
		(microChartProperties as $RadialMicroChartSettings).total = dataPoint.TargetValue
			? compileExpression(getExpressionFromAnnotation(dataPoint.TargetValue))
			: 100;
		const value = compileExpression(getExpressionFromAnnotation(dataPoint.Value));
		(microChartProperties as $RadialMicroChartSettings).fraction = value;
		(microChartProperties as $RadialMicroChartSettings).percentage = !dataPoint.TargetValue ? value : undefined;

		const colorExpression = dataPoint.Criticality ? buildExpressionForCriticalityColorMicroChart(dataPoint) : undefined;

		(microChartProperties as $RadialMicroChartSettings).valueColor = MicroChartHelper.calculateColorBinding(
			dataPoint,
			value,
			colorExpression
		);
		return microChartProperties;
	},

	getHarveyMicroChartProperties(
		microChartProperties: MicroChartSettings,
		dataPoint: DataPoint
	): Partial<PropertiesOf<MicroChartSettings>> {
		(microChartProperties as $HarveyBallMicroChartSettings).formattedLabel = true;
		(microChartProperties as $HarveyBallMicroChartSettings).totalLabel = MicroChartHelper.getExpressionWithType(
			dataPoint.MaximumValue,
			{
				style: "short"
			}
		);
		(microChartProperties as $HarveyBallMicroChartSettings).total = MicroChartHelper.getExpressionWithType(dataPoint.MaximumValue);
		(microChartProperties as $HarveyBallMicroChartSettings).colorPalette = MicroChartHelper.getColorPaletteForMicroChart(dataPoint);
		return microChartProperties;
	}
};

export default MicroChartHelper;

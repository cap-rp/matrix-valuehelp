import type { PrimitiveType, PropertyPath } from "@sap-ux/vocabularies-types";
import type { AggregatedProperty } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import { AnalyticsAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import { CoreAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Core";
import type {
	ChartMeasureAttributeType,
	ChartMeasureRoleType,
	Chart as ChartType,
	CriticalityCalculationType,
	CriticalityType,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldForIntentBasedNavigation,
	DataPoint,
	ImprovementDirectionType,
	LevelThresholdsType,
	PresentationVariant,
	SelectionPresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { OperationGroupingType, UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import merge from "sap/base/util/merge";
import uid from "sap/base/util/uid";
import {
	notEqual,
	pathInModel,
	resolveBindingString,
	type BindingToolkitExpression,
	type CompiledBindingToolkitExpression
} from "sap/fe/base/BindingToolkit";
import type { CommandProperties } from "sap/fe/base/jsx-runtime/jsx";
import CommonUtils from "sap/fe/core/CommonUtils";
import { escapeXMLAttributeValue } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import type { NavigationParameters } from "sap/fe/core/controllerextensions/InternalIntentBasedNavigation";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { BaseManifestSettings, ControlConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { TemplateType } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { isDataModelObjectPathForActionWithDialog } from "sap/fe/core/converters/annotations/DataField";
import { aiIcon, type AnnotationAction, type BaseAction, type CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import type { ChartP13nType, ChartVisualization } from "sap/fe/core/converters/controls/Common/Chart";
import type { VisualizationAndPath } from "sap/fe/core/converters/controls/Common/DataVisualization";
import {
	getDataVisualizationConfiguration,
	getVisualizationsFromAnnotation
} from "sap/fe/core/converters/controls/Common/DataVisualization";
import { AggregationHelper } from "sap/fe/core/converters/helpers/Aggregation";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type Diagnostics from "sap/fe/core/support/Diagnostics";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type Action from "sap/fe/macros/chart/Action";
import type ActionGroup from "sap/fe/macros/chart/ActionGroup";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import FlexItemData from "sap/m/FlexItemData";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageSize from "sap/m/IllustratedMessageSize";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import Menu from "sap/m/Menu";
import MenuButton from "sap/m/MenuButton";
import MenuItem from "sap/m/MenuItem";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import type { SegmentedButton$SelectionChangeEvent } from "sap/m/SegmentedButton";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import Device from "sap/ui/Device";
import type { CommandExecution$ExecuteEvent } from "sap/ui/core/CommandExecution";
import CustomData from "sap/ui/core/CustomData";
import Element from "sap/ui/core/Element";
import { Dock } from "sap/ui/core/Popup";
import type { VariantManagement$SaveEvent, VariantManagement$SelectEvent } from "sap/ui/fl/variants/VariantManagement";
import VariantManagement from "sap/ui/fl/variants/VariantManagement";
import MdcChart from "sap/ui/mdc/Chart";
import type Control from "sap/ui/mdc/Control";
import ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import MdcChartItem from "sap/ui/mdc/chart/Item";
import PersistenceProvider from "sap/ui/mdc/p13n/PersistenceProvider";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { ExpandPathType, MetaModelEnum, MetaModelType } from "../../../../../../../types/metamodel_types";
import type ChartBlock from "../Chart";
import type MacroAPI from "../MacroAPI";
import ActionHelper from "../internal/helpers/ActionHelper";
import DefaultActionHandler from "../internal/helpers/DefaultActionHandler";
import ChartHelper from "./ChartHelper";

const measureRole: { [key: string]: string } = {
	"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1": "axis1",
	"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2": "axis2",
	"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3": "axis3",
	"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis4": "axis4"
};
type ExtendedActionGroup = ActionGroup & { menuContentActions?: Record<string, Action> };
type ChartPayload = {
	chartContextPath: string;
	parameters: object;
	selectionMode: string;
};
type ChartDelegate = {
	name: string;
	payload: ChartPayload;
};
export type ActionOrActionGroup = Record<string, Action | ExtendedActionGroup>;
export type CustomAndAction = CustomAction & (Action | ActionGroup);
type CustomToolbarMenuAction = {
	id: string;
	text: string | undefined;
	visible: string | undefined;
	enabled?: string | boolean;
	useDefaultActionOnly?: boolean;
	buttonMode?: string;
	defaultAction?: string;
	actions?: CustomAction;
};

enum personalizationValues {
	Sort = "Sort",
	Type = "Type",
	Item = "Item",
	Filter = "Filter"
}

export type MeasureType = {
	id?: string;
	key?: string;
	role?: string;
	propertyPath?: string;
	aggregationMethod?: string;
	label?: string | BindingToolkitExpression<PrimitiveType>;
	value?: string;
	dataPoint?: string;
	name?: string;
};

type DimensionType = {
	id?: string;
	key?: string;
	role?: string;
	propertyPath?: string;
	label?: string | BindingToolkitExpression<PrimitiveType>;
	value?: string;
};

export type CommandAction = {
	actionContext: Context;
	onExecuteAction: string;
	onExecuteIBN?: string;
	onExecuteManifest: CompiledBindingToolkitExpression;
	chartOperationAvailableMap?: string;
};

type ToolBarAction = {
	unittestid: string;
	id?: string;
	label: string;
	ariaHasPopup?: string;
	press?: string;
	enabled?: string | boolean;
	visible: string | boolean;
};

export type ChartCustomData = {
	targetCollectionPath: string;
	entitySet: string;
	entityType: string;
	operationAvailableMap: string;
	multiSelectDisabledActions: string;
	segmentedButtonId: string;
	customAgg: object;
	transAgg: object;
	applySupported: object;
	vizProperties: object;
	draftSupported?: boolean;
	multiViews?: boolean;
	selectionPresentationVariantPath?: object;
	chartDimensionKeyAndRole?: object;
	chartMeasureKeyAndRole?: object;
};

export type ChartContextObjectPath = ChartType | SelectionPresentationVariant | PresentationVariant;

type ActionProperties = {
	key: string;
	text: string;
	__noWrap: boolean;
	press: string | null;
	requiresSelection: boolean;
	enabled: boolean;
	position?: object;
	menu?: string[];
};

type ToolbarAction = MenuItem | ActionToolbarAction | undefined;

function createChartDefinition(
	chartBlock: ChartBlock,
	converterContext: ConverterContext,
	contextObjectPath: DataModelObjectPath<ChartType | SelectionPresentationVariant | PresentationVariant>,
	controlPath: string
): ChartVisualization {
	let visualizationPath = getContextRelativeTargetObjectPath(contextObjectPath);
	let visualizations: Record<string, string>[] = [];
	if (chartBlock._metaPathContext?.getObject()?.$Type === UIAnnotationTypes.PresentationVariantType) {
		visualizations = chartBlock._metaPathContext.getObject().Visualizations;
	} else if (chartBlock._metaPathContext?.getObject()?.$Type === UIAnnotationTypes.SelectionPresentationVariantType) {
		visualizations = chartBlock._metaPathContext.getObject().PresentationVariant?.Visualizations;
	}
	if (visualizations?.length && !checkChartExists(visualizations, controlPath)) {
		visualizationPath = "";
	}

	// fallback to default Chart if visualizationPath is missing or visualizationPath is not found in control (in case of PresentationVariant)
	if (!visualizationPath) {
		visualizationPath = `@${UIAnnotationTerms.Chart}`;
	}

	const visualizationDefinition = getDataVisualizationConfiguration(visualizationPath, converterContext, {
		isCondensedTableLayoutCompliant: chartBlock.useCondensedLayout,
		isMacroOrMultipleView: true,
		shouldCreateTemplateChartVisualization: false
	});
	return visualizationDefinition.visualizations[0] as ChartVisualization;
}

function checkChartExists(visualizations: Record<string, string>[], visualizationPath: string | undefined): boolean {
	return visualizations.some((visualization) => visualizationPath?.includes(visualization.$AnnotationPath));
}

function getContentId(macroId: string): string {
	return `${macroId}-content`;
}

/**
 * Function used to get details WRT action(s) shown in the chart's toolbar.
 * @param chartBlock Chart block properties
 * @param visualizationPath Visualization path
 * @returns Object with all the required action(s) details
 */
function getExtraParams(chartBlock: ChartBlock, visualizationPath: string | undefined): Record<string, object> {
	const extraParams: Record<string, object> = {};
	const customActions: Record<string, object> = {};

	if (chartBlock.actions) {
		Object.values(chartBlock.actions)?.forEach((action: Action | ActionGroup) => {
			if (action.isA<ActionGroup>("sap.fe.macros.chart.ActionGroup")) {
				customActions[action.key] = getActionProperties(
					action.key,
					action.text,
					null,
					false,
					true,
					{
						placement: action.placement,
						anchor: action.anchor
					},
					action.actions.map((_, index) => action.key + "_Menu_" + index)
				);

				action.actions?.forEach((act: Action, index: number) => {
					const actionKey = action.key.concat("_Menu_", index as unknown as string);
					customActions[actionKey] = getActionProperties(
						actionKey,
						act.text,
						act.press,
						!!act.requiresSelection,
						act.enabled === null || act.enabled === undefined ? true : act.enabled
					);
				});
			} else if (action.isA<Action>("sap.fe.macros.chart.Action")) {
				customActions[action.key] = getActionProperties(
					action.key,
					action.text,
					action.press,
					!!action.requiresSelection,
					action.enabled === null || action.enabled == undefined ? true : action.enabled,
					{
						placement: action.placement,
						anchor: action.anchor
					}
				);
			}
		});
	}
	if (visualizationPath && chartBlock.actions) {
		extraParams[visualizationPath] = {
			actions: customActions
		};
	}

	return extraParams;
}

function getActionProperties(
	key: string,
	text: string,
	press: string | null,
	requiresSelection: boolean,
	enabled: boolean,
	position?: object,
	menu?: string[]
): ActionProperties {
	const actionProperties: ActionProperties = {
		key,
		text,
		__noWrap: true,
		press,
		requiresSelection,
		enabled
	};

	if (position) {
		actionProperties.position = position;
	}
	if (menu) {
		actionProperties.menu = menu;
	}

	return actionProperties;
}

function createBindingContext(data: object | BaseAction[] | CustomAction): Context {
	const contextPath = `/${uid()}`;
	const actionsModel = new JSONModel();
	actionsModel.setProperty(contextPath, data);
	return actionsModel.createBindingContext(contextPath)!;
}

function getChartMeasures(chartBlock: ChartBlock, aggregationHelper: AggregationHelper): Context {
	const chartAnnotationPath = chartBlock.chartDefinition.annotationPath.split("/");
	// this is required because getAbsolutePath in converterContext returns "/SalesOrderManage/_Item/_Item/@com.sap.vocabularies.v1.Chart" as annotationPath
	const annotationPath = chartAnnotationPath
		.filter(function (item: string, pos: number): boolean {
			return chartAnnotationPath.indexOf(item) == pos;
		})
		.toString()
		.replaceAll(",", "/");
	const oChart = getInvolvedDataModelObjects<ChartType>(
		chartBlock._metaModel.createBindingContext(annotationPath)!,
		chartBlock._context
	).targetObject;
	const aggregatedProperty = aggregationHelper.getAggregatedProperty();
	let measures: MeasureType[] = [];
	const annoPath = chartBlock._metaPathContext.getPath();
	const aggregatedProperties = aggregationHelper.getAggregatedProperties();
	const chartMeasures = oChart?.Measures ? oChart.Measures : [];
	const chartDynamicMeasures = oChart?.DynamicMeasures ? oChart.DynamicMeasures : [];
	//check if there are measures pointing to aggregated properties
	const transAggInMeasures = aggregatedProperties[0]
		? aggregatedProperties[0].filter(function (properties) {
				return chartMeasures.some(function (propertyMeasureType: MeasureType) {
					return properties.Name === propertyMeasureType.value;
				});
		  })
		: undefined;
	const entitySetPath = annoPath.replace(/@com.sap.vocabularies.UI.v1.(Chart|PresentationVariant|SelectionPresentationVariant).*/, "");
	const transAggregations = chartBlock.chartDefinition.transAgg as Record<string, MeasureType>;
	const customAggregations = chartBlock.chartDefinition.customAgg as Record<string, Record<string, unknown>>;
	// intimate the user if there is AggregateProperty configured with no DYnamicMeasures, bu there are measures with AggregatedProperties
	if (aggregatedProperty.length > 0 && !chartDynamicMeasures && transAggInMeasures && transAggInMeasures.length > 0) {
		Log.warning(
			"The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly."
		);
	}
	const isCustomAggregateIsMeasure = chartMeasures.some((oChartMeasure: MeasureType) => {
		const oCustomAggMeasure = getCustomAggMeasure(customAggregations, oChartMeasure);
		return !!oCustomAggMeasure;
	});
	if (aggregatedProperty.length > 0 && !chartDynamicMeasures?.length && !isCustomAggregateIsMeasure) {
		throw new Error("Please configure DynamicMeasures for the chart");
	}
	if (aggregatedProperty.length > 0 && oChart) {
		for (const dynamicMeasure of chartDynamicMeasures) {
			measures = getDynamicMeasures(measures, dynamicMeasure, entitySetPath, oChart, chartBlock);
		}
	}
	for (const chartMeasure of chartMeasures) {
		const key = chartMeasure.value;
		const customAggMeasure = getCustomAggMeasure(customAggregations, chartMeasure);
		const measureType: MeasureType = {};
		if (customAggMeasure) {
			measures = setCustomAggMeasure(measures, measureType, customAggMeasure, key);
			//if there is neither aggregatedProperty nor measures pointing to customAggregates, but we have normal measures. Now check if these measures are part of AggregatedProperties Obj
		} else if (aggregatedProperty.length === 0 && transAggregations[key]) {
			measures = setTransAggMeasure(measures, measureType, transAggregations, key);
		}
		setChartMeasureAttributes(chartBlock._chart.MeasureAttributes, entitySetPath, measureType, chartBlock);
	}
	const measuresModel: JSONModel = new JSONModel(measures);
	(measuresModel as { $$valueAsPromise?: boolean }).$$valueAsPromise = true;
	return measuresModel.createBindingContext("/");
}

function setCustomAggMeasure(measures: MeasureType[], measure: MeasureType, customAggMeasure: MeasureType, key: string): MeasureType[] {
	if (key.includes("/")) {
		Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
	}
	measure.key = customAggMeasure.value;
	measure.role = "axis1";
	measure.label = customAggMeasure.label;
	measure.propertyPath = customAggMeasure.value;
	measures.push(measure);
	return measures;
}

function setTransAggMeasure(
	measures: MeasureType[],
	measure: MeasureType,
	transAggregations: Record<string, MeasureType>,
	key: string
): MeasureType[] {
	const transAggMeasure = transAggregations[key];
	measure.key = transAggMeasure.name;
	measure.role = "axis1";
	measure.propertyPath = key;
	measure.aggregationMethod = transAggMeasure.aggregationMethod;
	measure.label = transAggMeasure.label || measure.label;
	measures.push(measure);
	return measures;
}

function getDynamicMeasures(
	measures: MeasureType[],
	chartDynamicMeasure: MeasureType,
	entitySetPath: string,
	chart: ChartType,
	chartBlock: ChartBlock
): MeasureType[] {
	const key = chartDynamicMeasure.value || "";
	const aggregatedProperty = getInvolvedDataModelObjects<AggregatedProperty>(
		chartBlock._metaModel.createBindingContext(entitySetPath + key) as Context,
		chartBlock._context
	).targetObject;
	if (key.includes("/")) {
		Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
		// check if the annotation path is wrong
	} else if (!aggregatedProperty) {
		throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
		// check if the path starts with @
	} else if (chartDynamicMeasure.value?.startsWith(`@${AnalyticsAnnotationTerms.AggregatedProperty}`) === null) {
		throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
	} else {
		// check if AggregatedProperty is defined in given DynamicMeasure
		const dynamicMeasure: MeasureType = {
			key: aggregatedProperty.Name.toString(),
			role: "axis1"
		};
		dynamicMeasure.propertyPath = aggregatedProperty.AggregatableProperty.value;
		dynamicMeasure.aggregationMethod = aggregatedProperty.AggregationMethod.toString();
		dynamicMeasure.label = resolveBindingString(
			aggregatedProperty.annotations?.Common?.Label?.toString() ??
				aggregatedProperty.AggregatableProperty.$target?.annotations?.Common?.Label?.toString() ??
				""
		);
		setChartMeasureAttributes(chart.MeasureAttributes, entitySetPath, dynamicMeasure, chartBlock);
		measures.push(dynamicMeasure);
	}
	return measures;
}

function getCustomAggMeasure(customAggregations: Record<string, MeasureType | undefined>, measure: MeasureType): MeasureType | null {
	if (measure.value && customAggregations[measure.value]) {
		measure.label = customAggregations[measure.value]?.label;
		return measure;
	}
	return null;
}

function setChartMeasureAttributes(
	measureAttributes: ChartMeasureAttributeType[],
	entitySetPath: string,
	measure: MeasureType,
	chartBlock: ChartBlock
): void {
	if (measureAttributes?.length) {
		for (const measureAttribute of measureAttributes) {
			_setChartMeasureAttribute(measureAttribute, entitySetPath, measure, chartBlock);
		}
	}
}

function _setChartMeasureAttribute(
	measureAttribute: ChartMeasureAttributeType,
	entitySetPath: string,
	measure: MeasureType,
	chartBlock: ChartBlock
): void {
	const path = measureAttribute.DynamicMeasure ? measureAttribute?.DynamicMeasure?.value : measureAttribute?.Measure?.value;
	const measureAttributeDataPoint = measureAttribute.DataPoint ? measureAttribute?.DataPoint?.value : null;
	const role = measureAttribute.Role;
	const dataPoint: DataPoint | undefined = measureAttributeDataPoint
		? getInvolvedDataModelObjects<DataPoint>(
				chartBlock._metaModel.createBindingContext(entitySetPath + measureAttributeDataPoint) as Context,
				chartBlock._context
		  ).targetObject
		: undefined;
	if (measure.key === path) {
		setMeasureRole(measure, role as unknown as MetaModelEnum<ChartMeasureRoleType>);
		//still to add data point, but UI5 Chart API is missing
		setMeasureDataPoint(measure, dataPoint);
	}
}

/**
 * Format the data point as a JSON object.
 * @param oDataPointAnno
 * @returns The formatted json object
 */
function createDataPointProperty(oDataPointAnno: DataPoint): {
	targetValue?: string;
	foreCastValue?: string;
	criticality?: Record<string, unknown>;
} {
	const oDataPoint: { targetValue?: string; foreCastValue?: string; criticality?: Record<string, unknown> } = {};

	if (oDataPointAnno.TargetValue) {
		oDataPoint.targetValue = oDataPointAnno.TargetValue.$Path;
	}

	if (oDataPointAnno.ForecastValue) {
		oDataPoint.foreCastValue = oDataPointAnno.ForecastValue.$Path;
	}

	let oCriticality = null;
	if (oDataPointAnno.Criticality) {
		if (isPathAnnotationExpression(oDataPointAnno.Criticality) && oDataPointAnno.Criticality.path) {
			//will be an aggregated property or custom aggregate
			oCriticality = {
				Calculated: oDataPointAnno.Criticality.path
			};
		} else {
			oCriticality = {
				Static: (oDataPointAnno.Criticality as unknown as MetaModelEnum<CriticalityType>).$EnumMember.replace(
					"com.sap.vocabularies.UI.v1.CriticalityType/",
					""
				)
			};
		}
	} else if (oDataPointAnno.CriticalityCalculation) {
		const oThresholds: Record<string, unknown> & { AggregationLevels?: unknown[] } = {};
		const bConstant = buildThresholds(oThresholds, oDataPointAnno.CriticalityCalculation);

		if (bConstant) {
			oCriticality = {
				ConstantThresholds: oThresholds
			};
		} else {
			oCriticality = {
				DynamicThresholds: oThresholds
			};
		}
	}

	if (oCriticality) {
		oDataPoint.criticality = oCriticality;
	}

	return oDataPoint;
}

/**
 * Checks whether the thresholds are dynamic or constant.
 * @param thresholds The threshold skeleton
 * @param criticalityCalculation The UI.DataPoint.CriticalityCalculation annotation
 * @returns `true` if the threshold should be supplied as ConstantThresholds, <code>false</code> if the threshold should
 * be supplied as DynamicThresholds
 * @private
 */
function buildThresholds(
	thresholds: Record<string, unknown> & { AggregationLevels?: unknown[] },
	criticalityCalculation: CriticalityCalculationType
): boolean {
	const keys = [
		"AcceptanceRangeLowValue",
		"AcceptanceRangeHighValue",
		"ToleranceRangeLowValue",
		"ToleranceRangeHighValue",
		"DeviationRangeLowValue",
		"DeviationRangeHighValue"
	];
	thresholds.ImprovementDirection = (
		criticalityCalculation.ImprovementDirection as unknown as MetaModelEnum<ImprovementDirectionType>
	)?.$EnumMember.replace("com.sap.vocabularies.UI.v1.ImprovementDirectionType/", "");

	const dynamicThresholds: Record<string, unknown> & { usedMeasures: unknown[] } = {
		oneSupplied: false,
		usedMeasures: []
		// combination to check whether at least one is supplied
	};
	const constantThresholds: Record<string, unknown> = {
		oneSupplied: false
		// combination to check whether at least one is supplied
	};

	initialiseThresholds(keys, dynamicThresholds, constantThresholds, criticalityCalculation);
	processThresholds(keys, thresholds, dynamicThresholds, constantThresholds, criticalityCalculation);

	return !dynamicThresholds.oneSupplied;
}

function initialiseThresholds(
	keys: string[],
	dynamicThresholds: Record<string, unknown> & { usedMeasures: unknown[] },
	constantThresholds: Record<string, unknown>,
	criticalityCalculation: CriticalityCalculationType
): void {
	for (const key of keys) {
		dynamicThresholds[key] = criticalityCalculation[key as keyof CriticalityCalculationType]
			? criticalityCalculation[key as keyof CriticalityCalculationType].$Path
			: undefined;
		dynamicThresholds.oneSupplied = dynamicThresholds.oneSupplied || dynamicThresholds[key];

		if (!dynamicThresholds.oneSupplied) {
			// only consider in case no dynamic threshold is supplied
			constantThresholds[key] = criticalityCalculation[key as keyof CriticalityCalculationType];
			constantThresholds.oneSupplied = constantThresholds.oneSupplied || constantThresholds[key];
		} else if (dynamicThresholds[key]) {
			dynamicThresholds.usedMeasures.push(dynamicThresholds[key as keyof CriticalityCalculationType]);
		}
	}
}

function processThresholds(
	keys: string[],
	thresholds: Record<string, unknown> & { AggregationLevels?: unknown[] },
	dynamicThresholds: Record<string, unknown> & { usedMeasures: unknown[] },
	constantThresholds: Record<string, unknown>,
	criticalityCalculation: CriticalityCalculationType
): void {
	// dynamic definition shall overrule constant definition
	if (dynamicThresholds.oneSupplied) {
		for (const key of keys) {
			if (dynamicThresholds[key]) {
				thresholds[key] = dynamicThresholds[key];
			}
		}
		thresholds.usedMeasures = dynamicThresholds.usedMeasures;
	} else {
		thresholds.AggregationLevels = [];
		processAggregationLevelForThresholds(keys, thresholds, constantThresholds, criticalityCalculation);
	}
}

function processAggregationLevelForThresholds(
	keys: string[],
	thresholds: Record<string, unknown> & { AggregationLevels?: unknown[] },
	constantThresholds: Record<string, unknown>,
	criticalityCalculation: CriticalityCalculationType
): void {
	let oAggregationLevel: Record<string, unknown> = {};
	// check if at least one static value is supplied
	if (constantThresholds.oneSupplied) {
		// add one entry in the aggregation level
		oAggregationLevel = {
			VisibleDimensions: null
		};

		for (const sKey of keys) {
			if (constantThresholds[sKey]) {
				oAggregationLevel[sKey] = constantThresholds[sKey];
			}
		}

		thresholds.AggregationLevels?.push(oAggregationLevel);
	}

	processAggregationLevelsForConstantThresholds(keys, thresholds, criticalityCalculation, oAggregationLevel);
}

function processAggregationLevelsForConstantThresholds(
	keys: string[],
	thresholds: Record<string, unknown> & { AggregationLevels?: unknown[] },
	criticalityCalculation: CriticalityCalculationType,
	aggregationLevel: Record<string, unknown>
): void {
	if (criticalityCalculation.ConstantThresholds && criticalityCalculation.ConstantThresholds.length > 0) {
		for (const aggregationLevelInfo of criticalityCalculation.ConstantThresholds) {
			const visibleDimensions: string[] | null = aggregationLevelInfo.AggregationLevel ? [] : null;

			if (visibleDimensions && aggregationLevelInfo.AggregationLevel && aggregationLevelInfo.AggregationLevel.length > 0) {
				for (const propertyPath of aggregationLevelInfo.AggregationLevel) {
					visibleDimensions.push((propertyPath as unknown as ExpandPathType<PropertyPath>).$PropertyPath);
				}
			}

			aggregationLevel = {
				VisibleDimensions: visibleDimensions
			};

			for (const key of keys) {
				const value = aggregationLevelInfo[key as unknown as keyof LevelThresholdsType];
				if (value) {
					aggregationLevel[key] = value;
				}
			}

			thresholds.AggregationLevels?.push(aggregationLevel);
		}
	}
}

function setMeasureDataPoint(measure: MeasureType, dataPoint: DataPoint | undefined): void {
	if (dataPoint && dataPoint.Value.$Path == measure.key) {
		measure.dataPoint = ChartHelper.formatJSONToString(createDataPointProperty(dataPoint)) || "";
	}
}

function setMeasureRole(measure: MeasureType, role: MetaModelEnum<ChartMeasureRoleType> | undefined): void {
	if (role != null) {
		const index = role.$EnumMember;
		measure.role = measureRole[index];
	}
}

function getDependents(chartBlock: ChartBlock, chartContext: Context): string | string[] {
	if (chartBlock._commandActions.length > 0) {
		return chartBlock._commandActions.map((commandAction: CommandAction) => {
			return getActionCommand(commandAction, chartContext, chartBlock);
		});
	}
	return "";
}

/**
 *
 * @param personalization Specifies the chart personalization
 */

function checkPersonalizationInChartProperties(personalization: ChartP13nType, chartBlock: ChartBlock): void {
	if (personalization) {
		if (personalization === "false" || (personalization as boolean) === false) {
			chartBlock._personalization = undefined;
		} else if (personalization === "true" || (personalization as boolean) === true) {
			chartBlock._personalization = Object.values(personalizationValues).join(",");
		} else if (verifyValidPersonalization(personalization as string) === true) {
			chartBlock._personalization = personalization;
		} else {
			chartBlock._personalization = undefined;
		}
	}
}

/**
 *
 * @param personalization
 * @returns `true` or `false` if the personalization is valid or not valid
 */
function verifyValidPersonalization(personalization: string): boolean {
	let valid = true;
	const splitArray = personalization.split(",");
	const acceptedValues: string[] = Object.values(personalizationValues);
	splitArray.forEach((arrayElement) => {
		if (!acceptedValues.includes(arrayElement)) {
			valid = false;
		}
	});
	return valid;
}

function getVariantManagement(chartBlock: ChartBlock): string {
	const variantManagement = chartBlock.variantManagement ? chartBlock.variantManagement : chartBlock.chartDefinition.variantManagement;
	return chartBlock.personalization === undefined ? "None" : variantManagement;
}

function createVariantManagement(chartBlock: ChartBlock): string {
	const personalization = chartBlock.personalization;
	if (personalization) {
		const variantManagement = getVariantManagement(chartBlock);
		if (variantManagement === "Control") {
			return (
				<VariantManagement
					id={generate([chartBlock._blockId, "VM"])}
					for={[chartBlock._blockId!]}
					showSetAsDefault={true}
					headerLevel={chartBlock.headerLevel}
					select={(event: VariantManagement$SelectEvent): void => {
						chartBlock.fireVariantSelected?.(event);
					}}
					save={(event: VariantManagement$SaveEvent): void => {
						chartBlock.fireVariantSaved?.(event);
					}}
				/>
			);
		} else if (variantManagement === "None" || variantManagement === "Page") {
			return "";
		}
	} else if (!personalization) {
		Log.warning("Variant Management cannot be enabled when personalization is disabled");
	}
	return "";
}

function getPersistenceProvider(chartBlock: ChartBlock): PersistenceProvider | undefined {
	if (getVariantManagement(chartBlock) === "None") {
		return <PersistenceProvider id={generate([chartBlock._blockId, "PersistenceProvider"])} for={chartBlock._blockId} />;
	}
}

function pushActionCommand(
	actionContext: Context,
	dataField: (MetaModelType<DataFieldForAction> & { InvocationGrouping: MetaModelEnum<OperationGroupingType> }) | undefined,
	chartOperationAvailableMap: string | undefined,
	action: BaseAction | CustomAction,
	chartBlock: ChartBlock
): void {
	if (dataField) {
		const commandAction = {
			actionContext: actionContext,
			onExecuteAction: ChartHelper.getPressEventForDataFieldForActionButton(
				chartBlock._blockId!,
				dataField,
				chartOperationAvailableMap || ""
			),
			onExecuteIBN: CommonHelper.getPressHandlerForDataFieldForIBN(
				dataField as unknown as DataFieldForIntentBasedNavigation,
				`\${internal>selectedContexts}`,
				false
			),
			onExecuteManifest: CommonHelper.buildActionWrapper(action as CustomAction, chartBlock),
			chartOperationAvailableMap
		};
		chartBlock._commandActions.push(commandAction);
	}
}

function getActionCommand(commandAction: CommandAction, chartContext: Context, chartBlock: ChartBlock): string {
	const action = commandAction.actionContext.getObject();
	const dataFieldContext = action.annotationPath && chartBlock._metaModel.createBindingContext(action.annotationPath);
	const dataField = dataFieldContext && dataFieldContext.getObject();
	const dataFieldAction = chartBlock._metaModel.createBindingContext(action.annotationPath + "/Action")!;
	const actionContext = CommonHelper.getActionContext(dataFieldAction);
	const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
	const isBound = chartBlock._metaModel.createBindingContext(isBoundPath)!.getObject();
	const chartOperationAvailableMap = escapeXMLAttributeValue(
		ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
			context: chartContext
		})
	);
	const isActionEnabled = action.enabled
		? action.enabled
		: ChartHelper.isDataFieldForActionButtonEnabled(
				isBound && isBound.$IsBound,
				dataField.Action,
				chartBlock._context,
				chartOperationAvailableMap || "",
				action.enableOnSelect || ""
		  );
	let isIBNEnabled;
	if (action.enabled) {
		isIBNEnabled = action.enabled;
	} else if (dataField.RequiresContext) {
		isIBNEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
	}

	let commandEnabled: boolean;
	switch (action.type) {
		case "ForAction":
			commandEnabled = isActionEnabled ?? action.enabled;
			break;
		case "ForNavigation":
			commandEnabled = isIBNEnabled ?? action.enabled;
			break;
		default:
			commandEnabled = action.enabled;
			break;
	}

	const actionCommand = (
		<CommandExecution
			execute={(event: CommandExecution$ExecuteEvent): void =>
				commandExecute(event, action, chartBlock._blockId!, commandAction.chartOperationAvailableMap!, dataField)
			}
			enabled={commandEnabled}
			visible={(getVisible(dataFieldContext, chartBlock) as boolean) ?? action.visible}
			command={action.command}
		/>
	);

	if (
		action.type == "ForAction" &&
		(!isBound ||
			isBound.IsBound !== true ||
			(actionContext as unknown as Record<string, unknown>)[`@${CoreAnnotationTerms.OperationAvailable}`] !== false)
	) {
		return actionCommand;
	} else if (action.type == "ForAction") {
		return "";
	} else {
		return actionCommand;
	}
}

function commandExecute(
	event: CommandExecution$ExecuteEvent,
	action: { InvocationGrouping: { $EnumMember: string }; action: string; type: string; handlerModule: string; handlerMethod: string },
	id: string,
	chartOperationAvailableMap: string,
	dataField: DataFieldForAction | DataFieldForIntentBasedNavigation
): void {
	const view = CommonUtils.getTargetView(event.getSource());
	const controller = view?.getController();

	switch (action.type) {
		case "ForAction":
			const sInvocationGrouping =
				action.InvocationGrouping &&
				action.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
					? "ChangeSet"
					: "Isolated";
			const params = {
				contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
				invocationGrouping: sInvocationGrouping,
				controlId: id,
				operationAvailableMap: chartOperationAvailableMap,
				model: view.getModel(),
				label: dataField.Label as string
			};
			controller.editFlow.invokeAction(dataField.Action as string, params);
			break;
		case "ForNavigation":
			const navigationParameters: NavigationParameters = {
				navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
			};
			if ((dataField as DataFieldForIntentBasedNavigation).Mapping) {
				navigationParameters.semanticObjectMapping = JSON.stringify((dataField as DataFieldForIntentBasedNavigation).Mapping);
			}
			controller._intentBasedNavigation.navigate(
				(dataField as DataFieldForIntentBasedNavigation).SemanticObject as unknown as string,
				(dataField as DataFieldForIntentBasedNavigation).Action as unknown as string,
				navigationParameters
			);
			break;
		default:
			FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {
				contexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
			});
			break;
	}
}

function getItems(chartBlock: ChartBlock): string | string[] {
	if (chartBlock._chart) {
		const dimensions: string[] = [];
		const measures: string[] = [];
		if (chartBlock._chart.Dimensions) {
			ChartHelper.formatDimensions(chartBlock._chartContext)
				.getObject()
				.forEach((dimension: DimensionType) => {
					dimension.id = generate([chartBlock.id, "dimension", dimension.key]);
					dimensions.push(
						getItem(
							{
								id: dimension.id,
								key: dimension.key,
								label: dimension.label,
								role: dimension.role
							},
							"_fe_groupable_",
							"groupable"
						)
					);
				});
		}
		if (chartBlock.measures) {
			ChartHelper.formatMeasures(chartBlock.measures).forEach((measure: MeasureType) => {
				measure.id = generate([chartBlock.id, "measure", measure.key]);
				measures.push(
					getItem(
						{
							id: measure.id,
							key: measure.key,
							label: measure.label,
							role: measure.role
						},
						"_fe_aggregatable_",
						"aggregatable"
					)
				);
			});
		}
		if (dimensions.length && measures.length) {
			return dimensions.concat(measures);
		}
	}
	return "";
}

function getItem(item: MeasureType | DimensionType, prefix: string, type: string): string {
	return (
		<MdcChartItem
			id={item.id}
			propertyKey={prefix + item.key}
			type={type}
			label={resolveBindingString(item.label as string, "string")}
			role={item.role}
		/>
	);
}

function getToolbarActions(chartBlock: ChartBlock): ToolbarAction[] {
	const actions = getActions(chartBlock);
	if (chartBlock.chartDefinition?.onSegmentedButtonPressed) {
		actions.push(getSegmentedButton(chartBlock));
	}
	if (chartBlock.chartDefinition.isInsightsEnabled) {
		actions.push(
			getStandardActions(
				chartBlock.chartDefinition.isInsightsEnabled,
				chartBlock.chartDefinition.isInsightsVisible,
				chartBlock._blockId!,
				chartBlock
			)
		);
	}
	if (actions.length > 0) {
		return actions;
	}
	return [];
}

function getStandardActions(
	isInsightsEnabled: BindingToolkitExpression<boolean> | undefined,
	isInsightsVisible: BindingToolkitExpression<boolean> | undefined,
	id: string,
	chartBlock: ChartBlock
): MenuItem | ActionToolbarAction {
	return (
		<ActionToolbarAction visible={isInsightsVisible}>
			<Button
				id={generate([id, "StandardAction::Insights"])}
				text="{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}"
				press={(): void => {
					chartBlock.onAddCardToInsightsPressed();
				}}
				enabled={isInsightsEnabled}
			>
				{{
					layoutData: <OverflowToolbarLayoutData priority="AlwaysOverflow" />
				}}
			</Button>
		</ActionToolbarAction>
	);
}

function getActions(chartBlock: ChartBlock): ToolbarAction[] {
	const actions = removeMenuItems(chartBlock.chartActions ?? []);
	return actions.map((action: BaseAction) => {
		if (action.annotationPath || (action.type === "Menu" && !action.id?.startsWith("CustomAction"))) {
			// Load annotation based actions
			return getAction(action, chartBlock._chartContext, false, chartBlock);
		} else if (action.hasOwnProperty("noWrap")) {
			// Load XML or manifest based actions / action groups
			return getCustomActions(action as CustomAndAction, chartBlock._chartContext, chartBlock);
		}
	});
}

function removeMenuItems(actions: BaseAction[]): BaseAction[] {
	// If action is already part of menu in action group, then it will
	// be removed from the main actions list
	for (const action of actions) {
		if (action.menu) {
			action.menu.forEach((item) => {
				const idx = actions.map((act) => act.key).indexOf(item.key);
				if (idx !== -1) {
					actions.splice(idx, 1);
				}
			});
		}
	}
	return actions;
}

function getCustomActions(action: CustomAndAction, chartContext: Context, chartBlock: ChartBlock): ToolbarAction {
	let actionEnabled = action.enabled as string | boolean | undefined;
	if ((action.requiresSelection ?? false) && action.enabled === "true") {
		actionEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
	}
	if (action.type === "Default") {
		// Load XML or manifest based toolbar actions
		return getActionToolbarAction(
			action,
			{
				id: generate([chartBlock._blockId, action.id]),
				unittestid: "DataFieldForActionButtonAction",
				label: action.text ? action.text : "",
				ariaHasPopup: undefined,
				press: action.press ? action.press : "",
				enabled: actionEnabled,
				visible: action.visible ? action.visible : false
			},
			false,
			chartBlock
		);
	} else if (action.type === "Menu") {
		// Load action groups (Menu)
		return getActionToolbarMenuAction(
			{
				id: generate([chartBlock._blockId, action.id]),
				text: action.text,
				visible: action.visible,
				enabled: actionEnabled,
				useDefaultActionOnly: DefaultActionHandler.getUseDefaultActionOnly(action),
				buttonMode: DefaultActionHandler.getButtonMode(action),
				defaultAction: undefined,
				actions: action
			},
			chartContext,
			chartBlock
		);
	}
}

function getMenuItemFromMenu(menuItemAction: CustomAction, chartContext: Context, chartBlock: ChartBlock): ToolbarAction {
	let pressHandler: { press: (event: Button$PressEvent) => void } | { "jsx:command": CommandProperties };
	if (menuItemAction.annotationPath) {
		//Annotation based action is passed as menu item for menu button
		return getAction(menuItemAction, chartContext, true, chartBlock);
	}
	if (menuItemAction.command) {
		pressHandler = { "jsx:command": `cmd:${menuItemAction.command}|press` as CommandProperties };
	} else if (menuItemAction.noWrap ?? false) {
		pressHandler = {
			press: (event: Button$PressEvent): void => {
				const functionName = menuItemAction.handlerMethod?.split(".")[1] as string;
				const controller = { ...CommonUtils.getTargetView(event.getSource()).getController() } as unknown as {
					[temp: string]: (event: Button$PressEvent) => void;
				};
				if (controller[functionName]) controller[functionName](event);
			}
		};
	} else {
		pressHandler = {
			press: (event: Button$PressEvent): void => {
				const selectedContexts = CommonUtils.getTargetView(event.getSource())
					.getBindingContext("internal")
					?.getProperty("selectedContexts");
				FPMHelper.actionWrapper(event, menuItemAction.handlerModule, menuItemAction.handlerMethod, { contexts: selectedContexts });
			}
		};
	}

	return <MenuItem text={menuItemAction.text} {...pressHandler} visible={menuItemAction.visible} enabled={menuItemAction.enabled} />;
}

function getActionToolbarMenuAction(
	props: CustomToolbarMenuAction,
	chartContext: Context,
	chartBlock: ChartBlock
): MenuItem | ActionToolbarAction {
	const aMenuItems = (props.actions?.menu as CustomAction[]).map((action: CustomAction) => {
		return getMenuItemFromMenu(action, chartContext, chartBlock);
	});
	return (
		<ActionToolbarAction>
			<MenuButton
				text={props.text}
				type="Transparent"
				id={props.id}
				visible={props.visible}
				enabled={props.enabled}
				useDefaultActionOnly={props.useDefaultActionOnly}
				buttonMode={props.buttonMode}
				menuPosition={Dock.BeginBottom}
				defaultAction={"props.defaultAction" as unknown as () => void}
			>
				{{
					menu: <Menu>{aMenuItems}</Menu>
				}}
			</MenuButton>
		</ActionToolbarAction>
	);
}

function getAction(action: BaseAction | CustomAction, chartContext: Context, isMenuItem: boolean, chartBlock: ChartBlock): ToolbarAction {
	const dataFieldContext = chartBlock._metaModel.createBindingContext(action.annotationPath ?? "")!;
	if (action.type === "ForNavigation") {
		return getNavigationActions(action, dataFieldContext, isMenuItem, chartBlock);
	} else if (action.type === "ForAction") {
		return getAnnotationActions(chartContext, action as AnnotationAction, dataFieldContext, isMenuItem, chartBlock);
	} else if (action.type === "Menu") {
		const menuItems = action.menu?.map((menuAction: BaseAction) => {
			return getAction(menuAction, chartContext, true, chartBlock);
		});
		return (
			<ActionToolbarAction>
				<MenuButton
					text={action.text}
					type="Transparent"
					id={action.key}
					visible={action.visible}
					enabled={action.enabled}
					menuPosition={Dock.BeginBottom}
					icon={action?.isAIOperation === true ? aiIcon : undefined}
				>
					{{
						menu: <Menu>{menuItems}</Menu>
					}}
				</MenuButton>
			</ActionToolbarAction>
		);
	}
	return undefined;
}

function getNavigationActions(
	action: BaseAction | CustomAction,
	dataFieldContext: Context,
	isMenuItem: boolean,
	chartBlock: ChartBlock
): MenuItem | ActionToolbarAction {
	let enabled = "true";
	const dataField = dataFieldContext.getObject();
	if (action.enabled !== undefined) {
		enabled = action.enabled;
	} else if (dataField.RequiresContext) {
		enabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
	}
	return getActionToolbarAction(
		action,
		{
			id: undefined,
			unittestid: "DataFieldForIntentBasedNavigationButtonAction",
			label: dataField.Label,
			ariaHasPopup: undefined,
			press: CommonHelper.getPressHandlerForDataFieldForIBN(dataField, `\${internal>selectedContexts}`, false)!,
			enabled: enabled,
			visible: getVisible(dataFieldContext, chartBlock)
		},
		isMenuItem,
		chartBlock,
		dataField
	);
}

function getAnnotationActions(
	chartContext: Context,
	action: AnnotationAction,
	dataFieldContext: Context,
	isMenuItem: boolean,
	chartBlock: ChartBlock
): ToolbarAction {
	const dataFieldAction = chartBlock._metaModel.createBindingContext(action.annotationPath + "/Action")!;
	const actionContext = chartBlock._metaModel.createBindingContext(CommonHelper.getActionContext(dataFieldAction));
	const actionObject = actionContext?.getObject();
	const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
	const isBound = chartBlock._metaModel.createBindingContext(isBoundPath)!.getObject();
	const dataField = dataFieldContext.getObject();
	if (!isBound || isBound.$IsBound !== true || actionObject[`@${CoreAnnotationTerms.OperationAvailable}`] !== false) {
		const enabled = getAnnotationActionsEnabled(action, isBound, dataField, chartContext, chartBlock._context);
		const dataFieldModelObjectPath = getInvolvedDataModelObjects<DataFieldAbstractTypes>(
			chartBlock._metaModel.createBindingContext(action.annotationPath) as Context
		);
		const ariaHasPopup = isDataModelObjectPathForActionWithDialog(dataFieldModelObjectPath);
		const chartOperationAvailableMap =
			escapeXMLAttributeValue(
				ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
					context: chartContext
				})
			) || "";
		return getActionToolbarAction(
			action,
			{
				id: generate([chartBlock._blockId, getInvolvedDataModelObjects(dataFieldContext)]),
				unittestid: "DataFieldForActionButtonAction",
				label: dataField.Label,
				ariaHasPopup: ariaHasPopup,
				enabled: enabled,
				visible: getVisible(dataFieldContext, chartBlock)
			},
			isMenuItem,
			chartBlock,
			dataField,
			chartOperationAvailableMap
		);
	}
	return undefined;
}

function getActionToolbarAction(
	action: (BaseAction | CustomAction) & { noWrap?: boolean },
	toolbarAction: ToolBarAction,
	isMenuItem: boolean,
	chartBlock: ChartBlock,
	dataField?: DataFieldForAction | DataFieldForIntentBasedNavigation,
	chartOperationAvailableMap?: string
): MenuItem | ActionToolbarAction {
	if (isMenuItem) {
		const pressEvent: { press: (event: Button$PressEvent) => void } | { "jsx:command": CommandProperties } = action.command
			? { "jsx:command": `cmd:${action.command}|press` as CommandProperties }
			: {
					press: (event: Button$PressEvent): void => {
						const view = CommonUtils.getTargetView(event.getSource());
						const controller = view.getController();
						if (action.type === "ForAction") {
							const params = {
								contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
								invocationGrouping:
									(dataField as DataFieldForAction)?.InvocationGrouping === OperationGroupingType.ChangeSet
										? "ChangeSet"
										: "Isolated",
								controlId: chartBlock._blockId,
								operationAvailableMap: chartOperationAvailableMap,
								model: view.getModel(),
								label: dataField?.Label as string
							};
							controller.editFlow.invokeAction(dataField?.Action as string, params);
						} else if (action.type === "ForNavigation") {
							const navigationParameters: NavigationParameters = {
								navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
							};
							if ((dataField as DataFieldForIntentBasedNavigation)?.Mapping) {
								navigationParameters.semanticObjectMapping = JSON.stringify(
									(dataField as DataFieldForIntentBasedNavigation).Mapping
								);
							}
							controller._intentBasedNavigation.navigate(
								(dataField as DataFieldForIntentBasedNavigation).SemanticObject as unknown as string,
								(dataField as DataFieldForIntentBasedNavigation).Action as unknown as string,
								navigationParameters
							);
						}
					}
			  };

		return <MenuItem text={toolbarAction.label} {...pressEvent} enabled={toolbarAction.enabled} visible={toolbarAction.visible} />;
	} else {
		return buildAction(action, toolbarAction, chartBlock, dataField, chartOperationAvailableMap);
	}
}

function buildAction(
	action: BaseAction | CustomAction,
	toolbarAction: ToolBarAction,
	chartBlock: ChartBlock,
	dataField?: DataFieldForAction | DataFieldForIntentBasedNavigation,
	chartOperationAvailableMap?: string
): ActionToolbarAction {
	return (
		<ActionToolbarAction>
			<Button
				id={toolbarAction.id}
				text={toolbarAction.label}
				ariaHasPopup={toolbarAction.ariaHasPopup}
				{...getActionPress(action, dataField, chartOperationAvailableMap, chartBlock)}
				enabled={toolbarAction.enabled}
				visible={toolbarAction.visible}
				icon={action.isAIOperation === true ? aiIcon : undefined}
			/>
		</ActionToolbarAction>
	);
}

function getActionPress(
	action: BaseAction | CustomAction,
	dataField?: DataFieldForAction | DataFieldForIntentBasedNavigation,
	chartOperationAvailableMap?: string,
	chartBlock?: ChartBlock
): { press: (event: Button$PressEvent) => void } | { "jsx:command": CommandProperties } {
	let actionPress: { press: (event: Button$PressEvent) => void } | { "jsx:command": CommandProperties } = {
		press: "" as unknown as () => void
	};

	if (action.hasOwnProperty("noWrap")) {
		if (action.command) {
			actionPress = { "jsx:command": `cmd:${action.command}|press` as CommandProperties };
		} else if ((action as CustomAction).noWrap === true) {
			actionPress = getCustomActionPress(action as CustomAction);
		} else if (!action.annotationPath) {
			actionPress = getActionPressWithAnnotationPath(action as CustomAction);
		}
	} else {
		actionPress = action.command
			? { "jsx:command": `cmd:${action.command}|press` as CommandProperties }
			: getStandardActionPressWithNoCommand(action, dataField, chartBlock, chartOperationAvailableMap);
	}

	return actionPress;
}

function getCustomActionPress(action: CustomAction): { press: (event: Button$PressEvent) => void } {
	return {
		press: (event: Button$PressEvent): void => {
			const functionName = action.handlerMethod?.split(".")[1] as string;
			const controller = { ...CommonUtils.getTargetView(event.getSource()).getController() } as unknown as {
				[method: string]: (event: Button$PressEvent) => void;
			};
			if (controller[functionName]) controller[functionName](event);
		}
	};
}

function getActionPressWithAnnotationPath(action: CustomAction): { press: (event: Button$PressEvent) => void } {
	return {
		press: (event: Button$PressEvent): void => {
			const selectedContexts = event.getSource().getBindingContext("internal")?.getProperty("selectedContexts");
			FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {
				contexts: selectedContexts
			});
		}
	};
}

function getStandardActionPressWithNoCommand(
	action: BaseAction | CustomAction,
	dataField?: DataFieldForAction | DataFieldForIntentBasedNavigation,
	chartBlock?: ChartBlock,
	chartOperationAvailableMap?: string
): { press: (event: Button$PressEvent) => void } {
	return {
		press: (event: Button$PressEvent): void => {
			const view = CommonUtils.getTargetView(event.getSource());
			const controller = view.getController();
			if (action.type === "ForAction") {
				const params = {
					contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
					invocationGrouping:
						(dataField as DataFieldForAction)?.InvocationGrouping === OperationGroupingType.ChangeSet
							? "ChangeSet"
							: "Isolated",
					controlId: chartBlock?._blockId,
					operationAvailableMap: chartOperationAvailableMap,
					model: view.getModel(),
					label: dataField?.Label as string
				};
				controller.editFlow.invokeAction(dataField?.Action as string, params);
			} else if (action.type === "ForNavigation") {
				const navigationParameters: NavigationParameters = {
					navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
				};
				if ((dataField as DataFieldForIntentBasedNavigation)?.Mapping) {
					navigationParameters.semanticObjectMapping = JSON.stringify((dataField as DataFieldForIntentBasedNavigation).Mapping);
				}
				controller._intentBasedNavigation.navigate(
					(dataField as DataFieldForIntentBasedNavigation).SemanticObject as unknown as string,
					(dataField as DataFieldForIntentBasedNavigation).Action as unknown as string,
					navigationParameters
				);
			}
		}
	};
}

function getAnnotationActionsEnabled(
	action: BaseAction,
	isBound: Record<string, boolean>,
	dataField: DataFieldForAction,
	chartContext: Context,
	context: Context
): string {
	return action.enabled !== undefined
		? action.enabled
		: ChartHelper.isDataFieldForActionButtonEnabled(
				isBound && isBound.$IsBound,
				dataField.Action as string,
				context,
				ChartHelper.getOperationAvailableMap(chartContext.getObject(), { context: chartContext }),
				action.enableOnSelect || ""
		  );
}

function getSegmentedButton(chartBlock: ChartBlock): ActionToolbarAction {
	return (
		<ActionToolbarAction
			layoutInformation={{
				aggregationName: "end",
				alignment: "End"
			}}
		>
			<SegmentedButton
				id={generate([chartBlock._blockId, "SegmentedButton", "TemplateContentView"])}
				selectionChange={(event: SegmentedButton$SelectionChangeEvent): void => {
					chartBlock.fireSegmentedButtonPressed?.(
						merge(event.getParameters(), { selectedKey: event.getSource().getSelectedKey() })
					);
				}}
				visible={notEqual(pathInModel("alpContentView", "pageInternal"), "Table")}
				selectedKey={pathInModel("alpContentView", "pageInternal")}
			>
				{{
					items: getSegmentedButtonItems()
				}}
			</SegmentedButton>
		</ActionToolbarAction>
	);
}

function getSegmentedButtonItems(): string[] {
	const segmentedButtonItems = [];
	if (CommonHelper.isDesktop()) {
		segmentedButtonItems.push(
			getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_HYBRID_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Hybrid", "sap-icon://chart-table-view")
		);
	}
	segmentedButtonItems.push(
		getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_CHART_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Chart", "sap-icon://bar-chart")
	);
	segmentedButtonItems.push(
		getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_TABLE_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Table", "sap-icon://table-view")
	);
	return segmentedButtonItems;
}

function getSegmentedButtonItem(tooltip: string, key: string, icon: string): string {
	return <SegmentedButtonItem tooltip={tooltip} key={key} icon={icon} />;
}

/**
 * Returns the annotation path pointing to the visualization annotation (Chart).
 * @param contextObjectPath The datamodel object path for the chart
 * @param converterContext The converter context
 * @returns The annotation path
 */
function getVisualizationPath(
	contextObjectPath: DataModelObjectPath<ChartType | SelectionPresentationVariant | PresentationVariant>,
	converterContext: ConverterContext
): string {
	const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

	// fallback to default Chart if metaPath is not set
	if (!metaPath) {
		Log.error(`Missing metaPath parameter for Chart`);
		return `@${UIAnnotationTerms.Chart}`;
	}

	if (contextObjectPath.targetObject?.term === UIAnnotationTerms.Chart) {
		return metaPath; // MetaPath is already pointing to a Chart
	}

	//Need to switch to the context related the PV or SPV
	const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);

	let visualizations: VisualizationAndPath[] = [];
	switch (contextObjectPath.targetObject?.term) {
		case UIAnnotationTerms.SelectionPresentationVariant:
			if (contextObjectPath.targetObject.PresentationVariant) {
				visualizations = getVisualizationsFromAnnotation(
					contextObjectPath.targetObject,
					metaPath,
					resolvedTarget.converterContext,
					true
				);
			}
			break;
		case UIAnnotationTerms.PresentationVariant:
			visualizations = getVisualizationsFromAnnotation(
				contextObjectPath.targetObject,
				metaPath,
				resolvedTarget.converterContext,
				true
			);
			break;
		default:
			break;
	}

	const chartViz = visualizations.find((viz) => {
		return viz.visualization.term === UIAnnotationTerms.Chart;
	});

	if (chartViz) {
		return chartViz.annotationPath;
	} else {
		// fallback to default Chart if annotation missing in PV
		Log.error(`Bad metaPath parameter for chart: ${contextObjectPath.targetObject?.term}`);
		return `@${UIAnnotationTerms.Chart}`;
	}
}

function getVisible(dataFieldContext: Context, chartBlock: ChartBlock): string | boolean {
	const dataField = dataFieldContext.getObject();
	if (dataField[`@${UIAnnotationTerms.Hidden}`] && dataField[`@${UIAnnotationTerms.Hidden}`].$Path) {
		const hiddenPathContext = chartBlock._metaModel.createBindingContext(
			dataFieldContext.getPath() + `/@${UIAnnotationTerms.Hidden}/$Path`,
			dataField[`@${UIAnnotationTerms.Hidden}`].$Path
		);
		return ChartHelper.getHiddenPathExpressionForTableActionsAndIBN(dataField[`@${UIAnnotationTerms.Hidden}`].$Path, {
			context: hiddenPathContext
		});
	} else if (dataField[`@${UIAnnotationTerms.Hidden}`]) {
		return !dataField[`@${UIAnnotationTerms.Hidden}`];
	} else {
		return true;
	}
}

function getChartConverterContext(
	properties: ChartBlock,
	originalViewData: Partial<ViewData>,
	contextObjectPath: DataModelObjectPath<ChartContextObjectPath>,
	diagnostics: Diagnostics,
	extraParams?: Record<string, unknown>
): ConverterContext<PageContextPathTarget> {
	let viewData = Object.assign({}, originalViewData);
	delete viewData.resourceModel;
	delete viewData.appComponent;
	viewData = deepClone(viewData);
	let controlConfiguration = {};

	// Only merge in page control configuration if the building block is on the same context
	const relativePath = getTargetObjectPath(contextObjectPath.contextLocation ?? contextObjectPath);
	const entitySetName = contextObjectPath.contextLocation?.targetEntitySet?.name ?? contextObjectPath.targetEntitySet?.name;
	if (
		relativePath === originalViewData?.contextPath ||
		relativePath === `/${originalViewData?.entitySet}` ||
		entitySetName === originalViewData?.entitySet
	) {
		controlConfiguration = viewData.controlConfiguration!;
	}
	viewData.controlConfiguration = merge(controlConfiguration, extraParams || {}) as ControlConfiguration;

	return ConverterContext.createConverterContextForMacro(
		contextObjectPath.startingEntitySet.name,
		properties._metaModel,
		diagnostics,
		merge,
		contextObjectPath.contextLocation,
		new ManifestWrapper(viewData as BaseManifestSettings)
	);
}

function getConverterContext(
	chartBlock: ChartBlock,
	viewData: ViewData,
	contextObjectPath: DataModelObjectPath<ChartContextObjectPath>,
	diagnostics: Diagnostics
): ConverterContext<PageContextPathTarget> {
	const initialConverterContext = getChartConverterContext(chartBlock, viewData, contextObjectPath, diagnostics);
	const visualizationPath = getVisualizationPath(contextObjectPath, initialConverterContext);
	const extraParams = getExtraParams(chartBlock, visualizationPath);
	return getChartConverterContext(chartBlock, viewData, contextObjectPath, diagnostics, extraParams);
}

function modifyIdentifiers(chartBlock: ChartBlock): void {
	if (chartBlock._applyIdToContent) {
		chartBlock._blockId = chartBlock.id.replace(/::Chart$/, "");
		chartBlock._contentId = chartBlock._blockId;
	} else {
		chartBlock._blockId = chartBlock.id;
		chartBlock._contentId = getContentId(chartBlock.id);
	}
}

function initialise(
	chartBlock: ChartBlock,
	viewData: ViewData,
	diagnostics: Diagnostics,
	contextObjectPath: DataModelObjectPath<ChartContextObjectPath>
): void {
	const metaContextPath = chartBlock.getMetaPathObject(chartBlock.metaPath, chartBlock._resolvedContextPath);
	chartBlock._metaModel = chartBlock._getOwner()?.preprocessorContext?.models.metaModel as ODataMetaModel;
	chartBlock._metaPathContext = chartBlock._metaModel.createBindingContext(metaContextPath!.getPath())!;
	chartBlock._context = chartBlock._metaModel.createBindingContext(chartBlock.contextPath ?? metaContextPath?.getContextPath())!;

	const converterContext = getConverterContext(chartBlock, viewData, contextObjectPath, diagnostics);
	const viewConfig = converterContext.getManifestWrapper()?.getViewConfiguration();
	const isMultiTabs = (viewConfig?.paths?.length as number) > 1;
	const hasMultipleVisualizations =
		converterContext.getManifestWrapper()?.hasMultipleVisualizations() ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
	const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart

	chartBlock._chartContext = ChartHelper.getUiChart(chartBlock._metaPathContext)!;
	chartBlock._chart = chartBlock._chartContext.getObject() as ChartType;
	chartBlock._blockActions = [];
	chartBlock._commandActions = [];
	modifyIdentifiers(chartBlock);

	if (chartBlock._chart) {
		chartBlock.chartDefinition = createChartDefinition(
			chartBlock,
			converterContext,
			contextObjectPath,
			chartBlock._chartContext.getPath()
		);
		const collection = chartBlock._metaModel.createBindingContext(chartBlock.chartDefinition.collection) as Context;
		// API Properties
		chartBlock.navigationPath = chartBlock.chartDefinition.navigationPath;
		chartBlock.autoBindOnInit = chartBlock.chartDefinition.autoBindOnInit;
		chartBlock.vizProperties = chartBlock.chartDefinition.vizProperties;
		chartBlock.chartActions = chartBlock.chartDefinition.actions;
		chartBlock.filter = getFilterBar(chartBlock);
		let personalization: ChartP13nType;
		if (chartBlock.chartDefinition?.personalization !== undefined) {
			personalization = chartBlock.chartDefinition.personalization;
		} else {
			switch (chartBlock.personalization) {
				case "false":
					personalization = undefined;
					break;
				case "true":
					personalization = Object.values(personalizationValues).join(",");
					break;
				default:
					personalization = chartBlock.personalization as string;
			}
		}
		checkPersonalizationInChartProperties(personalization, chartBlock);
		chartBlock.visible = chartBlock.chartDefinition.visible;
		let contextPath = chartBlock._context.getPath();
		contextPath = contextPath[contextPath.length - 1] === "/" ? contextPath.slice(0, -1) : contextPath;
		chartBlock.draftSupported = ModelHelper.isDraftSupported(chartBlock._metaModel, contextPath);
		chartBlock._chartType = ChartHelper.formatChartType(chartBlock._chart.ChartType);

		const operationAvailableMap = ChartHelper.getOperationAvailableMap(chartBlock._chart, {
			context: chartBlock._chartContext
		});

		if (Object.keys(chartBlock.chartDefinition?.commandActions as object).length > 0) {
			Object.keys(chartBlock.chartDefinition?.commandActions as object).forEach((key: string) => {
				const action = chartBlock.chartDefinition?.commandActions[key];
				const actionContext = createBindingContext(action);
				const dataFieldContext = action.annotationPath && chartBlock._metaModel.createBindingContext(action.annotationPath);
				const dataField = dataFieldContext && dataFieldContext.getObject();
				const chartOperationAvailableMap = escapeXMLAttributeValue(operationAvailableMap);
				pushActionCommand(actionContext, dataField, chartOperationAvailableMap, action, chartBlock);
			});
		}
		chartBlock.measures = getChartMeasures(chartBlock, aggregationHelper);
		const presentationPath = CommonHelper.createPresentationPathContext(chartBlock._metaPathContext);
		chartBlock._sortConditions = ChartHelper.getSortConditions(
			chartBlock._metaPathContext,
			chartBlock._metaPathContext.getObject(),
			presentationPath.getPath(),
			chartBlock.chartDefinition.applySupported
		);
		const chartActionsContext = chartBlock._metaModel.createBindingContext(
			chartBlock._chartContext.getPath() + "/Actions",
			chartBlock._chart.Actions as unknown as Context
		);
		const targetCollectionPath = CommonHelper.getTargetCollectionPath(collection);
		const targetCollectionPathContext = chartBlock._metaModel.createBindingContext(targetCollectionPath, collection)!;
		const actionsObject = contextObjectPath.convertedTypes.resolvePath(chartActionsContext.getPath())?.target;

		chartBlock._customData = {
			targetCollectionPath: chartBlock.chartDefinition.collection,
			entitySet:
				typeof targetCollectionPathContext.getObject() === "string"
					? targetCollectionPathContext.getObject()
					: targetCollectionPathContext.getObject("@sapui.name"),
			entityType: chartBlock.chartDefinition.collection + "/",
			operationAvailableMap: JSON.parse(operationAvailableMap),
			multiSelectDisabledActions: ActionHelper.getMultiSelectDisabledActions(actionsObject as DataFieldAbstractTypes[]) + "",
			segmentedButtonId: generate([chartBlock._blockId, "SegmentedButton", "TemplateContentView"]),
			customAgg: chartBlock.chartDefinition?.customAgg,
			transAgg: chartBlock.chartDefinition?.transAgg,
			applySupported: chartBlock.chartDefinition?.applySupported,
			vizProperties: JSON.parse(chartBlock.vizProperties),
			draftSupported: chartBlock.draftSupported,
			multiViews: chartBlock.chartDefinition?.multiViews || (!hasMultipleVisualizations && isMultiTabs),
			selectionPresentationVariantPath: {
				data: chartBlock.chartDefinition?.selectionPresentationVariantPath
			},
			chartDimensionKeyAndRole: chartBlock.chartDefinition?.chartDimensionKeyAndRole,
			chartMeasureKeyAndRole: chartBlock.chartDefinition?.chartMeasureKeyAndRole
		};
		if (chartBlock.chartDefinition.isParameterizedEntitySet) {
			chartBlock._customData.entitySet = chartBlock.chartDefinition.collection.substring(1);
		}
	} else {
		// fallback to display empty chart
		chartBlock.autoBindOnInit = false;
		chartBlock.visible = "true";
		chartBlock.navigationPath = "";

		chartBlock._customData = {
			targetCollectionPath: "",
			entitySet: "",
			entityType: "",
			operationAvailableMap: "",
			multiSelectDisabledActions: "",
			segmentedButtonId: "",
			customAgg: {},
			transAgg: {},
			applySupported: {},
			vizProperties: {}
		};
	}
}

function getFilterBar(chartBlock: ChartBlock): string | undefined {
	const filterBar = Element.getElementById(chartBlock.filterBar);
	if (chartBlock.filterBar && filterBar?.isA<MacroAPI>("sap.fe.macros.filterBar.FilterBarAPI")) {
		return getContentId(chartBlock.filterBar);
	} else if (filterBar?.isA<Control>("sap.fe.macros.controls.FilterBar")) {
		return chartBlock.filterBar;
	} else if (chartBlock.filterBar) {
		return getContentId(chartBlock.filterBar);
	}
}

function getDelegate(chartBlock: ChartBlock): object {
	if (chartBlock.chartDelegate) {
		(chartBlock.chartDelegate as ChartDelegate).payload.selectionMode =
			chartBlock.chartDefinition.selectionMode?.toUpperCase() ??
			(chartBlock.chartDelegate as ChartDelegate).payload.selectionMode ??
			"MULTIPLE";
	}
	return chartBlock.chartDelegate
		? chartBlock.chartDelegate
		: {
				name: "sap/fe/macros/chart/ChartDelegate",
				payload: {
					chartContextPath: chartBlock._customData.targetCollectionPath,
					parameters: {
						$$groupId: "$auto.Workers"
					},
					selectionMode:
						chartBlock.chartDefinition.selectionMode?.toUpperCase() ?? chartBlock.selectionMode?.toUpperCase() ?? "MULTIPLE"
				}
		  };
}

function getCustomData(chartBlock: ChartBlock): CustomData[] {
	return [
		<CustomData key={"targetCollectionPath"} value={chartBlock._customData.targetCollectionPath} />,
		<CustomData key={"entitySet"} value={chartBlock._customData.entitySet} />,
		<CustomData key={"entityType"} value={chartBlock._customData.entityType} />,
		<CustomData key={"operationAvailableMap"} value={chartBlock._customData.operationAvailableMap} />,
		<CustomData key={"multiSelectDisabledActions"} value={chartBlock._customData.multiSelectDisabledActions} />,
		<CustomData key={"segmentedButtonId"} value={chartBlock._customData.segmentedButtonId} />,
		<CustomData key={"customAgg"} value={chartBlock._customData.customAgg} />,
		<CustomData key={"transAgg"} value={chartBlock._customData.transAgg} />,
		<CustomData key={"applySupported"} value={chartBlock._customData.applySupported} />,
		<CustomData key={"vizProperties"} value={chartBlock._customData.vizProperties} />,
		<CustomData key={"draftSupported"} value={chartBlock._customData.draftSupported} />,
		<CustomData key={"multiViews"} value={chartBlock._customData.multiViews} />,
		<CustomData key={"selectionPresentationVariantPath"} value={chartBlock._customData.selectionPresentationVariantPath} />,
		<CustomData key={"chartDimensionKeyAndRole"} value={chartBlock._customData.chartDimensionKeyAndRole} />,
		<CustomData key={"chartMeasureKeyAndRole"} value={chartBlock._customData.chartMeasureKeyAndRole} />
	];
}

function getNoData(chartBlock: ChartBlock): IllustratedMessage | undefined {
	if (chartBlock._customData.targetCollectionPath === "") {
		return;
	}
	return (
		<IllustratedMessage
			illustrationSize={IllustratedMessageSize.Auto}
			illustrationType={IllustratedMessageType.BeforeSearch}
			title={chartBlock.getTranslatedText("T_TABLE_AND_CHART_NO_DATA_TITLE_TEXT")}
			description={chartBlock.getTranslatedText("T_TABLE_AND_CHART_NO_DATA_TEXT")}
			enableDefaultTitleAndDescription={false}
			enableVerticalResponsiveness={true}
		></IllustratedMessage>
	);
}

export function getMdcChartTemplate(
	chartBlock: ChartBlock,
	viewData: ViewData,
	diagnostics: Diagnostics,
	contextObjectPath: DataModelObjectPath<ChartContextObjectPath>
): MdcChart {
	initialise(chartBlock, viewData, diagnostics, contextObjectPath);
	chartBlock.layoutData = <FlexItemData growFactor="1" shrinkFactor="1" />;

	return (
		<MdcChart
			binding={{ internal: "controls/" + chartBlock._blockId }}
			id={chartBlock._contentId}
			chartType={chartBlock._chartType}
			sortConditions={chartBlock._sortConditions}
			header={chartBlock.chartDefinition.header ?? chartBlock.header ?? chartBlock._chart?.Title?.toString() ?? ""}
			headerVisible={chartBlock.chartDefinition.headerVisible ?? chartBlock.headerVisible}
			minHeight={Device.system.phone ? "80vh" : "400px"}
			height="100%"
			width="100%"
			headerLevel={chartBlock.headerLevel}
			headerStyle={chartBlock.headerStyle}
			p13nMode={(chartBlock._personalization! as string)?.split(",")}
			filter={chartBlock.filter}
			noDataText={
				chartBlock._customData.targetCollectionPath === ""
					? chartBlock.getTranslatedText("M_CHART_NO_ANNOTATION_SET_TEXT")
					: chartBlock.noDataText
			}
			autoBindOnInit={chartBlock.autoBindOnInit}
			delegate={getDelegate(chartBlock)}
			visible={chartBlock.visible}
		>
			{{
				customData: getCustomData(chartBlock),
				dependents: [getDependents(chartBlock, chartBlock._chartContext), getPersistenceProvider(chartBlock)],
				items: getItems(chartBlock),
				actions: chartBlock.chartActions ? getToolbarActions(chartBlock) : chartBlock._blockActions,
				variant: createVariantManagement(chartBlock),
				noData: getNoData(chartBlock)
			}}
		</MdcChart>
	);
}

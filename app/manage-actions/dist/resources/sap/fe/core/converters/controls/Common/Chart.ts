import type { Property, PropertyPath } from "@sap-ux/vocabularies-types";
import type { AggregatablePropertyType, AggregationMethod } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import { AggregationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import type {
	Chart,
	DataFieldAbstractTypes,
	DataFieldForActionGroup,
	DataFieldForActionGroupTypes,
	DataFieldForActionTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, equal, getExpressionFromAnnotation, not, type BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { isDataFieldForActionAbstract } from "sap/fe/core/converters/annotations/DataField";
import type {
	AnnotationAction,
	AnnotationActionActionGroup,
	BaseAction,
	CombinedAction,
	CustomAction,
	OverrideTypeAction
} from "sap/fe/core/converters/controls/Common/Action";
import { getActionsFromManifest, isActionAIOperation, isMenuAIOperation } from "sap/fe/core/converters/controls/Common/Action";
import { OverrideType, insertCustomElements } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Library from "sap/ui/core/Lib";
import type { ExpandPathType } from "../../../../../../../../../types/metamodel_types";
import type ConverterContext from "../../ConverterContext";
import type { ChartManifestConfiguration, ManifestAction } from "../../ManifestSettings";
import { ActionType, TemplateType, VariantManagementType, VisualizationType } from "../../ManifestSettings";
import type ManifestWrapper from "../../ManifestWrapper";
import { AggregationHelper } from "../../helpers/Aggregation";
import { getChartID, getFilterBarID } from "../../helpers/ID";
import { getInsightsEnablement, getInsightsVisibility } from "../../helpers/InsightsHelpers";
import type { ActualVisualizationAnnotations } from "./DataVisualization";

export type ChartApplySupported = {
	$Type: string;
	enableSearch?: boolean;
	AggregatableProperties?: (ExpandPathType<PropertyPath> & { Property: ExpandPathType<PropertyPath> })[];
	GroupableProperties?: (ExpandPathType<PropertyPath> & { Property: ExpandPathType<PropertyPath> })[];
};
export type ChartTemplateVisualization = {
	type: VisualizationType.Chart;
	id: string;
	apiId: string;
	entityName: string;
	collection: string;
	annotationPath: string;
	applySupported: ChartApplySupported;
	isParameterizedEntitySet?: boolean;
};

/**
 * @typedef ChartVisualization
 */
export type ChartVisualization = ChartTemplateVisualization & {
	entityName: string;
	personalization?: string | boolean;
	navigationPath: string;
	filterId?: string;
	vizProperties: string;
	actions: BaseAction[];
	commandActions: Record<string, CustomAction>;
	title: string | undefined;
	autoBindOnInit: boolean | undefined;
	onSegmentedButtonPressed: string;
	visible: string;
	customAgg: object;
	transAgg: object;
	multiViews?: boolean;
	variantManagement: VariantManagementType;
	selectionPresentationVariantPath?: string;
	isInsightsEnabled?: BindingToolkitExpression<boolean>;
	isInsightsVisible?: BindingToolkitExpression<boolean>;
	header?: string;
	headerVisible?: boolean;
	selectionMode?: string;
	chartDimensionKeyAndRole?: object;
	chartMeasureKeyAndRole?: object;
};

export type ChartP13nType = string | boolean | undefined;

/**
 * Method to retrieve all chart actions from annotations.
 * @param chartAnnotation
 * @param visualizationPath
 * @param converterContext
 * @returns The chart actions from the annotation
 */
function getChartActionsFromAnnotations(
	chartAnnotation: Chart,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): Array<AnnotationAction | AnnotationActionActionGroup> {
	const chartActions: Array<AnnotationAction | AnnotationActionActionGroup> = [];
	if (chartAnnotation?.Actions) {
		chartAnnotation.Actions.forEach((dataField: DataFieldAbstractTypes | DataFieldForActionGroupTypes) => {
			const key = KeyHelper.generateKeyFromDataField(dataField);
			if (isDataFieldForActionAbstract(dataField) && !dataField.Inline && !dataField.Determining) {
				switch (dataField.$Type) {
					case UIAnnotationTypes.DataFieldForAction:
						if (dataField.ActionTarget && !dataField.ActionTarget.isBound) {
							chartActions.push({
								type: ActionType.DataFieldForAction,
								annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
								key,
								visible: getCompileExpressionForAction(dataField, converterContext),
								isAIOperation: isActionAIOperation(dataField) === true || undefined
							});
						}
						break;

					case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
						chartActions.push({
							type: ActionType.DataFieldForIntentBasedNavigation,
							annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
							key,
							visible: getCompileExpressionForAction(dataField, converterContext),
							isNavigable: true
						});
						break;
				}
			}

			if (isAnnotationActionGroup(dataField)) {
				chartActions.push({
					type: ActionType.Menu,
					text: dataField.Label?.toString(),
					visible: getCompileExpressionForAction(dataField, converterContext),
					menu: dataField.Actions.map((action) =>
						getDataFieldAnnotationAction(action as DataFieldForActionTypes, converterContext)
					),
					key: KeyHelper.generateKeyFromDataField(dataField),
					isAIOperation: isMenuAIOperation(dataField.Actions) === true || undefined
				} as AnnotationActionActionGroup);
			}
		});
	}
	return chartActions;
}
/**
 * Checks if the dataField is a DataFieldForActionGroup.
 * @param dataField The dataField to check.
 * @returns The dataField if it matches DataFieldForActionGroup.
 */
function isAnnotationActionGroup(dataField: DataFieldAbstractTypes): dataField is DataFieldForActionGroup {
	return dataField.$Type === UIAnnotationTypes.DataFieldForActionGroup;
}

/**
 * Creates and returns DataFieldForAction for menu of DataFieldForActionGroup.
 * @param dataField The datafield to get the annotation action from.
 * @param converterContext The converter context.
 * @returns An annotation action.
 */
function getDataFieldAnnotationAction(
	dataField: DataFieldForActionTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): AnnotationAction {
	return {
		type: ActionType.DataFieldForAction,
		annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
		key: KeyHelper.generateKeyFromDataField(dataField),
		visible: getCompileExpressionForAction(dataField, converterContext)
	};
}

export function getChartActions(
	chartAnnotation: Chart,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): CombinedAction {
	const aAnnotationActions = getChartActionsFromAnnotations(chartAnnotation, visualizationPath, converterContext);
	const manifestActions = getActionsFromManifest(
		converterContext.getManifestControlConfiguration<ChartManifestConfiguration>(visualizationPath).actions as Record<
			string,
			ManifestAction
		>,
		converterContext,
		aAnnotationActions
	);
	const actionOverwriteConfig: OverrideTypeAction = {
		enabled: OverrideType.overwrite,
		enableOnSelect: OverrideType.overwrite,
		visible: OverrideType.overwrite,
		command: OverrideType.overwrite,
		position: OverrideType.overwrite
	};
	const chartActions = insertCustomElements<BaseAction>(aAnnotationActions, manifestActions.actions, actionOverwriteConfig);
	return {
		actions: chartActions,
		commandActions: manifestActions.commandActions
	};
}

export function getP13nMode(
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): string | boolean | undefined {
	const manifestWrapper: ManifestWrapper = converterContext.getManifestWrapper();
	const chartManifestSettings: ChartManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	const variantManagement: VariantManagementType = manifestWrapper.getVariantManagement();
	const aPersonalization: string[] = [];
	// Personalization configured in manifest.
	const personalization = chartManifestSettings?.chartSettings?.personalization;
	const isControlVariant = variantManagement === VariantManagementType.Control ? true : false;
	// if personalization is set to false do not show any option
	if ((personalization !== undefined && !personalization) || personalization == "false") {
		return false;
	}
	if (typeof personalization === "object") {
		// Specific personalization options enabled in manifest. Use them as is.
		if (personalization.type) {
			aPersonalization.push("Type");
		}
		if (personalization.item) {
			aPersonalization.push("Item");
		}
		if (personalization.sort) {
			aPersonalization.push("Sort");
		}
		if (personalization.filter) {
			aPersonalization.push("Filter");
		}
		return aPersonalization.join(",");
	} else if (isControlVariant || !!personalization) {
		// manifest has personalization configured, check if it's true
		// if manifest doesn't have personalization, check for variant management is set to control
		return "Sort,Type,Item,Filter";
	} else {
		// if manifest doesn't have personalization, show default options without filter
		return "Sort,Type,Item";
	}
}

export function getHeaderInfo(
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): { header: string | undefined; headerVisible: boolean | undefined } {
	const chartManifestSettings: ChartManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	return {
		header: chartManifestSettings.chartSettings?.header,
		headerVisible: chartManifestSettings?.chartSettings?.headerVisible
	};
}

export function getSelectionMode(
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): "Multiple" | "Single" | "None" | undefined {
	const chartManifestSettings: ChartManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	return chartManifestSettings.chartSettings?.selectionMode;
}
export type ChartCustomAggregate = {
	name: string;
	label: string;
	sortable: boolean;
	sortOrder: "both";
	contextDefiningProperty: string[];
};

export type TransAgg = {
	name: string;
	propertyPath: string;
	aggregationMethod: AggregationMethod;
	label: string;
	sortable: boolean;
	sortOrder: "both";
	custom: boolean;
};
function getAggregatablePropertiesObject(aggProp: AggregatablePropertyType | Property): { Property: { $PropertyPath: string } } {
	let obj;
	if ((aggProp as AggregatablePropertyType)?.Property) {
		obj = {
			Property: {
				$PropertyPath: (aggProp as AggregatablePropertyType)?.Property?.value
			}
		};
	} else {
		obj = {
			Property: {
				$PropertyPath: (aggProp as Property)?.name
			}
		};
	}
	return obj;
}
/**
 * Create the ChartVisualization configuration that will be used to display a chart using the Chart building block.
 * @param chartAnnotation The targeted chart annotation
 * @param visualizationPath The path of the visualization annotation
 * @param converterContext The converter context
 * @param doNotCheckApplySupported Flag that indicates whether ApplySupported needs to be checked or not
 * @param selectionPresentationVariantPath
 * @returns The chart visualization based on the annotation
 */
export function createChartVisualization(
	chartAnnotation: Chart,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	doNotCheckApplySupported?: boolean,
	selectionPresentationVariantPath?: string
): ChartVisualization {
	const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart
	if (!doNotCheckApplySupported && !aggregationHelper.isAnalyticsSupported()) {
		throw new Error("ApplySupported is not added to the annotations");
	}
	const aTransAggregations = aggregationHelper.getTransAggregations();
	const aCustomAggregates = aggregationHelper.getCustomAggregateDefinitions();
	const pageManifestSettings: ManifestWrapper = converterContext.getManifestWrapper();
	const variantManagement: VariantManagementType = pageManifestSettings.getVariantManagement();
	const p13nMode: ChartP13nType = getP13nMode(visualizationPath, converterContext);
	if (p13nMode === undefined && variantManagement === "Control") {
		Log.warning("Variant Management cannot be enabled when personalization is disabled");
	}
	const mCustomAggregates: Record<string, object> = {};
	if (aCustomAggregates) {
		const entityType = aggregationHelper.getEntityType();
		for (const customAggregate of aCustomAggregates) {
			const aContextDefiningProperties = customAggregate?.annotations?.Aggregation?.ContextDefiningProperties;
			const qualifier = customAggregate?.qualifier;
			const relatedCustomAggregateProperty = qualifier && entityType.entityProperties.find((property) => property.name === qualifier);
			const label = relatedCustomAggregateProperty && relatedCustomAggregateProperty?.annotations?.Common?.Label?.toString();
			mCustomAggregates[qualifier] = {
				name: qualifier,
				label: label || `Custom Aggregate (${qualifier})`,
				sortable: true,
				sortOrder: "both",
				contextDefiningProperty: aContextDefiningProperties
					? aContextDefiningProperties.map((oCtxDefProperty) => {
							return oCtxDefProperty.value;
					  })
					: []
			};
		}
	}

	const mTransAggregations: Record<string, TransAgg> = {};
	const oResourceBundleCore = Library.getResourceBundleFor("sap.fe.core")!;
	if (aTransAggregations) {
		for (const element of aTransAggregations) {
			mTransAggregations[element.Name as string] = {
				name: element.Name as string,
				propertyPath: element.AggregatableProperty.value,
				aggregationMethod: element.AggregationMethod,
				label: element?.annotations?.Common?.Label
					? element?.annotations?.Common?.Label?.toString()
					: `${oResourceBundleCore.getText("AGGREGATABLE_PROPERTY")} (${element.Name})`,
				sortable: true,
				sortOrder: "both",
				custom: false
			};
		}
	}

	const aAggProps = aggregationHelper.getAggregatableProperties();
	const aGrpProps = aggregationHelper.getGroupableProperties();
	const mApplySupported = {} as ChartApplySupported;
	mApplySupported.$Type = AggregationAnnotationTypes.ApplySupportedType;
	mApplySupported.AggregatableProperties = [];
	mApplySupported.GroupableProperties = [];

	if (aAggProps) {
		mApplySupported.AggregatableProperties = aAggProps.map((prop) =>
			getAggregatablePropertiesObject(prop)
		) as (ExpandPathType<PropertyPath> & { Property: ExpandPathType<PropertyPath> })[];
	}

	if (aGrpProps) {
		mApplySupported.GroupableProperties = aGrpProps.map((prop) => ({
			["$PropertyPath"]: prop.value
		})) as (ExpandPathType<PropertyPath> & { Property: ExpandPathType<PropertyPath> })[];
	}

	const chartActions = getChartActions(chartAnnotation, visualizationPath, converterContext);
	let [navigationPropertyPath /*, annotationPath*/] = visualizationPath.split("@");
	if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
		// Drop trailing slash
		navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
	}
	const title = chartAnnotation.Title?.toString() || ""; // read title from chart annotation
	const dataModelPath = converterContext.getDataModelObjectPath();
	const isEntitySet: boolean = navigationPropertyPath.length === 0;
	const entityName: string = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
	const sFilterbarId = isEntitySet ? getFilterBarID(converterContext.getContextPath()) : undefined;
	const oVizProperties = {
		plotArea: {
			window: {
				start: "firstDataPoint",
				end: "lastDataPoint"
			}
		},
		legendGroup: {
			layout: {
				position: "bottom"
			}
		}
	};
	let autoBindOnInit: boolean | undefined;
	if (converterContext.getTemplateType() === TemplateType.ObjectPage) {
		autoBindOnInit = true;
	} else if (
		converterContext.getTemplateType() === TemplateType.ListReport ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage
	) {
		autoBindOnInit = false;
	}
	const hasMultipleVisualizations =
		converterContext.getManifestWrapper().hasMultipleVisualizations() ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
	const onSegmentedButtonPressed = hasMultipleVisualizations ? ".handlers.onSegmentedButtonPressed" : "";
	const visible = hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true";
	const allowedTransformations = aggregationHelper.getAllowedTransformations();
	mApplySupported.enableSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
	let qualifier = "";
	if (chartAnnotation.fullyQualifiedName.split("#").length > 1) {
		qualifier = chartAnnotation.fullyQualifiedName.split("#")[1];
	}
	const isInsightsVisible = getInsightsVisibility("Analytical", converterContext, visualizationPath);
	const isParameterizedEntitySet = converterContext.getParameterEntityType() ? true : false;
	const isInsightsEnabled = and(getInsightsEnablement(), isInsightsVisible);
	const { header, headerVisible } = getHeaderInfo(visualizationPath, converterContext);
	const selectionMode = getSelectionMode(visualizationPath, converterContext);
	const chartDimensionKeyAndRole: Record<string, string>[] = [];
	chartAnnotation?.DimensionAttributes?.forEach((dimensionAttribute) => {
		const obj: Record<string, string> = {};
		obj[dimensionAttribute?.Dimension?.value as string] = dimensionAttribute?.Role as string;
		chartDimensionKeyAndRole.push(obj);
	});

	const chartMeasureKeyAndRole: Record<string, string>[] = [];
	chartAnnotation?.MeasureAttributes?.forEach((measureAttribute) => {
		const obj: Record<string, string> = {};
		obj[measureAttribute?.Measure?.value as string] = measureAttribute?.Role as string;
		chartMeasureKeyAndRole.push({});
	});
	return {
		type: VisualizationType.Chart,
		id: qualifier
			? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart)
			: getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
		collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
		apiId: generate([
			qualifier
				? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart)
				: getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
			"Chart"
		]),
		entityName: entityName,
		personalization: getP13nMode(visualizationPath, converterContext),
		navigationPath: navigationPropertyPath,
		annotationPath: converterContext.getAbsoluteAnnotationPath(visualizationPath),
		filterId: sFilterbarId,
		vizProperties: JSON.stringify(oVizProperties),
		actions: chartActions.actions,
		commandActions: chartActions.commandActions,
		title: title,
		autoBindOnInit: autoBindOnInit,
		onSegmentedButtonPressed: onSegmentedButtonPressed,
		visible: visible,
		customAgg: mCustomAggregates,
		transAgg: mTransAggregations,
		applySupported: mApplySupported,
		selectionPresentationVariantPath,
		variantManagement: findVariantManagement(p13nMode, variantManagement),
		isInsightsEnabled: isInsightsEnabled,
		isInsightsVisible: isInsightsVisible,
		isParameterizedEntitySet: isParameterizedEntitySet,
		header: header,
		headerVisible: headerVisible,
		selectionMode: selectionMode,
		chartDimensionKeyAndRole: chartDimensionKeyAndRole,
		chartMeasureKeyAndRole: chartMeasureKeyAndRole
	};
}
/**
 * Method to determine the variant management.
 * @param p13nMode
 * @param variantManagement
 * @returns The variant management for the chart
 */
function findVariantManagement(p13nMode: ChartP13nType, variantManagement: VariantManagementType): VariantManagementType {
	return variantManagement === "Control" && !p13nMode ? VariantManagementType.None : variantManagement;
}

/**
 * Create the ChartVisualization configuration that will be used to during templating.
 * @param converterContext The converter context
 * @param visualizationPath The path of the visualization annotation
 * @param visualization The visualization annotation
 * @returns The chart visualization based on the annotation used for templating
 */
export function createChartVisualizationForTemplating(
	converterContext: ConverterContext<PageContextPathTarget>,
	visualizationPath: string,
	visualization: ActualVisualizationAnnotations
): ChartTemplateVisualization {
	const qualifier = visualization.fullyQualifiedName.split("#").length > 1 ? visualization.fullyQualifiedName.split("#")[1] : "";
	const [navigationPropertyPath] = visualizationPath.split("@");

	const dataModelPath = converterContext.getDataModelObjectPath();
	const isEntitySet: boolean = navigationPropertyPath.length === 0;
	const entityName: string = dataModelPath.targetEntitySet?.name ?? dataModelPath.startingEntitySet.name;
	const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true);
	const allowedTransformations = aggregationHelper.getAllowedTransformations();
	const isParameterizedEntitySet = !!converterContext.getParameterEntityType();
	return {
		annotationPath: converterContext.getAbsoluteAnnotationPath(visualizationPath),
		isParameterizedEntitySet,
		collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
		type: VisualizationType.Chart,
		entityName,
		id: qualifier
			? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart)
			: getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
		apiId: generate([
			qualifier
				? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart)
				: getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
			"Chart"
		]),
		applySupported: {
			$Type: "Org.OData.Aggregation.V1.ApplySupportedType",
			enableSearch: allowedTransformations?.includes("search") ?? true
		}
	};
}

/**
 * Method to get compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation.
 * @param dataField
 * @param converterContext
 * @returns Compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation
 */
function getCompileExpressionForAction(
	dataField: DataFieldAbstractTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): CompiledBindingToolkitExpression {
	return compileExpression(
		not(
			equal(
				getExpressionFromAnnotation(
					dataField.annotations?.UI?.Hidden,
					[],
					undefined,
					converterContext.getRelativeModelPathFunction()
				),
				true
			)
		)
	);
}

export function createBlankChartVisualization(converterContext: ConverterContext<PageContextPathTarget>): ChartVisualization {
	const hasMultipleVisualizations =
		converterContext.getManifestWrapper().hasMultipleVisualizations() ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
	const dataModelPath = converterContext.getDataModelObjectPath();
	const entityName = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;

	const visualization: ChartVisualization = {
		type: VisualizationType.Chart,
		id: getChartID(entityName, VisualizationType.Chart),
		apiId: generate([getChartID(entityName, VisualizationType.Chart), "Chart"]),
		entityName: entityName,
		title: "",
		collection: "",
		personalization: undefined,
		navigationPath: "",
		annotationPath: "",
		vizProperties: JSON.stringify({
			legendGroup: {
				layout: {
					position: "bottom"
				}
			}
		}),
		actions: [],
		commandActions: {},
		autoBindOnInit: false,
		onSegmentedButtonPressed: "",
		visible: hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true",
		customAgg: {},
		transAgg: {},
		applySupported: {
			$Type: "Org.OData.Aggregation.V1.ApplySupportedType",
			AggregatableProperties: [],
			GroupableProperties: [],
			enableSearch: false
		},
		multiViews: false,
		variantManagement: VariantManagementType.None
	};

	return visualization;
}

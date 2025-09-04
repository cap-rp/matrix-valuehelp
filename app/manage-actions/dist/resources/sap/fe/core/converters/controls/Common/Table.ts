import type { EntitySet, EntityType, PathAnnotationExpression, PropertyAnnotationValue, PropertyPath } from "@sap-ux/vocabularies-types";
import type { EntitySetAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import type { EntitySetAnnotations_Session } from "@sap-ux/vocabularies-types/vocabularies/Session_Edm";
import type {
	Criticality,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldForActionAbstractTypes,
	DataFieldForActionGroup,
	DataFieldForActionTypes,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	FieldGroup,
	LineItem,
	PresentationVariantType,
	SelectOptionType,
	SelectionVariant,
	SelectionVariantType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	getExpressionFromAnnotation,
	ifElse,
	isConstant,
	not,
	or,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import {
	isDataField,
	isDataFieldForActionAbstract,
	isDataFieldForActionGroup,
	visibleExpression
} from "sap/fe/core/converters/annotations/DataField";
import type {
	AnnotationAction,
	AnnotationActionGroup,
	BaseAction,
	CombinedAction,
	CustomAction,
	OverrideTypeAction
} from "sap/fe/core/converters/controls/Common/Action";
import {
	addCollaborationCondition,
	dataFieldIsCopyAction,
	getActionsFromManifest,
	getAnnotationMenuActionItems,
	getCopyAction,
	getEnabledForAnnotationAction,
	getMatchingManifestAction,
	getVisibilityEnablementMenuActions,
	isActionAIOperation,
	isMenuAIOperation,
	prepareMenuActions,
	removeDuplicateActions
} from "sap/fe/core/converters/controls/Common/Action";
import { OverrideType, Placement, insertCustomElements } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { IssueCategory, IssueSeverity, IssueType } from "sap/fe/core/converters/helpers/IssueManager";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { Entity, UI } from "sap/fe/core/helpers/BindingHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfType, isNavigationProperty, isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { criticalityExpressionForIntegrationCards } from "sap/fe/core/templating/CriticalityFormatters";
import {
	getHierarchyParentNavigationPropertyPath,
	getNonUpdatableNavigationProperties,
	getTargetObjectPath,
	isPathDeletable,
	isPathSearchable,
	isPathUpdatable,
	type DataModelObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { getRestrictionsOnProperties } from "sap/fe/core/templating/EntitySetHelper";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import tableFormatters from "sap/fe/macros/formatters/TableFormatter";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import ActionHelper from "sap/fe/macros/internal/helpers/ActionHelper";
import Library from "sap/ui/core/Lib";
import MessageType from "sap/ui/core/message/MessageType";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type ConverterContext from "../../ConverterContext";
import type {
	ManifestAction,
	NavigationSettingsConfiguration,
	NavigationTargetConfiguration,
	TableManifestConfiguration,
	TableManifestSettingsConfiguration
} from "../../ManifestSettings";
import {
	ActionType,
	CreationMode,
	OperationGroupingMode,
	SelectionMode,
	TemplateType,
	VariantManagementType,
	VisualizationType
} from "../../ManifestSettings";
import type ManifestWrapper from "../../ManifestWrapper";
import { AggregationHelper } from "../../helpers/Aggregation";
import { getTableID } from "../../helpers/ID";
import { getMessageTypeFromCriticalityType } from "./Criticality";
import {
	ColumnType,
	findColumnByPath,
	getColumnsFromEntityType,
	getRequiredProperties,
	getTableColumns,
	updateLinkedProperties,
	type AnnotationTableColumn,
	type ExtensionForAnalytics,
	type TableColumn
} from "./table/Columns";
import type { StandardAction } from "./table/StandardActions";
import {
	StandardActionKeys,
	generateStandardActionsContext,
	getCreationRow,
	getCutVisibility,
	getDeleteVisibility,
	getInsertUpdateActionsTemplating,
	getMassEditVisibility,
	getRestrictions,
	getStandardActionCopy,
	getStandardActionCreate,
	getStandardActionCut,
	getStandardActionDelete,
	getStandardActionInsights,
	getStandardActionMassEdit,
	getStandardActionMoveUpDown,
	getStandardActionPaste,
	isDraftOrStickySupported,
	isInDisplayMode
} from "./table/StandardActions";

type UploadTableSettings = {
	stream: string;
	fileName?: string;
	fileNameMaxLength?: int;
	acceptableMediaTypes?: string[];
	maxLength?: int;
	uploadAction?: StandardAction;
};

type RowNavigationInfo =
	| {
			type: "Outbound";
			navigationTarget: string;
			navigationInEditMode?: boolean;
	  }
	| {
			type: "Navigation";
			targetPath: string;
			checkEditable: boolean;
			recreateContext: boolean;
			routePath: string;
			navigationInEditMode?: boolean;
	  };

type RowConfiguration = {
	actionType?: string;
	navigationInfo?: RowNavigationInfo;
	rowHighlighting: CompiledBindingToolkitExpression;
	rowNavigated: CompiledBindingToolkitExpression;
	rowCriticalityForInsights?: CompiledBindingToolkitExpression;
	visible?: CompiledBindingToolkitExpression;
};

export type MassEditTableConfiguration = {
	enabled: boolean;
	visibleFields: string[];
	ignoredFields: string[];
	operationGroupingMode: OperationGroupingMode;
	customFragment?: string | FormContainer;
	fromInline?: boolean;
};

type TableSortConditions = {
	sorters: {
		name: string;
		descending: boolean;
	}[];
};

type TableGroupConditions = {
	groupLevels: { name: string }[];
};

type TableAggregateConditions = Record<string, object>;

type TableP13nMode = "Aggregate" | "Column" | "Filter" | "Group" | "Sort";

export type AnalyticalConfiguration = {
	aggregationOnLeafLevel?: boolean;
};

export type TableAnnotationConfiguration = {
	collection: string;
	variantManagement: VariantManagementType;
	filterId?: string;
	id: string;
	apiId: string;
	navigationPath: string;
	p13nMode?: TableP13nMode[];
	row?: RowConfiguration;
	selectionMode: string | undefined;
	isInsertUpdateActionsTemplated: boolean;
	updatablePropertyPath: string;
	displayMode?: boolean;
	threshold: number;
	entityName: string;
	entityTypeName: string;
	sortConditions?: TableSortConditions;
	groupConditions?: TableGroupConditions;
	aggregateConditions?: TableAggregateConditions;
	initialExpansionLevel?: number;
	allowDropBetweenNodes?: boolean;
	changeSiblingForRootsSupported?: boolean;
	/** Create new entries */
	create: CreateBehavior | CreateBehaviorExternal;
	title: string | undefined;
	searchable: boolean;
	requiredProperties?: string[];
	uploadTable?: UploadTableSettings;
};
/**
 * New entries are created within the app (default case)
 */
export type CreateBehavior = {
	mode: CreationMode;
	append: boolean;
	newAction?: string;
	navigateToTarget?: string;
};

export type ExternalMethodConfig = {
	moduleName: string;
	methodName: string;
};
/**
 * New entries are created by navigating to some target
 */
export type CreateBehaviorExternal = {
	mode: "External";
	outbound: string;
	outboundDetail: NavigationTargetConfiguration["outboundDetail"];
};
export type TableCapabilityRestriction = {
	isDeletable: boolean;
	isUpdatable: boolean;
};
export type TableFiltersConfiguration = {
	paths: {
		annotationPath: string;
	}[];
	showCounts?: boolean;
};
export type SelectionVariantConfiguration = {
	propertyNames: string[];
	text?: string;
};

export type TableControlConfiguration = {
	disableRequestCache?: boolean;
	createAtEnd: boolean;
	createInPlace?: boolean;
	creationMode: CreationMode;
	outboundCreation?: string;
	disableAddRowButtonForEmptyData: boolean;
	customValidationFunction: string | undefined;
	useCondensedTableLayout: boolean;
	enableExport: boolean;
	enablePastingOfComputedProperties?: boolean;
	frozenColumnCount?: number;
	widthIncludingColumnHeader?: boolean;
	header?: string;
	headerVisible?: boolean;
	filters?: Partial<Record<"quickFilters" | "hiddenFilters", TableFiltersConfiguration>>;
	type: TableType;
	rowCountMode?: TableRowCountMode;
	rowCount?: number;
	scrollThreshold?: number;
	selectAll?: boolean;
	selectionLimit: number;
	multiSelectMode: string | undefined;
	enablePaste: boolean;
	ignoredFields?: string;
	readOnly?: boolean;
	disableCopyToClipboard?: boolean;
	enableFullScreen: boolean;
	showRowCount: boolean;
	inlineCreationRowCount?: number;
	inlineCreationRowsHiddenInEditMode?: boolean;
	massEdit: MassEditTableConfiguration;
	enableAutoColumnWidth: boolean;
	hasDataStateIndicatorFilter: boolean;
	isCompactType?: boolean;
	hierarchyQualifier?: string;
	isHierarchyParentNodeUpdatable?: boolean;
	enableAddCardToInsights?: boolean | undefined;
	creationDialogFields?: string[];
	nodeType?: {
		propertyName: string;
		values: { value: string; text: string; creationDialogFields?: string[] }[];
	};
	createEnablement?: ExternalMethodConfig;
	isNodeMovable?: ExternalMethodConfig;
	isNodeCopyable?: ExternalMethodConfig;
	isMoveToPositionAllowed?: ExternalMethodConfig;
	isCopyToPositionAllowed?: ExternalMethodConfig;
	selectionChange?: string;
	additionalRequiredModules?: string[];
	rowPress?: string;
	beforeRebindTable?: string;
	exportRequestSize?: number;
	enableUploadPlugin?: boolean;
	modeForNoDataMessage?: string;
	analyticalConfiguration?: AnalyticalConfiguration;
};
export type TableType = "GridTable" | "ResponsiveTable" | "AnalyticalTable" | "TreeTable";
export type TableRowCountMode = "Auto" | "Fixed" | "Interactive";

export type InternalExtensionForAnalytics = ExtensionForAnalytics & {
	fromGroupableProperty: boolean;
	relativePath: string;
};
export type TableVisualization = {
	type: VisualizationType.Table;
	annotation: TableAnnotationConfiguration;
	control: TableControlConfiguration;
	columns: TableColumn[];
	actions: BaseAction[];
	commandActions?: Record<string, CustomAction>;
	analyticsExtensions?: Record<string, InternalExtensionForAnalytics>;
	requestAtLeast: RequestAtLeast;
	enableAnalytics?: boolean;
	enableBasicSearch?: boolean;
	operationAvailableMap: string;
	operationAvailableProperties: string;
	headerInfoTitle: string;
	semanticKeys: string[];
	headerInfoTypeName: PropertyAnnotationValue<String> | undefined;
	enable$select: boolean;
	enable$$getKeepAliveContext: boolean;
	isInsightsEnabled?: boolean;
	header?: string;
	headerVisible?: boolean;
	handlePatchSent: boolean;
};

/**
 * Returns an array of all standard, annotation-based, and manifest-based table actions.
 * @param lineItemAnnotation
 * @param visualizationPath
 * @param converterContext
 * @param standardActions
 * @param navigationSettings
 * @returns The complete table actions
 */
export function getTableActions(
	lineItemAnnotation: LineItem,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	standardActions: StandardActionsConfiguration["standardActions"],
	navigationSettings?: NavigationSettingsConfiguration
): CombinedAction {
	// 1. Get actions from annotations
	const isCollaborationEnabled = ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext);

	const tableActions = getTableAnnotationActions(lineItemAnnotation, visualizationPath, converterContext);
	// 2. Get actions from manifest
	const manifestActions = getActionsFromManifest(
		converterContext.getManifestControlConfiguration<TableManifestConfiguration>(visualizationPath).actions as Record<
			string,
			ManifestAction
		>,
		converterContext,
		tableActions.tableActions,
		navigationSettings,
		true
	);
	// The "Copy" action always needs to be placed after the "Create" action, so we need to separate it
	const copyActions = tableActions.tableActions.filter((a) => a.type === ActionType.Copy);
	const annotationActions = tableActions.tableActions.filter((a) => a.type !== ActionType.Copy);
	// Combine standard, annotation, and custom actions together, respecting the fixed order of standard actions
	const annotationAndStandardActions = (
		[
			...annotationActions,
			standardActions.create,
			...copyActions,
			standardActions.delete,
			standardActions.massEdit,
			standardActions.insights,
			standardActions.creationRow, // Not templated as a button
			standardActions.cut,
			standardActions.copy,
			standardActions.paste,
			standardActions.moveUp,
			standardActions.moveDown
		] as BaseAction[]
	).filter((action) => action !== undefined);
	// Anchor all non-anchored manifest custom actions/menus before the standard actions
	for (const manifestAction of Object.values(manifestActions.actions)) {
		if ((manifestAction.type === ActionType.Default || manifestAction.type === ActionType.Menu) && !manifestAction.position?.anchor) {
			manifestAction.position = {
				anchor: StandardActionKeys.Create,
				placement: Placement.Before
			};
		}
	}
	// Insert twice to allow regular override for non-standard actions and positional override for standard actions
	const manifestActionEntries = Object.entries(manifestActions.actions);
	const standardManifestActions = Object.fromEntries(manifestActionEntries.filter(([key]) => key.startsWith("StandardAction::")));
	const nonStandardManifestActions = Object.fromEntries(manifestActionEntries.filter(([key]) => !standardManifestActions[key]));
	const actionOverwriteConfig: OverrideTypeAction = {
		isNavigable: OverrideType.overwrite,
		enableOnSelect: OverrideType.overwrite,
		enableAutoScroll: OverrideType.overwrite,
		enabled: OverrideType.overwrite,
		visible: OverrideType.overwrite,
		visibleForContextMenu: OverrideType.overwrite,
		defaultValuesExtensionFunction: OverrideType.overwrite,
		command: OverrideType.overwrite,
		position: OverrideType.overwrite,
		menu: OverrideType.overwrite
	};
	// 3. Get all annotation menu items
	const annotationMenuActionItems = getAnnotationMenuActionItems(annotationActions);
	// 4. Find manifest actions which override any annotation menu items
	const matchingManifestActions = getMatchingManifestAction(annotationMenuActionItems, manifestActions.actions);
	// 5. Get overridden annotation menu items
	const overwrittenMenuActionItems = insertCustomElements(annotationMenuActionItems, matchingManifestActions, actionOverwriteConfig);
	// 6. Override all actions
	let actions = insertCustomElements(annotationAndStandardActions, nonStandardManifestActions, actionOverwriteConfig) as CustomAction[];
	actions = insertCustomElements(actions, standardManifestActions, {
		position: OverrideType.overwrite
	});
	// 7. Replace original menu items with their corresponding overridden menu items
	prepareMenuActions(actions, overwrittenMenuActionItems);
	// 8. Remove duplicate actions which are menu items
	actions = removeDuplicateActions(actions);
	// 9. Hide menus where all menu items are hidden
	actions = getVisibilityEnablementMenuActions(actions);
	// 10. Add the collaboration condition for actions other than navigation
	if (isCollaborationEnabled) {
		addCollaborationCondition(actions);
	}

	return {
		actions: actions,
		commandActions: manifestActions.commandActions
	};
}

//Returns the ContextDefiningProperties from the custom aggregate annotation or from the aggregation annotation on the property itself.
function getContextDefiningPropertiesFromAggregationAnnotation(aggregationHelper: AggregationHelper): Record<string, string[]> {
	const customAggregateAnnotations = aggregationHelper.getCustomAggregateDefinitions();
	const customAggregatedefinitions: Record<string, string[]> = {};
	customAggregateAnnotations.forEach((annotation) => {
		const aggregatedProperty = aggregationHelper._entityType.entityProperties.find((property) => {
			return property.name === annotation.qualifier;
		});
		if (aggregatedProperty) {
			const contextDefiningProperties =
				annotation.annotations?.Aggregation?.ContextDefiningProperties ??
				aggregatedProperty.annotations.Aggregation?.ContextDefiningProperties;
			customAggregatedefinitions[aggregatedProperty.name] =
				contextDefiningProperties?.map((ctxDefProperty) => ctxDefProperty.value) ?? [];
		}
	});
	return customAggregatedefinitions;
}

/**
 * Retrieve the extension information for all aggregable properties .
 * @param entityType The target entity type.
 * @param tableColumns The array of columns for the entity type.
 * @param converterContext The converter context.
 * @returns The aggregate definitions from the entityType, or undefined if the entity doesn't support analytical queries.
 */
export const getExtensionInfoFromEntityType = function (
	entityType: EntityType,
	tableColumns: TableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>
): Record<string, InternalExtensionForAnalytics> | undefined {
	const aggregationHelper = new AggregationHelper(entityType, converterContext);
	if (!aggregationHelper.isAnalyticsSupported()) {
		return undefined;
	}
	// Keep a set of all currency/unit properties, as we don't want to consider them as aggregates
	// They are aggregates for technical reasons (to manage multi-units situations) but it doesn't make sense from a user standpoint
	const currencyOrUnitProperties = new Set();
	tableColumns.forEach((column) => {
		const tableColumn = column as AnnotationTableColumn;
		if (tableColumn.unit) {
			const targetUnitProperty = tableColumns.find((prop) => prop.name === tableColumn.unit) as AnnotationTableColumn;
			currencyOrUnitProperties.add(targetUnitProperty.relativePath);
		}
	});
	const contextDefiningPropertiesFromAggregation = getContextDefiningPropertiesFromAggregationAnnotation(aggregationHelper);
	const result: Record<string, InternalExtensionForAnalytics> = {};
	tableColumns.forEach((column) => {
		const tableColumn = column as AnnotationTableColumn;
		const property = entityType.entityProperties.find((prop) => prop.name === tableColumn.relativePath);

		if (tableColumn.propertyInfos !== undefined || !tableColumn.relativePath) {
			// Ignore complex columns
			return;
		}

		let rawContextDefiningProperties = contextDefiningPropertiesFromAggregation[tableColumn.relativePath] as string[] | undefined;

		// if there is no custom aggregate definition, and the property is groupable, then we can use the default context defining properties
		let fromGroupableProperty = false;
		if (!rawContextDefiningProperties && property && !!aggregationHelper.isPropertyGroupable(property)) {
			fromGroupableProperty = true;
			rawContextDefiningProperties = property.annotations.Aggregation?.ContextDefiningProperties?.map(
				(ctxDefProperty) => ctxDefProperty.value
			);
		}

		if (!rawContextDefiningProperties || currencyOrUnitProperties.has(tableColumn.relativePath)) {
			// Ignore aggregates corresponding to currencies or units of measure
			return;
		}

		result[tableColumn.name] = {
			fromGroupableProperty: fromGroupableProperty,
			relativePath: tableColumn.relativePath
		};
		const contextDefiningProperties: string[] = [];
		rawContextDefiningProperties.forEach((contextDefiningPropertyName) => {
			// Ignore context-defining properties corresponding to currencies or units of measure of aggregatable properties
			// (but this is allowed for groupable properties)
			if (!fromGroupableProperty && currencyOrUnitProperties.has(contextDefiningPropertyName)) {
				return;
			}

			const foundColumn = findColumnByPath(contextDefiningPropertyName, tableColumns);
			if (foundColumn) {
				contextDefiningProperties.push(foundColumn.name);
			}
		});
		if (contextDefiningProperties.length) {
			result[tableColumn.name].additionalProperties = contextDefiningProperties;
		}
	});
	return result;
};
/**
 * Updates a table visualization for analytical use cases.
 * @param tableVisualization The visualization to be updated
 * @param entityType The entity type displayed in the table
 * @param converterContext The converter context
 * @param presentationVariantAnnotation The presentationVariant annotation (if any)
 */
export function updateTableVisualizationForType(
	tableVisualization: TableVisualization,
	entityType: EntityType,
	converterContext: ConverterContext<PageContextPathTarget>,
	presentationVariantAnnotation?: PresentationVariantType
): void {
	if (tableVisualization.control.type === "AnalyticalTable") {
		const aggregationData = getExtensionInfoFromEntityType(entityType, tableVisualization.columns, converterContext),
			aggregationHelper = new AggregationHelper(entityType, converterContext);
		if (aggregationData) {
			tableVisualization.enableAnalytics = true;
			tableVisualization.enable$select = false;
			tableVisualization.enable$$getKeepAliveContext = false;
			tableVisualization.analyticsExtensions = aggregationData;
			_updatePropertyInfosWithAggregatesDefinitions(tableVisualization);
			const allowedTransformations = aggregationHelper.getAllowedTransformations();
			tableVisualization.enableBasicSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
			// Add group and sort conditions from the presentation variant
			tableVisualization.annotation.groupConditions = getGroupConditions(
				presentationVariantAnnotation,
				tableVisualization.columns,
				tableVisualization.control.type
			);
			tableVisualization.annotation.aggregateConditions = getAggregateConditions(
				presentationVariantAnnotation,
				tableVisualization.columns,
				aggregationData
			);
		} else {
			Log.error(`Aggregation not supported for this entity type: ${entityType.name}`);
		}
		tableVisualization.control.type = "GridTable"; // AnalyticalTable isn't a real type for the MDC:Table, so we always switch back to Grid
	} else if (tableVisualization.control.type === "ResponsiveTable") {
		tableVisualization.annotation.groupConditions = getGroupConditions(
			presentationVariantAnnotation,
			tableVisualization.columns,
			tableVisualization.control.type
		);
	} else if (tableVisualization.control.type === "TreeTable") {
		const aggregationHelper = new AggregationHelper(entityType, converterContext);
		const allowedTransformations = aggregationHelper.getAllowedTransformations();
		tableVisualization.enableBasicSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
		tableVisualization.enable$$getKeepAliveContext = true;
		tableVisualization.annotation.changeSiblingForRootsSupported = (entityType?.annotations.Hierarchy?.[
			`RecursiveHierarchyActions#${tableVisualization.control.hierarchyQualifier ?? ""}`
		]?.ChangeSiblingForRootsSupported ?? true) as boolean;

		tableVisualization.annotation.allowDropBetweenNodes =
			!!entityType.annotations.Hierarchy?.[`RecursiveHierarchyActions#${tableVisualization.control.hierarchyQualifier ?? ""}`]
				?.ChangeNextSiblingAction;
	}

	// Some properties are always loaded because they are needed by our internal logic
	// - HasActiveEntity is needed for the row criticality expression
	// - HasDraftEntity is needed in LR with TreeTable and Analytical Table to navigate to the draft instance if there's one when clicking on the active instance
	// - HasDraftEntity and DraftAdministrativeData.InProcessByUser are needed in the LR for the delete logic
	if (ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath())) {
		tableVisualization.requestAtLeast["HasActiveEntity"] = ["draftKeys"];
		if (tableVisualization.control.analyticalConfiguration?.aggregationOnLeafLevel) {
			// IsActiveEntity key is needed for navigation to the draft instance
			tableVisualization.requestAtLeast["IsActiveEntity"] = ["draftKeys"];
		}

		if (ModelHelper.isDraftRoot(converterContext.getEntitySet())) {
			tableVisualization.requestAtLeast["HasDraftEntity"] = ["draftKeys"];
			if (tableVisualization.enableAnalytics !== true && tableVisualization.control.type !== "TreeTable") {
				// We don't load DraftAdministrativeData for Analytical and Tree tables in LR because they display active instances only
				// (therefore no DraftAdministrativeData is available)
				tableVisualization.requestAtLeast["DraftAdministrativeData/InProcessByUser"] = ["draftKeys"];
				if (
					ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) &&
					converterContext.getManifestWrapper().isFclEnabled()
				) {
					tableVisualization.requestAtLeast["DraftAdministrativeData/DraftAdministrativeUser"] = ["draftKeys"];
				}
			}
		}
	}

	if (tableVisualization.control.enableUploadPlugin) {
		const streamProperty = converterContext.getAnnotationEntityType().annotations?.UI?.MediaResource?.Stream?.$target;
		if (!streamProperty) {
			throw "UI.MediaResource annotation with Stream property missing";
		}

		// the upload action is treated as the create action
		const uploadAction = tableVisualization.actions.find((a) => a.key === StandardActionKeys.Create) as StandardAction;

		tableVisualization.annotation.uploadTable = {
			stream: streamProperty.name,
			fileName: (streamProperty.annotations.Core?.ContentDisposition?.Filename as PathAnnotationExpression<string> | undefined)?.path,
			fileNameMaxLength: streamProperty.annotations.Core?.ContentDisposition?.Filename?.$target?.maxLength,
			acceptableMediaTypes: streamProperty.annotations.Core?.AcceptableMediaTypes,
			maxLength: streamProperty.maxLength,
			uploadAction: uploadAction
		};
	}
}

type fieldOrigin =
	| "semanticKey"
	| "restriction"
	| "secondaryKey"
	| "presentationVariant"
	| "navigation"
	| "operation"
	| "alternateAndSecondaryKeys"
	| "draftKeys";
export type RequestAtLeast = Record<string, fieldOrigin[]>;

/**
 * Creates and returns a select query with the selected fields from the parameters that were passed.
 * @param lineItem The LineItem we want the requested properties from.
 * @param converterContext The converter context.
 * @param operationAvailable A string containing the available operation, which we'll take the properties to add to the select query.
 * @param presentationVariantAnnotation The presentation variant annotation which we'll take the RequestAtLeast properties from.
 * @returns The 'select' query that has the selected fields from the parameters that were passed.
 */
export function createRequestedProperties(
	lineItem: LineItem,
	converterContext: ConverterContext,
	operationAvailable?: string,
	presentationVariantAnnotation?: PresentationVariantType
): RequestAtLeast {
	const entityType = converterContext.getAnnotationEntityType(lineItem);
	const selectedFields: RequestAtLeast = {};
	function pushField(fieldName: string, origin: fieldOrigin): void {
		if (fieldName && fieldName.indexOf("/") !== 0) {
			// Do not add singleton property (with absolute path) to $select
			if (!selectedFields[fieldName]) {
				selectedFields[fieldName] = [origin];
			} else {
				selectedFields[fieldName].push(origin);
			}
		}
	}

	function pushFieldList(fields: string[], origin: fieldOrigin): void {
		if (fields?.length) {
			fields.forEach((field) => pushField(field, origin));
		}
	}

	const operationAvailableProperties = (operationAvailable || "").split(",");
	const validProperties = operationAvailableProperties.filter(function (propName: string) {
		return entityType.resolvePath(propName);
	});
	const semanticKeys: string[] = (entityType.annotations.Common?.SemanticKey || []).map((semanticKey) => semanticKey.value);
	const capabilitiesAnnotation = converterContext.getEntitySet()?.annotations?.Capabilities;
	const alternateAndSecondaryKeys = ModelHelper.getAlternateAndSecondaryKeys(entityType, converterContext.getEntitySet() as EntitySet);
	if (presentationVariantAnnotation) {
		pushFieldList(presentationVariantAnnotation.RequestAtLeast?.map((propertyPath) => propertyPath.value), "presentationVariant");
	}
	pushFieldList(getNavigationAvailableFieldsFromLineItem(lineItem, entityType), "navigation");
	pushFieldList(validProperties, "operation");
	pushFieldList(semanticKeys, "semanticKey");
	pushFieldList(alternateAndSecondaryKeys, "alternateAndSecondaryKeys");
	if (capabilitiesAnnotation) {
		pushField((capabilitiesAnnotation.DeleteRestrictions?.Deletable as PathAnnotationExpression<boolean>)?.path, "restriction");
		pushField((capabilitiesAnnotation.UpdateRestrictions?.Updatable as PathAnnotationExpression<boolean>)?.path, "restriction");
	}

	return selectedFields;
}

/**
 * This return the property that are available from the NavigationAvailable annotation on IBN Fields.
 * @param lineItem The line item annotation.
 * @param entityType The Entity Type.
 * @returns An array containing the properties name.
 */
function getNavigationAvailableFieldsFromLineItem(lineItem: LineItem, entityType: EntityType): string[] {
	const selectedFields: string[] = [];
	lineItem.forEach(function (record) {
		if (
			record.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation &&
			!record.Inline &&
			!record.Determining &&
			isPathAnnotationExpression(record.NavigationAvailable)
		) {
			const path = (record.NavigationAvailable as unknown as { path: string }).path;
			if (entityType.resolvePath(path)) {
				selectedFields.push(path);
			}
		}
	});
	return selectedFields;
}

/**
 * Get the navigation target path from manifest settings.
 * @param converterContext The converter context
 * @param navigationPropertyPath The navigation path to check in the manifest settings
 * @returns Navigation path from manifest settings
 */
export function getNavigationTargetPath(converterContext: ConverterContext<PageContextPathTarget>, navigationPropertyPath: string): string {
	const manifestWrapper = converterContext.getManifestWrapper();
	if (navigationPropertyPath && manifestWrapper.getNavigationConfiguration(navigationPropertyPath)) {
		const navConfig = manifestWrapper.getNavigationConfiguration(navigationPropertyPath);
		if (Object.keys(navConfig).length > 0) {
			return navigationPropertyPath;
		}
	}
	const dataModelPath = converterContext.getDataModelObjectPath();
	const contextPath = converterContext.getContextPath();
	const navConfigForContextPath = manifestWrapper.getNavigationConfiguration(contextPath);
	if (navConfigForContextPath && Object.keys(navConfigForContextPath).length > 0) {
		return contextPath;
	}
	return dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
}

function getSemanticKeysAndTitleInfo(converterContext: ConverterContext<PageContextPathTarget>): {
	headerInfoTitlePath: string;
	semanticKeyColumns: string[];
	headerInfoTypeName: PropertyAnnotationValue<String> | undefined;
} {
	const headerInfoTitlePath = (converterContext.getAnnotationEntityType()?.annotations?.UI?.HeaderInfo?.Title as DataFieldTypes)?.Value
		?.path;
	const semanticKeyAnnotations = converterContext.getAnnotationEntityType()?.annotations?.Common?.SemanticKey;
	const headerInfoTypeName = converterContext?.getAnnotationEntityType()?.annotations?.UI?.HeaderInfo?.TypeName;
	const semanticKeyColumns: string[] = [];
	if (semanticKeyAnnotations) {
		semanticKeyAnnotations.forEach(function (oColumn) {
			semanticKeyColumns.push(oColumn.value);
		});
	}
	return { headerInfoTitlePath, semanticKeyColumns, headerInfoTypeName };
}
export function createTableVisualization(
	lineItemAnnotation: LineItem,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	params?: Partial<{
		presentationVariantAnnotation: PresentationVariantType;
		selectionVariantAnnotation: SelectionVariantType;
		isCondensedTableLayoutCompliant: boolean;
	}>
): TableVisualization {
	const { presentationVariantAnnotation, isCondensedTableLayoutCompliant, selectionVariantAnnotation } = params ?? {};
	const tableManifestConfig = getTableManifestConfiguration(
		lineItemAnnotation,
		visualizationPath,
		converterContext,
		isCondensedTableLayoutCompliant,
		selectionVariantAnnotation
	);
	const { navigationPropertyPath } = splitPath(visualizationPath);
	const navigationTargetPath = getNavigationTargetPath(converterContext, navigationPropertyPath);
	const navigationSettings = converterContext.getManifestWrapper().getNavigationConfiguration(navigationTargetPath);
	const columns = getTableColumns(lineItemAnnotation, tableManifestConfig.type, visualizationPath, converterContext);
	const operationAvailableMap = getOperationAvailableMap(lineItemAnnotation, converterContext);
	const semanticKeysAndHeaderInfoTitle = getSemanticKeysAndTitleInfo(converterContext);
	const standardActionsConfiguration = getStandardActionsConfiguration(
		lineItemAnnotation,
		visualizationPath,
		converterContext,
		tableManifestConfig,
		navigationSettings
	);
	const tableAnnotation = getTableAnnotationConfiguration(
		lineItemAnnotation,
		visualizationPath,
		converterContext,
		tableManifestConfig,
		columns,
		navigationSettings,
		standardActionsConfiguration,
		presentationVariantAnnotation
	);
	const tableActions = getTableActions(
		lineItemAnnotation,
		visualizationPath,
		converterContext,
		standardActionsConfiguration.standardActions,
		navigationSettings
	);
	const operationAvailable = getOperationAvailableProperties(operationAvailableMap, converterContext);
	let header = tableManifestConfig.header;
	header ??= tableAnnotation.title === "" ? undefined : tableAnnotation.title;
	const oVisualization: TableVisualization = {
		type: VisualizationType.Table,
		annotation: tableAnnotation,
		control: tableManifestConfig,
		actions: tableActions.actions,
		commandActions: tableActions.commandActions,
		columns: columns,
		operationAvailableMap: JSON.stringify(operationAvailableMap),
		operationAvailableProperties: operationAvailable,
		headerInfoTitle: semanticKeysAndHeaderInfoTitle.headerInfoTitlePath,
		semanticKeys: semanticKeysAndHeaderInfoTitle.semanticKeyColumns,
		headerInfoTypeName: semanticKeysAndHeaderInfoTitle.headerInfoTypeName,
		enable$select: true,
		enable$$getKeepAliveContext: true,
		header: header,
		headerVisible: tableManifestConfig.headerVisible,
		requestAtLeast: createRequestedProperties(lineItemAnnotation, converterContext, operationAvailable, presentationVariantAnnotation),
		handlePatchSent: converterContext.getManifestWrapper().getTemplateType() !== TemplateType.ListReport
	};
	updateLinkedProperties(converterContext, columns);
	updateTableVisualizationForType(
		oVisualization,
		converterContext.getAnnotationEntityType(lineItemAnnotation),
		converterContext,
		presentationVariantAnnotation
	);
	return oVisualization;
}
export function createDefaultTableVisualization(
	converterContext: ConverterContext<PageContextPathTarget>,
	isBlankTable?: boolean
): TableVisualization {
	const tableManifestConfig = getTableManifestConfiguration(undefined, "", converterContext, false);
	const columns = getColumnsFromEntityType(
		{},
		converterContext.getEntityType(),
		[],
		converterContext,
		tableManifestConfig.type,
		tableManifestConfig.creationMode,
		{}
	);
	const operationAvailableMap = getOperationAvailableMap(undefined, converterContext);
	const semanticKeysAndHeaderInfoTitle = getSemanticKeysAndTitleInfo(converterContext);
	const navigationTargetPath = getNavigationTargetPath(converterContext, "");
	const navigationSettings = converterContext.getManifestWrapper().getNavigationConfiguration(navigationTargetPath);
	const standardActionsConfiguration = getStandardActionsConfiguration(
		undefined,
		"",
		converterContext,
		tableManifestConfig,
		navigationSettings
	);
	const oVisualization: TableVisualization = {
		type: VisualizationType.Table,
		annotation: getTableAnnotationConfiguration(
			undefined,
			"",
			converterContext,
			tableManifestConfig,
			isBlankTable ? [] : columns,
			navigationSettings,
			standardActionsConfiguration
		),
		control: tableManifestConfig,
		actions: [],
		columns: columns,
		operationAvailableMap: JSON.stringify(operationAvailableMap),
		operationAvailableProperties: getOperationAvailableProperties(operationAvailableMap, converterContext),
		headerInfoTitle: semanticKeysAndHeaderInfoTitle.headerInfoTitlePath,
		semanticKeys: semanticKeysAndHeaderInfoTitle.semanticKeyColumns,
		headerInfoTypeName: semanticKeysAndHeaderInfoTitle.headerInfoTypeName,
		enable$select: true,
		enable$$getKeepAliveContext: true,
		header: tableManifestConfig.header,
		headerVisible: tableManifestConfig.headerVisible,
		handlePatchSent: converterContext.getManifestWrapper().getTemplateType() !== TemplateType.ListReport,
		requestAtLeast: {}
	};
	updateLinkedProperties(converterContext, columns);
	updateTableVisualizationForType(oVisualization, converterContext.getEntityType(), converterContext);
	return oVisualization;
}
/**
 * Gets the map of Core.OperationAvailable property paths for all DataFieldForActions.
 * @param lineItemAnnotation The instance of the line item
 * @param converterContext The instance of the converter context
 * @returns The record containing all action names and their corresponding Core.OperationAvailable property paths
 */
function getOperationAvailableMap(
	lineItemAnnotation: LineItem | undefined,
	converterContext: ConverterContext<PageContextPathTarget>
): Record<string, unknown> {
	return ActionHelper.getOperationAvailableMap(lineItemAnnotation, "table", converterContext);
}
/**
 * Gets updatable propertyPath for the current entityset if valid.
 * @param converterContext The instance of the converter context
 * @returns The updatable property for the rows
 */
function getCurrentEntitySetUpdatablePath(converterContext: ConverterContext<PageContextPathTarget>): string {
	const restrictions = getRestrictions(converterContext);
	const entitySet = converterContext.getEntitySet();
	const updatable = restrictions.isUpdatable;
	const isOnlyDynamicOnCurrentEntity = !isConstant(updatable.expression) && updatable.navigationExpression._type === "Unresolvable";
	const updatableExpression = entitySet?.annotations.Capabilities?.UpdateRestrictions?.Updatable;
	const updatablePropertyPath = isPathAnnotationExpression(updatableExpression) && updatableExpression.path;
	return isOnlyDynamicOnCurrentEntity ? (updatablePropertyPath as string) : "";
}
/**
 * Method to retrieve all property paths assigned to the Core.OperationAvailable annotation.
 * @param operationAvailableMap The record consisting of actions and their Core.OperationAvailable property paths
 * @param converterContext The instance of the converter context
 * @returns The CSV string of all property paths associated with the Core.OperationAvailable annotation
 */
function getOperationAvailableProperties(
	operationAvailableMap: Record<string, unknown>,
	converterContext: ConverterContext<PageContextPathTarget>
): string {
	const properties = new Set();
	for (const actionName in operationAvailableMap) {
		const propertyName = operationAvailableMap[actionName];
		if (propertyName === null) {
			// Annotation configured with explicit 'null' (action advertisement relevant)
			properties.add(actionName);
		} else if (typeof propertyName === "string") {
			// Add property paths and not Constant values.
			properties.add(propertyName);
		}
	}
	if (properties.size) {
		// Some actions have an operation available based on property --> we need to load the HeaderInfo.Title property
		// so that the dialog on partial actions is displayed properly (BCP 2180271425)
		const entityType = converterContext.getEntityType();
		const titleProperty = (entityType.annotations?.UI?.HeaderInfo?.Title as DataFieldTypes)?.Value?.path;
		if (titleProperty) {
			properties.add(titleProperty);
		}
	}
	return Array.from(properties).join(",");
}
/**
 * Iterates over the DataFieldForAction and DataFieldForIntentBasedNavigation of a line item and
 * returns all the UI.Hidden annotation expressions.
 * @param lineItemAnnotation Collection of data fields used for representation in a table or list
 * @param currentEntityType Current entity type
 * @param contextDataModelObjectPath Object path of the data model
 * @returns All the `UI.Hidden` path expressions found in the relevant actions
 */
function getUIHiddenExpForActionsRequiringContext(
	lineItemAnnotation: LineItem,
	currentEntityType: EntityType,
	contextDataModelObjectPath: DataModelObjectPath<PageContextPathTarget>
): BindingToolkitExpression<boolean>[] {
	const aUiHiddenPathExpressions: BindingToolkitExpression<boolean>[] = [];
	lineItemAnnotation.forEach((dataField) => {
		// Check if the lineItem context is the same as that of the action:
		if (
			(dataField.$Type === UIAnnotationTypes.DataFieldForAction &&
				dataField?.ActionTarget?.isBound &&
				currentEntityType === dataField?.ActionTarget.sourceEntityType) ||
			(dataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation &&
				dataField.RequiresContext &&
				dataField?.Inline?.valueOf() !== true)
		) {
			if (typeof dataField.annotations?.UI?.Hidden?.valueOf() === "object") {
				aUiHiddenPathExpressions.push(equal(getHiddenExpressionAtTableLevel(dataField, contextDataModelObjectPath), false));
			}
		}
	});
	return aUiHiddenPathExpressions;
}
/**
 * This method is used to get the binding expression of the path of a DataField.
 * @param expression CompiledBindingToolkitExpression
 * @returns The binding expression
 */
function getPathFromActionAnnotation(expression: CompiledBindingToolkitExpression): CompiledBindingToolkitExpression {
	let path: CompiledBindingToolkitExpression;
	if (isPathAnnotationExpression(expression)) {
		path = expression.path;
	} else {
		path = expression;
	}
	return path;
}
/**
 * This method is used to change the context currently referenced by this binding by removing the last navigation property.
 *
 * It is used (specifically in this case), to transform a binding made for a NavProp context /MainObject/NavProp1/NavProp2,
 * into a binding on the previous context /MainObject/NavProp1.
 * @param source DataFieldForAction | DataFieldForIntentBasedNavigation | CustomAction
 * @param contextDataModelObjectPath DataModelObjectPath
 * @returns The binding expression
 */
function getHiddenExpressionAtTableLevel(
	source: DataFieldAbstractTypes,
	contextDataModelObjectPath: DataModelObjectPath<PageContextPathTarget>
): BindingToolkitExpression<unknown> {
	const expression = source.annotations?.UI?.Hidden as CompiledBindingToolkitExpression;
	let path = getPathFromActionAnnotation(expression);
	if (typeof path === "object") {
		return constant(false);
	} else if (typeof path === "string") {
		if ("visible" in source) {
			path = path.substring(1, path.length - 1);
		}
		if (path.indexOf("/") > 0) {
			//check if the navigation property is correct:
			const splitPathForNavigationProperty = path.split("/");
			const navigationPath = splitPathForNavigationProperty[0];
			if (
				isNavigationProperty(contextDataModelObjectPath?.targetObject) &&
				contextDataModelObjectPath.targetObject.partner === navigationPath
			) {
				return pathInModel(splitPathForNavigationProperty.slice(1).join("/"));
			} else {
				return constant(true);
			}
		} else {
			return constant(false);
		}
	}
	return constant(true);
}
/**
 * Loop through the manifest actions and check the following:
 *
 * If the data field is also referenced as a custom action.
 * If the underlying manifest action is either a bound action or has the 'RequiresContext' property set to true.
 *
 * If so, the 'requiresSelection' property is forced to 'true' in the manifest.
 * @param dataFieldId Id of the DataField evaluated
 * @param dataField DataField evaluated
 * @param manifestActions The actions defined in the manifest
 * @returns `true` if the DataField is found among the manifest actions
 */
function updateManifestActionAndTagIt(
	dataFieldId: string,
	dataField: DataFieldForAction | DataFieldForIntentBasedNavigation,
	manifestActions: Record<string, CustomAction>
): boolean {
	return Object.keys(manifestActions).some((actionKey) => {
		if (actionKey === dataFieldId) {
			if (
				(dataField as DataFieldForAction)?.ActionTarget?.isBound ||
				(dataField as DataFieldForIntentBasedNavigation)?.RequiresContext
			) {
				manifestActions[dataFieldId].requiresSelection = true;
			}
			return true;
		}
		return false;
	});
}
/**
 * Loop through the DataFieldForAction and DataFieldForIntentBasedNavigation of a line item and
 * check the following:
 * If at least one of them is always visible in the table toolbar and requires a context
 * If an action is also defined in the manifest, it is set aside and will be considered
 * when going through the manifest.
 * @param lineItemAnnotation Collection of data fields for representation in a table or list
 * @param manifestActions The actions defined in the manifest
 * @param currentEntityType Current Entity Type
 * @returns `true` if there is at least 1 action that meets the criteria
 */
function hasBoundActionsAlwaysVisibleInToolBar(
	lineItemAnnotation: LineItem | DataFieldForActionAbstractTypes[],
	manifestActions: Record<string, CustomAction>,
	currentEntityType: EntityType
): boolean {
	return lineItemAnnotation.some((dataField) => {
		if (
			(dataField.$Type === UIAnnotationTypes.DataFieldForAction ||
				dataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) &&
			dataField?.Inline?.valueOf() !== true &&
			(dataField.annotations?.UI?.Hidden?.valueOf() === false || dataField.annotations?.UI?.Hidden?.valueOf() === undefined)
		) {
			if (dataField.$Type === UIAnnotationTypes.DataFieldForAction) {
				const manifestActionId = generate(["DataFieldForAction", dataField.Action as string]);
				// if the DataFieldForActon from annotation also exists in the manifest, its visibility will be evaluated later on
				if (updateManifestActionAndTagIt(manifestActionId, dataField, manifestActions)) {
					return false;
				}
				// Check if the lineItem context is the same as that of the action:
				return dataField?.ActionTarget?.isBound && currentEntityType === dataField?.ActionTarget.sourceEntityType;
			} else if (dataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) {
				// if the DataFieldForIntentBasedNavigation from annotation also exists in the manifest, its visibility will be evaluated later on
				if (
					updateManifestActionAndTagIt(
						`DataFieldForIntentBasedNavigation::${dataField.SemanticObject}::${dataField.Action}`,
						dataField,
						manifestActions
					)
				) {
					return false;
				}
				return dataField.RequiresContext;
			}
		} else if (
			dataField.$Type === UIAnnotationTypes.DataFieldForActionGroup &&
			(dataField.annotations?.UI?.Hidden?.valueOf() === false || dataField.annotations?.UI?.Hidden?.valueOf() === undefined)
		) {
			return hasBoundActionsAlwaysVisibleInToolBar(dataField.Actions, manifestActions, currentEntityType);
		}
		return false;
	});
}
/**
 * Checks if a custom action that requires a context is always visible in the toolbar.
 * @param manifestActions The actions defined in the manifest
 * @returns `true` if there is at least 1 action that meets the criteria
 */
function hasCustomActionsAlwaysVisibleInToolBar(manifestActions: Record<string, CustomAction>): boolean {
	const customActions = Object.keys(manifestActions).reduce((actions: CustomAction[], actionKey) => {
		const action = manifestActions[actionKey];
		if (!action.menu) {
			//simple custom action
			actions.push(action);
		} else {
			// grouped actions
			actions = [...actions, ...(action.menu.filter((menuAction) => typeof menuAction !== "string") as CustomAction[])];
		}
		return actions;
	}, []);
	return !!customActions.find(
		(action) => action.requiresSelection && (action.visible === undefined || action.visible?.toString() === "true")
	);
}
/**
 * Iterates over the custom actions (with key requiresSelection) declared in the manifest for the current line item and returns all the
 * visible key values as an expression.
 * @param manifestActions The actions defined in the manifest
 * @returns Array<Expression<boolean>> All the visible path expressions of the actions that meet the criteria
 */
function getVisibleExpForCustomActionsRequiringContext(manifestActions: Record<string, CustomAction>): BindingToolkitExpression<boolean>[] {
	const aVisiblePathExpressions: BindingToolkitExpression<boolean>[] = [];
	if (manifestActions) {
		Object.keys(manifestActions).forEach((actionKey) => {
			const action = manifestActions[actionKey];
			if (action.requiresSelection === true && action.visible !== undefined) {
				if (typeof action.visible === "string") {
					/*The final aim would be to check if the path expression depends on the parent context
					and considers only those expressions for the expression evaluation,
					but currently not possible from the manifest as the visible key is bound on the parent entity.
					Tricky to differentiate the path as it's done for the Hidden annotation.
					For the time being we consider all the paths of the manifest*/
					aVisiblePathExpressions.push(resolveBindingString(action?.visible?.valueOf(), "boolean"));
				}
			}
		});
	}
	return aVisiblePathExpressions;
}
/**
 * Evaluate if the path is statically deletable or updatable.
 * @param converterContext
 * @returns The table capabilities
 */
export function getCapabilityRestriction(converterContext: ConverterContext<PageContextPathTarget>): TableCapabilityRestriction {
	const isDeletable = isPathDeletable(converterContext.getDataModelObjectPath());
	const isUpdatable = isPathUpdatable(converterContext.getDataModelObjectPath());
	return {
		isDeletable: !(isConstant(isDeletable) && isDeletable.value === false),
		isUpdatable: !(isConstant(isUpdatable) && isUpdatable.value === false)
	};
}
export function getSelectionMode(
	lineItemAnnotation: LineItem | undefined,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	isEntitySet: boolean,
	targetCapabilities: TableCapabilityRestriction,
	deleteButtonVisibilityExpression?: BindingToolkitExpression<boolean>,
	massEditVisibilityExpression: BindingToolkitExpression<boolean> = constant(false),
	cutButtonVisibilityExpression: BindingToolkitExpression<boolean> = constant(false)
): string | undefined {
	const tableManifestSettings = converterContext.getManifestControlConfiguration<TableManifestConfiguration>(visualizationPath);
	const tableType = tableManifestSettings.tableSettings?.type;
	let selectionMode = tableManifestSettings.tableSettings?.selectionMode;

	// The collapse/Expand action of a tree table is a bound action, as a result, a tree table should always have a selection mode to "Multi" when no selectionMode has been set in the manifest
	if (tableType === "TreeTable" && !selectionMode) {
		return SelectionMode.Multi;
	}

	// If the selection mode is forced to 'None' in the manifest/macro table parameters, we keep it unless here is a delete button
	if (!lineItemAnnotation || selectionMode === SelectionMode.None) {
		if (targetCapabilities.isDeletable && deleteButtonVisibilityExpression) {
			return compileExpression(ifElse(deleteButtonVisibilityExpression, constant(SelectionMode.Multi), constant(SelectionMode.None)));
		}
		return SelectionMode.None;
	}
	if (selectionMode === SelectionMode.ForceMulti) {
		return SelectionMode.Multi;
	} else if (selectionMode === SelectionMode.ForceSingle) {
		return SelectionMode.Single;
	}
	let aHiddenBindingExpressions: BindingToolkitExpression<boolean>[] = [],
		aVisibleBindingExpressions: BindingToolkitExpression<boolean>[] = [];
	const manifestActions = getActionsFromManifest(
		converterContext.getManifestControlConfiguration<TableManifestConfiguration>(visualizationPath).actions,
		converterContext,
		[],
		undefined,
		false
	);
	let isParentDeletable, parentEntitySetDeletable;
	if (converterContext.getTemplateType() === TemplateType.ObjectPage) {
		isParentDeletable = isPathDeletable(converterContext.getDataModelObjectPath());
		parentEntitySetDeletable = isParentDeletable ? compileExpression(isParentDeletable, true) : isParentDeletable;
	}
	const bMassEditEnabled: boolean = !isConstant(massEditVisibilityExpression) || massEditVisibilityExpression.value !== false;
	if (!selectionMode || selectionMode === SelectionMode.Auto) {
		selectionMode = SelectionMode.Multi;
	}
	if (bMassEditEnabled) {
		// Override default selection mode when mass edit is visible
		selectionMode = selectionMode === SelectionMode.Single ? SelectionMode.Single : SelectionMode.Multi;
	}
	if (
		hasBoundActionsAlwaysVisibleInToolBar(lineItemAnnotation, manifestActions.actions, converterContext.getEntityType()) ||
		hasCustomActionsAlwaysVisibleInToolBar(manifestActions.actions)
	) {
		return selectionMode;
	}
	aHiddenBindingExpressions = getUIHiddenExpForActionsRequiringContext(
		lineItemAnnotation,
		converterContext.getEntityType(),
		converterContext.getDataModelObjectPath()
	);
	aVisibleBindingExpressions = getVisibleExpForCustomActionsRequiringContext(manifestActions.actions);
	// No action requiring a context:
	if (
		aHiddenBindingExpressions.length === 0 &&
		aVisibleBindingExpressions.length === 0 &&
		(cutButtonVisibilityExpression || deleteButtonVisibilityExpression || bMassEditEnabled)
	) {
		if (!isEntitySet) {
			// Example: OP case
			if (targetCapabilities.isDeletable || parentEntitySetDeletable !== "false" || bMassEditEnabled) {
				// Building expression for delete and mass edit
				const buttonVisibilityExpression = or(
					cutButtonVisibilityExpression || true,
					deleteButtonVisibilityExpression || true, // default delete visibility as true
					massEditVisibilityExpression
				);
				return compileExpression(
					ifElse(and(UI.IsEditable, buttonVisibilityExpression), constant(selectionMode), constant(SelectionMode.None))
				);
			} else {
				return compileExpression(
					ifElse(cutButtonVisibilityExpression, constant(SelectionMode.Single), constant(SelectionMode.None))
				);
			}
			// EntitySet deletable:
		} else if (bMassEditEnabled) {
			// example: LR scenario
			return selectionMode;
		} else if (targetCapabilities.isDeletable && deleteButtonVisibilityExpression) {
			return compileExpression(ifElse(deleteButtonVisibilityExpression, constant(selectionMode), constant(SelectionMode.None)));
			// EntitySet not deletable:
		} else {
			return SelectionMode.None;
		}
		// There are actions requiring a context:
	} else if (!isEntitySet) {
		// Example: OP case
		if (targetCapabilities.isDeletable || parentEntitySetDeletable !== "false" || bMassEditEnabled) {
			// Use selectionMode in edit mode if delete is enabled or mass edit is visible
			const editModebuttonVisibilityExpression = ifElse(
				bMassEditEnabled && !targetCapabilities.isDeletable,
				massEditVisibilityExpression,
				constant(true)
			);
			return compileExpression(
				ifElse(
					and(UI.IsEditable, editModebuttonVisibilityExpression),
					constant(selectionMode),
					ifElse(
						or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions)),
						constant(selectionMode),
						constant(SelectionMode.None)
					)
				)
			);
		} else {
			return compileExpression(
				ifElse(
					or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions)),
					constant(selectionMode),
					constant(SelectionMode.None)
				)
			);
		}
		//EntitySet deletable:
	} else if (targetCapabilities.isDeletable || bMassEditEnabled) {
		// Example: LR scenario
		return selectionMode;
		//EntitySet not deletable:
	} else {
		return compileExpression(
			ifElse(
				or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions), massEditVisibilityExpression),
				constant(selectionMode),
				constant(SelectionMode.None)
			)
		);
	}
}

/**
 * Method to retrieve all table actions from annotations.
 * @param lineItemAnnotation
 * @param visualizationPath
 * @param converterContext
 * @returns The table annotation actions
 */
function getTableAnnotationActions(
	lineItemAnnotation: LineItem,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): { tableActions: Array<AnnotationAction | AnnotationActionGroup> } {
	const tableActions: Array<AnnotationAction | AnnotationActionGroup> = [];
	const copyDataField = getCopyAction(
		lineItemAnnotation.filter((dataField) => {
			return dataFieldIsCopyAction(dataField as DataFieldForActionTypes);
		}) as DataFieldForActionTypes[]
	);
	if (copyDataField) {
		tableActions.push({
			type: ActionType.Copy,
			annotationPath: converterContext.getEntitySetBasedAnnotationPath(copyDataField.fullyQualifiedName),
			key: KeyHelper.generateKeyFromDataField(copyDataField),
			visible: compileExpression(visibleExpression(copyDataField, converterContext)),
			visibleForContextMenu: compileExpression(visibleForContextMenuExpression(copyDataField, converterContext)),
			text: copyDataField.Label?.toString() ?? Library.getResourceBundleFor("sap.fe.core")!.getText("C_COMMON_COPY"),
			isNavigable: true
		});
	}
	lineItemAnnotation
		.filter((dataField) => {
			return !dataFieldIsCopyAction(dataField as DataFieldForAction);
		})
		.forEach((dataField: DataFieldAbstractTypes) => {
			if (
				isDataFieldForActionAbstract(dataField) &&
				dataField.Inline?.valueOf() !== true &&
				dataField.Determining?.valueOf() !== true
			) {
				const tableAction = getDataFieldAnnotationAction(dataField, converterContext);
				if (tableAction) {
					tableActions.push(tableAction);
				}
			} else if (isDataFieldForActionGroup(dataField)) {
				const dataFieldGroup = getDataFieldAnnotationAction(dataField, converterContext);
				if (dataFieldGroup) {
					tableActions.push(dataFieldGroup);
				}
			}
		});

	return {
		tableActions
	};
}

// For the context menu, the visibility should also consider the 'inactiveContext' property:
// only when at least one selected context is active (i.e. "contextmenu/inactiveContext" is false), the action should be visible in the context menu
// This is only relevant when the table manifest setting "creationMode" is "InlineCreationRows"
function visibleForContextMenuExpression(
	dataField: DataFieldForAction | DataFieldForIntentBasedNavigation | DataFieldForActionGroup | undefined,
	converterContext: ConverterContext<PageContextPathTarget>
): BindingToolkitExpression<boolean> {
	return and(visibleExpression(dataField, converterContext), equal(pathInModel("contextmenu/inactiveContext", "internal"), false));
}

function getDataFieldAnnotationAction(
	dataField: DataFieldAbstractTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): AnnotationAction | AnnotationActionGroup | void {
	let tableAction: AnnotationAction;
	let entityType;
	switch (dataField.$Type) {
		case UIAnnotationTypes.DataFieldForAction:
			tableAction = {
				type: ActionType.DataFieldForAction,
				annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
				key: KeyHelper.generateKeyFromDataField(dataField),
				visible: compileExpression(visibleExpression(dataField, converterContext)),
				visibleForContextMenu: compileExpression(visibleForContextMenuExpression(dataField, converterContext)),
				isNavigable: true,
				isAIOperation: isActionAIOperation(dataField) === true || undefined
			};
			entityType = converterContext.getEntityType().fullyQualifiedName;
			if (_useEnabledExpression(dataField, entityType)) {
				tableAction.enabled = getEnabledForAnnotationAction(converterContext, dataField.ActionTarget, true);
			}
			return tableAction;
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			return {
				type: ActionType.DataFieldForIntentBasedNavigation,
				annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
				key: KeyHelper.generateKeyFromDataField(dataField),
				visible: compileExpression(visibleExpression(dataField, converterContext)),
				visibleForContextMenu: compileExpression(visibleForContextMenuExpression(dataField, converterContext))
			};
		case UIAnnotationTypes.DataFieldForActionGroup:
			return {
				type: ActionType.Menu,
				key: KeyHelper.generateKeyFromDataField(dataField),
				id: KeyHelper.generateKeyFromDataField(dataField),
				text: dataField.Label?.toString(),
				visible: compileExpression(visibleExpression(dataField, converterContext)),
				visibleForContextMenu: compileExpression(visibleForContextMenuExpression(dataField, converterContext)),
				isAIOperation: isMenuAIOperation(dataField.Actions) === true || undefined,
				menu: dataField.Actions.map((action) => getDataFieldAnnotationAction(action, converterContext))
			} as AnnotationActionGroup;
		default:
			return;
	}
}

/**
 * Generate the bindingExpression for the highlight rowSetting parameter.
 * @param criticalityAnnotation Path or value of the criticality
 * @param isDraftRootOrNode  Is the current entitySet an Draft root or a node
 * @param targetEntityType The targeted entityType
 * @returns An expressionBinding
 */
function getHighlightRowBinding(
	criticalityAnnotation: Criticality | undefined,
	isDraftRootOrNode: boolean,
	targetEntityType?: EntityType
): BindingToolkitExpression<MessageType> {
	let defaultHighlightRowDefinition: MessageType | BindingToolkitExpression<MessageType> = MessageType.None;
	if (criticalityAnnotation) {
		if (typeof criticalityAnnotation === "object") {
			defaultHighlightRowDefinition = getExpressionFromAnnotation(criticalityAnnotation) as BindingToolkitExpression<MessageType>;
		} else {
			// Enum Value so we get the corresponding static part
			defaultHighlightRowDefinition = getMessageTypeFromCriticalityType(criticalityAnnotation);
		}
	}
	return formatResult(
		[
			defaultHighlightRowDefinition,
			pathInModel(`filteredMessages`, "internal"),
			isDraftRootOrNode && Entity.HasActive,
			isDraftRootOrNode && Entity.IsActive,
			`${isDraftRootOrNode}`,
			pathInModel("@$ui5.fe.contextPath"),
			UI.IsInactive
		],
		tableFormatters.rowHighlighting,
		targetEntityType
	);
}

/**
 * Gets the external creation behavior if there's one.
 * @param tableManifestConfiguration
 * @param converterContext
 * @param navigationSettings
 * @returns The external creation behavior, or undefined if there's none.
 */
function getExternalCreationBehavior(
	tableManifestConfiguration: TableControlConfiguration,
	converterContext: ConverterContext<PageContextPathTarget>,
	navigationSettings: NavigationSettingsConfiguration
): CreateBehaviorExternal | undefined {
	// Legacy settings: the outbound is specified in navigation/create
	// New settings: the outbound is specified in tableSettings/creationMode
	const creationDetails = navigationSettings?.create;
	const outboundKey = tableManifestConfiguration.outboundCreation ?? creationDetails?.outbound;
	const outboundDetail = outboundKey ? converterContext.getManifestWrapper().getOutboundNavigationEntries()?.[outboundKey] : undefined;
	if (outboundKey && outboundDetail) {
		return {
			mode: "External",
			outbound: outboundKey,
			outboundDetail
		};
	} else {
		if (tableManifestConfiguration.creationMode === CreationMode.External) {
			// Outbound configuration incorrect --> fallback to NewPage
			Log.warning(`Cannot find outbound parameters for "External" creation mode. Instead, the default mode "NewPage" is used.`);
			tableManifestConfiguration.creationMode = CreationMode.NewPage;
			delete tableManifestConfiguration.outboundCreation;
		}

		return undefined;
	}
}

function _getCreationBehaviour(
	lineItemAnnotation: LineItem | undefined,
	tableManifestConfiguration: TableControlConfiguration,
	converterContext: ConverterContext<PageContextPathTarget>,
	navigationSettings: NavigationSettingsConfiguration,
	visualizationPath: string
): CreateBehavior | CreateBehaviorExternal {
	const externalBehavior = getExternalCreationBehavior(tableManifestConfiguration, converterContext, navigationSettings);
	if (externalBehavior) {
		tableManifestConfiguration.creationMode = CreationMode.External;
		tableManifestConfiguration.outboundCreation = externalBehavior.outbound;
		return externalBehavior;
	}

	const tableManifestSettings: TableManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	const originalTableSettings = tableManifestSettings?.tableSettings ?? {};
	const navigationDetails = navigationSettings?.detail;
	if (
		converterContext.getTemplateType() === TemplateType.ListReport &&
		![CreationMode.NewPage, CreationMode.External, CreationMode.CreationDialog].includes(tableManifestConfiguration.creationMode)
	) {
		// Fallback to "NewPage"
		Log.warning(
			`Creation mode '${tableManifestConfiguration.creationMode}' can not be used within the List Report. Instead, the default mode "NewPage" is used.`
		);
		tableManifestConfiguration.creationMode = CreationMode.NewPage;
	} else if (
		converterContext.getTemplateType() !== TemplateType.ListReport &&
		tableManifestConfiguration.type === "TreeTable" &&
		![CreationMode.NewPage, CreationMode.Inline, CreationMode.CreationDialog].includes(tableManifestConfiguration.creationMode)
	) {
		// Fallback to "NewPage" in case of a non-supported mode for a TreeTable
		Log.warning(
			`Creation mode '${tableManifestConfiguration.creationMode}' can not be used with a Tree Table. Instead, the default mode "NewPage" is used.`
		);
		tableManifestConfiguration.creationMode = CreationMode.NewPage;
	}

	let newAction;
	if (lineItemAnnotation) {
		// in-app
		const targetAnnotations = converterContext.getEntitySet()?.annotations;
		const targetAnnotationsCommon = targetAnnotations?.Common as EntitySetAnnotations_Common,
			targetAnnotationsSession = targetAnnotations?.Session as EntitySetAnnotations_Session;
		newAction = targetAnnotationsCommon?.DraftRoot?.NewAction || targetAnnotationsSession?.StickySessionSupported?.NewAction;
		if (tableManifestConfiguration.creationMode === CreationMode.CreationRow && newAction) {
			// A combination of 'CreationRow' and 'NewAction' does not make sense
			throw Error(`Creation mode '${CreationMode.CreationRow}' can not be used with a custom 'new' action (${newAction})`);
		}
		if (navigationDetails?.route) {
			// route specified
			return {
				mode: tableManifestConfiguration.creationMode,
				append: tableManifestConfiguration.createAtEnd,
				newAction: newAction?.toString(),
				navigateToTarget: tableManifestConfiguration.creationMode === CreationMode.NewPage ? navigationDetails.route : undefined // navigate only in NewPage mode
			};
		}
	}
	// no navigation or no route specified - fallback to inline create if original creation mode was 'NewPage'
	if (tableManifestConfiguration.creationMode === CreationMode.NewPage) {
		if (converterContext.getTemplateType() === TemplateType.ListReport) {
			Log.error("The creation mode 'NewPage' is used but the navigation configuration to the sub page is missing.");
		} else {
			tableManifestConfiguration.creationMode = CreationMode.Inline;
			// In case there was no specific configuration for the createAtEnd we force it to false
			if (originalTableSettings.creationMode?.createAtEnd === undefined) {
				tableManifestConfiguration.createAtEnd = false;
			}
			Log.info("The creation mode was changed from 'NewPage' to 'Inline' due to missing navigation configuration to the sub page.");
		}
	}
	return {
		mode: tableManifestConfiguration.creationMode,
		append: tableManifestConfiguration.createAtEnd,
		newAction: newAction?.toString()
	};
}
const _getRowConfigurationProperty = function (
	lineItemAnnotation: LineItem | undefined,
	converterContext: ConverterContext<PageContextPathTarget>,
	navigationSettings: NavigationSettingsConfiguration,
	targetPath: string,
	tableType: TableType,
	aggregationOnLeafLevelenabled?: boolean
): RowConfiguration {
	let navigationInfo: RowNavigationInfo | undefined;
	let criticalityProperty: BindingToolkitExpression<MessageType> = constant(MessageType.None);
	const targetEntityType = converterContext.getEntityType();
	const criticalityAnnotation = lineItemAnnotation?.annotations?.UI?.Criticality;
	if (navigationSettings && lineItemAnnotation) {
		const navigationTarget = navigationSettings.display?.target || navigationSettings.detail?.outbound;
		const targetEntitySet = converterContext.getEntitySet();
		criticalityProperty = getHighlightRowBinding(
			criticalityAnnotation,
			!!ModelHelper.getDraftRoot(targetEntitySet) || !!ModelHelper.getDraftNode(targetEntitySet),
			targetEntityType
		);
		if (navigationTarget) {
			navigationInfo = { type: "Outbound", navigationTarget };
		}
		if (!navigationTarget && navigationSettings.detail?.route) {
			const checkEditable =
				ModelHelper.getDraftRoot(targetEntitySet) !== undefined || ModelHelper.getDraftNode(targetEntitySet) !== undefined;
			navigationInfo = {
				type: "Navigation",
				routePath: navigationSettings.detail.route,
				targetPath,
				checkEditable,
				recreateContext: tableType === "AnalyticalTable"
			};
		}
	}
	const rowNavigatedExpression: BindingToolkitExpression<boolean> = formatResult(
		[pathInModel("/deepestPath", "internal")],
		tableFormatters.navigatedRow,
		targetEntityType
	);
	return {
		navigationInfo,
		actionType: navigationInfo ? "Navigation" : undefined,
		rowHighlighting: compileExpression(criticalityProperty),
		rowNavigated: compileExpression(rowNavigatedExpression),
		rowCriticalityForInsights: criticalityAnnotation ? criticalityExpressionForIntegrationCards(criticalityAnnotation) : undefined,
		visible: compileExpression(and(not(UI.IsInactive), aggregationOnLeafLevelenabled ? UI.isNodeLevelNavigable : true))
	};
};

/**
 * Creates a PropertyInfo for the identified additional property for the ALP table use-case.
 *
 * For e.g. If UI.Hidden points to a property, include this technical property in the additionalProperties of ComplexPropertyInfo object.
 * @param name The name of the property to be created.
 * @param columns The list of columns created for LineItems and Properties of entityType from the table visualization.
 * @param relatedAdditionalPropertyNameMap
 */
const createTechnicalProperty = function (
	name: string,
	columns: TableColumn[],
	relatedAdditionalPropertyNameMap: Record<string, string>
): void {
	const key = `Property_Technical::${name}`;
	// Validate if the technical property hasn't yet been created on previous iterations.
	const columnExists = columns.find((column) => column.key === key);
	// Retrieve the simple property used by the hidden annotation, it will be used as a base for the mandatory attributes of newly created technical property. For e.g. relativePath
	const additionalProperty =
		!columnExists && (columns.find((column) => column.name === name && !column.propertyInfos) as AnnotationTableColumn)!;
	if (additionalProperty) {
		const technicalColumn: AnnotationTableColumn = {
			key: key,
			type: ColumnType.Annotation,
			label: additionalProperty.label,
			annotationPath: additionalProperty.annotationPath,
			dataType: "Edm.String",
			availability: "Hidden",
			name: key,
			relativePath: additionalProperty.relativePath,
			sortable: false,
			isGroupable: false,
			isKey: false,
			exportSettings: null,
			caseSensitive: false,
			aggregatable: false,
			filterable: false,
			extension: {
				technicallyGroupable: true,
				technicallyAggregatable: true
			}
		};
		columns.push(technicalColumn);
		relatedAdditionalPropertyNameMap[name] = technicalColumn.name;
	}
};

export function getP13nMode(
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	tableManifestConfiguration: TableControlConfiguration
): TableP13nMode[] | undefined {
	const manifestWrapper: ManifestWrapper = converterContext.getManifestWrapper();
	const tableManifestSettings: TableManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	const variantManagement: VariantManagementType = manifestWrapper.getVariantManagement();
	const modes: TableP13nMode[] = [];
	const isAnalyticalTable = tableManifestConfiguration.type === "AnalyticalTable";
	const isResponsiveTable = tableManifestConfiguration.type === "ResponsiveTable";
	if (tableManifestSettings?.tableSettings?.personalization !== undefined) {
		// Personalization configured in manifest.
		const personalization = tableManifestSettings.tableSettings.personalization;
		if (personalization === true) {
			// Table personalization fully enabled.
			switch (tableManifestConfiguration.type) {
				case "AnalyticalTable":
					return ["Sort", "Column", "Filter", "Group", "Aggregate"];
				case "ResponsiveTable":
					return ["Sort", "Column", "Filter", "Group"];
				default:
					return ["Sort", "Column", "Filter"];
			}
		} else if (typeof personalization === "object") {
			// Specific personalization options enabled in manifest. Use them as is.
			if (personalization.sort) {
				modes.push("Sort");
			}
			if (personalization.column) {
				modes.push("Column");
			}
			if (personalization.filter) {
				modes.push("Filter");
			}
			if (personalization.group && (isAnalyticalTable || isResponsiveTable)) {
				modes.push("Group");
			}
			if (personalization.aggregate && isAnalyticalTable) {
				modes.push("Aggregate");
			}
			return modes.length > 0 ? modes : undefined;
		}
	} else {
		// No personalization configured in manifest.
		modes.push("Sort");
		modes.push("Column");
		if (converterContext.getTemplateType() === TemplateType.ListReport) {
			if (variantManagement === VariantManagementType.Control || _isFilterBarHidden(manifestWrapper, converterContext)) {
				// Feature parity with V2.
				// Enable table filtering by default only in case of Control level variant management.
				// Or when the LR filter bar is hidden via manifest setting
				modes.push("Filter");
			}
		} else {
			modes.push("Filter");
		}
		if (isAnalyticalTable) {
			modes.push("Group");
			modes.push("Aggregate");
		}
		if (isResponsiveTable) {
			modes.push("Group");
		}
		return modes;
	}
}
/**
 * Returns a Boolean value suggesting if a filter bar is being used on the page.
 *
 * Chart has a dependency to filter bar (issue with loading data). Once resolved, the check for chart should be removed here.
 * Until then, hiding filter bar is now allowed if a chart is being used on LR.
 * @param manifestWrapper Manifest settings getter for the page
 * @param converterContext The instance of the converter context
 * @returns Boolean suggesting if a filter bar is being used on the page.
 */
function _isFilterBarHidden(manifestWrapper: ManifestWrapper, converterContext: ConverterContext<PageContextPathTarget>): boolean {
	return (
		manifestWrapper.isFilterBarHidden() &&
		!converterContext.getManifestWrapper().hasMultipleVisualizations() &&
		converterContext.getTemplateType() !== TemplateType.AnalyticalListPage
	);
}
/**
 * Returns a JSON string containing the sort conditions for the presentation variant.
 * @param converterContext The instance of the converter context
 * @param presentationVariantAnnotation Presentation variant annotation
 * @param columns Table columns processed by the converter
 * @returns Sort conditions for a presentation variant.
 */
function getSortConditions(
	converterContext: ConverterContext<PageContextPathTarget>,
	presentationVariantAnnotation: PresentationVariantType | undefined,
	columns: TableColumn[]
): TableSortConditions | undefined {
	// Currently navigation property is not supported as sorter
	const nonSortableProperties = getRestrictionsOnProperties(converterContext).nonSortableProperties;
	const sortConditions: TableSortConditions = {
		sorters: []
	};
	if (presentationVariantAnnotation?.SortOrder) {
		presentationVariantAnnotation.SortOrder.forEach((condition) => {
			const conditionProperty = condition.Property;
			if (conditionProperty?.$target !== undefined && !nonSortableProperties.includes(conditionProperty.$target.name)) {
				const infoName = convertPropertyPathsToInfoNames([conditionProperty], columns)[0];
				if (infoName) {
					sortConditions.sorters.push({
						name: infoName,
						descending: !!condition.Descending
					});
				}
			}
		});
	}
	return sortConditions.sorters.length ? sortConditions : undefined;
}
function getInitialExpansionLevel(presentationVariantAnnotation: PresentationVariantType | undefined): number | undefined {
	if (!presentationVariantAnnotation) {
		return undefined;
	}
	const level = presentationVariantAnnotation.InitialExpansionLevel?.valueOf();
	return typeof level === "number" ? level + 1 : undefined;
}
/**
 * Converts an array of propertyPath to an array of propertyInfo names.
 * @param paths The array to be converted
 * @param columns The array of propertyInfos
 * @returns An array of propertyInfo names
 */
function convertPropertyPathsToInfoNames(paths: PropertyPath[], columns: TableColumn[]): string[] {
	const infoNames: string[] = [];
	let propertyInfo: TableColumn | undefined, annotationColumn: AnnotationTableColumn;
	paths.forEach((currentPath) => {
		if (currentPath?.value) {
			propertyInfo = columns.find((column) => {
				annotationColumn = column as AnnotationTableColumn;
				return !annotationColumn.propertyInfos && annotationColumn.relativePath === currentPath?.value;
			});
			if (propertyInfo) {
				infoNames.push(propertyInfo.name);
			}
		}
	});
	return infoNames;
}
/**
 * Returns a JSON string containing Presentation Variant group conditions.
 * @param presentationVariantAnnotation Presentation variant annotation
 * @param columns Converter processed table columns
 * @param tableType The table type.
 * @returns Group conditions for a Presentation variant.
 */
function getGroupConditions(
	presentationVariantAnnotation: PresentationVariantType | undefined,
	columns: TableColumn[],
	tableType: string
): TableGroupConditions | undefined {
	const groupConditions: TableGroupConditions = {
		groupLevels: []
	};
	if (presentationVariantAnnotation?.GroupBy) {
		let aGroupBy = presentationVariantAnnotation.GroupBy;
		if (tableType === "ResponsiveTable") {
			aGroupBy = aGroupBy.slice(0, 1);
		}
		groupConditions.groupLevels = convertPropertyPathsToInfoNames(aGroupBy, columns).map((infoName) => {
			return { name: infoName };
		});
	}
	return groupConditions.groupLevels.length ? groupConditions : undefined;
}
/**
 * Updates the column's propertyInfos of an analytical table integrating all extensions and binding-relevant property info part.
 * @param tableVisualization The visualization to be updated
 */
function _updatePropertyInfosWithAggregatesDefinitions(tableVisualization: TableVisualization): void {
	const relatedAdditionalPropertyNameMap: Record<string, string> = {};
	tableVisualization.columns.forEach((column) => {
		column = column as AnnotationTableColumn;
		const propertyNameFromAnalyticsInfo = _getPropertyNameFromAnalyticsInfo(tableVisualization, column.name);
		if (propertyNameFromAnalyticsInfo) {
			const aggregatablePropertyDefinition = tableVisualization.analyticsExtensions![propertyNameFromAnalyticsInfo];
			column.aggregatable = !aggregatablePropertyDefinition.fromGroupableProperty;
			column.extension = aggregatablePropertyDefinition ?? {};
			if (!column.isGroupable && !column.aggregatable) {
				// The column is neither aggregatable nor groupable --> it's a hidden column to allow filtering in P13N
				// We need to remove additionalProperties, as it's not needed and causes an error in the MDC table code
				delete column.extension.additionalProperties;
			}
			if (column.isGroupable && column.extension.additionalProperties && column.extension.additionalProperties.length) {
				// For the time being, properties with context-defining properties shall not be allowed for visual grouping
				// We need a UX concept to support this (as the end user would need to group on the context-defining properties before grouping
				// on the property itself).
				column.isGroupable = false;
				column.extension.technicallyGroupable = true;
			}
		}
		if (column.additionalPropertyInfos?.length) {
			column.additionalPropertyInfos.forEach((additionalPropertyInfo) => {
				// Create propertyInfo for each additional property.
				// The new property 'name' has been prefixed with 'Property_Technical::' for uniqueness and it has been named technical property as it requires dedicated MDC attributes (technicallyGroupable and technicallyAggregatable).
				createTechnicalProperty(additionalPropertyInfo, tableVisualization.columns, relatedAdditionalPropertyNameMap);
			});
		}
		_updateForTextOnlyPropertiesWithCDP(tableVisualization, column);
	});
	tableVisualization.columns.forEach((column) => {
		column = column as AnnotationTableColumn;
		if (column.additionalPropertyInfos) {
			column.additionalPropertyInfos = column.additionalPropertyInfos.map(
				(propertyInfo) => relatedAdditionalPropertyNameMap[propertyInfo] ?? propertyInfo
			);
			// Add additional properties to the complex property using the hidden annotation.
			column.propertyInfos = column.propertyInfos?.concat(column.additionalPropertyInfos);
		}
	});
}

/**
 * Provides the referenced property name from the analytics data
 * @param tableVisualization The visualization to be analyzed
 * @param name The property name
 * @returns The property name from the analytics data
 */

function _getPropertyNameFromAnalyticsInfo(tableVisualization: TableVisualization, name: string): string | undefined {
	return Object.keys(tableVisualization.analyticsExtensions!).find((aggregate) => aggregate === name);
}

/**
 * Updates the column's propertyInfos of a column annotated with text only on an analytical table.
 * The referenced text property could define context-defining properties to be included into the column's propertyInfos.
 * @param tableVisualization The visualization to be analyzed
 * @param column The column containing the "textArrangement" object when present
 */
function _updateForTextOnlyPropertiesWithCDP(tableVisualization: TableVisualization, column: AnnotationTableColumn): void {
	// Currently a column referencing a text only property only contains the text property into its propertyInfos.
	// Properties referencing context-defining properties (CDP) aren't allowed for grouping. This need to change for text only columns, as in common cases, text properties reference their value properties into their CDPs.
	// So, we now include the value property into the propertyInfos of the column to allow the grouping on the property value.
	if (column.textArrangement?.mode === "Description" && column.textArrangement.textProperty) {
		const analyticsInfoPropertyNameForDesc = _getPropertyNameFromAnalyticsInfo(tableVisualization, column.textArrangement.textProperty);
		if (analyticsInfoPropertyNameForDesc) {
			const aggregatablePropertyDefinition = tableVisualization.analyticsExtensions![analyticsInfoPropertyNameForDesc];
			// We need to make sure the text property has CDP properties defined and the value property is part of these properties.
			if (
				aggregatablePropertyDefinition.additionalProperties?.length &&
				aggregatablePropertyDefinition.additionalProperties.includes(column.name)
			) {
				// The property value (single property) exists already on the list of columns from the table but it was only created for filtering purposes in P13n and not linked to the column with the text arrangement #TextOnly,
				// therefore not proposed as a default value for grouping the column menu. Now it'll be included into the propertyInfos of the column to allow the default grouping on this value property.
				const columnWithTextOnly = (tableVisualization.columns as AnnotationTableColumn[]).find(
					(textOnlyColumn) => textOnlyColumn.relativePath === column.relativePath && textOnlyColumn.propertyInfos
				);
				columnWithTextOnly?.propertyInfos?.push(column.name);
			}
		}
	}
}

/**
 * Returns a JSON string containing Presentation Variant aggregate conditions.
 * @param presentationVariantAnnotation Presentation variant annotation
 * @param columns Converter processed table columns
 * @param extensionInfoMap
 * @returns Group conditions for a Presentation variant.
 */
function getAggregateConditions(
	presentationVariantAnnotation: PresentationVariantType | undefined,
	columns: TableColumn[],
	extensionInfoMap: Record<string, InternalExtensionForAnalytics>
): TableAggregateConditions | undefined {
	const aggregateConditions: TableAggregateConditions = {};
	if (presentationVariantAnnotation?.Total) {
		const aTotals = presentationVariantAnnotation.Total;
		convertPropertyPathsToInfoNames(aTotals, columns).forEach((infoName) => {
			aggregateConditions[infoName] = {};
		});
	} else {
		for (const key in extensionInfoMap) {
			if (!extensionInfoMap[key].fromGroupableProperty) {
				aggregateConditions[key] = {};
			}
		}
	}
	return Object.keys(aggregateConditions).length ? aggregateConditions : undefined;
}
export type StandardActionsConfiguration = {
	creationBehaviour: TableAnnotationConfiguration["create"];
	cutButtonVisibilityExpression: BindingToolkitExpression<boolean>;
	deleteButtonVisibilityExpression: BindingToolkitExpression<boolean>;
	massEditButtonVisibilityExpression: BindingToolkitExpression<boolean>;
	isInsertUpdateActionsTemplated: boolean;
	standardActions: {
		create: StandardAction;
		delete: StandardAction;
		paste: StandardAction;
		massEdit: StandardAction;
		insights: StandardAction;
		creationRow: StandardAction;
		cut: StandardAction;
		copy: StandardAction;
		moveUp?: StandardAction;
		moveDown?: StandardAction;
	};
};
/**
 * Calculates the standard actions and adjacent properties that are needed in the further conversion process.
 * @param lineItemAnnotation Collection of data fields used for representation in a table or list
 * @param visualizationPath The visualization path
 * @param converterContext The instance of the converter context
 * @param tableManifestConfiguration The table manifest configuration
 * @param navigationSettings The navigation target manifest configuration
 * @returns Standard actions and connected properties
 */
export function getStandardActionsConfiguration(
	lineItemAnnotation: LineItem | undefined,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	tableManifestConfiguration: TableControlConfiguration,
	navigationSettings: NavigationSettingsConfiguration
): StandardActionsConfiguration {
	const creationBehaviour = _getCreationBehaviour(
		lineItemAnnotation,
		tableManifestConfiguration,
		converterContext,
		navigationSettings,
		visualizationPath
	);
	const standardActionsContext = generateStandardActionsContext(
		converterContext,
		creationBehaviour.mode as CreationMode,
		tableManifestConfiguration
	);
	const cutButtonVisibilityExpression = getCutVisibility(converterContext, standardActionsContext);
	const deleteButtonVisibilityExpression = getDeleteVisibility(converterContext, standardActionsContext);
	const massEditButtonVisibilityExpression = getMassEditVisibility(converterContext, standardActionsContext);
	const isInsertUpdateActionsTemplated = getInsertUpdateActionsTemplating(
		standardActionsContext,
		isDraftOrStickySupported(converterContext)
	);
	const standardActions = {
		cut: getStandardActionCut(converterContext, standardActionsContext),
		copy: getStandardActionCopy(converterContext, standardActionsContext),
		create: getStandardActionCreate(converterContext, standardActionsContext),
		delete: getStandardActionDelete(converterContext, standardActionsContext),
		paste: getStandardActionPaste(converterContext, standardActionsContext, isInsertUpdateActionsTemplated),
		massEdit: getStandardActionMassEdit(converterContext, standardActionsContext),
		insights: getStandardActionInsights(converterContext, standardActionsContext, visualizationPath),
		creationRow: getCreationRow(converterContext, standardActionsContext)
	};
	const configuration: StandardActionsConfiguration = {
		creationBehaviour,
		cutButtonVisibilityExpression,
		deleteButtonVisibilityExpression,
		massEditButtonVisibilityExpression,
		isInsertUpdateActionsTemplated,
		standardActions
	};

	if (standardActionsContext.tableManifestConfiguration.type === "TreeTable") {
		configuration.standardActions.moveUp = getStandardActionMoveUpDown(converterContext, standardActionsContext, true);
		configuration.standardActions.moveDown = getStandardActionMoveUpDown(converterContext, standardActionsContext, false);
	}

	return configuration;
}
export function getTableAnnotationConfiguration(
	lineItemAnnotation: LineItem | undefined,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	tableManifestConfiguration: TableControlConfiguration,
	columns: TableColumn[],
	navigationSettings: NavigationSettingsConfiguration,
	standardActionsConfiguration: StandardActionsConfiguration,
	presentationVariantAnnotation?: PresentationVariantType
): TableAnnotationConfiguration {
	// Need to get the target
	const tableManifestSettings: TableManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	const { navigationPropertyPath } = splitPath(visualizationPath);
	const typeNamePlural = converterContext.getDataModelObjectPath().targetEntityType.annotations?.UI?.HeaderInfo?.TypeNamePlural;
	const title = typeNamePlural && compileExpression(getExpressionFromAnnotation(typeNamePlural));
	const entitySet = converterContext.getDataModelObjectPath().targetEntitySet;
	const pageManifestSettings: ManifestWrapper = converterContext.getManifestWrapper();
	const hasAbsolutePath = navigationPropertyPath.length === 0;
	const p13nMode = getP13nMode(visualizationPath, converterContext, tableManifestConfiguration);
	const id = navigationPropertyPath ? getTableID(visualizationPath) : getTableID(converterContext.getContextPath(), "LineItem");
	const targetCapabilities = getCapabilityRestriction(converterContext);
	const navigationTargetPath = getNavigationTargetPath(converterContext, navigationPropertyPath);
	const selectionMode = getSelectionMode(
		lineItemAnnotation,
		visualizationPath,
		converterContext,
		hasAbsolutePath,
		targetCapabilities,
		standardActionsConfiguration.deleteButtonVisibilityExpression,
		standardActionsConfiguration.massEditButtonVisibilityExpression,
		standardActionsConfiguration.cutButtonVisibilityExpression
	);
	let threshold = navigationPropertyPath ? 10 : 30;
	if (presentationVariantAnnotation?.MaxItems) {
		threshold = presentationVariantAnnotation.MaxItems.valueOf();
	} else if (tableManifestConfiguration.type === "TreeTable") {
		// To make scrolling smooth, we set the threshold value higher for tree tables
		threshold = 200;
	} else if (tableManifestConfiguration.type === "GridTable" || tableManifestConfiguration.type === "AnalyticalTable") {
		threshold = 100;
	}
	const variantManagement: VariantManagementType = pageManifestSettings.getVariantManagement();
	const isSearchable = isPathSearchable(converterContext.getDataModelObjectPath());
	return {
		id: id,
		apiId: generate([id, "Table"]),
		entityName: entitySet ? entitySet.name : "",
		entityTypeName: entitySet && entitySet.entityType ? entitySet.entityType.name : "",
		collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
		navigationPath: navigationPropertyPath,
		row: _getRowConfigurationProperty(
			lineItemAnnotation,
			converterContext,
			navigationSettings,
			navigationTargetPath,
			tableManifestConfiguration.type,
			tableManifestConfiguration.analyticalConfiguration?.aggregationOnLeafLevel
		),
		p13nMode,
		isInsertUpdateActionsTemplated: standardActionsConfiguration.isInsertUpdateActionsTemplated,
		updatablePropertyPath: getCurrentEntitySetUpdatablePath(converterContext),
		displayMode: isInDisplayMode(converterContext, true),
		create: standardActionsConfiguration.creationBehaviour,
		selectionMode: selectionMode,
		variantManagement: variantManagement === "Control" && !p13nMode ? VariantManagementType.None : variantManagement,
		threshold: threshold,
		sortConditions: getSortConditions(converterContext, presentationVariantAnnotation, columns),
		title: title,
		searchable:
			tableManifestSettings.tableSettings?.isSearchable === false
				? false
				: tableManifestConfiguration.type !== "AnalyticalTable" && !(isConstant(isSearchable) && isSearchable.value === false),
		initialExpansionLevel: getInitialExpansionLevel(presentationVariantAnnotation),
		requiredProperties: getRequiredProperties(converterContext)
			.filter((property) => property?.$target?.type !== "Edm.Boolean")
			.map((property) => property.value)
	};
}

/**
 * Splits the visualization path into navigation property path and annotation.
 * @param visualizationPath
 * @returns The split path
 */
export function splitPath(visualizationPath: string): { navigationPropertyPath: string; annotationPath: string } {
	const [targetNavigationPropertyPath, annotationPath] = visualizationPath.split("@");
	let navigationPropertyPath = targetNavigationPropertyPath;
	if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
		// Drop trailing slash
		navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
	}
	return { navigationPropertyPath, annotationPath };
}
export function getSelectionVariantConfiguration(
	selectionVariantPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): SelectionVariantConfiguration | undefined {
	const resolvedTarget = converterContext.getEntityTypeAnnotation(selectionVariantPath);
	const selection: SelectionVariant = resolvedTarget.annotation as SelectionVariant;
	if (selection) {
		const propertyNames: string[] = [];
		selection.SelectOptions?.forEach((selectOption: SelectOptionType) => {
			const propertyName = selectOption.PropertyName;
			const propertyPath: string = propertyName?.value ?? "";
			if (!propertyNames.includes(propertyPath)) {
				propertyNames.push(propertyPath);
			}
		});
		return {
			text: selection?.Text?.toString(),
			propertyNames: propertyNames
		};
	}
	return undefined;
}
function _getFullScreenBasedOnDevice(
	tableSettings: TableManifestSettingsConfiguration,
	converterContext: ConverterContext<PageContextPathTarget>,
	isIphone: boolean
): boolean {
	// If enableFullScreen is not set, use as default true on phone and false otherwise
	let enableFullScreen = tableSettings.enableFullScreen ?? isIphone;
	// Make sure that enableFullScreen is not set on ListReport for desktop or tablet
	if (!isIphone && enableFullScreen && converterContext.getTemplateType() === TemplateType.ListReport) {
		enableFullScreen = false;
		converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.Low, IssueType.FULLSCREENMODE_NOT_ON_LISTREPORT);
	}
	return enableFullScreen;
}
function _getMultiSelectMode(
	tableSettings: TableManifestSettingsConfiguration,
	tableType: TableType,
	converterContext: ConverterContext<PageContextPathTarget>
): string | undefined {
	let multiSelectMode: string | undefined;
	if (tableType !== "ResponsiveTable") {
		return undefined;
	}
	switch (converterContext.getTemplateType()) {
		case TemplateType.ListReport:
		case TemplateType.ObjectPage:
			multiSelectMode = tableSettings.selectAll === false ? "ClearAll" : "Default";
			if (converterContext.getTemplateType() === TemplateType.ObjectPage && converterContext.getManifestWrapper().useIconTabBar()) {
				multiSelectMode = !tableSettings.selectAll ? "ClearAll" : "Default";
			}
			break;
		case TemplateType.AnalyticalListPage:
			multiSelectMode = !tableSettings.selectAll ? "ClearAll" : "Default";
			break;
		default:
	}
	return multiSelectMode;
}
function _getTableMode(
	tableType: TableType,
	tableSettings: TableManifestSettingsConfiguration,
	isTemplateListReport: boolean
): { rowCountMode?: TableRowCountMode; rowCount?: number } {
	if (tableType !== "ResponsiveTable") {
		if (isTemplateListReport) {
			return {
				rowCountMode: "Auto",
				rowCount: 3
			};
		} else {
			return {
				rowCountMode: tableSettings.rowCountMode ?? "Fixed",
				rowCount: tableSettings.rowCount ?? (tableType === "GridTable" ? 5 : 10)
			};
		}
	} else {
		return {};
	}
}
function _getCondensedTableLayout(_tableType: TableType, _tableSettings: TableManifestSettingsConfiguration): boolean {
	return _tableSettings.condensedTableLayout !== undefined && _tableType !== "ResponsiveTable"
		? _tableSettings.condensedTableLayout
		: false;
}
function _getTableSelectionLimit(_tableSettings: TableManifestSettingsConfiguration): number {
	return _tableSettings.selectAll === true || _tableSettings.selectionLimit === 0 ? 0 : _tableSettings.selectionLimit || 200;
}
function _getTableInlineCreationRowCount(_tableSettings: TableManifestSettingsConfiguration): number {
	return _tableSettings.creationMode?.inlineCreationRowCount ? _tableSettings.creationMode?.inlineCreationRowCount : 1;
}

function _getEnableExport(
	tableSettings: TableManifestSettingsConfiguration,
	converterContext: ConverterContext<PageContextPathTarget>,
	enablePaste: boolean
): boolean {
	return tableSettings.enableExport !== undefined
		? tableSettings.enableExport
		: converterContext.getTemplateType() !== "ObjectPage" || enablePaste;
}
function _getFrozenColumnCount(tableSettings: TableManifestSettingsConfiguration): number | undefined {
	return tableSettings.frozenColumnCount;
}

/**
 * Get the widthIncludingColumnHeader value from the tableSettings if it exists.
 * @param tableSettings TableSettings Object
 * @returns Returns the value of widthIncludingColumnHeader or false
 */
function _getWidthIncludingColumnHeader(tableSettings: TableManifestSettingsConfiguration): boolean {
	return tableSettings.widthIncludingColumnHeader ?? false;
}

function getFilterConfiguration(
	tableSettings: TableManifestSettingsConfiguration,
	lineItemAnnotation: LineItem,
	converterContext: ConverterContext<PageContextPathTarget>,
	selectionVariantAnnotation: SelectionVariantType | undefined
): {
	filters: Partial<Record<"quickFilters" | "hiddenFilters", TableFiltersConfiguration>>;
	headerVisible: boolean;
} {
	let hideTableTitle = false;
	const filters: Partial<Record<"quickFilters" | "hiddenFilters", TableFiltersConfiguration>> = {};
	const targetEntityType = converterContext.getAnnotationEntityType(lineItemAnnotation);
	if (tableSettings.quickVariantSelection) {
		const quickFilterPaths = (tableSettings.quickVariantSelection.paths ?? []).reduce(
			(filterPaths: { annotationPath: string }[], path) => {
				if (targetEntityType.resolvePath(path.annotationPath)) {
					filterPaths.push({ annotationPath: path.annotationPath });
				}
				return filterPaths;
			},
			[]
		);
		if (quickFilterPaths.length) {
			filters.quickFilters = {
				showCounts: tableSettings.quickVariantSelection.showCounts,
				paths: quickFilterPaths
			};
		}
	}
	if (selectionVariantAnnotation) {
		/**
		 * Provide Selection Variant to hiddenFilters in order to set the SV filters to the table.
		 * MDC Table overrides binding Filter and from SAP FE the only method where we are able to add
		 * additional filter is 'rebindTable' into Table delegate.
		 * To avoid implementing specific LR feature to SAP FE Macro Table, the filter(s)  not managed by the FilterBar
		 * can be passed to macro table via parameter/context named filters and key hiddenFilters.
		 */
		filters.hiddenFilters = { paths: [{ annotationPath: `@${selectionVariantAnnotation.fullyQualifiedName.split("@")[1]}` }] };
	}

	hideTableTitle = !!tableSettings.quickVariantSelection?.hideTableTitle;
	return {
		filters: filters,
		headerVisible: !(filters?.quickFilters && hideTableTitle)
	};
}

/**
 * Determines if the action will have an expression for enablement generated.
 * @param dataField The dataField containing an action
 * @param sEntityType The current entity for templating
 * @returns Whether an expression for enablement is to be generated
 */
function _useEnabledExpression(dataField: DataFieldForActionTypes, sEntityType: string): boolean {
	// There are three cases when a table action has an OperationAvailable that leads to an enablement expression
	// and is not dependent upon the table entries.
	// 1. An action with an overload, that is executed against a parent entity.
	// 2. An unbound action
	// 3. A static action (that is, bound to a collection)
	let useEnabledExpression = false;
	if (dataField.ActionTarget?.annotations?.Core?.OperationAvailable !== undefined) {
		// Unbound action. Is recognised, but getExpressionFromAnnotation checks for isBound = true, so not generated.
		const isBound = dataField.ActionTarget?.isBound;
		//overload action
		const overloadAction = isBound && dataField.ActionTarget?.sourceType !== sEntityType;
		//static action
		const staticAction = dataField.ActionTarget?.parameters[0]?.isCollection;
		//copy action
		if (!isBound || overloadAction || staticAction) {
			useEnabledExpression = true;
		}
	}
	return useEnabledExpression;
}

/**
 * Updates the table control configuration with Tree-Table specific information.
 * @param tableConfiguration The table configuration
 * @param tableSettings Settings from the manifest
 * @param converterContext The instance of the converter context
 */
function updateTreeTableManifestConfiguration(
	tableConfiguration: TableControlConfiguration,
	tableSettings: TableManifestSettingsConfiguration,
	converterContext: ConverterContext
): void {
	const dataModelObjectPath = converterContext.getDataModelObjectPath();
	tableConfiguration.hierarchyQualifier = tableSettings.hierarchyQualifier;
	const hierarchyParentNavigationPropertyPath = getHierarchyParentNavigationPropertyPath(
		dataModelObjectPath,
		tableConfiguration.hierarchyQualifier!
	);
	const nonUpdatableNavigationProperties = getNonUpdatableNavigationProperties(dataModelObjectPath);
	tableConfiguration.isHierarchyParentNodeUpdatable = !nonUpdatableNavigationProperties?.includes(hierarchyParentNavigationPropertyPath);
	tableConfiguration.isNodeMovable = getCustomFunctionInfo(tableSettings.isNodeMovable, tableConfiguration);
	tableConfiguration.isNodeCopyable = getCustomFunctionInfo(tableSettings.isNodeCopyable, tableConfiguration);
	tableConfiguration.isMoveToPositionAllowed = getCustomFunctionInfo(tableSettings.isMoveToPositionAllowed, tableConfiguration);
	tableConfiguration.isCopyToPositionAllowed = getCustomFunctionInfo(tableSettings.isCopyToPositionAllowed, tableConfiguration);
	tableConfiguration.createEnablement = getCustomFunctionInfo(tableSettings.creationMode?.isCreateEnabled, tableConfiguration);

	if (tableSettings.creationMode?.nodeType?.propertyName && tableSettings.creationMode?.nodeType?.values) {
		const values = tableSettings.creationMode.nodeType.values;
		tableConfiguration.nodeType = {
			propertyName: tableSettings.creationMode.nodeType.propertyName,
			values: Object.keys(values).map((value) => {
				const nodeTypeInfo = values[value];

				if (typeof nodeTypeInfo === "string") {
					return {
						value,
						text: nodeTypeInfo
					};
				} else {
					return {
						value,
						text: nodeTypeInfo.label,
						creationDialogFields:
							tableConfiguration.creationMode === CreationMode.CreationDialog
								? getFieldList(nodeTypeInfo.creationFields, converterContext)
								: undefined
					};
				}
			})
		};
	}

	// Create in place
	if (tableSettings.creationMode?.createInPlace) {
		tableConfiguration.createInPlace = true;
	}
}

export function getCustomFunctionInfo(
	value: string | undefined,
	tableConfiguration: TableControlConfiguration
): ExternalMethodConfig | undefined {
	if (!value) {
		return undefined;
	}
	const lastDotIndex = value.lastIndexOf(".") || -1;
	const moduleName = value.substring(0, lastDotIndex).replace(/\./gi, "/");
	const methodName = value.substring(lastDotIndex + 1);

	// Add the custom module in the list of required modules if necessary
	if (!moduleName.startsWith("/extension/")) {
		if (!tableConfiguration.additionalRequiredModules) {
			tableConfiguration.additionalRequiredModules = [moduleName];
		} else if (!tableConfiguration.additionalRequiredModules.includes(moduleName)) {
			tableConfiguration.additionalRequiredModules.push(moduleName);
		}
	}

	return { moduleName, methodName };
}

/**
 * Retrieve the table control configuration optimistic batch information.
 * @param tableManifestSettings The table configuration
 @returns True if Optimistic batch mode is disabled
 */
function getOptimisticBatchSettingsFromManifest(tableManifestSettings: TableManifestConfiguration): boolean | undefined {
	// Optimistic batch is set by default
	return tableManifestSettings?.tableSettings?.disableRequestCache;
}

/**
 * Gets the settings coming from the manifest related to the mass edit dialog.
 * @param tableSettings The table configuration
 * @param converterContext The instance of the converter context
 * @returns The mass edit configuration.
 */
export function getMassEditSettings(
	tableSettings: TableManifestSettingsConfiguration,
	converterContext: ConverterContext<PageContextPathTarget>
): MassEditTableConfiguration {
	const defaultFieldConfiguration = {
		visibleFields: [],
		ignoredFields: [],
		operationGroupingMode:
			converterContext.getTemplateType() === TemplateType.ListReport
				? OperationGroupingMode.Isolated
				: OperationGroupingMode.ChangeSet
	};
	if (!tableSettings.enableMassEdit) {
		return { enabled: false, ...defaultFieldConfiguration };
	}
	if (tableSettings.enableMassEdit === true) {
		return { enabled: tableSettings.enableMassEdit, ...defaultFieldConfiguration };
	} else if (typeof tableSettings.enableMassEdit === "object") {
		return {
			enabled: true,
			visibleFields: getFieldList(tableSettings.enableMassEdit.visibleFields, converterContext),
			ignoredFields: getFieldList(tableSettings.enableMassEdit.ignoredFields, converterContext),
			operationGroupingMode:
				tableSettings.enableMassEdit.operationGroupingMode &&
				Object.values(OperationGroupingMode).includes(tableSettings.enableMassEdit.operationGroupingMode)
					? tableSettings.enableMassEdit.operationGroupingMode
					: defaultFieldConfiguration.operationGroupingMode,
			customFragment: tableSettings.enableMassEdit.customFragment,
			fromInline: tableSettings.enableMassEdit.fromInline
		};
	}
	return { enabled: false, ...defaultFieldConfiguration };
}

/**
 * Gets a list of the fields coming from the manifest.
 * @param fields The fields, could be a FieldGroup or fields separated by a comma
 * @param converterContext The instance of the converter context
 * @returns The list of fields.
 */
function getFieldList(fields: string | undefined, converterContext: ConverterContext<PageContextPathTarget>): string[] {
	if (!fields) {
		return [];
	}
	if (fields.includes(UIAnnotationTerms.FieldGroup)) {
		fields = fields.startsWith("@") ? fields : `@${fields}`;
		const fieldGroup = converterContext.getEntityTypeAnnotation<FieldGroup>(fields);
		if (isAnnotationOfType<FieldGroup>(fieldGroup.annotation, UIAnnotationTypes.FieldGroupType)) {
			return fieldGroup.annotation.Data.reduce((properties: string[], field) => {
				if (isDataField(field) && isPathAnnotationExpression(field.Value)) {
					properties.push(field.Value.path);
				}
				return properties;
			}, []);
		}
		return [];
	}
	return fields
		.replace(/\s/g, "")
		.split(",")
		.map((name) => name.trim());
}

export function getTableManifestConfiguration(
	lineItemAnnotation: LineItem | undefined,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	checkCondensedLayout = true,
	selectionVariantAnnotation?: SelectionVariantType
): TableControlConfiguration {
	const _manifestWrapper = converterContext.getManifestWrapper();
	const tableManifestSettings: TableManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
	const tableSettings = tableManifestSettings?.tableSettings ?? {};
	const globalFEManifestSettings = _manifestWrapper.getSapFeManifestConfiguration();
	const defaultCreationMode =
		globalFEManifestSettings?.macros?.table?.defaultCreationMode === "InlineCreationRows" ? CreationMode.InlineCreationRows : undefined;
	const creationMode: CreationMode = tableSettings.creationMode?.name ?? defaultCreationMode ?? CreationMode.NewPage;
	const enableAutoColumnWidth = !_manifestWrapper.isPhone();
	const disableCopyToClipboard = tableSettings.disableCopyToClipboard;
	const templateType = converterContext.getTemplateType();
	const isCondensedTableLayoutCompliant = checkCondensedLayout && _manifestWrapper.isCondensedLayoutCompliant();
	const oFilterConfiguration = lineItemAnnotation
		? getFilterConfiguration(tableSettings, lineItemAnnotation, converterContext, selectionVariantAnnotation)
		: {};
	const customValidationFunction = tableSettings.creationMode?.customValidationFunction;
	const exportRequestSize = tableSettings.exportRequestSize;
	const tableType = getTableType(converterContext, tableManifestSettings);
	const analyticalConfiguration = tableSettings.analyticalConfiguration;
	// By default, paste is enabled on an ObjectPage and on a ListReport with a draft TreeTable
	const enablePaste =
		tableSettings.enablePaste ??
		(converterContext.getTemplateType() === "ObjectPage" ||
			(tableType === "TreeTable" && (converterContext.getEntitySet() as EntitySet)?.annotations.Common?.DraftRoot !== undefined));
	const tableRowMode = _getTableMode(tableType, tableSettings, templateType === TemplateType.ListReport);
	const defaultScrollThreshold = tableType !== "ResponsiveTable" ? 300 : undefined;
	const condensedTableLayout = _getCondensedTableLayout(tableType, tableSettings);
	let inlineCreationRowsHiddenInEditMode = false;
	if (tableSettings.creationMode?.inlineCreationRowsHiddenInEditMode) {
		inlineCreationRowsHiddenInEditMode =
			typeof tableSettings.creationMode?.inlineCreationRowsHiddenInEditMode === "string"
				? tableSettings.creationMode?.inlineCreationRowsHiddenInEditMode === "true"
				: tableSettings.creationMode?.inlineCreationRowsHiddenInEditMode;
	}
	let useTextForNoDataMessages: string;
	if (converterContext.getTemplateType() === "ListReport") {
		useTextForNoDataMessages = "illustratedMessage-Auto";
	} else {
		useTextForNoDataMessages = _manifestWrapper.getUseTextForNoDataMessages() ? "text" : "illustratedMessage-ExtraSmall";
	}
	const oConfiguration = {
		// If no createAtEnd is specified it will be false for Inline/CreationDialog create and true otherwise
		createAtEnd:
			tableSettings.creationMode?.createAtEnd !== undefined
				? tableSettings.creationMode?.createAtEnd
				: ![CreationMode.Inline, CreationMode.CreationDialog].includes(creationMode),
		creationMode: creationMode,
		creationDialogFields:
			creationMode === CreationMode.CreationDialog
				? getFieldList(tableSettings.creationMode?.creationFields, converterContext)
				: undefined,
		customValidationFunction: customValidationFunction,
		hasDataStateIndicatorFilter: templateType === TemplateType.ListReport,
		// if a custom validation function is provided, disableAddRowButtonForEmptyData should not be considered, i.e. set to false
		disableAddRowButtonForEmptyData: !customValidationFunction ? !!tableSettings.creationMode?.disableAddRowButtonForEmptyData : false,
		enableAutoColumnWidth: enableAutoColumnWidth,
		enablePastingOfComputedProperties: tableSettings.enablePastingOfComputedProperties,
		ignoredFields: tableSettings.ignoredFields,
		readOnly: tableSettings.readOnly,
		enableExport: _getEnableExport(tableSettings, converterContext, enablePaste),
		analyticalConfiguration,
		frozenColumnCount: _getFrozenColumnCount(tableSettings),
		widthIncludingColumnHeader: _getWidthIncludingColumnHeader(tableSettings),
		enableFullScreen: _getFullScreenBasedOnDevice(tableSettings, converterContext, _manifestWrapper.isPhone()),
		massEdit: getMassEditSettings(tableSettings, converterContext),
		enableAddCardToInsights: tableSettings?.enableAddCardToInsights,
		enablePaste: enablePaste,
		disableCopyToClipboard: disableCopyToClipboard,
		headerVisible: true,
		header: tableSettings.header,
		multiSelectMode: _getMultiSelectMode(tableSettings, tableType, converterContext),
		selectionLimit: _getTableSelectionLimit(tableSettings),
		inlineCreationRowCount: _getTableInlineCreationRowCount(tableSettings),
		inlineCreationRowsHiddenInEditMode: inlineCreationRowsHiddenInEditMode,
		showRowCount: tableSettings?.quickVariantSelection?.paths ? false : !_manifestWrapper.getViewConfiguration()?.showCounts,
		type: tableType,
		disableRequestCache: getOptimisticBatchSettingsFromManifest(tableManifestSettings),
		useCondensedTableLayout: condensedTableLayout && isCondensedTableLayoutCompliant,
		isCompactType: _manifestWrapper.isCompactType(),
		exportRequestSize: exportRequestSize,
		enableUploadPlugin: !!converterContext.getAnnotationEntityType().annotations?.UI?.MediaResource?.Stream,
		modeForNoDataMessage: useTextForNoDataMessages,
		scrollThreshold: tableSettings.scrollThreshold ?? defaultScrollThreshold
	};

	const tableConfiguration: TableControlConfiguration = { ...oConfiguration, ...tableRowMode, ...oFilterConfiguration };
	tableConfiguration.beforeRebindTable = tableSettings.beforeRebindTable;
	tableConfiguration.selectionChange = tableSettings.selectionChange;
	tableConfiguration.rowPress = tableSettings.rowPress;
	if (tableType === "TreeTable") {
		updateTreeTableManifestConfiguration(tableConfiguration, tableSettings, converterContext);
	}

	if (tableSettings.headerVisible !== undefined) {
		tableConfiguration.headerVisible = tableSettings.headerVisible;
	}

	if (tableConfiguration.creationMode === CreationMode.External) {
		tableConfiguration.outboundCreation = tableSettings.creationMode?.outbound;
	}

	return tableConfiguration;
}

function getTableType(
	converterContext: ConverterContext<PageContextPathTarget>,
	tableManifestSettings?: TableManifestConfiguration
): TableType {
	if (tableManifestSettings?.tableSettings?.type) {
		// in case the application specified a table type we will use this one
		return tableManifestSettings.tableSettings.type;
	}

	// default is the ResponsiveTable
	return "ResponsiveTable";
}

export default {
	getTableActions,
	createTableVisualization,
	createDefaultTableVisualization,
	getCapabilityRestriction,
	getSelectionMode,
	getP13nMode,
	getStandardActionsConfiguration,
	getTableAnnotationConfiguration,
	splitPath,
	getSelectionVariantConfiguration,
	getTableManifestConfiguration,
	updateTableVisualizationForType,
	createRequestedProperties,
	getNavigationTargetPath,
	getCustomFunctionInfo
};

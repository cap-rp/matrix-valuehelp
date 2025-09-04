import {
	UIAnnotationTerms,
	type LineItem,
	type PresentationVariant,
	type SelectionPresentationVariant,
	type SelectionVariant,
	type SelectionVariantType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import { type TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import {
	VisualizationType,
	type AvailabilityType,
	type CustomDefinedTableColumn,
	type CustomDefinedTableColumnForOverride,
	type Importance,
	type TableManifestConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { type PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { type ChartVisualization } from "sap/fe/core/converters/controls/Common/Chart";
import {
	getDataVisualizationConfiguration,
	getVisualizationsFromAnnotation,
	type VisualizationAndPath
} from "sap/fe/core/converters/controls/Common/DataVisualization";
import { type TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import { type Placement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { isAnnotationOfTerm } from "sap/fe/core/helpers/TypeGuards";
import { getContextRelativeTargetObjectPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import MacroAPI from "../MacroAPI";
import type Action from "./Action";
import type ActionGroup from "./ActionGroup";
import type ActionOverride from "./ActionOverride";
import type Column from "./Column";
import type TableAPI from "./TableAPI";

export function createTableDefinition(tableAPI: TableAPI): TableVisualization {
	const owner = tableAPI._getOwner();
	const metaModel = owner?.getMetaModel();
	if (!owner || !metaModel) {
		Log.error("Cannot create a table definition for a TableAPI without an owner or a metamodel");
		throw new Error("Cannot create a table definition for a TableAPI without an owner or a metamodel");
	}
	const metaPathContext = metaModel.createBindingContext(tableAPI.getFullMetaPath());
	const contextPathContext = metaModel.createBindingContext(tableAPI.contextPath);
	if (!metaPathContext || !contextPathContext) {
		Log.error(`Incorrect metaPath (${tableAPI.metaPath}) or contextPath (${tableAPI.contextPath}) for tableAPI`);
		throw new Error("Incorrect metaPath or contextPath for tableAPI");
	}

	tableAPI.contextObjectPath = getInvolvedDataModelObjects<LineItem | PresentationVariant | SelectionPresentationVariant>(
		metaPathContext,
		contextPathContext
	);

	const initialConverterContext = MacroAPI.getConverterContext(tableAPI.contextObjectPath, tableAPI.contextPath, {
		appComponent: owner.getAppComponent(),
		models: owner.preprocessorContext?.models
	} as TemplateProcessorSettings);
	const visualizationPath = getVisualizationPath(tableAPI.contextObjectPath, initialConverterContext);

	const tableSettings = tableAPI.getSettingsForManifest();

	const extraManifestSettings: TableManifestConfiguration = {
		actions: {},
		columns: {},
		tableSettings
	};

	// Process custom actions and columns
	addSlotColumnsToExtraManifest(tableAPI, extraManifestSettings);
	addSlotActionsToExtraManifest(tableAPI, extraManifestSettings);

	const extraParams: Record<string, unknown> = {};
	extraParams[visualizationPath] = extraManifestSettings;
	const converterContext = MacroAPI.getConverterContext(
		tableAPI.contextObjectPath,
		tableAPI.contextPath,
		{
			appComponent: owner?.getAppComponent(),
			models: owner?.preprocessorContext?.models
		} as TemplateProcessorSettings,
		extraParams
	);

	let associatedSelectionVariant: SelectionVariantType | undefined;
	if (tableAPI.associatedSelectionVariantPath) {
		const svObjectPath = getInvolvedDataModelObjects<SelectionVariant>(
			metaModel.createBindingContext(tableAPI.associatedSelectionVariantPath)!,
			contextPathContext
		);
		associatedSelectionVariant = svObjectPath.targetObject;
	}

	const visualizationDefinition = getDataVisualizationConfiguration(
		(tableAPI.inMultiView && tableAPI.contextObjectPath.targetObject
			? converterContext.getRelativeAnnotationPath(
					tableAPI.contextObjectPath.targetObject.fullyQualifiedName,
					converterContext.getEntityType()
			  )
			: getContextRelativeTargetObjectPath(tableAPI.contextObjectPath)) as string,
		converterContext,
		{
			isCondensedTableLayoutCompliant: tableAPI.useCondensedLayout,
			associatedSelectionVariant,
			isMacroOrMultipleView: tableAPI.inMultiView ?? true
		}
	);

	// take the (first) Table visualization
	return visualizationDefinition.visualizations.find(
		(viz: TableVisualization | ChartVisualization) => viz.type === VisualizationType.Table
	) as TableVisualization;
}

/**
 * Returns the annotation path pointing to the visualization annotation (LineItem).
 * @param contextObjectPath The datamodel object path for the table
 * @param converterContext The converter context
 * @returns The annotation path
 */
function getVisualizationPath(
	contextObjectPath: DataModelObjectPath<LineItem | PresentationVariant | SelectionPresentationVariant>,
	converterContext: ConverterContext<PageContextPathTarget>
): string {
	const metaPath = getContextRelativeTargetObjectPath(contextObjectPath) as string;

	// fallback to default LineItem if metapath is not set
	if (!metaPath) {
		Log.error(`Missing meta path parameter for LineItem`);
		return `@${UIAnnotationTerms.LineItem}`;
	}

	if (isAnnotationOfTerm<LineItem>(contextObjectPath.targetObject, UIAnnotationTerms.LineItem)) {
		return metaPath; // MetaPath is already pointing to a LineItem
	}
	//Need to switch to the context related the PV or SPV
	const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);

	let visualizations: VisualizationAndPath[] = [];
	if (
		isAnnotationOfTerm<SelectionPresentationVariant>(contextObjectPath.targetObject, UIAnnotationTerms.SelectionPresentationVariant) ||
		isAnnotationOfTerm<PresentationVariant>(contextObjectPath.targetObject, UIAnnotationTerms.PresentationVariant)
	) {
		visualizations = getVisualizationsFromAnnotation(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
	} else {
		Log.error(`Bad metapath parameter for table : ${contextObjectPath.targetObject!.term}`);
	}

	const lineItemViz = visualizations.find((viz) => {
		return viz.visualization.term === UIAnnotationTerms.LineItem;
	});

	if (lineItemViz) {
		return lineItemViz.annotationPath;
	} else {
		// fallback to default LineItem if annotation missing in PV
		Log.error(`Bad meta path parameter for LineItem: ${contextObjectPath.targetObject!.term}`);
		return `@${UIAnnotationTerms.LineItem}`; // Fallback
	}
}

/**
 * Removes all properties with the value of undefined from the object.
 * @param obj The object to remove the undefined properties from
 */
function removeUndefinedProperties(obj: Record<string, unknown>): void {
	Object.keys(obj).forEach((key) => {
		if (obj[key] === undefined) {
			delete obj[key];
		}
	});
}

/**
 * Adds the slot columns to the extra manifest settings.
 * @param tableAPI
 * @param extraManifestSettings
 */
function addSlotColumnsToExtraManifest(tableAPI: TableAPI, extraManifestSettings: TableManifestConfiguration): void {
	let customColumnDefinition: CustomDefinedTableColumn | (CustomDefinedTableColumnForOverride & { key: string });

	tableAPI.columns?.forEach((column) => {
		const isColumn = column.isA<Column>("sap.fe.macros.table.Column");
		if (isColumn) {
			customColumnDefinition = {
				header: column.header,
				width: column.width,
				importance: column.importance as Importance,
				horizontalAlign: column.horizontalAlign,
				widthIncludingColumnHeader: column.widthIncludingColumnHeader,
				exportSettings: column.exportSettings,
				properties: column.properties,
				tooltip: column.tooltip,
				template: column.template!,
				availability: column.availability as AvailabilityType,
				required: column.required,
				type: "Slot"
			};
		} else {
			customColumnDefinition = {
				key: column.key,
				width: column.width,
				importance: column.importance as Importance,
				horizontalAlign: column.horizontalAlign,
				widthIncludingColumnHeader: column.widthIncludingColumnHeader,
				exportSettings: column.exportSettings,
				availability: column.availability as AvailabilityType
			};
		}

		// Remove all undefined properties, so that they don't erase what is set in the manifest
		// (necessary because manifest-based columns are transformed into slot columns and we don't copy
		// all their properties in the XML)
		removeUndefinedProperties(customColumnDefinition);

		if (isColumn && (column.anchor || column.placement)) {
			customColumnDefinition.position = {
				anchor: column.anchor,
				placement: (column.placement ?? "After") as Placement
			};
		}

		extraManifestSettings.columns![column.key] = customColumnDefinition;
	});
}

/**
 * Adds the slot actions to the extra manifest settings.
 * @param tableAPI
 * @param extraManifestSettings
 */
function addSlotActionsToExtraManifest(tableAPI: TableAPI, extraManifestSettings: TableManifestConfiguration): void {
	function addActionToExtraManifest(action: Action | ActionOverride): void {
		const actions = extraManifestSettings.actions!;
		const key = action.key;
		actions[key] = {
			position: {
				placement: (action.placement ?? "After") as Placement,
				anchor: action.anchor
			},
			command: action.command,
			enableOnSelect: action.enableOnSelect,
			visible: action.visible,
			enabled: action.enabled
		};
		if (action.isA<Action>("sap.fe.macros.table.Action")) {
			actions[key] = {
				...actions[key],
				text: action.text,
				__noWrap: true,
				press: "some handler", // The real handler will be triggered by firing the event on the Action object
				requiresSelection: action.requiresSelection
			};
			return;
		}
		const afterExecution = {
			enableAutoScroll: action["enableAutoScroll"],
			navigateToInstance: action["navigateToInstance"]
		};
		removeUndefinedProperties(afterExecution);
		actions[key] = {
			...actions[key],
			afterExecution: Object.entries(afterExecution).length ? afterExecution : undefined,
			defaultValuesFunction: action.defaultValuesFunction
		};
	}

	tableAPI.actions?.forEach((action) => {
		if (action.isA<Action>("sap.fe.macros.table.Action") || action.isA<ActionOverride>("sap.fe.macros.table.ActionOverride")) {
			// Action or ActionOverride
			addActionToExtraManifest(action);
		} else {
			const actionsSettings = extraManifestSettings.actions!;
			const key = action.key;
			actionsSettings[key] = {
				position: {
					placement: (action.placement ?? "After") as Placement,
					anchor: action.anchor
				},
				menu: action.actions.map((subAction) => subAction.key)
			};
			if (action.isA<ActionGroup>("sap.fe.macros.table.ActionGroup")) {
				actionsSettings[key] = {
					...actionsSettings[key],
					text: action.text,
					defaultAction: action.defaultAction,
					__noWrap: true
				};
			}
			action.actions.forEach((subAction) => {
				addActionToExtraManifest(subAction);
			});
		}
	});
}

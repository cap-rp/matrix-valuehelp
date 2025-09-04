import type { ConvertedMetadata, EntitySet, EntityType, NavigationProperty } from "@sap-ux/vocabularies-types";
import type {
	LineItem,
	PresentationVariant,
	SelectionPresentationVariant,
	SelectionVariant,
	SelectionVariantType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import { type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import {
	blockAggregation,
	blockAttribute,
	blockEvent,
	defineBuildingBlock
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type {
	AvailabilityType,
	CustomDefinedTableColumn,
	CustomDefinedTableColumnForOverride,
	HorizontalAlign,
	Importance,
	ManifestAction,
	TableManifestConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import { CreationMode, VisualizationType } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { ChartVisualization } from "sap/fe/core/converters/controls/Common/Chart";
import type { VisualizationAndPath } from "sap/fe/core/converters/controls/Common/DataVisualization";
import {
	getDataVisualizationConfiguration,
	getVisualizationsFromAnnotation
} from "sap/fe/core/converters/controls/Common/DataVisualization";
import type { CreateBehavior, TableType, TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import { StandardActionKeys } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import { type Placement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfTerm } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import MacroAPI from "sap/fe/macros/MacroAPI";
import type Action from "sap/fe/macros/table/Action";
import type ActionGroup from "sap/fe/macros/table/ActionGroup";
import type Column from "sap/fe/macros/table/Column";
import type { TableBlockProperties } from "sap/fe/macros/table/MdcTableTemplate";
import { getMDCTableTemplate } from "sap/fe/macros/table/MdcTableTemplate";
import TableAPI from "sap/fe/macros/table/TableAPI";
import TableCreationOptions from "sap/fe/macros/table/TableCreationOptions";
import FlexItemData from "sap/m/FlexItemData";
import { type TitleLevel } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import { createCustomData } from "../TSXUtils";
import type ActionGroupOverride from "./ActionGroupOverride";
import type ActionOverride from "./ActionOverride";
import type AnalyticalConfiguration from "./AnalyticalConfiguration";
import type ColumnOverride from "./ColumnOverride";
import type MassEdit from "./MassEdit";
import type QuickVariantSelection from "./QuickVariantSelection";
import TableEventHandlerProvider from "./TableEventHandlerProvider";

type BlockColumn = Partial<Omit<Column, "template" | "exportSettings">> & {
	template?: string;
	exportSettings?: Record<string, string | string[] | boolean>;
	_type: "Column";
};

type BlockColumnOverride = Partial<Omit<ColumnOverride, "exportSettings">> & {
	exportSettings?: Record<string, string | string[] | boolean>;
	_type: "ColumnOverride";
};
type BlockMassEdit = Partial<Omit<MassEdit, "customContent">> & { customContent?: string; key: string };
type BlockQuickVariantSelection = PropertiesOf<QuickVariantSelection> & { key: string };
type BlockAction = PropertiesOf<Omit<Action, "press">> & { _type: "Action"; press: string };
type BlockActionGroup = PropertiesOf<Omit<ActionGroup, "actions">> & {
	_type: "ActionGroup";
	actions: (BlockAction | BlockActionOverride)[];
};
type BlockActionOverride = PropertiesOf<ActionOverride> & { _type: "ActionOverride" };
type BlockActionGroupOverride = PropertiesOf<Omit<ActionGroupOverride, "actions">> & {
	_type: "ActionGroupOverride";
	actions: (BlockAction | BlockActionOverride)[];
};
function safeGetAttribute(node: Element, name: string): string | undefined {
	return node.getAttribute(name) ?? undefined;
}

/**
 * Gets the dynamic Boolean value of an attribute.
 * @param node The node to get the attribute from
 * @param name The name of the attribute
 * @returns The Boolean value of the attribute
 */
function getDynamicBooleanValueOfAttribute(node: Element, name: string): boolean {
	const enablementAttr = node.getAttribute(name);
	switch (enablementAttr) {
		case null:
		case "true":
			return true;
		case "false":
			return false;
		default:
			return enablementAttr as unknown as boolean; // To manage binding expressions
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
 * Gets the action properties from an XML node.
 * @param actionNode The action node
 * @returns The action properties
 */
function parseActionFromElement(actionNode: Element): BlockAction | BlockActionOverride {
	const commonProperties = getCommonCustomActionProperties(actionNode);
	if (actionNode.localName === "Action") {
		return {
			text: actionNode.getAttribute("text") ?? commonProperties.key,
			press: safeGetAttribute(actionNode, "press"),
			requiresSelection: actionNode.getAttribute("requiresSelection") === "true",
			...commonProperties
		} as BlockAction;
	}
	return {
		enableAutoScroll: getDynamicBooleanValueOfAttribute(actionNode, "enableAutoScroll"),
		navigateToInstance: getDynamicBooleanValueOfAttribute(actionNode, "navigateToInstance"),
		defaultValuesFunction: safeGetAttribute(actionNode, "defaultValuesFunction"),
		...commonProperties
	} as BlockActionOverride;
}

/**
 * Parses the common custom properties of the action from the XML node.
 * @param actionNode The action group node
 * @returns The column properties for the given node
 */
function getCommonCustomActionProperties(actionNode: Element): {
	key: string;
	enabled: boolean;
	visible: boolean;
	command: string | undefined;
	enableOnSelect: "single" | "multi" | undefined;
	placement: "Before" | "After" | undefined;
	anchor: string | undefined;
	_type: "Action" | "ActionOverride";
} {
	return {
		key: actionNode.getAttribute("key")!.replace("InlineXML_", ""),
		enabled: getDynamicBooleanValueOfAttribute(actionNode, "enabled"),
		visible: getDynamicBooleanValueOfAttribute(actionNode, "visible"),
		command: safeGetAttribute(actionNode, "command"),
		enableOnSelect: safeGetAttribute(actionNode, "enableOnSelect") as "single" | "multi" | undefined,
		placement: safeGetAttribute(actionNode, "placement") as "Before" | "After" | undefined,
		anchor: safeGetAttribute(actionNode, "anchor"),
		_type: actionNode.localName === "Action" ? "Action" : "ActionOverride"
	};
}

/**
 * Parses the actions and action groups from the XML node.
 * @param actionNode
 * @param aggregationObject
 * @returns The action or action group properties for the given node
 */
function setCustomActionGroupProperties(
	actionNode: Element,
	aggregationObject: Action | ActionOverride | ActionGroup | ActionGroupOverride
): BlockAction | BlockActionGroup | BlockActionOverride | BlockActionGroupOverride {
	if (["ActionGroup", "ActionGroupOverride"].includes(actionNode.localName)) {
		const commonProperties = getCommonCustomActionsGroupProperties(actionNode, aggregationObject as ActionGroup | ActionGroupOverride);
		if (actionNode.localName === "ActionGroup") {
			return {
				text: actionNode.getAttribute("text") ?? commonProperties.key,
				defaultAction: safeGetAttribute(actionNode, "defaultAction"),
				...commonProperties
			} as BlockActionGroup;
		}
		return commonProperties as BlockActionGroupOverride;
	}

	//Action or ActionOverride
	return parseActionFromElement(actionNode);
}

const setCustomMassEditProperties = function (element: Element): BlockMassEdit {
	return {
		key: "configuration",
		customContent: element.children[0]?.outerHTML,
		visibleFields: element.getAttribute("visibleFields")?.split(","),
		ignoredFields: element.getAttribute("ignoredFields")?.split(","),
		operationGroupingMode: (element.getAttribute("operationGroupingMode") ?? undefined) as "ChangeSet" | "Isolated" | undefined
	};
};

/**
 * Parses the quickVariantSelection from the XML node.
 * @param quickVariantSelection The XML node containing the quickVariantSelection
 * @returns The QuickVariantSelection for the given node
 */
const setQuickVariantSelection = function (quickVariantSelection: Element): BlockQuickVariantSelection {
	return {
		key: "quickFilters",
		paths: quickVariantSelection.getAttribute("paths")?.split(","),
		showCounts: quickVariantSelection.getAttribute("showCounts") === "true"
	};
};

/**
 * Parses the common custom properties of the action groups from the XML node.
 * @param actionNode The action group node
 * @param aggregationObject The aggregation object
 * @returns The column properties for the given node
 */
function getCommonCustomActionsGroupProperties(
	actionNode: Element,
	aggregationObject: ActionGroup | ActionGroupOverride
): {
	key: string;
	actions: (BlockAction | BlockActionOverride)[];
	anchor: string | undefined;
	placement: "Before" | "After" | undefined;
	_type: "ActionGroup" | "ActionGroupOverride";
} {
	const actionsInMenu = Array.prototype.slice.apply(actionNode.children).map((subAction: Element) => {
		return parseActionFromElement(subAction);
	});
	aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
	actionNode.setAttribute("key", aggregationObject.key);
	return {
		key: aggregationObject.key,
		actions: actionsInMenu,
		anchor: safeGetAttribute(actionNode, "anchor"),
		placement: safeGetAttribute(actionNode, "placement") as "Before" | "After" | undefined,
		_type: actionNode.localName === "ActionGroup" ? "ActionGroup" : "ActionGroupOverride"
	};
}

/**
 * Parses the common custom properties of the columns from the XML node.
 * @param childColumn The column node
 * @param aggregationObject The aggregation object
 * @returns The column properties for the given node
 */
function getCommonCustomColumnsProperties(
	childColumn: Element,
	aggregationObject: BlockColumn | BlockColumnOverride
): {
	key: string;
	width: string | undefined;
	widthIncludingColumnHeader: boolean | undefined;
	importance: Importance | undefined;
	horizontalAlign: HorizontalAlign | undefined;
	availability: AvailabilityType | undefined;
	placement: "Before" | "After" | undefined;
	anchor: string | undefined;
	exportSettings: Record<string, string | string[] | boolean> | undefined;
} {
	aggregationObject.key = aggregationObject.key!.replace("InlineXML_", "");
	childColumn.setAttribute("key", aggregationObject.key);
	return {
		key: aggregationObject.key,
		width: safeGetAttribute(childColumn, "width"),
		widthIncludingColumnHeader: childColumn.getAttribute("widthIncludingColumnHeader")
			? childColumn.getAttribute("widthIncludingColumnHeader") === "true"
			: undefined,
		importance: safeGetAttribute(childColumn, "importance") as Importance | undefined,
		horizontalAlign: safeGetAttribute(childColumn, "horizontalAlign") as HorizontalAlign | undefined,
		availability: safeGetAttribute(childColumn, "availability") as AvailabilityType | undefined,
		placement: (safeGetAttribute(childColumn, "placement") || safeGetAttribute(childColumn, "positionPlacement")) as
			| "Before"
			| "After"
			| undefined, // positionPlacement is kept for backwards compatibility
		anchor: safeGetAttribute(childColumn, "anchor") || safeGetAttribute(childColumn, "positionAnchor"), // positionAnchor is kept for backwards compatibility
		exportSettings: parseExportSettings(childColumn)
	};
}

/**
 * Parses the custom columns from the XML node.
 * @param childColumn
 * @param aggregationObject
 * @returns THe column properties for the given node
 */
function setCustomColumnProperties(
	childColumn: Element,
	aggregationObject: BlockColumn | BlockColumnOverride
): BlockColumn | BlockColumnOverride {
	aggregationObject.key = aggregationObject.key!.replace("InlineXML_", "");
	childColumn.setAttribute("key", aggregationObject.key);
	if (childColumn.localName === "Column") {
		return {
			...getCommonCustomColumnsProperties(childColumn, aggregationObject),
			header: safeGetAttribute(childColumn, "header"),
			tooltip: safeGetAttribute(childColumn, "tooltip"),
			template: getColumnTemplate(childColumn),
			properties: safeGetAttribute(childColumn, "properties")?.split(","),
			required: childColumn.getAttribute("required") ? childColumn.getAttribute("required") === "true" : undefined,
			_type: childColumn.localName
		};
	}
	return {
		...getCommonCustomColumnsProperties(childColumn, aggregationObject),
		_type: "ColumnOverride"
	};
}

const parseExportSettings = (element: Element): Record<string, string | string[] | boolean> | undefined => {
	const exportSettings = parseSimpleAggregation(element, "exportSettings");
	if (!exportSettings) {
		return undefined;
	}
	return {
		template: exportSettings.template,
		wrap: exportSettings.wrap === "true",
		type: exportSettings.type,
		property: exportSettings.property?.split(","),
		width: exportSettings.width
	};
};

const getColumnTemplate = (element: Element): string | undefined => {
	let aggregation = getAggregation(element, "template");
	if (!aggregation) {
		for (let i = 0; i < element.children.length; i++) {
			const child = element.children.item(i);
			if (child && !child.nodeName.endsWith("exportSettings")) {
				aggregation = child;
				break;
			}
		}
	}
	return aggregation?.outerHTML;
};

const parseSimpleAggregation = (element: Element, aggregationName: string): Record<string, string> | undefined => {
	const aggregation = getAggregation(element, aggregationName);
	const child = aggregation?.children[0];
	const result: Record<string, string> = {};
	if (!child) {
		return undefined;
	}
	for (const name of child.getAttributeNames()) {
		const value = child.getAttribute(name);
		if (value) {
			result[name] = value;
		}
	}
	return result;
};

const getAggregation = (element: Element, aggregationName: string): Element | undefined => {
	let aggregation: Element | undefined;
	for (let i = 0; i < element.children.length; i++) {
		const child = element.children.item(i);
		if (child?.nodeName.endsWith(aggregationName) === true) {
			aggregation = child;
			break;
		}
	}
	return aggregation;
};

/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem, PresentationVariant, or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 * <br>
 * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
 * <br>
 * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
 *
 * Usage example:
 * <pre>
 * &lt;macros:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
 * </pre>
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/table Overview of Table Building Blocks}
 * @mixes sap.fe.macros.table.TableAPI
 * @augments sap.fe.macros.MacroAPI
 * @public
 */
@defineBuildingBlock({
	name: "Table",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.fe.macros.table.TableAPI"]
})
export default class TableBlock extends BuildingBlockTemplatingBase {
	//  *************** Public & Required Attributes ********************
	/**
	 * Defines the relative path to a LineItem, PresentationVariant or SelectionPresentationVariant in the metamodel, based on the current contextPath.
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		underlyingType: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.LineItem",
			"com.sap.vocabularies.UI.v1.PresentationVariant",
			"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"
		],
		isPublic: true,
		required: true
	})
	metaPath!: Context;

	//  *************** Public Attributes ********************
	/**
	 * An expression that allows you to control the 'busy' state of the table.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true, bindable: true })
	busy?: boolean;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		underlyingType: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		isPublic: true
	})
	contextPath?: Context;

	/**
	 * Determines whether the table adapts to the condensed layout.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	public readonly condensedTableLayout?: boolean;

	/**
	 * Controls whether the table can be opened in fullscreen mode or not.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	public readonly enableFullScreen?: boolean;

	/**
	 * Determine whether the data copied to the computed columns is sent to the back end.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	private readonly enablePastingOfComputedProperties?: boolean;

	/**
	 * Determines whether the Clear All button is enabled by default.
	 * To enable the Clear All button by default, you must set this property to false.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	private readonly enableSelectAll?: boolean;

	/**
	 * Controls if the export functionality of the table is enabled or not.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	public readonly enableExport?: boolean;

	/**
	 * Maximum allowed number of records to be exported in one request.
	 * @public
	 */
	@blockAttribute({ type: "int", isPublic: true })
	private readonly exportRequestSize?: number;

	/**
	 * Defines the maximum number of rows that can be selected at once in the table.
	 * This property does not apply to responsive tables.
	 * @public
	 */
	@blockAttribute({ type: "number", isPublic: true })
	private readonly selectionLimit?: number;

	/**
	 * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
	 *
	 * This property is not relevant for responsive tables
	 * @public
	 */
	@blockAttribute({ type: "int", isPublic: true })
	private readonly frozenColumnCount?: number;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	private readonly widthIncludingColumnHeader?: boolean;

	/**
	 * Defines how the table handles the visible rows. Does not apply to Responsive tables.
	 *
	 * Allowed values are `Auto`, `Fixed`, and `Interactive`.<br/>
	 * - If set to `Fixed`, the table always has as many rows as defined in the rowCount property.<br/>
	 * - If set to `Auto`, the number of rows is changed by the table automatically. It will then adjust its row count to the space it is allowed to cover (limited by the surrounding container) but it cannot have less than defined in the `rowCount` property.<br/>
	 * - If set to `Interactive` the table can have as many rows as defined in the rowCount property. This number of rows can be modified by dragging the resizer available in this mode.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", allowedValues: ["Auto", "Fixed", "Interactive"], isPublic: true })
	private readonly rowCountMode?: string;

	/**
	 * Number of rows to be displayed in the table. Does not apply to responsive tables.
	 * @public
	 */
	@blockAttribute({ type: "int", isPublic: true })
	private readonly rowCount?: number;

	/**
	 * Controls if the paste functionality of the table is enabled or not.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	private readonly enablePaste?: boolean | CompiledBindingToolkitExpression;

	/**
	 * Controls if the copy functionality of the table is disabled or not.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	disableCopyToClipboard?: boolean;

	/**
	 * Defines how many additional data records are requested from the back-end system when the user scrolls vertically in the table.
	 * @public
	 */
	@blockAttribute({ type: "int", isPublic: true })
	scrollThreshold?: number;

	/**
	 * ID of the FilterBar building block associated with the table.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true, isAssociation: true })
	filterBar?: string;

	/**
	 * Specifies the header text that is shown in the table.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	header?: string;

	/**
	 * Defines the "aria-level" of the table header
	 */
	@blockAttribute({ type: "sap.ui.core.TitleLevel", isPublic: true })
	headerLevel?: TitleLevel;

	/**
	 * Controls if the header text should be shown or not.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	headerVisible?: boolean;

	@blockAttribute({ type: "string", isPublic: true })
	id!: string;

	@blockAttribute({ type: "string", isPublic: true })
	contentId?: string;

	/**
	 * Additionnal SelectionVariant to be applied on the table content.
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		underlyingType: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionVariant"],
		isPublic: true
	})
	associatedSelectionVariantPath?: Context;

	/**
	 * Defines whether to display the search action.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	isSearchable?: boolean;

	/**
	 * Controls which options should be enabled for the table personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 * <br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 * - Sort<br/>
	 * - Column<br/>
	 * - Filter<br/>
	 * - Group<br/>
	 * <br/>
	 * The Group option is only applicable to analytical tables and responsive tables.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	personalization?: string;

	/**
	 * An expression that allows you to control the 'read-only' state of the table.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	readOnly?: boolean;

	/**
	 * Defines the type of table that will be used by the building block to render the data.
	 *
	 * Allowed values are `GridTable`, `ResponsiveTable` and `AnalyticalTable`.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true, allowedValues: ["GridTable", "ResponsiveTable", "AnalyticalTable"] })
	readonly type?: TableType;

	/**
	 * Specifies whether the table is displayed with condensed layout (true/false). The default setting is `false`.
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	useCondensedLayout?: boolean;

	/**
	 * Defines the selection mode to be used by the table.
	 *
	 * Allowed values are `None`, `Single`, `ForceSingle`, `Multi`, `ForceMulti` or `Auto`.
	 * If set to 'Single', 'Multi' or 'Auto', SAP Fiori elements hooks into the standard lifecycle to determine the consistent selection mode.
	 * If set to 'ForceSingle' or 'ForceMulti' your choice will be respected but this might not respect the Fiori guidelines.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true, allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"] })
	private readonly selectionMode?: string;

	/**
	 * Controls the kind of variant management that should be enabled for the table.
	 *
	 * Allowed value is `Control`.<br/>
	 * If set with value `Control`, a variant management control is seen within the table and the table is linked to this.<br/>
	 * If not set with any value, control level variant management is not available for this table.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true, allowedValues: ["Control"] })
	variantManagement?: string;

	/**
	 * Comma-separated value of fields that must be ignored in the OData metadata by the Table building block.<br>
	 * The table building block is not going to create built-in columns or offer table personalization for comma-separated value of fields that are provided in the ignoredfields.<br>
	 * Any column referencing an ignored field is to be removed.<br>
	 * @since 1.124.0
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	ignoredFields?: string;

	//  *************** Private Attributes ********************
	private _apiId?: string;

	/**
	 * Changes the size of the IllustratedMessage in the table, or removes it completely.
	 * Allowed values are `illustratedMessage-Auto`, `illustratedMessage-Base`, `illustratedMessage-Dialog`, `illustratedMessage-Dot`, `illustratedMessage-Scene`, `illustratedMessage-Spot` or `text`.
	 * @since 1.129.0
	 * @public
	 */
	@blockAttribute({
		type: "string",
		isPublic: true,
		allowedValues: [
			"illustratedMessage-Auto",
			"illustratedMessage-Base",
			"illustratedMessage-Medium",
			"illustratedMessage-Dot",
			"illustratedMessage-ExtraSmall",
			"illustratedMessage-Scene",
			"illustratedMessage-Large",
			"illustratedMessage-Spot",
			"illustratedMessage-Small",
			"text"
		]
	})
	modeForNoDataMessage?: string;

	//  *************** Private Attributes ********************
	private readonly collectionEntity: EntitySet | NavigationProperty;

	/**
	 * Defines the header style of the table header
	 */
	@blockAttribute({ type: "sap.ui.core.TitleLevel" })
	headerStyle?: TitleLevel;

	/**
	 * Specifies if the column width is automatically calculated.
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	enableAutoColumnWidth?: boolean = true;

	@blockAttribute({ type: "string" })
	fieldMode = "";

	@blockAttribute({ type: "boolean" })
	isAlp?: boolean = false;

	/**
	 * ONLY FOR RESPONSIVE TABLE: Setting to define the checkbox in the column header: Allowed values are `Default` or `ClearAll`. If set to `Default`, the sap.m.Table control renders the Select All checkbox, otherwise the Deselect All button is rendered.
	 */
	multiSelectMode?: string;

	/**
	 * Used for binding the table to a navigation path. Only the path is used for binding rows.
	 */
	navigationPath?: string;

	/**
	 * True if the table is in a ListReport multi view
	 */
	@blockAttribute({ type: "boolean" })
	inMultiView?: boolean;

	useBasicSearch?: boolean;

	tableDefinition: TableVisualization; // We require tableDefinition to be there even though it is not formally required

	tableDefinitionContext?: Context;

	@blockAttribute({ type: "string" })
	tabTitle = "";

	@blockAttribute({ type: "boolean" })
	visible?: boolean;

	@blockAttribute({ type: "boolean" })
	displaySegmentedButton?: boolean;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@blockAttribute({
		type: "object",
		underlyingType: "sap.fe.macros.table.TableCreationOptions",
		isPublic: true,
		validate: function (creationOptionsInput: TableCreationOptions) {
			if (
				creationOptionsInput.name &&
				!["NewPage", "Inline", "InlineCreationRows", "External", "CreationDialog"].includes(creationOptionsInput.name)
			) {
				throw new Error(`Allowed value ${creationOptionsInput.name} for creationMode does not match`);
			}

			return creationOptionsInput;
		}
	})
	creationMode: PropertiesOf<TableCreationOptions> = {};

	/**
	 * A set of options that can be configured to control the aggregation behavior
	 * @private
	 */
	@blockAttribute({
		type: "object",
		underlyingType: "sap.fe.macros.table.AnalyticalConfiguration",
		isPublic: true,
		validate: function (analyticalConfiguration: Record<string, unknown>) {
			if (typeof analyticalConfiguration.aggregationOnLeafLevel === "string") {
				analyticalConfiguration.aggregationOnLeafLevel = analyticalConfiguration.aggregationOnLeafLevel === "true";
			}
			return analyticalConfiguration;
		}
	})
	analyticalConfiguration: PropertiesOf<AnalyticalConfiguration> = {};

	/**
	 * Aggregate actions of the table.
	 * @public
	 */
	@blockAggregation({
		type: "sap.fe.macros.table.Action",
		altTypes: ["sap.fe.macros.table.ActionGroup", "sap.fe.macros.table.ActionOverride", "sap.fe.macros.table.ActionGroupOverride"],
		isPublic: true,
		hasVirtualNode: true,
		multiple: true,
		processAggregations: setCustomActionGroupProperties
	})
	actions?: Record<string, BlockAction | BlockActionGroup | BlockActionOverride | BlockActionGroupOverride>;

	/**
	 * Aggregate mass edit of the table.
	 * @public
	 */
	@blockAggregation({
		type: "sap.fe.macros.table.MassEdit",
		isPublic: true,
		multiple: false,
		skipKey: true,
		processAggregations: setCustomMassEditProperties
	})
	massEdit?: Record<string, BlockMassEdit>;

	/**
	 * Aggregate columns of the table.
	 * @public
	 */
	@blockAggregation({
		type: "sap.fe.macros.table.Column",
		altTypes: ["sap.fe.macros.table.ColumnOverride"],
		isPublic: true,
		multiple: true,
		hasVirtualNode: true,
		isDefault: true,
		processAggregations: setCustomColumnProperties
	})
	columns?: Record<string, BlockColumn | BlockColumnOverride>;

	/**
	 * Aggregate quickVariantSelection of the table.
	 * @public
	 */
	@blockAggregation({
		type: "sap.fe.macros.table.QuickVariantSelection",
		isPublic: true,
		skipKey: true,
		multiple: false,
		processAggregations: setQuickVariantSelection
	})
	quickVariantSelection?: Record<string, BlockQuickVariantSelection>;

	convertedMetadata: ConvertedMetadata;

	contextObjectPath: DataModelObjectPath<LineItem | PresentationVariant | SelectionPresentationVariant>;

	/**
	 * Before a table rebind, an event is triggered that contains information about the binding.
	 *
	 * You can use this event to add selects, and add or read the sorters and filters.
	 * @public
	 */
	@blockEvent()
	private readonly beforeRebindTable?: string;

	/**
	 * An event is triggered when the user chooses a row; the event contains information about which row is chosen.
	 *
	 * You can set this in order to handle the navigation manually.
	 * @public
	 */
	@blockEvent()
	rowPress?: string;

	/**
	 * Event handler to react to the change event of the table's list binding.
	 *
	 * Internal only
	 */
	@blockEvent()
	listBindingChange?: string;

	/**
	 * Event handler called when the user chooses an option of the segmented button in the ALP View
	 */
	@blockEvent()
	segmentedButtonPress?: string;

	@blockEvent()
	variantSaved?: string;

	/**
	 * An event triggered when the selection in the table changes.
	 * @public
	 */
	@blockEvent()
	private readonly selectionChange?: string;

	@blockEvent()
	variantSelected?: string;

	@blockAttribute({ type: "boolean", isPublic: true })
	initialLoad?: boolean;

	private readonly appComponent: AppComponent;

	private readonly metaModel: ODataMetaModel;

	constructor(props: PropertiesOf<TableBlock>, controlConfiguration: unknown, templateProcessorSettings: TemplateProcessorSettings) {
		super(props, controlConfiguration, templateProcessorSettings);
		const contextObjectPath = getInvolvedDataModelObjects<LineItem | PresentationVariant | SelectionPresentationVariant>(
			this.metaPath,
			this.contextPath
		);
		this.contextObjectPath = contextObjectPath;

		this.tableDefinition = TableBlock.createTableDefinition(this, templateProcessorSettings);
		this.tableDefinitionContext = MacroAPI.createBindingContext(this.tableDefinition as object, templateProcessorSettings);

		this.convertedMetadata = this.contextObjectPath.convertedTypes;
		this.metaModel = templateProcessorSettings.models.metaModel;
		this.collectionEntity = this.convertedMetadata.resolvePath(this.tableDefinition.annotation.collection).target as EntitySet;
		this.appComponent = templateProcessorSettings.appComponent;
		this.setUpId();

		this.creationMode ??= {};
		this.creationMode.name ??= this.tableDefinition.annotation.create.mode as TableCreationOptions["name"];
		this.creationMode.createAtEnd ??= (this.tableDefinition.annotation.create as CreateBehavior).append;
		// Special code for readOnly
		// readonly = false -> Force editable
		// readonly = true -> Force display mode
		// readonly = undefined -> Bound to edit flow
		if (
			this.readOnly === undefined &&
			(this.tableDefinition.annotation.displayMode === true || this.tableDefinition.control.readOnly === true)
		) {
			this.readOnly = true;
		}

		TableAPI.updateColumnsVisibility(this.tableDefinition.control.ignoredFields, [], this.tableDefinition);

		let useBasicSearch = false;

		// Note for the 'filterBar' property:
		// 1. ID relative to the view of the Table.
		// 2. Absolute ID.
		// 3. ID would be considered in association to TableAPI's ID.
		if (!this.filterBar) {
			// filterBar: Public property for building blocks
			// filterBarId: Only used as Internal private property for FE templates
			this.filterBar = generate([this.contentId, "StandardAction", "BasicSearch"]);
			useBasicSearch = true;
		}
		// Internal properties
		this.useBasicSearch = useBasicSearch;
	}

	/**
	 * Returns the annotation path pointing to the visualization annotation (LineItem).
	 * @param contextObjectPath The datamodel object path for the table
	 * @param converterContext The converter context
	 * @returns The annotation path
	 */
	static getVisualizationPath(
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
			isAnnotationOfTerm<SelectionPresentationVariant>(
				contextObjectPath.targetObject,
				UIAnnotationTerms.SelectionPresentationVariant
			) ||
			isAnnotationOfTerm<PresentationVariant>(contextObjectPath.targetObject, UIAnnotationTerms.PresentationVariant)
		) {
			visualizations = getVisualizationsFromAnnotation(
				contextObjectPath.targetObject,
				metaPath,
				resolvedTarget.converterContext,
				true
			);
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

	static addSetting = (target: Record<string, unknown>, key: string, value: unknown): void => {
		if (value !== undefined) {
			target[key] = value;
		}
	};

	getTableSettings(): Record<string, unknown> {
		const tableSettings: Record<string, unknown> = {};
		TableBlock.addSetting(tableSettings, "enableExport", this.enableExport);
		TableBlock.addSetting(tableSettings, "readOnly", this.readOnly);
		TableBlock.addSetting(tableSettings, "ignoredFields", this.ignoredFields);
		TableBlock.addSetting(tableSettings, "selectionLimit", this.selectionLimit);
		TableBlock.addSetting(tableSettings, "condensedTableLayout", this.condensedTableLayout);

		TableBlock.addSetting(tableSettings, "exportRequestSize", this.exportRequestSize);
		TableBlock.addSetting(tableSettings, "frozenColumnCount", this.frozenColumnCount);
		TableBlock.addSetting(tableSettings, "widthIncludingColumnHeader", this.widthIncludingColumnHeader);
		TableBlock.addSetting(tableSettings, "rowCountMode", this.rowCountMode);
		TableBlock.addSetting(tableSettings, "rowCount", this.rowCount);
		TableBlock.addSetting(tableSettings, "enableFullScreen", this.enableFullScreen);
		TableBlock.addSetting(tableSettings, "selectAll", this.enableSelectAll);
		TableBlock.addSetting(tableSettings, "enablePastingOfComputedProperties", this.enablePastingOfComputedProperties);
		TableBlock.addSetting(tableSettings, "enablePaste", this.enablePaste);
		TableBlock.addSetting(tableSettings, "disableCopyToClipboard", this.disableCopyToClipboard);
		TableBlock.addSetting(tableSettings, "scrollThreshold", this.scrollThreshold);
		TableBlock.addSetting(tableSettings, "selectionMode", this.selectionMode);
		TableBlock.addSetting(tableSettings, "type", this.type);
		if (this.quickVariantSelection?.quickFilters?.paths?.length) {
			TableBlock.addSetting(tableSettings, "quickVariantSelection", {
				paths: this.quickVariantSelection.quickFilters.paths.map((path) => {
					return { annotationPath: path };
				}),
				showCounts: this.quickVariantSelection.quickFilters.showCounts
			});
		}

		if (this.creationMode) {
			const creationMode: Record<string, unknown> = {};
			TableBlock.addSetting(creationMode, "name", this.creationMode.name);
			TableBlock.addSetting(creationMode, "creationFields", this.creationMode.creationFields);
			TableBlock.addSetting(creationMode, "createAtEnd", this.creationMode.createAtEnd);
			TableBlock.addSetting(creationMode, "inlineCreationRowsHiddenInEditMode", this.creationMode.inlineCreationRowsHiddenInEditMode);
			TableBlock.addSetting(creationMode, "outbound", this.creationMode.outbound);
			if (Object.entries(creationMode).length > 0) {
				tableSettings["creationMode"] = creationMode;
			}
		}

		if (this.massEdit) {
			const enableMassEdit: Record<string, unknown> = {};
			TableBlock.addSetting(enableMassEdit, "customFragment", this.massEdit.configuration?.customContent);
			TableBlock.addSetting(enableMassEdit, "fromInline", true);
			TableBlock.addSetting(enableMassEdit, "visibleFields", this.massEdit.configuration?.visibleFields?.join(","));
			TableBlock.addSetting(enableMassEdit, "ignoredFields", this.massEdit.configuration?.ignoredFields?.join(","));
			TableBlock.addSetting(enableMassEdit, "operationGroupingMode", this.massEdit.configuration?.operationGroupingMode);
			tableSettings["enableMassEdit"] = enableMassEdit;
		}

		if (this.analyticalConfiguration?.aggregationOnLeafLevel === true) {
			const analyticalConfiguration: Record<string, unknown> = {};
			TableBlock.addSetting(analyticalConfiguration, "aggregationOnLeafLevel", this.analyticalConfiguration.aggregationOnLeafLevel);
			if (Object.entries(analyticalConfiguration).length > 0) {
				tableSettings["analyticalConfiguration"] = analyticalConfiguration;
			}
		}
		return tableSettings;
	}

	static createTableDefinition(table: TableBlock, templateProcessorSettings: TemplateProcessorSettings): TableVisualization {
		const initialConverterContext = table.getConverterContext(
			table.contextObjectPath,
			table.contextPath?.getPath(),
			templateProcessorSettings
		);
		const visualizationPath = TableBlock.getVisualizationPath(table.contextObjectPath, initialConverterContext);

		const tableSettings = table.getTableSettings();
		const extraManifestSettings: TableManifestConfiguration = {
			actions: TableBlock.createActionsFromManifest(table),
			columns: TableBlock.createColumnsForManifest(table),
			tableSettings
		};

		const extraParams: Record<string, unknown> = {};
		extraParams[visualizationPath] = extraManifestSettings;
		const converterContext = table.getConverterContext(
			table.contextObjectPath,
			table.contextPath?.getPath(),
			templateProcessorSettings,
			extraParams
		);

		let associatedSelectionVariant: SelectionVariantType | undefined;
		if (table.associatedSelectionVariantPath) {
			const svObjectPath = getInvolvedDataModelObjects<SelectionVariant>(
				table.associatedSelectionVariantPath,
				table.contextPath as Context
			);
			associatedSelectionVariant = svObjectPath.targetObject;
		}

		const visualizationDefinition = getDataVisualizationConfiguration(
			(table.inMultiView && table.contextObjectPath.targetObject
				? converterContext.getRelativeAnnotationPath(
						table.contextObjectPath.targetObject.fullyQualifiedName,
						converterContext.getEntityType()
				  )
				: getContextRelativeTargetObjectPath(table.contextObjectPath)) as string,
			converterContext,
			{
				isCondensedTableLayoutCompliant: table.useCondensedLayout,
				associatedSelectionVariant,
				isMacroOrMultipleView: table.inMultiView ?? true
			}
		);

		// take the (first) Table visualization
		return visualizationDefinition.visualizations.find(
			(viz: TableVisualization | ChartVisualization) => viz.type === VisualizationType.Table
		) as TableVisualization;
	}

	/**
	 * Creates the manifest actions for the table.
	 * @param table The table block
	 * @returns The manifest actions for the table
	 */
	static createActionsFromManifest(table: TableBlock): Record<string, ManifestAction> {
		const actionsSettings: Record<string, ManifestAction> = {};
		const addActionToExtraManifest = (action: BlockAction | BlockActionOverride): void => {
			const key = action.key!;
			actionsSettings[key] = {
				position: {
					placement: (action.placement ?? "After") as Placement,
					anchor: action.anchor
				},
				command: action.command,
				enableOnSelect: action.enableOnSelect,
				visible: action.visible,
				enabled: action.enabled
			};
			if (action._type === "Action") {
				actionsSettings[key] = {
					...actionsSettings[key],
					text: action.text,
					__noWrap: true,
					press: action.press,
					requiresSelection: action.requiresSelection
				};
				return;
			}
			const afterExecution = {
				enableAutoScroll: action["enableAutoScroll"],
				navigateToInstance: action["navigateToInstance"]
			};
			removeUndefinedProperties(afterExecution);
			actionsSettings[key] = {
				...actionsSettings[key],
				afterExecution: Object.entries(afterExecution).length ? afterExecution : undefined,
				defaultValuesFunction: action.defaultValuesFunction
			};
		};
		if (table.actions) {
			Object.values(table.actions).forEach((item) => {
				if (item._type === "Action" || item._type === "ActionOverride") {
					addActionToExtraManifest(item);
				} else if (item._type === "ActionGroup" || item._type === "ActionGroupOverride") {
					// ActionGroup or ActionGroupOverride
					const key = item.key!;
					actionsSettings[key] = {
						position: {
							placement: (item.placement ?? "After") as Placement,
							anchor: item.anchor
						},
						menu: item.actions.map((action) => action.key!)
					};
					if (item._type === "ActionGroup") {
						actionsSettings[key] = {
							...actionsSettings[key],
							text: item.text,
							defaultAction: item.defaultAction,
							__noWrap: true
						};
					}
					item.actions.forEach((action) => {
						addActionToExtraManifest(action);
					});
				}
			});
		}
		return actionsSettings;
	}

	/**
	 * Creates the manifest columns for the table.
	 * @param table The table block
	 * @returns The manifest actions for the table
	 */
	static createColumnsForManifest(table: TableBlock): Record<string, CustomDefinedTableColumn | CustomDefinedTableColumnForOverride> {
		const isBlockColumn = (block: BlockColumn | BlockColumnOverride): block is BlockColumn => {
			return block._type === "Column";
		};

		const columnSettings: Record<string, CustomDefinedTableColumn | CustomDefinedTableColumnForOverride> = {};

		if (table.columns) {
			Object.values(table.columns).forEach((column) => {
				let customColumnDefinition: CustomDefinedTableColumn | (CustomDefinedTableColumnForOverride & { key: string });
				if (isBlockColumn(column)) {
					customColumnDefinition = {
						header: column.header!,
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
						key: column.key!,
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
				if (isBlockColumn(column) && (column.anchor || column.placement)) {
					customColumnDefinition.position = {
						anchor: column.anchor,
						placement: (column.placement ?? "After") as Placement
					};
				}

				columnSettings[column.key!] = customColumnDefinition;
			});
		}
		return columnSettings;
	}

	setUpId(): void {
		if (this.id) {
			// The given ID shall be assigned to the TableAPI and not to the MDC Table
			this._apiId = this.id;
			// Generate the contentId based on the ID, if not provided (FPM case)
			this.contentId ??= this.getContentId(this.id);
		} else {
			// We generate the ID and the contentID. Due to compatibility reasons we keep it on the MDC Table but provide assign
			// the ID with a ::Table suffix to the TableAPI
			this.id = this.tableDefinition.annotation.apiId;
			this.contentId = this.tableDefinition.annotation.id;
			this._apiId = this.tableDefinition.annotation.apiId;
		}
	}

	_getEntityType(): EntityType {
		return (this.collectionEntity as EntitySet)?.entityType || (this.collectionEntity as NavigationProperty)?.targetType;
	}

	getEmptyRowsEnabled(): string | undefined {
		const enabled =
			this.creationMode.name === CreationMode.InlineCreationRows
				? this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.enabled
				: undefined;
		return enabled === "false" ? undefined : enabled;
	}

	getTemplate(): string {
		const entityType = this._getEntityType();
		const tableProps = this as unknown as TableBlockProperties;
		tableProps.overrideRowPress = this.rowPress !== undefined;

		const collectionEntity = this.convertedMetadata.resolvePath(tableProps.tableDefinition.annotation.collection).target as
			| EntitySet
			| NavigationProperty;
		const handlerProvider = new TableEventHandlerProvider(tableProps, { collectionEntity, metaModel: this.metaPath.getModel() });

		let creationMode: TableCreationOptions | undefined;
		if (this.creationMode && Object.keys(this.creationMode).length > 0) {
			creationMode = <TableCreationOptions {...this.creationMode} />;
		}

		return (
			<TableAPI
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
				binding={`{internal>controls/${this.contentId}}`}
				id={this._apiId}
				contentId={this.contentId}
				visible={this.visible}
				headerLevel={this.headerLevel}
				headerStyle={this.headerStyle}
				headerVisible={this.headerVisible}
				tabTitle={this.tabTitle}
				exportRequestSize={this.exportRequestSize}
				disableCopyToClipboard={this.disableCopyToClipboard}
				scrollThreshold={this.scrollThreshold}
				isSearchable={this.isSearchable}
				busy={this.busy}
				initialLoad={this.initialLoad}
				header={this.header}
				isAlp={this.isAlp}
				fieldMode={this.fieldMode}
				personalization={this.personalization}
				rowPress={this.rowPress as unknown as Function}
				variantSaved={this.variantSaved as unknown as Function}
				variantSelected={this.variantSelected as unknown as Function}
				segmentedButtonPress={this.segmentedButtonPress as unknown as Function}
				variantManagement={this.variantManagement}
				ignoredFields={this.tableDefinition.control.ignoredFields} // Need to be from the tableDefinition to be in phase for the getIgnoreFields
				tableDefinition={`{_pageModel>${this.tableDefinitionContext!.getPath()}}` as unknown as TableVisualization}
				entityTypeFullyQualifiedName={entityType?.fullyQualifiedName}
				metaPath={this.metaPath?.getPath()}
				useBasicSearch={this.useBasicSearch}
				enableFullScreen={this.enableFullScreen}
				enableExport={this.enableExport}
				frozenColumnCount={this.frozenColumnCount}
				enablePaste={this.enablePaste}
				rowCountMode={this.rowCountMode}
				rowCount={this.rowCount}
				contextPath={this.contextPath?.getPath()}
				selectionChange={this.selectionChange as unknown as Function}
				listBindingChange={this.listBindingChange as unknown as Function}
				readOnly={this.readOnly}
				selectionMode={this.selectionMode}
				useCondensedLayout={this.useCondensedLayout}
				type={this.type}
				filterBar={this.filterBar}
				emptyRowsEnabled={this.getEmptyRowsEnabled() as unknown as boolean}
				enableAutoColumnWidth={this.enableAutoColumnWidth}
				beforeRebindTable={this.beforeRebindTable as unknown as Function}
				widthIncludingColumnHeader={this.widthIncludingColumnHeader}
				modeForNoDataMessage={this.modeForNoDataMessage}
				associatedSelectionVariantPath={this.associatedSelectionVariantPath?.getPath()}
				displaySegmentedButton={this.displaySegmentedButton}
				enablePastingOfComputedProperties={this.enablePastingOfComputedProperties}
				enableSelectAll={this.enableSelectAll}
				inMultiView={this.inMultiView}
				selectionLimit={this.selectionLimit}
				condensedTableLayout={this.condensedTableLayout}
			>
				{{
					customData: createCustomData("tableAPILocalId", this._apiId),
					creationMode,
					layoutData: <FlexItemData maxWidth="100%" />,
					content: getMDCTableTemplate(tableProps, {
						metaPath: this.metaPath,
						convertedMetadata: this.convertedMetadata,
						metaModel: this.metaModel,
						handlerProvider,
						appComponent: this.appComponent
					})
				}}
			</TableAPI>
		);
	}
}

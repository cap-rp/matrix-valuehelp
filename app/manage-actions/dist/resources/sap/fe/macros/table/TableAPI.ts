import type { EntitySet, EntityType, NavigationProperty, Property } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldTypes,
	DataPointTypeTypes,
	LineItem,
	PresentationVariant,
	SelectionPresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import { compileExpression, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf, XMLEventHolder } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, event, implementInterface, mixin, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import CommonUtils from "sap/fe/core/CommonUtils";
import type IRowBindingInterface from "sap/fe/core/IRowBindingInterface";
import type PageController from "sap/fe/core/PageController";
import type BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { parseXMLString, xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import NotApplicableContextDialog from "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import Any from "sap/fe/core/controls/Any";
import { CreationMode } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import {
	getCustomFunctionInfo,
	type ExternalMethodConfig,
	type TableType,
	type TableVisualization
} from "sap/fe/core/converters/controls/Common/Table";
import { StandardActionKeys } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import DeleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import PasteHelper from "sap/fe/core/helpers/PasteHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { RecommendationContextsInfo } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type { RoutingNavigationParameters } from "sap/fe/core/services/RoutingServiceFactory";
import {
	getContextRelativeTargetObjectPath,
	getTargetObjectPath,
	type DataModelObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { type DisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type { CollectionBindingInfo } from "sap/fe/macros/CollectionBindingInfo";
import MacroAPI from "sap/fe/macros/MacroAPI";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type { ConsumerData } from "sap/fe/macros/controls/section/ISingleSectionContributor";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type FilterBarBBV4 from "sap/fe/macros/filterBar/FilterBar";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type { ControlState } from "sap/fe/macros/insights/CommonInsightsHelper";
import type Action from "sap/fe/macros/table/Action";
import type ActionGroup from "sap/fe/macros/table/ActionGroup";
import type BasicSearch from "sap/fe/macros/table/BasicSearch";
import type Column from "sap/fe/macros/table/Column";
import * as MdcTableTemplate from "sap/fe/macros/table/MdcTableTemplate";
import type QuickFilterSelector from "sap/fe/macros/table/QuickFilterSelector";
import TableCreationOptions from "sap/fe/macros/table/TableCreationOptions";
import TableHelper from "sap/fe/macros/table/TableHelper";
import TableRuntime from "sap/fe/macros/table/TableRuntime";
import TableUtils from "sap/fe/macros/table/Utils";
import { convertPVToState } from "sap/fe/macros/table/adapter/TablePVToState";
import MassEditDialogHelper from "sap/fe/macros/table/massEdit/MassEditDialogHelper";
import type { PvProperties } from "sap/fe/navigation/PresentationVariant";
import PresentationVariantClass from "sap/fe/navigation/PresentationVariant";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type Dialog from "sap/m/Dialog";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import type Menu from "sap/m/Menu";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Text from "sap/m/Text";
import type { DataStateIndicator$DataStateChangeEvent } from "sap/m/plugins/DataStateIndicator";
import type { PasteProvider$PasteEvent } from "sap/m/plugins/PasteProvider";
import type { default as Event, default as UI5Event } from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import ManagedObjectMetadata from "sap/ui/base/ManagedObjectMetadata";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import type DragDropInfo from "sap/ui/core/dnd/DragDropInfo";
import { TitleLevel } from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import type MessageType from "sap/ui/core/message/MessageType";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type {
	default as MDCTable,
	MDCTablePropertyInfo as PropertyInfo,
	default as Table,
	Table$BeforeExportEvent,
	Table$BeforeOpenContextMenuEvent,
	Table$SelectionChangeEvent
} from "sap/ui/mdc/Table";
import type TypeConfig from "sap/ui/mdc/TypeConfig";
import type { GroupLevels, Items, Sorters } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import { type RowActionItem$PressEvent } from "sap/ui/mdc/table/RowActionItem";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import StateHelper from "../mdc/adapter/StateHelper";
import type ActionGroupOverride from "./ActionGroupOverride";
import type ActionOverride from "./ActionOverride";
import type AnalyticalConfiguration from "./AnalyticalConfiguration";
import type ColumnOverride from "./ColumnOverride";
import type MassEdit from "./MassEdit";
import type QuickVariantSelection from "./QuickVariantSelection";
import { createTableDefinition } from "./TableDefinition";
import TableEventHandlerProvider from "./TableEventHandlerProvider";
import ColumnManagement from "./mixin/ColumnManagement";
import ContextMenuHandler from "./mixin/ContextMenuHandler";
import EmptyRowsHandler from "./mixin/EmptyRowsHandler";
import TableAPIStateHandler from "./mixin/TableAPIStateHandler";
import TableExport from "./mixin/TableExport";
import TableHierarchy from "./mixin/TableHierarchy";
import TableOptimisticBatch from "./mixin/TableOptimisticBatch";
import TableSharing from "./mixin/TableSharing";

export type EnhancedFEPropertyInfo = PropertyInfo & {
	name: string;
	annotationPath: string;
	relativePath: string;
	descriptionProperty?: string;
	mode?: DisplayMode;
	valueProperty?: string;
	typeConfig?: TypeConfig;
	exportDataPointTargetValue?: string;
	additionalLabels?: string[];
	type?: string;
	textArrangement?: {
		textProperty: string;
		mode: DisplayMode;
	};
};

type DataModelConversion = {
	dataModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>;
	convertedtargetObject: DataFieldAbstractTypes | DataPointTypeTypes;
};

export type TableColumnProperties = {
	key: string;
	visibility: boolean;
}[];

export type DynamicVisibilityForColumn = { columnKey: string; visible: boolean };

export type TableState = {
	innerTable?: {
		initialState?: {
			items?: { name: string }[];
			supplementaryConfig?: object;
		};
		fullState?: {
			items?: { name: string }[];
			filter?: object;
		};
	};
	quickFilter?: {
		selectedKey?: string;
	};
	variantManagement?: {
		variantId?: string | null;
	};
	supplementaryConfig?: object;
};

export interface ITableBlock extends BuildingBlock {
	enableOptimisticBatchMode(): void;
	metaPath: string;
	contextPath?: string;
	emptyRowsEnabled: boolean;
	getContent(): Table;
	getTableDefinition(): TableVisualization;
	getSelectedContexts(): Context[];
	isTableRowNavigationPossible(context: Context): boolean;
	createAnyControl(ModeAsExpression: CompiledBindingToolkitExpression, rowContext: Context | undefined): typeof Any;
	getDataModelAndConvertedTargetObject(propertyName: string | undefined): DataModelConversion | undefined;
}

interface TableAPI
	extends TableAPIStateHandler,
		TableExport,
		TableOptimisticBatch,
		TableHierarchy,
		EmptyRowsHandler,
		ContextMenuHandler,
		TableSharing,
		ColumnManagement {
	// aggregation
	getContent(): MDCTable;
	// association
	getFilterBar(): string;
	// property
	getDataInitialized(): boolean;
}

/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 * <br>
 * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
 * <br>
 * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
 *
 * Usage example:
 * <pre>
 * &lt;macros:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
 * </pre>
 * @private
 */

@defineUI5Class("sap.fe.macros.table.TableAPI", { returnTypes: ["sap.fe.macros.MacroAPI"] })
@mixin(TableAPIStateHandler)
@mixin(TableExport)
@mixin(TableOptimisticBatch)
@mixin(TableHierarchy)
@mixin(EmptyRowsHandler)
@mixin(ContextMenuHandler)
@mixin(TableSharing)
@mixin(ColumnManagement)
class TableAPI extends MacroAPI implements ISingleSectionContributor, IRowBindingInterface, ITableBlock {
	content!: Table;

	massEditDialogHelper: MassEditDialogHelper | undefined;

	originalTableDefinition!: TableVisualization;

	propertyEditModeCache: Record<string, typeof Any> = {};

	initialControlState: Record<string, unknown> = {};

	constructor(mSettings?: PropertiesOf<TableAPI> & { id?: string }, ...others: $ControlSettings[]) {
		super(mSettings, ...others);
		this.originalTableDefinition = this.tableDefinition;

		this.attachStateChangeHandler();
		this.attachManifestEvents();
		this.overrideRowPress = this.hasListeners("rowPress");
	}

	@implementInterface("sap.fe.core.IRowBindingInterface")
	__implements__sap_fe_core_IRowBindingInterface = true;

	getRowBinding(): ODataListBinding {
		const mdcTable = this.content;
		const dataModel = mdcTable.getModel();
		return mdcTable.getRowBinding() ?? (dataModel?.bindList(this.getRowCollectionPath()) as ODataListBinding);
	}

	private attachStateChangeHandler(): void {
		StateUtil.detachStateChange(this.stateChangeHandler);
		StateUtil.attachStateChange(this.stateChangeHandler);
	}

	stateChangeHandler(oEvent: Event<{ control: Control }>): void {
		const control = oEvent.getParameter("control");
		if (control.isA<Table>("sap.ui.mdc.Table")) {
			const tableAPI = control.getParent() as unknown as { handleStateChange?: Function };
			if (tableAPI?.handleStateChange) {
				tableAPI.handleStateChange();
			}
		}
	}

	/**
	 * Attach the event handlers coming from the manifest for 'rowPress', 'selectionChange' and 'beforeRebindTable'.
	 * We ignore the manifest handlers if the table already has event handlers (override).
	 */
	private attachManifestEvents(): void {
		const attachIfNoListeners = (eventName: string, methodConfig: ExternalMethodConfig | undefined): void => {
			if (!this.hasListeners(eventName) && methodConfig !== undefined) {
				this.attachEvent(eventName, (ui5Event: UI5Event) => {
					FPMHelper.loadModuleAndCallMethod(methodConfig.moduleName, methodConfig.methodName, ui5Event, ui5Event).catch(
						(error) => {
							Log.error(
								`Failed to call ${eventName} event handler ${methodConfig.moduleName} ${methodConfig.methodName}`,
								error
							);
						}
					);
				});
			}
		};

		attachIfNoListeners(
			"beforeRebindTable",
			getCustomFunctionInfo(this.tableDefinition?.control?.beforeRebindTable, this.tableDefinition?.control)
		);
		attachIfNoListeners("rowPress", getCustomFunctionInfo(this.tableDefinition?.control?.rowPress, this.tableDefinition?.control));
		attachIfNoListeners(
			"selectionChange",
			getCustomFunctionInfo(this.tableDefinition?.control?.selectionChange, this.tableDefinition?.control)
		);
	}

	/**
	 * Sets an illustrated message during the initialisation of the table API.
	 * Useful if we have a building block in a list report without initial load.
	 * @private
	 */
	private setUpNoDataInformation(): void {
		const table = this.content;
		if (!table || table.getNoData()) {
			return;
		}
		const owner = this._getOwner();
		let description;
		let title;
		if (owner) {
			const resourceModel = getResourceModel(owner);
			if (resourceModel) {
				let suffix;
				const metaPath = this.metaPath;
				if (metaPath) {
					suffix = metaPath.startsWith("/") ? metaPath.substring(1) : metaPath;
				}
				title = resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH");
				description = resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT", undefined, suffix);
			}
		} else {
			const resourceBundle = Library.getResourceBundleFor("sap.fe.templates")!;
			title = resourceBundle.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH");
			description = resourceBundle.getText("T_TABLE_AND_CHART_NO_DATA_TEXT");
		}

		if (this.getNoDataMessageMode() === "text") {
			this.setAggregation("noData", new Text({ text: description }));
		} else {
			const illustratedMessage = new IllustratedMessage({
				title: title,
				description: description,
				illustrationType: IllustratedMessageType.BeforeSearch,
				illustrationSize: this.getNoDataMessageMode(),
				enableDefaultTitleAndDescription: false
			});

			this.setAggregation("noData", illustratedMessage);
		}
	}

	@implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor")
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor = true;

	getSectionContentRole(): "provider" | "consumer" {
		return "consumer";
	}

	/**
	 * Implementation of the sendDataToConsumer method which is a part of the ISingleSectionContributor
	 *
	 * Will be called from the sap.fe.macros.controls.Section control when there is a Table building block rendered within a section
	 * along with the consumerData i.e. section's data such as title and title level which is then applied to the table using the implementation below accordingly.
	 *
	 */

	sendDataToConsumer(consumerData: ConsumerData): void {
		if (this.content?.isA<Table>("sap.ui.mdc.Table")) {
			this.content?.setHeader(consumerData.title);
			this.content?.setHeaderStyle(consumerData.headerStyle as TitleLevel);
			this.content?.setHeaderLevel(consumerData.titleLevel as TitleLevel);
		}
	}

	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.LineItem",
			"com.sap.vocabularies.UI.v1.PresentationVariant",
			"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"
		],
		required: true
	})
	metaPath!: string;

	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	contextPath!: string;

	@property({ type: "object" })
	tableDefinition!: TableVisualization;

	@property({ type: "string" })
	contentId!: string;

	@property({ type: "string" })
	entityTypeFullyQualifiedName!: string;

	@property({ type: "boolean" })
	enableFullScreen?: boolean;

	@property({ type: "boolean" })
	enableExport?: boolean;

	@property({ type: "int" })
	frozenColumnCount?: number;

	@property({ type: "string", allowedValues: ["Auto", "Fixed"] })
	rowCountMode?: string;

	@property({ type: "int" })
	rowCount?: number;

	@property({ type: "boolean" })
	enablePaste?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean" })
	disableCopyToClipboard?: boolean;

	@property({ type: "int" })
	scrollThreshold?: number;

	@property({ type: "boolean" })
	isSearchable?: boolean;

	@property({ type: "string", allowedValues: ["GridTable", "ResponsiveTable", "AnalyticalTable"] })
	type?: TableType;

	@property({ type: "boolean" })
	useCondensedLayout?: boolean;

	@property({ type: "string", allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"] })
	selectionMode?: string;

	@property({ type: "boolean" })
	condensedTableLayout?: boolean;

	@aggregation({
		type: "sap.fe.macros.table.Action",
		altTypes: ["sap.fe.macros.table.ActionGroup", "sap.fe.macros.table.ActionOverride", "sap.fe.macros.table.ActionGroupOverride"],
		multiple: true
	})
	actions?: (Action | ActionGroup | ActionOverride | ActionGroupOverride)[];

	@aggregation({
		type: "sap.fe.macros.table.Column",
		altTypes: ["sap.fe.macros.table.ColumnOverride"],
		multiple: true
	})
	columns?: (Column | ColumnOverride)[];

	/**
	 * An expression that allows you to control the 'read-only' state of the table.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 */
	@property({ type: "boolean" })
	readOnly!: boolean;

	/**
	 * ID of the FilterBar building block associated with the table.
	 */
	//@association({ type: "sap.fe.macros.filterBar.FilterBarAPI" })
	@property({ type: "string" })
	filterBar?: string;

	/**
	 * Specifies if the column width is automatically calculated.
	 */
	@property({ type: "boolean", defaultValue: true })
	enableAutoColumnWidth!: boolean;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 */
	@property({ type: "boolean", defaultValue: false })
	widthIncludingColumnHeader?: boolean;

	/**
	 * Changes the size of the IllustratedMessage in the table, or removes it completely.
	 * Allowed values are `illustratedMessage-Auto`, `illustratedMessage-Base`, `illustratedMessage-Dialog`, `illustratedMessage-Dot`, `illustratedMessage-Scene`, `illustratedMessage-Spot` or `text`.
	 */
	@property({
		type: "string",
		allowedValues: [
			"illustratedMessage-Auto",
			"illustratedMessage-Base",
			"illustratedMessage-Dialog",
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

	@property({ type: "boolean", defaultValue: false })
	dataInitialized!: boolean;

	@property({ type: "boolean", defaultValue: false })
	bindingSuspended!: boolean;

	@property({ type: "boolean", defaultValue: false })
	outDatedBinding!: boolean;

	@property({ type: "boolean", defaultValue: false })
	isAlp!: boolean;

	@property({ type: "string" })
	variantManagement?: string;

	@property({ type: "string" })
	ignoredFields?: string;

	@property({ type: "string" })
	id!: string;

	@property({ type: "string" })
	fieldMode?: string;

	@property({ type: "sap.ui.core.TitleLevel", defaultValue: TitleLevel.Auto })
	headerLevel!: TitleLevel;

	@property({ type: "sap.ui.core.TitleLevel" })
	headerStyle?: TitleLevel;

	@property({ type: "int" })
	exportRequestSize?: number;

	@property({ type: "boolean" })
	initialLoad?: boolean;

	/**
	 * Controls which options should be enabled for the table personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 *<br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 *  - Sort<br/>
	 *  - Column<br/>
	 *  - Filter<br/>
	 *  - Group<br/>
	 *<br/>
	 * The Group option is only applicable to analytical tables and responsive tables.<br/>
	 */
	@property({ type: "string" })
	personalization?: string;

	/**
	 * Specifies the header text that is shown in the table.
	 *
	 */
	@property({ type: "string" })
	header?: string;

	@property({ type: "boolean" })
	useBasicSearch?: boolean;

	/**
	 * Specifies if the empty rows are enabled. This allows to have dynamic enablement of the empty rows using the setter function.
	 */
	@property({ type: "boolean", defaultValue: false })
	emptyRowsEnabled!: boolean;

	/**
	 * Controls if the header text should be shown or not.
	 *
	 */
	@property({ type: "boolean", isBindingInfo: true })
	headerVisible?: boolean;

	@property({ type: "string" })
	tabTitle?: string;

	@property({ type: "string" })
	associatedSelectionVariantPath?: string;

	@property({ type: "boolean" })
	inMultiView?: boolean;

	@property({ type: "boolean" })
	displaySegmentedButton?: boolean;

	@property({ type: "boolean" })
	enablePastingOfComputedProperties?: boolean;

	@property({ type: "boolean" })
	enableSelectAll?: boolean;

	@property({ type: "int" })
	selectionLimit?: number;

	@aggregation({ type: "sap.fe.macros.table.TableCreationOptions", defaultClass: TableCreationOptions })
	creationMode?: TableCreationOptions;

	/**
	 * Aggregation to forward the IllustratedMessage control to the mdc control.
	 * @public
	 */
	@aggregation({
		type: "sap.m.IllustratedMessage",
		altTypes: ["sap.m.Text"],
		forwarding: {
			getter: "getMDCTable",
			aggregation: "noData"
		}
	})
	noData?: IllustratedMessage;

	/**
	 * A set of options that can be configured to control the aggregation behavior
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.AnalyticalConfiguration"
	})
	analyticalConfiguration?: AnalyticalConfiguration;

	/**
	 * Aggregate quickVariantSelection of the table.
	 */
	@aggregation({
		type: "sap.fe.macros.table.QuickVariantSelection"
	})
	quickVariantSelection?: QuickVariantSelection;

	/**
	 * Aggregate mass edit of the table.
	 */
	@aggregation({
		type: "sap.fe.macros.table.MassEdit"
	})
	massEdit?: MassEdit;

	/**
	 * An event is triggered when the table is about to be rebound. This event contains information about the binding info.
	 *
	 * You can use this event to add or read: Filters, Sorters.
	 * You can use this event to read the binding info.
	 * You can use this event to add: Selects.
	 */
	@event()
	beforeRebindTable?: Function;

	/**
	 * An event is triggered when the user chooses a row; the event contains information about which row is chosen.
	 *
	 * You can set this in order to handle the navigation manually.
	 */
	@event()
	rowPress?: Function;

	/**
	 * An event is triggered when the user switched between view in an ALP.
	 */
	@event()
	segmentedButtonPress?: Function;

	/**
	 * An event is triggered when the user saved the variant.
	 */
	@event()
	variantSaved?: Function;

	/**
	 * An event is triggered when the user selected a variant.
	 */
	@event()
	variantSelected?: Function;

	/**
	 * An event triggered when the Table list binding changes.
	 */
	@event()
	listBindingChange?: Function;

	@event()
	internalDataRequested!: Function;

	contextObjectPath!: DataModelObjectPath<LineItem | PresentationVariant | SelectionPresentationVariant>;

	private ignoreContextChangeEvent = false;

	private lock: Record<string, boolean> = {};

	overrideRowPress = false;

	getIgnoreContextChangeEvent(): boolean {
		return this.ignoreContextChangeEvent;
	}

	setIgnoreContextChangeEvent(value: boolean): void {
		this.ignoreContextChangeEvent = value;
	}

	/**
	 * Gets the relevant tableAPI for a UI5 event.
	 * An event can be triggered either by the inner control (the table) or the Odata listBinding
	 * The first initiator is the usual one so it's managed by the MacroAPI whereas
	 * the second one is specific to this API and has to managed by the TableAPI.
	 * @param source The UI5 event source
	 * @returns The TableAPI or false if not found
	 * @private
	 */
	static _getAPIExtension(source: ManagedObject): TableAPI | undefined {
		let tableAPI: TableAPI | undefined;
		if (source.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			tableAPI = ((this as unknown as XMLEventHolder).instanceMap?.get(this) as TableAPI[])?.find(
				(api) => api.content?.getRowBinding?.() === source || api.content?.getBinding("items") === source
			);
		}
		return tableAPI;
	}

	/**
	 * Gets contexts from the table that have been selected by the user.
	 * @returns Contexts of the rows selected by the user
	 * @public
	 */
	getSelectedContexts(): Context[] {
		// When a context menu item has been pressed, the selectedContexts correspond to the items on which
		// the corresponding action shall be applied.
		return this.isContextMenuActive()
			? this.getBindingContext("internal")?.getProperty("contextmenu/selectedContexts") ?? []
			: this.content.getSelectedContexts();
	}

	/**
	 * Adds a message to the table.
	 *
	 * The message applies to the whole table and not to an individual table row.
	 * @param [parameters] The parameters to create the message
	 * @param parameters.type Message type
	 * @param parameters.message Message text
	 * @param parameters.description Message description
	 * @param parameters.persistent True if the message is persistent
	 * @returns The ID of the message
	 * @public
	 */
	addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): string {
		const msgManager = this._getMessageManager();

		const oTable = this.getContent();

		const oMessage = new Message({
			target: oTable.getRowBinding().getResolvedPath(),
			type: parameters.type,
			message: parameters.message,
			processor: oTable.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});

		msgManager.addMessages(oMessage);
		return oMessage.getId();
	}

	/**
	 * This function will check if the table should request recommendations function.
	 * The table in view should only request recommendations if
	 * 1. The Page is in Edit mode
	 * 2. Table is not read only
	 * 3. It has annotation for Common.RecommendedValuesFunction
	 * 4. View is not ListReport, for OP/SubOP and forward views recommendations should be requested.
	 * @param _oEvent
	 * @returns True if recommendations needs to be requested
	 */
	checkIfRecommendationRelevant(_oEvent: UI5Event): boolean {
		const isTableReadOnly = this.getProperty("readOnly");
		const isEditable = CommonUtils.getIsEditable(this);
		const view = CommonUtils.getTargetView(this);
		const viewData = view.getViewData();
		// request for action only if we are in OP/SubOP and in Edit mode, also table is not readOnly
		if (!isTableReadOnly && isEditable && viewData.converterType !== "ListReport") {
			return true;
		}
		return false;
	}

	/**
	 * Removes a message from the table.
	 * @param id The id of the message
	 * @public
	 */
	removeMessage(id: string): void {
		const msgManager = this._getMessageManager();
		const messages = msgManager.getMessageModel().getData();
		const result = messages.find((e: Message) => e.getId() === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}

	/**
	 * Requests a refresh of the table.
	 * @public
	 */
	refresh(): void {
		const tableRowBinding = this.content.getRowBinding();
		if (tableRowBinding && (tableRowBinding.isRelative() || this.getTableDefinition().control.type === "TreeTable")) {
			// For tree tables, the refresh is always done using side effects to preserve expansion states
			const appComponent = CommonUtils.getAppComponent(this.content);
			const headerContext = tableRowBinding.getHeaderContext();

			if (headerContext) {
				appComponent
					.getSideEffectsService()
					.requestSideEffects([{ $NavigationPropertyPath: "" }], headerContext, tableRowBinding.getGroupId());
			}
		} else {
			tableRowBinding?.refresh();
		}
	}

	getQuickFilter(): QuickFilterSelector | undefined {
		return this.content?.getQuickFilter() as QuickFilterSelector | undefined;
	}

	/**
	 * Get the presentation variant that is currently applied on the table.
	 * @returns The presentation variant applied to the table
	 * @public
	 */
	async getPresentationVariant(): Promise<PresentationVariantClass> {
		try {
			const table = this.content;
			const tableState = await StateUtil.retrieveExternalState(table);

			//We remove "Property::" as it is prefixed to those columns that have associated propertyInfos.
			//The Presentation Variant format does not support this (it is only required by the Table and AppState).
			const sortOrder = tableState.sorters?.map((sorter: Sorters) => {
				return {
					Property: sorter.name.replace("Property::", ""),
					Descending: sorter.descending ?? false
				};
			});
			const groupLevels = tableState.groupLevels?.map((group: GroupLevels) => {
				return group.name.replace("Property::", "");
			});
			const tableViz = {
				Content: tableState.items?.map((item: Items) => {
					return {
						Value: item.name
					};
				}),
				Type: "LineItem"
			};
			const aggregations: Record<string, { aggregated?: boolean }> = {};
			let hasAggregations = false;
			for (const key in tableState.aggregations) {
				const newKey = key.replace("Property::", "");
				aggregations[newKey] = tableState.aggregations[key];
				hasAggregations = true;
			}
			const initialExpansionLevel = (table.getPayload() as { initialExpansionLevel?: number; hierarchyQualifier?: string })
				?.initialExpansionLevel;
			const tablePV = new PresentationVariantClass();
			tablePV.setTableVisualization(tableViz);
			const properties: PvProperties = {
				GroupBy: groupLevels || [],
				SortOrder: sortOrder || []
			};
			if (hasAggregations) {
				properties.Aggregations = aggregations;
			}
			if (initialExpansionLevel) {
				properties.initialExpansionLevel = initialExpansionLevel;
			}
			tablePV.setProperties(properties);
			return tablePV;
		} catch (error) {
			const id = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Table Building Block (${id}) - get presentation variant failed : ${message}`);
			throw Error(error as string);
		}
	}

	/**
	 * Set a new presentation variant to the table.
	 * @param tablePV The new presentation variant that is to be set on the table.
	 * @public
	 */
	async setPresentationVariant(tablePV: PresentationVariantClass): Promise<void> {
		try {
			const table = this.content;

			const currentStatePV = await this.getPresentationVariant();
			const propertyInfos = this.getEnhancedFetchedPropertyInfos();
			const propertyInfoNames = propertyInfos.map((propInfo) => propInfo.key);
			const newTableState = convertPVToState(tablePV, currentStatePV, propertyInfoNames);
			const tableProperties = tablePV.getProperties();
			if (tableProperties?.initialExpansionLevel !== undefined) {
				const tablePayload = table.getPayload() as { initialExpansionLevel?: number; hierarchyQualifier?: string };
				tablePayload.initialExpansionLevel = tableProperties.initialExpansionLevel;
			}
			await StateUtil.applyExternalState(table, newTableState);
		} catch (error) {
			const id = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Table Building Block (${id}) - set presentation variant failed : ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Get the variant management applied to the table.
	 * @returns Key of the currently selected variant. In case the model is not yet set, `null` will be returned.
	 * @public
	 */
	getCurrentVariantKey(): string | null {
		return this.content.getVariant()?.getCurrentVariantKey();
	}

	/**
	 * Set a variant management to the table.
	 * @param key Key of the variant that should be selected. If the passed key doesn't identify a variant, it will be ignored.
	 * @public
	 */
	setCurrentVariantKey(key: string): void {
		const variantManagement = this.content.getVariant();
		variantManagement.setCurrentVariantKey(key);
	}

	_getMessageManager(): Messaging {
		return Messaging;
	}

	/**
	 * An event triggered when the selection in the table changes.
	 */
	@event()
	selectionChange?: Function;

	_getRowBinding(): ODataListBinding {
		const oTable = this.getContent();
		return oTable.getRowBinding();
	}

	async getCounts(): Promise<string> {
		const oTable = this.getContent();
		return TableUtils.getListBindingForCount(oTable, oTable.getBindingContext(), {
			batchGroupId: !this.getProperty("bindingSuspended") ? oTable.data("batchGroupId") : "$auto",
			additionalFilters: TableUtils.getHiddenFilters(oTable)
		})
			.then((iValue: number) => {
				return TableUtils.getCountFormatted(iValue);
			})
			.catch(() => {
				return "0";
			});
	}

	/**
	 * Handles the context change on the table.
	 * An event is fired to propagate the OdataListBinding event and the enablement
	 * of the creation row is calculated.
	 * @param ui5Event The UI5 event
	 */
	onListBindingChange(ui5Event: UI5Event): void {
		this.fireEvent("listBindingChange", ui5Event.getParameters());
		this.setFastCreationRowEnablement();
		this.getQuickFilter()?.refreshSelectedCount();
		TableRuntime.setContextsAsync(this.content);
	}

	/**
	 * Handler for the onFieldLiveChange event.
	 * @param ui5Event The event object passed by the onFieldLiveChange event
	 */
	@xmlEventHandler()
	onFieldLiveChange(ui5Event: UI5Event<{}, Control>): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onFieldLiveChange(ui5Event);
	}

	/**
	 * Handles the change on a quickFilter
	 * The table is rebound if the FilterBar is not suspended and update the AppState.
	 *
	 */
	onQuickFilterSelectionChange(): void {
		const table = this.content;
		// Rebind the table to reflect the change in quick filter key.
		// We don't rebind the table if the filterBar for the table is suspended
		// as rebind will be done when the filterBar is resumed
		const filterBarID = table.getFilter();
		const filterBar = (filterBarID && UI5Element.getElementById(filterBarID)) as FilterBar | undefined;
		if (!filterBar?.getSuspendSelection?.()) {
			table.rebind();
		}
		(CommonUtils.getTargetView(this)?.getController() as PageController | undefined)?.getExtensionAPI().updateAppState();
	}

	onTableNavigate(oController: PageController, oContext: Context, mParameters: object): boolean | undefined {
		if (this.isTableRowNavigationPossible(oContext)) {
			if (this.fullScreenDialog) {
				// Exit fullscreen mode before navigation
				this.fullScreenDialog.close(); // The fullscreendialog will set this.fullScreenDialog to undefined when closing
			}
			const navigationParameters = Object.assign({}, mParameters, { reason: NavigationReason.RowPress });
			oController._routing.navigateForwardToContext(oContext, navigationParameters);
		} else {
			return false;
		}
	}

	/**
	 * Event handler for the row press event of the table.
	 * @param pressEvent
	 * @returns Promise<boolean>
	 */
	@xmlEventHandler()
	async onTableRowPress(pressEvent: RowActionItem$PressEvent): Promise<boolean | void> {
		const rowNavigationInfo = this.tableDefinition?.annotation.row?.navigationInfo;
		if (this.overrideRowPress === true) {
			// There's an event handler for the rowPress event --> we just fire the event and do not navigate
			this.fireEvent("rowPress", pressEvent.getParameters());
		} else if (rowNavigationInfo !== undefined) {
			const controller = this.getPageController();
			const bindingContext = pressEvent.getParameter("bindingContext") as Context;
			if (rowNavigationInfo.type === "Outbound") {
				// Outbound navigation
				return this.avoidParallelCalls(
					async () =>
						controller._intentBasedNavigation.onChevronPressNavigateOutBound(
							controller,
							rowNavigationInfo.navigationTarget,
							bindingContext,
							""
						),
					"onChevronPressNavigateOutBound"
				);
			} else {
				// Internal navigation
				const editable = rowNavigationInfo.checkEditable ? !bindingContext.getProperty("IsActiveEntity") : undefined;
				const parameters = {
					callExtension: true,
					targetPath: rowNavigationInfo.targetPath,
					editable,
					recreateContext: rowNavigationInfo.recreateContext
				};

				return this.onTableNavigate(controller, bindingContext, parameters);
			}
		}
	}

	/**
	 * Fires the corresponding event when the segmented button is pressed (in ALP).
	 * @param oEvent
	 */
	@xmlEventHandler()
	onSegmentedButtonPressed(oEvent: UI5Event): void {
		this.fireEvent("segmentedButtonPress", oEvent.getParameters());
	}

	/**
	 * Fires the corresponding event when a new variant is selected.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onVariantSelected(oEvent: UI5Event): void {
		this.fireEvent("variantSelected", oEvent.getParameters());
	}

	/**
	 * Fires the corresponding event when a variant is saved.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onVariantSaved(oEvent: UI5Event): void {
		this.fireEvent("variantSaved", oEvent.getParameters());
	}

	/**
	 * Fires the corresponding event when a row is pressed.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onRowPressed(oEvent: UI5Event): void {
		this.fireEvent("rowPress", oEvent.getParameters());
	}

	isTableRowNavigationPossible(context: Context): boolean {
		// prevent navigation to an empty row
		const emptyRow = context.isInactive() == true && context.isTransient() === true;
		// Or in the case of an analytical table, if we're trying to navigate to a context corresponding to a visual group or grand total
		// --> Cancel navigation
		const analyticalGroupHeaderExpanded =
			this.getTableDefinition().enableAnalytics === true &&
			context.isA("sap.ui.model.odata.v4.Context") &&
			typeof context.getProperty("@$ui5.node.isExpanded") === "boolean";
		return !(emptyRow || analyticalGroupHeaderExpanded);
	}

	@xmlEventHandler()
	onShareToCollaborationManagerPress(
		oEvent: UI5Event,
		controller: PageController,
		contexts: Context[],
		maxNumberofSelectedItems: number
	): void | boolean {
		// We can't fully move an xmlEventHandler to a mixin...
		return this._onShareToCollaborationManagerPress(controller, contexts, maxNumberofSelectedItems);
	}

	@xmlEventHandler()
	onOpenInNewTabPress(
		oEvent: UI5Event,
		controller: PageController,
		contexts: Context[],
		parameters: RoutingNavigationParameters,
		maxNumberofSelectedItems: number
	): void | boolean {
		if (contexts.length <= maxNumberofSelectedItems) {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const that = this;
			contexts.forEach(async function (context: Context) {
				if (that.isTableRowNavigationPossible(context)) {
					parameters.editable = !context.getProperty("IsActiveEntity");
					await controller._routing.navigateForwardToContext(context, parameters);
				} else {
					return false;
				}
			});
		} else {
			MessageBox.warning(
				Library.getResourceBundleFor("sap.fe.macros")!.getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [
					maxNumberofSelectedItems
				])
			);
		}
	}

	@xmlEventHandler()
	onInternalPatchCompleted(): void {
		// BCP: 2380023090
		// We handle enablement of Delete for the table here.
		// EditFlow.ts#handlePatchSent is handling the action enablement.
		const internalModelContext = this.getBindingContext("internal") as InternalModelContext;
		const selectedContexts = this.getSelectedContexts();
		DeleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, selectedContexts);
	}

	@xmlEventHandler()
	onInternalDataReceived(oEvent: UI5Event<{ error: string }, ODataListBinding>): void {
		const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
		if (isRecommendationRelevant) {
			const contextIdentifier = this.getIdentifierColumn(isRecommendationRelevant) as string[];
			const responseContextsArray = oEvent.getSource().getAllCurrentContexts();
			const newContexts: RecommendationContextsInfo[] = [];
			responseContextsArray.forEach((context) => {
				newContexts.push({
					context,
					contextIdentifier
				});
			});
			this.getPageController().recommendations.fetchAndApplyRecommendations(newContexts, true);
		}
		if (oEvent.getParameter("error")) {
			this.getPageController().messageHandler.showMessageDialog({ control: this });
		} else {
			this.getPageController().messageHandler.releaseHoldByControl(this);
			this.setDownloadUrl();
		}
	}

	@xmlEventHandler()
	onInternalDataRequested(oEvent: UI5Event): void {
		this.setProperty("dataInitialized", true);
		this.fireEvent("internalDataRequested", oEvent.getParameters());
		if (this.getQuickFilter() !== undefined && this.getTableDefinition().control.filters?.quickFilters?.showCounts === true) {
			this.getQuickFilter()?.setCountsAsLoading();
			this.getQuickFilter()?.refreshUnSelectedCounts();
		}
		this.getPageController().messageHandler.holdMessagesForControl(this);
	}

	/**
	 * Handles the Paste operation.
	 * @param evt The event
	 * @param controller The page controller
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	async onPaste(evt: PasteProvider$PasteEvent, controller: PageController, forContextMenu = false): Promise<void> {
		const rawPastedData = evt.getParameter("data"),
			source = evt.getSource();
		let table: Table;
		if (!forContextMenu) {
			// table toolbar
			table = (source.isA("sap.ui.mdc.Table") ? source : (source as Control).getParent()) as Table;
		} else {
			// context menu
			const menu = (source.isA("sap.m.Menu") ? source : (source as Control).getParent()) as Menu;
			table = menu.getParent()?.getParent() as Table;
		}
		const internalContext = table.getBindingContext("internal") as InternalModelContext;

		// If paste is disabled or if we're not in edit mode in an ObjectPage, we can't paste anything
		if (!this.tableDefinition.control.enablePaste || (table.getRowBinding().isRelative() && !CommonUtils.getIsEditable(this))) {
			return;
		}

		//This code is executed only in case of TreeTable
		const action = internalContext.getProperty("nodeUpdatesInfo/lastAction");
		const srcContexts = internalContext.getProperty("nodeUpdatesInfo/pastableContexts");

		if (this.tableDefinition.control.type === "TreeTable") {
			let srcContext = srcContexts[0];
			const newParentContext = !forContextMenu
				? (table.getSelectedContexts()[0] as Context)
				: (internalContext?.getProperty("contextmenu/selectedContexts")[0] as Context);
			// If the targetContext has been disassociated from the table due to expand and collapse actions, we attempt to retrieve it using its path.
			srcContext = table
				.getRowBinding()
				.getAllCurrentContexts()
				.find((context) => context.getPath() === srcContext?.getPath());

			if (!srcContext) {
				Log.error(`The ${action} operation is unsuccessful because the relevant context is no longer available`);
				return;
			}
			try {
				await Promise.all([
					srcContext.move({ parent: newParentContext ?? null, copy: action === "Copy" }),
					action === "Copy"
						? this.requestSideEffectsForCopyAction(srcContext)
						: this.requestSideEffectsForChangeNextSiblingAction(srcContext)
				]);
			} catch (error: unknown) {
				MessageToast.show(this.getTranslatedText("M_TABLEDROP_FAILED", [(error as Error).message ?? ""]));
			}
			internalContext.setProperty(`nodeUpdatesInfo/pastableContexts`, []);
			internalContext.setProperty(`nodeUpdatesInfo/pasteEnablement`, false);
			internalContext.setProperty(`contextmenu/nodeUpdatesInfo/pasteEnablement`, false);
			internalContext.setProperty(`nodeUpdatesInfo/lastAction`, undefined);

			return;
		}

		//This code is executed for tables excepted TreeTable
		if (table.getEnablePaste() === true && !forContextMenu) {
			const cellSelection = table.getCellSelector()?.getSelection();
			if (cellSelection?.columns.length > 0) {
				PasteHelper.pasteRangeData(rawPastedData ?? [], cellSelection, table);
			} else {
				PasteHelper.pasteData(rawPastedData ?? [], table, controller);
			}
		} else {
			const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
			MessageBox.error(resourceBundle.getText("T_OP_CONTROLLER_SAPFE_PASTE_DISABLED_MESSAGE"), {
				title: resourceBundle.getText("C_COMMON_SAPFE_ERROR")
			});
		}
	}

	/**
	 * Handles the Cut operation.
	 * @param evt The UI5 event.
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	onCut(evt: UI5Event<{}, UI5Element>, forContextMenu = false): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onCopyCut(evt, forContextMenu, "Cut");
	}

	/**
	 * Handles the Copy operation.
	 * @param evt The UI5 event.
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	onCopy(evt: UI5Event<{}, UI5Element>, forContextMenu = false): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onCopyCut(evt, forContextMenu, "Copy");
	}

	// This event will allow us to intercept the export before is triggered to cover specific cases
	// that couldn't be addressed on the propertyInfos for each column.
	// e.g. Fixed Target Value for the datapoints
	@xmlEventHandler()
	onBeforeExport(exportEvent: Table$BeforeExportEvent): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onBeforeExport(exportEvent);
	}

	/**
	 * Handles the MDC DataStateIndicator plugin to display messageStrip on a table.
	 * @param message
	 * @param control
	 * @returns Whether to render the messageStrip visible
	 */
	dataStateIndicatorFilter(message: Message, control: Control): boolean {
		const mdcTable = control as MDCTable;
		const sTableContextBindingPath = mdcTable.getBindingContext()?.getPath();
		const sTableRowBinding = (sTableContextBindingPath ? `${sTableContextBindingPath}/` : "") + mdcTable.getRowBinding().getPath();
		return sTableRowBinding === message.getTargets()[0] ? true : false;
	}

	/**
	 * This event handles the DataState of the DataStateIndicator plugin from MDC on a table.
	 * It's fired when new error messages are sent from the backend to update row highlighting.
	 * @param evt Event object
	 */
	@xmlEventHandler()
	onDataStateChange(evt: DataStateIndicator$DataStateChangeEvent): void {
		const dataStateIndicator = evt.getSource();
		const filteredMessages = evt.getParameter("filteredMessages") as Message[];
		if (filteredMessages) {
			const hiddenMandatoryProperties = filteredMessages
				.map((msg) => {
					const technicalDetails = (msg.getTechnicalDetails() || {}) as {
						tableId?: string;
						emptyRowMessage?: boolean;
						missingColumn?: string;
					};
					return technicalDetails.emptyRowMessage === true && technicalDetails.missingColumn;
				})
				.filter((hiddenProperty) => !!hiddenProperty);
			if (hiddenMandatoryProperties.length) {
				const messageStripError = Library.getResourceBundleFor("sap.fe.macros")!.getText(
					hiddenMandatoryProperties.length === 1
						? "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN"
						: "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN_PLURAL",
					[hiddenMandatoryProperties.join(", ")]
				);
				dataStateIndicator.showMessage(messageStripError, "Error");
			}
			const internalModel = dataStateIndicator.getModel("internal") as JSONModel;
			internalModel.setProperty("filteredMessages", filteredMessages, dataStateIndicator.getBindingContext("internal") as Context);
		}
	}

	resumeBinding(bRequestIfNotInitialized: boolean): void {
		this.setProperty("bindingSuspended", false);
		if ((bRequestIfNotInitialized && !this.getDataInitialized()) || this.getProperty("outDatedBinding")) {
			this.setProperty("outDatedBinding", false);
			this.getContent()?.rebind();
		}
	}

	refreshNotApplicableFields(oFilterControl: Control): string[] {
		const oTable = this.getContent();
		return FilterUtils.getNotApplicableFilters(oFilterControl as FilterBar, oTable);
	}

	suspendBinding(): void {
		this.setProperty("bindingSuspended", true);
	}

	invalidateContent(): void {
		this.setProperty("dataInitialized", false);
		this.setProperty("outDatedBinding", false);
	}

	/**
	 * Sets the enablement of the creation row.
	 * @private
	 */
	setFastCreationRowEnablement(): void {
		const table = this.content;
		const fastCreationRow = table.getCreationRow();

		if (fastCreationRow && !fastCreationRow.getBindingContext()) {
			const tableBinding = table.getRowBinding();
			const bindingContext = tableBinding.getContext();

			if (bindingContext) {
				TableHelper.enableFastCreationRow(
					fastCreationRow,
					tableBinding.getPath(),
					bindingContext,
					bindingContext.getModel(),
					Promise.resolve()
				);
			}
		}
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 * @returns Undefined if the card preview is rendered.
	 */
	@xmlEventHandler()
	async onAddCardToInsightsPressed(): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		return this._onAddCardToInsightsPressed();
	}

	@xmlEventHandler()
	onMassEditButtonPressed(ui5Event: UI5Event, forContextMenu: boolean): void {
		const massEditHelper = new MassEditDialogHelper({
			table: this.content,
			onContextMenu: forContextMenu,
			onClose: (): void => {
				this.setMassEditDialogHelper();
			}
		});
		this.setMassEditDialogHelper(massEditHelper);
		massEditHelper.open();
	}

	@xmlEventHandler()
	async onSelectionChanged(ui5event: Table$SelectionChangeEvent): Promise<void> {
		await TableRuntime.setContexts(ui5event);
		this.fireEvent("selectionChange", { ...ui5event.getParameters(), selectedContext: this.getSelectedContexts() });
	}

	@xmlEventHandler()
	async onActionPress(
		oEvent: UI5Event<{}, Control>,
		pageController: PageController,
		actionName: string,
		parameters: {
			model: ODataModel;
			notApplicableContexts: Context[];
			label: string;
			contexts: Context[];
			applicableContexts: Context[];
			entitySetName: string;
		}
	): Promise<unknown> {
		parameters.model = oEvent.getSource().getModel() as ODataModel;
		let executeAction = true;
		if (parameters.notApplicableContexts && parameters.notApplicableContexts.length > 0) {
			// If we have non applicable contexts, we need to open a dialog to ask the user if he wants to continue
			const convertedMetadata = convertTypes(parameters.model.getMetaModel());
			const entityType = convertedMetadata.resolvePath<EntityType>(this.entityTypeFullyQualifiedName).target!;
			const myUnapplicableContextDialog = new NotApplicableContextDialog({
				entityType: entityType,
				notApplicableContexts: parameters.notApplicableContexts,
				title: parameters.label,
				resourceModel: getResourceModel(this),
				entitySet: parameters.entitySetName,
				actionName: actionName
			});
			parameters.contexts = parameters.applicableContexts;
			executeAction = await myUnapplicableContextDialog.open(this);
		}
		if (executeAction) {
			// Direct execution of the action
			try {
				return await pageController.editFlow.invokeAction(actionName, { ...parameters, ...{ feFrameworkCall: true } });
			} catch (e) {
				Log.info(e as string);
			}
		}
	}

	@xmlEventHandler()
	onContextMenuPress(oEvent: Table$BeforeOpenContextMenuEvent): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onContextMenuPress(oEvent);
	}

	/**
	 * Expose the internal table definition for external usage in the delegate.
	 * @returns The tableDefinition
	 */
	getTableDefinition(): TableVisualization {
		return this.tableDefinition;
	}

	/**
	 * Sets the mass edit related to the table.
	 * @param massEditDialogHelper
	 */
	setMassEditDialogHelper(massEditDialogHelper?: MassEditDialogHelper): void {
		this.massEditDialogHelper = massEditDialogHelper;
	}

	/**
	 * Expose the mass edit related to the table.
	 * @returns The mass edit related to the table, if any
	 */
	getMassEditDialogHelper(): MassEditDialogHelper | undefined {
		return this.massEditDialogHelper;
	}

	/**
	 * connect the filter to the tableAPI if required
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */

	updateFilterBar(): void {
		const table = this.getContent();
		const filterBarRefId = this.getFilterBar();
		if (table && filterBarRefId && table.getFilter?.() !== filterBarRefId) {
			this._setFilterBar(filterBarRefId);
		}
	}

	/**
	 * Removes the table from the listeners of the filterBar.
	 */
	detachFilterBar(): void {
		const table = this.content;
		table?.setFilter("");
	}

	/**
	 * Gets the filter control.
	 * @param filterBarRefId Id of the filter bar
	 * @returns The filter control
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */
	getFilterBarControl(filterBarRefId: string): UI5Element | undefined {
		// 'filterBar' property of macros:Table(passed as customData) might be
		// 1. A localId wrt View(FPM explorer example).
		// 2. Absolute Id(this was not supported in older versions).
		// 3. A localId wrt FragmentId(when an XMLComposite or Fragment is independently processed) instead of ViewId.
		//    'filterBar' was supported earlier as an 'association' to the 'mdc:Table' control inside 'macros:Table' in prior versions.
		//    In newer versions 'filterBar' is used like an association to 'macros:TableAPI'.
		//    This means that the Id is relative to 'macros:TableAPI'.
		//    This scenario happens in case of FilterBar and Table in a custom sections in OP of FEV4.

		const tableAPIId = this?.getId();
		const tableAPILocalId = this.data("tableAPILocalId");
		const potentialfilterBarId =
			tableAPILocalId && filterBarRefId && tableAPIId && tableAPIId.replace(new RegExp(tableAPILocalId + "$"), filterBarRefId); // 3
		return (
			this.getPageController()?.byId(filterBarRefId) ||
			UI5Element.getElementById(filterBarRefId) ||
			UI5Element.getElementById(potentialfilterBarId)
		);
	}

	/**
	 * Sets the filter depending on the type of filterBar.
	 * @param filterBarRefId Id of the filter bar
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */
	_setFilterBar(filterBarRefId: string): void {
		const table = this.getContent();
		const filterBar = this.getFilterBarControl(filterBarRefId);

		if (filterBar) {
			if (filterBar.isA<FilterBarAPI>("sap.fe.macros.filterBar.FilterBarAPI")) {
				table.setFilter(`${filterBar.getId()}-content`);
			} else if (
				filterBar.isA<FilterBarBBV4>("sap.fe.macros.filterBar.FilterBar") &&
				filterBar?.content?.isA("sap.fe.macros.filterBar.FilterBarAPI")
			) {
				table.setFilter(`${filterBar.content.getId()}-content`);
			} else if (
				filterBar.isA<FilterBar>("sap.ui.mdc.FilterBar") ||
				filterBar.isA<typeof BasicSearch>("sap.fe.macros.table.BasicSearch")
			) {
				table.setFilter(filterBar.getId());
			}
		}
	}

	/**
	 * Handles the CreateActivate event from the ODataListBinding.
	 * @param activateEvent The event sent by the binding
	 */
	@xmlEventHandler()
	async handleCreateActivate(activateEvent: UI5Event<{ context: Context }, ODataListBinding>): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._handleCreateActivate(activateEvent);
	}

	/**
	 * The dragged element enters a table row.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragEnterDocument(
		ui5Event: UI5Event<{ bindingContext: Context; dragSource: Context; dropPosition: "Before" | "After" | "On" }, DragDropInfo>
	): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onDragEnterDocument(ui5Event);
	}

	/**
	 * Starts the drag of the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragStartDocument(ui5Event: UI5Event<{ bindingContext: Context }, Control>): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onDragStartDocument(ui5Event);
	}

	/**
	 * Drops the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 * @returns The Promise
	 */
	@xmlEventHandler()
	async onDropDocument(
		ui5Event: UI5Event<{
			bindingContext: Context;
			dragSource: Context;
			dropPosition: string;
		}>
	): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._onDropDocument(ui5Event);
	}

	@xmlEventHandler()
	async onCollapseExpandNode(ui5Event: UI5Event, expand: boolean): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._onCollapseExpandNode(ui5Event, expand);
	}

	/**
	 * Internal method to move a row up or down in a Tree table.
	 * @param ui5Event
	 * @param moveUp True for move up, false for move down
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	async onMoveUpDown(ui5Event: UI5Event, moveUp: boolean, forContextMenu = false): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._onMoveUpDown(ui5Event, moveUp, forContextMenu);
	}

	/**
	 * Get the selection variant from the table. This function considers only the selection variant applied at the control level.
	 * @returns A promise which resolves with {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		return StateHelper.getSelectionVariant(this.getContent());
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the table. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the table
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the SelectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(selectionVariant: SelectionVariant, prefillDescriptions = false): Promise<unknown> {
		return StateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
	}

	private async _createContentV2Mode(): Promise<void> {
		const owner = this._getOwner();
		const preprocessorContext = owner?.preprocessorContext;
		if (owner && preprocessorContext) {
			const metaModel = owner.getAppComponent().getMetaModel();
			const metaPath = metaModel.createBindingContext(this.metaPath)!;
			const contextPath = metaModel.createBindingContext(this.contextPath)!;

			this.tableDefinition = deepClone(this.originalTableDefinition);
			this.updateColumnsVisibility(this.ignoredFields, this.tableDefinition);

			const convertedMetadata = convertTypes(metaModel);
			const collectionEntity = convertedMetadata.resolvePath(this.tableDefinition.annotation.collection).target as
				| EntitySet
				| NavigationProperty;
			this.contextObjectPath = getInvolvedDataModelObjects<LineItem | PresentationVariant | SelectionPresentationVariant>(
				metaPath,
				contextPath
			);
			const handlerProvider = new TableEventHandlerProvider(this, { collectionEntity, metaModel });

			const fragment = await XMLPreprocessor.process(
				parseXMLString(
					xml`<root
			xmlns="sap.m"
			xmlns:mdc="sap.ui.mdc"
			xmlns:plugins="sap.m.plugins"
			xmlns:mdcTable="sap.ui.mdc.table"
			xmlns:macroTable="sap.fe.macros.table"
			xmlns:mdcat="sap.ui.mdc.actiontoolbar"
			xmlns:core="sap.ui.core"
			xmlns:control="sap.fe.core.controls"
			xmlns:dt="sap.ui.dt"
			xmlns:fl="sap.ui.fl"
			xmlns:variant="sap.ui.fl.variants"
			xmlns:p13n="sap.ui.mdc.p13n"
			xmlns:internalMacro="sap.fe.macros.internal">${jsx.renderAsXML(() => {
				return MdcTableTemplate.getMDCTableTemplate(this, {
					convertedMetadata: preprocessorContext.getConvertedMetadata(),
					metaModel,
					handlerProvider,
					appComponent: owner.getAppComponent(),
					metaPath
				});
			})}</root>`,
					true
				)[0],
				{ models: {} },
				preprocessorContext
			);
			if (fragment.firstElementChild) {
				// Remove the old MDC table from the list of FilterBar listeners
				this.detachFilterBar();

				this.content?.destroy();
				const content = (await Fragment.load({
					definition: fragment.firstElementChild,
					controller: owner.getRootController(),
					containingView: owner.getRootControl()
				})) as Table;
				this.content = content;

				this.updateFilterBar();
			}
		}
	}

	setProperty(propertyKey: string, propertyValue: unknown, bSuppressInvalidate?: boolean): this {
		if (!this._applyingSettings && propertyValue !== undefined && ["ignoredFields", "metaPath"].includes(propertyKey)) {
			super.setProperty(propertyKey, propertyValue, true);
			this._createContentV2Mode();
		} else {
			super.setProperty(propertyKey, propertyValue, bSuppressInvalidate);
		}
		return this;
	}

	/**
	 * Retrieves the data model and converted target object based on the provided property name.
	 * @param propertyName The name of the property.
	 * @returns Returns data model path and converted target object.
	 */

	getDataModelAndConvertedTargetObject(propertyName: string | undefined): DataModelConversion | undefined {
		const table = this.getContent();
		const metaModel = table.getModel()?.getMetaModel();
		if (!metaModel) {
			return;
		}
		const entityPath = table.data("metaPath");
		const targetMetaPath = this.getEnhancedFetchedPropertyInfos().find((propertyInfo) => propertyInfo.name === propertyName)
			?.annotationPath;
		const targetObject = metaModel.getContext(targetMetaPath!);
		const entitySet = metaModel.getContext(entityPath);
		const convertedtargetObject = MetaModelConverter.convertMetaModelContext(targetObject) as
			| DataFieldAbstractTypes
			| DataPointTypeTypes;
		let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldAbstractTypes | DataPointTypeTypes | Property>(
			targetObject,
			entitySet
		);
		dataModelPath =
			FieldTemplating.getDataModelObjectPathForValue(
				dataModelPath as DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>
			) || dataModelPath;
		return { dataModelPath: dataModelPath, convertedtargetObject: convertedtargetObject };
	}

	/**
	 * Get the binding context for the given ModeAsExpression.
	 * @param ModeAsExpression
	 * @param rowContext
	 * @returns
	 */

	createAnyControl(ModeAsExpression: CompiledBindingToolkitExpression, rowContext: Context | undefined): typeof Any {
		const table = this.getContent();
		const anyObject = new Any({ any: ModeAsExpression });
		anyObject.setModel(rowContext?.getModel());
		anyObject.setModel(table.getModel("ui"), "ui");
		return anyObject;
	}

	/**
	 * Get the edit mode of a Property.
	 * @param propertyName The name of the property
	 * @param rowContext The context of the row containing the property
	 * @returns The edit mode of the field
	 */

	getPropertyEditMode(propertyName: string, rowContext: Context): string | undefined {
		let anyObject: typeof Any | undefined;
		if (!this.propertyEditModeCache[propertyName]) {
			const dataModelPath = this.getDataModelAndConvertedTargetObject(propertyName)?.dataModelPath;
			const convertedtargetObject = this.getDataModelAndConvertedTargetObject(propertyName)?.convertedtargetObject;
			if (dataModelPath && convertedtargetObject) {
				const propertyForFieldControl = (dataModelPath?.targetObject as unknown as DataFieldTypes)?.Value
					? (dataModelPath?.targetObject as unknown as DataFieldTypes).Value
					: dataModelPath?.targetObject;
				const editModeAsExpression = compileExpression(
					UIFormatters.getEditMode(propertyForFieldControl, dataModelPath, false, true, convertedtargetObject)
				);
				anyObject = this.createAnyControl(editModeAsExpression, rowContext);
				this.propertyEditModeCache[propertyName] = anyObject;
				anyObject.setBindingContext(null); // we need to set the binding context to null otherwise the following addDependent will set it to the context of the table
				this.addDependent(anyObject); // to destroy it when the tableAPI is destroyed
			}
		} else {
			anyObject = this.propertyEditModeCache[propertyName];
		}
		anyObject?.setBindingContext(rowContext);
		const editMode = anyObject?.getAny() as string | undefined;
		anyObject?.setBindingContext(null);
		return editMode;
	}

	/**
	 * Show the columns with the given column keys by setting their availability to Default.
	 * @param columnKeys The keys for the columns to show
	 * @returns Promise<void>
	 * @public
	 * @experimental As of version 1.124.0
	 * @since 1.124.0
	 */
	async showColumns(columnKeys: string[]): Promise<void> {
		for (const columnKey of columnKeys) {
			this.modifyDynamicVisibilityForColumn(columnKey, true);
		}
		return this._createContentV2Mode();
	}

	/**
	 * Hide the columns with the given column keys by setting their availability to Default.
	 * @param columnKeys The keys for the columns to hide
	 * @returns Promise<void>
	 * @public
	 * @experimental As of version 1.124.0
	 * @since 1.124.0
	 */
	async hideColumns(columnKeys: string[]): Promise<void> {
		for (const columnKey of columnKeys) {
			this.modifyDynamicVisibilityForColumn(columnKey, false);
		}
		return this._createContentV2Mode();
	}

	/**
	 * Sets the fields that should be ignored when generating the table.
	 * @param ignoredFields The fields to ignore
	 * @returns Reference to this in order to allow method chaining
	 * @experimental
	 * @since 1.124.0
	 * @public
	 */
	setIgnoredFields(ignoredFields: string): this {
		return this.setProperty("ignoredFields", ignoredFields);
	}

	/**
	 * Get the fields that should be ignored when generating the table.
	 * @returns The value of the ignoredFields property
	 * @experimental
	 * @since 1.124.0
	 * @public
	 */
	getIgnoredFields(): string {
		return this.getProperty("ignoredFields") ?? this.tableDefinition.control.ignoredFields;
	}

	/**
	 * Retrieves the control state based on the given control state key.
	 * @param controlState The current state of the control.
	 * @returns - The full state of the control along with the initial state if available.
	 */
	getControlState(controlState: ControlState): ControlState {
		const initialControlState: Record<string, unknown> = this.initialControlState;
		if (controlState) {
			return {
				fullState: controlState as object,
				initialState: initialControlState as object
			};
		}
		return controlState;
	}

	/**
	 * Returns the key to be used for given control.
	 * @param oControl The control to get state key for
	 * @returns The key to be used for storing the controls state
	 */
	getStateKey(oControl: ManagedObject): string {
		return CommonUtils.getTargetView(this.content)?.getLocalId(oControl.getId()) || oControl.getId();
	}

	/**
	 * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
	 * @param ignoredFields
	 * @param dynamicVisibilityForColumns
	 * @param tableDefinition
	 */
	public static updateColumnsVisibility(
		ignoredFields: string | undefined,
		dynamicVisibilityForColumns: DynamicVisibilityForColumn[],
		tableDefinition: TableVisualization
	): void {
		ColumnManagement.updateColumnsVisibilityStatic(ignoredFields, dynamicVisibilityForColumns, tableDefinition);
	}

	/**
	 * Returns the MDC table.
	 * This method is called by the forwarding aggregation to get the target of the aggregation.
	 * @private
	 * @returns The mdc table
	 */
	getMDCTable(): MDCTable {
		return this.content;
	}

	/**
	 * Called by the MDC state util when the state for this control's child has changed.
	 */
	handleStateChange(): void {
		this.getPageController()?.getExtensionAPI().updateAppState();
	}

	/**
	 * Calls the asyncCall function only if the lockName is not already locked.
	 * @param asyncCall
	 * @param lockName
	 * @returns Promise<void>
	 */
	async avoidParallelCalls(asyncCall: Function, lockName: string): Promise<void> {
		if (this.lock[lockName]) {
			return;
		}
		this.lock[lockName] = true;
		try {
			await asyncCall();
		} catch {
			this.lock[lockName] = false;
		}
		this.lock[lockName] = false;
	}

	destroy(suppressInvalidate?: boolean): void {
		// We release hold on messageHandler by the control if there is one.
		this.getPageController(false)?.messageHandler?.releaseHoldByControl(this);
		super.destroy(suppressInvalidate);
	}

	private fullScreenDialog?: Dialog; // The dialog used to display the table in full screen mode

	setFullScreenDialog(dialog: Dialog | undefined): void {
		this.fullScreenDialog = dialog;
	}

	private enhancedPropertyInfos: EnhancedFEPropertyInfo[] = [];

	private propertyInfos: PropertyInfo[] = [];

	/**
	 * Sets the fetched propertyInfos from the table delegate containing internal properties.
	 * @param enhancedPropertyInfos
	 * @private
	 */
	setEnhancedFetchedPropertyInfos(enhancedPropertyInfos: EnhancedFEPropertyInfo[]): void {
		this.enhancedPropertyInfos = enhancedPropertyInfos;
	}

	/**
	 * Gets the fetched propertyInfos from the table delegate containing internal properties.
	 * @returns The PropertyInfo enhanced with the PropertyInfos from the table delegate
	 * @private
	 */
	getEnhancedFetchedPropertyInfos(): EnhancedFEPropertyInfo[] {
		return this.enhancedPropertyInfos;
	}

	/**
	 * Gets the MDC expected propertyInfos from the table delegate containing internal additional properties.
	 * @returns The PropertyInfo
	 * @private
	 */
	getPropertyInfos(): PropertyInfo[] {
		const propertyInfos: PropertyInfo[] = [];
		for (const enhancedPropertyInfo of this.enhancedPropertyInfos as PropertyInfo[]) {
			let propertyInfo: PropertyInfo = {
				key: enhancedPropertyInfo.key,
				label: enhancedPropertyInfo.label,
				visible: enhancedPropertyInfo.visible,
				exportSettings: enhancedPropertyInfo.exportSettings,
				clipboardSettings: enhancedPropertyInfo.clipboardSettings,
				visualSettings: enhancedPropertyInfo.visualSettings,
				tooltip: enhancedPropertyInfo.tooltip,
				isKey: enhancedPropertyInfo.isKey
			};

			if (enhancedPropertyInfo.propertyInfos) {
				propertyInfo = {
					...propertyInfo,
					propertyInfos: enhancedPropertyInfo.propertyInfos
				};
			} else {
				let extension: PropertyInfo["extension"];
				if (enhancedPropertyInfo.extension) {
					extension = {
						technicallyGroupable: enhancedPropertyInfo.extension.technicallyGroupable,
						technicallyAggregatable: enhancedPropertyInfo.extension.technicallyAggregatable,
						customAggregate: enhancedPropertyInfo.extension.customAggregate
					};
					extension = Object.fromEntries(Object.entries(extension).filter(([_, value]) => value !== undefined));
				}
				propertyInfo = {
					...propertyInfo,
					path: enhancedPropertyInfo.path,
					maxConditions: enhancedPropertyInfo.maxConditions,
					formatOptions: enhancedPropertyInfo.formatOptions,
					constraints: enhancedPropertyInfo.constraints,
					group: enhancedPropertyInfo.group,
					groupLabel: enhancedPropertyInfo.groupLabel,
					caseSensitive: enhancedPropertyInfo.caseSensitive,
					filterable: enhancedPropertyInfo.filterable,
					sortable: enhancedPropertyInfo.sortable,
					groupable: enhancedPropertyInfo.groupable,
					dataType: enhancedPropertyInfo.dataType,
					aggregatable: enhancedPropertyInfo.aggregatable,
					unit: enhancedPropertyInfo.unit,
					text: enhancedPropertyInfo.text,
					extension
				};
			}
			propertyInfos.push(
				Object.fromEntries(Object.entries(propertyInfo).filter(([_, value]) => value !== undefined)) as PropertyInfo
			);
		}
		return propertyInfos;
	}

	setCachedPropertyInfos(propertyInfos: PropertyInfo[]): void {
		this.propertyInfos = propertyInfos;
	}

	getCachedPropertyInfos(): PropertyInfo[] {
		return this.propertyInfos;
	}

	/**
	 * Gets the path for the table collection.
	 * @returns The path
	 */
	getRowCollectionPath(): string {
		const controller = this.getPageController()!;
		const metaModel = controller.getModel().getMetaModel();
		const collectionContext = metaModel.createBindingContext(this.tableDefinition.annotation.collection);
		const contextPath = metaModel.createBindingContext(this.contextPath)!;
		const dataModelPath = getInvolvedDataModelObjects(collectionContext!, contextPath);
		return getContextRelativeTargetObjectPath(dataModelPath) || getTargetObjectPath(dataModelPath);
	}

	/**
	 * Gets the binding info used when creating the list binding for the MDC table.
	 * @returns The table binding info
	 */
	getTableTemplateBindingInfo(): CollectionBindingInfo {
		const controller = this.getPageController()!;
		const path = this.getRowCollectionPath();
		const rowBindingInfo: CollectionBindingInfo = {
			suspended: false,
			path,
			parameters: {
				$count: true
			}
		};

		if (this.tableDefinition.enable$select) {
			// Don't add $select parameter in case of an analytical query, this isn't supported by the model
			const select = Object.keys(this.tableDefinition.requestAtLeast).join(",");
			if (select) {
				rowBindingInfo.parameters!.$select = select;
			}
		}

		if (this.tableDefinition.enable$$getKeepAliveContext) {
			// we later ensure in the delegate only one list binding for a given targetCollectionPath has the flag $$getKeepAliveContext
			rowBindingInfo.parameters!.$$getKeepAliveContext = true;
		}

		// Clears the selection after a search/filter
		rowBindingInfo.parameters!.$$clearSelectionOnFilter = true;

		rowBindingInfo.parameters!.$$groupId = "$auto.Workers";
		rowBindingInfo.parameters!.$$updateGroupId = "$auto";
		rowBindingInfo.parameters!.$$ownRequest = true;
		rowBindingInfo.parameters!.$$patchWithoutSideEffects = true;

		// Event handlers
		const editFlowExtension = controller.editFlow;
		const eventHandlers: Record<string, Function> = {};
		eventHandlers.patchCompleted = this.onInternalPatchCompleted.bind(this);
		eventHandlers.dataReceived = this.onInternalDataReceived.bind(this);
		eventHandlers.dataRequested = this.onInternalDataRequested.bind(this);
		eventHandlers.change = this.onListBindingChange.bind(this);
		eventHandlers.createActivate = this.handleCreateActivate.bind(this);
		eventHandlers.createSent = editFlowExtension.handleCreateSent.bind(editFlowExtension);
		if (this.tableDefinition.handlePatchSent) {
			eventHandlers.patchSent = editFlowExtension.handlePatchSent.bind(editFlowExtension);
		} else if (controller.inlineEditFlow.isInlineEditPossible()) {
			eventHandlers.patchSent = controller.inlineEditFlow.handleInlineEditPatchSent.bind(controller.inlineEditFlow);
		}
		rowBindingInfo.events = eventHandlers;

		return rowBindingInfo;
	}

	protected static addSetting(target: Record<string, unknown>, key: string, value: unknown): void {
		if (value !== undefined) {
			target[key] = value;
		}
	}

	/**
	 * Create manifest-friendly settings from tableAPI properties.
	 * @returns Settings
	 */
	getSettingsForManifest(): Record<string, unknown> {
		const tableSettings: Record<string, unknown> = {};
		TableAPI.addSetting(tableSettings, "enableExport", this.enableExport);
		TableAPI.addSetting(tableSettings, "exportRequestSize", this.exportRequestSize);
		TableAPI.addSetting(tableSettings, "frozenColumnCount", this.frozenColumnCount);
		TableAPI.addSetting(tableSettings, "widthIncludingColumnHeader", this.widthIncludingColumnHeader);
		TableAPI.addSetting(tableSettings, "rowCountMode", this.rowCountMode);
		TableAPI.addSetting(tableSettings, "rowCount", this.rowCount);
		TableAPI.addSetting(tableSettings, "enableFullScreen", this.enableFullScreen);
		TableAPI.addSetting(tableSettings, "enablePaste", this.enablePaste);
		TableAPI.addSetting(tableSettings, "disableCopyToClipboard", this.disableCopyToClipboard);
		TableAPI.addSetting(tableSettings, "scrollThreshold", this.scrollThreshold);
		TableAPI.addSetting(tableSettings, "selectionMode", this.selectionMode);
		TableAPI.addSetting(tableSettings, "type", this.type);
		TableAPI.addSetting(tableSettings, "enablePastingOfComputedProperties", this.enablePastingOfComputedProperties);
		TableAPI.addSetting(tableSettings, "selectAll", this.enableSelectAll);
		TableAPI.addSetting(tableSettings, "ignoredFields", this.ignoredFields);
		TableAPI.addSetting(tableSettings, "selectionLimit", this.selectionLimit);
		TableAPI.addSetting(tableSettings, "condensedTableLayout", this.condensedTableLayout);

		if (this.creationMode) {
			const creationMode: Record<string, unknown> = {};
			TableAPI.addSetting(creationMode, "name", this.creationMode.name);
			TableAPI.addSetting(creationMode, "creationFields", this.creationMode.creationFields);
			TableAPI.addSetting(creationMode, "createAtEnd", this.creationMode.createAtEnd);
			TableAPI.addSetting(creationMode, "inlineCreationRowsHiddenInEditMode", this.creationMode.inlineCreationRowsHiddenInEditMode);
			TableAPI.addSetting(creationMode, "outbound", this.creationMode.outbound);
			if (Object.entries(creationMode).length > 0) {
				tableSettings["creationMode"] = creationMode;
			}
		}

		if (this.massEdit) {
			const enableMassEdit: Record<string, unknown> = {};
			TableAPI.addSetting(enableMassEdit, "customFragment", this.massEdit.customContent);
			TableAPI.addSetting(enableMassEdit, "fromInline", true);
			TableAPI.addSetting(enableMassEdit, "visibleFields", this.massEdit.visibleFields?.join(","));
			TableAPI.addSetting(enableMassEdit, "ignoredFields", this.massEdit.ignoredFields?.join(","));
			TableAPI.addSetting(enableMassEdit, "operationGroupingMode", this.massEdit.operationGroupingMode);
			tableSettings["enableMassEdit"] = enableMassEdit;
		}

		if (this.analyticalConfiguration?.aggregationOnLeafLevel === true) {
			const analyticalConfiguration: Record<string, unknown> = {};
			TableAPI.addSetting(analyticalConfiguration, "aggregationOnLeafLevel", this.analyticalConfiguration.aggregationOnLeafLevel);
			if (Object.entries(analyticalConfiguration).length > 0) {
				tableSettings["analyticalConfiguration"] = analyticalConfiguration;
			}
		}

		if (this.quickVariantSelection?.paths?.length) {
			TableAPI.addSetting(tableSettings, "quickVariantSelection", {
				paths: this.quickVariantSelection.paths.map((path) => {
					return { annotationPath: path };
				}),
				showCounts: this.quickVariantSelection.showCounts
			});
		}

		return tableSettings;
	}

	/**
	 * Find an action from its key.
	 * @param key
	 * @returns The action if it can be found (or undefined)
	 */
	findSlotActionFromKey(key: string): Action | undefined {
		let result: Action | undefined;

		for (const action of this.actions ?? []) {
			if (
				action.isA<ActionGroup>("sap.fe.macros.table.ActionGroup") ||
				action.isA<ActionGroupOverride>("sap.fe.macros.table.ActionGroupOverride")
			) {
				result ??= action.actions.find((a) => {
					return a.isA<Action>("sap.fe.macros.table.Action") && a.key === key;
				}) as Action | undefined;
			} else if (action.isA<Action>("sap.fe.macros.table.Action") && action.key === key) {
				result = action;
				break;
			}
		}

		return result;
	}

	onMetadataAvailable(): void {
		this.createContent();
	}

	getFullMetaPath(): string {
		if (this.metaPath.startsWith("/")) {
			return this.metaPath;
		} else if (this.contextPath.endsWith("/")) {
			return `${this.contextPath}${this.metaPath}`;
		} else {
			return `${this.contextPath}/${this.metaPath}`;
		}
	}

	private createContent(forceCreation = false): void {
		const owner = this._getOwner();
		if (!owner) {
			return;
		}

		this.contextPath ??= this.getOwnerContextPath() as string;
		const fullMetaPath = this.getFullMetaPath();
		if (!this.content || forceCreation) {
			this.detachFilterBar();
			this.content?.destroy();

			const metaModel = owner.getAppComponent().getMetaModel();
			const metaPathContext = metaModel.createBindingContext(fullMetaPath)!;

			this.tableDefinition = createTableDefinition(this);
			this.updatePropertiesFromTableDefinition();

			this.updateColumnsVisibility(this.tableDefinition.control.ignoredFields, this.tableDefinition);

			const collectionEntity = this.contextObjectPath.convertedTypes.resolvePath(this.tableDefinition.annotation.collection)
				.target as EntitySet | NavigationProperty;
			const entityType = (collectionEntity as EntitySet)?.entityType ?? (collectionEntity as NavigationProperty)?.targetType;
			this.entityTypeFullyQualifiedName = entityType?.fullyQualifiedName;

			const handlerProvider = new TableEventHandlerProvider(this, { metaModel, collectionEntity }, this);
			this.content = this.createMDCTable({
				appComponent: owner.getAppComponent(),
				metaPath: metaPathContext,
				convertedMetadata: MetaModelConverter.convertTypes(metaModel),
				handlerProvider,
				metaModel
			});
		}
		this.updateFilterBar();
		this.setupOptimisticBatch();
		this.setUpNoDataInformation();
		this.getQuickFilter()?.setMetaPath(fullMetaPath);
	}

	private createMDCTable(parameters: MdcTableTemplate.TableTemplatingParameters): MDCTable {
		return MdcTableTemplate.getMDCTableTemplate(this, parameters);
	}

	private updatePropertiesFromTableDefinition(): void {
		// ID for the internal MDC table
		if (ManagedObjectMetadata.isGeneratedId(this.getId())) {
			this.contentId ??= this.tableDefinition.annotation.id;
		} else {
			this.contentId ??= `${this.getId()}-content`;
		}

		// Basic search field if no filter bar is provided
		if (this.useBasicSearch === undefined) {
			// If no filterbar is provided, use the basic search field
			if (!this.filterBar) {
				this.filterBar = generate([this.contentId, "StandardAction", "BasicSearch"]);
				this.useBasicSearch = true;
			} else {
				this.useBasicSearch = false;
			}
		}

		// Read-only mode
		if (
			this.readOnly === undefined &&
			(this.tableDefinition.annotation.displayMode === true || this.tableDefinition.control.readOnly === true)
		) {
			this.readOnly = true;
		}

		// Enable empty rows
		if (this.emptyRowsEnabled === undefined) {
			const enabled =
				this.creationMode?.name === CreationMode.InlineCreationRows
					? this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.enabled
					: undefined;
			if (enabled !== undefined && enabled !== "false") {
				this.setProperty("emptyRowsEnabled", enabled);
			}
		}
	}

	getNoDataMessageMode(): string {
		const mode = this.modeForNoDataMessage ?? this.tableDefinition.control.modeForNoDataMessage ?? "illustratedMessage-Auto";
		return mode === "text" ? "text" : mode.split("-")[1];
	}
}

export default TableAPI;

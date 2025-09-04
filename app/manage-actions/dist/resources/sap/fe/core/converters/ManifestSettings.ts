import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { FormElementType } from "sap/fe/core/converters/controls/Common/Form";
import type { AnalyticalConfiguration } from "sap/fe/core/converters/controls/Common/Table";
import type { FlexSettings, HeaderFacetType } from "sap/fe/core/converters/controls/ObjectPage/HeaderFacet";
import type { FieldEditStyle } from "sap/fe/macros/field/FieldFormatOptions";
import type Control from "sap/ui/core/Control";
import type { ManifestContent } from "sap/ui/core/Manifest";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type { TableRowCountMode, TableType } from "./controls/Common/Table";
import type { ColumnExportSettings } from "./controls/Common/table/Columns";
import type { ConfigurableRecord, Position, Positionable } from "./helpers/ConfigurableObject";

// ENUMS

export enum TemplateType {
	ListReport = "ListReport",
	ObjectPage = "ObjectPage",
	AnalyticalListPage = "AnalyticalListPage",
	FreeStylePage = "None"
}

export enum ActionType {
	DataFieldForAction = "ForAction",
	DataFieldForIntentBasedNavigation = "ForNavigation",
	Default = "Default",
	Primary = "Primary",
	Secondary = "Secondary",
	SwitchToActiveObject = "SwitchToActiveObject",
	SwitchToDraftObject = "SwitchToDraftObject",
	DraftActions = "DraftActions",
	CollaborationAvatars = "CollaborationAvatars",
	DefaultApply = "DefaultApply",
	Menu = "Menu",
	ShowFormDetails = "ShowFormDetails",
	Copy = "Copy",
	Cut = "Cut",
	/** This type denotes standard actions like "Create" and "Delete" */
	Standard = "Standard",
	CreateNext = "CreateNext"
}

export enum SelectionMode {
	Auto = "Auto",
	None = "None",
	Multi = "Multi",
	Single = "Single",
	ForceMulti = "ForceMulti",
	ForceSingle = "ForceSingle"
}

export enum VariantManagementType {
	Page = "Page",
	Control = "Control",
	None = "None"
}

export enum CreationMode {
	NewPage = "NewPage",
	Sync = "Sync",
	Async = "Async",
	Deferred = "Deferred",
	Inline = "Inline",
	CreationRow = "CreationRow",
	InlineCreationRows = "InlineCreationRows",
	External = "External",
	CreationDialog = "CreationDialog"
}

export enum VisualizationType {
	Table = "Table",
	Chart = "Chart"
}

export enum OperationGroupingMode {
	ChangeSet = "ChangeSet",
	Isolated = "Isolated"
}

// Table
export type AvailabilityType = "Default" | "Adaptation" | "Hidden";
export enum Importance {
	High = "High",
	Medium = "Medium",
	Low = "Low",
	None = "None"
}

export enum HorizontalAlign {
	End = "End",
	Begin = "Begin",
	Center = "Center"
}

// TYPES

export type ContentDensitiesType = {
	compact?: boolean;
	cozy?: boolean;
};

export type ManifestSideContent = {
	template: string;
	equalSplit?: boolean;
};

/**
 * Configuration of a KPI in the manifest
 */
export type AnalyticalKPIConfiguration = {
	model?: string;
	entitySet?: string;
	contextPath?: string;
	qualifier: string;
	detailNavigation?: string;
};

export type HiddenDraft = {
	enabled: boolean;
	stayOnCurrentPageAfterSave?: boolean;
	stayOnCurrentPageAfterCancel?: boolean;
	hideCreateNext?: boolean;
};

export type CustomKPIConfiguration = {
	template: string;
};
export type KPIConfiguration = CustomKPIConfiguration | AnalyticalKPIConfiguration;
export type MicroChartManifestConfiguration = {
	requestGroupId?: string;
	navigation: {
		targetOutbound: {
			outbound: string;
		};
		targetSections: string[];
	};
};
export type ControlConfiguration = {
	[annotationPath: string]: ControlManifestConfiguration;
} & {
	"@com.sap.vocabularies.UI.v1.LineItem"?: TableManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.Chart"?: ChartManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.Facets"?: FacetsControlConfiguration;
	"@com.sap.vocabularies.UI.v1.HeaderFacets"?: HeaderFacetsControlConfiguration;
	"@com.sap.vocabularies.UI.v1.SelectionFields"?: FilterManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.MicroChart"?: MicroChartManifestConfiguration;
};

/**
 * @typedef BaseManifestSettings
 */
export type BaseManifestSettings = {
	content?: {
		header?: {
			facets?: ConfigurableRecord<ManifestHeaderFacet>;
			actions?: ConfigurableRecord<ManifestAction>;
			customHeader?: {
				expandedHeaderFragment: string;
				collapsedHeaderFragment: string;
			};
		};
		footer?: {
			actions?: ConfigurableRecord<ManifestAction>;
		};
	};
	controlConfiguration?: ControlConfiguration;
	converterType: TemplateType;
	entitySet?: string;
	navigation?: {
		[navigationPath: string]: NavigationSettingsConfiguration;
	};
	viewLevel?: number;
	fclEnabled?: boolean;
	contextPath?: string;
	variantManagement?: VariantManagementType;
	defaultTemplateAnnotationPath?: string;
	contentDensities?: ContentDensitiesType;
	shellContentDensity?: string;
	isDesktop?: boolean;
	isPhone?: boolean;
	enableLazyLoading?: boolean;
	sapFeManifestConfiguration?: ManifestContent["sap.fe"];
	inlineEdit?: InlineEditConfiguration;
};

export type InlineEditConfiguration = {
	enabledFields?: string[];
	disabledFields?: string[];
	connectedFields?: (string | string[])[];
};

export type NavigationTargetConfiguration = {
	outbound?: string;
	outboundDetail?: {
		semanticObject: string;
		action: string;
		parameters?: unknown;
	};
	route?: string;
};

/**
 * @typedef NavigationSettingsConfiguration
 */
export type NavigationSettingsConfiguration = {
	create?: NavigationTargetConfiguration;
	detail?: NavigationTargetConfiguration;
	display?: {
		outbound?: string;
		target?: string; // for compatibility
		route?: string;
	};
};

type HeaderFacetsControlConfiguration = {
	facets: ConfigurableRecord<ManifestHeaderFacet>;
};

type FacetsControlConfiguration = {
	sections: ConfigurableRecord<ManifestSection>;
};

type ManifestFormElement = Positionable &
	FieldManifestOverrides & {
		type: FormElementType;
		template: string;
		label?: string;
		property?: string;
		formatOptions?: FormatOptionsType;
	};

export type FormManifestConfiguration = {
	fields: ConfigurableRecord<ManifestFormElement>;
	actions?: ConfigurableRecord<ManifestAction>;
};

export type ControlManifestConfiguration =
	| TableManifestConfiguration
	| ChartManifestConfiguration
	| FacetsControlConfiguration
	| HeaderFacetsControlConfiguration
	| FormManifestConfiguration
	| FilterManifestConfiguration;

/** Object Page */
export type TransportSelectionDefinition = {
	transportRequestProperty: string;
	selectTransportAction: string;
};

export type ObjectPageManifestSettings = BaseManifestSettings & {
	content?: {
		header?: {
			visible?: boolean;
			anchorBarVisible?: boolean;
			facets?: ConfigurableRecord<ManifestHeaderFacet>;
		};
		body?: {
			sections?: ConfigurableRecord<ManifestSection>;
		};
		transportSelection?: TransportSelectionDefinition;
	};
	editableHeaderContent?: boolean;
	sectionLayout?: "Tabs" | "Page";
	useTextForNoDataMessages?: boolean;
	openInEditMode?: boolean;
};

/**
 * @typedef ManifestHeaderFacet
 */
export type ManifestHeaderFacet = {
	type?: HeaderFacetType;
	name?: string;
	template?: string;
	position?: Position;
	visible?: CompiledBindingToolkitExpression;
	title?: string;
	subTitle?: string;
	stashed?: boolean;
	flexSettings?: FlexSettings;
	requestGroupId?: string;
	templateEdit?: string;
};

/**
 * @typedef ManifestSection
 */
export type ManifestSection = {
	title?: string;
	id?: string;
	name?: string;
	visible?: CompiledBindingToolkitExpression;
	position?: Position;
	template?: string;
	subSections?: Record<string, ManifestSubSection>;
	actions?: Record<string, ManifestAction>;
	useSingleTextAreaFieldAsNotes?: boolean;
	onSectionLoaded?: string;
	applyState?: string;
	retrieveState?: string;
};

export type ManifestSubSection = {
	id?: string;
	name?: string;
	template?: string;
	title?: string;
	position?: Position;
	visible?: CompiledBindingToolkitExpression;
	actions?: Record<string, ManifestAction>;
	sideContent?: ManifestSideContent;
	enableLazyLoading?: boolean;
	embeddedComponent?: ManifestReuseComponentSettings;
	applyState?: string;
	retrieveState?: string;
};

export type ManifestReuseComponentSettings = {
	name: string;
	settings?: unknown;
};

/** List Report */
export type ListReportManifestSettings = BaseManifestSettings & {
	stickyMultiTabHeader?: boolean;
	initialLoad?: boolean;
	views?: MultipleViewsConfiguration;
	keyPerformanceIndicators?: {
		[kpiName: string]: KPIConfiguration;
	};
	hideFilterBar?: boolean;
	useHiddenFilterBar?: boolean;
};

export type ViewPathConfiguration = SingleViewPathConfiguration | CombinedViewPathConfiguration;

export type ViewConfiguration = ViewPathConfiguration | CustomViewTemplateConfiguration;

export type CustomViewTemplateConfiguration = {
	key?: string;
	label: string;
	template: string;
	visible?: string;
};

export type SingleViewPathConfiguration = {
	keepPreviousPersonalization?: boolean;
	key?: string;
	entitySet?: string;
	annotationPath: string;
	contextPath?: string;
	visible?: string;
};

export type CombinedViewDefaultPath = "both" | "primary" | "secondary";

export type CombinedViewPathConfiguration = {
	primary: SingleViewPathConfiguration[];
	secondary: SingleViewPathConfiguration[];
	defaultPath?: CombinedViewDefaultPath;
	key?: string;
	visible?: string;
	annotationPath?: string;
};

/**
 * @typedef MultipleViewsConfiguration
 */
export type MultipleViewsConfiguration = {
	paths: ViewConfiguration[];
	showCounts?: boolean;
};

/** Filter Configuration */

/** @typedef FilterManifestConfiguration */
export type FilterManifestConfiguration = {
	filterFields?: Record<string, FilterFieldManifestConfiguration>;
	navigationProperties?: string[];
	useSemanticDateRange?: boolean;
	showClearButton?: boolean;
	initialLayout?: string;
	layout?: string;
};

export type FilterFieldManifestConfiguration = Positionable & {
	type?: string;
	label?: string;
	template?: string;
	availability?: AvailabilityType;
	settings?: FilterSettings;
	visualFilter?: visualFilterConfiguration;
	required?: boolean;
	slotName?: string;
	property?: string;
};

export type visualFilterConfiguration = {
	valueList?: string;
};

export type OperatorConfiguration = {
	path: string;
	equals?: string;
	contains?: string;
	exclude: boolean;
};

export type DefaultOperator = {
	operator: string;
};

export type FilterSettings = {
	operatorConfiguration?: OperatorConfiguration[];
	defaultValues?: DefaultOperator[];
	isCustomFilter?: boolean;
};

/** Chart Configuration */

export type ChartPersonalizationManifestSettings =
	| boolean
	| string
	| {
			sort: boolean;
			type: boolean;
			item: boolean;
			filter: boolean;
	  };

export type ChartManifestConfiguration = {
	chartSettings?: {
		personalization?: ChartPersonalizationManifestSettings;
		header?: string;
		headerVisible?: boolean;
		selectionMode?: "Multiple" | "None" | "Single";
	};
	actions?: Record<string, ManifestAction>;
	enableAddCardToInsights?: boolean;
};

export type ActionAfterExecutionConfiguration = {
	navigateToInstance?: boolean;
	enableAutoScroll?: boolean;
};

/** Table Configuration */

/**
 * @typedef ManifestAction
 */
export type ManifestAction = {
	defaultAction?: string;
	menu?: string[];
	visible?: string | boolean;
	enabled?: string | boolean;
	position?: Position;
	press?: string;
	text?: string;
	__noWrap?: boolean;
	enableOnSelect?: string;
	defaultValuesFunction?: string;
	requiresSelection?: boolean;
	afterExecution?: ActionAfterExecutionConfiguration;
	inline?: boolean;
	determining?: boolean;
	facetName?: string;
	command?: string | undefined;
	isAIOperation?: boolean | undefined;
};

export type BaseCustomDefinedTableColumn = Positionable & {
	width?: string;
	importance?: Importance;
	horizontalAlign?: HorizontalAlign;
	availability?: AvailabilityType;
	tooltip?: string;
	required?: boolean;
	widthIncludingColumnHeader?: boolean;
	exportSettings?: ColumnExportSettings;
};

// Can be either Custom Column from Manifest or Slot Column from Building Block
export type CustomDefinedTableColumn = BaseCustomDefinedTableColumn & {
	type?: string;
	header: string;
	template: string | Control;
	properties?: string[];
};

// For overwriting Annotation Column properties
export type CustomDefinedTableColumnForOverride = BaseCustomDefinedTableColumn & {
	afterExecution?: ActionAfterExecutionConfiguration;
	settings?: TableColumnSettings;
	formatOptions?: FormatOptionsType;
	showDataFieldsLabel?: boolean;
};

export type TableColumnSettings = {
	microChartSize?: string;
	showMicroChartLabel?: boolean;
};

export type FieldManifestOverrides = {
	readOnly?: boolean;
	semanticObject?: string;
};

/**
 * Collection of format options for multiline text fields on a form or in a table
 */
export type FormatOptionsType = {
	hasDraftIndicator?: boolean;
	hasSituationsIndicator?: boolean;
	textLinesEdit?: number;
	textMaxCharactersDisplay?: number;
	textExpandBehaviorDisplay?: "InPlace" | "Popover";
	textMaxLines?: number;
	fieldGroupName?: string;
	textMaxLength?: number;
	showErrorObjectStatus?: string;
	fieldGroupDraftIndicatorPropertyPath?: string;
	fieldEditStyle?: FieldEditStyle;
	radioButtonsHorizontalLayout?: boolean;
};

export type QuickVariantSelectionConfiguration = {
	paths: { annotationPath: string }[];
	hideTableTitle?: boolean;
	showCounts?: boolean;
};

export type TableManifestConfiguration = {
	tableSettings?: TableManifestSettingsConfiguration;
	actions?: Record<string, ManifestAction>;
	columns?: Record<string, CustomDefinedTableColumn | CustomDefinedTableColumnForOverride>;
};

export type TablePersonalizationConfiguration =
	| boolean
	| {
			sort: boolean;
			column: boolean;
			filter: boolean;
			group: boolean;
			aggregate: boolean;
	  };
export type MassEditConfiguration =
	| boolean
	| Partial<{
			customFragment: string | FormContainer;
			visibleFields: string;
			ignoredFields: string;
			operationGroupingMode: OperationGroupingMode;
			fromInline: boolean;
	  }>;

export type TableManifestSettingsConfiguration = {
	creationMode?: {
		disableAddRowButtonForEmptyData?: boolean;
		customValidationFunction?: string;
		createAtEnd?: boolean;
		createInPlace?: boolean;
		name?: CreationMode;
		creationFields?: string;
		inlineCreationRowCount?: number;
		inlineCreationRowsHiddenInEditMode?: boolean;
		nodeType?: {
			propertyName?: string;
			values?: Record<string, string | { label: string; creationFields?: string }>;
		};
		isCreateEnabled?: string;
		outbound?: string;
	};
	isNodeMovable?: string;
	isNodeCopyable?: string;
	isMoveToPositionAllowed?: string;
	isCopyToPositionAllowed?: string;
	enablePastingOfComputedProperties?: boolean;
	enableExport?: boolean;
	frozenColumnCount?: number;
	widthIncludingColumnHeader?: boolean;
	quickVariantSelection?: QuickVariantSelectionConfiguration;
	personalization?: TablePersonalizationConfiguration;
	/**
	 * Defines how many items in a table can be selected. You have the following options:
	 * => by defining 'None' you can fully disable the list selection
	 * => by defining 'Single' you allow only one item to be selected
	 * => by defining 'Multi' you allow several items to be selected
	 * => by using 'Auto' you leave the default definition 'None', except if there is an action that requires a selection (such as deleting, or IBN)
	 */
	selectionMode?: SelectionMode;
	type?: TableType;
	analyticalConfiguration?: AnalyticalConfiguration;
	rowCountMode?: TableRowCountMode;
	rowCount?: number;
	condensedTableLayout?: boolean;
	selectAll?: boolean;
	selectionLimit?: number;
	ignoredFields?: string;
	isSearchable?: boolean;
	enablePaste?: boolean;
	rowPress?: string;
	readOnly?: boolean;
	disableCopyToClipboard?: boolean;
	enableFullScreen?: boolean;
	enableMassEdit?: MassEditConfiguration;
	enableAddCardToInsights?: boolean;
	hierarchyQualifier?: string;
	selectionChange?: string;
	header?: string;
	headerVisible?: boolean;
	disableRequestCache?: boolean;
	beforeRebindTable?: string;
	exportRequestSize?: number;
	scrollThreshold?: number;
};

export type SideEffectsEventsInteractionType = "Notification" | "Confirmation" | "None";
export type SideEffectsEventsInteractionManifestSetting =
	| SideEffectsEventsInteractionType
	| {
			default?: SideEffectsEventsInteractionType;
			events?: Record<string, SideEffectsEventsInteractionType>;
	  };

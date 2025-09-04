import type { Property } from "@sap-ux/vocabularies-types";
import type { Chart as VocabularyChart } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type ChartChart from "sap/chart/Chart";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, event, implementInterface, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { ChartVisualization } from "sap/fe/core/converters/controls/Common/Chart";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { CollaborationManagerService, WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type Diagnostics from "sap/fe/core/support/Diagnostics";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Action from "sap/fe/macros/chart/Action";
import type ActionGroup from "sap/fe/macros/chart/ActionGroup";
import ChartRuntime from "sap/fe/macros/chart/ChartRuntime";
import ChartUtils from "sap/fe/macros/chart/ChartUtils";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type { ConsumerData } from "sap/fe/macros/controls/section/ISingleSectionContributor";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type { DimensionType, MeasureType, Visualization } from "sap/fe/navigation/PresentationVariant";
import PresentationVariant from "sap/fe/navigation/PresentationVariant";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type { CardManifest } from "sap/insights/CardHelper";
import type MenuItem from "sap/m/MenuItem";
import type { default as Event, default as UI5Event } from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type BaseObject from "sap/ui/base/Object";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import type LayoutData from "sap/ui/core/LayoutData";
import { TitleLevel } from "sap/ui/core/library";
import type MDCChart from "sap/ui/mdc/Chart";
import type ChartDelegate from "sap/ui/mdc/ChartDelegate";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type { AppState, Items, Sorters } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type ModelContext from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { PropertyInfo } from "./DelegateUtil";
import MacroAPI from "./MacroAPI";
import type { ActionOrActionGroup, ChartContextObjectPath, ChartCustomData, CommandAction } from "./chart/MdcChartTemplate";
import { getMdcChartTemplate } from "./chart/MdcChartTemplate";
import PresentationVariantToStateUtilsPV from "./chart/adapter/ChartPvToStateUtils";
import { createChartCardParams } from "./insights/AnalyticalInsightsHelper";
import type { ControlState } from "./insights/CommonInsightsHelper";
import { hasInsightActionEnabled, showGenericErrorMessage } from "./insights/CommonInsightsHelper";
import type { ChartContent, InsightsParams } from "./insights/InsightsService";
import { getCardManifest, showCollaborationManagerCardPreview, showInsightsCardPreview } from "./insights/InsightsService";
import StateHelper from "./mdc/adapter/StateHelper";

export type ChartState = {
	innerChart?: {
		initialState?: {
			items?: { name: string }[];
		};
		fullState?: {
			items?: { name: string }[];
			filter?: object;
		};
	};
	variantManagement?: {
		variantId?: string | null;
	};
} & Record<string, unknown>;
/**
 * Building block used to create a chart based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/chart/chartDefault Overview of Building Blocks}
 * <br>
 * Usually, a contextPath and metaPath is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Chart id="MyChart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
 * </pre>
 * @alias sap.fe.macros.Chart
 * @ignoreInterface sap.fe.macros.controls.section.ISingleSectionContributor
 * @ui5-metamodel
 * @public
 */
@defineUI5Class("sap.fe.macros.Chart", { returnTypes: ["sap.fe.macros.MacroAPI"] })
export default class Chart extends MacroAPI implements ISingleSectionContributor, IViewStateContributor<ChartState> {
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor = true;

	content!: MDCChart;

	@implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor")
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor = true;

	getSectionContentRole(): "provider" | "consumer" {
		return "consumer";
	}

	/**
	 * Implementation of the sendDataToConsumer method which is a part of the ISingleSectionContributor
	 *
	 * Will be called from the sap.fe.macros.controls.Section control when there is a Chart building block rendered within a section
	 * along with the consumerData i.e. section's data such as title and title level which is then applied to the chart using the implementation below accordingly.
	 *
	 */

	sendDataToConsumer(consumerData: ConsumerData): void {
		this.content?.setHeader(consumerData.title);
		this.content?.setHeaderStyle("H4");
		this.content?.setHeaderLevel(consumerData.titleLevel as TitleLevel);
	}

	/**
	 * ID of the chart
	 */
	@property({ type: "string" })
	readonly id!: string;

	/**
	 * Metadata path to the presentation context (UI.Chart with or without a qualifier)
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.Chart",
			"com.sap.vocabularies.UI.v1.PresentationVariant",
			"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"
		]
	})
	readonly metaPath!: string;

	/**
	 * Metadata path to the entitySet or navigationProperty
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: []
	})
	readonly contextPath!: string;

	/**
	 * Specifies the header text that is shown in the chart
	 * @public
	 */
	@property({ type: "string" })
	readonly header!: string;

	/**
	 * Controls if the header text should be shown or not
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	readonly headerVisible!: boolean;

	/**
	 * Defines the selection mode to be used by the chart.
	 *
	 * Allowed values are `None`, `Single` or `Multiple`
	 * @public
	 */
	@property({ type: "string", defaultValue: "Multiple", allowedValues: ["None", "Single", "Multiple"] })
	readonly selectionMode!: string;

	/**
	 * Controls the kind of variant management that should be enabled for the chart.
	 *
	 * Allowed value is `Control`.<br/>
	 * If set with value `Control`, a variant management control is seen within the chart and the chart is linked to this.<br/>
	 * If not set with any value, variant management control is not available for this chart.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Control"] })
	readonly variantManagement!: string;

	/**
	 * Controls which options should be enabled for the chart personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of chart are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 * <br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 * - Sort<br/>
	 * - Type<br/>
	 * - Item<br/>
	 * - Filter<br/>
	 * @public
	 */
	@property({ type: "string", defaultValue: true })
	readonly personalization!: string | boolean;

	/**
	 * Header level of chart
	 * @private
	 */
	@property({ type: "string" })
	readonly headerLevel: TitleLevel = TitleLevel.Auto;

	/**
	 * Chart delegate
	 * @private
	 */
	@property({ type: "object" })
	readonly chartDelegate?: object;

	/**
	 * Used internally for LR and OP
	 * @private
	 */
	@property({ type: "boolean" })
	readonly _applyIdToContent = false;

	/**
	 * No data text
	 * @private
	 */
	@property({ type: "string" })
	readonly noDataText?: string;

	/**
	 * Parameter with drillstack on a drill up/ drill down of the MDC_Chart
	 * @private
	 */
	prevDrillStack: string[] = [];

	_contentId: string | undefined;

	_context!: ModelContext;

	blockActions?: ActionOrActionGroup;

	_blockId?: string;

	_personalization?: string | boolean;

	initialControlState: Record<string, unknown> = {};

	_blockActions!: (MenuItem | ActionToolbarAction | undefined)[];

	chartDefinition!: ChartVisualization;

	navigationPath?: string;

	autoBindOnInit?: boolean;

	vizProperties?: string;

	chartActions?: BaseAction[] = [];

	filter?: string;

	visible?: string;

	draftSupported?: boolean;

	headerStyle?: TitleLevel;

	useCondensedLayout!: boolean;

	_metaPathContext!: ModelContext;

	_customData!: ChartCustomData;

	_chartContext!: ModelContext;

	_chartType: string | undefined;

	_chart!: VocabularyChart;

	_metaModel!: ODataMetaModel;

	measures?: ModelContext;

	_sortConditions: object | undefined;

	_commandActions: CommandAction[] = [];

	fireVariantSelected?: Function;

	fireVariantSaved?: Function;

	fireSegmentedButtonPressed?: Function;

	_resolvedContextPath?: string;

	/**
	 * Id of the FilterBar building block associated with the chart.
	 * @public
	 */
	@association({ type: "sap.ui.core.Control" })
	filterBar?: string;

	@aggregation({
		type: "sap.ui.core.LayoutData"
	})
	layoutData!: LayoutData;

	/**
	 * Aggregate actions of the chart.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.chart.Action",
		altTypes: ["sap.fe.macros.chart.ActionGroup"],
		multiple: true,
		defaultClass: Action
	})
	actions!: Action[] | ActionGroup[];

	/**
	 * Gets contexts from the chart that have been selected by the user.
	 * @returns Contexts of the rows selected by the user
	 * @public
	 */
	getSelectedContexts(): Context[] {
		return this.content?.getBindingContext("internal")?.getProperty("selectedContexts") || [];
	}

	/**
	 * An event triggered when chart selections are changed. The event contains information about the data selected/deselected and the Boolean flag that indicates whether data is selected or deselected.
	 * @public
	 */
	@event()
	selectionChange!: Function;

	/**
	 * An event triggered when the chart requests data.
	 * @private
	 */
	@event()
	internalDataRequested!: Function;

	/**
	 * Event triggered when chart's variant is selected.
	 * @private
	 */
	@event()
	variantSelected?: Function;

	/**
	 * Event triggered when chart's variant is saved.
	 * @private
	 */
	@event()
	variantSaved?: Function;

	/**
	 * Event triggered when chart's segmented button i.e., mode between table, chart and chart with table view is selected
	 * @private
	 */
	@event()
	segmentedButtonPressed!: Function;

	constructor(settings?: PropertiesOf<Chart>, others?: $ControlSettings) {
		if (settings?._applyIdToContent) {
			settings.id = generate([settings.id, "::Chart"]);
		}
		super(settings, others);
	}

	/**
	 * Function is overridden to ensure backward incompatibility
	 * @override
	 */
	isA<T extends BaseObject = BaseObject>(typeName: string | string[]): this is T;

	isA<T>(typeName?: string | string[]): this is T;

	isA(typeName: string | string[]): boolean {
		const oldValidType = "sap.fe.macros.chart.ChartAPI";
		if ((Array.isArray(typeName) && typeName.includes(oldValidType)) || typeName === oldValidType) return true;

		return super.isA(typeName);
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	onAfterRendering(afterRenderingEvent: JQuery.Event): void {
		const view = this.getPageController()?.getView();
		const internalModelContext: InternalModelContext = view?.getBindingContext("internal") as InternalModelContext;
		const chart = this.getContent() as Chart;
		const showMessageStrip: Record<string, boolean> = internalModelContext?.getProperty("controls/showMessageStrip") || {};
		const sChartEntityPath = chart.data("entitySet"),
			sCacheKey = `${sChartEntityPath}Chart`,
			oBindingContext = view?.getBindingContext();
		showMessageStrip[sCacheKey] =
			chart.data("draftSupported") === "true" && !!oBindingContext && !oBindingContext.getObject("IsActiveEntity");
		internalModelContext.setProperty("controls/showMessageStrip", showMessageStrip);
		this.attachStateChangeHandler();

		super.onAfterRendering(afterRenderingEvent);
	}

	private attachStateChangeHandler(): void {
		StateUtil.detachStateChange(this.stateChangeHandler);
		StateUtil.attachStateChange(this.stateChangeHandler);
	}

	stateChangeHandler(oEvent: Event<{ control: Control }>): void {
		const control = oEvent.getParameter("control");
		if (control.isA<Chart>("sap.ui.mdc.Chart")) {
			const chartBlock = control.getParent() as unknown as { handleStateChange?: Function };
			if (chartBlock?.handleStateChange) {
				chartBlock.handleStateChange();
			}
		}
	}

	refreshNotApplicableFields(oFilterControl: Control): string[] {
		const oChart = this.getContent();
		return FilterUtils.getNotApplicableFilters(oFilterControl as FilterBar, oChart!);
	}

	@xmlEventHandler()
	handleSelectionChange(oEvent: UI5Event<{ data: unknown[]; name: string }>): void {
		const aData = oEvent.getParameter("data");
		const bSelected = oEvent.getParameter("name") === "selectData";
		ChartRuntime.fnUpdateChart(oEvent);
		this.fireEvent("selectionChange", merge({}, { data: aData, selected: bSelected }));
	}

	@xmlEventHandler()
	onInternalDataRequested(): void {
		this.fireEvent("internalDataRequested");
	}

	@controllerExtensionHandler("collaborationManager", "collectAvailableCards")
	async collectAvailableCards(cards: WrappedCard[]): Promise<void> {
		const actionToolbarItems = this.content.getActions() as ActionToolbarAction[];
		if (hasInsightActionEnabled(actionToolbarItems, this.content.getFilter())) {
			const card = await this.getCardManifestChart();
			if (Object.keys(card).length > 0) {
				cards.push({
					card: card,
					title: this.getChartControl().getHeader(),
					callback: this.onAddCardToCollaborationManagerCallback.bind(this)
				});
			}
		}
	}

	hasSelections(): boolean {
		// consider chart selections in the current drill stack or on any further drill downs
		const mdcChart = this.content as unknown as MDCChart;
		if (mdcChart) {
			try {
				const chart = (mdcChart.getControlDelegate() as unknown as ChartDelegate)?.getInnerChart(mdcChart) as ChartChart;
				if (chart) {
					const aDimensions = ChartUtils.getDimensionsFromDrillStack(chart);
					const bIsDrillDown = aDimensions.length > this.prevDrillStack.length;
					const bIsDrillUp = aDimensions.length < this.prevDrillStack.length;
					const bNoChange = aDimensions.toString() === this.prevDrillStack.toString();
					let aFilters: Filter[];
					if (bIsDrillUp && aDimensions.length === 1) {
						// drilling up to level0 would clear all selections
						aFilters = ChartUtils.getChartSelections(mdcChart, true) as Filter[];
					} else {
						// apply filters of selections of previous drillstack when drilling up/down
						// to the chart and table
						aFilters = ChartUtils.getChartSelections(mdcChart) as Filter[];
					}
					if (bIsDrillDown || bIsDrillUp) {
						// update the drillstack on a drill up/ drill down
						this.prevDrillStack = aDimensions;
						return aFilters.length > 0;
					} else if (bNoChange) {
						// bNoChange is true when chart is selected
						return aFilters.length > 0;
					}
				}
			} catch (err: unknown) {
				Log.error(`Error while checking for selections in Chart: ${err}`);
			}
		}
		return false;
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for charts.
	 * @returns Undefined if card preview is rendered.
	 */
	async onAddCardToInsightsPressed(): Promise<void> {
		try {
			const insightsParams = await createChartCardParams(this);
			if (insightsParams) {
				showInsightsCardPreview(insightsParams);
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	/**
	 * Gets the card manifest optimized for the chart case.
	 * @returns Promise of CardManifest
	 */
	private async getCardManifestChart(): Promise<CardManifest> {
		const insightsParams = await createChartCardParams(this);
		return getCardManifest(insightsParams as InsightsParams<ChartContent>);
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 * @param card The card manifest to be used for the callback
	 * @returns Undefined if card preview is rendered.
	 */
	async onAddCardToCollaborationManagerCallback(card: CardManifest): Promise<void> {
		try {
			if (card) {
				await showCollaborationManagerCardPreview(
					card,
					this.getPageController()?.collaborationManager.getService() as CollaborationManagerService
				);
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	/**
	 * Gets the filters related to the chart.
	 * @returns  The filter configured on the chart or undefined if none
	 */
	getFilter(): Filter | undefined {
		const chartFilterInfo = ChartUtils.getAllFilterInfo(this.content as unknown as MDCChart);
		if (chartFilterInfo.filters.length) {
			chartFilterInfo.filters.forEach((filter) => {
				if (filter.getPath()) {
					(filter as unknown as { sPath: string }).sPath = this.getChartPropertiesWithoutPrefixes(filter.getPath()!);
				}
			});
			return new Filter({ filters: chartFilterInfo.filters, and: true });
		}
		return undefined;
	}

	/**
	 * Gets the chart control from the Chart API.
	 * @returns The Chart control inside the Chart API
	 */
	getChartControl(): MDCChart {
		return this.content;
	}

	/**
	 * Gets the datamodel object path for the dimension.
	 * @param propertyName  Name of the dimension
	 * @returns The datamodel object path for the dimension
	 */

	getPropertyDataModel(propertyName: string): DataModelObjectPath<Property> | null {
		const metaPath = this.content.data("targetCollectionPath") as string;
		const metaModel = (this.content.getModel() as ODataModel).getMetaModel();
		const dimensionContext = metaModel.createBindingContext(`${metaPath}/${propertyName}`) as Context;
		return getInvolvedDataModelObjects<Property>(dimensionContext);
	}

	/**
	 * This function returns an array of chart properties by removing _fe_groupable and _fe_aggregatable prefix.
	 * @param {Array} aProperties Chart filter properties
	 * @returns Chart properties without prefixes
	 */

	getChartPropertiesWithoutPrefixes(chartProperty: string): string {
		if (chartProperty && chartProperty.includes("fe_groupable")) {
			chartProperty = this.getInternalChartNameFromPropertyNameAndKind(chartProperty, "groupable");
		} else if (chartProperty && chartProperty.includes("fe_aggregatable")) {
			chartProperty = this.getInternalChartNameFromPropertyNameAndKind(chartProperty, "aggregatable");
		}
		return chartProperty;
	}

	/**
	 * This function returns an ID which should be used in the internal chart for the measure or dimension.
	 * @param name ID of the property
	 * @param kind Type of the property (measure or dimension)
	 * @returns Internal ID for the sap.chart.Chart
	 */

	getInternalChartNameFromPropertyNameAndKind(name: string, kind: string): string {
		return name.replace("_fe_" + kind + "_", "");
	}

	/**
	 * This function converts the chart's stateUtil  to Chart Presentation Variant.
	 * @param chartState Chart AppState util PV
	 * @returns Presentation Variant structure for the chart
	 */
	_convertStateUtilToPresentationVariant(chartState: AppState): PresentationVariant {
		const sortOrder = chartState.sorters?.map((sorter: Sorters) => {
			return {
				Property: this.getChartPropertiesWithoutPrefixes(sorter.name),
				Descending: sorter.descending
			};
		});
		const type = chartState.supplementaryConfig?.properties?.chartType;
		const chartTypeInRequiredFormat = type ? type.charAt(0).toUpperCase() + type.slice(1) : undefined;
		const chartType = "com.sap.vocabularies.UI.v1.ChartType/" + chartTypeInRequiredFormat;
		const dimensions: string[] = [],
			measures: string[] = [],
			dimensionAttributes: DimensionType[] = [],
			measureAttributes: MeasureType[] = [];
		(chartState.items ?? []).forEach((item: Items) => {
			item.name = this.getChartPropertiesWithoutPrefixes(item.name);
			const role = item.role?.length
				? item.role.substring(0, 1).toUpperCase() + item.role?.substring(1, item.role.length)
				: undefined;
			if (item.role === "category" || item.role === "series" || item.role === "category2") {
				dimensions.push(item.name);
				dimensionAttributes.push({
					Dimension: item.name,
					Role: `com.sap.vocabularies.UI.v1.ChartDimensionRoleType/${role}`
				});
			} else {
				measures.push(item.name);
				measureAttributes.push({ Measure: item.name, Role: "com.sap.vocabularies.UI.v1.ChartDimensionRoleType/" + role });
			}
		});

		const chartViz: Visualization = {
			Content: {
				ChartType: chartType,
				DimensionAttributes: dimensionAttributes,
				Dimensions: dimensions,
				MeasureAttributes: measureAttributes,
				Measures: measures
			},
			Type: "Chart"
		};
		const chartPV = new PresentationVariant();
		chartPV.setChartVisualization(chartViz);
		chartPV.setProperties({
			SortOrder: sortOrder ?? []
		});
		return chartPV;
	}

	/**
	 * Get the presentation variant that is currently applied on the chart.
	 * @returns The presentation variant {@link sap.fe.navigation.PresentationVariant} applied to the chart
	 * @public
	 */

	async getPresentationVariant(): Promise<PresentationVariant> {
		try {
			const chartState = await StateUtil.retrieveExternalState(this.content);
			return this._convertStateUtilToPresentationVariant(chartState);
		} catch (error) {
			const id: string = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Chart Building Block (${id}) - get presentation variant failed : ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Set the presentation variant for the mdc chart.
	 *
	 * The json format retrieved by using the get PresentationVariant button in the linked FPM sample should be followed while trying to set the PresentationVariant as needed.
	 * The values dimensions, measures and other properties should also be given in the valid format and null or empty values should be avoided.
	 * One dimension attribute should have only one role associated with it on a given chart.
	 * @param presentationVariant the presentation variant {@link sap.fe.navigation.PresentationVariant} to be set
	 * @public
	 */

	async setPresentationVariant(presentationVariant: PresentationVariant): Promise<void> {
		try {
			const chart = this.content;
			const existingPresentationVariant = await this.getPresentationVariant();
			const propertiesInfo = (await (chart.getControlDelegate() as ChartDelegate)?.fetchProperties(
				chart
			)) as unknown as PropertyInfo[];

			const stateUtilPv = PresentationVariantToStateUtilsPV.convertPvToStateUtilPv(
				presentationVariant,
				existingPresentationVariant,
				propertiesInfo
			);

			await StateUtil.applyExternalState(chart, stateUtilPv);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE: Chart Building Block setPresentationVariant API failed with error: ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Gets the key of the current variant in the associated variant management.
	 * @returns Variant key of {@link sap.ui.fl.variants.VariantManagement} applied to the chart
	 * @public
	 */
	getCurrentVariantKey(): string | null {
		return this.content.getVariant().getCurrentVariantKey();
	}

	/**
	 * Sets the variant of the provided key in the associated variant management.
	 * @param key The variant key of {@link sap.ui.fl.variants.VariantManagement} to be set
	 * @public
	 */
	setCurrentVariantKey(key: string): void {
		const variantManagement = this.content.getVariant();
		variantManagement.setCurrentVariantKey(key);
	}

	/**
	 * Get the selection variant from the chart. This function considers only the selection variant applied at the control level.
	 * @returns A promise that resolves with {@link sap.fe.navigation.SelectionVariant}.
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		return StateHelper.getSelectionVariant(this.content);
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the chart. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the chart
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the SelectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(selectionVariant: SelectionVariant, prefillDescriptions = false): Promise<unknown> {
		return StateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
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
	 * Sets the initial state of the control by retrieving the external state.
	 * @returns A promise that resolves when the initial state is set.
	 */
	async setInitialState(): Promise<void> {
		try {
			const initialControlState = await StateUtil.retrieveExternalState(this.content);
			this.initialControlState = initialControlState;
		} catch (e: unknown) {
			Log.error(e as string);
		}
	}

	/**
	 * Asynchronously retrieves the state of the chart based on the provided viewstate.
	 * @returns A promise that resolves to the chart state or null if not found.
	 */
	async retrieveState(): Promise<ChartState | null> {
		const chartState: ChartState = {};
		chartState.innerChart = this.getControlState(await StateUtil.retrieveExternalState(this.content)) as object;
		const variantToRetrieve = this.content.getVariant()?.getId();
		if (variantToRetrieve) {
			const variantManagementControl = this.content.getVariant();
			if (!chartState.variantManagement) {
				chartState.variantManagement = { variantId: variantManagementControl?.getCurrentVariantKey() };
			} else {
				chartState.variantManagement.variantId = variantManagementControl?.getCurrentVariantKey();
			}
		}
		return chartState;
	}

	/**
	 * Applies the legacy state to the chart based on the provided control state retrieval function.
	 * @param getControlState Function to retrieve the control state.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Flag indicating whether to apply the diff state.
	 * @returns - A promise that resolves when the state has been applied.
	 */
	async applyLegacyState(
		getControlState: (control: ManagedObject) => ControlState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean
	): Promise<void> {
		const chart = this.content;
		const vm = chart.getVariant();

		const chartState = getControlState(chart) as { initialState?: ChartState; fullState?: ChartState };
		const vmState = vm ? getControlState(vm) : null;

		const controlState: ChartState = {};

		if (chartState) {
			controlState.innerChart = {
				...controlState.innerChart,
				...chartState,
				fullState: {
					...controlState.innerChart?.fullState,
					...chartState.fullState
				},
				initialState: {
					...controlState.innerChart?.initialState,
					...chartState.initialState
				}
			};
		}

		if (vmState?.variantId) {
			controlState.variantManagement = {
				...controlState.variantManagement,
				variantId: vmState.variantId.toString()
			};
		}

		if (controlState && Object.keys(controlState).length > 0) {
			await this.applyState(controlState as ControlState, _navParameters, shouldApplyDiffState);
		}
	}

	/**
	 * Asynchronously applies the provided control state to the viewstate.
	 * @param controlState The state to be applied to the control.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Optional flag to skip merging states.
	 * @returns A promise that resolves when the state has been applied.
	 */
	async applyState(controlState: ChartState, _navParameters?: NavigationParameter, shouldApplyDiffState?: boolean): Promise<void> {
		if (!controlState) return;

		const variantId = controlState.variantManagement?.variantId;
		const currentVariant = this.content?.getVariant();

		// Handle Variant Management
		if (variantId !== undefined && variantId !== currentVariant.getCurrentVariantKey()) {
			const ovM = this.content?.getVariant();
			const aVariants = ovM?.getVariants();
			const sVariantReference = aVariants?.some((oVariant) => oVariant.getKey() === variantId)
				? variantId
				: ovM?.getStandardVariantKey;
			try {
				const ControlVariantApplyAPI = (await import("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
				await ControlVariantApplyAPI.activateVariant({
					element: ovM,
					variantReference: sVariantReference as string
				});
				await this.setInitialState();
			} catch (error: unknown) {
				Log.error(error as string);
				await this.setInitialState();
			}
		} else {
			// we need to update initial state even if above condition not satisfied
			await this.setInitialState();
		}

		// Handle Inner Chart State
		const innerChartState = controlState.innerChart;
		let finalState;

		if (innerChartState) {
			if (shouldApplyDiffState && innerChartState.initialState) {
				finalState = await StateUtil.diffState(
					this.content,
					innerChartState.initialState as object,
					innerChartState.fullState as object
				);
			} else {
				finalState = innerChartState.fullState;
			}
			await StateUtil.applyExternalState(this.content, finalState);
		}
	}

	/**
	 * Called by the MDC state util when the state for this control's child has changed.
	 */
	handleStateChange(): void {
		this.getPageController()?.getExtensionAPI().updateAppState();
	}

	_createContent(): void {
		const owner = this._getOwner();
		if (owner?.isA<TemplateComponent>("sap.fe.core.TemplateComponent")) {
			// We need to remove the current filter from the old (to be destroyed) Chart instance because if we don't then for some strange reason, the old Chart instance used to
			// react for filter bar action, for example, on Click of Go.
			this.content.setFilter("");
			this.content.destroy();
			this.content = this.createContent();
		}
	}

	setProperty(key: string, value: string, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getProperties()).includes(key)) {
			super.setProperty(key, value, true);
			this._createContent();
		} else {
			super.setProperty(key, value, suppressInvalidate);
		}
		return this;
	}

	removeAggregation(name: string, value: ManagedObject | number | string, suppressInvalidate?: boolean): ManagedObject | null {
		let removed: ManagedObject | null;
		if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
			removed = super.removeAggregation(name, value, suppressInvalidate);
			this._createContent();
		} else {
			removed = super.removeAggregation(name, value, suppressInvalidate);
		}
		return removed;
	}

	addAggregation(name: string, value: ManagedObject, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
			super.addAggregation(name, value, suppressInvalidate);
			this._createContent();
		} else {
			super.addAggregation(name, value, suppressInvalidate);
		}
		return this;
	}

	insertAggregation(name: string, value: ManagedObject, index: number, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(name)) {
			super.insertAggregation(name, value, index, suppressInvalidate);
			this._createContent();
		} else {
			super.insertAggregation(name, value, index, suppressInvalidate);
		}
		return this;
	}

	createContent(): MDCChart {
		if (this.contextPath) {
			this._resolvedContextPath = this.contextPath.endsWith("/") ? this.contextPath : this.contextPath + "/";
		}

		return getMdcChartTemplate(
			this,
			this._getOwner()?.getRootController()?.getView().getViewData() ?? (this._getOwner()?.getViewData() as unknown as ViewData),
			this.getAppComponent()?.getDiagnostics() ?? ({} as Diagnostics),
			this.getDataModelObjectForMetaPath<ChartContextObjectPath>(this.metaPath, this._resolvedContextPath)!
		);
	}
}

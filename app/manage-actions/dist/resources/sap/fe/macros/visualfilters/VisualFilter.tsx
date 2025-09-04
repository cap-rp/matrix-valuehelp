import type { AnnotationPath, PathAnnotationExpression } from "@sap-ux/vocabularies-types";
import type { CustomAggregate } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import type { AggregatedProperty, AggregatedPropertyType } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import { SortOrderType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { PropertyAnnotations } from "@sap-ux/vocabularies-types/vocabularies/Edm_Types";
import type { PropertyAnnotations_Measures } from "@sap-ux/vocabularies-types/vocabularies/Measures_Edm";
import type { Chart, DataPoint, LineItem, PresentationVariant, SelectionVariant } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import { defineUI5Class, event, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import { BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { getDefaultSelectionVariant } from "sap/fe/core/converters/controls/Common/DataVisualization";
import type { ParameterType } from "sap/fe/core/converters/controls/ListReport/VisualFilters";
import { AggregationHelper } from "sap/fe/core/converters/helpers/Aggregation";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import Diagnostics from "sap/fe/core/support/Diagnostics";
import { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Button from "sap/m/Button";
import Label from "sap/m/Label";
import OverflowToolbar from "sap/m/OverflowToolbar";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import Title from "sap/m/Title";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import { $ControlSettings } from "sap/ui/mdc/Control";
import ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import { default as VisualFilterControl } from "../controls/filterbar/VisualFilter";
import InteractiveChartHelper from "./InteractiveChartHelper";
import VisualFilterRuntime from "./VisualFilterRuntime";
import { getVisualFilterChart } from "./fragments/InteractiveCharts";
/**
 * Building block for creating a VisualFilter based on the metadata provided by OData V4.
 * <br>
 * A Chart annotation is required to bring up an interactive chart
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:VisualFilter
 * collection="{entitySet&gt;}"
 * chartAnnotation="{chartAnnotation&gt;}"
 * id="someID"
 * groupId="someGroupID"
 * title="some Title"
 * /&gt;
 * </pre>
 * @private
 * @experimental
 */
@defineUI5Class("sap.fe.macros.visualfilters.VisualFilter")
export default class VisualFilter extends BuildingBlock<VisualFilter> {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@property({
		type: "boolean"
	})
	showValueHelp!: boolean;

	@property({
		type: "string"
	})
	valueHelpIconSrc!: string;

	@event()
	valueHelpRequest!: Function;

	@property({
		type: "string",
		required: true
	})
	id!: string;

	@property({
		type: "string"
	})
	title = "";

	@property({
		type: "string",
		required: true
	})
	public contextPath!: string;

	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	@property({
		type: "string"
	})
	outParameter?: string;

	@property({
		type: "string"
	})
	valuelistProperty?: string;

	@property({
		type: "string"
	})
	selectionVariantAnnotation?: string;

	@property({
		type: "array"
	})
	inParameters?: ParameterType[];

	@property({
		type: "boolean"
	})
	multipleSelectionAllowed?: boolean;

	@property({
		type: "boolean"
	})
	required?: boolean;

	@property({
		type: "boolean"
	})
	showOverlayInitially?: boolean;

	@property({
		type: "boolean"
	})
	renderLineChart?: boolean;

	@property({
		type: "array"
	})
	requiredProperties?: string[];

	@property({
		type: "string"
	})
	filterBarEntityType?: string;

	@property({
		type: "boolean"
	})
	showError?: boolean;

	@property({
		type: "string"
	})
	chartMeasure?: string;

	@property({
		type: "boolean"
	})
	UoMHasCustomAggregate?: boolean;

	@property({
		type: "boolean"
	})
	showValueHelpButton?: boolean;

	@property({
		type: "boolean"
	})
	customAggregate = false;

	@property({
		type: "string"
	})
	groupId = "$auto.visualFilters";

	@property({
		type: "string"
	})
	errorMessageTitle?: string;

	@property({
		type: "string"
	})
	errorMessage?: string;

	@property({
		type: "string"
	})
	_contentId?: string;

	@property({
		type: "boolean"
	})
	draftSupported?: boolean;

	@property({
		type: "boolean"
	})
	isValueListWithFixedValues: boolean | undefined;

	/******************************************************
	 * Internal Properties
	 * ***************************************************/

	aggregateProperties: AggregatedPropertyType | undefined;

	chartType: string | undefined;

	path: string | undefined;

	measureDimensionTitle: string | undefined;

	toolTip: string | undefined;

	UoMVisibility: boolean | undefined;

	scaleUoMTitle: string | undefined;

	filterCountBinding: string | undefined;

	chartAnnotation?: Chart;
	_resolvedContextPath?: string;

	sortOrder?: SortOrderType[];
	collection?: DataModelObjectPath<PageContextPathTarget>;
	selectionVariant: SelectionVariant | undefined;

	constructor(props: $ControlSettings & PropertiesOf<VisualFilterControl>, others?: $ControlSettings) {
		super(props, others);
	}

	public onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		this.groupId = "$auto.visualFilters";
		this.path = this.metaPath;
		const owner = this._getOwner();
		this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
		const contextObjectPath = this.getDataModelObjectForMetaPath<PresentationVariant>(this.metaPath, this.contextPath);
		if (this.contextPath) {
			this._resolvedContextPath = this.contextPath.endsWith("/") ? this.contextPath : this.contextPath + "/";
		}
		const metaModel = this.getMetaModel() as ODataMetaModel;

		const diagnostics = this.getAppComponent()?.getDiagnostics() ?? ({} as Diagnostics);
		const viewData =
			this._getOwner()?.getRootController()?.getView().getViewData() ?? (this._getOwner()?.getViewData() as unknown as ViewData);
		const converterContext = ConverterContext.createConverterContextForMacro(
			contextObjectPath?.startingEntitySet?.name as string,
			metaModel,
			diagnostics,
			merge,
			contextObjectPath?.contextLocation,
			new ManifestWrapper(viewData as BaseManifestSettings, this.getAppComponent())
		);
		const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext);
		const customAggregates = aggregationHelper.getCustomAggregateDefinitions();
		const pvAnnotation = contextObjectPath?.targetObject;
		let measure: string | undefined;
		const visualizations = pvAnnotation && pvAnnotation.Visualizations;
		this.getChartAnnotation(visualizations, converterContext);
		let aggregations: AggregatedPropertyType[] = [],
			custAggMeasure = [];

		if (this.chartAnnotation?.Measures?.length) {
			custAggMeasure = customAggregates.filter((custAgg) => {
				return custAgg.qualifier === this.chartAnnotation?.Measures[0].value;
			});
			measure = custAggMeasure.length > 0 ? custAggMeasure[0].qualifier : this.chartAnnotation.Measures[0].value;
			aggregations = aggregationHelper.getAggregatedProperties()[0];
		}
		// if there are AggregatedProperty objects but no dynamic measures, rather there are transformation aggregates found in measures
		if (
			aggregations &&
			aggregations.length > 0 &&
			!this.chartAnnotation?.DynamicMeasures &&
			custAggMeasure.length === 0 &&
			this.chartAnnotation?.Measures &&
			this.chartAnnotation?.Measures.length > 0
		) {
			Log.warning(
				"The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly."
			);
		}
		//if the chart has dynamic measures, but with no other custom aggregate measures then consider the dynamic measures
		if (this.chartAnnotation?.DynamicMeasures) {
			if (custAggMeasure.length === 0) {
				measure = converterContext
					.getConverterContextFor<AggregatedProperty>(
						converterContext.getAbsoluteAnnotationPath(this.chartAnnotation.DynamicMeasures[0].value)
					)
					.getDataModelObjectPath()
					.targetObject?.Name.toString();
				aggregations = aggregationHelper.getAggregatedProperty();
			} else {
				Log.warning(
					"The dynamic measures have been ignored as visual filters can deal with only 1 measure and the first (custom aggregate) measure defined under Chart.Measures is considered."
				);
			}
		}
		if (
			customAggregates.some(function (custAgg) {
				return custAgg.qualifier === measure;
			})
		) {
			this.customAggregate = true;
		}

		const defaultSelectionVariant = getDefaultSelectionVariant(converterContext.getEntityType());
		this.checkSelectionVariant(defaultSelectionVariant);
		const aggregation = this.getAggregateProperties(aggregations, measure);
		if (aggregation) {
			this.aggregateProperties = aggregation;
		}
		const propertyAnnotations =
			visualizations && this.chartAnnotation?.Measures && this.chartAnnotation?.Measures[0]?.$target?.annotations;
		const aggregatablePropertyAnnotations = aggregation?.AggregatableProperty?.$target?.annotations;
		this.checkIfUOMHasCustomAggregate(customAggregates, propertyAnnotations, aggregatablePropertyAnnotations);
		const propertyHidden = propertyAnnotations?.UI?.Hidden;
		const hiddenMeasure = propertyHidden?.valueOf();
		const chartType = this.chartAnnotation?.ChartType;
		this.chartType = chartType;
		this.showValueHelpButton = this.getshowValueHelpButton(chartType, hiddenMeasure);
		this.draftSupported = ModelHelper.isDraftSupported(metaModel, this.contextPath);
		/**
		 * If the measure of the chart is marked as 'hidden', or if the chart type is invalid, or if the data type for the line chart is invalid,
		 * the call is made to the InteractiveChartWithError fragment (using error-message related APIs, but avoiding batch calls)
		 */
		this.errorMessage = this.getErrorMessage(hiddenMeasure, measure);
		this.chartMeasure = measure;
		this.measureDimensionTitle = InteractiveChartHelper.getMeasureDimensionTitle(
			this.chartAnnotation,
			this.customAggregate,
			this.aggregateProperties
		);
		const collection = this.getDataModelObjectForMetaPath<PageContextPathTarget>(this.contextPath);
		this.toolTip = InteractiveChartHelper.getToolTip(
			this.chartAnnotation,
			collection,
			this.path,
			this.customAggregate,
			this.aggregateProperties,
			this.renderLineChart
		);
		this.UoMVisibility = InteractiveChartHelper.getUoMVisiblity(this.chartAnnotation, this.showError);
		this.scaleUoMTitle = InteractiveChartHelper.getScaleUoMTitle(
			this.chartAnnotation,
			collection,
			this.path,
			this.customAggregate,
			this.aggregateProperties
		);
		this.collection = collection;
		this.sortOrder = pvAnnotation?.SortOrder;
		this.filterCountBinding = InteractiveChartHelper.getfilterCountBinding(this.chartAnnotation);
		const viewId = this.getPageController()?.getView().getId();
		if (this._contentId) {
			this._contentId = `${viewId}--${this._contentId}`;
		}
		this.selectionVariant = this.selectionVariantAnnotation
			? this.getDataModelObjectForMetaPath<SelectionVariant>(this.selectionVariantAnnotation)?.targetObject
			: undefined;
		this.content = this.createContent();
	}

	/**
	 * Check if the UoM has custom aggregate
	 * @param customAggregates - Custom aggregates
	 * @param propertyAnnotations - Property annotations
	 * @param aggregatablePropertyAnnotations - Aggregatable property annotations
	 */
	checkIfUOMHasCustomAggregate(
		customAggregates: Array<CustomAggregate>,
		propertyAnnotations: PropertyAnnotations | undefined,
		aggregatablePropertyAnnotations?: PropertyAnnotations
	): void {
		const measures = propertyAnnotations?.Measures;
		const aggregatablePropertyMeasures = aggregatablePropertyAnnotations?.Measures;
		const UOM = this.getUoM(measures, aggregatablePropertyMeasures);
		if (
			UOM &&
			customAggregates.some(function (custAgg: CustomAggregate) {
				return custAgg.qualifier === UOM;
			})
		) {
			this.UoMHasCustomAggregate = true;
		} else {
			this.UoMHasCustomAggregate = false;
		}
	}

	/**
	 * Get the chart annotation.
	 * @param visualizations Visualizations
	 * @param converterContext Converter context
	 */
	getChartAnnotation(
		visualizations: Array<AnnotationPath<Chart | DataPoint | LineItem>> | undefined,
		converterContext: ConverterContext
	): void {
		if (visualizations) {
			for (let visualization of visualizations) {
				const sAnnotationPath = visualization && visualization.value;
				this.chartAnnotation =
					converterContext.getEntityTypeAnnotation<Chart>(sAnnotationPath) &&
					converterContext.getEntityTypeAnnotation<Chart>(sAnnotationPath).annotation;
			}
		}
	}

	/**
	 * Sets the flag to show or hide the value help for the visual filter.
	 * @param bShowValueHelp Flag indicating whether to show or hide the value help.
	 */
	setShowValueHelp(bShowValueHelp: boolean): void {
		if (this.content?.isA<VisualFilterControl>("sap.fe.macros.controls.filterbar.VisualFilter")) {
			if (this.content?.getItems().length > 0) {
				const oVisualFilterControl = this.getVisualFilterControl();
				oVisualFilterControl?.getContent().some(function (oInnerControl: Control) {
					if (oInnerControl.isA<Button>("sap.m.Button")) {
						oInnerControl.setVisible(bShowValueHelp);
					}
				});
				this.setProperty("showValueHelp", bShowValueHelp);
			}
		}
	}

	/**
	 * Sets the source of the value help icon.
	 * @param sIconSrc The source of the value help icon
	 */
	setValueHelpIconSrc(sIconSrc: string): void {
		if (this.content?.isA<VisualFilterControl>("sap.fe.macros.controls.filterbar.VisualFilter")) {
			if (this.content?.getItems().length > 0) {
				const oVisualFilterControl = this.getVisualFilterControl();
				oVisualFilterControl?.getContent().some(function (oInnerControl: Control) {
					if (oInnerControl.isA<Button>("sap.m.Button")) {
						oInnerControl.setIcon(sIconSrc);
					}
				});
				this.setProperty("valueHelpIconSrc", sIconSrc);
			}
		}
	}

	/**
	 * Retrieves the visual filter control from the content.
	 * @returns The visual filter control or undefined if not found
	 */
	getVisualFilterControl(): OverflowToolbar | undefined {
		if (this.content?.isA<VisualFilterControl>("sap.fe.macros.controls.filterbar.VisualFilter")) {
			return (this.content?.getItems()[0] as VBox).getItems()[0] as OverflowToolbar;
		}
	}

	/**
	 * Retrieves the error message for a hidden measure.
	 * @param hiddenMeasure The hidden measure object
	 * @param measure The measure name
	 * @returns The error message, if any
	 */
	getErrorMessage(hiddenMeasure: Object | undefined, measure?: string): string | undefined {
		let validChartType;
		if (this.chartAnnotation) {
			if (this.chartAnnotation.ChartType === "UI.ChartType/Line" || this.chartAnnotation.ChartType === "UI.ChartType/Bar") {
				validChartType = true;
			} else {
				validChartType = false;
			}
		}
		if ((typeof hiddenMeasure === "boolean" && hiddenMeasure) || !validChartType || this.renderLineChart === false) {
			this.showError = true;
			this.errorMessageTitle =
				hiddenMeasure || !validChartType
					? this.getTranslatedText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE")
					: this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_INVALID_DATATYPE");
			if (hiddenMeasure) {
				return this.getTranslatedText("M_VISUAL_FILTER_HIDDEN_MEASURE", [measure]);
			} else if (!validChartType) {
				return this.getTranslatedText("M_VISUAL_FILTER_UNSUPPORTED_CHART_TYPE");
			} else {
				return this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_UNSUPPORTED_DIMENSION");
			}
		}
	}

	/**
	 * Determines whether to show the value help button for the visual filter.
	 *
	 * @param chartType The type of chart used in the visual filter
	 * @param hiddenMeasure The hidden measure object
	 * @returns A boolean indicating whether to show the value help button
	 */
	getshowValueHelpButton(chartType?: string, hiddenMeasure?: Object): boolean {
		const sDimensionType =
			this.chartAnnotation?.Dimensions[0] &&
			this.chartAnnotation?.Dimensions[0].$target &&
			this.chartAnnotation.Dimensions[0].$target.type;
		if (sDimensionType === "Edm.Date" || sDimensionType === "Edm.Time" || sDimensionType === "Edm.DateTimeOffset") {
			return false;
		} else if (typeof hiddenMeasure === "boolean" && hiddenMeasure) {
			return false;
		} else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
			return false;
		} else if (this.renderLineChart === false && chartType === "UI.ChartType/Line") {
			return false;
		} else if (this.isValueListWithFixedValues === true) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Checks the selection variant for the visual filter.
	 *
	 * @param defaultSelectionVariant The default selection variant to be checked
	 * @returns void
	 */
	checkSelectionVariant(defaultSelectionVariant?: SelectionVariant): void {
		let selectionVariant;
		if (this.selectionVariantAnnotation) {
			selectionVariant = this.getDataModelObjectForMetaPath<SelectionVariant>(this.selectionVariantAnnotation)?.targetObject;
		}
		if (!selectionVariant && defaultSelectionVariant) {
			selectionVariant = defaultSelectionVariant;
		}
		if (selectionVariant && selectionVariant.SelectOptions && !this.multipleSelectionAllowed) {
			for (const selectOption of selectionVariant.SelectOptions) {
				if (selectOption.PropertyName?.value === this.chartAnnotation?.Dimensions[0].value) {
					if (selectOption.Ranges.length > 1) {
						Log.error("Multiple SelectOptions for FilterField having SingleValue Allowed Expression");
					}
				}
			}
		}
	}

	/**
	 * Retrieves the aggregate properties based on the provided aggregations and measure.
	 * @param aggregations The list of aggregated properties
	 * @param measure The optional measure to filter the aggregated properties
	 * @returns The matching aggregated property, if found; otherwise, undefined
	 */
	getAggregateProperties(aggregations: AggregatedPropertyType[], measure?: string): AggregatedPropertyType | undefined {
		let matchedAggregate: AggregatedPropertyType | undefined;
		if (!aggregations) {
			return;
		}
		aggregations.some(function (aggregate) {
			if (aggregate.Name === measure) {
				matchedAggregate = aggregate;
				return true;
			}
		});
		return matchedAggregate;
	}

	/**
	 * Retrieves the unit of measure (UoM) for the visual filter.
	 *
	 * @param measures The measures for the visual filter
	 * @param aggregatablePropertyMeasures The aggregatable property measures for the visual filter
	 * @returns The unit of measure for the visual filter
	 */
	getUoM(measures?: PropertyAnnotations_Measures, aggregatablePropertyMeasures?: PropertyAnnotations_Measures): string {
		let ISOCurrency = measures?.ISOCurrency;
		let unit = measures?.Unit;
		if (!ISOCurrency && !unit && aggregatablePropertyMeasures) {
			ISOCurrency = aggregatablePropertyMeasures.ISOCurrency;
			unit = aggregatablePropertyMeasures.Unit;
		}
		return (
			(ISOCurrency as unknown as PathAnnotationExpression<string>)?.path ||
			(unit as unknown as PathAnnotationExpression<string>)?.path
		);
	}

	getRequired(): string {
		if (this.required) {
			return (
				<Label text="" width="0.5rem" required="true">
					{{
						layoutData: <OverflowToolbarLayoutData priority="Never" />
					}}
				</Label>
			);
		} else {
			return "";
		}
	}

	getTitle(): string {
		return (
			<Title
				id={generate([this._contentId, "MeasureDimensionTitle"])}
				text={this.measureDimensionTitle}
				tooltip={this.toolTip}
				titleStyle="H6"
				level="H3"
				class="sapUiTinyMarginEnd sapUiNoMarginBegin"
			></Title>
		);
	}

	getUoMTitle(showErrorExpression: string): string {
		if (this.UoMVisibility) {
			return (
				<Title
					id={generate([this._contentId, "ScaleUoMTitle"])}
					visible={showErrorExpression}
					text={this.scaleUoMTitle}
					titleStyle="H6"
					level="H3"
					width="4.15rem"
				></Title>
			);
		} else {
			return "";
		}
	}

	getToolBarSpacer(): string {
		if (this.showValueHelpButton) {
			return <ToolbarSpacer></ToolbarSpacer>;
		} else {
			return "";
		}
	}

	getValueHelp(showErrorExpression: string): string {
		if (this.showValueHelpButton) {
			return (
				<Button
					id={generate([this._contentId, "VisualFilterValueHelpButton"])}
					type="Transparent"
					ariaHasPopup="Dialog"
					text={this.filterCountBinding}
					enabled={showErrorExpression}
					press={(event): void => {
						VisualFilterRuntime.fireValueHelp(event);
					}}
				>
					{{
						layoutData: <OverflowToolbarLayoutData priority="Never" />,
						customData: <CustomData key={"multipleSelectionAllowed"} value={this.multipleSelectionAllowed} />
					}}
				</Button>
			);
		} else {
			return "";
		}
	}

	getToolbar(showErrorExpression: string): OverflowToolbar | undefined {
		return (
			<OverflowToolbar style="Clear">
				{{
					content: (
						<>
							{this.getRequired()}
							{this.getTitle()}
							{this.getUoMTitle(showErrorExpression)}
							{this.getToolBarSpacer()}
							{this.getValueHelp(showErrorExpression)}
						</>
					)
				}}
			</OverflowToolbar>
		);
	}

	createContent(): VisualFilter {
		const id = generate([this.path]);
		const showErrorExpression = "{= !${internal>" + id + "/showError}}";
		const cozyMode = document.body.classList.contains("sapUiSizeCozy");
		const overallHeight = cozyMode ? "13rem" : "100%";
		const chartHeight = cozyMode ? "100%" : "7.5rem";
		const vfControlId = this._contentId ? generate([this._contentId]) : undefined;
		return (
			<VisualFilterControl id={vfControlId} height={overallHeight} width="20.5rem" class="sapUiSmallMarginBeginEnd">
				{{
					customData: <CustomData key={"infoPath"} value={generate([this.path])} />,
					items: (
						<>
							<VBox height="2rem" class="sapUiTinyMarginTopBottom">
								{this.getToolbar(showErrorExpression)}
							</VBox>
							<VBox height={chartHeight} width="100%">
								{getVisualFilterChart(this)}
							</VBox>
						</>
					)
				}}
			</VisualFilterControl>
		);
	}
}

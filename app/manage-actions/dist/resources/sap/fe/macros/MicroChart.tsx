import type { PathAnnotationExpression, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import type { Measure } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import type { SortOrderType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { PropertyAnnotations } from "@sap-ux/vocabularies-types/vocabularies/Edm_Types";
import type { DataPoint, DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { ChartType, UIAnnotationTerms, type Chart, type PresentationVariant } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { compileExpression, constant, equal, getExpressionFromAnnotation, ifElse, not, or, pathInModel } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import * as ID from "sap/fe/core/helpers/StableIdHelper";
import { buildExpressionForCriticalityColorMicroChart } from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getTargetNavigationPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getExpressionForMeasureUnit } from "sap/fe/core/templating/UIFormatters";
import Text from "sap/m/Text";
import type { $ColumnMicroChartSettings } from "sap/suite/ui/microchart/ColumnMicroChart";
import type { $ComparisonMicroChartSettings } from "sap/suite/ui/microchart/ComparisonMicroChart";
import type { $LineMicroChartSettings } from "sap/suite/ui/microchart/LineMicroChart";
import type { $StackedBarMicroChartSettings } from "sap/suite/ui/microchart/StackedBarMicroChart";
import type { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import type Context from "sap/ui/model/odata/v4/Context";
import CommonHelper from "./CommonHelper";
import ConditionalWrapper from "./controls/ConditionalWrapper";
import TitleLink from "./internal/TitleLink";
import MicroChartContainer from "./microchart/MicroChartContainer";
import type { MicroChartAggregation, MicroChartSettings } from "./microchart/MicroChartHelper";
import MicroChartHelper from "./microchart/MicroChartHelper";

type ErrorObjectType = {
	DataPoint_Value?: unknown;
};

enum NavigationType {
	/**
	 * For External Navigation
	 */
	External = "External",

	/**
	 * For In-Page Navigation
	 */
	InPage = "InPage",

	/**
	 * For No Navigation
	 */
	None = "None"
}

/**
 * Building block used to create a MicroChart based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/microchart/ Overview of Micro Chart Building Block}
 * <br>
 * Usually, a contextPath and metaPath is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:MicroChart id="MyMicroChart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
 * </pre>
 *  <pre>
 * sap.ui.require(["sap/fe/macros/MicroChart"], function(MicroChart) {
 * 	 ...
 * 	 new MicroChart("myMicroChart", {metaPath:"@com.sap.vocabularies.UI.v1.Chart"})
 * })
 * </pre>
 * @alias sap.fe.macros.MicroChart
 * @ui5-metamodel
 * @public
 * @since 1.93.0
 */
@defineUI5Class("sap.fe.macros.MicroChart", {
	returnTypes: ["sap.fe.macros.microchart.MicroChartContainer", "sap.fe.macros.controls.ConditionalWrapper"]
})
export default class MicroChart extends BuildingBlock<MicroChartContainer> {
	/**
	 * To control the rendering of Title, Subtitle and Currency Labels. When the size is xs then we do
	 * not see the inner labels of the MicroChart as well.
	 * @public
	 */
	@property({
		type: "boolean"
	})
	public showOnlyChart = false;

	/**
	 * Metadata path to the  MicroChart.
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	/**
	 * context path to the MicroChart.
	 * @public
	 */
	@property({
		type: "string"
	})
	public contextPath?: string;

	/**
	 * Type of navigation, that is, External or InPage
	 */
	@property({
		type: "string"
	})
	navigationType?: NavigationType = NavigationType.None;

	/**
	 * Batch group ID along with which this call should be grouped.
	 */
	@property({ type: "string" })
	batchGroupId?: string;

	/**
	 * Size of the MicroChart
	 * @public
	 */
	@property({ type: "string" })
	size?: string;

	/**
	 * Show blank space in case there is no data in the chart
	 * @public
	 */
	@property({ type: "boolean" })
	hideOnNoData?: boolean = false;

	@property({ type: "string" })
	title = "";

	@property({ type: "string" })
	description = "";

	@event()
	titlePress!: Function;

	@property({ type: "object" })
	_chartTarget!: Chart;

	@property({ type: "object" })
	_dataPoint!: DataPoint;

	@property({ type: "object" })
	_targetNavigationPath!: Context | undefined;

	@property({ type: "object" })
	_microChartDataModelObjectPath!: DataModelObjectPath<Chart | PresentationVariant> | undefined;

	@property({ type: "string" })
	_binding!: string;

	@property({ type: "object" })
	_sortOrder?: SortOrderType[];

	@property({ type: "object" })
	_measureDataPath?: DataModelObjectPath<Measure>;

	@property({ type: "boolean" })
	isAnalytics?: boolean;

	constructor(settings?: $ControlSettings & PropertiesOf<MicroChart>, others?: PropertiesOf<MicroChart>) {
		super(settings, others);
	}

	/**
	 * Gets the sortOrder for the microChart as mentioned in the PresentationVariant.
	 * @param sortingProps Sorters from PresentationVariant.
	 * @returns SortOrder
	 */
	getSortOrder(sortingProps: SortOrderType[]): SortOrderType[] {
		return sortingProps.map((sortingProp: SortOrderType) => {
			return {
				Property: sortingProp.Property?.value as unknown as PropertyPath,
				Descending: sortingProp.Descending as boolean | undefined,
				fullyQualifiedName: "",
				$Type: CommonAnnotationTypes.SortOrderType
			};
		});
	}

	/**
	 * Sets the key with the given value for MicroChart.
	 * @param key The name of the property to set
	 * @param value The value to set the property to
	 * @param suppressInvalidate  If true, the managed object is not marked as changed
	 * @returns MicroChart
	 */
	setProperty(key: string, value: string | boolean, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && value !== undefined && Object.keys(this.getMetadata().getProperties()).includes(key)) {
			super.setProperty(key, value, true);
			if (this.content) {
				this.content.destroy();
				this.content = this.createContent();
				this.createMicroChart();
			}
		} else {
			super.setProperty(key, value, suppressInvalidate);
		}
		return this;
	}

	/**
	 * Overrides the clone method of the UI5 control to ensure that the suite micro chart is created asynchronously on the clone.
	 *
	 * Clone is a UI5 core Control method, which is not async and is called in a sync manner throughout UI5.
	 * Hence we need to create the chart in a fire and forget fashion.
	 *
	 * @param idSuffix A suffix to be appended to the cloned element id
	 * @param localIds An array of local IDs within the cloned hierarchy (internally used)
	 * @returns The reference to the newly create clone
	 */
	clone(idSuffix?: string | undefined, localIds?: string[]): this {
		const clonedMicroChart = super.clone(idSuffix, localIds);
		clonedMicroChart.createMicroChart();
		return clonedMicroChart;
	}
	public async onMetadataAvailable(_ownerComponent: TemplateComponent): Promise<void> {
		if (!this.content) {
			const owner = this._getOwner();
			this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
			const odataMetaModel = owner?.getMetaModel();
			this._microChartDataModelObjectPath = this.getDataModelObjectForMetaPath<Chart | PresentationVariant>(
				this.metaPath,
				this.contextPath
			);
			if (this._microChartDataModelObjectPath?.targetObject?.term === UIAnnotationTerms.PresentationVariant) {
				if ((this._microChartDataModelObjectPath.targetObject.SortOrder as unknown as SortOrderType[] | undefined)?.length) {
					this._sortOrder = this.getSortOrder(this._microChartDataModelObjectPath.targetObject.SortOrder);
				}
				this._microChartDataModelObjectPath = this.getDataModelObjectForMetaPath<Chart>(
					`${this._microChartDataModelObjectPath.targetObject.Visualizations[0].value}`,
					getTargetNavigationPath(this._microChartDataModelObjectPath) + "/"
				);
			}
			if (this._microChartDataModelObjectPath) {
				if (this._microChartDataModelObjectPath.targetObject?.term === UIAnnotationTerms.PresentationVariant) {
					if (
						(this._microChartDataModelObjectPath.targetObject.SortOrder as unknown as SortOrderType[] | undefined)?.length !=
						null
					) {
						this._sortOrder = this.getSortOrder(this._microChartDataModelObjectPath.targetObject.SortOrder);
					}
				}
				this._chartTarget = this._microChartDataModelObjectPath.targetObject as Chart;
				this._measureDataPath = enhanceDataModelPath<Measure>(
					this._microChartDataModelObjectPath,
					this._chartTarget.Measures[0].value
				);
				if (MicroChartHelper.shouldRenderMicroChart(this._chartTarget)) {
					this._dataPoint = this._chartTarget?.MeasureAttributes[0]?.DataPoint?.$target as DataPoint;
					this._targetNavigationPath = odataMetaModel?.createBindingContext(
						getTargetNavigationPath(this._microChartDataModelObjectPath)
					) as Context | undefined;

					this.showOnlyChart = typeof this.showOnlyChart === "string" ? this.showOnlyChart === "true" : this.showOnlyChart;
					this.content = this.createContent();
					await this.createMicroChart();
				} else {
					this.logWarning();
				}
			}
		}
	}

	async createMicroChart(): Promise<void> {
		const chartMap: Record<string, string> = {
			"UI.ChartType/Bullet": `sap/suite/ui/microchart/BulletMicroChart`,
			"UI.ChartType/Donut": `sap/suite/ui/microchart/RadialMicroChart`,
			"UI.ChartType/Pie": `sap/suite/ui/microchart/HarveyBallMicroChart`,
			"UI.ChartType/BarStacked": `sap/suite/ui/microchart/StackedBarMicroChart`,
			"UI.ChartType/Column": `sap/suite/ui/microchart/ColumnMicroChart`,
			"UI.ChartType/Bar": `sap/suite/ui/microchart/ComparisonMicroChart`,
			"UI.ChartType/Line": `sap/suite/ui/microchart/LineMicroChart`,
			"UI.ChartType/Area": `sap/suite/ui/microchart/AreaMicroChart`
		};

		const type1 = this._chartTarget.ChartType;
		if (Object.keys(chartMap).includes(type1)) {
			const ChartComponent = (await import(chartMap[type1])).default;
			const microChartAggregations = await this.getMicroChartAggregations();
			if (this.isAnalytics) {
				(this.content?.getAggregation("contentTrue") as MicroChartContainer).setAggregation(
					"microChart",
					<ChartComponent {...this.getMicroChartProperties()}>{microChartAggregations}</ChartComponent>
				);
			} else {
				(this.content as MicroChartContainer).setAggregation(
					"microChart",
					<ChartComponent {...this.getMicroChartProperties()}>{microChartAggregations}</ChartComponent>
				);
			}
		}
	}

	logWarning(): void {
		const errorObject: ErrorObjectType = {};
		if (this._chartTarget.ChartType === ChartType.Bullet) {
			errorObject["DataPoint_Value"] = this._dataPoint?.Value || undefined;
		}
		MicroChartHelper.logWarning(this._chartTarget.ChartType, errorObject);
	}

	getMicroChartProperties(): Partial<PropertiesOf<MicroChartSettings>> | undefined {
		let microChartProperties: MicroChartSettings = {
			size: this.size,
			hideOnNoData: this.hideOnNoData
		};

		const dataPointPath = enhanceDataModelPath<DataPointType>(
			this._microChartDataModelObjectPath as DataModelObjectPath<unknown>,
			this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value
		);

		const microChartAggregations = MicroChartHelper.getAggregationForMicrochart(
			this._chartTarget.ChartType,
			this._targetNavigationPath?.getObject(),
			dataPointPath,
			this._targetNavigationPath?.getObject("@sapui.name"),
			undefined,
			this._measureDataPath as DataModelObjectPath<Measure>,
			this._sortOrder as SortOrderType[],
			(this._microChartDataModelObjectPath?.targetObject as Chart)?.Dimensions?.[0]?.value,
			true
		);

		switch (this._chartTarget.ChartType) {
			case "UI.ChartType/Bullet":
				microChartProperties = MicroChartHelper.getBulletMicroChartProperties(microChartProperties, this._dataPoint);
				break;
			case "UI.ChartType/Donut":
				microChartProperties = MicroChartHelper.getRadialMicroChartProperties(microChartProperties, this._dataPoint);
				break;

			case "UI.ChartType/Pie":
				microChartProperties = MicroChartHelper.getHarveyMicroChartProperties(microChartProperties, this._dataPoint);
				break;

			case "UI.ChartType/BarStacked":
				(microChartProperties as $StackedBarMicroChartSettings).bars = microChartAggregations as unknown as AggregationBindingInfo;
				break;

			case "UI.ChartType/Column":
				(microChartProperties as $ColumnMicroChartSettings).columns = MicroChartHelper.getAggregationForMicrochart(
					this._chartTarget.ChartType,
					this._targetNavigationPath?.getObject(),
					dataPointPath,
					this._targetNavigationPath?.getObject("@sapui.name"),
					this._chartTarget?.Dimensions?.[0],
					this._measureDataPath as DataModelObjectPath<Measure>,
					this._sortOrder as SortOrderType[],
					(this._microChartDataModelObjectPath?.targetObject as Chart)?.Dimensions?.[0]?.value,
					true
				) as AggregationBindingInfo;
				break;

			case "UI.ChartType/Bar":
				(microChartProperties as $ComparisonMicroChartSettings).maxValue = this._dataPoint.MaximumValue
					? compileExpression(constant(this._dataPoint.MaximumValue?.valueOf()))
					: undefined;
				(microChartProperties as $ComparisonMicroChartSettings).minValue = this._dataPoint.MinimumValue
					? compileExpression(constant(this._dataPoint.MinimumValue?.valueOf()))
					: undefined;
				(microChartProperties as $ComparisonMicroChartSettings).colorPalette = MicroChartHelper.getColorPaletteForMicroChart(
					this._dataPoint
				);
				(microChartProperties as $ComparisonMicroChartSettings).data = microChartAggregations as unknown as AggregationBindingInfo;
				break;
			case "UI.ChartType/Line":
				(microChartProperties as $LineMicroChartSettings).showThresholdLine = false;
				break;
			default:
				break;
		}
		return microChartProperties;
	}

	async getMicroChartAggregations(): Promise<MicroChartAggregation | undefined> {
		const criticalityExpressionForMicrochart = this._dataPoint.Criticality
			? buildExpressionForCriticalityColorMicroChart(this._dataPoint)
			: undefined;
		if (this._chartTarget.ChartType === ChartType.Bullet) {
			return MicroChartHelper.getBulletMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart);
		}
		if (this._chartTarget.ChartType === ChartType.BarStacked) {
			return MicroChartHelper.getStackMicroChartAggregations(
				this._dataPoint,
				this._measureDataPath,
				criticalityExpressionForMicrochart
			);
		}
		if (this._chartTarget.ChartType === ChartType.Pie) {
			return MicroChartHelper.getHarveyMicroChartAggregations(this._dataPoint, criticalityExpressionForMicrochart);
		}
		if (this._chartTarget.ChartType === ChartType.Bar) {
			return MicroChartHelper.getComparisonMicroChartAggregations(
				this._dataPoint,
				criticalityExpressionForMicrochart,
				this._chartTarget
			);
		}
		if (this._chartTarget.ChartType === ChartType.Area) {
			return MicroChartHelper.getAreaMicroChartAggregations(
				this._chartTarget,
				this._microChartDataModelObjectPath as DataModelObjectPath<Chart | PresentationVariant>,
				this._targetNavigationPath as Context,
				this.showOnlyChart
			);
		}
		if (this._chartTarget.ChartType === ChartType.Column) {
			return MicroChartHelper.getColumnMicroChartAggregations(
				this._dataPoint,
				criticalityExpressionForMicrochart,
				this.showOnlyChart
			);
		}
		if (this._chartTarget.ChartType === ChartType.Line) {
			if (this._microChartDataModelObjectPath && this._targetNavigationPath) {
				return MicroChartHelper.getLineMicroChartAggragations(
					this._microChartDataModelObjectPath,
					this._chartTarget,
					this._targetNavigationPath
				);
			}
		}
		return;
	}

	createMicroChartId(chartType: string): string | undefined {
		let chartIDPrefix;
		switch (chartType) {
			case "UI.ChartType/Bullet":
				chartIDPrefix = "BulletMicroChart";
				break;
			case "UI.ChartType/Donut":
				chartIDPrefix = "RadialMicroChart";
				break;
			case "UI.ChartType/Pie":
				chartIDPrefix = "HarveyBallMicroChart";
				break;
			case "UI.ChartType/BarStacked":
				chartIDPrefix = "StackedBarMicroChart";
				break;
			case "UI.ChartType/Area":
				chartIDPrefix = "AreaMicroChart";
				break;
			case "UI.ChartType/Column":
				chartIDPrefix = "ColumnMicroChart";
				break;
			case "UI.ChartType/Bar":
				chartIDPrefix = "ComparisonMicroChart";
				break;
			case "UI.ChartType/Line":
				chartIDPrefix = "LineMicroChart";
				break;
		}
		return this.createId(chartIDPrefix);
	}

	getMicroChartContainerProperties(): PropertiesOf<MicroChartContainer> {
		const microChartContainerProperties: PropertiesOf<MicroChartContainer> = {
			chartTitle: this.title || (this._chartTarget.Title?.valueOf() as string) || undefined
		};
		microChartContainerProperties.showOnlyChart = this.showOnlyChart;
		microChartContainerProperties.chartTitle = (this._chartTarget.Title as string) || undefined;
		microChartContainerProperties.chartDescription =
			this.description || (this._chartTarget.Description?.valueOf() as string) || undefined;

		this._binding = MicroChartHelper.getBindingExpressionForMicrochart(
			this._chartTarget.ChartType,
			this._measureDataPath as DataModelObjectPath<Measure>,
			this,
			this._targetNavigationPath?.getObject(),
			this._targetNavigationPath?.getObject("@sapui.name")
		);

		microChartContainerProperties.uomPath = MicroChartHelper.getUOMPathForMicrochart(
			this.showOnlyChart,
			this._measureDataPath,
			this._chartTarget.ChartType
		);

		microChartContainerProperties.id = this.createMicroChartId(this._chartTarget.ChartType);

		const chartsWithVisibleProperty = ["UI.ChartType/Bullet", "UI.ChartType/Pie", "UI.ChartType/Radial"];
		if (chartsWithVisibleProperty.includes(this._chartTarget.ChartType)) {
			microChartContainerProperties.visible = compileExpression(
				not(
					ifElse(
						getExpressionFromAnnotation(this._chartTarget.Measures[0].$target?.annotations.UI?.Hidden),
						constant(true),
						constant(false)
					)
				)
			);
		} else {
			microChartContainerProperties.visible = undefined;
		}

		if (this._chartTarget.ChartType === ChartType.BarStacked) {
			microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMicroChart(
				this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value as string
			) as string[] | undefined;
		}
		if (this._chartTarget.ChartType === ChartType.Area || this._chartTarget.ChartType === ChartType.Column) {
			microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMicroChart(
				this._chartTarget?.MeasureAttributes[0]?.DataPoint?.value as string
			) as unknown as string[];
			microChartContainerProperties.measures = [
				(this._measureDataPath as DataModelObjectPath<Property>)?.targetObject?.name as string
			];
		}

		if (this._chartTarget.ChartType === ChartType.Line) {
			microChartContainerProperties.measures = MicroChartHelper.getMeasurePropertyPaths(
				this._chartTarget,
				this._microChartDataModelObjectPath?.targetEntityType.annotations,
				"Line",
				true
			) as string[];

			microChartContainerProperties.dataPointQualifiers = MicroChartHelper.getDataPointQualifiersForMeasures(
				this._chartTarget,
				this._microChartDataModelObjectPath?.targetEntityType.annotations,
				"Line",
				true
			) as string[];
		}

		if (
			this._chartTarget.ChartType === ChartType.Area ||
			this._chartTarget.ChartType === ChartType.Column ||
			this._chartTarget.ChartType === ChartType.Line
		) {
			const dimensionDataPath = enhanceDataModelPath<Property>(
				this._microChartDataModelObjectPath as DataModelObjectPath<Chart | PresentationVariant>,
				this._chartTarget.Dimensions[0].value
			);

			microChartContainerProperties.dimension = dimensionDataPath?.targetObject?.annotations?.Common?.Text
				? (dimensionDataPath?.targetObject?.annotations?.Common?.Text as unknown as PathAnnotationExpression<string>)?.path
				: dimensionDataPath?.targetObject?.name;
			microChartContainerProperties.measurePrecision = this._dataPoint?.Value?.$target?.precision;
			microChartContainerProperties.measureScale = MicroChartHelper.getMeasureScaleForMicroChart(this._dataPoint);
			microChartContainerProperties.dimensionPrecision = dimensionDataPath?.targetObject?.precision;
			microChartContainerProperties.calendarPattern = MicroChartHelper.getCalendarPattern(
				dimensionDataPath?.targetObject?.type as string,
				dimensionDataPath?.targetObject?.annotations as PropertyAnnotations,
				true
			);
		}
		return microChartContainerProperties;
	}

	createTitle(titleText: string | undefined): TitleLink | undefined {
		if (titleText) {
			// The title had this id in template time and we need to maintain the same id.
			const localLegacyTitleId = ID.generate([
				"fe",
				"MicroChartLink",
				this._targetNavigationPath?.getObject("@sapui.name"),
				this._microChartDataModelObjectPath?.targetObject?.term,
				this._microChartDataModelObjectPath?.targetObject?.qualifier
			]);
			const viewId = this.getPageController()?.getView().getId();
			const legacyTitleId = `${viewId}--${localLegacyTitleId}`;

			const titleLinkProperties: PropertiesOf<TitleLink> = {
				id: legacyTitleId,
				text: titleText
			};
			const resourceBundle = Lib.getResourceBundleFor("sap.fe.macros");
			if (this.navigationType === "InPage") {
				const ariaTranslatedText = resourceBundle?.getText("T_COMMON_HEADERDP_TITLE_LINK_INPAGE_ARIA");
				titleLinkProperties.showAsLink = true;
				titleLinkProperties.linkAriaText = ariaTranslatedText;
			} else if (this.navigationType === "External") {
				const showLink = CommonHelper.getHeaderDataPointLinkVisibility(localLegacyTitleId, true);
				const ariaTranslatedText = resourceBundle?.getText("M_MICROCHART_TITLE_FRAGMENT_HEADER_MICROCHART_LINK_ARIA");
				titleLinkProperties.showAsLink = showLink;
				titleLinkProperties.linkAriaText = ariaTranslatedText;
			}
			return (
				<TitleLink
					{...titleLinkProperties}
					linkPress={(pressEvent: Event): void => {
						this.fireEvent("titlePress", pressEvent);
					}}
				/>
			);
		}
	}

	/**
	 * The function to create microchart content.
	 * @returns MicroChartContainer which will contain Title and micro chart content for each of the microchart.
	 */
	createContent(): MicroChartContainer {
		const isValidChartType = [
			"UI.ChartType/Bullet",
			"UI.ChartType/Donut",
			"UI.ChartType/Pie",
			"UI.ChartType/BarStacked",
			"UI.ChartType/Area",
			"UI.ChartType/Column",
			"UI.ChartType/Bar",
			"UI.ChartType/Line"
		].includes(this._chartTarget.ChartType);
		if (!isValidChartType) {
			return <Text text="This chart type is not supported. Other Types yet to be implemented.." />;
		} else if (this.isAnalytics) {
			return (
				<ConditionalWrapper
					condition={compileExpression(or(not(pathInModel("@$ui5.node.isExpanded")), equal(pathInModel("@$ui5.node.level"), 0)))}
					visible={getExpressionForMeasureUnit(this._dataPoint.Value.$target)}
				>
					{{
						contentTrue: this.createChartContent(),
						contentFalse: <Text text="*"></Text>
					}}
				</ConditionalWrapper>
			);
		} else {
			return this.createChartContent();
		}
	}

	createChartContent(): MicroChartContainer {
		const microChartContainerProperties = {
			...this.getMicroChartContainerProperties(),
			binding: this._binding
		};
		return (
			<MicroChartContainer {...microChartContainerProperties}>
				{{
					microChartTitle: !this.showOnlyChart ? this.createTitle(microChartContainerProperties.chartTitle) : undefined
				}}
			</MicroChartContainer>
		);
	}
}

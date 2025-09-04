import { PropertiesOf } from "sap/fe/base/ClassSupport";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import InteractiveBarChart, { InteractiveBarChart$SelectionChangedEvent, type $InteractiveBarChartSettings } from "sap/suite/ui/microchart/InteractiveBarChart";
import InteractiveBarChartBar from "sap/suite/ui/microchart/InteractiveBarChartBar";
import InteractiveLineChart, { InteractiveLineChart$SelectionChangedEvent, type $InteractiveLineChartSettings } from "sap/suite/ui/microchart/InteractiveLineChart";
import InteractiveLineChartPoint, { type $InteractiveLineChartPointSettings } from "sap/suite/ui/microchart/InteractiveLineChartPoint";
import { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import CustomData from "sap/ui/core/CustomData";
import InteractiveChartHelper, { type InteractiveChartType } from "../InteractiveChartHelper";
import type VisualFilter from "../VisualFilter";
import VisualFilterRuntime from "../VisualFilterRuntime";

type visualFilterChartAggregations = Pick<$InteractiveBarChartSettings, "bars"> | Pick<$InteractiveLineChartSettings, "points">;

export function getVisualFilterChart(visualFilter: VisualFilter): string {
	if (visualFilter.showError) {
		return getInteractiveChartWithError(visualFilter);
	} else if (visualFilter.chartType) {
		return getInteractiveChart(visualFilter);
	} else {
		return "";
	}
}

export function getInteractiveChartWithError(visualFilter: VisualFilter): string {
	const chartAnnotation = visualFilter.chartAnnotation;
	if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
		return (
			<InteractiveLineChart
				showError={visualFilter.showError}
				errorMessageTitle={visualFilter.errorMessageTitle}
				errorMessage={visualFilter.errorMessage}
			/>
		);
	}
	return "";
}

export function getInteractiveChart(visualFilter: VisualFilter): string {
	const interactiveChartProperties = InteractiveChartHelper.getInteractiveChartProperties(visualFilter);
	if (visualFilter.chartType === "UI.ChartType/Bar") {
		return (
			<InteractiveBarChart
				selectionChanged={(event: InteractiveBarChart$SelectionChangedEvent): void => {
					VisualFilterRuntime.selectionChanged(event);
				}}
				{...getChartProperties(interactiveChartProperties, visualFilter)}
			>
				{getBarChartAggregations(interactiveChartProperties)}
				{{
					customData: getCustomData(visualFilter, interactiveChartProperties)
				}}
			</InteractiveBarChart>
		);
	} else if (visualFilter.chartType === "UI.ChartType/Line") {
		return (
			<InteractiveLineChart
				selectionChanged={(event: InteractiveLineChart$SelectionChangedEvent): void => {
					VisualFilterRuntime.selectionChanged(event);
				}}
				{...getChartProperties(interactiveChartProperties, visualFilter)}
			>
				{getLineChartAggregations(interactiveChartProperties)}
				{{
					customData: getCustomData(visualFilter, interactiveChartProperties)
				}}
			</InteractiveLineChart>
		);
	}
	return "";
}

function getChartProperties(
	interactiveChartProperties: InteractiveChartType,
	visualFilter: VisualFilter
): Partial<PropertiesOf<$InteractiveBarChartSettings | $InteractiveLineChartPointSettings>> | undefined {
	const visualFilterChartProperties: $InteractiveBarChartSettings | $InteractiveLineChartPointSettings = {
		visible: interactiveChartProperties.showErrorExpression,
		showError: interactiveChartProperties.showErrorExpression,
		errorMessageTitle: interactiveChartProperties.errorMessageTitleExpression,
		errorMessage: interactiveChartProperties.errorMessageExpression
	};
	if (visualFilter.chartType === "UI.ChartType/Bar") {
		visualFilterChartProperties.bars = interactiveChartProperties.aggregationBinding as unknown as AggregationBindingInfo;
	} else if (visualFilter.chartType === "UI.ChartType/Line") {
		(visualFilterChartProperties as $InteractiveLineChartSettings).points =
			interactiveChartProperties.aggregationBinding as unknown as AggregationBindingInfo;
	}
	return visualFilterChartProperties;
}

function getBarChartAggregations(interactiveChartProperties: InteractiveChartType): visualFilterChartAggregations {
	const barChartAggregations = {};
	(barChartAggregations as $InteractiveBarChartSettings).bars = (
		<InteractiveBarChartBar
			label={interactiveChartProperties.chartLabel}
			value={interactiveChartProperties.measure}
			displayedValue={interactiveChartProperties.displayedValue}
			color={interactiveChartProperties.color}
			selected="{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
		/>
	);
	return barChartAggregations;
}

function getLineChartAggregations(interactiveChartProperties: InteractiveChartType): visualFilterChartAggregations {
	const lineChartAggregations = {};
	(lineChartAggregations as $InteractiveLineChartSettings).points = (
		<InteractiveLineChartPoint
			label={interactiveChartProperties.chartLabel}
			value={interactiveChartProperties.measure}
			displayedValue={interactiveChartProperties.displayedValue}
			color={interactiveChartProperties.color}
			selected="{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
		/>
	);
	return lineChartAggregations;
}

function getCustomData(visualFilter: VisualFilter, interactiveChartProperties: InteractiveChartType): CustomData[] {
	const id = generate([visualFilter.metaPath]);
	const dimension = visualFilter.chartAnnotation?.Dimensions[0];
	return [
		<CustomData key={"outParameter"} value={visualFilter.outParameter} />,
		<CustomData key={"valuelistProperty"} value={visualFilter.valuelistProperty} />,
		<CustomData key={"multipleSelectionAllowed"} value={visualFilter.multipleSelectionAllowed} />,
		<CustomData key={"dimension"} value={dimension?.$target?.name} />,
		<CustomData
			key={"dimensionText"}
			value={
				isPathAnnotationExpression(dimension?.$target?.annotations.Common?.Text)
					? dimension?.$target?.annotations.Common?.Text.path
					: undefined
			}
		/>,
		<CustomData key={"scalefactor"} value={interactiveChartProperties.scalefactor} />,
		<CustomData key={"measure"} value={visualFilter.chartMeasure} />,
		<CustomData key={"uom"} value={interactiveChartProperties.uom} />,
		<CustomData key={"inParameters"} value={interactiveChartProperties.inParameters} />,
		<CustomData key={"inParameterFilters"} value={interactiveChartProperties.inParameterFilters} />,
		<CustomData key={"dimensionType"} value={dimension?.$target?.type} />,
		<CustomData key={"selectionVariantAnnotation"} value={interactiveChartProperties.selectionVariant} />,
		<CustomData key={"required"} value={visualFilter.required} />,
		<CustomData key={"showOverlayInitially"} value={visualFilter.showOverlayInitially} />,
		<CustomData key={"requiredProperties"} value={visualFilter.requiredProperties} />,
		<CustomData key={"infoPath"} value={id} />,
		<CustomData key={"parameters"} value={interactiveChartProperties.stringifiedParameters} />,
		<CustomData key={"draftSupported"} value={visualFilter.draftSupported} />
	];
}

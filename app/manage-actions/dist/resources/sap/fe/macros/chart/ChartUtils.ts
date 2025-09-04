import type Chart from "sap/chart/Chart";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import FilterUtil from "sap/fe/macros/filter/FilterUtils";
import type MDCChart from "sap/ui/mdc/Chart";
import type ChartDelegate from "sap/ui/mdc/ChartDelegate";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import CommonHelper from "../CommonHelper";

import type { InternalBindingInfo } from "../table/Utils";
import Utils from "../table/Utils";

type VizSelection = { data: Record<string, unknown> };

const ChartUtils = {
	/**
	 * Method that returns the chart filters stored in the UI model.
	 * @param oMdcChart The MDC_Chart control
	 * @param bClearSelections Clears chart selections in the UI model if true
	 * @returns The chart selections
	 */
	getChartSelections: function (oMdcChart: MDCChart, bClearSelections?: boolean): unknown {
		// get chart selections
		if (bClearSelections) {
			this.getChartModel(oMdcChart, "", {});
		}
		const aVizSelections = this.getChartModel(oMdcChart, "filters");
		return aVizSelections || [];
	},
	/**
	 * Method that returns the chart selections as a filter.
	 * @param oMdcChart The MDC_Chart control
	 * @returns Filter containing chart selections
	 */
	getChartFilters: function (oMdcChart: MDCChart): Filter {
		// get chart selections as a filter
		const aFilters = this.getChartSelections(oMdcChart) || [];
		return new Filter(aFilters);
	},
	/**
	 * Method that sets the chart selections as in the UI model.
	 * @param oMdcChart The MDC_Chart control
	 */
	setChartFilters: function (oMdcChart: MDCChart): void {
		// saving selections in each drill stack for future use
		const oDrillStack: Record<string, VizSelection[]> = (this.getChartModel(oMdcChart, "drillStack") || {}) as Record<
			string,
			VizSelection[]
		>;
		const oChart = (oMdcChart.getControlDelegate() as ChartDelegate).getInnerChart(oMdcChart) as Chart & {
			_getVizFrame: () => { vizSelection: () => VizSelection[] };
		};
		const aChartFilters: unknown[] = [];
		let aVisibleDimensions: string[];

		function addChartFilters(aSelectedData: VizSelection[]): void {
			for (const item in aSelectedData) {
				const aDimFilters = [];
				for (const i in aVisibleDimensions) {
					const sPath = aVisibleDimensions[i];
					const sValue = aSelectedData[item].data[sPath];
					if (sValue !== undefined) {
						aDimFilters.push(
							new Filter({
								path: sPath,
								operator: FilterOperator.EQ,
								value1: sValue
							})
						);
					}
				}
				if (aDimFilters.length > 0) {
					aChartFilters.push(new Filter(aDimFilters, true));
				}
			}
		}
		if (oChart) {
			const aVizSelections = this.getVizSelection(oChart);
			aVisibleDimensions = oChart.getVisibleDimensions();
			const aDimensions = this.getDimensionsFromDrillStack(oChart);
			if (aDimensions.length > 0) {
				this.getChartModel(oMdcChart, "drillStack", {});
				oDrillStack[aDimensions.toString()] = aVizSelections;
				this.getChartModel(oMdcChart, "drillStack", oDrillStack);
			}
			if (aVizSelections.length > 0) {
				// creating filters with selections in the current drillstack
				addChartFilters(aVizSelections);
			} else {
				// creating filters with selections in the previous drillstack when there are no selections in the current drillstack
				const aDrillStackKeys = Object.keys(oDrillStack) || [];
				const aPrevDrillStackData = oDrillStack[aDrillStackKeys[aDrillStackKeys.length - 2]] || [];
				addChartFilters(aPrevDrillStackData);
			}
			this.getChartModel(oMdcChart, "filters", aChartFilters);
		}
	},
	/**
	 * Method that returns the chart selections as a filter.
	 * @param oChart The inner chart control
	 * @returns The filters in the filter bar
	 */
	getFilterBarFilterInfo: function (oChart: MDCChart): InternalBindingInfo {
		return FilterUtil.getFilterInfo(oChart.getFilter(), {
			targetControl: oChart
		});
	},
	/**
	 * Method that returns the filters for the chart and filter bar.
	 * @param oChart The inner chart control
	 * @returns The new filter containing the filters for both the chart and the filter bar
	 */
	getAllFilterInfo: function (oChart: MDCChart): InternalBindingInfo {
		const oFilters = this.getFilterBarFilterInfo(oChart);
		const aChartFilters = this.getChartFilters(oChart);
		// Get filters added through personalization dialog filter option
		const aP13nProperties = Utils.getP13nFilters(oChart);
		// Retrieve selection presentation variant path from custom data
		const selectionPresentationVariantPath = CommonHelper.parseCustomData(oChart.data("selectionPresentationVariantPath"))
			? (CommonHelper.parseCustomData(oChart.data("selectionPresentationVariantPath")) as { data?: string }).data
			: "";
		// Check if SV is present in SPV, if yes get the Sv values
		const aSelctionVariant = selectionPresentationVariantPath
			? CommonUtils.getFiltersFromAnnotation(oChart, selectionPresentationVariantPath)
			: null;

		if (aChartFilters && aChartFilters.getFilters()?.length) {
			oFilters.filters.push(aChartFilters);
		}

		if (aP13nProperties.length > 0) {
			aP13nProperties.forEach((element) => {
				const filters = element.getFilters();
				if (filters?.length && filters?.length > 0) {
					// if we filter using more than one field
					filters.forEach((filterValue) => {
						oFilters.filters.push(filterValue);
					});
				} else {
					// if we filter using only one field
					oFilters.filters.push(element);
				}
			});
		}

		if (aSelctionVariant && aSelctionVariant.length > 0) {
			aSelctionVariant.forEach((filterValue) => {
				oFilters.filters.push((filterValue as unknown as { aFilters: Filter[] }).aFilters[0]);
			});
		}

		return oFilters;
	},

	/**
	 * Method that returns selected data in the chart.
	 * @param oChart The inner chart control
	 * @returns The selected chart data
	 */
	getChartSelectedData: function (oChart: Chart): { context: ODataV4Context }[] {
		let aSelectedPoints: { context: ODataV4Context }[] = [];
		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (oChart.getSelectionBehavior()) {
			case "DATAPOINT":
				aSelectedPoints = (oChart.getSelectedDataPoints() as { dataPoints: { context: ODataV4Context }[] }).dataPoints;
				break;
			case "CATEGORY":
				aSelectedPoints = (oChart.getSelectedCategories() as { categories: { context: ODataV4Context }[] }).categories;
				break;
			case "SERIES":
				aSelectedPoints = (oChart.getSelectedSeries() as { series: { context: ODataV4Context }[] }).series;
				break;
		}
		return aSelectedPoints;
	},
	/**
	 * Method to get filters, drillstack and selected contexts in the UI model.
	 * Can also be used to set data in the model.
	 * @param oMdcChart The MDC_Chart control
	 * @param sPath The path in the UI model from which chart data is to be set/fetched
	 * @param vData The chart info to be set
	 * @returns The chart info (filters/drillstack/selectedContexts)
	 */
	getChartModel: function (oMdcChart: MDCChart, sPath: string, vData?: object | unknown[]): boolean | unknown {
		const oInternalModelContext = oMdcChart.getBindingContext("internal") as InternalModelContext;
		if (!oInternalModelContext) {
			return false;
		}

		if (vData) {
			oInternalModelContext.setProperty(sPath, vData);
		}
		return oInternalModelContext && oInternalModelContext.getObject(sPath);
	},
	/**
	 * Method to fetch the current drillstack dimensions.
	 * @param oChart The inner chart control
	 * @returns The current drillstack dimensions
	 */
	getDimensionsFromDrillStack: function (oChart: Chart): string[] {
		const aCurrentDrillStack = oChart.getDrillStack() || [];
		const aCurrentDrillView = (aCurrentDrillStack.pop() || {}) as { dimension: string[] };
		return aCurrentDrillView.dimension || [];
	},
	/**
	 * Method to fetch chart selections.
	 * @param oChart The inner chart control
	 * @returns The chart selections
	 */
	getVizSelection: function (oChart: Chart & { _getVizFrame: () => { vizSelection: () => VizSelection[] } }): VizSelection[] {
		return (oChart && oChart._getVizFrame() && oChart._getVizFrame().vizSelection()) || [];
	}
};

export default ChartUtils;

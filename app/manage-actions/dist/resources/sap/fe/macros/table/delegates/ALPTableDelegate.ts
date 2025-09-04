import CommonUtils from "sap/fe/core/CommonUtils";
import type Chart from "sap/fe/macros/Chart";
import ChartUtils from "sap/fe/macros/chart/ChartUtils";
import TableUtils from "sap/fe/macros/table/Utils";
import TableDelegate from "sap/fe/macros/table/delegates/TableDelegate";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type { BaseAggregationBindingInfo, BasePropertyInfo } from "sap/ui/base/ManagedObject";
import type MDCChart from "sap/ui/mdc/Chart";
import type Table from "sap/ui/mdc/Table";
import Filter from "sap/ui/model/Filter";
/**
 * Helper class for sap.ui.mdc.Table.
 * <h3><b>Note:</b></h3>
 * The class is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
 * @author SAP SE
 * @private
 * @experimental
 * @since 1.69.0
 * @alias sap.fe.macros.ALPTableDelegate
 */
const ALPTableDelegate = Object.assign({}, TableDelegate, {
	apiVersion: 2,
	_internalUpdateBindingInfo: function (table: Table, bindingInfo: BasePropertyInfo) {
		let filterInfo;
		let chartFilters;

		// We need to deepClone the info we get from the custom data, otherwise some of its subobjects (e.g. parameters) will
		// be shared with oBindingInfo and modified later (Object.assign only does a shallow clone)
		Object.assign(bindingInfo, TableDelegate._computeRowBindingInfoFromTemplate(table));
		if (table.getRowBinding()) {
			bindingInfo.suspended = false;
		}
		const view = CommonUtils.getTargetView(table);
		const mdcChart = (view.getController() as ListReportController).getChartControl?.() as MDCChart;
		const chartAPI = mdcChart?.getParent() as Chart;
		const chartSelectionsExist = chartAPI?.hasSelections();
		const tableFilterInfo = TableUtils.getAllFilterInfo(table);
		const tableFilters = tableFilterInfo && tableFilterInfo.filters;
		filterInfo = tableFilterInfo;
		if (chartSelectionsExist) {
			const chartFilterInfo = ChartUtils.getAllFilterInfo(mdcChart);
			if (chartFilterInfo && chartFilterInfo.filters) {
				chartFilterInfo.filters.forEach((element: Filter) => {
					if (element.getPath()) {
						(element as { sPath?: string }).sPath = chartAPI.getChartPropertiesWithoutPrefixes(element.getPath()!);
					}
				});
			}
			chartFilters = chartFilterInfo?.filters ?? null;
			filterInfo = chartFilterInfo;
		}
		const finalFilters = (tableFilters && chartFilters ? tableFilters.concat(chartFilters) : chartFilters || tableFilters) || [];
		const oFilter =
			finalFilters.length > 0
				? new Filter({
						filters: finalFilters,
						and: true
				  })
				: null;

		if (filterInfo.bindingPath) {
			// In case of parameters
			bindingInfo.path = filterInfo.bindingPath;
		}

		// Prepare binding info with filter/search parameters
		ALPTableDelegate.updateBindingInfoWithSearchQuery(bindingInfo, filterInfo, oFilter);

		TableDelegate.addFilterOnActiveEntities(table, bindingInfo);
	},
	rebind: function (table: Table, bindingInfo: BaseAggregationBindingInfo) {
		const internalModelContext = table.getBindingContext("pageInternal");
		const templateContentView = internalModelContext?.getProperty(`${internalModelContext.getPath()}/alpContentView`);
		if (templateContentView !== "Chart") {
			TableDelegate.rebind(table, bindingInfo);
		}
	}
});

export default ALPTableDelegate;

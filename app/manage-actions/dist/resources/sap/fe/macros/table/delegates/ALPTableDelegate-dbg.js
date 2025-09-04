/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/table/Utils", "sap/fe/macros/table/delegates/TableDelegate", "sap/ui/model/Filter"], function (CommonUtils, ChartUtils, TableUtils, TableDelegate, Filter) {
  "use strict";

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
    _internalUpdateBindingInfo: function (table, bindingInfo) {
      let filterInfo;
      let chartFilters;

      // We need to deepClone the info we get from the custom data, otherwise some of its subobjects (e.g. parameters) will
      // be shared with oBindingInfo and modified later (Object.assign only does a shallow clone)
      Object.assign(bindingInfo, TableDelegate._computeRowBindingInfoFromTemplate(table));
      if (table.getRowBinding()) {
        bindingInfo.suspended = false;
      }
      const view = CommonUtils.getTargetView(table);
      const mdcChart = view.getController().getChartControl?.();
      const chartAPI = mdcChart?.getParent();
      const chartSelectionsExist = chartAPI?.hasSelections();
      const tableFilterInfo = TableUtils.getAllFilterInfo(table);
      const tableFilters = tableFilterInfo && tableFilterInfo.filters;
      filterInfo = tableFilterInfo;
      if (chartSelectionsExist) {
        const chartFilterInfo = ChartUtils.getAllFilterInfo(mdcChart);
        if (chartFilterInfo && chartFilterInfo.filters) {
          chartFilterInfo.filters.forEach(element => {
            if (element.getPath()) {
              element.sPath = chartAPI.getChartPropertiesWithoutPrefixes(element.getPath());
            }
          });
        }
        chartFilters = chartFilterInfo?.filters ?? null;
        filterInfo = chartFilterInfo;
      }
      const finalFilters = (tableFilters && chartFilters ? tableFilters.concat(chartFilters) : chartFilters || tableFilters) || [];
      const oFilter = finalFilters.length > 0 ? new Filter({
        filters: finalFilters,
        and: true
      }) : null;
      if (filterInfo.bindingPath) {
        // In case of parameters
        bindingInfo.path = filterInfo.bindingPath;
      }

      // Prepare binding info with filter/search parameters
      ALPTableDelegate.updateBindingInfoWithSearchQuery(bindingInfo, filterInfo, oFilter);
      TableDelegate.addFilterOnActiveEntities(table, bindingInfo);
    },
    rebind: function (table, bindingInfo) {
      const internalModelContext = table.getBindingContext("pageInternal");
      const templateContentView = internalModelContext?.getProperty(`${internalModelContext.getPath()}/alpContentView`);
      if (templateContentView !== "Chart") {
        TableDelegate.rebind(table, bindingInfo);
      }
    }
  });
  return ALPTableDelegate;
}, false);
//# sourceMappingURL=ALPTableDelegate-dbg.js.map

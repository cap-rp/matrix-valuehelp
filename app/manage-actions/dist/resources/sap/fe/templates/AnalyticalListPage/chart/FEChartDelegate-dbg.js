/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/chart/ChartDelegate"], function (BaseChartDelegate) {
  "use strict";

  // ---------------------------------------------------------------------------------------
  // Helper class used to help create content in the chart/item and fill relevant metadata
  // ---------------------------------------------------------------------------------------
  // ---------------------------------------------------------------------------------------
  const ChartDelegate = Object.assign({}, BaseChartDelegate);
  /**
   * @param oMDCChart The mdc chart control
   * @param oBindingInfo The binding info of chart
   * data in chart and table must be synchronised. every
   * time the chart refreshes, the table must be refreshed too.
   */
  ChartDelegate.rebind = function (oMDCChart, oBindingInfo) {
    //	var oComponent = flUtils.getAppComponentForControl(oMDCChart);
    //	var bIsSearchTriggered = oComponent.getAppStateHandler().getIsSearchTriggered();
    // workaround in place to prevent chart from loading when go button is present and initial load is false
    //	if (bIsSearchTriggered) {
    const oInternalModelContext = oMDCChart.getBindingContext("pageInternal");
    const sTemplateContentView = oInternalModelContext.getProperty(`${oInternalModelContext.getPath()}/alpContentView`);
    if (!sTemplateContentView || sTemplateContentView !== "Table") {
      BaseChartDelegate.rebind(oMDCChart, oBindingInfo);
    }
  };
  return ChartDelegate;
}, false);
//# sourceMappingURL=FEChartDelegate-dbg.js.map

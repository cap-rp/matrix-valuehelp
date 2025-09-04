/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/ActionRuntime", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/DelegateUtil"], function (ActionRuntime, ChartUtils, DelegateUtil) {
  "use strict";

  /**
   * Static class used by MDC_Chart during runtime
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const ChartRuntime = {
    /**
     * Updates the chart after selection or deselection of data points.
     * @param oEvent Chart event
     */
    fnUpdateChart: function (oEvent) {
      const oInnerChart = oEvent.getSource();
      const oMdcChart = oInnerChart.getParent();
      let sActionsMultiselectDisabled,
        oActionOperationAvailableMap = {},
        aActionsMultiselectDisabled = [];
      // changing drill stack changes order of custom data, looping through all
      oMdcChart.getCustomData().forEach(function (oCustomData) {
        if (oCustomData.getKey() === "operationAvailableMap") {
          oActionOperationAvailableMap = DelegateUtil.getCustomData(oMdcChart, "operationAvailableMap").customData;
        } else if (oCustomData.getKey() === "multiSelectDisabledActions") {
          sActionsMultiselectDisabled = oCustomData.getValue();
          aActionsMultiselectDisabled = sActionsMultiselectDisabled ? sActionsMultiselectDisabled.split(",") : [];
        }
      });
      const oInternalModelContext = oMdcChart.getBindingContext("internal");
      const aSelectedContexts = [];
      let oModelObject;
      const aSelectedDataPoints = ChartUtils.getChartSelectedData(oInnerChart);
      for (let i = 0; i < aSelectedDataPoints.length; i++) {
        aSelectedContexts.push(aSelectedDataPoints[i].context);
      }
      oInternalModelContext.setProperty("selectedContexts", aSelectedContexts);
      oInternalModelContext.getModel().setProperty(`${oInternalModelContext.getPath()}/numberOfSelectedContexts`, oInnerChart.getSelectedDataPoints().count);
      for (let j = 0; j < aSelectedContexts.length; j++) {
        const oSelectedContext = aSelectedContexts[j];
        const oContextData = oSelectedContext.getObject();
        for (const key in oContextData) {
          if (key.indexOf("#") === 0) {
            let sActionPath = key;
            sActionPath = sActionPath.substring(1, sActionPath.length);
            oModelObject = oInternalModelContext.getObject();
            oModelObject[sActionPath] = true;
            oInternalModelContext.setProperty("", oModelObject);
          }
        }
        oModelObject = oInternalModelContext.getObject();
      }
      ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, "chart");
      if (aSelectedContexts.length > 1) {
        aActionsMultiselectDisabled.forEach(function (sAction) {
          oInternalModelContext.setProperty(sAction, false);
        });
      }
    }
  };
  return ChartRuntime;
}, false);
//# sourceMappingURL=ChartRuntime-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/StableIdHelper"], function (StableIdHelper) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  // Template Helpers for the List Report
  /**
   * Method returns an VariantBackReference expression based on variantManagement and oConverterContext value.
   * @param viewData Object Containing View Data
   * @param converterContextObject Object containing converted context
   * @returns {string}
   */

  const getVariantBackReference = function (viewData, converterContextObject) {
    if (viewData && viewData.variantManagement === "Page") {
      return "fe::PageVariantManagement";
    }
    if (viewData && viewData.variantManagement === "Control") {
      return generate([converterContextObject.filterBarId, "VariantManagement"]);
    }
    return undefined;
  };
  _exports.getVariantBackReference = getVariantBackReference;
  const getDefaultPath = function (aViews) {
    for (let i = 0; i < aViews.length; i++) {
      if (aViews[i].defaultPath) {
        return aViews[i].defaultPath;
      }
    }
  };
  _exports.getDefaultPath = getDefaultPath;
  return _exports;
}, false);
//# sourceMappingURL=ListReportTemplating-dbg.js.map

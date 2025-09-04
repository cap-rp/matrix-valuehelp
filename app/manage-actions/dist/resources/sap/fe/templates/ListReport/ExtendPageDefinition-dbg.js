/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  function getDesigntime() {
    return "sap/fe/templates/ListReport/designtime/ListReport.designtime";
  }
  _exports.getDesigntime = getDesigntime;
  const extendListReportPageDefinition = function (pageDefinition) {
    const convertedPageDefinition = pageDefinition;
    convertedPageDefinition.designtime = getDesigntime();
    return convertedPageDefinition;
  };
  _exports.extendListReportPageDefinition = extendListReportPageDefinition;
  return _exports;
}, false);
//# sourceMappingURL=ExtendPageDefinition-dbg.js.map

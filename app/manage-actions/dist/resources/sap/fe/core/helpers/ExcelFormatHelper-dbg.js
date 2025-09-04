/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";

  const ExcelFormatHelper = {
    /**
     * Method for converting JS Date format to Excel custom date format.
     * @returns Format for the Date column to be used on excel.
     */
    getExcelDatefromJSDate: function () {
      // Get date Format(pattern), which will be used for date format mapping between sapui5 and excel.
      // UI5_ANY
      let sJSDateFormat = DateFormat.getDateInstance().oFormatOptions?.pattern?.toLowerCase();
      if (sJSDateFormat) {
        // Checking for the existence of single 'y' in the pattern.
        const regex = /^[^y]*y[^y]*$/m;
        if (regex.exec(sJSDateFormat)) {
          sJSDateFormat = sJSDateFormat.replace("y", "yyyy");
        }
      }
      return sJSDateFormat;
    },
    getExcelDateTimefromJSDateTime: function () {
      // Get date Format(pattern), which will be used for date time format mapping between sapui5 and excel.
      // UI5_ANY
      let sJSDateTimeFormat = DateFormat.getDateTimeInstance().oFormatOptions?.pattern?.toLowerCase();
      if (sJSDateTimeFormat) {
        // Checking for the existence of single 'y' in the pattern.
        const regexYear = /^[^y]*y[^y]*$/m;
        if (regexYear.exec(sJSDateTimeFormat)) {
          sJSDateTimeFormat = sJSDateTimeFormat.replace("y", "yyyy");
        }
        if (sJSDateTimeFormat.includes("a")) {
          sJSDateTimeFormat = sJSDateTimeFormat.replace("a", "AM/PM");
        }
      }
      return sJSDateTimeFormat;
    },
    getExcelTimefromJSTime: function () {
      // Get date Format(pattern), which will be used for date time format mapping between sapui5 and excel.
      // UI5_ANY
      let sJSTimeFormat = DateFormat.getTimeInstance().oFormatOptions?.pattern;
      if (sJSTimeFormat && sJSTimeFormat.includes("a")) {
        sJSTimeFormat = sJSTimeFormat.replace("a", "AM/PM");
      }
      return sJSTimeFormat;
    }
  };
  return ExcelFormatHelper;
}, false);
//# sourceMappingURL=ExcelFormatHelper-dbg.js.map

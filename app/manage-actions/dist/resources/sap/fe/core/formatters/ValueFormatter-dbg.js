/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/strings/whitespaceReplacer", "sap/base/util/ObjectPath", "sap/fe/core/templating/SemanticObjectHelper", "sap/ui/core/IconPool", "sap/ui/core/Lib", "sap/ui/core/date/UI5Date", "sap/ui/core/format/DateFormat", "sap/ui/core/format/NumberFormat"], function (Log, whitespaceReplacer, ObjectPath, SemanticObjectHelper, IconPool, Library, UI5Date, DateFormat, NumberFormat) {
  "use strict";

  var _exports = {};
  var getReachableSemanticObjectsSettings = SemanticObjectHelper.getReachableSemanticObjectsSettings;
  const calendarPatternMap = {
    yyyy: /[1-9]\d{3,}|0\d{3}/,
    Q: /[1-4]/,
    MM: /0[1-9]|1[0-2]/,
    ww: /0[1-9]|[1-4]\d|5[0-3]/,
    yyyyMMdd: /(?:[1-9]\d{3}|0\d{3})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/,
    yyyyMM: /(?:[1-9]\d{3}|0\d{3})(0[1-9]|1[0-2])/,
    "yyyy-MM-dd": /(?:[1-9]\d{3}|0\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/
  };

  /**
   * Collection of table formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const valueFormatters = function (sName) {
    if (valueFormatters.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return valueFormatters[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  const formatWithBrackets = (firstPart, secondPart) => {
    if (firstPart && secondPart) {
      const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
      return resourceBundle.getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [firstPart, secondPart]);
    } else {
      return firstPart || secondPart || "";
    }
  };
  formatWithBrackets.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithBrackets";
  const formatStringDimension = (value, pattern, propertyPath) => {
    if (pattern in calendarPatternMap) {
      const matchedValue = value?.toString().match(calendarPatternMap[pattern]);
      if (matchedValue && matchedValue?.length) {
        const date = matchedValue[0];
        const value1 = DateFormat.getDateInstance({
          pattern
        }).parse(date, false, true);
        if (value1 instanceof Date) {
          return value1.getTime();
        } else {
          Log.warning("Date value could not be determined for " + propertyPath);
        }
        return 0;
      }
    }
    Log.warning("Pattern not supported for " + propertyPath);
    return 0;
  };
  formatStringDimension.__functionName = "sap.fe.core.formatters.ValueFormatter#formatStringDimension";
  const formatTitle = (firstPart, secondPart) => {
    return secondPart ? formatWithBrackets(whitespaceReplacer(firstPart), whitespaceReplacer(secondPart)) : whitespaceReplacer(firstPart);
  };
  formatTitle.__functionName = "sap.fe.core.formatters.ValueFormatter#formatTitle";
  const formatWithPercentage = sValue => {
    return sValue !== null && sValue !== undefined ? `${sValue} %` : "";
  };
  formatWithPercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithPercentage";
  const computePercentage = (value, target, sUnit) => {
    let sPercentString;
    //BCP: 2370008548 If the base value is undefined return "0" by default
    if (value === undefined) {
      return "0";
    }
    const iValue = typeof value === "string" ? parseFloat(value) : value;
    const iTarget = typeof target === "string" ? parseFloat(target) : target;
    if (sUnit === "%") {
      if (iValue > 100) {
        sPercentString = "100";
      } else if (iValue <= 0) {
        sPercentString = "0";
      } else {
        sPercentString = typeof value === "string" ? value : value?.toString();
      }
    } else if (iValue > iTarget) {
      sPercentString = "100";
    } else if (iValue <= 0) {
      sPercentString = "0";
    } else {
      sPercentString = iValue && iTarget ? (iValue / iTarget * 100).toString() : "0";
    }
    return sPercentString;
  };
  computePercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#computePercentage";
  const formatCriticalityValueState = val => {
    let sValueState;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sValueState = "Error";
    } else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
      sValueState = "Warning";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sValueState = "Success";
    } else if (val === "UI.CriticalityType/Information" || val === "5" || val === 5) {
      sValueState = "Information";
    } else {
      sValueState = "None";
    }
    return sValueState;
  };
  formatCriticalityValueState.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityValueState";
  _exports.formatCriticalityValueState = formatCriticalityValueState;
  const formatCriticalityButtonType = val => {
    let sType;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sType = "Reject";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sType = "Accept";
    } else {
      sType = "Default";
    }
    return sType;
  };
  formatCriticalityButtonType.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityButtonType";
  _exports.formatCriticalityButtonType = formatCriticalityButtonType;
  const formatCriticalityColorMicroChart = val => {
    let sColor;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sColor = "Error";
    } else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
      sColor = "Critical";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sColor = "Good";
    } else {
      sColor = "Neutral";
    }
    return sColor;
  };
  formatCriticalityColorMicroChart.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityColorMicroChart";

  /**
   * Formats the text to be displayed in the progress indicator. Takes into account the decimals and precision of the unit.
   * @param value The current value of the progress indicator
   * @param target The target value fo the progress indicator
   * @param unit The unit of the progress indicator
   * @param isCurrency Whether we have a currency or a uom
   * @param customUnits An object containing the custom units of the application
   * @param customUnits.customCurrencies
   * @param customUnits.showMeasure
   * @returns The translated and formatted text of the progress indicator
   */
  _exports.formatCriticalityColorMicroChart = formatCriticalityColorMicroChart;
  const formatProgressIndicatorText = (value, target, unit, isCurrency, customUnits) => {
    if (value && target && unit) {
      const unitSplit = unit.split("-");
      const searchUnit = `${unitSplit[1] === undefined ? unit : unitSplit[1]}-narrow`;
      const dateFormat = DateFormat.getDateInstance();
      const localeData = dateFormat.oLocaleData.mData;
      const oResourceModel = Library.getResourceBundleFor("sap.fe.macros");
      let unitDisplayed = unit;
      if (localeData?.dateFields[searchUnit]?.displayName) {
        unitDisplayed = localeData.dateFields[searchUnit].displayName;
      } else if (localeData?.units?.short[unit]?.displayName) {
        unitDisplayed = localeData.units.short[unit].displayName;
      }
      let formatter;
      if (isCurrency) {
        formatter = NumberFormat.getCurrencyInstance({
          customCurrencies: customUnits,
          showMeasure: false
        });
      } else {
        formatter = NumberFormat.getUnitInstance({
          customUnits: customUnits,
          showMeasure: false
        });
      }
      const displayValue = formatter.format(+value, unitDisplayed);
      const displayTarget = formatter.format(+target, unitDisplayed);
      return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_WITH_UOM", [displayValue, displayTarget, unitDisplayed]);
    }
  };
  formatProgressIndicatorText.__functionName = "sap.fe.core.formatters.ValueFormatter#formatProgressIndicatorText";

  /**
   * Formats the text by replacing each character with a *.
   * @param value The current text entered in the field.
   * @returns A string of * characters equal to the length of the entered value.
   */
  _exports.formatProgressIndicatorText = formatProgressIndicatorText;
  const formatPasswordText = value => {
    if (value?.length) {
      return "*".repeat(value.length);
    }
    return undefined;
  };
  formatPasswordText.__functionName = "sap.fe.core.formatters.ValueFormatter#formatPasswordText";
  _exports.formatPasswordText = formatPasswordText;
  const formatToKeepWhitespace = value => {
    return value === null || value === undefined ? "" : whitespaceReplacer(value + "");
  };
  formatToKeepWhitespace.__functionName = "sap.fe.core.formatters.ValueFormatter#formatToKeepWhitespace";
  _exports.formatToKeepWhitespace = formatToKeepWhitespace;
  function provideDateInstance(value) {
    if (value) {
      const isDateValid = new Date(value);
      if (!isNaN(Date.parse(isDateValid))) {
        return UI5Date.getInstance(value);
      } else {
        Log.warning("Warning: Valid date format has to be sent to retrieve UI5 date instance");
      }
    }
    return null;
  }
  provideDateInstance.__functionName = "sap.fe.core.formatters.ValueFormatter#provideDateInstance";

  /**
   * Format the semantic objects available to user.
   * @param semanticObjects The semantic objects from shell services and the dynamic semantic objects resolved
   * @returns True if the user has semantic objects to navigate
   */
  const hasSemanticObjects = function () {
    for (var _len2 = arguments.length, semanticObjects = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      semanticObjects[_key2] = arguments[_key2];
    }
    const currentUserSemanticObjectsList = semanticObjects[0];
    const dynamicSemanticObjectsResolved = [];
    for (let i = 1; i < semanticObjects.length; i++) {
      if (semanticObjects[i]) {
        dynamicSemanticObjectsResolved.push(semanticObjects[i]);
      }
    }
    if (dynamicSemanticObjectsResolved.length > 0) {
      return getReachableSemanticObjectsSettings(currentUserSemanticObjectsList, {
        semanticObjectsList: dynamicSemanticObjectsResolved,
        semanticObjectsExpressionList: [],
        qualifierMap: {}
      }).hasReachableStaticSemanticObject;
    }
    return undefined;
  };
  hasSemanticObjects.__functionName = "sap.fe.core.formatters.ValueFormatter#hasSemanticObjects";
  _exports.hasSemanticObjects = hasSemanticObjects;
  const replaceWhitespace = function (value) {
    return whitespaceReplacer(value);
  };
  replaceWhitespace.__functionName = "sap.fe.core.formatters.ValueFormatter#replaceWhitespace";
  _exports.replaceWhitespace = replaceWhitespace;
  const getIconForMimeType = function (mimeType) {
    return IconPool.getIconForMimeType(mimeType);
  };
  getIconForMimeType.__functionName = "sap.fe.core.formatters.StandardFormatter#getIconForMimeType";
  valueFormatters.hasSemanticObjects = hasSemanticObjects;
  valueFormatters.formatWithBrackets = formatWithBrackets;
  valueFormatters.formatTitle = formatTitle;
  valueFormatters.provideDateInstance = provideDateInstance;
  valueFormatters.formatWithPercentage = formatWithPercentage;
  valueFormatters.computePercentage = computePercentage;
  valueFormatters.formatCriticalityValueState = formatCriticalityValueState;
  valueFormatters.formatCriticalityButtonType = formatCriticalityButtonType;
  valueFormatters.formatCriticalityColorMicroChart = formatCriticalityColorMicroChart;
  valueFormatters.formatProgressIndicatorText = formatProgressIndicatorText;
  valueFormatters.formatPasswordText = formatPasswordText;
  valueFormatters.formatToKeepWhitespace = formatToKeepWhitespace;
  valueFormatters.formatStringDimension = formatStringDimension;
  valueFormatters.getIconForMimeType = getIconForMimeType;
  valueFormatters.replaceWhitespace = replaceWhitespace;
  ObjectPath.set("sap.fe.core.formatters.ValueFormatter", valueFormatters);
  return valueFormatters;
}, false);
//# sourceMappingURL=ValueFormatter-dbg.js.map

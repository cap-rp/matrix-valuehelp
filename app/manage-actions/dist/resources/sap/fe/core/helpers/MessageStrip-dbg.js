/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/Lib", "sap/ui/Device"], function (CommonUtils, ResourceModelHelper, Library, Device) {
  "use strict";

  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  function getLabels(aIgnoredFields, sEntityTypePath, oFilterControl, resourceModel) {
    const oMetaModel = oFilterControl.getModel().getMetaModel(),
      aIgnoredLabels = aIgnoredFields.map(function (sProperty) {
        if (sProperty === "$search") {
          return resourceModel.getText("M_FILTERBAR_SEARCH") || "";
        }
        if (sProperty === "$editState") {
          return resourceModel.getText("FILTERBAR_EDITING_STATUS") || "";
        }
        const sLabel = oMetaModel.getObject(`${sEntityTypePath}${sProperty}@com.sap.vocabularies.Common.v1.Label`) ?? sProperty;
        return getLocalizedText(sLabel, oFilterControl);
      });
    return aIgnoredLabels;
  }
  function getALPText(aIgnoredLabels, oFilterBar, bIsSearchIgnored) {
    let sResourceKey = "";
    let aParameters = [];
    const oResourceBundle = _getResourceBundle();
    if (!oResourceBundle) {
      return "";
    }
    const view = CommonUtils.getTargetView(oFilterBar);
    const oChart = view.getController().getChartControl?.();
    const bIsDraftSupported = oChart?.data("draftSupported") === "true";
    const oMacroResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
    bIsSearchIgnored = bIsSearchIgnored && aIgnoredLabels.includes(oMacroResourceBundle.getText("M_FILTERBAR_SEARCH"));
    const sDefaultResourceKey = `C_LR_MULTIVIZ_CHART_${_getArgumentSize(aIgnoredLabels)}_IGNORED_FILTER_${_getSizeText()}`;
    if (bIsDraftSupported && (aIgnoredLabels.length === 2 && bIsSearchIgnored || aIgnoredLabels.length === 1)) {
      sResourceKey = aIgnoredLabels.length === 1 ? "C_MULTIVIZ_CHART_IGNORED_FILTER_DRAFT_DATA" : "C_LR_MULTIVIZ_CHART_IGNORED_FILTER_DRAFT_DATA_AND_SEARCH";
    } else {
      sResourceKey = sDefaultResourceKey;
      aParameters = [aIgnoredLabels.join(", ")];
    }
    return oResourceBundle.getText(sResourceKey, aParameters);
  }
  function getText(aIgnoredLabels, oFilterBar, sTabTitle) {
    const oResourceBundle = _getResourceBundle();
    return oResourceBundle ? oResourceBundle.getText(`C_LR_MULTITABLES_${_getArgumentSize(aIgnoredLabels)}_IGNORED_FILTER_${_getSizeText()}`, [aIgnoredLabels.join(", "), getLocalizedText(sTabTitle, oFilterBar)]) : "";
  }
  function _getSizeText() {
    return Device.system.desktop ? "LARGE" : "SMALL";
  }
  function _getArgumentSize(aIgnoredLabels) {
    return aIgnoredLabels.length === 1 ? "SINGLE" : "MULTI";
  }
  function _getResourceBundle() {
    return Library.getResourceBundleFor("sap.fe.templates");
  }
  const MessageStripHelper = {
    getALPText: getALPText,
    getText: getText,
    getLabels: getLabels
  };
  return MessageStripHelper;
}, false);
//# sourceMappingURL=MessageStrip-dbg.js.map

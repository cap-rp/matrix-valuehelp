/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["../../helpers/StableIdHelper"], function (StableIdHelper) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  const BASE_ID = ["fe"];

  /**
   * Shortcut to the stableIdHelper providing a "curry" like method where the last parameter is missing.
   * @param sFixedPart
   * @returns A shortcut function with the fixed ID part
   */
  function createIDGenerator() {
    for (var _len = arguments.length, sFixedPart = new Array(_len), _key = 0; _key < _len; _key++) {
      sFixedPart[_key] = arguments[_key];
    }
    return function () {
      for (var _len2 = arguments.length, sIDPart = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        sIDPart[_key2] = arguments[_key2];
      }
      return generate(BASE_ID.concat(...sFixedPart, ...sIDPart));
    };
  }

  /**
   * Those are all helpers to centralize ID generation in the code for different elements
   */
  _exports.createIDGenerator = createIDGenerator;
  const getHeaderFacetID = createIDGenerator("HeaderFacet");
  _exports.getHeaderFacetID = getHeaderFacetID;
  const getHeaderFacetContainerID = createIDGenerator("HeaderFacetContainer");
  _exports.getHeaderFacetContainerID = getHeaderFacetContainerID;
  const getHeaderFacetFormID = createIDGenerator("HeaderFacet", "Form");
  _exports.getHeaderFacetFormID = getHeaderFacetFormID;
  const getCustomHeaderFacetID = createIDGenerator("HeaderFacetCustomContainer");
  _exports.getCustomHeaderFacetID = getCustomHeaderFacetID;
  const getEditableHeaderSectionID = createIDGenerator("EditableHeaderSection");
  _exports.getEditableHeaderSectionID = getEditableHeaderSectionID;
  const getSectionID = createIDGenerator("FacetSection");
  _exports.getSectionID = getSectionID;
  const getCustomSectionID = createIDGenerator("CustomSection");
  _exports.getCustomSectionID = getCustomSectionID;
  const getSubSectionID = createIDGenerator("FacetSubSection");
  _exports.getSubSectionID = getSubSectionID;
  const getCustomSubSectionID = createIDGenerator("CustomSubSection");
  _exports.getCustomSubSectionID = getCustomSubSectionID;
  const getSideContentID = createIDGenerator("SideContent");
  _exports.getSideContentID = getSideContentID;
  const getSideContentLayoutID = function (sSectionID) {
    return generate(["fe", sSectionID, "SideContentLayout"]);
  };
  _exports.getSideContentLayoutID = getSideContentLayoutID;
  const getFormID = createIDGenerator("Form");
  _exports.getFormID = getFormID;
  const getFormContainerID = createIDGenerator("FormContainer");
  _exports.getFormContainerID = getFormContainerID;
  const getFormStandardActionButtonID = function (sFormContainerId, sActionName) {
    return generate(["fe", "FormContainer", sFormContainerId, "StandardAction", sActionName]);
  };
  _exports.getFormStandardActionButtonID = getFormStandardActionButtonID;
  const getTableID = createIDGenerator("table");
  _exports.getTableID = getTableID;
  const getCustomTabID = createIDGenerator("CustomTab");
  _exports.getCustomTabID = getCustomTabID;
  const getFilterBarID = createIDGenerator("FilterBar");
  _exports.getFilterBarID = getFilterBarID;
  const getDynamicListReportID = function () {
    return "fe::ListReport";
  };
  _exports.getDynamicListReportID = getDynamicListReportID;
  const getIconTabBarID = createIDGenerator("TabMultipleMode");
  _exports.getIconTabBarID = getIconTabBarID;
  const getFilterVariantManagementID = function (sFilterID) {
    return generate([sFilterID, "VariantManagement"]);
  };
  _exports.getFilterVariantManagementID = getFilterVariantManagementID;
  const getChartID = createIDGenerator("Chart");
  _exports.getChartID = getChartID;
  const getCustomActionID = function (sActionID) {
    return generate(["CustomAction", sActionID]);
  };
  _exports.getCustomActionID = getCustomActionID;
  const getKPIID = createIDGenerator("KPI");
  _exports.getKPIID = getKPIID;
  return _exports;
}, false);
//# sourceMappingURL=ID-dbg.js.map

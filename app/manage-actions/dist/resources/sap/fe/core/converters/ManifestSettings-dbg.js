/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  // ENUMS
  let TemplateType = /*#__PURE__*/function (TemplateType) {
    TemplateType["ListReport"] = "ListReport";
    TemplateType["ObjectPage"] = "ObjectPage";
    TemplateType["AnalyticalListPage"] = "AnalyticalListPage";
    TemplateType["FreeStylePage"] = "None";
    return TemplateType;
  }({});
  _exports.TemplateType = TemplateType;
  let ActionType = /*#__PURE__*/function (ActionType) {
    ActionType["DataFieldForAction"] = "ForAction";
    ActionType["DataFieldForIntentBasedNavigation"] = "ForNavigation";
    ActionType["Default"] = "Default";
    ActionType["Primary"] = "Primary";
    ActionType["Secondary"] = "Secondary";
    ActionType["SwitchToActiveObject"] = "SwitchToActiveObject";
    ActionType["SwitchToDraftObject"] = "SwitchToDraftObject";
    ActionType["DraftActions"] = "DraftActions";
    ActionType["CollaborationAvatars"] = "CollaborationAvatars";
    ActionType["DefaultApply"] = "DefaultApply";
    ActionType["Menu"] = "Menu";
    ActionType["ShowFormDetails"] = "ShowFormDetails";
    ActionType["Copy"] = "Copy";
    ActionType["Cut"] = "Cut";
    /** This type denotes standard actions like "Create" and "Delete" */
    ActionType["Standard"] = "Standard";
    ActionType["CreateNext"] = "CreateNext";
    return ActionType;
  }({});
  _exports.ActionType = ActionType;
  let SelectionMode = /*#__PURE__*/function (SelectionMode) {
    SelectionMode["Auto"] = "Auto";
    SelectionMode["None"] = "None";
    SelectionMode["Multi"] = "Multi";
    SelectionMode["Single"] = "Single";
    SelectionMode["ForceMulti"] = "ForceMulti";
    SelectionMode["ForceSingle"] = "ForceSingle";
    return SelectionMode;
  }({});
  _exports.SelectionMode = SelectionMode;
  let VariantManagementType = /*#__PURE__*/function (VariantManagementType) {
    VariantManagementType["Page"] = "Page";
    VariantManagementType["Control"] = "Control";
    VariantManagementType["None"] = "None";
    return VariantManagementType;
  }({});
  _exports.VariantManagementType = VariantManagementType;
  let CreationMode = /*#__PURE__*/function (CreationMode) {
    CreationMode["NewPage"] = "NewPage";
    CreationMode["Sync"] = "Sync";
    CreationMode["Async"] = "Async";
    CreationMode["Deferred"] = "Deferred";
    CreationMode["Inline"] = "Inline";
    CreationMode["CreationRow"] = "CreationRow";
    CreationMode["InlineCreationRows"] = "InlineCreationRows";
    CreationMode["External"] = "External";
    CreationMode["CreationDialog"] = "CreationDialog";
    return CreationMode;
  }({});
  _exports.CreationMode = CreationMode;
  let VisualizationType = /*#__PURE__*/function (VisualizationType) {
    VisualizationType["Table"] = "Table";
    VisualizationType["Chart"] = "Chart";
    return VisualizationType;
  }({});
  _exports.VisualizationType = VisualizationType;
  let OperationGroupingMode = /*#__PURE__*/function (OperationGroupingMode) {
    OperationGroupingMode["ChangeSet"] = "ChangeSet";
    OperationGroupingMode["Isolated"] = "Isolated";
    return OperationGroupingMode;
  }({}); // Table
  _exports.OperationGroupingMode = OperationGroupingMode;
  let Importance = /*#__PURE__*/function (Importance) {
    Importance["High"] = "High";
    Importance["Medium"] = "Medium";
    Importance["Low"] = "Low";
    Importance["None"] = "None";
    return Importance;
  }({});
  _exports.Importance = Importance;
  let HorizontalAlign = /*#__PURE__*/function (HorizontalAlign) {
    HorizontalAlign["End"] = "End";
    HorizontalAlign["Begin"] = "Begin";
    HorizontalAlign["Center"] = "Center";
    return HorizontalAlign;
  }({}); // TYPES
  /**
   * Configuration of a KPI in the manifest
   */
  /**
   * @typedef BaseManifestSettings
   */
  /**
   * @typedef NavigationSettingsConfiguration
   */
  /** Object Page */
  /**
   * @typedef ManifestHeaderFacet
   */
  /**
   * @typedef ManifestSection
   */
  /** List Report */
  /**
   * @typedef MultipleViewsConfiguration
   */
  /** Filter Configuration */
  /** @typedef FilterManifestConfiguration */
  /** Chart Configuration */
  /** Table Configuration */
  /**
   * @typedef ManifestAction
   */
  // Can be either Custom Column from Manifest or Slot Column from Building Block
  // For overwriting Annotation Column properties
  /**
   * Collection of format options for multiline text fields on a form or in a table
   */
  _exports.HorizontalAlign = HorizontalAlign;
  return _exports;
}, false);
//# sourceMappingURL=ManifestSettings-dbg.js.map

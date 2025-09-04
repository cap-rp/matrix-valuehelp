/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Return the available designtime settings for a specific object page.
   * @returns The available designtime settings for the current object page
   */
  function getDesigntimeSettings() {
    // Properties for the ObjectPage. Most of these are used by the converter.
    const editableHeaderContent = {
      id: "editableHeaderContent",
      name: "RTA_CONFIGURATION_OP_EHC_NAME",
      description: "RTA_CONFIGURATION_OP_EHC_DESC",
      value: true,
      type: "boolean"
    };
    const variantManagement = {
      id: "variantManagement",
      name: "RTA_CONFIGURATION_OP_VM_NAME",
      description: "RTA_CONFIGURATION_OP_VM_DESC",
      type: "string",
      value: "None",
      enums: [{
        id: "Control",
        name: "RTA_CONFIGURATION_OP_VM_ENUM_CONTROL"
      }, {
        id: "None",
        name: "RTA_CONFIGURATION_OP_VM_ENUM_NONE"
      }],
      keyUser: true
    };
    const sectionLayout = {
      id: "sectionLayout",
      name: "RTA_CONFIGURATION_OP_SL_NAME",
      description: "RTA_CONFIGURATION_OP_SL_DESC",
      type: "string",
      value: "Page",
      enums: [{
        id: "Page",
        name: "RTA_CONFIGURATION_OP_SL_ENUM_PAGE"
      }, {
        id: "Tabs",
        name: "RTA_CONFIGURATION_OP_SL_ENUM_TABS"
      }]
    };
    const visible = {
      id: "visible",
      path: "content/header/visible",
      name: "RTA_CONFIGURATION_OP_VH_NAME",
      description: "RTA_CONFIGURATION_OP_VH_DESC",
      type: "boolean",
      value: true
    };
    const showRelatedApps = {
      id: "showRelatedApps",
      name: "RTA_CONFIGURATION_OP_SR_NAME",
      description: "RTA_CONFIGURATION_OP_SR_DESC",
      type: "boolean",
      value: true
    };
    const openInEditMode = {
      id: "openInEditMode",
      name: "RTA_CONFIGURATION_OP_OE_NAME",
      description: "RTA_CONFIGURATION_OP_OE_DESC",
      type: "boolean",
      value: false
    };
    const additionalSemanticObjects = {
      id: "additionalSemanticObjects",
      name: "RTA_CONFIGURATION_OP_AS_NAME",
      description: "RTA_CONFIGURATION_OP_AS_DESC",
      type: "json",
      value: []
    };
    return [editableHeaderContent, variantManagement, sectionLayout, visible, showRelatedApps, openInEditMode, additionalSemanticObjects];
  }
  /**
   * Returns the values of the settings that are defined for table adaption.
   * @param designtimeSettings Array of the settings for object page
   * @param control Reference to the object page
   * @returns An object containg the settings with values
   */
  _exports.getDesigntimeSettings = getDesigntimeSettings;
  function getAdapationProperties(designtimeSettings, control) {
    const propertyValues = {
      editableHeaderContent: true,
      variantManagement: "None",
      sectionLayout: "Page",
      visible: true,
      showRelatedApps: true,
      openInEditMode: false,
      additionalSemanticObjects: ""
    };

    // Here we are retrieving the viewData from the parent view of the control
    // There is no type/class that has all properties from the object page manifest settings
    // That's why we are using two different constants for the same object
    const viewDataSettings = control.getParent().getViewData();
    const viewDataComponent = control.getParent().getViewData();
    designtimeSettings.forEach(function (setting) {
      switch (setting.id) {
        case "editableHeaderContent":
          propertyValues.editableHeaderContent = viewDataSettings.editableHeaderContent !== undefined ? viewDataSettings.editableHeaderContent : propertyValues.editableHeaderContent;
          break;
        case "variantManagement":
          propertyValues.variantManagement = viewDataSettings.variantManagement !== undefined ? viewDataSettings.variantManagement : propertyValues.variantManagement;
          break;
        case "sectionLayout":
          propertyValues.sectionLayout = viewDataSettings.sectionLayout !== undefined ? viewDataSettings.sectionLayout : propertyValues.sectionLayout;
          break;
        case "visible":
          propertyValues.visible = viewDataSettings.content?.header?.visible !== undefined ? viewDataSettings.content.header.visible : propertyValues.visible;
          break;
        case "showRelatedApps":
          propertyValues.showRelatedApps = viewDataComponent.showRelatedApps !== undefined ? viewDataComponent.showRelatedApps : propertyValues.showRelatedApps;
          break;
        case "openInEditMode":
          propertyValues.openInEditMode = viewDataComponent.openInEditMode !== undefined ? viewDataComponent.openInEditMode : propertyValues.openInEditMode;
          break;
        case "additionalSemanticObjects":
          propertyValues.additionalSemanticObjects = JSON.stringify(viewDataComponent.additionalSemanticObjects);
      }
    });
    return propertyValues;
  }
  /**
   * Returns the values of the settings that are defined for object page adaption.
   * @param propertyValues List of settings and current values provided for object page
   * @returns Content in list form to be used in adapation dialog
   */
  _exports.getAdapationProperties = getAdapationProperties;
  function getSettings(propertyValues) {
    const items = [];
    getDesigntimeSettings().forEach(function (manifestSetting) {
      //Fill model for adaptation settings data
      const settingsData = {
        label: manifestSetting.name,
        tooltip: manifestSetting.description,
        control: [],
        keyUser: manifestSetting.keyUser
      };
      const controlData = {
        type: manifestSetting.type,
        enum: manifestSetting.enums,
        value: propertyValues[manifestSetting.id],
        id: manifestSetting.id
      };
      settingsData.control.push(controlData);
      items.push(settingsData);
    });
    return items;
  }
  _exports.getSettings = getSettings;
  return _exports;
}, false);
//# sourceMappingURL=ObjectPage.designtime.helper-dbg.js.map

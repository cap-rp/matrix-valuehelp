/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/mdc/adapter/StateHelper"], function (StateHelper) {
  "use strict";

  var _exports = {};
  /*!
   * Find the current values of the filterBar configuration that is provided in the filterBar adapt dialog
   */

  function getPropertyPath() {
    return "controlConfiguration/@com.sap.vocabularies.UI.v1.SelectionFields";
  }

  /**
   * Return the available design time settings for the filterBar building block.
   * @returns The available design time settings for this building block
   */
  _exports.getPropertyPath = getPropertyPath;
  function getDesigntimeSettings() {
    // For first implementaton of table design time adaption
    const showClearButton = {
      id: "showClearButton",
      name: "RTA_CONFIGURATION_FILTERBAR_SHOWCLEARBUTTON_NAME",
      description: "RTA_CONFIGURATION_FILTERBAR_SHOWCLEARBUTTON_DESC",
      type: "boolean",
      value: false,
      keyUser: true
    };
    const useSemanticDateRange = {
      id: "useSemanticDateRange",
      name: "RTA_CONFIGURATION_FILTERBAR_USESEMANTICDATERANGE_NAME",
      description: "RTA_CONFIGURATION_FILTERBAR_USESEMANTICDATERANGE_DESC",
      type: "boolean",
      value: true,
      keyUser: true
    };
    const navigationProperties = {
      id: "navigationProperties",
      name: "RTA_CONFIGURATION_FILTERBAR_NAVIGATIONPROPS_NAME",
      description: "RTA_CONFIGURATION_FILTERBAR_NAVIGATIONPROPS_DESC",
      type: "string[]",
      value: []
    };
    return [showClearButton, useSemanticDateRange, navigationProperties];
  }
  /**
   * Returns the values of the settings that are defined for filter bar adaption.
   * @param designtimeSettings Array of the settings for filter bar
   * @param filterBar Reference to the filter bar
   * @param filterBarApi Reference to the filter bar
   * @returns An object containg the settings with values
   */
  _exports.getDesigntimeSettings = getDesigntimeSettings;
  function getAdapationProperties(designtimeSettings, filterBar, filterBarApi) {
    const filterBarInfoForConversion = StateHelper._getControlInfoForConversion(filterBar);
    const propertyValues = {
      showClearButton: false,
      useSemanticDateRange: false,
      navigationProperties: []
    };
    designtimeSettings.forEach(function (setting) {
      switch (setting.id) {
        case "showClearButton":
          propertyValues.showClearButton = filterBarApi.getContent()?.getProperty("showClearButton") || false;
          break;
        case "useSemanticDateRange":
          propertyValues.useSemanticDateRange = filterBarInfoForConversion.useSemanticDateRange || filterBarInfoForConversion.selectionFieldsConfigs?.useSemanticDateRange;
          break;
        case "navigationProperties":
          propertyValues.navigationProperties = filterBarInfoForConversion.selectionFieldsConfigs?.navigationProperties || []; // prevent navigationProperties from being undefined
          break;
      }
    });
    return propertyValues;
  }
  /**
   * Returns the values of the settings that are defined for table adaption.
   * @param filterBar Refernce to selected filter bar
   * @param propertyValues List of settings and current values provided for filter bar
   * @returns Content in list form to be used in adapation dialog
   */
  _exports.getAdapationProperties = getAdapationProperties;
  function getSettings(filterBar, propertyValues) {
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
//# sourceMappingURL=FilterBar.designtime.helper-dbg.js.map

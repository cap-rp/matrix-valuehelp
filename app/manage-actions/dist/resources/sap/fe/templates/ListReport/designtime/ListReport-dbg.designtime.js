/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/designtime/AnnotationBasedChanges", "sap/fe/macros/designtime/Designtime.helper", "sap/fe/templates/ListReport/designtime/ListReport.designtime.helper"], function (CommonUtils, AnnotationBasedChanges, Designtime_helper, ListReport_designtime_helper) {
  "use strict";

  var _exports = {};
  var getSettingsGlobal = ListReport_designtime_helper.getSettingsGlobal;
  var getSettings = ListReport_designtime_helper.getSettings;
  var getGlobalSettingsValues = ListReport_designtime_helper.getGlobalSettingsValues;
  var getGlobalSettingsValue = ListReport_designtime_helper.getGlobalSettingsValue;
  var getGlobalSettings = ListReport_designtime_helper.getGlobalSettings;
  var getDesigntimeSettings = ListReport_designtime_helper.getDesigntimeSettings;
  var separateChanges = Designtime_helper.separateChanges;
  var prepareConfigModel = Designtime_helper.prepareConfigModel;
  var openAdaptionDialog = Designtime_helper.openAdaptionDialog;
  var noChanges = Designtime_helper.noChanges;
  var isConfigModelPrepared = Designtime_helper.isConfigModelPrepared;
  var getSettingsIfKeyUser = Designtime_helper.getSettingsIfKeyUser;
  var getPropertyNamesAndDescriptions = Designtime_helper.getPropertyNamesAndDescriptions;
  var extractChanges = Designtime_helper.extractChanges;
  var getTextArrangementChangeAction = AnnotationBasedChanges.getTextArrangementChangeAction;
  var getText = AnnotationBasedChanges.getText;
  var getRenameAction = AnnotationBasedChanges.getRenameAction;
  function getAdaptationProperties(designtimeSettings, control) {
    const propertyValues = {};
    designtimeSettings.forEach(function (setting) {
      propertyValues[setting.id] = getAdaptationPropertyValue(setting, control);
    });
    return propertyValues;
  }
  /**
   * Returns the value of one of the settings that have been defined for list report adaptation.
   * @param setting The definition of the setting required for adaptation
   * @param control Reference to list report
   * @returns Setting definition with a value for list report
   */
  _exports.getAdaptationProperties = getAdaptationProperties;
  function getAdaptationPropertyValue(setting, control) {
    let returnValue = "";
    const viewData = control.getParent().getViewData();
    switch (setting.id) {
      case "stickyMultiTabHeader":
        returnValue = viewData.stickyMultiTabHeader;
        break;
      case "variantManagement":
        returnValue = viewData.variantManagement;
        break;
      case "initialLoad":
        returnValue = viewData.initialLoad;
        break;
      case "hideFilterBar":
        returnValue = viewData.hideFilterBar;
        break;
      case "useHiddenFilterBar":
        returnValue = viewData.useHiddenFilterBar;
        break;
      case "showCounts":
        returnValue = viewData.views?.showCounts;
        break;
      default:
        returnValue = getGlobalSettingsValue(setting, control);
    }
    return returnValue;
  }
  _exports.getAdaptationPropertyValue = getAdaptationPropertyValue;
  const designTime = {
    actions: {
      annotation: {
        textArrangement: getTextArrangementChangeAction(),
        rename: getRenameAction()
      },
      settings: {
        fe: {
          name: getText("RTA_CONTEXT_ACTIONMENU_CONFIG"),
          icon: "sap-icon://developer-settings",
          handler: async function (control) {
            const designtimeSettings = getDesigntimeSettings();
            const globalSettings = getGlobalSettings();
            const propertyValues = getAdaptationProperties(designtimeSettings, control);
            const globalSettingsValues = getGlobalSettingsValues(globalSettings, control);
            const propertyAndGlobalValues = {
              ...propertyValues,
              ...globalSettingsValues
            };
            const unchangedData = {
              ...globalSettingsValues,
              ...propertyValues
            };
            const configContext = control.getBindingContext("internal");
            if (!isConfigModelPrepared(configContext)) {
              // first time this session
              let items = [];
              let itemsGlobal = [];
              items = getSettings(propertyValues);
              itemsGlobal = getSettingsGlobal(globalSettingsValues);
              items = items.concat(itemsGlobal);
              // sap-fe-rta-mode=true and then Adapt UI
              items = getSettingsIfKeyUser(CommonUtils.getAppComponent(control), items);
              // use internal model to persist adaptation configuration values
              prepareConfigModel(items, configContext);
            }
            const resourceModel = control.getModel("sap.fe.i18n");
            return openAdaptionDialog(configContext, propertyAndGlobalValues, "{sap.fe.i18n>RTA_CONFIGURATION_TITLE_LR}", resourceModel).then(function (propertyValuesEntered) {
              return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, "", control, globalSettings);
            }, noChanges);
          }
        }
      }
    },
    // We disable dynamic page properties in the property panel of Fiori Tools
    properties: {
      backgroundDesign: {
        ignore: true
      },
      blocked: {
        ignore: true
      },
      busy: {
        ignore: true
      },
      busyIndicatorDelay: {
        ignore: true
      },
      busyIndicatorSize: {
        ignore: true
      },
      headerExpanded: {
        ignore: true
      },
      headerPinned: {
        ignore: true
      },
      preserveHeaderStateOnScroll: {
        ignore: true
      },
      showFooter: {
        ignore: true
      },
      toggleHeaderOnTitleClick: {
        ignore: true
      },
      visible: {
        ignore: true
      },
      fitContent: {
        ignore: true
      }
    },
    aggregations: {},
    // These functions provide the properties used in table adaption to Fiori tools.
    manifestSettings: function (control) {
      const globalSettings = getPropertyNamesAndDescriptions(getGlobalSettings(), control.getModel("sap.fe.i18n"));
      const settings = getPropertyNamesAndDescriptions(getDesigntimeSettings(), control.getModel("sap.fe.i18n"));
      return globalSettings.concat(settings);
    },
    // getAdaptionPropertyValue
    manifestSettingsValues: function (designtimeSettings, control) {
      const returnValues = {};
      designtimeSettings.forEach(function (setting) {
        returnValues[setting.id] = getAdaptationPropertyValue(setting, control);
      });
      return returnValues;
    },
    // get path for control configuration. Pass reference to the control
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manifestPropertyPath: function (control) {
      return "";
    },
    // create change structue. Pass array of manifest setting and new value, the property path and the control
    manifestPropertyChange: function (propertyChanges, propertyPath, control) {
      return separateChanges(propertyChanges, propertyPath, control);
    }
  };
  return designTime;
}, false);
//# sourceMappingURL=ListReport-dbg.designtime.js.map

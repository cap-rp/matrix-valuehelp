/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/designtime/AnnotationBasedChanges", "sap/fe/macros/designtime/Designtime.helper", "sap/fe/macros/filterBar/designtime/FilterBar.designtime.helper", "sap/fe/macros/mdc/adapter/StateHelper"], function (CommonUtils, AnnotationBasedChanges, Designtime_helper, FilterBar_designtime_helper, StateHelper) {
  "use strict";

  var _exports = {};
  var getSettings = FilterBar_designtime_helper.getSettings;
  var getPropertyPath = FilterBar_designtime_helper.getPropertyPath;
  var getDesigntimeSettings = FilterBar_designtime_helper.getDesigntimeSettings;
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
  /*!
   */
  const configPath = "rta/filterBarConfigSettings";
  function getAdaptationProperties(designtimeSettings, filterBar, filterBarAPI) {
    const propertyValues = {};
    designtimeSettings.forEach(function (setting) {
      propertyValues[setting.id] = getAdaptationPropertyValue(setting, filterBar, filterBarAPI);
    });
    return propertyValues;
  }

  /**
   * Returns the value of one of the settings that have been defined for filter bar adaptation.
   * @param setting The definition of the setting required for adaptation
   * @param filterBar Reference of the filter bar control
   * @param filterBarApi Reference of the parent of filter bar control
   * @returns Setting definition with a value for selected control
   */
  _exports.getAdaptationProperties = getAdaptationProperties;
  function getAdaptationPropertyValue(setting, filterBar, filterBarApi) {
    let returnValue = "";
    const filterBarInfoForConversion = StateHelper._getControlInfoForConversion(filterBar);
    switch (setting.id) {
      case "showClearButton":
        returnValue = filterBarApi.getContent()?.getProperty("showClearButton") || false;
        break;
      case "useSemanticDateRange":
        returnValue = filterBarInfoForConversion.useSemanticDateRange || filterBarInfoForConversion.selectionFieldsConfigs?.useSemanticDateRange || false;
        break;
      case "navigationProperties":
        returnValue = filterBarInfoForConversion.selectionFieldsConfigs?.navigationProperties || []; // prevent navigationProperties from being undefined
        break;
    }
    return returnValue;
  }
  const FilterBarBlockDesignTime = {
    actions: {
      annotation: {
        textArrangement: getTextArrangementChangeAction(),
        rename: getRenameAction()
      },
      settings: {
        fe: {
          name: getText("RTA_CONTEXT_ACTIONMENU_CONFIG"),
          icon: "sap-icon://developer-settings",
          handler: async function (filterBar) {
            const filterBarApi = filterBar.getParent();
            const designtimeSettings = getDesigntimeSettings();
            const propertyValues = getAdaptationProperties(designtimeSettings, filterBar, filterBarApi);
            const unchangedData = structuredClone(propertyValues); //deep copy to remember the starting value set, needed for the navigation properties multi inhput field
            const configContext = filterBar.getBindingContext("internal");
            if (!isConfigModelPrepared(configContext, configPath)) {
              // first time this session
              let items = getSettings(filterBarApi, propertyValues);
              items = getSettingsIfKeyUser(CommonUtils.getAppComponent(filterBar), items);
              // use internal model to persist adaptation configuration values
              prepareConfigModel(items, configContext, configPath);
            }
            const resourceModel = filterBar.getModel("sap.fe.i18n");
            return openAdaptionDialog(configContext, propertyValues, "{sap.fe.i18n>RTA_CONFIGURATION_TITLE_FILTERBAR}", resourceModel, configPath).then(function (propertyValuesEntered) {
              const propertyPath = getPropertyPath();
              return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, propertyPath, filterBar);
            }, noChanges);
          }
        }
      }
    },
    // We disable mdc filter bar properties in the property panel of Fiori Tools
    properties: {
      showClearButton: {
        ignore: true
      },
      liveMode: {
        ignore: true
      },
      showGoButton: {
        ignore: true
      },
      showMessages: {
        ignore: true
      },
      visible: {
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
      initialLayout: {
        ignore: true
      },
      showAdaptFiltersButton: {
        ignore: true
      }
    },
    aggregations: {},
    // These functions provide the properties used in filter bar adaption to Fiori tools.
    manifestSettings: function (filterBar) {
      return getPropertyNamesAndDescriptions(getDesigntimeSettings(), filterBar.getModel("sap.fe.i18n"));
    },
    // getAdaptionPropertyValue
    manifestSettingsValues: function (designtimeSettings, filterBar) {
      const filterBarApi = filterBar.getParent();
      const returnValues = {};
      designtimeSettings.forEach(function (setting) {
        returnValues[setting.id] = getAdaptationPropertyValue(setting, filterBar, filterBarApi);
      });
      return returnValues;
    },
    // get path for control configuration. Pass reference to the control
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manifestPropertyPath: function (control) {
      return getPropertyPath();
    },
    // create change structue. Pass array of manifest setting and new value, the property path and the control
    manifestPropertyChange: function (propertyChanges, propertyPath, control) {
      return separateChanges(propertyChanges, propertyPath, control);
    }
  };
  return FilterBarBlockDesignTime;
}, false);
//# sourceMappingURL=FilterBar-dbg.designtime.js.map

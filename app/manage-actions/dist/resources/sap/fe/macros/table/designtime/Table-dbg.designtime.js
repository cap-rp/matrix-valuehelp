/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/designtime/AnnotationBasedChanges", "sap/fe/macros/designtime/Designtime.helper", "sap/fe/macros/table/designtime/Table.designtime.helper"], function (CommonUtils, AnnotationBasedChanges, Designtime_helper, Table_designtime_helper) {
  "use strict";

  var _exports = {};
  var getPropertyPath = Table_designtime_helper.getPropertyPath;
  var getDesigntimeSettings = Table_designtime_helper.getDesigntimeSettings;
  var separateChanges = Designtime_helper.separateChanges;
  var prepareConfigModel = Designtime_helper.prepareConfigModel;
  var openAdaptionDialog = Designtime_helper.openAdaptionDialog;
  var noChanges = Designtime_helper.noChanges;
  var isConfigModelPrepared = Designtime_helper.isConfigModelPrepared;
  var getSettingsIfKeyUser = Designtime_helper.getSettingsIfKeyUser;
  var getPropertyNamesAndDescriptions = Designtime_helper.getPropertyNamesAndDescriptions;
  var getPersonalizationSetting = Designtime_helper.getPersonalizationSetting;
  var extractChanges = Designtime_helper.extractChanges;
  var getTextArrangementChangeAction = AnnotationBasedChanges.getTextArrangementChangeAction;
  var getText = AnnotationBasedChanges.getText;
  var getRenameAction = AnnotationBasedChanges.getRenameAction;
  /*!
   * Find the current values of the table configuration that is provided in the table adapt dialog
   */
  // Don't pass these properties to fiori tools processing for the control panel for table. Currently the combination
  // of boolean property plus further option of fixed list is not supported
  const itemsToRemove = ["personalization", "personalizationSort", "personalizationColumn", "personalizationFilter", "personalizationGroup", "personalizationAggregate"];
  function getAdaptationProperties(designtimeSettings, control) {
    const propertyValues = {};
    designtimeSettings.forEach(function (setting) {
      propertyValues[setting.id] = getAdaptationPropertyValue(control, setting);
    });
    return propertyValues;
  }
  /**
   * Returns the value of one of the settings that have been defined for table adaptation.
   * @param control Reference to selected table
   * @param setting The definition of the setting required for adaptation
   * @returns Setting definition with a value for selected control
   */
  _exports.getAdaptationProperties = getAdaptationProperties;
  function getAdaptationPropertyValue(control, setting) {
    const table = control.getParent();
    const tableDefinition = table.getProperty("tableDefinition");
    let returnValue = "";
    switch (setting.id) {
      case "headerVisible":
        returnValue = tableDefinition.headerVisible;
        break;
      case "header":
        returnValue = tableDefinition.header;
        break;
      case "enableFullScreen":
        returnValue = tableDefinition.control.enableFullScreen;
        break;
      case "enableExport":
        returnValue = tableDefinition.control.enableExport;
        break;
      case "type":
        returnValue = control.data("tableType");
        break;
      case "creationModeName":
        returnValue = tableDefinition.control.creationMode;
        break;
      case "creationModeCreateAtEnd":
        returnValue = tableDefinition.control.createAtEnd;
        break;
      case "frozenColumnCount":
        returnValue = tableDefinition.control.frozenColumnCount;
        break;
      case "showCounts":
        returnValue = tableDefinition.control.filters?.quickFilters?.showCounts;
        break;
      /* case "hideTableTitle":
      	propertyValues.hideTableTitle = tableDefinition.control.filters?.quickFilters && !tableDefinition.control.headerVisible;
      	break; */
      case "personalization":
        returnValue = control.getP13nMode().length === 0 ? "False" : "True";
        break;
      case "personalizationSort":
        returnValue = control.getP13nMode().includes("Sort");
        break;
      case "personalizationColumn":
        returnValue = control.getP13nMode().includes("Column");
        break;
      case "personalizationFilter":
        returnValue = control.getP13nMode().includes("Filter");
        break;
      case "personalizationGroup":
        returnValue = control.getP13nMode().includes("Group");
        break;
      case "personalizationAggregate":
        returnValue = control.getP13nMode().includes("Aggregate");
        break;
      case "rowCount":
        returnValue = tableDefinition.control.rowCount;
        break;
      case "rowCountMode":
        returnValue = tableDefinition.control.rowCountMode;
        break;
      case "condensedTableLayout":
        returnValue = tableDefinition.control.useCondensedTableLayout;
        break;
      case "widthIncludingColumnHeader":
        returnValue = tableDefinition.control.widthIncludingColumnHeader;
        break;
      case "selectionMode":
        returnValue = tableDefinition.annotation.selectionMode;
        break;
      case "selectAll":
        returnValue = tableDefinition.control.selectionLimit === 0;
        break;
      case "scrollThreshold":
        returnValue = tableDefinition.control.scrollThreshold;
        break;
      case "selectionLimit":
        returnValue = tableDefinition.control.selectionLimit;
        break;
      case "hierarchyQualifier":
        returnValue = tableDefinition.control.hierarchyQualifier;
        break;
      case "enableMassEdit":
        returnValue = tableDefinition.control.massEdit.enabled;
        break;
      case "enableMassEditVisibleFields":
        returnValue = tableDefinition.control.massEdit.visibleFields;
        break;
      case "enableMassEditIgnoredFields":
        returnValue = tableDefinition.control.massEdit.ignoreFields;
        break;
      case "enableAddCardToInsights":
        returnValue = tableDefinition.control.enableAddCardToInsights;
        break;
      case "beforeRebindTable":
        returnValue = tableDefinition.control.beforeRebindTable;
        break;
      case "selectionChange":
        returnValue = tableDefinition.control.selectionChange;
        break;
    }
    return returnValue;
  }
  /**
   * Returns the settings and values for a table formatted for the adaptation dialog content.
   * @param tableAPI Reference to selected table
   * @param propertyValues The list of properties and values for the selected table
   * @returns Formatted list for the adaptation dialog
   */
  function getSettings(tableAPI, propertyValues) {
    const items = [];
    getDesigntimeSettings(tableAPI).forEach(function (manifestSetting) {
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
  const configPath = "rta/configSettings";
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
            const tableAPI = control.getParent();
            const designtimeSettings = getDesigntimeSettings(tableAPI);
            const propertyValues = getAdaptationProperties(designtimeSettings, control);
            const unchangedData = {
              ...propertyValues
            };
            const configContext = control.getBindingContext("internal");
            if (!isConfigModelPrepared(configContext, configPath)) {
              // first time this session
              let items = getSettings(tableAPI, propertyValues);
              items = getSettingsIfKeyUser(CommonUtils.getAppComponent(control), items);
              // use internal model to persist adaptation configuration values
              prepareConfigModel(items, configContext, configPath);
            } else {
              // set personalization to 'Own Settings' if that was chosen previously
              // as this setting cannot be retrived from the control, and will be always true if personalization is enabled
              propertyValues.personalization = getPersonalizationSetting(configContext);
            }
            const resourceModel = control.getModel("sap.fe.i18n");
            return openAdaptionDialog(configContext, propertyValues, "{sap.fe.i18n>RTA_CONFIGURATION_TITLE_TABLE}", resourceModel, configPath, "{sap.fe.i18n>RTA_CONFIGURATION_INFO_MESSAGE_TABLE}", {
              width: "650px",
              height: "800px"
            }).then(function (propertyValuesEntered) {
              const propertyPath = getPropertyPath(control.getParent());
              return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, propertyPath, control);
            }, noChanges);
          }
        }
      }
    },
    // We disable mdc table properties in the property panel of Fiori Tools
    properties: {
      busyIndicatorDelay: {
        ignore: true
      },
      enableColumnResize: {
        ignore: true
      },
      enableExport: {
        ignore: true
      },
      header: {
        ignore: true
      },
      headerLevel: {
        ignore: true
      },
      headerVisible: {
        ignore: true
      },
      multiSelectMode: {
        ignore: true
      },
      showPasteButton: {
        ignore: true
      },
      showRowCount: {
        ignore: true
      },
      threshold: {
        ignore: true
      },
      width: {
        ignore: true
      }
    },
    aggregations: {},
    // These functions provide the properties used in table adaption to Fiori tools.
    manifestSettings: function (control) {
      const table = control.getParent();
      const designtimeSettings = getDesigntimeSettings(table).filter(item => !itemsToRemove.includes(item.id));
      return getPropertyNamesAndDescriptions(designtimeSettings, control.getModel("sap.fe.i18n"));
    },
    // getAdaptionPropertyValue
    manifestSettingsValues: function (designtimeSettings, control) {
      const returnValues = {};
      designtimeSettings.forEach(function (setting) {
        let propertyIndex;
        if (setting.path) {
          propertyIndex = setting.path;
        } else {
          propertyIndex = setting.id;
        }
        returnValues[propertyIndex] = getAdaptationPropertyValue(control, setting);
      });
      return returnValues;
    },
    // get path for control configuration. Pass reference to the control
    manifestPropertyPath: function (control) {
      const table = control.getParent();
      return getPropertyPath(table);
    },
    // create change structue. Pass array of manifest setting and new value, the property path and the control
    manifestPropertyChange: function (propertyChanges, propertyPath, control) {
      return separateChanges(propertyChanges, propertyPath, control);
    }
  };
  return designTime;
}, false);
//# sourceMappingURL=Table-dbg.designtime.js.map

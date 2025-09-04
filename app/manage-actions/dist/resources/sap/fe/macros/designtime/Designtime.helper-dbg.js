/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/fe/core/CommonUtils", "sap/m/Button", "sap/m/CheckBox", "sap/m/Dialog", "sap/m/Input", "sap/m/InputListItem", "sap/m/List", "sap/m/MessageStrip", "sap/m/MultiInput", "sap/m/Select", "sap/m/Token", "sap/ui/core/Item", "sap/ui/model/json/JSONModel"], function (deepClone, CommonUtils, Button, CheckBox, Dialog, Input, InputListItem, List, MessageStrip, MultiInput, Select, Token, Item, JSONModel) {
  "use strict";

  var _exports = {};
  /*!
   * Reuse functions for designtime adaption
   */
  /**
   * Identify which settings have changed.
   * @param designtimeSettings
   * @param unchangedData
   * @param propertyValues
   *  @returns The configuration properties where the values have been changed compared to the starting values
   */
  function getChangedPropertyValues(designtimeSettings, unchangedData, propertyValues) {
    const propertyChanges = {};
    designtimeSettings.forEach(function (setting) {
      if (typeof unchangedData[setting.id] !== "object" && unchangedData[setting.id] !== propertyValues[setting.id] || typeof unchangedData[setting.id] === "object" && JSON.stringify(unchangedData[setting.id]) !== JSON.stringify(propertyValues[setting.id])) {
        if (setting.writeObject && propertyValues[setting.id] === setting.writeObjectFor) {
          // We write an object for this setting
          const changeObject = {};
          if (setting.writeObject && setting.writeObject?.length > 0) {
            setting.writeObject.forEach(function (settingsTogether) {
              changeObject[settingsTogether.path ? settingsTogether.path : settingsTogether.id] = propertyValues[settingsTogether.id];
            });
          }
          propertyChanges[setting.path ? setting.path : setting.id] = changeObject;
        } else if (!setting.skipChange) {
          propertyChanges[setting.path ? setting.path : setting.id] = propertyValues[setting.id];
        }
      }
    });
    return propertyChanges;
  }
  /**
   * Convert sap.fe change into a structure required by the flexibility tools.
   * @param appComponent
   * @param page
   * @param propertyPath
   * @param propertyChanges
   * @returns The change structure used by flexibility tools
   */
  _exports.getChangedPropertyValues = getChangedPropertyValues;
  function getChangeStructure(appComponent, page, propertyPath, propertyChanges) {
    return {
      appComponent: appComponent,
      selector: appComponent,
      changeSpecificData: {
        appDescriptorChangeType: "appdescr_fe_changePageConfiguration",
        content: {
          parameters: {
            page: page,
            entityPropertyChange: {
              propertyPath: propertyPath,
              operation: "UPSERT",
              propertyValue: propertyChanges
            }
          }
        }
      }
    };
  }
  _exports.getChangeStructure = getChangeStructure;
  function setLocalText(item, resourceModel) {
    for (const key in item) {
      if (key !== "id" && typeof item[key] === "string") {
        item[key] = resourceModel.getText(item[key]);
      }
    }
  }
  function setLocalTexts(model, resourceModel) {
    const settingsData = model.getData();
    settingsData.forEach(setting => {
      setLocalText(setting, resourceModel);
      setting.control.forEach(controlData => {
        setLocalText(controlData, resourceModel);
        controlData.enum?.forEach(enumData => {
          setLocalText(enumData, resourceModel);
        });
      });
    });
  }
  function createAdaptionDialogContent(configContext, propertyValues, resourceModel) {
    let configPath = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "rta/configSettings";
    const settingsModel = new JSONModel();
    settingsModel.setData(deepClone(configContext.getProperty(configPath)));
    setLocalTexts(settingsModel, resourceModel);
    const list = new List();
    list.setModel(settingsModel);
    const listItem = new InputListItem({
      label: "{label}"
    });
    listItem.bindContent({
      path: "control",
      factory: function (path, context) {
        const type = context.getProperty("type");
        const id = context.getProperty("id");
        switch (type) {
          case "string":
            if (context.getProperty("enum")) {
              // Create a select list for multiple options to select
              const item = new Item({
                text: "{name}",
                key: "{id}"
              });
              const select = new Select({
                selectedKey: "{value}",
                change: function (event) {
                  propertyValues[this.data("id")] = event.getParameter("selectedItem").getKey();
                }
              }).data("id", id);
              select.bindItems({
                path: "enum",
                template: item
              });
              return select;
            } else {
              // Create an Input for text changes
              return new Input({
                value: "{value}",
                change: function (event) {
                  propertyValues[this.data("id")] = event.getParameter("value");
                }
              }).data("id", id);
            }
          case "string[]":
            // Create an multi input field for the navigation properties
            const oMultiInput = new MultiInput({
              width: "70%",
              showValueHelp: false,
              showClearIcon: true,
              tokens: (propertyValues?.navigationProperties).map(navigationProperty => {
                return new Token({
                  text: navigationProperty,
                  key: navigationProperty
                });
              }),
              tokenUpdate: function (event) {
                const array = propertyValues[this.data("id")];
                if (event.getParameter("addedTokens")?.length > 0) {
                  array.push((event?.getParameter("addedTokens"))[0]?.getProperty("key"));
                } else if (event.getParameter("removedTokens")?.length > 0) {
                  array.splice(array.indexOf((event?.getParameter("removedTokens"))[0]?.getProperty("key")), 1);
                }
              }
            }).data("id", id);
            oMultiInput.addValidator(function (args) {
              const text = args.text;
              return new Token({
                key: text,
                text: text
              });
            });
            return oMultiInput;
          case "number":
            // Create an Input for number changes
            return new Input({
              value: "{value}",
              type: "Number",
              change: function (event) {
                propertyValues[this.data("id")] = event.getParameter("value");
              }
            }).data("id", id);
          case "boolean":
            // Create a checkbox for true/false values
            return new CheckBox({
              selected: "{value}",
              select: function (event) {
                propertyValues[this.data("id")] = event.getParameter("selected");
              }
            }).data("id", id);
          case "booleanOrString":
            // Create a select list for boolean and string options to select
            // This type is at the moment only used for personalization settings which can be undefined, true, false or an object
            // The select list is used to select between true, false and "Own Settings"
            // If "Own Settings" is selected, the personalization object is written, otherwise the boolean is written (undefined cannot be written in a manifest change)
            const item = new Item({
              text: "{name}",
              key: "{id}"
            });
            const select = new Select({
              selectedKey: "{value}",
              change: function (event) {
                let value = event.getParameter("selectedItem").getKey();
                // Convert string to boolean if necessary
                if (value.toLowerCase() === "false" || value.toLowerCase() === "true") {
                  value = JSON.parse(value.toLowerCase());
                }
                propertyValues[this.data("id")] = value;
              }
            }).data("id", id);
            select.bindItems({
              path: "enum",
              template: item
            });
            return select;
          case "json":
            // Create an input for json object descriptions
            // A text area would have been better but this does not work with the InputListItem
            // we would have needed a CustomListItem instead
            // which would have been too much effort as we would have needed to change the whole structure
            return new Input({
              value: "{value}",
              change: function (event) {
                propertyValues[this.data("id")] = JSON.parse(event.getParameter("value")?.toString());
              }
            }).data("id", id);
          default:
            break;
        }
      }
    });
    list.bindItems({
      path: "/",
      template: listItem
    });
    return list;
  }
  _exports.createAdaptionDialogContent = createAdaptionDialogContent;
  async function openAdaptionDialog(configContext, propertyValues, title, resourceModel) {
    let configPath = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "rta/configSettings";
    let infoText = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "{sap.fe.i18n>RTA_CONFIGURATION_INFO_MESSAGE}";
    let size = arguments.length > 6 ? arguments[6] : undefined;
    const list = createAdaptionDialogContent(configContext, propertyValues, resourceModel, configPath);
    const content = [];
    const informationMessage = new MessageStrip({
      showIcon: true,
      type: "Information",
      text: infoText
    });
    informationMessage.addStyleClass("sapUiSmallMarginBottom");
    content.push(informationMessage);
    content.push(list);
    const listIndex = content.indexOf(list);
    return new Promise(function (resolve, reject) {
      const dialog = new Dialog({
        title: title,
        contentWidth: size ? size.width : "550px",
        contentHeight: size ? size.height : "300px",
        content: content,
        buttons: [new Button({
          text: "{sap.fe.i18n>RTA_CONFIGURATION_APPLY}",
          type: "Emphasized",
          press: function () {
            // persist changes done
            updateConfigModel(configContext, dialog.getContent()[listIndex].getModel(), configPath);
            dialog.close();
            resolve(propertyValues);
          }
        }), new Button({
          text: "{sap.fe.i18n>RTA_CONFIGURATION_CANCEL}",
          press: function () {
            dialog.close();
            reject();
          }
        })]
      });
      dialog.setModel(resourceModel, "sap.fe.i18n");
      dialog.addStyleClass("sapUiContentPadding");
      dialog.addStyleClass("sapUiRTABorder");
      dialog.open();
      return;
    });
  }
  _exports.openAdaptionDialog = openAdaptionDialog;
  function processChanges(propertyChanges, appComponent, page, propertyPath) {
    let singleChange = {};
    const changes = [];
    for (const [key, value] of Object.entries(propertyChanges)) {
      singleChange = {};
      singleChange[key] = value;
      changes.push(getChange(singleChange, appComponent, page, propertyPath));
    }
    return changes;
  }

  /**
   * Format each change made to global settings "sap.fe"
   * The set of changes are put into individual changes to ensure
   * that earlier changes are not lost when these are loaded at runtime.
   * @param propertyChanges
   * @param appComponent
   * @param page
   * @param propertyPath
   * @returns The change structure used by flexibility tools
   */
  _exports.processChanges = processChanges;
  function processGlobalChanges(propertyChanges, appComponent, page, propertyPath) {
    let singleChange = {};
    const changes = [];
    for (const [key, value] of Object.entries(propertyChanges)) {
      singleChange = {};
      singleChange[key] = value;
      changes.push(getChange(singleChange, appComponent, page, propertyPath));
    }
    return changes;
  }
  _exports.processGlobalChanges = processGlobalChanges;
  function getChange(propertyChanges, appComponent, page, propertyPath) {
    // Changes for controls have a path starting with controlConfiguration, followed by an annotation path
    // For the list report changes, there is no path because the properties are directly under Settings
    // for the "sap.fe.templates.ListReport" in the manifest.
    if (propertyPath === "") {
      propertyPath = Object.keys(propertyChanges)[0];
    } else {
      propertyPath = propertyPath + "/" + Object.keys(propertyChanges)[0];
    }
    const value = propertyChanges[Object.keys(propertyChanges)[0]];
    return getChangeStructure(appComponent, page, propertyPath, value);
  }

  /**
   * Get the parameters other than the control settings that are needed
   * for the change structure.
   * @param propertyChanges
   * @param propertyPath
   * @param control
   * @returns The changes in a structure used by flexibility tools
   */
  _exports.getChange = getChange;
  function separateChanges(propertyChanges, propertyPath, control) {
    const appComponent = CommonUtils.getAppComponent(control);
    const page = getPage(control.getParent());
    return processChanges(propertyChanges, appComponent, page, propertyPath);
  }

  /**
   * Get the parameters other than the global settings that are needed
   * for the change structure.
   * @param propertyChanges
   * @param propertyPath
   * @param control
   * @returns The changes in a structure used by flexibility tools
   */
  _exports.separateChanges = separateChanges;
  function separateGlobalChanges(propertyChanges, propertyPath, control) {
    const appComponent = CommonUtils.getAppComponent(control);
    const page = "sap.fe";
    return processGlobalChanges(propertyChanges, appComponent, page, propertyPath);
  }
  function getPage(control) {
    const viewId = CommonUtils.getTargetView(control).getId().split("::");
    return viewId[viewId.length - 1];
  }
  const extractChanges = function (designtimeSettings, unchangedData, propertyValuesEntered, propertyPath, control, globalSettings) {
    const propertyChanges = getChangedPropertyValues(designtimeSettings, unchangedData, propertyValuesEntered);
    // Put each property into its own change. This ensures that we don't lose previous changes.
    let changes = separateChanges(propertyChanges, propertyPath, control);
    if (globalSettings) {
      const globalChanges = getChangedPropertyValues(globalSettings, unchangedData, propertyValuesEntered);
      const global = separateGlobalChanges(globalChanges, propertyPath, control);
      changes = changes.concat(global);
    }
    if (changes.length > 0) {
      return changes;
    } else {
      return [];
    }
  };
  _exports.extractChanges = extractChanges;
  const noChanges = function () {
    return [];
  };
  _exports.noChanges = noChanges;
  function isFioriToolsRtaMode(appComponent) {
    // Check if rta mode has been specified on url (for local testing)
    let urlParams = {};
    const shellService = appComponent.getShellServices();
    urlParams = shellService?.parseParameters?.(window.location.search);
    return !!urlParams && urlParams["fiori-tools-rta-mode"]?.[0] === "forAdaptation";
  }
  _exports.isFioriToolsRtaMode = isFioriToolsRtaMode;
  function isRTAMode(appComponent) {
    // Check if rta mode has been specified on url (for local testing)
    let urlParams = {};
    const shellService = appComponent.getShellServices();
    urlParams = shellService?.parseParameters?.(window.location.search);
    return !!urlParams && urlParams["sap-fe-rta-mode"]?.[0] === "true";
  }
  _exports.isRTAMode = isRTAMode;
  function getSettingsIfKeyUser(appComponent, items) {
    if (!isFioriToolsRtaMode(appComponent)) {
      // not tools => key user
      return items.filter(setting => {
        return setting.keyUser;
      });
    }
    return items;
  }
  _exports.getSettingsIfKeyUser = getSettingsIfKeyUser;
  function isConfigModelPrepared(configContext) {
    let path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "rta/configSettings";
    if (configContext.getProperty(path)) {
      return true;
    }
    return false;
  }
  _exports.isConfigModelPrepared = isConfigModelPrepared;
  function prepareConfigModel(items, configContext) {
    let path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "rta/configSettings";
    if (!configContext.getProperty(path)) {
      configContext.setProperty(path, items);
    }
  }
  _exports.prepareConfigModel = prepareConfigModel;
  function getPersonalizationSetting(configContext) {
    let path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "rta/configSettings";
    const settings = configContext.getObject(path);
    const personalizationSetting = settings.find(setting => {
      return setting?.control[0]?.id === "personalization";
    });
    if (personalizationSetting) {
      return personalizationSetting.control[0].value;
    }
    return undefined;
  }
  _exports.getPersonalizationSetting = getPersonalizationSetting;
  function updateConfigModel(configContext, settingsModel) {
    let path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "rta/configSettings";
    const updatedSettings = deepClone(settingsModel.getData());
    configContext.setProperty(path, updatedSettings);
  }
  _exports.updateConfigModel = updateConfigModel;
  function getPropertyNamesAndDescriptions(props, resourceModel) {
    props.forEach(function (prop) {
      prop.name = resourceModel.getText(prop.name);
      prop.description = resourceModel.getText(prop.description);
      if (prop.enums) {
        prop.enums.forEach(function (enumm) {
          enumm.name = resourceModel.getText(enumm.name);
        });
      }
    });
    return props;
  }
  _exports.getPropertyNamesAndDescriptions = getPropertyNamesAndDescriptions;
  return _exports;
}, false);
//# sourceMappingURL=Designtime.helper-dbg.js.map

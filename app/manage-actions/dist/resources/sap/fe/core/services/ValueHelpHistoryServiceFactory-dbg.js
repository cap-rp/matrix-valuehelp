/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/i18n/Localization", "sap/fe/core/services/valueHelpService/HistoryOptOutProvider", "sap/ui/core/EventBus", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Localization, HistoryOptOutProvider, EventBus, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  //
  // Some remarks:
  // To store history data in LREP via ushell personalisation service, we use the same data structures as in V2:
  // - "Global" History Data: A mapping from appId to a uuid-like containerID; and a user-specific 'history enabled' switch
  // - App History Data: A mapping from container ID to the valuehelp fields and its history data
  // To avoid backend calls, we cache the data also in the class.
  //

  const APP_LANGUAGE = "@AppLanguage";

  /**
   * @interface IValueHelpHistoryService
   */
  /**
   * Base implementation of the ValueHelpHistoryService
   *
   */
  let ValueHelpHistoryService = /*#__PURE__*/function (_Service) {
    function ValueHelpHistoryService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.ValueHelpHistoryService = ValueHelpHistoryService;
    _inheritsLoose(ValueHelpHistoryService, _Service);
    var _proto = ValueHelpHistoryService.prototype;
    /**
     * Constructor for the class.
     */
    _proto.init = function init() {}

    /**
     * Initialize the history service.
     * It checks the enablement of the history service and starts the creation of the History opt-out dialog.
     * @returns Promise that is resolved when environment service and shell service are checked.
     */;
    _proto.initialize = async function initialize() {
      const context = this.getContext(),
        appComponent = context.scopeObject;
      try {
        const [environmentCapabilities, shellServices] = await Promise.all([appComponent.getService("environmentCapabilities"), appComponent.getService("shellServices")]);
        this.shellServices = shellServices;
        this.appId = appComponent.getManifestEntry("sap.app").id || "unknownAppId";
        const hasUshell = environmentCapabilities.getCapabilities().UShell,
          enabled = shellServices.getShellConfig()?.apps?.inputFieldHistory?.enabled;
        if (hasUshell && enabled) {
          this.historyOptOutProvider = new HistoryOptOutProvider(this);
        }
      } catch (err) {
        Log.error("Cannot retrieve EnvironmentCapabilities or ShellServices", err instanceof Error ? err.message : String(err));
      }
      return this;
    }

    /**
     * Register the dedicated menu in the shell to maintain user preferences.
     */;
    _proto.registerShellHook = async function registerShellHook() {
      if (this.historyOptOutProvider) {
        await this.historyOptOutProvider.createOptOutUserProfileEntry();

        // If the mneu was never loaded, on first load it removes all the custom actions
        EventBus.getInstance().subscribeOnce("shell", "userActionsMenuCompLoaded", async () => {
          await this.historyOptOutProvider.createOptOutUserProfileEntry();
        });
      }
    }

    /**
     * Get the shell extension service.
     * This is used by the HistOptOutProvider to add a user menu entry.
     * @returns Shell extension service
     */;
    _proto.getShellExtensionService = function getShellExtensionService() {
      return this.shellServices.getExtensionService();
    }

    /**
     * Get the personalizer from the shell service.
     * @param containerId The container ID to access the personalization data
     * @param itemId The item ID to access the personalization data
     * @returns Personalizer from the shell service
     */;
    _proto.getPersonalizer = async function getPersonalizer(containerId, itemId) {
      const persIdObj = {
          container: containerId,
          item: itemId
        },
        scope = {}; // use defaults from shellServices

      return this.shellServices.getPersonalizer(persIdObj, scope, undefined);
    }

    //
    // The following methodsare based on: sap\ui\comp\historyvalues\HistoryGlobalDataService.js
    //

    /**
     * Get the global personalizer from the shell service and store it in this class.
     * @returns Global personalizer from the shell service
     */;
    _proto.getGlobalPersonalizer = async function getGlobalPersonalizer() {
      if (!this.globalPersonalizer) {
        const historyPrefix = "sapui5.history.";
        const containerId = historyPrefix + "HistorySettings";
        const itemId = historyPrefix + "settings";
        this.globalPersonalizer = await this.getPersonalizer(containerId, itemId);
      }
      return this.globalPersonalizer;
    }

    /**
     * Get the global history default data.
     * This is the initial data structure if no global history data is stored yet.
     * @returns Global history default data
     */;
    _proto.getGlobalDefaultData = function getGlobalDefaultData() {
      return {
        historyEnabled: true,
        suggestionsEnabled: false,
        apps: {}
      };
    }

    /**
     * Get the global history data from the personalization service or create default data.
     * @returns Promise which is resolved to global history data
     */;
    _proto.getGlobalHistoryData = async function getGlobalHistoryData() {
      if (!this.globalHistoryData) {
        const globalPersonalizer = await this.getGlobalPersonalizer();
        const persData = await globalPersonalizer.getPersData();
        this.globalHistoryData = persData ? {
          ...persData
        } : this.getGlobalDefaultData();
      }
      return this.globalHistoryData;
    }

    /**
     * Get the status of the user-specific history enabled switch from the global history data.
     * @returns Promise which is resolved to a boolean value for the history enabled switch
     */;
    _proto.getHistoryEnabled = async function getHistoryEnabled() {
      // The history enabled switch which can be changed in the 'Input History Settings' dialog.
      const globalHistoryData = await this.getGlobalHistoryData();
      return globalHistoryData.historyEnabled;
    }

    /**
     * Set the the status of the user-specific history enabled switch in the global history data.
     * @param enabled A boolean value for the history enabled switch
     * @returns Promise which is resolved when the status is changed in the personalization data
     */;
    _proto.setHistoryEnabled = async function setHistoryEnabled(enabled) {
      const globalHistoryData = await this.getGlobalHistoryData();
      globalHistoryData.historyEnabled = enabled;
      const globalPersonalizer = await this.getGlobalPersonalizer();
      globalPersonalizer.setPersData(globalHistoryData);
    }

    //
    // The following methodsare based on: sap\ui\comp\historyvalues\HistoryAppDataService.js
    //

    /**
     * Create a random UUID-like container ID.
     * @returns Container ID
     */;
    ValueHelpHistoryService.createAppContainerId = function createAppContainerId() {
      // Here we use the same coding as in V2 to create a random UUID-like container ID
      const uuid = "xxxxxxxx.xxxx.4xxx.yxxx.xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
        let random = Math.random() * 16 | 0;
        if (char === "y") {
          random = random & 0x3 | 0x8;
        }
        return random.toString(16);
      });
      return "ui5." + uuid;
    }

    /**
     * Add an entry for an app ID to the global history data.
     * The entry is a mapping for an app ID to a container ID.
     * @param globalHistoryData The global history data structure
     * @param appId The app ID
     * @returns Newly created container ID
     */;
    _proto.addAppToGlobalHistory = async function addAppToGlobalHistory(globalHistoryData, appId) {
      const containerId = ValueHelpHistoryService.createAppContainerId();
      globalHistoryData.apps[appId] = containerId;
      const globalPersonalizer = await this.getGlobalPersonalizer();
      globalPersonalizer.setPersData(globalHistoryData);
      return containerId;
    }

    /**
     * Get the app personalizer from the shell service and store it in this class.
     * @returns Promise which is resolved to the app personalizer from the shell service.
     */;
    _proto.getAppPersonalizer = async function getAppPersonalizer() {
      if (!this.appPersonalizer) {
        const globalHistoryData = await this.getGlobalHistoryData(),
          apps = globalHistoryData.apps,
          containerId = apps[this.appId] || (await this.addAppToGlobalHistory(globalHistoryData, this.appId)),
          itemId = "sapui5.history.appData";
        this.appPersonalizer = await this.getPersonalizer(containerId, itemId);
      }
      return this.appPersonalizer;
    }

    /**
     * Get the app-specific history default data.
     * This is the initial data structure if no app history data is stored yet.
     * @returns App history default data
     */;
    _proto.getAppDefaultData = function getAppDefaultData() {
      const appHistoryData = {};
      appHistoryData[ValueHelpHistoryService.appDataKey] = {};
      return appHistoryData;
    }

    /**
     * Get the app-specific history data from the personalization service or create default data.
     * @returns Promise which is resolved to app history data
     */;
    _proto.getAppHistoryData = async function getAppHistoryData() {
      if (!this.appHistoryData) {
        const appPersonalizer = await this.getAppPersonalizer(),
          persData = await appPersonalizer.getPersData?.();
        this.appHistoryData = persData ? {
          ...persData
        } : this.getAppDefaultData(); // In V2 the data is copied. Do we need to copy it?
      }
      return this.appHistoryData;
    }

    /**
     * Get the field data for a field path from the personalization service.
     * @param fieldPath The field path
     * @returns Promise which is resolved to a list of field data
     */;
    _proto.getFieldDataFromService = async function getFieldDataFromService(fieldPath) {
      const appHistoryData = await this.getAppHistoryData(),
        appData = appHistoryData[ValueHelpHistoryService.appDataKey],
        fieldData = appData[fieldPath];

      // remove entries with different language
      const appLanguage = Localization.getLanguage();
      return fieldData?.filter(data => data[APP_LANGUAGE] === appLanguage) || [];
    }

    /**
     * Set the field data for a field path in the personalization service.
     * @param fieldPath The field path
     * @param data List of field data
     * @returns Promise which is resolved when the field data is set
     */;
    _proto.setFieldDataWithService = async function setFieldDataWithService(fieldPath, data) {
      const historyAppData = await this.getAppHistoryData(),
        appData = historyAppData[ValueHelpHistoryService.appDataKey],
        appPersonalizer = await this.getAppPersonalizer();
      appData[fieldPath] = data;
      return appPersonalizer.setPersData(historyAppData);
    }

    /**
     * Get a field data list with distinct entries.
     * @param dataList A list of field data with possible duplicate entries
     * @returns List of field data with distinct enrtries
     */;
    ValueHelpHistoryService.getDistinct = function getDistinct(dataList) {
      const uniqueFlags = {},
        distinct = [];
      for (const data of dataList) {
        const key = Object.values(data).join();
        if (!uniqueFlags[key]) {
          distinct.push(data);
          uniqueFlags[key] = true;
        }
      }
      return distinct;
    }

    /**
     * Deletes the history data for all apps from the personalization data.
     * This method deletes all app-specific personalization data entries.
     * The global history entry is kept, so the mapping from app ID to container ID can be reused.
     * @returns Promise which is resolved when the history data is deleted.
     */;
    _proto.deleteHistoryForAllApps = async function deleteHistoryForAllApps() {
      const shellServices = this.shellServices,
        globalHistoryData = await this.getGlobalHistoryData(),
        deletePromises = [],
        appIds = globalHistoryData.apps;
      for (const key of Object.keys(appIds)) {
        deletePromises.push(shellServices.deletePersonalizationContainer(appIds[key], undefined)); // ts
      }
      this.appHistoryData = undefined; // delete also cached app history data
      await Promise.all(deletePromises);
    }

    /**
     * Get the field data for a field path from the personalization service if the history service is enabled.
     * The history service is enabled if the shell switch and the user-specific switch are both enabled.
     * @param fieldPath The field path
     * @returns Promise which is resolved to a list of field data
     */;
    _proto.getFieldData = async function getFieldData(fieldPath) {
      const historyEnabledShell = Boolean(this.historyOptOutProvider),
        historyEnabledUser = await this.getHistoryEnabled();
      if (historyEnabledShell && historyEnabledUser) {
        // removing the key-value pair that were added for internal usage purposes in the history service (key starts with '@') and returns only the data which is shown on the UI.
        const fieldData = await this.getFieldDataFromService(fieldPath);
        return fieldData.map(obj => Object.entries(obj).filter(_ref => {
          let [key, _] = _ref;
          return !key.startsWith("@");
        }).reduce((accumulator, _ref2) => {
          let [key, value] = _ref2;
          return {
            ...accumulator,
            [key]: value
          };
        }, {}));
      }
      return [];
    }

    /**
     * Set the field data for a field path in the personalization service if the history service is enabled.
     * The history service is enabled if the shell switch and the user-specific switch are both enabled.
     * @param fieldPath The field path
     * @param fieldData List of field data
     * @returns Promise which is resolved when the field data is set
     */;
    _proto.setFieldData = async function setFieldData(fieldPath, fieldData) {
      const historyEnabledShell = Boolean(this.historyOptOutProvider),
        historyEnabledUser = await this.getHistoryEnabled();
      if (historyEnabledShell && historyEnabledUser) {
        // Add the current language to every field data entry
        const appLanguage = Localization.getLanguage();
        for (const data of fieldData) {
          data[APP_LANGUAGE] = appLanguage;
        }
        const fieldOldData = await this.getFieldDataFromService(fieldPath),
          dataToSet = ValueHelpHistoryService.getDistinct(fieldData.reverse().concat(fieldOldData)).slice(0, ValueHelpHistoryService.maxHistoryItems);
        return this.setFieldDataWithService(fieldPath, dataToSet);
      }
    };
    return ValueHelpHistoryService;
  }(Service);
  /**
   * Service Factory for the ValueHelpHistoryService
   *
   */
  // set in init
  ValueHelpHistoryService.appDataKey = "sapui5.history";
  _exports.ValueHelpHistoryService = ValueHelpHistoryService;
  ValueHelpHistoryService.maxHistoryItems = 5;
  let ValueHelpHistoryServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function ValueHelpHistoryServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = ValueHelpHistoryServiceFactory;
    _inheritsLoose(ValueHelpHistoryServiceFactory, _ServiceFactory);
    var _proto2 = ValueHelpHistoryServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(serviceContext) {
      this.instance = new ValueHelpHistoryService(serviceContext);
      return this.instance.initialize();
    };
    _proto2.getInstance = function getInstance() {
      return this.instance;
    };
    return ValueHelpHistoryServiceFactory;
  }(ServiceFactory);
  _exports = ValueHelpHistoryServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelpHistoryServiceFactory-dbg.js.map

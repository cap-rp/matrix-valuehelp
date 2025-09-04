/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/uid", "sap/fe/base/ClassSupport", "sap/m/CheckBox", "sap/m/Title", "sap/m/VBox", "sap/ui/base/ManagedObject", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, uid, ClassSupport, CheckBox, Title, VBox, ManagedObject, Lib, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _init, _init2, _ShellHistoryProvider;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineState = ClassSupport.defineState;
  var defineReference = ClassSupport.defineReference;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ShellHistoryProvider = (_dec = defineUI5Class("sap.fe.controls.easyFilter.ShellHistoryProvider"), _dec2 = defineState(), _dec3 = defineReference(), _dec4 = defineReference(), _dec(_class = (_class2 = (_ShellHistoryProvider = /*#__PURE__*/function (_ManagedObject) {
    function ShellHistoryProvider(personalizationService, globalPersonalizer, appPersonalizer, data, appData) {
      var _this;
      _this = _ManagedObject.call(this) || this;
      _initializerDefineProperty(_this, "state", _descriptor, _this);
      _this.personalizationService = personalizationService;
      _this.globalPersonalizer = globalPersonalizer;
      _this.appPersonalizer = appPersonalizer;
      _this.data = data;
      _this.appData = appData;
      ShellHistoryProvider.instances.add(_this);
      _this.state.isHistoryEnabled = data.isHistoryEnabled;
      _this.state.apps = data.apps;
      _this.state.recentQueries = appData.recentQueries;
      _this.state.favoriteQueries = appData.favoriteQueries;
      return _this;
    }
    _exports = ShellHistoryProvider;
    _inheritsLoose(ShellHistoryProvider, _ManagedObject);
    ShellHistoryProvider.getShellDialogContent = function getShellDialogContent(selectedValue) {
      this.$form = _jsxs(VBox, {
        children: [_jsx(Title, {
          text: this.resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_EASY_FILTER")
        }), _jsx(CheckBox, {
          ref: this.$historyEnabled,
          selected: selectedValue,
          text: this.resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_EASY_FILTER_KEEP_QUERIES")
        })]
      });
      return this.$form;
    };
    ShellHistoryProvider.saveShellDialog = function saveShellDialog() {
      const currentSelectedState = ShellHistoryProvider.$historyEnabled.current.getSelected();
      //updating the value in all the objects
      this.instances.forEach(instance => {
        instance.state.isHistoryEnabled = currentSelectedState;
      });
    };
    var _proto = ShellHistoryProvider.prototype;
    _proto.onStateChange = async function onStateChange() {
      // We confirm the value of the switch
      await this.globalPersonalizer.setPersData({
        isHistoryEnabled: this.state.isHistoryEnabled,
        apps: this.state.apps
      });
      await this.appPersonalizer.setPersData({
        recentQueries: this.state.recentQueries,
        favoriteQueries: this.state.favoriteQueries
      });
    };
    _proto.isHistoryEnabled = function isHistoryEnabled() {
      return this.state.isHistoryEnabled.valueOf();
    };
    _proto.getRecentQueries = function getRecentQueries() {
      return this.state.recentQueries.concat();
    };
    _proto.getFavoriteQueries = function getFavoriteQueries() {
      return this.state.favoriteQueries.concat();
    };
    _proto.setRecentQueries = function setRecentQueries(recentQueries) {
      this.state.recentQueries = recentQueries;
    };
    _proto.setFavoriteQueries = function setFavoriteQueries(favoriteQueries) {
      this.state.favoriteQueries = favoriteQueries;
    };
    ShellHistoryProvider.getInstance = async function getInstance(appId) {
      // Register the extension
      const shellContainer = sap.ui.require("sap/ushell/Container");
      try {
        if (shellContainer) {
          let resolveCreation;
          this.instance = new Promise(resolve => {
            resolveCreation = resolve;
          });
          const extensionService = await shellContainer.getServiceAsync("Extension");
          const frameBoundExtension = await shellContainer.getServiceAsync("FrameBoundExtension");
          const personalizationService = await shellContainer.getServiceAsync("PersonalizationV2");
          if (extensionService && personalizationService && frameBoundExtension) {
            const shellHistoryProvider = await ShellHistoryProvider.registerUserAction(extensionService, personalizationService, frameBoundExtension, appId);
            resolveCreation(shellHistoryProvider);
          }
        }
      } catch (e) {
        Log.error("Cannot register extension", e instanceof Error ? e.message : String(e));
      }
      return this.instance;
    };
    ShellHistoryProvider.registerUserAction = async function registerUserAction(shellExtensionService, personalizationService, frameBoundExtension, appId) {
      try {
        const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
        const scope = {
          clientStorageAllowed: false,
          keyCategory: personalizationService.constants.keyCategory.FIXED_KEY,
          validity: Infinity,
          writeFrequency: personalizationService.constants.writeFrequency.LOW
        };
        const globalPersonalizer = await personalizationService.getPersonalizer({
          container: "sap.fe.easyFilter",
          item: "settings"
        }, scope);
        let globalData = await globalPersonalizer.getPersData();
        if (!globalData) {
          // In case defaut value don't exist we create it
          globalData = {
            isHistoryEnabled: true,
            apps: {
              [appId]: uid()
            }
          };
          globalPersonalizer.setPersData(globalData);
        } else if (!globalData.apps?.[appId]) {
          globalData.apps ??= {};
          globalData.apps[appId] = uid();
          await globalPersonalizer.setPersData(globalData);
        }
        const appPersonalizer = await personalizationService.getPersonalizer({
          container: "sap.fe.easyFilter" + globalData.apps[appId],
          item: "recentQueries"
        }, scope);
        let appData = await appPersonalizer.getPersData();
        if (!appData) {
          appData = {
            recentQueries: [],
            favoriteQueries: []
          };
          await appPersonalizer.setPersData(appData);
        }
        const shellHistoryDialog = new ShellHistoryProvider(personalizationService, globalPersonalizer, appPersonalizer, globalData, appData);
        if (!this.isDialogAdded) {
          this.isDialogAdded = true;
          await frameBoundExtension.addGroupedUserSettingsEntry({
            title: resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_TITLE"),
            icon: "sap-icon://laptop",
            entryHelpId: "userActivitiesEntry",
            groupingId: "userActivities",
            groupingTabTitle: resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_TITLE"),
            groupingTabHelpId: "sapBusinessAI-helpId",
            value: async () => {
              return Promise.resolve();
            },
            content: async () => {
              return Promise.resolve(this.getShellDialogContent(globalData?.isHistoryEnabled));
            },
            onSave: () => {
              this.saveShellDialog();
            },
            onCancel: () => {
              //return (this.viewInstance.getController() as RequestSettingsController).onCancel();
            }
          });
        }
        return shellHistoryDialog;
      } catch (err) {
        Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
      }
    };
    return ShellHistoryProvider;
  }(ManagedObject), _ShellHistoryProvider.instances = new Set(), _ShellHistoryProvider.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls"), _ShellHistoryProvider.isDialogAdded = false, _ShellHistoryProvider), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "state", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {
        isHistoryEnabled: true,
        apps: {},
        recentQueries: [],
        favoriteQueries: []
      };
    }
  }), _applyDecoratedDescriptor(_class2, "$defaultOption", [_dec3], (_init = Object.getOwnPropertyDescriptor(_class2, "$defaultOption"), _init = _init ? _init.value : undefined, {
    enumerable: true,
    configurable: true,
    writable: true,
    initializer: function () {
      return _init;
    }
  }), _class2), _applyDecoratedDescriptor(_class2, "$historyEnabled", [_dec4], (_init2 = Object.getOwnPropertyDescriptor(_class2, "$historyEnabled"), _init2 = _init2 ? _init2.value : undefined, {
    enumerable: true,
    configurable: true,
    writable: true,
    initializer: function () {
      return _init2;
    }
  }), _class2), _class2)) || _class);
  _exports = ShellHistoryProvider;
  return _exports;
}, false);
//# sourceMappingURL=ShellHistoryProvider-dbg.js.map

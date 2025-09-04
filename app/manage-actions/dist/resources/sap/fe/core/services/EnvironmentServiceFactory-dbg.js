/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/VersionInfo", "sap/ui/core/Lib", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, VersionInfo, Library, Service, ServiceFactory) {
  "use strict";

  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Configuration for the optional features.
   */
  const OptionalFeatures = {
    SmartSummarize: {
      intent: "IntelligentPrompt-summarize",
      library: "ux.eng.fioriai.reuse",
      imports: "ux/eng/fioriai/reuse/library"
    },
    MagicFiltering: {
      intent: "IntelligentPrompt-filter",
      library: "ux.eng.fioriai.reuse",
      imports: "ux/eng/fioriai/reuse/easyfilter/EasyFilter"
    },
    ErrorExplanation: {
      intent: "IntelligentPrompt-explain",
      library: "ux.eng.fioriai.reuse",
      imports: "ux/eng/fioriai/reuse/errorexplanation/ErrorExplanation"
    },
    EasyEdit: {
      intent: "IntelligentPrompt-fill",
      library: "ux.eng.fioriai.reuse",
      imports: "ux/eng/fioriai/reuse/easyfill/EasyFill"
    }
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const DefaultEnvironmentCapabilities = {
    Chart: true,
    MicroChart: true,
    Collaboration: false,
    UShell: true,
    IntentBasedNavigation: true,
    AppState: true,
    InsightsSupported: false,
    ContextSharingSupported: false,
    SmartSummarize: false,
    MagicFiltering: false,
    EasyEdit: false,
    ErrorExplanation: false,
    DisableInputAssistance: false,
    HiddenDraft: false,
    loadLibrary: async libraryName => {
      return EnvironmentCapabilitiesService.resolveLibrary(libraryName);
    }
  };
  _exports.DefaultEnvironmentCapabilities = DefaultEnvironmentCapabilities;
  let EnvironmentCapabilitiesService = /*#__PURE__*/function (_Service) {
    function EnvironmentCapabilitiesService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      // !: means that we know it will be assigned before usage
      _this.optionalFeatureLibraries = {};
      return _this;
    }
    _exports.EnvironmentCapabilitiesService = EnvironmentCapabilitiesService;
    _inheritsLoose(EnvironmentCapabilitiesService, _Service);
    var _proto = EnvironmentCapabilitiesService.prototype;
    /**
     * Prepares the feature for usage.
     *
     * This function loads the library registered for the feature.
     * @param feature The feature to prepare.
     * @throws Error if the feature is unavailable.
     */
    _proto.prepareFeature = async function prepareFeature(feature) {
      const library = this.optionalFeatureLibraries[feature];
      if (!library) {
        throw new Error(`Feature '${feature}' is unavailable`);
      }
      await Library.load(library);
    };
    _proto.initialize = async function initialize() {
      const oContext = this.getContext();
      this.environmentCapabilities = Object.assign({}, DefaultEnvironmentCapabilities);
      const shellContainer = sap.ui.require("sap/ushell/Container");
      const versionInfo = await VersionInfo.load();
      this.environmentCapabilities.Chart = versionInfo.libraries.some(lib => lib.name === "sap.viz");
      this.environmentCapabilities.MicroChart = versionInfo.libraries.some(lib => lib.name === "sap.suite.ui.microchart");
      this.environmentCapabilities.Collaboration = versionInfo.libraries.some(lib => lib.name === "sap.suite.ui.commons");
      if (this.environmentCapabilities.Collaboration) {
        await EnvironmentCapabilitiesService.resolveLibrary("sap.suite.ui.commons");
      }
      this.environmentCapabilities.UShell = !!shellContainer;
      this.environmentCapabilities.IntentBasedNavigation = !!shellContainer;
      this.environmentCapabilities.InsightsSupported = versionInfo.libraries.some(lib => lib.name === "sap.insights");
      this.environmentCapabilities.ContextSharingSupported = versionInfo.libraries.some(lib => lib.name === "sap.insights");
      const hideDraft = oContext.scopeObject.getManifestEntry("sap.fe")?.app?.hideDraft;
      if (hideDraft?.enabled) {
        this.environmentCapabilities.HiddenDraft = {
          enabled: true,
          stayOnCurrentPageAfterSave: hideDraft.stayOnCurrentPageAfterSave,
          stayOnCurrentPageAfterCancel: hideDraft.stayOnCurrentPageAfterCancel,
          hideCreateNext: hideDraft.hideCreateNext
        };
      }
      // Initialize optional features
      const navigationService = await shellContainer?.getServiceAsync("Navigation");
      for (const [featureName, feature] of Object.entries(OptionalFeatures)) {
        // The feature is off by default. Only if there is a shell and the intent resolves, the feature is available
        this.environmentCapabilities[featureName] = false;
        if (navigationService) {
          try {
            // Resolve by intent:
            //  - intent resolves 		  ==> feature available, provided by the library located at the returned URL
            //  - intent does not resolve ==> resolveIntent() throws an error ==> feature unavailable
            const {
              url
            } = await navigationService.resolveIntent(`#${feature.intent}`);
            this.optionalFeatureLibraries[featureName] = {
              name: feature.library,
              url: url,
              imports: feature.imports
            };
            if (feature.imports) {
              try {
                await Library.load(this.optionalFeatureLibraries[featureName]);
                await __ui5_require_async(feature.imports);
                this.environmentCapabilities[featureName] = true;
              } catch (e) {
                this.environmentCapabilities[featureName] = false;
              }
            } else {
              this.environmentCapabilities[featureName] = true;
            }
          } catch (e) {
            // Feature unavailable
            Log.info(`Feature unavailable ${featureName}: ${e?.message}`);
          }
        }
      }
      this.environmentCapabilities = Object.assign(this.environmentCapabilities, oContext.settings);
    };
    EnvironmentCapabilitiesService.resolveLibrary = async function resolveLibrary(libraryName) {
      return new Promise(function (resolve) {
        Library.load({
          name: `${libraryName}`
        }).then(function () {
          resolve(true);
          return;
        }).catch(function () {
          resolve(false);
        });
      });
    };
    _proto.setCapabilities = function setCapabilities(oCapabilities) {
      this.environmentCapabilities = oCapabilities;
    };
    _proto.setCapability = function setCapability(capability, value) {
      this.environmentCapabilities[capability] = value;
    };
    _proto.getCapabilities = function getCapabilities() {
      return this.environmentCapabilities;
    }

    /**
     * Checks if insights are enabled on the home page.
     * @returns True if insights are enabled on the home page.
     */;
    _proto.isInsightsEnabled = async function isInsightsEnabled() {
      // insights is enabled
      return new Promise(async resolve => {
        try {
          // getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
          const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
          if (isLibAvailable) {
            // we also need to preload comp as insights is using it without declaring it e_e
            await EnvironmentCapabilitiesService.resolveLibrary("sap.ui.comp");
            sap.ui.require(["sap/insights/CardHelper"], async CardHelper => {
              try {
                await CardHelper.getServiceAsync("UIService");
                resolve(!(await getMSTeamsActive()));
              } catch {
                resolve(false);
              }
            });
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      });
    }

    /**
     * Checks if insights context channel is enabled .
     * @returns True if enabled.
     */;
    _proto.isContextSharingEnabled = async function isContextSharingEnabled() {
      // getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
      const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
      if (isLibAvailable) {
        // we also need to preload comp as insights is using it without declaring it e_e
        await EnvironmentCapabilitiesService.resolveLibrary("sap.ui.comp");
        try {
          await __ui5_require_async("sap/insights/channels/ContextChannel");
        } catch (e) {
          return false;
        }
        return true;
      } else {
        return false;
      }
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    return EnvironmentCapabilitiesService;
  }(Service);
  _exports.EnvironmentCapabilitiesService = EnvironmentCapabilitiesService;
  let EnvironmentServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function EnvironmentServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports.EnvironmentServiceFactory = EnvironmentServiceFactory;
    _inheritsLoose(EnvironmentServiceFactory, _ServiceFactory);
    var _proto2 = EnvironmentServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const environmentCapabilitiesService = new EnvironmentCapabilitiesService(oServiceContext);
      await environmentCapabilitiesService.initialize();
      return environmentCapabilitiesService;
    };
    return EnvironmentServiceFactory;
  }(ServiceFactory);
  /**
   * Checks if the application is opened on Microsoft Teams.
   * @returns True if the application is opened on Microsoft Teams.
   */
  _exports.EnvironmentServiceFactory = EnvironmentServiceFactory;
  async function getMSTeamsActive() {
    let isTeamsModeActive = false;
    try {
      await EnvironmentCapabilitiesService.resolveLibrary("sap.suite.ui.commons");
      const {
        default: CollaborationHelper
      } = await __ui5_require_async("sap/suite/ui/commons/collaboration/CollaborationHelper");
      isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
    } catch {
      return false;
    }
    return isTeamsModeActive;
  }
  _exports.getMSTeamsActive = getMSTeamsActive;
  return _exports;
}, false);
//# sourceMappingURL=EnvironmentServiceFactory-dbg.js.map

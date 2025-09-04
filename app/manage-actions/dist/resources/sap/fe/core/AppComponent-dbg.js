/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/AppStateHandler", "sap/fe/core/controllerextensions/routing/RouterProxy", "sap/fe/core/helpers/HTTP503Handler", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/library", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/fe/core/support/Diagnostics", "sap/m/routing/Router", "sap/ui/core/Lib", "sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "./controllerextensions/BusyLocker", "./converters/MetaModelConverter", "./helpers/ResourceModelHelper"], function (Log, ClassSupport, AppStateHandler, RouterProxy, HTTP503Handler, ModelHelper, PromiseKeeper, library, ChangePageConfiguration, Diagnostics, Router, Library, UIComponent, JSONModel, BusyLocker, MetaModelConverter, ResourceModelHelper) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor, _AppComponent;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var deleteModelCacheData = MetaModelConverter.deleteModelCacheData;
  var changeConfiguration = ChangePageConfiguration.changeConfiguration;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const StartupMode = library.StartupMode;
  const NAVCONF = {
    FCL: {
      VIEWNAME: "sap.fe.core.rootView.Fcl",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.Fcl",
      ROUTERCLASS: "sap.f.routing.Router"
    },
    NAVCONTAINER: {
      VIEWNAME: "sap.fe.core.rootView.NavContainer",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.NavContainer",
      ROUTERCLASS: "sap.m.routing.Router"
    }
  };
  // Keep a reference so as to keep the import despite it not being directly used
  const _mRouter = Router;
  /**
   * Main class for components used for an application in SAP Fiori elements.
   *
   * Application developers using the templates and building blocks provided by SAP Fiori elements should create their apps by extending this component.
   * This ensures that all the necessary services that you need for the building blocks and templates to work properly are started.
   *
   * When you use sap.fe.core.AppComponent as the base component, you also need to use a rootView. SAP Fiori elements provides two options: <br/>
   * - sap.fe.core.rootView.NavContainer when using sap.m.routing.Router <br/>
   * - sap.fe.core.rootView.Fcl when using sap.f.routing.Router (FCL use case) <br/>
   * @hideconstructor
   * @public
   */
  let AppComponent = (_dec = defineUI5Class("sap.fe.core.AppComponent", {
    config: {
      fullWidth: true
    },
    manifest: {
      "sap.ui5": {
        services: {
          resourceModel: {
            factoryName: "sap.fe.core.services.ResourceModelService",
            startup: "waitFor",
            settings: {
              bundles: ["sap.fe.core.messagebundle"],
              modelName: "sap.fe.i18n"
            }
          },
          routingService: {
            factoryName: "sap.fe.core.services.RoutingService",
            startup: "waitFor"
          },
          shellServices: {
            factoryName: "sap.fe.core.services.ShellServices",
            startup: "waitFor"
          },
          ShellUIService: {
            factoryName: "sap.ushell.ui5service.ShellUIService"
          },
          navigationService: {
            factoryName: "sap.fe.core.services.NavigationService",
            startup: "waitFor"
          },
          environmentCapabilities: {
            factoryName: "sap.fe.core.services.EnvironmentService",
            startup: "waitFor"
          },
          sideEffectsService: {
            factoryName: "sap.fe.core.services.SideEffectsService",
            startup: "waitFor"
          },
          asyncComponentService: {
            factoryName: "sap.fe.core.services.AsyncComponentService",
            startup: "waitFor"
          },
          collaborationManagerService: {
            factoryName: "sap.fe.core.services.CollaborationManagerService",
            startup: "waitFor"
          },
          collaborativeToolsService: {
            factoryName: "sap.fe.core.services.CollaborativeToolsService",
            startup: "waitFor"
          },
          telemetryService: {
            factoryName: "sap.fe.core.services.TelemetryService",
            startup: "waitFor"
          },
          valueHelpHistoryService: {
            factoryName: "sap.fe.core.services.ValueHelpHistoryService",
            startup: "waitFor"
          },
          CollaborativeDraftService: {
            factoryName: "sap.fe.core.services.CollaborativeDraftService",
            startup: "waitFor"
          },
          ContextSharingService: {
            factoryName: "sap.fe.core.services.ContextSharingService",
            startup: "waitFor"
          },
          inlineEditService: {
            factoryName: "sap.fe.core.services.InlineEditService",
            startup: "waitFor"
          }
        },
        rootView: {
          viewName: NAVCONF.NAVCONTAINER.VIEWNAME,
          type: "XML",
          async: true,
          id: "appRootView"
        },
        routing: {
          config: {
            controlId: "appContent",
            routerClass: NAVCONF.NAVCONTAINER.ROUTERCLASS,
            viewType: "XML",
            controlAggregation: "pages",
            async: true,
            containerOptions: {
              propagateModel: true
            }
          }
        }
      }
    },
    designtime: "sap/fe/core/designtime/AppComponent.designtime",
    library: "sap.fe.core"
  }), _dec2 = implementInterface("sap.ui.core.IAsyncContentCreation"), _dec(_class = (_class2 = (_AppComponent = /*#__PURE__*/function (_UIComponent) {
    function AppComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UIComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IAsyncContentCreation", _descriptor, _this);
      _this.startupMode = StartupMode.Normal;
      _this._startedServices = [];
      _this.isAdaptationEnabled = false;
      _this.isExiting = false;
      _this.pageConfigurationChanges = {};
      return _this;
    }
    _inheritsLoose(AppComponent, _UIComponent);
    var _proto = AppComponent.prototype;
    _proto._isFclEnabled = function _isFclEnabled() {
      const oManifestUI5 = this.getManifestEntry("sap.ui5");
      return oManifestUI5?.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS;
    };
    _proto.setAdaptationMode = function setAdaptationMode(isAdaptationEnabled) {
      this.isAdaptationEnabled = isAdaptationEnabled;
    };
    _proto.isAdaptationMode = function isAdaptationMode() {
      return this.isAdaptationEnabled;
    }

    /**
     * Provides a hook to initialize feature toggles.
     *
     * This hook is being called by the SAP Fiori elements AppComponent at the time feature toggles can be initialized.
     * To change page configuration, use the {@link sap.fe.core.AppComponent#changePageConfiguration} method.
     * @public
     * @returns A promise without any value to allow asynchronous processes
     */;
    _proto.initializeFeatureToggles = async function initializeFeatureToggles() {
      // this method can be overridden by applications
      return Promise.resolve();
    }

    /**
     * Changes the page configuration of SAP Fiori elements.
     *
     * This method enables you to change the page configuration of SAP Fiori elements.
     * @param pageId The ID of the page for which the configuration is to be changed.
     * @param path The path in the page settings for which the configuration is to be changed.
     * @param value The new value of the configuration. This could be a plain value like a string, or a Boolean, or a structured object.
     * @public
     */;
    _proto.changePageConfiguration = function changePageConfiguration(pageId, path, value) {
      const manifest = changeConfiguration(this.getManifest(), pageId, path, value, true, this);
      if (path === "app/disableInputAssistance" && manifest?.["sap.fe"]?.["app"]?.["disableInputAssistance"] === value) {
        this.getEnvironmentCapabilities().setCapability("DisableInputAssistance", value);
      }
    }

    /**
     * Cleans all registered page configuration changes.
     */;
    _proto.cleanPageConfigurationChanges = function cleanPageConfigurationChanges() {
      this.pageConfigurationChanges = {};
    }

    /**
     * Get a reference to the RouterProxy.
     * @returns A Reference to the RouterProxy
     * @final
     */;
    _proto.getRouterProxy = function getRouterProxy() {
      return this._oRouterProxy;
    }

    /**
     * Get a reference to the AppStateHandler.
     * @returns A reference to the AppStateHandler
     * @final
     */;
    _proto.getAppStateHandler = function getAppStateHandler() {
      return this._oAppStateHandler;
    }

    /**
     * Get a reference to the nav/FCL Controller.
     * @returns  A reference to the FCL Controller
     * @final
     */;
    _proto.getRootViewController = function getRootViewController() {
      return this.getRootControl().getController();
    }

    /**
     * Get the NavContainer control or the FCL control.
     * @returns  A reference to NavContainer control or the FCL control
     * @final
     */;
    _proto.getRootContainer = function getRootContainer() {
      return this.getRootControl().getContent()[0];
    }

    /**
     * Get the startup mode of the app.
     * @returns The startup mode
     */;
    _proto.getStartupMode = function getStartupMode() {
      return this.startupMode;
    }

    /**
     * Set the startup mode for the app to 'Create'.
     *
     */;
    _proto.setStartupModeCreate = function setStartupModeCreate() {
      this.startupMode = StartupMode.Create;
    }

    /**
     * Set the startup mode for the app to 'AutoCreate'.
     *
     */;
    _proto.setStartupModeAutoCreate = function setStartupModeAutoCreate() {
      this.startupMode = StartupMode.AutoCreate;
    }

    /**
     * Set the startup mode for the app to 'Deeplink'.
     *
     */;
    _proto.setStartupModeDeeplink = function setStartupModeDeeplink() {
      this.startupMode = StartupMode.Deeplink;
    };
    _proto.init = function init() {
      const params = new URLSearchParams(window.location.search);
      if (params.has("sap-ui-xx-fe-support")) {
        setTimeout(function () {
          Library.load({
            name: "sap.fe.tools"
          });
        }, 2000);
      }
      this._initializedKeeper = new PromiseKeeper();
      this.initialized = this._initializedKeeper.promise;
      const uiModel = new JSONModel({
        editMode: library.EditMode.Display,
        isEditable: false,
        draftStatus: library.DraftStatus.Clear,
        busy: false,
        busyLocal: {},
        pages: {}
      });
      const oInternalModel = new JSONModel({
        pages: {}
      });
      // set the binding OneWay for uiModel to prevent changes if controller extensions modify a bound property of a control
      uiModel.setDefaultBindingMode("OneWay");
      // for internal model binding needs to be two way
      ModelHelper.enhanceUiJSONModel(uiModel, library);
      ModelHelper.enhanceInternalJSONModel(oInternalModel);
      this.setModel(uiModel, "ui");
      this.setModel(oInternalModel, "internal");
      this.bInitializeRouting = this.bInitializeRouting !== undefined ? this.bInitializeRouting : true;
      this._oRouterProxy = new RouterProxy();
      this._oAppStateHandler = new AppStateHandler(this);
      this._oDiagnostics = new Diagnostics();
      const oModel = this.getModel();
      if (oModel?.isA?.("sap.ui.model.odata.v4.ODataModel")) {
        ModelHelper.enhanceODataModel(oModel, this);
        oModel.setRetryAfterHandler(this.http503RetryHandler.bind(this));
        this.entityContainer = oModel.getMetaModel().requestObject("/$EntityContainer/");
      } else {
        // not an OData v4 service
        this.entityContainer = Promise.resolve();
      }
      if (this.getManifestEntry("sap.fe")?.app?.disableCollaborationDraft) {
        // disable the collaboration draft globally in case private manifest flag is set
        // this allows customers to disable the collaboration draft in case we run into issues with the first delivery
        // this will be removed with the next S/4 release
        ModelHelper.disableCollaborationDraft = true;
      }
      const oManifestUI5 = this.getManifest()["sap.ui5"];
      this.checkRoutingConfiguration(oManifestUI5);

      // the init function configures the routing according to the settings above
      // it will call the createContent function to instantiate the RootView and add it to the UIComponent aggregations

      _UIComponent.prototype.init.call(this);
      AppComponent.instanceMap[this.getId()] = this;
    };
    _proto.http503RetryHandler = async function http503RetryHandler(error) {
      return HTTP503Handler.handle503Delay(error, this.getRootControl(), getResourceModel(this));
    };
    _proto.checkRoutingConfiguration = function checkRoutingConfiguration(oManifestUI5) {
      if (oManifestUI5?.rootView?.viewName) {
        // The application specified an own root view in the manifest

        // Root View was moved from sap.fe.templates to sap.fe.core - keep it compatible
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.FCL.VIEWNAME;
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.NAVCONTAINER.VIEWNAME;
        }
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME && oManifestUI5.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.FCL.VIEWNAME}" - Routerclass: "${NAVCONF.FCL.ROUTERCLASS}"`);
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME && oManifestUI5.routing?.config?.routerClass === NAVCONF.NAVCONTAINER.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.NAVCONTAINER.VIEWNAME}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        } else if (oManifestUI5.rootView?.viewName?.includes("sap.fe.core.rootView")) {
          throw Error(`\nWrong configuration for the couple (rootView/routerClass) in manifest file.\n` + `Current values are :(${oManifestUI5.rootView.viewName}/${oManifestUI5.routing?.config?.routerClass || "<missing router class>"})\n` + `Expected values are \n` + `\t - (${NAVCONF.NAVCONTAINER.VIEWNAME}/${NAVCONF.NAVCONTAINER.ROUTERCLASS})\n` + `\t - (${NAVCONF.FCL.VIEWNAME}/${NAVCONF.FCL.ROUTERCLASS})`);
        } else {
          Log.info(`Rootcontainer: "${oManifestUI5.rootView.viewName}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        }
      }
    };
    _proto.onServicesStarted = async function onServicesStarted(allServices) {
      this._startedServices = allServices;
      await this.initializeFeatureToggles();
      await Promise.allSettled(AppComponent.instanceDependentProcesses.map(async fnProcess => {
        return fnProcess.call(null, this);
      }));

      //router must be started once the rootcontainer is initialized
      //starting of the router
      const finalizedRoutingInitialization = () => {
        this.entityContainer.then(async () => {
          if (this.getRootViewController().attachRouteMatchers) {
            this.getRootViewController().attachRouteMatchers();
          }
          this.getRouter().initialize();
          this.getRouterProxy().init(this, this._isFclEnabled());
          return this.getValueHelpHistoryService().registerShellHook();
        }).catch(error => {
          const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
          this.getRootViewController().displayErrorPage(oResourceBundle.getText("C_APP_COMPONENT_SAPFE_APPSTART_TECHNICAL_ISSUES"), {
            title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
            description: error.message
          });
        });
      };
      if (this.bInitializeRouting) {
        return this.getRoutingService().initializeRouting().then(() => {
          if (this.getRootViewController()) {
            finalizedRoutingInitialization();
          } else {
            this.getRootControl().attachAfterInit(function () {
              finalizedRoutingInitialization();
            });
          }
          this._initializedKeeper.resolve();
          return;
        }).catch(function (err) {
          Log.error(`cannot cannot initialize routing: ${err.toString()}`);
        });
      } else {
        this._initializedKeeper.resolve();
      }
    };
    _proto.exit = function exit() {
      this._startedServices = [];
      this._oAppStateHandler.destroy();
      this._oRouterProxy.destroy();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oAppStateHandler;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oRouterProxy;
      deleteModelCacheData(this.getMetaModel());
      this.getModel("ui").destroy();
      this.cleanPageConfigurationChanges();
    };
    _proto.getMetaModel = function getMetaModel() {
      return this.getModel().getMetaModel();
    };
    _proto.getDiagnostics = function getDiagnostics() {
      return this._oDiagnostics;
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      this.isExiting = true;

      // LEAKS, with workaround for some Flex / MDC issue
      try {
        this.unregisterStickySessionCallbacks();
        delete AppComponent.instanceMap[this.getId()];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete window._routing;
      } catch (e) {
        Log.info(e);
      }

      //WORKAROUND for sticky discard request : due to async callback, request triggered by the exitApplication will be send after the UIComponent.prototype.destroy
      //so we need to copy the Requestor headers as it will be destroy

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const oMainModel = this.oModels[undefined];
      let oHeaders;
      if (oMainModel?.oRequestor) {
        oHeaders = Object.assign({}, oMainModel.oRequestor.mHeaders);
      }

      // As we need to cleanup the application / handle the dirty object we need to call our cleanup before the models are destroyed
      this.getRoutingService()?.beforeExit?.();
      _UIComponent.prototype.destroy.call(this, bSuppressInvalidate);
      if (oHeaders && oMainModel.oRequestor) {
        oMainModel.oRequestor.mHeaders = oHeaders;
      }
    };
    _proto.getRoutingService = function getRoutingService() {
      return {}; // overriden at runtime
    };
    _proto.getShellServices = function getShellServices() {
      return {}; // overriden at runtime
    };
    _proto.getNavigationService = function getNavigationService() {
      return {}; // overriden at runtime
    };
    _proto.getSideEffectsService = function getSideEffectsService() {
      return {};
    };
    _proto.getEnvironmentCapabilities = function getEnvironmentCapabilities() {
      return {};
    };
    _proto.getCollaborationManagerService = function getCollaborationManagerService() {
      return {};
    };
    _proto.getCollaborativeToolsService = function getCollaborativeToolsService() {
      return {};
    };
    _proto.getCollaborativeDraftService = function getCollaborativeDraftService() {
      return {};
    };
    _proto.getContextSharingService = function getContextSharingService() {
      return {};
    };
    _proto.getTelemetryService = function getTelemetryService() {
      return {};
    };
    _proto.getValueHelpHistoryService = function getValueHelpHistoryService() {
      return {};
    };
    _proto.getInlineEditService = function getInlineEditService() {
      return {};
    };
    _proto.getStartupParameters = async function getStartupParameters() {
      const oComponentData = this.getComponentData();
      return Promise.resolve(oComponentData && oComponentData.startupParameters || {});
    };
    _proto.restore = function restore() {
      // called by FLP when app sap-keep-alive is enabled and app is restored
      for (const startedService of this._startedServices) {
        startedService.onRestore?.();
      }
      this.getRootViewController().viewState.onRestore();

      // Reset all values in versionActivationStatus to false
      AppStateHandler.resetVersionActivationStatus();
    };
    _proto.suspend = function suspend() {
      // called by FLP when app sap-keep-alive is enabled and app is suspended
      for (const startedService of this._startedServices) {
        startedService.onSuspend?.();
      }
      this.getRootViewController().viewState.onSuspend();
    }

    /**
     * navigateBasedOnStartupParameter function is a public api that acts as a wrapper to _manageDeepLinkStartup function. It passes the startup parameters further to _manageDeepLinkStartup function
     * @param startupParameters Defines the startup parameters which is further passed to _manageDeepLinkStartup function.
     */;
    _proto.navigateBasedOnStartupParameter = async function navigateBasedOnStartupParameter(startupParameters) {
      try {
        if (!BusyLocker.isLocked(this.getModel("ui"))) {
          if (!startupParameters) {
            startupParameters = null;
          }
          const routingService = this.getRoutingService();
          await routingService._manageDeepLinkStartup(startupParameters);
        }
      } catch (exception) {
        Log.error(exception);
        BusyLocker.unlock(this.getModel("ui"));
      }
    }

    /**
     * Used to allow disabling the Collaboration Manager integration for the OVP use case.
     * @returns Whether the collaboration manager service is active.
     */;
    _proto.isCollaborationManagerServiceEnabled = function isCollaborationManagerServiceEnabled() {
      return true;
    }

    /**
     * Register processes that need to be run for every instance prior to startup.
     * @param fnProcess Function that hold the implementation of the process.
     *
     * The registered process can be an asynchronous process.
     * It shall be called with the AppComponent instance as a parameter before startup.
     */;
    AppComponent.registerInstanceDependentProcessForStartUp = function registerInstanceDependentProcessForStartUp(fnProcess) {
      this.instanceDependentProcesses.push(fnProcess);
    }

    /**
     * Registers the callbacks related to a sticky edit session.
     * @param dirtyStateProviderCallback
     * @param sessionTimeoutCallback
     * @param discardAfterNavigationCallback
     */;
    _proto.registerStickySessionCallbacks = function registerStickySessionCallbacks(dirtyStateProviderCallback, sessionTimeoutCallback, discardAfterNavigationCallback) {
      this.stickyDirtyStateProviderCallback = dirtyStateProviderCallback;
      this.getShellServices().registerDirtyStateProvider(dirtyStateProviderCallback);
      this.stickySessionTimeoutCallback = sessionTimeoutCallback;
      this.getModel().attachSessionTimeout(sessionTimeoutCallback);
      this.stickyDiscardAfterNavigationCallback = discardAfterNavigationCallback;
      this.getRoutingService().attachRouteMatched({}, discardAfterNavigationCallback);
    }

    /**
     * Unregisters the callbacks related to a sticky edit session.
     */;
    _proto.unregisterStickySessionCallbacks = function unregisterStickySessionCallbacks() {
      if (this.stickyDirtyStateProviderCallback) {
        this.getShellServices().deregisterDirtyStateProvider(this.stickyDirtyStateProviderCallback);
        this.stickyDirtyStateProviderCallback = undefined;
      }
      if (this.stickySessionTimeoutCallback && this.getModel()) {
        this.getModel().detachSessionTimeout(this.stickySessionTimeoutCallback);
        this.stickySessionTimeoutCallback = undefined;
      }
      if (this.stickyDiscardAfterNavigationCallback) {
        this.getRoutingService().detachRouteMatched(this.stickyDiscardAfterNavigationCallback);
        this.stickyDiscardAfterNavigationCallback = undefined;
      }
    };
    return AppComponent;
  }(UIComponent), _AppComponent.instanceMap = {}, _AppComponent.instanceDependentProcesses = [], _AppComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IAsyncContentCreation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _class2)) || _class);
  return AppComponent;
}, false);
//# sourceMappingURL=AppComponent-dbg.js.map

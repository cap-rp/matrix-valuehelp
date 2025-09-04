/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  // see: sap\ushell\services\_Personalization\constants.js
  /**
   * @interface IShellServices
   */
  /**
   * Mock implementation of the ShellService for OpenFE
   *
   */
  let ShellServiceMock = /*#__PURE__*/function (_Service) {
    function ShellServiceMock() {
      return _Service.apply(this, arguments) || this;
    }
    _inheritsLoose(ShellServiceMock, _Service);
    var _proto = ShellServiceMock.prototype;
    _proto.init = function init() {
      this.initPromise = Promise.resolve(this);
      this.instanceType = "mock";
    };
    _proto.getLinks = async function getLinks(/*oArgs: object*/
    ) {
      return Promise.resolve([]);
    };
    _proto.__fetchSemanticObject = async function __fetchSemanticObject() {
      return Promise.resolve([]);
    };
    _proto.getLinksWithCache = async function getLinksWithCache(/*oArgs: object*/
    ) {
      return Promise.resolve([]);
    };
    _proto.toExternal = function toExternal(/*oNavArgumentsArr: Array<object>, oComponent: object*/
    ) {
      /* Do Nothing */
    };
    _proto.getStartupAppState = async function getStartupAppState(/*oArgs: object*/
    ) {
      return Promise.resolve(undefined);
    };
    _proto.isJamActive = function isJamActive() {
      return false;
    };
    _proto.backToPreviousApp = function backToPreviousApp() {
      /* Do Nothing */
    };
    _proto.hrefForExternal = async function hrefForExternal(/*oArgs?: object, oComponent?: object, bAsync?: boolean*/
    ) {
      return Promise.resolve("");
    };
    _proto.getHref = async function getHref(/*oArgs?: object, oComponent?: object, bAsync?: boolean*/
    ) {
      return Promise.resolve("");
    };
    _proto.getHash = function getHash() {
      return window.location.href;
    };
    _proto.getAppState = async function getAppState(/*oComponent: object, sAppStateKey: string*/
    ) {
      return Promise.resolve({});
    };
    _proto.createEmptyAppState = async function createEmptyAppState(/*oComponent: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.createEmptyAppStateAsync = async function createEmptyAppStateAsync(/*oComponent: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.navigate = async function navigate(/*oTarget: Target,oComponent?: Component*/
    ) {
      return Promise.resolve(undefined);
    };
    _proto.isNavigationSupported = async function isNavigationSupported(/*oNavArgumentsArr: Array<object>, oComponent: object*/
    ) {
      return Promise.resolve([]);
    };
    _proto.isInitialNavigation = async function isInitialNavigation() {
      return Promise.resolve(false);
    };
    _proto.expandCompactHash = async function expandCompactHash(/*sHashFragment: string*/
    ) {
      return Promise.resolve("");
    };
    _proto.parseShellHash = function parseShellHash(/*sHash: string*/
    ) {
      return {};
    };
    _proto.splitHash = function splitHash(sHash) {
      /**
       * For an Application without Shell, the hash is similar to : #/SalesOrderManage(11111111-aaaa-bbbb-cccc-ddddeeeeffff)
       * this function returns :
       * {
      	shellPart: "",
      	appSpecificRoute: "SalesOrderManage(11111111-aaaa-bbbb-cccc-ddddeeeeffff)"
      }
       */
      const regex = /#[^/]*\/(.*)/.exec(sHash);
      return {
        shellPart: "",
        appSpecificRoute: regex?.length === 2 ? regex[1] : ""
      };
    };
    _proto.constructShellHash = function constructShellHash(/*oNewShellHash: object*/
    ) {
      return "";
    };
    _proto.setDirtyFlag = function setDirtyFlag(/*bDirty: boolean*/
    ) {
      /* Do Nothing */
    };
    _proto.registerDirtyStateProvider = function registerDirtyStateProvider(/*fnDirtyStateProvider: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.deregisterDirtyStateProvider = function deregisterDirtyStateProvider(/*fnDirtyStateProvider: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.getUser = function getUser() {
      return {};
    };
    _proto.getUserInitials = function getUserInitials() {
      return "";
    };
    _proto.hasUShell = function hasUShell() {
      return false;
    };
    _proto.registerNavigationFilter = function registerNavigationFilter(/*fnNavFilter: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.unregisterNavigationFilter = function unregisterNavigationFilter(/*fnNavFilter: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.setBackNavigation = async function setBackNavigation(/*fnCallBack?: Function*/
    ) {
      /* Do Nothing */
      return Promise.resolve();
    };
    _proto.setHierarchy = async function setHierarchy(/*aHierarchyLevels: Array<object>*/
    ) {
      /* Do Nothing */
      return Promise.resolve();
    };
    _proto.setTitle = async function setTitle(/*sTitle: string*/
    ) {
      /* Do Nothing */
      return Promise.resolve();
    };
    _proto.getContentDensity = function getContentDensity() {
      // in case there is no shell we probably need to look at the classes being defined on the body
      if (document.body.classList.contains("sapUiSizeCozy")) {
        return "cozy";
      } else if (document.body.classList.contains("sapUiSizeCompact")) {
        return "compact";
      } else {
        return "";
      }
    };
    _proto.getPrimaryIntent = async function getPrimaryIntent(/*sSemanticObject: string, mParameters?: object*/
    ) {
      return Promise.resolve(undefined);
    };
    _proto.waitForPluginsLoad = async function waitForPluginsLoad() {
      return Promise.resolve(true);
    };
    _proto.getTitle = async function getTitle() {
      return Promise.resolve("");
    };
    _proto.getPersonalizer = async function getPersonalizer(_persId, _scope, _component) {
      return Promise.resolve({
        getPersData: async () => Promise.resolve({
          historyEnabled: false,
          suggestionsEnabled: false,
          apps: {}
        }),
        setPersData: () => {}
      });
    };
    _proto.getApplicationPersonalizer = async function getApplicationPersonalizer(_itemName) {
      return Promise.resolve({
        getPersData: async () => Promise.resolve({}),
        setPersData: () => {}
      });
    };
    _proto.getApplicationPersonalizationData = async function getApplicationPersonalizationData(_itemName) {
      return Promise.resolve({});
    };
    _proto.setApplicationPersonalizationData = async function setApplicationPersonalizationData(_itemName, _object) {
      return Promise.resolve();
    };
    _proto.deletePersonalizationContainer = async function deletePersonalizationContainer(_key, _scope) {
      return Promise.resolve();
    };
    _proto.getShellConfig = function getShellConfig() {
      return {};
    };
    _proto.getRegisteredPlugins = function getRegisteredPlugins() {
      return {
        AppWarmup: {},
        RendererExtensions: {},
        UserDefaults: {},
        UserImage: {}
      };
    };
    _proto.isFlpOptimisticBatchPluginLoaded = function isFlpOptimisticBatchPluginLoaded() {
      return false;
    };
    _proto.parseParameters = function parseParameters() {
      return {};
    };
    _proto.getExtensionService = function getExtensionService() {
      return {};
    };
    _proto.getInframeUrl = async function getInframeUrl() {
      return Promise.resolve("");
    };
    return ShellServiceMock;
  }(Service);
  /**
   * @typedef ShellServicesSettings
   */
  /**
   * Base implementation of the ShellServices
   *
   */
  let ShellServices = /*#__PURE__*/function (_Service2) {
    function ShellServices() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
        args[_key2] = arguments[_key2];
      }
      _this = _Service2.call(this, ...args) || this;
      _this.applicationPersonnalizers = {};
      return _this;
    }
    _exports.ShellServices = ShellServices;
    _inheritsLoose(ShellServices, _Service2);
    var _proto2 = ShellServices.prototype;
    _proto2.init = function init() {
      const oContext = this.getContext();
      this.appComponent = oContext.scopeObject;
      this.oShellContainer = oContext.settings.shellContainer;
      this.instanceType = "real";
      this.linksCache = {};
      this.fnFindSemanticObjectsInCache = function (oArgs) {
        const aCachedSemanticObjects = [];
        const aNonCachedSemanticObjects = [];
        for (const linkFilter of oArgs) {
          if (!!linkFilter && !!linkFilter.semanticObject) {
            if (this.linksCache[linkFilter.semanticObject]) {
              aCachedSemanticObjects.push(this.linksCache[linkFilter.semanticObject].links);
              Object.defineProperty(linkFilter, "links", {
                value: this.linksCache[linkFilter.semanticObject].links
              });
            } else {
              aNonCachedSemanticObjects.push(linkFilter);
            }
          }
        }
        return {
          oldArgs: oArgs,
          newArgs: aNonCachedSemanticObjects,
          cachedLinks: aCachedSemanticObjects
        };
      };
      this.initPromise = new Promise((resolve, reject) => {
        this.resolveFn = resolve;
        this.rejectFn = reject;
      });
      const navigationServiceP = this.oShellContainer.getServiceAsync("Navigation");
      const userInfoServiceP = this.oShellContainer.getServiceAsync("UserInfo");
      const oUrlParsingServicePromise = this.oShellContainer.getServiceAsync("URLParsing");
      const oShellNavigationServicePromise = this.oShellContainer.getServiceAsync("ShellNavigationInternal");
      const oShellPluginManagerPromise = this.oShellContainer.getServiceAsync("PluginManager");
      const oShellPersonalizationServicePromise = this.oShellContainer.getServiceAsync("PersonalizationV2");
      const oShellExtensionServicePromise = this.oShellContainer.getServiceAsync("Extension");
      Promise.all([navigationServiceP, userInfoServiceP, oUrlParsingServicePromise, oShellNavigationServicePromise, oShellPersonalizationServicePromise, oShellPluginManagerPromise, oShellExtensionServicePromise]).then(_ref => {
        let [navigationService, userInfoService, oUrlParsingService, oShellNavigation, oShellPersonalizationService, oShellPluginManager, oShellExtensionService] = _ref;
        this.applicationNavigation = navigationService;
        this.userInfoService = userInfoService;
        this.urlParsingService = oUrlParsingService;
        this.shellNavigation = oShellNavigation;
        this.shellPersonalizationService = oShellPersonalizationService;
        this.shellPluginManager = oShellPluginManager;
        this.extensionService = oShellExtensionService;
        this.resolveFn();
        return;
      }).catch(this.rejectFn);
    }

    /**
     * Retrieves the target links configured for a given semantic object & action
     * Will retrieve the CrossApplicationNavigation
     * service reference call the getLinks method. In case service is not available or any exception
     * method throws exception error in console.
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
     * @returns Promise which will be resolved to target links array
     */;
    _proto2.getLinks = async function getLinks(oArgs) {
      return this.applicationNavigation.getLinks(oArgs);
    }

    /**
     * Returns a list of semantic objects of the intents the current user can navigate to.
     * @returns Promise that resolve with an array of strings representing the semantic objects of the intents the current user can navigate to, or rejects with an error message
     */;
    _proto2.__fetchSemanticObject = async function __fetchSemanticObject() {
      return this.applicationNavigation.getSemanticObjects();
    }

    /**
     * Retrieves the target links configured for a given semantic object & action in cache
     * Will retrieve the CrossApplicationNavigation
     * service reference call the getLinks method. In case service is not available or any exception
     * method throws exception error in console.
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
     * @returns Promise which will be resolved to target links array
     */;
    _proto2.getLinksWithCache = async function getLinksWithCache(oArgs) {
      if (oArgs.length === 0) {
        return [];
      } else {
        const oCacheResults = this.fnFindSemanticObjectsInCache(oArgs);
        if (oCacheResults.newArgs.length === 0) {
          return oCacheResults.cachedLinks;
        } else {
          const aLinks = await this.applicationNavigation.getLinks(oCacheResults.newArgs);
          if (aLinks.length !== 0) {
            const oSemanticObjectsLinks = {};
            for (let i = 0; i < aLinks.length; i++) {
              if (aLinks[i].length > 0 && oCacheResults.newArgs[i][0].links === undefined) {
                oSemanticObjectsLinks[oCacheResults.newArgs[i][0].semanticObject] = {
                  links: aLinks[i]
                };
                this.linksCache = Object.assign(this.linksCache, oSemanticObjectsLinks);
              }
            }
          }
          if (oCacheResults.cachedLinks.length === 0) {
            return aLinks;
          } else {
            const aMergedLinks = [];
            let j = 0;
            for (const item of oCacheResults.oldArgs) {
              if (j < aLinks.length) {
                if (aLinks[j].length > 0 && item[0].semanticObject === oCacheResults.newArgs[j][0].semanticObject) {
                  aMergedLinks.push(aLinks[j]);
                  j++;
                } else {
                  aMergedLinks.push(item[0].links);
                }
              } else {
                aMergedLinks.push(item[0].links);
              }
            }
            return aMergedLinks;
          }
        }
      }
    };
    _proto2.getShellUIService = async function getShellUIService() {
      return this.appComponent.getService("ShellUIService");
    }

    /**
     * Will retrieve the ShellContainer.
     * @returns Object with predefined shellContainer methods
     */;
    _proto2.getShellContainer = function getShellContainer() {
      return this.oShellContainer;
    };
    _proto2.getInframeUrl = async function getInframeUrl() {
      const ushellContainer = this.getShellContainer();
      let appUrl;
      if (ushellContainer?.inAppRuntime()) {
        try {
          appUrl = await ushellContainer.getFLPUrlAsync(true);
        } catch (error) {
          Log.error("Error while getting the FLP URL", error);
        }
      }
      return appUrl;
    }

    /**
     * Will call toExternal method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
     * @param oNavArgumentsArr And
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>toExternal arguments
     */;
    _proto2.toExternal = function toExternal(oNavArgumentsArr, oComponent) {
      this.navigate(oNavArgumentsArr, oComponent);
    }

    /**
     * Retrieves the target startupAppState
     * Will check the existance of the ShellContainer and retrieve the CrossApplicationNavigation
     * service reference call the getStartupAppState method. In case service is not available or any exception
     * method throws exception error in console.
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getStartupAppState arguments
     * @returns Promise which will be resolved to Object
     */;
    _proto2.getStartupAppState = async function getStartupAppState(oArgs) {
      return this.applicationNavigation.getStartupAppState(oArgs);
    }

    /**
     * Will call backToPreviousApp method of CrossApplicationNavigation service.
     * @returns Something that indicate we've navigated
     */;
    _proto2.backToPreviousApp = async function backToPreviousApp() {
      return this.applicationNavigation.backToPreviousApp();
    }

    /**
     * Will call hrefForExternal method of CrossApplicationNavigation service.
     * @param oArgs Check the definition of
     * @param oComponent The appComponent
     * sap.ushell.services.CrossApplicationNavigation=>hrefForExternal arguments
     * @returns Promise which will be resolved to string
     */;
    _proto2.hrefForExternal = async function hrefForExternal(oArgs, oComponent) {
      return this.applicationNavigation.getHref(oArgs, oComponent);
    }

    /**
     * Returns a promise resolving to a URL that launches an app with certain parameters.
     * This API can be used to convert the internal shell hash format into the URL format for use in link tags.
     * The resulting href is fully encoded and cannot be used in other APIs that expect the internal decoded hash.
     * @param [oTarget] The navigation target to transform. When, omitted the current hash is used as the basis for the calculation.
     * @param [oComponent] A UI5 component, used to logically attach any related app state.
     * @returns A promise resolving the encoded href.
     */;
    _proto2.getHref = async function getHref(oTarget, oComponent) {
      return this.applicationNavigation.getHref(oTarget, oComponent);
    }

    /**
     * Will call getAppState method of CrossApplicationNavigation service with oComponent and oAppStateKey.
     * @param oComponent
     * @param sAppStateKey Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getAppState arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.getAppState = async function getAppState(oComponent, sAppStateKey) {
      return this.applicationNavigation.getAppState(oComponent, sAppStateKey);
    }

    /**
     * Will call createEmptyAppState method of CrossApplicationNavigation service with oComponent.
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppState arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.createEmptyAppState = async function createEmptyAppState(oComponent) {
      return this.applicationNavigation.createEmptyAppState(oComponent);
    }

    /**
     * Will call isNavigationSupported method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
     * @param aTargets
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>isNavigationSupported arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.isNavigationSupported = async function isNavigationSupported(aTargets, oComponent) {
      return this.applicationNavigation.isNavigationSupported(aTargets, oComponent);
    }

    /**
     * Triggers a navigation to a specified target outside of the currently running application.
     * @param oTarget The navigation target.
     * @param [oComponent] A UI5 component, used to logically attach any related app state.
     * @returns A Promise resolving once the navigation was triggered. The Promise might never reject or resolve
     *                    when an error occurs during the navigation.
     */;
    _proto2.navigate = async function navigate(oTarget, oComponent) {
      return await this.applicationNavigation.navigate(oTarget, oComponent);
    }

    /**
     * Will call isInitialNavigationAsync method of CrossApplicationNavigation service.
     * @returns Promise which will be resolved to boolean
     */;
    _proto2.isInitialNavigation = async function isInitialNavigation() {
      return this.applicationNavigation.isInitialNavigation();
    }

    /**
     * Will call expandCompactHash method of CrossApplicationNavigation service.
     * @param sHashFragment An (internal format) shell hash
     * @returns A promise the success handler of the resolve promise get an expanded shell hash as first argument
     */;
    _proto2.expandCompactHash = async function expandCompactHash(sHashFragment) {
      return Promise.resolve(sHashFragment); //this.navTargetResolution.expandCompactHash(sHashFragment);
    };
    _proto2.getHash = function getHash() {
      return `#${this.urlParsingService.getShellHash(window.location.href)}`;
    }

    /**
     * Returns a map of all the plugins which are registered with the PluginManager, sorted by supported plugin categories.
     * @returns Map of registered plugins
     */;
    _proto2.getRegisteredPlugins = function getRegisteredPlugins() {
      return this.shellPluginManager.getRegisteredPlugins();
    }

    /**
     * Check for the optimistic batch plugin setup in the FLP.
     * @returns True if the optimistic batch plugin is set up and enabled.
     */;
    _proto2.isFlpOptimisticBatchPluginLoaded = function isFlpOptimisticBatchPluginLoaded() {
      const flpPluginsRendererExtensions = this.getRegisteredPlugins().RendererExtensions;
      if (flpPluginsRendererExtensions?.hasOwnProperty("MANAGE_FE_CACHES") && !!flpPluginsRendererExtensions.MANAGE_FE_CACHES.enabled) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * Will call parseShellHash method of URLParsing service with given sHash.
     * @param sHash Check the definition of
     * sap.ushell.services.URLParsing=>parseShellHash arguments
     * @returns The parsed url
     */;
    _proto2.parseShellHash = function parseShellHash(sHash) {
      return this.urlParsingService.parseShellHash(sHash);
    }

    /**
     * Will call splitHash method of URLParsing service with given sHash.
     * @param sHash Check the definition of
     * sap.ushell.services.URLParsing=>splitHash arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.splitHash = function splitHash(sHash) {
      return this.urlParsingService.splitHash(sHash);
    }

    /**
     * Will call constructShellHash method of URLParsing service with given sHash.
     * @param oNewShellHash Check the definition of
     * sap.ushell.services.URLParsing=>constructShellHash arguments
     * @returns Shell Hash string
     */;
    _proto2.constructShellHash = function constructShellHash(oNewShellHash) {
      return this.urlParsingService.constructShellHash(oNewShellHash);
    }

    /**
     * Will call setDirtyFlag method with given dirty state.
     * @param bDirty Check the definition of sap.ushell.Container.setDirtyFlag arguments
     */;
    _proto2.setDirtyFlag = function setDirtyFlag(bDirty) {
      this.oShellContainer.setDirtyFlag(bDirty);
    }

    /**
     * Will call registerDirtyStateProvider method with given dirty state provider callback method.
     * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.registerDirtyStateProvider arguments
     */;
    _proto2.registerDirtyStateProvider = function registerDirtyStateProvider(fnDirtyStateProvider) {
      this.oShellContainer.registerDirtyStateProvider(fnDirtyStateProvider);
    }

    /**
     * Will call deregisterDirtyStateProvider method with given dirty state provider callback method.
     * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.deregisterDirtyStateProvider arguments
     */;
    _proto2.deregisterDirtyStateProvider = function deregisterDirtyStateProvider(fnDirtyStateProvider) {
      this.oShellContainer.deregisterDirtyStateProvider(fnDirtyStateProvider);
    }

    /**
     * Will call getUser method of ushell container.
     * @returns Returns User object
     */;
    _proto2.getUser = function getUser() {
      return this.userInfoService;
    };
    _proto2.isJamActive = function isJamActive() {
      return this.oShellContainer.getUser().isJamActive();
    };
    _proto2.getUserInitials = function getUserInitials() {
      return this.oShellContainer.getUser().getInitials();
    }

    /**
     * Will check if ushell container is available or not.
     * @returns Returns true
     */;
    _proto2.hasUShell = function hasUShell() {
      return true;
    }

    /**
     * Will call registerNavigationFilter method of shellNavigation.
     * @param fnNavFilter The filter function to register
     */;
    _proto2.registerNavigationFilter = function registerNavigationFilter(fnNavFilter) {
      this.shellNavigation.registerNavigationFilter(fnNavFilter);
    }

    /**
     * Will call unregisterNavigationFilter method of shellNavigation.
     * @param fnNavFilter The filter function to unregister
     */;
    _proto2.unregisterNavigationFilter = function unregisterNavigationFilter(fnNavFilter) {
      this.shellNavigation.unregisterNavigationFilter(fnNavFilter);
    }

    /**
     * Will call setBackNavigation method of ShellUIService
     * that displays the back button in the shell header.
     * @param fnCallBack A callback function called when the button is clicked in the UI.
     */;
    _proto2.setBackNavigation = async function setBackNavigation(fnCallBack) {
      (await this.getShellUIService()).setBackNavigation(fnCallBack);
    }

    /**
     * Will call setHierarchy method of ShellUIService
     * that displays the given hierarchy in the shell header.
     * @param [aHierarchyLevels] An array representing hierarchies of the currently displayed app.
     */;
    _proto2.setHierarchy = async function setHierarchy(aHierarchyLevels) {
      (await this.getShellUIService()).setHierarchy(aHierarchyLevels);
    }

    /**
     * Will call setTitle method of ShellUIService
     * that displays the given title in the shell header.
     * @param [sTitle] The new title. The default title is set if this argument is not given.
     * @param [additionalInformation] An object of additional information to be displayed in the browser window title.
     */;
    _proto2.setTitle = async function setTitle(sTitle, additionalInformation) {
      (await this.getShellUIService()).setTitle(sTitle, additionalInformation);
    }

    /**
     * Will call getTitle method of ShellUIService
     * that displays the given title in the shell header.
     * @returns The title of the application.
     */;
    _proto2.getTitle = async function getTitle() {
      return (await this.getShellUIService()).getTitle();
    }

    /**
     * Retrieves the currently defined content density.
     * @returns The content density value
     */;
    _proto2.getContentDensity = function getContentDensity() {
      return this.oShellContainer.getUser().getContentDensity();
    }

    /**
     * For a given semantic object, this method considers all actions associated with the semantic object and
     * returns the one tagged as a "primaryAction". If no inbound tagged as "primaryAction" exists, then it returns
     * the intent of the first inbound (after sorting has been applied) matching the action "displayFactSheet".
     * @param sSemanticObject Semantic object.
     * @param mParameters See #CrossApplicationNavigation#getLinks for description.
     * @returns Promise which will be resolved with an object containing the intent if it exists.
     */;
    _proto2.getPrimaryIntent = async function getPrimaryIntent(sSemanticObject, mParameters) {
      const primaryIntent = await this.applicationNavigation.getPrimaryIntent(sSemanticObject, mParameters);
      if (Array.isArray(primaryIntent)) {
        return primaryIntent[0];
      } else {
        return primaryIntent;
      }
    }

    /**
     * Wait for the render extensions plugin to be loaded.
     * @returns True if we are able to wait for it, otherwise we couldn't and cannot rely on it.
     */;
    _proto2.waitForPluginsLoad = async function waitForPluginsLoad() {
      return new Promise(resolve => {
        if (!this.shellPluginManager?.getPluginLoadingPromise) {
          resolve(false);
        } else {
          // eslint-disable-next-line promise/catch-or-return
          this.shellPluginManager.getPluginLoadingPromise("RendererExtensions").fail(oError => {
            Log.error(oError, "sap.fe.core.services.ShellServicesFactory.waitForPluginsLoad");
            resolve(false);
          }).then(() => resolve(true));
        }
      });
    }

    /**
     * Get the personalizer from the shell service.
     * We set some defaults for the scope object.
     * @param persId Personalization object
     * @param scope Scope object
     * @param component
     * @returns Personalizer object which handles personalization
     */;
    _proto2.getPersonalizer = async function getPersonalizer(persId, scope, component) {
      scope = {
        // merge some defaults
        keyCategory: this.shellPersonalizationService.constants.keyCategory.FIXED_KEY,
        writeFrequency: this.shellPersonalizationService.constants.writeFrequency.LOW,
        clientStorageAllowed: false,
        validity: Infinity,
        ...scope
      };
      return await this.shellPersonalizationService.getPersonalizer(persId, scope, component);
    }

    /**
     * Deletes a container identified by sContainerKey.
     * @param key Container key
     * @param scope Scope object
     * @returns Promise which is resolved when the container is deleted
     */;
    _proto2.deletePersonalizationContainer = async function deletePersonalizationContainer(key, scope) {
      return this.shellPersonalizationService.deleteContainer(key, scope);
    }

    /**
     * This method initializes the personalizer to access the Application data stored in the shell Personalization.
     * @param itemName The name of the item for which the personalizer is created.
     * @returns A personalizer
     */;
    _proto2.getApplicationPersonalizer = async function getApplicationPersonalizer(itemName) {
      if (!this.applicationPersonnalizers[itemName]) {
        this.applicationPersonnalizers[itemName] = this.getPersonalizer({
          container: `Application#${this.appComponent.getManifest()["sap.app"].id}`,
          item: itemName
        }, {}, this.appComponent);
      }
      return this.applicationPersonnalizers[itemName];
    }

    /**
     * This method returns data from the personalization service.
     * @param itemName
     * @returns Data
     */;
    _proto2.getApplicationPersonalizationData = async function getApplicationPersonalizationData(itemName) {
      return await (await this.getApplicationPersonalizer(itemName))?.getPersData();
    }

    /**
     * This method stores an object in the personalization service.
     * @param itemName
     * @param data
     * @returns A promise
     */;
    _proto2.setApplicationPersonalizationData = async function setApplicationPersonalizationData(itemName, data) {
      (await this.getApplicationPersonalizer(itemName)).setPersData(data);
    }

    /**
     * Get the shell config from the windows object.
     * @returns Shell config object
     */;
    _proto2.getShellConfig = function getShellConfig() {
      return window["sap-ushell-config"];
    }

    /**
     * Parse parameters from a URI query string (starting with ?) into a parameter object.
     * @param url Check the definition of
     * Parameter string
     * @returns An object containg string arrays
     */;
    _proto2.parseParameters = function parseParameters(url) {
      return this.urlParsingService.parseParameters(url);
    }

    /**
     * Get the shell extension service.
     * @returns Shell extension service
     */;
    _proto2.getExtensionService = function getExtensionService() {
      return this.extensionService;
    };
    return ShellServices;
  }(Service);
  /**
   * Service Factory for the ShellServices
   *
   */
  _exports.ShellServices = ShellServices;
  let ShellServicesFactory = /*#__PURE__*/function (_ServiceFactory) {
    function ShellServicesFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _inheritsLoose(ShellServicesFactory, _ServiceFactory);
    var _proto3 = ShellServicesFactory.prototype;
    /**
     * Creates either a standard or a mock Shell service depending on the configuration.
     * @param serviceContext The shellservice context
     * @returns A promise for a shell service implementation
     * @see ServiceFactory#createInstance
     */
    _proto3.createInstance = async function createInstance(serviceContext) {
      serviceContext.settings.shellContainer = sap.ui.require("sap/ushell/Container");
      const shellService = serviceContext.settings.shellContainer ? new ShellServices(serviceContext) : new ShellServiceMock(serviceContext);
      await shellService.initPromise;
      // Enrich the appComponent with this method
      const appComponent = serviceContext.scopeObject;
      appComponent.getShellServices = () => shellService;
      const internalModel = appComponent.getModel("internal");
      if (internalModel) {
        let semanticObjects = [];
        try {
          semanticObjects = await shellService.__fetchSemanticObject();
        } catch (error) {
          Log.error("Error while calling getSemanticObjects", error);
        } finally {
          internalModel.setProperty("/semanticObjects", semanticObjects);
        }
      }
      return shellService;
    };
    return ShellServicesFactory;
  }(ServiceFactory);
  return ShellServicesFactory;
}, false);
//# sourceMappingURL=ShellServicesFactory-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/i18n/Localization", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateModel", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/definition/FEDefinition", "sap/fe/core/helpers/LoaderUtils", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/ui/Device", "sap/ui/VersionInfo", "sap/ui/core/Core", "sap/ui/core/mvc/View", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/core/service/ServiceFactoryRegistry", "sap/ui/model/json/JSONModel", "../helpers/DynamicAnnotationPathHelper"], function (Log, Localization, CommonUtils, TemplateModel, ManifestSettings, ManifestWrapper, FEDefinition, LoaderUtils, ModelHelper, ChangePageConfiguration, Device, VersionInfo, Core, View, Service, ServiceFactory, ServiceFactoryRegistry, JSONModel, DynamicAnnotationPathHelper) {
  "use strict";

  var resolveDynamicExpression = DynamicAnnotationPathHelper.resolveDynamicExpression;
  var applyPageConfigurationChanges = ChangePageConfiguration.applyPageConfigurationChanges;
  var requireDependencies = LoaderUtils.requireDependencies;
  var DefinitionContext = FEDefinition.DefinitionContext;
  var TemplateType = ManifestSettings.TemplateType;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let TemplatedViewService = /*#__PURE__*/function (_Service) {
    function TemplatedViewService() {
      return _Service.apply(this, arguments) || this;
    }
    _inheritsLoose(TemplatedViewService, _Service);
    var _proto = TemplatedViewService.prototype;
    _proto.init = function init() {
      const aServiceDependencies = [];
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      const oAppComponent = CommonUtils.getAppComponent(oComponent);
      const oMetaModel = oAppComponent.getMetaModel();
      this.pageId = oAppComponent.getLocalId(oComponent.getId());
      const sStableId = `${oAppComponent.getMetadata().getComponentName()}::${this.pageId}`;
      const aEnhanceI18n = oComponent.getEnhanceI18n() || [];
      let sAppNamespace;
      this.oFactory = oContext.factory;
      if (aEnhanceI18n) {
        sAppNamespace = oAppComponent.getMetadata().getComponentName();
        for (let i = 0; i < aEnhanceI18n.length; i++) {
          // In order to support text-verticalization applications can also pass a resource model defined in the manifest
          // UI5 takes care of text-verticalization for resource models defined in the manifest
          // Hence check if the given key is a resource model defined in the manifest
          // if so this model should be used to enhance the sap.fe resource model so pass it as it is
          const oResourceModel = oAppComponent.getModel(aEnhanceI18n[i]);
          if (oResourceModel && oResourceModel.isA("sap.ui.model.resource.ResourceModel")) {
            aEnhanceI18n[i] = oResourceModel;
          } else {
            aEnhanceI18n[i] = `${sAppNamespace}.${aEnhanceI18n[i].replace(".properties", "")}`;
          }
        }
      }
      const sCacheIdentifier = `${oAppComponent.getMetadata().getName()}_${sStableId}_${Localization.getLanguageTag()}`;
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.ResourceModelService").createInstance({
        scopeType: "component",
        scopeObject: oComponent,
        settings: {
          bundles: ["sap.fe.core.messagebundle", "sap.fe.macros.messagebundle", "sap.fe.templates.messagebundle"],
          enhanceI18n: aEnhanceI18n,
          modelName: "sap.fe.i18n"
        }
      }).then(oResourceModelService => {
        this.oResourceModelService = oResourceModelService;
        return oResourceModelService.getResourceModel();
      }));
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").createInstance({
        settings: {
          metaModel: oMetaModel,
          appComponent: oAppComponent,
          component: oComponent
        }
      }).then(async oCacheHandlerService => {
        this.oCacheHandlerService = oCacheHandlerService;
        return oCacheHandlerService.validateCacheKey(sCacheIdentifier, oComponent, oAppComponent.getEnvironmentCapabilities());
      }));
      aServiceDependencies.push(VersionInfo.load().then(function (oInfo) {
        let sTimestamp = "";
        if (!oInfo.libraries) {
          sTimestamp = Core?.buildinfo?.buildtime ?? "<NOVALUE>";
        } else {
          oInfo.libraries.forEach(function (oLibrary) {
            sTimestamp += oLibrary.buildTimestamp;
          });
        }
        return sTimestamp;
      }).catch(function () {
        return "<NOVALUE>";
      }));
      this.initPromise = Promise.all(aServiceDependencies).then(async aDependenciesResult => {
        const oResourceModel = aDependenciesResult[0];
        const sCacheKey = aDependenciesResult[1];
        const [TemplateConverter, MetaModelConverter] = await requireDependencies(["sap/fe/core/converters/TemplateConverter", "sap/fe/core/converters/MetaModelConverter"]);
        return this.createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter);
      }).then(function (sCacheKey) {
        const oCacheHandlerService = ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").getInstance(oMetaModel);
        oCacheHandlerService.invalidateIfNeeded(sCacheKey, sCacheIdentifier, oComponent, oAppComponent.getEnvironmentCapabilities());
        return;
      });
    }

    /**
     * Refresh the current view using the same configuration as before.
     * @param oComponent
     * @returns A promise indicating when the view is refreshed
     */;
    _proto.refreshView = async function refreshView(oComponent) {
      const oRootView = oComponent.getRootControl();
      if (oRootView) {
        oRootView.destroy();
      } else if (this.oView) {
        this.oView.destroy();
      }
      return this.createView(this.resourceModel, this.stableId, "", this.TemplateConverter, this.MetaModelConverter).then(function () {
        oComponent.getUIArea().invalidate();
        return;
      }).catch(function (oError) {
        oComponent.getUIArea().invalidate();
        Log.error(oError);
      });
    };
    _proto._getViewSettings = function _getViewSettings(preprocessorContext, mServiceSettings, oComponent, mViewData, sCacheKey, oPageModel, oResourceModel) {
      let viewType = mServiceSettings.viewType || oComponent.getViewType() || "XML";
      if (viewType !== "XML") {
        viewType = undefined;
      }
      return {
        type: viewType,
        preprocessors: {
          xml: preprocessorContext,
          controls: {}
        },
        id: mViewData.stableId,
        viewName: mServiceSettings.viewName || oComponent.getViewName?.(),
        viewData: mViewData,
        cache: {
          keys: [sCacheKey],
          additionalData: {
            // We store the page model data in the `additionalData` of the view cache, this way it is always in sync
            getAdditionalCacheData: () => {
              return oPageModel.getData();
            },
            setAdditionalCacheData: value => {
              oPageModel.setData(value);
            }
          }
        },
        models: {
          "sap.fe.i18n": oResourceModel
        },
        height: "100%"
      };
    };
    _proto._createErrorPage = async function _createErrorPage(reason, oViewSettings, viewName, oComponent, sCacheKey) {
      // just replace the view name and a model containing the reason, but keep the other settings
      Log.error(reason.message, reason);
      oViewSettings.viewName = viewName;
      if (oViewSettings.preprocessors) {
        oViewSettings.preprocessors.xml.models["error"] = new JSONModel(reason);
      }
      return oComponent.runAsOwner(async () => {
        return View.create(oViewSettings).then(oView => {
          this.oView = oView;
          this.oView.setModel(new JSONModel(this.oView), "$view");
          oComponent.setAggregation("rootControl", this.oView);
          oComponent.getAppComponent().getRootControl().getController().getPlaceholder().hideRootPlaceholder();
          return sCacheKey;
        });
      });
    };
    _proto.createView = async function createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter) {
      this.resourceModel = oResourceModel;
      this.stableId = sStableId;
      this.TemplateConverter = TemplateConverter;
      this.MetaModelConverter = MetaModelConverter;
      const oContext = this.getContext();
      const mServiceSettings = oContext.settings;
      const sConverterType = mServiceSettings.converterType;
      const oComponent = oContext.scopeObject;
      const oAppComponent = CommonUtils.getAppComponent(oComponent);
      let sFullContextPath = oAppComponent.getRoutingService().getTargetInformationFor(oComponent)?.options?.settings?.fullContextPath ?? "";
      if (!sFullContextPath) {
        // if the context path couldn't be retrieved from the routing service, try to get it from the component itself
        sFullContextPath = oComponent.getContextPath() ?? "";
      }
      const oMetaModel = oAppComponent.getMetaModel();
      const oManifestContent = oAppComponent.getManifest();
      const oDeviceModel = new JSONModel(Device).setDefaultBindingMode("OneWay");
      const oManifestModel = new JSONModel(oManifestContent);
      let oPageModel, oViewDataModel, mViewData;
      // Load the index for the additional building blocks which is responsible for initializing them
      try {
        const oRoutingService = await oAppComponent.getService("routingService");
        // Retrieve the viewLevel for the component
        const oTargetInfo = oRoutingService.getTargetInformationFor(oComponent);
        const mOutbounds = oManifestContent["sap.app"] && oManifestContent["sap.app"].crossNavigation && oManifestContent["sap.app"].crossNavigation.outbounds || {};
        const mNavigation = oComponent.getNavigation() || {};
        this._enhanceNavigationConfig(mNavigation, mOutbounds);
        const convertedMetadata = MetaModelConverter.convertTypes(oMetaModel, oAppComponent.getEnvironmentCapabilities().getCapabilities());
        const definitionContext = new DefinitionContext(convertedMetadata);
        definitionContext.addApplicationManifest(oManifestContent);
        mViewData = {
          appComponent: oAppComponent,
          navigation: mNavigation,
          viewLevel: oTargetInfo?.viewLevel,
          stableId: sStableId,
          contentDensities: oManifestContent["sap.ui5"]?.contentDensities,
          resourceModel: oResourceModel,
          fullContextPath: sFullContextPath,
          isDesktop: Device.system.desktop,
          isPhone: Device.system.phone,
          converterType: TemplateType.FreeStylePage
        };
        if (oComponent.getViewData) {
          Object.assign(mViewData, oComponent.getViewData());
          mViewData = TemplatedViewServiceFactory.setPageConfigurationChanges(oManifestContent, mViewData, oAppComponent, this.pageId);
        }
        mViewData.isShareButtonVisibleForMyInbox = TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox(oAppComponent);
        const oShellServices = oAppComponent.getShellServices();
        mViewData.converterType = sConverterType;
        mViewData.shellContentDensity = oShellServices.getContentDensity();
        const sapfeManifestContent = oManifestContent["sap.fe"];
        mViewData.sapFeManifestConfiguration = oManifestContent["sap.fe"];
        mViewData.retrieveTextFromValueList = sapfeManifestContent?.form ? sapfeManifestContent?.form?.retrieveTextFromValueList : undefined;
        oViewDataModel = new JSONModel(mViewData);
        if (mViewData.controlConfiguration) {
          for (const sAnnotationPath in mViewData.controlConfiguration) {
            if (sAnnotationPath.includes("[")) {
              const sTargetAnnotationPath = resolveDynamicExpression(sAnnotationPath, oMetaModel);
              mViewData.controlConfiguration[sTargetAnnotationPath] = mViewData.controlConfiguration[sAnnotationPath];
            }
          }
        }
        oPageModel = new TemplateModel(() => {
          try {
            const oDiagnostics = oAppComponent.getDiagnostics();
            const iIssueCount = oDiagnostics.getIssues().length;
            const oConverterPageModel = TemplateConverter.convertPage(sConverterType, oMetaModel, mViewData, new ManifestWrapper(mViewData, oAppComponent), oDiagnostics, sFullContextPath, oAppComponent.getEnvironmentCapabilities().getCapabilities(), oComponent);
            const aIssues = oDiagnostics.getIssues();
            const aAddedIssues = aIssues.slice(iIssueCount);
            if (aAddedIssues.length > 0) {
              Log.warning("Some issues have been detected in your project, please check the UI5 support assistant rule for sap.fe.core");
            }
            return oConverterPageModel;
          } catch (error) {
            Log.error(error, error);
            return {};
          }
        }, oMetaModel);
        const aSplitPath = sFullContextPath.split("/");
        const sEntitySetPath = this._getFullPathToEntitySet(aSplitPath, oMetaModel);
        const preprocessorContext = {
            bindingContexts: {
              entitySet: sEntitySetPath ? oMetaModel.createBindingContext(sEntitySetPath) : null,
              fullContextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
              contextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
              converterContext: oPageModel.createBindingContext("/", undefined, {
                noResolve: true
              }),
              viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
            },
            models: {
              entitySet: oMetaModel,
              fullContextPath: oMetaModel,
              contextPath: oMetaModel,
              "sap.fe.i18n": oResourceModel,
              metaModel: oMetaModel,
              device: oDeviceModel,
              manifest: oManifestModel,
              converterContext: oPageModel,
              viewData: oViewDataModel
            },
            fullContextPath: sFullContextPath,
            getConvertedMetadata: () => convertedMetadata,
            getDefinitionContext() {
              return definitionContext;
            },
            getDefinitionForPage() {
              let fullContextPath = sFullContextPath;
              if (fullContextPath.endsWith("/")) {
                fullContextPath = fullContextPath.substring(0, fullContextPath.length - 1);
              }
              return definitionContext.getPageFor(fullContextPath);
            },
            appComponent: oAppComponent,
            viewId: sStableId
          },
          oViewSettings = this._getViewSettings(preprocessorContext, mServiceSettings, oComponent, mViewData, sCacheKey, oPageModel, oResourceModel);
        // Setting the pageModel on the component for potential reuse
        oComponent.setModel(oPageModel, "_pageModel");
        oComponent.setPreprocessorContext(preprocessorContext);
        return oComponent.runAsOwner(async () => {
          return View.create(oViewSettings).then(oView => {
            this.oView = oView;
            const viewJSONModel = new JSONModel(this.oView);
            ModelHelper.enhanceViewJSONModel(viewJSONModel);
            this.oView.setModel(viewJSONModel, "$view");
            this.oView.setModel(oViewDataModel, "viewData");
            oComponent.setAggregation("rootControl", this.oView);
            return sCacheKey;
          }).catch(async reason => this._createErrorPage(reason, oViewSettings, mServiceSettings.errorViewName || "sap.fe.core.services.view.TemplatingErrorPage", oComponent, sCacheKey)).catch(e => Log.error(e.message, e));
        });
      } catch (error) {
        Log.error(error.message, error);
        throw new Error(`Error while creating view : ${error}`);
      }
    };
    _proto._enhanceNavigationConfig = function _enhanceNavigationConfig(mNavigation, mOutbounds) {
      Object.keys(mNavigation).forEach(function (navigationObjectKey) {
        const navigationObject = mNavigation[navigationObjectKey];
        let outboundConfig;
        if (navigationObject.detail && navigationObject.detail.outbound && mOutbounds[navigationObject.detail.outbound]) {
          outboundConfig = mOutbounds[navigationObject.detail.outbound];
          navigationObject.detail.outboundDetail = {
            semanticObject: outboundConfig.semanticObject,
            action: outboundConfig.action,
            parameters: outboundConfig.parameters
          };
        }
        if (navigationObject.create && navigationObject.create.outbound && mOutbounds[navigationObject.create.outbound]) {
          outboundConfig = mOutbounds[navigationObject.create.outbound];
          navigationObject.create.outboundDetail = {
            semanticObject: outboundConfig.semanticObject,
            action: outboundConfig.action,
            parameters: outboundConfig.parameters
          };
        }
      });
    };
    _proto._getFullPathToEntitySet = function _getFullPathToEntitySet(aSplitPath, oMetaModel) {
      return aSplitPath.reduce(function (sPathSoFar, sNextPathPart) {
        if (sNextPathPart === "") {
          return sPathSoFar;
        }
        if (sPathSoFar === "") {
          sPathSoFar = `/${sNextPathPart}`;
        } else {
          const oTarget = oMetaModel.getObject(`${sPathSoFar}/$NavigationPropertyBinding/${sNextPathPart}`);
          if (oTarget && Object.keys(oTarget).length > 0) {
            sPathSoFar += "/$NavigationPropertyBinding";
          }
          sPathSoFar += `/${sNextPathPart}`;
        }
        return sPathSoFar;
      }, "");
    };
    _proto.getView = function getView() {
      return this.oView;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.exit = function exit() {
      // Deregister global instance
      if (this.oResourceModelService) {
        this.oResourceModelService.destroy();
      }
      if (this.oCacheHandlerService) {
        this.oCacheHandlerService.destroy();
      }
      this.oFactory.removeGlobalInstance();
    };
    return TemplatedViewService;
  }(Service);
  let TemplatedViewServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function TemplatedViewServiceFactory() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ServiceFactory.call(this, ...args) || this;
      _this._oInstanceRegistry = {};
      return _this;
    }
    _inheritsLoose(TemplatedViewServiceFactory, _ServiceFactory);
    var _proto2 = TemplatedViewServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      TemplatedViewServiceFactory.iCreatingViews++;
      const oTemplatedViewService = new TemplatedViewService(Object.assign({
        factory: this
      }, oServiceContext));
      return oTemplatedViewService.initPromise.then(function () {
        TemplatedViewServiceFactory.iCreatingViews--;
        return oTemplatedViewService;
      });
    };
    _proto2.removeGlobalInstance = function removeGlobalInstance() {
      this._oInstanceRegistry = {};
    }

    /**
     * This function checks if the component data specifies the visibility of the 'Share' button and returns true or false based on the visibility.
     * @param appComponent Specifies the app component
     * @returns Boolean value as true or false based whether the 'Share' button should be visible or not
     */;
    TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox = function getShareButtonVisibilityForMyInbox(appComponent) {
      const componentData = appComponent.getComponentData();
      if (componentData !== undefined && componentData.feEnvironment) {
        return componentData.feEnvironment.getShareControlVisibility();
      }
      return undefined;
    };
    TemplatedViewServiceFactory.getNumberOfViewsInCreationState = function getNumberOfViewsInCreationState() {
      return TemplatedViewServiceFactory.iCreatingViews;
    }

    /**
     * Sets page configuration changes for a specific page identified by its ID.
     * @param manifest The manifest content object containing configuration details.
     * @param viewData The view data object representing the current state of the view.
     * @param appComponent The application component instance.
     * @param pageId The unique identifier of the page for which configuration changes are to be applied.
     * @returns The updated view data object reflecting the applied changes.
     */;
    TemplatedViewServiceFactory.setPageConfigurationChanges = function setPageConfigurationChanges(manifest, viewData, appComponent, pageId) {
      const targets = manifest?.["sap.ui5"]?.routing?.targets ?? {};
      let realTarget = "";
      for (const targetToFind in targets) {
        if (targets[targetToFind].id === pageId) {
          realTarget = targetToFind;
          break;
        }
      }
      if (realTarget === "") {
        realTarget = pageId;
      }
      const actualSettings = manifest?.["sap.ui5"]?.routing?.targets?.[realTarget]?.options?.settings || {};
      return applyPageConfigurationChanges(actualSettings, viewData, appComponent, pageId);
    };
    return TemplatedViewServiceFactory;
  }(ServiceFactory);
  return TemplatedViewServiceFactory;
}, false);
//# sourceMappingURL=TemplatedViewServiceFactory-dbg.js.map

import type { SAPJSONSchemaForWebApplicationManifestFile } from "@ui5/manifest/types/manifest";
import Log from "sap/base/Log";
import Localization from "sap/base/i18n/Localization";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { ComponentData } from "sap/fe/core/AppComponent";
import type { SemanticObject } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { NavigationConfiguration, XMLPreprocessorContext } from "sap/fe/core/TemplateComponent";
import TemplateModel from "sap/fe/core/TemplateModel";
import type { SurveyConfig } from "sap/fe/core/controllerextensions/Feedback";
import type {
	BaseManifestSettings,
	ContentDensitiesType,
	ControlConfiguration,
	ManifestAction,
	ManifestHeaderFacet,
	VariantManagementType
} from "sap/fe/core/converters/ManifestSettings";
import { TemplateType } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import type * as _MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type * as _TemplateConverter from "sap/fe/core/converters/TemplateConverter";
import type { ConfigurableRecord } from "sap/fe/core/converters/helpers/ConfigurableObject";
import type { DefinitionPage } from "sap/fe/core/definition/FEDefinition";
import { DefinitionContext } from "sap/fe/core/definition/FEDefinition";
import { requireDependencies } from "sap/fe/core/helpers/LoaderUtils";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { applyPageConfigurationChanges } from "sap/fe/core/manifestMerger/ChangePageConfiguration";
import type { CacheHandlerService } from "sap/fe/core/services/CacheHandlerServiceFactory";
import Device from "sap/ui/Device";
import VersionInfo from "sap/ui/VersionInfo";
import Core from "sap/ui/core/Core";
import type { ManifestContent, ManifestOutboundEntry, ShareOptions } from "sap/ui/core/Manifest";
import View from "sap/ui/core/mvc/View";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import ServiceFactoryRegistry from "sap/ui/core/service/ServiceFactoryRegistry";
import type Model from "sap/ui/model/Model";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { ServiceContext } from "types/metamodel_types";
import { resolveDynamicExpression } from "../helpers/DynamicAnnotationPathHelper";
import type { ResourceModelService } from "./ResourceModelServiceFactory";

type TemplatedViewServiceSettings = {
	viewType?: string;
	viewName?: string;
};

type ViewSettings = Parameters<typeof View.create>[0] & { cache: unknown; models: unknown; height: string };
export type ViewData = {
	showBreadCrumbs?: boolean;
	fclEnabled?: boolean;
	editableHeaderContent?: boolean;
	hideFilterBar?: boolean;
	useHiddenFilterBar?: boolean;
	sectionLayout?: string;
	additionalSemanticObjects?: Record<string, SemanticObject>;
	appComponent: AppComponent;
	navigation: object;
	viewLevel: number;
	variantManagement?: VariantManagementType;
	stableId: string;
	contentDensities?: ContentDensitiesType;
	resourceModel: ResourceModel;
	fullContextPath: string;
	isDesktop: boolean;
	isPhone: boolean;
	converterType: TemplateType;
	shellContentDensity?: string;
	useNewLazyLoading?: boolean;
	initialLoad?: string;
	liveMode?: boolean;
	retrieveTextFromValueList?: boolean;
	controlConfiguration?: ControlConfiguration;
	refreshStrategyOnAppRestore?: unknown;
	entitySet?: string;
	isShareButtonVisibleForMyInbox?: boolean;
	contextPath?: string;
	share?: ShareOptions;
	sapFeManifestConfiguration?: ManifestContent["sap.fe"];
	content?: {
		feedback?: { actions?: Record<string, SurveyConfig>; standardActions?: Record<string, SurveyConfig> };
		header?: {
			facets?: ConfigurableRecord<ManifestHeaderFacet>;
			actions?: ConfigurableRecord<ManifestAction>;
		};
		footer?: {
			actions?: ConfigurableRecord<ManifestAction>;
		};
	};
};
class TemplatedViewService extends Service<TemplatedViewServiceSettings> {
	initPromise!: Promise<void>;

	oView!: View;

	oResourceModelService!: ResourceModelService;

	oCacheHandlerService!: CacheHandlerService;

	oFactory!: TemplatedViewServiceFactory;

	resourceModel!: ResourceModel;

	stableId!: string;

	pageId!: string;

	TemplateConverter?: typeof _TemplateConverter;

	MetaModelConverter?: typeof _MetaModelConverter;

	init(): void {
		const aServiceDependencies = [];
		const oContext = this.getContext();
		const oComponent = oContext.scopeObject;
		const oAppComponent = CommonUtils.getAppComponent(oComponent);
		const oMetaModel = oAppComponent.getMetaModel();
		this.pageId = oAppComponent.getLocalId(oComponent.getId()) as string;
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
		aServiceDependencies.push(
			ServiceFactoryRegistry.get("sap.fe.core.services.ResourceModelService")
				.createInstance({
					scopeType: "component",
					scopeObject: oComponent,
					settings: {
						bundles: ["sap.fe.core.messagebundle", "sap.fe.macros.messagebundle", "sap.fe.templates.messagebundle"],
						enhanceI18n: aEnhanceI18n,
						modelName: "sap.fe.i18n"
					}
				})
				.then((oResourceModelService: ResourceModelService) => {
					this.oResourceModelService = oResourceModelService;
					return oResourceModelService.getResourceModel();
				})
		);
		aServiceDependencies.push(
			ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService")
				.createInstance({
					settings: {
						metaModel: oMetaModel,
						appComponent: oAppComponent,
						component: oComponent
					}
				})
				.then(async (oCacheHandlerService: CacheHandlerService): Promise<string | null> => {
					this.oCacheHandlerService = oCacheHandlerService;
					return oCacheHandlerService.validateCacheKey(sCacheIdentifier, oComponent, oAppComponent.getEnvironmentCapabilities());
				})
		);
		aServiceDependencies.push(
			VersionInfo.load()
				.then(function (oInfo) {
					let sTimestamp = "";
					if (!oInfo.libraries) {
						sTimestamp = (Core as { buildinfo?: { buildtime?: string } })?.buildinfo?.buildtime ?? "<NOVALUE>";
					} else {
						oInfo.libraries.forEach(function (oLibrary) {
							sTimestamp += oLibrary.buildTimestamp;
						});
					}
					return sTimestamp;
				})
				.catch(function () {
					return "<NOVALUE>";
				})
		);
		this.initPromise = Promise.all(aServiceDependencies)
			.then(async (aDependenciesResult: unknown[]) => {
				const oResourceModel = aDependenciesResult[0] as ResourceModel;
				const sCacheKey = aDependenciesResult[1] as string | null;
				const [TemplateConverter, MetaModelConverter] = await requireDependencies([
					"sap/fe/core/converters/TemplateConverter",
					"sap/fe/core/converters/MetaModelConverter"
				]);
				return this.createView(
					oResourceModel,
					sStableId,
					sCacheKey,
					TemplateConverter as typeof _TemplateConverter,
					MetaModelConverter as typeof _MetaModelConverter
				);
			})
			.then(function (sCacheKey: string | void | null): void {
				const oCacheHandlerService = ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").getInstance(oMetaModel);
				oCacheHandlerService.invalidateIfNeeded(
					sCacheKey,
					sCacheIdentifier,
					oComponent,
					oAppComponent.getEnvironmentCapabilities()
				);
				return;
			});
	}

	/**
	 * Refresh the current view using the same configuration as before.
	 * @param oComponent
	 * @returns A promise indicating when the view is refreshed
	 */
	async refreshView(oComponent: TemplateComponent): Promise<void> {
		const oRootView = oComponent.getRootControl();
		if (oRootView) {
			oRootView.destroy();
		} else if (this.oView) {
			this.oView.destroy();
		}
		return this.createView(this.resourceModel, this.stableId, "", this.TemplateConverter!, this.MetaModelConverter!)
			.then(function (): void {
				oComponent.getUIArea().invalidate();
				return;
			})
			.catch(function (oError: unknown) {
				oComponent.getUIArea().invalidate();
				Log.error(oError as string);
			});
	}

	_getViewSettings(
		preprocessorContext: XMLPreprocessorContext,
		mServiceSettings: TemplatedViewServiceSettings,
		oComponent: EnhanceWithUI5<TemplateComponent>,
		mViewData: ViewData,
		sCacheKey: string | null,
		oPageModel: JSONModel,
		oResourceModel: ResourceModel
	): ViewSettings {
		let viewType: string | undefined = mServiceSettings.viewType || oComponent.getViewType() || "XML";
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
					getAdditionalCacheData: (): unknown => {
						return oPageModel.getData();
					},
					setAdditionalCacheData: (value: object): void => {
						oPageModel.setData(value);
					}
				}
			},
			models: {
				"sap.fe.i18n": oResourceModel
			},
			height: "100%"
		};
	}

	async _createErrorPage(
		reason: Error,
		oViewSettings: ViewSettings,
		viewName: string,
		oComponent: TemplateComponent,
		sCacheKey: string | null
	): Promise<string> {
		// just replace the view name and a model containing the reason, but keep the other settings
		Log.error(reason.message, reason);
		oViewSettings.viewName = viewName;
		if (oViewSettings.preprocessors) {
			(oViewSettings.preprocessors as Record<string, { models: Record<string, Model> }>).xml.models["error"] = new JSONModel(reason);
		}

		return oComponent.runAsOwner(async () => {
			return View.create(oViewSettings).then((oView: View) => {
				this.oView = oView;
				this.oView.setModel(new JSONModel(this.oView), "$view");
				oComponent.setAggregation("rootControl", this.oView);
				oComponent.getAppComponent().getRootControl().getController().getPlaceholder().hideRootPlaceholder();
				return sCacheKey;
			});
		}) as Promise<string>;
	}

	async createView(
		oResourceModel: ResourceModel,
		sStableId: string,
		sCacheKey: string | null,
		TemplateConverter: typeof _TemplateConverter,
		MetaModelConverter: typeof _MetaModelConverter
	): Promise<string | null | void> {
		this.resourceModel = oResourceModel;
		this.stableId = sStableId;
		this.TemplateConverter = TemplateConverter;
		this.MetaModelConverter = MetaModelConverter;
		const oContext = this.getContext();
		const mServiceSettings = oContext.settings;
		const sConverterType = mServiceSettings.converterType;
		const oComponent = oContext.scopeObject as EnhanceWithUI5<TemplateComponent>;
		const oAppComponent = CommonUtils.getAppComponent(oComponent);
		let sFullContextPath: string =
			oAppComponent.getRoutingService().getTargetInformationFor(oComponent)?.options?.settings?.fullContextPath ?? "";
		if (!sFullContextPath) {
			// if the context path couldn't be retrieved from the routing service, try to get it from the component itself
			sFullContextPath = oComponent.getContextPath() ?? "";
		}
		const oMetaModel = oAppComponent.getMetaModel();
		const oManifestContent = oAppComponent.getManifest();
		const oDeviceModel = new JSONModel(Device).setDefaultBindingMode("OneWay");
		const oManifestModel = new JSONModel(oManifestContent);
		let oPageModel: TemplateModel, oViewDataModel: Model, mViewData: ViewData;
		// Load the index for the additional building blocks which is responsible for initializing them
		try {
			const oRoutingService = await oAppComponent.getService("routingService");
			// Retrieve the viewLevel for the component
			const oTargetInfo = oRoutingService.getTargetInformationFor(oComponent);
			const mOutbounds =
				(oManifestContent["sap.app"] &&
					oManifestContent["sap.app"].crossNavigation &&
					oManifestContent["sap.app"].crossNavigation.outbounds) ||
				{};
			const mNavigation = oComponent.getNavigation() || {};
			this._enhanceNavigationConfig(mNavigation, mOutbounds);
			const convertedMetadata = MetaModelConverter.convertTypes(
				oMetaModel,
				oAppComponent.getEnvironmentCapabilities().getCapabilities()
			);
			const definitionContext = new DefinitionContext(convertedMetadata);
			definitionContext.addApplicationManifest(oManifestContent as SAPJSONSchemaForWebApplicationManifestFile);

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
				mViewData = TemplatedViewServiceFactory.setPageConfigurationChanges(
					oManifestContent,
					mViewData,
					oAppComponent,
					this.pageId
				);
			}
			mViewData.isShareButtonVisibleForMyInbox = TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox(oAppComponent);
			const oShellServices = oAppComponent.getShellServices();
			mViewData.converterType = sConverterType;
			mViewData.shellContentDensity = oShellServices.getContentDensity();
			const sapfeManifestContent = oManifestContent["sap.fe"];
			mViewData.sapFeManifestConfiguration = oManifestContent["sap.fe"];
			mViewData.retrieveTextFromValueList = sapfeManifestContent?.form
				? sapfeManifestContent?.form?.retrieveTextFromValueList
				: undefined;
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
					const oConverterPageModel = TemplateConverter.convertPage(
						sConverterType,
						oMetaModel,
						mViewData as unknown as BaseManifestSettings,
						new ManifestWrapper(mViewData as unknown as BaseManifestSettings, oAppComponent),
						oDiagnostics,
						sFullContextPath,
						oAppComponent.getEnvironmentCapabilities().getCapabilities(),
						oComponent
					);
					const aIssues = oDiagnostics.getIssues();
					const aAddedIssues = aIssues.slice(iIssueCount);
					if (aAddedIssues.length > 0) {
						Log.warning(
							"Some issues have been detected in your project, please check the UI5 support assistant rule for sap.fe.core"
						);
					}
					return oConverterPageModel;
				} catch (error: unknown) {
					Log.error(error as string, error as string);
					return {};
				}
			}, oMetaModel);
			const aSplitPath = sFullContextPath.split("/");
			const sEntitySetPath = this._getFullPathToEntitySet(aSplitPath, oMetaModel);
			const preprocessorContext: XMLPreprocessorContext = {
					bindingContexts: {
						entitySet: sEntitySetPath ? oMetaModel.createBindingContext(sEntitySetPath) : null,
						fullContextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
						contextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
						converterContext: oPageModel.createBindingContext("/", undefined, { noResolve: true }),
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
						converterContext: oPageModel as unknown as JSONModel,
						viewData: oViewDataModel
					},
					fullContextPath: sFullContextPath,
					getConvertedMetadata: () => convertedMetadata,
					getDefinitionContext(): DefinitionContext {
						return definitionContext;
					},
					getDefinitionForPage(): DefinitionPage {
						let fullContextPath = sFullContextPath;
						if (fullContextPath.endsWith("/")) {
							fullContextPath = fullContextPath.substring(0, fullContextPath.length - 1);
						}
						return definitionContext.getPageFor(fullContextPath);
					},
					appComponent: oAppComponent,
					viewId: sStableId
				},
				oViewSettings = this._getViewSettings(
					preprocessorContext,
					mServiceSettings,
					oComponent,
					mViewData,
					sCacheKey,
					oPageModel as unknown as JSONModel,
					oResourceModel
				);
			// Setting the pageModel on the component for potential reuse
			oComponent.setModel(oPageModel as unknown as JSONModel, "_pageModel");
			oComponent.setPreprocessorContext(preprocessorContext);
			return oComponent.runAsOwner(async () => {
				return View.create(oViewSettings)

					.then((oView: View) => {
						this.oView = oView;
						const viewJSONModel = new JSONModel(this.oView);
						ModelHelper.enhanceViewJSONModel(viewJSONModel as JSONModel & { _getObject: Function });
						this.oView.setModel(viewJSONModel, "$view");
						this.oView.setModel(oViewDataModel, "viewData");
						oComponent.setAggregation("rootControl", this.oView);
						return sCacheKey;
					})
					.catch(async (reason: Error) =>
						this._createErrorPage(
							reason,
							oViewSettings,
							mServiceSettings.errorViewName || "sap.fe.core.services.view.TemplatingErrorPage",
							oComponent,
							sCacheKey
						)
					)
					.catch((e) => Log.error(e.message, e));
			});
		} catch (error: unknown) {
			Log.error((error as Error).message, error as string);
			throw new Error(`Error while creating view : ${error}`);
		}
	}

	private _enhanceNavigationConfig(
		mNavigation: Record<string, NavigationConfiguration>,
		mOutbounds: Record<string, ManifestOutboundEntry>
	): void {
		Object.keys(mNavigation).forEach(function (navigationObjectKey: string): void {
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
	}

	private _getFullPathToEntitySet(aSplitPath: string[], oMetaModel: ODataMetaModel): string {
		return aSplitPath.reduce(function (sPathSoFar: string, sNextPathPart: string): string {
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
	}

	getView(): View {
		return this.oView;
	}

	getInterface(): TemplatedViewService {
		return this;
	}

	exit(): void {
		// Deregister global instance
		if (this.oResourceModelService) {
			this.oResourceModelService.destroy();
		}
		if (this.oCacheHandlerService) {
			this.oCacheHandlerService.destroy();
		}
		this.oFactory.removeGlobalInstance();
	}
}
class TemplatedViewServiceFactory extends ServiceFactory<TemplatedViewServiceSettings> {
	_oInstanceRegistry: Record<string, TemplatedViewService> = {};

	static iCreatingViews: 0;

	async createInstance(oServiceContext: ServiceContext<TemplatedViewServiceSettings>): Promise<TemplatedViewService> {
		TemplatedViewServiceFactory.iCreatingViews++;
		const oTemplatedViewService = new TemplatedViewService(Object.assign({ factory: this }, oServiceContext));
		return oTemplatedViewService.initPromise.then(function () {
			TemplatedViewServiceFactory.iCreatingViews--;
			return oTemplatedViewService;
		});
	}

	removeGlobalInstance(): void {
		this._oInstanceRegistry = {};
	}

	/**
	 * This function checks if the component data specifies the visibility of the 'Share' button and returns true or false based on the visibility.
	 * @param appComponent Specifies the app component
	 * @returns Boolean value as true or false based whether the 'Share' button should be visible or not
	 */
	static getShareButtonVisibilityForMyInbox(appComponent: AppComponent): boolean | undefined {
		const componentData: ComponentData = appComponent.getComponentData();
		if (componentData !== undefined && componentData.feEnvironment) {
			return componentData.feEnvironment.getShareControlVisibility();
		}
		return undefined;
	}

	static getNumberOfViewsInCreationState(): number {
		return TemplatedViewServiceFactory.iCreatingViews;
	}

	/**
	 * Sets page configuration changes for a specific page identified by its ID.
	 * @param manifest The manifest content object containing configuration details.
	 * @param viewData The view data object representing the current state of the view.
	 * @param appComponent The application component instance.
	 * @param pageId The unique identifier of the page for which configuration changes are to be applied.
	 * @returns The updated view data object reflecting the applied changes.
	 */
	static setPageConfigurationChanges(
		manifest: ManifestContent,
		viewData: ViewData,
		appComponent: AppComponent,
		pageId: string
	): ViewData {
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
	}
}
export default TemplatedViewServiceFactory;

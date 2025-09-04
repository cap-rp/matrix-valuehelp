import Log from "sap/base/Log";
import type Component from "sap/ui/core/Component";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Container from "sap/ushell/Container";
import type Extension from "sap/ushell/services/Extension";
import type Navigation from "sap/ushell/services/Navigation";
import type { Link, LinkFilter, Target } from "sap/ushell/services/Navigation";
import type PersonalizationV2 from "sap/ushell/services/PersonalizationV2";
import { type PersId, type Scope } from "sap/ushell/services/PersonalizationV2";
import type ShellNavigation from "sap/ushell/services/ShellNavigation";
import type URLParsing from "sap/ushell/services/URLParsing";
import type { ParsedHash } from "sap/ushell/services/URLParsing";
import type UserInfo from "sap/ushell/services/UserInfo";
import type ShellUIService from "sap/ushell/ui5service/ShellUIService";
import type { TitleAdditionalInfo } from "sap/ushell/ui5service/ShellUIService";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";

export type StartupAppState = {
	getData(): {
		selectionVariant?: {
			SelectOptions?: {
				PropertyName: string;
				Ranges: {
					Option: string;
					Sign: string;
					Low: string;
				}[];
			}[];
		};
	};
};

// see: sap\ushell\services\_Personalization\constants.js
export type PersonalizationWithConstants = PersonalizationV2 & {
	constants: {
		keyCategory: {
			FIXED_KEY: string;
			GENERATED_KEY: string;
		};
		writeFrequency: {
			HIGH: string;
			LOW: string;
		};
	};
};

export type PersonalizerType = {
	getPersData: () => Promise<object>;
	setPersData: (persData: object) => void;
};

export type ShellConfigType = {
	apps: {
		inputFieldHistory: {
			enabled: boolean;
		};
	};
};

export type FLPPlugin = {
	component: string;
	enabled: boolean;
	url: string;
	config: Record<string, string>;
};

export type RegisteredPluginsMapType = {
	AppWarmup: Record<string, FLPPlugin> | {};
	RendererExtensions: Record<string, FLPPlugin> | {};
	UserDefaults: Record<string, FLPPlugin> | {};
	UserImage: Record<string, FLPPlugin> | {};
};

/**
 * @interface IShellServices
 */
export interface IShellServices {
	initPromise: Promise<IShellServices>;
	instanceType: string;
	semanticObjects: string[];

	getLinks(oArgs?: Omit<LinkFilter, "ui5Component">[]): Promise<Link[][]>;

	getLinksWithCache(oArgs?: Omit<LinkFilter, "ui5Component">[]): Promise<Link[][]>;

	toExternal(oNavArgumentsArr: object, oComponent?: object): void;

	getStartupAppState(oArgs: object): Promise<undefined | StartupAppState>;

	backToPreviousApp(): void;

	hrefForExternal(oArgs?: object, oComponent?: object): Promise<string>;

	getHref(oTarget: object, oComponent: Component): Promise<string>;

	getAppState(oComponent: Component, sAppStateKey: string): Promise<unknown>;

	createEmptyAppState(oComponent: Component): object;

	createEmptyAppState(oComponent: Component): Promise<unknown>;

	navigate(oTarget: Target, oComponent?: Component): Promise<undefined>;

	isNavigationSupported(oNavArgumentsArr: Array<object>, oComponent?: object): Promise<{ supported: boolean }[]>;

	isInitialNavigation(): Promise<boolean>;

	expandCompactHash(sHashFragment: string): Promise<string>;

	getHash(): string;

	parseShellHash(sHash: string): ParsedHash;

	splitHash(sHash: string): ReturnType<URLParsing["splitHash"]>;

	constructShellHash(oNewShellHash: object): string;

	setDirtyFlag(bDirty: boolean): void;

	registerDirtyStateProvider(fnDirtyStateProvider: Function): void;

	deregisterDirtyStateProvider(fnDirtyStateProvider: Function): void;

	getUser(): UserInfo;
	getUserInitials(): string;

	hasUShell(): boolean;

	registerNavigationFilter(fnNavFilter: Function): void;

	unregisterNavigationFilter(fnNavFilter: Function): void;

	setBackNavigation(fnCallBack?: Function): Promise<void>;

	setHierarchy(aHierarchyLevels: Array<object>): Promise<void>;

	setTitle(sTitle: string, additionalInformation?: TitleAdditionalInfo): Promise<void>;

	isJamActive(): boolean;

	getContentDensity(): string;

	getPrimaryIntent(sSemanticObject: string, mParameters?: object): Promise<Link>;

	waitForPluginsLoad(): Promise<boolean>;

	getRegisteredPlugins(): RegisteredPluginsMapType;

	isFlpOptimisticBatchPluginLoaded(): boolean;

	getTitle(): Promise<string>;

	getPersonalizer(persId: PersId, scope: Scope, component?: Component): Promise<PersonalizerType>;

	deletePersonalizationContainer(key: string, scope?: object): Promise<void>;

	getShellConfig(): ShellConfigType;

	parseParameters(url: string): ReturnType<URLParsing["parseParameters"]>;

	getExtensionService(): Extension;

	getInframeUrl(): Promise<string | undefined>;

	getApplicationPersonalizer(itemName: string): Promise<PersonalizerType>;

	getApplicationPersonalizationData(itemName: string): Promise<Object | undefined>;

	setApplicationPersonalizationData(itemName: string, object: Object): Promise<void>;
}
type NavigationExtension = Navigation & {
	getStartupAppState(oAppComponent: Component): Promise<StartupAppState | undefined>;
	getAppState(oAppComponent: Component, sAppStateKey: string): Promise<object>;
	createEmptyAppState(
		oAppComponent: Component,
		bTransientEnforced?: boolean,
		sPersistencyMethod?: string,
		oPersistencySettings?: object
	): Promise<object>;
};

/**
 * Mock implementation of the ShellService for OpenFE
 *
 */
class ShellServiceMock extends Service<ShellServicesSettings> implements IShellServices {
	initPromise!: Promise<IShellServices>;

	instanceType!: string;

	semanticObjects!: string[];

	init(): void {
		this.initPromise = Promise.resolve(this as IShellServices);
		this.instanceType = "mock";
	}

	async getLinks(/*oArgs: object*/): Promise<Link[][]> {
		return Promise.resolve([]);
	}

	async __fetchSemanticObject(): Promise<string[]> {
		return Promise.resolve([]);
	}

	async getLinksWithCache(/*oArgs: object*/): Promise<Link[][]> {
		return Promise.resolve([]);
	}

	toExternal(/*oNavArgumentsArr: Array<object>, oComponent: object*/): void {
		/* Do Nothing */
	}

	async getStartupAppState(/*oArgs: object*/): Promise<StartupAppState | undefined> {
		return Promise.resolve(undefined);
	}

	isJamActive(): boolean {
		return false;
	}

	backToPreviousApp(): void {
		/* Do Nothing */
	}

	async hrefForExternal(/*oArgs?: object, oComponent?: object, bAsync?: boolean*/): Promise<string> {
		return Promise.resolve("");
	}

	async getHref(/*oArgs?: object, oComponent?: object, bAsync?: boolean*/): Promise<string> {
		return Promise.resolve("");
	}

	getHash(): string {
		return window.location.href;
	}

	async getAppState(/*oComponent: object, sAppStateKey: string*/): Promise<unknown> {
		return Promise.resolve({});
	}

	async createEmptyAppState(/*oComponent: object*/): Promise<unknown> {
		return Promise.resolve({});
	}

	async createEmptyAppStateAsync(/*oComponent: object*/): Promise<unknown> {
		return Promise.resolve({});
	}

	async navigate(/*oTarget: Target,oComponent?: Component*/): Promise<undefined> {
		return Promise.resolve(undefined);
	}

	async isNavigationSupported(/*oNavArgumentsArr: Array<object>, oComponent: object*/): Promise<{ supported: boolean }[]> {
		return Promise.resolve([]);
	}

	async isInitialNavigation(): Promise<boolean> {
		return Promise.resolve(false);
	}

	async expandCompactHash(/*sHashFragment: string*/): Promise<string> {
		return Promise.resolve("");
	}

	parseShellHash(/*sHash: string*/): ParsedHash {
		return {} as unknown as ParsedHash;
	}

	splitHash(sHash: string): ReturnType<URLParsing["splitHash"]> {
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
	}

	constructShellHash(/*oNewShellHash: object*/): string {
		return "";
	}

	setDirtyFlag(/*bDirty: boolean*/): void {
		/* Do Nothing */
	}

	registerDirtyStateProvider(/*fnDirtyStateProvider: Function*/): void {
		/* Do Nothing */
	}

	deregisterDirtyStateProvider(/*fnDirtyStateProvider: Function*/): void {
		/* Do Nothing */
	}

	getUser(): UserInfo {
		return {} as UserInfo;
	}

	getUserInitials(): string {
		return "";
	}

	hasUShell(): boolean {
		return false;
	}

	registerNavigationFilter(/*fnNavFilter: Function*/): void {
		/* Do Nothing */
	}

	unregisterNavigationFilter(/*fnNavFilter: Function*/): void {
		/* Do Nothing */
	}

	async setBackNavigation(/*fnCallBack?: Function*/): Promise<void> {
		/* Do Nothing */
		return Promise.resolve();
	}

	async setHierarchy(/*aHierarchyLevels: Array<object>*/): Promise<void> {
		/* Do Nothing */
		return Promise.resolve();
	}

	async setTitle(/*sTitle: string*/): Promise<void> {
		/* Do Nothing */
		return Promise.resolve();
	}

	getContentDensity(): string {
		// in case there is no shell we probably need to look at the classes being defined on the body
		if (document.body.classList.contains("sapUiSizeCozy")) {
			return "cozy";
		} else if (document.body.classList.contains("sapUiSizeCompact")) {
			return "compact";
		} else {
			return "";
		}
	}

	async getPrimaryIntent(/*sSemanticObject: string, mParameters?: object*/): Promise<Link> {
		return Promise.resolve(undefined as unknown as Link);
	}

	async waitForPluginsLoad(): Promise<boolean> {
		return Promise.resolve(true);
	}

	async getTitle(): Promise<string> {
		return Promise.resolve("");
	}

	async getPersonalizer(_persId: PersId, _scope: Scope, _component?: Component): Promise<PersonalizerType> {
		return Promise.resolve({
			getPersData: async () =>
				Promise.resolve({
					historyEnabled: false,
					suggestionsEnabled: false,
					apps: {}
				}),
			setPersData: () => {}
		});
	}

	async getApplicationPersonalizer(_itemName: string): Promise<PersonalizerType> {
		return Promise.resolve({
			getPersData: async () => Promise.resolve({}),
			setPersData: () => {}
		});
	}

	async getApplicationPersonalizationData(_itemName: string): Promise<object> {
		return Promise.resolve({});
	}

	async setApplicationPersonalizationData(_itemName: string, _object: Object): Promise<void> {
		return Promise.resolve();
	}

	async deletePersonalizationContainer(_key: string, _scope?: object): Promise<void> {
		return Promise.resolve();
	}

	getShellConfig(): ShellConfigType {
		return {} as ShellConfigType;
	}

	getRegisteredPlugins(): RegisteredPluginsMapType {
		return {
			AppWarmup: {},
			RendererExtensions: {},
			UserDefaults: {},
			UserImage: {}
		};
	}

	isFlpOptimisticBatchPluginLoaded(): boolean {
		return false;
	}

	parseParameters(): Record<string, string[]> {
		return {};
	}

	getExtensionService(): Extension {
		return {} as Extension;
	}

	async getInframeUrl(): Promise<string | undefined> {
		return Promise.resolve("");
	}
}

/**
 * @typedef ShellServicesSettings
 */
export type ShellServicesSettings = {
	shellContainer?: Container;
};

type ShellPluginManager = {
	getPluginLoadingPromise(category: string): jQuery.Promise;
	getRegisteredPlugins(): RegisteredPluginsMapType;
};

type PrivateShellUser = {
	getInitials(): string;
	isJamActive(): boolean;
	getContentDensity(): string;
};

/**
 * Base implementation of the ShellServices
 *
 */
export class ShellServices extends Service<Required<ShellServicesSettings>> implements IShellServices {
	resolveFn!: Function;

	rejectFn!: () => void;

	initPromise!: Promise<IShellServices>;

	applicationNavigation!: NavigationExtension;

	userInfoService!: UserInfo;

	urlParsingService!: URLParsing;

	shellNavigation!: ShellNavigation;

	shellPluginManager!: ShellPluginManager;

	oShellContainer!: Container & { getUser: () => PrivateShellUser };

	shellPersonalizationService!: PersonalizationWithConstants;

	instanceType!: string;

	linksCache!: Record<string, { links: Link[] }>;

	semanticObjects!: string[];

	fnFindSemanticObjectsInCache!: Function;

	extensionService!: Extension;

	appComponent!: Component;

	private applicationPersonnalizers: Record<string, Promise<PersonalizerType>> = {};

	init(): void {
		const oContext = this.getContext();
		this.appComponent = oContext.scopeObject as Component;
		this.oShellContainer = oContext.settings.shellContainer;
		this.instanceType = "real";
		this.linksCache = {};
		this.fnFindSemanticObjectsInCache = function (oArgs: LinkFilter[]): object {
			const aCachedSemanticObjects: Link[][] = [];
			const aNonCachedSemanticObjects: LinkFilter[] = [];
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
			return { oldArgs: oArgs, newArgs: aNonCachedSemanticObjects, cachedLinks: aCachedSemanticObjects };
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

		Promise.all([
			navigationServiceP,
			userInfoServiceP,
			oUrlParsingServicePromise,
			oShellNavigationServicePromise,
			oShellPersonalizationServicePromise,
			oShellPluginManagerPromise,
			oShellExtensionServicePromise
		])
			.then(
				([
					navigationService,
					userInfoService,
					oUrlParsingService,
					oShellNavigation,
					oShellPersonalizationService,
					oShellPluginManager,
					oShellExtensionService
				]) => {
					this.applicationNavigation = navigationService as NavigationExtension;
					this.userInfoService = userInfoService as UserInfo;
					this.urlParsingService = oUrlParsingService as URLParsing;
					this.shellNavigation = oShellNavigation as ShellNavigation;
					this.shellPersonalizationService = oShellPersonalizationService as PersonalizationWithConstants;
					this.shellPluginManager = oShellPluginManager as ShellPluginManager;
					this.extensionService = oShellExtensionService as Extension;
					this.resolveFn();
					return;
				}
			)
			.catch(this.rejectFn);
	}

	/**
	 * Retrieves the target links configured for a given semantic object & action
	 * Will retrieve the CrossApplicationNavigation
	 * service reference call the getLinks method. In case service is not available or any exception
	 * method throws exception error in console.
	 * @param oArgs Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
	 * @returns Promise which will be resolved to target links array
	 */
	async getLinks(oArgs?: LinkFilter[]): Promise<Link[][]> {
		return this.applicationNavigation.getLinks(oArgs);
	}

	/**
	 * Returns a list of semantic objects of the intents the current user can navigate to.
	 * @returns Promise that resolve with an array of strings representing the semantic objects of the intents the current user can navigate to, or rejects with an error message
	 */
	async __fetchSemanticObject(): Promise<string[]> {
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
	 */
	async getLinksWithCache(oArgs?: LinkFilter[]): Promise<Link[][]> {
		if ((oArgs as Object[]).length === 0) {
			return [];
		} else {
			const oCacheResults = this.fnFindSemanticObjectsInCache(oArgs);

			if (oCacheResults.newArgs.length === 0) {
				return oCacheResults.cachedLinks;
			} else {
				const aLinks = await this.applicationNavigation.getLinks(oCacheResults.newArgs);
				if (aLinks.length !== 0) {
					const oSemanticObjectsLinks: Record<string, { links: Link[] }> = {};

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
	}

	async getShellUIService(): Promise<ShellUIService> {
		return this.appComponent.getService("ShellUIService");
	}

	/**
	 * Will retrieve the ShellContainer.
	 * @returns Object with predefined shellContainer methods
	 */
	getShellContainer(): Container {
		return this.oShellContainer;
	}

	async getInframeUrl(): Promise<string | undefined> {
		const ushellContainer = this.getShellContainer();
		let appUrl: string | undefined;
		if (ushellContainer?.inAppRuntime()) {
			try {
				appUrl = await ushellContainer.getFLPUrlAsync(true);
			} catch (error) {
				Log.error("Error while getting the FLP URL", error as string);
			}
		}
		return appUrl;
	}

	/**
	 * Will call toExternal method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
	 * @param oNavArgumentsArr And
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>toExternal arguments
	 */
	toExternal(oNavArgumentsArr: Target, oComponent?: Component): void {
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
	 */
	async getStartupAppState(oArgs: Component): Promise<undefined | StartupAppState> {
		return this.applicationNavigation.getStartupAppState(oArgs);
	}

	/**
	 * Will call backToPreviousApp method of CrossApplicationNavigation service.
	 * @returns Something that indicate we've navigated
	 */
	async backToPreviousApp(): Promise<void> {
		return this.applicationNavigation.backToPreviousApp();
	}

	/**
	 * Will call hrefForExternal method of CrossApplicationNavigation service.
	 * @param oArgs Check the definition of
	 * @param oComponent The appComponent
	 * sap.ushell.services.CrossApplicationNavigation=>hrefForExternal arguments
	 * @returns Promise which will be resolved to string
	 */
	async hrefForExternal(oArgs: Target, oComponent?: Component): Promise<string> {
		return this.applicationNavigation.getHref(oArgs, oComponent);
	}

	/**
	 * Returns a promise resolving to a URL that launches an app with certain parameters.
	 * This API can be used to convert the internal shell hash format into the URL format for use in link tags.
	 * The resulting href is fully encoded and cannot be used in other APIs that expect the internal decoded hash.
	 * @param [oTarget] The navigation target to transform. When, omitted the current hash is used as the basis for the calculation.
	 * @param [oComponent] A UI5 component, used to logically attach any related app state.
	 * @returns A promise resolving the encoded href.
	 */
	async getHref(oTarget: Target, oComponent?: Component): Promise<string> {
		return this.applicationNavigation.getHref(oTarget, oComponent);
	}

	/**
	 * Will call getAppState method of CrossApplicationNavigation service with oComponent and oAppStateKey.
	 * @param oComponent
	 * @param sAppStateKey Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getAppState arguments
	 * @returns Promise which will be resolved to object
	 */
	async getAppState(oComponent: Component, sAppStateKey: string): Promise<unknown> {
		return this.applicationNavigation.getAppState(oComponent, sAppStateKey);
	}

	/**
	 * Will call createEmptyAppState method of CrossApplicationNavigation service with oComponent.
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppState arguments
	 * @returns Promise which will be resolved to object
	 */
	async createEmptyAppState(oComponent: Component): Promise<unknown> {
		return this.applicationNavigation.createEmptyAppState(oComponent);
	}

	/**
	 * Will call isNavigationSupported method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
	 * @param aTargets
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>isNavigationSupported arguments
	 * @returns Promise which will be resolved to object
	 */
	async isNavigationSupported(aTargets: Target[], oComponent: Component): Promise<{ supported: boolean }[]> {
		return this.applicationNavigation.isNavigationSupported(aTargets, oComponent) as unknown as Promise<{ supported: boolean }[]>;
	}

	/**
	 * Triggers a navigation to a specified target outside of the currently running application.
	 * @param oTarget The navigation target.
	 * @param [oComponent] A UI5 component, used to logically attach any related app state.
	 * @returns A Promise resolving once the navigation was triggered. The Promise might never reject or resolve
	 *                    when an error occurs during the navigation.
	 */
	async navigate(oTarget: Target, oComponent?: Component): Promise<undefined> {
		return (await this.applicationNavigation.navigate(oTarget, oComponent)) as unknown as Promise<undefined>;
	}

	/**
	 * Will call isInitialNavigationAsync method of CrossApplicationNavigation service.
	 * @returns Promise which will be resolved to boolean
	 */
	async isInitialNavigation(): Promise<boolean> {
		return this.applicationNavigation.isInitialNavigation();
	}

	/**
	 * Will call expandCompactHash method of CrossApplicationNavigation service.
	 * @param sHashFragment An (internal format) shell hash
	 * @returns A promise the success handler of the resolve promise get an expanded shell hash as first argument
	 */
	async expandCompactHash(sHashFragment: string): Promise<string> {
		return Promise.resolve(sHashFragment); //this.navTargetResolution.expandCompactHash(sHashFragment);
	}

	getHash(): string {
		return `#${this.urlParsingService.getShellHash(window.location.href)}`;
	}

	/**
	 * Returns a map of all the plugins which are registered with the PluginManager, sorted by supported plugin categories.
	 * @returns Map of registered plugins
	 */
	getRegisteredPlugins(): RegisteredPluginsMapType {
		return this.shellPluginManager.getRegisteredPlugins();
	}

	/**
	 * Check for the optimistic batch plugin setup in the FLP.
	 * @returns True if the optimistic batch plugin is set up and enabled.
	 */
	isFlpOptimisticBatchPluginLoaded(): boolean {
		const flpPluginsRendererExtensions = this.getRegisteredPlugins().RendererExtensions;
		if (
			flpPluginsRendererExtensions?.hasOwnProperty("MANAGE_FE_CACHES") &&
			!!(flpPluginsRendererExtensions as Record<string, Record<string, object>>).MANAGE_FE_CACHES.enabled
		) {
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
	 */
	parseShellHash(sHash: string): ParsedHash {
		return this.urlParsingService.parseShellHash(sHash);
	}

	/**
	 * Will call splitHash method of URLParsing service with given sHash.
	 * @param sHash Check the definition of
	 * sap.ushell.services.URLParsing=>splitHash arguments
	 * @returns Promise which will be resolved to object
	 */
	splitHash(sHash: string): { shellPart?: string; appSpecificRoute?: string } {
		return this.urlParsingService.splitHash(sHash);
	}

	/**
	 * Will call constructShellHash method of URLParsing service with given sHash.
	 * @param oNewShellHash Check the definition of
	 * sap.ushell.services.URLParsing=>constructShellHash arguments
	 * @returns Shell Hash string
	 */
	constructShellHash(oNewShellHash: object): string {
		return this.urlParsingService.constructShellHash(oNewShellHash);
	}

	/**
	 * Will call setDirtyFlag method with given dirty state.
	 * @param bDirty Check the definition of sap.ushell.Container.setDirtyFlag arguments
	 */
	setDirtyFlag(bDirty: boolean): void {
		this.oShellContainer.setDirtyFlag(bDirty);
	}

	/**
	 * Will call registerDirtyStateProvider method with given dirty state provider callback method.
	 * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.registerDirtyStateProvider arguments
	 */
	registerDirtyStateProvider(fnDirtyStateProvider: () => boolean): void {
		this.oShellContainer.registerDirtyStateProvider(fnDirtyStateProvider);
	}

	/**
	 * Will call deregisterDirtyStateProvider method with given dirty state provider callback method.
	 * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.deregisterDirtyStateProvider arguments
	 */
	deregisterDirtyStateProvider(fnDirtyStateProvider: () => boolean): void {
		this.oShellContainer.deregisterDirtyStateProvider(fnDirtyStateProvider);
	}

	/**
	 * Will call getUser method of ushell container.
	 * @returns Returns User object
	 */
	getUser(): UserInfo {
		return this.userInfoService;
	}

	isJamActive(): boolean {
		return this.oShellContainer.getUser().isJamActive();
	}

	getUserInitials(): string {
		return this.oShellContainer.getUser().getInitials();
	}

	/**
	 * Will check if ushell container is available or not.
	 * @returns Returns true
	 */
	hasUShell(): boolean {
		return true;
	}

	/**
	 * Will call registerNavigationFilter method of shellNavigation.
	 * @param fnNavFilter The filter function to register
	 */
	registerNavigationFilter(fnNavFilter: Function): void {
		this.shellNavigation.registerNavigationFilter(fnNavFilter);
	}

	/**
	 * Will call unregisterNavigationFilter method of shellNavigation.
	 * @param fnNavFilter The filter function to unregister
	 */
	unregisterNavigationFilter(fnNavFilter: Function): void {
		this.shellNavigation.unregisterNavigationFilter(fnNavFilter);
	}

	/**
	 * Will call setBackNavigation method of ShellUIService
	 * that displays the back button in the shell header.
	 * @param fnCallBack A callback function called when the button is clicked in the UI.
	 */
	async setBackNavigation(fnCallBack: Function): Promise<void> {
		(await this.getShellUIService()).setBackNavigation(fnCallBack);
	}

	/**
	 * Will call setHierarchy method of ShellUIService
	 * that displays the given hierarchy in the shell header.
	 * @param [aHierarchyLevels] An array representing hierarchies of the currently displayed app.
	 */
	async setHierarchy(aHierarchyLevels: object[]): Promise<void> {
		(await this.getShellUIService()).setHierarchy(aHierarchyLevels);
	}

	/**
	 * Will call setTitle method of ShellUIService
	 * that displays the given title in the shell header.
	 * @param [sTitle] The new title. The default title is set if this argument is not given.
	 * @param [additionalInformation] An object of additional information to be displayed in the browser window title.
	 */
	async setTitle(sTitle: string, additionalInformation?: TitleAdditionalInfo): Promise<void> {
		(await this.getShellUIService()).setTitle(sTitle, additionalInformation);
	}

	/**
	 * Will call getTitle method of ShellUIService
	 * that displays the given title in the shell header.
	 * @returns The title of the application.
	 */
	async getTitle(): Promise<string> {
		return (await this.getShellUIService()).getTitle();
	}

	/**
	 * Retrieves the currently defined content density.
	 * @returns The content density value
	 */
	getContentDensity(): string {
		return this.oShellContainer.getUser().getContentDensity();
	}

	/**
	 * For a given semantic object, this method considers all actions associated with the semantic object and
	 * returns the one tagged as a "primaryAction". If no inbound tagged as "primaryAction" exists, then it returns
	 * the intent of the first inbound (after sorting has been applied) matching the action "displayFactSheet".
	 * @param sSemanticObject Semantic object.
	 * @param mParameters See #CrossApplicationNavigation#getLinks for description.
	 * @returns Promise which will be resolved with an object containing the intent if it exists.
	 */
	async getPrimaryIntent(sSemanticObject: string, mParameters?: LinkFilter): Promise<Link> {
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
	 */
	async waitForPluginsLoad(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!this.shellPluginManager?.getPluginLoadingPromise) {
				resolve(false);
			} else {
				// eslint-disable-next-line promise/catch-or-return
				this.shellPluginManager
					.getPluginLoadingPromise("RendererExtensions")
					.fail((oError: unknown) => {
						Log.error(oError as string, "sap.fe.core.services.ShellServicesFactory.waitForPluginsLoad");
						resolve(false);
					})
					.then(() => resolve(true));
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
	 */
	async getPersonalizer(persId: PersId, scope: Scope, component?: Component): Promise<PersonalizerType> {
		scope = {
			// merge some defaults
			keyCategory: this.shellPersonalizationService.constants.keyCategory.FIXED_KEY,
			writeFrequency: this.shellPersonalizationService.constants.writeFrequency.LOW,
			clientStorageAllowed: false,
			validity: Infinity,
			...scope
		};
		return (await this.shellPersonalizationService.getPersonalizer(persId, scope, component)) as PersonalizerType;
	}

	/**
	 * Deletes a container identified by sContainerKey.
	 * @param key Container key
	 * @param scope Scope object
	 * @returns Promise which is resolved when the container is deleted
	 */
	async deletePersonalizationContainer(key: string, scope?: object): Promise<void> {
		return this.shellPersonalizationService.deleteContainer(key, scope as unknown as object) as Promise<void>;
	}

	/**
	 * This method initializes the personalizer to access the Application data stored in the shell Personalization.
	 * @param itemName The name of the item for which the personalizer is created.
	 * @returns A personalizer
	 */
	public async getApplicationPersonalizer(itemName: string): Promise<PersonalizerType> {
		if (!this.applicationPersonnalizers[itemName]) {
			this.applicationPersonnalizers[itemName] = this.getPersonalizer(
				{
					container: `Application#${(this.appComponent as AppComponent).getManifest()["sap.app"].id}`,
					item: itemName
				},
				{},
				this.appComponent
			);
		}
		return this.applicationPersonnalizers[itemName];
	}

	/**
	 * This method returns data from the personalization service.
	 * @param itemName
	 * @returns Data
	 */
	public async getApplicationPersonalizationData(itemName: string): Promise<object | undefined> {
		return (await (await this.getApplicationPersonalizer(itemName))?.getPersData()) as object | undefined;
	}

	/**
	 * This method stores an object in the personalization service.
	 * @param itemName
	 * @param data
	 * @returns A promise
	 */
	public async setApplicationPersonalizationData(itemName: string, data: object): Promise<void> {
		(await this.getApplicationPersonalizer(itemName)).setPersData(data);
	}

	/**
	 * Get the shell config from the windows object.
	 * @returns Shell config object
	 */
	getShellConfig(): ShellConfigType {
		return (window as unknown as Record<string, object>)["sap-ushell-config"] as ShellConfigType;
	}

	/**
	 * Parse parameters from a URI query string (starting with ?) into a parameter object.
	 * @param url Check the definition of
	 * Parameter string
	 * @returns An object containg string arrays
	 */
	parseParameters(url: string): Record<string, string[]> {
		return this.urlParsingService.parseParameters(url);
	}

	/**
	 * Get the shell extension service.
	 * @returns Shell extension service
	 */
	getExtensionService(): Extension {
		return this.extensionService;
	}
}

/**
 * Service Factory for the ShellServices
 *
 */
class ShellServicesFactory extends ServiceFactory<ShellServicesSettings> {
	/**
	 * Creates either a standard or a mock Shell service depending on the configuration.
	 * @param serviceContext The shellservice context
	 * @returns A promise for a shell service implementation
	 * @see ServiceFactory#createInstance
	 */
	async createInstance(serviceContext: ServiceContext<ShellServicesSettings>): Promise<IShellServices> {
		serviceContext.settings.shellContainer = sap.ui.require("sap/ushell/Container");
		const shellService = serviceContext.settings.shellContainer
			? new ShellServices(serviceContext as ServiceContext<Required<ShellServicesSettings>>)
			: new ShellServiceMock(serviceContext);
		await shellService.initPromise;
		// Enrich the appComponent with this method
		const appComponent = serviceContext.scopeObject;
		appComponent.getShellServices = (): IShellServices => shellService;
		const internalModel = appComponent.getModel("internal");
		if (internalModel) {
			let semanticObjects: string[] = [];
			try {
				semanticObjects = await shellService.__fetchSemanticObject();
			} catch (error: unknown) {
				Log.error("Error while calling getSemanticObjects", error as string);
			} finally {
				(internalModel as JSONModel).setProperty("/semanticObjects", semanticObjects);
			}
		}
		return shellService;
	}
}

export default ShellServicesFactory;

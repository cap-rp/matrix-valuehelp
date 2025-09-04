import type { EntitySet } from "@sap-ux/vocabularies-types/Edm";
import Log from "sap/base/Log";

import { defineUI5Class, event } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { StartupParameters } from "sap/fe/core/AppComponent";
import type { NavigationConfiguration } from "sap/fe/core/TemplateComponent";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import RouterProxy from "sap/fe/core/controllerextensions/routing/RouterProxy";
import AppStartupHelper from "sap/fe/core/helpers/AppStartupHelper";
import EditState from "sap/fe/core/helpers/EditState";
import { getRouteTargetNames } from "sap/fe/core/helpers/ManifestHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import SemanticKeyHelper from "sap/fe/core/helpers/SemanticKeyHelper";
import BindingParser from "sap/ui/base/BindingParser";
import EventProvider from "sap/ui/base/EventProvider";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type { ManifestOutboundEntry, RoutingConfiguration, RoutingTarget } from "sap/ui/core/Manifest";
import type View from "sap/ui/core/mvc/View";
import type { Route$MatchedEventParameters } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import type { Router$RouteMatchedEvent } from "sap/ui/core/routing/Router";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ODataUtils from "sap/ui/model/odata/v4/ODataUtils";
import openWindow from "sap/ui/util/openWindow";
import type Container from "sap/ushell/Container";
import type Navigation from "sap/ushell/services/Navigation";
import type { ServiceContext } from "types/metamodel_types";
import * as MetaModelConverter from "../converters/MetaModelConverter";

type RoutingServiceSettings = {};
@defineUI5Class("sap.fe.core.services.RoutingServiceEventing")
class RoutingServiceEventing extends EventProvider {
	@event()
	routeMatched!: Function;

	@event()
	afterRouteMatched!: Function;
}

export type RoutingEventParameters = Route$MatchedEventParameters & {
	navigationInfo?: { reason?: NavigationReason };
	routeInformation?: unknown;
	routePattern?: string;
	config: { pattern?: string };
};

export type CreateOnNavigateParameters =
	| { mode: "Async"; createContextPromise: Promise<Context> }
	| { mode: "Deferred"; listBinding: ODataListBinding; parentContext?: Context; data?: object };

export type RoutingNavigationInfo = {
	createOnNavigateParameters?: CreateOnNavigateParameters;
	bTargetEditable?: boolean;
	bPersistOPScroll?: boolean;
	bShowPlaceholder?: boolean;
	useContext?: Context;
	reason?: NavigationReason;
	redirectedToNonDraft?: string;
	bActionCreate?: boolean;
};

export type RoutingNavigationParameters = {
	checkNoHashChange?: boolean;
	createOnNavigateParameters?: CreateOnNavigateParameters;
	editable?: boolean;
	transient?: boolean;
	persistOPScroll?: boolean;
	FCLLevel?: number;
	updateFCLLevel?: number;
	preserveHistory?: boolean;
	noPreservationCache?: boolean;
	recreateContext?: boolean;
	forceFocus?: boolean;
	targetPath?: string;
	showPlaceholder?: boolean;
	reason?: NavigationReason;
	callExtension?: boolean;
	layout?: string;
	keepCurrentLayout?: boolean;
	navMode?: string;
	redirectedToNonDraft?: string;
};

export type RoutingParameterMap = {
	[k: string]: unknown;
};

export type SemanticMapping = {
	semanticPath: string;
	technicalPath: string;
};
type MinimalPageSetting = {
	contextPath?: string;
	entitySet?: string;
	fullContextPath?: string;
	navigation?: Record<string, NavigationConfiguration>;
};

type InternalRouteDefinition = {
	name: string;
	pattern: string;
	targets: string[];
	routeLevel: number;
};

type ResolvedParameters = { key: string; value: unknown };

export class RoutingService extends Service<RoutingServiceSettings> {
	oAppComponent!: AppComponent;

	oModel!: ODataModel;

	oMetaModel!: ODataMetaModel;

	oRouter!: Router;

	oRouterProxy!: RouterProxy;

	eventProvider!: EventProvider;

	initPromise!: Promise<RoutingService>;

	outbounds!: Record<string, ManifestOutboundEntry>;

	_mTargets!: Record<string, RoutingTarget>;

	_mRoutes!: Record<string, InternalRouteDefinition>;

	oLastSemanticMapping?: SemanticMapping;

	bExitOnNavigateBackToRoot?: boolean;

	sCurrentRouteName?: string;

	sCurrentRoutePattern?: string;

	aCurrentViews?: (View | ComponentContainer)[];

	navigationInfoQueue: RoutingNavigationInfo[] = [];

	sContextPath!: string;

	_fnOnRouteMatched!: (ev: Router$RouteMatchedEvent) => void;

	enabled = false;

	routingHints?: Record<string, { parentOf: string[] }>;

	bindingCleanupPromises: Promise<void>[] = [];

	init(): void {
		const oContext = this.getContext();
		if (oContext.scopeType === "component") {
			this.oAppComponent = oContext.scopeObject;
			this.oModel = this.oAppComponent.getModel();
			this.oMetaModel = this.oModel?.getMetaModel();
			this.oRouter = this.oAppComponent.getRouter();
			this.oRouterProxy = this.oAppComponent.getRouterProxy();
			this.eventProvider = new RoutingServiceEventing();

			const oRoutingConfig = this.oAppComponent.getManifestEntry("sap.ui5").routing;
			this._parseRoutingConfiguration(oRoutingConfig!);

			const oAppConfig = this.oAppComponent.getManifestEntry("sap.app");
			this.outbounds = oAppConfig.crossNavigation?.outbounds ?? {};
		}

		this.initPromise = Promise.resolve(this);
	}

	beforeExit(): void {
		this.enabled = false;
		this.oRouter.detachRouteMatched(this._fnOnRouteMatched, this);
		this.eventProvider.fireEvent("routeMatched", {});
	}

	exit(): void {
		this.eventProvider.destroy();
	}

	addBindingCleanupPromise(promise: Promise<void>): void {
		this.bindingCleanupPromises.push(promise);
	}

	async waitForBindingCleanup(): Promise<void> {
		await Promise.all(this.bindingCleanupPromises);
		this.bindingCleanupPromises = [];
	}

	/**
	 * Parse a manifest routing configuration for internal usage.
	 * @param oRoutingConfig The routing configuration from the manifest
	 */
	_parseRoutingConfiguration(oRoutingConfig: RoutingConfiguration): void {
		const isFCL = oRoutingConfig?.config?.routerClass === "sap.f.routing.Router";

		// Information of targets
		this._mTargets = {};
		if (oRoutingConfig?.targets) {
			for (const sTargetName of Object.keys(oRoutingConfig.targets)) {
				this._mTargets[sTargetName] = Object.assign({ targetName: sTargetName }, oRoutingConfig.targets[sTargetName]);

				// View level for FCL cases is calculated from the target pattern
				const contextPattern = this._mTargets[sTargetName].contextPattern;
				if (contextPattern !== undefined) {
					this._mTargets[sTargetName].viewLevel = this._getViewLevelFromPattern(contextPattern, 0);
				}
			}
		}
		this.routingHints = {};

		// Information of routes
		this._mRoutes = {};
		if (oRoutingConfig?.routes) {
			for (const oRouteManifestInfo of oRoutingConfig.routes) {
				const aRouteTargets = getRouteTargetNames(oRouteManifestInfo.target),
					sRouteName = oRouteManifestInfo.name,
					sRoutePattern = oRouteManifestInfo.pattern;
				if (!sRoutePattern) {
					continue;
				}
				// Check route pattern: all patterns need to end with ':?query:', that we use for parameters
				if (sRoutePattern.length < 8 || sRoutePattern.indexOf(":?query:") !== sRoutePattern.length - 8) {
					Log.warning(`Pattern for route ${sRouteName} doesn't end with ':?query:' : ${sRoutePattern}`);
				}
				const iRouteLevel = this._getViewLevelFromPattern(sRoutePattern, 0);
				this._mRoutes[sRouteName] = {
					name: sRouteName,
					pattern: sRoutePattern,
					targets: aRouteTargets,
					routeLevel: iRouteLevel
				};

				// Add the parent targets in the list of targets for the route
				for (const item of aRouteTargets) {
					const sParentTargetName = this._mTargets[item].parent;
					if (sParentTargetName) {
						aRouteTargets.push(sParentTargetName);
					}
				}

				this._mTargets[aRouteTargets[0]].routerHashKeys = RouterProxy.extractEntitySetsFromHash(sRoutePattern.split(":?query:")[0]);

				if (!isFCL) {
					// View level for non-FCL cases is calculated from the route pattern
					const viewLevel = this._mTargets[aRouteTargets[0]].viewLevel;
					if (viewLevel === undefined || viewLevel < iRouteLevel) {
						// There are cases when different routes point to the same target. We take the
						// largest viewLevel in that case.
						this._mTargets[aRouteTargets[0]].viewLevel = iRouteLevel;
					}

					// FCL level for non-FCL cases is equal to -1
					this._mTargets[aRouteTargets[0]].FCLLevel = -1;
				} else if (aRouteTargets.length === 1 && this._mTargets[aRouteTargets[0]].controlAggregation !== "beginColumnPages") {
					// We're in the case where there's only 1 target for the route, and it's not in the first column
					// --> this is a fullscreen column after all columns in the FCL have been used
					this._mTargets[aRouteTargets[0]].FCLLevel = 3;
				} else {
					// Other FCL cases
					aRouteTargets.forEach((sTargetName) => {
						switch (this._mTargets[sTargetName].controlAggregation) {
							case "beginColumnPages":
								this._mTargets[sTargetName].FCLLevel = 0;
								break;

							case "midColumnPages":
								this._mTargets[sTargetName].FCLLevel = 1;
								break;

							default:
								this._mTargets[sTargetName].FCLLevel = 2;
						}
					});
				}
			}
		}

		// Propagate viewLevel, contextPattern, FCLLevel and controlAggregation to parent targets
		Object.keys(this._mTargets).forEach((sTargetName: string) => {
			let sParentTargetName = this._mTargets[sTargetName].parent;
			while (sParentTargetName) {
				this._mTargets[sParentTargetName].viewLevel =
					this._mTargets[sParentTargetName].viewLevel || this._mTargets[sTargetName].viewLevel;
				this._mTargets[sParentTargetName].contextPattern =
					this._mTargets[sParentTargetName].contextPattern || this._mTargets[sTargetName].contextPattern;
				this._mTargets[sParentTargetName].FCLLevel =
					this._mTargets[sParentTargetName].FCLLevel || this._mTargets[sTargetName].FCLLevel;
				this._mTargets[sParentTargetName].controlAggregation =
					this._mTargets[sParentTargetName].controlAggregation || this._mTargets[sTargetName].controlAggregation;
				sTargetName = sParentTargetName;
				sParentTargetName = this._mTargets[sTargetName].parent;
			}
		});

		// Determine the root entity for the app
		const aLevel0RouteNames = [];
		const aLevel1RouteNames = [];
		let sDefaultRouteName;

		for (const sName in this._mRoutes) {
			const iLevel = this._mRoutes[sName].routeLevel;
			if (iLevel === 0) {
				aLevel0RouteNames.push(sName);
			} else if (iLevel === 1) {
				aLevel1RouteNames.push(sName);
			}
		}

		if (aLevel0RouteNames.length === 1) {
			sDefaultRouteName = aLevel0RouteNames[0];
		} else if (aLevel1RouteNames.length === 1) {
			sDefaultRouteName = aLevel1RouteNames[0];
		}

		if (sDefaultRouteName) {
			const sDefaultTargetName = this._mRoutes[sDefaultRouteName].targets.slice(-1)[0];
			this.sContextPath = "";
			const oSettings = this._mTargets[sDefaultTargetName].options?.settings as MinimalPageSetting | undefined;
			if (oSettings) {
				this.sContextPath = oSettings.contextPath || `/${oSettings.entitySet}`;
			}
			if (!this.sContextPath) {
				Log.warning(
					`Cannot determine default contextPath: contextPath or entitySet missing in default target: ${sDefaultTargetName}`
				);
			}
		} else {
			Log.warning("Cannot determine default contextPath: no default route found.");
		}

		// We need to establish the correct path to the different pages, including the navigation properties
		Object.keys(this._mTargets)
			.map((sTargetKey: string) => {
				return this._mTargets[sTargetKey];
			})
			.sort((a: RoutingTarget, b: RoutingTarget) => {
				return a.viewLevel !== undefined && b.viewLevel !== undefined && a.viewLevel < b.viewLevel ? -1 : 1;
			})
			.forEach((target: RoutingTarget) => {
				// After sorting the targets per level we can then go through their navigation object and update the paths accordingly.
				if (target.options) {
					const settings = target.options.settings as MinimalPageSetting;
					const sContextPath = settings.contextPath || (settings.entitySet ? `/${settings.entitySet}` : "");
					if (!settings.fullContextPath && sContextPath) {
						settings.fullContextPath = `${sContextPath}/`;
					}
					const parentOf: string[] = [];
					if (target.routerHashKeys?.[0]) {
						this.routingHints![target.routerHashKeys?.[0]] = { parentOf: parentOf };
					}
					Object.keys(settings.navigation || {}).forEach((sNavName: string) => {
						// Check if it's a navigation property
						if (target.name === "sap.fe.templates.ListReport") {
							parentOf.push(sNavName);
						}
						const targetRoute = this._mRoutes[settings.navigation![sNavName].detail?.route];

						if (targetRoute && targetRoute.targets) {
							targetRoute.targets.forEach((sTargetName: string) => {
								if (
									this._mTargets[sTargetName].options?.settings &&
									!this._mTargets[sTargetName].options?.settings?.fullContextPath
								) {
									if (this._mTargets[sTargetName].options!.settings!.contextPath) {
										this._mTargets[sTargetName].options!.settings!.fullContextPath =
											this._mTargets[sTargetName].options!.settings!.contextPath + "/";
									} else if (target.viewLevel === 0) {
										this._mTargets[sTargetName].options!.settings!.fullContextPath = `${
											(sNavName.startsWith("/") ? "" : "/") + sNavName
										}/`;
									} else {
										this._mTargets[sTargetName].options!.settings!.fullContextPath = `${
											settings.fullContextPath + sNavName
										}/`;
									}
								}
							});
						}
					});
				}
			});
	}

	/**
	 * Calculates a view level from a pattern by counting the number of segments.
	 * @param sPattern The pattern
	 * @param viewLevel The current level of view
	 * @returns The level
	 */
	_getViewLevelFromPattern(sPattern: string, viewLevel: number): number {
		sPattern = sPattern.replace(":?query:", "");
		const regex = new RegExp("/[^/]*$");
		if (sPattern && sPattern[0] !== "/" && sPattern[0] !== "?") {
			sPattern = `/${sPattern}`;
		}
		if (sPattern.length) {
			sPattern = sPattern.replace(regex, "");
			if (this.oRouter.match(sPattern) || sPattern === "") {
				return this._getViewLevelFromPattern(sPattern, ++viewLevel);
			} else {
				return this._getViewLevelFromPattern(sPattern, viewLevel);
			}
		} else {
			return viewLevel;
		}
	}

	_getRouteInformation(sRouteName?: string): InternalRouteDefinition | undefined {
		if (sRouteName === undefined) {
			return undefined;
		}
		return this._mRoutes[sRouteName];
	}

	_getTargetInformation(sTargetName?: string): RoutingTarget | undefined {
		if (sTargetName === undefined) {
			return undefined;
		}
		return this._mTargets[sTargetName];
	}

	_getComponentId(sOwnerId: string, sComponentId: string): string {
		if (sComponentId.indexOf(`${sOwnerId}---`) === 0) {
			return sComponentId.substring(sOwnerId.length + 3);
		}
		return sComponentId;
	}

	/**
	 * Get target information for a given component.
	 * @param componentOrView Instance of the component or view
	 * @returns The configuration for the target
	 */
	getTargetInformationFor(componentOrView: Component | View): RoutingTarget | undefined {
		const correctTargetName = this.getTargetName(componentOrView);
		return this._getTargetInformation(correctTargetName);
	}

	/**
	 * Get the name of the page shown in the view as defined in the manifest routing section.
	 * @param componentOrView
	 * @returns The name of the page
	 */
	getTargetName(componentOrView: Component | View): string | undefined {
		const targetComponentId = this._getComponentId(
			(componentOrView as unknown as { _sOwnerId: string })._sOwnerId,
			componentOrView.getId()
		);
		let correctTargetName: string | undefined;
		Object.keys(this._mTargets).forEach((targetName: string) => {
			if (this._mTargets[targetName].id === targetComponentId || this._mTargets[targetName].viewId === targetComponentId) {
				correctTargetName = targetName;
			}
		});
		return correctTargetName;
	}

	/**
	 * Get the name of the page shown in the view as defined in the manifest routing section.
	 * @param view
	 * @returns The name of the page
	 */
	getTargetNameForView(view: View): string | undefined {
		const pageComponent = Component.getOwnerComponentFor(view);
		let targetName = pageComponent ? this.getTargetName(pageComponent) : undefined;
		if (!targetName) {
			targetName = this.getTargetName(view);
		}
		return targetName;
	}

	getLastSemanticMapping(): SemanticMapping | undefined {
		return this.oLastSemanticMapping;
	}

	setLastSemanticMapping(oMapping?: SemanticMapping): void {
		this.oLastSemanticMapping = oMapping;
	}

	async getHashFromRoute(context: Context, routeName: string | null, parameterMapping?: unknown): Promise<string> {
		if (!this.enabled) {
			return Promise.resolve("");
		}
		let targetURLPromise: Promise<string | undefined>;
		if (!parameterMapping) {
			// if there is no parameter mapping define this mean we rely entirely on the binding context path
			targetURLPromise = Promise.resolve(SemanticKeyHelper.getSemanticPath(context));
		} else {
			targetURLPromise = this.prepareParameters(parameterMapping as RoutingParameterMap, routeName, context).then(
				(parameters: object | undefined) => {
					return this.oRouter.getURL(routeName!, parameters);
				}
			);
		}
		return (await targetURLPromise) as string;
	}

	async navigateTo(
		oContext: Context,
		sRouteName: string | null,
		mParameterMapping: unknown,
		bPreserveHistory?: boolean,
		delayedUsage?: false
	): Promise<void>;

	async navigateTo(
		oContext: Context,
		sRouteName: string | null,
		mParameterMapping: unknown,
		bPreserveHistory?: boolean,
		delayedUsage?: true
	): Promise<() => void>;

	async navigateTo(
		oContext: Context,
		sRouteName: string | null,
		mParameterMapping: unknown,
		bPreserveHistory?: boolean,
		delayedUsage?: boolean
	): Promise<(() => void) | void>;

	async navigateTo(
		oContext: Context,
		sRouteName: string | null,
		mParameterMapping: unknown,
		bPreserveHistory?: boolean,
		delayedUsage?: boolean
	): Promise<(() => void) | void> {
		if (!this.enabled) {
			return Promise.resolve();
		}
		let sTargetURLPromise, bIsStickyMode: boolean;
		if (oContext.getModel() && oContext.getModel().getMetaModel && oContext.getModel().getMetaModel()) {
			bIsStickyMode = ModelHelper.isStickySessionSupported(oContext.getModel().getMetaModel());
		}
		if (!mParameterMapping) {
			// if there is no parameter mapping define this mean we rely entirely on the binding context path
			sTargetURLPromise = Promise.resolve(SemanticKeyHelper.getSemanticPath(oContext));
		} else {
			sTargetURLPromise = this.prepareParameters(mParameterMapping as RoutingParameterMap, sRouteName, oContext).then(
				(mParameters: object | undefined) => {
					return this.oRouter.getURL(sRouteName!, mParameters);
				}
			);
		}
		const targetUrl = await sTargetURLPromise;
		const navigateFunction = (): void => {
			this.oRouterProxy.navToHash(targetUrl!, bPreserveHistory, false, false, !bIsStickyMode);
		};
		if (delayedUsage === true) {
			return navigateFunction; // wrong but somehow the types are annoying
		} else {
			return navigateFunction();
		}
	}

	/**
	 * Method to return a map of routing target parameters where the binding syntax is resolved to the current model.
	 * @param mParameters Parameters map in the format [k: string] : ComplexBindingSyntax
	 * @param sTargetRoute Name of the target route
	 * @param oContext The instance of the binding context
	 * @returns A promise which resolves to the routing target parameters
	 */
	async prepareParameters(mParameters: RoutingParameterMap, sTargetRoute: string | null, oContext: Context): Promise<object> {
		let oParametersPromise;
		try {
			const sContextPath = oContext.getPath();
			const oMetaModel: ODataMetaModel = oContext.getModel().getMetaModel();
			const aContextPathParts = sContextPath.split("/");
			const aAllResolvedParameterPromises = Object.keys(mParameters).map(async (sParameterKey: string) => {
				const sParameterMappingExpression = mParameters[sParameterKey];
				// We assume the defined parameters will be compatible with a binding expression
				const oParsedExpression = BindingParser.complexParser(sParameterMappingExpression);
				const aParts = oParsedExpression.parts || [oParsedExpression];
				const aResolvedParameterPromises = aParts.map(async function (oPathPart: PropertyBindingInfo) {
					const aRelativeParts = oPathPart.path.split("../");
					// We go up the current context path as many times as necessary
					const aLocalParts = aContextPathParts.slice(0, aContextPathParts.length - aRelativeParts.length + 1);
					const localContextPath = aLocalParts.join("/");
					const localContext =
						localContextPath === oContext.getPath()
							? oContext
							: oContext.getModel().bindContext(localContextPath).getBoundContext();

					const oMetaContext = oMetaModel.getMetaContext(localContextPath + "/" + aRelativeParts[aRelativeParts.length - 1]);
					return localContext.requestProperty(aRelativeParts[aRelativeParts.length - 1]).then(function (oValue) {
						const oPropertyInfo = oMetaContext.getObject();
						const sEdmType = oPropertyInfo.$Type;
						return ODataUtils.formatLiteral(oValue, sEdmType);
					});
				});

				return Promise.all(aResolvedParameterPromises).then((aResolvedParameters: PropertyBindingInfo) => {
					const value = oParsedExpression.formatter
						? oParsedExpression.formatter.apply(this, aResolvedParameters)
						: aResolvedParameters.join("");
					return { key: sParameterKey, value: value };
				});
			});

			oParametersPromise = Promise.all(aAllResolvedParameterPromises).then(function (aAllResolvedParameters: ResolvedParameters[]) {
				const oParameters: Record<string, unknown> = {};
				aAllResolvedParameters.forEach(function (oResolvedParameter: ResolvedParameters) {
					oParameters[oResolvedParameter.key] = oResolvedParameter.value;
				});
				return oParameters;
			});
		} catch (oError) {
			Log.error(`Could not parse the parameters for the navigation to route ${sTargetRoute}`);
			oParametersPromise = Promise.resolve({});
		}
		return oParametersPromise;
	}

	_fireRouteMatchEvents(mParameters: Route$MatchedEventParameters): void {
		this.bindingCleanupPromises = [];
		this.eventProvider.fireEvent("routeMatched", mParameters);
		this.eventProvider.fireEvent("afterRouteMatched", mParameters);

		EditState.cleanProcessedEditState(); // Reset UI state when all bindings have been refreshed
	}

	/**
	 * Navigates to a context.
	 * @param context The Context to be navigated to, or the list binding for creation (deferred creation)
	 * @param [parameters] Optional, map containing the following attributes:
	 * @param [parameters.checkNoHashChange] Navigate to the context without changing the URL
	 * @param [parameters.asyncContext] The context is created async, navigate to (...) and
	 *                    wait for Promise to be resolved and then navigate into the context
	 * @param [parameters.bDeferredContext] The context shall be created deferred at the target page
	 * @param [parameters.editable] The target page shall be immediately in the edit mode to avoid flickering
	 * @param [parameters.bPersistOPScroll] The bPersistOPScroll will be used for scrolling to first tab
	 * @param [parameters.updateFCLLevel] `+1` if we add a column in FCL, `-1` to remove a column, 0 to stay on the same column
	 * @param [parameters.noPreservationCache] Do navigation without taking into account the preserved cache mechanism
	 * @param [parameters.bRecreateContext] Force re-creation of the context instead of using the one passed as parameter
	 * @param [parameters.bForceFocus] Forces focus selection after navigation
	 * @param [viewData] View data
	 * @param [viewData.navigation]
	 * @param [currentTargetInfo] The target information from which the navigation is triggered
	 * @param [currentTargetInfo.name]
	 * @returns Promise which is resolved once the navigation is triggered
	 * @final
	 */
	async navigateToContext(
		context: Context | ODataListBinding,
		parameters: RoutingNavigationParameters = {},
		viewData?: { navigation?: object },
		currentTargetInfo?: { name: string }
	): Promise<boolean> {
		if (!this.enabled) {
			return Promise.resolve(false);
		}

		let targetRoute = "";
		let routeParametersPromise: Promise<object> | undefined;
		const isStickyMode = ModelHelper.isStickySessionSupported(this.oMetaModel);

		// Manage parameter mapping
		if (parameters?.targetPath && viewData?.navigation) {
			const navigationInfo = viewData.navigation as Record<string, { detail: { route: string; parameters: object } }>;
			const oRouteDetail = navigationInfo[parameters.targetPath].detail;
			targetRoute = oRouteDetail.route;

			if (oRouteDetail.parameters && context.isA<Context>("sap.ui.model.odata.v4.Context")) {
				routeParametersPromise = this.prepareParameters(
					oRouteDetail.parameters as unknown as RoutingParameterMap,
					targetRoute,
					context
				);
			}
		}

		let sTargetPath = this._getPathFromContext(context, parameters);
		// If the path is empty, we're supposed to navigate to the first page of the app
		// Check if we need to exit from the app instead
		if (sTargetPath.length === 0 && this.bExitOnNavigateBackToRoot) {
			this.oRouterProxy.exitFromApp();
			return Promise.resolve(true);
		}

		// If the navigation goes with a creation, we add (...) to the path (expecting context is an ODataListBinding)
		if (parameters?.createOnNavigateParameters) {
			sTargetPath += "(...)";
		}

		// Add layout parameter if needed
		const sLayout = this._calculateLayout(sTargetPath, parameters);
		if (sLayout) {
			sTargetPath += `?layout=${sLayout}`;
		}

		// Navigation parameters for later usage
		const oNavigationInfo: RoutingNavigationInfo = {
			createOnNavigateParameters: parameters.createOnNavigateParameters,
			bTargetEditable: parameters?.editable,
			bPersistOPScroll: parameters?.persistOPScroll,
			bShowPlaceholder: parameters?.showPlaceholder !== undefined ? parameters?.showPlaceholder : true,
			reason: parameters?.reason,
			redirectedToNonDraft: parameters.redirectedToNonDraft
		};

		if (parameters?.updateFCLLevel !== -1 && parameters?.recreateContext !== true) {
			if (context.isA<Context>("sap.ui.model.odata.v4.Context")) {
				oNavigationInfo.useContext = context;
			}
		}

		if (parameters?.checkNoHashChange) {
			// Check if the new hash is different from the current one
			const sCurrentHashNoAppState = this.oRouterProxy.getHash().replace(/[&?]{1}sap-iapp-state=[A-Z0-9]+/, "");
			if (sTargetPath === sCurrentHashNoAppState) {
				// The hash doesn't change, but we fire the routeMatch event to trigger page refresh / binding
				const routeInfoByHash = this.oRouter.getRouteInfoByHash(this.oRouterProxy.getHash());
				let mEventParameters: RoutingEventParameters = { config: {} };
				if (routeInfoByHash) {
					mEventParameters = { ...routeInfoByHash, config: {} };
					mEventParameters.navigationInfo = oNavigationInfo;
					mEventParameters.routeInformation = this._getRouteInformation(this.sCurrentRouteName);
					mEventParameters.routePattern = this.sCurrentRoutePattern;
					mEventParameters.views = this.aCurrentViews;
				}

				this.oRouterProxy.setFocusForced(!!parameters.forceFocus);

				this._fireRouteMatchEvents(mEventParameters);

				return Promise.resolve(true);
			}
		}

		if (parameters?.transient && !!parameters.editable && !sTargetPath.includes("(...)")) {
			if (sTargetPath.includes("?")) {
				sTargetPath += "&i-action=create";
			} else {
				sTargetPath += "?i-action=create";
			}
		}

		if (parameters.navMode === "openInNewTab") {
			// Navigate to new tab/ window
			sap.ui.require(["sap/ushell/Container"], async (Container: Container) => {
				const shellServiceHelper = this.oAppComponent.getShellServices();
				const parsedUrl = shellServiceHelper.parseShellHash(document.location.hash);
				const navigationService = (await Container.getServiceAsync("Navigation")) as Navigation;
				const href = await navigationService.getHref({
					target: {
						semanticObject: parsedUrl.semanticObject,
						action: parsedUrl.action
					},
					params: parsedUrl.params
				});
				const applicationUrlBasedOnIframe = await shellServiceHelper.getInframeUrl();
				let url, targetUrl: string;
				if (applicationUrlBasedOnIframe) {
					url = new URL(applicationUrlBasedOnIframe);
					targetUrl = applicationUrlBasedOnIframe.replace(url.hash, `${href}&/${encodeURI(sTargetPath)}`);
				} else {
					url = new URL(window.location.href);
					targetUrl = `${url.origin}${url.pathname}${href}&/${encodeURI(sTargetPath)}`;
				}
				openWindow(targetUrl);
			});
			return Promise.resolve(true);
		} else {
			// Clear unbound messages upon navigating from LR to OP
			// This is to ensure stale error messages from LR are not shown to the user after navigation to OP.
			if (currentTargetInfo?.name === "sap.fe.templates.ListReport") {
				const oRouteInfo = this.oRouter.getRouteInfoByHash(sTargetPath);
				if (oRouteInfo) {
					const oRoute = this._getRouteInformation(oRouteInfo.name);
					if (oRoute && oRoute.targets && oRoute.targets.length > 0) {
						const sLastTargetName = oRoute.targets[oRoute.targets.length - 1];
						const oTarget = this._getTargetInformation(sLastTargetName);
						if (oTarget && oTarget.name === "sap.fe.templates.ObjectPage") {
							messageHandling.removeUnboundTransitionMessages();
						}
					}
				}
			}

			// Add the navigation parameters in the queue
			this.navigationInfoQueue.push(oNavigationInfo);

			if (targetRoute && routeParametersPromise) {
				return routeParametersPromise.then((oRouteParameters: object) => {
					Object.assign(oRouteParameters, { bIsStickyMode: isStickyMode });
					this.oRouter.navTo(targetRoute, oRouteParameters);
					return true;
				});
			}
			return this.oRouterProxy
				.navToHash(
					sTargetPath,
					!!parameters.preserveHistory,
					parameters?.noPreservationCache,
					parameters?.forceFocus,
					!isStickyMode
				)
				.then((bNavigated) => {
					if (!bNavigated) {
						// The navigation did not happen --> remove the navigation parameters from the queue as they shouldn't be used
						this.navigationInfoQueue.pop();
					}
					return bNavigated;
				});
		}
	}

	/**
	 * Navigates to a route.
	 * @param sTargetRouteName Name of the target route
	 * @param [oRouteParameters] Parameters to be used with route to create the target hash
	 * @param oRouteParameters.bIsStickyMode
	 * @param oRouteParameters.preserveHistory
	 * @returns Promise that is resolved when the navigation is finalized
	 * @final
	 */
	async navigateToRoute(
		sTargetRouteName: string,
		oRouteParameters?: { bIsStickyMode?: boolean; preserveHistory?: boolean }
	): Promise<boolean> {
		if (!this.enabled) {
			return Promise.resolve(false);
		}
		this.setLastSemanticMapping(undefined);
		const sTargetURL = this.oRouter.getURL(sTargetRouteName, oRouteParameters);
		return this.oRouterProxy.navToHash(
			sTargetURL!,
			!!oRouteParameters?.preserveHistory,
			undefined,
			undefined,
			!oRouteParameters?.bIsStickyMode
		);
	}

	/**
	 * Checks if one of the current views on the screen is bound to a given context.
	 * @param oContext The context
	 * @returns `true` or `false` if the current state is impacted or not
	 */
	isCurrentStateImpactedBy(oContext: Context): boolean {
		const sPath = oContext.getPath();

		// First, check with the technical path. We have to try it, because for level > 1, we
		// uses technical keys even if Semantic keys are enabled
		if (this.oRouterProxy.isCurrentStateImpactedBy(sPath)) {
			return true;
		} else if (/^[^()]+\([^()]+\)$/.test(sPath)) {
			// If the current path can be semantic (i.e. is like xxx(yyy))
			// check with the semantic path if we can find it
			let sSemanticPath;
			if (this.oLastSemanticMapping && this.oLastSemanticMapping.technicalPath === sPath) {
				// We have already resolved this semantic path
				sSemanticPath = this.oLastSemanticMapping.semanticPath;
			} else {
				sSemanticPath = SemanticKeyHelper.getSemanticPath(oContext)!;
			}

			return sSemanticPath != sPath ? this.oRouterProxy.isCurrentStateImpactedBy(sSemanticPath) : false;
		} else {
			return false;
		}
	}

	/**
	 * Returns the path used to navigate back from a specified path.
	 * @param sPath
	 * @returns The path
	 */
	getPathToNavigateBack(sPath: string): string {
		const regex = new RegExp("/[^/]*$");
		sPath = sPath.replace(regex, "");
		if (this.oRouter.match(sPath) || sPath === "") {
			return sPath;
		} else {
			return this.getPathToNavigateBack(sPath);
		}
	}

	/**
	 * Checks if a semantic path shall be used to navigate to a given context.
	 * @param context The context to navigate to
	 * @returns True if semantic path shall be sued, false otherwise
	 */
	_checkIfContextSupportsSemanticPath(context: Context): boolean {
		// First, check if this is a level-1 object (path = /aaa(bbb))
		if (!/^\/[^(]+\([^)]+\)$/.test(context.getPath())) {
			return false;
		}

		// Then check if the entity is a draft root
		const metaModel = context.getModel().getMetaModel();
		const entitySet = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getMetaContext(context.getPath()))
			.targetObject as EntitySet;

		if (!ModelHelper.isDraftRoot(entitySet)) {
			return false;
		}

		// We don't support semantic path for newly created objects
		if (context.getProperty("IsActiveEntity") === false && context.getProperty("HasActiveEntity") === false) {
			return false;
		}

		// Finally, check if the entity has semantic keys
		const entitySetName = entitySet.name;
		return SemanticKeyHelper.getSemanticKeys(metaModel, entitySetName) !== undefined;
	}

	_getPathFromContext(context: Context | ODataListBinding, parameters: RoutingNavigationParameters): string {
		let sPath = "";

		if (context.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			sPath = context.getHeaderContext()?.getPath() ?? "";
		} else {
			sPath = context.getPath();

			if (parameters.updateFCLLevel === -1) {
				// When navigating back from a context, we need to remove the last component of the path
				sPath = this.getPathToNavigateBack(sPath);

				// Check if we're navigating back to a semantic path that was previously resolved
				if (this.oLastSemanticMapping?.technicalPath === sPath) {
					sPath = this.oLastSemanticMapping.semanticPath;
				}
			} else if (this._checkIfContextSupportsSemanticPath(context)) {
				// We check if we have to use a semantic path
				const sSemanticPath = SemanticKeyHelper.getSemanticPath(context, true);

				if (!sSemanticPath) {
					// We were not able to build the semantic path --> Use the technical path and
					// clear the previous mapping, otherwise the old mapping is used in EditFlow#updateDocument
					// and it leads to unwanted page reloads
					this.setLastSemanticMapping(undefined);
				} else if (sSemanticPath !== sPath) {
					// Store the mapping technical <-> semantic path to avoid recalculating it later
					// and use the semantic path instead of the technical one
					this.setLastSemanticMapping({ technicalPath: sPath, semanticPath: sSemanticPath });
					sPath = sSemanticPath;
				}
			}
		}

		// remove extra '/' at the beginning of path
		if (sPath[0] === "/") {
			sPath = sPath.substring(1);
		}

		return sPath;
	}

	_calculateLayout(hash: string, parameters: RoutingNavigationParameters): string {
		// Open in full screen mode when opening in new tab/ window
		if (parameters.navMode === "openInNewTab" && parameters.FCLLevel !== -1) {
			return parameters.FCLLevel === 0 ? "MidColumnFullScreen" : "EndColumnFullScreen";
		}
		let FCLLevel = parameters.FCLLevel ?? 0;
		if (parameters.updateFCLLevel) {
			FCLLevel += parameters.updateFCLLevel;
			if (FCLLevel < 0) {
				FCLLevel = 0;
			}
		}

		// When navigating back, try to find the layout in the navigation history if it's not provided as parameter
		// (layout calculation is not handled properly by the FlexibleColumnLayoutSemanticHelper in this case)
		if (parameters.updateFCLLevel !== undefined && parameters.updateFCLLevel < 0 && !parameters.layout) {
			parameters.layout = this.oRouterProxy.findLayoutForHash(hash);
		}

		return this.oAppComponent.getRootViewController().calculateLayout(FCLLevel, hash, parameters.layout, parameters.keepCurrentLayout);
	}

	/**
	 * Event handler before a route is matched.
	 * Displays a busy indicator.
	 *
	 */
	_beforeRouteMatched(/*oEvent: Event*/): void {
		const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
		if (!bPlaceholderEnabled) {
			const oRootView = this.oAppComponent.getRootControl();
			BusyLocker.lock(oRootView);
		}
	}

	/**
	 * Checks if the current navigation has been triggered by the RouterProxy.
	 * @returns True if the current navigation has been triggered by the RouterProxy.
	 */
	_isNavigationTriggeredByRouterProxy(): boolean {
		// The RouterProxy sets a 'feLevel' property on the history.state object
		return history.state?.feLevel !== undefined;
	}

	/**
	 * Event handler when a route is matched.
	 * Hides the busy indicator and fires its own 'routematched' event.
	 * @param oEvent The event
	 */
	_onRouteMatched(oEvent: Router$RouteMatchedEvent): void {
		const oAppStateHandler = this.oAppComponent.getAppStateHandler(),
			oRootView = this.oAppComponent.getRootControl();
		const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
		if (BusyLocker.isLocked(oRootView) && !bPlaceholderEnabled) {
			BusyLocker.unlock(oRootView);
		}
		const mParameters: RoutingEventParameters = oEvent.getParameters() as RoutingEventParameters;
		if (this.navigationInfoQueue.length) {
			mParameters.navigationInfo = this.navigationInfoQueue[0];
			this.navigationInfoQueue = this.navigationInfoQueue.slice(1);
		} else {
			mParameters.navigationInfo = {};
		}
		if (oAppStateHandler.checkIfRouteChangedByIApp()) {
			mParameters.navigationInfo.reason = NavigationReason.AppStateChanged;
			oAppStateHandler.resetRouteChangedByIApp();
		} else if (this.oRouterProxy.checkRestoreHistoryWasTriggered()) {
			mParameters.navigationInfo.reason = NavigationReason.RestoreHistory;
			this.oRouterProxy.resetRestoreHistoryFlag();
		}

		this.sCurrentRouteName = oEvent.getParameter("name");
		this.sCurrentRoutePattern = mParameters.config.pattern;
		this.aCurrentViews = oEvent.getParameter("views");

		mParameters.routeInformation = this._getRouteInformation(this.sCurrentRouteName);
		mParameters.routePattern = this.sCurrentRoutePattern;

		this._fireRouteMatchEvents(mParameters);

		// Check if current hash has been set by the routerProxy.navToHash function
		// If not, rebuild history properly (both in the browser and the RouterProxy)
		if (!this._isNavigationTriggeredByRouterProxy()) {
			this.oRouterProxy
				.restoreHistory()
				.then((): void => {
					this.oRouterProxy.resolveRouteMatch();
					return;
				})
				.catch(function (oError: unknown) {
					Log.error("Error while restoring history", oError as string);
				});
		} else {
			this.oRouterProxy.resolveRouteMatch();
		}
	}

	attachRouteMatched(oData: object, fnFunction: Function, oListener?: object): void {
		this.eventProvider.attachEvent("routeMatched", oData, fnFunction, oListener);
	}

	detachRouteMatched(fnFunction: Function, oListener?: object): void {
		this.eventProvider.detachEvent("routeMatched", fnFunction, oListener);
	}

	attachAfterRouteMatched(oData: object, fnFunction: Function, oListener?: object): void {
		this.eventProvider.attachEvent("afterRouteMatched", oData, fnFunction, oListener);
	}

	detachAfterRouteMatched(fnFunction: Function, oListener: object): void {
		this.eventProvider.detachEvent("afterRouteMatched", fnFunction, oListener);
	}

	async initializeRouting(): Promise<void> {
		this.enabled = true;

		if (this.oAppComponent.getEnvironmentCapabilities().getCapabilities().Collaboration) {
			const { default: CollaborationHelper } = await import("sap/suite/ui/commons/collaboration/CollaborationHelper");
			await CollaborationHelper.processAndExpandHash();
		}
		// Attach router handlers

		this._fnOnRouteMatched = this._onRouteMatched.bind(this);
		this.oRouter.attachRouteMatched(this._fnOnRouteMatched, this);
		const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
		if (!bPlaceholderEnabled) {
			this.oRouter.attachBeforeRouteMatched(this._beforeRouteMatched.bind(this));
		}
		// Reset internal state
		this.navigationInfoQueue = [];
		EditState.resetEditState();
		this.bExitOnNavigateBackToRoot = !this.oRouter.match("");

		await this.manageStartupMode();
	}

	onRestore(): void {
		this.manageStartupMode();
	}

	async manageStartupMode(): Promise<void> {
		const bIsIappState = this.oRouter.getHashChanger().getHash().includes("sap-iapp-state");
		try {
			const oStartupParameters = await this.oAppComponent.getStartupParameters();
			const bHasStartUpParameters = oStartupParameters !== undefined && Object.keys(oStartupParameters).length !== 0;
			const sHash = this.oRouter.getHashChanger().getHash();
			// Manage startup parameters (in case of no iapp-state)
			if (!bIsIappState && bHasStartUpParameters && !sHash) {
				if (oStartupParameters.preferredMode && oStartupParameters.preferredMode[0].toUpperCase().includes("CREATE")) {
					// Create mode
					// This check will catch multiple modes like create, createWith and autoCreateWith which all need
					// to be handled like create startup!
					await this._manageCreateStartup(oStartupParameters);
				} else {
					// Deep link
					await this._manageDeepLinkStartup(oStartupParameters);
				}
			}
			await this._managedPreferredModeEdit(oStartupParameters);
		} catch (oError: unknown) {
			Log.error("Error during routing initialization", oError as string);
		}
	}

	getDefaultCreateHash(oStartupParameters?: StartupParameters): string {
		return AppStartupHelper.getDefaultCreateHash(oStartupParameters, this.getContextPath(), this.oRouter);
	}

	async _manageCreateStartup(oStartupParameters: StartupParameters): Promise<void> {
		return AppStartupHelper.getCreateStartupHash(oStartupParameters, this.getContextPath(), this.oRouter, this.oMetaModel).then(
			(sNewHash: string): void => {
				if (sNewHash) {
					(this.oRouter.getHashChanger().replaceHash as Function)(sNewHash);
					if (oStartupParameters?.preferredMode && oStartupParameters.preferredMode[0].toUpperCase().includes("AUTOCREATE")) {
						this.oAppComponent.setStartupModeAutoCreate();
					} else {
						this.oAppComponent.setStartupModeCreate();
					}
					this.bExitOnNavigateBackToRoot = true;
				}
				return;
			}
		);
	}

	async _manageDeepLinkStartup(oStartupParameters: StartupParameters | null): Promise<void> {
		return AppStartupHelper.getDeepLinkStartupHash(
			this.oAppComponent.getManifestEntry("sap.ui5").routing,
			oStartupParameters,
			this.oModel
		).then((oDeepLink) => {
			let sHash;
			if (oDeepLink.context) {
				const sTechnicalPath = oDeepLink.context.getPath();
				const sSemanticPath = this._checkIfContextSupportsSemanticPath(oDeepLink.context)
					? SemanticKeyHelper.getSemanticPath(oDeepLink.context, false)!
					: sTechnicalPath;

				if (sSemanticPath !== sTechnicalPath) {
					// Store the mapping technical <-> semantic path to avoid recalculating it later
					// and use the semantic path instead of the technical one
					this.setLastSemanticMapping({ technicalPath: sTechnicalPath, semanticPath: sSemanticPath });
				}

				sHash = sSemanticPath.substring(1); // To remove the leading '/'
			} else if (oDeepLink.hash) {
				sHash = oDeepLink.hash;
			}

			if (sHash) {
				//Replace the hash with newly created hash
				(this.oRouter.getHashChanger().replaceHash as Function)(sHash);
				this.oAppComponent.setStartupModeDeeplink();
			}
			return;
		});
	}

	/**
	 * Manages the preferred mode edit by appending "[&|?]i-action=edit" to the hash if:
	 * - There is a resulting hash from the previous logic,
	 * - The preferred mode is edit, and
	 * - The entity is editable
	 * This works for both deep-link startup (#App?ID=myId&preferredMode=edit) and object page routing (#App?preferredMode=edit&/Entity(ID)).
	 * @param startupParameters
	 * @param startupParameters.preferredMode
	 */
	async _managedPreferredModeEdit(startupParameters: { preferredMode?: string[] }): Promise<void> {
		const resultingHash = this.oRouter.getHashChanger().getHash();
		const shouldEdit = !!startupParameters.preferredMode?.[0]?.toUpperCase()?.includes("EDIT");
		const editable = await AppStartupHelper.verifyEditAnnotations(this.getContextPath(), this.oMetaModel);
		if (resultingHash && shouldEdit && editable) {
			const parameter = (resultingHash.includes("?") ? "&" : "?") + "i-action=edit";
			(this.oRouter.getHashChanger().replaceHash as (hash: string) => void)(resultingHash + parameter);
		}
	}

	getOutbounds(): Record<string, ManifestOutboundEntry> {
		return this.outbounds;
	}

	/**
	 * Returns the routing hints for the current route.
	 * Currently, this only covers the parent-child relationship from a list report to an object page.
	 * @returns The routing hints
	 */
	getRoutingHints(): Record<string, { parentOf: string[] }> {
		return this.routingHints ?? {};
	}

	/**
	 * Gets the name of the Draft root entity set or the sticky-enabled entity set.
	 * @returns The name of the root EntitySet
	 */
	getContextPath(): string {
		return this.sContextPath;
	}

	getInterface(): this {
		return this;
	}
}

class RoutingServiceFactory extends ServiceFactory<RoutingServiceSettings> {
	async createInstance(oServiceContext: ServiceContext<RoutingServiceSettings>): Promise<RoutingService> {
		const oRoutingService = new RoutingService(oServiceContext);
		return oRoutingService.initPromise;
	}
}

export default RoutingServiceFactory;

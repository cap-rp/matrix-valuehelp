import type { EntitySet, EntityType } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { defineUI5Class, extensible, finalExtension, methodOverride, publicExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import { type NavigationToErrorPageResult, type ShowMessagesParameters } from "sap/fe/core/controllerextensions/MessageHandler";
import type { BindContextParameters } from "sap/fe/core/controllerextensions/editFlow/draft";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import { getDraftOrActiveContext, isPathOnDraftRoot, resolvePath } from "sap/fe/core/controllerextensions/routing/ContextPathHelper";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import type RouterProxy from "sap/fe/core/controllerextensions/routing/RouterProxy";
import EditState from "sap/fe/core/helpers/EditState";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type FclController from "sap/fe/core/rootView/Fcl.controller";
import type { RoutingNavigationInfo, RoutingNavigationParameters, RoutingService } from "sap/fe/core/services/RoutingServiceFactory";
import type Event from "sap/ui/base/Event";
import Component from "sap/ui/core/Component";
import Library from "sap/ui/core/Lib";
import type { RoutingTarget } from "sap/ui/core/Manifest";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Router from "sap/ui/core/routing/Router";
import type Binding from "sap/ui/model/Binding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataPropertyBinding from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type { HiddenDraft } from "../converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "../converters/MetaModelConverter";
import type { SideEffectsTargetType } from "../services/SideEffectsServiceFactory";
import { addSelf } from "./collaboration/CollaborationCommon";
import UiModelConstants from "./editFlow/editFlowConstants";
import messageHandling from "./messageHandler/messageHandling";

type RouteInformation = {
	targets?: unknown[];
	routeLevel: number;
};
/**
 * {@link sap.ui.core.mvc.ControllerExtension Controller extension}
 * @since 1.74.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.InternalRouting")
class InternalRouting extends ControllerExtension {
	private base!: PageController;

	private _oView!: FEView;

	private _oAppComponent!: AppComponent;

	private _oPageComponent!: EnhanceWithUI5<TemplateComponent> | null;

	private _oRouter!: Router;

	private _oRoutingService!: RoutingService;

	private _oRouterProxy!: RouterProxy;

	private _fnRouteMatchedBound?: Function;

	protected _oTargetInformation!: RoutingTarget;

	@methodOverride()
	onExit(): void {
		if (this._oRoutingService && this._fnRouteMatchedBound) {
			this._oRoutingService.detachRouteMatched(this._fnRouteMatchedBound);
		}
	}

	@methodOverride()
	onInit(): void {
		this._oView = this.base.getView();
		this._oAppComponent = CommonUtils.getAppComponent(this._oView);
		this._oPageComponent = Component.getOwnerComponentFor(this._oView) as EnhanceWithUI5<TemplateComponent>;
		this._oRouter = this._oAppComponent.getRouter();
		this._oRouterProxy = this._oAppComponent.getRouterProxy();

		if (!this._oAppComponent || !this._oPageComponent) {
			throw new Error("Failed to initialize controler extension 'sap.fe.core.controllerextesions.InternalRouting");
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (this._oAppComponent === this._oPageComponent) {
			// The view isn't hosted in a dedicated UIComponent, but directly in the app
			// --> just keep the view
			this._oPageComponent = null;
		}

		this._oAppComponent
			.getService("routingService")
			.then((oRoutingService: RoutingService) => {
				this._oRoutingService = oRoutingService;
				if (this._oPageComponent?.isA("sap.fe.core.ReuseComponent") !== true) {
					// Reuse components can potentially embed a view with a page controller, we want to avoid attaching the route matched event in this case
					this._fnRouteMatchedBound = this._onRouteMatched.bind(this);
					this._oRoutingService.attachRouteMatched({}, this._fnRouteMatchedBound);
				}
				this._oTargetInformation = oRoutingService.getTargetInformationFor(this._oPageComponent || this._oView)! ?? {};
				return;
			})
			.catch(function () {
				throw new Error("This controller extension cannot work without a 'routingService' on the main AppComponent");
			});
	}

	/**
	 * Triggered every time this controller is a navigation target.
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onRouteMatched(): void {
		/**/
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onRouteMatchedFinished(): void {
		/**/
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeBinding(_bindingContext: Context | null, _mParameters?: unknown): void {}

	beforeSetBindingContext(bindingContext: Context | null, _mParameters?: unknown): void {
		this.onBeforeBinding(bindingContext, _mParameters);
		const oRouting = this.base.getView().getController().routing;
		if (oRouting && oRouting.onBeforeBinding) {
			oRouting.onBeforeBinding(bindingContext);
		}
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onAfterBinding(bindingContext: Context | null, _mParameters?: unknown): void {
		this._oAppComponent.getRootViewController().onContextBoundToView(bindingContext);
	}

	afterSetBindingContext(bindingContext: Context | null, _mParameters?: object): void {
		this.onAfterBinding(bindingContext, { ..._mParameters, deferredCreation: true });
		const oRouting = this.base.getView().getController().routing;
		if (oRouting && oRouting.onAfterBinding) {
			oRouting.onAfterBinding(bindingContext);
		}
	}

	///////////////////////////////////////////////////////////
	// Methods triggering a navigation after a user action
	// (e.g. click on a table row, button, etc...)
	///////////////////////////////////////////////////////////

	/**
	 * Navigates to the specified navigation target.
	 * @param oContext Context instance
	 * @param sNavigationTargetName Name of the navigation target
	 * @param bPreserveHistory True to force the new URL to be added at the end of the browser history (no replace)
	 * @param delayedUsage True to return a function for executing the navigation, False to execute the navigation immediately
	 */
	async navigateToTarget(
		oContext: Context,
		sNavigationTargetName: string,
		bPreserveHistory?: boolean,
		delayedUsage?: true
	): Promise<() => void>;

	@publicExtension()
	async navigateToTarget(
		oContext: Context,
		sNavigationTargetName: string,
		bPreserveHistory?: boolean,
		delayedUsage?: boolean
	): Promise<(() => void) | void> {
		const oNavigationConfiguration =
			this._oPageComponent &&
			this._oPageComponent.getNavigationConfiguration &&
			this._oPageComponent.getNavigationConfiguration(sNavigationTargetName);
		if (oNavigationConfiguration) {
			const oDetailRoute = oNavigationConfiguration.detail;
			const sRouteName = oDetailRoute.route;
			const mParameterMapping = oDetailRoute.parameters;
			return this._oRoutingService.navigateTo(oContext, sRouteName, mParameterMapping, bPreserveHistory, delayedUsage);
		} else {
			return this._oRoutingService.navigateTo(oContext, null, null, bPreserveHistory, delayedUsage);
		}
	}

	/**
	 * Get the Hash we're navigating to.
	 * @param context Context instance
	 * @param navigationTargetName Name of the navigation target
	 * @returns The Hash we're navigating to
	 */
	async getHashForNavigation(context: Context, navigationTargetName: string): Promise<string> {
		const navigationConfiguration = this?._oPageComponent?.getNavigationConfiguration(navigationTargetName);
		if (navigationConfiguration) {
			const detailRoute = navigationConfiguration.detail;
			const routeName = detailRoute.route;
			const parameterMapping = detailRoute.parameters;
			return this._oRoutingService.getHashFromRoute(context, routeName, parameterMapping);
		} else {
			return this._oRoutingService.getHashFromRoute(context, null);
		}
	}

	/**
	 * Navigates to the specified navigation target route.
	 * @param sTargetRouteName Name of the target route
	 * @param [oParameters] Parameters to be used with route to create the target hash
	 * @returns Promise that is resolved when the navigation is finalized
	 */
	@publicExtension()
	async navigateToRoute(sTargetRouteName: string, oParameters?: object): Promise<boolean> {
		return this._oRoutingService.navigateToRoute(sTargetRouteName, oParameters);
	}

	/**
	 * Navigates to a specific context.
	 * @param context The context to be navigated to
	 * @param parameters Optional navigation parameters
	 * @returns Promise resolved to 'true' when the navigation has been triggered, 'false' if the navigation did not happen
	 */
	async navigateToContext(context: Context | ODataListBinding, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		if (context.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			if (parameters.createOnNavigateParameters?.mode === "Async") {
				// the context is either created async (Promise)
				// We need to activate the routeMatchSynchro on the RouterProxy to avoid that
				// the subsequent call to navigateToContext conflicts with the current one
				this._oRouterProxy.activateRouteMatchSynchronization();

				parameters.createOnNavigateParameters.createContextPromise
					.then(async (createdContext) => {
						// once the context is returned we navigate into it
						return this.navigateToContext(createdContext, {
							checkNoHashChange: parameters.checkNoHashChange,
							editable: parameters.editable,
							persistOPScroll: parameters.persistOPScroll,
							updateFCLLevel: parameters.updateFCLLevel,
							forceFocus: parameters.forceFocus
						});
					})
					.catch(function (oError: unknown) {
						Log.error("Error with the async context", oError as string);
					});
			} else if (parameters.createOnNavigateParameters?.mode !== "Deferred") {
				// Navigate to a list binding not yet supported
				throw "navigation to a list binding is not yet supported";
			}
		} else if (parameters.callExtension) {
			const internalModel = this._oView.getModel("internal");
			internalModel.setProperty("/paginatorCurrentContext", null);

			// Storing the selected context to use it in internal route navigation if necessary.
			let contextToNavigate: Context | null = context;
			let hiddenBinding: ODataContextBinding | undefined;
			if (parameters.updateFCLLevel === -1) {
				// If we're navigating back, we need to find the "parent" context
				const backPath = this._oRoutingService.getPathToNavigateBack(context.getPath());
				// As we don't call the extension when navigating back to the LR, backPath is never empty so we can safely create a context
				hiddenBinding = context.getModel().bindContext(backPath);
				contextToNavigate = hiddenBinding.getBoundContext();
			}
			const overrideNav = await this.base.getView().getController().routing.onBeforeNavigation({ bindingContext: contextToNavigate });
			hiddenBinding?.destroy();
			if (overrideNav) {
				internalModel.setProperty("/paginatorCurrentContext", context);
				return Promise.resolve(true);
			}
		}

		parameters.FCLLevel = this.getFCLLevel();

		// In case we're navigating from a table in a ListReport with draft, there's special handling for collaboration and tree table.
		// We may not navigate to the context the user clicked on.
		if (parameters.reason === NavigationReason.RowPress && context.isA<Context>("sap.ui.model.odata.v4.Context")) {
			const model = context.getModel();
			const metaModel = model.getMetaModel();

			if (isPathOnDraftRoot(context.getPath(), metaModel)) {
				const contextForNavigation =
					(await this.getContextForNavigationWithCollaboration(context, parameters)) ??
					(await this.getContextForNavigationFromTreeOrAnalyticalTable(context));

				// Use another instance for navigation
				if (contextForNavigation) {
					context = contextForNavigation;
				}
			}
		}

		return this._oRoutingService.navigateToContext(context, parameters, this._oView.getViewData(), this._oTargetInformation);
	}

	/**
	 * Retrieves the context to use for navigation in case we're navigating to a draft instance from the LR and we're in a collaboration application.
	 * @param originalContext
	 * @param parameters
	 * @returns The context to use for navigation if it's different from the original context, null otherwise
	 */
	private async getContextForNavigationWithCollaboration(
		originalContext: Context,
		parameters: RoutingNavigationParameters
	): Promise<Context | null> {
		const model = originalContext.getModel();
		const metaModel = model.getMetaModel();
		if (ModelHelper.isCollaborationDraftSupported(metaModel) && originalContext.getProperty("IsActiveEntity") === false) {
			// If we're in a collaboration application, and we're navigating to a draft instance from the LR,
			// We want to check if the draft instance exists first. Otherwise we navigate to the original (draft) version.
			const draftOrActiveContext = await getDraftOrActiveContext(originalContext);

			if (draftOrActiveContext !== null && originalContext.getPath() !== draftOrActiveContext.getPath()) {
				// Notify the user that we have navigated to the saved instance
				const objectPath = getInvolvedDataModelObjects(metaModel.getMetaContext(originalContext.getPath()));
				parameters.redirectedToNonDraft =
					(objectPath.targetEntityType.annotations.UI?.HeaderInfo?.TypeName as unknown as string) ??
					objectPath.targetEntityType.name;

				if (this._oAppComponent.getRootViewController().isFclEnabled()) {
					// FCL: replace the context in the list binding
					const contextToReplaceWith = model.getKeepAliveContext(draftOrActiveContext.getPath());
					originalContext.replaceWith(contextToReplaceWith);
				} else {
					// Fullscreen: trigger a refresh of the list binding
					EditState.setEditStateDirty();
				}

				// Use the saved instance for navigation
				return draftOrActiveContext;
			}
		}

		// Use the original context
		return null;
	}

	/**
	 * Retrieves the context to use for navigation in case we're navigating to an active instance from the LR and we're in a Tree or Analytical table.
	 * @param originalContext
	 * @returns The context to use for navigation if it's different from the original context, null otherwise
	 */
	private async getContextForNavigationFromTreeOrAnalyticalTable(originalContext: Context): Promise<Context | null> {
		const parentBinding = originalContext.getBinding();
		if (!parentBinding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			// The context doesn't belong to a list binding
			return null;
		}
		const aggregation = parentBinding.getAggregation() as
			| { hierarchyQualifier?: string; group?: object; aggregate?: object }
			| undefined;
		if (!aggregation?.hierarchyQualifier && !aggregation?.group && !aggregation?.aggregate) {
			// The context doesn't belong to a hierarchical/analytical list binding
			return null;
		}

		if (originalContext.getProperty("IsActiveEntity") === true && originalContext.getProperty("HasDraftEntity") === true) {
			// If we're in a Tree/Analytical table, and we're navigating to an active instance instance that has a draft,
			// --> We try to navigate to the draft instance (if it still exists)
			const draftOrActiveContext = await getDraftOrActiveContext(originalContext);

			if (draftOrActiveContext !== null && originalContext.getPath() !== draftOrActiveContext.getPath()) {
				// Use the draft instance for navigation
				return draftOrActiveContext;
			}
		}

		// Use the original context
		return null;
	}

	/**
	 * Navigates backwards from a context.
	 * @param context Context to be navigated from
	 * @param [parameters] Optional navigation parameters
	 * @returns Promise resolved when the navigation has been triggered
	 */
	async navigateBackFromContext(context: Context, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		parameters.updateFCLLevel = -1;

		return this.navigateToContext(context, parameters);
	}

	/**
	 * Navigates forwards to a context.
	 * @param context Context to be navigated to
	 * @param parameters Optional navigation parameters
	 * @returns Promise resolved when the navigation has been triggered
	 */
	async navigateForwardToContext(context: Context | ODataListBinding, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		if (this._oView.getBindingContext("internal")?.getProperty("messageFooterContainsErrors") === true) {
			return Promise.resolve(true);
		}

		parameters.updateFCLLevel = 1;

		return this.navigateToContext(context, parameters);
	}

	/**
	 * Navigates back in history if the current hash corresponds to a transient state.
	 */
	@publicExtension()
	@finalExtension()
	navigateBackFromTransientState(): void {
		const sHash = this._oRouterProxy.getHash();

		// if triggered while navigating to (...), we need to navigate back
		if (sHash.includes("(...)")) {
			this._oRouterProxy.navBack();
		}
	}

	/**
	 * Displays an error (illustrated message) in the page.
	 * @param sErrorMessage
	 * @param mParameters
	 * @returns A promise
	 */
	async navigateToMessagePage(sErrorMessage: string, mParameters: NavigationToErrorPageResult): Promise<boolean> {
		mParameters = mParameters || {};
		if (this._oRouterProxy.getHash().includes("i-action=create") || this._oRouterProxy.getHash().includes("i-action=autoCreate")) {
			return this._oRouterProxy.navToHash(this._oRoutingService.getDefaultCreateHash());
		} else {
			return this._oAppComponent.getRootViewController().displayErrorPage(sErrorMessage, mParameters, this.getFCLLevel());
		}
	}

	/**
	 * Checks if one of the current views on the screen is bound to a given context.
	 * @param oContext
	 * @returns `true` if the state is impacted by the context
	 */
	@publicExtension()
	@finalExtension()
	isCurrentStateImpactedBy(oContext: Context): boolean {
		return this._oRoutingService.isCurrentStateImpactedBy(oContext);
	}

	_isViewPartOfRoute(routeInformation?: RouteInformation): boolean {
		const aTargets = routeInformation?.targets;
		if (!aTargets || !aTargets.includes(this._oTargetInformation.targetName)) {
			// If the target for this view has a view level greater than the route level, it means this view comes "after" the route
			// in terms of navigation.
			// In such case, we remove its binding context, to avoid this view to have data if we navigate to it later on
			// This is done in a timeout to allow for focusout events to be processed before properly in collaborative draft
			if ((this._oTargetInformation.viewLevel ?? 0) >= (routeInformation?.routeLevel ?? 0)) {
				this._oAppComponent.getRoutingService().addBindingCleanupPromise(
					new Promise<void>((resolve) => {
						setTimeout(() => {
							if (routeInformation?.routeLevel === 0 && this.base.collaborativeDraft.isConnected()) {
								// The route has level 0 --> we need to leave the collaboration session as no OP is displayed
								this.base.collaborativeDraft.disconnect();
							}
							this._setBindingContext(null); // This also call setKeepAlive(false) on the current context
							resolve();
						}, 0);
					})
				);
			}
			return false;
		}

		return true;
	}

	_buildBindingPath(
		routeArguments: Record<string, string | object>,
		bindingPattern: string,
		navigationParameters: RoutingNavigationInfo
	): { path: string; deferred: boolean } {
		let path = bindingPattern.replace(":?query:", "");
		let deferred = false;

		for (const sKey in routeArguments) {
			const sValue = routeArguments[sKey];

			if (typeof sValue !== "string") {
				continue;
			}

			if (sValue === "..." && bindingPattern.includes(`{${sKey}}`)) {
				deferred = true;
				// Sometimes in preferredMode = create, the edit button is shown in background when the
				// action parameter dialog shows up, setting bTargetEditable passes editable as true
				// to onBeforeBinding in _bindTargetPage function
				navigationParameters.bTargetEditable = true;
			}
			path = path.replace(`{${sKey}}`, sValue);
		}
		if ((routeArguments["?query"] as Record<string, string>)?.["i-action"]?.includes("create")) {
			navigationParameters.bActionCreate = true;
		}

		// the binding path is always absolute
		if (path && path[0] !== "/") {
			path = `/${path}`;
		}

		return { path, deferred };
	}

	///////////////////////////////////////////////////////////
	// Methods to bind the page when a route is matched
	///////////////////////////////////////////////////////////

	/**
	 * Called when a route is matched.
	 * Builds the binding context from the navigation parameters, and bind the page accordingly.
	 * @param oEvent
	 */
	_onRouteMatched(
		oEvent: Event<{
			routeInformation?: RouteInformation;
			routePattern: string;
			navigationInfo: RoutingNavigationInfo;
			arguments: Record<string, string | object>;
		}>
	): void {
		// Check if the target for this view is part of the event targets (i.e. is a target for the current route).
		// If not, we don't need to bind it --> return
		if (!this._isViewPartOfRoute(oEvent.getParameter("routeInformation"))) {
			return;
		}

		// Retrieve the binding context pattern
		let bindingPattern;
		if (this._oPageComponent && this._oPageComponent.getBindingContextPattern) {
			bindingPattern = this._oPageComponent.getBindingContextPattern();
		}
		bindingPattern = bindingPattern ?? this._oTargetInformation.contextPattern;

		if (bindingPattern === null || bindingPattern === undefined) {
			// Don't do this if we already got sTarget == '', which is a valid target pattern
			bindingPattern = oEvent.getParameter("routePattern");
		}

		// Replace the parameters by their values in the binding context pattern
		const mArguments = oEvent.getParameters().arguments;
		const oNavigationParameters = oEvent.getParameter("navigationInfo");
		const { path, deferred } = this._buildBindingPath(mArguments, bindingPattern, oNavigationParameters);

		this.onRouteMatched();

		let bindPromise;
		const oModel = this._oView.getModel();
		if (deferred) {
			bindPromise = this._bindDeferred(path, oNavigationParameters);
		} else if (
			oNavigationParameters.reason !== NavigationReason.EditFlowAction &&
			(this._oRouterProxy.getHash().includes("i-action=edit") || (this._oPageComponent?.isOpenInEditMode?.() ?? false))
		) {
			bindPromise = this._bindPageForEdit(path, oModel, oNavigationParameters);
		} else {
			bindPromise = this._bindPage(path, oModel, oNavigationParameters);
		}

		bindPromise
			.finally(() => {
				this.onRouteMatchedFinished();
			})
			.catch((error) => {
				Log.error("Error during page binding " + error.toString());
			});

		this._oAppComponent.getRootViewController().updateUIStateForView(this._oView, this.getFCLLevel());
	}

	/**
	 * Deferred binding (during object creation).
	 * @param targetPath The path to the deffered context
	 * @param navigationParameters Navigation parameters
	 * @returns A promise
	 */
	async _bindDeferred(targetPath: string, navigationParameters: RoutingNavigationInfo): Promise<void> {
		this.beforeSetBindingContext(null, { editable: navigationParameters.bTargetEditable });

		if (!navigationParameters.createOnNavigateParameters || navigationParameters.createOnNavigateParameters.mode === "Deferred") {
			// either the context shall be created in the target page (deferred Context) or it shall
			// be created async but the user refreshed the page / bookmarked this URL
			// TODO: currently the target component creates this document but we shall move this to
			// a central place
			if (this._oPageComponent && this._oPageComponent.createDeferredContext) {
				this._oPageComponent.createDeferredContext(
					targetPath,
					navigationParameters.createOnNavigateParameters?.listBinding,
					navigationParameters.createOnNavigateParameters?.parentContext,
					navigationParameters.createOnNavigateParameters?.data,
					!!navigationParameters.bActionCreate
				);
			}
		}

		// remove the context to avoid showing old data
		this._setBindingContext(null);

		this.afterSetBindingContext(null);

		return Promise.resolve();
	}

	/**
	 * Sets the binding context for the page from a path, if the app is started with the preferred mode edit.
	 *
	 * If the context points to an active entity, it is directly converted to draft using the EditFlow controller extension.
	 * @param targetPath
	 * @param model
	 * @param navigationParameters
	 * @returns A Promise resolved once the binding has been set on the page
	 */
	async _bindPageForEdit(targetPath: string, model: ODataModel, navigationParameters: RoutingNavigationInfo): Promise<void | Context> {
		if (targetPath === "") {
			return Promise.resolve(this._bindPageToContext(null, model, navigationParameters));
		}

		try {
			const technicalPath: string = await resolvePath(targetPath, model, this._oRoutingService, this._oRouter);
			const metaModel = model.getMetaModel();
			// check for sticky & sticky edit session
			const isStickyEditMode = CommonUtils.isStickyEditMode(this.base.getView());
			const isSticky = ModelHelper.isStickySessionSupported(metaModel);
			if (technicalPath.includes("IsActiveEntity=true") || (isSticky && !isStickyEditMode)) {
				// create context or use the one the user clicked on
				const activeContext =
					navigationParameters.useContext?.getPath() === technicalPath
						? navigationParameters.useContext
						: this._createContext(technicalPath, model);

				// edit document
				return await this.base.editFlow.editDocument(activeContext);
			} else {
				return this._bindPageToPath(technicalPath, model, navigationParameters);
			}
		} catch (error) {
			const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;

			this.navigateToMessagePage(resourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
				title: resourceBundle.getText("C_COMMON_SAPFE_ERROR"),
				description: (error as Error).message
			});
		}
	}

	/**
	 * Sets the binding context of the page from a path.
	 * @param targetPath The path to the context
	 * @param model The OData model
	 * @param navigationParameters Navigation parameters
	 * @returns A Promise resolved once the binding on the page is set
	 */
	async _bindPage(targetPath: string, model: ODataModel, navigationParameters: RoutingNavigationInfo): Promise<void> {
		if (targetPath === "") {
			// The page binding is done asynchronously, to make sure _onRouteMatched is called for all targets before, and the binding cleanup promises are properly stored in the routing service.
			return Promise.resolve().then(() => {
				this._bindPageToContext(null, model, navigationParameters);
				return;
			});
		}

		try {
			const technicalPath = await resolvePath(targetPath, model, this._oRoutingService, this._oRouter);
			this._bindPageToPath(technicalPath, model, navigationParameters);
		} catch (e) {
			await this.base.messageHandler.showMessages({});
		}
	}

	/**
	 * Sets the binding context for the page from a path.
	 * @param sTargetPath The path to build the context (this is a path in the model, so only technical keys are allowed).
	 * @param oModel The OData model
	 * @param oNavigationParameters Navigation parameters
	 */
	_bindPageToPath(sTargetPath: string, oModel: ODataModel, oNavigationParameters: RoutingNavigationInfo): void {
		const oCurrentContext = this._getBindingContext(),
			sCurrentPath = oCurrentContext && oCurrentContext.getPath(),
			oUseContext = oNavigationParameters.useContext as Context | undefined | null;

		const oRootViewController = this._oAppComponent.getRootViewController();

		// We set the binding context only if it's different from the current one
		// or if we have a context already selected
		if (oUseContext && oUseContext.getPath() === sTargetPath) {
			if (oUseContext !== oCurrentContext) {
				let shouldRefreshContext = false;
				// We already have the context to be used, and it's not the current one

				// In case of FCL, if we're reusing a context from a table (through navigation), we refresh it to avoid outdated data
				// We don't wait for the refresh to be completed (requestRefresh), so that the corresponding query goes into the same
				// batch as the ones from controls in the page.
				if (oRootViewController.isFclEnabled() && oNavigationParameters.reason === NavigationReason.RowPress) {
					const metaModel = oUseContext.getModel().getMetaModel();
					if (!oUseContext.getBinding().hasPendingChanges() && ModelHelper.isDraftSupported(metaModel, oUseContext.getPath())) {
						shouldRefreshContext = true;
					} else if (
						this.base.collaborativeDraft.isConnected() ||
						(ModelHelper.isDraftSupported(metaModel, oUseContext.getPath()) &&
							ModelHelper.isCollaborationDraftSupported(metaModel))
					) {
						// If there are pending changes but we're in collaboration draft, we force the refresh (discarding pending changes) as we need to have the latest version.
						// When navigating from LR to OP, the view is not connected yet --> check if we're in draft with collaboration from the metamodel
						oUseContext.getBinding().resetChanges();
						shouldRefreshContext = true;
					}
				}
				this._bindPageToContext(oUseContext, oModel, oNavigationParameters);
				if (shouldRefreshContext) {
					this._oAppComponent
						.getSideEffectsService()
						.requestSideEffects([{ $NavigationPropertyPath: "" }], oUseContext, oUseContext.getBinding().getGroupId())
						.catch((err) => {
							Log.error(`Cannot refresh context: ${err}`);
						});
				}
			} else if (oNavigationParameters.reason === NavigationReason.EditFlowAction) {
				// We have the same context but an editflow action happened (e.g. CancelDocument in sticky mode)
				// --> We need to call onBefore/AfterBinding to refresh the object page properly
				this.beforeSetBindingContext(oUseContext, {
					editable: oNavigationParameters.bTargetEditable,
					listBinding: oUseContext.getBinding(),
					bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
					reason: oNavigationParameters.reason,
					showPlaceholder: oNavigationParameters.bShowPlaceholder
				});
				this.afterSetBindingContext(oUseContext, { redirectedToNonDraft: oNavigationParameters?.redirectedToNonDraft });
			}
		} else if (sCurrentPath !== sTargetPath || oNavigationParameters.reason === NavigationReason.EditFlowAction) {
			// We need to create a new context for its path
			this._bindPageToContext(this._createContext(sTargetPath, oModel), oModel, oNavigationParameters);
		} else if (
			oNavigationParameters.reason !== NavigationReason.AppStateChanged &&
			oNavigationParameters.reason !== NavigationReason.RestoreHistory &&
			EditState.isEditStateDirty() &&
			!oRootViewController.isFclEnabled() &&
			oCurrentContext
		) {
			this._refreshBindingContext(oCurrentContext);
		}
	}

	/**
	 * Binds the page to a context.
	 * @param oContext Context to be bound
	 * @param oModel The OData model
	 * @param oNavigationParameters Navigation parameters
	 */
	_bindPageToContext(oContext: Context | null, oModel: ODataModel, oNavigationParameters: RoutingNavigationInfo): void {
		if (!oContext) {
			this.beforeSetBindingContext(null);
			this.afterSetBindingContext(null);
			return;
		}

		const oParentListBinding = oContext.getBinding();
		const oRootViewController = this._oAppComponent.getRootViewController();
		if (oRootViewController.isFclEnabled()) {
			if (!oParentListBinding || !oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				// if the parentBinding is not a listBinding, we create a new context
				oContext = this._createContext(oContext.getPath(), oModel);
			}

			try {
				this._setKeepAlive(
					oContext,
					true,
					() => {
						if (oContext && !this._oAppComponent.isExiting && oRootViewController.isContextUsedInPages(oContext)) {
							this.navigateBackFromContext(oContext);
						}
					},
					true // Load messages, otherwise they don't get refreshed later, e.g. for side effects
				);
			} catch (oError) {
				// setKeepAlive throws an exception if the parent listbinding doesn't have $$ownRequest=true
				// This case for custom fragments is supported, but an error is logged to make the lack of synchronization apparent
				Log.error(
					`View for ${oContext.getPath()} won't be synchronized. Parent listBinding must have binding parameter $$ownRequest=true`
				);
			}
		} else if (!oParentListBinding || oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			// We need to recreate the context otherwise we get errors
			oContext = this._createContext(oContext.getPath(), oModel);
		}

		// Set the binding context with the proper before/after callbacks
		this.beforeSetBindingContext(oContext, {
			editable: oNavigationParameters.bTargetEditable,
			listBinding: oParentListBinding,
			bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
			reason: oNavigationParameters.reason,
			showPlaceholder: oNavigationParameters.bShowPlaceholder
		});

		this._setBindingContext(oContext);
		this.afterSetBindingContext(oContext, { redirectedToNonDraft: oNavigationParameters?.redirectedToNonDraft });
	}

	/**
	 * Creates a context from a path.
	 * @param sPath The path
	 * @param oModel The OData model
	 * @returns The created context
	 */
	_createContext(sPath: string, oModel: ODataModel): Context {
		const oPageComponent = this._oPageComponent,
			sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet(),
			sContextPath =
				(oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath()) || (sEntitySet && `/${sEntitySet}`),
			oMetaModel = oModel.getMetaModel(),
			isCollaborationDraftSupported = ModelHelper.isCollaborationDraftSupported(oMetaModel),
			mParameters: BindContextParameters = {
				$$groupId: "$auto.Heroes",
				$$updateGroupId: "$auto",
				$$patchWithoutSideEffects: true
			};
		if (this.base.inlineEditFlow.isInlineEditPossible()) {
			// if inline edit is enabled on the page and this is the active entity, we need to update the group id to inline
			mParameters.$$updateGroupId = sPath.includes("IsActiveEntity=true") ? CommonUtils.INLINEEDIT_UPDATEGROUPID : "$auto";
		}
		// In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity) and semantic keys (for creating the semantic URL)
		const oDraftRoot = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
		const oDraftNode = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftNode`);
		const dataModelObject = sContextPath
			? oMetaModel.getContext(sContextPath) && getInvolvedDataModelObjects(oMetaModel.getContext(sContextPath))
			: null;
		const alternateAndSecondaryKeys = ModelHelper.getAlternateAndSecondaryKeys(
			dataModelObject?.targetEntityType as EntityType,
			dataModelObject?.targetEntitySet as EntitySet
		);
		const semanticKeys = oDraftRoot
			? dataModelObject?.targetEntityType.annotations.Common?.SemanticKey?.map((key) => key.value) ?? []
			: [];
		const oRootViewController = this._oAppComponent.getRootViewController();
		if (oRootViewController.isFclEnabled()) {
			const oContext = this._getKeepAliveContext(oModel, sPath, false, mParameters);
			if (!oContext) {
				throw new Error(`Cannot create keepAlive context ${sPath}`);
			} else if (oDraftRoot || oDraftNode) {
				const propertiesToRequest = ["HasActiveEntity", "HasDraftEntity", "IsActiveEntity"].concat(semanticKeys);
				if (oContext.getProperty("IsActiveEntity") === undefined) {
					oContext.requestProperty(propertiesToRequest);
					if (oDraftRoot) {
						oContext.requestObject("DraftAdministrativeData");
					}
				} else {
					// when switching between draft and edit we need to ensure those properties are requested again even if they are in the binding's cache
					// otherwise when you edit and go to the saved version you have no way of switching back to the edit version
					oContext.requestSideEffects(oDraftRoot ? propertiesToRequest.concat(["DraftAdministrativeData"]) : propertiesToRequest);
				}
			}

			return oContext;
		} else {
			const propertiesToSelect: string[] = [];
			if (sContextPath) {
				const sMessagesPath = ModelHelper.getMessagesPath(oMetaModel, sContextPath);
				if (sMessagesPath) {
					propertiesToSelect.push(sMessagesPath);
				}
			}

			// In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity)
			if (oDraftRoot || oDraftNode) {
				propertiesToSelect.push("HasActiveEntity", "HasDraftEntity", "IsActiveEntity");
				propertiesToSelect.push(...semanticKeys);
			}
			propertiesToSelect.push(...alternateAndSecondaryKeys);

			if (isCollaborationDraftSupported && oDraftRoot) {
				propertiesToSelect.push("DraftAdministrativeData/DraftAdministrativeUser");
			}

			if (propertiesToSelect.length) {
				mParameters.$select = propertiesToSelect.join(",");
			}

			if (this._oView.getBindingContext()) {
				const oPreviousBinding = this._oView.getBindingContext()?.getBinding();
				if (oPreviousBinding) {
					oModel.resetChanges(oPreviousBinding.getUpdateGroupId());
					oPreviousBinding.destroy();
				}
			}

			const oHiddenBinding = oModel.bindContext(sPath, undefined, mParameters);

			oHiddenBinding.attachEventOnce("dataRequested", () => {
				BusyLocker.lock(this._oView);
				this.base.messageHandler.holdMessagesForControl(this._oView);
			});
			oHiddenBinding.attachEventOnce("dataReceived", this.onDataReceived.bind(this));
			const boundContext = oHiddenBinding.getBoundContext();
			if (isCollaborationDraftSupported && sPath.includes("IsActiveEntity=false")) {
				addSelf(oMetaModel, sContextPath!, oModel, boundContext);
			}
			return boundContext;
		}
	}

	@publicExtension()
	async onDataReceived(oEvent: Event<{ error: { status?: number; cause?: { status?: number }; message?: string } }>): Promise<void> {
		const error = oEvent?.getParameter("error");
		if (BusyLocker.isLocked(this._oView)) {
			BusyLocker.unlock(this._oView);
		}

		if (error) {
			// TODO: in case of 404 the text shall be different
			const messageHandler = this.base.messageHandler;
			let mParams: ShowMessagesParameters = {};
			const errorStatus = error.status ?? error.cause?.status;
			try {
				const oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
				if (errorStatus === 503) {
					mParams = {
						isInitialLoad503Error: true,
						shellBack: true
					};
				} else if (errorStatus === 400) {
					mParams = {
						title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
						description: oResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR_DESCRIPTION"),
						isDataReceivedError: true,
						shellBack: true
					};
				} else {
					mParams = {
						title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
						description: error?.message,
						isDataReceivedError: true,
						shellBack: true
					};
				}
			} catch (oError: unknown) {
				Log.error("Error while getting the core resource bundle", oError as string);
			} finally {
				mParams.control = this._oView;
				await messageHandler.showMessages(mParams);
			}
		} else {
			await this.base.messageHandler.releaseHoldByControl(this._oView);
		}
	}

	/**
	 * Requests side effects on a binding context to "refresh" it.
	 * TODO: get rid of this once provided by the model
	 * a refresh on the binding context does not work in case a creation row with a transient context is
	 * used. also a requestSideEffects with an empty path would fail due to the transient context
	 * therefore we get all dependent bindings (via private model method) to determine all paths and then
	 * request them.
	 * @param oBindingContext Context to be refreshed
	 */
	_refreshBindingContext(oBindingContext: Context): void {
		const oPageComponent = this._oPageComponent;
		const oSideEffectsService = this._oAppComponent.getSideEffectsService();
		const sRootContextPath = oBindingContext.getPath();
		const sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet();
		const sContextPath =
			(oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath()) || (sEntitySet && `/${sEntitySet}`);
		const oMetaModel = this._oView.getModel().getMetaModel();
		let sMessagesPath;
		const aNavigationPropertyPaths: string[] = [];
		const aPropertyPaths: string[] = [];
		const oSideEffects: SideEffectsTargetType = {
			targetProperties: [],
			targetEntities: []
		};

		function getBindingPaths(oBinding: Binding): void {
			let aDependentBindings;
			const sRelativePath = (oBinding.getContext()?.getPath() ?? "").replace(sRootContextPath, ""); // If no context, this is an absolute binding so no relative path
			const sPath = (sRelativePath ? `${sRelativePath.slice(1)}/` : sRelativePath) + oBinding.getPath();

			if (oBinding.isA<ODataContextBinding>("sap.ui.model.odata.v4.ODataContextBinding")) {
				// if (sPath === "") {
				// now get the dependent bindings
				aDependentBindings = oBinding.getDependentBindings();
				if (aDependentBindings) {
					// ask the dependent bindings (and only those with the specified groupId
					//if (aDependentBindings.length > 0) {
					for (const item of aDependentBindings) {
						getBindingPaths(item);
					}
				} else if (!aNavigationPropertyPaths.includes(sPath)) {
					aNavigationPropertyPaths.push(sPath);
				}
			} else if (oBinding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
				if (!aNavigationPropertyPaths.includes(sPath)) {
					aNavigationPropertyPaths.push(sPath);
				}
			} else if (oBinding.isA<ODataPropertyBinding>("sap.ui.model.odata.v4.ODataPropertyBinding")) {
				if (!aPropertyPaths.includes(sPath)) {
					aPropertyPaths.push(sPath);
				}
			}
		}

		if (sContextPath) {
			sMessagesPath = ModelHelper.getMessagesPath(oMetaModel, sContextPath);
		}

		// binding of the context must have $$PatchWithoutSideEffects true, this bound context may be needed to be fetched from the dependent binding
		getBindingPaths(oBindingContext.getBinding());

		let i;
		for (i = 0; i < aNavigationPropertyPaths.length; i++) {
			oSideEffects.targetEntities.push({
				$NavigationPropertyPath: aNavigationPropertyPaths[i]
			});
		}
		oSideEffects.targetProperties = aPropertyPaths;
		if (sMessagesPath) {
			oSideEffects.targetProperties.push(sMessagesPath);
		}
		//all this logic to be replaced with a SideEffects request for an empty path (refresh everything), after testing transient contexts
		oSideEffects.targetProperties = oSideEffects.targetProperties.reduce((targets: string[], targetProperty) => {
			if (targetProperty) {
				const index = targetProperty.indexOf("/");
				targets.push(index > 0 ? targetProperty.slice(0, index) : targetProperty);
			}
			return targets;
		}, []);
		// OData model will take care of duplicates
		oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
	}

	/**
	 * Gets the binding context of the page or the component.
	 * @returns The binding context
	 */
	_getBindingContext(): Context | null | undefined {
		if (this._oPageComponent) {
			return this._oPageComponent.getBindingContext() as Context;
		} else {
			return this._oView.getBindingContext();
		}
	}

	/**
	 * Sets the binding context of the page or the component.
	 * @param oContext The binding context
	 */
	_setBindingContext(oContext: Context | null): void {
		let oPreviousContext, oTargetControl;
		if (this._oPageComponent) {
			oPreviousContext = this._oPageComponent.getBindingContext() as Context;
			oTargetControl = this._oPageComponent;
		} else {
			oPreviousContext = this._oView.getBindingContext();
			oTargetControl = this._oView;
		}

		oTargetControl.setBindingContext(oContext);

		if (oPreviousContext?.isKeepAlive() && oPreviousContext !== oContext) {
			this._setKeepAlive(oPreviousContext, false);
		}
	}

	/**
	 * Gets the flexible column layout (FCL) level corresponding to the view (-1 if the app is not FCL).
	 * @returns The level
	 */
	getFCLLevel(): number {
		return this._oTargetInformation.FCLLevel;
	}

	_setKeepAlive(
		oContext: Context,
		bKeepAlive: boolean,
		fnBeforeDestroy?: Parameters<Context["setKeepAlive"]>[1],
		bRequestMessages?: boolean
	): void {
		if (oContext.getPath().endsWith(")")) {
			// We keep the context alive only if they're part of a collection, i.e. if the path ends with a ')'
			const oMetaModel = oContext.getModel().getMetaModel();
			const sMetaPath = oMetaModel.getMetaPath(oContext.getPath());
			const sMessagesPath = ModelHelper.getMessagesPath(oMetaModel, sMetaPath);
			oContext.setKeepAlive(bKeepAlive, fnBeforeDestroy, !!sMessagesPath && bRequestMessages);
		}
	}

	_getKeepAliveContext(
		oModel: ODataModel,
		path: string,
		bRequestMessages?: boolean,
		parameters?: BindContextParameters
	): Context | undefined {
		// Get the path for the context that is really kept alive (part of a collection)
		// i.e. remove all segments not ending with a ')'
		const keptAliveSegments = path.split("/");
		const additionnalSegments: string[] = [];
		while (keptAliveSegments.length && !keptAliveSegments[keptAliveSegments.length - 1].endsWith(")")) {
			additionnalSegments.push(keptAliveSegments.pop()!);
		}

		if (keptAliveSegments.length === 0) {
			return undefined;
		}

		const keptAlivePath = keptAliveSegments.join("/");
		const oKeepAliveContext = oModel.getKeepAliveContext(keptAlivePath, bRequestMessages, parameters);

		if (additionnalSegments.length === 0) {
			return oKeepAliveContext;
		} else {
			additionnalSegments.reverse();
			const additionnalPath = additionnalSegments.join("/");
			return oModel.bindContext(additionnalPath, oKeepAliveContext).getBoundContext();
		}
	}

	/**
	 * Switches between column and full-screen mode when FCL is used.
	 *
	 */

	@publicExtension()
	@finalExtension()
	switchFullScreen(): void {
		const oSource = this.base.getView();
		const oFCLHelperModel = oSource.getModel("fclhelper"),
			bIsFullScreen = oFCLHelperModel.getProperty("/actionButtonsInfo/isFullScreen"),
			sNextLayout = oFCLHelperModel.getProperty(
				bIsFullScreen ? "/actionButtonsInfo/exitFullScreen" : "/actionButtonsInfo/fullScreen"
			),
			oRootViewController = this._oAppComponent.getRootViewController();

		const oContext = (oRootViewController as FclController).getRightmostContext
			? (oRootViewController as FclController).getRightmostContext()!
			: oSource.getBindingContext();

		this.base._routing.navigateToContext(oContext, { layout: sNextLayout }).catch(function () {
			Log.warning("cannot switch between column and fullscreen");
		});
	}

	/**
	 * Closes the column for the current view in a FCL.
	 *
	 */
	@publicExtension()
	@extensible(OverrideExecution.Before)
	async closeColumn(): Promise<void> {
		const oViewData = this._oView.getViewData();
		const oContext = this._oView.getBindingContext();
		const oMetaModel = oContext.getModel().getMetaModel();
		const navigationParameters: RoutingNavigationParameters = {
			noPreservationCache: true,
			layout: this._oView.getModel("fclhelper").getProperty("/actionButtonsInfo/closeColumn")
		};

		const isDocumentModified =
			!!this.getView()?.getModel("ui")?.getProperty(UiModelConstants.DocumentModified) || !oContext.getProperty("HasActiveEntity");
		const isHiddenDraftEnabled = (this._oAppComponent.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft as HiddenDraft)
			.enabled;

		if (!isDocumentModified && isHiddenDraftEnabled) {
			const mParameters = {
				skipDiscardPopover: true,
				skipBackNavigation: true
			};
			await this.base.editFlow.cancelDocument(oContext, mParameters);
			this.navigateBackFromContext(oContext, navigationParameters);
		} else if (oViewData?.viewLevel === 1 && ModelHelper.isDraftSupported(oMetaModel, oContext.getPath())) {
			draft.processDataLossOrDraftDiscardConfirmation(
				() => {
					// We don't have callExtension=true in this case, as there's a user validation with the dataloss dialog
					// and it wouldn't make sense to cancel the navigation after this confirmation
					this.navigateBackFromContext(oContext, navigationParameters);
				},
				Function.prototype,
				oContext,
				this._oView.getController(),
				true,
				draft.NavigationType.BackNavigation
			);
		} else {
			navigationParameters.callExtension = true;
			this.navigateBackFromContext(oContext, navigationParameters);
		}
		// Removes transition message for the specified context
		messageHandling.removeTransistionMessageForContext(oContext);
	}
}

export default InternalRouting;

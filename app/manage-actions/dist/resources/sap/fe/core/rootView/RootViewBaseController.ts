import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import { defineUI5Class, usingExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import BaseController from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import { type NavigationToErrorPageResult } from "sap/fe/core/controllerextensions/MessageHandler";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import { getRouteTargetNames } from "sap/fe/core/helpers/ManifestHelper";
import SizeHelper from "sap/fe/core/helpers/SizeHelper";
import type FclController from "sap/fe/core/rootView/Fcl.controller";
import type NavContainer from "sap/m/NavContainer";
import BindingParser from "sap/ui/base/BindingParser";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import HashChanger from "sap/ui/core/routing/HashChanger";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import type Table from "sap/ui/mdc/Table";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type { ODataPropertyBinding$ChangeEvent } from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import URI from "sap/ui/thirdparty/URI";
import type { TitleAdditionalInfo } from "sap/ushell/ui5service/ShellUIService";
import type AppComponent from "../AppComponent";
import Any from "../controls/Any";

export type TitleInformation = {
	title?: string;
	subtitle?: string;
	icon?: string;
	intent?: string;
	description?: string;
};

@defineUI5Class("sap.fe.core.rootView.RootViewBaseController")
class RootViewBaseController extends BaseController {
	@usingExtension(Placeholder)
	oPlaceholder!: Placeholder;

	@usingExtension(ViewState)
	viewState!: ViewState;

	private _aHelperModels!: JSONModel[];

	private oRouter?: Router;

	private _oRouteMatchedPromise?: Promise<void>;

	private oTitleHierarchyCache?: Record<string, TitleInformation>;

	private bIsComputingTitleHierachy = false;

	onInit(): void {
		SizeHelper.init();

		this._aHelperModels = [];
	}

	getPlaceholder(): Placeholder {
		return this.oPlaceholder;
	}

	attachRouteMatchers(): void {
		this.oPlaceholder.attachRouteMatchers();
		this.getAppComponent().getRoutingService().attachAfterRouteMatched({}, this.onAfterRouteMatched, this);
	}

	onExit(): void {
		this.getAppComponent().getRoutingService().detachAfterRouteMatched(this.onAfterRouteMatched, this);
		this.oRouter = undefined;

		SizeHelper.exit();

		// Destroy all JSON models created dynamically for the views
		this._aHelperModels.forEach(function (oModel: JSONModel) {
			oModel.destroy();
		});
	}

	getViewFromContainer(container: Control): View | undefined {
		const result = container.isA<ComponentContainer>("sap.ui.core.ComponentContainer")
			? container.getComponentInstance().getRootControl()
			: container;

		return result?.isA<View>("sap.ui.core.mvc.View") ? result : undefined;
	}

	/**
	 * Analyze the pages and return the corresponding views.
	 * @param pages The pages to be analyzed.
	 * @returns The views
	 */
	protected getViewsFromPages(pages: Control[]): View[] {
		const views: View[] = [];

		pages.forEach((page) => {
			const view = this.getViewFromContainer(page);

			if (view !== undefined) {
				views.push(view);
			}
		});

		return views;
	}

	/**
	 * Convenience method for getting the resource bundle.
	 * @public
	 * @returns The resourceModel of the component
	 */
	getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
		return (this.getOwnerComponent().getModel("i18n") as ResourceModel).getResourceBundle();
	}

	getRouter(): Router {
		if (!this.oRouter) {
			this.oRouter = this.getAppComponent().getRouter();
		}

		return this.oRouter;
	}

	_createHelperModel(): JSONModel {
		// We keep a reference on the models created dynamically, as they don't get destroyed
		// automatically when the view is destroyed.
		// This is done during onExit
		const oModel = new JSONModel();
		this._aHelperModels.push(oModel);

		return oModel;
	}

	async routingIsComplete(): Promise<void> {
		await (this._oRouteMatchedPromise || Promise.resolve());
	}

	/**
	 * Function waiting for the Right most view to be ready.
	 * @param oEvent Reference an Event parameter coming from routeMatched event
	 * @returns A promise indicating when the right most view is ready
	 */
	async waitForRightMostViewReady(oEvent: Route$MatchedEvent): Promise<FEView> {
		return new Promise(function (resolve: (value: FEView) => void) {
			const aContainers = oEvent.getParameter("views") ?? [],
				// There can also be reuse components in the view, remove them before processing.
				aFEContainers: FEView[] = [];
			aContainers.forEach(function (oContainer: View | ComponentContainer | undefined) {
				let oView = oContainer as FEView | undefined;
				if (oContainer && (oContainer as ComponentContainer).getComponentInstance) {
					const oComponentInstance = (oContainer as ComponentContainer).getComponentInstance();
					oView = oComponentInstance.getRootControl() as FEView;
				}
				if (oView && oView.getController() && oView.getController().pageReady) {
					aFEContainers.push(oView);
				}
			});
			const oRightMostFEView = aFEContainers[aFEContainers.length - 1];
			if (oRightMostFEView && oRightMostFEView.getController().pageReady.isPageReady()) {
				resolve(oRightMostFEView);
			} else if (oRightMostFEView) {
				oRightMostFEView.getController().pageReady.attachEventOnce("pageReady", function () {
					resolve(oRightMostFEView);
				});
			}
		});
	}

	/**
	 * Method to restore the focusInformation from the history Object.
	 */
	protected restoreFocusFromHistory(): void {
		switch (history.state.focusInfo.type) {
			case "Row":
				const table = Element.getElementById(history.state.focusInfo.tableId) as Table;
				const pos = table
					.getRowBinding()
					.getCurrentContexts()
					.findIndex((context) => context.getPath() === history.state.focusInfo.contextPathFocus);
				if (pos !== -1) {
					table.focusRow(pos);
				}
				break;
			default:
				Element.getElementById(history.state.focusInfo.controlId)?.focus();
		}
		//once applied, the focus info is removed to prevent focusing on it each time the user do a back navigation to this page
		history.replaceState(Object.assign(history.state, { focusInfo: null }), "");
	}

	/**
	 * Callback when the navigation is done.
	 * - update the shell title.
	 * - update table scroll.
	 * - call onPageReady on the rightMostView.
	 * @param event
	 * @returns A promise for the current navigation
	 */
	async onAfterRouteMatched(event: Route$MatchedEvent): Promise<FEView | undefined> {
		try {
			const view = await this.waitForRightMostViewReady(event);

			if (this.getVisibleViews().includes(view)) {
				// The autoFocus is initially disabled on the navContainer or the FCL, so that the focus stays on the Shell menu
				// even if the app takes a long time to launch
				// The first time the view is displayed, we need to enable the autofocus so that it's managed properly during navigation
				const rootControl = this.getView().getContent()[0];
				if (
					rootControl &&
					(rootControl as FlexibleColumnLayout).getAutoFocus &&
					!(rootControl as FlexibleColumnLayout).getAutoFocus()
				) {
					rootControl.setProperty("autoFocus", true, true); // Do not mark the container as invalid, otherwise it's re-rendered
				}

				const appComponent = this.getAppComponent();
				this._scrollTablesToLastNavigatedItems();
				if (appComponent.getEnvironmentCapabilities().getCapabilities().UShell) {
					this.computeTitleHierarchy(view);
				}
				const forceFocus = appComponent.getRouterProxy().isFocusForced();
				appComponent.getRouterProxy().setFocusForced(false); // reset
				if (view.getController() && (view.getParent() as TemplateComponent).onPageReady) {
					(view.getParent() as TemplateComponent).onPageReady({ forceFocus: forceFocus });
				}
				if (history.state.focusInfo) {
					this.restoreFocusFromHistory();
				} else if (!forceFocus) {
					// Try to restore the focus on where it was when we last visited the current hash
					appComponent.getRouterProxy().restoreFocusForCurrentHash();
				}
				if (this.onContainerReady) {
					this.onContainerReady();
				}
			}
			return view;
		} catch (error: unknown) {
			Log.error("An error occurs while computing the title hierarchy and calling focus method", error as string);
		}
	}

	/**
	 * This function returns the TitleHierarchy cache ( or initializes it if undefined).
	 * @returns  The TitleHierarchy cache
	 */
	_getTitleHierarchyCache(): Record<string, TitleInformation> {
		if (!this.oTitleHierarchyCache) {
			this.oTitleHierarchyCache = {};
		}
		return this.oTitleHierarchyCache;
	}

	/**
	 * This function clear the TitleHierarchy cache for the given context path.
	 * @param  path The path of the context to clear the cache for
	 */
	clearTitleHierarchyCache(path: string): void {
		delete this._getTitleHierarchyCache()[path];
	}

	/**
	 * This function returns a titleInfo object.
	 * @param title The application's title
	 * @param subtitle The application's subTitle
	 * @param sIntent The intent path to be redirected to
	 * @param description The application's description
	 * @param icon The application's icon
	 * @returns The title information
	 */
	_computeTitleInfo(title: string, subtitle: string, sIntent: string, description?: string, icon = ""): TitleInformation {
		const aParts = sIntent.split("/");
		if (!aParts[aParts.length - 1].includes("?")) {
			sIntent += "?restoreHistory=true";
		} else {
			sIntent += "&restoreHistory=true";
		}
		return {
			title: title,
			subtitle: subtitle,
			intent: sIntent,
			icon: icon,
			description: description
		};
	}

	_formatTitle(displayMode: string, titleValue: string, titleDescription: string): string {
		let formattedTitle = "";
		switch (displayMode) {
			case "Value":
				formattedTitle = `${titleValue}`;
				break;
			case "ValueDescription":
				formattedTitle = `${titleValue} (${titleDescription})`;
				break;
			case "DescriptionValue":
				formattedTitle = `${titleDescription} (${titleValue})`;
				break;
			case "Description":
				formattedTitle = `${titleDescription}`;
				break;
			default:
		}
		return formattedTitle;
	}

	/**
	 * Fetches the value of the HeaderInfo title for a given path.
	 * @param path The path to the entity
	 * @returns A promise containing the formatted title, or an empty string if no HeaderInfo title annotation is available
	 */
	async _fetchTitleValue(path: string): Promise<string> {
		const appComponent = this.getAppComponent(),
			model = this.getView().getModel(),
			metaModel = appComponent.getMetaModel(),
			metaPath = metaModel.getMetaPath(path),
			bindingViewContext = model.createBindingContext(path),
			headerInfoTitleValueAnnotation = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value`),
			valueExpression = AnnotationHelper.format(headerInfoTitleValueAnnotation, { context: metaModel.createBindingContext("/") });
		if (!valueExpression) {
			return Promise.resolve("");
		}
		if (headerInfoTitleValueAnnotation.$Function === "odata.concat") {
			const anyObject = new Any({ any: valueExpression });
			anyObject.setModel(model);
			anyObject.setBindingContext(bindingViewContext);
			const textBinding = anyObject.getBinding("any");
			if (textBinding?.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
				await Promise.all(textBinding.getBindings().map((binding) => binding.requestValue?.()));
			}
			const infoTitle = anyObject.getAny();
			anyObject.destroy();
			return Promise.resolve(infoTitle as string);
		}
		const textExpression = AnnotationHelper.format(
				metaModel.getObject(
					`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@com.sap.vocabularies.Common.v1.Text`
				),
				{ context: metaModel.createBindingContext("/") }
			),
			propertyContext = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@`),
			promises: Promise<string>[] = [],
			parsedvalueExpression = BindingParser.complexParser(valueExpression),
			promiseForDisplayMode = new Promise(function (resolve: (value: string) => void) {
				const displayMode = CommonUtils.computeDisplayMode(propertyContext);
				resolve(displayMode);
			});
		promises.push(promiseForDisplayMode);
		const valuePath = parsedvalueExpression.parts ? parsedvalueExpression.parts[0].path : parsedvalueExpression.path,
			fnValueFormatter = parsedvalueExpression.formatter,
			valueBinding = model.bindProperty(valuePath, bindingViewContext, { $$groupId: "$auto.Heroes" });
		valueBinding.initialize();
		const promiseForTitleValue = new Promise(function (resolve: (value: string) => void) {
			const fnChange = function (event: ODataPropertyBinding$ChangeEvent): void {
				const targetValue = fnValueFormatter ? fnValueFormatter(event.getSource().getValue()) : event.getSource().getValue();

				valueBinding.detachChange(fnChange);
				resolve(targetValue);
			};
			valueBinding.attachChange(fnChange);
		});
		promises.push(promiseForTitleValue);

		if (textExpression) {
			const parsedTextExpression = BindingParser.complexParser(textExpression);
			let textPath = parsedTextExpression.parts ? parsedTextExpression.parts[0].path : parsedTextExpression.path;
			textPath = valuePath.lastIndexOf("/") > -1 ? `${valuePath.slice(0, valuePath.lastIndexOf("/"))}/${textPath}` : textPath;

			const fnTextFormatter = parsedTextExpression.formatter,
				textBinding = model.bindProperty(textPath, bindingViewContext, { $$groupId: "$auto.Heroes" });
			textBinding.initialize();
			const promiseForTitleText = new Promise(function (resolve: (description: string) => void) {
				const fnChange = function (event: ODataPropertyBinding$ChangeEvent): void {
					const targetText = fnTextFormatter ? fnTextFormatter(event.getSource().getValue()) : event.getSource().getValue();

					textBinding.detachChange(fnChange);
					resolve(targetText);
				};

				textBinding.attachChange(fnChange);
			});
			promises.push(promiseForTitleText);
		}
		try {
			const titleInfo: string[] = await Promise.all(promises);
			let formattedTitle = "";
			if (typeof titleInfo !== "string") {
				formattedTitle = this._formatTitle(titleInfo[0], titleInfo[1], titleInfo[2]);
			}
			return formattedTitle;
		} catch (error: unknown) {
			Log.error("Error while fetching the title from the header info :" + error);
		}
		return "";
	}

	/**
	 * Function returning the decoded application-specific hash.
	 * @returns Decoded application-specific hash
	 */
	getAppSpecificHash(): string {
		// HashChanged isShellNavigationHashChanger
		const hashChanger = HashChanger.getInstance();
		return hashChanger.hrefForAppSpecificHash ? URI.decode(hashChanger.hrefForAppSpecificHash("")) : "#/";
	}

	_getHash(): string {
		return HashChanger.getInstance().getHash();
	}

	/**
	 * This function returns titleInformation from a path.
	 * It updates the cache to store title information if necessary
	 * @param {*} sPath path of the context to retrieve title information from MetaModel
	 * @returns {Promise}  oTitleinformation returned as promise
	 */

	async getTitleInfoFromPath(sPath: string): Promise<TitleInformation> {
		const oTitleHierarchyCache = this._getTitleHierarchyCache();

		if (oTitleHierarchyCache[sPath]) {
			// The title info is already stored in the cache
			return Promise.resolve(oTitleHierarchyCache[sPath]);
		}

		const oMetaModel = this.getAppComponent().getMetaModel();
		const sEntityPath = oMetaModel.getMetaPath(sPath);
		const sTypeName = oMetaModel.getObject(`${sEntityPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName`);
		const sAppSpecificHash = this.getAppSpecificHash();
		const sIntent = sAppSpecificHash + sPath.slice(1);
		return this._fetchTitleValue(sPath).then((sTitle: string) => {
			const oTitleInfo = this._computeTitleInfo(sTypeName, sTitle, sIntent);
			oTitleHierarchyCache[sPath] = oTitleInfo;
			return oTitleInfo;
		});
	}

	/**
	 * Ensure that the ushell service receives all elements
	 * (title, subtitle, intent, icon) as strings.
	 *
	 * Annotation HeaderInfo allows for binding of title and description
	 * (which are used here as title and subtitle) to any element in the entity
	 * (such types as Boolean, timestamp, double, and others are possible)
	 *
	 * Creates a new hierarchy and converts non-string types to string.
	 * @param aHierarchy Shell title hierarchy
	 * @returns Copy of shell title hierarchy containing all elements as strings
	 */
	_ensureHierarchyElementsAreStrings(aHierarchy: TitleInformation[]): object[] {
		const aHierarchyShell = [];
		for (const level in aHierarchy) {
			const oHierarchy = aHierarchy[level];
			const oShellHierarchy: Record<string, string> = {};
			for (const key in oHierarchy) {
				oShellHierarchy[key] = (
					typeof oHierarchy[key as keyof TitleInformation] !== "string"
						? String(oHierarchy[key as keyof TitleInformation])
						: oHierarchy[key as keyof TitleInformation]
				) as string;
			}
			aHierarchyShell.push(oShellHierarchy);
		}
		return aHierarchyShell;
	}

	_getTargetTypeFromHash(sHash: string): string {
		const oAppComponent = this.getAppComponent();
		let sTargetType = "";

		const aRoutes = oAppComponent.getManifestEntry("sap.ui5").routing?.routes ?? [];
		for (const route of aRoutes) {
			const oRoute = oAppComponent.getRouter().getRoute(route.name);
			if (oRoute?.match(sHash)) {
				const sTarget = getRouteTargetNames(route.target)[0];
				sTargetType = (oAppComponent.getRouter().getTarget(sTarget) as unknown as { _oOptions: { name: string } })._oOptions.name;
				break;
			}
		}

		return sTargetType;
	}

	/**
	 * Helper method to determine the format of the browser title based on the current view.
	 * @param titleInfoHierarchyShell TitleInformation array
	 * @param pageTitleInformation TitleInformation object
	 * @returns An object with a header text and an additional context
	 */
	_getBrowserTitle(titleInfoHierarchyShell: TitleInformation[], pageTitleInformation: TitleInformation): { headerText: string } {
		const breadcrumbTexts = [];
		let firstPart = "",
			secondPart = "";

		const titleInfoHierarchy = [...titleInfoHierarchyShell];
		if (titleInfoHierarchy.length > 1) {
			titleInfoHierarchy.pop();
			titleInfoHierarchy.forEach((titleInfo) => {
				if (titleInfo.subtitle) {
					breadcrumbTexts.push(titleInfo.subtitle);
				}
			});
		}
		if (pageTitleInformation.title) {
			breadcrumbTexts.push(pageTitleInformation.title);
		}
		if (pageTitleInformation.description) {
			firstPart = `${pageTitleInformation.subtitle}(${pageTitleInformation.description})`;
		} else {
			firstPart = `${pageTitleInformation.subtitle}`;
		}
		secondPart = breadcrumbTexts.join(" - ");

		return {
			headerText: secondPart ? `${firstPart} - ${secondPart}` : firstPart
		};
	}

	/**
	 * Calculate the browser title and menu title, then trigger the set API of the shell.
	 * @param appTitle Application title
	 * @param titleInfoHierarchyShell An object for title information
	 * @param pageTitleInformation TitleInformation object
	 */
	async _setTitles(appTitle: string, titleInfoHierarchyShell: TitleInformation[], pageTitleInformation: TitleInformation): Promise<void> {
		// Get the title of the browser
		let browserTitle;
		const appComponent = this.getAppComponent(),
			title = pageTitleInformation.title ?? "";
		if (titleInfoHierarchyShell.length) {
			browserTitle = this._getBrowserTitle(titleInfoHierarchyShell, pageTitleInformation);
		}
		await this._setShellMenuTitle(appComponent, title, appTitle, browserTitle);
	}

	/**
	 * This function updates the shell title after each navigation.
	 * @param view The current view
	 * @returns A Promise that is resolved when the menu is filled properly
	 * @private
	 */
	async computeTitleHierarchy(view: View): Promise<void> {
		const appComponent = this.getAppComponent(),
			context = view.getBindingContext(),
			currentPage = view.getParent(),
			titleInformationPromises = [],
			appSpecificHash = this.getAppSpecificHash(),
			manifestAppSettings = appComponent.getManifestEntry("sap.app"),
			appTitle = manifestAppSettings.title || "",
			appSubTitle = manifestAppSettings.subTitle || "",
			appIcon = manifestAppSettings.icon || "";
		let pageTitleInformation: TitleInformation, newPath: string | undefined;

		if (currentPage && (currentPage as TemplateComponent)._getPageTitleInformation) {
			if (context) {
				// If the first page of the application is a LR, use the title and subtitle from the manifest
				if (this._getTargetTypeFromHash("") === "sap.fe.templates.ListReport") {
					titleInformationPromises.push(this.getRootLevelTitleInformation(appSpecificHash, appTitle, appSubTitle, appIcon));
				}

				// Then manage other pages
				newPath = context.getPath();
				const pathParts = newPath.split("/");
				let path = "";

				pathParts.shift(); // Remove the first segment (empty string) as it has been managed above
				pathParts.pop(); // Remove the last segment as it corresponds to the current page and shouldn't appear in the menu
				pathParts.forEach((pathPart: string) => {
					path += `/${pathPart}`;
					//if the associated target is not declared in the routes, we skip it
					if (!appComponent.getRouter().getRouteInfoByHash(path)) {
						return;
					}
					const metaModel = appComponent.getMetaModel(),
						parameterPath = metaModel.getMetaPath(path),
						isParameterized = metaModel.getObject(`${parameterPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
					if (!isParameterized) {
						titleInformationPromises.push(this.getTitleInfoFromPath(path));
					}
				});
			}

			// Current page
			pageTitleInformation = (currentPage as TemplateComponent)._getPageTitleInformation();
			pageTitleInformation = this._computeTitleInfo(
				pageTitleInformation.title ?? "",
				pageTitleInformation.subtitle ?? "",
				appSpecificHash + this._getHash(),
				pageTitleInformation.description
			);

			if (context && newPath) {
				this._getTitleHierarchyCache()[newPath] = pageTitleInformation;
			} else {
				this._getTitleHierarchyCache()[appSpecificHash] = pageTitleInformation;
			}
		} else {
			titleInformationPromises.push(Promise.reject("Title information missing in HeaderInfo"));
		}
		return Promise.all(titleInformationPromises)
			.then(async (titleInfoHierarchy: TitleInformation[]): Promise<void> => {
				// workaround for shell which is expecting all elements being of type string
				const titleInfoHierarchyShell = this._ensureHierarchyElementsAreStrings(titleInfoHierarchy),
					title = pageTitleInformation.title ?? "";
				titleInfoHierarchyShell.reverse();
				await appComponent.getShellServices().setHierarchy(titleInfoHierarchyShell);

				await this._setTitles(appTitle, titleInfoHierarchyShell, pageTitleInformation);

				return;
			})
			.catch(function (errorMessage: unknown) {
				Log.error(errorMessage as string);
			})
			.finally(() => {
				this.bIsComputingTitleHierachy = false;
			})
			.catch(function (errorMessage: unknown) {
				Log.error(errorMessage as string);
			});
	}

	/**
	 * Retrieve the title information for the root level.
	 * @param appSpecificHash The application-specific hash
	 * @param appTitle The application title
	 * @param appSubTitle The application subtitle
	 * @param appIcon The application icon
	 * @returns A Promise containing the title information
	 */
	private async getRootLevelTitleInformation(
		appSpecificHash: string,
		appTitle: string,
		appSubTitle: string,
		appIcon: string
	): Promise<TitleInformation> {
		const oTitleHierarchyCache = this._getTitleHierarchyCache();

		if (oTitleHierarchyCache[appSpecificHash]) {
			// The title info is already stored in the cache
			return Promise.resolve(oTitleHierarchyCache[appSpecificHash]);
		} else {
			return Promise.resolve(this._computeTitleInfo(appTitle, appSubTitle, appSpecificHash, undefined, appIcon));
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	calculateLayout(iNextFCLLevel: number, sHash: string, sProposedLayout: string | undefined, keepCurrentLayout = false): string {
		return "";
	}

	/**
	 * Callback after a view has been bound to a context.
	 * @param oContext The context that has been bound to a view
	 */
	onContextBoundToView(oContext: Context | undefined | null): void {
		if (oContext) {
			const sDeepestPath = this.getView().getModel("internal").getProperty("/deepestPath"),
				sViewContextPath = oContext.getPath();

			if (!sDeepestPath || sDeepestPath.indexOf(sViewContextPath) !== 0) {
				// There was no previous value for the deepest reached path, or the path
				// for the view isn't a subpath of the previous deepest path --> update
				this.getView().getModel("internal").setProperty("/deepestPath", sViewContextPath, undefined, true);
			}
		}
	}

	async displayErrorPage(_errorMessage: string, _parameters: NavigationToErrorPageResult, _FCLLevel = 0): Promise<boolean> {
		// To be overridden
		return Promise.resolve(true);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	updateUIStateForView(oView: FEView, FCLLevel: number): void {
		// To be overriden
	}

	getInstancedViews(): View[] {
		return [];
		// To be overriden
	}

	/**
	 * Return all visible views.
	 * @returns The visible views
	 */
	getVisibleViews(): View[] {
		return [];
		// To be overriden
	}

	_scrollTablesToLastNavigatedItems(): void {
		// To be overriden
	}

	isFclEnabled(): this is FclController {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async _setShellMenuTitle(
		oAppComponent: AppComponent,
		sTitle: string,
		sAppTitle: string,
		additionalInformation?: TitleAdditionalInfo
	): Promise<void> {
		// To be overriden by FclController
		await oAppComponent.getShellServices().setTitle(sTitle, additionalInformation);
	}

	getAppContentContainer(): NavContainer | FlexibleColumnLayout {
		const oAppComponent = this.getAppComponent();
		const appContentId = oAppComponent.getManifestEntry("sap.ui5").routing?.config?.controlId ?? "appContent";
		return this.getView().byId(appContentId) as NavContainer | FlexibleColumnLayout;
	}
}
interface RootViewBaseController {
	onContainerReady?(): void;
}

export default RootViewBaseController;

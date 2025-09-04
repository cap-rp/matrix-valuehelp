import Log from "sap/base/Log";
import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import type { FlexibleColumnLayout$AfterEndColumnNavigateEvent, FlexibleColumnLayout$StateChangeEvent } from "sap/f/FlexibleColumnLayout";
import type { ColumnsNavigationActions, NavigationActionsTargets } from "sap/f/FlexibleColumnLayoutSemanticHelper";
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper";
import fLibrary from "sap/f/library";
import { defineUI5Class, usingExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import type PageController from "sap/fe/core/PageController";
import type { NavigationToErrorPageResult } from "sap/fe/core/controllerextensions/MessageHandler";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import type RouterProxy from "sap/fe/core/controllerextensions/routing/RouterProxy";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import { getRouteTargetName } from "sap/fe/core/helpers/ManifestHelper";
import Button from "sap/m/Button";
import FlexBox from "sap/m/FlexBox";
import IllustratedMessage from "sap/m/IllustratedMessage";
import Page from "sap/m/Page";
import type Event from "sap/ui/base/Event";

import type { ManagedObject$ModelContextChangeEventParameters } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type View from "sap/ui/core/mvc/View";
import type Route from "sap/ui/core/routing/Route";
import type { Router$BeforeRouteMatchedEvent, Router$RouteMatchedEvent } from "sap/ui/core/routing/Router";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type { TitleAdditionalInfo } from "sap/ushell/ui5service/ShellUIService";
import CommonUtils from "../CommonUtils";
import type { HiddenDraft } from "../converters/ManifestSettings";
import BaseController from "./RootViewBaseController";

const LayoutType = fLibrary.LayoutType;
type LayoutTypeType = keyof typeof LayoutType;

type DefaultLayouts = {
	1?: LayoutTypeType;
	2?: LayoutTypeType;
	3?: LayoutTypeType;
};

type FCLColumnDistributionState = {
	tablet: { [key in LayoutTypeType]?: string };
	desktop: { [key in LayoutTypeType]?: string };
};

type FCLConfig = {
	maxColumnsCount: number;
	defaultTwoColumnLayoutType?: LayoutTypeType;
	defaultThreeColumnLayoutType?: LayoutTypeType;
	defaultControlAggregation?: string;
};

export type FCLState = {
	columnsDistribution: FCLColumnDistributionState;
	defaultLayouts: DefaultLayouts;
};

/**
 * Base controller class for your own root view with an sap.f.FlexibleColumnLayout control.
 *
 * By using or extending this controller, you can use your own root view with the sap.fe.core.AppComponent and
 * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
 * @hideconstructor
 * @public
 * @since 1.110.0
 */
@defineUI5Class("sap.fe.core.rootView.Fcl")
class FclController extends BaseController {
	@usingExtension(
		ViewState.override({
			applyInitialStateOnly: function () {
				return false;
			},
			adaptBindingRefreshControls: function (this: ViewState, aControls: Promise<View>[]): void {
				(this.getView().getController() as FclController)._getAllVisibleViews().forEach(function (oChildView: View) {
					const pChildView = Promise.resolve(oChildView);
					aControls.push(pChildView);
				});
			},
			adaptStateControls: function (this: ViewState, aStateControls: Promise<View>[]): void {
				(this.getView().getController() as FclController)._getAllVisibleViews().forEach(function (oChildView: View) {
					const pChildView = Promise.resolve(oChildView);
					aStateControls.push(pChildView);
				});
			},
			onRestore: function (this: ViewState) {
				const fclController = this.getView().getController() as FclController;
				const appContentContainer = fclController.getAppContentContainer();
				const internalModel = appContentContainer.getModel("internal") as JSONModel;
				const pages = internalModel.getProperty("/pages");

				for (const componentId in pages) {
					internalModel.setProperty(`/pages/${componentId}/restoreStatus`, "pending");
				}
				fclController.onContainerReady();
			},
			onSuspend: function (this: ViewState) {
				const fclController = this.getView().getController() as FclController;
				const fclControl = fclController.getFclControl();
				const beginColumnPages = fclControl.getBeginColumnPages();
				const midColumnPages = fclControl.getMidColumnPages();
				const endColumnPages = fclControl.getEndColumnPages();
				const pages = ([] as Control[]).concat(beginColumnPages, midColumnPages, endColumnPages);

				fclController.getViewsFromPages(pages).forEach((view) => {
					const controller = view.getController() as PageController | undefined;
					if (controller?.viewState?.onSuspend) {
						controller.viewState.onSuspend();
					}
				});
			}
		})
	)
	viewState!: ViewState;

	protected _oRouterProxy!: RouterProxy;

	private sCurrentRouteName?: string;

	private sCurrentArguments?: { noPreservationCache?: boolean; bIsStickyMode?: boolean; ["?query"]?: { layout?: string } };

	private sPreviousLayout?: keyof typeof LayoutType;

	protected _oFCLConfig!: FCLConfig;

	private oAdditionalViewForNavRowsComputation?: View;

	private _oTargetsAggregation: Record<
		string,
		{
			aggregation: string;
			pattern?: string | null;
		}
	> = {};

	private _oTargetsFromRoutePattern: Record<string, string[] | undefined> = {};

	private messagePages: (Page | undefined)[] = [undefined, undefined, undefined];

	private isWritingFCLState?: Promise<FCLState>;

	onInit(): void {
		super.onInit();
		this._internalInit();
		this.setColumnDistributionModel();
	}

	manageDataReceived(event: Event<{ error: { status: number }; path: string }>): void {
		if (event.getParameter("error")) {
			const path = event.getParameter("path");
			const targetedView = this._getAllVisibleViews().find((view) => view.getBindingContext()?.getPath() === path);
			// We need to manage error when the request is related to a form  into an ObjectPage
			if (path && (targetedView?.getBindingContext() as Context)?.isKeepAlive()) {
				(targetedView!.getController() as PageController)._routing.onDataReceived(event);
			}
		}
	}

	attachRouteMatchers(): void {
		this.getRouter().attachBeforeRouteMatched(this._updateViewForNavigatedRowsComputation, this);
		super.attachRouteMatchers();
		this._internalInit();

		this.getRouter().attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.getFclControl().attachStateChange(this._saveLayout, this);
	}

	_internalInit(): void {
		if (this._oRouterProxy) {
			return; // Already initialized
		}

		this.sCurrentRouteName = "";
		this.sCurrentArguments = {};

		const oAppComponent = this.getAppComponent();

		const oDataModel = this.getAppComponent().getModel();
		oDataModel?.attachEvent("dataReceived", this.manageDataReceived.bind(this));

		this._oRouterProxy = oAppComponent.getRouterProxy();

		// Get FCL configuration in the manifest
		this._oFCLConfig = { maxColumnsCount: 3 };
		const oRoutingConfig = oAppComponent.getManifest()["sap.ui5"].routing;

		if (oRoutingConfig?.config?.flexibleColumnLayout) {
			const oFCLManifestConfig = oRoutingConfig.config.flexibleColumnLayout;

			// Default layout for 2 columns
			if (oFCLManifestConfig.defaultTwoColumnLayoutType) {
				this._oFCLConfig.defaultTwoColumnLayoutType = oFCLManifestConfig.defaultTwoColumnLayoutType;
			}

			// Default layout for 3 columns
			if (oFCLManifestConfig.defaultThreeColumnLayoutType) {
				this._oFCLConfig.defaultThreeColumnLayoutType = oFCLManifestConfig.defaultThreeColumnLayoutType;
			}

			// Limit FCL to 2 columns ?
			if (oFCLManifestConfig.limitFCLToTwoColumns === true) {
				this._oFCLConfig.maxColumnsCount = 2;
			}
		}
		if (oRoutingConfig?.config?.controlAggregation) {
			this._oFCLConfig.defaultControlAggregation = oRoutingConfig.config.controlAggregation;
		}

		this._initializeTargetAggregation(oAppComponent);
		this._initializeRoutesInformation(oAppComponent);

		this.getFclControl().attachStateChange(this.onStateChanged, this);
		this.getFclControl().attachAfterEndColumnNavigate(this.onStateChanged, this);
	}

	getFclControl(): FlexibleColumnLayout {
		return this.getAppContentContainer() as FlexibleColumnLayout;
	}

	getFclConfig(): FCLConfig {
		return this._oFCLConfig;
	}

	_saveLayout(oEvent: FlexibleColumnLayout$StateChangeEvent): void {
		this.sPreviousLayout = oEvent.getParameters().layout;
	}

	/**
	 * Get the additional view (on top of the visible views), to be able to compute the latest table navigated rows of
	 * the most right visible view after a nav back or column fullscreen.
	 *
	 */

	_updateViewForNavigatedRowsComputation(): void {
		const allVisibleViewsBeforeRouteMatched = this._getAllVisibleViews(this.sPreviousLayout);
		const rightMostViewBeforeRouteMatched = allVisibleViewsBeforeRouteMatched.length
			? allVisibleViewsBeforeRouteMatched[allVisibleViewsBeforeRouteMatched.length - 1]
			: undefined;

		this.getRouter().attachEventOnce("routeMatched", (event: Event<{ views: Control[] }>) => {
			const views = event.getParameter("views");
			const rightMostViewCurrent = this.getViewFromContainer(views[views.length - 1]);

			if (rightMostViewBeforeRouteMatched && rightMostViewCurrent) {
				const viewLevelBefore = (rightMostViewBeforeRouteMatched.getViewData() as { viewLevel?: number })?.viewLevel;
				const viewLevelAfter = (rightMostViewCurrent.getViewData() as { viewLevel?: number })?.viewLevel;

				// Navigation forward from L2 to view level L3 (FullScreenLayout):
				if (viewLevelAfter === this._oFCLConfig.maxColumnsCount) {
					this.oAdditionalViewForNavRowsComputation = rightMostViewCurrent;
				}
				// Navigations backward from L3 down to L2, L1, L0 (ThreeColumn layout):
				if (
					viewLevelBefore !== undefined &&
					viewLevelAfter !== undefined &&
					viewLevelBefore < this._oFCLConfig.maxColumnsCount &&
					viewLevelBefore > viewLevelAfter &&
					rightMostViewCurrent !== rightMostViewBeforeRouteMatched
				) {
					this.oAdditionalViewForNavRowsComputation = rightMostViewBeforeRouteMatched;
				}
			}
		});
	}

	getViewForNavigatedRowsComputation(): View | undefined {
		return this.oAdditionalViewForNavRowsComputation;
	}

	onExit(): void {
		this.getRouter().detachRouteMatched(this.onRouteMatched, this);
		this.getRouter().detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
		this.getFclControl().detachStateChange(this.onStateChanged, this);
		this.getFclControl().detachAfterEndColumnNavigate(this.onStateChanged, this);

		BaseController.prototype.onExit.bind(this)();
	}

	/**
	 * Check if the FCL component is enabled.
	 * @returns `true` since we are in FCL scenario
	 * @final
	 */
	isFclEnabled(): this is FclController {
		return true;
	}

	/**
	 * Method that creates a new Page to display the IllustratedMessage containing the current error.
	 * @param errorMessage
	 * @param parameters
	 * @param fclLevel
	 * @returns A promise that creates a Page to display the error
	 */
	async displayErrorPage(errorMessage: string, parameters: NavigationToErrorPageResult, fclLevel = 0): Promise<boolean> {
		return new Promise<boolean>(async (resolve, reject) => {
			try {
				const fclControl = this.getFclControl();

				// Manage the old API where the FCL level was passed in the parameters
				const legacyParameters = parameters as { FCLLevel?: number };
				if (legacyParameters.FCLLevel !== undefined && fclLevel === 0) {
					fclLevel = legacyParameters.FCLLevel;
				}

				if (this._oFCLConfig && fclLevel >= this._oFCLConfig.maxColumnsCount) {
					fclLevel = this._oFCLConfig.maxColumnsCount - 1;
				}
				if (fclLevel < 0 || fclLevel > 2) {
					fclLevel = 0;
				}

				let messagePage = this.messagePages[fclLevel];

				if (!messagePage) {
					messagePage = new Page({
						showHeader: false
					});

					this.messagePages[fclLevel] = messagePage;

					switch (fclLevel) {
						case 0:
							fclControl.addBeginColumnPage(messagePage);
							break;

						case 1:
							fclControl.addMidColumnPage(messagePage);
							break;

						default:
							fclControl.addEndColumnPage(messagePage);
					}
				}

				let fromPage: Control;
				const header = new FlexBox({
					alignItems: "Start",
					justifyContent: "End",
					items: [
						new Button({
							type: "Transparent",
							icon: "sap-icon://decline",
							tooltip: "{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}",
							press: (): void => {
								if (parameters.handleShellBack === true) {
									fclControl.to(fromPage.getId(), {}, {});
								} else {
									window.history.back();
								}
							}
						}).addStyleClass("sapUiLargeMarginEnd")
					]
				});
				const illustratedMessage = new IllustratedMessage({
					title: errorMessage,
					description: parameters.description ?? "",
					illustrationType: parameters.errorType ? `sapIllus-${parameters.errorType}` : "sapIllus-UnableToLoad"
				});
				messagePage.removeAllContent();
				messagePage.addContent(header);
				messagePage.addContent(illustratedMessage);

				let afterNavigateEventName: string;
				switch (fclLevel) {
					case 0:
						fromPage = fclControl.getCurrentBeginColumnPage();
						afterNavigateEventName = "afterBeginColumnNavigate";
						break;

					case 1:
						fromPage = fclControl.getCurrentMidColumnPage();
						afterNavigateEventName = "afterMidColumnNavigate";
						break;

					default:
						fromPage = fclControl.getCurrentEndColumnPage();
						afterNavigateEventName = "afterEndColumnNavigate";
				}

				if (parameters.handleShellBack === true) {
					const oAppComponent = CommonUtils.getAppComponent(fromPage);
					await oAppComponent.getShellServices().setBackNavigation(async function () {
						fclControl.to(fromPage.getId(), {}, {});
						await oAppComponent.getShellServices().setBackNavigation();
					});
				}

				const fromView = this.getViewFromContainer(fromPage);
				fclControl.attachEventOnce(afterNavigateEventName, (_event: Event<{ from: Control }>) => {
					if (fromView && fromView.isA<View>("sap.ui.core.mvc.View")) {
						(fromView.getController() as PageController).pageReady?.forcePageReady();
					}
					resolve(true);
				});

				fclControl.to(messagePage.getId(), {}, {});
			} catch (e) {
				reject(false);
				Log.info(`${e}`);
			}
		});
	}

	/**
	 * Initialize the object _oTargetsAggregation that defines for each route the relevant aggregation and pattern.
	 * @param oAppComponent Reference to the AppComponent
	 */
	_initializeTargetAggregation(oAppComponent: AppComponent): void {
		const oManifest = oAppComponent.getManifest(),
			oTargets = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.targets : null;

		this._oTargetsAggregation = {};

		if (oTargets) {
			Object.keys(oTargets).forEach((sTargetName: string) => {
				const oTarget = oTargets[sTargetName];
				if (oTarget.controlAggregation) {
					this._oTargetsAggregation[sTargetName] = {
						aggregation: oTarget.controlAggregation,
						pattern: oTarget.contextPattern
					};
				} else {
					this._oTargetsAggregation[sTargetName] = {
						aggregation: "page",
						pattern: null
					};
				}
			});
		}
	}

	/**
	 * Initializes the mapping between a route (identifed as its pattern) and the corresponding targets
	 * @param oAppComponent ref to the AppComponent
	 */

	_initializeRoutesInformation(oAppComponent: AppComponent): void {
		const oManifest = oAppComponent.getManifest(),
			aRoutes = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.routes : null;

		this._oTargetsFromRoutePattern = {};

		if (aRoutes) {
			aRoutes.forEach((route) => {
				if (route.pattern) {
					this._oTargetsFromRoutePattern[route.pattern] = route.target as string[];
				}
			});
		}
	}

	getCurrentArgument(): unknown {
		return this.sCurrentArguments;
	}

	getCurrentRouteName(): string | undefined {
		return this.sCurrentRouteName;
	}

	/**
	 * Getter for oTargetsAggregation array.
	 * @returns The _oTargetsAggregation array
	 */
	getTargetAggregation(): Record<
		string,
		{
			aggregation: string;
			pattern?: string | null;
		}
	> {
		return this._oTargetsAggregation;
	}

	/**
	 * Function triggered by the router RouteMatched event.
	 * @param oEvent
	 */
	onRouteMatched(oEvent: Router$RouteMatchedEvent): void {
		const sRouteName = oEvent.getParameter("name");

		// Save the current/previous routes and arguments
		this.sCurrentRouteName = sRouteName;
		this.sCurrentArguments = oEvent.getParameter("arguments");
	}

	/**
	 * This function is triggering the table scroll to the navigated row after each layout change.
	 *
	 */

	_scrollTablesToLastNavigatedItems(): void {
		const aViews = this._getAllVisibleViews();
		//The scrolls are triggered only if the layout is with several columns or when switching the mostRight column in full screen
		if (
			aViews.length > 1 ||
			(aViews.length && (aViews[0].getViewData() as { viewLevel: number }).viewLevel < this._oFCLConfig.maxColumnsCount)
		) {
			const oAdditionalView = this.getViewForNavigatedRowsComputation();
			if (oAdditionalView && !aViews.includes(oAdditionalView)) {
				aViews.push(oAdditionalView);
			}
			for (let index = aViews.length - 1; index > 0; index--) {
				const oView = aViews[index],
					oPreviousView = aViews[index - 1];
				const bindingContext = oView.getBindingContext();
				const previousViewController = oPreviousView.getController() as { _scrollTablesToRow?: Function };
				if (bindingContext && previousViewController._scrollTablesToRow) {
					previousViewController._scrollTablesToRow(bindingContext.getPath());
				}
			}
		}
	}

	/**
	 * Function triggered by the FCL StateChanged event.
	 * @param oEvent
	 */
	onStateChanged(oEvent: FlexibleColumnLayout$StateChangeEvent | FlexibleColumnLayout$AfterEndColumnNavigateEvent): void {
		const bIsNavigationArrow = (oEvent as FlexibleColumnLayout$StateChangeEvent).getParameter("isNavigationArrow");
		if (this.sCurrentArguments !== undefined) {
			if (!this.sCurrentArguments["?query"]) {
				this.sCurrentArguments["?query"] = {};
			}
			this.sCurrentArguments["?query"].layout = (oEvent as FlexibleColumnLayout$StateChangeEvent).getParameter("layout");
		}
		this._forceModelContextChangeOnBreadCrumbs(oEvent);

		// Replace the URL with the new layout if a navigation arrow was used
		if (bIsNavigationArrow && this.sCurrentRouteName) {
			this._oRouterProxy.navTo(this.sCurrentRouteName, this.sCurrentArguments);
		}

		const oView = this.getRightmostView();
		if (oView) {
			this.computeTitleHierarchy(oView);
		}
	}

	/**
	 * Function to fire ModelContextChange event on all breadcrumbs ( on each ObjectPages).
	 * @param oEvent
	 */
	_forceModelContextChangeOnBreadCrumbs(oEvent: Event<ManagedObject$ModelContextChangeEventParameters, FlexibleColumnLayout>): void {
		//force modelcontextchange on ObjectPages to refresh the breadcrumbs link hrefs
		const oFcl = oEvent.getSource();
		let oPages: Control[] = [];
		oPages = oPages.concat(oFcl.getBeginColumnPages()).concat(oFcl.getMidColumnPages()).concat(oFcl.getEndColumnPages());
		oPages.forEach((oPage) => {
			const oView = this.getViewFromContainer(oPage);
			const oBreadCrumbs = oView?.byId && oView.byId("breadcrumbs");
			if (oBreadCrumbs) {
				oBreadCrumbs.fireModelContextChange();
			}
		});
	}

	/**
	 * Function triggered to update the Share button Visibility.
	 * @param viewColumn Name of the current column ("beginColumn", "midColumn", "endColumn")
	 * @param sLayout The current layout used by the FCL
	 * @returns The share button visibility
	 */
	_updateShareButtonVisibility(viewColumn: string, sLayout: string): boolean {
		let bShowShareIcon;
		switch (sLayout) {
			case "OneColumn":
				bShowShareIcon = viewColumn === "beginColumn";
				break;
			case "MidColumnFullScreen":
			case "ThreeColumnsBeginExpandedEndHidden":
			case "ThreeColumnsMidExpandedEndHidden":
			case "TwoColumnsBeginExpanded":
			case "TwoColumnsMidExpanded":
				bShowShareIcon = viewColumn === "midColumn";
				break;
			case "EndColumnFullScreen":
			case "ThreeColumnsEndExpanded":
			case "ThreeColumnsMidExpanded":
				bShowShareIcon = viewColumn === "endColumn";
				break;
			default:
				bShowShareIcon = false;
		}
		return bShowShareIcon;
	}

	_updateEditButtonVisiblity(viewColumn: string, sLayout: string): boolean {
		const hiddenDraft = (this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft as HiddenDraft)?.enabled;
		let bEditButtonVisible = true;
		switch (viewColumn) {
			case "midColumn":
				switch (sLayout) {
					case "TwoColumnsMidExpanded":
					case "ThreeColumnsMidExpandedEndHidden":
					case "ThreeColumnsBeginExpandedEndHidden":
					case "TwoColumnsBeginExpanded":
						if (!hiddenDraft) {
							bEditButtonVisible = false;
						}
						break;
					case "ThreeColumnsMidExpanded":
					case "ThreeColumnsEndExpanded":
						bEditButtonVisible = false;
						break;
				}
				break;
			case "endColumn":
				switch (sLayout) {
					case "ThreeColumnsMidExpanded":
					case "ThreeColumnsEndExpanded":
						if (!hiddenDraft) {
							bEditButtonVisible = false;
						}
						break;
				}
				break;
		}
		return bEditButtonVisible;
	}

	_updateSaveAndCancelButtonVisiblity(viewColumn: string, sLayout: string): boolean {
		const hiddenDraft = (this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft as HiddenDraft)?.enabled;
		let bSaveAndCancelButtonVisible = true;
		switch (viewColumn) {
			case "midColumn":
				switch (sLayout) {
					case "ThreeColumnsEndExpanded":
					case "ThreeColumnsMidExpanded":
						if (hiddenDraft) {
							bSaveAndCancelButtonVisible = false;
						}
						break;
				}
				break;
		}
		return bSaveAndCancelButtonVisible;
	}

	updateUIStateForView(oView: FEView, FCLLevel: number): void {
		const oUIState = this.getHelper().getCurrentUIState(),
			oFclColName = ["beginColumn", "midColumn", "endColumn"],
			sLayout = this.getFclControl().getLayout();
		let viewColumn;

		if (!oView.getModel("fclhelper")) {
			oView.setModel(this._createHelperModel(), "fclhelper");
		}
		if (!oUIState.actionButtonsInfo) {
			oUIState.actionButtonsInfo = {};
		}
		if (!oUIState.actionButtonsInfo.midColumn) {
			oUIState.actionButtonsInfo.midColumn = {};
		}
		if (!oUIState.actionButtonsInfo.endColumn) {
			oUIState.actionButtonsInfo.endColumn = {};
		}
		if (FCLLevel >= this._oFCLConfig.maxColumnsCount) {
			// The view is on a level > max number of columns. It's always fullscreen without close/exit buttons
			viewColumn = oFclColName[this._oFCLConfig.maxColumnsCount - 1];

			oUIState.actionButtonsInfo.midColumn.fullScreen = null;
			oUIState.actionButtonsInfo.midColumn.exitFullScreen = null;
			oUIState.actionButtonsInfo.midColumn.closeColumn = null;
			oUIState.actionButtonsInfo.endColumn.exitFullScreen = null;
			oUIState.actionButtonsInfo.endColumn.fullScreen = null;
			oUIState.actionButtonsInfo.endColumn.closeColumn = null;
		} else {
			viewColumn = oFclColName[FCLLevel];
		}

		if (
			FCLLevel >= this._oFCLConfig.maxColumnsCount ||
			sLayout === "EndColumnFullScreen" ||
			sLayout === "MidColumnFullScreen" ||
			sLayout === "OneColumn"
		) {
			oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", true);
		} else {
			oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", false);
		}
		// Unfortunately, the FCLHelper doesn't provide actionButton values for the first column
		// so we have to add this info manually
		(oUIState.actionButtonsInfo as { beginColumn?: object }).beginColumn = {
			fullScreen: null,
			exitFullScreen: null,
			closeColumn: null
		};

		const oActionButtonInfos: NavigationActionsTargets & {
			switchVisible?: boolean;
			switchIcon?: string;
			isFullScreen?: boolean;
			closeVisible?: boolean;
		} = Object.assign({}, oUIState.actionButtonsInfo[viewColumn as keyof ColumnsNavigationActions]);
		oActionButtonInfos.switchVisible = oActionButtonInfos.fullScreen !== null || oActionButtonInfos.exitFullScreen !== null;
		oActionButtonInfos.switchIcon = oActionButtonInfos.fullScreen !== null ? "sap-icon://full-screen" : "sap-icon://exit-full-screen";
		oActionButtonInfos.isFullScreen = oActionButtonInfos.fullScreen === null;
		oActionButtonInfos.closeVisible = oActionButtonInfos.closeColumn !== null;

		oView.getModel("fclhelper").setProperty("/actionButtonsInfo", oActionButtonInfos);

		oView.getModel("fclhelper").setProperty("/showEditButton", this._updateEditButtonVisiblity(viewColumn, sLayout));

		oView.getModel("fclhelper").setProperty("/showSaveAndCancelButton", this._updateSaveAndCancelButtonVisiblity(viewColumn, sLayout));

		oView.getModel("fclhelper").setProperty("/showShareIcon", this._updateShareButtonVisibility(viewColumn, sLayout));
	}

	/**
	 * Function triggered by the router BeforeRouteMatched event.
	 * @param oEvent
	 */
	async onBeforeRouteMatched(oEvent: Router$BeforeRouteMatchedEvent): Promise<void> {
		if (oEvent) {
			const oQueryParams = (oEvent.getParameters().arguments! as Record<string, { layout: LayoutTypeType }>)["?query"];
			let sLayout = oQueryParams ? oQueryParams.layout : undefined;

			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				const oNextUIState = this.getHelper().getNextUIState(0);
				sLayout = oNextUIState.layout as LayoutTypeType | undefined;
			}

			// Check if the layout if compatible with the number of targets
			// This should always be the case for normal navigation, just needed in case
			// the URL has been manually modified
			const aTargets = (oEvent.getParameter("config") as { target?: string[] })?.target;
			sLayout = this._correctLayoutForTargets(sLayout!, aTargets);
			// we store a first time the layout for the updateUIStateForView to be done with the correct number of columns : SNOW DINC0449277
			if (sLayout) {
				this.getFclControl().setLayout(sLayout);
			}
			await this.isWritingFCLState;
			sLayout = await this.getStoredLayout(sLayout);

			// Update the layout of the FlexibleColumnLayout.
			if (sLayout) {
				this.getFclControl().setLayout(sLayout);
			}
		}
	}

	/**
	 * Helper for the FCL Component.
	 * @returns Instance of a semantic helper
	 */
	getHelper(): FlexibleColumnLayoutSemanticHelper {
		return FlexibleColumnLayoutSemanticHelper.getInstanceFor(this.getFclControl(), this._oFCLConfig);
	}

	/**
	 * Calculates the FCL layout for a given FCL level and a target hash.
	 * @param iNextFCLLevel FCL level to be navigated to
	 * @param sHash The hash to be navigated to
	 * @param sProposedLayout The proposed layout
	 * @param keepCurrentLayout True if we want to keep the current layout if possible
	 * @returns The calculated layout
	 */
	calculateLayout(iNextFCLLevel: number, sHash: string, sProposedLayout: LayoutTypeType | undefined, keepCurrentLayout = false): string {
		// First, ask the FCL helper to calculate the layout if nothing is proposed
		if (!sProposedLayout) {
			sProposedLayout = (
				keepCurrentLayout ? this.getFclControl().getLayout() : this.getHelper().getNextUIState(iNextFCLLevel).layout
			) as LayoutTypeType | undefined;
		}

		// Then change this value if necessary, based on the number of targets
		const oRoute = (this.getRouter() as { getRouteByHash?: (hash: string) => Route }).getRouteByHash?.(
			`${sHash}?layout=${sProposedLayout}`
		);
		const aTargets = this._oTargetsFromRoutePattern[oRoute!.getPattern()];

		return this._correctLayoutForTargets(sProposedLayout!, aTargets);
	}

	/**
	 * Checks whether a given FCL layout is compatible with an array of targets.
	 * @param sProposedLayout Proposed value for the FCL layout
	 * @param aTargets Array of target names used for checking
	 * @returns The corrected layout
	 */
	_correctLayoutForTargets(sProposedLayout: LayoutTypeType, aTargets: string[] | undefined): LayoutTypeType {
		const allAllowedLayouts = {
			"2": ["TwoColumnsMidExpanded", "TwoColumnsBeginExpanded", "MidColumnFullScreen"],
			"3": [
				"ThreeColumnsMidExpanded",
				"ThreeColumnsEndExpanded",
				"ThreeColumnsMidExpandedEndHidden",
				"ThreeColumnsBeginExpandedEndHidden",
				"MidColumnFullScreen",
				"EndColumnFullScreen"
			]
		};

		if (aTargets && !Array.isArray(aTargets)) {
			// To support single target as a string in the manifest
			aTargets = [aTargets];
		}

		if (!aTargets) {
			// Defensive, just in case...
			return sProposedLayout;
		} else if (aTargets.length > 1) {
			// More than 1 target: just simply check from the allowed values
			const aLayouts = allAllowedLayouts[aTargets.length.toString() as "2" | "3"] as LayoutTypeType[];
			if (!aLayouts.includes(sProposedLayout)) {
				// The proposed layout isn't compatible with the number of columns
				// --> Ask the helper for the default layout for the number of columns
				const defaultLayout = this._getDefaultLayout(aTargets.length);
				sProposedLayout = defaultLayout && aLayouts.includes(defaultLayout) ? defaultLayout : aLayouts[0];
			}
		} else {
			// Only one target
			const sTargetAggregation =
				this.getTargetAggregation()[getRouteTargetName(aTargets[0])].aggregation || this._oFCLConfig.defaultControlAggregation;
			switch (sTargetAggregation) {
				case "beginColumnPages":
					sProposedLayout = LayoutType.OneColumn;
					break;
				case "midColumnPages":
					sProposedLayout = LayoutType.MidColumnFullScreen;
					break;
				case "endColumnPages":
					sProposedLayout = LayoutType.EndColumnFullScreen;
					break;
				default:
					break;
				// no default
			}
		}

		return sProposedLayout;
	}

	/**
	 * Gets default Layout for number of columns.
	 * @param numberOfTargetsFromRoute
	 * @returns An FCL Layout based on the manifest configuration if it is defined.
	 */
	_getDefaultLayout(numberOfTargetsFromRoute: number): LayoutTypeType | undefined {
		switch (numberOfTargetsFromRoute) {
			case 3:
				return this._oFCLConfig.defaultTwoColumnLayoutType;
			case 2:
				return this._oFCLConfig.defaultTwoColumnLayoutType;
			default:
				return undefined;
		}
	}

	/**
	 * Gets the instanced views in the FCL component.
	 * @returns Return the instanced views.
	 */
	getInstancedViews(): View[] {
		const fclControl = this.getFclControl();
		const componentContainers: Control[] = [
			...fclControl.getBeginColumnPages(),
			...fclControl.getMidColumnPages(),
			...fclControl.getEndColumnPages()
		];
		return this.getViewsFromPages(componentContainers);
	}

	/**
	 * Gets the current visible pages.
	 * @returns Return the visible views.
	 */
	getVisibleViews(): View[] {
		return this._getAllVisibleViews();
	}

	/**
	 * Get all visible views in the FCL component.
	 * @param forLayout  Optional parameter is very specific as part of the calculation of the latest navigated row
	 * @returns Array of all visible views
	 */
	_getAllVisibleViews(forLayout?: string): View[] {
		const visibleViews: View[] = [];
		const layout = forLayout ? forLayout : this.getFclControl().getLayout();
		const addView = (page: Control | undefined): void => {
			if (page) {
				const view = this.getViewFromContainer(page);
				if (view) {
					visibleViews.push(view);
				}
			}
		};

		switch (layout) {
			case LayoutType.EndColumnFullScreen:
				addView(this.getFclControl().getCurrentEndColumnPage());
				break;

			case LayoutType.MidColumnFullScreen:
				addView(this.getFclControl().getCurrentMidColumnPage());
				break;

			case LayoutType.OneColumn:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				break;

			case LayoutType.ThreeColumnsEndExpanded:
			case LayoutType.ThreeColumnsMidExpanded:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				addView(this.getFclControl().getCurrentMidColumnPage());
				addView(this.getFclControl().getCurrentEndColumnPage());
				break;

			case LayoutType.TwoColumnsBeginExpanded:
			case LayoutType.TwoColumnsMidExpanded:
			case LayoutType.ThreeColumnsMidExpandedEndHidden:
			case LayoutType.ThreeColumnsBeginExpandedEndHidden:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				addView(this.getFclControl().getCurrentMidColumnPage());
				break;

			default:
				Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
		}

		return visibleViews;
	}

	_getAllViews(forLayout?: string): View[] {
		const allViews: View[] = [];
		const layout = forLayout ? forLayout : this.getFclControl().getLayout();

		const addView = (page: Control | undefined): void => {
			if (page) {
				const view = this.getViewFromContainer(page);
				if (view) {
					allViews.push(view);
				}
			}
		};

		switch (layout) {
			case LayoutType.OneColumn:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				break;
			case LayoutType.ThreeColumnsEndExpanded:
			case LayoutType.ThreeColumnsMidExpanded:
			case LayoutType.ThreeColumnsMidExpandedEndHidden:
			case LayoutType.ThreeColumnsBeginExpandedEndHidden:
			case LayoutType.EndColumnFullScreen:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				addView(this.getFclControl().getCurrentMidColumnPage());
				addView(this.getFclControl().getCurrentEndColumnPage());
				break;

			case LayoutType.TwoColumnsBeginExpanded:
			case LayoutType.TwoColumnsMidExpanded:
				addView(this.getFclControl().getCurrentBeginColumnPage());
				addView(this.getFclControl().getCurrentMidColumnPage());
				break;

			case LayoutType.MidColumnFullScreen:
				// In this case we need to determine if this mid column fullscreen comes from a 2 or a 3 column layout
				{
					const layoutWhenExitFullScreen =
						this.getHelper().getCurrentUIState().actionButtonsInfo?.midColumn?.exitFullScreen ?? "";
					addView(this.getFclControl().getCurrentBeginColumnPage());
					addView(this.getFclControl().getCurrentMidColumnPage());
					if (layoutWhenExitFullScreen.startsWith("ThreeColumn")) {
						// We come from a 3 column layout
						addView(this.getFclControl().getCurrentEndColumnPage());
					}
				}
				break;

			default:
				Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
		}
		return allViews;
	}

	async onContainerReady(): Promise<void[]> {
		// Restore views if neccessary.
		const aViews = this._getAllVisibleViews();
		const aRestorePromises: Promise<void>[] = aViews.reduce(function (aPromises: Promise<void>[], oTargetView: View) {
			if (oTargetView.isA && oTargetView.isA("sap.ui.core.mvc.View")) {
				aPromises.push(KeepAliveHelper.restoreView(oTargetView as FEView));
			}

			return aPromises;
		}, []);
		return Promise.all(aRestorePromises);
	}

	getRightmostContext(): Context | undefined {
		return this.getRightmostView()?.getBindingContext() ?? undefined;
	}

	getRightmostView(): FEView {
		return this._getAllViews().pop() as FEView;
	}

	isContextUsedInPages(oContext: Context): boolean {
		if (!this.getFclControl()) {
			return false;
		}
		const aAllVisibleViews = this._getAllViews();
		for (const view of aAllVisibleViews) {
			if (view) {
				if (view.getBindingContext() === oContext) {
					return true;
				}
			} else {
				// A view has been destroyed --> app is currently being destroyed
				return false;
			}
		}
		return false;
	}

	async _setShellMenuTitle(
		oAppComponent: AppComponent,
		sTitle: string,
		sAppTitle: string,
		browerTitle?: TitleAdditionalInfo
	): Promise<void> {
		if (this.getHelper().getCurrentUIState().isFullScreen !== true) {
			await oAppComponent.getShellServices().setTitle(sAppTitle, browerTitle);
		} else {
			await oAppComponent.getShellServices().setTitle(sTitle, browerTitle);
		}
	}

	/**
	 * This method is called to retieve the FCL state from the personalization service.
	 * @returns The FCL state
	 */
	async getFCLPersonalizationData(): Promise<FCLState> {
		const shellServices = this.getAppComponent()?.getShellServices();
		const emptyFCLState = {
			defaultLayouts: {},
			columnsDistribution: {
				desktop: {},
				tablet: {}
			}
		};
		return ((await shellServices.getApplicationPersonalizationData("FCL-Personalization")) ?? emptyFCLState) as FCLState;
	}

	/**
	 * This method is called to set the FCL state in the personalization service.
	 * @param fclState The FCL state
	 */
	setFCLPersonalizationData(fclState: FCLState): void {
		const shellServices = this.getAppComponent()?.getShellServices();
		shellServices.setApplicationPersonalizationData("FCL-Personalization", fclState);
	}

	/**
	 * This method requests the FCL state from the personalization service and sets the model accordingly.
	 */
	private async setColumnDistributionModel(): Promise<void> {
		const columnsDistribution = (await this.getFCLPersonalizationData()).columnsDistribution;
		if (columnsDistribution) {
			const model = this.getView().getModel("internal");
			model.setProperty("/FCLColumnsDistribution", columnsDistribution);
		}
	}

	/**
	 * This method is called when the user changes the columns distribution in the FCL settings dialog.
	 * It updates the FCL state in the personalization service.
	 * @param event
	 */
	private async onColumnsDistributionChange(
		event: Event<{ media: "tablet" | "desktop"; layout: LayoutTypeType; columnsSizes: string }>
	): Promise<void> {
		const { media, layout, columnsSizes } = event.getParameters();
		const model = this.getView().getModel("internal");
		model.setProperty(`/FCLColumnsDistribution/${media}/${layout}`, columnsSizes);
		this.isWritingFCLState = this.getFCLPersonalizationData();
		const fclState = await this.isWritingFCLState;
		const nbColumnsDisplayed = this.getNumberOfColumnsFromLayout(layout);
		if (nbColumnsDisplayed) {
			fclState.defaultLayouts[nbColumnsDisplayed] = layout;
			fclState.columnsDistribution[media][layout] = columnsSizes;
			this.setFCLPersonalizationData(fclState);
		}
		this.isWritingFCLState = undefined;
		return;
	}

	/**
	 * This method returns the number of columns displayed in the FCL based on the layout.
	 * @param layout  The layout
	 * @returns The number of columns displayed
	 */
	private getNumberOfColumnsFromLayout(layout: LayoutTypeType): 1 | 2 | 3 | null {
		const nbColumnsDisplayed = /^(One|Two|Three)Column/.exec(layout)?.[1] as "One" | "Two" | "Three";
		switch (nbColumnsDisplayed) {
			case "One":
				return 1;
			case "Two":
				return 2;
			case "Three":
				return 3;
			default:
				return null;
		}
	}

	/**
	 * This method returns the layout stored in the personalization service based on the proposed layout.
	 * @param proposedLayout
	 * @returns The FCL layout stored in the personalization service
	 */
	async getStoredLayout(proposedLayout?: LayoutTypeType): Promise<LayoutTypeType | undefined> {
		const layout = proposedLayout ?? (this.getFclControl().getLayout() as LayoutTypeType);
		const nbColumnsDisplayed = this.getNumberOfColumnsFromLayout(layout);
		if (nbColumnsDisplayed) {
			const defaultLayouts = (await this.getFCLPersonalizationData()).defaultLayouts;
			return defaultLayouts?.[nbColumnsDisplayed] ?? layout;
		}
		return layout;
	}
}

export default FclController;

import Log from "sap/base/Log";
import { defineUI5Class, usingExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type { NavigationToErrorPageResult } from "sap/fe/core/controllerextensions/MessageHandler";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import IllustratedMessage from "sap/m/IllustratedMessage";
import type NavContainer from "sap/m/NavContainer";
import Page from "sap/m/Page";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type View from "sap/ui/core/mvc/View";
import type JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./RootViewBaseController";

/**
 * Base controller class for your own root view with a sap.m.NavContainer control.
 *
 * By using or extending this controller you can use your own root view with the sap.fe.core.AppComponent and
 * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
 * @hideconstructor
 * @public
 * @since 1.108.0
 */
@defineUI5Class("sap.fe.core.rootView.NavContainer")
class NavContainerController extends BaseController {
	@usingExtension(
		ViewState.override({
			applyInitialStateOnly: function () {
				return false;
			},
			adaptBindingRefreshControls: function (this: ViewState, aControls: Promise<FEView | undefined>[]): void {
				const oView = this.getView(),
					oController = oView.getController() as NavContainerController;
				aControls.push(oController._getCurrentPage(oView));
			},
			adaptStateControls: function (this: ViewState, aStateControls: Promise<FEView | undefined>[]) {
				const oView = this.getView(),
					oController = oView.getController() as NavContainerController;
				aStateControls.push(oController._getCurrentPage(oView));
			},
			onRestore: function (this: ViewState) {
				const oView = this.getView(),
					oController = oView.getController() as NavContainerController,
					oNavContainer = oController.getAppContentContainer();
				const oInternalModel = oNavContainer.getModel("internal") as JSONModel;
				const oPages = oInternalModel.getProperty("/pages");

				for (const sComponentId in oPages) {
					oInternalModel.setProperty(`/pages/${sComponentId}/restoreStatus`, "pending");
				}
				oController.onContainerReady();
			},
			onSuspend: function (this: ViewState) {
				const oView = this.getView(),
					oNavController = oView.getController() as NavContainerController,
					oNavContainer = oNavController.getAppContentContainer() as NavContainer;
				const aPages = oNavContainer.getPages();
				aPages.forEach(function (oPage: Control) {
					const oTargetView = CommonUtils.getTargetView(oPage);

					const oController = oTargetView && oTargetView.getController();
					if (oController && oController.viewState && oController.viewState.onSuspend) {
						oController.viewState.onSuspend();
					}
				});
			}
		})
	)
	viewState!: ViewState;

	messagePage?: Page;

	async onContainerReady(): Promise<void> {
		// Restore views if neccessary.
		const oView = this.getView(),
			oPagePromise = this._getCurrentPage(oView);

		return oPagePromise.then(async function (oCurrentPage) {
			if (oCurrentPage) {
				const oTargetView = CommonUtils.getTargetView(oCurrentPage);
				return KeepAliveHelper.restoreView(oTargetView);
			}
			return;
		});
	}

	async _getCurrentPage(this: NavContainerController, oView: View): Promise<FEView | undefined> {
		const oNavContainer = this.getAppContentContainer() as NavContainer;
		return new Promise(function (resolve: (value: FEView | undefined) => void) {
			const oCurrentPage = oNavContainer.getCurrentPage() as FEView;
			if ((oCurrentPage?.getController?.() as { isPlaceholder?: Function })?.isPlaceholder?.()) {
				oCurrentPage
					.getController()
					.attachEventOnce("targetPageInsertedInContainer", function (oEvent: UI5Event<{ targetpage: Page }>) {
						const oTargetPage = oEvent.getParameter("targetpage");
						const oTargetView = CommonUtils.getTargetView(oTargetPage);
						resolve(oTargetView !== oView ? oTargetView : undefined);
					});
			} else {
				const oTargetView = CommonUtils.getTargetView(oCurrentPage);
				resolve(oTargetView !== oView ? oTargetView : undefined);
			}
		});
	}

	_getNavContainer(): NavContainer {
		return this.getAppContentContainer() as NavContainer;
	}

	/**
	 * Gets the instanced views in the navContainer component.
	 * @returns Return the views.
	 */
	getInstancedViews(): View[] {
		const navContainer = this._getNavContainer();
		const pages = navContainer.getPages();
		return this.getViewsFromPages(pages);
	}

	/**
	 * Gets the current visible page.
	 * @returns Return the view.
	 */
	getVisibleViews(): View[] {
		const navContainer = this._getNavContainer();
		const pages = [navContainer.getCurrentPage()];
		return this.getViewsFromPages(pages);
	}

	/**
	 * Check if the FCL component is enabled.
	 * @returns `false` since we are not in FCL scenario
	 * @final
	 */
	isFclEnabled(): boolean {
		return false;
	}

	_scrollTablesToLastNavigatedItems(): void {
		// Do nothing
	}

	/**
	 * Method that creates a new Page to display the IllustratedMessage containing the current error.
	 * @param errorMessage
	 * @param parameters
	 * @param _FCLLevel
	 * @returns A promise that creates a Page to display the error
	 */
	async displayErrorPage(errorMessage: string, parameters: NavigationToErrorPageResult, _FCLLevel = 0): Promise<boolean> {
		return new Promise<boolean>(async (resolve, reject) => {
			try {
				const oNavContainer = this._getNavContainer();

				if (!this.messagePage) {
					this.messagePage = new Page({
						showHeader: false
					});

					oNavContainer.addPage(this.messagePage);
				}

				const illustratedMessage = new IllustratedMessage({
					title: errorMessage,
					description: parameters.description ?? "",
					illustrationType: parameters.errorType ? `sapIllus-${parameters.errorType}` : "sapIllus-UnableToLoad"
				});
				this.messagePage.removeAllContent();
				this.messagePage.addContent(illustratedMessage);

				const fromPage = oNavContainer.getCurrentPage();
				if (parameters.handleShellBack === true) {
					const oAppComponent = CommonUtils.getAppComponent(fromPage);
					await oAppComponent.getShellServices().setBackNavigation(async function () {
						oNavContainer.to(fromPage.getId());
						await oAppComponent.getShellServices().setBackNavigation();
					});
				}

				const fromView = this.getViewFromContainer(fromPage);
				oNavContainer.attachEventOnce("afterNavigate", () => {
					if (fromView && fromView.isA<View>("sap.ui.core.mvc.View")) {
						(fromView.getController() as PageController).pageReady?.forcePageReady();
					}
					resolve(true);
				});
				oNavContainer.to(this.messagePage.getId());
			} catch (e) {
				reject(false);
				Log.info(e as string);
			}
		});
	}
}

export default NavContainerController;

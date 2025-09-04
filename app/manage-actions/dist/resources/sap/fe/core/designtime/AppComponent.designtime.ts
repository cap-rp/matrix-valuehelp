import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import type NavContainer from "sap/m/NavContainer";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type AppComponent from "../AppComponent";
import type { VersionActivated } from "../AppStateHandler";
import AppStateHandler from "../AppStateHandler";
import type ExtensionAPI from "../ExtensionAPI";
import type PageController from "../PageController";

const urlParams = new URLSearchParams(window.location.search);
const fioriToolsRtaMode: boolean = urlParams.get("fiori-tools-rta-mode")?.toLowerCase() === "true";

const getAllowList = function (element: ManagedObject): Record<string, boolean> {
	let allowList: Record<string, boolean> = {};
	const elementName = element.getMetadata().getName();
	if (fioriToolsRtaMode) {
		// build the allow list for Fiori tools (developers)
		allowList = {
			"sap.fe.macros.controls.FilterBar": true,
			"sap.ui.fl.variants.VariantManagement": true,
			"sap.ui.mdc.Table": true
		};
	} else {
		// build the allow list for UI Adaptation (key users)
		allowList = {
			"sap.fe.macros.controls.FilterBar": true,
			"sap.fe.templates.ObjectPage.controls.StashableHBox": true,
			"sap.fe.templates.ObjectPage.controls.StashableVBox": true,
			"sap.m.IconTabBar": true,
			"sap.ui.fl.util.IFrame": true,
			"sap.ui.fl.variants.VariantManagement": true,
			"sap.ui.layout.form.Form": true,
			"sap.ui.layout.form.FormContainer": true,
			"sap.ui.layout.form.FormElement": true,
			"sap.ui.mdc.Table": true,
			"sap.uxap.AnchorBar": true,
			"sap.m.IconTabHeader": true,
			"sap.uxap.ObjectPageLayout": true,
			"sap.fe.macros.controls.Section": true,
			"sap.fe.macros.controls.section.SubSection": true,
			"sap.uxap.ObjectPageSection": true,
			"sap.uxap.ObjectPageSubSection": true,
			"sap.f.DynamicPage": true,
			"sap.uxap.ObjectPageDynamicHeaderTitle": true,
			"sap.m.OverflowToolbar": true,
			"sap.m.ToggleButton": true,
			"sap.m.Button": true,
			"sap.m.MenuButton": true,
			"sap.ui.mdc.actiontoolbar.ActionToolbarAction": true,
			"sap.ui.mdc.ActionToolbar": true,
			"sap.f.DynamicPageTitle": true
		};
		// currently we support the adaptation of IconTabfilter only for the IconTabHeader on Object Page (adaptation of sections and subsections)
		if (elementName === "sap.m.IconTabFilter" && element.getParent()?.getMetadata().getName() === "sap.m.IconTabHeader") {
			allowList["sap.m.IconTabFilter"] = true;
		}
		if (elementName === "sap.m.FlexBox" && element.getId().includes("--fe::HeaderContentContainer")) {
			allowList["sap.m.FlexBox"] = true;
		}
	}
	return allowList;
};

/**
 * Retrieves the Extension API for the current page from the provided app component.
 * If the current view or controller does not provide an Extension API, the function will either return `undefined` or throw an error.
 * @param appComponent An instance of the app component or page controller from which to retrieve the Extension API.
 * @returns The Extension API for the current page, or `undefined` if it cannot be retrieved.
 * @throws {Error} If the controller does not expose the `getExtensionAPI` method.
 */
export function getExtensionAPI(appComponent: PageController | AppComponent): ExtensionAPI | undefined {
	if (appComponent) {
		const rootViewController = (appComponent as AppComponent).getRootViewController();

		const appContentContainer = rootViewController.getAppContentContainer();
		if (appContentContainer?.isA<NavContainer>("sap.m.NavContainer")) {
			const currentPage = appContentContainer.getCurrentPage();

			const currentView = rootViewController.getViewFromContainer(currentPage);
			if (!currentView) return undefined;

			const controller = currentView.getController() as PageController;
			if (controller.getExtensionAPI) {
				return controller.getExtensionAPI();
			}
		} else if (appContentContainer?.isA<FlexibleColumnLayout>("sap.f.FlexibleColumnLayout")) {
			const currentPage = appContentContainer.getCurrentBeginColumnPage();

			const currentView = rootViewController.getViewFromContainer(currentPage);
			if (!currentView) return undefined;

			const controller = currentView.getController() as PageController;
			if (controller.getExtensionAPI) {
				return controller.getExtensionAPI();
			}
		}
	}

	// To handle cases where `appComponent` is undefined, you may explicitly return undefined.
	return undefined;
}

// To enable all actions, remove the propagateMetadata function. Or, remove this file and its entry in AppComponent.js referring 'designTime'.
const AppComponentDesignTime = {
	actions: "not-adaptable",
	aggregations: {
		rootControl: {
			actions: "not-adaptable",
			propagateMetadata: function (element: ManagedObject): { actions?: string } {
				const allowList = getAllowList(element);
				if (allowList[element.getMetadata().getName()]) {
					// by returning the empty object, the same will be merged with element's native designtime definition, i.e. all actions will be enabled for this element
					return {};
				} else {
					// not-adaptable will be interpreted by flex to disable all actions for this element
					return {
						actions: "not-adaptable"
					};
				}
			}
		}
	},
	tool: {
		start: function (appComponent: AppComponent): void {
			appComponent.setAdaptationMode(true);
			appComponent.getEnvironmentCapabilities().setCapability("AppState", false);
		},
		stop: function (appComponent: AppComponent, versionWasActivated: VersionActivated): void {
			appComponent.setAdaptationMode(false);
			appComponent.getEnvironmentCapabilities().setCapability("AppState", true);

			AppStateHandler.setRTAVersionWasActivated(appComponent.getId(), versionWasActivated?.versionWasActivated ?? false);
			// Access the extension API and call updateAppState()
			const extensionAPI = getExtensionAPI(appComponent);
			extensionAPI?.updateAppState();
		}
	}
};

export default AppComponentDesignTime;

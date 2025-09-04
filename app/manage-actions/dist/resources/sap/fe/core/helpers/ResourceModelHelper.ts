import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type AppComponent from "sap/fe/core/AppComponent";
import type PageController from "sap/fe/core/PageController";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import type Controller from "sap/ui/core/mvc/Controller";
import type ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import type View from "sap/ui/core/mvc/View";

/**
 * Determines the resource model for a given control, view, controller or appComponent.
 * @param scope The control, view, controller or appComponent for which the resource model should be determined.
 * @returns The resource model
 */
export function getResourceModel(
	scope: Control | AppComponent | TemplateComponent | Controller | ControllerExtension | View
): ResourceModel {
	if (scope.isA<Controller>("sap.ui.core.mvc.Controller") || scope.isA<ControllerExtension>("sap.ui.core.mvc.ControllerExtension")) {
		return scope.getView()?.getModel("sap.fe.i18n") as ResourceModel;
	} else {
		let i18nModel = scope.getModel("sap.fe.i18n") as ResourceModel | undefined;
		if (!i18nModel) {
			i18nModel = Component.getOwnerComponentFor(scope)?.getModel("sap.fe.i18n") as ResourceModel;
		}
		return i18nModel;
	}
}

/**
 * Determines the resource model text for a reference.
 * @param textOrToken Text reference like {i18n>TOKEN} or {sap.fe.i18n>TOKEN}.
 * @param control A control, app component or page controller.
 * @returns The translated text
 */
export function getLocalizedText(textOrToken: string, control: Control | AppComponent | PageController): string {
	const matches = /{([A-Za-z0-9_.|@]+)>([A-Za-z0-9_.|]+)}/.exec(textOrToken);
	if (matches) {
		try {
			if (matches[1] === "sap.fe.i18n") {
				// Since our internal resource model is asynchronous we need to access the text like below, otherwise we
				// get back a promise
				return getResourceModel(control).getText(matches[2]);
			} else {
				// For synchronous resource models like i18n used for custom columns we access the text like below
				const resourceBundle = (control.getModel(matches[1]) as ResourceModel).getResourceBundle() as ResourceBundle;
				return resourceBundle.getText(matches[2]);
			}
		} catch (e) {
			Log.info(`Unable to retrieve localized text ${textOrToken}`);
		}
	}
	return textOrToken;
}

export default {
	getResourceModel,
	getLocalizedText
};

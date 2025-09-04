import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import { defineUI5Class, publicExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * Internal base controller class for SAP Fiori elements application.
 *
 * If you want to extend a base controller for your custom page, please use for sap.fe.core.PageController.
 * @hideconstructor
 * @public
 * @since 1.90.0
 */
@defineUI5Class("sap.fe.core.BaseController")
class BaseController extends Controller {
	private _oAppComponent?: AppComponent;

	/**
	 * Returns the current app component.
	 * @returns The app component or, if not found, null
	 * @public
	 * @since 1.91.0
	 */
	@publicExtension()
	getAppComponent(): AppComponent {
		if (!this._oAppComponent) {
			this._oAppComponent = CommonUtils.getAppComponent(this.getView());
		}
		return this._oAppComponent;
	}

	/**
	 * Convenience method provided by SAP Fiori elements to enable applications to include the view model by name into each controller.
	 * @public
	 * @param sName The model name
	 * @returns The model instance
	 */
	getModel(sName?: string): Model | undefined {
		return this.getView().getModel(sName);
	}

	/**
	 * Convenience method for setting the view model in every controller of the application.
	 * @public
	 * @param oModel The model instance
	 * @param sName The model name
	 * @returns The view instance
	 */
	setModel(oModel: Model, sName: string): View {
		return this.getView().setModel(oModel, sName);
	}

	getResourceBundle(sI18nModelName: string): ResourceBundle | Promise<ResourceBundle> {
		if (!sI18nModelName) {
			sI18nModelName = "i18n";
		}
		return (this.getAppComponent().getModel(sI18nModelName) as ResourceModel).getResourceBundle();
	}
}
export type FEView = {
	getModel(): ODataModel;
	getModel(modelName: "sap.fe.i18n"): ResourceModel;
	getModel(modelName: "ui"): JSONModel;
	getModel(modelName: "internal"): JSONModel;
	getModel(modelName: "_pageModel"): JSONModel;
	getModel(modelName: "fclhelper"): JSONModel;
	getController(): PageController;
	getBindingContext(): ODataV4Context;
	getViewData(): ViewData;
} & View;

interface BaseController {
	getOwnerComponent(): TemplateComponent;
	getModel(): ODataModel;
	getModel(modelName: "ui"): JSONModel;
	/**
	 * Returns the view associated with this controller.
	 * @returns View connected to this controller.
	 */
	getView(): FEView;
}
export default BaseController;

import { defineUI5Class, extensible, finalExtension, publicExtension } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import BaseControllerExtension from "sap/fe/core/controllerextensions/BaseControllerExtension";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * A controller extension offering hooks into the routing flow of the application
 * @hideconstructor
 * @public
 * @since 1.86.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.Routing")
class Routing extends BaseControllerExtension {
	private base!: PageController;

	/**
	 * This function can be used to intercept the routing event during the normal navigation process, such as when a table row is clicked to navigate, pagination buttons are used, the Apply button in an object page is clicked, or a sub-object page in a flexible column layout is closed.
	 *
	 * The function is NOT called during other means of external outbound navigation (like a navigation configured via a link, or by using navigation buttons).
	 *
	 * If declared as an extension, it allows you to intercept and change the normal navigation flow.
	 * If you decide to do your own navigation processing, you can return `true` to prevent the default routing behavior.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param mNavigationParameters Object containing row context and page context
	 * @param mNavigationParameters.bindingContext The target navigation context
	 * @returns `true` to prevent the default execution, false to keep the standard behavior
	 * @public
	 * @since 1.86.0
	 */
	@publicExtension()
	@extensible("AfterAsync")
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async onBeforeNavigation(mNavigationParameters: { bindingContext: Context }): Promise<boolean> {
		// to be overriden by the application
		return Promise.resolve(false);
	}

	/**
	 * Allows navigation to a specific context.
	 * @param oContext Object containing the context to be navigated to
	 * @param parameters Object containing the parameters for the navigation
	 * @param parameters.preserveHistory  By default, the internal algorithm decides whether the navigation preserves the previous entry. This parameter allows you to override this behavior.
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	navigate(oContext: Context, parameters?: { preserveHistory: boolean }): void {
		const internalModel = this.base.getModel("internal") as JSONModel;
		// We have to delete the internal model value for "paginatorCurrentContext" to ensure it is re-evaluated by the navigateToContext function
		// BCP: 2270123820
		internalModel.setProperty("/paginatorCurrentContext", null);
		this.base._routing.navigateToContext(oContext, parameters);
	}

	/**
	 * This function is used to intercept the routing event before binding a page.
	 *
	 * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
	 *
	 * This function is not called directly, but overridden separately by consuming controllers.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param oContext Object containing the context for the navigation
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onBeforeBinding(oContext: object | null): void {
		// to be overriden by the application
	}

	/**
	 * This function is used to intercept the routing event after binding a page.
	 *
	 * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
	 *
	 * This function is not called directly, but overridden separately by consuming controllers.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param oContext Object containing the context to be navigated
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onAfterBinding(oContext: object | null): void {
		// to be overriden by the application
	}

	/**
	 * Navigate to another target.
	 * @param sTargetRouteName Name of the target route
	 * @param oParameters Parameters to be used with route to create the target hash
	 * @param oParameters.bIsStickyMode PRIVATE
	 * @param oParameters.preserveHistory PRIVATE
	 * @returns Promise that is resolved when the navigation is finalized
	 * @public
	 */
	@publicExtension()
	@finalExtension()
	async navigateToRoute(
		sTargetRouteName: string,
		oParameters?: { bIsStickyMode?: boolean; preserveHistory?: boolean }
	): Promise<boolean> {
		const oMetaModel = this.base.getModel().getMetaModel();
		const bIsStickyMode = ModelHelper.isStickySessionSupported(oMetaModel);
		if (!oParameters) {
			oParameters = {};
		}
		oParameters.bIsStickyMode = bIsStickyMode;
		return this.base._routing.navigateToRoute(sTargetRouteName, oParameters);
	}
}

export default Routing;

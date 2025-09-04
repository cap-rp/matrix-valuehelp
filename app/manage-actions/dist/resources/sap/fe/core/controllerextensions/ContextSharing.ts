import { defineUI5Class, extensible, publicExtension } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";

/**
 * A controller extension offering hooks into the JouleContextSharing flow of the application
 * @hideconstructor
 * @since 1.121.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.ContextSharing")
export default class ContextSharing extends ControllerExtension {
	private base!: PageController;

	/**
	 * This function is used to customize the context sent to JOULE web client.
	 *
	 * If it is declared as an extension, it permits to populate the "custom" property of the context with the returned object.
	 *
	 * This function is not called directly, but overridden separately by consuming controllers.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param context The context built by FEv4
	 * @returns The custom context
	 * @since 1.121.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getContext(context: Object): Object {
		return context;
		// to be overriden by the application
	}
}

import { defineUI5Class, extensible, publicExtension } from "sap/fe/base/ClassSupport";
import { hookable } from "sap/fe/base/HookSupport";
import type PageController from "sap/fe/core/PageController";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type { default as Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

/**
 * Controller extension providing hooks for the navigation using paginators
 * @hideconstructor
 * @public
 * @since 1.94.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.Paginator")
class Paginator extends ControllerExtension {
	protected base!: PageController;

	/**
	 * Initiates the paginator control.
	 * @param oBinding ODataListBinding object
	 * @param oContext Current context where the navigation is initiated
	 * @public
	 * @since 1.94.0
	 */
	@publicExtension()
	@hookable("Before")
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	initialize(oBinding?: ODataListBinding, oContext?: Context): void {}

	/**
	 * Called before context update.
	 * @param oListBinding ODataListBinding object
	 * @param iCurrentIndex Current index of context in listBinding from where the navigation is initiated
	 * @param iIndexUpdate The delta index for update
	 * @returns `true` to prevent the update of current context.
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onBeforeContextUpdate(oListBinding: ODataListBinding, iCurrentIndex: number, iIndexUpdate: number): boolean {
		return false;
	}

	/**
	 * Returns the updated context after the paginator operation.
	 * @param oContext Final context returned after the paginator action
	 * @public
	 * @since 1.94.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onContextUpdate(oContext: Context): void {
		//To be overridden by the application
	}
}
export default Paginator;

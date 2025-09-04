import type Paginator from "sap/fe/core/controllerextensions/Paginator";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

const PaginatorExtensionOverride = {
	onBeforeContextUpdate: function (this: Paginator, oListBinding: ODataListBinding, iCurrentContextIndex: number): boolean {
		const oCurrentView = this.getView(),
			oControlContext = oCurrentView && oCurrentView.getBindingContext(),
			aCurrentContexts = oListBinding && oListBinding.getCurrentContexts(),
			oPaginatorCurrentContext = aCurrentContexts[iCurrentContextIndex];

		if (oPaginatorCurrentContext && oControlContext && oPaginatorCurrentContext.getPath() !== oControlContext.getPath()) {
			// Prevent default update of context index in Object Page Paginator when view context is different from the paginator context.
			return true;
		}
		return false;
	},

	onContextUpdate: function (this: Paginator, oContext: Context): void {
		this.base._routing.navigateToContext(oContext, { callExtension: true });
	}
};

export default PaginatorExtensionOverride;

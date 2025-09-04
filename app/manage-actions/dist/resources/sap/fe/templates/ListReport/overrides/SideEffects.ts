import type { EntitySet } from "@sap-ux/vocabularies-types";
import CommonUtils from "sap/fe/core/CommonUtils";
import type SideEffectsControllerExtension from "sap/fe/core/controllerextensions/SideEffects";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

/**
 * Checks if the SideEffects triggers a refresh of the table.
 * The target entity must be an absolute path and point to the same entity type as the table.
 * @param controller The ListReportController
 * @param headerContext The header context of the table
 * @param eventName The event name
 * @returns True if the SideEffects event target the table; otherwise, returns false
 */
function isSideEffectsRequestingTable(controller: ListReportController, headerContext: ODataV4Context, eventName: string): boolean {
	const sideEffectsService = CommonUtils.getAppComponent(controller.getView()).getSideEffectsService();
	const convertedMetaModel = sideEffectsService.getConvertedMetaModel();
	const metaPath = headerContext.getModel().getMetaModel().getMetaContext(headerContext.getPath());
	const tableEntityType = getInvolvedDataModelObjects(metaPath).targetEntityType;
	return sideEffectsService.getODataSideEffectsFromContextEvent(headerContext, eventName).some((sideEffects) => {
		return sideEffects.targetEntities.some(
			(targetEntity) =>
				targetEntity.$NavigationPropertyPath.startsWith("/") &&
				convertedMetaModel.resolvePath<EntitySet | undefined>(targetEntity.$NavigationPropertyPath)?.target?.entityType ===
					tableEntityType
		);
	});
}
const SideEffectsOverride = {
	/**
	 * Get text to be shown for user to indicate data refresh.
	 *
	 * According to UX there should be another text in the LR without referencing one item.
	 * @returns Text to be shown to the user in case of a data refresh
	 */
	getDataRefreshText: function (this: SideEffectsControllerExtension): string {
		const resourceModel = getResourceModel(this.getView());
		return resourceModel.getText("C_SERVER_EVENTS_NEW_DATA");
	},

	/**
	 * Requests the SideEffects for a sideEffect event.
	 *
	 * Search the context in the LR table and trigger the side effect for this context if found.
	 * @param eventName SideEffects event which was triggered
	 * @param path The path for which this event was triggered
	 * @returns Promise on SideEffects request
	 */
	async requestSideEffectsForEvent(this: SideEffectsControllerExtension, eventName: string, path: string): Promise<undefined> {
		const controller = this.getView().getController() as ListReportController;
		const table = (this.getView().getController() as ListReportController)._getTable();
		const dataListBinding = table?.getRowBinding();
		if (!dataListBinding) {
			return;
		}
		const tableHeaderContext = dataListBinding.getHeaderContext();
		if (tableHeaderContext && isSideEffectsRequestingTable(controller, tableHeaderContext, eventName)) {
			return CommonUtils.getAppComponent(this.getView())
				.getSideEffectsService()
				.requestSideEffectsForEvent(eventName, tableHeaderContext);
		}
		const contexts = dataListBinding.getCurrentContexts() ?? [];
		const context = contexts.find((context: ODataV4Context) => context.getPath() === path);
		if (context) {
			// use the default implementation from the SideEffects Service
			return CommonUtils.getAppComponent(this.getView()).getSideEffectsService().requestSideEffectsForEvent(eventName, context);
		}
	},
	/**
	 * Overrides the isDataPathRelevant with LR specific logic to check the current table's contexts.
	 * @param path The path to be checked
	 * @param eventName The SideEffects event that is triggered
	 * @returns True if the data path is shown in table
	 */
	isDataPathRelevant(this: SideEffectsControllerExtension, path: string, eventName: string): boolean {
		const controller = this.getView().getController() as ListReportController;
		const dataListBinding = controller._getTable()?.getRowBinding();
		if (!dataListBinding) {
			return false;
		}
		const tableHeaderContext = dataListBinding.getHeaderContext();
		// Absolute path to refresh the table
		if (tableHeaderContext && isSideEffectsRequestingTable(controller, tableHeaderContext, eventName)) {
			return true;
		}
		const contexts = dataListBinding.getCurrentContexts() ?? [];
		return contexts.findIndex((context: ODataV4Context) => context.getPath() === path) > -1;
	}
};

export default SideEffectsOverride;

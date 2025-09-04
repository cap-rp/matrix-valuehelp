/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ResourceModelHelper"], function (CommonUtils, MetaModelConverter, ResourceModelHelper) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  /**
   * Checks if the SideEffects triggers a refresh of the table.
   * The target entity must be an absolute path and point to the same entity type as the table.
   * @param controller The ListReportController
   * @param headerContext The header context of the table
   * @param eventName The event name
   * @returns True if the SideEffects event target the table; otherwise, returns false
   */
  function isSideEffectsRequestingTable(controller, headerContext, eventName) {
    const sideEffectsService = CommonUtils.getAppComponent(controller.getView()).getSideEffectsService();
    const convertedMetaModel = sideEffectsService.getConvertedMetaModel();
    const metaPath = headerContext.getModel().getMetaModel().getMetaContext(headerContext.getPath());
    const tableEntityType = getInvolvedDataModelObjects(metaPath).targetEntityType;
    return sideEffectsService.getODataSideEffectsFromContextEvent(headerContext, eventName).some(sideEffects => {
      return sideEffects.targetEntities.some(targetEntity => targetEntity.$NavigationPropertyPath.startsWith("/") && convertedMetaModel.resolvePath(targetEntity.$NavigationPropertyPath)?.target?.entityType === tableEntityType);
    });
  }
  const SideEffectsOverride = {
    /**
     * Get text to be shown for user to indicate data refresh.
     *
     * According to UX there should be another text in the LR without referencing one item.
     * @returns Text to be shown to the user in case of a data refresh
     */
    getDataRefreshText: function () {
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
    async requestSideEffectsForEvent(eventName, path) {
      const controller = this.getView().getController();
      const table = this.getView().getController()._getTable();
      const dataListBinding = table?.getRowBinding();
      if (!dataListBinding) {
        return;
      }
      const tableHeaderContext = dataListBinding.getHeaderContext();
      if (tableHeaderContext && isSideEffectsRequestingTable(controller, tableHeaderContext, eventName)) {
        return CommonUtils.getAppComponent(this.getView()).getSideEffectsService().requestSideEffectsForEvent(eventName, tableHeaderContext);
      }
      const contexts = dataListBinding.getCurrentContexts() ?? [];
      const context = contexts.find(context => context.getPath() === path);
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
    isDataPathRelevant(path, eventName) {
      const controller = this.getView().getController();
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
      return contexts.findIndex(context => context.getPath() === path) > -1;
    }
  };
  return SideEffectsOverride;
}, false);
//# sourceMappingURL=SideEffects-dbg.js.map

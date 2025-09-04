/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/insights/CommonInsightsHelper", "sap/fe/core/CommonUtils"], function (Log, CommonInsightsHelper, CommonUtils) {
  "use strict";

  var _exports = {};
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  const RetrieveCardTypes = {
    INTEGRATION: "integration"
  };
  _exports.RetrieveCardTypes = RetrieveCardTypes;
  const CollaborationManagerOverride = {
    async collectAvailableCards(cards) {
      const view = this.base.getView();
      const controller = view.getController();
      const appComponent = controller.getOwnerComponent().getAppComponent();
      const isEditable = CommonUtils.getIsEditable(view);
      const card = !isEditable ? await appComponent.getCollaborationManagerService().getDesignTimeCard(RetrieveCardTypes.INTEGRATION) : undefined;
      if (card) {
        const onAddCardToCollaborationManagerCallback = () => {
          try {
            if (card) {
              appComponent.getCollaborationManagerService().publishCard(card);
              return;
            }
          } catch (e) {
            showGenericErrorMessage(view);
            Log.error(e);
          }
        };
        cards.push({
          card: card,
          title: controller._getPageTitleInformation().subtitle || "",
          callback: onAddCardToCollaborationManagerCallback
        });
      }
    }
  };
  return CollaborationManagerOverride;
}, false);
//# sourceMappingURL=CollaborationManager-dbg.js.map

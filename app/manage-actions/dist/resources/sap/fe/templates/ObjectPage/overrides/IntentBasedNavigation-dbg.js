/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/navigation/SelectionVariant"], function (CommonUtils, SelectionVariant) {
  "use strict";

  const IntentBasedNavigationOverride = {
    adaptNavigationContext: function (oSelectionVariant, oTargetInfo) {
      const oView = this.getView(),
        oController = oView.getController(),
        oInternalModelContext = this.getView().getBindingContext("internal"),
        oExternalNavigationContext = oInternalModelContext.getProperty("externalNavigationContext");
      const oAppComponent = CommonUtils.getAppComponent(oView);
      const oMetaModel = oAppComponent.getModel().getMetaModel();
      const oPageContext = oView.getBindingContext();
      //If the link context is same as page context merging of context should not happen
      const mergeLinkContext = oTargetInfo?.linkContextPath ? oPageContext.getPath() !== oTargetInfo?.linkContextPath : true;
      if (oExternalNavigationContext?.page && mergeLinkContext) {
        const sMetaPath = oMetaModel.getMetaPath(oPageContext.getPath());
        let pageAttributes = oPageContext.getObject();
        pageAttributes = oController._intentBasedNavigation.processSemanticAttributes(oPageContext, oPageContext.getObject());
        const oPageContextData = oController._intentBasedNavigation.removeSensitiveData(pageAttributes, sMetaPath),
          oPageData = oController._intentBasedNavigation.prepareContextForExternalNavigation(oPageContextData, oPageContext),
          oPagePropertiesWithoutConflict = oPageData.propertiesWithoutConflict,
          // TODO: move this also into the intent based navigation controller extension
          oPageSV = CommonUtils.addPageContextToSelectionVariant(new SelectionVariant(), oPageData.semanticAttributes, oView),
          oPropertiesWithoutConflict = oTargetInfo?.propertiesWithoutConflict;
        const aSelectOptionPropertyNames = oPageSV.getSelectOptionsPropertyNames();
        aSelectOptionPropertyNames.forEach(function (sPropertyName) {
          if (!oSelectionVariant.getSelectOption(sPropertyName)) {
            oSelectionVariant.massAddSelectOption(sPropertyName, oPageSV.getSelectOption(sPropertyName));
          } else {
            // Only when there is no conflict do we need to add something
            // in all other case the conflicted paths are already added in prepareContextForExternalNavigation
            // if property was without conflict in incoming context then add path from incoming context to SV
            // TO-DO. Remove the check for oPropertiesWithoutConflict once semantic links functionality is covered
            if (oPropertiesWithoutConflict && sPropertyName in oPropertiesWithoutConflict) {
              oSelectionVariant.massAddSelectOption(oPropertiesWithoutConflict[sPropertyName], oSelectionVariant.getSelectOption(sPropertyName));
            }
            // if property was without conflict in page context then add path from page context to SV
            if (sPropertyName in oPagePropertiesWithoutConflict) {
              oSelectionVariant.massAddSelectOption(oPagePropertiesWithoutConflict[sPropertyName], oPageSV.getSelectOption(sPropertyName));
            }
          }
        });
      }
      // remove non public properties from targetInfo
      delete oTargetInfo?.propertiesWithoutConflict;
      delete oTargetInfo?.linkContext;
      oInternalModelContext.setProperty("externalNavigationContext", {
        page: true
      });
    }
  };
  return IntentBasedNavigationOverride;
}, false);
//# sourceMappingURL=IntentBasedNavigation-dbg.js.map

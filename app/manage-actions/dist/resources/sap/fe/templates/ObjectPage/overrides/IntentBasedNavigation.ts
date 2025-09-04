import CommonUtils from "sap/fe/core/CommonUtils";
import type IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type PageController from "sap/fe/core/PageController";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type Context from "sap/ui/model/Context";

const IntentBasedNavigationOverride = {
	adaptNavigationContext: function (
		this: IntentBasedNavigation,
		oSelectionVariant: SelectionVariant,
		oTargetInfo?: { linkContextPath: string; linkContext?: unknown; propertiesWithoutConflict?: Record<string, string> }
	): void {
		const oView = this.getView(),
			oController = oView.getController() as PageController,
			oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext,
			oExternalNavigationContext = oInternalModelContext.getProperty("externalNavigationContext");
		const oAppComponent = CommonUtils.getAppComponent(oView);
		const oMetaModel = oAppComponent.getModel().getMetaModel();
		const oPageContext = oView.getBindingContext() as Context;
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
				oPageSV = CommonUtils.addPageContextToSelectionVariant(
					new SelectionVariant(),
					oPageData.semanticAttributes as unknown[],
					oView
				),
				oPropertiesWithoutConflict = oTargetInfo?.propertiesWithoutConflict;
			const aSelectOptionPropertyNames = oPageSV.getSelectOptionsPropertyNames();
			aSelectOptionPropertyNames.forEach(function (sPropertyName: string) {
				if (!oSelectionVariant.getSelectOption(sPropertyName)) {
					oSelectionVariant.massAddSelectOption(sPropertyName, oPageSV.getSelectOption(sPropertyName)!);
				} else {
					// Only when there is no conflict do we need to add something
					// in all other case the conflicted paths are already added in prepareContextForExternalNavigation
					// if property was without conflict in incoming context then add path from incoming context to SV
					// TO-DO. Remove the check for oPropertiesWithoutConflict once semantic links functionality is covered
					if (oPropertiesWithoutConflict && sPropertyName in oPropertiesWithoutConflict) {
						oSelectionVariant.massAddSelectOption(
							oPropertiesWithoutConflict[sPropertyName],
							oSelectionVariant.getSelectOption(sPropertyName)!
						);
					}
					// if property was without conflict in page context then add path from page context to SV
					if (sPropertyName in oPagePropertiesWithoutConflict) {
						oSelectionVariant.massAddSelectOption(
							oPagePropertiesWithoutConflict[sPropertyName],
							oPageSV.getSelectOption(sPropertyName)!
						);
					}
				}
			});
		}
		// remove non public properties from targetInfo
		delete oTargetInfo?.propertiesWithoutConflict;
		delete oTargetInfo?.linkContext;
		oInternalModelContext.setProperty("externalNavigationContext", { page: true });
	}
};

export default IntentBasedNavigationOverride;

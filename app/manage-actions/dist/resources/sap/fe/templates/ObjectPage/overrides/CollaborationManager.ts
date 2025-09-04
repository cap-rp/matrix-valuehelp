import Log from "sap/base/Log";
import { type RetrieveCardType } from "sap/cards/ap/common/services/RetrieveCard";
import type CollaborationManager from "sap/fe/core/controllerextensions/cards/CollaborationManager";
import { type WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import { type CardManifest } from "sap/insights/CardHelper";
import { showGenericErrorMessage } from "sap/fe/macros/insights/CommonInsightsHelper";
import CommonUtils from "sap/fe/core/CommonUtils";
export const RetrieveCardTypes: Record<string, RetrieveCardType> = {
    INTEGRATION: "integration"
}

const CollaborationManagerOverride = {
    async collectAvailableCards(this: CollaborationManager, cards: WrappedCard[]): Promise<void> {
        const view = this.base.getView();
        const controller = view.getController();
        const appComponent = controller.getOwnerComponent().getAppComponent();
        const isEditable = CommonUtils.getIsEditable(view);
        const card = !isEditable ?await appComponent.getCollaborationManagerService().getDesignTimeCard(RetrieveCardTypes.INTEGRATION) : undefined;
        if (card) {
            const onAddCardToCollaborationManagerCallback = (): void => {
                try {
                    if (card) {
                        appComponent.getCollaborationManagerService().publishCard(card as CardManifest);
                        return;
                    }
                } catch (e) {
                    showGenericErrorMessage(view);
                    Log.error(e as string);
                }
            }
            cards.push({
                card: card,
                title: controller._getPageTitleInformation().subtitle || "",
                callback: onAddCardToCollaborationManagerCallback
            });
        }
    }
};
export default CollaborationManagerOverride;

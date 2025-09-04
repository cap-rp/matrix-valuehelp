import Log from "sap/base/Log";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import Link from "sap/m/Link";
import MessageItem from "sap/m/MessageItem";
import MessagePopover from "sap/m/MessagePopover";
import CustomData from "sap/ui/core/CustomData";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";
import type { ErrorExplanationData, ErrorExplanationMetadata } from "ux/eng/fioriai/reuse/errorExplanation/ErrorExplanation";

@defineUI5Class("sap.fe.macros.messages.MessagePopover")
class FeMessagePopover extends MessagePopover {
	init(): void {
		MessagePopover.prototype.init.apply(this);
		this.setModel(Messaging.getMessageModel(), "message");

		this.bindAggregation("items", {
			path: "message>/",
			length: 9999,
			template: new MessageItem({
				type: "{message>type}",
				title: "{message>message}",
				description: "{message>description}",
				markupDescription: true,
				longtextUrl: "{message>descriptionUrl}",
				subtitle: "{message>additionalText}",
				activeTitle: "{= ${message>controlIds}.length > 0 ? true : false}",
				link: this.getLinkForErrorExplanation(this) || undefined
			})
		});
		this.setGroupItems(true);
	}

	getLinkForErrorExplanation(messagePopoverInstance: MessagePopover): Link | null {
		const appComponent = CommonUtils.getAppComponent(messagePopoverInstance);
		const environmentService = appComponent.getEnvironmentCapabilities();
		if (environmentService.environmentCapabilities.ErrorExplanation) {
			const link = new Link({
				text: Library.getResourceBundleFor("sap.fe.macros")!.getText("C_GENERATE_EXPLANATION"),
				icon: "sap-icon://ai",
				customData: [
					new CustomData({
						key: "message",
						value: "{message>message}"
					}),
					new CustomData({
						key: "description",
						value: "{message>description}"
					}),
					new CustomData({
						key: "descriptionUrl",
						value: "{message>descriptionUrl}"
					}),
					new CustomData({
						key: "code",
						value: "{message>code}"
					})
				],
				press: async function (this: Link): Promise<void> {
					try {
						await environmentService.prepareFeature("ErrorExplanation");
						const { explain } = await import("ux/eng/fioriai/reuse/errorExplanation/ErrorExplanation");

						const registrationIds = appComponent.getManifestEntry("sap.fiori")?.registrationIds;
						const registrationIdsString = registrationIds && registrationIds.length > 0 ? registrationIds.join(",") : "";
						const errorExplanationMetadata: typeof ErrorExplanationMetadata = {
							version: 1,
							fioriId: registrationIdsString,
							appName: appComponent.getManifestEntry("sap.app")?.title || undefined,
							componentName: appComponent.getManifestEntry("sap.app")?.id || undefined
						};
						const errorExplanationData: typeof ErrorExplanationData = {
							version: 1,
							message: this.data("message"),
							code: this.data("code"),
							description: this.data("description"),
							descriptionUrl: this.data("descriptionUrl")
						};
						await explain(errorExplanationMetadata, errorExplanationData);
					} catch (error) {
						Log.error("Error explanation failed", error as Error);
					}
				}
			});
			FESRHelper.setSemanticStepname(link, "press", "fe4:ee:explain");
			return link;
		} else {
			return null;
		}
	}
}

export default FeMessagePopover;

import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Avatar from "sap/m/Avatar";
import AvatarShape from "sap/m/AvatarShape";
import HBox from "sap/m/HBox";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import VBox from "sap/m/VBox";
import type { $ControlSettings } from "sap/ui/core/Control";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";

@defineUI5Class("sap.fe.macros.contact.CollaborativeHeader")
export default class CollaborativeHeader extends BuildingBlock<HBox> {
	@property({ type: "string", isBindingInfo: true })
	fullName: string | undefined;

	@property({ type: "string", isBindingInfo: true })
	role: string | undefined;

	@property({ type: "string", isBindingInfo: true })
	photoSrc: string | undefined;

	@property({ type: "string" })
	mail: string | undefined;

	@property({ type: "boolean", defaultValue: false })
	isNaturalPerson!: boolean;

	avatar: Avatar | undefined;

	constructor(properties: $ControlSettings & PropertiesOf<CollaborativeHeader>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		this.createContent();
	}

	/**
	 * Retrieve the profile status from the collaborative tools service.
	 * @param mail
	 */
	async addProfileStatus(mail: string): Promise<void> {
		const appComponent = this.getAppComponent();
		if (appComponent) {
			const contactStatus = await appComponent.getCollaborativeToolsService().getTeamContactStatus(mail);
			const chatContactOption = await appComponent.getCollaborativeToolsService().getTeamContactOption("chat");
			// The badge info used for contact status on the Avatar is shown directly without waiting for a click event
			if (contactStatus && chatContactOption) {
				contactStatus.forEach((element) => {
					if (element.key === "profileStatus") {
						// add custom data to be used by teams helper to trigger collaboration
						if (this.avatar) {
							this.avatar.data("type", chatContactOption.key);
							this.avatar.data("email", this.mail);
							this.avatar.setBadgeIcon(element.badgeIcon);
							this.avatar.setBadgeValueState(element.badgeValueState);
							this.avatar.setTooltip(element.badgeTooltip);
							this.avatar.setBadgeTooltip(element.badgeTooltip);
							FESRHelper.setSemanticStepname(this.avatar, "press", chatContactOption.fesrStepName);
						}
					}
				});
			}
		}
	}

	/**
	 * Setter for the mail that additionally adds the status to the header.
	 * @param mail
	 */
	setMail(mail: string): void {
		this.mail = mail;
		this.addProfileStatus(mail);
	}

	/**
	 * Create the content.
	 */
	createContent(): void {
		this.avatar = (
			<Avatar
				src={this.photoSrc}
				displaySize="M"
				displayShape={this.isNaturalPerson ? AvatarShape.Circle : AvatarShape.Square}
				class="sapUiTinyMarginEnd"
			/>
		);
		const header = (
			<HBox>
				{this.avatar}
				<VBox class="sapUiTinyMarginBegin">
					<Title text={this.fullName} level="H3" wrapping="true" />
					<Text text={this.role} />
				</VBox>
			</HBox>
		);
		this.content = header;
	}
}

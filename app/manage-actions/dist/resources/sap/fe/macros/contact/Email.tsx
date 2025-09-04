import { constant } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { Link$PressEvent } from "sap/m/Link";
import Link from "sap/m/Link";
import type Popover from "sap/m/Popover";
import MLibrary from "sap/m/library";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";

@defineUI5Class("sap.fe.macros.contact.Email")
export default class Email extends BuildingBlock<Link> {
	@property({
		type: "any",
		isBindingInfo: true
	})
	visible: PropertyBindingInfo = constant(true);

	@property({
		type: "any",
		isBindingInfo: true
	})
	text!: PropertyBindingInfo;

	@property({ type: "boolean" })
	linkEnabled = true;

	@property({ type: "string" })
	mail!: string | undefined;

	@property({ type: "string" })
	emptyIndicatorMode = "Off";

	constructor(properties: $ControlSettings & PropertiesOf<Email>, others?: $ControlSettings) {
		super(properties, others);
		if (this.visible === undefined || (typeof this.visible === "object" && Object.keys(this.visible).length === 0)) {
			this.visible = constant(true);
		}
		if (!this.linkEnabled) this.linkEnabled = true;
	}

	/**
	 * Checks if the Teams connection is active.
	 * @returns Boolean value
	 */
	async isTeamsConnectionActive(): Promise<boolean> {
		const appComponent = this.getAppComponent();
		if (appComponent) {
			return appComponent.getCollaborativeToolsService().isContactsCollaborationSupported();
		} else {
			return false;
		}
	}

	/**
	 * Get the mail Popover from the Teams integration.
	 * @param mail
	 * @returns Popover or undefined
	 */
	getMailPopoverFromMsTeamsIntegration(mail: string): Promise<Popover | undefined> | undefined {
		const appComponent = this.getAppComponent();
		if (appComponent) {
			return appComponent.getCollaborativeToolsService().getMailPopoverFromMsTeamsIntegration(mail);
		} else {
			return undefined;
		}
	}

	/**
	 * Setter for the linkEnabled property.
	 * @param enabled
	 */
	setLinkEnabled(enabled: boolean): void {
		this.linkEnabled = enabled;
		this.content?.setEnabled(enabled);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			if (this.visible === undefined || (typeof this.visible === "object" && Object.keys(this.visible).length === 0)) {
				this.visible = constant(true);
			}
			if (!this.linkEnabled) this.linkEnabled = true;
			this.content = this.createContent();
		}
	}

	/**
	 * Open a popover if the Teams connection is active or a classic mail.
	 * @param event
	 */
	async openPopover(event: Link$PressEvent): Promise<void> {
		event.preventDefault(); // stop default behavior based on href
		let revertToDefaultBehaviour = false;
		const link = event.getSource();
		// "this" doesn't contain the Email instance corresponding to the link so we need to retrieve it in order to read the mail
		const mailBBv4 = link.getParent() as Email;

		// we need to check if the teams connection is active now because at templating the teamshelper service might not have been initialized yet
		if (await this.isTeamsConnectionActive()) {
			if (mailBBv4.mail) {
				const popover = await this.getMailPopoverFromMsTeamsIntegration(mailBBv4.mail);
				if (popover) {
					popover.openBy(link);
				} else {
					revertToDefaultBehaviour = true;
				}
			}
		} else {
			revertToDefaultBehaviour = true;
		}
		if (revertToDefaultBehaviour) {
			MLibrary.URLHelper.redirect(`mailto:${mailBBv4.mail}`);
		}
	}

	/**
	 * Retrieves the current value of the Link.
	 * @returns The current value of the Link
	 */
	getValue(): string | undefined {
		return this.content?.getText();
	}

	/**
	 * Sets the current value of the Link.
	 * @param value
	 * @returns The current Email reference
	 */
	setValue(value: string | undefined): Email {
		this.setProperty("text", value);
		this.content?.setText(value);
		return this;
	}

	/**
	 * Create the content.
	 * @returns The Link
	 */
	createContent(): Link {
		return (
			<Link
				visible={this.visible}
				text={this.text}
				enabled={this.linkEnabled}
				emptyIndicatorMode={this.emptyIndicatorMode}
				class="sapMTextRenderWhitespaceWrap"
				press={async (event: Link$PressEvent): Promise<void> => this.openPopover(event)}
				ariaLabelledBy={this.ariaLabelledBy}
				wrapping={true}
			/>
		) as Link;
	}
}

import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Button from "sap/m/Button";
import FormattedText from "sap/m/FormattedText";
import Toolbar from "sap/m/Toolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import type { ContactOption as TeamsContactOption } from "sap/suite/ui/commons/collaboration/TeamsHelperService";
import type Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Library from "sap/ui/core/Lib";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";

@defineUI5Class("sap.fe.macros.contact.TeamContactOptions")
export default class TeamContactOptions extends BuildingBlock<Toolbar> {
	@property({ type: "string" })
	mail: string | undefined;

	visible = false;

	contactOptions: TeamsContactOption[] | undefined = [];

	constructor(properties: $ControlSettings & PropertiesOf<TeamContactOptions>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Retrieve the contact options from the collaborative tools service.
	 */
	async retrieveContactOptions(): Promise<void> {
		const appComponent = this.getAppComponent();
		if (appComponent) {
			this.contactOptions = await appComponent.getCollaborativeToolsService().getTeamContactOptions();
		}
	}

	/**
	 * Setter for the mail that handles the visibility of the control.
	 * @param mail
	 */
	setMail(mail: string): void {
		this.mail = mail;
		this.visible = !!mail;
		this.setVisible(this.visible);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	async onMetadataAvailable(): Promise<void> {
		if (!this.content) {
			await this.retrieveContactOptions();
			this.createContent();
		}
	}

	/**
	 * Get the button for the contact option.
	 * @param contactOptionDef
	 * @returns The button control
	 */
	getContactOptionButton(contactOptionDef: TeamsContactOption): Button {
		const button = (
			<Button
				icon={contactOptionDef.icon}
				class="sapUiSmallMarginBegin"
				type="Transparent"
				customData={[new CustomData({ key: "type", value: contactOptionDef.key })]}
				press={(event: Event): void => {
					// we set the mail custom data just before the callback is called, to ensure we give it the right mail value
					button.data("email", this.mail);
					contactOptionDef.callBackHandler(event);
				}}
			/>
		);
		FESRHelper.setSemanticStepname(button, "press", contactOptionDef.fesrStepName);

		return button;
	}

	/**
	 * Create the content.
	 */
	createContent(): void {
		if (!this.contactOptions?.length) {
			return;
		}
		const toolbar = <Toolbar width="100%" class="sapUiTinyMarginBottom" />;
		const formattedText = <FormattedText textAlign="Left" />;
		const msTeamsText = Library.getResourceBundleFor("sap.fe.macros")!.getText("M_COMMON_MS_TEAMS_TITLE");
		formattedText.setHtmlText(`<strong>${msTeamsText}</strong>`);
		toolbar.addContent(formattedText);
		toolbar.addContent(<ToolbarSpacer />);
		this.contactOptions.forEach((contactOptionDef) => {
			toolbar.addContent(this.getContactOptionButton(contactOptionDef));
		});
		this.setVisible(this.visible);
		this.content = toolbar;
	}
}

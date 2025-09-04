import Log from "sap/base/Log";
import type { IValueHelpHistoryService } from "sap/fe/core/services/ValueHelpHistoryServiceFactory";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import type { $FlexBoxSettings } from "sap/m/FlexBox";
import FlexBox from "sap/m/FlexBox";
import HBox, { type $HBoxSettings } from "sap/m/HBox";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import Switch from "sap/m/Switch";
import VBox from "sap/m/VBox";
import type Event from "sap/ui/base/Event";
import IconPool from "sap/ui/core/IconPool";
import Library from "sap/ui/core/Lib";
import type Item from "sap/ushell/services/Extension/Item";

export default class HistoryOptOutProvider {
	private valueHelpHistoryService: IValueHelpHistoryService;

	private dialog?: Dialog;

	private historyEnabledSwitch?: Switch;

	private resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;

	constructor(valueHelpHistoryService: IValueHelpHistoryService) {
		this.valueHelpHistoryService = valueHelpHistoryService;
	}

	public getDialog(): Dialog | undefined {
		return this.dialog;
	}

	/**
	 * For history settings we need to create a user profile entry and a handler for opening the dialog.
	 * @returns Promise that is resolved when user menu entry control is created
	 */
	async createOptOutUserProfileEntry(): Promise<Item | undefined> {
		const shellExtensionService = this.valueHelpHistoryService.getShellExtensionService();
		let userAction: Item | undefined;

		try {
			userAction = await shellExtensionService.createUserAction(
				{
					id: "sapui5.history.optOut.trigger",
					text: this.resourceBundle.getText("C_HISTORY_SETTING_TITLE"),
					icon: IconPool.getIconURI("history"),
					press: async (): Promise<void> => {
						this.historyEnabledSwitch = new Switch();

						this.dialog = this.createDialog();

						const enabled = await this.valueHelpHistoryService.getHistoryEnabled();
						this.historyEnabledSwitch.setState(enabled);

						this.dialog.open();
					}
				},
				{
					controlType: "sap.m.Button"
				}
			);

			userAction.showForCurrentApp();
		} catch (err) {
			Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
		}

		return userAction;
	}

	/*
		Create Controls
	 */

	/**
	 * For the history setting dialog we need to create all the necessary UI elements for the
	 * enable history tracking switch and the clear history button.
	 * @returns The dialog layout
	 */
	private createDialogLayout(): VBox {
		const historyEnabledLabel = new Label({
			text: this.resourceBundle.getText("C_HISTORY_SETTING_ENABLE_TRACKING_DESCRIPTION"),
			labelFor: this.historyEnabledSwitch
		}).addStyleClass("sapUiSmallMarginEnd");
		const historyEnabledLayout = new HBox({
			alignItems: "Center",
			items: [historyEnabledLabel, this.historyEnabledSwitch]
		} as $HBoxSettings);

		const deleteHistoryButton = new Button({
			busyIndicatorDelay: 0,
			text: this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_BUTTON"),
			press: this.onDeleteHistoryPress.bind(this)
		});
		const deleteHistoryLabel = new Label({
			text: this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_DESCRIPTION"),
			labelFor: deleteHistoryButton
		}).addStyleClass("sapUiSmallMarginEnd");
		const deleteHistoryLayout = new FlexBox({
			alignItems: "Center",
			items: [deleteHistoryLabel, deleteHistoryButton]
		} as $FlexBoxSettings);

		return new VBox({
			items: [historyEnabledLayout, deleteHistoryLayout]
		}).addStyleClass("sapUiSmallMargin");
	}

	/**
	 * Create history setting dialog with save and cancel buttons.
	 * @returns The dialog for the history settings
	 */
	private createDialog(): Dialog {
		const dialogLayout = this.createDialogLayout();

		const saveButton = new Button({
			text: this.resourceBundle.getText("C_HISTORY_SETTING_SAVE"),
			press: this.onSavePress.bind(this)
		});
		const cancelButton = new Button({
			text: this.resourceBundle.getText("C_HISTORY_SETTING_CANCEL"),
			press: () => this.closeDialog()
		});

		return new Dialog("sapui5.history.optOutDialog", {
			title: this.resourceBundle.getText("C_HISTORY_SETTING_TITLE"),
			content: [dialogLayout],
			buttons: [saveButton, cancelButton],
			afterClose: (): void => {
				// When the dialog is closed we need to free the resources
				this.dialog?.destroy();
				this.dialog = undefined;
				this.historyEnabledSwitch = undefined;
			}
		});
	}

	/*
		Handlers
	 */

	/**
	 * Handler which is called on clear history button press.
	 * @param event Button press event
	 */
	private onDeleteHistoryPress(event: Event<{}, Button>): void {
		const button = event.getSource();
		button.setBusy(true);

		MessageBox.confirm(this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_CONFIRM_MESSAGE"), {
			onClose: async (result: string) => {
				if (result === "CANCEL") {
					return;
				}
				await this.valueHelpHistoryService.deleteHistoryForAllApps().then(function () {
					return window.location.reload();
				});

				this.closeDialog();
			}
		});

		button.setBusy(false);
	}

	/**
	 * Handler which is called on save button press.
	 */
	private onSavePress(): void {
		MessageBox.confirm(this.resourceBundle.getText("C_HISTORY_SETTING_SAVE_CONFIRM_MESSAGE"), {
			onClose: async (result: string) => {
				if (result === "CANCEL") {
					return;
				}

				const enabled = this.historyEnabledSwitch?.getState() ?? false;
				await this.valueHelpHistoryService.setHistoryEnabled(enabled);

				this.closeDialog();
			}
		});
	}

	/**
	 * Close the dialog.
	 */
	private closeDialog(): void {
		this.dialog?.close();
	}
}

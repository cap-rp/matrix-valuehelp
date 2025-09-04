import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Dialog from "sap/m/Dialog";
import type { Popup$CloseEvent } from "sap/m/p13n/Popup";
import Popup from "sap/m/p13n/Popup";
import SelectionPanel from "sap/m/p13n/SelectionPanel";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import type MassEditDialogHelper from "../MassEditDialogHelper";

export default class MassEditDesignDialog {
	private massEditDialogHelper: MassEditDialogHelper;

	private popup: Popup;

	private readonly selectionPanel: SelectionPanel;

	private _fnResolve!: (value: string) => void;

	private _fnReject!: (error: unknown) => void;

	private readonly dialogPromise: Promise<string>;

	constructor(private tableAPI: TableAPI) {
		this.massEditDialogHelper = this.tableAPI.getMassEditDialogHelper() as MassEditDialogHelper;
		this.popup = this.createDialog();

		this.selectionPanel = this.popup.getPanels()[0] as SelectionPanel;
		this.dialogPromise = new Promise((resolve, reject) => {
			this._fnResolve = resolve;
			this._fnReject = reject;
		});
	}

	/**
	 * Creates the dialog for the mass edit adaptation.
	 * @returns The popup
	 */
	private createDialog(): Popup {
		return (
			<Popup
				title={(Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle).getText("C_MASS_EDIT_DESIGN_DIALOG_TITLE")}
				mode="Dialog"
				panels={[<SelectionPanel title="Columns" enableCount="true" showHeader="true" />]}
				close={this.onClose.bind(this)}
			/>
		);
	}

	/**
	 * Gets the dialog for the mass edit adaptation.
	 * @returns The popup
	 */
	getPopup(): Popup {
		return this.popup;
	}

	/**
	 * Opens the dialog for the mass edit adaptation.
	 * @param owner The owner of the dialog
	 * @param selectedFields The selected fields
	 * @returns The new selected fields
	 */
	async openDialog(owner: Control, selectedFields: string): Promise<string> {
		await this.setData(selectedFields);
		this.popup.open(owner);
		(this.popup.getDependents().find((control) => control.isA<Dialog>("sap.m.Dialog")) as Dialog | undefined)?.addStyleClass(
			"sapUiRTABorder"
		);
		return this.dialogPromise;
	}

	/**
	 * Sets the p13n data for the dialog.
	 * @param selectedFields The selected fields
	 */
	private async setData(selectedFields: string): Promise<void> {
		const displayedFields = Object.assign({}, ...selectedFields.split(",").map((fieldName) => ({ [fieldName]: true })));
		const entityFields = await this.massEditDialogHelper.generateEntityFieldsProperties();
		const p13nData = entityFields.map((field) => {
			return {
				visible: !!displayedFields[field.propertyInfo.relativePath],
				name: field.propertyInfo.relativePath,
				label: field.label
			};
		});
		this.selectionPanel.setP13nData(p13nData);
	}

	/**
	 * Closes and destroys the dialog.
	 * @param event The close event
	 */
	private onClose(event: Popup$CloseEvent): void {
		if (event.getParameter("reason") === "Ok") {
			this._fnResolve(
				this.selectionPanel
					.getP13nData(true)
					.map((item) => item.name)
					.join(",")
			);
		} else {
			this._fnReject(undefined);
		}
		if (this.popup) {
			this.popup.destroy();
		}
	}
}

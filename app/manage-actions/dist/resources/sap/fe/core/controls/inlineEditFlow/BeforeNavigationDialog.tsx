import type { FEView } from "sap/fe/core/BaseController";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import List from "sap/m/List";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import CustomData from "sap/ui/core/CustomData";
import { ValueState } from "sap/ui/core/library";

export enum DIALOGRESULT {
	SAVE = "Save",
	DISCARD = "Discard",
	CANCEL = "Cancel"
}
export default class BeforeNavigationDialog {
	public containingView!: FEView;

	public dialog!: Dialog;

	private optionsList!: List;

	private dialogCallBack!: Function;

	constructor(view: FEView, dialogCallBack: Function) {
		this.containingView = view;
		this.dialogCallBack = dialogCallBack;
		this.optionsList = (
			<List
				mode="SingleSelectLeft"
				showSeparators="None"
				includeItemInSelection="true"
				backgroundDesign="Transparent"
				class="sapUiNoContentPadding"
			>
				{{
					items: [
						<CustomListItem customData={[new CustomData({ key: "itemKey", value: "SAVE" })]}>
							<VBox class="sapUiTinyMargin">
								<Label text="{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_SAVE_RBL}" design="Bold" />
								<Text text="{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_SAVE_TOL}" />
							</VBox>
						</CustomListItem>,
						<CustomListItem customData={[new CustomData({ key: "itemKey", value: "DISCARD" })]}>
							<VBox class="sapUiTinyMargin">
								<Label text="{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_DISCARD_RBL}" design="Bold" />
								<Text text="{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_DISCARD_TOL}" />
							</VBox>
						</CustomListItem>
					]
				}}
			</List>
		);

		this.dialog = (
			<Dialog title="{sap.fe.i18n>WARNING}" type="Message" contentWidth={"22rem"} state={ValueState.Warning}>
				{{
					content: [
						<Text
							text="{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_MESSAGE}"
							class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
						/>,
						this.optionsList
					]
				}}
				{{
					beginButton: <Button type="Emphasized" text="{sap.fe.i18n>C_COMMON_DIALOG_OK}" press={(): void => this.closeAndOK()} />
				}}
				{{ endButton: <Button text="{sap.fe.i18n>C_COMMON_DIALOG_CANCEL}" press={(): void => this.closeAndCancel()} /> }}
			</Dialog>
		);
		view.addDependent(this.dialog);
	}

	/**
	 * Open the dialog.
	 */
	public open(): void {
		this.dialog.open();
		this.selectAndFocusFirstEntry();
	}

	/**
	 * Gets the key of the selected item from the list of options that was set via customData.
	 * @returns The key of the currently selected item
	 */
	private getSelectedKey(): string {
		const optionsList = this.optionsList;
		return optionsList.getSelectedItem().data("itemKey");
	}

	/**
	 * Sets the focus on the first list item of the dialog.
	 *
	 */
	private selectAndFocusFirstEntry(): void {
		const firstListItemOption: CustomListItem = this.optionsList.getItems()[0] as CustomListItem;
		this.optionsList.setSelectedItem(firstListItemOption);
		// We do not set the focus on the button, but catch the ENTER key in the dialog
		// and process it as Ok, since focusing the button was reported as an ACC issue
		firstListItemOption?.focus();
	}

	/**
	 * Close the dialog and call the callBack with the selected key.
	 * @private
	 */
	private closeAndOK(): void {
		if (this.getSelectedKey() === "SAVE") {
			this.dialogCallBack(DIALOGRESULT.SAVE);
		} else {
			this.dialogCallBack(DIALOGRESULT.DISCARD);
		}
		this.dialog.close();
		this.dialog.destroy();
	}

	/**
	 * Close the dialog and call the callBack with 'CANCEL'.
	 * @private
	 */
	private closeAndCancel(): void {
		this.dialogCallBack(DIALOGRESULT.CANCEL);
		this.dialog.close();
		this.dialog.destroy();
	}
}

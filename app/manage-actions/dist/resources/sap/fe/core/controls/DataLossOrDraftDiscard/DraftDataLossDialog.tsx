import { defineReference, defineUI5Class } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import List from "sap/m/List";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import ManagedObject from "sap/ui/base/ManagedObject";
import CustomData from "sap/ui/core/CustomData";
import type UI5Element from "sap/ui/core/Element";
import { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import CommonUtils from "../../CommonUtils";
import type PageController from "../../PageController";
import type ResourceModel from "../../ResourceModel";
import type { HiddenDraft } from "../../converters/ManifestSettings";

@defineUI5Class("sap.fe.core.controls.DataLossOrDraftDiscard.DraftDataLossDialog")
export default class DraftDataLossDialog extends ManagedObject {
	@defineReference()
	dataLossDialog!: Ref<Dialog>;

	@defineReference()
	optionsList!: Ref<List>;

	private view!: View;

	private dataLossResourceModel!: ResourceModel;

	/**
	 * Resolves the promise with the selected dialog list option
	 */
	private promiseResolve!: Function;

	private shallForceDraftSaveOrDiscard = false;

	private isRootContextNew!: boolean;

	private isHiddenDraft!: boolean;

	/**
	 * Opens the data loss dialog.
	 * @param controller
	 */
	public async open(controller: PageController): Promise<unknown> {
		this.view = controller.getView();
		const appComponent = CommonUtils.getAppComponent(this.view);
		this.isHiddenDraft = (appComponent.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft as HiddenDraft)?.enabled;
		const viewContext = this.view.getBindingContext() as Context;
		this.isRootContextNew = viewContext ? await controller.editFlow.isRootContextNew(viewContext) : false;
		this.shallForceDraftSaveOrDiscard = controller.editFlow.shallForceDraftSaveOrDiscard();
		this.dataLossResourceModel = getResourceModel(this.view);
		this.createContent();
		const dataLossConfirm = (): void => this.handleDataLossOk();
		this.optionsList.current?.addEventDelegate({
			onkeyup: function (e: KeyboardEvent) {
				if (e.key === "Enter") {
					dataLossConfirm();
				}
			}
		});
		this.view.addDependent(this.dataLossDialog.current as UI5Element);
		this.dataLossDialog.current?.open();
		this.selectAndFocusFirstEntry();

		return new Promise((resolve) => {
			this.promiseResolve = resolve;
		});
	}

	/**
	 * Handler to close the dataloss dialog.
	 *
	 */
	public close(): void {
		this.dataLossDialog.current?.close();
		this.dataLossDialog.current?.destroy();
	}

	/**
	 * Executes the logic when the data loss dialog is confirmed. The selection of an option resolves the promise and leads to the
	 * processing of the originally triggered action like e.g. a back navigation.
	 *
	 */

	private handleDataLossOk(): void {
		this.promiseResolve(this.getSelectedKey());
	}

	/**
	 * Handler to close the dataloss dialog.
	 *
	 */
	private handleDataLossCancel(): void {
		this.promiseResolve("cancel");
	}

	/**
	 * Sets the focus on the first list item of the dialog.
	 *
	 */
	private selectAndFocusFirstEntry(): void {
		const firstListItemOption: CustomListItem = this.optionsList.current?.getItems()[0] as CustomListItem;
		this.optionsList.current?.setSelectedItem(firstListItemOption);
		// We do not set the focus on the button, but catch the ENTER key in the dialog
		// and process it as Ok, since focusing the button was reported as an ACC issue
		firstListItemOption?.focus();
	}

	/**
	 * Gets the key of the selected item from the list of options that was set via customData.
	 * @returns The key of the currently selected item
	 */
	private getSelectedKey(): string {
		const optionsList = this.optionsList.current as List;
		return optionsList.getSelectedItem().data("itemKey");
	}

	/**
	 * Returns the confirm button.
	 * @returns A button
	 */
	private getConfirmButton(): Button {
		return (
			<Button
				text={this.dataLossResourceModel.getText("C_COMMON_DIALOG_OK")}
				type={"Emphasized"}
				press={(): void => this.handleDataLossOk()}
			/>
		) as Button;
	}

	/**
	 * Returns the cancel button.
	 * @returns A button
	 */
	private getCancelButton(): Button {
		return (
			<Button
				text={
					this.isHiddenDraft
						? this.dataLossResourceModel.getText("C_COMMON_SAPFE_CLOSE")
						: this.dataLossResourceModel.getText("C_COMMON_DIALOG_CANCEL")
				}
				press={(): void => this.handleDataLossCancel()}
			/>
		) as Button;
	}

	/**
	 * Returns the options available in the dialog.
	 * @param isSave
	 * @returns The options as CustomListItems
	 */
	private getItems(isSave: boolean): CustomListItem[] {
		let createOrSaveText = "";
		let createOrSaveLabel = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_RBL");
		if (isSave) {
			createOrSaveText = this.isHiddenDraft
				? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_HIDDEN_DRAFT_TOL")
				: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_TOL");
		} else {
			createOrSaveLabel = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_RBL");
			createOrSaveText = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_TOL");
		}
		const items: CustomListItem[] = [];
		items.push(
			<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionSave" })]}>
				<VBox class="sapUiTinyMargin">
					<Label text={createOrSaveLabel} design="Bold" />
					<Text text={createOrSaveText} />
				</VBox>
			</CustomListItem>
		);

		// The option to keep the draft is not available for new drafts and if shallForceDraftSaveOrDiscard === true
		// (TreeTable in the ListReport)
		if ((isSave || !this.shallForceDraftSaveOrDiscard) && !this.isHiddenDraft) {
			items.push(
				<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionKeep" })]}>
					<VBox class="sapUiTinyMargin">
						<Label text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_RBL")} design="Bold" />
						<Text text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_TOL")} />
					</VBox>
				</CustomListItem>
			);
		}

		items.push(
			<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionDiscard" })]}>
				<VBox class="sapUiTinyMargin">
					<Label
						text={
							this.isHiddenDraft
								? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_HIDDEN_DRAFT_RBL")
								: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_RBL")
						}
						design="Bold"
					/>
					<Text text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_TOL")} />
				</VBox>
			</CustomListItem>
		);

		return items;
	}

	/**
	 * The building block render function.
	 * @returns An XML-based string
	 */
	createContent(): Dialog {
		const hasActiveEntity = this.view.getBindingContext()?.getObject().HasActiveEntity === true;
		const isSave = this.isHiddenDraft ? !this.isRootContextNew : hasActiveEntity;
		const description = isSave
			? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_SAVE")
			: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_CREATE");

		return (
			<Dialog
				id={generate([this.getId(), "draftDataLossDialog"])}
				title={this.dataLossResourceModel.getText("WARNING")}
				state={ValueState.Warning}
				type={"Message"}
				contentWidth={"22rem"}
				ref={this.dataLossDialog}
			>
				{{
					content: (
						<>
							<Text text={description} class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom" />
							<List
								mode="SingleSelectLeft"
								showSeparators="None"
								includeItemInSelection="true"
								backgroundDesign="Transparent"
								class="sapUiNoContentPadding"
								ref={this.optionsList}
								items={this.getItems(isSave)}
							/>
						</>
					),
					buttons: (
						<>
							confirmButton = {this.getConfirmButton()}
							cancelButton = {this.getCancelButton()}
						</>
					)
				}}
			</Dialog>
		) as Dialog;
	}
}

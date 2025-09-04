import type { FEView } from "sap/fe/core/BaseController";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Text from "sap/m/Text";
import { ValueState } from "sap/ui/core/library";

export default class BeforeActionDialog {
	public containingView!: FEView;

	public dialog!: Dialog;

	constructor(view: FEView) {
		this.containingView = view;
		this.dialog = (
			<Dialog title="{sap.fe.i18n>WARNING}" type="Message" state={ValueState.Warning}>
				{{ content: <Text text="{sap.fe.i18n>C_INLINE_EDIT_BEFOREACTION_MESSAGE}" /> }}
				{{
					beginButton: (
						<Button type="Emphasized" text="{sap.fe.i18n>C_INLINE_EDIT_DIALOG_SAVE}" press={(): void => this.closeAndSave()} />
					)
				}}
				{{ endButton: <Button text="{sap.fe.i18n>C_INLINE_EDIT_DIALOG_DISCARD}" press={(): void => this.closeAndDiscard()} /> }}
			</Dialog>
		);
		view.addDependent(this.dialog);
	}

	/**
	 * Open.
	 */
	public open(): void {
		this.dialog.open();
	}

	/**
	 * Close the dialog and call the inline edit discard.
	 */
	private closeAndDiscard(): void {
		this.dialog.close();
		this.containingView.getController().inlineEditFlow.inlineEditDiscard();
		this.dialog.destroy();
	}

	/**
	 * Close the dialog and call the inline edit save.
	 */
	private closeAndSave(): void {
		this.dialog.close();
		this.containingView.getController().inlineEditFlow.inlineEditSave();
		this.dialog.destroy();
	}
}

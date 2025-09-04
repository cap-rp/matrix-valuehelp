import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Bar from "sap/m/Bar";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Title from "sap/m/Title";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import type JSONModel from "sap/ui/model/json/JSONModel";

const macroResourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
@defineUI5Class("sap.fe.core.controllerextensions.dialog.OperationsDialog")
export default class OperationsDialog extends BuildingBlock {
	/*
	 * The 'id' property of the dialog
	 */
	@property({ type: "string", required: true })
	public id!: string;

	/**
	 * The 'title' property of the Dialog;
	 */
	@property({ type: "string" })
	public title?: string = "Dialog Standard Title";

	/**
	 * The message object that is provided to this dialog
	 */
	@property({ type: "object", required: true })
	public messageObject!: { messageView: Control; oBackButton: Button };

	@defineReference()
	operationsDialog!: Ref<Dialog>;

	@property({ type: "string", required: true })
	public actionName!: string;

	@property({ type: "string", required: true })
	public cancelButtonTxt!: string;

	@property({ type: "object", required: true })
	public messageDialogModel!: JSONModel;

	@property({ type: "function", required: true })
	public onBeginButtonPress?: Function;

	@property({ type: "function", required: true })
	public onEndButtonPress?: Function;

	@property({ type: "function", required: true })
	public onClose?: Function;

	constructor(props: PropertiesOf<OperationsDialog>) {
		super(props);
	}

	public open(): void {
		this.createContent();
		this.operationsDialog.current?.open();
	}

	private getBeginButton(): Button {
		return new Button({
			press: (): void => {
				this.onBeginButtonPress?.();
				this.messageDialogModel.setData({});
				this.close();
			},
			type: "Emphasized",
			text: this.actionName
		});
	}

	private close(): void {
		this.operationsDialog.current?.close();
		this.onClose?.();
	}

	private getTitle(): Title {
		const sTitle = macroResourceBundle.getText("M_WARNINGS");
		return new Title({ text: sTitle });
	}

	private getEndButton(): Button {
		return new Button({
			press: (): void => {
				this.onEndButtonPress?.();
				this.messageDialogModel.setData({});
				this.close();
			},
			text: this.cancelButtonTxt
		});
	}

	/**
	 * The building block render function.
	 * @returns An XML-based string with the definition of the field control
	 */
	createContent(): Dialog {
		return (
			<Dialog
				id={this.id}
				ref={this.operationsDialog}
				resizable={true}
				content={this.messageObject.messageView}
				state={"Warning"}
				customHeader={
					new Bar({
						contentLeft: [this.messageObject.oBackButton],
						contentMiddle: [this.getTitle()]
					})
				}
				contentHeight={"50%"}
				contentWidth={"50%"}
				verticalScrolling={false}
				beginButton={this.getBeginButton()}
				endButton={this.getEndButton()}
			></Dialog>
		) as Dialog;
	}
}

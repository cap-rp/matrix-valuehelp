import type { Action as EdmAction } from "@sap-ux/vocabularies-types";
import FELibrary from "sap/fe/core/library";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/odata/v4/Context";
import CommonUtils from "../../../CommonUtils";
import type MessageHandler from "../../MessageHandler";
import messageHandling, { type MessageWithHeader, type ShowMessageParameters } from "../../messageHandler/messageHandling";
import type { OperationResult } from "./ODataOperation";
import actionHelper from "./actionHelper";
const InvocationGrouping = FELibrary.InvocationGrouping;

/**
 * Manages the messages for an operation. The messages are displayed in a message box or dialog at
 * the end of the operation (after the strict handling workflow if it is configured). An instance
 * of this class is created for each fiori element operation (multi or single context) and not each
 * oData operation.
 */

export default class OperationMessage {
	private readonly table: Table | undefined;

	private isParameterDialogOpened = false;

	private is412toBeManaged = false;

	constructor(
		private readonly parameters: {
			messageHandler: MessageHandler;
			action: EdmAction;
			contexts: Context[];
			label?: string;
			invocationGrouping?: string;
			entitySetName?: string;
			events?: {
				onMessageCollected?: () => void;
				onMessagePageNavigationCallback?: () => void;
			};
			disableNotification?: boolean;
		}
	) {
		if (this.parameters.contexts.length) {
			const binding = this.parameters.contexts[0].getBinding();
			if (binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				this.table = ElementRegistry.filter(
					(element) => element.isA<Table>("sap.ui.mdc.Table") && element.getRowBinding() === binding
				)[0] as Table | undefined;
			}
		}
	}

	/**
	 * Handler to be called when the action parameter dialog is closed.
	 */
	onParameterDialogClosed(): void {
		this.isParameterDialogOpened = false;
	}

	/**
	 * Handler to be called when the action parameter dialog is opened.
	 */
	onParameterDialogOpened(): void {
		this.isParameterDialogOpened = true;
	}

	/**
	 * Handler to be called when the strict handling of an oData operation is triggered.
	 */
	onStrictHandling(): void {
		this.is412toBeManaged = true;
	}

	/**
	 * Reacts to the results of the operations by showing the messages in a message box or dialog.
	 * @param operationResults The results of the operations.
	 */
	public async reactToOperations(operationResults: PromiseSettledResult<OperationResult>[]): Promise<void> {
		if (this.parameters.disableNotification === true) {
			this.parameters.events?.onMessageCollected?.();
			return;
		}
		const isOperationDialogOpen = this.isParameterDialogOpened;
		await this.parameters.messageHandler.showMessages({
			isOperationDialogOpen: isOperationDialogOpen,
			messagePageNavigationCallback: () => {
				this.parameters.events?.onMessagePageNavigationCallback?.();
			},
			onBeforeShowMessage: (messages: Message[], showMessageParametersIn: ShowMessageParameters) => {
				return this.actionParameterShowMessageCallback(
					messages,
					showMessageParametersIn,
					!operationResults.some((res) => res.status === "rejected")
				);
			},
			aSelectedContexts: this.parameters.contexts,
			sActionName: this.parameters.label,
			entitySet: this.parameters.entitySetName,
			boundActionName: actionHelper.getActionName(this.parameters.action),
			control: this.table
		});
		this.parameters.messageHandler.clearStrictWarningMessages();
	}

	/**
	 * Indicates whether there is an error in the parameter dialog.
	 * @returns True if there is an error in the parameter dialog, otherwise false
	 */
	public isErrorIntoParameterDialog(): boolean {
		return !!this.getParameterDialogMessages().length;
	}

	/**
	 * Gets the messages related to the action parameter dialog.
	 * @param messages The messages to filter. If not provided, the messages are fetched from the message handling.
	 * @returns The messages related to the action parameter dialog.
	 */
	private getParameterDialogMessages(messages?: Message[]): Message[] {
		const actionName = actionHelper.getActionName(this.parameters.action);
		const actionParameters = actionHelper.getActionParameters(this.parameters.action);
		return (messages ?? messageHandling.getMessages(true, true)).filter(
			(message) =>
				message.getTargets()?.[0].includes(actionName) &&
				actionParameters.some((actionParam) => message.getTargets()?.[0].includes(actionParam.name))
		);
	}

	/**
	 * Callback function to show messages in a message box or dialog.
	 * @param messages The messages
	 * @param showMessageParametersIn The parameters for showing the message
	 * @param isActionSuccessful Indicates whether the action was successful
	 * @returns  The parameters for showing the message
	 */
	private actionParameterShowMessageCallback(
		messages: Message[],
		showMessageParametersIn: ShowMessageParameters,
		isActionSuccessful: boolean
	): ShowMessageParameters {
		const filterErrorOrWarning = (message: Message): boolean => ["Error", "Warning"].includes(message.getType());

		const messagesInModel = Messaging.getMessageModel().getData();
		const nonErrorMessageExistsInDialog = messages.findIndex(filterErrorOrWarning);
		const nonErrorMessageExistsInModel = messagesInModel.findIndex(filterErrorOrWarning);

		const isChangeSet = this.parameters.invocationGrouping === InvocationGrouping.ChangeSet;

		const parameterDialogMessages = this.getParameterDialogMessages(messages);
		const errorTargetsInAPD = !!parameterDialogMessages.length;

		let showMessageBox = showMessageParametersIn.showMessageBox,
			showMessageDialog = showMessageParametersIn.showMessageDialog;

		if (isChangeSet) {
			if (
				(this.is412toBeManaged || messageHandling.hasTransitionErrorsOrWarnings()) &&
				!errorTargetsInAPD &&
				!isActionSuccessful &&
				nonErrorMessageExistsInDialog !== 1 &&
				nonErrorMessageExistsInModel !== -1 && // this check is currently under discussion (may be a typo in the original code)
				this.parameters.contexts.length > 1
			) {
				const singleError = messagesInModel.length === 1;
				showMessageBox = singleError || messages.length === 1;
				showMessageDialog = !showMessageBox;
				messages.unshift(this.getGenericMsgForChangeSet(singleError));
			}
		} else if (!this.isParameterDialogOpened && errorTargetsInAPD) {
			// If APD is not open and there are messages related to APD, then show in the message dialog. since the parameter dialog
			// is closed on isolated mode
			showMessageDialog = true;
			messages = messages.concat(parameterDialogMessages);
		}

		this.parameters.events?.onMessageCollected?.();
		const { messagesToShow, containsBoundTransition, showMessageInDialog } = this.filterApdAndContextMessages(
			messages,
			errorTargetsInAPD
		);
		return {
			showMessageBox: showMessageBox,
			showMessageDialog: showMessageInDialog ?? showMessageDialog,
			filteredMessages: messagesToShow,
			fnGetMessageSubtitle: this.table
				? messageHandling.setMessageSubtitle.bind({}, this.table, this.parameters.contexts)
				: undefined,
			showChangeSetErrorDialog: isChangeSet,
			containsBoundTransistion: containsBoundTransition
		};
	}

	/**
	 *  Gets a generic message for a single error in a change set.
	 * @param singleError Indicates whether there is a single error.
	 * @returns The generic message.
	 */
	private getGenericMsgForChangeSet(singleError: boolean): MessageWithHeader {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
		const isEditable = (this.table && CommonUtils.getIsEditable(this.table)) ?? false;
		const singleMessage = resourceBundle.getText(`C_COMMON_DIALOG_CANCEL_SINGLE_ERROR_MESSAGE_TEXT${isEditable ? "_EDIT" : ""}`);
		return singleError
			? new Message({
					message: singleMessage,
					type: MessageType.Error,
					target: "",
					persistent: true,
					code: "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED",
					technicalDetails: {
						fe: {
							changeSetPreTextForSingleError: singleMessage
						}
					}
			  })
			: new Message({
					message: resourceBundle.getText("C_COMMON_DIALOG_CANCEL_ERROR_MESSAGES_TEXT"),
					type: MessageType.Error,
					target: "",
					persistent: true,
					code: "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED",
					description: resourceBundle.getText("C_COMMON_DIALOG_CANCEL_ERROR_MESSAGES_DETAIL_TEXT")
			  });
	}

	/**
	 * Filters an array of messages based on various conditions and returns an object containing the filtered messages and other properties.
	 * @param messages The messages to filter.
	 * @param errorTargetsInAPD Indicates whether error targets are in APD.
	 * @returns An object containing a boolean indicating whether the result contains a bound transition, an array of messages to show, and a boolean indicating whether to show the message in a dialog.
	 */
	private filterApdAndContextMessages(
		messages: Message[],
		errorTargetsInAPD: boolean
	): { containsBoundTransition: boolean | undefined; messagesToShow: Message[]; showMessageInDialog?: boolean } {
		const unboundMessages = messages.filter((message: Message) => {
			return message.getTargets()?.[0] === "";
		});
		const isOperationDialogOpen = this.isParameterDialogOpened;
		let showMessageDialog = true;
		if (isOperationDialogOpen && errorTargetsInAPD) {
			/* When APD is open, we need to remove the messages which are related to the object page context */
			messageHandling.removeContextMessagesfromModel(messages, this.parameters.contexts);
		}
		// Filter out messages which are not related to the action parameter dialog in the edit mode and display mode
		let containsBoundTransition;
		if (!(this.table && CommonUtils.getIsEditable(this.table))) {
			if (isOperationDialogOpen && errorTargetsInAPD) {
				if (unboundMessages.length === 0) {
					containsBoundTransition = false;
					showMessageDialog = false;
				}
				messages = messageHandling.removeMessagesForActionParameterDialog(messages);
			}
		} else {
			if (unboundMessages.length === 0) {
				containsBoundTransition = false;
			}
			messages = messageHandling.removeMessagesForActionParameterDialog(messages);
		}
		return {
			messagesToShow: messages,
			containsBoundTransition: containsBoundTransition,
			showMessageInDialog: showMessageDialog
		};
	}
}

import Log from "sap/base/Log";
import deepEqual from "sap/base/util/deepEqual";
import uid from "sap/base/util/uid";
import { defineUI5Class, extensible, finalExtension, privateExtension, publicExtension } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type {
	MessageTechnicalDetails,
	MessageUIDecisions,
	ShowMessageParameters,
	SupportedUIElement
} from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type Dialog from "sap/m/Dialog";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Context from "sap/ui/model/Context";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

type ObjectWithConverterType = object & {
	converterType: string;
};
type NavigationToErrorPageParameter = {
	customMessages?: CustomMessage[];
	concurrentEditFlag?: boolean;
	isDataReceivedError?: boolean;
	title?: string;
	description?: string;
	isInitialLoad503Error?: boolean;
};
export type NavigationToErrorPageResult = {
	title?: string;
	description?: string;
	errorType?: string;
	navigateBackToOrigin?: boolean;
	handleShellBack?: boolean;
};
export type CustomMessage = {
	code: string;
	text: string;
	persistent: boolean;
	type: MessageType;
};
export type ShowMessageDialogParameter = {
	customMessages?: CustomMessage[];
	isOperationDialogOpen?: boolean;
	context?: Context;
	concurrentEditFlag?: boolean;
	control?: Control;
	sActionName?: string;
	aSelectedContexts?: Context | Context[] | null;
	onBeforeShowMessage?: (messages: Message[], showMessageParameters: ShowMessageParameters) => ShowMessageParameters;
	unHoldKey?: string;
	overrideUIDecision?: boolean;
	showBoundStateMessages?: boolean;
	boundActionName?: string;
	entitySet?: string;
};

export type ShowMessagesParameters = ShowMessageDialogParameter & {
	messagePageNavigationCallback?: Function;
	shellBack?: Function | boolean;
	isDataReceivedError?: boolean;
	isInitialLoad503Error?: boolean;
	title?: string;
	description?: string;
};
/**
 *
 * Defines the message detail relevant for the MessageButton building block to display a popover.
 * @public
 */
export type MessageDetail = {
	message: Message;
	groupName?: string;
	activeTitleHandler?: Function;
};

/**
 * A controller extension offering message handling.
 * @hideconstructor
 * @public
 * @experimental As of version 1.90.0
 * @since 1.90.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.MessageHandler")
class MessageHandler extends ControllerExtension {
	private strictWarningMessages: Message[] = [];

	protected base!: PageController;

	protected holdKeys: string[] = [];

	protected uiDecisions: MessageUIDecisions | undefined;

	private holdMsgsToShow = false;

	// We await showMessageDialog until the UI element is available.
	private uiElementIsAvailable = Promise.resolve();

	constructor() {
		super();
	}

	/**
	 * Adds warning messages to the message handler.
	 * @param aMessages The strict warning messages to be added
	 */
	addWarningMessagesToMessageHandler(aMessages: Message[]): void {
		this.strictWarningMessages = this.strictWarningMessages.concat(aMessages);
	}

	/**
	 * Determines whether or not a message is a strict warning message that was received previously.
	 * @param oMessage The message to be checked
	 * @returns Whether or not the message is a strict warning message
	 */
	isStrictWarningMessage(oMessage: Message): boolean {
		return (
			this.strictWarningMessages.find((message) => {
				return (
					message.getCode() === oMessage.getCode() &&
					message.getMessage() === oMessage.getMessage() &&
					message.getType() === oMessage.getType() &&
					message.getDescriptionUrl() === oMessage.getDescriptionUrl() &&
					deepEqual(message.getTargets(), oMessage.getTargets()) &&
					message.getPersistent() === oMessage.getPersistent()
				);
			}) !== undefined
		);
	}

	/**
	 * Clears all strict warning messages from the message handler.
	 */
	clearStrictWarningMessages(): void {
		this.strictWarningMessages = [];
	}

	filterErrorMessages(messages: Message[]): Message[] {
		return messages.filter((message) => message.getType() === MessageType.Error);
	}

	/**
	 * Determines whether or not bound messages are shown in the message dialog.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
	 *
	 * If the bound messages are shown to the user with a different control like the (TODO:Link) MessageButton
	 * this method has to be overridden.
	 * @returns Determines whether or not bound messages are shown in the message dialog.
	 */
	@privateExtension()
	@extensible(OverrideExecution.Instead)
	getShowBoundMessagesInMessageDialog(): boolean {
		return true;
	}

	/**
	 * Allows consumer of a message button BB to decide which bound messages should be shown and how.
	 *
	 * This hook is called when the message button BB detects a change in the message model.
	 * The hooks allows to define behaviour for messages in the message button BB.
	 *
	 * Consumers will be able to do the following with this hook.
	 *
	 * 1. Filter out messages so that they are not shown on the message button.
	 * 2. group the messages based on their UI.
	 * 3. provide a presser handler incase the message should show as a link.
	 * @param _messageDetails Object containing the details related to the message.
	 * @param _messageDetails.message The message from the message model.Ideally, it must not be modified directly.
	 * @param _messageDetails.groupName The group name associated with the current message.
	 * @param _messageDetails.activeTitleHandler Function to handle the click event on a message in the MessageButton building block.
	 * @returns A promise that must be returned by the overridden method.
	 * @public
	 * @experimental
	 */
	@publicExtension()
	@extensible("AfterAsync")
	async beforeShowMessageButton(_messageDetails: MessageDetail[]): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Register to hold messages unitl a process is complete.
	 *
	 * The caller can register to hold the message handler from showing messages until the caller's processes are completed.
	 * On registering the caller is returned a unique key.
	 * The messages will not be shown in the UI with subsequent 'showMessageDialog()' calls.
	 * The caller needs to use 'showMessageDialog(<key>)' at the end of all his processes to show the messages in the UI.
	 *
	 * If multiple owners register simultaneously, then messages are shown in the UI only after 'showMessageDialog(<respective_key>)' is called by all the processes' owners.
	 * @param key Unique identifier to use, If not provided, a UID would be created and used to register.
	 * @returns Unique Key to be used by the caller to show messages at a later point of time.
	 */
	registerToHoldMessages(key?: string): string {
		const uniqueKey = key ?? uid();
		if (!this.holdKeys.includes(uniqueKey)) {
			this.holdKeys.push(uniqueKey);
		}
		return uniqueKey;
	}

	/**
	 * Clear all existing held keys.
	 */
	resetHoldKeys(): void {
		this.holdKeys = [];
	}

	/**
	 * Shows a message dialog with transition messages if there are any.
	 * The message dialog is shown as a modal dialog. Once the user confirms the dialog, all transition messages
	 * are removed from the message model. If there is more than one message, a list of messages is shown. The user
	 * can filter on message types and can display details as well as the long text. If there is one message,
	 * the dialog immediately shows the details of the message. If there is just one success message, a message
	 * toast is shown instead.
	 * @param mParameters PRIVATE
	 * @returns A promise that is resolved once the user closes the dialog. If there are no messages
	 * to be shown, the promise is resolved immediately
	 * @public
	 * @experimental As of version 1.90.0
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async showMessageDialog(mParameters?: ShowMessageDialogParameter): Promise<void> {
		// remove strict warning messages from the message model before showing the message dialog
		await this.uiElementIsAvailable;

		const messagesInModel = Messaging.getMessageModel().getData();
		const duplicateWarningMessage = messagesInModel.filter((message: Message) => {
			return this.isStrictWarningMessage(message);
		});
		Messaging.removeMessages(duplicateWarningMessage);

		const customMessages = mParameters && mParameters.customMessages ? mParameters.customMessages : undefined,
			oOPInternalBindingContext = this.base.getView().getBindingContext("internal") as InternalModelContext;
		const viewType = (this.base.getView().getViewData() as ObjectWithConverterType).converterType;
		// set isActionParameterDialog open so that it can be used in the controller extension to decide whether message dialog should open or not
		if (mParameters && mParameters.isOperationDialogOpen && oOPInternalBindingContext) {
			oOPInternalBindingContext.setProperty("isOperationDialogOpen", true);
		}
		const bShowBoundMessages = this.getShowBoundMessagesInMessageDialog();
		const oBindingContext = (
			mParameters && mParameters.context ? mParameters.context : this.getView().getBindingContext()
		) as ODataV4Context;
		//const bEtagMessage = mParameters && mParameters.bHasEtagMessage;
		// reset  isOperationDialogOpen
		// cannot do this operations.js since it is not aware of the view
		if (oOPInternalBindingContext) {
			oOPInternalBindingContext.setProperty("isOperationDialogOpen", false);
		}
		return new Promise<void>(
			function (this: MessageHandler, resolve: () => void, reject: () => void): void {
				// we have to set a timeout to be able to access the most recent messages
				setTimeout(
					function (this: MessageHandler): void {
						// TODO: great API - will be changed later
						this.processAndShowMessages(
							mParameters ?? {},
							oBindingContext,
							bShowBoundMessages,
							customMessages ?? [],
							resolve,
							reject,
							viewType
						);
					}.bind(this),
					0
				);
			}.bind(this)
		);
	}

	/**
	 * Process the messages and show them when expected.
	 *
	 * We filter the messages to show and hold them until all registered processes call showMessageDialog with their respective held keys.
	 * @param parameters Parameters to show message dialog.
	 * @param bindingContext Bind context of the page.
	 * @param showBoundTransitionMessages Should bound messages be shown.
	 * @param customMessages Custom messages to add.
	 * @param success Success callback.
	 * @param failure Failure callback.
	 * @param viewType View type, list report or object page.
	 */
	processAndShowMessages(
		parameters: ShowMessageDialogParameter,
		bindingContext: ODataV4Context,
		showBoundTransitionMessages: boolean,
		customMessages: CustomMessage[],
		success: () => void,
		failure: () => void,
		viewType?: string
	): void {
		const {
			concurrentEditFlag,
			control,
			sActionName,
			onBeforeShowMessage,
			unHoldKey,
			isOperationDialogOpen: forceShowUIElement = false,
			overrideUIDecision,
			showBoundStateMessages
		} = parameters;
		this.holdMsgsToShow = true;

		// Create a UI decision.
		const newUIDecisions = messageHandling.getUIDecisions(
			customMessages,
			bindingContext,
			showBoundTransitionMessages,
			concurrentEditFlag,
			control,
			sActionName,
			onBeforeShowMessage,
			viewType,
			showBoundStateMessages,
			parameters
		);
		this.updateUIDecisions(newUIDecisions, overrideUIDecision);
		this.removeHoldKey(unHoldKey ?? control?.getId());
		this.showMessagesWithCondtions(forceShowUIElement, success, failure);
	}

	/**
	 * Show Messages in the UI based on conditions.
	 * @param forceShowUIElement
	 * @param success
	 * @param failure
	 */
	async showMessagesWithCondtions(
		forceShowUIElement = false,
		success?: (ret?: unknown) => void,
		failure?: (err?: unknown) => void
	): Promise<void> {
		const showUIElement = forceShowUIElement || this.checkToShowUIElement();
		if (showUIElement && this.uiDecisions) {
			// Show UI element for the present decision and clear the decision.
			try {
				this.uiElementIsAvailable = messageHandling.showMessagesInUI(this.uiDecisions);
				const ret = await this.uiElementIsAvailable;
				success?.(ret);
			} catch (err: unknown) {
				Log.error(`FE : V4 : MessageHandler : Error on trying to show UI element: ${err}`);
				this.uiElementIsAvailable = Promise.resolve();
				failure?.(err);
			}
			this.uiDecisions = undefined;
			this.clearStrictWarningMessages();
			this.holdMsgsToShow = false;
		} else {
			Log.info("FE : V4 : MessageHandler : Holding messages until a registered process ");
			success?.();
		}
	}

	/**
	 * You can remove the existing transition message from the message model with this method.
	 * With every user interaction that causes server communication (like clicking on an action, changing data),
	 * this method removes the existing transition messages from the message model.
	 * @param [keepBoundMessage] Checks if the bound transition messages are not to be removed
	 * @param keepUnboundMessage
	 * @param sPathToBeRemoved
	 */
	@publicExtension()
	removeTransitionMessages(keepBoundMessage?: boolean, keepUnboundMessage?: boolean, sPathToBeRemoved?: string): void {
		if (!keepBoundMessage) {
			messageHandling.removeBoundTransitionMessages(sPathToBeRemoved);
		}
		if (!keepUnboundMessage) {
			messageHandling.removeUnboundTransitionMessages();
		}
	}

	/**
	 * Method that returns all the parameters needed to handle the navigation to the error page.
	 * @param mParameters
	 * @returns The parameters necessary for the navigation to the error page
	 */
	_checkNavigationToErrorPage(mParameters?: NavigationToErrorPageParameter): NavigationToErrorPageResult | undefined {
		const aUnboundMessages = messageHandling.getMessages();
		const bShowBoundTransitionMessages = this.getShowBoundMessagesInMessageDialog();
		const aBoundTransitionMessages = bShowBoundTransitionMessages ? messageHandling.getMessages(true, true) : [];
		const aCustomMessages = mParameters && mParameters.customMessages ? mParameters.customMessages : [];
		const bIsStickyEditMode = CommonUtils.isStickyEditMode(this.base.getView());
		let mMessagePageParameters: NavigationToErrorPageResult | undefined;

		// TODO: Stick mode check is okay as long as the controller extension is used with sap.fe.core and sap.fe.core.AppComponent.
		// It might be better to provide an extension to the consumer of the controller extension to provide this value.

		// The message page can only show 1 message today, so we navigate to it when :
		// 1. There are no bound transition messages to show,
		// 2. There are no custom messages to show, &
		// 3. There is exactly 1 unbound message in the message model with statusCode=503 and retry-After available
		// 4. retryAfter is greater than 120 seconds
		//
		// In Addition, navigating away from a sticky session will destroy the session so we do not navigate to message page for now.
		// TODO: check if navigation should be done in sticky edit mode.
		if (mParameters?.isDataReceivedError === true) {
			mMessagePageParameters = {
				title: mParameters.title,
				description: mParameters.description,
				navigateBackToOrigin: true,
				errorType: "PageNotFound"
			};
		} else if (
			!bIsStickyEditMode &&
			!aBoundTransitionMessages.length &&
			!aCustomMessages.length &&
			(aUnboundMessages.length === 1 || mParameters?.isInitialLoad503Error === true)
		) {
			const oMessage = aUnboundMessages[0];
			const oTechnicalDetails = oMessage.getTechnicalDetails() as MessageTechnicalDetails | undefined;
			if (oTechnicalDetails?.httpStatus === 503) {
				mMessagePageParameters = this._getHTTP503MessageParameters(oMessage, oTechnicalDetails);
			}
		}
		return mMessagePageParameters;
	}

	_getHTTP503MessageParameters(message: Message, technicalDetails: MessageTechnicalDetails): NavigationToErrorPageResult | undefined {
		let messagePageParameters: NavigationToErrorPageResult | undefined;

		const secondsBeforeRetry =
			technicalDetails.retryAfter !== undefined ? this._getSecondsBeforeRetryAfter(technicalDetails.retryAfter) : undefined;

		if (secondsBeforeRetry === undefined || secondsBeforeRetry > 120) {
			const retryAfterMessage = messageHandling.getRetryAfterMessage(message);
			messagePageParameters = {
				description: retryAfterMessage ? `${retryAfterMessage} ${message.getMessage()}` : message.getMessage(),
				navigateBackToOrigin: true,
				errorType: "UnableToLoad"
			};
		}

		return messagePageParameters;
	}

	_getSecondsBeforeRetryAfter(dRetryAfter: Date): number {
		const dCurrentDateTime = new Date(),
			iCurrentDateTimeInMilliSeconds = dCurrentDateTime.getTime(),
			iRetryAfterDateTimeInMilliSeconds = dRetryAfter.getTime(),
			iSecondsBeforeRetry = (iRetryAfterDateTimeInMilliSeconds - iCurrentDateTimeInMilliSeconds) / 1000;
		return iSecondsBeforeRetry;
	}

	/**
	 * Update the existing UI decisions with the new ones.
	 * @param newUIDecisions In comming UI decisions.
	 * @param overrideUIDecision Override the existing UI decision to show messages with the new one.
	 *
	 * 'overrideUIDecision', This would be needed when there is a change in page context and the paramters to create the new UI decision are different.
	 */
	updateUIDecisions(newUIDecisions: MessageUIDecisions, overrideUIDecision = false): void {
		const oldUIDecisions = this.uiDecisions;
		let allMessagesToShow: Message[] = [];
		let mergedUIDecision;
		if (oldUIDecisions && overrideUIDecision === false) {
			if (
				oldUIDecisions.messagesToShow.length === 1 &&
				newUIDecisions.messagesToShow.length === 1 &&
				oldUIDecisions.messagesToShow[0].getCode() === "C_COMMON_SUCCESS_MESSAGE" &&
				newUIDecisions.messagesToShow[0].getCode() === "C_COMMON_SUCCESS_MESSAGE"
			) {
				// Check if both are generic success messages, then we show only one message.
				allMessagesToShow = oldUIDecisions.messagesToShow;
			} else {
				allMessagesToShow = Array.from(new Set([...oldUIDecisions.messagesToShow, ...newUIDecisions.messagesToShow]));
			}
			const elements = [oldUIDecisions.uiElementToUse, newUIDecisions.uiElementToUse];
			// Default we show dialog
			let uiElementToUse: SupportedUIElement = allMessagesToShow.length > 0 ? "Dialog" : "None";

			if (allMessagesToShow.length === 1) {
				// Single message, we check for specific UI Element to use.
				if (elements.includes("Toast")) {
					uiElementToUse = "Toast";
				} else if (elements.includes("Box")) {
					uiElementToUse = "Box";
				}
			}

			mergedUIDecision = {
				messagesToShow: allMessagesToShow,
				uiElementToUse,
				contextNeedsEtagRefresh: oldUIDecisions.contextNeedsEtagRefresh || newUIDecisions.contextNeedsEtagRefresh,
				containsBoundTransition: oldUIDecisions.containsBoundTransition || newUIDecisions.containsBoundTransition
			};
		} else {
			mergedUIDecision = newUIDecisions;
		}

		this.uiDecisions = mergedUIDecision;
	}

	/**
	 * Remove held key.
	 * @param inKey Key to remove.
	 */
	removeHoldKey(inKey?: string): void {
		if (inKey && this.holdKeys.includes(inKey)) {
			this.holdKeys.splice(this.holdKeys.indexOf(inKey), 1);
		}
	}

	/**
	 * Check if UI Element with messages should be shown.
	 * @returns Boolean
	 */
	checkToShowUIElement(): boolean {
		return this.holdMsgsToShow && (this.holdKeys.length > 0 ? false : true);
	}

	/**
	 * Hold messages for the control.
	 * @param control
	 */
	holdMessagesForControl(control: Control): void {
		const identifier = control.getId();
		this.registerToHoldMessages(identifier);
	}

	/**
	 * Release message hold by a control.
	 * @param control
	 */
	async releaseHoldByControl(control?: Control): Promise<void> {
		const identifier = control?.getId();
		this.removeHoldKey(identifier);
		this.uiElementIsAvailable = this.uiElementIsAvailable.then(
			async function (this: MessageHandler): Promise<void> {
				return this.showMessagesWithCondtions();
			}.bind(this)
		);
		await this.uiElementIsAvailable;
	}

	/**
	 * Shows a message page or a message dialog based on the messages in the message dialog.
	 * @param [parameters]
	 * @returns A promise that is resolved once the user closes the message dialog or when navigation to the message page is complete. If there are no messages
	 * to be shown, the promise is resolved immediately
	 */
	@publicExtension()
	@finalExtension()
	async showMessages(parameters?: ShowMessagesParameters): Promise<void | boolean | Dialog> {
		const messagePageParameters = this._checkNavigationToErrorPage(parameters);

		if (messagePageParameters) {
			// navigate to message page.
			// handler before page navigation is triggered, for example to close the action parameter dialog
			if (parameters?.messagePageNavigationCallback) {
				parameters.messagePageNavigationCallback();
			}

			messagePageParameters.handleShellBack = !parameters?.shellBack;
			this.removeTransitionMessages();
			const oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;

			return new Promise<boolean>((resolve, reject) => {
				// we have to set a timeout to be able to access the most recent messages
				setTimeout(() => {
					// clear all hold keys as we navigate to message page.
					this.resetHoldKeys();

					// TODO: great API - will be changed later
					this.base._routing
						.navigateToMessagePage(
							parameters?.isDataReceivedError === true
								? oResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR")
								: oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE"),
							messagePageParameters
						)
						.then(resolve)
						.catch(reject);
				}, 0);
			});
		} else {
			// navigate to message dialog
			return this.showMessageDialog(parameters);
		}
	}
}
export default MessageHandler;

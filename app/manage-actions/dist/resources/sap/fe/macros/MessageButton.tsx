import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { MessageDetail } from "sap/fe/core/controllerextensions/MessageHandler";
import Button from "sap/m/Button";
import MessageItem from "sap/m/MessageItem";
import type { MessagePopover$ActiveTitlePressEvent } from "sap/m/MessagePopover";
import MessagePopover from "sap/m/MessagePopover";
import { ButtonType } from "sap/m/library";
import UI5Element from "sap/ui/core/Element";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type MessageModel from "sap/ui/model/message/MessageModel";

/**
 * Building block used to show bound messages.
 *
 * The Message Button Building Block gets the bound messages from the MessageModel.
 *
 * Usage example:
 *
 * <pre>
 * &lt;macros:MessageButton visibilityChange=".handler.onMessageButtonVisibilityChange" /&gt;
 * </pre>
 * @public
 * @experimental
 */
@defineUI5Class("sap.fe.macros.MessageButton")
export default class MessageButton extends BuildingBlock<Button> {
	/**
	 * The event is triggered when the message button's visibility changes.
	 * @public
	 */
	@event()
	visibilityChange!: Function;

	_messageModel!: MessageModel;

	_messagePopover!: MessagePopover;

	_messageItemMessageDetailMap: Record<string, MessageDetail> = {};

	constructor(idOrSettings?: string | PropertiesOf<MessageButton>, settings?: PropertiesOf<MessageButton>) {
		super(idOrSettings, settings);
	}
	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
		// get the message model and attach to it's change event.
		this._messageModel = Messaging.getMessageModel();
		this._messageModel.bindProperty("/").attachChange(this.processMessages, this);
		this.processMessages();
	}

	/**
	 * Processes messages in the message model.
	 *
	 * Filters out the bound and non technical messages from the message model
	 * And calls the MessageHandler.beforeShowMessageButton controller extension to allow consumers to adapt the messages that will be shown.
	 *
	 * Additionally, it adjusts the message button's proeprties based on the messages to be shown.
	 *
	 */
	async processMessages(): Promise<void> {
		const messages: Message[] = this._messageModel?.getData();

		// get bound messages.
		const messageDetails = messages.reduce((reducedMessages: MessageDetail[], message): MessageDetail[] => {
			const isBound = message.getTargets().length > 0;
			const isMessageTechnical = message.getTechnical();
			if (isBound && !isMessageTechnical) {
				reducedMessages.push({ message });
			}
			return reducedMessages;
		}, []);

		if (messageDetails && messageDetails.length > 0) {
			await this.getPageController().messageHandler.beforeShowMessageButton(messageDetails);
		}
		this.adjustMessageButtonProperties(messageDetails);
	}

	/**
	 * Adjusts the message button properties and creates a message popover to show the messages.
	 *
	 * Sets the messages buttons properties on the basis of messages to be shown.
	 * The properties of the messages button is determined on the basis of the priority of messages to be shown.
	 *
	 * Additionally, creates a message popover to show the messages.
	 * @param messageDetails Message details used to render each message item.
	 */
	adjustMessageButtonProperties(messageDetails: MessageDetail[]): void {
		this._messageItemMessageDetailMap = {};
		if (messageDetails && messageDetails.length > 0) {
			const messagePriorityMap = {
				Error: 0,
				Warning: 1,
				Success: 2,
				Information: 3,
				None: 4
			};

			let availableHighestPriority = messagePriorityMap.None; // we start from the lowest
			let errorCount = 0;
			const messageItems: MessageItem[] = [];
			for (const messageDetail of messageDetails) {
				const message = messageDetail.message;
				const messageType = message.getType();
				const messagePriority = messagePriorityMap[messageType];
				if (messagePriority < availableHighestPriority) {
					availableHighestPriority = messagePriority;
				}
				if (messageType === MessageType.Error) {
					errorCount++;
				}
				messageItems.push(this.createMessageItem(messageDetail));
			}

			// set properties on the message buttons

			// setText
			this.getContent()?.setText(messageDetails.length.toString());

			// setType
			const prioritizedButtonType = [
				ButtonType.Negative,
				ButtonType.Critical,
				ButtonType.Success,
				ButtonType.Neutral,
				ButtonType.Default
			];
			this.getContent()?.setType(prioritizedButtonType[availableHighestPriority]);

			// setTooltip
			const prioritizedToolTipKey = [
				"C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR",
				"C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_WARNING_TOOLTIP",
				"C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_SUCCESS",
				"C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO",
				""
			];
			const tooltipKey =
				errorCount > 1
					? "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_MULTIPLE_ERROR_TOOLTIP"
					: prioritizedToolTipKey[availableHighestPriority];
			let tooltipText = this.getTranslatedText(tooltipKey);
			if (errorCount > 1) {
				tooltipText = `${errorCount}  ${tooltipText}`;
			}
			this.getContent()?.setTooltip(tooltipText);

			// setVisible
			if (!this.getContent()?.getVisible()) {
				this.getContent()?.setVisible(true);
				this.fireEvent("visibilityChange", { visible: this.getContent()?.getVisible() });
			}

			// also show the message popover
			this.createMessagePopover(messageItems);
		}

		if (messageDetails.length === 0) {
			if (this.getContent()?.getVisible()) {
				this.getContent()?.setVisible(false);
				this.fireEvent("visibilityChange", { visible: this.getContent()?.getVisible() });
			}
		}
	}

	/**
	 * Creates a message Item.
	 * @param messageDetail Message detail relevant for creating the message item.
	 * @returns MessageItem created from Message Detail
	 */
	createMessageItem(messageDetail: MessageDetail): MessageItem {
		const message = messageDetail.message;
		const messageItem = (
			<MessageItem
				title={message.getMessage()}
				description={message.getDescription()}
				type={message.getType()}
				markupDescription={true}
				longtextUrl={message.getDescriptionUrl()}
				subtitle={message.getAdditionalText()}
				groupName={messageDetail.groupName || this.getTranslatedText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL")}
				activeTitle={message.getControlIds().length > 0 || typeof messageDetail.activeTitleHandler === "function"}
			/>
		) as MessageItem;
		this._messageItemMessageDetailMap[messageItem.getId()] = messageDetail;
		return messageItem;
	}

	/**
	 * Creates a message Popover.
	 * @param messageItems
	 */
	createMessagePopover(messageItems: MessageItem[]): void {
		this._messagePopover?.destroy();
		this._messagePopover = (
			<MessagePopover
				groupItems={true}
				activeTitlePress={(pressEvent: MessagePopover$ActiveTitlePressEvent): void => {
					const messageItem = pressEvent.getParameter("item");
					this.handleActiveTitlePress(messageItem);
				}}
			>
				{{
					items: messageItems
				}}
			</MessagePopover>
		) as MessagePopover;
		this.getContent()?.addDependent(this._messagePopover);
		setTimeout(() => {
			this._messagePopover.openBy(this.getContent() as Button);
		}, 0);
	}
	/**
	 * Handles active title press.
	 *
	 * If an activeTitleHandler is provided by the consumer via the controller extension then it is called.
	 * Otherwise, we try to focus on the control if a control Id in the message is available.
	 * @param messageItem
	 */
	handleActiveTitlePress(messageItem?: MessageItem): void {
		if (messageItem) {
			const messageDetail = this._messageItemMessageDetailMap[messageItem?.getId()];
			if (messageDetail.activeTitleHandler) {
				messageDetail.activeTitleHandler(messageDetail.message);
			} else {
				const controlId = messageDetail.message.getControlId();
				const control = UI5Element.getElementById(controlId);
				if (control) {
					control.focus();
				}
			}
		} else {
			Log.error("message item not found!");
		}
	}
	/**
	 * Toggle handler for the message popover.
	 */
	toggleMessagePopover(): void {
		this._messagePopover.toggle(this.content as Button);
	}
	/**
	 * Creates the content for the building block.
	 * @returns The created content control.
	 */
	createContent(): Button {
		return <Button visible="false" press={this.toggleMessagePopover.bind(this)} />;
	}
}

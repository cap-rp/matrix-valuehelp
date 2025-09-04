import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { CustomMessage, ShowMessageDialogParameter } from "sap/fe/core/controllerextensions/MessageHandler";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type Field from "sap/fe/macros/Field";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type { TableColumnProperties } from "sap/fe/macros/table/TableAPI";
import type TableDelegate from "sap/fe/macros/table/delegates/TableDelegate";
import Bar from "sap/m/Bar";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import FormattedText from "sap/m/FormattedText";
import MessageBox from "sap/m/MessageBox";
import MessageItem from "sap/m/MessageItem";
import MessageToast from "sap/m/MessageToast";
import MessageView from "sap/m/MessageView";
import type Table from "sap/m/Table";
import Text from "sap/m/Text";
import MLib from "sap/m/library";
import ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import IconPool from "sap/ui/core/IconPool";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import DateFormat from "sap/ui/core/format/DateFormat";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type View from "sap/ui/core/mvc/View";
import type MDCTable from "sap/ui/mdc/Table";
import type Column from "sap/ui/mdc/table/Column";
import type Binding from "sap/ui/model/Binding";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type MessageModel from "sap/ui/model/message/MessageModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type UITable from "sap/ui/table/Table";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageSection from "sap/uxap/ObjectPageSection";
import type ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type { AnnotationTableColumn, CustomBasedTableColumn, TableColumn } from "../../converters/controls/Common/table/Columns";

const ButtonType = MLib.ButtonType;
let aResolveFunctions: ((param1: void | Dialog) => void)[] = [];
let dialogControl: Dialog;
let oBackButton: Button;
let messageView: MessageView;

export type MessageWithHeader = Message & {
	headerName?: string;
	target?: string;
	additionalText?: string;
};

export type TargetTableInfoType = {
	oTableRowBindingContexts: ODataV4Context[];
	oTableRowContext: ODataV4Context | undefined;
	sTableTargetColName: string | undefined;
	sTableTargetColProperty: string | undefined;
	tableHeader?: string;
};

type ColInfoAndSubtitleType = {
	oTargetTableInfo: TargetTableInfoType;
	subTitle?: string | null;
};

type ColumnInfoType = {
	sColumnValue: string | undefined;
	sColumnIndicator: string;
};

export type SupportedUIElement = "Dialog" | "Box" | "Toast" | "None";

// FE related technical information to be stored with the message.
// Like, this would be used to store pre-text with the message when it is the only message to be shown in UI.
type FEMessageTechnicalDetails = object & {
	fe?: {
		changeSetPreTextForSingleError?: string;
		singleErrorPreText?: string;
		singleGenericMessageId?: string;
	};
};

export type MessageUIDecisions = {
	uiElementToUse: SupportedUIElement;
	messagesToShow: Message[];
	containsBoundTransition: boolean;
	contextNeedsEtagRefresh?: ODataV4Context;
};

export type messageHandlingType = {
	isNonTechnicalMessage: (message: Message) => boolean;
	getMessages: (bBoundMessages?: boolean, bTransitionOnly?: boolean, sPathToBeRemoved?: string) => Message[];
	hasTransitionErrorsOrWarnings(): boolean;
	getUIDecisions: (
		customMessages: CustomMessage[] | undefined,
		context: ODataV4Context,
		showBoundTransition?: boolean,
		concurrentEditFlag?: boolean,
		control?: Control,
		actionName?: string | undefined,
		onBeforeShowMessage?: (messages: Message[], showMessageParameters: ShowMessageParameters) => ShowMessageParameters,
		viewType?: string,
		showStateMessages?: boolean,
		messageDialogParameter?: ShowMessageDialogParameter
	) => MessageUIDecisions;
	showMessagesInUI: (uiDecision: MessageUIDecisions) => Promise<void>;
	removeUnboundTransitionMessages: () => void;
	modifyETagMessagesOnly: (oResourceBundle: ResourceBundle, concurrentEditFlag: boolean | undefined) => boolean;
	removeBoundTransitionMessages: (sPathToBeRemoved?: string) => void;
	getRetryAfterMessage: (oMessage: Message, bMessageDialog?: true) => string | undefined;
	prepareMessageViewForDialog: (
		oMessageDialogModel: JSONModel,
		bStrictHandlingFlow: boolean,
		isMulti412?: boolean
	) => {
		messageView: MessageView;
		oBackButton: Button;
	};
	setMessageSubtitle: (oTable: MDCTable, aContexts: Context[], message: MessageWithHeader) => void;
	getVisibleSectionsFromObjectPageLayout: (oObjectPageLayout: Control) => ObjectPageSection[];
	getControlFromMessageRelatingToSubSection: (subSection: ObjectPageSubSection, oMessageObject: MessageWithHeader) => UI5Element[];
	fnFilterUponIds: (aControlIds: string[], oItem: UI5Element) => boolean;
	getTableAndTargetInfo: (
		oTable: MDCTable,
		oMessageObject: MessageWithHeader,
		oElement: UI5Element | undefined,
		oRowBinding: Binding
	) => TargetTableInfoType;
	createSectionGroupName: (
		section: ObjectPageSection,
		subSection: ObjectPageSubSection,
		bMultipleSubSections: boolean,
		oTargetTableInfo: TargetTableInfoType,
		resourceModel: ResourceModel,
		includeTableGroupName?: boolean
	) => string;
	bIsOrphanElement: (oElement: UI5Element, aElements: UI5Element[]) => boolean;
	getLastActionTextAndActionName: (sActionName: string | undefined) => string;
	getTableColumnDataAndSetSubtile: (
		aMessage: MessageWithHeader,
		oTable: MDCTable,
		oElement: UI5Element | undefined,
		oRowBinding: Binding,
		sActionName: string | undefined,
		setSectionNameInGroup: boolean,
		fnCallbackSetGroupName: Function
	) => ColInfoAndSubtitleType;
	getTableColInfo: (
		oTable: MDCTable,
		sTableTargetColProperty: string
	) => { sTableTargetColName: string | undefined; sTableTargetColProperty: string | undefined };
	getTableColProperty: (oTable: Control, oMessageObject: MessageWithHeader, oContextPath?: string | RegExp) => string;
	getMessageSubtitle: (
		message: MessageWithHeader,
		oTableRowBindingContexts: ODataV4Context[],
		oTableRowContext: ODataV4Context | undefined,
		sTableTargetColName: string | undefined,
		oTable: MDCTable,
		bIsCreationRow: boolean | undefined,
		oTargetedControl?: Control
	) => string | null | undefined;
	determineColumnInfo: (oColFromTableSettings: TableColumn | undefined, resourceModel: ResourceModel) => ColumnInfoType;
	fetchColumnInfo: (oMessage: MessageWithHeader, oTable: MDCTable) => TableColumn | undefined;
	getTableColBindingContextForTextAnnotation: (
		table: MDCTable,
		tableRowContext: ODataV4Context | undefined,
		tableColProperty: TableColumnProperties
	) => Context | null | undefined;
	getMessageRank: (obj: MessageWithHeader) => number;
	fnCallbackSetGroupName: (aMessage: MessageWithHeader, sActionName: string | undefined, bIsGeneralGroupName?: boolean) => void;
	setGroupNameOPDisplayMode: (aModelData: MessageWithHeader, sActionName: string | undefined, control: View) => void;
	updateMessageObjectGroupName: (
		messagesToShow: MessageWithHeader[],
		control: Control | undefined,
		sActionName: string | undefined,
		viewType: string | undefined
	) => void;
	setGroupNameLRTable: (control: Control | undefined, aModelData: MessageWithHeader, sActionName: string | undefined) => void;
	isControlInTable: (oTable: MDCTable, sControlId: string) => UI5Element[] | boolean;
	isControlPartOfCreationRow: (oControl: UI5Element | undefined) => boolean;
	removeMessageShownInMessageStrip: (transientMessages: Message[], context: Context) => Message[];
	getFiltersForMessages: (showBoundTransition: boolean, showStateMessages?: boolean) => Filter[];
	showMessageToast: (message: Message) => Promise<void>;
	showMessageDialogControl: (uiDecisions: MessageUIDecisions, runToTest?: boolean) => Promise<void | Dialog>;
	showMessageBoxControl: (uiDecisions: MessageUIDecisions) => Promise<void>;
	getMessagesForContext: (context: ODataV4Context) => Message[];
	isMessageOutOfParameterDialog: (aControlIds: string[]) => boolean;
	removeContextMessagesfromModel: (messages?: Message[], context?: Context[]) => void;
	removeMessagesForActionParameterDialog: (Messages: Message[]) => Message[];
	setGroupNameOPTableDisplayMode(
		subsection: ObjectPageSubSection,
		mdcTable: MDCTable,
		message: MessageWithHeader,
		viewContext: Context | null | undefined,
		groupNameIsGeneral: boolean,
		actionName?: string
	): boolean;
	updateAddtionalTextForMessageInOPTable(mdcTable: MDCTable, message: MessageWithHeader, targetTableInfo: TargetTableInfoType): void;
	updateHeaderNameForMessageInOPTable(
		subsection: ObjectPageSubSection,
		mdcTable: MDCTable,
		message: MessageWithHeader,
		targetTableInfo: TargetTableInfoType
	): void;
	closeMessageBox(messageShown: MessageWithHeader, callBack: (value: void) => void, singleGenericMessageId: string): void;
	removeTransistionMessageForContext: (oContext: Context) => void;
	checkIfAllAreSameSuccessMessages: (messagesToShow: MessageWithHeader[]) => boolean;
	addGenericSuccessMessage: (
		resourceModel: ResourceModel,
		showMessageDialogParameter?: ShowMessageDialogParameter
	) => MessageWithHeader | undefined;
};

function fnFormatTechnicalDetails(): string {
	let sPreviousGroupName: string;

	// Insert technical detail if it exists
	function insertDetail(oProperty: { groupName: string; property: string }): string {
		return oProperty.property
			? "( ${" +
					oProperty.property +
					'} ? ("<p>' +
					oProperty.property.substring(Math.max(oProperty.property.lastIndexOf("/"), oProperty.property.lastIndexOf(".")) + 1) +
					' : " + ' +
					"${" +
					oProperty.property +
					'} + "</p>") : "" )'
			: "";
	}
	// Insert groupname if it exists
	function insertGroupName(oProperty: { groupName: string; property: string }): string {
		let sHTML = "";
		if (oProperty.groupName && oProperty.property && oProperty.groupName !== sPreviousGroupName) {
			sHTML += "( ${" + oProperty.property + '} ? "<br><h3>' + oProperty.groupName + '</h3>" : "" ) + ';
			sPreviousGroupName = oProperty.groupName;
		}
		return sHTML;
	}

	// List of technical details to be shown
	function getPaths(): { groupName: string; property: string }[] {
		const sTD = "technicalDetails"; // name of property in message model data for technical details
		return [
			{ groupName: "", property: `${sTD}/status` },
			{ groupName: "", property: `${sTD}/statusText` },
			{ groupName: "Application", property: `${sTD}/error/@SAP__common.Application/ComponentId` },
			{ groupName: "Application", property: `${sTD}/error/@SAP__common.Application/ServiceId` },
			{ groupName: "Application", property: `${sTD}/error/@SAP__common.Application/ServiceRepository` },
			{ groupName: "Application", property: `${sTD}/error/@SAP__common.Application/ServiceVersion` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.ErrorResolution/Analysis` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.ErrorResolution/Note` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.ErrorResolution/DetailedNote` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.ExceptionCategory` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.TimeStamp` },
			{ groupName: "ErrorResolution", property: `${sTD}/error/@SAP__common.TransactionId` },
			{ groupName: "Messages", property: `${sTD}/error/code` },
			{ groupName: "Messages", property: `${sTD}/error/message` }
		];
	}

	let sHTML = "Object.keys(" + "${technicalDetails}" + ').length > 0 ? "<h2>Technical Details</h2>" : "" ';
	getPaths().forEach(function (oProperty: { groupName: string; property: string }) {
		sHTML = `${sHTML + insertGroupName(oProperty)}${insertDetail(oProperty)} + `;
	});
	return sHTML;
}
function fnFormatDescription(): string {
	return "(${" + "description} ? (${" + 'description}) : "")';
}
/**
 * Calculates the highest priority message type(Error/Warning/Success/Information) from the available messages.
 * @param [aMessages] Messages list
 * @returns Highest priority message from the available messages
 */
function fnGetHighestMessagePriority(aMessages: MessageItem[]): MessageType {
	let sMessagePriority = MessageType.None;
	const iLength = aMessages.length;
	const oMessageCount = { Error: 0, Warning: 0, Success: 0, Information: 0 };

	for (let i = 0; i < iLength; i++) {
		++oMessageCount[aMessages[i].getType() as keyof typeof oMessageCount];
	}
	if (oMessageCount[MessageType.Error] > 0) {
		sMessagePriority = MessageType.Error;
	} else if (oMessageCount[MessageType.Warning] > 0) {
		sMessagePriority = MessageType.Warning;
	} else if (oMessageCount[MessageType.Success] > 0) {
		sMessagePriority = MessageType.Success;
	} else if (oMessageCount[MessageType.Information] > 0) {
		sMessagePriority = MessageType.Information;
	}
	return sMessagePriority;
}
// function which modify e-Tag messages only.
// returns : true, if any e-Tag message is modified, otherwise false.
function fnModifyETagMessagesOnly(oResourceBundle: ResourceBundle, concurrentEditFlag: boolean | undefined): boolean {
	const aMessages = Messaging.getMessageModel().getObject("/");
	let bMessagesModified = false;
	let sEtagMessage = "";
	aMessages.forEach(function (oMessage: Message, i: number) {
		const oTechnicalDetails = oMessage.getTechnicalDetails && (oMessage.getTechnicalDetails() as MessageTechnicalDetails);
		if (oTechnicalDetails && oTechnicalDetails.httpStatus === 412 && oTechnicalDetails.isConcurrentModification) {
			if (concurrentEditFlag) {
				sEtagMessage =
					sEtagMessage || oResourceBundle.getText("C_APP_COMPONENT_SAPFE_ETAG_TECHNICAL_ISSUES_CONCURRENT_MODIFICATION");
			} else {
				sEtagMessage = sEtagMessage || oResourceBundle.getText("C_APP_COMPONENT_SAPFE_ETAG_TECHNICAL_ISSUES");
			}
			Messaging.removeMessages(aMessages[i]);
			oMessage.setMessage(sEtagMessage);
			oMessage.setTargets([""]);
			Messaging.addMessages(oMessage);
			bMessagesModified = true;
		}
	});
	return bMessagesModified;
}
// Dialog close Handling
function dialogCloseHandler(): void {
	dialogControl.close();
	oBackButton.setVisible(false);
	const msgView = dialogControl.getContent()[0] as MessageView;
	const oMessageDialogModel = msgView.getModel() as JSONModel | undefined;
	if (oMessageDialogModel) {
		oMessageDialogModel.setData({});
	}
	removeUnboundTransitionMessages();
}
function getRetryAfterMessage(oMessage: Message, bMessageDialog?: boolean): string | undefined {
	const dNow = new Date();
	const oTechnicalDetails = oMessage.getTechnicalDetails() as MessageTechnicalDetails | undefined;
	const oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
	let sRetryAfterMessage;
	if (oTechnicalDetails && oTechnicalDetails.httpStatus === 503 && oTechnicalDetails.retryAfter) {
		const dRetryAfter = oTechnicalDetails.retryAfter;
		let oDateFormat;
		if (dNow.getFullYear() !== dRetryAfter.getFullYear()) {
			//different years
			oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "MMMM dd, yyyy 'at' hh:mm a"
			});
			sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR", [oDateFormat.format(dRetryAfter)]);
		} else if (dNow.getFullYear() == dRetryAfter.getFullYear()) {
			//same year
			if (bMessageDialog) {
				//less than 2 min
				sRetryAfterMessage = `${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE")} ${oResourceBundle.getText(
					"C_MESSAGE_HANDLING_SAPFE_503_DESC"
				)}`;
			} else if (dNow.getMonth() !== dRetryAfter.getMonth() || dNow.getDate() !== dRetryAfter.getDate()) {
				oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "MMMM dd 'at' hh:mm a"
				}); //different months or different days of same month
				sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR", [oDateFormat.format(dRetryAfter)]);
			} else {
				//same day
				oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "hh:mm a"
				});
				sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR_DAY", [oDateFormat.format(dRetryAfter)]);
			}
		}
	}

	if (oTechnicalDetails && oTechnicalDetails.httpStatus === 503 && !oTechnicalDetails.retryAfter) {
		sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR_NO_RETRY_AFTER");
	}
	return sRetryAfterMessage;
}

/**
 * Checks if there are any warning or error messages(bound and unbound)..
 * @returns Boolean indicating existence of messages
 */
function hasTransitionErrorsOrWarnings(): boolean {
	return [...getMessages(undefined, true), ...getMessages(true, true)].some(function (message: Message) {
		return message.getType() === "Error" || message.getType() === "Warning";
	});
}

function prepareMessageViewForDialog(
	oMessageDialogModel: JSONModel,
	bStrictHandlingFlow: boolean,
	multi412?: boolean
): {
	messageView: MessageView;
	oBackButton: Button;
} {
	let oMessageTemplate: MessageItem;
	if (!bStrictHandlingFlow) {
		const descriptionBinding = '{= ${description} ? "<html><body>" + ' + fnFormatDescription() + ' + "</html></body>" : "" }';
		const technicalDetailsBinding =
			'{= ${technicalDetails} ? "<html><body>" + ' + fnFormatTechnicalDetails() + ' + "</html></body>" : "" }';
		oMessageTemplate = new MessageItem(undefined, {
			counter: { path: "counter" },
			title: "{message}",
			subtitle: "{additionalText}",
			longtextUrl: "{descriptionUrl}",
			type: { path: "type" },
			groupName: "{headerName}",
			description: descriptionBinding + technicalDetailsBinding,
			markupDescription: true
		});
	} else if (multi412) {
		oMessageTemplate = new MessageItem(undefined, {
			counter: { path: "counter" },
			title: "{message}",
			subtitle: "{additionalText}",
			longtextUrl: "{descriptionUrl}",
			type: { path: "type" },
			description: "{description}",
			markupDescription: true
		});
	} else {
		oMessageTemplate = new MessageItem({
			title: "{message}",
			type: { path: "type" },
			longtextUrl: "{descriptionUrl}"
		});
	}
	messageView = new MessageView({
		showDetailsPageHeader: false,
		itemSelect: function (): void {
			oBackButton.setVisible(true);
		},
		items: {
			path: "/",
			template: oMessageTemplate,
			length: 9999
		}
	});
	messageView.setGroupItems(true);
	oBackButton =
		oBackButton ||
		new Button({
			icon: IconPool.getIconURI("nav-back"),
			visible: false,
			press: function (this: Button): void {
				messageView.navigateBack();
				this.setVisible(false);
			}
		});
	// Update proper ETag Mismatch error
	messageView.setModel(oMessageDialogModel);
	return {
		messageView,
		oBackButton
	};
}

export type ShowMessageParameters = {
	showMessageBox?: boolean;
	showMessageDialog?: boolean;
	showChangeSetErrorDialog?: boolean;
	filteredMessages?: Message[];
	fnGetMessageSubtitle?: Function;
	containsBoundTransistion?: boolean;
};

function isNonTechnicalMessage(message: Message): boolean {
	const technicalDetails = message.getTechnicalDetails() as MessageTechnicalDetails | undefined;
	if (
		(technicalDetails &&
			((technicalDetails.originalMessage !== undefined && technicalDetails.originalMessage !== null) ||
				(technicalDetails.httpStatus !== undefined && technicalDetails.httpStatus !== null))) ||
		message.getCode()
	) {
		return true;
	}
	return false;
}

/**
 * Get transition messages for creating the UI decision to show messages.
 * @param showBoundTransition Should bound transition messages be shown.
 * @param _context Binding context of the page.
 * @returns Transition messages relevant to show in UI.
 */
function getTransitionMessagesForUIDecision(this: messageHandlingType, showBoundTransition: boolean, _context: ODataV4Context): Message[] {
	let transitionMessages = this.getMessages();
	if (showBoundTransition) {
		//bound Transistion Messages
		transitionMessages = transitionMessages.concat(this.getMessages(true, true));
	}
	return transitionMessages;
}

/**
 * Execute 'onBeforeShowMessages' callback to let the caller influence the UI decision to show messages.
 * @param transitionMessages Transition messages.
 * @param onBeforeShowMessage Callback.
 * @returns ShowMessageParameters Infromation to change UI decision based on onBeforeShowMessages callback implementation.
 */
function executeOnBeforeShowMessages(
	transitionMessages: MessageWithHeader[],
	onBeforeShowMessage?: (messages: Message[], showMessageParameters: ShowMessageParameters) => ShowMessageParameters
): {
	uiElementToUse: SupportedUIElement;
	messagesToShow: MessageWithHeader[];
	fnGetMessageSubtitle?: Function;
	showChangeSetErrorDialog?: boolean;
	containsBoundTransition?: boolean;
} {
	let messagesToShow = [...transitionMessages];
	let uiElementToUse: SupportedUIElement =
		transitionMessages.length === 1 && transitionMessages[0].getCode() === "503" ? "Box" : "Dialog";
	let fnGetMsgSubtitle: Function | undefined;
	let showBoundMessages: boolean | undefined;

	if (onBeforeShowMessage) {
		// The callback onBeforeShowMessage alters the UIElement to use in a different format(showMessageDialog and showMessageBox).
		const showMessageParameters: ShowMessageParameters = {
			showMessageDialog: uiElementToUse === "Dialog",
			showMessageBox: uiElementToUse === "Box"
		};
		const {
			showMessageBox,
			showMessageDialog,
			showChangeSetErrorDialog,
			filteredMessages,
			fnGetMessageSubtitle,
			containsBoundTransistion
		} = onBeforeShowMessage(transitionMessages, showMessageParameters);
		if (showMessageBox === true) {
			uiElementToUse = "Box";
		} else if (showMessageDialog === true) {
			uiElementToUse = "Dialog";
		} else {
			uiElementToUse = "None";
		}
		showBoundMessages = containsBoundTransistion;
		fnGetMsgSubtitle = fnGetMessageSubtitle;
		if (showChangeSetErrorDialog || containsBoundTransistion === false) {
			messagesToShow = filteredMessages ?? [];
		}
	}

	return {
		uiElementToUse,
		messagesToShow,
		fnGetMessageSubtitle: fnGetMsgSubtitle,
		containsBoundTransition: showBoundMessages
	};
}

/**
 * Create UI decisions for showing messages.
 *
 * These shall contain the messages to show and the UI element to use.
 * It would also hold information for after process like..
 * 1. refresh context due to etag mismatch.
 * 2. do we show bound messages and hence clear them after we show the UI element.
 * @param customMessages Custom messages to add to message model and show.
 * @param context Binding context of the page.
 * @param showBoundTransition Should bound transition messages be shown.
 * @param concurrentEditFlag Is this a concurrent edit scenario.
 * @param control Source control.
 * @param actionName Name of the action whose process requested for messages to be shown.
 * @param onBeforeShowMessage Callback to influence UI decision before creating final UI decision.
 * @param viewType View type, list report or object page.
 * @param showStateMessages Should state messages be shown.
 * @param messageDialogParameter
 * @returns UI decisions used to show messages.
 */
function getUIDecisions(
	this: messageHandlingType,
	customMessages: CustomMessage[] | undefined,
	context: ODataV4Context,
	showBoundTransition = false,
	concurrentEditFlag?: boolean,
	control?: Control,
	actionName?: string | undefined,
	onBeforeShowMessage?: (messages: Message[], showMessageParameters: ShowMessageParameters) => ShowMessageParameters,
	viewType?: string,
	showStateMessages = false,
	messageDialogParameter?: ShowMessageDialogParameter
): MessageUIDecisions {
	// Add Custom messages
	// TODO: Will these messages be part of transitionMessages?
	if (customMessages && customMessages.length) {
		addCustomMessages(customMessages);
	}

	// Get transistion Messages
	const transitionMessages = getTransitionMessagesForUIDecision.call(this, showBoundTransition, context);

	// UI representation of the Dialog
	const uiDecisionIntermittent = executeOnBeforeShowMessages.call(this, transitionMessages, onBeforeShowMessage);
	let { messagesToShow, uiElementToUse = "Dialog" } = uiDecisionIntermittent;
	// Get Filters for Unbound Messages
	showBoundTransition = uiDecisionIntermittent.containsBoundTransition ?? showBoundTransition;
	const filters = getFiltersForMessages(showBoundTransition, showStateMessages);
	messagesToShow = getMessagesToShow(filters, messagesToShow ?? []);
	// handle context bound messages, If there is a single message of which is bounded to the context then remove that from the dialog
	messagesToShow = removeMessageShownInMessageStrip(messagesToShow, context);
	({ messagesToShow, uiElementToUse } = processMessagesFromChangesetFailure({ messagesToShow, uiElementToUse }));
	// Modify ETag Messages
	const hasEtagMessage = this.modifyETagMessagesOnly(Library.getResourceBundleFor("sap.fe.core")!, concurrentEditFlag);

	if (messagesToShow.length > 0 && uiElementToUse !== "None") {
		if (messagesToShow.length > 1 && checkIfAllAreSameSuccessMessages(messagesToShow)) {
			const genericSuccessMessage = addGenericSuccessMessage(getResourceModel(control as Control), messageDialogParameter);
			messagesToShow = genericSuccessMessage ? [genericSuccessMessage] : [messagesToShow[0]];
		}
		if (messagesToShow.length === 1) {
			const messageToShow = messagesToShow[0];
			if (messageToShow.getType() === MessageType.Success) {
				uiElementToUse = "Toast";
			} else if (hasEtagMessage || messageToShow.getDescription()?.length || messageToShow.getDescriptionUrl()?.length) {
				uiElementToUse = "Dialog";
			} else {
				// We would show single message in message box only when:
				// 1. It is not an Etag message.
				// 2. There is no message description or description url available for long text.
				uiElementToUse = "Box";
			}
		}
		messageHandling.updateMessageObjectGroupName(messagesToShow, control, actionName, viewType);
		const fnGetMessageSubtitle = uiDecisionIntermittent.fnGetMessageSubtitle;
		if (fnGetMessageSubtitle) {
			messagesToShow.forEach(function (oMessage: Message) {
				fnGetMessageSubtitle(oMessage);
			});
		}
	}

	return {
		messagesToShow,
		uiElementToUse,
		contextNeedsEtagRefresh: hasEtagMessage ? context : undefined,
		containsBoundTransition: showBoundTransition
	};
}

/**
 * Adding a generic success message to message model for readability.
 * @param resourceModel Resource model for message text
 * @param showMessageDialogParameter Selected contexts for which the message is shown.
 * @returns Message with generic success message.
 */
function addGenericSuccessMessage(
	resourceModel: ResourceModel,
	showMessageDialogParameter?: ShowMessageDialogParameter
): MessageWithHeader | undefined {
	const selectionContexts = showMessageDialogParameter?.aSelectedContexts;
	if (selectionContexts && Array.isArray(selectionContexts) && selectionContexts?.length > 1 && resourceModel) {
		let actionName = showMessageDialogParameter?.boundActionName;
		const entitySetName = showMessageDialogParameter?.entitySet;
		actionName = actionName?.includes(".") ? actionName?.split(".")[actionName?.split(".").length - 1] : actionName;
		const suffixResourceKey = actionName && entitySetName ? `${entitySetName}|${actionName}` : "";
		return new Message({
			message: resourceModel.getText("C_COMMON_SUCCESS_MESSAGE", [selectionContexts?.length], suffixResourceKey),
			type: MessageType.Success,
			target: "",
			persistent: true,
			code: "C_COMMON_SUCCESS_MESSAGE"
		});
	}
}
/**
 * Check is all are same success messages.
 * @param messagesToShow Initial messages to show.
 * @returns If all are same success messages.
 */
function checkIfAllAreSameSuccessMessages(messagesToShow: MessageWithHeader[]): boolean {
	let referenceMsg: MessageWithHeader;
	const checkFailed = messagesToShow.some((msg, idx) => {
		if (msg.getType() !== MessageType.Success) {
			// Non success message
			return true;
		}
		if (idx === 0) {
			// 1st Message
			referenceMsg = msg;
			return false;
		} else if (
			referenceMsg.getCode() === msg.getCode() &&
			referenceMsg.getMessage() === msg.getMessage() &&
			referenceMsg.getDescription() === msg.getDescription() &&
			referenceMsg.getDescriptionUrl() === msg.getDescriptionUrl() &&
			referenceMsg.getAdditionalText() === msg.getAdditionalText()
		) {
			return false;
		}
		return true;
	});

	return !checkFailed;
}

/**
 * Show messages in the decided UI Element.
 * @param uiDecisions UI Decision to be used to show the messages.
 * @returns Promise that resolves or rejects based on user interaction with the UI element.
 */
async function showMessagesInUI(uiDecisions: MessageUIDecisions): Promise<void> {
	const { messagesToShow, uiElementToUse } = uiDecisions;

	// Show Dialog / MessageBox / MessageToast
	if (messagesToShow.length === 0) {
		// Don't show the popup if there are no messages
		return Promise.resolve(undefined);
	} else if (uiElementToUse === "Toast") {
		return messageHandling.showMessageToast(messagesToShow[0]);
	} else if (uiElementToUse === "Dialog") {
		await messageHandling.showMessageDialogControl(uiDecisions);
		return Promise.resolve(undefined);
	} else if (uiElementToUse === "Box") {
		return messageHandling.showMessageBoxControl(uiDecisions);
	} else {
		return Promise.resolve(undefined);
	}
}

/**
 * Get model filters for getting the relevant messages.
 * @param showBoundTransition Should bound transition messages be shown.
 * @param showStateMessages Should state messages be shown.
 * @returns Model filters
 */
function getFiltersForMessages(showBoundTransition: boolean, showStateMessages = false): Filter[] {
	const filters = showStateMessages ? [] : [new Filter({ path: "persistent", operator: FilterOperator.NE, value1: false })];
	const isNonTechnicalMessageFilter = new Filter({ path: "", test: isNonTechnicalMessage });

	if (showStateMessages || showBoundTransition) {
		// Add the filter for both state messages or bound transition messages
		const fnCheckControlIdInDialog = function (aControlIds: string[]): boolean {
			return messageHandling.isMessageOutOfParameterDialog(aControlIds);
		};
		filters.push(
			new Filter({
				path: "controlIds",
				test: fnCheckControlIdInDialog,
				caseSensitive: true
			})
		);

		if (showBoundTransition && !showStateMessages) {
			// Add extra filter if only bound transition messages are shown
			filters.push(new Filter({ path: "persistent", operator: FilterOperator.EQ, value1: true }));
			filters.push(isNonTechnicalMessageFilter);
		}
	} else {
		// Only unbound messages should be shown
		filters.push(
			new Filter({
				filters: [
					new Filter({
						path: "",
						test: (message: Message) => message.getTargets().length === 0 || message.getTargets()[0] === ""
					}),
					isNonTechnicalMessageFilter
				],
				and: true
			})
		);
	}

	return filters;
}

function processMessagesFromChangesetFailure({
	messagesToShow,
	uiElementToUse
}: Pick<MessageUIDecisions, "uiElementToUse" | "messagesToShow">): Pick<MessageUIDecisions, "uiElementToUse" | "messagesToShow"> {
	let retMessages = [...messagesToShow];
	if (messagesToShow.length === 2) {
		// There are 2 message:
		// 1. Generic error changeset message added by FE.
		// 2. Main error message from the interaction.
		// We remove the generic message, show only an enhanced 'Main error message' with a generic messsage pre-text in the message box.
		const genericMsgs: Message[] = [];
		const nonGenericMsgs: Message[] = [];
		messagesToShow.forEach((message) => {
			if (message.getCode() === "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
				genericMsgs.push(message);
			} else {
				nonGenericMsgs.push(message);
			}
		});
		if (genericMsgs.length === 1) {
			const { fe: feTechnicalDetails } = (genericMsgs[0].getTechnicalDetails() || {}) as FEMessageTechnicalDetails;
			if (feTechnicalDetails?.changeSetPreTextForSingleError) {
				const preText = feTechnicalDetails?.changeSetPreTextForSingleError;
				if (preText) {
					const techDetailsForNonGenericMessage: FEMessageTechnicalDetails = {
						fe: {
							singleErrorPreText: preText,
							singleGenericMessageId: genericMsgs[0].getId()
						}
					};
					const existingTechDetails = nonGenericMsgs[0].getTechnicalDetails() ?? {};
					// combine existing technical details if any, with the change set information we want to add.
					nonGenericMsgs[0].setTechnicalDetails({ ...existingTechDetails, ...techDetailsForNonGenericMessage });
					retMessages = nonGenericMsgs;
				}
			}
		}
	}
	return {
		messagesToShow: retMessages,
		uiElementToUse: retMessages.length === 1 && uiElementToUse !== "None" ? "Box" : uiElementToUse
	};
}

/**
 * Add the custom messages to message model.
 * @param customMessages Custom messages to add.
 */
function addCustomMessages(customMessages: CustomMessage[]): void {
	customMessages.forEach(function (oMessage: CustomMessage) {
		const messageCode = oMessage.code ? oMessage.code : "";
		Messaging.addMessages(
			new Message({
				message: oMessage.text,
				type: oMessage.type,
				target: "",
				persistent: true,
				code: messageCode
			})
		);
		//The target and persistent properties of the message are hardcoded as "" and true because the function deals with only unbound messages.
	});
}

function getSorterForMessages(): Sorter {
	return new Sorter("", undefined, undefined, (obj1: MessageWithHeader, obj2: MessageWithHeader) => {
		const rankA = getMessageRank(obj1);
		const rankB = getMessageRank(obj2);

		if (rankA < rankB) {
			return -1;
		}
		if (rankA > rankB) {
			return 1;
		}
		return 0;
	});
}

function getMessagesToShow(filters: Filter[], transistionMessages: Message[]): MessageWithHeader[] {
	let messagesToShow: MessageWithHeader[] = [...transistionMessages];
	const listBinding = Messaging.getMessageModel().bindList("/", undefined, undefined, filters),
		currentContexts = listBinding.getCurrentContexts();
	if (currentContexts.length > 0) {
		// if false, show messages in dialog
		// As fitering has already happened here hence
		// using the message model again for the message dialog view and then filtering on that binding again is unnecessary.
		// So we create new json model to use for the message dialog view.
		const messages = currentContexts.map((currentContext) => currentContext.getObject());
		const oUniqueObj: Record<string, boolean> = {};

		messagesToShow = messages.concat(messagesToShow).filter(function (obj: Message) {
			// remove entries having duplicate message ids
			return !oUniqueObj[obj.getId()] && (oUniqueObj[obj.getId()] = true);
		});
	}
	return messagesToShow;
}

async function showMessageToast(message: Message): Promise<void> {
	return new Promise<void>((resolve) => {
		MessageToast.show(message.getMessage());
		Messaging.removeMessages(message);
		resolve(undefined);
	});
}

async function showMessageDialogControl(uiDecision: MessageUIDecisions, runToTest = false): Promise<void | Dialog> {
	let highestPriority;
	let highestPriorityText;
	return new Promise(function (resolve: (param1: void | Dialog) => void) {
		aResolveFunctions.push(resolve);
		const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
		const strictHandlingFlow = false;
		const { messagesToShow, contextNeedsEtagRefresh } = uiDecision;
		const messageDialogModel = new JSONModel(messagesToShow);
		const messageObject = prepareMessageViewForDialog(messageDialogModel, strictHandlingFlow);
		const sorter = getSorterForMessages();
		(messageObject.messageView.getBinding("items") as ODataListBinding).sort(sorter);

		if (!dialogControl || !dialogControl.isOpen()) {
			dialogControl = new Dialog({
				resizable: true,
				endButton: new Button({
					press: function (): void {
						dialogCloseHandler();
						// also remove bound transition messages if we were showing them
						Messaging.removeMessages(messagesToShow);
					},
					text: resourceBundle.getText("C_COMMON_SAPFE_CLOSE")
				}),
				escapeHandler: function (completionPromise: { resolve: Function; reject: Function }): void {
					dialogCloseHandler();
					// also remove bound transition messages if we were showing them
					Messaging.removeMessages(messagesToShow);
					completionPromise.resolve();
				},
				customHeader: new Bar({
					contentMiddle: [
						new Text({
							text: resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE")
						})
					],
					contentLeft: [oBackButton]
				}),
				contentWidth: "37.5em",
				contentHeight: "21.5em",
				verticalScrolling: false,
				closeOnNavigation: false,
				afterClose: function (): void {
					for (const item of aResolveFunctions) {
						item();
					}
					aResolveFunctions = [];
				}
			});
		}

		dialogControl.removeAllContent();
		dialogControl.addContent(messageView);

		if (contextNeedsEtagRefresh) {
			dialogControl.setBeginButton(
				new Button({
					press: function (): void {
						dialogCloseHandler();
						if (contextNeedsEtagRefresh.hasPendingChanges()) {
							contextNeedsEtagRefresh.getBinding().resetChanges();
						}
						contextNeedsEtagRefresh.refresh();
					},
					text: resourceBundle.getText("C_COMMON_SAPFE_REFRESH"),
					type: ButtonType.Emphasized
				})
			);
		} else {
			dialogControl.destroyBeginButton();
		}
		highestPriority = fnGetHighestMessagePriority(messageView.getItems());
		highestPriorityText = getTranslatedTextForMessageDialog(highestPriority);
		dialogControl.setState(highestPriority);
		((dialogControl.getCustomHeader() as Bar).getContentMiddle()[0] as Text).setText(highestPriorityText);
		messageView.navigateBack();
		dialogControl.open();
		if (runToTest) {
			resolve(dialogControl);
		}
	});
}

async function showMessageBoxControl(uiDecision: MessageUIDecisions): Promise<void> {
	return new Promise(function (resolve) {
		const { messagesToShow } = uiDecision;
		const messageToShow = messagesToShow[0];
		const messageTechnicalDetails = messageToShow.getTechnicalDetails() as MessageTechnicalDetails | undefined;
		const { singleGenericMessageId, singleErrorPreText } = (messageTechnicalDetails as FEMessageTechnicalDetails)?.fe ?? {};
		const retryAfterMessage = messageHandling.getRetryAfterMessage(messageToShow, true);
		// If it is a retry message, then it needs to have technical details to show it.
		const showMessageBox = retryAfterMessage ? messageTechnicalDetails : true;
		if (showMessageBox) {
			const startTag = "<html><body><span style='white-space:pre-wrap'>",
				closeTag = "</span></body></html>";
			let formattedTextString = startTag;

			// Adding pre-text for the messages
			if (retryAfterMessage) {
				formattedTextString = `${formattedTextString}<h6>${retryAfterMessage}</h6><br></br>`;
			} else {
				if (singleErrorPreText) {
					const messageHeader = (messageToShow as MessageWithHeader)?.["headerName"]
						? `${(messageToShow as MessageWithHeader)?.["headerName"]}:`
						: "";
					formattedTextString = `${formattedTextString}${singleErrorPreText}<br/><br/>${messageHeader} `;
				}
			}

			// Adding the main error message.
			if (messageToShow.getCode() !== "503" && messageToShow.getAdditionalText() !== undefined) {
				formattedTextString = `${
					formattedTextString + messageToShow.getAdditionalText()
				}: ${messageToShow.getMessage()}${closeTag}`;
			} else {
				formattedTextString = `${formattedTextString + messageToShow.getMessage()}${closeTag}`;
			}
			const formattedText = new FormattedText({
				htmlText: ManagedObject.escapeSettingsValue(formattedTextString)
			});

			showMessageBoxPerType(
				formattedText as unknown as string,
				{
					onClose: closeMessageBox.bind(null, messageToShow, resolve, singleGenericMessageId)
				},
				messageToShow
			);
		}
	});
}

function closeMessageBox(messageShown: MessageWithHeader, callBack: (value: void) => void, singleGenericMessageId?: string): void {
	const messagesToRemove = [messageShown];
	if (singleGenericMessageId) {
		const allMsgs = Messaging.getMessageModel().getData();
		const genericMessage = allMsgs.find((msg: MessageWithHeader) => msg.getId() === singleGenericMessageId);
		if (genericMessage) {
			messagesToRemove.push(genericMessage);
		}
	}
	Messaging.removeMessages(messagesToRemove);
	callBack(undefined);
}

function showMessageBoxPerType(formattedText: string, close: { onClose: Function }, message: Message): void {
	switch (message.getType()) {
		case MessageType.Error:
			MessageBox.error(formattedText, close);
			break;
		case MessageType.Warning:
			MessageBox.warning(formattedText, close);
			break;
		case MessageType.Success:
			MessageBox.success(formattedText, close);
			break;
		case MessageType.Information:
			MessageBox.information(formattedText, close);
			break;
		default:
			MessageBox.show(formattedText, close);
	}
}

function removeMessageShownInMessageStrip(transitionMessages: Message[], context: Context): Message[] {
	const boundContextMessages: Message[] = [];
	transitionMessages?.forEach((message: Message) => {
		if (message.getTargets().length === 1 && message.getTargets()[0] === context?.getPath() && message.getPersistent() === true) {
			boundContextMessages.push(message);
		}
	});
	if (boundContextMessages.length === 1) {
		transitionMessages = transitionMessages?.filter(function (message: Message) {
			return message !== boundContextMessages[0];
		});
	}
	return transitionMessages;
}
/**
 * This function sets the group name for all messages in a dialog.
 * @param aModelDataArray Messages array
 * @param control
 * @param sActionName
 * @param viewType
 */
function updateMessageObjectGroupName(
	aModelDataArray: MessageWithHeader[],
	control: Control | undefined,
	sActionName: string | undefined,
	viewType: string | undefined
): void {
	aModelDataArray.forEach((aModelData: MessageWithHeader) => {
		aModelData["headerName"] = "";
		if (!aModelData.target?.length && aModelData.getCode?.() !== "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
			// unbound transiiton messages
			const generalGroupText = Library.getResourceBundleFor("sap.fe.core")!.getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
			aModelData["headerName"] = generalGroupText;
		} else if (aModelData.target?.length) {
			// LR flow
			if (viewType === "ListReport" && control?.isA<MDCTable>("sap.ui.mdc.Table")) {
				messageHandling.setGroupNameLRTable(control, aModelData, sActionName);
			} else if (viewType === "ObjectPage") {
				// OP Display mode
				messageHandling.setGroupNameOPDisplayMode(aModelData, sActionName, control as View);
			} else {
				aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
			}
		}
	});
}

/**
 * This function will set the group name of Message Object for LR table.
 * @param oElem
 * @param aModelData
 * @param sActionName
 */
function setGroupNameLRTable(oElem: Control | undefined, aModelData: MessageWithHeader, sActionName: string | undefined): void {
	const oRowBinding = oElem && (oElem as MDCTable).getRowBinding();
	if (oRowBinding) {
		const sElemeBindingPath = `${(oElem as MDCTable).getRowBinding().getPath()}`;
		if (aModelData.target?.indexOf(sElemeBindingPath) === 0) {
			const allRowContexts = oRowBinding.getCurrentContexts();
			allRowContexts.forEach((rowContext: Context) => {
				if (aModelData.target?.includes(rowContext.getPath())) {
					const contextPath = `${rowContext.getPath()}/`;
					const identifierColumn = (oElem.getParent() as TableAPI).getIdentifierColumn() as string;
					const rowIdentifier = identifierColumn && rowContext.getObject()[identifierColumn];
					const columnPropertyName = messageHandling.getTableColProperty(oElem, aModelData, contextPath);
					const { sTableTargetColName } = messageHandling.getTableColInfo(oElem as MDCTable, columnPropertyName);

					// if target has some column name and column is visible in UI
					if (columnPropertyName && sTableTargetColName) {
						// header will be row Identifier, if found from above code otherwise it should be table name
						aModelData["headerName"] = rowIdentifier ? ` ${rowIdentifier}` : (oElem as MDCTable).getHeader();
					} else {
						// if column data not found (may be the column is hidden), add grouping as Last Action
						aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
					}
				}
			});
		}
	}
}

function updateAddtionalTextForMessageInOPTable(
	mdcTable: MDCTable,
	message: MessageWithHeader,
	targetTableInfo: TargetTableInfoType
): void {
	const identifierColumn = (mdcTable.getParent() as TableAPI).getIdentifierColumn() as string;
	if (identifierColumn) {
		const allRowContexts = mdcTable.getRowBinding().getContexts();
		allRowContexts.forEach((rowContext: Context) => {
			if (message.target?.includes(rowContext.getPath())) {
				const rowIdentifier = identifierColumn ? rowContext.getObject()[identifierColumn] : "";
				const columnNameSuffix = targetTableInfo.sTableTargetColName ? `, ${targetTableInfo.sTableTargetColName}` : "";
				message.setAdditionalText(`${rowIdentifier}${columnNameSuffix}`);
			}
		});
	} else if (targetTableInfo.sTableTargetColName) {
		message.setAdditionalText(`${targetTableInfo.sTableTargetColName}`);
	}
}

function updateHeaderNameForMessageInOPTable(
	subsection: ObjectPageSubSection,
	mdcTable: MDCTable,
	message: MessageWithHeader,
	targetTableInfo: TargetTableInfoType
): void {
	let headerName = mdcTable.getHeaderVisible() && targetTableInfo.tableHeader;
	if (!headerName) {
		headerName = subsection.getTitle();
	} else {
		const oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
		headerName = `${oResourceBundle.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${headerName}`;
	}
	message["headerName"] = headerName;
}

/**
 * This function will set the group name of Message Object in OP Display mode.
 * @param subsection Subsection
 * @param mdcTable  MDC table
 * @param message Message
 * @param viewContext View's binding context
 * @param groupNameIsGeneral Is present group name 'General'
 * @param actionName Action name
 * @returns If group name is 'General'
 */
function setGroupNameOPTableDisplayMode(
	subsection: ObjectPageSubSection,
	mdcTable: MDCTable,
	message: MessageWithHeader,
	viewContext: Context | null | undefined,
	groupNameIsGeneral: boolean,
	actionName?: string
): boolean {
	const oRowBinding = mdcTable.getRowBinding(),
		setSectionNameInGroup = true;
	let childTableElement: UI5Element | undefined;

	mdcTable.findElements(true).forEach((oElement) => {
		if (oElement.isA<Table>("sap.m.Table") || oElement.isA<UITable>("sap.ui.table.Table")) {
			childTableElement = oElement;
		}
	});
	if (oRowBinding) {
		const sElemeBindingPath = `${viewContext?.getPath()}/${mdcTable.getRowBinding()?.getPath()}`;
		if (message.target?.indexOf(sElemeBindingPath) === 0) {
			const obj = messageHandling.getTableColumnDataAndSetSubtile(
				message,
				mdcTable,
				childTableElement,
				oRowBinding,
				actionName,
				setSectionNameInGroup,
				fnCallbackSetGroupName
			);
			const { oTargetTableInfo } = obj;

			messageHandling.updateAddtionalTextForMessageInOPTable(mdcTable, message, oTargetTableInfo);
			messageHandling.updateHeaderNameForMessageInOPTable(subsection, mdcTable, message, oTargetTableInfo);
			groupNameIsGeneral = false;
		}
	}
	return groupNameIsGeneral;
}

/**
 * This function will set the group name of Message Object in OP Display mode.
 * @param aModelData Message Object
 * @param sActionName  Action name
 * @param control
 */
function setGroupNameOPDisplayMode(aModelData: MessageWithHeader, sActionName: string | undefined, control: View): void {
	const oViewContext = control?.getBindingContext();
	const opLayout: Control = control?.getContent && control?.getContent()[0];
	let bIsGeneralGroupName = true;
	if (opLayout) {
		messageHandling.getVisibleSectionsFromObjectPageLayout(opLayout).forEach(function (oSection: ObjectPageSection) {
			const subSections = oSection.getSubSections();
			subSections.forEach(function (oSubSection: ObjectPageSubSection) {
				oSubSection.findElements(true).forEach(function (oElem) {
					if (oElem.isA<MDCTable>("sap.ui.mdc.Table")) {
						bIsGeneralGroupName = setGroupNameOPTableDisplayMode(
							oSubSection,
							oElem,
							aModelData,
							oViewContext,
							bIsGeneralGroupName,
							sActionName
						);
					}
				});
			});
		});
	}

	if (bIsGeneralGroupName) {
		const sElemeBindingPath = `${oViewContext?.getPath()}`;
		if (aModelData.target?.indexOf(sElemeBindingPath) === 0) {
			// check if OP context path is part of target, set Last Action as group name
			aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
		} else {
			aModelData["headerName"] = Library.getResourceBundleFor("sap.fe.core")!.getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
		}
	}
}

function getLastActionTextAndActionName(sActionName: string | undefined): string {
	const sLastActionText = Library.getResourceBundleFor("sap.fe.core")!.getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_LAST_ACTION");
	return sActionName ? `${sLastActionText}: ${sActionName}` : "";
}

/**
 * This function will give rank based on Message Group/Header name, which will be used for Sorting messages in Message dialog
 * Last Action should be shown at top, next Row Id and last General.
 * @param obj
 * @returns Rank of message
 */
function getMessageRank(obj: MessageWithHeader): number {
	if (obj.getCode() === "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
		return 1;
	} else if (obj.headerName?.toString().includes("Last Action")) {
		return 2;
	} else if (obj.headerName?.toString().includes("General")) {
		return 4;
	} else {
		return 3;
	}
}

/**
 * This function will set the group name which can either General or Last Action.
 * @param aMessage
 * @param sActionName
 * @param bIsGeneralGroupName
 */
const fnCallbackSetGroupName = (aMessage: MessageWithHeader, sActionName: string | undefined, bIsGeneralGroupName?: boolean): void => {
	if (bIsGeneralGroupName) {
		aMessage["headerName"] = Library.getResourceBundleFor("sap.fe.core")!.getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
	} else {
		aMessage["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
	}
};

/**
 * This function will get the table row/column info and set subtitle.
 * @param aMessage
 * @param oTable
 * @param oElement
 * @param oRowBinding
 * @param sActionName
 * @param setSectionNameInGroup
 * @param fnSetGroupName
 * @returns Table info and Subtitle.
 */
function getTableColumnDataAndSetSubtile(
	aMessage: MessageWithHeader,
	oTable: MDCTable,
	oElement: UI5Element | undefined,
	oRowBinding: Binding,
	sActionName: string | undefined,
	setSectionNameInGroup: boolean,
	fnSetGroupName: Function
): { oTargetTableInfo: TargetTableInfoType; subTitle: string | null | undefined } {
	const oTargetTableInfo = messageHandling.getTableAndTargetInfo(oTable, aMessage, oElement, oRowBinding);
	oTargetTableInfo.tableHeader = oTable.getHeader();

	let sControlId, bIsCreationRow;
	if (!oTargetTableInfo.oTableRowContext) {
		sControlId = aMessage.getControlIds().find(function (sId: string) {
			return messageHandling.isControlInTable(oTable, sId);
		});
	}

	if (sControlId) {
		const oControl = UI5Element.getElementById(sControlId);
		bIsCreationRow = messageHandling.isControlPartOfCreationRow(oControl);
	}

	if (!oTargetTableInfo.sTableTargetColName) {
		// if the column is not present on UI or the target does not have a table field in it, use Last Action for grouping
		if (aMessage.getPersistent() && sActionName) {
			fnSetGroupName(aMessage, sActionName);
			setSectionNameInGroup = false;
		}
	}

	const subTitle = messageHandling.getMessageSubtitle(
		aMessage,
		oTargetTableInfo.oTableRowBindingContexts,
		oTargetTableInfo.oTableRowContext,
		oTargetTableInfo.sTableTargetColName,
		oTable,
		bIsCreationRow
	);

	return { oTargetTableInfo, subTitle };
}

/**
 * This function will create the subtitle based on Table Row/Column data.
 * @param message
 * @param tableRowBindingContexts
 * @param tableRowContext
 * @param tableTargetColName
 * @param table
 * @param isCreationRow
 * @param targetedControl
 * @returns Message subtitle.
 */
function getMessageSubtitle(
	message: MessageWithHeader,
	tableRowBindingContexts: Context[],
	tableRowContext: ODataV4Context | undefined,
	tableTargetColName: string | undefined,
	table: MDCTable,
	isCreationRow: boolean | undefined,
	targetedControl?: Control
): string | null | undefined {
	let messageSubtitle;
	let rowSubtitleValue;
	const resourceModel = getResourceModel(table);
	const tableColProperty = (table.getParent() as TableAPI)?.getTableColumnVisibilityInfo(tableRowContext);
	const colFromTableSettings = messageHandling.fetchColumnInfo(message, table);
	if (isCreationRow || tableRowContext?.isInactive()) {
		messageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [
			resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_CREATION_ROW_INDICATOR"),
			tableTargetColName ? tableTargetColName : (colFromTableSettings as AnnotationTableColumn).label
		]);
	} else {
		const tableColBindingContextTextAnnotation = messageHandling.getTableColBindingContextForTextAnnotation(
			table,
			tableRowContext,
			tableColProperty
		);
		const tableColTextAnnotationPath = tableColBindingContextTextAnnotation
			? tableColBindingContextTextAnnotation.getObject("$Path")
			: undefined;
		const tableColTextArrangement =
			tableColTextAnnotationPath && tableColBindingContextTextAnnotation
				? tableColBindingContextTextAnnotation.getObject("@com.sap.vocabularies.UI.v1.TextArrangement/$EnumMember")
				: undefined;
		if (tableRowBindingContexts.length > 0) {
			// set Row subtitle text
			if (targetedControl) {
				// The UI error is on the first column, we then get the control input as the row indicator:
				rowSubtitleValue = (targetedControl as Field).getValue();
			} else if (tableRowContext && tableColProperty && tableColProperty.length === 1) {
				// Getting the column label and its value of a single row
				rowSubtitleValue = (table.getParent() as TableAPI)?.getTableColValue(
					tableRowContext,
					tableColTextAnnotationPath,
					tableColTextArrangement,
					tableColProperty
				);
			} else if (tableRowContext && tableColProperty && tableColProperty.length > 1) {
				// If there are multiple rows, the subtitle is displayed as ‘See message details’
				rowSubtitleValue = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_DETAILED_ROW_INFO");
			} else {
				rowSubtitleValue = undefined;
			}
			// set the message subtitle
			const oColumnInfo: ColumnInfoType = messageHandling.determineColumnInfo(colFromTableSettings, resourceModel);
			if (rowSubtitleValue && tableTargetColName) {
				messageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [rowSubtitleValue, tableTargetColName]);
			} else if (rowSubtitleValue && oColumnInfo.sColumnIndicator === "Hidden") {
				messageSubtitle = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW_WITH_IDENTIFIER", [rowSubtitleValue])}, ${
					oColumnInfo.sColumnValue
				}`;
			} else if (rowSubtitleValue && oColumnInfo.sColumnIndicator === "Unknown") {
				messageSubtitle = resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW_WITH_IDENTIFIER", [rowSubtitleValue]);
			} else if (rowSubtitleValue && oColumnInfo.sColumnIndicator === "undefined") {
				messageSubtitle = resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW_WITH_IDENTIFIER", [rowSubtitleValue]);
			} else if (!rowSubtitleValue && tableTargetColName) {
				messageSubtitle = resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN") + ": " + tableTargetColName;
			} else if (!rowSubtitleValue && oColumnInfo.sColumnIndicator === "Hidden") {
				messageSubtitle = oColumnInfo.sColumnValue;
			} else {
				messageSubtitle = null;
			}
		} else {
			messageSubtitle = null;
		}
	}
	return messageSubtitle;
}

/**
 * This function gets the first column for text Annotation, this is needed to set subtitle of Message.
 * @param table
 * @param tableRowContext
 * @param tableColProperty
 * @returns Binding context.
 */
function getTableColBindingContextForTextAnnotation(
	table: MDCTable,
	tableRowContext: ODataV4Context | undefined,
	tableColProperty: TableColumnProperties
): Context | null | undefined {
	let bindingContext;
	if (tableRowContext && tableColProperty && tableColProperty.length === 1) {
		const { key } = tableColProperty[0];
		const oModel = table?.getModel();
		const oMetaModel = oModel?.getMetaModel() as ODataMetaModel | undefined; // must be an ODataMetaModel to match the type of the table row context
		const sMetaPath = oMetaModel?.getMetaPath(tableRowContext.getPath());
		if (oMetaModel?.getObject(`${sMetaPath}/${key}@com.sap.vocabularies.Common.v1.Text/$Path`)) {
			bindingContext = oMetaModel.createBindingContext(`${sMetaPath}/${key}@com.sap.vocabularies.Common.v1.Text`);
		}
	}
	return bindingContext;
}

/**
 * The method that is called to retrieve the column info from the associated message of the message popover.
 * @param oMessage Message object
 * @param oTable MdcTable
 * @returns Returns the column info.
 */

function fetchColumnInfo(oMessage: MessageWithHeader, oTable: MDCTable): TableColumn | undefined {
	const sColNameFromMessageObj = oMessage?.getTargets()[0].split("/").pop();
	return (oTable.getParent() as TableAPI)?.getKeyColumnInfo(sColNameFromMessageObj);
}

/**
 * This function gets the Column data depending on its availability in Table, this is needed for setting subtitle of Message.
 * @param oColFromTableSettings
 * @param resourceModel
 * @returns Column data.
 */
function determineColumnInfo(oColFromTableSettings: TableColumn | undefined, resourceModel: ResourceModel): ColumnInfoType {
	const oColumnInfo: ColumnInfoType = { sColumnIndicator: "", sColumnValue: "" };
	if (oColFromTableSettings) {
		// if column is neither in table definition nor personalization, show only row subtitle text
		if (oColFromTableSettings.availability === "Hidden") {
			oColumnInfo.sColumnValue = undefined;
			oColumnInfo.sColumnIndicator = "undefined";
		} else {
			//if column is in table personalization but not in table definition, show Column (Hidden) : <colName>
			oColumnInfo.sColumnValue = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN")} (${resourceModel.getText(
				"T_COLUMN_INDICATOR_IN_TABLE_DEFINITION"
			)}): ${oColFromTableSettings.label}`;
			oColumnInfo.sColumnIndicator = "Hidden";
		}
	} else {
		oColumnInfo.sColumnIndicator = "Unknown";
	}
	return oColumnInfo;
}

/**
 * This function check if a given control id is a part of Table.
 * @param oTable
 * @param sControlId
 * @returns True if control is part of table.
 */
function isControlInTable(oTable: MDCTable, sControlId: string): UI5Element[] | boolean {
	const oControl = UI5Element.getElementById(sControlId);
	if (oControl && !oControl.isA<UITable>("sap.ui.table.Table") && !oControl.isA<Table>("sap.m.Table")) {
		return oTable.findElements(true, function (oElem: Control): boolean {
			return oElem.getId() === oControl.getId();
		});
	}
	return false;
}

function isControlPartOfCreationRow(oControl: UI5Element | undefined): boolean {
	let oParentControl = oControl?.getParent();
	while (
		oParentControl &&
		!oParentControl?.isA("sap.ui.table.Row") &&
		!oParentControl?.isA("sap.ui.table.CreationRow") &&
		!oParentControl?.isA("sap.m.ColumnListItem")
	) {
		oParentControl = oParentControl.getParent();
	}

	return !!oParentControl && oParentControl.isA("sap.ui.table.CreationRow");
}

function getTranslatedTextForMessageDialog(sHighestPriority: string): string {
	const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
	switch (sHighestPriority) {
		case "Error":
			return resourceBundle.getText("C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR");
		case "Information":
			return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO");
		case "Success":
			return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_SUCCESS");
		case "Warning":
			return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_WARNING");
		default:
			return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE");
	}
}
function removeUnboundTransitionMessages(): void {
	removeTransitionMessages(false);
}
function removeBoundTransitionMessages(sPathToBeRemoved?: string): void {
	removeTransitionMessages(true, sPathToBeRemoved);
}

function getMessagesFromMessageModel(oMessageModel: MessageModel, sPathToBeRemoved?: string): Message[] {
	if (sPathToBeRemoved === undefined) {
		return oMessageModel.getObject("/");
	}
	const listBinding = oMessageModel.bindList("/");

	listBinding.filter(
		new Filter({
			path: "",
			test: (message: Message) => message.getTargets().some((target) => target.startsWith(sPathToBeRemoved))
		})
	);

	return listBinding.getCurrentContexts().map(function (oContext) {
		return oContext.getObject();
	});
}

/**
 * Get relevant messages.
 * @param bBoundMessages To get only bound messages
 * @param bTransitionOnly To get only transition messages
 * @param sPathToBeRemoved Filter out bound messages with path
 * @returns Messages
 */
function getMessages(bBoundMessages = false, bTransitionOnly = false, sPathToBeRemoved?: string): Message[] {
	let i;
	const oMessageModel = Messaging.getMessageModel(),
		oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!,
		aTransitionMessages = [];
	let aMessages: Message[] = [];
	if (bBoundMessages && bTransitionOnly && sPathToBeRemoved) {
		aMessages = getMessagesFromMessageModel(oMessageModel, sPathToBeRemoved);
	} else {
		aMessages = oMessageModel.getObject("/");
	}
	for (i = 0; i < aMessages.length; i++) {
		if (
			(!bTransitionOnly || aMessages[i].getPersistent()) &&
			((bBoundMessages && aMessages[i].getTargets()[0] !== "") ||
				(!bBoundMessages && (!aMessages[i].getTargets()[0] || aMessages[i].getTargets()[0] === "")))
		) {
			aTransitionMessages.push(aMessages[i]);
		}
	}

	for (i = 0; i < aTransitionMessages.length; i++) {
		if (
			aTransitionMessages[i].getCode() === "503" &&
			aTransitionMessages[i].getMessage() !== "" &&
			!aTransitionMessages[i].getMessage().includes(oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX"))
		) {
			aTransitionMessages[i].setMessage(
				`\n${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX")}${aTransitionMessages[i].getMessage()}`
			);
		}
	}
	//Filtering messages again here to avoid showing pure technical messages raised by the model
	const backendMessages: Message[] = aTransitionMessages.filter(isNonTechnicalMessage);

	return backendMessages;
}
export type MessageTechnicalDetails = {
	originalMessage?: {
		message?: string;
	} | null;
	httpStatus?: number | null;
	retryAfter?: Date;
	isConcurrentModification?: boolean;
};
function removeTransitionMessages(bBoundMessages: boolean, sPathToBeRemoved?: string): void {
	const aMessagesToBeDeleted = getMessages(bBoundMessages, true, sPathToBeRemoved);

	if (aMessagesToBeDeleted.length > 0) {
		Messaging.removeMessages(aMessagesToBeDeleted);
	}
}
//TODO: This must be moved out of message handling
function setMessageSubtitle(oTable: MDCTable, aContexts: Context[], message: MessageWithHeader): void {
	if (message.additionalText === undefined) {
		const subtitleColumn = (oTable.getParent() as TableAPI).getIdentifierColumn() as string;
		const errorContext = aContexts.find(function (oContext) {
			return message.getTargets()[0].includes(oContext.getPath());
		});
		message.additionalText = errorContext ? errorContext.getObject()[subtitleColumn] : undefined;
	}
}

/**
 * The method retrieves the visible sections from an object page.
 * @param oObjectPageLayout The objectPageLayout object for which we want to retrieve the visible sections.
 * @returns Array of visible sections.
 */
function getVisibleSectionsFromObjectPageLayout(oObjectPageLayout: Control | ObjectPageLayout): ObjectPageSection[] {
	return (oObjectPageLayout as ObjectPageLayout).getSections().filter(function (oSection: ObjectPageSection) {
		return oSection.getVisible();
	});
}

/**
 * This function checks if control ids from message are a part of a given subsection.
 * @param subSection
 * @param oMessageObject
 * @returns SubSection matching control ids.
 */
function getControlFromMessageRelatingToSubSection(subSection: ObjectPageSubSection, oMessageObject: MessageWithHeader): UI5Element[] {
	return subSection
		.findElements(true, (oElem) => {
			return fnFilterUponIds(oMessageObject.getControlIds(), oElem);
		})
		.sort(function (a, b) {
			// controls are sorted in order to have the table on top of the array
			// it will help to compute the subtitle of the message based on the type of related controls
			if (a.isA("sap.ui.mdc.Table") && !b.isA("sap.ui.mdc.Table")) {
				return -1;
			}
			return 1;
		});
}

function getTableColProperty(oTable: Control, oMessageObject: MessageWithHeader, oContextPath?: string | RegExp): string {
	//this function escapes a string to use it as a regex
	const fnRegExpescape = function (s: string): string {
		return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
	};
	// based on the target path of the message we retrieve the property name.
	// to achieve it we remove the bindingContext path and the row binding path from the target
	if (!oContextPath) {
		const contextPathToEscape = `${oTable.getBindingContext()?.getPath()}/${(oTable as MDCTable).getRowBinding().getPath()}`;
		oContextPath = new RegExp(`${fnRegExpescape(contextPathToEscape)}\\(.*\\)/`);
	}
	return oMessageObject.getTargets()[0].replace(oContextPath, "");
}

/**
 * This function gives the column information if it matches with the property name from target of message.
 * @param oTable
 * @param sTableTargetColProperty
 * @returns Column name and property.
 */
function getTableColInfo(
	oTable: MDCTable,
	sTableTargetColProperty: string | undefined
): { sTableTargetColName: string | undefined; sTableTargetColProperty: string | undefined } {
	let sTableTargetColName: string | undefined;
	const oTableTargetCol: Column | undefined = oTable.getColumns().find(function (column) {
		return column.getPropertyKey() == sTableTargetColProperty;
	});
	if (!oTableTargetCol) {
		/* If the target column is not found, we check for a custom column */
		const oCustomColumn = (oTable.getControlDelegate() as typeof TableDelegate).getColumnsFor(oTable).find(function (
			oColumn: TableColumn
		): boolean {
			if (!!(oColumn as CustomBasedTableColumn).template && oColumn.propertyInfos) {
				return (
					oColumn.propertyInfos[0] === sTableTargetColProperty ||
					oColumn.propertyInfos[0].replace("Property::", "") === sTableTargetColProperty
				);
			} else {
				return false;
			}
		}) as CustomBasedTableColumn | undefined;
		if (oCustomColumn) {
			sTableTargetColProperty = oCustomColumn?.name;

			sTableTargetColName = oTable
				.getColumns()
				.find(function (oColumn): boolean {
					return sTableTargetColProperty === oColumn.getPropertyKey();
				})
				?.getHeader();
		} else {
			/* If the target column is not found, we check for a field group */
			const aColumns = (oTable.getControlDelegate() as typeof TableDelegate).getColumnsFor(oTable);
			const columnDefinition = aColumns.find(function (oColumn: TableColumn) {
				if (oColumn.key.includes("::FieldGroup::")) {
					return oColumn.propertyInfos?.find(function (propertyInfo: string) {
						return (
							propertyInfo === sTableTargetColProperty || propertyInfo.replace("Property::", "") === sTableTargetColProperty
						);
					});
				}
			}) as AnnotationTableColumn | undefined;
			/* check if the column with the field group is visible in the table: */
			let bIsTableTargetColVisible = false;
			if (columnDefinition && columnDefinition.label) {
				bIsTableTargetColVisible = oTable.getColumns().some(function (column) {
					return column.getHeader() === columnDefinition.label;
				});
			}
			sTableTargetColName = bIsTableTargetColVisible ? columnDefinition?.label : undefined;
			sTableTargetColProperty = bIsTableTargetColVisible ? columnDefinition?.key : undefined;
		}
	} else {
		sTableTargetColName = oTableTargetCol.getHeader();
	}
	return { sTableTargetColName: sTableTargetColName, sTableTargetColProperty: sTableTargetColProperty };
}

/**
 * This function gives Table and column info if any of it matches the target from Message.
 * @param oTable
 * @param oMessageObject
 * @param oElement
 * @param oRowBinding
 * @returns Table info matching the message target.
 */
function getTableAndTargetInfo(
	oTable: MDCTable,
	oMessageObject: MessageWithHeader,
	oElement: UI5Element | undefined,
	oRowBinding: Binding
): TargetTableInfoType {
	const sTableTargetColProperty = getTableColProperty(oTable, oMessageObject);
	const oTableColInfo = getTableColInfo(oTable, sTableTargetColProperty);
	const oTableRowBindingContexts = oElement?.isA("sap.ui.table.Table")
		? (oRowBinding as ODataListBinding).getContexts()
		: (oRowBinding as ODataListBinding).getCurrentContexts();
	const oTargetTableInfo: TargetTableInfoType = {
		oTableRowBindingContexts,
		sTableTargetColName: oTableColInfo.sTableTargetColName,
		sTableTargetColProperty: oTableColInfo.sTableTargetColProperty,
		oTableRowContext: oTableRowBindingContexts.find(function (rowContext) {
			return rowContext && oMessageObject.getTargets()[0].indexOf(rowContext.getPath()) === 0;
		})
	};
	return oTargetTableInfo;
}

/**
 *
 * @param aControlIds
 * @param oItem
 * @returns True if the item matches one of the controls
 */
function fnFilterUponIds(aControlIds: string[], oItem: UI5Element): boolean {
	return aControlIds.some(function (sControlId) {
		if (sControlId === oItem.getId()) {
			return true;
		}
		return false;
	});
}

/**
 * This function gives the group name having section and subsection data.
 * @param section
 * @param subSection
 * @param bMultipleSubSections
 * @param oTargetTableInfo
 * @param resourceModel
 * @param includeTableGroupName
 * @returns Group name.
 */
function createSectionGroupName(
	section: ObjectPageSection,
	subSection: ObjectPageSubSection,
	bMultipleSubSections: boolean,
	oTargetTableInfo: TargetTableInfoType,
	resourceModel: ResourceModel,
	includeTableGroupName = true
): string {
	return (
		section.getTitle() +
		(subSection.getTitle() && bMultipleSubSections ? `, ${subSection.getTitle()}` : "") +
		(oTargetTableInfo && oTargetTableInfo.tableHeader && includeTableGroupName
			? `, ${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${oTargetTableInfo.tableHeader}`
			: "")
	);
}

function bIsOrphanElement(oElement: UI5Element, aElements: UI5Element[]): boolean {
	return !aElements.some(function (oElem) {
		let oParentElement = oElement.getParent();
		while (oParentElement && oParentElement !== oElem) {
			oParentElement = oParentElement.getParent();
		}
		return oParentElement ? true : false;
	});
}

/**
 * This function filters and gives back the messages based on the context passed.
 * @param context
 * @returns Messages.
 */
function getMessagesForContext(context: Context): Message[] {
	const oMessageModel = Messaging.getMessageModel();
	const listBinding = oMessageModel.bindList("/");
	listBinding.filter(
		new Filter({
			path: "",
			test: (message: Message) => message.getTargets().length > 0 && message.getTargets()[0].startsWith(context.getPath())
		})
	);
	const currentContexts = listBinding.getCurrentContexts();
	return currentContexts.map((currentContext) => currentContext.getObject());
}

/**
 * This function returns the boolean to check if the target is present in the dialog based on the control Ids.
 * @param controlIds Array of control Ids
 * @returns Boolean value based on the target present in the dialog.
 */
function isMessageOutOfParameterDialog(controlIds: string[]): boolean {
	let oControl: ManagedObject | null | undefined, errorFieldControl;
	const index = Infinity;
	if (controlIds.length === 1) {
		oControl = UI5Element.getElementById(controlIds[0]);
		errorFieldControl = UI5Element.getElementById(controlIds[0]) as UI5Element;
	} else {
		let errorControlId;
		controlIds.forEach((controlId) => {
			const control = UI5Element.getElementById(controlId);
			if (control?.isA("sap.ui.mdc.Field")) {
				errorControlId = controlId;
				oControl = UI5Element.getElementById(errorControlId);
			}
		});
	}
	while (oControl) {
		const fieldRankinDialog = Infinity;
		if (oControl instanceof Dialog) {
			if (index > fieldRankinDialog) {
				// Set the focus to the dialog's control
				errorFieldControl?.focus();
			}
			// messages with target inside sap.m.Dialog should not bring up the message dialog
			return false;
		}
		oControl = oControl.getParent();
	}
	return true;
}

/**
 * Removes Transition messages related to the specified context path when the object page is closed.
 * @param oContext The binding context for which the messages are checked.
 */
function removeTransistionMessageForContext(oContext: Context): void {
	const messagesInModel = Messaging.getMessageModel().getData();
	const isMessageStripMessage: Message[] = [];

	messagesInModel?.forEach((message: Message) => {
		const isSingleTarget = message.getTargets().length === 1;
		const isTargetMatching = message.getTargets()[0] === oContext?.getPath();
		const isTransitionMessage = message.getPersistent() === true;

		if (isSingleTarget && isTargetMatching && isTransitionMessage) {
			isMessageStripMessage.push(message);
		}
	});

	if (isMessageStripMessage.length === 1) {
		Messaging.removeMessages(isMessageStripMessage);
	}
}

/**
 * This method is responsible for removing messages related to the context from the message model when there is error on the dialog and when the dialog is open.
 * @param messages Array of messages
 * @param contexts Contexts array
 */
function removeContextMessagesfromModel(messages?: Message[], contexts?: Context[]): void {
	const boundContextMessages: Message[] = [];
	if (contexts?.length === 1) {
		messages?.forEach((message: Message) => {
			if (
				message.getTargets().length === 1 &&
				message.getTargets()[0] === contexts?.[0]?.getPath() &&
				message.getPersistent() === true
			) {
				boundContextMessages.push(message);
			}
		});
	}
	if (boundContextMessages.length > 0) {
		Messaging.removeMessages(boundContextMessages);
	}
}

/**
 * This method is responsible for removing messages related to the action parameter dialog from showing the messages.
 * @param messages Array of messages
 * @returns Array of messages after removing the messages related to the action parameter dialog.
 */
function removeMessagesForActionParameterDialog(messages: Message[]): Message[] {
	const messagesToBeRemoved = messages?.filter((message: Message) => message.getPersistent() === true && message.getTargets()[0] !== "");
	messages = messages?.filter((message: Message) => !messagesToBeRemoved?.includes(message));
	return messages;
}

/**
 * Static functions for Fiori Message Handling
 * @namespace
 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
 * @since 1.56.0
 */
const messageHandling: messageHandlingType = {
	getMessages: getMessages,
	getUIDecisions: getUIDecisions,
	removeUnboundTransitionMessages: removeUnboundTransitionMessages,
	removeBoundTransitionMessages: removeBoundTransitionMessages,
	modifyETagMessagesOnly: fnModifyETagMessagesOnly,
	getRetryAfterMessage: getRetryAfterMessage,
	prepareMessageViewForDialog: prepareMessageViewForDialog,
	setMessageSubtitle: setMessageSubtitle,
	getVisibleSectionsFromObjectPageLayout: getVisibleSectionsFromObjectPageLayout,
	getControlFromMessageRelatingToSubSection: getControlFromMessageRelatingToSubSection,
	fnFilterUponIds: fnFilterUponIds,
	getTableAndTargetInfo: getTableAndTargetInfo,
	createSectionGroupName: createSectionGroupName,
	bIsOrphanElement: bIsOrphanElement,
	getLastActionTextAndActionName: getLastActionTextAndActionName,
	getTableColumnDataAndSetSubtile: getTableColumnDataAndSetSubtile,
	getTableColInfo: getTableColInfo,
	getTableColProperty: getTableColProperty,
	getMessageSubtitle: getMessageSubtitle,
	determineColumnInfo: determineColumnInfo,
	fetchColumnInfo: fetchColumnInfo,
	getTableColBindingContextForTextAnnotation: getTableColBindingContextForTextAnnotation,
	getMessageRank: getMessageRank,
	hasTransitionErrorsOrWarnings: hasTransitionErrorsOrWarnings,
	fnCallbackSetGroupName: fnCallbackSetGroupName,
	setGroupNameOPDisplayMode: setGroupNameOPDisplayMode,
	updateMessageObjectGroupName: updateMessageObjectGroupName,
	setGroupNameLRTable: setGroupNameLRTable,
	isControlInTable: isControlInTable,
	isControlPartOfCreationRow: isControlPartOfCreationRow,
	removeMessageShownInMessageStrip: removeMessageShownInMessageStrip,
	getFiltersForMessages: getFiltersForMessages,
	showMessagesInUI: showMessagesInUI,
	showMessageDialogControl: showMessageDialogControl,
	showMessageToast: showMessageToast,
	showMessageBoxControl: showMessageBoxControl,
	getMessagesForContext: getMessagesForContext,
	isMessageOutOfParameterDialog: isMessageOutOfParameterDialog,
	removeContextMessagesfromModel: removeContextMessagesfromModel,
	removeMessagesForActionParameterDialog: removeMessagesForActionParameterDialog,
	setGroupNameOPTableDisplayMode: setGroupNameOPTableDisplayMode,
	updateAddtionalTextForMessageInOPTable: updateAddtionalTextForMessageInOPTable,
	updateHeaderNameForMessageInOPTable: updateHeaderNameForMessageInOPTable,
	closeMessageBox: closeMessageBox,
	removeTransistionMessageForContext: removeTransistionMessageForContext,
	checkIfAllAreSameSuccessMessages: checkIfAllAreSameSuccessMessages,
	addGenericSuccessMessage: addGenericSuccessMessage,
	isNonTechnicalMessage: isNonTechnicalMessage
};

export default messageHandling;

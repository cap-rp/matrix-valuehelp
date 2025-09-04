import CommonUtils from "sap/fe/core/CommonUtils";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";

const MessageHandlerExtension = {
	getShowBoundMessagesInMessageDialog: function (this: MessageHandler): boolean {
		// in case of edit mode we show the messages in the message popover
		return (
			!CommonUtils.getIsEditable(this.base) ||
			(this.base.getView().getBindingContext("internal") as InternalModelContext).getProperty("isOperationDialogOpen") ||
			(this.base.getView().getBindingContext("internal") as InternalModelContext).getProperty("getBoundMessagesForMassEdit")
		);
	}
};

export default MessageHandlerExtension;

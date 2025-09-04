/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/library", "sap/m/MessageBox", "sap/ui/core/ElementRegistry", "sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "sap/ui/model/json/JSONModel", "../../dialog/ODataStrictDialog", "../../messageHandler/messageHandling"], function (Log, ResourceModelHelper, FELibrary, MessageBox, ElementRegistry, Messaging, Message, MessageType, JSONModel, StrictDialog, messageHandling) {
  "use strict";

  var _exports = {};
  const InvocationGrouping = FELibrary.InvocationGrouping;
  let ODataStrictHandling = /*#__PURE__*/function () {
    function ODataStrictHandling(parameters) {
      this.strictHandlingResolves = [];
      this.strictHandlingWarningMessages = [];
      this.canceled = false;
      this.isCanceled = () => {
        return this.canceled;
      };
      this.parameters = parameters;
      if (this.parameters.contexts.length) {
        const binding = this.parameters.contexts[0].getBinding();
        if (binding?.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          this.tableAPI = ElementRegistry.filter(element => element.isA("sap.fe.macros.table.TableAPI") && element.getContent()?.getRowBinding() === binding)[0];
        }
      }
    }
    _exports = ODataStrictHandling;
    var _proto = ODataStrictHandling.prototype;
    _proto.handleOdataStrictHandling = async function handleOdataStrictHandling(operationContextBinding, internalOperationsPromiseResolve, onContextValidation) {
      let messages412 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      let handlingResolve;
      const strictHandlingPromise = new Promise(function (resolve) {
        handlingResolve = resolve;
      });
      this.strictHandlingResolves.push(handlingResolve);
      // Find error message in the 412 response and raise warning.
      if (messages412.filter(message => message.getType() === MessageType.Error).length) {
        Log.warning("Warning: 412 ('Pre-condition Check Failed due to strict-handling') returns messages of type error but only warning messages are appropriate!");
      }
      let additionalText = "";
      // If there is more than one context we need the identifier. This would fix if the action is triggered via table chevron
      if (this.parameters.contexts.length > 1) {
        const column = this.tableAPI?.getIdentifierColumn();
        if (typeof column === "string") {
          additionalText = operationContextBinding.getContext()?.getObject(column);
        }
      }
      // set type and subtitle for all warning messages
      for (const message of messages412) {
        message.setAdditionalText(additionalText);
        this.strictHandlingWarningMessages.push(message);
      }
      this.parameters.events?.onResponse?.(messages412);
      internalOperationsPromiseResolve?.();
      this.onContextValidation(strictHandlingPromise, onContextValidation);
      return strictHandlingPromise;
    };
    _proto.onContextValidation = async function onContextValidation(strictHandlingPromise, onValidation) {
      const isValidated = await strictHandlingPromise;
      if (isValidated) {
        onValidation();
      }
    };
    /**
     * Manages the strict handling fails.
     * @returns The promise of the strict handling
     */
    _proto.manageStrictHandlingFails = async function manageStrictHandlingFails() {
      if (this.strictHandlingResolves.length) {
        try {
          if ((!messageHandling.hasTransitionErrorsOrWarnings() || this.parameters.invocationGrouping !== InvocationGrouping.ChangeSet) && this.strictHandlingWarningMessages.length) {
            await this.displayMessages();
          } else {
            for (const resolve of this.strictHandlingResolves) {
              resolve(false);
            }
            const messageModel = Messaging.getMessageModel();
            const messagesInModel = messageModel.getData();
            messageModel.setData(messagesInModel.concat(this.strictHandlingWarningMessages));
          }
        } catch {
          Log.error("Re-triggering of strict handling operations failed");
        }
      }
    };
    _proto.displayMessages = async function displayMessages() {
      const messages = this.strictHandlingWarningMessages;
      if (!messages.length) {
        return;
      }
      const actionName = ResourceModelHelper.getLocalizedText(this.parameters.label, this.parameters.appComponent);
      return messages.length === 1 && !(messages[0].getDescription()?.length || messages[0].getDescriptionUrl()?.length) ? this.displayMessageOnMessageBox(messages[0], actionName) : this.displayMessagesOnDialog(messages, actionName);
    };
    _proto.displayMessageOnMessageBox = async function displayMessageOnMessageBox(message, actionName) {
      let messageResolve;
      const promise = new Promise(resolve => {
        messageResolve = resolve;
      });
      const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
      const messageText = message.getMessage();
      const identifierText = message.getAdditionalText();
      const isMultiContext412 = this.parameters.contexts.length > 1;
      const genericChangesetMessage = resourceModel.getText("C_COMMON_DIALOG_CANCEL_SINGLE_MESSAGE_TEXT");
      const warningMessageText = this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGE_TEXT", [actionName]) : resourceModel.getText("C_COMMON_DIALOG_SKIP_SINGLE_MESSAGE_TEXT");
      let cancelButtonTxt = resourceModel.getText("C_COMMON_DIALOG_CANCEL");
      let displayedMessage = "";
      if (!isMultiContext412) {
        displayedMessage = `${messageText}\n${resourceModel.getText("PROCEED")}`;
      } else if (identifierText !== undefined && identifierText !== "") {
        cancelButtonTxt = this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? cancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        const headerInfoTypeName = this.tableAPI?.getTableDefinition().headerInfoTypeName;
        if (headerInfoTypeName) {
          displayedMessage = `${headerInfoTypeName.toString()} ${identifierText}: ${messageText}\n\n${warningMessageText}`;
        } else {
          displayedMessage = `${identifierText}: ${messageText}\n\n${warningMessageText}`;
        }
      } else {
        cancelButtonTxt = this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? cancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        displayedMessage = `${messageText}\n\n${warningMessageText}`;
      }
      if (isMultiContext412 && this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
        displayedMessage = `${genericChangesetMessage}\n\n${displayedMessage}`;
      }
      MessageBox.warning(displayedMessage, {
        title: resourceModel.getText("WARNING"),
        actions: [actionName, cancelButtonTxt],
        emphasizedAction: actionName,
        onClose: action => {
          this[action === actionName ? "handleMessageOnValidation" : "handleMessageOnCancel"]();
          messageResolve();
        }
      });
      return promise;
    };
    _proto.displayMessagesOnDialog = async function displayMessagesOnDialog(messages, actionName) {
      let messageResolve;
      const promise = new Promise(resolve => {
        messageResolve = resolve;
      });
      const messageDialogModel = new JSONModel();
      const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
      const isMultiContext412 = this.parameters.contexts.length > 1;
      let warningMessage = "";
      let warningDesc = "";
      let cancelButtonTxt = resourceModel.getText("C_COMMON_DIALOG_CANCEL");
      if (isMultiContext412) {
        cancelButtonTxt = this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? cancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        warningMessage = resourceModel.getText(this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? "C_COMMON_DIALOG_CANCEL_MESSAGES_WARNING" : "C_COMMON_DIALOG_SKIP_MESSAGES_WARNING");
        warningDesc = resourceModel.getText(this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? "C_COMMON_DIALOG_CANCEL_MESSAGES_TEXT" : "C_COMMON_DIALOG_SKIP_MESSAGES_TEXT", [actionName]);
      } else {
        warningMessage = resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGES_GENERIC_ACTION_WARNING", [actionName]);
      }
      const genericMessage = new Message({
        message: warningMessage,
        type: MessageType.Information,
        target: undefined,
        persistent: true,
        description: warningDesc.length ? warningDesc : undefined
      });
      messages = [genericMessage].concat(messages);
      messageDialogModel.setData(messages);
      new StrictDialog({
        messageObject: messageHandling.prepareMessageViewForDialog(messageDialogModel, true, isMultiContext412),
        actionName,
        messageDialogModel,
        cancelButtonTxt,
        onBeginButtonPress: this.handleMessageOnValidation.bind(this),
        onEndButtonPress: this.handleMessageOnCancel.bind(this),
        onClose: messageResolve
      }).open();
      return promise;
    };
    _proto.handleMessageOnValidation = function handleMessageOnValidation() {
      for (const resolve of this.strictHandlingResolves) {
        resolve(true);
      }
      messageHandling.removeBoundTransitionMessages();
      messageHandling.removeUnboundTransitionMessages();
      this.strictHandlingWarningMessages = [];
      this.parameters.events?.onValidation?.();
    };
    _proto.handleMessageOnCancel = function handleMessageOnCancel() {
      const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
      this.strictHandlingWarningMessages = [];
      this.canceled = true;
      for (const resolve of this.strictHandlingResolves) {
        resolve(false);
      }
      this.strictHandlingResolves = [];
      if (this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
        MessageBox.information(resourceModel.getText("M_CHANGESET_CANCEL_MESSAGES"), {
          contentWidth: "150px"
        });
      }
      this.parameters.events?.onCancel?.();
    };
    return ODataStrictHandling;
  }();
  _exports = ODataStrictHandling;
  return _exports;
}, false);
//# sourceMappingURL=ODataStrictHandling-dbg.js.map

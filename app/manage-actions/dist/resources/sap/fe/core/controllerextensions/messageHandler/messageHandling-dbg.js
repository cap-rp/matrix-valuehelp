/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ResourceModelHelper", "sap/m/Bar", "sap/m/Button", "sap/m/Dialog", "sap/m/FormattedText", "sap/m/MessageBox", "sap/m/MessageItem", "sap/m/MessageToast", "sap/m/MessageView", "sap/m/Text", "sap/m/library", "sap/ui/base/ManagedObject", "sap/ui/core/Element", "sap/ui/core/IconPool", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/format/DateFormat", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter", "sap/ui/model/json/JSONModel"], function (ResourceModelHelper, Bar, Button, Dialog, FormattedText, MessageBox, MessageItem, MessageToast, MessageView, Text, MLib, ManagedObject, UI5Element, IconPool, Library, Messaging, DateFormat, Message, MessageType, Filter, FilterOperator, Sorter, JSONModel) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  const ButtonType = MLib.ButtonType;
  let aResolveFunctions = [];
  let dialogControl;
  let oBackButton;
  let messageView;

  // FE related technical information to be stored with the message.
  // Like, this would be used to store pre-text with the message when it is the only message to be shown in UI.

  function fnFormatTechnicalDetails() {
    let sPreviousGroupName;

    // Insert technical detail if it exists
    function insertDetail(oProperty) {
      return oProperty.property ? "( ${" + oProperty.property + '} ? ("<p>' + oProperty.property.substring(Math.max(oProperty.property.lastIndexOf("/"), oProperty.property.lastIndexOf(".")) + 1) + ' : " + ' + "${" + oProperty.property + '} + "</p>") : "" )' : "";
    }
    // Insert groupname if it exists
    function insertGroupName(oProperty) {
      let sHTML = "";
      if (oProperty.groupName && oProperty.property && oProperty.groupName !== sPreviousGroupName) {
        sHTML += "( ${" + oProperty.property + '} ? "<br><h3>' + oProperty.groupName + '</h3>" : "" ) + ';
        sPreviousGroupName = oProperty.groupName;
      }
      return sHTML;
    }

    // List of technical details to be shown
    function getPaths() {
      const sTD = "technicalDetails"; // name of property in message model data for technical details
      return [{
        groupName: "",
        property: `${sTD}/status`
      }, {
        groupName: "",
        property: `${sTD}/statusText`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ComponentId`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceId`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceRepository`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceVersion`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/Analysis`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/Note`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/DetailedNote`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ExceptionCategory`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.TimeStamp`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.TransactionId`
      }, {
        groupName: "Messages",
        property: `${sTD}/error/code`
      }, {
        groupName: "Messages",
        property: `${sTD}/error/message`
      }];
    }
    let sHTML = "Object.keys(" + "${technicalDetails}" + ').length > 0 ? "<h2>Technical Details</h2>" : "" ';
    getPaths().forEach(function (oProperty) {
      sHTML = `${sHTML + insertGroupName(oProperty)}${insertDetail(oProperty)} + `;
    });
    return sHTML;
  }
  function fnFormatDescription() {
    return "(${" + "description} ? (${" + 'description}) : "")';
  }
  /**
   * Calculates the highest priority message type(Error/Warning/Success/Information) from the available messages.
   * @param [aMessages] Messages list
   * @returns Highest priority message from the available messages
   */
  function fnGetHighestMessagePriority(aMessages) {
    let sMessagePriority = MessageType.None;
    const iLength = aMessages.length;
    const oMessageCount = {
      Error: 0,
      Warning: 0,
      Success: 0,
      Information: 0
    };
    for (let i = 0; i < iLength; i++) {
      ++oMessageCount[aMessages[i].getType()];
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
  function fnModifyETagMessagesOnly(oResourceBundle, concurrentEditFlag) {
    const aMessages = Messaging.getMessageModel().getObject("/");
    let bMessagesModified = false;
    let sEtagMessage = "";
    aMessages.forEach(function (oMessage, i) {
      const oTechnicalDetails = oMessage.getTechnicalDetails && oMessage.getTechnicalDetails();
      if (oTechnicalDetails && oTechnicalDetails.httpStatus === 412 && oTechnicalDetails.isConcurrentModification) {
        if (concurrentEditFlag) {
          sEtagMessage = sEtagMessage || oResourceBundle.getText("C_APP_COMPONENT_SAPFE_ETAG_TECHNICAL_ISSUES_CONCURRENT_MODIFICATION");
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
  function dialogCloseHandler() {
    dialogControl.close();
    oBackButton.setVisible(false);
    const msgView = dialogControl.getContent()[0];
    const oMessageDialogModel = msgView.getModel();
    if (oMessageDialogModel) {
      oMessageDialogModel.setData({});
    }
    removeUnboundTransitionMessages();
  }
  function getRetryAfterMessage(oMessage, bMessageDialog) {
    const dNow = new Date();
    const oTechnicalDetails = oMessage.getTechnicalDetails();
    const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
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
          sRetryAfterMessage = `${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE")} ${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_DESC")}`;
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
  function hasTransitionErrorsOrWarnings() {
    return [...getMessages(undefined, true), ...getMessages(true, true)].some(function (message) {
      return message.getType() === "Error" || message.getType() === "Warning";
    });
  }
  function prepareMessageViewForDialog(oMessageDialogModel, bStrictHandlingFlow, multi412) {
    let oMessageTemplate;
    if (!bStrictHandlingFlow) {
      const descriptionBinding = '{= ${description} ? "<html><body>" + ' + fnFormatDescription() + ' + "</html></body>" : "" }';
      const technicalDetailsBinding = '{= ${technicalDetails} ? "<html><body>" + ' + fnFormatTechnicalDetails() + ' + "</html></body>" : "" }';
      oMessageTemplate = new MessageItem(undefined, {
        counter: {
          path: "counter"
        },
        title: "{message}",
        subtitle: "{additionalText}",
        longtextUrl: "{descriptionUrl}",
        type: {
          path: "type"
        },
        groupName: "{headerName}",
        description: descriptionBinding + technicalDetailsBinding,
        markupDescription: true
      });
    } else if (multi412) {
      oMessageTemplate = new MessageItem(undefined, {
        counter: {
          path: "counter"
        },
        title: "{message}",
        subtitle: "{additionalText}",
        longtextUrl: "{descriptionUrl}",
        type: {
          path: "type"
        },
        description: "{description}",
        markupDescription: true
      });
    } else {
      oMessageTemplate = new MessageItem({
        title: "{message}",
        type: {
          path: "type"
        },
        longtextUrl: "{descriptionUrl}"
      });
    }
    messageView = new MessageView({
      showDetailsPageHeader: false,
      itemSelect: function () {
        oBackButton.setVisible(true);
      },
      items: {
        path: "/",
        template: oMessageTemplate,
        length: 9999
      }
    });
    messageView.setGroupItems(true);
    oBackButton = oBackButton || new Button({
      icon: IconPool.getIconURI("nav-back"),
      visible: false,
      press: function () {
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
  function isNonTechnicalMessage(message) {
    const technicalDetails = message.getTechnicalDetails();
    if (technicalDetails && (technicalDetails.originalMessage !== undefined && technicalDetails.originalMessage !== null || technicalDetails.httpStatus !== undefined && technicalDetails.httpStatus !== null) || message.getCode()) {
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
  function getTransitionMessagesForUIDecision(showBoundTransition, _context) {
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
  function executeOnBeforeShowMessages(transitionMessages, onBeforeShowMessage) {
    let messagesToShow = [...transitionMessages];
    let uiElementToUse = transitionMessages.length === 1 && transitionMessages[0].getCode() === "503" ? "Box" : "Dialog";
    let fnGetMsgSubtitle;
    let showBoundMessages;
    if (onBeforeShowMessage) {
      // The callback onBeforeShowMessage alters the UIElement to use in a different format(showMessageDialog and showMessageBox).
      const showMessageParameters = {
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
  function getUIDecisions(customMessages, context) {
    let showBoundTransition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let concurrentEditFlag = arguments.length > 3 ? arguments[3] : undefined;
    let control = arguments.length > 4 ? arguments[4] : undefined;
    let actionName = arguments.length > 5 ? arguments[5] : undefined;
    let onBeforeShowMessage = arguments.length > 6 ? arguments[6] : undefined;
    let viewType = arguments.length > 7 ? arguments[7] : undefined;
    let showStateMessages = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : false;
    let messageDialogParameter = arguments.length > 9 ? arguments[9] : undefined;
    // Add Custom messages
    // TODO: Will these messages be part of transitionMessages?
    if (customMessages && customMessages.length) {
      addCustomMessages(customMessages);
    }

    // Get transistion Messages
    const transitionMessages = getTransitionMessagesForUIDecision.call(this, showBoundTransition, context);

    // UI representation of the Dialog
    const uiDecisionIntermittent = executeOnBeforeShowMessages.call(this, transitionMessages, onBeforeShowMessage);
    let {
      messagesToShow,
      uiElementToUse = "Dialog"
    } = uiDecisionIntermittent;
    // Get Filters for Unbound Messages
    showBoundTransition = uiDecisionIntermittent.containsBoundTransition ?? showBoundTransition;
    const filters = getFiltersForMessages(showBoundTransition, showStateMessages);
    messagesToShow = getMessagesToShow(filters, messagesToShow ?? []);
    // handle context bound messages, If there is a single message of which is bounded to the context then remove that from the dialog
    messagesToShow = removeMessageShownInMessageStrip(messagesToShow, context);
    ({
      messagesToShow,
      uiElementToUse
    } = processMessagesFromChangesetFailure({
      messagesToShow,
      uiElementToUse
    }));
    // Modify ETag Messages
    const hasEtagMessage = this.modifyETagMessagesOnly(Library.getResourceBundleFor("sap.fe.core"), concurrentEditFlag);
    if (messagesToShow.length > 0 && uiElementToUse !== "None") {
      if (messagesToShow.length > 1 && checkIfAllAreSameSuccessMessages(messagesToShow)) {
        const genericSuccessMessage = addGenericSuccessMessage(getResourceModel(control), messageDialogParameter);
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
        messagesToShow.forEach(function (oMessage) {
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
  function addGenericSuccessMessage(resourceModel, showMessageDialogParameter) {
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
  function checkIfAllAreSameSuccessMessages(messagesToShow) {
    let referenceMsg;
    const checkFailed = messagesToShow.some((msg, idx) => {
      if (msg.getType() !== MessageType.Success) {
        // Non success message
        return true;
      }
      if (idx === 0) {
        // 1st Message
        referenceMsg = msg;
        return false;
      } else if (referenceMsg.getCode() === msg.getCode() && referenceMsg.getMessage() === msg.getMessage() && referenceMsg.getDescription() === msg.getDescription() && referenceMsg.getDescriptionUrl() === msg.getDescriptionUrl() && referenceMsg.getAdditionalText() === msg.getAdditionalText()) {
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
  async function showMessagesInUI(uiDecisions) {
    const {
      messagesToShow,
      uiElementToUse
    } = uiDecisions;

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
  function getFiltersForMessages(showBoundTransition) {
    let showStateMessages = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const filters = showStateMessages ? [] : [new Filter({
      path: "persistent",
      operator: FilterOperator.NE,
      value1: false
    })];
    const isNonTechnicalMessageFilter = new Filter({
      path: "",
      test: isNonTechnicalMessage
    });
    if (showStateMessages || showBoundTransition) {
      // Add the filter for both state messages or bound transition messages
      const fnCheckControlIdInDialog = function (aControlIds) {
        return messageHandling.isMessageOutOfParameterDialog(aControlIds);
      };
      filters.push(new Filter({
        path: "controlIds",
        test: fnCheckControlIdInDialog,
        caseSensitive: true
      }));
      if (showBoundTransition && !showStateMessages) {
        // Add extra filter if only bound transition messages are shown
        filters.push(new Filter({
          path: "persistent",
          operator: FilterOperator.EQ,
          value1: true
        }));
        filters.push(isNonTechnicalMessageFilter);
      }
    } else {
      // Only unbound messages should be shown
      filters.push(new Filter({
        filters: [new Filter({
          path: "",
          test: message => message.getTargets().length === 0 || message.getTargets()[0] === ""
        }), isNonTechnicalMessageFilter],
        and: true
      }));
    }
    return filters;
  }
  function processMessagesFromChangesetFailure(_ref) {
    let {
      messagesToShow,
      uiElementToUse
    } = _ref;
    let retMessages = [...messagesToShow];
    if (messagesToShow.length === 2) {
      // There are 2 message:
      // 1. Generic error changeset message added by FE.
      // 2. Main error message from the interaction.
      // We remove the generic message, show only an enhanced 'Main error message' with a generic messsage pre-text in the message box.
      const genericMsgs = [];
      const nonGenericMsgs = [];
      messagesToShow.forEach(message => {
        if (message.getCode() === "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
          genericMsgs.push(message);
        } else {
          nonGenericMsgs.push(message);
        }
      });
      if (genericMsgs.length === 1) {
        const {
          fe: feTechnicalDetails
        } = genericMsgs[0].getTechnicalDetails() || {};
        if (feTechnicalDetails?.changeSetPreTextForSingleError) {
          const preText = feTechnicalDetails?.changeSetPreTextForSingleError;
          if (preText) {
            const techDetailsForNonGenericMessage = {
              fe: {
                singleErrorPreText: preText,
                singleGenericMessageId: genericMsgs[0].getId()
              }
            };
            const existingTechDetails = nonGenericMsgs[0].getTechnicalDetails() ?? {};
            // combine existing technical details if any, with the change set information we want to add.
            nonGenericMsgs[0].setTechnicalDetails({
              ...existingTechDetails,
              ...techDetailsForNonGenericMessage
            });
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
  function addCustomMessages(customMessages) {
    customMessages.forEach(function (oMessage) {
      const messageCode = oMessage.code ? oMessage.code : "";
      Messaging.addMessages(new Message({
        message: oMessage.text,
        type: oMessage.type,
        target: "",
        persistent: true,
        code: messageCode
      }));
      //The target and persistent properties of the message are hardcoded as "" and true because the function deals with only unbound messages.
    });
  }
  function getSorterForMessages() {
    return new Sorter("", undefined, undefined, (obj1, obj2) => {
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
  function getMessagesToShow(filters, transistionMessages) {
    let messagesToShow = [...transistionMessages];
    const listBinding = Messaging.getMessageModel().bindList("/", undefined, undefined, filters),
      currentContexts = listBinding.getCurrentContexts();
    if (currentContexts.length > 0) {
      // if false, show messages in dialog
      // As fitering has already happened here hence
      // using the message model again for the message dialog view and then filtering on that binding again is unnecessary.
      // So we create new json model to use for the message dialog view.
      const messages = currentContexts.map(currentContext => currentContext.getObject());
      const oUniqueObj = {};
      messagesToShow = messages.concat(messagesToShow).filter(function (obj) {
        // remove entries having duplicate message ids
        return !oUniqueObj[obj.getId()] && (oUniqueObj[obj.getId()] = true);
      });
    }
    return messagesToShow;
  }
  async function showMessageToast(message) {
    return new Promise(resolve => {
      MessageToast.show(message.getMessage());
      Messaging.removeMessages(message);
      resolve(undefined);
    });
  }
  async function showMessageDialogControl(uiDecision) {
    let runToTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let highestPriority;
    let highestPriorityText;
    return new Promise(function (resolve) {
      aResolveFunctions.push(resolve);
      const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
      const strictHandlingFlow = false;
      const {
        messagesToShow,
        contextNeedsEtagRefresh
      } = uiDecision;
      const messageDialogModel = new JSONModel(messagesToShow);
      const messageObject = prepareMessageViewForDialog(messageDialogModel, strictHandlingFlow);
      const sorter = getSorterForMessages();
      messageObject.messageView.getBinding("items").sort(sorter);
      if (!dialogControl || !dialogControl.isOpen()) {
        dialogControl = new Dialog({
          resizable: true,
          endButton: new Button({
            press: function () {
              dialogCloseHandler();
              // also remove bound transition messages if we were showing them
              Messaging.removeMessages(messagesToShow);
            },
            text: resourceBundle.getText("C_COMMON_SAPFE_CLOSE")
          }),
          escapeHandler: function (completionPromise) {
            dialogCloseHandler();
            // also remove bound transition messages if we were showing them
            Messaging.removeMessages(messagesToShow);
            completionPromise.resolve();
          },
          customHeader: new Bar({
            contentMiddle: [new Text({
              text: resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE")
            })],
            contentLeft: [oBackButton]
          }),
          contentWidth: "37.5em",
          contentHeight: "21.5em",
          verticalScrolling: false,
          closeOnNavigation: false,
          afterClose: function () {
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
        dialogControl.setBeginButton(new Button({
          press: function () {
            dialogCloseHandler();
            if (contextNeedsEtagRefresh.hasPendingChanges()) {
              contextNeedsEtagRefresh.getBinding().resetChanges();
            }
            contextNeedsEtagRefresh.refresh();
          },
          text: resourceBundle.getText("C_COMMON_SAPFE_REFRESH"),
          type: ButtonType.Emphasized
        }));
      } else {
        dialogControl.destroyBeginButton();
      }
      highestPriority = fnGetHighestMessagePriority(messageView.getItems());
      highestPriorityText = getTranslatedTextForMessageDialog(highestPriority);
      dialogControl.setState(highestPriority);
      dialogControl.getCustomHeader().getContentMiddle()[0].setText(highestPriorityText);
      messageView.navigateBack();
      dialogControl.open();
      if (runToTest) {
        resolve(dialogControl);
      }
    });
  }
  async function showMessageBoxControl(uiDecision) {
    return new Promise(function (resolve) {
      const {
        messagesToShow
      } = uiDecision;
      const messageToShow = messagesToShow[0];
      const messageTechnicalDetails = messageToShow.getTechnicalDetails();
      const {
        singleGenericMessageId,
        singleErrorPreText
      } = messageTechnicalDetails?.fe ?? {};
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
            const messageHeader = messageToShow?.["headerName"] ? `${messageToShow?.["headerName"]}:` : "";
            formattedTextString = `${formattedTextString}${singleErrorPreText}<br/><br/>${messageHeader} `;
          }
        }

        // Adding the main error message.
        if (messageToShow.getCode() !== "503" && messageToShow.getAdditionalText() !== undefined) {
          formattedTextString = `${formattedTextString + messageToShow.getAdditionalText()}: ${messageToShow.getMessage()}${closeTag}`;
        } else {
          formattedTextString = `${formattedTextString + messageToShow.getMessage()}${closeTag}`;
        }
        const formattedText = new FormattedText({
          htmlText: ManagedObject.escapeSettingsValue(formattedTextString)
        });
        showMessageBoxPerType(formattedText, {
          onClose: closeMessageBox.bind(null, messageToShow, resolve, singleGenericMessageId)
        }, messageToShow);
      }
    });
  }
  function closeMessageBox(messageShown, callBack, singleGenericMessageId) {
    const messagesToRemove = [messageShown];
    if (singleGenericMessageId) {
      const allMsgs = Messaging.getMessageModel().getData();
      const genericMessage = allMsgs.find(msg => msg.getId() === singleGenericMessageId);
      if (genericMessage) {
        messagesToRemove.push(genericMessage);
      }
    }
    Messaging.removeMessages(messagesToRemove);
    callBack(undefined);
  }
  function showMessageBoxPerType(formattedText, close, message) {
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
  function removeMessageShownInMessageStrip(transitionMessages, context) {
    const boundContextMessages = [];
    transitionMessages?.forEach(message => {
      if (message.getTargets().length === 1 && message.getTargets()[0] === context?.getPath() && message.getPersistent() === true) {
        boundContextMessages.push(message);
      }
    });
    if (boundContextMessages.length === 1) {
      transitionMessages = transitionMessages?.filter(function (message) {
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
  function updateMessageObjectGroupName(aModelDataArray, control, sActionName, viewType) {
    aModelDataArray.forEach(aModelData => {
      aModelData["headerName"] = "";
      if (!aModelData.target?.length && aModelData.getCode?.() !== "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
        // unbound transiiton messages
        const generalGroupText = Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
        aModelData["headerName"] = generalGroupText;
      } else if (aModelData.target?.length) {
        // LR flow
        if (viewType === "ListReport" && control?.isA("sap.ui.mdc.Table")) {
          messageHandling.setGroupNameLRTable(control, aModelData, sActionName);
        } else if (viewType === "ObjectPage") {
          // OP Display mode
          messageHandling.setGroupNameOPDisplayMode(aModelData, sActionName, control);
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
  function setGroupNameLRTable(oElem, aModelData, sActionName) {
    const oRowBinding = oElem && oElem.getRowBinding();
    if (oRowBinding) {
      const sElemeBindingPath = `${oElem.getRowBinding().getPath()}`;
      if (aModelData.target?.indexOf(sElemeBindingPath) === 0) {
        const allRowContexts = oRowBinding.getCurrentContexts();
        allRowContexts.forEach(rowContext => {
          if (aModelData.target?.includes(rowContext.getPath())) {
            const contextPath = `${rowContext.getPath()}/`;
            const identifierColumn = oElem.getParent().getIdentifierColumn();
            const rowIdentifier = identifierColumn && rowContext.getObject()[identifierColumn];
            const columnPropertyName = messageHandling.getTableColProperty(oElem, aModelData, contextPath);
            const {
              sTableTargetColName
            } = messageHandling.getTableColInfo(oElem, columnPropertyName);

            // if target has some column name and column is visible in UI
            if (columnPropertyName && sTableTargetColName) {
              // header will be row Identifier, if found from above code otherwise it should be table name
              aModelData["headerName"] = rowIdentifier ? ` ${rowIdentifier}` : oElem.getHeader();
            } else {
              // if column data not found (may be the column is hidden), add grouping as Last Action
              aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
            }
          }
        });
      }
    }
  }
  function updateAddtionalTextForMessageInOPTable(mdcTable, message, targetTableInfo) {
    const identifierColumn = mdcTable.getParent().getIdentifierColumn();
    if (identifierColumn) {
      const allRowContexts = mdcTable.getRowBinding().getContexts();
      allRowContexts.forEach(rowContext => {
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
  function updateHeaderNameForMessageInOPTable(subsection, mdcTable, message, targetTableInfo) {
    let headerName = mdcTable.getHeaderVisible() && targetTableInfo.tableHeader;
    if (!headerName) {
      headerName = subsection.getTitle();
    } else {
      const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
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
  function setGroupNameOPTableDisplayMode(subsection, mdcTable, message, viewContext, groupNameIsGeneral, actionName) {
    const oRowBinding = mdcTable.getRowBinding(),
      setSectionNameInGroup = true;
    let childTableElement;
    mdcTable.findElements(true).forEach(oElement => {
      if (oElement.isA("sap.m.Table") || oElement.isA("sap.ui.table.Table")) {
        childTableElement = oElement;
      }
    });
    if (oRowBinding) {
      const sElemeBindingPath = `${viewContext?.getPath()}/${mdcTable.getRowBinding()?.getPath()}`;
      if (message.target?.indexOf(sElemeBindingPath) === 0) {
        const obj = messageHandling.getTableColumnDataAndSetSubtile(message, mdcTable, childTableElement, oRowBinding, actionName, setSectionNameInGroup, fnCallbackSetGroupName);
        const {
          oTargetTableInfo
        } = obj;
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
  function setGroupNameOPDisplayMode(aModelData, sActionName, control) {
    const oViewContext = control?.getBindingContext();
    const opLayout = control?.getContent && control?.getContent()[0];
    let bIsGeneralGroupName = true;
    if (opLayout) {
      messageHandling.getVisibleSectionsFromObjectPageLayout(opLayout).forEach(function (oSection) {
        const subSections = oSection.getSubSections();
        subSections.forEach(function (oSubSection) {
          oSubSection.findElements(true).forEach(function (oElem) {
            if (oElem.isA("sap.ui.mdc.Table")) {
              bIsGeneralGroupName = setGroupNameOPTableDisplayMode(oSubSection, oElem, aModelData, oViewContext, bIsGeneralGroupName, sActionName);
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
        aModelData["headerName"] = Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
      }
    }
  }
  function getLastActionTextAndActionName(sActionName) {
    const sLastActionText = Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_LAST_ACTION");
    return sActionName ? `${sLastActionText}: ${sActionName}` : "";
  }

  /**
   * This function will give rank based on Message Group/Header name, which will be used for Sorting messages in Message dialog
   * Last Action should be shown at top, next Row Id and last General.
   * @param obj
   * @returns Rank of message
   */
  function getMessageRank(obj) {
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
  const fnCallbackSetGroupName = (aMessage, sActionName, bIsGeneralGroupName) => {
    if (bIsGeneralGroupName) {
      aMessage["headerName"] = Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
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
  function getTableColumnDataAndSetSubtile(aMessage, oTable, oElement, oRowBinding, sActionName, setSectionNameInGroup, fnSetGroupName) {
    const oTargetTableInfo = messageHandling.getTableAndTargetInfo(oTable, aMessage, oElement, oRowBinding);
    oTargetTableInfo.tableHeader = oTable.getHeader();
    let sControlId, bIsCreationRow;
    if (!oTargetTableInfo.oTableRowContext) {
      sControlId = aMessage.getControlIds().find(function (sId) {
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
    const subTitle = messageHandling.getMessageSubtitle(aMessage, oTargetTableInfo.oTableRowBindingContexts, oTargetTableInfo.oTableRowContext, oTargetTableInfo.sTableTargetColName, oTable, bIsCreationRow);
    return {
      oTargetTableInfo,
      subTitle
    };
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
  function getMessageSubtitle(message, tableRowBindingContexts, tableRowContext, tableTargetColName, table, isCreationRow, targetedControl) {
    let messageSubtitle;
    let rowSubtitleValue;
    const resourceModel = getResourceModel(table);
    const tableColProperty = table.getParent()?.getTableColumnVisibilityInfo(tableRowContext);
    const colFromTableSettings = messageHandling.fetchColumnInfo(message, table);
    if (isCreationRow || tableRowContext?.isInactive()) {
      messageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_CREATION_ROW_INDICATOR"), tableTargetColName ? tableTargetColName : colFromTableSettings.label]);
    } else {
      const tableColBindingContextTextAnnotation = messageHandling.getTableColBindingContextForTextAnnotation(table, tableRowContext, tableColProperty);
      const tableColTextAnnotationPath = tableColBindingContextTextAnnotation ? tableColBindingContextTextAnnotation.getObject("$Path") : undefined;
      const tableColTextArrangement = tableColTextAnnotationPath && tableColBindingContextTextAnnotation ? tableColBindingContextTextAnnotation.getObject("@com.sap.vocabularies.UI.v1.TextArrangement/$EnumMember") : undefined;
      if (tableRowBindingContexts.length > 0) {
        // set Row subtitle text
        if (targetedControl) {
          // The UI error is on the first column, we then get the control input as the row indicator:
          rowSubtitleValue = targetedControl.getValue();
        } else if (tableRowContext && tableColProperty && tableColProperty.length === 1) {
          // Getting the column label and its value of a single row
          rowSubtitleValue = table.getParent()?.getTableColValue(tableRowContext, tableColTextAnnotationPath, tableColTextArrangement, tableColProperty);
        } else if (tableRowContext && tableColProperty && tableColProperty.length > 1) {
          // If there are multiple rows, the subtitle is displayed as ‘See message details’
          rowSubtitleValue = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_DETAILED_ROW_INFO");
        } else {
          rowSubtitleValue = undefined;
        }
        // set the message subtitle
        const oColumnInfo = messageHandling.determineColumnInfo(colFromTableSettings, resourceModel);
        if (rowSubtitleValue && tableTargetColName) {
          messageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [rowSubtitleValue, tableTargetColName]);
        } else if (rowSubtitleValue && oColumnInfo.sColumnIndicator === "Hidden") {
          messageSubtitle = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW_WITH_IDENTIFIER", [rowSubtitleValue])}, ${oColumnInfo.sColumnValue}`;
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
  function getTableColBindingContextForTextAnnotation(table, tableRowContext, tableColProperty) {
    let bindingContext;
    if (tableRowContext && tableColProperty && tableColProperty.length === 1) {
      const {
        key
      } = tableColProperty[0];
      const oModel = table?.getModel();
      const oMetaModel = oModel?.getMetaModel(); // must be an ODataMetaModel to match the type of the table row context
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

  function fetchColumnInfo(oMessage, oTable) {
    const sColNameFromMessageObj = oMessage?.getTargets()[0].split("/").pop();
    return oTable.getParent()?.getKeyColumnInfo(sColNameFromMessageObj);
  }

  /**
   * This function gets the Column data depending on its availability in Table, this is needed for setting subtitle of Message.
   * @param oColFromTableSettings
   * @param resourceModel
   * @returns Column data.
   */
  function determineColumnInfo(oColFromTableSettings, resourceModel) {
    const oColumnInfo = {
      sColumnIndicator: "",
      sColumnValue: ""
    };
    if (oColFromTableSettings) {
      // if column is neither in table definition nor personalization, show only row subtitle text
      if (oColFromTableSettings.availability === "Hidden") {
        oColumnInfo.sColumnValue = undefined;
        oColumnInfo.sColumnIndicator = "undefined";
      } else {
        //if column is in table personalization but not in table definition, show Column (Hidden) : <colName>
        oColumnInfo.sColumnValue = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN")} (${resourceModel.getText("T_COLUMN_INDICATOR_IN_TABLE_DEFINITION")}): ${oColFromTableSettings.label}`;
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
  function isControlInTable(oTable, sControlId) {
    const oControl = UI5Element.getElementById(sControlId);
    if (oControl && !oControl.isA("sap.ui.table.Table") && !oControl.isA("sap.m.Table")) {
      return oTable.findElements(true, function (oElem) {
        return oElem.getId() === oControl.getId();
      });
    }
    return false;
  }
  function isControlPartOfCreationRow(oControl) {
    let oParentControl = oControl?.getParent();
    while (oParentControl && !oParentControl?.isA("sap.ui.table.Row") && !oParentControl?.isA("sap.ui.table.CreationRow") && !oParentControl?.isA("sap.m.ColumnListItem")) {
      oParentControl = oParentControl.getParent();
    }
    return !!oParentControl && oParentControl.isA("sap.ui.table.CreationRow");
  }
  function getTranslatedTextForMessageDialog(sHighestPriority) {
    const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
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
  function removeUnboundTransitionMessages() {
    removeTransitionMessages(false);
  }
  function removeBoundTransitionMessages(sPathToBeRemoved) {
    removeTransitionMessages(true, sPathToBeRemoved);
  }
  function getMessagesFromMessageModel(oMessageModel, sPathToBeRemoved) {
    if (sPathToBeRemoved === undefined) {
      return oMessageModel.getObject("/");
    }
    const listBinding = oMessageModel.bindList("/");
    listBinding.filter(new Filter({
      path: "",
      test: message => message.getTargets().some(target => target.startsWith(sPathToBeRemoved))
    }));
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
  function getMessages() {
    let bBoundMessages = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    let bTransitionOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let sPathToBeRemoved = arguments.length > 2 ? arguments[2] : undefined;
    let i;
    const oMessageModel = Messaging.getMessageModel(),
      oResourceBundle = Library.getResourceBundleFor("sap.fe.core"),
      aTransitionMessages = [];
    let aMessages = [];
    if (bBoundMessages && bTransitionOnly && sPathToBeRemoved) {
      aMessages = getMessagesFromMessageModel(oMessageModel, sPathToBeRemoved);
    } else {
      aMessages = oMessageModel.getObject("/");
    }
    for (i = 0; i < aMessages.length; i++) {
      if ((!bTransitionOnly || aMessages[i].getPersistent()) && (bBoundMessages && aMessages[i].getTargets()[0] !== "" || !bBoundMessages && (!aMessages[i].getTargets()[0] || aMessages[i].getTargets()[0] === ""))) {
        aTransitionMessages.push(aMessages[i]);
      }
    }
    for (i = 0; i < aTransitionMessages.length; i++) {
      if (aTransitionMessages[i].getCode() === "503" && aTransitionMessages[i].getMessage() !== "" && !aTransitionMessages[i].getMessage().includes(oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX"))) {
        aTransitionMessages[i].setMessage(`\n${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX")}${aTransitionMessages[i].getMessage()}`);
      }
    }
    //Filtering messages again here to avoid showing pure technical messages raised by the model
    const backendMessages = aTransitionMessages.filter(isNonTechnicalMessage);
    return backendMessages;
  }
  function removeTransitionMessages(bBoundMessages, sPathToBeRemoved) {
    const aMessagesToBeDeleted = getMessages(bBoundMessages, true, sPathToBeRemoved);
    if (aMessagesToBeDeleted.length > 0) {
      Messaging.removeMessages(aMessagesToBeDeleted);
    }
  }
  //TODO: This must be moved out of message handling
  function setMessageSubtitle(oTable, aContexts, message) {
    if (message.additionalText === undefined) {
      const subtitleColumn = oTable.getParent().getIdentifierColumn();
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
  function getVisibleSectionsFromObjectPageLayout(oObjectPageLayout) {
    return oObjectPageLayout.getSections().filter(function (oSection) {
      return oSection.getVisible();
    });
  }

  /**
   * This function checks if control ids from message are a part of a given subsection.
   * @param subSection
   * @param oMessageObject
   * @returns SubSection matching control ids.
   */
  function getControlFromMessageRelatingToSubSection(subSection, oMessageObject) {
    return subSection.findElements(true, oElem => {
      return fnFilterUponIds(oMessageObject.getControlIds(), oElem);
    }).sort(function (a, b) {
      // controls are sorted in order to have the table on top of the array
      // it will help to compute the subtitle of the message based on the type of related controls
      if (a.isA("sap.ui.mdc.Table") && !b.isA("sap.ui.mdc.Table")) {
        return -1;
      }
      return 1;
    });
  }
  function getTableColProperty(oTable, oMessageObject, oContextPath) {
    //this function escapes a string to use it as a regex
    const fnRegExpescape = function (s) {
      return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    };
    // based on the target path of the message we retrieve the property name.
    // to achieve it we remove the bindingContext path and the row binding path from the target
    if (!oContextPath) {
      const contextPathToEscape = `${oTable.getBindingContext()?.getPath()}/${oTable.getRowBinding().getPath()}`;
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
  function getTableColInfo(oTable, sTableTargetColProperty) {
    let sTableTargetColName;
    const oTableTargetCol = oTable.getColumns().find(function (column) {
      return column.getPropertyKey() == sTableTargetColProperty;
    });
    if (!oTableTargetCol) {
      /* If the target column is not found, we check for a custom column */
      const oCustomColumn = oTable.getControlDelegate().getColumnsFor(oTable).find(function (oColumn) {
        if (!!oColumn.template && oColumn.propertyInfos) {
          return oColumn.propertyInfos[0] === sTableTargetColProperty || oColumn.propertyInfos[0].replace("Property::", "") === sTableTargetColProperty;
        } else {
          return false;
        }
      });
      if (oCustomColumn) {
        sTableTargetColProperty = oCustomColumn?.name;
        sTableTargetColName = oTable.getColumns().find(function (oColumn) {
          return sTableTargetColProperty === oColumn.getPropertyKey();
        })?.getHeader();
      } else {
        /* If the target column is not found, we check for a field group */
        const aColumns = oTable.getControlDelegate().getColumnsFor(oTable);
        const columnDefinition = aColumns.find(function (oColumn) {
          if (oColumn.key.includes("::FieldGroup::")) {
            return oColumn.propertyInfos?.find(function (propertyInfo) {
              return propertyInfo === sTableTargetColProperty || propertyInfo.replace("Property::", "") === sTableTargetColProperty;
            });
          }
        });
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
    return {
      sTableTargetColName: sTableTargetColName,
      sTableTargetColProperty: sTableTargetColProperty
    };
  }

  /**
   * This function gives Table and column info if any of it matches the target from Message.
   * @param oTable
   * @param oMessageObject
   * @param oElement
   * @param oRowBinding
   * @returns Table info matching the message target.
   */
  function getTableAndTargetInfo(oTable, oMessageObject, oElement, oRowBinding) {
    const sTableTargetColProperty = getTableColProperty(oTable, oMessageObject);
    const oTableColInfo = getTableColInfo(oTable, sTableTargetColProperty);
    const oTableRowBindingContexts = oElement?.isA("sap.ui.table.Table") ? oRowBinding.getContexts() : oRowBinding.getCurrentContexts();
    const oTargetTableInfo = {
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
  function fnFilterUponIds(aControlIds, oItem) {
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
  function createSectionGroupName(section, subSection, bMultipleSubSections, oTargetTableInfo, resourceModel) {
    let includeTableGroupName = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
    return section.getTitle() + (subSection.getTitle() && bMultipleSubSections ? `, ${subSection.getTitle()}` : "") + (oTargetTableInfo && oTargetTableInfo.tableHeader && includeTableGroupName ? `, ${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${oTargetTableInfo.tableHeader}` : "");
  }
  function bIsOrphanElement(oElement, aElements) {
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
  function getMessagesForContext(context) {
    const oMessageModel = Messaging.getMessageModel();
    const listBinding = oMessageModel.bindList("/");
    listBinding.filter(new Filter({
      path: "",
      test: message => message.getTargets().length > 0 && message.getTargets()[0].startsWith(context.getPath())
    }));
    const currentContexts = listBinding.getCurrentContexts();
    return currentContexts.map(currentContext => currentContext.getObject());
  }

  /**
   * This function returns the boolean to check if the target is present in the dialog based on the control Ids.
   * @param controlIds Array of control Ids
   * @returns Boolean value based on the target present in the dialog.
   */
  function isMessageOutOfParameterDialog(controlIds) {
    let oControl, errorFieldControl;
    const index = Infinity;
    if (controlIds.length === 1) {
      oControl = UI5Element.getElementById(controlIds[0]);
      errorFieldControl = UI5Element.getElementById(controlIds[0]);
    } else {
      let errorControlId;
      controlIds.forEach(controlId => {
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
  function removeTransistionMessageForContext(oContext) {
    const messagesInModel = Messaging.getMessageModel().getData();
    const isMessageStripMessage = [];
    messagesInModel?.forEach(message => {
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
  function removeContextMessagesfromModel(messages, contexts) {
    const boundContextMessages = [];
    if (contexts?.length === 1) {
      messages?.forEach(message => {
        if (message.getTargets().length === 1 && message.getTargets()[0] === contexts?.[0]?.getPath() && message.getPersistent() === true) {
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
  function removeMessagesForActionParameterDialog(messages) {
    const messagesToBeRemoved = messages?.filter(message => message.getPersistent() === true && message.getTargets()[0] !== "");
    messages = messages?.filter(message => !messagesToBeRemoved?.includes(message));
    return messages;
  }

  /**
   * Static functions for Fiori Message Handling
   * @namespace
   * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
   * @since 1.56.0
   */
  const messageHandling = {
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
  return messageHandling;
}, false);
//# sourceMappingURL=messageHandling-dbg.js.map

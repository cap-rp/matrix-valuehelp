/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Button", "sap/m/MessageItem", "sap/m/MessagePopover", "sap/m/library", "sap/ui/core/Element", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, BuildingBlock, Button, MessageItem, MessagePopover, library, UI5Element, Messaging, MessageType, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var ButtonType = library.ButtonType;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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
  let MessageButton = (_dec = defineUI5Class("sap.fe.macros.MessageButton"), _dec2 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function MessageButton(idOrSettings, settings) {
      var _this;
      _this = _BuildingBlock.call(this, idOrSettings, settings) || this;
      /**
       * The event is triggered when the message button's visibility changes.
       * @public
       */
      _initializerDefineProperty(_this, "visibilityChange", _descriptor, _this);
      _this._messageItemMessageDetailMap = {};
      return _this;
    }
    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = MessageButton;
    _inheritsLoose(MessageButton, _BuildingBlock);
    var _proto = MessageButton.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
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
     */;
    _proto.processMessages = async function processMessages() {
      const messages = this._messageModel?.getData();

      // get bound messages.
      const messageDetails = messages.reduce((reducedMessages, message) => {
        const isBound = message.getTargets().length > 0;
        const isMessageTechnical = message.getTechnical();
        if (isBound && !isMessageTechnical) {
          reducedMessages.push({
            message
          });
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
     */;
    _proto.adjustMessageButtonProperties = function adjustMessageButtonProperties(messageDetails) {
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
        const messageItems = [];
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
        const prioritizedButtonType = [ButtonType.Negative, ButtonType.Critical, ButtonType.Success, ButtonType.Neutral, ButtonType.Default];
        this.getContent()?.setType(prioritizedButtonType[availableHighestPriority]);

        // setTooltip
        const prioritizedToolTipKey = ["C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR", "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_WARNING_TOOLTIP", "C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_SUCCESS", "C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO", ""];
        const tooltipKey = errorCount > 1 ? "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_MULTIPLE_ERROR_TOOLTIP" : prioritizedToolTipKey[availableHighestPriority];
        let tooltipText = this.getTranslatedText(tooltipKey);
        if (errorCount > 1) {
          tooltipText = `${errorCount}  ${tooltipText}`;
        }
        this.getContent()?.setTooltip(tooltipText);

        // setVisible
        if (!this.getContent()?.getVisible()) {
          this.getContent()?.setVisible(true);
          this.fireEvent("visibilityChange", {
            visible: this.getContent()?.getVisible()
          });
        }

        // also show the message popover
        this.createMessagePopover(messageItems);
      }
      if (messageDetails.length === 0) {
        if (this.getContent()?.getVisible()) {
          this.getContent()?.setVisible(false);
          this.fireEvent("visibilityChange", {
            visible: this.getContent()?.getVisible()
          });
        }
      }
    }

    /**
     * Creates a message Item.
     * @param messageDetail Message detail relevant for creating the message item.
     * @returns MessageItem created from Message Detail
     */;
    _proto.createMessageItem = function createMessageItem(messageDetail) {
      const message = messageDetail.message;
      const messageItem = _jsx(MessageItem, {
        title: message.getMessage(),
        description: message.getDescription(),
        type: message.getType(),
        markupDescription: true,
        longtextUrl: message.getDescriptionUrl(),
        subtitle: message.getAdditionalText(),
        groupName: messageDetail.groupName || this.getTranslatedText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL"),
        activeTitle: message.getControlIds().length > 0 || typeof messageDetail.activeTitleHandler === "function"
      });
      this._messageItemMessageDetailMap[messageItem.getId()] = messageDetail;
      return messageItem;
    }

    /**
     * Creates a message Popover.
     * @param messageItems
     */;
    _proto.createMessagePopover = function createMessagePopover(messageItems) {
      this._messagePopover?.destroy();
      this._messagePopover = _jsx(MessagePopover, {
        groupItems: true,
        activeTitlePress: pressEvent => {
          const messageItem = pressEvent.getParameter("item");
          this.handleActiveTitlePress(messageItem);
        },
        children: {
          items: messageItems
        }
      });
      this.getContent()?.addDependent(this._messagePopover);
      setTimeout(() => {
        this._messagePopover.openBy(this.getContent());
      }, 0);
    }
    /**
     * Handles active title press.
     *
     * If an activeTitleHandler is provided by the consumer via the controller extension then it is called.
     * Otherwise, we try to focus on the control if a control Id in the message is available.
     * @param messageItem
     */;
    _proto.handleActiveTitlePress = function handleActiveTitlePress(messageItem) {
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
     */;
    _proto.toggleMessagePopover = function toggleMessagePopover() {
      this._messagePopover.toggle(this.content);
    }
    /**
     * Creates the content for the building block.
     * @returns The created content control.
     */;
    _proto.createContent = function createContent() {
      return _jsx(Button, {
        visible: "false",
        press: this.toggleMessagePopover.bind(this)
      });
    };
    return MessageButton;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "visibilityChange", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = MessageButton;
  return _exports;
}, false);
//# sourceMappingURL=MessageButton-dbg.js.map

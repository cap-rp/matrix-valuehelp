/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils"], function (CommonUtils) {
  "use strict";

  const MessageHandlerExtension = {
    getShowBoundMessagesInMessageDialog: function () {
      // in case of edit mode we show the messages in the message popover
      return !CommonUtils.getIsEditable(this.base) || this.base.getView().getBindingContext("internal").getProperty("isOperationDialogOpen") || this.base.getView().getBindingContext("internal").getProperty("getBoundMessagesForMassEdit");
    }
  };
  return MessageHandlerExtension;
}, false);
//# sourceMappingURL=MessageHandler-dbg.js.map

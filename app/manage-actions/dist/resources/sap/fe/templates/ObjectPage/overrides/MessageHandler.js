/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils"],function(e){"use strict";const t={getShowBoundMessagesInMessageDialog:function(){return!e.getIsEditable(this.base)||this.base.getView().getBindingContext("internal").getProperty("isOperationDialogOpen")||this.base.getView().getBindingContext("internal").getProperty("getBoundMessagesForMassEdit")}};return t},false);
//# sourceMappingURL=MessageHandler.js.map
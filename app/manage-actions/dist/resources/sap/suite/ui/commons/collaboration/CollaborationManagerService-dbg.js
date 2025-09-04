/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Core",
    "./BaseHelperService",
    "sap/ui/Device",
    "sap/ui/core/Lib",
    "sap/suite/ui/commons/collaboration/channels/MessageChannel"
], function (Log, Core, BaseHelperService, Device, Library, MessageChannel) {
    "use strict";

    /**
     * Provides the Collaboration options
     * @namespace
     * @since 1.125
     * @alias module:sap/suite/ui/commons/collaboration/CollaborationManagerService
     * @private
     * @ui5-restricted
     * @experimental Since 1.125
     */

    var CollaborationManagerService = BaseHelperService.extend("sap.suite.ui.commons.collaboration.CollaborationManagerService");
    var oResourceBundle = Library.getResourceBundleFor("sap.suite.ui.commons");
    var oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.CollaborationManagerService");

    CollaborationManagerService.prototype.triggerH2HChat = function (sAppTitle, sCurrentURL, sEmailId) {
		this.publishData({ sAppTitle, sCurrentURL, sEmailId });
    };

    CollaborationManagerService.prototype.getOptions = function () {
        var H2hChatPlugins = window["sap-ushell-config"] && window["sap-ushell-config"].bootstrapPlugins && window["sap-ushell-config"].bootstrapPlugins.H2H_CHAT_PLUGIN;
        if (Device.system.desktop) {
            if (H2hChatPlugins) {
                return {
                    "text": oResourceBundle.getText("COLLABORATION_MANGER") ,
                    "icon": "sap-icon://BusinessSuiteInAppSymbols/icon-collaboration-manager",
                    "press": this.triggerH2HChat.bind(this),
                    "fesrStepName": "CM:ShareLink"
                };
            } else {
                oLogger.info("Consumer disable Collaboration Manager option");
            }
        } else {
            oLogger.info("Collaboration Manager is not supported in Phone and Tablet");
        }
        return null;
    };

	/**
	 * Distributes data from FLP and embedded iframes.
	 * @param {object} oData - The data to be shared through the channel.
	 */
	CollaborationManagerService.prototype.publishData = async function(oData) {
		try {
			// Obtain the singleton instance of the MessageChannel
			const oMessageChannel = await MessageChannel.getInstance();
			// Send the message
			oMessageChannel.postMessage(oData);
		} catch (error) {
			oLogger.error("Failed to publish data:", error);
		}
	};

    return CollaborationManagerService;
});

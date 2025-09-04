/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Lib"
], function(Log, Library) {
    "use strict";

    let oCollaborationMessageBroker;
    const oLogger = Log.getLogger("sap.suite.ui.commons.windowmessages.CollaborationMessageBroker");

    function CollaborationMessageBroker(oProviderConfiguration) {
        oLogger.info("CollaborationMessageBroker instance is created");
        const CLIENT_ID = "sap-suite-ui-commons-collaboration-message-broker";
        const CHANNEL_ID = "collaboration-channel";
        const MSG_NAME = "get-provider-config";
        const UPDATE_TOP_LEVEL_URL_MSG_NAME = "update-top-level-url";
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        if (!UshellContainer) {
            oLogger.info("UShell Container instance doesn't exist");
            return;
        }
        const aSubscribedChannels = [
            {
                channelId: CHANNEL_ID,
                version: "1.0"
            }
        ];

        // Function to publish a message to the subscribers
        const notifySubscribers = async function (sClientId, sMessageName, oResponseData) {
            try {
                const oMessageBrokerService = await UshellContainer.getServiceAsync("MessageBroker");
                const sResponseData = JSON.stringify(oResponseData);
                await oMessageBrokerService.publish(CHANNEL_ID, CLIENT_ID, Date.now().toString(), sMessageName, [sClientId], sResponseData);
                oLogger.info(`Published successfully to CLIENT_ID: ${sClientId} on CHANNEL_ID: ${CHANNEL_ID} DATA: ${sResponseData}`);
            } catch (error) {
                oLogger.error(`Failed to publish message: ${error}`);
            }
        };

        const handleGetProviderConfig = function (sClientId, sMessageName, oProviderConfiguration) {
            notifySubscribers(sClientId, sMessageName, oProviderConfiguration);
        };

        const handleUpdateTopLevelUrl = function (sClientId, sMessageName, oData) {
            if (!oData) { return; }
            try {
                const parsedData = JSON.parse(oData);
                if (parsedData?.url) {
                    notifySubscribers(sClientId, sMessageName, { success: true });
                    window.location.replace(parsedData.url);
                    window.location.reload();
                } else {
                    oLogger.info("Invalid URL in the message data.");
                }
            } catch (error) {
                oLogger.error("Failed to parse the message data: " + error);
            }
        };

        // Callback method which is triggered when a someone fires a Message is posted for the MSG_CHANNEL_ID_PROVIDER
        // and MSG_CLIENT_ID. Method will publish a message to the requesting client ID on the MSG_CHANNEL_ID_CONSUMER.
        const fnMessageCallback = function(sClientId, sChannelId, sMessageName, oData) {
            oLogger.info("Message Received from CLIENT_ID: " + sClientId + " on CHANNEL_ID: " + sChannelId);

            switch (sMessageName) {
                case MSG_NAME:
                    handleGetProviderConfig(sClientId, sMessageName, oProviderConfiguration);
                    break;
                case UPDATE_TOP_LEVEL_URL_MSG_NAME:
                    handleUpdateTopLevelUrl(sClientId, sMessageName, oData);
                    break;
                default:
                    oLogger.info("Message: '" + sMessageName + "' is not supported");
            }
        };

        UshellContainer.getServiceAsync("MessageBroker").then(function (oMessageBrokerService) {
            oMessageBrokerService.connect(CLIENT_ID).then(function() {
                oLogger.info("Client ID: " + CLIENT_ID + " is connected successfully");
                oMessageBrokerService.subscribe(CLIENT_ID, aSubscribedChannels, fnMessageCallback, Function.prototype);
            });
        });
    }

    return {
        /**
         * Method start the CollaborationMessageBroker in case it is not started else does nothing
         * @param {Object} oProviderConfiguration Should contain the configuration object which needs to be provided
         * @returns {void}
         */
        startInstance: function(oProviderConfiguration) {
            oLogger.info("CollaborationMessageBroker=>startInstance method is being called");
            if (!oCollaborationMessageBroker) {
                oCollaborationMessageBroker = new CollaborationMessageBroker(oProviderConfiguration);
            }
        }
    };
});

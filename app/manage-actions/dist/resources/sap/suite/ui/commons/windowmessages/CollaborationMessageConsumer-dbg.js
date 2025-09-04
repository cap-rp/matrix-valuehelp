/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
    "sap/base/Log"
], function (Log) {
    "use strict";

    const oLogger = Log.getLogger("sap.suite.ui.commons.windowmessages.CollaborationMessageConsumer");
    let oCollaborationProviderConfig;
    let fnResolve;

    const CLIENT_ID = "sap-suite-ui-commons-collaboration-client-appruntime";
    const CHANNEL_ID = "collaboration-channel";
    const MSG_NAME = "get-provider-config";
    const UPDATE_TOP_LEVEL_URL_MSG_NAME = "update-top-level-url";
    const SUBSCRIBED_CHANNELS = [
        {
            channelId: CHANNEL_ID,
            version: "1.0"
        }
    ];
    const TARGET_CLIENT_IDS = ["sap-suite-ui-commons-collaboration-message-broker"]; //Id of the client from where to receive the provider config

    // Message handling function
    const handleMessage = function(sClientId, sChannelId, sMessageName, data, supportedMessageName, dataHandler) {
        oLogger.info(`Message Received from CLIENT_ID: ${sClientId} on CHANNEL_ID: ${sChannelId}`);

        // Verify if the message is the one we support
        if (sMessageName === supportedMessageName) {
            // Process the data
            dataHandler(data);
        } else {
            oLogger.info(`Message: '${sMessageName}' is not supported`);
        }
    };

    const fnMessageCallback = function(sClientId, sChannelId, sMessageName, data) {
        handleMessage(sClientId, sChannelId, sMessageName, data, MSG_NAME, function(data) {
            oCollaborationProviderConfig = JSON.parse(data);
            fnResolve(oCollaborationProviderConfig);
        });
    };

    const fnUpdateURLMessageCallback = function(sClientId, sChannelId, sMessageName, data) {
        handleMessage(sClientId, sChannelId, sMessageName, data, UPDATE_TOP_LEVEL_URL_MSG_NAME, function(data) {
            const { success } = JSON.parse(data);
            if (success) {
                oLogger.info("Parent page URL successfully updated.");
            }
        });
    };

    //The resolution of oCollaborationProviderConfig with an empty object
    const resolveEmptyConfig = function (resolve) {
        oCollaborationProviderConfig = {};
        resolve(oCollaborationProviderConfig);
    };

    // Connect and subscribe to the message channel
    const connectAndSubscribe = async function (sClientId, channels, callback) {
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        let oMessageBrokerService;

        try {
            oMessageBrokerService = await UshellContainer.getServiceAsync("MessageBroker");

            try {
                await oMessageBrokerService.connect(sClientId);
                oLogger.info(`Client ID: ${sClientId} is connected successfully`);
            } catch {
                oLogger.warn("Could not connect to the Message Broker");
                return null;
            }

            await oMessageBrokerService.subscribe(sClientId, channels, callback, Function.prototype);
            return oMessageBrokerService;
        } catch (error) {
            oLogger.error(`Error during connect or subscribe: ${error}`);
            oMessageBrokerService?.disconnect(CLIENT_ID);
            return null;
        }
    };

    return {
        getProviderConfiguration: function () {
            return new Promise(async function(resolve) {
                if (oCollaborationProviderConfig) {
                    resolve(oCollaborationProviderConfig);
                    return;
                }

                fnResolve = resolve;
                // Register & Request for the provider configuration
                const UshellContainer = sap.ui.require("sap/ushell/Container");
                if (!UshellContainer) {
                    oLogger.info("UShell Container instance doesn't exist");
                    resolveEmptyConfig(resolve);
                    return;
                }
                let oMessageBrokerService;
                try {
                    oMessageBrokerService = await connectAndSubscribe(CLIENT_ID, SUBSCRIBED_CHANNELS, fnMessageCallback);
                    if (oMessageBrokerService) {
                        await oMessageBrokerService.publish(CHANNEL_ID, CLIENT_ID, Date.now().toString(), MSG_NAME, TARGET_CLIENT_IDS);

                        try {
                            oMessageBrokerService.disconnect(CLIENT_ID);
                        } catch (error) {
                            resolve(oCollaborationProviderConfig);
                        }
                    } else {
                        resolveEmptyConfig(resolve);
                    }
                } catch (error) {
                    oLogger.info("Provider Configuration doesn't exist");
                    oMessageBrokerService?.disconnect(CLIENT_ID);
                    resolveEmptyConfig(resolve);
                }
            });
        },
        updateTopLevelURLforAppRuntime: async function (sUrl) {
            let oMessageBrokerService;

            try {
                oMessageBrokerService = await connectAndSubscribe(CLIENT_ID, SUBSCRIBED_CHANNELS, fnUpdateURLMessageCallback);

                if (oMessageBrokerService) {
                    const payload = JSON.stringify({ url: sUrl });
                    await oMessageBrokerService.publish(CHANNEL_ID, CLIENT_ID, Date.now().toString(), UPDATE_TOP_LEVEL_URL_MSG_NAME, TARGET_CLIENT_IDS, payload);

                    try {
                        oMessageBrokerService.disconnect(CLIENT_ID);
                        oLogger.info(`Client ID: ${CLIENT_ID} disconnected successfully`);
                    } catch (error) {
                        oLogger.info("Disconnect failed");
                    }
                }
            } catch (error) {
                oMessageBrokerService?.disconnect(CLIENT_ID);
            }
        }
    };
});
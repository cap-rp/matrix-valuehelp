/*!
* 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
* POC
*/
sap.ui.define(
    [
        "sap/ui/base/Object"
    ],
    function (UI5Object) {
        "use strict";

		var instance;
        /**
         * Facilitates communication between message providers and consumers in FLP and embedded iframes.
         *
         * @class
         * @alias sap.suite.ui.commons.collaboration.channels.MessageChannel
         * @public
         * @experimental
         */
		var MessageChannel = UI5Object.extend("sap.suite.ui.commons.collaboration.channels.MessageChannel", {
			/**
			 * Posts a message containing an object with properties to the parent window.
			 * @param {object} oMessageData - The message to post.
			 * @param {string} sTargetOrigin - The target origin of the message.
			 */
			postMessage: function (oMessageData, sTargetOrigin) {
				window.parent.postMessage({...oMessageData, _fromMessageChannel: true}, sTargetOrigin || "*");
			},

			/**
			 * Subscribes to message events from the parent window.
			 * @param {function} fnCallback - The callback function to execute when a message event occurs.
			 */
			subscribe: function (fnCallback) {
				window.addEventListener("message", function (event) {
					if (event?.data?._fromMessageChannel && typeof fnCallback === "function") {
						fnCallback(event);
					}
				});
			}
		});

        return {
            /**
             * Returns a promise that resolves to the singleton instance of the MessageChannel service.
             * @returns {Promise<sap.suite.ui.commons.collaboration.channels.MessageChannel>} A promise that resolves to the MessageChannel instance.
             * @public
             * @experimental
             */
            getInstance: function () {
                if (!instance) {
                    instance = new MessageChannel();
                }
                return Promise.resolve(instance);
            }
        };
    }
);

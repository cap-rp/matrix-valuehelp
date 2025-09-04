/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
	[
		"sap/ui/core/Component",
		"sap/base/Log",
		"../../ServiceContainer",
		"../../CollaborationHelper"
	],
	function (Component, Log, ServiceContainer, CollaborationHelper) {
		"use strict";
		var oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.flpplugins.msplugin.Component");
		const sTeamsAuthEndUrl = "sap-collaboration-authEndUrl";
		/**
		 * Provides the collaboration plugin information for Microsoft Teams Integration.
		 * @extends sap.ui.core.Component
		 * @name sap.suite.ui.commons.collaboration.flpplugins.msplugin.Component
		 * @since 1.108.0
         * @private
         * @ui5-restricted: sap.suite.ui.commons.collaboration
         * @experimental Since 1.108
		 *
		 */
		return Component.extend("sap.suite.ui.commons.collaboration.flpplugins.msplugin.Component", {
			metadata: {
				manifest: "json",
				properties: {
					/**
					 * Specifies the collaboration using Microsoft Teams as Link is configured or not.
					 */
					 isShareAsLinkEnabled: {
						name: "isShareAsLinkEnabled",
						type: "string"
					},
					/**
					 * Specifies the collaboration with Microsoft Teams as Tab is configured or not.
					 */
                     isShareAsTabEnabled: {
						name: "isShareAsTabEnabled",
						type: "string"
					},
					/**
					 * Specifies the collaboration with Microsoft Teams as Card is configured or not.
					 */
                    isShareAsCardEnabled: {
						name: "isShareAsCardEnabled",
						type: "string"
					},
					/**
					 * Specifies the app id of the azure app registration at customer end.
					 */
					applicationId: {
						name: "applicationId",
						type: "string"
					},
					/**
					 * Specifies the tenant id of the azure app registration at customer end.
					 */
					tenantId: {
						name: "tenantId",
						type: "string"
					},
					/**
					 * Specifies the collaboration with Microsoft Teams as Fetch Contact is configured or not.
					 */
					isDirectCommunicationEnabled: {
						name: "isDirectCommunicationEnabled",
						type: "string"
					}
				}
			},
			init: function () {
				// load plugin config
				var oPluginConfigData = this._loadPluginConfigData();
				if (oPluginConfigData) {
					CollaborationHelper._getCurrentUrl().then(function (sCurrentUrl) {
						try {
							const oUrl = new URL(sCurrentUrl);
							if (oUrl.searchParams.has(sTeamsAuthEndUrl)) {
								const sAuthEndUrl = decodeURIComponent(oUrl.searchParams.get(sTeamsAuthEndUrl));
								window.location.replace(sAuthEndUrl);
							}
						} catch (e) {
							oLogger.error(`Error while redirecting to auth end url`);
						}
					});
					ServiceContainer.setCollaborationType("COLLABORATION_MSTEAMS", oPluginConfigData);
				} else {
					oLogger.error("Collaboration configuration for Microsoft Teams Integration could not be loaded.");
				}
			},

			_loadPluginConfigData: function () {
				var oComponentData = this.getComponentData();
				if (oComponentData) {
					return oComponentData.config; // retrieve the plugin configuration
				}
			}
		});
	}
);
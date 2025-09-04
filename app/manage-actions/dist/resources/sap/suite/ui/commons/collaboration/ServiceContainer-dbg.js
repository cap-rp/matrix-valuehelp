/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/base/Log",
	"./BaseHelperService",
	"./TeamsHelperService",
	"./CollaborationManagerService",
	"../windowmessages/CollaborationMessageBroker",
	"../windowmessages/CollaborationMessageConsumer",
	"./CollaborationHelper",
	"sap/ui/core/Element"
], function (Log, BaseHelperService, TeamsHelperService, CollaborationManagerService, CollaborationMessageBroker, CollaborationMessageConsumer, CollaborationHelper, Element) {
	"use strict";
	var oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.ServiceContainer");
	var oProviderConfiguration;
	var oServicePromise; // Promise object which will be returned by getServiceAsync method

	function fnGetCollaborationType() {
		var oHelperService;
		if (oProviderConfiguration && Object.keys(oProviderConfiguration).length) {
			var sProvider = oProviderConfiguration.sProvider;
			var oProviderConfig = oProviderConfiguration.oProviderConfig;
			if (sProvider === "COLLABORATION_MSTEAMS") {
				oHelperService = new TeamsHelperService(oProviderConfig);
			}
			oServicePromise = Promise.resolve(oHelperService);
			return oServicePromise;
		}
		oHelperService = new BaseHelperService({});
		oLogger.info("Collaboration provider is not activated on the tenant");
		return Promise.resolve(oHelperService);
	}

	// Private constructor so that no one could create an instance of the class
	function ServiceContainer() {}

	/**
	 * Service container to get the collaboration type.
	 * @namespace
	 * @since 1.108
	 * @public
	 * @alias sap.suite.ui.commons.collaboration.ServiceContainer
	 */
	var oServiceContainer = new ServiceContainer();

	/**
	 * 	Method that returns the collaboration service object as 'active' on the system.
	 *	Microsoft Teams is supported as a collaboration option and must be enabled using the communication service SAP_COM_0860.
	 *	The type definition and class are only available internally and are not intended for external consumers.
	 *	@returns {Promise<module:sap/suite/ui/commons/collaboration/BaseHelperService>} Returns the promise that is resolved to the instance of the collaboration service.
	 * 	@public
	 */
	oServiceContainer.getServiceAsync = async function () {
		const UshellContainer = sap.ui.require("sap/ushell/Container");
		if (oServicePromise) {
			return oServicePromise;
		}
		if (UshellContainer && UshellContainer.inAppRuntime()){
			oProviderConfiguration = await CollaborationMessageConsumer.getProviderConfiguration();
		}
		return fnGetCollaborationType();
	};

	/**
	 * 	Method that returns the collaboration service object as 'active' on the system.
	 * 	Microsoft Teams is supported as a collaboration option and must be enabled using the communication service SAP_COM_0860.
	 *	The type definition and class are only available internally and are not intended for external consumers.
	 *	@returns {Promise<{ oTeamsHelperService: module:sap/suite/ui/commons/collaboration/BaseHelperService, oCMHelperService: module:sap/suite/ui/commons/collaboration/BaseHelperService }>} Returns the promise that is resolved to an object containing the helper service and the Collaboration manager service.
	 * 	@public
	 */
	oServiceContainer.getCollaborationServices = async function () {
		var oService = await oServiceContainer.getServiceAsync();
		var mCollaborationServices = {
			"oTeamsHelperService": oService,
			"oCMHelperService": new CollaborationManagerService()
		};
		return Promise.resolve(mCollaborationServices);
	};

	/**
	 * Method to hide the plugins in the shell header when loaded inside MS Teams.
	 */
	oServiceContainer.hidePluginsInMSTeams = async function() {
		try {
			const bIsActive = await CollaborationHelper.isTeamsModeActive();
			if (bIsActive) {
				let nAttempts = 0;
                const intervalTime = 1 * 1000; // 1 seccond = 1000, here 1 seccond
                // Assuming all the plugins are visible
                const oPluginIdsVisibility = {
                    'chatButton': true,
                    'sap.das.webclientplugin.s4.shellitem': true
                }
                const interval = setInterval(() => {
                    nAttempts++;
                    if (nAttempts > 10) {
                        // stop the interval after 10 attempts
                        // this is to avoid the infinite loop
                        clearInterval(interval);
                        return;
                    }

                    Object.keys(oPluginIdsVisibility).forEach(sPluginId => {
                        const oPluginElement = Element.getElementById(sPluginId);
                        if (oPluginElement?.getVisible() === true) {
                            oPluginElement.setVisible(false);
                            oPluginIdsVisibility[sPluginId] = false;
                        }
                    });

                    // check if all the plugins are invisible and end interval
                    const bAllInvisible = Object.values(oPluginIdsVisibility).every(bVisible => !bVisible);
                    if (bAllInvisible) {
                        clearInterval(interval);
                    }
				}, intervalTime);
			}
		} catch (error) {
			oLogger.error("Error hiding the plugins in MS Teams", error);
		}
	}

	oServiceContainer.setCollaborationType = function (sProvider, oProviderConfig) {
		oLogger.info("Collaboration properties are now configured");
		oServiceContainer.hidePluginsInMSTeams();

		oProviderConfiguration = {
			sProvider: sProvider,
			oProviderConfig: oProviderConfig
		};

		fnGetCollaborationType();
		CollaborationMessageBroker.startInstance(oProviderConfiguration);
	};

	return oServiceContainer;
}, /* bExport = */ true);

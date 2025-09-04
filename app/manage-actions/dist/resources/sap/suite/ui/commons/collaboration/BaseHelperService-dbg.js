/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    /**
     * Base class for the CollaborationHelpers
     * @namespace
     * @since 1.108
     * @alias module:sap/suite/ui/commons/collaboration/BaseHelperService
     * @public
     */
    var BaseHelperService = BaseObject.extend("sap.suite.ui.commons.collaboration.BaseHelperService", {
        constructor: function (oProviderConfig) {
            this._providerConfig = oProviderConfig;
        }
    });

    /**
     * Method that returns the Provider configuration settings
     * @returns {Object} Configuration settings
     * @private
     * @ui5-restricted
     * @experimental Since 1.108
     */
    BaseHelperService.prototype.getProviderConfig = function() {
        return this._providerConfig;
    };

    /**
     * Provides a list of all collaboration options
     * @param {object} oParams Optional argument in case the consumer wants to influence the options, otherwise pass as undefined
     * @param {boolean} oParams.isShareAsLinkEnabled Allow the 'Share as Chat' option to be available in case Microsoft Teams is the collaboration provider
     * @param {boolean} oParams.isShareAsTabEnabled Allow the 'Share as Tab' option to be available in case Microsoft Teams is the collaboration provider
     * @param {boolean} oParams.isShareAsCardEnabled Allow the 'Share as Card' option to be available in case Microsoft Teams is the collaboration provider
     * @returns {array} Array of available options
     * @public
     */
    BaseHelperService.prototype.getOptions = function(oParams) {
        return [];
    };

    /**
     * Triggers the 'Share' operation
     *
     * @param {Object} oOption JSON object of collaboration option that is clicked
     * @param {Object} oParams Parameter object which contains the information to be shared
     * @param {string} oParams.url URL of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used during the integration
     * @param {string} oParams.subTitle Title of the object page which needs to be used during the integration
     * @param {boolean} oParams.minifyUrlForChat Set the flag to 'true' to minimize the URL
     * @param {Object} oParams.cardManifest Adaptive card json for a given instance of the object page used for the ‘Share as Card’ option
     * @param {string} oParams.cardId ID of the card that needs to be stored and is constructed from SemanticObject_Action
     * @returns {void}
     * @public
     */
    BaseHelperService.prototype.share = function(oOption, oParams) {
    };

    /**
     * Checks if collaboration with contacts is supported in Microsoft Teams
     *
     * @returns {boolean} A Boolean that determines whether or not the collaboration with contacts is supported in Microsoft Teams
     * @public
     */
    BaseHelperService.prototype.isContactsCollaborationSupported = function () {
        return false;
    };

	/**
     * Enables the Microsoft Teams collaboration functionality by providing a contact quick view with the options to start a message, audio call or video call
     * @param {string} sEmail Provides the email of the contact to be used for the communication using Microsoft Teams
     * @param {object} oParams Parameter object which contains the information to be shared
     * @returns {Promise} Returns promise resolving to an instance of the contact quick view providing the data for the collaboration functionality
     * @public
     */
    BaseHelperService.prototype.enableContactsCollaboration = async function (sEmail, oParams) {
        return Promise.resolve({});
    };

	/**
     * Provides the Microsoft Teams collaboration options for the contact quick view
     * @returns {Promise} Returns promise which has the options for teams collaboration
     * @public
     */
    BaseHelperService.prototype.getTeamsContactCollabOptions = async function () {
        return Promise.resolve({});
    };

    /**
     * Checks whether the feature flag is enabled and executes the code for the Adaptive Card Generation accordingly
     * @returns {boolean} If set to true, Adaptive Card Generation is enabled
     * @public
     */
    BaseHelperService.prototype.isFeatureFlagEnabled = function () {
        return false;
    };

    /**
     * Provide Teams status for the contact
     * @returns {Promise} Returns promise which has the status of the contact
     * @param {string} sEmail email of the contact
     * @public
     */

    BaseHelperService.prototype.getTeamsContactStatus = async function (sEmail) {
        return Promise.resolve({});
    }

     /**
     * Opens a Popup that helps to share content to teams, mail.
     * @param { object } oParams Optional argument in case consumer wants to influence the options, otherwise pass as undefined
     * @param { object } oData Title and data to share
     * @param { string } oSource The source to which the popover is rendered.
     * @param { boolean } isLink Indicates the data is a URL or not.
     * @param { object } oCollaborationOptionsConfig All the options for the Collaboration
     * @public
     */
    BaseHelperService.prototype.getCollaborationPopover = function(oParams, oData, oSource, isLink, oCollaborationOptionsConfig) {

     }

    return BaseHelperService;
});

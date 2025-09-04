/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    var BASE_URL = "/sap/opu/odata4/sap/aps_ui_contact_srv/srvd_a2x/sap/";

    var REPO_BASE_URL = BASE_URL + "aps_ui_contact/0001/";

    var CONTACTINFO_ENTITY_NAME = "APS_UI_C_CONTACT";
    var CONTACTINFO_URL = BASE_URL + "aps_ui_contact/0001/" + CONTACTINFO_ENTITY_NAME;

    //var CONTACTIMAGE_ENTITY_NAME = "APS_UI_C_PHOTO";
    var CONTACTIMAGE_URL = BASE_URL + "aps_ui_contact/0001/" + CONTACTINFO_ENTITY_NAME;

    var CONTACTSTATUS_ENTITY_NAME = "APS_UI_C_PRESENCE";
    var CONTACTSTATUS_URL = BASE_URL + "aps_ui_contact/0001/" + CONTACTSTATUS_ENTITY_NAME;

    var CONTACTCALENDAR_ENTITY_NAME = "APS_UI_C_CALENDAR";
    var CONTACTCALENDAR_URL = BASE_URL + "aps_ui_contact/0001/" + CONTACTCALENDAR_ENTITY_NAME;

    var CHECKCONTACTSERVICE = BASE_URL + "aps_ui_contact/0001/" + "APS_UI_C_CHECK_SERVICE";

    var GET = "GET";
    var HEAD = "HEAD";

    var CollaborationContactInfoHelper = BaseObject.extend(
        "sap.suite.ui.commons.collaboration.CollaborationContactInfoHelper"
    );

    CollaborationContactInfoHelper.fetchCSRFToken = function() {
        return fetch(REPO_BASE_URL, {
            method: HEAD,
            headers: {
                "X-CSRF-Token": "Fetch"
            }
        }).then(function (resposne) {
            var token = resposne.headers.get("X-CSRF-Token");
            if (resposne.ok && token) {
                return token;
            }
            return undefined;
        });
    };

    CollaborationContactInfoHelper.fetchContact = function(sEmail) {
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            return fetch(CONTACTINFO_URL + "/" + sEmail, {
                method: GET,
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                }
            }).then(function (oResponse) {
                return oResponse.json();
            });
        }); 
    };

    CollaborationContactInfoHelper.fetchContactCalendar = function(sEmail) {
        var sStartDateTime = new Date();
        var url = CONTACTCALENDAR_URL + "?$filter=mail eq '" + sEmail + "'";
        if (sStartDateTime) {
            url = CONTACTCALENDAR_URL + "?$filter=(mail eq '" + sEmail + "'&start_datetime eq '" + sStartDateTime.toISOString() + "')";
        }
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            return fetch(url, {
                method: GET,
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                }
            }).then(function (oResponse) {
                return oResponse.json();
            });
        }); 
    };

    CollaborationContactInfoHelper.fetchContactPicture = function(sEmail) {
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            return fetch(CONTACTIMAGE_URL + "/" + sEmail + "/photo", {
                method: GET,
                headers: {
                    "X-CSRF-Token": sCSRFToken
                }
            }).then(function (oResponse) {
                return oResponse.blob();
            });
        });
    };

    CollaborationContactInfoHelper.fetchContactStatus = function(sId) {
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            return fetch(CONTACTSTATUS_URL + "?$filter=id eq '" + sId + "'", {
                method: GET,
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                }
            }).then(function (oResponse) {
                return oResponse.json();
            });
        });
    };

    CollaborationContactInfoHelper.fetchServiceStatus = function() {
        return this.fetchCSRFToken().then(function (sCSRFToken) {
            return fetch(CHECKCONTACTSERVICE, {
                method: GET,
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                }
            }).then(function (oResponse) {
                return oResponse.json();
            });
        }); 
    };

    return CollaborationContactInfoHelper;

});
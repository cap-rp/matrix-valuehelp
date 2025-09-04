/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/* eslint-disable no-console */
/* eslint-disable no-undef */

// eslint-disable-next-line no-undef
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/library",
	"sap/ui/core/Lib",
	"sap/ui/core/Core",
	"sap/ui/model/resource/ResourceModel",
	"./CollaborationContactInfoHelper",
	"sap/ui/performance/trace/FESRHelper",
	"sap/ui/core/Element"
], function (Controller, Fragment, JSONModel, mLibrary, Library, Core, ResourceModel, CollaborationContactInfoHelper, FESRHelper, Element) {
		"use strict";

		var I18_BUNDLE = Library.getResourceBundleFor("sap.suite.ui.commons");

		return Controller.extend("sap.suite.ui.commons.collaboration.ContactHelper", {
			constructor: function () {
			},

			/**
     		* Fetch the Contact info, image and status from Teams via oData service.
     		* @param {string} sEmail email of the contact
     		* @private
     		*/

			getFullProfileByEmail: async function (sEmail) {;
				var oFullProfileData = await CollaborationContactInfoHelper.fetchContact(sEmail);
				if (oFullProfileData && oFullProfileData.mail === "") {
					return oFullProfileData;
				}
				if (oFullProfileData && oFullProfileData.data != "") {
					oFullProfileData.photo = "data:image/png;base64," + oFullProfileData.data;
				}
				oFullProfileData = this.determineContactStatus(oFullProfileData);
				return oFullProfileData;
			},

			getTeamsContactOptions: function () {
				var that = this;
				return Promise.resolve([
					{
						"key": "chat",
						"icon": "sap-icon://discussion",
						"tooltip": I18_BUNDLE.getText("CHAT_BUTTON_TOOLTIP"),
						"fesrStepName": "MST:ContactAction",
						"callBackHandler": function (oEvent) {
							that.handleMSTeamsPress(oEvent);
						}
					},
					{
						"key": "call",
						"icon": "sap-icon://call",
						"tooltip": I18_BUNDLE.getText("CALL_BUTTON_TOOLTIP"),
						"fesrStepName": "MST:ContactAction",
						"callBackHandler": function (oEvent) {
							that.handleMSTeamsPress(oEvent);
						}
					},
					{
						"key": "videoCall",
						"icon": "sap-icon://video",
						"tooltip": I18_BUNDLE.getText("VIDEOCALL_BUTTON_TOOLTIP"),
						"fesrStepName": "MST:ContactAction",
						"callBackHandler": function (oEvent) {
							that.handleMSTeamsPress(oEvent);
						}
					}
				]);
			},

			/**
     		* Provide the Contact status from Teams via oData service.
     		* @param {string} sEmail email of the contact
     		* @public
     		*/

			getTeamsContactStatus: async function (sEmail) {
				var oFullProfileData = await CollaborationContactInfoHelper.fetchContact(sEmail);
				oFullProfileData.calendar = await CollaborationContactInfoHelper.fetchContactCalendar(sEmail);
				oFullProfileData = this.determineContactStatus(oFullProfileData);
				return [{
						"key": "profileStatus",
						"badgeIcon": oFullProfileData.badgeIcon,
						"badgeValueState": oFullProfileData.badgeValueState,
						"badgeTooltip": oFullProfileData.badgeTooltip,
						"fesrStepName": "MST:ContactAction",
						"calendar": oFullProfileData.calendar
				}]
			},

			handleMSTeamsPress: function (oEvent) {
				var sEmail = oEvent.getSource().data("email");
				var sType = oEvent.getSource().data("type");
				var url = "";
				switch (sType) {
					case "chat":
						url = "https://teams.microsoft.com/l/chat/0/0?users=" + sEmail;
						break;
					case "call":
						url = "https://teams.microsoft.com/l/call/0/0?users=" + sEmail;
						break;
					case "videoCall":
						url = "https://teams.microsoft.com/l/call/0/0?users=" + sEmail + "&withVideo=true";
						break;
					default:
						break;
				}
				mLibrary.URLHelper.redirect(url, true);
			},

			formatUri: function (sValue, oParams) {
				var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
				if (mailregex.test(sValue)) {
					return "mailto:" + sValue + (oParams && oParams.subject ? ("?subject=" + oParams.subject) : '') + (oParams && oParams.body ? ("&body=" + oParams.body) : '');
				} else {
					return "tel:" + sValue;
				}
			},

			loadContactPopover: function (sEmail, oParams, isDirectCommunicationEnabled) {
				this.afterClose() // Make sure, previously opened popup is closed if any
				return Fragment.load({
					name: "sap.suite.ui.commons.collaboration.ContactPopover",
					controller: this,
					type: "XML"
				}).then(function (oPopover) {
					FESRHelper.setSemanticStepname(oPopover, "afterClose", "MST:ContactDetails");
					this._oContactPopover = oPopover;
					this.sEmail = sEmail;
					this.oParams = oParams;
					oPopover.setBusy(true);
					var oTntSet = {
						setFamily: "tnt",
						setURI: sap.ui.require.toUrl("sap/tnt/themes/base/illustrations")
					};
					sap.m.IllustrationPool.registerIllustrationSet(oTntSet, false);
					var oJsonModel = new JSONModel({
						"isUserExistsInTeams": true
					});
					this._oContactPopover.setModel(oJsonModel, "userData");
					this.isDirectCommunicationEnabled = isDirectCommunicationEnabled;
					this._oContactPopover.setModel(new sap.ui.model.resource.ResourceModel({ bundle: I18_BUNDLE }), "i18n");
					return oPopover;
				}.bind(this));
			},

			loadMinimalContactPopover: function (sEmail, oParams) {
				// oParams contains subject and body of the email
				this.afterClose() // Make sure, previously opened popup is closed if any
				var oJsonModel = new JSONModel({
					"mail": sEmail,
					"params": oParams
				});
				return Fragment.load({
					name: "sap.suite.ui.commons.collaboration.MinimalContactPopover",
					controller: this,
					type:  "XML"
				}).then(function (oPopover) {
					this._oMinContactPopover = oPopover;
					FESRHelper.setSemanticStepname(oPopover, "afterClose", "MST:ContactDetails");
					oPopover.setModel(oJsonModel, "userData");
					oPopover.setModel(new sap.ui.model.resource.ResourceModel({ bundle: I18_BUNDLE }), "i18n");
					return oPopover;
				}.bind(this));
			},

			afterClose: function() {
				if (this._oContactPopover) {
					this._oContactPopover.destroy();
				}
				if (this._oMinContactPopover) {
					this._oMinContactPopover.destroy();
				}
			},

			afterOpen: function() {
				var that = this;
				this.getFullProfileByEmail(this.sEmail).then(function (data) {
					that._oContactPopover.setBusy(false);
					if (data && data.mail === "") {
						data.isUserExistsInTeams = false;
						data.mail = that.sEmail;
						data.params = that.oParams;
						that._oContactPopover.setInitialFocus(Element.getElementById("mail"));
					} else {
						data.isUserExistsInTeams = true;
						data.isDirectCommunicationEnabled = !!that.isDirectCommunicationEnabled;
						that._oContactPopover.setInitialFocus(Element.getElementById("avatar"));
					}
					var oJsonModel = new JSONModel(data);
					oJsonModel.setData(data);
					that._oContactPopover.setModel(oJsonModel, "userData");
					FESRHelper.setSemanticStepname(that._oContactPopover, "afterClose", "MST:ContactDetails");
				});
			},

			afterContinue: function () {
				var sUrl = this.formatUri(this.sEmail, this.oParams);
				mLibrary.URLHelper.redirect(sUrl, true);
			},

			/**
     		* Provide avatar and badge proprty based on Contact status
     		* @param {string} oFullProfileData full information on the contact
     		* @private
     		*/

			determineContactStatus: function(oFullProfileData) {
				const mBadgeInfo = new Map([
					[
						"OOO",
						{
							badgeValueState: "Information",
							badgeIcon: "sap-icon://offsite-work",
						},
					],
					[
						"BUSYOOO",
						{
							badgeValueState: "Error",
							badgeIcon: "sap-icon://circle-task",
						},
					],
					[
						"ONLINEOOO",
						{
							badgeValueState: "Success",
							badgeIcon: "sap-icon://sys-enter",
						},
					],
					[
						"AVAILABLE",
						{
							badgeValueState: "Success",
							badgeIcon: "sap-icon://sys-enter-2",
						},
					],
					[
						"AWAY",
						{
							badgeValueState: "Warning",
							badgeIcon: "sap-icon://pending",
						},
					],
					[
						"BUSY",
						{
							badgeValueState: "Error",
							badgeIcon: "sap-icon://circle-task-2",
						},
					],
					[
						"PRESENTING",
						{
							badgeValueState: "Error",
							badgeIcon: "sap-icon://sys-minus",
						},
					],
					[
						"OFFLINE",
						{
							badgeValueState: "Error",
							badgeIcon: "sap-icon://message-error",
						},
					],
				]);

				const mUserPresence = new Map([
					["Available", "AVAILABLE"],
					["Away", "AWAY"],
					["Inactive", "AWAY"],
					["Busy", "BUSY"],
					["DoNotDisturb", "PRESENTING"],
					["InACall", "BUSY"],
					["InAMeeting", "BUSY"],
					["Presenting", "PRESENTING"],
					["BeRightBack", "AWAY"],
					["OffWork", "OFFLINE"],
					["Offline", "OFFLINE"]
				]);

				let oBadgeInfo = {};

				if (!!oFullProfileData.isoutofoffice) {
					if (oFullProfileData.activity === "Available") {
						oBadgeInfo = mBadgeInfo.get("ONLINEOOO");
						oBadgeInfo.badgeTooltip = `${I18_BUNDLE.getText(
							"AVAILABLE"
						)}, ${I18_BUNDLE.getText("OOO")}`;
					} else if (oFullProfileData.activity === "Busy") {
						oBadgeInfo = mBadgeInfo.get("BUSYOOO");
						oBadgeInfo.badgeTooltip = `${I18_BUNDLE.getText(
							"BUSY"
						)}, ${I18_BUNDLE.getText("OOO")}`;
					} else if (oFullProfileData.activity === "DoNotDisturb") {
						oBadgeInfo = mBadgeInfo.get("PRESENTING");
						oBadgeInfo.badgeTooltip = `${I18_BUNDLE.getText(
							"DONOTDISTURB"
						)}, ${I18_BUNDLE.getText("OOO")}`;
					} else {
						oBadgeInfo = mBadgeInfo.get("OOO");
						oBadgeInfo.badgeTooltip = I18_BUNDLE.getText("OOO");
					}
				} else {
					const sUserPresence = oFullProfileData.activity
						? mUserPresence.get(oFullProfileData.activity)
						: "OFFLINE";
					oBadgeInfo = mBadgeInfo.get(sUserPresence);
					oBadgeInfo.badgeTooltip = I18_BUNDLE.getText(
						oFullProfileData.activity.toUpperCase()
					);
				}

				Object.assign(oFullProfileData, oBadgeInfo);
				return oFullProfileData;
			}

		});
	}
);

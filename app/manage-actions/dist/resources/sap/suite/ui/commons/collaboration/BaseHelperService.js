/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/base/Object"],function(t){"use strict";var o=t.extend("sap.suite.ui.commons.collaboration.BaseHelperService",{constructor:function(t){this._providerConfig=t}});o.prototype.getProviderConfig=function(){return this._providerConfig};o.prototype.getOptions=function(t){return[]};o.prototype.share=function(t,o){};o.prototype.isContactsCollaborationSupported=function(){return false};o.prototype.enableContactsCollaboration=async function(t,o){return Promise.resolve({})};o.prototype.getTeamsContactCollabOptions=async function(){return Promise.resolve({})};o.prototype.isFeatureFlagEnabled=function(){return false};o.prototype.getTeamsContactStatus=async function(t){return Promise.resolve({})};o.prototype.getCollaborationPopover=function(t,o,e,n,r){};return o});
//# sourceMappingURL=BaseHelperService.js.map
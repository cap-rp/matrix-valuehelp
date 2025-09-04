/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/base/Log","sap/ui/core/Core","./BaseHelperService","sap/ui/Device","sap/ui/core/Lib","sap/suite/ui/commons/collaboration/channels/MessageChannel"],function(e,o,a,s,t,i){"use strict";var n=a.extend("sap.suite.ui.commons.collaboration.CollaborationManagerService");var r=t.getResourceBundleFor("sap.suite.ui.commons");var l=e.getLogger("sap.suite.ui.commons.collaboration.CollaborationManagerService");n.prototype.triggerH2HChat=function(e,o,a){this.publishData({sAppTitle:e,sCurrentURL:o,sEmailId:a})};n.prototype.getOptions=function(){var e=window["sap-ushell-config"]&&window["sap-ushell-config"].bootstrapPlugins&&window["sap-ushell-config"].bootstrapPlugins.H2H_CHAT_PLUGIN;if(s.system.desktop){if(e){return{text:r.getText("COLLABORATION_MANGER"),icon:"sap-icon://BusinessSuiteInAppSymbols/icon-collaboration-manager",press:this.triggerH2HChat.bind(this),fesrStepName:"CM:ShareLink"}}else{l.info("Consumer disable Collaboration Manager option")}}else{l.info("Collaboration Manager is not supported in Phone and Tablet")}return null};n.prototype.publishData=async function(e){try{const o=await i.getInstance();o.postMessage(e)}catch(e){l.error("Failed to publish data:",e)}};return n});
//# sourceMappingURL=CollaborationManagerService.js.map
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/Lib","sap/base/i18n/Localization"],function(e,i){"use strict";var t={};t.render=function(t,s){var a=i.getLanguage();var r=e.getResourceBundleFor("sap.suite.ui.commons",a);var n="";t.write("<div");t.writeControlData(s);t.addClass("sapSuiteUiCommonsLaunchTile");t.addClass("sapSuiteUiCommonsPointer");t.writeAttribute("tabindex","0");t.writeClasses();if(s.getTooltip_AsString()){n=s.getTooltip_AsString();t.writeAttributeEscaped("title",s.getTooltip_AsString())}else{n=r.getText("LAUNCHTILE_LAUNCH")+" "+s.getTitle()}t.writeAccessibilityState(s,{role:"link",live:"assertive",label:n});t.write(">");t.write('<div id="'+s.getId()+'-launchTileText"');t.addClass("sapSuiteUiCommonsLaunchTileTitle");t.writeClasses();t.write(">");t.writeEscaped(s.getTitle());t.write("</div>");t.write('<div id="'+s.getId()+'-launchTileIcon"');t.addClass("sapSuiteUiCommonsLaunchTileIcon");t.writeClasses();t.write(">");t.renderControl(s._iconImage);t.write("</div>");t.write("</div>")};return t},true);
//# sourceMappingURL=LaunchTileRenderer.js.map
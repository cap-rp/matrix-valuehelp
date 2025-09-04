/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./DateUtils","sap/ui/core/date/UI5Date","sap/ui/core/Core","sap/ui/core/Lib","sap/base/i18n/Localization"],function(e,t,i,a,r){"use strict";var s=function(){throw new Error};s.calculateFeedItemAge=function(i){var s="";if(!e.isValidDate(i)){return s}var T=t.getInstance();i.setMilliseconds(0);T.setMilliseconds(0);var n=r.getLanguage();var g=a.getResourceBundleFor("sap.suite.ui.commons",n);var E=6e4;var u=E*60;var o=u*24;if(T.getTime()-i.getTime()>=o){var c=parseInt((T.getTime()-i.getTime())/o,10);if(c===1){s=g.getText("FEEDTILE_DAY_AGO",[c])}else{s=g.getText("FEEDTILE_DAYS_AGO",[c])}}else if(T.getTime()-i.getTime()>=u){var l=parseInt((T.getTime()-i.getTime())/u,10);if(l===1){s=g.getText("FEEDTILE_HOUR_AGO",[l])}else{s=g.getText("FEEDTILE_HOURS_AGO",[l])}}else{var I=parseInt((T.getTime()-i.getTime())/E,10);if(I===1){s=g.getText("FEEDTILE_MINUTE_AGO",[I])}else{s=g.getText("FEEDTILE_MINUTES_AGO",[I])}}return s};return s},true);
//# sourceMappingURL=FeedItemUtils.js.map
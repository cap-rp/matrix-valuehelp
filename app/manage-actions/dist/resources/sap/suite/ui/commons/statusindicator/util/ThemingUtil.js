/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/theming/Parameters","sap/m/library","sap/ui/core/library","../../library"],function(r,e,t,a){"use strict";var o=e.ValueColor;var i=a.SemanticColorType;var l=t.CSSColor;var s=function(){throw new Error};s.resolveColor=function(e){if(l.isValid(e)){return e}switch(e){case o.Good:if(r.get("sapPositiveColor")){return r.get("sapPositiveColor")}return e;case o.Error:if(r.get("sapNegativeColor")){return r.get("sapNegativeColor")}return e;case o.Critical:if(r.get("sapCriticalColor")){return r.get("sapCriticalColor")}return e;case o.Neutral:if(r.get("sapNeutralColor")){return r.get("sapNeutralColor")}return e;default:if(i.hasOwnProperty(e)){return e}else{return r.get(e)}}};return s},true);
//# sourceMappingURL=ThemingUtil.js.map
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/Control","sap/suite/ui/commons/statusindicator/util/ThemingUtil","../library","sap/m/library"],function(l,r,t,o){"use strict";var e=t.SemanticColorType;var i=o.ValueCSSColor;var s=l.extend("sap.suite.ui.commons.statusindicator.PropertyThreshold",{metadata:{library:"sap.suite.ui.commons",properties:{fillColor:{type:"string",defaultValue:"Neutral"},toValue:{type:"int",defaultValue:0},ariaLabel:{type:"string",defaultValue:null}}},renderer:null});s.prototype._getCssFillColor=function(){if(!this._cssFillColor){this._cssFillColor=r.resolveColor(this.getFillColor())}return this._cssFillColor};s.prototype.setFillColor=function(l,r){var t=false;if(e.hasOwnProperty(l)){t=true}else{t=i.isValid(l)}if(l!=null&&!t){throw new Error(`Value ${l} is not valid for property "fillColor"`)}return this.setProperty("fillColor",t?l:null,r)};return s});
//# sourceMappingURL=PropertyThreshold.js.map
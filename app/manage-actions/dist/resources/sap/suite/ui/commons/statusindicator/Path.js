/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/suite/ui/commons/util/HtmlElement","sap/suite/ui/commons/statusindicator/SimpleShape","sap/suite/ui/commons/statusindicator/SimpleShapeRenderer","../library","sap/m/library"],function(t,e,s,i,a){"use strict";var r=i.SemanticColorType;var o=a.ValueCSSColor;var u=e.extend("sap.suite.ui.commons.statusindicator.Path",{metadata:{library:"sap.suite.ui.commons",properties:{d:{type:"string",defaultValue:null}}},renderer:s});u.prototype._getSimpleShapeElement=function(e){var s=new t("path");var i=this._getCssStrokeColor();s.setId(this._buildIdString(e));s.setAttribute("d",this.getD());s.setAttribute("stroke-width",this.getStrokeWidth());if(r.hasOwnProperty(i)){s.addClass("strokeSemanticColor"+i)}if(o.isValid(i)){s.setAttribute("stroke",i)}if(this.aCustomStyleClasses){this.aCustomStyleClasses.forEach(s.addClass.bind(s))}return s};return u});
//# sourceMappingURL=Path.js.map
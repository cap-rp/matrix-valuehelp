/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/suite/ui/commons/util/HtmlElement","sap/suite/ui/commons/statusindicator/SimpleShape","sap/suite/ui/commons/statusindicator/SimpleShapeRenderer","../library","sap/m/library"],function(t,e,i,s,r){"use strict";var a=s.SemanticColorType;var u=r.ValueCSSColor;var n=e.extend("sap.suite.ui.commons.statusindicator.Rectangle",{metadata:{library:"sap.suite.ui.commons",properties:{x:{type:"int",defaultValue:0},y:{type:"int",defaultValue:0},rx:{type:"int",defaultValue:0},ry:{type:"int",defaultValue:0},width:{type:"int",defaultValue:0},height:{type:"int",defaultValue:0}}},renderer:i});n.prototype._getSimpleShapeElement=function(e){var i=new t("rect");var s=this._getCssStrokeColor();i.setId(this._buildIdString(e));i.setAttribute("x",this.getX());i.setAttribute("y",this.getY());i.setAttribute("width",this.getWidth());i.setAttribute("height",this.getHeight());i.setAttribute("rx",this.getRx());i.setAttribute("ry",this.getRy());i.setAttribute("stroke-width",this.getStrokeWidth());if(a.hasOwnProperty(s)){i.addClass("strokeSemanticColor"+s)}if(u.isValid(s)){i.setAttribute("stroke",s)}return i};return n});
//# sourceMappingURL=Rectangle.js.map
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/suite/ui/commons/statusindicator/Shape","sap/suite/ui/commons/util/HtmlElement","sap/suite/ui/commons/statusindicator/SimpleShape","sap/suite/ui/commons/statusindicator/SimpleShapeRenderer","../library","sap/m/library"],function(t,e,i,s,r,a){"use strict";var o=r.SemanticColorType;var u=a.ValueCSSColor;var l=i.extend("sap.suite.ui.commons.statusindicator.Circle",{metadata:{library:"sap.suite.ui.commons",properties:{cx:{type:"float",defaultValue:0},cy:{type:"float",defaultValue:0},r:{type:"float",defaultValue:0}}},renderer:s});l.prototype._getSimpleShapeElement=function(t){var i=new e("circle");var s=this._getCssStrokeColor();i.setId(this._buildIdString(t));i.setAttribute("cx",this.getCx());i.setAttribute("cy",this.getCy());i.setAttribute("r",this.getR());i.setAttribute("stroke-width",this.getStrokeWidth());if(o.hasOwnProperty(s)){i.addClass("strokeSemanticColor"+s)}if(u.isValid(s)){i.setAttribute("stroke",s)}return i};return l});
//# sourceMappingURL=Circle.js.map
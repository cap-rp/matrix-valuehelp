/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/core/Control","sap/ui/core/Core","sap/ui/core/Element"],function(t,o,s,e){"use strict";var a=o.extend("sap.suite.ui.commons.ControlProxy",{metadata:{library:"sap.suite.ui.commons",association:{control:{type:"sap.ui.core.Control",multiple:false}}},renderer:function(t,o){var s=o.getAssociation("control"),a=e.getElementById(s);t.renderControl(a)}});a.prototype.setAssociation=function(t,s){o.prototype.setAssociation.apply(this,arguments);var a=this.getAssociation("control"),i=e.getElementById(a);if(i&&Array.isArray(this.aCustomStyleClasses)){this.aCustomStyleClasses.forEach(function(t){i.addStyleClass(t)})}};a.prototype.addStyleClass=function(t){o.prototype.addStyleClass.apply(this,arguments);var s=this.getAssociation("control"),a=e.getElementById(s);if(a){a.addStyleClass(t)}};return a});
//# sourceMappingURL=ControlProxy.js.map
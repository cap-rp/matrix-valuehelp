/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/Control","sap/base/Log"],function(e,t){"use strict";var i=e.extend("sap.suite.ui.commons.statusindicator.FillingOption",{metadata:{library:"sap.suite.ui.commons",properties:{shapeId:{type:"string",defaultValue:null},weight:{type:"int",defaultValue:1},order:{type:"int"}}},renderer:null});i.prototype.setWeight=function(e){if(e<=0){t.fatal("An invalid weight is passed. Weight should be a positive integer. Given: "+e)}this.setProperty("weight",e)};return i});
//# sourceMappingURL=FillingOption.js.map
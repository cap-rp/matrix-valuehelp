/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/core/Control"],function(e,t){"use strict";var i=t.extend("sap.suite.ui.commons.CalculationBuilderGroup",{metadata:{library:"sap.suite.ui.commons",properties:{key:{type:"string",group:"Misc",defaultValue:null},title:{type:"string",group:"Misc",defaultValue:null},description:{type:"string",group:"Misc",defaultValue:null},icon:{type:"string",group:"Misc",defaultValue:null}},events:{setSelection:{parameters:{key:"string"}}},aggregations:{customView:{type:"sap.ui.core.Control",multiple:false}}},renderer:null});i.prototype._getTitle=function(){return this.getTitle()||this.getKey()};return i});
//# sourceMappingURL=CalculationBuilderGroup.js.map
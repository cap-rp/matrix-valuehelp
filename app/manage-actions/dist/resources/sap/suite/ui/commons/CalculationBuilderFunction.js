/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/core/Control","./CalculationBuilderItem"],function(e,t,u){"use strict";var l=t.extend("sap.suite.ui.commons.CalculationBuilderFunction",{metadata:{library:"sap.suite.ui.commons",properties:{key:{type:"string",group:"Misc",defaultValue:null},label:{type:"string",group:"Misc",defaultValue:null},description:{type:"string",group:"Misc",defaultValue:null},useDefaultValidation:{type:"boolean",group:"Misc",defaultValue:false}},aggregations:{items:{type:"sap.suite.ui.commons.CalculationBuilderItem",defaultClass:u,multiple:true,singularName:"item"}}},renderer:null});l.prototype._getLabel=function(){return this.getLabel()||this.getKey()};return l});
//# sourceMappingURL=CalculationBuilderFunction.js.map
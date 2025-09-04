/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/core/Control","./CalculationBuilderItem"],function(e,t,i){"use strict";var u=t.extend("sap.suite.ui.commons.CalculationBuilderVariable",{metadata:{library:"sap.suite.ui.commons",properties:{key:{type:"string",group:"Misc",defaultValue:null},label:{type:"string",group:"Misc",defaultValue:null},group:{type:"string",group:"Misc"}},aggregations:{items:{type:"sap.suite.ui.commons.CalculationBuilderItem",defaultClass:i,multiple:true,singularName:"Item"}}},renderer:null});u.prototype._getLabel=function(){return this.getLabel()||this.getKey()};return u});
//# sourceMappingURL=CalculationBuilderVariable.js.map
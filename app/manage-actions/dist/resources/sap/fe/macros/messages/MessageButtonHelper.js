/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Dialog","sap/ui/core/Element","sap/ui/mdc/valuehelp/Dialog","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,n,r,i){"use strict";function a(i){const a=function(r){if(!r.length){return false}let a=t.getElementById(r[0]);while(a){if(a.getId()===i){return true}if(a instanceof e||a instanceof n){return false}a=a.getParent()}return false};return new r({path:"controlIds",test:a,caseSensitive:true})}function s(e){return new r({path:"target",operator:i.StartsWith,value1:e})}const l={getCheckControlInViewFilter:a,getHiddenDraftUseCaseFilter:s};return l},false);
//# sourceMappingURL=MessageButtonHelper.js.map
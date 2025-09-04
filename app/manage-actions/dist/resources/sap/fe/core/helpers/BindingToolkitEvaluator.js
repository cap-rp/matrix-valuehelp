/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath","sap/fe/base/BindingToolkit"],function(e,n){"use strict";var t={};var r=n.unresolvableExpression;var s=n.transformRecursively;var a=n.isConstant;var o=n.constant;function i(n,t){const i=new Set;const l=s(n,"PathInModel",n=>{const s=n.modelName??"";const a=t[s];if(a===undefined){i.add(s);return r}return o(e.get(n.path.replace(/\//g,"."),a))},true);if(a(l)){return l.value}else{throw new Error(`Expression cannot be resolved not constant as data from the following models: ${Array.from(i).join(",")} is missing`)}}t.evaluateExpression=i;return t},false);
//# sourceMappingURL=BindingToolkitEvaluator.js.map
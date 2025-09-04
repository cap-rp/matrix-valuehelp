/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit"],function(n){"use strict";var r={};var e=n.resolveBindingString;var s=n.not;var i=n.equal;var a=n.constant;var o=n.compileExpression;var t=n.and;const c=(n,r,c)=>{const v=e(n);const l=e(r);const u=a(c);return o(t(u,s(i(v,l))))};r.buildExpressionForHeaderVisible=c;return r},false);
//# sourceMappingURL=TableTemplating.js.map
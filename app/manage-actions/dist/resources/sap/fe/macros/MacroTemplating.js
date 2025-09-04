/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit"],function(t){"use strict";var e={};var n=t.constant;var r=t.compileExpression;const i=function(t,e){if(e&&e.context){return e.context.getPath()}return""};i.requiresIContext=true;e.getPath=i;const o=function(t){return r(n(t))};o.requiresIContext=true;e.getValue=o;return e},false);
//# sourceMappingURL=MacroTemplating.js.map
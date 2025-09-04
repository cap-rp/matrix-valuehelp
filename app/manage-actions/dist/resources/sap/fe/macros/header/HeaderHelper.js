/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit","../field/FieldTemplating"],function(e,n){"use strict";var i=n.formatValueRecursively;var t=n.addTextArrangementToBindingExpression;var o=e.getExpressionFromAnnotation;var r=e.compileExpression;const a={getDescriptionExpression(e,n){let a=o(n?.Description?.Value);if(n?.Description?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement){a=t(a,e)}const s=r(i(a,e));return s==="undefined"?"":s}};return a},false);
//# sourceMappingURL=HeaderHelper.js.map
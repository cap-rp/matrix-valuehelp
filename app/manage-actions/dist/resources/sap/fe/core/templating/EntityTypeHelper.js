/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/base/BindingToolkit"],function(e,a){"use strict";var n={};var o=a.pathInModel;var t=a.getExpressionFromAnnotation;var i=a.concat;const r=a=>{const n=a.annotations?.UI?.HeaderInfo?.Title;if(n){switch(n.$Type){case"com.sap.vocabularies.UI.v1.DataField":return t(n.Value);case"com.sap.vocabularies.UI.v1.DataFieldForAnnotation":e.error("DataFieldForAnnotation with connected fields not supported for HeaderInfo.Title");return t(a.annotations?.UI?.HeaderInfo?.TypeName)}}const r=a.annotations?.Common?.SemanticKey;if(r){return i(...r.map(e=>o(e.value)))}};n.getTitleExpression=r;return n},false);
//# sourceMappingURL=EntityTypeHelper.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/CustomData","sap/fe/base/jsx-runtime/jsx"],function(e,n){"use strict";var t={};function u(t,u){return u!==undefined?n(e,{value:u},t):undefined}t.createCustomData=u;function a(e){const n=e.map(e=>u(e.key,e.value)).filter(e=>e!==undefined);return n.length>0?n:undefined}t.createCustomDatas=a;return t},false);
//# sourceMappingURL=TSXUtils.js.map
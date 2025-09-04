/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport","sap/m/HBox"],function(t,e){"use strict";var n,o;var r=t.defineUI5Class;function s(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,c(t,e)}function c(t,e){return c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},c(t,e)}let i=(n=r("sap.fe.macros.controls.CollaborationHBox"),n(o=function(t){function e(){return t.apply(this,arguments)||this}s(e,t);var n=e.prototype;n.enhanceAccessibilityState=function t(e,n){const o=this.getParent();if(o&&o.enhanceAccessibilityState){o.enhanceAccessibilityState(e,n)}return n};return e}(e))||o);return i},false);
//# sourceMappingURL=CollaborationHBox.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/controls/section/mixin/BaseStateHandler","sap/uxap/BlockBase"],function(t,e){"use strict";var n={};function o(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,r(t,e)}function r(t,e){return r=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},r(t,e)}let i=function(t){function r(){return t.apply(this,arguments)||this}n=r;o(r,t);var i=r.prototype;i.setupStateInteractionsForLazyRendering=function t(){if(!this.checkForStateInteractions()){this.registerSubSectionDelegate(this)}};i.isBlocksAvailable=function t(){const n=this.getBlocks().filter(t=>t instanceof e);return n.length>0};return r}(t);n=i;return n},false);
//# sourceMappingURL=SubSectionStateHandler.js.map
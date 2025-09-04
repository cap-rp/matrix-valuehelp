/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/base/ClassSupport","../Chart"],function(t,e,r){"use strict";var a,o;var s={};var n=e.defineUI5Class;function c(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,p(t,e)}function p(t,e){return p=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},p(t,e)}let u=(a=n("sap.fe.macros.chart.Chart"),a(o=function(e){function r(r,a){t.warning("You've consumed deprecated Chart class. Use sap.fe.macros.Chart instead");return e.call(this,r,a)||this}s=r;c(r,e);return r}(r))||o);s=u;return s},false);
//# sourceMappingURL=Chart.js.map
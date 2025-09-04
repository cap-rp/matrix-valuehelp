/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/base/ClassSupport","../MicroChart"],function(t,r,e){"use strict";var o,a;var s={};var c=r.defineUI5Class;function n(t,r){t.prototype=Object.create(r.prototype),t.prototype.constructor=t,i(t,r)}function i(t,r){return i=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,r){return t.__proto__=r,t},i(t,r)}let p=(o=c("sap.fe.macros.microchart.MicroChart"),o(a=function(r){function e(e,o){t.warning("You've consumed deprecated MicroChart class. Use sap.fe.macros.MicroChart instead");return r.call(this,e,o)||this}s=e;n(e,r);return e}(e))||a);s=p;return s},false);
//# sourceMappingURL=MicroChart.js.map
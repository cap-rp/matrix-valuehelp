/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/base/ClassSupport","sap/fe/macros/Field"],function(e,t,r){"use strict";var s,o;var n={};var a=t.defineUI5Class;function i(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,c(e,t)}function c(e,t){return c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},c(e,t)}let p=(s=a("sap.fe.macros.field.Field"),s(o=function(t){function r(r,s){e.warning("You've consumed deprecated Field class. Use sap.fe.macros.field.Field instead");return t.call(this,r,s)||this}n=r;i(r,t);return r}(r))||o);n=p;return n},false);
//# sourceMappingURL=Field.js.map
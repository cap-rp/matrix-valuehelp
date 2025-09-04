/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/insights/CardExtension","./formatters/ValueFormatter"],function(t,r){"use strict";function e(t,r){t.prototype=Object.create(r.prototype),t.prototype.constructor=t,o(t,r)}function o(t,r){return o=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,r){return t.__proto__=r,t},o(t,r)}let n=function(t){function o(){return t.apply(this,arguments)||this}e(o,t);var n=o.prototype;n.init=function e(){t.prototype.init.apply(this);this.addFormatters("sapfe",{formatWithBrackets:r.formatWithBrackets,formatTitle:r.formatTitle})};return o}(t);return n},false);
//# sourceMappingURL=InsightsFormattersExtension.js.map
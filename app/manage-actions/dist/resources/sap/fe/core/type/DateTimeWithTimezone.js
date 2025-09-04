/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport","sap/ui/model/odata/type/DateTimeWithTimezone"],function(t,e){"use strict";var o,r;var n=t.defineUI5Class;function i(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,u(t,e)}function u(t,e){return u=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},u(t,e)}let a=(o=n("sap.fe.core.type.DateTimeWithTimezone"),o(r=function(t){function e(e,o){var r;r=t.call(this,e,o)||this;r.bShowTimezoneForEmptyValues=e?.showTimezoneForEmptyValues??true;return r}i(e,t);var o=e.prototype;o.formatValue=function e(o,r){const n=o&&o[0];if(n===undefined||!n&&!this.bShowTimezoneForEmptyValues){return null}return t.prototype.formatValue.call(this,o,r)};return e}(e))||r);return a},false);
//# sourceMappingURL=DateTimeWithTimezone.js.map
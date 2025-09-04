/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/insights/CardExtension", "./formatters/ValueFormatter"], function (CardExtension, valueFormatters) {
  "use strict";

  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  // This import is fine as this file will only be loaded in insights context
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  let InsightsFormatters = /*#__PURE__*/function (_CardExtension) {
    function InsightsFormatters() {
      return _CardExtension.apply(this, arguments) || this;
    }
    _inheritsLoose(InsightsFormatters, _CardExtension);
    var _proto = InsightsFormatters.prototype;
    _proto.init = function init() {
      _CardExtension.prototype.init.apply(this);
      this.addFormatters("sapfe", {
        formatWithBrackets: valueFormatters.formatWithBrackets,
        formatTitle: valueFormatters.formatTitle
      });
    };
    return InsightsFormatters;
  }(CardExtension);
  return InsightsFormatters;
}, false);
//# sourceMappingURL=InsightsFormattersExtension-dbg.js.map

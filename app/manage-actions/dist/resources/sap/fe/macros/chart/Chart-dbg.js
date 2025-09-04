/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "../Chart"], function (Log, ClassSupport, ChartBlock) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block used to create a chart based on the metadata provided by OData V4.
   * <br>
   * Usually, a contextPath and metaPath is expected.
   *
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/chart/Chart"], function(Chart) {
   * 	 ...
   * 	 new Chart("myChart", {metaPath:"MyChart"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the Chart that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @experimental
   * @mixes sap.fe.macros.Chart
   * @augments sap.ui.core.Control
   * @deprecatedsince 1.130
   * @deprecated Use {@link sap.fe.macros.Chart} instead
   */
  let Chart = (_dec = defineUI5Class("sap.fe.macros.chart.Chart"), _dec(_class = /*#__PURE__*/function (_ChartBlock) {
    function Chart(props, others) {
      Log.warning("You've consumed deprecated Chart class. Use sap.fe.macros.Chart instead");
      return _ChartBlock.call(this, props, others) || this;
    }
    _exports = Chart;
    _inheritsLoose(Chart, _ChartBlock);
    return Chart;
  }(ChartBlock)) || _class);
  _exports = Chart;
  return _exports;
}, false);
//# sourceMappingURL=Chart-dbg.js.map

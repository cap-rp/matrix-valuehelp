/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "../MicroChart"], function (Log, ClassSupport, MicroChartBlock) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block used to create a MicroChart based on the metadata provided by OData V4.
   *
   * <br>
   * Usually, a contextPath and metaPath is expected.
   *
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/microchart/MicroChart"], function(MicroChart) {
   * 	 ...
   * 	 new MicroChart("microChartID", {metaPath:"MyProperty"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the MicroChart that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @experimental
   * @mixes sap.fe.macros.MicroChart
   * @deprecatedsince 1.130
   * @deprecated Use {@link sap.fe.macros.MicroChart} instead
   */
  let MicroChart = (_dec = defineUI5Class("sap.fe.macros.microchart.MicroChart"), _dec(_class = /*#__PURE__*/function (_MicroChartBlock) {
    function MicroChart(props, others) {
      Log.warning("You've consumed deprecated MicroChart class. Use sap.fe.macros.MicroChart instead");
      return _MicroChartBlock.call(this, props, others) || this;
    }
    _exports = MicroChart;
    _inheritsLoose(MicroChart, _MicroChartBlock);
    return MicroChart;
  }(MicroChartBlock)) || _class);
  _exports = MicroChart;
  return _exports;
}, false);
//# sourceMappingURL=MicroChart-dbg.js.map

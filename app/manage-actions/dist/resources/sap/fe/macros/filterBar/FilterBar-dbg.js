/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/macros/controls/BuildingBlockWithTemplating", "sap/fe/macros/filterBar/FilterBar.block"], function (ClassSupport, BuildingBlockSupport, BuildingBlockWithTemplating, FilterBarBlock) {
  "use strict";

  var _dec, _dec2, _class, _class2;
  var _exports = {};
  var convertBuildingBlockMetadata = BuildingBlockSupport.convertBuildingBlockMetadata;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/filterBar/FilterBar"], function(FilterBar) {
   * 	 ...
   * 	 new FilterBar("MyFilterBar", {metaPath:"@com.sap.vocabularies.UI.v1.SelectionFields"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the FilterBar that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @experimental
   * @mixes sap.fe.macros.FilterBar
   */
  let FilterBar = (_dec = defineUI5Class("sap.fe.macros.filterBar.FilterBar", convertBuildingBlockMetadata(FilterBarBlock)), _dec2 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockWithTem) {
    function FilterBar(props, others) {
      var _this;
      _this = _BuildingBlockWithTem.call(this, props, others) || this;
      _this.createProxyMethods(["setFilterValues", "getActiveFiltersText", "getFilters", "triggerSearch", "getSelectionVariant", "setFilterFieldVisible", "getFilterFieldVisible", "getCurrentVariantKey", "setCurrentVariantKey", "setFilterFieldEnabled", "getFilterFieldEnabled", "setSelectionVariant"]);
      return _this;
    }
    _exports = FilterBar;
    _inheritsLoose(FilterBar, _BuildingBlockWithTem);
    var _proto = FilterBar.prototype;
    _proto._fireEvent = function _fireEvent(ui5Event, _controller, eventId) {
      this.fireEvent(eventId, ui5Event.getParameters());
    };
    return FilterBar;
  }(BuildingBlockWithTemplating), _applyDecoratedDescriptor(_class2.prototype, "_fireEvent", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "_fireEvent"), _class2.prototype), _class2)) || _class);
  _exports = FilterBar;
  return _exports;
}, false);
//# sourceMappingURL=FilterBar-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Text", "sap/ui/base/ManagedObject", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, Text, ManagedObject, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var bindingParser = ManagedObject.bindingParser;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let FilterBarSummary = (_dec = defineUI5Class("sap.fe.macros.filterBar.FilterBarSummary"), _dec2 = association({
    type: "sap.fe.macros.filterBar.FilterBarAPI",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function FilterBarSummary(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "filterBar", _descriptor, _this);
      return _this;
    }
    _exports = FilterBarSummary;
    _inheritsLoose(FilterBarSummary, _BuildingBlock);
    var _proto = FilterBarSummary.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.content = this.createContent();
      BuildingBlock.observeBuildingBlock(this.filterBar, {
        onAvailable: filterBar => {
          filterBar?.attachEvent("filterChanged", this.onFilterChange.bind(this));
        }
      });
    }

    /**
     * Create the content.
     * @returns The Text control that will display the summary of the applied filters.
     */;
    _proto.createContent = function createContent() {
      return _jsx(Text, {});
    }

    /**
     * Event handler for the filterChanged event of the filter bar.
     * @param event
     */;
    _proto.onFilterChange = function onFilterChange(event) {
      const filterBar = event.getSource();
      const appliedFiltersText = filterBar.getCollapsedFiltersText();
      const appliedFilterBinding = bindingParser(appliedFiltersText);
      if (appliedFilterBinding) {
        this.content?.bindText(appliedFilterBinding);
      } else {
        this.content?.setText(appliedFiltersText);
      }
    };
    return FilterBarSummary;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FilterBarSummary;
  return _exports;
}, false);
//# sourceMappingURL=FilterBarSummary-dbg.js.map

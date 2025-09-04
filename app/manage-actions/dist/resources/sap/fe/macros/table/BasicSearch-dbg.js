/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/filterBar/FilterHelper", "sap/m/SearchField", "sap/ui/core/Control", "sap/ui/mdc/odata/v4/TypeMap"], function (ClassSupport, FilterHelper, SearchField, Control, TypeMap) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var getEditStatusFilter = FilterHelper.getEditStatusFilter;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let BasicSearch = (_dec = defineUI5Class("sap.fe.macros.table.BasicSearch"), _dec2 = implementInterface("sap.ui.mdc.IFilter"), _dec3 = event(), _dec4 = event(), _dec5 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec6 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function BasicSearch() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Control.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_mdc_IFilter", _descriptor, _this);
      _this.__implements__sap_ui_mdc_IFilterSource = true;
      /**
       * The 'filterChanged' can be optionally implemented to display an overlay
       * when the filter value of the IFilter changes
       */
      _initializerDefineProperty(_this, "filterChanged", _descriptor2, _this);
      /**
       * The 'search' event is a mandatory IFilter event to trigger a search query
       * on the consuming control
       */
      _initializerDefineProperty(_this, "search", _descriptor3, _this);
      _initializerDefineProperty(_this, "filter", _descriptor4, _this);
      _initializerDefineProperty(_this, "useDraftEditState", _descriptor5, _this);
      return _this;
    }
    _inheritsLoose(BasicSearch, _Control);
    var _proto = BasicSearch.prototype;
    _proto.init = function init() {
      this.setAggregation("filter", new SearchField({
        placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
        search: () => {
          this.fireEvent("search");
        }
      }));
    };
    _proto.getConditions = function getConditions() {
      if (this.useDraftEditState) {
        return getEditStatusFilter();
      }
      return {};
    };
    _proto.getTypeMap = function getTypeMap() {
      return TypeMap;
    };
    _proto.getPropertyInfoSet = function getPropertyInfoSet() {
      if (this.useDraftEditState) {
        return [{
          name: "$editState",
          path: "$editState",
          groupLabel: "",
          group: "",
          typeConfig: TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {}),
          dataType: "sap.ui.model.odata.type.String",
          hiddenFilter: false
        }];
      }
      return [];
    };
    _proto.getSearch = function getSearch() {
      return this.filter.getValue();
    };
    _proto.validate = async function validate() {
      return Promise.resolve();
    };
    BasicSearch.render = function render(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.openEnd();
      oRm.renderControl(oControl.filter);
      oRm.close("div");
    };
    return BasicSearch;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_mdc_IFilter", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filter", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "useDraftEditState", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  return BasicSearch;
}, false);
//# sourceMappingURL=BasicSearch-dbg.js.map

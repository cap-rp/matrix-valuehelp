/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/templates/ListComponent"], function (ClassSupport, ListComponent) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ListReportComponent = (_dec = defineUI5Class("sap.fe.templates.ListReport.Component", {
    library: "sap.fe.templates",
    manifest: "json"
  }), _dec2 = property({
    type: "object"
  }), _dec3 = property({
    type: "boolean",
    defaultValue: true
  }), _dec4 = property({
    type: "object"
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec6 = property({
    type: "boolean",
    defaultValue: false
  }), _dec7 = property({
    type: "object"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_ListComponent) {
    function ListReportComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ListComponent.call(this, ...args) || this;
      /**
       * Define different Page views to display
       */
      _initializerDefineProperty(_this, "views", _descriptor, _this);
      /**
       *  Flag to determine whether the iconTabBar is in sticky mode
       */
      _initializerDefineProperty(_this, "stickyMultiTabHeader", _descriptor2, _this);
      /**
       * KPIs to display
       */
      _initializerDefineProperty(_this, "keyPerformanceIndicators", _descriptor3, _this);
      /**
       * Flag to determine whether the template should hide the filter bar
       */
      _initializerDefineProperty(_this, "hideFilterBar", _descriptor4, _this);
      _initializerDefineProperty(_this, "useHiddenFilterBar", _descriptor5, _this);
      /**
       * Show or Hide share options. Like, Send Email.
       */
      _initializerDefineProperty(_this, "share", _descriptor6, _this);
      return _this;
    }
    _inheritsLoose(ListReportComponent, _ListComponent);
    return ListReportComponent;
  }(ListComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "views", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "stickyMultiTabHeader", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "keyPerformanceIndicators", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hideFilterBar", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "useHiddenFilterBar", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ListReportComponent;
}, false);
//# sourceMappingURL=Component-dbg.js.map

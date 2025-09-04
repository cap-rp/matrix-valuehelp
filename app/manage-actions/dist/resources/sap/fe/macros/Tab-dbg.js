/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/StableIdHelper", "sap/m/IconTabFilter", "sap/m/MessageStrip", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, StableIdHelper, IconTabFilter, MessageStrip, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var generate = StableIdHelper.generate;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let Tab = (_dec = defineUI5Class("sap.fe.macros.Tab"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = event(), _dec5 = event(), _dec6 = event(), _dec7 = event(), _dec8 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_IconTabFilter) {
    function Tab(settings, others) {
      var _this;
      if (typeof settings === "string") {
        others ??= {};
        others.id = settings;
      }
      _this = _IconTabFilter.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "count", _descriptor2, _this);
      _initializerDefineProperty(_this, "internalDataRequested", _descriptor3, _this);
      _initializerDefineProperty(_this, "customRefreshCount", _descriptor4, _this);
      _initializerDefineProperty(_this, "customResumeBinding", _descriptor5, _this);
      _initializerDefineProperty(_this, "customSuspendBinding", _descriptor6, _this);
      _this.isSuspended = false;
      _this.setKey(generate([_this.id]));
      _this.insertContent(_jsx(MessageStrip, {
        text: "{tabsInternal>/" + _this.id + "/notApplicable/title}",
        type: "Information",
        showIcon: "true",
        showCloseButton: "true",
        class: "sapUiTinyMargin",
        visible: "{= (${tabsInternal>/" + _this.id + "/notApplicable/fields} || []).length>0 }"
      }), 0);
      _this.getTabContent()[0]?.attachEvent("internalDataRequested", _this.onInternalDataRequested.bind(_this));
      return _this;
    }
    _exports = Tab;
    _inheritsLoose(Tab, _IconTabFilter);
    var _proto = Tab.prototype;
    _proto.onInternalDataRequested = function onInternalDataRequested(evt) {
      this.fireEvent("internalDataRequested", evt.getParameters());
    }

    /**
     * Gets tab content only of inner control type (table or chart).
     * @returns Array of inner controls
     */;
    _proto.getTabContent = function getTabContent() {
      return this.getContent().filter(item => item.isA(["sap.fe.macros.table.TableAPI", "sap.fe.macros.Chart"]));
    };
    _proto.resumeBinding = function resumeBinding(requestIfNotInitialized) {
      if (this.isSuspended) {
        this.getTabContent()?.forEach(content => content.resumeBinding?.(requestIfNotInitialized));
        this.fireEvent("customResumeBinding");
        this.isSuspended = false;
      }
    };
    _proto.suspendBinding = function suspendBinding() {
      if (!this.isSuspended) {
        this.getTabContent()?.forEach(content => content.suspendBinding?.());
        this.fireEvent("customSuspendBinding");
        this.isSuspended = true;
      }
    };
    _proto.invalidateContent = function invalidateContent() {
      this.getTabContent()?.forEach(content => content.invalidateContent?.());
    };
    _proto.hasCounts = function hasCounts() {
      if (this.hasListeners("customRefreshCount") || this.getTabContent()?.[0]?.getCounts) {
        return true;
      }
      return false;
    }

    /**
     * Refreshes the tab count.
     *
     */;
    _proto.refreshCount = function refreshCount() {
      if (this.hasCounts()) {
        this.setCount("...");
        this.getTabContent()?.[0]?.getCounts?.().then(count => {
          return this.setCount(count || "0");
        }).catch(function (error) {
          Log.error(`Error while requesting Counts for Control: ${error}`);
        });
        this.fireEvent("customRefreshCount");
      }
    };
    _proto.refreshNotApplicableFields = function refreshNotApplicableFields(filterControl) {
      return this.getTabContent()?.[0]?.refreshNotApplicableFields?.(filterControl);
    };
    return Tab;
  }(IconTabFilter), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "count", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "internalDataRequested", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "customRefreshCount", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "customResumeBinding", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "customSuspendBinding", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataRequested", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataRequested"), _class2.prototype), _class2)) || _class);
  _exports = Tab;
  return _exports;
}, false);
//# sourceMappingURL=Tab-dbg.js.map

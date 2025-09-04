/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element"], function (ClassSupport, Element) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Create an event delegate hook on the parent of this control to deal with event propagation.
   *
   * This is a specific solution for the Avatar control case where the press cannot be interrupted and which then ends up interacting with control behind it.
   *
   */
  let EventDelegateHook = (_dec = defineUI5Class("sap.fe.base.EventDelegateHook"), _dec2 = property({
    type: "boolean"
  }), _dec3 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_Element) {
    function EventDelegateHook(idOrSettings, settings) {
      var _this;
      _this = _Element.call(this, idOrSettings, settings) || this;
      _initializerDefineProperty(_this, "stopTapPropagation", _descriptor, _this);
      _initializerDefineProperty(_this, "tap", _descriptor2, _this);
      return _this;
    }
    _exports = EventDelegateHook;
    _inheritsLoose(EventDelegateHook, _Element);
    var _proto = EventDelegateHook.prototype;
    _proto.setParent = function setParent(parentObject, aggregationName, suppressInvalidate) {
      if (this.getParent()) {
        this.getParent().removeEventDelegate(this);
      }
      parentObject.addEventDelegate(this);
      _Element.prototype.setParent.call(this, parentObject, aggregationName, suppressInvalidate);
    };
    _proto.ontap = function ontap(tapEvent) {
      if (this.stopTapPropagation) {
        tapEvent.stopPropagation();
      }
      this.fireEvent("tap");
    };
    return EventDelegateHook;
  }(Element), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "stopTapPropagation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "tap", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EventDelegateHook;
  return _exports;
}, false);
//# sourceMappingURL=EventDelegateHook-dbg.js.map

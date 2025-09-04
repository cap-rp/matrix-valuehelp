/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2;
  var _exports = {};
  var publicExtension = ClassSupport.publicExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * A controller extension offering hooks into the JouleContextSharing flow of the application
   * @hideconstructor
   * @since 1.121.0
   */
  let ContextSharing = (_dec = defineUI5Class("sap.fe.core.controllerextensions.ContextSharing"), _dec2 = publicExtension(), _dec3 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function ContextSharing() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    _exports = ContextSharing;
    _inheritsLoose(ContextSharing, _ControllerExtension);
    var _proto = ContextSharing.prototype;
    /**
     * This function is used to customize the context sent to JOULE web client.
     *
     * If it is declared as an extension, it permits to populate the "custom" property of the context with the returned object.
     *
     * This function is not called directly, but overridden separately by consuming controllers.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param context The context built by FEv4
     * @returns The custom context
     * @since 1.121.0
     */
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getContext = function getContext(context) {
      return context;
      // to be overriden by the application
    };
    return ContextSharing;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "getContext", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "getContext"), _class2.prototype), _class2)) || _class);
  _exports = ContextSharing;
  return _exports;
}, false);
//# sourceMappingURL=ContextSharing-dbg.js.map

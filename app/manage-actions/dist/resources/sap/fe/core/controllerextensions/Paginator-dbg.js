/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, HookSupport, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2;
  var hookable = HookSupport.hookable;
  var publicExtension = ClassSupport.publicExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Controller extension providing hooks for the navigation using paginators
   * @hideconstructor
   * @public
   * @since 1.94.0
   */
  let Paginator = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Paginator"), _dec2 = publicExtension(), _dec3 = hookable("Before"), _dec4 = publicExtension(), _dec5 = extensible(OverrideExecution.After), _dec6 = publicExtension(), _dec7 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function Paginator() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    _inheritsLoose(Paginator, _ControllerExtension);
    var _proto = Paginator.prototype;
    /**
     * Initiates the paginator control.
     * @param oBinding ODataListBinding object
     * @param oContext Current context where the navigation is initiated
     * @public
     * @since 1.94.0
     */
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initialize = function initialize(oBinding, oContext) {}

    /**
     * Called before context update.
     * @param oListBinding ODataListBinding object
     * @param iCurrentIndex Current index of context in listBinding from where the navigation is initiated
     * @param iIndexUpdate The delta index for update
     * @returns `true` to prevent the update of current context.
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeContextUpdate = function onBeforeContextUpdate(oListBinding, iCurrentIndex, iIndexUpdate) {
      return false;
    }

    /**
     * Returns the updated context after the paginator operation.
     * @param oContext Final context returned after the paginator action
     * @public
     * @since 1.94.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onContextUpdate = function onContextUpdate(oContext) {
      //To be overridden by the application
    };
    return Paginator;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "initialize", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "initialize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeContextUpdate", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeContextUpdate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onContextUpdate", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onContextUpdate"), _class2.prototype), _class2)) || _class);
  return Paginator;
}, false);
//# sourceMappingURL=Paginator-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/controllerextensions/BaseControllerExtension", "sap/fe/core/helpers/ModelHelper", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, BaseControllerExtension, ModelHelper, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * A controller extension offering hooks into the routing flow of the application
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  let Routing = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Routing"), _dec2 = publicExtension(), _dec3 = extensible("AfterAsync"), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = publicExtension(), _dec7 = extensible(OverrideExecution.After), _dec8 = publicExtension(), _dec9 = extensible(OverrideExecution.After), _dec10 = publicExtension(), _dec11 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseControllerExtens) {
    function Routing() {
      return _BaseControllerExtens.apply(this, arguments) || this;
    }
    _inheritsLoose(Routing, _BaseControllerExtens);
    var _proto = Routing.prototype;
    /**
     * This function can be used to intercept the routing event during the normal navigation process, such as when a table row is clicked to navigate, pagination buttons are used, the Apply button in an object page is clicked, or a sub-object page in a flexible column layout is closed.
     *
     * The function is NOT called during other means of external outbound navigation (like a navigation configured via a link, or by using navigation buttons).
     *
     * If declared as an extension, it allows you to intercept and change the normal navigation flow.
     * If you decide to do your own navigation processing, you can return `true` to prevent the default routing behavior.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param mNavigationParameters Object containing row context and page context
     * @param mNavigationParameters.bindingContext The target navigation context
     * @returns `true` to prevent the default execution, false to keep the standard behavior
     * @public
     * @since 1.86.0
     */
    _proto.onBeforeNavigation = async function onBeforeNavigation(mNavigationParameters) {
      // to be overriden by the application
      return Promise.resolve(false);
    }

    /**
     * Allows navigation to a specific context.
     * @param oContext Object containing the context to be navigated to
     * @param parameters Object containing the parameters for the navigation
     * @param parameters.preserveHistory  By default, the internal algorithm decides whether the navigation preserves the previous entry. This parameter allows you to override this behavior.
     * @public
     * @since 1.90.0
     */;
    _proto.navigate = function navigate(oContext, parameters) {
      const internalModel = this.base.getModel("internal");
      // We have to delete the internal model value for "paginatorCurrentContext" to ensure it is re-evaluated by the navigateToContext function
      // BCP: 2270123820
      internalModel.setProperty("/paginatorCurrentContext", null);
      this.base._routing.navigateToContext(oContext, parameters);
    }

    /**
     * This function is used to intercept the routing event before binding a page.
     *
     * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
     *
     * This function is not called directly, but overridden separately by consuming controllers.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param oContext Object containing the context for the navigation
     * @public
     * @since 1.90.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeBinding = function onBeforeBinding(oContext) {
      // to be overriden by the application
    }

    /**
     * This function is used to intercept the routing event after binding a page.
     *
     * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
     *
     * This function is not called directly, but overridden separately by consuming controllers.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param oContext Object containing the context to be navigated
     * @public
     * @since 1.90.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterBinding = function onAfterBinding(oContext) {
      // to be overriden by the application
    }

    /**
     * Navigate to another target.
     * @param sTargetRouteName Name of the target route
     * @param oParameters Parameters to be used with route to create the target hash
     * @param oParameters.bIsStickyMode PRIVATE
     * @param oParameters.preserveHistory PRIVATE
     * @returns Promise that is resolved when the navigation is finalized
     * @public
     */;
    _proto.navigateToRoute = async function navigateToRoute(sTargetRouteName, oParameters) {
      const oMetaModel = this.base.getModel().getMetaModel();
      const bIsStickyMode = ModelHelper.isStickySessionSupported(oMetaModel);
      if (!oParameters) {
        oParameters = {};
      }
      oParameters.bIsStickyMode = bIsStickyMode;
      return this.base._routing.navigateToRoute(sTargetRouteName, oParameters);
    };
    return Routing;
  }(BaseControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onBeforeNavigation", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigate", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "navigate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeBinding", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateToRoute", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateToRoute"), _class2.prototype), _class2)) || _class);
  return Routing;
}, false);
//# sourceMappingURL=Routing-dbg.js.map

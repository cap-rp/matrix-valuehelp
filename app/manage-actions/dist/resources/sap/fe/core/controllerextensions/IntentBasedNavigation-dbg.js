/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Controller extension providing hooks for intent-based navigation
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/controllerExtensions/intentBasedNavigation Overview of Building Blocks}
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  let IntentBasedNavigation = (_dec = defineUI5Class("sap.fe.core.controllerextensions.IntentBasedNavigation"), _dec2 = publicExtension(), _dec3 = extensible(OverrideExecution.After), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function IntentBasedNavigation() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    _inheritsLoose(IntentBasedNavigation, _ControllerExtension);
    var _proto = IntentBasedNavigation.prototype;
    /**
     * Provides a hook to customize the {@link sap.fe.navigation.SelectionVariant} related to the intent-based navigation.
     * @param _oSelectionVariant SelectionVariant provided by SAP Fiori elements.
     * @param _oNavigationInfo Object containing intent-based navigation-related info
     * @param _oNavigationInfo.semanticObject Semantic object related to the intent
     * @param _oNavigationInfo.action Action related to the intent
     * @public
     * @since 1.86.0
     */
    _proto.adaptNavigationContext = function adaptNavigationContext(_oSelectionVariant, _oNavigationInfo) {
      // to be overriden by the application
    }

    /**
     * Navigates to an intent defined by an outbound definition in the manifest.
     * @param sOutbound Identifier to locate the outbound definition in the manifest.
     * This provides the semantic object and action for the intent-based navigation.
     * Additionally, the outbound definition can be used to provide parameters for intent-based navigation.
     * See {@link topic:be0cf40f61184b358b5faedaec98b2da Descriptor for Applications, Components, and Libraries} for more information.
     * @param mNavigationParameters Optional map containing key/value pairs to be passed to the intent.
     * If mNavigationParameters are provided, the parameters provided in the outbound definition of the manifest are ignored.
     * @public
     * @since 1.86.0
     */;
    _proto.navigateOutbound = function navigateOutbound(sOutbound, mNavigationParameters) {
      const oInternalModelContext = this.base?.getView().getBindingContext("internal");
      oInternalModelContext.setProperty("externalNavigationContext", {
        page: false
      });
      this.base?._intentBasedNavigation.navigateOutbound(sOutbound, mNavigationParameters);
    };
    return IntentBasedNavigation;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "adaptNavigationContext", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptNavigationContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateOutbound", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateOutbound"), _class2.prototype), _class2)) || _class);
  return IntentBasedNavigation;
}, false);
//# sourceMappingURL=IntentBasedNavigation-dbg.js.map

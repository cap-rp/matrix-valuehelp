/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Control"], function (ClassSupport, Control) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ConditionalWrapper = (_dec = defineUI5Class("sap.fe.macros.controls.ConditionalWrapper"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "sap.ui.core.CSSSize",
    defaultValue: null
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec6 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec7 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec8 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function ConditionalWrapper(id, settings) {
      var _this;
      _this = _Control.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "width", _descriptor2, _this);
      _initializerDefineProperty(_this, "formDoNotAdjustWidth", _descriptor3, _this);
      _initializerDefineProperty(_this, "condition", _descriptor4, _this);
      /**
       * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor5, _this);
      _initializerDefineProperty(_this, "contentTrue", _descriptor6, _this);
      _initializerDefineProperty(_this, "contentFalse", _descriptor7, _this);
      return _this;
    }
    _inheritsLoose(ConditionalWrapper, _Control);
    var _proto = ConditionalWrapper.prototype;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        oParent.enhanceAccessibilityState(this, mAriaProps);
      }
      return mAriaProps;
    }

    /**
     * This function provides the current accessibility state of the control.
     * @returns The accessibility info of the wrapped control
     */;
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      let content;
      if (this.condition) {
        content = this.contentTrue;
      } else {
        content = this.contentFalse;
      }
      return content?.getAccessibilityInfo ? content.getAccessibilityInfo() : {};
    };
    _proto._setAriaLabelledBy = function _setAriaLabelledBy(oContent) {
      if (oContent && oContent.addAriaLabelledBy && oContent.getAriaLabelledBy) {
        const aAriaLabelledBy = this.ariaLabelledBy;
        for (const sId of aAriaLabelledBy) {
          const aAriaLabelledBys = oContent.getAriaLabelledBy() || [];
          if (!aAriaLabelledBys.includes(sId)) {
            oContent.addAriaLabelledBy(sId);
          }
        }
      }
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      // before calling the renderer of the ConditionalWrapper parent control may have set ariaLabelledBy
      // we ensure it is passed to its inner controls
      this._setAriaLabelledBy(this.contentTrue);
      this._setAriaLabelledBy(this.contentFalse);
    };
    ConditionalWrapper.render = function render(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.style("width", oControl.width);
      oRm.style("display", "inline-block");
      oRm.openEnd();
      if (oControl.condition) {
        oRm.renderControl(oControl.contentTrue);
      } else {
        oRm.renderControl(oControl.contentFalse);
      }
      oRm.close("div"); // end of the complete Control
    };
    return ConditionalWrapper;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "formDoNotAdjustWidth", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "condition", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contentTrue", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "contentFalse", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ConditionalWrapper;
}, false);
//# sourceMappingURL=ConditionalWrapper-dbg.js.map

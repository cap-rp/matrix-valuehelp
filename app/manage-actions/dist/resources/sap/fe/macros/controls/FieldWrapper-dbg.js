/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Control", "sap/ui/core/Lib"], function (ClassSupport, Control, Lib) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9;
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
  let FieldWrapper = (_dec = defineUI5Class("sap.fe.macros.controls.FieldWrapper"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "sap.ui.core.TextAlign"
  }), _dec4 = property({
    type: "sap.ui.core.CSSSize",
    defaultValue: null
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec6 = property({
    type: "string",
    defaultValue: "Display"
  }), _dec7 = property({
    type: "boolean",
    defaultValue: false
  }), _dec8 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec9 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec10 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function FieldWrapper(id, settings) {
      var _this;
      _this = _Control.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "textAlign", _descriptor2, _this);
      _initializerDefineProperty(_this, "width", _descriptor3, _this);
      _initializerDefineProperty(_this, "formDoNotAdjustWidth", _descriptor4, _this);
      _initializerDefineProperty(_this, "editMode", _descriptor5, _this);
      _initializerDefineProperty(_this, "required", _descriptor6, _this);
      /**
       * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor7, _this);
      _initializerDefineProperty(_this, "contentDisplay", _descriptor8, _this);
      _initializerDefineProperty(_this, "contentEdit", _descriptor9, _this);
      _this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      return _this;
    }
    _inheritsLoose(FieldWrapper, _Control);
    var _proto = FieldWrapper.prototype;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        // forward  enhanceAccessibilityState call to the parent
        oParent.enhanceAccessibilityState(oElement, mAriaProps);
      }
      return mAriaProps;
    }

    /**
     * Adds a control to the aggregation.
     * @param sAggregationName
     * @param oObject
     * @param bSuppressInvalidate
     * @returns The FieldWrapper instance
     */;
    _proto.addAggregation = function addAggregation(sAggregationName, oObject, bSuppressInvalidate) {
      if (sAggregationName === "contentEdit" && oObject.isA("sap.m.InputBase")) {
        oObject.setPreferUserInteraction(true);
      }
      return _Control.prototype.addAggregation.call(this, sAggregationName, oObject, bSuppressInvalidate);
    };
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      let oContent;
      if (this.editMode === "Display") {
        oContent = this.contentDisplay;
      } else {
        oContent = this.contentEdit.length ? this.contentEdit[0] : null;
      }
      return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      let oContent;
      if (this.editMode === "Display") {
        oContent = this.contentDisplay;
      } else {
        oContent = this.contentEdit.length ? this.contentEdit[0] : null;
      }
      return oContent?.getIdForLabel();
    };
    _proto._setAriaLabelledBy = function _setAriaLabelledBy(oContent) {
      if (oContent && oContent.addAriaLabelledBy) {
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
      // before calling the renderer of the FieldWrapper parent control may have set ariaLabelledBy
      // we ensure it is passed to its inner controls
      this._setAriaLabelledBy(this.contentDisplay);
      const aContentEdit = this.contentEdit;
      for (const item of aContentEdit) {
        this._setAriaLabelledBy(item);
      }
    };
    FieldWrapper.render = function render(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.style("text-align", oControl.textAlign);
      if (oControl.editMode === "Display") {
        oRm.style("width", oControl.width);
        if (oControl.getParent().hasInlineEdit) {
          // tooltip
          oRm.attr("title", oControl.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_DOUBLECLICK_EDIT"));
          // focus
          oRm.attr("tabindex", 0);
        }
        oRm.openEnd();
        oRm.renderControl(oControl.contentDisplay); // render the child Control for display
      } else {
        const aContentEdit = oControl.contentEdit;
        oRm.style("width", oControl.width);
        oRm.openEnd();
        for (const oContent of aContentEdit) {
          // render the child Control  for edit
          oRm.renderControl(oContent);
        }
      }
      oRm.close("div"); // end of the complete Control
    };
    return FieldWrapper;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "textAlign", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formDoNotAdjustWidth", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "editMode", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "contentDisplay", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "contentEdit", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FieldWrapper;
}, false);
//# sourceMappingURL=FieldWrapper-dbg.js.map

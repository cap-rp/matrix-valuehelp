/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Control"], function (ClassSupport, Control) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
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
  let FormElementWrapper = (_dec = defineUI5Class("sap.fe.core.controls.FormElementWrapper"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "sap.ui.core.CSSSize",
    defaultValue: null
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec6 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function FormElementWrapper(id, settings) {
      var _this;
      _this = _Control.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "width", _descriptor2, _this);
      _initializerDefineProperty(_this, "formDoNotAdjustWidth", _descriptor3, _this);
      /**
       * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor4, _this);
      _initializerDefineProperty(_this, "content", _descriptor5, _this);
      return _this;
    }
    _inheritsLoose(FormElementWrapper, _Control);
    var _proto = FormElementWrapper.prototype;
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      const oContent = this.content;
      return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      const setAriaLabelledByForControl = control => {
        if (control.isA("sap.m.VBox") || control.isA("sap.m.HBox")) {
          const items = control.getItems().filter(item => !item.isA("sap.m.Avatar"));
          //exclude Avatar from aria-labelledby to avoid overriding aria-label
          for (const item of items) {
            setAriaLabelledByForControl(item);
          }
        } else if (control.isA("sap.fe.macros.draftIndicator.DraftIndicator")) {
          this.setAriaLabelledByForDraftIndicator(control);
        } else {
          this.setAriaLabelledBy(control);
        }
      };
      setAriaLabelledByForControl(this.getContent());
    }

    /**
     * Sets ariaLabelledBy for the content control.
     * @param content The content control.
     */;
    _proto.setAriaLabelledBy = function setAriaLabelledBy(content) {
      if (content?.addAriaLabelledBy) {
        const ariaLabelledBy = this.ariaLabelledBy;
        for (const element of ariaLabelledBy) {
          const ariaLabelledBys = content.getAriaLabelledBy?.() || [];
          if (ariaLabelledBys.indexOf(element) === -1) {
            content.addAriaLabelledBy(element);
          }
        }
      }
    }

    /**
     * Sets ariaLabelledBy for the draft indicator.
     * @param content The draft indicator control.
     */;
    _proto.setAriaLabelledByForDraftIndicator = function setAriaLabelledByForDraftIndicator(content) {
      if (content?.addAriaLabelledByForDraftIndicator) {
        const ariaLabelledBy = this.ariaLabelledBy;
        for (const element of ariaLabelledBy) {
          const ariaLabelledBys = content.getAriaLabelledBy();
          if (!ariaLabelledBys.includes(element)) {
            content.addAriaLabelledByForDraftIndicator(element);
          }
        }
      }
    };
    FormElementWrapper.render = function render(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.style("min-height", "1rem");
      oRm.style("width", oControl.width);
      oRm.openEnd();
      oRm.openStart("div");
      oRm.style("display", "flex");
      oRm.style("box-sizing", "border-box");
      oRm.style("justify-content", "space-between");
      oRm.style("align-items", "center");
      oRm.style("flex-wrap", "wrap");
      oRm.style("align-content", "stretch");
      oRm.style("width", "100%");
      oRm.openEnd();
      oRm.renderControl(oControl.content); // render the child Control
      oRm.close("div");
      oRm.close("div"); // end of the complete Control
    };
    return FormElementWrapper;
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FormElementWrapper;
}, false);
//# sourceMappingURL=FormElementWrapper-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx", "sap/m/Button", "sap/m/library", "sap/ui/core/Control", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (ClassSupport, jsx, Button, library, Control, Lib, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Control to indicate the possibility to edit an element inline, and to save or discard the changes after editing.
   * @experimental This class is experimental and provides only limited functionality. Also the API might be changed in future.
   */
  let InlineEditIndicator = (_dec = defineUI5Class("sap.fe.controls.inlineEdit.InlineEditIndicator"), _dec2 = aggregation({
    type: "sap.m.Button"
  }), _dec3 = aggregation({
    type: "sap.m.Button"
  }), _dec4 = aggregation({
    type: "sap.m.Button"
  }), _dec5 = property({
    type: "boolean"
  }), _dec6 = event(), _dec7 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function InlineEditIndicator(idOrSettings, settings) {
      var _this;
      _this = _Control.call(this, idOrSettings, settings) || this;
      _initializerDefineProperty(_this, "editButton", _descriptor, _this);
      _initializerDefineProperty(_this, "saveButton", _descriptor2, _this);
      _initializerDefineProperty(_this, "discardButton", _descriptor3, _this);
      _initializerDefineProperty(_this, "editMode", _descriptor4, _this);
      _initializerDefineProperty(_this, "pressEdit", _descriptor5, _this);
      _initializerDefineProperty(_this, "mouseout", _descriptor6, _this);
      _this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      _this.editButton = _jsx(Button, {
        icon: "sap-icon://edit",
        type: ButtonType.Transparent,
        press: _ev => {
          _this.fireEvent("pressEdit");
        },
        tooltip: _this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_EDIT")
      });
      _this.saveButton = _jsx(Button, {
        icon: "sap-icon://accept",
        type: ButtonType.Transparent,
        "jsx:command": "cmd:Save|press",
        fieldGroupIds: "InlineEdit",
        tooltip: _this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_SAVE")
      });
      _this.discardButton = _jsx(Button, {
        icon: "sap-icon://decline",
        type: ButtonType.Transparent,
        "jsx:command": "cmd:Cancel|press",
        tooltip: _this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_CANCEL"),
        fieldGroupIds: "InlineEdit"
      });
      //IntervalTrigger.addListener(this.onAfterRendering, this)
      return _this;
    }

    /*
     * Add aria-describedBy element to the edit button
     * @param ariaDescribedByElement - Element to be added as ariaDescribedBy
     * */
    _exports = InlineEditIndicator;
    _inheritsLoose(InlineEditIndicator, _Control);
    var _proto = InlineEditIndicator.prototype;
    _proto.addEditButtonAriaDescribedBy = function addEditButtonAriaDescribedBy(ariaDescribedByElement) {
      if (ariaDescribedByElement !== undefined && ariaDescribedByElement !== null && ariaDescribedByElement !== "") {
        this.editButton.addAriaDescribedBy(ariaDescribedByElement);
      }
    }

    /*
     * Remove all aria-describedBy elements from the edit button
     * */;
    _proto.removeAllEditButtonAriaDescribedBy = function removeAllEditButtonAriaDescribedBy() {
      this.editButton.removeAllAriaDescribedBy();
    };
    _proto.onmouseout = function onmouseout(mouseEvent) {
      if (!mouseEvent.currentTarget?.contains(mouseEvent.relatedTarget)) {
        this.fireEvent("mouseout", {
          relatedTarget: mouseEvent.relatedTarget
        });
      }
    };
    _proto.onkeydown = function onkeydown(e) {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        this.fireEvent("pressTab");
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        this.fireEvent("pressShiftTab");
      }
    };
    _proto.setWidth = function setWidth(width) {
      this.width = width;
      this.$().css("width", `${width}px`);
    };
    _proto.getDiscardButton = function getDiscardButton() {
      return this.discardButton;
    };
    _proto.getSaveButton = function getSaveButton() {
      return this.saveButton;
    };
    _proto.getEditButton = function getEditButton() {
      return this.editButton;
    };
    InlineEditIndicator.render = function render(rm, control) {
      jsx.renderUsingRenderManager(rm, control, function () {
        const classes = ["sapFeInlineEditIndicator"];
        if (control.editMode) {
          classes.push("sapFeInlineEditIndicatorEditMode");
        }
        return _jsx("span", {
          class: classes.join(" "),
          ref: control,
          children: !control.editMode ? _jsx("span", {
            class: "sapFeInlineEditIndicatorIcon",
            children: control.editButton
          }) : _jsxs("span", {
            class: "sapFeInlineEditIndicatorAcceptDeclineIcon sapFeInlineEditIndicatorIcon",
            children: [control.saveButton, control.discardButton]
          })
        });
      });
    };
    return InlineEditIndicator;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "editButton", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "saveButton", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "discardButton", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "editMode", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "pressEdit", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "mouseout", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = InlineEditIndicator;
  return _exports;
}, false);
//# sourceMappingURL=InlineEditIndicator-dbg.js.map

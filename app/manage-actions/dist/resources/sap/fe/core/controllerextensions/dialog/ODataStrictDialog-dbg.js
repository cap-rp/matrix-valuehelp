/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Bar", "sap/m/Button", "sap/m/Dialog", "sap/m/Title", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, Bar, Button, Dialog, Title, Library, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const macroResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
  let OperationsDialog = (_dec = defineUI5Class("sap.fe.core.controllerextensions.dialog.OperationsDialog"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "object",
    required: true
  }), _dec5 = defineReference(), _dec6 = property({
    type: "string",
    required: true
  }), _dec7 = property({
    type: "string",
    required: true
  }), _dec8 = property({
    type: "object",
    required: true
  }), _dec9 = property({
    type: "function",
    required: true
  }), _dec10 = property({
    type: "function",
    required: true
  }), _dec11 = property({
    type: "function",
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function OperationsDialog(props) {
      var _this;
      _this = _BuildingBlock.call(this, props) || this;
      /*
       * The 'id' property of the dialog
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * The 'title' property of the Dialog;
       */
      _initializerDefineProperty(_this, "title", _descriptor2, _this);
      /**
       * The message object that is provided to this dialog
       */
      _initializerDefineProperty(_this, "messageObject", _descriptor3, _this);
      _initializerDefineProperty(_this, "operationsDialog", _descriptor4, _this);
      _initializerDefineProperty(_this, "actionName", _descriptor5, _this);
      _initializerDefineProperty(_this, "cancelButtonTxt", _descriptor6, _this);
      _initializerDefineProperty(_this, "messageDialogModel", _descriptor7, _this);
      _initializerDefineProperty(_this, "onBeginButtonPress", _descriptor8, _this);
      _initializerDefineProperty(_this, "onEndButtonPress", _descriptor9, _this);
      _initializerDefineProperty(_this, "onClose", _descriptor10, _this);
      return _this;
    }
    _exports = OperationsDialog;
    _inheritsLoose(OperationsDialog, _BuildingBlock);
    var _proto = OperationsDialog.prototype;
    _proto.open = function open() {
      this.createContent();
      this.operationsDialog.current?.open();
    };
    _proto.getBeginButton = function getBeginButton() {
      return new Button({
        press: () => {
          this.onBeginButtonPress?.();
          this.messageDialogModel.setData({});
          this.close();
        },
        type: "Emphasized",
        text: this.actionName
      });
    };
    _proto.close = function close() {
      this.operationsDialog.current?.close();
      this.onClose?.();
    };
    _proto.getTitle = function getTitle() {
      const sTitle = macroResourceBundle.getText("M_WARNINGS");
      return new Title({
        text: sTitle
      });
    };
    _proto.getEndButton = function getEndButton() {
      return new Button({
        press: () => {
          this.onEndButtonPress?.();
          this.messageDialogModel.setData({});
          this.close();
        },
        text: this.cancelButtonTxt
      });
    }

    /**
     * The building block render function.
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.createContent = function createContent() {
      return _jsx(Dialog, {
        id: this.id,
        ref: this.operationsDialog,
        resizable: true,
        content: this.messageObject.messageView,
        state: "Warning",
        customHeader: new Bar({
          contentLeft: [this.messageObject.oBackButton],
          contentMiddle: [this.getTitle()]
        }),
        contentHeight: "50%",
        contentWidth: "50%",
        verticalScrolling: false,
        beginButton: this.getBeginButton(),
        endButton: this.getEndButton()
      });
    };
    return OperationsDialog;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Dialog Standard Title";
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "messageObject", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "operationsDialog", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "actionName", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "cancelButtonTxt", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "messageDialogModel", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "onBeginButtonPress", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "onEndButtonPress", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "onClose", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = OperationsDialog;
  return _exports;
}, false);
//# sourceMappingURL=ODataStrictDialog-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controls/CommandExecution", "sap/fe/macros/ai/EasyFillDialog", "sap/m/Button", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/m/library", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, ClassSupport, BuildingBlock, CommandExecution, EasyFillDialog, Button, Menu, MenuButton, MenuItem, library, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let EditButton = (_dec = defineUI5Class("sap.fe.macros.EditButton"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "boolean",
    bindToState: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function EditButton() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "text", _descriptor, _this);
      _initializerDefineProperty(_this, "enabled", _descriptor2, _this);
      return _this;
    }
    _exports = EditButton;
    _inheritsLoose(EditButton, _BuildingBlock);
    var _proto = EditButton.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    };
    _proto.buildEmphasizedButtonExpression = function buildEmphasizedButtonExpression(metaPath) {
      const identification = metaPath?.getTarget()?.annotations?.UI?.Identification;
      const dataFieldsWithCriticality = identification?.filter(dataField => dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && dataField.Criticality) || [];
      const dataFieldsBindingExpressions = dataFieldsWithCriticality.length ? dataFieldsWithCriticality.map(dataField => {
        const criticalityVisibleBindingExpression = getExpressionFromAnnotation(dataField.Criticality);
        return and(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true)), or(equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Negative"), equal(criticalityVisibleBindingExpression, "1"), equal(criticalityVisibleBindingExpression, 1), equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Positive"), equal(criticalityVisibleBindingExpression, "3"), equal(criticalityVisibleBindingExpression, 3)));
      }) : [constant(false)];

      // If there is at least one visible dataField with criticality negative or positive, the type is set as Ghost
      // else it is emphasized
      return compileExpression(ifElse(or(...dataFieldsBindingExpressions), ButtonType.Ghost, ButtonType.Emphasized));
    };
    _proto._easyEditDocument = async function _easyEditDocument() {
      if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
        const controller = this.getPageController();
        const view = controller.getView();
        if (!this.getPageController()?.getModel("ui").getProperty("/isEditable")) {
          await controller.editFlow.editDocument.apply(controller.editFlow, [view?.getBindingContext()]);
        }
        // Open easy create dialog
        const easyEditDialog = this.getPageController().getOwnerComponent()?.runAsOwner(() => {
          return new EasyFillDialog({
            getEditableFields: this._getEditableFields.bind(this)
          });
        });
        easyEditDialog.open();
        view?.addDependent(easyEditDialog);
      }
    };
    _proto._getEditableFields = async function _getEditableFields() {
      // Connect all sections
      const allFields = this.getPageController().getView()?.findAggregatedObjects(true, control => {
        return control.isA("sap.fe.macros.Field");
      });
      const editableFields = {};
      allFields.forEach(field => {
        const propertyRelativePath = field.getMainPropertyRelativePath();
        if (propertyRelativePath) {
          editableFields[propertyRelativePath] = {
            isEditable: field.getEditable()
          };
        }
      });
      return Promise.resolve(editableFields);
    };
    _proto._createId = function _createId(id) {
      return this.getPageController().getView().createId(id);
    };
    _proto.createContent = function createContent() {
      const metaPathObject = this.getMetaPathObject(this.getOwnerContextPath());
      if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
        this.getPageController().getView()?.addDependent(_jsx(CommandExecution, {
          execute: this._easyEditDocument.bind(this),
          command: "EasyEdit"
        }));
        return _jsx(MenuButton, {
          id: this._createId("fe::StandardAction::EditMenu"),
          enabled: this.bindState("enabled"),
          type: this.buildEmphasizedButtonExpression(metaPathObject),
          "dt:designtime": "not-adaptable",
          text: this.text,
          "jsx:command": "cmd:Edit|defaultAction",
          buttonMode: "Split",
          useDefaultActionOnly: "true",
          children: _jsxs(Menu, {
            children: [_jsx(MenuItem, {
              id: this._createId("fe::StandardAction::Edit"),
              icon: "sap-icon://edit",
              text: "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_EDIT}",
              "jsx:command": "cmd:Edit|press"
            }), _jsx(MenuItem, {
              id: this._createId("fe::StandardAction::EasyEdit"),
              icon: "sap-icon://ai",
              "jsx:command": "cmd:EasyEdit|press",
              text: this.getTranslatedText("C_EASYEDIT_BUTTON")
            })]
          })
        });
      } else {
        return _jsx(Button, {
          id: this._createId("fe::StandardAction::Edit"),
          "dt:designtime": "not-adaptable",
          text: this.text,
          type: this.buildEmphasizedButtonExpression(metaPathObject),
          "jsx:command": "cmd:Edit|press",
          enabled: this.bindState("enabled")
        });
      }
    };
    return EditButton;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EditButton;
  return _exports;
}, false);
//# sourceMappingURL=EditButton-dbg.js.map

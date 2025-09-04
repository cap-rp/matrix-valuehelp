/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/Field", "sap/m/Label", "sap/ui/core/InvisibleText", "sap/ui/layout/form/ColumnElementData", "../MacroAPI"], function (ClassSupport, StableIdHelper, Field, Label, InvisibleText, ColumnElementData, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _FormContainerAPI;
  var generate = StableIdHelper.generate;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * @alias sap.fe.macros.form.FormContainerAPI
   * @private
   */
  let FormContainerAPI = (_dec = defineUI5Class("sap.fe.macros.form.FormContainerAPI"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "boolean"
  }), _dec4 = xmlEventHandler(), _dec(_class = (_class2 = (_FormContainerAPI = /*#__PURE__*/function (_MacroAPI) {
    function FormContainerAPI(props) {
      var _this;
      _this = _MacroAPI.call(this, props) || this;
      /**
       * The identifier of the form container control.
       * @public
       */
      _initializerDefineProperty(_this, "formContainerId", _descriptor, _this);
      _initializerDefineProperty(_this, "showDetails", _descriptor2, _this);
      _this.setParentBindingContext("internal", `controls/${_this.formContainerId}`);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     * @param ownerComponent
     */
    _inheritsLoose(FormContainerAPI, _MacroAPI);
    var _proto = FormContainerAPI.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(ownerComponent) {
      const view = ownerComponent.getRootController()?.getView();
      if (!view) {
        return;
      }
      let formContainer = view.byId(this.formContainerId);
      if (formContainer) {
        this.setFormElementsInvisibleTextsToStatic(formContainer);
      } else {
        view.attachEventOnce("afterRendering", function () {
          formContainer = view.byId(this.formContainerId);
          if (formContainer) {
            this.setFormElementsInvisibleTextsToStatic(formContainer);
          }
        }.bind(this));
      }
    }

    /**
     * Sets the Invisible Texts to static.
     * @param formContainer FormContainer control.
     */;
    _proto.setFormElementsInvisibleTextsToStatic = function setFormElementsInvisibleTextsToStatic(formContainer) {
      const formElements = formContainer.getFormElements();
      formElements.forEach(formElement => {
        const dependents = formElement.getDependents();
        dependents.forEach(dependent => {
          if (dependent.isA("sap.ui.core.InvisibleText")) {
            dependent.toStatic();
          }
        });
      });
    }

    /**
     * Sets the InvisibleText when the TextArea Label is hidden.
     * @param formElement FormElement control.
     * @param field Field control.
     */;
    FormContainerAPI.setInvisibleTextWhereTextAreaLabelIsHidden = function setInvisibleTextWhereTextAreaLabelIsHidden(formElement, field) {
      formElement.addDependent(new InvisibleText(generate([field.getId(), "FormElementAriaText"]), {
        text: formElement.getLabel()
      }));
      formElement.setLabel(new Label(generate([field.getId(), "FormElementLabel"]), {
        text: formElement.getLabel(),
        visible: false,
        layoutData: new ColumnElementData({
          cellsLarge: 12
        })
      }));
      field.addAriaLabelledBy(generate([field.getId(), "FormElementAriaText"]));
    }

    /**
     * Sets the TextArea Label's Visibility.
     * @param formContainer FormContainer control.
     */;
    FormContainerAPI.setTextAreaLabelVisibility = function setTextAreaLabelVisibility(formContainer) {
      const allFormElements = formContainer.getFormElements();
      const formElements = allFormElements.filter(formElement => formElement.getVisible());
      if (formElements.length === 1) {
        const fields = formElements[0].getFields();
        if (fields.length === 1) {
          const control = Field.getControlInFieldWrapper(fields[0].getContent());
          const isTextArea = control?.isA("sap.fe.macros.field.TextAreaEx");
          const isRequired = fields[0].getRequired() === true;
          const pageMode = (control?.getParent()).editMode;
          if (isTextArea && isRequired && pageMode !== "Display") {
            formElements[0].getLabelControl().setVisible(true);
          }
          if (pageMode === "Display") {
            formElements[0].getLabelControl().setVisible(false);
          }
          const textAreaLabelVisibility = formElements[0].getLabelControl().getVisible();
          const dependents = formElements[0].getDependents();
          const isInvisibleTextAdded = dependents.find(dependent => dependent.isA("sap.ui.core.InvisibleText"));
          if (!textAreaLabelVisibility && !isInvisibleTextAdded) {
            this.setInvisibleTextWhereTextAreaLabelIsHidden(formElements[0], fields[0]);
          }
        }
      }
    };
    _proto.toggleDetails = function toggleDetails() {
      this.showDetails = !this.showDetails;
    };
    return FormContainerAPI;
  }(MacroAPI), _FormContainerAPI.isDependentBound = true, _FormContainerAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "formContainerId", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "showDetails", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _applyDecoratedDescriptor(_class2.prototype, "toggleDetails", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "toggleDetails"), _class2.prototype), _class2)) || _class);
  return FormContainerAPI;
}, false);
//# sourceMappingURL=FormContainerAPI-dbg.js.map

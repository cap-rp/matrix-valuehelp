/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/macros/Field"], function (ClassSupport, BuildingBlock, Field) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let CustomFormElement = (_dec = defineUI5Class("sap.fe.macros.form.CustomFormElement"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string",
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function CustomFormElement(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      /**
       * Metadata path to the property used for the side effects.
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * The key used to identify the custom form element (note that this is also the fragmentId).
       */
      _initializerDefineProperty(_this, "formElementKey", _descriptor4, _this);
      return _this;
    }
    _exports = CustomFormElement;
    _inheritsLoose(CustomFormElement, _BuildingBlock);
    var _proto = CustomFormElement.prototype;
    _proto.getFormDoNotAdjustWidth = function getFormDoNotAdjustWidth() {
      return this.content?.getFormDoNotAdjustWidth?.() ?? false;
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.setUpSidesEffectHandlingForContent();
    }

    /**
     * Sets up side effect handling for the content of the custom form element.
     */;
    _proto.setUpSidesEffectHandlingForContent = function setUpSidesEffectHandlingForContent() {
      if (!this.content || !this.metaPath) {
        return;
      }
      const appComponent = this.getAppComponent();
      const dataModelObjectForMetaPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (!appComponent || !dataModelObjectForMetaPath) {
        return;
      }
      const sideEffectService = appComponent.getSideEffectsService();
      this.fieldGroupIds = sideEffectService.computeFieldGroupIds(dataModelObjectForMetaPath.targetEntityType?.fullyQualifiedName ?? "", dataModelObjectForMetaPath.targetObject?.fullyQualifiedName ?? "");
      if (this.fieldGroupIds.length === 0) {
        return;
      }
      // we add a unique fieldGroupId based on the fragmentID taht will be used to trigger specific handling
      // that fires immediate side effects and register non immediate
      this.fieldGroupIds.push(`fe_sideEffectHandling_${this.formElementKey}`);
      const customControls = this.content?.findAggregatedObjects(true, managedObject => managedObject.isA("sap.ui.core.Control")) ?? [];
      for (const control of customControls) {
        this.setUpSidesEffectHandlingForControl(control);
      }
    }

    /**
     * Sets up side effect handling for a control.
     * @param control
     */;
    _proto.setUpSidesEffectHandlingForControl = function setUpSidesEffectHandlingForControl(control) {
      if (control.getFieldGroupIds()?.length) {
        // there is already some fieldgroup handling  do not overwrite it
        return;
      }
      control.setFieldGroupIds(this.fieldGroupIds);
      control.attachValidateFieldGroup(event => {
        Field.onValidateFieldGroup(event);
      });
    };
    return CustomFormElement;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formElementKey", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CustomFormElement;
  return _exports;
}, false);
//# sourceMappingURL=CustomFormElement-dbg.js.map

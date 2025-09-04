/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/templating/DataModelPathHelper"], function (BuildingBlockSupport, BuildingBlockTemplatingBase, MetaModelConverter, Form, DataModelPathHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16;
  var _exports = {};
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var createFormDefinition = Form.createFormDefinition;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a FormContainer based on the provided OData V4 metadata.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:FormContainer
   * id="SomeId"
   * entitySet="{entitySet>}"
   * dataFieldCollection ="{dataFieldCollection>}"
   * title="someTitle"
   * navigationPath="{ToSupplier}"
   * visible=true
   * onChange=".handlers.onFieldValueChange"
   * /&gt;
   * </pre>
   * @private
   * @experimental
   */
  let FormContainerBlock = (_dec = defineBuildingBlock({
    name: "FormContainer",
    namespace: "sap.fe.macros",
    fragment: "sap.fe.macros.form.FormContainer"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec6 = blockAttribute({
    type: "array"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "string"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec12 = blockAttribute({
    type: "boolean"
  }), _dec13 = blockAttribute({
    type: "string"
  }), _dec14 = blockAttribute({
    type: "array"
  }), _dec15 = blockAttribute({
    type: "boolean"
  }), _dec16 = blockAggregation({
    type: "sap.fe.macros.form.FormElement"
  }), _dec17 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function FormContainerBlock(props, externalConfiguration, settings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "entitySet", _descriptor3, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      /**
       * Metadata path to the dataFieldCollection
       */
      _initializerDefineProperty(_this, "dataFieldCollection", _descriptor5, _this);
      /**
       * Control whether the form is in displayMode or not
       */
      _initializerDefineProperty(_this, "displayMode", _descriptor6, _this);
      /**
       * Title of the form container
       */
      _initializerDefineProperty(_this, "title", _descriptor7, _this);
      /**
       * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
       */
      _initializerDefineProperty(_this, "titleLevel", _descriptor8, _this);
      /**
       * Binding the form container using a navigation path
       */
      _initializerDefineProperty(_this, "navigationPath", _descriptor9, _this);
      /**
       * Binding the visibility of the form container using an expression binding or Boolean
       */
      _initializerDefineProperty(_this, "visible", _descriptor10, _this);
      /**
       * Check if UI hidden annotation is present or not
       */
      _initializerDefineProperty(_this, "hasUiHiddenAnnotation", _descriptor11, _this);
      /**
       * Flex designtime settings to be applied
       */
      _initializerDefineProperty(_this, "designtimeSettings", _descriptor12, _this);
      _initializerDefineProperty(_this, "actions", _descriptor13, _this);
      _initializerDefineProperty(_this, "useSingleTextAreaFieldAsNotes", _descriptor14, _this);
      _initializerDefineProperty(_this, "formElements", _descriptor15, _this);
      // Just proxied down to the Field may need to see if needed or not
      _initializerDefineProperty(_this, "onChange", _descriptor16, _this);
      _this.entitySet = _this.contextPath;
      if (_this.formElements && Object.keys(_this.formElements).length > 0) {
        const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        // Wrap the facet in a fake Facet annotation
        oFacetDefinition = {
          $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
          Label: oFacetDefinition?.Label,
          Target: {
            $target: oFacetDefinition,
            fullyQualifiedName: oFacetDefinition?.fullyQualifiedName,
            path: "",
            term: "",
            type: "AnnotationPath",
            value: getContextRelativeTargetObjectPath(oContextObjectPath)
          },
          annotations: {},
          fullyQualifiedName: oFacetDefinition?.fullyQualifiedName
        };
        mExtraSettings[oFacetDefinition.Target.value] = {
          fields: _this.formElements
        };
        const oConverterContext = _this.getConverterContext(oContextObjectPath, /*this.contextPath*/undefined, settings, mExtraSettings);
        const oFormDefinition = createFormDefinition(oFacetDefinition, "true", oConverterContext);
        _this.dataFieldCollection = oFormDefinition.formContainers[0].formElements;
      }
      return _this;
    }
    _exports = FormContainerBlock;
    _inheritsLoose(FormContainerBlock, _BuildingBlockTemplat);
    return FormContainerBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "dataFieldCollection", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Auto";
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigationPath", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "hasUiHiddenAnnotation", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "designtimeSettings", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "sap/fe/macros/form/FormContainer.designtime";
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "useSingleTextAreaFieldAsNotes", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FormContainerBlock;
  return _exports;
}, false);
//# sourceMappingURL=FormContainer.block-dbg.js.map

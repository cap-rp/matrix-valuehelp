/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter"], function (Log, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
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
   * Building block used to create a form element based on the metadata provided by OData V4.
   * @public
   * @since 1.90.0
   */
  let FormElementBlock = (_dec = defineBuildingBlock({
    name: "FormElement",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.ui.layout.form.FormElement"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true,
    expectedTypes: ["Property"],
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataFieldWithUrl", "com.sap.vocabularies.UI.v1.DataFieldForAnnotation", "com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithAction", "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataPointType"]
  }), _dec5 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec8 = blockAggregation({
    type: "sap.ui.core.Control",
    slot: "fields",
    isPublic: true,
    isDefault: true
  }), _dec9 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function FormElementBlock(props, configuration, mSettings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, configuration, mSettings) || this;
      /**
       * The identifier of the FormElement building block.
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _this);
      /**
       * Label shown for the field. If not set, the label from the annotations will be shown.
       * @public
       */
      _initializerDefineProperty(_this, "label", _descriptor4, _this);
      /**
       * If set to false, the FormElement is not rendered.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor5, _this);
      _initializerDefineProperty(_this, "key", _descriptor6, _this);
      /**
       * Optional aggregation of controls that should be displayed inside the FormElement.
       * If not set, a default Field building block will be rendered
       * @public
       */
      _initializerDefineProperty(_this, "fields", _descriptor7, _this);
      /**
       * The event is triggered when the field is changed.
       * @public
       */
      _initializerDefineProperty(_this, "change", _descriptor8, _this);
      const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
      if (!oContextObjectPath.targetObject) {
        Log.error(`No target object found for the given path ${_this.metaPath.getPath()} on the FormElement`);
      }
      if (_this.label === undefined) {
        _this.label = oContextObjectPath.targetObject?.annotations.Common?.Label?.toString() ?? "";
      }
      return _this;
    }
    _exports = FormElementBlock;
    _inheritsLoose(FormElementBlock, _BuildingBlockTemplat);
    var _proto = FormElementBlock.prototype;
    _proto.getFields = function getFields() {
      if (this.fields) {
        return xml`<slot name="fields" />`;
      } else {
        return xml`<macros:Field
						metaPath="${this.metaPath?.getPath()}"
						contextPath="${this.contextPath?.getPath()}"
						vhIdPrefix="FieldValueHelp"
						change="${this.change}"
						id="${this.createId("FormElementField")}" />`;
      }
    };
    _proto.getTemplate = function getTemplate() {
      return xml`<f:FormElement xmlns:f="sap.ui.layout.form" id="${this.id}"
			key="${this.key}"
			label="${this.label}"
			visible="${this.visible}">
			<f:fields>
				${this.getFields()}
			</f:fields>
		</f:FormElement>`;
    };
    return FormElementBlock;
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
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "label", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "fields", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FormElementBlock;
  return _exports;
}, false);
//# sourceMappingURL=FormElement.block-dbg.js.map

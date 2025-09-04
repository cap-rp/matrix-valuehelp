/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating"], function (ClassSupport, BuildingBlock, ModelHelper, TypeGuards, FieldHelper, ValueHelpTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var getValueHelpTemplate = ValueHelpTemplating.getValueHelpTemplate;
  var isEntitySet = TypeGuards.isEntitySet;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a ValueHelp based on the provided OData V4 metadata.
   * @private
   */
  let ValueHelp = (_dec = defineUI5Class("sap.fe.macros.ValueHelp"), _dec2 = association({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "boolean"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = association({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function ValueHelp(props, others) {
      var _this;
      if (props._flexId) {
        props.id = props._flexId + "::Block";
      }
      _this = _BuildingBlock.call(this, props, others) || this;
      /**
       * A prefix that is added to the generated ID of the value help.
       */
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _this);
      /**
       * Defines the metadata path to the property.
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * Indicator whether the value help is for a filter field.
       */
      _initializerDefineProperty(_this, "conditionModel", _descriptor4, _this);
      /**
       * Indicates that this is a value help of a filter field. Necessary to decide if a
       * validation should occur on the back end or already on the client.
       */
      _initializerDefineProperty(_this, "filterFieldValueHelp", _descriptor5, _this);
      /**
       * Specifies the Sematic Date Range option for the filter field.
       */
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor6, _this);
      /**
       * Specifies whether the ValueHelp can be used with a MultiValueField
       */
      _initializerDefineProperty(_this, "useMultiValueField", _descriptor7, _this);
      _initializerDefineProperty(_this, "navigationPrefix", _descriptor8, _this);
      _initializerDefineProperty(_this, "requiresValidation", _descriptor9, _this);
      _initializerDefineProperty(_this, "_flexId", _descriptor10, _this);
      _this.requestGroupId = "$auto.Workers";
      _this.collaborationEnabled = false;
      return _this;
    }
    _exports = ValueHelp;
    _inheritsLoose(ValueHelp, _BuildingBlock);
    ValueHelp.getValueHelpForMetaPath = function getValueHelpForMetaPath(pageController, metaPath, contextPath, metaModel) {
      const dependents = pageController.getView()?.getDependents();
      const foundDep = dependents?.find(child => {
        return child.isA("sap.fe.macros.ValueHelp") && child.getMetaPath() === metaPath;
      });
      if (!foundDep) {
        const valueHelp = new ValueHelp({
          metaPath: metaPath,
          contextPath: contextPath,
          metaModel: metaModel?.getId(),
          idPrefix: pageController.getView()?.createId("FieldValueHelp")
        });
        pageController.getView().addDependent(valueHelp);
        return valueHelp;
      } else {
        return foundDep;
      }
    };
    var _proto = ValueHelp.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this._getOwner()?.runAsOwner(() => {
          this.content = this.createContent();
        });
      }
    };
    _proto.createContent = function createContent() {
      const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);
      const metaModel = this._getOwner()?.getMetaModel(this.metaModel);
      if (metaContextPath && metaModel) {
        const entitySetOrSingleton = metaContextPath.getClosestEntitySet();
        if (isEntitySet(entitySetOrSingleton)) {
          this.collaborationEnabled = ModelHelper.isCollaborationDraftSupported(metaModel);
        }
        let metaPath = metaModel.createBindingContext(metaContextPath.getPath());
        if (metaPath) {
          if (this.filterFieldValueHelp) {
            metaPath = metaModel.createBindingContext(FieldHelper.valueHelpPropertyForFilterField(metaPath));
          } else {
            metaPath = metaModel.createBindingContext(FieldHelper.valueHelpProperty(metaPath));
          }
          const idPrefix = this.idPrefix ?? "ValueHelp";
          return getValueHelpTemplate(metaPath, {
            metaPath: metaModel.createBindingContext(metaContextPath.getPath()),
            contextPath: metaModel.createBindingContext(metaContextPath.getContextPath()),
            filterFieldValueHelp: this.filterFieldValueHelp,
            useSemanticDateRange: this.useSemanticDateRange,
            useMultiValueField: this.useMultiValueField,
            navigationPrefix: this.navigationPrefix,
            requiresValidation: this.requiresValidation,
            _flexId: this._flexId,
            idPrefix: idPrefix,
            conditionModel: this.conditionModel,
            requestGroupId: this.requestGroupId,
            collaborationEnabled: this.collaborationEnabled
          });
        }
      }
    };
    return ValueHelp;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "conditionModel", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "filterFieldValueHelp", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useMultiValueField", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "navigationPrefix", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "requiresValidation", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ValueHelp;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelp-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldTemplating", "sap/m/Avatar", "sap/m/AvatarShape", "sap/m/Link", "sap/m/Text", "sap/m/Title", "sap/m/VBox", "sap/ui/core/library", "sap/ui/layout/HorizontalLayout", "sap/ui/layout/VerticalLayout", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, ClassSupport, BuildingBlock, DataField, TypeGuards, DataModelPathHelper, UIFormatters, FieldHelper, FieldTemplating, Avatar, AvatarShape, Link, Text, Title, VBox, coreLibrary, HorizontalLayout, VerticalLayout, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var getTextBinding = FieldTemplating.getTextBinding;
  var getDataModelObjectPathForValue = FieldTemplating.getDataModelObjectPathForValue;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isEntityType = TypeGuards.isEntityType;
  var isDataField = DataField.isDataField;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let QuickViewHeaderOptions = (_dec = defineUI5Class("sap.fe.macros.quickView.QuickViewHeaderOptions"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "object"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function QuickViewHeaderOptions(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "semanticPayload", _descriptor3, _this);
      _initializerDefineProperty(_this, "id", _descriptor4, _this);
      _initializerDefineProperty(_this, "titleLink", _descriptor5, _this);
      _initializerDefineProperty(_this, "horizontalLayout", _descriptor6, _this);
      _this.visible = true;
      return _this;
    }
    _exports = QuickViewHeaderOptions;
    _inheritsLoose(QuickViewHeaderOptions, _BuildingBlock);
    var _proto = QuickViewHeaderOptions.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      const contextObject = this.getDataModelObjectForMetaPath(this.metaPath ?? "", this.contextPath);
      const targetObject = contextObject?.targetObject;
      if (isEntityType(targetObject)) {
        this.entityType = targetObject;
        this.headerInfo = this.entityType?.annotations.UI?.HeaderInfo;
      } else if (isDataField(targetObject)) {
        this.convertedDataField = targetObject;
        this.dataFieldValue = getDataModelObjectPathForValue(contextObject);
      } else {
        this.entityType = contextObject?.targetEntityType;
        this.headerInfo = this.entityType?.annotations.UI?.HeaderInfo;
      }
      this.content = this.createContent();
    };
    _proto.setHeaderDisplayParametersForDataField = function setHeaderDisplayParametersForDataField() {
      if (this.dataFieldValue && this.convertedDataField) {
        if (this.convertedDataField?.IconUrl) {
          this.icon = this.convertedDataField.IconUrl;
          this.fallbackIcon = "sap-icon://product";
        } else {
          this.icon = undefined;
          this.fallbackIcon = undefined;
        }
        this.title = getTextBinding(this.dataFieldValue, {
          displayMode: getDisplayMode(this.dataFieldValue)
        });
        this.description = this.convertedDataField.Label ? compileExpression(this.convertedDataField.Label) : compileExpression(this.convertedDataField.Value?.$target?.annotations?.Common?.Label);
      }
    };
    _proto.setHeaderDisplayParametersForEntityType = function setHeaderDisplayParametersForEntityType() {
      if (this.entityType) {
        const iconExpression = this.headerInfo?.ImageUrl ? getExpressionFromAnnotation(this.headerInfo.ImageUrl) : getExpressionFromAnnotation(this.headerInfo?.TypeImageUrl);
        const iconExpressionCompiled = compileExpression(iconExpression);
        this.icon = iconExpressionCompiled === "undefined" ? undefined : iconExpressionCompiled;
        if (this.headerInfo?.TypeImageUrl) {
          this.fallbackIcon = compileExpression(this.headerInfo.TypeImageUrl);
        } else if (this.entityType?.annotations.Common?.IsNaturalPerson?.valueOf() === true) {
          this.fallbackIcon = "sap-icon://person-placeholder";
        } else {
          this.fallbackIcon = "sap-icon://product";
        }
        const dataModelPath = this.getDataModelObjectPath(this.metaPath);
        if (dataModelPath && isDataField(this.headerInfo?.Title) && this.headerInfo?.Title.Value) {
          const headerTitle = enhanceDataModelPath(dataModelPath, this.headerInfo.Title?.Value.path);
          if (headerTitle.targetObject) {
            const titleExpression = getTextBinding(headerTitle, {
              displayMode: getDisplayMode(headerTitle)
            });
            this.title = titleExpression !== "{}" ? titleExpression : undefined;
          }
        }
        if (dataModelPath && isDataField(this.headerInfo?.Description) && this.headerInfo?.Description.Value) {
          const headerDescription = enhanceDataModelPath(dataModelPath, this.headerInfo.Description?.Value.path);
          const headerExpression = headerDescription.targetObject && getTextBinding(headerDescription, {
            displayMode: getDisplayMode(headerDescription)
          });
          this.description = headerDescription.targetObject === undefined ? compileExpression({
            _type: "PathInModel",
            modelName: "semantic",
            path: "propertyPathLabel"
          }) : headerExpression;
        }
      }
    };
    _proto.getSemanticObjectsPrimaryActions = async function getSemanticObjectsPrimaryActions() {
      if (this.semanticPayload && (await FieldHelper.checkPrimaryActions(this.semanticPayload, false, this.getAppComponent()))) {
        const primaryAction = FieldHelper.getPrimaryAction(this.semanticPayload);
        this.titleLink = primaryAction;
      }
      this.setupTitle();
    };
    _proto.createContent = function createContent() {
      let avatar;
      this.setHeaderDisplayParametersForDataField();
      this.setHeaderDisplayParametersForEntityType();
      if (this.icon && this.fallbackIcon) {
        avatar = _jsx(Avatar, {
          class: "sapMQuickViewThumbnail sapUiTinyMarginEnd",
          src: this.icon,
          displayShape: this.entityType?.annotations.Common?.IsNaturalPerson?.valueOf() === true ? AvatarShape.Circle : AvatarShape.Square,
          fallbackIcon: this.fallbackIcon
        });
      }
      const hLayout = _jsx(HorizontalLayout, {
        class: "sapUiSmallMarginBottom sapMQuickViewPage",
        ref: this.horizontalLayout,
        children: avatar
      });
      this.isInitialized = this.getSemanticObjectsPrimaryActions();
      return _jsx(VBox, {
        children: hLayout
      });
    };
    _proto.setupTitle = function setupTitle() {
      let title;
      if (this.title) {
        if (this.titleLink) {
          title = _jsx(Link, {
            text: this.title,
            href: this.titleLink,
            emphasized: "true"
          });
        } else {
          title = _jsx(Title, {
            text: this.title,
            level: coreLibrary.TitleLevel.H3,
            wrapping: "true"
          });
        }
      }
      const description = this.description ? _jsx(Text, {
        text: this.description
      }) : undefined;
      const vLayout = _jsxs(VerticalLayout, {
        children: [title, description]
      });
      this.horizontalLayout.current?.addContent(vLayout);
    };
    return QuickViewHeaderOptions;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "semanticPayload", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "titleLink", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "horizontalLayout", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = QuickViewHeaderOptions;
  return _exports;
}, false);
//# sourceMappingURL=QuickViewHeaderOptions-dbg.js.map

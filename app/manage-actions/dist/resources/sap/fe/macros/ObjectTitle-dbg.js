/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Avatar", "sap/m/FlexBox", "sap/m/Label", "sap/m/LightBox", "sap/m/LightBoxItem", "sap/m/Title", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, Avatar, FlexBox, Label, LightBox, LightBoxItem, Title, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ObjectTitleDefinition = /*#__PURE__*/function () {
    function ObjectTitleDefinition(headerInfo) {
      this.headerInfo = headerInfo;
    }
    var _proto = ObjectTitleDefinition.prototype;
    _proto.hasAvatar = function hasAvatar() {
      return !!(this.headerInfo.ImageUrl ?? this.headerInfo.TypeImageUrl ?? this.headerInfo.Initials);
    };
    _proto.getTitle = function getTitle() {
      return compileExpression(getExpressionFromAnnotation(this.headerInfo.Title.Value));
    };
    _proto.isDescriptionVisible = function isDescriptionVisible() {
      // Not statically hidden
      return this.headerInfo.Description?.annotations?.UI?.Hidden?.valueOf() !== false;
    };
    _proto.getDescription = function getDescription() {
      return compileExpression(getExpressionFromAnnotation(this.headerInfo.Description.Value));
    };
    return ObjectTitleDefinition;
  }();
  let ObjectTitle = (_dec = defineUI5Class("sap.fe.macros.ObjectTitle"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function ObjectTitle(idOrSettings, settings) {
      var _this;
      _this = _BuildingBlock.call(this, idOrSettings, settings) || this;
      _initializerDefineProperty(_this, "metaPath", _descriptor, _this);
      return _this;
    }
    _exports = ObjectTitle;
    _inheritsLoose(ObjectTitle, _BuildingBlock);
    var _proto2 = ObjectTitle.prototype;
    _proto2.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.content = this.createContent();
      }
    };
    _proto2._createAvatar = function _createAvatar() {
      return _jsx(Avatar, {
        class: "sapUiSmallMarginEnd",
        src: "{avatar>src}",
        initials: "{avatar>initials}",
        fallbackIcon: "{avatar>fallbackIcon}",
        displayShape: "{avatar>displayShape}",
        displaySize: "S",
        imageFitType: "Cover",
        children: {
          detailBox: _jsx(LightBox, {
            children: _jsx(LightBoxItem, {
              imageSrc: "{avatar>src}",
              title: "{= OP.getExpressionForTitle(${fullContextPath>@@UI.getDataModelObjectPath}, ${viewData>}, ${headerInfo>@@UI.getConverterContext})}",
              subtitle: "{= OP.getExpressionForDescription(${fullContextPath>@@UI.getDataModelObjectPath}, ${headerInfo>@@UI.getConverterContext})}"
            })
          })
        }
      });
    };
    _proto2._createTitle = function _createTitle(definition) {
      return _jsx(Title, {
        text: definition.getTitle(),
        wrapping: "true",
        level: "H2"
      });
    };
    _proto2._createDescription = function _createDescription(definition) {
      return _jsx(Label, {
        text: definition.getDescription(),
        wrapping: "true"
      });
    };
    _proto2._getTitlePart = function _getTitlePart(definition) {
      if (definition.isDescriptionVisible()) {
        return _jsx(FlexBox, {
          direction: "Column",
          children: {
            items: [this._createTitle(definition), this._createDescription(definition)]
          }
        });
      } else {
        return this._createTitle(definition);
      }
    };
    _proto2.createContent = function createContent() {
      const metaPathObject = this.getMetaPathObject(`@${this.metaPath}`);
      if (metaPathObject) {
        const definition = new ObjectTitleDefinition(metaPathObject.getTarget());
        if (definition.hasAvatar()) {
          return _jsx(FlexBox, {
            renderType: "Bare",
            children: {
              items: [this._createAvatar(), this._getTitlePart(definition)]
            }
          });
        } else {
          return this._getTitlePart(definition);
        }
      }
    };
    return ObjectTitle;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "com.sap.vocabularies.UI.v1.HeaderInfo";
    }
  }), _class2)) || _class);
  _exports = ObjectTitle;
  return _exports;
}, false);
//# sourceMappingURL=ObjectTitle-dbg.js.map

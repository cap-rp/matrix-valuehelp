/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/helpers/DataFieldHelper", "sap/fe/core/helpers/TitleHelper", "sap/m/FlexItemData", "sap/m/Label", "sap/m/Title", "sap/m/VBox", "sap/m/library", "sap/ui/core/library", "../field/FieldTemplating", "./HeaderHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (ClassSupport, BuildingBlock, DataFieldHelper, TitleHelper, FlexItemData, Label, Title, VBox, library, coreLibrary, FieldTemplating, HeaderHelper, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var getTextBindingExpression = FieldTemplating.getTextBindingExpression;
  var TitleLevel = coreLibrary.TitleLevel;
  var FlexRendertype = library.FlexRendertype;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create title and description in the OP header
   * @private
   */
  let HeaderTitleDescription = (_dec = defineUI5Class("sap.fe.macros.header.HeaderTitleDescription"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function HeaderTitleDescription(settings, others) {
      var _this;
      _this = _BuildingBlock.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "VBoxType", _descriptor, _this);
      return _this;
    }
    _exports = HeaderTitleDescription;
    _inheritsLoose(HeaderTitleDescription, _BuildingBlock);
    var _proto = HeaderTitleDescription.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.content = this.createContent();
      }
    };
    _proto.getTitleControl = function getTitleControl(dataModelObjectPath, headerInfo, owner) {
      if (headerInfo.Title && !isReferencePropertyStaticallyHidden(headerInfo.Title)) {
        return _jsx(Title, {
          text: getTitleBindingExpression(dataModelObjectPath, getTextBindingExpression, undefined, headerInfo, owner?.getRootController()?.getView().getViewData() || {}),
          wrapping: true,
          level: TitleLevel.H2,
          layoutData: _jsx(FlexItemData, {
            minWidth: "0"
          })
        });
      }
    };
    _proto.getDescription = function getDescription(dataModelObjectPath, headerInfo) {
      if (headerInfo.Description && !isReferencePropertyStaticallyHidden(headerInfo.Description)) {
        return _jsx(Label, {
          text: HeaderHelper.getDescriptionExpression(dataModelObjectPath, headerInfo),
          wrapping: true
        });
      }
    };
    _proto.createContent = function createContent() {
      const owner = this._getOwner();
      const dataModelObjectPath = this.getDataModelObjectPath(owner?.preprocessorContext?.fullContextPath);
      const headerInfo = dataModelObjectPath?.targetEntityType?.annotations?.UI?.HeaderInfo;
      if (headerInfo && (headerInfo.Title || headerInfo.Description)) {
        return _jsxs(VBox, {
          renderType: this.VBoxType,
          layoutData: _jsx(FlexItemData, {
            minWidth: "0"
          }),
          children: [this.getTitleControl(dataModelObjectPath, headerInfo, owner), this.getDescription(dataModelObjectPath, headerInfo)]
        });
      }
    };
    return HeaderTitleDescription;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "VBoxType", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return FlexRendertype.Div;
    }
  }), _class2)) || _class);
  _exports = HeaderTitleDescription;
  return _exports;
}, false);
//# sourceMappingURL=HeaderTitleDescription-dbg.js.map

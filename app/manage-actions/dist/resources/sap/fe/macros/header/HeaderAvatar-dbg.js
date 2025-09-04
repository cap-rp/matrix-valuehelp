/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/TitleHelper", "sap/m/Avatar", "sap/m/AvatarImageFitType", "sap/m/AvatarSize", "sap/m/LightBox", "sap/m/LightBoxItem", "../field/FieldTemplating", "./HeaderHelper", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, TitleHelper, Avatar, AvatarImageFitType, AvatarSize, LightBox, LightBoxItem, FieldTemplating, HeaderHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var getTextBindingExpression = FieldTemplating.getTextBindingExpression;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create avatar in the object page header
   * @private
   */
  let HeaderAvatar = (_dec = defineUI5Class("sap.fe.macros.header.HeaderAvatar"), _dec2 = property({
    type: "string",
    isBindingInfo: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function HeaderAvatar(settings, others) {
      var _this;
      _this = _BuildingBlock.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "src", _descriptor, _this);
      _initializerDefineProperty(_this, "initials", _descriptor2, _this);
      _initializerDefineProperty(_this, "fallbackIcon", _descriptor3, _this);
      _initializerDefineProperty(_this, "displayShape", _descriptor4, _this);
      _this.content = _this.createContent();
      return _this;
    }
    _exports = HeaderAvatar;
    _inheritsLoose(HeaderAvatar, _BuildingBlock);
    var _proto = HeaderAvatar.prototype;
    _proto.createContent = function createContent() {
      if (!this.src) {
        return;
      }
      const owner = this._getOwner();
      const dataModelObjectPath = this.getDataModelObjectPath(owner?.preprocessorContext?.fullContextPath);
      const headerInfo = dataModelObjectPath?.targetEntityType?.annotations?.UI?.HeaderInfo;
      const avatar = _jsx(Avatar, {
        src: this.src,
        initials: this.initials,
        fallbackIcon: this.fallbackIcon,
        displayShape: this.displayShape,
        displaySize: AvatarSize.S,
        imageFitType: AvatarImageFitType.Cover,
        children: {
          detailBox: _jsx(LightBox, {
            children: _jsx(LightBoxItem, {
              imageSrc: this.src,
              title: getTitleBindingExpression(dataModelObjectPath, getTextBindingExpression, undefined, headerInfo, owner?.getRootController()?.getView().getViewData() || {}),
              subtitle: HeaderHelper.getDescriptionExpression(dataModelObjectPath, headerInfo)
            })
          })
        }
      });
      avatar.addStyleClass("sapUiSmallMarginEnd");
      return avatar;
    };
    return HeaderAvatar;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "src", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "initials", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fallbackIcon", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "displayShape", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = HeaderAvatar;
  return _exports;
}, false);
//# sourceMappingURL=HeaderAvatar-dbg.js.map

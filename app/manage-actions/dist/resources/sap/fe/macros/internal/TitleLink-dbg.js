/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Link", "sap/m/Title", "sap/m/library", "sap/ui/core/InvisibleText", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, Link, Title, library, InvisibleText, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var LinkAccessibleRole = library.LinkAccessibleRole;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create title for all the micro charts
   * @private
   */
  let TitleLink = (_dec = defineUI5Class("sap.fe.macros.internal.TitleLink"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "string",
    isBindingInfo: true
  }), _dec6 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function TitleLink(settings, others) {
      var _this;
      _this = _BuildingBlock.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "text", _descriptor2, _this);
      _initializerDefineProperty(_this, "showAsLink", _descriptor3, _this);
      _initializerDefineProperty(_this, "linkAriaText", _descriptor4, _this);
      _initializerDefineProperty(_this, "linkPress", _descriptor5, _this);
      return _this;
    }
    _exports = TitleLink;
    _inheritsLoose(TitleLink, _BuildingBlock);
    var _proto = TitleLink.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    }

    /**
     * Setter for the showAsLink property.
     * @param showAsLink
     */;
    _proto.setShowAsLink = function setShowAsLink(showAsLink) {
      if (showAsLink !== this.showAsLink) {
        this.setProperty("showAsLink", showAsLink);
        this.content = this.createContent();
      }
    }

    /**
     * The building block render function.
     * @returns Title which will contain link or not based on showAsLink value.
     */;
    _proto.createContent = function createContent() {
      let link;
      if (this.showAsLink) {
        link = _jsx(Link, {
          text: this.text,
          press: pressEvent => {
            this.fireEvent("linkPress", pressEvent);
          },
          accessibleRole: LinkAccessibleRole.Button
        });
        if (this.linkAriaText) {
          const invisibleText = _jsx(InvisibleText, {
            text: this.linkAriaText
          });
          link.addAriaDescribedBy(invisibleText);
        }
      }
      return _jsx(Title, {
        level: "H3",
        text: this.text,
        children: {
          content: link
        }
      });
    };
    return TitleLink;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showAsLink", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "linkAriaText", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "linkPress", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TitleLink;
  return _exports;
}, false);
//# sourceMappingURL=TitleLink-dbg.js.map

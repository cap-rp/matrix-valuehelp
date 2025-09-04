/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/templating/SemanticObjectHelper", "sap/m/Link", "sap/m/Text", "sap/m/library", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, SemanticObjectHelper, Link, Text, library, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
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
  let TextLink = (_dec = defineUI5Class("sap.fe.macros.controls.TextLink"), _dec2 = property({
    type: "boolean",
    defaultValue: false
  }), _dec3 = property({
    type: "string",
    required: false
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "string",
    required: false
  }), _dec6 = property({
    type: "string",
    required: false
  }), _dec7 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function TextLink(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "showAsLink", _descriptor, _this);
      _initializerDefineProperty(_this, "semanticObject", _descriptor2, _this);
      _initializerDefineProperty(_this, "wrapping", _descriptor3, _this);
      _initializerDefineProperty(_this, "text", _descriptor4, _this);
      _initializerDefineProperty(_this, "emptyIndicatorMode", _descriptor5, _this);
      _initializerDefineProperty(_this, "press", _descriptor6, _this);
      _this.updateContent();
      return _this;
    }

    /**
     * Setter for the semanticObject property.
     * @param semanticObject
     */
    _exports = TextLink;
    _inheritsLoose(TextLink, _BuildingBlock);
    var _proto = TextLink.prototype;
    _proto.setSemanticObject = function setSemanticObject(semanticObject) {
      if (semanticObject) {
        let semanticObjectsList = [];
        this.semanticObject = semanticObject;
        const availableSemanticObjectsToUser = this.getModel("internal")?.getObject("/semanticObjects") ?? [];
        semanticObjectsList = semanticObject.startsWith("[") ? JSON.parse(semanticObject) : [semanticObject];
        this.setShowAsLink(SemanticObjectHelper.getReachableSemanticObjectsSettings(availableSemanticObjectsToUser, {
          semanticObjectsList: semanticObjectsList,
          semanticObjectsExpressionList: [],
          qualifierMap: {}
        }).hasReachableStaticSemanticObject);
      }
    }

    /**
     * Setter for the showAsLink property.
     * @param showAsLink
     */;
    _proto.setShowAsLink = function setShowAsLink(showAsLink) {
      if (showAsLink !== this.showAsLink) {
        this.setProperty("showAsLink", showAsLink);
        this.updateContent();
      }
    }

    /**
     * Setter for the text property.
     * @param text
     */;
    _proto.setText = function setText(text) {
      // in case the text is set after the inner control creation we need to forward it
      this.setProperty("text", text);
      this.content?.setText(text);
    };
    _proto.createContent = function createContent() {
      if (this.showAsLink === true) {
        return _jsx(Link, {
          text: this.text,
          wrapping: this.wrapping,
          emptyIndicatorMode: this.emptyIndicatorMode,
          press: pressEvent => {
            this.fireEvent("press", pressEvent);
          },
          accessibleRole: LinkAccessibleRole.Button
        });
      } else {
        return _jsx(Text, {
          text: this.text,
          wrapping: this.wrapping,
          emptyIndicatorMode: this.emptyIndicatorMode
        });
      }
    };
    _proto.updateContent = function updateContent() {
      if (this.content) {
        this.content.destroy();
      }
      this.content = this.createContent();
    };
    return TextLink;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "showAsLink", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "wrapping", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "emptyIndicatorMode", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "press", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TextLink;
  return _exports;
}, false);
//# sourceMappingURL=TextLink-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/RichTextEditor", "sap/fe/macros/field/FieldTemplating"], function (ClassSupport, RichTextEditorBlock, FieldTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var getValueBinding = FieldTemplating.getValueBinding;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Metadata-driven building block that exposes the RichTextEditor UI5 control.
   *
   * It's used to enter formatted text and uses the third-party component called TinyMCE.
   * @public
   * @since 1.117.0
   */
  let RichTextEditorWithMetadata = (_dec = defineUI5Class("sap.fe.macros.RichTextEditorWithMetadata"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string",
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RichTextEditorBlock) {
    function RichTextEditorWithMetadata(properties, others) {
      var _this;
      _this = _RichTextEditorBlock.call(this, properties, others) || this;
      /**
       * The metaPath of the displayed property
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor, _this);
      /**
       * The context path of the property displayed
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      return _this;
    }
    _exports = RichTextEditorWithMetadata;
    _inheritsLoose(RichTextEditorWithMetadata, _RichTextEditorBlock);
    var _proto = RichTextEditorWithMetadata.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      const involvedDataModelObjects = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (involvedDataModelObjects) {
        this.value = getValueBinding(involvedDataModelObjects, {});
      }
      _RichTextEditorBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
    };
    return RichTextEditorWithMetadata;
  }(RichTextEditorBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = RichTextEditorWithMetadata;
  return _exports;
}, false);
//# sourceMappingURL=RichTextEditorWithMetadata-dbg.js.map

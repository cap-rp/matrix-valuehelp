/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Additional format options for the field.
   * @alias sap.fe.macros.field.FieldFormatOptions
   * @public
   */
  let FieldFormatOptions = (_dec = defineUI5Class("sap.fe.macros.field.FieldFormatOptions"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "int"
  }), _dec5 = property({
    type: "int"
  }), _dec6 = property({
    type: "int"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "int"
  }), _dec9 = property({
    type: "boolean"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "boolean"
  }), _dec12 = property({
    type: "string",
    allowedValues: ["RadioButtons"]
  }), _dec13 = property({
    type: "boolean"
  }), _dec14 = property({
    type: "string",
    allowedValues: ["short", "medium", "long", "full"]
  }), _dec15 = property({
    type: "string"
  }), _dec16 = property({
    type: "string"
  }), _dec17 = property({
    type: "boolean"
  }), _dec18 = property({
    type: "boolean"
  }), _dec19 = property({
    type: "boolean"
  }), _dec20 = property({
    type: "boolean"
  }), _dec21 = property({
    type: "boolean"
  }), _dec22 = property({
    type: "boolean"
  }), _dec23 = property({
    type: "string"
  }), _dec24 = property({
    type: "string"
  }), _dec25 = property({
    type: "boolean"
  }), _dec26 = property({
    type: "boolean"
  }), _dec27 = property({
    type: "string"
  }), _dec28 = property({
    type: "string"
  }), _dec29 = property({
    type: "string"
  }), _dec30 = property({
    type: "string"
  }), _dec31 = property({
    type: "boolean"
  }), _dec32 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function FieldFormatOptions(props, others) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, props, others) || this;
      /**
       * Defines how the field value and associated text will be displayed together.<br/>
       *
       * Allowed values are "Value", "Description", "DescriptionValue" and "ValueDescription"
       *  @public
       */
      _initializerDefineProperty(_this, "displayMode", _descriptor, _this);
      /**
       * Defines if and how the field measure will be displayed.<br/>
       *
       * Allowed values are "Hidden" and "ReadOnly"
       *  @public
       */
      _initializerDefineProperty(_this, "measureDisplayMode", _descriptor2, _this);
      /**
       * Maximum number of lines for multiline texts in edit mode.<br/>
       *  @public
       */
      _initializerDefineProperty(_this, "textLinesEdit", _descriptor3, _this);
      /**
       * Maximum number of lines that multiline texts in edit mode can grow to.<br/>
       *  @public
       */
      _initializerDefineProperty(_this, "textMaxLines", _descriptor4, _this);
      /**
       * Maximum number of characters from the beginning of the text field that are shown initially.<br/>
       *  @public
       */
      _initializerDefineProperty(_this, "textMaxCharactersDisplay", _descriptor5, _this);
      /**
       * Defines how the full text will be displayed.<br/>
       *
       * Allowed values are "InPlace" and "Popover"
       *  @public
       */
      _initializerDefineProperty(_this, "textExpandBehaviorDisplay", _descriptor6, _this);
      /**
       * Defines the maximum number of characters for the multiline text value.<br/>
       *
       * If a multiline text exceeds the maximum number of allowed characters, the counter below the input field displays the exact number.
       *  @public
       */
      _initializerDefineProperty(_this, "textMaxLength", _descriptor7, _this);
      /**
       * Defines if the date part of a date time with timezone field should be shown. <br/>
       *
       * The dateTimeOffset field must have a timezone annotation.
       *
       * The default value is true.
       *  @public
       */
      _initializerDefineProperty(_this, "showDate", _descriptor8, _this);
      /**
       * Defines if the time part of a date time with timezone field should be shown. <br/>
       *
       * The dateTimeOffset field must have a timezone annotation.
       *
       * The default value is true.
       *  @public
       */
      _initializerDefineProperty(_this, "showTime", _descriptor9, _this);
      /**
       * Defines if the timezone part of a date time with timezone field should be shown. <br/>
       *
       * The dateTimeOffset field must have a timezone annotation.
       *
       * The default value is true.
       *  @public
       */
      _initializerDefineProperty(_this, "showTimezone", _descriptor10, _this);
      /**
       * Determines how the field should be rendered, e.g. as radio buttons. <br/>
       * If not all prerequisites are met, the field will default back to the standard rendering.
       *  @public
       */
      _initializerDefineProperty(_this, "fieldEditStyle", _descriptor11, _this);
      /**
       * Specifies if radio buttons should be rendered in a horizontal layout. <br/>
       *  @public
       */
      _initializerDefineProperty(_this, "radioButtonsHorizontalLayout", _descriptor12, _this);
      /**
       * Property for defining the display style for the date, time, or dateTime format. <br/>
       * If there is a dateTimePattern defined dateTimeStyle is ignored.
       * @public
       */
      _initializerDefineProperty(_this, "dateTimeStyle", _descriptor13, _this);
      /**
       * Property for defining a custom pattern for the date, time, or dateTime format. <br/>
       * If there is a dateTimePattern defined dateTimeStyle is ignored.
       * @public
       */
      _initializerDefineProperty(_this, "dateTimePattern", _descriptor14, _this);
      // internal properties
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "fieldMode", _descriptor15, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "hasDraftIndicator", _descriptor16, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "isAnalytics", _descriptor17, _this);
      /**
       * If true and if the field is part of an inactive row, then a check will be done to determine if the underlying property has a non-insertable restriction
       * @private
       */
      _initializerDefineProperty(_this, "forInlineCreationRows", _descriptor18, _this);
      /**
       * If true then the navigationavailable property will not be used for the enablement of the IBN button
       * @private
       */
      _initializerDefineProperty(_this, "ignoreNavigationAvailable", _descriptor19, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "isCurrencyOrUnitAligned", _descriptor20, _this);
      /**
       * Enables the fallback feature for the usage of the text annotation from the value lists
       * @private
       */
      _initializerDefineProperty(_this, "retrieveTextFromValueList", _descriptor21, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "semantickeys", _descriptor22, _this);
      /**
       * Preferred control to visualize semantic key properties
       * @private
       */
      _initializerDefineProperty(_this, "semanticKeyStyle", _descriptor23, _this);
      /**
       * If set to 'true', SAP Fiori elements shows an empty indicator in display mode for the text and links
       * @private
       */
      _initializerDefineProperty(_this, "showEmptyIndicator", _descriptor24, _this);
      /**
       * If true then sets the given icon instead of text in Action/IBN Button
       * @private
       */
      _initializerDefineProperty(_this, "showIconUrl", _descriptor25, _this);
      /**
       * Describes how the alignment works between Table mode (Date and Numeric End alignment) and Form mode (numeric aligned End in edit and Begin in display)
       * @private
       */
      _initializerDefineProperty(_this, "textAlignMode", _descriptor26, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "compactSemanticKey", _descriptor27, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "fieldGroupDraftIndicatorPropertyPath", _descriptor28, _this);
      /**
       *
       * @private
       */
      _initializerDefineProperty(_this, "fieldGroupName", _descriptor29, _this);
      /**
       * Describes if this field is part of an analytical table aggregated row
       * @private
       */
      _initializerDefineProperty(_this, "isAnalyticalAggregatedRow", _descriptor30, _this);
      _initializerDefineProperty(_this, "showOnlyUnitDecimals", _descriptor31, _this);
      return _this;
    }
    _exports = FieldFormatOptions;
    _inheritsLoose(FieldFormatOptions, _BuildingBlockObjectP);
    return FieldFormatOptions;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "measureDisplayMode", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "textLinesEdit", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "textMaxLines", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "textMaxCharactersDisplay", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "textExpandBehaviorDisplay", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "textMaxLength", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "showDate", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "showTime", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "showTimezone", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "fieldEditStyle", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "radioButtonsHorizontalLayout", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "dateTimeStyle", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "dateTimePattern", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "fieldMode", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "hasDraftIndicator", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "isAnalytics", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "forInlineCreationRows", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "ignoreNavigationAvailable", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "isCurrencyOrUnitAligned", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "retrieveTextFromValueList", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "semantickeys", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "semanticKeyStyle", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "showEmptyIndicator", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "showIconUrl", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "textAlignMode", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "compactSemanticKey", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "fieldGroupDraftIndicatorPropertyPath", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "fieldGroupName", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "isAnalyticalAggregatedRow", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "showOnlyUnitDecimals", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FieldFormatOptions;
  return _exports;
}, false);
//# sourceMappingURL=FieldFormatOptions-dbg.js.map

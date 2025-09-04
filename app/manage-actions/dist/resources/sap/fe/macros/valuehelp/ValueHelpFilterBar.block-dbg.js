/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/TemplateModel", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar"], function (TemplateModel, BuildingBlockSupport, BuildingBlockTemplatingBase, MetaModelConverter, FilterBar) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
  var _exports = {};
  var getSelectionFields = FilterBar.getSelectionFields;
  var getExpandFilterFields = FilterBar.getExpandFilterFields;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a FilterBar based on the metadata provided by OData V4 for the value help dialog.
   * @private
   */
  let ValueHelpFilterBarBlock = (_dec = defineBuildingBlock({
    name: "ValueHelpFilterBar",
    namespace: "sap.fe.macros.valuehelp",
    fragment: "sap.fe.macros.valuehelp.ValueHelpFilterBar"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "boolean"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "sap.ui.mdc.FilterBarP13nMode[]"
  }), _dec8 = blockAttribute({
    type: "boolean"
  }), _dec9 = blockAttribute({
    type: "boolean"
  }), _dec10 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec11 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec12 = blockAttribute({
    type: "string"
  }), _dec13 = blockAttribute({
    type: "boolean"
  }), _dec14 = blockAttribute({
    type: "boolean"
  }), _dec15 = blockEvent(), _dec16 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function ValueHelpFilterBarBlock(props, controlConfiguration, settings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props) || this;
      /**
       * ID of the FilterBar
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _this);
      /**
       * Don't show the basic search field
       */
      _initializerDefineProperty(_this, "hideBasicSearch", _descriptor4, _this);
      /**
       * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
       */
      _initializerDefineProperty(_this, "enableFallback", _descriptor5, _this);
      /**
       * Specifies the personalization options for the filter bar.
       */
      _initializerDefineProperty(_this, "p13nMode", _descriptor6, _this);
      /**
       * Specifies the Sematic Date Range option for the filter bar.
       */
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor7, _this);
      /**
       * If set the search will be automatically triggered, when a filter value was changed.
       */
      _initializerDefineProperty(_this, "liveMode", _descriptor8, _this);
      /**
       * Temporary workaround only
       * path to valuelist
       */
      _initializerDefineProperty(_this, "_valueList", _descriptor9, _this);
      /**
       * selectionFields to be displayed
       */
      _initializerDefineProperty(_this, "selectionFields", _descriptor10, _this);
      /**
       * Filter conditions to be applied to the filter bar
       */
      _initializerDefineProperty(_this, "filterConditions", _descriptor11, _this);
      /**
       * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
       * a search is triggered immediately if one or more search requests have been triggered in the meantime
       * but were ignored based on the setting.
       */
      _initializerDefineProperty(_this, "suspendSelection", _descriptor12, _this);
      /**
       * Determines whether the Show/Hide Filters button is in the state show or hide.
       */
      _initializerDefineProperty(_this, "expandFilterFields", _descriptor13, _this);
      /**
       * Search handler name
       */
      _initializerDefineProperty(_this, "search", _descriptor14, _this);
      /**
       * Filters changed handler name
       */
      _initializerDefineProperty(_this, "filterChanged", _descriptor15, _this);
      const metaModel = _this.contextPath.getModel();
      const metaPathContext = _this.metaPath;
      const metaPathPath = metaPathContext?.getPath();
      const dataModelObjectPath = getInvolvedDataModelObjects(_this.contextPath);
      const converterContext = _this.getConverterContext(dataModelObjectPath, undefined, settings);
      if (!_this.selectionFields) {
        const selectionFields = getSelectionFields(converterContext, [], metaPathPath).selectionFields;
        _this.selectionFields = new TemplateModel(selectionFields, metaModel).createBindingContext("/");
      }
      const targetEntitySet = dataModelObjectPath.targetEntitySet; // It could be a singleton but the annotaiton are not defined there (yet?)
      _this.expandFilterFields = getExpandFilterFields(converterContext, targetEntitySet.annotations.Capabilities?.FilterRestrictions, _this._valueList);
      return _this;
    }
    _exports = ValueHelpFilterBarBlock;
    _inheritsLoose(ValueHelpFilterBarBlock, _BuildingBlockTemplat);
    return ValueHelpFilterBarBlock;
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hideBasicSearch", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enableFallback", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "p13nMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return [];
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_valueList", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "selectionFields", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "filterConditions", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "suspendSelection", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "expandFilterFields", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ValueHelpFilterBarBlock;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelpFilterBar.block-dbg.js.map

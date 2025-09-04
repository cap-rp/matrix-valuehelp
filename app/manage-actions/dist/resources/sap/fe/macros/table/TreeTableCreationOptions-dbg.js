/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Create options for the tree table.
   * @public
   */
  let TreeTableCreationOptions = (_dec = defineUI5Class("sap.fe.macros.table.TreeTableCreationOptions"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "object"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function TreeTableCreationOptions(settings) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, settings) || this;
      /**
       * Defines the creation mode to be used by the tree table.
       *
       * Allowed values are `NewPage`, `Inline` or `CreationDialog`.<br/>
       * <br/>
       * NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async' or 'Deferred' is used.<br/>
       * Inline - the creation is done inline.<br/>
       * CreationDialog - the creation is done in the table, with a dialog allowing to specify some initial property values (the properties are listed in `creationFields`).<br/>
       *
       * If not set with any value:<br/>
       * if navigation is defined, the default value is 'NewPage'. Otherwise it is 'Inline'.
       * @public
       */
      _initializerDefineProperty(_this, "name", _descriptor, _this);
      /**
       * Defines the list of properties that will be displayed in the creation dialog, when the creation mode is set to 'CreationDialog'.<br/>
       * The value is a comma-separated list of property names.
       * @public
       */
      _initializerDefineProperty(_this, "creationFields", _descriptor2, _this);
      /**
       * Defines the nodes to be added on the custom create.
       *
       * This object must have the following properties:
       * propertyName: the name of the property on the page entity set used to categorize the node type to be created within the hierarchy<br/>
       * values: an array of key, label and an optional creationFields that define a value of the property defined by the propertyName key, its label, and the specific fields to be shown in the creation dialog.<br/>
       * @public
       */
      _initializerDefineProperty(_this, "nodeType", _descriptor3, _this);
      /**
       * Defines the extension point to control the enablement of the Create button or Create Menu buttons.<br/>
       * @public
       */
      _initializerDefineProperty(_this, "isCreateEnabled", _descriptor4, _this);
      /**
       * Specifies if the new entry should be placed at the position computed by the backend (e.g. taking sorting into account).<br/>
       * The default value is 'false' (that is, the new entry is placed as the first child below its parent).
       * @public
       */
      _initializerDefineProperty(_this, "createInPlace", _descriptor5, _this);
      return _this;
    }
    _exports = TreeTableCreationOptions;
    _inheritsLoose(TreeTableCreationOptions, _BuildingBlockObjectP);
    return TreeTableCreationOptions;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "creationFields", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "nodeType", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "isCreateEnabled", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "createInPlace", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TreeTableCreationOptions;
  return _exports;
}, false);
//# sourceMappingURL=TreeTableCreationOptions-dbg.js.map

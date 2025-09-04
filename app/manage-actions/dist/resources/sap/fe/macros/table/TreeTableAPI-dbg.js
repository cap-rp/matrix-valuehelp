/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "./TableAPI", "./TreeTableCreationOptions"], function (ClassSupport, TableAPI, TreeTableCreationOptions) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let TreeTableAPI = (_dec = defineUI5Class("sap.fe.macros.table.TreeTableAPI", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = aggregation({
    type: "sap.fe.macros.table.TreeTableCreationOptions",
    defaultClass: TreeTableCreationOptions
  }), _dec8 = property({
    type: "string",
    allowedValues: ["TreeTable"]
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_TableAPI) {
    function TreeTableAPI(mSettings) {
      var _this;
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      _this = _TableAPI.call(this, mSettings, ...others) || this;
      /**
       * The hierarchy qualifier used in the RecursiveHierarchy annotation.
       */
      _initializerDefineProperty(_this, "hierarchyQualifier", _descriptor, _this);
      /**
       * Defines the extension point to control whether a source node can be dropped on a specific parent node.<br/>
       */
      _initializerDefineProperty(_this, "isMoveToPositionAllowed", _descriptor2, _this);
      /**
       * Defines the extension point to control whether a source node can be copied to a specific parent node.<br/>
       */
      _initializerDefineProperty(_this, "isCopyToPositionAllowed", _descriptor3, _this);
      /**
       * Defines the extension point to control if a node can be dragged.<br/>
       */
      _initializerDefineProperty(_this, "isNodeMovable", _descriptor4, _this);
      /**
       * Defines the extension point to control whether a node can be copied.<br/>
       */
      _initializerDefineProperty(_this, "isNodeCopyable", _descriptor5, _this);
      /**
       * A set of options that can be configured.
       */
      _initializerDefineProperty(_this, "creationMode", _descriptor6, _this);
      _initializerDefineProperty(_this, "type", _descriptor7, _this);
      return _this;
    }

    /**
     * Add tree-specific settings in the manifest.
     * @returns Settings
     */
    _inheritsLoose(TreeTableAPI, _TableAPI);
    var _proto = TreeTableAPI.prototype;
    _proto.getSettingsForManifest = function getSettingsForManifest() {
      const tableSettings = _TableAPI.prototype.getSettingsForManifest.call(this);
      TableAPI.addSetting(tableSettings, "type", "TreeTable");
      TableAPI.addSetting(tableSettings, "hierarchyQualifier", this.hierarchyQualifier);
      TableAPI.addSetting(tableSettings, "isMoveToPositionAllowed", this.isMoveToPositionAllowed);
      TableAPI.addSetting(tableSettings, "isCopyToPositionAllowed", this.isCopyToPositionAllowed);
      TableAPI.addSetting(tableSettings, "isNodeMovable", this.isNodeMovable);
      TableAPI.addSetting(tableSettings, "isNodeCopyable", this.isNodeCopyable);
      const creationMode = tableSettings["creationMode"] ?? {};
      TableAPI.addSetting(creationMode, "createInPlace", this.creationMode?.createInPlace);
      if (this.creationMode?.nodeType) {
        //Values is passed as Array into the XML but in the manifest it is a dictionary
        // so we need to transform the array into a dictionary
        TableAPI.addSetting(creationMode, "nodeType", {
          propertyName: this.creationMode.nodeType.propertyName,
          values: Object.assign({}, ...(this.creationMode.nodeType.values ?? []).map(value => ({
            [value.key]: {
              label: value.label,
              creationFields: value.creationFields
            }
          })))
        });
      }
      TableAPI.addSetting(creationMode, "isCreateEnabled", this.creationMode?.isCreateEnabled);
      if (Object.entries(creationMode).length > 0) {
        tableSettings["creationMode"] = creationMode;
      }
      return tableSettings;
    };
    return TreeTableAPI;
  }(TableAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "hierarchyQualifier", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "isMoveToPositionAllowed", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "isCopyToPositionAllowed", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "isNodeMovable", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isNodeCopyable", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "creationMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "TreeTable";
    }
  }), _class2)) || _class);
  return TreeTableAPI;
}, false);
//# sourceMappingURL=TreeTableAPI-dbg.js.map

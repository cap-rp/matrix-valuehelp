/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/StableIdHelper", "sap/ui/fl/variants/VariantManagement"], function (Log, ClassSupport, BuildingBlock, StableIdHelper, VariantManagementControl) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var generate = StableIdHelper.generate;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a Variant Management based on the metadata provided by OData V4.
   *
   * Usage example:
   * <pre>
   * &lt;macro:VariantManagement
   * id="SomeUniqueIdentifier"
   * for="{listOfControlIds&gt;}"
   * /&gt;
   * </pre>
   *
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarVMWithTable Overview of Building Blocks}
   * @classdesc A custom UI5 class for managing variants in applications.
   * Extends the base `BuildingBlock` class and provides additional properties
   * such as `id`, `for`, `showSetAsDefault`, and `headerLevel` to configure variant management behavior.
   *
   * @public
   */
  let VariantManagement = (_dec = defineUI5Class("sap.fe.macros.VariantManagement"), _dec2 = property({
    type: "any",
    required: true
  }), _dec3 = association({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec4 = property({
    type: "boolean",
    defaultValue: true
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function VariantManagement(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * Identifier for the variant management control.
       * @type {string | undefined}
       * @public
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * A list of control IDs to which the variant management is applied.
       * @type {string[]}
       * @public
       */
      _initializerDefineProperty(_this, "for", _descriptor2, _this);
      /**
       * Whether the "Set as Default" option is visible.
       * @type {boolean | undefined}
       * @default true
       * @public
       */
      _initializerDefineProperty(_this, "showSetAsDefault", _descriptor3, _this);
      /**
       * Header level for the variant management, determining its position or style.
       * @type {string | undefined}
       * @public
       */
      _initializerDefineProperty(_this, "headerLevel", _descriptor4, _this);
      return _this;
    }
    _exports.VariantManagement = VariantManagement;
    _inheritsLoose(VariantManagement, _BuildingBlock);
    var _proto = VariantManagement.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.content = this.createContent();
      const availableIds = this.getAssociation("for", null) || [];
      this.connectToFilterbar(Array.isArray(availableIds) ? availableIds : [availableIds]);
    }

    /**
     * Create and configure the VariantManagement control content.
     * @returns The VariantManagement control.
     */;
    _proto.createContent = function createContent() {
      const variantManagementContent = new VariantManagementControl({
        id: generate([this.id, "VM"]),
        for: this.for,
        showSetAsDefault: this.showSetAsDefault,
        headerLevel: this.headerLevel
      });
      this.setAggregation("content", variantManagementContent);
      return variantManagementContent;
    }

    /**
     * Connects the variant management component to a list of filter bar controls.
     * @param filterBarIds The unique identifiers of the filter bar controls to connect with.
     * @throws {Error} Logs an error message if the connection to any filter bar control fails.
     */;
    _proto.connectToFilterbar = function connectToFilterbar(filterBarIds) {
      const ids = Array.isArray(filterBarIds) ? filterBarIds : [filterBarIds];
      ids.forEach(controlId => {
        try {
          BuildingBlock.observeBuildingBlock(controlId, {
            onAvailable: control => {
              if (control && control.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
                const vm = this.getContent();
                if (vm) {
                  control.setVariantBackReference(vm);
                }
              }
            }
          });
        } catch (error) {
          Log.error(`Error setting variant in Filter Bar: ${error}`);
        }
      });
    };
    return VariantManagement;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "for", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return [];
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showSetAsDefault", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports.VariantManagement = VariantManagement;
  return VariantManagement;
}, false);
//# sourceMappingURL=VariantManagement-dbg.js.map

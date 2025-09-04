/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/macros/controls/BuildingBlockWithTemplating", "sap/fe/macros/table/TreeTable.block", "sap/m/FlexItemData"], function (ClassSupport, BuildingBlockSupport, BuildingBlockWithTemplating, TreeTableBlock, FlexItemData) {
  "use strict";

  var _dec, _dec2, _class, _class2;
  var _exports = {};
  var convertBuildingBlockMetadata = BuildingBlockSupport.convertBuildingBlockMetadata;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Building block used to create a table based on the metadata provided by OData V4.
   * <br>
   * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
   * <br>
   * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
   * <br>
   * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
   *
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/table/TreeTable"], function(TreeTable) {
   * 	 ...
   * 	 new TreeTable("myTable", {metaPath:"@com.sap.vocabularies.UI.v1.LineItem"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the Table that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @experimental
   * @since 1.125.0
   * @mixes sap.fe.macros.TreeTable
   */
  let TreeTable = (_dec = defineUI5Class("sap.fe.macros.table.TreeTable", convertBuildingBlockMetadata(TreeTableBlock)), _dec2 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockWithTem) {
    function TreeTable(props, others) {
      var _this;
      _this = _BuildingBlockWithTem.call(this, props, others) || this;
      _this.createProxyMethods(["getSelectedContexts", "addMessage", "removeMessage", "refresh", "getPresentationVariant", "setPresentationVariant", "getCurrentVariantKey", "setCurrentVariantKey", "getSelectionVariant", "setSelectionVariant"]);
      return _this;
    }
    _exports = TreeTable;
    _inheritsLoose(TreeTable, _BuildingBlockWithTem);
    var _proto = TreeTable.prototype;
    _proto._fireEvent = function _fireEvent(ui5Event, _controller, eventId) {
      this.fireEvent(eventId, ui5Event.getParameters());
    };
    _proto.getLayoutData = function getLayoutData() {
      return new FlexItemData({
        maxWidth: "100%"
      });
    }

    /**
     * Sets the path to the metadata that should be used to generate the table.
     * @param metaPath The path to the metadata
     * @returns Reference to this in order to allow method chaining
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.setMetaPath = function setMetaPath(metaPath) {
      return this.setProperty("metaPath", metaPath);
    }

    /**
     * Gets the path to the metadata that should be used to generate the table.
     * @returns The path to the metadata
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.getMetaPath = function getMetaPath() {
      return this.getProperty("metaPath");
    }

    /**
     * Sets the fields that should be ignored when generating the table.
     * @param ignoredFields The fields to ignore
     * @returns Reference to this in order to allow method chaining
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.setIgnoredFields = function setIgnoredFields(ignoredFields) {
      return this.setProperty("ignoredFields", ignoredFields);
    }

    /**
     * Get the fields that should be ignored when generating the table.
     * @returns The value of the ignoredFields property
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.getIgnoredFields = function getIgnoredFields() {
      return this.getProperty("ignoredFields");
    }

    /**
     * Adds a column to the table.
     * @param column The column to add
     * @returns Reference to this in order to allow method chaining
     * @experimental
     * @since 1.124.0
     * @public
     */;
    _proto.addColumn = function addColumn(column) {
      return this.addAggregation("columns", column);
    }

    /**
     * Removes a column from the table.
     * @param column The column to remove, or its index or ID
     * @returns The removed column or null
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.removeColumn = function removeColumn(column) {
      return this.removeAggregation("columns", column);
    }

    /**
     * Adds an action to the table.
     * @param action The action to add
     * @returns Reference to this in order to allow method chaining
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.addAction = function addAction(action) {
      return this.addAggregation("actions", action);
    }

    /**
     * Removes an action from the table.
     * @param action The action to remove, or its index or ID
     * @returns The removed action or null
     * @experimental
     * @since 1.125.0
     * @public
     */;
    _proto.removeAction = function removeAction(action) {
      return this.removeAggregation("actions", action);
    };
    _proto.createContent = async function createContent(owner) {
      const shouldRebind = this.content?.content.getRowBinding()?.getCurrentContexts().length > 0;
      await _BuildingBlockWithTem.prototype.createContent.call(this, owner);
      if (shouldRebind) {
        this.content?.content.rebind?.();
      }
    };
    return TreeTable;
  }(BuildingBlockWithTemplating), _applyDecoratedDescriptor(_class2.prototype, "_fireEvent", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "_fireEvent"), _class2.prototype), _class2)) || _class);
  _exports = TreeTable;
  return _exports;
}, false);
//# sourceMappingURL=TreeTable-dbg.js.map

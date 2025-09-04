/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/table/Utils", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/m/Select", "sap/ui/core/InvisibleText", "sap/ui/core/Item", "sap/fe/base/jsx-runtime/jsx"], function (Log, BindingToolkit, ClassSupport, CommonUtils, BuildingBlock, MetaModelConverter, StableIdHelper, TypeGuards, DataModelPathHelper, TableUtils, SegmentedButton, SegmentedButtonItem, Select, InvisibleText, Item, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var generate = StableIdHelper.generate;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Definition of the quickVariantSelection to be used inside the table.
   */
  let QuickFilterSelector = (_dec = defineUI5Class("sap.fe.macros.table.QuickFilterSelector"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string[]"
  }), _dec4 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function QuickFilterSelector(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Defines the list of paths pointing to the selection variants that should be used as quick filters
       */
      _initializerDefineProperty(_this, "paths", _descriptor2, _this);
      /**
       * Defines whether the counts should be displayed next to the text
       */
      _initializerDefineProperty(_this, "showCounts", _descriptor3, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = QuickFilterSelector;
    _inheritsLoose(QuickFilterSelector, _BuildingBlock);
    var _proto = QuickFilterSelector.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.metaDataAvailable = true;
      if (!this.content && this.metaPath) {
        this.initializeContent();
      }
    }

    /**
     * Sets the metaPath.
     * @param metaPath The metaPath
     */;
    _proto.setMetaPath = function setMetaPath(metaPath) {
      this.metaPath = metaPath;
      if (!this.content && this.metaDataAvailable === true) {
        this.initializeContent();
      }
    }

    /**
     * Handler for the selection change event.
     */;
    _proto.onSelChange = function onSelChange() {
      const tableAPI = this.getMDCTable().getParent();
      if (tableAPI?.isA("sap.fe.macros.table.TableAPI")) {
        tableAPI.onQuickFilterSelectionChange();
      }
    }

    /**
     * Generates the selector as a SegmentedButton.
     * @param metaContext The meta context
     * @returns  The SegmentedButton
     */;
    _proto.getSegmentedButtonSelector = function getSegmentedButtonSelector(metaContext) {
      const items = this.paths.map((path, index) => {
        return _jsx(SegmentedButtonItem, {
          ...this.getSelectorItemProperties(index, metaContext)
        });
      });
      return _jsx(SegmentedButton, {
        id: `${this.id}-content`,
        enabled: notEqual(pathInModel("hasPendingFilters", "pageInternal"), true),
        ariaLabelledBy: [this.getSelectorAriaLabelledById()],
        selectionChange: this.onSelChange.bind(this),
        children: {
          items
        }
      });
    }

    /**
     * Generates the selector as a Select.
     * @param metaContext The meta context
     * @returns  The Select
     */;
    _proto.getSelectSelector = function getSelectSelector(metaContext) {
      const items = this.paths.map((path, index) => {
        return _jsx(Item, {
          ...this.getSelectorItemProperties(index, metaContext)
        });
      });
      return _jsx(Select, {
        id: `${this.id}-content`,
        enabled: notEqual(pathInModel("hasPendingFilters", "pageInternal"), true),
        ariaLabelledBy: [this.getSelectorAriaLabelledById()],
        autoAdjustWidth: true,
        change: this.onSelChange.bind(this),
        children: {
          items
        }
      });
    }

    /**
     * Gets the properties of the selector Item.
     * @param index The index of the item into the selector
     * @param metaContext The meta context
     * @returns  The properties
     */;
    _proto.getSelectorItemProperties = function getSelectorItemProperties(index, metaContext) {
      return {
        key: this.paths[index],
        text: this.getSelectorItemText(index, metaContext)
      };
    }

    /**
     * Generates the Id of the InvisibleText control.
     * @returns  The Id
     */;
    _proto.getSelectorAriaLabelledById = function getSelectorAriaLabelledById() {
      return generate([`${this.id}-content`, "AriaText"]);
    }

    /**
     * Generates the text for the selector item.
     * @param index The index of the item into the selector
     * @param metaContext The meta context
     * @returns  The text
     */;
    _proto.getSelectorItemText = function getSelectorItemText(index, metaContext) {
      const countText = ` ({internal>quickFilters/counts/${index}})`;
      const dataTableModelPath = getInvolvedDataModelObjects(metaContext);
      const selectionVariant = enhanceDataModelPath(dataTableModelPath, this.paths[index]).targetObject;
      const text = selectionVariant?.Text?.toString() ?? "";
      return `${text}${this.showCounts ? countText : ""}`;
    }

    /**
     * Registers the SideEffects control that must be executed when table cells that are related to configured filter(s) change.
     * @param metaPath The metaPath.
     * @param contextPath The contextPath.
     */;
    _proto.registerSideEffectForQuickFilter = function registerSideEffectForQuickFilter(metaPath, contextPath) {
      const dataVisualizationModelPath = getInvolvedDataModelObjects(metaPath, contextPath);
      const viewEntityType = dataVisualizationModelPath.contextLocation?.targetEntityType.fullyQualifiedName;
      const tableNavigationPath = getTargetNavigationPath(dataVisualizationModelPath, true);
      if (tableNavigationPath && viewEntityType) {
        const sourceProperties = new Set();
        for (const selectionVariantPath of this.paths) {
          const selectionVariant = enhanceDataModelPath(dataVisualizationModelPath, selectionVariantPath).targetObject; // We authorize SelectionVariant without SelectOptions even if it's not compliant with vocabularies
          if (selectionVariant.SelectOptions && isAnnotationOfType(selectionVariant, "com.sap.vocabularies.UI.v1.SelectionVariantType")) {
            selectionVariant.SelectOptions.forEach(selectOption => {
              const propertyPath = selectOption.PropertyName?.value;
              if (propertyPath) {
                const propertyModelPath = enhanceDataModelPath(dataVisualizationModelPath, propertyPath);
                sourceProperties.add(getTargetObjectPath(propertyModelPath, true));
              }
            });
          }
        }
        this.getAppComponent().getSideEffectsService().addControlSideEffects(viewEntityType, {
          sourceProperties: Array.from(sourceProperties),
          targetEntities: [{
            $NavigationPropertyPath: tableNavigationPath
          }],
          sourceControlId: `${this.id}-content`
        });
      }
    }

    /**
     * Creates the invisibleText for the accessibility compliance.
     * @returns  The InvisibleText
     */;
    _proto.getAccessibilityControl = function getAccessibilityControl() {
      const textBinding = `{sap.fe.i18n>M_TABLE_QUICKFILTER_ARIA}`;
      const invisibleText = _jsx(InvisibleText, {
        text: textBinding,
        id: this.getSelectorAriaLabelledById()
      });

      //Adds the invisibleText into the static, hidden area UI area container.
      invisibleText.toStatic();
      return invisibleText;
    };
    _proto.initializeContent = function initializeContent() {
      if (this.metaPath) {
        const metaPathObject = this.getMetaPathObject(this.metaPath);
        if (metaPathObject) {
          const odataMetaModel = this._getOwner()?.getMetaModel();
          const metaContext = odataMetaModel?.createBindingContext(metaPathObject.getPath());
          const context = odataMetaModel?.createBindingContext(metaPathObject.getContextPath());
          if (!metaContext || !context) {
            return;
          }
          if (this.showCounts) {
            this.registerSideEffectForQuickFilter(metaContext, context);
          }
          /**
           * The number of views defined for a table determines the UI control that lets users switch the table views:
           *  - A segmented button for a maximum of three views
           *  - A select control for four or more views.
           */

          const selector = this.paths.length > 3 ? this.getSelectSelector(metaContext) : this.getSegmentedButtonSelector(metaContext);
          selector.addDependent(this.getAccessibilityControl());
          this.content = selector;
        }
      }
    };
    _proto.getMDCTable = function getMDCTable() {
      if (!this.mdcTable) {
        let currentControl = this.content;
        while (currentControl && !currentControl.isA("sap.ui.mdc.Table")) {
          currentControl = currentControl.getParent();
        }
        this.mdcTable = currentControl;
        return this.mdcTable;
      } else {
        return this.mdcTable;
      }
    }

    /**
     * Returns the key of the selected item (or the key of the first item if there's no selection).
     * @returns The selected key
     */;
    _proto.getSelectedKey = function getSelectedKey() {
      return this.content?.getSelectedKey() || this.content?.getItems()[0].getKey() || "";
    }

    /**
     * Sets the selected key.
     * @param key The key of the item to be selected
     */;
    _proto.setSelectedKey = function setSelectedKey(key) {
      this.content?.setSelectedKey(key);
    }

    /**
     * Sets the count in a pending state.
     */;
    _proto.setCountsAsLoading = function setCountsAsLoading() {
      const quickFilterCounts = {};
      const internalContext = this.getBindingContext("internal");
      for (const k in this.content?.getItems()) {
        quickFilterCounts[k] = "...";
      }
      internalContext.setProperty("quickFilters", {
        counts: quickFilterCounts
      });
    }

    /**
     * Updates the count of the selected item.
     */;
    _proto.refreshSelectedCount = function refreshSelectedCount() {
      const count = this.getMDCTable().getRowBinding().getCount();
      if (this.showCounts === true && count !== undefined) {
        const itemIndex = this.content?.getItems().findIndex(selectorItem => selectorItem.getKey() === this.getSelectedKey());
        if (itemIndex !== undefined && itemIndex > -1) {
          this.getBindingContext("internal")?.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
        }
      }
    }

    /**
     * Updates the counts of the unselected items.
     * @returns  Promise resolves once the count are updated
     */;
    _proto.refreshUnSelectedCounts = async function refreshUnSelectedCounts() {
      if (!this.content) {
        return Promise.resolve();
      }
      const table = this.getMDCTable();
      const items = this.content.getItems();
      const internalContext = this.getBindingContext("internal");
      const controller = this.getPageController();
      const chart = controller.getChartControl?.();
      const chartBlock = chart?.getParent();
      const setItemCounts = async item => {
        const itemKey = item.getKey();
        const itemFilters = CommonUtils.getFiltersFromAnnotation(table, itemKey);
        const count = await TableUtils.getListBindingForCount(table, table.getBindingContext(), {
          batchGroupId: "$auto",
          additionalFilters: [...baseTableFilters, ...itemFilters]
        });
        const itemIndex = items.findIndex(selectorItem => selectorItem.getKey() === itemKey);
        if (itemIndex > -1) {
          internalContext.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
        }
      };
      const chartFilter = chartBlock?.hasSelections() && chartBlock?.getFilter();
      const baseTableFilters = TableUtils.getHiddenFilters(table);
      if (chartFilter) {
        baseTableFilters.push(chartFilter);
      }
      const bindingPromises = items.filter(item => item.getKey() !== this.getSelectedKey()).map(async item => setItemCounts(item));
      try {
        await Promise.all(bindingPromises);
      } catch (error) {
        Log.error("Error while retrieving the binding promises", error);
      }
    };
    return QuickFilterSelector;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "paths", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showCounts", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  _exports = QuickFilterSelector;
  return _exports;
}, false);
//# sourceMappingURL=QuickFilterSelector-dbg.js.map

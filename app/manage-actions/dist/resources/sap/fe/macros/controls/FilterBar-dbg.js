/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/macros/controls/filterbar/FilterContainer", "sap/fe/macros/controls/filterbar/VisualFilterContainer", "sap/ui/core/Element", "sap/ui/mdc/FilterBar", "sap/ui/mdc/filterbar/aligned/FilterItemLayout"], function (Log, ClassSupport, FilterContainer, VisualFilterContainer, Element, MdcFilterBar, FilterItemLayout) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let FilterBar = (_dec = defineUI5Class("sap.fe.macros.controls.FilterBar"), _dec2 = property({
    type: "string",
    defaultValue: "compact"
  }), _dec3 = association({
    type: "sap.m.SegmentedButton",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MdcFilterBar) {
    function FilterBar(idOrProps, settings) {
      var _this;
      _this = _MdcFilterBar.call(this, idOrProps, settings) || this;
      _initializerDefineProperty(_this, "initialLayout", _descriptor, _this);
      /**
       * Control which allows for switching between visual and normal filter layouts
       */
      _initializerDefineProperty(_this, "toggleControl", _descriptor2, _this);
      _this._isInitialized = false;
      _this._initializeStatus();
      return _this;
    }
    _inheritsLoose(FilterBar, _MdcFilterBar);
    var _proto = FilterBar.prototype;
    _proto._initializeStatus = async function _initializeStatus() {
      await this.waitForInitialization();
      this._isInitialized = true;
    };
    _proto.isInitialized = function isInitialized() {
      return !!this._isInitialized;
    };
    _proto.setToggleControl = function setToggleControl(vToggle) {
      if (typeof vToggle === "string") {
        this._oSegmentedButton = Element.getElementById(vToggle);
      } else {
        this._oSegmentedButton = vToggle;
      }
      if (this.toggleControl && this._oSegmentedButton) {
        this._oSegmentedButton.detachEvent("selectionChange", this._toggleLayout.bind(this));
      }
      if (this._oSegmentedButton) {
        this._oSegmentedButton.attachEvent("selectionChange", this._toggleLayout.bind(this));
      }
      this.setAssociation("toggleControl", vToggle, true);
    };
    _proto._toggleLayout = function _toggleLayout() {
      // Since primary layout is always compact
      // hence set the secondary layout as visual filter only for the first time only
      this.waitForInitialization().then(() => {
        const targetKey = this._oSegmentedButton?.getSelectedKey();
        if (targetKey === "visual" && this._oFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer") || targetKey === "compact" && !this._oFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
          return;
        }
        if (!this._oSecondaryFilterBarLayout) {
          this._oSecondaryFilterBarLayout = new VisualFilterContainer();
        }

        // do not show Adapt Filters Button for visual layout
        if (this._oSecondaryFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
          this.setShowAdaptFiltersButton(false);
        } else {
          this.setShowAdaptFiltersButton(true);
        }

        // get all filter fields and button of the current layout
        const oCurrentFilterBarLayout = this._oFilterBarLayout;
        const oFilterItems = this.getFilterItems();
        const aFilterFields = oCurrentFilterBarLayout.getAllFilterFields();
        const aSortedFilterFields = this.getSortedFilterFields(oFilterItems, aFilterFields);
        const aButtons = oCurrentFilterBarLayout.getAllButtons();
        const aVisualFilterFields = oCurrentFilterBarLayout.getAllVisualFilterFields && oCurrentFilterBarLayout.getAllVisualFilterFields();
        if (this._oSecondaryFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
          this._oSecondaryFilterBarLayout.setAllFilterFields(aSortedFilterFields, aVisualFilterFields);
        }
        // use secondary filter bar layout as new layout
        this._oFilterBarLayout = this._oSecondaryFilterBarLayout;

        // insert all filter fields from current layout to new layout
        aFilterFields.forEach((oFilterField, iIndex) => {
          oCurrentFilterBarLayout.removeFilterField(oFilterField);
          this._oFilterBarLayout.insertFilterField(oFilterField, iIndex);
        });
        // insert all buttons from the current layout to the new layout
        aButtons.forEach(oButton => {
          oCurrentFilterBarLayout.removeButton(oButton);
          this._oFilterBarLayout.addButton(oButton);
        });

        // set the current filter bar layout to the secondary one
        this._oSecondaryFilterBarLayout = oCurrentFilterBarLayout;

        // update the layout aggregation of the filter bar and rerender the same.
        this.setAggregation("layout", this._oFilterBarLayout, true);
        this._oFilterBarLayout.invalidate();
        return;
      }).catch(error => {
        Log.error(error);
      });
    };
    _proto.getSortedFilterFields = function getSortedFilterFields(aFilterItems, aFilterFields) {
      const aFilterIds = [];
      aFilterItems.forEach(function (oFilterItem) {
        aFilterIds.push(oFilterItem.getId());
      });
      aFilterFields.sort(function (aFirstItem, aSecondItem) {
        let sFirstItemVFId, sSecondItemVFId;
        aFirstItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sFirstItemVFId = oInnerControl.getId();
          }
        });
        aSecondItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sSecondItemVFId = oInnerControl.getId();
          }
        });
        return aFilterIds.indexOf(sFirstItemVFId ?? "") - aFilterIds.indexOf(sSecondItemVFId ?? "");
      });
      return aFilterFields;
    };
    _proto._createInnerLayout = function _createInnerLayout() {
      this._oFilterBarLayout = new FilterContainer();
      this._cLayoutItem = FilterItemLayout;
      this._oFilterBarLayout.getInner().addStyleClass("sapUiMdcFilterBarBaseAFLayout");
      this._addButtons();

      // TODO: Check with MDC if there is a better way to load visual filter on the basis of control property
      // _createInnerLayout is called on Init by the filter bar base.
      // This mean that we do not have access to the control properties yet
      // and hence we cannot decide on the basis of control properties whether initial layout should be compact or visual
      // As a result we have to do this workaround to always load the compact layout by default
      // And toogle the same in case the initialLayout was supposed to be visual filters.
      const oInnerLayout = this._oFilterBarLayout.getInner();
      const oFilterContainerInnerLayoutEventDelegate = {
        onBeforeRendering: () => {
          if (this.initialLayout === "visual") {
            this._toggleLayout();
          }
          oInnerLayout.removeEventDelegate(oFilterContainerInnerLayoutEventDelegate);
        }
      };
      oInnerLayout.addEventDelegate(oFilterContainerInnerLayoutEventDelegate);
      this.setAggregation("layout", this._oFilterBarLayout, true);
    };
    _proto.exit = function exit() {
      _MdcFilterBar.prototype.exit.call(this);
      // Sometimes upon external navigation this._SegmentedButton is already destroyed
      // so check if it exists and then only remove stuff
      if (this._oSegmentedButton) {
        this._oSegmentedButton.detachEvent("selectionChange", this._toggleLayout);
        delete this._oSegmentedButton;
      }
    };
    _proto.getSegmentedButton = function getSegmentedButton() {
      return this._oSegmentedButton;
    };
    return FilterBar;
  }(MdcFilterBar), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "initialLayout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "toggleControl", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FilterBar;
}, false);
//# sourceMappingURL=FilterBar-dbg.js.map

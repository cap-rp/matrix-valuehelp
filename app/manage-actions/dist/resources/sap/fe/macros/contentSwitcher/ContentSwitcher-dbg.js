/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/ui/core/Element", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, SegmentedButton, SegmentedButtonItem, UI5Element, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var aggregation = ClassSupport.aggregation;
  var bindState = BindingToolkit.bindState;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Defines a new building block which can be used to toggle the visibility of the content referenced by the item.
   * Each item will be displayed in a segmented button with the
   */
  let ContentSwitcher = (_dec = defineUI5Class("sap.fe.macros.contentSwitcher.ContentSwitcher"), _dec2 = implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor"), _dec3 = aggregation({
    type: "sap.fe.macros.contentSwitcher.ContentSwitcherItem",
    multiple: true,
    isDefault: true
  }), _dec4 = event(), _dec5 = defineReference(), _dec6 = property({
    type: "string",
    bindToState: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_ref) {
    function ContentSwitcher(propertiesOrId, properties) {
      var _this;
      _this = _ref.call(this, propertiesOrId, properties) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", _descriptor, _this);
      _initializerDefineProperty(_this, "items", _descriptor2, _this);
      _initializerDefineProperty(_this, "selectionChange", _descriptor3, _this);
      _initializerDefineProperty(_this, "$segmentedButton", _descriptor4, _this);
      _initializerDefineProperty(_this, "selectedKey", _descriptor5, _this);
      _this.content = _this.createContent();
      if (_this.state.selectedKey) {
        // if there is already a selected key let's make sure to apply it
        _this.onStateChange(["selectedKey"]);
      } else {
        // otherwise let's set an initial state
        _this.state.selectedKey = "key0";
      }
      return _this;
    }
    _exports = ContentSwitcher;
    _inheritsLoose(ContentSwitcher, _ref);
    var _proto = ContentSwitcher.prototype;
    _proto.retrieveState = function retrieveState() {
      return {
        selectedKey: this.$segmentedButton.current?.getSelectedKey()
      };
    };
    _proto.applyState = function applyState(appState) {
      if (appState) {
        this.state.selectedKey = appState.selectedKey ?? this.items[0]?.key ?? "key0";
      }
    }

    /**
     * Retrieves the control referenced by the ContentSwitcherItem.
     * @param item The ContentSwitcherItem
     * @returns The control referenced by the ContentSwitcherItem
     */;
    _proto._getControlFromItem = function _getControlFromItem(item) {
      const controlToSwitch = item.controlToSwitch;
      if (controlToSwitch) {
        const control = UI5Element.getElementById(controlToSwitch);
        if (control?.isA("sap.ui.core.Control")) {
          return control;
        }
      }
    };
    _proto.showHideControls = function showHideControls(selectedKey) {
      const controlsToHide = [];
      const controlsToDisplay = [];
      for (const item of this.items) {
        const control = this._getControlFromItem(item);
        // item.key -> compact
        // selectedKey -> compact & { czxmcz;lkxzc }
        if (control && item.key !== selectedKey) {
          controlsToHide.push(control);
        } else if (control) {
          controlsToDisplay.push(control);
        }
      }
      for (const control of controlsToHide) {
        if (!controlsToDisplay.includes(control)) {
          control.setVisible(false);
        }
      }
      for (const control of controlsToDisplay) {
        control.setVisible(true);
      }
    };
    _proto.onStateChange = function onStateChange(changedKeys) {
      if (changedKeys?.includes("selectedKey")) {
        this.showHideControls(this.state.selectedKey);
        this.getPageController()?.getExtensionAPI().updateAppState();
        this.fireEvent("selectionChange");
      }
    }

    /**
     * Creates the content of the building block.
     * @returns The SegmentedButton
     */;
    _proto.createContent = function createContent() {
      const segmentedButtonId = this.createId("filterTypeSwitch");
      return _jsx(SegmentedButton, {
        ref: this.$segmentedButton,
        id: segmentedButtonId,
        selectedKey: bindState(this.state, "selectedKey"),
        children: {
          items: this.items.map((item, index) => this.createSegmentedButtonItem(item, index))
        }
      });
    }

    /**
     * Creates the SegmentedButtonItem for the SegmentedButton and associate a key to it.
     * @param item The ContentSwitcherItem
     * @param itemIdx The index of the item
     * @returns The SegmentedButtonItem
     */;
    _proto.createSegmentedButtonItem = function createSegmentedButtonItem(item, itemIdx) {
      const segmentButtonItemId = this.createId(item.key);
      item.key ??= `key${itemIdx}`;
      if (item.icon) {
        return _jsx(SegmentedButtonItem, {
          icon: item.icon,
          tooltip: item.text,
          id: segmentButtonItemId
        }, item.key);
      }
      return _jsx(SegmentedButtonItem, {
        text: item.text,
        id: segmentButtonItemId
      }, item.key);
    };
    return ContentSwitcher;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "items", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "$segmentedButton", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "selectedKey", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ContentSwitcher;
  return _exports;
}, false);
//# sourceMappingURL=ContentSwitcher-dbg.js.map

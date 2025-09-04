/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/MessageStrip", "sap/m/IconTabBar", "sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/Element", "sap/ui/fl/write/api/ControlPersonalizationWriteAPI", "sap/ui/model/json/JSONModel", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, MessageStripHelper, IconTabBar, Log, CommonUtils, MetaModelConverter, ResourceModelHelper, UI5Element, ControlPersonalizationWriteAPI, JSONModel, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  var BindingAction = /*#__PURE__*/function (BindingAction) {
    BindingAction["Suspend"] = "suspendBinding";
    BindingAction["Resume"] = "resumeBinding";
    return BindingAction;
  }(BindingAction || {});
  let MultiTab = (_dec = defineUI5Class("sap.fe.macros.MultiTab"), _dec2 = implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor"), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = aggregation({
    type: "sap.fe.macros.Tab",
    multiple: true,
    isDefault: true
  }), _dec6 = association({
    type: "sap.fe.macros.controls.FilterBar",
    multiple: false
  }), _dec7 = property({
    type: "boolean",
    defaultValue: false
  }), _dec8 = property({
    type: "boolean",
    defaultValue: false
  }), _dec9 = property({
    type: "boolean",
    defaultValue: false
  }), _dec10 = association({
    type: "sap.fe.macros.controls.FilterBar",
    multiple: false
  }), _dec11 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function MultiTab(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", _descriptor, _this);
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      _initializerDefineProperty(_this, "showCounts", _descriptor3, _this);
      _initializerDefineProperty(_this, "tabs", _descriptor4, _this);
      _initializerDefineProperty(_this, "filterBarId", _descriptor5, _this);
      _initializerDefineProperty(_this, "setVisibleOverridden", _descriptor6, _this);
      _initializerDefineProperty(_this, "freezeContent", _descriptor7, _this);
      _initializerDefineProperty(_this, "countsOutDated", _descriptor8, _this);
      _initializerDefineProperty(_this, "filterControl", _descriptor9, _this);
      _initializerDefineProperty(_this, "select", _descriptor10, _this);
      return _this;
    }
    _exports = MultiTab;
    _inheritsLoose(MultiTab, _BuildingBlock);
    var _proto = MultiTab.prototype;
    _proto.initialize = function initialize() {
      this.id = this.createId("Control");
      this.filterControl = this.filterBarId + "-content";
      this.content = this.createContent();
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.initialize();
      }
    }

    /**
     * Retrieves the state of the MultiTab to be saved in the app state.
     * @returns The state of the MultiTab
     */;
    _proto.retrieveState = function retrieveState() {
      return this?.content ? {
        selectedKey: this.content.getSelectedKey()
      } : null;
    }

    /**
     * Applies the state to the MultiTab.
     * @param controlState The state of the MultiTab
     */;
    _proto.applyState = function applyState(controlState) {
      if (controlState?.selectedKey) {
        const tabBar = this.content;
        if (tabBar?.getItems().find(item => item.getKey() === controlState.selectedKey)) {
          tabBar.setSelectedKey(controlState.selectedKey);
        }
      }
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      this.getTabsModel(); // Generate the model which is mandatory for some bindings

      const oFilterControl = this._getFilterControl();
      if (!oFilterControl) {
        // In case there's no filterbar, we have to update the counts in the tabs immediately
        this.setCountsOutDated(true);
      }
      const oFilterBarAPI = oFilterControl?.getParent();
      this.getAllInnerControls().forEach(tab => {
        if (this.showCounts) {
          tab.attachEvent("internalDataRequested", this.internalRefreshTabsCount.bind(this));
        }
        tab.suspendBinding();
      });
      if (oFilterBarAPI && oFilterBarAPI.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
        oFilterBarAPI.waitForInitialState().then(() => {
          oFilterBarAPI.attachEvent("internalSearch", this._onSearch.bind(this));
          oFilterBarAPI.attachEvent("internalFilterChanged", this._onFilterChanged.bind(this));
          return;
        }).catch(() => {
          Log.error("Error while waiting for initial state of filter bar");
        });
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      this.getSelectedInnerControl()?.resumeBinding(!this.getProperty("freezeContent"));
      if (this.showCounts && !this.setVisibleOverridden) {
        this.setProperty("setVisibleOverridden", true);
        this.getAllInnerControls().forEach(tab => {
          const originSetVisible = tab.setVisible;
          tab.setVisible = value => {
            if (tab.getVisible() === false && value) {
              tab.refreshCount();
            }
            return originSetVisible.bind(tab)(value);
          };
        });
      }
    };
    MultiTab.render = function render(oRm, oControl) {
      oRm.renderControl(oControl.content);
    }

    /**
     * Gets the model containing information related to the IconTabFilters.
     * @returns The model
     */;
    _proto.getTabsModel = function getTabsModel() {
      const sTabsModel = "tabsInternal";
      const oContent = this.content;
      if (!oContent) {
        return undefined;
      }
      let oModel = oContent.getModel(sTabsModel);
      if (!oModel) {
        oModel = new JSONModel({});
        oContent.setModel(oModel, sTabsModel);
      }
      return oModel;
    }

    /**
     * Gets the inner control of the displayed tab.
     * @returns The control
     */;
    _proto.getSelectedInnerControl = function getSelectedInnerControl() {
      return (this.content?.getItems()).find(tab => tab.getKey() === this.content?.getSelectedKey());
    }

    /**
     * Manages the binding of all inner controls when the selected IconTabFilter is changed.
     * @param evt Event fired by the IconTabBar
     */;
    MultiTab.handleTabChange = function handleTabChange(evt) {
      const iconTabBar = evt.getSource();
      const multiControl = iconTabBar.getParent();
      const parameters = evt.getParameters();
      multiControl._setInnerBinding(true);
      const previousSelectedKey = parameters?.previousKey;
      const selectedKey = parameters?.selectedKey;
      if (selectedKey && previousSelectedKey !== selectedKey) {
        const filterBar = multiControl._getFilterControl();
        if (filterBar && !multiControl.getProperty("freezeContent")) {
          //TODO getselectedTab.refreshContent("tabChanged)
          if (!multiControl.getSelectedInnerControl()?.getTabContent().length) {
            //custom tab
            multiControl._refreshCustomView(filterBar.getFilterConditions(), "tabChanged");
          } else {
            multiControl.refreshSelectedInnerControlContent();
          }
        }
        ControlPersonalizationWriteAPI.add({
          changes: [{
            changeSpecificData: {
              changeType: "selectIconTabBarFilter",
              content: {
                selectedKey: selectedKey,
                previousSelectedKey: previousSelectedKey
              }
            },
            selectorElement: iconTabBar
          }]
        });
      }
      multiControl._getViewController()?.getExtensionAPI()?.updateAppState();
      multiControl.fireEvent("select", {
        iconTabBar: iconTabBar,
        selectedKey: selectedKey,
        previousKey: previousSelectedKey
      });
    }

    /**
     * Refreshes the content of the selected inner control.
     *
     */;
    _proto.refreshSelectedInnerControlContent = function refreshSelectedInnerControlContent() {
      if (this.getSelectedInnerControl()) {
        this.getSelectedInnerControl()?.invalidateContent();
        this.getSelectedInnerControl()?.resumeBinding(true);
      } else {
        // custom tab
        this._refreshCustomView(undefined, "forcedRefresh");
      }
    }

    /**
     * Invalidates the content of the inner controls.
     * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be invalidated. If not provided, all the views' content will be invalidated
     */;
    _proto.invalidateContent = function invalidateContent(keys) {
      this.setCountsOutDated(true);
      this.getAllInnerControls().forEach(tab => {
        if (keys) {
          for (const key of keys) {
            if (tab.getKey() === `fe::table::${key}::LineItem` || tab.getKey() === `fe::CustomTab::${key}` || tab.getKey() === key) {
              tab.invalidateContent();
            }
          }
        } else {
          tab.invalidateContent();
        }
      });
    }

    /**
     * Sets the counts to "out of date" or "up to date"
     * If the counts are set to "out of date" and the selected IconTabFilter doesn't contain an inner control, all inner controls are requested to get the new counts.
     * @param bValue Either freezes the control or not
     */;
    _proto.setCountsOutDated = function setCountsOutDated() {
      let bValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this.setProperty("countsOutDated", bValue);
      // if the current tab is not configured with no inner Control
      // the tab counts must be manually refreshed since no Macro API will sent event internalDataRequested
      if (bValue && !this.getSelectedInnerControl()?.getTabContent().length) {
        this.internalRefreshTabsCount();
      }
    }

    /**
     * Freezes the content :
     * - content is frozen: the binding of the inner controls are suspended.
     * - content is unfrozen: the binding of inner control related to the selected IconTabFilter is resumed.
     * @param bValue Freeze or not the control
     */;
    _proto.setFreezeContent = function setFreezeContent(bValue) {
      this.setProperty("freezeContent", bValue);
      this._setInnerBinding();
    }

    /**
     * Updates the internal model with the properties that are not applicable on each IconTabFilter (containing inner control) according to the entityType of the filter control.
     *
     */;
    _proto._updateMultiTabNotApplicableFields = function _updateMultiTabNotApplicableFields() {
      const tabsModel = this.getTabsModel();
      const filterControl = this._getFilterControl();
      if (tabsModel && filterControl) {
        const results = {};
        this.getAllInnerControls().forEach(tab => {
          const tabId = tab.getKey();
          const ignoredFields = tab.refreshNotApplicableFields(filterControl) || [];
          results[tabId] = {
            notApplicable: {
              fields: ignoredFields,
              title: this._setTabMessageStrip({
                entityTypePath: filterControl.data("entityType"),
                ignoredFields: ignoredFields,
                title: tab.getText()
              })
            }
          };
          const macroAPI = tab.getTabContent()?.[0];
          if (macroAPI && macroAPI.isA("sap.fe.macros.Chart")) {
            results[tabId] = this.checkNonFilterableEntitySet(macroAPI, tabId, results);
          }
        });
        tabsModel.setData(results);
      }
    }

    /**
     * Modifies the messagestrip message based on entity set is filerable or not.
     * @param chartAPI ChartAPI
     * @param tabId Tab key ID
     * @param results Should contain fields and title
     * @returns An object of modified fields and title
     */;
    _proto.checkNonFilterableEntitySet = function checkNonFilterableEntitySet(chartAPI, tabId, results) {
      const resourceModel = getResourceModel(chartAPI);
      const chart = chartAPI.getContent();
      const entitySetFilerable = chart && MetaModelConverter.getInvolvedDataModelObjects(chart.getModel().getMetaModel().getContext(`${chart.data("targetCollectionPath")}`))?.targetObject?.annotations?.Capabilities?.FilterRestrictions?.Filterable;
      if (entitySetFilerable !== undefined && !entitySetFilerable) {
        if (results[tabId].notApplicable.fields.includes("$search")) {
          results[tabId].notApplicable.title += " " + resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
        } else {
          results[tabId].notApplicable.fields = ["nonFilterable"];
          results[tabId].notApplicable.title = resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
        }
      }
      return results[tabId];
    }

    /**
     * Gets the inner controls.
     * @param onlyForVisibleTab Should display only the visible controls
     * @returns An array of controls
     */;
    _proto.getAllInnerControls = function getAllInnerControls() {
      let onlyForVisibleTab = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return (this.content?.getItems()).filter(tab => !onlyForVisibleTab || tab.getVisible()) ?? [];
    };
    _proto._getFilterControl = function _getFilterControl() {
      return UI5Element.getElementById(this.filterControl);
    };
    _proto._getViewController = function _getViewController() {
      const view = CommonUtils.getTargetView(this);
      return view && view.getController();
    };
    _proto._refreshCustomView = function _refreshCustomView(oFilterConditions, sRefreshCause) {
      this._getViewController()?.onViewNeedsRefresh?.({
        filterConditions: oFilterConditions,
        currentTabId: this.content?.getSelectedKey(),
        refreshCause: sRefreshCause
      });
    };
    _proto.internalRefreshTabsCount = function internalRefreshTabsCount(tableEvent) {
      // If the refresh is triggered by an event (internalDataRequested)
      // we cannot use the selected key as reference since table can be refreshed by SideEffects
      // so the table could be into a different tab -> we use the source of the event to find the targeted tab
      // If not triggered by an event -> refresh at least the counts of the current MacroAPI
      const eventTab = tableEvent?.getSource();
      const targetKey = eventTab ? eventTab.getKey() : this.content?.getSelectedKey();
      if (targetKey) {
        this.refreshTabsCount([targetKey.split("::")[2]]);
      }
    }

    /**
     * Refreshes the count of the views in the MultiMode control.
     * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' count will be refreshed. If not provided, all the views' count will be refreshed
     */;
    _proto.refreshTabsCount = function refreshTabsCount(keys) {
      if (!keys) {
        this.setCountsOutDated(true);
      }
      this.getAllInnerControls(true).forEach(tab => {
        if (this.countsOutDated || keys && keys.includes(tab.getKey().split("::")[2])) {
          tab.refreshCount();
        }
      });
      this.setCountsOutDated(false);
    }

    /**
     * Refreshes the content of the underlying views upon the next opening.
     * Note: The content of the selected view, if part of the provided keys, will be refreshed immediately.
     * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be refreshed. If not provided, all the views' content will be refreshed
     */;
    _proto.setTabContentToBeRefreshedOnNextOpening = function setTabContentToBeRefreshedOnNextOpening(keys) {
      const selectedTabKey = this?.content?.getSelectedKey();
      const tabKeys = [];
      const refreshSelectedTabContent = keys ? keys.includes(selectedTabKey.split("::")[2]) || keys.includes(selectedTabKey) : true;
      if (keys) {
        for (const key of keys) {
          if (selectedTabKey !== `fe::table::${key}::LineItem` && selectedTabKey !== `fe::CustomTab::${key}` && selectedTabKey !== key) {
            tabKeys.push(key);
          }
        }
      } else {
        this?.getAllInnerControls().forEach(tab => {
          if (tab.getKey() !== selectedTabKey) {
            tabKeys.push(tab.getKey().split("::")[2]);
          }
        });
      }
      this?.invalidateContent(tabKeys);
      if (refreshSelectedTabContent) {
        this?.refreshSelectedInnerControlContent();
      }
    };
    _proto._setInnerBinding = function _setInnerBinding() {
      let requestIfNotInitialized = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (this.content) {
        this.getAllInnerControls().forEach(tab => {
          const isSelectedKey = tab.getKey() === this.content?.getSelectedKey();
          const action = isSelectedKey && !this.getProperty("freezeContent") ? BindingAction.Resume : BindingAction.Suspend;
          tab[action]?.(action === BindingAction.Resume ? requestIfNotInitialized && isSelectedKey : undefined);
        });
      }
    };
    _proto._setTabMessageStrip = function _setTabMessageStrip(properties) {
      let sText = "";
      const aIgnoredFields = properties.ignoredFields;
      const oFilterControl = this._getFilterControl();
      if (oFilterControl && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && properties.title) {
        const aIgnoredLabels = MessageStripHelper.getLabels(aIgnoredFields, properties.entityTypePath, oFilterControl, getResourceModel(oFilterControl));
        sText = MessageStripHelper.getText(aIgnoredLabels, oFilterControl, properties.title);
        return sText;
      }
    };
    _proto._onSearch = function _onSearch(oEvent) {
      this.setCountsOutDated(true);
      this.setFreezeContent(false);
      // TODO this.getSelectedTab.refreshContent()
      if (this.getSelectedInnerControl()) {
        this._updateMultiTabNotApplicableFields();
        if (this.getSelectedInnerControl().getTabContent().length == 0) {
          this.getSelectedInnerControl().fireEvent("internalDataRequested", oEvent.getParameters());
        }
      } else {
        // custom tab
        this._refreshCustomView(oEvent.getParameter("conditions"), "search");
      }
    };
    _proto._onFilterChanged = function _onFilterChanged(oEvent) {
      if (oEvent.getParameter("conditionsBased")) {
        this.setFreezeContent(true);
      }
    };
    _proto.createContent = function createContent() {
      return _jsx(IconTabBar, {
        expandable: false,
        headerMode: "Inline",
        id: this.createId("_mt"),
        stretchContentHeight: false,
        select: MultiTab.handleTabChange,
        children: {
          items: this.tabs
        }
      });
    };
    return MultiTab;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showCounts", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "tabs", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "filterBarId", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "setVisibleOverridden", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "freezeContent", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "countsOutDated", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "filterControl", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "select", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = MultiTab;
  return _exports;
}, false);
//# sourceMappingURL=MultiTab-dbg.js.map

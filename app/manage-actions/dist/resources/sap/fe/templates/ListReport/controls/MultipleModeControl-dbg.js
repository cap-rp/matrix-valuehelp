/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MessageStrip", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/Control", "sap/ui/core/Element", "sap/ui/fl/write/api/ControlPersonalizationWriteAPI", "sap/ui/model/json/JSONModel"], function (Log, ClassSupport, CommonUtils, MetaModelConverter, MessageStrip, ResourceModelHelper, Control, UI5Element, ControlPersonalizationWriteAPI, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  var BindingAction = /*#__PURE__*/function (BindingAction) {
    BindingAction["Suspend"] = "suspendBinding";
    BindingAction["Resume"] = "resumeBinding";
    return BindingAction;
  }(BindingAction || {});
  let MultipleModeControl = (_dec = defineUI5Class("sap.fe.templates.ListReport.controls.MultipleModeControl"), _dec2 = property({
    type: "boolean"
  }), _dec3 = property({
    type: "boolean",
    defaultValue: false
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec6 = aggregation({
    type: "sap.m.IconTabBar",
    multiple: false,
    isDefault: true
  }), _dec7 = association({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec8 = association({
    type: "sap.fe.macros.controls.FilterBar",
    multiple: false
  }), _dec9 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function MultipleModeControl(id, settings) {
      var _this;
      _this = _Control.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "showCounts", _descriptor, _this);
      _initializerDefineProperty(_this, "setVisibleOverridden", _descriptor2, _this);
      _initializerDefineProperty(_this, "freezeContent", _descriptor3, _this);
      _initializerDefineProperty(_this, "countsOutDated", _descriptor4, _this);
      _initializerDefineProperty(_this, "content", _descriptor5, _this);
      _initializerDefineProperty(_this, "innerControls", _descriptor6, _this);
      _initializerDefineProperty(_this, "filterControl", _descriptor7, _this);
      _initializerDefineProperty(_this, "select", _descriptor8, _this);
      return _this;
    }
    _inheritsLoose(MultipleModeControl, _Control);
    var _proto = MultipleModeControl.prototype;
    _proto.onBeforeRendering = function onBeforeRendering() {
      this.getTabsModel(); // Generate the model which is mandatory for some bindings

      const oFilterControl = this._getFilterControl();
      if (!oFilterControl) {
        // In case there's no filterbar, we have to update the counts in the tabs immediately
        this.setCountsOutDated(true);
      }
      const oFilterBarAPI = oFilterControl?.getParent();
      this.getAllInnerControls().forEach(oMacroAPI => {
        if (this.showCounts) {
          oMacroAPI.attachEvent("internalDataRequested", this.internalRefreshTabsCount.bind(this));
        }
        oMacroAPI.suspendBinding?.();
      });
      if (oFilterBarAPI) {
        oFilterBarAPI.attachEvent("internalSearch", this._onSearch.bind(this));
        oFilterBarAPI.attachEvent("internalFilterChanged", this._onFilterChanged.bind(this));
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      this.getSelectedInnerControl()?.resumeBinding?.(!this.getProperty("freezeContent"));
      if (this.showCounts && !this.setVisibleOverridden) {
        this.setProperty("setVisibleOverridden", true);
        this.getAllInnerControls().forEach(macroAPI => {
          const iconTabFilter = this._getTabFromInnerControl(macroAPI);
          // No count to show
          if (!iconTabFilter) return;
          const originSetVisible = iconTabFilter.setVisible;
          iconTabFilter.setVisible = value => {
            if (iconTabFilter.getVisible() === false && value) {
              this.refreshTabCount(macroAPI);
            }
            return originSetVisible.bind(iconTabFilter)(value);
          };
        });
      }
    };
    MultipleModeControl.render = function render(oRm, oControl) {
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
      const oSelectedTab = this.content?.getItems().find(oItem => oItem.getKey() === this.content.getSelectedKey());
      return oSelectedTab ? this.getAllInnerControls().find(oMacroAPI => this._getTabFromInnerControl(oMacroAPI) === oSelectedTab) : undefined;
    }

    /**
     * Manages the binding of all inner controls when the selected IconTabFilter is changed.
     * @param oEvent Event fired by the IconTabBar
     */;
    MultipleModeControl.handleTabChange = function handleTabChange(oEvent) {
      const oIconTabBar = oEvent.getSource();
      const oMultiControl = oIconTabBar.getParent();
      const mParameters = oEvent.getParameters();
      oMultiControl._setInnerBinding(true);
      const sPreviousSelectedKey = mParameters?.previousKey;
      const sSelectedKey = mParameters?.selectedKey;
      if (sSelectedKey && sPreviousSelectedKey !== sSelectedKey) {
        const oFilterBar = oMultiControl._getFilterControl();
        if (oFilterBar && !oMultiControl.getProperty("freezeContent")) {
          if (!oMultiControl.getSelectedInnerControl()) {
            //custom tab
            oMultiControl._refreshCustomView(oFilterBar.getFilterConditions(), "tabChanged");
          }
        }
        ControlPersonalizationWriteAPI.add({
          changes: [{
            changeSpecificData: {
              changeType: "selectIconTabBarFilter",
              content: {
                selectedKey: sSelectedKey,
                previousSelectedKey: sPreviousSelectedKey
              }
            },
            selectorElement: oIconTabBar
          }]
        });
      }
      oMultiControl._getViewController()?.getExtensionAPI()?.updateAppState();
      oMultiControl.fireEvent("select", {
        iconTabBar: oIconTabBar,
        selectedKey: sSelectedKey,
        previousKey: sPreviousSelectedKey
      });
    }

    /**
     * Refreshes the content of the selected inner control.
     *
     */;
    _proto.refreshSelectedInnerControlContent = function refreshSelectedInnerControlContent() {
      if (this.getSelectedInnerControl()) {
        this.getSelectedInnerControl()?.invalidateContent?.();
        this.getSelectedInnerControl()?.resumeBinding?.(true);
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
      this.getAllInnerControls().forEach(macroAPI => {
        if (keys) {
          const iconTabFilter = this._getTabFromInnerControl(macroAPI);
          for (const key of keys) {
            if (iconTabFilter && (iconTabFilter.getKey() === `fe::table::${key}::LineItem` || iconTabFilter.getKey() === `fe::CustomTab::${key}`)) {
              macroAPI.invalidateContent?.();
            }
          }
        } else {
          macroAPI.invalidateContent?.();
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
      if (bValue && !this.getSelectedInnerControl()) {
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
      const oFilterControl = this._getFilterControl();
      if (tabsModel && oFilterControl) {
        const results = {};
        const view = CommonUtils.getTargetView(this);
        const viewData = view.getViewData();
        if (!viewData.useHiddenFilterBar) {
          this.getAllInnerControls().forEach(oMacroAPI => {
            const oTab = this._getTabFromInnerControl(oMacroAPI);
            if (oTab) {
              const sTabId = oTab.getKey();
              const mIgnoredFields = oMacroAPI.refreshNotApplicableFields?.(oFilterControl) || [];
              results[sTabId] = {
                notApplicable: {
                  fields: mIgnoredFields,
                  title: this._setTabMessageStrip({
                    entityTypePath: oFilterControl.data("entityType"),
                    ignoredFields: mIgnoredFields,
                    title: oTab.getText()
                  })
                }
              };
              if (oMacroAPI && oMacroAPI.isA("sap.fe.macros.Chart")) {
                results[sTabId] = this.checkNonFilterableEntitySet(oMacroAPI, sTabId, results);
              }
            }
          });
          tabsModel.setData(results);
        }
      }
    }

    /**
     * Modifies the messagestrip message based on entity set is filerable or not.
     * @param oMacroAPI Macro chart api
     * @param sTabId Tab key ID
     * @param results Should contain fields and title
     * @returns An object of modified fields and title
     */;
    _proto.checkNonFilterableEntitySet = function checkNonFilterableEntitySet(oMacroAPI, sTabId, results) {
      const resourceModel = getResourceModel(oMacroAPI);
      const oChart = oMacroAPI?.getContent ? oMacroAPI.getContent() : undefined;
      const bEntitySetFilerable = oChart && MetaModelConverter.getInvolvedDataModelObjects(oChart.getModel().getMetaModel().getContext(`${oChart.data("targetCollectionPath")}`))?.targetObject?.annotations?.Capabilities?.FilterRestrictions?.Filterable;
      if (bEntitySetFilerable !== undefined && !bEntitySetFilerable) {
        if (results[sTabId].notApplicable.fields.includes("$search")) {
          results[sTabId].notApplicable.title += " " + resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
        } else {
          results[sTabId].notApplicable.fields = ["nonFilterable"];
          results[sTabId].notApplicable.title = resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
        }
      }
      return results[sTabId];
    }

    /**
     * Gets the inner controls.
     * @param bOnlyForVisibleTab Should display only the visible controls
     * @returns An array of controls
     */;
    _proto.getAllInnerControls = function getAllInnerControls() {
      let bOnlyForVisibleTab = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return this.innerControls.reduce((aInnerControls, sInnerControl) => {
        const oControl = UI5Element.getElementById(sInnerControl);
        if (oControl) {
          aInnerControls.push(oControl);
        }
        return aInnerControls.filter(oInnerControl => !bOnlyForVisibleTab || this._getTabFromInnerControl(oInnerControl)?.getVisible());
      }, []) || [];
    };
    _proto._getFilterControl = function _getFilterControl() {
      return UI5Element.getElementById(this.filterControl);
    };
    _proto._getTabFromInnerControl = function _getTabFromInnerControl(oControl) {
      let oTab = oControl;
      if (oTab && !oTab.isA("sap.m.IconTabFilter") && oTab.getParent) {
        oTab = oControl.getParent();
      }
      return oTab && oTab.isA("sap.m.IconTabFilter") ? oTab : undefined;
    };
    _proto._getViewController = function _getViewController() {
      const oView = CommonUtils.getTargetView(this);
      return oView && oView.getController();
    };
    _proto._refreshCustomView = function _refreshCustomView(oFilterConditions, sRefreshCause) {
      this._getViewController()?.onViewNeedsRefresh?.({
        filterConditions: oFilterConditions,
        currentTabId: this.content.getSelectedKey(),
        refreshCause: sRefreshCause
      });
    }

    /**
     * Get the count of the Tab containing the macro passed as parameter.
     * @param macroAPI The content of the tab we want to refresh
     */;
    _proto.refreshTabCount = function refreshTabCount(macroAPI) {
      const iconTabFilter = this._getTabFromInnerControl(macroAPI);
      if (!iconTabFilter) {
        return;
      }
      if (macroAPI?.getCounts) {
        iconTabFilter.setCount("...");
        macroAPI.getCounts().then(count => {
          return iconTabFilter.setCount(count || "0");
        }).catch(function (error) {
          Log.error(`Error while requesting Counts for Control: ${error}`);
        });
      }
    };
    _proto.internalRefreshTabsCount = function internalRefreshTabsCount(tableEvent) {
      // If the refresh is triggered by an event (internalDataRequested)
      // we cannot use the selected key as reference since table can be refreshed by SideEffects
      // so the table could be into a different tab -> we use the source of the event to find the targeted tab
      // If not triggered by an event -> refresh at least the counts of the current MacroAPI
      const eventMacroAPI = tableEvent?.getSource();
      const targetKey = eventMacroAPI ? this._getTabFromInnerControl(eventMacroAPI)?.getKey() : this.content?.getSelectedKey();
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
      this.getAllInnerControls(true).forEach(oMacroAPI => {
        const oIconTabFilter = this._getTabFromInnerControl(oMacroAPI);
        if (this.countsOutDated || keys && oIconTabFilter && keys.includes(oIconTabFilter.getKey().split("::")[2])) {
          this.refreshTabCount(oMacroAPI);
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
      const selectedTabKey = this?.content.getSelectedKey();
      const tabKeys = [];
      const refreshSelectedTabContent = keys ? keys.includes(selectedTabKey?.split("::")[2]) : true;
      if (keys) {
        for (const key of keys) {
          if (selectedTabKey !== `fe::table::${key}::LineItem` && selectedTabKey !== `fe::CustomTab::${key}`) {
            tabKeys.push(key);
          }
        }
      } else {
        this?.getAllInnerControls().forEach(macroAPI => {
          const iconTabFilter = this?._getTabFromInnerControl(macroAPI);
          if (iconTabFilter && iconTabFilter.getKey() !== selectedTabKey) {
            tabKeys.push(iconTabFilter.getKey().split("::")[2]);
          }
        });
      }
      this?.invalidateContent(tabKeys);
      if (refreshSelectedTabContent) {
        this?.refreshSelectedInnerControlContent();
      }
    };
    _proto._setInnerBinding = function _setInnerBinding() {
      let bRequestIfNotInitialized = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (this.content) {
        this.getAllInnerControls().forEach(oMacroAPI => {
          const oIconTabFilter = this._getTabFromInnerControl(oMacroAPI);
          const bIsSelectedKey = oIconTabFilter?.getKey() === this.content.getSelectedKey();
          const sAction = bIsSelectedKey && !this.getProperty("freezeContent") ? BindingAction.Resume : BindingAction.Suspend;
          oMacroAPI[sAction]?.(sAction === BindingAction.Resume ? bRequestIfNotInitialized && bIsSelectedKey : undefined);
        });
      }
    };
    _proto._setTabMessageStrip = function _setTabMessageStrip(properties) {
      let sText = "";
      const aIgnoredFields = properties.ignoredFields;
      const oFilterControl = this._getFilterControl();
      if (oFilterControl && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && properties.title) {
        const aIgnoredLabels = MessageStrip.getLabels(aIgnoredFields, properties.entityTypePath, oFilterControl, getResourceModel(oFilterControl));
        sText = MessageStrip.getText(aIgnoredLabels, oFilterControl, properties.title);
        return sText;
      }
    };
    _proto._onSearch = function _onSearch(oEvent) {
      this.setCountsOutDated(true);
      this.setFreezeContent(false);
      if (this.getSelectedInnerControl()) {
        this._updateMultiTabNotApplicableFields();
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
    return MultipleModeControl;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "showCounts", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "setVisibleOverridden", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "freezeContent", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "countsOutDated", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "innerControls", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "filterControl", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "select", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return MultipleModeControl;
}, false);
//# sourceMappingURL=MultipleModeControl-dbg.js.map

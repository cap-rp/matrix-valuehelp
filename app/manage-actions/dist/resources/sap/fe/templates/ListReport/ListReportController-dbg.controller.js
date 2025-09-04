/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/PageController", "sap/fe/core/controllerextensions/IntentBasedNavigation", "sap/fe/core/controllerextensions/InternalIntentBasedNavigation", "sap/fe/core/controllerextensions/InternalRouting", "sap/fe/core/controllerextensions/KPIManagement", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/Share", "sap/fe/core/controllerextensions/SideEffects", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/EditState", "sap/fe/core/helpers/MessageStrip", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/library", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/fe/navigation/SelectionVariant", "sap/fe/templates/ListReport/ExtensionAPI", "sap/fe/templates/ListReport/overrides/SideEffects", "sap/fe/templates/TableScroller", "sap/ui/Device", "sap/ui/core/InvisibleMessage", "sap/ui/core/library", "sap/ui/core/mvc/OverrideExecution", "sap/ui/mdc/p13n/StateUtil", "sap/ui/thirdparty/hasher", "./ListReportTemplating", "./overrides/IntentBasedNavigation", "./overrides/Share", "./overrides/ViewState"], function (Log, ObjectPath, ClassSupport, CommonUtils, PageController, IntentBasedNavigation, InternalIntentBasedNavigation, InternalRouting, KPIManagement, Placeholder, Share, SideEffects, ViewState, EditState, MessageStrip, ResourceModelHelper, StableIdHelper, CoreLibrary, ChartUtils, FilterUtils, SelectionVariant, ExtensionAPI, SideEffectsOverride, TableScroller, Device, InvisibleMessage, library, OverrideExecution, StateUtil, hasher, ListReportTemplating, IntentBasedNavigationOverride, ShareOverrides, ViewStateOverrides) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var InvisibleMessageMode = library.InvisibleMessageMode;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var usingExtension = ClassSupport.usingExtension;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const TemplateContentView = CoreLibrary.TemplateContentView,
    InitialLoadMode = CoreLibrary.InitialLoadMode;

  /**
   * Controller class for the list report page, used inside an SAP Fiori elements application.
   * @hideconstructor
   * @public
   */
  let ListReportController = (_dec = defineUI5Class("sap.fe.templates.ListReport.ListReportController"), _dec2 = usingExtension(InternalRouting.override({
    onAfterBinding: function () {
      this.getView().getController()._onAfterBinding();
    }
  })), _dec3 = usingExtension(InternalIntentBasedNavigation.override({
    getEntitySet: function () {
      return this.base.getCurrentEntitySet();
    }
  })), _dec4 = usingExtension(SideEffects.override(SideEffectsOverride)), _dec5 = usingExtension(IntentBasedNavigation.override(IntentBasedNavigationOverride)), _dec6 = usingExtension(Share.override(ShareOverrides)), _dec7 = usingExtension(ViewState.override(ViewStateOverrides)), _dec8 = usingExtension(KPIManagement), _dec9 = usingExtension(Placeholder), _dec10 = publicExtension(), _dec11 = finalExtension(), _dec12 = privateExtension(), _dec13 = extensible("After"), _dec14 = publicExtension(), _dec15 = extensible(OverrideExecution.After), _dec16 = publicExtension(), _dec17 = extensible(OverrideExecution.After), _dec18 = publicExtension(), _dec19 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_PageController) {
    function ListReportController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _PageController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "_routing", _descriptor, _this);
      _initializerDefineProperty(_this, "_intentBasedNavigation", _descriptor2, _this);
      _initializerDefineProperty(_this, "_sideEffects", _descriptor3, _this);
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor4, _this);
      _initializerDefineProperty(_this, "share", _descriptor5, _this);
      _initializerDefineProperty(_this, "viewState", _descriptor6, _this);
      _initializerDefineProperty(_this, "kpiManagement", _descriptor7, _this);
      _initializerDefineProperty(_this, "placeholder", _descriptor8, _this);
      _this.formatters = {
        setALPControlMessageStrip(aIgnoredFields, bIsChart, oApplySupported) {
          let sText = "";
          bIsChart = bIsChart === "true" || bIsChart === true;
          const oFilterBar = this._getFilterBarControl();
          if (oFilterBar && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && bIsChart) {
            const aIgnoredLabels = MessageStrip.getLabels(aIgnoredFields, oFilterBar.data("entityType"), oFilterBar, getResourceModel(oFilterBar));
            const bIsSearchIgnored = !oApplySupported?.enableSearch;
            sText = bIsChart ? MessageStrip.getALPText(aIgnoredLabels, oFilterBar, bIsSearchIgnored) : MessageStrip.getText(aIgnoredLabels, oFilterBar, "");
            return sText;
          }
        }
      };
      _this.handlers = {
        onInlineEditSave() {
          this.inlineEditFlow.inlineEditSave();
        },
        onFilterSearch() {
          const filterBarAPI = this._getFilterBarControl().getParent();
          filterBarAPI.triggerSearch();
        },
        onFiltersChanged(oEvent) {
          const oFilterBar = this._getFilterBarControl();
          if (oFilterBar) {
            const oInternalModelContext = this.getView().getBindingContext("internal");
            // Pending filters into FilterBar to be used for custom views
            this.onPendingFilters();
            if (oInternalModelContext && oEvent.getParameter("conditionsBased")) {
              oInternalModelContext.setProperty("hasPendingFilters", true);
            }
            if (oInternalModelContext) {
              this._storeFilterBarSelectionVariant(oFilterBar, oInternalModelContext);
            }
          }
        },
        onVariantSelected(oEvent) {
          const variantManagement = oEvent.getSource();
          const currentVariantKey = oEvent.getParameter("key");
          const multiModeControl = this._getMultiModeControl();
          if (multiModeControl && !variantManagement?.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
            //Not a Control Variant
            multiModeControl?.invalidateContent();
            multiModeControl?.setFreezeContent(true);
          }

          // setTimeout cause the variant needs to be applied before judging the auto search or updating the app state
          setTimeout(() => {
            const filterBar = this._getFilterBarControl();
            const dynamicPage = this._getDynamicListReportControl();
            const firstEmptyMandatoryField = filterBar?.getFilterItems().find(function (filterItem) {
              return filterItem.getRequired() && filterItem.getConditions().length === 0;
            });
            if (firstEmptyMandatoryField) {
              dynamicPage.setHeaderExpanded(true);
            }
            if (this._shouldAutoTriggerSearch(variantManagement)) {
              // the app state will be updated via onSearch handler
              const filterBarAPI = this._getFilterBarControl().getParent();
              filterBarAPI.triggerSearch();
            } else if (!this._getApplyAutomaticallyOnVariant(variantManagement, currentVariantKey)) {
              multiModeControl?.setFreezeContent(false);
              this.getExtensionAPI().updateAppState();
              dynamicPage.setHeaderExpanded(true);
            }
          }, 0);
        },
        onVariantSaved() {
          //TODO: Should remove this setTimeOut once Variant Management provides an api to fetch the current variant key on save!!!
          setTimeout(() => {
            this.getExtensionAPI().updateAppState();
          }, 1000);
        },
        onSearch() {
          const oFilterBar = this._getFilterBarControl(); // onsearch is called only if the filterbar exists
          const oInternalModelContext = this.getView().getBindingContext("internal");
          const oMdcChart = this.getChartControl();
          const bHideDraft = FilterUtils.getEditStateIsHideDraft(oFilterBar.getConditions());
          oInternalModelContext.setProperty("hasPendingFilters", false);
          oInternalModelContext.setProperty("hideDraftInfo", bHideDraft);
          const dynamicPage = this._getDynamicListReportControl();
          if (!this._getMultiModeControl()) {
            this._updateALPNotApplicableFields(oInternalModelContext, oFilterBar);
          }
          if (oMdcChart) {
            // disable bound actions TODO: this clears everything for the chart?
            oMdcChart.getBindingContext("internal").setProperty("", {});
            const oPageInternalModelContext = oMdcChart.getBindingContext("pageInternal");
            const sTemplateContentView = oPageInternalModelContext.getProperty(`${oPageInternalModelContext.getPath()}/alpContentView`);
            if (sTemplateContentView === TemplateContentView.Chart) {
              this.hasPendingChartChanges = true;
            }
            if (sTemplateContentView === TemplateContentView.Table) {
              this.hasPendingTableChanges = true;
            }
          }

          //logic for expansion or collapse of filter bar starts
          if (!Device.system.desktop && oInternalModelContext.getProperty("searchTriggeredByInitialLoad") === true) {
            if (dynamicPage.getHeaderExpanded() !== false) {
              dynamicPage.setHeaderExpanded(false);
            }
            //setting it to false so that further search or 'Go' triggers won't collapse the filter bar
            oInternalModelContext.setProperty("searchTriggeredByInitialLoad", false);
          }

          // store filter bar conditions to use later while navigation
          StateUtil.retrieveExternalState(oFilterBar).then(oExternalState => {
            this.filterBarConditions = oExternalState.filter;
            return;
          }).catch(function (oError) {
            Log.error("Error while retrieving the external state", oError);
          });
          if (this.getView().getViewData().liveMode === false) {
            this.getExtensionAPI().updateAppState();
          }
          if (Device.system.phone) {
            const oDynamicPage = this._getDynamicListReportControl();
            if (!this._isInitLoadEnabled()) {
              oDynamicPage.setHeaderExpanded(true);
            } else {
              oDynamicPage.setHeaderExpanded(false);
              this.setFilterToggleVisibility(false);
            }
          }
        },
        /**
         * Triggers an outbound navigation when a user chooses the chevron.
         * @param oController
         * @param sOutboundTarget Name of the outbound target (needs to be defined in the manifest)
         * @param oContext The context that contains the data for the target app
         * @param sCreatePath Create path when the chevron is created.
         * @returns Promise which is resolved once the navigation is triggered
         * @final
         */
        async onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath) {
          return oController._intentBasedNavigation.onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath);
        },
        onChartSelectionChanged(oEvent) {
          const oMdcChart = oEvent.getSource().getContent(),
            oTable = this._getTable(),
            aData = oEvent.getParameter("data"),
            oInternalModelContext = this.getView().getBindingContext("internal");
          if (aData) {
            ChartUtils.setChartFilters(oMdcChart);
          }
          const sTemplateContentView = oInternalModelContext.getProperty(`${oInternalModelContext.getPath()}/alpContentView`);
          if (sTemplateContentView === TemplateContentView.Chart) {
            this.hasPendingChartChanges = true;
          } else if (oTable) {
            oTable.rebind();
            this.hasPendingChartChanges = false;
          }
        },
        onSegmentedButtonPressed(oEvent) {
          const selectedKey = oEvent.getParameters().selectedKey || oEvent.getParameters().key;
          const oInternalModelContext = this.getView().getBindingContext("internal");
          oInternalModelContext.setProperty("alpContentView", selectedKey);
          const oChart = this.getChartControl();
          const oTable = this._getTable();
          switch (selectedKey) {
            case TemplateContentView.Table:
              if (oTable) {
                this._updateTable(oTable);
              }
              break;
            case TemplateContentView.Chart:
              if (oChart) {
                this._updateChart(oChart);
              }
              break;
            case TemplateContentView.Hybrid:
              if (oTable) {
                this._updateTable(oTable);
              }
              if (oChart) {
                this._updateChart(oChart);
              }
              break;
            default:
              break;
          }
          this.getExtensionAPI().updateAppState();
        },
        onDynamicPageTitleStateChanged(event) {
          const filterBar = this._getFilterBarControl();
          if (filterBar) {
            this.setFilterToggleVisibility(!!event.getParameter("isExpanded"));
            if (event.getParameter("isExpanded") === false) {
              InvisibleMessage.getInstance().announce(filterBar.getAssignedFiltersText().filtersText, InvisibleMessageMode.Assertive);
            }
          }
        }
      };
      return _this;
    }
    _inheritsLoose(ListReportController, _PageController);
    var _proto = ListReportController.prototype;
    /**
     * Get the extension API for the current page.
     * @public
     * @returns The extension API.
     */
    _proto.getExtensionAPI = function getExtensionAPI() {
      if (!this.extensionAPI) {
        this.extensionAPI = new ExtensionAPI(this);
      }
      return this.extensionAPI;
    };
    _proto.onInit = function onInit() {
      PageController.prototype.onInit.apply(this);
      const oInternalModelContext = this.getView().getBindingContext("internal");
      const filterBar = this._getFilterBarControl();
      if (filterBar) {
        this._storeFilterBarSelectionVariant(filterBar, oInternalModelContext);
      }
      oInternalModelContext.setProperty("hasPendingFilters", true);
      oInternalModelContext.setProperty("hideDraftInfo", false);
      oInternalModelContext.setProperty("uom", {});
      oInternalModelContext.setProperty("scalefactor", {});
      oInternalModelContext.setProperty("scalefactorNumber", {});
      oInternalModelContext.setProperty("currency", {});
      oInternalModelContext.setProperty("isInsightsSupported", false);
      if (this._hasMultiVisualizations()) {
        let alpContentView = this._getDefaultPath();
        if (!Device.system.desktop && alpContentView === TemplateContentView.Hybrid) {
          alpContentView = TemplateContentView.Chart;
        }
        oInternalModelContext.setProperty("alpContentView", alpContentView);
      }

      // Store conditions from filter bar
      // this is later used before navigation to get conditions applied on the filter bar
      this.filterBarConditions = {};

      // As AppStateHandler.applyAppState triggers a navigation we want to make sure it will
      // happen after the routeMatch event has been processed (otherwise the router gets broken)
      this.getAppComponent().getRouterProxy().waitForRouteMatchBeforeNavigation();

      // Configure the initial load settings
      this._setInitLoad();
      const view = this.getView();
      const uiModel = view.getModel("ui");
      const path = `/${view.getId()}`;
      uiModel.setProperty(path, {
        isEditable: false
      });
      view.bindElement({
        path,
        model: "ui"
      });
    };
    _proto.onExit = function onExit() {
      delete this.filterBarConditions;
      if (this.extensionAPI) {
        this.extensionAPI.destroy();
      }
      delete this.extensionAPI;
    };
    _proto._onAfterBinding = function _onAfterBinding() {
      const aTables = this._getControls("table");
      let updateActions = true;
      if (EditState.isEditStateDirty()) {
        this._getMultiModeControl()?.invalidateContent();
        const table = this._getTable();
        const oTableBinding = table?.getRowBinding();
        if (oTableBinding) {
          updateActions = false;
          const tableAPI = table?.getParent();

          // Update the table content using side effects (listBinding.refresh doesn't keep expansion states in a TreeTable)
          CommonUtils.getAppComponent(this.getView()).getRoutingService().waitForBindingCleanup().then(() => {
            oTableBinding.attachEventOnce("dataReceived", () => {
              this._updateTableActions(aTables);
            });
            if (tableAPI.getTableDefinition().control.type === "TreeTable") {
              // As the refresh on a TreeTable uses side-effects, we need to make sure there are no pending changes
              // before the side-effects are queried (e.g. failed PATCH queries that would be resent together with side effects GET)
              this.getModel().resetChanges();
            }
            tableAPI.refresh();
            return;
          }).catch(e => {
            Log.warning("Error while waiting refreshing ListReport table", e);
          });
        }
        EditState.setEditStateProcessed();
      }
      if (updateActions) {
        this._updateTableActions(aTables);
      }
      const internalModelContext = this.getView().getBindingContext("internal");
      if (!internalModelContext.getProperty("initialVariantApplied")) {
        const viewId = this.getView().getId();
        this.pageReady.waitFor(this._applyAppState(viewId));
        internalModelContext.setProperty("initialVariantApplied", true);
      }
      const environmentCapabilities = CommonUtils.getAppComponent(this.getView()).getEnvironmentCapabilities();
      environmentCapabilities.isInsightsEnabled().then(isInsightsEnabled => {
        internalModelContext.setProperty("isInsightsSupported", isInsightsEnabled);
        return;
      }).catch(error => {
        Log.error("Error while checking if insights are enabled", error);
      });
    };
    _proto.onPageReady = async function onPageReady(mParameters) {
      if (mParameters.forceFocus) {
        this._setInitialFocus();
      }
      // Remove the handler on back navigation that displays Draft confirmation
      await this.getAppComponent().getShellServices().setBackNavigation(undefined);
    }

    /**
     * Method called when the content of a custom view used in a list report needs to be refreshed.
     * This happens either when there is a change on the FilterBar and the search is triggered,
     * or when a tab with custom content is selected,
     * or when the view is forced to be refreshed through the Extension API for the list report's public method setTabContentToBeRefreshedOnNextOpening.
     * This method can be overwritten by the controller extension in case of customization.
     * @param mParameters Map containing the filter conditions of the FilterBar, the currentTabID
     * and the view refresh cause (tabChanged, search or forcedRefresh).
     * The map looks like this:
     * <code><pre>
     * 	{
     * 		filterConditions: {
     * 			Country: [
     * 				{
     * 					operator: "EQ"
     *					validated: "NotValidated"
     *					values: ["Germany", ...]
     * 				},
     * 				...
     * 			]
     * 			...
     * 		},
     *		currentTabId: "fe::CustomTab::tab1",
     *		refreshCause: "tabChanged" | "search" | "forcedRefresh"
     *	}
     * </pre></code>
     * @public
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onViewNeedsRefresh = function onViewNeedsRefresh(mParameters) {
      /* To be overriden */
    }

    /**
     * Method called when a filter or search value has been changed in the FilterBar,
     * but has not been validated yet by the end user (with the 'Go' or 'Search' button).
     * Typically, the content of the current tab is greyed out until the filters are validated.
     * This method can be overwritten by the controller extension in case of customization.
     * @public
     */;
    _proto.onPendingFilters = function onPendingFilters() {
      /* To be overriden */
    };
    _proto.getCurrentEntitySet = function getCurrentEntitySet() {
      return this._getTable()?.data("targetCollectionPath").slice(1);
    }

    /**
     * Method called when the 'Clear' button on the FilterBar is pressed.
     * @public
     */;
    _proto.onAfterClear = function onAfterClear() {
      /* To be overriden */
    }

    /**
     * This method initiates the update of the enabled state of the DataFieldForAction and the visible state of the DataFieldForIBN buttons.
     * @param aTables Array of tables in the list report
     */;
    _proto._updateTableActions = function _updateTableActions(aTables) {
      let aIBNActions = [];
      aTables.forEach(function (oTable) {
        aIBNActions = CommonUtils.getIBNActions(oTable, aIBNActions);
      });
      CommonUtils.updateDataFieldForIBNButtonsVisibility(aIBNActions, this.getView());
      CommonUtils.updateMenuButtonVisiblity(aIBNActions);
    }

    /**
     * This method scrolls to a specific row on all the available tables.
     * @param sRowPath The path of the table row context to be scrolled to
     */;
    _proto._scrollTablesToRow = function _scrollTablesToRow(sRowPath) {
      this._getControls("table").forEach(function (oTable) {
        TableScroller.scrollTableToRow(oTable, sRowPath);
      });
    }

    /**
     * Sets a silent focus on the filter field. Suppresses the opening of the type-ahead popup.
     * @param filterField The field where the focus should be set after the initial load
     */;
    _proto._focusSilent = function _focusSilent(filterField) {
      const focusInfo = filterField.getFocusInfo();
      focusInfo.targetInfo = {
        silent: true
      };
      filterField.focus(focusInfo);
    }

    /**
     * This method sets the initial focus in a list report based on the User Experience guidelines.
     *
     */;
    _proto._setInitialFocus = function _setInitialFocus() {
      const dynamicPage = this._getDynamicListReportControl(),
        isHeaderExpanded = dynamicPage.getHeaderExpanded(),
        filterBar = this._getFilterBarControl();
      if (filterBar && !this._isFilterBarHiddenUsed()) {
        //Enabling mandatory filter fields message dialog
        if (!filterBar.getShowMessages()) {
          filterBar.setShowMessages(true);
        }
        if (isHeaderExpanded) {
          const firstEmptyMandatoryField = filterBar.getFilterItems().find(function (oFilterItem) {
            return oFilterItem.getRequired() && oFilterItem.getConditions().length === 0;
          });
          //Focusing on the first empty mandatory filter field, or on the first filter field if the table data is loaded
          // Do a "silent" focus for FilterField, by adding the silent attribute. The silent attribute suppresses typeahead opening.
          if (firstEmptyMandatoryField) {
            if (firstEmptyMandatoryField.isA("sap.ui.mdc.FilterField")) {
              this._focusSilent(firstEmptyMandatoryField);
            } else {
              firstEmptyMandatoryField.focus();
            }
          } else if (this._isInitLoadEnabled() && filterBar.getFilterItems().length > 0) {
            // Add check for available filterItems
            const fieldToFocus = filterBar.getFilterItems()[0];
            if (fieldToFocus.isA("sap.ui.mdc.FilterField")) {
              this._focusSilent(fieldToFocus);
            } else {
              fieldToFocus.focus();
            }
          } else {
            //Focusing on the Go button
            this.getView().byId(`${this._getFilterBarControlId()}-btnSearch`)?.focus();
          }
        } else if (this._isInitLoadEnabled()) {
          this._getTable()?.focusRow(0).catch(function (error) {
            Log.error("Error while setting initial focus on the table ", error);
          });
        }
      } else {
        this._getTable()?.focusRow(0).catch(function (error) {
          Log.error("Error while setting initial focus on the table ", error);
        });
      }
    };
    _proto._getPageTitleInformation = function _getPageTitleInformation() {
      const oManifestEntry = this.getAppComponent().getManifestEntry("sap.app");
      return {
        title: oManifestEntry.title,
        subtitle: oManifestEntry.subTitle || "",
        intent: "",
        icon: ""
      };
    };
    _proto._getFilterBarControl = function _getFilterBarControl() {
      return this.getView().byId(this._getFilterBarControlId());
    };
    _proto._getDynamicListReportControl = function _getDynamicListReportControl() {
      return this.getView().byId(this._getDynamicListReportControlId());
    };
    _proto._getAdaptationFilterBarControl = function _getAdaptationFilterBarControl() {
      // If the adaptation filter bar is part of the DOM tree, the "Adapt Filter" dialog is open,
      // and we return the adaptation filter bar as an active control (visible for the user)
      const adaptationFilterBar = this._getFilterBarControl().getInbuiltFilter?.();
      return adaptationFilterBar?.getParent() ? adaptationFilterBar : undefined;
    };
    _proto._applyAppState = async function _applyAppState(viewId) {
      await this.getAppComponent().getAppStateHandler().applyAppState(viewId, this.getView());
      const oFilterBar = this._getFilterBarControl();
      if (oFilterBar) {
        oFilterBar.setSuspendSelection(false);
      } else if (this._isFilterBarHidden()) {
        const oInternalModelContext = this.getView().getBindingContext("internal");
        oInternalModelContext.setProperty("hasPendingFilters", false);
        if (this._isMultiMode()) {
          this._getMultiModeControl().setCountsOutDated(true);
        }
      }
    };
    _proto._getSegmentedButton = function _getSegmentedButton(sControl) {
      const sSegmentedButtonId = (sControl === "Chart" ? this.getChartControl() : this._getTable())?.data("segmentedButtonId");
      return this.getView().byId(sSegmentedButtonId);
    };
    _proto._getControlFromPageModelProperty = function _getControlFromPageModelProperty(sPath) {
      const controlId = this._getPageModel()?.getProperty(sPath);
      return controlId ? this.getView().byId(controlId) : undefined;
    };
    _proto._getDynamicListReportControlId = function _getDynamicListReportControlId() {
      return this._getPageModel()?.getProperty("/dynamicListReportId") || "";
    };
    _proto._getFilterBarControlId = function _getFilterBarControlId() {
      return this._getPageModel()?.getProperty("/filterBarId") || "";
    };
    _proto.getChartControl = function getChartControl() {
      return this._getControlFromPageModelProperty("/singleChartId");
    };
    _proto._getVisualFilterBarControl = function _getVisualFilterBarControl() {
      const sVisualFilterBarId = StableIdHelper.generate(["visualFilter", this._getFilterBarControlId()]);
      return sVisualFilterBarId ? this.getView().byId(sVisualFilterBarId) : undefined;
    };
    _proto._getFilterBarVariantControl = function _getFilterBarVariantControl() {
      return this._getControlFromPageModelProperty("/variantManagement/id");
    };
    _proto._getMultiModeControl = function _getMultiModeControl() {
      return this.getView().byId("fe::TabMultipleMode::Control");
    };
    _proto._getIconTabBar = function _getIconTabBar() {
      return this.getView().byId("fe::TabMultipleMode");
    };
    _proto._getTable = function _getTable() {
      if (this._isMultiMode()) {
        const oControl = this._getMultiModeControl()?.getSelectedInnerControl()?.content;
        return oControl?.isA("sap.ui.mdc.Table") ? oControl : undefined;
      } else {
        return this._getControlFromPageModelProperty("/singleTableId");
      }
    };
    _proto._getControls = function _getControls(sKey) {
      if (this._isMultiMode()) {
        const aControls = [];
        const oTabMultiMode = this._getMultiModeControl().content;
        oTabMultiMode.getItems().forEach(oItem => {
          const oControl = this.getView().byId(oItem.getKey());
          if (oControl && sKey) {
            if (oItem.getKey().includes(`fe::${sKey}`)) {
              aControls.push(oControl);
            }
          } else if (oControl !== undefined && oControl !== null) {
            aControls.push(oControl);
          }
        });
        return aControls;
      } else if (sKey === "Chart") {
        const oChart = this.getChartControl();
        return oChart ? [oChart] : [];
      } else {
        const oTable = this._getTable();
        return oTable ? [oTable] : [];
      }
    };
    _proto._getDefaultPath = function _getDefaultPath() {
      const defaultPath = ListReportTemplating.getDefaultPath(this._getPageModel()?.getProperty("/views") || []);
      switch (defaultPath) {
        case "primary":
          return TemplateContentView.Chart;
        case "secondary":
          return TemplateContentView.Table;
        case "both":
        default:
          return TemplateContentView.Hybrid;
      }
    }

    /**
     * Method to know if ListReport is configured with Multiple Table mode.
     * @returns Is Multiple Table mode set?
     */;
    _proto._isMultiMode = function _isMultiMode() {
      return !!this._getPageModel()?.getProperty("/multiViewsControl");
    }

    /**
     * Method to know if ListReport is configured to load data at start up.
     * @returns Is InitLoad enabled?
     */;
    _proto._isInitLoadEnabled = function _isInitLoadEnabled() {
      const initLoadMode = this.getView().getViewData().initialLoad;
      return initLoadMode === InitialLoadMode.Enabled;
    };
    _proto._hasMultiVisualizations = function _hasMultiVisualizations() {
      return this._getPageModel()?.getProperty("/hasMultiVisualizations");
    }

    /**
     * Method to suspend search on the filter bar. The initial loading of data is disabled based on the manifest configuration InitLoad - Disabled/Auto.
     * It is enabled later when the view state is set, when it is possible to realize if there are default filters.
     */;
    _proto._disableInitLoad = function _disableInitLoad() {
      const filterBar = this._getFilterBarControl();
      // check for filter bar hidden
      if (filterBar) {
        filterBar.setSuspendSelection(true);
      }
    }

    /**
     * Method called by flex to determine if the applyAutomatically setting on the variant is valid.
     * Called only for Standard Variant and only when there is display text set for applyAutomatically (FE only sets it for Auto).
     * @returns Boolean true if data should be loaded automatically, false otherwise
     */;
    _proto._applyAutomaticallyOnStandardVariant = function _applyAutomaticallyOnStandardVariant() {
      // We always return false and take care of it when view state is set
      return false;
    }

    /**
     * Configure the settings for initial load based on
     * - manifest setting initLoad - Enabled/Disabled/Auto
     * - user's setting of applyAutomatically on variant
     * - if there are default filters
     * We disable the filter bar search at the beginning and enable it when view state is set.
     */;
    _proto._setInitLoad = function _setInitLoad() {
      // if initLoad is Disabled or Auto, switch off filter bar search temporarily at start
      if (!this._isInitLoadEnabled()) {
        this._disableInitLoad();
      }
      // set hook for flex for when standard variant is set (at start or by user at runtime)
      // required to override the user setting 'apply automatically' behaviour if there are no filters
      const variantManagementId = ListReportTemplating.getVariantBackReference(this.getView().getViewData(), this._getPageModel()?.getData());
      const variantManagement = variantManagementId && this.getView().byId(variantManagementId);
      if (variantManagement) {
        variantManagement?.registerApplyAutomaticallyOnStandardVariant?.(this._applyAutomaticallyOnStandardVariant.bind(this));
      }
    };
    _proto._setShareModel = function _setShareModel() {
      // TODO: deactivated for now - currently there is no _templPriv anymore, to be discussed
      // this method is currently not called anymore from the init method

      const fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
      //var oManifest = this.getOwnerComponent().getAppComponent().getMetadata().getManifestEntry("sap.ui");
      //var sBookmarkIcon = (oManifest && oManifest.icons && oManifest.icons.icon) || "";

      //shareModel: Holds all the sharing relevant information and info used in XML view
      const oShareInfo = {
        bookmarkTitle: document.title,
        //To name the bookmark according to the app title.
        bookmarkCustomUrl: function () {
          const sHash = hasher.getHash();
          return sHash ? `#${sHash}` : window.location.href;
        },
        /*
        				To be activated once the FLP shows the count - see comment above
        				bookmarkServiceUrl: function() {
        					//var oTable = oTable.getInnerTable(); oTable is already the sap.fe table (but not the inner one)
        					// we should use table.getListBindingInfo instead of the binding
        					var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
        					return oBinding ? fnGetDownloadUrl(oBinding) : "";
        				},*/
        isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive()
      };
      const oTemplatePrivateModel = this.getOwnerComponent().getModel("_templPriv");
      oTemplatePrivateModel.setProperty("/listReport/share", oShareInfo);
    }

    /**
     * Method to update the local UI model of the page with the fields that are not applicable to the filter bar (this is specific to the ALP scenario).
     * @param oInternalModelContext The internal model context
     * @param oFilterBar MDC filter bar
     */;
    _proto._updateALPNotApplicableFields = function _updateALPNotApplicableFields(oInternalModelContext, oFilterBar) {
      const mCache = {};
      const ignoredFields = {},
        aTables = this._getControls("table"),
        aCharts = this._getControls("Chart");
      if (!aTables.length || !aCharts.length) {
        // If there's not a table and a chart, we're not in the ALP case
        return;
      }

      // For the moment, there's nothing for tables...
      aCharts.forEach(function (oChart) {
        const sChartEntityPath = oChart.data("targetCollectionPath"),
          sChartEntitySet = sChartEntityPath.slice(1),
          sCacheKey = `${sChartEntitySet}Chart`;
        if (!mCache[sCacheKey]) {
          mCache[sCacheKey] = FilterUtils.getNotApplicableFilters(oFilterBar, oChart);
        }
        ignoredFields[sCacheKey] = mCache[sCacheKey];
      });
      oInternalModelContext.setProperty("controls/ignoredFields", ignoredFields);
    }

    /**
     * Provides the setting whether FilterBar is hidden based on the manifest setting 'hideFilterBar'.
     * Should be used in combination with _isFilterBarHiddenUsed as it may have overridden this setting.
     * @returns True if the FilterBar is hidden, false if unknown
     */;
    _proto._isFilterBarHidden = function _isFilterBarHidden() {
      return this.getView().getViewData().hideFilterBar || false;
    }

    /**
     * Provides the setting whether FilterBar is hidden but still exists based on the manifest setting 'useHiddenFilterBar'.
     * Should be used in combination with _isFilterBarHidden as it can also hide the FilterBar.
     * @returns True if the FilterBar is hidden, false if unknown
     */;
    _proto._isFilterBarHiddenUsed = function _isFilterBarHiddenUsed() {
      return this.getView().getViewData().useHiddenFilterBar || false;
    };
    _proto._getApplyAutomaticallyOnVariant = function _getApplyAutomaticallyOnVariant(variantManagement, key) {
      if (!variantManagement || !key) {
        return false;
      }
      const variants = variantManagement.getVariants();
      const currentVariant = variants.find(function (variant) {
        return variant && variant.getKey() === key;
      });
      return currentVariant && currentVariant.getProperty("executeOnSelect") || false;
    };
    _proto._shouldAutoTriggerSearch = function _shouldAutoTriggerSearch(oVM) {
      if (this.getView().getViewData().initialLoad === InitialLoadMode.Auto && (!oVM || oVM.getStandardVariantKey() === oVM.getCurrentVariantKey())) {
        const oFilterBar = this._getFilterBarControl();
        if (oFilterBar) {
          const oConditions = oFilterBar.getConditions();
          for (const sKey in oConditions) {
            // ignore filters starting with $ (e.g. $search, $editState)
            if (oVM && !sKey.startsWith("$") && Array.isArray(oConditions[sKey]) && oConditions[sKey].length) {
              // load data as per user's setting of applyAutomatically on the variant
              const standardVariant = oVM.getVariants().find(variant => {
                return variant.getKey() === oVM.getCurrentVariantKey();
              });
              return standardVariant && standardVariant.getExecuteOnSelect();
            }
          }
        }
      }
      return false;
    };
    _proto._updateTable = function _updateTable(oTable) {
      if (!oTable.isTableBound() || this.hasPendingChartChanges) {
        oTable.rebind();
        this.hasPendingChartChanges = false;
      }
    };
    _proto._updateChart = function _updateChart(oChart) {
      const oInnerChart = oChart.getControlDelegate()._getChart(oChart);
      if (!(oInnerChart && oInnerChart.isBound("data")) || this.hasPendingTableChanges) {
        oChart.getControlDelegate().rebind(oChart, oInnerChart.getBindingInfo("data"));
        this.hasPendingTableChanges = false;
      }
    }

    /**
     * Set the visibility of the filter toggle button.
     * @param buttonVisible Filter toggle button visibility
     */;
    _proto.setFilterToggleVisibility = function setFilterToggleVisibility(buttonVisible) {
      const filterBar = this._getFilterBarControl();
      filterBar?.getSegmentedButton()?.setVisible(buttonVisible);
    };
    /**
     * Method to update the local UI model of the page with the Selection Variant.
     * @param filterBar MDC filter bar
     * @param internalModelContext The internal model context
     */
    _proto._storeFilterBarSelectionVariant = async function _storeFilterBarSelectionVariant(filterBar, internalModelContext) {
      try {
        const filterBarAPI = filterBar.getParent();
        const sv = await filterBarAPI.getSelectionVariant();
        internalModelContext.setProperty("filterBarSelectionVariant", sv);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE : Error fetching selection variant on filter change: ${message}`);
      }
    }

    /**
     * Method to get the Selection Variant from internal model.
     * @returns SelectionVariant
     */;
    _proto.getFilterBarSelectionVariant = function getFilterBarSelectionVariant() {
      const internalModelContext = this.getView().getBindingContext("internal");
      return internalModelContext?.getProperty("filterBarSelectionVariant") || new SelectionVariant();
    };
    return ListReportController;
  }(PageController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_routing", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_intentBasedNavigation", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_sideEffects", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "kpiManagement", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "placeholder", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "getExtensionAPI", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "getExtensionAPI"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPageReady", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "onPageReady"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onViewNeedsRefresh", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "onViewNeedsRefresh"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPendingFilters", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "onPendingFilters"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterClear", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterClear"), _class2.prototype), _class2)) || _class);
  return ListReportController;
}, false);
//# sourceMappingURL=ListReportController-dbg.controller.js.map

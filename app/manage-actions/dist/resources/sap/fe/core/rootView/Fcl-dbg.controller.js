/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/f/FlexibleColumnLayoutSemanticHelper", "sap/f/library", "sap/fe/base/ClassSupport", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ManifestHelper", "sap/m/Button", "sap/m/FlexBox", "sap/m/IllustratedMessage", "sap/m/Page", "../CommonUtils", "./RootViewBaseController"], function (Log, FlexibleColumnLayoutSemanticHelper, fLibrary, ClassSupport, ViewState, KeepAliveHelper, ManifestHelper, Button, FlexBox, IllustratedMessage, Page, CommonUtils, BaseController) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var getRouteTargetName = ManifestHelper.getRouteTargetName;
  var usingExtension = ClassSupport.usingExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const LayoutType = fLibrary.LayoutType;
  /**
   * Base controller class for your own root view with an sap.f.FlexibleColumnLayout control.
   *
   * By using or extending this controller, you can use your own root view with the sap.fe.core.AppComponent and
   * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
   * @hideconstructor
   * @public
   * @since 1.110.0
   */
  let FclController = (_dec = defineUI5Class("sap.fe.core.rootView.Fcl"), _dec2 = usingExtension(ViewState.override({
    applyInitialStateOnly: function () {
      return false;
    },
    adaptBindingRefreshControls: function (aControls) {
      this.getView().getController()._getAllVisibleViews().forEach(function (oChildView) {
        const pChildView = Promise.resolve(oChildView);
        aControls.push(pChildView);
      });
    },
    adaptStateControls: function (aStateControls) {
      this.getView().getController()._getAllVisibleViews().forEach(function (oChildView) {
        const pChildView = Promise.resolve(oChildView);
        aStateControls.push(pChildView);
      });
    },
    onRestore: function () {
      const fclController = this.getView().getController();
      const appContentContainer = fclController.getAppContentContainer();
      const internalModel = appContentContainer.getModel("internal");
      const pages = internalModel.getProperty("/pages");
      for (const componentId in pages) {
        internalModel.setProperty(`/pages/${componentId}/restoreStatus`, "pending");
      }
      fclController.onContainerReady();
    },
    onSuspend: function () {
      const fclController = this.getView().getController();
      const fclControl = fclController.getFclControl();
      const beginColumnPages = fclControl.getBeginColumnPages();
      const midColumnPages = fclControl.getMidColumnPages();
      const endColumnPages = fclControl.getEndColumnPages();
      const pages = [].concat(beginColumnPages, midColumnPages, endColumnPages);
      fclController.getViewsFromPages(pages).forEach(view => {
        const controller = view.getController();
        if (controller?.viewState?.onSuspend) {
          controller.viewState.onSuspend();
        }
      });
    }
  })), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    function FclController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "viewState", _descriptor, _this);
      _this._oTargetsAggregation = {};
      _this._oTargetsFromRoutePattern = {};
      _this.messagePages = [undefined, undefined, undefined];
      return _this;
    }
    _inheritsLoose(FclController, _BaseController);
    var _proto = FclController.prototype;
    _proto.onInit = function onInit() {
      _BaseController.prototype.onInit.call(this);
      this._internalInit();
      this.setColumnDistributionModel();
    };
    _proto.manageDataReceived = function manageDataReceived(event) {
      if (event.getParameter("error")) {
        const path = event.getParameter("path");
        const targetedView = this._getAllVisibleViews().find(view => view.getBindingContext()?.getPath() === path);
        // We need to manage error when the request is related to a form  into an ObjectPage
        if (path && targetedView?.getBindingContext()?.isKeepAlive()) {
          targetedView.getController()._routing.onDataReceived(event);
        }
      }
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this.getRouter().attachBeforeRouteMatched(this._updateViewForNavigatedRowsComputation, this);
      _BaseController.prototype.attachRouteMatchers.call(this);
      this._internalInit();
      this.getRouter().attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
      this.getRouter().attachRouteMatched(this.onRouteMatched, this);
      this.getFclControl().attachStateChange(this._saveLayout, this);
    };
    _proto._internalInit = function _internalInit() {
      if (this._oRouterProxy) {
        return; // Already initialized
      }
      this.sCurrentRouteName = "";
      this.sCurrentArguments = {};
      const oAppComponent = this.getAppComponent();
      const oDataModel = this.getAppComponent().getModel();
      oDataModel?.attachEvent("dataReceived", this.manageDataReceived.bind(this));
      this._oRouterProxy = oAppComponent.getRouterProxy();

      // Get FCL configuration in the manifest
      this._oFCLConfig = {
        maxColumnsCount: 3
      };
      const oRoutingConfig = oAppComponent.getManifest()["sap.ui5"].routing;
      if (oRoutingConfig?.config?.flexibleColumnLayout) {
        const oFCLManifestConfig = oRoutingConfig.config.flexibleColumnLayout;

        // Default layout for 2 columns
        if (oFCLManifestConfig.defaultTwoColumnLayoutType) {
          this._oFCLConfig.defaultTwoColumnLayoutType = oFCLManifestConfig.defaultTwoColumnLayoutType;
        }

        // Default layout for 3 columns
        if (oFCLManifestConfig.defaultThreeColumnLayoutType) {
          this._oFCLConfig.defaultThreeColumnLayoutType = oFCLManifestConfig.defaultThreeColumnLayoutType;
        }

        // Limit FCL to 2 columns ?
        if (oFCLManifestConfig.limitFCLToTwoColumns === true) {
          this._oFCLConfig.maxColumnsCount = 2;
        }
      }
      if (oRoutingConfig?.config?.controlAggregation) {
        this._oFCLConfig.defaultControlAggregation = oRoutingConfig.config.controlAggregation;
      }
      this._initializeTargetAggregation(oAppComponent);
      this._initializeRoutesInformation(oAppComponent);
      this.getFclControl().attachStateChange(this.onStateChanged, this);
      this.getFclControl().attachAfterEndColumnNavigate(this.onStateChanged, this);
    };
    _proto.getFclControl = function getFclControl() {
      return this.getAppContentContainer();
    };
    _proto.getFclConfig = function getFclConfig() {
      return this._oFCLConfig;
    };
    _proto._saveLayout = function _saveLayout(oEvent) {
      this.sPreviousLayout = oEvent.getParameters().layout;
    }

    /**
     * Get the additional view (on top of the visible views), to be able to compute the latest table navigated rows of
     * the most right visible view after a nav back or column fullscreen.
     *
     */;
    _proto._updateViewForNavigatedRowsComputation = function _updateViewForNavigatedRowsComputation() {
      const allVisibleViewsBeforeRouteMatched = this._getAllVisibleViews(this.sPreviousLayout);
      const rightMostViewBeforeRouteMatched = allVisibleViewsBeforeRouteMatched.length ? allVisibleViewsBeforeRouteMatched[allVisibleViewsBeforeRouteMatched.length - 1] : undefined;
      this.getRouter().attachEventOnce("routeMatched", event => {
        const views = event.getParameter("views");
        const rightMostViewCurrent = this.getViewFromContainer(views[views.length - 1]);
        if (rightMostViewBeforeRouteMatched && rightMostViewCurrent) {
          const viewLevelBefore = rightMostViewBeforeRouteMatched.getViewData()?.viewLevel;
          const viewLevelAfter = rightMostViewCurrent.getViewData()?.viewLevel;

          // Navigation forward from L2 to view level L3 (FullScreenLayout):
          if (viewLevelAfter === this._oFCLConfig.maxColumnsCount) {
            this.oAdditionalViewForNavRowsComputation = rightMostViewCurrent;
          }
          // Navigations backward from L3 down to L2, L1, L0 (ThreeColumn layout):
          if (viewLevelBefore !== undefined && viewLevelAfter !== undefined && viewLevelBefore < this._oFCLConfig.maxColumnsCount && viewLevelBefore > viewLevelAfter && rightMostViewCurrent !== rightMostViewBeforeRouteMatched) {
            this.oAdditionalViewForNavRowsComputation = rightMostViewBeforeRouteMatched;
          }
        }
      });
    };
    _proto.getViewForNavigatedRowsComputation = function getViewForNavigatedRowsComputation() {
      return this.oAdditionalViewForNavRowsComputation;
    };
    _proto.onExit = function onExit() {
      this.getRouter().detachRouteMatched(this.onRouteMatched, this);
      this.getRouter().detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
      this.getFclControl().detachStateChange(this.onStateChanged, this);
      this.getFclControl().detachAfterEndColumnNavigate(this.onStateChanged, this);
      BaseController.prototype.onExit.bind(this)();
    }

    /**
     * Check if the FCL component is enabled.
     * @returns `true` since we are in FCL scenario
     * @final
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      return true;
    }

    /**
     * Method that creates a new Page to display the IllustratedMessage containing the current error.
     * @param errorMessage
     * @param parameters
     * @param fclLevel
     * @returns A promise that creates a Page to display the error
     */;
    _proto.displayErrorPage = async function displayErrorPage(errorMessage, parameters) {
      let fclLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      return new Promise(async (resolve, reject) => {
        try {
          const fclControl = this.getFclControl();

          // Manage the old API where the FCL level was passed in the parameters
          const legacyParameters = parameters;
          if (legacyParameters.FCLLevel !== undefined && fclLevel === 0) {
            fclLevel = legacyParameters.FCLLevel;
          }
          if (this._oFCLConfig && fclLevel >= this._oFCLConfig.maxColumnsCount) {
            fclLevel = this._oFCLConfig.maxColumnsCount - 1;
          }
          if (fclLevel < 0 || fclLevel > 2) {
            fclLevel = 0;
          }
          let messagePage = this.messagePages[fclLevel];
          if (!messagePage) {
            messagePage = new Page({
              showHeader: false
            });
            this.messagePages[fclLevel] = messagePage;
            switch (fclLevel) {
              case 0:
                fclControl.addBeginColumnPage(messagePage);
                break;
              case 1:
                fclControl.addMidColumnPage(messagePage);
                break;
              default:
                fclControl.addEndColumnPage(messagePage);
            }
          }
          let fromPage;
          const header = new FlexBox({
            alignItems: "Start",
            justifyContent: "End",
            items: [new Button({
              type: "Transparent",
              icon: "sap-icon://decline",
              tooltip: "{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}",
              press: () => {
                if (parameters.handleShellBack === true) {
                  fclControl.to(fromPage.getId(), {}, {});
                } else {
                  window.history.back();
                }
              }
            }).addStyleClass("sapUiLargeMarginEnd")]
          });
          const illustratedMessage = new IllustratedMessage({
            title: errorMessage,
            description: parameters.description ?? "",
            illustrationType: parameters.errorType ? `sapIllus-${parameters.errorType}` : "sapIllus-UnableToLoad"
          });
          messagePage.removeAllContent();
          messagePage.addContent(header);
          messagePage.addContent(illustratedMessage);
          let afterNavigateEventName;
          switch (fclLevel) {
            case 0:
              fromPage = fclControl.getCurrentBeginColumnPage();
              afterNavigateEventName = "afterBeginColumnNavigate";
              break;
            case 1:
              fromPage = fclControl.getCurrentMidColumnPage();
              afterNavigateEventName = "afterMidColumnNavigate";
              break;
            default:
              fromPage = fclControl.getCurrentEndColumnPage();
              afterNavigateEventName = "afterEndColumnNavigate";
          }
          if (parameters.handleShellBack === true) {
            const oAppComponent = CommonUtils.getAppComponent(fromPage);
            await oAppComponent.getShellServices().setBackNavigation(async function () {
              fclControl.to(fromPage.getId(), {}, {});
              await oAppComponent.getShellServices().setBackNavigation();
            });
          }
          const fromView = this.getViewFromContainer(fromPage);
          fclControl.attachEventOnce(afterNavigateEventName, _event => {
            if (fromView && fromView.isA("sap.ui.core.mvc.View")) {
              fromView.getController().pageReady?.forcePageReady();
            }
            resolve(true);
          });
          fclControl.to(messagePage.getId(), {}, {});
        } catch (e) {
          reject(false);
          Log.info(`${e}`);
        }
      });
    }

    /**
     * Initialize the object _oTargetsAggregation that defines for each route the relevant aggregation and pattern.
     * @param oAppComponent Reference to the AppComponent
     */;
    _proto._initializeTargetAggregation = function _initializeTargetAggregation(oAppComponent) {
      const oManifest = oAppComponent.getManifest(),
        oTargets = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.targets : null;
      this._oTargetsAggregation = {};
      if (oTargets) {
        Object.keys(oTargets).forEach(sTargetName => {
          const oTarget = oTargets[sTargetName];
          if (oTarget.controlAggregation) {
            this._oTargetsAggregation[sTargetName] = {
              aggregation: oTarget.controlAggregation,
              pattern: oTarget.contextPattern
            };
          } else {
            this._oTargetsAggregation[sTargetName] = {
              aggregation: "page",
              pattern: null
            };
          }
        });
      }
    }

    /**
     * Initializes the mapping between a route (identifed as its pattern) and the corresponding targets
     * @param oAppComponent ref to the AppComponent
     */;
    _proto._initializeRoutesInformation = function _initializeRoutesInformation(oAppComponent) {
      const oManifest = oAppComponent.getManifest(),
        aRoutes = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.routes : null;
      this._oTargetsFromRoutePattern = {};
      if (aRoutes) {
        aRoutes.forEach(route => {
          if (route.pattern) {
            this._oTargetsFromRoutePattern[route.pattern] = route.target;
          }
        });
      }
    };
    _proto.getCurrentArgument = function getCurrentArgument() {
      return this.sCurrentArguments;
    };
    _proto.getCurrentRouteName = function getCurrentRouteName() {
      return this.sCurrentRouteName;
    }

    /**
     * Getter for oTargetsAggregation array.
     * @returns The _oTargetsAggregation array
     */;
    _proto.getTargetAggregation = function getTargetAggregation() {
      return this._oTargetsAggregation;
    }

    /**
     * Function triggered by the router RouteMatched event.
     * @param oEvent
     */;
    _proto.onRouteMatched = function onRouteMatched(oEvent) {
      const sRouteName = oEvent.getParameter("name");

      // Save the current/previous routes and arguments
      this.sCurrentRouteName = sRouteName;
      this.sCurrentArguments = oEvent.getParameter("arguments");
    }

    /**
     * This function is triggering the table scroll to the navigated row after each layout change.
     *
     */;
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      const aViews = this._getAllVisibleViews();
      //The scrolls are triggered only if the layout is with several columns or when switching the mostRight column in full screen
      if (aViews.length > 1 || aViews.length && aViews[0].getViewData().viewLevel < this._oFCLConfig.maxColumnsCount) {
        const oAdditionalView = this.getViewForNavigatedRowsComputation();
        if (oAdditionalView && !aViews.includes(oAdditionalView)) {
          aViews.push(oAdditionalView);
        }
        for (let index = aViews.length - 1; index > 0; index--) {
          const oView = aViews[index],
            oPreviousView = aViews[index - 1];
          const bindingContext = oView.getBindingContext();
          const previousViewController = oPreviousView.getController();
          if (bindingContext && previousViewController._scrollTablesToRow) {
            previousViewController._scrollTablesToRow(bindingContext.getPath());
          }
        }
      }
    }

    /**
     * Function triggered by the FCL StateChanged event.
     * @param oEvent
     */;
    _proto.onStateChanged = function onStateChanged(oEvent) {
      const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow");
      if (this.sCurrentArguments !== undefined) {
        if (!this.sCurrentArguments["?query"]) {
          this.sCurrentArguments["?query"] = {};
        }
        this.sCurrentArguments["?query"].layout = oEvent.getParameter("layout");
      }
      this._forceModelContextChangeOnBreadCrumbs(oEvent);

      // Replace the URL with the new layout if a navigation arrow was used
      if (bIsNavigationArrow && this.sCurrentRouteName) {
        this._oRouterProxy.navTo(this.sCurrentRouteName, this.sCurrentArguments);
      }
      const oView = this.getRightmostView();
      if (oView) {
        this.computeTitleHierarchy(oView);
      }
    }

    /**
     * Function to fire ModelContextChange event on all breadcrumbs ( on each ObjectPages).
     * @param oEvent
     */;
    _proto._forceModelContextChangeOnBreadCrumbs = function _forceModelContextChangeOnBreadCrumbs(oEvent) {
      //force modelcontextchange on ObjectPages to refresh the breadcrumbs link hrefs
      const oFcl = oEvent.getSource();
      let oPages = [];
      oPages = oPages.concat(oFcl.getBeginColumnPages()).concat(oFcl.getMidColumnPages()).concat(oFcl.getEndColumnPages());
      oPages.forEach(oPage => {
        const oView = this.getViewFromContainer(oPage);
        const oBreadCrumbs = oView?.byId && oView.byId("breadcrumbs");
        if (oBreadCrumbs) {
          oBreadCrumbs.fireModelContextChange();
        }
      });
    }

    /**
     * Function triggered to update the Share button Visibility.
     * @param viewColumn Name of the current column ("beginColumn", "midColumn", "endColumn")
     * @param sLayout The current layout used by the FCL
     * @returns The share button visibility
     */;
    _proto._updateShareButtonVisibility = function _updateShareButtonVisibility(viewColumn, sLayout) {
      let bShowShareIcon;
      switch (sLayout) {
        case "OneColumn":
          bShowShareIcon = viewColumn === "beginColumn";
          break;
        case "MidColumnFullScreen":
        case "ThreeColumnsBeginExpandedEndHidden":
        case "ThreeColumnsMidExpandedEndHidden":
        case "TwoColumnsBeginExpanded":
        case "TwoColumnsMidExpanded":
          bShowShareIcon = viewColumn === "midColumn";
          break;
        case "EndColumnFullScreen":
        case "ThreeColumnsEndExpanded":
        case "ThreeColumnsMidExpanded":
          bShowShareIcon = viewColumn === "endColumn";
          break;
        default:
          bShowShareIcon = false;
      }
      return bShowShareIcon;
    };
    _proto._updateEditButtonVisiblity = function _updateEditButtonVisiblity(viewColumn, sLayout) {
      const hiddenDraft = this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
      let bEditButtonVisible = true;
      switch (viewColumn) {
        case "midColumn":
          switch (sLayout) {
            case "TwoColumnsMidExpanded":
            case "ThreeColumnsMidExpandedEndHidden":
            case "ThreeColumnsBeginExpandedEndHidden":
            case "TwoColumnsBeginExpanded":
              if (!hiddenDraft) {
                bEditButtonVisible = false;
              }
              break;
            case "ThreeColumnsMidExpanded":
            case "ThreeColumnsEndExpanded":
              bEditButtonVisible = false;
              break;
          }
          break;
        case "endColumn":
          switch (sLayout) {
            case "ThreeColumnsMidExpanded":
            case "ThreeColumnsEndExpanded":
              if (!hiddenDraft) {
                bEditButtonVisible = false;
              }
              break;
          }
          break;
      }
      return bEditButtonVisible;
    };
    _proto._updateSaveAndCancelButtonVisiblity = function _updateSaveAndCancelButtonVisiblity(viewColumn, sLayout) {
      const hiddenDraft = this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
      let bSaveAndCancelButtonVisible = true;
      switch (viewColumn) {
        case "midColumn":
          switch (sLayout) {
            case "ThreeColumnsEndExpanded":
            case "ThreeColumnsMidExpanded":
              if (hiddenDraft) {
                bSaveAndCancelButtonVisible = false;
              }
              break;
          }
          break;
      }
      return bSaveAndCancelButtonVisible;
    };
    _proto.updateUIStateForView = function updateUIStateForView(oView, FCLLevel) {
      const oUIState = this.getHelper().getCurrentUIState(),
        oFclColName = ["beginColumn", "midColumn", "endColumn"],
        sLayout = this.getFclControl().getLayout();
      let viewColumn;
      if (!oView.getModel("fclhelper")) {
        oView.setModel(this._createHelperModel(), "fclhelper");
      }
      if (!oUIState.actionButtonsInfo) {
        oUIState.actionButtonsInfo = {};
      }
      if (!oUIState.actionButtonsInfo.midColumn) {
        oUIState.actionButtonsInfo.midColumn = {};
      }
      if (!oUIState.actionButtonsInfo.endColumn) {
        oUIState.actionButtonsInfo.endColumn = {};
      }
      if (FCLLevel >= this._oFCLConfig.maxColumnsCount) {
        // The view is on a level > max number of columns. It's always fullscreen without close/exit buttons
        viewColumn = oFclColName[this._oFCLConfig.maxColumnsCount - 1];
        oUIState.actionButtonsInfo.midColumn.fullScreen = null;
        oUIState.actionButtonsInfo.midColumn.exitFullScreen = null;
        oUIState.actionButtonsInfo.midColumn.closeColumn = null;
        oUIState.actionButtonsInfo.endColumn.exitFullScreen = null;
        oUIState.actionButtonsInfo.endColumn.fullScreen = null;
        oUIState.actionButtonsInfo.endColumn.closeColumn = null;
      } else {
        viewColumn = oFclColName[FCLLevel];
      }
      if (FCLLevel >= this._oFCLConfig.maxColumnsCount || sLayout === "EndColumnFullScreen" || sLayout === "MidColumnFullScreen" || sLayout === "OneColumn") {
        oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", true);
      } else {
        oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", false);
      }
      // Unfortunately, the FCLHelper doesn't provide actionButton values for the first column
      // so we have to add this info manually
      oUIState.actionButtonsInfo.beginColumn = {
        fullScreen: null,
        exitFullScreen: null,
        closeColumn: null
      };
      const oActionButtonInfos = Object.assign({}, oUIState.actionButtonsInfo[viewColumn]);
      oActionButtonInfos.switchVisible = oActionButtonInfos.fullScreen !== null || oActionButtonInfos.exitFullScreen !== null;
      oActionButtonInfos.switchIcon = oActionButtonInfos.fullScreen !== null ? "sap-icon://full-screen" : "sap-icon://exit-full-screen";
      oActionButtonInfos.isFullScreen = oActionButtonInfos.fullScreen === null;
      oActionButtonInfos.closeVisible = oActionButtonInfos.closeColumn !== null;
      oView.getModel("fclhelper").setProperty("/actionButtonsInfo", oActionButtonInfos);
      oView.getModel("fclhelper").setProperty("/showEditButton", this._updateEditButtonVisiblity(viewColumn, sLayout));
      oView.getModel("fclhelper").setProperty("/showSaveAndCancelButton", this._updateSaveAndCancelButtonVisiblity(viewColumn, sLayout));
      oView.getModel("fclhelper").setProperty("/showShareIcon", this._updateShareButtonVisibility(viewColumn, sLayout));
    }

    /**
     * Function triggered by the router BeforeRouteMatched event.
     * @param oEvent
     */;
    _proto.onBeforeRouteMatched = async function onBeforeRouteMatched(oEvent) {
      if (oEvent) {
        const oQueryParams = oEvent.getParameters().arguments["?query"];
        let sLayout = oQueryParams ? oQueryParams.layout : undefined;

        // If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
        if (!sLayout) {
          const oNextUIState = this.getHelper().getNextUIState(0);
          sLayout = oNextUIState.layout;
        }

        // Check if the layout if compatible with the number of targets
        // This should always be the case for normal navigation, just needed in case
        // the URL has been manually modified
        const aTargets = oEvent.getParameter("config")?.target;
        sLayout = this._correctLayoutForTargets(sLayout, aTargets);
        // we store a first time the layout for the updateUIStateForView to be done with the correct number of columns : SNOW DINC0449277
        if (sLayout) {
          this.getFclControl().setLayout(sLayout);
        }
        await this.isWritingFCLState;
        sLayout = await this.getStoredLayout(sLayout);

        // Update the layout of the FlexibleColumnLayout.
        if (sLayout) {
          this.getFclControl().setLayout(sLayout);
        }
      }
    }

    /**
     * Helper for the FCL Component.
     * @returns Instance of a semantic helper
     */;
    _proto.getHelper = function getHelper() {
      return FlexibleColumnLayoutSemanticHelper.getInstanceFor(this.getFclControl(), this._oFCLConfig);
    }

    /**
     * Calculates the FCL layout for a given FCL level and a target hash.
     * @param iNextFCLLevel FCL level to be navigated to
     * @param sHash The hash to be navigated to
     * @param sProposedLayout The proposed layout
     * @param keepCurrentLayout True if we want to keep the current layout if possible
     * @returns The calculated layout
     */;
    _proto.calculateLayout = function calculateLayout(iNextFCLLevel, sHash, sProposedLayout) {
      let keepCurrentLayout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      // First, ask the FCL helper to calculate the layout if nothing is proposed
      if (!sProposedLayout) {
        sProposedLayout = keepCurrentLayout ? this.getFclControl().getLayout() : this.getHelper().getNextUIState(iNextFCLLevel).layout;
      }

      // Then change this value if necessary, based on the number of targets
      const oRoute = this.getRouter().getRouteByHash?.(`${sHash}?layout=${sProposedLayout}`);
      const aTargets = this._oTargetsFromRoutePattern[oRoute.getPattern()];
      return this._correctLayoutForTargets(sProposedLayout, aTargets);
    }

    /**
     * Checks whether a given FCL layout is compatible with an array of targets.
     * @param sProposedLayout Proposed value for the FCL layout
     * @param aTargets Array of target names used for checking
     * @returns The corrected layout
     */;
    _proto._correctLayoutForTargets = function _correctLayoutForTargets(sProposedLayout, aTargets) {
      const allAllowedLayouts = {
        "2": ["TwoColumnsMidExpanded", "TwoColumnsBeginExpanded", "MidColumnFullScreen"],
        "3": ["ThreeColumnsMidExpanded", "ThreeColumnsEndExpanded", "ThreeColumnsMidExpandedEndHidden", "ThreeColumnsBeginExpandedEndHidden", "MidColumnFullScreen", "EndColumnFullScreen"]
      };
      if (aTargets && !Array.isArray(aTargets)) {
        // To support single target as a string in the manifest
        aTargets = [aTargets];
      }
      if (!aTargets) {
        // Defensive, just in case...
        return sProposedLayout;
      } else if (aTargets.length > 1) {
        // More than 1 target: just simply check from the allowed values
        const aLayouts = allAllowedLayouts[aTargets.length.toString()];
        if (!aLayouts.includes(sProposedLayout)) {
          // The proposed layout isn't compatible with the number of columns
          // --> Ask the helper for the default layout for the number of columns
          const defaultLayout = this._getDefaultLayout(aTargets.length);
          sProposedLayout = defaultLayout && aLayouts.includes(defaultLayout) ? defaultLayout : aLayouts[0];
        }
      } else {
        // Only one target
        const sTargetAggregation = this.getTargetAggregation()[getRouteTargetName(aTargets[0])].aggregation || this._oFCLConfig.defaultControlAggregation;
        switch (sTargetAggregation) {
          case "beginColumnPages":
            sProposedLayout = LayoutType.OneColumn;
            break;
          case "midColumnPages":
            sProposedLayout = LayoutType.MidColumnFullScreen;
            break;
          case "endColumnPages":
            sProposedLayout = LayoutType.EndColumnFullScreen;
            break;
          default:
            break;
          // no default
        }
      }
      return sProposedLayout;
    }

    /**
     * Gets default Layout for number of columns.
     * @param numberOfTargetsFromRoute
     * @returns An FCL Layout based on the manifest configuration if it is defined.
     */;
    _proto._getDefaultLayout = function _getDefaultLayout(numberOfTargetsFromRoute) {
      switch (numberOfTargetsFromRoute) {
        case 3:
          return this._oFCLConfig.defaultTwoColumnLayoutType;
        case 2:
          return this._oFCLConfig.defaultTwoColumnLayoutType;
        default:
          return undefined;
      }
    }

    /**
     * Gets the instanced views in the FCL component.
     * @returns Return the instanced views.
     */;
    _proto.getInstancedViews = function getInstancedViews() {
      const fclControl = this.getFclControl();
      const componentContainers = [...fclControl.getBeginColumnPages(), ...fclControl.getMidColumnPages(), ...fclControl.getEndColumnPages()];
      return this.getViewsFromPages(componentContainers);
    }

    /**
     * Gets the current visible pages.
     * @returns Return the visible views.
     */;
    _proto.getVisibleViews = function getVisibleViews() {
      return this._getAllVisibleViews();
    }

    /**
     * Get all visible views in the FCL component.
     * @param forLayout  Optional parameter is very specific as part of the calculation of the latest navigated row
     * @returns Array of all visible views
     */;
    _proto._getAllVisibleViews = function _getAllVisibleViews(forLayout) {
      const visibleViews = [];
      const layout = forLayout ? forLayout : this.getFclControl().getLayout();
      const addView = page => {
        if (page) {
          const view = this.getViewFromContainer(page);
          if (view) {
            visibleViews.push(view);
          }
        }
      };
      switch (layout) {
        case LayoutType.EndColumnFullScreen:
          addView(this.getFclControl().getCurrentEndColumnPage());
          break;
        case LayoutType.MidColumnFullScreen:
          addView(this.getFclControl().getCurrentMidColumnPage());
          break;
        case LayoutType.OneColumn:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          break;
        case LayoutType.ThreeColumnsEndExpanded:
        case LayoutType.ThreeColumnsMidExpanded:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          addView(this.getFclControl().getCurrentMidColumnPage());
          addView(this.getFclControl().getCurrentEndColumnPage());
          break;
        case LayoutType.TwoColumnsBeginExpanded:
        case LayoutType.TwoColumnsMidExpanded:
        case LayoutType.ThreeColumnsMidExpandedEndHidden:
        case LayoutType.ThreeColumnsBeginExpandedEndHidden:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          addView(this.getFclControl().getCurrentMidColumnPage());
          break;
        default:
          Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
      }
      return visibleViews;
    };
    _proto._getAllViews = function _getAllViews(forLayout) {
      const allViews = [];
      const layout = forLayout ? forLayout : this.getFclControl().getLayout();
      const addView = page => {
        if (page) {
          const view = this.getViewFromContainer(page);
          if (view) {
            allViews.push(view);
          }
        }
      };
      switch (layout) {
        case LayoutType.OneColumn:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          break;
        case LayoutType.ThreeColumnsEndExpanded:
        case LayoutType.ThreeColumnsMidExpanded:
        case LayoutType.ThreeColumnsMidExpandedEndHidden:
        case LayoutType.ThreeColumnsBeginExpandedEndHidden:
        case LayoutType.EndColumnFullScreen:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          addView(this.getFclControl().getCurrentMidColumnPage());
          addView(this.getFclControl().getCurrentEndColumnPage());
          break;
        case LayoutType.TwoColumnsBeginExpanded:
        case LayoutType.TwoColumnsMidExpanded:
          addView(this.getFclControl().getCurrentBeginColumnPage());
          addView(this.getFclControl().getCurrentMidColumnPage());
          break;
        case LayoutType.MidColumnFullScreen:
          // In this case we need to determine if this mid column fullscreen comes from a 2 or a 3 column layout
          {
            const layoutWhenExitFullScreen = this.getHelper().getCurrentUIState().actionButtonsInfo?.midColumn?.exitFullScreen ?? "";
            addView(this.getFclControl().getCurrentBeginColumnPage());
            addView(this.getFclControl().getCurrentMidColumnPage());
            if (layoutWhenExitFullScreen.startsWith("ThreeColumn")) {
              // We come from a 3 column layout
              addView(this.getFclControl().getCurrentEndColumnPage());
            }
          }
          break;
        default:
          Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
      }
      return allViews;
    };
    _proto.onContainerReady = async function onContainerReady() {
      // Restore views if neccessary.
      const aViews = this._getAllVisibleViews();
      const aRestorePromises = aViews.reduce(function (aPromises, oTargetView) {
        if (oTargetView.isA && oTargetView.isA("sap.ui.core.mvc.View")) {
          aPromises.push(KeepAliveHelper.restoreView(oTargetView));
        }
        return aPromises;
      }, []);
      return Promise.all(aRestorePromises);
    };
    _proto.getRightmostContext = function getRightmostContext() {
      return this.getRightmostView()?.getBindingContext() ?? undefined;
    };
    _proto.getRightmostView = function getRightmostView() {
      return this._getAllViews().pop();
    };
    _proto.isContextUsedInPages = function isContextUsedInPages(oContext) {
      if (!this.getFclControl()) {
        return false;
      }
      const aAllVisibleViews = this._getAllViews();
      for (const view of aAllVisibleViews) {
        if (view) {
          if (view.getBindingContext() === oContext) {
            return true;
          }
        } else {
          // A view has been destroyed --> app is currently being destroyed
          return false;
        }
      }
      return false;
    };
    _proto._setShellMenuTitle = async function _setShellMenuTitle(oAppComponent, sTitle, sAppTitle, browerTitle) {
      if (this.getHelper().getCurrentUIState().isFullScreen !== true) {
        await oAppComponent.getShellServices().setTitle(sAppTitle, browerTitle);
      } else {
        await oAppComponent.getShellServices().setTitle(sTitle, browerTitle);
      }
    }

    /**
     * This method is called to retieve the FCL state from the personalization service.
     * @returns The FCL state
     */;
    _proto.getFCLPersonalizationData = async function getFCLPersonalizationData() {
      const shellServices = this.getAppComponent()?.getShellServices();
      const emptyFCLState = {
        defaultLayouts: {},
        columnsDistribution: {
          desktop: {},
          tablet: {}
        }
      };
      return (await shellServices.getApplicationPersonalizationData("FCL-Personalization")) ?? emptyFCLState;
    }

    /**
     * This method is called to set the FCL state in the personalization service.
     * @param fclState The FCL state
     */;
    _proto.setFCLPersonalizationData = function setFCLPersonalizationData(fclState) {
      const shellServices = this.getAppComponent()?.getShellServices();
      shellServices.setApplicationPersonalizationData("FCL-Personalization", fclState);
    }

    /**
     * This method requests the FCL state from the personalization service and sets the model accordingly.
     */;
    _proto.setColumnDistributionModel = async function setColumnDistributionModel() {
      const columnsDistribution = (await this.getFCLPersonalizationData()).columnsDistribution;
      if (columnsDistribution) {
        const model = this.getView().getModel("internal");
        model.setProperty("/FCLColumnsDistribution", columnsDistribution);
      }
    }

    /**
     * This method is called when the user changes the columns distribution in the FCL settings dialog.
     * It updates the FCL state in the personalization service.
     * @param event
     */;
    _proto.onColumnsDistributionChange = async function onColumnsDistributionChange(event) {
      const {
        media,
        layout,
        columnsSizes
      } = event.getParameters();
      const model = this.getView().getModel("internal");
      model.setProperty(`/FCLColumnsDistribution/${media}/${layout}`, columnsSizes);
      this.isWritingFCLState = this.getFCLPersonalizationData();
      const fclState = await this.isWritingFCLState;
      const nbColumnsDisplayed = this.getNumberOfColumnsFromLayout(layout);
      if (nbColumnsDisplayed) {
        fclState.defaultLayouts[nbColumnsDisplayed] = layout;
        fclState.columnsDistribution[media][layout] = columnsSizes;
        this.setFCLPersonalizationData(fclState);
      }
      this.isWritingFCLState = undefined;
      return;
    }

    /**
     * This method returns the number of columns displayed in the FCL based on the layout.
     * @param layout  The layout
     * @returns The number of columns displayed
     */;
    _proto.getNumberOfColumnsFromLayout = function getNumberOfColumnsFromLayout(layout) {
      const nbColumnsDisplayed = /^(One|Two|Three)Column/.exec(layout)?.[1];
      switch (nbColumnsDisplayed) {
        case "One":
          return 1;
        case "Two":
          return 2;
        case "Three":
          return 3;
        default:
          return null;
      }
    }

    /**
     * This method returns the layout stored in the personalization service based on the proposed layout.
     * @param proposedLayout
     * @returns The FCL layout stored in the personalization service
     */;
    _proto.getStoredLayout = async function getStoredLayout(proposedLayout) {
      const layout = proposedLayout ?? this.getFclControl().getLayout();
      const nbColumnsDisplayed = this.getNumberOfColumnsFromLayout(layout);
      if (nbColumnsDisplayed) {
        const defaultLayouts = (await this.getFCLPersonalizationData()).defaultLayouts;
        return defaultLayouts?.[nbColumnsDisplayed] ?? layout;
      }
      return layout;
    };
    return FclController;
  }(BaseController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FclController;
}, false);
//# sourceMappingURL=Fcl-dbg.controller.js.map

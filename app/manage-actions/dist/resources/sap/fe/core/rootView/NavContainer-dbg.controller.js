/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/KeepAliveHelper", "sap/m/IllustratedMessage", "sap/m/Page", "./RootViewBaseController"], function (Log, ClassSupport, CommonUtils, ViewState, KeepAliveHelper, IllustratedMessage, Page, BaseController) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var usingExtension = ClassSupport.usingExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Base controller class for your own root view with a sap.m.NavContainer control.
   *
   * By using or extending this controller you can use your own root view with the sap.fe.core.AppComponent and
   * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
   * @hideconstructor
   * @public
   * @since 1.108.0
   */
  let NavContainerController = (_dec = defineUI5Class("sap.fe.core.rootView.NavContainer"), _dec2 = usingExtension(ViewState.override({
    applyInitialStateOnly: function () {
      return false;
    },
    adaptBindingRefreshControls: function (aControls) {
      const oView = this.getView(),
        oController = oView.getController();
      aControls.push(oController._getCurrentPage(oView));
    },
    adaptStateControls: function (aStateControls) {
      const oView = this.getView(),
        oController = oView.getController();
      aStateControls.push(oController._getCurrentPage(oView));
    },
    onRestore: function () {
      const oView = this.getView(),
        oController = oView.getController(),
        oNavContainer = oController.getAppContentContainer();
      const oInternalModel = oNavContainer.getModel("internal");
      const oPages = oInternalModel.getProperty("/pages");
      for (const sComponentId in oPages) {
        oInternalModel.setProperty(`/pages/${sComponentId}/restoreStatus`, "pending");
      }
      oController.onContainerReady();
    },
    onSuspend: function () {
      const oView = this.getView(),
        oNavController = oView.getController(),
        oNavContainer = oNavController.getAppContentContainer();
      const aPages = oNavContainer.getPages();
      aPages.forEach(function (oPage) {
        const oTargetView = CommonUtils.getTargetView(oPage);
        const oController = oTargetView && oTargetView.getController();
        if (oController && oController.viewState && oController.viewState.onSuspend) {
          oController.viewState.onSuspend();
        }
      });
    }
  })), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    function NavContainerController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "viewState", _descriptor, _this);
      return _this;
    }
    _inheritsLoose(NavContainerController, _BaseController);
    var _proto = NavContainerController.prototype;
    _proto.onContainerReady = async function onContainerReady() {
      // Restore views if neccessary.
      const oView = this.getView(),
        oPagePromise = this._getCurrentPage(oView);
      return oPagePromise.then(async function (oCurrentPage) {
        if (oCurrentPage) {
          const oTargetView = CommonUtils.getTargetView(oCurrentPage);
          return KeepAliveHelper.restoreView(oTargetView);
        }
        return;
      });
    };
    _proto._getCurrentPage = async function _getCurrentPage(oView) {
      const oNavContainer = this.getAppContentContainer();
      return new Promise(function (resolve) {
        const oCurrentPage = oNavContainer.getCurrentPage();
        if (oCurrentPage?.getController?.()?.isPlaceholder?.()) {
          oCurrentPage.getController().attachEventOnce("targetPageInsertedInContainer", function (oEvent) {
            const oTargetPage = oEvent.getParameter("targetpage");
            const oTargetView = CommonUtils.getTargetView(oTargetPage);
            resolve(oTargetView !== oView ? oTargetView : undefined);
          });
        } else {
          const oTargetView = CommonUtils.getTargetView(oCurrentPage);
          resolve(oTargetView !== oView ? oTargetView : undefined);
        }
      });
    };
    _proto._getNavContainer = function _getNavContainer() {
      return this.getAppContentContainer();
    }

    /**
     * Gets the instanced views in the navContainer component.
     * @returns Return the views.
     */;
    _proto.getInstancedViews = function getInstancedViews() {
      const navContainer = this._getNavContainer();
      const pages = navContainer.getPages();
      return this.getViewsFromPages(pages);
    }

    /**
     * Gets the current visible page.
     * @returns Return the view.
     */;
    _proto.getVisibleViews = function getVisibleViews() {
      const navContainer = this._getNavContainer();
      const pages = [navContainer.getCurrentPage()];
      return this.getViewsFromPages(pages);
    }

    /**
     * Check if the FCL component is enabled.
     * @returns `false` since we are not in FCL scenario
     * @final
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      return false;
    };
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      // Do nothing
    }

    /**
     * Method that creates a new Page to display the IllustratedMessage containing the current error.
     * @param errorMessage
     * @param parameters
     * @param _FCLLevel
     * @returns A promise that creates a Page to display the error
     */;
    _proto.displayErrorPage = async function displayErrorPage(errorMessage, parameters) {
      let _FCLLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      return new Promise(async (resolve, reject) => {
        try {
          const oNavContainer = this._getNavContainer();
          if (!this.messagePage) {
            this.messagePage = new Page({
              showHeader: false
            });
            oNavContainer.addPage(this.messagePage);
          }
          const illustratedMessage = new IllustratedMessage({
            title: errorMessage,
            description: parameters.description ?? "",
            illustrationType: parameters.errorType ? `sapIllus-${parameters.errorType}` : "sapIllus-UnableToLoad"
          });
          this.messagePage.removeAllContent();
          this.messagePage.addContent(illustratedMessage);
          const fromPage = oNavContainer.getCurrentPage();
          if (parameters.handleShellBack === true) {
            const oAppComponent = CommonUtils.getAppComponent(fromPage);
            await oAppComponent.getShellServices().setBackNavigation(async function () {
              oNavContainer.to(fromPage.getId());
              await oAppComponent.getShellServices().setBackNavigation();
            });
          }
          const fromView = this.getViewFromContainer(fromPage);
          oNavContainer.attachEventOnce("afterNavigate", () => {
            if (fromView && fromView.isA("sap.ui.core.mvc.View")) {
              fromView.getController().pageReady?.forcePageReady();
            }
            resolve(true);
          });
          oNavContainer.to(this.messagePage.getId());
        } catch (e) {
          reject(false);
          Log.info(e);
        }
      });
    };
    return NavContainerController;
  }(BaseController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return NavContainerController;
}, false);
//# sourceMappingURL=NavContainer-dbg.controller.js.map

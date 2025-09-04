/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/BaseController", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/ManifestHelper", "sap/fe/core/helpers/SizeHelper", "sap/ui/base/BindingParser", "sap/ui/core/Element", "sap/ui/core/routing/HashChanger", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/v4/AnnotationHelper", "sap/ui/thirdparty/URI", "../controls/Any"], function (Log, ClassSupport, BaseController, CommonUtils, Placeholder, ViewState, ManifestHelper, SizeHelper, BindingParser, Element, HashChanger, JSONModel, AnnotationHelper, URI, Any) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var getRouteTargetNames = ManifestHelper.getRouteTargetNames;
  var usingExtension = ClassSupport.usingExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let RootViewBaseController = (_dec = defineUI5Class("sap.fe.core.rootView.RootViewBaseController"), _dec2 = usingExtension(Placeholder), _dec3 = usingExtension(ViewState), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    function RootViewBaseController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "oPlaceholder", _descriptor, _this);
      _initializerDefineProperty(_this, "viewState", _descriptor2, _this);
      _this.bIsComputingTitleHierachy = false;
      return _this;
    }
    _inheritsLoose(RootViewBaseController, _BaseController);
    var _proto = RootViewBaseController.prototype;
    _proto.onInit = function onInit() {
      SizeHelper.init();
      this._aHelperModels = [];
    };
    _proto.getPlaceholder = function getPlaceholder() {
      return this.oPlaceholder;
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this.oPlaceholder.attachRouteMatchers();
      this.getAppComponent().getRoutingService().attachAfterRouteMatched({}, this.onAfterRouteMatched, this);
    };
    _proto.onExit = function onExit() {
      this.getAppComponent().getRoutingService().detachAfterRouteMatched(this.onAfterRouteMatched, this);
      this.oRouter = undefined;
      SizeHelper.exit();

      // Destroy all JSON models created dynamically for the views
      this._aHelperModels.forEach(function (oModel) {
        oModel.destroy();
      });
    };
    _proto.getViewFromContainer = function getViewFromContainer(container) {
      const result = container.isA("sap.ui.core.ComponentContainer") ? container.getComponentInstance().getRootControl() : container;
      return result?.isA("sap.ui.core.mvc.View") ? result : undefined;
    }

    /**
     * Analyze the pages and return the corresponding views.
     * @param pages The pages to be analyzed.
     * @returns The views
     */;
    _proto.getViewsFromPages = function getViewsFromPages(pages) {
      const views = [];
      pages.forEach(page => {
        const view = this.getViewFromContainer(page);
        if (view !== undefined) {
          views.push(view);
        }
      });
      return views;
    }

    /**
     * Convenience method for getting the resource bundle.
     * @public
     * @returns The resourceModel of the component
     */;
    _proto.getResourceBundle = function getResourceBundle() {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    };
    _proto.getRouter = function getRouter() {
      if (!this.oRouter) {
        this.oRouter = this.getAppComponent().getRouter();
      }
      return this.oRouter;
    };
    _proto._createHelperModel = function _createHelperModel() {
      // We keep a reference on the models created dynamically, as they don't get destroyed
      // automatically when the view is destroyed.
      // This is done during onExit
      const oModel = new JSONModel();
      this._aHelperModels.push(oModel);
      return oModel;
    };
    _proto.routingIsComplete = async function routingIsComplete() {
      await (this._oRouteMatchedPromise || Promise.resolve());
    }

    /**
     * Function waiting for the Right most view to be ready.
     * @param oEvent Reference an Event parameter coming from routeMatched event
     * @returns A promise indicating when the right most view is ready
     */;
    _proto.waitForRightMostViewReady = async function waitForRightMostViewReady(oEvent) {
      return new Promise(function (resolve) {
        const aContainers = oEvent.getParameter("views") ?? [],
          // There can also be reuse components in the view, remove them before processing.
          aFEContainers = [];
        aContainers.forEach(function (oContainer) {
          let oView = oContainer;
          if (oContainer && oContainer.getComponentInstance) {
            const oComponentInstance = oContainer.getComponentInstance();
            oView = oComponentInstance.getRootControl();
          }
          if (oView && oView.getController() && oView.getController().pageReady) {
            aFEContainers.push(oView);
          }
        });
        const oRightMostFEView = aFEContainers[aFEContainers.length - 1];
        if (oRightMostFEView && oRightMostFEView.getController().pageReady.isPageReady()) {
          resolve(oRightMostFEView);
        } else if (oRightMostFEView) {
          oRightMostFEView.getController().pageReady.attachEventOnce("pageReady", function () {
            resolve(oRightMostFEView);
          });
        }
      });
    }

    /**
     * Method to restore the focusInformation from the history Object.
     */;
    _proto.restoreFocusFromHistory = function restoreFocusFromHistory() {
      switch (history.state.focusInfo.type) {
        case "Row":
          const table = Element.getElementById(history.state.focusInfo.tableId);
          const pos = table.getRowBinding().getCurrentContexts().findIndex(context => context.getPath() === history.state.focusInfo.contextPathFocus);
          if (pos !== -1) {
            table.focusRow(pos);
          }
          break;
        default:
          Element.getElementById(history.state.focusInfo.controlId)?.focus();
      }
      //once applied, the focus info is removed to prevent focusing on it each time the user do a back navigation to this page
      history.replaceState(Object.assign(history.state, {
        focusInfo: null
      }), "");
    }

    /**
     * Callback when the navigation is done.
     * - update the shell title.
     * - update table scroll.
     * - call onPageReady on the rightMostView.
     * @param event
     * @returns A promise for the current navigation
     */;
    _proto.onAfterRouteMatched = async function onAfterRouteMatched(event) {
      try {
        const view = await this.waitForRightMostViewReady(event);
        if (this.getVisibleViews().includes(view)) {
          // The autoFocus is initially disabled on the navContainer or the FCL, so that the focus stays on the Shell menu
          // even if the app takes a long time to launch
          // The first time the view is displayed, we need to enable the autofocus so that it's managed properly during navigation
          const rootControl = this.getView().getContent()[0];
          if (rootControl && rootControl.getAutoFocus && !rootControl.getAutoFocus()) {
            rootControl.setProperty("autoFocus", true, true); // Do not mark the container as invalid, otherwise it's re-rendered
          }
          const appComponent = this.getAppComponent();
          this._scrollTablesToLastNavigatedItems();
          if (appComponent.getEnvironmentCapabilities().getCapabilities().UShell) {
            this.computeTitleHierarchy(view);
          }
          const forceFocus = appComponent.getRouterProxy().isFocusForced();
          appComponent.getRouterProxy().setFocusForced(false); // reset
          if (view.getController() && view.getParent().onPageReady) {
            view.getParent().onPageReady({
              forceFocus: forceFocus
            });
          }
          if (history.state.focusInfo) {
            this.restoreFocusFromHistory();
          } else if (!forceFocus) {
            // Try to restore the focus on where it was when we last visited the current hash
            appComponent.getRouterProxy().restoreFocusForCurrentHash();
          }
          if (this.onContainerReady) {
            this.onContainerReady();
          }
        }
        return view;
      } catch (error) {
        Log.error("An error occurs while computing the title hierarchy and calling focus method", error);
      }
    }

    /**
     * This function returns the TitleHierarchy cache ( or initializes it if undefined).
     * @returns  The TitleHierarchy cache
     */;
    _proto._getTitleHierarchyCache = function _getTitleHierarchyCache() {
      if (!this.oTitleHierarchyCache) {
        this.oTitleHierarchyCache = {};
      }
      return this.oTitleHierarchyCache;
    }

    /**
     * This function clear the TitleHierarchy cache for the given context path.
     * @param  path The path of the context to clear the cache for
     */;
    _proto.clearTitleHierarchyCache = function clearTitleHierarchyCache(path) {
      delete this._getTitleHierarchyCache()[path];
    }

    /**
     * This function returns a titleInfo object.
     * @param title The application's title
     * @param subtitle The application's subTitle
     * @param sIntent The intent path to be redirected to
     * @param description The application's description
     * @param icon The application's icon
     * @returns The title information
     */;
    _proto._computeTitleInfo = function _computeTitleInfo(title, subtitle, sIntent, description) {
      let icon = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";
      const aParts = sIntent.split("/");
      if (!aParts[aParts.length - 1].includes("?")) {
        sIntent += "?restoreHistory=true";
      } else {
        sIntent += "&restoreHistory=true";
      }
      return {
        title: title,
        subtitle: subtitle,
        intent: sIntent,
        icon: icon,
        description: description
      };
    };
    _proto._formatTitle = function _formatTitle(displayMode, titleValue, titleDescription) {
      let formattedTitle = "";
      switch (displayMode) {
        case "Value":
          formattedTitle = `${titleValue}`;
          break;
        case "ValueDescription":
          formattedTitle = `${titleValue} (${titleDescription})`;
          break;
        case "DescriptionValue":
          formattedTitle = `${titleDescription} (${titleValue})`;
          break;
        case "Description":
          formattedTitle = `${titleDescription}`;
          break;
        default:
      }
      return formattedTitle;
    }

    /**
     * Fetches the value of the HeaderInfo title for a given path.
     * @param path The path to the entity
     * @returns A promise containing the formatted title, or an empty string if no HeaderInfo title annotation is available
     */;
    _proto._fetchTitleValue = async function _fetchTitleValue(path) {
      const appComponent = this.getAppComponent(),
        model = this.getView().getModel(),
        metaModel = appComponent.getMetaModel(),
        metaPath = metaModel.getMetaPath(path),
        bindingViewContext = model.createBindingContext(path),
        headerInfoTitleValueAnnotation = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value`),
        valueExpression = AnnotationHelper.format(headerInfoTitleValueAnnotation, {
          context: metaModel.createBindingContext("/")
        });
      if (!valueExpression) {
        return Promise.resolve("");
      }
      if (headerInfoTitleValueAnnotation.$Function === "odata.concat") {
        const anyObject = new Any({
          any: valueExpression
        });
        anyObject.setModel(model);
        anyObject.setBindingContext(bindingViewContext);
        const textBinding = anyObject.getBinding("any");
        if (textBinding?.isA("sap.ui.model.CompositeBinding")) {
          await Promise.all(textBinding.getBindings().map(binding => binding.requestValue?.()));
        }
        const infoTitle = anyObject.getAny();
        anyObject.destroy();
        return Promise.resolve(infoTitle);
      }
      const textExpression = AnnotationHelper.format(metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@com.sap.vocabularies.Common.v1.Text`), {
          context: metaModel.createBindingContext("/")
        }),
        propertyContext = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@`),
        promises = [],
        parsedvalueExpression = BindingParser.complexParser(valueExpression),
        promiseForDisplayMode = new Promise(function (resolve) {
          const displayMode = CommonUtils.computeDisplayMode(propertyContext);
          resolve(displayMode);
        });
      promises.push(promiseForDisplayMode);
      const valuePath = parsedvalueExpression.parts ? parsedvalueExpression.parts[0].path : parsedvalueExpression.path,
        fnValueFormatter = parsedvalueExpression.formatter,
        valueBinding = model.bindProperty(valuePath, bindingViewContext, {
          $$groupId: "$auto.Heroes"
        });
      valueBinding.initialize();
      const promiseForTitleValue = new Promise(function (resolve) {
        const fnChange = function (event) {
          const targetValue = fnValueFormatter ? fnValueFormatter(event.getSource().getValue()) : event.getSource().getValue();
          valueBinding.detachChange(fnChange);
          resolve(targetValue);
        };
        valueBinding.attachChange(fnChange);
      });
      promises.push(promiseForTitleValue);
      if (textExpression) {
        const parsedTextExpression = BindingParser.complexParser(textExpression);
        let textPath = parsedTextExpression.parts ? parsedTextExpression.parts[0].path : parsedTextExpression.path;
        textPath = valuePath.lastIndexOf("/") > -1 ? `${valuePath.slice(0, valuePath.lastIndexOf("/"))}/${textPath}` : textPath;
        const fnTextFormatter = parsedTextExpression.formatter,
          textBinding = model.bindProperty(textPath, bindingViewContext, {
            $$groupId: "$auto.Heroes"
          });
        textBinding.initialize();
        const promiseForTitleText = new Promise(function (resolve) {
          const fnChange = function (event) {
            const targetText = fnTextFormatter ? fnTextFormatter(event.getSource().getValue()) : event.getSource().getValue();
            textBinding.detachChange(fnChange);
            resolve(targetText);
          };
          textBinding.attachChange(fnChange);
        });
        promises.push(promiseForTitleText);
      }
      try {
        const titleInfo = await Promise.all(promises);
        let formattedTitle = "";
        if (typeof titleInfo !== "string") {
          formattedTitle = this._formatTitle(titleInfo[0], titleInfo[1], titleInfo[2]);
        }
        return formattedTitle;
      } catch (error) {
        Log.error("Error while fetching the title from the header info :" + error);
      }
      return "";
    }

    /**
     * Function returning the decoded application-specific hash.
     * @returns Decoded application-specific hash
     */;
    _proto.getAppSpecificHash = function getAppSpecificHash() {
      // HashChanged isShellNavigationHashChanger
      const hashChanger = HashChanger.getInstance();
      return hashChanger.hrefForAppSpecificHash ? URI.decode(hashChanger.hrefForAppSpecificHash("")) : "#/";
    };
    _proto._getHash = function _getHash() {
      return HashChanger.getInstance().getHash();
    }

    /**
     * This function returns titleInformation from a path.
     * It updates the cache to store title information if necessary
     * @param {*} sPath path of the context to retrieve title information from MetaModel
     * @returns {Promise}  oTitleinformation returned as promise
     */;
    _proto.getTitleInfoFromPath = async function getTitleInfoFromPath(sPath) {
      const oTitleHierarchyCache = this._getTitleHierarchyCache();
      if (oTitleHierarchyCache[sPath]) {
        // The title info is already stored in the cache
        return Promise.resolve(oTitleHierarchyCache[sPath]);
      }
      const oMetaModel = this.getAppComponent().getMetaModel();
      const sEntityPath = oMetaModel.getMetaPath(sPath);
      const sTypeName = oMetaModel.getObject(`${sEntityPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName`);
      const sAppSpecificHash = this.getAppSpecificHash();
      const sIntent = sAppSpecificHash + sPath.slice(1);
      return this._fetchTitleValue(sPath).then(sTitle => {
        const oTitleInfo = this._computeTitleInfo(sTypeName, sTitle, sIntent);
        oTitleHierarchyCache[sPath] = oTitleInfo;
        return oTitleInfo;
      });
    }

    /**
     * Ensure that the ushell service receives all elements
     * (title, subtitle, intent, icon) as strings.
     *
     * Annotation HeaderInfo allows for binding of title and description
     * (which are used here as title and subtitle) to any element in the entity
     * (such types as Boolean, timestamp, double, and others are possible)
     *
     * Creates a new hierarchy and converts non-string types to string.
     * @param aHierarchy Shell title hierarchy
     * @returns Copy of shell title hierarchy containing all elements as strings
     */;
    _proto._ensureHierarchyElementsAreStrings = function _ensureHierarchyElementsAreStrings(aHierarchy) {
      const aHierarchyShell = [];
      for (const level in aHierarchy) {
        const oHierarchy = aHierarchy[level];
        const oShellHierarchy = {};
        for (const key in oHierarchy) {
          oShellHierarchy[key] = typeof oHierarchy[key] !== "string" ? String(oHierarchy[key]) : oHierarchy[key];
        }
        aHierarchyShell.push(oShellHierarchy);
      }
      return aHierarchyShell;
    };
    _proto._getTargetTypeFromHash = function _getTargetTypeFromHash(sHash) {
      const oAppComponent = this.getAppComponent();
      let sTargetType = "";
      const aRoutes = oAppComponent.getManifestEntry("sap.ui5").routing?.routes ?? [];
      for (const route of aRoutes) {
        const oRoute = oAppComponent.getRouter().getRoute(route.name);
        if (oRoute?.match(sHash)) {
          const sTarget = getRouteTargetNames(route.target)[0];
          sTargetType = oAppComponent.getRouter().getTarget(sTarget)._oOptions.name;
          break;
        }
      }
      return sTargetType;
    }

    /**
     * Helper method to determine the format of the browser title based on the current view.
     * @param titleInfoHierarchyShell TitleInformation array
     * @param pageTitleInformation TitleInformation object
     * @returns An object with a header text and an additional context
     */;
    _proto._getBrowserTitle = function _getBrowserTitle(titleInfoHierarchyShell, pageTitleInformation) {
      const breadcrumbTexts = [];
      let firstPart = "",
        secondPart = "";
      const titleInfoHierarchy = [...titleInfoHierarchyShell];
      if (titleInfoHierarchy.length > 1) {
        titleInfoHierarchy.pop();
        titleInfoHierarchy.forEach(titleInfo => {
          if (titleInfo.subtitle) {
            breadcrumbTexts.push(titleInfo.subtitle);
          }
        });
      }
      if (pageTitleInformation.title) {
        breadcrumbTexts.push(pageTitleInformation.title);
      }
      if (pageTitleInformation.description) {
        firstPart = `${pageTitleInformation.subtitle}(${pageTitleInformation.description})`;
      } else {
        firstPart = `${pageTitleInformation.subtitle}`;
      }
      secondPart = breadcrumbTexts.join(" - ");
      return {
        headerText: secondPart ? `${firstPart} - ${secondPart}` : firstPart
      };
    }

    /**
     * Calculate the browser title and menu title, then trigger the set API of the shell.
     * @param appTitle Application title
     * @param titleInfoHierarchyShell An object for title information
     * @param pageTitleInformation TitleInformation object
     */;
    _proto._setTitles = async function _setTitles(appTitle, titleInfoHierarchyShell, pageTitleInformation) {
      // Get the title of the browser
      let browserTitle;
      const appComponent = this.getAppComponent(),
        title = pageTitleInformation.title ?? "";
      if (titleInfoHierarchyShell.length) {
        browserTitle = this._getBrowserTitle(titleInfoHierarchyShell, pageTitleInformation);
      }
      await this._setShellMenuTitle(appComponent, title, appTitle, browserTitle);
    }

    /**
     * This function updates the shell title after each navigation.
     * @param view The current view
     * @returns A Promise that is resolved when the menu is filled properly
     * @private
     */;
    _proto.computeTitleHierarchy = async function computeTitleHierarchy(view) {
      const appComponent = this.getAppComponent(),
        context = view.getBindingContext(),
        currentPage = view.getParent(),
        titleInformationPromises = [],
        appSpecificHash = this.getAppSpecificHash(),
        manifestAppSettings = appComponent.getManifestEntry("sap.app"),
        appTitle = manifestAppSettings.title || "",
        appSubTitle = manifestAppSettings.subTitle || "",
        appIcon = manifestAppSettings.icon || "";
      let pageTitleInformation, newPath;
      if (currentPage && currentPage._getPageTitleInformation) {
        if (context) {
          // If the first page of the application is a LR, use the title and subtitle from the manifest
          if (this._getTargetTypeFromHash("") === "sap.fe.templates.ListReport") {
            titleInformationPromises.push(this.getRootLevelTitleInformation(appSpecificHash, appTitle, appSubTitle, appIcon));
          }

          // Then manage other pages
          newPath = context.getPath();
          const pathParts = newPath.split("/");
          let path = "";
          pathParts.shift(); // Remove the first segment (empty string) as it has been managed above
          pathParts.pop(); // Remove the last segment as it corresponds to the current page and shouldn't appear in the menu
          pathParts.forEach(pathPart => {
            path += `/${pathPart}`;
            //if the associated target is not declared in the routes, we skip it
            if (!appComponent.getRouter().getRouteInfoByHash(path)) {
              return;
            }
            const metaModel = appComponent.getMetaModel(),
              parameterPath = metaModel.getMetaPath(path),
              isParameterized = metaModel.getObject(`${parameterPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
            if (!isParameterized) {
              titleInformationPromises.push(this.getTitleInfoFromPath(path));
            }
          });
        }

        // Current page
        pageTitleInformation = currentPage._getPageTitleInformation();
        pageTitleInformation = this._computeTitleInfo(pageTitleInformation.title ?? "", pageTitleInformation.subtitle ?? "", appSpecificHash + this._getHash(), pageTitleInformation.description);
        if (context && newPath) {
          this._getTitleHierarchyCache()[newPath] = pageTitleInformation;
        } else {
          this._getTitleHierarchyCache()[appSpecificHash] = pageTitleInformation;
        }
      } else {
        titleInformationPromises.push(Promise.reject("Title information missing in HeaderInfo"));
      }
      return Promise.all(titleInformationPromises).then(async titleInfoHierarchy => {
        // workaround for shell which is expecting all elements being of type string
        const titleInfoHierarchyShell = this._ensureHierarchyElementsAreStrings(titleInfoHierarchy),
          title = pageTitleInformation.title ?? "";
        titleInfoHierarchyShell.reverse();
        await appComponent.getShellServices().setHierarchy(titleInfoHierarchyShell);
        await this._setTitles(appTitle, titleInfoHierarchyShell, pageTitleInformation);
        return;
      }).catch(function (errorMessage) {
        Log.error(errorMessage);
      }).finally(() => {
        this.bIsComputingTitleHierachy = false;
      }).catch(function (errorMessage) {
        Log.error(errorMessage);
      });
    }

    /**
     * Retrieve the title information for the root level.
     * @param appSpecificHash The application-specific hash
     * @param appTitle The application title
     * @param appSubTitle The application subtitle
     * @param appIcon The application icon
     * @returns A Promise containing the title information
     */;
    _proto.getRootLevelTitleInformation = async function getRootLevelTitleInformation(appSpecificHash, appTitle, appSubTitle, appIcon) {
      const oTitleHierarchyCache = this._getTitleHierarchyCache();
      if (oTitleHierarchyCache[appSpecificHash]) {
        // The title info is already stored in the cache
        return Promise.resolve(oTitleHierarchyCache[appSpecificHash]);
      } else {
        return Promise.resolve(this._computeTitleInfo(appTitle, appSubTitle, appSpecificHash, undefined, appIcon));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.calculateLayout = function calculateLayout(iNextFCLLevel, sHash, sProposedLayout) {
      let keepCurrentLayout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      return "";
    }

    /**
     * Callback after a view has been bound to a context.
     * @param oContext The context that has been bound to a view
     */;
    _proto.onContextBoundToView = function onContextBoundToView(oContext) {
      if (oContext) {
        const sDeepestPath = this.getView().getModel("internal").getProperty("/deepestPath"),
          sViewContextPath = oContext.getPath();
        if (!sDeepestPath || sDeepestPath.indexOf(sViewContextPath) !== 0) {
          // There was no previous value for the deepest reached path, or the path
          // for the view isn't a subpath of the previous deepest path --> update
          this.getView().getModel("internal").setProperty("/deepestPath", sViewContextPath, undefined, true);
        }
      }
    };
    _proto.displayErrorPage = async function displayErrorPage(_errorMessage, _parameters) {
      let _FCLLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      // To be overridden
      return Promise.resolve(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.updateUIStateForView = function updateUIStateForView(oView, FCLLevel) {
      // To be overriden
    };
    _proto.getInstancedViews = function getInstancedViews() {
      return [];
      // To be overriden
    }

    /**
     * Return all visible views.
     * @returns The visible views
     */;
    _proto.getVisibleViews = function getVisibleViews() {
      return [];
      // To be overriden
    };
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      // To be overriden
    };
    _proto.isFclEnabled = function isFclEnabled() {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto._setShellMenuTitle = async function _setShellMenuTitle(oAppComponent, sTitle, sAppTitle, additionalInformation) {
      // To be overriden by FclController
      await oAppComponent.getShellServices().setTitle(sTitle, additionalInformation);
    };
    _proto.getAppContentContainer = function getAppContentContainer() {
      const oAppComponent = this.getAppComponent();
      const appContentId = oAppComponent.getManifestEntry("sap.ui5").routing?.config?.controlId ?? "appContent";
      return this.getView().byId(appContentId);
    };
    return RootViewBaseController;
  }(BaseController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "oPlaceholder", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return RootViewBaseController;
}, false);
//# sourceMappingURL=RootViewBaseController-dbg.js.map

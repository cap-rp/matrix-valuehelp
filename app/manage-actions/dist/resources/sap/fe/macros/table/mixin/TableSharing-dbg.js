/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/HookSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/insights/CommonInsightsHelper", "sap/fe/macros/insights/InsightsService", "sap/fe/macros/insights/TableInsightsHelper", "sap/fe/macros/table/Utils", "sap/m/MessageBox", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/core/routing/HashChanger", "sap/ui/model/Filter", "../../filterBar/SemanticDateOperators"], function (Log, HookSupport, CommonUtils, draft, ModelHelper, ResourceModelHelper, CommonInsightsHelper, InsightsService, TableInsightsHelper, TableUtils, MessageBox, UI5Element, Library, HashChanger, Filter, SemanticDateOperators) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  var hasInsightActionEnabled = CommonInsightsHelper.hasInsightActionEnabled;
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * A mixin to manage all sharing related functionality of the table (including insight cards)
   */
  let TableSharing = (_dec = controllerExtensionHandler("collaborationManager", "collectAvailableCards"), _class = /*#__PURE__*/function () {
    function TableSharing() {}
    _exports = TableSharing;
    var _proto = TableSharing.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {};
    _proto._onShareToCollaborationManagerPress = function _onShareToCollaborationManagerPress(controller, contexts, maxNumberofSelectedItems) {
      if (contexts.length <= maxNumberofSelectedItems) {
        contexts.forEach(async context => {
          const targetPath = await this.getUrlForCollaborationManager(context);
          if (this.isTableRowNavigationPossible(context) && targetPath) {
            const appComponent = controller.getAppComponent();
            const appTitle = appComponent.getManifestEntry("sap.app").title;
            const collaborativeToolsService = appComponent?.getCollaborativeToolsService();
            const collaborationManagerService = collaborativeToolsService?.collaborationService.cmHelperService;
            collaborationManagerService?.triggerH2HChat(appTitle, targetPath);
          } else {
            MessageBox.warning(Library.getResourceBundleFor("sap.fe.macros").getText("T_TABLE_SHARE_TO_COLLABORATION_MANAGER_NO_NAVIGATION_POSSIBLE"));
          }
        });
      } else {
        MessageBox.warning(Library.getResourceBundleFor("sap.fe.macros").getText("T_TABLE_SHARE_TO_COLLABORATION_MANAGER_TOO_MANY_ITEMS_SELECTED", [maxNumberofSelectedItems]));
      }
    }

    /**
     * Get the URL for SAP Collaboration Manager. We always go to the active version, also from draft version. If there is no active version yet, we do not share a link.
     * @param context The context for which the URL is to be generated
     * @returns The URL for SAP Collaboration Manager
     */;
    _proto.getUrlForCollaborationManager = async function getUrlForCollaborationManager(context) {
      let targetPath;
      const view = CommonUtils.getTargetView(this.getContent());
      const collaborativeDraft = view.getController().collaborativeDraft;
      const metaModel = context.getModel()?.getMetaModel();
      const isDraft = ModelHelper.isDraftSupported(metaModel, context.getPath());
      if (isDraft && !collaborativeDraft.isCollaborationEnabled() && context.getObject().IsActiveEntity === false) {
        if (context.getObject().HasActiveEntity === false) {
          // we have a draft entity with no active version
          // we do not support this for Collaboration Manager
          return undefined;
        } else {
          // we have a draft entity with an active version and need to convert the path to an active path
          const path = context.getPath();
          const rootPath = path.substring(0, path.indexOf("/", 1));
          const rootContext = rootPath ? context.getModel().bindContext(rootPath).getBoundContext() : context;
          const siblingInfo = await draft.computeSiblingInformation(rootContext, context);
          targetPath = siblingInfo?.targetContext?.getPath();
        }
      } else {
        // we have an active entity or a collaborative draft or a non-draft programming model
        targetPath = context.getPath();
      }
      if (targetPath) {
        if (targetPath[0] === "/") {
          targetPath = targetPath.substring(1);
        }
        const appComponent = CommonUtils.getAppComponent(this.getContent());
        if (appComponent._isFclEnabled()) {
          const layout = this.getFCLLayoutForCM(appComponent);
          targetPath += `?layout=${layout}`;
        }
        const hashChangerInstance = HashChanger.getInstance();
        const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
        return window.location.origin + window.location.pathname + window.location.search + sBasePath + targetPath;
      }
      return undefined;
    }

    /**
     * For 'Share to SAP Collaboration Manager', we always want the URL to go to full screen.
     * @param this
     * @param appComponent The app component
     * @returns The FCL layout for the Share to SAP Collaboration Manager
     */;
    _proto.getFCLLayoutForCM = function getFCLLayoutForCM(appComponent) {
      const FCLLevel = CommonUtils.getTargetView(this.getContent()).getController()._routing.getFCLLevel();
      if (appComponent.getRootViewController().getFclConfig().maxColumnsCount === 2) {
        return "MidColumnFullScreen";
      }
      return FCLLevel === 0 ? "MidColumnFullScreen" : "EndColumnFullScreen";
    };
    _proto.collectAvailableCards = async function collectAvailableCards(cards) {
      const actionToolbarItems = this.getContent().getActions();
      if (hasInsightActionEnabled(actionToolbarItems, this.getContent().getFilter(), TableInsightsHelper.getInsightsRelevantColumns(this))) {
        const card = await this.getCardManifestTable();
        if (Object.keys(card).length > 0) {
          cards.push({
            card: card,
            title: this.getTableDefinition().headerInfoTypeName ?? "",
            callback: this.onAddCardToCollaborationManagerCallback.bind(this)
          });
        }
      }
    }

    /**
     * Gets the card manifest optimized for the table case.
     * @returns Promise of CardManifest
     */;
    _proto.getCardManifestTable = async function getCardManifestTable() {
      const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
      const insightsParams = await TableInsightsHelper.createTableCardParams(this, insightsRelevantColumns, this.getSortConditionsQuery());
      return InsightsService.getCardManifest(insightsParams);
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     * @param card The card manifest to be used for the callback
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToCollaborationManagerCallback = async function onAddCardToCollaborationManagerCallback(card) {
      try {
        if (card) {
          await InsightsService.showCollaborationManagerCardPreview(card, this.getPageController().collaborationManager.getService());
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.getContent());
        Log.error(e);
      }
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     * @returns Undefined if the card preview is rendered.
     */;
    _proto._onAddCardToInsightsPressed = async function _onAddCardToInsightsPressed() {
      try {
        const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
        const insightsParams = await TableInsightsHelper.createTableCardParams(this, insightsRelevantColumns, this.getSortConditionsQuery());
        if (insightsParams) {
          const message = insightsParams.parameters.isNavigationEnabled ? undefined : {
            type: "Warning",
            text: this.createNavigationErrorMessage(this.getContent())
          };
          InsightsService.showInsightsCardPreview(insightsParams, message);
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.getContent());
        Log.error(e);
      }
    };
    _proto.createNavigationErrorMessage = function createNavigationErrorMessage(scope) {
      const resourceModel = ResourceModelHelper.getResourceModel(scope);
      return resourceModel.getText("M_ROW_LEVEL_NAVIGATION_DISABLED_MSG_REASON_EXTERNAL_NAVIGATION_CONFIGURED");
    };
    _proto.getDownloadUrlWithFilters = async function getDownloadUrlWithFilters() {
      const table = this.getContent();
      const filterBar = UI5Element.getElementById(table.getFilter());
      if (!filterBar) {
        throw new Error("filter bar is not available");
      }
      const binding = table.getRowBinding();
      const model = table.getModel();
      const filterPropSV = await filterBar.getParent().getSelectionVariant();
      // ignore filters with semantic operators which needs to be added later as filters with flp semantic date placeholders
      const filtersWithSemanticDateOpsInfo = SemanticDateOperators.getSemanticOpsFilterProperties(filterPropSV._getSelectOptions());
      const filtersWithoutSemanticDateOps = TableUtils.getAllFilterInfo(table, filtersWithSemanticDateOpsInfo.map(filterInfo => filterInfo.filterName));
      const propertiesInfo = filterBar.getPropertyInfoSet();
      // get the filters with semantic date operators with flp placeholder format and append to the exisiting filters
      const [flpMappedPlaceholders, semanticDateFilters] = SemanticDateOperators.getSemanticDateFiltersWithFlpPlaceholders(filtersWithSemanticDateOpsInfo, propertiesInfo);
      let allRelevantFilters = [];
      if (filtersWithoutSemanticDateOps.filters.length > 0) {
        allRelevantFilters = allRelevantFilters.concat(filtersWithoutSemanticDateOps.filters);
      }
      if (semanticDateFilters.length > 0) {
        allRelevantFilters.push(...semanticDateFilters);
      }
      const allFilters = new Filter({
        filters: allRelevantFilters,
        and: true
      });
      const parameters = {
        $search: CommonUtils.normalizeSearchTerm(filterBar.getSearch()) || undefined
      };
      // create hidden binding with all filters e.g. static filters and filters with semantic operators
      const tempTableBinding = model.bindList(binding.getPath(), undefined, undefined, allFilters, parameters);
      let url = (await tempTableBinding.requestDownloadUrl()) ?? "";
      for (const [placeholder, value] of Object.entries(flpMappedPlaceholders)) {
        url = url.replace(placeholder, value);
      }
      return url;
    }

    /**
     * Get the sort conditions query string.
     * @returns The sort conditions query string
     */;
    _proto.getSortConditionsQuery = function getSortConditionsQuery() {
      const table = this.getContent();
      const sortConditions = table.getSortConditions()?.sorters;
      return sortConditions ? sortConditions.map(function (sortCondition) {
        const sortConditionsPath = table.getPropertyHelper().getProperty(sortCondition.name)?.path;
        if (sortConditionsPath) {
          return `${sortConditionsPath}${sortCondition.descending ? " desc" : ""}`;
        }
        return "";
      }).join(",") : "";
    };
    return TableSharing;
  }(), _applyDecoratedDescriptor(_class.prototype, "collectAvailableCards", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "collectAvailableCards"), _class.prototype), _class);
  _exports = TableSharing;
  return _exports;
}, false);
//# sourceMappingURL=TableSharing-dbg.js.map

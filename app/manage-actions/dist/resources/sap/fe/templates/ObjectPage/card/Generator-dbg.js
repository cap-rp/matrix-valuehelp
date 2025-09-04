/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/templates/ObjectPage/card/BaseCardContentProvider", "sap/fe/templates/ObjectPage/card/actions/HeaderActions", "sap/fe/templates/ObjectPage/card/facets/HeaderContent", "sap/fe/templates/ObjectPage/card/facets/HeaderTitle"], function (Log, BaseCardContentProvider, HeaderActions, HeaderContent, HeaderTitle) {
  "use strict";

  var _exports = {};
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const MSTEAMS_ADAPTIVE_CARD_SCHEMA = "https://adaptivecards.io/schemas/adaptive-card.json";
  const MSTEAMS_ADAPTIVE_CARD_VERSION = "1.4";
  /**
   * Adaptive card json generator.
   * @param convertedTypes Converted Metadata.
   * @param config Card Configuration.
   * @experimental
   */
  let AdaptiveCardGenerator = /*#__PURE__*/function (_BaseCardContentProvi) {
    function AdaptiveCardGenerator(convertedTypes, config) {
      var _this;
      _this = _BaseCardContentProvi.call(this, convertedTypes, config) || this;
      try {
        const {
          webUrl
        } = config;

        // header content
        const headerTitleandImage = _this.getHeaderTitle(config);
        const headerForms = _this.getHeaderFacetsForAdaptiveCard(config);

        // actions
        const cardActions = _this.getCardActions(config);

        // body
        if (headerForms.length === 0 && cardActions.length === 0) {
          _this.cardDefinition = undefined;
          return _this || _assertThisInitialized(_this);
        }
        const content = [...headerForms, ...cardActions];
        const body = headerTitleandImage ? [headerTitleandImage, ...content] : content;
        _this.cardDefinition = {
          type: "AdaptiveCard",
          msTeams: {
            width: "full"
          },
          metadata: {
            webUrl
          },
          body: body,
          $schema: MSTEAMS_ADAPTIVE_CARD_SCHEMA,
          version: MSTEAMS_ADAPTIVE_CARD_VERSION
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error("Error while creating the card defintion", message);
      }
      return _this;
    }
    _exports = AdaptiveCardGenerator;
    _inheritsLoose(AdaptiveCardGenerator, _BaseCardContentProvi);
    var _proto = AdaptiveCardGenerator.prototype;
    /**
     * Get the generated card definition.
     * @param queryUrl Query url to use for card definition.
     * @returns Card definition to share via MS teams 'share as card'.
     */
    _proto.getCardDefinition = function getCardDefinition(queryUrl) {
      let cardDefinition = this.cardDefinition;
      if (queryUrl && cardDefinition) {
        const extendDefinition = {
          metadata: {
            webUrl: `${queryUrl}`
          }
        };
        cardDefinition = {
          ...cardDefinition,
          ...extendDefinition
        };
      }
      return cardDefinition;
    };
    _proto.getCardActions = function getCardActions(config) {
      const headerActionsProvider = new HeaderActions(this.convertedTypes, config);
      const cardActions = headerActionsProvider.getCardActions();
      const pathsToQueryFromActions = headerActionsProvider.getPathsToQuery();
      this.addPathsToQuery(pathsToQueryFromActions);
      const cardActionSet = [];
      if (cardActions.length > 0) {
        cardActionSet.push({
          type: "ActionSet",
          actions: [...cardActions]
        });
      }
      return cardActionSet;
    };
    _proto.getHeaderFacetsForAdaptiveCard = function getHeaderFacetsForAdaptiveCard(config) {
      const headerContentProvider = new HeaderContent(this.convertedTypes, config);
      const headerForms = headerContentProvider.getHeaderContent();
      const pathsToQueryFromHeaderForms = headerContentProvider.getPathsToQuery();
      this.addPathsToQuery(pathsToQueryFromHeaderForms);
      return headerForms;
    };
    _proto.getHeaderTitle = function getHeaderTitle(config) {
      const headerTitleProvider = new HeaderTitle(this.convertedTypes, config);
      const headerTitle = headerTitleProvider.getTitle();
      const pathsToQueryFromTitle = headerTitleProvider.getPathsToQuery();
      this.addPathsToQuery(pathsToQueryFromTitle);
      return headerTitle;
    };
    return AdaptiveCardGenerator;
  }(BaseCardContentProvider);
  _exports = AdaptiveCardGenerator;
  return _exports;
}, false);
//# sourceMappingURL=Generator-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/MessageBox", "sap/ui/core/Element", "sap/ui/mdc/p13n/StateUtil", "../mdc/adapter/StateFilterToSelectionVariant"], function (deepClone, CommonUtils, ResourceModelHelper, MessageBox, Element, StateUtil, stateFilterToSelectionVariant) {
  "use strict";

  var _exports = {};
  var getResourceModel = ResourceModelHelper.getResourceModel;
  const filterTypeMapper = {
    "sap.ui.model.odata.type.String": "string",
    "sap.ui.model.odata.type.Int": "integer",
    "sap.ui.model.odata.type.Int32": "integer",
    "sap.ui.model.odata.type.Int64": "integer",
    "sap.ui.model.odata.type.Boolean": "boolean",
    "sap.ui.model.odata.type.Decimal": "number",
    "sap.ui.model.odata.type.Double": "number",
    "sap.ui.model.odata.type.Date": "date",
    "sap.ui.model.odata.type.DateTimeOffset": "datetime"
  };

  /**
   * Checks if the insights card creation is possible.
   * @param filterbarId
   * @param insightsRelevantColumns
   * @returns True if the insights card can be created.
   */
  function isInsightsCardCreationPossible(filterbarId, insightsRelevantColumns) {
    if (insightsRelevantColumns && insightsRelevantColumns.length === 0) {
      return false;
    }
    const filterBar = Element.getElementById(filterbarId);
    if (filterBar?.isA("sap.fe.macros.controls.FilterBar")) {
      //cards can not be created if semantic date operators are applied on the filters
      const isSemanticDateFilterApplied = filterBar.getParent().isSemanticDateFilterApplied();
      return !isSemanticDateFilterApplied;
    }
    return true;
  }

  /**
   * Display a message box for the scenarios where the insights card cannot be created.
   * @param type Card type
   * @param resourceModel Resource model to be used to fetch messages
   */
  _exports.isInsightsCardCreationPossible = isInsightsCardCreationPossible;
  function showErrorMessageForInsightsCard(type, resourceModel) {
    if (type === "Table") {
      const headerText = `<strong>
		${resourceModel.getText("M_CARD_RETRY_MESSAGE")}
		</strong>`;
      const contentText = `<ul><li>
			${resourceModel.getText("M_CARD_FAILURE_REASON_DATE_RANGE_FILTERS")}
			</li><li>
			${resourceModel.getText("M_CARD_FAILURE_TABLE_REASON_UNSUPPORTED_COLUMNS")}
			</li></ul>`;
      const formattedTextString = headerText + contentText;
      MessageBox.error(resourceModel.getText("M_CARD_CREATION_FAILURE"), {
        onClose: function () {
          throw new Error("Insights is not supported");
        },
        details: formattedTextString
      });
    } else {
      const formattedTextString = resourceModel.getText("M_CARD_CREATION_FAILURE_CHART_REASON_DATE_RANGE_FILTERS");
      MessageBox.error(formattedTextString, {
        onClose: function () {
          throw new Error("Insights is not supported");
        }
      });
    }
  }

  /**
   * Extract parameters relevant for navigation.
   * @param appComponent AppComponent instance to be used to access shell services
   * @returns An instance of the navigation parameters
   */
  function createNavigationParameters(appComponent) {
    const shellServiceHelper = appComponent.getShellServices();
    const navigationService = appComponent.getNavigationService();
    const hash = shellServiceHelper.getHash();
    const parsedHash = shellServiceHelper.parseShellHash(hash);
    return {
      iAppStateKey: navigationService.getIAppStateKey(),
      appVariantId: parsedHash.params?.["sap-appvar-id"]?.[0],
      intent: {
        semanticObject: parsedHash.semanticObject,
        action: parsedHash.action
      }
    };
  }

  /**
   * Extract the applied filters.
   * @param parameters Array of parameters that are fetched from the custom data of the filter bar
   * @param filterBarSV Selection variant for the filter bar
   * @param propertyInfos PropertyInfoSet of the filter bar
   * @param controlSV
   * @returns An object containing the applied filters
   */
  function getRelevantFilters(parameters, filterBarSV, propertyInfos, controlSV) {
    const selectionVariants = {};
    // Merge the filterBarSV and controlSV filters using compareSelectOptions
    const mergedSV = stateFilterToSelectionVariant.mergeSelectionVariants(filterBarSV, controlSV);
    const selectionOptionsPropertyNames = mergedSV.getSelectOptionsPropertyNames();
    if (selectionOptionsPropertyNames.length) {
      // Add to insights only if filters exist
      for (const filterProp of selectionOptionsPropertyNames) {
        const filterType = getFilterOrParameterType(filterProp, propertyInfos);
        if (filterProp !== "$editState" && !parameters.includes(filterProp) && !filterProp.includes("$Parameter.") && filterType) {
          const reconstructedSV = {
            id: mergedSV.getID(),
            Parameters: [],
            SelectOptions: [{
              PropertyName: filterProp,
              Ranges: mergedSV.getSelectOption(filterProp)
            }]
          };
          selectionVariants[filterProp] = {
            value: JSON.stringify(reconstructedSV),
            type: filterType
          };
        }
      }
    }
    return selectionVariants;
  }

  /**
   * Extract the relevant parameters.
   * @param parameters Array of parameters that are fetched from the custom data of the filter bar
   * @param selectionVariant Selection variant for the filter bar
   * @param propertyInfos PropertyInfoSet of the filter bar
   * @returns An object containing the relevant parameters
   */
  function getRelevantParameters(parameters, selectionVariant, propertyInfos) {
    const relevantParameters = {};
    const selectionOptionsPropertyNames = selectionVariant.getSelectOptionsPropertyNames();
    if (selectionOptionsPropertyNames.length) {
      // add to insights only if filters exist
      for (const parameter of parameters) {
        const parameterType = getFilterOrParameterType(parameter, propertyInfos);
        if (selectionOptionsPropertyNames.includes(parameter) && parameterType) {
          relevantParameters[parameter] = {
            value: selectionVariant.getSelectOption(parameter)?.[0].Low,
            type: parameterType
          };
        }
      }
    }
    return relevantParameters;
  }

  /**
   * Return the type of filter or parameter.
   * @param paramOrFilter Parameter or filter name
   * @param propertyInfos PropertyInfoSet of the filter bar
   * @returns Type of filter or parameter
   */

  function getFilterOrParameterType(paramOrFilter, propertyInfos) {
    let filterParamType;
    propertyInfos.forEach(propInfo => {
      if (propInfo.name === paramOrFilter) {
        filterParamType = filterTypeMapper[propInfo.dataType];
      }
    });
    return filterParamType;
  }

  /**
   * Constructs the insights parameters that are required to create the insights card from the table.
   * @param cardType Card type
   * @param controlAPI Control API
   * @param filterBarId Filter bar ID
   * @param insightsRelevantColumns Insights-relevant columns
   * @returns The insights parameters from the table.
   */
  async function createInsightsParams(cardType, controlAPI, filterBarId, insightsRelevantColumns) {
    const isCardCreationSupported = isInsightsCardCreationPossible(filterBarId, insightsRelevantColumns);
    if (!isCardCreationSupported) {
      showErrorMessageForInsightsCard(cardType, getResourceModel(controlAPI));
      return;
    }
    if (!controlAPI.content) {
      // This should never happen and is here mainly to avoid eslint errors
      throw new Error("Control API content is null or undefined");
    }
    const appComponent = CommonUtils.getAppComponent(controlAPI.content);
    const filterBar = Element.getElementById(filterBarId);
    const control = controlAPI.content;
    const controlState = await StateUtil.retrieveExternalState(control); // define type for control state
    const controlSV = stateFilterToSelectionVariant.getSelectionVariantFromConditions(controlState.filter, control.getPropertyHelper());
    let relevantFilters,
      relevantParameters,
      mandatoryFilters = [];
    if (filterBar?.isA("sap.fe.macros.controls.FilterBar")) {
      const filterBarAPI = filterBar.getParent();
      const parameters = filterBarAPI.getParameters();
      const filterBarSV = await filterBarAPI.getSelectionVariant();
      const propertyInfos = filterBar.getPropertyInfoSet();
      mandatoryFilters = filterBarAPI.getMandatoryFilterPropertyNames();
      relevantFilters = getRelevantFilters(parameters, filterBarSV, propertyInfos, controlSV);
      relevantParameters = getRelevantParameters(parameters, filterBarSV, propertyInfos);
    }
    const parentAppManifest = deepClone(appComponent.getManifest(), 20);
    const appManifest = parentAppManifest["sap.app"];
    if (appManifest["crossNavigation"]) {
      delete appManifest.crossNavigation;
    }
    const insightsParams = {
      navigation: createNavigationParameters(appComponent),
      type: cardType,
      requestParameters: {
        serviceUrl: controlAPI.content.getModel().getServiceUrl(),
        queryUrl: "",
        sortQuery: ""
      },
      content: {
        cardTitle: ""
      },
      parentAppManifest: parentAppManifest,
      parameters: {
        mandatoryFilters: mandatoryFilters,
        filters: relevantFilters,
        oDataParameters: relevantParameters
      },
      entitySetPath: ""
    };
    return insightsParams;
  }
  _exports.createInsightsParams = createInsightsParams;
  function showGenericErrorMessage(scope) {
    const resourceModel = ResourceModelHelper.getResourceModel(scope);
    MessageBox.error(resourceModel.getText("M_CARD_FAILURE_GENERIC"));
  }
  _exports.showGenericErrorMessage = showGenericErrorMessage;
  function hasInsightActionEnabled(actions, filterBarId, insightsRelevantColumns) {
    if (!isInsightsCardCreationPossible(filterBarId, insightsRelevantColumns)) {
      return false;
    }
    let isInsightActionEnabled = false;
    for (const actionElement of actions) {
      const action = actionElement.getAction();
      const isActionForInsights = action.getId().includes("StandardAction::Insights");
      //QUALMS: I don´t like that we currently do not have a clean model approach here and have to check for now
      //		  the enablement and visibility state of the action
      isInsightActionEnabled = isActionForInsights && action.getVisible() && action.getEnabled();
      if (isInsightActionEnabled) {
        break;
      }
    }
    return isInsightActionEnabled;
  }
  _exports.hasInsightActionEnabled = hasInsightActionEnabled;
  return _exports;
}, false);
//# sourceMappingURL=CommonInsightsHelper-dbg.js.map

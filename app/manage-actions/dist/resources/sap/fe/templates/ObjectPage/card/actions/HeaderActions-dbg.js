/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/ActionHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/templates/ObjectPage/card/BaseCardContentProvider"], function (Log, ConfigurableObject, StableIdHelper, ActionHelper, FieldControlHelper, PropertyHelper, UIFormatters, BaseCardContentProvider) {
  "use strict";

  var _exports = {};
  var isVisible = UIFormatters.isVisible;
  var getActionEnabledExpression = UIFormatters.getActionEnabledExpression;
  var isMultiLineText = PropertyHelper.isMultiLineText;
  var isActionParameterRequiredExpression = FieldControlHelper.isActionParameterRequiredExpression;
  var getIsActionCriticalExpression = ActionHelper.getIsActionCriticalExpression;
  var getStableIdPartFromDataField = StableIdHelper.getStableIdPartFromDataField;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let ACStyle = /*#__PURE__*/function (ACStyle) {
    ACStyle["Default"] = "default";
    ACStyle["Positive"] = "positive";
    ACStyle["Destructive"] = "destructive";
    return ACStyle;
  }({});
  _exports.ACStyle = ACStyle;
  let ACAction = /*#__PURE__*/function (ACAction) {
    ACAction["Execute"] = "Action.Execute";
    ACAction["ShowCard"] = "Action.ShowCard";
    return ACAction;
  }({});
  _exports.ACAction = ACAction;
  let ACInput = /*#__PURE__*/function (ACInput) {
    ACInput["Text"] = "Input.Text";
    ACInput["ChoiceSet"] = "Input.ChoiceSet";
    ACInput["Date"] = "Input.Date";
    return ACInput;
  }({});
  _exports.ACInput = ACInput;
  const ACTION_OK = "OK";
  let HeaderActions = /*#__PURE__*/function (_BaseCardContentProvi) {
    function HeaderActions(convertedTypes, config) {
      var _this;
      _this = _BaseCardContentProvi.call(this, convertedTypes, config) || this;
      _this.actions = [];
      try {
        const contextInfo = _this.getCardConfigurationByKey("contextInfo");
        const {
          contextPath
        } = contextInfo;
        const entityType = _this.getEntityType();
        if (!entityType) {
          Log.error(`FE : V4 : Adaptive Card header actions : no EntityType found at context path: ${contextPath}`);
          return _this || _assertThisInitialized(_this);
        }
        const actions = _this.getAnnotatedHeaderActions(entityType);
        if (actions.length > 0) {
          const configuredActions = _this.getConfiguredActions(actions);
          _this.actions = configuredActions.reduce(_this.getActionInAdaptiveCardFormat.bind(_this), []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error("Error while creating the card defintion", message);
      }
      return _this || _assertThisInitialized(_this);
    }

    /**
     * Get action type based on the need for user inputs for action parameters.
     * @param edmAction Converted metadata action.
     * @returns Action type to use
     */
    _exports = HeaderActions;
    _inheritsLoose(HeaderActions, _BaseCardContentProvi);
    var _proto = HeaderActions.prototype;
    /**
     * Get the card actions.
     * @returns Card actions.
     */
    _proto.getCardActions = function getCardActions() {
      return this.actions;
    };
    _proto.getAdaptiveCardActionType = function getAdaptiveCardActionType(edmAction) {
      const {
        isBound,
        isFunction,
        parameters
      } = edmAction;
      if (isFunction) {
        // functions are ignored
        return;
      }
      const needUserInputParameters = parameters.length > (isBound ? 1 : 0);
      return needUserInputParameters ? ACAction.ShowCard : ACAction.Execute;
    }

    /**
     * Get Action parameter elements to add to the action card body.
     * @param actionTarget Converted metadata action.
     * @returns Input elements for action parameters
     */;
    _proto.getActionCardBodyWithParameterFields = function getActionCardBodyWithParameterFields(actionTarget) {
      const {
        isBound
      } = actionTarget;
      return actionTarget.parameters.reduce((elements, parameter, index) => {
        if (isBound && index === 0) {
          return elements;
        }
        let inputElement;
        const labelTerm = parameter.annotations.Common?.Label;
        if (parameter.type === "Edm.Date" || parameter.type === "Edm.DateTimeOffset" || parameter.type === "Edm.DateTime") {
          inputElement = {
            type: ACInput.Date,
            id: parameter.name,
            label: labelTerm?.toString() ?? parameter.name,
            isRequired: this.getRequired(parameter, actionTarget) ?? undefined
          };
          elements.push(inputElement);
        } else {
          inputElement = {
            type: ACInput.Text,
            id: parameter.name,
            label: labelTerm?.toString() ?? parameter.name,
            isRequired: this.getRequired(parameter, actionTarget) ?? undefined,
            isMultiline: isMultiLineText(parameter) ?? undefined
          };
          elements.push(inputElement);
        }
        return elements;
      }, []);
    }

    /**
     * Get action object with parameter elements.
     * @param actionTarget Converted metadata action.
     * @param actionDetails Action properties.
     * @returns Action object with parameters.
     */;
    _proto.getActionWithParameters = function getActionWithParameters(actionTarget, actionDetails) {
      const body = this.getActionCardBodyWithParameterFields(actionTarget);
      const {
        verb,
        title,
        style,
        data
      } = actionDetails;
      const actionWithParameters = {
        type: ACAction.Execute,
        verb,
        data,
        title: ACTION_OK,
        style: ACStyle.Positive
      };
      return {
        type: ACAction.ShowCard,
        title,
        style,
        card: {
          type: "AdaptiveCard",
          body,
          actions: [actionWithParameters]
        }
      };
    }

    /**
     * Get action for adaptive card.
     * @param dataFieldForAction DataFieldForAction annotation
     * @returns Action to add.
     */;
    _proto.getAction = function getAction(dataFieldForAction) {
      const {
        ActionTarget: actionTarget
      } = dataFieldForAction;
      const actionDetails = this.getActionDetails(dataFieldForAction);
      if (!actionTarget || !actionDetails) {
        return undefined;
      }
      const actionType = this.getAdaptiveCardActionType(actionTarget);
      let retAction;
      if (actionType === ACAction.Execute) {
        // Actions without parameters
        retAction = {
          type: actionType,
          ...actionDetails
        };
      } else if (actionType === ACAction.ShowCard) {
        // Action with parameters
        retAction = this.getActionWithParameters(actionTarget, actionDetails);
      }
      return retAction;
    }

    /**
     * Get data that needs to be part of action.
     * @param actionTarget Converted metadata action.
     * @returns Action data that needs to be passed with the action.
     */;
    _proto.getActionData = function getActionData(actionTarget) {
      const {
        isBound
      } = actionTarget;
      const contextInfo = this.getCardConfigurationByKey("contextInfo");
      const {
        bindingContextPath
      } = contextInfo;
      const bindingContextPathRelativeToService = bindingContextPath.startsWith("/") ? bindingContextPath.substring(1) : bindingContextPath;
      const serviceURI = this.getCardConfigurationByKey("serviceURI");
      const contextURL = `${serviceURI}${bindingContextPathRelativeToService}`;
      return {
        contextURL,
        serviceURI: isBound ? undefined : serviceURI,
        isConfirmationRequired: this.getIsCriticalForAdaptiveCardAction(actionTarget) ?? undefined
      };
    }

    /**
     * Get action for adaptive card.
     * @param dataFieldForAction DataFieldForAction annotation
     * @returns Action to add.
     */;
    _proto.getActionDetails = function getActionDetails(dataFieldForAction) {
      const {
        ActionTarget: actionTarget
      } = dataFieldForAction;
      if (!actionTarget) {
        return;
      }

      // Verb creation for actions:
      //
      // 1. Bound action:
      //    Verb needs to be relative to contextURL. format: '<metadata namespace>.<action name>'
      //    Example:
      //        Metadata namespace: 'com.c_som_sd'
      //        Action name: 'boundAction'
      //        Verb: 'com.c_som_sd.boundAction'
      //        ContextURL: /SOM(1)
      //        URL to trigger POST call(this will be created by the BOT, <serviceURI + contextURL + verb>): 'https://<serviceURI>/SOM('1')/com.c_som_sd.boundAction'
      //
      // 2. Unbound action:
      //    Verb needs to be relative to serviceURI. format: '<action name>'
      //    Example:
      //        Action name: 'unboundAction'
      //        Verb: 'unboundAction'
      //        ContextURL: undefined
      //        URL to trigger POST call(this will be created by the BOT, <serviceURI + verb>): 'https://<serviceURI>/unboundAction'
      const actionToTrigger = actionTarget.isBound ? dataFieldForAction.Action.toString() : actionTarget.name,
        // We remove the overload part from the action. like 'com.c_som_sd.boundAction(com.c_som_sd.returnType)', we need only 'com.c_som_sd.boundAction' as verb.
        verb = actionToTrigger.replace(/\((.*)\)$/, ""),
        title = dataFieldForAction.Label?.toString() ?? actionTarget.name,
        style = this.getActionStyle(dataFieldForAction),
        data = this.getActionData(actionTarget);
      return {
        verb,
        title,
        style,
        data
      };
    }

    /**
     * Generates action sets for adaptive card.
     *
     * As of now, only considering 'Annotated Actions'.
     * Not supported:
     * 1. Standard actions
     * 2. Manifest actions
     *
     * Presently, only first two actions shall be passed to the adaptive card.
     *
     * This function can be used by Array.reduce.
     * @param adaptiveCardActions Actions array to be returned.
     * @param actionElement DataFieldForAction that needs to be converted.
     * @returns An Array of Actions that need to be concatenated to card body.
     */;
    _proto.getActionInAdaptiveCardFormat = function getActionInAdaptiveCardFormat(adaptiveCardActions, actionElement) {
      if (adaptiveCardActions.length > 1) {
        // Note: We only expect first 2 actions in MS teams adaptive cards. This might change in the future.
        return adaptiveCardActions;
      }
      const {
        action: dataFieldForAction,
        title: titleOverride
      } = actionElement;
      const {
        ActionTarget: actionTarget
      } = dataFieldForAction;

      // No Action in case:
      // 1. actionTarget not available.
      // 1. statically not visible.
      // 2. statically disabled.
      // 3. action is static action.
      if (!actionTarget) {
        return adaptiveCardActions;
      }
      const isActionVisible = actionElement.isVisible ?? this.getVisibleForAdaptiveCardAction(dataFieldForAction) ?? undefined;
      const isEnabled = this.getEnabledForAdaptiveCardAction(actionTarget) ?? undefined;

      // NOTE: '$when' is used to control visibility of actions. Looks like the value needs to always be an expression of format '${<exp>}'.
      // So, direct strings like 'true' and 'false' which are expected to work for normal card properties don't work for $when.
      // We would need to handle such cases independently.
      let whenValue;
      if (typeof isActionVisible === "boolean" && isActionVisible === false) {
        return adaptiveCardActions;
      } else if (typeof isActionVisible === "string" && isActionVisible && /^\$\{.*\}/i.test(isActionVisible)) {
        // visible is an expression of format '${<exp>}'.
        whenValue = isActionVisible;
      } else if (isActionVisible === "true") {
        // statically visible
        whenValue = undefined;
      } else if (isActionVisible === "false") {
        // statically not visible
        return adaptiveCardActions;
      }
      if (isEnabled === "false" || this.isStaticAction(actionTarget) || this.isCopyAction(dataFieldForAction)) {
        return adaptiveCardActions;
      }
      const action = this.getAction(dataFieldForAction);
      if (action) {
        const visualUpdates = {
          isEnabled,
          $when: whenValue,
          title: titleOverride ?? action.title
        };
        adaptiveCardActions.push({
          ...action,
          ...visualUpdates
        });
      }
      return adaptiveCardActions;
    }

    /**
     * Get the DataFieldForActions for adaptive card.
     * @param entityType EntityType.
     * @returns DataFieldForActions that are applicable to be shown in the adaptive card.
     */;
    _proto.getAnnotatedHeaderActions = function getAnnotatedHeaderActions(entityType) {
      const identificationAnnotation = entityType.annotations.UI?.Identification;
      return identificationAnnotation ? identificationAnnotation.filter(dataField => dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && !dataField.Determining) : [];
    }

    /**
     * Get configured actions.
     * @param annotatedActions Annotated actions from the converted metadata.
     * @returns ActionConfigElements to create actions for card definition.
     */;
    _proto.getConfiguredActions = function getConfiguredActions(annotatedActions) {
      // Actions from annotations.
      const actionConfigs = this.getCardConfigurationByKey("actions");
      const annotatedActionElements = annotatedActions.map(action => ({
        key: action && getStableIdPartFromDataField(action),
        action
      }));
      if (!actionConfigs || Object.keys(actionConfigs).length === 0) {
        return annotatedActionElements;
      }

      // Custom Action configs.
      const customConfigActionNames = Object.keys(actionConfigs);
      const customActionConfigElements = customConfigActionNames.reduce((customActionElements, customConfigActionKey) => {
        const relevantActionElement = annotatedActionElements.find(actionElement => actionElement.key === customConfigActionKey);
        if (relevantActionElement) {
          customActionElements[customConfigActionKey] = {
            key: customConfigActionKey,
            action: relevantActionElement.action,
            position: {
              placement: Placement.After
            },
            ...actionConfigs[customConfigActionKey]
          };
        }
        return customActionElements;
      }, {});

      // Final action elements
      const actionOverwriteConfig = {
        title: OverrideType.overwrite,
        position: OverrideType.overwrite,
        isVisible: OverrideType.overwrite
      };
      return insertCustomElements(annotatedActionElements, customActionConfigElements, actionOverwriteConfig);
    }

    /**************************************************************************/
    /* Functions for creating template bindings and getting action properties */
    /**************************************************************************/

    /**
     * Get action visibility.
     * @param dataFieldForAction DataFieldForAction annotation
     * @returns Boolean
     */;
    _proto.getVisibleForAdaptiveCardAction = function getVisibleForAdaptiveCardAction(dataFieldForAction) {
      const visibilityExp = isVisible(dataFieldForAction);
      return this.updatePathsAndGetCompiledExpression(visibilityExp);
    }

    /**
     * Get action style for the action button.
     * @param dataFieldForAction DataFieldForAction annotation
     * @returns Style of the action button
     */;
    _proto.getActionStyle = function getActionStyle(dataFieldForAction) {
      // TODO: compile to adaptive card binding string for dynamic annotation.
      let style = ACStyle.Default;
      const criticality = dataFieldForAction.Criticality;
      if (criticality && typeof criticality === "string") {
        switch (criticality) {
          case "UI.CriticalityType/Positive":
            style = ACStyle.Positive;
            break;
          case "UI.CriticalityType/Negative":
            style = ACStyle.Destructive;
            break;
          default:
            style = ACStyle.Default;
        }
      }
      return style;
    }

    /**
     * Check if action is critical.
     * @param actionTarget Action definition.
     * @returns Boolean
     */;
    _proto.getIsCriticalForAdaptiveCardAction = function getIsCriticalForAdaptiveCardAction(actionTarget) {
      const isActionCritical = getIsActionCriticalExpression(actionTarget, this.convertedTypes);
      return this.updatePathsAndGetCompiledExpression(isActionCritical);
    }

    /**
     * Get action enablement.
     * @param actionTarget Action definition.
     * @returns Boolean
     */;
    _proto.getEnabledForAdaptiveCardAction = function getEnabledForAdaptiveCardAction(actionTarget) {
      const enabledExpression = getActionEnabledExpression(actionTarget, this.convertedTypes);
      return this.updatePathsAndGetCompiledExpression(enabledExpression);
    }

    /**
     * Check for static action.
     * @param actionTarget Action definition.
     * @returns Boolean.
     */;
    _proto.isStaticAction = function isStaticAction(actionTarget) {
      const {
        isBound,
        parameters
      } = actionTarget;
      return isBound && parameters[0] && parameters[0].isCollection;
    }

    /**
     * Check for copy action.
     * @param dataField Action definition.
     * @returns Boolean.
     */;
    _proto.isCopyAction = function isCopyAction(dataField) {
      return dataField.annotations?.UI?.IsCopyAction?.valueOf() === true;
    }

    /**
     * Check if parameter input is required for action execution.
     * @param parameter Action parameter.
     * @param actionTarget
     * @returns Boolean
     */;
    _proto.getRequired = function getRequired(parameter, actionTarget) {
      const fieldControlExpression = isActionParameterRequiredExpression(parameter, actionTarget, this.convertedTypes);
      return this.updatePathsAndGetCompiledExpression(fieldControlExpression);
    };
    return HeaderActions;
  }(BaseCardContentProvider);
  _exports = HeaderActions;
  return _exports;
}, false);
//# sourceMappingURL=HeaderActions-dbg.js.map

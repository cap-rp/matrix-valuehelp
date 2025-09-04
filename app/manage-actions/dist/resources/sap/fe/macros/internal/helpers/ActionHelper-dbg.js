/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/CommonHelper"], function (BindingToolkit, BindingHelper, TypeGuards, CommonHelper) {
  "use strict";

  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  const ActionHelper = {
    /**
     * Returns an array of actions that are not enabled with a multiple selection.
     * @param collections Array of records
     * @returns An array of action paths
     */
    getMultiSelectDisabledActions(collections) {
      const multiSelectDisabledActions = [];
      const actions = collections?.filter(collection => collection.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") ?? [];
      for (const action of actions) {
        const actionTarget = action?.ActionTarget;
        if (actionTarget?.isBound === true) {
          for (const parameter of actionTarget.parameters) {
            if (isPathAnnotationExpression(parameter.annotations.UI?.Hidden) || isPathAnnotationExpression(parameter.annotations.Common?.FieldControl)) {
              multiSelectDisabledActions.push(actionTarget.name);
            }
          }
        }
      }
      return multiSelectDisabledActions;
    },
    /**
     * Method to get the expression for the 'press' event for the DataFieldForActionButton.
     * @param sId Control ID
     * @param oAction Action object
     * @param oParams Parameters
     * @param oParams.invocationGrouping Invocation grouping
     * @param oParams.controlId Control ID
     * @param oParams.operationAvailableMap OperationAvailableMap
     * @param oParams.model Model
     * @param oParams.label Label
     * @param oParams.contexts Contexts
     * @param sOperationAvailableMap OperationAvailableMap as stringified JSON object
     * @returns The binding expression
     */
    getPressEventDataFieldForActionButton(sId, oAction, oParams, sOperationAvailableMap) {
      const sInvocationGrouping = oAction.InvocationGrouping && oAction.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
      oParams = oParams || {};
      oParams["invocationGrouping"] = CommonHelper.addSingleQuotes(sInvocationGrouping);
      oParams["controlId"] = CommonHelper.addSingleQuotes(sId);
      oParams["operationAvailableMap"] = CommonHelper.addSingleQuotes(sOperationAvailableMap);
      oParams["model"] = "${$source>/}.getModel()";
      oParams["label"] = oAction.Label && CommonHelper.addSingleQuotes(oAction.Label, true);
      return CommonHelper.generateFunction(".editFlow.invokeAction", CommonHelper.addSingleQuotes(oAction.Action), CommonHelper.objectToString({
        ...oParams,
        ...{
          feFrameworkCall: true
        }
      }));
    },
    /**
     * Return Number of contexts expression.
     * @param vActionEnabled Status of action (single or multiselect)
     * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
     * @returns Number of contexts expression
     */
    getNumberOfContextsExpression(vActionEnabled) {
      let forContextMenu = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      let sNumberOfSelectedContexts;
      const selectedContext = !forContextMenu ? "${internal>numberOfSelectedContexts}" : "${internal>contextmenu/numberOfSelectedContexts}";
      if (vActionEnabled === "single") {
        sNumberOfSelectedContexts = selectedContext + " === 1";
      } else {
        sNumberOfSelectedContexts = selectedContext + " > 0";
      }
      return sNumberOfSelectedContexts;
    },
    /**
     * Return UI Control (LineItem/Chart) Operation Available Map.
     * @param aCollection Array of records
     * @param sControl Control name (lineItem / chart)
     * @param oContext Converter context
     * @returns The record containing all action names and their corresponding Core.OperationAvailable property paths
     */
    getOperationAvailableMap(collection, control, context) {
      let operationAvailableMap = {};
      if (collection) {
        collection.forEach(record => {
          if (record.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
            const actionName = record.Action;
            if (!actionName?.includes("/") && !record.Determining) {
              if (control === "table") {
                operationAvailableMap = this._getOperationAvailableMapOfTable(record, actionName, operationAvailableMap, context);
              } else if (control === "chart") {
                operationAvailableMap = this._getOperationAvailableMapOfChart(actionName, operationAvailableMap, context);
              }
            }
          } else if (record.$Type === "com.sap.vocabularies.UI.v1.DataFieldForActionGroup") {
            operationAvailableMap = this.getOperationAvailableMap(record.Actions, control, context);
          }
        });
      }
      return operationAvailableMap;
    },
    /**
     * Return LineItem Action Operation Available Map.
     * @private
     * @param oDataFieldForAction Data field for action object
     * @param sActionName Action name
     * @param oOperationAvailableMap Operation available map object
     * @param oConverterContext Converter context object
     * @returns The record containing all action name of line item and the corresponding Core.OperationAvailable property path
     */
    _getOperationAvailableMapOfTable(oDataFieldForAction, sActionName, oOperationAvailableMap, oConverterContext) {
      const actionTarget = oDataFieldForAction.ActionTarget;
      if (actionTarget?.annotations?.Core?.OperationAvailable === null) {
        // We disabled action advertisement but kept it in the code for the time being
        //oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
      } else if (actionTarget?.parameters?.length) {
        const bindingParameterFullName = actionTarget.parameters[0].fullyQualifiedName,
          targetExpression = getExpressionFromAnnotation(actionTarget?.annotations?.Core?.OperationAvailable, [], undefined, path => bindingContextPathVisitor(path, oConverterContext.getConvertedTypes(), bindingParameterFullName));
        if (isPathInModelExpression(targetExpression)) {
          oOperationAvailableMap = this._addToMap(sActionName, targetExpression.path, oOperationAvailableMap);
        } else if (actionTarget?.annotations?.Core?.OperationAvailable !== undefined) {
          oOperationAvailableMap = this._addToMap(sActionName, targetExpression, oOperationAvailableMap);
        }
      }
      return oOperationAvailableMap;
    },
    /**
     * Return LineItem Action Operation Available Map.
     * @private
     * @param sActionName Action name
     * @param oOperationAvailableMap Operation available map object
     * @param oContext Context object
     * @param oContext.context Context object
     * @returns The record containing all action name of chart and the corresponding Core.OperationAvailable property path
     */
    _getOperationAvailableMapOfChart(sActionName, oOperationAvailableMap, oContext) {
      let oResult = CommonHelper.getActionPath(oContext.context, false, sActionName, true);
      if (oResult === null) {
        oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
      } else {
        oResult = CommonHelper.getActionPath(oContext.context, false, sActionName);
        if (oResult.sProperty) {
          oOperationAvailableMap = this._addToMap(sActionName, oResult.sProperty.substring(oResult.sBindingParameter.length + 1), oOperationAvailableMap);
        }
      }
      return oOperationAvailableMap;
    },
    /**
     * Return Map.
     * @private
     * @param sKey Key
     * @param oValue Value
     * @param oMap Map object
     * @returns Map object
     */
    _addToMap(sKey, oValue, oMap) {
      if (sKey && oMap) {
        oMap[sKey] = oValue;
      }
      return oMap;
    }
  };
  return ActionHelper;
}, false);
//# sourceMappingURL=ActionHelper-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/templates/ObjectPage/ObjectPageTemplating"], function (BindingToolkit, ObjectPageTemplating) {
  "use strict";

  var _exports = {};
  var getPressExpressionForPrimaryAction = ObjectPageTemplating.getPressExpressionForPrimaryAction;
  var getEditCommandExecutionVisible = ObjectPageTemplating.getEditCommandExecutionVisible;
  var getEditCommandExecutionEnabled = ObjectPageTemplating.getEditCommandExecutionEnabled;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  const extendObjectPageDefinition = function (pageDefinition, converterContext) {
    const convertedPageDefinition = pageDefinition;
    convertedPageDefinition.primaryAction = getPrimaryAction(converterContext, pageDefinition.header.actions, pageDefinition.footerActions);
    convertedPageDefinition.designtime = getDesigntime();
    return convertedPageDefinition;
  };

  /**
   * Method to get the expression for the execute event of the forward action.
   * Generates primaryActionExpression to be executed on the keyboard shortcut Ctrl+Enter with the
   * forward flow (priority is the semantic positive action OR if that's not there, then the primary action).
   * @param converterContext The converter context
   * @param headerActions An array containing all the actions for this ObjectPage header
   * @param footerActions An array containing all the actions for this ObjectPage footer
   * @returns  Binding expression or function string
   */
  _exports.extendObjectPageDefinition = extendObjectPageDefinition;
  const getPrimaryAction = function (converterContext, headerActions, footerActions) {
    let primaryActionExpression = "";
    const aActions = [...headerActions, ...footerActions];
    const getBindingExp = function (sExpression) {
      if (sExpression && sExpression.includes("{=")) {
        return sExpression.replace("{=", "(").slice(0, -1) + ")";
      }
      return sExpression;
    };
    const aSemanticPositiveActions = aActions.filter(oAction => {
      if (oAction?.annotationPath) {
        const targetObject = converterContext.getConverterContextFor(oAction?.annotationPath).getDataModelObjectPath().targetObject;
        const targetCriticality = getExpressionFromAnnotation(targetObject?.Criticality);
        if (isConstant(targetCriticality) && targetCriticality.value === "UI.CriticalityType/Positive") {
          return true;
        }
      }
    });
    const oEntitySet = converterContext.getEntitySet();
    if (aSemanticPositiveActions.length > 0) {
      primaryActionExpression = getPressExpressionForPrimaryAction(aSemanticPositiveActions[0].annotationPath ? converterContext.getConverterContextFor(aSemanticPositiveActions[0].annotationPath).getDataModelObjectPath().targetObject : undefined, oEntitySet?.name, aSemanticPositiveActions[0], getBindingExp(aSemanticPositiveActions[0].visible ?? "true"), getBindingExp(aSemanticPositiveActions[0].enabled ?? "true"), getBindingExp(getEditCommandExecutionVisible(headerActions)), getBindingExp(getEditCommandExecutionEnabled(headerActions)));
    } else {
      primaryActionExpression = getPressExpressionForPrimaryAction(undefined, oEntitySet?.name, null, "false", "false", getBindingExp(getEditCommandExecutionVisible(headerActions)), getBindingExp(getEditCommandExecutionEnabled(headerActions)));
    }
    return primaryActionExpression;
  };
  _exports.getPrimaryAction = getPrimaryAction;
  function getDesigntime() {
    return "sap/fe/templates/ObjectPage/designtime/ObjectPage.designtime";
  }
  _exports.getDesigntime = getDesigntime;
  return _exports;
}, false);
//# sourceMappingURL=ExtendPageDefinition-dbg.js.map

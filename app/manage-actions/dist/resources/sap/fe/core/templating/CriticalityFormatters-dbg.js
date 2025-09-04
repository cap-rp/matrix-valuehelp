/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/formatters/CriticalityFormatter", "sap/fe/core/templating/DataModelPathHelper"], function (BindingToolkit, criticalityFormatters, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const getCriticalityExpression = (target, propertyDataModelPath) => {
    const relativeLocations = propertyDataModelPath ? getRelativePaths(propertyDataModelPath) : undefined;
    const annotationTarget = target.targetObject ?? target;
    if (annotationTarget.Criticality) {
      const criticality = criticalityFormatters.getCriticality(annotationTarget.Criticality);
      if (criticality) {
        // it's a constant so no need to use a virtual property
        return constant(criticality);
      }
      return pathInModel(`${annotationTarget.fullyQualifiedName}@$ui5.fe.virtual.criticality`, undefined, relativeLocations);
    }
    return constant(undefined);
  };
  const getCriticalityExpressionForCards = (criticalityExpression, isInsightsCard) => {
    const negativeCriticality = isInsightsCard ? constant("sap-icon://error") : constant("attention");
    const criticalCriticality = isInsightsCard ? constant("sap-icon://warning") : constant("warning");
    const positiveCriticality = isInsightsCard ? constant("sap-icon://status-positive") : constant("good");
    const informationCriticality = isInsightsCard ? ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Information")), equal(criticalityExpression, constant(5)), equal(criticalityExpression, constant("5"))), constant("sap-icon://information"), constant("")) : constant("default");
    return ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Negative")), equal(criticalityExpression, constant(1)), equal(criticalityExpression, constant("1"))), negativeCriticality, ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Critical")), equal(criticalityExpression, constant(2)), equal(criticalityExpression, constant("2"))), criticalCriticality, ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Positive")), equal(criticalityExpression, constant(3)), equal(criticalityExpression, constant("3"))), positiveCriticality, informationCriticality)));
  };

  /**
   * Builds an expression to determine the criticality status for integration cards.
   * Used when virtual properties cannot be applied.
   * @param criticalityProperty The criticality annotation value (string or number).
   * @returns An expression resolving to the criticality status for integration cards.
   */
  _exports.getCriticalityExpressionForCards = getCriticalityExpressionForCards;
  const criticalityExpressionForIntegrationCards = criticalityProperty => {
    if (criticalityProperty) {
      const criticalityExpression = getExpressionFromAnnotation(criticalityProperty);
      return compileExpression(ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Negative")), equal(criticalityExpression, constant(1)), equal(criticalityExpression, constant("1"))), constant("Error"), ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Critical")), equal(criticalityExpression, constant(2)), equal(criticalityExpression, constant("2"))), constant("Warning"), ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Positive")), equal(criticalityExpression, constant(3)), equal(criticalityExpression, constant("3"))), constant("Success"), ifElse(or(equal(criticalityExpression, constant("UI.CriticalityType/Information")), equal(criticalityExpression, constant(5)), equal(criticalityExpression, constant("5"))), constant("Information"), constant("None"))))));
    }
  };

  /**
   * Builds an expression to determine the criticality icon for integration cards.
   * Used when virtual properties cannot be applied.
   * @param target The target object containing the criticality property.
   * @returns An expression resolving to the criticality icon for integration cards.
   */
  _exports.criticalityExpressionForIntegrationCards = criticalityExpressionForIntegrationCards;
  const criticalityIconExpressionForIntegrationCards = target => {
    const criticalityProperty = target?.Criticality;
    const criticalityExpression = getExpressionFromAnnotation(criticalityProperty);
    const condition = target.CriticalityRepresentation && target.CriticalityRepresentation === "UI.CriticalityRepresentationType/WithoutIcon";
    let iconPath;
    if (!condition) {
      if (criticalityProperty) {
        iconPath = getCriticalityExpressionForCards(criticalityExpression, true);
      } else {
        iconPath = constant("");
      }
    } else {
      iconPath = constant("");
    }
    return compileExpression(iconPath);
  };

  /**
   * Returns an expression to set button type based on Criticality
   * Supported Criticality: Positive, Negative, Critical, and Information leading to Success, Error, Warning, and None state respectively.
   * @param target A DataField, a DataPoint, or a DataModelObjectPath.
   * @param propertyDataModelPath DataModelObjectPath.
   * @returns An expression to deduce the state of an objectStatus.
   */
  _exports.criticalityIconExpressionForIntegrationCards = criticalityIconExpressionForIntegrationCards;
  const buildExpressionForCriticalityColor = (target, propertyDataModelPath) => {
    const virtualCriticalityExpression = getCriticalityExpression(target, propertyDataModelPath);
    return compileExpression(ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Negative")), constant("Error"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Critical")), constant("Warning"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Positive")), constant("Success"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Information")), constant("Information"), constant("None"))))));
  };

  /**
   * Returns an expression to set icon type based on Criticality
   * Supported Criticality: Positive, Negative, Critical and Information.
   * @param target A DataField a DataPoint or a DataModelObjectPath.
   * @param [propertyDataModelPath] DataModelObjectPath.
   * @returns An expression to deduce the icon of an objectStatus.
   */
  _exports.buildExpressionForCriticalityColor = buildExpressionForCriticalityColor;
  const buildExpressionForCriticalityIcon = (target, propertyDataModelPath) => {
    const annotationTarget = target.targetObject ?? target;
    const virtualCriticalityExpression = getCriticalityExpression(annotationTarget, propertyDataModelPath);
    const condition = annotationTarget.CriticalityRepresentation === "UI.CriticalityRepresentationType/WithoutIcon";
    let iconPath;
    if (!condition) {
      iconPath = ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Negative")), constant("sap-icon://error"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Critical")), constant("sap-icon://warning"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Positive")), constant("sap-icon://status-positive"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Information")), constant("sap-icon://information"), constant("")))));
    } else {
      iconPath = constant("");
    }
    return compileExpression(iconPath);
  };

  /**
   * Returns an expression to set button type based on Criticality
   * Supported Criticality: Positive and Negative leading to Accept and Reject button type respectively.
   * @param annotationTarget A DataField, DataPoint, DataModelObjectPath.
   * @returns An expression to deduce button type.
   */
  _exports.buildExpressionForCriticalityIcon = buildExpressionForCriticalityIcon;
  const buildExpressionForCriticalityButtonType = annotationTarget => {
    const virtualCriticalityExpression = getCriticalityExpression(annotationTarget);
    return compileExpression(ifElse(equal(virtualCriticalityExpression, constant(undefined)), constant("Ghost"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Negative")), constant("Reject"), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Positive")), constant("Accept"), constant("Default")))));
  };

  /**
   * Returns an expression to set color in MicroCharts based on Criticality
   * Supported Criticality: Positive, Negative and Critical leading to Good, Error and Critical color respectively.
   * @param dataPoint A DataField, DataPoint, DataModelObjectPath
   * @returns An expression to deduce colors in Microcharts
   */
  _exports.buildExpressionForCriticalityButtonType = buildExpressionForCriticalityButtonType;
  const buildExpressionForCriticalityColorMicroChart = dataPoint => {
    const annotationTarget = dataPoint?.targetObject ?? dataPoint;
    const sColorExpression = buildExpressionForCriticality(annotationTarget);
    return compileExpression(sColorExpression);
  };

  /**
   * Generates an expression to set color based on Criticality.
   * @param annotationTarget A DataField, DataPoint
   * @param criticalityMap Criticality Mapper
   * @returns An expression to deduce colors in datapoints
   */
  _exports.buildExpressionForCriticalityColorMicroChart = buildExpressionForCriticalityColorMicroChart;
  const buildExpressionForCriticality = function (annotationTarget) {
    let criticalityMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      error: "Error",
      critical: "Critical",
      good: "Good",
      neutral: "Neutral"
    };
    const virtualCriticalityExpression = getCriticalityExpression(annotationTarget);
    return ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Negative")), constant(criticalityMap.error), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Critical")), constant(criticalityMap.critical), ifElse(equal(virtualCriticalityExpression, constant("UI.CriticalityType/Positive")), constant(criticalityMap.good), constant(criticalityMap.neutral))));
  };
  _exports.buildExpressionForCriticality = buildExpressionForCriticality;
  return _exports;
}, false);
//# sourceMappingURL=CriticalityFormatters-dbg.js.map

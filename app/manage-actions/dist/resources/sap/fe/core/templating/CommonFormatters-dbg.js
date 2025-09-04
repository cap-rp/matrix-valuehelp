/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "../converters/helpers/DataFieldHelper"], function (BindingToolkit, valueFormatters, TypeGuards, DataModelPathHelper, UIFormatters, DataFieldHelper) {
  "use strict";

  var _exports = {};
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  // Import-export methods related to the common annotations used by the converter to use them in the templating through the Common Formatters.

  /**
   * Retrieves the expressionBinding created out of a binding expression.
   * @param expression The expression which needs to be compiled
   * @returns The expression-binding string
   */
  const getExpressionBinding = function (expression) {
    return compileExpression(expression);
  };
  _exports.getExpressionBinding = getExpressionBinding;
  const getBindingWithTextArrangement = function (propertyDataModelPath, propertyBindingExpression, fieldFormatOptions, customFormatter) {
    const targetDisplayModeOverride = fieldFormatOptions?.displayMode;
    let outExpression = propertyBindingExpression;
    const propertyDefinition = isPropertyPathExpression(propertyDataModelPath.targetObject) ? propertyDataModelPath.targetObject.$target : propertyDataModelPath.targetObject;
    const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
    const commonText = propertyDefinition?.annotations?.Common?.Text;
    const relativeLocation = getRelativePaths(propertyDataModelPath);
    const formatter = customFormatter || valueFormatters.formatWithBrackets;
    propertyBindingExpression = propertyDefinition && formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    if (targetDisplayMode !== "Value" && commonText) {
      switch (targetDisplayMode) {
        case "Description":
          outExpression = getExpressionFromAnnotation(commonText, relativeLocation);
          break;
        case "DescriptionValue":
          outExpression = formatResult([getExpressionFromAnnotation(commonText, relativeLocation), propertyBindingExpression], formatter);
          break;
        case "ValueDescription":
          outExpression = formatResult([propertyBindingExpression, getExpressionFromAnnotation(commonText, relativeLocation)], formatter);
          break;
      }
    }
    return outExpression;
  };
  _exports.getBindingWithTextArrangement = getBindingWithTextArrangement;
  const getBindingWithText = function (targetDataModelPath, customFormatter) {
    let propertyDataModelPath;
    if (isPathAnnotationExpression(targetDataModelPath?.targetObject)) {
      propertyDataModelPath = enhanceDataModelPath(targetDataModelPath, targetDataModelPath.targetObject?.path);
    } else {
      propertyDataModelPath = targetDataModelPath;
    }
    const propertyDefinition = propertyDataModelPath.targetObject;
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(propertyDataModelPath));
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression, true);
    const textArrangementBinding = getBindingWithTextArrangement(propertyDataModelPath, propertyBindingExpression, {}, customFormatter);
    return propertyDefinition.annotations.UI && !isReferencePropertyStaticallyHidden(propertyDefinition.annotations.UI.DataFieldDefault) && compileExpression(textArrangementBinding) || undefined;
  };
  _exports.getBindingWithText = getBindingWithText;
  return _exports;
}, false);
//# sourceMappingURL=CommonFormatters-dbg.js.map

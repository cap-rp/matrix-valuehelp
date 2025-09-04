/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/AdaptiveCardExpressionCompiler", "sap/fe/core/helpers/TypeGuards"], function (BindingToolkit, AdaptiveCardExpressionCompiler, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var getAdaptiveCompilerResult = AdaptiveCardExpressionCompiler.getAdaptiveCompilerResult;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var constant = BindingToolkit.constant;
  var and = BindingToolkit.and;
  /**
   * @typedef CardContextInfo
   * @property {string} bindingContextPath - Runtime binding context path for card.
   * @property {string} contextPath - Path to the target entityType of page for the card.
   */
  /**
   * @typedef CardConfig
   * @property {string} objectTitle - Title for the card.
   * @property {string} appUrl - Browser url of the application.
   * @property {string} webUrl - Url to fetch the card data. It shall contain the query parameters like $select and $expand.
   * @property {string} serviceURI - Service url.
   * @property {CardContextInfo} contextInfo - Card's context information.
   */
  /**
   * Adaptive card json generator.
   * @param convertedTypes Converted Metadata.
   * @param config Card Configuration.
   * @experimental
   */
  let BaseCardContentProvider = /*#__PURE__*/function () {
    function BaseCardContentProvider(convertedTypes, config) {
      this.pathsToQuery = [];
      this.convertedTypes = convertedTypes;
      this.config = config;
    }
    _exports = BaseCardContentProvider;
    var _proto = BaseCardContentProvider.prototype;
    /**
     * Get property paths to query.
     * @returns Property paths that need to be queried.
     */
    _proto.getPathsToQuery = function getPathsToQuery() {
      return Array.from(new Set(this.pathsToQuery));
    }

    /**
     * Collecting property paths that need to be queried for card creation.
     * @param pathsToAdd Property paths that need to be cummulated.
     */;
    _proto.addPathsToQuery = function addPathsToQuery(pathsToAdd) {
      this.pathsToQuery = [...this.pathsToQuery, ...pathsToAdd];
    }

    /**
     * Get card configuration by key.
     * @param name Configuration key name.
     * @returns Specific card configuration.
     */;
    _proto.getCardConfigurationByKey = function getCardConfigurationByKey(name) {
      return this.config[name];
    }

    /**
     * Get converted metadata entityType of the card.
     * @returns EntityType.
     */;
    _proto.getEntityType = function getEntityType() {
      const {
        contextPath
      } = this.getCardConfigurationByKey("contextInfo");
      const resolutionTargetEntityType = this.convertedTypes.resolvePath(contextPath);
      return resolutionTargetEntityType.target;
    }

    /**
     * Get binding path of the field.
     * @param fieldPath Path of the field annotation
     * @returns Binding path of the field
     */;
    _proto.getBindingForProperty = function getBindingForProperty(fieldPath) {
      return "${" + this.getPropertyPathForCard(fieldPath) + "}";
    }

    /**
     * Replace the navigationproperty path.
     * @param propertyPath Path of the field annotation
     * @returns Property path along with navigation paths
     */;
    _proto.getPropertyPathForCard = function getPropertyPathForCard(propertyPath) {
      // Check for navigation property path and replace to adaptive card format
      if (propertyPath && propertyPath?.includes("/")) {
        propertyPath = propertyPath.replace("/", ".");
      }
      this.addPathsToQuery([propertyPath]);
      return propertyPath;
    }

    /**
     * Get binding path of the field which is configured with Text Arrangement.
     * @param property Property of the field annotation
     * @param textProperty Text property of the field annotation
     * @returns Binding path of the field with Text Arrangement
     */;
    _proto.formatTextproperty = function formatTextproperty(property, textProperty) {
      let textExpression;
      const propertyBinding = this.getPropertyPathForCard(property.getRelativePath());
      if (textProperty && textProperty.getTarget()) {
        const textArrangementType = property?.getTarget()?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement?.toString();
        const textBinding = this.getPropertyPathForCard(textProperty.getRelativePath());
        switch (textArrangementType) {
          case "UI.TextArrangementType/TextLast":
            textExpression = `\${string(${propertyBinding})} (\${string(${textBinding})})`;
            break;
          case "UI.TextArrangementType/TextOnly":
            textExpression = `\${string(${textBinding})}`;
            break;
          case "UI.TextArrangementType/TextSeparate":
            textExpression = `\${string(${propertyBinding})}`;
            break;
          case "UI.TextArrangementType/TextFirst":
          default:
            textExpression = `\${string(${textBinding})} (\${string(${propertyBinding})})`;
            break;
        }
      } else {
        textExpression = `\${string(${this.getPropertyPathForCard(property.getRelativePath())})}`;
      }
      return textExpression;
    };
    _proto.getTextBlockVisiblityForDateField = function getTextBlockVisiblityForDateField(property, additionalValue) {
      let exp = constant(true);
      if (this.targetIsProperty(property)) {
        const edmType = property.getTarget().type;
        const propertyPath = this.getPropertyPathForCard(property.getRelativePath());
        const valueExists = and(notEqual(pathInModel(propertyPath), undefined), notEqual(pathInModel(propertyPath), null));
        switch (edmType) {
          case "Edm.Date":
          case "Edm.DateTimeOffset":
          case "Edm.DateTime":
          case "Edm.Decimal":
            {
              exp = valueExists;
              break;
            }
          default:
            {
              let additionalValueExists = constant(false);
              if (additionalValue && this.targetIsProperty(additionalValue)) {
                const additionalValuePath = this.getPropertyPathForCard(additionalValue.getRelativePath());
                additionalValueExists = and(notEqual(pathInModel(additionalValuePath), undefined), notEqual(pathInModel(additionalValuePath), null));
              }
              exp = or(valueExists, additionalValueExists);
            }
        }
      }
      return exp;
    }

    /**
     * Get adaptive card binding expressions of the field which is configured with Text Arrangement.
     * @param property Property of the field annotation
     * @param textProperty Text property of the field annotation
     * @returns Binding path of the field configured with Date, DateTime and Decimal
     */;
    _proto.getFormattedTextValue = function getFormattedTextValue(property, textProperty) {
      let propertyBindingExpression;
      switch (property?.getTarget()?.type) {
        case "Edm.Date":
          propertyBindingExpression = `{{DATE(\${formatDateTime(${this.getPropertyPathForCard(property.getRelativePath())}, 'yyyy-MM-ddTHH:mm:ssZ')}, SHORT)}}`;
          break;
        case "Edm.DateTimeOffset":
        case "Edm.DateTime":
          propertyBindingExpression = `\${formatDateTime(${this.getPropertyPathForCard(property.getRelativePath())})}`;
          break;
        case "Edm.Decimal":
          propertyBindingExpression = `\${formatNumber(${this.getPropertyPathForCard(property.getRelativePath())},2)}`;
          break;
        default:
          propertyBindingExpression = this.formatTextproperty(property, textProperty);
          break;
      }
      return propertyBindingExpression;
    }

    /**
     * Get binding path of the field.
     * @param property Property of the field annotation
     * @param textProperty Text property of the field annotation
     * @returns Binding path of the field
     */;
    _proto.getValueBinding = function getValueBinding(property, textProperty) {
      let adaptiveBindingExpression = "";
      if (typeof property === "string") {
        adaptiveBindingExpression = property;
      } else if (this.targetIsProperty(property) && (!textProperty || this.targetIsProperty(textProperty))) {
        adaptiveBindingExpression = this.getFormattedTextValue(property, textProperty);
      }
      return adaptiveBindingExpression;
    }

    /**
     * Update paths to query and get compiled expression.
     * @param expression Binding toolkit expression
     * @param navigationPaths
     * @returns Compiled adaptive expression
     */;
    _proto.updatePathsAndGetCompiledExpression = function updatePathsAndGetCompiledExpression(expression, navigationPaths) {
      const {
        pathsToQuery,
        compiledExpression
      } = getAdaptiveCompilerResult(expression, navigationPaths);
      this.addPathsToQuery(pathsToQuery);
      return compiledExpression;
    };
    _proto.targetIsProperty = function targetIsProperty(metaPath) {
      const target = metaPath?.getTarget();
      return isProperty(target);
    };
    return BaseCardContentProvider;
  }();
  _exports = BaseCardContentProvider;
  return _exports;
}, false);
//# sourceMappingURL=BaseCardContentProvider-dbg.js.map

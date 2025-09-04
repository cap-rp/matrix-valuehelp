/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "../templating/UIFormatters", "./BindingToolkitEvaluator", "./TypeGuards"], function (BindingToolkit, MetaModelConverter, UIFormatters, BindingToolkitEvaluator, TypeGuards) {
  "use strict";

  var _exports = {};
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var evaluateExpression = BindingToolkitEvaluator.evaluateExpression;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  let rootContext;
  const standardRecommendationHelper = {
    /**
     * This function will process and set the recommendations according to data received from backend.
     * @param recommendations The data received from backend
     * @param internalModel The internal json model
     * @param recommendationsContexts The contexts for which recommendations are being fetched
     */
    storeRecommendations: (recommendations, internalModel, recommendationsContexts) => {
      const recommendationsData = internalModel.getProperty("/recommendationsData") || {};
      standardRecommendationHelper.clearRecommendationsDataFromModelForGivenContexts(recommendationsData, recommendationsContexts);
      standardRecommendationHelper.enhanceRecommendationModel(recommendations, recommendationsData);
      standardRecommendationHelper.updateFetchedContextPaths(recommendationsContexts, internalModel);
      standardRecommendationHelper.updateContextsKeysInModel(recommendationsData, recommendationsContexts);
      //Setting the version to 2.0 to segregate the processing
      recommendationsData["version"] = 2.0;
      internalModel.setProperty("/recommendationsData", recommendationsData);
      internalModel.refresh(true);
    },
    ignoreRecommendationForContexts: (contexts, internalModel) => {
      let recommendationContexts = internalModel.getProperty("/recommendationContexts") || [];
      const recommendationData = internalModel.getProperty("/recommendationsData");
      const ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
      contexts.forEach(context => {
        const ignoredContextPath = context.getPath();
        ignoredContextPaths.push(ignoredContextPath);
        // delete recommendation data for a context or its children filter recommendationContexts which do not match
        // a path. This will be the list of recommendations contexts to be kept in model
        recommendationContexts = recommendationContexts.filter(contextInfo => {
          return !(contextInfo?.context).getPath().startsWith(ignoredContextPath);
        });
        Object.keys(recommendationData).forEach(data => {
          if (data.startsWith(ignoredContextPath)) {
            delete recommendationData[data];
          }
        });
      });
      internalModel.setProperty("/recommendationsData", recommendationData);
      internalModel.setProperty("/recommendationContexts", recommendationContexts);
      internalModel.setProperty("/ignoredContextPaths", ignoredContextPaths);
    },
    clearIgnoredContexts: (internalModel, contextPath) => {
      let ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
      ignoredContextPaths = ignoredContextPaths.filter(ignoredContextPath => {
        return !ignoredContextPath.startsWith(contextPath);
      });
      internalModel.setProperty("/ignoredContextPaths", ignoredContextPaths);
    },
    /**
     * This function checks if there are recommendation roles for context entity type.
     * @param contextInfo Contains context and contextIdentifier
     * @param recommendationsRegistry Registry which holds the recommendation roles for all entity types
     * @returns Boolean value based on whether recommendation role exists for entityType annotation or not
     */
    checkIfRecommendationRoleExistsForContext: (contextInfo, recommendationsRegistry) => {
      const dataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath((contextInfo?.context).getPath(), (contextInfo?.context).getModel()?.getMetaModel());
      const entityType = dataModelObject?.targetEntityType.name;
      return Object.keys(recommendationsRegistry.roles).includes(entityType);
    },
    /**
     * This function updates recommendation data with keys of all contexts. This must be shown in the Accept Recommendations Dialog based on the use case.
     * @param recommendationsData
     * @param recommendationContexts
     */
    updateContextsKeysInModel: (recommendationsData, recommendationContexts) => {
      if (!recommendationsData.hasOwnProperty("keys")) {
        recommendationsData["keys"] = {};
      }
      const keysData = recommendationsData["keys"];
      recommendationContexts.forEach(context => {
        const metaModel = context.getModel()?.getMetaModel();
        const metaPath = metaModel.getMetaPath(context?.getPath());
        const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getMetaContext(metaPath));
        const semanticKeysForGivenMetaPath = dataModel.targetEntityType.annotations.Common?.SemanticKey;
        if (semanticKeysForGivenMetaPath) {
          if (keysData && !keysData.hasOwnProperty(metaPath) && semanticKeysForGivenMetaPath) {
            keysData[metaPath] = semanticKeysForGivenMetaPath.map(i => i.value);
          }
        }
      });
    },
    /**
     * This function clears the old recommendations for the context.
     * @param recommendationsData The recommendation data which is stored
     * @param recommendationsContexts The contexts for which recommendations are being fetched
     */
    clearRecommendationsDataFromModelForGivenContexts: (recommendationsData, recommendationsContexts) => {
      if (recommendationsContexts) {
        Object.keys(recommendationsData).forEach(target => {
          const idx = target.lastIndexOf(")");
          if (recommendationsContexts.find(context => {
            return context.getPath() === target.substring(0, idx + 1);
          })) {
            delete recommendationsData[target];
          }
        });
      }
    },
    /**
     * This function will enhance the recommendations according to data received from backend.
     * @param recommendations The data received from backend
     * @param recommendationsData The existing recommendation Model
     */
    enhanceRecommendationModel: (recommendations, recommendationsData) => {
      recommendations?.forEach(recommendation => {
        const target = recommendation.AIRecommendedFieldPath;
        if (target) {
          // loop through all the recommendations sent from backend
          const recommendationValues = [];
          let isPlaceholderValueFound = false;

          // set the other alternatives as recommendations
          recommendation._AIAltvRecmddFldVals?.forEach(alternativeRecommendation => {
            const recommendationValue = {
              value: alternativeRecommendation.AIRecommendedFieldValue,
              probability: alternativeRecommendation.AIRecommendedFieldScoreValue
            };
            if (recommendation.AIRecommendedFieldValue === alternativeRecommendation.AIRecommendedFieldValue) {
              isPlaceholderValueFound = true;
            }
            recommendationValues.push(recommendationValue);
          });
          recommendationsData[target] = {
            value: isPlaceholderValueFound ? recommendation.AIRecommendedFieldValue : undefined,
            text: isPlaceholderValueFound ? recommendation.AIRecommendedFieldDescription : undefined,
            additionalValues: recommendationValues
          };
        }
      });
    },
    /**
     * This function returns recommendations from standard recommendations model.
     * @param bindingContext Binding Context of the field
     * @param propertyPath Property path of the field
     * @param recommendationData Object containing recommendations
     * @returns Recommendation data for the field
     */
    getStandardRecommendations: function (bindingContext, propertyPath, recommendationData) {
      if (bindingContext && propertyPath) {
        const fullPath = bindingContext.getPath() + "/" + propertyPath;
        return recommendationData[fullPath] || undefined;
      }
    },
    /**
     * Fetches the display mode for a given target path.
     * @param targetPath
     * @param metaModel
     * @returns Display mode for target path
     */
    getDisplayModeForTargetPath(targetPath, metaModel) {
      const involvedDataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(targetPath, metaModel);
      const displayMode = involvedDataModelObject && getDisplayMode(involvedDataModelObject);
      return displayMode ? displayMode : "DescriptionValue";
    },
    /**
     * Function which informs whether a recommendation field is null or not.
     * @param context
     * @param key
     * @param propertyPath
     * @returns boolean value based on whether a recommendation field is null or not
     */

    isRecommendationFieldNull(context, key, propertyPath) {
      const property = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(key, context.getModel()?.getMetaModel());
      if (!context?.getProperty(propertyPath)) {
        const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(key, context?.getModel()?.getMetaModel());
        if (displayMode && displayMode !== "Value") {
          const text = isPathAnnotationExpression(property?.targetObject?.annotations?.Common?.Text) && property?.targetObject?.annotations?.Common?.Text?.path;
          return text ? !context?.getProperty(text) : true;
        }
        return true;
      }
      return false;
    },
    updateFetchedContextPaths: function (contexts, internalModel) {
      const fetchedContextPaths = [];
      contexts?.forEach(context => {
        const contextPath = context?.getPath();
        if (contextPath && !fetchedContextPaths.includes(contextPath)) {
          fetchedContextPaths.push(contextPath);
        }
      });
      internalModel?.setProperty("/fetchedContextPaths", fetchedContextPaths);
      internalModel.refresh();
    },
    getContextsWithNoRecommendations: function (contextsInfo, internalModel) {
      const fetchedContextPaths = internalModel.getProperty("/fetchedContextPaths") || [];
      const ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
      return contextsInfo.filter(contextInfo => {
        const contextPath = (contextInfo?.context).getPath();
        return !fetchedContextPaths.includes(contextPath) && !ignoredContextPaths.includes(contextPath);
      });
    },
    resetRecommendations: function (internalModel) {
      // we have version key maintained only for standard solution of recommendations
      //and only if this is standard implementation, we should reset recommendations
      const recommendationsDataInModel = internalModel.getProperty("/recommendationsData");
      if (recommendationsDataInModel && recommendationsDataInModel.hasOwnProperty("version")) {
        internalModel.setProperty("/recommendationsData", {});
        internalModel?.setProperty("/fetchedContextPaths", []);
        internalModel?.setProperty("/ignoredContextPaths", []);
        internalModel.refresh(true);
      }
    },
    getCurrentRootContext: function () {
      return rootContext;
    },
    setCurrentRootContext: function (context) {
      rootContext = context;
    },
    /**
     * Adds the text of ContextIdentifier else will add its value to the acceptAllParams.
     * @param params
     * @param viewPath Context Path of view
     */
    addContextIdentifierText(params, viewPath) {
      for (const recommendationData of params?.recommendationData || []) {
        let index = 0;
        const identifierValues = [];
        // for recommendation fields which are directly on page, we do not want to show identifier values
        // so we exclude that calculation
        if (recommendationData.context?.getPath() !== viewPath) {
          if (recommendationData.contextIdentifier && recommendationData.context) {
            recommendationData.contextIdentifier.forEach(contextIdentifier => {
              const idPath = `${recommendationData.context?.getPath()})/${contextIdentifier}`;
              const contextText = this.getTextForKey(recommendationData.context, idPath, contextIdentifier);
              if (contextText) {
                identifierValues.push(index === 0 ? `${contextText}` : ` ${contextText}`);
                index = index + 1;
              }
            });
          }
        }
        recommendationData.contextIdentifierText = identifierValues;
      }
    },
    /**
     * Fetches table name based on the context.
     * @param context
     * @returns Table name
     */

    getEntityName(context) {
      const dataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(context.getPath(), context.getModel()?.getMetaModel());
      const typeName = dataModelObject?.targetEntityType?.annotations?.UI?.HeaderInfo?.TypeName;
      return typeName && compileExpression(getExpressionFromAnnotation(typeName));
    },
    /**
     * Fetches Text for key if it exists else will return its value.
     * @param context
     * @param keyPath
     * @param key
     * @returns Text or Value for a key
     */

    getTextForKey(context, keyPath, key) {
      let value = "";
      const involvedDataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(keyPath, context?.getModel()?.getMetaModel());
      const targetObject = involvedDataModelObject?.targetObject;
      const property = (isPathAnnotationExpression(targetObject) || isPropertyPathExpression(targetObject)) && targetObject.$target || targetObject;
      const text = getExpressionFromAnnotation(property?.annotations?.Common?.Text);
      if (text) {
        try {
          value = evaluateExpression(text, {
            "": context.getObject()
          });
          value = value ? value : context.getProperty(key);
        } catch {
          value = context.getProperty(key);
        }
      }
      return value ?? context.getProperty(key);
    }
  };
  _exports.standardRecommendationHelper = standardRecommendationHelper;
  return _exports;
}, false);
//# sourceMappingURL=StandardRecommendationHelper-dbg.js.map

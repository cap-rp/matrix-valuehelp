/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/TypeGuards"], function (Key, TypeGuards) {
  "use strict";

  var _exports = {};
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var KeyHelper = Key.KeyHelper;
  var ActionType = /*#__PURE__*/function (ActionType) {
    ActionType["Default"] = "Default";
    return ActionType;
  }(ActionType || {});
  const mergeFormActions = (source, target) => {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return source;
  };
  _exports.mergeFormActions = mergeFormActions;
  const getFormHiddenActions = (facetDefinition, converterContext) => {
    const formActions = getFormActions(facetDefinition, converterContext) || [],
      annotations = converterContext?.getEntityType()?.annotations?.UI;
    const hiddenFormActions = [];
    for (const property in annotations) {
      const annotationProperty = annotations[property];
      if (isAnnotationOfType(annotationProperty, "com.sap.vocabularies.UI.v1.FieldGroupType")) {
        annotationProperty?.Data.forEach(dataField => {
          if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`)) {
            if (dataField?.annotations?.UI?.Hidden?.valueOf() === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          }
        });
      } else if (isAnnotationOfTerm(annotationProperty, "com.sap.vocabularies.UI.v1.Identification") || isAnnotationOfTerm(annotationProperty, "com.sap.vocabularies.UI.v1.StatusInfo")) {
        annotationProperty?.forEach(dataField => {
          if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`)) {
            if (dataField?.annotations?.UI?.Hidden?.valueOf() === true) {
              hiddenFormActions.push({
                type: ActionType.Default,
                key: KeyHelper.generateKeyFromDataField(dataField)
              });
            }
          }
        });
      }
    }
    return hiddenFormActions;
  };
  _exports.getFormHiddenActions = getFormHiddenActions;
  const getFormActions = (facetDefinition, converterContext) => {
    const manifestWrapper = converterContext.getManifestWrapper();
    let targetValue, manifestFormContainer;
    let actions = {};
    if (facetDefinition?.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      if (facetDefinition?.Facets) {
        facetDefinition?.Facets.forEach(facet => {
          if (isAnnotationOfType(facet, "com.sap.vocabularies.UI.v1.ReferenceFacet")) {
            targetValue = facet?.Target?.value;
            manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
            if (manifestFormContainer?.actions) {
              for (const actionKey in manifestFormContainer.actions) {
                // store the correct facet an action is belonging to for the case it's an inline form action
                manifestFormContainer.actions[actionKey].facetName = facet.fullyQualifiedName;
              }
              actions = mergeFormActions(manifestFormContainer?.actions, actions);
            }
          }
        });
      }
    } else if (facetDefinition?.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
      targetValue = facetDefinition?.Target?.value;
      manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
      if (manifestFormContainer?.actions) {
        for (const actionKey in manifestFormContainer.actions) {
          // store the correct facet an action is belonging to for the case it's an inline form action
          manifestFormContainer.actions[actionKey].facetName = facetDefinition.fullyQualifiedName;
        }
        actions = manifestFormContainer.actions;
      }
    }
    return actions;
  };
  _exports.getFormActions = getFormActions;
  return _exports;
}, false);
//# sourceMappingURL=FormMenuActions-dbg.js.map

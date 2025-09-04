/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/TypeGuards"], function (BindingToolkit, TypeGuards) {
  "use strict";

  var _exports = {};
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Get the path of the semantic object if it is a dynamic SemanticObject.
   * @param semanticObject The value of the Common.SemanticObject annotation.
   * @returns  The path of the semantic object if it is a dynamic SemanticObject, null otherwise.
   */
  const getDynamicPathFromSemanticObject = semanticObject => {
    const dynamicSemObjectRegex = semanticObject?.match(/{(.*?)}/);
    if (semanticObject?.startsWith("{=")) {
      return semanticObject;
    }
    if (dynamicSemObjectRegex?.length && dynamicSemObjectRegex.length > 1) {
      return dynamicSemObjectRegex[1];
    }
    return null;
  };

  /**
   * Check whether a property or a NavigationProperty has a semantic object defined or not.
   * @param property The target property
   * @returns `true` if it has a semantic object
   */
  _exports.getDynamicPathFromSemanticObject = getDynamicPathFromSemanticObject;
  const hasSemanticObject = function (property) {
    const _propertyCommonAnnotations = property.annotations?.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        if (_propertyCommonAnnotations[key]?.term === "com.sap.vocabularies.Common.v1.SemanticObject") {
          return true;
        }
      }
    }
    return false;
  };
  _exports.hasSemanticObject = hasSemanticObject;
  const getSemanticObjects = function (property) {
    const semanticObjects = [];
    const _propertyCommonAnnotations = property.annotations?.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        const annotation = _propertyCommonAnnotations[key];
        if (isAnnotationOfTerm(annotation, "com.sap.vocabularies.Common.v1.SemanticObject")) {
          semanticObjects.push(annotation);
        }
      }
    }
    return semanticObjects;
  };
  _exports.getSemanticObjects = getSemanticObjects;
  const getSemanticObjectMappings = function (property) {
    const semanticObjectMappings = [];
    const _propertyCommonAnnotations = property.annotations?.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        const annotation = _propertyCommonAnnotations[key];
        if (isAnnotationOfTerm(annotation, "com.sap.vocabularies.Common.v1.SemanticObjectMapping")) {
          semanticObjectMappings.push(annotation);
        }
      }
    }
    return semanticObjectMappings;
  };
  _exports.getSemanticObjectMappings = getSemanticObjectMappings;
  const getSemanticObjectUnavailableActions = function (property) {
    const semanticObjectUnavailableActions = [];
    const _propertyCommonAnnotations = property.annotations?.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        const annotation = _propertyCommonAnnotations[key];
        if (isAnnotationOfTerm(annotation, "com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions")) {
          semanticObjectUnavailableActions.push(annotation);
        }
      }
    }
    return semanticObjectUnavailableActions;
  };

  /**
   * Get the property or the navigation property in  its relative path that holds semanticObject annotation if it exists.
   * @param dataModelObjectPath
   * @returns A property or a NavProperty or undefined
   */
  _exports.getSemanticObjectUnavailableActions = getSemanticObjectUnavailableActions;
  const getPropertyWithSemanticObject = function (dataModelObjectPath) {
    let propertyWithSemanticObject;
    if (dataModelObjectPath.targetObject && hasSemanticObject(dataModelObjectPath.targetObject)) {
      propertyWithSemanticObject = dataModelObjectPath.targetObject;
    } else if (dataModelObjectPath.navigationProperties.length > 0) {
      // there are no semantic objects on the property itself so we look for some on nav properties
      for (const navProperty of dataModelObjectPath.navigationProperties) {
        if (!dataModelObjectPath.contextLocation?.navigationProperties.find(contextNavProp => contextNavProp.fullyQualifiedName === navProperty.fullyQualifiedName) && !propertyWithSemanticObject && hasSemanticObject(navProperty)) {
          propertyWithSemanticObject = navProperty;
        }
      }
    }
    return propertyWithSemanticObject;
  };

  /**
   * Get the semanticObject compile binding from metadata and a map to the qualifiers.
   * @param propertyWithSemanticObject The property that holds semanticObject annotataions if it exists
   * @returns An object containing semanticObjectList and qualifierMap
   */
  _exports.getPropertyWithSemanticObject = getPropertyWithSemanticObject;
  const getSemanticObjectsAndQualifierMap = function (propertyWithSemanticObject) {
    const qualifierMap = {};
    const semanticObjectsList = [];
    const semanticObjectsExpressionList = [];
    if (propertyWithSemanticObject !== undefined) {
      for (const semanticObject of getSemanticObjects(propertyWithSemanticObject)) {
        const semanticObjectExpression = getExpressionFromAnnotation(semanticObject);
        const compiledSemanticObject = compileExpression(semanticObjectExpression);
        // this should not happen, but we make sure not to add twice the semanticObject otherwise the mdcLink crashes
        if (compiledSemanticObject && !semanticObjectsList.includes(compiledSemanticObject)) {
          qualifierMap[semanticObject.qualifier || ""] = compiledSemanticObject;
          semanticObjectsList.push(compiledSemanticObject);
          semanticObjectsExpressionList.push(semanticObjectExpression);
        }
      }
    }
    return {
      semanticObjectsList,
      semanticObjectsExpressionList,
      qualifierMap
    };
  };

  /**
   * Determines if the current user can navigate to semantic objects based on the provided lists.
   * @param semanticObjectsCurrentUserCanNavigateTo The list of semantic objects the current user can navigate to.
   * @param semanticObjectList An object containing lists and maps of semantic objects.
   * @param semanticObjectList.semanticObjectsList The list of all semantic objects.
   * @param semanticObjectList.semanticObjectsExpressionList The list of expressions for semantic objects.
   * @param semanticObjectList.qualifierMap A map of qualifiers to compiled expressions.
   * @returns An object containing information about static and dynamic semantic objects.
   */
  _exports.getSemanticObjectsAndQualifierMap = getSemanticObjectsAndQualifierMap;
  const getReachableSemanticObjectsSettings = function (semanticObjectsCurrentUserCanNavigateTo, semanticObjectList) {
    const dynamicSemanticObjectsList = [];
    let result = false;
    if (semanticObjectsCurrentUserCanNavigateTo) {
      for (const semanticObject of semanticObjectsCurrentUserCanNavigateTo) {
        for (const actualSemanticObject of semanticObjectList.semanticObjectsList) {
          if (semanticObject === actualSemanticObject) {
            result = true;
            break;
          }
        }
        if (result) {
          break;
        }
      }
      semanticObjectList.semanticObjectsExpressionList.forEach(semanticObjectExpression => {
        if (semanticObjectExpression._type !== "Constant") {
          dynamicSemanticObjectsList.push(semanticObjectExpression);
        }
      });
    }
    return {
      hasReachableStaticSemanticObject: result,
      dynamicSemanticObjects: dynamicSemanticObjectsList
    };
  };

  /**
   * Check the user rights to navigate to the semantic objects.
   * @param semanticObject The semantic object name
   * @param dataModelPath The DataModelObjectPath of the property
   * @param settings The TemplateProcessorSettings of the internal field
   * @returns An object containing semanticObjectList and qualifierMap
   */
  _exports.getReachableSemanticObjectsSettings = getReachableSemanticObjectsSettings;
  const manageSemanticObjectsForCurrentUser = function (semanticObject, dataModelPath, internalDataModel) {
    const property = dataModelPath.targetObject;
    const semanticObjectsCurrentUserCanNavigateTo = internalDataModel?.getProperty("/semanticObjects");
    const propertySemanticObjectList = getSemanticObjectsAndQualifierMap(property);

    // semantic object is in navigation
    const propertyWithSemanticObjectFromNavigation = getPropertyWithSemanticObject(dataModelPath);
    if (isNavigationProperty(propertyWithSemanticObjectFromNavigation)) {
      const semanticObjectExpression = getExpressionFromAnnotation(propertyWithSemanticObjectFromNavigation?.annotations?.Common?.SemanticObject);
      const semanticObjectValue = compileExpression(semanticObjectExpression);
      propertySemanticObjectList.semanticObjectsExpressionList.push(semanticObjectExpression);
      propertySemanticObjectList.semanticObjectsList.push(semanticObjectValue);
    }

    // custom semanticObject from field property

    if (semanticObject !== undefined && semanticObject !== "") {
      if (semanticObject[0] === "[") {
        const customSemanticObjects = JSON.parse(semanticObject);
        customSemanticObjects.forEach(internalSemanticObject => {
          propertySemanticObjectList.semanticObjectsList.push(internalSemanticObject);
        });
      } else if (semanticObject.bindingString) {
        const semanticObjectExpressionFromField = resolveBindingString(semanticObject.bindingString);
        propertySemanticObjectList.semanticObjectsExpressionList.push(semanticObjectExpressionFromField);
      } else {
        propertySemanticObjectList.semanticObjectsList.push(semanticObject);
      }
    }
    return getReachableSemanticObjectsSettings(semanticObjectsCurrentUserCanNavigateTo, propertySemanticObjectList);
  };
  _exports.manageSemanticObjectsForCurrentUser = manageSemanticObjectsForCurrentUser;
  return _exports;
}, false);
//# sourceMappingURL=SemanticObjectHelper-dbg.js.map

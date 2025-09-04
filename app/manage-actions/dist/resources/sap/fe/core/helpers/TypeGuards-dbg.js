/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  function isFulfilled(p) {
    return p.status === "fulfilled";
  }
  _exports.isFulfilled = isFulfilled;
  function isRejected(p) {
    return p.status === "rejected";
  }
  _exports.isRejected = isRejected;
  function isContext(potentialContext) {
    return potentialContext?.isA?.("sap.ui.model.Context");
  }
  _exports.isContext = isContext;
  function isFunctionArray(potentialFunctionArray) {
    return Array.isArray(potentialFunctionArray) && potentialFunctionArray.length > 0 && potentialFunctionArray.every(item => typeof item === "function");
  }
  _exports.isFunctionArray = isFunctionArray;
  /**
   * Checks whether the argument is an annotation of the given type.
   * @param potentialAnnotationType The annotation to check
   * @param typeName The type to check for
   * @returns Whether the argument is an annotation of the given type
   */
  function isAnnotationOfType(potentialAnnotationType, typeName) {
    if (Array.isArray(typeName)) {
      return typeName.includes(potentialAnnotationType?.$Type);
    }
    return potentialAnnotationType?.$Type === typeName;
  }

  /**
   * Checks whether the argument is an annotation of the given term.
   * @param potentialAnnotation The annotation to check
   * @param termName The term to check for
   * @returns Whether the argument is an annotation of the given term
   */
  _exports.isAnnotationOfType = isAnnotationOfType;
  function isAnnotationOfTerm(potentialAnnotation, termName) {
    return potentialAnnotation?.term === termName;
  }
  _exports.isAnnotationOfTerm = isAnnotationOfTerm;
  function isAnnotationTerm(potentialAnnotation) {
    return potentialAnnotation.hasOwnProperty("term");
  }

  /**
   * Checks whether the argument is a {@link ServiceObject}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link ServiceObject}.
   */
  _exports.isAnnotationTerm = isAnnotationTerm;
  function isServiceObject(serviceObject) {
    return serviceObject?.hasOwnProperty("_type") ?? false;
  }

  /**
   * Checks whether the argument is a {@link ComplexType}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link ComplexType}.
   */
  _exports.isServiceObject = isServiceObject;
  function isComplexType(serviceObject) {
    return serviceObject?._type === "ComplexType";
  }

  /**
   * Checks whether the argument is a {@link TypeDefinition}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link TypeDefinition}.
   */
  _exports.isComplexType = isComplexType;
  function isTypeDefinition(serviceObject) {
    return serviceObject?._type === "TypeDefinition";
  }

  /**
   * Checks whether the argument is an {@link EntityContainer}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntityContainer}.
   */
  _exports.isTypeDefinition = isTypeDefinition;
  function isEntityContainer(serviceObject) {
    return serviceObject?._type === "EntityContainer";
  }

  /**
   * Checks whether the argument is an {@link EntitySet}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntitySet}.
   */
  _exports.isEntityContainer = isEntityContainer;
  function isEntitySet(serviceObject) {
    return serviceObject?._type === "EntitySet";
  }

  /**
   * Checks whether the argument is a {@link Singleton}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link Singleton}
   */
  _exports.isEntitySet = isEntitySet;
  function isSingleton(serviceObject) {
    return serviceObject?._type === "Singleton";
  }

  /**
   * Checks whether the argument is an {@link EntityType}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link EntityType}
   */
  _exports.isSingleton = isSingleton;
  function isEntityType(serviceObject) {
    return serviceObject?._type === "EntityType";
  }

  /**
   * Checks whether the argument is a {@link Property}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link Property}.
   */
  _exports.isEntityType = isEntityType;
  function isProperty(serviceObject) {
    return serviceObject?._type === "Property";
  }

  /**
   * Checks whether the argument is a {@link NavigationProperty}.
   *
   * Hint: There are also the more specific functions {@link isSingleNavigationProperty} and {@link isMultipleNavigationProperty}. These can be
   * used to check for to-one and to-many navigation properties, respectively.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link NavigationProperty}.
   */
  _exports.isProperty = isProperty;
  function isNavigationProperty(serviceObject) {
    return serviceObject?._type === "NavigationProperty";
  }

  /**
   * Checks whether the argument is a {@link SingleNavigationProperty}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link SingleNavigationProperty}.
   */
  _exports.isNavigationProperty = isNavigationProperty;
  function isSingleNavigationProperty(serviceObject) {
    return isNavigationProperty(serviceObject) && !serviceObject.isCollection;
  }

  /**
   * Checks whether the argument is a {@link MultipleNavigationProperty}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is a {@link MultipleNavigationProperty}.
   */
  _exports.isSingleNavigationProperty = isSingleNavigationProperty;
  function isMultipleNavigationProperty(serviceObject) {
    return isNavigationProperty(serviceObject) && serviceObject.isCollection;
  }

  /**
   * Checks whether the argument is a {@link PathAnnotationExpression}.
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link PathAnnotationExpression}.
   */
  _exports.isMultipleNavigationProperty = isMultipleNavigationProperty;
  function isPathAnnotationExpression(expression) {
    return expression?.type === "Path";
  }

  /**
   * Checks whether the argument is a {@link AnnotationPathExpression}.
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link AnnotationPathExpression}.
   */
  _exports.isPathAnnotationExpression = isPathAnnotationExpression;
  function isAnnotationPath(expression) {
    return expression?.type === "AnnotationPath";
  }

  /**
   * Checks whether the argument is a {@link PropertyPath}.
   * @param expression The object to be checked.
   * @returns Whether the argument is a {@link PropertyPath}.
   */
  _exports.isAnnotationPath = isAnnotationPath;
  function isPropertyPathExpression(expression) {
    return expression?.type === "PropertyPath";
  }

  /**
   * Checks whether the argument is an {@link Action}.
   * @param serviceObject The object to be checked.
   * @returns Whether the argument is an {@link Action}.
   */
  _exports.isPropertyPathExpression = isPropertyPathExpression;
  function isAction(serviceObject) {
    return serviceObject?._type === "Action";
  }
  _exports.isAction = isAction;
  return _exports;
}, false);
//# sourceMappingURL=TypeGuards-dbg.js.map

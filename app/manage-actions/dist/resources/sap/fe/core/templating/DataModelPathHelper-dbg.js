/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/TypeGuards"], function (BindingToolkit, TypeGuards) {
  "use strict";

  var _exports = {};
  var isServiceObject = TypeGuards.isServiceObject;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var isEntityType = TypeGuards.isEntityType;
  var isEntitySet = TypeGuards.isEntitySet;
  var isComplexType = TypeGuards.isComplexType;
  var isAnnotationTerm = TypeGuards.isAnnotationTerm;
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  /**
   * Function that returns the relative path to the property from the DataModelObjectPath.
   * @param contextPath The DataModelObjectPath object to the property
   * @param skipCleanup Don't clean up circular navigation properties
   * @returns The path from the root entity set
   */
  const getRelativePaths = function (contextPath, skipCleanup) {
    return getPathRelativeLocation(contextPath?.contextLocation, contextPath?.navigationProperties, skipCleanup).map(np => np.name);
  };

  /**
   * Gets the navigation properties from a dataModelObjectPath to the targeted navigation properties.
   * @param contextPath The dataModelObjectPath
   * @param visitedNavProps The targeted navigation properties
   * @param skipCleanup Don't clean up circular navigation properties
   * @returns An array of navigation properties to reach the targeted navigation properties
   */
  _exports.getRelativePaths = getRelativePaths;
  const getPathRelativeLocation = function (contextPath) {
    let visitedNavProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let skipCleanup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const cleanUpNavProp = navProps => {
      let currentIdx = 0;
      while (navProps.length > 1 && currentIdx != navProps.length - 1) {
        const currentNav = navProps[currentIdx];
        const nextNavProp = navProps[currentIdx + 1];
        if (isNavigationProperty(currentNav) && currentNav.partner === nextNavProp.name) {
          navProps.splice(0, 2);
        } else {
          currentIdx++;
        }
      }
      return navProps;
    };
    const getAdditionalNavProp = (referenceProps, otherProps, keepReference) => {
      const additionalNavProps = [];
      referenceProps.forEach((navProp, navIndex) => {
        if (otherProps[navIndex] !== navProp) {
          additionalNavProps.push(keepReference ? navProp : otherProps[navIndex]);
        }
      });
      return additionalNavProps;
    };
    if (!contextPath) {
      return visitedNavProps;
    }
    if (visitedNavProps.length >= contextPath.navigationProperties.length) {
      let remainingNavProps = getAdditionalNavProp(contextPath.navigationProperties, visitedNavProps, false);
      remainingNavProps = remainingNavProps.concat(visitedNavProps.slice(contextPath.navigationProperties.length));
      return skipCleanup ? remainingNavProps : cleanUpNavProp(remainingNavProps);
    }
    let extraNavProp = getAdditionalNavProp(visitedNavProps, contextPath.navigationProperties, true);
    extraNavProp = extraNavProp.concat(contextPath.navigationProperties.slice(visitedNavProps.length));
    if (!skipCleanup) {
      cleanUpNavProp(extraNavProp);
    }
    extraNavProp = extraNavProp.map(navProp => {
      return isNavigationProperty(navProp) ? navProp.targetType.navigationProperties.find(np => np.name === navProp.partner) : navProp;
    });
    return extraNavProp;
  };

  /**
   * Gets a new enhanced dataModelObjectPath matching with the provided property.
   * @param dataModelObjectPath The initial dataModelObjectPath
   * @param propertyPath The property path or property to reach
   * @returns A new dataModelObjectPath
   */
  _exports.getPathRelativeLocation = getPathRelativeLocation;
  const enhanceDataModelPath = function (dataModelObjectPath, propertyPath) {
    let sPropertyPath = "";
    if (isPathAnnotationExpression(propertyPath)) {
      sPropertyPath = propertyPath.path;
    } else if (typeof propertyPath === "string") {
      sPropertyPath = propertyPath;
    }
    let target;
    if (isPathAnnotationExpression(propertyPath)) {
      target = propertyPath.$target;
    } else if (containsAComplexType(dataModelObjectPath)) {
      target = dataModelObjectPath.convertedTypes.resolvePath(`${getTargetNavigationPath(dataModelObjectPath)}/${sPropertyPath}`)?.target;
    } else {
      if (sPropertyPath.startsWith("/")) {
        // remove the leading "/" because the path is going to be resolved from the entity type, so it should not be absolute
        sPropertyPath = sPropertyPath.substring(1);
      }
      target = dataModelObjectPath.targetEntityType.resolvePath(sPropertyPath);
    }
    const pathSplits = sPropertyPath.split("/");
    let newDataModelObjectPath = dataModelObjectPath;
    for (const pathPart of pathSplits) {
      newDataModelObjectPath = enhanceFromPath(newDataModelObjectPath, pathPart);
    }
    newDataModelObjectPath.targetObject = target;
    return newDataModelObjectPath;
  };

  /**
   * Gets a new enhanced dataModelObjectPath matching with the provided path
   * The targetObject is not updated by this internal function.
   * @param dataModelObjectPath The initial dataModelObjectPath
   * @param path The object path to reach
   * @returns A new dataModelObjectPath
   */
  _exports.enhanceDataModelPath = enhanceDataModelPath;
  const enhanceFromPath = function (dataModelObjectPath, path) {
    let targetEntitySet;
    let targetEntityType;
    const navigationProperties = dataModelObjectPath.navigationProperties.concat();
    const navigationIndex = navigationProperties.length;
    const referenceEntityType = navigationIndex ? navigationProperties[navigationIndex - 1].targetType : dataModelObjectPath.targetEntityType;
    if (!referenceEntityType) {
      return dataModelObjectPath;
    } else if (isEntityType(referenceEntityType) || isComplexType(referenceEntityType)) {
      const currentEntitySet = dataModelObjectPath.targetEntitySet;
      const potentialNavProp = referenceEntityType.navigationProperties.find(navProp => navProp.name === path);
      if (potentialNavProp) {
        navigationProperties.push(potentialNavProp);
        targetEntityType = potentialNavProp.targetType;
        const navigationPathFromPreviousEntitySet = getNavigationBindingFromPreviousEntitySet(navigationProperties);
        if (navigationPathFromPreviousEntitySet && currentEntitySet?.navigationPropertyBinding.hasOwnProperty(navigationPathFromPreviousEntitySet)) {
          targetEntitySet = currentEntitySet.navigationPropertyBinding[navigationPathFromPreviousEntitySet];
        }
      } else {
        const potentialComplexType = (referenceEntityType.entityProperties || referenceEntityType.properties).find(navProp => navProp.name === path);
        if (potentialComplexType?.targetType?._type === "ComplexType") {
          navigationProperties.push(potentialComplexType);
        }
      }
    }
    return {
      startingEntitySet: dataModelObjectPath.startingEntitySet,
      navigationProperties: navigationProperties,
      contextLocation: dataModelObjectPath.contextLocation,
      targetEntitySet: targetEntitySet ?? dataModelObjectPath.targetEntitySet,
      targetEntityType: targetEntityType ?? dataModelObjectPath.targetEntityType,
      targetObject: dataModelObjectPath.targetObject,
      convertedTypes: dataModelObjectPath.convertedTypes
    };
  };

  /**
   * Detects if the DataModelObjectPath has navigated threw a complexType.
   * @param dataModelObjectPath The dataModelObjectPath
   * @returns Is there a complexType into the DataModelObjectPath.
   */
  const containsAComplexType = function (dataModelObjectPath) {
    return dataModelObjectPath.navigationProperties.find(navigation => isComplexType(navigation?.targetType)) !== undefined;
  };

  /**
   * Gets the navigation binding from the previous entitySet listed into the navigation properties.
   * @param navigationProperties The navigation properties
   * @returns A new dataModelObjectPath.
   */
  const getNavigationBindingFromPreviousEntitySet = function (navigationProperties) {
    const navigationPropertyLength = navigationProperties.length;
    if (navigationPropertyLength) {
      const lastNavigation = navigationProperties[navigationPropertyLength - 1];
      const isComplexTypeLastNavigation = isComplexType(lastNavigation.targetType);
      let navigationPath = "";
      if (navigationPropertyLength > 1 && !isComplexTypeLastNavigation) {
        for (let i = 0; i < navigationPropertyLength - 1; i++) {
          const navigationProperty = navigationProperties[i];
          if (isComplexType(navigationProperty.targetType)) {
            navigationPath += `${navigationProperty.name}/`;
          } else {
            navigationPath = "";
          }
        }
      }
      return isComplexTypeLastNavigation ? "" : `${navigationPath}${lastNavigation.name}`;
    }
    return "";
  };

  /**
   * Gets the path of the targeted entitySet.
   * @param dataModelObjectPath The dataModelObjectPath
   * @returns The path.
   */
  const getTargetEntitySetPath = function (dataModelObjectPath) {
    const initialPath = `/${dataModelObjectPath.startingEntitySet.name}`;
    let targetEntitySetPath = initialPath;
    let currentEntitySet = dataModelObjectPath.startingEntitySet;
    const navigationProperties = dataModelObjectPath.navigationProperties;
    let navigationPath;
    for (let i = 0; i < navigationProperties.length; i++) {
      navigationPath = getNavigationBindingFromPreviousEntitySet(navigationProperties.slice(0, i + 1));
      if (currentEntitySet && currentEntitySet.navigationPropertyBinding.hasOwnProperty(navigationPath)) {
        targetEntitySetPath += `/$NavigationPropertyBinding/${navigationPath.replace("/", "%2F")}`;
        currentEntitySet = currentEntitySet.navigationPropertyBinding[navigationPath];
      }
    }
    targetEntitySetPath += "/$";
    return targetEntitySetPath;
  };

  /**
   * Gets the path of the targeted navigation.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param bRelative
   * @returns The path.
   */
  _exports.getTargetEntitySetPath = getTargetEntitySetPath;
  const getTargetNavigationPath = function (dataModelObjectPath) {
    let bRelative = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let path = "";
    if (!dataModelObjectPath.startingEntitySet) {
      return "/";
    }
    if (!bRelative) {
      path += `/${dataModelObjectPath.startingEntitySet.name}`;
    }
    if (dataModelObjectPath.navigationProperties.length > 0) {
      path = setTrailingSlash(path);
      path += dataModelObjectPath.navigationProperties.map(navProp => navProp.name).join("/");
    }
    return path;
  };

  /**
   * Gets the path of the targeted object.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param bRelative
   * @returns The path.
   */
  _exports.getTargetNavigationPath = getTargetNavigationPath;
  const getTargetObjectPath = function (dataModelObjectPath) {
    let bRelative = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let path = getTargetNavigationPath(dataModelObjectPath, bRelative);
    if (isServiceObject(dataModelObjectPath.targetObject) && !isNavigationProperty(dataModelObjectPath.targetObject) && !isEntityType(dataModelObjectPath.targetObject) && !isEntitySet(dataModelObjectPath.targetObject) && (!isProperty(dataModelObjectPath.targetObject) || !isComplexType(dataModelObjectPath.targetObject?.targetType)) && dataModelObjectPath.targetObject !== dataModelObjectPath.startingEntitySet) {
      path = setTrailingSlash(path);
      path += `${dataModelObjectPath.targetObject.name}`;
    } else if (dataModelObjectPath.targetObject && isAnnotationTerm(dataModelObjectPath.targetObject)) {
      path = setTrailingSlash(path);
      path += `@${dataModelObjectPath.targetObject.term}`;
      if (dataModelObjectPath.targetObject.hasOwnProperty("qualifier") && !!dataModelObjectPath.targetObject.qualifier) {
        path += `#${dataModelObjectPath.targetObject.qualifier}`;
      }
    }
    return path;
  };
  _exports.getTargetObjectPath = getTargetObjectPath;
  const getContextRelativeTargetObjectPath = function (dataModelObjectPath) {
    let forBindingExpression = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let forFilterConditionPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (dataModelObjectPath.contextLocation?.startingEntitySet !== dataModelObjectPath.startingEntitySet) {
      return getTargetObjectPath(dataModelObjectPath);
    }
    return _getContextRelativeTargetObjectPath(dataModelObjectPath, forBindingExpression, forFilterConditionPath);
  };
  _exports.getContextRelativeTargetObjectPath = getContextRelativeTargetObjectPath;
  const _getContextRelativeTargetObjectPath = function (dataModelObjectPath) {
    let forBindingExpression = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let forFilterConditionPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (!dataModelObjectPath.targetObject) {
      return undefined;
    }
    const navProperties = getPathRelativeLocation(dataModelObjectPath.contextLocation, dataModelObjectPath.navigationProperties);
    if (forBindingExpression) {
      if (navProperties.some(isMultipleNavigationProperty)) {
        return undefined;
      }
    }
    let path = forFilterConditionPath ? navProperties.map(navProp => {
      const isCollection = isMultipleNavigationProperty(navProp);
      return isCollection ? `${navProp.name}*` : navProp.name;
    }).join("/") : navProperties.map(navProp => navProp.name).join("/");
    if ((isServiceObject(dataModelObjectPath.targetObject) && dataModelObjectPath.targetObject.name || isPropertyPathExpression(dataModelObjectPath.targetObject) && dataModelObjectPath.targetObject.value) && !isNavigationProperty(dataModelObjectPath.targetObject) && !isEntityType(dataModelObjectPath.targetObject) && !isEntitySet(dataModelObjectPath.targetObject) && (!isProperty(dataModelObjectPath.targetObject) || !isComplexType(dataModelObjectPath.targetObject?.targetType)) && dataModelObjectPath.targetObject !== dataModelObjectPath.startingEntitySet) {
      path = setTrailingSlash(path);
      path += isPropertyPathExpression(dataModelObjectPath.targetObject) ? `${dataModelObjectPath.targetObject.value}` : `${dataModelObjectPath.targetObject.name}`;
    } else if (isAnnotationTerm(dataModelObjectPath.targetObject)) {
      path = setTrailingSlash(path);
      path += `@${dataModelObjectPath.targetObject.term}`;
      if (dataModelObjectPath.targetObject.hasOwnProperty("qualifier") && !!dataModelObjectPath.targetObject.qualifier) {
        path += `#${dataModelObjectPath.targetObject.qualifier}`;
      }
    }
    return path;
  };

  /**
   * Gets an array of properties where a specific restriction is applied.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param checkFunction The function testing the restriction and returning the array of properties
   * @param onContext Is the restriction tested on the target object or its context
   * @returns The properties.
   */
  const getContextPropertyRestriction = function (dataModelObjectPath, checkFunction) {
    let onContext = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    const source = onContext ? dataModelObjectPath.contextLocation : dataModelObjectPath;
    const lastNavProp = source?.navigationProperties?.slice(-1)[0];
    const properties = checkFunction(lastNavProp?.annotations?.Capabilities);
    return properties?.length ? properties : checkFunction(source?.targetEntitySet?.annotations?.Capabilities) || [];
  };
  _exports.getContextPropertyRestriction = getContextPropertyRestriction;
  const isPathUpdatable = function (dataModelObjectPath, extractionParametersOnPath) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      return annotationObject?.UpdateRestrictions?.Updatable;
    }, extractionParametersOnPath);
  };

  /**
   * Gets the parent navigation property of the given node hierarchy.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param hierarchyQualifier The qualifier of the hierarchy set in the manifest
   * @returns The parent navigation property.
   */
  _exports.isPathUpdatable = isPathUpdatable;
  const getHierarchyParentNavigationPropertyPath = function (dataModelObjectPath, hierarchyQualifier) {
    return dataModelObjectPath.targetEntityType.annotations.Aggregation?.[`RecursiveHierarchy#${hierarchyQualifier}`]?.ParentNavigationProperty.$target?.fullyQualifiedName;
  };

  /**
   * Gets an array of navigation properties where an update restriction is applied.
   * @param dataModelObjectPath The dataModelObjectPath
   * @returns The navigation properties with the restriction.
   */
  _exports.getHierarchyParentNavigationPropertyPath = getHierarchyParentNavigationPropertyPath;
  const getNonUpdatableNavigationProperties = function (dataModelObjectPath) {
    // UpdateRestrictions.NonUpdatableNavigationProperties on the parent navigation:
    // REVIEW: This is wrong ? the updateRestriction annotation needs to be on entityset but our test sometimes put it on the navigation property
    const nonUpdatableNavigationProperties = dataModelObjectPath.targetObject?.annotations?.Capabilities?.UpdateRestrictions?.NonUpdatableNavigationProperties;
    if (nonUpdatableNavigationProperties && nonUpdatableNavigationProperties?.length > 0) {
      return nonUpdatableNavigationProperties.map(nonUpdatableNavigationProperty => dataModelObjectPath.contextLocation && enhanceDataModelPath(dataModelObjectPath.contextLocation, nonUpdatableNavigationProperty.value).targetObject.fullyQualifiedName);
    }
    // UpdateRestrictions.NonUpdatableNavigationProperties on the entitySet (or entityType):
    return dataModelObjectPath.targetEntitySet?.annotations.Capabilities?.UpdateRestrictions?.NonUpdatableNavigationProperties?.map(navigationPropertyPath => navigationPropertyPath.$target?.fullyQualifiedName);
  };
  _exports.getNonUpdatableNavigationProperties = getNonUpdatableNavigationProperties;
  const isPathSearchable = function (dataModelObjectPath, extractionParametersOnPath) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      return annotationObject?.SearchRestrictions?.Searchable;
    }, extractionParametersOnPath);
  };
  _exports.isPathSearchable = isPathSearchable;
  const isPathDeletable = function (dataModelObjectPath, extractionParametersOnPath) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      return annotationObject?.DeleteRestrictions?.Deletable;
    }, extractionParametersOnPath);
  };
  _exports.isPathDeletable = isPathDeletable;
  const isPathInsertable = function (dataModelObjectPath, extractionParametersOnPath) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      return annotationObject?.InsertRestrictions?.Insertable;
    }, extractionParametersOnPath);
  };
  _exports.isPathInsertable = isPathInsertable;
  const isPathFilterable = function (dataModelObjectPath, extractionParametersOnPath) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      return annotationObject?.FilterRestrictions?.Filterable;
    }, extractionParametersOnPath);
  };
  _exports.isPathFilterable = isPathFilterable;
  const checkFilterExpressionRestrictions = function (dataModelObjectPath, allowedExpression) {
    return checkOnPath(dataModelObjectPath, annotationObject => {
      if (annotationObject && "FilterRestrictions" in annotationObject) {
        const filterExpressionRestrictions = annotationObject?.FilterRestrictions?.FilterExpressionRestrictions || [];
        const currentObjectRestriction = filterExpressionRestrictions.find(restriction => {
          return restriction.Property.$target === dataModelObjectPath.targetObject;
        });
        if (currentObjectRestriction) {
          return allowedExpression.includes(currentObjectRestriction?.AllowedExpressions?.toString());
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
  };
  _exports.checkFilterExpressionRestrictions = checkFilterExpressionRestrictions;
  /**
   * Gets the target entitySet, its parent and the navigation path from the parent to the target entitySet
   * The target entitySet pointing to either null (in case of containment navprop a last part), or the actual target (non containment as target)
   * The parent entitySet pointing to the previous entitySet used in the path.
   * @param dataModelObjectPath The dataModelObjectPath
   * @returns The target entityset, its parent and the navigation path
   */
  const getTargetEntitySetInfo = dataModelObjectPath => {
    let resetVisitedNavProps = false;
    let visitedNavigationPropsName = [];
    let currentEntitySet = dataModelObjectPath.startingEntitySet;
    let parentEntitySet = null;
    let targetEntitySet = currentEntitySet;
    let parentNavigationPath = "";
    for (const navigationProperty of dataModelObjectPath.navigationProperties) {
      if (resetVisitedNavProps) {
        visitedNavigationPropsName = [];
      }
      visitedNavigationPropsName.push(navigationProperty.name);
      parentNavigationPath = visitedNavigationPropsName.join("/");
      if (isProperty(navigationProperty) || !navigationProperty.containsTarget) {
        // We should have a navigationPropertyBinding associated with the path so far which can consist of ([ContainmentNavProp]/)*[NavProp]
        if (currentEntitySet && currentEntitySet.navigationPropertyBinding.hasOwnProperty(parentNavigationPath)) {
          parentEntitySet = currentEntitySet;
          currentEntitySet = currentEntitySet.navigationPropertyBinding[parentNavigationPath];
          targetEntitySet = currentEntitySet;
          // If we reached a navigation property with a navigationpropertybinding, we need to reset the visited path on the next iteration (if there is one)
          resetVisitedNavProps = true;
        } else {
          // We really should not end up here but at least let's try to avoid incorrect behavior
          parentEntitySet = currentEntitySet;
          currentEntitySet = null;
          resetVisitedNavProps = true;
        }
      } else {
        parentEntitySet = currentEntitySet;
        targetEntitySet = null;
      }
    }
    return {
      parentEntitySet,
      targetEntitySet,
      parentNavigationPath
    };
  };

  /**
   * Gets the restrictions set on the parent navigation.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param checkFunction The function to check the annotation
   * @param extractionParametersOnPath The extraction parameters
   * @returns The binding expression.
   */
  _exports.getTargetEntitySetInfo = getTargetEntitySetInfo;
  const checkOnParentNavigation = (dataModelObjectPath, checkFunction, extractionParametersOnPath) => {
    const navigationProps = dataModelObjectPath.navigationProperties;
    const {
      parentEntitySet,
      parentNavigationPath
    } = getTargetEntitySetInfo(dataModelObjectPath);
    let restrictions, visitedNavProps;
    for (const restrictedNavProp of parentEntitySet?.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties ?? []) {
      if (parentNavigationPath === restrictedNavProp.NavigationProperty.value) {
        const restrictionDefinition = checkFunction(restrictedNavProp)?.valueOf();
        if (restrictionDefinition !== undefined) {
          if (isConstant(getExpressionFromAnnotation(restrictionDefinition))) {
            restrictions = constant(restrictionDefinition);
          } else {
            const _navigationProps = navigationProps.slice(0, -1);
            visitedNavProps = _navigationProps;
            if (dataModelObjectPath.contextLocation && visitedNavProps.length < dataModelObjectPath.contextLocation?.navigationProperties.length &&
            // We need to go backward to get the relative path
            !navigationProps[navigationProps.length - 1].partner) {
              // To go backward we need the partner
              restrictions = undefined;
            } else {
              const pathRelativeLocation = getPathRelativeLocation(dataModelObjectPath.contextLocation, visitedNavProps).map(np => np.name);
              const pathVisitorFunction = extractionParametersOnPath?.pathVisitor ? getPathVisitorForSingleton(extractionParametersOnPath.pathVisitor, pathRelativeLocation) : undefined; // send pathVisitor function only when it is defined and only send function or defined as a parameter
              restrictions = equal(getExpressionFromAnnotation(restrictionDefinition, pathRelativeLocation, undefined, pathVisitorFunction), true);
            }
          }
        }
      }
    }
    return restrictions;
  };

  /**
   * Gets the restrictions set on the target entitySet.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param checkFunction The function to check the annotation
   * @param extractionParametersOnPath The extraction parameters
   * @returns The binding expression.
   */
  const checkOnTarget = (dataModelObjectPath, checkFunction, extractionParametersOnPath) => {
    const targetEntityType = dataModelObjectPath.targetEntityType;
    let targetRestrictions;
    const {
      targetEntitySet
    } = getTargetEntitySetInfo(dataModelObjectPath);
    let restrictionDefinition = checkFunction(targetEntitySet?.annotations?.Capabilities);
    if (targetEntitySet === null && restrictionDefinition === undefined) {
      restrictionDefinition = checkFunction(targetEntityType?.annotations?.Capabilities);
    }
    if (restrictionDefinition !== undefined) {
      const pathRelativeLocation = getRelativePaths(dataModelObjectPath);
      const pathVisitorFunction = extractionParametersOnPath?.pathVisitor ? getPathVisitorForSingleton(extractionParametersOnPath.pathVisitor, pathRelativeLocation) : undefined;
      targetRestrictions = equal(getExpressionFromAnnotation(restrictionDefinition, pathRelativeLocation, undefined, pathVisitorFunction), true);
    }
    return targetRestrictions;
  };

  /**
   * Gets the restrictions applied on the target
   * The restriction is caluclated according to the parent and the target.
   * @param dataModelObjectPath The dataModelObjectPath
   * @param checkFunction The function to check the annotation
   * @param extractionParametersOnPath The extraction parameters
   * @returns The binding expression.
   */
  const checkOnPath = function (dataModelObjectPath, checkFunction, extractionParametersOnPath) {
    if (!dataModelObjectPath || !dataModelObjectPath.startingEntitySet) {
      return constant(true);
    }
    dataModelObjectPath = enhanceDataModelPath(dataModelObjectPath, extractionParametersOnPath?.propertyPath);

    // Restrictions should be evaluated as ParentEntitySet.NavRestrictions[NavPropertyPath] || TargetEntitySet.Restrictions
    const restrictions = checkOnParentNavigation(dataModelObjectPath, checkFunction, extractionParametersOnPath);
    const targetRestrictions = extractionParametersOnPath?.ignoreTargetCollection ? undefined : checkOnTarget(dataModelObjectPath, checkFunction, extractionParametersOnPath);
    return restrictions || targetRestrictions || (extractionParametersOnPath?.authorizeUnresolvable ? unresolvableExpression : constant(true));
  };

  /**
   * Set a trailing slash to a path if not already set.
   * @param path The path
   * @returns The path with a trailing slash
   */
  _exports.checkOnPath = checkOnPath;
  const setTrailingSlash = function (path) {
    if (path.length && !path.endsWith("/")) {
      return `${path}/`;
    }
    return path;
  };

  // This helper method is used to add relative path location argument to singletonPathVisitorFunction i.e. pathVisitor
  // pathVisitor method is used later to get the correct bindings for singleton entity
  // method is invoked later in pathInModel() method to get the correct binding.
  const getPathVisitorForSingleton = function (pathVisitor, pathRelativeLocation) {
    return function (path) {
      return pathVisitor(path, pathRelativeLocation);
    };
  };
  return _exports;
}, false);
//# sourceMappingURL=DataModelPathHelper-dbg.js.map

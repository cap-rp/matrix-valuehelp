/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards", "./DataModelPathHelper"], function (TypeGuards, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getTargetEntitySetInfo = DataModelPathHelper.getTargetEntitySetInfo;
  var isEntitySet = TypeGuards.isEntitySet;
  /**
   * Reads all FilterRestrictions of the main entity and the navigation restrictions.
   * We get the restrictions first on the navigation property (most precise definition), and if not available, then we get the restrictions on the entitySet.
   * In case of containment, we only get the restrictions on the navigation property of the parent entitySet.
   * @param entitySet Entity set to be analyzed
   * @param targetEntitySet The target entity set, if available.  Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-filterable properties
   */
  const getNonFilterablePropertiesRestrictions = function (entitySet, targetEntitySet, parentNavigationPath) {
    const filterRestrictionsFromNavigationRestrictions = getFilterRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath);
    const directFilterRestrictions = getDirectFilterRestrictions(entitySet, targetEntitySet, parentNavigationPath);
    // Merge two filter restrictions found on the navigation property and directly from the entity set
    return Array.from(new Set([...filterRestrictionsFromNavigationRestrictions, ...directFilterRestrictions]));
  };

  /**
   * Reads all SortRestrictions of the main entity and the navigation restrictions.
   * We retrieve the restrictions first on the navigation property (most precise definition), and if not available, then we get the restrictions on the entitySet
   * In case of containment, we only get the restrictions on the navigation property of the parent entitySet.
   * @param entitySet Entity set to be analyzed
   * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-sortable properties
   */
  _exports.getNonFilterablePropertiesRestrictions = getNonFilterablePropertiesRestrictions;
  const getNonSortablePropertiesRestrictions = function (entitySet, targetEntitySet, parentNavigationPath) {
    const sortRestrictionsFromNavigationRestrictions = getSortRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath);
    const directSortRestrictions = getDirectSortRestrictions(entitySet, targetEntitySet, parentNavigationPath);
    // Merge two sort restrictions found on the navigation property and directly from the entity set
    return Array.from(new Set([...sortRestrictionsFromNavigationRestrictions, ...directSortRestrictions]));
  };

  /**
   * Gets all SortRestrictions and FilterRestrictions for a given context.
   * @param converterContext The converter context.
   * @returns Object containing all property names of restrictions separated by sortable and filterable capabilities.
   */
  _exports.getNonSortablePropertiesRestrictions = getNonSortablePropertiesRestrictions;
  const getRestrictionsOnProperties = function (converterContext) {
    let propertiesRestrictions = {
      nonSortableProperties: [],
      nonFilterableProperties: []
    };
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const {
      parentEntitySet,
      targetEntitySet,
      parentNavigationPath
    } = getTargetEntitySetInfo(dataModelObjectPath);
    if (isEntitySet(targetEntitySet)) {
      if (parentEntitySet && isEntitySet(parentEntitySet)) {
        propertiesRestrictions = {
          nonSortableProperties: getNonSortablePropertiesRestrictions(parentEntitySet, targetEntitySet),
          nonFilterableProperties: getNonFilterablePropertiesRestrictions(parentEntitySet, targetEntitySet)
        };
        if (propertiesRestrictions.nonSortableProperties.length || propertiesRestrictions.nonFilterableProperties.length) {
          return propertiesRestrictions;
        }
      }
      return {
        nonSortableProperties: getNonSortablePropertiesRestrictions(targetEntitySet),
        nonFilterableProperties: getNonFilterablePropertiesRestrictions(targetEntitySet)
      };
    } else if (parentEntitySet && isEntitySet(parentEntitySet)) {
      // Find the restrictions on the parent entity set, this applies also for containment as there isn't an entity set on the OP
      return {
        nonSortableProperties: getNonSortablePropertiesRestrictions(parentEntitySet, undefined, parentNavigationPath),
        nonFilterableProperties: getNonFilterablePropertiesRestrictions(parentEntitySet, undefined, parentNavigationPath)
      };
    }
    return propertiesRestrictions;
  };

  /**
   * Gets the sort restrictions from the navigation restrictions.
   * @param entitySet Entity set to be analyzed.
   * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-sortable properties from navigation restrictions.
   */
  _exports.getRestrictionsOnProperties = getRestrictionsOnProperties;
  function getSortRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath) {
    const sortRestrictionsFromNavigationRestrictions = [];
    entitySet.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties?.forEach(navigationRestriction => {
      // if containment enabled get only the sort restrictions of the related navigation path
      if (parentNavigationPath && parentNavigationPath !== navigationRestriction?.NavigationProperty?.value) {
        return;
      }
      if (navigationRestriction?.SortRestrictions?.Sortable === false) {
        // find correct navigation property
        const navigationProperty = entitySet.entityType.navigationProperties.by_name(navigationRestriction?.NavigationProperty?.value);
        if (navigationProperty) {
          // add all properties of the navigation property to the nonSortableProperties
          if (parentNavigationPath) {
            sortRestrictionsFromNavigationRestrictions.push(...navigationProperty.targetType.entityProperties.map(property => property.name));
          } else {
            sortRestrictionsFromNavigationRestrictions.push(...navigationProperty.targetType.entityProperties.map(property => `${navigationProperty.name}/${property.name}`));
          }
        }
      } else {
        const nonSortableNavigationProperties = navigationRestriction?.SortRestrictions?.NonSortableProperties?.map(property => {
          // We need the property name from the navigation restriction definition when the targetEntitySet is available
          if ((targetEntitySet || parentNavigationPath) && property.$target?.name) {
            return property.$target?.name;
          } else {
            // leave the property path unchanged (it is relative to the annotation target!)
            return property.value;
          }
        });
        if (nonSortableNavigationProperties?.length) {
          sortRestrictionsFromNavigationRestrictions.push(...nonSortableNavigationProperties);
        }
      }
    });
    return sortRestrictionsFromNavigationRestrictions;
  }

  /**
   * Gets the sort restrictions directly from the entity set.
   * @param entitySet Entity set to be analyzed.
   * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-sortable properties.
   */
  function getDirectSortRestrictions(entitySet, targetEntitySet, parentNavigationPath) {
    const sortRestrictionsOnEntitySet = [];
    if (entitySet.annotations.Capabilities?.SortRestrictions?.Sortable === false) {
      // add all properties of the entity set to the nonSortableProperties
      sortRestrictionsOnEntitySet.push(...entitySet.entityType.entityProperties.map(property => property.name));
    } else {
      const nonSortableProperties = [];
      entitySet.annotations.Capabilities?.SortRestrictions?.NonSortableProperties?.forEach(property => {
        if (parentNavigationPath && !property.value.includes(parentNavigationPath)) {
          // skip the non sortable property if it doesn't belong to the parent navigation path in case of containment
          return;
        }
        if ((targetEntitySet || parentNavigationPath) && property.$target?.name) {
          nonSortableProperties.push(property.$target?.name);
        } else {
          nonSortableProperties.push(property.value);
        }
      });
      if (nonSortableProperties?.length) {
        sortRestrictionsOnEntitySet.push(...nonSortableProperties);
      }
    }
    return sortRestrictionsOnEntitySet;
  }

  /**
   * Gets the filter restrictions from the navigation restrictions.
   * @param entitySet Entity set to be analyzed.
   * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-filterable properties from navigation restrictions.
   */
  function getFilterRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath) {
    const filterRestrictionsFromNavigationRestrictions = [];
    entitySet.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties?.forEach(navigationRestriction => {
      // if containment enabled get only the filter restrictions of the related navigation path
      if (parentNavigationPath && parentNavigationPath !== navigationRestriction?.NavigationProperty?.value) {
        return;
      }
      if (navigationRestriction?.FilterRestrictions?.Filterable === false) {
        // find correct navigation property
        const navigationProperty = entitySet.entityType.navigationProperties.by_name(navigationRestriction?.NavigationProperty?.value);
        if (navigationProperty) {
          // add all properties of the navigation property to the nonFilterableProperties
          if (parentNavigationPath) {
            filterRestrictionsFromNavigationRestrictions.push(...navigationProperty.targetType.entityProperties.map(property => property.name));
          } else {
            filterRestrictionsFromNavigationRestrictions.push(...navigationProperty.targetType.entityProperties.map(property => `${navigationProperty.name}/${property.name}`));
          }
        }
      } else {
        const nonFilterableNavigationProperties = navigationRestriction?.FilterRestrictions?.NonFilterableProperties?.map(property => {
          // we need the property name from the navigation restriction definition when the targetEntitySet is available and it's not a containment scenario
          if ((targetEntitySet || parentNavigationPath) && property.$target?.name) {
            return property.$target?.name;
          } else {
            // leave the property path unchanged (it is relative to the annotation target!)
            return property.value;
          }
        });
        if (nonFilterableNavigationProperties?.length) {
          filterRestrictionsFromNavigationRestrictions.push(...nonFilterableNavigationProperties);
        }
      }
    });
    return filterRestrictionsFromNavigationRestrictions;
  }

  /**
   * Gets the filter restrictions directly from the entity set.
   * @param entitySet Entity set to be analyzed.
   * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
   * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
   * @returns Array containing the property names of all non-filterable properties.
   */
  function getDirectFilterRestrictions(entitySet, targetEntitySet, parentNavigationPath) {
    const filterRestrictionsOnEntitySet = [];
    if (entitySet.annotations.Capabilities?.FilterRestrictions?.Filterable === false) {
      // add all properties of the entity set to the nonFilterableProperties
      filterRestrictionsOnEntitySet.push(...entitySet.entityType.entityProperties.map(property => property.name));
    } else {
      const nonFilterableProperties = [];
      entitySet.annotations.Capabilities?.FilterRestrictions?.NonFilterableProperties?.forEach(property => {
        if (parentNavigationPath && !property.value.includes(parentNavigationPath)) {
          // skip the non filterable property if it doesn't belong to the parent navigation path in case of containment
          return;
        }
        if ((targetEntitySet || parentNavigationPath) && property.$target?.name) {
          nonFilterableProperties.push(property.$target?.name);
        } else {
          nonFilterableProperties.push(property.value);
        }
      });
      if (nonFilterableProperties?.length) {
        filterRestrictionsOnEntitySet.push(...nonFilterableProperties);
      }
    }
    return filterRestrictionsOnEntitySet;
  }
  return _exports;
}, false);
//# sourceMappingURL=EntitySetHelper-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/type/EDM", "../converters/MetaModelConverter"], function (BindingToolkit, IssueManager, ModelHelper, EDM, MetaModelConverter) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var isTypeFilterable = EDM.isTypeFilterable;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var compileExpression = BindingToolkit.compileExpression;
  // The goal of this file is to disappear as soon as we can.
  // It is a temporary solution to move all metamodel related operation from CommonUtils to a separate file.
  // From FilterBar.block.ts only
  function getSearchRestrictions(fullPath, metaModel) {
    let searchRestrictions;
    let navigationSearchRestrictions;
    const navigationText = "$NavigationPropertyBinding";
    const searchRestrictionsTerm = "@Org.OData.Capabilities.V1.SearchRestrictions";
    const entityTypePathParts = fullPath.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entitySetPath = ModelHelper.getEntitySetPath(fullPath, metaModel);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = metaModel.getObject(`/${entityTypePathParts.join("/")}/$ContainsTarget`) ? true : false;
    const containmentNavPath = isContainment ? entityTypePathParts[entityTypePathParts.length - 1] : "";

    //LEAST PRIORITY - Search restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      searchRestrictions = metaModel.getObject(`${entitySetPath}${searchRestrictionsTerm}`);
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      // In case of containment we take entitySet provided as parent. And in case of normal we would remove the last navigation from entitySetPath.
      const joinString = `/${navigationText}/`;
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(joinString)}`;

      //HIGHEST priority - Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModel, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      navigationSearchRestrictions = navigationRestrictions?.SearchRestrictions;
    }
    return navigationSearchRestrictions ?? searchRestrictions;
  }

  // From CommonUtils
  _exports.getSearchRestrictions = getSearchRestrictions;
  function getNavigationRestrictions(metaModelContext, entitySetPath, navigationPath) {
    const navigationRestrictions = metaModelContext.getObject(`${entitySetPath}@Org.OData.Capabilities.V1.NavigationRestrictions`);
    const restrictedProperties = navigationRestrictions?.RestrictedProperties;
    return restrictedProperties?.find(function (restrictedProperty) {
      return restrictedProperty.NavigationProperty?.$NavigationPropertyPath === navigationPath;
    });
  }

  // Internal usage only
  _exports.getNavigationRestrictions = getNavigationRestrictions;
  function isInNonFilterableProperties(metamodelContext, entitySetPath, contextPath) {
    let isNotFilterable = false;
    const filterRestrictionsAnnotation = metamodelContext.getObject(`${entitySetPath}@Org.OData.Capabilities.V1.FilterRestrictions`);
    if (filterRestrictionsAnnotation?.NonFilterableProperties) {
      isNotFilterable = filterRestrictionsAnnotation.NonFilterableProperties.some(function (property) {
        return property.$NavigationPropertyPath === contextPath || property.$PropertyPath === contextPath;
      });
    }
    return isNotFilterable;
  }

  // Internal usage only
  function isCustomAggregate(metamodelContext, entitySetPath, contextPath) {
    let interanlIsCustomAggregate = false;
    // eslint-disable-next-line regex/invalid-warn
    const isApplySupported = metamodelContext.getObject(entitySetPath + "@Org.OData.Aggregation.V1.ApplySupported") ? true : false;
    if (isApplySupported) {
      const entitySetAnnotations = metamodelContext.getObject(`${entitySetPath}@`);
      const customAggregatesAnnotations = METAMODEL_FUNCTIONS.getAllCustomAggregates(entitySetAnnotations);
      const customAggregates = customAggregatesAnnotations ? Object.keys(customAggregatesAnnotations) : undefined;
      if (customAggregates?.includes(contextPath)) {
        interanlIsCustomAggregate = true;
      }
    }
    return interanlIsCustomAggregate;
  }

  // Internal usage only
  _exports.isCustomAggregate = isCustomAggregate;
  function checkEntitySetIsFilterable(entitySetPath, metaModelContext, property, navigationContext) {
    let isFilterable = entitySetPath.split("/").length === 2 && !property.includes("/") ? !isInNonFilterableProperties(metaModelContext, entitySetPath, property) : !isContextPathFilterable(metaModelContext, entitySetPath, property);
    // check if type can be used for filtering
    if (isFilterable && navigationContext) {
      const propertyDataType = getPropertyDataType(navigationContext);
      if (propertyDataType) {
        isFilterable = propertyDataType ? isTypeFilterable(propertyDataType) : false;
      } else {
        isFilterable = false;
      }
    }
    return isFilterable;
  }

  // Internal usage only
  function isContextPathFilterable(metaModelContext, entitySetPath, contextPath) {
    const fullPath = `${entitySetPath}/${contextPath}`,
      esParts = fullPath.split("/").splice(0, 2),
      contexts = fullPath.split("/").splice(2);
    let isNoFilterable = false,
      context = "";
    entitySetPath = esParts.join("/");
    isNoFilterable = contexts.some(function (item, index, array) {
      if (context.length > 0) {
        context += `/${item}`;
      } else {
        context = item;
      }
      if (index === array.length - 2) {
        // In case of "/Customer/Set/Property" this is to check navigation restrictions of "Customer" for non-filterable properties in "Set"
        const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModelContext, entitySetPath, item);
        const filterRestrictions = navigationRestrictions?.FilterRestrictions;
        const nonFilterableProperties = filterRestrictions?.NonFilterableProperties;
        const targetPropertyPath = array[array.length - 1];
        if (nonFilterableProperties?.find(function (propertyPath) {
          return propertyPath.$PropertyPath === targetPropertyPath;
        })) {
          return true;
        }
      }
      if (index === array.length - 1) {
        //last path segment
        isNoFilterable = isInNonFilterableProperties(metaModelContext, entitySetPath, context);
      } else if (metaModelContext.getObject(`${entitySetPath}/$NavigationPropertyBinding/${item}`)) {
        //check existing context path and initialize it
        isNoFilterable = isInNonFilterableProperties(metaModelContext, entitySetPath, context);
        context = "";
        //set the new EntitySet
        entitySetPath = "/" + metaModelContext.getObject(`${entitySetPath}/$NavigationPropertyBinding/${item}`);
      }
      return isNoFilterable;
    });
    return isNoFilterable;
  }

  // Internal usage only

  function getPropertyDataType(navigationContext) {
    let dataType = navigationContext.getProperty("$Type");
    // if $kind exists, it's not a DataField and we have the final type already
    if (!navigationContext.getProperty("$kind")) {
      switch (dataType) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          dataType = undefined;
          break;
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          dataType = navigationContext.getProperty("Value/$Path/$Type");
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        default:
          const annotationPath = navigationContext.getProperty("Target/$AnnotationPath");
          if (annotationPath) {
            if (annotationPath.includes("com.sap.vocabularies.Communication.v1.Contact")) {
              dataType = navigationContext.getProperty("Target/$AnnotationPath/fn/$Path/$Type");
            } else if (annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")) {
              dataType = navigationContext.getProperty("Value/$Path/$Type");
            } else {
              // e.g. FieldGroup or Chart
              dataType = undefined;
            }
          } else {
            dataType = undefined;
          }
          break;
      }
    }
    return dataType;
  }

  // From CommonUtils, CommonHelper, FilterBarDelegate, FilterField, ValueListHelper, TableDelegate
  // TODO check used places and rework this
  function isPropertyFilterable(metaModelContext, entitySetPath, property, skipHiddenFilters) {
    if (typeof property !== "string") {
      throw new Error("sProperty parameter must be a string");
    }

    // Parameters should be rendered as filterfields
    if (metaModelContext.getObject(`${entitySetPath}/@com.sap.vocabularies.Common.v1.ResultContext`) === true) {
      return true;
    }
    const navigationContext = metaModelContext.createBindingContext(`${entitySetPath}/${property}`);
    if (navigationContext && !skipHiddenFilters) {
      if (navigationContext.getProperty("@com.sap.vocabularies.UI.v1.Hidden") === true || navigationContext.getProperty("@com.sap.vocabularies.UI.v1.HiddenFilter") === true) {
        return false;
      }
      const hiddenPath = navigationContext.getProperty("@com.sap.vocabularies.UI.v1.Hidden/$Path");
      const hiddenFilterPath = navigationContext.getProperty("@com.sap.vocabularies.UI.v1.HiddenFilter/$Path");
      if (hiddenPath && hiddenFilterPath) {
        return compileExpression(not(or(pathInModel(hiddenPath), pathInModel(hiddenFilterPath))));
      } else if (hiddenPath) {
        return compileExpression(not(pathInModel(hiddenPath)));
      } else if (hiddenFilterPath) {
        return compileExpression(not(pathInModel(hiddenFilterPath)));
      }
    }
    return checkEntitySetIsFilterable(entitySetPath, metaModelContext, property, navigationContext);
  }

  /**
   * This function processes the entity properties and returns an array of required, non-computed key and immutable fields.
   * @param metaModel Metamodel
   * @param path Entityset Path
   * @param appComponent App Component
   * @returns An array of required, non-computed key and immutable fields
   */
  _exports.isPropertyFilterable = isPropertyFilterable;
  function getCreatePopupFields(metaModel, path, appComponent) {
    const dataModel = getInvolvedDataModelObjects(metaModel.getContext(path));
    const nonComputedVisibleKeys = [];
    const immutableVisibleFields = [];
    const visibileRequiredProperties = [];
    //We first process the required properties
    const requiredProperties = METAMODEL_FUNCTIONS.getRequiredPropertiesFromInsertRestrictions(path, metaModel);
    const entityProperties = dataModel.targetEntityType.entityProperties;
    for (const prop of entityProperties) {
      const annotations = prop.annotations,
        isKey = prop.isKey,
        propName = prop.name,
        isImmutable = annotations.Core?.Immutable?.valueOf() === true,
        isNonComputed = !(annotations.Core?.Computed?.valueOf() === true),
        isVisible = !(annotations.UI?.Hidden?.valueOf() === true),
        isComputedDefaultValue = annotations.Core?.ComputedDefaultValue?.valueOf() === true,
        isKeyComputedDefaultValueWithText = isKey && prop.type === "Edm.Guid" ? isComputedDefaultValue && annotations.Common?.Text : false;
      if ((isKeyComputedDefaultValueWithText || isKey && prop.type !== "Edm.Guid") && isNonComputed && isVisible) {
        nonComputedVisibleKeys.push(propName);
      } else if (requiredProperties.includes(propName) && isVisible && !(isKey && !nonComputedVisibleKeys.includes(propName))) {
        visibileRequiredProperties.push(propName);
      } else if (isImmutable && isNonComputed && isVisible) {
        immutableVisibleFields.push(propName);
      }
      if (!isNonComputed && isComputedDefaultValue && appComponent) {
        const diagnostics = appComponent.getDiagnostics();
        const message = "Core.ComputedDefaultValue is ignored as Core.Computed is already set to true";
        diagnostics.addIssue(IssueCategory.Annotation, IssueSeverity.Medium, message, IssueCategoryType, IssueCategoryType.Annotations.IgnoredAnnotation);
      }
    }
    //The order of fields will be non computed key fields, required properties and then non computed immutable fields.
    return nonComputedVisibleKeys.concat(visibileRequiredProperties).concat(immutableVisibleFields);
  }
  // Internal only, exposed for tests
  _exports.getCreatePopupFields = getCreatePopupFields;
  function getRequiredProperties(path, metaModelContext) {
    let checkUpdateRestrictions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const requiredProperties = [];
    let requiredPropertiesWithPath = [];
    const navigationText = "$NavigationPropertyBinding";
    let entitySetAnnotation = null;
    if (path.endsWith("$")) {
      // if sPath comes with a $ in the end, removing it as it is of no significance
      path = path.replace("/$", "");
    }
    const entityTypePathParts = path.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entitySetPath = ModelHelper.getEntitySetPath(path, metaModelContext);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = metaModelContext.getObject(`/${entityTypePathParts.join("/")}/$ContainsTarget`) ? true : false;
    const containmentNavPath = isContainment ? entityTypePathParts[entityTypePathParts.length - 1] : "";

    //Restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      entitySetAnnotation = metaModelContext.getObject(`${entitySetPath}@`);
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      const joinText = `/${navigationText}/`;
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(joinText)}`;
      //Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModelContext, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      if (navigationRestrictions !== undefined && METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(navigationRestrictions, true, checkUpdateRestrictions)) {
        requiredPropertiesWithPath = checkUpdateRestrictions ? navigationRestrictions.UpdateRestrictions?.RequiredProperties ?? [] : navigationRestrictions.InsertRestrictions?.RequiredProperties ?? [];
      }
      if (!requiredPropertiesWithPath.length && METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(entitySetAnnotation, false, checkUpdateRestrictions)) {
        requiredPropertiesWithPath = METAMODEL_FUNCTIONS.getRequiredPropertiesFromAnnotations(entitySetAnnotation, checkUpdateRestrictions);
      }
    } else if (METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(entitySetAnnotation, false, checkUpdateRestrictions)) {
      requiredPropertiesWithPath = METAMODEL_FUNCTIONS.getRequiredPropertiesFromAnnotations(entitySetAnnotation, checkUpdateRestrictions);
    }
    requiredPropertiesWithPath.forEach(function (requiredProperty) {
      const propertyPath = requiredProperty.$PropertyPath;
      requiredProperties.push(propertyPath);
    });
    return requiredProperties;
  }

  // TransactionHelper // InternalField
  function getRequiredPropertiesFromInsertRestrictions(path, metamodelContext) {
    return METAMODEL_FUNCTIONS.getRequiredProperties(path, metamodelContext);
  }

  // InternalField
  _exports.getRequiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions;
  function getRequiredPropertiesFromUpdateRestrictions(path, metamodelContext) {
    return METAMODEL_FUNCTIONS.getRequiredProperties(path, metamodelContext, true);
  }

  // Internal only, exposed for tests
  _exports.getRequiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions;
  function getRequiredPropertiesFromAnnotations(annotations) {
    let checkUpdateRestrictions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (checkUpdateRestrictions) {
      return annotations?.["@Org.OData.Capabilities.V1.UpdateRestrictions"]?.RequiredProperties ?? [];
    }
    return annotations?.["@Org.OData.Capabilities.V1.InsertRestrictions"]?.RequiredProperties ?? [];
  }

  // Internal only, exposed for tests
  function hasRestrictedPropertiesInAnnotations(annotations) {
    let isNavigationRestrictions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let checkUpdateRestrictions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (isNavigationRestrictions) {
      const navAnnotations = annotations;
      if (checkUpdateRestrictions) {
        return navAnnotations?.UpdateRestrictions?.RequiredProperties ? true : false;
      }
      return navAnnotations?.InsertRestrictions?.RequiredProperties ? true : false;
    } else if (checkUpdateRestrictions) {
      const entityAnnotations = annotations;
      return entityAnnotations?.["@Org.OData.Capabilities.V1.UpdateRestrictions"]?.RequiredProperties ? true : false;
    }
    const entitytSetAnnotations = annotations;
    return entitytSetAnnotations?.["@Org.OData.Capabilities.V1.InsertRestrictions"]?.RequiredProperties ? true : false;
  }
  // Used in this file and FilterUtils
  /**
   * Returns custom aggregates for a given entitySet.
   * @param annotations A list of annotations of the entity set
   * @returns A map to the custom aggregates keyed by their qualifiers
   */
  function getAllCustomAggregates(annotations) {
    const customAggregates = {};
    let annotation;
    for (const annotationKey in annotations) {
      if (annotationKey.startsWith("@Org.OData.Aggregation.V1.CustomAggregate")) {
        annotation = annotationKey.replace("@Org.OData.Aggregation.V1.CustomAggregate#", "");
        const annotationParts = annotation.split("@");
        if (annotationParts.length == 2) {
          const customAggregate = {};
          //inner annotation that is not part of 	Validation.AggregatableTerms
          if (annotationParts[1] == "Org.OData.Aggregation.V1.ContextDefiningProperties") {
            customAggregate.contextDefiningProperties = annotations[annotationKey];
          }
          if (annotationParts[1] == "com.sap.vocabularies.Common.v1.Label") {
            customAggregate.label = annotations[annotationKey];
          }
          customAggregates[annotationParts[0]] = customAggregate;
        } else if (annotationParts.length == 1) {
          customAggregates[annotationParts[0]] = {
            name: annotationParts[0],
            propertyPath: annotationParts[0],
            label: `Custom Aggregate (${annotation})`,
            sortable: true,
            sortOrder: "both",
            custom: true
          };
        }
      }
    }
    return customAggregates;
  }

  // Used in ValueListHelper, ChartDelegate and ValueHelp-TableDelegate
  _exports.getAllCustomAggregates = getAllCustomAggregates;
  /**
   * Determines the sorting information from the restriction annotation.
   * @param entitySetAnnotations EntitySet or collection annotations with the sort restrictions annotation
   * @returns An object containing the sort restriction information
   */
  function getSortRestrictionsInfo(entitySetAnnotations) {
    const sortRestrictionsInfo = {
      sortable: true,
      propertyInfo: {}
    };
    const sortRestrictions = entitySetAnnotations["@Org.OData.Capabilities.V1.SortRestrictions"];
    if (!sortRestrictions) {
      return sortRestrictionsInfo;
    }
    if (sortRestrictions.Sortable === false) {
      sortRestrictionsInfo.sortable = false;
    }
    for (const propertyItem of sortRestrictions.NonSortableProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: false
      };
    }
    for (const propertyItem of sortRestrictions.AscendingOnlyProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: true,
        sortDirection: "asc" // not used, yet
      };
    }
    for (const propertyItem of sortRestrictions.DescendingOnlyProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: true,
        sortDirection: "desc" // not used, yet
      };
    }
    return sortRestrictionsInfo;
  }

  // Used in ChartDelegate and ValueHelp-TableDelegate
  _exports.getSortRestrictionsInfo = getSortRestrictionsInfo;
  /**
   * Determines the filter information based on the filter restrictions annoation.
   * @param filterRestrictions The filter restrictions annotation
   * @returns An object containing the filter restriction information
   */
  function getFilterRestrictionsInfo(filterRestrictions) {
    let i, propertyName;
    const filterRestrictionsInfo = {
      filterable: true,
      requiresFilter: filterRestrictions?.RequiresFilter || false,
      propertyInfo: {},
      requiredProperties: []
    };
    if (!filterRestrictions) {
      return filterRestrictionsInfo;
    }
    if (filterRestrictions.Filterable === false) {
      filterRestrictionsInfo.filterable = false;
    }

    //Hierarchical Case
    if (filterRestrictions.RequiredProperties) {
      for (i = 0; i < filterRestrictions.RequiredProperties.length; i++) {
        propertyName = filterRestrictions.RequiredProperties[i].$PropertyPath;
        filterRestrictionsInfo.requiredProperties.push(propertyName);
      }
    }
    const nonFilterableProperties = filterRestrictions.NonFilterableProperties?.map(prop => prop.$PropertyPath) || [];
    const filterableProperties = filterRestrictions.FilterExpressionRestrictions?.map(prop => prop.Property?.$PropertyPath) || [];
    getFilterableData(filterRestrictionsInfo.propertyInfo, nonFilterableProperties, filterableProperties);
    if (filterRestrictions.FilterExpressionRestrictions) {
      //TBD
      for (i = 0; i < filterRestrictions.FilterExpressionRestrictions.length; i++) {
        propertyName = filterRestrictions.FilterExpressionRestrictions[i].Property?.$PropertyPath;
        if (propertyName) {
          filterRestrictionsInfo.propertyInfo[propertyName]["allowedExpressions"] = filterRestrictions.FilterExpressionRestrictions[i].AllowedExpressions;
        }
      }
    }
    return filterRestrictionsInfo;
  }

  /**
   * This function will update the obj to have list of properties which can be filtered or not.
   * @param filterDataObj
   * @param nonFilterableProperties
   * @param filterableProperties
   */
  _exports.getFilterRestrictionsInfo = getFilterRestrictionsInfo;
  function getFilterableData(filterDataObj, nonFilterableProperties, filterableProperties) {
    for (let i = 0; i < nonFilterableProperties.length; i++) {
      filterDataObj[nonFilterableProperties[i]] = {
        filterable: false
      };
    }
    for (let i = 0; i < filterableProperties.length; i++) {
      const propName = filterableProperties[i];
      if (propName) {
        filterDataObj[propName] = {
          filterable: true
        };
      }
    }
  }

  // Used in ChartDelegate and ValueHelp-TableDelegate
  /**
   * Provides the information if the FilterExpression is a multiValue Filter Expression.
   * @param filterExpression The FilterExpressionType
   * @returns A boolean value wether it is a multiValue Filter Expression or not
   */
  _exports.getFilterableData = getFilterableData;
  function isMultiValueFilterExpression(filterExpression) {
    let isMultiValue = true;

    //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
    switch (filterExpression) {
      case "SearchExpression":
      case "SingleRange":
      case "SingleValue":
        isMultiValue = false;
        break;
      default:
        break;
    }
    return isMultiValue;
  }

  // DO NOT USE, only for tests and internally in this file
  _exports.isMultiValueFilterExpression = isMultiValueFilterExpression;
  const METAMODEL_FUNCTIONS = {
    getRequiredProperties,
    getRequiredPropertiesFromAnnotations,
    hasRestrictedPropertiesInAnnotations,
    getRequiredPropertiesFromInsertRestrictions,
    getNavigationRestrictions,
    getAllCustomAggregates,
    getFilterableData
  };
  _exports.METAMODEL_FUNCTIONS = METAMODEL_FUNCTIONS;
  return _exports;
}, false);
//# sourceMappingURL=MetaModelFunction-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/Common/Table", "sap/fe/core/converters/controls/Common/table/Columns", "sap/fe/core/converters/controls/ListReport/FilterField", "sap/fe/core/converters/controls/ListReport/VisualFilters", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/m/library"], function (DataVisualization, Table, Columns, FilterField, VisualFilters, ConfigurableObject, IssueManager, Key, ModelHelper, TypeGuards, DataModelPathHelper, PropertyHelper, library) {
  "use strict";

  var _exports = {};
  var StandardDynamicDateRangeKeys = library.StandardDynamicDateRangeKeys;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedTimezonePropertyPath = PropertyHelper.getAssociatedTimezonePropertyPath;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var isComplexType = TypeGuards.isComplexType;
  var KeyHelper = Key.KeyHelper;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var getVisualFilters = VisualFilters.getVisualFilters;
  var getMaxConditions = FilterField.getMaxConditions;
  var isFilteringCaseSensitive = Columns.isFilteringCaseSensitive;
  var getTypeConfig = Columns.getTypeConfig;
  var getSelectionVariantConfiguration = Table.getSelectionVariantConfiguration;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  //import { hasValueHelp } from "sap/fe/core/templating/PropertyHelper";
  var filterFieldType = /*#__PURE__*/function (filterFieldType) {
    filterFieldType["Default"] = "Default";
    filterFieldType["Slot"] = "Slot";
    return filterFieldType;
  }(filterFieldType || {});
  const sEdmString = "Edm.String";
  const sStringDataType = "sap.ui.model.odata.type.String";
  /**
   * Enter all DataFields of a given FieldGroup into the filterFacetMap.
   * @param fieldGroup
   * @returns The map of facets for the given FieldGroup
   */
  function getFieldGroupFilterGroups(fieldGroup) {
    const filterFacetMap = {};
    fieldGroup.Data.forEach(dataField => {
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataField") {
        filterFacetMap[dataField.Value.path] = {
          group: fieldGroup.fullyQualifiedName,
          groupLabel: fieldGroup.Label?.toString() ?? fieldGroup.annotations?.Common?.Label?.toString() ?? fieldGroup.qualifier
        };
      }
    });
    return filterFacetMap;
  }

  /**
   * Get the properties of the selection variants used in the different visualizations that should be excluded.
   * @param lrTableVisualizations The list report tables
   * @param converterContext The converter context
   * @returns The excluded properties
   */
  function getExcludedFilterProperties(lrTableVisualizations, converterContext) {
    const selectionVariantPaths = new Set();
    const manifestFilterFields = converterContext.getManifestWrapper().getFilterConfiguration().filterFields ?? {};
    const selectionFieldPaths = new Set([
    //Selection Fields coming from the annotation
    ...(converterContext.getDataModelObjectPath().targetEntityType?.annotations?.UI?.SelectionFields ?? []).map(selectionField => selectionField.value),
    //Selection Fields coming from the manifest and not with custom template
    ...Object.keys(manifestFilterFields).filter(key => !!manifestFilterFields[key].template)]);
    return new Set(lrTableVisualizations.map(visualization => {
      const tableFilters = visualization.control.filters;
      if (!tableFilters) {
        return [];
      }
      return [...(tableFilters.hiddenFilters?.paths ?? []), ...(tableFilters.quickFilters?.paths ?? [])].map(path => {
        const annotationPath = path.annotationPath;
        if (!selectionVariantPaths.has(annotationPath)) {
          selectionVariantPaths.add(annotationPath);
          const selectionVariantConfig = getSelectionVariantConfiguration(annotationPath, converterContext);
          if (selectionVariantConfig) {
            selectionVariantConfig.propertyNames = selectionVariantConfig.propertyNames.filter(propertyName => !selectionFieldPaths.has(propertyName));
            return selectionVariantConfig.propertyNames;
          }
        }
        return [];
      });
    }).flat(2));
  }

  /**
   * Returns the condition path required for the condition model. It looks as follows:
   * <1:N-PropertyName>*\/<1:1-PropertyName>/<PropertyName>.
   * @param entityType The root EntityType
   * @param propertyPath The full path to the target property
   * @returns The formatted condition path
   */
  const _getConditionPath = function (entityType, propertyPath) {
    const parts = propertyPath.split("/");
    let partialPath;
    let key = "";
    while (parts.length) {
      let part = parts.shift();
      partialPath = partialPath ? `${partialPath}/${part}` : part;
      const property = entityType.resolvePath(partialPath);
      if (isMultipleNavigationProperty(property)) {
        part += "*";
      }
      key = key ? `${key}/${part}` : part;
    }
    return key;
  };
  const _createFilterSelectionField = function (entityType, property, fullPropertyPath, includeHidden, converterContext) {
    // ignore complex property types and hidden annotated ones
    if (property && property.targetType === undefined && (includeHidden || property.annotations?.UI?.Hidden?.valueOf() !== true)) {
      const targetEntityType = converterContext.getAnnotationEntityType(property),
        filterField = {
          key: KeyHelper.getSelectionFieldKeyFromPath(fullPropertyPath),
          annotationPath: converterContext.getAbsoluteAnnotationPath(fullPropertyPath),
          conditionPath: _getConditionPath(entityType, fullPropertyPath),
          availability: property.annotations?.UI?.HiddenFilter?.valueOf() === true ? "Hidden" : "Adaptation",
          label: property.annotations.Common?.Label?.toString() ?? property.name,
          group: targetEntityType.name,
          groupLabel: targetEntityType?.annotations?.Common?.Label?.toString() ?? targetEntityType.name
        };
      getSettingsOfDefaultFilterFields(filterField);
      return filterField;
    }
    return undefined;
  };

  /**
   * Retrieve the configuration for the technical property DraftAdministrativeData. Only relevant for CreationDateTime
   * and LastChangeDateTime, as they are displaying the timeframe related properties as a SemanticDateRange.
   * @param filterField
   */
  const getSettingsOfDefaultFilterFields = function (filterField) {
    if (filterField.key === "DraftAdministrativeData::CreationDateTime" || filterField.key === "DraftAdministrativeData::LastChangeDateTime") {
      const standardDynamicDateRangeKeys = [StandardDynamicDateRangeKeys.TO, StandardDynamicDateRangeKeys.TOMORROW, StandardDynamicDateRangeKeys.NEXTWEEK, StandardDynamicDateRangeKeys.NEXTMONTH, StandardDynamicDateRangeKeys.NEXTQUARTER, StandardDynamicDateRangeKeys.NEXTYEAR];
      filterField.settings = {
        operatorConfiguration: [{
          path: "key",
          equals: standardDynamicDateRangeKeys.join(","),
          exclude: true
        }]
      };
    }
  };
  const _getSelectionFields = function (entityType, navigationPath, properties, includeHidden, converterContext) {
    const selectionFieldMap = {};
    if (properties) {
      properties.forEach(property => {
        const propertyPath = property.name;
        const fullPath = (navigationPath ? `${navigationPath}/` : "") + propertyPath;
        const selectionField = _createFilterSelectionField(entityType, property, fullPath, includeHidden, converterContext);
        if (selectionField) {
          selectionFieldMap[fullPath] = selectionField;
        }
      });
    }
    return selectionFieldMap;
  };
  const _getSelectionFieldsByPath = function (entityType, propertyPaths, includeHidden, converterContext) {
    let selectionFields = {};
    if (propertyPaths) {
      propertyPaths.forEach(propertyPath => {
        let localSelectionFields = {};
        const enhancedPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), propertyPath);
        const property = enhancedPath.targetObject;
        if (property === undefined || !includeHidden && enhancedPath.navigationProperties.find(navigationProperty => navigationProperty.annotations?.UI?.Hidden?.valueOf() === true)) {
          return;
        }
        if (isNavigationProperty(property)) {
          // handle navigation properties
          localSelectionFields = _getSelectionFields(entityType, propertyPath, property.targetType.entityProperties, includeHidden, converterContext);
        } else if (isComplexType(property.targetType)) {
          // handle ComplexType properties
          localSelectionFields = _getSelectionFields(entityType, propertyPath, property.targetType.properties, includeHidden, converterContext);
        } else {
          localSelectionFields = _getSelectionFields(entityType, getTargetNavigationPath(enhancedPath, true), [property], includeHidden, converterContext);
        }
        selectionFields = {
          ...selectionFields,
          ...localSelectionFields
        };
      });
    }
    return selectionFields;
  };
  const _getFilterField = function (filterFields, propertyPath, converterContext, entityType) {
    let filterField = filterFields[propertyPath];
    if (filterField) {
      delete filterFields[propertyPath];
    } else {
      filterField = _createFilterSelectionField(entityType, entityType.resolvePath(propertyPath), propertyPath, true, converterContext);
    }
    if (!filterField) {
      converterContext.getDiagnostics()?.addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MISSING_SELECTIONFIELD);
    }
    // defined SelectionFields are available by default
    if (filterField) {
      filterField.availability = filterField.availability === "Hidden" ? "Hidden" : "Default";
      filterField.isParameter = !!entityType.annotations?.Common?.ResultContext;
    }
    return filterField;
  };
  const _getDefaultFilterFields = function (aSelectOptions, entityType, converterContext, excludedFilterProperties, annotatedSelectionFields) {
    const selectionFields = [];
    const UISelectionFields = {};
    const properties = entityType.entityProperties;
    // Using entityType instead of entitySet
    annotatedSelectionFields?.forEach(SelectionField => {
      UISelectionFields[SelectionField.value] = true;
    });
    if (aSelectOptions && aSelectOptions.length > 0) {
      aSelectOptions?.forEach(selectOption => {
        const propertyName = selectOption.PropertyName;
        const sPropertyPath = propertyName?.value;
        const currentSelectionFields = {};
        annotatedSelectionFields?.forEach(SelectionField => {
          currentSelectionFields[SelectionField.value] = true;
        });
        if (sPropertyPath && !excludedFilterProperties.has(sPropertyPath)) {
          if (!(sPropertyPath in currentSelectionFields)) {
            const FilterField = getFilterField(sPropertyPath, converterContext, entityType);
            if (FilterField) {
              selectionFields.push(FilterField);
            }
          }
        }
      });
    } else if (properties) {
      properties.forEach(property => {
        const defaultFilterValue = property.annotations?.Common?.FilterDefaultValue;
        const propertyPath = property.name;
        if (!(propertyPath in excludedFilterProperties)) {
          if (defaultFilterValue && !(propertyPath in UISelectionFields)) {
            const FilterField = getFilterField(propertyPath, converterContext, entityType);
            if (FilterField) {
              selectionFields.push(FilterField);
            }
          }
        }
      });
    }
    return selectionFields;
  };

  /**
   * Get all parameter filter fields in case of a parameterized service.
   * @param converterContext
   * @returns An array of parameter FilterFields
   */
  function _getParameterFields(converterContext) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const parameterEntityType = dataModelObjectPath.startingEntitySet.entityType;
    const isParameterized = !!parameterEntityType.annotations?.Common?.ResultContext && !dataModelObjectPath.targetEntitySet;
    const parameterConverterContext = isParameterized && converterContext.getConverterContextFor(`/${dataModelObjectPath.startingEntitySet.name}`);
    return parameterConverterContext ? parameterEntityType.entityProperties.map(function (property) {
      return _getFilterField({}, property.name, parameterConverterContext, parameterEntityType);
    }) : [];
  }

  /**
   * Determines if the FilterBar search field is hidden or not.
   * @param listReportTables The list report tables
   * @param charts The ALP charts
   * @param converterContext The converter context
   * @returns The information if the FilterBar search field is hidden or not
   */
  const getFilterBarHideBasicSearch = function (listReportTables, charts, converterContext) {
    // Check if charts allow search
    const noSearchInCharts = charts.length === 0 || charts.every(chart => !chart.applySupported.enableSearch);

    // Check if all tables are analytical and none of them allow for search
    // or all tables are TreeTable and none of them allow for search
    const noSearchInTables = listReportTables.length === 0 || listReportTables.every(table => (table.enableAnalytics || table.control.type === "TreeTable") && !table.enableBasicSearch);
    const contextPath = converterContext.getContextPath();
    if (contextPath && noSearchInCharts && noSearchInTables) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Retrieves filter fields from the manifest.
   * @param entityType The current entityType
   * @param converterContext The converter context
   * @param annotationPath Annotation path of the selection fields
   * @returns The filter fields defined in the manifest
   */
  _exports.getFilterBarHideBasicSearch = getFilterBarHideBasicSearch;
  const getManifestFilterFields = function (entityType, converterContext, annotationPath) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const settingsContextPath = manifestWrapper.getContextPath() || (manifestWrapper.getEntitySet() ? `/${manifestWrapper.getEntitySet()}` : undefined);
    const filterConfigurationPath = getFilterConfigurationPath(converterContext, settingsContextPath, annotationPath);
    let fbConfig = {};
    fbConfig = manifestWrapper.getFilterConfiguration(filterConfigurationPath);
    const definedFilterFields = fbConfig?.filterFields || {};
    const selectionFields = _getSelectionFieldsByPath(entityType, Object.keys(definedFilterFields).map(key => definedFilterFields[key].property ?? KeyHelper.getPathFromSelectionFieldKey(key)), true, converterContext);
    const filterFields = {};
    for (const sKey in definedFilterFields) {
      const filterField = definedFilterFields[sKey];
      const propertyName = filterField.property ?? KeyHelper.getPathFromSelectionFieldKey(sKey);
      const selectionField = selectionFields[propertyName];
      const type = filterField.type === "Slot" ? filterFieldType.Slot : filterFieldType.Default;
      const visualFilter = filterField && filterField?.visualFilter ? getVisualFilters(entityType, converterContext, sKey, definedFilterFields) : undefined;
      if (filterField.template || filterField.type === filterFieldType.Slot) {
        if (filterField.settings) {
          filterField.settings.isCustomFilter = true;
        } else {
          filterField.settings = {
            isCustomFilter: true
          };
        }
      }
      filterFields[sKey] = {
        key: sKey,
        type: type,
        slotName: filterField?.slotName || sKey,
        annotationPath: selectionField?.annotationPath,
        conditionPath: filterField.property ? KeyHelper.getPathFromSelectionFieldKey(sKey) : selectionField?.conditionPath || propertyName,
        documentRefText: filterField.property && converterContext.fetchTextFromMetaModel("{metaModel>" + filterField.property + "@com.sap.vocabularies.Common.v1.DocumentationRef}"),
        template: filterField.template,
        label: converterContext.fetchTextFromMetaModel(filterField.label),
        position: filterField.position || {
          placement: Placement.After
        },
        availability: filterField.availability || "Default",
        settings: filterField.settings,
        visualFilter: visualFilter,
        required: filterField.required
      };
    }
    return filterFields;
  };

  /**
   * Returns configuration path to fetch the custom filter fields from manifest.
   * @param converterContext The converter context
   * @param settingsContextPath Manifest entity set path and context path
   * @param annotationPath The annotation path
   * @returns Path to fetch the custom filters from the manifest
   */
  _exports.getManifestFilterFields = getManifestFilterFields;
  const getFilterConfigurationPath = function (converterContext, settingsContextPath, annotationPath) {
    let objectPath;
    const filterBarContextPath = converterContext.getContextPath();
    const metaPath = `${filterBarContextPath}/${annotationPath}`;
    if (settingsContextPath && metaPath?.startsWith(settingsContextPath) && annotationPath) {
      objectPath = metaPath.replace(`${settingsContextPath}/`, "");
    } else {
      objectPath = annotationPath;
    }
    return objectPath ? objectPath : undefined;
  };
  const getFilterField = function (propertyPath, converterContext, entityType) {
    return _getFilterField({}, propertyPath, converterContext, entityType);
  };
  _exports.getFilterField = getFilterField;
  const getFilterRestrictions = function (oFilterRestrictionsAnnotation, sRestriction) {
    let aProps = [];
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation[sRestriction]) {
      aProps = oFilterRestrictionsAnnotation[sRestriction].map(function (oProperty) {
        return oProperty.value;
      });
    }
    return aProps;
  };
  _exports.getFilterRestrictions = getFilterRestrictions;
  const getSearchFilterPropertyInfo = function () {
    return {
      name: "$search",
      path: "$search",
      dataType: sStringDataType,
      maxConditions: 1
    };
  };
  const getEditStateFilterPropertyInfo = function () {
    return {
      name: "$editState",
      path: "$editState",
      groupLabel: "",
      group: "",
      dataType: sStringDataType,
      hiddenFilter: false
    };
  };
  const getSearchRestrictions = function (converterContext) {
    const entitySet = converterContext.getEntitySet();
    return isEntitySet(entitySet) ? entitySet.annotations.Capabilities?.SearchRestrictions : undefined;
  };
  const getNavigationRestrictions = function (converterContext, sNavigationPath) {
    const oNavigationRestrictions = converterContext.getEntitySet()?.annotations?.Capabilities?.NavigationRestrictions;
    const aRestrictedProperties = oNavigationRestrictions && oNavigationRestrictions.RestrictedProperties;
    return aRestrictedProperties && aRestrictedProperties.find(function (oRestrictedProperty) {
      return oRestrictedProperty && oRestrictedProperty.NavigationProperty && oRestrictedProperty.NavigationProperty.value === sNavigationPath;
    });
  };
  // The propertyInfo used internally within FE

  // The propertyInfo we share with MDC
  _exports.getNavigationRestrictions = getNavigationRestrictions;
  const _fetchBasicPropertyInfo = function (oFilterFieldInfo) {
    return {
      key: oFilterFieldInfo.key,
      annotationPath: oFilterFieldInfo.annotationPath,
      conditionPath: oFilterFieldInfo.conditionPath,
      name: oFilterFieldInfo.conditionPath,
      label: oFilterFieldInfo.label,
      hiddenFilter: oFilterFieldInfo.availability === "Hidden",
      display: "Value",
      isParameter: oFilterFieldInfo.isParameter,
      caseSensitive: oFilterFieldInfo.caseSensitive,
      availability: oFilterFieldInfo.availability,
      position: oFilterFieldInfo.position,
      type: oFilterFieldInfo.type,
      template: oFilterFieldInfo.template,
      menu: oFilterFieldInfo.menu,
      required: oFilterFieldInfo.required,
      isCustomFilter: oFilterFieldInfo.settings?.isCustomFilter
    };
  };
  const _getMissingLabelForManifestFilterFields = function (filterFields, manifestFilterFields) {
    filterFields.forEach(filterField => {
      if (manifestFilterFields.hasOwnProperty(filterField.key) && !manifestFilterFields[filterField.key].label) {
        manifestFilterFields[filterField.key].label = filterField.label;
      }
    });
  };
  const displayMode = function (oPropertyAnnotations, oCollectionAnnotations) {
    const oTextAnnotation = oPropertyAnnotations?.Common?.Text,
      oTextArrangmentAnnotation = oTextAnnotation && (oPropertyAnnotations && oPropertyAnnotations?.Common?.Text?.annotations?.UI?.TextArrangement || oCollectionAnnotations && oCollectionAnnotations?.UI?.TextArrangement);
    if (oTextArrangmentAnnotation) {
      if (oTextArrangmentAnnotation.valueOf() === "UI.TextArrangementType/TextOnly") {
        return "Description";
      } else if (oTextArrangmentAnnotation.valueOf() === "UI.TextArrangementType/TextLast") {
        return "ValueDescription";
      }
      return "DescriptionValue"; //TextFirst
    }
    return oTextAnnotation ? "DescriptionValue" : "Value";
  };
  _exports.displayMode = displayMode;
  const fetchPropertyInfo = function (converterContext, oFilterFieldInfo, oTypeConfig) {
    let oPropertyInfo = _fetchBasicPropertyInfo(oFilterFieldInfo);
    const sAnnotationPath = oFilterFieldInfo.annotationPath;
    if (!sAnnotationPath) {
      return oPropertyInfo;
    }
    const targetPropertyObject = converterContext.getConverterContextFor(sAnnotationPath).getDataModelObjectPath().targetObject;
    const oPropertyAnnotations = targetPropertyObject?.annotations;
    const oCollectionAnnotations = converterContext?.getDataModelObjectPath().targetObject?.annotations;
    const oFormatOptions = oTypeConfig.formatOptions;
    const oConstraints = oTypeConfig.constraints;
    oPropertyInfo = Object.assign(oPropertyInfo, {
      formatOptions: oFormatOptions,
      constraints: oConstraints,
      display: displayMode(oPropertyAnnotations, oCollectionAnnotations)
    });
    return oPropertyInfo;
  };
  _exports.fetchPropertyInfo = fetchPropertyInfo;
  const isMultiValue = function (oProperty) {
    let bIsMultiValue = true;
    //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
    switch (oProperty.filterExpression) {
      case "SearchExpression":
      case "SingleRange":
      case "SingleValue":
        bIsMultiValue = false;
        break;
      default:
        break;
    }
    if (oProperty.type && oProperty.type.indexOf("Boolean") > 0) {
      bIsMultiValue = false;
    }
    return bIsMultiValue;
  };
  _exports.isMultiValue = isMultiValue;
  const _isFilterableNavigationProperty = function (entry) {
    return (entry.$Type === "com.sap.vocabularies.UI.v1.DataField" || entry.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || entry.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") && entry.Value.path?.includes("/");
  };

  /**
   * Adds the additional property which references to the unit, timezone, textArrangement or currency from a data field.
   * @param dataField The data field to be considered
   * @param converterContext The converter context
   * @param navProperties The list of navigation properties
   */
  const addChildNavigationProperties = function (dataField, converterContext, navProperties) {
    const targetProperty = dataField.Value?.$target;
    if (targetProperty) {
      const additionalPropertyPath = getAssociatedTextPropertyPath(targetProperty) || getAssociatedCurrencyPropertyPath(targetProperty) || getAssociatedUnitPropertyPath(targetProperty) || getAssociatedTimezonePropertyPath(targetProperty);
      const navigationProperty = additionalPropertyPath ? enhanceDataModelPath(converterContext.getDataModelObjectPath(), additionalPropertyPath).navigationProperties : undefined;
      if (navigationProperty?.length) {
        const navigationPropertyPath = navigationProperty[0].name;
        if (!navProperties.includes(navigationPropertyPath)) {
          navProperties.push(navigationPropertyPath);
        }
      }
    }
  };

  /**
   * Gets used navigation properties for available dataField.
   * @param navProperties The list of navigation properties
   * @param dataField The data field to be considered
   * @param converterContext The converter context
   * @returns The list of navigation properties
   */
  const getNavigationPropertiesRecursively = function (navProperties, dataField, converterContext) {
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        if (dataField.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          dataField.Target.$target.Data?.forEach(innerDataField => {
            getNavigationPropertiesRecursively(navProperties, innerDataField, converterContext);
          });
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        if (_isFilterableNavigationProperty(dataField)) {
          const navigationPropertyPath = getRelativePaths(enhanceDataModelPath(converterContext.getDataModelObjectPath(), dataField.Value.path), true).join("/");
          if (!navProperties.includes(navigationPropertyPath)) {
            navProperties.push(navigationPropertyPath);
          }
        }
        // Additional property from text arrangement/units/currencies/timezone...
        addChildNavigationProperties(dataField, converterContext, navProperties);
        break;
      default:
        // Other types are not supported
        break;
    }
    return navProperties;
  };
  const getAnnotatedSelectionFieldData = function (converterContext) {
    let lrTables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let annotationPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    let includeHidden = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let lineItemTerm = arguments.length > 4 ? arguments[4] : undefined;
    // create a map of properties to be used in selection variants defined in the different visualizations and different views (multi table mode)
    const excludedFilterProperties = getExcludedFilterProperties(lrTables, converterContext);
    const entityType = converterContext.getEntityType();
    //Filters which has to be added which is part of SV/Default annotations but not present in the SelectionFields
    const annotatedSelectionFields = annotationPath && converterContext.getEntityTypeAnnotation(annotationPath)?.annotation || entityType.annotations?.UI?.SelectionFields || [];
    let navProperties = [];
    if (lrTables.length === 0 && !!lineItemTerm) {
      converterContext.getEntityTypeAnnotation(lineItemTerm).annotation?.forEach(dataField => {
        navProperties = getNavigationPropertiesRecursively(navProperties, dataField, converterContext);
      });
    }
    if (ModelHelper.isDraftRoot(converterContext.getEntitySet())) {
      navProperties.push("DraftAdministrativeData/CreationDateTime", "DraftAdministrativeData/CreatedByUser", "DraftAdministrativeData/LastChangeDateTime", "DraftAdministrativeData/LastChangedByUser");
    }

    // create a map of all potential filter fields based on...
    const filterFields = {
      // ...non hidden properties of the entity
      ..._getSelectionFields(entityType, "", entityType.entityProperties, includeHidden, converterContext),
      // ... non hidden properties of navigation properties
      ..._getSelectionFieldsByPath(entityType, navProperties, false, converterContext),
      // ...additional manifest defined navigation properties
      ..._getSelectionFieldsByPath(entityType, converterContext.getManifestWrapper().getFilterConfiguration().navigationProperties, includeHidden, converterContext)
    };
    let aSelectOptions = [];
    const selectionVariant = getSelectionVariant(entityType, converterContext);
    if (selectionVariant) {
      aSelectOptions = selectionVariant.SelectOptions;
    }
    const propertyInfoFields = annotatedSelectionFields?.reduce((selectionFields, selectionField) => {
      const propertyPath = selectionField.value;
      if (!excludedFilterProperties.has(propertyPath)) {
        let navigationPath;
        if (annotationPath?.startsWith("@com.sap.vocabularies.UI.v1.SelectionFields")) {
          navigationPath = "";
        } else {
          navigationPath = annotationPath?.split("/@com.sap.vocabularies.UI.v1.SelectionFields")[0];
        }
        const filterPropertyPath = navigationPath ? navigationPath + "/" + propertyPath : propertyPath;
        const filterField = _getFilterField(filterFields, filterPropertyPath, converterContext, entityType);
        if (filterField) {
          filterField.group = "";
          filterField.groupLabel = "";
          selectionFields.push(filterField);
        }
      }
      return selectionFields;
    }, []) || [];
    const defaultFilterFields = _getDefaultFilterFields(aSelectOptions, entityType, converterContext, excludedFilterProperties, annotatedSelectionFields);
    return {
      excludedFilterProperties: excludedFilterProperties,
      entityType: entityType,
      annotatedSelectionFields: annotatedSelectionFields,
      filterFields: filterFields,
      propertyInfoFields: propertyInfoFields,
      defaultFilterFields: defaultFilterFields
    };
  };
  const fetchTypeConfig = function (property) {
    const oTypeConfig = getTypeConfig(property, property?.type);
    if (property?.type === sEdmString && (oTypeConfig.constraints.nullable === undefined || oTypeConfig.constraints.nullable === true)) {
      oTypeConfig.formatOptions.parseKeepsEmptyString = false;
    }
    return oTypeConfig;
  };
  _exports.fetchTypeConfig = fetchTypeConfig;
  const assignDataTypeToPropertyInfo = function (propertyInfoField, converterContext, aRequiredProps, aTypeConfig) {
    let oPropertyInfo = fetchPropertyInfo(converterContext, propertyInfoField, aTypeConfig[propertyInfoField.key]),
      sPropertyPath = "";
    if (propertyInfoField.conditionPath) {
      sPropertyPath = propertyInfoField.conditionPath.replace(/\+|\*/g, "");
    }
    if (oPropertyInfo) {
      oPropertyInfo = Object.assign(oPropertyInfo, {
        maxConditions: oPropertyInfo.isParameter ? 1 : getMaxConditions(enhanceDataModelPath(converterContext.getDataModelObjectPath(), sPropertyPath)),
        required: propertyInfoField.required ?? (oPropertyInfo.isParameter || aRequiredProps.includes(sPropertyPath)),
        caseSensitive: isFilteringCaseSensitive(converterContext),
        dataType: aTypeConfig[propertyInfoField.key].type
      });
    }
    return oPropertyInfo;
  };
  _exports.assignDataTypeToPropertyInfo = assignDataTypeToPropertyInfo;
  const processSelectionFields = function (propertyInfoFields, converterContext, defaultValuePropertyFields) {
    //get TypeConfig function
    const aTypeConfig = {};
    if (defaultValuePropertyFields) {
      propertyInfoFields = propertyInfoFields.concat(defaultValuePropertyFields);
    }
    //add typeConfig
    propertyInfoFields.forEach(function (parameterField) {
      if (parameterField.annotationPath) {
        const propertyConvertyContext = converterContext.getConverterContextFor(parameterField.annotationPath);
        const propertyTargetObject = propertyConvertyContext.getDataModelObjectPath().targetObject;
        const oTypeConfig = fetchTypeConfig(propertyTargetObject);
        aTypeConfig[parameterField.key] = oTypeConfig;
      } else {
        aTypeConfig[parameterField.key] = {
          type: sStringDataType
        };
      }
    });

    // filterRestrictions
    const entitySet = converterContext.getEntitySet();
    const oFilterRestrictions = isEntitySet(entitySet) ? entitySet.annotations.Capabilities?.FilterRestrictions : undefined;
    const oRet = {};
    oRet.RequiredProperties = getFilterRestrictions(oFilterRestrictions, "RequiredProperties") || [];
    oRet.NonFilterableProperties = getFilterRestrictions(oFilterRestrictions, "NonFilterableProperties") || [];
    const sEntitySetPath = converterContext.getContextPath();
    const aPathParts = sEntitySetPath.split("/");
    if (aPathParts.length > 2) {
      const sNavigationPath = aPathParts[aPathParts.length - 1];
      aPathParts.splice(-1, 1);
      const oNavigationRestrictions = getNavigationRestrictions(converterContext, sNavigationPath);
      const oNavigationFilterRestrictions = oNavigationRestrictions && oNavigationRestrictions.FilterRestrictions;
      oRet.RequiredProperties = oRet.RequiredProperties.concat(getFilterRestrictions(oNavigationFilterRestrictions, "RequiredProperties") || []);
      oRet.NonFilterableProperties = oRet.NonFilterableProperties.concat(getFilterRestrictions(oNavigationFilterRestrictions, "NonFilterableProperties") || []);
    }
    const aRequiredProps = oRet.RequiredProperties;
    const aNonFilterableProps = oRet.NonFilterableProperties;
    const aFetchedProperties = [];

    // process the fields to add necessary properties
    propertyInfoFields.forEach(function (propertyInfoField) {
      const sPropertyPath = propertyInfoField.conditionPath.replace(/[+*]/g, "");
      if (!aNonFilterableProps.includes(sPropertyPath)) {
        const oPropertyInfo = assignDataTypeToPropertyInfo(propertyInfoField, converterContext, aRequiredProps, aTypeConfig);
        aFetchedProperties.push(oPropertyInfo);
      }
    });

    //add edit
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const isHiddenDraftEnabled = converterContext.getManifestWrapper().getSapFeManifestConfiguration()?.app?.hideDraft?.enabled;
    if (ModelHelper.isObjectPathDraftSupported(dataModelObjectPath)) {
      if (showDraftEditStatus(converterContext) && !isHiddenDraftEnabled) {
        aFetchedProperties.push(getEditStateFilterPropertyInfo());
      }
    }
    // add search
    const searchRestrictions = getSearchRestrictions(converterContext);
    const hideBasicSearch = Boolean(searchRestrictions && !searchRestrictions.Searchable);
    if (sEntitySetPath && hideBasicSearch !== true) {
      if (!searchRestrictions || searchRestrictions?.Searchable) {
        aFetchedProperties.push(getSearchFilterPropertyInfo());
      }
    }
    return aFetchedProperties;
  };
  _exports.processSelectionFields = processSelectionFields;
  const showDraftEditStatus = function (converterContext) {
    const navigationRestrictions = getNavigationRestrictions(converterContext, "DraftAdministrativeData");
    return navigationRestrictions?.FilterRestrictions?.Filterable === false ? false : true;
  };
  _exports.showDraftEditStatus = showDraftEditStatus;
  const insertCustomManifestElements = function (filterFields, entityType, converterContext, annotationPath) {
    const manifestFilterFields = getManifestFilterFields(entityType, converterContext, annotationPath);
    _getMissingLabelForManifestFilterFields(filterFields, manifestFilterFields);
    return insertCustomElements(filterFields, manifestFilterFields, {
      availability: OverrideType.overwrite,
      label: OverrideType.overwrite,
      type: OverrideType.overwrite,
      position: OverrideType.overwrite,
      slotName: OverrideType.overwrite,
      documentRefText: OverrideType.overwrite,
      template: OverrideType.overwrite,
      settings: OverrideType.overwrite,
      visualFilter: OverrideType.overwrite,
      required: OverrideType.overwrite
    });
  };
  _exports.insertCustomManifestElements = insertCustomManifestElements;
  const sortPropertyInfosByGroupLabel = propertyInfos => {
    propertyInfos.sort(function (a, b) {
      const aGroupLabelIsSet = a.groupLabel !== undefined && a.groupLabel !== null;
      const bGroupLabelIsSet = b.groupLabel !== undefined && b.groupLabel !== null;
      if (!aGroupLabelIsSet && !bGroupLabelIsSet) {
        return 0;
      }
      if (aGroupLabelIsSet && !bGroupLabelIsSet) {
        return -1;
      }
      if (!aGroupLabelIsSet && bGroupLabelIsSet) {
        return 1;
      }
      return a.groupLabel.localeCompare(b.groupLabel);
    });
  };

  /**
   * Retrieve the configuration for the selection fields that will be used within the filter bar
   * This configuration takes into account the annotation and the selection variants.
   * @param converterContext
   * @param lrTables
   * @param annotationPath
   * @param [includeHidden]
   * @param [lineItemTerm]
   * @returns An array of selection fields
   */
  _exports.sortPropertyInfosByGroupLabel = sortPropertyInfosByGroupLabel;
  const getSelectionFields = function (converterContext) {
    let lrTables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let annotationPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    let includeHidden = arguments.length > 3 ? arguments[3] : undefined;
    let lineItemTerm = arguments.length > 4 ? arguments[4] : undefined;
    const oAnnotatedSelectionFieldData = getAnnotatedSelectionFieldData(converterContext, lrTables, annotationPath, includeHidden, lineItemTerm);
    const parameterFields = _getParameterFields(converterContext);
    let propertyInfoFields = oAnnotatedSelectionFieldData.propertyInfoFields;
    const entityType = oAnnotatedSelectionFieldData.entityType;
    propertyInfoFields = parameterFields.concat(propertyInfoFields);
    propertyInfoFields = insertCustomManifestElements(propertyInfoFields, entityType, converterContext, annotationPath);
    const aFetchedProperties = processSelectionFields(propertyInfoFields, converterContext, oAnnotatedSelectionFieldData.defaultFilterFields);
    sortPropertyInfosByGroupLabel(aFetchedProperties);
    let sFetchProperties = JSON.stringify(aFetchedProperties);
    sFetchProperties = sFetchProperties.replace(/\{/g, "\\{");
    sFetchProperties = sFetchProperties.replace(/\}/g, "\\}");
    const sPropertyInfo = sFetchProperties;
    // end of propertyFields processing

    // to populate selection fields
    let propSelectionFields = JSON.parse(JSON.stringify(oAnnotatedSelectionFieldData.propertyInfoFields));
    propSelectionFields = parameterFields.concat(propSelectionFields);
    // create a map of properties to be used in selection variants
    const excludedFilterProperties = oAnnotatedSelectionFieldData.excludedFilterProperties;
    const filterFacets = entityType?.annotations?.UI?.FilterFacets;
    let filterFacetMap = {};
    const aFieldGroups = converterContext.getAnnotationsByTerm("UI", "com.sap.vocabularies.UI.v1.FieldGroup");
    if (filterFacets === undefined || filterFacets.length < 0) {
      for (const i in aFieldGroups) {
        filterFacetMap = {
          ...filterFacetMap,
          ...getFieldGroupFilterGroups(aFieldGroups[i])
        };
      }
    } else {
      filterFacetMap = filterFacets.reduce((previousValue, filterFacet) => {
        for (let i = 0; i < filterFacet?.Target?.$target?.Data?.length; i++) {
          previousValue[filterFacet?.Target?.$target?.Data[i]?.Value?.path] = {
            group: filterFacet?.ID?.toString(),
            groupLabel: filterFacet?.Label?.toString()
          };
        }
        return previousValue;
      }, {});
    }

    // create a map of all potential filter fields based on...
    const filterFields = oAnnotatedSelectionFieldData.filterFields;

    // finally create final list of filter fields by adding the SelectionFields first (order matters)...
    const allFilters = propSelectionFields

    // ...and adding remaining filter fields, that are not used in a SelectionVariant (order doesn't matter)
    .concat(Object.keys(filterFields).filter(propertyPath => !excludedFilterProperties.has(propertyPath)).map(propertyPath => {
      return Object.assign(filterFields[propertyPath], filterFacetMap[propertyPath]);
    }));
    const selectionFields = insertCustomManifestElements(allFilters, entityType, converterContext, annotationPath);

    // Add caseSensitive property to all selection fields.
    const isCaseSensitive = isFilteringCaseSensitive(converterContext);
    selectionFields.forEach(filterField => {
      filterField.caseSensitive = isCaseSensitive;
    });
    return {
      selectionFields,
      sPropertyInfo
    };
  };

  /**
   * Determines whether the filter bar inside a value help dialog should be expanded. This is true if one of the following conditions hold:
   * (1) a filter property is mandatory,
   * (2) no search field exists (entity isn't search enabled),
   * (3) when the data isn't loaded by default (annotation FetchValues = 2).
   * @param converterContext The converter context
   * @param filterRestrictionsAnnotation The FilterRestriction annotation
   * @param valueList The ValueList annotation
   * @returns The value for expandFilterFields
   */
  _exports.getSelectionFields = getSelectionFields;
  const getExpandFilterFields = function (converterContext, filterRestrictionsAnnotation, valueList) {
    const requiredProperties = getFilterRestrictions(filterRestrictionsAnnotation, "RequiredProperties");
    const searchRestrictions = getSearchRestrictions(converterContext);
    const hideBasicSearch = Boolean(searchRestrictions && !searchRestrictions.Searchable);
    if (requiredProperties.length > 0 || hideBasicSearch || valueList?.FetchValues === 2) {
      return true;
    }
    return false;
  };
  _exports.getExpandFilterFields = getExpandFilterFields;
  return _exports;
}, false);
//# sourceMappingURL=FilterBar-dbg.js.map

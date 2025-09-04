/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/DataFieldHelper", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/EntitySetHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/formatters/TableFormatter"], function (BindingToolkit, ManifestSettings, DataField, Aggregation, ConfigurableObject, DataFieldHelper, IssueManager, Key, BindingHelper, ModelHelper, StableIdHelper, TypeGuards, DataModelPathHelper, DisplayModeFormatter, EntitySetHelper, FieldControlHelper, PropertyHelper, UIFormatters, tableFormatters) {
  "use strict";

  var _exports = {};
  var isMultiValueField = UIFormatters.isMultiValueField;
  var isTimezone = PropertyHelper.isTimezone;
  var getStaticUnitOrCurrency = PropertyHelper.getStaticUnitOrCurrency;
  var getStaticTimezone = PropertyHelper.getStaticTimezone;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTimezoneProperty = PropertyHelper.getAssociatedTimezoneProperty;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedTextProperty = PropertyHelper.getAssociatedTextProperty;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var isStaticallyMandatory = FieldControlHelper.isStaticallyMandatory;
  var hasFieldControlNotMandatory = FieldControlHelper.hasFieldControlNotMandatory;
  var getRestrictionsOnProperties = EntitySetHelper.getRestrictionsOnProperties;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var getContextPropertyRestriction = DataModelPathHelper.getContextPropertyRestriction;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isTypeDefinition = TypeGuards.isTypeDefinition;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var replaceSpecialChars = StableIdHelper.replaceSpecialChars;
  var UI = BindingHelper.UI;
  var KeyHelper = Key.KeyHelper;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var AggregationHelper = Aggregation.AggregationHelper;
  var isRatingVisualizationFromDataFieldDefault = DataField.isRatingVisualizationFromDataFieldDefault;
  var isDataPointFromDataFieldDefault = DataField.isDataPointFromDataFieldDefault;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataField = DataField.isDataField;
  var hasFieldGroupTarget = DataField.hasFieldGroupTarget;
  var hasDataPointTarget = DataField.hasDataPointTarget;
  var getTargetValueOnDataPoint = DataField.getTargetValueOnDataPoint;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  var getDataFieldDataType = DataField.getDataFieldDataType;
  var collectRelatedPropertiesRecursively = DataField.collectRelatedPropertiesRecursively;
  var collectRelatedProperties = DataField.collectRelatedProperties;
  var TemplateType = ManifestSettings.TemplateType;
  var Importance = ManifestSettings.Importance;
  var HorizontalAlign = ManifestSettings.HorizontalAlign;
  var CreationMode = ManifestSettings.CreationMode;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // Custom Column from Manifest
  // Slot Column from Building Block
  // Properties all ColumnTypes have:
  // Properties on Custom Columns and Slot Columns
  // Properties derived from Manifest to override Annotation configurations
  // Properties for Annotation Columns
  let ColumnType = /*#__PURE__*/function (ColumnType) {
    ColumnType["Default"] = "Default";
    // Default Type (Custom Column)
    ColumnType["Annotation"] = "Annotation";
    ColumnType["Slot"] = "Slot";
    ColumnType["Computed"] = "Computed";
    return ColumnType;
  }({});
  /**
   * Returns an array of all columns, annotation-based as well as manifest-based.
   * They are sorted and some properties can be overwritten via the manifest (check out the keys that can be overwritten).
   * @param lineItemAnnotation Collection of data fields for representation in a table or list
   * @param tableType The type of the table
   * @param visualizationPath
   * @param converterContext
   * @returns Returns all table columns that should be available, regardless of templating or personalization or their origin
   */
  _exports.ColumnType = ColumnType;
  function getTableColumns(lineItemAnnotation, tableType, visualizationPath, converterContext) {
    const annotationColumns = getColumnsFromAnnotations(lineItemAnnotation, tableType, visualizationPath, converterContext);
    const manifestColumns = getColumnsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).columns ?? {}, annotationColumns, converterContext, converterContext.getAnnotationEntityType(lineItemAnnotation));
    const tableColumns = insertCustomElements(annotationColumns, manifestColumns, {
      width: OverrideType.overwrite,
      widthIncludingColumnHeader: OverrideType.overwrite,
      importance: OverrideType.overwrite,
      horizontalAlign: OverrideType.overwrite,
      availability: OverrideType.overwrite,
      isNavigable: OverrideType.overwrite,
      settings: OverrideType.overwrite,
      formatOptions: OverrideType.overwrite,
      exportSettings: OverrideType.overwrite
    });
    return addComputedColumns(tableColumns, tableType, visualizationPath, converterContext);
  }
  _exports.getTableColumns = getTableColumns;
  function findColumnByPath(path, tableColumns) {
    return tableColumns.find(column => {
      const annotationColumn = column;
      return annotationColumn.propertyInfos === undefined && annotationColumn.relativePath === path;
    });
  }

  /**
   * Sets the 'unit', 'textArrangement', 'timezone' and 'exportsettings' properties in columns when necessary.
   * @param converterContext The instance of the converter context
   * @param tableColumns The columns to be updated
   */
  _exports.findColumnByPath = findColumnByPath;
  function updateLinkedProperties(converterContext, tableColumns) {
    const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
    tableColumns.forEach(oColumn => {
      const tableColumn = oColumn;
      if (tableColumn.propertyInfos === undefined && tableColumn.relativePath) {
        const propertyDataModelObjectPath = enhanceDataModelPath(dataModelObjectPath, tableColumn.relativePath);
        const property = propertyDataModelObjectPath.targetObject;
        if (property) {
          addCurrencyOrUoMToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn);
          const timezoneProperty = getAssociatedTimezoneProperty(property);
          const timezone = property?.annotations?.Common?.Timezone;
          if (timezoneProperty) {
            const oTimezoneColumn = findColumnByPath(timezoneProperty.name, tableColumns);
            tableColumn.timezone = oTimezoneColumn?.name;
          } else if (timezone) {
            tableColumn.timezoneText = timezone.toString();
          }
          addTextArrangentInfoToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn);
        }
      }
    });
  }

  /**
   * Adds the "unit" property into the columns when neccesary for columns with unit of measure and currencies.
   * @param property The property referenced on the column
   * @param propertyDataModelObjectPath The property DataModelObjectPath.
   * @param tableColumns The list of columns displayed on the table
   * @param tableColumn The table column which adds the currency or unit
   */
  _exports.updateLinkedProperties = updateLinkedProperties;
  function addCurrencyOrUoMToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn) {
    const currencyOrUoMProperty = getAssociatedCurrencyPropertyPath(property) || getAssociatedUnitPropertyPath(property);
    if (currencyOrUoMProperty) {
      const currencyOrUoMPropertyDataModelObjectPath = enhanceDataModelPath(propertyDataModelObjectPath, currencyOrUoMProperty);
      const currencyOrUoMRelativePath = getContextRelativeTargetObjectPath(currencyOrUoMPropertyDataModelObjectPath);
      if (currencyOrUoMRelativePath) {
        const unitColumn = findColumnByPath(currencyOrUoMRelativePath, tableColumns);
        tableColumn.unit = unitColumn?.name;
      }
    } else {
      const unit = property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit;
      if (unit) {
        tableColumn.unitText = `${unit}`;
      }
    }
  }

  /**
   * Add the "textArrangement" object to columns when necessary for columns containing text, such as descriptions.
   * @param property The property referenced by the column
   * @param propertyDataModelObjectPath The property DataModelObjectPath.
   * @param tableColumns The list of columns displayed on the table
   * @param tableColumn The table column which adds the text
   */
  function addTextArrangentInfoToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn) {
    const displayMode = getDisplayMode(property),
      textPropertyPath = getAssociatedTextPropertyPath(property);
    if (textPropertyPath && displayMode !== "Value") {
      const textPropertyDataModelObjectPath = enhanceDataModelPath(propertyDataModelObjectPath, textPropertyPath);
      const textRelativePath = getContextRelativeTargetObjectPath(textPropertyDataModelObjectPath);
      if (textRelativePath) {
        const textColumn = findColumnByPath(textRelativePath, tableColumns);
        if (textColumn && textColumn.name !== tableColumn.name) {
          tableColumn.textArrangement = {
            textProperty: textColumn.name,
            mode: displayMode
          };
          // If text properties are used but hidden, we must include them to the export as there are used in the paste
          if (!textColumn.exportSettings) {
            textColumn.exportSettings = {
              type: "String"
            };
          }
        }
      }
    }
  }

  /**
   * Retrieve the columns from the entityType.
   * @param columnsToBeCreated The columns to be created.
   * @param entityType The target entity type.
   * @param annotationColumns The array of columns created based on LineItem annotations.
   * @param converterContext The converter context.
   * @param tableType The table type.
   * @param tableCreationMode The creation mode of the table.
   * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as description on a text arrangement annotation.
   * @param restrictionsOnProperties The existing restrictions on properties
   * @returns The column from the entityType
   */
  const getColumnsFromEntityType = function (columnsToBeCreated, entityType, annotationColumns, converterContext, tableType, tableCreationMode, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties) {
    if (annotationColumns === undefined) {
      annotationColumns = [];
    }
    let propertiesNotToBeConsidered = [];
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    const groupableProperties = aggregationHelper.getGroupableProperties();
    //For Analytical table, we exclude all properties that are not groupable and used as Text in a groupable Property.
    if (tableType === "AnalyticalTable" && aggregationHelper.isAnalyticsSupported() && groupableProperties) {
      propertiesNotToBeConsidered = groupableProperties.map(property => property.$target).filter(target => target !== undefined).map(target => getAssociatedTextProperty(target)).filter(textProp => textProp && !aggregationHelper.isPropertyGroupable(textProp)).map(prop => prop?.name).filter(name => name !== undefined);
    }
    entityType.entityProperties.forEach(property => {
      // Catch already existing columns - which were added before by LineItem Annotations
      const exists = annotationColumns.some(column => {
        return column.name === property.name;
      });
      // if target type exists, it is a complex property and should be ignored
      if (!property.targetType && !exists && !propertiesNotToBeConsidered.includes(property.name)) {
        const relatedPropertiesInfo = collectRelatedProperties(property.name, property, converterContext, true, tableType);
        const relatedPropertyNames = Object.keys(relatedPropertiesInfo.properties);
        const additionalPropertyNames = Object.keys(relatedPropertiesInfo.additionalProperties);
        // Include the text properties and their corresponding text arrangement
        relatedPropertyNames.forEach(name => {
          addPropertyToDisplayModeOfDescriptionPropertiesMap(displayModeOfDescriptionPropertiesMap, relatedPropertiesInfo, name);
        });
        const columnInfo = getColumnDefinitionFromProperty(property, converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName), property.name, true, true, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode, relatedPropertiesInfo);
        if (relatedPropertyNames.length > 0) {
          columnInfo.propertyInfos = relatedPropertyNames;
          if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
            columnInfo.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
          }
          // Collect information of related columns to be created.
          relatedPropertyNames.forEach(name => {
            columnsToBeCreated[name] = relatedPropertiesInfo.properties[name].annotationProperty;
          });
        }
        // update Property Label when it's referenced only once in a column, new label will be the label of the column
        updatePropertyLabel(annotationColumns, columnsToBeCreated, columnInfo);
        if (additionalPropertyNames.length > 0) {
          columnInfo.additionalPropertyInfos = additionalPropertyNames;
          // Create columns for additional properties identified for ALP use case.
          additionalPropertyNames.forEach(additionalPropertyName => {
            // Intentional overwrite as we require only one new PropertyInfo for a related Property.
            columnsToBeCreated[additionalPropertyName] = relatedPropertiesInfo.additionalProperties[additionalPropertyName];
          });
        }
        annotationColumns.push(columnInfo);
      }
      // In case a property has defined a #TextOnly text arrangement that points to a text property (and not a 'hard coded text') don't only create the complex property with the text property as a child property,
      // but also the property itself as it can be used as within the sortConditions or on custom columns.
      // This step must be valid also from the columns added via LineItems or from a column available on the p13n.
      if (getDisplayMode(property) === "Description") {
        restrictionsOnProperties?.nonSortableProperties.push(property.name);
        if (isPathAnnotationExpression(property?.annotations?.Common?.Text)) {
          annotationColumns.push(getColumnDefinitionFromProperty(property, converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName), property.name, false, false, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode));
        }
      }
    });
    // Create a propertyInfo for each related property.
    const relatedColumns = _createRelatedColumns(columnsToBeCreated, annotationColumns, converterContext, entityType, displayModeOfDescriptionPropertiesMap, tableCreationMode, restrictionsOnProperties);
    return annotationColumns.concat(relatedColumns);
  };

  /**
   * Create a column definition from a property.
   * @param property Entity type property for which the column is created
   * @param fullPropertyPath The full path to the target property
   * @param relativePath The relative path to the target property based on the context
   * @param useDataFieldPrefix Should be prefixed with "DataField::", else it will be prefixed with "Property::"
   * @param availableForAdaptation Decides whether the column should be available for adaptation
   * @param aggregationHelper The aggregationHelper for the entity
   * @param converterContext The converter context
   * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as description on a text arrangement annotation
   * @param restrictionsOnProperties The existing restrictions on properties
   * @param tableCreationMode The creation mode of the table
   * @param relatedPropertiesInfo The properties identified so far for the column
   * @param relativePathForMultiValue The MDC path used for the 1:n property to allow filtering from MDC
   * @returns The annotation column definition
   */
  _exports.getColumnsFromEntityType = getColumnsFromEntityType;
  const getColumnDefinitionFromProperty = function (property, fullPropertyPath, relativePath, useDataFieldPrefix, availableForAdaptation, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode, relatedPropertiesInfo, relativePathForMultiValue) {
    const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, property);
    const isHidden = isReferencePropertyStaticallyHidden(property);
    const groupPath = property.name ? _sliceAtSlash(property.name, true, false) : undefined;
    const isGroup = groupPath != property.name;
    const label = getLabel(property, isGroup);
    const dataType = getDataFieldDataType(property);
    const propertyTypeConfig = getTypeConfig(property, dataType);
    const isAPropertyFromTextOnlyAnnotation = displayModeOfDescriptionPropertiesMap[relativePath] === "Description";
    const sortable = (!isHidden || isAPropertyFromTextOnlyAnnotation) && !restrictionsOnProperties?.nonSortableProperties.includes(relativePath);
    const filterable = !isAPropertyFromTextOnlyAnnotation && !restrictionsOnProperties?.nonFilterableProperties.includes(relativePath);
    const typeConfig = {
      className: property.type || dataType,
      formatOptions: propertyTypeConfig.formatOptions,
      constraints: propertyTypeConfig.constraints
    };
    let exportSettings = null;
    if (_isExportableColumn(property)) {
      exportSettings = createColumnExportSettings(property, relatedPropertiesInfo);
    }
    const availability = !isHidden && (availableForAdaptation || displayModeOfDescriptionPropertiesMap[relativePath]) ? "Adaptation" : "Hidden";
    const collectedNavigationPropertyLabels = _getCollectedNavigationPropertyLabels(relativePath, converterContext);
    if (relativePathForMultiValue) {
      relativePath = relativePathForMultiValue;
    }
    const name = useDataFieldPrefix ? relativePath : `Property::${relativePath}`;
    const key = (useDataFieldPrefix ? "DataField::" : "Property::") + replaceSpecialChars(relativePath);
    const column = {
      key: key,
      type: ColumnType.Annotation,
      dataType: dataType ?? property.type,
      label: label ?? property.name,
      groupLabel: isGroup ? getLabel(property) : undefined,
      group: isGroup ? groupPath : undefined,
      annotationPath: fullPropertyPath,
      semanticObjectPath: semanticObjectAnnotationPath,
      availability: availability,
      name: name,
      relativePath: relativePath,
      sortable: sortable,
      filterable: filterable,
      isGroupable: aggregationHelper.isAnalyticsSupported() ? !!aggregationHelper.isPropertyGroupable(property) : sortable,
      isKey: property.isKey,
      exportSettings: exportSettings,
      caseSensitive: isFilteringCaseSensitive(converterContext),
      typeConfig: typeConfig,
      importance: getImportance(converterContext, property.annotations?.UI?.DataFieldDefault),
      required: isRequiredColumn(converterContext, property, tableCreationMode),
      additionalLabels: collectedNavigationPropertyLabels
    };
    _addToolTip(property, column);
    _setExportSettingsForDataPoint(property, column);
    if (aggregationHelper.isAnalyticsSupported() && ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath()) && (relativePath === "HasActiveEntity" || relativePath === "HasDraftEntity" || relativePath === "IsActiveEntity")) {
      // In case of analytical table on a draft-enabled entity, we always consider the HasDraftEntity, HasActiveEntity and IsActiveEntity properties as
      // technically groupable, as we need to load them for our internal logic.
      column.extension = {
        technicallyAggregatable: false,
        technicallyGroupable: true
      };
    }
    return column;
  };

  /**
   * Create the export settings for a given column.
   * @param column The given column from a line item as a data field or a property from the entity type
   * @param relatedPropertiesInfo The related properties linked to the column (named also complex property)
   * @returns The export settings in a the given column
   */
  const createColumnExportSettings = function (column, relatedPropertiesInfo) {
    let unitProperty, timezoneProperty, unitText, timezoneText, utc, isATimezone, currencyProperty, scale;
    const relatedPropertyNames = relatedPropertiesInfo ? Object.keys(relatedPropertiesInfo.properties) : [];
    if (relatedPropertiesInfo && relatedPropertyNames?.length === 1) {
      // Create the export settings of a column based on the related (child) property in case there is only one.
      // This is required when we have a text only annotation to compute the export settings from the text instead of the value
      column = relatedPropertiesInfo.properties[relatedPropertyNames[0]].annotationProperty;
    }
    const dataType = getDataFieldDataType(column);
    if (isProperty(column)) {
      unitProperty = getAssociatedUnitProperty(column);
      currencyProperty = getAssociatedCurrencyProperty(column);
      timezoneProperty = getAssociatedTimezoneProperty(column);
      unitText = getStaticUnitOrCurrency(column);
      timezoneText = getStaticTimezone(column);
      isATimezone = isTimezone(column);
      scale = column.scale;
    }
    unitProperty = relatedPropertiesInfo?.exportSettings?.unitProperty ?? unitProperty?.name ?? currencyProperty?.name;
    timezoneProperty = relatedPropertiesInfo?.exportSettings?.timezoneProperty ?? timezoneProperty?.name;
    scale = relatedPropertiesInfo?.exportSettings?.scale ?? scale;
    const exportType = getExportDataType(dataType, isATimezone, !!currencyProperty, relatedPropertiesInfo?.exportSettings);
    if (timezoneProperty || exportType === "DateTime" && !timezoneText) {
      utc = false;
    }
    const exportSettings = {
      type: exportType,
      inputFormat: getDateInputFormat(dataType),
      delimiter: getDelimiter(dataType),
      scale: scale,
      unitProperty: unitProperty,
      unit: relatedPropertiesInfo?.exportSettings.unit ?? unitText,
      timezoneProperty: timezoneProperty,
      timezone: relatedPropertiesInfo?.exportSettings.timezone ?? timezoneText?.toString(),
      template: relatedPropertiesInfo?.exportSettings.template,
      //only in case of complex properties, wrap the cell content	on the excel exported file
      wrap: relatedPropertiesInfo?.exportSettings.wrap,
      utc: utc
    };
    if (exportSettings.unitProperty || exportSettings.unit) {
      exportSettings.autoScale = true;
    }
    return removeUndefinedFromExportSettings(exportSettings);
  };

  /**
   * Gets the export format template for columns with dates.
   * @param dataType The data type of the column
   * @returns The inputFormat
   */
  const getDateInputFormat = function (dataType) {
    return dataType === "Edm.Date" ? "YYYY-MM-DD" : undefined;
  };

  /**
   * Gets the delimiter in numeric columns.
   * The delimiter is used to display thousands separator in numeric columns.
   * @param dataType The data type of the column
   * @returns True to display thousands separator in numeric columns
   */
  const getDelimiter = function (dataType) {
    return dataType === "Edm.Int64" ? true : undefined;
  };

  /**
   * Removes undefined values from the export settings object of a column.
   * @param exportSettings The export settings configurations for a column
   * @returns The export settings configurations without undefined values
   */
  const removeUndefinedFromExportSettings = function (exportSettings) {
    //Remove undefined settings from exportSetting object
    for (const setting in exportSettings) {
      if (exportSettings[setting] === undefined) {
        delete exportSettings[setting];
      }
    }
    return exportSettings;
  };

  /**
   * Update property label in case it's only referenced in one column. The label of the column must be used instead of the property label.
   * This update also is applied for the tooltip as it is based on the column's label.
   * @param annotationColumns The array of columns created based on LineItem annotations.
   * @param columnsToBeCreated The columns to be created
   * @param columnInfo The column definition
   * @param columnName The name of the column
   */
  function updatePropertyLabel(annotationColumns, columnsToBeCreated, columnInfo, columnName) {
    const linkedAnnotationColumns = annotationColumns.filter(col => col.propertyInfos?.includes(columnInfo.relativePath) || columnName && col.propertyInfos?.includes(columnName));
    if (linkedAnnotationColumns?.length === 1 && (columnsToBeCreated[columnInfo.relativePath] || columnName && columnsToBeCreated[columnName]) && linkedAnnotationColumns[0].propertyInfos?.length === 1) {
      columnInfo.label = linkedAnnotationColumns[0].label;
      columnInfo.tooltip = linkedAnnotationColumns[0].tooltip;
    }
  }

  /**
   * Returns Boolean true for exportable columns, false for non exportable columns.
   * @param source The dataField or property to be evaluated
   * @returns True for exportable column, false for non exportable column
   */
  function _isExportableColumn(source) {
    let propertyType, property;
    const dataFieldDefaultProperty = source.annotations.UI?.DataFieldDefault;
    if (isProperty(source)) {
      if (isReferencePropertyStaticallyHidden(source)) {
        return false;
      }
      propertyType = dataFieldDefaultProperty?.$Type;
    } else if (isReferencePropertyStaticallyHidden(source)) {
      return false;
    } else {
      property = source;
      propertyType = property.$Type;
      if (propertyType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && property.Target?.$target?.$Type) {
        //For Chart
        propertyType = property.Target?.$target?.$Type;
        return propertyType !== undefined && !"com.sap.vocabularies.UI.v1.ChartDefinitionType".includes(propertyType);
      } else if (property.Value?.$target?.annotations?.Core?.MediaType?.term === "Org.OData.Core.V1.MediaType" && property.Value?.$target?.annotations?.Core?.isURL !== true) {
        //For Stream
        return false;
      }
    }
    return propertyType ? !["com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldForActionGroup"].includes(propertyType) : true;
  }

  /**
   * Returns Boolean true for valid columns, false for invalid columns.
   * @param dataField Different DataField types defined in the annotations
   * @returns True for valid columns, false for invalid columns
   */
  const _isValidColumn = function (dataField) {
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        return !!dataField.Inline;
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        return true;
      default:
        // Todo: Replace with proper Log statement once available
        //  throw new Error("Unhandled DataField Abstract type: " + dataField.$Type);
        return false;
    }
  };

  /**
   * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
   *
   * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
   * @param dataFieldModelPath The metapath referring to the annotation that is evaluated by SAP Fiori elements.
   * @returns An expression that you can bind to the UI.
   */
  const _getVisibleExpression = function (dataFieldModelPath) {
    const targetObject = dataFieldModelPath.targetObject;
    let propertyValue;
    if (targetObject) {
      switch (targetObject.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        case "com.sap.vocabularies.UI.v1.DataPointType":
          propertyValue = targetObject.Value.$target;
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          // if it is a DataFieldForAnnotation pointing to a DataPoint we look at the dataPoint's value
          if (targetObject?.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
            propertyValue = targetObject.Target.$target?.Value.$target;
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        default:
          propertyValue = undefined;
      }
    }
    const isAnalyticalGroupHeaderExpanded = /*formatOptions?.isAnalytics ? UI.IsExpanded :*/constant(false);
    const isAnalyticalLeaf = /*formatOptions?.isAnalytics ? equal(UI.NodeLevel, 0) :*/constant(false);
    // A data field is visible if:
    // - the UI.Hidden expression in the original annotation does not evaluate to 'true'
    // - the UI.Hidden expression in the target property does not evaluate to 'true'
    // - in case of Analytics it's not visible for an expanded GroupHeader
    return and(...[not(equal(getExpressionFromAnnotation(targetObject?.annotations?.UI?.Hidden), true)), ifElse(!!propertyValue, propertyValue && not(equal(getExpressionFromAnnotation(propertyValue.annotations?.UI?.Hidden), true)), true), or(not(isAnalyticalGroupHeaderExpanded), isAnalyticalLeaf)]);
  };

  /**
   * Returns hidden binding expressions for a field group.
   * @param dataFieldGroup DataField defined in the annotations
   * @returns Compile binding of field group expressions.
   */
  const _getFieldGroupHiddenExpressions = function (dataFieldGroup) {
    const fieldGroupHiddenExpressions = [];
    if (dataFieldGroup.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataFieldGroup.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
      if (dataFieldGroup?.annotations?.UI?.Hidden) {
        return compileExpression(not(equal(getExpressionFromAnnotation(dataFieldGroup.annotations.UI.Hidden), true)));
      } else {
        dataFieldGroup.Target.$target.Data?.forEach(innerDataField => {
          fieldGroupHiddenExpressions.push(_getVisibleExpression({
            targetObject: innerDataField
          }));
        });
        return compileExpression(ifElse(or(...fieldGroupHiddenExpressions), constant(true), constant(false)));
      }
    } else {
      return undefined;
    }
  };

  /**
   * Returns the label for the property and dataField.
   * @param [property] Property, DataField or Navigation Property defined in the annotations
   * @param isGroup
   * @returns Label of the property or DataField
   */
  const getLabel = function (property) {
    let isGroup = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (!property) {
      return undefined;
    }
    if (isProperty(property) || isNavigationProperty(property)) {
      const dataFieldDefault = property.annotations?.UI?.DataFieldDefault;
      if (dataFieldDefault && !dataFieldDefault.qualifier && dataFieldDefault.Label) {
        return dataFieldDefault.Label?.toString();
      }
      return property.annotations.Common?.Label?.toString() ?? property.name;
    } else if (isDataFieldTypes(property)) {
      if (!!isGroup && property.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation") {
        return property?.Label?.toString();
      }
      return property?.Label?.toString() ?? compileExpression(getExpressionFromAnnotation(property.Value?.$target?.annotations?.Common?.Label, [], property.Value?.$target?.name));
    } else if (property.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      return property.Label?.toString() ?? compileExpression(getExpressionFromAnnotation(property.Target?.$target?.Value?.$target?.annotations?.Common?.Label?.valueOf()));
    } else {
      return property.Label?.toString();
    }
  };
  const _getTooltip = function (source) {
    if (!source) {
      return undefined;
    }
    if (isProperty(source) || source.annotations?.Common?.QuickInfo) {
      return source.annotations?.Common?.QuickInfo ? compileExpression(getExpressionFromAnnotation(source.annotations.Common.QuickInfo)) : undefined;
    } else if (isDataFieldTypes(source)) {
      return source.Value?.$target?.annotations?.Common?.QuickInfo ? compileExpression(getExpressionFromAnnotation(source.Value.$target.annotations.Common.QuickInfo)) : undefined;
    } else if (source.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      const datapointTarget = source.Target?.$target;
      return datapointTarget?.Value?.$target?.annotations?.Common?.QuickInfo ? compileExpression(getExpressionFromAnnotation(datapointTarget.Value.$target.annotations.Common.QuickInfo)) : undefined;
    } else {
      return undefined;
    }
  };
  function getRowStatusVisibility(colName, isSemanticKeyInFieldGroup) {
    return formatResult([pathInModel(`semanticKeyHasDraftIndicator`, "internal"), pathInModel(`filteredMessages`, "internal"), colName, isSemanticKeyInFieldGroup], tableFormatters.getErrorStatusTextVisibilityFormatter);
  }

  /**
   * Creates a PropertyInfo for each identified property consumed by a LineItem.
   * @param columnsToBeCreated Identified properties.
   * @param existingColumns The list of columns created for LineItems and Properties of entityType.
   * @param converterContext The converter context.
   * @param entityType The entity type for the LineItem
   * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as text on a text arrangement annotation.
   * @param tableCreationMode The creation mode of the table
   * @param restrictionsOnProperties The existing restrictions on properties
   * @returns The array of columns created.
   */
  _exports.getRowStatusVisibility = getRowStatusVisibility;
  const _createRelatedColumns = function (columnsToBeCreated, existingColumns, converterContext, entityType, displayModeOfDescriptionPropertiesMap, tableCreationMode, restrictionsOnProperties) {
    const relatedColumns = [];
    const relatedPropertyNameMap = {};
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    Object.keys(columnsToBeCreated).forEach(name => {
      const property = columnsToBeCreated[name],
        annotationPath = converterContext.getAbsoluteAnnotationPath(name),
        // Check whether the related column already exists.
        relatedColumn = existingColumns.find(column => column.name === name);
      const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
      const propertyObjectPath = enhanceDataModelPath(dataModelObjectPath, name);
      if (isMultiValueField(propertyObjectPath)) {
        const newNameRelativeTargetPath = getContextRelativeTargetObjectPath(propertyObjectPath, false, true);
        const column = getColumnDefinitionFromProperty(property, annotationPath, name, true, false, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode, undefined, newNameRelativeTargetPath);
        computeHiddenOnRelatedColumns(existingColumns, name, column);
        updatePropertyLabel(existingColumns, columnsToBeCreated, column, name);
        relatedColumns.push(column);
        relatedPropertyNameMap[name] = newNameRelativeTargetPath ?? name;
      } else if (relatedColumn === undefined) {
        // Case 1: Key contains DataField prefix to ensure all property columns have the same key format.
        // New created property column is set to hidden.
        const column = getColumnDefinitionFromProperty(property, annotationPath, name, true, false, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode);
        computeHiddenOnRelatedColumns(existingColumns, name, column);
        updatePropertyLabel(existingColumns, columnsToBeCreated, column);
        relatedColumns.push(column);
      } else if (relatedColumn.annotationPath !== annotationPath || relatedColumn.propertyInfos) {
        // Case 2: The existing column points to a LineItem (or)
        // Case 3: This is a self reference from an existing column
        const newName = `Property::${name}`;
        // Checking whether the related property column has already been created in a previous iteration.
        if (!existingColumns.some(column => column.name === newName)) {
          // Create a new property column with 'Property::' prefix,
          // Set it to hidden as it is only consumed by Complex property infos.
          const column = getColumnDefinitionFromProperty(property, annotationPath, name, false, false, aggregationHelper, converterContext, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties, tableCreationMode);
          computeHiddenOnRelatedColumns(existingColumns, name, column);
          updatePropertyLabel(existingColumns, columnsToBeCreated, column);
          relatedColumns.push(column);
          relatedPropertyNameMap[name] = newName;
        } else if (existingColumns.some(column => column.name === newName) && existingColumns.some(column => column.propertyInfos?.includes(name))) {
          relatedPropertyNameMap[name] = newName;
        }
      } else if (displayModeOfDescriptionPropertiesMap[name] === "Description" && !relatedColumn.filterable && !restrictionsOnProperties?.nonFilterableProperties.includes(name)) {
        // Case 4: The column is a referenced text only property. Set it to hidden, non sortable nor groupable.
        // Case 5: The column isn't already available for filtering as it could be referenced on another column (e.g. text first).
        restrictionsOnProperties?.nonSortableProperties.push(name);
        const column = getColumnDefinitionFromProperty(property, annotationPath, name, false, false, aggregationHelper, converterContext, {}, restrictionsOnProperties, tableCreationMode);
        column.isGroupable = false;
        relatedColumns.push(column);
      }
    });
    // The property 'name' has been prefixed with 'Property::' for uniqueness.
    // Update the same in other propertyInfos[] references which point to this property.
    existingColumns.forEach(column => {
      column.propertyInfos = column.propertyInfos?.map(propertyInfo => relatedPropertyNameMap[propertyInfo] ?? propertyInfo);
      column.additionalPropertyInfos = column.additionalPropertyInfos?.map(propertyInfo => relatedPropertyNameMap[propertyInfo] ?? propertyInfo);
    });
    return relatedColumns;
  };

  /**
   * Getting the Column Name
   * If it points to a DataField with one property or DataPoint with one property, it will use the property name
   * here to be consistent with the existing flex changes.
   * @param dataField Different DataField types defined in the annotations
   * @returns The name of annotation columns
   */
  const _getAnnotationColumnName = function (dataField) {
    // This is needed as we have flexibility changes already that we have to check against
    if (isDataFieldTypes(dataField) && dataField.Value?.path) {
      return dataField.Value?.path;
    } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataField.Target?.$target?.Value?.path) {
      // This is for removing duplicate properties. For example, 'Progress' Property is removed if it is already defined as a DataPoint
      return dataField.Target?.$target?.Value.path;
    } else {
      return KeyHelper.generateKeyFromDataField(dataField);
    }
  };

  /**
   * Determines if the data field labels have to be displayed in the table.
   * @param fieldGroupName The `DataField` name being processed.
   * @param visualizationPath
   * @param converterContext
   * @returns `showDataFieldsLabel` value from the manifest
   */
  const _getShowDataFieldsLabel = function (fieldGroupName, visualizationPath, converterContext) {
    const columns = converterContext.getManifestControlConfiguration(visualizationPath)?.columns;
    const columnKeys = columns && Object.keys(columns);
    return columnKeys && !!columnKeys.find(function (key) {
      return key === fieldGroupName && columns[key].showDataFieldsLabel;
    });
  };

  /**
   * Determines the relative path of the property with respect to the root entity.
   * @param dataField The `DataField` being processed.
   * @returns The relative path
   */
  const _getRelativePath = function (dataField) {
    let relativePath = "";
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        relativePath = dataField?.Value?.path;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        relativePath = dataField?.Target?.value;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
        relativePath = KeyHelper.generateKeyFromDataField(dataField);
        break;
    }
    return relativePath;
  };
  const _sliceAtSlash = function (path, isLastSlash, isLastPart) {
    const iSlashIndex = isLastSlash ? path.lastIndexOf("/") : path.indexOf("/");
    if (iSlashIndex === -1) {
      return path;
    }
    return isLastPart ? path.substring(iSlashIndex + 1, path.length) : path.substring(0, iSlashIndex);
  };

  /**
   * Determines if the column contains a multi-value field.
   * @param dataField The DataField being processed
   * @param converterContext The converter context
   * @returns True if the DataField corresponds to a multi-value field.
   */
  const _isColumnMultiValued = function (dataField, converterContext) {
    if (isDataFieldTypes(dataField) && isPathAnnotationExpression(dataField.Value)) {
      const propertyObjectPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), dataField.Value.path);
      return isMultiValueField(propertyObjectPath);
    } else {
      return false;
    }
  };

  /**
   * Determine whether a column is sortable.
   * @param dataField The data field being processed
   * @param propertyPath The property path
   * @param nonSortableColumns Collection of non-sortable column names as per annotation
   * @param relatedPropertiesInfo The related properties linked to the column
   * @returns True if the column is sortable
   */
  const _isColumnSortable = function (dataField, propertyPath, nonSortableColumns, relatedPropertiesInfo) {
    return !nonSortableColumns.includes(propertyPath) && (
    // Column is not marked as non-sortable via annotation
    (dataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && Object.keys(relatedPropertiesInfo.properties).some(propName => {
      const isHidden = isReferencePropertyStaticallyHidden(relatedPropertiesInfo.properties[propName].annotationProperty);
      return !isHidden && !nonSortableColumns.includes(propName);
    }) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction");
  };

  /**
   * Returns whether filtering on the table is case sensitive.
   * @param converterContext The instance of the converter context
   * @returns Returns 'false' if FilterFunctions annotation supports 'tolower', else 'true'
   */
  const isFilteringCaseSensitive = function (converterContext) {
    const filterFunctions = _getFilterFunctions(converterContext);
    return ModelHelper.isFilteringCaseSensitive(undefined, filterFunctions);
  };
  _exports.isFilteringCaseSensitive = isFilteringCaseSensitive;
  function _getFilterFunctions(ConverterContext) {
    const entitySet = ConverterContext.getEntitySet();
    if (TypeGuards.isEntitySet(entitySet)) {
      return entitySet.annotations.Capabilities?.FilterFunctions ?? ConverterContext.getEntityContainer().annotations.Capabilities?.FilterFunctions;
    }
    return undefined;
  }

  /**
   * Returns default format options for text fields in a table.
   * @param formatOptions
   * @returns Collection of format options with default values
   */
  function _getDefaultFormatOptionsForTable(formatOptions) {
    return formatOptions === undefined ? undefined : {
      textLinesEdit: 4,
      ...formatOptions
    };
  }
  function _findSemanticKeyValues(semanticKeys, name) {
    const aSemanticKeyValues = [];
    let bSemanticKeyFound = false;
    for (let i = 0; i < semanticKeys.length; i++) {
      aSemanticKeyValues.push(semanticKeys[i].value);
      if (semanticKeys[i].value === name) {
        bSemanticKeyFound = true;
      }
    }
    return {
      values: aSemanticKeyValues,
      semanticKeyFound: bSemanticKeyFound
    };
  }
  function _findProperties(semanticKeyValues, fieldGroupProperties) {
    let semanticKeyHasPropertyInFieldGroup = false;
    let sPropertyPath;
    if (semanticKeyValues && semanticKeyValues.length >= 1 && fieldGroupProperties && fieldGroupProperties.length >= 1) {
      for (let i = 0; i < semanticKeyValues.length; i++) {
        if ([semanticKeyValues[i]].some(tmp => fieldGroupProperties.includes(tmp))) {
          semanticKeyHasPropertyInFieldGroup = true;
          sPropertyPath = semanticKeyValues[i];
          break;
        }
      }
    }
    return {
      semanticKeyHasPropertyInFieldGroup: semanticKeyHasPropertyInFieldGroup,
      fieldGroupPropertyPath: sPropertyPath
    };
  }

  /**
   * Find the first property in the fieldGroup that is part of the semantic keys.
   * @param dataFieldGroup
   * @param semanticKeyValues
   * @returns An object containing a flag true if a property is found and a propertyPath.
   */
  function _findSemanticKeyValuesInFieldGroup(dataFieldGroup, semanticKeyValues) {
    // this info is used in FieldHelper#isDraftIndicatorVisibleInFieldGroup to show a draft indicator at the end of a field group
    const aProperties = [];
    let _propertiesFound = {
      semanticKeyHasPropertyInFieldGroup: false,
      fieldGroupPropertyPath: undefined
    };
    if (dataFieldGroup && dataFieldGroup.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataFieldGroup.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
      dataFieldGroup.Target.$target.Data?.forEach(innerDataField => {
        if ((innerDataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || innerDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") && innerDataField.Value) {
          aProperties.push(innerDataField.Value.path);
        }
        _propertiesFound = _findProperties(semanticKeyValues, aProperties);
      });
    }
    return {
      semanticKeyHasPropertyInFieldGroup: _propertiesFound.semanticKeyHasPropertyInFieldGroup,
      propertyPath: _propertiesFound.fieldGroupPropertyPath
    };
  }

  /**
   * Returns default format options with draftIndicator for a column.
   * @param name
   * @param semanticKeys
   * @param dataFieldGroup
   * @returns Collection of format options with default values
   */
  function getDefaultDraftIndicatorForColumn(name, semanticKeys, dataFieldGroup) {
    if (!semanticKeys) {
      return {};
    }
    const semanticKey = _findSemanticKeyValues(semanticKeys, name);
    const semanticKeyInFieldGroup = _findSemanticKeyValuesInFieldGroup(dataFieldGroup, semanticKey.values);
    if (semanticKeyInFieldGroup.semanticKeyHasPropertyInFieldGroup) {
      // Semantic Key has a property in a FieldGroup
      return {
        //TODO we should rather store hasSemanticKeyInFieldGroup
        fieldGroupDraftIndicatorPropertyPath: semanticKeyInFieldGroup.propertyPath,
        fieldGroupName: name,
        showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, true))
      };
    } else if (semanticKey.semanticKeyFound) {
      return {
        hasDraftIndicator: true,
        showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, false))
      };
    }
    return {};
  }
  function _getImpNumber(dataField) {
    const importance = dataField?.annotations?.UI?.Importance;
    if (importance && importance.includes("UI.ImportanceType/High")) {
      return 3;
    }
    if (importance && importance.includes("UI.ImportanceType/Medium")) {
      return 2;
    }
    if (importance && importance.includes("UI.ImportanceType/Low")) {
      return 1;
    }
    return 0;
  }
  function _getDataFieldImportance(dataField) {
    const importance = dataField?.annotations?.UI?.Importance;
    return importance ? importance.split("/")[1] : Importance.None;
  }

  /**
   * Sets the export settings of a column containing datapoints.
   * @param property The property referenced on a given column
   * @param column The column to be updated
   */
  function _setExportSettingsForDataPoint(property, column) {
    const targetValuefromDP = getTargetValueOnDataPoint(property);
    if (isDataPointFromDataFieldDefault(property) && typeof targetValuefromDP === "string" && column.exportSettings && column.exportSettings?.unit !== "%") {
      column.exportDataPointTargetValue = targetValuefromDP;
      column.exportSettings.template = "{0}/" + targetValuefromDP;
    }
  }
  function _getMaxImportance(fields) {
    if (fields && fields.length > 0) {
      let maxImpNumber = -1;
      let impNumber = -1;
      let DataFieldWithMaxImportance;
      for (const field of fields) {
        impNumber = _getImpNumber(field);
        if (impNumber > maxImpNumber) {
          maxImpNumber = impNumber;
          DataFieldWithMaxImportance = field;
        }
      }
      return _getDataFieldImportance(DataFieldWithMaxImportance);
    }
    return Importance.None;
  }

  /**
   * Returns the importance value for a column.
   * @param converterContext
   * @param dataField
   * @returns The importance value
   */
  function getImportance(converterContext, dataField) {
    if (!dataField) {
      return undefined;
    }
    const semanticKeys = converterContext.getDataModelObjectPath().targetEntityType.annotations.Common?.SemanticKey ?? [];
    const requiredProperties = getRequiredProperties(converterContext);
    const highKeys = [...semanticKeys, ...requiredProperties].map(propertyPath => propertyPath.$target?.fullyQualifiedName);
    //Evaluate default Importance is not set explicitly
    let fieldsWithImportance;
    if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
      const dataFieldTarget = dataField.Target.$target;
      if (isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.FieldGroupType")) {
        const fieldGroupData = dataFieldTarget.Data;
        //If a FieldGroup contains a semanticKey or required property, importance set to High
        if (fieldGroupData.some(function (fieldGroupDataField) {
          return isDataFieldTypes(fieldGroupDataField) && highKeys.includes(fieldGroupDataField.Value?.$target?.fullyQualifiedName);
        })) {
          return Importance.High;
        } else {
          //If the DataFieldForAnnotation has an Importance we take it
          if (dataField?.annotations?.UI?.Importance) {
            return _getDataFieldImportance(dataField);
          }
          // else the highest importance (if any) is returned
          fieldsWithImportance = fieldGroupData.filter(function (item) {
            return item?.annotations?.UI?.Importance;
          });
          return _getMaxImportance(fieldsWithImportance);
        }
      }
    }
    return highKeys.includes(dataField.Value?.$target?.fullyQualifiedName) ? Importance.High : _getDataFieldImportance(dataField);
  }

  /**
   * Returns line items from metadata annotations.
   * @param lineItemAnnotation Collection of data fields with their annotations
   * @param tableType The table type
   * @param visualizationPath The visualization path
   * @param converterContext The converter context
   * @returns The columns from the annotations
   */
  _exports.getImportance = getImportance;
  const getColumnsFromAnnotations = function (lineItemAnnotation, tableType, visualizationPath, converterContext) {
    const entityType = converterContext.getAnnotationEntityType(lineItemAnnotation),
      annotationColumns = [],
      columnsToBeCreated = {},
      displayModeOfDescriptionPropertiesMap = {},
      restrictionsOnProperties = getRestrictionsOnProperties(converterContext),
      tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath),
      defaultCreationMode = converterContext.getManifestWrapper().getSapFeManifestConfiguration()?.macros?.table?.defaultCreationMode === "InlineCreationRows" ? CreationMode.InlineCreationRows : undefined,
      tableCreationMode = tableManifestSettings?.tableSettings?.creationMode?.name ?? defaultCreationMode ?? CreationMode.Inline;
    const semanticKeys = converterContext.getAnnotationsByTerm("Common", "com.sap.vocabularies.Common.v1.SemanticKey", [converterContext.getEntityType()])[0];
    if (lineItemAnnotation) {
      const tableConverterContext = converterContext.getConverterContextFor(getTargetObjectPath(converterContext.getDataModelObjectPath()));
      lineItemAnnotation.forEach(dataField => {
        // TODO: variable name should be datafield and not lineItem
        if (!_isValidColumn(dataField)) {
          return;
        }
        let exportSettings = null;
        const semanticObjectAnnotationPath = isDataFieldTypes(dataField) && dataField.Value?.$target?.fullyQualifiedName ? getSemanticObjectPath(converterContext, dataField) : undefined;
        const relativePath = _getRelativePath(dataField);
        // Determine properties which are consumed by this LineItem.
        const relatedPropertiesInfo = collectRelatedPropertiesRecursively(dataField, converterContext, tableType);
        const relatedPropertyNames = Object.keys(relatedPropertiesInfo.properties);
        const additionalPropertyNames = Object.keys(relatedPropertiesInfo.additionalProperties);
        const groupPath = relativePath ? _sliceAtSlash(relativePath, true, false) : undefined;
        const isGroup = groupPath != relativePath;
        const label = getLabel(dataField, isGroup);
        const name = _getAnnotationColumnName(dataField);
        const isFieldGroupColumn = groupPath ? groupPath.includes(`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`) : false;
        const showDataFieldsLabel = isFieldGroupColumn ? _getShowDataFieldsLabel(name, visualizationPath, converterContext) : false;
        const dataType = getDataFieldDataType(dataField);
        const formatOptions = _getDefaultFormatOptionsForTable(getDefaultDraftIndicatorForColumn(name, semanticKeys, dataField));
        const propertyDataModelObjectPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), relativePath);
        // Determine if we need a situations indicator
        const navigationProperties = propertyDataModelObjectPath.targetEntityType.navigationProperties;
        const situationsNavProps = navigationProperties.filter(navigationProperty => !navigationProperty.isCollection && navigationProperty.targetType.annotations.Common?.SAPObjectNodeType?.Name === "BusinessSituation");
        const situationsNavProp = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;
        if (situationsNavProp && formatOptions) {
          formatOptions.hasSituationsIndicator = true;
        }
        let fieldGroupHiddenExpressions;
        if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataField.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          fieldGroupHiddenExpressions = _getFieldGroupHiddenExpressions(dataField);
        }
        const isMultiValue = _isColumnMultiValued(dataField, tableConverterContext);
        if (!isMultiValue && _isExportableColumn(dataField)) {
          //exclude the types listed above for the Export (generates error on Export as PDF)
          exportSettings = createColumnExportSettings(dataField, relatedPropertiesInfo);
        }
        let propertyTypeConfig;
        if (dataType) {
          propertyTypeConfig = getTypeConfig(dataField, dataType);
        }
        const typeConfig = {
          className: dataType,
          formatOptions: {
            ...formatOptions,
            ...propertyTypeConfig?.formatOptions
          },
          constraints: {
            ...propertyTypeConfig?.constraints
          }
        };
        const visualSettings = {};
        if (!dataType || !typeConfig) {
          // for charts
          visualSettings.widthCalculation = null;
        }
        const sortable = !isMultiValue && _isColumnSortable(dataField, relativePath, restrictionsOnProperties.nonSortableProperties, relatedPropertiesInfo);
        const availability = isReferencePropertyStaticallyHidden(dataField) ? "Hidden" : "Default";
        const column = {
          key: KeyHelper.generateKeyFromDataField(dataField),
          type: ColumnType.Annotation,
          label: label ?? name,
          groupLabel: isGroup ? getLabel(dataField) : undefined,
          group: isGroup ? groupPath : undefined,
          FieldGroupHiddenExpressions: fieldGroupHiddenExpressions,
          annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
          semanticObjectPath: semanticObjectAnnotationPath,
          availability: availability,
          name: name,
          showDataFieldsLabel: showDataFieldsLabel,
          required: isRequiredColumn(converterContext, dataField, tableCreationMode),
          relativePath: relativePath,
          sortable: sortable,
          propertyInfos: relatedPropertyNames.length ? relatedPropertyNames : undefined,
          additionalPropertyInfos: additionalPropertyNames.length > 0 ? additionalPropertyNames : undefined,
          exportSettings: exportSettings,
          width: dataField.annotations?.HTML5?.CssDefaults?.width?.valueOf() || undefined,
          importance: getImportance(converterContext, dataField),
          isNavigable: true,
          formatOptions: formatOptions,
          caseSensitive: isFilteringCaseSensitive(converterContext),
          typeConfig: typeConfig,
          visualSettings: visualSettings,
          timezoneText: exportSettings?.timezone,
          isPartOfLineItem: true,
          dataType: dataType ?? "Edm.String",
          isMultiValue
        };
        const tooltip = _getTooltip(dataField) ?? label;
        if (tooltip) {
          column.tooltip = tooltip;
        }
        if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
          column.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
        }
        annotationColumns.push(column);
        // Collect information of related columns to be created.
        relatedPropertyNames.forEach(relatedPropertyName => {
          columnsToBeCreated[relatedPropertyName] = relatedPropertiesInfo.properties[relatedPropertyName].annotationProperty;
          // In case of a multi-value, related properties cannot be sorted as we go through a 1-n relation
          if (isMultiValue) {
            restrictionsOnProperties.nonSortableProperties.push(relatedPropertyName);
          }
          addPropertyToDisplayModeOfDescriptionPropertiesMap(displayModeOfDescriptionPropertiesMap, relatedPropertiesInfo, relatedPropertyName);
          // In case the lineItem points to a navigation property with a textArrangement TextOnly, we need to create the column with the value navigation property.
          // The text property is referenced on the related properties of the lineItem, so will be created on the _createRelatedColumns method.
          if (relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription === "Description") {
            createPropertyAnnotatedTextOnly(converterContext, propertyDataModelObjectPath, dataField, columnsToBeCreated, relativePath, restrictionsOnProperties);
          }
        });
        // Create columns for additional properties identified for ALP use case.
        additionalPropertyNames.forEach(additionalPropertyName => {
          // Intentional overwrite as we require only one new PropertyInfo for a related Property.
          columnsToBeCreated[additionalPropertyName] = relatedPropertiesInfo.additionalProperties[additionalPropertyName];
        });
      });
    }
    // Get columns from the Properties of EntityType
    return getColumnsFromEntityType(columnsToBeCreated, entityType, annotationColumns, converterContext, tableType, tableCreationMode, displayModeOfDescriptionPropertiesMap, restrictionsOnProperties);
  };

  /**
   * Gets the property names from the manifest and checks against existing properties already added by annotations.
   * If a not yet stored property is found it adds it for sorting and filtering only to the annotationColumns.
   * @param properties
   * @param annotationColumns
   * @param converterContext
   * @param entityType
   * @returns The columns from the annotations
   */
  const _getPropertyNames = function (properties, annotationColumns, converterContext, entityType) {
    let matchedProperties;
    if (Array.isArray(properties)) {
      matchedProperties = properties.map(function (propertyPath) {
        const annotationColumn = annotationColumns.find(function (annotationColumn) {
          return annotationColumn.relativePath === propertyPath && annotationColumn.propertyInfos === undefined;
        });
        if (annotationColumn) {
          return annotationColumn.name;
        } else {
          const relatedColumns = _createRelatedColumns({
            [propertyPath]: entityType.resolvePath(propertyPath)
          }, annotationColumns, converterContext, entityType, {});
          annotationColumns.push(relatedColumns[0]);
          return relatedColumns[0].name;
        }
      });
    }
    return matchedProperties;
  };

  /**
   * Determines if the field group has to be flagged as required.
   * @param converterContext The converter context
   * @param fieldGroup The fieldGroup being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the fieldGroup is required.
   */
  const isRequiredFieldGroup = function (converterContext, fieldGroup, tableCreationMode) {
    const fieldGroupData = fieldGroup.Data;
    return fieldGroupData.some(function (item) {
      // we exclude boolean type, the end-user may want to keep the underlying check box empty on purpose
      if (isDataField(item) && item?.Value?.$target.type !== "Edm.Boolean") {
        return isStaticallyMandatory(item) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(item.Value.$target.fullyQualifiedName, converterContext);
      }
    });
  };

  /**
   * Determines if the dataFieldForAnnotation has to be flagged as required.
   * @param converterContext The converter context
   * @param dataFieldForAnnotation The property being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the property is required.
   */
  const isRequiredDataFieldForAnnotation = function (converterContext, dataFieldForAnnotation, tableCreationMode) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    const DataFieldForAnnotationFieldControlNotMandatory = hasFieldControlNotMandatory(dataFieldForAnnotation);
    // Check if the DataFieldForAnnotation points to a FieldGroup
    if (hasFieldGroupTarget(dataFieldForAnnotation)) {
      if (isRequiredFieldGroup(converterContext, dataFieldTarget, tableCreationMode)) {
        return true;
      }
      const fieldGroupData = dataFieldTarget.Data;
      return fieldGroupData.some(innerDataField => {
        return isRequiredColumn(converterContext, innerDataField, tableCreationMode);
      });
    }
    /*If the underlying datapoint is a rating indicator, the end-user may want to keep the rating empty (value 0) on purpose.
    Besides, currently, only a fieldControl set on a dataFieldForAnnotation pointing to a dataPoint has an influence in the table.
    Accordingly, if a datapoint comes from a dataFieldForAnnotation with a fieldControl set as not mandatory, this dataPoint must not be flagged as "required"*/
    if (hasDataPointTarget(dataFieldForAnnotation) && dataFieldTarget.Visualization !== "UI.VisualizationType/Rating") {
      if (DataFieldForAnnotationFieldControlNotMandatory) {
        return false;
      }
      if (isStaticallyMandatory(dataFieldForAnnotation)) {
        return true;
      }
      return isRequiredDataPoint(converterContext, dataFieldTarget, tableCreationMode);
    }
    return false;
  };

  /**
   * Determines if the property has to be flagged as required.
   * @param converterContext The converter context
   * @param property The property being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the property is required.
   */
  const isRequiredProperty = function (converterContext, property, tableCreationMode) {
    return property.type !== "Edm.Boolean" && !isRatingVisualizationFromDataFieldDefault(property) && (isStaticallyMandatory(property) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(property.fullyQualifiedName, converterContext));
  };

  /**
   * Determines if the dataPoint has to be flagged as required.
   * @param converterContext The converter context
   * @param dataPoint The dataPoint being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the dataPoint is required.
   */
  const isRequiredDataPoint = function (converterContext, dataPoint, tableCreationMode) {
    return isStaticallyMandatory(dataPoint) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(dataPoint.Value.$target.fullyQualifiedName, converterContext);
  };

  /**
   * Determines if the underlying column has to be flagged as required.
   * @param converterContext The converter context
   * @param target The target being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns The binding expression for the 'required' property of the table column.
   */
  const isRequiredColumn = function (converterContext, target, tableCreationMode) {
    const creationMode = tableCreationMode || CreationMode.Inline;
    if (converterContext.getTemplateType() === TemplateType.ListReport || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      return undefined;
    }
    if (isProperty(target)) {
      return isRequiredProperty(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
    }
    // Check if the dataField is of type DataFieldForAnnotation
    if (isDataFieldForAnnotation(target)) {
      return isRequiredDataFieldForAnnotation(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
    }
    //If the underlying property is a boolean, the end-user may want to keep the check box empty on purpose
    if (isDataField(target) && target.Value?.$target?.type !== "Edm.Boolean") {
      return isStaticallyMandatory(target) || creationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(target.Value.$target.fullyQualifiedName, converterContext) ? compileExpression(UI.IsEditable) : undefined;
    }
    return undefined;
  };
  const _appendCustomTemplate = function (properties, exportProperties) {
    if (Array.isArray(exportProperties)) {
      properties = exportProperties;
    }
    if (properties) {
      return properties.map(property => {
        return `{${properties.indexOf(property)}}`;
      }).join(`${"\n"}`);
    }
    return undefined;
  };

  /**
   * Returns table column definitions from manifest.
   *
   * These may be custom columns defined in the manifest, slot columns coming through
   * a building block, or annotation columns to overwrite annotation-based columns.
   * @param columns
   * @param annotationColumns
   * @param converterContext
   * @param entityType
   * @returns The columns from the manifest
   */
  const getColumnsFromManifest = function (columns, annotationColumns, converterContext, entityType) {
    const internalColumns = {};
    function isColumnOverride(column, key) {
      return annotationColumns.some(annotationColumn => annotationColumn.key === key);
    }
    function isSlotColumn(manifestColumn) {
      return manifestColumn.type === ColumnType.Slot;
    }
    function isCustomColumn(manifestColumn) {
      return manifestColumn.type === undefined && !!manifestColumn.template;
    }
    function _updateLinkedPropertiesOnCustomColumns(propertyInfos, annotationTableColumns) {
      const restrictionsOnProperties = getRestrictionsOnProperties(converterContext);
      propertyInfos.forEach(property => {
        annotationTableColumns.forEach(prop => {
          if (prop.name === property) {
            prop.sortable = !restrictionsOnProperties.nonSortableProperties.includes(property.replace("Property::", ""));
            prop.isGroupable = prop.sortable;
            prop.filterable = !restrictionsOnProperties.nonFilterableProperties.includes(property.replace("Property::", ""));
            prop.isPartOfCustomColumn = true;
          }
        });
      });
    }
    for (const key in columns) {
      const manifestColumn = columns[key];
      KeyHelper.validateKey(key);
      // BaseTableColumn
      const baseTableColumn = {
        key: key,
        widthIncludingColumnHeader: manifestColumn.widthIncludingColumnHeader,
        width: manifestColumn.width || undefined,
        position: {
          anchor: manifestColumn.position?.anchor,
          placement: manifestColumn.position === undefined ? Placement.After : manifestColumn.position.placement
        },
        caseSensitive: isFilteringCaseSensitive(converterContext)
      };
      if (isColumnOverride(manifestColumn, key)) {
        const propertiesToOverwriteAnnotationColumn = {
          ...baseTableColumn,
          importance: manifestColumn?.importance,
          horizontalAlign: manifestColumn?.horizontalAlign,
          availability: manifestColumn?.availability,
          type: ColumnType.Annotation,
          isNavigable: undefined,
          settings: manifestColumn.settings,
          formatOptions: _getDefaultFormatOptionsForTable(manifestColumn.formatOptions),
          exportSettings: getCustomExportSettings(manifestColumn?.exportSettings, annotationColumns, converterContext, entityType, undefined, key)
        };
        internalColumns[key] = propertiesToOverwriteAnnotationColumn;
      } else {
        const propertyInfos = _getPropertyNames(manifestColumn.properties, annotationColumns, converterContext, entityType);
        const tooltipText = converterContext.fetchTextFromMetaModel(manifestColumn.tooltip),
          headerText = converterContext.fetchTextFromMetaModel(manifestColumn.header);
        const customColumnExportSettings = propertyInfos ? getCustomExportSettings(manifestColumn?.exportSettings, annotationColumns, converterContext, entityType, propertyInfos) : null;
        const baseManifestColumn = {
          ...baseTableColumn,
          header: headerText,
          importance: manifestColumn?.importance || Importance.None,
          horizontalAlign: manifestColumn?.horizontalAlign || HorizontalAlign.Begin,
          availability: manifestColumn?.availability || "Default",
          template: manifestColumn.template,
          propertyInfos: propertyInfos,
          exportSettings: customColumnExportSettings,
          id: `CustomColumn::${key}`,
          name: `CustomColumn::${key}`,
          //Needed for MDC:
          formatOptions: {
            textLinesEdit: 4
          },
          isGroupable: false,
          isNavigable: false,
          sortable: false,
          visualSettings: {
            widthCalculation: null
          },
          tooltip: tooltipText ? tooltipText : headerText,
          properties: manifestColumn.properties,
          required: manifestColumn.required && converterContext.getTemplateType() !== TemplateType.ListReport && converterContext.getTemplateType() !== TemplateType.AnalyticalListPage ? compileExpression(UI.IsEditable) : undefined
        };
        if (propertyInfos) {
          _updateLinkedPropertiesOnCustomColumns(propertyInfos, annotationColumns);
        }
        if (isSlotColumn(manifestColumn)) {
          const customTableColumn = {
            ...baseManifestColumn,
            type: ColumnType.Slot
          };
          internalColumns[key] = customTableColumn;
        } else if (isCustomColumn(manifestColumn)) {
          const customTableColumn = {
            ...baseManifestColumn,
            type: ColumnType.Default
          };
          internalColumns[key] = customTableColumn;
        } else {
          const message = `The annotation column '${key}' referenced in the manifest is not found`;
          converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.Low, message, IssueCategoryType, IssueCategoryType?.AnnotationColumns?.InvalidKey);
        }
      }
    }
    return internalColumns;
  };

  /**
   * Adds computed columns such as the draft status and situations status.
   * @param tableColumns The table columns collected so far
   * @param tableType The table type
   * @param visualizationPath
   * @param converterContext
   * @returns The enriched set of table columns
   */
  function addComputedColumns(tableColumns, tableType, visualizationPath, converterContext) {
    if (!["GridTable", "TreeTable", "AnalyticalTable"].includes(tableType)) {
      // Computed columns are not used in Responsive tables
      return tableColumns;
    }

    // In case a grid table or tree table is used, we display the situations indicator in a separate column
    // so we have to disable it here to ensure, that the field building block
    // does not render it into the ID column
    const columnWithSituationsIndicator = tableColumns.find(column => column.formatOptions?.hasSituationsIndicator !== undefined && column.formatOptions?.hasSituationsIndicator === true);
    if (columnWithSituationsIndicator?.formatOptions) {
      // Switch off the situations indicator in the found column
      columnWithSituationsIndicator.formatOptions.hasSituationsIndicator = false;

      // Insert a separate situations indicator column
      const situationsIndicatorColumn = {
        key: "situationsIndicator",
        name: "situationsIndicator",
        propertyKey: columnWithSituationsIndicator.name,
        isSituationsIndicator: true,
        availability: "Default",
        label: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
        tooltip: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
        type: ColumnType.Computed,
        formatOptions: null,
        exportSettings: null,
        clipboardSettings: null,
        propertyInfos: undefined,
        caseSensitive: false
      };

      // Place the draft status column after the first visible column
      const indexOfFirstVisibleColumn = tableColumns.findIndex(column => column.availability !== "Hidden");
      tableColumns.splice(indexOfFirstVisibleColumn + 1, 0, situationsIndicatorColumn);
    }

    // In case a grid table or tree table is used, we display the draft indicator in a separate column
    // so we have to disable it here to ensure, that the field building block
    // does not render it into the ID column
    // The additional column is only added for tables on a LR and in case tehe entity is draft enabled!
    const columnsWithDraftIndicator = tableColumns.filter(column => column.formatOptions?.hasDraftIndicator === true);
    if (columnsWithDraftIndicator.length && converterContext.getTemplateType() === TemplateType.ListReport && (ModelHelper.isDraftNode(converterContext.getEntitySet()) || ModelHelper.isDraftRoot(converterContext.getEntitySet()))) {
      // Switch off the draft indicator in the found column
      columnsWithDraftIndicator.forEach(columnWithDraftIndicator => {
        if (columnWithDraftIndicator?.formatOptions) {
          columnWithDraftIndicator.formatOptions.hasDraftIndicator = false;
        }
      });

      // Insert a separate draft indicator column
      const draftIndicatorColumn = {
        key: "draftStatus",
        name: "draftStatus",
        propertyKey: columnsWithDraftIndicator[0].name,
        isDraftIndicator: true,
        availability: "Default",
        label: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
        tooltip: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
        type: ColumnType.Computed,
        formatOptions: null,
        exportSettings: null,
        caseSensitive: false
      };
      let columnIndexToInsertAfter = 0;
      if (columnWithSituationsIndicator) {
        // If there's a situations indicator column, place the draft status column before it
        columnIndexToInsertAfter = tableColumns.findIndex(column => column.isSituationsIndicator === true) - 1;
      } else {
        // Otherwise place the draft status column after the first visible column
        columnIndexToInsertAfter = tableColumns.findIndex(column => column.availability !== "Hidden");
      }
      tableColumns.splice(columnIndexToInsertAfter + 1, 0, draftIndicatorColumn);
    }
    return tableColumns;
  }

  /**
   * Provides the required properties set on the annotations.
   * @param converterContext  The instance of the converter context
   * @returns The paths of the restricted properties
   */
  _exports.addComputedColumns = addComputedColumns;
  function getRequiredProperties(converterContext) {
    return getContextPropertyRestriction(converterContext.getDataModelObjectPath(), capabilities => {
      return capabilities?.InsertRestrictions?.RequiredProperties;
    }, false);
  }

  /**
   * Determines if the property is annotated as a required property.
   * @param name The name of the property
   * @param converterContext The instance of the converter context
   * @returns True if the property is required
   */
  _exports.getRequiredProperties = getRequiredProperties;
  function isAnnotatedRequiredProperty(name, converterContext) {
    return getRequiredProperties(converterContext).map(property => property.$target?.fullyQualifiedName).includes(name);
  }

  /**
   * Gets the data type of a column for the export.
   * @param dataType The data type of a property, column
   * @param isATimezone Is the given property a timezone
   * @param isCurrency Is the given property a currency
   * @param exportSettings The already detected export settings from datafields
   * @returns The supported export type
   */
  function getExportDataType(dataType) {
    let isATimezone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let isCurrency = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let exportSettings = arguments.length > 3 ? arguments[3] : undefined;
    let exportDataType = "String";
    if (!dataType || exportSettings?.dataPointTargetValue) {
      return exportDataType;
    }
    if (exportSettings?.isCurrency || isCurrency) {
      return "Currency";
    }
    if (isATimezone) {
      return "Timezone";
    }
    if (exportSettings?.wrap) {
      return exportDataType;
    }
    switch (dataType) {
      case "Edm.Decimal":
      case "Edm.Int32":
      case "Edm.Int64":
      case "Edm.Double":
      case "Edm.Byte":
        exportDataType = "Number";
        break;
      case "Edm.DateOfTime":
      case "Edm.Date":
        exportDataType = "Date";
        break;
      case "Edm.DateTimeOffset":
        exportDataType = "DateTime";
        break;
      case "Edm.TimeOfDay":
        exportDataType = "Time";
        break;
      case "Edm.Boolean":
        exportDataType = "Boolean";
        break;
      default:
        exportDataType = "String";
    }
    return exportDataType;
  }

  /**
   * Adds the tooltip configuration for a given column.
   * @param property The property referenced on the column
   * @param column The column to be updated
   */
  function _addToolTip(property, column) {
    const tooltip = _getTooltip(property) ?? column.label;
    if (tooltip) {
      column.tooltip = tooltip;
    }
  }
  function _getCollectedNavigationPropertyLabels(relativePath, converterContext) {
    const navigationProperties = enhanceDataModelPath(converterContext.getDataModelObjectPath(), relativePath).navigationProperties;
    if (navigationProperties?.length > 0) {
      const collectedNavigationPropertyLabels = [];
      navigationProperties.forEach(navProperty => {
        collectedNavigationPropertyLabels.push(getLabel(navProperty) || navProperty.name);
      });
      return collectedNavigationPropertyLabels;
    }
  }

  /**
   * Creates a property using the text arrangement annotation set to text only.
   * @param converterContext The converter context.
   * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
   * @param lineItem The column to be evaluated.
   * @param columnsToBeCreated The list of columns to be created.
   * @param relativePath The relative path to the target property based on the context.
   * @param restrictionsOnProperties The existing restrictions on properties
   */
  function createPropertyAnnotatedTextOnly(converterContext, propertyDataModelObjectPath, lineItem, columnsToBeCreated, relativePath, restrictionsOnProperties) {
    const isPropertyNavigated = propertyDataModelObjectPath.navigationProperties.length !== converterContext.getDataModelObjectPath().navigationProperties.length;
    if (isPropertyNavigated && isDataField(lineItem)) {
      columnsToBeCreated[relativePath] = lineItem.Value.$target;
      restrictionsOnProperties.nonSortableProperties.push(relativePath);
    } else if (isDataFieldForAnnotation(lineItem) && hasFieldGroupTarget(lineItem)) {
      lineItem.Target.$target.Data.forEach(field => {
        if (isDataField(field) && getDisplayMode(field.Value.$target) === "Description") {
          const inheredPropertyDataModelObjectPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), field.Value.path);
          const isInheredPropertyNavigated = inheredPropertyDataModelObjectPath.navigationProperties.length !== converterContext.getDataModelObjectPath().navigationProperties.length;
          if (isInheredPropertyNavigated) {
            columnsToBeCreated[field.Value.path] = field.Value.$target;
            restrictionsOnProperties.nonSortableProperties.push(field.Value.path);
          }
        }
      });
    }
  }
  function getTypeConfig(oProperty, dataType) {
    let oTargetMapping;
    if (isProperty(oProperty)) {
      oTargetMapping = isTypeDefinition(oProperty.targetType) ? EDM_TYPE_MAPPING[oProperty.targetType.underlyingType] : EDM_TYPE_MAPPING[oProperty.type];
    }
    if (oTargetMapping === undefined && dataType !== undefined) {
      oTargetMapping = EDM_TYPE_MAPPING[dataType];
    }
    const propertyTypeConfig = {
      type: oTargetMapping?.type,
      constraints: {},
      formatOptions: {}
    };
    if (isProperty(oProperty) && oTargetMapping !== undefined) {
      propertyTypeConfig.constraints = {
        scale: oTargetMapping.constraints?.$Scale ? oProperty.scale : undefined,
        precision: oTargetMapping.constraints?.$Precision ? oProperty.precision : undefined,
        maxLength: oTargetMapping.constraints?.$MaxLength ? oProperty.maxLength : undefined,
        nullable: oTargetMapping.constraints?.$Nullable ? oProperty.nullable : undefined,
        minimum: oTargetMapping.constraints?.["@Org.OData.Validation.V1.Minimum/$Decimal"] && !isNaN(oProperty.annotations?.Validation?.Minimum) ? `${oProperty.annotations?.Validation?.Minimum}` : undefined,
        maximum: oTargetMapping.constraints?.["@Org.OData.Validation.V1.Maximum/$Decimal"] && !isNaN(oProperty.annotations?.Validation?.Maximum) ? `${oProperty.annotations?.Validation?.Maximum}` : undefined,
        isDigitSequence: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && oTargetMapping.constraints?.[`@${"com.sap.vocabularies.Common.v1.IsDigitSequence"}`] && oProperty.annotations?.Common?.IsDigitSequence ? true : undefined
      };
    }
    propertyTypeConfig.formatOptions = {
      parseAsString: propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 || propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0 ? false : undefined,
      emptyString: propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 || propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0 ? "" : undefined,
      parseKeepsEmptyString: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && propertyTypeConfig.constraints.nullable === false ? true : undefined
    };
    return propertyTypeConfig;
  }

  /**
   * Add a description property to the list of description properties used by the columns of a table.
   * @param displayModeOfDescriptionPropertiesMap The list of properties referenced as text on a text arrangement annotation
   * @param relatedPropertiesInfo The related properties linked to the column (named also complex property)
   * @param relatedPropertyName The property name to be added
   */
  _exports.getTypeConfig = getTypeConfig;
  function addPropertyToDisplayModeOfDescriptionPropertiesMap(displayModeOfDescriptionPropertiesMap, relatedPropertiesInfo, relatedPropertyName) {
    if (relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription && !displayModeOfDescriptionPropertiesMap[relatedPropertyName]) {
      displayModeOfDescriptionPropertiesMap[relatedPropertyName] = relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription;
    }
  }

  /**
   * Computes the referenced properties of a LineItem in case the LineItem is annotated as hidden.
   * @param existingColumns The list of columns created from LineItems and from properties of entityType
   * @param name The name of the property to be evaluated
   * @param column The given column from lineItem or property of entitySet
   */
  function computeHiddenOnRelatedColumns(existingColumns, name, column) {
    const relatedAnnotationColumns = existingColumns.filter(existingColumn => existingColumn.propertyInfos?.includes(name) && existingColumn.isPartOfLineItem || existingColumn.isPartOfLineItem && existingColumn.relativePath === column.relativePath);
    column.isPartOfLineItem = !!relatedAnnotationColumns.length;
    if (relatedAnnotationColumns.length && !relatedAnnotationColumns?.some(annotationColumn => annotationColumn.availability !== "Hidden")) {
      column.sortable = false;
      column.isGroupable = false;
      column.filterable = false;
    }
  }

  /**
   * Gets the export settings properties of a manifest column.
   * @param exportSettings The customized/overwritten export settings of a manifest column
   * @param annotationColumns The list of columns created from LineItems
   * @param converterContext The converter context
   * @param entityType The target entity type
   * @param propertyInfos The properties linked to a complex column
   * @param columnKey The column key of the column to be overwritten
   * @returns The export settings of the column merging customized export settings with the default values detected on the annotation column
   */
  function getCustomExportSettings(exportSettings, annotationColumns, converterContext, entityType, propertyInfos, columnKey) {
    let columnFromAnnotations;
    if (columnKey) {
      columnFromAnnotations = annotationColumns.find(annotationColumn => annotationColumn.key === columnKey);
      if (columnFromAnnotations?.exportSettings === null) {
        return columnFromAnnotations?.exportSettings;
      }
    }
    const enableWrapping = exportSettings?.wrap ?? (!!(exportSettings?.property && exportSettings.property?.length > 1) || !!(propertyInfos && propertyInfos.length > 1));
    const customExportSettings = {
      ...columnFromAnnotations?.exportSettings,
      type: exportSettings?.type ?? columnFromAnnotations?.exportSettings?.type,
      template: exportSettings?.template ?? _appendCustomTemplate(propertyInfos, exportSettings?.property) ?? columnFromAnnotations?.exportSettings?.template,
      property: exportSettings?.property ? _getPropertyNames(exportSettings?.property, annotationColumns, converterContext, entityType) : undefined,
      width: exportSettings?.width,
      wrap: enableWrapping
    };
    return removeUndefinedFromExportSettings(customExportSettings);
  }
  return _exports;
}, false);
//# sourceMappingURL=Columns-dbg.js.map

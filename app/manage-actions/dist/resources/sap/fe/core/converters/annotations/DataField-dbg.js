/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/PropertyHelper", "../../templating/DataModelPathHelper", "../helpers/DataFieldHelper"], function (BindingToolkit, Aggregation, TypeGuards, DisplayModeFormatter, PropertyHelper, DataModelPathHelper, DataFieldHelper) {
  "use strict";

  var _exports = {};
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTimezoneProperty = PropertyHelper.getAssociatedTimezoneProperty;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedTextProperty = PropertyHelper.getAssociatedTextProperty;
  var getAssociatedExternalIdPropertyPath = PropertyHelper.getAssociatedExternalIdPropertyPath;
  var getAssociatedExternalIdProperty = PropertyHelper.getAssociatedExternalIdProperty;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var AggregationHelper = Aggregation.AggregationHelper;
  var not = BindingToolkit.not;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionAbstract".
   * DataFieldForActionAbstract has an inline action defined.
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForActionAbstractType
   */
  function isDataFieldForActionAbstract(dataField) {
    return dataField.hasOwnProperty("Action");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionGroup".
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForActionGroup
   */
  _exports.isDataFieldForActionAbstract = isDataFieldForActionAbstract;
  function isDataFieldForActionGroup(dataField) {
    return dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForActionGroup";
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "isDataFieldForAnnotation".
   * isDataFieldForAnnotation has an inline $Type property that can be used.
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForAnnotation
   */
  _exports.isDataFieldForActionGroup = isDataFieldForActionGroup;
  function isDataFieldForAnnotation(dataField) {
    return dataField?.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation";
  }
  _exports.isDataFieldForAnnotation = isDataFieldForAnnotation;
  function isDataFieldForAction(dataField) {
    return dataField?.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction";
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForIntentBasedNavigation".
   * DataFieldForIntentBasedNavigation has an inline $Type property that can be used.
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForIntentBasedNavigation
   */
  _exports.isDataFieldForAction = isDataFieldForAction;
  function isDataFieldForIntentBasedNavigation(dataField) {
    return dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
   * DataField has a value defined.
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataFieldTypes
   */
  _exports.isDataFieldForIntentBasedNavigation = isDataFieldForIntentBasedNavigation;
  function isDataFieldTypes(dataField) {
    return dataField.hasOwnProperty("Value");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataField".
   * DataField has a value defined.
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataField
   */
  _exports.isDataFieldTypes = isDataFieldTypes;
  function isDataField(dataField) {
    return dataField?.hasOwnProperty("Value");
  }

  /**
   * Determines if the dataFieldForAnnotation is a field group.
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if the dataFieldForAnnotation is a field group.
   */
  _exports.isDataField = isDataField;
  function hasFieldGroupTarget(dataFieldForAnnotation) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    return isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.FieldGroupType");
  }

  /**
   * Determines if the dataFieldForAnnotation is a field group.
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if the dataFieldForAnnotation is a field group.
   */
  _exports.hasFieldGroupTarget = hasFieldGroupTarget;
  function hasIdentificationTarget(dataFieldForAnnotation) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    return isAnnotationOfTerm(dataFieldTarget, "com.sap.vocabularies.UI.v1.Identification");
  }

  /**
   * Determines if the dataFieldForAnnotation is a data point.
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if the dataFieldForAnnotation is a data point.
   */
  _exports.hasIdentificationTarget = hasIdentificationTarget;
  function hasDataPointTarget(dataFieldForAnnotation) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    return isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.DataPointType");
  }

  /**
   * Gets the binding expression for 'visible' setting for the action.
   * @param dataField The data field record which could be DataFieldForAction, DataFieldForIntentBasedNavigation or DataFieldForActionGroup
   * @param converterContext The converter context
   * @returns The binding expression to be used for setting 'visible' based on UI.Hidden configuration
   */
  _exports.hasDataPointTarget = hasDataPointTarget;
  function visibleExpression(dataField, converterContext) {
    return not(equal(getExpressionFromAnnotation(dataField?.annotations?.UI?.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true));
  }

  /**
   * Determine if the data model object path targeting a dataField for action opens up a dialog.
   * @param dataModelObjectPath DataModelObjectPath
   * @returns `Dialog` | `None` if a dialog is needed
   */
  _exports.visibleExpression = visibleExpression;
  function isDataModelObjectPathForActionWithDialog(dataModelObjectPath) {
    const target = dataModelObjectPath.targetObject;
    return isActionWithDialog(isDataFieldForAction(target) ? target : undefined);
  }

  /**
   * Determine if the dataField for action opens up a dialog.
   * @param dataField DataField for action
   * @returns `Dialog` | `None` if a dialog is needed
   */
  _exports.isDataModelObjectPathForActionWithDialog = isDataModelObjectPathForActionWithDialog;
  function isActionWithDialog(dataField) {
    const action = dataField?.ActionTarget;
    if (action) {
      const bCritical = action.annotations?.Common?.IsActionCritical;
      if (action.parameters.length > 1 || bCritical) {
        return "Dialog";
      } else {
        return "None";
      }
    } else {
      return "None";
    }
  }

  /**
   * Retrieves the TargetValue from a DataPoint.
   * @param source The target property or DataPoint
   * @returns The TargetValue as a decimal or a property path
   */
  _exports.isActionWithDialog = isActionWithDialog;
  function getTargetValueOnDataPoint(source) {
    let targetValue;
    if (isProperty(source)) {
      const dataPoint = source.annotations?.UI?.DataFieldDefault?.Target?.$target;
      targetValue = dataPoint?.TargetValue ?? dataPoint?.MaximumValue;
    } else {
      targetValue = source.TargetValue ?? source.MaximumValue;
    }
    if (typeof targetValue === "number") {
      return targetValue.toString();
    }
    return isPathAnnotationExpression(targetValue) ? targetValue : "100";
  }

  /**
   * Check if a property uses a DataPoint within a DataFieldDefault.
   * @param property The property to be checked
   * @returns `true` if the referenced property has a DataPoint within the DataFieldDefault, false else
   */
  _exports.getTargetValueOnDataPoint = getTargetValueOnDataPoint;
  const isDataPointFromDataFieldDefault = function (property) {
    return property.annotations?.UI?.DataFieldDefault?.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType";
  };

  /**
   * Check if a property uses a default visualization Rating through a DataFieldDefault.
   * @param property The property to be checked
   * @returns `true` if the visualization through a DataFieldDefault is a Rating
   */
  _exports.isDataPointFromDataFieldDefault = isDataPointFromDataFieldDefault;
  const isRatingVisualizationFromDataFieldDefault = function (property) {
    return isDataPointFromDataFieldDefault(property) && property.annotations?.UI?.DataFieldDefault?.Target?.$target?.Visualization === "UI.VisualizationType/Rating";
  };

  /**
   * Check if a property uses a Progress visualization Rating through a DataFieldDefault or a direct DataPoint.
   * @param property The property to be checked
   * @returns `true` if the visualization is a Progress
   */
  _exports.isRatingVisualizationFromDataFieldDefault = isRatingVisualizationFromDataFieldDefault;
  const isAProgressTypeFromDataPoint = function (property) {
    if (isProperty(property) && isDataPointFromDataFieldDefault(property)) {
      property = property.annotations.UI?.DataFieldDefault;
    }
    return property.Target?.$target?.Visualization === "UI.VisualizationType/Progress";
  };
  _exports.isAProgressTypeFromDataPoint = isAProgressTypeFromDataPoint;
  function getSemanticObjectPath(converterContext, object) {
    if (typeof object === "object") {
      if (isDataFieldTypes(object) && object.Value?.$target) {
        const property = object.Value?.$target;
        if (property?.annotations?.Common?.SemanticObject !== undefined) {
          return converterContext.getEntitySetBasedAnnotationPath(property?.fullyQualifiedName);
        }
      } else if (isProperty(object)) {
        if (object?.annotations?.Common?.SemanticObject !== undefined) {
          return converterContext.getEntitySetBasedAnnotationPath(object?.fullyQualifiedName);
        }
      }
    }
    return undefined;
  }

  /**
   * Returns the navigation path prefix for a property path.
   * @param path The property path For e.g. /EntityType/Navigation/Property
   * @returns The navigation path prefix For e.g. /EntityType/Navigation/
   */
  _exports.getSemanticObjectPath = getSemanticObjectPath;
  function _getNavigationPathPrefix(path) {
    if (path) {
      return path.includes("/") ? path.substring(0, path.lastIndexOf("/") + 1) : "";
    }
    return "";
  }

  /**
   * Collect additional properties for the ALP table use-case.
   *
   * For e.g. If UI.Hidden points to a property, include this property in the additionalProperties of ComplexPropertyInfo object.
   * @param target Property or DataField being processed
   * @param navigationPathPrefix Navigation path prefix, applicable in case of navigation properties.
   * @param tableType Table type.
   * @param relatedProperties The related properties identified so far.
   * @returns The related properties identified.
   */
  function _collectAdditionalPropertiesForAnalyticalTable(target, navigationPathPrefix, tableType, relatedProperties) {
    if (tableType === "AnalyticalTable") {
      const hiddenAnnotation = target.annotations?.UI?.Hidden;
      if (hiddenAnnotation?.path && isProperty(hiddenAnnotation.$target)) {
        const hiddenAnnotationPropertyPath = navigationPathPrefix + hiddenAnnotation.path;
        // This property should be added to additionalProperties map for the ALP table use-case.
        relatedProperties.additionalProperties[hiddenAnnotationPropertyPath] = hiddenAnnotation.$target;
      }
      const criticality = target.Criticality;
      if (criticality?.path && isProperty(criticality?.$target)) {
        const criticalityPropertyPath = navigationPathPrefix + criticality.path;
        relatedProperties.additionalProperties[criticalityPropertyPath] = criticality?.$target;
      }
    }
    return relatedProperties;
  }

  /**
   * Helper for collectRelatedProperties to push unique related properties.
   * @param relatedProperties
   * @param key The property path
   * @param value The properties object containing value property, description property...
   * @param displayModeOfPropertyUsedAsDescription The display mode if the property is referenced as description on text arrangement
   * @returns Index at which the property is available
   */
  function _setRelatedPropertiesAndGetIndex(relatedProperties, key, value, displayModeOfPropertyUsedAsDescription) {
    if (!relatedProperties.properties.hasOwnProperty(key)) {
      relatedProperties.properties[key] = {
        annotationProperty: value
      };
      if (displayModeOfPropertyUsedAsDescription) {
        relatedProperties.properties[key].displayModeOfPropertyUsedAsDescription = displayModeOfPropertyUsedAsDescription;
      }
    }
    return Object.keys(relatedProperties.properties).indexOf(key);
  }

  /**
   * Helper for collectRelatedProperties to append the export settings template with a formatted text.
   * @param relatedProperties
   * @param value Formatted text
   */
  function _appendTemplate(relatedProperties, value) {
    relatedProperties.exportSettings.template = relatedProperties.exportSettings?.template ? `${relatedProperties.exportSettings.template}${value}` : `${value}`;
  }

  /**
   * Collect related properties from a property's annotations.
   * @param path The property path
   * @param property The property to be considered
   * @param converterContext The converter context
   * @param ignoreSelf Whether to exclude the same property from the related properties.
   * @param tableType The table type.
   * @param relatedProperties The related properties identified so far.
   * @param addUnitInTemplate True if the unit/currency property needs to be added in the export template
   * @param isAnnotatedAsHidden True if the DataField or the property are statically hidden
   * @returns The related properties identified.
   */
  function collectRelatedProperties(path, property, converterContext, ignoreSelf, tableType) {
    let relatedProperties = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
      properties: {},
      additionalProperties: {},
      exportSettings: {}
    };
    let addUnitInTemplate = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    let isAnnotatedAsHidden = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
    if (path && property) {
      let valueIndex;
      /* EXTERNALID */
      const externalIdPath = getAssociatedExternalIdPropertyPath(property);
      const externalIdProperty = getAssociatedExternalIdProperty(property);
      if (isAnnotatedAsHidden) {
        // Collect underlying property
        valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
        _appendTemplate(relatedProperties, `{${valueIndex}}`);
        return relatedProperties;
      }
      const navigationPathPrefix = _getNavigationPathPrefix(path);
      const entityType = converterContext.getEntityType();
      const aggregationHelper = new AggregationHelper(entityType, converterContext);

      // Check for Text annotation.
      const textProperty = getAssociatedTextProperty(externalIdProperty || property);
      const textPropertyPath = getAssociatedTextPropertyPath(externalIdProperty || property);

      // get the DataModelObjectPath for the column
      const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
      const propertyDataModelObjectPath = enhanceDataModelPath(dataModelObjectPath, externalIdPath || path);
      const relativePath = getContextRelativeTargetObjectPath(propertyDataModelObjectPath);
      const textPropertyDataModelObjectPath = enhanceDataModelPath(propertyDataModelObjectPath, textPropertyPath);
      const textRelativePath = getContextRelativeTargetObjectPath(textPropertyDataModelObjectPath);
      if (relatedProperties.exportSettings?.template) {
        // FieldGroup use-case. Need to add each Field in new line.
        _appendTemplate(relatedProperties, "\n");
        relatedProperties.exportSettings.wrap = true;
      }

      // The text arrangement will be considered only if the text property is groupable
      const textArrangementToBeConsidered = tableType === "AnalyticalTable" && !!aggregationHelper.isPropertyGroupable(property) ? !!textProperty && !!aggregationHelper.isPropertyGroupable(textProperty) : true;
      if (textProperty && textRelativePath) {
        if (textArrangementToBeConsidered) {
          const pathForText = externalIdPath ? externalIdPath : path;
          const propertyForText = externalIdProperty ? externalIdProperty : property;
          // Check for Text Arrangement.
          const displayMode = getDisplayMode(propertyForText, propertyDataModelObjectPath);
          let descriptionIndex;
          switch (displayMode) {
            case "Description":
              descriptionIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, textRelativePath, textProperty, "Description");
              _appendTemplate(relatedProperties, `{${descriptionIndex}}`);
              break;
            case "ValueDescription":
              valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
              descriptionIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, textRelativePath, textProperty, "ValueDescription");
              _appendTemplate(relatedProperties, `{${valueIndex}} ({${descriptionIndex}})`);
              break;
            case "DescriptionValue":
              valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
              descriptionIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, textRelativePath, textProperty, "DescriptionValue");
              _appendTemplate(relatedProperties, `{${descriptionIndex}} ({${valueIndex}})`);
              break;
            default:
              valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
              _appendTemplate(relatedProperties, `{${valueIndex}}`);
              break;
          }
        } else {
          // Collect underlying property
          valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
          _appendTemplate(relatedProperties, `{${valueIndex}}`);
        }
      } else {
        // Check for field containing Currency Or Unit Properties or Timezone
        const currencyProperty = getAssociatedCurrencyProperty(property);
        const unitProperty = getAssociatedUnitProperty(property);
        const currencyOrUoMProperty = currencyProperty ?? unitProperty;
        const currencyOrUnitAnnotation = property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit;
        const timezoneProperty = getAssociatedTimezoneProperty(property);
        const timezoneAnnotation = property?.annotations?.Common?.Timezone;
        if (currencyOrUoMProperty) {
          collectCurrencyOrUnitProperties(relatedProperties, relativePath ?? path, addUnitInTemplate, propertyDataModelObjectPath, currencyOrUoMProperty, currencyProperty);
        } else if (timezoneProperty && timezoneAnnotation?.$target) {
          collectTimezoneProperties(property, relatedProperties, path, addUnitInTemplate);
        } else if (property.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType" && !property.Target?.$target?.ValueFormat || property.annotations?.UI?.DataFieldDefault?.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
          collectDataPointProperties(property, relatedProperties, relativePath);
        } else if (property.$Type === "com.sap.vocabularies.Communication.v1.ContactType") {
          const contactProperty = property.fn?.$target;
          const contactPropertyPath = property.fn?.path;
          valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, navigationPathPrefix ? navigationPathPrefix + contactPropertyPath : contactPropertyPath, contactProperty);
          _appendTemplate(relatedProperties, `{${valueIndex}}`);
        } else if (!ignoreSelf) {
          // Collect underlying property
          valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
          _appendTemplate(relatedProperties, `{${valueIndex}}`);
          if (currencyOrUnitAnnotation) {
            relatedProperties.exportSettings.unit = `${currencyOrUnitAnnotation}`; // Hard-coded currency/unit
            if (property?.annotations?.Measures?.ISOCurrency) {
              relatedProperties.exportSettings.isCurrency = true;
            }
          } else if (timezoneAnnotation) {
            relatedProperties.exportSettings.timezone = `${timezoneAnnotation}`; // Hard-coded timezone
          }
        }
      }
      relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(property, navigationPathPrefix, tableType, relatedProperties);
      if (Object.keys(relatedProperties.additionalProperties).length > 0 && Object.keys(relatedProperties.properties).length === 0) {
        // Collect underlying property if not collected already.
        // This is to ensure that additionalProperties are made available only to complex property infos.
        valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
        _appendTemplate(relatedProperties, `{${valueIndex}}`);
      }
    }
    return relatedProperties;
  }

  /**
   * Gets the type of Visualization of the DataPoint.
   * @param source Source of the DataPoint.
   * @returns The type of Visualization or undefined if there's none.
   */
  _exports.collectRelatedProperties = collectRelatedProperties;
  function getDataPointVisualization(source) {
    let dataPoint;
    if (isProperty(source)) {
      dataPoint = source.annotations?.UI?.DataFieldDefault?.Target?.$target;
    } else {
      dataPoint = source;
    }
    return dataPoint.Visualization ?? "UI.VisualizationType/Number";
  }

  /**
   *	Collect the related properties from a DataPoint.
   * @param property The property to be considered.
   * @param relatedProperties The related properties identified so far.
   * @param path The property path.
   */
  function collectDataPointProperties(property, relatedProperties, path) {
    // path must not be undefined, getContextRelativeTargetObjectPath may return undefined
    if (path === undefined) {
      return;
    }
    const dataPointProperty = property.Target?.$target?.Value.$target;
    const datapointTarget = property.Target?.$target;
    const navigationPathPrefix = _getNavigationPathPrefix(path);
    // DataPoint use-case using DataFieldDefault.
    const dataPointDefaultProperty = property.annotations?.UI?.DataFieldDefault;
    const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, dataPointDefaultProperty ? property : dataPointProperty);
    // If we have a DataPoint without visualization, or a Number, we don't have a TargetValue/MaximumValue
    if (getDataPointVisualization(dataPointDefaultProperty ? property : datapointTarget) === "UI.VisualizationType/Number") {
      return;
    }
    const targetValue = getTargetValueOnDataPoint(dataPointDefaultProperty ? property : datapointTarget);
    if (isPathAnnotationExpression(targetValue)) {
      if (targetValue.$target) {
        //in case it's a dynamic targetValue
        const dataPointIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, navigationPathPrefix ? navigationPathPrefix + targetValue.$target.name : targetValue.$target.name, targetValue.$target);
        relatedProperties.exportSettings.dataPointTargetValue = targetValue.path;
        _appendTemplate(relatedProperties, `{${valueIndex}}/{${dataPointIndex}}`);
      }
    } else if (hasStaticPercentUnit(dataPointDefaultProperty ? property : dataPointProperty) && isAProgressTypeFromDataPoint(property)) {
      relatedProperties.exportSettings.unit = "%";
    } else {
      relatedProperties.exportSettings.dataPointTargetValue = targetValue;
      _appendTemplate(relatedProperties, `{${valueIndex}}/${targetValue}`);
    }
  }

  /**
   *	Collect the related properties from a property with Timezone.
   * @param property The property to be considered.
   * @param relatedProperties The related properties identified so far.
   * @param path The property path.
   * @param addUnitInTemplate Should we add the unit in the template.
   */
  function collectTimezoneProperties(property, relatedProperties, path, addUnitInTemplate) {
    const timezoneAnnotation = property.annotations.Common.Timezone;
    const navigationPathPrefix = _getNavigationPathPrefix(path);
    const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
    const timezoneOrUoMIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, navigationPathPrefix + timezoneAnnotation.path, timezoneAnnotation.$target);
    if (addUnitInTemplate) {
      _appendTemplate(relatedProperties, `{${valueIndex}}  {${timezoneOrUoMIndex}}`);
    } else {
      relatedProperties.exportSettings.timezoneProperty = navigationPathPrefix + timezoneAnnotation.path;
    }
  }

  /**
   * Collect the related properties from a property with currencies or units.
   * @param relatedProperties The related properties identified so far for the column.
   * @param relativePath The property relative path.
   * @param addUnitInTemplate Specify if the unit should be added in the template.
   * @param propertyDataModelObjectPath The data model object path of the property to be considered.
   * @param currencyOrUoMProperty The currency or unit of measure property linked to the column.
   * @param currencyProperty The currency property linked to the column.
   */
  function collectCurrencyOrUnitProperties(relatedProperties, relativePath, addUnitInTemplate, propertyDataModelObjectPath, currencyOrUoMProperty, currencyProperty) {
    const property = propertyDataModelObjectPath.targetObject;
    if (property) {
      const currencyOrUnitPropertyPath = getAssociatedCurrencyPropertyPath(property) || getAssociatedUnitPropertyPath(property);
      const unitOrCurrencyPropertyDataModelObjectPath = enhanceDataModelPath(propertyDataModelObjectPath, currencyOrUnitPropertyPath);
      const unitOrCurrencyRelativePath = getContextRelativeTargetObjectPath(unitOrCurrencyPropertyDataModelObjectPath);
      const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, relativePath, property);
      const currencyOrUoMIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, unitOrCurrencyRelativePath, currencyOrUoMProperty);
      if (addUnitInTemplate) {
        _appendTemplate(relatedProperties, `{${valueIndex}}  {${currencyOrUoMIndex}}`);
      } else {
        relatedProperties.exportSettings.unitProperty = unitOrCurrencyRelativePath;
      }
      if (currencyProperty) {
        relatedProperties.exportSettings.isCurrency = true;
      }
      relatedProperties.exportSettings.scale = property.scale;
    }
  }

  /**
   * Collect properties consumed by a DataField.
   * This is for populating the ComplexPropertyInfos of the table delegate.
   * @param dataField The DataField for which the properties need to be identified.
   * @param converterContext The converter context.
   * @param tableType The table type.
   * @param relatedProperties The properties identified so far.
   * @param isEmbedded True if the DataField is embedded in another annotation (such as FieldGroup).
   * @returns The properties related to the DataField.
   */
  function collectRelatedPropertiesRecursively(dataField, converterContext, tableType) {
    let relatedProperties = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
      properties: {},
      additionalProperties: {},
      exportSettings: {}
    };
    let isEmbedded = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    let isStaticallyHidden = false;
    switch (dataField?.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        if (dataField.Value) {
          const property = dataField.Value;
          isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
          relatedProperties = collectRelatedProperties(property.path, property.$target, converterContext, false, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
          const navigationPathPrefix = _getNavigationPathPrefix(property.path);
          relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(dataField, navigationPathPrefix, tableType, relatedProperties);
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        switch (dataField.Target?.$target?.$Type) {
          case "com.sap.vocabularies.UI.v1.FieldGroupType":
            dataField.Target.$target.Data?.forEach(innerDataField => {
              relatedProperties = collectRelatedPropertiesRecursively(innerDataField, converterContext, tableType, relatedProperties, true);
            });
            break;
          case "com.sap.vocabularies.UI.v1.DataPointType":
            isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
            relatedProperties = collectRelatedProperties(dataField.Target.$target.Value.path, dataField, converterContext, false, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
            break;
          case "com.sap.vocabularies.Communication.v1.ContactType":
            const dataFieldContact = dataField.Target.$target;
            isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
            relatedProperties = collectRelatedProperties(dataField.Target.value, dataFieldContact, converterContext, isStaticallyHidden, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    return relatedProperties;
  }
  _exports.collectRelatedPropertiesRecursively = collectRelatedPropertiesRecursively;
  const getDataFieldDataType = function (oDataField) {
    if (isProperty(oDataField)) {
      return oDataField.type;
    }
    let sDataType;
    switch (oDataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        sDataType = undefined;
        break;
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        sDataType = oDataField?.Value?.$target?.type;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
      default:
        if (oDataField.Target?.$target?.$Type) {
          const dataFieldTarget = oDataField.Target.$target;
          if (dataFieldTarget.$Type === "com.sap.vocabularies.Communication.v1.ContactType" && isPathAnnotationExpression(dataFieldTarget.fn)) {
            sDataType = dataFieldTarget.fn.$target?.type;
          } else if (dataFieldTarget.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
            sDataType = dataFieldTarget.Value?.$Path?.$Type || dataFieldTarget.Value?.$target?.type;
          } else {
            // e.g. FieldGroup or Chart
            // FieldGroup Properties have no type, so we define it as a boolean type to prevent exceptions during the calculation of the width
            sDataType = oDataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.ChartDefinitionType" ? undefined : "Edm.Boolean";
          }
        } else {
          sDataType = undefined;
        }
        break;
    }
    return sDataType;
  };
  _exports.getDataFieldDataType = getDataFieldDataType;
  return _exports;
}, false);
//# sourceMappingURL=DataField-dbg.js.map

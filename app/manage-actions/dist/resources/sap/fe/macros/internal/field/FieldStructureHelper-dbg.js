/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TitleHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter", "sap/fe/macros/situations/SituationsIndicator", "sap/ui/mdc/enums/FieldEditMode"], function (BindingToolkit, CollaborationCommon, MetaModelConverter, DataField, CollaborationFormatters, valueFormatters, BindingHelper, MetaModelFunction, ModelHelper, StableIdHelper, TitleHelper, TypeGuards, DataModelPathHelper, PropertyHelper, SemanticObjectHelper, UIFormatters, FieldTemplating, additionalValueFormatter, SituationsIndicator, FieldEditMode) {
  "use strict";

  var _exports = {};
  var setEditStyleProperties = FieldTemplating.setEditStyleProperties;
  var isUsedInNavigationWithQuickViewFacets = FieldTemplating.isUsedInNavigationWithQuickViewFacets;
  var isRetrieveTextFromValueListEnabled = FieldTemplating.isRetrieveTextFromValueListEnabled;
  var hasPropertyInsertRestrictions = FieldTemplating.hasPropertyInsertRestrictions;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getValueBinding = FieldTemplating.getValueBinding;
  var getTextBindingExpression = FieldTemplating.getTextBindingExpression;
  var getDraftIndicatorVisibleBinding = FieldTemplating.getDraftIndicatorVisibleBinding;
  var getDataModelObjectPathForValue = FieldTemplating.getDataModelObjectPathForValue;
  var manageSemanticObjectsForCurrentUser = SemanticObjectHelper.manageSemanticObjectsForCurrentUser;
  var getPropertyWithSemanticObject = SemanticObjectHelper.getPropertyWithSemanticObject;
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var getAssociatedExternalIdPropertyPath = PropertyHelper.getAssociatedExternalIdPropertyPath;
  var getAssociatedExternalIdProperty = PropertyHelper.getAssociatedExternalIdProperty;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var generate = StableIdHelper.generate;
  var getRequiredPropertiesFromUpdateRestrictions = MetaModelFunction.getRequiredPropertiesFromUpdateRestrictions;
  var getRequiredPropertiesFromInsertRestrictions = MetaModelFunction.getRequiredPropertiesFromInsertRestrictions;
  var UI = BindingHelper.UI;
  var isDataField = DataField.isDataField;
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var transformRecursively = BindingToolkit.transformRecursively;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function setUpField(field, controlConfiguration, viewDataModel, internalModel, appComponent, isReadOnlyInitial, metaPath, contextPath) {
    const resultField = {
      ...field
    };
    Object.defineProperty(resultField, "value", {
      get: () => {
        return field.value;
      }
    });
    Object.defineProperty(resultField, "description", {
      get: () => {
        return field.description;
      }
    });
    resultField.change = field.change;
    resultField.metaPath = metaPath ? metaPath : field.metaPath;
    resultField.contextPath = contextPath ? contextPath : field.contextPath;
    resultField.visible = field.visible;

    //this currently works only for the field
    if (!resultField.vhIdPrefix) {
      resultField.vhIdPrefix = "FieldValueHelp";
      resultField._flexId = field.id;
      if (!resultField.idPrefix) {
        resultField.idPrefix = field.id;
      }
    }
    resultField.formatOptions ??= {};
    resultField.formatOptions = getFormatOptions(resultField);
    resultField.formatOptions.showOnlyUnitDecimals = viewDataModel?.getProperty("/sapFeManifestConfiguration/app/showOnlyUnitDecimals") === true;
    resultField.valueHelpMetaPath = metaPath ? metaPath : resultField.metaPath;
    computeCommonProperties(resultField, resultField.valueHelpMetaPath?.getModel());
    resultField.convertedMetaPath = setUpDataPointType(resultField.convertedMetaPath);
    setUpVisibleProperties(resultField);
    computeIDs(resultField);
    resultField.dataSourcePath = getTargetObjectPath(resultField.dataModelPath);

    /* EXTERNALID */
    computeExternalID(resultField);
    resultField.entityType = resultField.odataMetaModel.createBindingContext(`/${resultField.dataModelPath.targetEntityType.fullyQualifiedName}`);
    if (resultField.formatOptions?.forInlineCreationRows === true) {
      resultField.hasPropertyInsertRestrictions = hasPropertyInsertRestrictions(resultField.dataModelPath);
    }
    computeEditMode(resultField);
    computeCollaborationProperties(resultField);
    computeEditableExpressions(resultField);
    resultField.formatOptions = resultField.formatOptions ? resultField.formatOptions : {};
    setUpFormatOptions(resultField, resultField.dataModelPathExternalID || resultField.dataModelPath, controlConfiguration, viewDataModel);
    setUpDisplayStyle(resultField, resultField.convertedMetaPath, resultField.dataModelPath, internalModel, appComponent);
    setUpEditStyle(resultField, appComponent);
    resultField.valueState = setUpValueState(resultField);
    if (resultField.editStyle === "InputWithValueHelp") {
      resultField.editStylePlaceholder = setInputWithValuehelpPlaceholder(resultField);
    }
    computeFileUploaderProperties(resultField);
    computeInlineEditProperties(resultField, viewDataModel);

    // ---------------------------------------- compute bindings----------------------------------------------------
    const aDisplayStylesWithoutPropText = ["Avatar", "AmountWithCurrency"];
    if (resultField.displayStyle && !aDisplayStylesWithoutPropText.includes(resultField.displayStyle) && resultField.dataModelPath.targetObject) {
      resultField.text = resultField.text ?? resultField.value ?? FieldTemplating.getTextBinding(resultField.dataModelPathExternalID || resultField.dataModelPath, resultField.formatOptions);
    } else {
      resultField.text = "";
    }
    if (resultField.formatOptions.showEmptyIndicator) {
      resultField.emptyIndicatorMode = String(resultField.formatOptions.showEmptyIndicator) === "true" ? "On" : undefined;
    } else {
      resultField.emptyIndicatorMode = undefined;
    }

    // If the target is a property with a DataFieldDefault, use this as data field
    if (isProperty(resultField.convertedMetaPath) && resultField.convertedMetaPath.annotations?.UI?.DataFieldDefault !== undefined) {
      resultField.metaPath = resultField.odataMetaModel.createBindingContext(`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`, metaPath ? metaPath : resultField.metaPath);
    }
    if (!isReadOnlyInitial) {
      resultField.computedEditMode = compileExpression(ifElse(equal(resultField.readOnly, true), "Display", "Editable"));
    }
    resultField.eventHandlers = {
      change: () => {},
      liveChange: () => {},
      validateFieldGroup: () => {},
      handleTypeMissmatch: () => {},
      handleFileSizeExceed: () => {},
      handleUploadComplete: () => {},
      uploadStream: () => {},
      removeStream: () => {},
      handleOpenUploader: () => {},
      handleCloseUploader: () => {},
      openExternalLink: () => {},
      onFocusOut: () => {},
      linkPressed: () => {},
      displayAggregationDetails: () => {},
      onDataFieldWithNavigationPath: () => {},
      showCollaborationEditUser: () => {},
      onDataFieldActionButton: () => {},
      onDataFieldWithIBN: () => {}
    };
    return resultField;
  }

  /**
   * This helper computes the properties that are needed for the collaboration avatar.
   * @param field Reference to the current field instance
   */
  _exports.setUpField = setUpField;
  function computeCollaborationProperties(field) {
    const computedEditableExpression = UIFormatters.getEditableExpressionAsObject(field.propertyForFieldControl, field.convertedMetaPath, field.dataModelPath);
    if (ModelHelper.isCollaborationDraftSupported(field.odataMetaModel) && field.editMode !== FieldEditMode.Display) {
      const collaborationEnabled = true;
      // Expressions needed for Collaboration Visualization
      const collaborationExpression = UIFormatters.getCollaborationExpression(field.dataModelPath, CollaborationFormatters.hasCollaborationActivity);
      const editableExpression = compileExpression(and(computedEditableExpression, not(collaborationExpression)));
      const editMode = compileExpression(ifElse(collaborationExpression, constant("ReadOnly"), ifElse(and(UI.IsInactive, !!field.hasPropertyInsertRestrictions), "Display", field.editModeAsObject)));
      field.collaborationEnabled = collaborationEnabled;
      field.collaborationExpression = collaborationExpression;
      field.editableExpression = editableExpression;
      field.computedEditMode = editMode;
    } else {
      field.editableExpression = compileExpression(computedEditableExpression);
    }
  }

  /**
   * This helper sets the common properties convertedMetaPath, dataModelPath
   * and property that can be reused in the individual templates if required.
   * @param field Reference to the current field instance
   * @param metaModel
   */
  _exports.computeCollaborationProperties = computeCollaborationProperties;
  function computeCommonProperties(field, metaModel) {
    field.convertedMetaPath = MetaModelConverter.convertMetaModelContext(field.metaPathContext ? field.metaPathContext : field.metaPath);
    let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPathContext ? field.metaPathContext : field.metaPath, field.contextPath);
    dataModelPath = getDataModelObjectPathForValue(dataModelPath) || dataModelPath;
    field.dataModelPath = dataModelPath;
    field.property = dataModelPath.targetObject;
    field.odataMetaModel = metaModel;
    field.propertyForFieldControl = dataModelPath?.targetObject?.Value ? (dataModelPath?.targetObject).Value : dataModelPath?.targetObject;
  }

  /**
   * Helper to computes some of the expression for further processing.
   * @param field Reference to the current field instance
   */
  _exports.computeCommonProperties = computeCommonProperties;
  function computeEditableExpressions(field) {
    const requiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions((field.contextPathContext ? field.contextPathContext : field.contextPath)?.getPath().replaceAll("/$NavigationPropertyBinding/", "/"), field.odataMetaModel);
    const requiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions((field.contextPathContext ? field.contextPathContext : field.contextPath)?.getPath().replaceAll("/$NavigationPropertyBinding/", "/"), field.odataMetaModel);
    const oRequiredProperties = {
      requiredPropertiesFromInsertRestrictions: requiredPropertiesFromInsertRestrictions,
      requiredPropertiesFromUpdateRestrictions: requiredPropertiesFromUpdateRestrictions
    };
    const enabledExpression = UIFormatters.getEnabledExpression(field.propertyForFieldControl, field.convertedMetaPath, false, field.dataModelPath);
    const requiredExpression = UIFormatters.getRequiredExpression(field.propertyForFieldControl, field.convertedMetaPath, false, false, oRequiredProperties, field.dataModelPath);
    field.enabledExpression = enabledExpression;
    field.requiredExpression = requiredExpression;
  }
  _exports.computeEditableExpressions = computeEditableExpressions;
  function computeEditMode(field) {
    if (field.editMode !== undefined && field.editMode !== null) {
      // Even if it provided as a string it's a valid part of a binding expression that can be later combined into something else.
      field.editModeAsObject = field.editMode;
    } else {
      const measureReadOnly = field.formatOptions?.measureDisplayMode ? field.formatOptions.measureDisplayMode === "ReadOnly" : false;
      field.editModeAsObject = UIFormatters.getEditMode(field.propertyForFieldControl, field.dataModelPath, measureReadOnly, true, field.convertedMetaPath);
      field.computedEditMode = compileExpression(ifElse(and(UI.IsInactive, !!field.hasPropertyInsertRestrictions), "Display", field.editModeAsObject));
    }
  }
  _exports.computeEditMode = computeEditMode;
  function computeExternalID(field) {
    const externalIDProperty = getAssociatedExternalIdProperty(field.property);
    if (externalIDProperty) {
      if (field.property) field.property.type = externalIDProperty.type;
      if (isDataField(field.convertedMetaPath)) {
        field.convertedMetaPath.Value.$target.type = externalIDProperty.type;
      }
      const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(field.property);
      const externalIdContext = field.metaPath.getModel().createBindingContext(field.contextPath?.getPath() + "/" + externalIdPropertyPath, field.metaPath);
      field.convertedMetaPathExternalID = MetaModelConverter.convertMetaModelContext(externalIdContext);
      let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(externalIdContext, field.contextPath);
      dataModelPath = getDataModelObjectPathForValue(dataModelPath) || dataModelPath;
      field.dataModelPathExternalID = dataModelPath;
    }
  }

  /**
   * Calculate the fieldGroupIds for an Input or other edit control.
   * @param field
   * @param appComponent
   * @returns The fieldGroupIds
   */
  _exports.computeExternalID = computeExternalID;
  function computeFieldGroupIds(field, appComponent) {
    const typesForCollaborationFocusManagement = ["InputWithValueHelp", "TextArea", "DatePicker", "TimePicker", "DateTimePicker", "InputWithUnit", "Input", "InputMask", "Masked"];
    if (!appComponent) {
      //for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
      return;
    }
    const sideEffectService = appComponent.getSideEffectsService();
    const fieldGroupIds = sideEffectService.computeFieldGroupIds(field.dataModelPath.targetEntityType?.fullyQualifiedName ?? "", field.dataModelPath.targetObject?.fullyQualifiedName ?? "");
    field.mainPropertyRelativePath = isProperty(field.dataModelPath.targetObject) ? getContextRelativeTargetObjectPath(field.dataModelPath) : undefined;
    if (field.collaborationEnabled && typesForCollaborationFocusManagement.includes(field.editStyle || "")) {
      const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${field.dataSourcePath}`;
      fieldGroupIds.push(collaborationFieldGroup);
    }
    return fieldGroupIds.length ? fieldGroupIds : undefined;
  }

  /**
   * This helper is for the ID of the field according to several different scenarios.
   *
   * displayStyleId is used for all controls inside the field wrapper in display mode. A <sap.m.text> control would get this ID. An example is: ApplicationContext::Field-display.
   * editStyleId is used for all controls inside the field wrapper in edit mode. A <sap.ui.mdc.field> control would get this ID. An example is: ApplicationContext::Field-edit.
   *
   * If no wrapper exists the wrappers ID will be propagated to the first control displayed, A <sap.m.text> control would get this ID. An example is: ApplicationContext::Field-content.
   * @param field Reference to the current field instance
   */
  function computeIDs(field) {
    if (field._flexId && !field._apiId) {
      field._apiId = field._flexId;
      field._flexId = getContentId(field._flexId);
    }
    if (field.idPrefix) {
      field.editStyleId = generate([field.idPrefix, "Field-edit"]);
    }
    //NoWrapperId scenario is for the LR table.
    if (field.formatOptions?.fieldMode === "nowrapper" && field.editMode === "Display") {
      if (field._flexId) {
        field.displayStyleId = field._flexId;
      } else {
        field.displayStyleId = field.idPrefix ? generate([field.idPrefix, "Field-content"]) : undefined;
      }
    } else if (field.idPrefix) {
      field.displayStyleId = generate([field.idPrefix, "Field-display"]);
    }
  }

  /**
   * Sets the internal formatOptions for the building block.
   * @param field
   * @returns A string with the internal formatOptions for the building block
   */
  _exports.computeIDs = computeIDs;
  function getFormatOptions(field) {
    return {
      ...field.formatOptions,
      textAlignMode: field.formatOptions.textAlignMode ?? "Form",
      showEmptyIndicator: field.formatOptions.showEmptyIndicator ?? true,
      displayMode: field.formatOptions.displayMode,
      measureDisplayMode: field.formatOptions.measureDisplayMode,
      textLinesEdit: field.formatOptions.textLinesEdit,
      textMaxLines: field.formatOptions.textMaxLines,
      textMaxCharactersDisplay: field.formatOptions.textMaxCharactersDisplay,
      textExpandBehaviorDisplay: field.formatOptions.textExpandBehaviorDisplay,
      textMaxLength: field.formatOptions.textMaxLength,
      fieldEditStyle: field.formatOptions.fieldEditStyle,
      radioButtonsHorizontalLayout: field.formatOptions.radioButtonsHorizontalLayout,
      showTime: field.formatOptions.showTime,
      showTimezone: field.formatOptions.showTimezone,
      showDate: field.formatOptions.showDate
    };
  }
  _exports.getFormatOptions = getFormatOptions;
  function getObjectIdentifierText(fieldFormatOptions, propertyDataModelObjectPath) {
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(propertyDataModelObjectPath));
    const targetDisplayMode = fieldFormatOptions?.displayMode;
    const propertyDefinition = isPropertyPathExpression(propertyDataModelObjectPath.targetObject) ? propertyDataModelObjectPath.targetObject.$target : propertyDataModelObjectPath.targetObject;
    const commonText = propertyDefinition.annotations?.Common?.Text;
    if (commonText === undefined) {
      return undefined;
    }
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    switch (targetDisplayMode) {
      case "ValueDescription":
        const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
        return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
      case "DescriptionValue":
        return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
      default:
        return undefined;
    }
  }
  function getOverrides(controlConfiguration, id) {
    /*
    	Qualms: We need to use this TemplateProcessorSettings type to be able to iterate
    	over the properties later on and cast it afterwards as a field property type
    */
    const props = {};
    if (controlConfiguration) {
      const controlConfig = controlConfiguration[id];
      if (controlConfig) {
        Object.keys(controlConfig).forEach(function (configKey) {
          props[configKey] = controlConfig[configKey];
        });
      }
    }
    return props;
  }

  /**
   * Prepare the display style of the field in case of semantic objects or quickview facets.
   * @param field The field
   * @param internalModel
   * @param dataModelPath The DataModelObjectPath of the property
   * @param hasSemanticObjects
   * @param hasQuickView
   */
  function manageQuickViewForDisplayStyle(field, internalModel, dataModelPath, hasSemanticObjects, hasQuickView) {
    if (hasQuickView) {
      field.hasQuickView = true;
      field.quickViewType = "Facets";
    }
    if (hasSemanticObjects) {
      const foundSemanticObjects = manageSemanticObjectsForCurrentUser(field.semanticObject, dataModelPath, internalModel);
      if (foundSemanticObjects.hasReachableStaticSemanticObject || foundSemanticObjects.dynamicSemanticObjects.length) {
        field.hasQuickView = true;
        field.quickViewType = hasQuickView ? "FacetsAndSemanticLinks" : "SemanticLinks";
        field.dynamicSemanticObjects = foundSemanticObjects.hasReachableStaticSemanticObject !== true ? foundSemanticObjects.dynamicSemanticObjects : undefined;
      }
    }
  }

  /**
   * Check field to know if it has a semantic object.
   * @param field The field
   * @param dataModelPath The DataModelObjectPath of the property
   * @returns True if field has a semantic object
   */
  function propertyOrNavigationPropertyHasSemanticObject(field, dataModelPath) {
    return !!getPropertyWithSemanticObject(dataModelPath) || field.semanticObject !== undefined && field.semanticObject !== "";
  }
  function setInputWithValuehelpPlaceholder(field) {
    let targetEntityType;
    const editStylePlaceholder = field.editStylePlaceholder;
    const fieldContainerType = field.formatOptions.textAlignMode;
    if (fieldContainerType === "Table") {
      targetEntityType = field.dataModelPath.targetEntityType;
    }
    const propertyPath = field.dataModelPath.targetObject?.name;
    const recommendationValue = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderValue`);
    const recommendationDescription = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`);
    const placeholderExp = formatResult([recommendationValue, recommendationDescription, pathInModel(`/recommendationsData`, "internal"), pathInModel(`/currentCtxt`, "internal"), pathInModel(`${propertyPath}@$ui5.fe.messageType`), editStylePlaceholder, field.formatOptions.displayMode], additionalValueFormatter.formatPlaceholder, targetEntityType);
    return compileExpression(placeholderExp);
  }
  _exports.setInputWithValuehelpPlaceholder = setInputWithValuehelpPlaceholder;
  function setUpDataPointType(dataField) {
    // data point annotations need not have $Type defined, so add it if missing
    const dataPointType = {
      ...dataField
    };
    if (dataField?.term === "com.sap.vocabularies.UI.v1.DataPoint") {
      dataPointType.$Type = dataField.$Type || "com.sap.vocabularies.UI.v1.DataPointType";
    }
    return dataPointType;
  }
  _exports.setUpDataPointType = setUpDataPointType;
  function getDecimalPadding(appComponent, property) {
    const manifest = appComponent?.getManifestEntry("sap.fe");
    return property?.annotations?.Measures?.ISOCurrency ? manifest?.macros?.table?.currency?.decimalPadding ?? 3 : manifest?.macros?.table?.unitOfMeasure?.decimalPadding ?? 3;
  }
  _exports.getDecimalPadding = getDecimalPadding;
  function setUpDisplayStyle(field, dataField, dataModelPath, internalModel, appComponent) {
    const resultField = field;
    const property = dataModelPath.targetObject;
    if (!dataModelPath.targetObject) {
      resultField.displayStyle = "Text";
      return resultField;
    }
    resultField.hasUnitOrCurrency = property.annotations?.Measures?.Unit !== undefined || property.annotations?.Measures?.ISOCurrency !== undefined;
    resultField.hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit(dataModelPath);
    resultField.textFromValueList = compileExpression(formatResult([pathInModel(getContextRelativeTargetObjectPath(dataModelPath)), `/${property.fullyQualifiedName}`, resultField.formatOptions.displayMode], "sap.fe.macros.field.FieldRuntime.retrieveTextFromValueList"));
    if (property.annotations?.UI?.IsImage) {
      resultField.displayStyle = "File";
      return resultField;
    }
    if (property.annotations?.UI?.IsImageURL) {
      resultField.displayStyle = "Avatar";
      return resultField;
    }
    if (property.annotations?.UI?.InputMask) {
      resultField.displayStyle = "Text";
      return resultField;
    }
    if (property.annotations?.Common?.Masked) {
      resultField.displayStyle = "Masked";
      return resultField;
    }
    // For compatibility reasons, Stream will be shown within an entity instance as circle if the entity is annotated as IsNaturalPerson
    // and neither IsImage nor IsImageURL annotation has been used.
    if (property.type === "Edm.Stream") {
      resultField.displayStyle = "File";
      return resultField;
    }
    setUpDraftIndicator(dataModelPath, resultField);
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataPointType":
        resultField.displayStyle = "DataPoint";
        return resultField;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        if (dataField.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
          resultField.displayStyle = "DataPoint";
          return resultField;
        } else if (dataField.Target?.$target?.$Type === "com.sap.vocabularies.Communication.v1.ContactType") {
          resultField.displayStyle = "Contact";
          return resultField;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        resultField.displayStyle = "Button";
        return resultField;
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        resultField.displayStyle = "Link";
        return resultField;
    }
    const hasQuickView = isUsedInNavigationWithQuickViewFacets(dataModelPath, property);
    const hasSemanticObjects = propertyOrNavigationPropertyHasSemanticObject(resultField, dataModelPath);
    if (isSemanticKey(property, dataModelPath) && resultField.formatOptions.semanticKeyStyle) {
      manageQuickViewForDisplayStyle(resultField, internalModel, dataModelPath, hasSemanticObjects, hasQuickView);
      setUpObjectIdentifierTitleAndText(resultField, dataModelPath);
      resultField.showErrorIndicator = dataModelPath.contextLocation?.targetObject?._type === "NavigationProperty" && !resultField.formatOptions.fieldGroupDraftIndicatorPropertyPath;
      resultField.situationsIndicatorPropertyPath = dataModelPath.targetObject.name;
      resultField.displayStyle = resultField.formatOptions.semanticKeyStyle === "ObjectIdentifier" ? "ObjectIdentifier" : "LabelSemanticKey";
      return resultField;
    }
    if (dataField.Criticality) {
      manageQuickViewForDisplayStyle(resultField, internalModel, dataModelPath, hasSemanticObjects, hasQuickView);
      resultField.displayStyle = "ObjectStatus";
      return resultField;
    }
    if ((property.annotations?.Measures?.ISOCurrency || property.annotations?.Measures?.Unit) && String(resultField.formatOptions.isCurrencyOrUnitAligned) === "true" && resultField.formatOptions.measureDisplayMode !== "Hidden") {
      const decimalPadding = FieldStructureHelper.getDecimalPadding(appComponent, property);
      resultField.valueAsStringBindingExpression = resultField.value ? resultField.value : getValueBinding(dataModelPath, resultField.formatOptions, false, true, undefined, true, false, decimalPadding, true);
      resultField.unitBindingExpression = compileExpression(UIFormatters.getBindingForUnitOrCurrency(dataModelPath, true, !!field.formatOptions.showOnlyUnitDecimals));
      resultField.displayStyle = "NumberWithUnitOrCurrencyAligned";
      return resultField;
    }
    if (property.annotations?.Communication?.IsEmailAddress || property.annotations?.Communication?.IsPhoneNumber) {
      resultField.displayStyle = "Link";
      return resultField;
    }
    if (property.annotations?.UI?.MultiLineText) {
      resultField.displayStyle = "ExpandableText";
      return resultField;
    }
    if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
      resultField.displayStyle = "Link";
      return resultField;
    }
    resultField.displayStyle = "Text";
    manageQuickViewForDisplayStyle(resultField, internalModel, dataModelPath, hasSemanticObjects, hasQuickView);
    if (resultField.hasQuickView) {
      resultField.displayStyle = "LinkWithQuickView";
    }
    return resultField;
  }

  /**
   * This determines whether we should add a draft indicator within the field template.
   * @param dataModelPath DataModelObjectPath pointing to the main property for the field
   * @param field
   */
  _exports.setUpDisplayStyle = setUpDisplayStyle;
  function setUpDraftIndicator(dataModelPath, field) {
    if (isSemanticKey(dataModelPath.targetObject, dataModelPath)) {
      field.hasSituationsIndicator = SituationsIndicator.getSituationsNavigationProperty(dataModelPath.targetEntityType) !== undefined;
      if (dataModelPath.contextLocation?.targetEntitySet?.annotations?.Common?.DraftRoot && dataModelPath.targetEntitySet?.annotations?.Common?.DraftRoot && field.formatOptions?.hasDraftIndicator === true) {
        // In case of a grid table or tree table hasDraftIndicator will be false since the draft
        // indicator needs to be rendered into a separate column
        // Hence we then fall back to display styles ObjectIdentifier or LabelSemanticKey instead
        // of the combined ID and draft indicator style
        field.draftIndicatorVisible = getDraftIndicatorVisibleBinding(dataModelPath.targetObject?.name);
        field.addDraftIndicator = true;
      }
    }
  }
  function setUpEditStyle(field, appComponent) {
    const resultField = field;
    setEditStyleProperties(resultField, resultField.convertedMetaPath, resultField.dataModelPath);
    resultField.fieldGroupIds = computeFieldGroupIds(resultField, appComponent);
    return resultField;
  }
  _exports.setUpEditStyle = setUpEditStyle;
  function setUpObjectIdentifierTitleAndText(field, propertyDataModelObjectPath) {
    const semanticStyle = field.formatOptions?.semanticKeyStyle;
    const displayMode = field.formatOptions.displayMode;
    field.identifierTitle = getTitleBindingExpression(propertyDataModelObjectPath, getTextBindingExpression, {
      displayMode,
      splitTitleOnTwoLines: field.formatOptions.semanticKeyStyle === "ObjectIdentifier"
    }, undefined, undefined);
    field.identifierText = semanticStyle === "ObjectIdentifier" ? getObjectIdentifierText(field.formatOptions, propertyDataModelObjectPath) : undefined;
  }
  _exports.setUpObjectIdentifierTitleAndText = setUpObjectIdentifierTitleAndText;
  function setUpFormatOptions(field, dataModelPath, controlConfiguration, viewDataModel) {
    const overrideProps = getOverrides(controlConfiguration, (field.metaPathContext ? field.metaPathContext : field.metaPath).getPath());
    if (!field.formatOptions.displayMode) {
      field.formatOptions.displayMode = UIFormatters.getDisplayMode(dataModelPath);
    }
    if (field.formatOptions.displayMode === "Description") {
      field.valueAsStringBindingExpression = field.value ? field.value : getValueBinding(dataModelPath, field.formatOptions, true, true, undefined, true);
    }
    field.formatOptions.textLinesEdit = overrideProps.textLinesEdit || overrideProps.formatOptions && overrideProps.formatOptions.textLinesEdit || field.formatOptions.textLinesEdit || 4;
    field.formatOptions.textMaxLines = overrideProps.textMaxLines || overrideProps.formatOptions && overrideProps.formatOptions.textMaxLines || field.formatOptions.textMaxLines;

    // Retrieve text from value list as fallback feature for missing text annotation on the property
    if (viewDataModel?.getProperty("/retrieveTextFromValueList")) {
      field.formatOptions.retrieveTextFromValueList = isRetrieveTextFromValueListEnabled(dataModelPath.targetObject, field.formatOptions);
      if (field.formatOptions.retrieveTextFromValueList) {
        // Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
        const hasEntityTextArrangement = !!dataModelPath?.targetEntityType?.annotations?.UI?.TextArrangement;
        field.formatOptions.displayMode = hasEntityTextArrangement ? field.formatOptions.displayMode : "DescriptionValue";
      }
    }
  }
  _exports.setUpFormatOptions = setUpFormatOptions;
  function setUpValueState(field) {
    let valueStateExp;
    const fieldContainerType = field.formatOptions?.textAlignMode ? field.formatOptions?.textAlignMode : "Form";
    const propertyPathInModel = pathInModel(getContextRelativeTargetObjectPath(field.dataModelPath));
    const relativeLocation = getRelativePaths(field.dataModelPath);
    const textPath = getExpressionFromAnnotation(field.dataModelPath?.targetObject?.annotations?.Common?.Text, relativeLocation);
    const propertyPath = field.dataModelPath.targetObject?.name;
    const recommendationValue = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderValue`);
    const recommendationDescription = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`);
    if (fieldContainerType === "Table") {
      valueStateExp = formatResult([recommendationValue, recommendationDescription, pathInModel(`/recommendationsData`, "internal"), pathInModel(`/isEditable`, "ui"), field.dataSourcePath, propertyPathInModel, textPath], additionalValueFormatter.formatValueState, field.dataModelPath.targetEntityType);
    } else {
      valueStateExp = formatResult([recommendationValue, recommendationDescription, pathInModel(`/recommendationsData`, "internal"), pathInModel(`/isEditable`, "ui"), field.dataSourcePath, propertyPathInModel, textPath], additionalValueFormatter.formatValueState);
    }
    field.valueState = compileExpression(valueStateExp);
    return field.valueState;
  }
  _exports.setUpValueState = setUpValueState;
  function setUpVisibleProperties(field) {
    // we do this before enhancing the dataModelPath so that it still points at the DataField
    // const visibleProperties: Partial<fieldBlock> = {};
    const propertyDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPathContext ? field.metaPathContext : field.metaPath, field.contextPath);
    field.visible ??= getVisibleExpression(propertyDataModelObjectPath, field.formatOptions);
    field.displayVisible = field.formatOptions?.fieldMode === "nowrapper" ? field.visible : undefined;
  }
  _exports.setUpVisibleProperties = setUpVisibleProperties;
  function getContentId(macroId) {
    return `${macroId}-content`;
  }

  /**
   * Computes properties for the file templating.
   * @param field The field
   */
  function computeFileUploaderProperties(field) {
    if (field.displayStyle === "File") {
      field.fileRelativePropertyPath = getContextRelativeTargetObjectPath(field.dataModelPath) || "";
      const fileNameAnnotation = field.property.annotations.Core?.ContentDisposition?.Filename;
      if (isPathAnnotationExpression(fileNameAnnotation)) {
        const fileNameDataModelPath = enhanceDataModelPath(field.dataModelPath, fileNameAnnotation.path);
        field.fileFilenameExpression = getContextRelativeTargetObjectPath(fileNameDataModelPath) ?? "";
      }
    }
  }

  /**
   * Computes properties for the inline edit templating.
   * @param field The field
   * @param viewDataModel
   */
  function computeInlineEditProperties(field, viewDataModel) {
    if (field.displayStyle === "File" || field.displayStyle === "Avatar") {
      field.inlineEditEnabled = undefined;
      return;
    }
    field.inlineEditEnabled = field.inlineEditEnabled === true || viewDataModel?.getProperty("/isInlineEditEnabled") === true ? true : undefined;
    if (field.inlineEditEnabled && field.editModeAsObject !== "Display") {
      const computedEditableExpression = UIFormatters.getEditableExpressionAsObject(field.propertyForFieldControl, field.convertedMetaPath, field.dataModelPath);
      field.hasInlineEdit = transformRecursively(computedEditableExpression, "PathInModel", expr => {
        if (expr.path === "isEditable" && expr.modelName === "ui") {
          return constant(true);
        }
        return expr;
      }, true);
    }
  }
  const FieldStructureHelper = {
    getDecimalPadding,
    setUpField,
    computeExternalID,
    setUpDisplayStyle,
    setUpObjectIdentifierTitleAndText,
    setUpValueState
  };
  return FieldStructureHelper;
}, false);
//# sourceMappingURL=FieldStructureHelper-dbg.js.map

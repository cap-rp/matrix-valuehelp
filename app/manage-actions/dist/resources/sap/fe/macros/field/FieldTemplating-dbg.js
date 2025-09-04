/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CommonFormatters", "sap/fe/core/templating/DataFieldFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/core/templating/UIFormatters", "sap/m/AvatarShape", "sap/ui/model/json/JSONModel", "./FieldHelper"], function (BindingToolkit, DataField, valueFormatters, TypeGuards, CommonFormatters, DataFieldFormatters, DataModelPathHelper, PropertyHelper, SemanticObjectHelper, UIFormatters, AvatarShape, JSONModel, FieldHelper) {
  "use strict";

  var _exports = {};
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var getContextPropertyRestriction = DataModelPathHelper.getContextPropertyRestriction;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var generateVisibleExpression = DataFieldFormatters.generateVisibleExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var transformRecursively = BindingToolkit.transformRecursively;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var isComplexTypeExpression = BindingToolkit.isComplexTypeExpression;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Recursively add the text arrangement to a binding expression.
   * @param bindingExpressionToEnhance The binding expression to be enhanced
   * @param fullContextPath The current context path we're on (to properly resolve the text arrangement properties)
   * @returns An updated expression containing the text arrangement binding.
   */
  const addTextArrangementToBindingExpression = function (bindingExpressionToEnhance, fullContextPath) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      let outExpression = expression;
      if (expression.modelName === undefined) {
        // In case of default model we then need to resolve the text arrangement property
        const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
        outExpression = CommonFormatters.getBindingWithTextArrangement(oPropertyDataModelPath, expression);
      }
      return outExpression;
    });
  };
  _exports.addTextArrangementToBindingExpression = addTextArrangementToBindingExpression;
  const formatValueRecursively = function (bindingExpressionToEnhance, fullContextPath) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      let outExpression = expression;
      if (expression.modelName === undefined) {
        // In case of default model we then need to resolve the text arrangement property
        const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
        if (oPropertyDataModelPath.targetObject) {
          outExpression = formatWithTypeInformation(oPropertyDataModelPath.targetObject, expression);
        }
      }
      return outExpression;
    });
  };
  _exports.formatValueRecursively = formatValueRecursively;
  const getTextBindingExpression = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    return getTextBinding(oPropertyDataModelObjectPath, fieldFormatOptions, true);
  };
  _exports.getTextBindingExpression = getTextBindingExpression;
  const getTextBinding = function (inputDataModelPath, fieldFormatOptions) {
    let asObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let customFormatter = arguments.length > 3 ? arguments[3] : undefined;
    if (isAnnotationOfType(inputDataModelPath.targetObject, ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataPointType", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataFieldWithUrl", "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithAction"])) {
      // If there is no resolved property, the value is returned as a constant
      const fieldValue = getExpressionFromAnnotation(inputDataModelPath.targetObject.Value) ?? "";
      return compileExpression(fieldValue);
    }
    if (isPathAnnotationExpression(inputDataModelPath.targetObject) && inputDataModelPath.targetObject.$target) {
      inputDataModelPath = enhanceDataModelPath(inputDataModelPath, inputDataModelPath.targetObject.path);
    }
    // When targetObject is a constant value
    if (typeof inputDataModelPath.targetObject === "string") {
      return inputDataModelPath.targetObject;
    }
    const oPropertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(inputDataModelPath));
    let oTargetBinding;
    const propertyDataModelObjectPath = inputDataModelPath; // At this point we should only have a property
    const oTargetProperty = propertyDataModelObjectPath.targetObject;
    // formatting

    if (oTargetProperty?.annotations?.UI?.InputMask) {
      oTargetBinding = formatWithTypeInformation(oTargetProperty, oPropertyBindingExpression);
      oTargetBinding.type = "sap.fe.core.type.InputMask";
      oTargetBinding.formatOptions = {
        mask: oTargetProperty.annotations?.UI?.InputMask?.Mask.toString(),
        placeholderSymbol: oTargetProperty.annotations?.UI?.InputMask?.PlaceholderSymbol.toString(),
        maskRule: _getMaskingRules(oTargetProperty.annotations?.UI?.InputMask?.Rules)
      };
    } else if (oTargetProperty?.annotations?.Common?.Masked?.valueOf()) {
      oTargetBinding = formatWithTypeInformation(oTargetProperty, oPropertyBindingExpression);
      oTargetBinding.formatOptions = {
        editStyle: "Masked"
      };
    } else if (oTargetProperty?.annotations?.Measures?.Unit || oTargetProperty?.annotations?.Measures?.ISOCurrency) {
      oTargetBinding = UIFormatters.getBindingWithUnitOrCurrency(propertyDataModelObjectPath, oPropertyBindingExpression, undefined, {}, true, fieldFormatOptions.showOnlyUnitDecimals);
      if (fieldFormatOptions?.measureDisplayMode === "Hidden" && isComplexTypeExpression(oTargetBinding)) {
        // TODO: Refactor once types are less generic here
        oTargetBinding.formatOptions = {
          ...oTargetBinding.formatOptions,
          showMeasure: false
        };
      }
    } else if (oTargetProperty?.annotations?.Common?.Timezone && oTargetProperty.type == "Edm.DateTimeOffset") {
      oTargetBinding = UIFormatters.getBindingWithTimezone(propertyDataModelObjectPath, oPropertyBindingExpression, false, true, fieldFormatOptions);
    } else if (oTargetProperty?.annotations?.Common?.IsTimezone) {
      oTargetBinding = UIFormatters.getBindingForTimezone(propertyDataModelObjectPath, oPropertyBindingExpression);
    } else if (oTargetProperty?.annotations?.UI?.DateTimeStyle || fieldFormatOptions?.dateTimePattern || fieldFormatOptions?.dateTimeStyle) {
      oTargetBinding = UIFormatters.getBindingForDateFormat(propertyDataModelObjectPath, oPropertyBindingExpression, fieldFormatOptions);
    } else {
      oTargetBinding = CommonFormatters.getBindingWithTextArrangement(propertyDataModelObjectPath, oPropertyBindingExpression, fieldFormatOptions, customFormatter);
    }
    if (asObject) {
      return oTargetBinding;
    }
    // We don't include $$nopatch and parseKeepEmptyString as they make no sense in the text binding case
    return compileExpression(oTargetBinding);
  };
  _exports.getTextBinding = getTextBinding;
  const getValueBinding = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    let ignoreUnit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let ignoreFormatting = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let bindingParameters = arguments.length > 4 ? arguments[4] : undefined;
    let targetTypeAny = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    let keepUnit = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    let decimalPadding = arguments.length > 7 ? arguments[7] : undefined;
    let forDisplay = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : false;
    let asObject = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : false;
    if (isPathAnnotationExpression(oPropertyDataModelObjectPath.targetObject) && oPropertyDataModelObjectPath.targetObject.$target) {
      const oNavPath = oPropertyDataModelObjectPath.targetEntityType.resolvePath(oPropertyDataModelObjectPath.targetObject.path, true);
      oPropertyDataModelObjectPath.targetObject = oNavPath.target;
      oNavPath.visitedObjects.forEach(oNavObj => {
        if (isNavigationProperty(oNavObj)) {
          oPropertyDataModelObjectPath.navigationProperties.push(oNavObj);
        }
      });
    }
    const targetObject = oPropertyDataModelObjectPath.targetObject;
    if (isProperty(targetObject)) {
      let oBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oPropertyDataModelObjectPath));
      if (isPathInModelExpression(oBindingExpression)) {
        if (targetObject.annotations?.Communication?.IsEmailAddress) {
          oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
          oBindingExpression.type = "sap.fe.core.type.Email";
        } else if (targetObject.annotations?.UI?.InputMask) {
          oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
          oBindingExpression.type = "sap.fe.core.type.InputMask";
          oBindingExpression.formatOptions = {
            ...oBindingExpression.formatOptions,
            mask: targetObject.annotations.UI.InputMask.Mask,
            placeholderSymbol: targetObject.annotations.UI.InputMask.PlaceholderSymbol,
            maskRule: _getMaskingRules(targetObject.annotations.UI.InputMask.Rules)
          };
        } else if (targetObject.annotations?.Common?.Masked?.valueOf()) {
          oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
          oBindingExpression.formatOptions = {
            ...oBindingExpression.formatOptions,
            style: "password"
          };
        } else if (!ignoreUnit && (targetObject.annotations?.Measures?.ISOCurrency || targetObject.annotations?.Measures?.Unit)) {
          const targetFormatOptions = {};
          if (!keepUnit) {
            targetFormatOptions["showMeasure"] = false;
          }
          if (String(fieldFormatOptions.isCurrencyOrUnitAligned) === "true") {
            targetFormatOptions["decimalPadding"] = decimalPadding;
          }
          oBindingExpression = UIFormatters.getBindingWithUnitOrCurrency(oPropertyDataModelObjectPath, oBindingExpression, true, keepUnit ? undefined : targetFormatOptions, forDisplay, fieldFormatOptions.showOnlyUnitDecimals);
        } else if (targetObject?.annotations?.Common?.IsTimezone) {
          oBindingExpression = UIFormatters.getBindingForTimezone(oPropertyDataModelObjectPath, oBindingExpression);
        } else if (targetObject?.annotations?.UI?.DateTimeStyle || fieldFormatOptions?.dateTimePattern || fieldFormatOptions?.dateTimeStyle) {
          oBindingExpression = UIFormatters.getBindingForDateFormat(oPropertyDataModelObjectPath, oBindingExpression, fieldFormatOptions);
        } else if (targetObject?.annotations?.Common?.Timezone && targetObject.type === "Edm.DateTimeOffset") {
          oBindingExpression = UIFormatters.getBindingWithTimezone(oPropertyDataModelObjectPath, oBindingExpression, true);
        } else {
          oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
          if (targetObject.annotations.Common?.ExternalID) {
            oBindingExpression.path += "@$ui5.fe.@Common/ExternalID";
          }
        }
        if (isPathInModelExpression(oBindingExpression)) {
          if (ignoreFormatting) {
            delete oBindingExpression.formatOptions;
            delete oBindingExpression.constraints;
            delete oBindingExpression.type;
          }
          if (bindingParameters) {
            oBindingExpression.parameters = bindingParameters;
          }
          if (targetTypeAny) {
            oBindingExpression.targetType = "any";
          }
        }
        if (asObject) {
          return oBindingExpression;
        }
        return compileExpression(oBindingExpression);
      } else {
        // if somehow we could not compile the binding -> return empty string
        return "";
      }
    } else if (targetObject?.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || targetObject?.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
      return compileExpression(getExpressionFromAnnotation(targetObject.Value));
    } else {
      return "";
    }
  };
  _exports.getValueBinding = getValueBinding;
  const getAssociatedTextBinding = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    const textPropertyPath = PropertyHelper.getAssociatedTextPropertyPath(oPropertyDataModelObjectPath.targetObject);
    if (textPropertyPath) {
      const oTextPropertyPath = enhanceDataModelPath(oPropertyDataModelObjectPath, textPropertyPath);
      //BCP 2380120806: getValueBinding needs to be able to set formatOptions.parseKeepsEmptyString.
      //Otherwise emptying an input field that has a text annotation to a not nullable string would result in
      //an error message. Therefore import param 'ignoreFormatting' is now set to false.
      let allowPatch = false;
      const valueListOutParameters = oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.ValueList?.Parameters.map(parameter => {
        if (!parameter) {
          return "";
        }
        return parameter?.LocalDataProperty?.$target?.fullyQualifiedName ?? "";
      }) || [];
      if (oTextPropertyPath?.targetObject?.fullyQualifiedName && valueListOutParameters.includes(oTextPropertyPath.targetObject.fullyQualifiedName)) {
        allowPatch = true;
      }
      const bindingParameters = allowPatch ? undefined : {
        $$noPatch: true
      };
      return getValueBinding(oTextPropertyPath, fieldFormatOptions, true, false, bindingParameters, false, false, undefined, true);
    }
    return undefined;
  };
  _exports.getAssociatedTextBinding = getAssociatedTextBinding;
  const isUsedInNavigationWithQuickViewFacets = function (oDataModelPath, oProperty) {
    const aNavigationProperties = oDataModelPath?.targetEntityType?.navigationProperties || [];
    const aSemanticObjects = oDataModelPath?.targetEntityType?.annotations?.Common?.SemanticKey || [];
    let bIsUsedInNavigationWithQuickViewFacets = false;
    aNavigationProperties.forEach(oNavProp => {
      if (oNavProp.referentialConstraint && oNavProp.referentialConstraint.length) {
        oNavProp.referentialConstraint.forEach(oRefConstraint => {
          if (oRefConstraint?.sourceProperty === oProperty.name) {
            if (oNavProp?.targetType?.annotations?.UI?.QuickViewFacets) {
              bIsUsedInNavigationWithQuickViewFacets = true;
            }
          }
        });
      }
    });
    if (oDataModelPath.contextLocation?.targetEntitySet !== oDataModelPath.targetEntitySet) {
      const aIsTargetSemanticKey = aSemanticObjects.some(function (oSemantic) {
        return oSemantic?.$target?.name === oProperty.name;
      });
      if ((aIsTargetSemanticKey || oProperty.isKey) && oDataModelPath?.targetEntityType?.annotations?.UI?.QuickViewFacets) {
        bIsUsedInNavigationWithQuickViewFacets = true;
      }
    }
    return bIsUsedInNavigationWithQuickViewFacets;
  };
  _exports.isUsedInNavigationWithQuickViewFacets = isUsedInNavigationWithQuickViewFacets;
  const isRetrieveTextFromValueListEnabled = function (oPropertyPath, fieldFormatOptions) {
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    if (!oProperty.annotations?.Common?.Text && !oProperty.annotations?.Measures && PropertyHelper.hasValueHelp(oProperty) && fieldFormatOptions.textAlignMode === "Form") {
      return true;
    }
    return false;
  };

  /**
   * Calculates text alignment based on the dataModelObjectPath.
   * @param dataFieldModelPath The property's type
   * @param formatOptions The field format options
   * @param formatOptions.displayMode Display format
   * @param formatOptions.textAlignMode Text alignment of the field
   * @param computedEditMode The editMode used in this case
   * @param considerTextAnnotation Whether to consider the text annotation when computing the alignment
   * @returns The property alignment
   */
  _exports.isRetrieveTextFromValueListEnabled = isRetrieveTextFromValueListEnabled;
  const getTextAlignment = function (dataFieldModelPath, formatOptions, computedEditMode) {
    let considerTextAnnotation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    // check for the target value type directly, or in case it is pointing to a DataPoint we look at the dataPoint's value
    let typeForAlignment = dataFieldModelPath.targetObject?.Value?.$target.type || dataFieldModelPath.targetObject?.Target?.$target?.Value.$target.type;
    if (PropertyHelper.isKey(dataFieldModelPath.targetObject?.Value?.$target || dataFieldModelPath.targetObject?.Target?.$target?.Value?.$target)) {
      return "Begin";
    }
    if (considerTextAnnotation && formatOptions.displayMode && ["Description", "DescriptionValue", "ValueDescription"].includes(formatOptions.displayMode)) {
      const textAnnotation = dataFieldModelPath.targetObject?.Value?.$target.annotations?.Common?.Text;
      const textArrangementAnnotation = textAnnotation?.annotations?.UI?.TextArrangement.valueOf();
      if (textAnnotation && textArrangementAnnotation !== "UI.TextArrangementType/TextSeparate") {
        typeForAlignment = textAnnotation.$target.type;
      }
    }
    return FieldHelper.getPropertyAlignment(typeForAlignment, formatOptions, computedEditMode);
  };

  /**
   * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
   *
   * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
   * @param dataFieldModelPath The metapath referring to the annotation we are evaluating.
   * @param [formatOptions] FormatOptions optional.
   * @param formatOptions.isAnalytics This flag is set when using an analytical table.
   * @returns An expression that you can bind to the UI.
   */
  _exports.getTextAlignment = getTextAlignment;
  const getVisibleExpression = function (dataFieldModelPath, formatOptions) {
    return compileExpression(generateVisibleExpression(dataFieldModelPath, formatOptions));
  };

  /**
   * Returns the Boolean or other expression for the visibility of a FormElement.
   * The FormElement is visible if at least one content is visible, otherwise invisible.
   * @param dataFieldModelPath The metapath referring to the annotation we are evaluating.
   * @returns A Boolean or other expression that can be bound to the UI.
   */
  _exports.getVisibleExpression = getVisibleExpression;
  const visibleExpressionsForConnectedFieldsFormElement = function (dataFieldModelPath) {
    const dataFieldForAnnotation = dataFieldModelPath.targetObject;
    const visibleExpression = compileExpression(generateVisibleExpression(dataFieldModelPath));
    const dataFieldsBindingExpressions = [];
    if (typeof visibleExpression === "string" && visibleExpression.includes("{=")) {
      return visibleExpression;
    }
    if (dataFieldForAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataFieldForAnnotation.Target.$target?.$Type === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
      const connectedFields = Object.values(dataFieldForAnnotation.Target.$target.Data).filter(connectedField => connectedField?.hasOwnProperty("Value"));
      connectedFields.forEach(dataField => {
        dataFieldModelPath.targetObject = dataField;
        const bindingExpressionObject = generateVisibleExpression(dataFieldModelPath);
        if (bindingExpressionObject !== undefined) {
          dataFieldsBindingExpressions.push(bindingExpressionObject);
        }
      });
      /* Combine the expressions with or */
      return dataFieldsBindingExpressions.length ? compileExpression(or(...dataFieldsBindingExpressions)) : visibleExpression;
    }
    return visibleExpression;
  };

  /**
   * Returns the binding for a property in a QuickViewFacets.
   * @param propertyDataModelObjectPath The DataModelObjectPath of the property
   * @returns A string of the value, or a BindingExpression
   */
  _exports.visibleExpressionsForConnectedFieldsFormElement = visibleExpressionsForConnectedFieldsFormElement;
  const getQuickViewBinding = function (propertyDataModelObjectPath) {
    if (!propertyDataModelObjectPath.targetObject) {
      return "";
    }
    if (typeof propertyDataModelObjectPath.targetObject === "string") {
      return propertyDataModelObjectPath.targetObject;
    }
    return getTextBinding(propertyDataModelObjectPath, {});
  };

  /**
   * Return the type of the QuickViewGroupElement.
   * @param dataFieldDataModelObjectPath The DataModelObjectPath of the DataField
   * @returns The type of the QuickViewGroupElement
   */
  _exports.getQuickViewBinding = getQuickViewBinding;
  const getQuickViewType = function (dataFieldDataModelObjectPath) {
    const targetObject = dataFieldDataModelObjectPath.targetObject;
    if (isAnnotationOfType(targetObject, "com.sap.vocabularies.UI.v1.DataFieldWithUrl") && targetObject?.Url) {
      return "link";
    }
    if (!isProperty(targetObject) && targetObject?.Value.$target?.annotations?.Communication?.IsEmailAddress || isProperty(targetObject) && targetObject?.annotations?.Communication?.IsEmailAddress) {
      return "email";
    }
    if (!isProperty(targetObject) && targetObject?.Value.$target?.annotations?.Communication?.IsPhoneNumber || isProperty(targetObject) && targetObject?.annotations?.Communication?.IsPhoneNumber) {
      return "phone";
    }
    return "text";
  };
  _exports.getQuickViewType = getQuickViewType;
  const getSemanticObjects = function (aSemObjExprToResolve) {
    if (aSemObjExprToResolve.length > 0) {
      let sCustomDataKey = "";
      let sCustomDataValue = "";
      const aSemObjCustomData = [];
      for (const item of aSemObjExprToResolve) {
        sCustomDataKey = item.key;
        sCustomDataValue = compileExpression(getExpressionFromAnnotation(item.value));
        aSemObjCustomData.push({
          key: sCustomDataKey,
          value: sCustomDataValue
        });
      }
      const oSemanticObjectsModel = new JSONModel(aSemObjCustomData);
      oSemanticObjectsModel.$$valueAsPromise = true;
      return oSemanticObjectsModel.createBindingContext("/");
    } else {
      return new JSONModel([]).createBindingContext("/");
    }
  };

  /**
   * Method to get MultipleLines for a DataField.
   * @param {any} oThis The current object
   * @param {boolean} isMultiLineText The property isMultiLineText
   * @returns {CompiledBindingToolkitExpression<string>} The binding expression to determine if a data field should be a MultiLineText or not
   * @public
   */
  _exports.getSemanticObjects = getSemanticObjects;
  const getMultipleLinesForDataField = function (oThis, isMultiLineText) {
    if (oThis.wrap === false) {
      return false;
    }
    return isMultiLineText;
  };
  _exports.getMultipleLinesForDataField = getMultipleLinesForDataField;
  const _hasValueHelpToShow = function (oProperty, measureDisplayMode) {
    // we show a value help if teh property has one or if its visible unit has one
    const oPropertyUnit = PropertyHelper.getAssociatedUnitProperty(oProperty);
    const oPropertyCurrency = PropertyHelper.getAssociatedCurrencyProperty(oProperty);
    return PropertyHelper.hasValueHelp(oProperty) && oProperty.type !== "Edm.Boolean" || measureDisplayMode !== "Hidden" && (oPropertyUnit && PropertyHelper.hasValueHelp(oPropertyUnit) || oPropertyCurrency && PropertyHelper.hasValueHelp(oPropertyCurrency));
  };

  /**
   * Sets the minimum and maximum date for the date field.
   * @param dateAnnotation Property Annotations for the date field.
   * @param type Either 'Maximum' or 'Minimum'.
   * @param relativeLocation
   * @returns Mininum or Maximum date expression.
   */
  const getMinMaxDateExpression = function (dateAnnotation, type, relativeLocation) {
    const fixedDate = dateAnnotation?.Validation?.[type]?.$Date;
    const dateProperty = dateAnnotation?.Validation?.[type];
    if (fixedDate) {
      return formatResult([constant(fixedDate)], valueFormatters.provideDateInstance);
    } else if (dateProperty) {
      return BindingToolkit.getExpressionFromAnnotation(dateAnnotation?.Validation?.[type], relativeLocation);
    }
    return undefined;
  };

  /**
   * Sets Edit Style properties for Field in case of Macro Field and MassEditDialog fields.
   * @param oProps Field Properties for the Macro Field.
   * @param oDataField DataField Object.
   * @param oDataModelPath DataModel Object Path to the property.
   * @param onlyEditStyle To add only editStyle.
   */
  _exports.getMinMaxDateExpression = getMinMaxDateExpression;
  const setEditStyleProperties = function (oProps, oDataField, oDataModelPath, onlyEditStyle) {
    const oProperty = oDataModelPath.targetObject;
    if (!isProperty(oProperty) || ["com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataFieldForActionGroup", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"].includes(oDataField.$Type)) {
      oProps.editStyle = null;
      return;
    }
    if (!onlyEditStyle) {
      if (oProperty?.annotations?.Validation?.Maximum?.$Date || oProperty?.annotations?.Validation?.Minimum?.$Date) {
        const propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oDataModelPath));
        oProps.valueBindingExpression = UIFormatters.getBindingForDatePicker(oDataModelPath, propertyBindingExpression);
      } else {
        oProps.valueBindingExpression = oProps.value ? oProps.value : getValueBinding(oDataModelPath, oProps.formatOptions);
      }
      const editStylePlaceholder = oDataField.annotations?.UI?.Placeholder || oDataField?.Value?.$target?.annotations?.UI?.Placeholder;
      if (editStylePlaceholder) {
        oProps.editStylePlaceholder = compileExpression(getExpressionFromAnnotation(editStylePlaceholder));
      }
    }

    // Setup RatingIndicator
    const dataPointAnnotation = isDataFieldForAnnotation(oDataField) ? oDataField.Target?.$target : oDataField;
    if (dataPointAnnotation?.Visualization === "UI.VisualizationType/Rating") {
      oProps.editStyle = "RatingIndicator";
      if (dataPointAnnotation.annotations?.Common?.QuickInfo) {
        oProps.ratingIndicatorTooltip = compileExpression(getExpressionFromAnnotation(dataPointAnnotation.annotations?.Common?.QuickInfo));
      }
      oProps.ratingIndicatorTargetValue = compileExpression(getExpressionFromAnnotation(dataPointAnnotation.TargetValue));
      return;
    }
    if (_hasValueHelpToShow(oProperty, oProps.formatOptions?.measureDisplayMode) || oProps.formatOptions?.measureDisplayMode !== "Hidden" && (oProperty.annotations?.Measures?.ISOCurrency || oProperty.annotations?.Measures?.Unit && !hasStaticPercentUnit(oProperty))) {
      if (!onlyEditStyle) {
        /* The textBindingExpression is used for mdcField-attribute 'additionalValue' and means the description of the value */
        const textBindingExpression = oProperty.annotations?.Common?.ExternalID ? getAssociatedTextBinding(oProps.dataModelPathExternalID, oProps.formatOptions) : getAssociatedTextBinding(oDataModelPath, oProps.formatOptions);
        const isJSONModelUsedForValue = !!oProps.value && /{\w+>.+}/.test(oProps.value);
        if (isJSONModelUsedForValue) {
          if (oProps.description) {
            oProps.textBindingExpression = oProps.description;
          } else {
            oProps.textBindingExpression = undefined;
            oProps.formatOptions.displayMode = "Value";
          }
        } else {
          oProps.textBindingExpression = textBindingExpression;
        }
        if (oProps.formatOptions?.measureDisplayMode !== "Hidden") {
          // for the MDC Field we need to keep the unit inside the valueBindingExpression
          oProps.valueBindingExpression = oProps.value ? oProps.value : getValueBinding(oDataModelPath, oProps.formatOptions, false, false, undefined, false, true);
        }
      }
      oProps.editStyle = "InputWithValueHelp";
      return;
    }
    switch (oProperty.type) {
      case "Edm.Date":
        oProps.editStyle = "DatePicker";
        const relativeLocation = getRelativePaths(oDataModelPath);
        if (oProperty?.annotations?.Validation?.Maximum) {
          oProps.maxDateExpression = getMinMaxDateExpression(oProperty?.annotations, "Maximum", relativeLocation);
        }
        if (oProperty?.annotations?.Validation?.Minimum) {
          oProps.minDateExpression = getMinMaxDateExpression(oProperty?.annotations, "Minimum", relativeLocation);
        }
        return;
      case "Edm.Time":
      case "Edm.TimeOfDay":
        oProps.editStyle = "TimePicker";
        return;
      case "Edm.DateTime":
      case "Edm.DateTimeOffset":
        oProps.editStyle = "DateTimePicker";
        // No timezone defined. Also for compatibility reasons.
        if (!oProperty.annotations?.Common?.Timezone) {
          oProps.showTimezone = undefined;
        } else {
          oProps.showTimezone = true;
        }
        return;
      case "Edm.Boolean":
        oProps.editStyle = "CheckBox";
        return;
      case "Edm.Stream":
        oProps.editStyle = "File";
        return;
      case "Edm.String":
        if (oProperty.annotations?.UI?.MultiLineText?.valueOf()) {
          oProps.editStyle = "TextArea";
          return;
        }
        if (oProperty.annotations?.UI?.InputMask?.valueOf()) {
          oProps.editStyle = "InputMask";
          oProps.mask = {
            mask: oProperty.annotations?.UI?.InputMask?.Mask.toString(),
            placeholderSymbol: oProperty.annotations?.UI?.InputMask?.PlaceholderSymbol.toString(),
            maskRule: _getMaskingRules(oProperty.annotations?.UI?.InputMask?.Rules)
          };
          return;
        }
        if (oProperty.annotations?.Common?.Masked?.valueOf()) {
          oProps.editStyle = "Masked";
          return;
        }
        break;
      default:
        if (hasStaticPercentUnit(oProperty)) {
          oProps.staticDescription = "%";
        }
        oProps.editStyle = "Input";
    }
    oProps.editStyle = "Input";
  };
  _exports.setEditStyleProperties = setEditStyleProperties;
  const _getMaskingRules = maskingRules => {
    if (!maskingRules || maskingRules.length === 0) {
      return [{
        symbol: "*",
        regex: "[a-zA-Z0-9]"
      }];
    }
    return maskingRules.map(maskingRule => ({
      symbol: maskingRule.MaskSymbol.toString(),
      regex: maskingRule.RegExp.toString()
    }));
  };
  const hasSemanticObjectInNavigationOrProperty = propertyDataModelObjectPath => {
    const property = propertyDataModelObjectPath.targetObject;
    if (SemanticObjectHelper.hasSemanticObject(property)) {
      return true;
    }
    const lastNavProp = propertyDataModelObjectPath?.navigationProperties?.length ? propertyDataModelObjectPath?.navigationProperties[propertyDataModelObjectPath?.navigationProperties?.length - 1] : null;
    if (!lastNavProp || propertyDataModelObjectPath.contextLocation?.navigationProperties?.find(contextNavProp => contextNavProp.name === lastNavProp.name)) {
      return false;
    }
    return SemanticObjectHelper.hasSemanticObject(lastNavProp);
  };

  /**
   * Get the dataModelObjectPath with the value property as targetObject if it exists
   * for a dataModelObjectPath targeting a DataField or a DataPoint annotation.
   * @param initialDataModelObjectPath
   * @returns The dataModelObjectPath targetiing the value property or undefined
   */
  _exports.hasSemanticObjectInNavigationOrProperty = hasSemanticObjectInNavigationOrProperty;
  const getDataModelObjectPathForValue = initialDataModelObjectPath => {
    if (!initialDataModelObjectPath.targetObject) {
      return undefined;
    }
    let valuePath = "";
    // data point annotations need not have $Type defined, so add it if missing
    if (isAnnotationOfTerm(initialDataModelObjectPath, "com.sap.vocabularies.UI.v1.DataPoint")) {
      initialDataModelObjectPath.targetObject.$Type = initialDataModelObjectPath.targetObject.$Type || "com.sap.vocabularies.UI.v1.DataPointType";
    }
    switch (initialDataModelObjectPath.targetObject.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataPointType":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        if (typeof initialDataModelObjectPath.targetObject.Value === "object") {
          valuePath = initialDataModelObjectPath.targetObject.Value.path;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        if (initialDataModelObjectPath.targetObject.Target.$target) {
          if (isAnnotationOfType(initialDataModelObjectPath.targetObject.Target.$target, ["com.sap.vocabularies.UI.v1.DataPointType", "com.sap.vocabularies.UI.v1.DataField"])) {
            if (initialDataModelObjectPath.targetObject.Target.value.indexOf("/") > 0) {
              valuePath = initialDataModelObjectPath.targetObject.Target.value.replace(/\/@.*/, `/${initialDataModelObjectPath.targetObject.Target.$target.Value?.path}`);
            } else {
              valuePath = initialDataModelObjectPath.targetObject.Target.$target.Value?.path;
            }
          } else {
            valuePath = initialDataModelObjectPath.targetObject.Target?.path;
          }
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
        break;
    }
    if (valuePath && valuePath.length > 0) {
      return enhanceDataModelPath(initialDataModelObjectPath, valuePath);
    } else {
      return undefined;
    }
  };

  /**
   * Check if the considered property is a non-insertable property
   * A first check is done on the last navigation from the contextLocation:
   * - If the annotation 'nonInsertableProperty' is found and the property is listed, then the property is non-insertable,
   * - Else the same check is done on the target entity.
   * @param propertyDataModelObjectPath
   * @returns True if the property is not insertable
   */
  _exports.getDataModelObjectPathForValue = getDataModelObjectPathForValue;
  const hasPropertyInsertRestrictions = propertyDataModelObjectPath => {
    const nonInsertableProperties = getContextPropertyRestriction(propertyDataModelObjectPath, capabilities => {
      return capabilities?.InsertRestrictions?.NonInsertableProperties;
    });
    return nonInsertableProperties.some(nonInsertableProperty => {
      return nonInsertableProperty?.$target?.fullyQualifiedName === propertyDataModelObjectPath.targetObject?.fullyQualifiedName;
    });
  };

  /**
   * Get the binding for the draft indicator visibility.
   * @param draftIndicatorKey
   * @returns  The visibility binding expression.
   */
  _exports.hasPropertyInsertRestrictions = hasPropertyInsertRestrictions;
  const getDraftIndicatorVisibleBinding = draftIndicatorKey => {
    return draftIndicatorKey ? compileExpression(formatResult([constant(draftIndicatorKey), pathInModel("semanticKeyHasDraftIndicator", "internal"), pathInModel("HasDraftEntity"), pathInModel("IsActiveEntity"), pathInModel("hideDraftInfo", "pageInternal")], "sap.fe.macros.field.FieldRuntime.isDraftIndicatorVisible")) : "false";
  };
  /**
   * Returns the DisplayShape for the Avatar depending on the annotation IsNaturalPerson.
   *
   * If the entity type is annotated with "IsNaturalPerson", then all Streams and ImageURls
   * in this entity are considered to be person therefore have shape circle by default.
   *
   * If a property within such an entity is annotated with UI.IsImage or UI.IsImageURL, both
   * of these annotations can be annotated with Common.IsNaturalPerson.
   *
   * The annotation at the property level overrides the annotation at the entity type.
   * @param dataModelPath
   * @param property
   * @returns The shape of the Avatar as string or as an expression
   */
  _exports.getDraftIndicatorVisibleBinding = getDraftIndicatorVisibleBinding;
  const getAvatarShape = dataFieldModelPath => {
    const targetObject = dataFieldModelPath.targetObject?.annotations?.UI?.IsImageURL?.annotations?.Common?.IsNaturalPerson || dataFieldModelPath.targetObject?.annotations?.UI?.IsImage?.annotations?.Common?.IsNaturalPerson;
    const entityAnnotationTarget = dataFieldModelPath.targetEntityType.annotations?.Common?.IsNaturalPerson;
    let avatarShapeExpression;
    if (targetObject) {
      avatarShapeExpression = getExpressionFromAnnotation(targetObject);
    } else if (entityAnnotationTarget) {
      avatarShapeExpression = getExpressionFromAnnotation(entityAnnotationTarget);
    } else avatarShapeExpression = false;
    return compileExpression(ifElse(avatarShapeExpression, AvatarShape.Circle, AvatarShape.Square));
  };
  _exports.getAvatarShape = getAvatarShape;
  return _exports;
}, false);
//# sourceMappingURL=FieldTemplating-dbg.js.map

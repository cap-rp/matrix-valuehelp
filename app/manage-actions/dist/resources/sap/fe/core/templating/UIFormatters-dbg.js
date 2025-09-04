/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper"], function (BindingToolkit, MetaModelConverter, valueFormatters, BindingHelper, TypeGuards, DataModelPathHelper, DisplayModeFormatter, FieldControlHelper, PropertyHelper) {
  "use strict";

  var _exports = {};
  var isMultiLineText = PropertyHelper.isMultiLineText;
  var isKey = PropertyHelper.isKey;
  var isImmutable = PropertyHelper.isImmutable;
  var isComputed = PropertyHelper.isComputed;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var isReadOnlyExpression = FieldControlHelper.isReadOnlyExpression;
  var isNonEditableExpression = FieldControlHelper.isNonEditableExpression;
  var isDisabledExpression = FieldControlHelper.isDisabledExpression;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var UI = BindingHelper.UI;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isTruthy = BindingToolkit.isTruthy;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var addTypeInformation = BindingToolkit.addTypeInformation;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  // Import-export method used by the converter to use them in the templating through the UIFormatters.

  /**
   * Interface representing the structure returned by the ODataMetaModel when using the @@ operator in XML templates.
   */

  const FieldEditMode = {
    /**
     * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
     * is rendered in disabled mode
     */
    Disabled: "Disabled",
    /**
     * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
     * is rendered in display mode
     */
    Display: "Display",
    /**
     * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
     * is rendered in editable mode
     */
    Editable: "Editable",
    /**
     * If more than one control is rendered by the {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField }
     * or {@link sap.ui.mdc.MultiValueField MultiValueField} control, the first part is editable, and the other
     * parts are in display mode.
     */
    EditableDisplay: "EditableDisplay",
    /**
     * If more than one control is rendered by the {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField }
     * or {@link sap.ui.mdc.MultiValueField MultiValueField} control, the first part is editable, and the other
     * parts are read-only.
     */
    EditableReadOnly: "EditableReadOnly",
    /**
     * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
     * is rendered in read-only mode
     */
    ReadOnly: "ReadOnly"
  };
  _exports.FieldEditMode = FieldEditMode;
  const getDisplayMode = function (oDataModelObjectPath) {
    return DisplayModeFormatter.getDisplayMode(oDataModelObjectPath.targetObject, oDataModelObjectPath);
  };
  _exports.getDisplayMode = getDisplayMode;
  const getEditableExpressionAsObject = function (oPropertyPath, oDataFieldConverted, oDataModelObjectPath) {
    let isEditable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : UI.IsEditable;
    let considerUpdateRestrictions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    return getEditableExpression(oPropertyPath, oDataFieldConverted, oDataModelObjectPath, true, isEditable, considerUpdateRestrictions);
  };

  /**
   * Create the expression to generate an "editable" Boolean value.
   * @param oPropertyPath The input property
   * @param oDataFieldConverted The DataFieldConverted object to read the fieldControl annotation
   * @param oDataModelObjectPath The path to this property object
   * @param bAsObject Whether or not this should be returned as an object or a binding string
   * @param isEditable Whether or not UI.IsEditable be considered.
   * @param considerUpdateRestrictions Whether we want to take into account UpdateRestrictions to compute the editable
   * @returns The binding expression used to determine if a property is editable or not
   */
  _exports.getEditableExpressionAsObject = getEditableExpressionAsObject;
  const getEditableExpression = function (oPropertyPath) {
    let oDataFieldConverted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    let oDataModelObjectPath = arguments.length > 2 ? arguments[2] : undefined;
    let bAsObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let isEditable = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : UI.IsEditable;
    let considerUpdateRestrictions = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
    const relativePath = getRelativePaths(oDataModelObjectPath);
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      return compileExpression(false);
    }
    let dataFieldEditableExpression = constant(true);
    if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
      dataFieldEditableExpression = ifElse(isNonEditableExpression(oDataFieldConverted), false, isEditable);
    } else if (oDataFieldConverted !== undefined) {
      dataFieldEditableExpression = isEditable;
    }
    const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;

    // Editability depends on the field control expression
    // If the Field control is statically in ReadOnly or Inapplicable (disabled) -> not editable
    // If the property is a key -> not editable except in creation if not computed
    // If the property is computed -> not editable
    // If the property is not updatable -> not editable
    // If the property is immutable -> not editable except in creation
    // If the Field control is a path resolving to ReadOnly or Inapplicable (disabled) (<= 1) -> not editable
    // Else, to be editable you need
    // immutable and key while in the creation row
    // ui/isEditable
    const isPathUpdatableExpression = isPathUpdatable(oDataModelObjectPath, {
      propertyPath: oPropertyPath,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, oDataModelObjectPath.convertedTypes, navigationPaths)
    });
    if (compileExpression(isPathUpdatableExpression) === "false" && considerUpdateRestrictions) {
      return bAsObject ? isPathUpdatableExpression : "false";
    }
    const editableExpression = oProperty !== undefined ? ifElse(or(and(not(isPathUpdatableExpression), considerUpdateRestrictions), isComputed(oProperty), isKey(oProperty), isImmutable(oProperty), isNonEditableExpression(oProperty, relativePath)), ifElse(or(isComputed(oProperty), isNonEditableExpression(oProperty, relativePath)), false, UI.IsTransientBinding), isEditable) : unresolvableExpression;
    if (bAsObject) {
      return and(editableExpression, dataFieldEditableExpression);
    }
    return compileExpression(and(editableExpression, dataFieldEditableExpression));
  };
  _exports.getEditableExpression = getEditableExpression;
  const getCollaborationExpression = function (dataModelObjectPath, formatter) {
    const objectPath = getTargetObjectPath(dataModelObjectPath);
    const activityExpression = pathInModel(`/collaboration/activities${objectPath}`, "internal");
    const keys = dataModelObjectPath?.contextLocation?.targetEntityType?.keys;
    const keysExpressions = [];
    keys?.forEach(function (key) {
      const keyExpression = pathInModel(key.name);
      keysExpressions.push(keyExpression);
    });
    return formatResult([activityExpression, ...keysExpressions], formatter);
  };
  _exports.getCollaborationExpression = getCollaborationExpression;
  const getEnabledExpressionAsObject = function (oPropertyPath, oDataFieldConverted, oDataModelObjectPath) {
    return getEnabledExpression(oPropertyPath, oDataFieldConverted, true, oDataModelObjectPath);
  };
  /**
   * Create the expression to generate an "enabled" Boolean value.
   * @param oPropertyPath The input property
   * @param oDataFieldConverted The DataFieldConverted Object to read the fieldControl annotation
   * @param bAsObject Whether or not this should be returned as an object or a binding string
   * @param oDataModelObjectPath
   * @returns The binding expression to determine if a property is enabled or not
   */
  _exports.getEnabledExpressionAsObject = getEnabledExpressionAsObject;
  const getEnabledExpression = function (oPropertyPath, oDataFieldConverted) {
    let bAsObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let oDataModelObjectPath = arguments.length > 3 ? arguments[3] : undefined;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      return compileExpression(true);
    }
    let relativePath;
    if (oDataModelObjectPath) {
      relativePath = getRelativePaths(oDataModelObjectPath);
    }
    let dataFieldEnabledExpression = constant(true);
    if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
      dataFieldEnabledExpression = ifElse(isDisabledExpression(oDataFieldConverted), false, true);
    }
    const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;
    // Enablement depends on the field control expression
    // If the Field control is statically in Inapplicable (disabled) -> not enabled
    const enabledExpression = oProperty !== undefined ? ifElse(isDisabledExpression(oProperty, relativePath), false, true) : unresolvableExpression;
    if (bAsObject) {
      return and(enabledExpression, dataFieldEnabledExpression);
    }
    return compileExpression(and(enabledExpression, dataFieldEnabledExpression));
  };

  /**
   * Create the expression to generate an "editMode" enum value.
   * @param propertyPath The input property
   * @param dataModelObjectPath The list of data model objects that are involved to reach that property
   * @param measureReadOnly Whether we should set UoM / currency field mode to read only
   * @param asObject Whether we should return this as an expression or as a string
   * @param dataFieldConverted The dataField object
   * @param isEditable Whether or not UI.IsEditable be considered.
   * @returns The binding expression representing the current property edit mode, compliant with the MDC Field definition of editMode.
   */
  _exports.getEnabledExpression = getEnabledExpression;
  const getEditMode = function (propertyPath, dataModelObjectPath) {
    let measureReadOnly = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let asObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let dataFieldConverted = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
    let isEditable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : UI.IsEditable;
    if (!propertyPath || typeof propertyPath === "string" || !isProperty(dataFieldConverted) && dataFieldConverted?.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
      return FieldEditMode.Display;
    }
    const property = isPathAnnotationExpression(propertyPath) ? propertyPath.$target : propertyPath;
    if (!isProperty(property)) {
      return FieldEditMode.Display;
    }
    const relativePath = getRelativePaths(dataModelObjectPath);
    const isPathUpdatableExpression = isPathUpdatable(dataModelObjectPath, {
      propertyPath: property,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, dataModelObjectPath.convertedTypes, navigationPaths)
    });

    // we get the editable Expression without considering update Restrictions because they are handled separately
    const editableExpression = getEditableExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath, isEditable, false);
    const enabledExpression = getEnabledExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath);
    const associatedCurrencyProperty = getAssociatedCurrencyProperty(property);
    const unitProperty = associatedCurrencyProperty || getAssociatedUnitProperty(property);
    let resultExpression = constant(FieldEditMode.Editable);
    if (unitProperty) {
      const isUnitReadOnly = isReadOnlyExpression(unitProperty, relativePath);
      resultExpression = ifElse(or(isUnitReadOnly, isComputed(unitProperty), and(isImmutable(unitProperty), not(UI.IsTransientBinding)), measureReadOnly), ifElse(!isConstant(isUnitReadOnly) && isUnitReadOnly, FieldEditMode.EditableReadOnly, FieldEditMode.EditableDisplay), FieldEditMode.Editable);
    }
    if (!unitProperty && (property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit)) {
      // no unit property associated means this is a static unit
      resultExpression = constant(FieldEditMode.EditableDisplay);
    }
    let readOnlyExpression;
    if (dataFieldConverted != undefined && !isProperty(dataFieldConverted)) {
      readOnlyExpression = or(isReadOnlyExpression(property, relativePath), isReadOnlyExpression(dataFieldConverted));
    } else {
      readOnlyExpression = isReadOnlyExpression(property, relativePath);
    }

    // if there are update Restrictions it is always display mode
    const editModeExpression = ifElse(or(isPathUpdatableExpression, UI.IsTransientBinding), ifElse(enabledExpression, ifElse(editableExpression, resultExpression, ifElse(and(!isConstant(readOnlyExpression) && readOnlyExpression, isEditable), FieldEditMode.ReadOnly, FieldEditMode.Display)), ifElse(isEditable, FieldEditMode.Disabled, FieldEditMode.Display)), FieldEditMode.Display);
    if (asObject) {
      return editModeExpression;
    }
    return compileExpression(editModeExpression);
  };
  _exports.getEditMode = getEditMode;
  const hasValidAnalyticalCurrencyOrUnit = function (oPropertyDataModelObjectPath) {
    const oPropertyDefinition = oPropertyDataModelObjectPath?.targetObject;
    return oPropertyDefinition && getExpressionForMeasureUnit(oPropertyDefinition);
  };
  _exports.hasValidAnalyticalCurrencyOrUnit = hasValidAnalyticalCurrencyOrUnit;
  const getExpressionForMeasureUnit = function (oPropertyDefinition) {
    const currency = oPropertyDefinition?.annotations?.Measures?.ISOCurrency;
    const measure = currency ? currency : oPropertyDefinition?.annotations?.Measures?.Unit;
    if (measure) {
      return compileExpression(or(isTruthy(getExpressionFromAnnotation(measure)), not(UI.IsTotal)));
    } else {
      return compileExpression(constant(true));
    }
  };

  /**
   * Create the binding expression for the fieldDisplay.
   * @param oPropertyPath
   * @param sTargetDisplayMode
   * @param oComputedEditMode
   * @returns The binding expression representing the current property display mode, compliant with the MDC Field definition of displayMode.
   */
  _exports.getExpressionForMeasureUnit = getExpressionForMeasureUnit;
  const getFieldDisplay = function (oPropertyPath, sTargetDisplayMode, oComputedEditMode) {
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    const hasTextAnnotation = oProperty.annotations?.Common?.Text !== undefined;
    if (hasValueHelp(oProperty)) {
      return compileExpression(sTargetDisplayMode);
    } else {
      return hasTextAnnotation ? compileExpression(ifElse(equal(oComputedEditMode, "Editable"), "Value", sTargetDisplayMode)) : "Value";
    }
  };
  _exports.getFieldDisplay = getFieldDisplay;
  const getTypeConfig = function (oProperty, dataType) {
    const oTargetMapping = EDM_TYPE_MAPPING[oProperty?.type] || (dataType ? EDM_TYPE_MAPPING[dataType] : undefined);
    const propertyTypeConfig = {
      type: oTargetMapping.type,
      constraints: {},
      formatOptions: {}
    };
    if (isProperty(oProperty)) {
      propertyTypeConfig.constraints = {
        scale: oTargetMapping.constraints?.$Scale ? oProperty.scale : undefined,
        precision: oTargetMapping.constraints?.$Precision ? oProperty.precision : undefined,
        maxLength: oTargetMapping.constraints?.$MaxLength ? oProperty.maxLength : undefined,
        nullable: oTargetMapping.constraints?.$Nullable ? oProperty.nullable : undefined,
        minimum: oTargetMapping.constraints?.["@Org.OData.Validation.V1.Minimum/$Decimal"] && !isNaN(oProperty.annotations?.Validation?.Minimum) ? `${oProperty.annotations?.Validation?.Minimum}` : undefined,
        maximum: oTargetMapping.constraints?.["@Org.OData.Validation.V1.Maximum/$Decimal"] && !isNaN(oProperty.annotations?.Validation?.Maximum) ? `${oProperty.annotations?.Validation?.Maximum}` : undefined,
        isDigitSequence: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && oTargetMapping.constraints?.["@com.sap.vocabularies.Common.v1.IsDigitSequence"] && oProperty.annotations?.Common?.IsDigitSequence ? true : undefined,
        V4: oTargetMapping.constraints?.$V4 ? true : undefined
      };
    }
    propertyTypeConfig.formatOptions = {
      parseAsString: propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 || propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0 ? false : undefined,
      emptyString: propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 || propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0 ? "" : undefined,
      parseKeepsEmptyString: propertyTypeConfig.type === "sap.ui.model.odata.type.String" ? true : undefined
    };
    return propertyTypeConfig;
  };
  _exports.getTypeConfig = getTypeConfig;
  const getConstraintOptions = function (property) {
    return property?.annotations?.UI?.DoNotCheckScaleOfMeasuredQuantity && property?.annotations?.UI.DoNotCheckScaleOfMeasuredQuantity?.valueOf() ? {
      skipDecimalsValidation: true
    } : {};
  };
  _exports.getConstraintOptions = getConstraintOptions;
  const getBindingWithUnitOrCurrency = function (oPropertyDataModelPath, propertyBindingExpression, ignoreUnitConstraint, formatOptions, forDisplayMode, showOnlyUnitDecimals) {
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    let unit = oPropertyDefinition.annotations?.Measures?.Unit;
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    if (hasStaticPercentUnit(oPropertyDefinition)) {
      if (formatOptions?.showMeasure === false) {
        return propertyBindingExpression;
      }
      return formatResult([propertyBindingExpression], valueFormatters.formatWithPercentage);
    }
    const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
    unit = unit ? unit : oPropertyDefinition.annotations?.Measures?.ISOCurrency;
    const unitBindingExpression = isPathAnnotationExpression(unit) && unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation), ignoreUnitConstraint) : getExpressionFromAnnotation(unit, relativeLocation);
    let constraintOptions;
    if (complexType === "sap.ui.model.odata.type.Unit") {
      if (forDisplayMode && !showOnlyUnitDecimals) {
        constraintOptions = {
          skipDecimalsValidation: true
        };
      } else if (!forDisplayMode) {
        // Consider annotation only in edit mode
        constraintOptions = getConstraintOptions(oPropertyDataModelPath.targetObject);
      }
    }
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions, constraintOptions);
  };

  /**
   * Create the binding expression for the date picker with minimum and maximum value present.
   * @param oPropertyDataModelPath The list of data model objects that are involved to reach that property
   * @param propertyBindingExpression Binding expression for the property
   * @returns The binding expression representing the date property with minimum and maximum value for the same
   */
  _exports.getBindingWithUnitOrCurrency = getBindingWithUnitOrCurrency;
  const getBindingForDatePicker = function (oPropertyDataModelPath, propertyBindingExpression) {
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    const formatOptions = {};
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    const complexType = "sap.fe.core.type.Date";
    const minDate = oPropertyDefinition?.annotations?.Validation?.Minimum?.$Date ? oPropertyDefinition?.annotations?.Validation?.Minimum?.$Date : oPropertyDefinition?.annotations?.Validation?.Minimum;
    const maxDate = oPropertyDefinition?.annotations?.Validation?.Maximum?.$Date ? oPropertyDefinition?.annotations?.Validation?.Maximum?.$Date : oPropertyDefinition?.annotations?.Validation?.Maximum;
    const minExpression = minDate && isPathAnnotationExpression(minDate) ? formatWithTypeInformation(oPropertyDefinition?.annotations?.Validation?.Minimum, getExpressionFromAnnotation(oPropertyDefinition?.annotations?.Validation?.Minimum, relativeLocation)) : minDate;
    const maxExpression = maxDate && isPathAnnotationExpression(maxDate) ? formatWithTypeInformation(oPropertyDefinition?.annotations?.Validation?.Maximum, getExpressionFromAnnotation(oPropertyDefinition?.annotations?.Validation?.Maximum, relativeLocation)) : maxDate;
    return (minExpression || maxExpression) && addTypeInformation([propertyBindingExpression, minExpression, maxExpression], complexType, undefined, formatOptions);
  };
  _exports.getBindingForDatePicker = getBindingForDatePicker;
  const getBindingForUnitOrCurrency = function (oPropertyDataModelPath, forDisplayMode, showOnlyUnitDecimals) {
    const oPropertyDefinition = oPropertyDataModelPath?.targetObject;
    if (!oPropertyDefinition) {
      return "";
    }
    let unit = oPropertyDefinition.annotations?.Measures?.Unit;
    if (hasStaticPercentUnit(oPropertyDefinition)) {
      return constant("%");
    }
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
    unit = unit ? unit : oPropertyDefinition.annotations?.Measures?.ISOCurrency;
    const unitBindingExpression = isPathAnnotationExpression(unit) && unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation)) : getExpressionFromAnnotation(unit, relativeLocation);
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oPropertyDataModelPath));
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression, true);
    let constraintOptions;
    if (complexType === "sap.ui.model.odata.type.Unit") {
      if (forDisplayMode && !showOnlyUnitDecimals) {
        constraintOptions = {
          skipDecimalsValidation: true
        };
      } else if (!forDisplayMode) {
        constraintOptions = getConstraintOptions(oPropertyDefinition);
      }
    }
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, {
      parseKeepsEmptyString: true,
      showNumber: false
    }, constraintOptions);
  };
  _exports.getBindingForUnitOrCurrency = getBindingForUnitOrCurrency;
  const getBindingWithTimezone = function (oPropertyDataModelPath, propertyBindingExpression) {
    let ignoreUnitConstraint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let hideTimezoneForEmptyValues = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let fieldFormatOptions = arguments.length > 4 ? arguments[4] : undefined;
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    const timezone = oPropertyDefinition.annotations?.Common?.Timezone;
    const style = oPropertyDefinition.annotations?.UI?.DateTimeStyle;
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    const complexType = "sap.fe.core.type.DateTimeWithTimezone";
    const unitBindingExpression = isPathAnnotationExpression(timezone) && timezone.$target ? formatWithTypeInformation(timezone.$target, getExpressionFromAnnotation(timezone, relativeLocation), ignoreUnitConstraint) : getExpressionFromAnnotation(timezone, relativeLocation);
    let formatOptions = {};
    if (hideTimezoneForEmptyValues) {
      formatOptions = {
        showTimezoneForEmptyValues: false
      };
    }
    // if style or pattern is also set
    if (style) {
      formatOptions = {
        ...formatOptions,
        ...{
          style: style
        }
      };
    } else if (fieldFormatOptions?.dateTimeStyle !== undefined) {
      formatOptions = {
        ...formatOptions,
        ...{
          style: fieldFormatOptions.dateTimeStyle
        }
      };
    }
    if (fieldFormatOptions?.dateTimePattern !== undefined) {
      formatOptions = {
        ...formatOptions,
        ...{
          pattern: fieldFormatOptions.dateTimePattern
        }
      };
    }
    if (fieldFormatOptions?.showTime !== undefined) {
      formatOptions = {
        ...formatOptions,
        ...{
          showTime: fieldFormatOptions.showTime
        }
      };
    }
    if (fieldFormatOptions?.showDate !== undefined) {
      formatOptions = {
        ...formatOptions,
        ...{
          showDate: fieldFormatOptions.showDate
        }
      };
    }
    if (fieldFormatOptions?.showTimezone !== undefined) {
      formatOptions = {
        ...formatOptions,
        ...{
          showTimezone: fieldFormatOptions.showTimezone
        }
      };
    }
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions);
  };

  /**
   * Creates the binding expression for the date format of a date, time or dateTime.
   * @param propertyDataModelPath The list of data model objects that are involved to reach that property
   * @param propertyBindingExpression Binding expression for the property
   * @param formatOptionsDateFormat Format options which contain the style or pattern property
   * @returns The binding expression representing a date, time, or date-time, with the given pattern or style property
   */
  _exports.getBindingWithTimezone = getBindingWithTimezone;
  const getBindingForDateFormat = function (propertyDataModelPath, propertyBindingExpression, formatOptionsDateFormat) {
    const oPropertyDefinition = propertyDataModelPath.targetObject;
    const pattern = formatOptionsDateFormat?.dateTimePattern;
    const style = oPropertyDefinition.annotations?.UI?.DateTimeStyle ?? formatOptionsDateFormat?.dateTimeStyle;
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    propertyBindingExpression.type = EDM_TYPE_MAPPING[oPropertyDefinition.type].type;
    propertyBindingExpression.formatOptions = {
      ...(style && {
        style: style.toString()
      }),
      ...(pattern && {
        pattern: pattern
      })
    };
    return propertyBindingExpression;
  };
  _exports.getBindingForDateFormat = getBindingForDateFormat;
  const getBindingForTimezone = function (propertyDataModelPath, propertyBindingExpression) {
    const propertyDefinition = propertyDataModelPath.targetObject;
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    propertyBindingExpression.type = "any";
    const complexType = "sap.ui.model.odata.type.DateTimeWithTimezone";
    const formatOptions = {
      showTime: false,
      showDate: false,
      showTimezone: true
    };

    // null is required by formatter when there is just a timezone
    return addTypeInformation([null, propertyBindingExpression], complexType, undefined, formatOptions);
  };
  _exports.getBindingForTimezone = getBindingForTimezone;
  const getAlignmentExpression = function (oComputedEditMode) {
    let sAlignDisplay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Begin";
    let sAlignEdit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "Begin";
    return compileExpression(ifElse(equal(oComputedEditMode, "Display"), sAlignDisplay, sAlignEdit));
  };

  /**
   * Formatter helper to retrieve the converterContext from the metamodel context.
   * @param oContext The original metamodel context
   * @param oInterface The current templating context
   * @returns The ConverterContext representing that object
   */
  _exports.getAlignmentExpression = getAlignmentExpression;
  const getConverterContext = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return convertMetaModelContext(oInterface.context);
    }
    return null;
  };
  getConverterContext.requiresIContext = true;

  /**
   * Formatter helper to retrieve the data model objects that are involved from the metamodel context.
   * @param oContext The original ODataMetaModel context
   * @param oInterface The current templating context
   * @returns An array of entitysets and navproperties that are involved to get to a specific object in the metamodel
   */
  _exports.getConverterContext = getConverterContext;
  const getDataModelObjectPath = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return getInvolvedDataModelObjects(oInterface.context);
    }
    return null;
  };
  getDataModelObjectPath.requiresIContext = true;

  /**
   * Checks if the referenced property is part of a 1..n navigation.
   * @param oDataModelPath The data model path to check
   * @returns True if the property is part of a 1..n navigation
   */
  _exports.getDataModelObjectPath = getDataModelObjectPath;
  const isMultiValueField = function (oDataModelPath) {
    if (oDataModelPath.navigationProperties?.length) {
      const hasOneToManyNavigation = oDataModelPath?.navigationProperties.findIndex(oNav => {
        if (isMultipleNavigationProperty(oNav)) {
          if (oDataModelPath.contextLocation?.navigationProperties?.length) {
            //we check the one to many nav is not already part of the context
            return oDataModelPath.contextLocation?.navigationProperties.findIndex(oContextNav => oContextNav.name === oNav.name) === -1;
          }
          return true;
        }
        return false;
      }) > -1;
      if (hasOneToManyNavigation) {
        return true;
      }
    }
    return false;
  };
  _exports.isMultiValueField = isMultiValueField;
  const getRequiredExpressionAsObject = function (oPropertyPath, oDataFieldConverted) {
    let forceEditMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return getRequiredExpression(oPropertyPath, oDataFieldConverted, forceEditMode, true);
  };
  _exports.getRequiredExpressionAsObject = getRequiredExpressionAsObject;
  const getRequiredExpression = function (oPropertyPath, oDataFieldConverted) {
    let forceEditMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let bAsObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let oRequiredProperties = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    let dataModelObjectPath = arguments.length > 5 ? arguments[5] : undefined;
    const aRequiredPropertiesFromInsertRestrictions = oRequiredProperties.requiredPropertiesFromInsertRestrictions;
    const aRequiredPropertiesFromUpdateRestrictions = oRequiredProperties.requiredPropertiesFromUpdateRestrictions;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      if (bAsObject) {
        return constant(false);
      }
      return compileExpression(constant(false));
    }
    let relativePath;
    if (dataModelObjectPath) {
      relativePath = getRelativePaths(dataModelObjectPath);
    }
    let dataFieldRequiredExpression = constant(false);
    if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
      // For the datafield expression we should not  consider the relative path
      dataFieldRequiredExpression = isRequiredExpression(oDataFieldConverted);
    }
    let requiredPropertyFromInsertRestrictionsExpression = constant(false);
    let requiredPropertyFromUpdateRestrictionsExpression = constant(false);
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    // Enablement depends on the field control expression
    // If the Field control is statically in Inapplicable (disabled) -> not enabled
    const requiredExpression = isRequiredExpression(oProperty, relativePath);
    const editMode = forceEditMode || UI.IsEditable;
    if (aRequiredPropertiesFromInsertRestrictions?.includes(oProperty.name)) {
      requiredPropertyFromInsertRestrictionsExpression = UI.IsCreateMode;
    }
    if (aRequiredPropertiesFromUpdateRestrictions?.includes(oProperty.name)) {
      requiredPropertyFromUpdateRestrictionsExpression = and(UI.IsEditable, not(UI.IsCreateMode));
    }
    const returnExpression = or(and(or(requiredExpression, dataFieldRequiredExpression), editMode), requiredPropertyFromInsertRestrictionsExpression, requiredPropertyFromUpdateRestrictionsExpression);
    if (bAsObject) {
      return returnExpression;
    }
    return compileExpression(returnExpression);
  };
  _exports.getRequiredExpression = getRequiredExpression;
  const getRequiredExpressionForConnectedDataField = function (dataFieldObjectPath) {
    const data = dataFieldObjectPath?.targetObject?.$target?.Data ?? {};
    const keys = Object.keys(data);
    const dataFields = [];
    let propertyPath;
    const isRequiredExpressions = [];
    for (const key of keys) {
      if (data[key]?.["$Type"] && data[key]["$Type"]?.includes("DataField")) {
        dataFields.push(data[key]);
      }
    }
    for (const dataField of dataFields) {
      switch (dataField.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          if (typeof dataField.Value === "object") {
            propertyPath = dataField.Value.$target;
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          if (dataField.Target?.$target) {
            if (isAnnotationOfType(dataField.Target.$target, ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataPointType"])) {
              if (typeof dataField.Target.$target.Value === "object") {
                propertyPath = dataField.Target.$target.Value.$target;
              }
            } else {
              if (typeof dataField.Target === "object") {
                propertyPath = dataField.Target.$target;
              }
              break;
            }
          }
          break;
        default:
          break;
        // no default
      }
      isRequiredExpressions.push(getRequiredExpressionAsObject(propertyPath, dataField, false));
    }
    return compileExpression(or(...isRequiredExpressions));
  };

  /**
   * Check if header facet or action is visible.
   * @param targetObject Header facets or Actions
   * @returns BindingToolkitExpression<boolean>
   */
  _exports.getRequiredExpressionForConnectedDataField = getRequiredExpressionForConnectedDataField;
  function isVisible(targetObject, navigationProperties) {
    return not(equal(getExpressionFromAnnotation(targetObject?.annotations?.UI?.Hidden, navigationProperties), true));
  }

  /**
   * Checks whether action parameter is supports multi line input.
   * @param dataModelObjectPath Object path to the action parameter.
   * @returns Boolean
   */
  _exports.isVisible = isVisible;
  const isMultiLine = function (dataModelObjectPath) {
    return isMultiLineText(dataModelObjectPath.targetObject);
  };

  /**
   * Check if the action is enabled.
   * @param actionTarget Action
   * @param convertedTypes ConvertedMetadata
   * @param dataModelObjectPath DataModelObjectPath
   * @param pathFromContextLocation Boolean
   * @returns BindingToolkitExpression
   */
  _exports.isMultiLine = isMultiLine;
  function getActionEnabledExpression(actionTarget, convertedTypes, dataModelObjectPath, pathFromContextLocation) {
    const operationAvailableIsAnnotated = actionTarget.annotations.Core?.OperationAvailable?.term === "Org.OData.Core.V1.OperationAvailable";
    if (!operationAvailableIsAnnotated) {
      // OperationAvailable term doesn't exist for the action
      return constant(true);
    }
    let prefix = "";
    if (dataModelObjectPath && pathFromContextLocation && pathFromContextLocation === true && dataModelObjectPath.contextLocation?.targetEntityType && dataModelObjectPath.contextLocation.targetEntityType !== actionTarget.sourceEntityType) {
      const navigations = getRelativePaths(dataModelObjectPath);
      let sourceActionDataModelObject = enhanceDataModelPath(dataModelObjectPath.contextLocation);
      //Start from contextLocation and navigate until the source entityType of the action to get the right prefix
      for (const nav of navigations) {
        sourceActionDataModelObject = enhanceDataModelPath(sourceActionDataModelObject, nav);
        if (sourceActionDataModelObject.targetEntityType === actionTarget.sourceEntityType) {
          prefix = `${getRelativePaths(sourceActionDataModelObject).join("/")}/`;
          break;
        }
      }
    }
    const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
    const operationAvailableExpression = getExpressionFromAnnotation(actionTarget.annotations.Core?.OperationAvailable, [], undefined, path => `${prefix}${bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName)}`);
    return equal(operationAvailableExpression, true);
  }

  /**
   * Generates the expression to check if the quickView facet is visible.
   * @param facetModelPath
   * @returns BindingToolkitExpression The binding expression of the visibility
   */
  _exports.getActionEnabledExpression = getActionEnabledExpression;
  function isQuickViewFacetVisible(facetModelPath) {
    let targetVisible = constant(true);
    if (isAnnotationOfType(facetModelPath.targetObject?.Target?.$target, "com.sap.vocabularies.UI.v1.FieldGroupType")) {
      targetVisible = isVisible(facetModelPath.targetObject?.Target?.$target);
    }
    return compileExpression(and(isVisible(facetModelPath.targetObject), targetVisible));
  }
  _exports.isQuickViewFacetVisible = isQuickViewFacetVisible;
  return _exports;
}, false);
//# sourceMappingURL=UIFormatters-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/ui/core/Lib", "sap/ui/model/odata/v4/AnnotationHelper"], function (BindingToolkit, valueFormatters, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters, Library, AnnotationHelper) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getBindingWithUnitOrCurrency = UIFormatters.getBindingWithUnitOrCurrency;
  var getBindingWithTimezone = UIFormatters.getBindingWithTimezone;
  var getBindingForTimezone = UIFormatters.getBindingForTimezone;
  var getBindingForDateFormat = UIFormatters.getBindingForDateFormat;
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  const typesSupportingNumberOfFractionalDigits = ["Edm.Single", "Edm.Double", "Edm.Decimal"];
  /**
   * Gets the target value of a progress indicator.
   * A progress indicator can have a static target, a percentage, or another property.
   * @param oDataModelPath The DataModelObjectPath
   * @param relativeLocation The relative location, to take into account the navigation properties
   * @returns The expression binding of the target value
   */
  const getDataPointTargetExpression = (oDataModelPath, relativeLocation) => {
    return oDataModelPath?.TargetValue ? getExpressionFromAnnotation(oDataModelPath.TargetValue, relativeLocation) : unresolvableExpression;
  };
  const oResourceModel = Library.getResourceBundleFor("sap.fe.macros");

  /**
   * This gets the binding expression for the value of the progress indicator.
   * @param oPropertyDataModelObjectPath The DataModelObjectPath
   * @returns The binding expression for the progress indicator value.
   */
  const buildExpressionForProgressIndicatorDisplayValue = oPropertyDataModelObjectPath => {
    const fieldValue = oPropertyDataModelObjectPath?.targetObject?.Value || "";
    const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
    const fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const targetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject, relativeLocation);
    if (fieldValueExpression && targetExpression) {
      let targetObject = oPropertyDataModelObjectPath.targetObject?.Value;
      if (!isProperty(targetObject)) {
        targetObject = targetObject.$target;
      }
      const unit = targetObject.annotations?.Measures?.Unit || targetObject.annotations?.Measures?.ISOCurrency;
      if (!unit) {
        return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [compileExpression(fieldValueExpression), compileExpression(targetExpression)]);
      }
      // If the unit isn't a path, we check for a % sign as it is a special case.
      if (hasStaticPercentUnit(fieldValue?.$target)) {
        return `${compileExpression(fieldValueExpression)} %`;
      }
      const unitBindingExpression = unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation)) : getExpressionFromAnnotation(unit, relativeLocation);
      const isCurrency = targetObject.annotations?.Measures?.ISOCurrency ? true : false;
      let requestCustomUnits;
      if (isCurrency) {
        requestCustomUnits = pathInModel("/##@@requestCurrencyCodes");
      } else {
        requestCustomUnits = pathInModel("/##@@requestUnitsOfMeasure");
      }
      requestCustomUnits.targetType = "any";
      requestCustomUnits.mode = "OneTime";
      return compileExpression(formatResult([fieldValueExpression, targetExpression, unitBindingExpression, isCurrency, requestCustomUnits], valueFormatters.formatProgressIndicatorText));
    }
    return undefined;
  };
  _exports.buildExpressionForProgressIndicatorDisplayValue = buildExpressionForProgressIndicatorDisplayValue;
  const buildRatingIndicatorSubtitleExpression = (oContext, mSampleSize) => {
    if (mSampleSize) {
      return formatRatingIndicatorSubTitle(AnnotationHelper.value(mSampleSize, {
        context: oContext
      }));
    }
  };
  // returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
  const formatRatingIndicatorSubTitle = iSampleSizeValue => {
    if (iSampleSizeValue) {
      const sSubTitleLabel = iSampleSizeValue > 1 ? oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL");
      return oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE", [String(iSampleSizeValue), sSubTitleLabel]);
    }
  };

  /**
   * This function is used to get the header text of rating indicator.
   * @param oContext Context of interface
   * @param oDataPoint Data point object
   * @returns Expression binding for rating indicator text
   */
  const getHeaderRatingIndicatorText = (oContext, oDataPoint) => {
    let result;
    if (oDataPoint && oDataPoint.SampleSize) {
      result = buildRatingIndicatorSubtitleExpression(oContext, oDataPoint.SampleSize);
    } else if (oDataPoint && oDataPoint.Description) {
      const sModelValue = AnnotationHelper.value(oDataPoint.Description, {
        context: oContext
      });
      result = "${path:" + sModelValue + "}";
    }
    return result;
  };
  getHeaderRatingIndicatorText.requiresIContext = true;
  _exports.getHeaderRatingIndicatorText = getHeaderRatingIndicatorText;
  const buildExpressionForDescription = fieldValue => {
    const relativeLocation = getRelativePaths(fieldValue);
    if (fieldValue?.targetObject?.annotations?.Common?.Text) {
      const oTextExpression = getExpressionFromAnnotation(fieldValue?.targetObject.annotations?.Common?.Text, relativeLocation);
      if (isPathInModelExpression(oTextExpression)) {
        oTextExpression.parameters = {
          $$noPatch: true
        };
      }
      return oTextExpression;
    }
    return undefined;
  };
  const getFloatFormat = (outExpression, numberOfFractionalDigits) => {
    // numberOfFractionalDigits is only defined in getValueFormatted when NumberOfFractionalDigits is defined.
    // In that case, we need to instance the preserveDecimals parameter because of a change MDC side
    if (numberOfFractionalDigits) {
      if (!outExpression.formatOptions) {
        outExpression.formatOptions = {};
      }
      outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
        preserveDecimals: false,
        maxFractionDigits: numberOfFractionalDigits
      });
    }
    return outExpression;
  };
  const getValueFormatted = (oPropertyDataModelPath, fieldValue, sPropertyType, sNumberOfFractionalDigits) => {
    let outExpression;
    const relativeLocation = !fieldValue?.path?.includes("/") ? getRelativePaths(oPropertyDataModelPath) : [];
    outExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const oPropertyDefinition = oPropertyDataModelPath?.targetObject;
    if (oPropertyDefinition && sPropertyType && isPathInModelExpression(outExpression)) {
      formatWithTypeInformation(oPropertyDefinition, outExpression);
      outExpression.type = EDM_TYPE_MAPPING[sPropertyType]?.type;
      if (typesSupportingNumberOfFractionalDigits.includes(sPropertyType)) {
        // for the listReport, the decimal/single/double fields are formatted by returning a string
        // for the facets of the OP, the decimal/single/double fields are formatted by returning a promise, so we manage all the cases
        outExpression = getFloatFormat(outExpression, sNumberOfFractionalDigits);
      }
    }
    return outExpression;
  };
  _exports.getValueFormatted = getValueFormatted;
  const buildFieldBindingExpression = (oDataModelPath, dataPointFormatOptions, bHideMeasure) => {
    const oDataPoint = oDataModelPath.targetObject;
    const oDataPointValue = oDataPoint?.Value || "";
    const propertyType = oDataPointValue?.$target?.type;
    let numberOfFractionalDigits;
    if (typesSupportingNumberOfFractionalDigits.includes(propertyType) && oDataPoint?.ValueFormat) {
      if (oDataPoint.ValueFormat.NumberOfFractionalDigits) {
        numberOfFractionalDigits = oDataPoint.ValueFormat.NumberOfFractionalDigits;
      }
    }
    const oPropertyDataModelObjectPath = enhanceDataModelPath(oDataModelPath, oDataPointValue.path);
    const oDescription = oPropertyDataModelObjectPath ? buildExpressionForDescription(oPropertyDataModelObjectPath) : undefined;
    const oFormattedValue = getValueFormatted(oPropertyDataModelObjectPath, oDataPointValue, propertyType, numberOfFractionalDigits);
    const sDisplayMode = oDescription ? dataPointFormatOptions?.displayMode || getDisplayMode(oPropertyDataModelObjectPath) : "Value";
    let oBindingExpression;
    switch (sDisplayMode) {
      case "Description":
        oBindingExpression = oDescription;
        break;
      case "ValueDescription":
        oBindingExpression = formatResult([oFormattedValue, oDescription], valueFormatters.formatWithBrackets);
        break;
      case "DescriptionValue":
        oBindingExpression = formatResult([oDescription, oFormattedValue], valueFormatters.formatWithBrackets);
        break;
      default:
        if (oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.Timezone && oPropertyDataModelObjectPath.targetObject.type === "Edm.DateTimeOffset") {
          oBindingExpression = getBindingWithTimezone(oPropertyDataModelObjectPath, oFormattedValue);
        } else if (oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.IsTimezone) {
          oBindingExpression = getBindingForTimezone(oPropertyDataModelObjectPath, oFormattedValue);
        } else if (oPropertyDataModelObjectPath.targetObject?.annotations?.UI?.DateTimeStyle || dataPointFormatOptions?.dateTimePattern) {
          oBindingExpression = getBindingForDateFormat(oPropertyDataModelObjectPath, oFormattedValue, dataPointFormatOptions);
        } else {
          oBindingExpression = _computeBindingWithUnitOrCurrency(oPropertyDataModelObjectPath, oFormattedValue, bHideMeasure || dataPointFormatOptions?.measureDisplayMode === "Hidden", !!dataPointFormatOptions?.showOnlyUnitDecimals);
        }
    }
    return compileExpression(oBindingExpression);
  };
  _exports.buildFieldBindingExpression = buildFieldBindingExpression;
  const _computeBindingWithUnitOrCurrency = (propertyDataModelObjectPath, formattedValue, hideMeasure, showOnlyUnitDecimals) => {
    if (propertyDataModelObjectPath.targetObject?.annotations?.Measures?.Unit || propertyDataModelObjectPath.targetObject?.annotations?.Measures?.ISOCurrency) {
      if (hideMeasure && hasStaticPercentUnit(propertyDataModelObjectPath.targetObject)) {
        return formattedValue;
      }
      return getBindingWithUnitOrCurrency(propertyDataModelObjectPath, formattedValue, undefined, hideMeasure ? {
        showMeasure: false
      } : undefined, true, showOnlyUnitDecimals);
    }
    return formattedValue;
  };

  /**
   * Method to calculate the percentage value of Progress Indicator. Basic formula is Value/Target * 100.
   * @param oPropertyDataModelObjectPath
   * @returns The expression binding used to calculate the percentage value, which is shown in the progress indicator based on the formula given above.
   */
  _exports._computeBindingWithUnitOrCurrency = _computeBindingWithUnitOrCurrency;
  const buildExpressionForProgressIndicatorPercentValue = oPropertyDataModelObjectPath => {
    const fieldValue = oPropertyDataModelObjectPath?.targetObject?.Value || "";
    const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
    const fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const targetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject, relativeLocation);
    const oPropertyDefinition = fieldValue.$target;
    const unit = oPropertyDefinition.annotations?.Measures?.Unit || oPropertyDefinition.annotations?.Measures?.ISOCurrency;
    if (unit) {
      const unitBindingExpression = getExpressionFromAnnotation(unit, relativeLocation);
      return compileExpression(formatResult([fieldValueExpression, targetExpression, unitBindingExpression], valueFormatters.computePercentage));
    }
    return compileExpression(formatResult([fieldValueExpression, targetExpression, ""], valueFormatters.computePercentage));
  };
  _exports.buildExpressionForProgressIndicatorPercentValue = buildExpressionForProgressIndicatorPercentValue;
  return _exports;
}, false);
//# sourceMappingURL=DataPointTemplating-dbg.js.map

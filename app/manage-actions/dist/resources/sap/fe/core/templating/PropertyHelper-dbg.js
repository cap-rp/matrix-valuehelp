/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/SemanticObjectHelper"], function (TypeGuards, SemanticObjectHelper) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  /**
   * Check whether the property has the Core.Computed annotation or not.
   * @param oProperty The target property
   * @returns `true` if the property is computed
   */
  const isComputed = function (oProperty) {
    return !!oProperty.annotations?.Core?.Computed?.valueOf();
  };

  /**
   * Check whether the property has the Core.Immutable annotation or not.
   * @param oProperty The target property
   * @returns `true` if it's immutable
   */
  _exports.isComputed = isComputed;
  const isImmutable = function (oProperty) {
    return !!oProperty.annotations?.Core?.Immutable?.valueOf();
  };

  /**
   * Check whether the property is a key or not.
   * @param oProperty The target property
   * @returns `true` if it's a key
   */
  _exports.isImmutable = isImmutable;
  const isKey = function (oProperty) {
    return !!oProperty.isKey;
  };

  /**
   * Check whether the property is a semanticKey for the context entity.
   * @param property
   * @param contextDataModelObject The DataModelObject that holds the context
   * @returns `true`if it's a semantic key
   */
  _exports.isKey = isKey;
  const isSemanticKey = function (property, contextDataModelObject) {
    const semanticKeys = contextDataModelObject.contextLocation?.targetEntityType?.annotations?.Common?.SemanticKey;
    return semanticKeys?.some(function (key) {
      return key?.$target?.fullyQualifiedName === property?.fullyQualifiedName;
    }) ?? false;
  };

  /**
   * Checks whether the property has a date time or not.
   * @param oProperty
   * @returns `true` if it is of type date / datetime / datetimeoffset
   */
  _exports.isSemanticKey = isSemanticKey;
  const hasDateType = function (oProperty) {
    return ["Edm.Date", "Edm.DateTime", "Edm.DateTimeOffset"].includes(oProperty.type);
  };

  /**
   * Retrieve the label annotation.
   * @param oProperty The target property
   * @returns The label string
   */
  _exports.hasDateType = hasDateType;
  const getLabel = function (oProperty) {
    return oProperty.annotations?.Common?.Label?.toString() || "";
  };

  /**
   * Check whether the property has a semantic object defined or not.
   * @param property The target property
   * @returns `true` if it has a semantic object
   */
  _exports.getLabel = getLabel;
  const hasSemanticObject = function (property) {
    return SemanticObjectHelper.hasSemanticObject(property);
  };

  /**
   * Retrieves the timezone property associated to the property, if applicable.
   * @param oProperty The target property
   * @returns The timezone property, if it exists
   */
  _exports.hasSemanticObject = hasSemanticObject;
  const getAssociatedTimezoneProperty = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Common?.Timezone) ? oProperty.annotations?.Common?.Timezone.$target : undefined;
  };

  /**
   * Retrieves the timezone property path associated to the property, if applicable.
   * @param oProperty The target property
   * @returns The timezone property path, if it exists
   */
  _exports.getAssociatedTimezoneProperty = getAssociatedTimezoneProperty;
  const getAssociatedTimezonePropertyPath = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Common?.Timezone) ? oProperty?.annotations?.Common?.Timezone?.path : undefined;
  };

  /**
   * Retrieves the associated text property for a property, if it exists.
   * @param oProperty The target property
   * @returns The text property, if it exists
   */
  _exports.getAssociatedTimezonePropertyPath = getAssociatedTimezonePropertyPath;
  const getAssociatedTextProperty = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Common?.Text) ? oProperty.annotations?.Common?.Text.$target : undefined;
  };

  /**
   * Retrieves the Common.ExternalID property path if it exists.
   * @param property The target property
   * @returns The Common.ExternalID property path or undefined if it does not exist
   */
  _exports.getAssociatedTextProperty = getAssociatedTextProperty;
  const getAssociatedExternalIdPropertyPath = function (property) {
    //return property.annotations.Common?.ExternalID?.path;
    return isPathAnnotationExpression(property?.annotations.Common?.ExternalID) ? property?.annotations.Common?.ExternalID.path : undefined;
  };

  /**
   * Retrieves the associated externalID property for that property, if it exists.
   * @param property The target property
   * @returns The externalID property, if it exists
   */
  _exports.getAssociatedExternalIdPropertyPath = getAssociatedExternalIdPropertyPath;
  const getAssociatedExternalIdProperty = function (property) {
    return isPathAnnotationExpression(property?.annotations?.Common?.ExternalID) ? property.annotations?.Common?.ExternalID.$target : undefined;
  };

  /**
   * Retrieves the unit property associated to the property, if applicable.
   * @param oProperty The target property
   * @returns The unit property, if it exists
   */
  _exports.getAssociatedExternalIdProperty = getAssociatedExternalIdProperty;
  const getAssociatedUnitProperty = function (oProperty) {
    return oProperty && isPathAnnotationExpression(oProperty.annotations.Measures?.Unit) ? oProperty.annotations.Measures?.Unit.$target : undefined;
  };
  _exports.getAssociatedUnitProperty = getAssociatedUnitProperty;
  const getAssociatedUnitPropertyPath = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Measures?.Unit) ? oProperty.annotations?.Measures?.Unit.path : undefined;
  };

  /**
   * Retrieves the associated currency property for that property if it exists.
   * @param oProperty The target property
   * @returns The unit property, if it exists
   */
  _exports.getAssociatedUnitPropertyPath = getAssociatedUnitPropertyPath;
  const getAssociatedCurrencyProperty = function (oProperty) {
    return oProperty && isPathAnnotationExpression(oProperty.annotations.Measures?.ISOCurrency) ? oProperty.annotations.Measures?.ISOCurrency.$target : undefined;
  };
  _exports.getAssociatedCurrencyProperty = getAssociatedCurrencyProperty;
  const getAssociatedCurrencyPropertyPath = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Measures?.ISOCurrency) ? oProperty.annotations?.Measures?.ISOCurrency.path : undefined;
  };

  /**
   * Retrieves the associated static currency or unit for a given property if it exists.
   * @param property The target property
   * @returns The unit or currency static value, if it exists
   */
  _exports.getAssociatedCurrencyPropertyPath = getAssociatedCurrencyPropertyPath;
  const getStaticUnitOrCurrency = function (property) {
    const unitOrCurrency = property.annotations?.Measures?.ISOCurrency ?? property.annotations?.Measures?.Unit;
    if (!unitOrCurrency || isPathAnnotationExpression(unitOrCurrency)) {
      return undefined;
    }
    return `${unitOrCurrency}`;
  };

  /**
   * Retrieves the associated timezone static text a given property if it exists.
   * @param property The target property
   * @returns The timezone static value, if it exists
   */
  _exports.getStaticUnitOrCurrency = getStaticUnitOrCurrency;
  const getStaticTimezone = function (property) {
    const staticTimezone = property.annotations?.Common?.Timezone;
    if (!staticTimezone || isPathAnnotationExpression(staticTimezone)) {
      return undefined;
    }
    return `${staticTimezone}`;
  };

  /**
   * Retrieves the Common.Text property path if it exists.
   * @param oProperty The target property
   * @returns The Common.Text property path or undefined if it does not exist
   */
  _exports.getStaticTimezone = getStaticTimezone;
  const getAssociatedTextPropertyPath = function (oProperty) {
    return isPathAnnotationExpression(oProperty?.annotations?.Common?.Text) ? oProperty?.annotations?.Common?.Text.path : undefined;
  };

  /**
   * Check whether the property has a value help annotation defined or not.
   * @param property The target property to be checked
   * @returns `true` if it has a value help
   */
  _exports.getAssociatedTextPropertyPath = getAssociatedTextPropertyPath;
  const hasValueHelp = function (property) {
    return !!property.annotations?.Common?.ValueList || !!property.annotations?.Common?.ValueListReferences || !!property.annotations?.Common?.ValueListMapping;
  };

  /**
   * Check whether the property has a value help with fixed value annotation defined or not.
   * @param oProperty The target property
   * @returns `true` if it has a value help
   */
  _exports.hasValueHelp = hasValueHelp;
  const hasValueHelpWithFixedValues = function (oProperty) {
    return !!oProperty?.annotations?.Common?.ValueListWithFixedValues?.valueOf();
  };

  /**
   * Check whether the property has a value help for validation annotation defined or not.
   * @param oProperty The target property
   * @returns `true` if it has a value help
   */
  _exports.hasValueHelpWithFixedValues = hasValueHelpWithFixedValues;
  const hasValueListForValidation = function (oProperty) {
    return oProperty.annotations?.Common?.ValueListForValidation !== undefined;
  };
  _exports.hasValueListForValidation = hasValueListForValidation;
  const hasTimezone = function (oProperty) {
    return oProperty.annotations?.Common?.Timezone !== undefined;
  };
  /**
   * Checks whether the property is a unit property.
   * @param property The property to be checked
   * @returns `true` if it is a unit
   */
  _exports.hasTimezone = hasTimezone;
  const isUnit = function (property) {
    return !!property.annotations?.Common?.IsUnit?.valueOf();
  };

  /**
   * Checks whether the property has a text property.
   * @param property The property to be checked
   * @returns `true` if it is a Text
   */
  _exports.isUnit = isUnit;
  const hasText = function (property) {
    return property.annotations?.Common?.Text !== undefined;
  };

  /**
   * Checks whether the property has an ImageURL.
   * @param property The property to be checked
   * @returns `true` if it is an ImageURL
   */
  _exports.hasText = hasText;
  const isImageURL = function (property) {
    return !!property.annotations?.UI?.IsImageURL?.valueOf();
  };

  /**
   * Checks whether the property is a currency property.
   * @param oProperty The property to be checked
   * @returns `true` if it is a currency
   */
  _exports.isImageURL = isImageURL;
  const isCurrency = function (oProperty) {
    return !!oProperty.annotations?.Common?.IsCurrency?.valueOf();
  };

  /**
   * Checks whether the property has a currency property.
   * @param property The property to be checked
   * @returns `true` if it has a currency
   */
  _exports.isCurrency = isCurrency;
  const hasCurrency = function (property) {
    return property.annotations?.Measures?.ISOCurrency !== undefined;
  };

  /**
   * Checks whether the property has a unit property.
   * @param property The property to be checked
   * @returns `true` if it has a unit
   */
  _exports.hasCurrency = hasCurrency;
  const hasUnit = function (property) {
    return property.annotations?.Measures?.Unit !== undefined;
  };

  /**
   * Checks whether the property type has Edm.Guid.
   * @param property The property to be checked
   * @returns `true` if it is a Guid
   */
  _exports.hasUnit = hasUnit;
  const isGuid = function (property) {
    return property.type === "Edm.Guid";
  };

  /**
   * Checks if the property has a static unit that is %.
   * @param property The target property
   * @returns `true` if the property is annotated with the static unit %
   */
  _exports.isGuid = isGuid;
  const hasStaticPercentUnit = function (property) {
    return property?.annotations?.Measures?.Unit?.toString() === "%";
  };

  /**
   * Check if the form element or action parameter supports multi line text input.
   * @param parameter Property or ActionParameter.
   * @returns Boolean
   */
  _exports.hasStaticPercentUnit = hasStaticPercentUnit;
  function isMultiLineText(parameter) {
    return parameter?.annotations?.UI?.MultiLineText?.valueOf() === true;
  }

  /**
   * Checks whether the property is a timezone property.
   * @param property The property to be checked
   * @returns `true` if it is a timezone property
   */
  _exports.isMultiLineText = isMultiLineText;
  function isTimezone(property) {
    return !!property.annotations?.Common?.IsTimezone?.valueOf();
  }
  _exports.isTimezone = isTimezone;
  return _exports;
}, false);
//# sourceMappingURL=PropertyHelper-dbg.js.map

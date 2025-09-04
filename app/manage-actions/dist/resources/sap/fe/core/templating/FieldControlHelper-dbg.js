/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "../converters/annotations/DataField", "../helpers/BindingHelper", "../helpers/TypeGuards"], function (BindingToolkit, DataField, BindingHelper, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataField = DataField.isDataField;
  var or = BindingToolkit.or;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  /**
   * Create the binding expression to check if the property is read only or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  const isReadOnlyExpression = function (oTarget, relativePath) {
    const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
    } else {
      return or(equal(fieldControlExpression, "Common.FieldControlType/ReadOnly"), equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
    }
  };

  /**
   * Create the binding expression to check if the property is disabled or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's disabled
   */
  _exports.isReadOnlyExpression = isReadOnlyExpression;
  const isDisabledExpression = function (oTarget, relativePath) {
    const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
    } else {
      return or(equal(fieldControlExpression, "Common.FieldControlType/Hidden"),
      // deprecated version but still used by stakeholders
      equal(fieldControlExpression, "Common.FieldControlType/Inapplicable"), equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
    }
  };

  /**
   * Create the binding expression to check if the property is editable or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's not editable
   */
  _exports.isDisabledExpression = isDisabledExpression;
  const isNonEditableExpression = function (oTarget, relativePath) {
    return or(isReadOnlyExpression(oTarget, relativePath), isDisabledExpression(oTarget, relativePath));
  };

  /**
   * Determines if the dataFieldForAnnotation has a fieldControl that is not set to Mandatory.
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if it has a fieldControl set and not Mandatory.
   */
  _exports.isNonEditableExpression = isNonEditableExpression;
  const hasFieldControlNotMandatory = function (dataFieldForAnnotation) {
    const fieldControl = dataFieldForAnnotation.annotations?.Common?.FieldControl;
    return fieldControl && fieldControl.toString() !== "Common.FieldControlType/Mandatory" ? true : false;
  };

  /**
   * Determines if the target has a field control annotation with static value mandatory .
   * @param target The target to be processed
   * @returns True if it has a static mandatory field control.
   */
  _exports.hasFieldControlNotMandatory = hasFieldControlNotMandatory;
  function isStaticallyMandatory(target) {
    const fieldFieldControl = target?.annotations?.Common?.FieldControl;
    if (isProperty(target) || isDataFieldForAnnotation(target)) {
      return fieldFieldControl?.toString() === "Common.FieldControlType/Mandatory";
    }
    if (isDataField(target)) {
      if (fieldFieldControl?.toString() === "Common.FieldControlType/Mandatory") {
        return true;
      }
      if (fieldFieldControl?.toString() !== undefined) {
        return false;
      } else {
        return target?.Value?.$target?.annotations?.Common?.FieldControl?.toString() === "Common.FieldControlType/Mandatory";
      }
    }
    return target?.Value?.$target?.annotations?.Common?.FieldControl?.toString() === "Common.FieldControlType/Mandatory";
  }

  /**
   * Create the binding expression to check if the property is read only or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  _exports.isStaticallyMandatory = isStaticallyMandatory;
  const isRequiredExpression = function (oTarget, relativePath) {
    const oFieldControlValue = oTarget?.annotations?.Common?.FieldControl;
    const fieldControlValue = getExpressionFromAnnotation(oFieldControlValue, relativePath);
    return _isRequiredExpression(fieldControlValue);
  };

  /**
   * Create the binding expression to check if action parameter is required.
   * @param actionParameter Action parameter
   * @param actionTarget Action definition
   * @param convertedTypes Converted Metadata
   * @returns Is required binding expression for parameter.
   */
  _exports.isRequiredExpression = isRequiredExpression;
  const isActionParameterRequiredExpression = function (actionParameter, actionTarget, convertedTypes) {
    const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
    const fieldControlValue = actionParameter.annotations?.Common?.FieldControl;
    const fieldControlExp = getExpressionFromAnnotation(fieldControlValue, [], undefined, path => bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName));
    return _isRequiredExpression(fieldControlExp);
  };
  _exports.isActionParameterRequiredExpression = isActionParameterRequiredExpression;
  const _isRequiredExpression = fieldControlExp => {
    return or(isConstant(fieldControlExp) && equal(fieldControlExp, "Common.FieldControlType/Mandatory"), equal(fieldControlExp, 7), equal(fieldControlExp, "7"));
  };
  return _exports;
}, false);
//# sourceMappingURL=FieldControlHelper-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/templating/DataModelPathHelper"], function (Log, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getTargetEntitySetInfo = DataModelPathHelper.getTargetEntitySetInfo;
  const ALLOWED_EXPRESSIONS_PRIORITY = ["SingleValue", "MultiValue", "SingleRange", "MultiRange", "SearchExpression", "MultiRangeOrSearchExpression"];

  /**
   * Get allowed filter expression by priority.
   * @param expressions Allowed filter expressions from different sources.
   * @returns Allowed filter expression
   */
  function getSpecificAllowedExpression(expressions) {
    expressions.sort(function (a, b) {
      return ALLOWED_EXPRESSIONS_PRIORITY.indexOf(a) - ALLOWED_EXPRESSIONS_PRIORITY.indexOf(b);
    });
    return expressions[0];
  }

  /**
   * Get allowed filter expression from filter restrictions.
   * @param propertyName Property name
   * @param filterRestictions Filter restrictions
   * @returns Allowed filter expression
   */
  function getAllowedFilterExpressionForFilterRestictions(propertyName, filterRestictions) {
    const fR = filterRestictions?.FilterExpressionRestrictions?.find(fr => fr.Property?.value === propertyName);
    return fR?.AllowedExpressions?.toString();
  }

  /**
   * Get the allowed filter expression for a property.
   * @param propertyObjectPath Property object path
   * @returns Allowed filter expression
   */
  function getAllowedFilterExpressionForProperty(propertyObjectPath) {
    if (propertyObjectPath.targetEntityType.annotations.Common?.ResultContext?.valueOf() === true) {
      // It is a Parameter
      return "SingleValue";
    }
    const navProps = propertyObjectPath.navigationProperties;
    const lastNavProp = navProps[navProps.length - 1];
    const isContainment = lastNavProp?.containsTarget;
    const propertyName = propertyObjectPath.targetObject?.name;
    if (!propertyName) {
      Log.warning(`Property name not found!`);
      return;
    }
    let allowedExps = [];
    if (lastNavProp) {
      // Allowed Exp at parent navigation property
      const navPropFR = lastNavProp.annotations.Capabilities?.FilterRestrictions;
      const navPropAllowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, navPropFR);
      allowedExps = allowedExps.concat(navPropAllowedExp ? [navPropAllowedExp] : []);
      const {
        parentEntitySet,
        parentNavigationPath
      } = getTargetEntitySetInfo(propertyObjectPath);

      // Allowed Exp at parent entitySet.
      const parentFRAllowedExp = getAllowedFilterExpressionForFilterRestictions(`${parentNavigationPath}/${propertyName}`, parentEntitySet?.annotations.Capabilities?.FilterRestrictions);
      allowedExps = allowedExps.concat(parentFRAllowedExp ? [parentFRAllowedExp] : []);

      // Allowed Exp at parent entitySet Nav Restrictions.
      const parentNR = parentEntitySet?.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties.find(rp => rp.NavigationProperty.value === parentNavigationPath);
      // New way property name in restriction is expected to have navigation path at the start of it.
      const parentNRAllowedExp = getAllowedFilterExpressionForFilterRestictions(`${parentNavigationPath}/${propertyName}`, parentNR?.FilterRestrictions);
      allowedExps = allowedExps.concat(parentNRAllowedExp ? [parentNRAllowedExp] : []);

      // Old way property name in restriction is relative to navigation path of the navigation restriction.
      const legacyParenNRtAllowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, parentNR?.FilterRestrictions);
      allowedExps = allowedExps.concat(legacyParenNRtAllowedExp ? [legacyParenNRtAllowedExp] : []);
    }

    // Allowed Exp at target entitySet.
    if (!isContainment && propertyObjectPath.targetEntitySet) {
      const targetEntitySet = propertyObjectPath.targetEntitySet;
      const filterRestictions = targetEntitySet.annotations.Capabilities?.FilterRestrictions;
      const allowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, filterRestictions);
      allowedExps = allowedExps.concat(allowedExp ? [allowedExp] : []);
    }
    return getSpecificAllowedExpression(allowedExps);
  }

  /**
   * Checks the maximum number of filter conditions for a property.
   * @param propertyObjectPath Property object path
   * @returns The number of maximum allowed conditions or -1 if there is no limit.
   */
  _exports.getAllowedFilterExpressionForProperty = getAllowedFilterExpressionForProperty;
  function getMaxConditions(propertyObjectPath) {
    let max = -1;
    const allowedExpression = getAllowedFilterExpressionForProperty(propertyObjectPath);
    if (propertyObjectPath.targetObject?.type === "Edm.Boolean" || allowedExpression === "SingleValue" || allowedExpression === "SingleRange") {
      max = 1;
    }
    return max;
  }
  _exports.getMaxConditions = getMaxConditions;
  return _exports;
}, false);
//# sourceMappingURL=FilterField-dbg.js.map

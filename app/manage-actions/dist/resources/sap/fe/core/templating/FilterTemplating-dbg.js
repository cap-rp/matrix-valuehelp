/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isEntitySet = TypeGuards.isEntitySet;
  function getIsRequired(converterContext, sPropertyPath) {
    const entitySet = converterContext.getEntitySet();
    let capabilities;
    if (isEntitySet(entitySet)) {
      capabilities = entitySet.annotations.Capabilities;
    }
    const aRequiredProperties = capabilities?.FilterRestrictions?.RequiredProperties;
    let bIsRequired = false;
    if (aRequiredProperties) {
      aRequiredProperties.forEach(function (oRequiredProperty) {
        if (sPropertyPath === oRequiredProperty?.value) {
          bIsRequired = true;
        }
      });
    }
    return bIsRequired;
  }
  _exports.getIsRequired = getIsRequired;
  function isPropertyFilterable(converterContext, valueListProperty) {
    let bNotFilterable, bHidden;
    const entityType = converterContext.getEntityType();
    const entitySet = converterContext.getEntitySet();
    let capabilities;
    if (isEntitySet(entitySet)) {
      capabilities = entitySet.annotations.Capabilities;
    }
    const nonFilterableProperties = capabilities?.FilterRestrictions?.NonFilterableProperties;
    const properties = entityType.entityProperties;
    properties.forEach(property => {
      const PropertyPath = property.name;
      if (PropertyPath === valueListProperty) {
        bHidden = property.annotations?.UI?.Hidden?.valueOf();
      }
    });
    if (nonFilterableProperties && nonFilterableProperties.length > 0) {
      for (const item of nonFilterableProperties) {
        const sPropertyName = item?.value;
        if (sPropertyName === valueListProperty) {
          bNotFilterable = true;
        }
      }
    }
    return bNotFilterable || bHidden;
  }
  _exports.isPropertyFilterable = isPropertyFilterable;
  return _exports;
}, false);
//# sourceMappingURL=FilterTemplating-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "./PropertyHelper", "./UIFormatters"], function (MetaModelConverter, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var getConverterContext = UIFormatters.getConverterContext;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const getProperty = function (oContext, oInterface) {
    const sPath = oInterface.context.getPath();
    if (!oContext) {
      throw new Error(`Unresolved context path ${sPath}`);
    }
    if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
      throw new Error(`Context does not resolve to a Property object but to a ${oContext.$kind}`);
    }
    let oConverterContext = getConverterContext(oContext, oInterface);
    if (isPathAnnotationExpression(oConverterContext)) {
      oConverterContext = oConverterContext.$target;
    }
    return oConverterContext;
  };
  _exports.getProperty = getProperty;
  const getPropertyObjectPath = function (oContext, oInterface) {
    const sPath = oInterface.context.getPath();
    if (!oContext) {
      throw new Error(`Unresolved context path ${sPath}`);
    }
    if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
      throw new Error(`Context does not resolve to a Property object but to a ${oContext.$kind}`);
    }
    let involvedDataModelObjects = getInvolvedDataModelObjects(oInterface.context);
    if (isPathAnnotationExpression(involvedDataModelObjects.targetObject)) {
      involvedDataModelObjects = enhanceDataModelPath(involvedDataModelObjects, involvedDataModelObjects.targetObject.path);
    }
    return involvedDataModelObjects;
  };
  _exports.getPropertyObjectPath = getPropertyObjectPath;
  const isKey = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return PropertyHelper.isKey(oProperty);
  };
  _exports.isKey = isKey;
  const hasValueHelp = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return PropertyHelper.hasValueHelp(oProperty);
  };
  _exports.hasValueHelp = hasValueHelp;
  const hasDateType = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return PropertyHelper.hasDateType(oProperty);
  };
  _exports.hasDateType = hasDateType;
  const hasValueHelpWithFixedValues = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return PropertyHelper.hasValueHelpWithFixedValues(oProperty);
  };
  _exports.hasValueHelpWithFixedValues = hasValueHelpWithFixedValues;
  const getName = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return oProperty.name;
  };
  _exports.getName = getName;
  const getLabel = function (oContext, oInterface) {
    const oProperty = getProperty(oContext, oInterface);
    return PropertyHelper.getLabel(oProperty);
  };
  _exports.getLabel = getLabel;
  const getPropertyPath = function (oContext, oInterface) {
    const propertyPath = getPropertyObjectPath(oContext, oInterface);
    return getTargetObjectPath(propertyPath);
  };
  _exports.getPropertyPath = getPropertyPath;
  const getRelativePropertyPath = function (oContext, oInterface) {
    const propertyPath = getPropertyObjectPath(oContext, oInterface);
    return getTargetObjectPath(propertyPath, true);
  };
  _exports.getRelativePropertyPath = getRelativePropertyPath;
  return _exports;
}, false);
//# sourceMappingURL=PropertyFormatters-dbg.js.map

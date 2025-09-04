/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters"], function (BindingToolkit, MetaModelConverter, BindingHelper, TypeGuards, DataModelPathHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var isVisible = UIFormatters.isVisible;
  var getConverterContext = UIFormatters.getConverterContext;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationPath = TypeGuards.isAnnotationPath;
  var UI = BindingHelper.UI;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var concat = BindingToolkit.concat;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  const getDataField = function (oContext, oInterface) {
    const sPath = oInterface.context.getPath();
    if (!oContext) {
      throw new Error(`Unresolved context path ${sPath}`);
    }
    if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
      throw new Error(`Context does not resolve to a DataField object but to a ${oContext.$kind}`);
    }
    let oConverterContext = getConverterContext(oContext, oInterface);
    if (isAnnotationPath(oConverterContext) || isPathAnnotationExpression(oConverterContext)) {
      oConverterContext = oConverterContext.$target;
    }
    return oConverterContext;
  };
  _exports.getDataField = getDataField;
  const getDataFieldObjectPath = function (oContext, oInterface) {
    const sPath = oInterface.context.getPath();
    if (!oContext) {
      throw new Error(`Unresolved context path ${sPath}`);
    }
    if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
      throw new Error(`Context does not resolve to a Property object but to a ${oContext.$kind}`);
    }
    let involvedDataModelObjects = getInvolvedDataModelObjects(oInterface.context);
    if (involvedDataModelObjects.targetObject && isPathAnnotationExpression(involvedDataModelObjects.targetObject)) {
      involvedDataModelObjects = enhanceDataModelPath(involvedDataModelObjects, involvedDataModelObjects.targetObject.path);
    }
    if (involvedDataModelObjects.targetObject && isAnnotationPath(involvedDataModelObjects.targetObject)) {
      // REVIEW -> The code below was never correct, i'm changing it to something that makes sense type wise
      involvedDataModelObjects = enhanceDataModelPath(involvedDataModelObjects, involvedDataModelObjects.targetObject.value);
    }
    if (sPath.endsWith("$Path") || sPath.endsWith("$AnnotationPath")) {
      involvedDataModelObjects = enhanceDataModelPath(involvedDataModelObjects, oContext);
    }
    return involvedDataModelObjects;
  };
  _exports.getDataFieldObjectPath = getDataFieldObjectPath;
  const isSemanticallyConnectedFields = function (oContext, oInterface) {
    const oDataField = getDataField(oContext, oInterface);
    return oDataField.$Type === "com.sap.vocabularies.UI.v1.ConnectedFieldsType";
  };

  /**
   *
   * @param oContext The Context of the property
   * @param oInterface The interface instance
   * @returns True if the property has MultiLineText annotation
   */
  _exports.isSemanticallyConnectedFields = isSemanticallyConnectedFields;
  const isMultiLineText = function (oContext, oInterface) {
    const oDataField = getDataField(oContext, oInterface);
    return oDataField.annotations?.UI?.MultiLineText?.valueOf() === true;
  };
  _exports.isMultiLineText = isMultiLineText;
  const connectedFieldsTemplateRegex = /(?:({[^}]+})[^{]*)/g;
  const connectedFieldsTemplateSubRegex = /{([^}]+)}(.*)/;
  const getLabelForConnectedFields = function (connectedFieldsPath, getTextBindingExpression) {
    let compileBindingExpression = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    const connectedFields = connectedFieldsPath.targetObject;
    // First we separate each group of `{TemplatePart} xxx`
    const templateMatches = connectedFields.Template.toString().match(connectedFieldsTemplateRegex);
    if (!templateMatches) {
      return "";
    }
    const partsToConcat = templateMatches.reduce((subPartsToConcat, match) => {
      // Then for each sub-group, we retrieve the name of the data object and the remaining text, if it exists
      const subMatch = match.match(connectedFieldsTemplateSubRegex);
      if (subMatch && subMatch.length > 1) {
        const targetValue = subMatch[1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetData = connectedFields.Data[targetValue];
        if (targetData) {
          const dataFieldPath = enhanceDataModelPath(connectedFieldsPath,
          // TODO Better type for the Edm.Dictionary
          targetData.fullyQualifiedName.replace(connectedFieldsPath.targetEntityType.fullyQualifiedName, ""));
          dataFieldPath.targetObject = dataFieldPath.targetObject.Value;
          subPartsToConcat.push(getTextBindingExpression(dataFieldPath, {}));
          if (subMatch.length > 2) {
            subPartsToConcat.push(constant(subMatch[2]));
          }
        }
      }
      return subPartsToConcat;
    }, []);
    return compileBindingExpression ? compileExpression(concat(...partsToConcat)) : concat(...partsToConcat);
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
  _exports.getLabelForConnectedFields = getLabelForConnectedFields;
  const generateVisibleExpression = function (dataFieldModelPath, formatOptions) {
    let propertyValue;
    let targetModelPath;
    const targetObject = dataFieldModelPath.targetObject;
    if (targetObject && !isProperty(targetObject)) {
      switch (targetObject.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        case "com.sap.vocabularies.UI.v1.DataPointType":
          propertyValue = targetObject.Value.$target;
          targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject.Value.path);
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          // if it is a DataFieldForAnnotation pointing to a DataPoint we look at the dataPoint's value
          if (targetObject?.Target?.$target?.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
            propertyValue = targetObject.Target.$target?.Value.$target;
            targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject.Target.value);
            targetModelPath = enhanceDataModelPath(targetModelPath, targetObject.Target.$target?.Value.path);
            break;
          }
        // eslint-disable-next-line no-fallthrough
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        default:
          propertyValue = undefined;
      }
    } else if (targetObject && isProperty(targetObject)) {
      targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject);
    }
    const isAnalyticalGroupHeaderExpanded = formatOptions?.isAnalytics ? UI.IsExpanded : constant(false);
    const isAnalyticalLeaf = formatOptions?.isAnalytics ? equal(UI.NodeLevel, 0) : constant(false);
    // A data field is visible if:
    // - the UI.Hidden expression in the original annotation does not evaluate to 'true'
    // - the UI.Hidden expression in the target property does not evaluate to 'true'
    // - in case of Analytics it's not visible for an expanded GroupHeader
    return and(...[isVisible(dataFieldModelPath.targetObject, getRelativePaths(dataFieldModelPath)), ifElse(!!propertyValue, propertyValue && isVisible(propertyValue, getRelativePaths(targetModelPath)), true), or(not(isAnalyticalGroupHeaderExpanded), isAnalyticalLeaf)]);
  };
  _exports.generateVisibleExpression = generateVisibleExpression;
  return _exports;
}, false);
//# sourceMappingURL=DataFieldFormatters-dbg.js.map

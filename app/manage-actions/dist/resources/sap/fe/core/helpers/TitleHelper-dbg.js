/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataFieldFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "../converters/annotations/DataField"], function (BindingToolkit, valueFormatters, BindingHelper, TypeGuards, DataFieldFormatters, DataModelPathHelper, UIFormatters, DataField) {
  "use strict";

  var _exports = {};
  var isDataField = DataField.isDataField;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var getLabelForConnectedFields = DataFieldFormatters.getLabelForConnectedFields;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
  var transformRecursively = BindingToolkit.transformRecursively;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isUndefinedExpression = BindingToolkit.isUndefinedExpression;
  var isEmpty = BindingToolkit.isEmpty;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const formatValueRecursively = function (bindingExpressionToEnhance, fullContextPath) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      let outExpression = expression;
      if (expression.modelName === undefined) {
        // In case of default model we then need to resolve the text arrangement property
        const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
        outExpression = formatWithTypeInformation(oPropertyDataModelPath.targetObject, expression);
      }
      return outExpression;
    });
  };

  /**
   * Get property definition from data model object path.
   * @param propertyDataModelObject The property data model object
   * @returns The property
   */
  _exports.formatValueRecursively = formatValueRecursively;
  const getPropertyDefinition = propertyDataModelObject => {
    const propertyPathOrProperty = propertyDataModelObject.targetObject;
    return isPropertyPathExpression(propertyPathOrProperty) ? propertyPathOrProperty.$target : propertyPathOrProperty;
  };

  /**
   * Checks whether an associated active entity exists.
   * @param fullContextPath The full path to the context
   * @returns The expression-binding string
   */
  const isOrHasActiveEntity = fullContextPath => {
    const draftRoot = fullContextPath.targetEntitySet?.annotations?.Common?.DraftRoot;
    const draftNode = fullContextPath.targetEntitySet?.annotations?.Common?.DraftNode;
    if (!!draftRoot || !!draftNode) {
      return not(Draft.IsNewObject);
    }
    return true;
  };

  /**
   * Checks if title value expression is empty.
   * @param titleValueExpression The title value expression
   * @returns The expression-binding string
   */
  const isTitleEmptyBooleanExpression = titleValueExpression => titleValueExpression._type === "Constant" ? constant(!titleValueExpression.value) : isEmpty(titleValueExpression);

  /**
   * Retrieves the title expression binding.
   * @param propertyDataModelPath The full path to the property context
   * @param propertyBindingExpression The binding expression of the property above
   * @param [formatOptions] The format options of the field
   * @param formatOptions.displayMode
   * @returns The expression-binding parameters
   */
  const getTitleBindingWithTextArrangement = function (propertyDataModelPath, propertyBindingExpression, formatOptions) {
    const targetDisplayModeOverride = formatOptions?.displayMode;
    const propertyDefinition = getPropertyDefinition(propertyDataModelPath);
    const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
    const commonText = propertyDefinition?.annotations?.Common?.Text;
    const relativeLocation = getRelativePaths(propertyDataModelPath);
    if (propertyDefinition) {
      propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    }
    let params = [propertyBindingExpression];
    if (targetDisplayMode !== "Value" && commonText) {
      switch (targetDisplayMode) {
        case "Description":
          params = [getExpressionFromAnnotation(commonText, relativeLocation)];
          break;
        case "DescriptionValue":
          const targetExpression = formatOptions?.splitTitleOnTwoLines === undefined ? ifElse(!!commonText.annotations?.UI?.TextArrangement, propertyBindingExpression, constant("")) : ifElse(!!formatOptions?.splitTitleOnTwoLines, constant(""), propertyBindingExpression);
          params = [getExpressionFromAnnotation(commonText, relativeLocation), targetExpression];
          break;
        case "ValueDescription":
          params = [propertyBindingExpression, ifElse(!!formatOptions?.splitTitleOnTwoLines, constant(""), getExpressionFromAnnotation(commonText, relativeLocation))];
          break;
      }
    }
    return params;
  };

  /**
   * Recursively add the text arrangement to a title binding expression.
   * @param bindingExpressionToEnhance The binding expression to be enhanced
   * @param path The data field data model object path
   * @returns An updated expression containing the text arrangement binding parameters
   */
  const addTextArrangementToTitleBindingExpression = function (bindingExpressionToEnhance, path) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      if (expression.modelName !== undefined) return expression;
      // In case of default model we then need to resolve the text arrangement property
      const propertyDataModelPath = enhanceDataModelPath(path, expression.path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getTitleBindingWithTextArrangement(propertyDataModelPath, expression);
    });
  };

  /**
   * Gets binding expression for create mode title.
   * @returns The expression-binding string
   */
  const getCreateModeTitle = function () {
    const createModeTitle = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
    return formatResult([createModeTitle], valueFormatters.formatTitle);
  };

  /**
   * Checks whether an empty string should be used.
   * @param path The meta path pointing to the property used for the title
   * @returns The expression-binding string
   */
  const shouldForceEmptyString = path => {
    const propertyDefinition = getPropertyDefinition(path);
    if (propertyDefinition && propertyDefinition.annotations?.Core?.Computed) {
      return UI.IsInactive;
    } else {
      return constant(false);
    }
  };

  /**
   * Gets title value expression from object page header info.
   * @param fullContextPath The full path to the context
   * @param headerInfoTitle The title value from the object page header info
   * @param getTextBindingExpression The function to get the text binding expression
   * @returns The expression-binding string
   */
  const getTitleValueExpressionFromHeaderInfo = function (fullContextPath, headerInfoTitle, getTextBindingExpression) {
    let titleValueExpression;
    if (headerInfoTitle.$Type === "com.sap.vocabularies.UI.v1.DataField") {
      titleValueExpression = getExpressionFromAnnotation(headerInfoTitle.Value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (headerInfoTitle.Value?.$target?.annotations.Common?.Text?.annotations?.UI?.TextArrangement) {
        // In case an explicit text arrangement was set we make use of it in the description as well
        titleValueExpression = addTextArrangementToTitleBindingExpression(titleValueExpression, fullContextPath);
      }
      titleValueExpression = formatValueRecursively(titleValueExpression, fullContextPath);
    }
    if (headerInfoTitle.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && headerInfoTitle.Target.$target?.$Type === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
      const connectedFieldsPath = enhanceDataModelPath(fullContextPath, "$Type/@UI.HeaderInfo/Title/Target/$AnnotationPath");
      titleValueExpression = getLabelForConnectedFields(connectedFieldsPath, getTextBindingExpression, false);
    }
    return titleValueExpression;
  };

  /**
   * Creates binding expression for Object Page, Quick View, and other titles.
   * @param path The data model object path
   * @param getTextBindingExpression The function to get the text binding expression
   * @param [formatOptions] The format options of the field
   * @param formatOptions.displayMode
   * @param [headerInfo] The object page header info
   * @param [viewData] The associated view data
   * @param customFormatter
   * @returns The compiled expression-binding string
   */
  const getTitleBindingExpression = function (path, getTextBindingExpression, formatOptions, headerInfo, viewData, customFormatter) {
    const formatter = customFormatter || valueFormatters.formatTitle;
    let createModeTitle = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
    let titleValueExpression;
    let isHeaderInfoTitleEmpty = false;

    //If the title contains a guid with an external ID we want to behave as if the title annotation would point to the target
    //of the externalID annotation
    let extIdHeaderInfoTitle;
    if (isDataField(headerInfo?.Title) && headerInfo?.Title.Value?.$target?.annotations?.Common?.ExternalID) {
      extIdHeaderInfoTitle = {
        ...headerInfo.Title,
        Value: {
          ...headerInfo.Title.Value,
          $target: {
            ...headerInfo.Title.Value.$target
          }
        }
      };
      extIdHeaderInfoTitle.Value.path = headerInfo.Title.Value.$target?.annotations?.Common?.ExternalID.path;
      extIdHeaderInfoTitle.Value.$target = headerInfo.Title.Value.$target?.annotations?.Common?.ExternalID.$target;
    }

    // If we have a headerInfo but no title, or empty title we need to display an empty string when we are on an active object
    // received header info for object page
    if (headerInfo?.Title?.$Type && viewData) {
      if (extIdHeaderInfoTitle === undefined) {
        titleValueExpression = getTitleValueExpressionFromHeaderInfo(path, headerInfo.Title, getTextBindingExpression);
      } else {
        titleValueExpression = getTitleValueExpressionFromHeaderInfo(path, extIdHeaderInfoTitle, getTextBindingExpression);
      }
      createModeTitle = getCreateModeTitle();
      if (isConstant(titleValueExpression) && titleValueExpression.value === "") {
        isHeaderInfoTitleEmpty = true;
      }
    } else if (headerInfo && (headerInfo.Title === undefined || headerInfo.Title.toString() === "")) {
      isHeaderInfoTitleEmpty = true;
      // received header info for objectPage
      if (!viewData) {
        titleValueExpression = constant("");
      }
    }
    if (titleValueExpression && isConstant(titleValueExpression)) {
      return compileExpression(titleValueExpression);
    }

    // needed for quickview
    if (isPathAnnotationExpression(path.targetObject)) {
      path = enhanceDataModelPath(path, path.targetObject.path);
    }
    const propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(path));
    let params;
    if (titleValueExpression) {
      params = Array.isArray(titleValueExpression) ? titleValueExpression : [titleValueExpression];
    } else if (path.targetObject && isProperty(path.targetObject)) {
      params = getTitleBindingWithTextArrangement(path, propertyBindingExpression, formatOptions);
    }
    const isTitleEmpty = params === undefined || isTitleEmptyBooleanExpression(params[0]);
    const forceEmptyString = shouldForceEmptyString(path);
    const formattedExpression = params != undefined && formatResult(params, formatter);
    titleValueExpression = ifElse(isTitleEmpty, ifElse(or(isHeaderInfoTitleEmpty && isOrHasActiveEntity(path), forceEmptyString), "", ifElse(isUndefinedExpression(constant(customFormatter)), ifElse(or(UI.IsCreateMode, not(isOrHasActiveEntity(path))), createModeTitle, pathInModel("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO", "sap.fe.i18n")), ifElse(not(isOrHasActiveEntity(path)), viewData?.resourceModel.getText("T_NEW_OBJECT"), viewData?.resourceModel.getText("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO")))), formattedExpression);
    return compileExpression(titleValueExpression);
  };
  _exports.getTitleBindingExpression = getTitleBindingExpression;
  return _exports;
}, false);
//# sourceMappingURL=TitleHelper-dbg.js.map

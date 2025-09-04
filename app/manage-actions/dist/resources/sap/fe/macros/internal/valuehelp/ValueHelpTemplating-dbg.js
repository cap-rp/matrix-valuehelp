/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ModelHelper", "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter", "sap/ui/core/CustomData", "sap/ui/mdc/ValueHelp", "sap/ui/mdc/valuehelp/Dialog", "sap/ui/mdc/valuehelp/Popover", "sap/ui/mdc/valuehelp/content/Conditions", "sap/ui/mdc/valuehelp/content/MTable", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, StableIdHelper, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters, FieldHelper, MetaModelConverter, ModelHelper, additionalValueFormatter, CustomData, ValueHelp, Dialog, Popover, Conditions, MTable, _jsx) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var isUnit = PropertyHelper.isUnit;
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var isGuid = PropertyHelper.isGuid;
  var isCurrency = PropertyHelper.isCurrency;
  var hasValueListForValidation = PropertyHelper.hasValueListForValidation;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var hasDateType = PropertyHelper.hasDateType;
  var getLabel = PropertyHelper.getLabel;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var checkFilterExpressionRestrictions = DataModelPathHelper.checkFilterExpressionRestrictions;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Retrieve the displayMode for the value help.
   * The main rule is that if a property is used in a VHTable then we don't want to display the text arrangement directly.
   * @param propertyPath The current property
   * @param isValueHelpWithFixedValues The value help is a drop-down list
   * @returns The target displayMode
   */
  const getValueHelpTableDisplayMode = function (propertyPath, isValueHelpWithFixedValues) {
    const sDisplayMode = getDisplayMode(propertyPath);
    const oTextAnnotation = propertyPath.targetObject?.annotations?.Common?.Text;
    const oTextArrangementAnnotation = typeof oTextAnnotation !== "string" && oTextAnnotation?.annotations?.UI?.TextArrangement?.toString();
    if (isValueHelpWithFixedValues) {
      return oTextAnnotation && isPathAnnotationExpression(oTextAnnotation) && oTextAnnotation.path ? sDisplayMode : "Value";
    } else {
      // Only explicit defined TextArrangements in a Value Help with Dialog are considered
      return oTextArrangementAnnotation ? sDisplayMode : "Value";
    }
  };

  /**
   * Method to return delegate property of Value Help.
   * @param propertyPath The current property path
   * @param conditionModelName Condition model of the Value Help
   * @param originalPropertyPath The original property path
   * @param requestGroupId The requestGroupId to use for requests
   * @param useMultiValueField If true the value help is for a multi value Field
   * @returns The expression needed to configure the delegate
   */
  _exports.getValueHelpTableDisplayMode = getValueHelpTableDisplayMode;
  const getDelegateConfiguration = function (propertyPath, conditionModelName, originalPropertyPath, requestGroupId) {
    let useMultiValueField = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    const isUnitValueHelp = propertyPath !== originalPropertyPath;
    const delegateConfiguration = {
      name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
      payload: {
        propertyPath,
        isUnitValueHelp,
        conditionModel: conditionModelName,
        requestGroupId,
        useMultiValueField,
        qualifiers: {},
        valueHelpQualifier: ""
      }
    };
    return delegateConfiguration; // for some reason "qualifiers: {}" is ignored here
  };

  /**
   * Method to return delegate property of Value Help for define conditions panel.
   * @param propertyPath The current property path
   * @returns The expression needed to configure the delegate
   */
  _exports.getDelegateConfiguration = getDelegateConfiguration;
  const getDelegateConfigurationForDefineConditions = function (propertyPath) {
    const delegateConfiguration = {
      name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
      payload: {
        propertyPath,
        isDefineConditionValueHelp: true,
        qualifiers: {},
        valueHelpQualifier: ""
      }
    };
    return compileExpression(delegateConfiguration);
  };

  /**
   * Method to generate the ID for Value Help.
   * @param sFlexId Flex ID of the current object
   * @param sIdPrefix Prefix for the ValueHelp ID
   * @param sEntityType Name of the EntityType
   * @param sOriginalPropertyName Name of the property
   * @param sPropertyName Name of the ValueHelp Property
   * @returns The Id generated for the ValueHelp
   */
  _exports.getDelegateConfigurationForDefineConditions = getDelegateConfigurationForDefineConditions;
  const generateID = function (sFlexId, sIdPrefix, sEntityType, sOriginalPropertyName, sPropertyName) {
    if (sFlexId) {
      return sFlexId;
    }
    let sProperty = sPropertyName;
    if (sOriginalPropertyName !== sPropertyName) {
      sProperty = `${sOriginalPropertyName}::${sPropertyName}`;
    }
    return generate([sIdPrefix, sEntityType, sProperty]);
  };

  /**
   * Method to check if a property needs to be validated or not when used in the valuehelp.
   * @param target ValueHelp property type annotations
   * @returns `true` if the value help needs to be validated
   */
  _exports.generateID = generateID;
  const requiresValidation = function (target) {
    return hasValueHelpWithFixedValues(target) || hasValueListForValidation(target) || hasValueHelp(target) && (isUnit(target) || isCurrency(target) || isGuid(target));
  };

  /**
   * Method to decide if case-sensitive filter requests are to be used or not.
   *
   * If the back end has FilterFunctions Capabilies for the service or the entity, we check it includes support for tolower.
   * @param oDataModelPath Current data model path·
   * @param aEntityContainerFilterFunctions Filter functions of entity container
   * @returns `true` if the entity set or service supports case sensitive filter requests
   */
  _exports.requiresValidation = requiresValidation;
  const useCaseSensitiveFilterRequests = function (oDataModelPath, aEntityContainerFilterFunctions) {
    const filterFunctions = oDataModelPath?.targetEntitySet?.annotations?.Capabilities?.FilterFunctions || aEntityContainerFilterFunctions;
    return ModelHelper.isFilteringCaseSensitive(undefined, filterFunctions);
  };
  _exports.useCaseSensitiveFilterRequests = useCaseSensitiveFilterRequests;
  const isSemanticDateRange = function (oDataModelPath) {
    const targetProperty = oDataModelPath.targetObject;
    const targetRestrictions = checkFilterExpressionRestrictions(oDataModelPath, ["SingleRange"]);
    return targetProperty && hasDateType(targetProperty) && compileExpression(targetRestrictions);
  };
  _exports.isSemanticDateRange = isSemanticDateRange;
  const shouldShowConditionPanel = function (oDataModelPath, oContextPath) {
    // Force push the context path inside
    oDataModelPath.contextLocation = oContextPath;
    return compileExpression(checkFilterExpressionRestrictions(oDataModelPath, ["SingleValue", "MultiValue"])) === "false";
  };
  _exports.shouldShowConditionPanel = shouldShowConditionPanel;
  const getColumnDataProperty = function (sValueListProperty, propertyPath) {
    const textAnnotation = propertyPath?.targetObject?.annotations?.Common?.Text;
    return textAnnotation?.annotations?.UI?.TextArrangement?.valueOf() === "UI.TextArrangementType/TextOnly" && isPathAnnotationExpression(textAnnotation) ? textAnnotation.path : sValueListProperty;
  };
  _exports.getColumnDataProperty = getColumnDataProperty;
  const getColumnDataPropertyType = function (valueListPropertyType, propertyPath) {
    const textArrangement = propertyPath?.targetObject?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement;
    return textArrangement && textArrangement.valueOf() !== "UI.TextArrangementType/TextSeparate" ? "Edm.String" : valueListPropertyType;
  };
  const getColumnHAlign = function (propertyPath) {
    const property = propertyPath.targetObject;
    const propertyType = isProperty(property) ? getColumnDataPropertyType(property.type, propertyPath) : "";
    return !propertyType || isSemanticKey(property, propertyPath) ? "Begin" : FieldHelper.getPropertyAlignment(propertyType, {
      textAlignMode: "Table"
    });
  };
  /**
   *
   * @param  propertyPath PropertyPath of the Field
   * @returns Runtime formatter for growing and growingThreshold
   */
  _exports.getColumnHAlign = getColumnHAlign;
  const getGrowingFormatter = function (propertyPath) {
    return compileExpression(formatResult([pathInModel("/recommendationsData", "internal"), constant(propertyPath)], additionalValueFormatter.getGrowing));
  };
  _exports.getGrowingFormatter = getGrowingFormatter;
  const getValueHelpTemplate = function (metaPath, vhContent) {
    let dataModelObjectPath = getInvolvedDataModelObjects(metaPath, vhContent.contextPath);
    let originalProperty = getInvolvedDataModelObjects(vhContent.metaPath, vhContent.contextPath);
    if (isPathAnnotationExpression(originalProperty.targetObject)) {
      originalProperty = enhanceDataModelPath(originalProperty, originalProperty.targetObject.path);
    }
    if (isPathAnnotationExpression(dataModelObjectPath.targetObject)) {
      dataModelObjectPath = enhanceDataModelPath(dataModelObjectPath, dataModelObjectPath.targetObject.path);
    }
    if (dataModelObjectPath.targetObject) {
      const valueHelpId = generateID(vhContent._flexId, vhContent.idPrefix, !vhContent.filterFieldValueHelp ? originalProperty.targetEntityType.name : undefined, getTargetObjectPath(originalProperty, true), getTargetObjectPath(dataModelObjectPath, true));
      const dialogTitle = getLabel(dataModelObjectPath.targetObject) || dataModelObjectPath.targetObject.name;
      if (hasValueHelp(dataModelObjectPath.targetObject)) {
        const shouldValidateInput = vhContent.filterFieldValueHelp || vhContent.requiresValidation || requiresValidation(dataModelObjectPath.targetObject);
        const showConditionPanel = vhContent.filterFieldValueHelp ? equal(checkFilterExpressionRestrictions(dataModelObjectPath, ["SingleValue", "MultiValue"]), false) : false;
        const valueHelpDelegateConfiguration = getDelegateConfiguration(getTargetObjectPath(dataModelObjectPath), vhContent.conditionModel, getTargetObjectPath(originalProperty), vhContent.requestGroupId, vhContent.useMultiValueField);
        const shouldUseCaseSensitiveFilter = useCaseSensitiveFilterRequests(dataModelObjectPath, dataModelObjectPath.targetEntitySet?.annotations?.Capabilities?.FilterFunctions?.map(str => str.toString()) ?? []);
        const isValueListForValidation = hasValueListForValidation(dataModelObjectPath.targetObject);
        const isValueListWithFixedValues = hasValueHelpWithFixedValues(dataModelObjectPath.targetObject);
        const customData = [_jsx(CustomData, {
          value: showConditionPanel
        }, "showConditionPanel")];
        if (isValueListForValidation) {
          customData.push(_jsx(CustomData, {
            value: compileExpression(getExpressionFromAnnotation(dataModelObjectPath.targetObject.annotations?.Common?.ValueListForValidation))
          }, "valuelistForValidation"));
        }
        return _jsx(ValueHelp, {
          delegate: valueHelpDelegateConfiguration,
          id: valueHelpId,
          validateInput: shouldValidateInput,
          children: {
            customData: customData,
            typeahead: _jsx(Popover, {
              children: _jsx(MTable, {
                id: `${valueHelpId}::Popover::qualifier::`,
                caseSensitive: shouldUseCaseSensitiveFilter,
                useAsValueHelp: hasValueHelpWithFixedValues(dataModelObjectPath.targetObject)
              })
            }),
            dialog: !isValueListWithFixedValues ? _jsx(Dialog, {}) : undefined
          }
        });
      } else if (vhContent.filterFieldValueHelp) {
        return _jsx(ValueHelp, {
          id: valueHelpId,
          children: {
            customData: vhContent.requestGroupId !== undefined ? [_jsx(CustomData, {
              value: vhContent.requestGroupId
            }, "requestGroupId")] : [],
            dialog: _jsx(Dialog, {
              title: dialogTitle,
              children: _jsx(Conditions, {})
            })
          }
        });
      }
    }
  };
  _exports.getValueHelpTemplate = getValueHelpTemplate;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelpTemplating-dbg.js.map

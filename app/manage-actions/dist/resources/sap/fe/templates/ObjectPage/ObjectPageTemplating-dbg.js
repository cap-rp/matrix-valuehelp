/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TitleHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldTemplating", "sap/m/library", "sap/ui/base/ManagedObject", "sap/ui/model/odata/v4/AnnotationHelper"], function (BindingToolkit, ManifestSettings, MetaModelConverter, BindingHelper, ModelHelper, TitleHelper, CommonHelper, FieldTemplating, mLibrary, ManagedObject, ODataModelAnnotationHelper) {
  "use strict";

  var _exports = {};
  var bindingParser = ManagedObject.bindingParser;
  var getTextBindingExpression = FieldTemplating.getTextBindingExpression;
  var formatValueRecursively = FieldTemplating.formatValueRecursively;
  var addTextArrangementToBindingExpression = FieldTemplating.addTextArrangementToBindingExpression;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var ActionType = ManifestSettings.ActionType;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  const ButtonType = mLibrary.ButtonType;
  const getExpressionForTitle = function (fullContextPath, viewData, headerInfo) {
    return getTitleBindingExpression(fullContextPath, getTextBindingExpression, undefined, headerInfo, viewData);
  };

  /**
   * Retrieves the expression for the description of an object page.
   * @param fullContextPath The full context path used to reach that object page
   * @param oHeaderInfo The @UI.HeaderInfo annotation content
   * @param oHeaderInfo.Description
   * @returns The binding expression for the object page description
   */
  _exports.getExpressionForTitle = getExpressionForTitle;
  const getExpressionForDescription = function (fullContextPath, oHeaderInfo) {
    let descriptionBinding = getExpressionFromAnnotation(oHeaderInfo?.Description?.Value);
    if (oHeaderInfo?.Description?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement) {
      // In case an explicit text arrangement was set we make use of it in the description as well
      descriptionBinding = addTextArrangementToBindingExpression(descriptionBinding, fullContextPath);
    }
    const description = compileExpression(formatValueRecursively(descriptionBinding, fullContextPath));
    return description === "undefined" ? "" : description;
  };

  /**
   * Return the expression for the save button.
   * @param oViewData The current view data
   * @param fullContextPath The path used up until here
   * @returns The binding expression that shows the right save button text
   */
  _exports.getExpressionForDescription = getExpressionForDescription;
  const getExpressionForSaveButton = function (oViewData, fullContextPath) {
    const saveButtonText = oViewData.resourceModel.getText("T_OP_OBJECT_PAGE_SAVE");
    const createButtonText = oViewData.resourceModel.getText("T_OP_OBJECT_PAGE_CREATE");
    let saveExpression;
    if (fullContextPath.startingEntitySet.annotations.Session?.StickySessionSupported) {
      // If we're in sticky mode AND the ui is in create mode, show Create, else show Save
      saveExpression = ifElse(UI.IsCreateMode, createButtonText, saveButtonText);
    } else {
      // If we're in draft AND the draft is a new object (!IsActiveEntity && !HasActiveEntity), show create, else show save
      saveExpression = ifElse(Draft.IsNewObject, createButtonText, saveButtonText);
    }
    return compileExpression(saveExpression);
  };

  /**
   * Return the expression of the label for a field into a header form.
   * @param label The label of the header form in an object page.
   * @param viewData The current view data.
   * @returns The binding expression for the translated label of the of the header form in an object page.
   */
  _exports.getExpressionForSaveButton = getExpressionForSaveButton;
  const getExpressionForLabelOnHeaderForm = function (label, viewData) {
    return viewData.resourceModel.getText("HEADER_FORM_LABEL", [label]);
  };

  /**
   * Method returns Whether the action type is manifest or not.
   * @param action The action object
   * @returns `true` if action is coming from manifest, `false` otherwise
   */
  _exports.getExpressionForLabelOnHeaderForm = getExpressionForLabelOnHeaderForm;
  const isManifestAction = function (action) {
    const nonManifestActions = ["Primary", "DefaultApply", "Secondary", "ForAction", "ForNavigation", "SwitchToActiveObject", "SwitchToDraftObject", "DraftActions", "Copy", "Standard"];
    return !nonManifestActions.includes(action.type ?? "");
  };

  /**
   * Returns a compiled expression to determine Emphasized  button type based on Criticality across all actions
   * If critical action is rendered, its considered to be the primary action. Hence template's default primary action is set back to Default.
   * @param dataContextPath The dataModelObjectPath related to the context
   * @returns An expression to deduce if button type is Default or Emphasized
   */
  _exports.isManifestAction = isManifestAction;
  const buildEmphasizedButtonExpression = function (dataContextPath) {
    const identification = dataContextPath.targetEntityType?.annotations?.UI?.Identification;
    const dataFieldsWithCriticality = identification?.filter(dataField => dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && dataField.Criticality) || [];
    const dataFieldsBindingExpressions = dataFieldsWithCriticality.length ? dataFieldsWithCriticality.map(dataField => {
      const criticalityVisibleBindingExpression = getExpressionFromAnnotation(dataField.Criticality);
      return and(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true)), or(equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Negative"), equal(criticalityVisibleBindingExpression, "1"), equal(criticalityVisibleBindingExpression, 1), equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Positive"), equal(criticalityVisibleBindingExpression, "3"), equal(criticalityVisibleBindingExpression, 3)));
    }) : [constant(false)];

    // If there is at least one visible dataField with criticality negative or positive, the type is set as Ghost
    // else it is emphasized
    return compileExpression(ifElse(or(...dataFieldsBindingExpressions), ButtonType.Ghost, ButtonType.Emphasized));
  };
  _exports.buildEmphasizedButtonExpression = buildEmphasizedButtonExpression;
  const getElementBinding = function (sPath) {
    const sNavigationPath = ODataModelAnnotationHelper.getNavigationPath(sPath);
    if (sNavigationPath) {
      return "{path:'" + sNavigationPath + "'}";
    } else {
      //no navigation property needs empty object
      return "{path: ''}";
    }
  };

  /**
   * Function to check if draft pattern is supported.
   * @param entitySet The current entity set.
   * @returns Returns the Boolean value based on draft state
   */
  _exports.getElementBinding = getElementBinding;
  const checkDraftState = function (entitySet) {
    if (entitySet.annotations?.Common?.DraftRoot?.EditAction) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Function to check if the entitySet is a draft root that supports collaboration.
   * @param entitySet The current entity set.
   * @returns Returns the Boolean value based on draft state
   */
  _exports.checkDraftState = checkDraftState;
  const checkCollaborationDraftRoot = function (entitySet) {
    if (entitySet.annotations?.Common?.DraftRoot?.ShareAction) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Function to get the visibility for the SwitchToActive button in the object page or subobject page.
   * @param entitySet The current entity set.
   * @returns Returns expression binding or Boolean value based on the draft state
   */
  _exports.checkCollaborationDraftRoot = checkCollaborationDraftRoot;
  const getSwitchToActiveVisibility = function (entitySet) {
    if (checkDraftState(entitySet)) {
      if (checkCollaborationDraftRoot(entitySet)) {
        return compileExpression(and(pathInModel("HasActiveEntity"), UI.IsEditable));
      } else {
        return compileExpression(and(equal(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"), true), UI.IsEditable, not(UI.IsCreateMode)));
      }
    } else {
      return false;
    }
  };

  /**
   * Function to get the visibility for the SwitchToDraft button in the object page or subobject page.
   * @param entitySet The current entity set.
   * @returns Returns expression binding or Boolean value based on the draft state
   */
  _exports.getSwitchToActiveVisibility = getSwitchToActiveVisibility;
  const getSwitchToDraftVisibility = function (entitySet) {
    if (checkDraftState(entitySet)) {
      if (checkCollaborationDraftRoot(entitySet)) {
        return compileExpression(and(pathInModel("HasDraftEntity"), not(UI.IsEditable)));
      } else {
        return compileExpression(and(equal(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"), true), not(UI.IsEditable), not(UI.IsCreateMode), pathInModel("HasDraftEntity")));
      }
    } else {
      return false;
    }
  };

  /**
   * Function to get the visibility for the SwitchDraftAndActive button in the object page or subobject page.
   * @param entitySet The current entity set.
   * @returns Returns expression binding or Boolean value based on the draft state
   */
  _exports.getSwitchToDraftVisibility = getSwitchToDraftVisibility;
  const getSwitchDraftAndActiveVisibility = function (entitySet) {
    if (checkDraftState(entitySet)) {
      if (checkCollaborationDraftRoot(entitySet)) {
        // somehow checking hasDraftEntity and hasActiveEntity does not work, so we check IsActiveEntity first
        return compileExpression(ifElse(pathInModel("IsActiveEntity"), pathInModel("HasDraftEntity"), pathInModel("HasActiveEntity")));
      } else {
        return compileExpression(and(equal(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"), true), not(UI.IsCreateMode)));
      }
    } else {
      return false;
    }
  };

  /**
   * Function to find an action from the array of header actions in the converter context.
   * @param aConverterContextHeaderActions Array of 'header' actions on the object page.
   * @param sActionType The action type
   * @returns The action with the matching action type
   */
  _exports.getSwitchDraftAndActiveVisibility = getSwitchDraftAndActiveVisibility;
  const _findAction = function (aConverterContextHeaderActions, sActionType) {
    let oAction;
    if (aConverterContextHeaderActions && aConverterContextHeaderActions.length) {
      oAction = aConverterContextHeaderActions.find(function (oHeaderAction) {
        return oHeaderAction.type === sActionType;
      });
    }
    return oAction;
  };

  /**
   * Function to format the 'enabled' property for the Delete button on the object page or subobject page in case of a Command Execution.
   * @param aConverterContextHeaderActions Array of header actions on the object page
   * @returns Returns expression binding or Boolean value from the converter output
   */
  _exports._findAction = _findAction;
  const getDeleteCommandExecutionEnabled = function (aConverterContextHeaderActions) {
    const oDeleteAction = _findAction(aConverterContextHeaderActions, "Secondary");
    return oDeleteAction ? oDeleteAction.enabled : "false";
  };

  /**
   * Function to format the 'visible' property for the Delete button on the object page or subobject page in case of a Command Execution.
   * @param aConverterContextHeaderActions Array of header actions on the object page
   * @returns Returns expression binding or Boolean value from the converter output
   */
  _exports.getDeleteCommandExecutionEnabled = getDeleteCommandExecutionEnabled;
  const getDeleteCommandExecutionVisible = function (aConverterContextHeaderActions) {
    const oDeleteAction = _findAction(aConverterContextHeaderActions, "Secondary");
    return oDeleteAction ? oDeleteAction.visible : "false";
  };

  /**
   * Function to format the 'visible' property for the Edit button on the object page or subobject page in case of a Command Execution.
   * @param aConverterContextHeaderActions Array of header actions on the object page
   * @returns Returns expression binding or Boolean value from the converter output
   */
  _exports.getDeleteCommandExecutionVisible = getDeleteCommandExecutionVisible;
  const getEditCommandExecutionVisible = function (aConverterContextHeaderActions) {
    const oEditAction = _findAction(aConverterContextHeaderActions, "Primary");
    return oEditAction ? oEditAction.visible : "false";
  };

  /**
   * Function to format the 'enabled' property for the Edit button on the object page or subobject page in case of a Command Execution.
   * @param aConverterContextHeaderActions Array of header actions on the object page
   * @returns Returns expression binding or Boolean value from the converter output
   */
  _exports.getEditCommandExecutionVisible = getEditCommandExecutionVisible;
  const getEditCommandExecutionEnabled = function (aConverterContextHeaderActions) {
    const oEditAction = _findAction(aConverterContextHeaderActions, "Primary");
    return oEditAction ? oEditAction.enabled : "false";
  };

  /**
   * Function to get the EditAction from the based on a draft-enabled application or a sticky application.
   * @param [oEntitySet] The value from the expression.
   * @returns Returns expression binding or Boolean value based on vRawValue & oDraftNode
   */
  _exports.getEditCommandExecutionEnabled = getEditCommandExecutionEnabled;
  const getEditAction = function (oEntitySet) {
    const sPath = oEntitySet.getPath();
    const aPaths = sPath.split("/");
    const rootEntitySetPath = "/" + aPaths[1];
    // get the edit action from root entity sets
    const rootEntitySetAnnnotations = oEntitySet.getObject(rootEntitySetPath + "@");
    const bDraftRoot = rootEntitySetAnnnotations.hasOwnProperty("@com.sap.vocabularies.Common.v1.DraftRoot");
    const bDraftNode = rootEntitySetAnnnotations.hasOwnProperty("@com.sap.vocabularies.Common.v1.DraftNode");
    const bStickySession = rootEntitySetAnnnotations.hasOwnProperty("@com.sap.vocabularies.Session.v1.StickySessionSupported");
    let sActionName;
    if (bDraftRoot) {
      sActionName = oEntitySet.getObject(`${rootEntitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot/EditAction`);
    } else if (bDraftNode) {
      sActionName = oEntitySet.getObject(`${rootEntitySetPath}@com.sap.vocabularies.Common.v1.DraftNode/EditAction`);
    } else if (bStickySession) {
      sActionName = oEntitySet.getObject(`${rootEntitySetPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/EditAction`);
    }
    return !sActionName ? sActionName : `${rootEntitySetPath}/${sActionName}`;
  };
  _exports.getEditAction = getEditAction;
  const isReadOnlyFromStaticAnnotations = function (oAnnotations, oFieldControl) {
    let bComputed, bImmutable, bReadOnly;
    if (oAnnotations && oAnnotations["@Org.OData.Core.V1.Computed"]) {
      bComputed = oAnnotations["@Org.OData.Core.V1.Computed"].Bool ? oAnnotations["@Org.OData.Core.V1.Computed"].Bool == "true" : true;
    }
    if (oAnnotations && oAnnotations["@Org.OData.Core.V1.Immutable"]) {
      bImmutable = oAnnotations["@Org.OData.Core.V1.Immutable"].Bool ? oAnnotations["@Org.OData.Core.V1.Immutable"].Bool == "true" : true;
    }
    bReadOnly = bComputed || bImmutable;
    if (oFieldControl) {
      bReadOnly = bReadOnly || oFieldControl == "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly";
    }
    if (bReadOnly) {
      return true;
    } else {
      return false;
    }
  };
  _exports.isReadOnlyFromStaticAnnotations = isReadOnlyFromStaticAnnotations;
  const readOnlyExpressionFromDynamicAnnotations = function (oFieldControl) {
    let sIsFieldControlPathReadOnly;
    if (oFieldControl) {
      if (bindingParser(oFieldControl)) {
        sIsFieldControlPathReadOnly = "%" + oFieldControl + " === 1 ";
      }
    }
    if (sIsFieldControlPathReadOnly) {
      return "{= " + sIsFieldControlPathReadOnly + "? false : true }";
    } else {
      return undefined;
    }
  };

  /*
   * Function to get the expression for chart Title Press
   *
   * @functionw
   * @param {oConfiguration} [oConfigurations] control configuration from manifest
   *  @param {oManifest} [oManifest] Outbounds from manifest
   * returns {String} [sCollectionName] Collection Name of the Micro Chart
   *
   * returns {String} [Expression] Handler Expression for the title press
   *
   */
  _exports.readOnlyExpressionFromDynamicAnnotations = readOnlyExpressionFromDynamicAnnotations;
  const getExpressionForMicroChartTitlePress = function (oConfiguration, targetAnnotationPath, targetAnnotationPathDatModelObject, oManifestOutbound, sCollectionName) {
    targetAnnotationPath = getMicroChartControlConfigurationPath(targetAnnotationPath, targetAnnotationPathDatModelObject, sCollectionName);
    const navigationConfiguration = oConfiguration?.[targetAnnotationPath]?.["navigation"];
    if (navigationConfiguration) {
      if (navigationConfiguration["targetOutbound"] && navigationConfiguration["targetOutbound"]["outbound"] || navigationConfiguration["targetOutbound"] && navigationConfiguration["targetOutbound"]["outbound"] && navigationConfiguration["targetSections"]) {
        return ".handlers.onDataPointTitlePressed($controller, ${$source>/},'" + JSON.stringify(oManifestOutbound) + "','" + navigationConfiguration["targetOutbound"]["outbound"] + "','" + sCollectionName + "' )";
      } else if (navigationConfiguration["targetSections"]) {
        return ".handlers.navigateToSubSection($controller, '" + JSON.stringify(navigationConfiguration["targetSections"]) + "')";
      } else {
        return undefined;
      }
    }
  };

  /*
   * Function to render Chart Title as Link
   *
   * @function
   * @param {oControlConfiguration} [oConfigurations] control configuration from manifest
   * returns {String} [sKey] For the TargetOutbound and TargetSection
   *
   */
  _exports.getExpressionForMicroChartTitlePress = getExpressionForMicroChartTitlePress;
  const getMicroChartTitleAsLink = function (oControlConfiguration, targetAnnotationPath, targetAnnotationPathDatModelObject, collectionName) {
    targetAnnotationPath = getMicroChartControlConfigurationPath(targetAnnotationPath, targetAnnotationPathDatModelObject, collectionName);
    const targetControlConfiguration = oControlConfiguration?.[targetAnnotationPath]?.["navigation"];
    if (targetControlConfiguration && (targetControlConfiguration["targetOutbound"] || targetControlConfiguration["targetOutbound"] && targetControlConfiguration["targetSections"])) {
      return "External";
    } else if (targetControlConfiguration && targetControlConfiguration["targetSections"]) {
      return "InPage";
    } else {
      return "None";
    }
  };
  _exports.getMicroChartTitleAsLink = getMicroChartTitleAsLink;
  const getMicroChartControlConfigurationPath = function (targetAnnotationPath, targetAnnotationPathDatModelObject, collectionName) {
    if (targetAnnotationPathDatModelObject?.targetObject?.$Type === "com.sap.vocabularies.UI.v1.PresentationVariantType") {
      targetAnnotationPath = targetAnnotationPathDatModelObject.targetObject?.Visualizations[0]?.value;
      targetAnnotationPath = collectionName ? `${collectionName}/${targetAnnotationPath}` : targetAnnotationPath;
    }
    return targetAnnotationPath;
  };

  /* Get groupId from control configuration
   *
   * @function
   * @param {Object} [oConfigurations] control configuration from manifest
   * @param {String} [sAnnotationPath] Annotation Path for the configuration
   * @description Used to get the groupId for DataPoints and MicroCharts in the Header.
   *
   */
  _exports.getMicroChartControlConfigurationPath = getMicroChartControlConfigurationPath;
  const getGroupIdFromConfig = function (oConfigurations, sAnnotationPath, sDefaultGroupId) {
    const oConfiguration = oConfigurations[sAnnotationPath],
      aAutoPatterns = ["Heroes", "Decoration", "Workers", "LongRunners"];
    let sGroupId = sDefaultGroupId;
    if (oConfiguration && oConfiguration.requestGroupId && aAutoPatterns.some(function (autoPattern) {
      return autoPattern === oConfiguration.requestGroupId;
    })) {
      sGroupId = "$auto." + oConfiguration.requestGroupId;
    }
    return sGroupId;
  };

  /**
   * Gets groupId from control configuration for micro chart.
   * @param oControlConfiguration Control configuration from manifest
   * @param targetAnnotationPath Annotation path for the configuration
   * @param targetAnnotationPathDataModelObject DataModelObject of Chart or PresentationVariant
   * @param collectionName Collection Name
   * @param sDefaultGroupId Default GroupId
   * @returns GroupId for micro chart
   */
  _exports.getGroupIdFromConfig = getGroupIdFromConfig;
  const getGroupIdFromConfigForMicroChart = function (oControlConfiguration, targetAnnotationPath, targetAnnotationPathDataModelObject, collectionName, sDefaultGroupId) {
    targetAnnotationPath = getMicroChartControlConfigurationPath(targetAnnotationPath, targetAnnotationPathDataModelObject, collectionName);
    return getGroupIdFromConfig(oControlConfiguration, targetAnnotationPath, sDefaultGroupId);
  };

  /*
   * Get Context Binding with groupId from control configuration
   *
   * @function
   * @param {Object} [oConfigurations] control configuration from manifest
   * @param {String} [sKey] Annotation Path for of the configuration
   * @description Used to get the binding for DataPoints in the Header.
   *
   */
  _exports.getGroupIdFromConfigForMicroChart = getGroupIdFromConfigForMicroChart;
  const getBindingWithGroupIdFromConfig = function (oConfigurations, sKey) {
    const sGroupId = getGroupIdFromConfig(oConfigurations, sKey);
    let sBinding;
    if (sGroupId) {
      sBinding = "{ path : '', parameters : { $$groupId : '" + sGroupId + "' } }";
    }
    return sBinding;
  };

  /**
   * Generates the binding expression.
   * @param dataModelObjectPath DataModelObjectPath of the navigationPath
   * @returns The Binding expression including path and $select query as parameter depending on the function parameters
   */
  _exports.getBindingWithGroupIdFromConfig = getBindingWithGroupIdFromConfig;
  const createBindingForAlternateAndSecondaryKeys = function (dataModelObjectPath) {
    let binding;
    const alternateAndSecondaryKeys = ModelHelper.getAlternateAndSecondaryKeys(dataModelObjectPath?.targetEntityType, dataModelObjectPath?.targetEntitySet);
    if (alternateAndSecondaryKeys?.length) {
      binding = {
        path: ""
      };
      binding.parameters = {
        $select: alternateAndSecondaryKeys.join(",") || ""
      };
    }
    return JSON.stringify(binding);
  };

  /**
   * Method to check whether a FieldGroup consists of only 1 DataField with MultiLine Text annotation.
   * @param aFormElements A collection of form elements used in the current field group
   * @returns Returns true if only 1 data field with Multiline Text annotation exists.
   */
  _exports.createBindingForAlternateAndSecondaryKeys = createBindingForAlternateAndSecondaryKeys;
  const doesFieldGroupContainOnlyOneMultiLineDataField = function (aFormElements) {
    return aFormElements && aFormElements.length === 1 && !!aFormElements[0].isValueMultilineText;
  };

  /*
   * Get visiblity of breadcrumbs.
   *
   * @function
   * @param {Object} [oViewData] ViewData model
   * returns {*} Expression or Boolean value
   */
  _exports.doesFieldGroupContainOnlyOneMultiLineDataField = doesFieldGroupContainOnlyOneMultiLineDataField;
  const getVisibleExpressionForBreadcrumbs = function (oViewData) {
    return oViewData.showBreadCrumbs && oViewData.fclEnabled !== undefined ? "{fclhelper>/breadCrumbIsVisible}" : oViewData.showBreadCrumbs;
  };

  /**
   *
   * @param viewData Specifies the ViewData model
   * @returns Expression or Boolean value
   */
  _exports.getVisibleExpressionForBreadcrumbs = getVisibleExpressionForBreadcrumbs;
  const getShareButtonVisibility = function (viewData) {
    if (viewData.isShareButtonVisibleForMyInbox === false) {
      return "false";
    }
    const shareButtonVisibilityExp = viewData.fclEnabled ? and(pathInModel("/showShareIcon", "fclhelper"), not(UI.IsCreateMode)) : not(UI.IsCreateMode);
    return compileExpression(shareButtonVisibilityExp);
  };

  /*
   * Gets the visibility of the header info in edit mode
   *
   * If either the title or description field from the header annotations are editable, then the
   * editable header info is visible.
   *
   * @function
   * @param {object} [oAnnotations] Annotations object for given entity set
   * @param {object} [oFieldControl] field control
   * returns {*}  binding expression or boolean value resolved form funcitons isReadOnlyFromStaticAnnotations and isReadOnlyFromDynamicAnnotations
   */
  _exports.getShareButtonVisibility = getShareButtonVisibility;
  const getVisiblityOfHeaderInfo = function (oTitleAnnotations, oDescriptionAnnotations, oFieldTitleFieldControl, oFieldDescriptionFieldControl) {
    // Check Annotations for Title Field
    // Set to true and don't take into account, if there are no annotations, i.e. no title exists
    const bIsTitleReadOnly = oTitleAnnotations ? isReadOnlyFromStaticAnnotations(oTitleAnnotations, oFieldTitleFieldControl) : true;
    const titleExpression = readOnlyExpressionFromDynamicAnnotations(oFieldTitleFieldControl);
    // There is no expression and the title is not ready only, this is sufficient for an editable header
    if (!bIsTitleReadOnly && !titleExpression) {
      return true;
    }

    // Check Annotations for Description Field
    // Set to true and don't take into account, if there are no annotations, i.e. no description exists
    const bIsDescriptionReadOnly = oDescriptionAnnotations ? isReadOnlyFromStaticAnnotations(oDescriptionAnnotations, oFieldDescriptionFieldControl) : true;
    const descriptionExpression = readOnlyExpressionFromDynamicAnnotations(oFieldDescriptionFieldControl);
    // There is no expression and the description is not ready only, this is sufficient for an editable header
    if (!bIsDescriptionReadOnly && !descriptionExpression) {
      return true;
    }

    // Both title and description are not editable and there are no dynamic annotations
    if (bIsTitleReadOnly && bIsDescriptionReadOnly && !titleExpression && !descriptionExpression) {
      return false;
    }

    // Now combine expressions
    if (titleExpression && !descriptionExpression) {
      return titleExpression;
    } else if (!titleExpression && descriptionExpression) {
      return descriptionExpression;
    } else {
      return combineTitleAndDescriptionExpression(oFieldTitleFieldControl, oFieldDescriptionFieldControl);
    }
  };
  _exports.getVisiblityOfHeaderInfo = getVisiblityOfHeaderInfo;
  const combineTitleAndDescriptionExpression = function (oTitleFieldControl, oDescriptionFieldControl) {
    // If both header and title field are based on dynmaic field control, the editable header
    // is visible if at least one of these is not ready only
    return "{= %" + oTitleFieldControl + " === 1 ? ( %" + oDescriptionFieldControl + " === 1 ? false : true ) : true }";
  };

  /*
   * Get Expression of press event for the delete button.
   *
   * @function
   * @param entitySet The current entity set
   * @param computedAnnotationInterface The current templating context
   * returns The function string generated from the CommonHelper's method generateFunction
   */
  _exports.combineTitleAndDescriptionExpression = combineTitleAndDescriptionExpression;
  const getPressExpressionForDelete = function () {
    const deletableContexts = "${$view>/}.getBindingContext()",
      title = "${$view>/}.byId('fe::ObjectPage').data('ObjectPageSubtitle')",
      description = "${$view>/}.byId('fe::ObjectPage').data('ObjectPageDescription')";
    const params = {
      title: title,
      description: description
    };
    return CommonHelper.generateFunction(".editFlow.deleteDocument", deletableContexts, CommonHelper.objectToString(params));
  };

  /*
   * Get Expression of press event of Edit button.
   *
   * @function
   * @param {object} [oDataField] Data field object
   * @param {string} [sEntitySetName] Entity set name
   * @param {object} [oHeaderAction] Header action object
   * returns {string}  binding expression / function string generated from commanhelper's function generateFunction
   */
  _exports.getPressExpressionForDelete = getPressExpressionForDelete;
  const getPressExpressionForEdit = function (oDataField, sEntitySetName, oHeaderAction) {
    const sEditableContexts = CommonHelper.addSingleQuotes(oDataField && oDataField.Action),
      sDataFieldEnumMember = oDataField && oDataField.InvocationGrouping && oDataField.InvocationGrouping["$EnumMember"],
      sInvocationGroup = sDataFieldEnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
    const oParams = {
      contexts: "${$view>/}.getBindingContext()",
      entitySetName: CommonHelper.addSingleQuotes(sEntitySetName),
      invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGroup),
      model: "${$source>/}.getModel()",
      label: CommonHelper.addSingleQuotes(oDataField && oDataField.Label, true),
      isNavigable: oHeaderAction && oHeaderAction.isNavigable,
      defaultValuesExtensionFunction: oHeaderAction && oHeaderAction.defaultValuesExtensionFunction ? `'${oHeaderAction.defaultValuesExtensionFunction}'` : undefined
    };
    return CommonHelper.generateFunction(".handlers.onCallAction", "${$view>/}", sEditableContexts, CommonHelper.objectToString(oParams));
  };

  /**
   * Gets the expression for the 'press' event in the footer annotation actions.
   * @param dataFieldModelPath The data model path of the data field
   * @param entitySetName The entity set name
   * @param headerAction The header action object
   * @returns  The binding expression or function string
   */
  _exports.getPressExpressionForEdit = getPressExpressionForEdit;
  const getPressExpressionForFooterAnnotationAction = function (dataFieldModelPath, entitySetName, headerAction) {
    const dataField = dataFieldModelPath.targetObject;
    const actionContexts = CommonHelper.addSingleQuotes(dataField.Action);
    const oParams = {
      contexts: "${$view>/}.getBindingContext()",
      entitySetName: CommonHelper.addSingleQuotes(entitySetName),
      invocationGrouping: CommonHelper.addSingleQuotes(dataField.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated"),
      model: "${$source>/}.getModel()",
      label: CommonHelper.addSingleQuotes(dataField.Label, true),
      isNavigable: headerAction.isNavigable,
      defaultValuesExtensionFunction: headerAction.defaultValuesExtensionFunction ? `'${headerAction.defaultValuesExtensionFunction}'` : undefined
    };
    return CommonHelper.generateFunction(".handlers.onCallAction", "${$view>/}", actionContexts, CommonHelper.objectToString(oParams));
  };

  /*
   * Get Expression for executing the event expression of the primary action.
   *
   * @function
   * @param {object} [oDataField] Data field object
   * @param {string} [sEntitySetName] Entity set name
   * @param {object} [oHeaderAction] Header action object
   * @param {CompiledBindingToolkitExpression | string} The visibility of sematic positive action
   * @param {CompiledBindingToolkitExpression | string} The enablement of semantic positive action
   * @param {CompiledBindingToolkitExpression | string} The Edit button visibility
   * @param {CompiledBindingToolkitExpression | string} The enablement of Edit button
   * returns {string}  binding expression / function string generated from commanhelper's function generateFunction
   */
  _exports.getPressExpressionForFooterAnnotationAction = getPressExpressionForFooterAnnotationAction;
  const getPressExpressionForPrimaryAction = function (oDataField, sEntitySetName, oHeaderAction, positiveActionVisible, positiveActionEnabled, editActionVisible, editActionEnabled) {
    const sActionContexts = CommonHelper.addSingleQuotes(oDataField?.Action.toString() ?? ""),
      sDataFieldEnumMember = oDataField && oDataField.InvocationGrouping && oDataField.InvocationGrouping["$EnumMember"],
      sInvocationGroup = sDataFieldEnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
    const oParams = {
      contexts: "${$view>/}.getBindingContext()",
      entitySetName: sEntitySetName ? CommonHelper.addSingleQuotes(sEntitySetName) : "",
      invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGroup),
      model: "${$source>/}.getModel()",
      label: CommonHelper.addSingleQuotes(oDataField?.Label?.toString() ?? "", true),
      isNavigable: oHeaderAction?.isNavigable,
      defaultValuesExtensionFunction: oHeaderAction?.defaultValuesExtensionFunction ? `'${oHeaderAction.defaultValuesExtensionFunction}'` : undefined
    };
    const oConditions = {
      positiveActionVisible,
      positiveActionEnabled,
      editActionVisible,
      editActionEnabled
    };
    return CommonHelper.generateFunction(".handlers.onPrimaryAction", "$controller", "${$view>/}", "${$view>/}.getBindingContext()", sActionContexts, CommonHelper.objectToString(oParams), CommonHelper.objectToString(oConditions));
  };

  /*
   * Gets the binding of the container HBox for the header facet.
   *
   * @function
   * @param {object} [oControlConfiguration] The control configuration form of the viewData model
   * @param {object} [oHeaderFacet] The object of the header facet
   * returns {*}  The binding expression from function getBindingWithGroupIdFromConfig or undefined.
   */
  _exports.getPressExpressionForPrimaryAction = getPressExpressionForPrimaryAction;
  const getStashableHBoxBinding = function (oControlConfiguration, oHeaderFacet) {
    if (oHeaderFacet && oHeaderFacet.Facet && oHeaderFacet.Facet.targetAnnotationType === "DataPoint") {
      return getBindingWithGroupIdFromConfig(oControlConfiguration, oHeaderFacet.Facet.targetAnnotationValue);
    }
  };
  _exports.getStashableHBoxBinding = getStashableHBoxBinding;
  const getHeaderFormHboxRenderType = function (dataField) {
    if (dataField?.targetObject?.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      return undefined;
    }
    return "Bare";
  };

  /**
   * The default action group handler that is invoked when adding the menu button handling appropriately.
   * @param oCtx The current context in which the handler is called
   * @param oAction The current action context
   * @param oDataFieldForDefaultAction The current dataField for the default action
   * @param defaultActionContextOrEntitySet The current context for the default action
   * @returns The appropriate expression string
   */
  _exports.getHeaderFormHboxRenderType = getHeaderFormHboxRenderType;
  function getDefaultActionHandler(oCtx, oAction, oDataFieldForDefaultAction, defaultActionContextOrEntitySet) {
    if (oAction.defaultAction) {
      const defaultAction = oAction.defaultAction;
      try {
        switch (defaultAction.type) {
          case "ForAction":
            {
              return getPressExpressionForEdit(oDataFieldForDefaultAction, defaultActionContextOrEntitySet, oAction.defaultAction);
            }
          case "ForNavigation":
            {
              if (defaultAction.command) {
                return "cmd:" + defaultAction.command;
              } else {
                return defaultAction.press;
              }
            }
          default:
            {
              if (defaultAction.command) {
                return "cmd:" + defaultAction.command;
              }
              if (defaultAction.noWrap) {
                return defaultAction.press;
              } else {
                return CommonHelper.buildActionWrapper(defaultAction, {
                  id: "forTheObjectPage"
                });
              }
            }
        }
      } catch (ioEx) {
        return "binding for the default action is not working as expected";
      }
    }
    return undefined;
  }

  /**
   * Check if the sub section visualization is part of preview.
   * @param subSection The sub section visualization
   * @returns A Boolean value
   */
  _exports.getDefaultActionHandler = getDefaultActionHandler;
  function isVisualizationIsPartOfPreview(subSection) {
    return subSection.isPartOfPreview === true || subSection.presentation.visualizations[0].type !== "Table";
  }

  /**
   * Returns the expression that determines whether the footer of the object page is to be visible or not.
   * @param context The context for the formatter.
   * @param footerActions The list of footer actions.
   * @returns A binding expression
   */
  _exports.isVisualizationIsPartOfPreview = isVisualizationIsPartOfPreview;
  const getFooterVisibilityExpression = function (context, footerActions) {
    const metaModel = context.getInterface(1).getModel();
    const _generateBindingsForActions = actions => {
      if (actions.length) {
        return actions.map(action => resolveBindingString(action.visible ?? true, "boolean"));
      }
      return [constant(false)];
    };
    const getActionModelPath = action => {
      const annotationPath = action.annotationPath;
      if (annotationPath) {
        const actionContext = metaModel.getContext(annotationPath);
        return getInvolvedDataModelObjects(actionContext);
      }
      return undefined;
    };

    // Actions are coming from the converter so only determining actions and not statically hidden are listed
    const determiningActions = footerActions.filter(action => action.type === ActionType.DataFieldForAction);
    const manifestActionBindings = _generateBindingsForActions(footerActions.filter(action => isManifestAction(action)));
    const determiningActionBindings = _generateBindingsForActions(determiningActions);
    const isNotHiddenDeterminingAction = !!determiningActions.find(action => {
      const actionContextModelPath = getActionModelPath(action);
      return !actionContextModelPath?.targetObject?.annotations?.UI?.Hidden;
    });
    return compileExpression(or(isNotHiddenDeterminingAction, or(...manifestActionBindings), and(or(UI.IsEditable, or(...determiningActionBindings)), not(pathInModel("isCreateDialogOpen", "internal")))));
  };

  /**
   * Get the subsection header level.
   * @param subSection The subsection visualization
   * @param isMoreContent
   * @returns A String value
   */
  _exports.getFooterVisibilityExpression = getFooterVisibilityExpression;
  function getHeaderLevel(subSection, isMoreContent) {
    if (isMoreContent) {
      if (!subSection.showSubSectionTitle) {
        // whenever title is merged for sub-section, level should be H4
        return "H4";
      } else if (subSection.level === 2 && subSection.dataVisualizationTitleVisible === "true") {
        // retain old logic
        return "H6";
      } else {
        return "H5"; // retain old logic
      }
    } else if (!subSection.showSubSectionTitle) {
      // whenever title is merged for section, level should be H3
      return "H3";
    } else if (subSection.level === 2 && subSection.dataVisualizationTitleVisible === "true") {
      // retain old logic
      return "H5";
    } else {
      return "H4"; // retain old logic
    }
  }
  _exports.getHeaderLevel = getHeaderLevel;
  getFooterVisibilityExpression.requiresIContext = true;
  return _exports;
}, false);
//# sourceMappingURL=ObjectPageTemplating-dbg.js.map

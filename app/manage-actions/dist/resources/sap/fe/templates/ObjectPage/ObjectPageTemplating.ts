// Formatters for the Object Page
import type { EntitySet, NavigationProperty, Property, Singleton } from "@sap-ux/vocabularies-types";
import type {
	Chart,
	DataFieldAbstractTypes,
	DataFieldDefault,
	DataFieldForAction,
	DataFieldTypes,
	Facet,
	HeaderInfoType,
	PresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression, PathInModelExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	getExpressionFromAnnotation,
	ifElse,
	not,
	or,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import type { MicroChartManifestConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { ActionType, type ControlConfiguration } from "sap/fe/core/converters/ManifestSettings";
import type { MetaModelPropertyAnnotations } from "sap/fe/core/converters/MetaModelConverter";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { BaseAction, CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import type { AnnotationFormElement } from "sap/fe/core/converters/controls/Common/Form";
import type { FieldGroupFacet } from "sap/fe/core/converters/controls/ObjectPage/HeaderFacet";
import type { DataVisualizationSubSection } from "sap/fe/core/converters/controls/ObjectPage/SubSection";
import { Draft, UI } from "sap/fe/core/helpers/BindingHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import {
	addTextArrangementToBindingExpression,
	formatValueRecursively,
	getTextBindingExpression
} from "sap/fe/macros/field/FieldTemplating";
import mLibrary from "sap/m/library";
import { bindingParser } from "sap/ui/base/ManagedObject";
import type { ManifestOutboundEntry } from "sap/ui/core/Manifest";
import type { IContext } from "sap/ui/core/util/XMLPreprocessor";
import ODataModelAnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { MetaModelType } from "../../../../../../../types/metamodel_types";

const ButtonType = mLibrary.ButtonType;

export const getExpressionForTitle = function (
	fullContextPath: DataModelObjectPath<PageContextPathTarget>,
	viewData: ViewData,
	headerInfo?: HeaderInfoType
): CompiledBindingToolkitExpression {
	return getTitleBindingExpression(
		fullContextPath as DataModelObjectPath<Property>,
		getTextBindingExpression,
		undefined,
		headerInfo,
		viewData
	);
};

/**
 * Retrieves the expression for the description of an object page.
 * @param fullContextPath The full context path used to reach that object page
 * @param oHeaderInfo The @UI.HeaderInfo annotation content
 * @param oHeaderInfo.Description
 * @returns The binding expression for the object page description
 */
export const getExpressionForDescription = function (
	fullContextPath: DataModelObjectPath<EntitySet>,
	oHeaderInfo?: HeaderInfoType
): CompiledBindingToolkitExpression {
	let descriptionBinding = getExpressionFromAnnotation((oHeaderInfo?.Description as DataFieldTypes)?.Value);
	if ((oHeaderInfo?.Description as DataFieldTypes)?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement) {
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
export const getExpressionForSaveButton = function (
	oViewData: ViewData,
	fullContextPath: DataModelObjectPath<EntitySet>
): CompiledBindingToolkitExpression {
	const saveButtonText = oViewData.resourceModel.getText("T_OP_OBJECT_PAGE_SAVE");
	const createButtonText = oViewData.resourceModel.getText("T_OP_OBJECT_PAGE_CREATE");
	let saveExpression;

	if ((fullContextPath.startingEntitySet as EntitySet).annotations.Session?.StickySessionSupported) {
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
export const getExpressionForLabelOnHeaderForm = function (label: String, viewData: ViewData): CompiledBindingToolkitExpression {
	return viewData.resourceModel.getText("HEADER_FORM_LABEL", [label]);
};

/**
 * Method returns Whether the action type is manifest or not.
 * @param action The action object
 * @returns `true` if action is coming from manifest, `false` otherwise
 */
export const isManifestAction = function (action: BaseAction | CustomAction): action is CustomAction {
	const nonManifestActions = [
		"Primary",
		"DefaultApply",
		"Secondary",
		"ForAction",
		"ForNavigation",
		"SwitchToActiveObject",
		"SwitchToDraftObject",
		"DraftActions",
		"Copy",
		"Standard"
	];
	return !nonManifestActions.includes(action.type ?? "");
};

/**
 * Returns a compiled expression to determine Emphasized  button type based on Criticality across all actions
 * If critical action is rendered, its considered to be the primary action. Hence template's default primary action is set back to Default.
 * @param dataContextPath The dataModelObjectPath related to the context
 * @returns An expression to deduce if button type is Default or Emphasized
 */
export const buildEmphasizedButtonExpression = function (
	dataContextPath: DataModelObjectPath<EntitySet | NavigationProperty | Singleton>
): CompiledBindingToolkitExpression {
	const identification = dataContextPath.targetEntityType?.annotations?.UI?.Identification;
	const dataFieldsWithCriticality =
		identification?.filter((dataField) => dataField.$Type === UIAnnotationTypes.DataFieldForAction && dataField.Criticality) || [];

	const dataFieldsBindingExpressions = dataFieldsWithCriticality.length
		? dataFieldsWithCriticality.map((dataField) => {
				const criticalityVisibleBindingExpression = getExpressionFromAnnotation(dataField.Criticality);
				return and(
					not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true)),
					or(
						equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Negative"),
						equal(criticalityVisibleBindingExpression, "1"),
						equal(criticalityVisibleBindingExpression as BindingToolkitExpression<number>, 1),
						equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Positive"),
						equal(criticalityVisibleBindingExpression, "3"),
						equal(criticalityVisibleBindingExpression as BindingToolkitExpression<number>, 3)
					)
				);
		  })
		: ([constant(false)] as BindingToolkitExpression<boolean>[]);

	// If there is at least one visible dataField with criticality negative or positive, the type is set as Ghost
	// else it is emphasized
	return compileExpression(ifElse(or(...dataFieldsBindingExpressions), ButtonType.Ghost, ButtonType.Emphasized));
};

export const getElementBinding = function (sPath: string): string {
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
export const checkDraftState = function (entitySet: EntitySet): boolean {
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
export const checkCollaborationDraftRoot = function (entitySet: EntitySet): boolean {
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
export const getSwitchToActiveVisibility = function (entitySet: EntitySet): CompiledBindingToolkitExpression | boolean {
	if (checkDraftState(entitySet)) {
		if (checkCollaborationDraftRoot(entitySet)) {
			return compileExpression(and(pathInModel("HasActiveEntity"), UI.IsEditable));
		} else {
			return compileExpression(
				and(equal(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"), true), UI.IsEditable, not(UI.IsCreateMode))
			);
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
export const getSwitchToDraftVisibility = function (entitySet: EntitySet): CompiledBindingToolkitExpression | boolean {
	if (checkDraftState(entitySet)) {
		if (checkCollaborationDraftRoot(entitySet)) {
			return compileExpression(and(pathInModel("HasDraftEntity"), not(UI.IsEditable)));
		} else {
			return compileExpression(
				and(
					equal(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"), true),
					not(UI.IsEditable),
					not(UI.IsCreateMode),
					pathInModel("HasDraftEntity")
				)
			);
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
export const getSwitchDraftAndActiveVisibility = function (entitySet: EntitySet): CompiledBindingToolkitExpression | boolean {
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
export const _findAction = function (aConverterContextHeaderActions: BaseAction[], sActionType: string): BaseAction | undefined {
	let oAction: BaseAction | undefined;
	if (aConverterContextHeaderActions && aConverterContextHeaderActions.length) {
		oAction = aConverterContextHeaderActions.find(function (oHeaderAction: BaseAction) {
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
export const getDeleteCommandExecutionEnabled = function (aConverterContextHeaderActions: BaseAction[]): string | undefined {
	const oDeleteAction = _findAction(aConverterContextHeaderActions, "Secondary");
	return oDeleteAction ? oDeleteAction.enabled : "false";
};

/**
 * Function to format the 'visible' property for the Delete button on the object page or subobject page in case of a Command Execution.
 * @param aConverterContextHeaderActions Array of header actions on the object page
 * @returns Returns expression binding or Boolean value from the converter output
 */
export const getDeleteCommandExecutionVisible = function (aConverterContextHeaderActions: BaseAction[]): string | undefined {
	const oDeleteAction = _findAction(aConverterContextHeaderActions, "Secondary");
	return oDeleteAction ? oDeleteAction.visible : "false";
};

/**
 * Function to format the 'visible' property for the Edit button on the object page or subobject page in case of a Command Execution.
 * @param aConverterContextHeaderActions Array of header actions on the object page
 * @returns Returns expression binding or Boolean value from the converter output
 */
export const getEditCommandExecutionVisible = function (aConverterContextHeaderActions: BaseAction[]): string | undefined {
	const oEditAction = _findAction(aConverterContextHeaderActions, "Primary");
	return oEditAction ? oEditAction.visible : "false";
};

/**
 * Function to format the 'enabled' property for the Edit button on the object page or subobject page in case of a Command Execution.
 * @param aConverterContextHeaderActions Array of header actions on the object page
 * @returns Returns expression binding or Boolean value from the converter output
 */
export const getEditCommandExecutionEnabled = function (aConverterContextHeaderActions: BaseAction[]): string | undefined {
	const oEditAction = _findAction(aConverterContextHeaderActions, "Primary");
	return oEditAction ? oEditAction.enabled : "false";
};

/**
 * Function to get the EditAction from the based on a draft-enabled application or a sticky application.
 * @param [oEntitySet] The value from the expression.
 * @returns Returns expression binding or Boolean value based on vRawValue & oDraftNode
 */
export const getEditAction = function (oEntitySet: Context): string {
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

export const isReadOnlyFromStaticAnnotations = function (oAnnotations?: MetaModelPropertyAnnotations, oFieldControl?: string): boolean {
	let bComputed, bImmutable, bReadOnly;

	if (oAnnotations && oAnnotations["@Org.OData.Core.V1.Computed"]) {
		bComputed = (oAnnotations["@Org.OData.Core.V1.Computed"] as { Bool?: string }).Bool
			? (oAnnotations["@Org.OData.Core.V1.Computed"] as { Bool?: string }).Bool == "true"
			: true;
	}
	if (oAnnotations && oAnnotations["@Org.OData.Core.V1.Immutable"]) {
		bImmutable = (oAnnotations["@Org.OData.Core.V1.Immutable"] as { Bool?: string }).Bool
			? (oAnnotations["@Org.OData.Core.V1.Immutable"] as { Bool?: string }).Bool == "true"
			: true;
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

export const readOnlyExpressionFromDynamicAnnotations = function (oFieldControl?: string): string | undefined {
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
export const getExpressionForMicroChartTitlePress = function (
	oConfiguration: ControlConfiguration,
	targetAnnotationPath: string,
	targetAnnotationPathDatModelObject: DataModelObjectPath<Chart | PresentationVariant>,
	oManifestOutbound: Record<string, ManifestOutboundEntry>,
	sCollectionName: string
): string | undefined {
	targetAnnotationPath = getMicroChartControlConfigurationPath(targetAnnotationPath, targetAnnotationPathDatModelObject, sCollectionName);
	const navigationConfiguration = (oConfiguration?.[targetAnnotationPath] as MicroChartManifestConfiguration)?.["navigation"];
	if (navigationConfiguration) {
		if (
			(navigationConfiguration["targetOutbound"] && navigationConfiguration["targetOutbound"]["outbound"]) ||
			(navigationConfiguration["targetOutbound"] &&
				navigationConfiguration["targetOutbound"]["outbound"] &&
				navigationConfiguration["targetSections"])
		) {
			return (
				".handlers.onDataPointTitlePressed($controller, ${$source>/},'" +
				JSON.stringify(oManifestOutbound) +
				"','" +
				navigationConfiguration["targetOutbound"]["outbound"] +
				"','" +
				sCollectionName +
				"' )"
			);
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
export const getMicroChartTitleAsLink = function (
	oControlConfiguration: ControlConfiguration,
	targetAnnotationPath: string,
	targetAnnotationPathDatModelObject: DataModelObjectPath<Chart | PresentationVariant>,
	collectionName: string
): string {
	targetAnnotationPath = getMicroChartControlConfigurationPath(targetAnnotationPath, targetAnnotationPathDatModelObject, collectionName);
	const targetControlConfiguration = (oControlConfiguration?.[targetAnnotationPath] as MicroChartManifestConfiguration)?.["navigation"];
	if (
		targetControlConfiguration &&
		(targetControlConfiguration["targetOutbound"] ||
			(targetControlConfiguration["targetOutbound"] && targetControlConfiguration["targetSections"]))
	) {
		return "External";
	} else if (targetControlConfiguration && targetControlConfiguration["targetSections"]) {
		return "InPage";
	} else {
		return "None";
	}
};

export const getMicroChartControlConfigurationPath = function (
	targetAnnotationPath: string,
	targetAnnotationPathDatModelObject: DataModelObjectPath<Chart | PresentationVariant>,
	collectionName: string
): string {
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
export const getGroupIdFromConfig = function (
	oConfigurations: ControlConfiguration,
	sAnnotationPath: string,
	sDefaultGroupId?: string
): string | undefined {
	const oConfiguration = oConfigurations[sAnnotationPath] as MicroChartManifestConfiguration,
		aAutoPatterns = ["Heroes", "Decoration", "Workers", "LongRunners"];
	let sGroupId = sDefaultGroupId;
	if (
		oConfiguration &&
		oConfiguration.requestGroupId &&
		aAutoPatterns.some(function (autoPattern: string) {
			return autoPattern === oConfiguration.requestGroupId;
		})
	) {
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
export const getGroupIdFromConfigForMicroChart = function (
	oControlConfiguration: ControlConfiguration,
	targetAnnotationPath: string,
	targetAnnotationPathDataModelObject: DataModelObjectPath<Chart | PresentationVariant>,
	collectionName: string,
	sDefaultGroupId?: string
): string | undefined {
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
export const getBindingWithGroupIdFromConfig = function (oConfigurations: ControlConfiguration, sKey: string): string | undefined {
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
export const createBindingForAlternateAndSecondaryKeys = function (dataModelObjectPath: DataModelObjectPath<Facet>): string | undefined {
	let binding: Partial<PathInModelExpression<undefined>> | undefined;
	const alternateAndSecondaryKeys = ModelHelper.getAlternateAndSecondaryKeys(
		dataModelObjectPath?.targetEntityType,
		dataModelObjectPath?.targetEntitySet as EntitySet
	);

	if (alternateAndSecondaryKeys?.length) {
		binding = {
			path: ""
		};
		binding.parameters = { $select: alternateAndSecondaryKeys.join(",") || "" };
	}
	return JSON.stringify(binding);
};

/**
 * Method to check whether a FieldGroup consists of only 1 DataField with MultiLine Text annotation.
 * @param aFormElements A collection of form elements used in the current field group
 * @returns Returns true if only 1 data field with Multiline Text annotation exists.
 */
export const doesFieldGroupContainOnlyOneMultiLineDataField = function (aFormElements: AnnotationFormElement[]): boolean {
	return aFormElements && aFormElements.length === 1 && !!aFormElements[0].isValueMultilineText;
};

/*
 * Get visiblity of breadcrumbs.
 *
 * @function
 * @param {Object} [oViewData] ViewData model
 * returns {*} Expression or Boolean value
 */
export const getVisibleExpressionForBreadcrumbs = function (oViewData: ViewData): string | boolean | undefined {
	return oViewData.showBreadCrumbs && oViewData.fclEnabled !== undefined ? "{fclhelper>/breadCrumbIsVisible}" : oViewData.showBreadCrumbs;
};

/**
 *
 * @param viewData Specifies the ViewData model
 * @returns Expression or Boolean value
 */
export const getShareButtonVisibility = function (viewData: ViewData): CompiledBindingToolkitExpression {
	if (viewData.isShareButtonVisibleForMyInbox === false) {
		return "false";
	}
	const shareButtonVisibilityExp = viewData.fclEnabled
		? and(pathInModel("/showShareIcon", "fclhelper"), not(UI.IsCreateMode))
		: not(UI.IsCreateMode);
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
export const getVisiblityOfHeaderInfo = function (
	oTitleAnnotations: MetaModelPropertyAnnotations,
	oDescriptionAnnotations: MetaModelPropertyAnnotations,
	oFieldTitleFieldControl?: string,
	oFieldDescriptionFieldControl?: string
): boolean | string {
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
	const bIsDescriptionReadOnly = oDescriptionAnnotations
		? isReadOnlyFromStaticAnnotations(oDescriptionAnnotations, oFieldDescriptionFieldControl)
		: true;
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

export const combineTitleAndDescriptionExpression = function (oTitleFieldControl?: string, oDescriptionFieldControl?: string): string {
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
export const getPressExpressionForDelete = function (): string {
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
export const getPressExpressionForEdit = function (
	oDataField: MetaModelType<DataFieldForAction>,
	sEntitySetName: string,
	oHeaderAction?: BaseAction
): string {
	const sEditableContexts = CommonHelper.addSingleQuotes(oDataField && oDataField.Action!),
		sDataFieldEnumMember =
			oDataField &&
			oDataField.InvocationGrouping &&
			(oDataField.InvocationGrouping as unknown as Record<string, string>)["$EnumMember"],
		sInvocationGroup = sDataFieldEnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
	const oParams = {
		contexts: "${$view>/}.getBindingContext()",
		entitySetName: CommonHelper.addSingleQuotes(sEntitySetName),
		invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGroup),
		model: "${$source>/}.getModel()",
		label: CommonHelper.addSingleQuotes(oDataField && oDataField.Label!, true),
		isNavigable: oHeaderAction && oHeaderAction.isNavigable,
		defaultValuesExtensionFunction:
			oHeaderAction && oHeaderAction.defaultValuesExtensionFunction ? `'${oHeaderAction.defaultValuesExtensionFunction}'` : undefined
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
export const getPressExpressionForFooterAnnotationAction = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldForAction>,
	entitySetName: string,
	headerAction: CustomAction
): string {
	const dataField = dataFieldModelPath.targetObject as DataFieldForAction;
	const actionContexts = CommonHelper.addSingleQuotes(dataField.Action as string);
	const oParams = {
		contexts: "${$view>/}.getBindingContext()",
		entitySetName: CommonHelper.addSingleQuotes(entitySetName),
		invocationGrouping: CommonHelper.addSingleQuotes(
			dataField.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated"
		),
		model: "${$source>/}.getModel()",
		label: CommonHelper.addSingleQuotes(dataField.Label as string, true),
		isNavigable: headerAction.isNavigable,
		defaultValuesExtensionFunction: headerAction.defaultValuesExtensionFunction
			? `'${headerAction.defaultValuesExtensionFunction}'`
			: undefined
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
export const getPressExpressionForPrimaryAction = function (
	oDataField: DataFieldForAction | undefined,
	sEntitySetName: string | undefined,
	oHeaderAction: BaseAction | null,
	positiveActionVisible: CompiledBindingToolkitExpression | string,
	positiveActionEnabled: CompiledBindingToolkitExpression | string,
	editActionVisible: CompiledBindingToolkitExpression | string,
	editActionEnabled: CompiledBindingToolkitExpression | string
): string {
	const sActionContexts = CommonHelper.addSingleQuotes(oDataField?.Action.toString() ?? ""),
		sDataFieldEnumMember =
			oDataField &&
			oDataField.InvocationGrouping &&
			(oDataField.InvocationGrouping as unknown as Record<string, string>)["$EnumMember"],
		sInvocationGroup = sDataFieldEnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
	const oParams = {
		contexts: "${$view>/}.getBindingContext()",
		entitySetName: sEntitySetName ? CommonHelper.addSingleQuotes(sEntitySetName) : "",
		invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGroup),
		model: "${$source>/}.getModel()",
		label: CommonHelper.addSingleQuotes(oDataField?.Label?.toString() ?? "", true),
		isNavigable: oHeaderAction?.isNavigable,
		defaultValuesExtensionFunction: oHeaderAction?.defaultValuesExtensionFunction
			? `'${oHeaderAction.defaultValuesExtensionFunction}'`
			: undefined
	};
	const oConditions = {
		positiveActionVisible,
		positiveActionEnabled,
		editActionVisible,
		editActionEnabled
	};
	return CommonHelper.generateFunction(
		".handlers.onPrimaryAction",
		"$controller",
		"${$view>/}",
		"${$view>/}.getBindingContext()",
		sActionContexts,
		CommonHelper.objectToString(oParams),
		CommonHelper.objectToString(oConditions)
	);
};

/*
 * Gets the binding of the container HBox for the header facet.
 *
 * @function
 * @param {object} [oControlConfiguration] The control configuration form of the viewData model
 * @param {object} [oHeaderFacet] The object of the header facet
 * returns {*}  The binding expression from function getBindingWithGroupIdFromConfig or undefined.
 */
export const getStashableHBoxBinding = function (
	oControlConfiguration: ControlConfiguration,
	oHeaderFacet: { Facet: FieldGroupFacet }
): string | undefined {
	if (oHeaderFacet && oHeaderFacet.Facet && oHeaderFacet.Facet.targetAnnotationType === "DataPoint") {
		return getBindingWithGroupIdFromConfig(oControlConfiguration, oHeaderFacet.Facet.targetAnnotationValue!);
	}
};

export const getHeaderFormHboxRenderType = function (dataField: DataModelObjectPath<DataFieldAbstractTypes>): string | undefined {
	if (dataField?.targetObject?.$Type === UIAnnotationTypes.DataFieldForAnnotation) {
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
export function getDefaultActionHandler(
	oCtx: Context,
	oAction: CustomAction,
	oDataFieldForDefaultAction: MetaModelType<DataFieldDefault>,
	defaultActionContextOrEntitySet: string
): CompiledBindingToolkitExpression {
	if (oAction.defaultAction) {
		const defaultAction = oAction.defaultAction as CustomAction;
		try {
			switch (defaultAction.type) {
				case "ForAction": {
					return getPressExpressionForEdit(
						oDataFieldForDefaultAction as MetaModelType<DataFieldForAction>,
						defaultActionContextOrEntitySet,
						oAction.defaultAction as BaseAction
					);
				}
				case "ForNavigation": {
					if (defaultAction.command) {
						return "cmd:" + defaultAction.command;
					} else {
						return defaultAction.press;
					}
				}
				default: {
					if (defaultAction.command) {
						return "cmd:" + defaultAction.command;
					}
					if (defaultAction.noWrap) {
						return defaultAction.press;
					} else {
						return CommonHelper.buildActionWrapper(defaultAction, { id: "forTheObjectPage" });
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
export function isVisualizationIsPartOfPreview(subSection: DataVisualizationSubSection): boolean {
	return subSection.isPartOfPreview === true || subSection.presentation.visualizations[0].type !== "Table";
}

/**
 * Returns the expression that determines whether the footer of the object page is to be visible or not.
 * @param context The context for the formatter.
 * @param footerActions The list of footer actions.
 * @returns A binding expression
 */
export const getFooterVisibilityExpression = function (context: IContext, footerActions: BaseAction[]): CompiledBindingToolkitExpression {
	const metaModel = context.getInterface(1).getModel() as ODataMetaModel;

	const _generateBindingsForActions = (actions: BaseAction[]): BindingToolkitExpression<boolean>[] => {
		if (actions.length) {
			return actions.map((action) => resolveBindingString(action.visible ?? true, "boolean")) as BindingToolkitExpression<boolean>[];
		}
		return [constant(false)];
	};

	const getActionModelPath = (action: BaseAction): DataModelObjectPath<DataFieldForAction> | undefined => {
		const annotationPath = action.annotationPath;
		if (annotationPath) {
			const actionContext = metaModel.getContext(annotationPath);
			return getInvolvedDataModelObjects<DataFieldForAction>(actionContext);
		}
		return undefined;
	};

	// Actions are coming from the converter so only determining actions and not statically hidden are listed
	const determiningActions = footerActions.filter((action) => action.type === ActionType.DataFieldForAction);
	const manifestActionBindings = _generateBindingsForActions(footerActions.filter((action) => isManifestAction(action)));
	const determiningActionBindings = _generateBindingsForActions(determiningActions);

	const isNotHiddenDeterminingAction = !!determiningActions.find((action) => {
		const actionContextModelPath = getActionModelPath(action);
		return !actionContextModelPath?.targetObject?.annotations?.UI?.Hidden;
	});

	return compileExpression(
		or(
			isNotHiddenDeterminingAction,
			or(...manifestActionBindings),
			and(or(UI.IsEditable, or(...determiningActionBindings)), not(pathInModel("isCreateDialogOpen", "internal")))
		)
	);
};

/**
 * Get the subsection header level.
 * @param subSection The subsection visualization
 * @param isMoreContent
 * @returns A String value
 */
export function getHeaderLevel(subSection: DataVisualizationSubSection, isMoreContent: boolean): string {
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

getFooterVisibilityExpression.requiresIContext = true;

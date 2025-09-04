import type { ActionParameter, EntitySet, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, formatResult, getExpressionFromAnnotation, pathInModel } from "sap/fe/base/BindingToolkit";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { checkFilterExpressionRestrictions, enhanceDataModelPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	getLabel,
	hasDateType,
	hasValueHelp,
	hasValueHelpWithFixedValues,
	hasValueListForValidation,
	isCurrency,
	isGuid,
	isSemanticKey,
	isUnit
} from "sap/fe/core/templating/PropertyHelper";
import { getDisplayMode } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";

import type { FilterFunctions } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type { StrictPropertiesOf } from "sap/fe/base/ClassSupport";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type ValueHelpBlock from "sap/fe/macros/ValueHelp";
import additionalValueFormatter from "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter";
import type { ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import ValueHelp from "sap/ui/mdc/ValueHelp";
import Dialog from "sap/ui/mdc/valuehelp/Dialog";
import Popover from "sap/ui/mdc/valuehelp/Popover";
import Conditions from "sap/ui/mdc/valuehelp/content/Conditions";
import MTable from "sap/ui/mdc/valuehelp/content/MTable";
import type Context from "sap/ui/model/Context";

/**
 * Retrieve the displayMode for the value help.
 * The main rule is that if a property is used in a VHTable then we don't want to display the text arrangement directly.
 * @param propertyPath The current property
 * @param isValueHelpWithFixedValues The value help is a drop-down list
 * @returns The target displayMode
 */
export const getValueHelpTableDisplayMode = function (
	propertyPath: DataModelObjectPath<Property>,
	isValueHelpWithFixedValues: boolean
): string {
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
export const getDelegateConfiguration = function (
	propertyPath: string,
	conditionModelName: string,
	originalPropertyPath: string,
	requestGroupId?: string,
	useMultiValueField = false
): { name: string; payload: ValueHelpPayload } | string {
	const isUnitValueHelp = propertyPath !== originalPropertyPath;
	const delegateConfiguration: { name: string; payload: ValueHelpPayload } = {
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
export const getDelegateConfigurationForDefineConditions = function (propertyPath: string): CompiledBindingToolkitExpression {
	const delegateConfiguration: { name: string; payload: ValueHelpPayload } = {
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
export const generateID = function (
	sFlexId: string | undefined,
	sIdPrefix: string | undefined,
	sEntityType: string | undefined,
	sOriginalPropertyName: string,
	sPropertyName: string
): string {
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
export const requiresValidation = function (target: Property | ActionParameter): boolean {
	return (
		hasValueHelpWithFixedValues(target) ||
		hasValueListForValidation(target) ||
		(hasValueHelp(target) && (isUnit(target) || isCurrency(target) || isGuid(target)))
	);
};

/**
 * Method to decide if case-sensitive filter requests are to be used or not.
 *
 * If the back end has FilterFunctions Capabilies for the service or the entity, we check it includes support for tolower.
 * @param oDataModelPath Current data model path·
 * @param aEntityContainerFilterFunctions Filter functions of entity container
 * @returns `true` if the entity set or service supports case sensitive filter requests
 */
export const useCaseSensitiveFilterRequests = function (
	oDataModelPath: DataModelObjectPath<Property | ActionParameter>,
	aEntityContainerFilterFunctions: string[]
): boolean {
	const filterFunctions =
		((oDataModelPath?.targetEntitySet as EntitySet)?.annotations?.Capabilities?.FilterFunctions as FilterFunctions) ||
		aEntityContainerFilterFunctions;
	return ModelHelper.isFilteringCaseSensitive(undefined, filterFunctions);
};

export const isSemanticDateRange = function (oDataModelPath: DataModelObjectPath<Property>): CompiledBindingToolkitExpression | false {
	const targetProperty = oDataModelPath.targetObject;
	const targetRestrictions = checkFilterExpressionRestrictions(oDataModelPath, ["SingleRange"]);
	return targetProperty && hasDateType(targetProperty) && compileExpression(targetRestrictions);
};

export const shouldShowConditionPanel = function (
	oDataModelPath: DataModelObjectPath<Property>,
	oContextPath: DataModelObjectPath<PageContextPathTarget>
): boolean {
	// Force push the context path inside
	oDataModelPath.contextLocation = oContextPath;
	return compileExpression(checkFilterExpressionRestrictions(oDataModelPath, ["SingleValue", "MultiValue"])) === "false";
};

export const getColumnDataProperty = function (sValueListProperty: string, propertyPath: DataModelObjectPath<Property>): string {
	const textAnnotation = propertyPath?.targetObject?.annotations?.Common?.Text;
	return textAnnotation?.annotations?.UI?.TextArrangement?.valueOf() === "UI.TextArrangementType/TextOnly" &&
		isPathAnnotationExpression(textAnnotation)
		? textAnnotation.path
		: sValueListProperty;
};

const getColumnDataPropertyType = function (valueListPropertyType: string, propertyPath: DataModelObjectPath<Property>): string {
	const textArrangement = propertyPath?.targetObject?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement;
	return textArrangement && textArrangement.valueOf() !== "UI.TextArrangementType/TextSeparate" ? "Edm.String" : valueListPropertyType;
};

export const getColumnHAlign = function (propertyPath: DataModelObjectPath<Property>): CompiledBindingToolkitExpression {
	const property = propertyPath.targetObject;
	const propertyType = isProperty(property) ? getColumnDataPropertyType(property.type, propertyPath) : "";

	return !propertyType || isSemanticKey(property, propertyPath)
		? "Begin"
		: FieldHelper.getPropertyAlignment(propertyType, { textAlignMode: "Table" });
};
/**
 *
 * @param  propertyPath PropertyPath of the Field
 * @returns Runtime formatter for growing and growingThreshold
 */
export const getGrowingFormatter = function (propertyPath: string): CompiledBindingToolkitExpression {
	return compileExpression(
		formatResult([pathInModel("/recommendationsData", "internal"), constant(propertyPath)], additionalValueFormatter.getGrowing)
	);
};

export const getValueHelpTemplate = function (
	metaPath: Context,
	vhContent: StrictPropertiesOf<Omit<ValueHelpBlock, "contextPath" | "metaPath" | "ariaLabelledBy">> & {
		metaPath: Context;
		contextPath: Context;
	}
): string | Control | undefined {
	let dataModelObjectPath = getInvolvedDataModelObjects<Property>(metaPath, vhContent.contextPath);
	let originalProperty = getInvolvedDataModelObjects<Property>(vhContent.metaPath, vhContent.contextPath);
	if (isPathAnnotationExpression(originalProperty.targetObject)) {
		originalProperty = enhanceDataModelPath(originalProperty, originalProperty.targetObject.path);
	}
	if (isPathAnnotationExpression(dataModelObjectPath.targetObject)) {
		dataModelObjectPath = enhanceDataModelPath(dataModelObjectPath, dataModelObjectPath.targetObject.path);
	}
	if (dataModelObjectPath.targetObject) {
		const valueHelpId = generateID(
			vhContent._flexId,
			vhContent.idPrefix,
			!vhContent.filterFieldValueHelp ? originalProperty.targetEntityType.name : undefined,
			getTargetObjectPath(originalProperty, true),
			getTargetObjectPath(dataModelObjectPath, true)
		);
		const dialogTitle = getLabel(dataModelObjectPath.targetObject) || dataModelObjectPath.targetObject.name;
		if (hasValueHelp(dataModelObjectPath.targetObject)) {
			const shouldValidateInput =
				vhContent.filterFieldValueHelp || vhContent.requiresValidation || requiresValidation(dataModelObjectPath.targetObject);
			const showConditionPanel = vhContent.filterFieldValueHelp
				? equal(checkFilterExpressionRestrictions(dataModelObjectPath, ["SingleValue", "MultiValue"]), false)
				: false;
			const valueHelpDelegateConfiguration = getDelegateConfiguration(
				getTargetObjectPath(dataModelObjectPath),
				vhContent.conditionModel,
				getTargetObjectPath(originalProperty),
				vhContent.requestGroupId,
				vhContent.useMultiValueField
			);
			const shouldUseCaseSensitiveFilter = useCaseSensitiveFilterRequests(
				dataModelObjectPath,
				(dataModelObjectPath.targetEntitySet as EntitySet)?.annotations?.Capabilities?.FilterFunctions?.map((str) =>
					str.toString()
				) ?? []
			);
			const isValueListForValidation = hasValueListForValidation(dataModelObjectPath.targetObject);
			const isValueListWithFixedValues = hasValueHelpWithFixedValues(dataModelObjectPath.targetObject);
			const customData = [<CustomData key={"showConditionPanel"} value={showConditionPanel} />];
			if (isValueListForValidation) {
				customData.push(
					<CustomData
						key={"valuelistForValidation"}
						value={compileExpression(
							getExpressionFromAnnotation(
								dataModelObjectPath.targetObject.annotations?.Common
									?.ValueListForValidation as unknown as PropertyAnnotationValue<string>
							)
						)}
					/>
				);
			}
			return (
				<ValueHelp delegate={valueHelpDelegateConfiguration} id={valueHelpId} validateInput={shouldValidateInput}>
					{{
						customData: customData,
						typeahead: (
							<Popover>
								<MTable
									id={`${valueHelpId}::Popover::qualifier::`}
									caseSensitive={shouldUseCaseSensitiveFilter}
									useAsValueHelp={hasValueHelpWithFixedValues(dataModelObjectPath.targetObject)}
								/>
							</Popover>
						),
						dialog: !isValueListWithFixedValues ? <Dialog /> : undefined
					}}
				</ValueHelp>
			);
		} else if (vhContent.filterFieldValueHelp) {
			return (
				<ValueHelp id={valueHelpId}>
					{{
						customData:
							vhContent.requestGroupId !== undefined
								? [<CustomData key={"requestGroupId"} value={vhContent.requestGroupId} />]
								: [],
						dialog: (
							<Dialog title={dialogTitle}>
								<Conditions />
							</Dialog>
						)
					}}
				</ValueHelp>
			);
		}
	}
};

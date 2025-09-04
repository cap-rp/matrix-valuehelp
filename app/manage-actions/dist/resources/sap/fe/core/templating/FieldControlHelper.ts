import type { Action, ActionParameter, ConvertedMetadata, Property } from "@sap-ux/vocabularies-types";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAnnotation,
	DataPoint,
	DataPointType,
	DataPointTypeTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { equal, getExpressionFromAnnotation, isConstant, or } from "sap/fe/base/BindingToolkit";
import { isDataField, isDataFieldForAnnotation } from "../converters/annotations/DataField";
import { bindingContextPathVisitor } from "../helpers/BindingHelper";
import { isProperty } from "../helpers/TypeGuards";

/**
 * Create the binding expression to check if the property is read only or not.
 * @param oTarget The target property or DataField
 * @param relativePath Array of navigation properties pointing to the location of field control property
 * @returns The binding expression resolving to a Boolean being true if it's read only
 */
export const isReadOnlyExpression = function (
	oTarget: Property | DataFieldAbstractTypes | DataPointTypeTypes | ActionParameter | undefined,
	relativePath?: string[]
): BindingToolkitExpression<boolean> {
	const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
	if (!isConstant(fieldControlExpression)) {
		return or(equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
	} else {
		return or(
			equal(fieldControlExpression, "Common.FieldControlType/ReadOnly"),
			equal(fieldControlExpression, 1),
			equal(fieldControlExpression, "1")
		);
	}
};

/**
 * Create the binding expression to check if the property is disabled or not.
 * @param oTarget The target property or DataField
 * @param relativePath Array of navigation properties pointing to the location of field control property
 * @returns The binding expression resolving to a Boolean being true if it's disabled
 */
export const isDisabledExpression = function (
	oTarget: Property | DataFieldAbstractTypes | DataPointTypeTypes | ActionParameter | undefined,
	relativePath?: string[]
): BindingToolkitExpression<boolean> {
	const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
	if (!isConstant(fieldControlExpression)) {
		return or(equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
	} else {
		return or(
			equal(fieldControlExpression, "Common.FieldControlType/Hidden"), // deprecated version but still used by stakeholders
			equal(fieldControlExpression, "Common.FieldControlType/Inapplicable"),
			equal(fieldControlExpression, 0),
			equal(fieldControlExpression, "0")
		);
	}
};

/**
 * Create the binding expression to check if the property is editable or not.
 * @param oTarget The target property or DataField
 * @param relativePath Array of navigation properties pointing to the location of field control property
 * @returns The binding expression resolving to a Boolean being true if it's not editable
 */
export const isNonEditableExpression = function (
	oTarget: Property | DataFieldAbstractTypes | DataPointTypeTypes | undefined,
	relativePath?: string[]
): BindingToolkitExpression<boolean> {
	return or(isReadOnlyExpression(oTarget, relativePath), isDisabledExpression(oTarget, relativePath));
};

/**
 * Determines if the dataFieldForAnnotation has a fieldControl that is not set to Mandatory.
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if it has a fieldControl set and not Mandatory.
 */
export const hasFieldControlNotMandatory = function (dataFieldForAnnotation: DataFieldForAnnotation): boolean {
	const fieldControl = dataFieldForAnnotation.annotations?.Common?.FieldControl;
	return fieldControl && fieldControl.toString() !== "Common.FieldControlType/Mandatory" ? true : false;
};

/**
 * Determines if the target has a field control annotation with static value mandatory .
 * @param target The target to be processed
 * @returns True if it has a static mandatory field control.
 */
export function isStaticallyMandatory(target: DataField | DataFieldForAnnotation | DataPoint | Property | undefined): boolean {
	const fieldFieldControl = target?.annotations?.Common?.FieldControl;
	if (isProperty(target) || isDataFieldForAnnotation(target as DataFieldForAnnotation)) {
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
	return (target as DataPoint)?.Value?.$target?.annotations?.Common?.FieldControl?.toString() === "Common.FieldControlType/Mandatory";
}

/**
 * Create the binding expression to check if the property is read only or not.
 * @param oTarget The target property or DataField
 * @param relativePath Array of navigation properties pointing to the location of field control property
 * @returns The binding expression resolving to a Boolean being true if it's read only
 */
export const isRequiredExpression = function (
	oTarget: Property | DataFieldAbstractTypes | DataPointType | undefined,
	relativePath?: string[]
): BindingToolkitExpression<boolean> {
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
export const isActionParameterRequiredExpression = function (
	actionParameter: ActionParameter,
	actionTarget: Action,
	convertedTypes: ConvertedMetadata
): BindingToolkitExpression<boolean> {
	const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
	const fieldControlValue = actionParameter.annotations?.Common?.FieldControl;
	const fieldControlExp = getExpressionFromAnnotation(fieldControlValue, [], undefined, (path: string) =>
		bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName)
	);

	return _isRequiredExpression(fieldControlExp);
};

const _isRequiredExpression = (fieldControlExp: BindingToolkitExpression<string | number>): BindingToolkitExpression<boolean> => {
	return or(
		isConstant(fieldControlExp) && equal(fieldControlExp, "Common.FieldControlType/Mandatory"),
		equal(fieldControlExp, 7),
		equal(fieldControlExp, "7")
	);
};

import type {
	NavigationProperty,
	PathAnnotationExpression,
	Property,
	PropertyAnnotationValue,
	ServiceObjectAndAnnotation
} from "@sap-ux/vocabularies-types";
import type { EntitySetAnnotations_Capabilities } from "@sap-ux/vocabularies-types/vocabularies/Capabilities_Edm";
import type {
	ValueListParameterInOut,
	ValueListParameterOutTypes,
	ValueListParameterTypes
} from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { PropertyAnnotations } from "@sap-ux/vocabularies-types/vocabularies/Edm_Types";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldTypes,
	DataFieldWithAction,
	DataFieldWithIntentBasedNavigation,
	DataFieldWithNavigationPath,
	DataFieldWithUrl,
	DataPointType,
	DataPointTypeTypes,
	InputMaskRuleTypeTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes, type DataFieldForAnnotation } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type {
	BindingToolkitExpression,
	CompiledBindingToolkitExpression,
	ExpressionOrPrimitive,
	FormatOptions,
	PathInModelExpression,
	PrimitiveType
} from "sap/fe/base/BindingToolkit";
import * as BindingToolkit from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	constant,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	ifElse,
	isComplexTypeExpression,
	isPathInModelExpression,
	or,
	pathInModel,
	transformRecursively
} from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { isDataFieldForAnnotation } from "sap/fe/core/converters/annotations/DataField";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import {
	isAnnotationOfTerm,
	isAnnotationOfType,
	isNavigationProperty,
	isPathAnnotationExpression,
	isProperty
} from "sap/fe/core/helpers/TypeGuards";
import * as CommonFormatters from "sap/fe/core/templating/CommonFormatters";
import { generateVisibleExpression } from "sap/fe/core/templating/DataFieldFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextPropertyRestriction,
	getContextRelativeTargetObjectPath,
	getRelativePaths
} from "sap/fe/core/templating/DataModelPathHelper";
import * as PropertyHelper from "sap/fe/core/templating/PropertyHelper";
import { hasStaticPercentUnit } from "sap/fe/core/templating/PropertyHelper";
import * as SemanticObjectHelper from "sap/fe/core/templating/SemanticObjectHelper";
import type { DisplayMode, PropertyOrPath } from "sap/fe/core/templating/UIFormatters";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type { InputMaskRule } from "sap/fe/core/type/InputMask";
import type { FieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import AvatarShape from "sap/m/AvatarShape";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type FieldFormatOptions from "./FieldFormatOptions";
import FieldHelper from "./FieldHelper";

/**
 * Recursively add the text arrangement to a binding expression.
 * @param bindingExpressionToEnhance The binding expression to be enhanced
 * @param fullContextPath The current context path we're on (to properly resolve the text arrangement properties)
 * @returns An updated expression containing the text arrangement binding.
 */
export const addTextArrangementToBindingExpression = function (
	bindingExpressionToEnhance: BindingToolkitExpression<PrimitiveType>,
	fullContextPath: DataModelObjectPath<PageContextPathTarget>
): BindingToolkitExpression<PrimitiveType> {
	return transformRecursively(bindingExpressionToEnhance, "PathInModel", (expression: PathInModelExpression<PrimitiveType>) => {
		let outExpression: BindingToolkitExpression<PrimitiveType> = expression;
		if (expression.modelName === undefined) {
			// In case of default model we then need to resolve the text arrangement property
			const oPropertyDataModelPath = enhanceDataModelPath<Property>(fullContextPath, expression.path);
			outExpression = CommonFormatters.getBindingWithTextArrangement(oPropertyDataModelPath, expression);
		}
		return outExpression;
	});
};

export const formatValueRecursively = function (
	bindingExpressionToEnhance: BindingToolkitExpression<unknown>,
	fullContextPath: DataModelObjectPath<unknown>
): BindingToolkitExpression<unknown> {
	return transformRecursively(bindingExpressionToEnhance, "PathInModel", (expression: PathInModelExpression<unknown>) => {
		let outExpression: BindingToolkitExpression<unknown> = expression;
		if (expression.modelName === undefined) {
			// In case of default model we then need to resolve the text arrangement property
			const oPropertyDataModelPath = enhanceDataModelPath<Property>(fullContextPath, expression.path);
			if (oPropertyDataModelPath.targetObject) {
				outExpression = formatWithTypeInformation(oPropertyDataModelPath.targetObject, expression);
			}
		}
		return outExpression;
	});
};

export const getTextBindingExpression = function (
	oPropertyDataModelObjectPath: DataModelObjectPath<Property>,
	fieldFormatOptions: Partial<FieldFormatOptions>
): BindingToolkitExpression<string> {
	return getTextBinding(oPropertyDataModelObjectPath, fieldFormatOptions, true) as BindingToolkitExpression<string>;
};

export const getTextBinding = function (
	inputDataModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>,
	fieldFormatOptions: Partial<FieldFormatOptions>,
	asObject = false,
	customFormatter?: string
): BindingToolkitExpression<string> | CompiledBindingToolkitExpression {
	if (
		isAnnotationOfType<
			| DataField
			| DataPointType
			| DataFieldWithNavigationPath
			| DataFieldWithUrl
			| DataFieldWithIntentBasedNavigation
			| DataFieldWithAction
		>(inputDataModelPath.targetObject, [
			UIAnnotationTypes.DataField,
			UIAnnotationTypes.DataPointType,
			UIAnnotationTypes.DataFieldWithNavigationPath,
			UIAnnotationTypes.DataFieldWithUrl,
			UIAnnotationTypes.DataFieldWithIntentBasedNavigation,
			UIAnnotationTypes.DataFieldWithAction
		])
	) {
		// If there is no resolved property, the value is returned as a constant
		const fieldValue = getExpressionFromAnnotation(inputDataModelPath.targetObject.Value) ?? "";
		return compileExpression(fieldValue);
	}
	if (isPathAnnotationExpression(inputDataModelPath.targetObject) && inputDataModelPath.targetObject.$target) {
		inputDataModelPath = enhanceDataModelPath<Property>(inputDataModelPath, inputDataModelPath.targetObject.path);
	}
	// When targetObject is a constant value
	if (typeof inputDataModelPath.targetObject === "string") {
		return inputDataModelPath.targetObject;
	}
	const oPropertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(inputDataModelPath));
	let oTargetBinding;
	const propertyDataModelObjectPath = inputDataModelPath as DataModelObjectPath<Property>; // At this point we should only have a property
	const oTargetProperty = propertyDataModelObjectPath.targetObject;
	// formatting

	if (oTargetProperty?.annotations?.UI?.InputMask) {
		oTargetBinding = formatWithTypeInformation(oTargetProperty, oPropertyBindingExpression);
		oTargetBinding.type = "sap.fe.core.type.InputMask";
		oTargetBinding.formatOptions = {
			mask: oTargetProperty.annotations?.UI?.InputMask?.Mask.toString(),
			placeholderSymbol: oTargetProperty.annotations?.UI?.InputMask?.PlaceholderSymbol.toString(),
			maskRule: _getMaskingRules(oTargetProperty.annotations?.UI?.InputMask?.Rules)
		} as unknown as FormatOptions;
	} else if (oTargetProperty?.annotations?.Common?.Masked?.valueOf()) {
		oTargetBinding = formatWithTypeInformation(oTargetProperty, oPropertyBindingExpression);
		oTargetBinding.formatOptions = {
			editStyle: "Masked"
		} as unknown as FormatOptions;
	} else if (oTargetProperty?.annotations?.Measures?.Unit || oTargetProperty?.annotations?.Measures?.ISOCurrency) {
		oTargetBinding = UIFormatters.getBindingWithUnitOrCurrency(
			propertyDataModelObjectPath,
			oPropertyBindingExpression,
			undefined,
			{},
			true,
			fieldFormatOptions.showOnlyUnitDecimals
		);
		if (fieldFormatOptions?.measureDisplayMode === "Hidden" && isComplexTypeExpression(oTargetBinding)) {
			// TODO: Refactor once types are less generic here
			oTargetBinding.formatOptions = {
				...oTargetBinding.formatOptions,
				showMeasure: false
			};
		}
	} else if (oTargetProperty?.annotations?.Common?.Timezone && oTargetProperty.type == "Edm.DateTimeOffset") {
		oTargetBinding = UIFormatters.getBindingWithTimezone(
			propertyDataModelObjectPath,
			oPropertyBindingExpression,
			false,
			true,
			fieldFormatOptions as FieldFormatOptions
		);
	} else if (oTargetProperty?.annotations?.Common?.IsTimezone) {
		oTargetBinding = UIFormatters.getBindingForTimezone(propertyDataModelObjectPath, oPropertyBindingExpression);
	} else if (
		oTargetProperty?.annotations?.UI?.DateTimeStyle ||
		fieldFormatOptions?.dateTimePattern ||
		fieldFormatOptions?.dateTimeStyle
	) {
		oTargetBinding = UIFormatters.getBindingForDateFormat(propertyDataModelObjectPath, oPropertyBindingExpression, fieldFormatOptions);
	} else {
		oTargetBinding = CommonFormatters.getBindingWithTextArrangement(
			propertyDataModelObjectPath,
			oPropertyBindingExpression,
			fieldFormatOptions,
			customFormatter
		);
	}

	if (asObject) {
		return oTargetBinding;
	}
	// We don't include $$nopatch and parseKeepEmptyString as they make no sense in the text binding case
	return compileExpression(oTargetBinding);
};

export const getValueBinding = function (
	oPropertyDataModelObjectPath: DataModelObjectPath<Property | DataFieldTypes>,
	fieldFormatOptions: Partial<FieldFormatOptions>,
	ignoreUnit = false,
	ignoreFormatting = false,
	bindingParameters?: object,
	targetTypeAny = false,
	keepUnit = false,
	decimalPadding?: number,
	forDisplay = false,
	asObject = false
): CompiledBindingToolkitExpression {
	if (isPathAnnotationExpression(oPropertyDataModelObjectPath.targetObject) && oPropertyDataModelObjectPath.targetObject.$target) {
		const oNavPath = oPropertyDataModelObjectPath.targetEntityType.resolvePath(oPropertyDataModelObjectPath.targetObject.path, true);
		oPropertyDataModelObjectPath.targetObject = oNavPath.target;
		oNavPath.visitedObjects.forEach((oNavObj: ServiceObjectAndAnnotation) => {
			if (isNavigationProperty(oNavObj)) {
				oPropertyDataModelObjectPath.navigationProperties.push(oNavObj);
			}
		});
	}

	const targetObject = oPropertyDataModelObjectPath.targetObject;
	if (isProperty(targetObject)) {
		let oBindingExpression: BindingToolkitExpression<unknown> = pathInModel(
			getContextRelativeTargetObjectPath(oPropertyDataModelObjectPath)
		);
		if (isPathInModelExpression(oBindingExpression)) {
			if (targetObject.annotations?.Communication?.IsEmailAddress) {
				oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
				oBindingExpression.type = "sap.fe.core.type.Email";
			} else if (targetObject.annotations?.UI?.InputMask) {
				oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
				oBindingExpression.type = "sap.fe.core.type.InputMask";
				oBindingExpression.formatOptions = {
					...oBindingExpression.formatOptions,
					mask: targetObject.annotations.UI.InputMask.Mask,
					placeholderSymbol: targetObject.annotations.UI.InputMask.PlaceholderSymbol,
					maskRule: _getMaskingRules(targetObject.annotations.UI.InputMask.Rules)
				} as FormatOptions;
			} else if (targetObject.annotations?.Common?.Masked?.valueOf()) {
				oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
				oBindingExpression.formatOptions = {
					...oBindingExpression.formatOptions,
					style: "password"
				} as FormatOptions;
			} else if (!ignoreUnit && (targetObject.annotations?.Measures?.ISOCurrency || targetObject.annotations?.Measures?.Unit)) {
				const targetFormatOptions: {
					showMeasure?: boolean;
					decimalPadding?: number;
				} = {};
				if (!keepUnit) {
					targetFormatOptions["showMeasure"] = false;
				}
				if (String(fieldFormatOptions.isCurrencyOrUnitAligned) === "true") {
					targetFormatOptions["decimalPadding"] = decimalPadding;
				}
				oBindingExpression = UIFormatters.getBindingWithUnitOrCurrency(
					oPropertyDataModelObjectPath as DataModelObjectPath<Property>,
					oBindingExpression,
					true,
					keepUnit ? undefined : targetFormatOptions,
					forDisplay,
					fieldFormatOptions.showOnlyUnitDecimals
				);
			} else if (targetObject?.annotations?.Common?.IsTimezone) {
				oBindingExpression = UIFormatters.getBindingForTimezone(
					oPropertyDataModelObjectPath as DataModelObjectPath<Property>,
					oBindingExpression
				);
			} else if (
				targetObject?.annotations?.UI?.DateTimeStyle ||
				fieldFormatOptions?.dateTimePattern ||
				fieldFormatOptions?.dateTimeStyle
			) {
				oBindingExpression = UIFormatters.getBindingForDateFormat(
					oPropertyDataModelObjectPath as DataModelObjectPath<Property>,
					oBindingExpression,
					fieldFormatOptions
				);
			} else if (targetObject?.annotations?.Common?.Timezone && targetObject.type === "Edm.DateTimeOffset") {
				oBindingExpression = UIFormatters.getBindingWithTimezone(
					oPropertyDataModelObjectPath as DataModelObjectPath<Property>,
					oBindingExpression,
					true
				);
			} else {
				oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
				if (targetObject.annotations.Common?.ExternalID) {
					(oBindingExpression as { path: string }).path += "@$ui5.fe.@Common/ExternalID";
				}
			}

			if (isPathInModelExpression(oBindingExpression)) {
				if (ignoreFormatting) {
					delete oBindingExpression.formatOptions;
					delete oBindingExpression.constraints;
					delete oBindingExpression.type;
				}
				if (bindingParameters) {
					oBindingExpression.parameters = bindingParameters;
				}
				if (targetTypeAny) {
					oBindingExpression.targetType = "any";
				}
			}
			if (asObject) {
				return oBindingExpression as unknown as CompiledBindingToolkitExpression;
			}
			return compileExpression(oBindingExpression);
		} else {
			// if somehow we could not compile the binding -> return empty string
			return "";
		}
	} else if (
		targetObject?.$Type === UIAnnotationTypes.DataFieldWithUrl ||
		targetObject?.$Type === UIAnnotationTypes.DataFieldWithNavigationPath
	) {
		return compileExpression(getExpressionFromAnnotation((targetObject as DataFieldWithUrl).Value));
	} else {
		return "";
	}
};

export const getAssociatedTextBinding = function (
	oPropertyDataModelObjectPath: DataModelObjectPath<Property>,
	fieldFormatOptions: Partial<FieldFormatOptions>
): CompiledBindingToolkitExpression {
	const textPropertyPath = PropertyHelper.getAssociatedTextPropertyPath(oPropertyDataModelObjectPath.targetObject);
	if (textPropertyPath) {
		const oTextPropertyPath = enhanceDataModelPath<Property>(oPropertyDataModelObjectPath, textPropertyPath);
		//BCP 2380120806: getValueBinding needs to be able to set formatOptions.parseKeepsEmptyString.
		//Otherwise emptying an input field that has a text annotation to a not nullable string would result in
		//an error message. Therefore import param 'ignoreFormatting' is now set to false.
		let allowPatch = false;
		const valueListOutParameters: string[] =
			oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.ValueList?.Parameters.map(
				(parameter: ValueListParameterTypes) => {
					if (!parameter) {
						return "";
					}
					return (
						(parameter as ValueListParameterInOut | ValueListParameterOutTypes)?.LocalDataProperty?.$target
							?.fullyQualifiedName ?? ""
					);
				}
			) || [];
		if (
			oTextPropertyPath?.targetObject?.fullyQualifiedName &&
			valueListOutParameters.includes(oTextPropertyPath.targetObject.fullyQualifiedName)
		) {
			allowPatch = true;
		}
		const bindingParameters = allowPatch ? undefined : { $$noPatch: true };
		return getValueBinding(oTextPropertyPath, fieldFormatOptions, true, false, bindingParameters, false, false, undefined, true);
	}
	return undefined;
};

export const isUsedInNavigationWithQuickViewFacets = function (oDataModelPath: DataModelObjectPath<unknown>, oProperty: Property): boolean {
	const aNavigationProperties = oDataModelPath?.targetEntityType?.navigationProperties || [];
	const aSemanticObjects = oDataModelPath?.targetEntityType?.annotations?.Common?.SemanticKey || [];
	let bIsUsedInNavigationWithQuickViewFacets = false;
	aNavigationProperties.forEach((oNavProp: NavigationProperty) => {
		if (oNavProp.referentialConstraint && oNavProp.referentialConstraint.length) {
			oNavProp.referentialConstraint.forEach((oRefConstraint) => {
				if (oRefConstraint?.sourceProperty === oProperty.name) {
					if (oNavProp?.targetType?.annotations?.UI?.QuickViewFacets) {
						bIsUsedInNavigationWithQuickViewFacets = true;
					}
				}
			});
		}
	});
	if (oDataModelPath.contextLocation?.targetEntitySet !== oDataModelPath.targetEntitySet) {
		const aIsTargetSemanticKey = aSemanticObjects.some(function (oSemantic) {
			return oSemantic?.$target?.name === oProperty.name;
		});
		if ((aIsTargetSemanticKey || oProperty.isKey) && oDataModelPath?.targetEntityType?.annotations?.UI?.QuickViewFacets) {
			bIsUsedInNavigationWithQuickViewFacets = true;
		}
	}
	return bIsUsedInNavigationWithQuickViewFacets;
};

export const isRetrieveTextFromValueListEnabled = function (
	oPropertyPath: PropertyOrPath<Property>,
	fieldFormatOptions: { displayMode?: DisplayMode; textAlignMode?: string }
): boolean {
	const oProperty: Property = (isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target) || (oPropertyPath as Property);
	if (
		!oProperty.annotations?.Common?.Text &&
		!oProperty.annotations?.Measures &&
		PropertyHelper.hasValueHelp(oProperty) &&
		fieldFormatOptions.textAlignMode === "Form"
	) {
		return true;
	}
	return false;
};

/**
 * Calculates text alignment based on the dataModelObjectPath.
 * @param dataFieldModelPath The property's type
 * @param formatOptions The field format options
 * @param formatOptions.displayMode Display format
 * @param formatOptions.textAlignMode Text alignment of the field
 * @param computedEditMode The editMode used in this case
 * @param considerTextAnnotation Whether to consider the text annotation when computing the alignment
 * @returns The property alignment
 */
export const getTextAlignment = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldAbstractTypes>,
	formatOptions: { displayMode?: string; textAlignMode?: string },
	computedEditMode: BindingToolkitExpression<string>,
	considerTextAnnotation = false
): CompiledBindingToolkitExpression {
	// check for the target value type directly, or in case it is pointing to a DataPoint we look at the dataPoint's value
	let typeForAlignment =
		(dataFieldModelPath.targetObject as DataFieldTypes)?.Value?.$target.type ||
		((dataFieldModelPath.targetObject as DataFieldForAnnotation)?.Target?.$target as DataPointType)?.Value.$target.type;

	if (
		PropertyHelper.isKey(
			(dataFieldModelPath.targetObject as DataFieldTypes)?.Value?.$target ||
				((dataFieldModelPath.targetObject as DataFieldForAnnotation)?.Target?.$target as DataPointType)?.Value?.$target
		)
	) {
		return "Begin";
	}
	if (
		considerTextAnnotation &&
		formatOptions.displayMode &&
		["Description", "DescriptionValue", "ValueDescription"].includes(formatOptions.displayMode)
	) {
		const textAnnotation = (dataFieldModelPath.targetObject as DataFieldTypes)?.Value?.$target.annotations?.Common?.Text;
		const textArrangementAnnotation = textAnnotation?.annotations?.UI?.TextArrangement.valueOf();
		if (textAnnotation && textArrangementAnnotation !== "UI.TextArrangementType/TextSeparate") {
			typeForAlignment = textAnnotation.$target.type;
		}
	}

	return FieldHelper.getPropertyAlignment(typeForAlignment, formatOptions, computedEditMode);
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
export const getVisibleExpression = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>,
	formatOptions?: { isAnalytics?: boolean }
): CompiledBindingToolkitExpression {
	return compileExpression(generateVisibleExpression(dataFieldModelPath, formatOptions));
};

/**
 * Returns the Boolean or other expression for the visibility of a FormElement.
 * The FormElement is visible if at least one content is visible, otherwise invisible.
 * @param dataFieldModelPath The metapath referring to the annotation we are evaluating.
 * @returns A Boolean or other expression that can be bound to the UI.
 */
export const visibleExpressionsForConnectedFieldsFormElement = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>
): CompiledBindingToolkitExpression {
	const dataFieldForAnnotation = dataFieldModelPath.targetObject as DataFieldAbstractTypes;
	const visibleExpression = compileExpression(generateVisibleExpression(dataFieldModelPath));

	const dataFieldsBindingExpressions: (boolean | BindingToolkitExpression<boolean>)[] = [];
	if (typeof visibleExpression === "string" && visibleExpression.includes("{=")) {
		return visibleExpression;
	}
	if (
		dataFieldForAnnotation.$Type === UIAnnotationTypes.DataFieldForAnnotation &&
		dataFieldForAnnotation.Target.$target?.$Type === UIAnnotationTypes.ConnectedFieldsType
	) {
		const connectedFields = Object.values(dataFieldForAnnotation.Target.$target.Data).filter(
			(connectedField) => connectedField?.hasOwnProperty("Value")
		) as DataFieldAbstractTypes[];
		connectedFields.forEach((dataField) => {
			dataFieldModelPath.targetObject = dataField;
			const bindingExpressionObject = generateVisibleExpression(dataFieldModelPath);
			if (bindingExpressionObject !== undefined) {
				dataFieldsBindingExpressions.push(bindingExpressionObject);
			}
		});
		/* Combine the expressions with or */
		return dataFieldsBindingExpressions.length ? compileExpression(or(...dataFieldsBindingExpressions)) : visibleExpression;
	}
	return visibleExpression;
};

/**
 * Returns the binding for a property in a QuickViewFacets.
 * @param propertyDataModelObjectPath The DataModelObjectPath of the property
 * @returns A string of the value, or a BindingExpression
 */
export const getQuickViewBinding = function (
	propertyDataModelObjectPath: DataModelObjectPath<Property>
): BindingToolkitExpression<string> | CompiledBindingToolkitExpression | string {
	if (!propertyDataModelObjectPath.targetObject) {
		return "";
	}
	if (typeof propertyDataModelObjectPath.targetObject === "string") {
		return propertyDataModelObjectPath.targetObject;
	}

	return getTextBinding(propertyDataModelObjectPath, {} as FieldFormatOptions);
};

/**
 * Return the type of the QuickViewGroupElement.
 * @param dataFieldDataModelObjectPath The DataModelObjectPath of the DataField
 * @returns The type of the QuickViewGroupElement
 */
export const getQuickViewType = function (dataFieldDataModelObjectPath: DataModelObjectPath<DataFieldTypes | Property>): string {
	const targetObject = dataFieldDataModelObjectPath.targetObject;
	if (isAnnotationOfType<DataFieldWithUrl>(targetObject, UIAnnotationTypes.DataFieldWithUrl) && targetObject?.Url) {
		return "link";
	}
	if (
		(!isProperty(targetObject) && targetObject?.Value.$target?.annotations?.Communication?.IsEmailAddress) ||
		(isProperty(targetObject) && targetObject?.annotations?.Communication?.IsEmailAddress)
	) {
		return "email";
	}
	if (
		(!isProperty(targetObject) && targetObject?.Value.$target?.annotations?.Communication?.IsPhoneNumber) ||
		(isProperty(targetObject) && targetObject?.annotations?.Communication?.IsPhoneNumber)
	) {
		return "phone";
	}
	return "text";
};

export type SemanticObjectCustomData = {
	key: string;
	value: string;
};

export const getSemanticObjects = function (
	aSemObjExprToResolve: { key: string; value: PropertyAnnotationValue<PrimitiveType> }[]
): Context {
	if (aSemObjExprToResolve.length > 0) {
		let sCustomDataKey = "";
		let sCustomDataValue: CompiledBindingToolkitExpression = "";
		const aSemObjCustomData: { key: string; value: CompiledBindingToolkitExpression }[] = [];
		for (const item of aSemObjExprToResolve) {
			sCustomDataKey = item.key;
			sCustomDataValue = compileExpression(getExpressionFromAnnotation(item.value));
			aSemObjCustomData.push({
				key: sCustomDataKey,
				value: sCustomDataValue
			});
		}
		const oSemanticObjectsModel = new JSONModel(aSemObjCustomData);
		(oSemanticObjectsModel as { $$valueAsPromise?: boolean }).$$valueAsPromise = true;
		return oSemanticObjectsModel.createBindingContext("/");
	} else {
		return new JSONModel([]).createBindingContext("/");
	}
};

/**
 * Method to get MultipleLines for a DataField.
 * @param {any} oThis The current object
 * @param {boolean} isMultiLineText The property isMultiLineText
 * @returns {CompiledBindingToolkitExpression<string>} The binding expression to determine if a data field should be a MultiLineText or not
 * @public
 */

export const getMultipleLinesForDataField = function (oThis: Partial<{ wrap?: boolean }>, isMultiLineText: boolean): boolean {
	if (oThis.wrap === false) {
		return false;
	}
	return isMultiLineText;
};

const _hasValueHelpToShow = function (oProperty: Property, measureDisplayMode: string | undefined): boolean | undefined {
	// we show a value help if teh property has one or if its visible unit has one
	const oPropertyUnit = PropertyHelper.getAssociatedUnitProperty(oProperty);
	const oPropertyCurrency = PropertyHelper.getAssociatedCurrencyProperty(oProperty);
	return (
		(PropertyHelper.hasValueHelp(oProperty) && oProperty.type !== "Edm.Boolean") ||
		(measureDisplayMode !== "Hidden" &&
			((oPropertyUnit && PropertyHelper.hasValueHelp(oPropertyUnit)) ||
				(oPropertyCurrency && PropertyHelper.hasValueHelp(oPropertyCurrency))))
	);
};

/**
 * Sets the minimum and maximum date for the date field.
 * @param dateAnnotation Property Annotations for the date field.
 * @param type Either 'Maximum' or 'Minimum'.
 * @param relativeLocation
 * @returns Mininum or Maximum date expression.
 */
export const getMinMaxDateExpression = function (
	dateAnnotation: PropertyAnnotations | undefined,
	type: "Maximum" | "Minimum",
	relativeLocation: string[]
): BindingToolkitExpression<unknown> | undefined {
	const fixedDate = dateAnnotation?.Validation?.[type]?.$Date;
	const dateProperty = dateAnnotation?.Validation?.[type];
	if (fixedDate) {
		return formatResult([constant(fixedDate)], valueFormatters.provideDateInstance);
	} else if (dateProperty) {
		return BindingToolkit.getExpressionFromAnnotation(dateAnnotation?.Validation?.[type], relativeLocation);
	}
	return undefined;
};

/**
 * Sets Edit Style properties for Field in case of Macro Field and MassEditDialog fields.
 * @param oProps Field Properties for the Macro Field.
 * @param oDataField DataField Object.
 * @param oDataModelPath DataModel Object Path to the property.
 * @param onlyEditStyle To add only editStyle.
 */
export const setEditStyleProperties = function (
	oProps: FieldBlockProperties,
	oDataField: DataFieldAbstractTypes | DataPointTypeTypes,
	oDataModelPath: DataModelObjectPath<Property | DataFieldTypes>,
	onlyEditStyle?: boolean
): void {
	const oProperty = oDataModelPath.targetObject;
	if (
		!isProperty(oProperty) ||
		[
			UIAnnotationTypes.DataFieldForAction,
			UIAnnotationTypes.DataFieldWithNavigationPath,
			UIAnnotationTypes.DataFieldForActionGroup,
			UIAnnotationTypes.DataFieldForIntentBasedNavigation
		].includes(oDataField.$Type)
	) {
		oProps.editStyle = null;
		return;
	}
	if (!onlyEditStyle) {
		if (oProperty?.annotations?.Validation?.Maximum?.$Date || oProperty?.annotations?.Validation?.Minimum?.$Date) {
			const propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oDataModelPath));
			oProps.valueBindingExpression = UIFormatters.getBindingForDatePicker(
				oDataModelPath,
				propertyBindingExpression
			) as CompiledBindingToolkitExpression;
		} else {
			oProps.valueBindingExpression = oProps.value ? oProps.value : getValueBinding(oDataModelPath, oProps.formatOptions);
		}

		const editStylePlaceholder =
			(oDataField as unknown as Property).annotations?.UI?.Placeholder ||
			(oDataField as DataField)?.Value?.$target?.annotations?.UI?.Placeholder;

		if (editStylePlaceholder) {
			oProps.editStylePlaceholder = compileExpression(getExpressionFromAnnotation(editStylePlaceholder));
		}
	}

	// Setup RatingIndicator
	const dataPointAnnotation = (isDataFieldForAnnotation(oDataField) ? oDataField.Target?.$target : oDataField) as DataPointType;
	if (dataPointAnnotation?.Visualization === "UI.VisualizationType/Rating") {
		oProps.editStyle = "RatingIndicator";

		if (dataPointAnnotation.annotations?.Common?.QuickInfo) {
			oProps.ratingIndicatorTooltip = compileExpression(
				getExpressionFromAnnotation(dataPointAnnotation.annotations?.Common?.QuickInfo)
			);
		}

		oProps.ratingIndicatorTargetValue = compileExpression(getExpressionFromAnnotation(dataPointAnnotation.TargetValue));
		return;
	}

	if (
		_hasValueHelpToShow(oProperty, oProps.formatOptions?.measureDisplayMode) ||
		(oProps.formatOptions?.measureDisplayMode !== "Hidden" &&
			(oProperty.annotations?.Measures?.ISOCurrency || (oProperty.annotations?.Measures?.Unit && !hasStaticPercentUnit(oProperty))))
	) {
		if (!onlyEditStyle) {
			/* The textBindingExpression is used for mdcField-attribute 'additionalValue' and means the description of the value */
			const textBindingExpression = oProperty.annotations?.Common?.ExternalID
				? getAssociatedTextBinding(oProps.dataModelPathExternalID as DataModelObjectPath<Property>, oProps.formatOptions)
				: getAssociatedTextBinding(oDataModelPath as DataModelObjectPath<Property>, oProps.formatOptions);

			const isJSONModelUsedForValue = !!oProps.value && /{\w+>.+}/.test(oProps.value);

			if (isJSONModelUsedForValue) {
				if (oProps.description) {
					oProps.textBindingExpression = oProps.description;
				} else {
					oProps.textBindingExpression = undefined;
					oProps.formatOptions.displayMode = "Value";
				}
			} else {
				oProps.textBindingExpression = textBindingExpression;
			}

			if (oProps.formatOptions?.measureDisplayMode !== "Hidden") {
				// for the MDC Field we need to keep the unit inside the valueBindingExpression
				oProps.valueBindingExpression = oProps.value
					? oProps.value
					: getValueBinding(oDataModelPath, oProps.formatOptions, false, false, undefined, false, true);
			}
		}
		oProps.editStyle = "InputWithValueHelp";
		return;
	}

	switch (oProperty.type) {
		case "Edm.Date":
			oProps.editStyle = "DatePicker";
			const relativeLocation = getRelativePaths(oDataModelPath);
			if (oProperty?.annotations?.Validation?.Maximum) {
				oProps.maxDateExpression = getMinMaxDateExpression(oProperty?.annotations, "Maximum", relativeLocation);
			}
			if (oProperty?.annotations?.Validation?.Minimum) {
				oProps.minDateExpression = getMinMaxDateExpression(oProperty?.annotations, "Minimum", relativeLocation);
			}
			return;
		case "Edm.Time":
		case "Edm.TimeOfDay":
			oProps.editStyle = "TimePicker";
			return;
		case "Edm.DateTime":
		case "Edm.DateTimeOffset":
			oProps.editStyle = "DateTimePicker";
			// No timezone defined. Also for compatibility reasons.
			if (!oProperty.annotations?.Common?.Timezone) {
				oProps.showTimezone = undefined;
			} else {
				oProps.showTimezone = true;
			}
			return;
		case "Edm.Boolean":
			oProps.editStyle = "CheckBox";
			return;
		case "Edm.Stream":
			oProps.editStyle = "File";
			return;
		case "Edm.String":
			if (oProperty.annotations?.UI?.MultiLineText?.valueOf()) {
				oProps.editStyle = "TextArea";
				return;
			}
			if (oProperty.annotations?.UI?.InputMask?.valueOf()) {
				oProps.editStyle = "InputMask";
				oProps.mask = {
					mask: oProperty.annotations?.UI?.InputMask?.Mask.toString(),
					placeholderSymbol: oProperty.annotations?.UI?.InputMask?.PlaceholderSymbol.toString(),
					maskRule: _getMaskingRules(oProperty.annotations?.UI?.InputMask?.Rules)
				};
				return;
			}
			if (oProperty.annotations?.Common?.Masked?.valueOf()) {
				oProps.editStyle = "Masked";
				return;
			}
			break;
		default:
			if (hasStaticPercentUnit(oProperty)) {
				oProps.staticDescription = "%";
			}
			oProps.editStyle = "Input";
	}

	oProps.editStyle = "Input";
};

const _getMaskingRules = (maskingRules: InputMaskRuleTypeTypes[] | undefined): InputMaskRule[] => {
	if (!maskingRules || maskingRules.length === 0) {
		return [{ symbol: "*", regex: "[a-zA-Z0-9]" }];
	}

	return maskingRules.map((maskingRule) => ({
		symbol: maskingRule.MaskSymbol.toString(),
		regex: maskingRule.RegExp.toString()
	}));
};

export const hasSemanticObjectInNavigationOrProperty = (propertyDataModelObjectPath: DataModelObjectPath<Property>): boolean => {
	const property = propertyDataModelObjectPath.targetObject as Property;
	if (SemanticObjectHelper.hasSemanticObject(property)) {
		return true;
	}
	const lastNavProp = propertyDataModelObjectPath?.navigationProperties?.length
		? propertyDataModelObjectPath?.navigationProperties[propertyDataModelObjectPath?.navigationProperties?.length - 1]
		: null;
	if (
		!lastNavProp ||
		propertyDataModelObjectPath.contextLocation?.navigationProperties?.find(
			(contextNavProp) => contextNavProp.name === lastNavProp.name
		)
	) {
		return false;
	}
	return SemanticObjectHelper.hasSemanticObject(lastNavProp);
};

/**
 * Get the dataModelObjectPath with the value property as targetObject if it exists
 * for a dataModelObjectPath targeting a DataField or a DataPoint annotation.
 * @param initialDataModelObjectPath
 * @returns The dataModelObjectPath targetiing the value property or undefined
 */
export const getDataModelObjectPathForValue = (
	initialDataModelObjectPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>
): DataModelObjectPath<Property> | undefined => {
	if (!initialDataModelObjectPath.targetObject) {
		return undefined;
	}
	let valuePath = "";
	// data point annotations need not have $Type defined, so add it if missing
	if (isAnnotationOfTerm(initialDataModelObjectPath, UIAnnotationTerms.DataPoint)) {
		initialDataModelObjectPath.targetObject.$Type = initialDataModelObjectPath.targetObject.$Type || UIAnnotationTypes.DataPointType;
	}
	switch (initialDataModelObjectPath.targetObject.$Type) {
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataPointType:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			if (typeof initialDataModelObjectPath.targetObject.Value === "object") {
				valuePath = initialDataModelObjectPath.targetObject.Value.path;
			}
			break;
		case UIAnnotationTypes.DataFieldForAnnotation:
			if (initialDataModelObjectPath.targetObject.Target.$target) {
				if (
					isAnnotationOfType<DataField | DataPointType>(initialDataModelObjectPath.targetObject.Target.$target, [
						UIAnnotationTypes.DataPointType,
						UIAnnotationTypes.DataField
					])
				) {
					if (initialDataModelObjectPath.targetObject.Target.value.indexOf("/") > 0) {
						valuePath = initialDataModelObjectPath.targetObject.Target.value.replace(
							/\/@.*/,
							`/${initialDataModelObjectPath.targetObject.Target.$target.Value?.path}`
						);
					} else {
						valuePath = initialDataModelObjectPath.targetObject.Target.$target.Value?.path;
					}
				} else {
					valuePath = (initialDataModelObjectPath.targetObject.Target as unknown as PathAnnotationExpression<unknown>)?.path;
				}
			}
			break;
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldForActionGroup:
		case UIAnnotationTypes.DataFieldWithActionGroup:
			break;
	}

	if (valuePath && valuePath.length > 0) {
		return enhanceDataModelPath(initialDataModelObjectPath, valuePath);
	} else {
		return undefined;
	}
};

/**
 * Check if the considered property is a non-insertable property
 * A first check is done on the last navigation from the contextLocation:
 * - If the annotation 'nonInsertableProperty' is found and the property is listed, then the property is non-insertable,
 * - Else the same check is done on the target entity.
 * @param propertyDataModelObjectPath
 * @returns True if the property is not insertable
 */
export const hasPropertyInsertRestrictions = (propertyDataModelObjectPath: DataModelObjectPath<Property>): boolean => {
	const nonInsertableProperties = getContextPropertyRestriction(propertyDataModelObjectPath, (capabilities) => {
		return (capabilities as EntitySetAnnotations_Capabilities | undefined)?.InsertRestrictions?.NonInsertableProperties;
	});

	return nonInsertableProperties.some((nonInsertableProperty) => {
		return nonInsertableProperty?.$target?.fullyQualifiedName === propertyDataModelObjectPath.targetObject?.fullyQualifiedName;
	});
};

/**
 * Get the binding for the draft indicator visibility.
 * @param draftIndicatorKey
 * @returns  The visibility binding expression.
 */
export const getDraftIndicatorVisibleBinding = (draftIndicatorKey: string | undefined): string | undefined => {
	return draftIndicatorKey
		? compileExpression(
				formatResult(
					[
						constant(draftIndicatorKey),
						pathInModel("semanticKeyHasDraftIndicator", "internal"),
						pathInModel("HasDraftEntity"),
						pathInModel("IsActiveEntity"),
						pathInModel("hideDraftInfo", "pageInternal")
					],
					"sap.fe.macros.field.FieldRuntime.isDraftIndicatorVisible"
				)
		  )
		: "false";
};
/**
 * Returns the DisplayShape for the Avatar depending on the annotation IsNaturalPerson.
 *
 * If the entity type is annotated with "IsNaturalPerson", then all Streams and ImageURls
 * in this entity are considered to be person therefore have shape circle by default.
 *
 * If a property within such an entity is annotated with UI.IsImage or UI.IsImageURL, both
 * of these annotations can be annotated with Common.IsNaturalPerson.
 *
 * The annotation at the property level overrides the annotation at the entity type.
 * @param dataModelPath
 * @param property
 * @returns The shape of the Avatar as string or as an expression
 */

export const getAvatarShape = (dataFieldModelPath: DataModelObjectPath<Property>): CompiledBindingToolkitExpression => {
	const targetObject =
		dataFieldModelPath.targetObject?.annotations?.UI?.IsImageURL?.annotations?.Common?.IsNaturalPerson ||
		dataFieldModelPath.targetObject?.annotations?.UI?.IsImage?.annotations?.Common?.IsNaturalPerson;
	const entityAnnotationTarget = dataFieldModelPath.targetEntityType.annotations?.Common?.IsNaturalPerson;
	let avatarShapeExpression: ExpressionOrPrimitive<boolean>;

	if (targetObject) {
		avatarShapeExpression = getExpressionFromAnnotation(targetObject);
	} else if (entityAnnotationTarget) {
		avatarShapeExpression = getExpressionFromAnnotation(entityAnnotationTarget);
	} else avatarShapeExpression = false;

	return compileExpression(ifElse(avatarShapeExpression, AvatarShape.Circle, AvatarShape.Square));
};

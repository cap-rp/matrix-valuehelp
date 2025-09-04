import type { Action, ActionParameter, ConvertedMetadata, PathAnnotationExpression, Property } from "@sap-ux/vocabularies-types";
import type { AnnotationPath } from "@sap-ux/vocabularies-types/Edm";
import { CoreAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Core";
import type { Unit } from "@sap-ux/vocabularies-types/vocabularies/Measures";
import type {
	CollectionFacet,
	ConnectedFieldsType,
	DataField,
	DataFieldAbstractTypes,
	DataFieldForActionTypes,
	DataFieldTypes,
	DataPointType,
	DataPointTypeTypes,
	FieldGroup,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type {
	BindingToolkitExpression,
	CompiledBindingToolkitExpression,
	ComplexTypeConstraintOptions,
	Fn
} from "sap/fe/base/BindingToolkit";
import {
	EDM_TYPE_MAPPING,
	addTypeInformation,
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	ifElse,
	isConstant,
	isTruthy,
	not,
	or,
	pathInModel,
	unresolvableExpression
} from "sap/fe/base/BindingToolkit";
import { convertMetaModelContext, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { UI, bindingContextPathVisitor, singletonPathVisitor } from "sap/fe/core/helpers/BindingHelper";
import { isAnnotationOfType, isMultipleNavigationProperty, isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextRelativeTargetObjectPath,
	getRelativePaths,
	getTargetObjectPath,
	isPathUpdatable
} from "sap/fe/core/templating/DataModelPathHelper";
import * as DisplayModeFormatter from "sap/fe/core/templating/DisplayModeFormatter";
import {
	isDisabledExpression,
	isNonEditableExpression,
	isReadOnlyExpression,
	isRequiredExpression
} from "sap/fe/core/templating/FieldControlHelper";
import {
	getAssociatedCurrencyProperty,
	getAssociatedUnitProperty,
	hasStaticPercentUnit,
	hasValueHelp,
	isComputed,
	isImmutable,
	isKey,
	isMultiLineText
} from "sap/fe/core/templating/PropertyHelper";
import type FieldFormatOptions from "sap/fe/macros/field/FieldFormatOptions";
import type { DataPointFormatOptions } from "sap/fe/macros/internal/helpers/DataPointTemplating";
import type Context from "sap/ui/model/Context";

// Import-export method used by the converter to use them in the templating through the UIFormatters.
export type DisplayMode = DisplayModeFormatter.DisplayMode;

export type FieldEditStyle = "RadioButtons";

export type PropertyOrPath<P> = string | P | PathAnnotationExpression<P>;
export type MetaModelContext = {
	$kind: string;
	$Type: string;
	$Nullable?: boolean;
};

/**
 * Interface representing the structure returned by the ODataMetaModel when using the @@ operator in XML templates.
 */
export type ComputedAnnotationInterface = {
	context: Context;
	arguments?: unknown[];
	$$valueAsPromise?: boolean;
};

export type configTypeConstraints = {
	scale?: number;
	precision?: number;
	maxLength?: number;
	nullable?: boolean;
	minimum?: string;
	maximum?: string;
	isDigitSequence?: boolean;
	V4?: boolean;
};

export type configTypeformatOptions = {
	parseAsString?: boolean;
	emptyString?: string;
	parseKeepsEmptyString?: boolean;
};

export type ConfigType = {
	type: string;
	constraints: configTypeConstraints;
	formatOptions: configTypeformatOptions;
};

export type DateTimeStyle = "short" | "medium" | "long" | "full";

export type FormatOptionsDateFormat = FieldFormatOptions | DataPointFormatOptions;

export const FieldEditMode = {
	/**
	 * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
	 * is rendered in disabled mode
	 */
	Disabled: "Disabled",
	/**
	 * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
	 * is rendered in display mode
	 */
	Display: "Display",
	/**
	 * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
	 * is rendered in editable mode
	 */
	Editable: "Editable",
	/**
	 * If more than one control is rendered by the {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField }
	 * or {@link sap.ui.mdc.MultiValueField MultiValueField} control, the first part is editable, and the other
	 * parts are in display mode.
	 */
	EditableDisplay: "EditableDisplay",
	/**
	 * If more than one control is rendered by the {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField }
	 * or {@link sap.ui.mdc.MultiValueField MultiValueField} control, the first part is editable, and the other
	 * parts are read-only.
	 */
	EditableReadOnly: "EditableReadOnly",
	/**
	 * {@link sap.ui.mdc.Field Field}, {@link sap.ui.mdc.FilterField FilterField} or {@link sap.ui.mdc.MultiValueField MultiValueField }
	 * is rendered in read-only mode
	 */
	ReadOnly: "ReadOnly"
};

export const getDisplayMode = function (
	oDataModelObjectPath: DataModelObjectPath<Property | DataFieldAbstractTypes | DataPointTypeTypes>
): DisplayMode {
	return DisplayModeFormatter.getDisplayMode(oDataModelObjectPath.targetObject, oDataModelObjectPath);
};
export const getEditableExpressionAsObject = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted: Property | DataFieldAbstractTypes | DataPointTypeTypes | undefined,
	oDataModelObjectPath: DataModelObjectPath<unknown>,
	isEditable: BindingToolkitExpression<boolean> = UI.IsEditable,
	considerUpdateRestrictions = true
): BindingToolkitExpression<boolean> {
	return getEditableExpression(
		oPropertyPath,
		oDataFieldConverted,
		oDataModelObjectPath,
		true,
		isEditable,
		considerUpdateRestrictions
	) as BindingToolkitExpression<boolean>;
};

/**
 * Create the expression to generate an "editable" Boolean value.
 * @param oPropertyPath The input property
 * @param oDataFieldConverted The DataFieldConverted object to read the fieldControl annotation
 * @param oDataModelObjectPath The path to this property object
 * @param bAsObject Whether or not this should be returned as an object or a binding string
 * @param isEditable Whether or not UI.IsEditable be considered.
 * @param considerUpdateRestrictions Whether we want to take into account UpdateRestrictions to compute the editable
 * @returns The binding expression used to determine if a property is editable or not
 */
export const getEditableExpression = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted: Property | DataFieldAbstractTypes | DataPointTypeTypes | undefined = undefined,
	oDataModelObjectPath: DataModelObjectPath<unknown>,
	bAsObject = false,
	isEditable: BindingToolkitExpression<boolean> = UI.IsEditable,
	considerUpdateRestrictions = true
): CompiledBindingToolkitExpression | BindingToolkitExpression<boolean> {
	const relativePath = getRelativePaths(oDataModelObjectPath);
	if (!oPropertyPath || typeof oPropertyPath === "string") {
		return compileExpression(false);
	}
	let dataFieldEditableExpression: BindingToolkitExpression<boolean> = constant(true);
	if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
		dataFieldEditableExpression = ifElse(isNonEditableExpression(oDataFieldConverted), false, isEditable);
	} else if (oDataFieldConverted !== undefined) {
		dataFieldEditableExpression = isEditable;
	}

	const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;

	// Editability depends on the field control expression
	// If the Field control is statically in ReadOnly or Inapplicable (disabled) -> not editable
	// If the property is a key -> not editable except in creation if not computed
	// If the property is computed -> not editable
	// If the property is not updatable -> not editable
	// If the property is immutable -> not editable except in creation
	// If the Field control is a path resolving to ReadOnly or Inapplicable (disabled) (<= 1) -> not editable
	// Else, to be editable you need
	// immutable and key while in the creation row
	// ui/isEditable
	const isPathUpdatableExpression = isPathUpdatable(oDataModelObjectPath, {
		propertyPath: oPropertyPath,
		pathVisitor: (path: string, navigationPaths: string[]) =>
			singletonPathVisitor(path, oDataModelObjectPath.convertedTypes, navigationPaths)
	});
	if (compileExpression(isPathUpdatableExpression) === "false" && considerUpdateRestrictions) {
		return bAsObject ? isPathUpdatableExpression : "false";
	}
	const editableExpression =
		oProperty !== undefined
			? ifElse(
					or(
						and(not(isPathUpdatableExpression), considerUpdateRestrictions),
						isComputed(oProperty),
						isKey(oProperty),
						isImmutable(oProperty),
						isNonEditableExpression(oProperty, relativePath)
					),
					ifElse(or(isComputed(oProperty), isNonEditableExpression(oProperty, relativePath)), false, UI.IsTransientBinding),
					isEditable
			  )
			: unresolvableExpression;
	if (bAsObject) {
		return and(editableExpression, dataFieldEditableExpression);
	}
	return compileExpression(and(editableExpression, dataFieldEditableExpression));
};

export const getCollaborationExpression = function <T>(
	dataModelObjectPath: DataModelObjectPath<Property>,
	formatter: Fn<T>
): BindingToolkitExpression<T> {
	const objectPath = getTargetObjectPath(dataModelObjectPath);
	const activityExpression = pathInModel(`/collaboration/activities${objectPath}`, "internal");
	const keys = dataModelObjectPath?.contextLocation?.targetEntityType?.keys;
	const keysExpressions: BindingToolkitExpression<unknown>[] = [];
	keys?.forEach(function (key) {
		const keyExpression = pathInModel(key.name);
		keysExpressions.push(keyExpression);
	});
	return formatResult([activityExpression, ...keysExpressions], formatter);
};
export const getEnabledExpressionAsObject = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted?: Property | DataFieldAbstractTypes | DataPointTypeTypes,
	oDataModelObjectPath?: DataModelObjectPath<unknown>
): BindingToolkitExpression<boolean> {
	return getEnabledExpression(oPropertyPath, oDataFieldConverted, true, oDataModelObjectPath) as BindingToolkitExpression<boolean>;
};
/**
 * Create the expression to generate an "enabled" Boolean value.
 * @param oPropertyPath The input property
 * @param oDataFieldConverted The DataFieldConverted Object to read the fieldControl annotation
 * @param bAsObject Whether or not this should be returned as an object or a binding string
 * @param oDataModelObjectPath
 * @returns The binding expression to determine if a property is enabled or not
 */
export const getEnabledExpression = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted?: Property | DataFieldAbstractTypes | DataPointTypeTypes,
	bAsObject = false,
	oDataModelObjectPath?: DataModelObjectPath<unknown>
): CompiledBindingToolkitExpression | BindingToolkitExpression<boolean> {
	if (!oPropertyPath || typeof oPropertyPath === "string") {
		return compileExpression(true);
	}
	let relativePath;
	if (oDataModelObjectPath) {
		relativePath = getRelativePaths(oDataModelObjectPath);
	}
	let dataFieldEnabledExpression: BindingToolkitExpression<boolean> = constant(true);
	if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
		dataFieldEnabledExpression = ifElse(isDisabledExpression(oDataFieldConverted), false, true);
	}

	const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;
	// Enablement depends on the field control expression
	// If the Field control is statically in Inapplicable (disabled) -> not enabled
	const enabledExpression =
		oProperty !== undefined ? ifElse(isDisabledExpression(oProperty, relativePath), false, true) : unresolvableExpression;
	if (bAsObject) {
		return and(enabledExpression, dataFieldEnabledExpression);
	}
	return compileExpression(and(enabledExpression, dataFieldEnabledExpression));
};

/**
 * Create the expression to generate an "editMode" enum value.
 * @param propertyPath The input property
 * @param dataModelObjectPath The list of data model objects that are involved to reach that property
 * @param measureReadOnly Whether we should set UoM / currency field mode to read only
 * @param asObject Whether we should return this as an expression or as a string
 * @param dataFieldConverted The dataField object
 * @param isEditable Whether or not UI.IsEditable be considered.
 * @returns The binding expression representing the current property edit mode, compliant with the MDC Field definition of editMode.
 */
export const getEditMode = function (
	propertyPath: PropertyOrPath<Property>,
	dataModelObjectPath: DataModelObjectPath<unknown>,
	measureReadOnly = false,
	asObject = false,
	dataFieldConverted: Property | DataFieldAbstractTypes | DataPointTypeTypes | undefined = undefined,
	isEditable: BindingToolkitExpression<boolean> = UI.IsEditable
): CompiledBindingToolkitExpression | BindingToolkitExpression<string> {
	if (
		!propertyPath ||
		typeof propertyPath === "string" ||
		(!isProperty(dataFieldConverted) && dataFieldConverted?.$Type === UIAnnotationTypes.DataFieldWithNavigationPath)
	) {
		return FieldEditMode.Display;
	}
	const property = isPathAnnotationExpression(propertyPath) ? propertyPath.$target : propertyPath;
	if (!isProperty(property)) {
		return FieldEditMode.Display;
	}
	const relativePath = getRelativePaths(dataModelObjectPath);
	const isPathUpdatableExpression = isPathUpdatable(dataModelObjectPath, {
		propertyPath: property,
		pathVisitor: (path: string, navigationPaths: string[]) =>
			singletonPathVisitor(path, dataModelObjectPath.convertedTypes, navigationPaths)
	});

	// we get the editable Expression without considering update Restrictions because they are handled separately
	const editableExpression = getEditableExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath, isEditable, false);

	const enabledExpression = getEnabledExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath);
	const associatedCurrencyProperty = getAssociatedCurrencyProperty(property);
	const unitProperty = associatedCurrencyProperty || getAssociatedUnitProperty(property);
	let resultExpression: BindingToolkitExpression<string> = constant(FieldEditMode.Editable);
	if (unitProperty) {
		const isUnitReadOnly = isReadOnlyExpression(unitProperty, relativePath);
		resultExpression = ifElse(
			or(isUnitReadOnly, isComputed(unitProperty), and(isImmutable(unitProperty), not(UI.IsTransientBinding)), measureReadOnly),
			ifElse(!isConstant(isUnitReadOnly) && isUnitReadOnly, FieldEditMode.EditableReadOnly, FieldEditMode.EditableDisplay),
			FieldEditMode.Editable
		);
	}
	if (!unitProperty && (property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit)) {
		// no unit property associated means this is a static unit
		resultExpression = constant(FieldEditMode.EditableDisplay);
	}
	let readOnlyExpression;
	if (dataFieldConverted != undefined && !isProperty(dataFieldConverted)) {
		readOnlyExpression = or(isReadOnlyExpression(property, relativePath), isReadOnlyExpression(dataFieldConverted));
	} else {
		readOnlyExpression = isReadOnlyExpression(property, relativePath);
	}

	// if there are update Restrictions it is always display mode
	const editModeExpression = ifElse(
		or(isPathUpdatableExpression, UI.IsTransientBinding),
		ifElse(
			enabledExpression,
			ifElse(
				editableExpression,
				resultExpression,
				ifElse(
					and(!isConstant(readOnlyExpression) && readOnlyExpression, isEditable),
					FieldEditMode.ReadOnly,
					FieldEditMode.Display
				)
			),
			ifElse(isEditable, FieldEditMode.Disabled, FieldEditMode.Display)
		),
		FieldEditMode.Display
	);
	if (asObject) {
		return editModeExpression;
	}
	return compileExpression(editModeExpression);
};

export const hasValidAnalyticalCurrencyOrUnit = function (
	oPropertyDataModelObjectPath: DataModelObjectPath<Property> | undefined
): CompiledBindingToolkitExpression {
	const oPropertyDefinition = oPropertyDataModelObjectPath?.targetObject;
	return oPropertyDefinition && getExpressionForMeasureUnit(oPropertyDefinition);
};

export const getExpressionForMeasureUnit = function (oPropertyDefinition: Property): CompiledBindingToolkitExpression {
	const currency = oPropertyDefinition?.annotations?.Measures?.ISOCurrency;
	const measure = currency ? currency : oPropertyDefinition?.annotations?.Measures?.Unit;
	if (measure) {
		return compileExpression(or(isTruthy(getExpressionFromAnnotation(measure)), not(UI.IsTotal)));
	} else {
		return compileExpression(constant(true));
	}
};

/**
 * Create the binding expression for the fieldDisplay.
 * @param oPropertyPath
 * @param sTargetDisplayMode
 * @param oComputedEditMode
 * @returns The binding expression representing the current property display mode, compliant with the MDC Field definition of displayMode.
 */
export const getFieldDisplay = function (
	oPropertyPath: PropertyOrPath<Property>,
	sTargetDisplayMode: string,
	oComputedEditMode: BindingToolkitExpression<string>
): CompiledBindingToolkitExpression {
	const oProperty = (isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target) || (oPropertyPath as Property);
	const hasTextAnnotation = oProperty.annotations?.Common?.Text !== undefined;

	if (hasValueHelp(oProperty)) {
		return compileExpression(sTargetDisplayMode);
	} else {
		return hasTextAnnotation ? compileExpression(ifElse(equal(oComputedEditMode, "Editable"), "Value", sTargetDisplayMode)) : "Value";
	}
};

export const getTypeConfig = function (oProperty: Property | DataFieldAbstractTypes, dataType: string | undefined): ConfigType {
	const oTargetMapping = EDM_TYPE_MAPPING[(oProperty as Property)?.type] || (dataType ? EDM_TYPE_MAPPING[dataType] : undefined);
	const propertyTypeConfig: ConfigType = {
		type: oTargetMapping.type,
		constraints: {},
		formatOptions: {}
	};
	if (isProperty(oProperty)) {
		propertyTypeConfig.constraints = {
			scale: oTargetMapping.constraints?.$Scale ? oProperty.scale : undefined,
			precision: oTargetMapping.constraints?.$Precision ? oProperty.precision : undefined,
			maxLength: oTargetMapping.constraints?.$MaxLength ? oProperty.maxLength : undefined,
			nullable: oTargetMapping.constraints?.$Nullable ? oProperty.nullable : undefined,
			minimum:
				oTargetMapping.constraints?.["@Org.OData.Validation.V1.Minimum/$Decimal"] &&
				!isNaN(oProperty.annotations?.Validation?.Minimum)
					? `${oProperty.annotations?.Validation?.Minimum}`
					: undefined,
			maximum:
				oTargetMapping.constraints?.["@Org.OData.Validation.V1.Maximum/$Decimal"] &&
				!isNaN(oProperty.annotations?.Validation?.Maximum)
					? `${oProperty.annotations?.Validation?.Maximum}`
					: undefined,
			isDigitSequence:
				propertyTypeConfig.type === "sap.ui.model.odata.type.String" &&
				oTargetMapping.constraints?.["@com.sap.vocabularies.Common.v1.IsDigitSequence"] &&
				oProperty.annotations?.Common?.IsDigitSequence
					? true
					: undefined,
			V4: oTargetMapping.constraints?.$V4 ? true : undefined
		};
	}
	propertyTypeConfig.formatOptions = {
		parseAsString:
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 ||
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0
				? false
				: undefined,
		emptyString:
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 ||
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0
				? ""
				: undefined,
		parseKeepsEmptyString: propertyTypeConfig.type === "sap.ui.model.odata.type.String" ? true : undefined
	};
	return propertyTypeConfig;
};

export const getConstraintOptions = function (property: Property | undefined): ComplexTypeConstraintOptions {
	return property?.annotations?.UI?.DoNotCheckScaleOfMeasuredQuantity &&
		property?.annotations?.UI.DoNotCheckScaleOfMeasuredQuantity?.valueOf()
		? { skipDecimalsValidation: true }
		: {};
};

export const getBindingWithUnitOrCurrency = function (
	oPropertyDataModelPath: DataModelObjectPath<Property>,
	propertyBindingExpression: BindingToolkitExpression<string>,
	ignoreUnitConstraint?: boolean,
	formatOptions?: {
		showMeasure?: boolean;
		decimalPadding?: number;
	},
	forDisplayMode?: boolean,
	showOnlyUnitDecimals?: boolean
): BindingToolkitExpression<string> {
	const oPropertyDefinition = oPropertyDataModelPath.targetObject as Property;
	let unit = oPropertyDefinition.annotations?.Measures?.Unit;
	const relativeLocation = getRelativePaths(oPropertyDataModelPath);
	propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
	if (hasStaticPercentUnit(oPropertyDefinition)) {
		if (formatOptions?.showMeasure === false) {
			return propertyBindingExpression;
		}
		return formatResult([propertyBindingExpression], valueFormatters.formatWithPercentage);
	}
	const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
	unit = unit ? unit : (oPropertyDefinition.annotations?.Measures?.ISOCurrency as unknown as Unit | undefined);
	const unitBindingExpression =
		isPathAnnotationExpression(unit) && unit.$target
			? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation), ignoreUnitConstraint)
			: getExpressionFromAnnotation(unit, relativeLocation);
	let constraintOptions: ComplexTypeConstraintOptions | undefined;
	if (complexType === "sap.ui.model.odata.type.Unit") {
		if (forDisplayMode && !showOnlyUnitDecimals) {
			constraintOptions = { skipDecimalsValidation: true };
		} else if (!forDisplayMode) {
			// Consider annotation only in edit mode
			constraintOptions = getConstraintOptions(oPropertyDataModelPath.targetObject);
		}
	}

	return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions, constraintOptions);
};

/**
 * Create the binding expression for the date picker with minimum and maximum value present.
 * @param oPropertyDataModelPath The list of data model objects that are involved to reach that property
 * @param propertyBindingExpression Binding expression for the property
 * @returns The binding expression representing the date property with minimum and maximum value for the same
 */
export const getBindingForDatePicker = function (
	oPropertyDataModelPath: DataModelObjectPath<Property | DataFieldTypes>,
	propertyBindingExpression: BindingToolkitExpression<string>
): BindingToolkitExpression<string> | CompiledBindingToolkitExpression {
	const oPropertyDefinition = oPropertyDataModelPath.targetObject as Property;
	const relativeLocation = getRelativePaths(oPropertyDataModelPath);
	const formatOptions = {};
	propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
	const complexType = "sap.fe.core.type.Date";
	const minDate = oPropertyDefinition?.annotations?.Validation?.Minimum?.$Date
		? oPropertyDefinition?.annotations?.Validation?.Minimum?.$Date
		: oPropertyDefinition?.annotations?.Validation?.Minimum;
	const maxDate = oPropertyDefinition?.annotations?.Validation?.Maximum?.$Date
		? oPropertyDefinition?.annotations?.Validation?.Maximum?.$Date
		: oPropertyDefinition?.annotations?.Validation?.Maximum;
	const minExpression =
		minDate && isPathAnnotationExpression(minDate)
			? formatWithTypeInformation(
					oPropertyDefinition?.annotations?.Validation?.Minimum,
					getExpressionFromAnnotation(oPropertyDefinition?.annotations?.Validation?.Minimum, relativeLocation)
			  )
			: minDate;
	const maxExpression =
		maxDate && isPathAnnotationExpression(maxDate)
			? formatWithTypeInformation(
					oPropertyDefinition?.annotations?.Validation?.Maximum,
					getExpressionFromAnnotation(oPropertyDefinition?.annotations?.Validation?.Maximum, relativeLocation)
			  )
			: maxDate;

	return (
		(minExpression || maxExpression) &&
		addTypeInformation([propertyBindingExpression, minExpression, maxExpression], complexType, undefined, formatOptions)
	);
};

export const getBindingForUnitOrCurrency = function (
	oPropertyDataModelPath: DataModelObjectPath<Property> | undefined,
	forDisplayMode: boolean,
	showOnlyUnitDecimals: boolean
): BindingToolkitExpression<string> | string {
	const oPropertyDefinition = oPropertyDataModelPath?.targetObject;
	if (!oPropertyDefinition) {
		return "";
	}

	let unit = oPropertyDefinition.annotations?.Measures?.Unit;
	if (hasStaticPercentUnit(oPropertyDefinition)) {
		return constant("%");
	}
	const relativeLocation = getRelativePaths(oPropertyDataModelPath);

	const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
	unit = unit ? unit : (oPropertyDefinition.annotations?.Measures?.ISOCurrency as unknown as Unit | undefined);
	const unitBindingExpression =
		isPathAnnotationExpression(unit) && unit.$target
			? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation))
			: getExpressionFromAnnotation(unit, relativeLocation);

	let propertyBindingExpression = pathInModel(
		getContextRelativeTargetObjectPath(oPropertyDataModelPath)
	) as BindingToolkitExpression<string>;
	propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression, true);
	let constraintOptions: ComplexTypeConstraintOptions | undefined;
	if (complexType === "sap.ui.model.odata.type.Unit") {
		if (forDisplayMode && !showOnlyUnitDecimals) {
			constraintOptions = { skipDecimalsValidation: true };
		} else if (!forDisplayMode) {
			constraintOptions = getConstraintOptions(oPropertyDefinition);
		}
	}
	return addTypeInformation(
		[propertyBindingExpression, unitBindingExpression],
		complexType,
		undefined,
		{
			parseKeepsEmptyString: true,
			showNumber: false
		},
		constraintOptions
	);
};
export const getBindingWithTimezone = function (
	oPropertyDataModelPath: DataModelObjectPath<Property>,
	propertyBindingExpression: BindingToolkitExpression<string>,
	ignoreUnitConstraint = false,
	hideTimezoneForEmptyValues = false,
	fieldFormatOptions?: FieldFormatOptions
): BindingToolkitExpression<string> {
	const oPropertyDefinition = oPropertyDataModelPath.targetObject as Property;
	const timezone = oPropertyDefinition.annotations?.Common?.Timezone;
	const style = oPropertyDefinition.annotations?.UI?.DateTimeStyle;
	const relativeLocation = getRelativePaths(oPropertyDataModelPath);
	propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);

	const complexType = "sap.fe.core.type.DateTimeWithTimezone";
	const unitBindingExpression =
		isPathAnnotationExpression(timezone) && timezone.$target
			? formatWithTypeInformation(
					(timezone as PathAnnotationExpression<unknown>).$target as Property,
					getExpressionFromAnnotation(timezone, relativeLocation),
					ignoreUnitConstraint
			  )
			: getExpressionFromAnnotation(timezone, relativeLocation);
	let formatOptions = {};
	if (hideTimezoneForEmptyValues) {
		formatOptions = {
			showTimezoneForEmptyValues: false
		};
	}
	// if style or pattern is also set
	if (style) {
		formatOptions = { ...formatOptions, ...{ style: style } };
	} else if (fieldFormatOptions?.dateTimeStyle !== undefined) {
		formatOptions = { ...formatOptions, ...{ style: fieldFormatOptions.dateTimeStyle } };
	}

	if (fieldFormatOptions?.dateTimePattern !== undefined) {
		formatOptions = { ...formatOptions, ...{ pattern: fieldFormatOptions.dateTimePattern } };
	}

	if (fieldFormatOptions?.showTime !== undefined) {
		formatOptions = { ...formatOptions, ...{ showTime: fieldFormatOptions.showTime } };
	}
	if (fieldFormatOptions?.showDate !== undefined) {
		formatOptions = { ...formatOptions, ...{ showDate: fieldFormatOptions.showDate } };
	}
	if (fieldFormatOptions?.showTimezone !== undefined) {
		formatOptions = { ...formatOptions, ...{ showTimezone: fieldFormatOptions.showTimezone } };
	}

	return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions);
};

/**
 * Creates the binding expression for the date format of a date, time or dateTime.
 * @param propertyDataModelPath The list of data model objects that are involved to reach that property
 * @param propertyBindingExpression Binding expression for the property
 * @param formatOptionsDateFormat Format options which contain the style or pattern property
 * @returns The binding expression representing a date, time, or date-time, with the given pattern or style property
 */
export const getBindingForDateFormat = function (
	propertyDataModelPath: DataModelObjectPath<Property>,
	propertyBindingExpression: BindingToolkitExpression<string>,
	formatOptionsDateFormat?: FormatOptionsDateFormat
): BindingToolkitExpression<string> {
	const oPropertyDefinition = propertyDataModelPath.targetObject as Property;
	const pattern = formatOptionsDateFormat?.dateTimePattern;
	const style = oPropertyDefinition.annotations?.UI?.DateTimeStyle ?? formatOptionsDateFormat?.dateTimeStyle;
	propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
	propertyBindingExpression.type = EDM_TYPE_MAPPING[oPropertyDefinition.type].type;
	propertyBindingExpression.formatOptions = {
		...(style && { style: style.toString() }),
		...(pattern && { pattern: pattern })
	};

	return propertyBindingExpression;
};

export const getBindingForTimezone = function (
	propertyDataModelPath: DataModelObjectPath<Property>,
	propertyBindingExpression: BindingToolkitExpression<string>
): BindingToolkitExpression<string> {
	const propertyDefinition = propertyDataModelPath.targetObject as Property;
	propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
	propertyBindingExpression.type = "any";
	const complexType = "sap.ui.model.odata.type.DateTimeWithTimezone";
	const formatOptions = { showTime: false, showDate: false, showTimezone: true };

	// null is required by formatter when there is just a timezone
	return addTypeInformation([null, propertyBindingExpression], complexType, undefined, formatOptions);
};

export const getAlignmentExpression = function (
	oComputedEditMode: BindingToolkitExpression<string>,
	sAlignDisplay = "Begin",
	sAlignEdit = "Begin"
): CompiledBindingToolkitExpression {
	return compileExpression(ifElse(equal(oComputedEditMode, "Display"), sAlignDisplay, sAlignEdit));
};

/**
 * Formatter helper to retrieve the converterContext from the metamodel context.
 * @param oContext The original metamodel context
 * @param oInterface The current templating context
 * @returns The ConverterContext representing that object
 */
export const getConverterContext = function (oContext: MetaModelContext, oInterface: ComputedAnnotationInterface): object | null {
	if (oInterface && oInterface.context) {
		return convertMetaModelContext(oInterface.context) as object;
	}
	return null;
};
getConverterContext.requiresIContext = true;

/**
 * Formatter helper to retrieve the data model objects that are involved from the metamodel context.
 * @param oContext The original ODataMetaModel context
 * @param oInterface The current templating context
 * @returns An array of entitysets and navproperties that are involved to get to a specific object in the metamodel
 */
export const getDataModelObjectPath = function <T>(
	oContext: MetaModelContext,
	oInterface: ComputedAnnotationInterface
): DataModelObjectPath<T> | null {
	if (oInterface && oInterface.context) {
		return getInvolvedDataModelObjects(oInterface.context);
	}
	return null;
};
getDataModelObjectPath.requiresIContext = true;

/**
 * Checks if the referenced property is part of a 1..n navigation.
 * @param oDataModelPath The data model path to check
 * @returns True if the property is part of a 1..n navigation
 */
export const isMultiValueField = function (oDataModelPath: DataModelObjectPath<unknown>): boolean {
	if (oDataModelPath.navigationProperties?.length) {
		const hasOneToManyNavigation =
			oDataModelPath?.navigationProperties.findIndex((oNav) => {
				if (isMultipleNavigationProperty(oNav)) {
					if (oDataModelPath.contextLocation?.navigationProperties?.length) {
						//we check the one to many nav is not already part of the context
						return (
							oDataModelPath.contextLocation?.navigationProperties.findIndex(
								(oContextNav) => oContextNav.name === oNav.name
							) === -1
						);
					}
					return true;
				}
				return false;
			}) > -1;
		if (hasOneToManyNavigation) {
			return true;
		}
	}
	return false;
};
export const getRequiredExpressionAsObject = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted?: Property | DataFieldAbstractTypes | DataPointTypeTypes,
	forceEditMode = false
): BindingToolkitExpression<boolean> {
	return getRequiredExpression(oPropertyPath, oDataFieldConverted, forceEditMode, true) as BindingToolkitExpression<boolean>;
};
export const getRequiredExpression = function (
	oPropertyPath: PropertyOrPath<Property>,
	oDataFieldConverted?: Property | DataFieldAbstractTypes | DataPointTypeTypes,
	forceEditMode = false,
	bAsObject = false,
	oRequiredProperties: {
		requiredPropertiesFromInsertRestrictions?: unknown[];
		requiredPropertiesFromUpdateRestrictions?: unknown[];
	} = {},
	dataModelObjectPath?: DataModelObjectPath<unknown>
): CompiledBindingToolkitExpression | BindingToolkitExpression<boolean> {
	const aRequiredPropertiesFromInsertRestrictions = oRequiredProperties.requiredPropertiesFromInsertRestrictions;
	const aRequiredPropertiesFromUpdateRestrictions = oRequiredProperties.requiredPropertiesFromUpdateRestrictions;
	if (!oPropertyPath || typeof oPropertyPath === "string") {
		if (bAsObject) {
			return constant(false);
		}
		return compileExpression(constant(false));
	}
	let relativePath;
	if (dataModelObjectPath) {
		relativePath = getRelativePaths(dataModelObjectPath);
	}
	let dataFieldRequiredExpression: BindingToolkitExpression<boolean> = constant(false);
	if (oDataFieldConverted !== undefined && !isProperty(oDataFieldConverted)) {
		// For the datafield expression we should not  consider the relative path
		dataFieldRequiredExpression = isRequiredExpression(oDataFieldConverted);
	}
	let requiredPropertyFromInsertRestrictionsExpression: BindingToolkitExpression<boolean> = constant(false);
	let requiredPropertyFromUpdateRestrictionsExpression: BindingToolkitExpression<boolean> = constant(false);

	const oProperty: Property = (isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target) || (oPropertyPath as Property);
	// Enablement depends on the field control expression
	// If the Field control is statically in Inapplicable (disabled) -> not enabled
	const requiredExpression = isRequiredExpression(oProperty, relativePath);
	const editMode = forceEditMode || UI.IsEditable;
	if (aRequiredPropertiesFromInsertRestrictions?.includes(oProperty.name)) {
		requiredPropertyFromInsertRestrictionsExpression = UI.IsCreateMode;
	}
	if (aRequiredPropertiesFromUpdateRestrictions?.includes(oProperty.name)) {
		requiredPropertyFromUpdateRestrictionsExpression = and(UI.IsEditable, not(UI.IsCreateMode));
	}
	const returnExpression = or(
		and(or(requiredExpression, dataFieldRequiredExpression), editMode),
		requiredPropertyFromInsertRestrictionsExpression,
		requiredPropertyFromUpdateRestrictionsExpression
	);
	if (bAsObject) {
		return returnExpression;
	}
	return compileExpression(returnExpression);
};

export const getRequiredExpressionForConnectedDataField = function (
	dataFieldObjectPath: DataModelObjectPath<AnnotationPath<ConnectedFieldsType>>
): CompiledBindingToolkitExpression {
	const data: Record<string, DataFieldAbstractTypes> = (dataFieldObjectPath?.targetObject?.$target?.Data ?? {}) as Record<
		string,
		DataFieldAbstractTypes
	>;
	const keys: Array<string> = Object.keys(data);
	const dataFields = [];
	let propertyPath;
	const isRequiredExpressions: (CompiledBindingToolkitExpression | BindingToolkitExpression<boolean>)[] | undefined = [];
	for (const key of keys) {
		if (data[key]?.["$Type"] && data[key]["$Type"]?.includes("DataField")) {
			dataFields.push(data[key]);
		}
	}
	for (const dataField of dataFields) {
		switch (dataField.$Type) {
			case UIAnnotationTypes.DataField:
			case UIAnnotationTypes.DataFieldWithNavigationPath:
			case UIAnnotationTypes.DataFieldWithUrl:
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldWithAction:
				if (typeof dataField.Value === "object") {
					propertyPath = dataField.Value.$target;
				}
				break;
			case UIAnnotationTypes.DataFieldForAnnotation:
				if (dataField.Target?.$target) {
					if (
						isAnnotationOfType<DataField | DataPointType>(dataField.Target.$target, [
							UIAnnotationTypes.DataField,
							UIAnnotationTypes.DataPointType
						])
					) {
						if (typeof dataField.Target.$target.Value === "object") {
							propertyPath = dataField.Target.$target.Value.$target;
						}
					} else {
						if (typeof dataField.Target === "object") {
							propertyPath = dataField.Target.$target;
						}
						break;
					}
				}
				break;
			default:
				break;
			// no default
		}
		isRequiredExpressions.push(getRequiredExpressionAsObject(propertyPath, dataField, false));
	}
	return compileExpression(or(...(isRequiredExpressions as BindingToolkitExpression<boolean>[])));
};

/**
 * Check if header facet or action is visible.
 * @param targetObject Header facets or Actions
 * @returns BindingToolkitExpression<boolean>
 */
export function isVisible(
	targetObject:
		| DataFieldAbstractTypes
		| DataPointTypeTypes
		| ReferenceFacet
		| CollectionFacet
		| DataFieldForActionTypes
		| FieldGroup
		| Property
		| undefined,
	navigationProperties?: string[]
): BindingToolkitExpression<boolean> {
	return not(equal(getExpressionFromAnnotation(targetObject?.annotations?.UI?.Hidden, navigationProperties), true));
}

/**
 * Checks whether action parameter is supports multi line input.
 * @param dataModelObjectPath Object path to the action parameter.
 * @returns Boolean
 */
export const isMultiLine = function (dataModelObjectPath: DataModelObjectPath<ActionParameter>): boolean {
	return isMultiLineText(dataModelObjectPath.targetObject);
};

/**
 * Check if the action is enabled.
 * @param actionTarget Action
 * @param convertedTypes ConvertedMetadata
 * @param dataModelObjectPath DataModelObjectPath
 * @param pathFromContextLocation Boolean
 * @returns BindingToolkitExpression
 */
export function getActionEnabledExpression(
	actionTarget: Action,
	convertedTypes: ConvertedMetadata,
	dataModelObjectPath?: DataModelObjectPath<PageContextPathTarget>,
	pathFromContextLocation?: boolean
): BindingToolkitExpression<boolean> {
	const operationAvailableIsAnnotated =
		actionTarget.annotations.Core?.OperationAvailable?.term === CoreAnnotationTerms.OperationAvailable;

	if (!operationAvailableIsAnnotated) {
		// OperationAvailable term doesn't exist for the action
		return constant(true);
	}

	let prefix = "";
	if (
		dataModelObjectPath &&
		pathFromContextLocation &&
		pathFromContextLocation === true &&
		dataModelObjectPath.contextLocation?.targetEntityType &&
		dataModelObjectPath.contextLocation.targetEntityType !== actionTarget.sourceEntityType
	) {
		const navigations = getRelativePaths(dataModelObjectPath);
		let sourceActionDataModelObject = enhanceDataModelPath(dataModelObjectPath.contextLocation);
		//Start from contextLocation and navigate until the source entityType of the action to get the right prefix
		for (const nav of navigations) {
			sourceActionDataModelObject = enhanceDataModelPath(sourceActionDataModelObject, nav);
			if (sourceActionDataModelObject.targetEntityType === actionTarget.sourceEntityType) {
				prefix = `${getRelativePaths(sourceActionDataModelObject).join("/")}/`;
				break;
			}
		}
	}
	const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
	const operationAvailableExpression = getExpressionFromAnnotation(
		actionTarget.annotations.Core?.OperationAvailable,
		[],
		undefined,
		(path: string) => `${prefix}${bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName)}`
	);

	return equal(operationAvailableExpression, true);
}

/**
 * Generates the expression to check if the quickView facet is visible.
 * @param facetModelPath
 * @returns BindingToolkitExpression The binding expression of the visibility
 */
export function isQuickViewFacetVisible(facetModelPath: DataModelObjectPath<ReferenceFacet>): CompiledBindingToolkitExpression {
	let targetVisible: BindingToolkitExpression<boolean> = constant(true);
	if (isAnnotationOfType<FieldGroup>(facetModelPath.targetObject?.Target?.$target, UIAnnotationTypes.FieldGroupType)) {
		targetVisible = isVisible(facetModelPath.targetObject?.Target?.$target);
	}
	return compileExpression(and(isVisible(facetModelPath.targetObject), targetVisible));
}

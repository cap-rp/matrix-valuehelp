import type { PathAnnotationExpression, PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import type { DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression, PathInModelExpression } from "sap/fe/base/BindingToolkit";
import {
	EDM_TYPE_MAPPING,
	compileExpression,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	isPathInModelExpression,
	pathInModel,
	unresolvableExpression
} from "sap/fe/base/BindingToolkit";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { hasStaticPercentUnit } from "sap/fe/core/templating/PropertyHelper";
import type { DateTimeStyle } from "sap/fe/core/templating/UIFormatters";
import {
	getBindingForDateFormat,
	getBindingForTimezone,
	getBindingWithTimezone,
	getBindingWithUnitOrCurrency,
	getDisplayMode
} from "sap/fe/core/templating/UIFormatters";
import Library from "sap/ui/core/Lib";
import type Context from "sap/ui/model/Context";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";

const typesSupportingNumberOfFractionalDigits = ["Edm.Single", "Edm.Double", "Edm.Decimal"];

export type DataPointFormatOptions = Partial<{
	measureDisplayMode: string;
	displayMode: string;
	dateTimeStyle: DateTimeStyle;
	dateTimePattern: string;
	showOnlyUnitDecimals: boolean;
}>;

/**
 * Gets the target value of a progress indicator.
 * A progress indicator can have a static target, a percentage, or another property.
 * @param oDataModelPath The DataModelObjectPath
 * @param relativeLocation The relative location, to take into account the navigation properties
 * @returns The expression binding of the target value
 */
const getDataPointTargetExpression = (
	oDataModelPath: DataPointType | undefined,
	relativeLocation: string[]
): BindingToolkitExpression<string> => {
	return oDataModelPath?.TargetValue ? getExpressionFromAnnotation(oDataModelPath.TargetValue, relativeLocation) : unresolvableExpression;
};

const oResourceModel = Library.getResourceBundleFor("sap.fe.macros")!;

/**
 * This gets the binding expression for the value of the progress indicator.
 * @param oPropertyDataModelObjectPath The DataModelObjectPath
 * @returns The binding expression for the progress indicator value.
 */
export const buildExpressionForProgressIndicatorDisplayValue = (
	oPropertyDataModelObjectPath: DataModelObjectPath<DataPointType>
): CompiledBindingToolkitExpression => {
	const fieldValue = oPropertyDataModelObjectPath?.targetObject?.Value || "";
	const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
	const fieldValueExpression: BindingToolkitExpression<PrimitiveType> = getExpressionFromAnnotation(fieldValue, relativeLocation);
	const targetExpression: BindingToolkitExpression<string> = getDataPointTargetExpression(
		oPropertyDataModelObjectPath.targetObject,
		relativeLocation
	);

	if (fieldValueExpression && targetExpression) {
		let targetObject = oPropertyDataModelObjectPath.targetObject?.Value;
		if (!isProperty(targetObject)) {
			targetObject = targetObject.$target;
		}
		const unit = targetObject.annotations?.Measures?.Unit || targetObject.annotations?.Measures?.ISOCurrency;

		if (!unit) {
			return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [
				compileExpression(fieldValueExpression),
				compileExpression(targetExpression)
			]);
		}
		// If the unit isn't a path, we check for a % sign as it is a special case.
		if (hasStaticPercentUnit(fieldValue?.$target)) {
			return `${compileExpression(fieldValueExpression)} %`;
		}

		const unitBindingExpression: BindingToolkitExpression<string> = unit.$target
			? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation))
			: getExpressionFromAnnotation(unit, relativeLocation);

		const isCurrency = targetObject.annotations?.Measures?.ISOCurrency ? true : false;
		let requestCustomUnits;
		if (isCurrency) {
			requestCustomUnits = pathInModel("/##@@requestCurrencyCodes");
		} else {
			requestCustomUnits = pathInModel("/##@@requestUnitsOfMeasure");
		}
		requestCustomUnits.targetType = "any";
		requestCustomUnits.mode = "OneTime";

		return compileExpression(
			formatResult(
				[fieldValueExpression, targetExpression, unitBindingExpression, isCurrency, requestCustomUnits],
				valueFormatters.formatProgressIndicatorText
			)
		);
	}
	return undefined;
};

const buildRatingIndicatorSubtitleExpression = (oContext: Context, mSampleSize: unknown): string | undefined => {
	if (mSampleSize) {
		return formatRatingIndicatorSubTitle(AnnotationHelper.value(mSampleSize, { context: oContext }) as unknown as number);
	}
};
// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
const formatRatingIndicatorSubTitle = (iSampleSizeValue: number): string | undefined => {
	if (iSampleSizeValue) {
		const sSubTitleLabel =
			iSampleSizeValue > 1
				? oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL_PLURAL")
				: oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL");
		return oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE", [String(iSampleSizeValue), sSubTitleLabel]);
	}
};

/**
 * This function is used to get the header text of rating indicator.
 * @param oContext Context of interface
 * @param oDataPoint Data point object
 * @returns Expression binding for rating indicator text
 */
export const getHeaderRatingIndicatorText = (oContext: Context, oDataPoint: DataPointType | undefined): string | undefined => {
	let result: string | undefined;
	if (oDataPoint && oDataPoint.SampleSize) {
		result = buildRatingIndicatorSubtitleExpression(oContext, oDataPoint.SampleSize);
	} else if (oDataPoint && oDataPoint.Description) {
		const sModelValue = AnnotationHelper.value(oDataPoint.Description, { context: oContext });
		result = "${path:" + sModelValue + "}";
	}
	return result;
};
getHeaderRatingIndicatorText.requiresIContext = true;

const buildExpressionForDescription = (fieldValue: DataModelObjectPath<Property>): BindingToolkitExpression<string> | undefined => {
	const relativeLocation = getRelativePaths(fieldValue);
	if (fieldValue?.targetObject?.annotations?.Common?.Text) {
		const oTextExpression = getExpressionFromAnnotation(fieldValue?.targetObject.annotations?.Common?.Text, relativeLocation);
		if (isPathInModelExpression(oTextExpression)) {
			oTextExpression.parameters = { $$noPatch: true };
		}
		return oTextExpression;
	}
	return undefined;
};

const getFloatFormat = (
	outExpression: PathInModelExpression<string>,
	numberOfFractionalDigits: Number | undefined
): BindingToolkitExpression<string> => {
	// numberOfFractionalDigits is only defined in getValueFormatted when NumberOfFractionalDigits is defined.
	// In that case, we need to instance the preserveDecimals parameter because of a change MDC side
	if (numberOfFractionalDigits) {
		if (!outExpression.formatOptions) {
			outExpression.formatOptions = {};
		}
		outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
			preserveDecimals: false,
			maxFractionDigits: numberOfFractionalDigits
		});
	}
	return outExpression;
};

export const getValueFormatted = (
	oPropertyDataModelPath: DataModelObjectPath<Property> | undefined,
	fieldValue: PathAnnotationExpression<string> | undefined,
	sPropertyType: string,
	sNumberOfFractionalDigits: Number | undefined
): BindingToolkitExpression<string> => {
	let outExpression: BindingToolkitExpression<string>;
	const relativeLocation = !fieldValue?.path?.includes("/") ? getRelativePaths(oPropertyDataModelPath) : [];
	outExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
	const oPropertyDefinition = oPropertyDataModelPath?.targetObject;
	if (oPropertyDefinition && sPropertyType && isPathInModelExpression(outExpression)) {
		formatWithTypeInformation(oPropertyDefinition, outExpression);
		outExpression.type = EDM_TYPE_MAPPING[sPropertyType]?.type;
		if (typesSupportingNumberOfFractionalDigits.includes(sPropertyType)) {
			// for the listReport, the decimal/single/double fields are formatted by returning a string
			// for the facets of the OP, the decimal/single/double fields are formatted by returning a promise, so we manage all the cases
			outExpression = getFloatFormat(outExpression, sNumberOfFractionalDigits);
		}
	}

	return outExpression;
};

export const buildFieldBindingExpression = (
	oDataModelPath: DataModelObjectPath<DataPointType>,
	dataPointFormatOptions: DataPointFormatOptions,
	bHideMeasure: boolean
): CompiledBindingToolkitExpression => {
	const oDataPoint = oDataModelPath.targetObject;
	const oDataPointValue = oDataPoint?.Value || "";
	const propertyType = oDataPointValue?.$target?.type;
	let numberOfFractionalDigits;

	if (typesSupportingNumberOfFractionalDigits.includes(propertyType) && oDataPoint?.ValueFormat) {
		if (oDataPoint.ValueFormat.NumberOfFractionalDigits) {
			numberOfFractionalDigits = oDataPoint.ValueFormat.NumberOfFractionalDigits;
		}
	}
	const oPropertyDataModelObjectPath = enhanceDataModelPath<Property>(oDataModelPath, oDataPointValue.path);
	const oDescription = oPropertyDataModelObjectPath ? buildExpressionForDescription(oPropertyDataModelObjectPath) : undefined;
	const oFormattedValue = getValueFormatted(oPropertyDataModelObjectPath, oDataPointValue, propertyType, numberOfFractionalDigits);
	const sDisplayMode = oDescription ? dataPointFormatOptions?.displayMode || getDisplayMode(oPropertyDataModelObjectPath) : "Value";
	let oBindingExpression: BindingToolkitExpression<string> | undefined;
	switch (sDisplayMode) {
		case "Description":
			oBindingExpression = oDescription;
			break;
		case "ValueDescription":
			oBindingExpression = formatResult([oFormattedValue, oDescription], valueFormatters.formatWithBrackets);
			break;
		case "DescriptionValue":
			oBindingExpression = formatResult([oDescription, oFormattedValue], valueFormatters.formatWithBrackets);
			break;
		default:
			if (
				oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.Timezone &&
				oPropertyDataModelObjectPath.targetObject.type === "Edm.DateTimeOffset"
			) {
				oBindingExpression = getBindingWithTimezone(oPropertyDataModelObjectPath, oFormattedValue);
			} else if (oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.IsTimezone) {
				oBindingExpression = getBindingForTimezone(oPropertyDataModelObjectPath, oFormattedValue);
			} else if (
				oPropertyDataModelObjectPath.targetObject?.annotations?.UI?.DateTimeStyle ||
				dataPointFormatOptions?.dateTimePattern
			) {
				oBindingExpression = getBindingForDateFormat(oPropertyDataModelObjectPath, oFormattedValue, dataPointFormatOptions);
			} else {
				oBindingExpression = _computeBindingWithUnitOrCurrency(
					oPropertyDataModelObjectPath,
					oFormattedValue,
					bHideMeasure || dataPointFormatOptions?.measureDisplayMode === "Hidden",
					!!dataPointFormatOptions?.showOnlyUnitDecimals
				);
			}
	}
	return compileExpression(oBindingExpression);
};

export const _computeBindingWithUnitOrCurrency = (
	propertyDataModelObjectPath: DataModelObjectPath<Property>,
	formattedValue: BindingToolkitExpression<string>,
	hideMeasure: boolean,
	showOnlyUnitDecimals: boolean
): BindingToolkitExpression<string> => {
	if (
		propertyDataModelObjectPath.targetObject?.annotations?.Measures?.Unit ||
		propertyDataModelObjectPath.targetObject?.annotations?.Measures?.ISOCurrency
	) {
		if (hideMeasure && hasStaticPercentUnit(propertyDataModelObjectPath.targetObject)) {
			return formattedValue;
		}
		return getBindingWithUnitOrCurrency(
			propertyDataModelObjectPath,
			formattedValue,
			undefined,
			hideMeasure ? { showMeasure: false } : undefined,
			true,
			showOnlyUnitDecimals
		);
	}
	return formattedValue;
};

/**
 * Method to calculate the percentage value of Progress Indicator. Basic formula is Value/Target * 100.
 * @param oPropertyDataModelObjectPath
 * @returns The expression binding used to calculate the percentage value, which is shown in the progress indicator based on the formula given above.
 */
export const buildExpressionForProgressIndicatorPercentValue = (
	oPropertyDataModelObjectPath: DataModelObjectPath<DataPointType>
): string | undefined => {
	const fieldValue = (oPropertyDataModelObjectPath?.targetObject?.Value as PathAnnotationExpression<PrimitiveType>) || "";
	const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
	const fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
	const targetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject, relativeLocation);

	const oPropertyDefinition = fieldValue.$target as Property;
	const unit = oPropertyDefinition.annotations?.Measures?.Unit || oPropertyDefinition.annotations?.Measures?.ISOCurrency;
	if (unit) {
		const unitBindingExpression = getExpressionFromAnnotation(unit, relativeLocation);

		return compileExpression(
			formatResult([fieldValueExpression, targetExpression, unitBindingExpression], valueFormatters.computePercentage)
		);
	}

	return compileExpression(formatResult([fieldValueExpression, targetExpression, ""], valueFormatters.computePercentage));
};

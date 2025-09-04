import Log from "sap/base/Log";
import whitespaceReplacer from "sap/base/strings/whitespaceReplacer";
import ObjectPath from "sap/base/util/ObjectPath";
import { getReachableSemanticObjectsSettings } from "sap/fe/core/templating/SemanticObjectHelper";
import IconPool from "sap/ui/core/IconPool";
import Library from "sap/ui/core/Lib";
import UI5Date from "sap/ui/core/date/UI5Date";
import DateFormat from "sap/ui/core/format/DateFormat";
import NumberFormat from "sap/ui/core/format/NumberFormat";

const calendarPatternMap: { [key: string]: RegExp } = {
	yyyy: /[1-9]\d{3,}|0\d{3}/,
	Q: /[1-4]/,
	MM: /0[1-9]|1[0-2]/,
	ww: /0[1-9]|[1-4]\d|5[0-3]/,
	yyyyMMdd: /(?:[1-9]\d{3}|0\d{3})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/,
	yyyyMM: /(?:[1-9]\d{3}|0\d{3})(0[1-9]|1[0-2])/,
	"yyyy-MM-dd": /(?:[1-9]\d{3}|0\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/
};

/**
 * Collection of table formatters.
 * @param this The context
 * @param sName The inner function name
 * @param oArgs The inner function parameters
 * @returns The value from the inner function
 */
const valueFormatters = function (this: object, sName: string, ...oArgs: unknown[]): unknown {
	if (valueFormatters.hasOwnProperty(sName)) {
		return (valueFormatters as unknown as Record<string, Function>)[sName].apply(this, oArgs);
	} else {
		return "";
	}
};

const formatWithBrackets = (firstPart?: string, secondPart?: string): string => {
	if (firstPart && secondPart) {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
		return resourceBundle.getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [firstPart, secondPart]);
	} else {
		return firstPart || secondPart || "";
	}
};
formatWithBrackets.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithBrackets";

const formatStringDimension = (value: unknown, pattern: string, propertyPath: string): number => {
	if (pattern in calendarPatternMap) {
		const matchedValue = value?.toString().match(calendarPatternMap[pattern]);
		if (matchedValue && matchedValue?.length) {
			const date = matchedValue[0];
			const value1 = DateFormat.getDateInstance({ pattern }).parse(date, false, true);
			if (value1 instanceof Date) {
				return value1.getTime();
			} else {
				Log.warning("Date value could not be determined for " + propertyPath);
			}
			return 0;
		}
	}
	Log.warning("Pattern not supported for " + propertyPath);
	return 0;
};
formatStringDimension.__functionName = "sap.fe.core.formatters.ValueFormatter#formatStringDimension";

const formatTitle = (firstPart?: string, secondPart?: string): string => {
	return secondPart ? formatWithBrackets(whitespaceReplacer(firstPart), whitespaceReplacer(secondPart)) : whitespaceReplacer(firstPart);
};
formatTitle.__functionName = "sap.fe.core.formatters.ValueFormatter#formatTitle";

const formatWithPercentage = (sValue?: string): string => {
	return sValue !== null && sValue !== undefined ? `${sValue} %` : "";
};
formatWithPercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithPercentage";

const computePercentage = (value: string | number, target: string | number, sUnit?: string): string | undefined => {
	let sPercentString: string;
	//BCP: 2370008548 If the base value is undefined return "0" by default
	if (value === undefined) {
		return "0";
	}

	const iValue: number = typeof value === "string" ? parseFloat(value) : value;
	const iTarget: number = typeof target === "string" ? parseFloat(target) : target;

	if (sUnit === "%") {
		if (iValue > 100) {
			sPercentString = "100";
		} else if (iValue <= 0) {
			sPercentString = "0";
		} else {
			sPercentString = typeof value === "string" ? value : value?.toString();
		}
	} else if (iValue > iTarget) {
		sPercentString = "100";
	} else if (iValue <= 0) {
		sPercentString = "0";
	} else {
		sPercentString = iValue && iTarget ? ((iValue / iTarget) * 100).toString() : "0";
	}
	return sPercentString;
};
computePercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#computePercentage";

export const formatCriticalityValueState = (val?: string | number): string | undefined => {
	let sValueState: string;
	if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
		sValueState = "Error";
	} else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
		sValueState = "Warning";
	} else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
		sValueState = "Success";
	} else if (val === "UI.CriticalityType/Information" || val === "5" || val === 5) {
		sValueState = "Information";
	} else {
		sValueState = "None";
	}
	return sValueState;
};
formatCriticalityValueState.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityValueState";

export const formatCriticalityButtonType = (val?: string | number): string | undefined => {
	let sType: string;
	if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
		sType = "Reject";
	} else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
		sType = "Accept";
	} else {
		sType = "Default";
	}
	return sType;
};
formatCriticalityButtonType.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityButtonType";

export const formatCriticalityColorMicroChart = (val?: string | number): string | undefined => {
	let sColor: string;
	if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
		sColor = "Error";
	} else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
		sColor = "Critical";
	} else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
		sColor = "Good";
	} else {
		sColor = "Neutral";
	}
	return sColor;
};
formatCriticalityColorMicroChart.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityColorMicroChart";

/**
 * Formats the text to be displayed in the progress indicator. Takes into account the decimals and precision of the unit.
 * @param value The current value of the progress indicator
 * @param target The target value fo the progress indicator
 * @param unit The unit of the progress indicator
 * @param isCurrency Whether we have a currency or a uom
 * @param customUnits An object containing the custom units of the application
 * @param customUnits.customCurrencies
 * @param customUnits.showMeasure
 * @returns The translated and formatted text of the progress indicator
 */
export const formatProgressIndicatorText = (
	value: string | number,
	target: string | number,
	unit: string,
	isCurrency: boolean,
	customUnits?: Record<string, object>
): string | undefined => {
	if (value && target && unit) {
		const unitSplit = unit.split("-");
		const searchUnit = `${unitSplit[1] === undefined ? unit : unitSplit[1]}-narrow`;
		const dateFormat = DateFormat.getDateInstance();
		const localeData = (
			dateFormat as DateFormat & {
				oLocaleData: {
					mData: {
						units?: { short: Record<string, { displayName?: string }> };
						dateFields: Record<string, { displayName?: string }>;
					};
				};
			}
		).oLocaleData.mData;
		const oResourceModel = Library.getResourceBundleFor("sap.fe.macros")!;
		let unitDisplayed = unit;
		if (localeData?.dateFields[searchUnit]?.displayName) {
			unitDisplayed = localeData.dateFields[searchUnit].displayName!;
		} else if (localeData?.units?.short[unit]?.displayName) {
			unitDisplayed = localeData.units.short[unit].displayName!;
		}

		let formatter;
		if (isCurrency) {
			formatter = NumberFormat.getCurrencyInstance({
				customCurrencies: customUnits,
				showMeasure: false
			});
		} else {
			formatter = NumberFormat.getUnitInstance({
				customUnits: customUnits,
				showMeasure: false
			});
		}
		const displayValue = formatter.format(+value, unitDisplayed);
		const displayTarget = formatter.format(+target, unitDisplayed);

		return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_WITH_UOM", [displayValue, displayTarget, unitDisplayed]);
	}
};
formatProgressIndicatorText.__functionName = "sap.fe.core.formatters.ValueFormatter#formatProgressIndicatorText";

/**
 * Formats the text by replacing each character with a *.
 * @param value The current text entered in the field.
 * @returns A string of * characters equal to the length of the entered value.
 */
export const formatPasswordText = (value: string | undefined): string | undefined => {
	if (value?.length) {
		return "*".repeat(value.length);
	}
	return undefined;
};
formatPasswordText.__functionName = "sap.fe.core.formatters.ValueFormatter#formatPasswordText";

export const formatToKeepWhitespace = (value: string | boolean | number): string => {
	return value === null || value === undefined ? "" : whitespaceReplacer(value + "");
};
formatToKeepWhitespace.__functionName = "sap.fe.core.formatters.ValueFormatter#formatToKeepWhitespace";

function provideDateInstance(value: string | number | Date): Date | null {
	if (value) {
		const isDateValid = new Date(value);
		if (!isNaN(Date.parse(isDateValid as unknown as string))) {
			return UI5Date.getInstance(value);
		} else {
			Log.warning("Warning: Valid date format has to be sent to retrieve UI5 date instance");
		}
	}
	return null;
}
provideDateInstance.__functionName = "sap.fe.core.formatters.ValueFormatter#provideDateInstance";

/**
 * Format the semantic objects available to user.
 * @param semanticObjects The semantic objects from shell services and the dynamic semantic objects resolved
 * @returns True if the user has semantic objects to navigate
 */
export const hasSemanticObjects = function (...semanticObjects: unknown[]): boolean | undefined {
	const currentUserSemanticObjectsList = semanticObjects[0];
	const dynamicSemanticObjectsResolved: string[] = [];
	for (let i = 1; i < semanticObjects.length; i++) {
		if (semanticObjects[i]) {
			dynamicSemanticObjectsResolved.push(semanticObjects[i] as string);
		}
	}
	if (dynamicSemanticObjectsResolved.length > 0) {
		return getReachableSemanticObjectsSettings(currentUserSemanticObjectsList as string[], {
			semanticObjectsList: dynamicSemanticObjectsResolved,
			semanticObjectsExpressionList: [],
			qualifierMap: {}
		}).hasReachableStaticSemanticObject;
	}
	return undefined;
};
hasSemanticObjects.__functionName = "sap.fe.core.formatters.ValueFormatter#hasSemanticObjects";
export const replaceWhitespace = function (value: string): string {
	return whitespaceReplacer(value);
};
replaceWhitespace.__functionName = "sap.fe.core.formatters.ValueFormatter#replaceWhitespace";

const getIconForMimeType = function (mimeType: string): string {
	return IconPool.getIconForMimeType(mimeType);
};
getIconForMimeType.__functionName = "sap.fe.core.formatters.StandardFormatter#getIconForMimeType";

valueFormatters.hasSemanticObjects = hasSemanticObjects;
valueFormatters.formatWithBrackets = formatWithBrackets;
valueFormatters.formatTitle = formatTitle;
valueFormatters.provideDateInstance = provideDateInstance;
valueFormatters.formatWithPercentage = formatWithPercentage;
valueFormatters.computePercentage = computePercentage;
valueFormatters.formatCriticalityValueState = formatCriticalityValueState;
valueFormatters.formatCriticalityButtonType = formatCriticalityButtonType;
valueFormatters.formatCriticalityColorMicroChart = formatCriticalityColorMicroChart;
valueFormatters.formatProgressIndicatorText = formatProgressIndicatorText;
valueFormatters.formatPasswordText = formatPasswordText;
valueFormatters.formatToKeepWhitespace = formatToKeepWhitespace;
valueFormatters.formatStringDimension = formatStringDimension;
valueFormatters.getIconForMimeType = getIconForMimeType;
valueFormatters.replaceWhitespace = replaceWhitespace;

ObjectPath.set("sap.fe.core.formatters.ValueFormatter", valueFormatters);

export default valueFormatters;

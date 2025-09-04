import type { PrimitiveType } from "@sap-ux/vocabularies-types/Edm";
import deepEqual from "sap/base/util/deepEqual";
import Lib from "sap/ui/core/Lib";
import DateFormat from "sap/ui/core/format/DateFormat";
import FilterOperator from "sap/ui/model/FilterOperator";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import type { EasyFilterResult, PropertyMetadata } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type {
	BetweenSelectedValues,
	CodeListType,
	EasyFilterPropertyMetadata,
	TokenDefinition,
	TokenSelectedValuesDefinition,
	TokenType,
	ValueHelpBetweenSelectedValues,
	ValueHelpSelectedValuesDefinition
} from "./EasyFilterBarContainer";

type codeListType = PropertyMetadata["codeList"];
type finalCodeListType = { value: PrimitiveType; description?: string }[];
const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
const dateTimeOffset = new DateTimeOffset();

function areItemsSame(
	arr1: readonly TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[],
	arr2: readonly TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[]
): boolean {
	if (arr1.length !== arr2.length) {
		return false;
	}
	// Compare elements of both arrays
	for (let i = 0; i < arr1.length; i++) {
		if (
			arr1[i].operator !== arr2[i].operator ||
			!arr1[i].selectedValues.every(
				(value, index) =>
					value === arr2[i].selectedValues[index] ||
					(typeof value === "object" &&
						deepEqual((value as CodeListType).value, (arr2[i].selectedValues[index] as CodeListType).value) &&
						(value as CodeListType).description === (arr2[i].selectedValues[index] as CodeListType).description)
			)
		) {
			return false;
		}
	}
	return true; // Arrays are the same
}

function areArraySame(arr1: readonly unknown[], arr2: readonly unknown[]): boolean {
	if (arr1.length !== arr2.length) {
		return false;
	}
	// Compare elements of both arrays
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}
	return true; // Arrays are the same
}

async function areCodeListsSame(arr1: codeListType, arr2: codeListType): Promise<boolean> {
	const arrNew1: finalCodeListType | undefined = await getCodeListArray(arr1);
	const arrNew2: finalCodeListType | undefined = await getCodeListArray(arr2);
	const descriptionNew1 = arrNew1?.map((data) => data.description);
	const descriptionNew2 = arrNew2?.map((data) => data.description);

	const value1 = arrNew1?.map((data) => data.value);
	const value2 = arrNew2?.map((data) => data.value);
	if (!descriptionNew1 || !descriptionNew2) {
		return false;
	}
	return areArraySame(descriptionNew1, descriptionNew2) && areArraySame(value1 as PrimitiveType, value2 as PrimitiveType);
}

async function getCodeListArray(arr: codeListType): Promise<finalCodeListType | undefined> {
	if (typeof arr === "function") {
		return arr();
	}
	return arr;
}

function convertDateToString(value: Date, tokenType: TokenType, isDateTimeOffset: boolean): string {
	let formattedDateTime = "";
	if (isDateTimeOffset) {
		return dateTimeOffset.formatValue(value, "string") as string;
	}
	switch (tokenType) {
		case "Calendar":
			formattedDateTime = DateFormat.getDateInstance().format(value);
			break;
		case "Time":
			formattedDateTime = DateFormat.getTimeInstance().format(value);
			break;
		default:
			break;
	}
	return formattedDateTime;
}

/**
 * Create a string representation of the operator and value.
 * @param operator The operator to represent
 * @param value The value to represent
 * @param tokenType The token's type
 * @param isDateTimeOffset Checks if the data type is of DateTimeOffset
 * @returns The string representation of the operator and value
 */
function mapOperator(
	operator: FilterOperator,
	value: string | number | boolean | Date,
	tokenType: TokenType,
	isDateTimeOffset: boolean
): string {
	let newValue: number | string = "";
	if (typeof value === "boolean") {
		newValue = convertBoolToString(value);
	} else if (value instanceof Date) {
		newValue = convertDateToString(value, tokenType, isDateTimeOffset);
	} else {
		newValue = value;
	}

	switch (operator) {
		case FilterOperator.GT:
			return `> ${newValue}`;
		case FilterOperator.LT:
			return `< ${newValue}`;
		case FilterOperator.GE:
			return `>= ${newValue}`;
		case FilterOperator.LE:
			return `<= ${newValue}`;
		case FilterOperator.EQ:
			return `${newValue}`;
		case FilterOperator.Contains:
			return `*${newValue}*`;
		case FilterOperator.EndsWith:
			return `*${newValue}`;
		case FilterOperator.StartsWith:
			return `${newValue}*`;
		case FilterOperator.NE:
			return `!=(${newValue})`;
		case FilterOperator.NotContains:
			return `!(*${newValue}*)`;
		case FilterOperator.NotEndsWith:
			return `!(*${newValue})`;
		case FilterOperator.NotStartsWith:
			return `!(${newValue}*)`;
		default:
			return newValue?.toString();
	}
}

function mapOperatorForValueHelp(operator: FilterOperator, value: CodeListType, tokenType: TokenType, isDateTimeOffset: boolean): string {
	return mapOperator(operator, value.description, tokenType, isDateTimeOffset);
}

function mapOperatorForBetweenOperator(
	operator: FilterOperator,
	values: BetweenSelectedValues | ValueHelpBetweenSelectedValues,
	tokenType: TokenType,
	isDateTimeOffset: boolean
): string {
	let newValue1: string | number | Date = "";
	let newValue2: string | number | Date = "";
	if (typeof values[0] === "boolean") {
		newValue1 = convertBoolToString(values[0]);
	} else if (values[0] instanceof Date) {
		newValue1 = convertDateToString(values[0], tokenType, isDateTimeOffset);
	} else if (typeof values[0] === "object") {
		newValue1 = values[0].description as string;
	} else {
		newValue1 = values[0];
	}

	if (typeof values[1] === "boolean") {
		newValue2 = convertBoolToString(values[1]);
	} else if (values[1] instanceof Date) {
		newValue2 = convertDateToString(values[1], tokenType, isDateTimeOffset);
	} else if (typeof values[0] === "object") {
		newValue2 = values[1].description as string;
	} else {
		newValue2 = values[1];
	}
	if (operator === FilterOperator.BT) {
		return `${newValue1}...${newValue2}`;
	} else {
		return `!(${newValue1}...${newValue2})`;
	}
}

function isBetweenSelectedValues(operator: FilterOperator): boolean {
	return operator === FilterOperator.BT || operator === FilterOperator.NB;
}

function convertBoolToString(value: boolean): string {
	return value
		? resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_TRUE")
		: resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_FALSE");
}

function formatData(
	tokens: TokenDefinition[],
	filterValues: EasyFilterResult["filter"],
	filterBarMetadata: EasyFilterPropertyMetadata[]
): void {
	if (filterValues) {
		const visitedMapForMandatoryTokens: Record<string, boolean> = {};
		for (const filterValue of filterValues) {
			const filterCriteria = filterBarMetadata.find((field) => field.name === filterValue.name);
			if (filterCriteria) {
				const { type } = filterCriteria;
				const tokenIndex = tokens.findIndex((token) => token.key === filterValue.name);
				const { operator, values } = filterValue;
				let keySpecificSelectedValues: TokenSelectedValuesDefinition;
				if (EasyFilterUtils.isBetweenSelectedValues(operator)) {
					keySpecificSelectedValues = {
						operator,
						selectedValues: values as BetweenSelectedValues
					};
				} else {
					keySpecificSelectedValues = {
						operator: operator as Exclude<FilterOperator, FilterOperator.BT | FilterOperator.NB>,
						selectedValues: values as string[] | Date[] | number[] | boolean[]
					};
				}
				if (tokenIndex === -1) {
					// Add new token if it doesn't exist
					const newToken: TokenDefinition = {
						key: filterValue.name,
						label: filterCriteria.label as string,
						keySpecificSelectedValues: [keySpecificSelectedValues],
						type: type as Exclude<TokenType, "ValueHelp">,
						busy: type === "ValueHelp" ? true : false
					};
					tokens.push(newToken);
				} else {
					// Update existing token
					const currentToken = tokens[tokenIndex];
					//If its default value , override it
					if ((currentToken.isRequired ?? false) && !visitedMapForMandatoryTokens[currentToken.key]) {
						currentToken.keySpecificSelectedValues = [keySpecificSelectedValues];
						visitedMapForMandatoryTokens[currentToken.key] = true;
					} else {
						(currentToken.keySpecificSelectedValues as TokenSelectedValuesDefinition[]).push(keySpecificSelectedValues);
					}
				}
			}
		}
	}
}

const EasyFilterUtils = {
	areItemsSame,
	areCodeListsSame,
	getCodeListArray,
	areArraySame,
	mapOperator,
	mapOperatorForBetweenOperator,
	isBetweenSelectedValues,
	formatData,
	mapOperatorForValueHelp
};

export default EasyFilterUtils;

import { defineUI5Class } from "sap/fe/base/ClassSupport";
import Value from "sap/fe/macros/filter/type/Value";
import { type CustomFilterOperatorInfo } from "sap/ui/core/Manifest";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";

/**
 * Handle format/parse of multi value filters.
 */
@defineUI5Class("sap.fe.macros.filter.type.MultiValue")
export default class MultiValue extends Value {
	/**
	 * Custom Operator Info.
	 * @param operatorName The binding operator name
	 * @returns Custom operator info
	 */
	public getOperatorConfig(operatorName: string): CustomFilterOperatorInfo {
		return {
			name: operatorName,
			multiValue: true
		};
	}

	/**
	 * Returns the string value parsed to the external value type.
	 * @param internalValue The internal string value to be formatted
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The formatted value
	 * @protected
	 */
	formatValue(internalValue: unknown | undefined, externalValueType: string | undefined): string[] {
		let result = internalValue;

		if (typeof result === "string") {
			result = result.split(",");
		}

		if (Array.isArray(result)) {
			result = result
				.map((value: string) => super.formatValue(value, this.getElementTypeName(externalValueType)))
				.filter((value: unknown) => value !== undefined);
		}

		return (result || []) as string[];
	}

	/**
	 * Returns the value parsed to the internal string value.
	 * @param externalValue The value to be parsed
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The parsed value
	 * @protected
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	parseValue(externalValue: unknown[] | undefined, externalValueType: string | undefined): ConditionObject | string[] {
		if (!externalValue) {
			externalValue = [];
		}

		const values = super.externalToString(externalValue as string[], externalValueType) as string[];

		if (super.hasCustomOperator()) {
			// Returning the ConditionObject through CustomFilterFieldContentWrapper
			return {
				operator: this.operator.name,
				values: [values],
				validated: undefined
			} as ConditionObject;
		}

		return externalValue.map((value: unknown) => {
			if (value === undefined) {
				value = [];
			} else if (!Array.isArray(value)) {
				value = [value];
			}
			return this.operator.format({ values: value } as ConditionObject);
		});
	}
}

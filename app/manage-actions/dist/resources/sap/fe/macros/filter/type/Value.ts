import Log from "sap/base/Log";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import FilterOperatorUtils from "sap/fe/macros/filter/FilterOperatorUtils";
import { type CustomFilterOperatorInfo } from "sap/ui/core/Manifest";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import FilterOperatorUtil from "sap/ui/mdc/condition/FilterOperatorUtil";
import type Operator from "sap/ui/mdc/condition/Operator";
import FieldDisplay from "sap/ui/mdc/enums/FieldDisplay";
import SimpleType from "sap/ui/model/SimpleType";
import BooleanType from "sap/ui/model/type/Boolean";
import DateType from "sap/ui/model/type/Date";
import FloatType from "sap/ui/model/type/Float";
import IntegerType from "sap/ui/model/type/Integer";
import StringType from "sap/ui/model/type/String";
/**
 * Handle format/parse of single value filter.
 */
@defineUI5Class("sap.fe.macros.filter.type.Value")
export default class Value extends SimpleType {
	private static readonly INTERNAL_VALUE_TYPE = "string";

	private static readonly OPERATOR_VALUE_TYPE_STATIC = "static";

	public operator: Operator;

	/**
	 * Creates a new value type instance with the given parameters.
	 * @param formatOptions Format options for this value type
	 * @param formatOptions.operator The name of a (possibly custom) operator to use
	 * @param constraints Constraints for this value type
	 * @protected
	 */
	constructor(formatOptions: { operator?: string }, constraints: object) {
		super(formatOptions, constraints);
		const operatorName = formatOptions?.operator || this.getDefaultOperatorName();
		const operator = FilterOperatorUtil.getOperator(operatorName);
		this.operator = operator!;
		if (this.operator === undefined && operatorName.includes(".")) {
			const operatorConfig = this.getOperatorConfig(operatorName);
			this.registerCustomOperator(operatorConfig);
		}
	}

	/**
	 * Custom Operator Info.
	 * @param operatorName The binding operator name
	 * @returns Custom operator info
	 * @private
	 */
	public getOperatorConfig(operatorName: string): CustomFilterOperatorInfo {
		return {
			name: operatorName
		};
	}

	/**
	 * Registers a custom binding operator.
	 * @param operatorConfig The operator info
	 * @private
	 */
	public registerCustomOperator(operatorConfig: CustomFilterOperatorInfo): void {
		FilterOperatorUtils.registerCustomOperators([operatorConfig])
			.then((operators) => {
				if (operators[0]) {
					this.operator = operators[0];
				} else {
					Log.error(`Failed to register operator: ${operatorConfig.name}`);
				}
				return;
			})
			.catch((error: unknown) => {
				Log.error(`Failed to register operator: ${operatorConfig.name}`, error as Error | string);
			});
	}

	/**
	 * Returns whether the specified operator is a multi-value operator.
	 * @param operator The binding operator
	 * @returns `true`, if multi-value operator (`false` otherwise)
	 * @private
	 */
	private _isMultiValueOperator(operator: Operator): boolean {
		return (
			operator.valueTypes.filter(function (valueType: string) {
				return !!valueType && valueType !== Value.OPERATOR_VALUE_TYPE_STATIC;
			}).length > 1
		);
	}

	/**
	 * Returns whether the specified operator is a custom operator.
	 * @returns `true`, if custom operator (`false` otherwise)
	 * @private
	 */
	public hasCustomOperator(): boolean {
		return this.operator.name.includes(".");
	}

	/**
	 * Parses the internal string value to the external value of type 'externalValueType'.
	 * @param value The internal string value to be parsed
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The parsed value
	 * @private
	 */
	private _stringToExternal(value: string | string[], externalValueType: string | undefined): string[] {
		let externalValue;
		const externalType = this._getTypeInstance(externalValueType);

		if (externalValueType && Value._isArrayType(externalValueType)) {
			if (!Array.isArray(value)) {
				value = [value];
			}
			externalValue = value.map((valueElement: string) => {
				return externalType ? externalType.parseValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
			});
		} else {
			externalValue = externalType ? externalType.parseValue(value as string, Value.INTERNAL_VALUE_TYPE) : value;
		}

		return externalValue;
	}

	/**
	 * Returns whether target type is an array.
	 * @param targetType The target type name
	 * @returns `true`, if array type (`false` otherwise)
	 * @private
	 */
	private static _isArrayType(targetType: string): boolean {
		if (!targetType) {
			return false;
		}
		return targetType === "array" || targetType.endsWith("[]");
	}

	/**
	 * Returns the external value formatted as the internal string value.
	 * @param externalValue The value to be parsed
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The formatted value
	 * @private
	 */
	public externalToString(externalValue: string | string[], externalValueType: string | undefined): string | string[] {
		let value;
		const externalType = this._getTypeInstance(externalValueType);

		if (externalValueType && Value._isArrayType(externalValueType)) {
			if (!Array.isArray(externalValue)) {
				externalValue = [externalValue];
			}
			value = externalValue.map((valueElement: string) => {
				return externalType ? externalType.formatValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
			});
		} else {
			value = externalType ? externalType.formatValue(externalValue as string, Value.INTERNAL_VALUE_TYPE) : externalValue;
		}

		return value;
	}

	/**
	 * Retrieves the default type instance for given type name.
	 * @param typeName The name of the type
	 * @returns The type instance
	 * @private
	 */
	private _getTypeInstance(typeName: string | undefined): SimpleType {
		typeName = this.getElementTypeName(typeName) || typeName;

		switch (typeName) {
			case "string":
				return new StringType();
			case "number":
			case "int":
			case "integer":
				return new IntegerType();
			case "float":
				return new FloatType();
			case "date":
				return new DateType();
			case "boolean":
				return new BooleanType();
			default:
				Log.error("Unexpected filter type");
				throw new Error("Unexpected filter type");
		}
	}

	/**
	 * Returns the default operator name ("EQ").
	 * Should be overridden on demand.
	 * @returns The default operator name
	 * @protected
	 */
	getDefaultOperatorName(): string {
		return FilterOperatorUtil.getEQOperator().name;
	}

	/**
	 * Returns the element type name.
	 * @param typeName The actual type name
	 * @returns The type of its elements
	 * @protected
	 */
	getElementTypeName(typeName: string | undefined): string | undefined {
		if (typeName?.endsWith("[]")) {
			return typeName.substring(0, typeName.length - 2);
		}
		return undefined;
	}

	/**
	 * Returns the string value parsed to the external value type 'this.operator'.
	 * @param internalValue The internal string value to be formatted
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The formatted value
	 * @protected
	 */
	formatValue(internalValue: unknown | undefined, externalValueType: string | undefined): unknown {
		if (!internalValue) {
			return undefined;
		}
		const isMultiValueOperator = this._isMultiValueOperator(this.operator),
			internalType = this._getTypeInstance(Value.INTERNAL_VALUE_TYPE);

		//  from internal model string with operator
		const values = this.operator.parse((internalValue as string) || "", internalType, FieldDisplay.Value, false);
		const value = !isMultiValueOperator && Array.isArray(values) ? values[0] : values;

		return this._stringToExternal(value, externalValueType); // The value bound to a custom filter
	}

	/**
	 * Returns the value parsed to the internal string value.
	 * @param externalValue The value to be parsed
	 * @param externalValueType The external value type, e.g. int, float[], string, etc.
	 * @returns The parsed value
	 * @protected
	 */
	parseValue(externalValue: unknown | undefined, externalValueType: string | undefined): unknown {
		if (!externalValue) {
			return undefined;
		}
		const isMultiValueOperator = this._isMultiValueOperator(this.operator),
			externalType = this._getTypeInstance(externalValueType);

		const value = this.externalToString(externalValue as string, externalValueType);

		// Format to internal model string with operator
		const values = isMultiValueOperator ? value : [value];

		if (this.hasCustomOperator()) {
			// Return a complex object while parsing the bound value in sap.ui.model.PropertyBinding.js#_externalToRaw()
			return {
				operator: this.operator.name,
				values: [this.operator.format({ values: values } as ConditionObject, externalType)],
				validated: undefined
			};
		}
		// Return a simple string value to be stored in the internal 'filterValues' model
		return this.operator.format({ values: values } as ConditionObject, externalType);
	}

	/**
	 * Validates whether the given value in model representation is valid.
	 * @param externalValue The value to be validated
	 * @protected
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	validateValue(externalValue: unknown): void {
		/* Do Nothing */
	}
}

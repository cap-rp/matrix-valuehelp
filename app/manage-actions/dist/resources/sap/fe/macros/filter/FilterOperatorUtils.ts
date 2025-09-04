import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import { requireDependencies } from "sap/fe/core/helpers/LoaderUtils";
import { type CustomFilterOperatorInfo } from "sap/ui/core/Manifest";
import { type ConditionObject } from "sap/ui/mdc/condition/Condition";
import FilterOperatorUtil from "sap/ui/mdc/condition/FilterOperatorUtil";
import Operator from "sap/ui/mdc/condition/Operator";
import type FieldDisplay from "sap/ui/mdc/enums/FieldDisplay";
import OperatorValueType from "sap/ui/mdc/enums/OperatorValueType";
import type Filter from "sap/ui/model/Filter";
import type Type from "sap/ui/model/Type";

export type FilterFunction = (value: string | string[]) => Filter;
export type CustomOperatorModule = Record<string, FilterFunction>;

const FilterOperatorUtils = {
	/**
	 * Process all custom operators to be created that are referenced in the application manifest.
	 * @param appComponent AppComponent
	 * @returns Promise that resolves on creating and adding the operator to MDC environment
	 */
	async processCustomFilterOperators(appComponent: AppComponent): Promise<void> {
		const sapFeConfig = appComponent.getManifestEntry("sap.fe");
		const { customFilterOperators } = sapFeConfig?.macros?.filter || {};
		if (customFilterOperators) {
			await FilterOperatorUtils.registerCustomOperators(customFilterOperators);
		}
	},

	/**
	 * Register custom operators.
	 * @param customFilterOperators Custom operator info
	 * @returns Promise that resolves to an array of operators
	 */
	async registerCustomOperators(customFilterOperators: CustomFilterOperatorInfo[]): Promise<Operator[]> {
		const modelFilterNames = customFilterOperators.map((customFilterOperatorInfo) => customFilterOperatorInfo.name);
		const customOperatorHandlerFileNames = modelFilterNames.map((opName: string) =>
			opName.substring(0, opName.lastIndexOf(".")).replace(/\./g, "/")
		);
		const customOperatorModules = (await requireDependencies(customOperatorHandlerFileNames)) as CustomOperatorModule[];

		const operators = customFilterOperators.reduce(
			(accOperators: Operator[], customFilterOperatorInfo: CustomFilterOperatorInfo, currentIndex: number) => {
				const module = customOperatorModules?.[currentIndex];
				const { name, multiValue } = customFilterOperatorInfo;
				if (module) {
					const operator = FilterOperatorUtils.createSingleCustomOperator(name, module, multiValue ?? false);
					if (operator) {
						accOperators.push(operator);
					}
				} else {
					Log.error(`Failed to load custom operator module: ${customOperatorHandlerFileNames[currentIndex]}`);
				}
				return accOperators;
			},
			[] as Operator[]
		);
		FilterOperatorUtil.addOperators(operators);
		return operators;
	},

	/**
	 * Create custom operator.
	 * @param operatorName The binding operator name
	 * @param customOperatorModule Custom operator module
	 * @param multiValue Custom operator expected to work with multiple values
	 * @returns Operator
	 */
	createSingleCustomOperator(
		operatorName: string,
		customOperatorModule: CustomOperatorModule,
		multiValue: boolean
	): Operator | undefined {
		const methodName = operatorName.substring(operatorName.lastIndexOf(".") + 1);
		if (customOperatorModule?.[methodName]) {
			return new Operator({
				filterOperator: "",
				tokenFormat: "",
				name: operatorName,
				valueTypes: [OperatorValueType.Self],
				tokenParse: "^(.*)$",
				format: (value: ConditionObject): string | string[] => {
					return FilterOperatorUtils.formatConditionValues(value.values, multiValue);
				},
				parse: function (text: ConditionObject, type: Type, displayFormat: FieldDisplay, defaultOperator: boolean): unknown {
					if (typeof text === "object") {
						if (text.operator !== operatorName) {
							throw Error("not matching operator");
						}
						return text.values;
					}
					return Operator.prototype.parse.apply(this, [text, type, displayFormat, defaultOperator]);
				},
				getModelFilter: (condition: ConditionObject): Filter => {
					const formatedValues = FilterOperatorUtils.getValuesForModelFilter(condition.values, multiValue);
					return customOperatorModule[methodName].call(customOperatorModule, formatedValues);
				}
			});
		} else {
			Log.error(`Failed to create custom operator: model filter function ${operatorName} not found`);
		}
	},

	/**
	 * Values for model filter.
	 * @param values Input condition values
	 * @param multiValue Custom operator expected to work with multiple values
	 * @returns Unchanged input condition value
	 */
	getValuesForModelFilter(values: string[] | string, multiValue: boolean): string[] | string {
		if (multiValue) {
			const result = values[0];
			return (typeof result === "string" ? result.split(",") : result) || [];
		}
		return Array.isArray(values) && values.length ? values[0] : (values as string);
	},

	/**
	 * Condition values for format.
	 * @param values Input condition value
	 * @param multiValue
	 * @returns Input condition value
	 */
	formatConditionValues(
		values: ConditionObject["values"] | ConditionObject["values"][0],
		multiValue = false
	): ConditionObject["values"] | ConditionObject["values"][0] {
		if (values && Array.isArray(values) && values.length > 0) {
			return multiValue ? values : values[0];
		}
		return values;
	}
};

export default FilterOperatorUtils;

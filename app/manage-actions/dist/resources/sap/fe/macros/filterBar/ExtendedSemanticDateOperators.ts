import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import { DYNAMIC_DATE_CATEGORY, getFixedDateSingleValueOperations } from "sap/fe/macros/filterBar/DefaultSemanticDateOperators";
import Library from "sap/ui/core/Lib";
import type UniversalDate from "sap/ui/core/date/UniversalDate";
import FilterOperatorUtil from "sap/ui/mdc/condition/FilterOperatorUtil";
import RangeOperator, { type Configuration } from "sap/ui/mdc/condition/RangeOperator";
import OperatorValueType from "sap/ui/mdc/enums/OperatorValueType";
import type { default as FilterOperator } from "sap/ui/model/FilterOperator";
import { default as ModelOperator } from "sap/ui/model/FilterOperator";

/**
 * Single value date operators with ranges.
 * We shall use these single value date operator and combine with "FROM" and "TO" operators.
 * The resultant operator is expected to be a range operator. Hence we would need the ranges.
 * Like:
 * {
 * 	<operator name>: {
 * 		key: <identifier>,
 * 		fnRanges: <API to get the range>
 * 	},
 * 	<more operators>...
 * }
 */
const operatorsToExtend = getFixedDateSingleValueOperations();

// Single Value date operators: Like "TODAY", "TOMORROW", "LASTDAYYEAR", etc.
type SingleValueDateOperatorName = keyof typeof operatorsToExtend;
const singleValueDateOperatorNames = Object.keys(operatorsToExtend) as SingleValueDateOperatorName[];

const FROM_OP = "FROM";
const TO_OP = "TO";
type ExtendedFROMOperatorName = `${typeof FROM_OP}${SingleValueDateOperatorName}`;
type ExtendedTOOperatorsName = `${typeof TO_OP}${SingleValueDateOperatorName}`;

/**
 * Operations info to identify which operators the user wants to support.
 * Like:
 * {
 * 	<operator name>: {
 * 		key: <identifier>,
 * 		category: <type of operator>
 * 	},
 * 	<more operators>...
 * }
 */
type Operation = {
	key: string;
	category: string;
};
type ExtendedOperation = Operation & {
	primitiveOperator: SingleValueDateOperatorName;
};
const extendedFromOperators: Record<ExtendedFROMOperatorName, ExtendedOperation> = singleValueDateOperatorNames.reduce(
	(operations, singleDateOperatorKey) => {
		operations[`${FROM_OP}${singleDateOperatorKey}`] = {
			key: `${FROM_OP}${singleDateOperatorKey}`,
			category: DYNAMIC_DATE_CATEGORY,
			primitiveOperator: singleDateOperatorKey
		};
		return operations;
	},
	{} as Record<ExtendedFROMOperatorName, ExtendedOperation>
);
const extendedToOperators: Record<ExtendedTOOperatorsName, ExtendedOperation> = singleValueDateOperatorNames.reduce(
	(operations, singleDateOperatorKey) => {
		operations[`${TO_OP}${singleDateOperatorKey}`] = {
			key: `${TO_OP}${singleDateOperatorKey}`,
			category: DYNAMIC_DATE_CATEGORY,
			primitiveOperator: singleDateOperatorKey
		};
		return operations;
	},
	{} as Record<ExtendedTOOperatorsName, ExtendedOperation>
);

// Extend Operators like "FROMTODAY", "TOTODAY", "FROMYESTERDAY", etc.
const extendedOperators = { ...extendedFromOperators, ...extendedToOperators };
export type ExtendedOperatorName = ExtendedFROMOperatorName | ExtendedTOOperatorsName;
const extendedOperatorNames = Object.keys(extendedOperators) as ExtendedOperatorName[];

/**
 * Check if the operator is a FROM extended operator like "FROMTODAY", "FROMTOMORROW".
 * @param operatorName Operator name to check
 * @returns Boolean. If 'from' extended operator.
 */
function isFromExtendedOperator(operatorName: string): operatorName is ExtendedFROMOperatorName {
	return Object.keys(extendedFromOperators).includes(operatorName);
}

/**
 * Check if the operator is a TO extended operator like "TOTODAY", "TOTOMORROW".
 * @param operatorName Operator name to check
 * @returns Boolean. If 'to' extended operator.
 */
function isToExtendedOperator(operatorName: string): operatorName is ExtendedTOOperatorsName {
	return Object.keys(extendedToOperators).includes(operatorName);
}

/**
 * Get extended operator by combining "FROM" and "TO" operations with single value dates.
 * @param operatorName Operator name
 * @param resourceBundle Resource to collect translated texts for the operators to be shown in UI.
 * @returns RangeOperator
 */
function getExtendedOperator(operatorName: ExtendedOperatorName, resourceBundle: ResourceBundle): RangeOperator {
	const { primitiveOperator } = extendedOperators[operatorName];
	const filterOperator = ExtendedSemanticDateOperators.getFilterOperator(operatorName) as ModelOperator.GE | ModelOperator.LE;
	const tokenTextKey = `M_EXTENDED_OPERATOR_${operatorName}_TOKEN_TEXT`;
	return ExtendedSemanticDateOperators.createRangeOperator({
		name: operatorName,
		longText: resourceBundle.getText(tokenTextKey, []),
		tokenText: `${resourceBundle.getText(tokenTextKey, [])} ({0})`,
		valueTypes: [OperatorValueType.Static],
		filterOperator,
		group: { id: 3, text: resourceBundle.getText(`M_EXTENDED_OPERATOR_GRP_TEXT`, []) },
		calcRange: function (): UniversalDate[] {
			const [fromPick, toPick] = operatorsToExtend[primitiveOperator].fnRanges();
			return [isFromExtendedOperator(operatorName) ? fromPick : toPick];
		}
	});
}

const ExtendedSemanticDateOperators = {
	/**
	 * Creation of RangeOperator from configuration.
	 * @param config Range Operator configurations
	 * @returns Range Operator
	 */
	createRangeOperator(config: Configuration): RangeOperator {
		return new RangeOperator({ ...config });
	},

	/**
	 * Operators Info to help decide which operations the user wants to enable.
	 * @returns Operators Info
	 */
	getOperatorsInfo(): Record<ExtendedFROMOperatorName, ExtendedOperation> {
		return extendedOperators;
	},

	/**
	 * Extended Semantic Date operations that can be used.
	 * @returns Extended Operator names
	 */
	getSemanticDateOperations(): string[] {
		return [...extendedOperatorNames];
	},

	/**
	 * Get the single date operator used to create the extended operator.
	 * @param operatorName Extended operator name
	 * @returns Single date operator name
	 */
	getCorrespondingSingleDateOperator(operatorName: ExtendedOperatorName): SingleValueDateOperatorName {
		const { primitiveOperator } = extendedOperators[operatorName];
		return primitiveOperator;
	},

	/**
	 * Checks if it is an extended operator.
	 * @param operatorName Operator name to check
	 * @returns Extended Operator names
	 */
	isExtendedOperator(operatorName: string): operatorName is ExtendedOperatorName {
		return (extendedOperatorNames as string[]).includes(operatorName);
	},

	/**
	 * Check if the operator is a TO extended operator like "TOTODAY", "TOTOMORROW".
	 * @param operatorName Operator name to check
	 * @returns Boolean. If 'to' extended operator.
	 */
	getFilterOperator(operatorName: ExtendedOperatorName): FilterOperator {
		let filterOperator = ModelOperator.EQ;
		if (isFromExtendedOperator(operatorName)) {
			filterOperator = ModelOperator.GE;
		} else if (isToExtendedOperator(operatorName)) {
			filterOperator = ModelOperator.LE;
		}
		return filterOperator;
	},

	/**
	 * Add extended operations to MDC filtering environment.
	 *
	 * Presently only single value date operators extended via TO/FROM operations can be added.
	 * These include...
	 * 1. "FROMYESTERDAY".
	 * 2. "FROMTODAY".
	 * 3. "FROMTOMORROW".
	 * 4. "FROMFIRSTDAYWEEK".
	 * 5. "FROMLASTDAYWEEK".
	 * 6. "FROMFIRSTDAYMONTH".
	 * 7. "FROMLASTDAYMONTH".
	 * 8. "FROMFIRSTDAYQUARTER".
	 * 9. "FROMLASTDAYQUARTER".
	 * 10. "FROMFIRSTDAYYEAR".
	 * 11. "FROMLASTDAYYEAR".
	 * 12. "TOYESTERDAY".
	 * 13. "TOTODAY".
	 * 14. "TOTOMORROW".
	 * 15. "TOFIRSTDAYWEEK".
	 * 16. "TOLASTDAYWEEK".
	 * 17. "TOFIRSTDAYMONTH".
	 * 18. "TOLASTDAYMONTH".
	 * 19. "TOFIRSTDAYQUARTER".
	 * 20. "TOLASTDAYQUARTER".
	 * 21. "TOFIRSTDAYYEAR".
	 * 22. "TOLASTDAYYEAR".
	 *
	 * These custom operators created by FE are not available by default with MDC filtering environment.
	 * The need to be added on-demand via MDC APIs like 'FilterOperatorUtils.addOperator'.
	 *
	 * If operatorNames is undefined, then we add all extended semantic date operators.
	 * @param operatorNames Operation names to be added or undefined.
	 */
	addExtendedFilterOperators(operatorNames: string[] = extendedOperatorNames): void {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
		const operators: RangeOperator[] = operatorNames.reduce((operators, operatorName) => {
			if (!FilterOperatorUtil.getOperator(operatorName) && ExtendedSemanticDateOperators.isExtendedOperator(operatorName)) {
				const operator = getExtendedOperator(operatorName, resourceBundle);
				operators.push(operator);
			}
			return operators;
		}, [] as RangeOperator[]);
		FilterOperatorUtil.addOperators(operators);
	}
};

export default ExtendedSemanticDateOperators;

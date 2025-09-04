import ui5FormatMessage from "sap/base/strings/formatMessage";
import ObjectPath from "sap/base/util/ObjectPath";
import type {
	BindingToolkitExpression,
	CompiledBindingToolkitExpression,
	ExpressionOrPrimitive,
	PathInModelExpression
} from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, transformRecursively } from "sap/fe/base/BindingToolkit";
import Any from "sap/fe/core/controls/Any";
import type Control from "sap/ui/core/Control";

const evaluateComplexExpression = function (this: Control, expressionAsString: string, ...partsToConcat: string[]): string {
	const myExpression = JSON.parse(expressionAsString) as BindingToolkitExpression<string>;
	transformRecursively(
		myExpression,
		"PathInModel",
		(pathInModelDef: PathInModelExpression<unknown>) => {
			if (pathInModelDef.modelName === "$") {
				return constant(partsToConcat[parseInt(pathInModelDef.path.substring(1), 10)]);
			}
			return pathInModelDef;
		},
		true
	);
	transformRecursively(myExpression, "ComplexType", (complexTypeDef: unknown) => {
		const compiledExpression = compileExpression(complexTypeDef as ExpressionOrPrimitive<string>);
		if (compiledExpression) {
			return constant(getValue(compiledExpression, this));
		}
		return constant(compiledExpression) as BindingToolkitExpression<string>;
	});

	const myCompiledExpression = compileExpression(myExpression);

	return getValue(myCompiledExpression, this);
};

const getValue = function (myExpression: CompiledBindingToolkitExpression, target: Control): string {
	const myAny = new Any({ anyText: myExpression });
	myAny.setModel(target.getModel());
	myAny.setBindingContext(target.getBindingContext());
	return myAny.getAnyText();
};
evaluateComplexExpression.__functionName = "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression";
const concat = function (...partsToConcat: string[]): string {
	return partsToConcat.join("");
};
concat.__functionName = "sap.fe.core.formatters.StandardFormatter#concat";

const ifElse = function (condition: boolean, onTrue: string, onFalse: string): string {
	return condition ? onTrue : onFalse;
};
ifElse.__functionName = "sap.fe.core.formatters.StandardFormatter#ifElse";

const asArray = function (value: string): string[] | undefined {
	if (value === undefined || value === null || value === "undefined" || value === "null") {
		return [];
	}
	return [value];
};
asArray.__functionName = "sap.fe.core.formatters.StandardFormatter#asArray";

/**
 * Collection of table formatters.
 * @param this The context
 * @param sName The inner function name
 * @param oArgs The inner function parameters
 * @returns The value from the inner function
 */
const standardFormatter = function (this: object, sName: string, ...oArgs: unknown[]): unknown {
	if (standardFormatter.hasOwnProperty(sName)) {
		return (standardFormatter as unknown as Record<string, Function>)[sName].apply(this, oArgs);
	} else {
		return "";
	}
};

/**
 * Dummy formatter to ensure complex binding paths are loaded.
 * @param args The arguments
 * @returns Returns null
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadProperties = function (...args: unknown[]): null {
	return null;
};
loadProperties.__functionName = "sap.fe.core.formatters.StandardFormatter#loadProperties";

const formatPluralMessageConditionally = function (textSingular: string, textPlural: string, values: number): string {
	return values === 1 ? textSingular : ui5FormatMessage(textPlural, [values]);
};
formatPluralMessageConditionally.__functionName = "sap.fe.core.formatters.StandardFormatter#formatPluralMessageConditionally";

standardFormatter.evaluateComplexExpression = evaluateComplexExpression;
standardFormatter.concat = concat;
standardFormatter.ifElse = ifElse;
standardFormatter.asArray = asArray;
standardFormatter.loadProperties = loadProperties;
standardFormatter.formatPluralMessageConditionally = formatPluralMessageConditionally;

ObjectPath.set("sap.fe.core.formatters.StandardFormatter", standardFormatter);

export default standardFormatter;

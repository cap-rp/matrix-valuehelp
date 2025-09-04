// This file holds the expression compiler for generating adaptive card expression binding strings from binding toolkit expression.
// NOTE: The conversion of only a few logical operations is implemented below as of now. This shall be enhanced as and when needed.

import Log from "sap/base/Log";
import {
	escapeXmlAttribute,
	isBindingToolkitExpression,
	isConstant,
	isPathInModelExpression,
	wrapPrimitive,
	type BindingToolkitExpression,
	type ComparisonExpression,
	type ConstantExpression,
	type ExpressionOrPrimitive,
	type PathInModelExpression,
	type PrimitiveType
} from "sap/fe/base/BindingToolkit";

const BINDING_INDICATOR = "$";

export type CompiledAdaptiveCardExpression = string | undefined | null;

export type QueryInfo = {
	pathsToQuery: string[];
};

export type AdaptiveCompilerResult = QueryInfo & {
	compiledExpression: CompiledAdaptiveCardExpression;
};

const SetOperatorMap = {
	"||": "or",
	"&&": "and"
};

/**
 * Check if the adaptive card expression needs parenthesis.
 * @param expr Expression to be checked
 * @returns Boolean
 */
const needParenthesis = function <T extends PrimitiveType>(expr: ExpressionOrPrimitive<T>): boolean {
	return (
		!isConstant(expr) &&
		!isPathInModelExpression(expr) &&
		isBindingToolkitExpression(expr) &&
		expr._type !== "IfElse" &&
		expr._type !== "Comparison" &&
		expr._type !== "Not"
	);
};

/**
 * Wrap the compiled binding string as required depending on its context.
 * @param expression The compiled expression
 * @param embeddedInBinding True if the compiled expression is to be embedded in a binding
 * @param parenthesisRequired True if the embedded binding needs to be wrapped in parethesis so that it is evaluated as one
 * @returns Finalized compiled expression
 */
function wrapBindingExpression(
	expression: string,
	embeddedInBinding: boolean,
	parenthesisRequired = false
): CompiledAdaptiveCardExpression {
	if (embeddedInBinding) {
		if (parenthesisRequired) {
			return `(${expression})`;
		} else {
			return expression;
		}
	} else {
		return `${BINDING_INDICATOR}{${expression}}`;
	}
}

/**
 * Compile a comparison expression.
 * @param expression The comparison expression.
 * @param navPathForPathsInModel Navigation path prefix to append to paths when we compile binding expression with 'path in model'
 * @returns The compiled expression. Needs wrapping before it can be used as an expression binding.
 */
function compileComparisonExpression(expression: ComparisonExpression, navPathForPathsInModel: string): string {
	function compileOperand(operand: BindingToolkitExpression<unknown>): CompiledAdaptiveCardExpression {
		const compiledOperand = compileToAdaptiveExpression(operand, navPathForPathsInModel, true) ?? "undefined";
		return wrapBindingExpression(compiledOperand, true, needParenthesis(operand));
	}
	const { operand1, operand2, operator } = expression;
	let retExp;
	switch (operator) {
		case "===":
			retExp = `equals(${compileOperand(operand1)},${compileOperand(operand2)})`;
			break;
		case "!==":
			retExp = `not(equals(${compileOperand(operand1)},${compileOperand(operand2)}))`;
			break;
		case ">=":
			retExp = `greaterOrEquals(${compileOperand(expression.operand1)},${compileOperand(operand2)})`;
			break;
		case ">":
			retExp = `greater(${compileOperand(operand1)},${compileOperand(operand2)})`;
			break;
		case "<=":
			retExp = `lessOrEquals(${compileOperand(operand1)},${compileOperand(operand2)})`;
			break;
		case "<":
			retExp = `less(${compileOperand(operand1)},${compileOperand(operand2)})`;
			break;
		default:
			Log.warning(`Adaptive card expression compiler: ${operator} not supported.`);
	}

	return `${retExp}`;
}

/**
 * Compiles a Constant Binding Expression.
 * @param expr
 * @param embeddedInBinding
 * @returns The compiled string
 */

export function compileConstant<T extends PrimitiveType>(
	expr: ConstantExpression<T>,
	embeddedInBinding: boolean
): CompiledAdaptiveCardExpression {
	if (expr.value === null || expr.value === undefined) {
		return expr.value;
	}
	if (typeof expr.value === "object") {
		// NOTE: These need to be supported as and when needed.
		throw Error(`${expr.toString()} : object as value not supported.`);
	}

	if (embeddedInBinding) {
		switch (typeof expr.value) {
			case "number":
			case "bigint":
			case "boolean":
				return expr.value.toString();
			case "string":
				return `'${escapeXmlAttribute(expr.value.toString())}'`;
			default:
				return "";
		}
	} else {
		return expr.value.toString();
	}
}
/**
 * Get the adaptive compiler result for the binding expression.
 *
 * This would contain 2 parts:
 * 1. compiledExpression: Compiled adaptive binding expression.
 * 2. pathsToQuery: Paths encountered during the compilation process that need to be queried before resolving the binding during templating process.
 * @template T The target type
 * @param expression The expression to compile
 * @param navPathForPathsInModel Navigation path prefix to append to paths when we compile binding expression with 'path in model'
 * @returns The compiler result containing corresponding expression binding or undefined in case unsupported expression type is encountered and the paths encountered during the expression parsing.
 */
export function getAdaptiveCompilerResult<T extends PrimitiveType>(
	expression: ExpressionOrPrimitive<T>,
	navPathForPathsInModel = ""
): AdaptiveCompilerResult {
	const compiledExpression = compileToAdaptiveExpression(expression, navPathForPathsInModel);
	let pathsInExpression = getPropertyPathsInExpression(expression);

	// considering parent navigation path prefix that might be forced by the caller.
	if (navPathForPathsInModel && pathsInExpression.length > 0) {
		pathsInExpression = pathsInExpression.map((path) => `${navPathForPathsInModel.replaceAll("/", ".")}.${path}`);
	}

	return {
		pathsToQuery: pathsInExpression,
		compiledExpression
	};
}

/**
 * Compile an binding expression into an adaptive expression.
 *
 * Expression types supported:
 * 1. Constant
 * 2. PathInModel
 * 3. Comparison
 * 4. IfElse
 * 5. Set
 * 6. Not
 * 7. Truthy
 * 8. Unresolvable
 *
 * Expression types not supported as of now(and need to be implemented as and when required):
 * 1. Ref
 * 2. Function
 * 3. EmbeddedExpressionBinding
 * 4. EmbeddedBinding
 * 5. Concat
 * 6. Length
 * 7. Formatter
 * 8. ComplexType
 * If a unsupported expression type is encountered while compiling the expression, then an error shall be logged and undefined is returned.
 * @template T The target type
 * @param expression The expression to compile
 * @param navPathForPathsInModel Navigation path prefix to append to paths when we compile binding expression with 'path in model'
 * @param embeddedInBinding Whether the expression to compile is embedded into another expression
 * @returns The corresponding expression binding or undefined in case unsupported expression type is encountered.
 */
export function compileToAdaptiveExpression<T extends PrimitiveType>(
	expression: ExpressionOrPrimitive<T>,
	navPathForPathsInModel = "",
	embeddedInBinding = false
): CompiledAdaptiveCardExpression {
	let ret: CompiledAdaptiveCardExpression;

	try {
		const expr = wrapPrimitive(expression);

		switch (expr._type) {
			case "Unresolvable":
				ret = undefined;
				break;
			case "Constant":
				ret = compileConstant(expr, embeddedInBinding);
				break;
			case "PathInModel":
				ret = compilePathInModelExpression(expr, navPathForPathsInModel, embeddedInBinding);
				break;
			case "Comparison": {
				const comparisonExpression = compileComparisonExpression(expr, navPathForPathsInModel);

				ret = wrapBindingExpression(comparisonExpression, embeddedInBinding);
				break;
			}
			case "IfElse": {
				const condition = compileToAdaptiveExpression(expr.condition, navPathForPathsInModel, true);
				const truthyOption = compileToAdaptiveExpression(expr.onTrue, navPathForPathsInModel, true);
				const falsyOption = compileToAdaptiveExpression(expr.onFalse, navPathForPathsInModel, true);
				const ifElseExpression = `if(${condition},${truthyOption},${falsyOption})`;

				ret = wrapBindingExpression(ifElseExpression, embeddedInBinding);
				break;
			}
			case "Set": {
				const setExpressions = expr.operands.map((operand) => compileToAdaptiveExpression(operand, navPathForPathsInModel, true));
				const builtInFuncForOperator = SetOperatorMap[expr.operator];
				const totalExpression = `${builtInFuncForOperator}(${setExpressions.join(",")})`;

				ret = wrapBindingExpression(totalExpression, embeddedInBinding);
				break;
			}
			case "Not": {
				const notExpression = `not(${compileToAdaptiveExpression(expr.operand, navPathForPathsInModel, true)})`;
				ret = wrapBindingExpression(notExpression, embeddedInBinding);
				break;
			}
			case "Truthy": {
				const truthyExpression = `not(not(${compileToAdaptiveExpression(expr.operand, navPathForPathsInModel, true)}))`;
				ret = wrapBindingExpression(truthyExpression, embeddedInBinding);
				break;
			}
			case "Ref":
			case "Function":
			case "EmbeddedExpressionBinding":
			case "EmbeddedBinding":
			case "Concat":
			case "Length":
			case "Formatter":
			case "ComplexType":
			default:
				// NOTE: These need to be supported as and when needed.
				throw Error(`${expr._type} : expression type is not supported.`);
		}
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		Log.error(`Adaptive card expression compiler : ${message}`);
	}

	return ret;
}

/**
 * Compile a binding expression path.
 * @param expression The expression to compile.
 * @param navPathForPathsInModel Navigation path prefix to append to paths when we compile binding expression with 'path in model'
 * @returns The compiled path.
 */
function compilePathInModel<T extends PrimitiveType>(expression: PathInModelExpression<T>, navPathForPathsInModel: string): string {
	const { modelName, path } = expression;

	if (modelName) {
		// NOTE: Named model not supported
		throw Error(`${modelName}>${path} : path in model not supported.`);
	}
	const propertyPathPrefix = navPathForPathsInModel ? `${navPathForPathsInModel}.` : navPathForPathsInModel;
	const ret = `${propertyPathPrefix}${path}`;

	return ret.replace("/", ".");
}

/**
 * Generates the binding string for a Binding expression.
 * @param expressionForBinding The expression to compile
 * @param navPathForPathsInModel Navigation path prefix to append to paths when we compile binding expression with 'path in model'
 * @param embeddedInBinding Whether the expression to compile is embedded into another expression
 * @returns The corresponding expression binding
 */
function compilePathInModelExpression<T extends PrimitiveType>(
	expressionForBinding: PathInModelExpression<T>,
	navPathForPathsInModel: string,
	embeddedInBinding: boolean
): CompiledAdaptiveCardExpression {
	if (
		expressionForBinding.type ||
		expressionForBinding.parameters ||
		expressionForBinding.targetType ||
		expressionForBinding.formatOptions ||
		expressionForBinding.constraints
	) {
		// NOTE: This is now a complex binding definition. Not supported as of now.
		throw Error(`${expressionForBinding.toString()} : complex binding not supported.`);
	} else if (embeddedInBinding) {
		return `${compilePathInModel(expressionForBinding, navPathForPathsInModel)}`;
	} else {
		return `${BINDING_INDICATOR}{${compilePathInModel(expressionForBinding, navPathForPathsInModel)}}`;
	}
}

/**
 * Gets the property paths in the expression that might be encountered during expression compilation.
 * @template T The target type
 * @param expression The expression to compile
 * @returns The corresponding expression binding or undefined in case unsupported expression type is encountered.
 */
export function getPropertyPathsInExpression<T extends PrimitiveType>(expression: ExpressionOrPrimitive<T>): string[] {
	let ret: string[] = [];

	try {
		const expr = wrapPrimitive(expression);

		switch (expr._type) {
			case "Unresolvable":
				throw Error(`${expr._type} : expression type is not supported.`);
			case "Constant":
				break;
			case "PathInModel":
				ret = [...ret, getPathInModel(expr)];
				break;
			case "Comparison": {
				ret = [...ret, ...getPathsInComparisonExpression(expr)];
				break;
			}
			case "IfElse": {
				const pathsInCondition = getPropertyPathsInExpression(expr.condition);
				const pathsInTruthyOption = getPropertyPathsInExpression(expr.onTrue);
				const pathsInFalsyOption = getPropertyPathsInExpression(expr.onFalse);
				ret = [...ret, ...pathsInCondition, ...pathsInTruthyOption, ...pathsInFalsyOption];
				break;
			}
			case "Set": {
				const pathsInSetExpressions = expr.operands.reduce(
					(allPaths, operand) => [...allPaths, ...getPropertyPathsInExpression(operand)],
					[] as string[]
				);
				ret = [...ret, ...pathsInSetExpressions];
				break;
			}
			case "Not": {
				const pathsInNotExpression = getPropertyPathsInExpression(expr.operand);
				ret = [...ret, ...pathsInNotExpression];
				break;
			}
			case "Truthy": {
				const pathsInTruthyExpression = getPropertyPathsInExpression(expr.operand);
				ret = [...ret, ...pathsInTruthyExpression];
				break;
			}
			case "Ref":
			case "Function":
			case "EmbeddedExpressionBinding":
			case "EmbeddedBinding":
			case "Concat":
			case "Length":
			case "Formatter":
			case "ComplexType":
			default:
				// NOTE: These need to be supported as and when needed.
				throw Error(`${expr._type} : expression type is not supported.`);
		}
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		Log.error(`Adaptive card expression compiler : paths in expression : ${message}`);
	}

	// removing duplicates
	ret = Array.from(new Set(ret));

	return ret;
}

function getPathInModel<T extends PrimitiveType>(expression: PathInModelExpression<T>): string {
	if (expression.type || expression.parameters || expression.targetType || expression.formatOptions || expression.constraints) {
		// NOTE: This is now a complex binding definition. Not supported as of now.
		throw Error(`${expression.toString()} : complex binding not supported.`);
	}

	const { modelName, path } = expression;

	if (modelName) {
		// NOTE: Named model not supported
		throw Error(`${modelName}>${path} : path in model not supported.`);
	}

	return path.replaceAll("/", ".");
}

function getPathsInComparisonExpression(expression: ComparisonExpression): string[] {
	const { operand1, operand2 } = expression;
	return [...getPropertyPathsInExpression(operand1), ...getPropertyPathsInExpression(operand2)];
}

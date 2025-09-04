import type { PrimitiveType } from "@sap-ux/vocabularies-types";
import ObjectPath from "sap/base/util/ObjectPath";
import type { BindingToolkitExpression, PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { constant, isConstant, transformRecursively, unresolvableExpression } from "sap/fe/base/BindingToolkit";

/**
 * Evaluates a binding toolkit expression based on available data and without data binding.
 *
 * This is an experimental feature that aims to replace code where we resolve $Path manually for a more complete solution.
 * It might not work in all scenario especially when multiple models are involved.
 * @param bindingToolkitExpression The expression to evaluate
 * @param modelData The data that will be used to resolve the expression
 * @returns The result of the expression or throws an error if the expression cannot be resolved
 * @experimental
 */
export function evaluateExpression<T extends PrimitiveType>(
	bindingToolkitExpression: BindingToolkitExpression<T>,
	modelData: Record<string, undefined | Record<string, unknown>>
): unknown {
	const missingModels = new Set<string>();
	const transformedExpression = transformRecursively(
		bindingToolkitExpression,
		"PathInModel",
		(pathInModel: PathInModelExpression<unknown>) => {
			// undefined modelName needs to be treated as empty string for the lookup
			const modelName = pathInModel.modelName ?? "";
			const currentModelData = modelData[modelName];
			if (currentModelData === undefined) {
				missingModels.add(modelName);
				return unresolvableExpression;
			}
			return constant<PrimitiveType>(ObjectPath.get(pathInModel.path.replace(/\//g, "."), currentModelData));
		},
		true
	);
	if (isConstant(transformedExpression)) {
		return transformedExpression.value;
	} else {
		throw new Error(
			`Expression cannot be resolved not constant as data from the following models: ${Array.from(missingModels).join(
				","
			)} is missing`
		);
	}
}

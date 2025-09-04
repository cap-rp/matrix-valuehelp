import type {
	Action,
	ActionParameter,
	AnnotationTerm,
	ConvertedMetadata,
	Boolean as EdmBoolean,
	PropertyAnnotationValue
} from "@sap-ux/vocabularies-types";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, equal, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import type { IContext } from "sap/ui/core/util/XMLPreprocessor";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import { convertTypes } from "../converters/MetaModelConverter";
import { bindingContextPathVisitor } from "../helpers/BindingHelper";
import { isActionParameterRequiredExpression } from "./FieldControlHelper";

/**
 * Get binding toolkit expressiono for 'is action critical'.
 * @param actionTarget Action
 * @param convertedTypes ConvertedMetadata
 * @returns BindingToolkitExpression
 */
export function getIsActionCriticalExpression(actionTarget: Action, convertedTypes: ConvertedMetadata): BindingToolkitExpression<boolean> {
	const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
	const isActionCriticalExp = getExpressionFromAnnotation(
		actionTarget.annotations.Common?.IsActionCritical as unknown as AnnotationTerm<PropertyAnnotationValue<EdmBoolean>>,
		[],
		undefined,
		(path: string) => bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName)
	);
	return equal(isActionCriticalExp, true);
}

/**
 * Checks whether action parameter is required.
 * @param context Interface context to function arguments' contexts.
 * @returns Compiled expression
 */
export const isActionParameterRequired = function (context: IContext): CompiledBindingToolkitExpression {
	const actionParameterPath = context.getInterface(0).getPath();
	const actionPath = context.getInterface(1).getPath();
	const metaModel = context.getInterface(0).getModel();

	if (actionParameterPath && actionPath && metaModel) {
		const convertedTypes = convertTypes(metaModel as ODataMetaModel);
		const actionParameterTarget = convertedTypes.resolvePath<ActionParameter>(actionParameterPath);
		const actionParameter = actionParameterTarget.target;
		const actionTarget = convertedTypes.resolvePath<Action>(actionPath);
		const action = actionTarget.target;
		if (actionParameter && action) {
			return compileExpression(isActionParameterRequiredExpression(actionParameter, action, convertedTypes));
		}
	}
};
isActionParameterRequired.requiresIContext = true;

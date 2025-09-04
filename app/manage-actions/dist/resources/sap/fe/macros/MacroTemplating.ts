import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant } from "sap/fe/base/BindingToolkit";
import type { ComputedAnnotationInterface, MetaModelContext } from "sap/fe/core/templating/UIFormatters";

export const getPath = function (oContext: MetaModelContext, oInterface: ComputedAnnotationInterface): string {
	if (oInterface && oInterface.context) {
		return oInterface.context.getPath();
	}
	return "";
};
getPath.requiresIContext = true;
export const getValue = function (oContext: object): CompiledBindingToolkitExpression {
	return compileExpression(constant(oContext));
};
getValue.requiresIContext = true;

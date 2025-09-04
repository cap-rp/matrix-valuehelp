import type { DataFieldForAction } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { CriticalityType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { getExpressionFromAnnotation, isConstant } from "sap/fe/base/BindingToolkit";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { ObjectPageDefinition } from "sap/fe/core/converters/templates/ObjectPageConverter";
import {
	getEditCommandExecutionEnabled,
	getEditCommandExecutionVisible,
	getPressExpressionForPrimaryAction
} from "sap/fe/templates/ObjectPage/ObjectPageTemplating";

export type FinalPageDefinition = ObjectPageDefinition & {
	primaryAction: string;
	designtime: string | undefined;
};

export const extendObjectPageDefinition = function (
	pageDefinition: ObjectPageDefinition,
	converterContext: ConverterContext<PageContextPathTarget>
): FinalPageDefinition {
	const convertedPageDefinition = pageDefinition as FinalPageDefinition;
	convertedPageDefinition.primaryAction = getPrimaryAction(converterContext, pageDefinition.header.actions, pageDefinition.footerActions);
	convertedPageDefinition.designtime = getDesigntime();
	return convertedPageDefinition;
};

/**
 * Method to get the expression for the execute event of the forward action.
 * Generates primaryActionExpression to be executed on the keyboard shortcut Ctrl+Enter with the
 * forward flow (priority is the semantic positive action OR if that's not there, then the primary action).
 * @param converterContext The converter context
 * @param headerActions An array containing all the actions for this ObjectPage header
 * @param footerActions An array containing all the actions for this ObjectPage footer
 * @returns  Binding expression or function string
 */
export const getPrimaryAction = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	headerActions: BaseAction[],
	footerActions: BaseAction[]
): string {
	let primaryActionExpression = "";
	const aActions = [...headerActions, ...footerActions];

	const getBindingExp = function (sExpression: CompiledBindingToolkitExpression | string): string | undefined {
		if (sExpression && sExpression.includes("{=")) {
			return sExpression.replace("{=", "(").slice(0, -1) + ")";
		}
		return sExpression;
	};
	const aSemanticPositiveActions = aActions.filter((oAction) => {
		if (oAction?.annotationPath) {
			const targetObject = converterContext
				.getConverterContextFor<DataFieldForAction>(oAction?.annotationPath)
				.getDataModelObjectPath().targetObject;
			const targetCriticality = getExpressionFromAnnotation(targetObject?.Criticality);
			if (isConstant(targetCriticality) && targetCriticality.value === CriticalityType.Positive) {
				return true;
			}
		}
	});
	const oEntitySet = converterContext.getEntitySet();
	if (aSemanticPositiveActions.length > 0) {
		primaryActionExpression = getPressExpressionForPrimaryAction(
			aSemanticPositiveActions[0].annotationPath
				? converterContext
						.getConverterContextFor<DataFieldForAction>(aSemanticPositiveActions[0].annotationPath)
						.getDataModelObjectPath().targetObject
				: undefined,
			oEntitySet?.name,
			aSemanticPositiveActions[0],
			getBindingExp(aSemanticPositiveActions[0].visible ?? "true"),
			getBindingExp(aSemanticPositiveActions[0].enabled ?? "true"),
			getBindingExp(getEditCommandExecutionVisible(headerActions)),
			getBindingExp(getEditCommandExecutionEnabled(headerActions))
		);
	} else {
		primaryActionExpression = getPressExpressionForPrimaryAction(
			undefined,
			oEntitySet?.name,
			null,
			"false",
			"false",
			getBindingExp(getEditCommandExecutionVisible(headerActions)),
			getBindingExp(getEditCommandExecutionEnabled(headerActions))
		);
	}
	return primaryActionExpression;
};

export function getDesigntime(): string | undefined {
	return "sap/fe/templates/ObjectPage/designtime/ObjectPage.designtime";
}

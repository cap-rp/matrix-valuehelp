import type { DataFieldAbstractTypes, OperationGroupingType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes, type DataFieldForAction } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { getExpressionFromAnnotation, isPathInModelExpression } from "sap/fe/base/BindingToolkit";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import { bindingContextPathVisitor } from "sap/fe/core/helpers/BindingHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { ComputedAnnotationInterface } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { MetaModelEnum, MetaModelType } from "../../../../../../../../types/metamodel_types";

const ActionHelper = {
	/**
	 * Returns an array of actions that are not enabled with a multiple selection.
	 * @param collections Array of records
	 * @returns An array of action paths
	 */
	getMultiSelectDisabledActions(collections?: DataFieldAbstractTypes[]): string[] {
		const multiSelectDisabledActions: string[] = [];
		const actions = (collections?.filter((collection) => collection.$Type === UIAnnotationTypes.DataFieldForAction) ??
			[]) as DataFieldForAction[];
		for (const action of actions) {
			const actionTarget = action?.ActionTarget;
			if (actionTarget?.isBound === true) {
				for (const parameter of actionTarget.parameters) {
					if (
						isPathAnnotationExpression(parameter.annotations.UI?.Hidden) ||
						isPathAnnotationExpression(parameter.annotations.Common?.FieldControl)
					) {
						multiSelectDisabledActions.push(actionTarget.name);
					}
				}
			}
		}

		return multiSelectDisabledActions;
	},

	/**
	 * Method to get the expression for the 'press' event for the DataFieldForActionButton.
	 * @param sId Control ID
	 * @param oAction Action object
	 * @param oParams Parameters
	 * @param oParams.invocationGrouping Invocation grouping
	 * @param oParams.controlId Control ID
	 * @param oParams.operationAvailableMap OperationAvailableMap
	 * @param oParams.model Model
	 * @param oParams.label Label
	 * @param oParams.contexts Contexts
	 * @param sOperationAvailableMap OperationAvailableMap as stringified JSON object
	 * @returns The binding expression
	 */
	getPressEventDataFieldForActionButton(
		sId: string,
		oAction: MetaModelType<DataFieldForAction> & { InvocationGrouping: MetaModelEnum<OperationGroupingType> },
		oParams: {
			invocationGrouping?: string;
			controlId?: string;
			operationAvailableMap?: string;
			model?: string;
			label?: string;
			contexts?: string;
		},
		sOperationAvailableMap: string
	): string {
		const sInvocationGrouping =
			oAction.InvocationGrouping &&
			oAction.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
				? "ChangeSet"
				: "Isolated";
		oParams = oParams || {};
		oParams["invocationGrouping"] = CommonHelper.addSingleQuotes(sInvocationGrouping);
		oParams["controlId"] = CommonHelper.addSingleQuotes(sId);
		oParams["operationAvailableMap"] = CommonHelper.addSingleQuotes(sOperationAvailableMap);
		oParams["model"] = "${$source>/}.getModel()";
		oParams["label"] = oAction.Label && CommonHelper.addSingleQuotes(oAction.Label, true);

		return CommonHelper.generateFunction(
			".editFlow.invokeAction",
			CommonHelper.addSingleQuotes(oAction.Action!),
			CommonHelper.objectToString({ ...oParams, ...{ feFrameworkCall: true } })
		);
	},
	/**
	 * Return Number of contexts expression.
	 * @param vActionEnabled Status of action (single or multiselect)
	 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
	 * @returns Number of contexts expression
	 */
	getNumberOfContextsExpression(vActionEnabled: string, forContextMenu = false): string {
		let sNumberOfSelectedContexts;
		const selectedContext = !forContextMenu
			? "${internal>numberOfSelectedContexts}"
			: "${internal>contextmenu/numberOfSelectedContexts}";
		if (vActionEnabled === "single") {
			sNumberOfSelectedContexts = selectedContext + " === 1";
		} else {
			sNumberOfSelectedContexts = selectedContext + " > 0";
		}
		return sNumberOfSelectedContexts;
	},
	/**
	 * Return UI Control (LineItem/Chart) Operation Available Map.
	 * @param aCollection Array of records
	 * @param sControl Control name (lineItem / chart)
	 * @param oContext Converter context
	 * @returns The record containing all action names and their corresponding Core.OperationAvailable property paths
	 */
	getOperationAvailableMap(
		collection: DataFieldAbstractTypes[] | undefined,
		control: string,
		context: ConverterContext<unknown> | ComputedAnnotationInterface
	): Record<string, unknown> {
		let operationAvailableMap: Record<string, unknown> = {};
		if (collection) {
			collection.forEach((record: DataFieldAbstractTypes) => {
				if (record.$Type === UIAnnotationTypes.DataFieldForAction) {
					const actionName = record.Action as string;
					if (!actionName?.includes("/") && !record.Determining) {
						if (control === "table") {
							operationAvailableMap = this._getOperationAvailableMapOfTable(
								record,
								actionName,
								operationAvailableMap,
								context as ConverterContext<unknown>
							);
						} else if (control === "chart") {
							operationAvailableMap = this._getOperationAvailableMapOfChart(
								actionName,
								operationAvailableMap,
								context as ComputedAnnotationInterface
							);
						}
					}
				} else if (record.$Type === UIAnnotationTypes.DataFieldForActionGroup) {
					operationAvailableMap = this.getOperationAvailableMap(record.Actions, control, context);
				}
			});
		}
		return operationAvailableMap;
	},

	/**
	 * Return LineItem Action Operation Available Map.
	 * @private
	 * @param oDataFieldForAction Data field for action object
	 * @param sActionName Action name
	 * @param oOperationAvailableMap Operation available map object
	 * @param oConverterContext Converter context object
	 * @returns The record containing all action name of line item and the corresponding Core.OperationAvailable property path
	 */
	_getOperationAvailableMapOfTable(
		oDataFieldForAction: DataFieldForAction,
		sActionName: string,
		oOperationAvailableMap: Record<string, unknown>,
		oConverterContext: ConverterContext<unknown>
	): Record<string, unknown> {
		const actionTarget = oDataFieldForAction.ActionTarget;
		if (actionTarget?.annotations?.Core?.OperationAvailable === null) {
			// We disabled action advertisement but kept it in the code for the time being
			//oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
		} else if (actionTarget?.parameters?.length) {
			const bindingParameterFullName = actionTarget.parameters[0].fullyQualifiedName,
				targetExpression = getExpressionFromAnnotation(
					actionTarget?.annotations?.Core?.OperationAvailable,
					[],
					undefined,
					(path: string) => bindingContextPathVisitor(path, oConverterContext.getConvertedTypes(), bindingParameterFullName)
				);
			if (isPathInModelExpression(targetExpression)) {
				oOperationAvailableMap = this._addToMap(sActionName, targetExpression.path, oOperationAvailableMap);
			} else if (actionTarget?.annotations?.Core?.OperationAvailable !== undefined) {
				oOperationAvailableMap = this._addToMap(sActionName, targetExpression, oOperationAvailableMap);
			}
		}
		return oOperationAvailableMap;
	},

	/**
	 * Return LineItem Action Operation Available Map.
	 * @private
	 * @param sActionName Action name
	 * @param oOperationAvailableMap Operation available map object
	 * @param oContext Context object
	 * @param oContext.context Context object
	 * @returns The record containing all action name of chart and the corresponding Core.OperationAvailable property path
	 */
	_getOperationAvailableMapOfChart(
		sActionName: string,
		oOperationAvailableMap: Record<string, unknown>,
		oContext: ComputedAnnotationInterface
	): Record<string, unknown> {
		let oResult = CommonHelper.getActionPath(oContext.context, false, sActionName, true);
		if (oResult === null) {
			oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
		} else {
			oResult = CommonHelper.getActionPath(oContext.context, false, sActionName) as {
				sContextPath: string;
				sProperty: string;
				sBindingParameter: string;
			};
			if (oResult.sProperty) {
				oOperationAvailableMap = this._addToMap(
					sActionName,
					oResult.sProperty.substring(oResult.sBindingParameter.length + 1),
					oOperationAvailableMap
				);
			}
		}
		return oOperationAvailableMap;
	},

	/**
	 * Return Map.
	 * @private
	 * @param sKey Key
	 * @param oValue Value
	 * @param oMap Map object
	 * @returns Map object
	 */
	_addToMap(sKey: string, oValue: unknown, oMap: Record<string, unknown>): Record<string, unknown> {
		if (sKey && oMap) {
			oMap[sKey] = oValue;
		}
		return oMap;
	}
};

export default ActionHelper;

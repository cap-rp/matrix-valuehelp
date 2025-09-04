import type { Action, ActionParameter, ConvertedMetadata, EntityType } from "@sap-ux/vocabularies-types";
import { UIAnnotationTypes, type DataFieldForAction } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import {
	OverrideType,
	Placement,
	insertCustomElements,
	type ConfigurableObjectKey,
	type CustomElement,
	type Positionable
} from "sap/fe/core/converters/helpers/ConfigurableObject";
import type { CompiledAdaptiveCardExpression } from "sap/fe/core/helpers/AdaptiveCardExpressionCompiler";
import { getStableIdPartFromDataField } from "sap/fe/core/helpers/StableIdHelper";
import { getIsActionCriticalExpression } from "sap/fe/core/templating/ActionHelper";
import { isActionParameterRequiredExpression } from "sap/fe/core/templating/FieldControlHelper";
import { isMultiLineText } from "sap/fe/core/templating/PropertyHelper";
import { getActionEnabledExpression, isVisible } from "sap/fe/core/templating/UIFormatters";
import BaseCardContentProvider, { type CardConfig } from "sap/fe/templates/ObjectPage/card/BaseCardContentProvider";
import type { ActionData, CardElement, IACAction, IInputDate, IInputText } from "types/adaptiveCard_types";

export type ActionConfig = Positionable & {
	title?: string;
	isVisible?: boolean;
};

export type CustomActionConfigs = Record<ConfigurableObjectKey, ActionConfig>;

export type ActionConfigurable = {
	actions?: CustomActionConfigs;
};

export type HeaderActionsConfig = ActionConfigurable & CardConfig;

type ActionConfigElement = Positionable &
	ActionConfig & {
		key: ConfigurableObjectKey;
		action: DataFieldForAction;
	};

type InternalCustomActionElements = Record<ConfigurableObjectKey, CustomElement<ActionConfigElement>>;

export enum ACStyle {
	Default = "default",
	Positive = "positive",
	Destructive = "destructive"
}

export enum ACAction {
	Execute = "Action.Execute",
	ShowCard = "Action.ShowCard"
}

export enum ACInput {
	Text = "Input.Text",
	ChoiceSet = "Input.ChoiceSet",
	Date = "Input.Date"
}

const ACTION_OK = "OK";

export default class HeaderActions extends BaseCardContentProvider<HeaderActionsConfig> {
	private actions: IACAction[] = [];

	/**
	 * Get the card actions.
	 * @returns Card actions.
	 */
	public getCardActions(): IACAction[] {
		return this.actions;
	}

	constructor(convertedTypes: ConvertedMetadata, config: HeaderActionsConfig) {
		super(convertedTypes, config);
		try {
			const contextInfo = this.getCardConfigurationByKey("contextInfo");
			const { contextPath } = contextInfo;
			const entityType = this.getEntityType();
			if (!entityType) {
				Log.error(`FE : V4 : Adaptive Card header actions : no EntityType found at context path: ${contextPath}`);
				return this;
			}

			const actions = this.getAnnotatedHeaderActions(entityType);
			if (actions.length > 0) {
				const configuredActions = this.getConfiguredActions(actions);
				this.actions = configuredActions.reduce(this.getActionInAdaptiveCardFormat.bind(this), [] as IACAction[]);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error("Error while creating the card defintion", message);
		}
		return this;
	}

	/**
	 * Get action type based on the need for user inputs for action parameters.
	 * @param edmAction Converted metadata action.
	 * @returns Action type to use
	 */
	private getAdaptiveCardActionType(edmAction: Action): ACAction | undefined {
		const { isBound, isFunction, parameters } = edmAction;
		if (isFunction) {
			// functions are ignored
			return;
		}
		const needUserInputParameters = parameters.length > (isBound ? 1 : 0);

		return needUserInputParameters ? ACAction.ShowCard : ACAction.Execute;
	}

	/**
	 * Get Action parameter elements to add to the action card body.
	 * @param actionTarget Converted metadata action.
	 * @returns Input elements for action parameters
	 */
	private getActionCardBodyWithParameterFields(actionTarget: Action): CardElement[] {
		const { isBound } = actionTarget;
		return actionTarget.parameters.reduce((elements, parameter, index) => {
			if (isBound && index === 0) {
				return elements;
			}
			let inputElement: IInputText | IInputDate;
			const labelTerm = parameter.annotations.Common?.Label;
			if (parameter.type === "Edm.Date" || parameter.type === "Edm.DateTimeOffset" || parameter.type === "Edm.DateTime") {
				inputElement = {
					type: ACInput.Date,
					id: parameter.name,
					label: labelTerm?.toString() ?? parameter.name,
					isRequired: this.getRequired(parameter, actionTarget) ?? undefined
				};
				elements.push(inputElement);
			} else {
				inputElement = {
					type: ACInput.Text,
					id: parameter.name,
					label: labelTerm?.toString() ?? parameter.name,
					isRequired: this.getRequired(parameter, actionTarget) ?? undefined,
					isMultiline: isMultiLineText(parameter) ?? undefined
				};
				elements.push(inputElement);
			}
			return elements;
		}, [] as CardElement[]);
	}

	/**
	 * Get action object with parameter elements.
	 * @param actionTarget Converted metadata action.
	 * @param actionDetails Action properties.
	 * @returns Action object with parameters.
	 */
	private getActionWithParameters(actionTarget: Action, actionDetails: Partial<IACAction>): IACAction {
		const body = this.getActionCardBodyWithParameterFields(actionTarget);
		const { verb, title, style, data } = actionDetails;
		const actionWithParameters: IACAction = {
			type: ACAction.Execute,
			verb,
			data,
			title: ACTION_OK,
			style: ACStyle.Positive
		};

		return {
			type: ACAction.ShowCard,
			title,
			style,
			card: {
				type: "AdaptiveCard",
				body,
				actions: [actionWithParameters]
			}
		};
	}

	/**
	 * Get action for adaptive card.
	 * @param dataFieldForAction DataFieldForAction annotation
	 * @returns Action to add.
	 */
	private getAction(dataFieldForAction: DataFieldForAction): IACAction | undefined {
		const { ActionTarget: actionTarget } = dataFieldForAction;

		const actionDetails = this.getActionDetails(dataFieldForAction);
		if (!actionTarget || !actionDetails) {
			return undefined;
		}

		const actionType = this.getAdaptiveCardActionType(actionTarget);

		let retAction: IACAction | undefined;
		if (actionType === ACAction.Execute) {
			// Actions without parameters
			retAction = { type: actionType, ...actionDetails };
		} else if (actionType === ACAction.ShowCard) {
			// Action with parameters
			retAction = this.getActionWithParameters(actionTarget, actionDetails);
		}
		return retAction;
	}

	/**
	 * Get data that needs to be part of action.
	 * @param actionTarget Converted metadata action.
	 * @returns Action data that needs to be passed with the action.
	 */
	private getActionData(actionTarget: Action): ActionData {
		const { isBound } = actionTarget;
		const contextInfo = this.getCardConfigurationByKey("contextInfo");
		const { bindingContextPath } = contextInfo;
		const bindingContextPathRelativeToService = bindingContextPath.startsWith("/")
			? bindingContextPath.substring(1)
			: bindingContextPath;
		const serviceURI = this.getCardConfigurationByKey("serviceURI");
		const contextURL = `${serviceURI}${bindingContextPathRelativeToService}`;
		return {
			contextURL,
			serviceURI: isBound ? undefined : serviceURI,
			isConfirmationRequired: this.getIsCriticalForAdaptiveCardAction(actionTarget) ?? undefined
		};
	}

	/**
	 * Get action for adaptive card.
	 * @param dataFieldForAction DataFieldForAction annotation
	 * @returns Action to add.
	 */
	private getActionDetails(dataFieldForAction: DataFieldForAction): Partial<IACAction> | undefined {
		const { ActionTarget: actionTarget } = dataFieldForAction;
		if (!actionTarget) {
			return;
		}

		// Verb creation for actions:
		//
		// 1. Bound action:
		//    Verb needs to be relative to contextURL. format: '<metadata namespace>.<action name>'
		//    Example:
		//        Metadata namespace: 'com.c_som_sd'
		//        Action name: 'boundAction'
		//        Verb: 'com.c_som_sd.boundAction'
		//        ContextURL: /SOM(1)
		//        URL to trigger POST call(this will be created by the BOT, <serviceURI + contextURL + verb>): 'https://<serviceURI>/SOM('1')/com.c_som_sd.boundAction'
		//
		// 2. Unbound action:
		//    Verb needs to be relative to serviceURI. format: '<action name>'
		//    Example:
		//        Action name: 'unboundAction'
		//        Verb: 'unboundAction'
		//        ContextURL: undefined
		//        URL to trigger POST call(this will be created by the BOT, <serviceURI + verb>): 'https://<serviceURI>/unboundAction'
		const actionToTrigger = actionTarget.isBound ? dataFieldForAction.Action.toString() : actionTarget.name,
			// We remove the overload part from the action. like 'com.c_som_sd.boundAction(com.c_som_sd.returnType)', we need only 'com.c_som_sd.boundAction' as verb.
			verb = actionToTrigger.replace(/\((.*)\)$/, ""),
			title = dataFieldForAction.Label?.toString() ?? actionTarget.name,
			style = this.getActionStyle(dataFieldForAction),
			data = this.getActionData(actionTarget);

		return { verb, title, style, data };
	}

	/**
	 * Generates action sets for adaptive card.
	 *
	 * As of now, only considering 'Annotated Actions'.
	 * Not supported:
	 * 1. Standard actions
	 * 2. Manifest actions
	 *
	 * Presently, only first two actions shall be passed to the adaptive card.
	 *
	 * This function can be used by Array.reduce.
	 * @param adaptiveCardActions Actions array to be returned.
	 * @param actionElement DataFieldForAction that needs to be converted.
	 * @returns An Array of Actions that need to be concatenated to card body.
	 */
	private getActionInAdaptiveCardFormat(adaptiveCardActions: IACAction[], actionElement: ActionConfigElement): IACAction[] {
		if (adaptiveCardActions.length > 1) {
			// Note: We only expect first 2 actions in MS teams adaptive cards. This might change in the future.
			return adaptiveCardActions;
		}

		const { action: dataFieldForAction, title: titleOverride } = actionElement;
		const { ActionTarget: actionTarget } = dataFieldForAction;

		// No Action in case:
		// 1. actionTarget not available.
		// 1. statically not visible.
		// 2. statically disabled.
		// 3. action is static action.
		if (!actionTarget) {
			return adaptiveCardActions;
		}

		const isActionVisible = actionElement.isVisible ?? this.getVisibleForAdaptiveCardAction(dataFieldForAction) ?? undefined;
		const isEnabled = this.getEnabledForAdaptiveCardAction(actionTarget) ?? undefined;

		// NOTE: '$when' is used to control visibility of actions. Looks like the value needs to always be an expression of format '${<exp>}'.
		// So, direct strings like 'true' and 'false' which are expected to work for normal card properties don't work for $when.
		// We would need to handle such cases independently.
		let whenValue: string | undefined;
		if (typeof isActionVisible === "boolean" && isActionVisible === false) {
			return adaptiveCardActions;
		} else if (typeof isActionVisible === "string" && isActionVisible && /^\$\{.*\}/i.test(isActionVisible)) {
			// visible is an expression of format '${<exp>}'.
			whenValue = isActionVisible;
		} else if (isActionVisible === "true") {
			// statically visible
			whenValue = undefined;
		} else if (isActionVisible === "false") {
			// statically not visible
			return adaptiveCardActions;
		}

		if (isEnabled === "false" || this.isStaticAction(actionTarget) || this.isCopyAction(dataFieldForAction)) {
			return adaptiveCardActions;
		}

		const action = this.getAction(dataFieldForAction);
		if (action) {
			const visualUpdates = {
				isEnabled,
				$when: whenValue,
				title: titleOverride ?? action.title
			};
			adaptiveCardActions.push({ ...action, ...visualUpdates });
		}

		return adaptiveCardActions;
	}

	/**
	 * Get the DataFieldForActions for adaptive card.
	 * @param entityType EntityType.
	 * @returns DataFieldForActions that are applicable to be shown in the adaptive card.
	 */
	private getAnnotatedHeaderActions(entityType: EntityType): DataFieldForAction[] {
		const identificationAnnotation = entityType.annotations.UI?.Identification;
		return identificationAnnotation
			? (identificationAnnotation.filter(
					(dataField) => dataField.$Type === UIAnnotationTypes.DataFieldForAction && !dataField.Determining
			  ) as DataFieldForAction[])
			: [];
	}

	/**
	 * Get configured actions.
	 * @param annotatedActions Annotated actions from the converted metadata.
	 * @returns ActionConfigElements to create actions for card definition.
	 */
	private getConfiguredActions(annotatedActions: DataFieldForAction[]): ActionConfigElement[] {
		// Actions from annotations.
		const actionConfigs = this.getCardConfigurationByKey("actions");
		const annotatedActionElements = annotatedActions.map(
			(action) => ({ key: action && getStableIdPartFromDataField(action), action }) as ActionConfigElement
		);
		if (!actionConfigs || Object.keys(actionConfigs).length === 0) {
			return annotatedActionElements;
		}

		// Custom Action configs.
		const customConfigActionNames = Object.keys(actionConfigs);
		const customActionConfigElements = customConfigActionNames.reduce((customActionElements, customConfigActionKey) => {
			const relevantActionElement = annotatedActionElements.find((actionElement) => actionElement.key === customConfigActionKey);

			if (relevantActionElement) {
				customActionElements[customConfigActionKey] = {
					key: customConfigActionKey,
					action: relevantActionElement.action,
					position: {
						placement: Placement.After
					},
					...actionConfigs[customConfigActionKey]
				};
			}

			return customActionElements;
		}, {} as InternalCustomActionElements);

		// Final action elements
		const actionOverwriteConfig = {
			title: OverrideType.overwrite,
			position: OverrideType.overwrite,
			isVisible: OverrideType.overwrite
		};
		return insertCustomElements(annotatedActionElements, customActionConfigElements, actionOverwriteConfig);
	}

	/**************************************************************************/
	/* Functions for creating template bindings and getting action properties */
	/**************************************************************************/

	/**
	 * Get action visibility.
	 * @param dataFieldForAction DataFieldForAction annotation
	 * @returns Boolean
	 */
	private getVisibleForAdaptiveCardAction(dataFieldForAction: DataFieldForAction): CompiledAdaptiveCardExpression {
		const visibilityExp = isVisible(dataFieldForAction);
		return this.updatePathsAndGetCompiledExpression(visibilityExp);
	}

	/**
	 * Get action style for the action button.
	 * @param dataFieldForAction DataFieldForAction annotation
	 * @returns Style of the action button
	 */
	private getActionStyle(dataFieldForAction: DataFieldForAction): ACStyle {
		// TODO: compile to adaptive card binding string for dynamic annotation.
		let style = ACStyle.Default;
		const criticality = dataFieldForAction.Criticality;
		if (criticality && typeof criticality === "string") {
			switch (criticality) {
				case "UI.CriticalityType/Positive":
					style = ACStyle.Positive;
					break;
				case "UI.CriticalityType/Negative":
					style = ACStyle.Destructive;
					break;
				default:
					style = ACStyle.Default;
			}
		}
		return style;
	}

	/**
	 * Check if action is critical.
	 * @param actionTarget Action definition.
	 * @returns Boolean
	 */
	private getIsCriticalForAdaptiveCardAction(actionTarget: Action): CompiledAdaptiveCardExpression {
		const isActionCritical = getIsActionCriticalExpression(actionTarget, this.convertedTypes);
		return this.updatePathsAndGetCompiledExpression(isActionCritical);
	}

	/**
	 * Get action enablement.
	 * @param actionTarget Action definition.
	 * @returns Boolean
	 */
	private getEnabledForAdaptiveCardAction(actionTarget: Action): CompiledAdaptiveCardExpression {
		const enabledExpression = getActionEnabledExpression(actionTarget, this.convertedTypes);
		return this.updatePathsAndGetCompiledExpression(enabledExpression);
	}

	/**
	 * Check for static action.
	 * @param actionTarget Action definition.
	 * @returns Boolean.
	 */
	private isStaticAction(actionTarget: Action): boolean {
		const { isBound, parameters } = actionTarget;
		return isBound && parameters[0] && parameters[0].isCollection;
	}

	/**
	 * Check for copy action.
	 * @param dataField Action definition.
	 * @returns Boolean.
	 */
	private isCopyAction(dataField: DataFieldForAction): boolean {
		return dataField.annotations?.UI?.IsCopyAction?.valueOf() === true;
	}

	/**
	 * Check if parameter input is required for action execution.
	 * @param parameter Action parameter.
	 * @param actionTarget
	 * @returns Boolean
	 */
	private getRequired(parameter: ActionParameter, actionTarget: Action): CompiledAdaptiveCardExpression {
		const fieldControlExpression = isActionParameterRequiredExpression(parameter, actionTarget, this.convertedTypes);
		return this.updatePathsAndGetCompiledExpression(fieldControlExpression);
	}
}

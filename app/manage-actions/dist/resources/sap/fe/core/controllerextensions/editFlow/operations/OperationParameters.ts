import type { Action as EdmAction, ActionParameter as EdmActionParameter, PrimitiveType } from "@sap-ux/vocabularies-types";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import { getCoreUIFactory, type StandardOperationParameterDialog } from "sap/fe/core/UIProvider";
import type MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { StartupParameters } from "../../../AppComponent";
import type MessageHandler from "../../MessageHandler";
import actionHelper from "./actionHelper";

type BaseTypeParameter = string | number | boolean;

export default class OperationParameters {
	private readonly isParameterDialogNeeded: boolean;

	private readonly actionParameters: EdmActionParameter[];

	private parameterDialog: StandardOperationParameterDialog | undefined = undefined;

	private parametersValues: Record<string, PrimitiveType> = {};

	private startupParameters: StartupParameters = {};

	constructor(
		private readonly appComponent: AppComponent,
		private readonly model: ODataModel,
		private readonly convertedAction: EdmAction,
		private readonly skipParametersDialog: boolean | undefined,
		private readonly parameters: {
			contexts: Context[];
			defaultValuesExtensionFunction?: string;
			isCreateAction?: boolean;
			label?: string;
			parameterValues?: Record<string, string | number | boolean | MultiValueFieldItem[]>[];
			entitySetName?: string;
			view?: FEView;
			messageHandler: MessageHandler;
			events?: {
				onParameterDialogOpened?: () => void;
				onParameterDialogClosed?: () => void;
			};
		}
	) {
		// Check if the action has parameters and would need a parameter dialog
		// The parameter ResultIsActiveEntity is always hidden in the dialog! Hence if
		// this is the only parameter, this is treated as no parameter here because the
		// dialog would be empty!
		this.actionParameters = actionHelper.getActionParameters(this.convertedAction);
		this.isParameterDialogNeeded =
			this.actionParameters.length > 0 &&
			!(this.actionParameters.length === 1 && this.actionParameters[0].name === "ResultIsActiveEntity");

		this.skipParametersDialog =
			(this.actionParameters.length &&
			this.actionParameters
				.filter((actionParameter) => actionParameter.name !== "ResultIsActiveEntity")
				.every((parameter) => parameter.annotations.UI?.Hidden?.valueOf() === true)
				? true
				: this.skipParametersDialog) ?? false;

		this.setStartupParameters();
	}

	/**
	 *  Sets the parameters provided on the startup.
	 */
	private setStartupParameters(): void {
		// Determine startup parameters if provided
		const componentData = this.appComponent.getComponentData();
		this.startupParameters = componentData?.startupParameters ?? {};
	}

	/**
	 *  Is the parameter dialog instanced.
	 * @returns True if the parameter dialog is instanced, otherwise false
	 */
	public isParameterDialog(): boolean {
		return !!this.parameterDialog;
	}

	/**
	 *  Is the parameter dialog opened.
	 * @returns True if the parameter dialog is opened, otherwise false
	 */
	public isParameterDialogOpened(): boolean {
		return this.parameterDialog?.isOpen() ?? false;
	}

	/**
	 * Resets the state of the parameter dialog.
	 */
	public resetParameterDialogState(): void {
		this.parameterDialog?.resetState();
	}

	/**
	 * Closes the state of the parameter dialog.
	 * @returns Promise that resolves when the dialog is closed
	 */
	public async closeParameterDialog(): Promise<void> {
		return this.parameterDialog?.closeDialog();
	}

	/**
	 * Gets the value of the parameters.
	 * @returns The value of the parameters
	 */
	public async getOperationParameters(): Promise<Record<string, PrimitiveType>> {
		// In case an action parameter is needed, and we shall skip the dialog, check if values are provided for all parameters
		if (this.isParameterDialogNeeded && !(this.skipParametersDialog && this.isMandatoryValuesProvided())) {
			if (!this.parameterDialog) {
				this.parameterDialog = getCoreUIFactory().newOperationParameterDialog(
					this.convertedAction,
					{
						appComponent: this.appComponent,
						model: this.model,
						contexts: this.parameters.contexts,
						parametersValues: {},
						defaultValuesExtensionFunction: this.parameters.defaultValuesExtensionFunction,
						isCreateAction: this.parameters.isCreateAction,
						label: this.parameters.label,
						view: this.parameters.view,
						events: {
							onParameterDialogOpened: this.parameters.events?.onParameterDialogOpened,
							onParameterDialogClosed: this.parameters.events?.onParameterDialogClosed
						}
					},
					this.parameters.parameterValues,
					this.parameters.entitySetName,
					this.parameters.messageHandler
				);
				await this.parameterDialog.createDialog();
				this.parameterDialog.openDialog();
			}
			return this.parameterDialog.waitForParametersValues();
		}
		// If the dialog is skipped, we need to set the default values for the parameters
		if (this.parameters.parameterValues) {
			for (const i in this.actionParameters) {
				this.parametersValues[this.actionParameters[i].name] = this.parameters.parameterValues?.find(
					(element) => element.name === this.actionParameters[i].name
				)?.value;
			}
		} else {
			let actionParameter;
			for (const i in this.actionParameters) {
				actionParameter = this.actionParameters[i];
				this.parametersValues[actionParameter.name] = await this.convertValue(
					actionParameter,
					this.startupParameters[actionParameter.name]?.[0] ?? actionParameter.annotations?.UI?.ParameterDefaultValue?.valueOf()
				);
			}
		}
		return this.parametersValues;
	}

	/**
	 *  Are values provided for the mandatory parameters.
	 * @returns True if the information is provided, otherwise false
	 */
	private isMandatoryValuesProvided(): boolean {
		const hiddenAnnotationSetOnAllActions = this.actionParameters.every(
			(parameter) => parameter?.annotations?.UI?.Hidden?.valueOf() === true
		);

		if (this.parameters.parameterValues?.length && !hiddenAnnotationSetOnAllActions) {
			// If showDialog is false but there are parameters from the invokeAction call which need to be checked on existence
			for (const actionParameter of this.actionParameters) {
				if (
					actionParameter.name !== "ResultIsActiveEntity" &&
					!this.parameters.parameterValues?.find((element) => element.name === actionParameter.name)
				) {
					// At least for one parameter no value has been provided, so we can't skip the dialog
					return false;
				}
			}
		}

		if (this.parameters.isCreateAction === true && Object.keys(this.startupParameters).length && !hiddenAnnotationSetOnAllActions) {
			// If parameters have been provided during application launch, we need to check if the set is complete
			// If not, the parameter dialog still needs to be shown.
			for (const actionParameter of this.actionParameters) {
				if (!this.startupParameters[actionParameter.name]) {
					// At least for one parameter no value has been provided, so we can't skip the dialog
					return false;
				}
			}
		}

		if (this.actionParameters.length && hiddenAnnotationSetOnAllActions) {
			return this.actionParameters.every((parameter) => {
				const fieldControl = parameter.annotations?.Common?.FieldControl;
				const isMandatory = fieldControl?.toString() === "Common.FieldControlType/Mandatory";

				// Possible sources may be startupParameters, parameterValues, defaultValues per annotation (ParameterDefaultValue)
				// If none is found, return false
				return (
					!isMandatory ||
					this.startupParameters[parameter.name] ||
					this.parameters.parameterValues?.find((parameterValue) => parameterValue.name === parameter.name) ||
					parameter?.annotations?.UI?.ParameterDefaultValue?.valueOf()
				);
			});
		}

		return true;
	}

	/**
	 *  Formats the value provided with a non relevant type.
	 * @param parameter The parameter
	 * @param value The value to convert
	 * @returns The converted value
	 */
	private async convertValue(
		parameter: EdmActionParameter,
		value?: BaseTypeParameter | null
	): Promise<BaseTypeParameter | undefined | null> {
		if (value === undefined || value === null) {
			return value;
		}
		const TypeMap = (await import("sap/ui/mdc/odata/v4/TypeMap")).default;
		const parameterType = TypeMap.getBaseType(parameter.type);
		const typeInstance = TypeMap.getDataTypeInstance(parameterType);
		return typeInstance.parseValue(value, "string");
	}
}

import type { Action as EdmAction, PrimitiveType } from "@sap-ux/vocabularies-types";
import { compileConstant, compileExpression, isConstant } from "sap/fe/base/BindingToolkit";
import type { BindContextParameters } from "sap/fe/core/controllerextensions/editFlow/draft";
import Any from "sap/fe/core/controls/Any";
import { isRejected } from "sap/fe/core/helpers/TypeGuards";
import FELibrary from "sap/fe/core/library";
import { getIsActionCriticalExpression } from "sap/fe/core/templating/ActionHelper";
import MessageBox from "sap/m/MessageBox";
import type Message from "sap/ui/core/message/Message";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataPropertyBinding from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type AppComponent from "../../../AppComponent";
import type { FEView } from "../../../BaseController";
import { convertTypes } from "../../../converters/MetaModelConverter";
import * as ResourceModelHelper from "../../../helpers/ResourceModelHelper";
import type MessageHandler from "../../MessageHandler";
import type { OperationResult } from "./ODataOperation";
import ODataOperation from "./ODataOperation";
import OperationMessage from "./OperationMessage";
import OperationParameters from "./OperationParameters";
import actionHelper from "./actionHelper";

const InvocationGrouping = FELibrary.InvocationGrouping;

export type OperationParametersType = {
	messageHandler: MessageHandler;
	view?: FEView;
	parameterValues?: Record<string, PrimitiveType>[];
	label?: string;
	invocationGrouping?: string;
	skipParameterDialog?: boolean;
	skipMessages?: boolean;
	entitySetName?: string;
	oDataProperties?: {
		ghostContextBindingProtection?: boolean;
		enhance$select?: boolean;
		disableStrictHandling?: boolean;
		disableSideEffects?: boolean;
		ignoreETag?: boolean;
		groupId?: string;
		replaceWithRVC?: boolean;
		deferredSubmit?: boolean;
	};
	isCreateAction?: boolean;
	contexts?: Context[];
	bindingParameters?: BindContextParameters;
	defaultValuesExtensionFunction?: string;
	oDataEvents?: {
		onODataResponse?: Function;
		onODataSubmit?: Function;
		onRequestSideEffects?: Function;
		onStrictCancel?: Function;
		onStrictValidation?: Function;
	};
};

export default class Operation {
	private readonly contexts: Context[];

	private executionResolve!: Function;

	private executionReject!: Function;

	private readonly executionPromise = new Promise<PromiseSettledResult<OperationResult>[]>((resolve, reject) => {
		this.executionResolve = resolve;
		this.executionReject = reject;
	});

	private messageCollectedResolve!: Function;

	private messageCollectedPromise!: Promise<void>;

	private readonly operationMessage: OperationMessage;

	private readonly operationParameters: OperationParameters;

	private parametersValues: Record<string, PrimitiveType> = {};

	private numberOfODataExecutions = 0;

	private externalParametersValues = false;

	private odataOperation: ODataOperation | undefined;

	constructor(
		private readonly appComponent: AppComponent,
		private readonly model: ODataModel,
		private readonly convertedAction: EdmAction,
		private readonly parameters: OperationParametersType
	) {
		this.contexts = parameters.contexts ?? [];

		this.setMessageCollectedPromise();

		this.operationMessage = new OperationMessage({
			messageHandler: this.parameters.messageHandler,
			action: this.convertedAction,
			contexts: this.contexts,
			label: this.parameters.label,
			invocationGrouping: this.parameters.invocationGrouping,
			disableNotification: this.parameters.skipMessages,
			entitySetName: this.parameters.entitySetName,
			events: {
				onMessageCollected: (): void => {
					// Due to the mess into the message handling
					// the dialog should be closed or not only after the messages are collected
					// it means in the middle of the message handling workflow via
					// a callback function
					this.manageDialogOnMessages();
					this.messageCollectedResolve();
				},
				onMessagePageNavigationCallback: (): void => {
					this.operationParameters.closeParameterDialog();
				}
			}
		});

		this.operationParameters = new OperationParameters(
			this.appComponent,
			this.model,
			this.convertedAction,
			this.parameters.skipParameterDialog,
			{
				contexts: this.contexts,
				defaultValuesExtensionFunction: this.parameters.defaultValuesExtensionFunction,
				isCreateAction: this.parameters.isCreateAction,
				label: this.parameters.label,
				parameterValues: this.parameters.parameterValues,
				entitySetName: this.parameters.entitySetName,
				view: this.parameters.view,
				messageHandler: this.parameters.messageHandler,
				events: {
					onParameterDialogOpened: this.operationMessage.onParameterDialogOpened.bind(this.operationMessage),
					onParameterDialogClosed: this.operationMessage.onParameterDialogClosed.bind(this.operationMessage)
				}
			}
		);
	}

	clear(): void {
		this.operationParameters.closeParameterDialog();
		this.odataOperation?.clear();
	}

	/**
	 * Set the values related to the parameters  for the operation
	 * If the values are set the operation parameter dialog is skipped.
	 * @param parametersValues The values for the parameters
	 */
	public setDefaultParametersValues(parametersValues: Record<string, PrimitiveType>): void {
		this.parametersValues = parametersValues;
		this.externalParametersValues = true;
	}

	/**
	 * Executes the operation.
	 * @returns A promise containing the results
	 */
	public async execute(): Promise<PromiseSettledResult<OperationResult>[]> {
		this.internalExecution();
		return this.executionPromise;
	}

	/**
	 * Executes the operation.
	 */
	private async internalExecution(): Promise<void> {
		let operationResult: PromiseSettledResult<OperationResult>[] = [];
		try {
			this.numberOfODataExecutions++;
			if (!this.externalParametersValues) {
				this.parametersValues = await this.operationParameters.getOperationParameters();
			}
			if (this.numberOfODataExecutions === 1) {
				await this.confirmAction();
			}
			this.odataOperation = new ODataOperation(
				this.convertedAction,
				{
					appComponent: this.appComponent,
					contexts: this.contexts,
					model: this.model,
					label: this.parameters.label,
					invocationGrouping: this.parameters.invocationGrouping,
					disableStrictHandling: this.parameters.oDataProperties?.disableStrictHandling,
					disableSideEffects: this.parameters.oDataProperties?.disableSideEffects,
					ghostContextBindingProtection: this.parameters.oDataProperties?.ghostContextBindingProtection,
					events: {
						onStrictValidation: this.parameters.oDataEvents?.onStrictValidation,
						onStrictCancel: this.parameters.oDataEvents?.onStrictCancel,
						onStrictResponse: (messages412: Message[]): void => {
							this.parameters.messageHandler.addWarningMessagesToMessageHandler(messages412);
							this.operationMessage.onStrictHandling();
						},
						onODataResponse: this.parameters.oDataEvents?.onODataResponse,
						onODataSubmit: this.parameters.oDataEvents?.onODataSubmit,
						onRequestSideEffects: this.parameters.oDataEvents?.onRequestSideEffects
					},
					parametersValues: this.parametersValues
				},
				{
					enhance$select: this.parameters.oDataProperties?.enhance$select,
					groupId: this.parameters.oDataProperties?.groupId,
					replaceWithRVC: this.parameters.oDataProperties?.replaceWithRVC,
					ignoreETag: this.parameters.oDataProperties?.ignoreETag,
					bindingParameters: this.parameters.bindingParameters,
					deferredSubmit: this.parameters.oDataProperties?.deferredSubmit
				}
			);
			operationResult = await this.odataOperation.execute();
			this.operationMessage.reactToOperations(operationResult);

			if (this.operationParameters.isParameterDialog()) {
				if (!operationResult.some(isRejected)) {
					this.closeDialog();
				} else {
					await this.messageCollectedPromise;
				}
			}

			if (this.operationParameters.isParameterDialogOpened()) {
				this.setMessageCollectedPromise();
				this.internalExecution();
			} else {
				this.executionResolve(operationResult);
			}
		} catch (e) {
			this.executionReject(e);
		}
	}

	/**
	 * Manages the parameter dialog after the messages.
	 */

	private manageDialogOnMessages(): void {
		const isErrorIntoParameterDialog = this.operationMessage.isErrorIntoParameterDialog();

		if (actionHelper.isStaticAction(this.convertedAction) || this.contexts.length === 0) {
			// Don't close the dialog if the action is static or an import
			return this.resetDialog();
		} else if (this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
			// When the end user cancel the process on the strict dialog, we need to keep the parameter dialog (only on ChangeSet) #6376592
			if (isErrorIntoParameterDialog || this.odataOperation?.isStrictCanceled() === true) {
				return this.resetDialog();
			} else {
				return this.closeDialog();
			}
		} else if ((this.parameters.contexts && this.parameters.contexts.length > 1) || !isErrorIntoParameterDialog) {
			// does not matter if error is in APD or not, if there are multiple contexts selected or if the error is not the APD, we close it.
			return this.closeDialog();
		}
		return this.resetDialog();
	}

	/**
	 * Sets the message collected promise.
	 * This promise is resolved when the messages are collected.
	 */
	private setMessageCollectedPromise(): void {
		this.messageCollectedPromise = new Promise<void>((resolve) => {
			this.messageCollectedResolve = resolve;
		});
	}

	/**
	 * Closes the parameter dialog.
	 */
	private closeDialog(): void {
		this.operationParameters.closeParameterDialog();
	}

	/**
	 * Resets the parameter dialog.
	 */
	private resetDialog(): void {
		this.operationParameters.resetParameterDialogState();
	}

	/**
	 * Gets the result of the operation.
	 * @returns The result
	 */
	public async getOperationResults(): Promise<PromiseSettledResult<OperationResult>[]> {
		return this.executionPromise;
	}

	/**
	 * Checks if action is critical.
	 * @returns True if the action is critical, otherwise false
	 */
	private async isActionCritical(): Promise<boolean> {
		//only works with single context (as former code);
		const context = this.parameters.contexts?.[0];
		// default is true.
		let isActionCriticalValue: boolean | Promise<boolean> = true;
		const isActionCriticalBindingExp = getIsActionCriticalExpression(this.convertedAction, convertTypes(this.model.getMetaModel()));
		if (isConstant(isActionCriticalBindingExp)) {
			isActionCriticalValue = compileConstant(isActionCriticalBindingExp, false, undefined, true) as boolean;
		} else if (context) {
			const anyObject = new Any({ anyBoolean: compileExpression(isActionCriticalBindingExp) });
			anyObject.setModel(context.getModel());
			anyObject.setBindingContext(context);
			const booleanBinding = anyObject.getBinding("anyBoolean") as ODataPropertyBinding | undefined;
			if (booleanBinding) {
				if (booleanBinding.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
					await Promise.all(booleanBinding.getBindings().map((nestedBinding) => nestedBinding.requestValue?.()));
				} else {
					await booleanBinding.requestValue?.();
				}
			}
		}
		return isActionCriticalValue;
	}

	/**
	 * Manages the message box to display when an action is critical.
	 * @returns A promise which is resolved if the action is not critical or the message box is closed.
	 */
	private async confirmAction(): Promise<void> {
		if (!this.operationParameters.isParameterDialog()) {
			const isCritical = await this.isActionCritical();
			if (isCritical) {
				const actionName = actionHelper.getActionName(this.convertedAction);
				await new Promise((resolve, reject) => {
					const boundActionName = actionName.includes(".") ? actionName.split(".")[actionName.split(".").length - 1] : actionName;
					const suffixResourceKey =
						boundActionName && this.parameters.entitySetName ? `${this.parameters.entitySetName}|${boundActionName}` : "";

					MessageBox.confirm(
						ResourceModelHelper.getResourceModel(this.parameters.view ?? this.appComponent).getText(
							"C_OPERATIONS_ACTION_CONFIRM_MESSAGE",
							undefined,
							suffixResourceKey
						),
						{
							title: this.getConfirmTitle(suffixResourceKey),
							onClose: (action: string) => {
								if (action === MessageBox.Action.OK) {
									resolve(true);
								} else {
									reject(new Error(FELibrary.Constants.CancelActionDialog));
								}
							}
						}
					);
				});
			}
		}
	}

	getConfirmTitle(suffixResourceKey: string): string | undefined {
		// A title only exists if it has been defined in the extension. Otherwise "Confirmation"
		// is used from the MessageBox control.
		if (!this.parameters.view) {
			return undefined;
		}
		const key = "C_OPERATIONS_ACTION_CONFIRM_TITLE";
		const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.view ?? this.appComponent);
		const titleOverrideExists = resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`);
		if (titleOverrideExists) {
			return resourceModel.getText(key, undefined, suffixResourceKey);
		}
	}
}

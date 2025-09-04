import type { EntitySet } from "@sap-ux/vocabularies-types";
import { type Property } from "@sap-ux/vocabularies-types";
import { compileExpression, or } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, event } from "sap/fe/base/ClassSupport";
import type { ActionParameterInfo } from "sap/fe/core/ActionRuntime";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import type AppComponent from "sap/fe/core/AppComponent";
import type { StandardDialog } from "sap/fe/core/UIProvider";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getRequiredPropertiesFromInsertRestrictions } from "sap/fe/core/helpers/MetaModelFunction";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { enhanceDataModelPath, getTargetObjectPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isRequiredExpression } from "sap/fe/core/templating/FieldControlHelper";
import { hasValueHelp } from "sap/fe/core/templating/PropertyHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { requiresValidation, useCaseSensitiveFilterRequests } from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import EventProvider from "sap/ui/base/EventProvider";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import MDCField, { type Field$ChangeEvent } from "sap/ui/mdc/Field";
import ValueHelp from "sap/ui/mdc/ValueHelp";
import { type FieldBase$LiveChangeEvent } from "sap/ui/mdc/field/FieldBase";
import VHDialog from "sap/ui/mdc/valuehelp/Dialog";
import Popover from "sap/ui/mdc/valuehelp/Popover";
import MTable from "sap/ui/mdc/valuehelp/content/MTable";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

@defineUI5Class("sap.fe.core.services.RoutingServiceEventing")
class ContextUpdateDialogEventProvider extends EventProvider {
	@event()
	exitDialog!: Function;
}

export default class CreateDialog implements StandardDialog {
	private dialog?: Dialog;

	private metaModel: ODataMetaModel;

	private requiredFieldNames: string[];

	private actionParameterInfos: ActionParameterInfo[] = [];

	private eventProvider = new ContextUpdateDialogEventProvider();

	constructor(
		private contextToUpdate: ODataV4Context,
		private fieldNames: string[],
		private appComponent: AppComponent,
		private mode: "Standalone" | "WithNavigation",
		private parentControl?: Control
	) {
		const model: ODataModel = contextToUpdate.getModel();
		this.metaModel = model.getMetaModel();

		const metaPath = this.metaModel.getMetaPath(contextToUpdate.getPath());
		this.requiredFieldNames = getRequiredPropertiesFromInsertRestrictions(metaPath, this.metaModel);
	}

	/**
	 * Attaches an event handler called when the user closes the dialog (either with OK or Cancel).
	 *
	 * The event has an 'accept' parameter that is true (resp. false) if the user clicked on OK (resp. Cancel).
	 * @param oData Payload object that will be passed to the event handler along with the event object when firing the event
	 * @param fnFunction The function to be called when the event occurs
	 * @param oListener Context object to call the event handler with
	 */
	attachExitDialog(oData: object, fnFunction: Function, oListener?: object): void {
		this.eventProvider.attachEvent("exitDialog", oData, fnFunction, oListener);
	}

	private fireExitDialog(accept: boolean): void {
		this.eventProvider.fireEvent("exitDialog", { accept });
	}

	/**
	 * Returns the editMode for a property.
	 * @param property
	 * @returns Display or Editable
	 */
	private getEditMode(property: Property): string {
		if (property.annotations.Common?.FieldControl) {
			const fieldControl = property.annotations.Common.FieldControl as unknown as { $EnumMember?: string };
			return fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly" ? "Display" : "Editable";
		} else {
			return "Editable";
		}
	}

	/**
	 * Returns the popover for the VH typeahead.
	 * @param fieldName
	 * @param property
	 * @param propertyObjectPath
	 * @returns The popover
	 */
	private getFieldVHTypeAhead(fieldName: string, property: Property, propertyObjectPath: DataModelObjectPath<Property>): Popover {
		return (
			<Popover>
				<MTable
					id={generate([fieldName, "VH", "Popover", "qualifier"])}
					caseSensitive={useCaseSensitiveFilterRequests(
						propertyObjectPath,
						(propertyObjectPath.convertedTypes.entityContainer.annotations.Capabilities
							?.FilterFunctions as unknown as string[]) ?? []
					)}
					useAsValueHelp={!!property.annotations.Common?.ValueListWithFixedValues}
				/>
			</Popover>
		);
	}

	/**
	 * Returns the VH dialog for a given property.
	 * @param property
	 * @returns A dialog if the property has a VH, undefined otherwise
	 */
	private getFieldVHDialog(property: Property): VHDialog | undefined {
		if (property.annotations.Common?.ValueListWithFixedValues?.valueOf() !== true) {
			return <VHDialog />;
		} else {
			return undefined;
		}
	}

	/**
	 * Returns the VH for a given field.
	 * @param fieldName
	 * @param property
	 * @param propertyObjectPath
	 * @returns The ValueHelp control if the property has a VH, undefined otherwise
	 */
	private getFieldValueHelp(
		fieldName: string,
		property: Property,
		propertyObjectPath: DataModelObjectPath<Property>
	): ValueHelp | undefined {
		if (!hasValueHelp(property)) {
			return undefined;
		}

		const vhDelegate = {
			name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
			payload: {
				propertyPath: getTargetObjectPath(propertyObjectPath),
				qualifiers: {},
				valueHelpQualifier: ""
			}
		};

		return (
			<ValueHelp
				id={generate([fieldName, "VH"])}
				delegate={vhDelegate}
				validateInput={requiresValidation(property)}
				typeahead={this.getFieldVHTypeAhead(fieldName, property, propertyObjectPath)}
				dialog={this.getFieldVHDialog(property)}
			></ValueHelp>
		);
	}

	/**
	 * Returns the Form element (label + field) for a given property name.
	 * @param fieldName
	 * @param listObjectPath
	 * @param listMetaPath
	 * @returns The element
	 */
	private createFormElement(fieldName: string, listObjectPath: DataModelObjectPath<EntitySet>, listMetaPath: string): unknown {
		const propertyObjectPath = enhanceDataModelPath<Property>(listObjectPath, fieldName);
		const property = propertyObjectPath.targetObject as Property;
		const propertyMetaContext = this.metaModel.createBindingContext(`${listMetaPath}/${fieldName}`)!;
		const propertyPlaceHolderMetaContext = this.metaModel.createBindingContext(
			`${listMetaPath}/${fieldName}@com.sap.vocabularies.UI.v1.Placeholder`
		)!;

		const field = (
			<MDCField
				delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate", payload: { retrieveTextFromValueList: true } }}
				id={generate(["CreateDialog", listObjectPath.targetEntityType.name, fieldName])}
				value={AnnotationHelper.format(propertyMetaContext.getObject(), { context: propertyMetaContext })}
				placeholder={AnnotationHelper.value(propertyPlaceHolderMetaContext.getObject(), {
					context: propertyPlaceHolderMetaContext
				})}
				width="100%"
				required={compileExpression(or(isRequiredExpression(property), this.requiredFieldNames.includes(fieldName)))}
				display={FieldHelper.getAPDialogDisplayFormat(propertyMetaContext.getObject(), { context: propertyMetaContext })}
				valueHelp={hasValueHelp(property) ? generate([fieldName, "VH"]) : undefined}
				editMode={this.getEditMode(property)}
				dependents={this.getFieldValueHelp(fieldName, property, propertyObjectPath)}
				customData={<CustomData key="fieldName" value={fieldName} />}
				liveChange={this.handleLiveChange.bind(this)}
				change={this.handleChange.bind(this)}
			/>
		);

		this.actionParameterInfos.push({
			isMultiValue: false,
			field: field,
			value: field.getValue(),
			validationPromise: undefined,
			hasError: false,
			propertyPath: fieldName
		});

		return (
			<>
				<Label text={property.annotations.Common?.Label} />
				{field}
			</>
		);
	}

	/**
	 * Callback when the dialog is opened. Sets the focus on the first field without opening the VH dialog.
	 */
	private afterOpen(): void {
		const firstField = this.actionParameterInfos[0].field;
		const focusInfo = firstField.getFocusInfo() as { targetInfo: object };
		focusInfo.targetInfo = { silent: true };
		firstField.focus(focusInfo);
	}

	/**
	 * Internal method to create the Dialog control and its content.
	 * @returns The dialog control
	 */
	private createDialog(): Dialog {
		const resourceModel = getResourceModel(this.appComponent);
		const metaPath = this.metaModel.getMetaPath(this.contextToUpdate.getPath());
		const metaContext = this.metaModel.createBindingContext(metaPath)!;
		const objectPath = getInvolvedDataModelObjects<EntitySet>(metaContext);

		this.actionParameterInfos = [];

		const beginButtonLabel = resourceModel.getText(
			this.mode === "Standalone"
				? "C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON_CREATE"
				: "C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON_CONTINUE"
		);
		const endButton = (
			<Button text={resourceModel.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL")} press={this.onCancel.bind(this)} />
		);
		return (
			<Dialog
				id={generate(["CreateDialog", metaPath])}
				title={resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE")}
				afterOpen={(): void => {
					this.afterOpen();
				}}
				resizable={true}
				draggable={true}
				initialFocus={endButton} // The initial focus is set programmatically in afterOpen, to avoid opening the VH dialog
			>
				{{
					beginButton: <Button text={beginButtonLabel} press={this.onOK.bind(this)} type="Emphasized" />,
					endButton: endButton,
					content: (
						<SimpleForm>
							{this.fieldNames.map((name) => {
								return this.createFormElement(name, objectPath, metaPath);
							})}
						</SimpleForm>
					)
				}}
			</Dialog>
		);
	}

	/**
	 * Sets the error state in the dialog fields that correspond to an error in the given messages.
	 * @param messages
	 */
	public displayErrorMessages(messages: Message[]): void {
		// Iterate over all messages and set the error state for the corresponding field
		// We cannot compare the paths directly, as the context in the dialog is a temporary one, and different from the one that is saved
		// Therefore we compare the metapaths
		const contextMetaPath = this.metaModel.getMetaPath(this.contextToUpdate.getPath());

		for (const message of messages) {
			for (const target of message.getTargets()) {
				const targetMetaPath = this.metaModel.getMetaPath(target);
				const parameterInfo = this.actionParameterInfos.find(
					(actionParameterInfo) => `${contextMetaPath}/${actionParameterInfo.propertyPath}` === targetMetaPath
				);
				if (parameterInfo) {
					parameterInfo.hasError = true;
					parameterInfo.field.setValueState(message.getType() || MessageType.Error);
					parameterInfo.field.setValueStateText(message.getMessage());

					const messageControlIDs = message.getControlIds();
					if (!messageControlIDs.includes(parameterInfo.field.getId())) {
						messageControlIDs.push(parameterInfo.field.getId());
					}
				}
			}
		}
	}

	/**
	 * Removes the error messages for a given field.
	 * @param messageControlId The ID of the field
	 */
	private removeMessagesForActionParameter(messageControlId: string): void {
		const allMessages = Messaging.getMessageModel().getData();
		// also remove messages assigned to inner controls, but avoid removing messages for different parameters (with name being substring of another parameter name)
		const relevantMessages = allMessages.filter((msg: Message) =>
			msg.getControlIds().some((controlId: string) => controlId.includes(messageControlId))
		);
		Messaging.removeMessages(relevantMessages);
	}

	/**
	 * Callback when the user is doing some live changes in a field.
	 * @param liveChangeEvent
	 */
	private handleLiveChange(liveChangeEvent: FieldBase$LiveChangeEvent): void {
		const fieldId = liveChangeEvent.getSource<MDCField>().getId();
		this.removeMessagesForActionParameter(fieldId);
	}

	/**
	 * Callback when the user has changed a field value.
	 * @param changeEvent
	 */
	private async handleChange(changeEvent: Field$ChangeEvent): Promise<void> {
		const field = changeEvent.getSource<MDCField>();

		const actionParameterInfo = this.actionParameterInfos.find((actionParameterInfo) => actionParameterInfo.field === field);
		if (actionParameterInfo !== undefined) {
			this.removeMessagesForActionParameter(field.getId());
			actionParameterInfo.validationPromise = changeEvent.getParameter("promise");
			try {
				actionParameterInfo.value = await actionParameterInfo.validationPromise;
				actionParameterInfo.hasError = false;
				actionParameterInfo.field.setValueState(MessageType.None);
			} catch (error) {
				delete actionParameterInfo.value;
				actionParameterInfo.hasError = true;
			}
		}
	}

	/**
	 * Callback when the user clicked 'OK'.
	 */
	private async onOK(): Promise<void> {
		// Validation of mandatory and value state for action parameters
		const resourceModel = getResourceModel(this.appComponent);
		if (await ActionRuntime.validateProperties(this.actionParameterInfos, resourceModel)) {
			this.fireExitDialog(true);
		}
	}

	/**
	 * Callback when the use clicked 'Cancel'.
	 */
	private onCancel(): void {
		this.fireExitDialog(false);
	}

	/**
	 * Escape handler (called when the user typed 'Escape' to leave the dialog).
	 * @param p
	 * @param p.resolve
	 * @param p.reject
	 */
	private onEscape(p: { resolve: Function; reject: Function }): void {
		p.reject(); // Do not close the dialog
		this.onCancel();
	}

	/**
	 * Opens the dialog.
	 * @returns The internal Dialog control
	 */
	openDialog(): Dialog {
		if (this.dialog) {
			throw new Error("Cannot open the Create dialog twice");
		}

		this.dialog = this.createDialog();
		this.dialog.setEscapeHandler(this.onEscape.bind(this));
		this.parentControl?.addDependent(this.dialog);
		this.dialog.setBindingContext(this.contextToUpdate);

		this.dialog.open();

		return this.dialog;
	}

	/**
	 * Closes and destroys the dialog.
	 */
	closeDialog(): void {
		/* When the dialog is cancelled, messages need to be removed in case the same action should be executed again */
		for (const actionParameterInfo of this.actionParameterInfos) {
			const fieldId = actionParameterInfo.field.getId();
			this.removeMessagesForActionParameter(fieldId);
		}

		if (this.dialog && BusyLocker.isLocked(this.dialog)) {
			BusyLocker.unlock(this.dialog); // To avoid an error in the console
		}
		this.dialog?.close();
		this.dialog?.destroy();
		this.dialog = undefined;
	}

	/**
	 * Displays or removes a busy indicator on the dialog.
	 * @param busy
	 */
	setBusy(busy: boolean): void {
		if (!this.dialog) {
			return; // Nothing to set busy
		}

		if (busy) {
			BusyLocker.lock(this.dialog);
		} else {
			BusyLocker.unlock(this.dialog);
		}
	}

	/**
	 * Is Dialog open.
	 * @returns Boolean
	 */
	isOpen(): boolean {
		return this.dialog?.isOpen() ?? false;
	}
}

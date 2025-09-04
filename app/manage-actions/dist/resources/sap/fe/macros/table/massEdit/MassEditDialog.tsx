import type { PrimitiveType } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import { OperationGroupingMode } from "sap/fe/core/converters/ManifestSettings";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import * as ID from "sap/fe/core/helpers/StableIdHelper";
import FELibrary from "sap/fe/core/library";
import type { SideEffectsEntityType, SideEffectsTarget, SideEffectsType } from "sap/fe/core/services/SideEffectsServiceFactory";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageStrip from "sap/m/MessageStrip";
import MessageToast from "sap/m/MessageToast";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Library from "sap/ui/core/Lib";
import type Message from "sap/ui/core/message/Message";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import Form from "sap/ui/layout/form/Form";
import FormContainer from "sap/ui/layout/form/FormContainer";
import FormElement from "sap/ui/layout/form/FormElement";
import ResponsiveGridLayout from "sap/ui/layout/form/ResponsiveGridLayout";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import MassEditField from "./MassEditField";
import MassEditSideEffects from "./MassEditSideEffects";
import type { MassFieldProperties } from "./library";

type MassEditSideEffectsProperties = {
	sideEffects: SideEffectsType;
	tableRefresh: {
		isRequested: boolean;
		targetEntity?: SideEffectsEntityType;
	};
	immediate: { targets: SideEffectsTarget[]; triggerAction: string | undefined };
	deferred: { targets: SideEffectsTarget[]; triggerAction: string | undefined };
};

type FieldValuesInfo = {
	values: Record<string, PrimitiveType>;
	fieldControlReference: { control: MassEditField; values: Record<string, PrimitiveType> }[];
};

export type MassEditSideEffectsExecutionProperties = MassEditSideEffectsProperties & { onRowContext: boolean };

export default class MassEditDialog {
	private readonly requiredDataPromise = new PromiseKeeper<void>();

	private dialog: Dialog | undefined;

	public readonly table: Table;

	public readonly fieldProperties: MassFieldProperties[];

	private readonly view: FEView;

	public readonly contexts: ODataV4Context[];

	private readonly contextsOnError: ODataV4Context[];

	private readonly updatedProperties: Set<string> = new Set();

	private readonly resourceBundle: ResourceBundle;

	public readonly bindingContext: ODataV4Context;

	public readonly transientListBinding: ODataListBinding;

	private readonly fieldControls: MassEditField[];

	private readonly isAdaptation: boolean;

	/**
	 * Constructor of the MassEdit dialog.
	 * @param props Contains the following attributes
	 * @param props.table The table where the changes need to be applied
	 * @param props.contexts The row contexts where the changes need to be applied
	 * @param props.fieldProperties The properties ot the fields
	 */
	constructor(props: { table: Table; contexts: ODataV4Context[]; fieldProperties: MassFieldProperties[] }) {
		this.dialog = undefined;
		this.table = props.table;
		this.contexts = props.contexts;
		this.isAdaptation = CommonUtils.getAppComponent(this.table).isAdaptationMode();
		this.fieldProperties = props.fieldProperties;
		this.view = CommonUtils.getTargetView(this.table);
		this.transientListBinding = this.generateListBinding();
		this.bindingContext = this.transientListBinding.create({}, true);

		this.resourceBundle = Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle;
		this.contextsOnError = [];
		this.fieldControls = [];
	}

	/**
	 * Creates the context for the dialog.
	 * @returns The context.
	 */
	private generateListBinding(): ODataListBinding {
		const listBinding = this.table.getRowBinding();
		const transientListBinding = (this.table.getModel() as ODataModel).bindList(
			listBinding.getPath(),
			listBinding.getContext(),
			[],
			[],
			{
				$$updateGroupId: "submitLater"
			}
		);
		transientListBinding.refreshInternal = (): void => {
			/* */
		};
		return transientListBinding;
	}

	/**
	 * Creates the dialog.
	 * @returns The instance of dialog.
	 */
	async create(): Promise<Dialog> {
		if (!this.dialog) {
			const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core") as ResourceBundle;
			const applyButtonText =
				this.view.getViewData().converterType === "ListReport"
					? this.resourceBundle.getText("C_MASS_EDIT_SAVE_BUTTON_TEXT")
					: coreResourceBundle.getText("C_COMMON_DIALOG_OK");
			const dialogContent = await this.createContent();
			const dialog = (
				<Dialog
					dt:designtime="sap/fe/macros/table/massEdit/designtime/MassEdit.designtime"
					id={ID.generate([this.table.getId(), "MED_", "Dialog"])}
					contentWidth="27rem"
					class="sapUiContentPadding"
					horizontalScrolling="false"
					title={this.resourceBundle.getText("C_MASS_EDIT_DIALOG_TITLE", [this.contexts.length.toString()])}
					content={dialogContent}
					escapeHandler={this.onClose.bind(this)}
					beforeOpen={this.beforeOpen.bind(this)}
					beginButton={<Button text={applyButtonText} type="Emphasized" press={this.onApply.bind(this)} />}
					endButton={<Button text={coreResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL")} press={this.onClose.bind(this)} />}
				/>
			);
			this.dialog = dialog;
			// We don't want to inherit from the PageComponent for the ui model -> into this dialog, fields are editable
			dialog.setModel(new JSONModel({ isEditable: true }), "ui");
			dialog.bindElement({
				path: "/",
				model: "ui"
			});
			return dialog;
		}
		return this.dialog;
	}

	/**
	 * Sets the last configuration before opening the dialog:
	 *  - set the runtime model
	 *  - set the OdataModel
	 *  - add the dialog as dependent of the table.
	 * @param event The ui5 event
	 */
	private beforeOpen(event: UI5Event<{}, Dialog>): void {
		const dialog = event.getSource();
		dialog.setModel(this.table.getModel());
		dialog.setBindingContext(this.bindingContext);
		this.table.addDependent(dialog);
	}

	/**
	 * Closes and destroys the dialog.
	 */
	private onClose(): void {
		this.transientListBinding.destroy();
		if (this.dialog) {
			this.dialog.close();
			this.dialog.destroy();
		}
	}

	/**
	 * Gets the promise of the required data.
	 * This promise is resolved when the required data is loaded.
	 * This data are used on the save workflow to determine if the new data has to be saved or not.
	 * The save workflow is executed only if this promise is resolved.
	 * @returns The promise of the required data.
	 */
	getRequiredDataPromise(): PromiseKeeper<void> {
		return this.requiredDataPromise;
	}

	/**
	 * Manages the messages according to the contexts on error.
	 */
	async manageMessage(): Promise<void> {
		const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core") as ResourceBundle;
		const controller = this.view.getController();
		const DraftStatus = FELibrary.DraftStatus;
		const internalModelContext = this.view.getBindingContext("internal");
		internalModelContext?.setProperty("getBoundMessagesForMassEdit", true);
		await controller.messageHandler.showMessages({
			onBeforeShowMessage: (
				messages: Message[],
				showMessageParameters: {
					fnGetMessageSubtitle?: Function;
					showMessageBox?: boolean;
					showMessageDialog?: boolean;
					filteredMessages?: Message[];
					showChangeSetErrorDialog?: boolean;
				}
			) => {
				showMessageParameters.fnGetMessageSubtitle = messageHandling.setMessageSubtitle.bind({}, this.table, this.contexts);

				if (!this.contextsOnError.length) {
					if (this.updatedProperties.size > 0) {
						//There is at least one new value set
						controller.editFlow.setDraftStatus(DraftStatus.Saved);
						if (this.view.getViewData().converterType === "ListReport") {
							MessageToast.show(this.resourceBundle.getText("C_MASS_EDIT_SUCCESS_TOAST"));
						} else {
							MessageToast.show(this.resourceBundle.getText("C_OBJECT_PAGE_MASS_EDIT_SUCCESS_TOAST"));
						}
					} else {
						MessageToast.show(this.resourceBundle.getText("C_MASS_EDIT_NO_CHANGE"));
					}
				} else if (this.contextsOnError.length < this.contexts.length) {
					controller.editFlow.setDraftStatus(DraftStatus.Saved);
				} else if (this.contextsOnError.length === this.contexts.length) {
					controller.editFlow.setDraftStatus(DraftStatus.Clear);
				}

				if (CommonUtils.getIsEditable(controller) && !messages.some((message) => !message.getTargets())) {
					showMessageParameters.showMessageBox = false;
					showMessageParameters.showMessageDialog = false;
				}
				return showMessageParameters;
			}
		});

		if (!!this.contextsOnError.length && this.contextsOnError.length < this.contexts.length) {
			const confirmButtonTxt = coreResourceBundle.getText("C_COMMON_DIALOG_OK");
			MessageBox.success(
				this.resourceBundle.getText("C_MASS_EDIT_CHANGES_WITH_ERROR", [
					this.contexts.length - this.contextsOnError.length,
					this.contexts.length
				]),
				{
					actions: [confirmButtonTxt],
					emphasizedAction: confirmButtonTxt
				}
			);
		}
		internalModelContext?.setProperty("getBoundMessagesForMassEdit", false);
	}

	/**
	 * Saves the relevant contexts and refreshes the associated properties.
	 * @param fieldValuesInfo The information of the values for all mass edit fields.
	 * @returns A Promise.
	 */
	private async saveChanges(fieldValuesInfo: FieldValuesInfo): Promise<void> {
		const manifestSettings = (this.table.getParent() as TableAPI).getTableDefinition().control.massEdit;
		const isIsolated = manifestSettings.operationGroupingMode === OperationGroupingMode.Isolated;
		const isolatedGroupId = "$auto.Isolated";
		const massEditSideEffects = new MassEditSideEffects(this); // Use the first line as reference context to calculate the map of side effects
		const fieldPromises: Promise<unknown>[] = [];
		const model = this.table.getModel() as ODataModel;

		if (isIsolated) {
			model.setContinueOnError(isolatedGroupId);
		}
		this.contexts.forEach((selectedContext: ODataV4Context) => {
			const immediateSideEffects: { propertyPath: string; groupId: string }[] = [];
			const refreshDescriptions: { control: MassEditField; groupId: string }[] = [];
			for (const { control, values } of fieldValuesInfo.fieldControlReference) {
				let valueHasChanged = false;
				if (!control.isReadOnlyOnContext(selectedContext)) {
					const groupId = isIsolated ? isolatedGroupId : "$auto";
					for (const propertyPath in values) {
						if (selectedContext.getProperty(propertyPath) !== values[propertyPath]) {
							valueHasChanged = true;
							fieldPromises.push(
								selectedContext
									.setProperty(propertyPath, values[propertyPath], groupId)
									.then(() => this.updatedProperties.add(propertyPath))
									.catch((error: unknown) => {
										this.contextsOnError.push(selectedContext);
										Log.error("Mass Edit: Something went wrong in updating entries.", error as string);
									})
							);
							immediateSideEffects.push({
								propertyPath,
								groupId
							});
						}
					}
					if (valueHasChanged) {
						refreshDescriptions.push({ control, groupId });
					}
				}
			}
			fieldPromises.push(
				...immediateSideEffects.map(async (immediateSideEffect) =>
					massEditSideEffects.executeImmediateSideEffects(
						selectedContext,
						immediateSideEffect.propertyPath,
						immediateSideEffect.groupId
					)
				)
			);
			fieldPromises.push(
				...refreshDescriptions.map(async (refreshDescription) =>
					massEditSideEffects.refreshDescription(refreshDescription.control, selectedContext, refreshDescription.groupId)
				)
			);
			if (isIsolated) {
				//Create a new ChangeSet for the next requests
				model.submitBatch(isolatedGroupId);
			}
		});

		await Promise.allSettled(fieldPromises);
		if (this.updatedProperties.size) {
			massEditSideEffects.executeDeferredSideEffects(new Set(["genericField", ...Array.from(this.updatedProperties)]));
		}
	}

	/**
	 * Gets the information of the values for all mass edit fields.
	 * @returns The information.
	 */
	private getFieldValuesInfos(): FieldValuesInfo {
		const result = {
			values: {},
			fieldControlReference: []
		} as FieldValuesInfo;
		for (const fieldControl of this.fieldControls) {
			const fieldValues = fieldControl.getFieldValues();
			result.values = { ...result.values, ...fieldValues };
			result.fieldControlReference.push({ control: fieldControl, values: fieldValues });
		}
		return result;
	}

	/**
	 * Updates the table fields according to the dialog entries.
	 * @returns `true` if the custom save is executed, `false` otherwise.
	 */
	async applyChanges(): Promise<boolean> {
		await this.requiredDataPromise.promise; // We need to wait for the required data to be loaded before saving.
		//We want to skip the patch handler(specific workflow done into the EditFlow) since the patch is managed here
		this.view.getBindingContext("internal")?.setProperty("skipPatchHandlers", true);

		const fieldsValuesInfo = this.getFieldValuesInfos();
		let customSave = false;
		try {
			customSave = await this.view
				.getController()
				.editFlow.customMassEditSave({ aContexts: this.contexts, oUpdateData: fieldsValuesInfo.values });
		} catch (error) {
			Log.error("Mass Edit: Something went wrong in updating entries.", error as string);
		}
		if (!customSave) {
			await this.saveChanges(fieldsValuesInfo);
		}
		this.view.getBindingContext("internal")?.setProperty("skipPatchHandlers", false);
		return customSave;
	}

	/**
	 * Manages the press on the Apply Button.
	 * @returns A promise.
	 */
	private async onApply(): Promise<void> {
		if (this.fieldControls.some((fieldControl) => !fieldControl.isFieldValid())) {
			return;
		}
		if (!this.isAdaptation) {
			messageHandling.removeBoundTransitionMessages();
			messageHandling.removeUnboundTransitionMessages();
			const isCustomSave = await this.applyChanges();
			if (!isCustomSave) {
				this.manageMessage();
			}
		}
		this.onClose();
	}

	/**
	 * Creates the dialog content.
	 * @returns Promise returning instance of fragment.
	 */

	private async createContent(): Promise<Form> {
		const customFormContainer = await this.createCustomContainer();
		return (
			<>
				{this.getAdaptationMessage()}
				<Form>
					{{
						layout: <ResponsiveGridLayout labelSpanM="12" labelSpanL="12" labelSpanXL="12" />,
						formContainers: (
							<>
								{customFormContainer}
								<FormContainer>
									{{
										formElements: this.createFormElements()
									}}
								</FormContainer>
							</>
						)
					}}
				</Form>
			</>
		);
	}

	/**
	 * Gets the adaptation message.
	 * @returns The message strip if the dialog is displayed in adaptation mode.
	 */
	private getAdaptationMessage(): MessageStrip | undefined {
		if (this.isAdaptation) {
			return <MessageStrip text={this.resourceBundle.getText("C_MASS_EDIT_ADAPTATION_MODE")} />;
		}
		return undefined;
	}

	/**
	 * Creates the custom form container according to the manifest settings.
	 * @returns The custom form container.
	 */
	private async createCustomContainer(): Promise<FormContainer | undefined> {
		const manifestSettings = (this.table.getParent() as TableAPI).getTableDefinition().control.massEdit;
		if (manifestSettings.customFragment) {
			if (manifestSettings.fromInline === true) {
				// Inline configuration from a V2 block: the fragment is a string
				if (typeof manifestSettings.customFragment === "string") {
					const resultXML = await XMLPreprocessor.process(
						new DOMParser().parseFromString(manifestSettings.customFragment, "text/xml").firstElementChild,
						{ models: {} },
						(this.view.getController().getOwnerComponent() as EnhanceWithUI5<TemplateComponent>).getPreprocessorContext()
					);
					return (await Fragment.load({
						type: "XML",
						definition: resultXML,
						controller: this.view.getController()
					})) as unknown as FormContainer;
				} else {
					// Inline configuration from a V4 block: the fragment is already a FormContainer
					return manifestSettings.customFragment.clone();
				}
			}
			return (await this.view
				.getController()
				.getExtensionAPI()
				.loadFragment({
					id: "customMassEdit",
					name: manifestSettings.customFragment as string,
					contextPath: this.transientListBinding
						.getModel()
						.getMetaModel()
						.getMetaPath(this.transientListBinding.getResolvedPath())
				})) as FormContainer;
		}
		return undefined;
	}

	/**
	 * Creates the form elements of the dialog.
	 * @returns The form elements.
	 */
	private createFormElements(): FormElement[] {
		return this.fieldProperties.map(this.createFormElement.bind(this));
	}

	/**
	 * Creates the form elements of a Field.
	 * @param fieldInfo The field properties
	 * @returns The form element.
	 */
	private createFormElement(fieldInfo: MassFieldProperties): FormElement {
		return (
			<FormElement visible={fieldInfo.visible}>
				{{
					label: <Label text={fieldInfo.label} id={ID.generate(["MED_", fieldInfo.propertyInfo.key, "Label"])} />,
					fields: this.createFields(fieldInfo)
				}}
			</FormElement>
		);
	}

	/**
	 * Creates the fields of the dialog.
	 * @param fieldInfo The field properties
	 * @returns The fields.
	 */
	private createFields(fieldInfo: MassFieldProperties): Control[] {
		const metaModel = (this.table.getModel() as ODataModel).getMetaModel();
		const context = metaModel.createBindingContext(metaModel.getMetaPath(this.bindingContext.getPath())) as Context;
		const massEditField = new MassEditField(fieldInfo, context);
		this.fieldControls.push(massEditField);
		return massEditField.getControls();
	}
}

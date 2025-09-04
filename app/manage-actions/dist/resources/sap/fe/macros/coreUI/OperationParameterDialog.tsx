import type { ComplexType, PathAnnotationExpression, PrimitiveType, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import { type Action, type ActionParameter } from "@sap-ux/vocabularies-types";
import { type PropertyAnnotations_Core } from "@sap-ux/vocabularies-types/vocabularies/Core_Edm";
import type { DataField, FieldGroupType, ReferenceFacet } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { PathInModelExpression } from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	constant,
	equal,
	getExpressionFromAnnotation,
	ifElse,
	not,
	type BindingToolkitExpression
} from "sap/fe/base/BindingToolkit";
import type { ActionParameterInfo } from "sap/fe/core/ActionRuntime";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import UiModelConstants from "sap/fe/core/controllerextensions/editFlow/editFlowConstants";
import actionHelper from "sap/fe/core/controllerextensions/editFlow/operations/actionHelper";
import operations from "sap/fe/core/controllerextensions/editFlow/operations/facade";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { hasFieldGroupTarget } from "sap/fe/core/converters/annotations/DataField";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import FELibrary from "sap/fe/core/library";
import { getTargetNavigationPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isActionParameterRequiredExpression, isDisabledExpression, isReadOnlyExpression } from "sap/fe/core/templating/FieldControlHelper";
import { hasValueHelp, isMultiLineText } from "sap/fe/core/templating/PropertyHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { requiresValidation, useCaseSensitiveFilterRequests } from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";
import type ListReportExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type ObjectPageExtensionAPI from "sap/fe/templates/ObjectPage/ExtensionAPI";
import Button from "sap/m/Button";
import type { Dialog$BeforeOpenEvent } from "sap/m/Dialog";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageStrip from "sap/m/MessageStrip";
import Messaging from "sap/ui/core/Messaging";
import Title from "sap/ui/core/Title";
import type Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import Field from "sap/ui/mdc/Field";
import type { MultiValueField$ChangeEvent } from "sap/ui/mdc/MultiValueField";
import MultiValueField from "sap/ui/mdc/MultiValueField";
import ValueHelp from "sap/ui/mdc/ValueHelp";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import VHDialog from "sap/ui/mdc/valuehelp/Dialog";
import Popover from "sap/ui/mdc/valuehelp/Popover";
import MTable from "sap/ui/mdc/valuehelp/content/MTable";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type {
	FileUploader$ChangeEvent,
	FileUploader$FileSizeExceedEvent,
	FileUploader$TypeMissmatchEvent,
	FileUploader$UploadCompleteEvent
} from "sap/ui/unified/FileUploader";
import FileUploader from "sap/ui/unified/FileUploader";
import FileUploaderHttpRequestMethod from "sap/ui/unified/FileUploaderHttpRequestMethod";
import { displayMessageForFailedUpload, showFileSizeExceedDialog, showTypeMismatchDialog } from "../internal/helpers/Upload";

type ParameterDefaultValue = { paramName: string; value: unknown; latePropertyError?: boolean; noPossibleValue?: boolean };

type ElementGroup = { facetTitle: PropertyAnnotationValue<string> | undefined; data: ActionParameter[] };
type ElementGroupConverted = { facetTitle: PropertyAnnotationValue<string> | undefined; data: DialogContentTypes[] };

type FormElementType = [Label, Field | MultiValueField];

type DialogContentTypes = {
	formElements: FormElementType;
	parameter: ActionParameter;
};
export default class ActionParameterDialog {
	private parametersValuesPromise: Promise<Record<string, PrimitiveType>>;

	private parametersValuesResolve!: (resolveValue: Record<string, PrimitiveType>) => void;

	private parametersValuesReject!: (error: unknown) => void;

	// the dialog is considered as closed after the afterClose event has been triggered
	// this is asynchronous, so we need to keep track of the dialog state since the message handling is synchronous
	// and we need to know if the dialog is open or closed
	private isDialogOpen = false;

	private dialog: Dialog | undefined;

	private readonly actionName: string;

	private buttonLock = false;

	private readonly metaModel: ODataMetaModel;

	private readonly actionParameterInfos: (ActionParameterInfo & { parameter: ActionParameter })[] = [];

	private readonly parameterModel: JSONModel = new JSONModel({
		$displayMode: {}
	});

	private readonly resourceModel: ResourceModel;

	constructor(
		private readonly action: Action,
		private readonly parameters: {
			appComponent: AppComponent;
			contexts: ODataV4Context[];
			parametersValues: Record<string, PrimitiveType>;
			defaultValuesExtensionFunction?: string;
			isCreateAction?: boolean;
			label?: string;
			model: ODataModel;
			view?: FEView;
			events?: {
				onParameterDialogOpened?: () => void;
				onParameterDialogClosed?: () => void;
			};
		},
		private readonly parameterValues: Record<string, unknown>[] | undefined,
		private readonly entitySetName: string | undefined,
		private readonly messageHandler: MessageHandler
	) {
		this.actionName = actionHelper.getActionName(this.action);
		this.metaModel = this.parameters.model.getMetaModel();
		this.resourceModel = this.parameters.view ? getResourceModel(this.parameters.view) : getResourceModel(this.parameters.appComponent);
		this.parametersValuesPromise = new Promise((resolve, reject) => {
			this.parametersValuesResolve = resolve;
			this.parametersValuesReject = reject;
		});
	}

	/**
	 * Gets binding expression of the edit mode property for a parameter.
	 * @param parameter The parameter
	 * @returns The binding expression.
	 */
	private getParameterEditMode(parameter: ActionParameter): BindingToolkitExpression<FieldEditMode> {
		const annotations = parameter.annotations,
			fieldControl = annotations.Common?.FieldControl,
			immutable = (annotations.Core as unknown as PropertyAnnotations_Core)?.Immutable?.valueOf(),
			computed = (annotations.Core as unknown as PropertyAnnotations_Core)?.Computed?.valueOf();

		if (immutable || computed) {
			return constant(FieldEditMode.ReadOnly);
		} else if (fieldControl) {
			return ifElse(
				isReadOnlyExpression(parameter),
				FieldEditMode.ReadOnly,
				ifElse(isDisabledExpression(parameter), FieldEditMode.Disabled, FieldEditMode.Editable)
			);
		}
		return constant(FieldEditMode.Editable);
	}

	/**
	 * Creates the form element control for a parameter.
	 * @param parameter The parameter
	 * @returns The form element control.
	 */
	private async createFormElement(parameter: ActionParameter): Promise<FormElementType> {
		const actionMetaPath = this.action.isBound
			? `${this.metaModel.getMetaPath(this.parameters.contexts[0].getPath())}/${convertTypes(this.metaModel).namespace}.${
					this.action.name
			  }`
			: `/${this.action.name}`;
		const metaContext = this.metaModel.createBindingContext(`${actionMetaPath}/${parameter.name}`)!;
		let field;
		let label = parameter.annotations.Common?.Label
			? this.resourceModel.getText(parameter.annotations.Common.Label.toString())
			: parameter.name;
		let streamParameter;
		if (parameter.isCollection) {
			field = await this.createMultiField(parameter, metaContext);
		} else if (!parameter.type.startsWith("Edm.") && this.getStreamProperty(parameter)) {
			streamParameter = this.getStreamProperty(parameter);
			// calculate label from the stream property within the ComplexType
			label = streamParameter?.annotations.Common?.Label
				? this.resourceModel.getText(streamParameter.annotations.Common.Label.toString())
				: (streamParameter?.name as string);
			field = this.createFileUploader(parameter);
		} else {
			field = await this.createField(parameter, metaContext);
		}
		return (
			<>
				<Label id={generate(["APD_", parameter.name, streamParameter?.name, "Label"])} text={label} />
				{field}
			</>
		);
	}

	/**
	 * Creates the multi field control for a parameter.
	 * @param parameter The parameter
	 * @param parameterContext The parameter context
	 * @returns The multi value field control.
	 */
	private async createMultiField(parameter: ActionParameter, parameterContext: Context): Promise<MultiValueField> {
		let display = "Value";
		try {
			display = await FieldHelper.getAPDialogDisplayFormat(parameterContext.getObject(), { context: parameterContext });
		} catch (err: unknown) {
			Log.warning(`Parameter dialog multifield: display format couldn't be calculated for parameter '${parameter.name}': ${err}`);
		}
		return (
			<MultiValueField
				id={generate(["APD_", parameter.name])}
				placeholder={parameter.annotations.UI?.Placeholder}
				items={{ path: `mvfview>/${parameter.name}` }}
				delegate={{ name: "sap/fe/core/controls/MultiValueParameterDelegate" }}
				display={display}
				editMode={this.getParameterEditMode(parameter)}
				width="100%"
				multipleLines={parameter.annotations.UI?.MultiLineText?.valueOf() === true}
				required={compileExpression(isActionParameterRequiredExpression(parameter, this.action, convertTypes(this.metaModel)))}
				valueHelp={hasValueHelp(parameter) ? generate([this.actionName, parameter.name]) : undefined}
				change={async (e): Promise<void> => this.handleFieldChange(e, parameter)}
				visible={compileExpression(not(equal(getExpressionFromAnnotation(parameter.annotations?.UI?.Hidden), true)))}
				ariaLabelledBy={[generate(["APD_", parameter.name, "Label"])]}
				dependents={this.createParameterDialogValueHelp(parameter, parameterContext)}
			>
				<MultiValueFieldItem key="{path: 'mvfview>Key', type:'sap.ui.model.type.String'}" description="{mvfview>Desc}" />
			</MultiValueField>
		);
	}

	/**
	 * Creates the FileUploader control for a parameter.
	 * @param parameter The parameter
	 * @returns The FileUploader control.
	 */
	private createFileUploader(parameter: ActionParameter): FileUploader {
		let fileAcceptableMediaTypes;
		if (this.getStreamProperty(parameter)?.annotations.Core?.AcceptableMediaTypes) {
			const acceptedTypes = Array.from(
				this.getStreamProperty(parameter)?.annotations.Core?.AcceptableMediaTypes as unknown as string[]
			).map((type) => `'${type}'`);
			fileAcceptableMediaTypes = `{=odata.collection([${acceptedTypes.join(",")}])}`;
		}
		const handleTypeMissmatch = function (event: FileUploader$TypeMissmatchEvent): void {
			const fileUploader = event.getSource();
			const givenType = event.getParameter("mimeType");
			const acceptedTypes = fileUploader.getMimeType();
			if (givenType) {
				showTypeMismatchDialog(fileUploader, givenType, acceptedTypes);
			}
		};
		// verify check for stream
		const fileMaximumSize = FieldHelper.calculateMBfromByte(this.getStreamProperty(parameter)?.maxLength);
		const handleFileSizeExceed = function (event: FileUploader$FileSizeExceedEvent): void {
			const fileUploader = event?.getSource();
			showFileSizeExceedDialog(fileUploader, fileUploader.getMaximumFileSize().toFixed(3));
		};
		const onUploadComplete = function (event: FileUploader$UploadCompleteEvent): void {
			if (event.getParameter("status") === 0 || (event.getParameter("status") as number) >= 400) {
				displayMessageForFailedUpload(
					event.getSource(),
					(event.getParameter("responseRaw") as string) || (event.getParameter("response") as string)
				);
			}
		};
		return (
			<FileUploader
				name="FEV4FileUpload"
				buttonOnly="false"
				iconOnly="true"
				multiple="false"
				tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_UPLOAD_BUTTON_TOOLTIP}"
				icon="sap-icon://upload"
				style="Transparent"
				sendXHR="true"
				useMultipart="false"
				sameFilenameAllowed="true"
				uploadOnChange="false"
				mimeType={fileAcceptableMediaTypes}
				typeMissmatch={handleTypeMissmatch}
				maximumFileSize={fileMaximumSize}
				fileSizeExceed={handleFileSizeExceed}
				httpRequestMethod={FileUploaderHttpRequestMethod.Put}
				uploadComplete={onUploadComplete}
				change={async (e): Promise<void> => this.handleFileUploaderChange(e, parameter)}
			/>
		);
	}

	/**
	 * Creates the field control for a parameter.
	 * @param parameter The parameter
	 * @param parameterContext The parameter context
	 * @returns The field control.
	 */
	private async createField(parameter: ActionParameter, parameterContext: Context): Promise<Field> {
		let display = "Value";
		try {
			display = await FieldHelper.getAPDialogDisplayFormat(parameterContext.getObject(), { context: parameterContext });
		} catch (err: unknown) {
			Log.warning(`Parameter dialog field: display format couldn't be calculated for parameter '${parameter.name}': ${err}`);
		}
		return (
			<Field
				delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate", payload: { retrieveTextFromValueList: true } }}
				id={generate(["APD_", parameter.name])}
				value={AnnotationHelper.format(parameterContext.getObject(), { context: parameterContext })}
				placeholder={parameter.annotations.UI?.Placeholder}
				display={display}
				editMode={this.getParameterEditMode(parameter)}
				width="100%"
				multipleLines={isMultiLineText(parameter)}
				required={compileExpression(isActionParameterRequiredExpression(parameter, this.action, convertTypes(this.metaModel)))}
				change={async (e): Promise<void> => this.handleFieldChange(e, parameter)}
				valueHelp={hasValueHelp(parameter) ? generate([this.actionName, parameter.name]) : undefined}
				dependents={this.createParameterDialogValueHelp(parameter, parameterContext)}
				visible={compileExpression(
					ifElse(
						parameter.name === "ResultIsActiveEntity",
						false,
						not(equal(getExpressionFromAnnotation(parameter.annotations?.UI?.Hidden), true))
					)
				)}
				ariaLabelledBy={[generate(["APD_", parameter.name, "Label"])]}
			/>
		);
	}

	/**
	 * Creates the valueHelp  for a parameter.
	 * @param parameter The parameter
	 * @param parameterContext The parameter context
	 * @returns A valueHelp if the parameter has a VH, undefined otherwise
	 */
	private createParameterDialogValueHelp(parameter: ActionParameter, parameterContext: Context): ValueHelp | undefined {
		if (!hasValueHelp(parameter)) {
			return undefined;
		}
		return (
			<ValueHelp
				id={generate([this.actionName, parameter.name])}
				delegate={{
					name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
					payload: {
						propertyPath: this.action.isBound
							? `${getTargetNavigationPath(getInvolvedDataModelObjects<ActionParameter>(parameterContext))}/${
									this.actionName
							  }/${parameter.name}`
							: `/${this.action.name.substring(this.action.name.lastIndexOf(".") + 1)}/${parameter.name}`,
						qualifiers: {},
						valueHelpQualifier: ""
					}
				}}
				validateInput={requiresValidation(parameter)}
				typeahead={
					<Popover>
						<MTable
							id={generate([this.actionName, parameter.name, "Popover", "qualifier"])}
							caseSensitive={
								this.action.isBound
									? useCaseSensitiveFilterRequests(
											getInvolvedDataModelObjects<ActionParameter>(parameterContext),
											(convertTypes(this.metaModel).entityContainer.annotations.Capabilities
												?.FilterFunctions as unknown as string[]) ?? []
									  )
									: false
							}
							useAsValueHelp={!!parameter.annotations.Common?.ValueListWithFixedValues}
						/>
					</Popover>
				}
				dialog={this.createFieldVHDialog(parameter)}
			></ValueHelp>
		);
	}

	/**
	 * Creates the ValueHelp dialog for a parameter.
	 * @param parameter The parameter
	 * @returns A dialog if the parameter has a VH, undefined otherwise
	 */
	private createFieldVHDialog(parameter: ActionParameter): VHDialog | undefined {
		if (parameter.annotations.Common?.ValueListWithFixedValues?.valueOf() !== true) {
			return <VHDialog />;
		} else {
			return undefined;
		}
	}

	/**
	 * Handles the field change event for a parameter.
	 * @param event The ui5 event
	 * @param parameter The parameter
	 * @returns Promise.
	 */
	private async handleFieldChange(event: MultiValueField$ChangeEvent | Field$ChangeEvent, parameter: ActionParameter): Promise<void> {
		const fieldPromise = (event as Field$ChangeEvent).getParameter("promise");
		const field = (event as Field$ChangeEvent).getSource() as Field | MultiValueField;
		const parameterInfo = this.actionParameterInfos.find((actionParameterInfo) => actionParameterInfo.field === field);
		if (!parameterInfo) {
			return;
		}
		parameterInfo.validationPromise = fieldPromise;
		// field value is being changed, thus existing messages related to that field are not valid anymore
		this.removeMessagesForParameter(parameter);
		try {
			parameterInfo.value = await fieldPromise;
			this.parameters.parametersValues[parameterInfo.parameter.name] = parameterInfo.value;
			parameterInfo.hasError = false;
		} catch (error) {
			delete parameterInfo.value;
			parameterInfo.hasError = true;
			ActionRuntime._addMessageForActionParameter([
				{
					actionParameterInfo: parameterInfo,
					message: (error as { message: string }).message
				}
			]);
		}
	}

	/**
	 * Handles the FileUploader change event for a parameter.
	 * @param event The SAPUI5 event corresponding to the FileUploader change event.
	 * @param parameter The action parameter.
	 * @returns Promise.
	 */
	private async handleFileUploaderChange(event: FileUploader$ChangeEvent, parameter: ActionParameter): Promise<void> {
		const files = event.getParameter("files");
		const fileUploader = event.getSource();
		// correction needed for multiple file uploaders
		const parameterInfo = this.actionParameterInfos.find((actionParameterInfo) => actionParameterInfo.field === fileUploader);
		if (!parameterInfo || !files) {
			return;
		}
		this.removeMessagesForParameter(parameter);
		parameterInfo.value = {};
		if (this.getStreamProperty(parameter)) {
			parameterInfo.value[this.getStreamProperty(parameter)?.name as keyof typeof parameterInfo.value] =
				await this.getBase64File(files);
			parameterInfo.value[(this.getMimeTypePath(parameter) as PathInModelExpression<string>).path] =
				(files[0] as File).type || "application/octet-stream";
			parameterInfo.value[this.getFileNamePath(parameter) as string] = (files[0] as File).name;
			parameterInfo.hasError = false;
			this.parameters.parametersValues[parameterInfo.parameter.name] = parameterInfo.value;
		}
	}

	/**
	 * Provides the property name for the file name associated with the Stream property in the action parameter.
	 * @param parameter The action parameter.
	 * @returns Path as a string.
	 */
	private getFileNamePath(parameter: ActionParameter): string | undefined {
		return (this.getStreamProperty(parameter)?.annotations.Core?.ContentDisposition?.Filename as PathAnnotationExpression<string>).path;
	}

	/**
	 * Provides the property name for the Mime type with the associated Stream property in the action parameter.
	 * @param parameter The action parameter.
	 * @returns The path expression.
	 */
	private getMimeTypePath(parameter: ActionParameter): BindingToolkitExpression<string> | undefined {
		return getExpressionFromAnnotation(this.getStreamProperty(parameter)?.annotations.Core?.MediaType);
	}

	/**
	 * Provides the Stream property associated with the Complex type action parameter.
	 * @param parameter The action parameter.
	 * @returns The Edm.Stream property.
	 */
	private getStreamProperty(parameter: ActionParameter): Property | undefined {
		return (parameter.typeReference as ComplexType).properties?.find((property) => property.type === "Edm.Stream");
	}

	/**
	 * Provides the content of the file.
	 * @param files The file selected.
	 * @returns The file content.
	 */
	private async getBase64File(files: object[]): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (): void => {
				if (!reader.result) {
					return;
				}
				resolve((reader.result as string).split(",")[1]);
			};
			reader.readAsDataURL((files as unknown as FileList).item(0)!);
		});
	}

	/**
	 * Removes the messages for a parameter.
	 * @param parameter The parameter
	 */
	private removeMessagesForParameter(parameter: ActionParameter): void {
		const messages = Messaging.getMessageModel().getData();
		const controlId = generate(["APD_", parameter.name]);
		// also remove messages assigned to inner controls, but avoid removing messages for different parameters (with name being substring of another parameter name)
		const relevantMessages = messages.filter((msg: Message) =>
			msg.getControlIds().some((id: string) => controlId.split("-").includes(id))
		);
		Messaging.removeMessages(relevantMessages);
	}

	/**
	 * Gets the FormElements along with the array of parameters.
	 * @param parameter The parameter
	 * @returns The parameter information along with the FormElements.
	 */
	private async getFormElements(parameter: ActionParameter): Promise<DialogContentTypes> {
		const formElements = await this.createFormElement(parameter);
		return {
			formElements: formElements,
			parameter: parameter
		};
	}

	/**
	 * Gets the action parameter dialog.
	 * @returns The dialog or undefined.
	 */
	getDialog(): Dialog | undefined {
		return this.dialog;
	}

	/**
	 * Creates the action parameter dialog.
	 * @returns The dialog.
	 */
	async createDialog(): Promise<Dialog> {
		let dialogContents: FormElementType[] = [];
		let dialogContentsWithParameters: DialogContentTypes[] = [];
		const actionParameters = this.action.isBound ? this.action.parameters.slice(1) : this.action.parameters;

		// If OperationalParameterFacets have been defined for this action, they are used to group the action parameters
		// with titles
		if (this.action.annotations?.UI?.OperationParameterFacets) {
			const actionParameterGroups: ElementGroup[] = [];
			this.action.annotations.UI?.OperationParameterFacets?.forEach(function (facet: ReferenceFacet) {
				let facetTitle;
				if (facet.$Type === UIAnnotationTypes.ReferenceFacet) {
					facetTitle = facet.Label;
				}
				if (hasFieldGroupTarget(facet)) {
					const fieldGroup = facet?.Target?.$target as FieldGroupType;
					const groupedActionParameters: ActionParameter[] = [];

					fieldGroup.Data.forEach(function (group: unknown) {
						groupedActionParameters.push((group as DataField).Value.$target as ActionParameter);
					});
					actionParameterGroups.push({
						facetTitle: facetTitle as PropertyAnnotationValue<string> | undefined,
						data: groupedActionParameters
					});
				}
			});

			// Get the fields for each parameter group
			const getGroupForm = async (group: ElementGroup): Promise<ElementGroupConverted> => {
				const formElements = await Promise.all(group.data.map(this.getFormElements.bind(this)));
				return { facetTitle: group.facetTitle, data: formElements };
			};

			const formData = actionParameterGroups.map(async (parameterGroup) => getGroupForm(parameterGroup));
			const opFacets = await Promise.all(formData);

			// Add the title control to each parameter group
			opFacets.forEach((dialogContent) => {
				dialogContents.push(<Title text={dialogContent.facetTitle} />);
				return dialogContent.data.map((element) => dialogContents.push(element.formElements));
			});

			opFacets.forEach(function (opFacet) {
				opFacet.data.forEach(function (element) {
					dialogContentsWithParameters.push(element);
				});
			});
		} else {
			// No OperationParameterFacets have been defined
			dialogContentsWithParameters = await Promise.all(actionParameters.map(this.getFormElements.bind(this)));
			dialogContents = dialogContentsWithParameters.map((dialogContent) => {
				return dialogContent.formElements;
			});
		}

		this.registerActionParameterInfo(dialogContentsWithParameters);

		// In case of deferred create we have no view, so we need to get the resource model from the app component

		const messageStrip = this.getCustomActionMessageStripText();

		const endButton = (
			<Button
				id={generate(["fe", "APD_", this.actionName, "Action", "Cancel"])}
				text={this.resourceModel.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL")}
				press={(): void => {
					this.onCancel.bind(this)();
				}}
			/>
		);
		const dialog = (
			<Dialog
				title={this.getTitleText(this.parameters.label)}
				id={generate(["fe", "APD_", this.actionName])}
				escapeHandler={this.onCancel.bind(this)}
				draggable={true}
				resizable={true}
				afterClose={this.afterClose.bind(this)}
				beforeOpen={this.beforeOpen.bind(this)}
				afterOpen={(): void => {
					this.afterOpen();
				}}
				initialFocus={endButton} // The initial focus is set programmatically in afterOpen, to avoid opening the VH dialog
			>
				{{
					beginButton: (
						<Button
							id={generate(["fe", "APD_", this.actionName, "Action", "Ok"])}
							text={
								this.parameters.isCreateAction === true
									? this.resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON_CONTINUE")
									: this.getBeginButtonLabel(this.parameters.label)
							}
							press={(): void => {
								this.onApply.bind(this)();
							}}
							type="Emphasized"
						/>
					),
					endButton: endButton,
					content: (
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore (unknown property binding)
						// columnsM only takes effect if there are titles in the content.
						<>
							{messageStrip && <MessageStrip showIcon="true" text={messageStrip}></MessageStrip>}
							<SimpleForm columnsM={"2"} editable="true" labelSpanL={"12"} labelSpanM={"12"} binding={"$Parameter"}>
								{{ content: dialogContents }}
							</SimpleForm>
						</>
					)
				}}
			</Dialog>
		);
		this.dialog = dialog;
		return dialog;
	}

	/**
	 * Gets the label for the begin button of the dialog.
	 * @param actionLabel The label of the action
	 * @returns The label.
	 */
	private getBeginButtonLabel(actionLabel: string | undefined): string {
		const key = "ACTION_PARAMETER_DIALOG_ACTION_NAME";
		const defaultKey = "C_COMMON_DIALOG_OK";
		return this.getOverriddenText(key, defaultKey, actionLabel);
	}

	/**
	 * Gets the title of the dialog.
	 * @param actionLabel The label of the action
	 * @returns The title.
	 */
	private getTitleText(actionLabel: string | undefined): string {
		const key = "ACTION_PARAMETER_DIALOG_ACTION_TITLE";
		const defaultKey = "C_OPERATIONS_ACTION_PARAMETER_DIALOG_TITLE";
		return this.getOverriddenText(key, defaultKey, actionLabel);
	}

	/**
	 * Gets an overridden text for message strip.
	 * @returns The overridden text for message strip.
	 */
	private getCustomActionMessageStripText(): string | undefined {
		const key = "ACTION_PARAMETER_DIALOG_MESSAGE_TEXT";
		let boundActionName = this.actionName;
		boundActionName = boundActionName.split(".").pop() ?? boundActionName;
		const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
		if (this.resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`)) {
			return this.resourceModel.getText(key, undefined, suffixResourceKey);
		} else if (this.resourceModel.checkIfResourceKeyExists(`${key}|${this.entitySetName}`)) {
			return this.resourceModel.getText(key, undefined, `${this.entitySetName}`);
		} else if (this.resourceModel.checkIfResourceKeyExists(`${key}`)) {
			return this.resourceModel.getText(key);
		}
		return undefined;
	}

	/**
	 * Gets an overridden text.
	 * @param key The key for an overridden text
	 * @param defaultKey The default key for the text
	 * @param actionLabel The label of the action
	 * @returns The overridden text or label.
	 */
	private getOverriddenText(key: string, defaultKey: string, actionLabel?: string): string {
		let boundActionName = this.actionName;
		boundActionName = boundActionName.split(".").pop() ?? boundActionName;
		const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
		if (actionLabel) {
			if (this.resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`)) {
				return this.resourceModel.getText(key, undefined, suffixResourceKey);
			} else if (this.resourceModel.checkIfResourceKeyExists(`${key}|${this.entitySetName}`)) {
				return this.resourceModel.getText(key, undefined, `${this.entitySetName}`);
			} else if (this.resourceModel.checkIfResourceKeyExists(`${key}`)) {
				return this.resourceModel.getText(key);
			} else {
				return actionLabel;
			}
		} else {
			return this.resourceModel.getText(defaultKey);
		}
	}

	/**
	 * Manages the press event of the begin button of the dialog.
	 * @returns The promise.
	 */
	private async onApply(): Promise<void> {
		// prevent multiple press events. The BusyLocker is not fast enough. (BCP: 2370130210)
		if (this.buttonLock || !this.dialog) {
			return;
		}
		const dialog = this.dialog;

		const parameterContext = (dialog.getObjectBinding() as ODataContextBinding | undefined)?.getParameterContext();

		// lock the button to prevent multiple press events
		this.buttonLock = true;
		BusyLocker.lock(dialog);

		// validate the action parameters. It is important to do this as a first operation as there is a
		// wait done for the value changes to complete updating the model. Even in cases where validation is
		// not configured this promise needs to be resolved to read from the model to return user entered values.
		if (!(await ActionRuntime.validateProperties(this.actionParameterInfos, this.resourceModel))) {
			BusyLocker.unlock(dialog);
			this.buttonLock = false;
			return;
		}

		const newValuesDictionary = Object.assign(
			{},
			...this.actionParameterInfos.map((actionParameterInfos) => {
				const parameter = actionParameterInfos.parameter;
				let value;
				if (parameter.isCollection) {
					value = Object.values((dialog.getModel("mvfview") as JSONModel).getProperty(`/${parameter.name}`) ?? {}).map(
						(paramValue) => (paramValue as { Key?: PrimitiveType })?.Key
					);
				} else if (!parameter.type.startsWith("Edm.") && this.getStreamProperty(parameter)) {
					// File Uploader
					value = actionParameterInfos.value;
				} else {
					value = parameterContext?.getProperty(parameter.name);
				}
				return { [parameter.name]: value };
			})
		) as Record<string, PrimitiveType>;
		const isNewValue = Object.values(newValuesDictionary).some((value) => !!value);

		this.parametersValuesResolve(newValuesDictionary);

		this.parameters.appComponent.getModel("ui").setProperty(UiModelConstants.DocumentModified, isNewValue);
		// Due to using the search and value helps on the action dialog transient messages could appear
		// we need an UX design for those to show them to the user - for now remove them before continuing
		this.messageHandler.removeTransitionMessages();
	}

	/**
	 * Reset the state of the dialog to start a new iteration.
	 *
	 */
	public resetState(): void {
		this.unlockDialog();
		this.buttonLock = false;
		this.updateDialogBindingContextForError();
		this.parametersValuesPromise = new Promise((resolve, reject) => {
			this.parametersValuesResolve = resolve;
			this.parametersValuesReject = reject;
		});
	}

	/**
	 * Change the binding context of the dialog to one with priority message.
	 *
	 * On initial action execution, we might have bound messages with any selected contexts as target apart from the dialog's initial context.
	 * We change the binding context of dialog for the parameter fields' to get the valid value state from the priority bound message.
	 */
	updateDialogBindingContextForError(): void {
		if (this.parameters.contexts.length < 2) {
			// We would need to switch the binding context of the dialog only when we have multiple contexts for executing the action.
			return;
		}

		let warningContext: ODataV4Context | undefined, infoContext: ODataV4Context | undefined;
		const erroneousCtx = this.parameters.contexts.find((context) => {
			const messages = context.getMessages();
			return messages.some((msg) => {
				// We hold first context with warning or info messages.
				warningContext = !warningContext && msg.getType() === MessageType.Warning ? context : undefined;
				infoContext = !infoContext && msg.getType() === MessageType.Information ? context : undefined;
				// Error is found!!! We shall exit.
				return msg.getType() === MessageType.Error;
			});
		});
		const contextToUse = erroneousCtx ?? warningContext ?? infoContext;

		if (contextToUse) {
			this.dialog?.setBindingContext(contextToUse);
		}
	}

	/**
	 * Removes the busy state of the dialog.
	 */
	private unlockDialog(): void {
		if (this.dialog && BusyLocker.isLocked(this.dialog)) {
			BusyLocker.unlock(this.dialog);
		}
	}

	/**
	 * Handler for the cancel action of the dialog.
	 */
	private onCancel(): void {
		this.parametersValuesReject(FELibrary.Constants.CancelActionDialog);
		this.closeDialog();
	}

	/**
	 * Closes the dialog.
	 */
	public closeDialog(): void {
		if (this.dialog) {
			this.parameters.events?.onParameterDialogClosed?.();
			this.dialog.close();
		}
		this.isDialogOpen = false;
	}

	/**
	 * Opens the dialog.
	 * @returns The promise of the action result.
	 */
	async openDialog(): Promise<void> {
		if (!this.dialog) {
			throw new Error("Error on opening the dialog");
		}
		await CommonUtils.setUserDefaults(
			this.parameters.appComponent,
			this.actionParameterInfos.map((actionParameterInfo) => actionParameterInfo.parameter),
			this.parameterModel,
			true
		);
		this.setModels(this.dialog);
		this.parameters.view?.addDependent(this.dialog);
		await this.setOperationDefaultValues(this.dialog);
		this.dialog.open();
		this.isDialogOpen = true;
	}

	/**
	 * Sets the model configuration for the dialog.
	 * @param dialog The owner of the dialog
	 */
	private setModels(dialog: Dialog): void {
		dialog.setModel(this.parameterModel, "paramsModel");
		dialog.bindElement({
			path: "/",
			model: "paramsModel"
		});
		dialog.setModel(this.parameters.model);
		dialog.bindElement({
			path: `${this.parameters.contexts.length ? "" : "/"}${this.actionName}(...)`
		});

		if (this.parameters.contexts.length) {
			dialog.setBindingContext(this.parameters.contexts[0]); // use context of first selected line item
		}
		// empty model to add elements dynamically depending on number of MVF fields defined on the dialog
		dialog.setModel(new JSONModel({}), "mvfview");
	}

	/**
	 * Removes the messages before opening the dialog.
	 * @param _event
	 */
	private beforeOpen(_event: Dialog$BeforeOpenEvent): void {
		this.messageHandler.removeTransitionMessages();
	}

	/**
	 * Wait for the parameter values to be set.
	 * @returns Promise containing the parameter values.
	 */
	public async waitForParametersValues(): Promise<Record<string, PrimitiveType>> {
		return this.parametersValuesPromise;
	}

	/**
	 * Determines if the dialog is opened.
	 * @returns True if the dialog is opened, false otherwise.
	 */
	public isOpen(): boolean {
		return this.isDialogOpen;
	}

	/**
	 * Gets the default values for a parameter.
	 * @param parameter The parameter
	 * @param bindingParameter The binding parameter
	 * @param dialog The dialog
	 * @returns The promise of the default values.
	 */
	private async getParameterDefaultValue(
		parameter: ActionParameter,
		bindingParameter: string,
		dialog: Dialog
	): Promise<ParameterDefaultValue> {
		const operationBinding = dialog.getObjectBinding() as ODataContextBinding;
		const parameterModelData = this.parameterModel.getData();
		const paramName = parameter.name;
		const defaultValue = parameter.annotations.UI?.ParameterDefaultValue;
		// Case 1: There is a ParameterDefaultValue annotation
		if (defaultValue) {
			if (this.parameters.contexts.length > 0 && isPathAnnotationExpression(defaultValue)) {
				try {
					const pathForContext: string =
						bindingParameter && defaultValue.path.startsWith(`${bindingParameter}/`)
							? defaultValue.path.replace(`${bindingParameter}/`, "")
							: defaultValue.path;
					let paramValue = await CommonUtils.requestSingletonProperty(defaultValue.path, operationBinding.getModel());
					if (paramValue === null) {
						paramValue = await operationBinding.getParameterContext().requestProperty(defaultValue.path);
					}
					if (this.parameters.contexts.length > 1) {
						// For multi select, need to loop over contexts (as contexts cannot be retrieved via binding parameter of the operation binding)

						if (this.parameters.contexts.some((context) => context.getProperty(pathForContext) !== paramValue)) {
							// if the values from the contexts are not all the same, do not prefill
							return {
								paramName,
								value: undefined,
								noPossibleValue: true
							};
						}
					}
					return { paramName, value: paramValue };
				} catch (error) {
					Log.error("Error while reading default action parameter", paramName, this.action.name);
					return {
						paramName,
						value: undefined,
						latePropertyError: true
					};
				}
			} else {
				// Case 1.2: ParameterDefaultValue defines a fixed string value (i.e. vParamDefaultValue = 'someString')
				return { paramName, value: defaultValue.valueOf() };
			}
		}
		return { paramName, value: parameterModelData[paramName] };
	}

	/**
	 * Gets the manifest values.
	 * @returns The promise of the manifest values.
	 */
	private async getManifestFunctionValues(): Promise<Record<string, unknown>> {
		const bindingContext = this.dialog?.getBindingContext();
		if (!this.parameters.view || !this.parameters.defaultValuesExtensionFunction || !bindingContext) {
			return {};
		}

		return FPMHelper.loadModuleAndCallMethod(
			this.parameters.defaultValuesExtensionFunction
				.substring(0, this.parameters.defaultValuesExtensionFunction.lastIndexOf(".") || -1)
				.replace(/\./gi, "/"),
			this.parameters.defaultValuesExtensionFunction.substring(
				this.parameters.defaultValuesExtensionFunction.lastIndexOf(".") + 1,
				this.parameters.defaultValuesExtensionFunction.length
			),
			this.parameters.view,
			bindingContext,
			this.parameters.contexts
		) as Promise<Record<string, unknown>>;
	}

	/**
	 * Gets the predefined values for the parameters.
	 * @param bindingParameter The binding parameter
	 * @param dialog The dialog
	 * @returns The promise containing all predefined values.
	 */
	private async getPreDefinedValues(
		bindingParameter: string,
		dialog: Dialog
	): Promise<{
		contextValues: Record<string, unknown>;
		defaultValues: ParameterDefaultValue[];
		functionValues: ODataV4Context[];
		manifestFunctionValues: Record<string, unknown>;
	}> {
		const boundFunctionName = this.action.annotations.Common?.DefaultValuesFunction?.valueOf();
		let requestContextObject: Promise<Record<string, unknown>> = Promise.resolve({});
		let functionParams: Promise<ODataV4Context>[] = [];
		if (this.action.isBound) {
			if (typeof boundFunctionName === "string") {
				functionParams = this.parameters.contexts.map(async (context) =>
					operations.callBoundFunction(boundFunctionName, context, context.getModel())
				);
			}
			if (this.parameters.contexts.length > 0) {
				requestContextObject = this.parameters.contexts[0].requestObject();
			}
		}

		try {
			const contextValues = await requestContextObject;

			const promises = await Promise.all([
				Promise.all(
					this.actionParameterInfos.map(async (actionParameterInfo) =>
						this.getParameterDefaultValue(actionParameterInfo.parameter, bindingParameter, dialog)
					)
				),
				Promise.all(functionParams),
				this.getManifestFunctionValues()
			]);
			return {
				contextValues,
				defaultValues: promises[0],
				functionValues: promises[1],
				manifestFunctionValues: promises[2]
			};
		} catch (error: unknown) {
			Log.error("Error while retrieving the parameter", error as string);
			// Remove messages relating to the function for default values as they aren't helpful for a user
			this.messageHandler.removeTransitionMessages();
			return {
				contextValues: {},
				defaultValues: [],
				functionValues: [],
				manifestFunctionValues: {}
			};
		}
	}

	/**
	 * Callback when the dialog is opened. Sets the focus on the first field without opening the VH dialog.
	 */
	private afterOpen(): void {
		const firstVisibleParameter = this.actionParameterInfos.find((parameterInfo) => parameterInfo.field.getVisible());
		if (firstVisibleParameter) {
			const firstField = firstVisibleParameter?.field;
			const focusInfo = firstField?.getFocusInfo() as { targetInfo: object };
			focusInfo.targetInfo = { silent: true };
			firstField?.focus(focusInfo);
		}
		this.parameters.events?.onParameterDialogOpened?.();
	}

	/**
	 * Registers the action parameter info.
	 * @param dialogContents The dialog contents
	 */
	private registerActionParameterInfo(dialogContents: DialogContentTypes[]): void {
		//Register the field
		dialogContents.forEach((dialogContent) => {
			const parameter = dialogContent?.parameter;
			const field = dialogContent?.formElements?.[1];
			this.actionParameterInfos.push({
				parameter,
				field,
				isMultiValue: parameter.isCollection,
				hasError: false
			});
		});
	}

	/**
	 * Sets the default values for the parameters.
	 * @param dialog The dialog
	 * @returns The promise.
	 */
	private async setOperationDefaultValues(dialog: Dialog): Promise<void> {
		const bindingParameter = this.action.isBound ? this.action.parameters[0].name : "";
		const { contextValues, defaultValues, functionValues, manifestFunctionValues } = await this.getPreDefinedValues(
			bindingParameter,
			dialog
		);
		const operationBinding = dialog.getObjectBinding() as ODataContextBinding;

		if (bindingParameter) {
			operationBinding.setParameter(bindingParameter, contextValues);
		}

		for (const i in this.actionParameterInfos) {
			if (this.actionParameterInfos[i].parameter.name !== "ResultIsActiveEntity") {
				const parameterName = this.actionParameterInfos[i].parameter.name;
				// Parameter values provided in the call of invokeAction overrule other sources
				const parameterProvidedValue = this.parameterValues?.find((element) => element.name === parameterName)?.value;
				if (parameterProvidedValue) {
					operationBinding.setParameter(parameterName, parameterProvidedValue);
				} else if (manifestFunctionValues.hasOwnProperty(parameterName)) {
					operationBinding.setParameter(parameterName, manifestFunctionValues[parameterName]);
				} else if (defaultValues[i] && defaultValues[i].value !== undefined) {
					operationBinding.setParameter(parameterName, defaultValues[i].value);
				} else if (this.action.annotations.Common?.DefaultValuesFunction && !defaultValues[i].noPossibleValue) {
					const setOfFunctionValues = new Set<string>(
						this.parameters.contexts.map((context, index) => functionValues[index].getObject(parameterName))
					);
					if (setOfFunctionValues.size === 1 && setOfFunctionValues.values().next().value !== undefined) {
						//param values are all the same:
						operationBinding.setParameter(parameterName, Array.from(setOfFunctionValues)[0]);
					}
				}
			}
		}

		// If at least one Default Property is a Late Property and an eTag error was raised.
		if (defaultValues.some((value) => value.latePropertyError)) {
			const refresh = this.resourceModel.getText("C_COMMON_SAPFE_REFRESH");
			MessageBox.warning(getResourceModel(this.parameters.appComponent).getText("C_APP_COMPONENT_SAPFE_ETAG_LATE_PROPERTY"), {
				actions: [refresh, MessageBox.Action.OK],
				emphasizedAction: refresh,
				onClose: (action: string) => {
					if (action === refresh) {
						const extensionAPI = this.parameters.view?.getController().getExtensionAPI();
						(extensionAPI as ListReportExtensionAPI | ObjectPageExtensionAPI).refresh();
					}
				},
				contentWidth: "25em"
			} as object);
		}
	}

	/**
	 * Manages the close of the dialog.
	 */
	private afterClose(): void {
		// when the dialog is cancelled, messages need to be removed in case the same action should be executed again
		for (const i in this.actionParameterInfos) {
			this.removeMessagesForParameter(this.actionParameterInfos[i].parameter);
		}
		this.dialog?.destroy();
		this.buttonLock = false; //needed here, not in the press events finally clause. In case the UI is sluggish, begin button could be pressed again.
	}
}

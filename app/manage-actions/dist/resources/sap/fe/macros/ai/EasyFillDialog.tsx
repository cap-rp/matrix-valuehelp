import type { EntityType, Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { BindingToolkitExpression, PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { transformRecursively } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { createReference, defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import EasyFillPlaceholder from "sap/fe/controls/easyFill/EasyFillPlaceholder";
import type { FEView } from "sap/fe/core/BaseController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { FieldSideEffectDictionary } from "sap/fe/core/controllerextensions/SideEffects";
import { CollaborationUtils } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { DefinitionPage } from "sap/fe/core/definition/FEDefinition";
import { getLabel, isComputed, isImmutable } from "sap/fe/core/templating/PropertyHelper";
import Field from "sap/fe/macros/Field";
import { getValueBinding } from "sap/fe/macros/field/FieldTemplating";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import FormattedText from "sap/m/FormattedText";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ScrollContainer from "sap/m/ScrollContainer";
import TextArea from "sap/m/TextArea";
import Title from "sap/m/Title";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import VBox from "sap/m/VBox";
import { FlexDirection } from "sap/m/library";
import InvisibleText from "sap/ui/core/InvisibleText";
import CoreTitle from "sap/ui/core/Title";
import ColumnLayout from "sap/ui/layout/form/ColumnLayout";
import Form from "sap/ui/layout/form/Form";
import FormContainer from "sap/ui/layout/form/FormContainer";
import FormElement from "sap/ui/layout/form/FormElement";
import type Context from "sap/ui/model/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { FieldMetadata } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

@defineUI5Class("sap.fe.macros.ai.EasyFillDialog")
export default class EasyFillDialog extends BuildingBlock<
	Dialog,
	{
		enteredText: string;
		incorrectValues: Record<string, unknown>;
		newValues: Record<string, unknown>;
		hasValues: boolean;
		hasIncorrectValues: boolean;
	}
> {
	@defineReference()
	$reviewArea!: Ref<FlexBox>;

	@property({ type: "Function" })
	getEditableFields?: Function;

	private _bindingContext?: Context;

	constructor(idOrProps: string | PropertiesOf<EasyFillDialog>, props?: PropertiesOf<EasyFillDialog>) {
		super(idOrProps, props);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.state.newValues = {};
		this.state.hasValues = false;
		this.content = this.createContent();
	}

	async onConfirm(_e: Button$PressEvent): Promise<void> {
		// Validate the data handling
		const mainPageBindingContext = this.getPageController().getView()?.getBindingContext();
		const allProps = [];
		const newValues = this._bindingContext?.getObject() ?? this.state.newValues;
		for (const newValuesKey in newValues) {
			if (newValuesKey !== "__bindingInfo" && !newValuesKey.startsWith("@$")) {
				if (typeof newValues[newValuesKey] !== "object") {
					mainPageBindingContext?.setProperty(newValuesKey, newValues[newValuesKey]);
					allProps.push(
						this.applyUpdatesForChange(this.getPageController().getView(), mainPageBindingContext.getPath(newValuesKey))
					);
				}
			}
		}
		await Promise.all(allProps);

		this.content?.close();
	}

	async applyUpdatesForChange(view: FEView, propertyPathForUpdate: string): Promise<void> {
		const metaModel = view.getModel().getMetaModel();
		const metaContext = metaModel.getMetaContext(propertyPathForUpdate);
		const dataModelObject = MetaModelConverter.getInvolvedDataModelObjects<Property>(metaContext);
		const targetContext = view.getBindingContext();
		try {
			const sideEffectsPromises: Promise<unknown>[] = [];
			const sideEffectsService = CollaborationUtils.getAppComponent(view).getSideEffectsService();

			// We have a target context, so we can retrieve the updated property
			const targetMetaPath = metaModel.getMetaPath(targetContext.getPath());
			const relativeMetaPathForUpdate = metaModel.getMetaPath(propertyPathForUpdate).replace(targetMetaPath, "").slice(1);
			sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativeMetaPathForUpdate], targetContext, "$auto"));

			// Get the fieldGroupIds corresponding to pathForUpdate
			const fieldGroupIds = sideEffectsService.computeFieldGroupIds(
				dataModelObject.targetEntityType.fullyQualifiedName,
				dataModelObject.targetObject!.fullyQualifiedName
			);

			// Execute the side effects for the fieldGroupIds
			if (fieldGroupIds.length) {
				const pageController = view.getController();
				const sideEffectsMapForFieldGroup = pageController._sideEffects.getSideEffectsMapForFieldGroups(
					fieldGroupIds,
					targetContext
				) as FieldSideEffectDictionary;
				Object.keys(sideEffectsMapForFieldGroup).forEach((sideEffectName) => {
					const sideEffect = sideEffectsMapForFieldGroup[sideEffectName];
					sideEffectsPromises.push(
						pageController._sideEffects.requestSideEffects(sideEffect.sideEffects, sideEffect.context, "$auto", undefined, true)
					);
				});
			}

			await Promise.all(sideEffectsPromises);
		} catch (err) {
			Log.error("Failed to update data after change:" + err);
			throw err;
		}
	}

	onCancel(): void {
		this.content?.close();
	}

	open(): void {
		this.content?.open();
	}

	_getFieldMapping(definitionPage: DefinitionPage | undefined): FieldMetadata {
		const fieldMapping: FieldMetadata = {};
		if (definitionPage) {
			const pageTarget = definitionPage.getMetaPath().getTarget();
			let entityType: EntityType | undefined;
			switch (pageTarget._type) {
				case "EntitySet":
				case "Singleton":
					entityType = pageTarget.entityType;
					break;
				case "NavigationProperty":
					entityType = pageTarget.targetType;
					break;
			}

			if (entityType !== undefined) {
				for (const entityProperty of entityType.entityProperties) {
					if (
						!isImmutable(entityProperty) &&
						!isComputed(entityProperty) &&
						entityProperty.annotations.UI?.Hidden?.valueOf() !== true
					) {
						// If not immutable, computed or hidden add to the field mapping
						fieldMapping[entityProperty.name] = {
							description: getLabel(entityProperty) ?? entityProperty.name,
							dataType: entityProperty.type
						};
					}
				}
			}
		}
		return fieldMapping;
	}

	private generateListBinding(path: string, model: ODataModel): ODataListBinding {
		const transientListBinding = model.bindList(
			path,
			undefined,

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

	async onEasyEditPressed(): Promise<void> {
		// Call the AI service
		// Process through chat completion API
		const metaPath = this.getOwnerPageDefinition();
		const fieldMapping = this._getFieldMapping(metaPath);
		const easyFillLibrary = await import("ux/eng/fioriai/reuse/easyfill/EasyFill");
		const odataModel = this.getModel() as ODataModel;
		const transientListBinding = this.generateListBinding(
			odataModel.getMetaModel().getMetaPath(this.getPageController().getView()?.getBindingContext()?.getPath()),
			this.getModel() as ODataModel
		);
		this._bindingContext = transientListBinding.create({}, true);

		const aiCallResult = await easyFillLibrary.extractFieldValuesFromText(this.state.enteredText, fieldMapping);
		if (aiCallResult.success) {
			const updatedFields = aiCallResult.data;
			const editableFields = (await this.getEditableFields?.()) ?? {};
			this.state.hasValues = false;
			this.state.hasIncorrectValues = false;
			this.$reviewArea.current?.removeAllItems();
			const reviewAreaForm = (
				<Form editable={true} class={"sapUiSmallMarginTopBottom"} visible={this.bindState("hasValues")}>
					{{
						layout: <ColumnLayout columnsM={2} columnsL={2} columnsXL={2} labelCellsLarge={1} emptyCellsLarge={1} />
					}}
				</Form>
			) as Form;
			const incorrectValuesForm = (
				<Form editable={false} class={"sapUiSmallMarginTopBottom"} visible={this.bindState("hasIncorrectValues")}>
					{{
						layout: <ColumnLayout columnsM={2} columnsL={2} columnsXL={2} labelCellsLarge={1} emptyCellsLarge={1} />
					}}
				</Form>
			);
			const previousValuesFormContainer = (
				<FormContainer>{{ title: <CoreTitle text={this.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUES")} /> }}</FormContainer>
			) as FormContainer;
			const previousValuesFormContainer2 = (
				<FormContainer>{{ title: <CoreTitle text={this.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUES")} /> }}</FormContainer>
			) as FormContainer;

			const newValuesFormContainer = (
				<FormContainer>{{ title: <CoreTitle text={this.getTranslatedText("C_EASYEDIT_NEW_VALUES")} /> }}</FormContainer>
			) as FormContainer;
			const newValuesFormContainer2 = (
				<FormContainer>{{ title: <CoreTitle text={this.getTranslatedText("C_EASYEDIT_NEW_VALUES")} /> }}</FormContainer>
			) as FormContainer;
			const uiContext = this.getPageController().getModel("ui")?.createBindingContext("/easyEditDialog");

			this.getPageController().getModel("ui").setProperty("/easyEditDialog", {});
			uiContext.setProperty("isEditable", true);
			newValuesFormContainer.setBindingContext(uiContext, "ui");

			reviewAreaForm.addFormContainer(previousValuesFormContainer);
			reviewAreaForm.addFormContainer(newValuesFormContainer);
			incorrectValuesForm.addFormContainer(previousValuesFormContainer2);
			incorrectValuesForm.addFormContainer(newValuesFormContainer2);
			const newValues: Record<string, unknown> = {};
			const incorrectValues: Record<string, unknown> = {};
			newValuesFormContainer.setBindingContext(this._bindingContext);
			newValuesFormContainer2.setBindingContext(this.getModel("$componentState")?.createBindingContext("/incorrectValues"));
			newValuesFormContainer2.setModel(this.getModel("$componentState"));
			for (const updatedField in updatedFields) {
				if (editableFields[updatedField] && editableFields[updatedField].isEditable === true) {
					newValues[updatedField] = updatedFields[updatedField];
					this._bindingContext.setProperty(updatedField, updatedFields[updatedField]);
					this.state.hasValues = true;
					let valueBinding = getValueBinding(
						this.getDataModelObjectForMetaPath(updatedField, this.getOwnerContextPath())!,
						{},
						false,
						false,
						undefined,
						false,
						false,
						0,
						false,
						true
					) as unknown as BindingToolkitExpression<unknown>;
					valueBinding = transformRecursively(valueBinding, "PathInModel", (path: PathInModelExpression<unknown>) => {
						path.modelName = "$componentState";
						path.path = "/newValues/" + path.path;
						return path;
					});
					previousValuesFormContainer.addFormElement(
						<FormElement label={fieldMapping[updatedField].description}>
							<Field metaPath={updatedField} contextPath={this.getOwnerContextPath()} readOnly={true} />
						</FormElement>
					);

					newValuesFormContainer.addFormElement(
						<FormElement label={fieldMapping[updatedField].description}>
							<Field metaPath={updatedField} contextPath={this.getOwnerContextPath()} />
						</FormElement>
					);
				} else {
					incorrectValues[updatedField] = updatedFields[updatedField];
					this.state.hasIncorrectValues = true;
					previousValuesFormContainer2.addFormElement(
						<FormElement label={fieldMapping[updatedField].description}>
							<Field metaPath={updatedField} contextPath={this.getOwnerContextPath()} readOnly={true} />
						</FormElement>
					);
					newValuesFormContainer2.addFormElement(
						<FormElement label={fieldMapping[updatedField].description}>
							<Field metaPath={updatedField} contextPath={this.getOwnerContextPath()} readOnly={true} />
						</FormElement>
					);
				}
			}
			const $vBox = createReference<VBox>();
			this.$reviewArea.current?.addItem(
				<ScrollContainer vertical={true} class={"sapUiContentPadding"}>
					{{
						content: (
							<VBox ref={$vBox}>
								{{
									items: [
										<Title
											text={this.getTranslatedText("C_EASYEDIT_FILLED_FIELDS")}
											visible={this.bindState("hasValues")}
										/>,
										reviewAreaForm,
										<Title
											text={this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS")}
											class={"sapUiSmallMarginTopBottom"}
											visible={this.bindState("hasIncorrectValues")}
										/>,
										incorrectValuesForm
									]
								}}
							</VBox>
						)
					}}
				</ScrollContainer>
			);
			$vBox.current?.setBindingContext(this.getPageController().getView()?.getBindingContext());
			$vBox.current?.setModel(this.getPageController().getModel());
			$vBox.current?.setModel(this.getPageController().getModel("ui"), "ui");

			this.state.newValues = newValues;
			this.state.incorrectValues = incorrectValues;
		}
	}

	createContent(): Dialog {
		const easyEditDescription = <InvisibleText text={this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")} />;
		return (
			<Dialog
				title={this.getTranslatedText("C_EASYEDIT_DIALOG_TITLE")}
				resizable={true}
				horizontalScrolling={false}
				verticalScrolling={false}
				contentWidth="1100px"
				contentHeight={"800px"}
				escapeHandler={(): void => {
					this.onCancel();
				}}
				afterClose={(): void => {
					this.destroy();
				}}
			>
				{{
					content: (
						<FlexBox direction={FlexDirection.Row} renderType={"Bare"} width={"100%"} height={"100%"}>
							<FlexBox
								width={"40%"}
								id={this.createId("inputArea")}
								direction={FlexDirection.Column}
								class={"sapUiContentPadding"}
								renderType={"Bare"}
							>
								<FormattedText
									htmlText={this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")}
									class={"sapUiMarginEnd"}
								/>
								{easyEditDescription}
								<TextArea
									value={this.bindState("enteredText")}
									width="100%"
									rows={20}
									growing={true}
									growingMaxLines={30}
									ariaLabelledBy={easyEditDescription}
								/>
								<Button
									text={this.getTranslatedText("C_EASYEDIT_BUTTON")}
									icon={"sap-icon://ai"}
									enabled={true}
									press={this.onEasyEditPressed.bind(this)}
								>
									{{ layoutData: <FlexItemData alignSelf="End" /> }}
								</Button>
							</FlexBox>
							<FlexBox
								id={this.createId("reviewArea")}
								ref={this.$reviewArea}
								width={"60%"}
								renderType={"Bare"}
								direction={FlexDirection.Column}
								class={"sapFeEasyFillReviewArea"}
							>
								<EasyFillPlaceholder />
							</FlexBox>
						</FlexBox>
					),
					footer: (
						<OverflowToolbar>
							<ToolbarSpacer />
							<Button
								text={this.getTranslatedText("C_EASYEDIT_DIALOG_SAVE")}
								type="Emphasized"
								enabled={this.bindState("hasValues")}
								press={this.onConfirm.bind(this)}
							/>
							<Button
								text={this.getTranslatedText("C_EASYEDIT_DIALOG_CANCEL")}
								type="Transparent"
								press={this.onCancel.bind(this)}
							/>
						</OverflowToolbar>
					)
				}}
			</Dialog>
		);
	}
}

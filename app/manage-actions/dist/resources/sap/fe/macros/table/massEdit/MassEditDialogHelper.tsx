import type { PrimitiveType, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type { DataField, DataFieldForAction, DataFieldForAnnotation, HeaderInfo } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import deepClone from "sap/base/util/deepClone";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	constant,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	pathInModel
} from "sap/fe/base/BindingToolkit";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import Any from "sap/fe/core/controls/Any";
import { convertMetaModelContext, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isDataFieldTypes } from "sap/fe/core/converters/annotations/DataField";
import type { MassEditTableConfiguration } from "sap/fe/core/converters/controls/Common/Table";
import type { AnnotationTableColumn } from "sap/fe/core/converters/controls/Common/table/Columns";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { getDisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import { isReadOnlyExpression } from "sap/fe/core/templating/FieldControlHelper";
import {
	getAssociatedCurrencyPropertyPath,
	getAssociatedTextPropertyPath,
	getAssociatedUnitProperty,
	getAssociatedUnitPropertyPath,
	hasValueHelp
} from "sap/fe/core/templating/PropertyHelper";
import { getEditMode, getRequiredExpression, isMultiValueField, isVisible } from "sap/fe/core/templating/UIFormatters";
import { getTextBinding, setEditStyleProperties } from "sap/fe/macros/field/FieldTemplating";
import type { FieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import MessageBox from "sap/m/MessageBox";
import Component from "sap/ui/core/Component";
import Library from "sap/ui/core/Lib";
import type Table from "sap/ui/mdc/Table";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import BindingMode from "sap/ui/model/BindingMode";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataPropertyBinding from "sap/ui/model/odata/v4/ODataPropertyBinding";
import MassEditDialog from "./MassEditDialog";
import type { BindingInfo, MassFieldProperties, SelectInfo } from "./library";
import { SpecificSelectKeys } from "./library";

type DataFieldTypes = DataField | DataFieldForAnnotation | DataFieldForAction;
type FieldInfo = {
	key: string;
	propertyDataModel: DataModelObjectPath<Property>;
	targetProperty: Property;
	label: string;
	convertedAnnotation: DataFieldTypes;
};

type BindingToFetch = BindingInfo & { contexts?: ODataV4Context[] };

/**
 * Display the massEdit dialog.
 */
export default class MassEditDialogHelper {
	private readonly table: Table;

	private readonly onContextMenu: boolean;

	private readonly onDialogClose: (() => void) | undefined;

	private readonly view: FEView;

	private readonly maxAnalyzedRows = 30;

	private contexts: ODataV4Context[];

	private readonly analyzedContexts: ODataV4Context[] = [];

	private readonly degradedMode: boolean;

	private readonly manifestSettings: MassEditTableConfiguration;

	private fieldProperties: MassFieldProperties[] = [];

	private readonly isAdaptation: boolean;

	private readonly headerInfo: HeaderInfo | undefined;

	massEditDialog: MassEditDialog | undefined;

	constructor(props: { table: Table; onContextMenu: boolean; onClose?: () => void }) {
		const entityTypePath = (props.table.getParent() as TableAPI).getTableDefinition().annotation.collection,
			metaModel = (props.table.getModel() as ODataModel).getMetaModel();

		this.table = props.table;
		this.manifestSettings = (this.table.getParent() as TableAPI).getTableDefinition().control.massEdit;
		this.onContextMenu = props.onContextMenu;
		this.onDialogClose = props.onClose;
		this.view = CommonUtils.getTargetView(this.table);
		this.contexts = this.fetchContextsForEdit();
		this.degradedMode = this.contexts.length > this.maxAnalyzedRows;
		this.analyzedContexts = this.degradedMode ? this.contexts.slice(0, this.maxAnalyzedRows) : this.contexts;
		this.isAdaptation = CommonUtils.getAppComponent(this.table).isAdaptationMode();
		this.headerInfo = getInvolvedDataModelObjects(metaModel.getContext(entityTypePath)).targetEntityType.annotations.UI?.HeaderInfo;
	}

	/**
	 * Opens the mass edit dialog if all selected contexts are editable,
	 * otherwise a message box to confirm the selection.
	 * @returns A promise that resolves on open of the mass edit dialog.
	 */
	async open(): Promise<void> {
		try {
			const templateComponent = Component.getOwnerComponentFor(this.view) as TemplateComponent;
			const internalModelContext = this.table.getBindingContext("internal") as InternalModelContext,
				internalModelProperty = !this.onContextMenu ? "numberOfSelectedContexts" : "contextmenu/numberOfSelectedContexts",
				selectedContexts = internalModelContext.getProperty(internalModelProperty) || 0;
			this.fieldProperties = await this.getFieldsPropertiesFromInfo(this.getFieldsInfo());
			if (!this.isAdaptation) {
				// no field to edit
				if (!this.fieldProperties.some((field) => field.visible)) {
					this.noFieldInformation();
					return;
				}
				//Some rows are not editable -> do we want to continue?
				if (this.contexts.length !== selectedContexts) {
					this.contexts = await this.confirmSelection(this.contexts, selectedContexts);
					if (!this.contexts.length) {
						// the user doesn't want to continue
						this.onDialogClose?.();
						return;
					}
				}
			}
			await templateComponent.runAsOwner(async () => {
				this.massEditDialog = new MassEditDialog({
					table: this.table,
					contexts: this.contexts,
					fieldProperties: this.fieldProperties
				});
				const dialog = await this.massEditDialog.create();
				dialog.attachBeforeClose(() => {
					this.onDialogClose?.();
				});
				dialog.open();
				const requiredDataPromise = this.massEditDialog.getRequiredDataPromise();
				try {
					await this.getDataAfterOpeningDialog(this.fieldProperties);
					requiredDataPromise.resolve();
				} catch (error) {
					Log.error("Mass Edit: Something went wrong in mass edit dialog to get required data.", error as string);
					requiredDataPromise.reject();
				}
			});
		} catch (error: unknown) {
			Log.error("Mass Edit: Something went wrong in mass edit dialog creation.", error as string);
		}
	}

	/**
	 * Opens the message box to notify no fields are editable.
	 */
	private noFieldInformation(): void {
		const visibleFieldsFromManifest = (this.table.getParent() as TableAPI).getTableDefinition().control.massEdit.visibleFields;
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle;
		let message = "",
			messageDetail;
		if (visibleFieldsFromManifest.length > 0) {
			message = resourceBundle.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS_WITH_MANIFEST", [
				this.getResourceText(this.headerInfo?.TypeName) ?? resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME")
			]);
			messageDetail = `<ul>
			${this.fieldProperties
				.reduce((fields: string[], fieldProperty) => {
					if (visibleFieldsFromManifest.includes(fieldProperty.propertyInfo.relativePath)) {
						fields.push(`<li>${fieldProperty.label}</li>`);
					}
					return fields;
				}, [])
				.join("")} </ul>`;
		} else {
			message = resourceBundle.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS_DEFAULT");
		}

		MessageBox.information(message, {
			details: messageDetail,
			onClose: () => {
				this.onDialogClose?.();
			}
		});
	}

	/**
	 * Opens the confirmation dialog to validate the selected contexts.
	 * @param contexts The contexts set as updatable
	 * @param selectedContexts  The number of selected contexts
	 * @returns A promise that resolves the contexts to be finally managed.
	 */
	private async confirmSelection(contexts: ODataV4Context[], selectedContexts: number): Promise<ODataV4Context[]> {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle;
		const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core") as ResourceBundle;

		const updatableContexts = contexts.length;
		return new Promise((resolve) => {
			try {
				const tableAPI = this.table.getParent() as TableAPI;
				const editButton = resourceBundle.getText("C_MASS_EDIT_CONFIRM_BUTTON_TEXT"),
					cancelButton = coreResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
					metaModel = (this.table.getModel() as ODataModel).getMetaModel(),
					typeName =
						this.getResourceText(this.headerInfo?.TypeName) ?? resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME"),
					typeNamePlural =
						this.getResourceText(this.headerInfo?.TypeNamePlural) ??
						resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME_PLURAL"),
					messageDetail =
						ModelHelper.isDraftSupported(metaModel, this.table.data("targetCollectionPath")) && tableAPI.readOnly
							? this.getMessageDetailForNonEditable(typeName, typeNamePlural)
							: "";

				MessageBox.warning(
					resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE", [
						selectedContexts - updatableContexts,
						selectedContexts,
						updatableContexts,
						typeNamePlural
					]),
					{
						details: messageDetail,
						actions: [editButton, cancelButton],
						emphasizedAction: editButton,
						onClose: function (selection: string) {
							resolve(selection === editButton ? contexts : []);
						}
					}
				);
			} catch (error) {
				Log.error(error as string);
			}
		});
	}

	/**
	 * Gets the text according to an annotation.
	 * @param annotation The annotation
	 * @returns The text.
	 */
	private getResourceText(annotation: PropertyAnnotationValue<String> | undefined): string | undefined {
		if (!annotation) {
			return undefined;
		}
		return CommonUtils.getTranslatedTextFromExpBindingString(
			compileExpression(getExpressionFromAnnotation(annotation)) as string,
			this.view
		)?.toLocaleLowerCase();
	}

	/**
	 * Gets the message detail of the confirmation dialog.
	 * @param typeName The type name of the entity set
	 * @param typeNamePlural The type name plural of the entity set
	 * @returns The text.
	 */
	private getMessageDetailForNonEditable(typeName: string, typeNamePlural: string): string {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle;
		return `<p><strong>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_HEADER")}</strong></p>\n
			<p>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON", [typeNamePlural])}</p>\n
			<ul>
				<li>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_DRAFT", [typeName])}</li>
				<li>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_NON_EDITABLE", [typeName])}</li>
			</ul>`;
	}

	/**
	 * Gets information about the entity which is compliant for a Mass Edit.
	 * @returns Array of the field information.
	 */

	private getEntityFieldsInfo(): FieldInfo[] {
		const tableAPI = this.table.getParent() as TableAPI;
		const columnsData = tableAPI.getTableDefinition().columns;

		const propertiesKeys = new Set(
			columnsData.reduce((fields: string[], column) => {
				if (column.type === "Annotation") {
					fields.push(column.name);
				}
				return fields;
			}, [])
		);
		return this.transformPathsToInfo(propertiesKeys);
	}

	/**
	 * Gets information about the properties of the table which are compliant for a Mass Edit.
	 * @returns Array of the field information.
	 */
	private getFieldsInfo(): FieldInfo[] {
		const propertiesKeys =
			this.manifestSettings.visibleFields.length > 0
				? new Set(this.manifestSettings.visibleFields)
				: new Set(this.table.getColumns().map((column) => column.getPropertyKey()));

		if (this.manifestSettings.ignoredFields.length > 0) {
			for (const ignoredField of this.manifestSettings.ignoredFields) {
				propertiesKeys.delete(ignoredField);
			}
		}
		return this.transformPathsToInfo(propertiesKeys);
	}

	/**
	 * Transforms a set of property paths to an array of field information.
	 * @param propertiesPaths The set of property paths
	 * @returns Array of the field information.
	 */
	private transformPathsToInfo(propertiesPaths: Set<string>): FieldInfo[] {
		return Array.from(propertiesPaths).reduce((columnInfos: FieldInfo[], propertyPath) => {
			const columnInfo = this.getFieldInfo(propertyPath);
			if (columnInfo) {
				columnInfos.push(columnInfo);
			}
			return columnInfos;
		}, []);
	}

	/**
	 * Gets information about a property.
	 * @param propertyPath
	 * @returns Field information.
	 */
	private getFieldInfo(propertyPath: string): FieldInfo | undefined {
		const columnsData = (this.table.getParent() as TableAPI).getTableDefinition().columns;
		const metaModel = (this.table.getModel() as ODataModel).getMetaModel();
		const entityPath = metaModel.getMetaPath(this.table.data("metaPath"));
		const entitySetDataModel = getInvolvedDataModelObjects(metaModel.getContext(entityPath));
		const relatedColumnInfo = columnsData.find((fieldInfo) => fieldInfo.name === propertyPath && fieldInfo.type === "Annotation");
		if (relatedColumnInfo) {
			const annotationPath = (relatedColumnInfo as AnnotationTableColumn).annotationPath;
			if (annotationPath && propertyPath) {
				const propertyDataModel = enhanceDataModelPath<Property>(entitySetDataModel, propertyPath);
				const convertedAnnotation = convertMetaModelContext(metaModel.getContext(annotationPath)) as
					| DataField
					| DataFieldForAnnotation
					| DataFieldForAction;
				const targetProperty = this.getCompliantProperty(propertyDataModel, convertedAnnotation);
				if (targetProperty && entitySetDataModel.targetEntityType.entityProperties.includes(targetProperty))
					return {
						key: relatedColumnInfo.key,
						propertyDataModel,
						targetProperty,
						label: relatedColumnInfo.label ?? relatedColumnInfo.key,
						convertedAnnotation
					};
			}
		}
		return undefined;
	}

	/**
	 * Gets the property to display on the Dialog.
	 * @param propertyDataModel The dataModelObjectPath of the column
	 * @param annotation  The converted annotation of the column
	 * @returns The property if it is compliant, undefined otherwise
	 */
	private getCompliantProperty(propertyDataModel: DataModelObjectPath<Property>, annotation: DataFieldTypes): Property | undefined {
		const targetObject = propertyDataModel.targetObject;
		let targetProperty: Property;
		if (isProperty(targetObject)) {
			targetProperty = targetObject;
			if (targetObject.annotations.UI?.IsImageURL) {
				return;
			}
		} else if (isDataFieldTypes(annotation) && !annotation.hasOwnProperty("Action")) {
			targetProperty = annotation.Value.$target;
		} else {
			return;
		}

		// Check if the field is compliant for the MassEdit
		const unitProperty = getAssociatedUnitProperty(targetProperty);
		if (
			isMultiValueField(propertyDataModel) ||
			(hasValueHelp(targetProperty) && targetProperty.annotations?.Common?.ValueListRelevantQualifiers) || // context dependent VH is not supported for Mass Edit.
			(unitProperty && hasValueHelp(unitProperty) && unitProperty.annotations?.Common?.ValueListRelevantQualifiers)
		) {
			return;
		}
		return targetProperty;
	}

	/**
	 * Checks if the field is hidden for the provided contexts.
	 * @param expBinding The expression binding of the property.
	 * @returns True if the field is hidden for all contexts, false otherwise
	 */
	private isHiddenForContexts(expBinding: CompiledBindingToolkitExpression): boolean {
		if (expBinding === "true") {
			return false;
		} else if (expBinding === "false") {
			return true;
		}
		const anyObject = new Any({ anyBoolean: expBinding });
		anyObject.setModel(this.analyzedContexts[0].getModel());
		const isHidden = !this.analyzedContexts.find((context) => {
			anyObject.setBindingContext(context);
			return (anyObject.getBinding("anyBoolean") as PropertyBinding).getExternalValue();
		});
		anyObject.destroy();
		return isHidden;
	}

	/**
	 * Gets the selected context set as updatable.
	 * @returns The contexts.
	 */
	private fetchContextsForEdit(): ODataV4Context[] {
		const internalModelContext = this.table.getBindingContext("internal"),
			updatableContextProperty = !this.onContextMenu ? "updatableContexts" : "contextmenu/updatableContexts";
		return internalModelContext?.getProperty(updatableContextProperty) ?? [];
	}

	/**
	 * Gets the properties of the mass edit fields.
	 * @returns The properties of the mass edit field.
	 */
	getFieldProperties(): MassFieldProperties[] {
		return deepClone(this.fieldProperties);
	}

	/**
	 * Gets the properties of the mass edit fields from an array of field information.
	 * @param fieldsInfo The field information.
	 * @returns The properties of the mass edit fields.
	 */
	private async getFieldsPropertiesFromInfo(fieldsInfo: FieldInfo[]): Promise<MassFieldProperties[]> {
		const fieldProperties: MassFieldProperties[] = [];

		for (const fieldInfo of fieldsInfo) {
			const { targetProperty, propertyDataModel, convertedAnnotation } = fieldInfo;
			const dataPropertyPath = getContextRelativeTargetObjectPath(propertyDataModel);
			if (dataPropertyPath) {
				const unitOrCurrencyPropertyPath =
					getAssociatedUnitPropertyPath(targetProperty) || getAssociatedCurrencyPropertyPath(targetProperty);
				const inputType = this.getInputType(convertedAnnotation, propertyDataModel);
				if (inputType && propertyDataModel.targetObject) {
					const relativePath = getRelativePaths(propertyDataModel);
					const fieldData = {
						visibilityBindings: {
							isVisible: compileExpression(isVisible(convertedAnnotation)),
							editMode: getEditMode(
								targetProperty,
								propertyDataModel,
								false,
								false,
								convertedAnnotation,
								constant(true)
							) as CompiledBindingToolkitExpression
						},
						visible: true, //by default the field is visible
						label: fieldInfo.label || (targetProperty.annotations.Common?.Label as string | undefined) || dataPropertyPath,
						isFieldRequired: getRequiredExpression(
							targetProperty,
							convertedAnnotation,
							true,
							false,
							{},
							propertyDataModel
						) as CompiledBindingToolkitExpression,
						descriptionPath: getAssociatedTextPropertyPath(propertyDataModel.targetObject),
						textBinding: {
							expression: getTextBinding(propertyDataModel, {
								displayMode: getDisplayMode(targetProperty, propertyDataModel)
							}) as CompiledBindingToolkitExpression,
							type:
								targetProperty.type === "Edm.DateTimeOffset" || targetProperty?.annotations?.Common?.IsTimezone
									? "anyText"
									: "any"
						},
						readOnlyExpression: isReadOnlyExpression(targetProperty, relativePath),
						inputType,
						propertyInfo: {
							clearable: this.isPropertyClearable(targetProperty),
							emptyValue: this.getEmptyValueForProperty(targetProperty, dataPropertyPath),
							key: fieldInfo.key,
							relativePath: dataPropertyPath,
							unitOrCurrencyPropertyPath
						},
						selectItems: [] as SelectInfo[]
					};
					fieldProperties.push(fieldData);
				}
			}
		}
		await this.getDataForOpeningDialog(fieldProperties);
		await Promise.all(
			fieldProperties.map(async (fieldData) => {
				fieldData.visible = this.manifestSettings.visibleFields.length === 0 ? this.isFieldVisible(fieldData) : true;
				const runtimeSelection = !this.isAdaptation ? await this.getRuntimeSelection(fieldData) : [];
				fieldData.selectItems = [...this.getDefaultSelectOptions(fieldData), ...runtimeSelection];
			})
		);
		return fieldProperties;
	}

	/**
	 * Gets the properties of dialog fields.
	 * @returns The properties.
	 */
	async generateFieldsProperties(): Promise<MassFieldProperties[]> {
		return this.getFieldsPropertiesFromInfo(this.getFieldsInfo());
	}

	/**
	 * Gets the properties of the entity.
	 * @returns The properties.
	 */
	async generateEntityFieldsProperties(): Promise<MassFieldProperties[]> {
		return this.getFieldsPropertiesFromInfo(this.getEntityFieldsInfo());
	}

	/**
	 * Gets the relevant data from the model needed after the opening of the dialog.
	 * This method is called only in the degraded mode since the data is already fetched in the normal mode.
	 * the degraded mode is set when the number of selected contexts is greater than the max analyzed rows.
	 * @param fieldProperties The field properties
	 * @returns A promise that resolves when the data is fetched.
	 */
	private async getDataAfterOpeningDialog(fieldProperties: MassFieldProperties[]): Promise<void> {
		if (this.degradedMode) {
			const missingContexts = this.contexts.slice(this.maxAnalyzedRows, this.contexts.length);
			const bindingsToFetch = ([] as BindingToFetch[]).concat(
				...fieldProperties.map((fieldData) => [
					{ expression: compileExpression(fieldData.readOnlyExpression), contexts: this.contexts },
					{ expression: compileExpression(pathInModel(fieldData.propertyInfo.relativePath)), contexts: missingContexts },
					{
						expression: compileExpression(pathInModel(fieldData.propertyInfo.unitOrCurrencyPropertyPath)),
						contexts: missingContexts
					}
				])
			);
			await this.getMissingData(bindingsToFetch);
		}
	}

	/**
	 * Gets the relevant data from the model needed to open the dialog.
	 * @param fieldProperties The field properties
	 * @returns A promise that resolves when the data is fetched.
	 */
	private async getDataForOpeningDialog(fieldProperties: MassFieldProperties[]): Promise<void> {
		const bindingsToResolve = ([] as BindingToFetch[]).concat(
			fieldProperties.reduce((bindings: BindingToFetch[], fieldData) => {
				bindings = bindings.concat([
					{ expression: fieldData.textBinding.expression },
					{
						expression: compileExpression(pathInModel(fieldData.propertyInfo.relativePath)),
						type: fieldData.textBinding.type
					},
					{ expression: compileExpression(pathInModel(fieldData.propertyInfo.unitOrCurrencyPropertyPath)) }
				]);
				if (!this.manifestSettings.visibleFields.length) {
					bindings = bindings.concat([
						{ expression: fieldData.visibilityBindings.isVisible },
						{ expression: fieldData.visibilityBindings.editMode }
					]);
				}
				if (!this.degradedMode) {
					bindings.push({ expression: compileExpression(fieldData.readOnlyExpression) });
				}
				return bindings;
			}, [])
		);
		await this.getMissingData(bindingsToResolve);
	}

	/**
	 * Gets the missing data for the fields.
	 * This method generates controls with the provided bindings to fetch the missing data.
	 * The model requests the data to the backend when the contexts doesn't contains the related properties.
	 * @param bindingsToFetch The binding to resolve and its property path reference
	 * @returns A promise that resolves when the data is fetched.
	 */
	private async getMissingData(bindingsToFetch: BindingToFetch[]): Promise<undefined> {
		if (this.isAdaptation) {
			return;
		}
		if (this.view.getViewData().converterType === "ObjectPage") {
			const displayedProperties = this.table.getColumns().map((column) => column.getPropertyKey());
			if (this.manifestSettings.visibleFields.every((field) => displayedProperties.includes(field))) {
				return;
			}
		}
		const promises = [];
		const controls = [];
		const model = this.contexts[0].getModel();
		for (const binding of bindingsToFetch.filter((binding) => binding.expression?.startsWith("{"))) {
			// Avoid to fetch constant bindings
			const parameters = {} as Record<string, CompiledBindingToolkitExpression>;
			const analyzedContexts = binding.contexts ?? this.analyzedContexts;
			const bindingType = binding.type ?? "any";
			parameters[bindingType] = binding.expression;
			for (const context of analyzedContexts) {
				const control = new Any(parameters);
				control.setModel(model);
				control.setBindingContext(context);
				controls.push(control);
				promises.push(async () => {
					const controlBinding = control.getBinding(bindingType) as ODataPropertyBinding | undefined;
					if (controlBinding) {
						controlBinding.setBindingMode(BindingMode.OneTime);
						if (controlBinding.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
							await Promise.all(controlBinding.getBindings().map((nestedBinding) => nestedBinding.requestValue?.()));
						} else {
							await controlBinding.requestValue?.();
						}
					}
				});
			}
		}
		await Promise.all(promises.map(async (promise) => promise()));
		for (const control of controls) {
			control.destroy();
		}
	}

	/**
	 * Gets the default value of the property when the related field is empty.
	 * @param property The property
	 * @param propertyPath The property path
	 * @returns The default value.
	 */
	getEmptyValueForProperty(property: Property, propertyPath: string): PrimitiveType {
		if (property.nullable !== false) {
			return null;
		} else {
			const context = this.contexts[0];
			const anyObject = new Any({ any: compileExpression(formatWithTypeInformation(property, pathInModel(propertyPath))) });
			anyObject.setModel(context.getModel());
			anyObject.setBindingContext(context);
			const value = anyObject.getBindingInfo("any").binding.getType().parseValue("", "string");
			anyObject.destroy();
			return value;
		}
	}

	/**
	 * Checks if the property is clearable.
	 * Some OData types don't access empty string or 0 as a valid value when it's not nullable.
	 * For example, Edm.DateTime doesn't accept an empty string as a valid value.
	 * @param property The property
	 * @returns True if the property is clearable, false otherwise.
	 */
	isPropertyClearable(property: Property): PrimitiveType {
		if (property.nullable !== false) {
			return true;
		} else {
			return !["Edm.DateTime", "Edm.DateTimeOffset", "Edm.TimeOfDay", "Edm.Time", "Edm.Date", "Edm.DateTimeWithTimezone"].includes(
				property.type
			);
		}
	}

	/**
	 * Gets the selection options of a field generated by the selected contexts.
	 * @param fieldData Data of the field used by both the static and the runtime model
	 * @returns The select options of the field
	 */
	private async getRuntimeSelection(fieldData: MassFieldProperties): Promise<SelectInfo[]> {
		const distinctMap = new Set<string>();
		const selectOptions: SelectInfo[] = [];
		if (fieldData.inputType === "CheckBox") {
			return [];
		}
		const anyObject = new Any({ anyText: fieldData.textBinding.expression });
		anyObject.setModel(this.contexts[0].getModel());
		for (const selectedContext of this.analyzedContexts) {
			anyObject.setBindingContext(selectedContext);
			const textBinding = anyObject.getBinding("anyText");
			if (textBinding?.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
				// If the text binding is a composite binding, we need to request the value of each binding
				// to wait for the promise to resolve before getting the value of requestUnitsOfMeasure/requestCurrencyCodes
				// for the custom units of measure and currency codes.
				// We have to set the binding mode to OneTime to avoid the binding to be updated when the context changes.
				// Indeed even if the requestUnitsOfMeasure/requestCurrencyCodes doesn't change it's trigger a PATCH request
				textBinding.setBindingMode(BindingMode.OneTime);
				await Promise.all(textBinding.getBindings().map((binding) => binding.requestValue?.()));
			}
			const propertyText = (anyObject.getBinding("anyText") as PropertyBinding | undefined)?.getExternalValue();
			if (propertyText && !distinctMap.has(propertyText)) {
				distinctMap.add(propertyText);
				selectOptions.push({
					text: propertyText,
					key: propertyText,
					unitOrCurrencyValue: fieldData.propertyInfo.unitOrCurrencyPropertyPath
						? selectedContext.getObject(fieldData.propertyInfo.unitOrCurrencyPropertyPath)
						: "",
					propertyValue: selectedContext.getObject(fieldData.propertyInfo.relativePath)
				});
			}
		}
		anyObject.destroy();
		return selectOptions;
	}

	/**
	 * Gets the default selection options of a field.
	 * @param fieldData The property information
	 * @returns The default select options.
	 */
	private getDefaultSelectOptions(fieldData: MassFieldProperties): SelectInfo[] {
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle;
		const keepEntry = {
			text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_KEEP_VALUES"),
			key: SpecificSelectKeys.KeepKey
		};
		const defaultOptions: SelectInfo[] = [];
		defaultOptions.push(keepEntry);
		if (fieldData.inputType === "CheckBox") {
			defaultOptions.push({ text: resourceBundle.getText("yes"), key: "true" }, { text: resourceBundle.getText("no"), key: "false" });
		} else {
			defaultOptions.push({
				text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_REPLACE_VALUES"),
				key: SpecificSelectKeys.ReplaceKey
			});
			if (fieldData.isFieldRequired !== "true" && fieldData.propertyInfo.clearable) {
				defaultOptions.push({
					text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_CLEAR_VALUES"),
					key: SpecificSelectKeys.ClearFieldValueKey
				});
			}
		}
		return defaultOptions;
	}

	/**
	 * Checks if the the field is editable.
	 * @param expBinding The expression binding of the property.
	 * @returns Returns true if the mass edit field is editable.
	 */
	private getFieldEditable(expBinding: CompiledBindingToolkitExpression): boolean {
		if (expBinding === FieldEditMode.Editable) {
			return true;
		} else if (Object.keys(FieldEditMode).includes(expBinding as FieldEditMode)) {
			return false;
		} else if (expBinding) {
			const anyControl = new Any({ any: expBinding });
			const model = this.analyzedContexts[0].getModel();
			anyControl.setModel(model);
			const visible = this.analyzedContexts.some((context) => {
				anyControl.setBindingContext(context);
				return (anyControl.getBinding("any") as PropertyBinding).getExternalValue() === FieldEditMode.Editable;
			});
			anyControl.destroy();
			return visible;
		} else {
			return true;
		}
	}

	/**
	 * Gets the input type of the field.
	 * @param dataFieldConverted The converted annotation fo the field
	 * @param dataModelPath The dataModelObjectPath of the property
	 * @returns The input type.
	 */
	private getInputType(dataFieldConverted: DataFieldTypes, dataModelPath: DataModelObjectPath<Property>): string | undefined | null {
		const editStyleProperties = {} as FieldBlockProperties;
		setEditStyleProperties(editStyleProperties, dataFieldConverted, dataModelPath, true);
		return editStyleProperties?.editStyle;
	}

	/**
	 * Gets the visibility of the field
	 * This visibility is not dependent on the context when
	 *  - either the adaptation mode is set.
	 *  - or the field is visible in the manifest and the degraded mode is set.
	 * @param fieldProperties The properties of the mass edit field
	 * @returns True if the field is visible, false otherwise
	 */
	private isFieldVisible(fieldProperties: MassFieldProperties): boolean {
		if (this.isAdaptation || (this.manifestSettings.visibleFields.length && this.degradedMode)) {
			const isStaticEditMode = Object.keys(FieldEditMode).includes(fieldProperties.visibilityBindings.editMode as FieldEditMode);
			const isEditable =
				!isStaticEditMode || (isStaticEditMode && fieldProperties.visibilityBindings.editMode === FieldEditMode.Editable);
			return isEditable && fieldProperties.visibilityBindings.isVisible !== "false";
		}
		return (
			this.getFieldEditable(fieldProperties.visibilityBindings.editMode) &&
			!this.isHiddenForContexts(fieldProperties.visibilityBindings.isVisible)
		);
	}
}

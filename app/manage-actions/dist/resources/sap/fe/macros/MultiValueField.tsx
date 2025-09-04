import type { Property } from "@sap-ux/vocabularies-types";
import type { PathAnnotationExpression, PropertyPath } from "@sap-ux/vocabularies-types/Edm";
import type { DataField, DataFieldTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, constant, getExpressionFromAnnotation, ifElse, isConstant, not, or } from "sap/fe/base/BindingToolkit";
import {
	aggregation,
	association,
	defineUI5Class,
	implementInterface,
	property,
	type EnhanceWithUI5,
	type PropertiesOf
} from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import * as ID from "sap/fe/core/helpers/StableIdHelper";
import {
	isMultipleNavigationProperty,
	isPathAnnotationExpression,
	isProperty,
	isPropertyPathExpression
} from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextRelativeTargetObjectPath,
	getRelativePaths,
	getTargetObjectPath,
	isPathDeletable,
	isPathInsertable
} from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import { getCollaborationExpression, getDisplayMode } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { getValueBinding, getVisibleExpression } from "sap/fe/macros/field/FieldTemplating";
import type Tokenizer from "sap/m/Tokenizer";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import MultiValueField from "sap/ui/mdc/MultiValueField";
import type FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type Context from "sap/ui/model/odata/v4/Context";

import type PageController from "sap/fe/core/PageController";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { CollaborationFieldGroupPrefix } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import * as CollaborationFormatters from "sap/fe/core/formatters/CollaborationFormatter";
import type MetaPath from "sap/fe/core/helpers/MetaPath";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import FieldRuntime from "sap/fe/macros/field/FieldRuntime";
import FormatOptions from "sap/fe/macros/multivaluefield/FormatOptions";
import MultiValueFieldRuntime from "sap/fe/macros/multivaluefield/MultiValueFieldRuntime";
import Avatar from "sap/m/Avatar";
import HBox from "sap/m/HBox";
import UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type { default as MdcValueHelp, ValueHelp$OpenedEvent } from "sap/ui/mdc/ValueHelp";
import type { MetaModelType } from "../../../../../../types/metamodel_types";
import ValueHelp from "./ValueHelp";
import FieldRuntimeHelper from "./field/FieldRuntimeHelper";

type MultiInputSettings = {
	description: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
	collectionBinding: PropertyBindingInfo;
	key: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
	displayOnly?: boolean;
};

type MultiValueFieldPathStructure = {
	collectionPath: string;
	itemDataModelObjectPath: DataModelObjectPath<Property>;
};

/**
 * Building block for creating a MultiValueField based on the metadata provided by OData V4.
 * <br>
 * The MultiValueField can be used to display either a DataField or Property directly. It has to point to a collection property.
 * <br>
 * Usage example:
 * <pre>
 * &lt;macro:MultiValueField
 * id="SomeUniqueIdentifier"
 * contextPath="{entitySet&gt;}"
 * metaPath="{dataField&gt;}"
 * /&gt;
 * </pre>
 * @alias sap.fe.macros.MultiValueField
 * @public
 * @since 1.118.0
 * @experimental
 */

@defineUI5Class("sap.fe.macros.MultiValueField")
export default class MultiValueFieldBlock extends BuildingBlock<Control> {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	/**
	 * The 'id' property
	 */
	@property({
		type: "string"
	})
	public id?: string;

	/**
	 * Prefix added to the generated ID of the field - only if no id is provided
	 */
	@association({
		type: "string"
	})
	idPrefix?: string;

	/**
	 * Prefix added to the generated ID of the value help used for the field
	 */
	@association({
		type: "string"
	})
	vhIdPrefix!: string;

	/**
	 * Defines the relative Metadata path to the MultiValueField.
	 * The metaPath should point to a Property or DataField.
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	/**
	 * The readOnly flag
	 * @public
	 */
	@property({ type: "boolean", required: false })
	public readOnly?: boolean | CompiledBindingToolkitExpression;

	/**
	 * The context path provided for the MultiValueField
	 * @public
	 */
	@property({
		type: "string"
	})
	public contextPath?: string;

	/**
	 * Property added to be able to add data / items to the multi value field via a different model
	 * @experimental
	 * @public
	 */
	@property({
		type: "any",
		isBindingInfo: true
	})
	public items?: PropertyBindingInfo;

	/**
	 * The object with the formatting options
	 *
	 */
	@aggregation({ type: "sap.fe.macros.multivaluefield.FormatOptions", multiple: false, defaultClass: FormatOptions })
	formatOptions?: FormatOptions;

	@property({ type: "boolean" })
	_isInEditMode: boolean | CompiledBindingToolkitExpression = false;

	// Computed properties

	private item!: MultiInputSettings;

	/**
	 * Pointed at dataField, can be DataFieldDefault from a property.
	 */
	private convertedDataField!: DataField;

	/**
	 * DataModelPath for the corresponding property displayed.
	 */
	private dataModelPath!: DataModelObjectPath<Property>;

	/**
	 * Property to be displayed
	 */
	private property!: Property;

	/**
	 * Edit Mode of the field.
	 * If the editMode is undefined then we compute it based on the metadata
	 * Otherwise we use the value provided here.
	 */
	private editMode!: FieldEditMode | CompiledBindingToolkitExpression;

	/**
	 * The display mode added to the collection field
	 */
	private displayMode!: DisplayMode;

	/**
	 * The CompiledBindingToolkitExpression that is calculated internally
	 */
	private collection!: PropertyBindingInfo;

	private visible: CompiledBindingToolkitExpression;

	private fieldGroupIds?: string;

	private enhancedMetaPath!: Context;

	private enableExpression: CompiledBindingToolkitExpression;

	private collaborationExpression!: BindingToolkitExpression<boolean>;

	private collaborationInitialsExpression!: CompiledBindingToolkitExpression;

	private collaborationColorExpression!: CompiledBindingToolkitExpression;

	private collaborationEnabled!: boolean;

	private dataSourcePath!: string;

	private insertableAndDeletable!: BindingToolkitExpression<boolean>;

	constructor(props: string | ($ControlSettings & PropertiesOf<MultiValueFieldBlock>), others?: $ControlSettings) {
		if (typeof props !== "string") {
			// type of props can be a string if we are cloning the MultiValueField inside an aggregation
			// in that case _isInEditMode has already been computed on the one we clone
			props._isInEditMode = compileExpression(UI.IsEditable);
		}
		super(props, others);
	}

	/**
	 * In case an external value is set (e.g. for providing data in a json model) we need to override the binding strings for the item.
	 * @param collectionBinding
	 * @param itemDataModelObjectPath
	 * @param textExpression
	 * @param key
	 * @returns MultiInputSettings
	 */
	private _overrideValue(
		collectionBinding: PropertyBindingInfo & { parameters?: object },
		itemDataModelObjectPath: DataModelObjectPath<PropertyPath | Property>,
		textExpression: CompiledBindingToolkitExpression,
		key: CompiledBindingToolkitExpression
	): MultiInputSettings {
		if (this.items) {
			const model = this.items.model ?? this.items.modelName;
			collectionBinding = { path: `${model}>${this.items.path}` };
			const commonTargetObjectProperty = itemDataModelObjectPath.targetObject as Property;
			const commonPropertyPath = `{${model}>${commonTargetObjectProperty.name}}`;

			// Text arrangement use case
			if (isPathAnnotationExpression<string>(commonTargetObjectProperty.annotations.Common?.Text)) {
				textExpression = `{${model}>${commonTargetObjectProperty.annotations.Common?.Text?.path}}`;
				// non text arrangement use case
			} else {
				textExpression = commonPropertyPath;
			}
			key = commonPropertyPath;
		}
		return {
			description: textExpression,
			collectionBinding,
			key: key
		};
	}

	/**
	 * Function to get the correct settings for the multi input.
	 * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
	 * @param formatOptions The format options to calculate the result
	 * @returns MultiInputSettings
	 */
	private _getMultiInputSettings(
		propertyDataModelObjectPath: DataModelObjectPath<Property>,
		formatOptions: FormatOptions | undefined
	): MultiInputSettings {
		const { collectionPath, itemDataModelObjectPath } = MultiValueFieldBlock._getPathStructure(propertyDataModelObjectPath);
		const collectionBinding = { path: collectionPath, parameters: { $$ownRequest: true }, templateShareable: false };

		const propertyPathOrProperty = propertyDataModelObjectPath.targetObject as PropertyPath | Property;
		const propertyDefinition = isPropertyPathExpression(propertyPathOrProperty)
			? propertyPathOrProperty.$target
			: propertyPathOrProperty;
		const commonText = propertyDefinition?.annotations.Common?.Text;
		const relativeLocation = getRelativePaths(propertyDataModelObjectPath);

		const textExpression = commonText
			? compileExpression(getExpressionFromAnnotation(commonText, relativeLocation))
			: getValueBinding(itemDataModelObjectPath, formatOptions ?? {}, true);

		const key = getValueBinding(itemDataModelObjectPath, formatOptions ?? {}, true);
		let displayOnly = false;
		if (getRelativePaths(itemDataModelObjectPath).length > 0) {
			// if the relative path to the value contains a navigation, create will not be possible in the delegate, so we force the display Mode
			displayOnly = true;
		}
		return {
			displayOnly,
			...this._overrideValue(collectionBinding, itemDataModelObjectPath, textExpression, key)
		};
	}

	// Process the dataModelPath to find the collection and the relative DataModelPath for the item.
	private static _getPathStructure(dataModelObjectPath: DataModelObjectPath<Property>): MultiValueFieldPathStructure {
		let firstCollectionPath = "";
		const currentEntitySet = dataModelObjectPath.contextLocation?.targetEntitySet
			? dataModelObjectPath.contextLocation.targetEntitySet
			: dataModelObjectPath.startingEntitySet;
		const navigatedPaths: string[] = [];
		const contextNavsForItem = dataModelObjectPath.contextLocation?.navigationProperties || [];
		for (const navProp of dataModelObjectPath.navigationProperties) {
			if (
				dataModelObjectPath.contextLocation === undefined ||
				!dataModelObjectPath.contextLocation.navigationProperties.some(
					(contextNavProp) => contextNavProp.fullyQualifiedName === navProp.fullyQualifiedName
				)
			) {
				// in case of relative entitySetPath we don't consider navigationPath that are already in the context
				navigatedPaths.push(navProp.name);
				contextNavsForItem.push(navProp);
				if (currentEntitySet.navigationPropertyBinding.hasOwnProperty(navProp.name)) {
					if (isMultipleNavigationProperty(navProp)) {
						break;
					}
				}
			}
		}
		firstCollectionPath = `${navigatedPaths.join("/")}`;
		const itemDataModelObjectPath: DataModelObjectPath<Property> = Object.assign({}, dataModelObjectPath);
		if (itemDataModelObjectPath.contextLocation) {
			itemDataModelObjectPath.contextLocation.navigationProperties = contextNavsForItem; // this changes the creation of the valueHelp ID ...
		}

		return { collectionPath: firstCollectionPath, itemDataModelObjectPath: itemDataModelObjectPath };
	}

	/**
	 * Calculate the fieldGroupIds for the MultiValueField.
	 * @param appComponent
	 * @returns The value for the fieldGroupIds
	 */
	private computeFieldGroupIds(appComponent?: AppComponent): string | undefined {
		if (!appComponent) {
			//for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
			return "";
		}
		const sideEffectService = appComponent.getSideEffectsService();
		const fieldGroupIds = sideEffectService.computeFieldGroupIds(
			this.dataModelPath.targetEntityType.fullyQualifiedName,
			(this.dataModelPath.targetObject as Property).fullyQualifiedName
		);
		if (this.collaborationEnabled) {
			const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${this.dataSourcePath}`;
			fieldGroupIds.push(collaborationFieldGroup);
		}
		this.fieldGroupIds = fieldGroupIds.length ? fieldGroupIds.join(",") : undefined;
		const result = fieldGroupIds.join(",");
		return result === "" ? undefined : result;
	}

	initialize(metaContextPath: MetaPath<unknown>): void {
		const owner = this._getOwner();

		this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
		const odataMetaModel = owner?.getMetaModel();

		const metaContext = odataMetaModel?.createBindingContext(metaContextPath.getPath()) as Context | undefined;

		const metaPathObject = metaContextPath?.getTarget();

		// If the target is a property with a DataFieldDefault, use this as data field
		if (isProperty(metaPathObject) && metaPathObject.annotations.UI?.DataFieldDefault !== undefined) {
			this.enhancedMetaPath = odataMetaModel?.createBindingContext(`@${UIAnnotationTerms.DataFieldDefault}`, metaContext) as Context;
		} else {
			this.enhancedMetaPath = metaContext as Context;
		}
		const dataFieldDataModelPath = this.getDataModelObjectForMetaPath(this.enhancedMetaPath.getPath(), this.contextPath)!;

		this.convertedDataField = dataFieldDataModelPath.targetObject as DataField;

		this.dataModelPath = enhanceDataModelPath<Property>(
			dataFieldDataModelPath,
			(this.convertedDataField.Value as PathAnnotationExpression<string>).path
		);
		this.dataSourcePath = getTargetObjectPath(this.dataModelPath);
		this.property = this.dataModelPath.targetObject as Property;

		let insertable = isPathInsertable(this.dataModelPath);
		const deleteNavigationRestriction = isPathDeletable(this.dataModelPath, {
			ignoreTargetCollection: true,
			authorizeUnresolvable: true
		});
		const deletePath = isPathDeletable(this.dataModelPath);

		// deletable:
		//		if restrictions come from Navigation we apply it
		//		otherwise we apply restrictions defined on target collection only if it's a constant
		//      otherwise it's true!
		let deletable = ifElse(
			deleteNavigationRestriction._type === "Unresolvable",
			or(not(isConstant(deletePath)), deletePath),
			deletePath
		);

		if (this.items) {
			insertable = deletable = constant(!this.readOnly);
		} else {
			this.visible = getVisibleExpression(this.dataModelPath, this.formatOptions);
		}

		this.insertableAndDeletable = and(insertable, deletable);
		this.collaborationExpression = constant(false);
		this.computeCollaborationProperties();
		if (this.formatOptions?.displayOnly === true || this.readOnly === true) {
			this.editMode = "Display";
		} else if (this.readOnly === false) {
			this.editMode = compileExpression(
				ifElse(
					and(insertable, deletable),
					ifElse(this.collaborationExpression, constant("ReadOnly"), constant("Editable")),
					constant("Display")
				)
			);
		} else {
			this.editMode = compileExpression(
				ifElse(
					and(insertable, deletable, UI.IsEditable),
					ifElse(this.collaborationExpression, constant("ReadOnly"), constant("Editable")),
					constant("Display")
				)
			);
		}

		this.displayMode = getDisplayMode(this.dataModelPath);

		const localDataModelPath = enhanceDataModelPath<Property>(
			this.getDataModelObjectForMetaPath(this.enhancedMetaPath.getPath(), this.contextPath)!,
			(this.convertedDataField.Value as PathAnnotationExpression<string>).path
		);

		this.item = this._getMultiInputSettings(localDataModelPath, this.formatOptions); // this function rewrites dataModelPath, therefore, for now a clean object is passed
		if (this.item.displayOnly) {
			this.editMode = "Display";
		}
		this.collection = this.item.collectionBinding;

		const appComponent = this.getAppComponent();
		this.fieldGroupIds = this.computeFieldGroupIds(appComponent);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	/**
	 * The function checks if the collaboration draft is supported.
	 * @returns True if the collaboration draft is supported.
	 */
	isCollaborationDraftSupported(): boolean {
		const owner = this._getOwner();
		const odataMetaModel = owner?.getMetaModel();
		return ModelHelper.isCollaborationDraftSupported(odataMetaModel!);
	}

	/**
	 * This helper computes the properties that are needed for the collaboration avatar.
	 */
	computeCollaborationProperties(): void {
		if (this.isCollaborationDraftSupported() && this.editMode !== "Display") {
			this.collaborationEnabled = true;
			this.collaborationExpression = UIFormatters.getCollaborationExpression(
				this.dataModelPath,
				CollaborationFormatters.hasCollaborationActivity
			);

			this.collaborationInitialsExpression = compileExpression(
				getCollaborationExpression(this.dataModelPath, CollaborationFormatters.getCollaborationActivityInitials)
			);
			this.collaborationColorExpression = compileExpression(
				getCollaborationExpression(this.dataModelPath, CollaborationFormatters.getCollaborationActivityColor)
			);
		}
	}

	/**
	 * Creates the content.
	 * @returns The content of the building block.
	 */
	createContent(): Control | undefined {
		const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);
		if (metaContextPath) {
			this.initialize(metaContextPath);

			// BuildingBlock with set ID scenario
			if (this.id) {
				this.vhIdPrefix = ID.generate([this.getId(), this.vhIdPrefix ?? "FieldValueHelp"]); // Use getId to retrieve ID, not this.id
			} else if (!this.vhIdPrefix) {
				// Maybe not entered
				this.vhIdPrefix = this.createId("FieldValueHelp")!;
			}
			const controller = this._getOwner()?.getRootController() as PageController;
			const view = controller.getView();
			const odataMetaModel = this._getOwner()?.getMetaModel();
			const metaContext = odataMetaModel?.createBindingContext(metaContextPath.getPath());
			const context = odataMetaModel?.createBindingContext(metaContextPath.getContextPath());
			if (!metaContext || !context) {
				return;
			}

			//create a new binding context for the value help

			const itemsAggregation = this.collection;
			const customAggregationLength = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.multiValueField?.itemsSizeLimit;
			if (customAggregationLength !== undefined) {
				itemsAggregation.length = customAggregationLength;
			}

			//compute the correct label
			const label = FieldHelper.computeLabelText(this.convertedDataField.Value as MetaModelType<DataFieldTypes>, {
				context: metaContext
			}) as string;

			const vhControl = ValueHelp.getValueHelpForMetaPath(
				this.getPageController(),
				getContextRelativeTargetObjectPath(this.dataModelPath)!,
				this.contextPath ?? this.getOwnerContextPath()!,
				this._getOwner()?.getMetaModel()
			);
			let valueHelp: string | undefined;
			if (vhControl && vhControl.getContent()) {
				valueHelp = vhControl.getContent()!.getId();
			}
			const multiValueField = (
				<MultiValueField
					id={this.createId("_mvf")}
					delegate={{ name: "sap/fe/macros/multivaluefield/MultiValueFieldDelegate" }}
					items={itemsAggregation}
					display={this.displayMode}
					width="100%"
					editMode={this.editMode}
					valueHelp={valueHelp}
					ariaLabelledBy={this.ariaLabelledBy ? this.ariaLabelledBy : []}
					showEmptyIndicator={this.formatOptions?.showEmptyIndicator}
					label={label}
					change={(MultiValueFieldRuntime.handleChange as unknown as Function).bind(MultiValueFieldRuntime, controller)}
					fieldGroupIds={this.fieldGroupIds}
					validateFieldGroup={FieldRuntime.onValidateFieldGroup}
				>
					{{
						items: <MultiValueFieldItem key={this.item.key} description={this.item.description} />,
						customData: <CustomData key="insertableAndDeletable" value={this.insertableAndDeletable} />
					}}
				</MultiValueField>
			);

			let formwrapper = null;
			if (this.collaborationEnabled) {
				const avatar = (
					<Avatar
						visible={this.collaborationExpression}
						initials={this.collaborationInitialsExpression}
						displaySize="Custom"
						customDisplaySize="1.5rem"
						customFontSize="0.8rem"
						backgroundColor={this.collaborationColorExpression}
						press={(): void => {
							FieldRuntimeHelper.showCollaborationEditUser(avatar, view);
						}}
					/>
				);
				formwrapper = (
					<FormElementWrapper>
						<HBox width="100%" renderType="Bare" alignItems="End">
							{{
								items: [multiValueField, avatar]
							}}
						</HBox>
					</FormElementWrapper>
				);

				multiValueField?.addEventDelegate(
					{
						onfocusin: (evt: jQuery.Event & { srcControl: Control }) => {
							const currentMultiValueField = evt.srcControl.getParent() as MultiValueField;
							controller.collaborativeDraft?.handleContentFocusIn(currentMultiValueField);

							if (valueHelpControl?.getDomRef()) {
								valueHelpControl.attachEventOnce("closed", () => {
									currentMultiValueField?.focus();
								});
							}
						},
						onfocusout: (evt: jQuery.Event & { srcControl: Control }) => {
							let currentMultiValueField = evt.srcControl.getParent() as MultiValueField;
							if (currentMultiValueField?.isA<Tokenizer>("sap.m.Tokenizer")) {
								currentMultiValueField = currentMultiValueField.getParent()?.getParent() as MultiValueField;
							}
							const event = new UI5Event("", currentMultiValueField, {
								fieldGroupIds: currentMultiValueField.getFieldGroupIds()
							});
							controller.collaborativeDraft.handleContentFocusOut(event);
						}
					},
					this
				);

				const valueHelpControl = Element.getElementById(multiValueField.getValueHelp()) as MdcValueHelp;

				valueHelpControl?.attachOpened((evt: ValueHelp$OpenedEvent) => {
					const currentMultiValueField = evt.getSource().getControl()!;
					controller.collaborativeDraft.handleContentFocusIn(currentMultiValueField as MultiValueField);
				});
			}
			multiValueField.addCustomData(new CustomData({ key: "forwardedItemsBinding", value: this.items }));
			return this.collaborationEnabled ? formwrapper : multiValueField;
		}
	}

	/**
	 * Setter for the readOnly property.
	 * @param readOnly
	 */
	setReadOnly(readOnly: boolean): void {
		super.setProperty("readOnly", readOnly);
		this.updateEditMode();
	}

	/**
	 * Setter for the _isInEditMode property.
	 * @param inEditMode
	 */
	set_isInEditMode(inEditMode: boolean): void {
		super.setProperty("_isInEditMode", inEditMode);
		this.updateEditMode();
	}

	/**
	 * The function returns the MultiValueField.
	 * @returns The MultiValueField.
	 */
	getMultiValueField(): MultiValueField {
		if (this.isCollaborationDraftSupported()) {
			return ((this.content as FormElementWrapper).content as HBox).getItems()[0] as MultiValueField;
		} else {
			return this.content as MultiValueField;
		}
	}

	/**
	 * Update the edit mode based on the readOnly and _isInEditMode properties.
	 */
	updateEditMode(): void {
		if (!this.content) {
			return;
		}
		const multivalueField = this.getMultiValueField();
		const insertableAndDeletable = multivalueField.data("insertableAndDeletable");
		if (this.readOnly === true) {
			this.editMode = "Display";
			multivalueField.setEditMode("Display");
		} else if (this.readOnly === false && insertableAndDeletable) {
			//readOnly false can only have impact if items are provided
			if (this._isInEditMode) {
				this.editMode = "Editable";
				multivalueField.setEditMode("Editable");
			} else {
				this.editMode = "Display";
				multivalueField.setEditMode("Display");
			}
		}
		// if readOnly is not explicitly set we keep teh standard behavior
	}

	/**
	 * On Before rendering froward the ariaLabelledBy to the mdc MultiValueField.
	 */
	onBeforeRendering(): void {
		if (this.content) {
			const multiValueField = this.getMultiValueField();
			const aAriaLabelledBy = (this as unknown as EnhanceWithUI5<MultiValueFieldBlock>).getAriaLabelledBy();

			for (const sId of aAriaLabelledBy) {
				const aAriaLabelledBys = multiValueField.getAriaLabelledBy();
				if (!aAriaLabelledBys.includes(sId)) {
					multiValueField.addAriaLabelledBy(sId);
				}
			}
		}
	}
}

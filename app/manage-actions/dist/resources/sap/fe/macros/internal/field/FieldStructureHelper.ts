import type { EntitySet, Property, PropertyPath, ServiceObject } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldForAnnotation,
	DataFieldTypes,
	DataPoint,
	DataPointTypeTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type {
	BindingToolkitExpression,
	CompiledBindingToolkitExpression,
	ExpressionOrPrimitive,
	PathInModelExpression
} from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	ifElse,
	not,
	pathInModel,
	transformRecursively
} from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { CollaborationFieldGroupPrefix } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { isDataField } from "sap/fe/core/converters/annotations/DataField";
import * as CollaborationFormatters from "sap/fe/core/formatters/CollaborationFormatter";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import {
	getRequiredPropertiesFromInsertRestrictions,
	getRequiredPropertiesFromUpdateRestrictions
} from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import { isPathAnnotationExpression, isProperty, isPropertyPathExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextRelativeTargetObjectPath,
	getRelativePaths,
	getTargetObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { getAssociatedExternalIdProperty, getAssociatedExternalIdPropertyPath, isSemanticKey } from "sap/fe/core/templating/PropertyHelper";
import { getPropertyWithSemanticObject, manageSemanticObjectsForCurrentUser } from "sap/fe/core/templating/SemanticObjectHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type { InputMaskFormatOptions } from "sap/fe/core/type/InputMask";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import {
	getDataModelObjectPathForValue,
	getDraftIndicatorVisibleBinding,
	getTextBindingExpression,
	getValueBinding,
	getVisibleExpression,
	hasPropertyInsertRestrictions,
	isRetrieveTextFromValueListEnabled,
	isUsedInNavigationWithQuickViewFacets,
	setEditStyleProperties
} from "sap/fe/macros/field/FieldTemplating";
import additionalValueFormatter from "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter";
import SituationsIndicator from "sap/fe/macros/situations/SituationsIndicator";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/Context";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { EventHandler } from "types/extension_types";
import type Field from "../../Field";
import type FieldFormatOptions from "../../field/FieldFormatOptions";
import type { DisplayStyle as DisplayStyleType, EditStyle as EditStyleType, FieldProperties } from "./FieldStyles";

export type InputFieldBlockProperties = Omit<PropertiesOf<Field>, "readOnly"> & {
	isPublicField?: boolean; //
	//add events from Field - 'PropertiesOf' does not include them
	change?: EventHandler;
	liveChange?: EventHandler;
	onLiveChange?: string;
	readOnly?: BindingToolkitExpression<boolean>;
};
export type FieldBlockProperties = {
	_controlConfiguration: TemplateProcessorSettings;
	_settings: TemplateProcessorSettings;
	isDynamicInstantiation?: boolean;
	change: string | undefined | EventHandler;
	metaPath: Context;
	contextPath: Context;
	isPublicField: boolean;
	visible?: boolean | CompiledBindingToolkitExpression;
	liveChange: EventHandler;
	onLiveChange?: string | EventHandler;
	//-----
	formatOptions: FieldFormatOptions;
	property: Property;
	dataModelPath: DataModelObjectPath<Property>;
	valueAsStringBindingExpression?: CompiledBindingToolkitExpression;
	unitBindingExpression?: string;
	displayVisible?: string | boolean;
	hasValidAnalyticalCurrencyOrUnit?: CompiledBindingToolkitExpression;
	convertedMetaPath: DataFieldAbstractTypes | DataPointTypeTypes;
	class?: string;
	ariaLabelledBy?: string[];
	hasUnitOrCurrency?: boolean;
	text?: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
	emptyIndicatorMode?: string;
	editableExpression: string | CompiledBindingToolkitExpression;
	fieldGroupIds?: string[];
	displayStyleId?: string;
	textFromValueList?: CompiledBindingToolkitExpression;
	hasQuickView: boolean;
	identifierTitle?: CompiledBindingToolkitExpression;
	identifierText?: CompiledBindingToolkitExpression;
	hasSituationsIndicator?: boolean;
	situationsIndicatorPropertyPath: string;
	showErrorIndicator: boolean;
	dynamicSemanticObjects?: BindingToolkitExpression<string>[];
	collaborationExpression: BindingToolkitExpression<boolean>;
	dataSourcePath?: string;
	editStyleId?: string;
	enabledExpression: string | CompiledBindingToolkitExpression;
	requiredExpression?: string;
	editModeAsObject: CompiledBindingToolkitExpression | BindingToolkitExpression<string>;
	computedEditMode: FieldEditMode | CompiledBindingToolkitExpression;
	valueBindingExpression?: CompiledBindingToolkitExpression;
	showTimezone?: boolean;
	minDateExpression: BindingToolkitExpression<unknown> | undefined | CompiledBindingToolkitExpression;
	maxDateExpression: BindingToolkitExpression<unknown> | undefined | CompiledBindingToolkitExpression;
	editStylePlaceholder?: string;
	staticDescription?: string;
	valueState?: CompiledBindingToolkitExpression;
	fileFilenameExpression: string;
	fileRelativePropertyPath: string;
	textBindingExpression?: CompiledBindingToolkitExpression;
	ratingIndicatorTooltip?: CompiledBindingToolkitExpression;
	ratingIndicatorTargetValue?: CompiledBindingToolkitExpression;
	mask?: InputMaskFormatOptions | null;
	editStyle?: EditStyleType | null;
	_apiId?: string;
	entityType?: Context;
	odataMetaModel: ODataMetaModel;
	propertyForFieldControl: UIFormatters.PropertyOrPath<Property>;
	descriptionBindingExpression?: string;
	quickViewType?: "SemanticLinks" | "Facets" | "FacetsAndSemanticLinks";
	displayStyle?: DisplayStyleType;
	unitEditable?: string;
	staticUnit?: string;
	valueInputWidth?: string;
	valueInputFieldWidth?: string;
	unitInputVisible?: CompiledBindingToolkitExpression;
	draftIndicatorVisible?: string;
	hasPropertyInsertRestrictions?: boolean | ExpressionOrPrimitive<boolean>;
	addDraftIndicator: boolean | undefined;
	convertedMetaPathExternalID?: Property;
	dataModelPathExternalID?: DataModelObjectPath<Property | PropertyPath>;
	valueHelpMetaPath?: Context;
	id: string;
	valueHelpId: string | undefined;
	metaPathContext: Context | undefined;
	contextPathContext: Context | undefined;
	eventHandlers: {
		change: EventHandler;
		liveChange: EventHandler;
		validateFieldGroup: EventHandler;
		handleTypeMissmatch: EventHandler;
		handleFileSizeExceed: EventHandler;
		handleUploadComplete: EventHandler;
		uploadStream: EventHandler;
		removeStream: EventHandler;
		handleOpenUploader: EventHandler;
		handleCloseUploader: EventHandler;
		openExternalLink: EventHandler;
		onFocusOut: EventHandler;
		linkPressed: EventHandler;
		displayAggregationDetails: EventHandler;
		onDataFieldWithNavigationPath: EventHandler;
		onDataFieldActionButton: EventHandler;
		onDataFieldWithIBN: EventHandler;
		showCollaborationEditUser: EventHandler;
	};
} & Omit<Field, "metaPath" | "contextPath" | "change" | "visible">;

export function setUpField(
	field: InputFieldBlockProperties,
	controlConfiguration: TemplateProcessorSettings,
	viewDataModel: JSONModel,
	internalModel: JSONModel,
	appComponent: AppComponent,
	isReadOnlyInitial?: boolean,
	metaPath?: Context | undefined,
	contextPath?: Context | undefined
): FieldBlockProperties {
	const resultField = { ...field } as unknown as FieldBlockProperties;
	Object.defineProperty(resultField, "value", {
		get: () => {
			return field.value;
		}
	});
	Object.defineProperty(resultField, "description", {
		get: () => {
			return field.description;
		}
	});

	resultField.change = field.change;
	resultField.metaPath = (metaPath ? metaPath : field.metaPath) as Context;
	resultField.contextPath = (contextPath ? contextPath : field.contextPath) as Context;
	resultField.visible = field.visible;

	//this currently works only for the field
	if (!resultField.vhIdPrefix) {
		resultField.vhIdPrefix = "FieldValueHelp";
		resultField._flexId = field.id;
		if (!resultField.idPrefix) {
			resultField.idPrefix = field.id;
		}
	}

	resultField.formatOptions ??= {} as FieldFormatOptions;
	resultField.formatOptions = getFormatOptions(resultField);
	resultField.formatOptions.showOnlyUnitDecimals =
		viewDataModel?.getProperty("/sapFeManifestConfiguration/app/showOnlyUnitDecimals") === true;

	resultField.valueHelpMetaPath = metaPath ? metaPath : resultField.metaPath;
	computeCommonProperties(resultField, resultField.valueHelpMetaPath?.getModel());
	resultField.convertedMetaPath = setUpDataPointType(resultField.convertedMetaPath);
	setUpVisibleProperties(resultField);
	computeIDs(resultField);
	resultField.dataSourcePath = getTargetObjectPath(resultField.dataModelPath);

	/* EXTERNALID */
	computeExternalID(resultField);
	resultField.entityType = resultField.odataMetaModel.createBindingContext(
		`/${resultField.dataModelPath.targetEntityType.fullyQualifiedName}`
	);
	if (resultField.formatOptions?.forInlineCreationRows === true) {
		resultField.hasPropertyInsertRestrictions = hasPropertyInsertRestrictions(resultField.dataModelPath);
	}
	computeEditMode(resultField);
	computeCollaborationProperties(resultField);
	computeEditableExpressions(resultField);
	resultField.formatOptions = resultField.formatOptions ? resultField.formatOptions : ({} as FieldFormatOptions);
	setUpFormatOptions(
		resultField,
		(resultField.dataModelPathExternalID as DataModelObjectPath<Property>) || resultField.dataModelPath,
		controlConfiguration,
		viewDataModel
	);
	setUpDisplayStyle(resultField, resultField.convertedMetaPath, resultField.dataModelPath, internalModel, appComponent);
	setUpEditStyle(resultField, appComponent);

	resultField.valueState = setUpValueState(resultField);
	if (resultField.editStyle === "InputWithValueHelp") {
		resultField.editStylePlaceholder = setInputWithValuehelpPlaceholder(resultField);
	}

	computeFileUploaderProperties(resultField);

	computeInlineEditProperties(resultField, viewDataModel);

	// ---------------------------------------- compute bindings----------------------------------------------------
	const aDisplayStylesWithoutPropText = ["Avatar", "AmountWithCurrency"];
	if (
		resultField.displayStyle &&
		!aDisplayStylesWithoutPropText.includes(resultField.displayStyle) &&
		resultField.dataModelPath.targetObject
	) {
		resultField.text =
			resultField.text ??
			resultField.value ??
			FieldTemplating.getTextBinding(
				(resultField.dataModelPathExternalID as DataModelObjectPath<Property>) || resultField.dataModelPath,
				resultField.formatOptions
			);
	} else {
		resultField.text = "";
	}

	if (resultField.formatOptions.showEmptyIndicator) {
		resultField.emptyIndicatorMode = String(resultField.formatOptions.showEmptyIndicator) === "true" ? "On" : undefined;
	} else {
		resultField.emptyIndicatorMode = undefined;
	}

	// If the target is a property with a DataFieldDefault, use this as data field
	if (isProperty(resultField.convertedMetaPath) && resultField.convertedMetaPath.annotations?.UI?.DataFieldDefault !== undefined) {
		resultField.metaPath = resultField.odataMetaModel.createBindingContext(
			`@${UIAnnotationTerms.DataFieldDefault}`,
			metaPath ? metaPath : resultField.metaPath
		);
	}

	if (!isReadOnlyInitial) {
		resultField.computedEditMode = compileExpression(ifElse(equal(resultField.readOnly, true), "Display", "Editable"));
	}

	resultField.eventHandlers = {
		change: (): void => {},
		liveChange: (): void => {},
		validateFieldGroup: (): void => {},
		handleTypeMissmatch: (): void => {},
		handleFileSizeExceed: (): void => {},
		handleUploadComplete: (): void => {},
		uploadStream: (): void => {},
		removeStream: (): void => {},
		handleOpenUploader: (): void => {},
		handleCloseUploader: (): void => {},
		openExternalLink: (): void => {},
		onFocusOut: (): void => {},
		linkPressed: (): void => {},
		displayAggregationDetails: (): void => {},
		onDataFieldWithNavigationPath: (): void => {},
		showCollaborationEditUser: (): void => {},
		onDataFieldActionButton: (): void => {},
		onDataFieldWithIBN: (): void => {}
	};

	return resultField;
}

/**
 * This helper computes the properties that are needed for the collaboration avatar.
 * @param field Reference to the current field instance
 */
export function computeCollaborationProperties(field: FieldBlockProperties): void {
	const computedEditableExpression = UIFormatters.getEditableExpressionAsObject(
		field.propertyForFieldControl,
		field.convertedMetaPath,
		field.dataModelPath
	);
	if (ModelHelper.isCollaborationDraftSupported(field.odataMetaModel) && field.editMode !== FieldEditMode.Display) {
		const collaborationEnabled = true;
		// Expressions needed for Collaboration Visualization
		const collaborationExpression = UIFormatters.getCollaborationExpression(
			field.dataModelPath,
			CollaborationFormatters.hasCollaborationActivity
		);
		const editableExpression = compileExpression(and(computedEditableExpression, not(collaborationExpression)));

		const editMode = compileExpression(
			ifElse(
				collaborationExpression,
				constant("ReadOnly"),
				ifElse(and(UI.IsInactive, !!field.hasPropertyInsertRestrictions), "Display", field.editModeAsObject)
			)
		);
		field.collaborationEnabled = collaborationEnabled;
		field.collaborationExpression = collaborationExpression;
		field.editableExpression = editableExpression;
		field.computedEditMode = editMode;
	} else {
		field.editableExpression = compileExpression(computedEditableExpression);
	}
}

/**
 * This helper sets the common properties convertedMetaPath, dataModelPath
 * and property that can be reused in the individual templates if required.
 * @param field Reference to the current field instance
 * @param metaModel
 */
export function computeCommonProperties(field: FieldBlockProperties, metaModel: ODataMetaModel): void {
	field.convertedMetaPath = MetaModelConverter.convertMetaModelContext(field.metaPathContext ? field.metaPathContext : field.metaPath) as
		| DataFieldAbstractTypes
		| DataPointTypeTypes;

	let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldAbstractTypes | DataPointTypeTypes | Property>(
		field.metaPathContext ? field.metaPathContext : field.metaPath,
		field.contextPath
	);
	dataModelPath =
		getDataModelObjectPathForValue(dataModelPath as DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>) || dataModelPath;
	field.dataModelPath = dataModelPath as DataModelObjectPath<Property>;
	field.property = dataModelPath.targetObject as Property;
	field.odataMetaModel = metaModel;
	field.propertyForFieldControl = (dataModelPath?.targetObject as unknown as DataFieldTypes)?.Value
		? (dataModelPath?.targetObject as unknown as DataFieldTypes).Value
		: dataModelPath?.targetObject;
}

/**
 * Helper to computes some of the expression for further processing.
 * @param field Reference to the current field instance
 */
export function computeEditableExpressions(field: FieldBlockProperties): void {
	const requiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions(
		(field.contextPathContext ? field.contextPathContext : field.contextPath)
			?.getPath()
			.replaceAll("/$NavigationPropertyBinding/", "/"),
		field.odataMetaModel
	);
	const requiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions(
		(field.contextPathContext ? field.contextPathContext : field.contextPath)
			?.getPath()
			.replaceAll("/$NavigationPropertyBinding/", "/"),
		field.odataMetaModel
	);
	const oRequiredProperties = {
		requiredPropertiesFromInsertRestrictions: requiredPropertiesFromInsertRestrictions,
		requiredPropertiesFromUpdateRestrictions: requiredPropertiesFromUpdateRestrictions
	};

	const enabledExpression = UIFormatters.getEnabledExpression(
		field.propertyForFieldControl,
		field.convertedMetaPath,
		false,
		field.dataModelPath
	) as CompiledBindingToolkitExpression;
	const requiredExpression = UIFormatters.getRequiredExpression(
		field.propertyForFieldControl,
		field.convertedMetaPath,
		false,
		false,
		oRequiredProperties,
		field.dataModelPath
	) as CompiledBindingToolkitExpression;

	field.enabledExpression = enabledExpression;
	field.requiredExpression = requiredExpression;
}

export function computeEditMode(field: FieldBlockProperties): void {
	if (field.editMode !== undefined && field.editMode !== null) {
		// Even if it provided as a string it's a valid part of a binding expression that can be later combined into something else.
		field.editModeAsObject = field.editMode;
	} else {
		const measureReadOnly = field.formatOptions?.measureDisplayMode ? field.formatOptions.measureDisplayMode === "ReadOnly" : false;

		field.editModeAsObject = UIFormatters.getEditMode(
			field.propertyForFieldControl,
			field.dataModelPath,
			measureReadOnly,
			true,
			field.convertedMetaPath
		);
		field.computedEditMode = compileExpression(
			ifElse(and(UI.IsInactive, !!field.hasPropertyInsertRestrictions), "Display", field.editModeAsObject)
		);
	}
}

export function computeExternalID(field: FieldBlockProperties): void {
	const externalIDProperty = getAssociatedExternalIdProperty(field.property);

	if (externalIDProperty) {
		if (field.property) field.property.type = externalIDProperty.type;
		if (isDataField(field.convertedMetaPath)) {
			field.convertedMetaPath.Value.$target.type = externalIDProperty.type;
		}
		const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(field.property);
		const externalIdContext = field.metaPath
			.getModel()
			.createBindingContext(field.contextPath?.getPath() + "/" + externalIdPropertyPath, field.metaPath);

		field.convertedMetaPathExternalID = MetaModelConverter.convertMetaModelContext(externalIdContext) as Property;

		let dataModelPath: DataModelObjectPath<Property> = MetaModelConverter.getInvolvedDataModelObjects(
			externalIdContext as Context,
			field.contextPath
		);
		dataModelPath = getDataModelObjectPathForValue(dataModelPath as DataModelObjectPath<DataFieldAbstractTypes>) || dataModelPath;
		field.dataModelPathExternalID = dataModelPath;
	}
}

/**
 * Calculate the fieldGroupIds for an Input or other edit control.
 * @param field
 * @param appComponent
 * @returns The fieldGroupIds
 */
function computeFieldGroupIds(field: FieldBlockProperties, appComponent?: AppComponent): string[] | undefined {
	const typesForCollaborationFocusManagement = [
		"InputWithValueHelp",
		"TextArea",
		"DatePicker",
		"TimePicker",
		"DateTimePicker",
		"InputWithUnit",
		"Input",
		"InputMask",
		"Masked"
	];

	if (!appComponent) {
		//for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
		return;
	}
	const sideEffectService = appComponent.getSideEffectsService();
	const fieldGroupIds = sideEffectService.computeFieldGroupIds(
		field.dataModelPath.targetEntityType?.fullyQualifiedName ?? "",
		field.dataModelPath.targetObject?.fullyQualifiedName ?? ""
	);

	field.mainPropertyRelativePath = isProperty(field.dataModelPath.targetObject)
		? getContextRelativeTargetObjectPath(field.dataModelPath)
		: undefined;

	if (field.collaborationEnabled && typesForCollaborationFocusManagement.includes(field.editStyle || "")) {
		const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${field.dataSourcePath}`;
		fieldGroupIds.push(collaborationFieldGroup);
	}

	return fieldGroupIds.length ? fieldGroupIds : undefined;
}

/**
 * This helper is for the ID of the field according to several different scenarios.
 *
 * displayStyleId is used for all controls inside the field wrapper in display mode. A <sap.m.text> control would get this ID. An example is: ApplicationContext::Field-display.
 * editStyleId is used for all controls inside the field wrapper in edit mode. A <sap.ui.mdc.field> control would get this ID. An example is: ApplicationContext::Field-edit.
 *
 * If no wrapper exists the wrappers ID will be propagated to the first control displayed, A <sap.m.text> control would get this ID. An example is: ApplicationContext::Field-content.
 * @param field Reference to the current field instance
 */
export function computeIDs(field: Partial<FieldBlockProperties>): void {
	if (field._flexId && !field._apiId) {
		field._apiId = field._flexId;
		field._flexId = getContentId(field._flexId);
	}

	if (field.idPrefix) {
		field.editStyleId = generate([field.idPrefix, "Field-edit"]);
	}
	//NoWrapperId scenario is for the LR table.
	if (field.formatOptions?.fieldMode === "nowrapper" && field.editMode === "Display") {
		if (field._flexId) {
			field.displayStyleId = field._flexId;
		} else {
			field.displayStyleId = field.idPrefix ? generate([field.idPrefix, "Field-content"]) : undefined;
		}
	} else if (field.idPrefix) {
		field.displayStyleId = generate([field.idPrefix, "Field-display"]);
	}
}

/**
 * Sets the internal formatOptions for the building block.
 * @param field
 * @returns A string with the internal formatOptions for the building block
 */
export function getFormatOptions(field: FieldBlockProperties): FieldFormatOptions {
	return {
		...field.formatOptions,
		textAlignMode: field.formatOptions.textAlignMode ?? "Form",
		showEmptyIndicator: field.formatOptions.showEmptyIndicator ?? true,
		displayMode: field.formatOptions.displayMode as DisplayMode,
		measureDisplayMode: field.formatOptions.measureDisplayMode,
		textLinesEdit: field.formatOptions.textLinesEdit,
		textMaxLines: field.formatOptions.textMaxLines,
		textMaxCharactersDisplay: field.formatOptions.textMaxCharactersDisplay,
		textExpandBehaviorDisplay: field.formatOptions.textExpandBehaviorDisplay,
		textMaxLength: field.formatOptions.textMaxLength,
		fieldEditStyle: field.formatOptions.fieldEditStyle,
		radioButtonsHorizontalLayout: field.formatOptions.radioButtonsHorizontalLayout,
		showTime: field.formatOptions.showTime,
		showTimezone: field.formatOptions.showTimezone,
		showDate: field.formatOptions.showDate
	} as FieldFormatOptions;
}

function getObjectIdentifierText(
	fieldFormatOptions: FieldFormatOptions,
	propertyDataModelObjectPath: DataModelObjectPath<Property | PropertyPath>
): CompiledBindingToolkitExpression {
	let propertyBindingExpression: BindingToolkitExpression<string> = pathInModel(
		getContextRelativeTargetObjectPath(propertyDataModelObjectPath)
	);
	const targetDisplayMode = fieldFormatOptions?.displayMode;
	const propertyDefinition = isPropertyPathExpression(propertyDataModelObjectPath.targetObject)
		? (propertyDataModelObjectPath.targetObject.$target as Property)
		: (propertyDataModelObjectPath.targetObject as Property);

	const commonText = propertyDefinition.annotations?.Common?.Text;
	if (commonText === undefined) {
		return undefined;
	}
	propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);

	switch (targetDisplayMode) {
		case "ValueDescription":
			const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
			return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
		case "DescriptionValue":
			return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
		default:
			return undefined;
	}
}

function getOverrides(controlConfiguration: TemplateProcessorSettings, id: string): FieldProperties {
	/*
		Qualms: We need to use this TemplateProcessorSettings type to be able to iterate
		over the properties later on and cast it afterwards as a field property type
	*/
	const props = {} as TemplateProcessorSettings;

	if (controlConfiguration) {
		const controlConfig = controlConfiguration[id] as TemplateProcessorSettings;
		if (controlConfig) {
			Object.keys(controlConfig).forEach(function (configKey) {
				props[configKey] = controlConfig[configKey];
			});
		}
	}
	return props as unknown as FieldProperties;
}

/**
 * Prepare the display style of the field in case of semantic objects or quickview facets.
 * @param field The field
 * @param internalModel
 * @param dataModelPath The DataModelObjectPath of the property
 * @param hasSemanticObjects
 * @param hasQuickView
 */
function manageQuickViewForDisplayStyle(
	field: FieldBlockProperties,
	internalModel: JSONModel,
	dataModelPath: DataModelObjectPath<Property>,
	hasSemanticObjects: boolean,
	hasQuickView: boolean
): void {
	if (hasQuickView) {
		field.hasQuickView = true;
		field.quickViewType = "Facets";
	}
	if (hasSemanticObjects) {
		const foundSemanticObjects = manageSemanticObjectsForCurrentUser(field.semanticObject, dataModelPath, internalModel);
		if (foundSemanticObjects.hasReachableStaticSemanticObject || foundSemanticObjects.dynamicSemanticObjects.length) {
			field.hasQuickView = true;
			field.quickViewType = hasQuickView ? "FacetsAndSemanticLinks" : "SemanticLinks";
			field.dynamicSemanticObjects =
				foundSemanticObjects.hasReachableStaticSemanticObject !== true ? foundSemanticObjects.dynamicSemanticObjects : undefined;
		}
	}
}

/**
 * Check field to know if it has a semantic object.
 * @param field The field
 * @param dataModelPath The DataModelObjectPath of the property
 * @returns True if field has a semantic object
 */
function propertyOrNavigationPropertyHasSemanticObject(field: FieldBlockProperties, dataModelPath: DataModelObjectPath<Property>): boolean {
	return !!getPropertyWithSemanticObject(dataModelPath) || (field.semanticObject !== undefined && field.semanticObject !== "");
}

export function setInputWithValuehelpPlaceholder(field: FieldBlockProperties): CompiledBindingToolkitExpression {
	let targetEntityType;
	const editStylePlaceholder = field.editStylePlaceholder;
	const fieldContainerType = field.formatOptions.textAlignMode;
	if (fieldContainerType === "Table") {
		targetEntityType = field.dataModelPath.targetEntityType;
	}
	const propertyPath = field.dataModelPath.targetObject?.name;
	const recommendationValue = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderValue`);
	const recommendationDescription = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`);
	const placeholderExp = formatResult(
		[
			recommendationValue,
			recommendationDescription,
			pathInModel(`/recommendationsData`, "internal"),
			pathInModel(`/currentCtxt`, "internal"),
			pathInModel(`${propertyPath}@$ui5.fe.messageType`),
			editStylePlaceholder,
			field.formatOptions.displayMode
		],
		additionalValueFormatter.formatPlaceholder,
		targetEntityType
	);

	return compileExpression(placeholderExp);
}

export function setUpDataPointType(dataField: DataFieldAbstractTypes | DataPointTypeTypes): DataFieldAbstractTypes | DataPointTypeTypes {
	// data point annotations need not have $Type defined, so add it if missing
	const dataPointType = { ...dataField };
	if ((dataField as unknown as DataPoint)?.term === "com.sap.vocabularies.UI.v1.DataPoint") {
		dataPointType.$Type = dataField.$Type || UIAnnotationTypes.DataPointType;
	}
	return dataPointType;
}

export function getDecimalPadding(appComponent: AppComponent | undefined, property: Property): number | undefined {
	const manifest = appComponent?.getManifestEntry("sap.fe");
	return property?.annotations?.Measures?.ISOCurrency
		? manifest?.macros?.table?.currency?.decimalPadding ?? 3
		: manifest?.macros?.table?.unitOfMeasure?.decimalPadding ?? 3;
}

export function setUpDisplayStyle(
	field: FieldBlockProperties,
	dataField: DataFieldAbstractTypes | DataPointTypeTypes,
	dataModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>,
	internalModel: JSONModel,
	appComponent: AppComponent
): FieldBlockProperties {
	const resultField: FieldBlockProperties = field;
	const property: Property = dataModelPath.targetObject as Property;
	if (!dataModelPath.targetObject) {
		resultField.displayStyle = "Text";
		return resultField;
	}

	resultField.hasUnitOrCurrency =
		property.annotations?.Measures?.Unit !== undefined || property.annotations?.Measures?.ISOCurrency !== undefined;
	resultField.hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit(
		dataModelPath as DataModelObjectPath<Property>
	);
	resultField.textFromValueList = compileExpression(
		formatResult(
			[
				pathInModel(getContextRelativeTargetObjectPath(dataModelPath)),
				`/${property.fullyQualifiedName}`,
				resultField.formatOptions.displayMode
			],
			"sap.fe.macros.field.FieldRuntime.retrieveTextFromValueList"
		)
	);

	if (property.annotations?.UI?.IsImage) {
		resultField.displayStyle = "File";
		return resultField;
	}
	if (property.annotations?.UI?.IsImageURL) {
		resultField.displayStyle = "Avatar";
		return resultField;
	}
	if (property.annotations?.UI?.InputMask) {
		resultField.displayStyle = "Text";
		return resultField;
	}
	if (property.annotations?.Common?.Masked) {
		resultField.displayStyle = "Masked";
		return resultField;
	}
	// For compatibility reasons, Stream will be shown within an entity instance as circle if the entity is annotated as IsNaturalPerson
	// and neither IsImage nor IsImageURL annotation has been used.
	if (property.type === "Edm.Stream") {
		resultField.displayStyle = "File";
		return resultField;
	}
	setUpDraftIndicator(dataModelPath as DataModelObjectPath<Property>, resultField);
	switch (dataField.$Type as string) {
		case UIAnnotationTypes.DataPointType:
			resultField.displayStyle = "DataPoint";
			return resultField;
		case UIAnnotationTypes.DataFieldForAnnotation:
			if ((dataField as unknown as DataFieldForAnnotation).Target?.$target?.$Type === UIAnnotationTypes.DataPointType) {
				resultField.displayStyle = "DataPoint";
				return resultField;
			} else if (
				(dataField as unknown as DataFieldForAnnotation).Target?.$target?.$Type ===
				"com.sap.vocabularies.Communication.v1.ContactType"
			) {
				resultField.displayStyle = "Contact";
				return resultField;
			}
			break;
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			resultField.displayStyle = "Button";
			return resultField;
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithAction:
			resultField.displayStyle = "Link";
			return resultField;
	}
	const hasQuickView = isUsedInNavigationWithQuickViewFacets(dataModelPath, property);
	const hasSemanticObjects = propertyOrNavigationPropertyHasSemanticObject(resultField, dataModelPath as DataModelObjectPath<Property>);

	if (isSemanticKey(property, dataModelPath) && resultField.formatOptions.semanticKeyStyle) {
		manageQuickViewForDisplayStyle(
			resultField,
			internalModel,
			dataModelPath as DataModelObjectPath<Property>,
			hasSemanticObjects,
			hasQuickView
		);
		setUpObjectIdentifierTitleAndText(resultField, dataModelPath as DataModelObjectPath<Property>);
		resultField.showErrorIndicator =
			(dataModelPath.contextLocation as unknown as DataModelObjectPath<ServiceObject>)?.targetObject?._type ===
				"NavigationProperty" && !resultField.formatOptions.fieldGroupDraftIndicatorPropertyPath;
		resultField.situationsIndicatorPropertyPath = (dataModelPath.targetObject as Property).name;
		resultField.displayStyle =
			resultField.formatOptions.semanticKeyStyle === "ObjectIdentifier" ? "ObjectIdentifier" : "LabelSemanticKey";
		return resultField;
	}
	if (dataField.Criticality) {
		manageQuickViewForDisplayStyle(
			resultField,
			internalModel,
			dataModelPath as DataModelObjectPath<Property>,
			hasSemanticObjects,
			hasQuickView
		);
		resultField.displayStyle = "ObjectStatus";
		return resultField;
	}
	if (
		(property.annotations?.Measures?.ISOCurrency || property.annotations?.Measures?.Unit) &&
		String(resultField.formatOptions.isCurrencyOrUnitAligned) === "true" &&
		resultField.formatOptions.measureDisplayMode !== "Hidden"
	) {
		const decimalPadding = FieldStructureHelper.getDecimalPadding(appComponent, property);
		resultField.valueAsStringBindingExpression = resultField.value
			? resultField.value
			: getValueBinding(
					dataModelPath as DataModelObjectPath<Property>,
					resultField.formatOptions,
					false,
					true,
					undefined,
					true,
					false,
					decimalPadding,
					true
			  );

		resultField.unitBindingExpression = compileExpression(
			UIFormatters.getBindingForUnitOrCurrency(
				dataModelPath as DataModelObjectPath<Property>,
				true,
				!!field.formatOptions.showOnlyUnitDecimals
			)
		);
		resultField.displayStyle = "NumberWithUnitOrCurrencyAligned";

		return resultField;
	}
	if (property.annotations?.Communication?.IsEmailAddress || property.annotations?.Communication?.IsPhoneNumber) {
		resultField.displayStyle = "Link";
		return resultField;
	}
	if (property.annotations?.UI?.MultiLineText) {
		resultField.displayStyle = "ExpandableText";
		return resultField;
	}

	if (dataField.$Type === UIAnnotationTypes.DataFieldWithUrl) {
		resultField.displayStyle = "Link";
		return resultField;
	}

	resultField.displayStyle = "Text";
	manageQuickViewForDisplayStyle(
		resultField,
		internalModel,
		dataModelPath as DataModelObjectPath<Property>,
		hasSemanticObjects,
		hasQuickView
	);
	if (resultField.hasQuickView) {
		resultField.displayStyle = "LinkWithQuickView";
	}
	return resultField;
}

/**
 * This determines whether we should add a draft indicator within the field template.
 * @param dataModelPath DataModelObjectPath pointing to the main property for the field
 * @param field
 */
function setUpDraftIndicator(dataModelPath: DataModelObjectPath<Property>, field: FieldBlockProperties): void {
	if (isSemanticKey(dataModelPath.targetObject as Property, dataModelPath)) {
		field.hasSituationsIndicator = SituationsIndicator.getSituationsNavigationProperty(dataModelPath.targetEntityType) !== undefined;
		if (
			(dataModelPath.contextLocation?.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftRoot &&
			(dataModelPath.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftRoot &&
			field.formatOptions?.hasDraftIndicator === true
		) {
			// In case of a grid table or tree table hasDraftIndicator will be false since the draft
			// indicator needs to be rendered into a separate column
			// Hence we then fall back to display styles ObjectIdentifier or LabelSemanticKey instead
			// of the combined ID and draft indicator style
			field.draftIndicatorVisible = getDraftIndicatorVisibleBinding(dataModelPath.targetObject?.name) as string;
			field.addDraftIndicator = true;
		}
	}
}

export function setUpEditStyle(field: FieldBlockProperties, appComponent?: AppComponent): FieldBlockProperties {
	const resultField = field;
	setEditStyleProperties(resultField, resultField.convertedMetaPath, resultField.dataModelPath);
	resultField.fieldGroupIds = computeFieldGroupIds(resultField, appComponent);
	return resultField;
}

export function setUpObjectIdentifierTitleAndText(
	field: FieldBlockProperties,
	propertyDataModelObjectPath: DataModelObjectPath<Property>
): void {
	const semanticStyle = field.formatOptions?.semanticKeyStyle;
	const displayMode = field.formatOptions.displayMode;
	field.identifierTitle = getTitleBindingExpression(
		propertyDataModelObjectPath,
		getTextBindingExpression,
		{ displayMode, splitTitleOnTwoLines: field.formatOptions.semanticKeyStyle === "ObjectIdentifier" },
		undefined,
		undefined
	);
	field.identifierText =
		semanticStyle === "ObjectIdentifier" ? getObjectIdentifierText(field.formatOptions, propertyDataModelObjectPath) : undefined;
}

export function setUpFormatOptions(
	field: FieldBlockProperties,
	dataModelPath: DataModelObjectPath<Property>,
	controlConfiguration: TemplateProcessorSettings,
	viewDataModel: JSONModel
): void {
	const overrideProps = getOverrides(controlConfiguration, (field.metaPathContext ? field.metaPathContext : field.metaPath).getPath());

	if (!field.formatOptions.displayMode) {
		field.formatOptions.displayMode = UIFormatters.getDisplayMode(dataModelPath);
	}
	if (field.formatOptions.displayMode === "Description") {
		field.valueAsStringBindingExpression = field.value
			? field.value
			: getValueBinding(dataModelPath, field.formatOptions, true, true, undefined, true);
	}
	field.formatOptions.textLinesEdit =
		(overrideProps as unknown as FieldFormatOptions).textLinesEdit ||
		(overrideProps.formatOptions && overrideProps.formatOptions.textLinesEdit) ||
		field.formatOptions.textLinesEdit ||
		4;
	field.formatOptions.textMaxLines =
		(overrideProps as unknown as FieldFormatOptions).textMaxLines ||
		(overrideProps.formatOptions && overrideProps.formatOptions.textMaxLines) ||
		field.formatOptions.textMaxLines;

	// Retrieve text from value list as fallback feature for missing text annotation on the property
	if (viewDataModel?.getProperty("/retrieveTextFromValueList")) {
		field.formatOptions.retrieveTextFromValueList = isRetrieveTextFromValueListEnabled(
			dataModelPath.targetObject!,
			field.formatOptions
		);
		if (field.formatOptions.retrieveTextFromValueList) {
			// Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
			const hasEntityTextArrangement = !!dataModelPath?.targetEntityType?.annotations?.UI?.TextArrangement;
			field.formatOptions.displayMode = hasEntityTextArrangement ? field.formatOptions.displayMode : "DescriptionValue";
		}
	}
}

export function setUpValueState(field: FieldBlockProperties): CompiledBindingToolkitExpression {
	let valueStateExp;
	const fieldContainerType = field.formatOptions?.textAlignMode ? field.formatOptions?.textAlignMode : "Form";
	const propertyPathInModel = pathInModel(getContextRelativeTargetObjectPath(field.dataModelPath)) as PathInModelExpression<Property>;
	const relativeLocation = getRelativePaths(field.dataModelPath);
	const textPath = getExpressionFromAnnotation(field.dataModelPath?.targetObject?.annotations?.Common?.Text, relativeLocation);
	const propertyPath = field.dataModelPath.targetObject?.name;
	const recommendationValue = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderValue`);
	const recommendationDescription = pathInModel(`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`);
	if (fieldContainerType === "Table") {
		valueStateExp = formatResult(
			[
				recommendationValue,
				recommendationDescription,
				pathInModel(`/recommendationsData`, "internal"),
				pathInModel(`/isEditable`, "ui"),
				field.dataSourcePath,
				propertyPathInModel,
				textPath
			],
			additionalValueFormatter.formatValueState,
			field.dataModelPath.targetEntityType
		);
	} else {
		valueStateExp = formatResult(
			[
				recommendationValue,
				recommendationDescription,
				pathInModel(`/recommendationsData`, "internal"),
				pathInModel(`/isEditable`, "ui"),
				field.dataSourcePath,
				propertyPathInModel,
				textPath
			],
			additionalValueFormatter.formatValueState
		);
	}

	field.valueState = compileExpression(valueStateExp);
	return field.valueState;
}

export function setUpVisibleProperties(field: FieldBlockProperties): void {
	// we do this before enhancing the dataModelPath so that it still points at the DataField
	// const visibleProperties: Partial<fieldBlock> = {};
	const propertyDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldAbstractTypes>(
		field.metaPathContext ? field.metaPathContext : field.metaPath,
		field.contextPath
	);

	field.visible ??= getVisibleExpression(propertyDataModelObjectPath, field.formatOptions);
	field.displayVisible = field.formatOptions?.fieldMode === "nowrapper" ? field.visible : undefined;
}

function getContentId(macroId: string): string {
	return `${macroId}-content`;
}

/**
 * Computes properties for the file templating.
 * @param field The field
 */
function computeFileUploaderProperties(field: FieldBlockProperties): void {
	if (field.displayStyle === "File") {
		field.fileRelativePropertyPath = getContextRelativeTargetObjectPath(field.dataModelPath) || "";
		const fileNameAnnotation = field.property.annotations.Core?.ContentDisposition?.Filename;
		if (isPathAnnotationExpression(fileNameAnnotation)) {
			const fileNameDataModelPath = enhanceDataModelPath(field.dataModelPath, fileNameAnnotation.path);
			field.fileFilenameExpression = getContextRelativeTargetObjectPath(fileNameDataModelPath) ?? "";
		}
	}
}

/**
 * Computes properties for the inline edit templating.
 * @param field The field
 * @param viewDataModel
 */
function computeInlineEditProperties(field: FieldBlockProperties, viewDataModel: JSONModel): void {
	if (field.displayStyle === "File" || field.displayStyle === "Avatar") {
		field.inlineEditEnabled = undefined;
		return;
	}
	field.inlineEditEnabled =
		field.inlineEditEnabled === true || viewDataModel?.getProperty("/isInlineEditEnabled") === true ? true : undefined;
	if (field.inlineEditEnabled && field.editModeAsObject !== "Display") {
		const computedEditableExpression = UIFormatters.getEditableExpressionAsObject(
			field.propertyForFieldControl,
			field.convertedMetaPath,
			field.dataModelPath
		);

		field.hasInlineEdit = transformRecursively(
			computedEditableExpression,
			"PathInModel",
			(expr) => {
				if (expr.path === "isEditable" && expr.modelName === "ui") {
					return constant(true);
				}
				return expr;
			},
			true
		) as unknown as boolean;
	}
}

const FieldStructureHelper = {
	getDecimalPadding,
	setUpField,
	computeExternalID,
	setUpDisplayStyle,
	setUpObjectIdentifierTitleAndText,
	setUpValueState
};
export default FieldStructureHelper;

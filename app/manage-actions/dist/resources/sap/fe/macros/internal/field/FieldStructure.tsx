import type PageController from "sap/fe/core/PageController";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getAssociatedCurrencyProperty, getAssociatedUnitProperty, hasValueHelp } from "sap/fe/core/templating/PropertyHelper";
import ValueHelp from "sap/fe/macros/ValueHelp";
import HBox from "sap/m/HBox";
import VBox from "sap/m/VBox";
import type { TextAlign } from "sap/ui/core/library";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { EventHandler } from "types/extension_types";
import CommonHelper from "../../CommonHelper";
import FieldWrapper from "../../controls/FieldWrapper";
import FieldHelper from "../../field/FieldHelper";
import DisplayStyle from "./DisplayStyle";
import EditStyle from "./EditStyle";
import type { InputFieldBlockProperties } from "./FieldStructureHelper";
import { setUpField, type FieldBlockProperties } from "./FieldStructureHelper";

/**
 * The function calculates the corresponding ValueHelp field in case it´s
 * defined for the specific control.
 * @param field
 * @param pageController
 * @param metaModel
 * @returns An XML-based string with a possible ValueHelp control.
 */
export function getPossibleValueHelpTemplateId(
	field: FieldBlockProperties,
	pageController: PageController,
	metaModel: ODataMetaModel
): string | undefined {
	/* For currency (and later Unit) we need to forward the value help to the annotated field */
	const targetProperty = getAssociatedCurrencyProperty(field.property) ?? getAssociatedUnitProperty(field.property) ?? field.property;
	if (targetProperty && hasValueHelp(targetProperty)) {
		// depending on whether this one has a value help annotation included, add the dependent
		const vhTemplate = ValueHelp.getValueHelpForMetaPath(
			pageController,
			field.dataSourcePath!,
			field.contextPath?.getPath(),
			metaModel
		);
		return vhTemplate?.getContent()?.getId();
	}
	return "";
}

/**
 * Create the fieldWrapper control for use cases with display and edit styles.
 * @param field Reference to the current internal field instance
 * @returns An XML-based string with the definition of the field control
 */
export function createFieldWrapper(field: FieldBlockProperties): string {
	let fieldWrapperID;
	if (field._flexId) {
		fieldWrapperID = field._flexId;
	} else if (field.idPrefix) {
		fieldWrapperID = generate([field.idPrefix, "Field-content"]);
	} else {
		fieldWrapperID = undefined;
	}

	// compute the display part and the edit part for the fieldwrapper control
	const contentDisplay = DisplayStyle.getTemplate(field);
	// content edit part needs to be wrapped further with an hbox in case of collaboration mode
	// that´s why we need to call this special helper here which finally calls internally EditStyle.getTemplate
	// const contentEdit = EditStyle.getTemplateWithWrapper(field, controller, handleChange, field);
	const contentEdit = EditStyle.getTemplateWithWrapper(field);

	return (
		<FieldWrapper
			id={fieldWrapperID}
			editMode={field.editMode ?? field.computedEditMode}
			width="100%"
			textAlign={field.textAlign as TextAlign}
			class={field.class}
			validateFieldGroup={field.eventHandlers.onFocusOut}
		>
			{{
				contentDisplay: contentDisplay,
				contentEdit: contentEdit
			}}
		</FieldWrapper>
	);
}

/**
 * Helps to calculate the field structure wrapper.
 * @param field Reference to the current internal field instance
 * @returns An XML-based string with the definition of the field control
 */
export function getFieldStructureTemplate(field: FieldBlockProperties): string {
	let preparedProperties = field;
	// Check if the field is not dynamically instantiated (the code is used for the field)
	if (!(field.isDynamicInstantiation ?? false)) {
		preparedProperties = setUpField(
			field as unknown as InputFieldBlockProperties,
			field._controlConfiguration,
			field._settings.models.viewData,
			field._settings.models.internal ?? (field._settings.appComponent?.getModel?.("internal") as JSONModel),
			field._settings.appComponent,
			field.isPropertyInitial("readOnly")
		);
		const fileFilename = preparedProperties.fileFilenameExpression
			? "{ path: '" + preparedProperties.fileFilenameExpression + "' }"
			: "undefined";
		preparedProperties.eventHandlers.change = "Field.handleChange" as unknown as EventHandler;
		preparedProperties.eventHandlers.liveChange = "Field.handleLiveChange" as unknown as EventHandler;
		preparedProperties.eventHandlers.validateFieldGroup = "Field.onValidateFieldGroup" as unknown as EventHandler;
		preparedProperties.eventHandlers.handleTypeMissmatch = "FieldRuntimeHelper.handleTypeMissmatch" as unknown as EventHandler;
		preparedProperties.eventHandlers.handleFileSizeExceed = "FieldRuntimeHelper.handleFileSizeExceed" as unknown as EventHandler;
		preparedProperties.eventHandlers.handleUploadComplete =
			`FieldRuntimeHelper.handleUploadComplete($event, ${fileFilename}, '${preparedProperties.fileRelativePropertyPath}', $controller)` as unknown as EventHandler;
		preparedProperties.eventHandlers.uploadStream = "FieldRuntimeHelper.uploadStream($controller, $event)" as unknown as EventHandler;
		preparedProperties.eventHandlers.removeStream =
			`FieldRuntimeHelper.removeStream($event, ${fileFilename}, '${preparedProperties.fileRelativePropertyPath}', $controller)` as unknown as EventHandler;
		preparedProperties.eventHandlers.handleOpenUploader = "FieldRuntimeHelper.handleOpenUploader" as unknown as EventHandler;
		preparedProperties.eventHandlers.handleCloseUploader = "FieldRuntimeHelper.handleCloseUploader" as unknown as EventHandler;
		preparedProperties.eventHandlers.openExternalLink = "FieldRuntimeHelper.openExternalLink" as unknown as EventHandler;
		preparedProperties.eventHandlers.onFocusOut = ".collaborativeDraft.handleContentFocusOut" as unknown as EventHandler;
		preparedProperties.eventHandlers.linkPressed = "FieldRuntimeHelper.pressLink" as unknown as EventHandler;
		preparedProperties.eventHandlers.displayAggregationDetails =
			`FIELDRUNTIME.displayAggregateDetails($event, '${getContextRelativeTargetObjectPath(
				preparedProperties.dataModelPath
			)}')` as unknown as EventHandler;
		if (preparedProperties.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
			preparedProperties.eventHandlers.onDataFieldWithNavigationPath =
				`FieldRuntimeHelper.onDataFieldWithNavigationPath(\${$source>/}, $controller, '${preparedProperties.convertedMetaPath.Target.value}')` as unknown as EventHandler;
		}
		preparedProperties.eventHandlers.showCollaborationEditUser =
			"FieldRuntimeHelper.showCollaborationEditUser(${$source>/}, ${$view>/})" as unknown as EventHandler;
		preparedProperties.eventHandlers.onDataFieldActionButton = FieldHelper.getPressEventForDataFieldActionButton(
			preparedProperties,
			preparedProperties.metaPath.getObject()
		) as unknown as EventHandler;
		preparedProperties.eventHandlers.onDataFieldWithIBN = CommonHelper.getPressHandlerForDataFieldForIBN(
			preparedProperties.metaPath.getObject()
		) as unknown as EventHandler;
	}

	//compute the field in case of mentioned display styles
	if (
		preparedProperties.displayStyle === "Avatar" ||
		preparedProperties.displayStyle === "Contact" ||
		preparedProperties.displayStyle === "Button" ||
		preparedProperties.displayStyle === "File"
	) {
		// check for special handling in case a file type is used with the collaboration mode
		// (renders an avatar directly)
		if (
			preparedProperties.displayStyle === "File" &&
			(preparedProperties.collaborationEnabled ?? false) &&
			(preparedProperties.editMode ?? preparedProperties.computedEditMode) !== FieldEditMode.Display
		) {
			return (
				<HBox width="100%" alignItems="End">
					<VBox width="100%">{DisplayStyle.getFileTemplate(preparedProperties)}</VBox>
					{EditStyle.getCollaborationAvatar(preparedProperties)}
				</HBox>
			);
		} else {
			//for all other cases render the displayStyles with a field api wrapper
			return DisplayStyle.getTemplate(preparedProperties);
		}
	} else if (
		preparedProperties.formatOptions.fieldMode === "nowrapper" &&
		(preparedProperties.editMode ?? preparedProperties.computedEditMode) === FieldEditMode.Display
	) {
		//renders a display based building block (e.g. a button) that has no field api wrapper around it.
		return DisplayStyle.getTemplate(preparedProperties);
	} else {
		//for all other cases create a field wrapper
		return createFieldWrapper(preparedProperties);
	}
}

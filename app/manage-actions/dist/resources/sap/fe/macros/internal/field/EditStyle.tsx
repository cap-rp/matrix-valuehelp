import type { DataFieldTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, pathInModel } from "sap/fe/base/BindingToolkit";
import EventDelegateHook from "sap/fe/base/EventDelegateHook";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import * as CollaborationFormatters from "sap/fe/core/formatters/CollaborationFormatter";
import { hasValueHelpWithFixedValues } from "sap/fe/core/templating/PropertyHelper";
import * as UIFormatter from "sap/fe/core/templating/UIFormatters";
import CollaborationHBox from "sap/fe/macros/controls/CollaborationHBox";
import RadioButtons from "sap/fe/macros/controls/RadioButtons";
import { getMultipleLinesForDataField, getTextAlignment } from "sap/fe/macros/field/FieldTemplating";
import type { FieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import Avatar from "sap/m/Avatar";
import type { CheckBox$SelectEvent } from "sap/m/CheckBox";
import CheckBox from "sap/m/CheckBox";
import DatePicker from "sap/m/DatePicker";
import DateTimePicker from "sap/m/DateTimePicker";
import FlexItemData from "sap/m/FlexItemData";
import Input from "sap/m/Input";
import type { InputBase$ChangeEvent } from "sap/m/InputBase";
import type { MaskInput$LiveChangeEvent } from "sap/m/MaskInput";
import MaskInput from "sap/m/MaskInput";
import MaskInputRule from "sap/m/MaskInputRule";
import type { RatingIndicator$ChangeEvent } from "sap/m/RatingIndicator";
import RatingIndicator from "sap/m/RatingIndicator";
import TextArea from "sap/m/TextArea";
import TimePicker from "sap/m/TimePicker";
import type Event from "sap/ui/base/Event";
import type { default as Control, Control$ValidateFieldGroupEvent, default as Control1 } from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import Field from "sap/ui/mdc/Field";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type { MetaModelType } from "../../../../../../../../types/metamodel_types";
import FieldHelper from "../../field/FieldHelper";
import TextAreaEx from "../../field/TextAreaEx";

const EditStyle = {
	/**
	 * An internal helper to retrieve the reused layout data.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLayoutData(field: FieldBlockProperties): string {
		let layoutData = "";
		if (field.collaborationEnabled) {
			layoutData = <FlexItemData growFactor="9" />;
		}
		return layoutData;
	},

	/**
	 * Generates the avatar control next a field locked.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the avatar
	 */
	getCollaborationAvatar(field: FieldBlockProperties): string {
		const collaborationHasActivityExpression = compileExpression(field.collaborationExpression);
		const collaborationInitialsExpression = compileExpression(
			UIFormatter.getCollaborationExpression(field.dataModelPath, CollaborationFormatters.getCollaborationActivityInitials)
		);
		const collaborationColorExpression = compileExpression(
			UIFormatter.getCollaborationExpression(field.dataModelPath, CollaborationFormatters.getCollaborationActivityColor)
		);

		return (
			<Avatar
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				visible={collaborationHasActivityExpression}
				initials={collaborationInitialsExpression}
				displaySize="Custom"
				customDisplaySize="1.5rem"
				customFontSize="0.8rem"
				backgroundColor={collaborationColorExpression}
				press={field.eventHandlers.showCollaborationEditUser as unknown as ((oEvent: Event) => void) | undefined}
			>
				{{
					dependents: <EventDelegateHook stopTapPropagation={true} />
				}}
			</Avatar>
		);
	},

	/**
	 * Generates a template for one of the pickers reference in the type.
	 * @param field Reference to the current field instance
	 * @param type Reference to one of the edit style picker types
	 * @returns An XML-based string with the definition of the field control
	 */
	getDateTimePickerGeneric(field: FieldBlockProperties, type: "DatePicker" | "DateTimePicker" | "TimePicker"): string {
		const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldTypes>(field.metaPath, field.contextPath);
		const textAlign = getTextAlignment(
			dataModelObjectPath,
			field.formatOptions,
			field.editModeAsObject as BindingToolkitExpression<string>
		);

		const dateTimePickerProperties = {
			"core:require": "{Field: 'sap/fe/macros/Field'}",
			id: field.editStyleId,
			width: "100%",
			editable: field.editableExpression,
			enabled: field.enabledExpression,
			required: field.requiredExpression,
			textAlign: textAlign,
			ariaLabelledBy: field.ariaLabelledBy as unknown as Array<Control | string>,
			value: field.valueBindingExpression,
			fieldGroupIds: field.fieldGroupIds,
			showTimezone: field.showTimezone,
			minDate: type === "DateTimePicker" || type === "DatePicker" ? field.minDateExpression : undefined,
			maxDate: type === "DateTimePicker" || type === "DatePicker" ? field.maxDateExpression : undefined,
			change:
				type === "DateTimePicker"
					? ((field.change || field.eventHandlers.change) as unknown as (oEvent: InputBase$ChangeEvent) => void)
					: (field.eventHandlers.change as unknown as (oEvent: InputBase$ChangeEvent) => void),
			liveChange: field.eventHandlers.liveChange,
			validateFieldGroup: field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void
		};

		function getDateTimePicker(dateTimePickerType: string): string {
			let dateTimePicker;
			switch (dateTimePickerType) {
				case "DatePicker":
					dateTimePicker = (
						<DatePicker {...dateTimePickerProperties}>
							{{ customData: <CustomData key="sourcePath" value={field.dataSourcePath} /> }}
						</DatePicker>
					);
					break;
				case "DateTimePicker":
					dateTimePicker = (
						<DateTimePicker {...dateTimePickerProperties}>
							{{ customData: <CustomData key="sourcePath" value={field.dataSourcePath} /> }}
						</DateTimePicker>
					);
					break;
				case "TimePicker":
					dateTimePicker = (
						<TimePicker {...dateTimePickerProperties}>
							{{ customData: <CustomData key="sourcePath" value={field.dataSourcePath} /> }}
						</TimePicker>
					);
					break;
			}
			return dateTimePicker;
		}

		return getDateTimePicker(type);
	},

	/**
	 * Generates the Input template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getInputTemplate(field: FieldBlockProperties): string {
		const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldTypes>(field.metaPath, field.contextPath);

		const textAlign = getTextAlignment(
			dataModelObjectPath,
			field.formatOptions,
			field.editModeAsObject as BindingToolkitExpression<string>
		);

		return (
			<Input
				core:require="{Field: 'sap/fe/macros/Field'}"
				id={field.editStyleId}
				value={field.valueBindingExpression}
				placeholder={field.editStylePlaceholder}
				width="100%"
				editable={field.editableExpression}
				description={field.staticDescription}
				enabled={field.enabledExpression}
				required={field.requiredExpression}
				fieldGroupIds={field.fieldGroupIds}
				textAlign={textAlign}
				type={field.editStyle === "Masked" ? "Password" : undefined}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				maxLength={field.formatOptions.textMaxLength}
				change={field.eventHandlers.change as (oEvent: InputBase$ChangeEvent) => void}
				liveChange={field.eventHandlers.liveChange}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
			>
				{{
					layoutData: EditStyle.getLayoutData(field),
					customData: <CustomData key="sourcePath" value={field.dataSourcePath} />
				}}
			</Input>
		);
	},

	/**
	 * Returns if a field shall be templated as a radio button group.
	 * @param field Reference to the current field instance
	 * @returns The evaluation result
	 */
	showAsRadioButton(field: FieldBlockProperties): boolean {
		// Determine if we need to render the field as a radio button group
		// TODO: Remove the next two lines once UX updated the vocabulary module including the new experimental annotation
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const radioButtonConfigured: boolean =
			field.property.annotations?.Common?.ValueListWithFixedValues &&
			hasValueHelpWithFixedValues(field.property) === true &&
			((field.property.annotations.Common.ValueListWithFixedValues.annotations?.Common?.ValueListShowValuesImmediately &&
				field.property.annotations.Common.ValueListWithFixedValues.annotations?.Common?.ValueListShowValuesImmediately.valueOf() ===
					true) ||
				field.formatOptions.fieldEditStyle === "RadioButtons");

		// Exclude not supported cases
		// - ValueListParamaterInOut / ...Out must not be empty
		// - ValueListRelevantQualifiers annotation must not be used
		// Further cases may not make sense with radio buttons but we do not explicitly exclude them but mention this in documentation.
		// Check documentation, discuss and decide before adding further restrictions here.
		const valueListParameterInOut = field.property?.annotations?.Common?.ValueList?.Parameters.find(
			(valueListParameter) =>
				(valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" ||
					valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut") &&
				valueListParameter.LocalDataProperty.value === field.property.name
		);
		return (
			radioButtonConfigured &&
			valueListParameterInOut !== undefined &&
			!field.property.annotations?.Common?.ValueListRelevantQualifiers
		);
	},

	/**
	 * Generates the RadioButton template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the radio button definition
	 */
	getRadioButtonTemplate(field: FieldBlockProperties): string {
		const fixedValuesPath = "/" + field.property?.annotations?.Common?.ValueList?.CollectionPath;

		const valueListParameterInOut = field.property?.annotations?.Common?.ValueList?.Parameters.find(
			(valueListParameter) =>
				(valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" ||
					valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut") &&
				valueListParameter.LocalDataProperty.value === field.property.name
		);

		// we know that a valueListProperty exists because we check this already in showAsRadioButton
		const valueListKeyPath = pathInModel(valueListParameterInOut!.ValueListProperty as string);

		let valueListDescriptionPath;
		const valueHelpKeyTextAnnotationPath =
			field.dataModelPath.targetEntityType.resolvePath(fixedValuesPath).entityType.keys[0].annotations?.Common?.Text?.path;
		if (valueHelpKeyTextAnnotationPath) {
			valueListDescriptionPath = pathInModel(valueHelpKeyTextAnnotationPath);
		} else {
			valueListDescriptionPath = valueListKeyPath;
		}

		return (
			<RadioButtons
				id={field.editStyleId}
				requiredExpression={field.requiredExpression}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
				fixedValuesPath={fixedValuesPath as unknown as `{${string}}`}
				fieldGroupIds={field.fieldGroupIds}
				value={field.valueBindingExpression}
				enabledExpression={field.enabledExpression}
				radioButtonTextProperty={valueListDescriptionPath}
				radioButtonKeyProperty={valueListKeyPath}
				horizontalLayout={field.formatOptions.radioButtonsHorizontalLayout}
			/>
		);
	},

	/**
	 * Generates the InputWithValueHelp template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getInputWithValueHelpTemplate(field: FieldBlockProperties): string {
		const dataFieldDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldTypes>(
			field.metaPath,
			field.contextPath
		);

		const delegate = FieldHelper.computeFieldBaseDelegate(
			"sap/fe/macros/field/FieldBaseDelegate",
			field.formatOptions.retrieveTextFromValueList as boolean
		);
		const display = UIFormatter.getFieldDisplay(
			field.property,
			field.formatOptions.displayMode as string,
			field.editModeAsObject as BindingToolkitExpression<string>
		);
		const hasMultilineAnnotation = !!field.property?.annotations?.UI?.MultiLineText;
		const multipleLines = getMultipleLinesForDataField(field, hasMultilineAnnotation);

		const textAlign = getTextAlignment(
			dataFieldDataModelObjectPath,
			field.formatOptions,
			field.editModeAsObject as BindingToolkitExpression<string>,
			true
		);
		const label = FieldHelper.computeLabelText(field as unknown as MetaModelType<DataFieldTypes>, {
			context: field.metaPath
		});

		let optionalContentEdit = "";
		if (field.property.type === "Edm.String" && hasMultilineAnnotation) {
			optionalContentEdit = (
				<TextArea
					value={field.valueBindingExpression}
					required={field.requiredExpression}
					rows={field.formatOptions.textLinesEdit}
					growing={(field.formatOptions.textMaxLines as unknown as number) > 0 ? true : undefined}
					growingMaxLines={field.formatOptions.textMaxLines}
					width="100%"
					change={field.eventHandlers.change as unknown as (oEvent: InputBase$ChangeEvent) => void}
					fieldGroupIds={field.fieldGroupIds}
				/>
			);
		}

		let optionalLayoutData = "";
		if (field.collaborationEnabled === true) {
			optionalLayoutData = <FlexItemData growFactor="9" />;
		}

		if (this.showAsRadioButton(field) !== true) {
			return (
				<Field
					core:require="{Field: 'sap/fe/macros/Field'}"
					delegate={delegate}
					id={field.editStyleId}
					value={field.valueBindingExpression}
					placeholder={field.editStylePlaceholder}
					valueState={field.valueState}
					editMode={field.editMode ?? field.computedEditMode}
					width="100%"
					required={field.requiredExpression}
					additionalValue={field.textBindingExpression}
					display={display}
					multipleLines={multipleLines === false ? undefined : multipleLines}
					valueHelp={field.valueHelpId}
					fieldGroupIds={field.fieldGroupIds}
					textAlign={textAlign}
					ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control1 | string>}
					label={label}
					change={field.eventHandlers.change as (oEvent: Field$ChangeEvent) => void}
					liveChange={field.eventHandlers.liveChange}
					validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
				>
					{{
						contentEdit: optionalContentEdit,
						layoutData: optionalLayoutData,
						customData: <CustomData key="sourcePath" value={field.dataSourcePath} />
					}}
				</Field>
			);
		} else {
			return this.getRadioButtonTemplate(field);
		}
	},

	/**
	 * Generates the CheckBox template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getCheckBoxTemplate(field: FieldBlockProperties): string {
		return (
			<CheckBox
				core:require="{Field: 'sap/fe/macros/Field'}"
				id={field.editStyleId}
				selected={field.valueBindingExpression}
				editable={field.editableExpression}
				enabled={field.enabledExpression}
				fieldGroupIds={field.fieldGroupIds}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				select={field.eventHandlers.change as (oEvent: CheckBox$SelectEvent) => void}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
			>
				{{ customData: <CustomData key="sourcePath" value={field.dataSourcePath} /> }}
			</CheckBox>
		);
	},

	/**
	 * Generates the TextArea template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTextAreaTemplate(field: FieldBlockProperties): string {
		const growing = field.formatOptions.textMaxLines ? true : false;

		const showExceededText = !!field.formatOptions.textMaxLength;

		//unfortunately this one is a "different" layoutData than the others, therefore the reuse function from above cannot be used for the textArea template
		let layoutData = "";
		if (field.collaborationEnabled) {
			layoutData = <FlexItemData growFactor="9" />;
		}

		return (
			<TextAreaEx
				core:require="{Field: 'sap/fe/macros/Field'}"
				id={field.editStyleId}
				value={field.valueBindingExpression}
				placeholder={field.editStylePlaceholder}
				required={field.requiredExpression}
				rows={field.formatOptions.textLinesEdit}
				growing={growing}
				growingMaxLines={field.formatOptions.textMaxLines}
				cols={300} //As the default is 20, the "cols" property is configured with a value of 300 to guarantee that the textarea will occupy all the available space.
				width="100%"
				editable={field.editableExpression}
				enabled={field.enabledExpression}
				fieldGroupIds={field.fieldGroupIds}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				maxLength={field.formatOptions.textMaxLength}
				showExceededText={showExceededText}
				change={field.eventHandlers.change as (oEvent: InputBase$ChangeEvent) => void}
				liveChange={field.eventHandlers.liveChange}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
			>
				{{
					layoutData: layoutData,
					customData: <CustomData key="sourcePath" value={field.dataSourcePath} />
				}}
			</TextAreaEx>
		);
	},

	/**
	 * Generates the RatingIndicator template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getRatingIndicatorTemplate: (field: FieldBlockProperties): string => {
		const tooltip = field.ratingIndicatorTooltip || "{sap.fe.i18n>T_COMMON_RATING_INDICATOR_TITLE_LABEL}";

		return (
			<RatingIndicator
				core:require="{Field: 'sap/fe/macros/Field'}"
				id={field.editStyleId}
				maxValue={field.ratingIndicatorTargetValue}
				value={field.valueBindingExpression}
				tooltip={tooltip}
				fieldGroupIds={field.fieldGroupIds}
				iconSize="1.375rem"
				class="sapUiTinyMarginTopBottom"
				editable="true"
				change={field.eventHandlers.change as (oEvent: RatingIndicator$ChangeEvent) => void}
			>
				{{
					layoutData: EditStyle.getLayoutData(field)
				}}
			</RatingIndicator>
		);
	},

	/**
	 * Helps to calculate the content edit functionality / templating.
	 * Including a wrapper an hbox in case of collaboration mode finally
	 * it calls internally EditStyle.getTemplate.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplateWithWrapper(field: FieldBlockProperties): string {
		let contentEdit;

		if ((field.editMode ?? field.computedEditMode) !== FieldEditMode.Display && !!field.editStyle) {
			if (field.collaborationEnabled ?? false) {
				contentEdit = (
					<CollaborationHBox width="100%" alignItems="End">
						{EditStyle.getTemplate(field)}
						{EditStyle.getCollaborationAvatar(field)}
					</CollaborationHBox>
				);
			} else {
				contentEdit = EditStyle.getTemplate(field);
			}
		}

		return contentEdit || "";
	},

	/**
	 * Generates the InputMask template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getInputMaskTemplate(field: FieldBlockProperties): string {
		const optionalMaskInputRules = [];
		const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldTypes>(field.metaPath, field.contextPath);
		const textAlign = getTextAlignment(
			dataModelObjectPath,
			field.formatOptions,
			field.editModeAsObject as BindingToolkitExpression<string>
		);
		if (field.mask?.maskRule) {
			for (const rule of field.mask.maskRule) {
				optionalMaskInputRules.push(<MaskInputRule maskFormatSymbol={rule.symbol} regex={rule.regex} />);
			}
		}

		return (
			<MaskInput
				core:require="{Field: 'sap/fe/macros/Field'}"
				id={field.editStyleId}
				value={field.valueBindingExpression}
				placeholder={field.editStylePlaceholder}
				width="100%"
				editable={field.editableExpression}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				mask={field.mask?.mask}
				enabled={field.enabledExpression}
				required={field.requiredExpression}
				fieldGroupIds={field.fieldGroupIds}
				textAlign={textAlign}
				placeholderSymbol={field.mask?.placeholderSymbol}
				liveChange={field.eventHandlers.liveChange as (oEvent: MaskInput$LiveChangeEvent) => void}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
			>
				{{
					rules: optionalMaskInputRules,
					customData: <CustomData key="sourcePath" value={field.dataSourcePath} />
				}}
			</MaskInput>
		);
	},

	/**
	 * Entry point for further templating processings.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplate: (field: FieldBlockProperties): string | undefined => {
		let innerFieldContent;
		switch (field.editStyle) {
			case "CheckBox":
				innerFieldContent = EditStyle.getCheckBoxTemplate(field);
				break;
			case "DatePicker":
			case "DateTimePicker":
			case "TimePicker": {
				innerFieldContent = EditStyle.getDateTimePickerGeneric(field, field.editStyle);
				break;
			}
			case "Input": {
				innerFieldContent = EditStyle.getInputTemplate(field);
				break;
			}
			case "Masked": {
				innerFieldContent = EditStyle.getInputTemplate(field);
				break;
			}
			case "InputWithValueHelp": {
				innerFieldContent = EditStyle.getInputWithValueHelpTemplate(field);
				break;
			}
			case "RatingIndicator":
				innerFieldContent = EditStyle.getRatingIndicatorTemplate(field);
				break;
			case "TextArea":
				innerFieldContent = EditStyle.getTextAreaTemplate(field);
				break;
			case "InputMask":
				innerFieldContent = EditStyle.getInputMaskTemplate(field);
				break;
			default:
		}

		return innerFieldContent;
	}
};

export default EditStyle;

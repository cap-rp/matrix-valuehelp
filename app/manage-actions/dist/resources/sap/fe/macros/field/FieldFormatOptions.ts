import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { DateTimeStyle } from "sap/fe/core/templating/UIFormatters";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

export type FieldEditStyle = "RadioButtons";
/**
 * Additional format options for the field.
 * @alias sap.fe.macros.field.FieldFormatOptions
 * @public
 */
@defineUI5Class("sap.fe.macros.field.FieldFormatOptions")
export default class FieldFormatOptions extends BuildingBlockObjectProperty {
	constructor(props?: string | PropertiesOf<FieldFormatOptions>, others?: PropertiesOf<FieldFormatOptions>) {
		super(props as string, others);
	}

	/**
	 * Defines how the field value and associated text will be displayed together.<br/>
	 *
	 * Allowed values are "Value", "Description", "DescriptionValue" and "ValueDescription"
	 *  @public
	 */
	@property({ type: "string" })
	displayMode?: "Value" | "Description" | "DescriptionValue" | "ValueDescription";

	/**
	 * Defines if and how the field measure will be displayed.<br/>
	 *
	 * Allowed values are "Hidden" and "ReadOnly"
	 *  @public
	 */
	@property({ type: "string" })
	measureDisplayMode?: "Hidden" | "ReadOnly";

	/**
	 * Maximum number of lines for multiline texts in edit mode.<br/>
	 *  @public
	 */
	@property({ type: "int" })
	textLinesEdit?: number;

	/**
	 * Maximum number of lines that multiline texts in edit mode can grow to.<br/>
	 *  @public
	 */
	@property({ type: "int" })
	textMaxLines?: number;

	/**
	 * Maximum number of characters from the beginning of the text field that are shown initially.<br/>
	 *  @public
	 */
	@property({ type: "int" })
	textMaxCharactersDisplay?: number;

	/**
	 * Defines how the full text will be displayed.<br/>
	 *
	 * Allowed values are "InPlace" and "Popover"
	 *  @public
	 */
	@property({ type: "string" })
	textExpandBehaviorDisplay?: "InPlace" | "Popover";

	/**
	 * Defines the maximum number of characters for the multiline text value.<br/>
	 *
	 * If a multiline text exceeds the maximum number of allowed characters, the counter below the input field displays the exact number.
	 *  @public
	 */
	@property({ type: "int" })
	textMaxLength?: number;

	/**
	 * Defines if the date part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showDate?: boolean;

	/**
	 * Defines if the time part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showTime?: boolean;

	/**
	 * Defines if the timezone part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showTimezone?: boolean;

	/**
	 * Determines how the field should be rendered, e.g. as radio buttons. <br/>
	 * If not all prerequisites are met, the field will default back to the standard rendering.
	 *  @public
	 */
	@property({ type: "string", allowedValues: ["RadioButtons"] })
	fieldEditStyle?: FieldEditStyle;

	/**
	 * Specifies if radio buttons should be rendered in a horizontal layout. <br/>
	 *  @public
	 */
	@property({ type: "boolean" })
	radioButtonsHorizontalLayout?: boolean;
	/**
	 * Property for defining the display style for the date, time, or dateTime format. <br/>
	 * If there is a dateTimePattern defined dateTimeStyle is ignored.
	 * @public
	 */

	@property({ type: "string", allowedValues: ["short", "medium", "long", "full"] })
	dateTimeStyle?: DateTimeStyle;

	/**
	 * Property for defining a custom pattern for the date, time, or dateTime format. <br/>
	 * If there is a dateTimePattern defined dateTimeStyle is ignored.
	 * @public
	 */
	@property({ type: "string" })
	dateTimePattern?: string;

	// internal properties
	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	fieldMode?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	hasDraftIndicator?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	isAnalytics?: boolean;

	/**
	 * If true and if the field is part of an inactive row, then a check will be done to determine if the underlying property has a non-insertable restriction
	 * @private
	 */
	@property({ type: "boolean" })
	forInlineCreationRows?: boolean;

	/**
	 * If true then the navigationavailable property will not be used for the enablement of the IBN button
	 * @private
	 */
	@property({ type: "boolean" })
	ignoreNavigationAvailable?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	isCurrencyOrUnitAligned?: boolean;

	/**
	 * Enables the fallback feature for the usage of the text annotation from the value lists
	 * @private
	 */
	@property({ type: "boolean" })
	retrieveTextFromValueList?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	semantickeys?: string[];

	/**
	 * Preferred control to visualize semantic key properties
	 * @private
	 */
	@property({ type: "string" })
	semanticKeyStyle?: string;

	/**
	 * If set to 'true', SAP Fiori elements shows an empty indicator in display mode for the text and links
	 * @private
	 */
	@property({ type: "boolean" })
	showEmptyIndicator?: boolean;

	/**
	 * If true then sets the given icon instead of text in Action/IBN Button
	 * @private
	 */
	@property({ type: "boolean" })
	showIconUrl?: boolean;

	/**
	 * Describes how the alignment works between Table mode (Date and Numeric End alignment) and Form mode (numeric aligned End in edit and Begin in display)
	 * @private
	 */
	@property({ type: "string" })
	textAlignMode?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	compactSemanticKey?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	fieldGroupDraftIndicatorPropertyPath?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	fieldGroupName?: string;

	/**
	 * Describes if this field is part of an analytical table aggregated row
	 * @private
	 */
	@property({ type: "boolean" })
	isAnalyticalAggregatedRow?: boolean;

	@property({ type: "boolean" })
	showOnlyUnitDecimals?: boolean;
}

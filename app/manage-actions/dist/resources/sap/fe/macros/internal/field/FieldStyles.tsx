import type { StrictPropertiesOf } from "sap/fe/base/ClassSupport";
import type Field from "sap/fe/macros/Field";

export type DisplayStyle =
	| "Text"
	| "Avatar"
	| "File"
	| "DataPoint"
	| "Contact"
	| "Button"
	| "Link"
	| "ObjectStatus"
	| "AmountWithCurrency"
	| "ObjectIdentifier"
	| "LabelSemanticKey"
	| "LinkWithQuickView"
	| "ExpandableText"
	| "InputMask"
	| "NumberWithUnitOrCurrencyAligned"
	| "Masked";

export type EditStyle =
	| "InputWithValueHelp"
	| "TextArea"
	| "File"
	| "DatePicker"
	| "TimePicker"
	| "DateTimePicker"
	| "CheckBox"
	| "InputWithUnit"
	| "Input"
	| "RatingIndicator"
	| "InputMask"
	| "Masked";

export type FieldProperties = StrictPropertiesOf<Field>;

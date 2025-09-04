import type { PrimitiveType } from "@sap-ux/vocabularies-types";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";

export enum SpecificSelectKeys {
	KeepKey = "KeepKey",
	ReplaceKey = "ReplaceKey",
	ClearFieldValueKey = "ClearFieldValueKey"
}

export type BindingInfo = {
	expression: CompiledBindingToolkitExpression;
	type?: string;
};

export type SelectInfo = {
	text: string;
	key: string;
	propertyValue?: PrimitiveType;
	unitOrCurrencyValue?: PrimitiveType;
};

type FieldVisibilityBindings = { isVisible: CompiledBindingToolkitExpression; editMode: CompiledBindingToolkitExpression };

export type MassFieldProperties = {
	label: string;
	visible: boolean;
	isFieldRequired: CompiledBindingToolkitExpression;
	textBinding: BindingInfo;
	descriptionPath?: string;
	readOnlyExpression: BindingToolkitExpression<boolean>;
	inputType: string;
	propertyInfo: {
		clearable: boolean;
		emptyValue: PrimitiveType;
		key: string;
		relativePath: string;
		unitOrCurrencyPropertyPath?: string;
	};
	selectItems: SelectInfo[];
	visibilityBindings: FieldVisibilityBindings;
};

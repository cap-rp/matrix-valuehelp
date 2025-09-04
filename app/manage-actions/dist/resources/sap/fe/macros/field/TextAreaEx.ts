import { defineUI5Class } from "sap/fe/base/ClassSupport";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import _TextArea from "sap/m/TextArea";
import { ValueState } from "sap/ui/core/library";

/**
 * Extension of the TextArea control to add a check for the maximum length when setting the value.
 */
@defineUI5Class("sap.fe.macros.field.TextAreaEx")
export default class TextAreaEx extends _TextArea {
	/**
	 * Fires live change event.
	 * @param [parameters] Parameters to pass along with the event
	 * @param parameters.value
	 * @returns Reference to `this` in order to allow method chaining
	 */
	fireLiveChange(parameters?: { value?: string }): this {
		super.fireLiveChange(parameters);
		this._validateTextLength(parameters?.value);
		return this;
	}

	/**
	 * Sets the value for the text area.
	 * @param value New value for the property `value`
	 * @returns Reference to `this` in order to allow method chaining
	 * @private
	 */
	setValue(value: string | null): this {
		super.setValue(value ?? "");
		this._validateTextLength(value);
		return this;
	}

	/**
	 * Sets an error message for the value state if the maximum length is specified and the new value exceeds this maximum length.
	 * @param [value] New value for property `value`
	 * @private
	 */
	_validateTextLength(value?: string | null): void {
		const maxLength = this.getMaxLength();
		if (!maxLength || value === undefined || value === null) {
			//Don't change the field's value state if no length check is done.
			//Otherwise, a ValueState set by the a DataType check gets overridden.
			return;
		}
		if (value.length > maxLength) {
			const valueStateText = getResourceModel(this).getText("M_FIELD_TEXTAREA_TEXT_TOO_LONG");
			this.setValueState(ValueState.Error);
			this.setValueStateText(valueStateText);
		} else {
			this.setValueState(ValueState.None);
		}
	}
}

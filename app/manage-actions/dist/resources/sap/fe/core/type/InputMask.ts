import { defineUI5Class } from "sap/fe/base/ClassSupport";
import Library from "sap/ui/core/Lib";
import ValidateException from "sap/ui/model/ValidateException";
import ODataStringType from "sap/ui/model/odata/type/String";

export type InputMaskRule = {
	symbol: string;
	regex: string;
};
export type InputMaskFormatOptions = {
	mask: string;
	placeholderSymbol: string;
	maskRule: InputMaskRule[];
};

@defineUI5Class("sap.fe.core.type.InputMask")
class InputMaskType extends ODataStringType {
	constructor(oFormatOptions: InputMaskFormatOptions & { parseKeepsEmptyString?: boolean }) {
		super(oFormatOptions);
	}

	oFormatOptions!: InputMaskFormatOptions;

	/**
	 * Validates the value against the mask. If the value is not provided for any of the mask characters, it throws an error.
	 * @param value String value received from the parseValue method without the mask.
	 */

	validateValue(value: string): void {
		// Reuse the formatValue to validate if the value does not match the mask and throw an error in that case
		const maskedValue = this.formatValue(value);
		if (maskedValue.includes(this.oFormatOptions.placeholderSymbol)) {
			let text = Library.getResourceBundleFor("sap.fe.core")!.getText("T_MASKEDINPUT_INVALID_VALUE");
			if (!text) {
				text = "";
			}
			throw new ValidateException(text);
		}
		super.validateValue(value);
	}
	/**
	 * Parse the value by removing the mask characters.
	 * @param value String value from the control with the mask
	 * @returns String value without the mask
	 */

	parseValue(value: string): string {
		// Remove the mask characters from the value
		let parsedValue = "";
		let parsedValueIndex = 0;
		const mask = this.oFormatOptions?.mask;
		if (mask) {
			for (let i = 0; i <= mask.length; i++) {
				if (this.doesMakingRuleExists(this.oFormatOptions.maskRule, mask[i])) {
					const maskRule = this.oFormatOptions.maskRule.find((rule) => rule.symbol === mask[i]);
					if (value[parsedValueIndex] && maskRule && value[parsedValueIndex].match(new RegExp(maskRule.regex))) {
						parsedValue += value[parsedValueIndex++];
					}
				} else if (mask[i] === "^") {
					// check if the character is ^, then skip the next character in value and increment the loop i++ as we don't want to add the escaped character to the parsed value
					i++;
					parsedValueIndex++;
				} else {
					parsedValueIndex++;
				}
			}
		}
		return parsedValue;
	}
	/**
	 * Checks if the mask rule exists for the given mask character.
	 * @param maskRule Array of mask rules
	 * @param maskCharacter Single mask character
	 * @returns True or False based on the result
	 */

	doesMakingRuleExists(maskRule: InputMaskRule[], maskCharacter: string): boolean {
		for (const rule of maskRule) {
			if (rule.symbol === maskCharacter) {
				return true;
			}
		}
		return false;
	}
	/**
	 * Format the value by applying the mask.
	 * @param value String value from the model without the mask
	 * @returns String value with the mask
	 */

	formatValue(value: string): string {
		if (!value) return value;

		const maskRulesPerCharacter: Record<string, string> = {};
		let formatValue = "";
		// Create a map of mask rules per character
		if (this.oFormatOptions.maskRule) {
			for (const rule of this.oFormatOptions.maskRule) {
				maskRulesPerCharacter[rule.symbol] = rule.regex;
			}
			let valueIndex = 0;
			let formattedValue = "";
			const mask = this.oFormatOptions.mask;
			for (let i = 0; i < mask.length; i++) {
				// Process character by character, comparing with the mask rules
				// If the character matches a mask rule, replace it with the character from the value and increment the value index;
				// Otherwise replace it with the character from the mask
				if (maskRulesPerCharacter[mask[i]]) {
					if (value[valueIndex] && value[valueIndex].match(new RegExp(maskRulesPerCharacter[mask[i]]))) {
						formattedValue += value[valueIndex++];
					} else {
						formattedValue += this.oFormatOptions.placeholderSymbol;
					}
				} else if (mask[i] === "^") {
					// if the mask character is ^ then add the character after it to the formatted value and increment the value i++
					formattedValue += mask[i + 1];
					i++;
				} else {
					formattedValue += mask[i];
				}
			}
			formatValue = formattedValue;
		}
		return formatValue;
	}
}
export default InputMaskType;

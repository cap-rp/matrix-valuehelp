import { defineUI5Class } from "sap/fe/base/ClassSupport";
import Library from "sap/ui/core/Lib";
import type UI5Date from "sap/ui/core/date/UI5Date";
import CompositeType from "sap/ui/model/CompositeType";
import ValidateException from "sap/ui/model/ValidateException";
import ODataDateType from "sap/ui/model/odata/type/Date";

/**
 * Define the UI5 class for a type of date picker validation.
 *
 */
@defineUI5Class("sap.fe.core.type.Date")
class DateType extends CompositeType {
	bParseWithValues: boolean;

	bUseRawValues: boolean;

	date: ODataDateType;

	constructor(oFormatOptions: object, oConstraints: object) {
		super(oFormatOptions, oConstraints);
		this.bParseWithValues = true;
		this.date = new ODataDateType();
		this.bUseRawValues = true;
	}

	/**
	 * Validate the input value whether it fall in the min and max range or not.
	 * @param aValues String array with input value and minimum and maximum value.
	 */
	public validateValue(aValues: string[]): void {
		const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;

		if (aValues[0]) {
			if (aValues[1]) {
				if (Date.parse(aValues[0]) < Date.parse(aValues[1])) {
					throw new ValidateException(coreResourceBundle.getText("C_ERROR_MINMAX_VALIDATION_DISPLAYED"));
				}
			}
			if (aValues[2]) {
				if (Date.parse(aValues[0]) > Date.parse(aValues[2])) {
					throw new ValidateException(coreResourceBundle.getText("C_ERROR_MINMAX_VALIDATION_DISPLAYED"));
				}
			}
		}
		this.date.validateValue(aValues[0]);
	}

	/**
	 * Formats the input value.
	 * @param value String array with input value and date range values.
	 * @param sInternalType Represents type of the value.
	 * @returns String | Date | UI5Date Returns the value from the extended Date function.
	 */
	public formatValue(value: string[], sInternalType: string): string | Date | UI5Date {
		return this.date.formatValue(value[0], sInternalType);
	}

	/**
	 * Parses the input value.
	 * @param value String with input value.
	 * @param sInternalType Represents type of the value.
	 * @returns String[] | Date | UI5Date Returns the value from the extended Date function.
	 */
	public parseValue(value: string | Date, sInternalType: string): string[] | Date | UI5Date {
		return [this.date.parseValue(value, sInternalType)];
	}
}

export default DateType;

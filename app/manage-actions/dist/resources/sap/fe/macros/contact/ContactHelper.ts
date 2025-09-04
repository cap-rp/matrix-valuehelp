import type { ContactType, EmailAddressType } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import { ContactInformationType } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";

/**
 * Provides the URI to be used, based on the item type.
 * @param itemType
 * @param value
 * @returns The formatted URI
 */
export const formatUri = function (itemType: string, value: CompiledBindingToolkitExpression): string | undefined {
	switch (itemType) {
		case "phone":
			return `tel:${value}`;
		case "mail":
			return `mailto:${value}`;
		default:
			return value;
	}
};
/**
 * Formats the address based on the different parts given by the contact annotation.
 * @param street
 * @param code
 * @param locality
 * @param region
 * @param country
 * @returns The formatted address
 */
export const formatAddress = function (
	street: CompiledBindingToolkitExpression,
	code: CompiledBindingToolkitExpression,
	locality: CompiledBindingToolkitExpression,
	region: CompiledBindingToolkitExpression,
	country: CompiledBindingToolkitExpression
): string {
	const textToWrite = [];
	if (street) {
		textToWrite.push(street);
	}
	if (code && locality) {
		textToWrite.push(`${code} ${locality}`);
	} else {
		if (code) {
			textToWrite.push(code);
		}
		if (locality) {
			textToWrite.push(locality);
		}
	}
	if (region) {
		textToWrite.push(region);
	}
	if (country) {
		textToWrite.push(country);
	}
	return textToWrite.join(", ");
};

/**
 * Retrieves the right text depending on the phoneType.
 * @param phoneType
 * @returns The text
 */
export const computePhoneLabel = function (phoneType: string): string {
	if (phoneType.includes("fax")) {
		return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_FAX}";
	} else if (phoneType.includes("cell")) {
		return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_MOBILE}";
	} else {
		return "{sap.fe.i18n>POPOVER_CONTACT_SECTION_PHONE}";
	}
};

/**
 * Gets the binding for the email to be considered for the integration with Microsoft Teams.
 * @param contactDataModelObject
 * @returns The email binding
 */
export const getMsTeamsMail = function (
	contactDataModelObject: DataModelObjectPath<ContactType>
): CompiledBindingToolkitExpression | undefined {
	// teams email is the first preferred  email
	let teamsMail = contactDataModelObject.targetObject?.email?.find((emailAnnotation: EmailAddressType) => {
		return emailAnnotation.type?.includes(ContactInformationType.preferred);
	});
	// or the first work email
	teamsMail =
		teamsMail ||
		contactDataModelObject.targetObject?.email?.find((emailAnnotation: EmailAddressType) => {
			return emailAnnotation.type?.includes(ContactInformationType.work);
		});
	//or the first mail
	if (contactDataModelObject.targetObject?.email?.length) {
		teamsMail ??= contactDataModelObject.targetObject.email[0];
	}

	return teamsMail
		? compileExpression(getExpressionFromAnnotation(teamsMail.address, getRelativePaths(contactDataModelObject)))
		: undefined;
};

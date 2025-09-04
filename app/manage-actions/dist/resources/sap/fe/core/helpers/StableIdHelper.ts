import type { PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import { type ApplyAnnotationExpression } from "@sap-ux/vocabularies-types";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForIntentBasedNavigation,
	DataFieldWithAction,
	DataFieldWithIntentBasedNavigation,
	DataFieldWithNavigationPath,
	DataFieldWithUrl,
	FacetTypes,
	FieldGroup
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "../templating/DataModelPathHelper";

export type AuthorizedIdAnnotationsType = FacetTypes | FieldGroup | DataFieldAbstractTypes;

/**
 * Generates the ID from an IBN.
 *
 * The ID contains the value, the potential action and context.
 * @param dataField The IBN annotation
 * @returns The ID
 */
const _getStableIdPartFromIBN = (dataField: DataFieldForIntentBasedNavigation | DataFieldWithIntentBasedNavigation): string => {
	const idParts = [dataField.SemanticObject.valueOf(), dataField.Action?.valueOf()];
	if ((dataField as DataFieldForIntentBasedNavigation).RequiresContext) {
		idParts.push("RequiresContext");
	}
	return idParts.filter((id) => id).join("::");
};

/**
 * Generates the ID part related to the value of the DataField.
 * @param dataField The DataField
 * @returns String related to the DataField value
 */
const _getStableIdPartFromValue = (
	dataField: DataField | DataFieldWithAction | DataFieldWithIntentBasedNavigation | DataFieldWithUrl | DataFieldWithNavigationPath
): string => {
	const value = dataField.Value;
	if (value.path) {
		return value.path as string;
	} else if (value.$Apply && value.$Function === "odata.concat") {
		return value.$Apply.map((app: { $Path?: string }) => app.$Path).join("::");
	}
	return replaceSpecialChars(value.replace(/ /g, "_"));
};

/**
 * Generates the ID part related to the value or url of the DataFieldWithUrl.
 * @param dataField The DataFieldWithUrl
 * @returns String related to the DataFieldWithUrl value or url
 */
const _getStableIdPartFromUrlOrPath = (dataField: DataFieldWithUrl): string => {
	const value = dataField.Value;
	if (value?.path) {
		return value.path as string;
	} else if (value?.$Apply && value.$Function === "odata.concat") {
		return value.$Apply.map((app: { $Path?: string }) => app.$Path).join("::");
	}
	const url = dataField.Url as unknown as PropertyAnnotationValue<String>;
	if (isPathAnnotationExpression(url) && url?.path) {
		return url.path;
	} else if (
		(url as ApplyAnnotationExpression<String>)?.$Apply &&
		(url as ApplyAnnotationExpression<String>).$Function === "odata.concat"
	) {
		return (url as { $Apply: { $Path?: string }[] }).$Apply.map((app) => app.$Path).join("::");
	}
	return replaceSpecialChars(value?.replace(/ /g, "_"));
};

/**
 * Copy for the Core.isValid function to be independent.
 * @param value String to validate
 * @returns Whether the value is valid or not
 */
const _isValid = (value: string): boolean => {
	return /^([A-Za-z_][-A-Za-z0-9_.:]*)$/.test(value);
};

/**
 * Removes the annotation namespaces.
 * @param id String to manipulate
 * @returns String without the annotation namespaces
 */
const _removeNamespaces = (id: string): string => {
	id = id.replace("com.sap.vocabularies.UI.v1.", "");
	id = id.replace("com.sap.vocabularies.Communication.v1.", "");
	return id;
};

/**
 * Generates the ID from an annotation.
 * @param annotation The annotation
 * @param idPreparation Determines whether the ID needs to be prepared for final usage
 * @returns The ID
 */
export const createIdForAnnotation = (annotation: AuthorizedIdAnnotationsType, idPreparation = true): string | undefined => {
	let id;
	switch (annotation.$Type) {
		case UIAnnotationTypes.ReferenceFacet:
			id = annotation.ID ?? annotation.Target.value;
			break;
		case UIAnnotationTypes.CollectionFacet:
			id = annotation.ID ?? "undefined"; // CollectionFacet without Id is not supported but doesn't necessary fail right now
			break;
		case UIAnnotationTypes.FieldGroupType:
			id = annotation.Label;
			break;
		default:
			id = getStableIdPartFromDataField(annotation as DataFieldAbstractTypes);
			break;
	}
	id = id?.toString();
	return id && idPreparation ? prepareId(id) : id;
};

/**
 * Generates a stable ID based on the given parameters.
 *
 * Parameters are combined in the same order in which they are provided and are separated by '::'.
 * Generate(['Stable', 'Id']) would result in 'Stable::Id' as the stable ID.
 * Currently supported annotations are Facets, FieldGroup and all kinds of DataField.
 * @param stableIdParts Array of strings, undefined, dataModelObjectPath or annotations
 * @returns Stable ID constructed from the provided parameters
 */
export const generate = (
	stableIdParts: Array<string | undefined | DataModelObjectPath<AuthorizedIdAnnotationsType> | AuthorizedIdAnnotationsType>
): string => {
	const ids: (string | undefined)[] = stableIdParts.map((element) => {
		if (typeof element === "string" || !element) {
			return element;
		}
		return createIdForAnnotation(
			(element as DataModelObjectPath<AuthorizedIdAnnotationsType>).targetObject || (element as AuthorizedIdAnnotationsType),
			false
		);
	});
	const result = ids.filter((id) => id).join("::");
	return prepareId(result);
};

/**
 * Generates the ID from a DataField.
 * @param dataField The DataField
 * @param ignoreForCompatibility Ignore a part of the ID on the DataFieldWithNavigationPath to be aligned with previous versions
 * @returns The ID
 */
export const getStableIdPartFromDataField = (dataField: DataFieldAbstractTypes, ignoreForCompatibility = false): string | undefined => {
	let id = "";
	switch (dataField.$Type) {
		case UIAnnotationTypes.DataFieldForAction:
			id = `DataFieldForAction::${dataField.Action}`;
			break;
		case UIAnnotationTypes.DataFieldForActionGroup:
			// DataFieldForActionGroup comes with ID property unlike other DataField types
			id = `DataFieldForActionGroup::${dataField.ID}`;
			break;
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			id = `DataFieldForIntentBasedNavigation::${_getStableIdPartFromIBN(dataField)}`;
			break;
		case UIAnnotationTypes.DataFieldForAnnotation:
			id = `DataFieldForAnnotation::${dataField.Target.value}`;
			break;
		case UIAnnotationTypes.DataFieldWithAction:
			id = `DataFieldWithAction::${_getStableIdPartFromValue(dataField)}::${dataField.Action}`;
			break;
		case UIAnnotationTypes.DataField:
			id = `DataField::${_getStableIdPartFromValue(dataField)}`;
			break;
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
			id = `DataFieldWithIntentBasedNavigation::${_getStableIdPartFromValue(dataField)}::${_getStableIdPartFromIBN(dataField)}`;
			break;
		case UIAnnotationTypes.DataFieldWithNavigationPath:
			id = `DataFieldWithNavigationPath::${_getStableIdPartFromValue(dataField)}`;
			if (dataField.Target.type === "NavigationPropertyPath" && !ignoreForCompatibility) {
				id = `${id}::${dataField.Target.value}`;
			}
			break;
		case UIAnnotationTypes.DataFieldWithUrl:
			id = `DataFieldWithUrl::${_getStableIdPartFromUrlOrPath(dataField)}`;
			break;
		default:
			break;
	}
	return id ? prepareId(id) : undefined;
};

/**
 * Removes or replaces with "::" some special characters.
 * Special characters (@, /, #) are replaced by '::' if they are in the middle of the stable ID and removed altogether if they are at the beginning or end.
 * @param id String to manipulate
 * @returns String without the special characters
 */
export const replaceSpecialChars = (id: string): string => {
	if (id.includes(" ")) {
		throw Error(`${id} - Spaces are not allowed in ID parts.`);
	}
	id = id
		.replace(/^\/|^@|^#|^\*/, "") // remove special characters from the beginning of the string
		.replace(/\/$|@$|#$|\*$/, "") // remove special characters from the end of the string
		.replace(/[/|@()#]/g, "::"); // replace special characters with ::

	// Replace double occurrences of the separator with a single separator
	while (id.includes("::::")) {
		id = id.replace("::::", "::");
	}

	// If there is a :: at the end of the ID remove it
	if (id.slice(-2) == "::") {
		id = id.slice(0, -2);
	}

	return id;
};

/**
 * Prepares the ID.
 *
 * Removes namespaces and special characters and checks the validity of this ID.
 * @param id The ID
 * @returns The ID or throws an error
 */
export const prepareId = function (id: string): string {
	id = replaceSpecialChars(_removeNamespaces(id));
	if (_isValid(id)) {
		return id;
	} else {
		throw Error(`${id} - Stable Id could not be generated due to insufficient information.`);
	}
};

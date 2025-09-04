import type { PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import { CommunicationAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	DataFieldAbstractTypes,
	DataFieldForAnnotationTypes,
	DataFieldTypes,
	DataPointType,
	FieldGroup,
	ReferenceFacetTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import { isProperty } from "../../helpers/TypeGuards";
import type { DataModelObjectPath } from "../../templating/DataModelPathHelper";

/**
 * Checks for statically hidden reference properties.
 * @param source The dataField or property to be analized
 * @returns Whether the argument has been set as hidden
 */
export function isReferencePropertyStaticallyHidden(source?: DataFieldAbstractTypes | Property): boolean {
	if (!source) {
		return false;
	}
	function isPropertyHidden(property: Property): boolean {
		const dataFieldDefault = property.annotations.UI?.DataFieldDefault || false;
		return isPropertyStaticallyHidden("Hidden", property) || (dataFieldDefault && isStaticallyHiddenDataField(dataFieldDefault));
	}
	function isDataFieldAbstractTypesHidden(dataField: DataFieldAbstractTypes): boolean {
		return (
			isStaticallyHiddenDataField(dataField) ||
			(dataField.$Type === UIAnnotationTypes.DataFieldForAnnotation && isAnnotationFieldStaticallyHidden(dataField))
		);
	}

	function getPropertyPathFromPropertyWithHiddenFilter(property: Property): string | false {
		return isPropertyStaticallyHidden("HiddenFilter", property) && property.name;
	}
	function getPropertyPathFromDataFieldWithHiddenFilter(dataField: DataFieldAbstractTypes): string | false {
		return isDataFieldTypes(dataField) && isPropertyStaticallyHidden("HiddenFilter", dataField.Value.$target) && dataField.Value.path;
	}

	const isHidden = isProperty(source) ? isPropertyHidden(source) : isDataFieldAbstractTypesHidden(source);
	const propertyPathWithHiddenFilter = isProperty(source)
		? getPropertyPathFromPropertyWithHiddenFilter(source)
		: getPropertyPathFromDataFieldWithHiddenFilter(source);
	if (isHidden && propertyPathWithHiddenFilter) {
		setLogMessageForHiddenFilter(propertyPathWithHiddenFilter);
	}
	return isHidden;
}

/**
 * Checks for data fields for annotation with statically hidden referenced properties.
 * @param annotationProperty The dataField or reference Facet type to be analyzed
 * @returns Whether the argument has been set as hidden
 */
export function isAnnotationFieldStaticallyHidden(annotationProperty: DataFieldForAnnotationTypes | ReferenceFacetTypes): boolean {
	if (isStaticallyHiddenDataField(annotationProperty)) {
		return true;
	}
	switch (annotationProperty.Target.$target?.term) {
		case UIAnnotationTerms.Chart:
			const measuresHidden = annotationProperty.Target.$target.Measures.every((chartMeasure) => {
				if (chartMeasure.$target && isPropertyStaticallyHidden("Hidden", chartMeasure.$target)) {
					if (isPropertyStaticallyHidden("HiddenFilter", chartMeasure.$target)) {
						setLogMessageForHiddenFilter(chartMeasure.$target.name);
					}
					return true;
				}
			});
			if (measuresHidden) {
				Log.warning("Warning: All measures attribute for Chart are statically hidden hence chart can't be rendered");
			}
			return measuresHidden;
		case UIAnnotationTerms.FieldGroup:
			return (annotationProperty.Target.$target as FieldGroup).Data.every(isReferencePropertyStaticallyHidden);
		case UIAnnotationTerms.DataPoint:
			const propertyValueAnnotation = (annotationProperty.Target.$target as DataPointType).Value.$target as Property;
			return isReferencePropertyStaticallyHidden(propertyValueAnnotation);
		default:
			return false;
	}
}

/**
 * Checks if header is statically hidden.
 * @param propertyDataModel The property Data Model to be analized
 * @returns Whether the argument has been set as hidden
 */

export function isHeaderStaticallyHidden(propertyDataModel?: DataModelObjectPath<DataFieldAbstractTypes>): boolean {
	if (propertyDataModel?.targetObject) {
		const headerInfoAnnotation = propertyDataModel.targetObject;
		return isReferencePropertyStaticallyHidden(headerInfoAnnotation);
	}
	return false;
}

/**
 * Checks if data field or Reference Facet is statically hidden.
 * @param dataField The dataField or Reference Facet to be analyzed
 * @returns Whether the argument has been set statically as hidden
 */
function isStaticallyHiddenDataField(dataField: DataFieldAbstractTypes | ReferenceFacetTypes): boolean {
	return (
		dataField.annotations?.UI?.Hidden?.valueOf() === true ||
		(isDataFieldTypes(dataField) && isPropertyStaticallyHidden("Hidden", dataField?.Value?.$target))
	);
}

/**
 * Adds console warning when setting hidden and hidden filter together.
 * @param path The property path to be added to the warning error message
 */
function setLogMessageForHiddenFilter(path: string): void {
	Log.warning(
		"Warning: Property " +
			path +
			" is set with both UI.Hidden and UI.HiddenFilter - please set only one of these! UI.HiddenFilter is ignored currently!"
	);
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
 * DataField has a value defined.
 * @param dataField DataField to be evaluated
 * @returns Validate that dataField is a DataFieldTypes
 */
function isDataFieldTypes(dataField: DataFieldAbstractTypes | unknown): dataField is DataFieldTypes {
	return (dataField as DataFieldTypes).hasOwnProperty("Value");
}

/**
 * Identifies if the given property is statically hidden or hidden Filter".
 * @param AnnotationTerm AnnotationTerm to be evaluated, only options are "Hidden" or "HiddenFilter
 * @param property The property to be checked
 * @returns `true` if it is a statically hidden or hidden filter property
 */
function isPropertyStaticallyHidden(AnnotationTerm: "Hidden" | "HiddenFilter", property?: Property): boolean {
	return property?.annotations?.UI?.[AnnotationTerm]?.valueOf() === true;
}

/**
 * Check if dataField or dataPoint main property is potentially sensitive.
 * @param dataField DataFieldAbstractTypes or DataPOint.
 * @returns Boolean
 */
export function isPotentiallySensitive(dataField: DataFieldAbstractTypes | DataPointType): boolean {
	let property;
	switch (dataField?.$Type) {
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
			property = dataField?.Value?.$target;
			break;
		case UIAnnotationTypes.DataFieldForAnnotation:
			const dataFieldTarget = dataField.Target.$target;
			if (dataFieldTarget?.term === UIAnnotationTerms.DataPoint) {
				property = dataFieldTarget?.Value?.$target;
			}
			if (dataFieldTarget?.term === CommunicationAnnotationTerms.Contact) {
				property = (dataFieldTarget as PrimitiveType)?.fn?.$target;
			}
			break;
		case UIAnnotationTypes.DataPointType:
			property = dataField?.Value?.$target;
			break;
		default:
			break;
	}
	return property?.annotations?.PersonalData?.IsPotentiallySensitive?.valueOf() === true;
}

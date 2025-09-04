import type { NavigationProperty, Property } from "@sap-ux/vocabularies-types";
import type {
	SemanticObject,
	SemanticObjectMapping,
	SemanticObjectUnavailableActions
} from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { DataFieldAbstractTypes, DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import {
	compileExpression,
	getExpressionFromAnnotation,
	resolveBindingString,
	type BindingToolkitExpression,
	type CompiledBindingToolkitExpression
} from "sap/fe/base/BindingToolkit";
import { isAnnotationOfTerm, isNavigationProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type JSONModel from "sap/ui/model/json/JSONModel";

type PropertyOrNavigationProperty = Property | NavigationProperty | undefined;

/**
 * Get the path of the semantic object if it is a dynamic SemanticObject.
 * @param semanticObject The value of the Common.SemanticObject annotation.
 * @returns  The path of the semantic object if it is a dynamic SemanticObject, null otherwise.
 */
export const getDynamicPathFromSemanticObject = (semanticObject: string): string | null => {
	const dynamicSemObjectRegex = semanticObject?.match(/{(.*?)}/);
	if (semanticObject?.startsWith("{=")) {
		return semanticObject;
	}
	if (dynamicSemObjectRegex?.length && dynamicSemObjectRegex.length > 1) {
		return dynamicSemObjectRegex[1];
	}
	return null;
};

/**
 * Check whether a property or a NavigationProperty has a semantic object defined or not.
 * @param property The target property
 * @returns `true` if it has a semantic object
 */
export const hasSemanticObject = function (property: Property | NavigationProperty | DataFieldAbstractTypes | DataPointType): boolean {
	const _propertyCommonAnnotations = property.annotations?.Common as Record<string, { term?: CommonAnnotationTerms; qualifier?: string }>;
	if (_propertyCommonAnnotations) {
		for (const key in _propertyCommonAnnotations) {
			if (_propertyCommonAnnotations[key]?.term === CommonAnnotationTerms.SemanticObject) {
				return true;
			}
		}
	}
	return false;
};

export const getSemanticObjects = function (property: Property | NavigationProperty): SemanticObject[] {
	const semanticObjects: SemanticObject[] = [];
	const _propertyCommonAnnotations = property.annotations?.Common as Record<string, { term?: CommonAnnotationTerms; qualifier?: string }>;
	if (_propertyCommonAnnotations) {
		for (const key in _propertyCommonAnnotations) {
			const annotation = _propertyCommonAnnotations[key];
			if (isAnnotationOfTerm<SemanticObject>(annotation, CommonAnnotationTerms.SemanticObject)) {
				semanticObjects.push(annotation);
			}
		}
	}
	return semanticObjects;
};

export const getSemanticObjectMappings = function (property: Property | NavigationProperty): SemanticObjectMapping[] {
	const semanticObjectMappings: SemanticObjectMapping[] = [];
	const _propertyCommonAnnotations = property.annotations?.Common as Record<string, { term?: CommonAnnotationTerms; qualifier?: string }>;
	if (_propertyCommonAnnotations) {
		for (const key in _propertyCommonAnnotations) {
			const annotation = _propertyCommonAnnotations[key];
			if (isAnnotationOfTerm<SemanticObjectMapping>(annotation, CommonAnnotationTerms.SemanticObjectMapping)) {
				semanticObjectMappings.push(annotation);
			}
		}
	}
	return semanticObjectMappings;
};

export const getSemanticObjectUnavailableActions = function (property: Property | NavigationProperty): SemanticObjectUnavailableActions[] {
	const semanticObjectUnavailableActions: SemanticObjectUnavailableActions[] = [];
	const _propertyCommonAnnotations = property.annotations?.Common as Record<string, { term?: CommonAnnotationTerms; qualifier?: string }>;
	if (_propertyCommonAnnotations) {
		for (const key in _propertyCommonAnnotations) {
			const annotation = _propertyCommonAnnotations[key];
			if (isAnnotationOfTerm<SemanticObjectUnavailableActions>(annotation, CommonAnnotationTerms.SemanticObjectUnavailableActions)) {
				semanticObjectUnavailableActions.push(annotation);
			}
		}
	}
	return semanticObjectUnavailableActions;
};

/**
 * Get the property or the navigation property in  its relative path that holds semanticObject annotation if it exists.
 * @param dataModelObjectPath
 * @returns A property or a NavProperty or undefined
 */
export const getPropertyWithSemanticObject = function (
	dataModelObjectPath: DataModelObjectPath<Property | NavigationProperty | DataFieldAbstractTypes | DataPointType>
): PropertyOrNavigationProperty {
	let propertyWithSemanticObject: PropertyOrNavigationProperty;
	if (dataModelObjectPath.targetObject && hasSemanticObject(dataModelObjectPath.targetObject)) {
		propertyWithSemanticObject = dataModelObjectPath.targetObject as Property | NavigationProperty;
	} else if (dataModelObjectPath.navigationProperties.length > 0) {
		// there are no semantic objects on the property itself so we look for some on nav properties
		for (const navProperty of dataModelObjectPath.navigationProperties) {
			if (
				!dataModelObjectPath.contextLocation?.navigationProperties.find(
					(contextNavProp) => contextNavProp.fullyQualifiedName === navProperty.fullyQualifiedName
				) &&
				!propertyWithSemanticObject &&
				hasSemanticObject(navProperty)
			) {
				propertyWithSemanticObject = navProperty;
			}
		}
	}
	return propertyWithSemanticObject;
};

/**
 * Get the semanticObject compile binding from metadata and a map to the qualifiers.
 * @param propertyWithSemanticObject The property that holds semanticObject annotataions if it exists
 * @returns An object containing semanticObjectList and qualifierMap
 */
export const getSemanticObjectsAndQualifierMap = function (propertyWithSemanticObject: PropertyOrNavigationProperty): {
	semanticObjectsList: string[];
	semanticObjectsExpressionList: BindingToolkitExpression<string>[];
	qualifierMap: Record<string, CompiledBindingToolkitExpression>;
} {
	const qualifierMap: Record<string, CompiledBindingToolkitExpression> = {};
	const semanticObjectsList: string[] = [];
	const semanticObjectsExpressionList: BindingToolkitExpression<string>[] = [];
	if (propertyWithSemanticObject !== undefined) {
		for (const semanticObject of getSemanticObjects(propertyWithSemanticObject)) {
			const semanticObjectExpression = getExpressionFromAnnotation(semanticObject);
			const compiledSemanticObject = compileExpression(semanticObjectExpression);
			// this should not happen, but we make sure not to add twice the semanticObject otherwise the mdcLink crashes
			if (compiledSemanticObject && !semanticObjectsList.includes(compiledSemanticObject)) {
				qualifierMap[semanticObject.qualifier || ""] = compiledSemanticObject;
				semanticObjectsList.push(compiledSemanticObject);
				semanticObjectsExpressionList.push(semanticObjectExpression);
			}
		}
	}
	return { semanticObjectsList, semanticObjectsExpressionList, qualifierMap };
};

/**
 * Determines if the current user can navigate to semantic objects based on the provided lists.
 * @param semanticObjectsCurrentUserCanNavigateTo The list of semantic objects the current user can navigate to.
 * @param semanticObjectList An object containing lists and maps of semantic objects.
 * @param semanticObjectList.semanticObjectsList The list of all semantic objects.
 * @param semanticObjectList.semanticObjectsExpressionList The list of expressions for semantic objects.
 * @param semanticObjectList.qualifierMap A map of qualifiers to compiled expressions.
 * @returns An object containing information about static and dynamic semantic objects.
 */
export const getReachableSemanticObjectsSettings = function (
	semanticObjectsCurrentUserCanNavigateTo: string[],
	semanticObjectList: {
		semanticObjectsList: string[];
		semanticObjectsExpressionList: BindingToolkitExpression<string>[];
		qualifierMap: Record<string, CompiledBindingToolkitExpression>;
	}
): { hasReachableStaticSemanticObject: boolean; dynamicSemanticObjects: BindingToolkitExpression<string>[] } {
	const dynamicSemanticObjectsList: BindingToolkitExpression<string>[] = [];
	let result = false;
	if (semanticObjectsCurrentUserCanNavigateTo) {
		for (const semanticObject of semanticObjectsCurrentUserCanNavigateTo) {
			for (const actualSemanticObject of semanticObjectList.semanticObjectsList) {
				if (semanticObject === actualSemanticObject) {
					result = true;
					break;
				}
			}
			if (result) {
				break;
			}
		}
		semanticObjectList.semanticObjectsExpressionList.forEach((semanticObjectExpression) => {
			if (semanticObjectExpression._type !== "Constant") {
				dynamicSemanticObjectsList.push(semanticObjectExpression);
			}
		});
	}
	return { hasReachableStaticSemanticObject: result, dynamicSemanticObjects: dynamicSemanticObjectsList };
};

/**
 * Check the user rights to navigate to the semantic objects.
 * @param semanticObject The semantic object name
 * @param dataModelPath The DataModelObjectPath of the property
 * @param settings The TemplateProcessorSettings of the internal field
 * @returns An object containing semanticObjectList and qualifierMap
 */
export const manageSemanticObjectsForCurrentUser = function (
	semanticObject: PropertyBindingInfo | undefined,
	dataModelPath: DataModelObjectPath<Property>,
	internalDataModel: JSONModel
): { hasReachableStaticSemanticObject: boolean; dynamicSemanticObjects: BindingToolkitExpression<string>[] } {
	const property: Property = dataModelPath.targetObject!;
	const semanticObjectsCurrentUserCanNavigateTo = internalDataModel?.getProperty("/semanticObjects");
	const propertySemanticObjectList = getSemanticObjectsAndQualifierMap(property);

	// semantic object is in navigation
	const propertyWithSemanticObjectFromNavigation = getPropertyWithSemanticObject(dataModelPath);
	if (isNavigationProperty(propertyWithSemanticObjectFromNavigation)) {
		const semanticObjectExpression = getExpressionFromAnnotation(
			propertyWithSemanticObjectFromNavigation?.annotations?.Common?.SemanticObject
		);
		const semanticObjectValue = compileExpression(semanticObjectExpression);
		propertySemanticObjectList.semanticObjectsExpressionList.push(semanticObjectExpression);
		propertySemanticObjectList.semanticObjectsList.push(semanticObjectValue as string);
	}

	// custom semanticObject from field property

	if (semanticObject !== undefined && semanticObject !== "") {
		if (semanticObject[0] === "[") {
			const customSemanticObjects = JSON.parse(semanticObject);
			customSemanticObjects.forEach((internalSemanticObject: string) => {
				propertySemanticObjectList.semanticObjectsList.push(internalSemanticObject);
			});
		} else if (semanticObject.bindingString) {
			const semanticObjectExpressionFromField = resolveBindingString(
				semanticObject.bindingString
			) as BindingToolkitExpression<string>;
			propertySemanticObjectList.semanticObjectsExpressionList.push(semanticObjectExpressionFromField);
		} else {
			propertySemanticObjectList.semanticObjectsList.push(semanticObject);
		}
	}
	return getReachableSemanticObjectsSettings(semanticObjectsCurrentUserCanNavigateTo, propertySemanticObjectList);
};

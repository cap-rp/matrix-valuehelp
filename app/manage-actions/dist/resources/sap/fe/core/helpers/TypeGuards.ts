import type {
	AnnotationTerm,
	ComplexType,
	EntityContainer,
	EntitySet,
	EntityType,
	MultipleNavigationProperty,
	NavigationProperty,
	PathAnnotationExpression,
	Property,
	PropertyPath,
	ServiceObject,
	SingleNavigationProperty,
	Singleton,
	TypeDefinition
} from "@sap-ux/vocabularies-types";
import type { Action, AnnotationPath } from "@sap-ux/vocabularies-types/Edm";
import type Context from "sap/ui/model/odata/v4/Context";

export function isFulfilled<T>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> {
	return p.status === "fulfilled";
}
export function isRejected<T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult {
	return p.status === "rejected";
}

export function isContext(potentialContext: Context | unknown | undefined): potentialContext is Context {
	return (potentialContext as Context)?.isA?.<Context>("sap.ui.model.Context");
}

export function isFunctionArray(potentialFunctionArray: Function[] | unknown): potentialFunctionArray is Function[] {
	return (
		Array.isArray(potentialFunctionArray) &&
		potentialFunctionArray.length > 0 &&
		potentialFunctionArray.every((item) => typeof item === "function")
	);
}

type AnnotationType = {
	$Type?: string;
	fullyQualifiedName?: string;
};
export type _AnnotationTerm = {
	term: string;
	qualifier?: string;
};

/**
 * Checks whether the argument is an annotation of the given type.
 * @param potentialAnnotationType The annotation to check
 * @param typeName The type to check for
 * @returns Whether the argument is an annotation of the given type
 */
export function isAnnotationOfType<T extends object & AnnotationType>(
	potentialAnnotationType: unknown,
	typeName: T["$Type"] | T["$Type"][]
): potentialAnnotationType is T {
	if (Array.isArray(typeName)) {
		return typeName.includes((potentialAnnotationType as AnnotationType)?.$Type);
	}
	return (potentialAnnotationType as AnnotationType)?.$Type === typeName;
}

/**
 * Checks whether the argument is an annotation of the given term.
 * @param potentialAnnotation The annotation to check
 * @param termName The term to check for
 * @returns Whether the argument is an annotation of the given term
 */
export function isAnnotationOfTerm<T extends object & _AnnotationTerm>(
	potentialAnnotation: unknown,
	termName: T["term"]
): potentialAnnotation is AnnotationTerm<T> {
	return (potentialAnnotation as _AnnotationTerm)?.term === termName;
}

export function isAnnotationTerm(potentialAnnotation: unknown): potentialAnnotation is _AnnotationTerm {
	return (potentialAnnotation as _AnnotationTerm).hasOwnProperty("term");
}

/**
 * Checks whether the argument is a {@link ServiceObject}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link ServiceObject}.
 */
export function isServiceObject(serviceObject: unknown | undefined): serviceObject is ServiceObject {
	return serviceObject?.hasOwnProperty("_type") ?? false;
}

/**
 * Checks whether the argument is a {@link ComplexType}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link ComplexType}.
 */
export function isComplexType(serviceObject: unknown): serviceObject is ComplexType {
	return (serviceObject as ComplexType)?._type === "ComplexType";
}

/**
 * Checks whether the argument is a {@link TypeDefinition}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link TypeDefinition}.
 */
export function isTypeDefinition(serviceObject: unknown): serviceObject is TypeDefinition {
	return (serviceObject as TypeDefinition)?._type === "TypeDefinition";
}

/**
 * Checks whether the argument is an {@link EntityContainer}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntityContainer}.
 */
export function isEntityContainer(serviceObject: unknown): serviceObject is EntityContainer {
	return (serviceObject as EntityContainer)?._type === "EntityContainer";
}

/**
 * Checks whether the argument is an {@link EntitySet}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntitySet}.
 */
export function isEntitySet(serviceObject: unknown): serviceObject is EntitySet {
	return (serviceObject as EntitySet)?._type === "EntitySet";
}

/**
 * Checks whether the argument is a {@link Singleton}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link Singleton}
 */
export function isSingleton(serviceObject: unknown): serviceObject is Singleton {
	return (serviceObject as Singleton)?._type === "Singleton";
}

/**
 * Checks whether the argument is an {@link EntityType}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntityType}
 */
export function isEntityType(serviceObject: unknown): serviceObject is EntityType {
	return (serviceObject as EntityType)?._type === "EntityType";
}

/**
 * Checks whether the argument is a {@link Property}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link Property}.
 */
export function isProperty(serviceObject: unknown): serviceObject is Property {
	return (serviceObject as Property)?._type === "Property";
}

/**
 * Checks whether the argument is a {@link NavigationProperty}.
 *
 * Hint: There are also the more specific functions {@link isSingleNavigationProperty} and {@link isMultipleNavigationProperty}. These can be
 * used to check for to-one and to-many navigation properties, respectively.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link NavigationProperty}.
 */
export function isNavigationProperty(serviceObject: unknown): serviceObject is NavigationProperty {
	return (serviceObject as NavigationProperty)?._type === "NavigationProperty";
}

/**
 * Checks whether the argument is a {@link SingleNavigationProperty}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link SingleNavigationProperty}.
 */
export function isSingleNavigationProperty(serviceObject: unknown): serviceObject is SingleNavigationProperty {
	return isNavigationProperty(serviceObject) && !serviceObject.isCollection;
}

/**
 * Checks whether the argument is a {@link MultipleNavigationProperty}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link MultipleNavigationProperty}.
 */
export function isMultipleNavigationProperty(serviceObject: unknown): serviceObject is MultipleNavigationProperty {
	return isNavigationProperty(serviceObject) && serviceObject.isCollection;
}

/**
 * Checks whether the argument is a {@link PathAnnotationExpression}.
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link PathAnnotationExpression}.
 */
export function isPathAnnotationExpression<T>(expression: unknown): expression is PathAnnotationExpression<T> {
	return (expression as PathAnnotationExpression<T>)?.type === "Path";
}

/**
 * Checks whether the argument is a {@link AnnotationPathExpression}.
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link AnnotationPathExpression}.
 */
export function isAnnotationPath<T>(expression: unknown): expression is AnnotationPath<T> {
	return (expression as AnnotationPath<T>)?.type === "AnnotationPath";
}

/**
 * Checks whether the argument is a {@link PropertyPath}.
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link PropertyPath}.
 */
export function isPropertyPathExpression(expression: unknown): expression is PropertyPath {
	return (expression as PropertyPath)?.type === "PropertyPath";
}

/**
 * Checks whether the argument is an {@link Action}.
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link Action}.
 */
export function isAction(serviceObject: unknown): serviceObject is Action {
	return (serviceObject as Action)?._type === "Action";
}

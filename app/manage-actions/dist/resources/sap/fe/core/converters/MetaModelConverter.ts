// This file is retrieved from @sap-ux/annotation-converter, shared code with tool suite
import type {
	ActionParameter,
	AnnotationList,
	AnnotationRecord,
	AnnotationTerm,
	ConvertedMetadata,
	EntitySet,
	EntityType,
	Expression,
	NavigationProperty,
	RawAction,
	RawActionImport,
	RawAnnotation,
	RawComplexType,
	RawEntitySet,
	RawEntityType,
	RawMetadata,
	RawNavigationPropertyBinding,
	RawProperty,
	RawSchema,
	RawSingleton,
	RawTypeDefinition,
	RawV4NavigationProperty,
	ReferentialConstraint,
	ServiceObject,
	ServiceObjectAndAnnotation,
	Singleton
} from "@sap-ux/vocabularies-types";
import type { ApplyExpression, Collection, CollectionExpression, PropertyValue } from "@sap-ux/vocabularies-types/BaseEdm";
import type { AnnotationPath, PrimitiveType, PropertyAnnotationValue, RecordComplexType } from "@sap-ux/vocabularies-types/Edm";
import type { PropertyAnnotations_Analytics } from "@sap-ux/vocabularies-types/vocabularies/Analytics_Edm";
import type { FilterRestrictions } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type {
	EntitySetAnnotations_Capabilities,
	EntityTypeAnnotations_Capabilities,
	PropertyAnnotations_Capabilities
} from "@sap-ux/vocabularies-types/vocabularies/Capabilities_Edm";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import type { PropertyAnnotations_Communication } from "@sap-ux/vocabularies-types/vocabularies/Communication_Edm";
import type { PropertyAnnotations_Core } from "@sap-ux/vocabularies-types/vocabularies/Core_Edm";
import type { PropertyAnnotations_Measures } from "@sap-ux/vocabularies-types/vocabularies/Measures_Edm";
import type { PropertyAnnotations_PersonalData } from "@sap-ux/vocabularies-types/vocabularies/PersonalData_Edm";
import type { PropertyAnnotations_Session } from "@sap-ux/vocabularies-types/vocabularies/Session_Edm";
import type {
	Chart,
	DataField,
	DataFieldAbstractTypes,
	DataPoint,
	DataPointType,
	FacetTypes,
	FieldGroup,
	FilterFacets,
	HeaderFacets,
	HeaderInfo,
	LineItem,
	PresentationVariant,
	ReferenceFacet,
	TextArrangement
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type {
	EntitySetAnnotations_UI,
	EntityTypeAnnotations_UI,
	PropertyAnnotations_UI
} from "@sap-ux/vocabularies-types/vocabularies/UI_Edm";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { constant, formatResult, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import { AnnotationConverter } from "sap/fe/core/converters/common";
import {
	isEntityContainer,
	isEntitySet,
	isEntityType,
	isNavigationProperty,
	isServiceObject,
	isSingleton
} from "sap/fe/core/helpers/TypeGuards";
import type { EnvironmentCapabilities } from "sap/fe/core/services/EnvironmentServiceFactory";
import { DefaultEnvironmentCapabilities } from "sap/fe/core/services/EnvironmentServiceFactory";
import type { DataModelObjectContext, DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type Context from "sap/ui/model/Context";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { ExpandPathType, MetaModelEnum, MetaModelType, Rename } from "types/metamodel_types";
import { prepareId } from "../helpers/StableIdHelper";

export type MetaModelActionParameter = {
	$Type: string;
	$Name: string;
	$Nullable?: boolean;
	$MaxLength?: number;
	$Precision?: number;
	$Scale?: number;
	$isCollection?: boolean;
};
export type MetaModelAction = {
	$kind: "Action" | "Function";
	$IsBound: boolean;
	$EntitySetPath: string;
	$Parameter: MetaModelActionParameter[];
	$ReturnType: {
		$Type: string;
		$isCollection?: boolean;
	};
};

type MetaModelAnnotation = null | string | boolean | number | MetaModelAnnotationRecord;
type MetaModelAnnotationRecord = {
	$Type: string;
	$PropertyPath?: string;
	$Path?: string;
	$Decimal?: string;
	$If?: unknown;
	$And?: unknown;
	$Or?: unknown;
	$Not?: unknown;
	$Eq?: unknown;
	$Ne?: unknown;
	$Gt?: unknown;
	$Ge?: unknown;
	$Lt?: unknown;
	$Le?: unknown;
	$Apply?: unknown;
	$Function?: unknown;
	$AnnotationPath?: string;
	$EnumMember?: string;
	$NavigationPropertyPath?: string;
} & {
	[propertyKey: string]: MetaModelAnnotation;
};
function parsePropertyValue(
	annotationObject: MetaModelAnnotation,
	propertyKey: string,
	currentTarget: string,
	annotationsLists: Record<string, AnnotationList>,
	oCapabilities: EnvironmentCapabilities
): { name: string; value: Expression } {
	let value!: Expression;
	if (annotationObject === null) {
		value = { type: "Null" };
	} else if (typeof annotationObject === "string") {
		value = { type: "String", String: annotationObject };
	} else if (typeof annotationObject === "boolean") {
		value = { type: "Bool", Bool: annotationObject };
	} else if (typeof annotationObject === "number") {
		value = { type: "Int", Int: annotationObject };
	} else if (Array.isArray(annotationObject)) {
		const collectionValue: CollectionExpression = {
			type: "Collection",
			Collection: annotationObject.map((subAnnotationObject, subAnnotationObjectIndex) =>
				parseAnnotationObject(
					subAnnotationObject,
					`${currentTarget}/${propertyKey}/${subAnnotationObjectIndex}`,
					annotationsLists,
					oCapabilities
				)
			) as Collection
		};
		if (annotationObject.length > 0) {
			if (annotationObject[0].hasOwnProperty("$PropertyPath")) {
				collectionValue.Collection.type = "PropertyPath";
			} else if (annotationObject[0].hasOwnProperty("$Path")) {
				collectionValue.Collection.type = "Path";
			} else if (annotationObject[0].hasOwnProperty("$NavigationPropertyPath")) {
				collectionValue.Collection.type = "NavigationPropertyPath";
			} else if (annotationObject[0].hasOwnProperty("$AnnotationPath")) {
				collectionValue.Collection.type = "AnnotationPath";
			} else if (annotationObject[0].hasOwnProperty("$Type")) {
				collectionValue.Collection.type = "Record";
			} else if (annotationObject[0].hasOwnProperty("$If")) {
				collectionValue.Collection.type = "If";
			} else if (annotationObject[0].hasOwnProperty("$Or")) {
				collectionValue.Collection.type = "Or";
			} else if (annotationObject[0].hasOwnProperty("$And")) {
				collectionValue.Collection.type = "And";
			} else if (annotationObject[0].hasOwnProperty("$Eq")) {
				collectionValue.Collection.type = "Eq";
			} else if (annotationObject[0].hasOwnProperty("$Ne")) {
				collectionValue.Collection.type = "Ne";
			} else if (annotationObject[0].hasOwnProperty("$Not")) {
				collectionValue.Collection.type = "Not";
			} else if (annotationObject[0].hasOwnProperty("$Gt")) {
				collectionValue.Collection.type = "Gt";
			} else if (annotationObject[0].hasOwnProperty("$Ge")) {
				collectionValue.Collection.type = "Ge";
			} else if (annotationObject[0].hasOwnProperty("$Lt")) {
				collectionValue.Collection.type = "Lt";
			} else if (annotationObject[0].hasOwnProperty("$Le")) {
				collectionValue.Collection.type = "Le";
			} else if (annotationObject[0].hasOwnProperty("$Apply")) {
				collectionValue.Collection.type = "Apply";
			} else if (typeof annotationObject[0] === "object") {
				// $Type is optional...
				collectionValue.Collection.type = "Record";
			} else {
				collectionValue.Collection.type = "String";
			}
		}
		value = collectionValue;
	} else if (typeof annotationObject === "object") {
		if (annotationObject.$Path !== undefined) {
			value = { type: "Path", Path: annotationObject.$Path };
		} else if (annotationObject.$Decimal !== undefined) {
			value = { type: "Decimal", Decimal: parseFloat(annotationObject.$Decimal) };
		} else if (annotationObject.$PropertyPath !== undefined) {
			value = { type: "PropertyPath", PropertyPath: annotationObject.$PropertyPath };
		} else if (annotationObject.$NavigationPropertyPath !== undefined) {
			value = { type: "NavigationPropertyPath", NavigationPropertyPath: annotationObject.$NavigationPropertyPath };
		} else if (annotationObject.$If !== undefined) {
			value = { type: "If", $If: annotationObject.$If as [Expression, Expression, Expression] };
		} else if (annotationObject.$And !== undefined) {
			value = { type: "And", $And: annotationObject.$And as [Expression, Expression] };
		} else if (annotationObject.$Or !== undefined) {
			value = { type: "Or", $Or: annotationObject.$Or as [Expression, Expression] };
		} else if (annotationObject.$Not !== undefined) {
			value = { type: "Not", $Not: annotationObject.$Not as Expression };
		} else if (annotationObject.$Eq !== undefined) {
			value = { type: "Eq", $Eq: annotationObject.$Eq as [Expression, Expression] };
		} else if (annotationObject.$Ne !== undefined) {
			value = { type: "Ne", $Ne: annotationObject.$Ne as [Expression, Expression] };
		} else if (annotationObject.$Gt !== undefined) {
			value = { type: "Gt", $Gt: annotationObject.$Gt as [Expression, Expression] };
		} else if (annotationObject.$Ge !== undefined) {
			value = { type: "Ge", $Ge: annotationObject.$Ge as [Expression, Expression] };
		} else if (annotationObject.$Lt !== undefined) {
			value = { type: "Lt", $Lt: annotationObject.$Lt as [Expression, Expression] };
		} else if (annotationObject.$Le !== undefined) {
			value = { type: "Le", $Le: annotationObject.$Le as [Expression, Expression] };
		} else if (annotationObject.$Apply !== undefined) {
			value = { type: "Apply", $Apply: annotationObject.$Apply, $Function: annotationObject.$Function } as ApplyExpression;
		} else if (annotationObject.$AnnotationPath !== undefined) {
			value = { type: "AnnotationPath", AnnotationPath: annotationObject.$AnnotationPath };
		} else if (annotationObject.$EnumMember !== undefined) {
			value = { type: "EnumMember", EnumMember: annotationObject.$EnumMember };
		} else {
			value = {
				type: "Record",
				Record: parseAnnotationObject(annotationObject, currentTarget, annotationsLists, oCapabilities) as AnnotationRecord
			};
		}
	}
	return {
		name: propertyKey,
		value
	};
}

function parseAnnotationObject(
	annotationObject: MetaModelAnnotation,
	currentObjectTarget: string,
	annotationsLists: Record<string, AnnotationList>,
	oCapabilities: EnvironmentCapabilities
): Expression | AnnotationRecord {
	let parsedAnnotationObject: Expression | AnnotationRecord;
	if (annotationObject === null) {
		parsedAnnotationObject = { type: "Null" };
	} else if (typeof annotationObject === "string") {
		parsedAnnotationObject = { type: "String", String: annotationObject };
	} else if (typeof annotationObject === "boolean") {
		parsedAnnotationObject = { type: "Bool", Bool: annotationObject };
	} else if (typeof annotationObject === "number") {
		parsedAnnotationObject = { type: "Int", Int: annotationObject };
	} else if (Array.isArray(annotationObject)) {
		const parsedAnnotationCollection = {
			collection: annotationObject.map((subAnnotationObject, subAnnotationIndex) =>
				parseAnnotationObject(subAnnotationObject, `${currentObjectTarget}/${subAnnotationIndex}`, annotationsLists, oCapabilities)
			) as Collection
		};
		if (annotationObject.length > 0) {
			if (annotationObject[0].hasOwnProperty("$PropertyPath")) {
				parsedAnnotationCollection.collection.type = "PropertyPath";
			} else if (annotationObject[0].hasOwnProperty("$Path")) {
				parsedAnnotationCollection.collection.type = "Path";
			} else if (annotationObject[0].hasOwnProperty("$NavigationPropertyPath")) {
				parsedAnnotationCollection.collection.type = "NavigationPropertyPath";
			} else if (annotationObject[0].hasOwnProperty("$AnnotationPath")) {
				parsedAnnotationCollection.collection.type = "AnnotationPath";
			} else if (annotationObject[0].hasOwnProperty("$Type")) {
				parsedAnnotationCollection.collection.type = "Record";
			} else if (annotationObject[0].hasOwnProperty("$If")) {
				parsedAnnotationCollection.collection.type = "If";
			} else if (annotationObject[0].hasOwnProperty("$And")) {
				parsedAnnotationCollection.collection.type = "And";
			} else if (annotationObject[0].hasOwnProperty("$Or")) {
				parsedAnnotationCollection.collection.type = "Or";
			} else if (annotationObject[0].hasOwnProperty("$Eq")) {
				parsedAnnotationCollection.collection.type = "Eq";
			} else if (annotationObject[0].hasOwnProperty("$Ne")) {
				parsedAnnotationCollection.collection.type = "Ne";
			} else if (annotationObject[0].hasOwnProperty("$Not")) {
				parsedAnnotationCollection.collection.type = "Not";
			} else if (annotationObject[0].hasOwnProperty("$Gt")) {
				parsedAnnotationCollection.collection.type = "Gt";
			} else if (annotationObject[0].hasOwnProperty("$Ge")) {
				parsedAnnotationCollection.collection.type = "Ge";
			} else if (annotationObject[0].hasOwnProperty("$Lt")) {
				parsedAnnotationCollection.collection.type = "Lt";
			} else if (annotationObject[0].hasOwnProperty("$Le")) {
				parsedAnnotationCollection.collection.type = "Le";
			} else if (annotationObject[0].hasOwnProperty("$Apply")) {
				parsedAnnotationCollection.collection.type = "Apply";
			} else if (typeof annotationObject[0] === "object") {
				parsedAnnotationCollection.collection.type = "Record";
			} else {
				parsedAnnotationCollection.collection.type = "String";
			}
		}
	} else if (typeof annotationObject === "object") {
		if (annotationObject.$AnnotationPath !== undefined) {
			parsedAnnotationObject = { type: "AnnotationPath", AnnotationPath: annotationObject.$AnnotationPath };
		} else if (annotationObject.$Path !== undefined) {
			parsedAnnotationObject = { type: "Path", Path: annotationObject.$Path };
		} else if (annotationObject.$Decimal !== undefined) {
			parsedAnnotationObject = { type: "Decimal", Decimal: parseFloat(annotationObject.$Decimal) };
		} else if (annotationObject.$PropertyPath !== undefined) {
			parsedAnnotationObject = { type: "PropertyPath", PropertyPath: annotationObject.$PropertyPath };
		} else if (annotationObject.$If !== undefined) {
			parsedAnnotationObject = { type: "If", $If: annotationObject.$If as [Expression, Expression, Expression] };
		} else if (annotationObject.$And !== undefined) {
			parsedAnnotationObject = { type: "And", $And: annotationObject.$And as [Expression, Expression] };
		} else if (annotationObject.$Or !== undefined) {
			parsedAnnotationObject = { type: "Or", $Or: annotationObject.$Or as [Expression, Expression] };
		} else if (annotationObject.$Not !== undefined) {
			parsedAnnotationObject = { type: "Not", $Not: annotationObject.$Not as Expression };
		} else if (annotationObject.$Eq !== undefined) {
			parsedAnnotationObject = { type: "Eq", $Eq: annotationObject.$Eq as [Expression, Expression] };
		} else if (annotationObject.$Ne !== undefined) {
			parsedAnnotationObject = { type: "Ne", $Ne: annotationObject.$Ne as [Expression, Expression] };
		} else if (annotationObject.$Gt !== undefined) {
			parsedAnnotationObject = { type: "Gt", $Gt: annotationObject.$Gt as [Expression, Expression] };
		} else if (annotationObject.$Ge !== undefined) {
			parsedAnnotationObject = { type: "Ge", $Ge: annotationObject.$Ge as [Expression, Expression] };
		} else if (annotationObject.$Lt !== undefined) {
			parsedAnnotationObject = { type: "Lt", $Lt: annotationObject.$Lt as [Expression, Expression] };
		} else if (annotationObject.$Le !== undefined) {
			parsedAnnotationObject = { type: "Le", $Le: annotationObject.$Le as [Expression, Expression] };
		} else if (annotationObject.$Apply !== undefined) {
			parsedAnnotationObject = {
				type: "Apply",
				$Apply: annotationObject.$Apply,
				$Function: annotationObject.$Function
			} as ApplyExpression;
		} else if (annotationObject.$NavigationPropertyPath !== undefined) {
			parsedAnnotationObject = {
				type: "NavigationPropertyPath",
				NavigationPropertyPath: annotationObject.$NavigationPropertyPath
			};
		} else if (annotationObject.$EnumMember !== undefined) {
			parsedAnnotationObject = {
				type: "EnumMember",
				EnumMember: annotationObject.$EnumMember
			};
		} else {
			const parsedAnnotationObjectRecord: AnnotationRecord = {
				type: "Record",
				propertyValues: []
			};
			if (annotationObject.$Type) {
				parsedAnnotationObjectRecord.type = annotationObject.$Type;
			}
			const propertyValues: PropertyValue[] = [];
			Object.keys(annotationObject).forEach((propertyKey) => {
				if (
					propertyKey !== "$Type" &&
					propertyKey !== "$If" &&
					propertyKey !== "$Apply" &&
					propertyKey !== "$And" &&
					propertyKey !== "$Or" &&
					propertyKey !== "$Ne" &&
					propertyKey !== "$Gt" &&
					propertyKey !== "$Ge" &&
					propertyKey !== "$Lt" &&
					propertyKey !== "$Le" &&
					propertyKey !== "$Not" &&
					propertyKey !== "$Eq" &&
					!propertyKey.startsWith("@")
				) {
					propertyValues.push(
						parsePropertyValue(annotationObject[propertyKey], propertyKey, currentObjectTarget, annotationsLists, oCapabilities)
					);
				} else if (propertyKey.startsWith("@")) {
					// Annotation of annotation
					createAnnotationLists(
						{ [propertyKey]: annotationObject[propertyKey] },
						currentObjectTarget,
						annotationsLists,
						oCapabilities
					);
				}
			});
			parsedAnnotationObjectRecord.propertyValues = propertyValues;
			parsedAnnotationObject = parsedAnnotationObjectRecord;
		}
	}
	return parsedAnnotationObject!;
}
function getOrCreateAnnotationList(target: string, annotationsLists: Record<string, AnnotationList>): AnnotationList {
	if (!annotationsLists.hasOwnProperty(target)) {
		annotationsLists[target] = {
			target: target,
			annotations: []
		};
	}
	return annotationsLists[target];
}

function createReferenceFacetId(referenceFacet: MetaModelType<ReferenceFacet>): string | undefined {
	const id = referenceFacet.ID ?? referenceFacet.Target?.$AnnotationPath;
	return id ? prepareId(id) : id;
}

function removeChartAnnotations(annotationObject: MetaModelType<HeaderFacets> | MetaModelType<DataFieldAbstractTypes>[]): unknown[] {
	return annotationObject.filter((oRecord: MetaModelType<FacetTypes> | MetaModelType<DataFieldAbstractTypes>): boolean => {
		const recordAsRefFacet = oRecord as MetaModelType<ReferenceFacet>;
		if (recordAsRefFacet.Target && recordAsRefFacet.Target.$AnnotationPath) {
			return !recordAsRefFacet.Target.$AnnotationPath.includes(`@${UIAnnotationTerms.Chart}`);
		} else {
			return true;
		}
	});
}

function removeIBNAnnotations(annotationObject: MetaModelType<DataFieldAbstractTypes>[]): MetaModelType<DataFieldAbstractTypes>[] {
	return annotationObject.filter((oRecord: MetaModelType<DataFieldAbstractTypes>): boolean => {
		return oRecord.$Type !== UIAnnotationTypes.DataFieldForIntentBasedNavigation;
	});
}

function handlePresentationVariant(
	annotationObject: ExpandPathType<AnnotationPath<Chart | DataPoint | LineItem>>[]
): ExpandPathType<AnnotationPath<Chart | DataPoint | LineItem>>[] {
	return annotationObject.filter((oRecord): boolean => {
		return oRecord.$AnnotationPath !== `@${UIAnnotationTerms.Chart}`;
	});
}

function createAnnotationLists(
	annotationObjects: Record<string, unknown>,
	annotationTarget: string,
	annotationLists: Record<string, AnnotationList>,
	oCapabilities: EnvironmentCapabilities
): void {
	if (Object.keys(annotationObjects).length === 0) {
		return;
	}
	const outAnnotationObject = getOrCreateAnnotationList(annotationTarget, annotationLists);
	if (!oCapabilities.MicroChart) {
		delete annotationObjects[`@${UIAnnotationTerms.Chart}`];
	} else {
		oCapabilities.loadLibrary?.("sap.suite.ui.microchart");
	}

	for (const annotationKey in annotationObjects) {
		let annotationObject = annotationObjects[annotationKey];
		switch (annotationKey) {
			case `@${UIAnnotationTerms.HeaderFacets}`:
				if (!oCapabilities.MicroChart) {
					annotationObject = removeChartAnnotations(annotationObject as MetaModelType<HeaderFacets>);
					annotationObjects[annotationKey] = annotationObject;
				}
				break;
			case `@${UIAnnotationTerms.Identification}`:
				if (!oCapabilities.IntentBasedNavigation) {
					annotationObject = removeIBNAnnotations(annotationObject as MetaModelType<DataFieldAbstractTypes>[]);
					annotationObjects[annotationKey] = annotationObject;
				}
				break;
			case `@${UIAnnotationTerms.LineItem}`:
				if (!oCapabilities.IntentBasedNavigation) {
					annotationObject = removeIBNAnnotations(annotationObject as MetaModelType<DataFieldAbstractTypes>[]);
					annotationObjects[annotationKey] = annotationObject;
				}
				if (!oCapabilities.MicroChart) {
					annotationObject = removeChartAnnotations(annotationObject as MetaModelType<DataFieldAbstractTypes>[]);
					annotationObjects[annotationKey] = annotationObject;
				}
				break;
			case `@${UIAnnotationTerms.FieldGroup}`:
				const fieldGroupAnnotation = annotationObject as MetaModelType<FieldGroup>;
				if (!oCapabilities.IntentBasedNavigation && fieldGroupAnnotation.Data) {
					fieldGroupAnnotation.Data = removeIBNAnnotations(fieldGroupAnnotation.Data);
					annotationObjects[annotationKey] = annotationObject;
				}
				if (!oCapabilities.MicroChart && fieldGroupAnnotation.Data) {
					fieldGroupAnnotation.Data = removeChartAnnotations(
						fieldGroupAnnotation.Data
					) as MetaModelType<DataFieldAbstractTypes>[];
					annotationObjects[annotationKey] = annotationObject;
				}
				break;
			case `@${UIAnnotationTerms.PresentationVariant}`:
				const presentationVariant = annotationObject as MetaModelType<PresentationVariant>;
				if (!oCapabilities.Chart && presentationVariant.Visualizations) {
					presentationVariant.Visualizations = handlePresentationVariant(presentationVariant.Visualizations);
					annotationObjects[annotationKey] = annotationObject;
				}
				break;
			case `@com.sap.vocabularies.Common.v1.DraftRoot`:
				// This scenario is needed for enabling semantic filtering on DraftAdministrativeData-filters. As of now the SingleRange annotation is read by the
				// FieldHelper, which should not include any propertyspecific logic. We will remove this once the FieldHelper receives the SingleRange data from
				// the converter or having it set is no longer a prerequisite for the semantic filtering.
				const filterRestrictions = annotationObjects[`@Org.OData.Capabilities.V1.FilterRestrictions`] as
					| MetaModelType<FilterRestrictions>
					| undefined;
				if (filterRestrictions?.FilterExpressionRestrictions?.length) {
					if (
						!filterRestrictions.FilterExpressionRestrictions.some((FilterExpressionRestriction) => {
							return FilterExpressionRestriction?.Property?.$PropertyPath.includes("DraftAdministrativeData");
						})
					) {
						filterRestrictions.FilterExpressionRestrictions.push(
							{
								$Type: "Org.OData.Capabilities.V1.FilterExpressionRestrictionType",
								AllowedExpressions: "SingleRange",
								Property: {
									$PropertyPath: "DraftAdministrativeData/CreationDateTime"
								},
								fullyQualifiedName: undefined
							},
							{
								$Type: "Org.OData.Capabilities.V1.FilterExpressionRestrictionType",
								AllowedExpressions: "SingleRange",
								Property: {
									$PropertyPath: "DraftAdministrativeData/LastChangeDateTime"
								},
								fullyQualifiedName: undefined
							}
						);
					}
				}
				break;
			default:
				break;
		}

		let currentOutAnnotationObject = outAnnotationObject;

		// Check for annotation of annotation
		let finalKey = annotationKey;
		const annotationOfAnnotationSplit = annotationKey.split("@");
		if (annotationOfAnnotationSplit.length > 2) {
			currentOutAnnotationObject = getOrCreateAnnotationList(
				`${annotationTarget}@${annotationOfAnnotationSplit[1]}`,
				annotationLists
			);
			finalKey = annotationOfAnnotationSplit[2];
		} else {
			finalKey = annotationOfAnnotationSplit[1];
		}

		const annotationQualifierSplit = finalKey.split("#");
		const qualifier = annotationQualifierSplit[1];
		finalKey = annotationQualifierSplit[0];

		const parsedAnnotationObject: RawAnnotation = {
			term: finalKey,
			qualifier: qualifier
		};
		let currentAnnotationTarget = `${annotationTarget}@${parsedAnnotationObject.term}`;
		if (qualifier) {
			currentAnnotationTarget += `#${qualifier}`;
		}
		const annotationObjectToParse = annotationObject as MetaModelAnnotation;
		if (annotationObjectToParse === null) {
			parsedAnnotationObject.value = { type: "Null" };
		} else if (typeof annotationObjectToParse === "string") {
			parsedAnnotationObject.value = { type: "String", String: annotationObjectToParse };
		} else if (typeof annotationObjectToParse === "boolean") {
			parsedAnnotationObject.value = { type: "Bool", Bool: annotationObjectToParse };
		} else if (typeof annotationObjectToParse === "number") {
			parsedAnnotationObject.value = { type: "Int", Int: annotationObjectToParse };
		} else if (Array.isArray(annotationObjectToParse)) {
			parsedAnnotationObject.collection = annotationObjectToParse.map((subAnnotationObject, subAnnotationIndex) =>
				parseAnnotationObject(
					subAnnotationObject,
					`${currentAnnotationTarget}/${subAnnotationIndex}`,
					annotationLists,
					oCapabilities
				)
			) as Collection;
			if (annotationObjectToParse.length > 0) {
				if (annotationObjectToParse[0].hasOwnProperty("$PropertyPath")) {
					parsedAnnotationObject.collection.type = "PropertyPath";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Path")) {
					parsedAnnotationObject.collection.type = "Path";
				} else if (annotationObjectToParse[0].hasOwnProperty("$NavigationPropertyPath")) {
					parsedAnnotationObject.collection.type = "NavigationPropertyPath";
				} else if (annotationObjectToParse[0].hasOwnProperty("$AnnotationPath")) {
					parsedAnnotationObject.collection.type = "AnnotationPath";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Type")) {
					parsedAnnotationObject.collection.type = "Record";
				} else if (annotationObjectToParse[0].hasOwnProperty("$If")) {
					parsedAnnotationObject.collection.type = "If";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Or")) {
					parsedAnnotationObject.collection.type = "Or";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Eq")) {
					parsedAnnotationObject.collection.type = "Eq";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Ne")) {
					parsedAnnotationObject.collection.type = "Ne";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Not")) {
					parsedAnnotationObject.collection.type = "Not";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Gt")) {
					parsedAnnotationObject.collection.type = "Gt";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Ge")) {
					parsedAnnotationObject.collection.type = "Ge";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Lt")) {
					parsedAnnotationObject.collection.type = "Lt";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Le")) {
					parsedAnnotationObject.collection.type = "Le";
				} else if (annotationObjectToParse[0].hasOwnProperty("$And")) {
					parsedAnnotationObject.collection.type = "And";
				} else if (annotationObjectToParse[0].hasOwnProperty("$Apply")) {
					parsedAnnotationObject.collection.type = "Apply";
				} else if (typeof annotationObjectToParse[0] === "object") {
					parsedAnnotationObject.collection.type = "Record";
				} else {
					parsedAnnotationObject.collection.type = "String";
				}
			}
		} else if (typeof annotationObjectToParse === "object") {
			if (annotationObjectToParse.$If !== undefined) {
				parsedAnnotationObject.value = { type: "If", $If: annotationObjectToParse.$If as [Expression, Expression, Expression] };
			} else if (annotationObjectToParse.$And !== undefined) {
				parsedAnnotationObject.value = { type: "And", $And: annotationObjectToParse.$And as [Expression, Expression] };
			} else if (annotationObjectToParse.$Or !== undefined) {
				parsedAnnotationObject.value = { type: "Or", $Or: annotationObjectToParse.$Or as [Expression, Expression] };
			} else if (annotationObjectToParse.$Not !== undefined) {
				parsedAnnotationObject.value = { type: "Not", $Not: annotationObjectToParse.$Not as Expression };
			} else if (annotationObjectToParse.$Eq !== undefined) {
				parsedAnnotationObject.value = { type: "Eq", $Eq: annotationObjectToParse.$Eq as [Expression, Expression] };
			} else if (annotationObjectToParse.$Ne !== undefined) {
				parsedAnnotationObject.value = { type: "Ne", $Ne: annotationObjectToParse.$Ne as [Expression, Expression] };
			} else if (annotationObjectToParse.$Gt !== undefined) {
				parsedAnnotationObject.value = { type: "Gt", $Gt: annotationObjectToParse.$Gt as [Expression, Expression] };
			} else if (annotationObjectToParse.$Ge !== undefined) {
				parsedAnnotationObject.value = { type: "Ge", $Ge: annotationObjectToParse.$Ge as [Expression, Expression] };
			} else if (annotationObjectToParse.$Lt !== undefined) {
				parsedAnnotationObject.value = { type: "Lt", $Lt: annotationObjectToParse.$Lt as [Expression, Expression] };
			} else if (annotationObjectToParse.$Le !== undefined) {
				parsedAnnotationObject.value = { type: "Le", $Le: annotationObjectToParse.$Le as [Expression, Expression] };
			} else if (annotationObjectToParse.$Apply !== undefined) {
				parsedAnnotationObject.value = {
					type: "Apply",
					$Apply: annotationObjectToParse.$Apply,
					$Function: annotationObjectToParse.$Function
				} as ApplyExpression;
			} else if (annotationObjectToParse.$Path !== undefined) {
				parsedAnnotationObject.value = { type: "Path", Path: annotationObjectToParse.$Path };
			} else if (annotationObjectToParse.$AnnotationPath !== undefined) {
				parsedAnnotationObject.value = {
					type: "AnnotationPath",
					AnnotationPath: annotationObjectToParse.$AnnotationPath
				};
			} else if (annotationObjectToParse.$Decimal !== undefined) {
				parsedAnnotationObject.value = { type: "Decimal", Decimal: parseFloat(annotationObjectToParse.$Decimal) };
			} else if (annotationObjectToParse.$EnumMember !== undefined) {
				parsedAnnotationObject.value = {
					type: "EnumMember",
					EnumMember: annotationObjectToParse.$EnumMember
				};
			} else {
				const record: AnnotationRecord = {
					propertyValues: []
				};
				if (annotationObjectToParse.$Type) {
					const typeValue = annotationObjectToParse.$Type;
					record.type = `${typeValue}`;
				}
				const propertyValues: { name: string; value: Expression }[] = [];
				for (const propertyKey in annotationObjectToParse) {
					if (propertyKey !== "$Type" && !propertyKey.startsWith("@")) {
						propertyValues.push(
							parsePropertyValue(
								annotationObjectToParse[propertyKey],
								propertyKey,
								currentAnnotationTarget,
								annotationLists,
								oCapabilities
							)
						);
					} else if (propertyKey.startsWith("@")) {
						// Annotation of record
						createAnnotationLists(
							{ [propertyKey]: annotationObjectToParse[propertyKey] },
							currentAnnotationTarget,
							annotationLists,
							oCapabilities
						);
					}
				}
				record.propertyValues = propertyValues;
				parsedAnnotationObject.record = record;
			}
		}
		currentOutAnnotationObject.annotations.push(parsedAnnotationObject);
	}
}

function prepareProperty(
	propertyDefinition: MetaModelProperty,
	entityTypeObject: RawEntityType | RawComplexType,
	propertyName: string
): RawProperty {
	return {
		_type: "Property",
		name: propertyName,
		fullyQualifiedName: `${entityTypeObject.fullyQualifiedName}/${propertyName}`,
		type: propertyDefinition.$Type,
		maxLength: propertyDefinition.$MaxLength,
		precision: propertyDefinition.$Precision,
		scale: propertyDefinition.$Scale,
		nullable: propertyDefinition.$Nullable ?? true
	};
}

function prepareNavigationProperty(
	navPropertyDefinition: MetaModelNavigationProperty,
	entityTypeObject: RawEntityType | RawComplexType,
	navPropertyName: string
): RawV4NavigationProperty {
	let referentialConstraint: ReferentialConstraint[] = [];
	if (navPropertyDefinition.$ReferentialConstraint) {
		referentialConstraint = Object.keys(navPropertyDefinition.$ReferentialConstraint).map((sourcePropertyName) => {
			return {
				sourceTypeName: entityTypeObject.name,
				sourceProperty: sourcePropertyName,
				targetTypeName: navPropertyDefinition.$Type,
				targetProperty: navPropertyDefinition.$ReferentialConstraint[sourcePropertyName]
			};
		});
	}
	const navigationProperty: RawV4NavigationProperty = {
		_type: "NavigationProperty",
		name: navPropertyName,
		fullyQualifiedName: `${entityTypeObject.fullyQualifiedName}/${navPropertyName}`,
		partner: navPropertyDefinition.$Partner,
		isCollection: navPropertyDefinition.$isCollection ? navPropertyDefinition.$isCollection : false,
		containsTarget: !!navPropertyDefinition.$ContainsTarget,
		targetTypeName: navPropertyDefinition.$Type,
		referentialConstraint
	};

	return navigationProperty;
}

function prepareNavigationPropertyBinding(
	navigationPropertyBinding: Record<string, string> | undefined,
	entityContainerName: string
): RawNavigationPropertyBinding {
	if (navigationPropertyBinding) {
		return Object.fromEntries(
			Object.entries(navigationPropertyBinding).map(([path, target]) => [path, `${entityContainerName}/${target}`])
		);
	}

	return {};
}

function prepareEntitySet(entitySetDefinition: MetaModelEntitySet, entitySetName: string, entityContainerName: string): RawEntitySet {
	return {
		_type: "EntitySet",
		name: entitySetName,
		navigationPropertyBinding: prepareNavigationPropertyBinding(entitySetDefinition.$NavigationPropertyBinding, entityContainerName),
		entityTypeName: entitySetDefinition.$Type,
		fullyQualifiedName: `${entityContainerName}/${entitySetName}`
	};
}

function prepareSingleton(singletonDefinition: MetaModelSingleton, singletonName: string, entityContainerName: string): RawSingleton {
	return {
		_type: "Singleton",
		name: singletonName,
		navigationPropertyBinding: prepareNavigationPropertyBinding(singletonDefinition.$NavigationPropertyBinding, entityContainerName),
		entityTypeName: singletonDefinition.$Type,
		fullyQualifiedName: `${entityContainerName}/${singletonName}`,
		nullable: true
	};
}

function prepareActionImport(actionImport: MetaModelActionImport, actionImportName: string, entityContainerName: string): RawActionImport {
	return {
		_type: "ActionImport",
		name: actionImportName,
		fullyQualifiedName: `${entityContainerName}/${actionImportName}`,
		actionName: actionImport.$Action
	};
}

function prepareTypeDefinition(typeDefinition: MetaModelTypeDefinition, typeName: string, namespacePrefix: string): RawTypeDefinition {
	const typeObject: RawTypeDefinition = {
		_type: "TypeDefinition",
		name: typeName.substring(namespacePrefix.length),
		fullyQualifiedName: typeName,
		underlyingType: typeDefinition.$UnderlyingType
	};
	return typeObject;
}

function prepareComplexType(complexTypeDefinition: MetaModelComplexType, complexTypeName: string, namespacePrefix: string): RawComplexType {
	const complexTypeObject: RawComplexType = {
		_type: "ComplexType",
		name: complexTypeName.substring(namespacePrefix.length),
		fullyQualifiedName: complexTypeName,
		properties: [],
		navigationProperties: []
	};

	const complexTypeProperties = Object.keys(complexTypeDefinition)
		.filter((propertyNameOrNot) => {
			if (propertyNameOrNot != "$Key" && propertyNameOrNot != "$kind") {
				return complexTypeDefinition[propertyNameOrNot].$kind === "Property";
			}
		})
		.sort((a, b) => (a > b ? 1 : -1))
		.map((propertyName) => {
			return prepareProperty(complexTypeDefinition[propertyName] as MetaModelProperty, complexTypeObject, propertyName);
		});

	complexTypeObject.properties = complexTypeProperties;
	const complexTypeNavigationProperties = Object.keys(complexTypeDefinition)
		.filter((propertyNameOrNot) => {
			if (propertyNameOrNot != "$Key" && propertyNameOrNot != "$kind") {
				return complexTypeDefinition[propertyNameOrNot].$kind === "NavigationProperty";
			}
		})
		.sort((a, b) => (a > b ? 1 : -1))
		.map((navPropertyName) => {
			return prepareNavigationProperty(
				complexTypeDefinition[navPropertyName] as MetaModelNavigationProperty,
				complexTypeObject,
				navPropertyName
			);
		});
	complexTypeObject.navigationProperties = complexTypeNavigationProperties;
	return complexTypeObject;
}

function prepareEntityKeys(entityTypeDefinition: MetaModelEntityType, oMetaModelData: MetaModelContent): string[] {
	if (!entityTypeDefinition.$Key && entityTypeDefinition.$BaseType) {
		return prepareEntityKeys(oMetaModelData[entityTypeDefinition.$BaseType] as MetaModelEntityType, oMetaModelData);
	}
	return entityTypeDefinition.$Key ?? []; //handling of entity types without key as well as basetype
}

function prepareEntityType(
	entityTypeDefinition: MetaModelEntityType,
	entityTypeName: string,
	namespacePrefix: string,
	metaModelData: MetaModelContent,
	ignoreDatafieldDefault: boolean
): RawEntityType {
	const entityType: RawEntityType = {
		_type: "EntityType",
		name: entityTypeName.substring(namespacePrefix.length),
		fullyQualifiedName: entityTypeName,
		keys: [],
		entityProperties: [],
		navigationProperties: [],
		actions: {}
	};

	for (const key in entityTypeDefinition) {
		const value = entityTypeDefinition[key];

		switch (value.$kind) {
			case "Property":
				const property = prepareProperty(value, entityType, key);
				entityType.entityProperties.push(property);
				break;
			case "NavigationProperty":
				const navigationProperty = prepareNavigationProperty(value, entityType, key);
				entityType.navigationProperties.push(navigationProperty);
				break;
		}
	}

	entityType.keys = prepareEntityKeys(entityTypeDefinition, metaModelData)
		.map((entityKey) => entityType.entityProperties.find((property) => property.name === entityKey))
		.filter((property) => property !== undefined) as RawEntityType["keys"];

	const entityTypeAnnotations = metaModelData.$Annotations[entityType.fullyQualifiedName] as MetaModelEntityTypeAnnotations | undefined;
	// Check if there are filter facets defined for the entityType and if yes, check if all of them have an ID
	// The ID is optional, but it is internally taken for grouping filter fields and if it's not present
	// a fallback ID needs to be generated here.
	const filterFacets = entityTypeAnnotations?.[`@${UIAnnotationTerms.FilterFacets}`] as MetaModelType<FilterFacets>;
	filterFacets?.forEach((filterFacetAnnotation: MetaModelType<ReferenceFacet>) => {
		filterFacetAnnotation.ID = createReferenceFacetId(filterFacetAnnotation);
	});

	// Check if entityType has not mandatory HeaderInfo
	if (
		!!entityType?.keys.length &&
		metaModelData.$Annotations[entityType.fullyQualifiedName] &&
		!entityTypeAnnotations?.[`@${UIAnnotationTerms.HeaderInfo}`]
	) {
		const headerInfoAnnotation: MetaModelType<HeaderInfo> = {
			$Type: `${UIAnnotationTypes.HeaderInfoType}`,
			TypeName: `${entityType.name}`,
			TypeNamePlural: "",
			Title: {
				$Type: `${UIAnnotationTypes.DataField}`,
				Value: {
					$Path: `${entityType.keys[0].name}`
				}
			} as MetaModelType<DataField>,
			term: UIAnnotationTerms.HeaderInfo
		};
		// Add the missing HeaderInfo
		(metaModelData.$Annotations[entityType.fullyQualifiedName] as MetaModelEntityTypeAnnotations)[`@${UIAnnotationTerms.HeaderInfo}`] =
			headerInfoAnnotation;
	}

	for (const entityProperty of entityType.entityProperties) {
		if (!metaModelData.$Annotations[entityProperty.fullyQualifiedName]) {
			metaModelData.$Annotations[entityProperty.fullyQualifiedName] = {};
		}
		if (
			!ignoreDatafieldDefault &&
			!(metaModelData.$Annotations[entityProperty.fullyQualifiedName] as MetaModelPropertyAnnotations)[
				`@${UIAnnotationTerms.DataFieldDefault}`
			]
		) {
			(metaModelData.$Annotations[entityProperty.fullyQualifiedName] as MetaModelPropertyAnnotations)[
				`@${UIAnnotationTerms.DataFieldDefault}`
			] = {
				$Type: UIAnnotationTypes.DataField,
				Value: { $Path: entityProperty.name }
			};
		}
	}

	return entityType;
}
function prepareAction(actionRawData: MetaModelAction, actionName: string, namespacePrefix: string): RawAction {
	let overloadParameters: MetaModelAction["$Parameter"];
	if (actionRawData.$kind === "Function") {
		// function - overload includes all parameters (bound entity type _and_ other parameters)
		overloadParameters = actionRawData.$Parameter ?? [];
	} else {
		// action - overload is the first parameter or the empty unbound overload in case of an unbound action
		overloadParameters = actionRawData.$IsBound ? [actionRawData.$Parameter[0]] : [];
	}

	const overload = overloadParameters
		.map((parameter) => (parameter.$isCollection ? `Collection(${parameter.$Type})` : parameter.$Type))
		.join(",");

	const fullyQualifiedName = `${actionName}(${overload})`;

	const parameters = actionRawData.$Parameter ?? [];
	return {
		_type: "Action",
		name: actionName.substring(namespacePrefix.length),
		fullyQualifiedName,
		isBound: actionRawData.$IsBound ?? false,
		isFunction: actionRawData.$kind === "Function",
		sourceType: overloadParameters[0]?.$Type ?? "",
		returnType: actionRawData.$ReturnType?.$Type ?? "",
		returnCollection: actionRawData.$ReturnType?.$isCollection ?? false,
		parameters: parameters.map((param) => ({
			_type: "ActionParameter",
			fullyQualifiedName: `${fullyQualifiedName}/${param.$Name}`,
			isCollection: param.$isCollection ?? false,
			name: param.$Name,
			type: param.$Type,
			nullable: param.$Nullable ?? false,
			maxLength: param.$MaxLength,
			precision: param.$Precision,
			scale: param.$Scale
		}))
	};
}

function parseEntityContainer(
	namespacePrefix: string,
	entityContainerName: string,
	entityContainerMetadata: MetaModelEntityContainer,
	schema: RawSchema
): void {
	schema.entityContainer = {
		_type: "EntityContainer",
		name: entityContainerName.substring(namespacePrefix.length),
		fullyQualifiedName: entityContainerName
	};

	for (const elementName in entityContainerMetadata) {
		const elementValue = entityContainerMetadata[elementName];
		switch (elementValue.$kind) {
			case "EntitySet":
				schema.entitySets.push(prepareEntitySet(elementValue, elementName, entityContainerName));
				break;

			case "Singleton":
				schema.singletons.push(prepareSingleton(elementValue, elementName, entityContainerName));
				break;

			case "ActionImport":
				schema.actionImports.push(prepareActionImport(elementValue, elementName, entityContainerName));
				break;
		}
	}
}

function parseAnnotations(annotations: Record<string, MetaModelAnnotations>, capabilities: EnvironmentCapabilities): AnnotationList[] {
	const annotationLists: Record<string, AnnotationList> = {};
	for (const target in annotations) {
		createAnnotationLists(annotations[target], target, annotationLists, capabilities);
	}
	return Object.values(annotationLists);
}

type MetaModelSchema = {
	$kind: "Schema";
};
type MetaModelEntitySet = {
	$kind: "EntitySet";
	$Type: string;
	$NavigationPropertyBinding?: Record<string, string>;
};

type MetaModelTypes<T extends Record<string, unknown>> = {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	[key in keyof T]: MetaModelType<T[key]>;
};
export type MetaModelEntityTypeAnnotations = Rename<"@Org.OData.Capabilities.V1.", MetaModelTypes<EntityTypeAnnotations_Capabilities>> &
	Rename<"@com.sap.vocabularies.UI.v1.", MetaModelTypes<EntityTypeAnnotations_UI>>;

export type MetaModelEntitySetAnnotations = Rename<"@Org.OData.Capabilities.V1.", MetaModelTypes<EntitySetAnnotations_Capabilities>> &
	Rename<"@com.sap.vocabularies.UI.v1.", MetaModelTypes<EntitySetAnnotations_UI>>;

export type MetaModelPropertyAnnotations = Rename<"@com.sap.vocabularies.Common.v1.", MetaModelTypes<PropertyAnnotations_Common>> &
	Rename<"@com.sap.vocabularies.UI.v1.", MetaModelTypes<PropertyAnnotations_UI>> &
	Rename<"@Org.OData.Core.V1.", MetaModelTypes<PropertyAnnotations_Core>> &
	Rename<"@Org.OData.Capabilities.V1.", MetaModelTypes<PropertyAnnotations_Capabilities>> &
	Rename<"@Org.OData.Measures.V1.", MetaModelTypes<PropertyAnnotations_Measures>> &
	Rename<"@com.sap.vocabularies.Analytics.v1.", MetaModelTypes<PropertyAnnotations_Analytics>> &
	Rename<"@com.sap.vocabularies.Communication.v1.", MetaModelTypes<PropertyAnnotations_Communication>> &
	Rename<"@com.sap.vocabularies.PersonalData.v1.", MetaModelTypes<PropertyAnnotations_PersonalData>> &
	Rename<"@com.sap.vocabularies.Session.v1.", MetaModelTypes<PropertyAnnotations_Session>> & {
		"@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement": MetaModelEnum<TextArrangement>;
	};
type MetaModelActionImport = {
	$kind: "ActionImport";
	$Action: string;
};
type MetaModelSingleton = {
	$kind: "Singleton";
	$Type: string;
	$NavigationPropertyBinding?: Record<string, string>;
};
type MetaModelEntityContainer = {
	$kind: "EntityContainer";
} & {
	[name: string]: MetaModelEntitySet | MetaModelSingleton | MetaModelActionImport;
};
type MetaModelProperty = {
	$kind: "Property";
	$Type: string;
	$MaxLength?: number;
	$Precision?: number;
	$Scale?: number;
	$Nullable?: boolean;
};
type MetaModelNavigationProperty = {
	$kind: "NavigationProperty";
	$Type: string;
	$Partner?: string;
	$isCollection?: boolean;
	$ContainsTarget?: boolean;
	$ReferentialConstraint: Record<string, string>;
};
type MetaModelEntityType = {
	$kind: "EntityType";
	$BaseType?: string;
	$Key: string[];
} & {
	[name: string]: MetaModelProperty | MetaModelNavigationProperty;
};
type MetaModelComplexType = {
	$kind: "ComplexType";
} & {
	[name: string]: MetaModelProperty | MetaModelNavigationProperty;
};
type MetaModelTypeDefinition = {
	$kind: "TypeDefinition";
	$UnderlyingType: string;
};
type MetaModelObject =
	| MetaModelEntitySet
	| MetaModelSchema
	| MetaModelEntityContainer
	| MetaModelAction
	| MetaModelEntityType
	| MetaModelComplexType
	| MetaModelTypeDefinition;
type MetaModelAnnotations = MetaModelEntityTypeAnnotations | MetaModelPropertyAnnotations | MetaModelEntitySetAnnotations;

type MetaModelContent = {
	$Annotations: Record<string, MetaModelAnnotations>;
} & Record<string, MetaModelObject | MetaModelObject[]>;
function parseSchema(metaModelData: MetaModelContent, ignoreDatafieldDefault: boolean): RawSchema {
	// assuming there is only one schema/namespace
	const namespacePrefix =
		Object.keys(metaModelData).find((key) => {
			const metamodelObject = metaModelData[key];
			return !Array.isArray(metamodelObject) && metamodelObject.$kind === "Schema";
		}) ?? "";

	const schema: RawSchema = {
		namespace: namespacePrefix.slice(0, -1),
		entityContainer: { _type: "EntityContainer", name: "", fullyQualifiedName: "" },
		entitySets: [],
		entityTypes: [],
		complexTypes: [],
		typeDefinitions: [],
		singletons: [],
		associations: [],
		associationSets: [],
		actions: [],
		actionImports: [],
		annotations: {}
	};

	const parseMetaModelElement = (name: string, value: MetaModelObject): void => {
		switch (value.$kind) {
			case "EntityContainer":
				parseEntityContainer(namespacePrefix, name, value, schema);
				break;

			case "Action":
			case "Function":
				schema.actions.push(prepareAction(value, name, namespacePrefix));
				break;

			case "EntityType":
				schema.entityTypes.push(prepareEntityType(value, name, namespacePrefix, metaModelData, ignoreDatafieldDefault));
				break;

			case "ComplexType":
				schema.complexTypes.push(prepareComplexType(value, name, namespacePrefix));
				break;

			case "TypeDefinition":
				schema.typeDefinitions.push(prepareTypeDefinition(value, name, namespacePrefix));
				break;
			case "EntitySet":
			case "Schema":
				break;
		}
	};

	for (const elementName in metaModelData) {
		const elementValue = metaModelData[elementName];

		if (Array.isArray(elementValue)) {
			// value can be an array in case of actions or functions
			for (const subElementValue of elementValue) {
				parseMetaModelElement(elementName, subElementValue);
			}
		} else {
			parseMetaModelElement(elementName, elementValue);
		}
	}

	return schema;
}

export function parseMetaModel(
	metaModel: ODataMetaModel,
	capabilities: EnvironmentCapabilities = DefaultEnvironmentCapabilities,
	ignoreDatafieldDefault = false
): RawMetadata {
	const result: Omit<RawMetadata, "schema"> = {
		identification: "metamodelResult",
		version: "4.0",
		references: []
	};

	// parse the schema when it is accessed for the first time
	AnnotationConverter.lazy(result as RawMetadata, "schema", () => {
		const metaModelData = metaModel.getObject("/$");
		const schema = parseSchema(metaModelData, ignoreDatafieldDefault);

		AnnotationConverter.lazy(schema.annotations, "metamodelResult", () => parseAnnotations(metaModelData.$Annotations, capabilities));

		return schema;
	});

	return result as RawMetadata;
}

const convertedMetaModelMap: Record<string, ConvertedMetadata> = {};
const metaModelIDMap: Record<string, String> = {};
const metaModelMap: WeakMap<String, ODataMetaModel> = new WeakMap();
const virtualPropertiesMap: Record<
	string,
	Record<string, (path: string, convertedTypes: ConvertedMetadata, relativePath?: string) => BindingToolkitExpression<unknown>>
> = {};

/**
 * Convert the ODataMetaModel into another format that allow for easy manipulation of the annotations.
 * @param oMetaModel The ODataMetaModel
 * @param oCapabilities The current capabilities
 * @returns An object containing object-like annotations
 */
export function convertTypes(oMetaModel: ODataMetaModel, oCapabilities?: EnvironmentCapabilities): ConvertedMetadata {
	const metaModelID = (oMetaModel as { id?: string }).id!;
	if (!convertedMetaModelMap.hasOwnProperty(metaModelID)) {
		const parsedOutput = parseMetaModel(oMetaModel, oCapabilities);
		try {
			convertedMetaModelMap[metaModelID] = AnnotationConverter.convert(parsedOutput);
			virtualPropertiesMap[metaModelID] = {
				criticality: getVirtualCriticalityExpression
			};
			const metaModelSymbol = new String(metaModelID);
			metaModelIDMap[metaModelID] = metaModelSymbol;
			metaModelMap.set(metaModelSymbol, oMetaModel);
		} catch (oError) {
			throw new Error(oError as string);
		}
	}
	return convertedMetaModelMap[metaModelID];
}
export function getMetaModelById(id: string): ODataMetaModel | undefined {
	const symbol = metaModelIDMap[id];
	return metaModelMap.get(symbol);
}
export function getConvertedTypes(oContext: Context): ConvertedMetadata {
	const oMetaModel = oContext.getModel() as unknown as ODataMetaModel;
	if (!oMetaModel.isA("sap.ui.model.odata.v4.ODataMetaModel")) {
		throw new Error("This should only be called on a ODataMetaModel");
	}
	return convertTypes(oMetaModel);
}

export function deleteModelCacheData(oMetaModel: ODataMetaModel): void {
	if (oMetaModel) {
		delete convertedMetaModelMap[(oMetaModel as unknown as { id: string }).id];
	}
}

export function convertMetaModelContext(oMetaModelContext: Context, bIncludeVisitedObjects: true): undefined | ResolvedTarget;
export function convertMetaModelContext(oMetaModelContext: Context): undefined | ServiceObject | ActionParameter | RecordComplexType;
export function convertMetaModelContext(
	oMetaModelContext: Context,
	bIncludeVisitedObjects = false
): undefined | ServiceObject | ActionParameter | RecordComplexType | ResolvedTarget {
	const oConvertedMetadata = convertTypes(oMetaModelContext.getModel() as ODataMetaModel);
	const sPath = oMetaModelContext.getPath();

	const aPathSplit = sPath.split("/");
	let firstPart = aPathSplit[1];
	let beginIndex = 2;
	if (oConvertedMetadata.entityContainer.fullyQualifiedName === firstPart) {
		firstPart = aPathSplit[2];
		beginIndex++;
	}
	let targetEntitySet: EntitySet | Singleton = oConvertedMetadata.entitySets.find(
		(entitySet) => entitySet.name === firstPart
	) as EntitySet;
	if (!targetEntitySet) {
		targetEntitySet = oConvertedMetadata.singletons.find((singleton) => singleton.name === firstPart) as Singleton;
	}
	let relativePath = aPathSplit.slice(beginIndex).join("/");

	const localObjects: ServiceObject[] = [targetEntitySet];
	while (relativePath && relativePath.length > 0 && relativePath.startsWith("$NavigationPropertyBinding")) {
		let relativeSplit = relativePath.split("/");
		let idx = 0;
		let currentEntitySet, sNavPropToCheck;

		relativeSplit = relativeSplit.slice(1); // Removing "$NavigationPropertyBinding"
		while (!currentEntitySet && relativeSplit.length > idx) {
			if (relativeSplit[idx] !== "$NavigationPropertyBinding") {
				// Finding the correct entitySet for the navigaiton property binding example: "Set/_SalesOrder"
				sNavPropToCheck = relativeSplit
					.slice(0, idx + 1)
					.join("/")
					.replace("/$NavigationPropertyBinding", "");
				currentEntitySet = targetEntitySet && targetEntitySet.navigationPropertyBinding[sNavPropToCheck];
			}
			idx++;
		}
		if (!currentEntitySet) {
			// Fall back to Single nav prop if entitySet is not found.
			sNavPropToCheck = relativeSplit[0];
		}
		const aNavProps = sNavPropToCheck?.split("/") || [];
		let targetEntityType = targetEntitySet && targetEntitySet.entityType;
		for (const sNavProp of aNavProps) {
			// Pushing all nav props to the visited objects. example: "Set", "_SalesOrder" for "Set/_SalesOrder"(in NavigationPropertyBinding)
			const targetNavProp = targetEntityType && targetEntityType.navigationProperties.find((navProp) => navProp.name === sNavProp);
			if (targetNavProp) {
				localObjects.push(targetNavProp);
				targetEntityType = targetNavProp.targetType;
			} else {
				break;
			}
		}
		targetEntitySet =
			(targetEntitySet && currentEntitySet) || (targetEntitySet && targetEntitySet.navigationPropertyBinding[relativeSplit[0]]);
		if (targetEntitySet) {
			// Pushing the target entitySet to visited objects
			localObjects.push(targetEntitySet);
		}
		// Re-calculating the relative path
		// As each navigation name is enclosed between '$NavigationPropertyBinding' and '$' (to be able to access the entityset easily in the metamodel)
		// we need to remove the closing '$' to be able to switch to the next navigation
		relativeSplit = relativeSplit.slice(aNavProps.length || 1);
		if (relativeSplit.length && relativeSplit[0] === "$") {
			relativeSplit.shift();
		}
		relativePath = relativeSplit.join("/");
	}
	if (relativePath.startsWith("$Type")) {
		// As $Type@ is allowed as well
		if (relativePath.startsWith("$Type@")) {
			relativePath = relativePath.replace("$Type", "");
		} else {
			// We're anyway going to look on the entityType...
			relativePath = aPathSplit.slice(3).join("/");
		}
	}
	if (targetEntitySet && relativePath.length) {
		const oTarget = targetEntitySet.entityType.resolvePath(relativePath, bIncludeVisitedObjects);
		if (oTarget) {
			if (bIncludeVisitedObjects) {
				oTarget.visitedObjects = localObjects.concat(oTarget.visitedObjects);
			}
		} else if (targetEntitySet.entityType && targetEntitySet.entityType.actions) {
			// if target is an action or an action parameter
			const actions = targetEntitySet.entityType && targetEntitySet.entityType.actions;
			const relativeSplit = relativePath.split("/");
			if (actions[relativeSplit[0]]) {
				const action = actions[relativeSplit[0]];
				if (relativeSplit[1] && action.parameters) {
					const parameterName = relativeSplit[1];
					return action.parameters.find((parameter) => {
						return parameter.fullyQualifiedName.endsWith(`/${parameterName}`);
					});
				} else if (relativePath.length === 1) {
					return action;
				}
			}
		}
		return oTarget;
	} else {
		if (bIncludeVisitedObjects) {
			return {
				target: targetEntitySet,
				visitedObjects: localObjects
			};
		}
		return targetEntitySet;
	}
}

export type ResolvedTarget<T extends ServiceObjectAndAnnotation = ServiceObject> = {
	target?: T extends ServiceObject ? T : AnnotationTerm<T>;
	visitedObjects: ServiceObjectAndAnnotation[];
};

export function getInvolvedDataModelObjects<T>(oMetaModelContext: Context, oEntitySetMetaModelContext?: Context): DataModelObjectPath<T> {
	const oConvertedMetadata = convertTypes(oMetaModelContext.getModel() as ODataMetaModel);
	const metaModelContext = convertMetaModelContext(oMetaModelContext, true) as ResolvedTarget;
	let targetEntitySetLocation;
	if (oEntitySetMetaModelContext && oEntitySetMetaModelContext.getPath() !== "/") {
		targetEntitySetLocation = getInvolvedDataModelObjects(oEntitySetMetaModelContext);
	}
	return getInvolvedDataModelObjectFromPath<T>(metaModelContext, oConvertedMetadata, targetEntitySetLocation);
}

export function getInvolvedDataModelObjectFromPath<T>(
	metaModelContext: ResolvedTarget,
	convertedTypes: ConvertedMetadata,
	targetEntitySetLocation?: DataModelObjectContext,
	onlyServiceObjects = false
): DataModelObjectPath<T> {
	const dataModelObjects = metaModelContext.visitedObjects.filter(
		(visitedObject) => isServiceObject(visitedObject) && !isEntityType(visitedObject) && !isEntityContainer(visitedObject)
	);
	if (
		isServiceObject(metaModelContext.target) &&
		!isEntityType(metaModelContext.target) &&
		dataModelObjects[dataModelObjects.length - 1] !== metaModelContext.target &&
		!onlyServiceObjects
	) {
		dataModelObjects.push(metaModelContext.target);
	}

	const navigationProperties: NavigationProperty[] = [];
	const rootEntitySet: EntitySet = dataModelObjects[0] as EntitySet;

	let currentEntitySet: EntitySet | Singleton | undefined = rootEntitySet;
	let currentEntityType: EntityType = rootEntitySet.entityType;
	let currentObject: ServiceObjectAndAnnotation | undefined;
	let navigatedPath = [];

	for (let i = 1; i < dataModelObjects.length; i++) {
		currentObject = dataModelObjects[i];

		if (isNavigationProperty(currentObject)) {
			navigatedPath.push(currentObject.name);
			navigationProperties.push(currentObject);
			currentEntityType = currentObject.targetType;
			const boundEntitySet: EntitySet | Singleton | undefined = currentEntitySet?.navigationPropertyBinding[navigatedPath.join("/")];
			if (boundEntitySet !== undefined) {
				currentEntitySet = boundEntitySet;
				navigatedPath = [];
			}
		}
		if (isEntitySet(currentObject) || isSingleton(currentObject)) {
			currentEntitySet = currentObject;
			currentEntityType = currentEntitySet.entityType;
		}
	}

	if (navigatedPath.length > 0) {
		// Path without NavigationPropertyBinding --> no target entity set
		currentEntitySet = undefined;
	}

	if (targetEntitySetLocation && targetEntitySetLocation.startingEntitySet !== rootEntitySet) {
		// In case the entityset is not starting from the same location it may mean that we are doing too much work earlier for some reason
		// As such we need to redefine the context source for the targetEntitySetLocation
		const startingIndex = dataModelObjects.indexOf(targetEntitySetLocation.startingEntitySet);
		if (startingIndex !== -1) {
			// If it's not found I don't know what we can do (probably nothing)
			const requiredDataModelObjects = dataModelObjects.slice(0, startingIndex);
			targetEntitySetLocation.startingEntitySet = rootEntitySet;
			targetEntitySetLocation.navigationProperties = requiredDataModelObjects
				.filter(isNavigationProperty)
				.concat(targetEntitySetLocation.navigationProperties as NavigationProperty[]);
		}
	}
	const outDataModelPath = {
		startingEntitySet: rootEntitySet,
		targetEntitySet: currentEntitySet,
		targetEntityType: currentEntityType,
		targetObject: metaModelContext.target,
		navigationProperties,
		contextLocation: targetEntitySetLocation,
		convertedTypes: convertedTypes
	};
	if (!isServiceObject(outDataModelPath.targetObject) && onlyServiceObjects) {
		outDataModelPath.targetObject = isServiceObject(currentObject) ? currentObject : undefined;
	}
	if (!outDataModelPath.contextLocation) {
		outDataModelPath.contextLocation = outDataModelPath;
	}
	return outDataModelPath as DataModelObjectPath<T>;
}

/**
 * This function fetches the technical and semantic keys of entity sets.
 * @param context
 * @returns The object containing technical and semantic keys of the entity.
 */
export function getInvolvedDataModelObjectEntityKeys(context: ODataV4Context): {
	technicalKeys: string[];
	semanticKeys: string[];
} {
	const metaModel = context?.getModel()?.getMetaModel();
	if (metaModel) {
		const metaPath = metaModel.getMetaPath(context?.getPath());
		const dataModel = getInvolvedDataModelObjects(metaModel.getMetaContext(metaPath));
		const rootSemanticKeys = dataModel.targetEntityType.annotations.Common?.SemanticKey;
		let semanticKeys: string[] = [];
		if (rootSemanticKeys) {
			semanticKeys = rootSemanticKeys.map((key) => {
				return key.value;
			});
		}
		const rootTechnicalKeys = dataModel.targetEntityType.keys;
		let technicalKeys: string[] = [];
		if (rootTechnicalKeys) {
			technicalKeys = rootTechnicalKeys.map((key) => {
				return key.name;
			});
		}
		return {
			semanticKeys: semanticKeys,
			technicalKeys: technicalKeys
		};
	}
	return { technicalKeys: [], semanticKeys: [] };
}

export function extractModelAndPath<T extends string | undefined>(metaPath: T): { id: string | undefined; path: T } {
	if (metaPath?.includes(">")) {
		const [modelId, ...path] = metaPath.split(">");
		const targetPath = path.join(">");
		return { id: modelId, path: targetPath as T };
	} else {
		return { id: undefined, path: metaPath };
	}
}

/**
 * Fetches the DataModel Object Path for a given target path.
 * @param targetPath
 * @param metaModel
 * @returns DataModel Object Path for target path
 */
export function getInvolvedDataModelObjectsForTargetPath<T>(
	targetPath: string,
	metaModel?: ODataMetaModel
): DataModelObjectPath<T> | undefined {
	const metaPath = metaModel?.getMetaPath(targetPath);
	const metaContext = metaPath ? metaModel?.getContext(metaPath) : undefined;
	return metaContext && getInvolvedDataModelObjects(metaContext);
}

/**
 * Gets the binding expression of a  virtual path.
 * @param path The virtual path
 * @param convertedTypes The converted metadata
 * @returns DataModel Object Path for target path
 */
export function getVirtualBindingExpression(path: string, convertedTypes: ConvertedMetadata): BindingToolkitExpression<unknown> {
	const virtualKey = "@$ui5.fe.virtual.";
	if (path.includes(virtualKey)) {
		const id = Object.keys(convertedMetaModelMap).find((id) => convertedMetaModelMap[id] === convertedTypes);
		if (id && virtualPropertiesMap[id]) {
			const relativePath = path.substring(0, path.indexOf(convertedTypes.namespace));
			const pathInfos = path.split(virtualKey);
			if (pathInfos.length === 2) {
				const method = pathInfos[1];
				const virtualProperty = pathInfos[0].replace(relativePath, "");
				if (virtualPropertiesMap[id][method]) {
					return virtualPropertiesMap[id][method](virtualProperty, convertedTypes, relativePath);
				}
			}
		}
		return constant(undefined);
	}
	return constant(undefined);
}

/**
 * Gets the binding expression of a criticality.
 * @param path The path pointing to a DataField or DataPoint
 * @param convertedTypes The converted metadata
 * @param relativePath The relative path of the binding expression
 * @returns The binding expression of the criticality
 */
function getVirtualCriticalityExpression(
	path: string,
	convertedTypes: ConvertedMetadata,
	relativePath?: string
): BindingToolkitExpression<unknown> {
	const criticalityProperty = convertedTypes.resolvePath<DataPointType | DataFieldAbstractTypes>(path)?.target?.Criticality;
	const criticalityExpression = criticalityProperty
		? getExpressionFromAnnotation(
				criticalityProperty as unknown as PropertyAnnotationValue<PrimitiveType>,
				[],
				undefined,
				(bindingPath: string) => {
					return relativePath ? `${relativePath}${bindingPath}` : bindingPath;
				}
		  )
		: undefined;
	if (!criticalityExpression) {
		return constant(undefined);
	}
	return formatResult([criticalityExpression], "sap.fe.core.formatters.CriticalityFormatter#getCriticality");
}

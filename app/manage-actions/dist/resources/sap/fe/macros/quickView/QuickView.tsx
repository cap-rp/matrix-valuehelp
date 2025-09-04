import type { AnnotationTerm, NavigationProperty, Property } from "@sap-ux/vocabularies-types";
import type * as Edm from "@sap-ux/vocabularies-types/Edm";
import type { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { compileExpression, pathInModel, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import { getContextRelativeTargetObjectPath, getRelativePaths, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	getDynamicPathFromSemanticObject,
	getPropertyWithSemanticObject,
	getSemanticObjectMappings,
	getSemanticObjectUnavailableActions,
	getSemanticObjectsAndQualifierMap
} from "sap/fe/core/templating/SemanticObjectHelper";
import { isUsedInNavigationWithQuickViewFacets } from "sap/fe/macros/field/FieldTemplating";
import type {
	LinkDelegatePayload,
	RegisteredSemanticObjectMapping,
	RegisteredSemanticObjectUnavailableAction
} from "sap/fe/macros/quickView/QuickViewDelegate";
import CustomData from "sap/ui/core/CustomData";
import MdcLink from "sap/ui/mdc/Link";

export default class QuickView {
	public metaPath!: string;

	public contextPath!: string;

	/**
	 * Custom semantic object
	 */
	public semanticObject?: string;

	public valueDataModelPath!: DataModelObjectPath<Property>;

	private payload!: LinkDelegatePayload;

	private qualifierMap!: Record<string, CompiledBindingToolkitExpression>;

	constructor(valueDataModelPath: DataModelObjectPath<Property>, metaPath: string, contextPath: string, semanticObject?: string) {
		this.valueDataModelPath = valueDataModelPath;
		this.metaPath = metaPath;
		this.contextPath = contextPath;
		this.semanticObject = semanticObject;
		this.computePropertiesAndPayload();
	}

	/**
	 * Get the relative path to the entity which quick view Facets we want to display.
	 * @param propertyDataModelPath
	 * @returns A path if it exists.
	 */
	static getRelativePathToQuickViewEntity(propertyDataModelPath: DataModelObjectPath<Property>): string | undefined {
		let relativePathToQuickViewEntity: string | undefined;
		const quickViewNavProp = this.getNavPropToQuickViewEntity(propertyDataModelPath);
		if (quickViewNavProp) {
			relativePathToQuickViewEntity = propertyDataModelPath.navigationProperties.reduce((relativPath: string, navProp) => {
				if (
					navProp.name !== quickViewNavProp.name &&
					!propertyDataModelPath.contextLocation?.navigationProperties.find(
						(contextNavProp) => contextNavProp.name === navProp.name
					)
				) {
					// we keep only navProperties that are part of the relativePath and not the one for quickViewNavProp
					return `${relativPath}${navProp.name}/`;
				}
				return relativPath;
			}, "");
			relativePathToQuickViewEntity = `${relativePathToQuickViewEntity}${quickViewNavProp.name}`;
		}
		return relativePathToQuickViewEntity;
	}

	/**
	 * Get the semanticObjectMappings from metadata in the payload expected structure.
	 * @param propertyWithSemanticObject
	 * @param qualifierMap
	 * @returns A payload structure for semanticObjectMappings
	 */
	static getSemanticObjectMappingsForPayload(
		propertyWithSemanticObject: Property | NavigationProperty | undefined,
		qualifierMap: Record<string, CompiledBindingToolkitExpression>
	): RegisteredSemanticObjectMapping[] {
		const semanticObjectMappings: RegisteredSemanticObjectMapping[] = [];
		if (propertyWithSemanticObject !== undefined) {
			for (const semanticObjectMapping of getSemanticObjectMappings(propertyWithSemanticObject)) {
				const correspondingSemanticObject = qualifierMap[semanticObjectMapping.qualifier || ""];
				if (correspondingSemanticObject) {
					semanticObjectMappings.push({
						semanticObject: correspondingSemanticObject,
						items: semanticObjectMapping.map((semanticObjectMappingType) => {
							switch (semanticObjectMappingType.$Type) {
								case CommonAnnotationTypes.SemanticObjectMappingConstant:
									throw new Error("Using SemanticObjectMappingConstant is not supported.");
								case CommonAnnotationTypes.SemanticObjectMappingType:
								default:
									return {
										key: semanticObjectMappingType.LocalProperty.value,
										value: semanticObjectMappingType.SemanticObjectProperty.valueOf()
									};
							}
						})
					});
				}
			}
		}
		return semanticObjectMappings;
	}

	/**
	 * Get the semanticObjectUnavailableActions from metadata in the payload expected structure.
	 * @param propertyWithSemanticObject
	 * @param qualifierMap
	 * @returns A payload structure for semanticObjectUnavailableActions
	 */
	static getSemanticObjectUnavailableActionsForPayload(
		propertyWithSemanticObject: Property | NavigationProperty | undefined,
		qualifierMap: Record<string, CompiledBindingToolkitExpression>
	): RegisteredSemanticObjectUnavailableAction[] {
		const semanticObjectUnavailableActions: RegisteredSemanticObjectUnavailableAction[] = [];
		if (propertyWithSemanticObject !== undefined) {
			for (const unavailableActionAnnotation of getSemanticObjectUnavailableActions(propertyWithSemanticObject) as ({
				term: CommonAnnotationTerms.SemanticObjectUnavailableActions;
			} & AnnotationTerm<Edm.String[]>)[]) {
				const correspondingSemanticObject = qualifierMap[unavailableActionAnnotation.qualifier || ""];
				if (correspondingSemanticObject) {
					semanticObjectUnavailableActions.push({
						semanticObject: correspondingSemanticObject,
						actions: unavailableActionAnnotation.map((unavailableAction) => unavailableAction as string)
					});
				}
			}
		}
		return semanticObjectUnavailableActions;
	}

	/**
	 * Add customObject(s) to the semanticObject list for the payload if it exists.
	 * @param semanticObjectsList List of actual semantic objects
	 * @param customSemanticObject Semantic object defined in the property 'semanticObject' of the macro field block
	 * @param qualifierMap Map of semantic object qualifiers from annotations
	 */
	static addCustomSemanticObjectToSemanticObjectListForPayload(
		semanticObjectsList: string[],
		customSemanticObject: string | undefined,
		qualifierMap: Record<string, CompiledBindingToolkitExpression>
	): void {
		if (customSemanticObject) {
			semanticObjectsList.splice(0, semanticObjectsList.length);
			// the custom semantic objects are either a single string/key to custom data or a stringified array
			if (!customSemanticObject.startsWith("[")) {
				// customSemanticObject = "semanticObject" | "{pathInModel} | {formatter...}"
				if (!semanticObjectsList.includes(customSemanticObject)) {
					semanticObjectsList.push(customSemanticObject);
					qualifierMap["undefined"] = customSemanticObject;
				}
			} else {
				// customSemanticObject = '["semanticObject1","semanticObject2"]'
				for (const semanticObject of JSON.parse(customSemanticObject) as string[]) {
					if (!semanticObjectsList.includes(semanticObject)) {
						semanticObjectsList.push(semanticObject);
					}
				}
			}
		}
	}

	/**
	 * Get the navigationProperty to an entity with QuickViewFacets that can be linked to the property.
	 * @param propertyDataModelPath
	 * @returns A navigation property if it exists.
	 */
	static getNavPropToQuickViewEntity(propertyDataModelPath: DataModelObjectPath<Property>): NavigationProperty | undefined {
		//TODO we should investigate to put this code as common with FieldTemplating.isUsedInNavigationWithQuickViewFacets
		const property = propertyDataModelPath.targetObject as Property;
		const navigationProperties = propertyDataModelPath.targetEntityType.navigationProperties;
		let quickViewNavProp = navigationProperties.find((navProp: NavigationProperty) => {
			return navProp.referentialConstraint.some((referentialConstraint) => {
				return referentialConstraint.sourceProperty === property.name && navProp.targetType.annotations.UI?.QuickViewFacets;
			});
		});
		if (!quickViewNavProp && propertyDataModelPath.contextLocation?.targetEntitySet !== propertyDataModelPath.targetEntitySet) {
			const semanticKeys = propertyDataModelPath.targetEntityType.annotations.Common?.SemanticKey || [];
			const isPropertySemanticKey = semanticKeys.some((semanticKey) => semanticKey.$target === property);
			const lastNavProp = propertyDataModelPath.navigationProperties[propertyDataModelPath.navigationProperties.length - 1];
			if ((isPropertySemanticKey || property.isKey) && propertyDataModelPath.targetEntityType.annotations.UI?.QuickViewFacets) {
				quickViewNavProp = lastNavProp as unknown as NavigationProperty;
			}
		}
		return quickViewNavProp;
	}

	/**
	 * Compute the properties and payload for the QuickView.
	 */
	computePropertiesAndPayload(): void {
		const valueProperty = isProperty(this.valueDataModelPath.targetObject) ? this.valueDataModelPath.targetObject : undefined;
		const hasQuickViewFacets =
			valueProperty && isUsedInNavigationWithQuickViewFacets(this.valueDataModelPath, valueProperty) ? "true" : "false";

		const relativePathToQuickViewEntity = QuickView.getRelativePathToQuickViewEntity(this.valueDataModelPath);
		let absoluteContextPath = this.contextPath;
		absoluteContextPath = absoluteContextPath.endsWith("/") ? absoluteContextPath.slice(0, -1) : absoluteContextPath;
		const quickViewEntity = relativePathToQuickViewEntity ? `${absoluteContextPath}/${relativePathToQuickViewEntity}` : undefined;
		const navigationPath = relativePathToQuickViewEntity ? compileExpression(pathInModel(relativePathToQuickViewEntity)) : undefined;

		const propertyWithSemanticObject = getPropertyWithSemanticObject(this.valueDataModelPath);
		const { semanticObjectsList, qualifierMap } = getSemanticObjectsAndQualifierMap(propertyWithSemanticObject);
		const semanticObjectMappings = QuickView.getSemanticObjectMappingsForPayload(propertyWithSemanticObject, qualifierMap);
		const semanticObjectUnavailableActions = QuickView.getSemanticObjectUnavailableActionsForPayload(
			propertyWithSemanticObject,
			qualifierMap
		);
		QuickView.addCustomSemanticObjectToSemanticObjectListForPayload(semanticObjectsList, this.semanticObject, qualifierMap);
		const propertyPathLabel = (valueProperty?.annotations.Common?.Label?.valueOf() as string) || "";

		const qualifiers = Object.fromEntries(
			Object.entries(qualifierMap).map(([key, value]) => {
				const qualifierKey = key === "" ? "SemanticObject" : `SemanticObject#${key}`;
				return [qualifierKey, value];
			})
		);
		this.qualifierMap = qualifierMap;
		this.payload = {
			semanticObjects: semanticObjectsList,
			entityType: quickViewEntity,
			semanticObjectUnavailableActions: semanticObjectUnavailableActions,
			semanticObjectMappings: semanticObjectMappings,
			propertyPathLabel: propertyPathLabel,
			contextPath: this.contextPath,
			dataField: quickViewEntity === undefined ? this.metaPath : undefined,
			contact: undefined,
			dataFieldPropPath: getContextRelativeTargetObjectPath(this.valueDataModelPath),
			navigationPath: navigationPath,
			hasQuickViewFacets: hasQuickViewFacets,
			qualifiers: qualifiers
		};
	}

	/**
	 * Create the content for the QuickView.
	 * @returns The control definition.
	 */
	public createContent(): MdcLink | string {
		const delegateConfiguration = {
			name: "sap/fe/macros/quickView/QuickViewDelegate",
			payload: this.payload
		};
		const customData = this.getAllCustomData(this.payload.semanticObjects, this.valueDataModelPath);
		return <MdcLink delegate={delegateConfiguration}>{customData.length ? { customData: customData } : {}}</MdcLink>;
	}

	/**
	 * Prepare the custom data information for the mdc link control.
	 * @param dynamicPathWithRelativeLocation The complied expression of the semantic object
	 * @param indexOfQualifier The index of the qualifier map
	 * @returns The custom data node updated.
	 */
	getCustomDataForSemanticObject(dynamicPathWithRelativeLocation: string, indexOfQualifier: number): CustomData | undefined {
		if (getDynamicPathFromSemanticObject(dynamicPathWithRelativeLocation)) {
			const qualifier =
				Object.keys(this.qualifierMap)[indexOfQualifier] === "" ? "" : `#${Object.keys(this.qualifierMap)[indexOfQualifier]}`;
			const key = `SemanticObject${qualifier}`;
			return <CustomData key={key} value={dynamicPathWithRelativeLocation} />;
		}
		return;
	}

	/**
	 * Get all custom data for the semantic objects.
	 * @param semanticObjects The list of semantic objects
	 * @param valueDataModelPath The data model path of the property
	 * @returns The custom data.
	 */

	getAllCustomData(semanticObjects: string[], valueDataModelPath: DataModelObjectPath<Property> | undefined): CustomData[] {
		const customData = [];
		let indexOfQualifier = 0;
		const relativeLocation = valueDataModelPath && getRelativePaths(valueDataModelPath);

		for (const semanticObject of semanticObjects) {
			const dynamicPathFromSemanticObject = getDynamicPathFromSemanticObject(semanticObject);
			let dynamicPathWithRelativeLocation;
			if (dynamicPathFromSemanticObject) {
				indexOfQualifier = Object.values(this.qualifierMap).findIndex(
					(semanticObjectFromQualifier) => semanticObjectFromQualifier === semanticObject
				);
				if (semanticObject.startsWith("{=")) {
					// This a complex semantic object, we do not manipulate the expression binding.
					dynamicPathWithRelativeLocation = semanticObject;
				} else {
					dynamicPathWithRelativeLocation = compileExpression(
						pathInModel(dynamicPathFromSemanticObject, undefined, relativeLocation)
					);
					for (const item of Object.keys(this.qualifierMap)) {
						if (this.qualifierMap[item] === semanticObject) {
							this.qualifierMap[item] = dynamicPathWithRelativeLocation;
						}
					}
				}
				const customDataForSemanticObject = this.getCustomDataForSemanticObject(
					dynamicPathWithRelativeLocation ? dynamicPathWithRelativeLocation : "",
					indexOfQualifier
				);
				if (customDataForSemanticObject) {
					customData.push(customDataForSemanticObject);
				}
			}
		}
		return customData;
	}
}

import type { AnnotationTerm, EntitySet, EntityType, NavigationProperty, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import type { MultipleNavigationProperty } from "@sap-ux/vocabularies-types/Edm";
import type { AggregatablePropertyType, CustomAggregate } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import { AggregationAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import type {
	CollectionAnnotations_Aggregation,
	EntityContainerAnnotations_Aggregation,
	EntitySetAnnotations_Aggregation,
	EntityTypeAnnotations_Aggregation
} from "@sap-ux/vocabularies-types/vocabularies/Aggregation_Edm";
import type { AggregatedProperties, AggregatedProperty, AggregatedPropertyType } from "@sap-ux/vocabularies-types/vocabularies/Analytics";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { isEntitySet, isEntityType, isNavigationProperty, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type ConverterContext from "../ConverterContext";

/**
 * helper class for Aggregation annotations.
 */
export class AggregationHelper {
	_entityType: EntityType;

	_converterContext: ConverterContext<PageContextPathTarget>;

	_bApplySupported: boolean;

	_aGroupableProperties?: PropertyPath[];

	_aAggregatableProperties?: AggregatablePropertyType[] | Property[];

	_oAggregationAnnotationTarget: EntityType | EntitySet | NavigationProperty | undefined;

	oTargetAggregationAnnotations?:
		| CollectionAnnotations_Aggregation
		| EntityTypeAnnotations_Aggregation
		| EntitySetAnnotations_Aggregation;

	oContainerAggregationAnnotation?: EntityContainerAnnotations_Aggregation;

	/**
	 * Creates a helper for a specific entity type and a converter context.
	 * @param entityType The EntityType
	 * @param converterContext The ConverterContext
	 * @param [considerOldAnnotations] The flag to indicate whether or not to consider old annotations
	 */
	constructor(entityType: EntityType, converterContext: ConverterContext<PageContextPathTarget>, considerOldAnnotations = false) {
		//considerOldAnnotations will be true and sent only for chart
		this._entityType = entityType;
		this._converterContext = converterContext;

		this._oAggregationAnnotationTarget = this._determineAggregationAnnotationTarget();
		if (
			isNavigationProperty(this._oAggregationAnnotationTarget) ||
			isEntityType(this._oAggregationAnnotationTarget) ||
			isEntitySet(this._oAggregationAnnotationTarget)
		) {
			this.oTargetAggregationAnnotations = this._oAggregationAnnotationTarget.annotations.Aggregation;
		}
		this._bApplySupported = this.oTargetAggregationAnnotations?.ApplySupported ? true : false;

		if (this._bApplySupported) {
			this._aGroupableProperties = this.oTargetAggregationAnnotations?.ApplySupported?.GroupableProperties as PropertyPath[];
			this._aAggregatableProperties = this.oTargetAggregationAnnotations?.ApplySupported?.AggregatableProperties;

			this.oContainerAggregationAnnotation = converterContext.getEntityContainer().annotations
				.Aggregation as EntityContainerAnnotations_Aggregation;
		}
		if (!this._aAggregatableProperties && considerOldAnnotations) {
			const entityProperties = this._getEntityProperties();
			this._aAggregatableProperties = entityProperties?.filter((property) => {
				return property.annotations?.Aggregation?.Aggregatable;
			});
		}
	}

	/**
	 * Determines the most appropriate target for the aggregation annotations.
	 * @returns  EntityType, EntitySet or NavigationProperty where aggregation annotations should be read from.
	 */
	private _determineAggregationAnnotationTarget(): EntityType | EntitySet | NavigationProperty | undefined {
		const bIsParameterized = this._converterContext.getDataModelObjectPath()?.startingEntitySet?.entityType?.annotations?.Common
			?.ResultContext
			? true
			: false;
		let oAggregationAnnotationSource: EntityType | EntitySet | NavigationProperty | undefined;

		// find ApplySupported
		if (bIsParameterized) {
			// if this is a parameterized view then applysupported can be found at either the navProp pointing to the result set or entityType.
			// If applySupported is present at both the navProp and the entityType then navProp is more specific so take annotations from there
			// targetObject in the converter context for a parameterized view is the navigation property pointing to th result set
			const oDataModelObjectPath = this._converterContext.getDataModelObjectPath();
			const oNavigationPropertyObject = oDataModelObjectPath?.targetObject as MultipleNavigationProperty;
			const oEntityTypeObject = oDataModelObjectPath?.targetEntityType;
			if (oNavigationPropertyObject?.annotations?.Aggregation?.hasOwnProperty("ApplySupported")) {
				oAggregationAnnotationSource = oNavigationPropertyObject;
			} else if (oEntityTypeObject?.annotations?.Aggregation?.ApplySupported) {
				oAggregationAnnotationSource = oEntityTypeObject;
			}
		} else {
			// For the time being, we ignore annotations at the container level, until the vocabulary is stabilized
			const oEntitySetObject = this._converterContext.getEntitySet();
			if (isEntitySet(oEntitySetObject) && oEntitySetObject.annotations.Aggregation?.ApplySupported) {
				oAggregationAnnotationSource = oEntitySetObject;
			} else {
				oAggregationAnnotationSource = this._converterContext.getEntityType();
			}
		}
		return oAggregationAnnotationSource;
	}

	/**
	 * Checks if the entity supports analytical queries.
	 * @returns `true` if analytical queries are supported, false otherwise.
	 */
	public isAnalyticsSupported(): boolean {
		return this._bApplySupported;
	}

	/**
	 * Checks if a property is groupable.
	 * @param property The property to check
	 * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
	 */
	public isPropertyGroupable(property: Property): boolean | undefined {
		if (!this._bApplySupported) {
			return undefined;
		} else if (!this._aGroupableProperties || this._aGroupableProperties.length === 0) {
			// No groupableProperties --> all properties are groupable
			return true;
		} else {
			return this._aGroupableProperties.some((path) => path.$target === property);
		}
	}

	/**
	 * Checks if a property is aggregatable.
	 * @param property The property to check
	 * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
	 */
	public isPropertyAggregatable(property: Property): boolean | undefined {
		if (!this._bApplySupported) {
			return undefined;
		} else {
			// Get the custom aggregates
			const aCustomAggregateAnnotations: CustomAggregate[] = this._converterContext.getAnnotationsByTerm(
				"Aggregation",
				AggregationAnnotationTerms.CustomAggregate,
				[this._oAggregationAnnotationTarget]
			);

			// Check if a custom aggregate has a qualifier that corresponds to the property name
			return aCustomAggregateAnnotations.some((annotation) => {
				return property.name === annotation.qualifier;
			});
		}
	}

	public getGroupableProperties(): PropertyPath[] | undefined {
		return this._aGroupableProperties;
	}

	public getAggregatableProperties(): AggregatablePropertyType[] | Property[] | undefined {
		return this._aAggregatableProperties;
	}

	public getEntityType(): EntityType {
		return this._entityType;
	}

	/**
	 * Returns AggregatedProperties or AggregatedProperty based on param Term.
	 * The Term here indicates if the AggregatedProperty should be retrieved or the deprecated AggregatedProperties.
	 * @returns Annotations The appropriate annotations based on the given Term.
	 */
	public getAggregatedProperties(): AggregatedProperties[] {
		return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperties", [
			this._converterContext.getEntityContainer(),
			this._converterContext.getEntityType()
		]);
	}

	public getAggregatedProperty(): AggregatedProperty[] {
		return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperty", [
			this._converterContext.getEntityContainer(),
			this._converterContext.getEntityType()
		]);
	}

	// retirve all transformation aggregates by prioritizing AggregatedProperty over AggregatedProperties objects
	public getTransAggregations(): AggregatedProperty[] {
		let aAggregatedPropertyObjects = this.getAggregatedProperty();
		if (!aAggregatedPropertyObjects || aAggregatedPropertyObjects.length === 0) {
			aAggregatedPropertyObjects = this.getAggregatedProperties()[0] as unknown as AggregatedProperty[];
		}
		return aAggregatedPropertyObjects?.filter((aggregatedProperty: AggregatedPropertyType) => {
			if (this._getAggregatableAggregates(aggregatedProperty.AggregatableProperty)) {
				return aggregatedProperty;
			}
		});
	}

	/**
	 * Check if each transformation is aggregatable.
	 * @param property The property to check
	 * @returns 'aggregatedProperty'
	 */

	private _getAggregatableAggregates(
		property: PropertyPath | AnnotationTerm<CustomAggregate>
	): AggregatablePropertyType | Property | undefined {
		const aAggregatableProperties = this.getAggregatableProperties() || [];
		return aAggregatableProperties.find(function (obj: AggregatablePropertyType | Property) {
			const prop = (property as AnnotationTerm<CustomAggregate>).qualifier
				? (property as AnnotationTerm<CustomAggregate>).qualifier
				: (property as PropertyPath).$target?.name;
			if (isProperty(obj)) {
				return obj?.name === prop;
			} else if (obj?.Property?.value) {
				return obj.Property.value === prop;
			}
		});
	}

	private _getEntityProperties(): Property[] | undefined {
		let entityProperties;
		if (isEntitySet(this._oAggregationAnnotationTarget)) {
			entityProperties = this._oAggregationAnnotationTarget?.entityType?.entityProperties;
		} else if (isEntityType(this._oAggregationAnnotationTarget)) {
			entityProperties = this._oAggregationAnnotationTarget?.entityProperties;
		}
		return entityProperties;
	}

	/**
	 * Returns the list of custom aggregate definitions for the entity type.
	 * @returns A map (propertyName --> array of context-defining property names) for each custom aggregate corresponding to a property. The array of
	 * context-defining property names is empty if the custom aggregate doesn't have any context-defining property.
	 */
	public getCustomAggregateDefinitions(): CustomAggregate[] {
		// Get the custom aggregates
		const aCustomAggregateAnnotations: CustomAggregate[] = this._converterContext.getAnnotationsByTerm(
			"Aggregation",
			AggregationAnnotationTerms.CustomAggregate,
			[this._oAggregationAnnotationTarget]
		);
		return aCustomAggregateAnnotations;
	}

	/**
	 * Returns the list of allowed transformations in the $apply.
	 * First look at the current EntitySet, then look at the default values provided at the container level.
	 * @returns The list of transformations, or undefined if no list is found
	 */
	public getAllowedTransformations(): String[] | undefined {
		return (
			(this.oTargetAggregationAnnotations?.ApplySupported?.Transformations as String[]) ||
			(this.oContainerAggregationAnnotation?.ApplySupportedDefaults?.Transformations as String[])
		);
	}
}

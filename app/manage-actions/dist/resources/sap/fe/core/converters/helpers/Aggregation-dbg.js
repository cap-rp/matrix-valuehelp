/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntityType = TypeGuards.isEntityType;
  var isEntitySet = TypeGuards.isEntitySet;
  /**
   * helper class for Aggregation annotations.
   */
  let AggregationHelper = /*#__PURE__*/function () {
    /**
     * Creates a helper for a specific entity type and a converter context.
     * @param entityType The EntityType
     * @param converterContext The ConverterContext
     * @param [considerOldAnnotations] The flag to indicate whether or not to consider old annotations
     */
    function AggregationHelper(entityType, converterContext) {
      let considerOldAnnotations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      //considerOldAnnotations will be true and sent only for chart
      this._entityType = entityType;
      this._converterContext = converterContext;
      this._oAggregationAnnotationTarget = this._determineAggregationAnnotationTarget();
      if (isNavigationProperty(this._oAggregationAnnotationTarget) || isEntityType(this._oAggregationAnnotationTarget) || isEntitySet(this._oAggregationAnnotationTarget)) {
        this.oTargetAggregationAnnotations = this._oAggregationAnnotationTarget.annotations.Aggregation;
      }
      this._bApplySupported = this.oTargetAggregationAnnotations?.ApplySupported ? true : false;
      if (this._bApplySupported) {
        this._aGroupableProperties = this.oTargetAggregationAnnotations?.ApplySupported?.GroupableProperties;
        this._aAggregatableProperties = this.oTargetAggregationAnnotations?.ApplySupported?.AggregatableProperties;
        this.oContainerAggregationAnnotation = converterContext.getEntityContainer().annotations.Aggregation;
      }
      if (!this._aAggregatableProperties && considerOldAnnotations) {
        const entityProperties = this._getEntityProperties();
        this._aAggregatableProperties = entityProperties?.filter(property => {
          return property.annotations?.Aggregation?.Aggregatable;
        });
      }
    }

    /**
     * Determines the most appropriate target for the aggregation annotations.
     * @returns  EntityType, EntitySet or NavigationProperty where aggregation annotations should be read from.
     */
    _exports.AggregationHelper = AggregationHelper;
    var _proto = AggregationHelper.prototype;
    _proto._determineAggregationAnnotationTarget = function _determineAggregationAnnotationTarget() {
      const bIsParameterized = this._converterContext.getDataModelObjectPath()?.startingEntitySet?.entityType?.annotations?.Common?.ResultContext ? true : false;
      let oAggregationAnnotationSource;

      // find ApplySupported
      if (bIsParameterized) {
        // if this is a parameterized view then applysupported can be found at either the navProp pointing to the result set or entityType.
        // If applySupported is present at both the navProp and the entityType then navProp is more specific so take annotations from there
        // targetObject in the converter context for a parameterized view is the navigation property pointing to th result set
        const oDataModelObjectPath = this._converterContext.getDataModelObjectPath();
        const oNavigationPropertyObject = oDataModelObjectPath?.targetObject;
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
     */;
    _proto.isAnalyticsSupported = function isAnalyticsSupported() {
      return this._bApplySupported;
    }

    /**
     * Checks if a property is groupable.
     * @param property The property to check
     * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
     */;
    _proto.isPropertyGroupable = function isPropertyGroupable(property) {
      if (!this._bApplySupported) {
        return undefined;
      } else if (!this._aGroupableProperties || this._aGroupableProperties.length === 0) {
        // No groupableProperties --> all properties are groupable
        return true;
      } else {
        return this._aGroupableProperties.some(path => path.$target === property);
      }
    }

    /**
     * Checks if a property is aggregatable.
     * @param property The property to check
     * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
     */;
    _proto.isPropertyAggregatable = function isPropertyAggregatable(property) {
      if (!this._bApplySupported) {
        return undefined;
      } else {
        // Get the custom aggregates
        const aCustomAggregateAnnotations = this._converterContext.getAnnotationsByTerm("Aggregation", "Org.OData.Aggregation.V1.CustomAggregate", [this._oAggregationAnnotationTarget]);

        // Check if a custom aggregate has a qualifier that corresponds to the property name
        return aCustomAggregateAnnotations.some(annotation => {
          return property.name === annotation.qualifier;
        });
      }
    };
    _proto.getGroupableProperties = function getGroupableProperties() {
      return this._aGroupableProperties;
    };
    _proto.getAggregatableProperties = function getAggregatableProperties() {
      return this._aAggregatableProperties;
    };
    _proto.getEntityType = function getEntityType() {
      return this._entityType;
    }

    /**
     * Returns AggregatedProperties or AggregatedProperty based on param Term.
     * The Term here indicates if the AggregatedProperty should be retrieved or the deprecated AggregatedProperties.
     * @returns Annotations The appropriate annotations based on the given Term.
     */;
    _proto.getAggregatedProperties = function getAggregatedProperties() {
      return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperties", [this._converterContext.getEntityContainer(), this._converterContext.getEntityType()]);
    };
    _proto.getAggregatedProperty = function getAggregatedProperty() {
      return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperty", [this._converterContext.getEntityContainer(), this._converterContext.getEntityType()]);
    }

    // retirve all transformation aggregates by prioritizing AggregatedProperty over AggregatedProperties objects
    ;
    _proto.getTransAggregations = function getTransAggregations() {
      let aAggregatedPropertyObjects = this.getAggregatedProperty();
      if (!aAggregatedPropertyObjects || aAggregatedPropertyObjects.length === 0) {
        aAggregatedPropertyObjects = this.getAggregatedProperties()[0];
      }
      return aAggregatedPropertyObjects?.filter(aggregatedProperty => {
        if (this._getAggregatableAggregates(aggregatedProperty.AggregatableProperty)) {
          return aggregatedProperty;
        }
      });
    }

    /**
     * Check if each transformation is aggregatable.
     * @param property The property to check
     * @returns 'aggregatedProperty'
     */;
    _proto._getAggregatableAggregates = function _getAggregatableAggregates(property) {
      const aAggregatableProperties = this.getAggregatableProperties() || [];
      return aAggregatableProperties.find(function (obj) {
        const prop = property.qualifier ? property.qualifier : property.$target?.name;
        if (isProperty(obj)) {
          return obj?.name === prop;
        } else if (obj?.Property?.value) {
          return obj.Property.value === prop;
        }
      });
    };
    _proto._getEntityProperties = function _getEntityProperties() {
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
     */;
    _proto.getCustomAggregateDefinitions = function getCustomAggregateDefinitions() {
      // Get the custom aggregates
      const aCustomAggregateAnnotations = this._converterContext.getAnnotationsByTerm("Aggregation", "Org.OData.Aggregation.V1.CustomAggregate", [this._oAggregationAnnotationTarget]);
      return aCustomAggregateAnnotations;
    }

    /**
     * Returns the list of allowed transformations in the $apply.
     * First look at the current EntitySet, then look at the default values provided at the container level.
     * @returns The list of transformations, or undefined if no list is found
     */;
    _proto.getAllowedTransformations = function getAllowedTransformations() {
      return this.oTargetAggregationAnnotations?.ApplySupported?.Transformations || this.oContainerAggregationAnnotation?.ApplySupportedDefaults?.Transformations;
    };
    return AggregationHelper;
  }();
  _exports.AggregationHelper = AggregationHelper;
  return _exports;
}, false);
//# sourceMappingURL=Aggregation-dbg.js.map

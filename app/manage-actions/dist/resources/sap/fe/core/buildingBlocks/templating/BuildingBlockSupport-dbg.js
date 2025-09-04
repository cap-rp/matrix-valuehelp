/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge"], function (merge) {
  "use strict";

  var _exports = {};
  /**
   * Type for the accessor decorator that we end up with in babel.
   */

  /**
   * Available properties to define a building block property
   */

  /**
   * Available properties to define a building block aggregation
   */

  /**
   * Available properties to define a building block class
   */

  /**
   * Metadata attached to each building block class
   */

  /**
   * Indicates that you must declare the property to be used as an XML attribute that can be used from outside the building block.
   *
   * When you define a runtime building block, ensure that you use the correct type: Depending on its metadata,
   * a property can either be a {@link sap.ui.model.Context} (<code>type: 'sap.ui.model.Context'</code>),
   * a constant (<code>bindable: false</code>), or a {@link BindingToolkitExpression} (<code>bindable: true</code>).
   *
   * Use this decorator only for properties that are to be set from outside or are used in inner XML templating.
   * If you just need simple computed properties, use undecorated, private TypeScript properties.
   * @param attributeDefinition
   * @returns The decorated property
   */
  function blockAttribute(attributeDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target.constructor);
      // If there is no defaultValue we can take the value from the initializer (natural way of defining defaults)
      attributeDefinition.defaultValue = propertyDescriptor.initializer?.();
      delete propertyDescriptor.initializer;
      if (metadata.properties[propertyKey.toString()] === undefined || metadata.properties[propertyKey.toString()] !== attributeDefinition) {
        metadata.properties[propertyKey.toString()] = attributeDefinition;
      }
      return propertyDescriptor;
    }; // Needed to make TS happy with those decorators;
  }

  /**
   * Decorator for building blocks.
   *
   * This is an alias for @blockAttribute({ type: "function" }).
   * @returns The decorated property
   */
  _exports.blockAttribute = blockAttribute;
  function blockEvent() {
    return blockAttribute({
      type: "function",
      isPublic: true
    });
  }

  /**
   * Indicates that the property shall be declared as an xml aggregation that can be used from the outside of the building block.
   * @param aggregationDefinition
   * @returns The decorated property
   */
  _exports.blockEvent = blockEvent;
  function blockAggregation(aggregationDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target.constructor);
      delete propertyDescriptor.initializer;
      if (metadata.aggregations[propertyKey] === undefined || metadata.aggregations[propertyKey] !== aggregationDefinition) {
        metadata.aggregations[propertyKey] = aggregationDefinition;
      }
      if (aggregationDefinition.isDefault === true) {
        metadata.defaultAggregation = propertyKey;
      }
      return propertyDescriptor;
    };
  }

  /**
   * Ensure to create the relevant metadata for the Building block.
   * @param target The building block definition
   * @returns The metadata of the building block
   */
  _exports.blockAggregation = blockAggregation;
  function ensureMetadata(target) {
    if (!Object.getOwnPropertyNames(target).includes("metadata") || target.metadata === undefined) {
      target.metadata = merge({
        namespace: "",
        name: "",
        properties: {},
        aggregations: {},
        stereotype: "xmlmacro"
      }, target.metadata ?? {});
    }
    return target.metadata;
  }
  function defineBuildingBlock(buildingBlockDefinition) {
    return function (classDefinition) {
      const metadata = ensureMetadata(classDefinition);
      metadata.namespace = buildingBlockDefinition.namespace;
      metadata.publicNamespace = buildingBlockDefinition.publicNamespace;
      metadata.name = buildingBlockDefinition.name;
      metadata.xmlTag = buildingBlockDefinition.xmlTag;
      metadata.fragment = buildingBlockDefinition.fragment;
      metadata.designtime = buildingBlockDefinition.designtime;
      metadata.isOpen = buildingBlockDefinition.isOpen;
      metadata.libraries = buildingBlockDefinition.libraries;
    };
  }

  /**
   * Convert an existing building block metadata into a ui5 control metadata.
   * @param buildingBlockDefinition
   * @returns The equivalent ui5 control metadata
   */
  _exports.defineBuildingBlock = defineBuildingBlock;
  function convertBuildingBlockMetadata(buildingBlockDefinition) {
    const baseMetadata = {
      controllerExtensions: {},
      properties: {},
      aggregations: {},
      associations: {},
      references: {},
      methods: {},
      events: {},
      interfaces: []
    };
    const metadata = ensureMetadata(buildingBlockDefinition);
    let bbDefaultAggregation = metadata.defaultAggregation;
    for (const propertyKey in metadata.properties) {
      const currentProperty = {
        ...metadata.properties[propertyKey]
      };
      if (propertyKey === "visible") {
        currentProperty.defaultValue = true;
      }
      if (currentProperty.type === "function") {
        baseMetadata.events[propertyKey] = {};
      } else if (currentProperty.isAssociation === true) {
        baseMetadata.associations[propertyKey] = {
          type: "sap.ui.core.Control"
        };
      } else if (currentProperty.type === "object") {
        currentProperty.type = currentProperty.underlyingType ?? "sap.fe.macros.controls.BuildingBlockObjectProperty";
        currentProperty.multiple = false;
        baseMetadata.aggregations[propertyKey] = currentProperty;
        bbDefaultAggregation ??= propertyKey;
      } else if (currentProperty.type === "array") {
        currentProperty.type = currentProperty.underlyingType ?? "sap.fe.macros.controls.BuildingBlockObjectProperty";
        currentProperty.multiple = true;
        baseMetadata.aggregations[propertyKey] = currentProperty;
        bbDefaultAggregation ??= propertyKey;
      } else {
        if (currentProperty.type === "sap.ui.model.Context") {
          currentProperty.type = "string";
        }
        baseMetadata.properties[propertyKey] = {
          ...currentProperty
        };
      }
    }
    for (const aggregationKey in metadata.aggregations) {
      baseMetadata.aggregations[aggregationKey] = metadata.aggregations[aggregationKey];
    }
    baseMetadata.defaultAggregation = bbDefaultAggregation;
    baseMetadata.buildingBlockMetadata = metadata;
    return baseMetadata;
  }
  _exports.convertBuildingBlockMetadata = convertBuildingBlockMetadata;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockSupport-dbg.js.map

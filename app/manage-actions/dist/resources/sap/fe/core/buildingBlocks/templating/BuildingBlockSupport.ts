import merge from "sap/base/util/merge";
import type { UI5AggregationMetadata, UI5ControlMetadataDefinition } from "sap/fe/base/ClassSupport";
import type BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import type Context from "sap/ui/model/Context";

export type ObjectValue2 = string | boolean | number | Context | undefined | object | null;
type ObjectValue3<T> = T | Record<string, T> | T[];
export type ObjectValue = ObjectValue3<ObjectValue2 | Record<string, ObjectValue2> | ObjectValue2[]>;

/**
 * Type for the accessor decorator that we end up with in babel.
 */
type AccessorDescriptor<T> = TypedPropertyDescriptor<T> & { initializer?: () => T };
type BaseBuildingBlockPropertyDefinition = {
	type: string;
	underlyingType?: string;
	defaultClass?: Function;
	isPublic?: boolean;
	/** Make sure to type the optionality of your TypeScript property correctly */
	required?: boolean;
	/** This property is only considered for runtime building blocks */
	bindable?: boolean;
	/** Function that allows to validate or transform the given input */
	validate?: Function;
	/** Define the allowed values in the metadata */
	allowedValues?: string[];
	/** Whether this should point to an association */
	isAssociation?: boolean;
};
export type BuildingBlockMetadataContextDefinition = BaseBuildingBlockPropertyDefinition & {
	type: "sap.ui.model.Context";
	expectedTypes: string[];
	// For documentation only
	expectedAnnotations: string[];
	// Enforces the type
	expectedAnnotationTypes: string[];
};
/**
 * Available properties to define a building block property
 */
export type BuildingBlockPropertyDefinition = BaseBuildingBlockPropertyDefinition | BuildingBlockMetadataContextDefinition;

/**
 * Available properties to define a building block aggregation
 */
export type BuildingBlockAggregationDefinition = {
	isPublic?: boolean;
	type: string;
	altTypes?: string[];
	slot?: string;
	isDefault?: boolean;
	multiple?: boolean;
	skipKey?: boolean;

	/** Defines whether the element is based on an actual node that will be rendered or only on XML that will be interpreted */
	hasVirtualNode?: boolean;
	processAggregations?: Function;
};

/**
 * Available properties to define a building block class
 */
export type BuildingBlockDefinition = {
	name: string;
	namespace?: string;
	publicNamespace?: string;
	xmlTag?: string;
	fragment?: string;
	designtime?: string;
	isOpen?: boolean;
	returnTypes?: string[];
	libraries?: string[];
} & ({ namespace: string } | { publicNamespace: string });

/**
 * Metadata attached to each building block class
 */
export type BuildingBlockMetadata = BuildingBlockDefinition & {
	properties: Record<string, BuildingBlockPropertyDefinition & { defaultValue?: unknown }>;
	aggregations: Record<string, BuildingBlockAggregationDefinition>;
	stereotype: string;
	defaultAggregation?: string;
	libraries?: string[];
};

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
export function blockAttribute(attributeDefinition: BuildingBlockPropertyDefinition): PropertyDecorator {
	return function (target: BuildingBlockTemplatingBase, propertyKey: string | Symbol, propertyDescriptor: AccessorDescriptor<unknown>) {
		const metadata = ensureMetadata(target.constructor);
		// If there is no defaultValue we can take the value from the initializer (natural way of defining defaults)
		(attributeDefinition as { defaultValue?: unknown }).defaultValue = propertyDescriptor.initializer?.();
		delete propertyDescriptor.initializer;
		if (
			metadata.properties[propertyKey.toString()] === undefined ||
			metadata.properties[propertyKey.toString()] !== attributeDefinition
		) {
			metadata.properties[propertyKey.toString()] = attributeDefinition;
		}

		return propertyDescriptor;
	} as unknown as PropertyDecorator; // Needed to make TS happy with those decorators;
}

/**
 * Decorator for building blocks.
 *
 * This is an alias for @blockAttribute({ type: "function" }).
 * @returns The decorated property
 */
export function blockEvent(): PropertyDecorator {
	return blockAttribute({ type: "function", isPublic: true });
}

/**
 * Indicates that the property shall be declared as an xml aggregation that can be used from the outside of the building block.
 * @param aggregationDefinition
 * @returns The decorated property
 */
export function blockAggregation(aggregationDefinition: BuildingBlockAggregationDefinition): PropertyDecorator {
	return function (target: BuildingBlockTemplatingBase, propertyKey: string, propertyDescriptor: AccessorDescriptor<unknown>) {
		const metadata = ensureMetadata(target.constructor);
		delete propertyDescriptor.initializer;
		if (metadata.aggregations[propertyKey] === undefined || metadata.aggregations[propertyKey] !== aggregationDefinition) {
			metadata.aggregations[propertyKey] = aggregationDefinition;
		}
		if (aggregationDefinition.isDefault === true) {
			metadata.defaultAggregation = propertyKey;
		}

		return propertyDescriptor;
	} as unknown as PropertyDecorator;
}

/**
 * Ensure to create the relevant metadata for the Building block.
 * @param target The building block definition
 * @returns The metadata of the building block
 */
function ensureMetadata(target: Partial<typeof BuildingBlockTemplatingBase>): BuildingBlockMetadata {
	if (!Object.getOwnPropertyNames(target).includes("metadata") || target.metadata === undefined) {
		target.metadata = merge(
			{
				namespace: "",
				name: "",
				properties: {},
				aggregations: {},
				stereotype: "xmlmacro"
			},
			target.metadata ?? {}
		) as BuildingBlockMetadata;
	}
	return target.metadata;
}

export function defineBuildingBlock(buildingBlockDefinition: BuildingBlockDefinition): ClassDecorator {
	return function (classDefinition: Partial<typeof BuildingBlockTemplatingBase>) {
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
export function convertBuildingBlockMetadata(buildingBlockDefinition: typeof BuildingBlockTemplatingBase): UI5ControlMetadataDefinition {
	const baseMetadata: UI5ControlMetadataDefinition = {
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
		const currentProperty = { ...metadata.properties[propertyKey] };
		if (propertyKey === "visible") {
			currentProperty.defaultValue = true;
		}
		if (currentProperty.type === "function") {
			baseMetadata.events[propertyKey] = {};
		} else if (currentProperty.isAssociation === true) {
			baseMetadata.associations[propertyKey] = { type: "sap.ui.core.Control" };
		} else if (currentProperty.type === "object") {
			currentProperty.type = currentProperty.underlyingType ?? "sap.fe.macros.controls.BuildingBlockObjectProperty";
			(currentProperty as UI5AggregationMetadata).multiple = false;
			baseMetadata.aggregations[propertyKey] = currentProperty;
			bbDefaultAggregation ??= propertyKey;
		} else if (currentProperty.type === "array") {
			currentProperty.type = currentProperty.underlyingType ?? "sap.fe.macros.controls.BuildingBlockObjectProperty";
			(currentProperty as UI5AggregationMetadata).multiple = true;
			baseMetadata.aggregations[propertyKey] = currentProperty;
			bbDefaultAggregation ??= propertyKey;
		} else {
			if (currentProperty.type === "sap.ui.model.Context") {
				currentProperty.type = "string";
			}
			baseMetadata.properties[propertyKey] = { ...currentProperty };
		}
	}
	for (const aggregationKey in metadata.aggregations) {
		baseMetadata.aggregations[aggregationKey] = metadata.aggregations[aggregationKey];
	}
	baseMetadata.defaultAggregation = bbDefaultAggregation;
	baseMetadata.buildingBlockMetadata = metadata;
	return baseMetadata;
}

import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type { ControlProperties, NonControlProperties } from "sap/fe/base/jsx-runtime/jsx";
import jsxXml from "sap/fe/base/jsx-runtime/jsx-xml";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";

/**
 * Base class for building block complex object properties that can be serialized to XML.
 * @public
 */
@defineUI5Class("sap.fe.macros.controls.BuildingBlockObjectProperty")
export default class BuildingBlockObjectProperty extends UI5Element {
	getPropertyBag(): PropertiesOf<this> {
		const settings: PropertiesOf<this> = {} as PropertiesOf<this>;
		const properties = this.getMetadata().getAllProperties();
		const aggregations = this.getMetadata().getAllAggregations();
		for (const propertyName in properties) {
			const property = this.getProperty(propertyName);
			if (typeof property !== "function") {
				settings[propertyName as keyof PropertiesOf<this>] = property;
			}
		}
		for (const aggregationName in aggregations) {
			const aggregationContent = this.getAggregation(aggregationName);
			if (Array.isArray(aggregationContent)) {
				const childrenArray = [];
				for (const managedObject of aggregationContent) {
					if (managedObject.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
						childrenArray.push(managedObject.getPropertyBag());
					}
				}
				settings[aggregationName as keyof PropertiesOf<this>] = childrenArray;
			} else if (aggregationContent) {
				if (aggregationContent.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getPropertyBag();
				} else {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getId();
				}
			}
		}
		return settings;
	}

	serialize(overrideNodeName?: string): string {
		const properties = this.getMetadata().getAllProperties();
		const aggregations = this.getMetadata().getAllAggregations();
		const settings: Record<string, unknown> & { children: Record<string, unknown> } = { children: {} };
		for (const propertyName in properties) {
			const property = this.getProperty(propertyName);
			if (typeof property !== "function") {
				settings[propertyName] = property;
			}
		}
		for (const aggregationName in aggregations) {
			const aggregationContent = this.getAggregation(aggregationName);
			if (Array.isArray(aggregationContent)) {
				const childrenArray = [];
				for (const managedObject of aggregationContent) {
					if (managedObject.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
						childrenArray.push(managedObject.serialize());
					}
				}
				settings.children[aggregationName] = childrenArray;
			} else if (aggregationContent) {
				if (aggregationContent.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
					settings.children[aggregationName] = aggregationContent.serialize();
				} else {
					settings[aggregationName] = aggregationContent.getId();
				}
			}
		}
		return jsxXml<BuildingBlockObjectProperty>(
			this.getMetadata().getClass() as unknown as typeof Control,
			settings as NonControlProperties<BuildingBlockObjectProperty> & {
				key?: string;
				children?: UI5Element | ControlProperties<BuildingBlockObjectProperty>;
			},
			undefined,
			{},
			overrideNodeName
		);
	}

	override bindProperty(name: string, bindingInfo: PropertyBindingInfo): this {
		const propertyMetadata = this.getMetadata().getProperty(name);
		if (propertyMetadata?.bindable === false && propertyMetadata.group === "Data") {
			(this as Record<string, unknown>)[name] = bindingInfo;
		} else {
			super.bindProperty(name, bindingInfo);
		}
		return this;
	}
}

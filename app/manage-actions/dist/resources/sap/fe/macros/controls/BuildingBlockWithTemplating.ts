import type { EnhanceWithUI5, UI5ControlMetadataDefinition } from "sap/fe/base/ClassSupport";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { BuildingBlockMetadata } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import { parseXMLString, xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { isContext } from "sap/fe/core/helpers/TypeGuards";
import type BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type BaseObject from "sap/ui/base/Object";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";

/**
 * Using this class you can define a building block that will manage and render a templating based building block.
 * On change of the main properties you will be able to recreate the content.
 * @public
 * @experimental
 */
@defineUI5Class("sap.fe.macros.controls.BuildingBlockWithTemplating")
export default class BuildingBlockWithTemplating extends BuildingBlock<Control> {
	public contentCreated?: Promise<void>;

	private metadata!: UI5ControlMetadataDefinition;

	onMetadataAvailable(): void {
		if (!this.content) {
			this._createContent();
		}
	}

	_createContent(): void {
		const owner = this._getOwner();
		if (owner?.isA<TemplateComponent>("sap.fe.core.TemplateComponent")) {
			this.contentCreated = this.createContent(owner as EnhanceWithUI5<TemplateComponent>);
		}
	}

	/**
	 * Create proxy methods to forward calls to the content for the given methods.
	 * @param methods The method to proxy
	 */
	createProxyMethods(methods: string[]): void {
		for (const method of methods) {
			(this as unknown as Record<string, Function>)[method] = (...args: unknown[]): unknown => {
				return (this.content as unknown as Record<string, Function>)?.[method]?.(...args);
			};
		}
	}

	setProperty(propertyKey: string, propertyValue: string, bSuppressInvalidate?: boolean): this {
		if (
			!this._applyingSettings &&
			propertyValue !== undefined &&
			Object.keys(this.getMetadata().getProperties()).includes(propertyKey)
		) {
			super.setProperty(propertyKey, propertyValue, true);
			this._createContent();
		} else {
			super.setProperty(propertyKey, propertyValue, bSuppressInvalidate);
		}
		return this;
	}

	setAggregation(propertyKey: string, aggregationObject: ManagedObject, bSuppressInvalidate?: boolean): this {
		if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(propertyKey)) {
			super.setAggregation(propertyKey, aggregationObject, true);
			this._createContent();
		} else {
			super.setAggregation(propertyKey, aggregationObject, bSuppressInvalidate);
		}
		return this;
	}

	removeAggregation(
		aggregationName: string,
		object: ManagedObject | number | string,
		suppressInvalidate?: boolean
	): ManagedObject | null {
		let removed: ManagedObject | null;
		if (
			!this._applyingSettings &&
			object !== undefined &&
			Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)
		) {
			removed = super.removeAggregation(aggregationName, object, suppressInvalidate);
			this._createContent();
		} else {
			removed = super.removeAggregation(aggregationName, object, suppressInvalidate);
		}
		return removed;
	}

	addAggregation(aggregationName: string, object: ManagedObject, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)) {
			super.addAggregation(aggregationName, object, suppressInvalidate);
			this._createContent();
		} else {
			super.addAggregation(aggregationName, object, suppressInvalidate);
		}
		return this;
	}

	insertAggregation(aggregationName: string, object: ManagedObject, index: number, suppressInvalidate?: boolean): this {
		if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)) {
			super.insertAggregation(aggregationName, object, index, suppressInvalidate);
			this._createContent();
		} else {
			super.insertAggregation(aggregationName, object, index, suppressInvalidate);
		}
		return this;
	}

	async createContent(owner: EnhanceWithUI5<TemplateComponent>): Promise<void> {
		if (this.contentCreated) {
			await this.contentCreated;
		}
		// Only special building block will implement this
		const preprocessorContext = owner.getPreprocessorContext() ?? {
			models: {},
			bindingContexts: {}
		};

		const metadata = this.getMetadata();
		const bbMetadata = this.metadata.buildingBlockMetadata as BuildingBlockMetadata | undefined;
		if (bbMetadata) {
			const namespace = bbMetadata.publicNamespace ?? bbMetadata.namespace;
			const name = bbMetadata.name;
			const fqnName = `${metadata.getName()}`.replaceAll(".", "/");
			const xmlProperties: string[] = [];
			const xmlAggregations: string[] = [];
			const allAggregations = bbMetadata.aggregations;

			for (const propertiesKey in bbMetadata.properties) {
				let propertyValue = this[propertiesKey as keyof this] as unknown;
				let propertyValueObject = propertyValue as BaseObject;
				if (propertyValueObject?.hasOwnProperty?.("path") && propertyValueObject?.hasOwnProperty?.("model")) {
					propertyValueObject = this.getModel((propertyValueObject as PropertyBindingInfo).model)?.getObject(
						(propertyValueObject as PropertyBindingInfo).path
					);
				}
				if (bbMetadata.properties[propertiesKey].type === "function") {
					xmlProperties.push(xml`${propertiesKey}="THIS._fireEvent($event, $controller, '${propertiesKey}')"`);
				} else if (
					propertyValueObject?.isA &&
					propertyValueObject.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")
				) {
					const xmlAggregation = propertyValueObject.serialize(`feBB:${propertiesKey}`);
					xmlAggregations.push(xmlAggregation);
				} else if (bbMetadata.properties[propertiesKey].type === "array") {
					allAggregations[propertiesKey] = bbMetadata.properties[propertiesKey];
				} else if (
					propertyValue !== undefined &&
					propertyValue !== null &&
					(typeof propertyValue !== "object" || Object.keys(propertyValue).length > 0)
				) {
					if (isContext(propertyValue)) {
						propertyValue = propertyValue.getPath();
					} else if (propertiesKey === "id") {
						xmlProperties.push(xml`${propertiesKey}="${propertyValue}-block"`);
					} else {
						xmlProperties.push(xml`${propertiesKey}="${propertyValue}"`);
					}
				}
			}
			for (const aggregationKey in allAggregations) {
				const _aggregationValue = this[aggregationKey as keyof this] as unknown as UI5Element | UI5Element[] | null;
				if (_aggregationValue) {
					const aggregationChildren: string[] = [];
					if (Array.isArray(_aggregationValue)) {
						for (const aggregationChild of _aggregationValue) {
							if (aggregationChild.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty"))
								aggregationChildren.push(aggregationChild.serialize());
						}
					} else if (_aggregationValue.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
						aggregationChildren.push(_aggregationValue.serialize());
					}
					const xmlAggregation = `<feBB:${aggregationKey}>${aggregationChildren.join("\n")}</feBB:${aggregationKey}>`;

					xmlAggregations.push(xmlAggregation);
				}
			}
			const fragment = await XMLPreprocessor.process(
				parseXMLString(
					xml`<root><feBB:${name}
			xmlns:core="sap.ui.core"
			xmlns:feBB="${namespace}"
			${xmlProperties.length > 0 ? xmlProperties : ""}
			core:require="{THIS: '${fqnName}'}"
			>${xmlAggregations.length > 0 ? xmlAggregations : ""}</feBB:${name}></root>`,
					true
				)[0],
				{ models: {} },
				preprocessorContext
			);
			if (fragment.firstElementChild) {
				this.content?.destroy();
				this.content = await owner.runAsOwner(async () => {
					return Fragment.load({
						definition: fragment.firstElementChild as Element,
						controller: owner.getRootController()
					}) as Promise<Control>;
				});
			}
		}
	}
}

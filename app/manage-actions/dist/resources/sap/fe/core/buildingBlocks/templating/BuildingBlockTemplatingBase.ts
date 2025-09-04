import deepClone from "sap/base/util/deepClone";
import merge from "sap/base/util/merge";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { BuildingBlockMetadata, ObjectValue } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type {
	TemplateProcessorSettings,
	XMLProcessorTypeValue
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import {
	addAttributeToXML,
	addConditionallyToXML,
	registerBuildingBlock,
	unregisterBuildingBlock
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { $ControlSettings } from "sap/ui/core/Control";

/**
 * Base class for building blocks
 */
export default class BuildingBlockTemplatingBase {
	private static internalMetadata: BuildingBlockMetadata;

	public static get metadata(): BuildingBlockMetadata {
		return this.internalMetadata;
	}

	public static set metadata(newValue: BuildingBlockMetadata) {
		this.internalMetadata = newValue;
	}

	public static readonly isRuntime: boolean = false;

	protected isPublic = false;

	private resourceModel?: ResourceModel;

	public id?: string;

	constructor(props: $ControlSettings, _controlConfiguration?: unknown, _visitorSettings?: TemplateProcessorSettings) {
		Object.keys(props).forEach((propName) => {
			this[propName as keyof this] = props[propName as keyof $ControlSettings] as never;
		});

		this.resourceModel = _visitorSettings?.models?.["sap.fe.i18n"];
	}

	/**
	 * Only used internally
	 *
	 */
	public getTemplate?(oNode?: Element): string | Promise<string | undefined> | undefined;

	/**
	 * Convert the given local element ID to a globally unique ID by prefixing with the Building Block ID.
	 * @param stringParts
	 * @returns Either the global ID or undefined if the Building Block doesn't have an ID
	 */
	protected createId(...stringParts: string[]): string | undefined {
		// If the child instance has an ID property use it otherwise return undefined
		if (this.id) {
			return generate([this.id, ...stringParts]);
		}
		return undefined;
	}

	/**
	 * Get the ID of the content control.
	 * @param buildingBlockId
	 * @returns Return the ID
	 */
	protected getContentId(buildingBlockId: string): string {
		return `${buildingBlockId}-content`;
	}

	/**
	 * Returns translated text for a given resource key.
	 * @param textID ID of the Text
	 * @param parameters Array of parameters that are used to create the text
	 * @param metaPath Entity set name or action name to overload a text
	 * @returns Determined text
	 */
	getTranslatedText(textID: string, parameters?: unknown[], metaPath?: string): string {
		return this.resourceModel?.getText(textID, parameters, metaPath) || textID;
	}

	protected getConverterContext = function (
		dataModelObjectPath: DataModelObjectPath<unknown>,
		contextPath: string | undefined,
		settings: TemplateProcessorSettings,
		extraParams?: Record<string, unknown>
	): ConverterContext<PageContextPathTarget> {
		const appComponent = settings.appComponent;
		const originalViewData = settings.models.viewData?.getData();
		let viewData = Object.assign({}, originalViewData);
		delete viewData.resourceModel;
		delete viewData.appComponent;
		viewData = deepClone(viewData);
		let controlConfiguration = {};

		// Only merge in page control configuration if the building block is on the same context
		const relativePath = getTargetObjectPath(dataModelObjectPath.contextLocation ?? dataModelObjectPath);
		const entitySetName = dataModelObjectPath.contextLocation?.targetEntitySet?.name ?? dataModelObjectPath.targetEntitySet?.name;
		if (
			relativePath === originalViewData?.contextPath ||
			relativePath === `/${originalViewData?.entitySet}` ||
			entitySetName === originalViewData?.entitySet
		) {
			controlConfiguration = viewData.controlConfiguration;
		}
		viewData.controlConfiguration = merge(controlConfiguration, extraParams || {});
		return ConverterContext.createConverterContextForMacro(
			dataModelObjectPath.startingEntitySet.name,
			settings.models.metaModel,
			appComponent?.getDiagnostics(),
			merge,
			dataModelObjectPath.contextLocation,
			new ManifestWrapper(viewData, appComponent)
		);
	};

	/**
	 * Only used internally.
	 * @returns All the properties defined on the object with their values
	 */
	public getProperties(): Record<string, ObjectValue> {
		const allProperties: Record<string, ObjectValue> = {};
		for (const oInstanceKey in this) {
			if (this.hasOwnProperty(oInstanceKey)) {
				allProperties[oInstanceKey] = this[oInstanceKey] as unknown as ObjectValue;
			}
		}
		return allProperties;
	}

	static register(): void {
		registerBuildingBlock(this);
	}

	static unregister(): void {
		unregisterBuildingBlock(this);
	}

	/**
	 * Add a part of string based on the condition.
	 * @param condition
	 * @param partToAdd
	 * @returns The part to add if the condition is true, otherwise an empty string
	 */
	protected addConditionally(condition: boolean, partToAdd: string): string {
		return addConditionallyToXML(condition, partToAdd);
	}

	/**
	 * Add an attribute depending on the current value of the property.
	 * If it's undefined the attribute is not added.
	 * @param attributeName
	 * @param value
	 * @returns The attribute to add if the value is not undefined, otherwise an empty string
	 */
	protected attr(attributeName: string, value?: XMLProcessorTypeValue): () => string {
		return addAttributeToXML(attributeName, value);
	}
}

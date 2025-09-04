import deepClone from "sap/base/util/deepClone";
import merge from "sap/base/util/merge";
import uid from "sap/base/util/uid";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import { getTargetObjectPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { $ManagedObjectSettings } from "sap/ui/base/ManagedObject";
import { bindingParser } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import type { IFormContent } from "sap/ui/core/library";
import type ClientContextBinding from "sap/ui/model/ClientContextBinding";
import type Context from "sap/ui/model/Context";

/**
 * Base API control for building blocks.
 * @hideconstructor
 * @public
 */
@defineUI5Class("sap.fe.macros.MacroAPI")
class MacroAPI extends BuildingBlock<Control, { readOnly: boolean }> implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	static namespace = "sap.fe.macros";

	static macroName = "Macro";

	static fragment = "sap.fe.macros.Macro";

	static hasValidation = true;

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	content!: Control;

	constructor(mSettings?: $ControlSettings & PropertiesOf<MacroAPI>, others?: $ControlSettings) {
		super(mSettings, others);
	}

	applySettings(mSettings: $ManagedObjectSettings, oScope?: object): this {
		// Cleanup events
		if (mSettings) {
			const eventsKeys = Object.keys(this.getMetadata().getEvents());
			for (const eventsKey of eventsKeys) {
				if (mSettings[eventsKey as keyof $ManagedObjectSettings] === undefined) {
					delete mSettings[eventsKey as keyof $ManagedObjectSettings];
				}
			}
		}

		return super.applySettings(mSettings, oScope);
	}

	init(): void {
		super.init();
		if (!this.getModel("_pageModel")) {
			const oPageModel = Component.getOwnerComponentFor(this)?.getModel("_pageModel");
			if (oPageModel) {
				this.setModel(oPageModel, "_pageModel");
			}
		}
	}

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({ type: "string" })
	contextPath!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({ type: "string" })
	metaPath!: string;

	/**
	 * Set or bind a property.
	 * @param propertyName The name of the property
	 * @param value The value of the property
	 */
	setOrBindProperty(propertyName: string, value?: unknown): void {
		if (value !== undefined) {
			const parsedExpression = bindingParser(value);
			if (parsedExpression) {
				this.bindProperty(propertyName, parsedExpression);
			} else {
				if (this.getMetadata().getProperty(propertyName)?.type === "boolean" && typeof value === "string") {
					value = value === "true";
				}
				this.setProperty(propertyName, value);
			}
		}
	}

	/**
	 * Retrieve a Converter Context.
	 * @param dataModelObjectPath
	 * @param contextPath
	 * @param settings
	 * @param extraParams
	 * @returns A Converter Context
	 */
	static getConverterContext = function (
		dataModelObjectPath: DataModelObjectPath<unknown>,
		contextPath: string,
		settings: TemplateProcessorSettings,
		extraParams?: Record<string, unknown>
	): ConverterContext {
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
			new ManifestWrapper(viewData as BaseManifestSettings, appComponent)
		);
	};

	/**
	 * Create a Binding Context.
	 * @param oData
	 * @param mSettings
	 * @returns The binding context
	 */
	static createBindingContext = function (oData: object, mSettings: TemplateProcessorSettings): Context {
		const sContextPath = `/uid--${uid()}`;
		mSettings.models.converterContext.setProperty(sContextPath, oData);
		return mSettings.models.converterContext.createBindingContext(sContextPath)!;
	};

	parentContextToBind: Record<string, string> = {};

	/**
	 * Keep track of a binding context that should be assigned to the parent of that control.
	 * @param modelName The model name that the context will relate to
	 * @param path The path of the binding context
	 */
	setParentBindingContext(modelName: string, path: string): void {
		this.parentContextToBind[modelName] = path;
	}

	setParent(...args: unknown[]): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		super.setParent(...args);
		Object.keys(this.parentContextToBind).forEach((modelName) => {
			this.getParent()!.bindObject({
				path: this.parentContextToBind[modelName],
				model: modelName,
				events: {
					change: function (this: ClientContextBinding) {
						const oBoundContext = this.getBoundContext() as InternalModelContext;
						if (oBoundContext && !oBoundContext.getObject()) {
							oBoundContext.setProperty("", {});
						}
					}
				}
			});
		});
	}
}

export default MacroAPI;

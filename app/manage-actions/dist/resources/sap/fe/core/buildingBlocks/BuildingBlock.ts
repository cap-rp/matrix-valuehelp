import Log from "sap/base/Log";
import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import { initControllerExtensionHookHandlers, removeControllerExtensionHookHandlers } from "sap/fe/base/HookSupport";
import type { FEView } from "sap/fe/core/BaseController";
import type PageController from "sap/fe/core/PageController";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { convertTypes, getInvolvedDataModelObjectsForTargetPath, getMetaModelById } from "sap/fe/core/converters/MetaModelConverter";
import type { DefinitionPage } from "sap/fe/core/definition/FEDefinition";
import MetaPath from "sap/fe/core/helpers/MetaPath";
import type { AuthorizedIdAnnotationsType } from "sap/fe/core/helpers/StableIdHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { $ManagedObjectSettings } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import ElementRegistry from "sap/ui/core/ElementRegistry";

import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type AppComponent from "../AppComponent";

export type ObserveBuildingBlock = {
	onAvailable?: (bb: UI5Element) => void;
	onDestroy?: (bb: UI5Element) => void;
};
/**
 * Defines a control that will not exist in the DOM.
 * Instead, only its child will be there and this control will forward all DOM related instruction to it.
 * @experimental
 * @since 1.121.0
 * @public
 */
@defineUI5Class("sap.fe.core.buildingBlocks.BuildingBlock")
class BuildingBlock<T extends UI5Element = Control, K extends object = {}> extends BuildingBlockBase<T, K> {
	/**
	 * The metamodel name or id to be used for this building block
	 */
	@property({ type: "string" })
	metaModel?: string;

	protected _applyingSettings = false;

	private static _bbobserverMap: Map<string, ObserveBuildingBlock[]> = new Map();

	constructor(settings?: string | PropertiesOf<BuildingBlockBase<T>>, others?: PropertiesOf<BuildingBlockBase<T>>) {
		super(settings, others);
		this.notifyBBObservers();
	}

	override applySettings(mSettings: $ManagedObjectSettings, oScope?: object): this {
		this._applyingSettings = true;
		super.applySettings(mSettings, oScope);
		this._applyingSettings = false;
		this._checkIfMetadataReady(true);

		return this;
	}

	notifyBBObservers(destroy = false): void {
		const bbobserverMap = BuildingBlock._bbobserverMap.get(this.getId());
		if (bbobserverMap && bbobserverMap.length > 0) {
			for (const observeBB of bbobserverMap) {
				if (destroy) {
					if (observeBB.onDestroy) {
						observeBB.onDestroy(this);
					}
				} else if (observeBB.onAvailable) {
					observeBB.onAvailable(this);
				}
			}
		}
	}

	/**
	 * Allows to observe building block once it is created.
	 * @param id The id of the building block which will be observed
	 * @param parameters The id of the building block which is being requsted
	 * @param parameters.onAvailable Callback which is called with the instance of the BB when it is available
	 * @param parameters.onDestroy Callback which is called with the instance of the BB when it is destroyed
	 */
	static observeBuildingBlock(id: string, parameters: ObserveBuildingBlock): void {
		//if (parameters)
		const element = ElementRegistry.get(id);
		// if the element is already registered
		if (element) {
			if (parameters.onAvailable) {
				parameters.onAvailable(element);
			}
		} else {
			const bbobserverMap = BuildingBlock._bbobserverMap.get(id);
			if (bbobserverMap) {
				bbobserverMap.push(parameters);
			} else {
				BuildingBlock._bbobserverMap.set(id, [parameters]);
			}
		}
	}

	/**
	 * Get the instance of a building block based once it is registered.
	 * @param id The id of the building block which is being requsted
	 * @returns Promise resolved with an instance of the building block once it is registered/instantied.
	 * 	 The promise is resolved when the building block is intantied hence it recommended to only await on the promise
	 * 	 when it is known that the building block will be available. In cases here the building block might not be available,
	 * 	 for example becuase of lazy loading, then it is recommended not to await on the promise and instead use Promise.then().
	 */

	_getOwner(): TemplateComponent | undefined {
		//eslint-disable-next-line @typescript-eslint/no-this-alias
		let control: Control | undefined = this;
		let owner = Component.getOwnerComponentFor(control);
		while (!owner && control && !control.isA<FEView>("sap.ui.core.mvc.View")) {
			control = control.getParent() as Control | undefined;
			if (control) {
				owner = Component.getOwnerComponentFor(control);
			}
		}
		if (owner?.isA<TemplateComponent>("sap.fe.core.TemplateComponent")) {
			return owner;
		}
		if (owner?.isA<TemplateComponent>("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent")) {
			return owner;
		}
	}

	/*
	 * Get the page controller instance
	 * @param logError Whether to log an error if the page controller is not found
	 * @returns The page controller instance
	 */
	getPageController(logError = true): PageController {
		const pageController = this._getOwner()?.getRootController?.();
		if (!pageController && logError) {
			Log.error("No sap.fe.core.PageController found");
		}
		return pageController!;
	}

	getMetaModel(): ODataMetaModel | undefined {
		const owner = this._getOwner();
		if (owner?.isA<TemplateComponent>("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent")) {
			let metaModel = owner?.getMetaModel(this.metaModel);
			// Fallback in case they don't apply the logic for the metamodel converter
			if (!metaModel && this.metaModel?.startsWith("id-")) {
				metaModel = getMetaModelById(this.metaModel);
			}
			return metaModel;
		} else {
			return owner?.getMetaModel(this.metaModel);
		}
	}

	override destroy(suppressInvalidate?: boolean): void {
		if (this.isA<IViewStateContributor<unknown> & ManagedObject>("sap.fe.core.controllerextensions.viewState.IViewStateContributor")) {
			this.getPageController(false)?.viewState?.deregisterStateContributor(this);
		}
		if (this.getPageController(false)) {
			removeControllerExtensionHookHandlers(this, this.getPageController()!);
		}
		this.notifyBBObservers(true);
		super.destroy(suppressInvalidate);
	}

	_checkIfMetadataReady(fromApplySettings = false): void {
		const owner = this._getOwner();
		if (owner) {
			this.onMetadataAvailable(owner);
			if (
				this.isA<IViewStateContributor<unknown> & ManagedObject>("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
			) {
				this.getPageController()?.viewState.registerStateContributor(this);
			}
			if (this.getPageController()) {
				initControllerExtensionHookHandlers(this, this.getPageController()!);
			}
		} else {
			if (!fromApplySettings && !this.content) {
				// In case couldn't create the content during the applySettings, try again
				Log.warning(
					"The building block was not created within an ExtensionAPI.runWithFPMContext call, for performance reason it's recommended to do so.",
					this as unknown as string
				);
			}

			this.attachEventOnce("modelContextChange", function (this: BuildingBlock): void {
				this._checkIfMetadataReady();
			});
		}
	}

	clone(sIdSuffix?: string, aLocalIds?: string[]): this {
		const owner = this._getOwner();
		if (owner) {
			return owner.runAsOwner(() => {
				return super.clone(sIdSuffix, aLocalIds);
			});
		} else {
			return super.clone(sIdSuffix, aLocalIds);
		}
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		// To be overriden by the child class
	}

	getAppComponent(): AppComponent | undefined {
		const owner = this._getOwner();
		return owner?.getAppComponent();
	}

	getDataModelObjectPath<N>(targetPath?: string): DataModelObjectPath<N> | undefined {
		const metaModel = this.getMetaModel();
		const targetPathToUse = targetPath ?? this.getOwnerContextPath();
		return getInvolvedDataModelObjectsForTargetPath(targetPathToUse!, metaModel);
	}

	/**
	 * Retrieves the context path from the owner component.
	 * @returns The context path
	 */
	getOwnerContextPath(): string | undefined {
		const owner = this._getOwner()!;
		return owner.getFullContextPath(this.metaModel);
	}

	/**
	 * Get the data model object for the given metapath and optional contextPath.
	 * @param metapath
	 * @param contextPath
	 * @returns The data model object path
	 */
	getDataModelObjectForMetaPath<ExpectedDataModelType>(
		metapath: string,
		contextPath?: string
	): DataModelObjectPath<ExpectedDataModelType> | undefined {
		const metaModel = this.getMetaModel();
		const contextPathToUse = this.getComputedContextPath(contextPath);

		let resolvedContextPath;
		if (contextPathToUse) {
			resolvedContextPath = contextPathToUse.endsWith("/") ? contextPathToUse : contextPathToUse + "/";
		}
		if (!metaModel || !(resolvedContextPath || metapath.charAt(0) === "/")) {
			throw new Error("No metamodel or metapath is not reachable with contextPath");
		}
		let metaContext = resolvedContextPath ? metaModel.createBindingContext(resolvedContextPath) : undefined;
		metaContext = metaContext ? metaContext : undefined;
		const metaPathContext = metaModel.createBindingContext(metapath, metaContext);
		return metaPathContext
			? MetaModelConverter.getInvolvedDataModelObjects<ExpectedDataModelType>(metaPathContext, metaContext)
			: undefined;
	}

	getComputedContextPath(contextPath?: string): string {
		let contextPathToUse = contextPath ?? this.getOwnerContextPath()!;
		if (contextPathToUse && !contextPathToUse.startsWith("/")) {
			contextPathToUse = this.getOwnerContextPath() + contextPathToUse;
		}
		return contextPathToUse;
	}

	/**
	 * Retrieves the MetaPath object for the given metaPath and optional contextPath.
	 * @param metaPath
	 * @param contextPath
	 * @returns A MetaPath pointing to the target {metaPath, contextPath}
	 */
	getMetaPathObject<ExpectedDataModelType>(metaPath: string, contextPath?: string): MetaPath<ExpectedDataModelType> | null {
		const metaModel = this.getMetaModel();
		const contextPathToUse = this.getComputedContextPath(contextPath);
		if (!metaModel || !(contextPathToUse || metaPath.charAt(0) === "/")) {
			Log.warning(`No metamodel or metaPath is not reachable with ${contextPath}:${metaPath}`);
			return null;
		}
		try {
			return new MetaPath(convertTypes(metaModel), metaPath, contextPathToUse);
		} catch (e) {
			Log.warning(`No metamodel or metaPath is not reachable with ${contextPath}:${metaPath}`);
			return null;
		}
	}

	protected createId(...stringParts: (string | undefined | DataModelObjectPath<AuthorizedIdAnnotationsType>)[]): string | undefined {
		// If the child instance has an ID property use it otherwise return undefined
		if (this.getId()) {
			return generate([this.getId(), ...stringParts]);
		}
		return undefined;
	}

	getTranslatedText(textID: string, parameters?: unknown[], metaPath?: string): string {
		return (
			((this.getModel("sap.fe.i18n") ?? this._getOwner()?.getModel("sap.fe.i18n")) as ResourceModel)?.getText(
				textID,
				parameters,
				metaPath
			) || textID
		);
	}

	getManifestWrapper(): ManifestWrapper | undefined {
		return this._getOwner()?.getManifestWrapper();
	}

	getOwnerPageDefinition(): DefinitionPage | undefined {
		return this._getOwner()?.preprocessorContext?.getDefinitionForPage();
	}
}

interface BuildingBlock<T extends UI5Element> {
	getContent(): T | undefined;
	getAriaLabelledBy(): string[];
}

export default BuildingBlock;

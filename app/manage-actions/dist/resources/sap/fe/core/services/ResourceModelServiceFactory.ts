import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/fe/core/ResourceModel";
import type BaseObject from "sap/ui/base/Object";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
type ResourceModelServiceSettings = {
	bundles: ResourceBundle[];
	enhanceI18n: string[];
};
export class ResourceModelService extends Service<ResourceModelServiceSettings> {
	initPromise!: Promise<this>;

	oFactory!: ResourceModelServiceFactory;

	oResourceModel!: ResourceModel;

	init(): void {
		const oContext = this.getContext();
		const mSettings = oContext.settings;
		this.oFactory = oContext.factory;

		// When enhancing i18n keys the value in the last resource bundle takes precedence
		// hence arrange various resource bundles so that enhanceI18n provided by the application is the last.
		// The following order is used :
		// 1. sap.fe bundle - sap.fe.core.messagebundle (passed with mSettings.bundles)
		// 2. sap.fe bundle - sap.fe.templates.messagebundle (passed with mSettings.bundles)
		// 3. Multiple bundles passed by the application as part of enhanceI18n
		const aBundles = mSettings.bundles.concat(mSettings.enhanceI18n || []).map(function (vI18n: ResourceModel | string) {
			// if value passed for enhanceI18n is a Resource Model, return the associated bundle
			// else the value is a bundleUrl, return Resource Bundle configuration so that a bundle can be created
			return typeof (vI18n as BaseObject).isA === "function" && (vI18n as BaseObject).isA("sap.ui.model.resource.ResourceModel")
				? ((vI18n as ResourceModel).getResourceBundle() as ResourceBundle)
				: { bundleName: (vI18n as string).replace(/\//g, ".") };
		});

		this.oResourceModel = new ResourceModel({
			bundleName: aBundles[0].bundleName,
			enhanceWith: aBundles.slice(1),
			async: true
		});

		if (oContext.scopeType === "component") {
			const oComponent = oContext.scopeObject;
			oComponent.setModel(this.oResourceModel, mSettings.modelName);
		}

		this.initPromise = Promise.all([
			this.oResourceModel.getResourceBundle() as Promise<ResourceBundle>,
			(this.oResourceModel as { _pEnhanced?: boolean })._pEnhanced || Promise.resolve()
		]).then((oBundle: unknown[]) => {
			(this.oResourceModel as { __bundle?: unknown }).__bundle = oBundle[0];
			return this;
		});
	}

	getResourceModel(): ResourceModel {
		return this.oResourceModel;
	}

	getInterface(): this {
		return this;
	}

	exit(): void {
		// Deregister global instance
		this.oFactory.removeGlobalInstance();
	}
}

class ResourceModelServiceFactory extends ServiceFactory<ResourceModelServiceSettings> {
	_oInstances: Record<string, ResourceModelService> = {};

	async createInstance(oServiceContext: ServiceContext<ResourceModelServiceSettings>): Promise<ResourceModelService> {
		const sKey =
			`${oServiceContext.scopeObject.getId()}_${oServiceContext.settings.bundles.join(",")}` +
			(oServiceContext.settings.enhanceI18n ? `,${oServiceContext.settings.enhanceI18n.join(",")}` : "");

		if (!this._oInstances[sKey]) {
			this._oInstances[sKey] = new ResourceModelService(Object.assign({ factory: this }, oServiceContext));
		}

		return this._oInstances[sKey].initPromise;
	}

	removeGlobalInstance(): void {
		this._oInstances = {};
	}
}

export default ResourceModelServiceFactory;

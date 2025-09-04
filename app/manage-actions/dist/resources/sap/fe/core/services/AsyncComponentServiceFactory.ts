import type AppComponent from "sap/fe/core/AppComponent";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";

type AsyncComponentSettings = {};

class AsyncComponentService extends Service<AsyncComponentSettings> {
	resolveFn!: Function;

	rejectFn!: () => void;

	initPromise!: Promise<this>;
	// !: means that we know it will be assigned before usage

	init(): void {
		this.initPromise = new Promise((resolve, reject) => {
			this.resolveFn = resolve;
			this.rejectFn = reject;
		});
		const oContext = this.getContext();
		const oComponent = oContext.scopeObject as AppComponent;
		const oServices = oComponent._getManifestEntry("sap.ui5", true).services;
		Promise.all(
			Object.keys(oServices)
				.filter(
					(sServiceKey) =>
						oServices[sServiceKey].startup === "waitFor" &&
						oServices[sServiceKey].factoryName !== "sap.fe.core.services.AsyncComponentService"
				)
				.map(async (sServiceKey: string): Promise<Service<unknown>> => {
					return oComponent.getService(sServiceKey).then((oServiceInstance: Service<unknown>) => {
						const sMethodName = `get${sServiceKey[0].toUpperCase()}${sServiceKey.substring(1)}`;
						if (!oComponent.hasOwnProperty(sMethodName)) {
							(oComponent as unknown as Record<string, unknown>)[sMethodName] = function (): unknown {
								return oServiceInstance;
							};
						}
						return oServiceInstance;
					});
				})
		)
			.then(async (allServices) => {
				await (oComponent as { pRootControlLoaded?: Promise<boolean> }).pRootControlLoaded;
				return allServices;
			})
			.then((allServices) => {
				// notifiy the component
				if (oComponent.onServicesStarted) {
					oComponent.onServicesStarted(allServices);
				}
				this.resolveFn(this);
				return;
			})
			.catch(this.rejectFn);
	}
}

class AsyncComponentServiceFactory extends ServiceFactory<AsyncComponentSettings> {
	async createInstance(oServiceContext: ServiceContext<AsyncComponentSettings>): Promise<AsyncComponentService> {
		const asyncComponentService = new AsyncComponentService(oServiceContext);
		return asyncComponentService.initPromise;
	}
}

export default AsyncComponentServiceFactory;

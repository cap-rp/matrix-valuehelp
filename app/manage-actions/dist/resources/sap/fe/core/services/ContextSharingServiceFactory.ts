import Log from "sap/base/Log";
import type ContextChannel from "sap/insights/channels/ContextChannel";
import type { IContextProvider } from "sap/insights/channels/ContextChannel";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";
import CommonUtils from "../CommonUtils";
import type { IShellServices } from "../services/ShellServicesFactory";
import type { EnvironmentCapabilitiesService } from "./EnvironmentServiceFactory";

export class ContextSharingService extends Service<ContextSharingServiceFactory> implements IContextProvider {
	initPromise!: Promise<ContextSharingService>;

	private appComponent!: AppComponent;

	private contextChannel!: ContextChannel;

	init(): void {
		this.initPromise = new Promise(async (resolve) => {
			this.appComponent = super.getContext.bind(this)().scopeObject as AppComponent;
			await this.registerProvider();
			resolve(this);
		});
	}

	onExit(): void {
		this.contextChannel?.unregisterProvider(this);
	}

	public async isContextChannelSupported(): Promise<boolean> {
		const environmentCapabilities = (await this.appComponent.getService("environmentCapabilities")) as EnvironmentCapabilitiesService;
		return (
			environmentCapabilities.getCapabilities().ContextSharingSupported && (await environmentCapabilities.isContextSharingEnabled())
		);
	}

	/**
	 * This function is responsible to register the current service as a provider for the Joule context.
	 */
	private async registerProvider(): Promise<void> {
		if (!(await this.isContextChannelSupported())) {
			return;
		}
		const { default: ContextChannel } = await import("sap/insights/channels/ContextChannel");
		// joule integration
		try {
			this.contextChannel = await ContextChannel.getInstance();
			this.contextChannel.registerProvider(this);
		} catch (err: unknown) {
			Log.error(err as string);
		}
	}

	getId(): string {
		return this.appComponent.getId();
	}

	/**
	 * Build a context related to the active view to be shared with the Joule Web Client.
	 *
	 * The custom property of this context can be enriched by overriding the #ContextSharing.getContext function.
	 * @returns A context object
	 */
	buildContext(): object {
		const shell = this.appComponent.getShellServices() as IShellServices & {
			getContext(): { scopeObject: AppComponent };
		};
		const view = CommonUtils.getCurrentPageView(this.appComponent);
		const app = this.appComponent.getManifestEntry("sap.app");
		/*
		 * Sample of context:
		 * {
		 * 	"app_title": "Manage Sales Orders (V2)",
		 * 	"cus.sd.salesorderv2.manage": {
		 * 		"app": {
		 * 			"view": "sap.fe.templates.ObjectPage.ObjectPage"
		 * 		},
		 * 		flp: {
		 * 			"hash": "#SalesOrder-manageV2&/SalesOrderManage('91375')"
		 * 		},
		 * 	"entity": {
		 * 		"servicePath": "/sap/opu/odata4/sap/c_salesordermanage_srv/srvd/sap/c_salesordermanage_sd/0001",
		 * 		"entityPath": "/SalesOrderManage(ID='91375')"
		 * 		}
		 *  "custom" : {
		 * 		"customProp": "customValue"
		 * 	}
		 * }
		 */
		const context = {
			app_title: app.title,
			[app.id]: {
				app: {
					view: view.getViewName()
				},
				flp: {
					hash: `${shell.getHash()}&/${shell.getContext().scopeObject.getRouterProxy().getHash()}`
				},
				entity: {
					servicePath: view.getModel().getServiceUrl(),
					entityPath: view.getBindingContext()?.getPath() ?? view.getViewData()?.fullContextPath
				}
			}
		};
		return view.getController().contextSharing.getContext(context);
	}

	async getContext(): Promise<object> {
		return Promise.resolve(this.buildContext());
	}
}

export default class ContextSharingServiceFactory extends ServiceFactory<ContextSharingServiceFactory> {
	public async createInstance(oServiceContext: ServiceContext<ContextSharingServiceFactory>): Promise<ContextSharingService> {
		const contextSharingService = new ContextSharingService(oServiceContext);
		return contextSharingService.initPromise;
	}
}

import Log from "sap/base/Log";
import Localization from "sap/base/i18n/Localization";
import type { IShellServices, PersonalizerType } from "sap/fe/core/services/ShellServicesFactory";
import HistoryOptOutProvider from "sap/fe/core/services/valueHelpService/HistoryOptOutProvider";
import EventBus from "sap/ui/core/EventBus";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type Extension from "sap/ushell/services/Extension";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";
import type { EnvironmentCapabilitiesService } from "./EnvironmentServiceFactory";

//
// Some remarks:
// To store history data in LREP via ushell personalisation service, we use the same data structures as in V2:
// - "Global" History Data: A mapping from appId to a uuid-like containerID; and a user-specific 'history enabled' switch
// - App History Data: A mapping from container ID to the valuehelp fields and its history data
// To avoid backend calls, we cache the data also in the class.
//

type AppIdType = string;
type ContainerIdType = string;

type GlobalHistoryDataType = {
	historyEnabled: boolean;
	suggestionsEnabled: boolean;
	apps: Record<AppIdType, ContainerIdType>;
};

export type FieldDataType = { [key: string]: string | number | boolean | FieldDataType };

type ContainerId2FieldDataType = Record<string, FieldDataType[] | undefined>;

type AppHistoryDataType = Record<ContainerIdType, ContainerId2FieldDataType>;

export type ValueHelpHistorySettings = {};

const APP_LANGUAGE = "@AppLanguage";

/**
 * @interface IValueHelpHistoryService
 */
export interface IValueHelpHistoryService {
	getHistoryEnabled(): Promise<boolean>;

	setHistoryEnabled(enabled: boolean): Promise<void>;

	deleteHistoryForAllApps(): Promise<void>;

	getFieldData(fieldPath: string): Promise<FieldDataType[]>;

	setFieldData(fieldPath: string, fieldData: FieldDataType[]): Promise<void>;

	getShellExtensionService(): Extension;
}

/**
 * Base implementation of the ValueHelpHistoryService
 *
 */
export class ValueHelpHistoryService extends Service<ValueHelpHistorySettings> implements IValueHelpHistoryService {
	private appId!: string; // set in init

	private historyOptOutProvider!: HistoryOptOutProvider;

	private shellServices!: IShellServices;

	private globalHistoryData?: GlobalHistoryDataType;

	private appHistoryData?: AppHistoryDataType;

	private globalPersonalizer?: PersonalizerType;

	private appPersonalizer?: PersonalizerType;

	private static readonly appDataKey = "sapui5.history";

	private static readonly maxHistoryItems = 5;

	/**
	 * Constructor for the class.
	 */
	init(): void {}

	/**
	 * Initialize the history service.
	 * It checks the enablement of the history service and starts the creation of the History opt-out dialog.
	 * @returns Promise that is resolved when environment service and shell service are checked.
	 */
	async initialize(): Promise<this> {
		const context = this.getContext(),
			appComponent = context.scopeObject as AppComponent;

		try {
			const [environmentCapabilities, shellServices] = await Promise.all([
				appComponent.getService("environmentCapabilities"),
				appComponent.getService("shellServices")
			]);
			this.shellServices = shellServices;
			this.appId = appComponent.getManifestEntry("sap.app").id || "unknownAppId";

			const hasUshell = (environmentCapabilities as EnvironmentCapabilitiesService).getCapabilities().UShell,
				enabled = (shellServices as IShellServices).getShellConfig()?.apps?.inputFieldHistory?.enabled;

			if (hasUshell && enabled) {
				this.historyOptOutProvider = new HistoryOptOutProvider(this);
			}
		} catch (err) {
			Log.error("Cannot retrieve EnvironmentCapabilities or ShellServices", err instanceof Error ? err.message : String(err));
		}
		return this;
	}

	/**
	 * Register the dedicated menu in the shell to maintain user preferences.
	 */
	public async registerShellHook(): Promise<void> {
		if (this.historyOptOutProvider) {
			await this.historyOptOutProvider.createOptOutUserProfileEntry();

			// If the mneu was never loaded, on first load it removes all the custom actions
			EventBus.getInstance().subscribeOnce("shell", "userActionsMenuCompLoaded", async () => {
				await this.historyOptOutProvider.createOptOutUserProfileEntry();
			});
		}
	}

	/**
	 * Get the shell extension service.
	 * This is used by the HistOptOutProvider to add a user menu entry.
	 * @returns Shell extension service
	 */
	getShellExtensionService(): Extension {
		return this.shellServices.getExtensionService();
	}

	/**
	 * Get the personalizer from the shell service.
	 * @param containerId The container ID to access the personalization data
	 * @param itemId The item ID to access the personalization data
	 * @returns Personalizer from the shell service
	 */
	private async getPersonalizer(containerId: string, itemId: string): Promise<PersonalizerType> {
		const persIdObj = {
				container: containerId,
				item: itemId
			},
			scope = {}; // use defaults from shellServices

		return this.shellServices.getPersonalizer(persIdObj, scope, undefined);
	}

	//
	// The following methodsare based on: sap\ui\comp\historyvalues\HistoryGlobalDataService.js
	//

	/**
	 * Get the global personalizer from the shell service and store it in this class.
	 * @returns Global personalizer from the shell service
	 */
	private async getGlobalPersonalizer(): Promise<PersonalizerType> {
		if (!this.globalPersonalizer) {
			const historyPrefix = "sapui5.history.";
			const containerId = historyPrefix + "HistorySettings";
			const itemId = historyPrefix + "settings";
			this.globalPersonalizer = await this.getPersonalizer(containerId, itemId);
		}
		return this.globalPersonalizer;
	}

	/**
	 * Get the global history default data.
	 * This is the initial data structure if no global history data is stored yet.
	 * @returns Global history default data
	 */
	private getGlobalDefaultData(): GlobalHistoryDataType {
		return {
			historyEnabled: true,
			suggestionsEnabled: false,
			apps: {}
		};
	}

	/**
	 * Get the global history data from the personalization service or create default data.
	 * @returns Promise which is resolved to global history data
	 */
	private async getGlobalHistoryData(): Promise<GlobalHistoryDataType> {
		if (!this.globalHistoryData) {
			const globalPersonalizer = await this.getGlobalPersonalizer();
			const persData = (await globalPersonalizer.getPersData()) as GlobalHistoryDataType | undefined;
			this.globalHistoryData = persData ? { ...persData } : this.getGlobalDefaultData();
		}
		return this.globalHistoryData;
	}

	/**
	 * Get the status of the user-specific history enabled switch from the global history data.
	 * @returns Promise which is resolved to a boolean value for the history enabled switch
	 */
	async getHistoryEnabled(): Promise<boolean> {
		// The history enabled switch which can be changed in the 'Input History Settings' dialog.
		const globalHistoryData = await this.getGlobalHistoryData();

		return globalHistoryData.historyEnabled;
	}

	/**
	 * Set the the status of the user-specific history enabled switch in the global history data.
	 * @param enabled A boolean value for the history enabled switch
	 * @returns Promise which is resolved when the status is changed in the personalization data
	 */
	async setHistoryEnabled(enabled: boolean): Promise<void> {
		const globalHistoryData = await this.getGlobalHistoryData();

		globalHistoryData.historyEnabled = enabled;
		const globalPersonalizer = await this.getGlobalPersonalizer();
		globalPersonalizer.setPersData(globalHistoryData);
	}

	//
	// The following methodsare based on: sap\ui\comp\historyvalues\HistoryAppDataService.js
	//

	/**
	 * Create a random UUID-like container ID.
	 * @returns Container ID
	 */
	private static createAppContainerId(): string {
		// Here we use the same coding as in V2 to create a random UUID-like container ID
		const uuid = "xxxxxxxx.xxxx.4xxx.yxxx.xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
			let random = (Math.random() * 16) | 0;

			if (char === "y") {
				random = (random & 0x3) | 0x8;
			}

			return random.toString(16);
		});

		return "ui5." + uuid;
	}

	/**
	 * Add an entry for an app ID to the global history data.
	 * The entry is a mapping for an app ID to a container ID.
	 * @param globalHistoryData The global history data structure
	 * @param appId The app ID
	 * @returns Newly created container ID
	 */
	private async addAppToGlobalHistory(globalHistoryData: GlobalHistoryDataType, appId: string): Promise<string> {
		const containerId = ValueHelpHistoryService.createAppContainerId();

		globalHistoryData.apps[appId] = containerId;
		const globalPersonalizer = await this.getGlobalPersonalizer();
		globalPersonalizer.setPersData(globalHistoryData);

		return containerId;
	}

	/**
	 * Get the app personalizer from the shell service and store it in this class.
	 * @returns Promise which is resolved to the app personalizer from the shell service.
	 */
	private async getAppPersonalizer(): Promise<PersonalizerType> {
		if (!this.appPersonalizer) {
			const globalHistoryData = await this.getGlobalHistoryData(),
				apps = globalHistoryData.apps,
				containerId = apps[this.appId] || (await this.addAppToGlobalHistory(globalHistoryData, this.appId)),
				itemId = "sapui5.history.appData";

			this.appPersonalizer = await this.getPersonalizer(containerId, itemId);
		}
		return this.appPersonalizer;
	}

	/**
	 * Get the app-specific history default data.
	 * This is the initial data structure if no app history data is stored yet.
	 * @returns App history default data
	 */
	private getAppDefaultData(): AppHistoryDataType {
		const appHistoryData: AppHistoryDataType = {};
		appHistoryData[ValueHelpHistoryService.appDataKey] = {};
		return appHistoryData;
	}

	/**
	 * Get the app-specific history data from the personalization service or create default data.
	 * @returns Promise which is resolved to app history data
	 */
	private async getAppHistoryData(): Promise<AppHistoryDataType> {
		if (!this.appHistoryData) {
			const appPersonalizer = await this.getAppPersonalizer(),
				persData = (await appPersonalizer.getPersData?.()) as AppHistoryDataType | undefined;

			this.appHistoryData = persData ? { ...persData } : this.getAppDefaultData(); // In V2 the data is copied. Do we need to copy it?
		}
		return this.appHistoryData;
	}

	/**
	 * Get the field data for a field path from the personalization service.
	 * @param fieldPath The field path
	 * @returns Promise which is resolved to a list of field data
	 */
	private async getFieldDataFromService(fieldPath: string): Promise<FieldDataType[]> {
		const appHistoryData = await this.getAppHistoryData(),
			appData = appHistoryData[ValueHelpHistoryService.appDataKey],
			fieldData = appData[fieldPath];

		// remove entries with different language
		const appLanguage = Localization.getLanguage();
		return fieldData?.filter((data) => data[APP_LANGUAGE] === appLanguage) || [];
	}

	/**
	 * Set the field data for a field path in the personalization service.
	 * @param fieldPath The field path
	 * @param data List of field data
	 * @returns Promise which is resolved when the field data is set
	 */
	private async setFieldDataWithService(fieldPath: string, data: FieldDataType[]): Promise<void> {
		const historyAppData = await this.getAppHistoryData(),
			appData = historyAppData[ValueHelpHistoryService.appDataKey],
			appPersonalizer = await this.getAppPersonalizer();

		appData[fieldPath] = data;

		return appPersonalizer.setPersData(historyAppData);
	}

	/**
	 * Get a field data list with distinct entries.
	 * @param dataList A list of field data with possible duplicate entries
	 * @returns List of field data with distinct enrtries
	 */
	private static getDistinct(dataList: FieldDataType[]): FieldDataType[] {
		const uniqueFlags = {} as Record<string, boolean>,
			distinct = [] as FieldDataType[];

		for (const data of dataList) {
			const key = Object.values(data).join();
			if (!uniqueFlags[key]) {
				distinct.push(data);
				uniqueFlags[key] = true;
			}
		}

		return distinct;
	}

	/**
	 * Deletes the history data for all apps from the personalization data.
	 * This method deletes all app-specific personalization data entries.
	 * The global history entry is kept, so the mapping from app ID to container ID can be reused.
	 * @returns Promise which is resolved when the history data is deleted.
	 */
	async deleteHistoryForAllApps(): Promise<void> {
		const shellServices = this.shellServices,
			globalHistoryData = await this.getGlobalHistoryData(),
			deletePromises: Promise<unknown>[] = [],
			appIds = globalHistoryData.apps;

		for (const key of Object.keys(appIds)) {
			deletePromises.push(shellServices.deletePersonalizationContainer(appIds[key], undefined)); // ts
		}
		this.appHistoryData = undefined; // delete also cached app history data
		await Promise.all(deletePromises);
	}

	/**
	 * Get the field data for a field path from the personalization service if the history service is enabled.
	 * The history service is enabled if the shell switch and the user-specific switch are both enabled.
	 * @param fieldPath The field path
	 * @returns Promise which is resolved to a list of field data
	 */
	async getFieldData(fieldPath: string): Promise<FieldDataType[]> {
		const historyEnabledShell = Boolean(this.historyOptOutProvider),
			historyEnabledUser = await this.getHistoryEnabled();

		if (historyEnabledShell && historyEnabledUser) {
			// removing the key-value pair that were added for internal usage purposes in the history service (key starts with '@') and returns only the data which is shown on the UI.
			const fieldData = await this.getFieldDataFromService(fieldPath);
			return fieldData.map((obj) =>
				Object.entries(obj)
					.filter(([key, _]) => !key.startsWith("@"))
					.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {})
			);
		}
		return [];
	}

	/**
	 * Set the field data for a field path in the personalization service if the history service is enabled.
	 * The history service is enabled if the shell switch and the user-specific switch are both enabled.
	 * @param fieldPath The field path
	 * @param fieldData List of field data
	 * @returns Promise which is resolved when the field data is set
	 */
	async setFieldData(fieldPath: string, fieldData: FieldDataType[]): Promise<void> {
		const historyEnabledShell = Boolean(this.historyOptOutProvider),
			historyEnabledUser = await this.getHistoryEnabled();

		if (historyEnabledShell && historyEnabledUser) {
			// Add the current language to every field data entry
			const appLanguage = Localization.getLanguage();
			for (const data of fieldData) {
				data[APP_LANGUAGE] = appLanguage;
			}
			const fieldOldData = await this.getFieldDataFromService(fieldPath),
				dataToSet = ValueHelpHistoryService.getDistinct(fieldData.reverse().concat(fieldOldData)).slice(
					0,
					ValueHelpHistoryService.maxHistoryItems
				);

			return this.setFieldDataWithService(fieldPath, dataToSet);
		}
	}
}

/**
 * Service Factory for the ValueHelpHistoryService
 *
 */
export default class ValueHelpHistoryServiceFactory extends ServiceFactory<ValueHelpHistorySettings> {
	private instance!: ValueHelpHistoryService;

	async createInstance(serviceContext: ServiceContext<ValueHelpHistorySettings>): Promise<ValueHelpHistoryService> {
		this.instance = new ValueHelpHistoryService(serviceContext);
		return this.instance.initialize();
	}

	getInstance(): ValueHelpHistoryService {
		return this.instance;
	}
}

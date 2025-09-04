import Log from "sap/base/Log";
import uid from "sap/base/util/uid";
import { defineReference, defineState, defineUI5Class } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import CheckBox from "sap/m/CheckBox";
import Title from "sap/m/Title";
import VBox from "sap/m/VBox";
import ManagedObject from "sap/ui/base/ManagedObject";
import Lib from "sap/ui/core/Lib";
import type Container from "sap/ushell/Container";
import type Extension from "sap/ushell/services/Extension";
import type PersonalizationV2 from "sap/ushell/services/PersonalizationV2";

export type PersonalizationWithConstants = PersonalizationV2 & {
	constants: {
		keyCategory: {
			FIXED_KEY: string;
			GENERATED_KEY: string;
		};
		writeFrequency: {
			HIGH: string;
			LOW: string;
		};
	};
};

type FrameBoundExtension = {
	addGroupedUserSettingsEntry: (settings: unknown) => Promise<void>;
};
type PersonalizerType = {
	getPersData: () => Promise<object>;
	setPersData: (persData: object) => Promise<void>;
};

type ShellHistorySettings = {
	isHistoryEnabled: boolean;
	apps: Record<string, string>;
};

type ShellAppHistorySettings = {
	recentQueries: string[];
	favoriteQueries: string[];
};

@defineUI5Class("sap.fe.controls.easyFilter.ShellHistoryProvider")
export default class ShellHistoryProvider extends ManagedObject {
	@defineState()
	private state = {
		isHistoryEnabled: true,
		apps: {} as Record<string, string>,
		recentQueries: [] as readonly string[],
		favoriteQueries: [] as readonly string[]
	};

	private static instances: Set<ShellHistoryProvider> = new Set();

	constructor(
		private readonly personalizationService: PersonalizationWithConstants,
		private readonly globalPersonalizer: PersonalizerType,
		private readonly appPersonalizer: PersonalizerType,
		private readonly data: ShellHistorySettings,
		private readonly appData: ShellAppHistorySettings
	) {
		super();
		ShellHistoryProvider.instances.add(this);
		this.state.isHistoryEnabled = data.isHistoryEnabled;
		this.state.apps = data.apps;
		this.state.recentQueries = appData.recentQueries;
		this.state.favoriteQueries = appData.favoriteQueries;
	}

	private static resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;

	private static $form: VBox;

	@defineReference()
	private static $defaultOption: Ref<CheckBox>;

	@defineReference()
	private static $historyEnabled: Ref<CheckBox>;

	static getShellDialogContent(selectedValue: boolean): VBox {
		this.$form = (
			<VBox>
				<Title text={this.resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_EASY_FILTER")}></Title>
				<CheckBox
					ref={this.$historyEnabled}
					selected={selectedValue}
					text={this.resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_EASY_FILTER_KEEP_QUERIES")}
				/>
			</VBox>
		) as VBox;
		return this.$form;
	}

	static saveShellDialog(): void {
		const currentSelectedState = ShellHistoryProvider.$historyEnabled.current!.getSelected();
		//updating the value in all the objects
		this.instances.forEach((instance) => {
			instance.state.isHistoryEnabled = currentSelectedState;
		});
	}

	async onStateChange(): Promise<void> {
		// We confirm the value of the switch
		await this.globalPersonalizer.setPersData({
			isHistoryEnabled: this.state.isHistoryEnabled,
			apps: this.state.apps
		});
		await this.appPersonalizer.setPersData({ recentQueries: this.state.recentQueries, favoriteQueries: this.state.favoriteQueries });
	}

	isHistoryEnabled(): boolean {
		return this.state.isHistoryEnabled.valueOf();
	}

	getRecentQueries(): string[] {
		return this.state.recentQueries.concat();
	}

	getFavoriteQueries(): string[] {
		return this.state.favoriteQueries.concat();
	}

	setRecentQueries(recentQueries: readonly string[]): void {
		this.state.recentQueries = recentQueries;
	}

	setFavoriteQueries(favoriteQueries: readonly string[]): void {
		this.state.favoriteQueries = favoriteQueries;
	}

	static instance: Promise<ShellHistoryProvider | undefined>;

	static isDialogAdded = false;

	static async getInstance(appId: string): Promise<ShellHistoryProvider | undefined> {
		// Register the extension
		const shellContainer = sap.ui.require("sap/ushell/Container") as Container | undefined;
		try {
			if (shellContainer) {
				let resolveCreation!: Function;
				this.instance = new Promise<ShellHistoryProvider | undefined>((resolve) => {
					resolveCreation = resolve;
				});
				const extensionService = (await shellContainer.getServiceAsync("Extension")) as Extension | undefined;
				const frameBoundExtension = (await shellContainer.getServiceAsync("FrameBoundExtension")) as
					| FrameBoundExtension
					| undefined;
				const personalizationService = (await shellContainer.getServiceAsync("PersonalizationV2")) as
					| PersonalizationWithConstants
					| undefined;
				if (extensionService && personalizationService && frameBoundExtension) {
					const shellHistoryProvider = await ShellHistoryProvider.registerUserAction(
						extensionService,
						personalizationService,
						frameBoundExtension,
						appId
					);
					resolveCreation(shellHistoryProvider);
				}
			}
		} catch (e) {
			Log.error("Cannot register extension", e instanceof Error ? e.message : String(e));
		}
		return this.instance;
	}

	static async registerUserAction(
		shellExtensionService: Extension,
		personalizationService: PersonalizationWithConstants,
		frameBoundExtension: FrameBoundExtension,
		appId: string
	): Promise<ShellHistoryProvider | undefined> {
		try {
			const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
			const scope = {
				clientStorageAllowed: false,
				keyCategory: personalizationService.constants.keyCategory.FIXED_KEY,
				validity: Infinity,
				writeFrequency: personalizationService.constants.writeFrequency.LOW
			};
			const globalPersonalizer = (await personalizationService.getPersonalizer(
				{
					container: "sap.fe.easyFilter",
					item: "settings"
				},
				scope
			)) as PersonalizerType;
			let globalData = (await globalPersonalizer.getPersData()) as ShellHistorySettings | undefined;
			if (!globalData) {
				// In case defaut value don't exist we create it
				globalData = {
					isHistoryEnabled: true,
					apps: {
						[appId]: uid()
					}
				};
				globalPersonalizer.setPersData(globalData);
			} else if (!globalData.apps?.[appId]) {
				globalData.apps ??= {};
				globalData.apps[appId] = uid();
				await globalPersonalizer.setPersData(globalData);
			}
			const appPersonalizer = (await personalizationService.getPersonalizer(
				{
					container: "sap.fe.easyFilter" + globalData.apps[appId],
					item: "recentQueries"
				},
				scope
			)) as PersonalizerType;
			let appData = (await appPersonalizer.getPersData()) as ShellAppHistorySettings | undefined;
			if (!appData) {
				appData = {
					recentQueries: [],
					favoriteQueries: []
				};
				await appPersonalizer.setPersData(appData);
			}
			const shellHistoryDialog = new ShellHistoryProvider(
				personalizationService,
				globalPersonalizer,
				appPersonalizer,
				globalData,
				appData
			);
			if (!this.isDialogAdded) {
				this.isDialogAdded = true;
				await frameBoundExtension.addGroupedUserSettingsEntry({
					title: resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_TITLE"),
					icon: "sap-icon://laptop",
					entryHelpId: "userActivitiesEntry",
					groupingId: "userActivities",
					groupingTabTitle: resourceBundle.getText("M_BUSINESS_AI_SHELL_SETTINGS_TITLE"),
					groupingTabHelpId: "sapBusinessAI-helpId",
					value: async () => {
						return Promise.resolve();
					},
					content: async () => {
						return Promise.resolve(this.getShellDialogContent(globalData?.isHistoryEnabled as boolean));
					},
					onSave: () => {
						this.saveShellDialog();
					},
					onCancel: () => {
						//return (this.viewInstance.getController() as RequestSettingsController).onCancel();
					}
				});
			}
			return shellHistoryDialog;
		} catch (err) {
			Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
		}
	}
}

import Log from "sap/base/Log";
import type { HiddenDraft } from "sap/fe/core/converters/ManifestSettings";
import VersionInfo from "sap/ui/VersionInfo";
import Library from "sap/ui/core/Lib";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type Navigation from "sap/ushell/services/Navigation";
import type { ServiceContext } from "types/metamodel_types";

type OptionalFeatureDefinition = {
	intent: string;
	library: string;
	imports?: string;
};
/**
 * Configuration for the optional features.
 */
const OptionalFeatures: Record<string, OptionalFeatureDefinition> = {
	SmartSummarize: { intent: "IntelligentPrompt-summarize", library: "ux.eng.fioriai.reuse", imports: "ux/eng/fioriai/reuse/library" },
	MagicFiltering: {
		intent: "IntelligentPrompt-filter",
		library: "ux.eng.fioriai.reuse",
		imports: "ux/eng/fioriai/reuse/easyfilter/EasyFilter"
	},
	ErrorExplanation: {
		intent: "IntelligentPrompt-explain",
		library: "ux.eng.fioriai.reuse",
		imports: "ux/eng/fioriai/reuse/errorexplanation/ErrorExplanation"
	},
	EasyEdit: {
		intent: "IntelligentPrompt-fill",
		library: "ux.eng.fioriai.reuse",
		imports: "ux/eng/fioriai/reuse/easyfill/EasyFill"
	}
};
type FeatureName = keyof typeof OptionalFeatures;

export type EnvironmentCapabilities = {
	Chart: boolean;
	MicroChart: boolean;
	Collaboration: boolean;
	UShell: boolean;
	IntentBasedNavigation: boolean;
	AppState: boolean;
	DisableInputAssistance: boolean;
	InsightsSupported: boolean;
	ContextSharingSupported: boolean;
	HiddenDraft: HiddenDraft | boolean;
} & {
	loadLibrary?(library: string): Promise<boolean>;
} & {
	[featureName: string]: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const DefaultEnvironmentCapabilities: Readonly<EnvironmentCapabilities> = {
	Chart: true,
	MicroChart: true,
	Collaboration: false,
	UShell: true,
	IntentBasedNavigation: true,
	AppState: true,
	InsightsSupported: false,
	ContextSharingSupported: false,
	SmartSummarize: false,
	MagicFiltering: false,
	EasyEdit: false,
	ErrorExplanation: false,
	DisableInputAssistance: false,
	HiddenDraft: false,
	loadLibrary: async (libraryName): Promise<boolean> => {
		return EnvironmentCapabilitiesService.resolveLibrary(libraryName);
	}
};
export class EnvironmentCapabilitiesService extends Service<EnvironmentCapabilities> {
	rejectFn!: () => void;

	initPromise!: Promise<this>;

	environmentCapabilities!: EnvironmentCapabilities;

	// !: means that we know it will be assigned before usage
	private optionalFeatureLibraries: Partial<Record<FeatureName, { url: string; name: string; imports?: string }>> = {};

	/**
	 * Prepares the feature for usage.
	 *
	 * This function loads the library registered for the feature.
	 * @param feature The feature to prepare.
	 * @throws Error if the feature is unavailable.
	 */
	async prepareFeature(feature: FeatureName): Promise<void> {
		const library = this.optionalFeatureLibraries[feature];
		if (!library) {
			throw new Error(`Feature '${feature}' is unavailable`);
		}

		await Library.load(library);
	}

	async initialize(): Promise<void> {
		const oContext = this.getContext();
		this.environmentCapabilities = Object.assign({}, DefaultEnvironmentCapabilities) as EnvironmentCapabilities;

		const shellContainer = sap.ui.require("sap/ushell/Container");
		const versionInfo = await VersionInfo.load();
		this.environmentCapabilities.Chart = versionInfo.libraries.some((lib) => lib.name === "sap.viz");
		this.environmentCapabilities.MicroChart = versionInfo.libraries.some((lib) => lib.name === "sap.suite.ui.microchart");
		this.environmentCapabilities.Collaboration = versionInfo.libraries.some((lib) => lib.name === "sap.suite.ui.commons");
		if (this.environmentCapabilities.Collaboration) {
			await EnvironmentCapabilitiesService.resolveLibrary("sap.suite.ui.commons");
		}
		this.environmentCapabilities.UShell = !!shellContainer;
		this.environmentCapabilities.IntentBasedNavigation = !!shellContainer;
		this.environmentCapabilities.InsightsSupported = versionInfo.libraries.some((lib) => lib.name === "sap.insights");
		this.environmentCapabilities.ContextSharingSupported = versionInfo.libraries.some((lib) => lib.name === "sap.insights");
		const hideDraft = oContext.scopeObject.getManifestEntry("sap.fe")?.app?.hideDraft;
		if (hideDraft?.enabled) {
			this.environmentCapabilities.HiddenDraft = {
				enabled: true,
				stayOnCurrentPageAfterSave: hideDraft.stayOnCurrentPageAfterSave,
				stayOnCurrentPageAfterCancel: hideDraft.stayOnCurrentPageAfterCancel,
				hideCreateNext: hideDraft.hideCreateNext
			};
		}
		// Initialize optional features
		const navigationService: Navigation | undefined = await shellContainer?.getServiceAsync("Navigation");

		for (const [featureName, feature] of Object.entries(OptionalFeatures)) {
			// The feature is off by default. Only if there is a shell and the intent resolves, the feature is available
			this.environmentCapabilities[featureName] = false;

			if (navigationService) {
				try {
					// Resolve by intent:
					//  - intent resolves 		  ==> feature available, provided by the library located at the returned URL
					//  - intent does not resolve ==> resolveIntent() throws an error ==> feature unavailable
					const { url } = await navigationService.resolveIntent(`#${feature.intent}`);
					this.optionalFeatureLibraries[featureName] = { name: feature.library, url: url, imports: feature.imports };

					if (feature.imports) {
						try {
							await Library.load(this.optionalFeatureLibraries[featureName]!);
							await import(feature.imports);
							this.environmentCapabilities[featureName] = true;
						} catch (e) {
							this.environmentCapabilities[featureName] = false;
						}
					} else {
						this.environmentCapabilities[featureName] = true;
					}
				} catch (e) {
					// Feature unavailable
					Log.info(`Feature unavailable ${featureName}: ${(e as { message: string; stack: string })?.message}`);
				}
			}
		}

		this.environmentCapabilities = Object.assign(this.environmentCapabilities, oContext.settings);
	}

	static async resolveLibrary(libraryName: string): Promise<boolean> {
		return new Promise(function (resolve) {
			Library.load({ name: `${libraryName}` })
				.then(function () {
					resolve(true);
					return;
				})
				.catch(function () {
					resolve(false);
				});
		});
	}

	public setCapabilities(oCapabilities: EnvironmentCapabilities): void {
		this.environmentCapabilities = oCapabilities;
	}

	public setCapability(capability: keyof EnvironmentCapabilities, value: boolean): void {
		this.environmentCapabilities[capability] = value;
	}

	public getCapabilities(): EnvironmentCapabilities {
		return this.environmentCapabilities;
	}

	/**
	 * Checks if insights are enabled on the home page.
	 * @returns True if insights are enabled on the home page.
	 */
	async isInsightsEnabled(): Promise<boolean> {
		// insights is enabled
		return new Promise<boolean>(async (resolve) => {
			try {
				// getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
				const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
				if (isLibAvailable) {
					// we also need to preload comp as insights is using it without declaring it e_e
					await EnvironmentCapabilitiesService.resolveLibrary("sap.ui.comp");
					sap.ui.require(["sap/insights/CardHelper"], async (CardHelper: { getServiceAsync: Function }) => {
						try {
							await CardHelper.getServiceAsync("UIService");
							resolve(!(await getMSTeamsActive()));
						} catch {
							resolve(false);
						}
					});
				} else {
					resolve(false);
				}
			} catch {
				resolve(false);
			}
		});
	}

	/**
	 * Checks if insights context channel is enabled .
	 * @returns True if enabled.
	 */
	async isContextSharingEnabled(): Promise<boolean> {
		// getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
		const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
		if (isLibAvailable) {
			// we also need to preload comp as insights is using it without declaring it e_e
			await EnvironmentCapabilitiesService.resolveLibrary("sap.ui.comp");
			try {
				await import("sap/insights/channels/ContextChannel");
			} catch (e) {
				return false;
			}
			return true;
		} else {
			return false;
		}
	}

	getInterface(): this {
		return this;
	}
}

export class EnvironmentServiceFactory extends ServiceFactory<EnvironmentCapabilities> {
	async createInstance(oServiceContext: ServiceContext<Partial<EnvironmentCapabilities>>): Promise<EnvironmentCapabilitiesService> {
		const environmentCapabilitiesService = new EnvironmentCapabilitiesService(oServiceContext);
		await environmentCapabilitiesService.initialize();
		return environmentCapabilitiesService;
	}
}

/**
 * Checks if the application is opened on Microsoft Teams.
 * @returns True if the application is opened on Microsoft Teams.
 */
export async function getMSTeamsActive(): Promise<boolean> {
	let isTeamsModeActive = false;
	try {
		await EnvironmentCapabilitiesService.resolveLibrary("sap.suite.ui.commons");
		const { default: CollaborationHelper } = await import("sap/suite/ui/commons/collaboration/CollaborationHelper");
		isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
	} catch {
		return false;
	}
	return isTeamsModeActive;
}

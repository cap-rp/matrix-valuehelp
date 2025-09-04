import Log from "sap/base/Log";
import type Popover from "sap/m/Popover";
import type {
	CollaborationOptionParams,
	CollaborationOptions,
	ContactStatus,
	ContactOption as TeamsContactOption,
	default as TeamsHelperService
} from "sap/suite/ui/commons/collaboration/TeamsHelperService";
import type {
	default as CollaborationManagerService
} from "sap/suite/ui/commons/collaboration/CollaborationManagerService";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
type CollaborativeToolsServiceSettings = {};
type TeamsConnection = {
	isInitialized: boolean;
	isContactsCollaborationSupported?: boolean;
	teamsHelperService?: TeamsHelperService;
	contactOptions?: TeamsContactOption[];
	cmHelperService?: CollaborationManagerService;
};
type CollaborationService = {
	oTeamsHelperService: TeamsHelperService,
	oCMHelperService: CollaborationManagerService
}
export class CollaborativeToolsService extends Service<CollaborativeToolsServiceSettings> {
	initPromise!: Promise<CollaborativeToolsService>;

	collaborationService!: TeamsConnection;

	oFactory!: CollaborativeToolsServiceFactory;

	init(): void {
		this.collaborationService = {
			isInitialized: false
		};

		this.initPromise = Promise.resolve(this);
	}

	getInterface(): CollaborativeToolsService {
		return this;
	}

	private async initializeMSTeams(): Promise<void> {
		try {
			const collaborationService = await this.getCollaborationServices();
			this.collaborationService.isInitialized = true;
			this.collaborationService.teamsHelperService = collaborationService.oTeamsHelperService;
			this.collaborationService.isContactsCollaborationSupported =
				//await helperService.isTeamsModeActive() && // this checks for url params appState=lean&sap-collaboration-teams=true
				typeof collaborationService.oTeamsHelperService.isContactsCollaborationSupported === "function" && collaborationService.oTeamsHelperService.isContactsCollaborationSupported();
			this.collaborationService.cmHelperService = collaborationService.oCMHelperService;
		} catch (e) {
			Log.info("Couldn't evaluate the support for contacts collaboration in MS Teams");
		}
	}

	public async getMailPopoverFromMsTeamsIntegration(mail: string): Promise<Popover | undefined> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		try {
			return await this.collaborationService.teamsHelperService?.enableContactsCollaboration(mail);
		} catch {
			return undefined;
		}
	}

	async isContactsCollaborationSupported(): Promise<boolean> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		return this.collaborationService.isContactsCollaborationSupported === true;
	}

	public async getTeamContactStatus(email: string): Promise<ContactStatus[] | undefined> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		if (!this.collaborationService.isContactsCollaborationSupported) {
			return undefined;
		}

		try {
			return await this.collaborationService.teamsHelperService?.getTeamsContactStatus(email);
		} catch {
			return undefined;
		}
	}

	public async getTeamContactOptions(): Promise<TeamsContactOption[] | undefined> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		if (!this.collaborationService.isContactsCollaborationSupported) {
			return undefined;
		}
		if (!this.collaborationService.contactOptions) {
			try {
				this.collaborationService.contactOptions = await this.collaborationService.teamsHelperService?.getTeamsContactCollabOptions();
			} catch {
				return undefined;
			}
		}
		return this.collaborationService.contactOptions;
	}

	public async getTeamContactOption(option: "call" | "chat" | "videoCall"): Promise<TeamsContactOption | undefined> {
		const contactOptions = await this.getTeamContactOptions();
		let contactOption;
		if (contactOptions) {
			for (let i = 0; i < contactOptions.length; i++) {
				if (contactOptions[i].key === option) {
					contactOption = contactOptions[i];
					break;
				}
			}
		}
		return contactOption;
	}

	public async getTeamsCollabOptionsViaShare(params: CollaborationOptionParams): Promise<CollaborationOptions[] | undefined> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		return this.collaborationService.teamsHelperService?.getOptions(params);
	}

	public async getCollaborationManagerOption(): Promise<CollaborationOptions | undefined> {
		if (!this.collaborationService.isInitialized) {
			await this.initializeMSTeams();
		}
		return this.collaborationService.cmHelperService?.getOptions();
	}

	public async getCollaborationServices(): Promise<CollaborationService> {
		const { default: ServiceContainerClass } = await import("sap/suite/ui/commons/collaboration/ServiceContainer");
		return ServiceContainerClass.getCollaborationServices();
	}
}

class CollaborativeToolsServiceFactory extends ServiceFactory<CollaborativeToolsServiceSettings> {
	public static CollaborativeToolsServiceClass = CollaborativeToolsService;

	async createInstance(serviceContext: ServiceContext<CollaborativeToolsServiceSettings>): Promise<CollaborativeToolsService> {
		const collaborativeToolsService = new CollaborativeToolsService(serviceContext);
		return collaborativeToolsService.initPromise;
	}
}
export default CollaborativeToolsServiceFactory;

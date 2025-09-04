import { defineUI5Class, extensible, methodOverride, publicExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type { CollaborationManagerService, WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { EnvironmentCapabilitiesService } from "sap/fe/core/services/EnvironmentServiceFactory";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";

/**
 * An implementation for controller extension used internally in sap.fe for central functionalities to serve collaboration manager use cases.
 * @since 1.120.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.cards.CollaborationManager")
export default class CollaborationManagerExtension extends ControllerExtension {
	protected base!: PageController;

	protected feView!: FEView;

	private appComponent!: AppComponent;

	private serviceEnabled!: boolean;

	constructor() {
		super();
		(this as unknown as { init: Function }).init();
	}

	@methodOverride()
	onInit(): void {
		const asyncOnInit = async function (this: CollaborationManagerExtension): Promise<void> {
			this.feView = this.base.getView();
			this.appComponent = CommonUtils.getAppComponent(this.feView);
			const environmentCapabilities = (await this.appComponent.getService(
				"environmentCapabilities"
			)) as EnvironmentCapabilitiesService;

			this.serviceEnabled = true;
			// Only connect to the Collaboration Manager if it is explicitly enabled and the sap.insights library is loaded
			if (
				!this.appComponent["isCollaborationManagerServiceEnabled"]() ||
				!environmentCapabilities.getCapabilities().InsightsSupported ||
				!(await environmentCapabilities.isInsightsEnabled())
			) {
				this.serviceEnabled = false;
			}
		};
		asyncOnInit.apply(this);
	}

	@methodOverride("_routing")
	async onAfterBinding(): Promise<void> {
		if (this.serviceEnabled === false) {
			return;
		}
		await this.getService().connect(this.appComponent.getId(), async () => {
			const cards: WrappedCard[] = [];
			await this.collectAvailableCards(cards);
			const cardObject = this.updateCards(cards);
			const parentAppId = this.appComponent.getId();
			this.getService().addCardsToCollaborationManager(cardObject, parentAppId);
		});
	}

	updateCards(cards: WrappedCard[]): Record<string, WrappedCard> {
		return cards.reduce(
			(acc, cur) => {
				if (cur?.card["sap.app"]?.id) {
					acc[cur?.card["sap.app"]?.id] = cur;
				}
				return acc;
			},
			{} as Record<string, WrappedCard>
		);
	}

	/**
	 * Automatic unregistering on exit of the application.
	 *
	 */
	@methodOverride()
	onExit(): void {
		this.getService().unregisterProvider();
	}

	getService(): CollaborationManagerService {
		return this.appComponent.getCollaborationManagerService();
	}

	@publicExtension()
	@extensible("AfterAsync")
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async collectAvailableCards(cards: WrappedCard[]): Promise<void> {
		return Promise.resolve();
	}
}

import Log from "sap/base/Log";
import type RetrieveCard from "sap/cards/ap/common/services/RetrieveCard";
import type { RetrieveCardType } from "sap/cards/ap/common/services/RetrieveCard";
import type { CardManifest } from "sap/insights/CardHelper";
import type CardsChannel from "sap/insights/CardsChannel";
import type { ICardProvider, SharedCard } from "sap/insights/CardsChannel";
import Library from "sap/ui/core/Lib";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";

type CollaborationManagerSettings = {};

export type WrappedCard = Pick<NonNullable<SharedCard>, "card" | "title" | "callback">;

export class CollaborationManagerService extends Service<CollaborationManagerSettings> implements ICardProvider {
	initPromise!: Promise<CollaborationManagerService>;

	// eslint-disable-next-line camelcase
	__implements__sap_insights_ICardProvider = true;

	private channel!: CardsChannel;

	private id!: string;

	private consumers!: Record<string, boolean>;

	private onRetrieveAvailableCards?: () => Promise<void>;

	private sharedCards!: SharedCard[];

	private registered = false;

	private appComponent!: AppComponent;

	init(): void {
		this.initPromise = new Promise((resolve) => {
			this.appComponent = this.getContext().scopeObject as AppComponent;
			resolve(this);
		});
	}

	private async getCardsChannel(): Promise<CardsChannel> {
		const { default: cardHelper } = await import("sap/insights/CardHelper");
		const service = await cardHelper.getServiceAsync("UIService");
		return service.getCardsChannel();
	}

	public async connect(providerId: string, onRetrieveAvailableCards: () => Promise<void>): Promise<CollaborationManagerService> {
		try {
			const channel = await this.getCardsChannel();
			if (channel.isEnabled()) {
				this.onRetrieveAvailableCards = onRetrieveAvailableCards;
				this.channel = channel;
				this.id = providerId;
				this.consumers = {};
				this.sharedCards = [];
				if (this.registered !== true) {
					await this.registerProvider();
				}
				this.updateConsumers();
			}
		} catch (error: unknown) {
			Log.debug("Collaboration Manager connection failed", error as Error | string);
		}
		return this;
	}

	public async onConsumerConnected(id: string): Promise<number> {
		if (!this.consumers[id]) {
			this.consumers[id] = true;
			await this.onRetrieveAvailableCards?.();
			this.shareAvailableCards(id);
		}
		return Promise.resolve(Object.keys(this.consumers).length);
	}

	public async onConsumerDisconnected(id: string): Promise<number> {
		if (this.consumers[id]) {
			delete this.consumers[id];
		}
		return Promise.resolve(Object.keys(this.consumers).length);
	}

	public onCardRequested(consumerId: string, cardId: string): SharedCard {
		const card = this.sharedCards.find((card) => card?.id === cardId);
		card?.callback?.(card.card);
		return card;
	}

	public async onViewUpdate(active: boolean): Promise<void> {
		// register / unregister if the status of the home page changed
		if (this.registered !== active) {
			if (active) {
				await this.registerProvider();
				this.updateConsumers();
			} else {
				await this.unregisterProvider();
			}
		} else if (this.registered) {
			this.updateConsumers();
		}
	}

	private async registerProvider(): Promise<void> {
		if (this.channel) {
			await this.channel.registerProvider(this.id, this);
			this.registered = true;
		}
	}

	public async unregisterProvider(): Promise<void> {
		if (this.channel) {
			await this.channel.unregister(this.id);
			this.registered = false;
			this.consumers = {};
			this.sharedCards = [];
			this.onRetrieveAvailableCards = undefined;
		}
	}

	private updateConsumers(): void {
		this.shareAvailableCards();
	}

	public shareAvailableCards(consumerId = "*"): void {
		this?.channel?.publishAvailableCards(this.id, this.sharedCards, consumerId);
	}

	public addCardsToCollaborationManager(cards: Record<string, WrappedCard>, parentAppId: string): void {
		this.sharedCards = [];
		for (const [id, card] of Object.entries(cards)) {
			this.sharedCards.push({
				id: id,
				title: card.title,
				parentAppId: parentAppId,
				callback: card.callback,
				card: card.card
			});
		}
	}

	public async getDesignTimeCard(cardType: RetrieveCardType): Promise<Record<string, unknown> | undefined> {
		return new Promise((resolve, reject) => {
			Library.load({ name: "sap/cards/ap/common" })
				.then((): void => {
					sap.ui.require(["sap/cards/ap/common/services/RetrieveCard"], async (...params: unknown[]) => {
						const retrieveCard = params[0] as typeof RetrieveCard;
						let generatedManifest;
						const appComponent = this.appComponent;
						try {
							generatedManifest = await retrieveCard.getObjectPageCardManifestForPreview(appComponent, {
								cardType: cardType
							});
						} catch (error) {
							Log.error(error as string);
						}
						resolve(generatedManifest);
					});
					return;
				})
				.catch(function (error) {
					Log.error(error as string);
					reject();
				});
		});
	}

	public publishCard(card: CardManifest): void {
		this.channel.publishCard(this.id, { id: card["sap.app"].id, descriptorContent: card }, "*");
	}
}

export default class CollaborationManagerServiceFactory extends ServiceFactory<CollaborationManagerSettings> {
	static serviceClass = CollaborationManagerService;

	private instance!: CollaborationManagerService;

	async createInstance(oServiceContext: ServiceContext<CollaborationManagerSettings>): Promise<CollaborationManagerService> {
		this.instance = new CollaborationManagerService(oServiceContext);
		return this.instance.initPromise;
	}

	getInstance(): CollaborationManagerService {
		return this.instance;
	}

	shareAvailableCards(): void {
		this.instance.shareAvailableCards();
	}
}

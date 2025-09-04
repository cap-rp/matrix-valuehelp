import type { ConvertedMetadata } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import BaseCardContentProvider, { type CardConfig } from "sap/fe/templates/ObjectPage/card/BaseCardContentProvider";
import type { HeaderActionsConfig } from "sap/fe/templates/ObjectPage/card/actions/HeaderActions";
import HeaderActions from "sap/fe/templates/ObjectPage/card/actions/HeaderActions";
import type { CardHeaderFacetsConfig } from "sap/fe/templates/ObjectPage/card/facets/HeaderContent";
import HeaderContent from "sap/fe/templates/ObjectPage/card/facets/HeaderContent";
import HeaderTitle from "sap/fe/templates/ObjectPage/card/facets/HeaderTitle";
import type { CardColumnSet, CardElement, IACActionSet, IAdaptiveCard } from "types/adaptiveCard_types";

const MSTEAMS_ADAPTIVE_CARD_SCHEMA = "https://adaptivecards.io/schemas/adaptive-card.json";
const MSTEAMS_ADAPTIVE_CARD_VERSION = "1.4";

export type GeneratorConfig = CardConfig & CardHeaderFacetsConfig & HeaderActionsConfig;

/**
 * Adaptive card json generator.
 * @param convertedTypes Converted Metadata.
 * @param config Card Configuration.
 * @experimental
 */
export default class AdaptiveCardGenerator extends BaseCardContentProvider<GeneratorConfig> {
	private cardDefinition?: IAdaptiveCard;

	/**
	 * Get the generated card definition.
	 * @param queryUrl Query url to use for card definition.
	 * @returns Card definition to share via MS teams 'share as card'.
	 */
	public getCardDefinition(queryUrl?: string): IAdaptiveCard | undefined {
		let cardDefinition = this.cardDefinition;
		if (queryUrl && cardDefinition) {
			const extendDefinition = {
				metadata: {
					webUrl: `${queryUrl}`
				}
			};
			cardDefinition = { ...cardDefinition, ...extendDefinition };
		}
		return cardDefinition;
	}

	constructor(convertedTypes: ConvertedMetadata, config: GeneratorConfig) {
		super(convertedTypes, config);
		try {
			const { webUrl } = config;

			// header content
			const headerTitleandImage = this.getHeaderTitle(config);
			const headerForms = this.getHeaderFacetsForAdaptiveCard(config);

			// actions
			const cardActions = this.getCardActions(config);

			// body
			if (headerForms.length === 0 && cardActions.length === 0) {
				this.cardDefinition = undefined;
				return this;
			}
			const content = [...headerForms, ...cardActions];
			const body = headerTitleandImage ? [headerTitleandImage, ...content] : content;

			this.cardDefinition = {
				type: "AdaptiveCard",
				msTeams: {
					width: "full"
				},
				metadata: {
					webUrl
				},
				body: body,
				$schema: MSTEAMS_ADAPTIVE_CARD_SCHEMA,
				version: MSTEAMS_ADAPTIVE_CARD_VERSION
			};
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error("Error while creating the card defintion", message);
		}
	}

	private getCardActions(config: CardConfig): IACActionSet[] {
		const headerActionsProvider = new HeaderActions(this.convertedTypes, config);
		const cardActions = headerActionsProvider.getCardActions();
		const pathsToQueryFromActions = headerActionsProvider.getPathsToQuery();
		this.addPathsToQuery(pathsToQueryFromActions);
		const cardActionSet: IACActionSet[] = [];
		if (cardActions.length > 0) {
			cardActionSet.push({
				type: "ActionSet",
				actions: [...cardActions]
			});
		}
		return cardActionSet;
	}

	private getHeaderFacetsForAdaptiveCard(config: CardConfig): CardElement[] {
		const headerContentProvider = new HeaderContent(this.convertedTypes, config);
		const headerForms = headerContentProvider.getHeaderContent();
		const pathsToQueryFromHeaderForms = headerContentProvider.getPathsToQuery();
		this.addPathsToQuery(pathsToQueryFromHeaderForms);

		return headerForms;
	}

	private getHeaderTitle(config: CardConfig): CardColumnSet | undefined {
		const headerTitleProvider = new HeaderTitle(this.convertedTypes, config);
		const headerTitle = headerTitleProvider.getTitle();
		const pathsToQueryFromTitle = headerTitleProvider.getPathsToQuery();
		this.addPathsToQuery(pathsToQueryFromTitle);

		return headerTitle;
	}
}

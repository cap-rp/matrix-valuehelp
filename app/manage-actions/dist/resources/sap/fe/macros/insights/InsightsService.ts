import type { ContentDensitiesType } from "sap/fe/core/converters/ManifestSettings";
import type { CollaborationManagerService } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { FilterParameterType } from "sap/fe/macros/insights/CommonInsightsHelper";
import type { CardManifest, CardMessage } from "sap/insights/CardHelper";
import VersionInfo from "sap/ui/VersionInfo";
import Library from "sap/ui/core/Lib";
import type { ManifestContent } from "sap/ui/core/Manifest";
import type {
	ActionParams,
	CardConfigParameters,
	CardConfiguration,
	CardData,
	CardHeader,
	CardType,
	ChartCardContent,
	TableCardColumn,
	TableCardContent
} from "sap/ui/integration/widgets/Card";
import type { ParsedHash } from "sap/ushell/services/URLParsing";

export type ChartContent = Pick<ChartCardContent, "dimensions" | "feeds" | "measures" | "chartType" | "chartProperties"> & {
	cardTitle: string;
	legendVisible: boolean;
	allowedChartTypes: CardManifest["sap.insights"]["allowedChartTypes"];
};

type InsightRequestParameters = {
	// all parameters related to request for the data
	serviceUrl: string;
	queryUrl: string;
	groupBy?: {
		property: string;
		descending?: boolean;
	};
	sortQuery: string;
};

export type TableContent = {
	rowCriticality: string | undefined;
	cardTitle: string;
	insightsRelevantColumns: TableCardColumn[];
};

export type InsightsParams<C = TableContent | ChartContent> = {
	navigation: {
		iAppStateKey: string | undefined;
		intent: ParsedHash;
		appVariantId?: string;
	};
	type: CardType;
	requestParameters: InsightRequestParameters;
	content: C;
	parentAppManifest: ManifestContent;
	parameters: {
		mandatoryFilters?: string[];
		filters?: Record<string, FilterParameterType>;
		oDataParameters?: Record<string, FilterParameterType>;
		sensitiveProperties?: string[];
		isNavigationEnabled?: boolean;
	};
	entitySetPath: string;
};

const MAX_TABLE_RECORDS = 15;
const SERVICE_HOST = "{{destinations.service}}";

/**
 * Checks whether the parameters have analytical or table content.
 * @param type Card type
 * @param content Content that is to be typed
 * @returns Type checked true if the parameters contain content for an analytical card
 */
function isAnalytical(type: string, content: TableContent | ChartContent): content is ChartContent {
	return type === "Analytical";
}

/**
 * Constructs the request object to fetch data for the insights card.
 * @param insightsParams
 * @param insightsParams.type
 * @param insightsParams.requestParameters
 * @returns The request data for the insights card.
 */
function getCardData({ type, requestParameters }: InsightsParams<unknown>): CardData {
	// manipulate the query url based on card type and service url
	let queryUrl = requestParameters.queryUrl;
	if (requestParameters.queryUrl.includes(requestParameters.serviceUrl)) {
		queryUrl = requestParameters.queryUrl.split(requestParameters.serviceUrl)[1];
	}
	if (type === "Table") {
		// fetch only the first 15 records
		queryUrl = `${queryUrl}&$top=${MAX_TABLE_RECORDS}`;
	}

	return {
		request: {
			url: `${SERVICE_HOST}${requestParameters.serviceUrl}$batch`,
			method: "POST",
			headers: {
				"X-CSRF-Token": "{{csrfTokens.token1}}"
			},
			batch: {
				response: {
					method: "GET",
					url: queryUrl,
					headers: {
						Accept: "application/json"
					}
				}
			}
		}
	};
}

/**
 * Constructs the card header for the insights card.
 * Includes the status to be shown and the navigation action to be configured on the insights card.
 * @param insightsParams
 * @returns The card header
 */
function getCardHeader(insightsParams: InsightsParams): CardHeader {
	const cardHeader: CardHeader = {
		title: insightsParams.content.cardTitle,
		actions: [
			{
				type: "Navigation",
				parameters: "{= extension.formatters.getNavigationContext(${parameters>/state/value})}"
			}
		]
	};
	if (insightsParams.type === "Table") {
		cardHeader.status = {
			text: "{/response/@odata.count}" // number of records on LR received as part of the request
		};
	}
	return cardHeader;
}

/**
 * Construct the action object that is required by the insights card.
 * This is used to configure the navigation from the card to the source application.
 * @param navTarget
 * @returns The action object
 */
function getActionObject(navTarget: InsightsParams["navigation"]): string {
	let ibnParams = {
		sensitiveProps: [],
		nhHybridIAppStateKey: navTarget.iAppStateKey
	}
	if (navTarget.appVariantId) {
		ibnParams = {...ibnParams, ...{"sap-appvar-id": navTarget.appVariantId}};
	}
	const actionParams: ActionParams = {
		parameters: {
			ibnTarget: navTarget.intent,
			ibnParams: ibnParams
		}
	};
	return JSON.stringify(actionParams);
}

/**
 * Construct the card configuration parameters required by the insights card.
 * This includes filters, parameters, sensitive properties and the action object for the navigation.
 * @param mandatoryFilters List of mandatory filters
 * @param filters Object containing the filters
 * @param navigation Navigation parameters
 * @param entitySetPath Entity set path
 * @param parameters Collection of parameters
 * @param contentUrl URL to fetch the content
 * @param sortQuery Sort query
 * @param type Card type
 * @returns The card configuration parameters
 */
function getCardConfigParameters(
	mandatoryFilters: string[],
	filters: Record<string, FilterParameterType>,
	navigation: InsightsParams["navigation"],
	entitySetPath: string,
	parameters: Record<string, FilterParameterType>,
	contentUrl: string,
	sortQuery: string,
	type: CardType
): CardConfigParameters {
	const cardConfigParams: CardConfigParameters = {
		state: {
			value: getActionObject(navigation)
		},
		_relevantODataFilters: {
			value: []
		},
		_relevantODataParameters: {
			value: []
		},
		_mandatoryODataFilters: {
			value: mandatoryFilters
		},
		_mandatoryODataParameters: {
			value: []
		},
		sensitiveProps: [],
		_entitySet: {
			value: entitySetPath
		},
		_contentDataUrl: {
			value: contentUrl
		},
		_HeaderDataUrl: {
			value: contentUrl
		},
		_contentTopQuery: {
			value: type === "Table" ? `$top=${MAX_TABLE_RECORDS}` : ""
		},
		_headerTopQuery: {
			value: type === "Table" ? `$top=${MAX_TABLE_RECORDS}` : ""
		},
		_contentSkipQuery: {
			value: type === "Table" ? "$skip=0" : ""
		},
		_headerSkipQuery: {
			value: type === "Table" ? "$skip=0" : ""
		},
		_contentSortQuery: {
			value: sortQuery === "" ? "" : `$orderby=${sortQuery}`
		},
		_headerSortQuery: {
			value: sortQuery === "" ? "" : `$orderby=${sortQuery}`
		}
	};
	for (const filter in filters) {
		cardConfigParams._relevantODataFilters.value.push(filter);
		cardConfigParams[filter] = {
			value: filters[filter].value,
			type: filters[filter].type
		};
	}
	for (const parameter in parameters) {
		cardConfigParams._relevantODataParameters.value.push(parameter);
		cardConfigParams._mandatoryODataParameters.value.push(parameter);
		cardConfigParams[parameter] = {
			value: parameters[parameter].value,
			type: parameters[parameter].type
		};
	}
	return cardConfigParams;
}

/**
 * Construct the card configuration for the insights card.
 * @param insightsParams
 * @returns The card configuration for the insights card.
 */
function getCardConfig(insightsParams: InsightsParams): CardConfiguration {
	const cardConfiguration: CardConfiguration = {};
	const serviceUrl = insightsParams.requestParameters.serviceUrl;
	cardConfiguration.destinations = { service: { name: "(default)", defaultUrl: "/" } };
	cardConfiguration.csrfTokens = {
		token1: {
			data: {
				request: {
					url: `${SERVICE_HOST}${serviceUrl}`,
					method: "HEAD",
					headers: {
						"X-CSRF-Token": "Fetch"
					}
				}
			}
		}
	};

	cardConfiguration.parameters = getCardConfigParameters(
		insightsParams.parameters.mandatoryFilters ?? [],
		insightsParams.parameters.filters ?? {},
		insightsParams.navigation,
		insightsParams.entitySetPath,
		insightsParams.parameters.oDataParameters ?? {},
		insightsParams.requestParameters.queryUrl,
		insightsParams.requestParameters.sortQuery,
		insightsParams.type
	);
	return cardConfiguration;
}

/**
 * Construct the manifest entry for sap.card namespace of the insights card.
 * @param insightsParams
 * @returns The card manifest entry for the sap.card namespace
 */
function getIntegrationCardManifest(insightsParams: InsightsParams): CardManifest["sap.card"] {
	const cardConfig: Partial<CardManifest["sap.card"]> = {
		type: insightsParams.type
	};
	cardConfig.configuration = getCardConfig(insightsParams);
	cardConfig.header = getCardHeader(insightsParams);
	cardConfig.data = getCardData(insightsParams);
	if (isAnalytical(insightsParams.type, insightsParams.content)) {
		cardConfig.content = getAnalyticalCardContent(insightsParams.content);
	} else {
		cardConfig.content = getTableCardContent(insightsParams as InsightsParams<TableContent>);
	}
	cardConfig.extension = "module:sap/fe/core/InsightsFormattersExtension";
	return cardConfig as CardManifest["sap.card"];
}

/**
 * Constructs the card content for the insights card.
 * Includes the configuration of a navigation action and the creation of bindings to read the data from the response of the back end.
 * @param insightsParams
 * @param insightsParams.requestParameters
 * @param insightsParams.content
 * @param insightsParams.parameters
 * @returns The card content for the insights card.
 */
function getTableCardContent({ requestParameters, content, parameters }: InsightsParams<TableContent>): TableCardContent {
	const cardContent: TableCardContent = {
		data: {
			path: "/response/value"
		},
		maxItems: MAX_TABLE_RECORDS,
		row: {
			highlight: content.rowCriticality ? content.rowCriticality : undefined,
			columns: content.insightsRelevantColumns
		}
	};
	if (requestParameters.groupBy) {
		const groupConditionName = requestParameters.groupBy.property;
		const groupDescending = requestParameters.groupBy.descending;
		cardContent.group = {
			title: "{" + groupConditionName + "}",
			order: {
				path: groupConditionName,
				dir: groupDescending === true ? "DESC" : "ASC"
			}
		};
	}
	if (parameters.isNavigationEnabled === true) {
		cardContent.row.actions = [
			{
				type: "Navigation",
				parameters: "{= extension.formatters.getNavigationContext(${parameters>/state/value}, ${})}"
			}
		];
	}
	return cardContent;
}

/**
 * Creates the chart card content for the insights card.
 * @param content Content configuration for an analytical card
 * @returns The chart card content
 */
export function getAnalyticalCardContent(content: ChartContent): ChartCardContent {
	return {
		chartType: content.chartType,
		chartProperties: content.chartProperties as never,
		data: { path: "/response/value" },
		dimensions: content.dimensions,
		measures: content.measures,
		feeds: content.feeds,
		actions: [
			{
				type: "Navigation",
				parameters: "{= extension.formatters.getNavigationContext(${parameters>/state/value}, ${})}"
			}
		],
		actionableArea: "Chart"
	};
}

/**
 * Construct the manifest entry for sap.insights namespace of the insights card.
 * @param params
 * @param params.parentAppManifest Manifest of the target application
 * @param params.entitySetPath Entity set to be used for filtering
 * @param params.type Card type
 * @param params.content Content specific parameters
 * @returns The card manifest entry for the sap.insights namespace
 */
async function getManifestSapInsights({
	parentAppManifest,
	entitySetPath,
	type,
	content
}: InsightsParams): Promise<CardManifest["sap.insights"]> {
	const ui5Version = await VersionInfo.load();
	const manifestParams: CardManifest["sap.insights"] = {
		parentAppId: parentAppManifest["sap.app"].id,
		cardType: "RT",
		versions: {
			ui5: ui5Version.version + "-" + ui5Version.buildTimestamp
		},
		filterEntitySet: entitySetPath
	};
	if (isAnalytical(type, content)) {
		manifestParams.allowedChartTypes = content.allowedChartTypes;
	}
	return manifestParams;
}
/**
 * Creates the card manifest for the insights card.
 * @param insightsParams
 * @returns The insights card
 */
export async function createCardManifest(insightsParams: InsightsParams): Promise<CardManifest> {
	const appManifest = { ...insightsParams.parentAppManifest["sap.app"] };
	const ui5Manifest = { ...insightsParams.parentAppManifest["sap.ui5"] };
	const defaultModel = ui5Manifest.models[""];
	const dataSourceService = defaultModel.dataSource ? defaultModel.dataSource : "";
	const insightsCardManifest: Partial<CardManifest> = {};
	appManifest.id = `user.${appManifest.id}.${Date.now()}`;
	appManifest.type = "card";
	appManifest.dataSources.filterService = { ...appManifest.dataSources[dataSourceService] };
	insightsCardManifest["sap.app"] = appManifest as CardManifest["sap.app"];
	insightsCardManifest["sap.card"] = getIntegrationCardManifest(insightsParams);
	insightsCardManifest["sap.insights"] = await getManifestSapInsights(insightsParams);
	insightsCardManifest["sap.ui5"] = {
		contentDensities: ui5Manifest.contentDensities as ContentDensitiesType,
		dependencies: {
			libs: {
				"sap.insights": {
					lazy: false
				}
			}
		},
		componentName: insightsCardManifest["sap.app"].id
	};
	return insightsCardManifest as CardManifest;
}

/**
 * Create the manifest of the insights card and show a preview of the card that is created.
 * @param insightsParams
 * @param cardCreationDialogWarning
 */
export async function showInsightsCardPreview(insightsParams: InsightsParams, cardCreationDialogWarning?: CardMessage): Promise<void> {
	const { default: cardHelper } = await import("sap/insights/CardHelper");
	const cardHelperInstance = await cardHelper.getServiceAsync("UIService");
	const card = await createCardManifest(insightsParams);
	await cardHelperInstance.showCardPreview(card, true, cardCreationDialogWarning);
}

/**
 * Create the manifest of the insights card and show a preview of the card that is created for collaboration manager.
 * @param card The card manifest to be used for the callback
 * @param cmInstance The current CollaborationManagerService instance
 */
export async function showCollaborationManagerCardPreview(card: CardManifest, cmInstance: CollaborationManagerService): Promise<void> {
	const { default: cardHelper } = await import("sap/insights/CardHelper");
	const cardHelperInstance = await cardHelper.getServiceAsync("UIService");
	const buttonText = Library.getResourceBundleFor("sap.fe.macros")?.getText("C_SEND_TO_COLLABORATION_MANAGER");
	await cardHelperInstance.showCardPreview(card, true, { type: "None" }, buttonText, (event) => {
		// We need to introduce this check as there seems to be a regression that the 'manifest' parameters is not filled in some versions
		const cardManifest = event.getParameter("manifest") ?? event.getSource().getManifest();
		cmInstance.publishCard(cardManifest);
	});
}

export async function getCardManifest(insightsParams: InsightsParams): Promise<CardManifest> {
	return createCardManifest(insightsParams);
}

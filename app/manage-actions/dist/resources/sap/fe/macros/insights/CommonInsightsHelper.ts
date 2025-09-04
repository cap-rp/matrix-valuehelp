import deepClone from "sap/base/util/deepClone";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { LegacyFilterBarState } from "sap/fe/core/controllerextensions/ViewState";
import ResourceModelHelper, { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type Button from "sap/m/Button";
import MessageBox from "sap/m/MessageBox";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type { ManifestContent } from "sap/ui/core/Manifest";
import type { CardType, TableCardColumn } from "sap/ui/integration/widgets/Card";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type PropertyHelper from "sap/ui/mdc/util/PropertyHelper";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ChartType from "../Chart";
import stateFilterToSelectionVariant from "../mdc/adapter/StateFilterToSelectionVariant";
import type { ChartContent, InsightsParams, TableContent } from "./InsightsService";

export type ControlState = Record<string, object | undefined> & {
	filter?: Record<string, unknown[] | undefined>;
	groupLevels?: {
		name: string;
	}[];
};

export type FilterParameterType = {
	value: unknown;
	type: string;
};

const filterTypeMapper: Record<string, string> = {
	"sap.ui.model.odata.type.String": "string",
	"sap.ui.model.odata.type.Int": "integer",
	"sap.ui.model.odata.type.Int32": "integer",
	"sap.ui.model.odata.type.Int64": "integer",
	"sap.ui.model.odata.type.Boolean": "boolean",
	"sap.ui.model.odata.type.Decimal": "number",
	"sap.ui.model.odata.type.Double": "number",
	"sap.ui.model.odata.type.Date": "date",
	"sap.ui.model.odata.type.DateTimeOffset": "datetime"
};

/**
 * Checks if the insights card creation is possible.
 * @param filterbarId
 * @param insightsRelevantColumns
 * @returns True if the insights card can be created.
 */
export function isInsightsCardCreationPossible(filterbarId: string | null, insightsRelevantColumns?: TableCardColumn[]): boolean {
	if (insightsRelevantColumns && insightsRelevantColumns.length === 0) {
		return false;
	}
	const filterBar = Element.getElementById(filterbarId);
	if (filterBar?.isA("sap.fe.macros.controls.FilterBar")) {
		//cards can not be created if semantic date operators are applied on the filters
		const isSemanticDateFilterApplied = (filterBar.getParent() as FilterBarAPI).isSemanticDateFilterApplied();
		return !isSemanticDateFilterApplied;
	}
	return true;
}

/**
 * Display a message box for the scenarios where the insights card cannot be created.
 * @param type Card type
 * @param resourceModel Resource model to be used to fetch messages
 */
function showErrorMessageForInsightsCard(type: CardType, resourceModel: ResourceModel): void {
	if (type === "Table") {
		const headerText = `<strong>
		${resourceModel.getText("M_CARD_RETRY_MESSAGE")}
		</strong>`;
		const contentText = `<ul><li>
			${resourceModel.getText("M_CARD_FAILURE_REASON_DATE_RANGE_FILTERS")}
			</li><li>
			${resourceModel.getText("M_CARD_FAILURE_TABLE_REASON_UNSUPPORTED_COLUMNS")}
			</li></ul>`;
		const formattedTextString = headerText + contentText;
		MessageBox.error(resourceModel.getText("M_CARD_CREATION_FAILURE"), {
			onClose: function () {
				throw new Error("Insights is not supported");
			},
			details: formattedTextString
		});
	} else {
		const formattedTextString = resourceModel.getText("M_CARD_CREATION_FAILURE_CHART_REASON_DATE_RANGE_FILTERS");
		MessageBox.error(formattedTextString, {
			onClose: function () {
				throw new Error("Insights is not supported");
			}
		});
	}
}

/**
 * Extract parameters relevant for navigation.
 * @param appComponent AppComponent instance to be used to access shell services
 * @returns An instance of the navigation parameters
 */
function createNavigationParameters(appComponent: AppComponent): InsightsParams["navigation"] {
	const shellServiceHelper = appComponent.getShellServices();
	const navigationService = appComponent.getNavigationService();
	const hash = shellServiceHelper.getHash();
	const parsedHash = shellServiceHelper.parseShellHash(hash);
	return {
		iAppStateKey: navigationService.getIAppStateKey(),
		appVariantId: parsedHash.params?.["sap-appvar-id"]?.[0],
		intent: {
			semanticObject: parsedHash.semanticObject,
			action: parsedHash.action
		}
	};
}

/**
 * Extract the applied filters.
 * @param parameters Array of parameters that are fetched from the custom data of the filter bar
 * @param filterBarSV Selection variant for the filter bar
 * @param propertyInfos PropertyInfoSet of the filter bar
 * @param controlSV
 * @returns An object containing the applied filters
 */
function getRelevantFilters(
	parameters: string[],
	filterBarSV: SelectionVariant,
	propertyInfos: PropertyInfo[],
	controlSV: SelectionVariant
): Record<string, FilterParameterType> {
	const selectionVariants: Record<string, FilterParameterType> = {};
	// Merge the filterBarSV and controlSV filters using compareSelectOptions
	const mergedSV = stateFilterToSelectionVariant.mergeSelectionVariants(filterBarSV, controlSV);
	const selectionOptionsPropertyNames: string[] = mergedSV.getSelectOptionsPropertyNames();
	if (selectionOptionsPropertyNames.length) {
		// Add to insights only if filters exist
		for (const filterProp of selectionOptionsPropertyNames) {
			const filterType: string | undefined = getFilterOrParameterType(filterProp, propertyInfos);
			if (filterProp !== "$editState" && !parameters.includes(filterProp) && !filterProp.includes("$Parameter.") && filterType) {
				const reconstructedSV = {
					id: mergedSV.getID(),
					Parameters: [],
					SelectOptions: [
						{
							PropertyName: filterProp,
							Ranges: mergedSV.getSelectOption(filterProp)
						}
					]
				};

				selectionVariants[filterProp] = {
					value: JSON.stringify(reconstructedSV),
					type: filterType
				};
			}
		}
	}

	return selectionVariants;
}

/**
 * Extract the relevant parameters.
 * @param parameters Array of parameters that are fetched from the custom data of the filter bar
 * @param selectionVariant Selection variant for the filter bar
 * @param propertyInfos PropertyInfoSet of the filter bar
 * @returns An object containing the relevant parameters
 */
function getRelevantParameters(
	parameters: string[],
	selectionVariant: SelectionVariant,
	propertyInfos: PropertyInfo[]
): Record<string, FilterParameterType> {
	const relevantParameters: Record<string, FilterParameterType> = {};
	const selectionOptionsPropertyNames: string[] = selectionVariant.getSelectOptionsPropertyNames();
	if (selectionOptionsPropertyNames.length) {
		// add to insights only if filters exist
		for (const parameter of parameters) {
			const parameterType: string | undefined = getFilterOrParameterType(parameter, propertyInfos);
			if (selectionOptionsPropertyNames.includes(parameter) && parameterType) {
				relevantParameters[parameter] = {
					value: selectionVariant.getSelectOption(parameter)?.[0].Low,
					type: parameterType
				};
			}
		}
	}
	return relevantParameters;
}

/**
 * Return the type of filter or parameter.
 * @param paramOrFilter Parameter or filter name
 * @param propertyInfos PropertyInfoSet of the filter bar
 * @returns Type of filter or parameter
 */

function getFilterOrParameterType(paramOrFilter: string, propertyInfos: PropertyInfo[]): string | undefined {
	let filterParamType;
	propertyInfos.forEach((propInfo: PropertyInfo) => {
		if (propInfo.name === paramOrFilter) {
			filterParamType = filterTypeMapper[propInfo.dataType];
		}
	});
	return filterParamType;
}

/**
 * Constructs the insights parameters that are required to create the insights card from the table.
 * @param cardType Card type
 * @param controlAPI Control API
 * @param filterBarId Filter bar ID
 * @param insightsRelevantColumns Insights-relevant columns
 * @returns The insights parameters from the table.
 */
export async function createInsightsParams(
	cardType: CardType,
	controlAPI: BuildingBlock | ChartType,
	filterBarId: string | null,
	insightsRelevantColumns?: TableCardColumn[]
): Promise<InsightsParams<Partial<TableContent | ChartContent>> | undefined> {
	const isCardCreationSupported = isInsightsCardCreationPossible(filterBarId, insightsRelevantColumns);
	if (!isCardCreationSupported) {
		showErrorMessageForInsightsCard(cardType, getResourceModel(controlAPI));
		return;
	}

	if (!controlAPI.content) {
		// This should never happen and is here mainly to avoid eslint errors
		throw new Error("Control API content is null or undefined");
	}

	const appComponent = CommonUtils.getAppComponent(controlAPI.content);
	const filterBar = Element.getElementById(filterBarId) as FilterBar | undefined;
	const control = controlAPI.content;
	const controlState = (await StateUtil.retrieveExternalState(control as Table)) as LegacyFilterBarState; // define type for control state
	const controlSV = stateFilterToSelectionVariant.getSelectionVariantFromConditions(
		controlState.filter as Record<string, ConditionObject[] | undefined>,
		(control as Table).getPropertyHelper() as PropertyHelper
	);

	let relevantFilters: Record<string, FilterParameterType> | undefined,
		relevantParameters: Record<string, FilterParameterType> | undefined,
		mandatoryFilters: string[] = [];
	if (filterBar?.isA("sap.fe.macros.controls.FilterBar")) {
		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		const parameters: string[] = filterBarAPI.getParameters();
		const filterBarSV: SelectionVariant = await filterBarAPI.getSelectionVariant();
		const propertyInfos: PropertyInfo[] = filterBar.getPropertyInfoSet();
		mandatoryFilters = filterBarAPI.getMandatoryFilterPropertyNames();
		relevantFilters = getRelevantFilters(parameters, filterBarSV, propertyInfos, controlSV);
		relevantParameters = getRelevantParameters(parameters, filterBarSV, propertyInfos);
	}
	const parentAppManifest = deepClone(appComponent.getManifest(), 20) as ManifestContent;
	const appManifest = parentAppManifest["sap.app"];
	if (appManifest["crossNavigation"]) {
		delete appManifest.crossNavigation;
	}
	const insightsParams: InsightsParams<Partial<TableContent | ChartContent>> = {
		navigation: createNavigationParameters(appComponent),
		type: cardType,
		requestParameters: {
			serviceUrl: (controlAPI.content.getModel() as ODataModel).getServiceUrl(),
			queryUrl: "",
			sortQuery: ""
		},
		content: {
			cardTitle: ""
		},
		parentAppManifest: parentAppManifest,
		parameters: {
			mandatoryFilters: mandatoryFilters,
			filters: relevantFilters,
			oDataParameters: relevantParameters
		},
		entitySetPath: ""
	};

	return insightsParams;
}

export function showGenericErrorMessage(scope: Control): void {
	const resourceModel = ResourceModelHelper.getResourceModel(scope);
	MessageBox.error(resourceModel.getText("M_CARD_FAILURE_GENERIC"));
}

export function hasInsightActionEnabled(
	actions: ActionToolbarAction[],
	filterBarId: string | null,
	insightsRelevantColumns?: TableCardColumn[]
): boolean {
	if (!isInsightsCardCreationPossible(filterBarId, insightsRelevantColumns)) {
		return false;
	}

	let isInsightActionEnabled = false;
	for (const actionElement of actions) {
		const action = actionElement.getAction();
		const isActionForInsights = action.getId().includes("StandardAction::Insights");
		//QUALMS: I don´t like that we currently do not have a clean model approach here and have to check for now
		//		  the enablement and visibility state of the action
		isInsightActionEnabled = isActionForInsights && action.getVisible() && (action as Button).getEnabled();
		if (isInsightActionEnabled) {
			break;
		}
	}
	return isInsightActionEnabled;
}

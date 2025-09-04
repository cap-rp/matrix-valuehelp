import Log from "sap/base/Log";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import ResourceModelHelper from "sap/fe/core/helpers/ResourceModelHelper";
import type FclController from "sap/fe/core/rootView/Fcl.controller";
import { type WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import { hasInsightActionEnabled, showGenericErrorMessage } from "sap/fe/macros/insights/CommonInsightsHelper";
import type { InsightsParams, TableContent } from "sap/fe/macros/insights/InsightsService";
import * as InsightsService from "sap/fe/macros/insights/InsightsService";
import * as TableInsightsHelper from "sap/fe/macros/insights/TableInsightsHelper";
import TableUtils from "sap/fe/macros/table/Utils";
import type { CardManifest, CardMessage } from "sap/insights/CardHelper";
import MessageBox from "sap/m/MessageBox";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import Library from "sap/ui/core/Lib";
import HashChanger from "sap/ui/core/routing/HashChanger";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import Filter from "sap/ui/model/Filter";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import SemanticDateOperators from "../../filterBar/SemanticDateOperators";
import { type ITableBlock } from "../TableAPI";

type SortConditions = {
	sorters: {
		name: string;
		descending: boolean;
	}[];
};

/**
 * A mixin to manage all sharing related functionality of the table (including insight cards)
 */
export default class TableSharing implements IInterfaceWithMixin {
	setupMixin(_baseClass: Function): void {}

	_onShareToCollaborationManagerPress(
		this: ITableBlock & TableSharing,
		controller: PageController,
		contexts: Context[],
		maxNumberofSelectedItems: number
	): void {
		if (contexts.length <= maxNumberofSelectedItems) {
			contexts.forEach(async (context: Context) => {
				const targetPath = await this.getUrlForCollaborationManager(context);
				if (this.isTableRowNavigationPossible(context) && targetPath) {
					const appComponent = controller.getAppComponent();
					const appTitle = appComponent.getManifestEntry("sap.app").title;
					const collaborativeToolsService = appComponent?.getCollaborativeToolsService();
					const collaborationManagerService = collaborativeToolsService?.collaborationService.cmHelperService;
					collaborationManagerService?.triggerH2HChat(appTitle, targetPath);
				} else {
					MessageBox.warning(
						Library.getResourceBundleFor("sap.fe.macros")!.getText(
							"T_TABLE_SHARE_TO_COLLABORATION_MANAGER_NO_NAVIGATION_POSSIBLE"
						)
					);
				}
			});
		} else {
			MessageBox.warning(
				Library.getResourceBundleFor("sap.fe.macros")!.getText("T_TABLE_SHARE_TO_COLLABORATION_MANAGER_TOO_MANY_ITEMS_SELECTED", [
					maxNumberofSelectedItems
				])
			);
		}
	}

	/**
	 * Get the URL for SAP Collaboration Manager. We always go to the active version, also from draft version. If there is no active version yet, we do not share a link.
	 * @param context The context for which the URL is to be generated
	 * @returns The URL for SAP Collaboration Manager
	 */
	async getUrlForCollaborationManager(this: ITableBlock & TableSharing, context: Context): Promise<string | undefined> {
		let targetPath;
		const view = CommonUtils.getTargetView(this.getContent());
		const collaborativeDraft = view.getController().collaborativeDraft;
		const metaModel = context.getModel()?.getMetaModel();
		const isDraft = ModelHelper.isDraftSupported(metaModel, context.getPath());
		if (isDraft && !collaborativeDraft.isCollaborationEnabled() && context.getObject().IsActiveEntity === false) {
			if (context.getObject().HasActiveEntity === false) {
				// we have a draft entity with no active version
				// we do not support this for Collaboration Manager
				return undefined;
			} else {
				// we have a draft entity with an active version and need to convert the path to an active path
				const path = context.getPath();
				const rootPath = path.substring(0, path.indexOf("/", 1));
				const rootContext = rootPath ? context.getModel().bindContext(rootPath).getBoundContext() : context;
				const siblingInfo = await draft.computeSiblingInformation(rootContext, context);
				targetPath = siblingInfo?.targetContext?.getPath();
			}
		} else {
			// we have an active entity or a collaborative draft or a non-draft programming model
			targetPath = context.getPath();
		}

		if (targetPath) {
			if (targetPath[0] === "/") {
				targetPath = targetPath.substring(1);
			}
			const appComponent = CommonUtils.getAppComponent(this.getContent());
			if (appComponent._isFclEnabled()) {
				const layout = this.getFCLLayoutForCM(appComponent);
				targetPath += `?layout=${layout}`;
			}
			const hashChangerInstance = HashChanger.getInstance();
			const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
			return window.location.origin + window.location.pathname + window.location.search + sBasePath + targetPath;
		}
		return undefined;
	}

	/**
	 * For 'Share to SAP Collaboration Manager', we always want the URL to go to full screen.
	 * @param this
	 * @param appComponent The app component
	 * @returns The FCL layout for the Share to SAP Collaboration Manager
	 */
	getFCLLayoutForCM(this: ITableBlock & TableSharing, appComponent: AppComponent): string {
		const FCLLevel = CommonUtils.getTargetView(this.getContent()).getController()._routing.getFCLLevel();
		if ((appComponent.getRootViewController() as FclController).getFclConfig().maxColumnsCount === 2) {
			return "MidColumnFullScreen";
		}

		return FCLLevel === 0 ? "MidColumnFullScreen" : "EndColumnFullScreen";
	}

	@controllerExtensionHandler("collaborationManager", "collectAvailableCards")
	async collectAvailableCards(this: ITableBlock & TableSharing, cards: WrappedCard[]): Promise<void> {
		const actionToolbarItems = this.getContent().getActions() as ActionToolbarAction[];
		if (
			hasInsightActionEnabled(actionToolbarItems, this.getContent().getFilter(), TableInsightsHelper.getInsightsRelevantColumns(this))
		) {
			const card = await this.getCardManifestTable();
			if (Object.keys(card).length > 0) {
				cards.push({
					card: card,
					title: (this.getTableDefinition().headerInfoTypeName as string | undefined) ?? "",
					callback: this.onAddCardToCollaborationManagerCallback.bind(this)
				});
			}
		}
	}

	/**
	 * Gets the card manifest optimized for the table case.
	 * @returns Promise of CardManifest
	 */
	private async getCardManifestTable(this: ITableBlock & TableSharing): Promise<CardManifest> {
		const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
		const insightsParams = (await TableInsightsHelper.createTableCardParams(
			this,
			insightsRelevantColumns,
			this.getSortConditionsQuery()
		)) as InsightsParams<TableContent>;
		return InsightsService.getCardManifest(insightsParams);
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 * @param card The card manifest to be used for the callback
	 * @returns Undefined if card preview is rendered.
	 */
	async onAddCardToCollaborationManagerCallback(this: ITableBlock & TableSharing, card: CardManifest): Promise<void> {
		try {
			if (card) {
				await InsightsService.showCollaborationManagerCardPreview(card, this.getPageController().collaborationManager.getService());
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.getContent());
			Log.error(e as string);
		}
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 * @returns Undefined if the card preview is rendered.
	 */
	async _onAddCardToInsightsPressed(this: ITableBlock & TableSharing): Promise<void> {
		try {
			const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
			const insightsParams = await TableInsightsHelper.createTableCardParams(
				this,
				insightsRelevantColumns,
				this.getSortConditionsQuery()
			);
			if (insightsParams) {
				const message: CardMessage = insightsParams.parameters.isNavigationEnabled
					? undefined
					: {
							type: "Warning",
							text: this.createNavigationErrorMessage(this.getContent())
					  };

				InsightsService.showInsightsCardPreview(insightsParams, message);
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.getContent());
			Log.error(e as string);
		}
	}

	createNavigationErrorMessage(scope: Control): string {
		const resourceModel = ResourceModelHelper.getResourceModel(scope);
		return resourceModel.getText("M_ROW_LEVEL_NAVIGATION_DISABLED_MSG_REASON_EXTERNAL_NAVIGATION_CONFIGURED");
	}

	async getDownloadUrlWithFilters(this: ITableBlock & TableSharing): Promise<string> {
		const table = this.getContent();
		const filterBar = UI5Element.getElementById(table.getFilter()) as FilterBar | undefined;

		if (!filterBar) {
			throw new Error("filter bar is not available");
		}
		const binding = table.getRowBinding();
		const model = table.getModel() as ODataModel;
		const filterPropSV = await (filterBar.getParent() as FilterBarAPI).getSelectionVariant();
		// ignore filters with semantic operators which needs to be added later as filters with flp semantic date placeholders
		const filtersWithSemanticDateOpsInfo = SemanticDateOperators.getSemanticOpsFilterProperties(filterPropSV._getSelectOptions());
		const filtersWithoutSemanticDateOps = TableUtils.getAllFilterInfo(
			table,
			filtersWithSemanticDateOpsInfo.map((filterInfo) => filterInfo.filterName)
		);
		const propertiesInfo = filterBar.getPropertyInfoSet();
		// get the filters with semantic date operators with flp placeholder format and append to the exisiting filters
		const [flpMappedPlaceholders, semanticDateFilters] = SemanticDateOperators.getSemanticDateFiltersWithFlpPlaceholders(
			filtersWithSemanticDateOpsInfo,
			propertiesInfo
		);

		let allRelevantFilters: Filter[] = [];
		if (filtersWithoutSemanticDateOps.filters.length > 0) {
			allRelevantFilters = allRelevantFilters.concat(filtersWithoutSemanticDateOps.filters);
		}
		if (semanticDateFilters.length > 0) {
			allRelevantFilters.push(...semanticDateFilters);
		}
		const allFilters = new Filter({
			filters: allRelevantFilters,
			and: true
		});
		const parameters = {
			$search: CommonUtils.normalizeSearchTerm(filterBar.getSearch()) || undefined
		};
		// create hidden binding with all filters e.g. static filters and filters with semantic operators
		const tempTableBinding = model.bindList(binding.getPath(), undefined, undefined, allFilters, parameters);
		let url = (await tempTableBinding.requestDownloadUrl()) ?? "";
		for (const [placeholder, value] of Object.entries(flpMappedPlaceholders)) {
			url = url.replace(placeholder, value);
		}
		return url;
	}

	/**
	 * Get the sort conditions query string.
	 * @returns The sort conditions query string
	 */
	getSortConditionsQuery(this: ITableBlock & TableSharing): string {
		const table = this.getContent();
		const sortConditions = (table.getSortConditions() as SortConditions)?.sorters;
		return sortConditions
			? sortConditions
					.map(function (sortCondition) {
						const sortConditionsPath = table.getPropertyHelper().getProperty(sortCondition.name)?.path;
						if (sortConditionsPath) {
							return `${sortConditionsPath}${sortCondition.descending ? " desc" : ""}`;
						}
						return "";
					})
					.join(",")
			: "";
	}
}

import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import type DynamicPage from "sap/f/DynamicPage";
import type { DynamicPageTitle$StateChangeEvent } from "sap/f/DynamicPageTitle";
import { defineUI5Class, extensible, finalExtension, privateExtension, publicExtension, usingExtension } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import PageController from "sap/fe/core/PageController";
import IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import InternalIntentBasedNavigation from "sap/fe/core/controllerextensions/InternalIntentBasedNavigation";
import InternalRouting from "sap/fe/core/controllerextensions/InternalRouting";
import KPIManagement from "sap/fe/core/controllerextensions/KPIManagement";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import Share from "sap/fe/core/controllerextensions/Share";
import SideEffects from "sap/fe/core/controllerextensions/SideEffects";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import type { ListReportDefinition } from "sap/fe/core/converters/templates/ListReportConverter";
import EditState from "sap/fe/core/helpers/EditState";
import MessageStrip from "sap/fe/core/helpers/MessageStrip";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import * as StableIdHelper from "sap/fe/core/helpers/StableIdHelper";
import CoreLibrary from "sap/fe/core/library";
import type ChartType from "sap/fe/macros/Chart";
import type MacroAPI from "sap/fe/macros/MacroAPI";
import type ChartDelegate from "sap/fe/macros/chart/ChartDelegate";
import ChartUtils from "sap/fe/macros/chart/ChartUtils";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type MultipleModeControl from "sap/fe/templates/ListReport/controls/MultipleModeControl";
import SideEffectsOverride from "sap/fe/templates/ListReport/overrides/SideEffects";
import TableScroller from "sap/fe/templates/TableScroller";
import type IconTabBar from "sap/m/IconTabBar";
import type TabContainerItem from "sap/m/TabContainerItem";
import Device from "sap/ui/Device";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import { InvisibleMessageMode } from "sap/ui/core/library";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type { VariantManagement$SelectEvent } from "sap/ui/fl/variants/VariantManagement";
import type Chart from "sap/ui/mdc/Chart";
import type FilterField from "sap/ui/mdc/FilterField";
import type Table from "sap/ui/mdc/Table";
import type { FilterBarBase$FiltersChangedEvent } from "sap/ui/mdc/filterbar/FilterBarBase";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import hasher from "sap/ui/thirdparty/hasher";
import * as ListReportTemplating from "./ListReportTemplating";
import IntentBasedNavigationOverride from "./overrides/IntentBasedNavigation";
import ShareOverrides from "./overrides/Share";
import ViewStateOverrides from "./overrides/ViewState";

const TemplateContentView = CoreLibrary.TemplateContentView,
	InitialLoadMode = CoreLibrary.InitialLoadMode;

/**
 * Controller class for the list report page, used inside an SAP Fiori elements application.
 * @hideconstructor
 * @public
 */
@defineUI5Class("sap.fe.templates.ListReport.ListReportController")
class ListReportController extends PageController {
	@usingExtension(
		InternalRouting.override({
			onAfterBinding: function (this: InternalRouting) {
				(this.getView().getController() as ListReportController)._onAfterBinding();
			}
		})
	)
	_routing!: InternalRouting;

	@usingExtension(
		InternalIntentBasedNavigation.override({
			getEntitySet: function (this: InternalIntentBasedNavigation) {
				return (this.base as ListReportController).getCurrentEntitySet();
			}
		})
	)
	_intentBasedNavigation!: InternalIntentBasedNavigation;

	@usingExtension(SideEffects.override(SideEffectsOverride))
	_sideEffects!: SideEffects;

	@usingExtension(IntentBasedNavigation.override(IntentBasedNavigationOverride))
	intentBasedNavigation!: IntentBasedNavigation;

	@usingExtension(Share.override(ShareOverrides))
	share!: Share;

	@usingExtension(ViewState.override(ViewStateOverrides))
	viewState!: ViewState;

	@usingExtension(KPIManagement)
	kpiManagement!: KPIManagement;

	@usingExtension(Placeholder)
	placeholder!: Placeholder;

	protected extensionAPI?: ExtensionAPI;

	private filterBarConditions?: unknown;

	private hasPendingChartChanges?: boolean;

	private hasPendingTableChanges?: boolean;

	/**
	 * Get the extension API for the current page.
	 * @public
	 * @returns The extension API.
	 */
	@publicExtension()
	@finalExtension()
	getExtensionAPI(): ExtensionAPI {
		if (!this.extensionAPI) {
			this.extensionAPI = new ExtensionAPI(this);
		}
		return this.extensionAPI;
	}

	onInit(): void {
		PageController.prototype.onInit.apply(this);
		const oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
		const filterBar = this._getFilterBarControl();
		if (filterBar) {
			this._storeFilterBarSelectionVariant(filterBar, oInternalModelContext);
		}
		oInternalModelContext.setProperty("hasPendingFilters", true);
		oInternalModelContext.setProperty("hideDraftInfo", false);
		oInternalModelContext.setProperty("uom", {});
		oInternalModelContext.setProperty("scalefactor", {});
		oInternalModelContext.setProperty("scalefactorNumber", {});
		oInternalModelContext.setProperty("currency", {});
		oInternalModelContext.setProperty("isInsightsSupported", false);

		if (this._hasMultiVisualizations()) {
			let alpContentView = this._getDefaultPath();
			if (!Device.system.desktop && alpContentView === TemplateContentView.Hybrid) {
				alpContentView = TemplateContentView.Chart;
			}
			oInternalModelContext.setProperty("alpContentView", alpContentView);
		}

		// Store conditions from filter bar
		// this is later used before navigation to get conditions applied on the filter bar
		this.filterBarConditions = {};

		// As AppStateHandler.applyAppState triggers a navigation we want to make sure it will
		// happen after the routeMatch event has been processed (otherwise the router gets broken)
		this.getAppComponent().getRouterProxy().waitForRouteMatchBeforeNavigation();

		// Configure the initial load settings
		this._setInitLoad();
		const view = this.getView();
		const uiModel = view.getModel("ui");
		const path = `/${view.getId()}`;
		uiModel.setProperty(path, { isEditable: false });
		view.bindElement({ path, model: "ui" });
	}

	onExit(): void {
		delete this.filterBarConditions;
		if (this.extensionAPI) {
			this.extensionAPI.destroy();
		}
		delete this.extensionAPI;
	}

	_onAfterBinding(): void {
		const aTables = this._getControls("table") as Table[];
		let updateActions = true;
		if (EditState.isEditStateDirty()) {
			this._getMultiModeControl()?.invalidateContent();
			const table = this._getTable();
			const oTableBinding = table?.getRowBinding();
			if (oTableBinding) {
				updateActions = false;
				const tableAPI = table?.getParent() as TableAPI;

				// Update the table content using side effects (listBinding.refresh doesn't keep expansion states in a TreeTable)
				CommonUtils.getAppComponent(this.getView())
					.getRoutingService()
					.waitForBindingCleanup()
					.then(() => {
						oTableBinding.attachEventOnce("dataReceived", () => {
							this._updateTableActions(aTables);
						});
						if (tableAPI.getTableDefinition().control.type === "TreeTable") {
							// As the refresh on a TreeTable uses side-effects, we need to make sure there are no pending changes
							// before the side-effects are queried (e.g. failed PATCH queries that would be resent together with side effects GET)
							this.getModel().resetChanges();
						}
						tableAPI.refresh();
						return;
					})
					.catch((e) => {
						Log.warning("Error while waiting refreshing ListReport table", e);
					});
			}
			EditState.setEditStateProcessed();
		}

		if (updateActions) {
			this._updateTableActions(aTables);
		}

		const internalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
		if (!internalModelContext.getProperty("initialVariantApplied")) {
			const viewId = this.getView().getId();
			this.pageReady.waitFor(this._applyAppState(viewId));
			internalModelContext.setProperty("initialVariantApplied", true);
		}
		const environmentCapabilities = CommonUtils.getAppComponent(this.getView()).getEnvironmentCapabilities();
		environmentCapabilities
			.isInsightsEnabled()
			.then((isInsightsEnabled: boolean) => {
				internalModelContext.setProperty("isInsightsSupported", isInsightsEnabled);
				return;
			})
			.catch((error: unknown) => {
				Log.error("Error while checking if insights are enabled", error as string);
			});
	}

	formatters = {
		setALPControlMessageStrip(
			this: ListReportController,
			aIgnoredFields: string[],
			bIsChart: boolean | string,
			oApplySupported?: { enableSearch: boolean }
		): string | undefined {
			let sText = "";
			bIsChart = bIsChart === "true" || bIsChart === true;
			const oFilterBar = this._getFilterBarControl();
			if (oFilterBar && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && bIsChart) {
				const aIgnoredLabels = MessageStrip.getLabels(
					aIgnoredFields,
					oFilterBar.data("entityType"),
					oFilterBar,
					getResourceModel(oFilterBar)
				);
				const bIsSearchIgnored = !oApplySupported?.enableSearch;
				sText = bIsChart
					? MessageStrip.getALPText(aIgnoredLabels, oFilterBar, bIsSearchIgnored)
					: MessageStrip.getText(aIgnoredLabels, oFilterBar, "");
				return sText;
			}
		}
	};

	@privateExtension()
	@extensible("After")
	async onPageReady(mParameters: { forceFocus?: boolean }): Promise<void> {
		if (mParameters.forceFocus) {
			this._setInitialFocus();
		}
		// Remove the handler on back navigation that displays Draft confirmation
		await this.getAppComponent().getShellServices().setBackNavigation(undefined);
	}

	/**
	 * Method called when the content of a custom view used in a list report needs to be refreshed.
	 * This happens either when there is a change on the FilterBar and the search is triggered,
	 * or when a tab with custom content is selected,
	 * or when the view is forced to be refreshed through the Extension API for the list report's public method setTabContentToBeRefreshedOnNextOpening.
	 * This method can be overwritten by the controller extension in case of customization.
	 * @param mParameters Map containing the filter conditions of the FilterBar, the currentTabID
	 * and the view refresh cause (tabChanged, search or forcedRefresh).
	 * The map looks like this:
	 * <code><pre>
	 * 	{
	 * 		filterConditions: {
	 * 			Country: [
	 * 				{
	 * 					operator: "EQ"
	 *					validated: "NotValidated"
	 *					values: ["Germany", ...]
	 * 				},
	 * 				...
	 * 			]
	 * 			...
	 * 		},
	 *		currentTabId: "fe::CustomTab::tab1",
	 *		refreshCause: "tabChanged" | "search" | "forcedRefresh"
	 *	}
	 * </pre></code>
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onViewNeedsRefresh(mParameters: unknown): void {
		/* To be overriden */
	}

	/**
	 * Method called when a filter or search value has been changed in the FilterBar,
	 * but has not been validated yet by the end user (with the 'Go' or 'Search' button).
	 * Typically, the content of the current tab is greyed out until the filters are validated.
	 * This method can be overwritten by the controller extension in case of customization.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onPendingFilters(): void {
		/* To be overriden */
	}

	getCurrentEntitySet(): string {
		return this._getTable()?.data("targetCollectionPath").slice(1);
	}

	/**
	 * Method called when the 'Clear' button on the FilterBar is pressed.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onAfterClear(): void {
		/* To be overriden */
	}

	/**
	 * This method initiates the update of the enabled state of the DataFieldForAction and the visible state of the DataFieldForIBN buttons.
	 * @param aTables Array of tables in the list report
	 */
	_updateTableActions(aTables: Table[]): void {
		let aIBNActions: UI5Element[] = [];
		aTables.forEach(function (oTable) {
			aIBNActions = CommonUtils.getIBNActions(oTable, aIBNActions);
		});
		CommonUtils.updateDataFieldForIBNButtonsVisibility(aIBNActions, this.getView());
		CommonUtils.updateMenuButtonVisiblity(aIBNActions);
	}

	/**
	 * This method scrolls to a specific row on all the available tables.
	 * @param sRowPath The path of the table row context to be scrolled to
	 */
	_scrollTablesToRow(sRowPath: string): void {
		this._getControls("table").forEach(function (oTable: Control) {
			TableScroller.scrollTableToRow(oTable as Table, sRowPath);
		});
	}

	/**
	 * Sets a silent focus on the filter field. Suppresses the opening of the type-ahead popup.
	 * @param filterField The field where the focus should be set after the initial load
	 */
	_focusSilent(filterField: FilterField): void {
		const focusInfo = filterField.getFocusInfo() as { targetInfo: object };
		focusInfo.targetInfo = { silent: true };
		filterField.focus(focusInfo);
	}

	/**
	 * This method sets the initial focus in a list report based on the User Experience guidelines.
	 *
	 */
	_setInitialFocus(): void {
		const dynamicPage = this._getDynamicListReportControl(),
			isHeaderExpanded = dynamicPage.getHeaderExpanded(),
			filterBar = this._getFilterBarControl() as FilterBar;
		if (filterBar && !this._isFilterBarHiddenUsed()) {
			//Enabling mandatory filter fields message dialog
			if (!filterBar.getShowMessages()) {
				filterBar.setShowMessages(true);
			}
			if (isHeaderExpanded) {
				const firstEmptyMandatoryField = filterBar.getFilterItems().find(function (oFilterItem: FilterField) {
					return oFilterItem.getRequired() && oFilterItem.getConditions().length === 0;
				});
				//Focusing on the first empty mandatory filter field, or on the first filter field if the table data is loaded
				// Do a "silent" focus for FilterField, by adding the silent attribute. The silent attribute suppresses typeahead opening.
				if (firstEmptyMandatoryField) {
					if (firstEmptyMandatoryField.isA<FilterField>("sap.ui.mdc.FilterField")) {
						this._focusSilent(firstEmptyMandatoryField);
					} else {
						(firstEmptyMandatoryField as Control).focus();
					}
				} else if (this._isInitLoadEnabled() && filterBar.getFilterItems().length > 0) {
					// Add check for available filterItems
					const fieldToFocus = filterBar.getFilterItems()[0];
					if (fieldToFocus.isA<FilterField>("sap.ui.mdc.FilterField")) {
						this._focusSilent(fieldToFocus);
					} else {
						(fieldToFocus as Control).focus();
					}
				} else {
					//Focusing on the Go button
					this.getView().byId(`${this._getFilterBarControlId()}-btnSearch`)?.focus();
				}
			} else if (this._isInitLoadEnabled()) {
				this._getTable()
					?.focusRow(0)
					.catch(function (error: unknown) {
						Log.error("Error while setting initial focus on the table ", error as string);
					});
			}
		} else {
			this._getTable()
				?.focusRow(0)
				.catch(function (error: unknown) {
					Log.error("Error while setting initial focus on the table ", error as string);
				});
		}
	}

	_getPageTitleInformation(): { title?: string; subtitle: string; intent: string; icon: string } {
		const oManifestEntry = this.getAppComponent().getManifestEntry("sap.app");
		return {
			title: oManifestEntry.title,
			subtitle: oManifestEntry.subTitle || "",
			intent: "",
			icon: ""
		};
	}

	_getFilterBarControl(): FilterBar | undefined {
		return this.getView().byId(this._getFilterBarControlId()) as FilterBar | undefined;
	}

	_getDynamicListReportControl(): DynamicPage {
		return this.getView().byId(this._getDynamicListReportControlId()) as DynamicPage;
	}

	_getAdaptationFilterBarControl(): Control {
		// If the adaptation filter bar is part of the DOM tree, the "Adapt Filter" dialog is open,
		// and we return the adaptation filter bar as an active control (visible for the user)
		const adaptationFilterBar = (this._getFilterBarControl() as { getInbuiltFilter?: Function }).getInbuiltFilter?.();
		return adaptationFilterBar?.getParent() ? adaptationFilterBar : undefined;
	}

	async _applyAppState(viewId: string): Promise<void> {
		await this.getAppComponent().getAppStateHandler().applyAppState(viewId, this.getView());
		const oFilterBar = this._getFilterBarControl();
		if (oFilterBar) {
			oFilterBar.setSuspendSelection(false);
		} else if (this._isFilterBarHidden()) {
			const oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
			oInternalModelContext.setProperty("hasPendingFilters", false);
			if (this._isMultiMode()) {
				this._getMultiModeControl().setCountsOutDated(true);
			}
		}
	}

	_getSegmentedButton(sControl: string): UI5Element | undefined {
		const sSegmentedButtonId = (sControl === "Chart" ? this.getChartControl() : this._getTable())?.data("segmentedButtonId");
		return this.getView().byId(sSegmentedButtonId);
	}

	_getControlFromPageModelProperty(sPath: string): Control | MacroAPI | undefined {
		const controlId = this._getPageModel()?.getProperty(sPath);
		return controlId ? (this.getView().byId(controlId) as Control) : undefined;
	}

	_getDynamicListReportControlId(): string {
		return this._getPageModel()?.getProperty("/dynamicListReportId") || "";
	}

	_getFilterBarControlId(): string {
		return this._getPageModel()?.getProperty("/filterBarId") || "";
	}

	getChartControl(): Control | undefined {
		return this._getControlFromPageModelProperty("/singleChartId") as ChartType;
	}

	_getVisualFilterBarControl(): UI5Element | undefined {
		const sVisualFilterBarId = StableIdHelper.generate(["visualFilter", this._getFilterBarControlId()]);
		return sVisualFilterBarId ? this.getView().byId(sVisualFilterBarId) : undefined;
	}

	_getFilterBarVariantControl(): VariantManagement {
		return this._getControlFromPageModelProperty("/variantManagement/id") as VariantManagement;
	}

	_getMultiModeControl(): MultipleModeControl {
		return this.getView().byId("fe::TabMultipleMode::Control") as MultipleModeControl;
	}

	_getIconTabBar(): IconTabBar {
		return this.getView().byId("fe::TabMultipleMode") as IconTabBar;
	}

	_getTable(): Table | undefined {
		if (this._isMultiMode()) {
			const oControl = this._getMultiModeControl()?.getSelectedInnerControl()?.content;
			return oControl?.isA("sap.ui.mdc.Table") ? (oControl as Table) : undefined;
		} else {
			return this._getControlFromPageModelProperty("/singleTableId") as Table | undefined;
		}
	}

	_getControls(sKey?: string): Control[] {
		if (this._isMultiMode()) {
			const aControls: Control[] = [];
			const oTabMultiMode = this._getMultiModeControl().content;
			oTabMultiMode.getItems().forEach((oItem: unknown) => {
				const oControl = this.getView().byId((oItem as TabContainerItem).getKey()) as Control;
				if (oControl && sKey) {
					if ((oItem as TabContainerItem).getKey().includes(`fe::${sKey}`)) {
						aControls.push(oControl);
					}
				} else if (oControl !== undefined && oControl !== null) {
					aControls.push(oControl);
				}
			});
			return aControls;
		} else if (sKey === "Chart") {
			const oChart = this.getChartControl();
			return oChart ? [oChart] : [];
		} else {
			const oTable = this._getTable();
			return oTable ? [oTable] : [];
		}
	}

	_getDefaultPath(): string {
		const defaultPath = ListReportTemplating.getDefaultPath(this._getPageModel()?.getProperty("/views") || []);
		switch (defaultPath) {
			case "primary":
				return TemplateContentView.Chart;
			case "secondary":
				return TemplateContentView.Table;
			case "both":
			default:
				return TemplateContentView.Hybrid;
		}
	}

	/**
	 * Method to know if ListReport is configured with Multiple Table mode.
	 * @returns Is Multiple Table mode set?
	 */
	_isMultiMode(): boolean {
		return !!this._getPageModel()?.getProperty("/multiViewsControl");
	}

	/**
	 * Method to know if ListReport is configured to load data at start up.
	 * @returns Is InitLoad enabled?
	 */
	_isInitLoadEnabled(): boolean {
		const initLoadMode = this.getView().getViewData().initialLoad;
		return initLoadMode === InitialLoadMode.Enabled;
	}

	_hasMultiVisualizations(): boolean {
		return this._getPageModel()?.getProperty("/hasMultiVisualizations");
	}

	/**
	 * Method to suspend search on the filter bar. The initial loading of data is disabled based on the manifest configuration InitLoad - Disabled/Auto.
	 * It is enabled later when the view state is set, when it is possible to realize if there are default filters.
	 */
	_disableInitLoad(): void {
		const filterBar = this._getFilterBarControl();
		// check for filter bar hidden
		if (filterBar) {
			filterBar.setSuspendSelection(true);
		}
	}

	/**
	 * Method called by flex to determine if the applyAutomatically setting on the variant is valid.
	 * Called only for Standard Variant and only when there is display text set for applyAutomatically (FE only sets it for Auto).
	 * @returns Boolean true if data should be loaded automatically, false otherwise
	 */
	_applyAutomaticallyOnStandardVariant(): boolean {
		// We always return false and take care of it when view state is set
		return false;
	}

	/**
	 * Configure the settings for initial load based on
	 * - manifest setting initLoad - Enabled/Disabled/Auto
	 * - user's setting of applyAutomatically on variant
	 * - if there are default filters
	 * We disable the filter bar search at the beginning and enable it when view state is set.
	 */
	_setInitLoad(): void {
		// if initLoad is Disabled or Auto, switch off filter bar search temporarily at start
		if (!this._isInitLoadEnabled()) {
			this._disableInitLoad();
		}
		// set hook for flex for when standard variant is set (at start or by user at runtime)
		// required to override the user setting 'apply automatically' behaviour if there are no filters
		const variantManagementId = ListReportTemplating.getVariantBackReference(
			this.getView().getViewData(),
			this._getPageModel()?.getData() as ListReportDefinition
		);
		const variantManagement = variantManagementId && (this.getView().byId(variantManagementId) as VariantManagement);
		if (variantManagement) {
			(
				variantManagement as { registerApplyAutomaticallyOnStandardVariant?: Function }
			)?.registerApplyAutomaticallyOnStandardVariant?.(this._applyAutomaticallyOnStandardVariant.bind(this));
		}
	}

	_setShareModel(): void {
		// TODO: deactivated for now - currently there is no _templPriv anymore, to be discussed
		// this method is currently not called anymore from the init method

		const fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
		//var oManifest = this.getOwnerComponent().getAppComponent().getMetadata().getManifestEntry("sap.ui");
		//var sBookmarkIcon = (oManifest && oManifest.icons && oManifest.icons.icon) || "";

		//shareModel: Holds all the sharing relevant information and info used in XML view
		const oShareInfo = {
			bookmarkTitle: document.title, //To name the bookmark according to the app title.
			bookmarkCustomUrl: function (): string {
				const sHash = hasher.getHash();
				return sHash ? `#${sHash}` : window.location.href;
			},
			/*
							To be activated once the FLP shows the count - see comment above
							bookmarkServiceUrl: function() {
								//var oTable = oTable.getInnerTable(); oTable is already the sap.fe table (but not the inner one)
								// we should use table.getListBindingInfo instead of the binding
								var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
								return oBinding ? fnGetDownloadUrl(oBinding) : "";
							},*/
			isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive()
		};

		const oTemplatePrivateModel = this.getOwnerComponent().getModel("_templPriv") as JSONModel;
		oTemplatePrivateModel.setProperty("/listReport/share", oShareInfo);
	}

	/**
	 * Method to update the local UI model of the page with the fields that are not applicable to the filter bar (this is specific to the ALP scenario).
	 * @param oInternalModelContext The internal model context
	 * @param oFilterBar MDC filter bar
	 */
	_updateALPNotApplicableFields(oInternalModelContext: InternalModelContext, oFilterBar: FilterBar): void {
		const mCache: Record<string, string[]> = {};
		const ignoredFields: Record<string, string[]> = {},
			aTables = this._getControls("table"),
			aCharts = this._getControls("Chart");

		if (!aTables.length || !aCharts.length) {
			// If there's not a table and a chart, we're not in the ALP case
			return;
		}

		// For the moment, there's nothing for tables...
		aCharts.forEach(function (oChart) {
			const sChartEntityPath = oChart.data("targetCollectionPath"),
				sChartEntitySet = sChartEntityPath.slice(1),
				sCacheKey = `${sChartEntitySet}Chart`;
			if (!mCache[sCacheKey]) {
				mCache[sCacheKey] = FilterUtils.getNotApplicableFilters(oFilterBar, oChart);
			}
			ignoredFields[sCacheKey] = mCache[sCacheKey];
		});
		oInternalModelContext.setProperty("controls/ignoredFields", ignoredFields);
	}

	/**
	 * Provides the setting whether FilterBar is hidden based on the manifest setting 'hideFilterBar'.
	 * Should be used in combination with _isFilterBarHiddenUsed as it may have overridden this setting.
	 * @returns True if the FilterBar is hidden, false if unknown
	 */
	_isFilterBarHidden(): boolean {
		return this.getView().getViewData().hideFilterBar || false;
	}

	/**
	 * Provides the setting whether FilterBar is hidden but still exists based on the manifest setting 'useHiddenFilterBar'.
	 * Should be used in combination with _isFilterBarHidden as it can also hide the FilterBar.
	 * @returns True if the FilterBar is hidden, false if unknown
	 */
	_isFilterBarHiddenUsed(): boolean {
		return this.getView().getViewData().useHiddenFilterBar || false;
	}

	_getApplyAutomaticallyOnVariant(variantManagement: VariantManagement, key: string | undefined | null): Boolean {
		if (!variantManagement || !key) {
			return false;
		}
		const variants = variantManagement.getVariants();
		const currentVariant = variants.find(function (variant) {
			return variant && variant.getKey() === key;
		});
		return (currentVariant && currentVariant.getProperty("executeOnSelect")) || false;
	}

	_shouldAutoTriggerSearch(oVM: VariantManagement | null | undefined): boolean {
		if (
			this.getView().getViewData().initialLoad === InitialLoadMode.Auto &&
			(!oVM || oVM.getStandardVariantKey() === oVM.getCurrentVariantKey())
		) {
			const oFilterBar = this._getFilterBarControl();
			if (oFilterBar) {
				const oConditions = oFilterBar.getConditions();
				for (const sKey in oConditions) {
					// ignore filters starting with $ (e.g. $search, $editState)
					if (oVM && !sKey.startsWith("$") && Array.isArray(oConditions[sKey]) && oConditions[sKey].length) {
						// load data as per user's setting of applyAutomatically on the variant
						const standardVariant = oVM.getVariants().find((variant) => {
							return variant.getKey() === oVM.getCurrentVariantKey();
						});
						return standardVariant && standardVariant.getExecuteOnSelect();
					}
				}
			}
		}
		return false;
	}

	_updateTable(oTable: Table): void {
		if (!oTable.isTableBound() || this.hasPendingChartChanges) {
			oTable.rebind();
			this.hasPendingChartChanges = false;
		}
	}

	_updateChart(oChart: Chart): void {
		const oInnerChart = (oChart.getControlDelegate() as typeof ChartDelegate)._getChart(oChart);
		if (!(oInnerChart && oInnerChart.isBound("data")) || this.hasPendingTableChanges) {
			(oChart.getControlDelegate() as typeof ChartDelegate).rebind(oChart, oInnerChart.getBindingInfo("data"));
			this.hasPendingTableChanges = false;
		}
	}

	/**
	 * Set the visibility of the filter toggle button.
	 * @param buttonVisible Filter toggle button visibility
	 */
	setFilterToggleVisibility(buttonVisible: boolean): void {
		const filterBar = this._getFilterBarControl();
		filterBar?.getSegmentedButton()?.setVisible(buttonVisible);
	}

	handlers = {
		onInlineEditSave(this: ListReportController): void {
			this.inlineEditFlow.inlineEditSave();
		},
		onFilterSearch(this: ListReportController): void {
			const filterBarAPI = this._getFilterBarControl()!.getParent() as FilterBarAPI;
			filterBarAPI.triggerSearch();
		},
		onFiltersChanged(this: ListReportController, oEvent: FilterBarBase$FiltersChangedEvent): void {
			const oFilterBar = this._getFilterBarControl();
			if (oFilterBar) {
				const oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext | undefined;
				// Pending filters into FilterBar to be used for custom views
				this.onPendingFilters();

				if (oInternalModelContext && oEvent.getParameter("conditionsBased")) {
					oInternalModelContext.setProperty("hasPendingFilters", true);
				}
				if (oInternalModelContext) {
					this._storeFilterBarSelectionVariant(oFilterBar, oInternalModelContext);
				}
			}
		},
		onVariantSelected(this: ListReportController, oEvent: VariantManagement$SelectEvent): void {
			const variantManagement = oEvent.getSource();
			const currentVariantKey = oEvent.getParameter("key");
			const multiModeControl = this._getMultiModeControl();

			if (multiModeControl && !variantManagement?.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
				//Not a Control Variant
				multiModeControl?.invalidateContent();
				multiModeControl?.setFreezeContent(true);
			}

			// setTimeout cause the variant needs to be applied before judging the auto search or updating the app state
			setTimeout((): void => {
				const filterBar = this._getFilterBarControl();
				const dynamicPage = this._getDynamicListReportControl();
				const firstEmptyMandatoryField = filterBar?.getFilterItems().find(function (filterItem) {
					return filterItem.getRequired() && filterItem.getConditions().length === 0;
				});
				if (firstEmptyMandatoryField) {
					dynamicPage.setHeaderExpanded(true);
				}
				if (this._shouldAutoTriggerSearch(variantManagement)) {
					// the app state will be updated via onSearch handler
					const filterBarAPI = this._getFilterBarControl()!.getParent() as FilterBarAPI;
					filterBarAPI.triggerSearch();
				} else if (!this._getApplyAutomaticallyOnVariant(variantManagement, currentVariantKey)) {
					multiModeControl?.setFreezeContent(false);
					this.getExtensionAPI().updateAppState();
					dynamicPage.setHeaderExpanded(true);
				}
			}, 0);
		},
		onVariantSaved(this: ListReportController): void {
			//TODO: Should remove this setTimeOut once Variant Management provides an api to fetch the current variant key on save!!!
			setTimeout(() => {
				this.getExtensionAPI().updateAppState();
			}, 1000);
		},
		onSearch(this: ListReportController): void {
			const oFilterBar = this._getFilterBarControl() as FilterBar; // onsearch is called only if the filterbar exists
			const oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
			const oMdcChart = this.getChartControl();
			const bHideDraft = FilterUtils.getEditStateIsHideDraft(oFilterBar.getConditions());
			oInternalModelContext.setProperty("hasPendingFilters", false);
			oInternalModelContext.setProperty("hideDraftInfo", bHideDraft);
			const dynamicPage = this._getDynamicListReportControl();
			if (!this._getMultiModeControl()) {
				this._updateALPNotApplicableFields(oInternalModelContext, oFilterBar);
			}
			if (oMdcChart) {
				// disable bound actions TODO: this clears everything for the chart?
				(oMdcChart.getBindingContext("internal") as InternalModelContext).setProperty("", {});

				const oPageInternalModelContext = oMdcChart.getBindingContext("pageInternal") as InternalModelContext;
				const sTemplateContentView = oPageInternalModelContext.getProperty(`${oPageInternalModelContext.getPath()}/alpContentView`);
				if (sTemplateContentView === TemplateContentView.Chart) {
					this.hasPendingChartChanges = true;
				}
				if (sTemplateContentView === TemplateContentView.Table) {
					this.hasPendingTableChanges = true;
				}
			}

			//logic for expansion or collapse of filter bar starts
			if (!Device.system.desktop && oInternalModelContext.getProperty("searchTriggeredByInitialLoad") === true) {
				if (dynamicPage.getHeaderExpanded() !== false) {
					dynamicPage.setHeaderExpanded(false);
				}
				//setting it to false so that further search or 'Go' triggers won't collapse the filter bar
				oInternalModelContext.setProperty("searchTriggeredByInitialLoad", false);
			}

			// store filter bar conditions to use later while navigation
			StateUtil.retrieveExternalState(oFilterBar)
				.then((oExternalState) => {
					this.filterBarConditions = oExternalState.filter;
					return;
				})
				.catch(function (oError: unknown) {
					Log.error("Error while retrieving the external state", oError as string);
				});
			if (this.getView().getViewData().liveMode === false) {
				this.getExtensionAPI().updateAppState();
			}

			if (Device.system.phone) {
				const oDynamicPage = this._getDynamicListReportControl();
				if (!this._isInitLoadEnabled()) {
					oDynamicPage.setHeaderExpanded(true);
				} else {
					oDynamicPage.setHeaderExpanded(false);
					this.setFilterToggleVisibility(false);
				}
			}
		},
		/**
		 * Triggers an outbound navigation when a user chooses the chevron.
		 * @param oController
		 * @param sOutboundTarget Name of the outbound target (needs to be defined in the manifest)
		 * @param oContext The context that contains the data for the target app
		 * @param sCreatePath Create path when the chevron is created.
		 * @returns Promise which is resolved once the navigation is triggered
		 * @final
		 */
		async onChevronPressNavigateOutBound(
			oController: ListReportController,
			sOutboundTarget: string,
			oContext: Context,
			sCreatePath: string
		): Promise<void> {
			return oController._intentBasedNavigation.onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath);
		},
		onChartSelectionChanged(this: ListReportController, oEvent: UI5Event<{ data: unknown }, ChartType>): void {
			const oMdcChart = oEvent.getSource().getContent() as Chart,
				oTable = this._getTable(),
				aData = oEvent.getParameter("data"),
				oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
			if (aData) {
				ChartUtils.setChartFilters(oMdcChart);
			}
			const sTemplateContentView = oInternalModelContext.getProperty(`${oInternalModelContext.getPath()}/alpContentView`);
			if (sTemplateContentView === TemplateContentView.Chart) {
				this.hasPendingChartChanges = true;
			} else if (oTable) {
				oTable.rebind();
				this.hasPendingChartChanges = false;
			}
		},
		onSegmentedButtonPressed(this: ListReportController, oEvent: UI5Event): void {
			const selectedKey: string =
				(oEvent.getParameters() as { selectedKey: string }).selectedKey || (oEvent.getParameters() as { key: string }).key;
			const oInternalModelContext = this.getView().getBindingContext("internal") as InternalModelContext;
			oInternalModelContext.setProperty("alpContentView", selectedKey);
			const oChart = this.getChartControl();
			const oTable = this._getTable();

			switch (selectedKey) {
				case TemplateContentView.Table:
					if (oTable) {
						this._updateTable(oTable);
					}
					break;
				case TemplateContentView.Chart:
					if (oChart) {
						this._updateChart(oChart as Chart);
					}
					break;
				case TemplateContentView.Hybrid:
					if (oTable) {
						this._updateTable(oTable);
					}
					if (oChart) {
						this._updateChart(oChart as Chart);
					}
					break;
				default:
					break;
			}
			this.getExtensionAPI().updateAppState();
		},
		onDynamicPageTitleStateChanged(this: ListReportController, event: DynamicPageTitle$StateChangeEvent): void {
			const filterBar = this._getFilterBarControl();
			if (filterBar) {
				this.setFilterToggleVisibility(!!event.getParameter("isExpanded"));
				if (event.getParameter("isExpanded") === false) {
					InvisibleMessage.getInstance().announce(
						filterBar.getAssignedFiltersText().filtersText as string,
						InvisibleMessageMode.Assertive
					);
				}
			}
		}
	};

	/**
	 * Method to update the local UI model of the page with the Selection Variant.
	 * @param filterBar MDC filter bar
	 * @param internalModelContext The internal model context
	 */
	async _storeFilterBarSelectionVariant(filterBar: FilterBar, internalModelContext: InternalModelContext): Promise<void> {
		try {
			const filterBarAPI = filterBar.getParent() as FilterBarAPI;
			const sv = await filterBarAPI.getSelectionVariant();
			internalModelContext.setProperty("filterBarSelectionVariant", sv);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Error fetching selection variant on filter change: ${message}`);
		}
	}

	/**
	 * Method to get the Selection Variant from internal model.
	 * @returns SelectionVariant
	 */
	getFilterBarSelectionVariant(): SelectionVariant {
		const internalModelContext = this.getView().getBindingContext("internal") as InternalModelContext | undefined;
		return (internalModelContext?.getProperty("filterBarSelectionVariant") as SelectionVariant) || new SelectionVariant();
	}
}

export default ListReportController;

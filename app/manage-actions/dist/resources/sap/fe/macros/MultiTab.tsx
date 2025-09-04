import { aggregation, association, defineUI5Class, event, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import MessageStripHelper from "sap/fe/core/helpers/MessageStrip";
import type { IconTabBar$SelectEvent } from "sap/m/IconTabBar";
import IconTabBar from "sap/m/IconTabBar";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { EntitySet } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type CoreEvent from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type RenderManager from "sap/ui/core/RenderManager";
import ControlPersonalizationWriteAPI from "sap/ui/fl/write/api/ControlPersonalizationWriteAPI";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type Tab from "./Tab";
import type { InnerControlType } from "./Tab";
import type FilterBar from "./controls/FilterBar";

type MessageStripProperties = {
	entityTypePath: string;
	ignoredFields: string[];
	title: string;
};

enum BindingAction {
	Suspend = "suspendBinding",
	Resume = "resumeBinding"
}

type MultiTabState = {
	selectedKey: string;
};

@defineUI5Class("sap.fe.macros.MultiTab")
export default class MultiTab extends BuildingBlock<IconTabBar> implements IViewStateContributor<MultiTabState> {
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor = true;

	@property({ type: "string" })
	id!: string;

	@property({ type: "boolean" })
	showCounts!: boolean;

	@aggregation({ type: "sap.fe.macros.Tab", multiple: true, isDefault: true })
	tabs!: Tab[];

	@association({ type: "sap.fe.macros.controls.FilterBar", multiple: false })
	filterBarId!: string;

	@property({ type: "boolean", defaultValue: false })
	setVisibleOverridden!: boolean;

	@property({ type: "boolean", defaultValue: false })
	freezeContent!: boolean;

	@property({ type: "boolean", defaultValue: false })
	countsOutDated!: boolean;

	@association({ type: "sap.fe.macros.controls.FilterBar", multiple: false })
	filterControl!: string;

	@event()
	select!: Function;

	constructor(properties: $ControlSettings & PropertiesOf<MultiTab>, others?: $ControlSettings) {
		super(properties, others);
	}

	initialize(): void {
		this.id = this.createId("Control")!;
		this.filterControl = this.filterBarId + "-content";
		this.content = this.createContent();
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			this.initialize();
		}
	}

	/**
	 * Retrieves the state of the MultiTab to be saved in the app state.
	 * @returns The state of the MultiTab
	 */
	retrieveState(): MultiTabState | null {
		return this?.content
			? {
					selectedKey: this.content.getSelectedKey()
			  }
			: null;
	}

	/**
	 * Applies the state to the MultiTab.
	 * @param controlState The state of the MultiTab
	 */
	applyState(controlState?: MultiTabState): void {
		if (controlState?.selectedKey) {
			const tabBar = this.content;
			if (tabBar?.getItems().find((item) => (item as Tab).getKey() === controlState.selectedKey)) {
				tabBar.setSelectedKey(controlState.selectedKey);
			}
		}
	}

	onBeforeRendering(): void {
		this.getTabsModel(); // Generate the model which is mandatory for some bindings

		const oFilterControl = this._getFilterControl();
		if (!oFilterControl) {
			// In case there's no filterbar, we have to update the counts in the tabs immediately
			this.setCountsOutDated(true);
		}
		const oFilterBarAPI = oFilterControl?.getParent();
		this.getAllInnerControls().forEach((tab: Tab) => {
			if (this.showCounts) {
				tab.attachEvent("internalDataRequested", this.internalRefreshTabsCount.bind(this));
			}
			tab.suspendBinding();
		});
		if (oFilterBarAPI && oFilterBarAPI.isA<FilterBarAPI>("sap.fe.macros.filterBar.FilterBarAPI")) {
			oFilterBarAPI
				.waitForInitialState()
				.then((): void => {
					oFilterBarAPI.attachEvent("internalSearch", this._onSearch.bind(this));
					oFilterBarAPI.attachEvent("internalFilterChanged", this._onFilterChanged.bind(this));
					return;
				})
				.catch((): void => {
					Log.error("Error while waiting for initial state of filter bar");
				});
		}
	}

	onAfterRendering(): void {
		this.getSelectedInnerControl()?.resumeBinding(!this.getProperty("freezeContent"));
		if (this.showCounts && !this.setVisibleOverridden) {
			this.setProperty("setVisibleOverridden", true);
			this.getAllInnerControls().forEach((tab: Tab): void => {
				const originSetVisible = tab.setVisible;
				tab.setVisible = (value: boolean): Tab => {
					if (tab.getVisible() === false && value) {
						tab.refreshCount();
					}
					return originSetVisible.bind(tab)(value);
				};
			});
		}
	}

	static override render<T extends Control>(oRm: RenderManager, oControl: BuildingBlock<T>): void {
		oRm.renderControl(oControl.content!);
	}

	/**
	 * Gets the model containing information related to the IconTabFilters.
	 * @returns The model
	 */
	getTabsModel(): JSONModel | undefined {
		const sTabsModel = "tabsInternal";
		const oContent = this.content;
		if (!oContent) {
			return undefined;
		}
		let oModel = oContent.getModel(sTabsModel) as JSONModel | undefined;
		if (!oModel) {
			oModel = new JSONModel({});
			oContent.setModel(oModel, sTabsModel);
		}
		return oModel;
	}

	/**
	 * Gets the inner control of the displayed tab.
	 * @returns The control
	 */
	getSelectedInnerControl(): Tab | undefined {
		return (this.content?.getItems() as Tab[]).find((tab) => tab.getKey() === this.content?.getSelectedKey());
	}

	/**
	 * Manages the binding of all inner controls when the selected IconTabFilter is changed.
	 * @param evt Event fired by the IconTabBar
	 */
	static handleTabChange(evt: IconTabBar$SelectEvent): void {
		const iconTabBar = evt.getSource();
		const multiControl = iconTabBar.getParent() as MultiTab;

		const parameters = evt.getParameters();
		multiControl._setInnerBinding(true);
		const previousSelectedKey = parameters?.previousKey;
		const selectedKey = parameters?.selectedKey;

		if (selectedKey && previousSelectedKey !== selectedKey) {
			const filterBar = multiControl._getFilterControl();
			if (filterBar && !multiControl.getProperty("freezeContent")) {
				//TODO getselectedTab.refreshContent("tabChanged)
				if (!multiControl.getSelectedInnerControl()?.getTabContent().length) {
					//custom tab
					multiControl._refreshCustomView(filterBar.getFilterConditions(), "tabChanged");
				} else {
					multiControl.refreshSelectedInnerControlContent();
				}
			}
			ControlPersonalizationWriteAPI.add({
				changes: [
					{
						changeSpecificData: {
							changeType: "selectIconTabBarFilter",
							content: {
								selectedKey: selectedKey,
								previousSelectedKey: previousSelectedKey
							}
						},
						selectorElement: iconTabBar
					}
				]
			});
		}

		multiControl._getViewController()?.getExtensionAPI()?.updateAppState();

		multiControl.fireEvent("select", {
			iconTabBar: iconTabBar,
			selectedKey: selectedKey,
			previousKey: previousSelectedKey
		});
	}

	/**
	 * Refreshes the content of the selected inner control.
	 *
	 */
	refreshSelectedInnerControlContent(): void {
		if (this.getSelectedInnerControl()) {
			this.getSelectedInnerControl()?.invalidateContent();
			this.getSelectedInnerControl()?.resumeBinding(true);
		} else {
			// custom tab
			this._refreshCustomView(undefined, "forcedRefresh");
		}
	}

	/**
	 * Invalidates the content of the inner controls.
	 * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be invalidated. If not provided, all the views' content will be invalidated
	 */
	invalidateContent(keys?: string[]): void {
		this.setCountsOutDated(true);
		this.getAllInnerControls().forEach((tab: Tab) => {
			if (keys) {
				for (const key of keys) {
					if (
						tab.getKey() === `fe::table::${key}::LineItem` ||
						tab.getKey() === `fe::CustomTab::${key}` ||
						tab.getKey() === key
					) {
						tab.invalidateContent();
					}
				}
			} else {
				tab.invalidateContent();
			}
		});
	}

	/**
	 * Sets the counts to "out of date" or "up to date"
	 * If the counts are set to "out of date" and the selected IconTabFilter doesn't contain an inner control, all inner controls are requested to get the new counts.
	 * @param bValue Either freezes the control or not
	 */
	setCountsOutDated(bValue = true): void {
		this.setProperty("countsOutDated", bValue);
		// if the current tab is not configured with no inner Control
		// the tab counts must be manually refreshed since no Macro API will sent event internalDataRequested
		if (bValue && !this.getSelectedInnerControl()?.getTabContent().length) {
			this.internalRefreshTabsCount();
		}
	}

	/**
	 * Freezes the content :
	 * - content is frozen: the binding of the inner controls are suspended.
	 * - content is unfrozen: the binding of inner control related to the selected IconTabFilter is resumed.
	 * @param bValue Freeze or not the control
	 */
	setFreezeContent(bValue: boolean): void {
		this.setProperty("freezeContent", bValue);
		this._setInnerBinding();
	}

	/**
	 * Updates the internal model with the properties that are not applicable on each IconTabFilter (containing inner control) according to the entityType of the filter control.
	 *
	 */
	_updateMultiTabNotApplicableFields(): void {
		const tabsModel = this.getTabsModel();
		const filterControl = this._getFilterControl() as Control;
		if (tabsModel && filterControl) {
			const results: Record<string, { notApplicable: { fields: string[]; title: string | undefined } }> = {};
			this.getAllInnerControls().forEach((tab: Tab) => {
				const tabId = tab.getKey();
				const ignoredFields = tab.refreshNotApplicableFields(filterControl) || [];
				results[tabId] = {
					notApplicable: {
						fields: ignoredFields,
						title: this._setTabMessageStrip({
							entityTypePath: filterControl.data("entityType"),
							ignoredFields: ignoredFields,
							title: tab.getText()
						})
					}
				};
				const macroAPI = tab.getTabContent()?.[0];
				if (macroAPI && macroAPI.isA("sap.fe.macros.Chart")) {
					results[tabId] = this.checkNonFilterableEntitySet(macroAPI, tabId, results);
				}
			});
			tabsModel.setData(results);
		}
	}

	/**
	 * Modifies the messagestrip message based on entity set is filerable or not.
	 * @param chartAPI ChartAPI
	 * @param tabId Tab key ID
	 * @param results Should contain fields and title
	 * @returns An object of modified fields and title
	 */
	checkNonFilterableEntitySet(
		chartAPI: InnerControlType,
		tabId: string,
		results: Record<string, { notApplicable: { fields: string[]; title: string | undefined } }>
	): { notApplicable: { fields: string[]; title: string | undefined } } {
		const resourceModel = getResourceModel(chartAPI);
		const chart = chartAPI.getContent();
		const entitySetFilerable =
			chart &&
			MetaModelConverter.getInvolvedDataModelObjects<EntitySet>(
				(chart.getModel() as ODataModel).getMetaModel().getContext(`${chart.data("targetCollectionPath")}`)
			)?.targetObject?.annotations?.Capabilities?.FilterRestrictions?.Filterable;
		if (entitySetFilerable !== undefined && !entitySetFilerable) {
			if (results[tabId].notApplicable.fields.includes("$search")) {
				results[tabId].notApplicable.title += " " + resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
			} else {
				results[tabId].notApplicable.fields = ["nonFilterable"];
				results[tabId].notApplicable.title = resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
			}
		}
		return results[tabId];
	}

	/**
	 * Gets the inner controls.
	 * @param onlyForVisibleTab Should display only the visible controls
	 * @returns An array of controls
	 */
	getAllInnerControls(onlyForVisibleTab = false): Tab[] {
		return (this.content?.getItems() as Tab[]).filter((tab) => !onlyForVisibleTab || tab.getVisible()) ?? [];
	}

	_getFilterControl(): FilterBar | undefined {
		return UI5Element.getElementById(this.filterControl) as FilterBar | undefined;
	}

	_getViewController(): PageController {
		const view = CommonUtils.getTargetView(this);
		return view && view.getController();
	}

	_refreshCustomView(oFilterConditions: unknown, sRefreshCause: string): void {
		(this._getViewController() as ListReportController)?.onViewNeedsRefresh?.({
			filterConditions: oFilterConditions,
			currentTabId: this.content?.getSelectedKey(),
			refreshCause: sRefreshCause
		});
	}

	internalRefreshTabsCount(tableEvent?: CoreEvent): void {
		// If the refresh is triggered by an event (internalDataRequested)
		// we cannot use the selected key as reference since table can be refreshed by SideEffects
		// so the table could be into a different tab -> we use the source of the event to find the targeted tab
		// If not triggered by an event -> refresh at least the counts of the current MacroAPI
		const eventTab = tableEvent?.getSource() as Tab;
		const targetKey = eventTab ? eventTab.getKey() : this.content?.getSelectedKey();
		if (targetKey) {
			this.refreshTabsCount([targetKey.split("::")[2]]);
		}
	}

	/**
	 * Refreshes the count of the views in the MultiMode control.
	 * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' count will be refreshed. If not provided, all the views' count will be refreshed
	 */
	refreshTabsCount(keys?: string[]): void {
		if (!keys) {
			this.setCountsOutDated(true);
		}
		this.getAllInnerControls(true).forEach((tab: Tab): void => {
			if (this.countsOutDated || (keys && keys.includes(tab.getKey().split("::")[2]))) {
				tab.refreshCount();
			}
		});
		this.setCountsOutDated(false);
	}

	/**
	 * Refreshes the content of the underlying views upon the next opening.
	 * Note: The content of the selected view, if part of the provided keys, will be refreshed immediately.
	 * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be refreshed. If not provided, all the views' content will be refreshed
	 */
	setTabContentToBeRefreshedOnNextOpening(keys?: string[]): void {
		const selectedTabKey = this?.content?.getSelectedKey();
		const tabKeys: string[] = [];
		const refreshSelectedTabContent = keys ? keys.includes(selectedTabKey!.split("::")[2]) || keys.includes(selectedTabKey!) : true;
		if (keys) {
			for (const key of keys) {
				if (
					selectedTabKey !== `fe::table::${key}::LineItem` &&
					selectedTabKey !== `fe::CustomTab::${key}` &&
					selectedTabKey !== key
				) {
					tabKeys.push(key);
				}
			}
		} else {
			this?.getAllInnerControls().forEach((tab: Tab) => {
				if (tab.getKey() !== selectedTabKey) {
					tabKeys.push(tab.getKey().split("::")[2]);
				}
			});
		}
		this?.invalidateContent(tabKeys);
		if (refreshSelectedTabContent) {
			this?.refreshSelectedInnerControlContent();
		}
	}

	_setInnerBinding(requestIfNotInitialized = false): void {
		if (this.content) {
			this.getAllInnerControls().forEach((tab: Tab) => {
				const isSelectedKey = tab.getKey() === this.content?.getSelectedKey();
				const action = isSelectedKey && !this.getProperty("freezeContent") ? BindingAction.Resume : BindingAction.Suspend;
				tab[action]?.(action === BindingAction.Resume ? requestIfNotInitialized && isSelectedKey : undefined!);
			});
		}
	}

	_setTabMessageStrip(properties: MessageStripProperties): string | undefined {
		let sText = "";
		const aIgnoredFields = properties.ignoredFields;
		const oFilterControl = this._getFilterControl() as Control;
		if (oFilterControl && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && properties.title) {
			const aIgnoredLabels = MessageStripHelper.getLabels(
				aIgnoredFields,
				properties.entityTypePath,
				oFilterControl,
				getResourceModel(oFilterControl)
			);
			sText = MessageStripHelper.getText(aIgnoredLabels, oFilterControl, properties.title);
			return sText;
		}
	}

	_onSearch(oEvent: CoreEvent<{ conditions: unknown }>): void {
		this.setCountsOutDated(true);
		this.setFreezeContent(false);
		// TODO this.getSelectedTab.refreshContent()
		if (this.getSelectedInnerControl()) {
			this._updateMultiTabNotApplicableFields();
			if (this.getSelectedInnerControl()!.getTabContent().length == 0) {
				this.getSelectedInnerControl()!.fireEvent("internalDataRequested", oEvent.getParameters());
			}
		} else {
			// custom tab
			this._refreshCustomView(oEvent.getParameter("conditions"), "search");
		}
	}

	_onFilterChanged(oEvent: CoreEvent<{ conditionsBased: boolean }>): void {
		if (oEvent.getParameter("conditionsBased")) {
			this.setFreezeContent(true);
		}
	}

	createContent(): IconTabBar {
		return (
			<IconTabBar
				expandable={false}
				headerMode="Inline"
				id={this.createId("_mt")}
				stretchContentHeight={false}
				select={MultiTab.handleTabChange}
			>
				{{
					items: this.tabs
				}}
			</IconTabBar>
		);
	}
}

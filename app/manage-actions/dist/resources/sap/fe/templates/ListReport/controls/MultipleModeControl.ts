import type { EntitySet } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import MessageStrip from "sap/fe/core/helpers/MessageStrip";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type MacroAPI from "sap/fe/macros/MacroAPI";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type IconTabBar from "sap/m/IconTabBar";
import type { IconTabBar$SelectEvent } from "sap/m/IconTabBar";
import type IconTabFilter from "sap/m/IconTabFilter";
import type CoreEvent from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type RenderManager from "sap/ui/core/RenderManager";
import ControlPersonalizationWriteAPI from "sap/ui/fl/write/api/ControlPersonalizationWriteAPI";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

export type InnerControlType = MacroAPI &
	Partial<{
		resumeBinding: Function;
		suspendBinding: Function;
		getCounts: Function;
		refreshNotApplicableFields: Function;
		invalidateContent: Function;
		getContent: Function;
	}>;

type MessageStripProperties = {
	entityTypePath: string;
	ignoredFields: string[];
	title: string;
};

enum BindingAction {
	Suspend = "suspendBinding",
	Resume = "resumeBinding"
}

@defineUI5Class("sap.fe.templates.ListReport.controls.MultipleModeControl")
class MultipleModeControl extends Control {
	@property({ type: "boolean" })
	showCounts!: boolean;

	@property({ type: "boolean", defaultValue: false })
	setVisibleOverridden!: boolean;

	@property({ type: "boolean", defaultValue: false })
	freezeContent!: boolean;

	@property({ type: "boolean", defaultValue: false })
	countsOutDated!: boolean;

	@aggregation({ type: "sap.m.IconTabBar", multiple: false, isDefault: true })
	content!: IconTabBar;

	@association({ type: "sap.ui.core.Control", multiple: true })
	innerControls!: string[];

	@association({ type: "sap.fe.macros.controls.FilterBar", multiple: false })
	filterControl!: string;

	@event()
	select!: Function;

	constructor(
		id?: string | undefined | (PropertiesOf<MultipleModeControl> & $ControlSettings),
		settings?: $ControlSettings & PropertiesOf<MultipleModeControl>
	) {
		super(id as string, settings);
	}

	onBeforeRendering(): void {
		this.getTabsModel(); // Generate the model which is mandatory for some bindings

		const oFilterControl = this._getFilterControl();
		if (!oFilterControl) {
			// In case there's no filterbar, we have to update the counts in the tabs immediately
			this.setCountsOutDated(true);
		}
		const oFilterBarAPI = oFilterControl?.getParent();
		this.getAllInnerControls().forEach((oMacroAPI) => {
			if (this.showCounts) {
				oMacroAPI.attachEvent("internalDataRequested", this.internalRefreshTabsCount.bind(this));
			}
			oMacroAPI.suspendBinding?.();
		});
		if (oFilterBarAPI) {
			oFilterBarAPI.attachEvent("internalSearch", this._onSearch.bind(this));
			oFilterBarAPI.attachEvent("internalFilterChanged", this._onFilterChanged.bind(this));
		}
	}

	onAfterRendering(): void {
		this.getSelectedInnerControl()?.resumeBinding?.(!this.getProperty("freezeContent"));
		if (this.showCounts && !this.setVisibleOverridden) {
			this.setProperty("setVisibleOverridden", true);
			this.getAllInnerControls().forEach((macroAPI: MacroAPI): void => {
				const iconTabFilter = this._getTabFromInnerControl(macroAPI);
				// No count to show
				if (!iconTabFilter) return;

				const originSetVisible = iconTabFilter.setVisible;
				iconTabFilter.setVisible = (value: boolean): IconTabFilter => {
					if (iconTabFilter.getVisible() === false && value) {
						this.refreshTabCount(macroAPI);
					}
					return originSetVisible.bind(iconTabFilter)(value);
				};
			});
		}
	}

	static render(oRm: RenderManager, oControl: MultipleModeControl): void {
		oRm.renderControl(oControl.content);
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
	getSelectedInnerControl(): InnerControlType | undefined {
		const oSelectedTab = this.content?.getItems().find((oItem) => (oItem as IconTabFilter).getKey() === this.content.getSelectedKey());
		return oSelectedTab
			? this.getAllInnerControls().find((oMacroAPI) => this._getTabFromInnerControl(oMacroAPI) === oSelectedTab)
			: undefined;
	}

	/**
	 * Manages the binding of all inner controls when the selected IconTabFilter is changed.
	 * @param oEvent Event fired by the IconTabBar
	 */
	static handleTabChange(oEvent: IconTabBar$SelectEvent): void {
		const oIconTabBar = oEvent.getSource();
		const oMultiControl = oIconTabBar.getParent() as MultipleModeControl;

		const mParameters = oEvent.getParameters();
		oMultiControl._setInnerBinding(true);
		const sPreviousSelectedKey = mParameters?.previousKey;
		const sSelectedKey = mParameters?.selectedKey;

		if (sSelectedKey && sPreviousSelectedKey !== sSelectedKey) {
			const oFilterBar = oMultiControl._getFilterControl();
			if (oFilterBar && !oMultiControl.getProperty("freezeContent")) {
				if (!oMultiControl.getSelectedInnerControl()) {
					//custom tab
					oMultiControl._refreshCustomView(oFilterBar.getFilterConditions(), "tabChanged");
				}
			}
			ControlPersonalizationWriteAPI.add({
				changes: [
					{
						changeSpecificData: {
							changeType: "selectIconTabBarFilter",
							content: {
								selectedKey: sSelectedKey,
								previousSelectedKey: sPreviousSelectedKey
							}
						},
						selectorElement: oIconTabBar
					}
				]
			});
		}

		oMultiControl._getViewController()?.getExtensionAPI()?.updateAppState();

		oMultiControl.fireEvent("select", {
			iconTabBar: oIconTabBar,
			selectedKey: sSelectedKey,
			previousKey: sPreviousSelectedKey
		});
	}

	/**
	 * Refreshes the content of the selected inner control.
	 *
	 */
	refreshSelectedInnerControlContent(): void {
		if (this.getSelectedInnerControl()) {
			this.getSelectedInnerControl()?.invalidateContent?.();
			this.getSelectedInnerControl()?.resumeBinding?.(true);
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
		this.getAllInnerControls().forEach((macroAPI) => {
			if (keys) {
				const iconTabFilter = this._getTabFromInnerControl(macroAPI);
				for (const key of keys) {
					if (
						iconTabFilter &&
						(iconTabFilter.getKey() === `fe::table::${key}::LineItem` || iconTabFilter.getKey() === `fe::CustomTab::${key}`)
					) {
						macroAPI.invalidateContent?.();
					}
				}
			} else {
				macroAPI.invalidateContent?.();
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
		if (bValue && !this.getSelectedInnerControl()) {
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
		const oFilterControl = this._getFilterControl() as Control;
		if (tabsModel && oFilterControl) {
			const results: Record<string, { notApplicable: { fields: string[]; title: string | undefined } }> = {};
			const view = CommonUtils.getTargetView(this);
			const viewData = view.getViewData();
			if (!viewData.useHiddenFilterBar) {
				this.getAllInnerControls().forEach((oMacroAPI) => {
					const oTab = this._getTabFromInnerControl(oMacroAPI);
					if (oTab) {
						const sTabId = oTab.getKey();
						const mIgnoredFields = oMacroAPI.refreshNotApplicableFields?.(oFilterControl) || [];
						results[sTabId] = {
							notApplicable: {
								fields: mIgnoredFields,
								title: this._setTabMessageStrip({
									entityTypePath: oFilterControl.data("entityType"),
									ignoredFields: mIgnoredFields,
									title: oTab.getText()
								})
							}
						};
						if (oMacroAPI && oMacroAPI.isA("sap.fe.macros.Chart")) {
							results[sTabId] = this.checkNonFilterableEntitySet(oMacroAPI, sTabId, results);
						}
					}
				});
				tabsModel.setData(results);
			}
		}
	}

	/**
	 * Modifies the messagestrip message based on entity set is filerable or not.
	 * @param oMacroAPI Macro chart api
	 * @param sTabId Tab key ID
	 * @param results Should contain fields and title
	 * @returns An object of modified fields and title
	 */
	checkNonFilterableEntitySet(
		oMacroAPI: InnerControlType,
		sTabId: string,
		results: Record<string, { notApplicable: { fields: string[]; title: string | undefined } }>
	): { notApplicable: { fields: string[]; title: string | undefined } } {
		const resourceModel = getResourceModel(oMacroAPI);
		const oChart = oMacroAPI?.getContent ? oMacroAPI.getContent() : undefined;
		const bEntitySetFilerable =
			oChart &&
			MetaModelConverter.getInvolvedDataModelObjects<EntitySet>(
				(oChart.getModel() as ODataModel).getMetaModel().getContext(`${oChart.data("targetCollectionPath")}`)
			)?.targetObject?.annotations?.Capabilities?.FilterRestrictions?.Filterable;
		if (bEntitySetFilerable !== undefined && !bEntitySetFilerable) {
			if (results[sTabId].notApplicable.fields.includes("$search")) {
				results[sTabId].notApplicable.title += " " + resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
			} else {
				results[sTabId].notApplicable.fields = ["nonFilterable"];
				results[sTabId].notApplicable.title = resourceModel.getText("C_LR_MULTIVIZ_CHART_MULTI_NON_FILTERABLE");
			}
		}
		return results[sTabId];
	}

	/**
	 * Gets the inner controls.
	 * @param bOnlyForVisibleTab Should display only the visible controls
	 * @returns An array of controls
	 */
	getAllInnerControls(bOnlyForVisibleTab = false): InnerControlType[] {
		return (
			this.innerControls.reduce((aInnerControls: InnerControlType[], sInnerControl: string) => {
				const oControl = UI5Element.getElementById(sInnerControl) as InnerControlType;
				if (oControl) {
					aInnerControls.push(oControl);
				}
				return aInnerControls.filter(
					(oInnerControl) => !bOnlyForVisibleTab || this._getTabFromInnerControl(oInnerControl)?.getVisible()
				);
			}, []) || []
		);
	}

	_getFilterControl(): FilterBar | undefined {
		return UI5Element.getElementById(this.filterControl) as FilterBar | undefined;
	}

	_getTabFromInnerControl(oControl: Control): IconTabFilter | undefined {
		let oTab: UI5Element | undefined = oControl;
		if (oTab && !oTab.isA<IconTabFilter>("sap.m.IconTabFilter") && (oTab as { getParent?: Function }).getParent) {
			oTab = oControl.getParent() as UI5Element | undefined;
		}
		return oTab && oTab.isA<IconTabFilter>("sap.m.IconTabFilter") ? oTab : undefined;
	}

	_getViewController(): PageController {
		const oView = CommonUtils.getTargetView(this);
		return oView && oView.getController();
	}

	_refreshCustomView(oFilterConditions: unknown, sRefreshCause: string): void {
		(this._getViewController() as ListReportController)?.onViewNeedsRefresh?.({
			filterConditions: oFilterConditions,
			currentTabId: this.content.getSelectedKey(),
			refreshCause: sRefreshCause
		});
	}

	/**
	 * Get the count of the Tab containing the macro passed as parameter.
	 * @param macroAPI The content of the tab we want to refresh
	 */
	refreshTabCount(macroAPI: InnerControlType): void {
		const iconTabFilter = this._getTabFromInnerControl(macroAPI);
		if (!iconTabFilter) {
			return;
		}
		if (macroAPI?.getCounts) {
			iconTabFilter.setCount("...");
			macroAPI
				.getCounts()
				.then((count: string): IconTabFilter => {
					return iconTabFilter.setCount(count || "0");
				})
				.catch(function (error: unknown): void {
					Log.error(`Error while requesting Counts for Control: ${error}`);
				});
		}
	}

	internalRefreshTabsCount(tableEvent?: CoreEvent): void {
		// If the refresh is triggered by an event (internalDataRequested)
		// we cannot use the selected key as reference since table can be refreshed by SideEffects
		// so the table could be into a different tab -> we use the source of the event to find the targeted tab
		// If not triggered by an event -> refresh at least the counts of the current MacroAPI
		const eventMacroAPI = tableEvent?.getSource() as MacroAPI;
		const targetKey = eventMacroAPI ? this._getTabFromInnerControl(eventMacroAPI)?.getKey() : this.content?.getSelectedKey();
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
		this.getAllInnerControls(true).forEach((oMacroAPI): void => {
			const oIconTabFilter = this._getTabFromInnerControl(oMacroAPI);
			if (this.countsOutDated || (keys && oIconTabFilter && keys.includes(oIconTabFilter.getKey().split("::")[2]))) {
				this.refreshTabCount(oMacroAPI);
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
		const selectedTabKey = this?.content.getSelectedKey();
		const tabKeys: string[] = [];
		const refreshSelectedTabContent = keys ? keys.includes(selectedTabKey?.split("::")[2]) : true;
		if (keys) {
			for (const key of keys) {
				if (selectedTabKey !== `fe::table::${key}::LineItem` && selectedTabKey !== `fe::CustomTab::${key}`) {
					tabKeys.push(key);
				}
			}
		} else {
			this?.getAllInnerControls().forEach((macroAPI) => {
				const iconTabFilter = this?._getTabFromInnerControl(macroAPI);
				if (iconTabFilter && iconTabFilter.getKey() !== selectedTabKey) {
					tabKeys.push(iconTabFilter.getKey().split("::")[2]);
				}
			});
		}
		this?.invalidateContent(tabKeys);
		if (refreshSelectedTabContent) {
			this?.refreshSelectedInnerControlContent();
		}
	}

	_setInnerBinding(bRequestIfNotInitialized = false): void {
		if (this.content) {
			this.getAllInnerControls().forEach((oMacroAPI) => {
				const oIconTabFilter = this._getTabFromInnerControl(oMacroAPI);
				const bIsSelectedKey = oIconTabFilter?.getKey() === this.content.getSelectedKey();
				const sAction = bIsSelectedKey && !this.getProperty("freezeContent") ? BindingAction.Resume : BindingAction.Suspend;
				oMacroAPI[sAction]?.(sAction === BindingAction.Resume ? bRequestIfNotInitialized && bIsSelectedKey : undefined);
			});
		}
	}

	_setTabMessageStrip(properties: MessageStripProperties): string | undefined {
		let sText = "";
		const aIgnoredFields = properties.ignoredFields;
		const oFilterControl = this._getFilterControl() as Control;
		if (oFilterControl && Array.isArray(aIgnoredFields) && aIgnoredFields.length > 0 && properties.title) {
			const aIgnoredLabels = MessageStrip.getLabels(
				aIgnoredFields,
				properties.entityTypePath,
				oFilterControl,
				getResourceModel(oFilterControl)
			);
			sText = MessageStrip.getText(aIgnoredLabels, oFilterControl, properties.title);
			return sText;
		}
	}

	_onSearch(oEvent: CoreEvent<{ conditions: unknown }>): void {
		this.setCountsOutDated(true);
		this.setFreezeContent(false);
		if (this.getSelectedInnerControl()) {
			this._updateMultiTabNotApplicableFields();
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
}

export default MultipleModeControl;

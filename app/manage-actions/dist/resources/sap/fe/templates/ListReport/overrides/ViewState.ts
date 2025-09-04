import Log from "sap/base/Log";
import type ViewState from "sap/fe/core/controllerextensions/ViewState";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import CoreLibrary from "sap/fe/core/library";
import type { PropertyInfo } from "sap/fe/macros/DelegateUtil";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import NavLibrary from "sap/fe/navigation/library";
import type { default as ListReportController } from "sap/fe/templates/ListReport/ListReportController.controller";
import Device from "sap/ui/Device";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";

type LRViewData = {
	controlConfiguration?: Record<string, Record<string, unknown>>;
	entitySet?: string;
	contextPath?: string;
	variantManagement?: boolean;
};

const NavType = NavLibrary.NavType,
	VariantManagementType = CoreLibrary.VariantManagement,
	TemplateContentView = CoreLibrary.TemplateContentView;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ViewStateOverride = {
	_bSearchTriggered: false,
	applyInitialStateOnly: function (): boolean {
		return true;
	},
	onBeforeStateApplied: function (
		this: ViewState & typeof ViewStateOverride,
		aPromises: Promise<unknown>[],
		navigationType?: string
	): void {
		const oView = this.getView(),
			oController = oView.getController() as ListReportController,
			oFilterBar = oController._getFilterBarControl(),
			aTables = oController._getControls("table") as Table[];
		if (oFilterBar) {
			oFilterBar.setSuspendSelection(true);
			aPromises.push(oFilterBar.waitForInitialization());
			//This is required to remove any existing or default filter conditions before restoring the filter bar state in hybrid navigation mode.
			if (navigationType === NavType.hybrid) {
				this._clearFilterConditions(oFilterBar);
			}
		}
		aTables.forEach(function (oTable: Table): void {
			aPromises.push((oTable as unknown as { initialized: () => Promise<unknown> }).initialized());
		});

		delete this._bSearchTriggered;
	},
	adaptBindingRefreshControls: function (this: ViewState, aControls: Control[]): void {
		const oView = this.base.getView(),
			oController = oView.getController() as ListReportController,
			aViewControls = oController._getControls(),
			aControlsToRefresh = KeepAliveHelper.getControlsForRefresh(oView, aViewControls);

		Array.prototype.push.apply(aControls, aControlsToRefresh);
	},
	adaptStateControls: function (this: ViewState & typeof ViewStateOverride, aStateControls: UI5Element[]): void {
		const oView = this.base.getView(),
			oController = oView.getController() as ListReportController;
		const oFilterBarVM = this._getFilterBarVM(oView);
		if (oFilterBarVM) {
			aStateControls.push(oFilterBarVM);
		}
		if (oController._isMultiMode()) {
			aStateControls.push(oController._getMultiModeControl());
		}
		if (oController._hasMultiVisualizations()) {
			aStateControls.push(oController._getSegmentedButton(TemplateContentView.Chart)!);
			aStateControls.push(oController._getSegmentedButton(TemplateContentView.Table)!);
		}
		aStateControls.push(oView.byId("fe::ListReport")!);
	},
	retrieveAdditionalStates: function (
		this: ViewState & typeof ViewStateOverride,
		mAdditionalStates: { dataLoaded: boolean; alpContentView: string }
	): void {
		const oView = this.getView(),
			oController = oView.getController() as ListReportController,
			bPendingFilter = (oView.getBindingContext("internal") as InternalModelContext).getProperty("hasPendingFilters");

		mAdditionalStates.dataLoaded = !bPendingFilter || !!this._bSearchTriggered;
		if (oController._hasMultiVisualizations()) {
			const sAlpContentView = oView.getBindingContext("internal")!.getProperty("alpContentView");
			mAdditionalStates.alpContentView = sAlpContentView;
		}

		delete this._bSearchTriggered;
	},
	applyAdditionalStates: function (
		this: ViewState & typeof ViewStateOverride,
		oAdditionalStates?: { dataLoaded: boolean; alpContentView?: string }
	): void {
		const oView = this.getView(),
			oController = oView.getController() as ListReportController,
			oFilterBar = oController._getFilterBarControl();

		if (oAdditionalStates) {
			if (oFilterBar) {
				const filterBarAPI = oFilterBar.getParent() as FilterBarAPI;

				// Trigger search if live mode is enabled or data is loaded
				if (oFilterBar.getLiveMode() || oAdditionalStates.dataLoaded === true) {
					filterBarAPI.triggerSearch();
					this._bSearchTriggered = true;
				}
				// Handle case when data is not yet loaded
				else if (oAdditionalStates.dataLoaded === false) {
					// Prevent data from being loaded on navigating back
					(oFilterBar as { _bSearchTriggered?: boolean })._bSearchTriggered = false;
				}
			}

			if (oController._hasMultiVisualizations()) {
				const oInternalModelContext = oView.getBindingContext("internal") as InternalModelContext;
				if (!Device.system.desktop && oAdditionalStates.alpContentView == TemplateContentView.Hybrid) {
					oAdditionalStates.alpContentView = TemplateContentView.Chart;
				}
				oInternalModelContext
					.getModel()
					.setProperty(`${oInternalModelContext.getPath()}/alpContentView`, oAdditionalStates.alpContentView);
			}
		}
	},
	/************************************* private helper *****************************************/

	/**
	 * Variant management used by filter bar.
	 * @param view View of the LR filter bar
	 * @returns VariantManagement if used
	 */
	_getFilterBarVM: (view: View): VariantManagement | undefined => {
		let variantManagement;
		const viewData = view.getViewData() as LRViewData;
		switch (viewData.variantManagement) {
			case VariantManagementType.Page:
				variantManagement = view.byId("fe::PageVariantManagement");
				break;
			case VariantManagementType.Control:
				variantManagement = (view.getController() as ListReportController)._getFilterBarVariantControl();
				break;
			case VariantManagementType.None:
			default:
				break;
		}
		return variantManagement as VariantManagement | undefined;
	},

	/*
	 * Sets filtered: false flag to every field so that it can be cleared out
	 *
	 * @param oFilterBar filterbar control is used to display filter properties in a user-friendly manner to populate values for a query
	 * @returns promise which will be resolved to object
	 * @private
	 */
	_fnClearStateBeforexAppNav: async function (oFilterBar: FilterBar): Promise<unknown> {
		return StateUtil.retrieveExternalState(oFilterBar)
			.then((oExternalState: { filter: Record<string, Record<string, boolean>[]> }) => {
				const oCondition = oExternalState.filter;
				for (const field in oCondition) {
					if (field !== "$editState" && field !== "$search" && oCondition[field]) {
						oCondition[field].forEach((condition: Record<string, boolean>) => {
							condition["filtered"] = false;
						});
					}
				}
				return oCondition;
			})
			.catch(function (oError: unknown): void {
				Log.error("Error while retrieving the external state", oError as string);
			});
	},

	_clearFilterConditions: async function (oFilterBar: FilterBar): Promise<unknown> {
		const aItems: PropertyInfo[] = [];
		return oFilterBar.waitForInitialization().then(async () => {
			const oClearConditions = await this._fnClearStateBeforexAppNav(oFilterBar);
			return StateUtil.applyExternalState(oFilterBar, {
				filter: oClearConditions,
				items: aItems
			});
		});
	}
};

export default ViewStateOverride;

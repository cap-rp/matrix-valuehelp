import Log from "sap/base/Log";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import ChartUtils from "sap/fe/macros/chart/ChartUtils";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type { InternalBindingInfo } from "sap/fe/macros/table/Utils";
import type { LRCustomMessage } from "sap/fe/templates/ListReport/LRMessageStrip";
import { LRMessageStrip } from "sap/fe/templates/ListReport/LRMessageStrip";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import { InvisibleMessageMode } from "sap/ui/core/library";
import type Chart from "sap/ui/mdc/Chart";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * Extension API for list reports in SAP Fiori elements for OData V4.
 *
 * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
 * @public
 * @hideconstructor
 * @final
 * @since 1.79.0
 */
@defineUI5Class("sap.fe.templates.ListReport.ExtensionAPI")
class ListReportExtensionAPI extends ExtensionAPI {
	public _controller!: ListReportController;

	ListReportMessageStrip!: LRMessageStrip;

	/**
	 * Refreshes the List Report.
	 * This method currently only supports triggering the search (by clicking on the GO button)
	 * in the List Report Filter Bar. It can be used to request the initial load or to refresh the
	 * currently shown data based on the filters entered by the user.
	 * Please note: The Promise is resolved once the search is triggered and not once the data is returned.
	 * @returns Resolved once the data is refreshed or rejected if the request failed
	 * @public
	 */
	async refresh(): Promise<void> {
		const filterBar = this._controller._getFilterBarControl();
		const filterBarAPI = filterBar?.getParent() as FilterBarAPI;
		if (filterBarAPI) {
			filterBarAPI.triggerSearch();
		}
		// TODO: if there is no filter bar, make refresh work
		return Promise.resolve();
	}

	/**
	 * Gets the list entries currently selected for the displayed control.
	 * @returns Array containing the selected contexts
	 * @public
	 */
	getSelectedContexts(): Context[] {
		const oControl = ((this._controller._isMultiMode() &&
			this._controller._getMultiModeControl()?.getSelectedInnerControl()?.content) ||
			this._controller._getTable()) as Table | (Chart & { get_chart: Function }) | TableAPI; // This can never be a TableAPI, but it causes issue line 73 otherwise.
		if (oControl.isA<Chart & { get_chart: Function }>("sap.ui.mdc.Chart")) {
			const aSelectedContexts = [];
			if (oControl && oControl.get_chart()) {
				const aSelectedDataPoints = ChartUtils.getChartSelectedData(oControl.get_chart());
				for (const item of aSelectedDataPoints) {
					aSelectedContexts.push(item.context);
				}
			}
			return aSelectedContexts;
		} else {
			return (oControl.getParent() as TableAPI).getSelectedContexts();
		}
	}

	/**
	 * Refreshes the count of the views in the MultiMode control.
	 * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' count will be refreshed. If not provided, all the views' count will be refreshed
	 * @public
	 */
	refreshTabsCount(keys?: string[]): void {
		this._controller._getMultiModeControl()?.refreshTabsCount(keys);
	}

	/**
	 * Refreshes the content of the underlying views upon the next opening.
	 * Note: The content of the selected view, if part of the provided keys, will be refreshed immediately.
	 * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be refreshed. If not provided, all the views' content will be refreshed
	 * @public
	 */
	setTabContentToBeRefreshedOnNextOpening(keys?: string[]): void {
		this._controller._getMultiModeControl()?.setTabContentToBeRefreshedOnNextOpening(keys);
	}

	/**
	 * Set the filter values for the given property in the filter bar.
	 * The filter values can be either a single value or an array of values.
	 * Each filter value must be represented as a primitive value.
	 * @param sConditionPath The path to the property as a condition path
	 * @param [sOperator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
	 * @param vValues The values to be applied
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setFilterValues(
		sConditionPath: string,
		sOperator: string | undefined,
		vValues?: undefined | string | number | boolean | string[] | number[] | boolean[]
	): Promise<void> {
		// The List Report has two filter bars: The filter bar in the header and the filter bar in the "Adapt Filter" dialog;
		// when the dialog is opened, the user is working with that active control: Pass it to the setFilterValues method!
		const filterBar = this._controller._getAdaptationFilterBarControl() || this._controller._getFilterBarControl();
		if (vValues === undefined) {
			vValues = sOperator;
			return FilterUtils.setFilterValues(filterBar as FilterBar, sConditionPath, vValues);
		}

		return FilterUtils.setFilterValues(filterBar as FilterBar, sConditionPath, sOperator, vValues);
	}

	/**
	 * This method converts the filter conditions to filters.
	 * @param mFilterConditions Map containing the filter conditions of the FilterBar.
	 * @returns Object containing the converted FilterBar filters or undefined.
	 * @public
	 */
	createFiltersFromFilterConditions(mFilterConditions: Record<string, ConditionObject[]>): object | undefined {
		const filterBar = this._controller._getFilterBarControl();
		if (!filterBar) {
			Log.error("The filter bar is not available");
			return;
		}
		return FilterUtils.getFilterInfo(filterBar as unknown as IFilterControl, undefined, mFilterConditions);
	}

	/**
	 * Provides all the model filters from the filter bar that are currently active
	 * along with the search expression.
	 * @returns An array of active filters and the search expression or undefined.
	 * @public
	 */
	getFilters(): InternalBindingInfo | undefined {
		const oFilterBar = this._controller._getFilterBarControl();
		return FilterUtils.getFilters(oFilterBar as unknown as IFilterControl);
	}

	/**
	 * Provide an option for showing a custom message in the message strip above the list report table.
	 * @param message Custom message along with the message type to be set on the table.
	 * @param message.message Message string to be displayed.
	 * @param message.type Indicates the type of message.
	 * @param tabKey The tabKey identifying the table where the custom message is displayed. If tabKey is empty, the message is displayed in all tabs . If tabKey = ['1','2'], the message is displayed in tabs 1 and 2 only
	 * @param onClose A function that is called when the user closes the message bar.
	 * @public
	 */
	setCustomMessage(message: LRCustomMessage | undefined, tabKey?: string[] | string | null, onClose?: Function): void {
		if (!this.ListReportMessageStrip) {
			this.ListReportMessageStrip = new LRMessageStrip();
		}
		this.ListReportMessageStrip.showCustomMessage(message, this._controller, tabKey, onClose);
		if (message?.message) {
			InvisibleMessage.getInstance().announce(message.message, InvisibleMessageMode.Assertive);
		}
	}

	/**
	 * Destroys the message strip set on the List Report, if any.
	 * @private
	 */
	destroy(): void {
		this.ListReportMessageStrip?.destroy();
		super.destroy();
	}

	/**
	 * Provides an option for the selection of a specific tab programamatically.
	 * @param tabKey Specific tab to be selected.
	 * @public
	 */
	setSelectedTab(tabKey: string): void {
		const control = this._controller._getIconTabBar();
		control?.fireSelect({ selectedKey: "fe::table::" + tabKey + "::LineItem" });
	}
}

export default ListReportExtensionAPI;

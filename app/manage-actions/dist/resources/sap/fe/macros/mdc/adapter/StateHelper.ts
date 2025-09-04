import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import * as PropertyHelper from "sap/fe/core/templating/PropertyHelper";
import DraftEditState from "sap/fe/macros/filterBar/DraftEditState";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type { ConversionInfo } from "sap/fe/macros/mdc/adapter/SelectionVariantToStateFilters";
import svToStateFilters from "sap/fe/macros/mdc/adapter/SelectionVariantToStateFilters";
import StateFiltersToSelectionVariant from "sap/fe/macros/mdc/adapter/StateFilterToSelectionVariant";
import type { ExternalStateType } from "sap/fe/macros/valuehelp/ValueHelpDelegate";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type CoreControl from "sap/ui/core/Control";
import type Chart from "sap/ui/mdc/Chart";
import type Control from "sap/ui/mdc/Control";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { StateToApply, Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ChartType from "../../Chart";
import type MacroAPI from "../../MacroAPI";

/**
 * This is to extend MDC control APIs for filter, table, chart building blocks.
 * @public
 */

const StateHelper = {
	/**
	 * Gets selection variant from the mdc control.
	 * @param control The control for which Selection Variant is to be fetched
	 * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(control: CoreControl | undefined): Promise<SelectionVariant> {
		try {
			const controlState = await StateUtil.retrieveExternalState(control as Control);
			const controlObject = controlState.filter as StateUtilFilter;
			let parameters: string[] | undefined = [];
			if (
				control?.getParent()?.isA("sap.fe.macros.filterBar.FilterBarAPI") &&
				(control.getParent() as FilterBarAPI).getParameters !== undefined
			) {
				parameters = (control.getParent() as FilterBarAPI).getParameters();
			}
			const selectionVariant = StateFiltersToSelectionVariant.getSelectionVariantFromConditions(
				controlObject,
				(control as Control).getPropertyHelper(),
				parameters
			);
			if (control?.isA("sap.ui.mdc.Chart")) {
				const externalSV = new SelectionVariant();
				const selectOptions = selectionVariant._getSelectOptions();
				for (const property in selectOptions) {
					externalSV.massAddSelectOption(property.split("_fe_groupable_")[1], selectOptions[property]);
				}
				return externalSV;
			} else {
				return selectionVariant;
			}
		} catch (error: unknown) {
			const id: string | undefined = control?.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Building Block (${id}) - get selection variant failed : ${message}`);
			throw Error(message);
		}
	},

	/**
	 * Convert selection variant to conditions.
	 * @param control Control can be a table, chart or filter bar
	 * @param selectionVariant The selection variant to apply to the table or chart or filter bar.
	 * @param prefillDescriptions If true, we try to find the associated Text value for each property in the selectionVariant (to avoid fetching it from the server)
	 * @param model The control model
	 * @returns A promise resolving to conditions
	 */
	async convertSelectionVariantToStateFilters(
		control: Control,
		selectionVariant: SelectionVariant,
		prefillDescriptions: boolean,
		model?: Model
	): Promise<StateUtilFilter> {
		// Note: This method is private and restricted to usage by sap.fe(ViewState controller extension) for filter bar/ chart / table state scenarios.
		const propertyInfos = await this._getSupportedFilterFields(control);

		if (!propertyInfos.length) {
			throw new Error("No valid metadata properties present for filter bar");
		}

		const filterBarInfoForConversion = this._getControlInfoForConversion(control);
		const metaModel = model?.getMetaModel() as ODataMetaModel;
		const copyofPropertyInfos = JSON.parse(JSON.stringify(propertyInfos));
		const updatedPropertyInfos = this._updatePropertyInfoToSupportSV(control, copyofPropertyInfos);
		const conditions: StateUtilFilter = svToStateFilters.getStateFiltersFromSV(
			selectionVariant,
			filterBarInfoForConversion,
			updatedPropertyInfos ?? copyofPropertyInfos,
			prefillDescriptions,
			metaModel
		);

		return conditions;
	},

	/**
	 * Get the filter information needed for the conversion of selection variant to conditions.
	 * @param control This can be a table, chart, or filterbar
	 * @returns The control information (metaModel, contextPath, use of semantic date range, all filter fields config)
	 */
	_getControlInfoForConversion(control: Control): ConversionInfo {
		const metaModel = control.getModel()?.getMetaModel() as ODataMetaModel,
			contextPath = control.data("entityType") as string;
		if (control.isA("sap.fe.macros.controls.FilterBar")) {
			const useSemanticDateRange: boolean =
					control.data("useSemanticDateRange") === "true" || control.data("useSemanticDateRange") === true,
				viewDataInstance = control.getModel("viewData") as JSONModel,
				viewData = viewDataInstance.getData() as ViewData,
				config = viewData?.controlConfiguration,
				selectionFieldsConfigs = config?.["@com.sap.vocabularies.UI.v1.SelectionFields"],
				filterFieldsConfig = selectionFieldsConfigs?.filterFields;
			return { metaModel, contextPath, useSemanticDateRange, filterFieldsConfig, selectionFieldsConfigs };
		} else {
			return { metaModel, contextPath };
		}
	},

	/**
	 * Get supported filter field properties from the table, chart, or filter bar.
	 * @param control Control can be a table, chart, or filter bar
	 * @returns Supported filter fields.
	 */
	async _getSupportedFilterFields(control: Control): Promise<ControlPropertyInfo[]> {
		if (control.isA("sap.ui.mdc.Filterbar")) {
			await (control as FilterBar).waitForInitialization();
			return (control as FilterBar).getControlDelegate().fetchFilterProperties(control);
		} else if ((control as FilterBar).isA("sap.fe.macros.controls.FilterBar")) {
			return (control as FilterBar).getControlDelegate().fetchFilterProperties(control);
		} else {
			await (control as Table | Chart).awaitControlDelegate();
		}
		return (control as Table | Chart | FilterBar).getControlDelegate().fetchProperties(control);
	},

	/**
	 * Clears all input values of visible filter fields in the table, chart, or filter bar..
	 * @param controlInstance This can be a filter bar, chart, or table.
	 */
	async clearFilterValues(controlInstance: MacroAPI): Promise<void> {
		await this._clearFilterValuesWithOptions(controlInstance.content as Control);
		// Allow app developers to update filters after clearing
		controlInstance.fireEvent("afterClear");
	},

	/**
	 * Clears all input values of visible filter fields in the table, chart, or filter bar.
	 * @param control This can be a table, chart, or filter bar
	 * @param options Options for filtering the filter bar
	 * @param options.clearEditFilter Whether to clear the edit filter or retain the default value 'All'
	 */
	async _clearFilterValuesWithOptions(control: Control, options?: { clearEditFilter: boolean }): Promise<void> {
		if (!control) {
			return;
		}
		const state: ExternalStateType = await StateUtil.retrieveExternalState(control);
		let editStatePath = "",
			currentEditStateCondition,
			editStateDefaultValue,
			currentEditStateIsDefault: boolean | undefined,
			shouldClearEditFilter: undefined | boolean;
		if (control.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
			editStatePath = "$editState";
			editStateDefaultValue = DraftEditState.ALL.id;
			currentEditStateCondition = deepClone(state.filter[editStatePath]?.[0]);
			currentEditStateIsDefault = currentEditStateCondition?.values[0] === editStateDefaultValue;
			shouldClearEditFilter = options && Object.keys(options).length > 0 && options.clearEditFilter;
		}

		// Clear all conditions
		for (const conditionPath of Object.keys(state.filter)) {
			if (!shouldClearEditFilter && conditionPath === editStatePath && currentEditStateIsDefault) {
				// Do not clear edit state condition if it is already "ALL"
				continue;
			}
			for (const condition of state.filter[conditionPath]) {
				condition.filtered = false;
			}
		}
		await StateUtil.applyExternalState(control, { filter: state.filter });

		if (control.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
			// Set edit state to 'ALL' if it wasn't before
			if (!shouldClearEditFilter && currentEditStateCondition && !currentEditStateIsDefault) {
				currentEditStateCondition.values = [editStateDefaultValue];
				await StateUtil.applyExternalState(control, { filter: { [editStatePath]: [currentEditStateCondition] } });
			}

			//clear filter fields in error state
			control.cleanUpAllFilterFieldsInErrorState();
		}
	},

	/**
	 * Method returns the copy of propertyInfo by adding necessary fields so that selection variant can be set to a control like table and chart.
	 * @param control This could be a table, chart, or filter bar
	 * @param propertyInfos Array of PropertyInfo of the control
	 * @returns The deep clone of propertyInfos with some additional fields
	 */
	_updatePropertyInfoToSupportSV(control: Control, propertyInfos: ControlPropertyInfo[]): ControlPropertyInfo[] {
		if (control.isA("sap.ui.mdc.FilterBar")) {
			return propertyInfos;
		}
		propertyInfos.forEach((propertyInfo: ControlPropertyInfo) => {
			if ((control as Control).isA("sap.ui.mdc.Table")) {
				propertyInfo["conditionPath"] = propertyInfo.name;
				propertyInfo["annotationPath"] = propertyInfo.metadataPath ? propertyInfo.metadataPath : "";
				propertyInfo["hasValueHelp"] = PropertyHelper.hasValueHelp(
					(control as Table).getPropertyHelper().getProperty(propertyInfo.name)
				);
				propertyInfo["dataType"] = propertyInfo?.typeConfig?.className as string;
			} else if ((control as Control).isA("sap.ui.mdc.Chart")) {
				if (propertyInfo.path) {
					propertyInfo["name"] = propertyInfo.path;
					propertyInfo["conditionPath"] = propertyInfo.path;
					const property = ((control as Chart).getParent() as ChartType)?.getPropertyDataModel(propertyInfo.path)?.targetObject;
					propertyInfo["hasValueHelp"] = property ? PropertyHelper.hasValueHelp(property) : false;
					propertyInfo["dataType"] = (propertyInfo?.typeConfig?.className as string) || propertyInfo.dataType;
				}
			}
		});
		return propertyInfos;
	},

	/**
	 * Sets selection variant to the table. Note: setSelectionVariant will clear the existing filters and then apply the SelectionVariant values.
	 * @param controlInstance This could be a table, chart, or filter bar
	 * @param selectionVariant The selection variant to apply to the respective mdc controls
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the selectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariantToMdcControl(
		controlInstance: CoreControl | undefined,
		selectionVariant: SelectionVariant,
		prefillDescriptions = false
	): Promise<unknown> {
		try {
			const state: ExternalStateType = await StateUtil.retrieveExternalState(controlInstance as Control);
			if (!state.filter) {
				Log.error(`FE : setSelectionVariant API cannot be applied on : ${controlInstance?.getId()}`);
				return;
			}
			const conditions: StateUtilFilter = await this.convertSelectionVariantToStateFilters(
				controlInstance as Control,
				selectionVariant,
				prefillDescriptions,
				controlInstance?.getModel()
			);

			// Clear filter of table before applying selection variant
			await this.clearFilterValues(controlInstance?.getParent() as MacroAPI);

			// State to apply
			const propertyInfos = await this._getSupportedFilterFields(controlInstance as Control);
			const stateToApply = svToStateFilters.getStateToApply(propertyInfos, conditions);
			if (controlInstance?.isA("sap.ui.mdc.Chart")) {
				this.convertConditionsForChart(stateToApply);
			}
			return await StateUtil.applyExternalState(controlInstance as Control, stateToApply);
		} catch (err: unknown) {
			const id: string | undefined = controlInstance?.getId();
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : BuildingBlock (${id}) - set selection variant failed  : ${message}`);
			throw Error(message);
		}
	},

	/**
	 * Convert the chart properties to internal properties before applying the conditions.
	 * @param stateToApply This contains the information regarding filter and conditions
	 */
	convertConditionsForChart(stateToApply: StateToApply): void {
		// replace keys of filter object from "SalesOder" to internal format "_fe_groupable_SalesOrder"
		for (const property in stateToApply.filter) {
			delete Object.assign(stateToApply.filter, { ["_fe_groupable_" + property]: stateToApply.filter[property] })[property];
		}
		// replace keys of items array from "SalesOder" to internal format "_fe_groupable_SalesOrder"
		stateToApply.items.forEach((propertyObj: { name: string }) => {
			propertyObj.name = "_fe_groupable_" + propertyObj.name;
		});
	}
};

export type ControlPropertyInfo = PropertyInfo & {
	conditionPath: string;
	dataType: string;
	annotationPath?: string;
	metadataPath?: string;
	isParameter?: boolean;
	hiddenFilter?: boolean;
	hasValueHelp?: boolean;
	required?: boolean;
};

export default StateHelper;

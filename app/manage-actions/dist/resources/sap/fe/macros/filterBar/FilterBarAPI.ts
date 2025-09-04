import type { EntitySet, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, event, mixin, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { ControlState, LegacyFilterBarState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import { InitialLoadMode } from "sap/fe/core/library";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import MacroAPI from "sap/fe/macros/MacroAPI";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type FilterField from "sap/fe/macros/filterBar/FilterField";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import type { ControlPropertyInfo } from "sap/fe/macros/mdc/adapter/StateHelper";
import stateHelper from "sap/fe/macros/mdc/adapter/StateHelper";
import type { InternalBindingInfo } from "sap/fe/macros/table/Utils";
import type { ExternalStateType } from "sap/fe/macros/valuehelp/ValueHelpDelegate";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import { NavType } from "sap/fe/navigation/library";
import type { default as ListReportController } from "sap/fe/templates/ListReport/ListReportController.controller";
import type Input from "sap/m/Input";
import type { Input$ValueHelpRequestEventParameters } from "sap/m/Input";
import type { default as Event, default as UI5Event } from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import ControlVariantApplyAPI from "sap/ui/fl/apply/api/ControlVariantApplyAPI";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type VariantModel from "sap/ui/fl/variants/VariantModel";
import type { VariantData } from "sap/ui/fl/variants/VariantModel";
import type Control from "sap/ui/mdc/Control";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type { ValueHelp$SelectEvent } from "sap/ui/mdc/ValueHelp";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type { FilterBarBase$SearchEvent } from "sap/ui/mdc/filterbar/FilterBarBase";
import type { Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { default as MetaModel, default as ODataMetaModel } from "sap/ui/model/odata/v4/ODataMetaModel";
import FilterBarAPIStateHandler from "./mixin/FilterBarAPIStateHandler";
import jQuery from "sap/ui/thirdparty/jquery";

// Track telemetry content for the filterBar
class FilterBarTelemetry {
	private countFilterActions = 0;

	private countVariantFilters = 0;

	constructor(private readonly filterBarAPI: FilterBarAPI) {}

	onFiltersChanged(reason?: string): void {
		if (reason === "Variant") {
			this.countVariantFilters++;
		} else {
			this.countFilterActions++;
		}
	}

	onSearch(eventParameters: { reason?: string }, conditions: Record<string, ConditionObject[]>): void {
		const filterNames = this.getFilterNamesFromConditions(conditions);
		this.filterBarAPI.getPageController()?.telemetry.storeAction({
			type: "FE.FilterBarSearch",
			parameters: {
				countFilterActions: this.countFilterActions, //  How many filterChanged actions are performed
				countFilters: Object.keys(conditions).length, // How many different filters are applied
				countVariantFilters: this.countVariantFilters, // How many filter belong to a variant
				variantLayer: this.filterBarAPI.getVariant()?.layer ?? "None", // | "SAP" | "Custom"; // Type of variant
				autoLoad: eventParameters.reason === "Variant", // Is the filter automatically executed
				searchUsed: conditions.$search ? !!Object.keys(conditions.$search).length : false, // Was the search field in the filterbar used?
				filterNames: filterNames // Property names of the filters
			}
		});
		// Reset the count
		this.countFilterActions = 0;
		this.countVariantFilters = 0;
	}

	getFilterNamesFromConditions(conditions: Record<string, ConditionObject[]>): string {
		let filterNames = "";
		Object.keys(conditions).forEach((condition) => {
			if (condition != "$search") {
				filterNames += condition + ";";
			}
		});
		return filterNames;
	}
}

export type FilterBarState = {
	innerState?: {
		filter?: Record<string, ConditionObject[]>;
		initialState?: LegacyFilterBarState;
		fullState?: LegacyFilterBarState;
	};
};

type VariantIDs = {
	sPageVariantId: string;
	sFilterBarVariantId: string;
	sTableVariantId: string;
	sChartVariantId: string;
};

type VariantObject = {
	author: string;
	change: boolean;
	contexts: object;
	executeOnSelect: boolean;
	favorite: boolean;
	key: string;
	originalContexts: object;
	originalExecuteOnSelect: boolean;
	originalFavorite: boolean;
	originalTitle: string;
	originalVisible: boolean;
	remove: boolean;
	rename: boolean;
	sharing: string;
	title: string;
	visible: boolean;
};

enum VariantManagementType {
	Control = "Control",
	Page = "Page",
	None = "None"
}

const DISPLAY_CURRENCY_PROPERTY_NAME = "DisplayCurrency";
const P_DISPLAY_CURRENCY_PROPERTY_NAME = "P_DisplayCurrency";

type LRViewData = {
	controlConfiguration?: Record<string, Record<string, unknown>>;
	entitySet?: string;
	contextPath?: string;
	variantManagement?: boolean | string;
};

interface FilterBarAPI extends FilterBarAPIStateHandler {}

/**
 * Building block for creating a FilterBar based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarDefault Overview of Building Blocks}
 * <br>
 * Usually, a SelectionFields annotation is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:FilterBar id="MyFilterBar" metaPath="@com.sap.vocabularies.UI.v1.SelectionFields" /&gt;
 * </pre>
 * @alias sap.fe.macros.FilterBar
 * @public
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterBarAPI", {
	returnTypes: ["sap.ui.core.Control"]
})
@mixin(FilterBarAPIStateHandler)
class FilterBarAPI extends MacroAPI {
	initialControlState: Record<string, unknown> = {};

	_initialStatePromise: PromiseKeeper<void> = new PromiseKeeper();

	_bSearchTriggered = false;

	async waitForInitialState(): Promise<void> {
		return this._initialStatePromise.promise;
	}

	getControlState(controlState: ControlState): ControlState {
		const initialControlState: Record<string, unknown> = this.initialControlState;
		if (controlState) {
			return {
				fullState: controlState as object,
				initialState: initialControlState as object
			};
		}
		return controlState;
	}

	/**
	 * Determines whether Search can be triggered at initial load of the application or not.
	 * @param navigationType Navigation Type during the load of the application
	 * @returns A Boolean determining whether Search can be triggered or not
	 */
	isSearchTriggeredByInitialLoad(navigationType: string): boolean {
		const controller = this.getPageController() as ListReportController,
			view = controller.getView(),
			viewData = view.getViewData();
		let isSearchTriggeredByInitialLoad = false,
			variantManagement;
		// Determining whether it's Control variantManagement or Page variantManagement
		if (viewData.variantManagement === VariantManagementType.Control) {
			variantManagement = controller._getFilterBarVariantControl();
		} else {
			variantManagement = view.byId("fe::PageVariantManagement") as VariantManagement;
		}
		const currentVariantKey = variantManagement?.getCurrentVariantKey();
		//The check shall happen for 'intial load' and 'Apply Automatically' for collapsing the header or
		// always be collapsed if navType is xAppState
		// initialLoad Auto or Disabled
		if (navigationType === NavType.xAppState) {
			return true;
		} else if (variantManagement && viewData.initialLoad !== InitialLoadMode.Enabled) {
			// Header is collapsed if preset filters are set for initial load Auto, Header shall remain expanded if initial load is Auto without preset filters or intial load is disabled
			if (controller._shouldAutoTriggerSearch(this._getFilterBarVM(view))) {
				isSearchTriggeredByInitialLoad = true;
			}
		}
		// initialLoad Enabled
		else if (
			variantManagement &&
			viewData.initialLoad === InitialLoadMode.Enabled &&
			controller._getApplyAutomaticallyOnVariant(variantManagement, currentVariantKey)
		) {
			isSearchTriggeredByInitialLoad = true;
		}
		return isSearchTriggeredByInitialLoad;
	}

	/**
	 * Apply Selection Variant from Navigation Parameter.
	 * @param view View of the LR filter bar
	 * @param navigationParameter Selection Variant to apply from appState
	 * @param filterVariantApplied Is a filter variant alaready applied
	 * @returns Promise for asynchronous handling
	 */
	async _applySelectionVariant(view: View, navigationParameter: NavigationParameter, filterVariantApplied: boolean): Promise<unknown> {
		const filterBar = this.getContent() as FilterBar;
		const { selectionVariant: sv, selectionVariantDefaults: svDefaults, requiresStandardVariant = false } = navigationParameter;

		if (!filterBar || !sv) {
			return Promise.resolve();
		}
		const variantManagement = this._getFilterBarVM(view) as VariantManagement;
		const shouldApplyAppState = await this._activateVariantAndDetermineApplyAppState(
			variantManagement,
			requiresStandardVariant,
			filterVariantApplied
		);
		if (shouldApplyAppState) {
			this._addDefaultDisplayCurrencyToSV(view, sv, svDefaults);

			// check if FLP default values are there and is it standard variant
			const svDefaultsArePresent = svDefaults ? svDefaults.getSelectOptionsPropertyNames().length > 0 : false;
			const stdVariantIsDefaultVariant =
				variantManagement && variantManagement.getDefaultVariantKey() === variantManagement.getStandardVariantKey();
			const useFLPDefaultValues: boolean = svDefaultsArePresent && (stdVariantIsDefaultVariant || !variantManagement);

			const filterBarAPI = filterBar.getParent() as FilterBarAPI;
			let svToSet: SelectionVariant = sv;
			if (filterVariantApplied || useFLPDefaultValues) {
				svToSet = await this._getAdjustedSV(sv, useFLPDefaultValues);
			}
			return filterBarAPI.setSelectionVariant(svToSet, true);
		}
	}

	_enableFilterBar(filterBarControl: FilterBar, preventInitialSearch: boolean): void {
		const filterBarAPI = filterBarControl.getParent() as FilterBarAPI;
		const fnOnSearch = (): void => {
			this._bSearchTriggered = !preventInitialSearch;
		};

		// reset the suspend selection on filter bar to allow loading of data when needed (was set on LR Init)
		if (filterBarControl.getSuspendSelection()) {
			// Only if search is fired we set _bSearchTriggered.
			// If there was an error due to required filterfields empty or other issues we skip setting _bSearchTriggered.
			filterBarAPI.attachEventOnce("search", fnOnSearch);
			filterBarControl.setSuspendSelection(false);
		} else {
			// search might already be triggered.
			fnOnSearch();
		}
	}

	async _getAdjustedSV(appStateSV: SelectionVariant, useFLPDefaultValues: boolean): Promise<SelectionVariant> {
		let adjustedSV = new SelectionVariant(appStateSV.toJSONObject());
		const alreadyAppliedSV = await this.getSelectionVariant();
		const appliedSelOptNames = alreadyAppliedSV?.getSelectOptionsPropertyNames() || [];
		if (appliedSelOptNames.length > 0) {
			// We merge 'applied SV' and 'appState SV' based on 'useFLPDefaultValues'.
			adjustedSV = appliedSelOptNames.reduce((svCopy: SelectionVariant, selOptionName) => {
				// (appStateSV = adjustedSV = svCopy)
				const svSelOpts = svCopy.getSelectOption(selOptionName);
				// If useFLPDefaultValues = true, means (appStateSV = svDefaults)
				if ((useFLPDefaultValues && !svSelOpts?.length) || !useFLPDefaultValues) {
					// if default SV needs to be used, then select options from default select options take priority.
					// else we merge both: already applied SV and SV from navParams.
					const selectOptions = alreadyAppliedSV.getSelectOption(selOptionName);
					svCopy.massAddSelectOption(selOptionName, selectOptions || []);
				}
				return svCopy;
			}, adjustedSV);
		}

		return adjustedSV;
	}

	_preventInitialSearch(variantManagement: VariantManagement): boolean {
		if (!variantManagement) {
			return true;
		}
		const aVariants = variantManagement.getVariants();
		const oCurrentVariant = aVariants.find(function (item): boolean {
			return item.getKey() === variantManagement.getCurrentVariantKey();
		});
		return !oCurrentVariant.executeOnSelect;
	}

	/**
	 * Add DisplayCurrency to SV if it is mandatory and exists in SV defaults.
	 * @param view View of the LR filter bar
	 * @param sv Selection Variant to apply
	 * @param svDefaults Selection Variant defaults
	 */
	_addDefaultDisplayCurrencyToSV(view: View, sv: SelectionVariant, svDefaults?: SelectionVariant): void {
		if (!svDefaults || svDefaults?.isEmpty()) {
			return;
		}

		const viewData = view.getViewData() as LRViewData,
			metaModel = view.getModel()?.getMetaModel() as ODataMetaModel,
			contextPath = viewData.contextPath || `/${viewData.entitySet}`,
			metaContext = metaModel.getMetaContext(contextPath),
			dataModelObjectPath: DataModelObjectPath<MetaModel> = getInvolvedDataModelObjects(metaContext);

		// getDisplayCurrencyPropertyName already applies the isParameterized logic
		const displayCurrencyPropertyName = this.getDisplayCurrencyPropertyName(dataModelObjectPath);
		const displayCurrencyIsMandatory = this._checkIfDisplayCurrencyIsRequired(dataModelObjectPath);
		if (!displayCurrencyIsMandatory) {
			return;
		}

		const svOptions = sv.getSelectOption(displayCurrencyPropertyName) || [],
			defaultSVOptions = svDefaults.getSelectOption(displayCurrencyPropertyName) || [],
			displayCurrencyDefaultExists = defaultSVOptions.length > 0,
			noSVDisplayCurrencyExists = svOptions.length === 0;

		if (noSVDisplayCurrencyExists && displayCurrencyDefaultExists) {
			const displayCurrencySelectOption = defaultSVOptions[0],
				sign = displayCurrencySelectOption["Sign"],
				option = displayCurrencySelectOption["Option"],
				low = displayCurrencySelectOption["Low"],
				high = displayCurrencySelectOption["High"];

			sv.addSelectOption(displayCurrencyPropertyName, sign, option, low, high);
		}
	}

	/**
	 * Checks if the data model object path is parameterized.
	 * Looks for a ResultContext annotation in the starting entity's type
	 * and ensures there's no target entity set.
	 * @param dataModelObjectPath The path to check.
	 * @returns True if it's parameterized, false otherwise.
	 */
	private isParameterized(dataModelObjectPath: DataModelObjectPath<MetaModel>): boolean {
		return !!dataModelObjectPath.startingEntitySet.entityType?.annotations?.Common?.ResultContext;
	}

	/**
	 * Gets the display currency property name based on the entity type's parameterization.
	 * Uses the isParameterized method to decide which property name to return.
	 * @param dataModelObjectPath The path to check.
	 * @returns The appropriate display currency property name.
	 */
	getDisplayCurrencyPropertyName(dataModelObjectPath: DataModelObjectPath<MetaModel>): string {
		return this.isParameterized(dataModelObjectPath) ? P_DISPLAY_CURRENCY_PROPERTY_NAME : DISPLAY_CURRENCY_PROPERTY_NAME;
	}

	/**
	 * Checks if DisplayCurrency is mandatory for filtering.
	 * @param dataModelObjectPath
	 * @returns Boolean
	 */
	_checkIfDisplayCurrencyIsRequired(dataModelObjectPath: DataModelObjectPath<MetaModel>): boolean {
		let displayCurrencyIsMandatory = false;

		if (this.isParameterized(dataModelObjectPath)) {
			displayCurrencyIsMandatory = dataModelObjectPath.startingEntitySet.entityType.entityProperties.some(
				(parameter: Property): boolean => parameter.name === P_DISPLAY_CURRENCY_PROPERTY_NAME
			);
		} else {
			const entitySet: EntitySet | undefined =
					dataModelObjectPath.startingEntitySet._type === "EntitySet" ? dataModelObjectPath.startingEntitySet : undefined,
				requiredProperties = entitySet?.annotations.Capabilities?.FilterRestrictions?.RequiredProperties ?? [];
			displayCurrencyIsMandatory = requiredProperties.some(
				(requiredProperty: PropertyPath) => requiredProperty.value === DISPLAY_CURRENCY_PROPERTY_NAME
			);
		}
		return displayCurrencyIsMandatory;
	}

	/**
	 * Activate variant from variant management and return if appState needs to be applied.
	 * @param variantManagement VariantManagement used by filter bar
	 * @param reqStdVariant If standard variant is required to be used
	 * @param filterVariantApplied Is a filter variant already applied
	 * @returns Promise for asynchronous handling
	 */
	async _activateVariantAndDetermineApplyAppState(
		variantManagement: VariantManagement | undefined,
		reqStdVariant: boolean,
		filterVariantApplied: boolean
	): Promise<boolean> {
		if (variantManagement && !filterVariantApplied) {
			let variantKey = reqStdVariant ? variantManagement.getStandardVariantKey() : variantManagement.getDefaultVariantKey();
			if (variantKey === null) {
				variantKey = variantManagement.getId();
			}
			await ControlVariantApplyAPI.activateVariant({
				element: variantManagement,
				variantReference: variantKey
			});
			return reqStdVariant || variantManagement.getDefaultVariantKey() === variantManagement.getStandardVariantKey();
		}

		return true;
	}

	/**
	 * Variant management used by filter bar.
	 * @param view View of the LR filter bar
	 * @returns VariantManagement if used
	 */
	_getFilterBarVM(view: View): VariantManagement | undefined {
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
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async handleVariantIdPassedViaURLParams(oUrlParams: Record<string, string>): Promise<unknown> {
		const aPageVariantId = oUrlParams["sap-ui-fe-variant-id"],
			aFilterBarVariantId = oUrlParams["sap-ui-fe-filterbar-variant-id"],
			aTableVariantId = oUrlParams["sap-ui-fe-table-variant-id"],
			aChartVariantId = oUrlParams["sap-ui-fe-chart-variant-id"];
		let oVariantIDs: VariantIDs | undefined;
		if (aPageVariantId || aFilterBarVariantId || aTableVariantId || aChartVariantId) {
			oVariantIDs = {
				sPageVariantId: aPageVariantId && aPageVariantId[0],
				sFilterBarVariantId: aFilterBarVariantId && aFilterBarVariantId[0],
				sTableVariantId: aTableVariantId && aTableVariantId[0],
				sChartVariantId: aChartVariantId && aChartVariantId[0]
			};
		}
		return this._handleControlVariantId(oVariantIDs);
	}

	async _handleControlVariantId(oVariantIDs: VariantIDs | undefined): Promise<unknown> {
		let oVM: VariantManagement;
		const oView = this.getPageController()?.getView(),
			aPromises: Promise<boolean>[] = [];
		const sVariantManagement = oView.getViewData().variantManagement;
		if (oVariantIDs && oVariantIDs.sPageVariantId && sVariantManagement === "Page") {
			oVM = oView.byId("fe::PageVariantManagement") as VariantManagement;
			this._handlePageVariantId(oVariantIDs, oVM, aPromises);
		} else if (oVariantIDs && sVariantManagement === "Control") {
			if (oVariantIDs.sFilterBarVariantId) {
				oVM = (oView.getController() as ListReportController)._getFilterBarVariantControl()!;
				this._handleFilterBarVariantControlId(oVariantIDs, oVM, aPromises);
			}
		}
		return Promise.all(aPromises);
	}

	/*
	 * Handles page level variant and passes the variant to the function that pushes the promise to the promise array
	 *
	 * @param oVarinatIDs contains an object of all variant IDs
	 * @param oVM contains the vairant management object for the page variant
	 * @param aPromises is an array of all promises
	 * @private
	 */
	_handlePageVariantId(oVariantIDs: VariantIDs, oVM: VariantManagement, aPromises: Promise<boolean>[]): void {
		oVM.getVariants()?.forEach((oVariant: VariantObject) => {
			this._findAndPushVariantToPromise(oVariant, oVariantIDs.sPageVariantId, oVM, aPromises, true);
		});
	}

	/*
	 * Handles control level variant for filter bar and passes the variant to the function that pushes the promise to the promise array
	 *
	 * @param oVarinatIDs contains an object of all variant IDs
	 * @param oVM contains the vairant management object for the filter bar
	 * @param aPromises is an array of all promises
	 * @private
	 */

	_handleFilterBarVariantControlId(oVariantIDs: VariantIDs, oVM: VariantManagement, aPromises: Promise<boolean>[]): void {
		if (oVM) {
			oVM.getVariants().forEach((oVariant: VariantObject) => {
				this._findAndPushVariantToPromise(oVariant, oVariantIDs.sFilterBarVariantId, oVM, aPromises, true);
			});
		}
	}

	/*
	 * Matches the variant ID provided in the url to the available vairant IDs and pushes the appropriate promise to the promise array
	 *
	 * @param oVariant is an object for a specific variant
	 * @param sVariantId is the variant ID provided in the url
	 * @param oVM is the variant management object for the specfic variant
	 * @param aPromises is an array of promises
	 * @param bFilterVariantApplied is an optional parameter which is set to ture in case the filter variant is applied
	 * @private
	 */
	_findAndPushVariantToPromise(
		//This function finds the suitable variant for the variantID provided in the url and pushes them to the promise array
		oVariant: VariantObject,
		sVariantId: string,
		oVM: VariantManagement,
		aPromises: Promise<boolean>[],
		bFilterVariantApplied?: boolean
	): void {
		if (oVariant.key === sVariantId) {
			aPromises.push(this._applyControlVariant(oVM, sVariantId, bFilterVariantApplied));
		}
	}

	async _applyControlVariant(oVariant: VariantManagement, sVariantID: string, bFilterVariantApplied = false): Promise<boolean> {
		const sVariantReference = this._checkIfVariantIdIsAvailable(oVariant, sVariantID) ? sVariantID : oVariant.getStandardVariantKey();
		const oVM = ControlVariantApplyAPI.activateVariant({
			element: oVariant,
			variantReference: sVariantReference
		});
		return oVM.then(function () {
			return bFilterVariantApplied;
		});
	}

	_checkIfVariantIdIsAvailable(oVM: VariantManagement, sVariantId: string | null): boolean {
		const aVariants = oVM.getVariants();
		let bIsControlStateVariantAvailable = false;
		aVariants.forEach(function (oVariant) {
			if (oVariant.getKey() === sVariantId) {
				bIsControlStateVariantAvailable = true;
			}
		});
		return bIsControlStateVariantAvailable;
	}

	/**
	 * The identifier of the FilterBar control.
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionFields"],
		expectedTypes: ["EntitySet", "EntityType"]
	})
	metaPath!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "NavigationProperty"]
	})
	contextPath!: string;

	/**
	 * If true, the search is triggered automatically when a filter value is changed.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	liveMode?: boolean;

	/**
	 * Parameter which sets the visibility of the FilterBar building block
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	visible?: boolean;

	/**
	 * Displays possible errors during the search in a message box
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	showMessages?: boolean;

	/**
	 * Handles the visibility of the 'Clear' button on the FilterBar.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	showClearButton?: boolean;

	/**
	 * Aggregate filter fields of the FilterBar building block
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.filterBar.FilterField", multiple: true })
	filterFields?: FilterField[];

	content!: FilterBar;

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change.
	 * @public
	 */
	@event()
	search!: string;

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change. This is only internally used by sap.fe (Fiori elements) and
	 * exposes parameters from internal MDC-FilterBar search event
	 * @private
	 */
	@event()
	internalSearch!: string;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that will be used as filters.
	 * @public
	 */
	@event()
	filterChanged!: string;

	/**
	 * This event is fired when the 'Clear' button is pressed. This is only possible when the 'Clear' button is enabled.
	 * @public
	 */
	@event()
	afterClear!: string;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that will be used as filters.
	 * This is used internally only by sap.fe (Fiori Elements). This exposes parameters from the MDC-FilterBar filterChanged event that is used by sap.fe in some cases.
	 * @private
	 */
	@event()
	internalFilterChanged!: string;

	private telemetry?: FilterBarTelemetry;

	constructor(props?: $ControlSettings & PropertiesOf<FilterBarAPI>, others?: $ControlSettings) {
		super(props, others);
		this.telemetry = new FilterBarTelemetry(this);
		this.attachStateChangeHandler();
	}

	private attachStateChangeHandler(): void {
		StateUtil.detachStateChange(this.stateChangeHandler);
		StateUtil.attachStateChange(this.stateChangeHandler);
	}

	stateChangeHandler(oEvent: Event<{ control: Control }>): void {
		const control = oEvent.getParameter("control");
		if (control.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
			const filterBarAPI = control.getParent() as unknown as { handleStateChange?: Function };
			if (filterBarAPI?.handleStateChange) {
				filterBarAPI.handleStateChange();
			}
		}
	}

	@xmlEventHandler()
	handleSearch(oEvent: FilterBarBase$SearchEvent): void {
		const oFilterBar = oEvent.getSource() as FilterBar | undefined;
		const eventParameters = oEvent.getParameters();
		if (oFilterBar) {
			const conditions = (oFilterBar.getFilterConditions() ?? {}) as Record<string, ConditionObject[]>;
			const preparedEventParameters = this._prepareEventParameters(oFilterBar);
			this.telemetry?.onSearch(eventParameters, conditions);
			this.fireEvent("internalSearch", merge({ conditions: conditions }, eventParameters));
			this.fireEvent("search", merge({ reason: eventParameters.reason }, preparedEventParameters));
		}
	}

	@xmlEventHandler()
	handleFilterChanged(oEvent: UI5Event): void {
		const filterBar = oEvent.getSource() as FilterBar | undefined;
		const oEventParameters = oEvent.getParameters();
		if (filterBar) {
			const oConditions = filterBar.getFilterConditions();
			const eventParameters: object = this._prepareEventParameters(filterBar);
			this.telemetry?.onFiltersChanged(this._getFilterBarReason(filterBar));
			this.fireEvent("internalFilterChanged", merge({ conditions: oConditions }, oEventParameters));
			this.fireEvent("filterChanged", eventParameters);
		}
	}

	_getFilterBarReason(filterBar: FilterBar & { _sReason?: string }): string {
		return filterBar?._sReason ?? "";
	}

	_prepareEventParameters(oFilterBar: FilterBar): Partial<InternalBindingInfo> {
		const { parameters, filters, search } = FilterUtils.getFilters(oFilterBar as unknown as IFilterControl) || {};

		return { parameters, filters, search };
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
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (arguments.length === 2) {
			vValues = sOperator;
			return FilterUtils.setFilterValues(this.content, sConditionPath, vValues);
		}
		return FilterUtils.setFilterValues(this.content, sConditionPath, sOperator, vValues);
	}

	/**
	 * Get the Active Filters Text Summary for the filter bar.
	 * @returns Active filters summary as text
	 * @public
	 */
	getActiveFiltersText(): string {
		return this.content?.getAssignedFiltersText()?.filtersText || "";
	}

	/**
	 * Provides all the filters that are currently active
	 * along with the search expression.
	 * @returns An array of active filters and the search expression.
	 * @public
	 */
	getFilters(): object {
		return FilterUtils.getFilters(this.content as IFilterControl) || {};
	}

	/**
	 * Triggers the API search on the filter bar.
	 * @returns Returns a promise which resolves if filter go is triggered successfully; otherwise gets rejected.
	 * @public
	 */
	async triggerSearch(): Promise<object | undefined> {
		const filterBar = this.content;
		try {
			if (filterBar) {
				await filterBar.waitForInitialization();
				return await filterBar.triggerSearch();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Buildingblock : FilterBar : ${message}`);
			throw Error(message);
		}
	}

	isSemanticDateFilterApplied(): boolean {
		return SemanticDateOperators.hasSemanticDateOperations(this.content.getConditions(), false);
	}

	/**
	 * Get the selection variant from the filter bar.
	 * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		const selectionVariant = await stateHelper.getSelectionVariant(this.getContent());
		const controller = this.getPageController() as ListReportController;
		if (controller !== undefined) {
			const view = controller?.getView(),
				appComponent = CommonUtils.getAppComponent(view),
				navigationService = appComponent?.getNavigationService(),
				dataModelObject = this.getDataModelObjectForMetaPath(this.metaPath);
			if (dataModelObject?.targetEntitySet?.name) {
				const sContextUrl =
					dataModelObject?.targetEntitySet?.name &&
					navigationService?.constructContextUrl(dataModelObject?.targetEntitySet?.name, view.getModel());
				selectionVariant.setFilterContextUrl(sContextUrl);
			}
		}
		return selectionVariant;
	}

	/**
	 * Get the list of mandatory filter property names.
	 * @returns The list of mandatory filter property names
	 */
	getMandatoryFilterPropertyNames(): string[] {
		return (this.content.getPropertyInfoSet() as ControlPropertyInfo[])
			.filter(function (filterProp) {
				return filterProp.required;
			})
			.map(function (requiredProp) {
				return requiredProp.conditionPath;
			});
	}

	/**
	 * Get the filter bar parameters for a parameterized service.
	 * @returns Array of parameters configured in a parameterized service
	 */

	getParameters(): string[] {
		const filterBar = this.content;
		const parameters = filterBar.data("parameters");
		if (parameters) {
			return Array.isArray(parameters) ? parameters : JSON.parse(parameters);
		}
		return [];
	}

	getVariant(): VariantData | undefined {
		let currentVariant;
		try {
			const variantModel = this.getModel("$FlexVariants") as VariantModel | undefined;
			const variantBackReference = this.content.getVariantBackreference();

			if (variantModel && variantBackReference) {
				currentVariant = variantModel.getVariant(variantModel.getCurrentVariantReference(variantBackReference));
			}
		} catch (e) {
			Log.debug("Couldn't fetch variant ", e as string);
		}
		return currentVariant;
	}

	/**
	 * Shows or hides any filter field from the filter bar.
	 * The property will not be hidden inside the adaptation dialog and may be re-added.
	 * @param conditionPath The path to the property as a condition path
	 * @param visible Whether it should be shown or hidden
	 * @returns A {@link Promise} resolving once the change in visibility was applied
	 * @public
	 */
	async setFilterFieldVisible(conditionPath: string, visible: boolean): Promise<void> {
		await StateUtil.applyExternalState(this.content, { items: [{ name: conditionPath, visible }] });
	}

	/**
	 * Gets the visibility of a filter field.
	 * @param conditionPath The path to the property as a condition path
	 * @returns A {@link Promise} that resolves to check whether the filter field is visible or not.
	 * @public
	 */
	async getFilterFieldVisible(conditionPath: string): Promise<boolean> {
		const state: ExternalStateType = await StateUtil.retrieveExternalState(this.content);
		return !!state.items.find((item) => item.name === conditionPath);
	}

	/**
	 * Gets the associated variant management.
	 * @returns The {@link sap.ui.fl.variants.VariantManagement} control associated with the filter bar.
	 */
	getVariantManagement(): VariantManagement {
		const variantBackreference = this.content.getVariantBackreference();
		if (variantBackreference) {
			return UI5Element.getElementById(variantBackreference) as VariantManagement;
		} else {
			throw new Error(`Variant back reference not defined on the filter bar ${this.id}`);
		}
	}

	/**
	 * Sets the variant back reference association for this instance.
	 * @param variant The `VariantManagement` instance to set as the back reference.
	 */
	setVariantBackReference(variant: VariantManagement): void {
		const content = this.getContent() as FilterBar;
		const isLiveMode = content?.getLiveMode?.();
		if (!isLiveMode) {
			this.content.setVariantBackreference(variant);
		}
	}

	/**
	 * Gets the key of the current variant in the associated variant management.
	 * @returns Key of the currently selected variant. In case the model is not yet set, `null` will be returned.
	 * @public
	 */
	getCurrentVariantKey(): string | null {
		return this.getVariantManagement().getCurrentVariantKey();
	}

	/**
	 * Sets the new selected variant in the associated variant management.
	 * @param key Key of the variant that should be selected. If the passed key doesn't identify a variant, it will be ignored.
	 * @public
	 */
	setCurrentVariantKey(key: string): void {
		const variantManagement = this.getVariantManagement();
		variantManagement.setCurrentVariantKey(key);
	}

	/**
	 * Sets the enablement of the field.
	 * @param name Name of the field that should be enabled or disabled.
	 * @param enabled Whether the field should be enabled or disabled.
	 * @public
	 */
	setFilterFieldEnabled(name: string, enabled: boolean): void {
		(this.getModel("internal") as JSONModel).setData(
			{
				[this.content.data("localId")]: {
					filterFields: { [name]: { editMode: enabled ? FieldEditMode.Editable : FieldEditMode.Disabled } }
				}
			},
			true
		);
	}

	/**
	 * Determines whether the field is enabled or disabled.
	 * @param name Name of the field.
	 * @returns Whether the filterField is enabled or disabled.
	 * @public
	 */
	getFilterFieldEnabled(name: string): boolean {
		return (this.getModel("internal") as JSONModel).getProperty(`/${this.content.data("localId")}/filterFields/${name}/editMode`) ===
			FieldEditMode.Disabled
			? false
			: true;
	}

	/**
	 * Convert {@link sap.fe.navigation.SelectionVariant} to conditions.
	 * @param selectionVariant The selection variant to apply to the filter bar.
	 * @param prefillDescriptions If true, we try to find the associated Text value for each property in the selectionVariant (to avoid fetching it from the server)
	 * @returns A promise resolving to conditions
	 */
	async convertSelectionVariantToStateFilters(
		selectionVariant: SelectionVariant,
		prefillDescriptions: boolean
	): Promise<StateUtilFilter> {
		return stateHelper.convertSelectionVariantToStateFilters(
			this.content,
			selectionVariant,
			prefillDescriptions,
			this.content?.getModel()
		);
	}

	/**
	 * Clears all input values of visible filter fields in the filter bar with flag to indicate whether to clear Edit Filter or not.
	 * @param filterBar The filter bar that contains the filter field
	 * @param options Options for filtering on the filter bar
	 * @param options.clearEditFilter Whether to clear the edit filter or let it be default value 'All' instead
	 */
	async _clearFilterValuesWithOptions(filterBar: FilterBar, options?: { clearEditFilter: boolean }): Promise<void> {
		await stateHelper._clearFilterValuesWithOptions(filterBar, options);
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the filter bar. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the filter bar
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the selectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(selectionVariant: SelectionVariant, prefillDescriptions = false): Promise<unknown> {
		const content = this.getContent() as FilterBar | undefined;
		const isLiveMode = content && content?.getLiveMode?.();
		if (isLiveMode) {
			content.setSuspendSelection(true);
		}
		let ret: unknown;
		try {
			ret = await stateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
			return ret;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Buildingblock : FilterBar : ${message}`);
			throw Error(message);
		} finally {
			if (isLiveMode) {
				content.setSuspendSelection(false);
			}
		}
	}

	/**
	 * Called by the MDC state util when the state for this control's child has changed.
	 */
	handleStateChange(): void {
		this.getPageController()?.getExtensionAPI().updateAppState();
	}

	async showFilterField(name: string): Promise<void> {
		const state: ExternalStateType = await StateUtil.retrieveExternalState(this.content);
		const targetFilterField = !!state.items.find((item) => item.name === name);
		if (!targetFilterField) {
			state.items.push({ name });
		}
		await StateUtil.applyExternalState(this.content, state);
	}

	openValueHelpForFilterField(name: string, inputValue?: string, fnCallback?: Function): void {
		const filterField = this.content.getFilterItems().find((item) => item.getPropertyKey() === name);
		if (filterField) {
			const valueHelp = UI5Element.getElementById(filterField.getValueHelp()) as ValueHelp;
			if (valueHelp) {
				let selectedItems: ConditionObject[] = [];
				const handleItemSelected = (oEvent: ValueHelp$SelectEvent): void => {
					selectedItems = oEvent.getParameter("conditions") as ConditionObject[];
				};
				valueHelp.attachClosed(() => {
					valueHelp.detachSelect(handleItemSelected, this);
					fnCallback?.(selectedItems);
				});
				valueHelp.attachSelect(handleItemSelected, this);
			}
			(filterField as unknown as { _oFocusInfo: object })._oFocusInfo = { targetInfo: { silent: true } };
			(filterField as unknown as { onfocusin?: Function }).onfocusin?.(new jQuery.Event("focusin"));
			setTimeout(() => {
				(filterField.getAggregation("_content") as Input[])[0].fireValueHelpRequest({
					fromKeyboard: true,
					_userInputValue: inputValue
				} as unknown as Input$ValueHelpRequestEventParameters);
			}, 200);
		}
	}

	getCollapsedFiltersText(): string {
		return this.content?.getAssignedFiltersText()?.filtersText;
	}
}
export default FilterBarAPI;

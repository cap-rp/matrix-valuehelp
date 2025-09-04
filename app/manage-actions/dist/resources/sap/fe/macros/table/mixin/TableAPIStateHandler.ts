import Log from "sap/base/Log";
import type { NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributorMixin from "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type { ControlState } from "sap/fe/macros/insights/CommonInsightsHelper";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type { TableState } from "sap/fe/macros/table/TableAPI";
import type ManagedObject from "sap/ui/base/ManagedObject";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";

export default class TableAPIStateHandler extends IViewStateContributorMixin<TableState> {
	/**
	 * Asynchronously retrieves the state of the table based on the provided viewstate.
	 * @returns A promise that resolves to the table state or null if not found.
	 */
	async retrieveState(this: TableAPI): Promise<TableState | null> {
		const tableState: TableState = {};
		tableState.innerTable = this.getControlState(await StateUtil.retrieveExternalState(this.content)) as object;
		const quickFilter = this.getQuickFilter();
		if (quickFilter) {
			const quickFilterState = quickFilter.getSelectedKey();
			if (!tableState.quickFilter) {
				tableState.quickFilter = {};
			}
			tableState.quickFilter.selectedKey = quickFilterState;
		}
		const variantToRetrieve = this.content.getVariant()?.getId();
		if (variantToRetrieve) {
			const variantManagementControl = this.content.getVariant();
			if (!tableState.variantManagement) {
				tableState.variantManagement = { variantId: variantManagementControl?.getCurrentVariantKey() };
			} else {
				tableState.variantManagement.variantId = variantManagementControl?.getCurrentVariantKey();
			}
		}
		return tableState;
	}

	/**
	 * Sets the initial state of the control by retrieving the external state.
	 * @returns A promise that resolves when the initial state is set.
	 */
	async setInitialState(this: TableAPI): Promise<void> {
		try {
			const initialControlState = await StateUtil.retrieveExternalState(this.content);
			this.initialControlState = initialControlState;
		} catch (e: unknown) {
			Log.error(e as string);
		}
	}

	/**
	 * Applies the legacy state to the table based on the provided control state retrieval function.
	 * @param getControlState Function to retrieve the control state.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Flag indicating whether to apply the diff state.
	 * @returns - A promise that resolves when the state has been applied.
	 */
	async applyLegacyState(
		this: TableAPI,
		getControlState: (control: ManagedObject) => ControlState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean
	): Promise<void> {
		const table = this.content;
		const vm = table.getVariant();
		const quickFilter = this.getQuickFilter();

		const tableState = getControlState(table) as { initialState?: TableState; fullState?: TableState };
		const vmState = vm ? getControlState(vm) : null;
		const quickFilterState = quickFilter?.content ? getControlState(quickFilter.content) : null;

		const controlState: TableState = {};

		if (tableState) {
			controlState.innerTable = {
				...controlState.innerTable,
				...tableState,
				fullState: {
					...controlState.innerTable?.fullState,
					...tableState.fullState
				},
				initialState: {
					...controlState.innerTable?.initialState,
					...tableState.initialState
				}
			};
		}

		if (vmState?.variantId) {
			controlState.variantManagement = {
				...controlState.variantManagement,
				variantId: vmState.variantId.toString()
			};
		}

		if (quickFilterState?.selectedKey) {
			controlState.quickFilter = {
				...controlState.quickFilter,
				selectedKey: quickFilterState.selectedKey.toString()
			};
		}
		if (controlState && Object.keys(controlState).length > 0) {
			await this.applyState(controlState as object, _navParameters, shouldApplyDiffState);
		}
	}

	/**
	 * Asynchronously applies the provided control state to the viewstate.
	 * @param controlState The state to be applied to the control.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Optional flag to skip merging states.
	 * @returns A promise that resolves when the state has been applied.
	 */
	async applyState(
		this: TableAPI,
		controlState: TableState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean
	): Promise<void> {
		if (!controlState) return;

		// Table properties need to be available before calling diffState/retrieveState. However, applyState
		// gets called too early in the table's lifecycle, so the delegate and properties are not yet available.
		await this.content.initialized();

		const innerTableState = controlState?.innerTable;
		const variantId = controlState?.variantManagement?.variantId;
		const currentVariant = this.content?.getVariant();
		const quickFilterKey = controlState?.quickFilter?.selectedKey;
		const quickFilter = this.getQuickFilter();

		// Handle Variant Management
		if (variantId !== undefined && variantId !== currentVariant.getCurrentVariantKey()) {
			const ovM = this.content?.getVariant();
			const aVariants = ovM?.getVariants();
			const sVariantReference = aVariants?.some((oVariant) => oVariant.getKey() === variantId)
				? variantId
				: ovM?.getStandardVariantKey;
			try {
				const ControlVariantApplyAPI = (await import("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
				await ControlVariantApplyAPI.activateVariant({
					element: ovM,
					variantReference: sVariantReference as string
				});
				await this.setInitialState();
			} catch (error: unknown) {
				Log.error(error as string);
				await this.setInitialState();
			}
		} else {
			// we need to update initial state even if above condition not satiesfied
			await this.setInitialState();
		}

		// Handle Inner Table State

		let finalState;

		if (innerTableState) {
			if (shouldApplyDiffState && innerTableState.initialState) {
				if (!innerTableState.initialState.supplementaryConfig) {
					innerTableState.initialState.supplementaryConfig = {};
				}
				finalState = await StateUtil.diffState(
					this.content,
					innerTableState.initialState as object,
					innerTableState.fullState as object
				);
			} else {
				if (controlState && !controlState?.supplementaryConfig) {
					controlState.supplementaryConfig = {};
				}
				finalState = innerTableState.fullState;
			}
			await StateUtil.applyExternalState(this.content, finalState);
		}

		// Handle Quick Filter State
		if (quickFilterKey && quickFilterKey !== quickFilter?.getSelectedKey()) {
			quickFilter?.setSelectedKey(quickFilterKey);
			this.onQuickFilterSelectionChange();
		}
		if (this.initialLoad && this.filterBar) {
			const filterBar = this.getFilterBarControl(this.filterBar);
			if (filterBar && filterBar.isA<FilterBarAPI>("sap.fe.macros.filterBar.FilterBarAPI")) {
				filterBar
					.waitForInitialState()
					.then((): void => {
						this.content.rebind();
						return;
					})
					.catch((): void => {
						Log.error("Error while waiting for initial state of filter bar");
					});
			}
		}
	}
}

import Log from "sap/base/Log";
import type { ControlState, LegacyFilterBarState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributorMixin from "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import { InitialLoadMode } from "sap/fe/core/library";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import { NavType } from "sap/fe/navigation/library";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import Device from "sap/ui/Device";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type FilterBar from "sap/ui/mdc/FilterBar";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type FilterBarAPI from "../FilterBarAPI";
import type { FilterBarState } from "../FilterBarAPI";

export default class FilterBarAPIStateHandler extends IViewStateContributorMixin<FilterBarState> {
	async applyLegacyState(
		this: FilterBarAPI,
		getControlState: (control: ManagedObject) => ControlState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void> {
		const filterBar = this.content;
		const filterBarState = getControlState(filterBar) as { initialState?: LegacyFilterBarState; fullState?: LegacyFilterBarState };
		const controlState: FilterBarState = {};

		if (filterBarState) {
			controlState.innerState = {
				...filterBarState,
				fullState: {
					...controlState.innerState?.fullState,
					...filterBarState.fullState
				},
				initialState: {
					...controlState.innerState?.initialState,
					...filterBarState.initialState
				}
			};
		}
		if (controlState && Object.keys(controlState).length > 0) {
			await this.applyState(controlState as object, _navParameters, shouldApplyDiffState, skipMerge);
		}
	}

	async applyState(
		this: FilterBarAPI,
		controlState: FilterBarState,
		navParameter?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void> {
		try {
			if (controlState && navParameter) {
				const navigationType = navParameter.navigationType;
				//When navigation type is hybrid, we override the filter conditions in IAppState with SV received from XappState
				if (navigationType === NavType.hybrid && controlState.innerState?.fullState !== undefined) {
					const xAppStateFilters = await this.convertSelectionVariantToStateFilters(
						navParameter.selectionVariant as SelectionVariant,
						true
					);

					const mergedFullState = {
						...controlState.innerState?.fullState,
						filter: {
							...controlState.innerState?.fullState.filter,
							...xAppStateFilters
						}
					};
					//when navigating from card, remove all existing filters values (default or otherwise) and then apply the state
					await this._clearFilterValuesWithOptions(this.content, { clearEditFilter: true });
					return await StateUtil.applyExternalState(this.content, mergedFullState);
				}

				if (shouldApplyDiffState) {
					const diffState: object = await StateUtil.diffState(
						this.content,
						controlState.innerState?.initialState as object,
						controlState.innerState?.fullState as object
					);
					return await StateUtil.applyExternalState(this.content, diffState);
				} else if (skipMerge) {
					//skipMerge is true when coming from the dynamic tile, in this case, remove all existing filters values (default or otherwise)
					await this._clearFilterValuesWithOptions(this.content, { clearEditFilter: true });
				}
				return await StateUtil.applyExternalState(this.content, controlState?.innerState?.fullState ?? controlState);
			}
		} catch (error: unknown) {
			Log.error(error as string);
		} finally {
			this._initialStatePromise.resolve();
		}
	}

	async retrieveState(this: FilterBarAPI): Promise<FilterBarState | null> {
		const filterBarState: FilterBarState = {};
		filterBarState.innerState = this.getControlState(await StateUtil.retrieveExternalState(this.content)) as {
			initialState?: LegacyFilterBarState;
			fullState?: LegacyFilterBarState;
		};
		// remove sensitive or view state irrelevant fields
		const propertiesInfo = this.content.getPropertyInfoSet();
		const filter = filterBarState.innerState?.filter || {};
		propertiesInfo
			.filter(function (propertyInfo: PropertyInfo & { removeFromAppState?: boolean }) {
				return (
					Object.keys(filter).length > 0 &&
					propertyInfo.path &&
					filter[propertyInfo.path] &&
					(propertyInfo.removeFromAppState || filter[propertyInfo.path].length === 0)
				);
			})
			.forEach(function (PropertyInfo: PropertyInfo) {
				if (PropertyInfo.path) {
					delete filter[PropertyInfo.path];
				}
			});
		return filterBarState;
	}

	async setInitialState(this: FilterBarAPI): Promise<void> {
		try {
			const initialControlState = await StateUtil.retrieveExternalState(this.content);
			this.initialControlState = initialControlState;
		} catch (e: unknown) {
			Log.error(e as string);
		}
	}

	async applyNavigationParameters(this: FilterBarAPI, navigationParameter: NavigationParameter): Promise<void> {
		return new Promise<void>(async (resolve) => {
			try {
				const view = this.getPageController()?.getView();
				const controller = this.getPageController();
				const appComponent = controller.getAppComponent();
				const componentData = appComponent.getComponentData();
				const startupParameters = (componentData && componentData.startupParameters) || {};
				const variantStatus = await this.handleVariantIdPassedViaURLParams(startupParameters as unknown as Record<string, string>);
				let filterVariantApplied = false;
				if (variantStatus && (variantStatus as [])?.length > 0) {
					// check if filter bar variant is applied or not.
					if ((variantStatus as boolean[])[0] === true || (variantStatus as boolean[])[1] === true) {
						filterVariantApplied = true;
					}
				}

				// if variant from URL does not exist or did not apply properly then apply to LR either default variant or standard variant required.
				const filterBar = this.getContent();
				const { selectionVariant: sv, requiresStandardVariant: reqStdVariant = false } = navigationParameter;

				if (!filterBar || !sv) {
					resolve();
				}
				await this._applySelectionVariant(view, navigationParameter, filterVariantApplied);
				let bPreventInitialSearch = false;
				const variantManagement = this._getFilterBarVM(view) as VariantManagement;
				if (filterBar) {
					if (
						(navigationParameter.navigationType !== NavType.initial && reqStdVariant) ||
						(!variantManagement && view.getViewData().initialLoad === InitialLoadMode.Enabled) ||
						(controller as ListReportController)._shouldAutoTriggerSearch(variantManagement)
					) {
						const filterBarAPI = filterBar.getParent() as FilterBarAPI;
						filterBarAPI.triggerSearch();
					} else {
						bPreventInitialSearch = this._preventInitialSearch(variantManagement);
					}
					//collapse or expand shall be available only for non-desktop systems
					if (!Device.system.desktop) {
						const internalModelContext = view.getBindingContext("internal") as InternalModelContext;
						const searchTriggeredByInitialLoad = this.isSearchTriggeredByInitialLoad(navigationParameter.navigationType);
						internalModelContext.setProperty("searchTriggeredByInitialLoad", searchTriggeredByInitialLoad);
					}
					this._enableFilterBar(filterBar as FilterBar, bPreventInitialSearch);
				} else {
					Log.warning("Did not finish applying navigation parameters - Filter bar not found.");
				}
				resolve();
			} catch {
				resolve();
				Log.warning("Could not apply navigation parameters.");
			}
		});
	}
}

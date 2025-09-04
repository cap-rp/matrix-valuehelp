import Log from "sap/base/Log";
import mergeObjects from "sap/base/util/merge";
import type DynamicPage from "sap/f/DynamicPage";
import { defineUI5Class, extensible, finalExtension, privateExtension, publicExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import type PageController from "sap/fe/core/PageController";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import NavLibrary from "sap/fe/navigation/library";
import type MultipleModeControl from "sap/fe/templates/ListReport/controls/MultipleModeControl";
import type IconTabFilter from "sap/m/IconTabFilter";
import type SegmentedButton from "sap/m/SegmentedButton";
import type Select from "sap/m/Select";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type BaseObject from "sap/ui/base/Object";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type MDCControl from "sap/ui/mdc/Control";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type MDCTable from "sap/ui/mdc/Table";

import type StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type FclController from "../rootView/Fcl.controller";
import type NavContainerController from "../rootView/NavContainer.controller";

// additionalStates are stored next to control IDs, so name clash avoidance needed. Fortunately IDs have restrictions:
// "Allowed is a sequence of characters (capital/lowercase), digits, underscores, dashes, points and/or colons."
// Therefore adding a symbol like # or @
const NavType = NavLibrary.NavType;

/**
 * Definition of a navigation parameter
 * @public
 */
export type NavigationParameter = {
	/**
	 *  The actual navigation type.
	 *  @public
	 */
	navigationType: string;
	/**
	 * The selectionVariant from the navigation.
	 * @public
	 */
	selectionVariant?: SelectionVariant;
	/**
	 * The selectionVariant defaults from the navigation
	 *  @public
	 */
	selectionVariantDefaults?: SelectionVariant;
	/**
	 * Defines whether the standard variant must be used in variant management
	 *  @public
	 */
	requiresStandardVariant?: boolean;
};

const ADDITIONAL_STATES_KEY = "#additionalStates";

export type ControlState =
	| ({
			initialState?: {
				supplementaryConfig?: object;
			};
			fullState?: {
				filter?: object;
			};
	  } & Record<string, unknown>)
	| undefined;

export type NavParameters = {
	navigationType?: string;
};
export type LegacyFilterBarState = {
	filter?: Record<string, Array<object>>;
} & Record<string, unknown>;

///////////////////////////////////////////////////////////////////
// methods to retrieve & apply states for the different controls //
///////////////////////////////////////////////////////////////////
export type ControlStateHandler<T extends ManagedObject, K extends unknown | undefined> = {
	retrieve?: (oControl: T) => K | Promise<K>;
	apply?: (oControl: T, controlState: K, navParameters?: NavigationParameter, skipMerge?: boolean) => Promise<void> | void;
	refreshBinding?: (oControl: T) => void;
};
type ControlStateMap = {
	"sap.ui.fl.variants.VariantManagement": ControlStateHandler<VariantManagement, { variantId: string | null }>;
	"sap.fe.templates.ListReport.controls.MultipleModeControl": ControlStateHandler<MultipleModeControl, { selectedKey: string }>;
	"sap.ui.mdc.Table": ControlStateHandler<MDCTable, ControlState>;
	"sap.m.SegmentedButton": ControlStateHandler<SegmentedButton, { selectedKey: string }>;
	"sap.m.Select": ControlStateHandler<Select, { selectedKey: string }>;
	"sap.f.DynamicPage": ControlStateHandler<DynamicPage, { headerExpanded: boolean }>;
	"sap.ui.core.ComponentContainer": ControlStateHandler<ComponentContainer, object>;
	"sap.ui.core.mvc.View": ControlStateHandler<FEView, ControlState>;
};
const getStateUtil = async function (): Promise<typeof StateUtil> {
	return (await import("sap/ui/mdc/p13n/StateUtil")).default;
};
const _mControlStateHandlerMap: ControlStateMap = {
	"sap.ui.fl.variants.VariantManagement": {
		retrieve: function (oVM: VariantManagement): { variantId: string | null } {
			return {
				variantId: oVM.getCurrentVariantKey()
			};
		},
		apply: async function (this: ViewState, oVM: VariantManagement, controlState?: { variantId?: string | null }): Promise<void> {
			try {
				if (controlState && controlState.variantId !== undefined && controlState.variantId !== oVM.getCurrentVariantKey()) {
					const isVariantIdAvailable = this._checkIfVariantIdIsAvailable(oVM, controlState.variantId);
					let sVariantReference;
					if (isVariantIdAvailable) {
						sVariantReference = controlState.variantId;
					} else {
						sVariantReference = oVM.getStandardVariantKey();
						this.controlsVariantIdUnavailable.push(...oVM.getFor());
					}
					try {
						const ControlVariantApplyAPI = (await import("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
						await ControlVariantApplyAPI.activateVariant({
							element: oVM,
							variantReference: sVariantReference as string
						});
						await this._setInitialStatesForDeltaCompute(oVM);
					} catch (error: unknown) {
						Log.error(error as string);
						this.invalidateInitialStateForApply.push(...oVM.getFor());
						await this._setInitialStatesForDeltaCompute(oVM);
					}
				} else {
					this._setInitialStatesForDeltaCompute(oVM);
				}
			} catch (error: unknown) {
				Log.error(error as string);
			}
		}
	},
	"sap.fe.templates.ListReport.controls.MultipleModeControl": {
		retrieve: function (multipleModeControl: MultipleModeControl): { selectedKey: string } {
			return {
				selectedKey: multipleModeControl.content.getSelectedKey()
			};
		},
		apply: function (multipleModeControl: MultipleModeControl, controlState?: { selectedKey: string }) {
			if (controlState?.selectedKey) {
				const tabBar = multipleModeControl.content;
				const selectedItem = tabBar.getItems().find((item) => (item as IconTabFilter).getKey() === controlState.selectedKey);

				if (selectedItem) {
					tabBar.setSelectedKey(controlState.selectedKey);
					if (multipleModeControl.getModel("_pageModel")?.getProperty("/hideFilterBar") === true) {
						multipleModeControl.refreshSelectedInnerControlContent();
					}
				}
			}
		}
	},
	"sap.ui.mdc.Table": {
		refreshBinding: function (oTable: MDCTable) {
			const oTableBinding = oTable.getRowBinding();
			if (oTableBinding) {
				const oRootBinding = oTableBinding.getRootBinding();
				const aggregation = oTableBinding.getAggregation() as { hierarchyQualifier?: string } | undefined;
				if (oRootBinding === oTableBinding && aggregation?.hierarchyQualifier === undefined) {
					// absolute binding (except TreeTable, where we want to keep expansion states)
					oTableBinding.refresh();
				} else {
					// relative binding or TreeTable
					const oHeaderContext = oTableBinding.getHeaderContext();
					const sGroupId = oTableBinding.getGroupId();

					if (oHeaderContext) {
						oHeaderContext.requestSideEffects([{ $NavigationPropertyPath: "" }], sGroupId);
					}
				}
			} else {
				Log.info(`Table: ${oTable.getId()} was not refreshed. No binding found!`);
			}
		}
	},
	"sap.m.SegmentedButton": {
		retrieve: function (oSegmentedButton: SegmentedButton): { selectedKey: string } {
			return {
				selectedKey: oSegmentedButton.getSelectedKey()
			};
		},
		apply: function (this: ViewState, oSegmentedButton: SegmentedButton, oControlState?: { selectedKey: string }): void {
			if (oControlState?.selectedKey && oControlState.selectedKey !== oSegmentedButton.getSelectedKey()) {
				oSegmentedButton.setSelectedKey(oControlState.selectedKey);
				if (oSegmentedButton.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
					oSegmentedButton.fireEvent("selectionChange");
				}
			}
		}
	},
	"sap.m.Select": {
		retrieve: function (oSelect: Select): { selectedKey: string } {
			return {
				selectedKey: oSelect.getSelectedKey()
			};
		},
		apply: function (this: ViewState, oSelect: Select, oControlState?: { selectedKey: string }): void {
			if (oControlState?.selectedKey && oControlState.selectedKey !== oSelect.getSelectedKey()) {
				oSelect.setSelectedKey(oControlState.selectedKey);
				if (oSelect.getParent()?.isA("sap.ui.mdc.ActionToolbar")) {
					oSelect.fireEvent("change");
				}
			}
		}
	},
	"sap.f.DynamicPage": {
		retrieve: function (oDynamicPage: DynamicPage): { headerExpanded: boolean } {
			return {
				headerExpanded: oDynamicPage.getHeaderExpanded()
			};
		},
		apply: function (oDynamicPage: DynamicPage, oControlState?: { headerExpanded: boolean }): void {
			if (oControlState) {
				oDynamicPage.setHeaderExpanded(oControlState.headerExpanded);
			}
		}
	},
	"sap.ui.core.mvc.View": {
		retrieve: function (oView: FEView) {
			const oController = oView.getController();
			if (oController && oController.viewState) {
				return oController.viewState.retrieveViewState();
			}
			return {};
		},
		apply: async function (oView: FEView, oControlState: ControlState, oNavParameters?: NavigationParameter, skipMerge?: boolean) {
			const oController = oView.getController();
			if (oController && oController.viewState && oNavParameters) {
				return oController.viewState.applyViewState(oControlState, oNavParameters, skipMerge);
			}
		},
		refreshBinding: async function (oView: FEView) {
			const oController = oView.getController();
			if (oController && oController.viewState) {
				return oController.viewState.refreshViewBindings();
			}
		}
	},
	"sap.ui.core.ComponentContainer": {
		retrieve: async function (this: ViewState, oComponentContainer: ComponentContainer): Promise<object> {
			const oComponent = oComponentContainer.getComponentInstance();
			if (oComponent) {
				return this.retrieveControlState(oComponent.getRootControl());
			}
			return {} as object;
		},
		apply: async function (
			this: ViewState,
			oComponentContainer: ComponentContainer,
			oControlState: object,
			oNavParameters?: NavigationParameter
		): Promise<void> {
			const oComponent = oComponentContainer.getComponentInstance();
			if (oComponent) {
				return this.applyControlState(oComponent.getRootControl(), oControlState, oNavParameters);
			}
		}
	}
};
/**
 * A controller extension offering hooks for state handling
 *
 * If you need to maintain a specific state for your application, you can use the controller extension.
 * @hideconstructor
 * @public
 * @since 1.85.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.ViewState")
class ViewState extends ControllerExtension {
	private _retrieveCalls: Promise<Record<string, unknown>>[] = [];

	private _pInitialStateApplied: Promise<unknown>;

	private _pInitialStateAppliedResolve?: Function;

	public base!: PageController;

	initialControlStatesMapper: Record<string, unknown> = {};

	controlsVariantIdUnavailable: string[] = [];

	invalidateInitialStateForApply: string[] = [];

	viewStateControls: ManagedObject[] = [];

	stateContributors: (ManagedObject & IViewStateContributor<unknown>)[] = [];

	_currentViewState?: Record<string, unknown>;

	configOfStateApply?: {
		skipMerge?: boolean | undefined;
		navTypeParameters?: NavParameters;
		state?: Record<string, unknown>;
	};

	private updateAppStateTimer: number | undefined;

	/**
	 * Constructor.
	 */
	constructor() {
		super();
		this._retrieveCalls = [];
		this._pInitialStateApplied = new Promise((resolve) => {
			this._pInitialStateAppliedResolve = resolve;
		});
	}

	@publicExtension()
	@finalExtension()
	async refreshViewBindings(): Promise<void> {
		const aControls = await this.collectResults(this.base.viewState.adaptBindingRefreshControls);
		let oPromiseChain = Promise.resolve();
		aControls
			.filter((oControl) => {
				return oControl && oControl.isA && oControl.isA<ManagedObject>("sap.ui.base.ManagedObject");
			})
			.forEach((oControl: ManagedObject) => {
				oPromiseChain = oPromiseChain.then(this.refreshControlBinding.bind(this, oControl));
			});
		return oPromiseChain;
	}

	/**
	 * This function should add all controls relevant for refreshing to the provided control array.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param aCollectedControls The collected controls
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	adaptBindingRefreshControls(aCollectedControls: ManagedObject[]): void {
		// to be overriden
	}

	@privateExtension()
	@finalExtension()
	async refreshControlBinding(oControl: ManagedObject): Promise<void> {
		const oControlRefreshBindingHandler = this.getControlRefreshBindingHandler(oControl);
		let oPromiseChain = Promise.resolve();
		if (typeof oControlRefreshBindingHandler.refreshBinding !== "function") {
			Log.info(`refreshBinding handler for control: ${oControl.getMetadata().getName()} is not provided`);
		} else {
			oPromiseChain = oPromiseChain.then(oControlRefreshBindingHandler.refreshBinding.bind(this, oControl));
		}
		return oPromiseChain;
	}

	/**
	 * Returns a map of <code>refreshBinding</code> function for a certain control.
	 * @param oControl The control to get state handler for
	 * @returns A plain object with one function: <code>refreshBinding</code>
	 */

	@privateExtension()
	@finalExtension()
	getControlRefreshBindingHandler(oControl: ManagedObject): {
		refreshBinding?: (oControl: ManagedObject) => void;
	} {
		const oRefreshBindingHandler: {
			refreshBinding?: (oControl: ManagedObject) => void;
		} = {};
		if (oControl) {
			for (const sType in _mControlStateHandlerMap) {
				if (oControl.isA(sType)) {
					// pass only the refreshBinding handler in an object so that :
					// 1. Application has access only to refreshBinding and not apply and reterive at this stage
					// 2. Application modifications to the object will be reflected here (as we pass by reference)
					oRefreshBindingHandler["refreshBinding"] =
						(_mControlStateHandlerMap[sType as keyof ControlStateMap].refreshBinding as (oControl: ManagedObject) => void) ||
						{};
					break;
				}
			}
		}
		this.base.viewState.adaptBindingRefreshHandler(oControl, oRefreshBindingHandler);
		return oRefreshBindingHandler;
	}

	/**
	 * Customize the <code>refreshBinding</code> function for a certain control.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param _oControl The control for which the refresh handler is adapted.
	 * @param _oControlHandler A plain object which can have one function: <code>refreshBinding</code>
	 * @param _oControlHandler.refreshBinding
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	adaptBindingRefreshHandler(
		_oControl: ManagedObject,
		_oControlHandler: {
			refreshBinding?: (oControl: ManagedObject) => void;
		}
	): void {
		// to be overriden
	}

	/**
	 * Called when the application is suspended due to keep-alive mode.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onSuspend(): void {
		// to be overriden
	}

	/**
	 * Called when the application is restored due to keep-alive mode.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onRestore(): void {
		// to be overriden
	}

	/**
	 * Destructor method for objects.
	 */
	destroy(): void {
		delete this._pInitialStateAppliedResolve;
		super.destroy();
	}

	/**
	 * Helper function to enable multi override. It is adding an additional parameter (array) to the provided
	 * function (and its parameters), that will be evaluated via <code>Promise.all</code>.
	 * @param fnCall The function to be called
	 * @param args
	 * @returns A promise to be resolved with the result of all overrides
	 */
	@privateExtension()
	@finalExtension()
	async collectResults(fnCall: Function, ...args: unknown[]): Promise<Control[]> {
		const aResults: Control[] = [];
		args.push(aResults);
		fnCall.apply(this, args);
		return Promise.all(aResults);
	}

	/**
	 * Customize the <code>retrieve</code> and <code>apply</code> functions for a certain control.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param oControl The control to get state handler for
	 * @param aControlHandler A list of plain objects with two functions: <code>retrieve</code> and <code>apply</code>
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	adaptControlStateHandler(oControl: ManagedObject, aControlHandler: object[]): void {
		// to be overridden if needed
	}

	/**
	 * Returns a map of <code>retrieve</code> and <code>apply</code> functions for a certain control.
	 * @param oControl The control to get state handler for
	 * @returns A plain object with two functions: <code>retrieve</code> and <code>apply</code>
	 */
	@privateExtension()
	@finalExtension()
	getControlStateHandler(oControl: ManagedObject): ControlStateHandler<ManagedObject, object>[] {
		const aInternalControlStateHandler: ControlStateHandler<ManagedObject, object>[] = [],
			aCustomControlStateHandler: ControlStateHandler<ManagedObject, object>[] = [];
		if (oControl) {
			if (
				oControl.isA<IViewStateContributor<object>>("sap.fe.core.controllerextensions.viewState.IViewStateContributor") &&
				oControl.retrieveState &&
				oControl.applyState
			) {
				aInternalControlStateHandler.push({
					// eslint-disable-next-line @typescript-eslint/require-await
					retrieve: async (_control) => oControl.retrieveState.bind(oControl)(),

					apply: async (
						_control: ManagedObject,
						controlState?: object,
						oNavParameters?: NavigationParameter,
						skipMerge?: boolean
						// eslint-disable-next-line @typescript-eslint/require-await
					) => {
						const shouldApplyDiffState =
							!this.invalidateInitialStateForApply.includes(oControl.getId()) &&
							!this.controlsVariantIdUnavailable.includes(oControl.getId()) &&
							oNavParameters?.navigationType !== NavType.hybrid &&
							skipMerge !== true;
						if (!controlState) {
							if (oControl.applyLegacyState) {
								await oControl.applyLegacyState.bind(oControl)(
									this.getControlState.bind(this),
									oNavParameters,
									shouldApplyDiffState,
									skipMerge
								);
							}
						} else {
							await oControl.applyState.bind(oControl)(controlState, oNavParameters, shouldApplyDiffState, skipMerge);
						}
					}
				});
			} else {
				for (const sType in _mControlStateHandlerMap) {
					if (oControl.isA(sType)) {
						// avoid direct manipulation of internal _mControlStateHandlerMap
						aInternalControlStateHandler.push(
							Object.assign({}, _mControlStateHandlerMap[sType as keyof ControlStateMap]) as ControlStateHandler<
								ManagedObject,
								object
							>
						);
						break;
					}
				}
			}
		}
		this.base.viewState.adaptControlStateHandler(oControl, aCustomControlStateHandler);
		return aInternalControlStateHandler.concat(aCustomControlStateHandler);
	}

	/**
	 * This function should add all controls for given view that should be considered for the state handling to the provided control array.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param _aCollectedControls The collected controls
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	adaptStateControls(_aCollectedControls: ManagedObject[]): void {
		_aCollectedControls.push(...this.stateContributors);
	}

	/**
	 * Returns the key to be used for given control.
	 * @param oControl The control to get state key for
	 * @returns The key to be used for storing the controls state
	 */
	@publicExtension()
	@finalExtension()
	getStateKey(oControl: ManagedObject): string {
		return this.getView().getLocalId(oControl.getId()) || oControl.getId();
	}

	/**
	 * Retrieve the view state of this extensions view.
	 * @returns A promise resolving the view state
	 */
	@privateExtension()
	@finalExtension()
	async _retrieveViewState(): Promise<Record<string, unknown>> {
		let oViewState: Record<string, unknown> = {};

		try {
			await this._pInitialStateApplied;
			const aControls: (ManagedObject | undefined)[] = await this.collectResults(this.base.viewState.adaptStateControls);
			const aResolvedStates = await Promise.all(
				(
					aControls.filter(function (oControl) {
						return oControl && oControl.isA && oControl.isA<ManagedObject>("sap.ui.base.ManagedObject");
					}) as ManagedObject[]
				).map(async (oControl) => {
					return this.retrieveControlState(oControl).then((vResult: unknown) => {
						return {
							key: this.getStateKey(oControl),
							value: vResult
						};
					});
				})
			);
			oViewState = aResolvedStates.reduce(function (oStates: Record<string, unknown>, mState: { key: string; value: unknown }) {
				const oCurrentState: Record<string, unknown> = {};
				oCurrentState[mState.key] = mState.value;
				return mergeObjects(oStates, oCurrentState);
			}, {});
			const prevState = this._currentViewState;
			if (prevState && Object.keys(prevState).length > 0) {
				this._addMissingState(oViewState, prevState);
			}
			const mAdditionalStates = await Promise.resolve(this._retrieveAdditionalStates());
			if (mAdditionalStates && Object.keys(mAdditionalStates).length) {
				oViewState[ADDITIONAL_STATES_KEY] = mAdditionalStates;
			}
		} catch (err: unknown) {
			const viewId = this.getView().getId();
			Log.error(`ViewState : ${viewId} : failed to retrieve state!`);
		}
		return oViewState;
	}

	/**
	 * Retrieve the view state of this extensions view.
	 * @returns A promise resolving the view state
	 * @public
	 */
	@publicExtension()
	@finalExtension()
	async retrieveViewState(): Promise<Record<string, unknown> | undefined> {
		const presentRetrieveCall = this._retrieveViewState();
		this._retrieveCalls.push(presentRetrieveCall);
		await presentRetrieveCall;

		// If there have been subsequent retrieve calls on the same view state controller extension before earlier retrieval is complete, we await for the latest result.
		// We shall return the same view state for all pending retrieve calls.
		const viewStateResults = await Promise.allSettled(this._retrieveCalls);

		const viewStateSettledPromise = viewStateResults[viewStateResults.length - 1];
		const viewState = viewStateSettledPromise.status === "fulfilled" ? viewStateSettledPromise.value : undefined;
		this._currentViewState = viewState;
		return viewState;
	}

	// To carry forward unapplied state lost due to lazy loading of controls.
	//
	// If user 1 changes a control's state in a lazy-loaded section and navigates away, then shares the URL with user 2,
	// who doesn't visit the lazy-loaded section, the control's state is missed in the new app state.
	// This ensures the full state from user 1 is preserved and transferred to user 3 when the URL is shared.
	_addMissingState(oViewState: Record<string, unknown>, prevState: Record<string, unknown>): void {
		for (const key in prevState) {
			if (!(key in oViewState)) {
				oViewState[key] = prevState[key];
			}
		}
	}

	/**
	 * Extend the map of additional states (not control bound) to be added to the current view state of the given view.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param mAdditionalStates The additional state
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	retrieveAdditionalStates(mAdditionalStates: object): void {
		// to be overridden if needed
	}

	/**
	 * Returns a map of additional states (not control bound) to be added to the current view state of the given view.
	 * @returns Additional view states
	 */
	_retrieveAdditionalStates(): unknown {
		const mAdditionalStates = {};
		this.base.viewState.retrieveAdditionalStates(mAdditionalStates);
		return mAdditionalStates;
	}

	/**
	 * Returns the current state for the given control.
	 * @param oControl The object to get the state for
	 * @returns The state for the given control
	 */
	@privateExtension()
	@finalExtension()
	async retrieveControlState(oControl: ManagedObject): Promise<object> {
		const aControlStateHandlers = this.getControlStateHandler(oControl);
		return Promise.all(
			aControlStateHandlers.map(async (mControlStateHandler) => {
				if (typeof mControlStateHandler.retrieve !== "function") {
					throw new Error(`controlStateHandler.retrieve is not a function for control: ${oControl.getMetadata().getName()}`);
				}
				return mControlStateHandler.retrieve.call(this, oControl);
			})
		).then((aStates: object[]) => {
			return aStates.reduce(function (oFinalState: Record<string, unknown>, oCurrentState: object) {
				return mergeObjects(oFinalState, oCurrentState);
			}, {});
		});
	}

	/**
	 * Defines whether the view state should only be applied once initially.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
	 *
	 * Important:
	 * You should only override this method for custom pages and not for the standard ListReportPage and ObjectPage!
	 * @returns If <code>true</code>, only the initial view state is applied once,
	 * else any new view state is also applied on follow-up calls (default)
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	applyInitialStateOnly(): boolean {
		return true;
	}

	/**
	 * Retrieves the state of a specific control.
	 * @param control The managed control object whose state is to be retrieved.
	 * @returns - The state of the specified control.
	 */
	getControlState(control: ManagedObject): ControlState {
		const oViewState = this._currentViewState;
		let controlState: ControlState = {};
		if (oViewState) {
			const controlKey = this.getStateKey(control);
			controlState = oViewState[controlKey] as Record<string, ControlState>;
		}
		return controlState;
	}

	/**
	 * Applies the given view state to this extensions view.
	 * @param oViewState The view state to apply (can be undefined)
	 * @param oNavParameter The current navigation parameter
	 * @param oNavParameter.navigationType The actual navigation type
	 * @param oNavParameter.selectionVariant The selectionVariant from the navigation
	 * @param oNavParameter.selectionVariantDefaults The selectionVariant defaults from the navigation
	 * @param oNavParameter.requiresStandardVariant Defines whether the standard variant must be used in variant management
	 * @param skipMerge Boolean which determines to skip the key user shine through
	 * @returns Promise for async state handling
	 * @public
	 */
	@publicExtension()
	@finalExtension()
	async applyViewState(
		oViewState: Record<string, unknown> | undefined,
		oNavParameter: NavigationParameter,
		skipMerge?: boolean
	): Promise<void> {
		if (this.base.viewState.applyInitialStateOnly() && this._getInitialStateApplied()) {
			return;
		}
		try {
			//SNOW: CS20230006765897 For transient AppState, we return without applying the state to controls in RootContainer's children views as there is no state to apply
			//Only need is to resolve the _pInitialStateApplied so that update of AppState can still happen
			if (this._isStateEmptyForIAppStateNavType(oViewState, oNavParameter.navigationType) && !this.__isRootViewController()) {
				return;
			}
			await this.collectResults(this.base.viewState.onBeforeStateApplied, [], oNavParameter.navigationType);
			const aControls: ManagedObject[] = await this.collectResults(this.base.viewState.adaptStateControls);
			this.viewStateControls = aControls;
			let oPromiseChain = Promise.resolve();
			let hasVariantManagement = false;
			this._currentViewState = oViewState;

			this.configOfStateApply = this.configOfStateApply ?? {};
			this.configOfStateApply.skipMerge = skipMerge;
			this.configOfStateApply.navTypeParameters = oNavParameter;
			this.configOfStateApply.state = oViewState;

			/**
			 * This ensures that variantManagement control is applied first to calculate the initial state for delta logic
			 */
			const sortedAdaptStateControls = aControls.reduce((modifiedControls: ManagedObject[], control) => {
				if (!control) {
					return modifiedControls;
				}
				const isVariantManagementControl = control.isA("sap.ui.fl.variants.VariantManagement");
				if (!hasVariantManagement) {
					hasVariantManagement = isVariantManagementControl;
				}
				modifiedControls = isVariantManagementControl ? [control, ...modifiedControls] : [...modifiedControls, control];
				return modifiedControls;
			}, []);

			// In case of no Variant Management, this ensures that initial states is set
			if (!hasVariantManagement) {
				this._setInitialStatesForDeltaCompute();
			}
			sortedAdaptStateControls
				.filter(function (oControl) {
					return oControl.isA("sap.ui.base.ManagedObject");
				})
				.forEach((oControl) => {
					const sKey = this.getStateKey(oControl);
					oPromiseChain = oPromiseChain.then(
						this.applyControlState.bind(
							this,
							oControl,
							(oViewState ? oViewState[sKey] : undefined) as Record<string, unknown>,
							oNavParameter,
							skipMerge ?? false
						)
					);
				});

			await oPromiseChain;

			if (oNavParameter.navigationType === NavType.iAppState || oNavParameter.navigationType === NavType.hybrid) {
				await this.collectResults(
					this.base.viewState.applyAdditionalStates,
					oViewState ? oViewState[ADDITIONAL_STATES_KEY] : undefined
				);
			} else {
				await this.collectResults(this.base.viewState.applyNavigationParameters, oNavParameter);
				const promises: Promise<void>[] = [];
				this._getPromisesForAdaptControls(sortedAdaptStateControls, oNavParameter, promises);
				await Promise.all(promises);
			}
		} finally {
			try {
				if (!this._isStateEmptyForIAppStateNavType(oViewState, oNavParameter.navigationType)) {
					await this.collectResults(this.base.viewState.onAfterStateApplied);
				}
				this._setInitialStateApplied();
			} catch (e: unknown) {
				Log.error(e as string);
			}
		}
	}

	_getPromisesForAdaptControls(
		sortedAdaptStateControls: ManagedObject[],
		navParameter: NavigationParameter,
		promises: Promise<void>[]
	): Promise<void>[] {
		sortedAdaptStateControls
			.filter(function (control) {
				return control.isA("sap.ui.base.ManagedObject");
			})
			.forEach((control) => {
				if (
					control.isA<IViewStateContributor<object>>("sap.fe.core.controllerextensions.viewState.IViewStateContributor") &&
					control.applyNavigationParameters
				)
					promises.push(control.applyNavigationParameters(navParameter));
			});
		return promises;
	}

	@privateExtension()
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

	_setInitialStateApplied(): void {
		if (this._pInitialStateAppliedResolve) {
			const pInitialStateAppliedResolve = this._pInitialStateAppliedResolve;
			delete this._pInitialStateAppliedResolve;
			pInitialStateAppliedResolve();
		}
	}

	_getInitialStateApplied(): boolean {
		return !this._pInitialStateAppliedResolve;
	}

	_isStateEmptyForIAppStateNavType(viewState: Record<string, unknown> | undefined, navType: string): boolean {
		return (!viewState || Object.keys(viewState).length === 0) && navType == NavType.iAppState;
	}

	__isRootViewController(): boolean {
		const rootViewController = this.base.getView().getController();
		return (
			rootViewController.isA<NavContainerController>("sap.fe.core.rootView.NavContainer") ||
			rootViewController.isA<FclController>("sap.fe.core.rootView.Fcl")
		);
	}

	/**
	 * Hook to react before a state for given view is applied.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param aPromises Extensible array of promises to be resolved before continuing
	 * @param navigationType Navigation type responsible for the applying the state
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onBeforeStateApplied(aPromises: Promise<unknown>[], navigationType?: string): void {
		// to be overriden
	}

	/**
	 * Hook to react when state for given view was applied.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param aPromises Extensible array of promises to be resolved before continuing
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onAfterStateApplied(aPromises: Promise<unknown>): void {
		// to be overriden
	}

	/**
	 * Applying additional, not control related, states - is called only if navigation type is iAppState.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param oViewState The current view state
	 * @param aPromises Extensible array of promises to be resolved before continuing
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	applyAdditionalStates(oViewState: object, aPromises: Promise<unknown>): void {
		// to be overridden if needed
	}

	/**
	 * Apply navigation parameters is not called if the navigation type is iAppState
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 * @param oNavParameter The current navigation parameter
	 * @param aPromises Extensible array of promises to be resolved before continuing
	 * @protected
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	applyNavigationParameters(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		oNavParameter: NavigationParameter,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		aPromises: Promise<unknown>
	): void {
		// to be overridden if needed
	}

	/**
	 * Applying the given state to the given control.
	 * @param oControl The object to apply the given state
	 * @param oControlState The state for the given control
	 * @param [oNavParameters] The current navigation parameters
	 * @param [skipMerge] Whether merge should be skipped or not
	 * @returns Return a promise for async state handling
	 */
	@privateExtension()
	@finalExtension()
	async applyControlState(
		oControl: ManagedObject,
		oControlState: object,
		oNavParameters?: NavigationParameter,
		skipMerge?: boolean
	): Promise<void> {
		const aControlStateHandlers = this.getControlStateHandler(oControl);
		let oPromiseChain = Promise.resolve();
		aControlStateHandlers.forEach((mControlStateHandler) => {
			if (typeof mControlStateHandler.apply !== "function") {
				throw new Error(`controlStateHandler.apply is not a function for control: ${oControl.getMetadata().getName()}`);
			}
			oPromiseChain = oPromiseChain.then(mControlStateHandler.apply.bind(this, oControl, oControlState, oNavParameters, skipMerge));
		});
		return oPromiseChain;
	}

	@publicExtension()
	public updateAppStateDebounced(): void {
		if (this.updateAppStateTimer) {
			clearTimeout(this.updateAppStateTimer);
		}
		this.updateAppStateTimer = setTimeout(() => {
			this.base.getExtensionAPI().updateAppState();
		}, 200) as unknown as number;
	}

	/**
	 * Register a dedicated IViewStateContributor into the whole view state handling.
	 * @param stateContributor The ViewStateContributor to register
	 */
	registerStateContributor(stateContributor: ManagedObject & IViewStateContributor<unknown>): void {
		if (this.stateContributors.includes(stateContributor)) {
			// no need to register the same control again
			return;
		}
		this.stateContributors.push(stateContributor);
		if (this._currentViewState) {
			const controlKey = this.getStateKey(stateContributor);
			const controlState = this._currentViewState[controlKey];
			const navigationType = this.configOfStateApply?.navTypeParameters?.navigationType;
			const skipMerge = this.configOfStateApply?.skipMerge;
			if (controlState && controlState === this.configOfStateApply?.state?.[controlKey]) {
				// To check whether diffstate shuold be called or not to applyExternalState
				const shouldApplyDiffState =
					!this.invalidateInitialStateForApply.includes(stateContributor.getId()) &&
					!this.controlsVariantIdUnavailable.includes(stateContributor.getId()) &&
					navigationType !== NavType.hybrid &&
					skipMerge !== true;

				stateContributor.applyState(controlState, undefined, shouldApplyDiffState);
			} else {
				this.updateAppStateDebounced();
			}
		}
	}

	/**
	 * Deregister a dedicated IViewStateContributor from the whole view state handling.
	 * @param stateContributor The ViewStateContributor to deregister
	 */
	deregisterStateContributor(stateContributor: ManagedObject & IViewStateContributor<unknown>): void {
		const targetIndex = this.stateContributors.findIndex((contributor) => contributor == stateContributor);
		if (targetIndex !== -1) {
			this.stateContributors.splice(targetIndex, 1);
		}
	}

	getInterface(): this {
		return this;
	}

	// method to get the control state for mdc controls applying the delta logic
	_getControlState(controlStateKey: string, controlState: ControlState): ControlState {
		const initialControlStatesMapper = this.initialControlStatesMapper;
		if (Object.keys(initialControlStatesMapper).length > 0 && initialControlStatesMapper[controlStateKey]) {
			if (Object.keys(initialControlStatesMapper[controlStateKey] as object).length === 0) {
				initialControlStatesMapper[controlStateKey] = { ...controlState };
			}
			return { fullState: controlState as object, initialState: initialControlStatesMapper[controlStateKey] as object };
		}
		return controlState;
	}

	//method to store the initial states for delta computation of mdc controls
	_setInitialStatesForDeltaCompute = async (variantManagement?: VariantManagement): Promise<void> => {
		try {
			const adaptControls = this.viewStateControls;

			const externalStatePromises: Promise<object>[] = [];
			const controlStateKey: string[] = [];
			let initialControlStates: object[] = [];
			const variantControls: string[] = variantManagement?.getFor() ?? [];

			this.updateInitialState(variantControls);

			await Promise.all(
				adaptControls
					.filter(function (control) {
						return (
							control &&
							(!variantManagement || variantControls.includes((control as Control).getId())) &&
							((control as BaseObject).isA("sap.ui.mdc.Table") ||
								(control as BaseObject).isA("sap.ui.mdc.FilterBar") ||
								(control as BaseObject).isA("sap.ui.mdc.Chart"))
						);
					})
					.map(async (control) => {
						if (variantManagement) {
							this._addEventListenersToVariantManagement(variantManagement, variantControls);
						}

						const externalStatePromise = (await getStateUtil()).retrieveExternalState(control as MDCControl);
						externalStatePromises.push(externalStatePromise);
						controlStateKey.push(this.getStateKey(control));
					})
			);

			initialControlStates = await Promise.all(externalStatePromises);
			initialControlStates.forEach((initialControlState: object, i: number) => {
				this.initialControlStatesMapper[controlStateKey[i]] = initialControlState;
			});
		} catch (e: unknown) {
			Log.error(e as string);
		}
	};

	// Attach event to save and select of Variant Management to update the initial Control States on variant change
	_addEventListenersToVariantManagement(variantManagement: VariantManagement, variantControls: string[]): void {
		const oPayload = { variantManagedControls: variantControls };
		const fnEvent = (): void => {
			this._updateInitialStatesOnVariantChange(variantControls);
		};
		variantManagement.attachSave(oPayload, fnEvent, {});
		variantManagement.attachSelect(oPayload, fnEvent, {});
	}

	_updateInitialStatesOnVariantChange(vmAssociatedControlsToReset: string[]): void {
		const initialControlStatesMapper = this.initialControlStatesMapper;
		Object.keys(initialControlStatesMapper).forEach((controlKey) => {
			for (const vmAssociatedcontrolKey of vmAssociatedControlsToReset) {
				if (vmAssociatedcontrolKey.includes(controlKey)) {
					initialControlStatesMapper[controlKey] = {};
				}
			}
		});
		this.updateInitialState(vmAssociatedControlsToReset);
	}

	/**
	 * Updates the initial state of the specified variant controls.
	 * @param variantControls An array of control IDs for which the initial state needs to be updated.
	 * @returns A promise that resolves when the initial state update is complete.
	 */
	async updateInitialState(variantControls: string[]): Promise<void> {
		const viewControls: (ManagedObject | undefined)[] = this.stateContributors;
		await Promise.all(
			viewControls.map(async (control) => {
				const controlId: string = control?.getId() as string;
				if (
					variantControls.includes(controlId) &&
					control?.isA<IViewStateContributor<object>>("sap.fe.core.controllerextensions.viewState.IViewStateContributor") &&
					control.setInitialState
				) {
					await control.setInitialState();
				}
			})
		);
	}

	_isInitialStatesApplicable(
		initialState: object | undefined,
		control: FilterBar | MDCTable,
		skipMerge: boolean | undefined,
		isNavHybrid?: boolean
	): boolean {
		return (
			!!initialState &&
			!this.invalidateInitialStateForApply.includes(control.getId()) &&
			!this.controlsVariantIdUnavailable.includes(control.getId()) &&
			(isNavHybrid ?? true) &&
			skipMerge !== true
		);
	}
}

export default ViewState;

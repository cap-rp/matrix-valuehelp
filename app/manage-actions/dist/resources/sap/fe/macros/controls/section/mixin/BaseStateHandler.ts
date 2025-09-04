import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type { ControlState as ViewStateControlState } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributorMixin from "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin";
import { requireDependencies } from "sap/fe/core/helpers/LoaderUtils";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";

type StateContributor = Control & {
	applyStateHandler?: string;
	retrieveStateHandler?: string;
};
type HandlerType = "apply" | "retrieve";

export default class BaseStateHandler<CtrlState> extends IViewStateContributorMixin<CtrlState> {
	/**
	 * Store the state to be applied until the section is ready.
	 */
	_stateToApply?: CtrlState;

	/**
	 * Apply state is pending.
	 */
	_applyStatePending?: boolean;

	/**
	 * Retrieve state is pending.
	 */
	_retrieveStatePending?: boolean;

	/**
	 * Promise that resolves on state handlers' creation.
	 */
	_stateHandlersAvailable?: Promise<void>;

	/**
	 * The instance of the apply-state handler provided by the control user.
	 */
	_applyHandler?: (this: ExtensionAPI, control: StateContributor, state?: CtrlState) => void;

	/**
	 * The instance of the retrieve-state handler provided by the control user.
	 */
	_retrieveHandler?: (this: ExtensionAPI, control: StateContributor) => CtrlState;

	setupMixin(baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
		super.setupMixin(baseClass);
		const baseInit = baseClass.prototype.init;
		baseClass.prototype.init = function (this: StateContributor & BaseStateHandler<CtrlState>): void {
			baseInit?.call(this);

			// The control is ready for state interactions if the blocks are available,
			// Else we wait for blocks to be added.
			this.setupStateInteractionsForLazyRendering();
		};
	}

	/**
	 * Listen to subsections rendering to enable state interactions.
	 */
	setupStateInteractionsForLazyRendering(this: StateContributor & BaseStateHandler<CtrlState>): void {}

	isBlocksAvailable(this: StateContributor & BaseStateHandler<CtrlState>): boolean {
		return false;
	}

	/**
	 * Register subsection delegate to enable state interactions.
	 * We use onBeforeRendering, as when a parent is set for a newly available block, the subsection is rerendered.
	 * @param subSection Subsection control
	 */
	registerSubSectionDelegate(this: StateContributor & BaseStateHandler<CtrlState>, subSection: ObjectPageSubSection): void {
		const eventDelegates = {
			onBeforeRendering: (): void => {
				if (this.checkForStateInteractions()) {
					subSection.removeEventDelegate(eventDelegates);
				}
			}
		};
		subSection.addEventDelegate(eventDelegates);
	}

	/**
	 * Hook to set the initial state.
	 */
	async setInitialState(this: StateContributor & BaseStateHandler<CtrlState>): Promise<void> {}

	/**
	 * Retrieve the state to store as part of the view state.
	 * @returns StateContributor state
	 */
	async retrieveState(this: StateContributor & BaseStateHandler<CtrlState>): Promise<CtrlState | null> {
		await this._stateHandlersAvailable;
		if (this._retrieveHandler) {
			const blocksAvailable = this.isBlocksAvailable();
			if (blocksAvailable) {
				// blocks are available, we carry on with the retrieve state
				this._retrieveStatePending = false;
				const view = CommonUtils.getTargetView(this);
				const extensionAPI = view.getController().getExtensionAPI();
				return this._retrieveHandler.call(extensionAPI, this);
			} else if (this._applyStatePending) {
				// blocks are not available but applyState is already pending, hence we return the state that is on hold.
				this._retrieveStatePending = false;
				return this._stateToApply ?? null;
			} else {
				// blocks are not available hence we sent the retrieve state to pending.
				this._retrieveStatePending = true;
			}
		}
		return null;
	}

	/**
	 * Apply state to the contributor.
	 * @param getControlState Function to fetch the state to apply.
	 * @returns Promise that resolves on state application.
	 */
	async applyLegacyState(
		this: StateContributor & BaseStateHandler<CtrlState>,
		getControlState: (control: ManagedObject) => ViewStateControlState
	): Promise<void> {
		const controlState = getControlState(this) as CtrlState;
		return this.applyState(controlState);
	}

	/**
	 * Apply state to the contributor.
	 * @param controlState State to apply
	 * @returns Promise that resolves on state application.
	 */
	async applyState(this: StateContributor & BaseStateHandler<CtrlState>, controlState?: CtrlState): Promise<void> {
		await this._stateHandlersAvailable;
		if (this._applyHandler) {
			const blocksAvailable = this.isBlocksAvailable();
			if (blocksAvailable) {
				// blocks are available, we carry on with the apply state
				const view = CommonUtils.getTargetView(this);
				const extensionAPI = view.getController().getExtensionAPI();
				this.resetStateToApply();
				return this._applyHandler?.call(extensionAPI, this, controlState);
			} else {
				// blocks are not available hence we sent the apply state to pending.
				this._stateToApply = controlState;
				this._applyStatePending = true;
			}
		}
	}

	/**
	 * Trigger state interactions.
	 */
	async triggerStateInteractions(this: StateContributor & BaseStateHandler<CtrlState>): Promise<void> {
		await this._stateHandlersAvailable;
		const retrieveIsRelevant = this._retrieveHandler && this._retrieveStatePending;
		const applyIsRelevant = this._applyHandler && this._applyStatePending;
		if (retrieveIsRelevant) {
			if (applyIsRelevant) {
				// Both retrieve and apply are pending
				this.applyState(this._stateToApply);
			}
			this._retrieveStatePending = false;
			const view = CommonUtils.getTargetView(this);
			const extensionAPI = view.getController().getExtensionAPI();
			// appState update would call the retrieveState.
			await extensionAPI.updateAppState();
		} else if (applyIsRelevant) {
			this.applyState(this._stateToApply);
		}
	}

	/**
	 * Reset the state to apply.
	 */
	resetStateToApply(this: StateContributor & BaseStateHandler<CtrlState>): void {
		this._stateToApply = undefined;
		this._applyStatePending = false;
	}

	/**
	 * Check for state interactions to trigger.
	 * @returns Boolean true if any pending state interactions are executed.
	 */
	checkForStateInteractions(this: StateContributor & BaseStateHandler<CtrlState>): boolean {
		const blocksAvailable = this.isBlocksAvailable();
		if (blocksAvailable) {
			this.triggerStateInteractions();
			return true;
		}
		return false;
	}

	/**
	 * Create an instance of a state handler from a function's path.
	 * @param stateHandler Path to the state handler.
	 * @returns Handler instance to use for state handling.
	 */
	async getStateHandlerInstance(
		this: StateContributor & BaseStateHandler<CtrlState>,
		stateHandler?: string
	): Promise<(() => unknown) | undefined> {
		try {
			if (stateHandler) {
				const handlerModuleName = this.getModulePath(stateHandler);
				const modules = (await requireDependencies([handlerModuleName])) as Record<string, (() => {}) | undefined>[];
				const handlerName = stateHandler.substring(stateHandler.lastIndexOf(".") + 1);
				const handlerInstance = modules[0][handlerName];
				if (handlerInstance) {
					return handlerInstance;
				} else {
					throw new Error("handler not found");
				}
			}
		} catch (err: unknown) {
			Log.warning(`'${this.getId()}' control's state handler '${stateHandler}' couldn't be resolved: ${err}`);
		}
	}

	/**
	 * Set the instance of the state handler.
	 * @param handlerType Apply or Retrieve.
	 * @param stateHandler Path to the handler instance.
	 */
	async _setStateHandler(
		this: StateContributor & BaseStateHandler<CtrlState>,
		handlerType: HandlerType,
		stateHandler?: string
	): Promise<void> {
		this[`_${handlerType}Handler`] = (await this.getStateHandlerInstance(stateHandler)) as typeof handlerType extends "apply"
			? typeof this._applyHandler
			: typeof this._retrieveHandler;
		this[`${handlerType}StateHandler`] = stateHandler;
	}

	/**
	 * Set the apply-state handler.
	 * @param applyStateHandler Path to the instance of the apply-state handler.
	 * @returns Promise
	 */
	async setApplyStateHandler(this: StateContributor & BaseStateHandler<CtrlState>, applyStateHandler?: string): Promise<void> {
		this._stateHandlersAvailable = (this._stateHandlersAvailable || Promise.resolve()).then(async () => {
			return this._setStateHandler("apply", applyStateHandler);
		});
		return this._stateHandlersAvailable;
	}

	/**
	 * Set the retrieve-state handler.
	 * @param retrieveStateHandler Path to the instance of the retrieve-state handler.
	 * @returns Promise
	 */
	async setRetrieveStateHandler(this: StateContributor & BaseStateHandler<CtrlState>, retrieveStateHandler?: string): Promise<void> {
		this._stateHandlersAvailable = (this._stateHandlersAvailable || Promise.resolve()).then(async () => {
			return this._setStateHandler("retrieve", retrieveStateHandler);
		});
		return this._stateHandlersAvailable;
	}

	/**
	 * Get the module path of the function.
	 * @param handlerPath Path to the handler instance.
	 * @returns Module Path
	 */
	getModulePath(handlerPath: string): string {
		return handlerPath.substring(0, handlerPath.lastIndexOf(".")).replace(/\./g, "/");
	}
}

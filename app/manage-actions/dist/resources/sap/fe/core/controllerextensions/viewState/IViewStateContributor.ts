import type { ControlState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type ManagedObject from "sap/ui/base/ManagedObject";

export default abstract class IViewStateContributor<StateDefinition> {
	abstract retrieveState(): Promise<StateDefinition | null> | StateDefinition | null;

	abstract applyState(
		state: StateDefinition,
		oNavParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void> | void;

	/**
	 * Sets the initial state of the control by retrieving the external state at the time of apply.
	 * Also updates the initial state of the specified variant controls
	 * @returns A promise that resolves when the initial state has been set.
	 */
	abstract setInitialState?(): Promise<void>;

	/**
	 * Abstract method to apply legacy state to a view.
	 * @abstract
	 * @param {Function} [getContrilState] Optional function to get the control state, accepting a `ManagedObject` and returning a `ControlState`.
	 * @param {NavigationParameter} [oNavParameters] Optional navigation parameters that might influence the state application.
	 * @param {boolean} [shouldApplyDiffState] Optional flag indicating whether a differential state application should be performed.
	 * @returns {Promise<void>} - A promise that resolves when the state has been applied.
	 */
	abstract applyLegacyState?(
		getControlState?: (control: ManagedObject) => ControlState,
		oNavParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void>;

	applyNavigationParameters?(navigationParameter: NavigationParameter): Promise<void>;
}

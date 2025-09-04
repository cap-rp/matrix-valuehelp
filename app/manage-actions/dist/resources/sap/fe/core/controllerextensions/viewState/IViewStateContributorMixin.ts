import type { FEView } from "sap/fe/core/BaseController";

import type { IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { ControlState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { ManagedObject$ModelContextChangeEvent } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";

export default abstract class IViewStateContributorMixin<StateDefinition>
	extends IViewStateContributor<StateDefinition>
	implements IInterfaceWithMixin
{
	static interfaceName = "sap.fe.core.controllerextensions.viewState.IViewStateContributor";

	getInterfaceName(): string {
		return IViewStateContributorMixin.interfaceName;
	}

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
		getContrilState?: (control: ManagedObject) => ControlState,
		oNavParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void>;

	setupMixin(baseClass: Function): void {
		function _getOwner(inControl: Control): TemplateComponent | undefined {
			let owner = Component.getOwnerComponentFor(inControl);
			let control: Control | undefined = inControl;
			while (!owner && control && !control.isA<FEView>("sap.ui.core.mvc.View")) {
				control = control.getParent() as Control | undefined;
				if (control) {
					owner = Component.getOwnerComponentFor(control);
				}
			}
			if (owner?.isA<TemplateComponent>("sap.fe.core.TemplateComponent")) {
				return owner;
			}
		}

		function getPageController(inControl: Control): PageController | undefined {
			return _getOwner(inControl)?.getRootController();
		}

		function _stateContributorChangeEventHandler(ev: ManagedObject$ModelContextChangeEvent): void {
			const pageControllerInHandler = getPageController(ev.getSource());
			if (pageControllerInHandler) {
				pageControllerInHandler?.viewState?.registerStateContributor(ev.getSource());
				ev.getSource().detachEvent("modelContextChange", _stateContributorChangeEventHandler);
			}
		}

		const baseInit = baseClass.prototype.init;
		baseClass.prototype.init = function (): void {
			baseInit?.call(this);
			const pageController = getPageController(this);
			if (!pageController) {
				this.attachEvent("modelContextChange", _stateContributorChangeEventHandler);
			} else {
				pageController.viewState.registerStateContributor(this as unknown as ManagedObject & IViewStateContributor<unknown>);
			}
		};
		const baseDestroy = baseClass.prototype.destroy;
		baseClass.prototype.destroy = function (): void {
			getPageController(this)?.viewState?.deregisterStateContributor(
				this as unknown as ManagedObject & IViewStateContributor<unknown>
			);
			baseDestroy?.call(this);
		};
	}
}

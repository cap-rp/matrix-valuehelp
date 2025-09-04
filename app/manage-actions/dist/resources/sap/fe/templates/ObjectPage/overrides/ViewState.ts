import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ViewState from "sap/fe/core/controllerextensions/ViewState";
import { type ControlStateHandler } from "sap/fe/core/controllerextensions/ViewState";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import CoreLibrary from "sap/fe/core/library";
import type ObjectPageController from "sap/fe/templates/ObjectPage/ObjectPageController.controller";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageSection from "sap/uxap/ObjectPageSection";
import type { MetaModelNavProperty } from "types/metamodel_types";

const VariantManagement = CoreLibrary.VariantManagement;
export type ObjectPageState = { selectedSection: string | null };

const opControlHandlers = {
	retrieve: function (oOPLayout: ObjectPageLayout): ObjectPageState {
		return {
			selectedSection: oOPLayout.getSelectedSection()
		};
	},
	apply: function (this: ViewState, opLayout: ObjectPageLayout, controlState?: { selectedSection: string | null }): void {
		const selectedSection = controlState?.selectedSection;
		if (selectedSection) {
			const opSectionToSelect = opLayout.getSections().find((section: ObjectPageSection) => section.getId() === selectedSection);
			if (opSectionToSelect?.getVisible() === false) {
				const controller = this.getView().getController() as ObjectPageController;
				controller.pageReady
					.waitPageReady()
					.then(function (): void {
						opLayout.setSelectedSection(selectedSection);
						return undefined;
					})
					.catch((err: unknown): void => {
						const message = err instanceof Error ? err.message : String(err);
						Log.error(`FE V4 : OP : ViewState : ObjectPageLayout state couldn't be applied : ${message}`);
					});
			} else {
				opLayout.setSelectedSection(selectedSection);
			}
		}
	},
	refreshBinding: function (oOPLayout: ObjectPageLayout): void {
		const oBindingContext = oOPLayout.getBindingContext() as ODataV4Context | undefined;
		const oBinding = oBindingContext && oBindingContext.getBinding();
		if (oBinding) {
			const sMetaPath = ModelHelper.getMetaPathForContext(oBindingContext);
			const sStrategy = KeepAliveHelper.getControlRefreshStrategyForContextPath(oOPLayout, sMetaPath);
			if (sStrategy === "self") {
				// Refresh main context and 1-1 navigation properties or OP
				const oModel = oBindingContext.getModel(),
					oMetaModel = oModel.getMetaModel(),
					oNavigationProperties: Record<string, MetaModelNavProperty> =
						(CommonUtils.getContextPathProperties(oMetaModel, sMetaPath, {
							$kind: "NavigationProperty"
						}) as Record<string, MetaModelNavProperty>) || {},
					aNavPropertiesToRequest = Object.keys(oNavigationProperties).reduce(function (
						aPrev: { $NavigationPropertyPath: string }[],
						sNavProp: string
					) {
						if (oNavigationProperties[sNavProp].$isCollection !== true) {
							aPrev.push({ $NavigationPropertyPath: sNavProp });
						}
						return aPrev;
					}, []),
					aProperties: ({ $NavigationPropertyPath: string } | { $PropertyPath: string })[] = [{ $PropertyPath: "*" }],
					sGroupId = oBinding.getGroupId();

				oBindingContext.requestSideEffects(aProperties.concat(aNavPropertiesToRequest), sGroupId);
			} else if (sStrategy === "includingDependents") {
				// Complete refresh
				oBinding.refresh();
			}
		} else {
			Log.info(`ObjectPage: ${oOPLayout.getId()} was not refreshed. No binding found!`);
		}
	}
};

const ViewStateExtensionOverride = {
	_getObjectPageLayout: function (this: ViewState): ObjectPageLayout {
		const view = this.getView();
		const controller = view.getController() as ObjectPageController;
		return controller._getObjectPageLayoutControl();
	},

	/**
	 * Get the state handler for ObjectPageLayout in view.
	 * @param control The control for state interaction
	 * @returns State handler
	 */
	_getOPStateHandler: function (
		this: ViewState,
		control: ManagedObject
	): ControlStateHandler<ObjectPageLayout, ObjectPageState> | undefined {
		const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
		if (viewOP === control) {
			return {
				retrieve: opControlHandlers.retrieve,
				apply: opControlHandlers.apply
			};
		}
	},

	/**
	 * Get the refresh handler for ObjectPageLayout in view.
	 * @param control The control being refreshed
	 * @returns Refresh handler
	 */
	_getOPRefreshHandler: function (
		this: ViewState,
		control: ManagedObject
	): ControlStateHandler<ObjectPageLayout, ObjectPageState> | undefined {
		const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
		if (viewOP === control) {
			return {
				refreshBinding: opControlHandlers.refreshBinding
			};
		}
	},

	/**
	 * Pass the state handlers of object page view according to the control in concern.
	 * @param control The control for state interaction
	 * @param controlStateHandlers State handlers
	 */
	adaptControlStateHandler: function (
		this: ViewState,
		control: ManagedObject,
		controlStateHandlers: ControlStateHandler<ObjectPageLayout, ObjectPageState>[]
	): void {
		const opStateHandler = ViewStateExtensionOverride._getOPStateHandler.call(this, control);
		if (opStateHandler) {
			controlStateHandlers.push(opStateHandler);
		}
	},

	/**
	 * Pass the refresh handlers of object page view according to the control being refreshed.
	 * @param control The control being refreshed
	 * @param controlRefreshHandlers Refresh handlers
	 */
	adaptBindingRefreshHandler: function (
		this: ViewState,
		control: ManagedObject,
		controlRefreshHandlers: ControlStateHandler<ObjectPageLayout, ObjectPageState>
	): void {
		const opStateHandler = ViewStateExtensionOverride._getOPRefreshHandler.call(this, control);
		if (opStateHandler) {
		    controlRefreshHandlers.refreshBinding = opStateHandler.refreshBinding;
		}
	},

	applyInitialStateOnly: function (): boolean {
		return false;
	},
	adaptStateControls: function (this: ViewState, aStateControls: Control[]): void {
		const oView = this.base.getView(),
			oViewData = oView.getViewData();
		switch (oViewData.variantManagement) {
			case VariantManagement.Control:
				break;
			case VariantManagement.Page:
			case VariantManagement.None:
				break;
			default:
				throw new Error(`unhandled variant setting: ${oViewData.variantManagement}`);
		}

		aStateControls.push(oView.byId("fe::ObjectPage") as Control);
	},
	adaptBindingRefreshControls: function (this: ViewState, aControls: Control[]): Control[] {
		const oView = this.base.getView(),
			sRefreshStrategy = KeepAliveHelper.getViewRefreshInfo(oView),
			oController = oView.getController();
		let aControlsToRefresh: Control[] = [];

		if (sRefreshStrategy) {
			const oObjectPageControl = (oController as ObjectPageController)._getObjectPageLayoutControl();
			aControlsToRefresh.push(oObjectPageControl);
		}
		if (sRefreshStrategy !== "includingDependents") {
			const aViewControls = (oController as ObjectPageController)._findTables();
			aControlsToRefresh = aControlsToRefresh.concat(KeepAliveHelper.getControlsForRefresh(oView, aViewControls) || []);
		}
		return aControlsToRefresh.reduce(function (aPrevControls, oControl) {
			if (!aPrevControls.includes(oControl)) {
				aPrevControls.push(oControl);
			}
			return aPrevControls;
		}, aControls);
	}
};

export default ViewStateExtensionOverride;

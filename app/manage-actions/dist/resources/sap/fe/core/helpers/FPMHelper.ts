import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type UI5Event from "sap/ui/base/Event";
import type EventProvider from "sap/ui/base/EventProvider";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import type MdcTable from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

const FPMHelper = {
	loadModuleAndCallMethod: async function (
		module: string,
		method: string,
		source: View | UI5Event<{}, Control>,
		...args: unknown[]
	): Promise<unknown> {
		return new Promise(function (resolve: (value: unknown) => void) {
			let extensionAPI: ExtensionAPI | undefined;
			let view: View;
			if (source.isA<UI5Event>("sap.ui.base.Event")) {
				view = CommonUtils.getTargetView(source.getSource());
			} else {
				view = source;
			}

			if (
				view.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" ||
				view.getControllerName() === "sap.fe.templates.ListReport.ListReportController"
			) {
				extensionAPI = (view as FEView).getController().getExtensionAPI();
			}

			if (module.startsWith("/extension/")) {
				const fnTarget = ObjectPath.get(module.replace(/\//g, ".").substring(1), extensionAPI);
				resolve(fnTarget[method](...args));
			} else {
				sap.ui.require([module], function (loadedModule: Record<string, Function>) {
					// - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
					// - we provide the context as API, maybe if needed further properties
					resolve(loadedModule[method].bind(extensionAPI)(...args));
				});
			}
		});
	},

	actionWrapper: async function (
		oEvent: UI5Event,
		sModule?: string,
		sMethod?: string,
		oParameters?: { contexts?: Context[] }
	): Promise<unknown> {
		if (!sModule || !sMethod) {
			Log.debug("Both the module and the method must be defined to execute a custom action");
			return;
		}

		//The source would be command execution, in case a command is defined for the action in the manifest.
		const oSource = (oEvent.getSource ? oEvent.getSource() : (oEvent as { oSource?: EventProvider }).oSource) as Control,
			oView = CommonUtils.getTargetView(oSource),
			oBindingContext = oSource.getBindingContext()!;

		let listBinding: ODataListBinding | undefined;
		let aSelectedContexts: Context[];

		if (oParameters !== undefined) {
			aSelectedContexts = oParameters.contexts || [];
		} else if (oBindingContext !== undefined) {
			aSelectedContexts = [oBindingContext];
		} else {
			aSelectedContexts = [];
		}
		if (oSource.getParent()?.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction") || oSource.getParent()?.isA("sap.m.Menu")) {
			listBinding = FPMHelper.getMdcTable(oSource)?.getRowBinding();
		}

		return FPMHelper.loadModuleAndCallMethod(sModule, sMethod, oView, oBindingContext, aSelectedContexts, listBinding);
	},
	getMdcTable: function (control: UI5Element): MdcTable | null | undefined {
		const parent = control.getParent();
		if (!parent || parent.isA<MdcTable>("sap.ui.mdc.Table")) {
			return parent;
		}
		return FPMHelper.getMdcTable(parent as Control);
	},
	validationWrapper: async function (
		sModule: string,
		sMethod: string,
		oValidationContexts: Record<string, unknown>,
		oView: View,
		oBindingContext: Context
	): Promise<{ messageTarget?: string; messageText: string }[]> {
		return FPMHelper.loadModuleAndCallMethod(sModule, sMethod, oView, oBindingContext, oValidationContexts) as Promise<
			{ messageTarget?: string; messageText: string }[]
		>;
	},
	/**
	 * Returns an external custom function defined either in a custom controller extension or in an external module.
	 * @param moduleName The external module name, or /extension/<path to the custom controller extension module>
	 * @param functionName The name of the function
	 * @param source A control in the view or an event triggered by a control in the view
	 * @returns The function (or undefined if it couldn't be found)
	 */
	getCustomFunction<FunctionType>(
		moduleName: string,
		functionName: string,
		source: Control | UI5Event<{}, Control>
	): FunctionType | undefined {
		let control: Control;
		if (source.isA<UI5Event>("sap.ui.base.Event")) {
			control = source.getSource();
		} else {
			control = source;
		}
		const view = CommonUtils.getTargetView(control);
		const extensionAPI = view.getController().getExtensionAPI();

		let customFunction: FunctionType | undefined;

		if (moduleName.startsWith("/extension/")) {
			const controllerExt = ObjectPath.get(moduleName.replace(/\//g, ".").substring(1), extensionAPI);
			customFunction = controllerExt ? controllerExt[functionName] : undefined;
		} else {
			const module = sap.ui.require(moduleName);
			customFunction = module ? module[functionName]?.bind(extensionAPI) : undefined;
		}

		if (!customFunction) {
			Log.error(`Couldn't find method ${functionName} in ${moduleName}`);
		}
		return customFunction;
	}
};

export default FPMHelper;

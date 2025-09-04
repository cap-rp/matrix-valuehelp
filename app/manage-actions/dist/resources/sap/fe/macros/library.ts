import Log from "sap/base/Log";
import "sap/f/library";
import "sap/fe/controls/library";
import AppComponent from "sap/fe/core/AppComponent";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import type { IVisitorCallback } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import "sap/fe/core/library";
import "sap/fe/macros/coreUI/factory";
import FilterOperatorUtils from "sap/fe/macros/filter/FilterOperatorUtils";
import "sap/fe/macros/filter/type/MultiValue";
import "sap/fe/macros/filter/type/Range";
import "sap/fe/macros/formatters/TableFormatter";
import "sap/fe/macros/macroLibrary";
import DataType from "sap/ui/base/DataType";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Fragment from "sap/ui/core/Fragment";
import Library from "sap/ui/core/Lib";
import "sap/ui/core/XMLTemplateProcessor";
import "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import "sap/ui/mdc/field/ConditionsType";
import "sap/ui/mdc/library";
import "sap/ui/unified/library";

/**
 * Library containing the building blocks for SAP Fiori elements.
 * @namespace
 * @public
 */
export const macrosNamespace = "sap.fe.macros";

// library dependencies
const thisLib = Library.init({
	name: "sap.fe.macros",
	apiVersion: 2,
	dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.fe.controls", "sap.m", "sap.f"],
	types: ["sap.fe.macros.NavigationType"],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true,
	extensions: {
		flChangeHandlers: {
			"sap.fe.macros.controls.FilterBar": "sap/ui/mdc/flexibility/FilterBar",
			"sap.fe.macros.controls.Section": "sap/uxap/flexibility/ObjectPageSection",
			"sap.fe.macros.controls.section.SubSection": "sap/uxap/flexibility/ObjectPageSubSection"
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export enum NavigationType {
	/**
	 * For External Navigation
	 * @public
	 */
	External = "External",

	/**
	 * For In-Page Navigation
	 * @public
	 */
	InPage = "InPage",

	/**
	 * For No Navigation
	 * @public
	 */
	None = "None"
}

thisLib.NavigationType = NavigationType;
DataType.registerEnum("sap.fe.macros.NavigationType", thisLib.NavigationType);
Fragment.registerType("CUSTOM", {
	load: (Fragment as { getType?: Function }).getType?.("XML").load,
	init: async function (
		mSettings: { containingView: View; id: string; childCustomData: Record<string, string> | undefined; contextPath?: string },
		...args: unknown[]
	) {
		const currentController = mSettings.containingView.getController() as PageController;
		let targetControllerExtension: PageController | ExtensionAPI = currentController;
		if (currentController && !currentController.isA<ExtensionAPI>("sap.fe.core.ExtensionAPI")) {
			targetControllerExtension = currentController.getExtensionAPI(mSettings.id);
		}
		mSettings.containingView = {
			oController: targetControllerExtension
		} as unknown as View;
		const childCustomData = mSettings.childCustomData ?? undefined;
		const contextPath = mSettings.contextPath;
		delete mSettings.childCustomData;
		delete mSettings.contextPath;
		(this as { _fnSettingsPreprocessor?: Function })._fnSettingsPreprocessor = function (
			this: Control,
			controlSettings: {
				contextPath: unknown;
			}
		): unknown {
			if (this.getMetadata().hasProperty("contextPath")) {
				controlSettings.contextPath ??= contextPath;
			}

			return controlSettings;
		};
		const result = await (Fragment as unknown as { getType: Function }).getType("XML").init.apply(this, [mSettings, args]);
		if (childCustomData && result?.isA("sap.ui.core.Control")) {
			for (const customDataKey in childCustomData) {
				// UI5 adds 'bindingString' when its an adaptation project (SNOW: DINC0143515), which results in errors later
				if (customDataKey === "bindingString") {
					delete childCustomData[customDataKey];
					continue;
				}
				(result as Control).addCustomData(new CustomData({ key: customDataKey, value: childCustomData[customDataKey] }));
			}
		}

		return result;
	}
});

Fragment.registerType("SCOPEDFEFRAGMENT", {
	load: (Fragment as { getType?: Function }).getType?.("XML").load,
	init: function (
		mSettings: { containingView: View; id: string; childCustomData: Record<string, string> | undefined; contextPath?: string },
		...args: unknown[]
	) {
		const contextPath = mSettings.contextPath;
		delete mSettings.contextPath;
		(this as { _fnSettingsPreprocessor?: Function })._fnSettingsPreprocessor = function (
			this: Control,
			controlSettings: {
				contextPath: unknown;
			}
		): unknown {
			if (this.getMetadata().hasProperty("contextPath")) {
				controlSettings.contextPath ??= contextPath;
			}

			return controlSettings;
		};
		return (Fragment as unknown as { getType: Function }).getType("XML").init.apply(this, [mSettings, args]);
	}
});

Library.load({ name: "sap.fe.macros" })
	.then(() => {
		AppComponent.registerInstanceDependentProcessForStartUp(FilterOperatorUtils.processCustomFilterOperators);
		return;
	})
	.catch((error: unknown) => {
		Log.error(`Error loading 'sap.fe.macros`, error as Error | string);
	});

const rewriteNodes = function (parentNamespace: string, parentName: string, childNamespace: string, childName: string): Function {
	// eslint-disable-next-line @typescript-eslint/require-await
	return async (oNode: Element, _oVisitor: IVisitorCallback): Promise<void> => {
		if (oNode.hasChildNodes() && oNode.attributes.length === 0) {
			await _oVisitor.visitChildNodes(oNode);
			return; // In case a node has children and no attribute it's already formatted properly
		}
		const newNode = document.createElementNS(childNamespace, childName);
		const newParent = document.createElementNS(parentNamespace, parentName);
		const attributeNames = oNode.getAttributeNames();
		if (attributeNames.length > 0) {
			// Only consider case where we have attributes, meaning the old syntax
			for (const attributeName of attributeNames) {
				newNode.setAttribute(attributeName, oNode.getAttribute(attributeName)!);
			}
			newParent.appendChild(newNode);
		}
		await _oVisitor.visitChildNodes(newParent);
		oNode.replaceWith(newParent);
	};
};

// Rewrite the old shareOptions to the new one
XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:shareOptions", "sap.fe.macros.share", "macroShare:ShareOptions"),
	"sap.fe.macros",
	"shareOptions"
);

XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"),
	"sap.fe.macros",
	"formatOptions"
);

XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"),
	"sap.m",
	"formatOptions"
);

export default thisLib;

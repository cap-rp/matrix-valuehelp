import "sap/f/library";
import "sap/fe/core/library";
import "sap/fe/macros/library";
import MultipleModeBlock from "sap/fe/templates/ListReport/view/fragments/MultipleMode.block";
import DataType from "sap/ui/base/DataType";
import Library from "sap/ui/core/Lib";
import "sap/ui/core/library";
import "sap/ui/fl/library";
/**
 * Library providing the official templates supported by SAP Fiori elements.
 * @namespace
 * @public
 */
export const templatesNamespace = "sap.fe.templates";

/**
 * @namespace
 * @public
 */
export const templatesLRNamespace = "sap.fe.templates.ListReport";

/**
 * @namespace
 * @public
 */
export const templatesOPNamespace = "sap.fe.templates.ObjectPage";

const thisLib = Library.init({
	name: "sap.fe.templates",
	apiVersion: 2,
	dependencies: ["sap.ui.core", "sap.fe.core", "sap.fe.macros", "sap.m", "sap.f", "sap.ui.mdc", "sap.ui.fl"],
	types: ["sap.fe.templates.ObjectPage.SectionLayout"],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

if (!thisLib.ObjectPage) {
	thisLib.ObjectPage = {};
}
thisLib.ObjectPage.SectionLayout = {
	/**
	 * All sections are shown in one page
	 * @public
	 */
	Page: "Page",

	/**
	 * All top-level sections are shown in an own tab
	 * @public
	 */
	Tabs: "Tabs"
};
DataType.registerEnum("sap.fe.templates.ObjectPage.SectionLayout", thisLib.ObjectPage.SectionLayout);

MultipleModeBlock.register();
export default thisLib;

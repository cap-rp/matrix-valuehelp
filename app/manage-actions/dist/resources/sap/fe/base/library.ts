import Library from "sap/ui/core/Lib";
/**
 * Library providing the base functionality of the runtime for SAP Fiori elements for OData V4.
 * @namespace
 * @public
 */
export const feBaseNamespace = "sap.fe.base";

const thisLib = Library.init({
	name: "sap.fe.base",
	apiVersion: 2,
	dependencies: ["sap.ui.core"],
	types: [],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export default thisLib;

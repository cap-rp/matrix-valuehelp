import "sap/fe/base/library";
import ShortcutExplanationProvider from "sap/fe/controls/shortcuts/ShortcutExplanationProvider";
import "sap/m/library";
import Library from "sap/ui/core/Lib";
import "sap/ui/unified/library";
/**
 * Library providing a set of controls for the Fiori Elements application.
 * Those controls might also be shared with other applications (v2 for instance)
 * @namespace
 */
export const feControlsNamespace = "sap.fe.controls";

const thisLib = Library.init({
	name: "sap.fe.controls",
	apiVersion: 2,
	dependencies: ["sap.ui.core", "sap.fe.base", "sap.m", "sap.ui.unified"],
	types: [],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: false
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

ShortcutExplanationProvider.getInstance();

export default thisLib;

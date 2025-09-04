import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import UI5Element from "sap/ui/core/Element";

/**
 * Represents a TinyMCE plugin.
 * Each object has to contain a property "name" which then contains the plugin name/ID.
 * @public
 */
@defineUI5Class("sap.fe.macros.richtexteditor.Plugin")
export default class PluginDefinition extends UI5Element {
	/**
	 * The plugin name.
	 * @public
	 */
	@property({ type: "string" })
	name!: string;
}

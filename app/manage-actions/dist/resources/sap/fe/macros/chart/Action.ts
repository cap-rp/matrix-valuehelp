import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Definition of a custom action to be used in the chart toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.chart.Action")
export default class Action extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the action
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * The text that will be displayed for this action
	 * @public
	 */
	@property({ type: "string" })
	text!: string;

	/**
	 * Reference to the key of another action already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this action should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Defines if the action requires a selection.
	 * @public
	 */
	@property({ type: "boolean" })
	requiresSelection?: boolean;

	/**
	 * Event handler to be called when the user chooses the action
	 * @public
	 */
	@property({ type: "string" })
	press!: string;

	/**
	 * Enables or disables the action
	 * @public
	 */
	@property({ type: "boolean" })
	enabled?: boolean;
}

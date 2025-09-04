import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import Action from "sap/fe/macros/chart/Action";
/**
 * Definition of a custom action group to be used inside the chart toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.chart.ActionGroup")
export default class ActionGroup extends Action {
	/**
	 * Unique identifier of the action
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * Defines nested actions
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.chart.Action", multiple: true, defaultClass: Action, isDefault: true })
	actions: Action[] = [];

	/**
	 * The text that will be displayed for this action group
	 * @public
	 */
	@property({ type: "string" })
	text!: string;

	/**
	 * Defines where this action group should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;
}

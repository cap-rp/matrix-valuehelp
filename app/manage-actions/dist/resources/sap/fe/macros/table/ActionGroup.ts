import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import Action from "sap/fe/macros/table/Action";
import type ActionOverride from "./ActionOverride";

/**
 * Definition of a custom ActionGroup to be used inside the table toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionGroup")
export default class ActionGroup extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the ActionGroup
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * Determines the nested actions
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.Action",
		altTypes: ["sap.fe.macros.table.ActionOverride"],
		multiple: true,
		defaultClass: Action,
		isDefault: true
	})
	actions: (Action | ActionOverride)[] = [];

	/**
	 * The text that will be displayed for this action group
	 * @public
	 */
	@property({ type: "string", required: true })
	text!: string;

	/**
	 * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Determines where this action group should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Determines the default action to be executed on the action group.
	 * @public
	 */
	@property({ type: "string" })
	defaultAction?: string;

	constructor(settings: PropertiesOf<ActionGroup>) {
		super(settings);
	}
}

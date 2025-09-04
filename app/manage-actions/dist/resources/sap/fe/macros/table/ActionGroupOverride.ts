import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import Action from "sap/fe/macros/table/Action";
import type ActionOverride from "./ActionOverride";

/**
 * Definition of an action group override to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionGroupOverride")
export default class ActionGroupOverride extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the ActionGroup to overridden.
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

	constructor(settings: PropertiesOf<ActionGroupOverride>) {
		super(settings);
	}
}

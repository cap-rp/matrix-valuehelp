import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Definition of an override for the action to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionOverride")
export default class ActionOverride extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the action to overridden.
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

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
	 * Enables or disables the action
	 * @public
	 */
	@property({ type: "boolean" })
	enabled?: boolean;

	/**
	 * Determines the shortcut combination to trigger the action
	 * @public
	 */
	@property({ type: "string" })
	command?: string;

	/**
	 * Determines whether the action requires selecting one item or multiple items.
	 * Allowed values are `single` and `multi`
	 * @public
	 */
	@property({ type: "string" })
	enableOnSelect?: "single" | "multi";

	/**
	 * Determines if the auto scroll is enabled after executing the action.
	 * @public
	 */
	@property({ type: "boolean" })
	enableAutoScroll?: boolean;

	/**
	 * Determines whether the action is visible.
	 * @public
	 */
	@property({ type: "boolean" })
	visible?: boolean;

	/**
	 * Determines whether there is a navigation after executing the action.
	 * @public
	 */
	@property({ type: "boolean" })
	navigateToInstance?: boolean;

	/**
	 * Determines the function to get the default values of the action.
	 * @public
	 */
	@property({ type: "string" })
	defaultValuesFunction?: string;

	constructor(settings: PropertiesOf<ActionOverride>) {
		super(settings);
	}
}

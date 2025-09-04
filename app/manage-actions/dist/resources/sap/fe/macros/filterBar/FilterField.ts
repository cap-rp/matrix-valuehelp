import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type Control from "sap/ui/core/Control";

/**
 * Definition of a custom filter to be used inside the FilterBar.
 *
 * The template for the FilterField has to be provided as the default aggregation
 *
 *
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarCustoms Overview of Building Blocks}
 * @public
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterField")
export default class FilterField extends BuildingBlockObjectProperty {
	/**
	 * The property name of the FilterField
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * The text that will be displayed for this FilterField
	 * @public
	 */
	@property({ type: "string" })
	label!: string;

	/**
	 * Reference to the key of another filter already displayed in the table to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this filter should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Defines which property will be influenced by the FilterField.
	 *
	 * This must be a valid property of the entity as this can be used for SAP Companion integration
	 * @public
	 */
	@property({ type: "string" })
	property?: string;

	/**
	 * This property is not required at filter field level. To achieve the desired behavior, specify the showMessages property in the FilterBar building block.
	 * @public
	 * @deprecatedsince 1.135
	 * @deprecated
	 */
	@property({ type: "boolean" })
	showMessages?: boolean;

	/**
	 * If set, the FilterField will be marked as a mandatory field.
	 * @public
	 */
	@property({ type: "boolean" })
	required?: boolean;

	@property({ type: "string" })
	slotName?: string;

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	template?: Control;
}

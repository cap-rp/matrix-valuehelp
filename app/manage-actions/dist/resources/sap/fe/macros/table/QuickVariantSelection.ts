import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Definition of the quickVariantSelection to be used inside the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.QuickVariantSelection")
export default class QuickVariantSelection extends BuildingBlockObjectProperty {
	/**
	 * Defines the list of paths pointing to the selection variants that should be used as quick filters
	 * @public
	 */
	@property({ type: "string[]" })
	paths!: string[];

	/**
	 * Defines whether the counts should be displayed next to the text
	 * @public
	 */
	@property({ type: "boolean" })
	showCounts = false;

	constructor(settings: PropertiesOf<QuickVariantSelection>) {
		super(settings);
	}
}

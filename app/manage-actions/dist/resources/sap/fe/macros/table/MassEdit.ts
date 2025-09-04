import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type FormContainer from "sap/ui/layout/form/FormContainer";

/**
 * Definition of the mass edit to be used inside the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.MassEdit")
export default class MassEdit extends BuildingBlockObjectProperty {
	/**
	 * The custom form container that can be displayed at the top of the mass edit dialog
	 * @public
	 */
	@aggregation({ type: "sap.ui.layout.form.FormContainer", isDefault: true })
	customContent?: FormContainer;

	/**
	 * Defines the list of fields that should be visible in the mass edit dialog
	 * @public
	 */
	@property({ type: "string[]" })
	visibleFields?: string[];

	/**
	 * Defines the list of fields that should be ignored in the mass edit dialog
	 * @public
	 */
	@property({ type: "string[]" })
	ignoredFields?: string[];

	/**
	 * Defines the mode of the operation grouping to save the new values
	 * Allowed values are `ChangeSet` and `Isolated`
	 * @public
	 */
	@property({ type: "string" })
	operationGroupingMode?: "ChangeSet" | "Isolated";

	constructor(settings: PropertiesOf<MassEdit>) {
		super(settings);
	}
}

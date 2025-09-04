import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Create options for the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.TableCreationOptions")
export default class TableCreationOptions extends BuildingBlockObjectProperty {
	/**
	 * Defines the creation mode to be used by the table.
	 *
	 * Allowed values are `NewPage`, `Inline`, `InlineCreationsRows`, `External` or `CreationDialog`.<br/>
	 * <br/>
	 * NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async' or 'Deferred' is used<br/>
	 * Inline - The creation is done inline<br/>
	 * InlineCreationsRows - The creation is done inline with an empty row<br/>
	 * External - The creation is done in a different application specified via the parameter 'outbound'
	 * CreationDialog - the creation is done in the table, with a dialog allowing to specify some initial property values (the properties are listed in `creationFields`).<br/>
	 *
	 * If not set with any value:<br/>
	 * if navigation is defined, the default value is 'NewPage'. Otherwise it is 'Inline'.
	 * @public
	 */
	@property({ type: "string" })
	name?: "NewPage" | "Inline" | "InlineCreationRows" | "External" | "CreationDialog";

	/**
	 * Specifies if the new entry should be created at the top or bottom of a table in case of creationMode 'Inline'<br/>
	 * The default value is 'false'
	 * @public
	 */
	@property({ type: "boolean" })
	createAtEnd?: boolean;

	/**
	 * Specifies if the new entry should be hidden in case of creationMode 'InlineCreationRows'. This only applies to responsive tables.<br/>
	 * The default value is 'false'
	 * @public
	 */
	@property({ type: "boolean" })
	inlineCreationRowsHiddenInEditMode?: boolean;

	/**
	 * The navigation target where the document is created in case of creationMode 'External'<br/>
	 * @public
	 */
	@property({ type: "string" })
	outbound?: string;

	/**
	 * Defines the list of properties that will be displayed in the creation dialog, when the creation mode is set to 'CreationDialog'.<br/>
	 * The value is a comma-separated list of property names.
	 * @public
	 */
	@property({ type: "string" })
	creationFields?: string;

	constructor(settings: PropertiesOf<TableCreationOptions>) {
		super(settings);
	}
}

import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Create options for the tree table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.TreeTableCreationOptions")
export default class TreeTableCreationOptions extends BuildingBlockObjectProperty {
	/**
	 * Defines the creation mode to be used by the tree table.
	 *
	 * Allowed values are `NewPage`, `Inline` or `CreationDialog`.<br/>
	 * <br/>
	 * NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async' or 'Deferred' is used.<br/>
	 * Inline - the creation is done inline.<br/>
	 * CreationDialog - the creation is done in the table, with a dialog allowing to specify some initial property values (the properties are listed in `creationFields`).<br/>
	 *
	 * If not set with any value:<br/>
	 * if navigation is defined, the default value is 'NewPage'. Otherwise it is 'Inline'.
	 * @public
	 */
	@property({ type: "string" })
	name?: "NewPage" | "Inline" | "CreationDialog";

	/**
	 * Defines the list of properties that will be displayed in the creation dialog, when the creation mode is set to 'CreationDialog'.<br/>
	 * The value is a comma-separated list of property names.
	 * @public
	 */
	@property({ type: "string" })
	creationFields?: string;

	/**
	 * Defines the nodes to be added on the custom create.
	 *
	 * This object must have the following properties:
	 * propertyName: the name of the property on the page entity set used to categorize the node type to be created within the hierarchy<br/>
	 * values: an array of key, label and an optional creationFields that define a value of the property defined by the propertyName key, its label, and the specific fields to be shown in the creation dialog.<br/>
	 * @public
	 */
	@property({ type: "object" })
	nodeType?: {
		propertyName?: string;
		values?: { key: string; label: string; creationFields?: string }[];
	};

	/**
	 * Defines the extension point to control the enablement of the Create button or Create Menu buttons.<br/>
	 * @public
	 */
	@property({ type: "string" })
	isCreateEnabled?: string;

	/**
	 * Specifies if the new entry should be placed at the position computed by the backend (e.g. taking sorting into account).<br/>
	 * The default value is 'false' (that is, the new entry is placed as the first child below its parent).
	 * @public
	 */
	@property({ type: "boolean" })
	createInPlace?: boolean;

	constructor(settings: PropertiesOf<TreeTableCreationOptions>) {
		super(settings);
	}
}

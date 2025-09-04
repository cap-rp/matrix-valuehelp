import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "../controls/BuildingBlockObjectProperty";

/**
 * Definition of the export settings applied to a column within the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ColumnExportSettings")
export default class ColumnExportSettings extends BuildingBlockObjectProperty {
	/**
	 * Determines a formatting template that supports indexed placeholders within curly brackets.
	 * @public
	 */
	@property({ type: "string" })
	template?: string;

	/**
	 * Determines if the content needs to be wrapped.
	 * @public
	 */
	@property({ type: "boolean" })
	wrap?: boolean;

	/**
	 * Determines the data type of the field
	 * @public
	 */
	@property({ type: "string" })
	type?: string;

	/**
	 * Determines the properties of the column.
	 * @public
	 */
	@property({ type: "string[]" })
	property?: string[];

	/**
	 * Determines the width of the column in characters
	 * @public
	 */
	@property({ type: "number" })
	width?: number;

	constructor(settings: PropertiesOf<ColumnExportSettings>) {
		super(settings);
	}
}

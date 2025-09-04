import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { HorizontalAlign } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type ColumnExportSettings from "./ColumnExportSettings";

/**
 * Definition of an override for the column to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ColumnOverride")
export default class ColumnOverride extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the column to overridden.
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * Determines the column's width.
	 *
	 * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
	 * @public
	 */
	@property({ type: "string" })
	width?: string;

	/**
	 * Defines the importance of the column.
	 *
	 * You can define which columns should be automatically moved to the pop-in area based on their importance
	 * @public
	 */
	@property({ type: "string" })
	importance?: string;

	/**
	 * Aligns the header as well as the content horizontally
	 * @public
	 */
	@property({ type: "string" })
	horizontalAlign?: HorizontalAlign;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 * @public
	 */
	@property({ type: "boolean" })
	widthIncludingColumnHeader?: boolean;

	/**
	 * The column availability
	 */
	@property({ type: "string" })
	availability?: string;

	/**
	 * Determines the export settings for the column.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.ColumnExportSettings" })
	exportSettings?: ColumnExportSettings;

	constructor(settings: PropertiesOf<ColumnOverride>) {
		super(settings);
	}
}

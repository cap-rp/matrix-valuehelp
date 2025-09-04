import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { HorizontalAlign } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type Control from "sap/ui/core/Control";
import type ColumnExportSettings from "./ColumnExportSettings";

/**
 * Definition of a custom column to be used inside the table.
 *
 * The template for the column has to be provided as the default aggregation
 * @public
 */
@defineUI5Class("sap.fe.macros.table.Column")
export default class Column extends BuildingBlockObjectProperty {
	/**
	 * Unique identifier of the column
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * The text that will be displayed for this column header
	 * @public
	 */
	@property({ type: "string", required: true })
	header!: string;

	/**
	 * Determines the column's width.
	 *
	 * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
	 * @public
	 */
	@property({ type: "string" })
	width?: string;

	/**
	 * Defines the column importance.
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
	 * Reference to the key of another column already displayed in the table to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Determines where this column should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Determines the properties displayed in the column
	 *
	 * The properties allow to export, sort, group, copy, and paste in the column
	 * @public
	 */
	@property({ type: "string[]" })
	properties?: string[];

	/**
	 * The text that will be displayed for this column tooltip
	 */
	@property({ type: "string" })
	tooltip?: string;

	/**
	 * The column availability
	 */
	@property({ type: "string" })
	availability?: string;

	/**
	 * Determines if the information in the column is required.
	 */
	@property({ type: "boolean" })
	required?: boolean;

	/**
	 * The content of the column
	 */
	@aggregation({ type: "sap.ui.core.Control", isDefault: true })
	template?: Control;

	/**
	 * Determines the export settings for the column.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.ColumnExportSettings" })
	exportSettings?: ColumnExportSettings;

	init(): undefined {
		super.init();
		// Don't propagate the table binding context to the column template, as the correct binding context is the row context which is set by the table itself.
		// mSkipPropagation isn't publicaly exposed but it's already used in sap.mdc.table.
		(this as unknown as { mSkipPropagation: Record<string, boolean> }).mSkipPropagation = { template: true };
		return;
	}

	constructor(settings: PropertiesOf<Column>) {
		super(settings);
	}
}

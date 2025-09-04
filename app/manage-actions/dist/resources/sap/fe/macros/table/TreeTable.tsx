import type { ConvertContextToString } from "sap/fe/base/ClassSupport";
import { defineUI5Class, xmlEventHandler, type EnhanceWithUI5, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import { convertBuildingBlockMetadata } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import BuildingBlockWithTemplating from "sap/fe/macros/controls/BuildingBlockWithTemplating";
import type Action from "sap/fe/macros/table/Action";
import type Column from "sap/fe/macros/table/Column";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import TreeTableBlock from "sap/fe/macros/table/TreeTable.block";
import FlexItemData from "sap/m/FlexItemData";
import type UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/mdc/Control";

/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 * <br>
 * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
 * <br>
 * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
 *
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/table/TreeTable"], function(TreeTable) {
 * 	 ...
 * 	 new TreeTable("myTable", {metaPath:"@com.sap.vocabularies.UI.v1.LineItem"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the Table that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @experimental
 * @since 1.125.0
 * @mixes sap.fe.macros.TreeTable
 */
@defineUI5Class("sap.fe.macros.table.TreeTable", convertBuildingBlockMetadata(TreeTableBlock))
export default class TreeTable extends BuildingBlockWithTemplating {
	constructor(props?: ConvertContextToString<PropertiesOf<TreeTableBlock>> & $ControlSettings, others?: $ControlSettings) {
		super(props, others);
		this.createProxyMethods([
			"getSelectedContexts",
			"addMessage",
			"removeMessage",
			"refresh",
			"getPresentationVariant",
			"setPresentationVariant",
			"getCurrentVariantKey",
			"setCurrentVariantKey",
			"getSelectionVariant",
			"setSelectionVariant"
		]);
	}

	@xmlEventHandler()
	_fireEvent(ui5Event: UI5Event, _controller: PageController, eventId: string): void {
		this.fireEvent(eventId, ui5Event.getParameters());
	}

	getLayoutData(): FlexItemData {
		return new FlexItemData({ maxWidth: "100%" });
	}

	/**
	 * Sets the path to the metadata that should be used to generate the table.
	 * @param metaPath The path to the metadata
	 * @returns Reference to this in order to allow method chaining
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	setMetaPath(metaPath: string): this {
		return this.setProperty("metaPath", metaPath);
	}

	/**
	 * Gets the path to the metadata that should be used to generate the table.
	 * @returns The path to the metadata
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	getMetaPath(): string {
		return this.getProperty("metaPath");
	}

	/**
	 * Sets the fields that should be ignored when generating the table.
	 * @param ignoredFields The fields to ignore
	 * @returns Reference to this in order to allow method chaining
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	setIgnoredFields(ignoredFields: string): this {
		return this.setProperty("ignoredFields", ignoredFields);
	}

	/**
	 * Get the fields that should be ignored when generating the table.
	 * @returns The value of the ignoredFields property
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	getIgnoredFields(): string {
		return this.getProperty("ignoredFields");
	}

	/**
	 * Adds a column to the table.
	 * @param column The column to add
	 * @returns Reference to this in order to allow method chaining
	 * @experimental
	 * @since 1.124.0
	 * @public
	 */
	addColumn(column: Column): this {
		return this.addAggregation("columns", column);
	}

	/**
	 * Removes a column from the table.
	 * @param column The column to remove, or its index or ID
	 * @returns The removed column or null
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	removeColumn(column: number | string | Column): Column | null {
		return this.removeAggregation("columns", column) as Column | null;
	}

	/**
	 * Adds an action to the table.
	 * @param action The action to add
	 * @returns Reference to this in order to allow method chaining
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	addAction(action: Action): this {
		return this.addAggregation("actions", action);
	}

	/**
	 * Removes an action from the table.
	 * @param action The action to remove, or its index or ID
	 * @returns The removed action or null
	 * @experimental
	 * @since 1.125.0
	 * @public
	 */
	removeAction(action: number | string | Action): Action | null {
		return this.removeAggregation("actions", action) as Action | null;
	}

	async createContent(owner: EnhanceWithUI5<TemplateComponent>): Promise<void> {
		const shouldRebind = (this.content as TableAPI)?.content.getRowBinding()?.getCurrentContexts().length > 0;
		await super.createContent(owner);
		if (shouldRebind) {
			(this.content as TableAPI)?.content.rebind?.();
		}
	}
}

import Log from "sap/base/Log";
import { association, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type UI5Element from "sap/ui/core/Element";
import VariantManagementControl from "sap/ui/fl/variants/VariantManagement";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import type FilterBarAPI from "./filterBar/FilterBarAPI";

/**
 * Building block used to create a Variant Management based on the metadata provided by OData V4.
 *
 * Usage example:
 * <pre>
 * &lt;macro:VariantManagement
 * id="SomeUniqueIdentifier"
 * for="{listOfControlIds&gt;}"
 * /&gt;
 * </pre>
 *
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarVMWithTable Overview of Building Blocks}
 * @classdesc A custom UI5 class for managing variants in applications.
 * Extends the base `BuildingBlock` class and provides additional properties
 * such as `id`, `for`, `showSetAsDefault`, and `headerLevel` to configure variant management behavior.
 *
 * @public
 */
@defineUI5Class("sap.fe.macros.VariantManagement")
export class VariantManagement extends BuildingBlock<VariantManagementControl> {
	/**
	 * Identifier for the variant management control.
	 * @type {string | undefined}
	 * @public
	 */
	@property({ type: "any", required: true })
	id!: string | undefined;

	/**
	 * A list of control IDs to which the variant management is applied.
	 * @type {string[]}
	 * @public
	 */
	@association({ type: "sap.ui.core.Control", multiple: true })
	for: string[] = [];

	/**
	 * Whether the "Set as Default" option is visible.
	 * @type {boolean | undefined}
	 * @default true
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	showSetAsDefault: boolean | undefined;

	/**
	 * Header level for the variant management, determining its position or style.
	 * @type {string | undefined}
	 * @public
	 */
	@property({ type: "string" })
	headerLevel: string | undefined;

	constructor(properties: $ControlSettings & PropertiesOf<VariantManagement>, others?: $ControlSettings) {
		super(properties, others);
	}

	onMetadataAvailable(): void {
		this.content = this.createContent();
		const availableIds = this.getAssociation("for", null) || [];
		this.connectToFilterbar(Array.isArray(availableIds) ? availableIds : [availableIds]);
	}

	/**
	 * Create and configure the VariantManagement control content.
	 * @returns The VariantManagement control.
	 */
	createContent(): VariantManagementControl {
		const variantManagementContent = new VariantManagementControl({
			id: generate([this.id, "VM"]),
			for: this.for,
			showSetAsDefault: this.showSetAsDefault,
			headerLevel: this.headerLevel
		});
		this.setAggregation("content", variantManagementContent);
		return variantManagementContent;
	}

	/**
	 * Connects the variant management component to a list of filter bar controls.
	 * @param filterBarIds The unique identifiers of the filter bar controls to connect with.
	 * @throws {Error} Logs an error message if the connection to any filter bar control fails.
	 */
	connectToFilterbar(filterBarIds: string | string[]): void {
		const ids = Array.isArray(filterBarIds) ? filterBarIds : [filterBarIds];
		ids.forEach((controlId) => {
			try {
				BuildingBlock.observeBuildingBlock(controlId, {
					onAvailable: (control: UI5Element) => {
						if (control && control.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
							const vm = this.getContent();
							if (vm) {
								(control as FilterBarAPI).setVariantBackReference(vm);
							}
						}
					}
				});
			} catch (error) {
				Log.error(`Error setting variant in Filter Bar: ${error}`);
			}
		});
	}
}

export default VariantManagement;

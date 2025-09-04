import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import TableBlock from "./Table.block";
import type TreeTableCreationOptions from "./TreeTableCreationOptions";

/**
 * Building block used to create a tree table based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/table/treeTable Overview of Tree Table Building Block}
 * @mixes sap.fe.macros.Table
 * @augments sap.fe.macros.MacroAPI
 * @public
 */
@defineBuildingBlock({
	name: "TreeTable",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.fe.macros.table.TableAPI"]
})
export default class TreeTableBlock extends TableBlock {
	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@blockAttribute({ type: "string", required: true, isPublic: true })
	hierarchyQualifier!: string;

	/**
	 * Defines the extension point to control whether a source node can be dropped on a specific parent node.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	isMoveToPositionAllowed?: string;

	/**
	 * Defines the extension point to control whether a source node can be copied to a specific parent node.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	isCopyToPositionAllowed?: string;

	/**
	 * Defines the extension point to control if a node can be dragged.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	isNodeMovable?: string;

	/**
	 * efines the extension point to control whether a node can be copied.<br/>
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	isNodeCopyable?: string;
	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@blockAttribute({
		type: "object",
		underlyingType: "sap.fe.macros.table.TreeTableCreationOptions",
		isPublic: true,
		validate: function (creationOptionsInput: TreeTableCreationOptions) {
			if (creationOptionsInput.name && !["NewPage", "Inline", "External", "CreationDialog"].includes(creationOptionsInput.name)) {
				throw new Error(`Allowed value ${creationOptionsInput.name} for creationMode does not match`);
			}

			return creationOptionsInput;
		}
	})
	creationMode: PropertiesOf<TreeTableCreationOptions> = {};

	/**
	 * Defines the type of table that will be used by the building block to render the data. This setting is defined by the framework.
	 *
	 * Allowed value is `TreeTable`.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true, allowedValues: ["TreeTable"] })
	readonly type?: "TreeTable";

	constructor(props: PropertiesOf<TreeTableBlock>, controlConfiguration: unknown, settings: TemplateProcessorSettings) {
		super(props, controlConfiguration, settings);
	}

	getTableSettings(): Record<string, unknown> {
		const tableSettings = super.getTableSettings();
		TableBlock.addSetting(tableSettings, "type", "TreeTable");
		TableBlock.addSetting(tableSettings, "hierarchyQualifier", this.hierarchyQualifier);
		TableBlock.addSetting(tableSettings, "isMoveToPositionAllowed", this.isMoveToPositionAllowed);
		TableBlock.addSetting(tableSettings, "isCopyToPositionAllowed", this.isCopyToPositionAllowed);
		TableBlock.addSetting(tableSettings, "isNodeMovable", this.isNodeMovable);
		TableBlock.addSetting(tableSettings, "isNodeCopyable", this.isNodeCopyable);
		const creationMode = (tableSettings["creationMode"] ?? {}) as Record<string, unknown>;
		TableBlock.addSetting(creationMode, "createInPlace", this.creationMode.createInPlace);

		if (this.creationMode.nodeType) {
			//Values is passed as Array into the XML but in the manifest it is a dictionary
			// so we need to transform the array into a dictionary
			TableBlock.addSetting(creationMode, "nodeType", {
				propertyName: this.creationMode.nodeType.propertyName,
				values: Object.assign(
					{},
					...(this.creationMode.nodeType.values ?? []).map((value) => ({
						[value.key]: { label: value.label, creationFields: value.creationFields }
					}))
				)
			});
		}

		TableBlock.addSetting(creationMode, "isCreateEnabled", this.creationMode.isCreateEnabled);
		if (Object.entries(creationMode).length > 0) {
			tableSettings["creationMode"] = creationMode;
		}
		return tableSettings;
	}
}

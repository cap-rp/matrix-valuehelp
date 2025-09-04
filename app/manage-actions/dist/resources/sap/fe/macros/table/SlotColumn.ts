import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";

@defineUI5Class("sap.fe.macros.table.SlotColumn")
export default class SlotColumn extends BuildingBlock<UI5Element> {
	@property({ type: "string" })
	templateId!: string;

	constructor(props: $ControlSettings & PropertiesOf<SlotColumn>, others?: $ControlSettings) {
		super(props, others);
	}

	/**
	 * Retrieve the content of the slot column based on the id used by the template if it doesn't exist anymore.
	 */
	onMetadataAvailable(): void {
		if (this.templateId && !this.content) {
			this.content = UI5Element.getElementById(this.templateId)?.clone();
		}
	}
}

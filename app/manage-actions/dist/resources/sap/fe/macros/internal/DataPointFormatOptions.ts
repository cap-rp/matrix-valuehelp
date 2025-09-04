import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Definition of datapoint formatOptions
 * @private
 */
@defineUI5Class("sap.fe.macros.internal.DataPointFormatOptions")
export default class DataPointFormatOptions extends BuildingBlockObjectProperty {
	constructor(props?: string | PropertiesOf<DataPointFormatOptions>, others?: PropertiesOf<DataPointFormatOptions>) {
		super(props as string, others);
	}

	@property({ type: "string" })
	dataPointStyle?: "" | "large";

	@property({ type: "string" })
	displayMode?: DisplayMode;

	@property({ type: "string" })
	iconSize?: "1rem" | "1.375rem" | "2rem";

	@property({ type: "string" })
	measureDisplayMode?: string;

	@property({ type: "boolean" })
	showEmptyIndicator = false;

	@property({ type: "boolean" })
	showLabels = false;
}

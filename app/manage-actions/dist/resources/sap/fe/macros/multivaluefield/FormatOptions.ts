import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "../controls/BuildingBlockObjectProperty";

@defineUI5Class("sap.fe.macros.multivaluefield.FormatOptions")
export default class FormatOptions extends BuildingBlockObjectProperty {
	@property({ type: "boolean" })
	showEmptyIndicator?: boolean;

	@property({ type: "boolean" })
	displayOnly?: boolean;

	@property({ type: "string" })
	displayMode?: "Value" | "Description" | "ValueDescription" | "DescriptionValue";

	@property({ type: "string" })
	measureDisplayMode?: "Hidden" | "ReadOnly";

	@property({ type: "boolean" })
	isAnalytics?: boolean;
}

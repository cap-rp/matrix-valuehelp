import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Microsoft Teams options to provide as part of Share.
 */
@defineUI5Class("sap.fe.macros.share.MsTeamsOptions")
export default class MsTeamsOptions extends BuildingBlockObjectProperty {
	constructor(idOrProps?: string | PropertiesOf<MsTeamsOptions>, props?: PropertiesOf<MsTeamsOptions>) {
		super(idOrProps as string, props);
	}

	@property({ type: "boolean" })
	enableCard?: boolean | CompiledBindingToolkitExpression;
}

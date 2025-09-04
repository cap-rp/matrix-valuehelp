import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import FieldBlock from "sap/fe/macros/Field";
import type { $ControlSettings } from "sap/ui/core/Control";

/**
 * Building block for creating a field based on the metadata provided by OData V4.
 * <br>
 * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
 * When creating a Field building block, you must provide an ID to ensure everything works correctly.
 *
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/field/Field"], function(Field) {
 * 	 ...
 * 	 new Field("MyField", {metaPath:"MyProperty"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the Field that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @experimental
 * @mixes sap.fe.macros.Field
 * @augments sap.ui.core.Control
 * @deprecatedsince 1.135
 * @deprecated Use {@link sap.fe.macros.Field} instead
 */

@defineUI5Class("sap.fe.macros.field.Field")
export default class Field extends FieldBlock {
	constructor(props?: PropertiesOf<FieldBlock> & $ControlSettings, others?: $ControlSettings) {
		Log.warning("You've consumed deprecated Field class. Use sap.fe.macros.field.Field instead");
		super(props, others);
	}
}

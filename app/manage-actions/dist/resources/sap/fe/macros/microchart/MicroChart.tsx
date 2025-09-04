import Log from "sap/base/Log";
import { defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import MicroChartBlock from "../MicroChart";

/**
 * Building block used to create a MicroChart based on the metadata provided by OData V4.
 *
 * <br>
 * Usually, a contextPath and metaPath is expected.
 *
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/microchart/MicroChart"], function(MicroChart) {
 * 	 ...
 * 	 new MicroChart("microChartID", {metaPath:"MyProperty"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the MicroChart that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @experimental
 * @mixes sap.fe.macros.MicroChart
 * @deprecatedsince 1.130
 * @deprecated Use {@link sap.fe.macros.MicroChart} instead
 */
@defineUI5Class("sap.fe.macros.microchart.MicroChart")
export default class MicroChart extends MicroChartBlock {
	constructor(props?: PropertiesOf<MicroChartBlock> & $ControlSettings, others?: $ControlSettings) {
		Log.warning("You've consumed deprecated MicroChart class. Use sap.fe.macros.MicroChart instead");
		super(props, others);
	}
}

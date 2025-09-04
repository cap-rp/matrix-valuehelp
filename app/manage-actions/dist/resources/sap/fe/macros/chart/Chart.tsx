import Log from "sap/base/Log";
import { defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import ChartBlock from "../Chart";

/**
 * Building block used to create a chart based on the metadata provided by OData V4.
 * <br>
 * Usually, a contextPath and metaPath is expected.
 *
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/chart/Chart"], function(Chart) {
 * 	 ...
 * 	 new Chart("myChart", {metaPath:"MyChart"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the Chart that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @experimental
 * @mixes sap.fe.macros.Chart
 * @augments sap.ui.core.Control
 * @deprecatedsince 1.130
 * @deprecated Use {@link sap.fe.macros.Chart} instead
 */
@defineUI5Class("sap.fe.macros.chart.Chart")
export default class Chart extends ChartBlock {
	constructor(props?: PropertiesOf<ChartBlock> & $ControlSettings, others?: $ControlSettings) {
		Log.warning("You've consumed deprecated Chart class. Use sap.fe.macros.Chart instead");
		super(props, others);
	}
}

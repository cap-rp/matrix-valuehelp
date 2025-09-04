import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * A set of options that can be configured to control the aggregation behavior
 * @public
 */
@defineUI5Class("sap.fe.macros.table.AnalyticalConfiguration")
export default class AnalyticalConfiguration extends BuildingBlockObjectProperty {
	/**
	 * True if leaf level rows shall display aggregated data
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	aggregationOnLeafLevel?: boolean;

	constructor(settings: PropertiesOf<AnalyticalConfiguration>) {
		super(settings);
	}
}

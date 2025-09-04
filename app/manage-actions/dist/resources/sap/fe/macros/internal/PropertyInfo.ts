import type TypeConfig from "sap/ui/mdc/TypeConfig";
import type { PropertyInfo as MDCPropertyInfo } from "sap/ui/mdc/util/PropertyHelper";
/**
 * Object describing a data property for internal FE usage
 * It's a temporary and isolated type used mostly from the Filterbar and the chart
 */
export type PropertyInfo = Omit<MDCPropertyInfo, "key"> & {
	annotationPath: string;
	conditionPath: string;
	typeConfig?: TypeConfig;
	name: string;
};

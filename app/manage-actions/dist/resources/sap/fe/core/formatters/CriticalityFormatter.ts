import type { PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import { CriticalityType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import ObjectPath from "sap/base/util/ObjectPath";

const getCriticality = (criticality?: string | number | PropertyAnnotationValue<CriticalityType>): CriticalityType | undefined => {
	if (criticality) {
		switch (criticality) {
			case CriticalityType.VeryNegative:
			case -1:
			case "-1":
				return CriticalityType.VeryNegative;
			case CriticalityType.Neutral:
			case 0:
			case "0":
				return CriticalityType.Neutral;
			case CriticalityType.Negative:
			case 1:
			case "1":
				return CriticalityType.Negative;
			case CriticalityType.Critical:
			case 2:
			case "2":
				return CriticalityType.Critical;
			case CriticalityType.Positive:
			case 3:
			case "3":
				return CriticalityType.Positive;
			case CriticalityType.VeryPositive:
			case 4:
			case "4":
				return CriticalityType.VeryPositive;
			case CriticalityType.Information:
			case 5:
			case "5":
				return CriticalityType.Information;
			default:
				return undefined;
		}
	}
	return undefined;
};
getCriticality.__functionName = "sap.fe.core.formatters.CriticalityFormatter#getCriticality";

const criticalityFormatters = function (this: object, name: string, ...args: unknown[]): unknown {
	if (criticalityFormatters.hasOwnProperty(name)) {
		return (criticalityFormatters as unknown as Record<string, Function>)[name].apply(this, args);
	} else {
		return "";
	}
};

criticalityFormatters.getCriticality = getCriticality;

ObjectPath.set("sap.fe.core.formatters.CriticalityFormatter", criticalityFormatters);

export default criticalityFormatters;

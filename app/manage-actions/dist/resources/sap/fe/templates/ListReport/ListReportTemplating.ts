// Template Helpers for the List Report
import type { ListReportDefinition } from "sap/fe/core/converters/templates/ListReportConverter";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";

/**
 * Method returns an VariantBackReference expression based on variantManagement and oConverterContext value.
 * @param viewData Object Containing View Data
 * @param converterContextObject Object containing converted context
 * @returns {string}
 */

export const getVariantBackReference = function (viewData: ViewData, converterContextObject: ListReportDefinition): string | undefined {
	if (viewData && viewData.variantManagement === "Page") {
		return "fe::PageVariantManagement";
	}
	if (viewData && viewData.variantManagement === "Control") {
		return generate([converterContextObject.filterBarId, "VariantManagement"]);
	}
	return undefined;
};

export const getDefaultPath = function (aViews: { defaultPath?: string }[]): string | undefined {
	for (let i = 0; i < aViews.length; i++) {
		if (aViews[i].defaultPath) {
			return aViews[i].defaultPath;
		}
	}
};

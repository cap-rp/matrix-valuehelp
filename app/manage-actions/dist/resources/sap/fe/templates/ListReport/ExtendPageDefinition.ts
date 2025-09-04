import type { ListReportDefinition } from "sap/fe/core/converters/templates/ListReportConverter";

export type FinalPageDefinition = ListReportDefinition & {
	designtime: string | undefined;
};

export function getDesigntime(): string | undefined {
	return "sap/fe/templates/ListReport/designtime/ListReport.designtime";
}

export const extendListReportPageDefinition = function (pageDefinition: ListReportDefinition): FinalPageDefinition {
	const convertedPageDefinition = pageDefinition as FinalPageDefinition;
	convertedPageDefinition.designtime = getDesigntime();
	return convertedPageDefinition;
};

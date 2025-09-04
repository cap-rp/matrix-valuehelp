import { and, constant, equal, pathInModel, type BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type ConverterContext from "../ConverterContext";
import type { ChartManifestConfiguration, TableManifestConfiguration } from "../ManifestSettings";
import { TemplateType } from "../ManifestSettings";
import type { StandardActionsContext } from "../controls/Common/table/StandardActions";

/**
 * Gets the boolean value for the 'visible' property of the 'AddCardToInsights' action.
 * @param cardType
 * @param converterContext
 * @param visualizationPath
 * @param standardActionsContext
 * @returns Boolean value for the 'visible' property of the 'AddCardToInsights' action.
 */
export function getInsightsVisibility(
	cardType: "Analytical" | "Table",
	converterContext: ConverterContext<PageContextPathTarget>,
	visualizationPath: string,
	standardActionsContext?: StandardActionsContext
): BindingToolkitExpression<boolean> {
	let tableManifestConfig, isResponsiveTable;

	const isMultiEntity = converterContext.getManifestWrapper().hasMultipleEntitySets();
	const isMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations();
	const viewConfig = converterContext.getManifestWrapper().getViewConfiguration();
	const isMultiTabs = viewConfig !== undefined && viewConfig.paths.length > 1 ? true : false;
	const templateBindingExpression = converterContext.getTemplateType() === TemplateType.ListReport;
	const vizPathConfiguration = converterContext.getManifestControlConfiguration<TableManifestConfiguration | ChartManifestConfiguration>(
		visualizationPath
	);
	const enableAddCardToInsights =
		cardType === "Analytical"
			? (vizPathConfiguration as ChartManifestConfiguration)?.enableAddCardToInsights ?? true
			: (vizPathConfiguration as TableManifestConfiguration)?.tableSettings?.enableAddCardToInsights ?? true;

	if (cardType === "Table") {
		tableManifestConfig = standardActionsContext?.tableManifestConfiguration;
		isResponsiveTable = tableManifestConfig?.type === "ResponsiveTable";
	}

	return and(
		constant(enableAddCardToInsights),
		constant(templateBindingExpression),
		constant(!isMultiEntity),
		constant(!isMultiTabs),
		constant(cardType === "Table" ? (isResponsiveTable ?? false) && !isMultipleVisualizations : true),
		equal(pathInModel("isInsightsSupported", "pageInternal"), true)
	);
}

export function getInsightsEnablement(): BindingToolkitExpression<boolean> {
	return equal(pathInModel("isInsightsEnabled", "internal"), true);
}

import type { EntityType } from "@sap-ux/vocabularies-types";
import type {
	Chart,
	LineItem,
	PresentationVariant,
	PresentationVariantType,
	SelectionPresentationVariant,
	SelectionVariant,
	SelectionVariantType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { IssueCategory, IssueSeverity, IssueType } from "sap/fe/core/converters/helpers/IssueManager";
import { isAnnotationOfType } from "sap/fe/core/helpers/TypeGuards";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ConverterContext from "../../ConverterContext";
import type { ResolvedAnnotationContext } from "../../ConverterContext";
import { TemplateType, VisualizationType } from "../../ManifestSettings";
import type { ChartVisualization } from "./Chart";
import { createBlankChartVisualization, createChartVisualization, createChartVisualizationForTemplating } from "./Chart";
import type { TableVisualization } from "./Table";
import Table from "./Table";

export type DataVisualizationAnnotations = LineItem | Chart | PresentationVariant | SelectionVariant | SelectionPresentationVariant;
export type ActualVisualizationAnnotations = LineItem | Chart;
export type PresentationVisualizationAnnotations = UIAnnotationTerms.LineItem | UIAnnotationTerms.Chart;
export type VisualizationAndPath = {
	visualization: ActualVisualizationAnnotations;
	annotationPath: string;
	selectionVariant?: SelectionVariantType;
	converterContext: ConverterContext<PageContextPathTarget>;
};
export type DataVisualizationDefinition = {
	visualizations: (TableVisualization | ChartVisualization)[];
	annotationPath?: string;
	associatedSelectionVariantPath?: string;
	inMultiView?: boolean;
};

export const getVisualizationsFromAnnotation = function (
	annotation: PresentationVariantType | SelectionPresentationVariant,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>,
	isMacroOrMultipleView?: boolean
): VisualizationAndPath[] {
	const { presentation, selectionVariant } = isAnnotationOfType<PresentationVariantType>(
		annotation,
		UIAnnotationTypes.PresentationVariantType
	)
		? { presentation: annotation, selectionVariant: undefined }
		: { presentation: annotation.PresentationVariant, selectionVariant: annotation.SelectionVariant };
	const visualizationAnnotations: VisualizationAndPath[] = [];
	const isALP = isAlpAnnotation(converterContext);
	const finalSelectionVariant =
		!isALP && // Don't add the SelectionVariant on ALP -> will be managed by FIORITECHP1-26237
		!(converterContext.getTemplateType() === TemplateType.ListReport && !isMacroOrMultipleView) //On ListReport with single view the SelectionVariant is managed by FilterBar
			? selectionVariant
			: undefined;
	const baseVisualizationPath = visualizationPath.split("@")[0];
	if ((isMacroOrMultipleView === true || isALP) && !isPresentationCompliant(presentation, isALP)) {
		if (!annotationExistsInPresentationVariant(presentation, UIAnnotationTerms.LineItem)) {
			const defaultLineItemAnnotation = prepareDefaultVisualization(
				UIAnnotationTerms.LineItem,
				baseVisualizationPath,
				converterContext
			);
			if (defaultLineItemAnnotation) {
				visualizationAnnotations.push({ ...defaultLineItemAnnotation, ...{ selectionVariant: finalSelectionVariant } });
			}
		}
		if (!annotationExistsInPresentationVariant(presentation, UIAnnotationTerms.Chart)) {
			const defaultChartAnnotation = prepareDefaultVisualization(UIAnnotationTerms.Chart, baseVisualizationPath, converterContext);
			if (defaultChartAnnotation) {
				visualizationAnnotations.push(defaultChartAnnotation);
			}
		}
	}
	const visualizations = presentation.Visualizations;
	const pushFirstVizOfType = function (allowedTerms: string[]): void {
		const firstViz = visualizations?.find((viz) => viz.$target !== undefined && allowedTerms.includes(viz.$target.term));
		if (firstViz) {
			visualizationAnnotations.push({
				visualization: firstViz.$target as ActualVisualizationAnnotations,
				annotationPath: `${baseVisualizationPath}${firstViz.value}`,
				converterContext: converterContext,
				selectionVariant: finalSelectionVariant
			});
		}
	};
	if (isALP) {
		// In case of ALP, we use the first LineItem and the first Chart
		pushFirstVizOfType([UIAnnotationTerms.LineItem]);
		pushFirstVizOfType([UIAnnotationTerms.Chart]);
	} else {
		// Otherwise, we use the first viz only (Chart or LineItem)
		pushFirstVizOfType([UIAnnotationTerms.LineItem, UIAnnotationTerms.Chart]);
	}
	return visualizationAnnotations;
};
export function getSelectionPresentationVariant(
	entityType: EntityType,
	annotationPath: string | undefined,
	converterContext: ConverterContext<PageContextPathTarget>
): SelectionPresentationVariant | undefined {
	if (annotationPath) {
		const resolvedTarget = converterContext.getEntityTypeAnnotation(annotationPath);
		const selectionPresentationVariant = resolvedTarget.annotation as SelectionPresentationVariant;
		if (selectionPresentationVariant) {
			if (selectionPresentationVariant.term === UIAnnotationTerms.SelectionPresentationVariant) {
				return selectionPresentationVariant;
			}
		} else {
			throw new Error("Annotation Path for the SPV mentioned in the manifest is not found, Please add the SPV in the annotation");
		}
	} else {
		return entityType.annotations?.UI?.SelectionPresentationVariant;
	}
}
export function isSelectionPresentationCompliant(
	selectionPresentationVariant: SelectionPresentationVariant,
	isALP: boolean
): boolean | undefined {
	const presentationVariant = selectionPresentationVariant && selectionPresentationVariant.PresentationVariant;
	if (presentationVariant) {
		return isPresentationCompliant(presentationVariant, isALP);
	} else {
		throw new Error("Presentation Variant is not present in the SPV annotation");
	}
}
export function isPresentationCompliant(presentationVariant: PresentationVariantType, isALP = false): boolean {
	let hasTable = false,
		hasChart = false;
	if (isALP) {
		if (presentationVariant?.Visualizations) {
			const visualizations = presentationVariant.Visualizations;
			visualizations.forEach((visualization) => {
				if (visualization.$target?.term === UIAnnotationTerms.LineItem) {
					hasTable = true;
				}
				if (visualization.$target?.term === UIAnnotationTerms.Chart) {
					hasChart = true;
				}
			});
		}
		return hasChart && hasTable;
	} else {
		return (
			presentationVariant?.Visualizations &&
			!!presentationVariant.Visualizations.find((visualization) => {
				return (
					visualization.$target?.term === UIAnnotationTerms.LineItem || visualization.$target?.term === UIAnnotationTerms.Chart
				);
			})
		);
	}
}
export function getDefaultLineItem(entityType: EntityType): LineItem | undefined {
	return entityType.annotations.UI?.LineItem;
}
export function getDefaultChart(entityType: EntityType): Chart | undefined {
	return entityType.annotations.UI?.Chart;
}
export function getDefaultSelectionVariant(entityType: EntityType): SelectionVariant | undefined {
	return entityType.annotations?.UI?.SelectionVariant;
}
export function getSelectionVariant(
	entityType: EntityType,
	converterContext: ConverterContext<PageContextPathTarget>
): SelectionVariantType | undefined {
	const annotationPath = converterContext.getManifestWrapper().getDefaultTemplateAnnotationPath();
	const selectionPresentationVariant = getSelectionPresentationVariant(entityType, annotationPath, converterContext);
	let selectionVariant;
	if (selectionPresentationVariant) {
		selectionVariant = selectionPresentationVariant.SelectionVariant as SelectionVariant;
		if (selectionVariant) {
			return selectionVariant;
		}
	} else {
		selectionVariant = getDefaultSelectionVariant(entityType);
		return selectionVariant;
	}
}

/**
 * Gets the configuration of the visualizations related to an annotation.
 * @param resolvedTarget The annotation
 * @param visualizationPath The path to the visualization annotation
 * @param isMacroOrMultipleView True if it's for a building block or a multiple views configuration
 * @returns The visualizations with their configuration
 */
function getVisualizationsAndPaths(
	resolvedTarget: ResolvedAnnotationContext<DataVisualizationAnnotations>,
	visualizationPath: string,
	isMacroOrMultipleView?: boolean
): VisualizationAndPath[] {
	const { annotation, converterContext } = resolvedTarget;
	const term = annotation?.term;
	let visualizationAnnotations: VisualizationAndPath[] = [];
	if (term) {
		switch (term) {
			case UIAnnotationTerms.LineItem:
			case UIAnnotationTerms.Chart:
				visualizationAnnotations.push({
					visualization: annotation as ActualVisualizationAnnotations,
					annotationPath: visualizationPath,
					converterContext: converterContext
				});
				break;
			case UIAnnotationTerms.PresentationVariant:
			case UIAnnotationTerms.SelectionPresentationVariant:
				visualizationAnnotations = visualizationAnnotations.concat(
					getVisualizationsFromAnnotation(annotation, visualizationPath, converterContext, isMacroOrMultipleView)
				);
				break;
			default:
				break;
		}
	}
	return visualizationAnnotations;
}

/**
 * Gets the presentation of the visualizations related to a visualizationPath.
 * @param visualizationPath The path to the visualization annotation
 * @param inConverterContext The converted context
 * @returns The presentation variant
 */
function getDataVisualizationPresentation(
	visualizationPath: string,
	inConverterContext: ConverterContext<PageContextPathTarget>
): PresentationVariantType | undefined {
	if (visualizationPath === "") {
		return undefined;
	}

	const annotation = inConverterContext.getEntityTypeAnnotation(visualizationPath).annotation as DataVisualizationAnnotations;
	if (isAnnotationOfType<SelectionPresentationVariant>(annotation, UIAnnotationTypes.SelectionPresentationVariantType)) {
		return annotation.PresentationVariant;
	} else if (annotation.term === UIAnnotationTerms.PresentationVariant) {
		return annotation;
	}
	return undefined;
}

/**
 * Gets the presentation of the visualizations related to a visualizationPath.
 * @param visualizationPath The path to the visualization annotation
 * @param inConverterContext The converted context
 * @param params
 * @param params.isCondensedTableLayoutCompliant True if it's for a condensed layout
 * @param params.viewConfiguration The view configuration
 * @param params.doNotCheckApplySupported True if the check to "ApplySupported" is skipped
 * @param params.associatedPresentationVariantPath The path of the presentation to apply
 * @param params.isMacroOrMultipleView True if it's for a building block or a multiple views configuration
 * @param params.shouldCreateTemplateChartVisualization True if we need to create chart visualization for templating
 * @returns The definition of the data visualizations
 */
export function getDataVisualizationConfiguration(
	visualizationPath: string,
	inConverterContext: ConverterContext<PageContextPathTarget>,
	params: Partial<{
		isCondensedTableLayoutCompliant: boolean;
		doNotCheckApplySupported: boolean;
		associatedSelectionVariant: SelectionVariantType;
		isMacroOrMultipleView: boolean;
		shouldCreateTemplateChartVisualization: boolean;
	}>
): DataVisualizationDefinition {
	const {
		isCondensedTableLayoutCompliant,
		doNotCheckApplySupported,
		associatedSelectionVariant,
		isMacroOrMultipleView,
		shouldCreateTemplateChartVisualization
	} = params;
	const resolvedTarget =
		visualizationPath !== ""
			? inConverterContext.getEntityTypeAnnotation<DataVisualizationAnnotations>(visualizationPath)
			: { annotation: undefined, converterContext: inConverterContext };
	const resolvedVisualization = resolvedTarget.annotation as DataVisualizationAnnotations;

	let chartVisualization, tableVisualization;
	const term = resolvedVisualization?.term;
	for (const visualizationAndPath of getVisualizationsAndPaths(resolvedTarget, visualizationPath, isMacroOrMultipleView)) {
		const { visualization, annotationPath, converterContext, selectionVariant } = visualizationAndPath;
		switch (visualization.term) {
			case UIAnnotationTerms.Chart:
				chartVisualization = shouldCreateTemplateChartVisualization
					? createChartVisualizationForTemplating(converterContext, annotationPath, visualization)
					: createChartVisualization(
							visualization,
							annotationPath,
							converterContext,
							doNotCheckApplySupported,
							isAnnotationOfType<SelectionPresentationVariant>(
								resolvedVisualization,
								UIAnnotationTypes.SelectionPresentationVariantType
							)
								? visualizationPath
								: undefined
					  );
				break;
			case UIAnnotationTerms.LineItem:
			default:
				tableVisualization = Table.createTableVisualization(visualization, annotationPath, converterContext, {
					presentationVariantAnnotation: getDataVisualizationPresentation(visualizationPath, inConverterContext),
					selectionVariantAnnotation: associatedSelectionVariant ?? selectionVariant,
					isCondensedTableLayoutCompliant
				});
				break;
		}
	}

	inConverterContext = resolvedTarget.converterContext;
	const isALP = isAlpAnnotation(inConverterContext);
	if (!term || (isALP && tableVisualization === undefined)) {
		tableVisualization = Table.createDefaultTableVisualization(inConverterContext, isMacroOrMultipleView !== true);
		inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_LINEITEM);
	}
	if (isALP && chartVisualization === undefined) {
		chartVisualization = createBlankChartVisualization(inConverterContext);
		inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_CHART);
	}

	return {
		visualizations: [chartVisualization, tableVisualization].filter(isVisualization),
		annotationPath: inConverterContext.getEntitySetBasedAnnotationPath(resolvedVisualization?.fullyQualifiedName ?? "/"),
		associatedSelectionVariantPath: params.associatedSelectionVariant
			? inConverterContext.getEntitySetBasedAnnotationPath(params.associatedSelectionVariant.fullyQualifiedName)
			: undefined
	};
}

function isVisualization(visualization: unknown): visualization is ChartVisualization | TableVisualization {
	return [VisualizationType.Table, VisualizationType.Chart].includes((visualization as ChartVisualization | TableVisualization)?.type);
}

export function validatePresentationMetaPath(metaPath: string, objectTerm: string): void {
	// perform validation only if annotation set (to avoid backwards compatibility issues for test without annotations)
	if (metaPath.includes(objectTerm.slice(0, objectTerm.lastIndexOf(".")))) {
		const allowedTerms = [UIAnnotationTerms.PresentationVariant, UIAnnotationTerms.SelectionPresentationVariant, objectTerm];
		if (
			!allowedTerms.some((term) => {
				return metaPath.search(new RegExp(`${term}(#|/|$)`)) > -1;
			})
		) {
			throw new Error(`Annotation Path ${metaPath} mentioned in the manifest is not valid for ${objectTerm}`);
		}
	}
}
/**
 * Returns the context of the UI controls (either a UI.LineItem, or a UI.Chart).
 * @param presentationContext Object of the presentation context (either a presentation variant, or a UI.LineItem, or a UI.Chart)
 * @param controlPath Control path
 * @returns The context of the control (either a UI.LineItem, or a UI.Chart)
 */
export function getUiControl(presentationContext: Context, controlPath: string): Context {
	validatePresentationMetaPath(presentationContext.getPath(), controlPath);
	const presentation = MetaModelConverter.convertMetaModelContext(presentationContext),
		model = presentationContext.getModel() as ODataMetaModel;
	if (presentation) {
		if (
			isAnnotationOfType<SelectionPresentationVariant>(presentation, UIAnnotationTypes.SelectionPresentationVariantType) ||
			isAnnotationOfType<PresentationVariant>(presentation, UIAnnotationTypes.PresentationVariantType)
		) {
			let visualizations;
			if (
				isAnnotationOfType<SelectionPresentationVariant>(presentation, UIAnnotationTypes.SelectionPresentationVariantType) &&
				presentation.PresentationVariant
			) {
				visualizations = presentation.PresentationVariant.Visualizations;
			} else if (isAnnotationOfType<PresentationVariant>(presentation, UIAnnotationTypes.PresentationVariantType)) {
				visualizations = presentation.Visualizations;
			}
			if (Array.isArray(visualizations)) {
				for (const visualization of visualizations) {
					if (
						visualization.type == "AnnotationPath" &&
						visualization.value.includes(controlPath) &&
						// check if object exists for PresentationVariant visualization
						!!model.getMetaContext(presentationContext.getPath().split("@")[0] + visualization.value).getObject()
					) {
						controlPath = visualization.value;
						break;
					}
				}
			}
		} else {
			return presentationContext;
		}
	}
	return model.getMetaContext(presentationContext.getPath().split("@")[0] + controlPath);
}
export const annotationExistsInPresentationVariant = function (
	presentationVariantAnnotation: PresentationVariantType,
	annotationTerm: PresentationVisualizationAnnotations
): boolean {
	return presentationVariantAnnotation.Visualizations?.some((visualization) => visualization.value.includes(annotationTerm)) ?? false;
};
const prepareDefaultVisualization = function (
	visualizationType: PresentationVisualizationAnnotations,
	baseVisualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): VisualizationAndPath | undefined {
	const entityType = converterContext.getEntityType();
	const defaultAnnotation =
		visualizationType === UIAnnotationTerms.LineItem ? getDefaultLineItem(entityType) : getDefaultChart(entityType);
	if (defaultAnnotation) {
		return {
			visualization: defaultAnnotation,
			annotationPath: `${baseVisualizationPath}${converterContext.getRelativeAnnotationPath(
				defaultAnnotation.fullyQualifiedName,
				entityType
			)}`,
			converterContext: converterContext
		};
	}
	return undefined;
};
export const isAlpAnnotation = function (converterContext: ConverterContext<PageContextPathTarget>): boolean {
	return (
		converterContext.getManifestWrapper().hasMultipleVisualizations() ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage
	);
};

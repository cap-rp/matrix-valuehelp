import type { EntitySet, NavigationProperty, Singleton } from "@sap-ux/vocabularies-types";
import type { FacetTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import { IssueCategory, IssueCategoryType, IssueSeverity } from "sap/fe/core/converters/helpers/IssueManager";
import type { EnvironmentCapabilities } from "sap/fe/core/services/EnvironmentServiceFactory";
import type { IssueDefinition } from "sap/fe/core/support/Diagnostics";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import ConverterContext from "./ConverterContext";
import type { BaseManifestSettings } from "./ManifestSettings";
import { TemplateType } from "./ManifestSettings";
import { convertTypes, getInvolvedDataModelObjects } from "./MetaModelConverter";
import * as ListReportConverter from "./templates/ListReportConverter";
import * as ObjectPageConverter from "./templates/ObjectPageConverter";

// A context path for a page can either point to an EntitySet, a NavigationProperty or a Singleton
export type PageContextPathTarget = EntitySet | NavigationProperty | Singleton;

export type PageDefinition = {
	template: string;
};

export interface IDiagnostics {
	addIssue(
		issueCategory: IssueCategory,
		issueSeverity: IssueSeverity,
		details: string,
		issueCategoryType?: typeof IssueCategoryType,
		issueSubCategory?: string
	): void;
	getIssues(): IssueDefinition[];
	checkIfIssueExists(
		issueCategory: IssueCategory,
		issueSeverity: IssueSeverity,
		details: string,
		issueCategoryType?: typeof IssueCategoryType,
		issueSubCategory?: string
	): boolean;
}
function handleErrorForCollectionFacets(oFacets: FacetTypes[], oDiagnostics: IDiagnostics, sEntitySetName: string, level: number): void {
	oFacets.forEach((oFacet) => {
		let Message = `For entity set ${sEntitySetName}`;
		if (oFacet?.$Type === UIAnnotationTypes.CollectionFacet && !oFacet?.ID) {
			Message = `${Message}, ` + `level ${level}, the collection facet does not have an ID.`;
			oDiagnostics.addIssue(
				IssueCategory.Facets,
				IssueSeverity.High,
				Message,
				IssueCategoryType,
				IssueCategoryType?.Facets?.MissingID
			);
		}
		if (oFacet?.$Type === UIAnnotationTypes.CollectionFacet && level >= 3) {
			Message = `${Message}, collection facet ${oFacet.Label} is not supported at ` + `level ${level}`;
			oDiagnostics.addIssue(
				IssueCategory.Facets,
				IssueSeverity.Medium,
				Message,
				IssueCategoryType,
				IssueCategoryType?.Facets?.UnSupportedLevel
			);
		}
		if (oFacet?.$Type === UIAnnotationTypes.CollectionFacet && oFacet?.Facets) {
			handleErrorForCollectionFacets(oFacet?.Facets, oDiagnostics, sEntitySetName, ++level);
			level = level - 1;
		}
	});
}
/**
 * Based on a template type, convert the metamodel and manifest definition into a json structure for the page.
 * @param sTemplateType The template type
 * @param oMetaModel The odata model metaModel
 * @param oManifestSettings The current manifest settings
 * @param manifestWrapper
 * @param oDiagnostics The diagnostics wrapper
 * @param sFullContextPath The context path to reach this page
 * @param oCapabilities
 * @param component The template component
 * @returns The target page definition
 */
export function convertPage(
	sTemplateType: TemplateType,
	oMetaModel: ODataMetaModel,
	oManifestSettings: BaseManifestSettings,
	manifestWrapper: ManifestWrapper,
	oDiagnostics: IDiagnostics,
	sFullContextPath: string,
	oCapabilities?: EnvironmentCapabilities,
	component?: TemplateComponent
): object | undefined {
	const oConvertedMetadata = convertTypes(oMetaModel, oCapabilities);
	// TODO: This will have incomplete information because the conversion happens lazily
	oConvertedMetadata.diagnostics.forEach((annotationErrorDetail) => {
		const checkIfIssueExists = oDiagnostics.checkIfIssueExists(
			IssueCategory.Annotation,
			IssueSeverity.High,
			annotationErrorDetail.message
		);
		if (!checkIfIssueExists) {
			oDiagnostics.addIssue(IssueCategory.Annotation, IssueSeverity.High, annotationErrorDetail.message);
		}
	});
	oConvertedMetadata?.entityTypes?.forEach((oEntitySet) => {
		if (oEntitySet?.annotations?.UI?.Facets) {
			handleErrorForCollectionFacets(oEntitySet?.annotations?.UI?.Facets, oDiagnostics, oEntitySet?.name, 1);
		}
	});
	const sTargetEntitySetName = oManifestSettings.entitySet;
	const sContextPath =
		oManifestSettings?.contextPath || (sFullContextPath === "/" ? sFullContextPath + sTargetEntitySetName : sFullContextPath);
	const oContext = oMetaModel.createBindingContext(sContextPath) as Context;
	const oFullContext = getInvolvedDataModelObjects<PageContextPathTarget>(oContext);
	if (oFullContext) {
		let oConvertedPage = {};
		const converterContext = new ConverterContext(oConvertedMetadata, manifestWrapper, oDiagnostics, oFullContext);
		switch (sTemplateType) {
			case TemplateType.ListReport:
			case TemplateType.AnalyticalListPage:
				oConvertedPage = ListReportConverter.convertPage(converterContext, oCapabilities);
				break;
			case TemplateType.ObjectPage:
				oConvertedPage = ObjectPageConverter.convertPage(converterContext, oCapabilities);
				break;
			case TemplateType.FreeStylePage:
				break;
		}
		if (component?.extendPageDefinition) {
			oConvertedPage = component.extendPageDefinition(oConvertedPage, converterContext);
		}
		return oConvertedPage;
	}
	return undefined;
}

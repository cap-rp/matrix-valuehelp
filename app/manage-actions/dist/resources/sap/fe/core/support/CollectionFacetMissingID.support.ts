import { IssueCategory } from "sap/fe/core/converters/helpers/IssueManager";
import type { CoreFacade, DiagnosticRule, IssueManagerFacade } from "sap/fe/core/support/CommonHelper";
import { Audiences, Categories, getIssueByCategory } from "sap/fe/core/support/CommonHelper";
const oCollectionFacetMissingIDIssue: DiagnosticRule = {
	id: "collectionFacetMissingId",
	title: "CollectionFacet: Missing IDs",
	minversion: "1.85",
	audiences: [Audiences.Application],
	categories: [Categories.Usage],
	description: "A collection facet requires an ID in the annotation file to derive a control ID from it.",
	resolution: "Always provide a unique ID to a collection facet.",
	resolutionurls: [{ text: "CollectionFacets", href: "https://ui5.sap.com/#/topic/facfea09018d4376acaceddb7e3f03b6" }],
	check: function (oIssueManager: IssueManagerFacade, oCoreFacade: CoreFacade /*oScope: any*/): void {
		getIssueByCategory(oIssueManager, oCoreFacade, IssueCategory.Facets, "MissingID");
	}
};
export function getRules(): DiagnosticRule[] {
	return [oCollectionFacetMissingIDIssue];
}

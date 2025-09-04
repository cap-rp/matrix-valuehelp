import { IssueCategory } from "sap/fe/core/converters/helpers/IssueManager";
import type { CoreFacade, DiagnosticRule, IssueManagerFacade } from "sap/fe/core/support/CommonHelper";
import { Audiences, Categories, getIssueByCategory } from "sap/fe/core/support/CommonHelper";
const oInvalidAnnotationColumnKey: DiagnosticRule = {
	id: "invalidAnnotationColumnKey",
	title: "AnnotationColumnKey: Invalid Key",
	minversion: "1.98",
	audiences: [Audiences.Application],
	categories: [Categories.Usage],
	description: "The key of the annotation column is needed as a valid identifier in the application manifest.",
	resolution: "A column key set in the application manifest must correspond to an existing annotation column.",
	resolutionurls: [{ text: "InvalidAnnotationColumnKey", href: "https://ui5.sap.com/#/topic/d525522c1bf54672ae4e02d66b38e60c" }],
	check: function (oIssueManager: IssueManagerFacade, oCoreFacade: CoreFacade /*oScope: any*/): void {
		getIssueByCategory(oIssueManager, oCoreFacade, IssueCategory.Manifest, "InvalidKey");
	}
};
export function getRules(): DiagnosticRule[] {
	return [oInvalidAnnotationColumnKey];
}

/**
 * Defines support rules of the ObjectPageHeader control of sap.uxap library.
 */
import type AppComponent from "sap/fe/core/AppComponent";
import { IssueCategory, IssueSeverity } from "sap/fe/core/converters/helpers/IssueManager";
import type { IssueDefinition } from "sap/fe/core/support/Diagnostics";
import type Component from "sap/ui/core/Component";
import SupportLib from "sap/ui/support/library";
export type IssueManagerFacade = {
	addIssue(
		/**
		 * Issue object to be added
		 */
		oIssue: {
			severity: SupportLib.Severity;

			details: string;

			context: {
				id: string;
			};
		}
	): void;
};
export type CoreFacade = {
	getComponents(): Record<string, Component>;
};
export type DiagnosticRule = {
	id: string;
	title: string;
	minversion: string;
	audiences: SupportLib.Audiences[];
	categories: SupportLib.Categories[];
	description: string;
	resolution: string;
	resolutionurls?: {
		text: string;
		href: string;
	}[];
	check: (oIssueManager: IssueManagerFacade, oCoreFacade: CoreFacade) => void;
};
export const Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
	Severity = SupportLib.Severity, // Hint, Warning, Error
	Audiences = SupportLib.Audiences; // Control, Internal, Application

//**********************************************************
// Rule Definitions
//**********************************************************

// Rule checks if objectPage componentContainer height is set

export const getSeverity = function (oSeverity: IssueSeverity): SupportLib.Severity {
	switch (oSeverity) {
		case IssueSeverity.Low:
			return Severity.Low;
		case IssueSeverity.High:
			return Severity.High;
		case IssueSeverity.Medium:
			return Severity.Medium;
		// no default
	}
};

export const getIssueByCategory = function (
	oIssueManager: IssueManagerFacade,
	oCoreFacade: CoreFacade /*oScope: any*/,
	issueCategoryType: IssueCategory,
	issueSubCategoryType?: string
): void {
	const mComponents = oCoreFacade.getComponents();
	let oAppComponent!: AppComponent;
	Object.keys(mComponents).forEach((sKey) => {
		const oComponent = mComponents[sKey];
		if (oComponent?.getMetadata()?.getParent()?.getName() === "sap.fe.core.AppComponent") {
			oAppComponent = oComponent as AppComponent;
		}
	});
	if (oAppComponent) {
		const aIssues = oAppComponent.getDiagnostics().getIssuesByCategory(IssueCategory[issueCategoryType], issueSubCategoryType);

		aIssues.forEach(function (oElement: IssueDefinition) {
			oIssueManager.addIssue({
				severity: getSeverity(oElement.severity),
				details: oElement.details,
				context: {
					id: oElement.category
				}
			});
		});
	}
};

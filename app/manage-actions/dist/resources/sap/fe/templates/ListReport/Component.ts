import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import ListComponent from "sap/fe/templates/ListComponent";
import type { ShareOptions } from "sap/ui/core/Manifest";

@defineUI5Class("sap.fe.templates.ListReport.Component", {
	library: "sap.fe.templates",
	manifest: "json"
})
class ListReportComponent extends ListComponent {
	/**
	 * Define different Page views to display
	 */
	@property({ type: "object" })
	views?: object;

	/**
	 *  Flag to determine whether the iconTabBar is in sticky mode
	 */
	@property({
		type: "boolean",
		defaultValue: true
	})
	stickyMultiTabHeader!: boolean;

	/**
	 * KPIs to display
	 */
	@property({
		type: "object"
	})
	keyPerformanceIndicators?: object;

	/**
	 * Flag to determine whether the template should hide the filter bar
	 */
	@property({
		type: "boolean",
		defaultValue: false
	})
	hideFilterBar!: boolean;

	@property({
		type: "boolean",
		defaultValue: false
	})
	useHiddenFilterBar!: boolean;

	/**
	 * Show or Hide share options. Like, Send Email.
	 */
	@property({
		type: "object"
	})
	share!: ShareOptions;
}

export default ListReportComponent;

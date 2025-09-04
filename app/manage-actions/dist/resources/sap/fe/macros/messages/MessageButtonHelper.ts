import Dialog from "sap/m/Dialog";
import type ManagedObject from "sap/ui/base/ManagedObject";
import UI5Element from "sap/ui/core/Element";
import ValueHelpDialog from "sap/ui/mdc/valuehelp/Dialog";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * Filter function to verify if the control is a part of the current view or not.
 * @param sViewId
 * @returns Filter
 */
function getCheckControlInViewFilter(sViewId: string): Filter {
	const fnTest = function (aControlIds: string[]): boolean {
		if (!aControlIds.length) {
			return false;
		}
		let oControl: ManagedObject | undefined | null = UI5Element.getElementById(aControlIds[0]);
		while (oControl) {
			if (oControl.getId() === sViewId) {
				return true;
			}
			if (oControl instanceof Dialog || oControl instanceof ValueHelpDialog) {
				// messages for sap.m.Dialog should not appear in the message button
				return false;
			}
			oControl = oControl.getParent();
		}
		return false;
	};
	return new Filter({
		path: "controlIds",
		test: fnTest,
		caseSensitive: true
	});
}

/**
 * Filter function to verify if the target is a part of the root view or not.
 * @param rootContextPath
 * @returns Filter
 */
function getHiddenDraftUseCaseFilter(rootContextPath: string): Filter {
	return new Filter({
		path: "target",
		operator: FilterOperator.StartsWith,
		value1: rootContextPath
	});
}
const messageButtonHelper = {
	getCheckControlInViewFilter,
	getHiddenDraftUseCaseFilter
};

export default messageButtonHelper;

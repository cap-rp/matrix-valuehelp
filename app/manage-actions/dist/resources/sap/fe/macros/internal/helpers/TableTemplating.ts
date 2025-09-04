import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, constant, equal, not, resolveBindingString } from "sap/fe/base/BindingToolkit";

/**
 * Method to compute the headerVisible property.
 * @param header Object containing the table properties
 * @param tabTitle Object containing the tab properties
 * @param headerVisible Boolean value to determine if the header is visible
 * @returns Expression binding for headerVisible
 */
export const buildExpressionForHeaderVisible = (
	header: string,
	tabTitle: string,
	headerVisible: boolean
): CompiledBindingToolkitExpression => {
	const headerBindingExpression = resolveBindingString(header);
	const tabTileBindingExpression = resolveBindingString(tabTitle);
	const headerVisibleBindingExpression = constant(headerVisible);
	return compileExpression(and(headerVisibleBindingExpression, not(equal(headerBindingExpression, tabTileBindingExpression))));
};

import type { Action as EdmAction, ActionParameter as EdmActionParameter } from "@sap-ux/vocabularies-types";

export default {
	/**
	 * Returns the name of the action.
	 * @param action The converted action
	 * @returns The name of the action
	 */
	getActionName(action: EdmAction): string {
		return action.isBound
			? action.fullyQualifiedName.replace(/\(.*\)$/g, "") // remove the part related to the overlay
			: action.name;
	},
	/**
	 * Returns the parameters of the action.
	 * On bound actions, the first parameter is the binding parameter and is removed from the list of parameters.
	 * @param action The converted action
	 * @returns The parameters of the action
	 */
	getActionParameters(action: EdmAction): EdmActionParameter[] {
		return action.isBound ? action.parameters.slice(1) : action.parameters;
	},
	/**
	 * Is the action a static action.
	 * A static action is a bound action with its binding parameter set to a collection of entities.
	 * @param action The converted action
	 * @returns True if the action is a static action, false otherwise
	 */
	isStaticAction(action: EdmAction): boolean {
		return action.isBound && !!action.parameters[0]?.isCollection;
	}
};

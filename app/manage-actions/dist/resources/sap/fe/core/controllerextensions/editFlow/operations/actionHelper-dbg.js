/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Returns the name of the action.
     * @param action The converted action
     * @returns The name of the action
     */
    getActionName(action) {
      return action.isBound ? action.fullyQualifiedName.replace(/\(.*\)$/g, "") // remove the part related to the overlay
      : action.name;
    },
    /**
     * Returns the parameters of the action.
     * On bound actions, the first parameter is the binding parameter and is removed from the list of parameters.
     * @param action The converted action
     * @returns The parameters of the action
     */
    getActionParameters(action) {
      return action.isBound ? action.parameters.slice(1) : action.parameters;
    },
    /**
     * Is the action a static action.
     * A static action is a bound action with its binding parameter set to a collection of entities.
     * @param action The converted action
     * @returns True if the action is a static action, false otherwise
     */
    isStaticAction(action) {
      return action.isBound && !!action.parameters[0]?.isCollection;
    }
  };
}, false);
//# sourceMappingURL=actionHelper-dbg.js.map

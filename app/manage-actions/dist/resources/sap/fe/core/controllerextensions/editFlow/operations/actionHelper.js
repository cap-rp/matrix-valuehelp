/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";return{getActionName(e){return e.isBound?e.fullyQualifiedName.replace(/\(.*\)$/g,""):e.name},getActionParameters(e){return e.isBound?e.parameters.slice(1):e.parameters},isStaticAction(e){return e.isBound&&!!e.parameters[0]?.isCollection}}},false);
//# sourceMappingURL=actionHelper.js.map
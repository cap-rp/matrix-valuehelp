/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["../field/FieldRuntimeHelper"],function(e){"use strict";const n={handleChange:async function(n,t){const i=t.getSource(),r=i.getBindingContext().isTransient(),s=t.getParameter("promise")??Promise.resolve("");const o=e.getExtensionController(n);await o.editFlow.syncTask(s);if(r){return}o._sideEffects.prepareDeferredSideEffectsForField(t,true,s)},onValidateFieldGroup:async function(n,t){const i=e.getExtensionController(n);await i._sideEffects.handleFieldGroupChange(t)}};return n},false);
//# sourceMappingURL=MultiValueFieldRuntime.js.map
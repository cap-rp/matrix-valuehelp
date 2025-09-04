/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/mdc/field/MultiValueFieldDelegate"],function(t){"use strict";const n=Object.assign({},t,{_transformConditions:function(t,n,s){const e=[];for(const o of t){const t={};t[n]=o.values[0];if(s){t[s]=o.values[1]}e.push(t)}return e},updateItems:function(t,n,s){const e=s.getBinding("items");const o=s.getBindingInfo("items");const i=o.path;const c=o.template;const a=c.getBindingInfo("key");const r=a&&a.parts[0].path;const f=c.getBindingInfo("description");const u=f&&f.parts[0].path;const d=e.getModel();d.setProperty(i,this._transformConditions(n,r,u))}});return n},false);
//# sourceMappingURL=MultiValueParameterDelegate.js.map
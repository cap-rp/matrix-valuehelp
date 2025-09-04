/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"],function(t){"use strict";var e={};var i=t.isEntitySet;function n(t,e){const n=t.getEntitySet();let r;if(i(n)){r=n.annotations.Capabilities}const s=r?.FilterRestrictions?.RequiredProperties;let o=false;if(s){s.forEach(function(t){if(e===t?.value){o=true}})}return o}e.getIsRequired=n;function r(t,e){let n,r;const s=t.getEntityType();const o=t.getEntitySet();let a;if(i(o)){a=o.annotations.Capabilities}const f=a?.FilterRestrictions?.NonFilterableProperties;const c=s.entityProperties;c.forEach(t=>{const i=t.name;if(i===e){r=t.annotations?.UI?.Hidden?.valueOf()}});if(f&&f.length>0){for(const t of f){const i=t?.value;if(i===e){n=true}}}return n||r}e.isPropertyFilterable=r;return e},false);
//# sourceMappingURL=FilterTemplating.js.map
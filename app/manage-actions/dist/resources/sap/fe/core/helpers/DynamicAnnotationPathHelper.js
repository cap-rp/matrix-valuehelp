/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/BindingParser"],function(s){"use strict";var t={};function r(s,t){if(!s){return null}const e=t.split("/");if(e.length===1){return s[t]}else{return r(s[e[0]],e.splice(1).join("/"))}}function e(t,n){if(t.includes("[")){const i=t.indexOf("[");const u=t.substring(0,i);const l=t.substring(i+1);const a=l.indexOf("]");const o=n.getObject(u);const c=s.parseExpression(l.substring(0,a));if(Array.isArray(o)&&c&&c.result&&c.result.parts&&c.result.parts[0]&&c.result.parts[0].path){let s;let i=false;for(s=0;s<o.length&&!i;s++){const t=r(o[s],c.result.parts[0].path);const e=c.result.formatter(t);if(e){i=true}}if(i){t=e(u+(s-1)+l.substring(a+1),n)}}}return t}t.resolveDynamicExpression=e;return t},false);
//# sourceMappingURL=DynamicAnnotationPathHelper.js.map
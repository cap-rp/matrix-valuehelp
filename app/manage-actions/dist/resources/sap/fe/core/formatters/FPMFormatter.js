/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath","sap/fe/core/helpers/FPMHelper"],function(e,t){"use strict";const o=async function(e,o,r){const n=o.split(".");const s=n.pop();const a=n.join("/");return t.loadModuleAndCallMethod(a,s,e,this.getBindingContext(),r||[])};o.__functionName="sap.fe.core.formatters.FPMFormatter#customBooleanPropertyCheck";const r=function(e){if(r.hasOwnProperty(e)){for(var t=arguments.length,o=new Array(t>1?t-1:0),n=1;n<t;n++){o[n-1]=arguments[n]}return r[e].apply(this,o)}else{return""}};r.customBooleanPropertyCheck=o;e.set("sap.fe.core.formatters.FPMFormatter",r);return r},false);
//# sourceMappingURL=FPMFormatter.js.map
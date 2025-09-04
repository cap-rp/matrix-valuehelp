/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"],function(e){"use strict";var n={};async function r(n){let r;let i;const s=new Promise((e,n)=>{r=e;i=n});if(n.length>0){sap.ui.require(n,function(){for(var e=arguments.length,n=new Array(e),i=0;i<e;i++){n[i]=arguments[i]}r(n)},r=>{e.error(`Error while loading dependency modules: ${n.join(", ")}: ${r}`);i(r)})}else{r([])}return s}n.requireDependencies=r;return n},false);
//# sourceMappingURL=LoaderUtils.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};let r=function(){function r(){this.promise=new Promise((e,r)=>{this.resolver=e;this.rejector=r})}e=r;var t=r.prototype;t.resolve=function e(r){if(this.resolver){this.resolver(r)}};t.reject=function e(r){if(this.rejector){if(r===undefined||typeof r==="string"){this.rejector(new Error(r))}else{this.rejector(r)}}};return r}();e=r;return e},false);
//# sourceMappingURL=PromiseKeeper.js.map
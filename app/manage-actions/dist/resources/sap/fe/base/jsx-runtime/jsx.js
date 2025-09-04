/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/jsx-runtime/jsx-control","sap/fe/base/jsx-runtime/jsx-renderManager","sap/fe/base/jsx-runtime/jsx-xml"],function(e,n,t){"use strict";let r=false;let s;let u={};const i=function(i,f,c){if(!r&&!s){return e(i,f,c,a)}else if(s!==undefined){return n(i,f,c,s)}else{return t(i,f,c,u)}};i.renderUsingRenderManager=function(e,n,t){s=e;const r=t(n);s=undefined;r()};i.defineXMLNamespaceMap=async function(e,n){u=e;const t=await n();u={};return t};i.renderAsXML=function(e){r=true;const n=e();r=false;return n};let a={};i.getContext=function(){return a};i.withContext=function(e,n){a=e;const t=n();a={};return t};return i},false);
//# sourceMappingURL=jsx.js.map
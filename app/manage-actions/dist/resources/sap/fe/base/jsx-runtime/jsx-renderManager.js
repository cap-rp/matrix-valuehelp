/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";const e=function(e,t,n,f){return()=>{if(typeof e==="string"){if(t.ref){f.openStart(e,t.ref)}else{f.openStart(e)}for(const e in t){if(e!=="children"&&e!=="ref"&&e!=="class"){f.attr(e,t[e])}}if(t.class){t.class.split(" ").forEach(e=>{f.class(e)})}f.openEnd()}const n=t.children;if(Array.isArray(n)){n.forEach(e=>{if(typeof e==="string"||typeof e==="number"||typeof e==="boolean"){f.text(e.toString())}else if(typeof e==="function"){e()}else if(e!==undefined){f.renderControl(e)}})}else if(typeof n==="string"||typeof n==="number"||typeof n==="boolean"){f.text(n.toString())}else if(typeof n==="function"){n()}else if(n!==undefined){f.renderControl(n)}if(typeof e==="string"){f.close(e)}}};return e},false);
//# sourceMappingURL=jsx-renderManager.js.map
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([],function(){"use strict";var t={},n=null;t.SEMANTIC_CLASS_NAME={BACKGROUND:"backgroundSemanticColor","BACKGROUND-COLOR":"backgroundSemanticColor",BORDER:"borderSemanticColor","BORDER-COLOR":"borderSemanticColor",TEXT:"textSemanticColor",FILL:"fillSemanticColor",STROKE:"strokeSemanticColor",COLOR:"textSemanticColor"};t.find=function(t,n,r){var e;if(typeof t.find==="function"){return t.find(n,r)}else{for(e=0;e<t.length;e++){if(n.call(r,t[e],e,t)){return t[e]}}return undefined}};t.trimText=function(t,n){if(t&&t.length>n){return t.substring(0,n)+" ... "}return t};t.throttle=(t,r)=>(...e)=>{if(n===null){t(...e);n=setTimeout(()=>{n=null},r)}};return t},true);
//# sourceMappingURL=Utils.js.map
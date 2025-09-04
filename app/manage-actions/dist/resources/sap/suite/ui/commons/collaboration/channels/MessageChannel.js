/*!
* 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
* POC
*/
sap.ui.define(["sap/ui/base/Object"],function(e){"use strict";var n;var s=e.extend("sap.suite.ui.commons.collaboration.channels.MessageChannel",{postMessage:function(e,n){window.parent.postMessage({...e,_fromMessageChannel:true},n||"*")},subscribe:function(e){window.addEventListener("message",function(n){if(n?.data?._fromMessageChannel&&typeof e==="function"){e(n)}})}});return{getInstance:function(){if(!n){n=new s}return Promise.resolve(n)}}});
//# sourceMappingURL=MessageChannel.js.map
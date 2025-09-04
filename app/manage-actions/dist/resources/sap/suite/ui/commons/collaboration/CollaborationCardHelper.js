/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/base/Object","sap/base/Log"],function(t,e){"use strict";var a="/sap/opu/odata4/sap/aps_ui_card_srv/srvd_a2x/sap/";var r=a+"aps_ui_card/0001/";var n="Card";var o=a+"aps_ui_card/0001/"+n;var i="POST";var s="HEAD";var c=e.getLogger("sap.suite.ui.commons.collaboration.CollaborationCardHelper");var d=t.extend("sap.suite.ui.commons.collaboration.CollaborationCardHelper");d.fetchCSRFToken=function(){return fetch(r,{method:s,headers:{"X-CSRF-Token":"Fetch"}}).then(function(t){var e=t.headers.get("X-CSRF-Token");if(t.ok&&e){return e}return undefined})};d.postCard=function(t,e){return this.fetchCSRFToken().then(function(a){let r=JSON.stringify(e);try{r=btoa(JSON.stringify(e))}catch(t){c.error("Error while encoding the card content to base64 so original content passed to API: "+t)}var n=JSON.stringify({content:r,card_id:t});return fetch(o,{method:i,headers:{"X-CSRF-Token":a,"content-type":"application/json;odata.metadata=minimal;charset=utf-8"},body:n}).then(function(t){return t.json()})})};return d});
//# sourceMappingURL=CollaborationCardHelper.js.map
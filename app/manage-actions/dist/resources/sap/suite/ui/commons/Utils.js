/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/Device"],function(e){"use strict";var t={};t._setupMobileDraggable=function(t){if(e.browser.mobile){var n=function(e,t){if(e.originalEvent.touches.length>1){return}e.preventDefault();var n=e.originalEvent.changedTouches[0],u=document.createEvent("MouseEvents");u.initMouseEvent(t,true,true,window,1,n.screenX,n.screenY,n.clientX,n.clientY,false,false,false,false,0,null);e.target.dispatchEvent(u)};var u=false;t.bind({touchstart:function(e){if(u){return}u=true;n(e,"mouseover");n(e,"mousemove");n(e,"mousedown")},touchmove:function(e){if(!u){return}n(e,"mousemove")},touchend:function(e){if(!u){return}n(e,"mouseup");n(e,"mouseout");n(e,"click");u=false}})}};return t},true);
//# sourceMappingURL=Utils.js.map
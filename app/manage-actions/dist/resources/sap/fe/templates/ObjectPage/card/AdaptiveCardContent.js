/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};function t(e,t){const i=e??[];return{type:"ColumnSet",columns:[...i],isVisible:t??undefined}}e.getColumnSet=t;function i(e){const t=e?.items??[];return{type:"Column",items:[...t],verticalContentAlignment:"Top",width:e?.width??1,isVisible:e?.visible??undefined}}e.getColumn=i;function n(e){return{type:"Image",url:e,size:"Small"}}e.getImage=n;function l(e){return{type:"TextBlock",size:e?.size??"Small",weight:e?.weight??"Default",text:e?.text,maxLines:e?.maxLines??0,wrap:e?.wrap??false,spacing:e?.spacing??"Default",isVisible:e?.visible??undefined,color:e?.color??"Default",isSubtle:e.isSubtle??undefined,$when:e?.$when??undefined}}e.getTextBlock=l;return e},false);
//# sourceMappingURL=AdaptiveCardContent.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";const e={scrollTableToRow:function(e,n){const t=e.getRowBinding();const o=function(){const o=t.getAllCurrentContexts().find(e=>e.getPath()===n);if(o&&o.getIndex()!==undefined){e.scrollToIndex(o.getIndex())}};if((e.getGroupConditions()===undefined||e.getGroupConditions()?.groupLevels?.length===0)&&t){const e=t.getAllCurrentContexts();if(e.length===0&&t.getLength()>0||e.some(function(e){return e===undefined})){t.attachEventOnce("dataReceived",o)}else{o()}}}};return e},false);
//# sourceMappingURL=TableScroller.js.map
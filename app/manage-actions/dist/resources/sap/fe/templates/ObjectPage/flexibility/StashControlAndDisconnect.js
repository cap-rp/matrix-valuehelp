/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/fl/LayerUtils","sap/ui/fl/changeHandler/StashControl"],function(e,n){"use strict";var t={};let a=function(){function a(){}t=a;a.applyChange=async function t(a,i,r){await n.applyChange(a,i,r);if(!e.isDeveloperLayer(a.getLayer())){r.modifier.setProperty(i,"_disconnected",true)}};a.revertChange=async function t(a,i,r){await n.revertChange(a,i,r);if(!e.isDeveloperLayer(a.getLayer())){r.modifier.setProperty(i,"_disconnected",false)}};a.completeChangeContent=function e(){};a.getCondenserInfo=function e(t){return n.getCondenserInfo(t)};a.getChangeVisualizationInfo=function e(t,a){return n.getChangeVisualizationInfo(t,a)};return a}();t=a;return t},false);
//# sourceMappingURL=StashControlAndDisconnect.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/EventBus"],function(e){"use strict";var t={};let n=function(e){e["action"]="actions";e["standardAction"]="standardActions";return e}({});t.TriggerType=n;let a=function(e){e["save"]="save";return e}({});t.StandardActions=a;const r="sap.feedback";const i="inapp.feature";function c(t,n,a){const c={areaId:t,triggerName:n,payload:a};e.getInstance().publish(r,i,c)}t.triggerSurvey=c;function s(e,t,n){const a=e.getViewData()?.content?.feedback;const r=a?.[n]?.[t];if(r){c(r.areaId,r.triggerName,r.payload)}}t.triggerConfiguredSurvey=s;return t},false);
//# sourceMappingURL=Feedback.js.map
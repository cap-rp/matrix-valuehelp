/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/EventBus"], function (EventBus) {
  "use strict";

  var _exports = {};
  let TriggerType = /*#__PURE__*/function (TriggerType) {
    TriggerType["action"] = "actions";
    TriggerType["standardAction"] = "standardActions";
    return TriggerType;
  }({});
  _exports.TriggerType = TriggerType;
  let StandardActions = /*#__PURE__*/function (StandardActions) {
    StandardActions["save"] = "save";
    return StandardActions;
  }({});
  /**
   * Asking user for feedback
   *
   */
  _exports.StandardActions = StandardActions;
  const channel = "sap.feedback";
  const feature = "inapp.feature";

  /**
   * Triggers a feedback survey.
   * @param areaId The area id of the application.
   * @param triggerName The name of the trigger.
   * @param payload A flat list of key/values to be passed to the survey.
   */
  function triggerSurvey(areaId, triggerName, payload) {
    const parameters = {
      areaId: areaId,
      triggerName: triggerName,
      payload: payload
    };
    EventBus.getInstance().publish(channel, feature, parameters);
  }

  /**
   * Triggers a feedback survey configured for a given action on the current page.
   * @param view The view which is checked for a feedback configuration.
   * @param action The name of the action.
   * @param triggerType The trigger type of the action (actions|standardActions)
   */
  _exports.triggerSurvey = triggerSurvey;
  function triggerConfiguredSurvey(view, action, triggerType) {
    const feedbackConfig = view.getViewData()?.content?.feedback;
    const surveyConfig = feedbackConfig?.[triggerType]?.[action];
    if (surveyConfig) {
      triggerSurvey(surveyConfig.areaId, surveyConfig.triggerName, surveyConfig.payload);
    }
  }
  _exports.triggerConfiguredSurvey = triggerConfiguredSurvey;
  return _exports;
}, false);
//# sourceMappingURL=Feedback-dbg.js.map

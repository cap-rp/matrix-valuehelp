/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/ui/core/Lib"], function (ObjectPath, CollaborationCommon, Library) {
  "use strict";

  var _exports = {};
  var getActivityKeyFromPath = CollaborationCommon.getActivityKeyFromPath;
  /**
   * Collection of formatters needed for the collaboration draft.
   * @param {object} this The context
   * @param {string} sName The inner function name
   * @param {object[]} oArgs The inner function parameters
   * @returns {object} The value from the inner function
   */
  const collaborationFormatters = function (sName) {
    if (collaborationFormatters.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return collaborationFormatters[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  const hasCollaborationActivity = function (activities) {
    return !!getCollaborationActivity(activities, this);
  };
  hasCollaborationActivity.__functionName = "sap.fe.core.formatters.CollaborationFormatter#hasCollaborationActivity";
  _exports.hasCollaborationActivity = hasCollaborationActivity;
  const getCollaborationActivityInitials = function (activities) {
    const activity = getCollaborationActivity(activities, this);
    return activity?.initials;
  };
  getCollaborationActivityInitials.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityInitials";
  _exports.getCollaborationActivityInitials = getCollaborationActivityInitials;
  const getCollaborationActivityColor = function (activities) {
    const activity = getCollaborationActivity(activities, this);
    return activity?.color;
  };
  getCollaborationActivityColor.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityColor";
  _exports.getCollaborationActivityColor = getCollaborationActivityColor;
  function getCollaborationActivity(activities, control) {
    const path = control?.getBindingContext()?.getPath();
    if (!path) {
      return undefined;
    }
    const activityKey = getActivityKeyFromPath(path);
    if (activities && activities.length > 0) {
      return activities.find(activity => {
        return activity.key === activityKey;
      });
    } else {
      return undefined;
    }
  }

  /**
   * Compute the Invitation dialog title based on the underlying resource bundle.
   * @param args The inner function parameters
   * @returns The dialog title
   */
  const getFormattedText = function () {
    const textId = arguments.length <= 0 ? undefined : arguments[0];
    const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
    const params = [];
    for (let i = 1; i < arguments.length; i++) {
      params.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
    }
    return resourceBundle.getText(textId, params);
  };
  getFormattedText.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getFormattedText";
  _exports.getFormattedText = getFormattedText;
  collaborationFormatters.hasCollaborationActivity = hasCollaborationActivity;
  collaborationFormatters.getCollaborationActivityInitials = getCollaborationActivityInitials;
  collaborationFormatters.getCollaborationActivityColor = getCollaborationActivityColor;
  collaborationFormatters.getFormattedText = getFormattedText;
  ObjectPath.set("sap.fe.core.formatters.CollaborationFormatter", collaborationFormatters);
  return collaborationFormatters;
}, false);
//# sourceMappingURL=CollaborationFormatter-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/message/MessageType"], function (MessageType) {
  "use strict";

  var _exports = {};
  /**
   * Gets a MessageType enum value from a CriticalityType enum value.
   * @param criticalityEnum The CriticalityType enum value
   * @returns Returns the MessageType enum value
   */
  function getMessageTypeFromCriticalityType(criticalityEnum) {
    let messageType;
    switch (criticalityEnum) {
      case "UI.CriticalityType/Negative":
      case "UI.CriticalityType/VeryNegative":
        messageType = MessageType.Error;
        break;
      case "UI.CriticalityType/Critical":
        messageType = MessageType.Warning;
        break;
      case "UI.CriticalityType/Positive":
      case "UI.CriticalityType/VeryPositive":
        messageType = MessageType.Success;
        break;
      case "UI.CriticalityType/Information":
        messageType = MessageType.Information;
        break;
      case "UI.CriticalityType/Neutral":
      default:
        messageType = MessageType.None;
    }
    return messageType;
  }
  _exports.getMessageTypeFromCriticalityType = getMessageTypeFromCriticalityType;
  return _exports;
}, false);
//# sourceMappingURL=Criticality-dbg.js.map

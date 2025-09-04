/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/message/MessageType"],function(e){"use strict";var i={};function a(i){let a;switch(i){case"UI.CriticalityType/Negative":case"UI.CriticalityType/VeryNegative":a=e.Error;break;case"UI.CriticalityType/Critical":a=e.Warning;break;case"UI.CriticalityType/Positive":case"UI.CriticalityType/VeryPositive":a=e.Success;break;case"UI.CriticalityType/Information":a=e.Information;break;case"UI.CriticalityType/Neutral":default:a=e.None}return a}i.getMessageTypeFromCriticalityType=a;return i},false);
//# sourceMappingURL=Criticality.js.map
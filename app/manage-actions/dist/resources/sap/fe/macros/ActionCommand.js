/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit","sap/fe/core/controls/CommandExecution","sap/fe/base/jsx-runtime/jsx"],function(e,n,i){"use strict";var o={};var a=e.resolveBindingString;function s(e,o,s){let t;let d;const l=o.visible?a(o.visible,"boolean"):undefined;const c=o.enabled?a(o.enabled,"boolean"):undefined;switch(o.type){case"ForAction":t=s.onExecuteAction;d=s.isActionEnabled!==undefined?a(s.isActionEnabled,"boolean"):c;break;case"ForNavigation":t=s.onExecuteIBN;d=s.isIBNEnabled!==undefined?a(s.isIBNEnabled,"boolean"):c;break;default:t=s.onExecuteManifest;d=s.isEnabled!==undefined?a(s.isEnabled,"boolean"):c}return i(n,{"core:require":"{FPM: 'sap/fe/core/helpers/FPMHelper'}",execute:t,enabled:d,visible:s.visible??l,command:e??o.command})}o.getCommandExecutionForAction=s;return o},false);
//# sourceMappingURL=ActionCommand.js.map
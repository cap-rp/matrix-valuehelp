/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button","sap/m/Dialog","sap/m/Text","sap/ui/core/library","sap/fe/base/jsx-runtime/jsx","sap/fe/base/jsx-runtime/jsxs"],function(e,t,s,i,n,a){"use strict";var o={};var p=i.ValueState;let r=function(){function i(i){this.containingView=i;this.dialog=a(t,{title:"{sap.fe.i18n>WARNING}",type:"Message",state:p.Warning,children:[{content:n(s,{text:"{sap.fe.i18n>C_INLINE_EDIT_DRAFT_EXISTS}"})},{beginButton:n(e,{type:"Emphasized",text:"{sap.fe.i18n>C_COMMON_DIALOG_OK}",press:()=>this.close()})}]});i.addDependent(this.dialog)}o=i;var r=i.prototype;r.open=function e(){this.dialog.open()};r.close=function e(){this.dialog.close();this.dialog.destroy()};return i}();o=r;return o},false);
//# sourceMappingURL=DraftExistsDialog.js.map
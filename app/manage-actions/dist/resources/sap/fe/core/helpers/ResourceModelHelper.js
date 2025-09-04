/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/ui/core/Component"],function(e,t){"use strict";var o={};function n(e){if(e.isA("sap.ui.core.mvc.Controller")||e.isA("sap.ui.core.mvc.ControllerExtension")){return e.getView()?.getModel("sap.fe.i18n")}else{let o=e.getModel("sap.fe.i18n");if(!o){o=t.getOwnerComponentFor(e)?.getModel("sap.fe.i18n")}return o}}o.getResourceModel=n;function r(t,o){const r=/{([A-Za-z0-9_.|@]+)>([A-Za-z0-9_.|]+)}/.exec(t);if(r){try{if(r[1]==="sap.fe.i18n"){return n(o).getText(r[2])}else{const e=o.getModel(r[1]).getResourceBundle();return e.getText(r[2])}}catch(o){e.info(`Unable to retrieve localized text ${t}`)}}return t}o.getLocalizedText=r;return{getResourceModel:n,getLocalizedText:r}},false);
//# sourceMappingURL=ResourceModelHelper.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/mvc/View","sap/m/App"],function(e,t){"use strict";return e.extend("sap.collaboration.components.fiori.feed.app.AppView",{getControllerName:function(){return"sap.collaboration.components.fiori.feed.app.App"},createContent:function(e){this.sPrefixId=this.getViewData().controlId;this.oApp=new t(this.sPrefixId+"app");return this.oApp}})});
//# sourceMappingURL=AppView.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/mvc/View","sap/m/SplitApp"],function(t,e){"use strict";return t.extend("sap.collaboration.components.fiori.feed.splitApp.SplitAppView",{getControllerName:function(){return"sap.collaboration.components.fiori.feed.splitApp.SplitApp"},createContent:async function(t){t.createMasterDetail();this.sPrefixId=this.getViewData().controlId;this.oSplitApp=new e(this.sPrefixId+"splitApp");return this.oSplitApp}})});
//# sourceMappingURL=SplitAppView.js.map
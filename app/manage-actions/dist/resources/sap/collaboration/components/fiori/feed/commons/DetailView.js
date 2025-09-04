/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/mvc/View","sap/m/Page","sap/m/ScrollContainer"],function(e,t,i){"use strict";return e.extend("sap.collaboration.components.fiori.feed.commons.DetailView",{getControllerName:function(){return"sap.collaboration.components.fiori.feed.commons.Detail"},createContent:function(e){var n=this.getViewData().langBundle;this.sPrefixId=this.getViewData().controlId;this.oDetailPage=new t(this.sPrefixId+"feedDetailsPage",{title:n.getText("FRV_DOMAIN_DATA_FEED_TYPES_FOLLOWS"),enableScrolling:false,content:[new i(this.sPrefixId+"widgetContainer",{width:"100%",height:"100%",horizontal:false,vertical:false})]});return this.oDetailPage}})});
//# sourceMappingURL=DetailView.js.map
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/macros/insights/CommonInsightsHelper","sap/fe/core/CommonUtils"],function(e,t,a){"use strict";var n={};var o=t.showGenericErrorMessage;const r={INTEGRATION:"integration"};n.RetrieveCardTypes=r;const s={async collectAvailableCards(t){const n=this.base.getView();const s=n.getController();const i=s.getOwnerComponent().getAppComponent();const c=a.getIsEditable(n);const l=!c?await i.getCollaborationManagerService().getDesignTimeCard(r.INTEGRATION):undefined;if(l){const a=()=>{try{if(l){i.getCollaborationManagerService().publishCard(l);return}}catch(t){o(n);e.error(t)}};t.push({card:l,title:s._getPageTitleInformation().subtitle||"",callback:a})}}};return s},false);
//# sourceMappingURL=CollaborationManager.js.map
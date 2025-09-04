/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager","sap/ui/support/library"],function(e,t){"use strict";var s={};var r=e.IssueSeverity;var a=e.IssueCategory;const i=t.Categories,n=t.Severity,o=t.Audiences;s.Categories=i;s.Audiences=o;s.Severity=n;const c=function(e){switch(e){case r.Low:return n.Low;case r.High:return n.High;case r.Medium:return n.Medium}};s.getSeverity=c;const u=function(e,t,s,r){const i=t.getComponents();let n;Object.keys(i).forEach(e=>{const t=i[e];if(t?.getMetadata()?.getParent()?.getName()==="sap.fe.core.AppComponent"){n=t}});if(n){const t=n.getDiagnostics().getIssuesByCategory(a[s],r);t.forEach(function(t){e.addIssue({severity:c(t.severity),details:t.details,context:{id:t.category}})})}};s.getIssueByCategory=u;return s},false);
//# sourceMappingURL=CommonHelper.js.map
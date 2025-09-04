/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager", "sap/ui/support/library"], function (IssueManager, SupportLib) {
  "use strict";

  var _exports = {};
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  /**
   * Defines support rules of the ObjectPageHeader control of sap.uxap library.
   */
  const Categories = SupportLib.Categories,
    // Accessibility, Performance, Memory, ...
    Severity = SupportLib.Severity,
    // Hint, Warning, Error
    Audiences = SupportLib.Audiences; // Control, Internal, Application

  //**********************************************************
  // Rule Definitions
  //**********************************************************

  // Rule checks if objectPage componentContainer height is set
  _exports.Categories = Categories;
  _exports.Audiences = Audiences;
  _exports.Severity = Severity;
  const getSeverity = function (oSeverity) {
    switch (oSeverity) {
      case IssueSeverity.Low:
        return Severity.Low;
      case IssueSeverity.High:
        return Severity.High;
      case IssueSeverity.Medium:
        return Severity.Medium;
      // no default
    }
  };
  _exports.getSeverity = getSeverity;
  const getIssueByCategory = function (oIssueManager, oCoreFacade, issueCategoryType, issueSubCategoryType) {
    const mComponents = oCoreFacade.getComponents();
    let oAppComponent;
    Object.keys(mComponents).forEach(sKey => {
      const oComponent = mComponents[sKey];
      if (oComponent?.getMetadata()?.getParent()?.getName() === "sap.fe.core.AppComponent") {
        oAppComponent = oComponent;
      }
    });
    if (oAppComponent) {
      const aIssues = oAppComponent.getDiagnostics().getIssuesByCategory(IssueCategory[issueCategoryType], issueSubCategoryType);
      aIssues.forEach(function (oElement) {
        oIssueManager.addIssue({
          severity: getSeverity(oElement.severity),
          details: oElement.details,
          context: {
            id: oElement.category
          }
        });
      });
    }
  };
  _exports.getIssueByCategory = getIssueByCategory;
  return _exports;
}, false);
//# sourceMappingURL=CommonHelper-dbg.js.map

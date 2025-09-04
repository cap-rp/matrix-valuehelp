/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  let Diagnostics = /*#__PURE__*/function () {
    function Diagnostics() {
      this._issues = [];
    }
    var _proto = Diagnostics.prototype;
    _proto.addIssue = function addIssue(issueCategory, issueSeverity, details, issueCategoryType, subCategory) {
      const checkIfIssueExists = this.checkIfIssueExists(issueCategory, issueSeverity, details, issueCategoryType, subCategory);
      if (!checkIfIssueExists) {
        this._issues.push({
          category: issueCategory,
          severity: issueSeverity,
          details: details,
          subCategory: subCategory
        });
      }
    };
    _proto.getIssues = function getIssues() {
      return this._issues;
    };
    _proto.getIssuesByCategory = function getIssuesByCategory(inCategory, subCategory) {
      if (subCategory) {
        return this._issues.filter(issue => issue.category === inCategory && issue.subCategory === subCategory);
      } else {
        return this._issues.filter(issue => issue.category === inCategory);
      }
    };
    _proto.checkIfIssueExists = function checkIfIssueExists(inCategory, severity, details, issueCategoryType, issueSubCategory) {
      if (issueCategoryType && issueCategoryType[inCategory] && issueSubCategory) {
        return this._issues.some(issue => issue.category === inCategory && issue.severity === severity && issue.details.replace(/\n/g, "") === details.replace(/\n/g, "") && issue.subCategory === issueSubCategory);
      }
      return this._issues.some(issue => issue.category === inCategory && issue.severity === severity && issue.details.replace(/\n/g, "") === details.replace(/\n/g, ""));
    };
    return Diagnostics;
  }();
  return Diagnostics;
}, false);
//# sourceMappingURL=Diagnostics-dbg.js.map

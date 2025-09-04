/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Dialog", "sap/ui/core/Element", "sap/ui/mdc/valuehelp/Dialog", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (Dialog, UI5Element, ValueHelpDialog, Filter, FilterOperator) {
  "use strict";

  /**
   * Filter function to verify if the control is a part of the current view or not.
   * @param sViewId
   * @returns Filter
   */
  function getCheckControlInViewFilter(sViewId) {
    const fnTest = function (aControlIds) {
      if (!aControlIds.length) {
        return false;
      }
      let oControl = UI5Element.getElementById(aControlIds[0]);
      while (oControl) {
        if (oControl.getId() === sViewId) {
          return true;
        }
        if (oControl instanceof Dialog || oControl instanceof ValueHelpDialog) {
          // messages for sap.m.Dialog should not appear in the message button
          return false;
        }
        oControl = oControl.getParent();
      }
      return false;
    };
    return new Filter({
      path: "controlIds",
      test: fnTest,
      caseSensitive: true
    });
  }

  /**
   * Filter function to verify if the target is a part of the root view or not.
   * @param rootContextPath
   * @returns Filter
   */
  function getHiddenDraftUseCaseFilter(rootContextPath) {
    return new Filter({
      path: "target",
      operator: FilterOperator.StartsWith,
      value1: rootContextPath
    });
  }
  const messageButtonHelper = {
    getCheckControlInViewFilter,
    getHiddenDraftUseCaseFilter
  };
  return messageButtonHelper;
}, false);
//# sourceMappingURL=MessageButtonHelper-dbg.js.map

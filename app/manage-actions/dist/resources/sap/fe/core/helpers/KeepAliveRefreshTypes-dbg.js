/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Enumeration for supported refresh strategy type
   */
  let RefreshStrategyType = /*#__PURE__*/function (RefreshStrategyType) {
    RefreshStrategyType["Self"] = "self";
    RefreshStrategyType["IncludingDependents"] = "includingDependents";
    return RefreshStrategyType;
  }({});
  /**
   * Configuration of a RefreshStrategy
   */
  /**
   * Configuration of a RefreshStrategies
   */
  /**
   * Configuration for hash with semanticObject and action
   */
  _exports.RefreshStrategyType = RefreshStrategyType;
  /**
   * Path used to store information
   */
  const PATH_TO_STORE = "/refreshStrategyOnAppRestore";
  _exports.PATH_TO_STORE = PATH_TO_STORE;
  return _exports;
}, false);
//# sourceMappingURL=KeepAliveRefreshTypes-dbg.js.map

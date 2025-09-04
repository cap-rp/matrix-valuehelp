/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Map a route's target property - from "sap.ui5/routing/routes/[]/target" - to a list of target names.
   * @example
   * getRouteTargetNames("myTarget");
   * // ["myTarget"]
   *
   * getRouteTargetNames(["myTarget1", "myTarget2"]);
   * // ["myTarget1", "myTarget2"]
   *
   * getRouteTargetNames(["myTarget1", { name: "myTarget2" }]);
   * // ["myTarget1", "myTarget2"]
   * @see ManifestContentUI5
   * @param target The route's "target" property value
   * @returns The target names
   */
  function getRouteTargetNames(target) {
    return (Array.isArray(target) ? target : [target]).map(getRouteTargetName);
  }

  /**
   * Map one route target to the target name.
   * @example
   * getRouteTargetName("myTarget");
   * // "myTarget"
   *
   * getRouteTargetName({ name: "myTarget" });
   * // "myTarget"
   * @param target A route target manifest configuration entry
   * @returns The target name
   */
  _exports.getRouteTargetNames = getRouteTargetNames;
  function getRouteTargetName(target) {
    return typeof target === "object" ? target.name : target;
  }
  _exports.getRouteTargetName = getRouteTargetName;
  return _exports;
}, false);
//# sourceMappingURL=ManifestHelper-dbg.js.map

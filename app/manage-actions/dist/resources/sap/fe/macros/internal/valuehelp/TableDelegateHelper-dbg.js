/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  /**
   * collection of helper functions from "sap/fe/macros/internal/valuehelp/TableDelegate"
   * set into helper file for easy test accsess
   */
  /**
   * Identifies if the given property is filterable based on the sort restriction information.
   * @param filterRestrictionsInfo The filter restriction information from the restriction annotation.
   * @param property The target property.
   * @returns `true` if the given property is filterable.
   * @private
   */
  function isFilterableProperty(filterRestrictionsInfo, property) {
    const propertyPath = getPath(property);
    return propertyPath && filterRestrictionsInfo?.propertyInfo.hasOwnProperty(propertyPath) ? filterRestrictionsInfo.propertyInfo[propertyPath].filterable : property.filterable ?? true;
  }

  /**
   * Identifies if the given property is sortable based on the sort restriction information.
   * @param sortRestrictionsInfo The sort restriction information from the restriction annotation.
   * @param property The target property.
   * @returns `true` if the given property is sortable.
   * @private
   */
  _exports.isFilterableProperty = isFilterableProperty;
  function isSortableProperty(sortRestrictionsInfo, property) {
    const propertyPath = getPath(property);
    return propertyPath && sortRestrictionsInfo.propertyInfo[propertyPath] ? sortRestrictionsInfo.propertyInfo[propertyPath].sortable : property.sortable ?? true;
  }

  /**
   * Provides the property path of a given property or custom data from the ValueHelp.
   * @param property The target property or custom data from the ValueHelp.
   * @returns The property path.
   */
  _exports.isSortableProperty = isSortableProperty;
  function getPath(property) {
    return isProperty(property) ? property.name : property.path;
  }
  _exports.getPath = getPath;
  return _exports;
}, false);
//# sourceMappingURL=TableDelegateHelper-dbg.js.map

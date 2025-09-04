/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/CustomData", "sap/fe/base/jsx-runtime/jsx"], function (CustomData, _jsx) {
  "use strict";

  var _exports = {};
  /**
   * Create a custom data object.
   * @param key
   * @param value
   * @returns The CustomData object or undefined if the value is undefined
   */
  function createCustomData(key, value) {
    return value !== undefined ? _jsx(CustomData, {
      value: value
    }, key) : undefined;
  }

  /**
   * Create an array of custom data objects.
   * @param datas
   * @returns The array of CustomData objects
   */
  _exports.createCustomData = createCustomData;
  function createCustomDatas(datas) {
    const customDatas = datas.map(data => createCustomData(data.key, data.value)).filter(data => data !== undefined);
    return customDatas.length > 0 ? customDatas : undefined;
  }
  _exports.createCustomDatas = createCustomDatas;
  return _exports;
}, false);
//# sourceMappingURL=TSXUtils-dbg.js.map

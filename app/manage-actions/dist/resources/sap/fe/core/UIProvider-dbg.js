/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  let currentFactory;
  function getCoreUIFactory() {
    if (currentFactory === undefined) {
      throw new Error("sap.fe.core UI provider not defined");
    }
    return currentFactory;
  }
  _exports.getCoreUIFactory = getCoreUIFactory;
  function setCoreUIFactory(provider) {
    currentFactory = provider;
  }
  _exports.setCoreUIFactory = setCoreUIFactory;
  return _exports;
}, false);
//# sourceMappingURL=UIProvider-dbg.js.map

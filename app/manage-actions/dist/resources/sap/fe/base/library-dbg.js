/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Lib"], function (Library) {
  "use strict";

  var _exports = {};
  /**
   * Library providing the base functionality of the runtime for SAP Fiori elements for OData V4.
   * @namespace
   * @public
   */
  const feBaseNamespace = "sap.fe.base";
  _exports.feBaseNamespace = feBaseNamespace;
  const thisLib = Library.init({
    name: "sap.fe.base",
    apiVersion: 2,
    dependencies: ["sap.ui.core"],
    types: [],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    noLibraryCSS: true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map

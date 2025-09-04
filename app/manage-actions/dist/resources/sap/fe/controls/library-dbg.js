/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/library", "sap/fe/controls/shortcuts/ShortcutExplanationProvider", "sap/m/library", "sap/ui/core/Lib", "sap/ui/unified/library"], function (_library, ShortcutExplanationProvider, _library2, Library, _library3) {
  "use strict";

  var _exports = {};
  /**
   * Library providing a set of controls for the Fiori Elements application.
   * Those controls might also be shared with other applications (v2 for instance)
   * @namespace
   */
  const feControlsNamespace = "sap.fe.controls";
  _exports.feControlsNamespace = feControlsNamespace;
  const thisLib = Library.init({
    name: "sap.fe.controls",
    apiVersion: 2,
    dependencies: ["sap.ui.core", "sap.fe.base", "sap.m", "sap.ui.unified"],
    types: [],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    noLibraryCSS: false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
  ShortcutExplanationProvider.getInstance();
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map

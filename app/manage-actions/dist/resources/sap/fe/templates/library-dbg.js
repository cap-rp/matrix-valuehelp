/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/f/library", "sap/fe/core/library", "sap/fe/macros/library", "sap/fe/templates/ListReport/view/fragments/MultipleMode.block", "sap/ui/base/DataType", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/fl/library"], function (_library, _library2, _library3, MultipleModeBlock, DataType, Library, _library4, _library5) {
  "use strict";

  var _exports = {};
  /**
   * Library providing the official templates supported by SAP Fiori elements.
   * @namespace
   * @public
   */
  const templatesNamespace = "sap.fe.templates";

  /**
   * @namespace
   * @public
   */
  _exports.templatesNamespace = templatesNamespace;
  const templatesLRNamespace = "sap.fe.templates.ListReport";

  /**
   * @namespace
   * @public
   */
  _exports.templatesLRNamespace = templatesLRNamespace;
  const templatesOPNamespace = "sap.fe.templates.ObjectPage";
  _exports.templatesOPNamespace = templatesOPNamespace;
  const thisLib = Library.init({
    name: "sap.fe.templates",
    apiVersion: 2,
    dependencies: ["sap.ui.core", "sap.fe.core", "sap.fe.macros", "sap.m", "sap.f", "sap.ui.mdc", "sap.ui.fl"],
    types: ["sap.fe.templates.ObjectPage.SectionLayout"],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    noLibraryCSS: true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
  if (!thisLib.ObjectPage) {
    thisLib.ObjectPage = {};
  }
  thisLib.ObjectPage.SectionLayout = {
    /**
     * All sections are shown in one page
     * @public
     */
    Page: "Page",
    /**
     * All top-level sections are shown in an own tab
     * @public
     */
    Tabs: "Tabs"
  };
  DataType.registerEnum("sap.fe.templates.ObjectPage.SectionLayout", thisLib.ObjectPage.SectionLayout);
  MultipleModeBlock.register();
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map

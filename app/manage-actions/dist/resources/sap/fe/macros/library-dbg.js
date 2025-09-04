/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/f/library", "sap/fe/controls/library", "sap/fe/core/AppComponent", "sap/fe/core/library", "sap/fe/macros/coreUI/factory", "sap/fe/macros/filter/FilterOperatorUtils", "sap/fe/macros/filter/type/MultiValue", "sap/fe/macros/filter/type/Range", "sap/fe/macros/formatters/TableFormatter", "sap/fe/macros/macroLibrary", "sap/ui/base/DataType", "sap/ui/core/CustomData", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/library", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/field/ConditionsType", "sap/ui/mdc/library", "sap/ui/unified/library"], function (Log, _library, _library2, AppComponent, _library3, _factory, FilterOperatorUtils, _MultiValue, _Range, _TableFormatter, _macroLibrary, DataType, CustomData, Fragment, Library, _XMLTemplateProcessor, _library4, XMLPreprocessor, _ConditionsType, _library5, _library6) {
  "use strict";

  var _exports = {};
  /**
   * Library containing the building blocks for SAP Fiori elements.
   * @namespace
   * @public
   */
  const macrosNamespace = "sap.fe.macros";

  // library dependencies
  _exports.macrosNamespace = macrosNamespace;
  const thisLib = Library.init({
    name: "sap.fe.macros",
    apiVersion: 2,
    dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.fe.controls", "sap.m", "sap.f"],
    types: ["sap.fe.macros.NavigationType"],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    noLibraryCSS: true,
    extensions: {
      flChangeHandlers: {
        "sap.fe.macros.controls.FilterBar": "sap/ui/mdc/flexibility/FilterBar",
        "sap.fe.macros.controls.Section": "sap/uxap/flexibility/ObjectPageSection",
        "sap.fe.macros.controls.section.SubSection": "sap/uxap/flexibility/ObjectPageSubSection"
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
  let NavigationType = /*#__PURE__*/function (NavigationType) {
    /**
     * For External Navigation
     * @public
     */
    NavigationType["External"] = "External";
    /**
     * For In-Page Navigation
     * @public
     */
    NavigationType["InPage"] = "InPage";
    /**
     * For No Navigation
     * @public
     */
    NavigationType["None"] = "None";
    return NavigationType;
  }({});
  thisLib.NavigationType = NavigationType;
  _exports.NavigationType = NavigationType;
  DataType.registerEnum("sap.fe.macros.NavigationType", thisLib.NavigationType);
  Fragment.registerType("CUSTOM", {
    load: Fragment.getType?.("XML").load,
    init: async function (mSettings) {
      const currentController = mSettings.containingView.getController();
      let targetControllerExtension = currentController;
      if (currentController && !currentController.isA("sap.fe.core.ExtensionAPI")) {
        targetControllerExtension = currentController.getExtensionAPI(mSettings.id);
      }
      mSettings.containingView = {
        oController: targetControllerExtension
      };
      const childCustomData = mSettings.childCustomData ?? undefined;
      const contextPath = mSettings.contextPath;
      delete mSettings.childCustomData;
      delete mSettings.contextPath;
      this._fnSettingsPreprocessor = function (controlSettings) {
        if (this.getMetadata().hasProperty("contextPath")) {
          controlSettings.contextPath ??= contextPath;
        }
        return controlSettings;
      };
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const result = await Fragment.getType("XML").init.apply(this, [mSettings, args]);
      if (childCustomData && result?.isA("sap.ui.core.Control")) {
        for (const customDataKey in childCustomData) {
          // UI5 adds 'bindingString' when its an adaptation project (SNOW: DINC0143515), which results in errors later
          if (customDataKey === "bindingString") {
            delete childCustomData[customDataKey];
            continue;
          }
          result.addCustomData(new CustomData({
            key: customDataKey,
            value: childCustomData[customDataKey]
          }));
        }
      }
      return result;
    }
  });
  Fragment.registerType("SCOPEDFEFRAGMENT", {
    load: Fragment.getType?.("XML").load,
    init: function (mSettings) {
      const contextPath = mSettings.contextPath;
      delete mSettings.contextPath;
      this._fnSettingsPreprocessor = function (controlSettings) {
        if (this.getMetadata().hasProperty("contextPath")) {
          controlSettings.contextPath ??= contextPath;
        }
        return controlSettings;
      };
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return Fragment.getType("XML").init.apply(this, [mSettings, args]);
    }
  });
  Library.load({
    name: "sap.fe.macros"
  }).then(() => {
    AppComponent.registerInstanceDependentProcessForStartUp(FilterOperatorUtils.processCustomFilterOperators);
    return;
  }).catch(error => {
    Log.error(`Error loading 'sap.fe.macros`, error);
  });
  const rewriteNodes = function (parentNamespace, parentName, childNamespace, childName) {
    // eslint-disable-next-line @typescript-eslint/require-await
    return async (oNode, _oVisitor) => {
      if (oNode.hasChildNodes() && oNode.attributes.length === 0) {
        await _oVisitor.visitChildNodes(oNode);
        return; // In case a node has children and no attribute it's already formatted properly
      }
      const newNode = document.createElementNS(childNamespace, childName);
      const newParent = document.createElementNS(parentNamespace, parentName);
      const attributeNames = oNode.getAttributeNames();
      if (attributeNames.length > 0) {
        // Only consider case where we have attributes, meaning the old syntax
        for (const attributeName of attributeNames) {
          newNode.setAttribute(attributeName, oNode.getAttribute(attributeName));
        }
        newParent.appendChild(newNode);
      }
      await _oVisitor.visitChildNodes(newParent);
      oNode.replaceWith(newParent);
    };
  };

  // Rewrite the old shareOptions to the new one
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:shareOptions", "sap.fe.macros.share", "macroShare:ShareOptions"), "sap.fe.macros", "shareOptions");
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"), "sap.fe.macros", "formatOptions");
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"), "sap.m", "formatOptions");
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map

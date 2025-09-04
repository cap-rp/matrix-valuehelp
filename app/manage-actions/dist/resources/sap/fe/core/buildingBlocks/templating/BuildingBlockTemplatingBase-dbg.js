/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/base/util/merge", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper"], function (deepClone, merge, BuildingBlockTemplateProcessor, ConverterContext, ManifestWrapper, StableIdHelper, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var generate = StableIdHelper.generate;
  var unregisterBuildingBlock = BuildingBlockTemplateProcessor.unregisterBuildingBlock;
  var registerBuildingBlock = BuildingBlockTemplateProcessor.registerBuildingBlock;
  var addConditionallyToXML = BuildingBlockTemplateProcessor.addConditionallyToXML;
  var addAttributeToXML = BuildingBlockTemplateProcessor.addAttributeToXML;
  function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
  function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
  function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
  function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
  /**
   * Base class for building blocks
   */
  let BuildingBlockTemplatingBase = /*#__PURE__*/function () {
    function BuildingBlockTemplatingBase(props, _controlConfiguration, _visitorSettings) {
      this.isPublic = false;
      this.getConverterContext = function (dataModelObjectPath, contextPath, settings, extraParams) {
        const appComponent = settings.appComponent;
        const originalViewData = settings.models.viewData?.getData();
        let viewData = Object.assign({}, originalViewData);
        delete viewData.resourceModel;
        delete viewData.appComponent;
        viewData = deepClone(viewData);
        let controlConfiguration = {};

        // Only merge in page control configuration if the building block is on the same context
        const relativePath = getTargetObjectPath(dataModelObjectPath.contextLocation ?? dataModelObjectPath);
        const entitySetName = dataModelObjectPath.contextLocation?.targetEntitySet?.name ?? dataModelObjectPath.targetEntitySet?.name;
        if (relativePath === originalViewData?.contextPath || relativePath === `/${originalViewData?.entitySet}` || entitySetName === originalViewData?.entitySet) {
          controlConfiguration = viewData.controlConfiguration;
        }
        viewData.controlConfiguration = merge(controlConfiguration, extraParams || {});
        return ConverterContext.createConverterContextForMacro(dataModelObjectPath.startingEntitySet.name, settings.models.metaModel, appComponent?.getDiagnostics(), merge, dataModelObjectPath.contextLocation, new ManifestWrapper(viewData, appComponent));
      };
      Object.keys(props).forEach(propName => {
        this[propName] = props[propName];
      });
      this.resourceModel = _visitorSettings?.models?.["sap.fe.i18n"];
    }

    /**
     * Only used internally
     *
     */
    _exports = BuildingBlockTemplatingBase;
    var _proto = BuildingBlockTemplatingBase.prototype;
    /**
     * Convert the given local element ID to a globally unique ID by prefixing with the Building Block ID.
     * @param stringParts
     * @returns Either the global ID or undefined if the Building Block doesn't have an ID
     */
    _proto.createId = function createId() {
      // If the child instance has an ID property use it otherwise return undefined
      if (this.id) {
        for (var _len = arguments.length, stringParts = new Array(_len), _key = 0; _key < _len; _key++) {
          stringParts[_key] = arguments[_key];
        }
        return generate([this.id, ...stringParts]);
      }
      return undefined;
    }

    /**
     * Get the ID of the content control.
     * @param buildingBlockId
     * @returns Return the ID
     */;
    _proto.getContentId = function getContentId(buildingBlockId) {
      return `${buildingBlockId}-content`;
    }

    /**
     * Returns translated text for a given resource key.
     * @param textID ID of the Text
     * @param parameters Array of parameters that are used to create the text
     * @param metaPath Entity set name or action name to overload a text
     * @returns Determined text
     */;
    _proto.getTranslatedText = function getTranslatedText(textID, parameters, metaPath) {
      return this.resourceModel?.getText(textID, parameters, metaPath) || textID;
    };
    /**
     * Only used internally.
     * @returns All the properties defined on the object with their values
     */
    _proto.getProperties = function getProperties() {
      const allProperties = {};
      for (const oInstanceKey in this) {
        if (this.hasOwnProperty(oInstanceKey)) {
          allProperties[oInstanceKey] = this[oInstanceKey];
        }
      }
      return allProperties;
    };
    BuildingBlockTemplatingBase.register = function register() {
      registerBuildingBlock(this);
    };
    BuildingBlockTemplatingBase.unregister = function unregister() {
      unregisterBuildingBlock(this);
    }

    /**
     * Add a part of string based on the condition.
     * @param condition
     * @param partToAdd
     * @returns The part to add if the condition is true, otherwise an empty string
     */;
    _proto.addConditionally = function addConditionally(condition, partToAdd) {
      return addConditionallyToXML(condition, partToAdd);
    }

    /**
     * Add an attribute depending on the current value of the property.
     * If it's undefined the attribute is not added.
     * @param attributeName
     * @param value
     * @returns The attribute to add if the value is not undefined, otherwise an empty string
     */;
    _proto.attr = function attr(attributeName, value) {
      return addAttributeToXML(attributeName, value);
    };
    return _createClass(BuildingBlockTemplatingBase, null, [{
      key: "metadata",
      get: function () {
        return this.internalMetadata;
      },
      set: function (newValue) {
        this.internalMetadata = newValue;
      }
    }]);
  }();
  BuildingBlockTemplatingBase.isRuntime = false;
  _exports = BuildingBlockTemplatingBase;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockTemplatingBase-dbg.js.map

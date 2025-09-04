/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/Fragment", "sap/ui/core/util/XMLPreprocessor"], function (ClassSupport, BuildingBlock, BuildingBlockTemplateProcessor, TypeGuards, Fragment, XMLPreprocessor) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var isContext = TypeGuards.isContext;
  var xml = BuildingBlockTemplateProcessor.xml;
  var parseXMLString = BuildingBlockTemplateProcessor.parseXMLString;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Using this class you can define a building block that will manage and render a templating based building block.
   * On change of the main properties you will be able to recreate the content.
   * @public
   * @experimental
   */
  let BuildingBlockWithTemplating = (_dec = defineUI5Class("sap.fe.macros.controls.BuildingBlockWithTemplating"), _dec(_class = /*#__PURE__*/function (_BuildingBlock) {
    function BuildingBlockWithTemplating() {
      return _BuildingBlock.apply(this, arguments) || this;
    }
    _exports = BuildingBlockWithTemplating;
    _inheritsLoose(BuildingBlockWithTemplating, _BuildingBlock);
    var _proto = BuildingBlockWithTemplating.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this._createContent();
      }
    };
    _proto._createContent = function _createContent() {
      const owner = this._getOwner();
      if (owner?.isA("sap.fe.core.TemplateComponent")) {
        this.contentCreated = this.createContent(owner);
      }
    }

    /**
     * Create proxy methods to forward calls to the content for the given methods.
     * @param methods The method to proxy
     */;
    _proto.createProxyMethods = function createProxyMethods(methods) {
      var _this = this;
      for (const method of methods) {
        this[method] = function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return _this.content?.[method]?.(...args);
        };
      }
    };
    _proto.setProperty = function setProperty(propertyKey, propertyValue, bSuppressInvalidate) {
      if (!this._applyingSettings && propertyValue !== undefined && Object.keys(this.getMetadata().getProperties()).includes(propertyKey)) {
        _BuildingBlock.prototype.setProperty.call(this, propertyKey, propertyValue, true);
        this._createContent();
      } else {
        _BuildingBlock.prototype.setProperty.call(this, propertyKey, propertyValue, bSuppressInvalidate);
      }
      return this;
    };
    _proto.setAggregation = function setAggregation(propertyKey, aggregationObject, bSuppressInvalidate) {
      if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(propertyKey)) {
        _BuildingBlock.prototype.setAggregation.call(this, propertyKey, aggregationObject, true);
        this._createContent();
      } else {
        _BuildingBlock.prototype.setAggregation.call(this, propertyKey, aggregationObject, bSuppressInvalidate);
      }
      return this;
    };
    _proto.removeAggregation = function removeAggregation(aggregationName, object, suppressInvalidate) {
      let removed;
      if (!this._applyingSettings && object !== undefined && Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)) {
        removed = _BuildingBlock.prototype.removeAggregation.call(this, aggregationName, object, suppressInvalidate);
        this._createContent();
      } else {
        removed = _BuildingBlock.prototype.removeAggregation.call(this, aggregationName, object, suppressInvalidate);
      }
      return removed;
    };
    _proto.addAggregation = function addAggregation(aggregationName, object, suppressInvalidate) {
      if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)) {
        _BuildingBlock.prototype.addAggregation.call(this, aggregationName, object, suppressInvalidate);
        this._createContent();
      } else {
        _BuildingBlock.prototype.addAggregation.call(this, aggregationName, object, suppressInvalidate);
      }
      return this;
    };
    _proto.insertAggregation = function insertAggregation(aggregationName, object, index, suppressInvalidate) {
      if (!this._applyingSettings && Object.keys(this.getMetadata().getAggregations()).includes(aggregationName)) {
        _BuildingBlock.prototype.insertAggregation.call(this, aggregationName, object, index, suppressInvalidate);
        this._createContent();
      } else {
        _BuildingBlock.prototype.insertAggregation.call(this, aggregationName, object, index, suppressInvalidate);
      }
      return this;
    };
    _proto.createContent = async function createContent(owner) {
      if (this.contentCreated) {
        await this.contentCreated;
      }
      // Only special building block will implement this
      const preprocessorContext = owner.getPreprocessorContext() ?? {
        models: {},
        bindingContexts: {}
      };
      const metadata = this.getMetadata();
      const bbMetadata = this.metadata.buildingBlockMetadata;
      if (bbMetadata) {
        const namespace = bbMetadata.publicNamespace ?? bbMetadata.namespace;
        const name = bbMetadata.name;
        const fqnName = `${metadata.getName()}`.replaceAll(".", "/");
        const xmlProperties = [];
        const xmlAggregations = [];
        const allAggregations = bbMetadata.aggregations;
        for (const propertiesKey in bbMetadata.properties) {
          let propertyValue = this[propertiesKey];
          let propertyValueObject = propertyValue;
          if (propertyValueObject?.hasOwnProperty?.("path") && propertyValueObject?.hasOwnProperty?.("model")) {
            propertyValueObject = this.getModel(propertyValueObject.model)?.getObject(propertyValueObject.path);
          }
          if (bbMetadata.properties[propertiesKey].type === "function") {
            xmlProperties.push(xml`${propertiesKey}="THIS._fireEvent($event, $controller, '${propertiesKey}')"`);
          } else if (propertyValueObject?.isA && propertyValueObject.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
            const xmlAggregation = propertyValueObject.serialize(`feBB:${propertiesKey}`);
            xmlAggregations.push(xmlAggregation);
          } else if (bbMetadata.properties[propertiesKey].type === "array") {
            allAggregations[propertiesKey] = bbMetadata.properties[propertiesKey];
          } else if (propertyValue !== undefined && propertyValue !== null && (typeof propertyValue !== "object" || Object.keys(propertyValue).length > 0)) {
            if (isContext(propertyValue)) {
              propertyValue = propertyValue.getPath();
            } else if (propertiesKey === "id") {
              xmlProperties.push(xml`${propertiesKey}="${propertyValue}-block"`);
            } else {
              xmlProperties.push(xml`${propertiesKey}="${propertyValue}"`);
            }
          }
        }
        for (const aggregationKey in allAggregations) {
          const _aggregationValue = this[aggregationKey];
          if (_aggregationValue) {
            const aggregationChildren = [];
            if (Array.isArray(_aggregationValue)) {
              for (const aggregationChild of _aggregationValue) {
                if (aggregationChild.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) aggregationChildren.push(aggregationChild.serialize());
              }
            } else if (_aggregationValue.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
              aggregationChildren.push(_aggregationValue.serialize());
            }
            const xmlAggregation = `<feBB:${aggregationKey}>${aggregationChildren.join("\n")}</feBB:${aggregationKey}>`;
            xmlAggregations.push(xmlAggregation);
          }
        }
        const fragment = await XMLPreprocessor.process(parseXMLString(xml`<root><feBB:${name}
			xmlns:core="sap.ui.core"
			xmlns:feBB="${namespace}"
			${xmlProperties.length > 0 ? xmlProperties : ""}
			core:require="{THIS: '${fqnName}'}"
			>${xmlAggregations.length > 0 ? xmlAggregations : ""}</feBB:${name}></root>`, true)[0], {
          models: {}
        }, preprocessorContext);
        if (fragment.firstElementChild) {
          this.content?.destroy();
          this.content = await owner.runAsOwner(async () => {
            return Fragment.load({
              definition: fragment.firstElementChild,
              controller: owner.getRootController()
            });
          });
        }
      }
    };
    return BuildingBlockWithTemplating;
  }(BuildingBlock)) || _class);
  _exports = BuildingBlockWithTemplating;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockWithTemplating-dbg.js.map

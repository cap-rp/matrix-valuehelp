/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (ManifestWrapper, MetaModelConverter, TypeGuards, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let InlineEditService = /*#__PURE__*/function (_Service) {
    function InlineEditService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      _this.pageConfigurations = new Map();
      return _this;
    }
    _exports.InlineEditService = InlineEditService;
    _inheritsLoose(InlineEditService, _Service);
    var _proto = InlineEditService.prototype;
    _proto.init = function init() {
      this.initPromise = new Promise(async resolve => {
        this.appComponent = _Service.prototype.getContext.bind(this)().scopeObject;
        await this.computePageConfigurations();
        resolve(this);
      });
    }

    /**
     * Compute the page configurations for inline edit for all the pages in the app.
     * @returns A promise that resolves when the page configurations are computed
     */;
    _proto.computePageConfigurations = async function computePageConfigurations() {
      const model = this.appComponent.getModel();
      if (model?.isA?.("sap.ui.model.odata.v4.ODataModel")) {
        // We need to wait for the MetaModel to be requested
        await model.getMetaModel().requestObject("/$EntityContainer/");
        const targets = this.appComponent.getManifestEntry("sap.ui5")?.routing?.targets ?? {};
        for (const pageKey in targets) {
          const pageConfiguration = this.getPageConfiguration(targets[pageKey].options?.settings || undefined, model.getMetaModel());
          if (pageConfiguration) {
            this.pageConfigurations.set(pageKey, pageConfiguration);
          }
        }
      }
    }

    /**
     * Get the connected properties to the given target property.
     * @param pageKey
     * @param targetProperty
     * @returns The connected properties to the given target property
     */;
    _proto.getInlineConnectedProperties = function getInlineConnectedProperties(pageKey, targetProperty) {
      const connectedProperties = this.pageConfigurations.get(pageKey)?.connectedProperties;
      if (!connectedProperties) {
        return [];
      }
      for (const properties of connectedProperties) {
        if (properties.includes(targetProperty)) {
          // sort the properties for the targetProperty to be always in first position. That ensures the focus to be set on this property
          properties.sort((propertyA, propertyB) => {
            if (propertyA === targetProperty) return -1;
            if (propertyB === targetProperty) return 1;
            return 0;
          });
          return properties;
        }
      }
      return [];
    }

    /**
     * Get the data model object associated with the given annotation path.
     * @param metaModel
     * @param annotationPath
     * @param pageContextPath
     * @returns The data model object associated with the given annotation path
     */;
    _proto.getAssociatedDataModelObject = function getAssociatedDataModelObject(metaModel, annotationPath, pageContextPath) {
      const pageMetaContext = metaModel.createBindingContext(pageContextPath);
      if (annotationPath.includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
        annotationPath = annotationPath.replace(`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`, `$Type/@${"com.sap.vocabularies.UI.v1.FieldGroup"}`);
      } else if (annotationPath.includes("com.sap.vocabularies.UI.v1.Identification")) {
        annotationPath = annotationPath.replace(`@${"com.sap.vocabularies.UI.v1.Identification"}`, `$Type/@${"com.sap.vocabularies.UI.v1.Identification"}`);
      } else if (annotationPath.includes("com.sap.vocabularies.UI.v1.LineItem")) {
        annotationPath = annotationPath.replace(`@${"com.sap.vocabularies.UI.v1.LineItem"}`, `$Type/@${"com.sap.vocabularies.UI.v1.LineItem"}`);
      }
      const targetContext = pageMetaContext ? metaModel.createBindingContext(annotationPath, pageMetaContext) : null;
      return targetContext ? MetaModelConverter.getInvolvedDataModelObjects(targetContext, pageMetaContext) : undefined;
    }

    /**
     * Get the page configuration for the given manifest entry.
     * @param manifestEntry
     * @param metaModel
     * @returns The page configuration
     */;
    _proto.getPageConfiguration = function getPageConfiguration(manifestEntry, metaModel) {
      if (!manifestEntry) {
        return null;
      }
      const manifestWrapper = new ManifestWrapper(manifestEntry);
      if (!manifestWrapper.hasInlineEdit()) {
        return {
          active: false,
          enabledProperties: [],
          disabledProperties: [],
          connectedProperties: []
        };
      }
      let pageContextPath = manifestEntry.contextPath;
      if (!pageContextPath) {
        pageContextPath = manifestEntry.entitySet ? `/${manifestEntry.entitySet}` : undefined;
      }
      return {
        active: true,
        enabledProperties: this.getTargetPropertiesForInlineEdit(manifestWrapper.getInlineEditEnabledFields(), pageContextPath, metaModel),
        disabledProperties: this.getTargetPropertiesForInlineEdit(manifestWrapper.getInlineEditDisabledFields(), pageContextPath, metaModel),
        connectedProperties: this.getConnectedPropertiesForPage(manifestWrapper.getInlineConnectedFields(), pageContextPath, metaModel)
      };
    }

    /**
     * Get the connected properties for a given page .
     * @param targetPaths
     * @param pageContextPath
     * @param metaModel
     * @returns The connected properties for the given page
     */;
    _proto.getConnectedPropertiesForPage = function getConnectedPropertiesForPage(targetPaths, pageContextPath, metaModel) {
      const connectedPropertiesForPage = [];
      for (const targetPath of targetPaths) {
        const connectedTargets = Array.isArray(targetPath) ? targetPath : [targetPath];
        connectedPropertiesForPage.push(this.getTargetPropertiesForInlineEdit(connectedTargets, pageContextPath, metaModel));
      }
      return connectedPropertiesForPage;
    }

    /**
     * Get the properties that are considered in edition for the given target paths.
     * @param targetPaths
     * @param pageContextPath
     * @param metaModel
     * @returns The properties that are considered in edition for the given target paths
     */;
    _proto.getTargetPropertiesForInlineEdit = function getTargetPropertiesForInlineEdit(targetPaths, pageContextPath, metaModel) {
      if (!pageContextPath) {
        return [];
      }
      let targetProperties = [];
      for (const targetPath of targetPaths) {
        const dataModelObject = this.getAssociatedDataModelObject(metaModel, targetPath, pageContextPath);
        if (dataModelObject && dataModelObject.targetObject) {
          targetProperties = targetProperties.concat(InlineEditService.getPropertiesForInlineEdit(dataModelObject.targetObject));
        }
      }
      return targetProperties;
    }

    /**
     * Gets the properties that can be edited for the given target object.
     * @param targetObject
     * @returns The properties that are considered in edition for the given target object
     */;
    InlineEditService.getPropertiesForInlineEdit = function getPropertiesForInlineEdit(targetObject) {
      if (!targetObject) {
        return [];
      }
      if (isProperty(targetObject)) {
        return [targetObject.fullyQualifiedName];
      }
      if (targetObject.$Type) {
        switch (targetObject.$Type) {
          case "com.sap.vocabularies.UI.v1.DataField":
          case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
          case "com.sap.vocabularies.UI.v1.DataPointType":
            return InlineEditService.getPropertiesForInlineEdit(targetObject.Value?.$target);
          case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
            return InlineEditService.getPropertiesForInlineEdit(targetObject.Target?.$target);
        }
      }
      if (targetObject.term) {
        switch (targetObject.term) {
          case "com.sap.vocabularies.UI.v1.FieldGroup":
            return targetObject.Data.reduce((acc, dataField) => acc.concat(InlineEditService.getPropertiesForInlineEdit(dataField)), []);
          case "com.sap.vocabularies.UI.v1.Identification":
          case "com.sap.vocabularies.UI.v1.LineItem":
            return targetObject.reduce((acc, dataField) => acc.concat(InlineEditService.getPropertiesForInlineEdit(dataField)), []);
        }
      }
      return [];
    }

    /**
     * Check if the given page has inline edit enabled.
     * @param pageKey
     * @returns Whether the given page has inline edit enabled
     */;
    _proto.doesPageHaveInlineEdit = function doesPageHaveInlineEdit(pageKey) {
      return this.pageConfigurations.get(pageKey)?.active ?? false;
    }

    /**
     * Check if the given property is considered for inline edit on the given page.
     * @param pageKey
     * @param propertyFullyQualifiedName
     * @returns Whether the given property is considered for inline edit on the given page
     */;
    _proto.isPropertyConsideredForInlineEdit = function isPropertyConsideredForInlineEdit(pageKey, propertyFullyQualifiedName) {
      if (propertyFullyQualifiedName === "") {
        return false;
      }
      const pageConfiguration = this.pageConfigurations.get(pageKey);
      if (pageConfiguration) {
        return (pageConfiguration.enabledProperties.includes(propertyFullyQualifiedName) || pageConfiguration.enabledProperties.length === 0) && !pageConfiguration.disabledProperties.includes(propertyFullyQualifiedName);
      }
      return false;
    };
    return InlineEditService;
  }(Service);
  _exports.InlineEditService = InlineEditService;
  let InlineEditServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function InlineEditServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = InlineEditServiceFactory;
    _inheritsLoose(InlineEditServiceFactory, _ServiceFactory);
    var _proto2 = InlineEditServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const inlineEditService = new InlineEditService(oServiceContext);
      return inlineEditService.initPromise;
    };
    return InlineEditServiceFactory;
  }(ServiceFactory);
  _exports = InlineEditServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=InlineEditServiceFactory-dbg.js.map

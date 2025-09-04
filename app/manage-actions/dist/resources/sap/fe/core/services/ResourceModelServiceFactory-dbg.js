/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/ResourceModel", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (ResourceModel, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let ResourceModelService = /*#__PURE__*/function (_Service) {
    function ResourceModelService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.ResourceModelService = ResourceModelService;
    _inheritsLoose(ResourceModelService, _Service);
    var _proto = ResourceModelService.prototype;
    _proto.init = function init() {
      const oContext = this.getContext();
      const mSettings = oContext.settings;
      this.oFactory = oContext.factory;

      // When enhancing i18n keys the value in the last resource bundle takes precedence
      // hence arrange various resource bundles so that enhanceI18n provided by the application is the last.
      // The following order is used :
      // 1. sap.fe bundle - sap.fe.core.messagebundle (passed with mSettings.bundles)
      // 2. sap.fe bundle - sap.fe.templates.messagebundle (passed with mSettings.bundles)
      // 3. Multiple bundles passed by the application as part of enhanceI18n
      const aBundles = mSettings.bundles.concat(mSettings.enhanceI18n || []).map(function (vI18n) {
        // if value passed for enhanceI18n is a Resource Model, return the associated bundle
        // else the value is a bundleUrl, return Resource Bundle configuration so that a bundle can be created
        return typeof vI18n.isA === "function" && vI18n.isA("sap.ui.model.resource.ResourceModel") ? vI18n.getResourceBundle() : {
          bundleName: vI18n.replace(/\//g, ".")
        };
      });
      this.oResourceModel = new ResourceModel({
        bundleName: aBundles[0].bundleName,
        enhanceWith: aBundles.slice(1),
        async: true
      });
      if (oContext.scopeType === "component") {
        const oComponent = oContext.scopeObject;
        oComponent.setModel(this.oResourceModel, mSettings.modelName);
      }
      this.initPromise = Promise.all([this.oResourceModel.getResourceBundle(), this.oResourceModel._pEnhanced || Promise.resolve()]).then(oBundle => {
        this.oResourceModel.__bundle = oBundle[0];
        return this;
      });
    };
    _proto.getResourceModel = function getResourceModel() {
      return this.oResourceModel;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.exit = function exit() {
      // Deregister global instance
      this.oFactory.removeGlobalInstance();
    };
    return ResourceModelService;
  }(Service);
  _exports.ResourceModelService = ResourceModelService;
  let ResourceModelServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function ResourceModelServiceFactory() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ServiceFactory.call(this, ...args) || this;
      _this._oInstances = {};
      return _this;
    }
    _inheritsLoose(ResourceModelServiceFactory, _ServiceFactory);
    var _proto2 = ResourceModelServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const sKey = `${oServiceContext.scopeObject.getId()}_${oServiceContext.settings.bundles.join(",")}` + (oServiceContext.settings.enhanceI18n ? `,${oServiceContext.settings.enhanceI18n.join(",")}` : "");
      if (!this._oInstances[sKey]) {
        this._oInstances[sKey] = new ResourceModelService(Object.assign({
          factory: this
        }, oServiceContext));
      }
      return this._oInstances[sKey].initPromise;
    };
    _proto2.removeGlobalInstance = function removeGlobalInstance() {
      this._oInstances = {};
    };
    return ResourceModelServiceFactory;
  }(ServiceFactory);
  return ResourceModelServiceFactory;
}, false);
//# sourceMappingURL=ResourceModelServiceFactory-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Service, ServiceFactory) {
  "use strict";

  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let AsyncComponentService = /*#__PURE__*/function (_Service) {
    function AsyncComponentService() {
      return _Service.apply(this, arguments) || this;
    }
    _inheritsLoose(AsyncComponentService, _Service);
    var _proto = AsyncComponentService.prototype;
    // !: means that we know it will be assigned before usage
    _proto.init = function init() {
      this.initPromise = new Promise((resolve, reject) => {
        this.resolveFn = resolve;
        this.rejectFn = reject;
      });
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      const oServices = oComponent._getManifestEntry("sap.ui5", true).services;
      Promise.all(Object.keys(oServices).filter(sServiceKey => oServices[sServiceKey].startup === "waitFor" && oServices[sServiceKey].factoryName !== "sap.fe.core.services.AsyncComponentService").map(async sServiceKey => {
        return oComponent.getService(sServiceKey).then(oServiceInstance => {
          const sMethodName = `get${sServiceKey[0].toUpperCase()}${sServiceKey.substring(1)}`;
          if (!oComponent.hasOwnProperty(sMethodName)) {
            oComponent[sMethodName] = function () {
              return oServiceInstance;
            };
          }
          return oServiceInstance;
        });
      })).then(async allServices => {
        await oComponent.pRootControlLoaded;
        return allServices;
      }).then(allServices => {
        // notifiy the component
        if (oComponent.onServicesStarted) {
          oComponent.onServicesStarted(allServices);
        }
        this.resolveFn(this);
        return;
      }).catch(this.rejectFn);
    };
    return AsyncComponentService;
  }(Service);
  let AsyncComponentServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function AsyncComponentServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _inheritsLoose(AsyncComponentServiceFactory, _ServiceFactory);
    var _proto2 = AsyncComponentServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const asyncComponentService = new AsyncComponentService(oServiceContext);
      return asyncComponentService.initPromise;
    };
    return AsyncComponentServiceFactory;
  }(ServiceFactory);
  return AsyncComponentServiceFactory;
}, false);
//# sourceMappingURL=AsyncComponentServiceFactory-dbg.js.map

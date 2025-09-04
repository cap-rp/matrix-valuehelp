/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "../CommonUtils"], function (Log, Service, ServiceFactory, CommonUtils) {
  "use strict";

  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let ContextSharingService = /*#__PURE__*/function (_Service) {
    function ContextSharingService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.ContextSharingService = ContextSharingService;
    _inheritsLoose(ContextSharingService, _Service);
    var _proto = ContextSharingService.prototype;
    _proto.init = function init() {
      this.initPromise = new Promise(async resolve => {
        this.appComponent = _Service.prototype.getContext.bind(this)().scopeObject;
        await this.registerProvider();
        resolve(this);
      });
    };
    _proto.onExit = function onExit() {
      this.contextChannel?.unregisterProvider(this);
    };
    _proto.isContextChannelSupported = async function isContextChannelSupported() {
      const environmentCapabilities = await this.appComponent.getService("environmentCapabilities");
      return environmentCapabilities.getCapabilities().ContextSharingSupported && (await environmentCapabilities.isContextSharingEnabled());
    }

    /**
     * This function is responsible to register the current service as a provider for the Joule context.
     */;
    _proto.registerProvider = async function registerProvider() {
      if (!(await this.isContextChannelSupported())) {
        return;
      }
      const {
        default: ContextChannel
      } = await __ui5_require_async("sap/insights/channels/ContextChannel");
      // joule integration
      try {
        this.contextChannel = await ContextChannel.getInstance();
        this.contextChannel.registerProvider(this);
      } catch (err) {
        Log.error(err);
      }
    };
    _proto.getId = function getId() {
      return this.appComponent.getId();
    }

    /**
     * Build a context related to the active view to be shared with the Joule Web Client.
     *
     * The custom property of this context can be enriched by overriding the #ContextSharing.getContext function.
     * @returns A context object
     */;
    _proto.buildContext = function buildContext() {
      const shell = this.appComponent.getShellServices();
      const view = CommonUtils.getCurrentPageView(this.appComponent);
      const app = this.appComponent.getManifestEntry("sap.app");
      /*
       * Sample of context:
       * {
       * 	"app_title": "Manage Sales Orders (V2)",
       * 	"cus.sd.salesorderv2.manage": {
       * 		"app": {
       * 			"view": "sap.fe.templates.ObjectPage.ObjectPage"
       * 		},
       * 		flp: {
       * 			"hash": "#SalesOrder-manageV2&/SalesOrderManage('91375')"
       * 		},
       * 	"entity": {
       * 		"servicePath": "/sap/opu/odata4/sap/c_salesordermanage_srv/srvd/sap/c_salesordermanage_sd/0001",
       * 		"entityPath": "/SalesOrderManage(ID='91375')"
       * 		}
       *  "custom" : {
       * 		"customProp": "customValue"
       * 	}
       * }
       */
      const context = {
        app_title: app.title,
        [app.id]: {
          app: {
            view: view.getViewName()
          },
          flp: {
            hash: `${shell.getHash()}&/${shell.getContext().scopeObject.getRouterProxy().getHash()}`
          },
          entity: {
            servicePath: view.getModel().getServiceUrl(),
            entityPath: view.getBindingContext()?.getPath() ?? view.getViewData()?.fullContextPath
          }
        }
      };
      return view.getController().contextSharing.getContext(context);
    };
    _proto.getContext = async function getContext() {
      return Promise.resolve(this.buildContext());
    };
    return ContextSharingService;
  }(Service);
  _exports.ContextSharingService = ContextSharingService;
  let ContextSharingServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function ContextSharingServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = ContextSharingServiceFactory;
    _inheritsLoose(ContextSharingServiceFactory, _ServiceFactory);
    var _proto2 = ContextSharingServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const contextSharingService = new ContextSharingService(oServiceContext);
      return contextSharingService.initPromise;
    };
    return ContextSharingServiceFactory;
  }(ServiceFactory);
  _exports = ContextSharingServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=ContextSharingServiceFactory-dbg.js.map

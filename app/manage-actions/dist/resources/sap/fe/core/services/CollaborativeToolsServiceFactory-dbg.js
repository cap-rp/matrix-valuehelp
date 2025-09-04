/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Service, ServiceFactory) {
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
  let CollaborativeToolsService = /*#__PURE__*/function (_Service) {
    function CollaborativeToolsService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.CollaborativeToolsService = CollaborativeToolsService;
    _inheritsLoose(CollaborativeToolsService, _Service);
    var _proto = CollaborativeToolsService.prototype;
    _proto.init = function init() {
      this.collaborationService = {
        isInitialized: false
      };
      this.initPromise = Promise.resolve(this);
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.initializeMSTeams = async function initializeMSTeams() {
      try {
        const collaborationService = await this.getCollaborationServices();
        this.collaborationService.isInitialized = true;
        this.collaborationService.teamsHelperService = collaborationService.oTeamsHelperService;
        this.collaborationService.isContactsCollaborationSupported =
        //await helperService.isTeamsModeActive() && // this checks for url params appState=lean&sap-collaboration-teams=true
        typeof collaborationService.oTeamsHelperService.isContactsCollaborationSupported === "function" && collaborationService.oTeamsHelperService.isContactsCollaborationSupported();
        this.collaborationService.cmHelperService = collaborationService.oCMHelperService;
      } catch (e) {
        Log.info("Couldn't evaluate the support for contacts collaboration in MS Teams");
      }
    };
    _proto.getMailPopoverFromMsTeamsIntegration = async function getMailPopoverFromMsTeamsIntegration(mail) {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      try {
        return await this.collaborationService.teamsHelperService?.enableContactsCollaboration(mail);
      } catch {
        return undefined;
      }
    };
    _proto.isContactsCollaborationSupported = async function isContactsCollaborationSupported() {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      return this.collaborationService.isContactsCollaborationSupported === true;
    };
    _proto.getTeamContactStatus = async function getTeamContactStatus(email) {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      if (!this.collaborationService.isContactsCollaborationSupported) {
        return undefined;
      }
      try {
        return await this.collaborationService.teamsHelperService?.getTeamsContactStatus(email);
      } catch {
        return undefined;
      }
    };
    _proto.getTeamContactOptions = async function getTeamContactOptions() {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      if (!this.collaborationService.isContactsCollaborationSupported) {
        return undefined;
      }
      if (!this.collaborationService.contactOptions) {
        try {
          this.collaborationService.contactOptions = await this.collaborationService.teamsHelperService?.getTeamsContactCollabOptions();
        } catch {
          return undefined;
        }
      }
      return this.collaborationService.contactOptions;
    };
    _proto.getTeamContactOption = async function getTeamContactOption(option) {
      const contactOptions = await this.getTeamContactOptions();
      let contactOption;
      if (contactOptions) {
        for (let i = 0; i < contactOptions.length; i++) {
          if (contactOptions[i].key === option) {
            contactOption = contactOptions[i];
            break;
          }
        }
      }
      return contactOption;
    };
    _proto.getTeamsCollabOptionsViaShare = async function getTeamsCollabOptionsViaShare(params) {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      return this.collaborationService.teamsHelperService?.getOptions(params);
    };
    _proto.getCollaborationManagerOption = async function getCollaborationManagerOption() {
      if (!this.collaborationService.isInitialized) {
        await this.initializeMSTeams();
      }
      return this.collaborationService.cmHelperService?.getOptions();
    };
    _proto.getCollaborationServices = async function getCollaborationServices() {
      const {
        default: ServiceContainerClass
      } = await __ui5_require_async("sap/suite/ui/commons/collaboration/ServiceContainer");
      return ServiceContainerClass.getCollaborationServices();
    };
    return CollaborativeToolsService;
  }(Service);
  _exports.CollaborativeToolsService = CollaborativeToolsService;
  let CollaborativeToolsServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function CollaborativeToolsServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _inheritsLoose(CollaborativeToolsServiceFactory, _ServiceFactory);
    var _proto2 = CollaborativeToolsServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(serviceContext) {
      const collaborativeToolsService = new CollaborativeToolsService(serviceContext);
      return collaborativeToolsService.initPromise;
    };
    return CollaborativeToolsServiceFactory;
  }(ServiceFactory);
  CollaborativeToolsServiceFactory.CollaborativeToolsServiceClass = CollaborativeToolsService;
  return CollaborativeToolsServiceFactory;
}, false);
//# sourceMappingURL=CollaborativeToolsServiceFactory-dbg.js.map

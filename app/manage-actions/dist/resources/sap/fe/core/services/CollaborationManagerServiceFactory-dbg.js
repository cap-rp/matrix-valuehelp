/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/Lib", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Library, Service, ServiceFactory) {
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
  let CollaborationManagerService = /*#__PURE__*/function (_Service) {
    function CollaborationManagerService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      // eslint-disable-next-line camelcase
      _this.__implements__sap_insights_ICardProvider = true;
      _this.registered = false;
      return _this;
    }
    _exports.CollaborationManagerService = CollaborationManagerService;
    _inheritsLoose(CollaborationManagerService, _Service);
    var _proto = CollaborationManagerService.prototype;
    _proto.init = function init() {
      this.initPromise = new Promise(resolve => {
        this.appComponent = this.getContext().scopeObject;
        resolve(this);
      });
    };
    _proto.getCardsChannel = async function getCardsChannel() {
      const {
        default: cardHelper
      } = await __ui5_require_async("sap/insights/CardHelper");
      const service = await cardHelper.getServiceAsync("UIService");
      return service.getCardsChannel();
    };
    _proto.connect = async function connect(providerId, onRetrieveAvailableCards) {
      try {
        const channel = await this.getCardsChannel();
        if (channel.isEnabled()) {
          this.onRetrieveAvailableCards = onRetrieveAvailableCards;
          this.channel = channel;
          this.id = providerId;
          this.consumers = {};
          this.sharedCards = [];
          if (this.registered !== true) {
            await this.registerProvider();
          }
          this.updateConsumers();
        }
      } catch (error) {
        Log.debug("Collaboration Manager connection failed", error);
      }
      return this;
    };
    _proto.onConsumerConnected = async function onConsumerConnected(id) {
      if (!this.consumers[id]) {
        this.consumers[id] = true;
        await this.onRetrieveAvailableCards?.();
        this.shareAvailableCards(id);
      }
      return Promise.resolve(Object.keys(this.consumers).length);
    };
    _proto.onConsumerDisconnected = async function onConsumerDisconnected(id) {
      if (this.consumers[id]) {
        delete this.consumers[id];
      }
      return Promise.resolve(Object.keys(this.consumers).length);
    };
    _proto.onCardRequested = function onCardRequested(consumerId, cardId) {
      const card = this.sharedCards.find(card => card?.id === cardId);
      card?.callback?.(card.card);
      return card;
    };
    _proto.onViewUpdate = async function onViewUpdate(active) {
      // register / unregister if the status of the home page changed
      if (this.registered !== active) {
        if (active) {
          await this.registerProvider();
          this.updateConsumers();
        } else {
          await this.unregisterProvider();
        }
      } else if (this.registered) {
        this.updateConsumers();
      }
    };
    _proto.registerProvider = async function registerProvider() {
      if (this.channel) {
        await this.channel.registerProvider(this.id, this);
        this.registered = true;
      }
    };
    _proto.unregisterProvider = async function unregisterProvider() {
      if (this.channel) {
        await this.channel.unregister(this.id);
        this.registered = false;
        this.consumers = {};
        this.sharedCards = [];
        this.onRetrieveAvailableCards = undefined;
      }
    };
    _proto.updateConsumers = function updateConsumers() {
      this.shareAvailableCards();
    };
    _proto.shareAvailableCards = function shareAvailableCards() {
      let consumerId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "*";
      this?.channel?.publishAvailableCards(this.id, this.sharedCards, consumerId);
    };
    _proto.addCardsToCollaborationManager = function addCardsToCollaborationManager(cards, parentAppId) {
      this.sharedCards = [];
      for (const [id, card] of Object.entries(cards)) {
        this.sharedCards.push({
          id: id,
          title: card.title,
          parentAppId: parentAppId,
          callback: card.callback,
          card: card.card
        });
      }
    };
    _proto.getDesignTimeCard = async function getDesignTimeCard(cardType) {
      var _this2 = this;
      return new Promise((resolve, reject) => {
        Library.load({
          name: "sap/cards/ap/common"
        }).then(() => {
          sap.ui.require(["sap/cards/ap/common/services/RetrieveCard"], async function () {
            for (var _len2 = arguments.length, params = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              params[_key2] = arguments[_key2];
            }
            const retrieveCard = params[0];
            let generatedManifest;
            const appComponent = _this2.appComponent;
            try {
              generatedManifest = await retrieveCard.getObjectPageCardManifestForPreview(appComponent, {
                cardType: cardType
              });
            } catch (error) {
              Log.error(error);
            }
            resolve(generatedManifest);
          });
          return;
        }).catch(function (error) {
          Log.error(error);
          reject();
        });
      });
    };
    _proto.publishCard = function publishCard(card) {
      this.channel.publishCard(this.id, {
        id: card["sap.app"].id,
        descriptorContent: card
      }, "*");
    };
    return CollaborationManagerService;
  }(Service);
  _exports.CollaborationManagerService = CollaborationManagerService;
  let CollaborationManagerServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function CollaborationManagerServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = CollaborationManagerServiceFactory;
    _inheritsLoose(CollaborationManagerServiceFactory, _ServiceFactory);
    var _proto2 = CollaborationManagerServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      this.instance = new CollaborationManagerService(oServiceContext);
      return this.instance.initPromise;
    };
    _proto2.getInstance = function getInstance() {
      return this.instance;
    };
    _proto2.shareAvailableCards = function shareAvailableCards() {
      this.instance.shareAvailableCards();
    };
    return CollaborationManagerServiceFactory;
  }(ServiceFactory);
  CollaborationManagerServiceFactory.serviceClass = CollaborationManagerService;
  _exports = CollaborationManagerServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=CollaborationManagerServiceFactory-dbg.js.map

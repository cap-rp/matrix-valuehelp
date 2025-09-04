/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const ParameterMap = {
    "FE.FilterBarSearch": [{
      name: "countFilterActions",
      type: "number"
    }, {
      name: "countFilters",
      type: "number"
    }, {
      name: "countVariantFilters",
      type: "number"
    }, {
      name: "variantLayer",
      type: "string"
    }, {
      name: "autoLoad",
      type: "boolean"
    }],
    "FE.Recommendations": [{
      name: "numberOfTimesRecommendationsFetched",
      type: "number"
    }, {
      name: "maxTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "minTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "averageTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "numberOfFieldsAcceptedThroughAcceptButton",
      type: "number"
    }, {
      name: "numberOfFieldsIgnoredThroughIgnoreButton",
      type: "number"
    }, {
      name: "numberOfTimesNoPlaceholderIsShownOnUI",
      type: "number"
    }, {
      name: "numberOfRecommendedFields",
      type: "number"
    }, {
      name: "numberOfTimesTopRecommendationsSelected",
      type: "number"
    }, {
      name: "numberOfTimesNonTopRecommendationsSelected",
      type: "number"
    }, {
      name: "numberOfTimesNonRecommendedValueWasSelected",
      type: "number"
    }, {
      name: "numberOfTimesEmptyRecommendations",
      type: "number"
    }, {
      name: "numberofTimesFormatterCalled",
      type: "number"
    }, {
      name: "totalNumberOfRecommendationsReceived",
      type: "number"
    }, {
      name: "numberOfTimesFormatterNotCalled",
      type: "number"
    }, {
      name: "totalTimeTaken",
      type: "number"
    }]
  };
  let TelemetryService = /*#__PURE__*/function (_Service) {
    function TelemetryService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      _this.isEnabled = false;
      return _this;
    }
    _exports.TelemetryService = TelemetryService;
    _inheritsLoose(TelemetryService, _Service);
    var _proto = TelemetryService.prototype;
    _proto.init = function init() {
      const context = this.getContext();
      this.appComponent = context?.scopeObject;
      const fioriDefinition = this.appComponent.getManifestEntry("sap.fiori");
      this.appId = fioriDefinition?.registrationIds?.join("-");
    };
    _proto.initialize = async function initialize() {
      // const environmentCapabilitiesService = (await this.appComponent.getService(
      // 	"environmentCapabilities"
      // )) as EnvironmentCapabilitiesService;
      // const feDefinition = this.appComponent.getManifestEntry("sap.fe");
      // if (
      // 	window.localStorage &&
      // 	feDefinition?.app?.enableTelemetry === true &&
      // 	environmentCapabilitiesService.getCapabilities().InsightsSupported &&
      // 	this.appId !== undefined
      // ) {
      // 	this.isEnabled = true;
      // }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("sap-ui-xx-feEnableGSM")?.toLowerCase() === "true") {
        this.isEnabled = true;
      }
      return Promise.resolve(this);
    }

    /**
     * Entry point for FE telemetry data reporting. It catches all exceptions so that
     * any unhandled errors do not affect regular FE app functionalities.
     * @param action A telemetry event that contain metrics to be reported to GSM.
     * @param sourceTemplate The template that this originated from.
     */;
    _proto.storeAction = async function storeAction(action, sourceTemplate) {
      if (this.isEnabled) {
        const telemetryEvent = {
          ...action,
          template: sourceTemplate
        };
        try {
          await this.storeAndFlush(telemetryEvent);
        } catch (e) {
          Log.debug(e);
        }
      }
    }

    /**
     * Instead of directly sending individual telemetry
     * events to backend, this API implements multiple strategies to reduce the frequency of sending
     * telemetry events, and automatically turn off sending telemetry after collecting adequate data
     * samples.
     * @param _telemetryEvent A telemetry event that contain metrics to be reported to GSM.
     */;
    _proto.storeAndFlush = async function storeAndFlush(_telemetryEvent) {
      // Skip if reach max count we should collect
      if (!this.validateEventCountPolicy()) {
        return;
      }
      // Skip if the endpoint didn't work recently
      if (!this.validateEndpointPolicy()) {
        return;
      }

      // Fetch telemetry events from store
      const eventsAsStr = window.localStorage.getItem(TelemetryService.EventStoreKey);
      let events;
      if (!eventsAsStr) {
        events = [];
      } else {
        events = JSON.parse(eventsAsStr);
      }
      events.push(_telemetryEvent);

      // Once we have CountBeforeFlush entries flush them
      if (events.length >= TelemetryService.CountBeforeFlush) {
        try {
          await this.flush(events);
          // Keep count of how many batches we have submitted in total
          this.incrementEventCountStore(events.length);
          this.clearEndpointStore();
        } catch {
          // Keep track if the endpoint was not reachable
          this.updateEndpointStore();
        }

        // No matter endpoint is reachable or not, we clean the storage anyway.
        // To avoid risk of accumulating large amount of telemetry data.
        // Hope we will collect useful data in the future.
        events = [];
      }

      // Save telemetry events back to store
      const telemetryEventStr = JSON.stringify(events);
      window.localStorage.setItem(TelemetryService.EventStoreKey, telemetryEventStr);
    }

    /**
     * Send a batch of telemetry events to GSM endpoint.
     * @param events An array of telemetry events
     * @returns The response from the GSM endpoint
     */;
    _proto.flush = async function flush(events) {
      const body = this.buildRequestBody(events);

      // Send a batch of 50 events to backend.
      return fetch(TelemetryService.targetUrl, {
        method: "POST",
        body
      });
    }

    /**
     * Utility function to serialize telemetry event to string format accepted by GSM endpoint.
     * Example output of a batch of 2 telemetry events looks like:
     * ui5_action{ type="FE.FilterBarSearch", countFilterActions=2, countFilters=1, countVariantFilters=1, variantLayer="variant0", autoLoad=true } 1
     * ui5_action{ type="FE.FilterBarSearch", countFilterActions=3, countFilters=1, countVariantFilters=0, variantLayer="variant1", autoLoad=false } 1
     * This will then be used with the gsm endpoint.
     * @param events An array of telemetry events
     * @returns Serialized data to be posted to GSM endpoint
     */;
    _proto.buildRequestBody = function buildRequestBody(events) {
      // This method is triggered when event size is greater or equal than TelemetryService.MaxTelemetry
      // Input is always an array list of events >= 0

      return events.map(event => {
        const parameterPerType = ParameterMap[event.type];
        const paramPart = parameterPerType.map(_ref => {
          let {
            name: paramName,
            type: paramType
          } = _ref;
          switch (paramType) {
            case "number":
            case "boolean":
              return `${paramName}=${event.parameters[paramName]}`;
            case "string":
            default:
              return `${paramName}="${event.parameters[paramName]}`;
          }
        });
        return `ui5_action{ type="${event.type}", ${paramPart.join(", ")} } 1\n`;
      }).join("");
    }

    /**
     * Set value to an entry in localStorage.
     * @param value New value in localStorage
     */;
    _proto.updateEventCountStore = function updateEventCountStore(value) {
      window.localStorage.setItem(TelemetryService.EventCountStoreKey, `${value}`);
    }

    /**
     * Add the input value to the existing value in an entry in localStorage.
     * @param value Amount incremented to an existing value
     */;
    _proto.incrementEventCountStore = function incrementEventCountStore(value) {
      const eventCountStr = window.localStorage.getItem(TelemetryService.EventCountStoreKey);

      // If store is empty, treat it as having value 0. Increment from 0 by amount 'value'.
      if (!eventCountStr) {
        this.updateEventCountStore(value);
        return;
      }

      // validateEventCountPolicy already sanitizes invalid events
      const eventCount = parseInt(eventCountStr, 10);
      this.updateEventCountStore(eventCount + value);
    }

    /**
     * To avoid risk of filling backend storage with telemetry data, this policy
     * tracks total amount of telemetry events sent to backend from a client, and
     * terminates sending telemetry events if max threshold reached.
     *
     * This is a best effort implementation. If localStorage is cleared by FE end user,
     * telemetry events will be sent again.
     * @returns `true` - submitted telemetry event count doesn't exceed limit
     *  `true` - no valid count was found, restart from 0
     *  `false` - submitted teleemtry event count exceeds limit
     */;
    _proto.validateEventCountPolicy = function validateEventCountPolicy() {
      const eventCountStr = window.localStorage.getItem(TelemetryService.EventCountStoreKey);
      if (!eventCountStr) {
        return true;
      }
      const eventCount = parseInt(eventCountStr, 10);
      if (isNaN(eventCount)) {
        // If invalid stored value found, reset it
        this.updateEventCountStore(0);
        return true;
      } else {
        return eventCount < TelemetryService.MaxTelemetry;
      }
    };
    _proto.updateEndpointStore = function updateEndpointStore() {
      window.localStorage.setItem(TelemetryService.EndpointStoreKey, `${Date.now()}`);
    };
    _proto.clearEndpointStore = function clearEndpointStore() {
      window.localStorage.removeItem(TelemetryService.EndpointStoreKey);
    }

    /**
     * Compare current timeInMilliseconds with the timeInMilliseconds stored in localStorage.
     * Usage: If connection to endpoint failed, it is likely the endpoint is not available on the target
     * system, stop collecting and send telemetry for period of time defined in TelemetryService.EndpointRetryPeriod.
     * @returns `true` - if there is no timestamp stored in localStorage.
     * 	`true` - if the elapsed time is greater than the value defined in TelemetryService.EndpointRetryPeriod.
     *  `false` - if the elapsed time is smaller than the value defined in TelemetryService.EndpointRetryPeriod.
     */;
    _proto.validateEndpointPolicy = function validateEndpointPolicy() {
      const timestamp = window.localStorage.getItem(TelemetryService.EndpointStoreKey);
      if (!timestamp) {
        return true;
      }
      const now = Date.now();
      const lastCheckTime = parseInt(timestamp, 10);
      if (isNaN(lastCheckTime)) {
        // time stamp of last failed endpoint connection is corrupted
        this.updateEndpointStore();
        return false;
      } else {
        return now - lastCheckTime > TelemetryService.EndpointRetryPeriod;
      }
    };
    return TelemetryService;
  }(Service);
  TelemetryService.MaxTelemetry = 500;
  _exports.TelemetryService = TelemetryService;
  TelemetryService.CountBeforeFlush = 50;
  TelemetryService.EndpointRetryPeriod = 1000 * 60 * 60 * 24;
  // 1 day
  TelemetryService.targetUrl = "/sap/bc/ui2/flp;sap-metrics-only";
  TelemetryService.EventStoreKey = "EventStore";
  TelemetryService.EndpointStoreKey = "EndpointStore";
  TelemetryService.EventCountStoreKey = "EventCountStore";
  let TelemetryServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function TelemetryServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = TelemetryServiceFactory;
    _inheritsLoose(TelemetryServiceFactory, _ServiceFactory);
    var _proto2 = TelemetryServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const instance = new TelemetryService(oServiceContext);
      return instance.initialize();
    };
    return TelemetryServiceFactory;
  }(ServiceFactory);
  _exports = TelemetryServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=TelemetryServiceFactory-dbg.js.map

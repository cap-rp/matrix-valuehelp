/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/ws/SapPcpWebSocket"], function (SapPcpWebSocket) {
  "use strict";

  var _exports = {};
  var SUPPORTED_PROTOCOLS = SapPcpWebSocket.SUPPORTED_PROTOCOLS;
  let WEBSOCKET_STATUS = /*#__PURE__*/function (WEBSOCKET_STATUS) {
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CLOSED"] = 0] = "CLOSED";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CLOSING"] = 1] = "CLOSING";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CONNECTING"] = 2] = "CONNECTING";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CONNECTED"] = 3] = "CONNECTED";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["ERROR"] = 4] = "ERROR";
    return WEBSOCKET_STATUS;
  }({});
  _exports.WEBSOCKET_STATUS = WEBSOCKET_STATUS;
  let ChannelType = /*#__PURE__*/function (ChannelType) {
    ChannelType["CollaborationDraft"] = "CollaborationDraft";
    ChannelType["SideEffectsEvents"] = "SideEffectsEvents";
    return ChannelType;
  }({});
  _exports.ChannelType = ChannelType;
  function createWebSocket(channelType, model, additionalParameters) {
    const hostLocation = window.location;
    const serviceUrl = model.getServiceUrl();
    const socketBaseURL = getWebSocketBaseUrl(model);
    if (!socketBaseURL) {
      throw Error("WebSocket Base URL annotation not found");
    }
    const channelUrl = getWebSocketChannelUrl(channelType, model);
    let socketURI;

    // Support useBackendUrl for local testing
    const useBackendUrl = new URLSearchParams(window.location.search).get("useBackendUrl");
    if (useBackendUrl) {
      socketURI = useBackendUrl.replace("https", "wss");
    } else {
      socketURI = hostLocation.protocol === "https:" ? "wss:" : "ws:";
      socketURI += `//${hostLocation.host}`;
    }
    socketURI += `${(socketBaseURL.startsWith("/") ? "" : "/") + socketBaseURL}?${channelUrl}relatedService=${serviceUrl}`;
    if (additionalParameters) {
      for (const p in additionalParameters) {
        socketURI += `&${p}=${encodeURI(additionalParameters[p])}`;
      }
    }
    return new SapPcpWebSocket(socketURI, [SUPPORTED_PROTOCOLS.v10]);
  }
  _exports.createWebSocket = createWebSocket;
  function getWebSocketBaseUrl(model) {
    return model.getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketBaseURL");
  }
  _exports.getWebSocketBaseUrl = getWebSocketBaseUrl;
  function getWebSocketChannelUrl(channelType, model) {
    if (!getWebSocketBaseUrl(model)) {
      return "";
    }
    switch (channelType) {
      case ChannelType.CollaborationDraft:
        // currently collaboration draft does not need a channel (might change later)
        return "";
      case ChannelType.SideEffectsEvents:
        // the service need a WebSocketChannel annotated with a #sideEffects qualifier
        const channelName = model.getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketChannel#sideEffects");
        return `sideEffects=${channelName}&`;
    }
  }
  _exports.getWebSocketChannelUrl = getWebSocketChannelUrl;
  return _exports;
}, false);
//# sourceMappingURL=WebSocket-dbg.js.map

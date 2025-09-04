import SapPcpWebSocket, { SUPPORTED_PROTOCOLS } from "sap/ui/core/ws/SapPcpWebSocket";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

export enum WEBSOCKET_STATUS {
	CLOSED = 0,
	CLOSING = 1,
	CONNECTING = 2,
	CONNECTED = 3,
	ERROR = 4
}

export enum ChannelType {
	CollaborationDraft = "CollaborationDraft",
	SideEffectsEvents = "SideEffectsEvents"
}

export type WebSocketParameter = Record<string, string>;

export function createWebSocket(channelType: ChannelType, model: ODataModel, additionalParameters?: WebSocketParameter): SapPcpWebSocket {
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

export function getWebSocketBaseUrl(model: ODataModel): string | undefined {
	return model.getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketBaseURL");
}

export function getWebSocketChannelUrl(channelType: ChannelType, model: ODataModel): string | undefined {
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

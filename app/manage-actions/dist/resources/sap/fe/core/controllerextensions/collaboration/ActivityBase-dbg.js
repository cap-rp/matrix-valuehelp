/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/WebSocket", "sap/m/MessageBox"], function (CollaborationCommon, ResourceModelHelper, WebSocket, MessageBox) {
  "use strict";

  var _exports = {};
  var createWebSocket = WebSocket.createWebSocket;
  var WEBSOCKET_STATUS = WebSocket.WEBSOCKET_STATUS;
  var ChannelType = WebSocket.ChannelType;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var Activity = CollaborationCommon.Activity;
  const COLLABORATION = "/collaboration";
  const CONNECTION = "/collaboration/connection";
  const CURRENTDRAFTID = "/collaboration/DraftID";
  const WEBSOCKETSTATUS = "/collaboration/websocket_status";
  function isCollaborationConnected(internalModel) {
    return internalModel.getProperty(WEBSOCKETSTATUS) === WEBSOCKET_STATUS.CONNECTED;
  }

  /**
   * Initializes the collaboration websocket.
   * @param user
   * @param draftUUID
   * @param internalModel
   * @param receiveCallback
   * @param view
   * @param sendUserInfo
   * @returns True if a new websocket was created
   */
  _exports.isCollaborationConnected = isCollaborationConnected;
  function initializeCollaboration(user, draftUUID, internalModel, receiveCallback, view) {
    let sendUserInfo = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    if (internalModel.getProperty(CONNECTION)) {
      // A connection is already established
      if (internalModel.getProperty(CURRENTDRAFTID) === draftUUID) {
        // Connection corresponds to the same draft -> nothing to do
        return false;
      } else {
        // There was a connection to another draft -> we close it before creating a new one
        // This can happen e.g. when switching between items in FCL
        endCollaboration(internalModel);
      }
    }
    const activeUsers = [user];
    internalModel.setProperty(COLLABORATION, {
      activeUsers: activeUsers,
      activities: {}
    });
    const additionalParameters = {
      draft: draftUUID
    };
    if (sendUserInfo || new URLSearchParams(window.location.search).get("useFLPUser") === "true") {
      // used for internal testing
      additionalParameters["userID"] = user.id;
      additionalParameters["userName"] = user.initialName ?? "";
    }
    const webSocket = createWebSocket(ChannelType.CollaborationDraft, view.getModel(), additionalParameters);
    internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CONNECTING);
    internalModel.setProperty(CONNECTION, webSocket);
    internalModel.setProperty(CURRENTDRAFTID, draftUUID);
    webSocket.attachMessage(function (event) {
      const message = event.getParameter("pcpFields");
      if (message) {
        receiveCallback(message);
      }
    });
    webSocket.attachOpen(function () {
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CONNECTED);
    });
    function showConnectionLostDialog() {
      const resourceModel = getResourceModel(view);
      const lostOfConnectionText = resourceModel.getText("C_COLLABORATIONDRAFT_CONNECTION_LOST");
      MessageBox.warning(lostOfConnectionText, {
        actions: [MessageBox.Action.OK],
        emphasizedAction: MessageBox.Action.OK
      });
    }
    webSocket.attachError(function () {
      if ([WEBSOCKET_STATUS.CONNECTING, WEBSOCKET_STATUS.CONNECTED].includes(internalModel.getProperty(WEBSOCKETSTATUS))) {
        showConnectionLostDialog();
      }
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.ERROR);
    });
    webSocket.attachClose(function (evt) {
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CLOSED);
      // RFC 6455 defines the status codes when closing an established connection :  https://datatracker.ietf.org/doc/html/rfc6455#section-7.4
      // status code 1000 means normal closure
      if (evt.getParameter("code") !== 1000) {
        showConnectionLostDialog();
      }
    });
    return true;
  }
  _exports.initializeCollaboration = initializeCollaboration;
  function broadcastCollaborationMessage(action, content, internalModel, triggeredActionName, refreshListBinding, requestedProperties) {
    if (isCollaborationConnected(internalModel)) {
      const webSocket = internalModel.getProperty(CONNECTION);
      webSocket.send("", {
        clientAction: action,
        clientContent: content,
        clientTriggeredActionName: triggeredActionName,
        clientRefreshListBinding: refreshListBinding,
        clientRequestedProperties: requestedProperties
      });
      if (action === Activity.Activate || action === Activity.Discard) {
        endCollaboration(internalModel);
      }
    }
  }
  _exports.broadcastCollaborationMessage = broadcastCollaborationMessage;
  function endCollaboration(internalModel) {
    const webSocket = internalModel.getProperty(CONNECTION);
    internalModel.setProperty(COLLABORATION, {});
    internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CLOSING);
    webSocket?.close();
  }
  _exports.endCollaboration = endCollaboration;
  return _exports;
}, false);
//# sourceMappingURL=ActivityBase-dbg.js.map

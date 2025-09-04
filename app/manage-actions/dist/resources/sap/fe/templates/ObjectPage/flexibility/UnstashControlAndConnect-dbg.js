/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/fl/LayerUtils", "sap/ui/fl/changeHandler/UnstashControl"], function (LayerUtils, UnstashControl) {
  "use strict";

  var _exports = {};
  let UnstashControlAndConnect = /*#__PURE__*/function () {
    function UnstashControlAndConnect() {}
    _exports = UnstashControlAndConnect;
    UnstashControlAndConnect.applyChange = async function applyChange(change, control, propertyBag) {
      await UnstashControl.applyChange(change, control, propertyBag);
      if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
        // If we're at the key user layer we should force the disconnect as the stash is just a hide
        propertyBag.modifier.setProperty(control, "_disconnected", false);
      }
    };
    UnstashControlAndConnect.revertChange = async function revertChange(change, control, propertyBag) {
      await UnstashControl.revertChange(change, control, propertyBag);
      if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
        // If we're at the key user layer we should force the disconnect as the stash is just a hide
        propertyBag.modifier.setProperty(control, "_disconnected", true);
      }
    };
    UnstashControlAndConnect.completeChangeContent = function completeChangeContent() {};
    UnstashControlAndConnect.getCondenserInfo = function getCondenserInfo(change) {
      return UnstashControl.getCondenserInfo(change);
    };
    UnstashControlAndConnect.getChangeVisualizationInfo = function getChangeVisualizationInfo(change, appComponent) {
      return UnstashControl.getChangeVisualizationInfo(change, appComponent);
    };
    return UnstashControlAndConnect;
  }();
  _exports = UnstashControlAndConnect;
  return _exports;
}, false);
//# sourceMappingURL=UnstashControlAndConnect-dbg.js.map

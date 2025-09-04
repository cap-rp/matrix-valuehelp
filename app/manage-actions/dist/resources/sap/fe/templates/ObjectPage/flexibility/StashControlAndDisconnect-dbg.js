/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/fl/LayerUtils", "sap/ui/fl/changeHandler/StashControl"], function (LayerUtils, StashControl) {
  "use strict";

  var _exports = {};
  let StashControlAndDisconnect = /*#__PURE__*/function () {
    function StashControlAndDisconnect() {}
    _exports = StashControlAndDisconnect;
    StashControlAndDisconnect.applyChange = async function applyChange(change, control, propertyBag) {
      await StashControl.applyChange(change, control, propertyBag);
      if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
        // If we're at the key user layer we should force the disconnect as the stash is just a hide
        propertyBag.modifier.setProperty(control, "_disconnected", true);
      }
    };
    StashControlAndDisconnect.revertChange = async function revertChange(change, control, propertyBag) {
      await StashControl.revertChange(change, control, propertyBag);
      if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
        // If we're at the key user layer we should force the disconnect as the stash is just a hide
        propertyBag.modifier.setProperty(control, "_disconnected", false);
      }
    };
    StashControlAndDisconnect.completeChangeContent = function completeChangeContent() {};
    StashControlAndDisconnect.getCondenserInfo = function getCondenserInfo(change) {
      return StashControl.getCondenserInfo(change);
    };
    StashControlAndDisconnect.getChangeVisualizationInfo = function getChangeVisualizationInfo(change, appComponent) {
      return StashControl.getChangeVisualizationInfo(change, appComponent);
    };
    return StashControlAndDisconnect;
  }();
  _exports = StashControlAndDisconnect;
  return _exports;
}, false);
//# sourceMappingURL=StashControlAndDisconnect-dbg.js.map

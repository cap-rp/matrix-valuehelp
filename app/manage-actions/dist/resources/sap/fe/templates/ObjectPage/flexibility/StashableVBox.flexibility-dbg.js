/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/templates/ObjectPage/flexibility/StashControlAndDisconnect", "sap/fe/templates/ObjectPage/flexibility/UnstashControlAndConnect"], function (StashControlAndDisconnect, UnstashControlAndConnect) {
  "use strict";

  const StashableVBoxFlexibility = {
    stashControl: StashControlAndDisconnect,
    unstashControl: UnstashControlAndConnect,
    moveControls: "default"
  };
  return StashableVBoxFlexibility;
}, false);
//# sourceMappingURL=StashableVBox.flexibility-dbg.js.map

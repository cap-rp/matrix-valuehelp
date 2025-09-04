/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/fl/changeHandler/BaseRename", "./StashControlAndDisconnect", "./UnstashControlAndConnect"], function (BaseRename, StashControlAndDisconnect, UnstashControlAndConnect) {
  "use strict";

  const StashableHBoxFlexibility = {
    stashControl: StashControlAndDisconnect,
    unstashControl: UnstashControlAndConnect,
    renameHeaderFacet: BaseRename.createRenameChangeHandler({
      propertyName: "title",
      translationTextType: "XFLD",
      changePropertyName: "headerFacetTitle"
    })
  };
  return StashableHBoxFlexibility;
}, false);
//# sourceMappingURL=StashableHBox.flexibility-dbg.js.map

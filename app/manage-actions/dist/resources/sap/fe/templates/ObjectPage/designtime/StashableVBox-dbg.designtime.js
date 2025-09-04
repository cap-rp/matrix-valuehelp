/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Lib"], function (Library) {
  "use strict";

  const oResourceBundle = Library.getResourceBundleFor("sap.fe.templates");
  const StashableVBoxDesignTime = {
    actions: {
      remove: {
        changeType: "stashControl"
      },
      reveal: {
        changeType: "unstashControl"
      }
    },
    name: {
      singular: function () {
        return oResourceBundle.getText("T_STASHABLE_VBOX_RTA_HEADERCOLLECTIONFACET_MENU_ADD");
      },
      plural: function () {
        return oResourceBundle.getText("T_STASHABLE_VBOX_RTA_HEADERCOLLECTIONFACET_MENU_ADD_PLURAL");
      }
    },
    palette: {
      group: "LAYOUT",
      icons: {
        svg: "sap/m/designtime/VBox.icon.svg"
      }
    },
    templates: {
      create: "sap/m/designtime/VBox.create.fragment.xml"
    }
  };
  return StashableVBoxDesignTime;
}, false);
//# sourceMappingURL=StashableVBox-dbg.designtime.js.map

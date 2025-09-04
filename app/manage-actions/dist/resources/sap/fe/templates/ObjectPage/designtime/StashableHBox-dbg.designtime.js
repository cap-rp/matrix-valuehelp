/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Lib"], function (Library) {
  "use strict";

  const oResourceBundle = Library.getResourceBundleFor("sap.fe.templates");
  const StashableHBoxDesignTime = {
    actions: {
      remove: {
        changeType: "stashControl"
      },
      reveal: {
        changeType: "unstashControl"
      },
      rename: function /*oHeaderFacet: any*/
      () {
        return {
          changeType: "renameHeaderFacet",
          domRef: function (oControl) {
            const oTitleControl = oControl.getTitleControl();
            if (oTitleControl) {
              return oTitleControl.getDomRef();
            } else {
              return null;
            }
          }
        };
      }
    },
    name: {
      singular: function () {
        return oResourceBundle.getText("T_STASHABLE_HBOX_RTA_HEADERFACET_MENU_ADD");
      },
      plural: function () {
        return oResourceBundle.getText("T_STASHABLE_HBOX_RTA_HEADERFACET_MENU_ADD_PLURAL");
      }
    },
    palette: {
      group: "LAYOUT",
      icons: {
        svg: "sap/m/designtime/HBox.icon.svg"
      }
    },
    templates: {
      create: "sap/m/designtime/HBox.create.fragment.xml"
    }
  };
  return StashableHBoxDesignTime;
}, false);
//# sourceMappingURL=StashableHBox-dbg.designtime.js.map

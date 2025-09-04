import type StashableHBox from "sap/fe/templates/ObjectPage/controls/StashableHBox";
import Library from "sap/ui/core/Lib";

const oResourceBundle = Library.getResourceBundleFor("sap.fe.templates")!;

const StashableHBoxDesignTime = {
	actions: {
		remove: {
			changeType: "stashControl"
		},
		reveal: {
			changeType: "unstashControl"
		},
		rename: function (/*oHeaderFacet: any*/): { changeType: string; domRef: Function } {
			return {
				changeType: "renameHeaderFacet",
				domRef: function (oControl: StashableHBox): Element | null {
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
		singular: function (): string {
			return oResourceBundle.getText("T_STASHABLE_HBOX_RTA_HEADERFACET_MENU_ADD");
		},
		plural: function (): string {
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

export default StashableHBoxDesignTime;

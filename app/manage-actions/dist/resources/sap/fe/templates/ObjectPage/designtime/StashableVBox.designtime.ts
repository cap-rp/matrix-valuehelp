import Library from "sap/ui/core/Lib";

const oResourceBundle = Library.getResourceBundleFor("sap.fe.templates")!;

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
		singular: function (): string {
			return oResourceBundle.getText("T_STASHABLE_VBOX_RTA_HEADERCOLLECTIONFACET_MENU_ADD");
		},
		plural: function (): string {
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

export default StashableVBoxDesignTime;

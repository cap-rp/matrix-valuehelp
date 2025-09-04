import BaseRename from "sap/ui/fl/changeHandler/BaseRename";
import StashControlAndDisconnect from "./StashControlAndDisconnect";
import UnstashControlAndConnect from "./UnstashControlAndConnect";

const StashableHBoxFlexibility = {
	stashControl: StashControlAndDisconnect,
	unstashControl: UnstashControlAndConnect,
	renameHeaderFacet: BaseRename.createRenameChangeHandler({
		propertyName: "title",
		translationTextType: "XFLD",
		changePropertyName: "headerFacetTitle"
	})
};

export default StashableHBoxFlexibility;

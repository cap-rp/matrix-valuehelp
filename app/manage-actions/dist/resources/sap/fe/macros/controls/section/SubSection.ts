import { defineUI5Class, mixin, property } from "sap/fe/base/ClassSupport";
import SubSectionStateHandler from "sap/fe/macros/controls/section/mixin/SubSectionStateHandler";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";

@defineUI5Class("sap.fe.macros.controls.section.SubSection", { designtime: "sap/uxap/designtime/ObjectPageSubSection.designtime" })
@mixin(SubSectionStateHandler)
class SubSection extends ObjectPageSubSection {
	/**
	 * Path to the apply-state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	applyStateHandler?: string;

	/**
	 * Path to the retrieve-state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	retrieveStateHandler?: string;
}

export default SubSection;

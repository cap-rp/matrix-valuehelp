import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { association, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

@defineUI5Class("sap.fe.macros.contentSwitcher.ContentSwitcherItem")
export default class ContentSwitcherItem extends BuildingBlockObjectProperty {
	constructor(settings?: string | PropertiesOf<ContentSwitcherItem>, otherSettings?: PropertiesOf<ContentSwitcherItem>) {
		super(settings as string, otherSettings);
	}
	/**
	 * The text that will be displayed in the segmented button
	 */
	@property({ type: "string" })
	text?: string;

	/**
	 * The ID of the control that will be displayed when the item is selected
	 */
	@association({ type: "string" })
	controlToSwitch?: string;

	/**
	 * The icon that will be displayed in the segmented button
	 */
	@property({ type: "string" })
	icon?: string;

	@property({ type: "string" })
	key?: string;
}

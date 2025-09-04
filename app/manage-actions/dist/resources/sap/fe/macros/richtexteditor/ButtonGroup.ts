import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import UI5Element from "sap/ui/core/Element";

/**
 * Button configurations for the RichTextEditor.
 * @public
 */
@defineUI5Class("sap.fe.macros.richtexteditor.ButtonGroup")
export default class ButtonGroup extends UI5Element {
	/**
	 * The name of the group.
	 * @public
	 */
	@property({ type: "string" })
	name?: string;

	/**
	 * Whether the group is visible.
	 * @public
	 */
	@property({ type: "string" })
	visible?: string;

	/**
	 * The priority of the group.
	 * @public
	 */
	@property({ type: "int" })
	priority?: number;

	/**
	 * Row number in which the button should be
	 * @public
	 */
	@property({ type: "int" })
	row?: number;

	/**
	 * The priority of the group in the custom toolbar.
	 * @public
	 */
	@property({ type: "int" })
	customToolbarPriority?: number;

	/**
	 * The buttons to be displayed in the group.
	 * @public
	 */
	@property({ type: "string" })
	buttons?: string;
}

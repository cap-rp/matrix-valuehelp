import { compileExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import ButtonGroup from "sap/fe/macros/richtexteditor/ButtonGroup";
import PluginDefinition from "sap/fe/macros/richtexteditor/Plugin";
import FormattedText from "sap/m/FormattedText";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import RichTextEditor from "sap/ui/richtexteditor/RichTextEditor";

type PluginDefinitionData = {
	name: string;
};
type ButtonGroupData = {
	name: string;
	visible: boolean;
	priority?: number;
	row?: number;
	customToolbarPriority?: number;
	buttons: string[];
};

/**
 * Building block that exposes the RichTextEditor UI5 control.
 *
 * It's used to enter formatted text, and uses the third-party component called TinyMCE.
 * @public
 * @since 1.117.0
 */
@defineUI5Class("sap.fe.macros.RichTextEditor")
export default class RichTextEditorBlock extends BuildingBlock<Control> {
	/**
	 * ID of the editor
	 */
	@property({ type: "string", required: true })
	id!: string;

	/**
	 * The value contained in the editor. You can use this attribute to set a default value.
	 * @public
	 */
	@property({ type: "any", isBindingInfo: true })
	value?: PropertyBindingInfo;

	/**
	 * Use the readOnly attribute to override the edit flow of the page.
	 * By setting 'readOnly' to true, a FormattedText will be displayed instead of the editor.
	 * @public
	 */
	@property({ type: "boolean" })
	readOnly: PropertyBindingInfo = false;

	/**
	 * With the 'buttonGroups' attribute you can customize the buttons that are displayed on the toolbar of the editor.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.richtexteditor.ButtonGroup", multiple: true, defaultClass: ButtonGroup })
	buttonGroups: ButtonGroup[] = [];

	/**
	 * With the 'plugins' attribute you can customize the plugins that will be loaded by the editor.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.richtexteditor.Plugin", multiple: true, defaultClass: PluginDefinition })
	plugins?: PluginDefinition[];

	/**
	 * With the 'excludeDefaultPlugins' you can ask to remove the plugins that will be added by default
	 * The default plugins are "emoticons" "directionality" "image" "table" "link" "powerpaste".
	 * @public
	 */
	@property({ type: "boolean" })
	excludeDefaultPlugins = false;

	/**
	 * Use the 'required' attribute to make sure that the editor is filled with some text.
	 * @public
	 */
	@property({ type: "any", bindable: false })
	required: PropertyBindingInfo = false;

	@property({ type: "boolean" })
	_isInEditMode: PropertyBindingInfo = false;

	private _displayContent?: FormattedText;

	private _editContent?: RichTextEditor;

	private _contentTimer?: number;

	constructor(properties: $ControlSettings & PropertiesOf<RichTextEditorBlock>, others?: $ControlSettings) {
		properties._isInEditMode = compileExpression(UI.IsEditable);
		super(properties, others);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	createContentDebounced(): void {
		if (this._contentTimer) {
			clearTimeout(this._contentTimer);
		}
		this._contentTimer = setTimeout(() => {
			this.content = this.createContent();
		}, 200) as unknown as number;
	}

	exit(): void {
		this._displayContent?.destroy();
		this._editContent?.destroy();
	}

	/**
	 * Method that returns the button customizations for the editor toolbar.
	 * Because all values come as strings from XML, some parsing needs to be done to get attributes with the correct type.
	 * @returns The button groups.
	 */
	getPlugins = (): { plugins?: PluginDefinitionData[] } => {
		let pluginsArray: PluginDefinitionData[] | undefined;
		if (this.excludeDefaultPlugins) {
			pluginsArray = [];
		} else {
			pluginsArray = ["emoticons", "directionality", "image", "table", "link", "powerpaste"].map((name: string) => {
				return { name: name };
			});
		}
		if (this.plugins?.length) {
			for (const plugin of this.plugins) {
				pluginsArray.push(plugin);
			}
		}
		return { plugins: pluginsArray };
	};

	/**
	 * Method that returns the button customizations for the editor toolbar.
	 * Because all values come as strings from XML, some parsing needs to be done to get attributes with the correct type.
	 * @returns The button groups.
	 */
	getButtonGroups = (): ButtonGroupData[] => {
		if (this.buttonGroups && this.buttonGroups.length > 0) {
			return this.buttonGroups.map((buttonGroup: ButtonGroup) => ({
				name: buttonGroup.name ?? "",
				visible: buttonGroup.visible === "true",
				priority: buttonGroup.priority,
				row: buttonGroup.row,
				customToolbarPriority: buttonGroup.customToolbarPriority,
				buttons: buttonGroup.buttons?.split(",") || []
			}));
		}
		return [];
	};

	set_isInEditMode(inEditMode: boolean): void {
		super.setProperty("_isInEditMode", inEditMode);
		this.createContentDebounced();
	}

	setReadOnly(readOnly: boolean): void {
		super.setProperty("readOnly", readOnly);
		this.createContentDebounced();
	}

	getEditContent = (): RichTextEditor => {
		if (this._editContent) {
			// It's better to destroy the rich text editor as in some case with slow machine switching between edit and display may break it
			this._editContent.destroy();
		}

		this._editContent = (
			<RichTextEditor
				id={this.createId("_rte")}
				value={this.value}
				visible={true}
				customToolbar={true}
				editable={true}
				editorType="TinyMCE6"
				showGroupFontStyle={true}
				showGroupTextAlign={true}
				showGroupStructure={true}
				showGroupFont={false}
				showGroupClipboard={true}
				showGroupInsert={false}
				showGroupLink={false}
				showGroupUndo={false}
				sanitizeValue={true}
				wrapping={true}
				width={"100%"}
				required={this.required}
				{...this.getPlugins()}
				buttonGroups={this.buttonGroups.length > 0 ? [] : undefined}
			/>
		) as RichTextEditor;

		this._editContent.attachReady(this.addButtonGroups, this);
		return this._editContent;
	};

	/**
	 * Buttons groups need to be added when the RTE is ready, otherwise some of them are not available.
	 */
	addButtonGroups(): void {
		const lateButtonGroups = this.getButtonGroups().reverse();
		// They also somehow need to be added in reverse because they also get added in the first place :D
		for (const lateButtonGroup of lateButtonGroups) {
			this._editContent?.addButtonGroup(lateButtonGroup);
		}
		this._editContent?.detachReady(this.addButtonGroups, this);
	}

	getDisplayContent(): FormattedText {
		if (this._displayContent) {
			this._displayContent.destroy();
		}
		this._displayContent = (<FormattedText htmlText={this.value} />) as FormattedText;
		return this._displayContent;
	}

	createContent(): RichTextEditor | FormattedText {
		if (this._isInEditMode && !this.readOnly) {
			return this.getEditContent();
		} else {
			return this.getDisplayContent();
		}
	}
}

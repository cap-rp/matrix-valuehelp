import type { Property } from "@sap-ux/vocabularies-types";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import RichTextEditorBlock from "sap/fe/macros/RichTextEditor";
import { getValueBinding } from "sap/fe/macros/field/FieldTemplating";
import type { $ControlSettings } from "sap/ui/core/Control";

/**
 * Metadata-driven building block that exposes the RichTextEditor UI5 control.
 *
 * It's used to enter formatted text and uses the third-party component called TinyMCE.
 * @public
 * @since 1.117.0
 */
@defineUI5Class("sap.fe.macros.RichTextEditorWithMetadata")
export default class RichTextEditorWithMetadata extends RichTextEditorBlock {
	/**
	 * The metaPath of the displayed property
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	metaPath!: string;

	/**
	 * The context path of the property displayed
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	contextPath!: string;

	constructor(properties: $ControlSettings & PropertiesOf<RichTextEditorWithMetadata>, others?: $ControlSettings) {
		super(properties, others);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		const involvedDataModelObjects = this.getDataModelObjectForMetaPath<Property>(this.metaPath, this.contextPath);
		if (involvedDataModelObjects) {
			this.value = getValueBinding(involvedDataModelObjects, {});
		}
		super.onMetadataAvailable(_ownerComponent);
	}
}

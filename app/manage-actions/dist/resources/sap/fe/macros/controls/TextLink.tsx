import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import * as SemanticObjectHelper from "sap/fe/core/templating/SemanticObjectHelper";
import Link, { type Link$PressEvent } from "sap/m/Link";
import Text from "sap/m/Text";
import { LinkAccessibleRole } from "sap/m/library";
import type { $ControlSettings } from "sap/ui/core/Control";

@defineUI5Class("sap.fe.macros.controls.TextLink")
export default class TextLink extends BuildingBlock<Text | Link> {
	@property({ type: "boolean", defaultValue: false })
	showAsLink?: boolean;

	@property({ type: "string", required: false })
	semanticObject!: string;

	@property({ type: "boolean", defaultValue: false })
	wrapping!: boolean;

	@property({ type: "string", required: false })
	text!: string;

	@property({ type: "string", required: false })
	emptyIndicatorMode!: string;

	@event()
	press?: (event: Link$PressEvent) => void;

	constructor(properties: $ControlSettings & PropertiesOf<TextLink>, others?: $ControlSettings) {
		super(properties, others);

		this.updateContent();
	}

	/**
	 * Setter for the semanticObject property.
	 * @param semanticObject
	 */
	setSemanticObject(semanticObject: string | undefined): void {
		if (semanticObject) {
			let semanticObjectsList: string[] = [];
			this.semanticObject = semanticObject;
			const availableSemanticObjectsToUser: string[] = this.getModel("internal")?.getObject("/semanticObjects") ?? [];
			semanticObjectsList = semanticObject.startsWith("[") ? JSON.parse(semanticObject) : [semanticObject];
			this.setShowAsLink(
				SemanticObjectHelper.getReachableSemanticObjectsSettings(availableSemanticObjectsToUser, {
					semanticObjectsList: semanticObjectsList,
					semanticObjectsExpressionList: [],
					qualifierMap: {}
				}).hasReachableStaticSemanticObject
			);
		}
	}

	/**
	 * Setter for the showAsLink property.
	 * @param showAsLink
	 */
	setShowAsLink(showAsLink: boolean): void {
		if (showAsLink !== this.showAsLink) {
			this.setProperty("showAsLink", showAsLink);
			this.updateContent();
		}
	}

	/**
	 * Setter for the text property.
	 * @param text
	 */
	setText(text: string): void {
		// in case the text is set after the inner control creation we need to forward it
		this.setProperty("text", text);
		this.content?.setText(text);
	}

	createContent(): Text | Link {
		if (this.showAsLink === true) {
			return (
				<Link
					text={this.text}
					wrapping={this.wrapping}
					emptyIndicatorMode={this.emptyIndicatorMode}
					press={(pressEvent): void => {
						this.fireEvent("press", pressEvent);
					}}
					accessibleRole={LinkAccessibleRole.Button}
				/>
			);
		} else {
			return <Text text={this.text} wrapping={this.wrapping} emptyIndicatorMode={this.emptyIndicatorMode} />;
		}
	}

	updateContent(): void {
		if (this.content) {
			this.content.destroy();
		}
		this.content = this.createContent();
	}
}

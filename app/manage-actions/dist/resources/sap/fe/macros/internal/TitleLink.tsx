import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Link from "sap/m/Link";
import Title from "sap/m/Title";
import { LinkAccessibleRole } from "sap/m/library";
import type { $ControlSettings } from "sap/ui/core/Control";
import InvisibleText from "sap/ui/core/InvisibleText";

/**
 * Building block used to create title for all the micro charts
 * @private
 */
@defineUI5Class("sap.fe.macros.internal.TitleLink")
export default class TitleLink extends BuildingBlock<Title> {
	@property({ type: "string" })
	id?: string;

	@property({ type: "string" })
	text?: string;

	@property({ type: "boolean" })
	showAsLink?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "string", isBindingInfo: true })
	linkAriaText?: string;

	@event()
	linkPress?: Function;

	constructor(settings: PropertiesOf<TitleLink>, others?: $ControlSettings) {
		super(settings, others);
	}

	public onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	/**
	 * Setter for the showAsLink property.
	 * @param showAsLink
	 */
	setShowAsLink(showAsLink: boolean): void {
		if (showAsLink !== this.showAsLink) {
			this.setProperty("showAsLink", showAsLink);
			this.content = this.createContent();
		}
	}

	/**
	 * The building block render function.
	 * @returns Title which will contain link or not based on showAsLink value.
	 */
	public createContent(): Title {
		let link;
		if (this.showAsLink) {
			link = (
				<Link
					text={this.text}
					press={(pressEvent): void => {
						this.fireEvent("linkPress", pressEvent);
					}}
					accessibleRole={LinkAccessibleRole.Button}
				/>
			) as Link;
			if (this.linkAriaText) {
				const invisibleText = <InvisibleText text={this.linkAriaText} />;
				link.addAriaDescribedBy(invisibleText);
			}
		}
		return (
			<Title level="H3" text={this.text}>
				{{
					content: link
				}}
			</Title>
		);
	}
}

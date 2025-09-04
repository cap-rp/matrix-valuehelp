import DynamicPage from "sap/f/DynamicPage";
import DynamicPageHeader from "sap/f/DynamicPageHeader";
import DynamicPageTitle from "sap/f/DynamicPageTitle";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import ObjectTitle from "sap/fe/macros/ObjectTitle";
import Avatar from "sap/m/Avatar";
import AvatarShape from "sap/m/AvatarShape";
import AvatarSize from "sap/m/AvatarSize";
import FlexBox from "sap/m/FlexBox";
import Label from "sap/m/Label";
import Title from "sap/m/Title";
import type Control from "sap/ui/core/Control";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * Provides a Page building block that can be used to create a page with a title and content
 * By default, the page comes with an ObjectTitle
 * @public
 */
@defineUI5Class("sap.fe.macros.Page")
export default class Page extends BuildingBlock {
	/**
	 * Content(s) of the page
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true, isDefault: true })
	items!: Control[];

	/**
	 * @private
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	actions!: Control[];

	/**
	 * Title of the page
	 * If title is not given, then we will add a title, avatar and description based on the unqualified HeaderInfo associated to the entity
	 * @public
	 */
	@property({ type: "string" })
	title?: string;

	/**
	 * @private
	 */
	@property({ type: "boolean" })
	editable = false;

	/**
	 * Description of the page. It is considered only if the title property is specified.
	 * @public
	 */
	@property({ type: "string" })
	description?: string;

	/**
	 * Avatar source of the page. It is considered only if the title property is specified.
	 * @public
	 */
	@property({ type: "string" })
	avatarSrc?: string;

	constructor(idOrSettings: string);

	constructor(idOrSettings: PropertiesOf<Page>);

	constructor(idOrSettings: string | PropertiesOf<Page>, settings?: PropertiesOf<Page>) {
		super(idOrSettings, settings);
	}

	onMetadataAvailable(): void {
		this.content = this.createContent();
	}

	private createAvatar(isExpanded: boolean): Avatar | undefined {
		if (this.avatarSrc) {
			return (
				<Avatar
					class="sapUiSmallMarginEnd"
					src={this.avatarSrc}
					displayShape={AvatarShape.Square}
					displaySize={isExpanded ? AvatarSize.XL : AvatarSize.S}
				/>
			);
		}
	}

	private createTitle(): Title {
		return <Title text={this.title} />;
	}

	private createDescription(): Label {
		return <Label text={this.description} />;
	}

	private getTitlePart(): FlexBox | ObjectTitle {
		if (this.title && this.description) {
			return <FlexBox direction="Column">{{ items: [this.createTitle(), this.createDescription()] }}</FlexBox>;
		} else if (this.title) {
			return <FlexBox direction="Column">{{ items: [this.createTitle()] }}</FlexBox>;
		} else {
			return <ObjectTitle />;
		}
	}

	private createContent(): DynamicPage {
		return (
			<DynamicPage id={this.createId("page")}>
				{{
					title: (
						<DynamicPageTitle id={this.createId("title")}>
							{{
								expandedHeading: this.getTitlePart(),
								snappedHeading: (
									<FlexBox renderType="Bare">{{ items: [this.createAvatar(false), this.getTitlePart()] }}</FlexBox>
								),
								actions: this.actions
							}}
						</DynamicPageTitle>
					),
					header: <DynamicPageHeader>{this.createAvatar(true)}</DynamicPageHeader>,
					content: (
						<FlexBox id={this.createId("content")} direction="Column">
							{{
								items: this.items.map((item) => {
									item.addStyleClass("sapUiMediumMarginBottom");
									return item;
								})
							}}
						</FlexBox>
					),
					dependents: [
						<CommandExecution
							execute={(): void => {
								const oContext = this.getBindingContext() as Context;
								const oModel = this.getModel("ui")!;
								BusyLocker.lock(oModel);
								this.getPageController()
									?.editFlow?.editDocument(oContext)
									.finally(function () {
										BusyLocker.unlock(oModel);
									});
							}}
							enabled={true}
							visible={true}
							command="Edit"
						/>
					]
				}}
			</DynamicPage>
		);
	}
}

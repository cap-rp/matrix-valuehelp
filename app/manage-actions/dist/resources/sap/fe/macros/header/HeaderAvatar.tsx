import type { EntitySet, Property } from "@sap-ux/vocabularies-types";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Avatar from "sap/m/Avatar";
import AvatarImageFitType from "sap/m/AvatarImageFitType";
import AvatarSize from "sap/m/AvatarSize";
import LightBox from "sap/m/LightBox";
import LightBoxItem from "sap/m/LightBoxItem";
import type { $ControlSettings } from "sap/ui/core/Control";
import { getTextBindingExpression } from "../field/FieldTemplating";
import HeaderHelper from "./HeaderHelper";

/**
 * Building block used to create avatar in the object page header
 * @private
 */
@defineUI5Class("sap.fe.macros.header.HeaderAvatar")
export default class HeaderAvatar extends BuildingBlock {
	@property({ type: "string", isBindingInfo: true })
	src?: string;

	@property({ type: "string" })
	initials?: string;

	@property({ type: "string" })
	fallbackIcon?: string;

	@property({ type: "string" })
	displayShape?: string;

	constructor(settings: PropertiesOf<HeaderAvatar>, others?: $ControlSettings) {
		super(settings, others);
		this.content = this.createContent();
	}

	private createContent(): Avatar | undefined {
		if (!this.src) {
			return;
		}

		const owner = this._getOwner();
		const dataModelObjectPath = this.getDataModelObjectPath(owner?.preprocessorContext?.fullContextPath);
		const headerInfo = dataModelObjectPath?.targetEntityType?.annotations?.UI?.HeaderInfo;

		const avatar = (
			<Avatar
				src={this.src}
				initials={this.initials}
				fallbackIcon={this.fallbackIcon}
				displayShape={this.displayShape}
				displaySize={AvatarSize.S}
				imageFitType={AvatarImageFitType.Cover}
			>
				{{
					detailBox: (
						<LightBox>
							<LightBoxItem
								imageSrc={this.src}
								title={getTitleBindingExpression(
									dataModelObjectPath as DataModelObjectPath<Property>,
									getTextBindingExpression,
									undefined,
									headerInfo,
									owner?.getRootController()?.getView().getViewData() || ({} as ViewData)
								)}
								subtitle={HeaderHelper.getDescriptionExpression(
									dataModelObjectPath as DataModelObjectPath<EntitySet>,
									headerInfo
								)}
							/>
						</LightBox>
					)
				}}
			</Avatar>
		);
		avatar.addStyleClass("sapUiSmallMarginEnd");

		return avatar;
	}
}

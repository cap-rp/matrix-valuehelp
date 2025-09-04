import type { EntitySet, Property } from "@sap-ux/vocabularies-types";
import type { HeaderInfo } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { isReferencePropertyStaticallyHidden } from "sap/fe/core/converters/helpers/DataFieldHelper";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import FlexItemData from "sap/m/FlexItemData";
import Label from "sap/m/Label";
import Title from "sap/m/Title";
import VBox from "sap/m/VBox";
import { FlexRendertype } from "sap/m/library";
import type { $ControlSettings } from "sap/ui/core/Control";
import { TitleLevel } from "sap/ui/core/library";
import { getTextBindingExpression } from "../field/FieldTemplating";
import HeaderHelper from "./HeaderHelper";

/**
 * Building block used to create title and description in the OP header
 * @private
 */
@defineUI5Class("sap.fe.macros.header.HeaderTitleDescription")
export default class HeaderTitleDescription extends BuildingBlock {
	@property({ type: "string" })
	VBoxType: FlexRendertype = FlexRendertype.Div;

	constructor(settings: PropertiesOf<HeaderTitleDescription>, others?: $ControlSettings) {
		super(settings, others);
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	private getTitleControl(
		dataModelObjectPath: DataModelObjectPath<Property>,
		headerInfo: HeaderInfo,
		owner?: TemplateComponent
	): Title | undefined {
		if (headerInfo.Title && !isReferencePropertyStaticallyHidden(headerInfo.Title)) {
			return (
				<Title
					text={getTitleBindingExpression(
						dataModelObjectPath,
						getTextBindingExpression,
						undefined,
						headerInfo,
						owner?.getRootController()?.getView().getViewData() || ({} as ViewData)
					)}
					wrapping={true}
					level={TitleLevel.H2}
					layoutData={<FlexItemData minWidth="0"></FlexItemData>}
				/>
			);
		}
	}

	private getDescription(dataModelObjectPath: DataModelObjectPath<EntitySet>, headerInfo: HeaderInfo): Label | undefined {
		if (headerInfo.Description && !isReferencePropertyStaticallyHidden(headerInfo.Description)) {
			return <Label text={HeaderHelper.getDescriptionExpression(dataModelObjectPath, headerInfo)} wrapping={true} />;
		}
	}

	private createContent(): VBox | undefined {
		const owner = this._getOwner();
		const dataModelObjectPath = this.getDataModelObjectPath(owner?.preprocessorContext?.fullContextPath);
		const headerInfo = dataModelObjectPath?.targetEntityType?.annotations?.UI?.HeaderInfo;

		if (headerInfo && (headerInfo.Title || headerInfo.Description)) {
			return (
				<VBox renderType={this.VBoxType} layoutData={<FlexItemData minWidth="0"></FlexItemData>}>
					{this.getTitleControl(dataModelObjectPath as DataModelObjectPath<Property>, headerInfo, owner)}
					{this.getDescription(dataModelObjectPath as DataModelObjectPath<EntitySet>, headerInfo)}
				</VBox>
			);
		}
	}
}

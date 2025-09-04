import type { DataField, HeaderInfo } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Avatar from "sap/m/Avatar";
import FlexBox from "sap/m/FlexBox";
import Label from "sap/m/Label";
import LightBox from "sap/m/LightBox";
import LightBoxItem from "sap/m/LightBoxItem";
import Title from "sap/m/Title";

class ObjectTitleDefinition {
	constructor(private readonly headerInfo: HeaderInfo) {}

	hasAvatar(): boolean {
		return !!(this.headerInfo.ImageUrl ?? this.headerInfo.TypeImageUrl ?? this.headerInfo.Initials);
	}

	getTitle(): CompiledBindingToolkitExpression {
		return compileExpression(getExpressionFromAnnotation((this.headerInfo.Title as DataField).Value));
	}

	isDescriptionVisible(): boolean {
		// Not statically hidden
		return this.headerInfo.Description?.annotations?.UI?.Hidden?.valueOf() !== false;
	}

	getDescription(): CompiledBindingToolkitExpression {
		return compileExpression(getExpressionFromAnnotation((this.headerInfo.Description as DataField).Value));
	}
}
@defineUI5Class("sap.fe.macros.ObjectTitle")
export default class ObjectTitle extends BuildingBlock {
	@property({ type: "string" })
	metaPath: string = UIAnnotationTerms.HeaderInfo;

	constructor(idOrSettings: string);

	constructor(idOrSettings: PropertiesOf<ObjectTitle>);

	constructor(idOrSettings: string | PropertiesOf<ObjectTitle>, settings?: PropertiesOf<ObjectTitle>) {
		super(idOrSettings, settings);
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	_createAvatar(): Avatar {
		return (
			<Avatar
				class="sapUiSmallMarginEnd"
				src="{avatar>src}"
				initials="{avatar>initials}"
				fallbackIcon="{avatar>fallbackIcon}"
				displayShape="{avatar>displayShape}"
				displaySize="S"
				imageFitType="Cover"
			>
				{{
					detailBox: (
						<LightBox>
							<LightBoxItem
								imageSrc="{avatar>src}"
								title="{= OP.getExpressionForTitle(${fullContextPath>@@UI.getDataModelObjectPath}, ${viewData>}, ${headerInfo>@@UI.getConverterContext})}"
								subtitle="{= OP.getExpressionForDescription(${fullContextPath>@@UI.getDataModelObjectPath}, ${headerInfo>@@UI.getConverterContext})}"
							/>
						</LightBox>
					)
				}}
			</Avatar>
		);
	}

	_createTitle(definition: ObjectTitleDefinition): Title {
		return <Title text={definition.getTitle()} wrapping="true" level="H2" />;
	}

	_createDescription(definition: ObjectTitleDefinition): Label {
		return <Label text={definition.getDescription()} wrapping="true" />;
	}

	_getTitlePart(definition: ObjectTitleDefinition): FlexBox | Title {
		if (definition.isDescriptionVisible()) {
			return <FlexBox direction="Column">{{ items: [this._createTitle(definition), this._createDescription(definition)] }}</FlexBox>;
		} else {
			return this._createTitle(definition);
		}
	}

	createContent(): FlexBox | Title | undefined {
		const metaPathObject = this.getMetaPathObject<HeaderInfo>(`@${this.metaPath}`);
		if (metaPathObject) {
			const definition = new ObjectTitleDefinition(metaPathObject.getTarget());
			if (definition.hasAvatar()) {
				return <FlexBox renderType="Bare">{{ items: [this._createAvatar(), this._getTitlePart(definition)] }}</FlexBox>;
			} else {
				return this._getTitlePart(definition);
			}
		}
	}
}

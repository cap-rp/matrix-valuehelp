import type { EntityType, Property } from "@sap-ux/vocabularies-types";
import type * as Edm from "@sap-ux/vocabularies-types/Edm";
import type {
	DataField,
	DataFieldForAction,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	DataFieldWithNavigationPath,
	DataFieldWithUrl,
	HeaderInfoType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { isDataField } from "sap/fe/core/converters/annotations/DataField";
import { isEntityType } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getDisplayMode } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { getDataModelObjectPathForValue, getTextBinding } from "sap/fe/macros/field/FieldTemplating";
import type { LinkDelegatePayload } from "sap/fe/macros/quickView/QuickViewDelegate";
import Avatar from "sap/m/Avatar";
import AvatarShape from "sap/m/AvatarShape";
import Link from "sap/m/Link";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import VBox from "sap/m/VBox";
import coreLibrary from "sap/ui/core/library";
import HorizontalLayout from "sap/ui/layout/HorizontalLayout";
import VerticalLayout from "sap/ui/layout/VerticalLayout";

@defineUI5Class("sap.fe.macros.quickView.QuickViewHeaderOptions")
export default class QuickViewHeaderOptions extends BuildingBlock {
	@property({ type: "string" })
	public contextPath?: string;

	@property({ type: "string" })
	public metaPath?: string;

	@property({ type: "object" })
	public semanticPayload?: LinkDelegatePayload;

	@property({
		type: "string"
	})
	id?: string;

	@property({
		type: "string"
	})
	titleLink?: string;

	@defineReference()
	horizontalLayout!: Ref<HorizontalLayout>;

	visible = true;

	private entityType?: EntityType;

	private dataFieldValue?: DataModelObjectPath<Property>;

	private convertedDataField?:
		| DataField
		| DataFieldForAction
		| DataFieldForIntentBasedNavigation
		| DataFieldWithUrl
		| DataFieldWithNavigationPath;

	private headerInfo: HeaderInfoType | undefined;

	private icon: CompiledBindingToolkitExpression | Edm.String | undefined;

	private fallbackIcon: CompiledBindingToolkitExpression | undefined;

	private title: BindingToolkitExpression<string> | CompiledBindingToolkitExpression | undefined;

	private description: BindingToolkitExpression<string> | CompiledBindingToolkitExpression | Edm.String | undefined;

	public isInitialized?: Promise<void>;

	constructor(props: PropertiesOf<QuickViewHeaderOptions>, others?: PropertiesOf<QuickViewHeaderOptions>) {
		super(props, others);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		const contextObject = this.getDataModelObjectForMetaPath<
			DataField | DataFieldForAction | DataFieldForIntentBasedNavigation | DataFieldWithUrl | DataFieldWithNavigationPath
		>(this.metaPath ?? "", this.contextPath);
		const targetObject = contextObject?.targetObject;
		if (isEntityType(targetObject)) {
			this.entityType = targetObject;
			this.headerInfo = this.entityType?.annotations.UI?.HeaderInfo;
		} else if (isDataField(targetObject)) {
			this.convertedDataField = targetObject;
			this.dataFieldValue = getDataModelObjectPathForValue(contextObject!);
		} else {
			this.entityType = contextObject?.targetEntityType;
			this.headerInfo = this.entityType?.annotations.UI?.HeaderInfo;
		}
		this.content = this.createContent();
	}

	setHeaderDisplayParametersForDataField(): void {
		if (this.dataFieldValue && this.convertedDataField) {
			if (this.convertedDataField?.IconUrl) {
				this.icon = this.convertedDataField.IconUrl;
				this.fallbackIcon = "sap-icon://product";
			} else {
				this.icon = undefined;
				this.fallbackIcon = undefined;
			}
			this.title = getTextBinding(this.dataFieldValue, {
				displayMode: getDisplayMode(this.dataFieldValue)
			});
			this.description = this.convertedDataField.Label
				? compileExpression(this.convertedDataField.Label)
				: compileExpression((this.convertedDataField as DataFieldTypes).Value?.$target?.annotations?.Common?.Label);
		}
	}

	setHeaderDisplayParametersForEntityType(): void {
		if (this.entityType) {
			const iconExpression = this.headerInfo?.ImageUrl
				? getExpressionFromAnnotation(this.headerInfo.ImageUrl)
				: getExpressionFromAnnotation(this.headerInfo?.TypeImageUrl);
			const iconExpressionCompiled = compileExpression(iconExpression);
			this.icon = iconExpressionCompiled === "undefined" ? undefined : iconExpressionCompiled;
			if (this.headerInfo?.TypeImageUrl) {
				this.fallbackIcon = compileExpression(this.headerInfo.TypeImageUrl);
			} else if (this.entityType?.annotations.Common?.IsNaturalPerson?.valueOf() === true) {
				this.fallbackIcon = "sap-icon://person-placeholder";
			} else {
				this.fallbackIcon = "sap-icon://product";
			}
			const dataModelPath = this.getDataModelObjectPath<
				| DataField
				| DataFieldForAction
				| DataFieldForIntentBasedNavigation
				| DataFieldWithUrl
				| DataFieldWithNavigationPath
				| EntityType
			>(this.metaPath);
			if (dataModelPath && isDataField(this.headerInfo?.Title) && this.headerInfo?.Title.Value) {
				const headerTitle = enhanceDataModelPath<Property>(dataModelPath, this.headerInfo.Title?.Value.path);
				if (headerTitle.targetObject) {
					const titleExpression = getTextBinding(headerTitle, {
						displayMode: getDisplayMode(headerTitle)
					});
					this.title = titleExpression !== "{}" ? titleExpression : undefined;
				}
			}
			if (dataModelPath && isDataField(this.headerInfo?.Description) && this.headerInfo?.Description.Value) {
				const headerDescription = enhanceDataModelPath<Property>(dataModelPath, this.headerInfo.Description?.Value.path);
				const headerExpression =
					headerDescription.targetObject &&
					getTextBinding(headerDescription, {
						displayMode: getDisplayMode(headerDescription)
					});
				this.description =
					headerDescription.targetObject === undefined
						? compileExpression({ _type: "PathInModel", modelName: "semantic", path: "propertyPathLabel" })
						: headerExpression;
			}
		}
	}

	async getSemanticObjectsPrimaryActions(): Promise<void> {
		if (this.semanticPayload && (await FieldHelper.checkPrimaryActions(this.semanticPayload, false, this.getAppComponent()!))) {
			const primaryAction = FieldHelper.getPrimaryAction(this.semanticPayload);
			this.titleLink = primaryAction;
		}
		this.setupTitle();
	}

	createContent(): VBox {
		let avatar;
		this.setHeaderDisplayParametersForDataField();
		this.setHeaderDisplayParametersForEntityType();

		if (this.icon && this.fallbackIcon) {
			avatar = (
				<Avatar
					class="sapMQuickViewThumbnail sapUiTinyMarginEnd"
					src={this.icon}
					displayShape={
						this.entityType?.annotations.Common?.IsNaturalPerson?.valueOf() === true ? AvatarShape.Circle : AvatarShape.Square
					}
					fallbackIcon={this.fallbackIcon}
				/>
			);
		}
		const hLayout = (
			<HorizontalLayout class="sapUiSmallMarginBottom sapMQuickViewPage" ref={this.horizontalLayout}>
				{avatar}
			</HorizontalLayout>
		);
		this.isInitialized = this.getSemanticObjectsPrimaryActions();
		return <VBox>{hLayout}</VBox>;
	}

	setupTitle(): void {
		let title;
		if (this.title) {
			if (this.titleLink) {
				title = <Link text={this.title} href={this.titleLink} emphasized="true" />;
			} else {
				title = <Title text={this.title} level={coreLibrary.TitleLevel.H3} wrapping="true" />;
			}
		}
		const description = this.description ? <Text text={this.description} /> : undefined;
		const vLayout = (
			<VerticalLayout>
				{title}
				{description}
			</VerticalLayout>
		);
		this.horizontalLayout.current?.addContent(vLayout);
	}
}

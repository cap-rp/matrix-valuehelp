import { VisualizationType, type DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import {
	compileExpression,
	formatResult,
	getExpressionFromAnnotation,
	pathInModel,
	type CompiledBindingToolkitExpression
} from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { DataPointFacet } from "sap/fe/core/converters/controls/ObjectPage/HeaderFacet";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getRelativePaths, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import { getVisibleExpression } from "sap/fe/macros/field/FieldTemplating";
import { getHeaderRatingIndicatorText } from "sap/fe/macros/internal/helpers/DataPointTemplating";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";

@defineBuildingBlock({
	name: "HeaderDataPoint",
	namespace: "sap.fe.macros.internal"
})
export default class HeaderDataPointBlock extends BuildingBlockTemplatingBase {
	/**
	 * Metadata path to the dataPoint.
	 * This property is usually a metadataContext pointing to a DataPoint having
	 * $Type = "com.sap.vocabularies.UI.v1.DataPointType"
	 */

	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true
	})
	public metaPath!: Context;

	/**
	 * Metadata path to the entitySet
	 */

	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true
	})
	public contextPath!: Context;

	/**
	Header facet from annotations
	 */

	@blockAttribute({
		type: "object",
		required: true
	})
	public converterHeaderFacet!: DataPointFacet;

	/**
	Context of the Header facet
	 */

	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true
	})
	public headerFacet!: Context;

	private viewData: JSONModel;

	private manifest: Model;

	/**
	 * Constructor method of the building block.
	 * @param properties The HeaderDataPoint properties
	 * @param controlConfiguration
	 * @param settings
	 */
	constructor(
		properties: PropertiesOf<HeaderDataPointBlock>,
		controlConfiguration: TemplateProcessorSettings,
		settings: TemplateProcessorSettings
	) {
		//setup initial default property settings
		super(properties, controlConfiguration, settings);
		this.viewData = settings.models.viewData;
		this.manifest = settings.models.manifest;
	}

	/*
	 * Gets the 'Press' event expression for the external and internal data point link.
	 *
	 * @function
	 * @param {object} [navigation] navigation object from Control configuration in manifest
	 * @param {object} [manifestOutbound] outbounds parameter from manifest
	 * returns {string} The runtime binding of the 'Press' event
	 */
	private static getPressExpressionForLink = function (
		navigation?: Record<
			string,
			{
				targetOutbound?: {
					outbound: string;
				};
				targetSections?: {
					sectionId: string;
					subSectionId: string;
				};
			}
		>,
		manifestOutbound?: object
	): string | undefined {
		if (navigation?.targetOutbound && "outbound" in navigation.targetOutbound) {
			return (
				".handlers.onDataPointTitlePressed($controller, ${$source>}, " +
				JSON.stringify(manifestOutbound) +
				"," +
				JSON.stringify(navigation.targetOutbound.outbound) +
				")"
			);
		} else if (navigation && navigation["targetSections"]) {
			return ".handlers.navigateToSubSection($controller, '" + JSON.stringify(navigation["targetSections"]) + "')";
		} else {
			return undefined;
		}
	};

	/**
	 * The building block template function.
	 * @returns An XML-based string
	 */

	getTemplate(): string {
		const dataModelPath = getInvolvedDataModelObjects<DataPointType>(this.metaPath, this.contextPath);
		const dataPointVisible = getVisibleExpression(dataModelPath);
		const vBoxId = generate([
			"fe",
			"HeaderFacet",
			this.converterHeaderFacet.headerDataPointData?.type !== "Content"
				? this.converterHeaderFacet?.headerDataPointData?.type
				: "KeyFigure",
			getInvolvedDataModelObjects(this.headerFacet)
		]);
		const pressLink = HeaderDataPointBlock.getPressExpressionForLink(
			this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue!]?.navigation,
			this.manifest.getProperty("/sap.app/crossNavigation/outbounds")
		);
		if (
			this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue!]?.navigation
				?.targetOutbound?.outbound
		) {
			return this.getDataPointTitleWithExternalLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink!);
		} else if (
			this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue!]?.navigation
				?.targetSections
		) {
			return this.getDataPointTitleWithInPageLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink!);
		}
		return this.getDataPointTitleWithoutLinkTemplate(vBoxId, dataModelPath, dataPointVisible);
	}

	/**
	 * The building block template for the data point title with an external link part.
	 * @returns An XML-based string with the definition of the data point title with an external link template
	 */

	getDataPointTitleWithExternalLinkTemplate(
		vBoxId: string,
		dataModelPath: DataModelObjectPath<DataPointType>,
		dataPointVisible: CompiledBindingToolkitExpression,
		pressLink: string
	): string {
		const showTitleAsLink = CommonHelper.getHeaderDataPointLinkVisibility(
			generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue]),
			true
		);
		const showTitleAsText = CommonHelper.getHeaderDataPointLinkVisibility(
			generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue]),
			false
		);
		return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<core:InvisibleText
				id="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
				text="${this.getTranslatedText("T_HEADER_DATAPOINT_TITLE_LINK_EXTERNAL_ARIA")}"
				/>
				<Title
				xmlns="sap.m"
				level="H3"
				visible="${showTitleAsLink}"
				>
					<content>
						<Link
							id="${generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue])}"
							text="${dataModelPath.targetObject?.Title}"
							press="${pressLink}"
							ariaDescribedBy="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
							class="sapUiTinyMarginBottom"
							customData:ValuePropertyPath="${dataModelPath.targetObject?.Value?.path}"
						/>
					</content>
				</Title>
				<Title
				xmlns="sap.m"
				id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
				level="H3"
				text="${dataModelPath.targetObject?.Title}"
				class="sapUiTinyMarginBottom"
				visible="${showTitleAsText}"
				/>
				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
	}

	/**
	 * The building block template for the data point title with an inPage link part.
	 * @param vBoxId
	 * @param dataModelPath
	 * @param dataPointVisible
	 * @param pressLink
	 * @returns An XML-based string with the definition of the data point title with an inPage link template
	 */
	getDataPointTitleWithInPageLinkTemplate(
		vBoxId: string,
		dataModelPath: DataModelObjectPath<DataPointType>,
		dataPointVisible: CompiledBindingToolkitExpression,
		pressLink: string
	): string {
		return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<core:InvisibleText
					text="${this.getTranslatedText("T_COMMON_HEADERDP_TITLE_LINK_INPAGE_ARIA")}"
					id="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
				/>
				<core:InvisibleText
					text="${dataModelPath.targetObject?.Title}"
					id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
				/>
				<Title xmlns="sap.m" level="H3" ${this.attr("visible", !!dataModelPath.targetObject?.Title)}>
					<content>
						<Link
							id="${generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue])}"
							text="${dataModelPath.targetObject?.Title}"
							press="${pressLink}"
							ariaDescribedBy="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
							class="sapUiTinyMarginBottom"
						/>
					</content>
				</Title>
				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
	}

	/**
	 * The building block template for the data point title that is non-clickable.
	 * @param vBoxId
	 * @param dataModelPath
	 * @param dataPointVisible
	 * @returns An XML-based string with the definition of the data point non-clickable title template
	 */
	getDataPointTitleWithoutLinkTemplate(
		vBoxId: string,
		dataModelPath: DataModelObjectPath<DataPointType>,
		dataPointVisible: CompiledBindingToolkitExpression
	): string {
		return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<Title
				xmlns="sap.m"
				id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
					level="H3"
					text="${dataModelPath.targetObject?.Title}"
					class="sapUiTinyMarginBottom"
				/>

				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
	}

	/**
	 * Gets the template for the data point.
	 * @param dataModelPath
	 * @returns An XML-based string with the definition of the data point template and its labels
	 */
	getDataPointTemplate(dataModelPath: DataModelObjectPath<DataPointType>): string {
		return xml`
			${this.getDataPointFirstLabel(dataModelPath)}
			<internalMacro:DataPoint
				xmlns:internalMacro="sap.fe.macros.internal"
				metaPath="${this.metaPath.getPath()}"
				contextPath="${this.contextPath.getPath()}"
				ariaLabelledBy="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
			>
				<internalMacro:formatOptions>
  					 <internalMacro:DataPointFormatOptions dataPointStyle="large" showLabels="true" iconSize="1.375rem" showEmptyIndicator="true" />
				</internalMacro:formatOptions>
			</internalMacro:DataPoint>
			${this.getDataPointSecondLabel(dataModelPath)}`;
	}

	/**
	 * Gets the first label for the data point.
	 * @param dataModelPath
	 * @returns An XML-based string with the definition of the first label for the data point
	 */
	getDataPointFirstLabel(dataModelPath: DataModelObjectPath<DataPointType>): string {
		switch (dataModelPath.targetObject?.Visualization) {
			case VisualizationType.Rating:
				const text = getHeaderRatingIndicatorText(this.metaPath, dataModelPath.targetObject);
				return xml` <Label text="${text}" visible="${!!(
					dataModelPath.targetObject?.SampleSize || dataModelPath.targetObject?.Description
				)}"/>`;
			case VisualizationType.Progress:
				return xml`<Label text="${dataModelPath.targetObject?.Description}" visible="${!!dataModelPath.targetObject
					?.Description}"/>`;
			default:
				return "";
		}
	}

	/**
	 * Gets the second label for the data point.
	 * @param dataModelPath
	 * @returns An XML-based string with the definition of the second label for the data point
	 */
	getDataPointSecondLabel(dataModelPath: DataModelObjectPath<DataPointType>): string {
		switch (dataModelPath.targetObject?.Visualization) {
			case VisualizationType.Rating:
				const targetLabelExpression = compileExpression(
					formatResult(
						[
							pathInModel("T_HEADER_RATING_INDICATOR_FOOTER", "sap.fe.i18n"),
							getExpressionFromAnnotation(dataModelPath.targetObject?.Value, getRelativePaths(dataModelPath)),
							dataModelPath.targetObject?.TargetValue
								? getExpressionFromAnnotation(dataModelPath.targetObject?.TargetValue, getRelativePaths(dataModelPath))
								: "5"
						],
						"MESSAGE"
					)
				);
				return xml`<Label core:require="{MESSAGE: 'sap/base/strings/formatMessage' }" text="${targetLabelExpression}" visible="true"/>`;
			case VisualizationType.Progress:
				const secondLabelExpression = dataModelPath.targetObject?.Value?.$target?.annotations?.Common?.Label?.toString();
				return secondLabelExpression ? xml`<Label text="${secondLabelExpression}"/>` : "";
			default:
				return "";
		}
	}
}

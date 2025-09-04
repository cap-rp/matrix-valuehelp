import type { ConvertedMetadata } from "@sap-ux/vocabularies-types";
import { type PropertyAnnotationsBase_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import type { HeaderInfoType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import {
	UIAnnotationTerms,
	UIAnnotationTypes,
	type DataField,
	type DataFieldAbstractTypes,
	type DataFieldForAnnotation
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import MetaPath from "sap/fe/core/helpers/MetaPath";
import { getColumn, getColumnSet, getTextBlock } from "sap/fe/templates/ObjectPage/card/AdaptiveCardContent";
import BaseCardContentProvider, { type CardConfig } from "sap/fe/templates/ObjectPage/card/BaseCardContentProvider";
import type { CardColumnSet, CardTextBlock } from "types/adaptiveCard_types";

type HeaderInfo = {
	headerTitle?: string;
	appUrl?: string;
	appTitle: string;
	description?: string;
};

/**
 * Get image and title for card.
 * @param convertedTypes Converted Metadata.
 * @param config Card Configuration.
 * @experimental
 */
export default class HeaderTitle extends BaseCardContentProvider<CardConfig> {
	private cardColumnSet?: CardColumnSet;

	/**
	 * Get image and title in column set.
	 * @returns Column set.
	 */
	public getTitle(): CardColumnSet | undefined {
		return this.cardColumnSet;
	}

	constructor(convertedTypes: ConvertedMetadata, config: CardConfig) {
		super(convertedTypes, config);
		const { contextPath } = this.getCardConfigurationByKey("contextInfo");
		let headerInfo: HeaderInfo;
		try {
			const headerInfoMetaPath = new MetaPath<HeaderInfoType>(
				convertedTypes,
				`${contextPath}@${UIAnnotationTerms.HeaderInfo}`,
				contextPath
			);
			const headerDetails = this.getHeaderTitleandDescription(headerInfoMetaPath);
			headerInfo = {
				headerTitle: headerDetails?.headerTitle,
				description: headerDetails?.description,
				appTitle: this.getCardConfigurationByKey("objectTitle"),
				appUrl: this.getCardConfigurationByKey("appUrl")
			};
			this.cardColumnSet = this.createHeaderTitle(headerInfo);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			Log.error("Error while creating the card defintion", message);
		}
		return this;
	}

	/**
	 * Generates Header title for adaptive card.
	 * @param headerInfoMetaPath HeaderInfo MetaPath
	 * @returns Returns Header Title of the object page
	 */
	private getHeaderTitleandDescription(headerInfoMetaPath?: MetaPath<HeaderInfoType>): Partial<HeaderInfo> {
		const headerInfoTarget = headerInfoMetaPath?.getTarget();
		const headerInfoTitle = headerInfoTarget?.Title as DataField | DataFieldForAnnotation;
		const headerInfoDescription = headerInfoTarget?.Description as DataField | DataFieldForAnnotation;
		let title,
			headerTitle,
			textProperty,
			textpropertyAnnotation,
			description,
			descriptiontextpropertyAnnotation,
			descriptiontextProperty,
			headerDescription;
		if (headerInfoTitle) {
			switch (headerInfoTitle.$Type) {
				case UIAnnotationTypes.DataField:
					title = headerInfoMetaPath?.getMetaPathForObject(headerInfoTitle?.Value);
					textpropertyAnnotation = (
						(title?.getTarget() as DataFieldAbstractTypes)?.annotations?.Common as PropertyAnnotationsBase_Common
					)?.Text;
					textProperty = textpropertyAnnotation && headerInfoMetaPath?.getMetaPathForObject(textpropertyAnnotation);
					break;
				case UIAnnotationTypes.DataFieldForAnnotation:
					title = headerInfoTarget?.TypeName.toString();
					break;
			}
		}
		if (title) {
			const titleValueBinding = this.getValueBinding(title, textProperty);
			headerTitle = titleValueBinding;
		}
		if (headerInfoDescription) {
			switch (headerInfoDescription.$Type) {
				case UIAnnotationTypes.DataField:
					description = headerInfoMetaPath?.getMetaPathForObject(headerInfoDescription?.Value);
					descriptiontextpropertyAnnotation = (
						(description?.getTarget() as DataFieldAbstractTypes)?.annotations?.Common as PropertyAnnotationsBase_Common
					)?.Text;
					descriptiontextProperty =
						descriptiontextpropertyAnnotation && headerInfoMetaPath?.getMetaPathForObject(descriptiontextpropertyAnnotation);
					break;
				default:
					break;
			}
		}
		if (description) {
			const descriptionValueBinding = this.getValueBinding(description, descriptiontextProperty);
			headerDescription = descriptionValueBinding;
		}
		return { headerTitle: headerTitle, description: headerDescription };
	}

	/**
	 * Generates Header Image and Title column sets.
	 * @param headerInfo HeaderInfo with title and header description information.
	 * @returns An Array of ColumnSets for Image and Title.
	 */
	public createHeaderTitle(headerInfo: HeaderInfo | undefined): CardColumnSet | undefined {
		let appTitle, headerTitle, subTitle: CardTextBlock;
		const items = [];
		const columns = [];
		if (headerInfo?.appTitle) {
			appTitle = getTextBlock({
				size: "Medium",
				weight: "Bolder",
				text: headerInfo?.appTitle,
				maxLines: 3,
				wrap: true
			});
			items.push(appTitle);
		}
		if (headerInfo?.headerTitle) {
			headerTitle = getTextBlock({
				size: "Default",
				weight: "Bolder",
				text: `[ ${headerInfo?.headerTitle} ](${headerInfo?.appUrl})`,
				maxLines: 1,
				spacing: "None"
			});
			items.push(headerTitle);
		}
		if (headerInfo?.description) {
			subTitle = getTextBlock({
				size: "Default",
				text: headerInfo?.description,
				maxLines: 1,
				spacing: "None"
			});
			items.push(subTitle);
		}
		columns.push(getColumn({ items: [...items] }));
		return getColumnSet(columns) ?? undefined;
	}
}

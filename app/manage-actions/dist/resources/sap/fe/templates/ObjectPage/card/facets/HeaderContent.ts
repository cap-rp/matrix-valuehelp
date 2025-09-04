import type { ConvertedMetadata, NavigationProperty, PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import { type PropertyAnnotationsBase_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import {
	CommunicationAnnotationTerms,
	CommunicationAnnotationTypes,
	type Address,
	type Contact
} from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	DataFieldAbstractTypes,
	DataPoint,
	DataPointType,
	FieldGroup,
	HeaderFacets,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes, VisualizationType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { constant, equal, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import type { ConfigurableObjectKey, CustomElement, Positionable } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { OverrideType, Placement, insertCustomElements } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { isPotentiallySensitive, isReferencePropertyStaticallyHidden } from "sap/fe/core/converters/helpers/DataFieldHelper";
import { compileToAdaptiveExpression, type CompiledAdaptiveCardExpression } from "sap/fe/core/helpers/AdaptiveCardExpressionCompiler";
import MetaPath from "sap/fe/core/helpers/MetaPath";
import { generate, getStableIdPartFromDataField } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfType, isNavigationProperty, isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { getCriticalityExpressionForCards } from "sap/fe/core/templating/CriticalityFormatters";
import { generateVisibleExpression } from "sap/fe/core/templating/DataFieldFormatters";
import { isVisible } from "sap/fe/core/templating/UIFormatters";
import { getColumn, getColumnSet, getTextBlock } from "sap/fe/templates/ObjectPage/card/AdaptiveCardContent";
import BaseCardContentProvider, { type CardConfig } from "sap/fe/templates/ObjectPage/card/BaseCardContentProvider";
import type { CardColumn, CardColumnSet, CardElement, CardTextBlock } from "types/adaptiveCard_types";

type DataProperties = {
	color?: CompiledAdaptiveCardExpression;
	uom?: string;
	label?: string;
	property?: MetaPath<string>;
	textProperty?: MetaPath<string>;
	navigationPath?: string;
};

// External types for header facet configuration
export type FormElementConfig = {
	labelText: string;
};
export type CustomFormElementsConfig = Record<ConfigurableObjectKey, FormElementConfig>;

export type HeaderFacetConfig = Positionable & {
	isVisible?: string | boolean;
	title?: string;
	formElementsConfig?: CustomFormElementsConfig;
};

export type CustomHeaderFacetConfigs = Record<ConfigurableObjectKey, HeaderFacetConfig>;

export type HeaderFacetConfigurable = {
	headerFacets?: CustomHeaderFacetConfigs;
};

export type CardHeaderFacetsConfig = HeaderFacetConfigurable & CardConfig;

// Internal types for header facet configuration
type HeaderFacetConfigElement = HeaderFacetConfig & {
	key: ConfigurableObjectKey;
	headerFacet: ReferenceFacet;
};

type InternalCustomHeaderFacetElements = Record<ConfigurableObjectKey, CustomElement<HeaderFacetConfigElement>>;

const MAX_COLUMNS = 3;
/**
 * Get image and title for card.
 * @param convertedTypes Converted Metadata.
 * @param config Card Configuration.
 * @experimental
 */
export default class HeaderContent extends BaseCardContentProvider<CardHeaderFacetsConfig> {
	private cardElements: CardElement[] = [];

	/**
	 * Get image and title in column set.
	 * @returns Column set.
	 */
	public getHeaderContent(): CardElement[] {
		return this.cardElements;
	}

	constructor(convertedTypes: ConvertedMetadata, config: CardConfig) {
		super(convertedTypes, config);
		let headerFacetsForAdaptiveCard: CardElement[] = [];
		const { contextPath } = this.getCardConfigurationByKey("contextInfo");
		try {
			const headerFacet = new MetaPath<HeaderFacets>(convertedTypes, `${contextPath}@${UIAnnotationTerms.HeaderFacets}`, contextPath);
			const customConfigHeaderFacets = this.getCustomConfigHeaderFacets(headerFacet);
			headerFacetsForAdaptiveCard = this.createHeaderForms(headerFacet, customConfigHeaderFacets);
		} catch (error) {
			Log.error(`FE : V4 : Adaptive Card header facets : no EntityType found at context path: ${contextPath}`);
		}
		this.cardElements = headerFacetsForAdaptiveCard;
		return this;
	}

	/**
	 * Get the DataPoint Information from ReferenceFacet.
	 * @param referenceFacetTargetMetaPath MetaPath pointing to FieldGroup
	 * @param dataField DataFieldAbstract types
	 * @param formElementConfig Field configurations
	 * @returns Properties applicable for the dataPoint annotation
	 */
	private getFieldGroupProperties(
		referenceFacetTargetMetaPath: MetaPath<FieldGroup>,
		dataField: DataFieldAbstractTypes,
		formElementConfig?: FormElementConfig
	): DataProperties {
		let property,
			textProperty,
			textpropertyAnnotation,
			label = formElementConfig?.labelText,
			navigationPath,
			color;
		switch (dataField?.$Type) {
			case UIAnnotationTypes.DataField:
			case UIAnnotationTypes.DataFieldWithUrl:
			case UIAnnotationTypes.DataFieldWithNavigationPath:
				if (isPathAnnotationExpression(dataField.Value)) {
					property = referenceFacetTargetMetaPath.getMetaPathForObject(dataField.Value);
					navigationPath = this.getNavigationPathForExpression(referenceFacetTargetMetaPath);
					textpropertyAnnotation = ((property?.getTarget() as Property)?.annotations?.Common as PropertyAnnotationsBase_Common)
						?.Text;
					textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
				} else {
					property = dataField.Value;
				}
				label = label ?? dataField.Label ?? dataField.Value?.$target?.annotations?.Common?.Label.valueOf() ?? "";
				color = this.getCriticalityForDataPoints(dataField);
				break;
			case UIAnnotationTypes.DataFieldForAnnotation:
				label =
					label ?? dataField.Label ?? (dataField as PrimitiveType)?.Value?.$target?.annotations?.Common?.Label.valueOf() ?? "";
				const dataFieldTargetPath = referenceFacetTargetMetaPath.getMetaPathForObject(dataField.Target);
				const dataFieldTarget = dataFieldTargetPath?.getTarget();
				navigationPath = this.getNavigationPathForExpression(dataFieldTargetPath as MetaPath<DataPointType>);
				if (isAnnotationOfType<DataPoint>(dataFieldTarget, UIAnnotationTypes.DataPointType)) {
					if (isPathAnnotationExpression(dataFieldTarget.Value)) {
						property = dataFieldTargetPath?.getMetaPathForObject((dataFieldTarget as DataPointType)?.Value);
						textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
						textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
					} else {
						property = dataFieldTarget.Value;
					}
					color = this.getCriticalityForDataPoints(dataFieldTarget);
				} else if (isAnnotationOfType<Contact>(dataFieldTarget, CommunicationAnnotationTypes.ContactType)) {
					const contactObject = dataFieldTarget.fn;
					if (isPathAnnotationExpression(contactObject)) {
						property = dataFieldTargetPath?.getMetaPathForObject(contactObject);
						textpropertyAnnotation = (property as PrimitiveType)?.getTarget()?.annotations?.Common?.Text;
						textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
					}
				}
				break;
			default:
				break;
		}
		return { property, label, navigationPath, textProperty, color };
	}

	/**
	 * Returns the visible dataFields from fieldGroup.
	 * @param dataFields DataFieldAbstractTypes.
	 * @returns Visible DataFields.
	 */
	private getVisibleDataFields(dataFields: DataFieldAbstractTypes[]): DataFieldAbstractTypes[] {
		return dataFields.reduce((visibledataFields, dataField) => {
			if (!isReferencePropertyStaticallyHidden(dataField) && !isPotentiallySensitive(dataField)) {
				visibledataFields.push(dataField);
			}
			return visibledataFields;
		}, [] as DataFieldAbstractTypes[]);
	}

	/**
	 * Update the columnSets for each dataFields.
	 * @param dataField DataFieldAbstractTypes
	 * @param properties Properties of the DataField required for adaptive card
	 * @param dataPointTitle
	 * @returns ColumnSets containing header facet information which is required for adaptive card
	 */
	private getColumnForDataField(
		dataField?: MetaPath<DataFieldAbstractTypes | DataPointType>,
		properties?: DataProperties,
		dataPointTitle?: boolean
	): CardColumn[] {
		const items = [];
		const columns = [];
		if (!dataField) {
			columns.push(getColumn());
		} else {
			const visible = this.getVisibleForDataField(dataField);
			const { property, label, color, uom, textProperty } = properties || {};
			if (property) {
				if (label) {
					if (dataPointTitle === true) {
						items.push(
							getTextBlock({
								size: "Small",
								weight: "Bolder",
								text: label,
								maxLines: 2,
								wrap: true,
								spacing: "Medium",
								visible: visible
							})
						);
					} else {
						items.push(getTextBlock({ size: "Small", text: `${label}:`, maxLines: 1, isSubtle: true }));
					}
				}
				const textBinding = this.getValueBinding(property, textProperty);
				const additionalValue = uom ?? textProperty;
				const dateFieldVisibleExp = this.getTextBlockVisiblityForDateField(
					property,
					typeof additionalValue !== "string" ? additionalValue : undefined
				);
				items.push(
					getTextBlock({
						size: "Small",
						$when: compileToAdaptiveExpression(dateFieldVisibleExp),
						text: uom ? `${textBinding} ${uom}` : textBinding,
						maxLines: 2,
						color: color
					})
				);
				items.push(
					getTextBlock({
						size: "Small",
						$when: compileToAdaptiveExpression(equal(dateFieldVisibleExp, constant(false))),
						text: "\\-"
					})
				);
				columns.push(getColumn({ items: items, visible: visible ?? undefined }));
			}
		}
		return columns;
	}

	/**
	 * Updates the column sets and gets the fieldgroup content.
	 * @param referenceFacetTargetMetaPath Metapath of the reference facet fieldgroup
	 * @param formHeader Form Header
	 * @param visible Visible expression for the FacetHeader
	 * @param formElementsConfig Fields' configurations
	 * @returns ColumnSets containing header facet information which is required for adaptive card
	 */
	private getFieldGroupContent(
		referenceFacetTargetMetaPath: MetaPath<FieldGroup>,
		formHeader: string | undefined,
		visible: CompiledAdaptiveCardExpression | boolean,
		formElementsConfig?: CustomFormElementsConfig
	): CardElement[] {
		const fieldGroup = referenceFacetTargetMetaPath.getTarget();
		const maxColumns = MAX_COLUMNS;
		const forms: CardElement[] = [];
		if (formHeader) {
			const formTitle: CardTextBlock = getTextBlock({
				size: "Small",
				weight: "Bolder",
				text: formHeader,
				maxLines: 2,
				spacing: "Medium",
				wrap: true,
				visible: visible ?? undefined
			});
			forms.push(formTitle);
		}
		const fieldItems = this.getVisibleDataFields(fieldGroup?.Data);
		/* Column set should contain maximum of three columns
		hence check the number of datafields and decide the columns for each column set */
		const iTotalColums = Math.ceil(fieldItems.length / maxColumns);
		for (let i = 1; i <= iTotalColums; i++) {
			const iLoopEnd = i * maxColumns;
			const iLoopStart = iLoopEnd - maxColumns;
			const dataFieldcolumnset = getColumnSet([] as CardColumn[], visible ?? undefined);
			for (let j = iLoopStart; j < iLoopEnd; j++) {
				const dataField: DataFieldAbstractTypes = fieldItems[j];
				const key = dataField && getStableIdPartFromDataField(dataField);
				const formElementConfig = key ? formElementsConfig?.[key] : undefined;
				const dataProperties = this.getFieldGroupProperties(referenceFacetTargetMetaPath, dataField, formElementConfig);
				const dataFieldNext = dataField && referenceFacetTargetMetaPath.getMetaPathForObject(dataField);
				const dataFieldColumns = this.getColumnForDataField(dataFieldNext, dataProperties);
				if (dataFieldColumns) {
					dataFieldcolumnset.columns.push(...dataFieldColumns);
				}
			}
			if (dataFieldcolumnset) {
				forms.push(dataFieldcolumnset);
			}
		}
		return forms;
	}

	/**
	 * Get the text color for the dataPoint.
	 * @param dataPoint DataPoint annotation
	 * @returns Color of the Text
	 */
	public getCriticalityForDataPoints(dataPoint: DataPoint | DataFieldAbstractTypes): CompiledAdaptiveCardExpression {
		let exp;
		const criticalityProperty = dataPoint.Criticality;
		if (criticalityProperty) {
			const criticalityExpression: BindingToolkitExpression<string | number> = getExpressionFromAnnotation(criticalityProperty);
			exp = getCriticalityExpressionForCards(criticalityExpression, false);
		} else {
			exp = constant("default");
		}
		return this.updatePathsAndGetCompiledExpression(exp);
	}

	/**
	 * Get the uom path for the dataPoint.
	 * @param referenceFacetTargetMetaPath MetaPath pointing to datapoints
	 * @param propertyTargetObject DataPoint property
	 * @returns Path binding for UOM
	 */
	private getUomPathBinding(
		referenceFacetTargetMetaPath: MetaPath<DataPointType | DataFieldAbstractTypes>,
		propertyTargetObject: Property | undefined
	): string | undefined {
		const uom = propertyTargetObject?.annotations.Measures?.ISOCurrency || propertyTargetObject?.annotations.Measures?.Unit;
		if (!uom) {
			return;
		} else if (isPathAnnotationExpression(uom)) {
			const uomMetaPath = referenceFacetTargetMetaPath.getMetaPathForObject(uom);
			const targetPath = uomMetaPath?.getTarget();
			return targetPath && this.targetIsProperty(uomMetaPath) ? this.getValueBinding(uomMetaPath) : undefined;
		}
	}

	/**
	 * Get the DataPoint Information from ReferenceFacet.
	 * @param referenceFacetTargetMetaPath MetaPath pointing to datapoints
	 * @param dataPoint DataPoint
	 * @returns Properties applicable for the dataPoint annotation
	 */
	private getDataPointProperties(referenceFacetTargetMetaPath: MetaPath<DataPoint>, dataPoint: DataPoint): DataProperties {
		const property = referenceFacetTargetMetaPath.getMetaPathForObject(dataPoint?.Value);
		const uom = this.getUomPathBinding(
			referenceFacetTargetMetaPath,
			referenceFacetTargetMetaPath.getMetaPathForObject(dataPoint?.Value)?.getTarget()
		);
		const textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
		const textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
		const color = this.getCriticalityForDataPoints(dataPoint);
		const navigationPath = this.getNavigationPathForExpression(referenceFacetTargetMetaPath);
		return { property, color, uom, navigationPath, textProperty };
	}

	/**
	 * Get the Datapoint content from the facet.
	 * @param referenceFacetTargetMetaPath MetaPath pointing to Datapoints
	 * @param formHeader Title of the form header
	 * @returns Title and content of the datapoint
	 */
	private getDataPointContent(referenceFacetTargetMetaPath: MetaPath<DataPoint>, formHeader: string | undefined): CardColumn[] {
		const columns = [];
		const dataPoint = referenceFacetTargetMetaPath.getTarget();
		if (dataPoint?.Visualization !== VisualizationType.Rating && dataPoint?.Visualization !== VisualizationType.Progress) {
			const properties = this.getDataPointProperties(referenceFacetTargetMetaPath, dataPoint);
			properties.label = formHeader;
			const dataPointForms = this.getColumnForDataField(referenceFacetTargetMetaPath, properties, true);
			if (dataPointForms) {
				columns.push(...dataPointForms);
			}
		}
		return columns;
	}

	/**
	 * Get the custom configured header facet elements.
	 * @param headerFacetConfigs
	 * @param annotatedReferenceFacets
	 * @returns The custom configured header facet elements
	 */
	private getCustomHeaderFacetConfigElements(
		headerFacetConfigs: CustomHeaderFacetConfigs,
		annotatedReferenceFacets: HeaderFacetConfigElement[]
	): InternalCustomHeaderFacetElements {
		const customConfigHeaderFacetNames = Object.keys(headerFacetConfigs);
		return customConfigHeaderFacetNames.reduce((customHeaderFacetElements, customConfigHeaderFacetKey) => {
			const relevantFacetElement = annotatedReferenceFacets.find(
				(headerFacetElement) => headerFacetElement.key === customConfigHeaderFacetKey
			);

			if (relevantFacetElement) {
				customHeaderFacetElements[customConfigHeaderFacetKey] = {
					key: customConfigHeaderFacetKey,
					headerFacet: relevantFacetElement.headerFacet,
					position: {
						placement: Placement.After
					},
					...headerFacetConfigs[customConfigHeaderFacetKey]
				};
			}

			return customHeaderFacetElements;
		}, {} as InternalCustomHeaderFacetElements);
	}

	/**
	 * Get the custom configured header facets.
	 * @param headerFacetMetaPath MetaPath object of the annotated header facets
	 * @returns Reference facets with overridden custom configurations
	 */
	private getCustomConfigHeaderFacets(headerFacetMetaPath: MetaPath<HeaderFacets>): HeaderFacetConfigElement[] {
		const referenceFacets: ReferenceFacet[] = this.getReferenceFacetFromAnnotations(headerFacetMetaPath.getTarget());
		let annotatedReferenceFacets: HeaderFacetConfigElement[] = referenceFacets.map(function (headerFacet) {
			return { key: generate([headerFacet.Target.value]), headerFacet };
		});
		// Get the UI overrides for header facets, if any
		const headerFacetConfigs = this.getCardConfigurationByKey("headerFacets");
		if (headerFacetConfigs && Object.keys(headerFacetConfigs).length > 0) {
			const customHeaderFacetConfigElements = this.getCustomHeaderFacetConfigElements(headerFacetConfigs, annotatedReferenceFacets);

			const headerFacetOverwriteConfig = {
				isVisible: OverrideType.overwrite,
				title: OverrideType.overwrite,
				position: OverrideType.overwrite,
				formElementsConfig: OverrideType.overwrite
			};

			// override the annotated header facets to reflect the UI changes on OP
			annotatedReferenceFacets = insertCustomElements(
				annotatedReferenceFacets,
				customHeaderFacetConfigElements,
				headerFacetOverwriteConfig
			);
		}

		return annotatedReferenceFacets;
	}

	/**
	 * Get Header Data ColumnSets.
	 * @param headerFacetMetaPath Array of header Facets
	 * @param configHeaderFacets Header facets configurations
	 * @returns ColumnSets containing header facet information which is required for adaptive card
	 */
	private createHeaderForms(headerFacetMetaPath: MetaPath<HeaderFacets>, configHeaderFacets: HeaderFacetConfigElement[]): CardElement[] {
		let previousCardElementIsDataPoint = false;
		return configHeaderFacets.reduce(
			function (
				this: HeaderContent,
				headerForms: CardElement[],
				configHeaderFacet: HeaderFacetConfigElement,
				currentIdx: number,
				allConfigHeaderFacets: HeaderFacetConfigElement[]
			): CardElement[] {
				const FacetItem = configHeaderFacet.headerFacet;
				if (FacetItem.$Type === UIAnnotationTypes.ReferenceFacet && FacetItem.annotations?.UI?.Hidden?.valueOf() !== true) {
					const referenceFacetTargetMetaPath = headerFacetMetaPath.getMetaPathForObject(FacetItem.Target);
					const facetDefinition = referenceFacetTargetMetaPath?.getTarget();
					const navigationPath = this.getNavigationPathForExpression(
						referenceFacetTargetMetaPath as MetaPath<FieldGroup | DataPointType>
					);
					const visible = configHeaderFacet.isVisible ?? this.getVisibleForReferenceFacet(FacetItem, navigationPath);
					const formHeader = configHeaderFacet.title ?? FacetItem.Label?.toString();
					const formElementsConfig = configHeaderFacet.formElementsConfig;
					switch (facetDefinition?.term) {
						case UIAnnotationTerms.FieldGroup:
							if (previousCardElementIsDataPoint === true) {
								// If previous header form content was a DataPoint, we add dummy columns.
								this.addEmptyColumns(headerForms[headerForms.length - 1] as CardColumnSet);
								previousCardElementIsDataPoint = false;
							}
							headerForms.push(
								...this.getFieldGroupContent(
									referenceFacetTargetMetaPath as MetaPath<FieldGroup>,
									formHeader,
									visible,
									formElementsConfig
								)
							);
							break;
						case UIAnnotationTerms.DataPoint:
							if (!isPotentiallySensitive(facetDefinition)) {
								const dataPointColumns = this.getDataPointContent(
									referenceFacetTargetMetaPath as MetaPath<DataPoint>,
									configHeaderFacet.title ?? formHeader
								);
								const dataPointColumnSet = getColumnSet([] as CardColumn[], visible ?? undefined);
								if (
									previousCardElementIsDataPoint &&
									(headerForms[headerForms.length - 1] as CardColumnSet).columns.length !== MAX_COLUMNS
								) {
									(headerForms[headerForms.length - 1] as CardColumnSet).columns.push(...dataPointColumns);
								} else {
									dataPointColumnSet.columns.push(...dataPointColumns);
									headerForms.push(dataPointColumnSet);
								}
								previousCardElementIsDataPoint = true;
							}
							break;
						case CommunicationAnnotationTerms.Address:
							if (previousCardElementIsDataPoint) {
								// If previous header form content was a DataPoint, we add dummy columns.
								this.addEmptyColumns(headerForms[headerForms.length - 1] as CardColumnSet);
								previousCardElementIsDataPoint = false;
							}
							headerForms.push(
								...this.getAddressContent(
									referenceFacetTargetMetaPath as MetaPath<Address>,
									configHeaderFacet.title ?? formHeader,
									visible
								)
							);
							break;
						default:
							break;
					}
				}
				if (currentIdx === allConfigHeaderFacets.length - 1 && previousCardElementIsDataPoint) {
					// This is the last recursion of the reduce loop.
					// If previous header form content was a DataPoint, we add dummy columns.
					this.addEmptyColumns(headerForms[headerForms.length - 1] as CardColumnSet);
				}

				return headerForms;
			}.bind(this),
			[] as CardElement[]
		);
	}

	/**
	 * Add empty columns to the end of the column set.
	 *
	 * Header form with less than the maximum columns need to be added with empty columns to have the consistent layout equal to MAX_COLUMNS.
	 * This is needs in case of a header form contains DataPoints side by side. We fill the empty space in the layout with a dummy empty column.
	 * @param cardColumnSet Equivalent of a Header Form
	 */
	private addEmptyColumns(cardColumnSet: CardColumnSet): void {
		const numColumns = cardColumnSet.columns.length;
		if (numColumns < MAX_COLUMNS && numColumns > 1) {
			// If only one column exists then we don't have problem as it can freely occupy the whole width of the row.
			const numColumnsToAdd = MAX_COLUMNS - numColumns;
			for (let i = 0; i < numColumnsToAdd; i++) {
				cardColumnSet.columns.push(...this.getColumnForDataField());
			}
		}
	}

	/**
	 * Get the Address content from the facet.
	 * @param referenceFacetTargetMetaPath Meta
	 * @param formHeader Title of the form header
	 * @param visible Visible expression for the FacetHeader
	 * @returns Title and content of the address
	 */
	private getAddressContent(
		referenceFacetTargetMetaPath: MetaPath<Address>,
		formHeader: string | undefined,
		visible: CompiledAdaptiveCardExpression | boolean
	): CardElement[] {
		const addressContent: CardElement[] = [];
		const address = referenceFacetTargetMetaPath.getTarget();
		if (formHeader) {
			addressContent.push(
				getTextBlock({
					size: "Small",
					weight: "Bolder",
					text: formHeader,
					maxLines: 2,
					wrap: true,
					spacing: "Medium",
					visible: visible
				})
			);
		}
		const addressColumnSet = getColumnSet([] as CardColumn[], visible ?? undefined);
		const items = [];
		const columns = [];
		if (address?.label) {
			items.push(
				getTextBlock({
					size: "Small",
					text: `${address?.label}`,
					maxLines: 2
				})
			);
			columns.push(getColumn({ items: items, visible: visible ?? undefined }));
		}
		if (columns.length > 0) {
			addressColumnSet.columns.push(...columns);
		}
		addressContent.push(addressColumnSet);
		return addressContent;
	}

	/**
	 * Gets Reference facets configured in the header facet.
	 * @param headerFacets HeaderFacets containing referncefacets.
	 * @returns An Array of ReferenceFacets.
	 */
	private getReferenceFacetFromAnnotations(headerFacets: HeaderFacets): ReferenceFacet[] {
		return headerFacets ? (headerFacets.filter((facet) => facet.$Type === UIAnnotationTypes.ReferenceFacet) as ReferenceFacet[]) : [];
	}

	/**
	 * Get referencefacet  visibility.
	 * @param element Reference facet
	 * @param navigationPath Visited navigation paths
	 * @returns Boolean
	 */
	private getVisibleForReferenceFacet(element: ReferenceFacet, navigationPath?: string): CompiledAdaptiveCardExpression {
		const visibilityExp = isVisible(element);
		return this.updatePathsAndGetCompiledExpression(visibilityExp, navigationPath);
	}

	/**
	 * Get datafield visibility.
	 * @param dataField DataFieldAbstract
	 * @param navigationPath Visited navigation paths
	 * @returns Boolean
	 */
	private getVisibleForDataField(
		dataField: MetaPath<DataFieldAbstractTypes | DataPointType>,
		navigationPath?: string
	): CompiledAdaptiveCardExpression {
		const visibilityExp = generateVisibleExpression(dataField.getDataModelObjectPath());
		return this.updatePathsAndGetCompiledExpression(visibilityExp, navigationPath);
	}

	/**
	 * Get the navigation paths of the properties.
	 * @param metaPathObject MetaPath of the object
	 * @returns Navigation paths
	 */
	private getNavigationPathForExpression(
		metaPathObject: MetaPath<FieldGroup | DataFieldAbstractTypes | DataPointType>
	): string | undefined {
		const navigationProperties = metaPathObject.getNavigationProperties();
		const navigatedPaths: string[] = [];
		if (navigationProperties.length > 0) {
			navigationProperties.forEach(function (property: NavigationProperty) {
				if (isNavigationProperty(property)) {
					navigatedPaths.push(property.name);
				}
			});
		}
		return navigatedPaths?.toString()?.replaceAll(",", "/");
	}
}

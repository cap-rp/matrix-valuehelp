import type { ConvertedMetadata, EntityType, Property } from "@sap-ux/vocabularies-types";
import { TextArrangementType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { and, constant, notEqual, or, pathInModel, type BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { getAdaptiveCompilerResult, type CompiledAdaptiveCardExpression } from "sap/fe/core/helpers/AdaptiveCardExpressionCompiler";
import type MetaPath from "sap/fe/core/helpers/MetaPath";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";

/**
 * @typedef CardContextInfo
 * @property {string} bindingContextPath - Runtime binding context path for card.
 * @property {string} contextPath - Path to the target entityType of page for the card.
 */
export type CardContextInfo = {
	bindingContextPath: string;
	contextPath: string;
};

/**
 * @typedef CardConfig
 * @property {string} objectTitle - Title for the card.
 * @property {string} appUrl - Browser url of the application.
 * @property {string} webUrl - Url to fetch the card data. It shall contain the query parameters like $select and $expand.
 * @property {string} serviceURI - Service url.
 * @property {CardContextInfo} contextInfo - Card's context information.
 */
export type CardConfig = {
	objectTitle: string;
	appUrl: string;
	webUrl: string;
	serviceURI: string;
	contextInfo: CardContextInfo;
};

/**
 * Adaptive card json generator.
 * @param convertedTypes Converted Metadata.
 * @param config Card Configuration.
 * @experimental
 */
export default class BaseCardContentProvider<GenericConfig extends CardConfig> {
	private pathsToQuery: string[] = [];

	/**
	 * Get property paths to query.
	 * @returns Property paths that need to be queried.
	 */
	public getPathsToQuery(): string[] {
		return Array.from(new Set(this.pathsToQuery));
	}

	/**
	 * Collecting property paths that need to be queried for card creation.
	 * @param pathsToAdd Property paths that need to be cummulated.
	 */
	public addPathsToQuery(pathsToAdd: string[]): void {
		this.pathsToQuery = [...this.pathsToQuery, ...pathsToAdd];
	}

	/**
	 * Get card configuration by key.
	 * @param name Configuration key name.
	 * @returns Specific card configuration.
	 */
	public getCardConfigurationByKey<K extends keyof GenericConfig>(name: K): GenericConfig[K] {
		return this.config[name];
	}

	/**
	 * Get converted metadata entityType of the card.
	 * @returns EntityType.
	 */
	public getEntityType(): EntityType | undefined {
		const { contextPath } = this.getCardConfigurationByKey("contextInfo");
		const resolutionTargetEntityType = this.convertedTypes.resolvePath<EntityType>(contextPath);
		return resolutionTargetEntityType.target;
	}

	/**
	 * Get binding path of the field.
	 * @param fieldPath Path of the field annotation
	 * @returns Binding path of the field
	 */
	public getBindingForProperty(fieldPath: string): string {
		return "${" + this.getPropertyPathForCard(fieldPath) + "}";
	}

	/**
	 * Replace the navigationproperty path.
	 * @param propertyPath Path of the field annotation
	 * @returns Property path along with navigation paths
	 */
	public getPropertyPathForCard(propertyPath: string): string {
		// Check for navigation property path and replace to adaptive card format
		if (propertyPath && propertyPath?.includes("/")) {
			propertyPath = propertyPath.replace("/", ".");
		}
		this.addPathsToQuery([propertyPath]);
		return propertyPath;
	}

	/**
	 * Get binding path of the field which is configured with Text Arrangement.
	 * @param property Property of the field annotation
	 * @param textProperty Text property of the field annotation
	 * @returns Binding path of the field with Text Arrangement
	 */
	private formatTextproperty(property: MetaPath<Property>, textProperty?: MetaPath<Property>): string {
		let textExpression;
		const propertyBinding = this.getPropertyPathForCard(property.getRelativePath());
		if (textProperty && textProperty.getTarget()) {
			const textArrangementType = property?.getTarget()?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement?.toString();
			const textBinding = this.getPropertyPathForCard(textProperty.getRelativePath());
			switch (textArrangementType) {
				case TextArrangementType.TextLast:
					textExpression = `\${string(${propertyBinding})} (\${string(${textBinding})})`;
					break;
				case TextArrangementType.TextOnly:
					textExpression = `\${string(${textBinding})}`;
					break;
				case TextArrangementType.TextSeparate:
					textExpression = `\${string(${propertyBinding})}`;
					break;
				case TextArrangementType.TextFirst:
				default:
					textExpression = `\${string(${textBinding})} (\${string(${propertyBinding})})`;
					break;
			}
		} else {
			textExpression = `\${string(${this.getPropertyPathForCard(property.getRelativePath())})}`;
		}
		return textExpression;
	}

	public getTextBlockVisiblityForDateField(
		property: MetaPath<string>,
		additionalValue?: MetaPath<string>
	): BindingToolkitExpression<boolean> {
		let exp: BindingToolkitExpression<boolean> = constant(true);
		if (this.targetIsProperty(property)) {
			const edmType = (property as MetaPath<Property>).getTarget().type;
			const propertyPath = this.getPropertyPathForCard(property.getRelativePath());
			const valueExists = and(notEqual(pathInModel(propertyPath), undefined), notEqual(pathInModel(propertyPath), null));
			switch (edmType) {
				case "Edm.Date":
				case "Edm.DateTimeOffset":
				case "Edm.DateTime":
				case "Edm.Decimal": {
					exp = valueExists;
					break;
				}
				default: {
					let additionalValueExists: BindingToolkitExpression<boolean> = constant(false);
					if (additionalValue && this.targetIsProperty(additionalValue)) {
						const additionalValuePath = this.getPropertyPathForCard(additionalValue.getRelativePath());
						additionalValueExists = and(
							notEqual(pathInModel(additionalValuePath), undefined),
							notEqual(pathInModel(additionalValuePath), null)
						);
					}
					exp = or(valueExists, additionalValueExists);
				}
			}
		}
		return exp;
	}

	/**
	 * Get adaptive card binding expressions of the field which is configured with Text Arrangement.
	 * @param property Property of the field annotation
	 * @param textProperty Text property of the field annotation
	 * @returns Binding path of the field configured with Date, DateTime and Decimal
	 */
	private getFormattedTextValue(property: MetaPath<Property>, textProperty?: MetaPath<Property>): string {
		let propertyBindingExpression;
		switch (property?.getTarget()?.type) {
			case "Edm.Date":
				propertyBindingExpression = `{{DATE(\${formatDateTime(${this.getPropertyPathForCard(
					property.getRelativePath()
				)}, 'yyyy-MM-ddTHH:mm:ssZ')}, SHORT)}}`;
				break;
			case "Edm.DateTimeOffset":
			case "Edm.DateTime":
				propertyBindingExpression = `\${formatDateTime(${this.getPropertyPathForCard(property.getRelativePath())})}`;
				break;
			case "Edm.Decimal":
				propertyBindingExpression = `\${formatNumber(${this.getPropertyPathForCard(property.getRelativePath())},2)}`;
				break;
			default:
				propertyBindingExpression = this.formatTextproperty(property, textProperty);
				break;
		}
		return propertyBindingExpression;
	}

	/**
	 * Get binding path of the field.
	 * @param property Property of the field annotation
	 * @param textProperty Text property of the field annotation
	 * @returns Binding path of the field
	 */
	public getValueBinding<T>(property: MetaPath<T> | string, textProperty?: MetaPath<T>): string {
		let adaptiveBindingExpression = "";
		if (typeof property === "string") {
			adaptiveBindingExpression = property;
		} else if (this.targetIsProperty(property) && (!textProperty || this.targetIsProperty(textProperty))) {
			adaptiveBindingExpression = this.getFormattedTextValue(property, textProperty);
		}
		return adaptiveBindingExpression;
	}

	/**
	 * Update paths to query and get compiled expression.
	 * @param expression Binding toolkit expression
	 * @param navigationPaths
	 * @returns Compiled adaptive expression
	 */
	public updatePathsAndGetCompiledExpression<T>(
		expression: BindingToolkitExpression<T>,
		navigationPaths?: string
	): CompiledAdaptiveCardExpression {
		const { pathsToQuery, compiledExpression } = getAdaptiveCompilerResult(expression, navigationPaths);
		this.addPathsToQuery(pathsToQuery);
		return compiledExpression;
	}

	public targetIsProperty(metaPath: MetaPath<unknown> | undefined): metaPath is MetaPath<Property> {
		const target = metaPath?.getTarget();
		return isProperty(target);
	}

	constructor(
		public convertedTypes: ConvertedMetadata,
		private config: GenericConfig
	) {}
}

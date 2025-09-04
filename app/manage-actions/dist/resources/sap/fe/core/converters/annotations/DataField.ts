import type { AnnotationTerm, Decimal, PathAnnotationExpression, PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import type { Contact } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import { CommunicationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldForActionAbstractTypes,
	DataFieldForActionGroup,
	DataFieldForAnnotation,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	DataPoint,
	DataPointType,
	DataPointTypeTypes,
	FieldGroup,
	Identification,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes, VisualizationType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { equal, getExpressionFromAnnotation, not } from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { TableType } from "sap/fe/core/converters/controls/Common/Table";
import type { ColumnExportSettings } from "sap/fe/core/converters/controls/Common/table/Columns";
import { AggregationHelper } from "sap/fe/core/converters/helpers/Aggregation";
import { isAnnotationOfTerm, isAnnotationOfType, isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import { getDisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import {
	getAssociatedCurrencyProperty,
	getAssociatedCurrencyPropertyPath,
	getAssociatedExternalIdProperty,
	getAssociatedExternalIdPropertyPath,
	getAssociatedTextProperty,
	getAssociatedTextPropertyPath,
	getAssociatedTimezoneProperty,
	getAssociatedUnitProperty,
	getAssociatedUnitPropertyPath,
	hasStaticPercentUnit
} from "sap/fe/core/templating/PropertyHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath, type DataModelObjectPath } from "../../templating/DataModelPathHelper";
import type { DisplayMode } from "../../templating/UIFormatters";
import type ConverterContext from "../ConverterContext";
import { isReferencePropertyStaticallyHidden } from "../helpers/DataFieldHelper";

export type ComplexPropertyInfo = {
	properties: Record<string, { annotationProperty: Property; displayModeOfPropertyUsedAsDescription?: DisplayMode }>;
	additionalProperties: Record<string, Property>;
	exportSettings: ColumnExportSettings;
};

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionAbstract".
 * DataFieldForActionAbstract has an inline action defined.
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForActionAbstractType
 */
export function isDataFieldForActionAbstract(dataField: DataFieldAbstractTypes): dataField is DataFieldForActionAbstractTypes {
	return (dataField as DataFieldForActionAbstractTypes).hasOwnProperty("Action");
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionGroup".
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForActionGroup
 */
export function isDataFieldForActionGroup(dataField: DataFieldAbstractTypes): dataField is DataFieldForActionGroup {
	return dataField.$Type === UIAnnotationTypes.DataFieldForActionGroup;
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "isDataFieldForAnnotation".
 * isDataFieldForAnnotation has an inline $Type property that can be used.
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForAnnotation
 */
export function isDataFieldForAnnotation(
	dataField: DataFieldAbstractTypes | DataPointTypeTypes | undefined
): dataField is DataFieldForAnnotation {
	return dataField?.$Type === UIAnnotationTypes.DataFieldForAnnotation;
}

export function isDataFieldForAction(dataField: DataFieldAbstractTypes | undefined): dataField is DataFieldForAction {
	return dataField?.$Type === UIAnnotationTypes.DataFieldForAction;
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForIntentBasedNavigation".
 * DataFieldForIntentBasedNavigation has an inline $Type property that can be used.
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForIntentBasedNavigation
 */
export function isDataFieldForIntentBasedNavigation(dataField: DataFieldAbstractTypes): dataField is DataFieldForIntentBasedNavigation {
	return dataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation;
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
 * DataField has a value defined.
 * @param dataField DataField to be evaluated
 * @returns Validate that dataField is a DataFieldTypes
 */
export function isDataFieldTypes(dataField: DataFieldAbstractTypes | unknown): dataField is DataFieldTypes {
	return (dataField as DataFieldTypes).hasOwnProperty("Value");
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataField".
 * DataField has a value defined.
 * @param dataField DataField to be evaluated
 * @returns Validate that dataField is a DataField
 */
export function isDataField(dataField: DataField | unknown): dataField is DataField {
	return (dataField as DataField)?.hasOwnProperty("Value");
}

/**
 * Determines if the dataFieldForAnnotation is a field group.
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if the dataFieldForAnnotation is a field group.
 */
export function hasFieldGroupTarget(dataFieldForAnnotation: DataFieldForAnnotation | ReferenceFacet): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	return isAnnotationOfType<FieldGroup>(dataFieldTarget, UIAnnotationTypes.FieldGroupType);
}

/**
 * Determines if the dataFieldForAnnotation is a field group.
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if the dataFieldForAnnotation is a field group.
 */
export function hasIdentificationTarget(dataFieldForAnnotation: DataFieldForAnnotation | ReferenceFacet): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	return isAnnotationOfTerm<Identification>(dataFieldTarget, UIAnnotationTerms.Identification);
}

/**
 * Determines if the dataFieldForAnnotation is a data point.
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if the dataFieldForAnnotation is a data point.
 */
export function hasDataPointTarget(dataFieldForAnnotation: DataFieldForAnnotation): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	return isAnnotationOfType<DataPoint>(dataFieldTarget, UIAnnotationTypes.DataPointType);
}

/**
 * Gets the binding expression for 'visible' setting for the action.
 * @param dataField The data field record which could be DataFieldForAction, DataFieldForIntentBasedNavigation or DataFieldForActionGroup
 * @param converterContext The converter context
 * @returns The binding expression to be used for setting 'visible' based on UI.Hidden configuration
 */
export function visibleExpression(
	dataField: DataFieldForAction | DataFieldForIntentBasedNavigation | DataFieldForActionGroup | undefined,
	converterContext: ConverterContext<PageContextPathTarget>
): BindingToolkitExpression<boolean> {
	return not(
		equal(
			getExpressionFromAnnotation(dataField?.annotations?.UI?.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()),
			true
		)
	);
}

/**
 * Determine if the data model object path targeting a dataField for action opens up a dialog.
 * @param dataModelObjectPath DataModelObjectPath
 * @returns `Dialog` | `None` if a dialog is needed
 */
export function isDataModelObjectPathForActionWithDialog(
	dataModelObjectPath: DataModelObjectPath<DataFieldAbstractTypes>
): "Dialog" | "None" {
	const target = dataModelObjectPath.targetObject;
	return isActionWithDialog(isDataFieldForAction(target) ? target : undefined);
}

/**
 * Determine if the dataField for action opens up a dialog.
 * @param dataField DataField for action
 * @returns `Dialog` | `None` if a dialog is needed
 */
export function isActionWithDialog(dataField?: DataFieldForAction): "Dialog" | "None" {
	const action = dataField?.ActionTarget;
	if (action) {
		const bCritical = action.annotations?.Common?.IsActionCritical;
		if (action.parameters.length > 1 || bCritical) {
			return "Dialog";
		} else {
			return "None";
		}
	} else {
		return "None";
	}
}

/**
 * Retrieves the TargetValue from a DataPoint.
 * @param source The target property or DataPoint
 * @returns The TargetValue as a decimal or a property path
 */

export function getTargetValueOnDataPoint(source: Property | DataPointType): PathAnnotationExpression<unknown> | string {
	let targetValue: Decimal | undefined | PathAnnotationExpression<unknown> | string;
	if (isProperty(source)) {
		const dataPoint = (source.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target as DataPointType;
		targetValue = dataPoint?.TargetValue ?? dataPoint?.MaximumValue;
	} else {
		targetValue = source.TargetValue ?? source.MaximumValue;
	}
	if (typeof targetValue === "number") {
		return targetValue.toString();
	}
	return isPathAnnotationExpression(targetValue) ? targetValue : "100";
}

/**
 * Check if a property uses a DataPoint within a DataFieldDefault.
 * @param property The property to be checked
 * @returns `true` if the referenced property has a DataPoint within the DataFieldDefault, false else
 */

export const isDataPointFromDataFieldDefault = function (property: Property): boolean {
	return (
		(property.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType
	);
};

/**
 * Check if a property uses a default visualization Rating through a DataFieldDefault.
 * @param property The property to be checked
 * @returns `true` if the visualization through a DataFieldDefault is a Rating
 */

export const isRatingVisualizationFromDataFieldDefault = function (property: Property): boolean {
	return (
		isDataPointFromDataFieldDefault(property) &&
		((property.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target as AnnotationTerm<DataPoint>)
			?.Visualization === "UI.VisualizationType/Rating"
	);
};

/**
 * Check if a property uses a Progress visualization Rating through a DataFieldDefault or a direct DataPoint.
 * @param property The property to be checked
 * @returns `true` if the visualization is a Progress
 */

export const isAProgressTypeFromDataPoint = function (property: Property | DataFieldForAnnotation): boolean {
	if (isProperty(property) && isDataPointFromDataFieldDefault(property)) {
		property = property.annotations.UI?.DataFieldDefault as DataFieldForAnnotation;
	}
	return ((property as DataFieldForAnnotation).Target?.$target as DataPointType)?.Visualization === "UI.VisualizationType/Progress";
};

export function getSemanticObjectPath(
	converterContext: ConverterContext<PageContextPathTarget>,
	object: DataFieldAbstractTypes | Property
): string | undefined {
	if (typeof object === "object") {
		if (isDataFieldTypes(object) && object.Value?.$target) {
			const property = object.Value?.$target;
			if (property?.annotations?.Common?.SemanticObject !== undefined) {
				return converterContext.getEntitySetBasedAnnotationPath(property?.fullyQualifiedName);
			}
		} else if (isProperty(object)) {
			if (object?.annotations?.Common?.SemanticObject !== undefined) {
				return converterContext.getEntitySetBasedAnnotationPath(object?.fullyQualifiedName);
			}
		}
	}
	return undefined;
}

/**
 * Returns the navigation path prefix for a property path.
 * @param path The property path For e.g. /EntityType/Navigation/Property
 * @returns The navigation path prefix For e.g. /EntityType/Navigation/
 */
function _getNavigationPathPrefix(path: string | undefined): string {
	if (path) {
		return path.includes("/") ? path.substring(0, path.lastIndexOf("/") + 1) : "";
	}
	return "";
}

/**
 * Collect additional properties for the ALP table use-case.
 *
 * For e.g. If UI.Hidden points to a property, include this property in the additionalProperties of ComplexPropertyInfo object.
 * @param target Property or DataField being processed
 * @param navigationPathPrefix Navigation path prefix, applicable in case of navigation properties.
 * @param tableType Table type.
 * @param relatedProperties The related properties identified so far.
 * @returns The related properties identified.
 */
function _collectAdditionalPropertiesForAnalyticalTable(
	target: PrimitiveType,
	navigationPathPrefix: string,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo
): ComplexPropertyInfo {
	if (tableType === "AnalyticalTable") {
		const hiddenAnnotation = target.annotations?.UI?.Hidden;
		if (hiddenAnnotation?.path && isProperty(hiddenAnnotation.$target)) {
			const hiddenAnnotationPropertyPath = navigationPathPrefix + hiddenAnnotation.path;
			// This property should be added to additionalProperties map for the ALP table use-case.
			relatedProperties.additionalProperties[hiddenAnnotationPropertyPath] = hiddenAnnotation.$target;
		}

		const criticality = target.Criticality;
		if (criticality?.path && isProperty(criticality?.$target)) {
			const criticalityPropertyPath = navigationPathPrefix + criticality.path;
			relatedProperties.additionalProperties[criticalityPropertyPath] = criticality?.$target;
		}
	}
	return relatedProperties;
}

/**
 * Helper for collectRelatedProperties to push unique related properties.
 * @param relatedProperties
 * @param key The property path
 * @param value The properties object containing value property, description property...
 * @param displayModeOfPropertyUsedAsDescription The display mode if the property is referenced as description on text arrangement
 * @returns Index at which the property is available
 */
function _setRelatedPropertiesAndGetIndex(
	relatedProperties: ComplexPropertyInfo,
	key: string,
	value: Property,
	displayModeOfPropertyUsedAsDescription?: DisplayMode
): number {
	if (!relatedProperties.properties.hasOwnProperty(key)) {
		relatedProperties.properties[key] = { annotationProperty: value };
		if (displayModeOfPropertyUsedAsDescription) {
			relatedProperties.properties[key].displayModeOfPropertyUsedAsDescription = displayModeOfPropertyUsedAsDescription;
		}
	}
	return Object.keys(relatedProperties.properties).indexOf(key);
}

/**
 * Helper for collectRelatedProperties to append the export settings template with a formatted text.
 * @param relatedProperties
 * @param value Formatted text
 */
function _appendTemplate(relatedProperties: ComplexPropertyInfo, value: string): void {
	relatedProperties.exportSettings.template = relatedProperties.exportSettings?.template
		? `${relatedProperties.exportSettings.template}${value}`
		: `${value}`;
}

/**
 * Collect related properties from a property's annotations.
 * @param path The property path
 * @param property The property to be considered
 * @param converterContext The converter context
 * @param ignoreSelf Whether to exclude the same property from the related properties.
 * @param tableType The table type.
 * @param relatedProperties The related properties identified so far.
 * @param addUnitInTemplate True if the unit/currency property needs to be added in the export template
 * @param isAnnotatedAsHidden True if the DataField or the property are statically hidden
 * @returns The related properties identified.
 */
export function collectRelatedProperties(
	path: string,
	property: PrimitiveType,
	converterContext: ConverterContext,
	ignoreSelf: boolean,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo = {
		properties: {},
		additionalProperties: {},
		exportSettings: {}
	},
	addUnitInTemplate = false,
	isAnnotatedAsHidden = false
): ComplexPropertyInfo {
	if (path && property) {
		let valueIndex: number;
		/* EXTERNALID */
		const externalIdPath = getAssociatedExternalIdPropertyPath(property);
		const externalIdProperty = getAssociatedExternalIdProperty(property);

		if (isAnnotatedAsHidden) {
			// Collect underlying property
			valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
			_appendTemplate(relatedProperties, `{${valueIndex}}`);
			return relatedProperties;
		}
		const navigationPathPrefix = _getNavigationPathPrefix(path);

		const entityType = converterContext.getEntityType();
		const aggregationHelper = new AggregationHelper(entityType, converterContext);

		// Check for Text annotation.
		const textProperty = getAssociatedTextProperty(externalIdProperty || property);
		const textPropertyPath = getAssociatedTextPropertyPath(externalIdProperty || property);

		// get the DataModelObjectPath for the column
		const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
		const propertyDataModelObjectPath = enhanceDataModelPath<Property>(dataModelObjectPath, externalIdPath || path);
		const relativePath = getContextRelativeTargetObjectPath(propertyDataModelObjectPath);
		const textPropertyDataModelObjectPath = enhanceDataModelPath<Property>(propertyDataModelObjectPath, textPropertyPath);
		const textRelativePath = getContextRelativeTargetObjectPath(textPropertyDataModelObjectPath);

		if (relatedProperties.exportSettings?.template) {
			// FieldGroup use-case. Need to add each Field in new line.
			_appendTemplate(relatedProperties, "\n");
			relatedProperties.exportSettings.wrap = true;
		}

		// The text arrangement will be considered only if the text property is groupable
		const textArrangementToBeConsidered =
			tableType === "AnalyticalTable" && !!aggregationHelper.isPropertyGroupable(property)
				? !!textProperty && !!aggregationHelper.isPropertyGroupable(textProperty)
				: true;
		if (textProperty && textRelativePath) {
			if (textArrangementToBeConsidered) {
				const pathForText = externalIdPath ? externalIdPath : path;
				const propertyForText = externalIdProperty ? externalIdProperty : property;
				// Check for Text Arrangement.
				const displayMode = getDisplayMode(propertyForText, propertyDataModelObjectPath);
				let descriptionIndex: number;
				switch (displayMode) {
					case "Description":
						descriptionIndex = _setRelatedPropertiesAndGetIndex(
							relatedProperties,
							textRelativePath,
							textProperty,
							"Description"
						);
						_appendTemplate(relatedProperties, `{${descriptionIndex}}`);
						break;

					case "ValueDescription":
						valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
						descriptionIndex = _setRelatedPropertiesAndGetIndex(
							relatedProperties,
							textRelativePath,
							textProperty,
							"ValueDescription"
						);
						_appendTemplate(relatedProperties, `{${valueIndex}} ({${descriptionIndex}})`);
						break;

					case "DescriptionValue":
						valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
						descriptionIndex = _setRelatedPropertiesAndGetIndex(
							relatedProperties,
							textRelativePath,
							textProperty,
							"DescriptionValue"
						);
						_appendTemplate(relatedProperties, `{${descriptionIndex}} ({${valueIndex}})`);
						break;
					default:
						valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, pathForText, propertyForText);
						_appendTemplate(relatedProperties, `{${valueIndex}}`);
						break;
				}
			} else {
				// Collect underlying property
				valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
				_appendTemplate(relatedProperties, `{${valueIndex}}`);
			}
		} else {
			// Check for field containing Currency Or Unit Properties or Timezone
			const currencyProperty = getAssociatedCurrencyProperty(property);
			const unitProperty = getAssociatedUnitProperty(property);
			const currencyOrUoMProperty = currencyProperty ?? unitProperty;
			const currencyOrUnitAnnotation: PathAnnotationExpression<string> =
				property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit;
			const timezoneProperty = getAssociatedTimezoneProperty(property);
			const timezoneAnnotation = property?.annotations?.Common?.Timezone;

			if (currencyOrUoMProperty) {
				collectCurrencyOrUnitProperties(
					relatedProperties,
					relativePath ?? path,
					addUnitInTemplate,
					propertyDataModelObjectPath,
					currencyOrUoMProperty,
					currencyProperty
				);
			} else if (timezoneProperty && timezoneAnnotation?.$target) {
				collectTimezoneProperties(property, relatedProperties, path, addUnitInTemplate);
			} else if (
				(property.Target?.$target?.$Type === UIAnnotationTypes.DataPointType && !property.Target?.$target?.ValueFormat) ||
				property.annotations?.UI?.DataFieldDefault?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType
			) {
				collectDataPointProperties(property, relatedProperties, relativePath);
			} else if (property.$Type === CommunicationAnnotationTypes.ContactType) {
				const contactProperty = property.fn?.$target;
				const contactPropertyPath = property.fn?.path;
				valueIndex = _setRelatedPropertiesAndGetIndex(
					relatedProperties,
					navigationPathPrefix ? navigationPathPrefix + contactPropertyPath : contactPropertyPath,
					contactProperty
				);
				_appendTemplate(relatedProperties, `{${valueIndex}}`);
			} else if (!ignoreSelf) {
				// Collect underlying property
				valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
				_appendTemplate(relatedProperties, `{${valueIndex}}`);
				if (currencyOrUnitAnnotation) {
					relatedProperties.exportSettings.unit = `${currencyOrUnitAnnotation}`; // Hard-coded currency/unit
					if (property?.annotations?.Measures?.ISOCurrency) {
						relatedProperties.exportSettings.isCurrency = true;
					}
				} else if (timezoneAnnotation) {
					relatedProperties.exportSettings.timezone = `${timezoneAnnotation}`; // Hard-coded timezone
				}
			}
		}

		relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(property, navigationPathPrefix, tableType, relatedProperties);
		if (Object.keys(relatedProperties.additionalProperties).length > 0 && Object.keys(relatedProperties.properties).length === 0) {
			// Collect underlying property if not collected already.
			// This is to ensure that additionalProperties are made available only to complex property infos.
			valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);
			_appendTemplate(relatedProperties, `{${valueIndex}}`);
		}
	}
	return relatedProperties;
}

/**
 * Gets the type of Visualization of the DataPoint.
 * @param source Source of the DataPoint.
 * @returns The type of Visualization or undefined if there's none.
 */
function getDataPointVisualization(source: Property | DataPointType): VisualizationType {
	let dataPoint: DataPointType;
	if (isProperty(source)) {
		dataPoint = (source.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target as DataPointType;
	} else {
		dataPoint = source;
	}
	return dataPoint.Visualization ?? VisualizationType.Number;
}

/**
 *	Collect the related properties from a DataPoint.
 * @param property The property to be considered.
 * @param relatedProperties The related properties identified so far.
 * @param path The property path.
 */
function collectDataPointProperties(property: PrimitiveType, relatedProperties: ComplexPropertyInfo, path: string | undefined): void {
	// path must not be undefined, getContextRelativeTargetObjectPath may return undefined
	if (path === undefined) {
		return;
	}
	const dataPointProperty = property.Target?.$target?.Value.$target as Property;
	const datapointTarget = property.Target?.$target;
	const navigationPathPrefix = _getNavigationPathPrefix(path);
	// DataPoint use-case using DataFieldDefault.
	const dataPointDefaultProperty = property.annotations?.UI?.DataFieldDefault;
	const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, dataPointDefaultProperty ? property : dataPointProperty);
	// If we have a DataPoint without visualization, or a Number, we don't have a TargetValue/MaximumValue
	if (getDataPointVisualization(dataPointDefaultProperty ? property : datapointTarget) === VisualizationType.Number) {
		return;
	}
	const targetValue = getTargetValueOnDataPoint(dataPointDefaultProperty ? property : datapointTarget);
	if (isPathAnnotationExpression(targetValue)) {
		if (targetValue.$target) {
			//in case it's a dynamic targetValue
			const dataPointIndex = _setRelatedPropertiesAndGetIndex(
				relatedProperties,
				navigationPathPrefix ? navigationPathPrefix + targetValue.$target.name : targetValue.$target.name,
				targetValue.$target
			);
			relatedProperties.exportSettings.dataPointTargetValue = targetValue.path;
			_appendTemplate(relatedProperties, `{${valueIndex}}/{${dataPointIndex}}`);
		}
	} else if (hasStaticPercentUnit(dataPointDefaultProperty ? property : dataPointProperty) && isAProgressTypeFromDataPoint(property)) {
		relatedProperties.exportSettings.unit = "%";
	} else {
		relatedProperties.exportSettings.dataPointTargetValue = targetValue;
		_appendTemplate(relatedProperties, `{${valueIndex}}/${targetValue}`);
	}
}

/**
 *	Collect the related properties from a property with Timezone.
 * @param property The property to be considered.
 * @param relatedProperties The related properties identified so far.
 * @param path The property path.
 * @param addUnitInTemplate Should we add the unit in the template.
 */
function collectTimezoneProperties(
	property: PrimitiveType,
	relatedProperties: ComplexPropertyInfo,
	path: string,
	addUnitInTemplate: boolean
): void {
	const timezoneAnnotation = property.annotations.Common.Timezone;
	const navigationPathPrefix = _getNavigationPathPrefix(path);
	const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, path, property);

	const timezoneOrUoMIndex = _setRelatedPropertiesAndGetIndex(
		relatedProperties,
		navigationPathPrefix + timezoneAnnotation.path,
		timezoneAnnotation.$target
	);
	if (addUnitInTemplate) {
		_appendTemplate(relatedProperties, `{${valueIndex}}  {${timezoneOrUoMIndex}}`);
	} else {
		relatedProperties.exportSettings.timezoneProperty = navigationPathPrefix + timezoneAnnotation.path;
	}
}

/**
 * Collect the related properties from a property with currencies or units.
 * @param relatedProperties The related properties identified so far for the column.
 * @param relativePath The property relative path.
 * @param addUnitInTemplate Specify if the unit should be added in the template.
 * @param propertyDataModelObjectPath The data model object path of the property to be considered.
 * @param currencyOrUoMProperty The currency or unit of measure property linked to the column.
 * @param currencyProperty The currency property linked to the column.
 */
function collectCurrencyOrUnitProperties(
	relatedProperties: ComplexPropertyInfo,
	relativePath: string,
	addUnitInTemplate: boolean,
	propertyDataModelObjectPath: DataModelObjectPath<Property>,
	currencyOrUoMProperty: Property,
	currencyProperty?: Property
): void {
	const property = propertyDataModelObjectPath.targetObject;
	if (property) {
		const currencyOrUnitPropertyPath = getAssociatedCurrencyPropertyPath(property) || getAssociatedUnitPropertyPath(property);
		const unitOrCurrencyPropertyDataModelObjectPath = enhanceDataModelPath<Property>(
			propertyDataModelObjectPath,
			currencyOrUnitPropertyPath
		);
		const unitOrCurrencyRelativePath = getContextRelativeTargetObjectPath(unitOrCurrencyPropertyDataModelObjectPath);
		const valueIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, relativePath, property);
		const currencyOrUoMIndex = _setRelatedPropertiesAndGetIndex(relatedProperties, unitOrCurrencyRelativePath!, currencyOrUoMProperty);
		if (addUnitInTemplate) {
			_appendTemplate(relatedProperties, `{${valueIndex}}  {${currencyOrUoMIndex}}`);
		} else {
			relatedProperties.exportSettings.unitProperty = unitOrCurrencyRelativePath;
		}
		if (currencyProperty) {
			relatedProperties.exportSettings.isCurrency = true;
		}
		relatedProperties.exportSettings.scale = property.scale;
	}
}

/**
 * Collect properties consumed by a DataField.
 * This is for populating the ComplexPropertyInfos of the table delegate.
 * @param dataField The DataField for which the properties need to be identified.
 * @param converterContext The converter context.
 * @param tableType The table type.
 * @param relatedProperties The properties identified so far.
 * @param isEmbedded True if the DataField is embedded in another annotation (such as FieldGroup).
 * @returns The properties related to the DataField.
 */
export function collectRelatedPropertiesRecursively(
	dataField: DataFieldAbstractTypes,
	converterContext: ConverterContext,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo = {
		properties: {},
		additionalProperties: {},
		exportSettings: {}
	},
	isEmbedded = false
): ComplexPropertyInfo {
	let isStaticallyHidden = false;
	switch (dataField?.$Type) {
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			if (dataField.Value) {
				const property = dataField.Value;
				isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
				relatedProperties = collectRelatedProperties(
					property.path,
					property.$target,
					converterContext,
					false,
					tableType,
					relatedProperties,
					isEmbedded,
					isStaticallyHidden
				);
				const navigationPathPrefix = _getNavigationPathPrefix(property.path);
				relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(
					dataField,
					navigationPathPrefix,
					tableType,
					relatedProperties
				);
			}
			break;

		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			break;

		case UIAnnotationTypes.DataFieldForAnnotation:
			switch (dataField.Target?.$target?.$Type) {
				case UIAnnotationTypes.FieldGroupType:
					dataField.Target.$target.Data?.forEach((innerDataField: DataFieldAbstractTypes) => {
						relatedProperties = collectRelatedPropertiesRecursively(
							innerDataField,
							converterContext,
							tableType,
							relatedProperties,
							true
						);
					});
					break;

				case UIAnnotationTypes.DataPointType:
					isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
					relatedProperties = collectRelatedProperties(
						dataField.Target.$target.Value.path,
						dataField,
						converterContext,
						false,
						tableType,
						relatedProperties,
						isEmbedded,
						isStaticallyHidden
					);
					break;

				case CommunicationAnnotationTypes.ContactType:
					const dataFieldContact = dataField.Target.$target as Contact;
					isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
					relatedProperties = collectRelatedProperties(
						dataField.Target.value,
						dataFieldContact,
						converterContext,
						isStaticallyHidden,
						tableType,
						relatedProperties,
						isEmbedded,
						isStaticallyHidden
					);
					break;
				default:
					break;
			}
			break;

		default:
			break;
	}

	return relatedProperties;
}

export const getDataFieldDataType = function (oDataField: DataFieldAbstractTypes | Property): string | undefined {
	if (isProperty(oDataField)) {
		return oDataField.type;
	}
	let sDataType: string | undefined;
	switch (oDataField.$Type) {
		case UIAnnotationTypes.DataFieldForActionGroup:
		case UIAnnotationTypes.DataFieldWithActionGroup:
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			sDataType = undefined;
			break;

		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			sDataType = (oDataField as DataField)?.Value?.$target?.type;
			break;

		case UIAnnotationTypes.DataFieldForAnnotation:
		default:
			if (oDataField.Target?.$target?.$Type) {
				const dataFieldTarget = oDataField.Target.$target;
				if (dataFieldTarget.$Type === CommunicationAnnotationTypes.ContactType && isPathAnnotationExpression(dataFieldTarget.fn)) {
					sDataType = dataFieldTarget.fn.$target?.type;
				} else if (dataFieldTarget.$Type === UIAnnotationTypes.DataPointType) {
					sDataType = dataFieldTarget.Value?.$Path?.$Type || dataFieldTarget.Value?.$target?.type;
				} else {
					// e.g. FieldGroup or Chart
					// FieldGroup Properties have no type, so we define it as a boolean type to prevent exceptions during the calculation of the width
					sDataType =
						oDataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.ChartDefinitionType" ? undefined : "Edm.Boolean";
				}
			} else {
				sDataType = undefined;
			}
			break;
	}

	return sDataType;
};

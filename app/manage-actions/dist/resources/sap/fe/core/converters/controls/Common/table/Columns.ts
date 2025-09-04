import type { EntityType, NavigationProperty, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import type { FilterFunctions } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type { EntitySetAnnotations_Capabilities } from "@sap-ux/vocabularies-types/vocabularies/Capabilities_Edm";
import type { SemanticKey } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAnnotation,
	DataFieldTypes,
	DataPoint,
	DataPointTypeTypes,
	FieldGroup,
	LineItem
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	EDM_TYPE_MAPPING,
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	getExpressionFromAnnotation,
	ifElse,
	not,
	or,
	pathInModel
} from "sap/fe/base/BindingToolkit";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type {
	AvailabilityType,
	CustomDefinedTableColumn,
	CustomDefinedTableColumnForOverride,
	FormatOptionsType,
	TableColumnSettings,
	TableManifestConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import { CreationMode, HorizontalAlign, Importance, TemplateType } from "sap/fe/core/converters/ManifestSettings";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { ComplexPropertyInfo } from "sap/fe/core/converters/annotations/DataField";
import {
	collectRelatedProperties,
	collectRelatedPropertiesRecursively,
	getDataFieldDataType,
	getSemanticObjectPath,
	getTargetValueOnDataPoint,
	hasDataPointTarget,
	hasFieldGroupTarget,
	isDataField,
	isDataFieldForAnnotation,
	isDataFieldTypes,
	isDataPointFromDataFieldDefault,
	isRatingVisualizationFromDataFieldDefault
} from "sap/fe/core/converters/annotations/DataField";
import { type TableType } from "sap/fe/core/converters/controls/Common/Table";
import { AggregationHelper } from "sap/fe/core/converters/helpers/Aggregation";
import type { ConfigurableObject, CustomElement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { OverrideType, Placement, insertCustomElements } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { isReferencePropertyStaticallyHidden } from "sap/fe/core/converters/helpers/DataFieldHelper";
import { IssueCategory, IssueCategoryType, IssueSeverity } from "sap/fe/core/converters/helpers/IssueManager";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { replaceSpecialChars } from "sap/fe/core/helpers/StableIdHelper";
import * as TypeGuards from "sap/fe/core/helpers/TypeGuards";
import {
	isAnnotationOfType,
	isNavigationProperty,
	isPathAnnotationExpression,
	isProperty,
	isTypeDefinition
} from "sap/fe/core/helpers/TypeGuards";
import {
	enhanceDataModelPath,
	getContextPropertyRestriction,
	getContextRelativeTargetObjectPath,
	getTargetObjectPath,
	type DataModelObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { getDisplayMode, type DisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import { getRestrictionsOnProperties, type RestrictionsOnProperties } from "sap/fe/core/templating/EntitySetHelper";
import { hasFieldControlNotMandatory, isStaticallyMandatory } from "sap/fe/core/templating/FieldControlHelper";
import {
	getAssociatedCurrencyProperty,
	getAssociatedCurrencyPropertyPath,
	getAssociatedTextProperty,
	getAssociatedTextPropertyPath,
	getAssociatedTimezoneProperty,
	getAssociatedUnitProperty,
	getAssociatedUnitPropertyPath,
	getStaticTimezone,
	getStaticUnitOrCurrency,
	isTimezone
} from "sap/fe/core/templating/PropertyHelper";
import { isMultiValueField } from "sap/fe/core/templating/UIFormatters";
import type { DefaultTypeForEdmType } from "sap/fe/core/type/EDM";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import tableFormatters from "sap/fe/macros/formatters/TableFormatter";
import type Control from "sap/ui/core/Control";
import type { MDCTablePropertyInfo as PropertyInfo, VisualSettings } from "sap/ui/mdc/Table";

// Custom Column from Manifest
type ManifestDefinedCustomColumn = CustomDefinedTableColumn & {
	type?: ColumnType.Default;
};

// Slot Column from Building Block
type FragmentDefinedSlotColumn = CustomDefinedTableColumn & {
	type: ColumnType.Slot;
};
// Properties all ColumnTypes have:
type BaseTableColumn = ConfigurableObject & {
	type: ColumnType; //Origin of the source where we are getting the templated information from
	width?: string;
	widthIncludingColumnHeader?: boolean;
	importance?: Importance;
	horizontalAlign?: HorizontalAlign;
	availability?: AvailabilityType;
	isNavigable?: boolean;
	caseSensitive?: boolean;
	label?: string;
	tooltip?: string;
};

// Properties on Custom Columns and Slot Columns
export type CustomBasedTableColumn = BaseTableColumn & {
	id: string;
	name: string;
	header?: string;
	template: string | Control;
	propertyInfos?: string[];
	exportSettings?: ColumnExportSettings | null;
	formatOptions: FormatOptionsType;
	isGroupable: boolean;
	isNavigable: boolean;
	sortable: boolean;
	visualSettings: { widthCalculation: null };
	properties?: string[];
	required?: CompiledBindingToolkitExpression;
};

export type ComputedTableColumn = BaseTableColumn & {
	name: string;
	label: string;
	propertyKey: string;
	isDraftIndicator?: boolean;
	isSituationsIndicator?: boolean;
	formatOptions?: FormatOptionsType | null;
	propertyInfos?: string[];
	exportSettings?: ColumnExportSettings | null;
	clipboardSettings?: Object | null;
	required?: CompiledBindingToolkitExpression;
};

// Properties derived from Manifest to override Annotation configurations
type AnnotationTableColumnForOverride = BaseTableColumn & {
	settings?: TableColumnSettings;
	formatOptions?: FormatOptionsType;
	exportSettings?: ColumnExportSettings | null;
};

type PropertyTypeConstraints = Partial<{
	scale: number;
	precision: number;
	maxLength: number;
	nullable: boolean;
	minimum: string;
	maximum: string;
	isDigitSequence: boolean;
}>;

export type PropertyTypeFormatOptions = Partial<{
	parseAsString: boolean;
	emptyString: string;
	parseKeepsEmptyString: boolean;
	style: string;
}>;

export type PropertyTypeConfig = {
	type?: string;
	constraints: PropertyTypeConstraints;
	formatOptions: PropertyTypeFormatOptions;
	typeInstance?: unknown;
	baseType?: string;
	className?: keyof typeof DefaultTypeForEdmType;
};

export type ColumnExportSettings = PropertyInfo["exportSettings"] & {
	dataPointTargetValue?: string;
	isCurrency?: boolean;
};

// Properties for Annotation Columns
export type AnnotationTableColumn = PropertyInfo &
	AnnotationTableColumnForOverride & {
		name: string;
		annotationPath: string;
		relativePath: string;
		tooltip?: string;
		groupLabel?: string;
		group?: string;
		FieldGroupHiddenExpressions?: CompiledBindingToolkitExpression;
		showDataFieldsLabel?: boolean;
		required?: CompiledBindingToolkitExpression;
		isGroupable?: boolean;
		unitText?: string;
		timezoneText?: string;
		timezone?: string;
		semanticObjectPath?: string;
		textArrangement?: {
			textProperty: string;
			mode: DisplayMode;
		};
		additionalPropertyInfos?: string[];
		typeConfig?: PropertyTypeConfig;
		isPartOfLineItem?: boolean; // temporary indicator to only allow filtering on navigation properties when they're part of a line item
		isPartOfCustomColumn?: boolean;
		additionalLabels?: string[];
		exportDataPointTargetValue?: string;
		extension?: ExtensionForAnalytics;
		isMultiValue?: boolean;
		descriptionProperty?: string;
		mode?: DisplayMode;
		valueProperty?: string;
	};

export type ExtensionForAnalytics = PropertyInfo["extension"] & {
	additionalProperties?: string[];
};

export type TableColumn = CustomBasedTableColumn | AnnotationTableColumn | ComputedTableColumn;

type ManifestColumn = CustomElement<CustomBasedTableColumn | AnnotationTableColumnForOverride>;

export enum ColumnType {
	Default = "Default", // Default Type (Custom Column)
	Annotation = "Annotation",
	Slot = "Slot",
	Computed = "Computed"
}
/**
 * Returns an array of all columns, annotation-based as well as manifest-based.
 * They are sorted and some properties can be overwritten via the manifest (check out the keys that can be overwritten).
 * @param lineItemAnnotation Collection of data fields for representation in a table or list
 * @param tableType The type of the table
 * @param visualizationPath
 * @param converterContext
 * @returns Returns all table columns that should be available, regardless of templating or personalization or their origin
 */
export function getTableColumns(
	lineItemAnnotation: LineItem,
	tableType: TableType,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): TableColumn[] {
	const annotationColumns = getColumnsFromAnnotations(lineItemAnnotation, tableType, visualizationPath, converterContext);
	const manifestColumns = getColumnsFromManifest(
		converterContext.getManifestControlConfiguration<TableManifestConfiguration>(visualizationPath).columns ?? {},
		annotationColumns,
		converterContext,
		converterContext.getAnnotationEntityType(lineItemAnnotation)
	);

	const tableColumns: TableColumn[] = insertCustomElements(
		annotationColumns as TableColumn[],
		manifestColumns as Record<string, CustomElement<TableColumn>>,
		{
			width: OverrideType.overwrite,
			widthIncludingColumnHeader: OverrideType.overwrite,
			importance: OverrideType.overwrite,
			horizontalAlign: OverrideType.overwrite,
			availability: OverrideType.overwrite,
			isNavigable: OverrideType.overwrite,
			settings: OverrideType.overwrite,
			formatOptions: OverrideType.overwrite,
			exportSettings: OverrideType.overwrite
		}
	);

	return addComputedColumns(tableColumns, tableType, visualizationPath, converterContext);
}

export function findColumnByPath(path: string, tableColumns: TableColumn[]): TableColumn | undefined {
	return tableColumns.find((column) => {
		const annotationColumn = column as AnnotationTableColumn;
		return annotationColumn.propertyInfos === undefined && annotationColumn.relativePath === path;
	});
}

/**
 * Sets the 'unit', 'textArrangement', 'timezone' and 'exportsettings' properties in columns when necessary.
 * @param converterContext The instance of the converter context
 * @param tableColumns The columns to be updated
 */
export function updateLinkedProperties(converterContext: ConverterContext, tableColumns: TableColumn[]): void {
	const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
	tableColumns.forEach((oColumn) => {
		const tableColumn = oColumn as AnnotationTableColumn;
		if (tableColumn.propertyInfos === undefined && tableColumn.relativePath) {
			const propertyDataModelObjectPath = enhanceDataModelPath<Property>(dataModelObjectPath, tableColumn.relativePath);
			const property = propertyDataModelObjectPath.targetObject;
			if (property) {
				addCurrencyOrUoMToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn);
				const timezoneProperty = getAssociatedTimezoneProperty(property);
				const timezone = property?.annotations?.Common?.Timezone;
				if (timezoneProperty) {
					const oTimezoneColumn = findColumnByPath(timezoneProperty.name, tableColumns);
					tableColumn.timezone = oTimezoneColumn?.name;
				} else if (timezone) {
					tableColumn.timezoneText = timezone.toString();
				}
				addTextArrangentInfoToProperty(property, propertyDataModelObjectPath, tableColumns, tableColumn);
			}
		}
	});
}

/**
 * Adds the "unit" property into the columns when neccesary for columns with unit of measure and currencies.
 * @param property The property referenced on the column
 * @param propertyDataModelObjectPath The property DataModelObjectPath.
 * @param tableColumns The list of columns displayed on the table
 * @param tableColumn The table column which adds the currency or unit
 */
function addCurrencyOrUoMToProperty(
	property: Property,
	propertyDataModelObjectPath: DataModelObjectPath<Property>,
	tableColumns: TableColumn[],
	tableColumn: AnnotationTableColumn
): void {
	const currencyOrUoMProperty = getAssociatedCurrencyPropertyPath(property) || getAssociatedUnitPropertyPath(property);
	if (currencyOrUoMProperty) {
		const currencyOrUoMPropertyDataModelObjectPath = enhanceDataModelPath<Property>(propertyDataModelObjectPath, currencyOrUoMProperty);
		const currencyOrUoMRelativePath = getContextRelativeTargetObjectPath(currencyOrUoMPropertyDataModelObjectPath);
		if (currencyOrUoMRelativePath) {
			const unitColumn = findColumnByPath(currencyOrUoMRelativePath, tableColumns);
			tableColumn.unit = unitColumn?.name;
		}
	} else {
		const unit = property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit;
		if (unit) {
			tableColumn.unitText = `${unit}`;
		}
	}
}

/**
 * Add the "textArrangement" object to columns when necessary for columns containing text, such as descriptions.
 * @param property The property referenced by the column
 * @param propertyDataModelObjectPath The property DataModelObjectPath.
 * @param tableColumns The list of columns displayed on the table
 * @param tableColumn The table column which adds the text
 */
function addTextArrangentInfoToProperty(
	property: Property,
	propertyDataModelObjectPath: DataModelObjectPath<Property>,
	tableColumns: TableColumn[],
	tableColumn: AnnotationTableColumn
): void {
	const displayMode = getDisplayMode(property),
		textPropertyPath = getAssociatedTextPropertyPath(property);
	if (textPropertyPath && displayMode !== "Value") {
		const textPropertyDataModelObjectPath = enhanceDataModelPath<Property>(propertyDataModelObjectPath, textPropertyPath);
		const textRelativePath = getContextRelativeTargetObjectPath(textPropertyDataModelObjectPath);
		if (textRelativePath) {
			const textColumn = findColumnByPath(textRelativePath, tableColumns);
			if (textColumn && textColumn.name !== tableColumn.name) {
				tableColumn.textArrangement = {
					textProperty: textColumn.name,
					mode: displayMode
				};
				// If text properties are used but hidden, we must include them to the export as there are used in the paste
				if (!textColumn.exportSettings) {
					textColumn.exportSettings = { type: "String" };
				}
			}
		}
	}
}

/**
 * Retrieve the columns from the entityType.
 * @param columnsToBeCreated The columns to be created.
 * @param entityType The target entity type.
 * @param annotationColumns The array of columns created based on LineItem annotations.
 * @param converterContext The converter context.
 * @param tableType The table type.
 * @param tableCreationMode The creation mode of the table.
 * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as description on a text arrangement annotation.
 * @param restrictionsOnProperties The existing restrictions on properties
 * @returns The column from the entityType
 */
export const getColumnsFromEntityType = function (
	columnsToBeCreated: Record<string, Property>,
	entityType: EntityType,
	annotationColumns: AnnotationTableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>,
	tableType: TableType,
	tableCreationMode: CreationMode,
	displayModeOfDescriptionPropertiesMap: Record<string, DisplayMode>,
	restrictionsOnProperties?: RestrictionsOnProperties
): AnnotationTableColumn[] {
	if (annotationColumns === undefined) {
		annotationColumns = [];
	}

	let propertiesNotToBeConsidered: string[] = [];
	const aggregationHelper = new AggregationHelper(entityType, converterContext);
	const groupableProperties = aggregationHelper.getGroupableProperties();
	//For Analytical table, we exclude all properties that are not groupable and used as Text in a groupable Property.
	if (tableType === "AnalyticalTable" && aggregationHelper.isAnalyticsSupported() && groupableProperties) {
		propertiesNotToBeConsidered = groupableProperties
			.map((property) => property.$target)
			.filter((target) => target !== undefined)
			.map((target) => getAssociatedTextProperty(target as Property))
			.filter((textProp) => textProp && !aggregationHelper.isPropertyGroupable(textProp))
			.map((prop) => prop?.name)
			.filter((name) => name !== undefined) as string[];
	}
	entityType.entityProperties.forEach((property: Property) => {
		// Catch already existing columns - which were added before by LineItem Annotations
		const exists = annotationColumns.some((column) => {
			return column.name === property.name;
		});
		// if target type exists, it is a complex property and should be ignored
		if (!property.targetType && !exists && !propertiesNotToBeConsidered.includes(property.name)) {
			const relatedPropertiesInfo: ComplexPropertyInfo = collectRelatedProperties(
				property.name,
				property,
				converterContext,
				true,
				tableType
			);
			const relatedPropertyNames: string[] = Object.keys(relatedPropertiesInfo.properties);
			const additionalPropertyNames: string[] = Object.keys(relatedPropertiesInfo.additionalProperties);
			// Include the text properties and their corresponding text arrangement
			relatedPropertyNames.forEach((name) => {
				addPropertyToDisplayModeOfDescriptionPropertiesMap(displayModeOfDescriptionPropertiesMap, relatedPropertiesInfo, name);
			});

			const columnInfo = getColumnDefinitionFromProperty(
				property,
				converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName),
				property.name,
				true,
				true,
				aggregationHelper,
				converterContext,
				displayModeOfDescriptionPropertiesMap,
				restrictionsOnProperties,
				tableCreationMode,
				relatedPropertiesInfo
			);
			if (relatedPropertyNames.length > 0) {
				columnInfo.propertyInfos = relatedPropertyNames;
				if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
					columnInfo.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
				}
				// Collect information of related columns to be created.
				relatedPropertyNames.forEach((name) => {
					columnsToBeCreated[name] = relatedPropertiesInfo.properties[name].annotationProperty;
				});
			}
			// update Property Label when it's referenced only once in a column, new label will be the label of the column
			updatePropertyLabel(annotationColumns, columnsToBeCreated, columnInfo);
			if (additionalPropertyNames.length > 0) {
				columnInfo.additionalPropertyInfos = additionalPropertyNames;
				// Create columns for additional properties identified for ALP use case.
				additionalPropertyNames.forEach((additionalPropertyName) => {
					// Intentional overwrite as we require only one new PropertyInfo for a related Property.
					columnsToBeCreated[additionalPropertyName] = relatedPropertiesInfo.additionalProperties[additionalPropertyName];
				});
			}
			annotationColumns.push(columnInfo);
		}
		// In case a property has defined a #TextOnly text arrangement that points to a text property (and not a 'hard coded text') don't only create the complex property with the text property as a child property,
		// but also the property itself as it can be used as within the sortConditions or on custom columns.
		// This step must be valid also from the columns added via LineItems or from a column available on the p13n.
		if (getDisplayMode(property) === "Description") {
			restrictionsOnProperties?.nonSortableProperties.push(property.name);
			if (isPathAnnotationExpression(property?.annotations?.Common?.Text)) {
				annotationColumns.push(
					getColumnDefinitionFromProperty(
						property,
						converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName),
						property.name,
						false,
						false,
						aggregationHelper,
						converterContext,
						displayModeOfDescriptionPropertiesMap,
						restrictionsOnProperties,
						tableCreationMode
					)
				);
			}
		}
	});
	// Create a propertyInfo for each related property.
	const relatedColumns = _createRelatedColumns(
		columnsToBeCreated,
		annotationColumns,
		converterContext,
		entityType,
		displayModeOfDescriptionPropertiesMap,
		tableCreationMode,
		restrictionsOnProperties
	);
	return annotationColumns.concat(relatedColumns);
};

/**
 * Create a column definition from a property.
 * @param property Entity type property for which the column is created
 * @param fullPropertyPath The full path to the target property
 * @param relativePath The relative path to the target property based on the context
 * @param useDataFieldPrefix Should be prefixed with "DataField::", else it will be prefixed with "Property::"
 * @param availableForAdaptation Decides whether the column should be available for adaptation
 * @param aggregationHelper The aggregationHelper for the entity
 * @param converterContext The converter context
 * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as description on a text arrangement annotation
 * @param restrictionsOnProperties The existing restrictions on properties
 * @param tableCreationMode The creation mode of the table
 * @param relatedPropertiesInfo The properties identified so far for the column
 * @param relativePathForMultiValue The MDC path used for the 1:n property to allow filtering from MDC
 * @returns The annotation column definition
 */
const getColumnDefinitionFromProperty = function (
	property: Property,
	fullPropertyPath: string,
	relativePath: string,
	useDataFieldPrefix: boolean,
	availableForAdaptation: boolean,
	aggregationHelper: AggregationHelper,
	converterContext: ConverterContext<PageContextPathTarget>,
	displayModeOfDescriptionPropertiesMap: Record<string, DisplayMode>,
	restrictionsOnProperties?: RestrictionsOnProperties,
	tableCreationMode?: CreationMode,
	relatedPropertiesInfo?: ComplexPropertyInfo,
	relativePathForMultiValue?: string
): AnnotationTableColumn {
	const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, property);
	const isHidden = isReferencePropertyStaticallyHidden(property);
	const groupPath: string | undefined = property.name ? _sliceAtSlash(property.name, true, false) : undefined;
	const isGroup: boolean = groupPath != property.name;
	const label = getLabel(property, isGroup);
	const dataType = getDataFieldDataType(property);
	const propertyTypeConfig = getTypeConfig(property, dataType);
	const isAPropertyFromTextOnlyAnnotation = displayModeOfDescriptionPropertiesMap[relativePath] === "Description";
	const sortable =
		(!isHidden || isAPropertyFromTextOnlyAnnotation) && !restrictionsOnProperties?.nonSortableProperties.includes(relativePath);
	const filterable = !isAPropertyFromTextOnlyAnnotation && !restrictionsOnProperties?.nonFilterableProperties.includes(relativePath);
	const typeConfig = {
		className: property.type || dataType,
		formatOptions: propertyTypeConfig.formatOptions,
		constraints: propertyTypeConfig.constraints
	};
	let exportSettings: PropertyInfo["exportSettings"] = null;
	if (_isExportableColumn(property)) {
		exportSettings = createColumnExportSettings(property, relatedPropertiesInfo);
	}
	const availability: AvailabilityType =
		!isHidden && (availableForAdaptation || displayModeOfDescriptionPropertiesMap[relativePath]) ? "Adaptation" : "Hidden";
	const collectedNavigationPropertyLabels: string[] | undefined = _getCollectedNavigationPropertyLabels(relativePath, converterContext);
	if (relativePathForMultiValue) {
		relativePath = relativePathForMultiValue;
	}
	const name = useDataFieldPrefix ? relativePath : `Property::${relativePath}`;
	const key = (useDataFieldPrefix ? "DataField::" : "Property::") + replaceSpecialChars(relativePath);

	const column: AnnotationTableColumn = {
		key: key,
		type: ColumnType.Annotation,
		dataType: dataType ?? property.type,
		label: label ?? property.name,
		groupLabel: isGroup ? getLabel(property) : undefined,
		group: isGroup ? groupPath : undefined,
		annotationPath: fullPropertyPath,
		semanticObjectPath: semanticObjectAnnotationPath,
		availability: availability,
		name: name,
		relativePath: relativePath,
		sortable: sortable,
		filterable: filterable,
		isGroupable: aggregationHelper.isAnalyticsSupported() ? !!aggregationHelper.isPropertyGroupable(property) : sortable,
		isKey: property.isKey,
		exportSettings: exportSettings,
		caseSensitive: isFilteringCaseSensitive(converterContext),
		typeConfig: typeConfig as PropertyTypeConfig,
		importance: getImportance(converterContext, property.annotations?.UI?.DataFieldDefault),
		required: isRequiredColumn(converterContext, property, tableCreationMode),
		additionalLabels: collectedNavigationPropertyLabels
	};
	_addToolTip(property, column);
	_setExportSettingsForDataPoint(property, column);

	if (
		aggregationHelper.isAnalyticsSupported() &&
		ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath()) &&
		(relativePath === "HasActiveEntity" || relativePath === "HasDraftEntity" || relativePath === "IsActiveEntity")
	) {
		// In case of analytical table on a draft-enabled entity, we always consider the HasDraftEntity, HasActiveEntity and IsActiveEntity properties as
		// technically groupable, as we need to load them for our internal logic.
		column.extension = {
			technicallyAggregatable: false,
			technicallyGroupable: true
		};
	}
	return column;
};

/**
 * Create the export settings for a given column.
 * @param column The given column from a line item as a data field or a property from the entity type
 * @param relatedPropertiesInfo The related properties linked to the column (named also complex property)
 * @returns The export settings in a the given column
 */
const createColumnExportSettings = function (
	column: Property | DataFieldAbstractTypes,
	relatedPropertiesInfo?: ComplexPropertyInfo
): ColumnExportSettings {
	let unitProperty, timezoneProperty, unitText, timezoneText, utc, isATimezone, currencyProperty, scale;
	const relatedPropertyNames = relatedPropertiesInfo ? Object.keys(relatedPropertiesInfo.properties) : [];
	if (relatedPropertiesInfo && relatedPropertyNames?.length === 1) {
		// Create the export settings of a column based on the related (child) property in case there is only one.
		// This is required when we have a text only annotation to compute the export settings from the text instead of the value
		column = relatedPropertiesInfo.properties[relatedPropertyNames[0]].annotationProperty;
	}
	const dataType = getDataFieldDataType(column);
	if (isProperty(column)) {
		unitProperty = getAssociatedUnitProperty(column);
		currencyProperty = getAssociatedCurrencyProperty(column);
		timezoneProperty = getAssociatedTimezoneProperty(column);
		unitText = getStaticUnitOrCurrency(column);
		timezoneText = getStaticTimezone(column);
		isATimezone = isTimezone(column);
		scale = column.scale;
	}
	unitProperty = relatedPropertiesInfo?.exportSettings?.unitProperty ?? unitProperty?.name ?? currencyProperty?.name;
	timezoneProperty = relatedPropertiesInfo?.exportSettings?.timezoneProperty ?? timezoneProperty?.name;
	scale = relatedPropertiesInfo?.exportSettings?.scale ?? scale;
	const exportType = getExportDataType(dataType, isATimezone, !!currencyProperty, relatedPropertiesInfo?.exportSettings);
	if (timezoneProperty || (exportType === "DateTime" && !timezoneText)) {
		utc = false;
	}
	const exportSettings: ColumnExportSettings = {
		type: exportType,
		inputFormat: getDateInputFormat(dataType),
		delimiter: getDelimiter(dataType),
		scale: scale,
		unitProperty: unitProperty,
		unit: relatedPropertiesInfo?.exportSettings.unit ?? unitText,
		timezoneProperty: timezoneProperty,
		timezone: relatedPropertiesInfo?.exportSettings.timezone ?? timezoneText?.toString(),
		template: relatedPropertiesInfo?.exportSettings.template,
		//only in case of complex properties, wrap the cell content	on the excel exported file
		wrap: relatedPropertiesInfo?.exportSettings.wrap,
		utc: utc
	};
	if (exportSettings.unitProperty || exportSettings.unit) {
		exportSettings.autoScale = true;
	}
	return removeUndefinedFromExportSettings(exportSettings);
};

/**
 * Gets the export format template for columns with dates.
 * @param dataType The data type of the column
 * @returns The inputFormat
 */
const getDateInputFormat = function (dataType?: string): string | undefined {
	return dataType === "Edm.Date" ? "YYYY-MM-DD" : undefined;
};

/**
 * Gets the delimiter in numeric columns.
 * The delimiter is used to display thousands separator in numeric columns.
 * @param dataType The data type of the column
 * @returns True to display thousands separator in numeric columns
 */
const getDelimiter = function (dataType?: string): boolean | undefined {
	return dataType === "Edm.Int64" ? true : undefined;
};

/**
 * Removes undefined values from the export settings object of a column.
 * @param exportSettings The export settings configurations for a column
 * @returns The export settings configurations without undefined values
 */
const removeUndefinedFromExportSettings = function (exportSettings: ColumnExportSettings): ColumnExportSettings {
	//Remove undefined settings from exportSetting object
	for (const setting in exportSettings) {
		if (exportSettings[setting as keyof ColumnExportSettings] === undefined) {
			delete exportSettings[setting as keyof ColumnExportSettings];
		}
	}
	return exportSettings;
};

/**
 * Update property label in case it's only referenced in one column. The label of the column must be used instead of the property label.
 * This update also is applied for the tooltip as it is based on the column's label.
 * @param annotationColumns The array of columns created based on LineItem annotations.
 * @param columnsToBeCreated The columns to be created
 * @param columnInfo The column definition
 * @param columnName The name of the column
 */
function updatePropertyLabel(
	annotationColumns: AnnotationTableColumn[],
	columnsToBeCreated: Record<string, Property>,
	columnInfo: AnnotationTableColumn,
	columnName?: string
): void {
	const linkedAnnotationColumns = annotationColumns.filter(
		(col) => col.propertyInfos?.includes(columnInfo.relativePath) || (columnName && col.propertyInfos?.includes(columnName))
	);
	if (
		linkedAnnotationColumns?.length === 1 &&
		(columnsToBeCreated[columnInfo.relativePath] || (columnName && columnsToBeCreated[columnName])) &&
		linkedAnnotationColumns[0].propertyInfos?.length === 1
	) {
		columnInfo.label = linkedAnnotationColumns[0].label;
		columnInfo.tooltip = linkedAnnotationColumns[0].tooltip;
	}
}

/**
 * Returns Boolean true for exportable columns, false for non exportable columns.
 * @param source The dataField or property to be evaluated
 * @returns True for exportable column, false for non exportable column
 */
function _isExportableColumn(source: DataFieldAbstractTypes | Property): boolean {
	let propertyType, property;
	const dataFieldDefaultProperty = (source as Property).annotations.UI?.DataFieldDefault;
	if (isProperty(source)) {
		if (isReferencePropertyStaticallyHidden(source)) {
			return false;
		}
		propertyType = dataFieldDefaultProperty?.$Type;
	} else if (isReferencePropertyStaticallyHidden(source)) {
		return false;
	} else {
		property = source;
		propertyType = property.$Type;
		if (propertyType === UIAnnotationTypes.DataFieldForAnnotation && (property as DataFieldForAnnotation).Target?.$target?.$Type) {
			//For Chart
			propertyType = (property as DataFieldForAnnotation).Target?.$target?.$Type;
			return propertyType !== undefined && !UIAnnotationTypes.ChartDefinitionType.includes(propertyType);
		} else if (
			(property as DataField).Value?.$target?.annotations?.Core?.MediaType?.term === "Org.OData.Core.V1.MediaType" &&
			(property as DataField).Value?.$target?.annotations?.Core?.isURL !== true
		) {
			//For Stream
			return false;
		}
	}
	return propertyType
		? ![
				UIAnnotationTypes.DataFieldForAction,
				UIAnnotationTypes.DataFieldForIntentBasedNavigation,
				UIAnnotationTypes.DataFieldForActionGroup
		  ].includes(propertyType)
		: true;
}

/**
 * Returns Boolean true for valid columns, false for invalid columns.
 * @param dataField Different DataField types defined in the annotations
 * @returns True for valid columns, false for invalid columns
 */
const _isValidColumn = function (dataField: DataFieldAbstractTypes): boolean {
	switch (dataField.$Type) {
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			return !!dataField.Inline;
		case UIAnnotationTypes.DataFieldWithAction:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldForAnnotation:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
			return true;
		default:
			// Todo: Replace with proper Log statement once available
			//  throw new Error("Unhandled DataField Abstract type: " + dataField.$Type);
			return false;
	}
};

/**
 * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
 *
 * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
 * @param dataFieldModelPath The metapath referring to the annotation that is evaluated by SAP Fiori elements.
 * @returns An expression that you can bind to the UI.
 */
const _getVisibleExpression = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>
): BindingToolkitExpression<boolean> {
	const targetObject = dataFieldModelPath.targetObject;
	let propertyValue;
	if (targetObject) {
		switch (targetObject.$Type) {
			case UIAnnotationTypes.DataField:
			case UIAnnotationTypes.DataFieldWithUrl:
			case UIAnnotationTypes.DataFieldWithNavigationPath:
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldWithAction:
			case UIAnnotationTypes.DataPointType:
				propertyValue = targetObject.Value.$target;
				break;
			case UIAnnotationTypes.DataFieldForAnnotation:
				// if it is a DataFieldForAnnotation pointing to a DataPoint we look at the dataPoint's value
				if (targetObject?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType) {
					propertyValue = targetObject.Target.$target?.Value.$target;
				}
				break;
			case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldForAction:
			default:
				propertyValue = undefined;
		}
	}
	const isAnalyticalGroupHeaderExpanded = /*formatOptions?.isAnalytics ? UI.IsExpanded :*/ constant(false);
	const isAnalyticalLeaf = /*formatOptions?.isAnalytics ? equal(UI.NodeLevel, 0) :*/ constant(false);
	// A data field is visible if:
	// - the UI.Hidden expression in the original annotation does not evaluate to 'true'
	// - the UI.Hidden expression in the target property does not evaluate to 'true'
	// - in case of Analytics it's not visible for an expanded GroupHeader
	return and(
		...[
			not(equal(getExpressionFromAnnotation(targetObject?.annotations?.UI?.Hidden), true)),
			ifElse(
				!!propertyValue,
				propertyValue && not(equal(getExpressionFromAnnotation(propertyValue.annotations?.UI?.Hidden), true)),
				true
			),
			or(not(isAnalyticalGroupHeaderExpanded), isAnalyticalLeaf)
		]
	);
};

/**
 * Returns hidden binding expressions for a field group.
 * @param dataFieldGroup DataField defined in the annotations
 * @returns Compile binding of field group expressions.
 */
const _getFieldGroupHiddenExpressions = function (dataFieldGroup: DataFieldAbstractTypes): CompiledBindingToolkitExpression | undefined {
	const fieldGroupHiddenExpressions: BindingToolkitExpression<boolean>[] = [];
	if (
		dataFieldGroup.$Type === UIAnnotationTypes.DataFieldForAnnotation &&
		dataFieldGroup.Target?.$target?.$Type === UIAnnotationTypes.FieldGroupType
	) {
		if (dataFieldGroup?.annotations?.UI?.Hidden) {
			return compileExpression(not(equal(getExpressionFromAnnotation(dataFieldGroup.annotations.UI.Hidden), true)));
		} else {
			dataFieldGroup.Target.$target.Data?.forEach((innerDataField: DataFieldAbstractTypes | DataPointTypeTypes) => {
				fieldGroupHiddenExpressions.push(
					_getVisibleExpression({ targetObject: innerDataField } as DataModelObjectPath<
						DataFieldAbstractTypes | DataPointTypeTypes
					>)
				);
			});
			return compileExpression(ifElse(or(...fieldGroupHiddenExpressions), constant(true), constant(false)));
		}
	} else {
		return undefined;
	}
};

/**
 * Returns the label for the property and dataField.
 * @param [property] Property, DataField or Navigation Property defined in the annotations
 * @param isGroup
 * @returns Label of the property or DataField
 */
const getLabel = function (property: DataFieldAbstractTypes | Property | NavigationProperty, isGroup = false): string | undefined {
	if (!property) {
		return undefined;
	}
	if (isProperty(property) || isNavigationProperty(property)) {
		const dataFieldDefault = (property as Property).annotations?.UI?.DataFieldDefault;
		if (dataFieldDefault && !dataFieldDefault.qualifier && dataFieldDefault.Label) {
			return dataFieldDefault.Label?.toString();
		}
		return property.annotations.Common?.Label?.toString() ?? property.name;
	} else if (isDataFieldTypes(property)) {
		if (!!isGroup && property.$Type === UIAnnotationTypes.DataFieldWithIntentBasedNavigation) {
			return property?.Label?.toString();
		}
		return (
			property?.Label?.toString() ??
			compileExpression(
				getExpressionFromAnnotation(property.Value?.$target?.annotations?.Common?.Label, [], property.Value?.$target?.name)
			)
		);
	} else if (property.$Type === UIAnnotationTypes.DataFieldForAnnotation) {
		return (
			property.Label?.toString() ??
			compileExpression(
				getExpressionFromAnnotation((property.Target?.$target as DataPoint)?.Value?.$target?.annotations?.Common?.Label?.valueOf())
			)
		);
	} else {
		return property.Label?.toString();
	}
};

const _getTooltip = function (source: DataFieldAbstractTypes | Property): string | undefined {
	if (!source) {
		return undefined;
	}
	if (isProperty(source) || source.annotations?.Common?.QuickInfo) {
		return source.annotations?.Common?.QuickInfo
			? compileExpression(getExpressionFromAnnotation(source.annotations.Common.QuickInfo))
			: undefined;
	} else if (isDataFieldTypes(source)) {
		return source.Value?.$target?.annotations?.Common?.QuickInfo
			? compileExpression(getExpressionFromAnnotation(source.Value.$target.annotations.Common.QuickInfo))
			: undefined;
	} else if (source.$Type === UIAnnotationTypes.DataFieldForAnnotation) {
		const datapointTarget = source.Target?.$target as DataPoint;
		return datapointTarget?.Value?.$target?.annotations?.Common?.QuickInfo
			? compileExpression(getExpressionFromAnnotation(datapointTarget.Value.$target.annotations.Common.QuickInfo))
			: undefined;
	} else {
		return undefined;
	}
};

export function getRowStatusVisibility(colName: string, isSemanticKeyInFieldGroup?: boolean): BindingToolkitExpression<boolean> {
	return formatResult(
		[
			pathInModel(`semanticKeyHasDraftIndicator`, "internal"),
			pathInModel(`filteredMessages`, "internal"),
			colName,
			isSemanticKeyInFieldGroup
		],
		tableFormatters.getErrorStatusTextVisibilityFormatter
	);
}

/**
 * Creates a PropertyInfo for each identified property consumed by a LineItem.
 * @param columnsToBeCreated Identified properties.
 * @param existingColumns The list of columns created for LineItems and Properties of entityType.
 * @param converterContext The converter context.
 * @param entityType The entity type for the LineItem
 * @param displayModeOfDescriptionPropertiesMap The map of properties referenced as text on a text arrangement annotation.
 * @param tableCreationMode The creation mode of the table
 * @param restrictionsOnProperties The existing restrictions on properties
 * @returns The array of columns created.
 */
const _createRelatedColumns = function (
	columnsToBeCreated: Record<string, Property>,
	existingColumns: AnnotationTableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>,
	entityType: EntityType,
	displayModeOfDescriptionPropertiesMap: Record<string, DisplayMode>,
	tableCreationMode?: CreationMode,
	restrictionsOnProperties?: RestrictionsOnProperties
): AnnotationTableColumn[] {
	const relatedColumns: AnnotationTableColumn[] = [];
	const relatedPropertyNameMap: Record<string, string> = {};
	const aggregationHelper = new AggregationHelper(entityType, converterContext);
	Object.keys(columnsToBeCreated).forEach((name) => {
		const property = columnsToBeCreated[name],
			annotationPath = converterContext.getAbsoluteAnnotationPath(name),
			// Check whether the related column already exists.
			relatedColumn = existingColumns.find((column) => column.name === name);
		const dataModelObjectPath = converterContext.getConverterContextFor(converterContext.getContextPath()).getDataModelObjectPath();
		const propertyObjectPath = enhanceDataModelPath<PageContextPathTarget>(dataModelObjectPath, name);
		if (isMultiValueField(propertyObjectPath)) {
			const newNameRelativeTargetPath = getContextRelativeTargetObjectPath(propertyObjectPath, false, true);
			const column = getColumnDefinitionFromProperty(
				property,
				annotationPath,
				name,
				true,
				false,
				aggregationHelper,
				converterContext,
				displayModeOfDescriptionPropertiesMap,
				restrictionsOnProperties,
				tableCreationMode,
				undefined,
				newNameRelativeTargetPath
			);
			computeHiddenOnRelatedColumns(existingColumns, name, column);
			updatePropertyLabel(existingColumns, columnsToBeCreated, column, name);
			relatedColumns.push(column);
			relatedPropertyNameMap[name] = newNameRelativeTargetPath ?? name;
		} else if (relatedColumn === undefined) {
			// Case 1: Key contains DataField prefix to ensure all property columns have the same key format.
			// New created property column is set to hidden.
			const column = getColumnDefinitionFromProperty(
				property,
				annotationPath,
				name,
				true,
				false,
				aggregationHelper,
				converterContext,
				displayModeOfDescriptionPropertiesMap,
				restrictionsOnProperties,
				tableCreationMode
			);
			computeHiddenOnRelatedColumns(existingColumns, name, column);
			updatePropertyLabel(existingColumns, columnsToBeCreated, column);
			relatedColumns.push(column);
		} else if (relatedColumn.annotationPath !== annotationPath || relatedColumn.propertyInfos) {
			// Case 2: The existing column points to a LineItem (or)
			// Case 3: This is a self reference from an existing column
			const newName = `Property::${name}`;
			// Checking whether the related property column has already been created in a previous iteration.
			if (!existingColumns.some((column) => column.name === newName)) {
				// Create a new property column with 'Property::' prefix,
				// Set it to hidden as it is only consumed by Complex property infos.
				const column = getColumnDefinitionFromProperty(
					property,
					annotationPath,
					name,
					false,
					false,
					aggregationHelper,
					converterContext,
					displayModeOfDescriptionPropertiesMap,
					restrictionsOnProperties,
					tableCreationMode
				);
				computeHiddenOnRelatedColumns(existingColumns, name, column);
				updatePropertyLabel(existingColumns, columnsToBeCreated, column);
				relatedColumns.push(column);
				relatedPropertyNameMap[name] = newName;
			} else if (
				existingColumns.some((column) => column.name === newName) &&
				existingColumns.some((column) => column.propertyInfos?.includes(name))
			) {
				relatedPropertyNameMap[name] = newName;
			}
		} else if (
			displayModeOfDescriptionPropertiesMap[name] === "Description" &&
			!relatedColumn.filterable &&
			!restrictionsOnProperties?.nonFilterableProperties.includes(name)
		) {
			// Case 4: The column is a referenced text only property. Set it to hidden, non sortable nor groupable.
			// Case 5: The column isn't already available for filtering as it could be referenced on another column (e.g. text first).
			restrictionsOnProperties?.nonSortableProperties.push(name);
			const column = getColumnDefinitionFromProperty(
				property,
				annotationPath,
				name,
				false,
				false,
				aggregationHelper,
				converterContext,
				{},
				restrictionsOnProperties,
				tableCreationMode
			);
			column.isGroupable = false;
			relatedColumns.push(column);
		}
	});
	// The property 'name' has been prefixed with 'Property::' for uniqueness.
	// Update the same in other propertyInfos[] references which point to this property.
	existingColumns.forEach((column) => {
		column.propertyInfos = column.propertyInfos?.map((propertyInfo) => relatedPropertyNameMap[propertyInfo] ?? propertyInfo);
		column.additionalPropertyInfos = column.additionalPropertyInfos?.map(
			(propertyInfo) => relatedPropertyNameMap[propertyInfo] ?? propertyInfo
		);
	});
	return relatedColumns;
};

/**
 * Getting the Column Name
 * If it points to a DataField with one property or DataPoint with one property, it will use the property name
 * here to be consistent with the existing flex changes.
 * @param dataField Different DataField types defined in the annotations
 * @returns The name of annotation columns
 */
const _getAnnotationColumnName = function (dataField: DataFieldAbstractTypes): string {
	// This is needed as we have flexibility changes already that we have to check against
	if (isDataFieldTypes(dataField) && dataField.Value?.path) {
		return dataField.Value?.path;
	} else if (dataField.$Type === UIAnnotationTypes.DataFieldForAnnotation && (dataField.Target?.$target as DataPoint)?.Value?.path) {
		// This is for removing duplicate properties. For example, 'Progress' Property is removed if it is already defined as a DataPoint
		return (dataField.Target?.$target as DataPoint)?.Value.path;
	} else {
		return KeyHelper.generateKeyFromDataField(dataField);
	}
};

/**
 * Determines if the data field labels have to be displayed in the table.
 * @param fieldGroupName The `DataField` name being processed.
 * @param visualizationPath
 * @param converterContext
 * @returns `showDataFieldsLabel` value from the manifest
 */
const _getShowDataFieldsLabel = function (
	fieldGroupName: string,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): boolean | undefined {
	const columns = converterContext.getManifestControlConfiguration<TableManifestConfiguration>(visualizationPath)?.columns;
	const columnKeys = columns && Object.keys(columns);
	return (
		columnKeys &&
		!!columnKeys.find(function (key: string) {
			return key === fieldGroupName && (columns[key] as CustomDefinedTableColumnForOverride).showDataFieldsLabel;
		})
	);
};

/**
 * Determines the relative path of the property with respect to the root entity.
 * @param dataField The `DataField` being processed.
 * @returns The relative path
 */
const _getRelativePath = function (dataField: DataFieldAbstractTypes): string {
	let relativePath = "";
	switch (dataField.$Type) {
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			relativePath = (dataField as DataField)?.Value?.path;
			break;
		case UIAnnotationTypes.DataFieldForAnnotation:
			relativePath = dataField?.Target?.value;
			break;
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldForActionGroup:
		case UIAnnotationTypes.DataFieldWithActionGroup:
			relativePath = KeyHelper.generateKeyFromDataField(dataField);
			break;
	}
	return relativePath;
};

const _sliceAtSlash = function (path: string, isLastSlash: boolean, isLastPart: boolean): string {
	const iSlashIndex = isLastSlash ? path.lastIndexOf("/") : path.indexOf("/");
	if (iSlashIndex === -1) {
		return path;
	}
	return isLastPart ? path.substring(iSlashIndex + 1, path.length) : path.substring(0, iSlashIndex);
};

/**
 * Determines if the column contains a multi-value field.
 * @param dataField The DataField being processed
 * @param converterContext The converter context
 * @returns True if the DataField corresponds to a multi-value field.
 */
const _isColumnMultiValued = function (
	dataField: DataFieldAbstractTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): boolean {
	if (isDataFieldTypes(dataField) && isPathAnnotationExpression(dataField.Value)) {
		const propertyObjectPath = enhanceDataModelPath<PageContextPathTarget>(
			converterContext.getDataModelObjectPath(),
			dataField.Value.path
		);
		return isMultiValueField(propertyObjectPath);
	} else {
		return false;
	}
};

/**
 * Determine whether a column is sortable.
 * @param dataField The data field being processed
 * @param propertyPath The property path
 * @param nonSortableColumns Collection of non-sortable column names as per annotation
 * @param relatedPropertiesInfo The related properties linked to the column
 * @returns True if the column is sortable
 */
const _isColumnSortable = function (
	dataField: DataFieldAbstractTypes,
	propertyPath: string,
	nonSortableColumns: string[],
	relatedPropertiesInfo: ComplexPropertyInfo
): boolean {
	return (
		!nonSortableColumns.includes(propertyPath) && // Column is not marked as non-sortable via annotation
		(((dataField.$Type === UIAnnotationTypes.DataField || dataField.$Type === UIAnnotationTypes.DataFieldForAnnotation) &&
			Object.keys(relatedPropertiesInfo.properties).some((propName) => {
				const isHidden = isReferencePropertyStaticallyHidden(relatedPropertiesInfo.properties[propName].annotationProperty);
				return !isHidden && !nonSortableColumns.includes(propName);
			})) ||
			dataField.$Type === UIAnnotationTypes.DataFieldWithUrl ||
			dataField.$Type === UIAnnotationTypes.DataFieldWithIntentBasedNavigation ||
			dataField.$Type === UIAnnotationTypes.DataFieldWithAction)
	);
};

/**
 * Returns whether filtering on the table is case sensitive.
 * @param converterContext The instance of the converter context
 * @returns Returns 'false' if FilterFunctions annotation supports 'tolower', else 'true'
 */
export const isFilteringCaseSensitive = function (converterContext: ConverterContext<PageContextPathTarget>): boolean {
	const filterFunctions: FilterFunctions | undefined = _getFilterFunctions(converterContext);
	return ModelHelper.isFilteringCaseSensitive(undefined, filterFunctions);
};

function _getFilterFunctions(ConverterContext: ConverterContext<PageContextPathTarget>): FilterFunctions | undefined {
	const entitySet = ConverterContext.getEntitySet();
	if (TypeGuards.isEntitySet(entitySet)) {
		return (
			entitySet.annotations.Capabilities?.FilterFunctions ??
			ConverterContext.getEntityContainer().annotations.Capabilities?.FilterFunctions
		);
	}
	return undefined;
}

/**
 * Returns default format options for text fields in a table.
 * @param formatOptions
 * @returns Collection of format options with default values
 */
function _getDefaultFormatOptionsForTable(formatOptions: FormatOptionsType | undefined): FormatOptionsType | undefined {
	return formatOptions === undefined
		? undefined
		: {
				textLinesEdit: 4,
				...formatOptions
		  };
}

function _findSemanticKeyValues(semanticKeys: SemanticKey, name: string): { values: string[]; semanticKeyFound: boolean } {
	const aSemanticKeyValues: string[] = [];
	let bSemanticKeyFound = false;
	for (let i = 0; i < semanticKeys.length; i++) {
		aSemanticKeyValues.push(semanticKeys[i].value);
		if (semanticKeys[i].value === name) {
			bSemanticKeyFound = true;
		}
	}
	return {
		values: aSemanticKeyValues,
		semanticKeyFound: bSemanticKeyFound
	};
}

function _findProperties(
	semanticKeyValues: string[],
	fieldGroupProperties: string[]
): { semanticKeyHasPropertyInFieldGroup: boolean; fieldGroupPropertyPath?: string } {
	let semanticKeyHasPropertyInFieldGroup = false;
	let sPropertyPath;
	if (semanticKeyValues && semanticKeyValues.length >= 1 && fieldGroupProperties && fieldGroupProperties.length >= 1) {
		for (let i = 0; i < semanticKeyValues.length; i++) {
			if ([semanticKeyValues[i]].some((tmp) => fieldGroupProperties.includes(tmp))) {
				semanticKeyHasPropertyInFieldGroup = true;
				sPropertyPath = semanticKeyValues[i];
				break;
			}
		}
	}
	return {
		semanticKeyHasPropertyInFieldGroup: semanticKeyHasPropertyInFieldGroup,
		fieldGroupPropertyPath: sPropertyPath
	};
}

/**
 * Find the first property in the fieldGroup that is part of the semantic keys.
 * @param dataFieldGroup
 * @param semanticKeyValues
 * @returns An object containing a flag true if a property is found and a propertyPath.
 */
function _findSemanticKeyValuesInFieldGroup(
	dataFieldGroup: DataFieldAbstractTypes | null,
	semanticKeyValues: string[]
): { semanticKeyHasPropertyInFieldGroup: boolean; propertyPath?: string } {
	// this info is used in FieldHelper#isDraftIndicatorVisibleInFieldGroup to show a draft indicator at the end of a field group
	const aProperties: string[] = [];
	let _propertiesFound: { semanticKeyHasPropertyInFieldGroup: boolean; fieldGroupPropertyPath?: string } = {
		semanticKeyHasPropertyInFieldGroup: false,
		fieldGroupPropertyPath: undefined
	};
	if (
		dataFieldGroup &&
		dataFieldGroup.$Type === UIAnnotationTypes.DataFieldForAnnotation &&
		dataFieldGroup.Target?.$target?.$Type === UIAnnotationTypes.FieldGroupType
	) {
		dataFieldGroup.Target.$target.Data?.forEach((innerDataField: DataFieldAbstractTypes) => {
			if (
				(innerDataField.$Type === UIAnnotationTypes.DataField || innerDataField.$Type === UIAnnotationTypes.DataFieldWithUrl) &&
				innerDataField.Value
			) {
				aProperties.push(innerDataField.Value.path);
			}
			_propertiesFound = _findProperties(semanticKeyValues, aProperties);
		});
	}
	return {
		semanticKeyHasPropertyInFieldGroup: _propertiesFound.semanticKeyHasPropertyInFieldGroup,
		propertyPath: _propertiesFound.fieldGroupPropertyPath
	};
}

/**
 * Returns default format options with draftIndicator for a column.
 * @param name
 * @param semanticKeys
 * @param dataFieldGroup
 * @returns Collection of format options with default values
 */
function getDefaultDraftIndicatorForColumn(
	name: string,
	semanticKeys: SemanticKey,
	dataFieldGroup: DataFieldAbstractTypes | null
): Partial<{
	fieldGroupDraftIndicatorPropertyPath: string;
	fieldGroupName: string;
	showErrorObjectStatus: CompiledBindingToolkitExpression;
	hasDraftIndicator: boolean;
}> {
	if (!semanticKeys) {
		return {};
	}
	const semanticKey = _findSemanticKeyValues(semanticKeys, name);
	const semanticKeyInFieldGroup = _findSemanticKeyValuesInFieldGroup(dataFieldGroup, semanticKey.values);
	if (semanticKeyInFieldGroup.semanticKeyHasPropertyInFieldGroup) {
		// Semantic Key has a property in a FieldGroup
		return {
			//TODO we should rather store hasSemanticKeyInFieldGroup
			fieldGroupDraftIndicatorPropertyPath: semanticKeyInFieldGroup.propertyPath,
			fieldGroupName: name,
			showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, true))
		};
	} else if (semanticKey.semanticKeyFound) {
		return {
			hasDraftIndicator: true,
			showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, false))
		};
	}
	return {};
}

function _getImpNumber(dataField: DataFieldTypes): number {
	const importance = dataField?.annotations?.UI?.Importance as string;
	if (importance && importance.includes("UI.ImportanceType/High")) {
		return 3;
	}
	if (importance && importance.includes("UI.ImportanceType/Medium")) {
		return 2;
	}
	if (importance && importance.includes("UI.ImportanceType/Low")) {
		return 1;
	}
	return 0;
}

function _getDataFieldImportance(dataField: DataFieldTypes): Importance {
	const importance = dataField?.annotations?.UI?.Importance as string;
	return importance ? (importance.split("/")[1] as Importance) : Importance.None;
}

/**
 * Sets the export settings of a column containing datapoints.
 * @param property The property referenced on a given column
 * @param column The column to be updated
 */
function _setExportSettingsForDataPoint(property: Property, column: AnnotationTableColumn): void {
	const targetValuefromDP = getTargetValueOnDataPoint(property);
	if (
		isDataPointFromDataFieldDefault(property) &&
		typeof targetValuefromDP === "string" &&
		column.exportSettings &&
		column.exportSettings?.unit !== "%"
	) {
		column.exportDataPointTargetValue = targetValuefromDP;
		column.exportSettings.template = "{0}/" + targetValuefromDP;
	}
}

function _getMaxImportance(fields: DataFieldTypes[]): Importance {
	if (fields && fields.length > 0) {
		let maxImpNumber = -1;
		let impNumber = -1;
		let DataFieldWithMaxImportance;
		for (const field of fields) {
			impNumber = _getImpNumber(field);
			if (impNumber > maxImpNumber) {
				maxImpNumber = impNumber;
				DataFieldWithMaxImportance = field;
			}
		}
		return _getDataFieldImportance(DataFieldWithMaxImportance as DataFieldTypes);
	}
	return Importance.None;
}

/**
 * Returns the importance value for a column.
 * @param converterContext
 * @param dataField
 * @returns The importance value
 */
export function getImportance(
	converterContext: ConverterContext<PageContextPathTarget>,
	dataField: DataFieldAbstractTypes | undefined
): Importance | undefined {
	if (!dataField) {
		return undefined;
	}
	const semanticKeys = converterContext.getDataModelObjectPath().targetEntityType.annotations.Common?.SemanticKey ?? [];
	const requiredProperties = getRequiredProperties(converterContext);
	const highKeys = [...semanticKeys, ...requiredProperties].map((propertyPath) => propertyPath.$target?.fullyQualifiedName);
	//Evaluate default Importance is not set explicitly
	let fieldsWithImportance;
	if (isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation)) {
		const dataFieldTarget = dataField.Target.$target;
		if (isAnnotationOfType<FieldGroup>(dataFieldTarget, UIAnnotationTypes.FieldGroupType)) {
			const fieldGroupData = dataFieldTarget.Data;
			//If a FieldGroup contains a semanticKey or required property, importance set to High
			if (
				fieldGroupData.some(function (fieldGroupDataField: DataFieldAbstractTypes): boolean {
					return (
						isDataFieldTypes(fieldGroupDataField) && highKeys.includes(fieldGroupDataField.Value?.$target?.fullyQualifiedName)
					);
				})
			) {
				return Importance.High;
			} else {
				//If the DataFieldForAnnotation has an Importance we take it
				if (dataField?.annotations?.UI?.Importance) {
					return _getDataFieldImportance(dataField as unknown as DataFieldTypes);
				}
				// else the highest importance (if any) is returned
				fieldsWithImportance = fieldGroupData.filter(function (item) {
					return item?.annotations?.UI?.Importance;
				});
				return _getMaxImportance(fieldsWithImportance as DataFieldTypes[]);
			}
		}
	}
	return highKeys.includes((dataField as DataFieldTypes).Value?.$target?.fullyQualifiedName)
		? Importance.High
		: _getDataFieldImportance(dataField as unknown as DataFieldTypes);
}

/**
 * Returns line items from metadata annotations.
 * @param lineItemAnnotation Collection of data fields with their annotations
 * @param tableType The table type
 * @param visualizationPath The visualization path
 * @param converterContext The converter context
 * @returns The columns from the annotations
 */
const getColumnsFromAnnotations = function (
	lineItemAnnotation: LineItem,
	tableType: TableType,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): AnnotationTableColumn[] {
	const entityType: EntityType = converterContext.getAnnotationEntityType(lineItemAnnotation),
		annotationColumns: AnnotationTableColumn[] = [],
		columnsToBeCreated: Record<string, Property> = {},
		displayModeOfDescriptionPropertiesMap: Record<string, DisplayMode> = {},
		restrictionsOnProperties = getRestrictionsOnProperties(converterContext),
		tableManifestSettings: TableManifestConfiguration = converterContext.getManifestControlConfiguration(visualizationPath),
		defaultCreationMode =
			converterContext.getManifestWrapper().getSapFeManifestConfiguration()?.macros?.table?.defaultCreationMode ===
			"InlineCreationRows"
				? CreationMode.InlineCreationRows
				: undefined,
		tableCreationMode: CreationMode =
			tableManifestSettings?.tableSettings?.creationMode?.name ?? defaultCreationMode ?? CreationMode.Inline;
	const semanticKeys: SemanticKey = converterContext.getAnnotationsByTerm("Common", CommonAnnotationTerms.SemanticKey, [
		converterContext.getEntityType()
	])[0] as SemanticKey;
	if (lineItemAnnotation) {
		const tableConverterContext = converterContext.getConverterContextFor<PageContextPathTarget>(
			getTargetObjectPath(converterContext.getDataModelObjectPath())
		);
		lineItemAnnotation.forEach((dataField) => {
			// TODO: variable name should be datafield and not lineItem
			if (!_isValidColumn(dataField)) {
				return;
			}
			let exportSettings: PropertyInfo["exportSettings"] = null;
			const semanticObjectAnnotationPath =
				isDataFieldTypes(dataField) && dataField.Value?.$target?.fullyQualifiedName
					? getSemanticObjectPath(converterContext, dataField)
					: undefined;
			const relativePath = _getRelativePath(dataField);
			// Determine properties which are consumed by this LineItem.
			const relatedPropertiesInfo: ComplexPropertyInfo = collectRelatedPropertiesRecursively(dataField, converterContext, tableType);
			const relatedPropertyNames: string[] = Object.keys(relatedPropertiesInfo.properties);
			const additionalPropertyNames: string[] = Object.keys(relatedPropertiesInfo.additionalProperties);
			const groupPath: string | undefined = relativePath ? _sliceAtSlash(relativePath, true, false) : undefined;
			const isGroup: boolean = groupPath != relativePath;
			const label = getLabel(dataField, isGroup);
			const name = _getAnnotationColumnName(dataField);
			const isFieldGroupColumn: boolean = groupPath ? groupPath.includes(`@${UIAnnotationTerms.FieldGroup}`) : false;
			const showDataFieldsLabel: boolean | undefined = isFieldGroupColumn
				? _getShowDataFieldsLabel(name, visualizationPath, converterContext)
				: false;
			const dataType: string | undefined = getDataFieldDataType(dataField);
			const formatOptions = _getDefaultFormatOptionsForTable(getDefaultDraftIndicatorForColumn(name, semanticKeys, dataField));
			const propertyDataModelObjectPath = enhanceDataModelPath<DataFieldAbstractTypes>(
				converterContext.getDataModelObjectPath(),
				relativePath
			);
			// Determine if we need a situations indicator
			const navigationProperties: NavigationProperty[] = propertyDataModelObjectPath.targetEntityType.navigationProperties;
			const situationsNavProps = navigationProperties.filter(
				(navigationProperty) =>
					!navigationProperty.isCollection &&
					navigationProperty.targetType.annotations.Common?.SAPObjectNodeType?.Name === "BusinessSituation"
			);
			const situationsNavProp: NavigationProperty | undefined = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;
			if (situationsNavProp && formatOptions) {
				formatOptions.hasSituationsIndicator = true;
			}

			let fieldGroupHiddenExpressions: CompiledBindingToolkitExpression;
			if (
				dataField.$Type === UIAnnotationTypes.DataFieldForAnnotation &&
				dataField.Target?.$target?.$Type === UIAnnotationTypes.FieldGroupType
			) {
				fieldGroupHiddenExpressions = _getFieldGroupHiddenExpressions(dataField);
			}
			const isMultiValue = _isColumnMultiValued(dataField, tableConverterContext);
			if (!isMultiValue && _isExportableColumn(dataField)) {
				//exclude the types listed above for the Export (generates error on Export as PDF)
				exportSettings = createColumnExportSettings(dataField, relatedPropertiesInfo);
			}
			let propertyTypeConfig: PropertyTypeConfig | undefined;
			if (dataType) {
				propertyTypeConfig = getTypeConfig(dataField, dataType);
			}
			const typeConfig: PropertyTypeConfig = {
				className: dataType as keyof typeof DefaultTypeForEdmType,
				formatOptions: {
					...formatOptions,
					...propertyTypeConfig?.formatOptions
				},
				constraints: { ...propertyTypeConfig?.constraints }
			};
			const visualSettings: VisualSettings = {};
			if (!dataType || !typeConfig) {
				// for charts
				visualSettings.widthCalculation = null;
			}
			const sortable =
				!isMultiValue &&
				_isColumnSortable(dataField, relativePath, restrictionsOnProperties.nonSortableProperties, relatedPropertiesInfo);
			const availability = isReferencePropertyStaticallyHidden(dataField) ? "Hidden" : "Default";
			const column: AnnotationTableColumn = {
				key: KeyHelper.generateKeyFromDataField(dataField),
				type: ColumnType.Annotation,
				label: label ?? name,
				groupLabel: isGroup ? getLabel(dataField) : undefined,
				group: isGroup ? groupPath : undefined,
				FieldGroupHiddenExpressions: fieldGroupHiddenExpressions,
				annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
				semanticObjectPath: semanticObjectAnnotationPath,
				availability: availability,
				name: name,
				showDataFieldsLabel: showDataFieldsLabel,
				required: isRequiredColumn(converterContext, dataField as DataFieldTypes, tableCreationMode),
				relativePath: relativePath,
				sortable: sortable,
				propertyInfos: relatedPropertyNames.length ? relatedPropertyNames : undefined,
				additionalPropertyInfos: additionalPropertyNames.length > 0 ? additionalPropertyNames : undefined,
				exportSettings: exportSettings,
				width: (dataField.annotations?.HTML5?.CssDefaults?.width?.valueOf() as string) || undefined,
				importance: getImportance(converterContext, dataField as DataFieldTypes),
				isNavigable: true,
				formatOptions: formatOptions,
				caseSensitive: isFilteringCaseSensitive(converterContext),
				typeConfig: typeConfig,
				visualSettings: visualSettings as PropertyInfo["visualSettings"],
				timezoneText: exportSettings?.timezone,
				isPartOfLineItem: true,
				dataType: dataType ?? ("Edm.String" as keyof typeof DefaultTypeForEdmType),
				isMultiValue
			};
			const tooltip = _getTooltip(dataField) ?? label;
			if (tooltip) {
				column.tooltip = tooltip;
			}
			if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
				column.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
			}
			annotationColumns.push(column);
			// Collect information of related columns to be created.
			relatedPropertyNames.forEach((relatedPropertyName) => {
				columnsToBeCreated[relatedPropertyName] = relatedPropertiesInfo.properties[relatedPropertyName].annotationProperty;
				// In case of a multi-value, related properties cannot be sorted as we go through a 1-n relation
				if (isMultiValue) {
					restrictionsOnProperties.nonSortableProperties.push(relatedPropertyName);
				}
				addPropertyToDisplayModeOfDescriptionPropertiesMap(
					displayModeOfDescriptionPropertiesMap,
					relatedPropertiesInfo,
					relatedPropertyName
				);
				// In case the lineItem points to a navigation property with a textArrangement TextOnly, we need to create the column with the value navigation property.
				// The text property is referenced on the related properties of the lineItem, so will be created on the _createRelatedColumns method.
				if (relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription === "Description") {
					createPropertyAnnotatedTextOnly(
						converterContext,
						propertyDataModelObjectPath,
						dataField,
						columnsToBeCreated,
						relativePath,
						restrictionsOnProperties
					);
				}
			});
			// Create columns for additional properties identified for ALP use case.
			additionalPropertyNames.forEach((additionalPropertyName) => {
				// Intentional overwrite as we require only one new PropertyInfo for a related Property.
				columnsToBeCreated[additionalPropertyName] = relatedPropertiesInfo.additionalProperties[additionalPropertyName];
			});
		});
	}
	// Get columns from the Properties of EntityType
	return getColumnsFromEntityType(
		columnsToBeCreated,
		entityType,
		annotationColumns,
		converterContext,
		tableType,
		tableCreationMode,
		displayModeOfDescriptionPropertiesMap,
		restrictionsOnProperties
	);
};

/**
 * Gets the property names from the manifest and checks against existing properties already added by annotations.
 * If a not yet stored property is found it adds it for sorting and filtering only to the annotationColumns.
 * @param properties
 * @param annotationColumns
 * @param converterContext
 * @param entityType
 * @returns The columns from the annotations
 */
const _getPropertyNames = function (
	properties: string[] | string | undefined,
	annotationColumns: AnnotationTableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>,
	entityType: EntityType
): string[] | undefined {
	let matchedProperties: string[] | undefined;
	if (Array.isArray(properties)) {
		matchedProperties = properties.map(function (propertyPath) {
			const annotationColumn = annotationColumns.find(function (annotationColumn) {
				return annotationColumn.relativePath === propertyPath && annotationColumn.propertyInfos === undefined;
			});
			if (annotationColumn) {
				return annotationColumn.name;
			} else {
				const relatedColumns = _createRelatedColumns(
					{ [propertyPath]: entityType.resolvePath(propertyPath) },
					annotationColumns,
					converterContext,
					entityType,
					{}
				);
				annotationColumns.push(relatedColumns[0]);
				return relatedColumns[0].name;
			}
		});
	}
	return matchedProperties;
};

/**
 * Determines if the field group has to be flagged as required.
 * @param converterContext The converter context
 * @param fieldGroup The fieldGroup being processed
 * @param tableCreationMode The creation mode of the underlying table
 * @returns True if the fieldGroup is required.
 */
const isRequiredFieldGroup = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	fieldGroup: FieldGroup,
	tableCreationMode: CreationMode
): boolean {
	const fieldGroupData = fieldGroup.Data;
	return fieldGroupData.some(function (item) {
		// we exclude boolean type, the end-user may want to keep the underlying check box empty on purpose
		if (isDataField(item) && item?.Value?.$target.type !== "Edm.Boolean") {
			return (
				isStaticallyMandatory(item) ||
				(tableCreationMode === CreationMode.InlineCreationRows &&
					isAnnotatedRequiredProperty(item.Value.$target.fullyQualifiedName, converterContext))
			);
		}
	});
};

/**
 * Determines if the dataFieldForAnnotation has to be flagged as required.
 * @param converterContext The converter context
 * @param dataFieldForAnnotation The property being processed
 * @param tableCreationMode The creation mode of the underlying table
 * @returns True if the property is required.
 */
const isRequiredDataFieldForAnnotation = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	dataFieldForAnnotation: DataFieldForAnnotation,
	tableCreationMode: CreationMode
): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	const DataFieldForAnnotationFieldControlNotMandatory = hasFieldControlNotMandatory(dataFieldForAnnotation);
	// Check if the DataFieldForAnnotation points to a FieldGroup
	if (hasFieldGroupTarget(dataFieldForAnnotation)) {
		if (isRequiredFieldGroup(converterContext, dataFieldTarget as FieldGroup, tableCreationMode)) {
			return true;
		}
		const fieldGroupData = (dataFieldTarget as FieldGroup).Data;
		return fieldGroupData.some((innerDataField: DataFieldAbstractTypes) => {
			return isRequiredColumn(converterContext, innerDataField, tableCreationMode);
		});
	}
	/*If the underlying datapoint is a rating indicator, the end-user may want to keep the rating empty (value 0) on purpose.
	Besides, currently, only a fieldControl set on a dataFieldForAnnotation pointing to a dataPoint has an influence in the table.
	Accordingly, if a datapoint comes from a dataFieldForAnnotation with a fieldControl set as not mandatory, this dataPoint must not be flagged as "required"*/
	if (hasDataPointTarget(dataFieldForAnnotation) && (dataFieldTarget as DataPoint).Visualization !== "UI.VisualizationType/Rating") {
		if (DataFieldForAnnotationFieldControlNotMandatory) {
			return false;
		}
		if (isStaticallyMandatory(dataFieldForAnnotation)) {
			return true;
		}
		return isRequiredDataPoint(converterContext, dataFieldTarget as DataPoint, tableCreationMode);
	}
	return false;
};

/**
 * Determines if the property has to be flagged as required.
 * @param converterContext The converter context
 * @param property The property being processed
 * @param tableCreationMode The creation mode of the underlying table
 * @returns True if the property is required.
 */
const isRequiredProperty = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	property: Property,
	tableCreationMode: CreationMode
): boolean {
	return (
		property.type !== "Edm.Boolean" &&
		!isRatingVisualizationFromDataFieldDefault(property) &&
		(isStaticallyMandatory(property) ||
			(tableCreationMode === CreationMode.InlineCreationRows &&
				isAnnotatedRequiredProperty(property.fullyQualifiedName, converterContext)))
	);
};

/**
 * Determines if the dataPoint has to be flagged as required.
 * @param converterContext The converter context
 * @param dataPoint The dataPoint being processed
 * @param tableCreationMode The creation mode of the underlying table
 * @returns True if the dataPoint is required.
 */
const isRequiredDataPoint = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	dataPoint: DataPoint,
	tableCreationMode: CreationMode
): boolean {
	return (
		isStaticallyMandatory(dataPoint) ||
		(tableCreationMode === CreationMode.InlineCreationRows &&
			isAnnotatedRequiredProperty(dataPoint.Value.$target.fullyQualifiedName, converterContext))
	);
};

/**
 * Determines if the underlying column has to be flagged as required.
 * @param converterContext The converter context
 * @param target The target being processed
 * @param tableCreationMode The creation mode of the underlying table
 * @returns The binding expression for the 'required' property of the table column.
 */
const isRequiredColumn = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	target: DataFieldAbstractTypes | Property,
	tableCreationMode?: CreationMode
): CompiledBindingToolkitExpression {
	const creationMode = tableCreationMode || CreationMode.Inline;
	if (
		converterContext.getTemplateType() === TemplateType.ListReport ||
		converterContext.getTemplateType() === TemplateType.AnalyticalListPage
	) {
		return undefined;
	}
	if (isProperty(target)) {
		return isRequiredProperty(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
	}
	// Check if the dataField is of type DataFieldForAnnotation
	if (isDataFieldForAnnotation(target)) {
		return isRequiredDataFieldForAnnotation(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
	}
	//If the underlying property is a boolean, the end-user may want to keep the check box empty on purpose
	if (isDataField(target) && target.Value?.$target?.type !== "Edm.Boolean") {
		return isStaticallyMandatory(target) ||
			(creationMode === CreationMode.InlineCreationRows &&
				isAnnotatedRequiredProperty(target.Value.$target.fullyQualifiedName, converterContext))
			? compileExpression(UI.IsEditable)
			: undefined;
	}
	return undefined;
};

const _appendCustomTemplate = function (
	properties: string[] | undefined,
	exportProperties: string[] | string | undefined
): string | undefined {
	if (Array.isArray(exportProperties)) {
		properties = exportProperties;
	}
	if (properties) {
		return properties
			.map((property) => {
				return `{${properties!.indexOf(property)}}`;
			})
			.join(`${"\n"}`);
	}
	return undefined;
};

/**
 * Returns table column definitions from manifest.
 *
 * These may be custom columns defined in the manifest, slot columns coming through
 * a building block, or annotation columns to overwrite annotation-based columns.
 * @param columns
 * @param annotationColumns
 * @param converterContext
 * @param entityType
 * @returns The columns from the manifest
 */
const getColumnsFromManifest = function (
	columns: Record<string, CustomDefinedTableColumn | CustomDefinedTableColumnForOverride>,
	annotationColumns: AnnotationTableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>,
	entityType: EntityType
): Record<string, ManifestColumn> {
	const internalColumns: Record<string, ManifestColumn> = {};
	function isColumnOverride(
		column: CustomDefinedTableColumn | CustomDefinedTableColumnForOverride,
		key: string
	): column is CustomDefinedTableColumnForOverride {
		return annotationColumns.some((annotationColumn) => annotationColumn.key === key);
	}
	function isSlotColumn(manifestColumn: CustomDefinedTableColumn): manifestColumn is FragmentDefinedSlotColumn {
		return manifestColumn.type === ColumnType.Slot;
	}
	function isCustomColumn(manifestColumn: CustomDefinedTableColumn): manifestColumn is ManifestDefinedCustomColumn {
		return manifestColumn.type === undefined && !!manifestColumn.template;
	}
	function _updateLinkedPropertiesOnCustomColumns(propertyInfos: string[], annotationTableColumns: AnnotationTableColumn[]): void {
		const restrictionsOnProperties = getRestrictionsOnProperties(converterContext);
		propertyInfos.forEach((property) => {
			annotationTableColumns.forEach((prop) => {
				if (prop.name === property) {
					prop.sortable = !restrictionsOnProperties.nonSortableProperties.includes(property.replace("Property::", ""));
					prop.isGroupable = prop.sortable;
					prop.filterable = !restrictionsOnProperties.nonFilterableProperties.includes(property.replace("Property::", ""));
					prop.isPartOfCustomColumn = true;
				}
			});
		});
	}
	for (const key in columns) {
		const manifestColumn = columns[key];
		KeyHelper.validateKey(key);
		// BaseTableColumn
		const baseTableColumn = {
			key: key,
			widthIncludingColumnHeader: manifestColumn.widthIncludingColumnHeader,
			width: manifestColumn.width || undefined,
			position: {
				anchor: manifestColumn.position?.anchor,
				placement: manifestColumn.position === undefined ? Placement.After : manifestColumn.position.placement
			},
			caseSensitive: isFilteringCaseSensitive(converterContext)
		};
		if (isColumnOverride(manifestColumn, key)) {
			const propertiesToOverwriteAnnotationColumn: CustomElement<AnnotationTableColumnForOverride> = {
				...baseTableColumn,
				importance: manifestColumn?.importance,
				horizontalAlign: manifestColumn?.horizontalAlign,
				availability: manifestColumn?.availability,
				type: ColumnType.Annotation,
				isNavigable: undefined,
				settings: manifestColumn.settings,
				formatOptions: _getDefaultFormatOptionsForTable(manifestColumn.formatOptions),
				exportSettings: getCustomExportSettings(
					manifestColumn?.exportSettings,
					annotationColumns,
					converterContext,
					entityType,
					undefined,
					key
				)
			};
			internalColumns[key] = propertiesToOverwriteAnnotationColumn;
		} else {
			const propertyInfos: string[] | undefined = _getPropertyNames(
				manifestColumn.properties,
				annotationColumns,
				converterContext,
				entityType
			);
			const tooltipText = converterContext.fetchTextFromMetaModel(manifestColumn.tooltip),
				headerText = converterContext.fetchTextFromMetaModel(manifestColumn.header);

			const customColumnExportSettings: ColumnExportSettings | null = propertyInfos
				? getCustomExportSettings(manifestColumn?.exportSettings, annotationColumns, converterContext, entityType, propertyInfos)
				: null;
			const baseManifestColumn = {
				...baseTableColumn,
				header: headerText,
				importance: manifestColumn?.importance || Importance.None,
				horizontalAlign: manifestColumn?.horizontalAlign || HorizontalAlign.Begin,
				availability: manifestColumn?.availability || "Default",
				template: manifestColumn.template,
				propertyInfos: propertyInfos,
				exportSettings: customColumnExportSettings,
				id: `CustomColumn::${key}`,
				name: `CustomColumn::${key}`,
				//Needed for MDC:
				formatOptions: { textLinesEdit: 4 },
				isGroupable: false,
				isNavigable: false,
				sortable: false,
				visualSettings: { widthCalculation: null },
				tooltip: tooltipText ? tooltipText : headerText,
				properties: manifestColumn.properties,
				required:
					manifestColumn.required &&
					converterContext.getTemplateType() !== TemplateType.ListReport &&
					converterContext.getTemplateType() !== TemplateType.AnalyticalListPage
						? compileExpression(UI.IsEditable)
						: undefined
			};
			if (propertyInfos) {
				_updateLinkedPropertiesOnCustomColumns(propertyInfos, annotationColumns);
			}
			if (isSlotColumn(manifestColumn)) {
				const customTableColumn: CustomElement<CustomBasedTableColumn> = {
					...baseManifestColumn,
					type: ColumnType.Slot
				};
				internalColumns[key] = customTableColumn;
			} else if (isCustomColumn(manifestColumn)) {
				const customTableColumn: CustomElement<CustomBasedTableColumn> = {
					...baseManifestColumn,
					type: ColumnType.Default
				};
				internalColumns[key] = customTableColumn;
			} else {
				const message = `The annotation column '${key}' referenced in the manifest is not found`;
				converterContext
					.getDiagnostics()
					.addIssue(
						IssueCategory.Manifest,
						IssueSeverity.Low,
						message,
						IssueCategoryType,
						IssueCategoryType?.AnnotationColumns?.InvalidKey
					);
			}
		}
	}
	return internalColumns;
};

/**
 * Adds computed columns such as the draft status and situations status.
 * @param tableColumns The table columns collected so far
 * @param tableType The table type
 * @param visualizationPath
 * @param converterContext
 * @returns The enriched set of table columns
 */
export function addComputedColumns(
	tableColumns: TableColumn[],
	tableType: TableType,
	visualizationPath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): TableColumn[] {
	if (!["GridTable", "TreeTable", "AnalyticalTable"].includes(tableType)) {
		// Computed columns are not used in Responsive tables
		return tableColumns;
	}

	// In case a grid table or tree table is used, we display the situations indicator in a separate column
	// so we have to disable it here to ensure, that the field building block
	// does not render it into the ID column
	const columnWithSituationsIndicator: TableColumn | undefined = tableColumns.find(
		(column) => column.formatOptions?.hasSituationsIndicator !== undefined && column.formatOptions?.hasSituationsIndicator === true
	);
	if (columnWithSituationsIndicator?.formatOptions) {
		// Switch off the situations indicator in the found column
		columnWithSituationsIndicator.formatOptions.hasSituationsIndicator = false;

		// Insert a separate situations indicator column
		const situationsIndicatorColumn: ComputedTableColumn = {
			key: "situationsIndicator",
			name: "situationsIndicator",
			propertyKey: columnWithSituationsIndicator.name,
			isSituationsIndicator: true,
			availability: "Default",
			label: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
			tooltip: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
			type: ColumnType.Computed,
			formatOptions: null,
			exportSettings: null,
			clipboardSettings: null,
			propertyInfos: undefined,
			caseSensitive: false
		};

		// Place the draft status column after the first visible column
		const indexOfFirstVisibleColumn: int = tableColumns.findIndex((column) => column.availability !== "Hidden");
		tableColumns.splice(indexOfFirstVisibleColumn + 1, 0, situationsIndicatorColumn);
	}

	// In case a grid table or tree table is used, we display the draft indicator in a separate column
	// so we have to disable it here to ensure, that the field building block
	// does not render it into the ID column
	// The additional column is only added for tables on a LR and in case tehe entity is draft enabled!
	const columnsWithDraftIndicator: TableColumn[] = tableColumns.filter((column) => column.formatOptions?.hasDraftIndicator === true);
	if (
		columnsWithDraftIndicator.length &&
		converterContext.getTemplateType() === TemplateType.ListReport &&
		(ModelHelper.isDraftNode(converterContext.getEntitySet()) || ModelHelper.isDraftRoot(converterContext.getEntitySet()))
	) {
		// Switch off the draft indicator in the found column
		columnsWithDraftIndicator.forEach((columnWithDraftIndicator: TableColumn) => {
			if (columnWithDraftIndicator?.formatOptions) {
				columnWithDraftIndicator.formatOptions.hasDraftIndicator = false;
			}
		});

		// Insert a separate draft indicator column
		const draftIndicatorColumn: ComputedTableColumn = {
			key: "draftStatus",
			name: "draftStatus",
			propertyKey: columnsWithDraftIndicator[0].name,
			isDraftIndicator: true,
			availability: "Default",
			label: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
			tooltip: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
			type: ColumnType.Computed,
			formatOptions: null,
			exportSettings: null,
			caseSensitive: false
		};
		let columnIndexToInsertAfter: int = 0;
		if (columnWithSituationsIndicator) {
			// If there's a situations indicator column, place the draft status column before it
			columnIndexToInsertAfter =
				tableColumns.findIndex((column) => (column as ComputedTableColumn).isSituationsIndicator === true) - 1;
		} else {
			// Otherwise place the draft status column after the first visible column
			columnIndexToInsertAfter = tableColumns.findIndex((column) => column.availability !== "Hidden");
		}
		tableColumns.splice(columnIndexToInsertAfter + 1, 0, draftIndicatorColumn);
	}

	return tableColumns;
}

/**
 * Provides the required properties set on the annotations.
 * @param converterContext  The instance of the converter context
 * @returns The paths of the restricted properties
 */
export function getRequiredProperties(converterContext: ConverterContext<PageContextPathTarget>): PropertyPath[] {
	return getContextPropertyRestriction(
		converterContext.getDataModelObjectPath(),
		(capabilities) => {
			return (capabilities as EntitySetAnnotations_Capabilities | undefined)?.InsertRestrictions?.RequiredProperties;
		},
		false
	);
}

/**
 * Determines if the property is annotated as a required property.
 * @param name The name of the property
 * @param converterContext The instance of the converter context
 * @returns True if the property is required
 */
function isAnnotatedRequiredProperty(name: string, converterContext: ConverterContext<PageContextPathTarget>): boolean {
	return getRequiredProperties(converterContext)
		.map((property) => property.$target?.fullyQualifiedName)
		.includes(name);
}

/**
 * Gets the data type of a column for the export.
 * @param dataType The data type of a property, column
 * @param isATimezone Is the given property a timezone
 * @param isCurrency Is the given property a currency
 * @param exportSettings The already detected export settings from datafields
 * @returns The supported export type
 */
function getExportDataType(
	dataType: string | undefined,
	isATimezone = false,
	isCurrency = false,
	exportSettings?: ColumnExportSettings
): string {
	let exportDataType = "String";
	if (!dataType || exportSettings?.dataPointTargetValue) {
		return exportDataType;
	}
	if (exportSettings?.isCurrency || isCurrency) {
		return "Currency";
	}
	if (isATimezone) {
		return "Timezone";
	}
	if (exportSettings?.wrap) {
		return exportDataType;
	}
	switch (dataType) {
		case "Edm.Decimal":
		case "Edm.Int32":
		case "Edm.Int64":
		case "Edm.Double":
		case "Edm.Byte":
			exportDataType = "Number";
			break;
		case "Edm.DateOfTime":
		case "Edm.Date":
			exportDataType = "Date";
			break;
		case "Edm.DateTimeOffset":
			exportDataType = "DateTime";
			break;
		case "Edm.TimeOfDay":
			exportDataType = "Time";
			break;
		case "Edm.Boolean":
			exportDataType = "Boolean";
			break;
		default:
			exportDataType = "String";
	}
	return exportDataType;
}

/**
 * Adds the tooltip configuration for a given column.
 * @param property The property referenced on the column
 * @param column The column to be updated
 */
function _addToolTip(property: Property, column: AnnotationTableColumn): void {
	const tooltip = _getTooltip(property) ?? column.label;
	if (tooltip) {
		column.tooltip = tooltip;
	}
}

function _getCollectedNavigationPropertyLabels(
	relativePath: string,
	converterContext: ConverterContext<PageContextPathTarget>
): string[] | undefined {
	const navigationProperties = enhanceDataModelPath(converterContext.getDataModelObjectPath(), relativePath).navigationProperties;
	if (navigationProperties?.length > 0) {
		const collectedNavigationPropertyLabels: string[] = [];
		navigationProperties.forEach((navProperty) => {
			collectedNavigationPropertyLabels.push(getLabel(navProperty) || navProperty.name);
		});
		return collectedNavigationPropertyLabels;
	}
}

/**
 * Creates a property using the text arrangement annotation set to text only.
 * @param converterContext The converter context.
 * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
 * @param lineItem The column to be evaluated.
 * @param columnsToBeCreated The list of columns to be created.
 * @param relativePath The relative path to the target property based on the context.
 * @param restrictionsOnProperties The existing restrictions on properties
 */
function createPropertyAnnotatedTextOnly(
	converterContext: ConverterContext<PageContextPathTarget>,
	propertyDataModelObjectPath: DataModelObjectPath<DataFieldAbstractTypes>,
	lineItem: DataFieldAbstractTypes,
	columnsToBeCreated: Record<string, Property>,
	relativePath: string,
	restrictionsOnProperties: RestrictionsOnProperties
): void {
	const isPropertyNavigated =
		propertyDataModelObjectPath.navigationProperties.length !== converterContext.getDataModelObjectPath().navigationProperties.length;
	if (isPropertyNavigated && isDataField(lineItem)) {
		columnsToBeCreated[relativePath] = lineItem.Value.$target;
		restrictionsOnProperties.nonSortableProperties.push(relativePath);
	} else if (isDataFieldForAnnotation(lineItem) && hasFieldGroupTarget(lineItem)) {
		(lineItem.Target.$target as FieldGroup).Data.forEach((field) => {
			if (isDataField(field) && getDisplayMode(field.Value.$target) === "Description") {
				const inheredPropertyDataModelObjectPath = enhanceDataModelPath(
					converterContext.getDataModelObjectPath(),
					field.Value.path
				);
				const isInheredPropertyNavigated =
					inheredPropertyDataModelObjectPath.navigationProperties.length !==
					converterContext.getDataModelObjectPath().navigationProperties.length;
				if (isInheredPropertyNavigated) {
					columnsToBeCreated[field.Value.path] = field.Value.$target;
					restrictionsOnProperties.nonSortableProperties.push(field.Value.path);
				}
			}
		});
	}
}

export function getTypeConfig(oProperty: Property | DataFieldAbstractTypes | undefined, dataType: string | undefined): PropertyTypeConfig {
	let oTargetMapping;
	if (isProperty(oProperty)) {
		oTargetMapping = isTypeDefinition(oProperty.targetType)
			? EDM_TYPE_MAPPING[oProperty.targetType.underlyingType]
			: EDM_TYPE_MAPPING[oProperty.type];
	}
	if (oTargetMapping === undefined && dataType !== undefined) {
		oTargetMapping = EDM_TYPE_MAPPING[dataType];
	}
	const propertyTypeConfig: PropertyTypeConfig = {
		type: oTargetMapping?.type,
		constraints: {},
		formatOptions: {}
	};
	if (isProperty(oProperty) && oTargetMapping !== undefined) {
		propertyTypeConfig.constraints = {
			scale: oTargetMapping.constraints?.$Scale ? oProperty.scale : undefined,
			precision: oTargetMapping.constraints?.$Precision ? oProperty.precision : undefined,
			maxLength: oTargetMapping.constraints?.$MaxLength ? oProperty.maxLength : undefined,
			nullable: oTargetMapping.constraints?.$Nullable ? oProperty.nullable : undefined,
			minimum:
				oTargetMapping.constraints?.["@Org.OData.Validation.V1.Minimum/$Decimal"] &&
				!isNaN(oProperty.annotations?.Validation?.Minimum)
					? `${oProperty.annotations?.Validation?.Minimum}`
					: undefined,
			maximum:
				oTargetMapping.constraints?.["@Org.OData.Validation.V1.Maximum/$Decimal"] &&
				!isNaN(oProperty.annotations?.Validation?.Maximum)
					? `${oProperty.annotations?.Validation?.Maximum}`
					: undefined,
			isDigitSequence:
				propertyTypeConfig.type === "sap.ui.model.odata.type.String" &&
				oTargetMapping.constraints?.[`@${CommonAnnotationTerms.IsDigitSequence}`] &&
				oProperty.annotations?.Common?.IsDigitSequence
					? true
					: undefined
		};
	}
	propertyTypeConfig.formatOptions = {
		parseAsString:
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 ||
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0
				? false
				: undefined,
		emptyString:
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 ||
			propertyTypeConfig?.type?.indexOf("sap.ui.model.odata.type.Double") === 0
				? ""
				: undefined,
		parseKeepsEmptyString:
			propertyTypeConfig.type === "sap.ui.model.odata.type.String" && propertyTypeConfig.constraints.nullable === false
				? true
				: undefined
	};
	return propertyTypeConfig;
}

/**
 * Add a description property to the list of description properties used by the columns of a table.
 * @param displayModeOfDescriptionPropertiesMap The list of properties referenced as text on a text arrangement annotation
 * @param relatedPropertiesInfo The related properties linked to the column (named also complex property)
 * @param relatedPropertyName The property name to be added
 */
function addPropertyToDisplayModeOfDescriptionPropertiesMap(
	displayModeOfDescriptionPropertiesMap: Record<string, DisplayMode>,
	relatedPropertiesInfo: ComplexPropertyInfo,
	relatedPropertyName: string
): void {
	if (
		relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription &&
		!displayModeOfDescriptionPropertiesMap[relatedPropertyName]
	) {
		displayModeOfDescriptionPropertiesMap[relatedPropertyName] =
			relatedPropertiesInfo.properties[relatedPropertyName].displayModeOfPropertyUsedAsDescription!;
	}
}

/**
 * Computes the referenced properties of a LineItem in case the LineItem is annotated as hidden.
 * @param existingColumns The list of columns created from LineItems and from properties of entityType
 * @param name The name of the property to be evaluated
 * @param column The given column from lineItem or property of entitySet
 */
function computeHiddenOnRelatedColumns(existingColumns: AnnotationTableColumn[], name: string, column: AnnotationTableColumn): void {
	const relatedAnnotationColumns = existingColumns.filter(
		(existingColumn) =>
			(existingColumn.propertyInfos?.includes(name) && existingColumn.isPartOfLineItem) ||
			(existingColumn.isPartOfLineItem && existingColumn.relativePath === column.relativePath)
	);
	column.isPartOfLineItem = !!relatedAnnotationColumns.length;
	if (
		relatedAnnotationColumns.length &&
		!relatedAnnotationColumns?.some((annotationColumn) => annotationColumn.availability !== "Hidden")
	) {
		column.sortable = false;
		column.isGroupable = false;
		column.filterable = false;
	}
}

/**
 * Gets the export settings properties of a manifest column.
 * @param exportSettings The customized/overwritten export settings of a manifest column
 * @param annotationColumns The list of columns created from LineItems
 * @param converterContext The converter context
 * @param entityType The target entity type
 * @param propertyInfos The properties linked to a complex column
 * @param columnKey The column key of the column to be overwritten
 * @returns The export settings of the column merging customized export settings with the default values detected on the annotation column
 */
function getCustomExportSettings(
	exportSettings: ColumnExportSettings | undefined,
	annotationColumns: AnnotationTableColumn[],
	converterContext: ConverterContext<PageContextPathTarget>,
	entityType: EntityType,
	propertyInfos?: string[],
	columnKey?: string
): ColumnExportSettings | null {
	let columnFromAnnotations;
	if (columnKey) {
		columnFromAnnotations = annotationColumns.find((annotationColumn) => annotationColumn.key === columnKey);
		if (columnFromAnnotations?.exportSettings === null) {
			return columnFromAnnotations?.exportSettings;
		}
	}
	const enableWrapping =
		exportSettings?.wrap ??
		(!!(exportSettings?.property && exportSettings.property?.length > 1) || !!(propertyInfos && propertyInfos.length > 1));
	const customExportSettings: ColumnExportSettings = {
		...columnFromAnnotations?.exportSettings,
		type: exportSettings?.type ?? columnFromAnnotations?.exportSettings?.type,
		template:
			exportSettings?.template ??
			_appendCustomTemplate(propertyInfos, exportSettings?.property) ??
			columnFromAnnotations?.exportSettings?.template,
		property: exportSettings?.property
			? _getPropertyNames(exportSettings?.property, annotationColumns, converterContext, entityType)
			: undefined,
		width: exportSettings?.width,
		wrap: enableWrapping
	};
	return removeUndefinedFromExportSettings(customExportSettings);
}

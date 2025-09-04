import type { ConvertedMetadata, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import type { ISOCurrency, Unit } from "@sap-ux/vocabularies-types/vocabularies/Measures";
import type { DataField, DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { CriticalityRepresentationType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	concat,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	pathInModel
} from "sap/fe/base/BindingToolkit";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isDataFieldTypes } from "sap/fe/core/converters/annotations/DataField";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import type { AnnotationTableColumn, PropertyTypeFormatOptions, TableColumn } from "sap/fe/core/converters/controls/Common/table/Columns";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import {
	criticalityExpressionForIntegrationCards,
	criticalityIconExpressionForIntegrationCards
} from "sap/fe/core/templating/CriticalityFormatters";
import { getContextRelativeTargetObjectPath, getRelativePaths, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import { isImageURL, isSemanticKey } from "sap/fe/core/templating/PropertyHelper";
import { getDisplayMode } from "sap/fe/core/templating/UIFormatters";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import { getTextBinding } from "sap/fe/macros/field/FieldTemplating";
import type { TableCardColumn } from "sap/ui/integration/widgets/Card";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import { type ITableBlock } from "../table/TableAPI";
import type { ControlState } from "./CommonInsightsHelper";
import { createInsightsParams } from "./CommonInsightsHelper";
import type { InsightsParams, TableContent } from "./InsightsService";

function getUomBinding(propertyTargetObject: Property | undefined, property: string): CompiledBindingToolkitExpression {
	const uom: ISOCurrency | Unit | undefined =
		propertyTargetObject?.annotations.Measures?.ISOCurrency || propertyTargetObject?.annotations.Measures?.Unit;
	if (!uom) {
		return;
	} else {
		const propertyBinding = pathInModel(property);
		return compileExpression(concat(propertyBinding, " ", getExpressionFromAnnotation(uom)));
	}
}

type ColumnInfo = {
	property: string;
	title: string;
	context: Context;
	objectPath: DataModelObjectPath<Property>;
	annotationPath?: string;
	formatOptions?: PropertyTypeFormatOptions;
};

/**
 * Check if the given TableColumn is an AnnotationTableColumn.
 * @param column Column that is to be checked
 * @returns True of it is an AnnotationTableColumn
 */
function isAnnotationTableColumn(column: TableColumn): column is AnnotationTableColumn {
	return "annotationPath" in column;
}

/**
 * Get all columns that are supported with SAP Insights.
 * The current implementation does not support columns with image urls and columns with multiple values, therefore, they are removed here.
 * @param columns
 * @param table
 * @param metaData
 * @returns An array containing all supported columns.
 */
function getSupportedColumns(columns: Record<string, ColumnInfo>, table: TableVisualization, metaData: ConvertedMetadata): ColumnInfo[] {
	return table.columns.reduce(function (supportedColumns: ColumnInfo[], column) {
		if (column.name in columns && isAnnotationTableColumn(column)) {
			let property;
			const dataField = metaData.resolvePath<DataField>(column.annotationPath).target;
			// image urls and multi value columns are not supported
			if (isDataFieldTypes(dataField)) {
				// Check if it is from lineItem annotation else consider the property level annotation
				property = (dataField.Value as PropertyPath).$target;
			} else {
				property = metaData.resolvePath<Property>(column.annotationPath).target;
			}
			if (!(property && isImageURL(property)) && !column.isMultiValue) {
				supportedColumns.push({
					...columns[column.name],
					annotationPath: column.annotationPath,
					formatOptions: column.typeConfig?.formatOptions
				});
			}
		}
		return supportedColumns;
	}, []);
}

export function getAdditionalText(displayMode: DisplayMode, dataModel: DataModelObjectPath<Property>): CompiledBindingToolkitExpression {
	let propertyBindingExpression: BindingToolkitExpression<string> = pathInModel(getContextRelativeTargetObjectPath(dataModel));
	const targetObject = dataModel.targetObject;
	const commonText = targetObject?.annotations.Common?.Text;
	if (commonText === undefined || targetObject === undefined) {
		return undefined;
	}
	propertyBindingExpression = formatWithTypeInformation(targetObject, propertyBindingExpression);

	switch (displayMode) {
		case "ValueDescription":
			const relativeLocation = getRelativePaths(dataModel);
			return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
		case "DescriptionValue":
			return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
		default:
			return undefined;
	}
}

export function getRowCriticality(tableAPI: ITableBlock): string | undefined {
	return tableAPI.getTableDefinition().annotation.row?.rowCriticalityForInsights;
}

/**
 * Filters the columns that can be shown on the insights card from the visible columns on the table.
 * @param tableAPI Table API
 * @returns A list of columns that can be shown on the insightsCard.
 */
export function getInsightsRelevantColumns(tableAPI: ITableBlock): TableCardColumn[] {
	const table = tableAPI.getContent();
	const metaModel = table.getModel()?.getMetaModel() as ODataMetaModel;
	const metaPath = table.data("metaPath") as string;
	const columns: Record<string, ColumnInfo> = {};
	table.getColumns().forEach((column) => {
		const property = column.getPropertyKey();
		const context = metaModel.getContext(metaPath + "/" + property);
		const objectPath = getInvolvedDataModelObjects<Property>(context);
		const title = column.getProperty("header") as string;
		columns[property] = { property, context, objectPath, title };
	});

	const supportedColumns = getSupportedColumns(columns, tableAPI.getTableDefinition(), convertTypes(metaModel));

	return supportedColumns.map(function (supportedColumn) {
		const dataModel = getInvolvedDataModelObjects<Property>(supportedColumn.context);
		const propertyTargetObject = dataModel.targetObject;
		const uomBinding = getUomBinding(propertyTargetObject, supportedColumn.property);
		const columnText = uomBinding ?? getTextBinding(dataModel, {}, false, "extension.formatters.sapfe.formatWithBrackets");
		const column: TableCardColumn = {
			visible: false,
			value: columnText,
			title: supportedColumn.title
		};
		if (isSemanticKey(propertyTargetObject, dataModel)) {
			const displayMode = getDisplayMode(dataModel);
			column.value = getTitleBindingExpression(
				dataModel,
				FieldTemplating.getTextBindingExpression,
				{ displayMode, splitTitleOnTwoLines: true },
				undefined,
				CommonUtils.getTargetView(tableAPI).getViewData(),
				"extension.formatters.sapfe.formatTitle"
			);
			column.additionalText = getAdditionalText(displayMode, dataModel);
			column.identifier = true;
		}
		if (supportedColumn.annotationPath) {
			const criticalityBinding = getCriticalityBinding(supportedColumn.annotationPath, metaPath, metaModel);
			if (criticalityBinding) {
				column.state = criticalityBinding.state as CompiledBindingToolkitExpression;
				column.showStateIcon = criticalityBinding.showStateIcon;
				column.customStateIcon = criticalityBinding.customStateIcon;
			}
		}
		return column;
	});
}

/**
 * Get criticality state binding expression and icon information.
 * @param annotationPath Annotation path
 * @param metaPath Meta path
 * @param metaModel Meta model
 * @returns The criticality state binding expression and icon information.
 */
function getCriticalityBinding(annotationPath: string, metaPath: string, metaModel: ODataMetaModel): Partial<TableCardColumn> | undefined {
	const dataModel = getInvolvedDataModelObjects(metaModel.getContext(annotationPath), metaModel.getContext(metaPath)),
		propertyTargetObject = dataModel.targetObject as DataPointType;
	if (propertyTargetObject.Criticality) {
		const showCriticalityIcon = propertyTargetObject.CriticalityRepresentation !== CriticalityRepresentationType.WithoutIcon;
		return {
			state: criticalityExpressionForIntegrationCards(propertyTargetObject.Criticality),
			showStateIcon: showCriticalityIcon,
			customStateIcon: showCriticalityIcon ? criticalityIconExpressionForIntegrationCards(propertyTargetObject) : ""
		};
	}
	return undefined;
}

/**
 * Constructs the insights parameters from the table that is required to create the insights card.
 * @param controlAPI
 * @param insightsRelevantColumns
 * @param sortConditionsQuery
 * @returns The insights parameters from the table.
 */
export async function createTableCardParams(
	controlAPI: ITableBlock,
	insightsRelevantColumns: TableCardColumn[],
	sortConditionsQuery: string
): Promise<InsightsParams<TableContent> | undefined> {
	const table = controlAPI.getContent();
	const params = await createInsightsParams("Table", controlAPI, table.getFilter(), insightsRelevantColumns);
	if (!params) {
		return;
	}

	try {
		const controlState = (await StateUtil.retrieveExternalState(table)) as ControlState;
		const groupProperty = controlState.groupLevels?.[0]?.name.split("::").pop();
		if (groupProperty) {
			params.requestParameters.groupBy = {
				property: groupProperty
			};
		}
	} catch {
		throw Error("Error retrieving control states");
	}
	params.parameters.isNavigationEnabled = isNavigationEnabled(controlAPI);
	params.entitySetPath = table.data("metaPath") as string;
	params.requestParameters.sortQuery = sortConditionsQuery;
	params.requestParameters.queryUrl = table.getRowBinding().getDownloadUrl() ?? "";

	const content: TableContent = {
		cardTitle: table.getHeader(),
		insightsRelevantColumns,
		rowCriticality: getRowCriticality(controlAPI) ?? undefined
	};

	return { ...params, content };
}

/**
 * Checks if row level navigation is enabled for table card.
 * @param controlAPI Table API
 * @returns True if row level navigation is enabled.
 */
function isNavigationEnabled(controlAPI: ITableBlock): boolean {
	const table = controlAPI.getContent(),
		viewData = CommonUtils.getTargetView(controlAPI).getViewData() as BaseManifestSettings,
		entitySet = table.data("metaPath") as string,
		navigationSetting = viewData.navigation?.[entitySet]
			? viewData.navigation[entitySet]
			: viewData.navigation?.[entitySet.replace("/", "")];
	// Disable row level navigation if external navigation is configured for LR table using manifest
	return !(navigationSetting?.detail?.outbound || navigationSetting?.display?.target);
}

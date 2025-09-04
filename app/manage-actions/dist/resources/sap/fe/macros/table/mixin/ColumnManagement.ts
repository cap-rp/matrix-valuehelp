import { compileExpression } from "sap/fe/base/BindingToolkit";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import type Any from "sap/fe/core/controls/Any";
import { getInvolvedDataModelObjectEntityKeys } from "sap/fe/core/converters/MetaModelConverter";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import type { AnnotationTableColumn, TableColumn } from "sap/fe/core/converters/controls/Common/table/Columns";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { standardRecommendationHelper } from "sap/fe/core/helpers/StandardRecommendationHelper";
import { generateVisibleExpression } from "sap/fe/core/templating/DataFieldFormatters";
import type MDCColumn from "sap/ui/mdc/table/Column";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import { type DynamicVisibilityForColumn, type ITableBlock, type TableColumnProperties } from "../TableAPI";

type FilteredColumn = {
	columnName: string;
	sTextArrangement: string;
	sColumnNameVisible: boolean;
};

type TableKey = {
	headerInfoTitlePath: string | undefined;
	filteredTechnicalKeys: string[];
	semanticKeyColumns: string[];
	aFilteredColummns: FilteredColumn[];
};

/**
 * A mixin for column-related logic in the table.
 */
export default class ColumnManagement implements IInterfaceWithMixin {
	propertyUIHiddenCache?: Record<string, typeof Any>;

	dynamicVisibilityForColumns?: DynamicVisibilityForColumn[];

	setupMixin(_baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
	}

	private getPropertyUIHiddenCache(): Record<string, typeof Any> {
		if (this.propertyUIHiddenCache === undefined) {
			this.propertyUIHiddenCache = {};
		}

		return this.propertyUIHiddenCache;
	}

	private getDynamicVisibilityForColumns(): DynamicVisibilityForColumn[] {
		if (this.dynamicVisibilityForColumns === undefined) {
			this.dynamicVisibilityForColumns = [];
		}

		return this.dynamicVisibilityForColumns;
	}

	checkIfColumnExists(aFilteredColummns: FilteredColumn[], columnName: string): boolean {
		return aFilteredColummns.some(function (oColumn: FilteredColumn) {
			if (
				(oColumn?.columnName === columnName && oColumn?.sColumnNameVisible) ||
				(oColumn?.sTextArrangement !== undefined && oColumn?.sTextArrangement === columnName)
			) {
				return columnName;
			}
		});
	}

	getTableIdentifierColumnInfo(this: ITableBlock & ColumnManagement): TableKey {
		const oTable = this.getContent();
		const headerInfoTitlePath = this.getTableDefinition().headerInfoTitle;
		const oMetaModel = oTable && (oTable.getModel()?.getMetaModel() as ODataMetaModel),
			sCurrentEntitySetName = oTable.data("metaPath");
		const aTechnicalKeys = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/$Key`);
		const filteredTechnicalKeys: string[] = [];
		if (aTechnicalKeys && aTechnicalKeys.length > 0) {
			aTechnicalKeys.forEach(function (technicalKey: string) {
				if (technicalKey !== "IsActiveEntity") {
					filteredTechnicalKeys.push(technicalKey);
				}
			});
		}
		const semanticKeyColumns = this.getTableDefinition().semanticKeys;

		const aVisibleColumns: string[] = [];
		const aFilteredColummns: FilteredColumn[] = [];
		const aTableColumns = oTable.getColumns();
		aTableColumns.forEach(function (oColumn: MDCColumn) {
			const column = oColumn?.getPropertyKey?.();
			if (column) {
				aVisibleColumns.push(column);
			}
		});

		aVisibleColumns.forEach(function (oColumn: string) {
			const oTextArrangement = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/${oColumn}@`);
			const sTextArrangement = oTextArrangement && oTextArrangement["@com.sap.vocabularies.Common.v1.Text"]?.$Path;
			const sTextPlacement =
				oTextArrangement &&
				oTextArrangement["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]?.$EnumMember;
			aFilteredColummns.push({
				columnName: oColumn,
				sTextArrangement: sTextArrangement,
				sColumnNameVisible: !(sTextPlacement === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly")
			});
		});
		return {
			headerInfoTitlePath,
			filteredTechnicalKeys,
			semanticKeyColumns,
			aFilteredColummns
		};
	}

	getIdentifierColumn(this: ITableBlock & ColumnManagement, isRecommendationRelevant?: boolean): string | string[] | undefined {
		const { headerInfoTitlePath, filteredTechnicalKeys, semanticKeyColumns, aFilteredColummns } = this.getTableIdentifierColumnInfo();
		let column: string | string[] | undefined;
		if (isRecommendationRelevant) {
			const rootContext = standardRecommendationHelper.getCurrentRootContext() as Context;
			const rootKeys = getInvolvedDataModelObjectEntityKeys(rootContext);
			if (semanticKeyColumns.length > 0) {
				column = semanticKeyColumns.filter((key) => !rootKeys.semanticKeys.includes(key));
			} else if (filteredTechnicalKeys.length > 0) {
				column = filteredTechnicalKeys.filter((key) => !rootKeys.technicalKeys.includes(key));
			}
			return column;
		}

		if (headerInfoTitlePath !== undefined && this.checkIfColumnExists(aFilteredColummns, headerInfoTitlePath)) {
			column = headerInfoTitlePath;
		} else if (
			semanticKeyColumns !== undefined &&
			semanticKeyColumns.length === 1 &&
			this.checkIfColumnExists(aFilteredColummns, semanticKeyColumns[0])
		) {
			column = semanticKeyColumns[0];
		} else if (filteredTechnicalKeys.length === 1 && this.checkIfColumnExists(aFilteredColummns, filteredTechnicalKeys[0])) {
			column = filteredTechnicalKeys[0];
		}
		return column;
	}

	/**
	 * Computes the column value with text arrangement.
	 * @param key Modified key with text annotation path.
	 * @param tableRowContext
	 * @param textAnnotationPath
	 * @param textArrangement
	 * @returns Computed column value.
	 */
	computeColumnValue(key: string, tableRowContext: Context, textAnnotationPath: string, textArrangement: string): string {
		const sCodeValue = tableRowContext.getObject(key);
		let sTextValue;
		let sComputedValue = sCodeValue;

		if (textAnnotationPath) {
			if (key.lastIndexOf("/") > 0) {
				// the target property is replaced with the text annotation path
				key = key.slice(0, key.lastIndexOf("/") + 1);
				key = key.concat(textAnnotationPath);
			} else {
				key = textAnnotationPath;
			}
			sTextValue = tableRowContext.getObject(key);
			if (sTextValue) {
				if (textArrangement) {
					const sEnumNumber = textArrangement.slice(textArrangement.indexOf("/") + 1);
					switch (sEnumNumber) {
						case "TextOnly":
							sComputedValue = sTextValue;
							break;
						case "TextFirst":
							sComputedValue = `${sTextValue} (${sCodeValue})`;
							break;
						case "TextLast":
							sComputedValue = `${sCodeValue} (${sTextValue})`;
							break;
						case "TextSeparate":
							sComputedValue = sCodeValue;
							break;
						default:
					}
				} else {
					sComputedValue = `${sTextValue} (${sCodeValue})`;
				}
			}
		}
		return sComputedValue;
	}

	/**
	 * This function will get the value of first Column of Table with its text Arrangement.
	 * @param tableRowContext
	 * @param textAnnotationPath
	 * @param textArrangement
	 * @param tableColProperty
	 * @returns Column Name with Visibility and its Value.
	 */
	getTableColValue(
		this: ITableBlock & ColumnManagement,
		tableRowContext: Context,
		textAnnotationPath: string,
		textArrangement: string,
		tableColProperty: TableColumnProperties
	): string {
		const resourceModel = getResourceModel(this.getContent());
		let labelNameWithVisibilityAndValue = "";
		const [{ key, visibility }] = tableColProperty;
		const columnLabel = this.getKeyColumnInfo(key)?.label;
		const sComputedValue = this.computeColumnValue(key, tableRowContext, textAnnotationPath, textArrangement);
		labelNameWithVisibilityAndValue = visibility
			? `${columnLabel}: ${sComputedValue}`
			: `${columnLabel} (${resourceModel.getText("T_COLUMN_INDICATOR_IN_TABLE_DEFINITION")}): ${sComputedValue}`;
		return labelNameWithVisibilityAndValue;
	}

	/**
	 * The method that is called to retrieve the column info from the associated message of the message popover.
	 * @param keyColumn string or undefined
	 * @returns Returns the column info.
	 */

	getKeyColumnInfo(this: ITableBlock & ColumnManagement, keyColumn?: string): TableColumn | undefined {
		return this.getTableDefinition().columns.find(function (oColumn): boolean {
			return oColumn.key.split("::").pop() === keyColumn;
		});
	}

	/**
	 * This method is used to check if the column is Path based UI.Hidden.
	 * @param columnName string
	 * @param rowContext Context
	 * @returns Returns true if the column is Path based UI.Hidden and value visible on the UI, else returns false. Returns string 'true' if the column is not UI.Hidden, else returns 'false'.
	 */

	isColumnValueVisible(this: ITableBlock & ColumnManagement, columnName: string, rowContext: Context | undefined): string | boolean {
		let anyObject;
		if (!this.getPropertyUIHiddenCache()[columnName]) {
			const dataModelPath = this.getDataModelAndConvertedTargetObject(columnName)?.dataModelPath;
			if (!dataModelPath) {
				return false;
			}
			const visibleExpression = compileExpression(generateVisibleExpression(dataModelPath));
			anyObject = this.createAnyControl(visibleExpression, rowContext);
			this.getPropertyUIHiddenCache()[columnName] = anyObject;
			anyObject.setBindingContext(null); // we need to set the binding context to null otherwise the following addDependent will set it to the context of the table
			this.addDependent(anyObject);
		} else {
			anyObject = this.getPropertyUIHiddenCache()[columnName];
		}
		anyObject.setBindingContext(rowContext);
		const columnValueVisible = anyObject.getAny() as string | boolean;
		anyObject.setBindingContext(null);
		return columnValueVisible;
	}

	/**
	 * Checks whether the column is UI.Hidden or not.
	 * @param columnName string | string[]
	 * @param tableRowContext Context
	 * @returns string[] if the column name is not UI.Hidden.
	 */

	checkColumnValueVisible(
		this: ITableBlock & ColumnManagement,
		columnName: string | string[],
		tableRowContext: Context | undefined
	): string[] | undefined {
		const columnAvailability = Array.isArray(columnName) ? columnName : [columnName];
		const availableColumn = [];
		for (const column of columnAvailability) {
			const availability = this.isColumnValueVisible(column, tableRowContext);
			if (availability === "true" || availability === true) {
				availableColumn.push(column);
			}
		}
		if (availableColumn.length > 0) {
			return availableColumn;
		}
	}

	/**
	 * Checks whether the column is present in the table view.
	 * @param key string
	 * @param aFilteredColumns
	 * @returns `true` if the column is visible in the table view.
	 */

	checkVisibility(key: string, aFilteredColumns: FilteredColumn[]): { visibility: boolean } {
		const column = aFilteredColumns.find((col: { columnName: string }) => col.columnName === key);
		if (column) {
			return {
				visibility: column.sColumnNameVisible
			};
		}
		return { visibility: false };
	}

	/**
	 * Retrieves the columns, visibility, and text arrangement based on priority order.
	 * @param tableRowContext Context
	 * @returns An object containing the column name and visibility.
	 */

	getTableColumnVisibilityInfo(this: ITableBlock & ColumnManagement, tableRowContext: Context | undefined): TableColumnProperties {
		const { headerInfoTitlePath, filteredTechnicalKeys, semanticKeyColumns, aFilteredColummns } = this.getTableIdentifierColumnInfo();
		const columnPropertyAndVisibility = [];

		if (headerInfoTitlePath !== undefined && this.checkColumnValueVisible(headerInfoTitlePath, tableRowContext)) {
			// If the headerInfoTitlePath is not undefined and not UI.Hidden, the headerInfoTitlePath is returned.
			const { visibility } = this.checkVisibility(headerInfoTitlePath, aFilteredColummns);
			columnPropertyAndVisibility.push({ key: headerInfoTitlePath, visibility });
		} else if (
			semanticKeyColumns !== undefined &&
			semanticKeyColumns.length === 1 &&
			this.checkColumnValueVisible(semanticKeyColumns[0], tableRowContext)
		) {
			// if there is only one semanticKey and it is not undefined and not UI.Hidden, the single sematicKey is returned.
			const { visibility } = this.checkVisibility(semanticKeyColumns[0], aFilteredColummns);
			columnPropertyAndVisibility.push({ key: semanticKeyColumns[0], visibility });
		} else if (filteredTechnicalKeys.length === 1 && this.checkColumnValueVisible(filteredTechnicalKeys[0], tableRowContext)) {
			// if there is only one technicalKey and it is not undefined and not UI.Hidden, the single technicalKey is returned.
			const { visibility } = this.checkVisibility(filteredTechnicalKeys[0], aFilteredColummns);
			columnPropertyAndVisibility.push({ key: filteredTechnicalKeys[0], visibility });
		} else if (
			semanticKeyColumns !== undefined &&
			semanticKeyColumns.length > 0 &&
			this.checkColumnValueVisible(semanticKeyColumns, tableRowContext)
		) {
			// if there are multiple semanticKey and it is not undefined and not UI.Hidden, the multiple sematicKey is returned.
			const availableKeys = this.checkColumnValueVisible(semanticKeyColumns, tableRowContext);
			if (availableKeys) {
				for (const key of availableKeys) {
					const { visibility } = this.checkVisibility(key, aFilteredColummns);
					columnPropertyAndVisibility.push({ key: key, visibility });
				}
			}
		} else if (filteredTechnicalKeys.length > 0 && this.checkColumnValueVisible(filteredTechnicalKeys, tableRowContext)) {
			// if there are multiple technicalKey and it is not undefined and not UI.Hidden, the multiple technicalKey is returned.
			const availableKeys = this.checkColumnValueVisible(filteredTechnicalKeys, tableRowContext);
			if (availableKeys) {
				for (const key of availableKeys) {
					const { visibility } = this.checkVisibility(key, aFilteredColummns);
					columnPropertyAndVisibility.push({ key: key, visibility });
				}
			}
		}
		return columnPropertyAndVisibility;
	}

	modifyDynamicVisibilityForColumn(columnKey: string, visible: boolean): void {
		const existingDynamicVisibility = this.getDynamicVisibilityForColumns().find(
			(dynamicVisibility) => dynamicVisibility.columnKey === columnKey
		);
		if (existingDynamicVisibility) {
			existingDynamicVisibility.visible = visible;
		} else {
			this.getDynamicVisibilityForColumns().push({
				columnKey: columnKey,
				visible: visible
			});
		}
	}

	/**
	 * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
	 * @param ignoredFields
	 * @param tableDefinition
	 */
	updateColumnsVisibility(ignoredFields: string | undefined, tableDefinition: TableVisualization): void {
		ColumnManagement.updateColumnsVisibilityStatic(ignoredFields, this.getDynamicVisibilityForColumns(), tableDefinition);
	}

	/**
	 * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
	 * This static version is needed temporarily to expose a static method in TableAPI (used in Table.block).
	 * @param ignoredFields
	 * @param dynamicVisibilityForColumns
	 * @param tableDefinition
	 */
	static updateColumnsVisibilityStatic(
		ignoredFields: string | undefined,
		dynamicVisibilityForColumns: DynamicVisibilityForColumn[],
		tableDefinition: TableVisualization
	): void {
		if (!ignoredFields && !dynamicVisibilityForColumns.length) {
			return;
		}

		const ignoredFieldNames = ignoredFields ? ignoredFields.split(",").map((name) => name.trim()) : [];
		const columns = tableDefinition.columns;

		// If a columns in the table definition contains an ignored field, mark it as hidden
		columns.forEach((column) => {
			let ignoreColumn = ignoredFieldNames.includes((column as AnnotationTableColumn).relativePath); // Standard column
			if (!ignoreColumn && column.propertyInfos) {
				// Complex column
				ignoreColumn = column.propertyInfos.some((relatedColumnName) => {
					const relatedColumn = columns.find((col) => col.name === relatedColumnName) as AnnotationTableColumn;
					return relatedColumn?.relativePath && ignoredFieldNames.includes(relatedColumn.relativePath);
				});
			}
			if (ignoreColumn) {
				column.availability = "Hidden";
				if ("sortable" in column) {
					column.sortable = false;
				}
				if ("filterable" in column) {
					column.filterable = false;
				}
				if ("isGroupable" in column) {
					column.isGroupable = false;
				}
			}

			const dynamicVisibility = dynamicVisibilityForColumns.find((dynamicVisibility) => dynamicVisibility.columnKey === column.key);
			if (dynamicVisibility) {
				column.availability = dynamicVisibility.visible ? "Default" : "Hidden";
			}
		});
	}
}

import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import { type TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import {
	type AnnotationTableColumn,
	type ColumnExportSettings,
	type TableColumn
} from "sap/fe/core/converters/controls/Common/table/Columns";
import { getLocalizedText } from "sap/fe/core/helpers/ResourceModelHelper";
import { type CollectionBindingInfo } from "sap/fe/macros/CollectionBindingInfo";
import Library from "sap/ui/core/Lib";
import type MDCTable from "sap/ui/mdc/Table";
import { type Table$BeforeExportEvent } from "sap/ui/mdc/Table";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { type ITableBlock } from "../TableAPI";

type ExportColumn = {
	property: string | string[];
	label: string;
	columnId?: string;
	width?: number;
	textAlign?: string;
	displayUnit?: boolean;
	trueValue?: string;
	falseValue?: string;
	valueMap?: string;
	template?: string;
	type?: string;
	delimiter?: boolean;
	wrap?: boolean;
	unit?: string;
	scale?: number;
};

type UserExportSettings = {
	splitCells?: boolean;
};

export type ExportSettings = {
	fileType?: string;
	dataSource: {
		dataUrl: string;
		sizeLimit?: number;
	};
	workbook: {
		columns: ExportColumn[];
	};
};

export default class TableExport implements IInterfaceWithMixin {
	downloadUrl?: string;

	tableBindingInfo?: CollectionBindingInfo;

	setupMixin(_baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
	}

	/**
	 * Stores the binding info for the table used to create the list binding.
	 * @param bindingInfo
	 */
	setTableBindingInfo(bindingInfo: CollectionBindingInfo): void {
		this.tableBindingInfo = bindingInfo;
	}

	/**
	 * Compute the download URL to be used by the export and store it in the TableAPI.
	 * @param this
	 * @returns Promise when downloadUrl is set
	 */
	async setDownloadUrl(this: ITableBlock & TableExport): Promise<void> {
		//empty the downloadUrl to prevent an invalid one to be used
		this.downloadUrl = undefined;

		if (this.getTableDefinition().enableAnalytics === true) {
			// In case of an analytical table, $select is not supported, so we don't calculate the download URL (we use the default behaviour)
			return;
		}

		let downloadUrl: string | undefined | null;
		const table = this.getContent();
		try {
			const propertyHelper = table.getPropertyHelper();
			let columnsExportSettings: ExportColumn[] = [];
			for (const mdcColumn of table.getColumns()) {
				columnsExportSettings = columnsExportSettings.concat(propertyHelper.getColumnExportSettings(mdcColumn));
			}

			const bindingParameters: { $select?: string; $search?: string; $$aggregation?: object } = {};
			// we just want to request the properties necessary for the export
			const collectionKeys = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath)?.targetEntityType.keys.map(
				(key) => key.name
			);
			const selectProperties = columnsExportSettings.map((column: ExportColumn) => {
				return Array.isArray(column.property) ? column.property.join(",") : column.property;
			});
			collectionKeys?.forEach((key) => {
				if (!selectProperties.includes(key)) {
					selectProperties.push(key);
				}
			});
			const requestAtLeastProperties = Object.keys(this.getTableDefinition().requestAtLeast);
			requestAtLeastProperties?.forEach((prop) => {
				if (!selectProperties.includes(prop)) {
					selectProperties.push(prop);
				}
			});
			bindingParameters["$select"] = selectProperties.join(",");

			if (this.tableBindingInfo?.parameters?.$search) {
				bindingParameters.$search = this.tableBindingInfo.parameters.$search;
			}

			if (this.tableBindingInfo?.parameters?.$$aggregation) {
				bindingParameters.$$aggregation = this.tableBindingInfo.parameters.$$aggregation;
			}

			const tableBinding = table.getRowBinding();
			// we create a list binding to compute the right url for the export from its binding parameters
			const downloadListBinding = (tableBinding.getModel() as ODataModel).bindList(
				tableBinding.getPath(),
				tableBinding.getContext(),
				this.tableBindingInfo?.sorter,
				this.tableBindingInfo?.filters,
				bindingParameters
			);
			downloadUrl = await downloadListBinding.requestDownloadUrl();
			downloadListBinding.destroy();
		} catch (error: unknown) {
			Log.debug("Error while computing the download URL for the export", error as Error);
		}
		if (downloadUrl) {
			this.downloadUrl = downloadUrl;
		}
	}

	/**
	 * Intercept the export before it's triggered to cover specific cases that couldn't be addressed on the propertyInfos for each column.
	 * e.g. Fixed Target Value for the datapoints.
	 * @param this
	 * @param exportEvent
	 */
	_onBeforeExport(this: ITableBlock & TableExport, exportEvent: Table$BeforeExportEvent): void {
		const isSplitMode = (exportEvent.getParameter("userExportSettings") as UserExportSettings)?.splitCells === true;
		const table = exportEvent.getSource(),
			exportSettings = exportEvent.getParameter("exportSettings") as ExportSettings,
			tableDefinition = this.getTableDefinition();

		TableExport.updateExportSettings(exportSettings, tableDefinition, table, isSplitMode);
	}

	/**
	 * Updates the table columns that can be exported.
	 * @param exportSettings The table export settings
	 * @param tableDefinition The table definition from the table converter
	 * @param table The table
	 * @param isSplitMode Defines if the export has been launched using split mode
	 * @returns The updated columns to be exported
	 */
	static updateExportSettings(
		exportSettings: ExportSettings,
		tableDefinition: TableVisualization,
		table: MDCTable,
		isSplitMode: boolean
	): ExportSettings {
		const columns = tableDefinition.columns;
		this.setStaticSizeLimit(tableDefinition, exportSettings);
		const exportColumns = exportSettings.workbook.columns;
		for (let index = exportColumns.length - 1; index >= 0; index--) {
			const exportColumn = exportColumns[index];
			const resourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
			exportColumn.label = getLocalizedText(exportColumn.label, table);
			this.translateBooleanValueForExport(exportColumn, resourceBundle);
			if (isSplitMode) {
				this.setExportConfig(columns, exportColumns, index);
				this.addTargetValueColumn(columns, exportColumns, resourceBundle, index);
			}
		}
		const tableAPIDownloadUrl = (table.getParent() as ITableBlock & TableExport).downloadUrl;
		if (tableAPIDownloadUrl) {
			exportSettings.dataSource.dataUrl = tableAPIDownloadUrl;
		}
		return exportSettings;
	}

	/**
	 * Sets the static size limit for the table export.
	 * @param tableDefinition The table definition from the table converter
	 * @param exportSettings The table export settings
	 */
	static setStaticSizeLimit(tableDefinition: TableVisualization, exportSettings: ExportSettings): void {
		if (
			!tableDefinition.enableAnalytics &&
			(tableDefinition.control.type === "ResponsiveTable" || tableDefinition.control.type === "GridTable")
		) {
			exportSettings.dataSource.sizeLimit = tableDefinition.control.exportRequestSize ?? 1000;
		}
	}

	/**
	 * Sets the translated textual representation of a column with boolean value.
	 * @param exportColumn The column to be exported
	 * @param resourceBundle The resource bundle
	 */
	static translateBooleanValueForExport(exportColumn: ExportColumn, resourceBundle: ResourceBundle): void {
		if (exportColumn.type === "Boolean") {
			exportColumn.falseValue = resourceBundle.getText("no");
			exportColumn.trueValue = resourceBundle.getText("yes");
		}
	}

	/**
	 * Sets the originating export config of a single property referenced on a field group or a custom column.
	 * @param columns The columns from the table converter
	 * @param exportColumns The list of columns to be exported
	 * @param index The index of the column to be exported
	 */
	static setExportConfig(columns: TableColumn[], exportColumns: ExportColumn[], index: number): void {
		const referencedColumn = columns.find(
			(column) => !column.propertyInfos && (column as AnnotationTableColumn).relativePath === exportColumns[index].property.toString()
		);
		if (referencedColumn?.exportSettings) {
			// All export settings of a column to be exported can't be added to the export settings object
			// because column could have units/timezones/currencies that aren't required on custom customs but only on columns from annotations
			const exportConfigList: Array<keyof ColumnExportSettings> = ["scale", "delimiter", "format", "utc", "type", "inputFormat"];
			for (const key of exportConfigList) {
				if (referencedColumn.exportSettings[key]) {
					exportColumns[index] = { ...exportColumns[index], ...{ [key]: referencedColumn.exportSettings[key] } };
					if (exportColumns[index].type === "Currency") {
						exportColumns[index].type = "Number";
					}
				}
			}
		}
	}

	/**
	 * Adds a target value column when there is a datapoint column.
	 * @param columns The columns from the table converter
	 * @param exportColumns The list of columns to be exported
	 * @param resourceBundle The resource bundle
	 * @param index The index of the column to be exported
	 */
	static addTargetValueColumn(
		columns: TableColumn[],
		exportColumns: ExportColumn[],
		resourceBundle: ResourceBundle,
		index: number
	): void {
		const targetValueColumn = (columns as AnnotationTableColumn[])?.find((column) => {
			if (!this.isPropertyFromExport(column, exportColumns[index])) {
				return false;
			}
			return this.columnWithTargetValueToBeAdded(column, exportColumns[index]);
		});
		if (targetValueColumn) {
			const columnToBeAdded: ExportColumn = {
				label: resourceBundle.getText("TargetValue"),
				property: Array.isArray(exportColumns[index].property)
					? exportColumns[index].property
					: ([exportColumns[index].property] as string[]),
				template: targetValueColumn.exportDataPointTargetValue
			};
			exportColumns.splice(index + 1, 0, columnToBeAdded);
		}
	}

	/**
	 * Checks if the column's property corresponds to the exportColumn.
	 * @param column The column from the annotations column
	 * @param exportColumn The column to be exported
	 * @returns `true` Whether the column has the exportColumn property
	 */
	static isPropertyFromExport(column: AnnotationTableColumn, exportColumn: ExportColumn): boolean {
		if (
			column.relativePath === exportColumn.property ||
			exportColumn.property.includes(column.relativePath) ||
			exportColumn.property.includes(column.name)
		) {
			return true;
		}
		// In case of complex properties
		if (column.propertyInfos?.length === 1 && exportColumn.property[0] === column.propertyInfos[0]) {
			return true;
		}
		return false;
	}

	/**
	 * Defines if a column that is to be exported and contains a DataPoint with a fixed target value needs to be added.
	 * @param column The column from the annotations column
	 * @param columnExport The column to be exported
	 * @returns `true` if the referenced column has defined a targetValue for the dataPoint, false else
	 * @private
	 */
	static columnWithTargetValueToBeAdded(column: AnnotationTableColumn, columnExport: ExportColumn): boolean {
		let columnNeedsToBeAdded = false;
		if (column.exportDataPointTargetValue && column.propertyInfos?.length === 1) {
			//Add TargetValue column when exporting on split mode
			// part of a FieldGroup or from a lineItem or from a column on the entitySet
			delete columnExport.template;
			columnNeedsToBeAdded = true;
		}
		return columnNeedsToBeAdded;
	}
}

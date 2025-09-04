/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/Lib"], function (Log, ResourceModelHelper, Library) {
  "use strict";

  var _exports = {};
  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  let TableExport = /*#__PURE__*/function () {
    function TableExport() {}
    _exports = TableExport;
    var _proto = TableExport.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    }

    /**
     * Stores the binding info for the table used to create the list binding.
     * @param bindingInfo
     */;
    _proto.setTableBindingInfo = function setTableBindingInfo(bindingInfo) {
      this.tableBindingInfo = bindingInfo;
    }

    /**
     * Compute the download URL to be used by the export and store it in the TableAPI.
     * @param this
     * @returns Promise when downloadUrl is set
     */;
    _proto.setDownloadUrl = async function setDownloadUrl() {
      //empty the downloadUrl to prevent an invalid one to be used
      this.downloadUrl = undefined;
      if (this.getTableDefinition().enableAnalytics === true) {
        // In case of an analytical table, $select is not supported, so we don't calculate the download URL (we use the default behaviour)
        return;
      }
      let downloadUrl;
      const table = this.getContent();
      try {
        const propertyHelper = table.getPropertyHelper();
        let columnsExportSettings = [];
        for (const mdcColumn of table.getColumns()) {
          columnsExportSettings = columnsExportSettings.concat(propertyHelper.getColumnExportSettings(mdcColumn));
        }
        const bindingParameters = {};
        // we just want to request the properties necessary for the export
        const collectionKeys = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath)?.targetEntityType.keys.map(key => key.name);
        const selectProperties = columnsExportSettings.map(column => {
          return Array.isArray(column.property) ? column.property.join(",") : column.property;
        });
        collectionKeys?.forEach(key => {
          if (!selectProperties.includes(key)) {
            selectProperties.push(key);
          }
        });
        const requestAtLeastProperties = Object.keys(this.getTableDefinition().requestAtLeast);
        requestAtLeastProperties?.forEach(prop => {
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
        const downloadListBinding = tableBinding.getModel().bindList(tableBinding.getPath(), tableBinding.getContext(), this.tableBindingInfo?.sorter, this.tableBindingInfo?.filters, bindingParameters);
        downloadUrl = await downloadListBinding.requestDownloadUrl();
        downloadListBinding.destroy();
      } catch (error) {
        Log.debug("Error while computing the download URL for the export", error);
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
     */;
    _proto._onBeforeExport = function _onBeforeExport(exportEvent) {
      const isSplitMode = exportEvent.getParameter("userExportSettings")?.splitCells === true;
      const table = exportEvent.getSource(),
        exportSettings = exportEvent.getParameter("exportSettings"),
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
     */;
    TableExport.updateExportSettings = function updateExportSettings(exportSettings, tableDefinition, table, isSplitMode) {
      const columns = tableDefinition.columns;
      this.setStaticSizeLimit(tableDefinition, exportSettings);
      const exportColumns = exportSettings.workbook.columns;
      for (let index = exportColumns.length - 1; index >= 0; index--) {
        const exportColumn = exportColumns[index];
        const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
        exportColumn.label = getLocalizedText(exportColumn.label, table);
        this.translateBooleanValueForExport(exportColumn, resourceBundle);
        if (isSplitMode) {
          this.setExportConfig(columns, exportColumns, index);
          this.addTargetValueColumn(columns, exportColumns, resourceBundle, index);
        }
      }
      const tableAPIDownloadUrl = table.getParent().downloadUrl;
      if (tableAPIDownloadUrl) {
        exportSettings.dataSource.dataUrl = tableAPIDownloadUrl;
      }
      return exportSettings;
    }

    /**
     * Sets the static size limit for the table export.
     * @param tableDefinition The table definition from the table converter
     * @param exportSettings The table export settings
     */;
    TableExport.setStaticSizeLimit = function setStaticSizeLimit(tableDefinition, exportSettings) {
      if (!tableDefinition.enableAnalytics && (tableDefinition.control.type === "ResponsiveTable" || tableDefinition.control.type === "GridTable")) {
        exportSettings.dataSource.sizeLimit = tableDefinition.control.exportRequestSize ?? 1000;
      }
    }

    /**
     * Sets the translated textual representation of a column with boolean value.
     * @param exportColumn The column to be exported
     * @param resourceBundle The resource bundle
     */;
    TableExport.translateBooleanValueForExport = function translateBooleanValueForExport(exportColumn, resourceBundle) {
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
     */;
    TableExport.setExportConfig = function setExportConfig(columns, exportColumns, index) {
      const referencedColumn = columns.find(column => !column.propertyInfos && column.relativePath === exportColumns[index].property.toString());
      if (referencedColumn?.exportSettings) {
        // All export settings of a column to be exported can't be added to the export settings object
        // because column could have units/timezones/currencies that aren't required on custom customs but only on columns from annotations
        const exportConfigList = ["scale", "delimiter", "format", "utc", "type", "inputFormat"];
        for (const key of exportConfigList) {
          if (referencedColumn.exportSettings[key]) {
            exportColumns[index] = {
              ...exportColumns[index],
              ...{
                [key]: referencedColumn.exportSettings[key]
              }
            };
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
     */;
    TableExport.addTargetValueColumn = function addTargetValueColumn(columns, exportColumns, resourceBundle, index) {
      const targetValueColumn = columns?.find(column => {
        if (!this.isPropertyFromExport(column, exportColumns[index])) {
          return false;
        }
        return this.columnWithTargetValueToBeAdded(column, exportColumns[index]);
      });
      if (targetValueColumn) {
        const columnToBeAdded = {
          label: resourceBundle.getText("TargetValue"),
          property: Array.isArray(exportColumns[index].property) ? exportColumns[index].property : [exportColumns[index].property],
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
     */;
    TableExport.isPropertyFromExport = function isPropertyFromExport(column, exportColumn) {
      if (column.relativePath === exportColumn.property || exportColumn.property.includes(column.relativePath) || exportColumn.property.includes(column.name)) {
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
     */;
    TableExport.columnWithTargetValueToBeAdded = function columnWithTargetValueToBeAdded(column, columnExport) {
      let columnNeedsToBeAdded = false;
      if (column.exportDataPointTargetValue && column.propertyInfos?.length === 1) {
        //Add TargetValue column when exporting on split mode
        // part of a FieldGroup or from a lineItem or from a column on the entitySet
        delete columnExport.template;
        columnNeedsToBeAdded = true;
      }
      return columnNeedsToBeAdded;
    };
    return TableExport;
  }();
  _exports = TableExport;
  return _exports;
}, false);
//# sourceMappingURL=TableExport-dbg.js.map

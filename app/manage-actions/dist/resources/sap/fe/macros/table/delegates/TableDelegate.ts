import type { DataFieldAbstractTypes, DataFieldForAnnotation, FieldGroupType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import deepEqual from "sap/base/util/deepEqual";
import deepExtend from "sap/base/util/deepExtend";
import { isConstant } from "sap/fe/base/BindingToolkit";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import type { BaseTreeModifier } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { ListReportManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";

import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import CollaborationManager from "sap/fe/core/controllerextensions/cards/CollaborationManager";
import type {
	AnnotationTableColumn,
	ColumnExportSettings,
	ComputedTableColumn,
	CustomBasedTableColumn,
	TableColumn
} from "sap/fe/core/converters/controls/Common/table/Columns";
import { ColumnType } from "sap/fe/core/converters/controls/Common/table/Columns";
import type { CustomElement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import ValueFormatter from "sap/fe/core/formatters/ValueFormatter";
import DeleteHelper from "sap/fe/core/helpers/DeleteHelper";
import ExcelFormat from "sap/fe/core/helpers/ExcelFormatHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import { getLocalizedText, getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import SizeHelper from "sap/fe/core/helpers/SizeHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isPathFilterable } from "sap/fe/core/templating/DataModelPathHelper";
import { isTypeFilterable } from "sap/fe/core/type/EDM";
import type { CollectionBindingInfo } from "sap/fe/macros/CollectionBindingInfo";
import CollectionBindingInfoAPI from "sap/fe/macros/CollectionBindingInfo";
import CommonHelper from "sap/fe/macros/CommonHelper";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import FilterBarDelegate from "sap/fe/macros/filterBar/FilterBarDelegate";
import { getColumnTemplate, getComputedColumn, getSlotColumn } from "sap/fe/macros/table/MdcTableTemplate";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type { EnhancedFEPropertyInfo } from "sap/fe/macros/table/TableAPI";
import TableHelper from "sap/fe/macros/table/TableHelper";
import TableRuntime from "sap/fe/macros/table/TableRuntime";
import TableSizeHelper from "sap/fe/macros/table/TableSizeHelper";
import type { InternalBindingInfo } from "sap/fe/macros/table/Utils";
import TableUtils from "sap/fe/macros/table/Utils";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type { $IllustratedMessageSettings } from "sap/m/IllustratedMessage";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import type UI5Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import type { JsControlTreeModifier } from "sap/ui/core/util/reflection";
import type Control from "sap/ui/mdc/Control";
import type { default as MDCTable, MDCTablePropertyInfo as PropertyInfo, default as Table, VisualSettings } from "sap/ui/mdc/Table";
import type TypeConfig from "sap/ui/mdc/TypeConfig";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import TableDelegateBase from "sap/ui/mdc/odata/v4/TableDelegate";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type MetaModel from "sap/ui/model/MetaModel";
import type Model from "sap/ui/model/Model";
import Sorter from "sap/ui/model/Sorter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context, default as v4Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import TableEventHandlerProvider from "../TableEventHandlerProvider";

const SEMANTICKEY_HAS_DRAFTINDICATOR = "/semanticKeyHasDraftIndicator";
const SEARCH_HAS_BEEN_FIRED = "searchFired";
const COLUMN_HAS_BEEN_ADDED = "columnAdded";
const PREVIOUS_SORTERS = "previousSorters";

/**
 * Helper class for sap.ui.mdc.Table.
 * <h3><b>Note:</b></h3>
 * The class is experimental and the API and the behavior are not finalized. This class is not intended for productive usage.
 * @author SAP SE
 * @private
 * @experimental
 * @since 1.69.0
 * @alias sap.fe.macros.TableDelegate
 */
export default Object.assign({}, TableDelegateBase, {
	apiVersion: 2,
	/**
	 * This function calculates the width of a FieldGroup column.
	 * The width of the FieldGroup is the width of the widest property contained in the FieldGroup (including the label if showDataFieldsLabel is true)
	 * The result of this calculation is stored in the visualSettings.widthCalculation.minWidth property, which is used by the MDCtable.
	 * @param table Instance of the MDCtable
	 * @param propertyInfo Current propertyInfo
	 * @param propertyInfos Array of properties
	 * @private
	 * @alias sap.fe.macros.TableDelegate
	 */
	_computeVisualSettingsForFieldGroup: function (
		table: Table,
		propertyInfo: EnhancedFEPropertyInfo,
		propertyInfos: EnhancedFEPropertyInfo[]
	) {
		if (propertyInfo.key.indexOf("DataFieldForAnnotation::FieldGroup::") === 0) {
			const column = table.getColumns().find((col) => {
				return col.getPropertyKey() === propertyInfo.key;
			});
			const showDataFieldsLabel = column ? column.data("showDataFieldsLabel") === "true" : false;
			const oMetaModel = (table.getModel() as ODataModel).getMetaModel();
			const involvedDataModelObjects = getInvolvedDataModelObjects(oMetaModel.getContext(propertyInfo.annotationPath));
			const convertedMetaData = involvedDataModelObjects.convertedTypes;
			const oDataField = involvedDataModelObjects.targetObject as DataFieldForAnnotation;
			const oFieldGroup = oDataField.Target.$target as FieldGroupType;
			const aFieldWidth: number[] = [];
			oFieldGroup.Data.forEach(function (oData: DataFieldAbstractTypes) {
				let oDataFieldWidth: { labelWidth: number; propertyWidth: number };
				switch (oData.$Type) {
					case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
						oDataFieldWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(
							oData,
							false,
							propertyInfos,
							convertedMetaData,
							showDataFieldsLabel
						);
						break;
					case "com.sap.vocabularies.UI.v1.DataField":
						oDataFieldWidth = TableSizeHelper.getWidthForDataField(
							oData,
							showDataFieldsLabel,
							propertyInfos,
							convertedMetaData,
							false
						);
						break;
					case "com.sap.vocabularies.UI.v1.DataFieldForAction":
						oDataFieldWidth = {
							labelWidth: 0,
							propertyWidth: SizeHelper.getButtonWidth(oData.Label?.toString())
						};
						break;
					default:
				}
				if (oDataFieldWidth!) {
					aFieldWidth.push(oDataFieldWidth.labelWidth + oDataFieldWidth.propertyWidth);
				}
			});
			const nWidest = aFieldWidth.reduce(function (acc: number, value: number) {
				return Math.max(acc, value);
			}, 0);
			propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings as object, {
				widthCalculation: {
					verticalArrangement: true,
					minWidth: Math.ceil(nWidest)
				}
			});
		}
	},

	_computeVisualSettingsForPropertyWithValueHelp: function (table: Table, property: EnhancedFEPropertyInfo) {
		const tableAPI = table.getParent() as TableAPI;
		if (!property.propertyInfos) {
			const metaModel = (table.getModel() as ODataModel).getMetaModel();
			if (property.annotationPath && metaModel) {
				const dataField = metaModel.getObject(`${property.annotationPath}@`);
				if (dataField && dataField["@com.sap.vocabularies.Common.v1.ValueList"]) {
					property.visualSettings = deepExtend(property.visualSettings || {}, {
						widthCalculation: {
							gap: tableAPI.getProperty("readOnly") ? 0 : 4
						}
					});
				}
			}
		}
	},

	_computeVisualSettingsForPropertyWithUnit: function (
		table: Table,
		propertyInfo: PropertyInfo,
		unit?: string,
		unitText?: string,
		timezoneText?: string
	) {
		const oTableAPI: EnhanceWithUI5<TableAPI> | null = table ? (table.getParent() as EnhanceWithUI5<TableAPI>) : null;
		// update gap for properties with string unit
		const text = unitText || timezoneText;
		if (text) {
			propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings as VisualSettings, {
				widthCalculation: {
					gap: Math.ceil(SizeHelper.getButtonWidth(text))
				}
			});
		}
		if (unit) {
			propertyInfo.visualSettings = deepExtend(propertyInfo.visualSettings as VisualSettings, {
				widthCalculation: {
					// For properties with unit, a gap needs to be added to properly render the column width on edit mode
					gap: oTableAPI && oTableAPI.getReadOnly() ? 0 : 6
				}
			});
		}
	},

	_computeLabel: function (property: EnhancedFEPropertyInfo, labelMap: { [label: string]: EnhancedFEPropertyInfo[] }) {
		if (property.label) {
			const propertiesWithSameLabel = labelMap[property.label];
			// This computation is only for duplicate labels on navigation properties.
			// Exclude text navigation properties referenced as text on a property annotated with text arrangement set as TextOnly.
			// Exclude navigation properties created only for filtering purposes with a text arrangement set to TextOnly.
			const isPropertyUsedAsTextOnlyProperty = propertiesWithSameLabel?.some(
				(prop) => prop.text === property.path && prop?.mode === "Description"
			);
			if (
				propertiesWithSameLabel?.length > 1 &&
				property.path?.includes("/") &&
				property.additionalLabels &&
				!isPropertyUsedAsTextOnlyProperty &&
				!(property?.mode === "Description" && property.filterable)
			) {
				property.label = property.label + " (" + property.additionalLabels.join(" / ") + ")";
			}
			delete property.additionalLabels;
		}
	},
	//Update VisualSetting for columnWidth calculation and labels on navigation properties
	_updatePropertyInfo: function (table: Table, properties: EnhancedFEPropertyInfo[]) {
		const labelMap: { [label: string]: EnhancedFEPropertyInfo[] } = {};
		// Check available p13n modes
		const p13nMode = table.getP13nMode();
		properties.forEach((property) => {
			if (!property.propertyInfos && property.label) {
				// Only for non-complex properties
				if (
					(p13nMode?.includes("Sort") && property.sortable) ||
					(p13nMode?.includes("Filter") && property.filterable) ||
					(p13nMode?.includes("Group") && property.groupable)
				) {
					labelMap[property.label] =
						labelMap[property.label] !== undefined ? labelMap[property.label].concat([property]) : [property];
				}
			}
		});
		properties.forEach((property) => {
			this._computeVisualSettingsForFieldGroup(table, property, properties);
			this._computeVisualSettingsForPropertyWithValueHelp(table, property);
			this._computeLabel(property, labelMap);
		});
		// Add the $editState property
		properties.push({
			key: "$editState",
			path: "$editState",
			groupLabel: "",
			group: "",
			label: "",
			dataType: "sap.ui.model.odata.type.String",
			visible: false,
			groupable: false,
			sortable: false,
			filterable: false
		} as EnhancedFEPropertyInfo);
		return properties;
	},

	getColumnsFor: function (table: Table): TableColumn[] {
		return (table.getParent() as TableAPI).getTableDefinition().columns;
	},

	/**
	 * Returns the export capabilities for the given sap.ui.mdc.Table instance.
	 * @param oTable Instance of the table
	 * @returns Promise representing the export capabilities of the table instance
	 */
	fetchExportCapabilities: async function (oTable: Table): Promise<{ XLSX?: unknown; PDF?: unknown }> {
		const oCapabilities: { XLSX?: unknown; PDF?: unknown } = { XLSX: {} };
		let oModel!: ODataModel;
		return DelegateUtil.fetchModel(oTable)
			.then(function (model: Model) {
				oModel = model as ODataModel;
				return oModel.getMetaModel().getObject("/$EntityContainer@Org.OData.Capabilities.V1.SupportedFormats");
			})
			.then(function (aSupportedFormats: string[] | undefined) {
				const aLowerFormats = (aSupportedFormats || []).map((element) => {
					return element.toLowerCase();
				});
				if (aLowerFormats.includes("application/pdf")) {
					return oModel.getMetaModel().getObject("/$EntityContainer@com.sap.vocabularies.PDF.v1.Features");
				}
				return undefined;
			})
			.then(function (oAnnotation: unknown) {
				if (oAnnotation) {
					oCapabilities["PDF"] = Object.assign({}, oAnnotation);
				}
				return;
			})
			.catch(function (err) {
				Log.error(`An error occurs while computing export capabilities: ${err}`);
			})
			.then(function () {
				return oCapabilities;
			});
	},

	/**
	 * Filtering on navigation properties that are not part of the LineItem annotation nor of the custom columns is forbidden.
	 * @param columnInfo
	 * @param columnDataModelObjectPath
	 * @returns Boolean true if filtering is allowed, false otherwise
	 */
	_isFilterableNavigationProperty: function (
		columnInfo: AnnotationTableColumn,
		columnDataModelObjectPath: DataModelObjectPath<unknown>
	): boolean {
		const isFilterable = isPathFilterable(columnDataModelObjectPath);
		return (
			!columnInfo.relativePath.includes("/") ||
			((columnInfo.isPartOfLineItem === true || columnInfo.isPartOfCustomColumn === true) &&
				!(isConstant(isFilterable) && isFilterable.value === false))
		);
	},

	_fetchPropertyInfo: function (
		metaModel: MetaModel,
		columnInfo: AnnotationTableColumn,
		table: Table,
		appComponent: AppComponent
	): EnhancedFEPropertyInfo {
		const sAbsoluteNavigationPath = columnInfo.annotationPath,
			oDataField = metaModel.getObject(sAbsoluteNavigationPath),
			oNavigationContext = metaModel.createBindingContext(sAbsoluteNavigationPath) as Context,
			isComplexType = columnInfo.typeConfig?.className && columnInfo.typeConfig.className?.indexOf("Edm.") !== 0,
			bFilterable = CommonHelper.isPropertyFilterable(oNavigationContext, oDataField),
			bIsAnalyticalTable = DelegateUtil.getCustomData(table, "enableAnalytics") === "true",
			label = getLocalizedText(columnInfo.label ?? "", appComponent ?? table),
			tooltip = getLocalizedText(columnInfo.tooltip ?? "", appComponent ?? table),
			typeConfig = this._getTypeConfig(columnInfo, isComplexType),
			propertyInfo: EnhancedFEPropertyInfo = {
				name: columnInfo.name,
				key: columnInfo.name,
				annotationPath: sAbsoluteNavigationPath,
				groupLabel: columnInfo.groupLabel,
				group: columnInfo.group,
				label: label,
				tooltip: tooltip,
				dataType: typeConfig.className,
				typeConfig: typeConfig,
				formatOptions:
					columnInfo.typeConfig?.baseType === "Edm.DateTimeOffset"
						? { style: "medium/short" }
						: columnInfo.typeConfig?.formatOptions,
				constraints: (typeConfig.typeInstance as { oConstraints?: object })?.oConstraints, // typeInstance is a SimpleType from MDC typeMap, the type is overwritten to get the constraints. It's possible to use the getConstraints method on the typeInstance but it adds unknown constraints ("isV4") so keeping as it's for now
				visible: columnInfo.availability !== "Hidden" && !isComplexType,
				exportSettings: this._setPropertyInfoExportSettings(columnInfo.exportSettings, columnInfo),
				unit: columnInfo.unit,
				type: ColumnType.Annotation,
				relativePath: columnInfo.relativePath
			};
		if (propertyInfo.exportSettings?.template) {
			propertyInfo.clipboardSettings = { template: propertyInfo.exportSettings.template };
			// if I set this clipBoardSettings the copy provider extract the data according to the template in the html property and it is properly copied in excel
			// but when we copy elsewhere we only get the raw data and not the templated data
		}

		// Set visualSettings only if it exists
		if (columnInfo.visualSettings && Object.keys(columnInfo.visualSettings).length > 0) {
			propertyInfo.visualSettings = columnInfo.visualSettings;
		}

		if (columnInfo.exportDataPointTargetValue) {
			propertyInfo.exportDataPointTargetValue = columnInfo.exportDataPointTargetValue;
		}

		// MDC expects  'propertyInfos' only for complex properties.
		// An empty array throws validation error and undefined value is unhandled.
		if (columnInfo.propertyInfos?.length) {
			propertyInfo.propertyInfos = columnInfo.propertyInfos;
		} else {
			// Add properties which are supported only by simple PropertyInfos.

			//get the DataModelObjectPath for the column
			const columnDataModelObjectPath = getInvolvedDataModelObjects(
				metaModel.getContext(columnInfo.annotationPath),
				metaModel.getContext(DelegateUtil.getCustomData(table, "metaPath")!)
			);
			propertyInfo.path = columnInfo.relativePath;
			// TODO with the new complex property info, a lot of "Description" fields are added as filter/sort fields
			propertyInfo.sortable = columnInfo.sortable;
			if (bIsAnalyticalTable) {
				this._updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo);
			}
			propertyInfo.filterable =
				columnInfo.filterable !== false &&
				!!bFilterable &&
				this._isFilterableNavigationProperty(columnInfo, columnDataModelObjectPath);
			propertyInfo.isKey = columnInfo.isKey;
			propertyInfo.groupable = columnInfo.isGroupable;
			if (columnInfo.textArrangement) {
				this._setTextArrangementInfo(propertyInfo, columnInfo, table);
			}
			if (propertyInfo.isKey) {
				propertyInfo.extension = {
					// MDC needs to fix this, it doesn't make sense for a non Analytical Table
					technicallyGroupable: true
				};
			}
			propertyInfo.caseSensitive = columnInfo.caseSensitive;
			if (columnInfo.additionalLabels) {
				propertyInfo.additionalLabels = columnInfo.additionalLabels.map((additionalLabel: string) => {
					return getLocalizedText(additionalLabel, appComponent || table);
				});
			}
		}

		this._computeVisualSettingsForPropertyWithUnit(table, propertyInfo, columnInfo.unit, columnInfo.unitText, columnInfo.timezoneText);

		return propertyInfo;
	},

	/**
	 * Extend the export settings based on the column info.
	 * @param exportSettings The export settings to be extended
	 * @param columnInfo The columnInfo object
	 * @returns The extended export settings
	 */
	_setPropertyInfoExportSettings: function (
		exportSettings: ColumnExportSettings | undefined | null,
		columnInfo: AnnotationTableColumn
	): ColumnExportSettings | undefined | null {
		const exportFormat = this._getExportFormat(columnInfo.typeConfig?.className);
		if (exportFormat && exportSettings) {
			exportSettings.format = exportFormat;
		}
		return exportSettings;
	},

	/**
	 * Gets the type config for the given column info.
	 * @param columnInfo The columnInfo object.
	 * @param isComplexType Indicates if the dataType is complex.
	 * @returns The MDC type config.
	 */
	_getTypeConfig(columnInfo: AnnotationTableColumn, isComplexType?: boolean): TypeConfig {
		let typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String"); // MDC expects always a dataType
		if (columnInfo.typeConfig?.className && isTypeFilterable(columnInfo.typeConfig.className)) {
			typeConfig = TypeMap.getTypeConfig(
				columnInfo.typeConfig.className,
				columnInfo.typeConfig.formatOptions,
				columnInfo.typeConfig.constraints
			);
		} else if (columnInfo.typeConfig?.className && columnInfo.typeConfig?.className !== "Edm.Stream" && !isComplexType) {
			// Stream isn't supported as a DataType on MDC typeMap
			typeConfig = TypeMap.getTypeConfig(columnInfo.typeConfig.className);
		}
		return typeConfig;
	},
	/**
	 * Set the text arrangement info for the column info.
	 * @param propertyInfo The current propertyInfo object.
	 * @param columnInfo The columnInfo object.
	 * @param table The mdc table control.
	 */
	_setTextArrangementInfo: function (propertyInfo: EnhancedFEPropertyInfo, columnInfo: AnnotationTableColumn, table: Table): void {
		const descriptionColumn = this.getColumnsFor(table).find(function (oCol) {
			return oCol.name === columnInfo.textArrangement?.textProperty;
		});
		if (descriptionColumn) {
			propertyInfo.mode = columnInfo.textArrangement!.mode;
			propertyInfo.valueProperty = columnInfo.relativePath;
			propertyInfo.descriptionProperty = (descriptionColumn as EnhancedFEPropertyInfo).relativePath;
		}
		propertyInfo.text = columnInfo.textArrangement?.textProperty;
	},

	_updateAnalyticalPropertyInfoAttributes(propertyInfo: PropertyInfo, columnInfo: AnnotationTableColumn) {
		if (columnInfo.aggregatable) {
			propertyInfo.aggregatable = columnInfo.aggregatable;
		}
		if (columnInfo.extension) {
			propertyInfo.extension = columnInfo.extension;
		}
	},

	_fetchComputedPropertyInfo: function (columnInfo: ComputedTableColumn, table: Table) {
		const label = getLocalizedText(columnInfo.label, table); // Todo: To be removed once MDC provides translation support
		const propertyInfo: PropertyInfo = {
			key: columnInfo.name,
			label: label.toString(),
			dataType: "sap.ui.model.odata.type.String",
			visible: columnInfo.availability !== "Hidden",
			filterable: false,
			sortable: false,
			groupable: false,
			exportSettings: columnInfo.exportSettings,
			clipboardSettings: columnInfo.clipboardSettings as PropertyInfo["clipboardSettings"]
		};
		if (columnInfo.propertyInfos !== undefined && columnInfo.propertyInfos.length > 0) {
			propertyInfo.propertyInfos = columnInfo.propertyInfos;
		}
		return propertyInfo;
	},

	_fetchCustomPropertyInfo: function (columnInfo: CustomBasedTableColumn, table: Table, appComponent: AppComponent) {
		let label;
		if (columnInfo.header) {
			if (columnInfo.header.startsWith("{metaModel>")) {
				label = ModelHelper.fetchTextFromMetaModel(columnInfo.header, undefined, (table.getModel() as ODataModel).getMetaModel());
			} else {
				label = getLocalizedText(columnInfo.header, appComponent); // Todo: To be removed once MDC provides translation support
			}
		}
		const propertyInfo: PropertyInfo = {
			key: columnInfo.name,
			groupLabel: undefined,
			group: undefined,
			label: label ?? "",
			dataType: "sap.ui.model.odata.type.String",
			visible: columnInfo.availability !== "Hidden",
			exportSettings: columnInfo.exportSettings,
			visualSettings: columnInfo.visualSettings as PropertyInfo["visualSettings"]
		};

		// MDC expects 'propertyInfos' only for complex properties.
		// An empty array throws validation error and undefined value is unhandled.
		if (columnInfo.propertyInfos && columnInfo.propertyInfos.length) {
			propertyInfo.propertyInfos = columnInfo.propertyInfos;
		} else {
			// Add properties which are supported only by simple PropertyInfos.
			propertyInfo.path = columnInfo.name;
			propertyInfo.sortable = false;
			propertyInfo.filterable = false;
		}
		return propertyInfo;
	},
	_bColumnHasPropertyWithDraftIndicator: function (oColumnInfo: TableColumn): boolean {
		return !!(
			(oColumnInfo.formatOptions && oColumnInfo.formatOptions.hasDraftIndicator) ||
			(oColumnInfo.formatOptions && oColumnInfo.formatOptions.fieldGroupDraftIndicatorPropertyPath)
		);
	},
	_updateDraftIndicatorModel: function (_oTable: Table, _oColumnInfo: TableColumn): void {
		const aVisibleColumns = _oTable.getColumns();
		const oInternalBindingContext = _oTable.getBindingContext("internal");
		const sInternalPath = oInternalBindingContext && oInternalBindingContext.getPath();
		if (aVisibleColumns && oInternalBindingContext) {
			for (const index in aVisibleColumns) {
				if (
					this._bColumnHasPropertyWithDraftIndicator(_oColumnInfo) &&
					_oColumnInfo.name === aVisibleColumns[index].getPropertyKey()
				) {
					if (oInternalBindingContext.getProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR) === undefined) {
						oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, _oColumnInfo.name);
						break;
					}
				}
			}
		}
	},
	_fetchPropertiesForEntity: async function (
		table: Table,
		entityTypePath: string,
		metaModel: ODataMetaModel,
		appComponent: AppComponent
	): Promise<PropertyInfo[]> {
		// when fetching properties, this binding context is needed - so lets create it only once and use if for all properties/data-fields/line-items
		const bindingPath = ModelHelper.getEntitySetPath(entityTypePath);
		let fetchedProperties: PropertyInfo[] = [];
		const nonFilterableProperties = CommonUtils.getFilterRestrictionsByPath(bindingPath, metaModel).NonFilterableProperties;
		return Promise.resolve(this.getColumnsFor(table))
			.then((columns: TableColumn[]) => {
				// DraftAdministrativeData does not work via 'entitySet/$NavigationPropertyBinding/DraftAdministrativeData'
				if (columns) {
					let propertyInfo;
					columns.forEach((columnInfo) => {
						this._updateDraftIndicatorModel(table, columnInfo);
						switch (columnInfo.type) {
							case "Annotation":
								propertyInfo = this._fetchPropertyInfo(metaModel, columnInfo as AnnotationTableColumn, table, appComponent);
								if (propertyInfo && !nonFilterableProperties.includes((propertyInfo as AnnotationTableColumn).name)) {
									propertyInfo.maxConditions = DelegateUtil.isMultiValue(propertyInfo as AnnotationTableColumn) ? -1 : 1;
								}
								break;
							case "Computed":
								propertyInfo = this._fetchComputedPropertyInfo(columnInfo as ComputedTableColumn, table);
								break;
							case "Slot":
							case "Default":
								propertyInfo = this._fetchCustomPropertyInfo(columnInfo as CustomBasedTableColumn, table, appComponent);
								break;
							default:
								throw new Error(`unhandled switch case ${columnInfo.type}`);
						}
						fetchedProperties.push(propertyInfo as EnhancedFEPropertyInfo);
					});
				}
				return;
			})
			.then(() => {
				fetchedProperties = this._updatePropertyInfo(table, fetchedProperties as EnhancedFEPropertyInfo[]);
				const tableAPI = table.getParent() as TableAPI;
				tableAPI.setEnhancedFetchedPropertyInfos(fetchedProperties as EnhancedFEPropertyInfo[]);
				fetchedProperties = tableAPI.getPropertyInfos();
				return;
			})
			.catch(function (err) {
				Log.error(`An error occurs while updating fetched properties: ${err as string}`);
			})
			.then(function () {
				return fetchedProperties;
			});
	},

	_getCachedOrFetchPropertiesForEntity: async function (
		table: Table,
		entityTypePath: string,
		metaModel: ODataMetaModel,
		appComponent: AppComponent
	): Promise<PropertyInfo[]> {
		const tableAPI = table.getParent() as TableAPI;
		const fetchedProperties = tableAPI.getCachedPropertyInfos();
		if (fetchedProperties.length) {
			return Promise.resolve(fetchedProperties);
		}
		return this._fetchPropertiesForEntity(table, entityTypePath, metaModel, appComponent).then(function (
			subFetchedProperties: PropertyInfo[]
		) {
			tableAPI.setCachedPropertyInfos(subFetchedProperties);
			return subFetchedProperties;
		});
	},
	setNoDataInformation: function (table: Table, illustratedMessageInformation: $IllustratedMessageSettings): void {
		const noDataAggregation = table.getNoData();
		if (typeof noDataAggregation != "string" && (noDataAggregation as Control)?.isA("sap.m.IllustratedMessage")) {
			const currentIllustratedMessage = noDataAggregation as IllustratedMessage;
			// We override the current values of the IllustratedMessage
			currentIllustratedMessage.setTitle(illustratedMessageInformation.title);
			currentIllustratedMessage.setDescription(illustratedMessageInformation.description);
			currentIllustratedMessage.setIllustrationType(illustratedMessageInformation.illustrationType);
			currentIllustratedMessage.setIllustrationSize(illustratedMessageInformation.illustrationSize);
		} else {
			const illustratedMessage = new IllustratedMessage({
				...illustratedMessageInformation
			});
			table.setNoData(illustratedMessage);
		}
	},

	setTableNoDataIllustratedMessage: function (table: Table, bindingInfo: CollectionBindingInfo) {
		const tableFilterInfo = TableUtils.getAllFilterInfo(table);
		const resourceModel = getResourceModel(table);
		const suffixResourceKey = bindingInfo.path?.startsWith("/") ? bindingInfo.path.substring(1) : bindingInfo.path;
		let illustratedInformation: $IllustratedMessageSettings;

		const getNoDataIllustratedMessageWithFilters = function (): $IllustratedMessageSettings {
			if (table.data("hiddenFilters") || table.getQuickFilter()) {
				return {
					title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
					description: resourceModel.getText("M_TABLE_AND_CHART_NO_DATA_TEXT_MULTI_VIEW", undefined, suffixResourceKey),
					illustrationType: IllustratedMessageType.NoSearchResults
				};
			}
			return {
				title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
				description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER", undefined, suffixResourceKey),
				illustrationType: IllustratedMessageType.NoSearchResults
			};
		};

		const filterAssociation = table.getFilter();
		const hasFilterOrSearch = tableFilterInfo.search || tableFilterInfo.filters?.length;
		if (filterAssociation && !/BasicSearch$/.test(filterAssociation)) {
			// check if a FilterBar is associated to the Table (basic search on toolBar is excluded)
			if (hasFilterOrSearch) {
				// check if table has any Filterbar filters or personalization filters
				illustratedInformation = getNoDataIllustratedMessageWithFilters();
			} else {
				illustratedInformation = {
					title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
					description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT", undefined, suffixResourceKey),
					illustrationType: IllustratedMessageType.NoSearchResults
				};
			}
		} else if (hasFilterOrSearch) {
			//check if table has any personalization filters
			illustratedInformation = getNoDataIllustratedMessageWithFilters();
		} else {
			illustratedInformation = {
				title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NODATA"),
				description: resourceModel.getText("M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT", undefined, suffixResourceKey),
				illustrationType: IllustratedMessageType.NoData
			};
		}
		if (CommonUtils.getTargetView(table).getViewData().liveMode) {
			illustratedInformation = {
				title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS"),
				description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER"),
				illustrationType: IllustratedMessageType.NoSearchResults
			};
		}
		illustratedInformation.illustrationSize = (table.getParent() as TableAPI).getNoDataMessageMode();

		if (illustratedInformation.illustrationSize === "text") {
			const currentNoData = table.getNoData();
			if (typeof currentNoData === "string" && currentNoData === illustratedInformation.description) {
				// We don't change the noData aggregation unnecessary.
				return;
			}
			table.setNoData(illustratedInformation.description);
		} else {
			this.setNoDataInformation(table, illustratedInformation);
		}
	},

	handleTableDataReceived: function (oTable: Table, oInternalModelContext: InternalModelContext): void {
		const oBinding = oTable && oTable.getRowBinding(),
			bDataReceivedAttached = oInternalModelContext && oInternalModelContext.getProperty("dataReceivedAttached");

		if (oInternalModelContext && !bDataReceivedAttached) {
			oBinding.attachDataReceived(() => {
				// as the dataReceived event is fired multiple times, we need to ensure that the event is only handled once
				if (!oInternalModelContext.getProperty("dataReceivedTimeoutSet")) {
					oInternalModelContext.setProperty("dataReceivedTimeoutSet", true);
					setTimeout(() => {
						oInternalModelContext.setProperty("dataReceivedTimeoutSet", false);
						// Refresh the selected contexts to trigger re-calculation of enabled state of actions.
						oInternalModelContext.setProperty("selectedContexts", []);
						const aSelectedContexts = oTable.getSelectedContexts() as ODataV4Context[];
						oInternalModelContext.setProperty("selectedContexts", aSelectedContexts);
						oInternalModelContext.setProperty("numberOfSelectedContexts", aSelectedContexts.length);
						const tableAPI = oTable.getParent() as TableAPI;
						const oActionOperationAvailableMap = JSON.parse(tableAPI.tableDefinition.operationAvailableMap);
						ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, "table");
						// Refresh enablement of delete button
						DeleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);
						const oTableAPI = oTable ? oTable.getParent() : null;
						if (oTableAPI) {
							(oTableAPI as TableAPI).setUpEmptyRows(oTable);
						}
						this._updateAvailableCards(oTable);
					}, 0);
				}
			});
			oInternalModelContext.setProperty("dataReceivedAttached", true);
		}
	},

	/**
	 * Set the optimistic batch promise for the enabler callback function.
	 * @param controller The controller
	 * @param tableAPI The TableAPI
	 */
	setOptimisticBatchPromiseForModel: function (controller: ListReportController, tableAPI: TableAPI): void {
		const model = controller.getAppComponent().getModel();
		if (model) {
			tableAPI.setOptimisticBatchEnablerPromise(new PromiseKeeper<boolean>());
			this.setOptimisticBatchForModel(controller, model, tableAPI);
		}
	},

	/**
	 * Enable the optimistic batch mode if available.
	 * @param controller
	 * @param table
	 */
	enableOptimisticBatchMode: function (controller: ListReportController, table: Table): void {
		const filtersPropertiesAsPotentiallySensitiveDataOrDateType =
			table && TableUtils.isFilterEligibleForOptimisticBatch(table, controller._getFilterBarControl() as FilterBar);
		(table.getParent() as TableAPI).getOptimisticBatchEnablerPromise()?.resolve(!filtersPropertiesAsPotentiallySensitiveDataOrDateType);
	},

	/**
	 * Setter for the optimistic batch enabler callback function.
	 * @param controller
	 * @param dataModel The OData Model
	 * @param tableAPI The TableAPI
	 * @see {sap.ui.model.odata.v4.ODataModel#setOptimisticBatchEnabler} for further information.
	 */
	setOptimisticBatchForModel: function (controller: ListReportController, dataModel: ODataModel, tableAPI: TableAPI): void {
		const isOptimisticBatchHasToBeEnabled = controller.getAppComponent().getShellServices().isFlpOptimisticBatchPluginLoaded();
		if (dataModel.getOptimisticBatchEnabler() === null && !tableAPI.isOptimisticBatchDisabled() && isOptimisticBatchHasToBeEnabled) {
			const optimisticBatchEnablerPromiseKeeper = tableAPI.getOptimisticBatchEnablerPromise();
			dataModel.setOptimisticBatchEnabler(function (): Promise<boolean> | undefined {
				return optimisticBatchEnablerPromiseKeeper?.promise;
			});
		}
	},

	rebind: async function (oTable: Table, oBindingInfo: BaseAggregationBindingInfo): Promise<void> {
		const oTableAPI = oTable.getParent() as TableAPI;
		const bIsSuspended = oTableAPI?.getProperty("bindingSuspended");
		oTableAPI?.setProperty("outDatedBinding", bIsSuspended);
		if (!bIsSuspended) {
			TableRuntime.clearSelection(oTable);
			TableDelegateBase.rebind.apply(this, [oTable, oBindingInfo]);
			TableUtils.onTableBound(oTable);
			return TableUtils.whenBound(oTable)
				.then((table: Table): void => {
					this.handleTableDataReceived(table, table.getBindingContext("internal") as InternalModelContext);
					return;
				})
				.catch(function (oError) {
					Log.error("Error while waiting for the table to be bound", oError as string);
				});
		}
		return Promise.resolve();
	},

	/**
	 * Fetches the relevant metadata for the table and returns property info array.
	 * @param table Instance of the MDCtable
	 * @returns Array of property info
	 */
	fetchProperties: async function (table: Table): Promise<PropertyInfo[]> {
		return DelegateUtil.fetchModel(table)
			.then(async (model): Promise<PropertyInfo[]> => {
				const appComponent = CommonUtils.getAppComponent(table);
				return this._getCachedOrFetchPropertiesForEntity(
					table,
					DelegateUtil.getCustomData<string>(table, "entityType") ?? "",
					model.getMetaModel() as ODataMetaModel,
					appComponent
				);
			})
			.then((properties) => {
				(table.getBindingContext("internal") as Context)?.setProperty("tablePropertiesAvailable", true);
				return properties;
			});
	},

	preInit: async function (table: Table): Promise<void> {
		return (TableDelegateBase.preInit as (table: Table) => Promise<void>).apply(this, [table]).then(() => {
			/**
			 * Set the binding context to null for every fast creation row to avoid inheriting
			 * the wrong context and requesting the table columns on the parent entity
			 * Set the correct binding context in ObjectPageController.enableFastCreationRow()
			 */
			const fastCreationRow = table.getCreationRow();
			if (fastCreationRow) {
				fastCreationRow.setBindingContext(null as unknown as Context);
			}
			return;
		});
	},
	updateBindingInfo: function (table: Table, bindingInfo: CollectionBindingInfo) {
		const internalBindingContext = table.getBindingContext("internal") as InternalModelContext | undefined;
		internalBindingContext?.setProperty("isInsightsEnabled", true);
		TableDelegateBase.updateBindingInfo.apply(this, [table, bindingInfo]);
		try {
			this._handleSortersOnCurrenciesOrUoM(table, bindingInfo);
			this._internalUpdateBindingInfo(table, bindingInfo);
			this.setTableNoDataIllustratedMessage(table, bindingInfo);
			this._handleRecommendationOutputFields(table, bindingInfo);
			this._handleFiltersForExternalID(table, bindingInfo);

			table.getParent()?.fireEvent("beforeRebindTable", { collectionBindingInfo: new CollectionBindingInfoAPI(bindingInfo) });
			/**
			 * We have to set the binding context to null for every fast creation row to avoid it inheriting
			 * the wrong context and requesting the table columns for the parent entity
			 * The correct binding context is set in ObjectPageController.enableFastCreationRow()
			 */
			const context = table.getBindingContext();
			// eslint-disable-next-line deprecation/deprecation
			if (table.getCreationRow()?.getBindingContext() === null && bindingInfo.path && context) {
				TableHelper.enableFastCreationRow(
					// eslint-disable-next-line deprecation/deprecation
					table.getCreationRow(),
					bindingInfo.path,
					context as v4Context,
					table.getModel() as ODataModel,
					Promise.resolve()
				);
			}
		} catch (e) {
			Log.error("Error while updating the binding info", e as string);
		}
	},

	_handleSortersOnCurrenciesOrUoM: function (table: Table, bindingInfo: CollectionBindingInfo) {
		const sorters: Sorter[] | undefined = bindingInfo.sorter;
		const newSortersToBeApplied: Sorter[] = [];
		if (sorters?.length) {
			const tableAPI = table.getParent() as TableAPI;
			const tableProperties = tableAPI.getCachedPropertyInfos();
			for (const sorter of sorters) {
				const tableProperty = tableProperties?.find((property) => property.path === sorter.getPath());
				if (tableProperty?.unit) {
					const unitProperty = tableProperties?.find((property) => property.key === tableProperty?.unit);
					const unitSorterAvailable = unitProperty?.path && sorters.some((sort) => sort.getPath() === unitProperty.path);
					if (!unitSorterAvailable && unitProperty?.sortable !== false && unitProperty?.path) {
						newSortersToBeApplied.push(new Sorter(unitProperty.path, false));
					}
				}
				newSortersToBeApplied.push(sorter);
			}
			bindingInfo.sorter = newSortersToBeApplied;
		}
	},

	_handleFiltersForExternalID: function (table: Table, bindingInfo: CollectionBindingInfo) {
		const metaModel = (table.getModel() as ODataModel)?.getMetaModel();
		const entityTypePath = bindingInfo.path + "/";
		const filters = bindingInfo.filters?.getFilters();
		if (filters !== undefined) {
			TableUtils.updateFiltersForExternalID(metaModel, filters as unknown as ConditionObject[], entityTypePath);
		}
	},

	_handleRecommendationOutputFields: function (table: Table, oBindingInfo: CollectionBindingInfo) {
		const tableAPI = table.getParent() as TableAPI;
		const controller = tableAPI?.getPageController();
		if (controller?.recommendations.isRecommendationEnabled()) {
			const appComponent = controller.getAppComponent();
			const tableDef = tableAPI.getTableDefinition();
			const recommendationOutputProperties = appComponent
				.getSideEffectsService()
				.getRecommendationOutputFields(tableDef.annotation.entityTypeName);
			if (recommendationOutputProperties && recommendationOutputProperties.length > 0 && oBindingInfo.parameters) {
				oBindingInfo.parameters.$select = oBindingInfo.parameters?.$select?.concat(",", recommendationOutputProperties.join());
			}
		}
	},

	/**
	 * Update the cards when the binding is refreshed.
	 * @param table The mdc table control.
	 */
	_updateAvailableCards: async function (table: Table): Promise<void> {
		const tableAPI = table.getParent() as TableAPI;
		if (tableAPI.getPageController().getView().getViewData()?.converterType === "ListReport") {
			const appComponent = tableAPI?.getPageController()?.getAppComponent();
			const cards: WrappedCard[] = [];
			await tableAPI.collectAvailableCards(cards);
			const collaborationManager = new CollaborationManager();
			const cardObject = collaborationManager.updateCards(cards);
			const parentAppId = appComponent.getId();
			appComponent.getCollaborationManagerService().addCardsToCollaborationManager(cardObject, parentAppId);
			appComponent.getCollaborationManagerService().shareAvailableCards();
		}
	},

	/**
	 * The hook implemented by MDC that we can override.
	 * This allows us to define properties to be requested in the MDC table (Main case is for the analytical table).
	 * @param table The mdc table control.
	 * @returns An array of property name to be requested.
	 */
	getInResultPropertyKeys: function (table: MDCTable): string[] {
		const tableAPI = table.getParent() as TableAPI;
		if (tableAPI.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
			const allKkeysRequested = this.checkAllKeysAreRequested(tableAPI);
			const internalBindingContext = table.getBindingContext("internal");
			// if a rowpress is overridden, we  should enable the navigation at the node level
			internalBindingContext?.setProperty("isNodeLevelNavigable", tableAPI.overrideRowPress ? true : allKkeysRequested);
			return (
				Object.keys(tableAPI.tableDefinition.requestAtLeast)
					// for analytic tables with aggregationOnLeafLevel we should not request the semanticKey expected when all keys are requested ->  it will permits to navigate from a node level when semanticKey are enabled
					// restriction are also excluded as we cannot destinguish between a node and a aggregation level

					.filter((fieldName: string) =>
						!allKkeysRequested
							? tableAPI.tableDefinition.requestAtLeast[fieldName].some(
									(origin) => origin !== "restriction" && origin !== "semanticKey"
							  )
							: true
					)
			);
		}
		return Object.keys(tableAPI.tableDefinition.requestAtLeast ?? {});
	},

	/**
	 * Check if all keys() excepted IsActiveEntity) are requested in the table.
	 * @param tableAPI The table API
	 * @returns  True if all keys are requested, false otherwise
	 */
	checkAllKeysAreRequested: function (tableAPI: TableAPI): boolean {
		const table = tableAPI.getContent();
		const allColumns = tableAPI.getTableDefinition().columns as (TableColumn & { isKey: boolean; relativePath: string })[];
		const keyPropertyNames = allColumns
			.filter((c) => c.isKey && c.relativePath && c.relativePath !== "IsActiveEntity")
			.map((c) => c.relativePath);

		const displayedColumns = table
			.getColumns()
			.map((column) => tableAPI.getTableDefinition().columns.find((c) => c.name === column.getPropertyKey()));

		// Store all properties referenced by displayed columns in a Set
		const referencedPropertyPaths = new Set<string>();
		function processColumn(col: AnnotationTableColumn): void {
			// Add the property name from column itself if it's not a complex propertyInfo
			if (col.relativePath && col.propertyInfos === undefined) {
				referencedPropertyPaths.add(col.relativePath);
			}

			// Add the additional properties referenced by the column
			col.extension?.additionalProperties?.forEach((additionalColumnName) => {
				const additionalColumn = allColumns.find((c) => c.name === additionalColumnName);
				if (additionalColumn?.relativePath) {
					referencedPropertyPaths.add(additionalColumn.relativePath);
				}
			});
		}
		displayedColumns.forEach((column) => {
			if (!column) {
				return;
			}
			// Process the column itself
			processColumn(column as AnnotationTableColumn);

			// Process the columns referenced by the column
			column.propertyInfos?.forEach((relatedColumnName) => {
				const relatedColumn = allColumns.find((c) => c.name === relatedColumnName);
				if (relatedColumn) {
					processColumn(relatedColumn as AnnotationTableColumn);
				}
			});
		});

		return keyPropertyNames.every((propName) => propName && referencedPropertyPaths.has(propName));
	},

	updateBinding: function (table: MDCTable, bindingInfo: CollectionBindingInfo, binding?: ODataListBinding): void {
		const tableAPI = table.getParent() as TableAPI;
		const bIsSuspended = tableAPI?.getProperty("bindingSuspended");
		if (!bIsSuspended) {
			let needManualRefresh = false;
			const view = CommonUtils.getTargetView(table);
			const internalBindingContext = table.getBindingContext("internal");
			const manualUpdatePropertyKey = "pendingManualBindingUpdate";
			const pendingManualUpdate = internalBindingContext?.getProperty(manualUpdatePropertyKey) as boolean;
			const newSorters = JSON.stringify(bindingInfo.sorter ?? []);

			if (binding) {
				/**
				 * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
				 * is not enough to trigger a batch request.
				 * Removing columns creates one batch request that was not executed before
				 */
				const viewData = view?.getViewData() as ListReportManifestSettings;
				const oldFilters = binding.getFilters("Application");
				const previousSorters = internalBindingContext?.getProperty(PREVIOUS_SORTERS) ?? "[]";

				const filterNotChanged =
					deepEqual(bindingInfo.filters, oldFilters[0]) &&
					newSorters === previousSorters &&
					bindingInfo.path === binding.getPath() && // The path can be changed in case of a parametrized entity
					binding.getQueryOptionsFromParameters().$search === bindingInfo?.parameters?.$search;
				const LRMultiViewEnabled = !!viewData.views;

				needManualRefresh =
					filterNotChanged &&
					(internalBindingContext?.getProperty(SEARCH_HAS_BEEN_FIRED) || // check if the search has been triggered
						internalBindingContext?.getProperty(COLUMN_HAS_BEEN_ADDED) || // check if a column has been added
						LRMultiViewEnabled) && // if the multi view is enabled the request should be refreshed as we don't known if the content of the table is outdated due to an action on another table
					!pendingManualUpdate;
			}
			// Cleanup groupConditions and aggregateConditions if they don't make sense
			if (tableAPI.getTableDefinition().enableAnalytics !== true) {
				// Aggregate conditions never make sense outside of an analytical table
				table.setAggregateConditions();

				// Group conditions don't make sense in a Tree or Grid table
				if (
					tableAPI.getTableDefinition().control.type === "GridTable" ||
					tableAPI.getTableDefinition().control.type === "TreeTable"
				) {
					table.setGroupConditions();
				}
			}
			TableDelegateBase.updateBinding.apply(this, [table, bindingInfo, binding]);
			// we store the table binding info that was used to bind the table in the table API
			// this needs to be done after the call to TableDelegateBase.updateBinding other wise we don't get the aggregate parameters
			// otherwise there is no way to retrieve sorters added in the onBeforeRebindTable event
			tableAPI.setTableBindingInfo(bindingInfo);
			// we make the call to update the download url but do not await it
			tableAPI.setDownloadUrl();

			table.fireEvent("bindingUpdated");
			if (needManualRefresh && table.getFilter() && binding) {
				binding
					.requestRefresh(binding.getGroupId())
					.finally(() => {
						internalBindingContext?.setProperty(manualUpdatePropertyKey, false);
					})
					.catch(function (oError) {
						Log.error("Error while refreshing the table", oError as string);
					});
				internalBindingContext?.setProperty(manualUpdatePropertyKey, true);
			}
			internalBindingContext?.setProperty(SEARCH_HAS_BEEN_FIRED, false);
			internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, false);
			internalBindingContext?.setProperty(PREVIOUS_SORTERS, newSorters);

			//for Treetable, it's necessary to clear the pastableContexts since the binding destroys previous contexts.
			if (tableAPI.getTableDefinition().control.type === "TreeTable") {
				internalBindingContext?.setProperty("pastableContexts", []);
			}
		}
		tableAPI?.setProperty("outDatedBinding", bIsSuspended);
	},

	_computeRowBindingInfoFromTemplate: function (oTable: Table): CollectionBindingInfo {
		const tableAPI = oTable.getParent() as TableAPI;
		const rowBindingInfo = tableAPI.getTableTemplateBindingInfo();
		const bindingContext = oTable.getBindingContext();
		let tableCanBeInInlineEdit = false;
		if (
			bindingContext === undefined &&
			oTable.getBindingContext("ui")?.getProperty("isEditable") === false &&
			oTable.getModel("viewData")?.getProperty("/isInlineEditEnabled")
		) {
			tableCanBeInInlineEdit = true;
		} else if (
			(bindingContext as ODataV4Context | undefined)?.getBinding().getUpdateGroupId() == CommonUtils.INLINEEDIT_UPDATEGROUPID
		) {
			tableCanBeInInlineEdit = true;
		}

		if (tableCanBeInInlineEdit) {
			rowBindingInfo.parameters ??= {};
			rowBindingInfo.parameters.$$updateGroupId = CommonUtils.INLINEEDIT_UPDATEGROUPID;
		}

		// if the rowBindingInfo has a $$getKeepAliveContext parameter we need to check it is the only Table with such a
		// parameter for the collectionMetaPath
		if (rowBindingInfo.parameters?.$$getKeepAliveContext === true) {
			const collectionPath = DelegateUtil.getCustomData<string>(oTable, "targetCollectionPath") ?? "";
			const internalModel = oTable.getModel("internal") as JSONModel;
			const keptAliveLists = internalModel?.getObject("/keptAliveLists") ?? {};
			if (!keptAliveLists[collectionPath]) {
				keptAliveLists[collectionPath] = oTable.getId();
				internalModel?.setProperty("/keptAliveLists", keptAliveLists);
			} else if (keptAliveLists[collectionPath] !== oTable.getId()) {
				delete rowBindingInfo.parameters.$$getKeepAliveContext;
			}
		}

		return rowBindingInfo;
	},
	_internalUpdateBindingInfo: function (oTable: Table, oBindingInfo: CollectionBindingInfo) {
		const oInternalModelContext = oTable.getBindingContext("internal") as InternalModelContext | undefined;
		Object.assign(oBindingInfo, this._computeRowBindingInfoFromTemplate(oTable));
		/**
		 * Binding info might be suspended at the beginning when the first bindRows is called:
		 * To avoid duplicate requests but still have a binding to create new entries.				 *
		 * After the initial binding step, follow up bindings should no longer be suspended.
		 */
		if (oTable.getRowBinding()) {
			oBindingInfo.suspended = false;
		}
		// The previously added handler for the event 'dataReceived' is not anymore there
		// since the bindingInfo is recreated from scratch so we need to set the flag to false in order
		// to again add the handler on this event if needed
		if (oInternalModelContext) {
			oInternalModelContext.setProperty("dataReceivedAttached", false);
		}

		let oFilter;
		const oFilterInfo = TableUtils.getAllFilterInfo(oTable);
		// Prepare binding info with filter/search parameters
		if (oFilterInfo.filters.length > 0) {
			oFilter = new Filter({ filters: oFilterInfo.filters, and: true });
		}
		if (oFilterInfo.bindingPath) {
			oBindingInfo.path = oFilterInfo.bindingPath;
		}

		const oDataStateIndicator = oTable.getDataStateIndicator();
		if (oDataStateIndicator && oDataStateIndicator.isFiltering()) {
			// Include filters on messageStrip
			if ((oBindingInfo.filters as unknown as Filter[]).length > 0) {
				oFilter = new Filter({ filters: (oBindingInfo.filters as unknown as Filter[]).concat(oFilterInfo.filters), and: true });
				this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
			}
		} else {
			this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
		}

		this.addFilterOnActiveEntities(oTable, oBindingInfo);
	},

	updateBindingInfoWithSearchQuery: function (bindingInfo: CollectionBindingInfo, filterInfo: InternalBindingInfo, filter?: Filter) {
		bindingInfo.filters = filter;
		bindingInfo.parameters ??= {};
		if (filterInfo.search) {
			bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterInfo.search);
		} else {
			bindingInfo.parameters.$search = undefined;
		}
	},
	/**
	 * If specified in the payload, adds a filter to display only active entities.
	 * @param table
	 * @param bindingInfo
	 */
	addFilterOnActiveEntities: function (table: Table, bindingInfo: CollectionBindingInfo) {
		const payload = table.getPayload() as { filterOnActiveEntities?: boolean };

		if (payload?.filterOnActiveEntities === true) {
			const filterOnActive = new Filter({ path: "IsActiveEntity", operator: "EQ", value1: true });
			if (bindingInfo.filters) {
				bindingInfo.filters = new Filter({ filters: [filterOnActive, bindingInfo.filters], and: true });
			} else {
				bindingInfo.filters = filterOnActive;
			}
		}
	},

	/**
	 * Creates a template from the fragment of a slot column.
	 * @param columnInfo The custom table column
	 * @param view The current view
	 * @param modifier The control tree modifier
	 * @param tableId The id of the underlying table
	 * @returns The loaded fragment
	 */
	_templateSlotColumnFragment: async function (
		columnInfo: CustomElement<CustomBasedTableColumn>,
		view: View,
		modifier: BaseTreeModifier | JsControlTreeModifier,
		tableId: string
	): Promise<null | Control | Control[] | Element> {
		const slotColumnsXML = new DOMParser().parseFromString(
			jsx.renderAsXML(() => {
				return getSlotColumn(tableId, columnInfo, false) as unknown as string;
			}),
			"text/xml"
		);
		if (!slotColumnsXML) {
			return Promise.resolve(null);
		}
		const slotXML = slotColumnsXML.getElementsByTagName("slot")[0];

		if (columnInfo.template) {
			if (slotXML) {
				const oTemplate = new DOMParser().parseFromString(columnInfo.template as string, "text/xml");
				if (oTemplate.firstElementChild && oTemplate.firstElementChild.nodeName !== "html") {
					slotXML.replaceWith(oTemplate.firstElementChild);
				} else {
					slotXML.remove();
				}
			}
		} else {
			Log.error(`Please provide content inside this Building Block Column: ${columnInfo.header}`);
			return Promise.resolve(null);
		}
		const resultXML = await XMLPreprocessor.process(
			slotColumnsXML.firstElementChild,
			{ models: {} },
			(view.getController().getOwnerComponent() as EnhanceWithUI5<TemplateComponent>).getPreprocessorContext()
		);
		if (modifier?.targets !== "jsControlTree") {
			return resultXML.firstElementChild;
		}
		return Fragment.load({
			type: "XML",
			definition: resultXML,
			controller: view.getController()
		}) as Promise<Control | Control[]>;
	},

	_getExportFormat: function (dataType?: string) {
		switch (dataType) {
			case "Edm.Date":
				return ExcelFormat.getExcelDatefromJSDate();
			case "Edm.DateTimeOffset":
				return ExcelFormat.getExcelDateTimefromJSDateTime();
			case "Edm.TimeOfDay":
				return ExcelFormat.getExcelTimefromJSTime();
			default:
				return undefined;
		}
	},

	_getVHRelevantFields: function (oMetaModel: ODataMetaModel, sMetadataPath: string, sBindingPath?: string): string[] {
		let aFields: string[] = [],
			oDataFieldData = oMetaModel.getObject(sMetadataPath);

		if (oDataFieldData.$kind && oDataFieldData.$kind === "Property") {
			oDataFieldData = oMetaModel.getObject(`${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
			sMetadataPath = `${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`;
		}
		switch (oDataFieldData.$Type) {
			case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
				if (oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath`).includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
					oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath/Data`).forEach((oValue: unknown, iIndex: number) => {
						aFields = aFields.concat(
							this._getVHRelevantFields(oMetaModel, `${sMetadataPath}/Target/$AnnotationPath/Data/${iIndex}`)
						);
					});
				}
				break;
			case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
			case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
			case "com.sap.vocabularies.UI.v1.DataField":
			case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
			case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
				aFields.push(oMetaModel.getObject(`${sMetadataPath}/Value/$Path`));
				break;
			case "com.sap.vocabularies.UI.v1.DataFieldForAction":
			case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
				break;
			default:
				// property
				// temporary workaround to make sure VH relevant field path do not contain the bindingpath
				if (sBindingPath && sMetadataPath.indexOf(sBindingPath) === 0) {
					aFields.push(sMetadataPath.substring(sBindingPath.length + 1));
					break;
				}
				aFields.push(CommonHelper.getNavigationPath(sMetadataPath, true));
				break;
		}
		return aFields;
	},
	_setDraftIndicatorOnVisibleColumn: function (oTable: Table, aColumns: TableColumn[], oColumnInfo?: TableColumn) {
		const oInternalBindingContext = oTable.getBindingContext("internal");
		if (!oInternalBindingContext) {
			return;
		}
		const sInternalPath = oInternalBindingContext.getPath();
		const aColumnsWithDraftIndicator = aColumns.filter((oColumn: TableColumn) => {
			return this._bColumnHasPropertyWithDraftIndicator(oColumn);
		});
		const aVisibleColumns = oTable.getColumns();
		let sAddVisibleColumnName, sVisibleColumnName, bFoundColumnVisibleWithDraft, sColumnNameWithDraftIndicator;
		for (const i in aVisibleColumns) {
			sVisibleColumnName = aVisibleColumns[i].getPropertyKey();
			for (const j in aColumnsWithDraftIndicator) {
				sColumnNameWithDraftIndicator = aColumnsWithDraftIndicator[j].name;
				if (sVisibleColumnName === sColumnNameWithDraftIndicator) {
					bFoundColumnVisibleWithDraft = true;
					break;
				}
				if (oColumnInfo && oColumnInfo.name === sColumnNameWithDraftIndicator) {
					sAddVisibleColumnName = oColumnInfo.name;
				}
			}
			if (bFoundColumnVisibleWithDraft) {
				oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sVisibleColumnName);
				break;
			}
		}
		if (!bFoundColumnVisibleWithDraft && sAddVisibleColumnName) {
			oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sAddVisibleColumnName);
		}
	},
	removeItem: async function (
		oTable: UI5Element | Element,
		oPropertyInfoName: UI5Element | Element,
		mPropertyBag: { modifier: BaseTreeModifier; appComponent: AppComponent }
	): Promise<boolean> {
		let doRemoveItem = true;
		if (!oPropertyInfoName) {
			// 1. Application removed the property from their data model
			// 2. addItem failed before revertData created
			return Promise.resolve(doRemoveItem);
		}
		const oModifier = mPropertyBag.modifier;
		const sDataProperty = await oModifier.getProperty<string>(oPropertyInfoName, "dataProperty");
		if (sDataProperty && sDataProperty.includes && sDataProperty.includes("InlineXML")) {
			oModifier.insertAggregation(oTable, "dependents", oPropertyInfoName);
			doRemoveItem = false;
		}
		if ((oTable as UI5Element).isA && oModifier.targets === "jsControlTree") {
			this._setDraftIndicatorStatus(oModifier, oTable, this.getColumnsFor(oTable as Table));
		}
		return Promise.resolve(doRemoveItem);
	},
	_getMetaModel: function (mPropertyBag: { appComponent: AppComponent }) {
		return mPropertyBag.appComponent && mPropertyBag.appComponent.getModel().getMetaModel();
	},
	_setDraftIndicatorStatus: function (
		oModifier: BaseTreeModifier,
		oTable: UI5Element | Element,
		aColumns: TableColumn[],
		oColumnInfo?: TableColumn
	) {
		if (oModifier.targets === "jsControlTree") {
			this._setDraftIndicatorOnVisibleColumn(oTable as Table, aColumns, oColumnInfo);
		}
	},
	_getGroupId: function (sRetrievedGroupId: string) {
		return sRetrievedGroupId || undefined;
	},
	_insertAggregation: async function (
		oValueHelp: Element | UI5Element | Element[] | UI5Element[],
		oModifier: BaseTreeModifier,
		oTable: Element | UI5Element
	): Promise<void> {
		if (oValueHelp) {
			return oModifier.insertAggregation(oTable, "dependents", oValueHelp, 0);
		}
		return;
	},

	/**
	 * Invoked when a column is added using the table personalization dialog.
	 * @param oTable Instance of table control
	 * @param sPropertyInfoName Name of the property for which the column is added
	 * @param mPropertyBag Instance of property bag from the flexibility API
	 * @param mPropertyBag.modifier Instance of the control tree modifier
	 * @param mPropertyBag.appComponent Instance of the app component
	 * @param mPropertyBag.view Instance of the view
	 * @returns Once resolved, a table column definition is returned
	 */
	addItem: async function (
		table: Element | UI5Element,
		propertyInfoName: string,
		mPropertyBag: { modifier: BaseTreeModifier; appComponent: AppComponent; view?: FEView }
	) {
		const oMetaModel = this._getMetaModel(mPropertyBag),
			oModifier = mPropertyBag.modifier,
			sTableId = oModifier.getId(table),
			aColumns = (table as UI5Element).isA ? this.getColumnsFor(table as Table) : null;
		if (!aColumns) {
			// We return null here because everything should apply at runtime
			return Promise.resolve(null);
		}

		const columnInfo = aColumns.find(function (oColumn) {
			return oColumn.name === propertyInfoName;
		});
		if (!columnInfo) {
			Log.error(`${propertyInfoName} not found while adding column`);
			return Promise.resolve(null);
		}
		if (columnInfo.availability === "Hidden") {
			Log.warning(`Column for ${propertyInfoName} not added because it's hidden`);
			return Promise.resolve(null);
		}
		const internalBindingContext = (table as Table).getBindingContext("internal");
		internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, true);
		this._setDraftIndicatorStatus(oModifier, table, aColumns, columnInfo);
		const sPath = await DelegateUtil.getCustomDataWithModifier<string>(table, "metaPath", oModifier);
		const oTableContext: Context = oMetaModel.createBindingContext(sPath!)!;
		// If view is not provided try to get it by accessing to the parental hierarchy
		// If it doesn't work (table into an unattached OP section) get the view via the AppComponent
		const view =
			mPropertyBag.view ||
			CommonUtils.getTargetView(table as UI5Element) ||
			(mPropertyBag.appComponent ? CommonUtils.getCurrentPageView(mPropertyBag.appComponent) : undefined);

		if (columnInfo.type === "Default") {
			Log.error("Custom columns defined in the manifest are not supported when using a table building block.");
			throw new Error("Custom columns defined in the manifest are not supported when using a table building block.");
		}

		if (columnInfo.type === "Slot") {
			return this._templateSlotColumnFragment(columnInfo as CustomElement<CustomBasedTableColumn>, view, oModifier, sTableId);
		}

		if (columnInfo.type === "Computed") {
			const enableAnalytics = ((table as MDCTable).getParent() as TableAPI).getTableDefinition().enableAnalytics;
			return getComputedColumn(sTableId, columnInfo as ComputedTableColumn, oTableContext, enableAnalytics);
		}

		// fall-back
		if (!oMetaModel) {
			return Promise.resolve(null);
		}

		const propertyInfo = ((table as MDCTable).getParent() as TableAPI).getEnhancedFetchedPropertyInfos().find(function (
			propInfo: EnhancedFEPropertyInfo
		) {
			return propInfo.name === propertyInfoName;
		});

		const oPropertyContext: Context = oMetaModel.createBindingContext(propertyInfo!.annotationPath)!;

		const fnTemplateFragment = async (
			oInPropertyInfo: unknown,
			oView: FEView
		): Promise<UI5Element | Element | UI5Element[] | Element[]> => {
			let bDisplayMode: boolean | undefined;
			let sTableTypeCustomData: string | undefined;
			let sCreationModeCustomData: string | undefined;

			return Promise.all([
				DelegateUtil.getCustomDataWithModifier<string | boolean>(table, "displayModePropertyBinding", oModifier),
				DelegateUtil.getCustomDataWithModifier<string>(table, "tableType", oModifier),
				DelegateUtil.getCustomDataWithModifier<string>(table, "creationMode", oModifier)
			]).then(async (aCustomData: (string | boolean | undefined)[]) => {
				bDisplayMode = aCustomData[0] as boolean | undefined;
				sTableTypeCustomData = aCustomData[1] as string | undefined;
				sCreationModeCustomData = aCustomData[2] as string | undefined;
				// Read Only and Column Edit Mode can both have three state
				// Undefined means that the framework decides what to do
				// True / Display means always read only
				// False / Editable means editable but while still respecting the low level principle (immutable property will not be editable)
				if (bDisplayMode !== undefined && typeof bDisplayMode !== "boolean") {
					bDisplayMode = bDisplayMode === "true";
				}

				const tableAPI = (table as Table).getParent() as TableAPI;
				const oThis = new JSONModel({
						enableAutoColumnWidth: tableAPI.getTableDefinition().control.enableAutoColumnWidth,
						readOnly: bDisplayMode,
						tableType: sTableTypeCustomData,
						id: sTableId,
						navigationPropertyPath: propertyInfoName,
						columnInfo: columnInfo,
						collection: oMetaModel.createBindingContext(sPath!),
						creationMode: { name: sCreationModeCustomData },
						widthIncludingColumnHeader: tableAPI.getTableDefinition().control.widthIncludingColumnHeader
					}),
					oPreprocessorSettings = {
						bindingContexts: {
							entitySet: oTableContext,
							collection: oTableContext,
							dataField: oPropertyContext,
							this: oThis.createBindingContext("/"),
							column: oThis.createBindingContext("/columnInfo")
						},
						models: {
							this: oThis,
							entitySet: oMetaModel,
							collection: oMetaModel,
							dataField: oMetaModel,
							metaModel: oMetaModel,
							column: oThis
						},
						appComponent: mPropertyBag.appComponent
					};

				const tableCollection = getInvolvedDataModelObjects<EntitySet | NavigationProperty>(
					oMetaModel.createBindingContext(tableAPI.tableDefinition.annotation.collection)!
				);
				const handlerProvider = new TableEventHandlerProvider(
					tableAPI,
					{ collectionEntity: tableCollection.targetObject!, metaModel: oMetaModel },
					tableAPI
				);
				const computedColumnXML = new DOMParser().parseFromString(
					jsx.renderAsXML(() => {
						return (getColumnTemplate(
							sTableId,
							tableAPI,
							columnInfo as AnnotationTableColumn,
							oMetaModel.createBindingContext(sPath!)!,
							handlerProvider
						) ?? "") as unknown as string;
					}),
					"text/xml"
				);
				return DelegateUtil.templateControlFragment(
					computedColumnXML.firstElementChild,
					oPreprocessorSettings,
					{ view: oView },
					oModifier
				).finally(function () {
					oThis.destroy();
				});
			});
		};

		return fnTemplateFragment(propertyInfo, view);
	},

	/**
	 * Provide the Table's filter delegate to provide basic filter functionality such as adding FilterFields.
	 * @returns Object for the Tables filter personalization.
	 */
	getFilterDelegate: function () {
		return Object.assign(
			{
				apiVersion: 2
			},
			FilterBarDelegate,
			{
				addItem: async function (oParentControl: Control, sPropertyInfoName: string) {
					if (sPropertyInfoName.indexOf("Property::") === 0) {
						// Correct the name of complex property info references.
						sPropertyInfoName = sPropertyInfoName.replace("Property::", "");
					}
					return FilterBarDelegate.addItem(oParentControl as FilterBar, sPropertyInfoName);
				}
			}
		);
	},

	/**
	 * Returns the TypeMap attached to this delegate.
	 * @returns Any instance of TypeMap
	 */
	getTypeMap: function (/*oPayload: object*/) {
		return TypeMap;
	},

	/**
	 * Format the title of the group header .
	 * @param table Instance of table control
	 * @param context Context
	 * @param property Name of the property
	 * @returns Formatted title of the group header.
	 */
	formatGroupHeader(table: MDCTable, context: ODataV4Context, property: string) {
		const propertyInfos = (table.getParent() as TableAPI).getEnhancedFetchedPropertyInfos();
		const propertyInfo = propertyInfos?.find((obj) => {
			return obj.name === property;
		});
		/*For a Date, DateTime, Boolean or Decimal property, the value is returned in external format using a UI5 type for the
	        given property path that formats corresponding to the property's EDM type and constraints*/
		const dataBaseType = TypeMap.getTypeConfig(propertyInfo?.dataType).baseType;
		const externalFormat =
			dataBaseType === "DateTime" || dataBaseType === "Date" || dataBaseType === "Boolean" || dataBaseType === "Numeric";
		let value;
		if (!context) {
			value = getResourceModel(CommonUtils.getTargetView(table)).getText("M_TABLE_GROUP_HEADER_TITLE_VALUE");
			return getResourceModel(table).getText("M_TABLE_GROUP_HEADER_TITLE", [propertyInfo?.label, value]);
		}
		if (propertyInfo?.mode) {
			switch (propertyInfo.mode) {
				case "Description":
					value = propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null;
					break;

				case "DescriptionValue":
					value = ValueFormatter.formatWithBrackets(
						propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null,
						propertyInfo.valueProperty ? context.getProperty(propertyInfo.valueProperty, externalFormat) : null
					);
					break;

				case "ValueDescription":
					value = ValueFormatter.formatWithBrackets(
						propertyInfo.valueProperty ? context.getProperty(propertyInfo.valueProperty, externalFormat) : null,
						propertyInfo.descriptionProperty ? context.getProperty(propertyInfo.descriptionProperty, externalFormat) : null
					);
					break;
				default:
					break;
			}
		} else {
			value = propertyInfo?.path ? context.getProperty(propertyInfo.path, externalFormat) : null;
		}
		if (value === null || value === "") {
			value = getResourceModel(CommonUtils.getTargetView(table)).getText("M_TABLE_GROUP_HEADER_TITLE_VALUE");
		}
		return getResourceModel(table).getText("M_TABLE_GROUP_HEADER_TITLE", [propertyInfo?.label, value]);
	}
});

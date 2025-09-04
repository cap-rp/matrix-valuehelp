import CommonUtils from "sap/fe/core/CommonUtils";
import type { PropertyInfo } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type QuickFilterSelector from "sap/fe/macros/table/QuickFilterSelector";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Control from "sap/ui/core/Control";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import type MDCChart from "sap/ui/mdc/Chart";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { MDCTablePropertyInfo as TablePropertyInfo } from "sap/ui/mdc/Table";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import CollectionBindingInfoAPI from "../CollectionBindingInfo";

type FilterInfo = {
	filters: Filter[];
	search: string;
	bindingPath: string;
};

export type InternalBindingInfo = {
	parameters?: Record<string, string>;
	filters: Filter[];
	search?: string | null;
	bindingPath?: string;
};

function getHiddenFilters(oTable: Control): Filter[] {
	let aFilters: Filter[] = [];
	const hiddenFilters = oTable.data("hiddenFilters");
	if (hiddenFilters && Array.isArray(hiddenFilters.paths)) {
		hiddenFilters.paths.forEach(function (mPath: { annotationPath: string }) {
			const oSvFilters = CommonUtils.getFiltersFromAnnotation(oTable, mPath.annotationPath);
			aFilters = aFilters.concat(oSvFilters);
		});
	}
	return aFilters;
}

/**
 * Retrieves the external filters configured on the table.
 * @param table The table
 * @returns  The filters
 */
function getExternalFilters(table: Table): Filter[] {
	let filters: Filter[] = getHiddenFilters(table);
	const quickFilter = table.getQuickFilter() as QuickFilterSelector;
	if (quickFilter) {
		filters = filters.concat(CommonUtils.getFiltersFromAnnotation(table, quickFilter.getSelectedKey()));
	}
	return filters;
}

/**
 * Retrieves the count of the OData list binding.
 * @param table The table used to get the initial OData list binding
 * @param pageBindingContext The binding context of the page
 * @param params Contains the following attributes
 * @param params.batchGroupId The groupId of the batch request
 * @param params.additionalFilters The additional filters to apply to the original OData list binding
 * @returns The count
 */
async function getListBindingForCount(
	table: Table,
	pageBindingContext: Context | null | undefined,
	params: { batchGroupId?: string; additionalFilters?: Filter[] }
): Promise<number> {
	const oDataModel = table.getModel() as ODataModel;
	const tableAPI = table.getParent() as TableAPI;
	const filterInfo = tableUtils.getFilterInfo(table);
	const filters = (Array.isArray(params.additionalFilters) ? params.additionalFilters : [])
		.concat(filterInfo.filters)
		.concat(tableUtils.getP13nFilters(table));
	const bindingInfo = {
		path: filterInfo.bindingPath ? filterInfo.bindingPath : tableAPI.getRowCollectionPath(),
		filters: new Filter({
			filters: filters,
			and: true
		})
	};
	table.getParent()?.fireEvent("beforeRebindTable", { collectionBindingInfo: new CollectionBindingInfoAPI(bindingInfo) });

	// Need to pass by a temporary ListBinding in order to get $filter query option (as string) thanks to fetchFilter of OdataListBinding
	const listBindingPath =
		pageBindingContext && !bindingInfo.path.startsWith("/") ? `${pageBindingContext.getPath()}/${bindingInfo.path}` : bindingInfo.path;
	const listBinding = oDataModel.bindList(listBindingPath, table.getBindingContext() as Context, [], bindingInfo.filters);
	const stringFilters: string[] = await (listBinding as ODataListBinding & { fetchFilter: Function }).fetchFilter(
		listBinding.getContext()
	);
	const countBinding = oDataModel.bindProperty(`${listBinding.getPath()}/$count`, listBinding.getContext(), {
		$$groupId: params.batchGroupId ?? "$auto",
		$filter: stringFilters[0],
		$search: filterInfo.search ? CommonUtils.normalizeSearchTerm(filterInfo.search) : undefined
	});
	const value = await countBinding.requestValue();
	countBinding.destroy();
	listBinding.destroy();
	return value;
}
function getCountFormatted(iCount: number | string): string {
	const oCountFormatter = NumberFormat.getIntegerInstance({ groupingEnabled: true });
	return oCountFormatter.format(iCount);
}
function getFilterInfo(oTable: Table, ignoreProperties?: string[]): InternalBindingInfo {
	const oTableDefinition = (oTable.getParent() as TableAPI).getTableDefinition();
	let aIgnoreProperties: string[] = ignoreProperties || [];

	if (oTableDefinition.enableAnalytics) {
		if (!oTableDefinition.enableBasicSearch) {
			// Search isn't allow as a $apply transformation for this table
			aIgnoreProperties = aIgnoreProperties.concat(["search"]);
		}
		aIgnoreProperties = aIgnoreProperties.concat(["$editState"]);
	} else if (oTableDefinition.control.type === "TreeTable") {
		aIgnoreProperties = aIgnoreProperties.concat(["$editState"]);
	}
	return FilterUtils.getFilterInfo(oTable.getFilter(), {
		ignoredProperties: aIgnoreProperties,
		targetControl: oTable
	});
}

/**
 * Retrieves all filters configured in the personalization dialog of the table or chart.
 * @param oControl Table or Chart instance
 * @returns Filters configured in the personalization dialog of the table or chart
 * @private
 */
function getP13nFilters(oControl: Table | MDCChart): Filter[] {
	const p13nMode = oControl.getP13nMode();
	let p13nProperties: TablePropertyInfo[] | PropertyInfo[] | undefined;
	if (p13nMode && p13nMode.includes("Filter")) {
		if (oControl.isA<Table>("sap.ui.mdc.Table")) {
			const tableAPI = oControl.getParent() as TableAPI;
			p13nProperties = tableAPI.getEnhancedFetchedPropertyInfos().filter(function (property) {
				return property?.filterable !== false;
			});
		} else {
			p13nProperties = (DelegateUtil.getCustomData<PropertyInfo[]>(oControl, "sap_fe_ControlDelegate_propertyInfoMap") || []).filter(
				function (oControlProperty: PropertyInfo) {
					return oControlProperty && !(oControlProperty.filterable === false);
				}
			);
		}
		const filterInfo = FilterUtils.getFilterInfo(oControl as unknown as IFilterControl, {
			propertiesMetadata: p13nProperties as PropertyInfo[]
		});
		if (filterInfo && filterInfo.filters) {
			return filterInfo.filters;
		}
	}
	return [];
}

function getAllFilterInfo(oTable: Table, ignoreProperties?: string[]): InternalBindingInfo {
	const oIFilterInfo = tableUtils.getFilterInfo(oTable, ignoreProperties);
	return {
		filters: oIFilterInfo.filters.concat(getExternalFilters(oTable), tableUtils.getP13nFilters(oTable)),
		search: oIFilterInfo.search,
		bindingPath: oIFilterInfo.bindingPath
	};
}

/**
 * Find a value in an object.
 * @param obj The object to look into
 * @param key The key to search
 * @param list An array to return if obj is undefined
 * @returns Return an array of all keys content
 */
function findValuesForKeyRecursively(obj: Record<string, unknown>, key: string, list: string[]): string[] {
	if (obj[key]) {
		list.push(obj[key] as string);
	}
	const children = Object.keys(obj);
	for (const child of children) {
		if (typeof obj[child] === "object") {
			list = list.concat(findValuesForKeyRecursively(obj[child] as Record<string, unknown>, key, []));
		}
	}
	return list;
}

/**
 * Find a value into an object.
 * @param obj The object to look into
 * @param key The key to search
 * @returns Return an array of all keys content
 */
function findValues(obj: Record<string, unknown>, key: string): string[] {
	return findValuesForKeyRecursively(obj, key, []);
}

/**
 * Check all filter conditions for date types or sensitive data.
 * @param mdcTable Table or Chart instance
 * @param filterBar FilterBar
 * @returns True if one filter has a date type or a sensitive data
 */
function isFilterEligibleForOptimisticBatch(mdcTable: Table, filterBar: FilterBar | undefined): boolean {
	if (!filterBar) {
		return false;
	}
	const filtersFromTable = tableUtils.getAllFilterInfo(mdcTable) as unknown as FilterInfo;
	const filtersConditions = filterBar.getConditions();
	const filtersConditionsPaths = Object.keys(filtersConditions);
	const tableRowBindingsInfoPath = mdcTable.data("metaPath");
	const metaModel = mdcTable.getModel()?.getMetaModel();
	let filterPropertiesAsPotentiallySensitiveDataOrDateType = false;
	const filtersPathsFromTable = getFiltersPathsFromTable(tableRowBindingsInfoPath, filtersFromTable);
	const filtersPathsFromFilterBar = getFiltersPathsFromFilterBar(tableRowBindingsInfoPath, filtersConditionsPaths);
	const edmDateTypes = ["Edm.Date", "Edm.DateTimeOffset", "Edm.TimeOfDay"];
	const allFiltersPaths = filtersPathsFromFilterBar.concat(filtersPathsFromTable);
	for (const potentiallySensitiveAnnotation of allFiltersPaths) {
		if (
			metaModel?.getObject(`${potentiallySensitiveAnnotation}@com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive`) ||
			metaModel?.getObject(`${potentiallySensitiveAnnotation}@com.sap.vocabularies.PersonalData.v1.IsPotentiallyPersonal`)
		) {
			filterPropertiesAsPotentiallySensitiveDataOrDateType = true;
			break;
		}
		if (edmDateTypes.includes(metaModel?.getObject(`${potentiallySensitiveAnnotation}/$Type`))) {
			filterPropertiesAsPotentiallySensitiveDataOrDateType = true;
			break;
		}
	}
	return filterPropertiesAsPotentiallySensitiveDataOrDateType;
}

/**
 * Returns the annotation paths of all filters of the Filter Bar.
 * @param tableRowBindingsInfoPath The table metaPath
 * @param filtersConditionsPaths The paths of all filters conditions
 * @returns An array of paths of all filters
 */
function getFiltersPathsFromFilterBar(tableRowBindingsInfoPath: string, filtersConditionsPaths: string[]): string[] {
	const filtersAnnotationsPaths: string[] = [];
	for (const filterPath of filtersConditionsPaths) {
		filtersAnnotationsPaths.push(`${tableRowBindingsInfoPath}/${filterPath}`);
	}
	return filtersAnnotationsPaths;
}

/**
 * Returns the paths of all filters conditions.
 * @param filter The filter to get the paths
 * @returns An object containing paths conditions
 */
function getReferencePathsForFilters(filter: Filter): Record<string, unknown> {
	const filters = filter.getFilters();
	let filterResult = {};
	// find all filters in multi filters
	if (filters) {
		filterResult = getReferencePathsForFilters(filters[filters.length - 1]);
		for (let i = filters.length - 2; i >= 0; i--) {
			filterResult = {
				left: getReferencePathsForFilters(filters[i]),
				right: filterResult
			};
		}
	} else {
		return {
			path: filter.getPath()
		};
	}
	return filterResult;
}

/**
 * Returns the annotation paths of all table filters.
 * @param tableRowBindingsInfoPath The table metaPath
 * @param filters The filters to check for paths
 * @returns An array of paths of all filters
 */
function getFiltersPathsFromTable(tableRowBindingsInfoPath: string, filters: FilterInfo): string[] {
	let paths: string[];
	const filtersAnnotationsPaths: string[] = [];
	for (const filter of filters.filters) {
		paths = findValues(getReferencePathsForFilters(filter), "path");
		for (const filterPath of paths) {
			filtersAnnotationsPaths.push(`${tableRowBindingsInfoPath}/${filterPath}`);
		}
	}
	return filtersAnnotationsPaths;
}

/**
 * Returns a promise that is resolved with the table itself when the table was bound.
 * @param oTable The table to check for binding
 * @returns A Promise that will be resolved when table is bound
 */
async function whenBound(oTable: Table): Promise<Table> {
	return _getOrCreateBoundPromiseInfo(oTable).promise;
}

/**
 * If not yet happened, it resolves the table bound promise.
 * @param oTable The table that was bound
 */
function onTableBound(oTable: Table): void {
	const oBoundPromiseInfo = _getOrCreateBoundPromiseInfo(oTable);
	if (oBoundPromiseInfo.resolve) {
		oBoundPromiseInfo.resolve(oTable);
		oTable.data("boundPromiseResolve", null);
	}
}

function _getOrCreateBoundPromiseInfo(oTable: Table): { promise: Promise<Table>; resolve: Function } {
	if (!oTable.data("boundPromise")) {
		let fnResolve!: Function;
		oTable.data(
			"boundPromise",
			new Promise(function (resolve) {
				fnResolve = resolve;
			})
		);
		if ((oTable as unknown as { isBound?: () => boolean }).isBound?.()) {
			fnResolve(oTable);
		} else {
			oTable.data("boundPromiseResolve", fnResolve);
		}
	}
	return { promise: oTable.data("boundPromise"), resolve: oTable.data("boundPromiseResolve") };
}

function updateFiltersForExternalID(metaModel: ODataMetaModel, filters: ConditionObject[], entityTypePath: string): void {
	filters?.forEach((condition) => {
		const nestedFilters = condition.getFilters();

		if (nestedFilters) {
			updateFiltersForExternalID(metaModel, nestedFilters, entityTypePath);
		} else {
			const externalIdPropPath = metaModel.getObject(entityTypePath + condition.sPath + "@com.sap.vocabularies.Common.v1.ExternalID")
				?.$Path;
			if (externalIdPropPath) {
				condition.sPath = externalIdPropPath;
			}
		}
	});
}

const tableUtils = {
	getCountFormatted: getCountFormatted,
	getHiddenFilters: getHiddenFilters,
	getListBindingForCount: getListBindingForCount,
	getFilterInfo: getFilterInfo,
	getP13nFilters: getP13nFilters,
	getAllFilterInfo: getAllFilterInfo,
	isFilterEligibleForOptimisticBatch: isFilterEligibleForOptimisticBatch,
	whenBound: whenBound,
	onTableBound: onTableBound,
	updateFiltersForExternalID: updateFiltersForExternalID
};

export default tableUtils;

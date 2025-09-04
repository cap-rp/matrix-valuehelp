import CommonUtils from "sap/fe/core/CommonUtils";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import TableDelegate from "sap/fe/macros/table/delegates/TableDelegate";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import type MDCTable from "sap/ui/mdc/Table";
import type Filter from "sap/ui/model/Filter";
import type Sorter from "sap/ui/model/Sorter";

type V4AggregationBindingInfo = BaseAggregationBindingInfo & {
	parameters: {
		$$aggregation: {
			hierarchyQualifier?: string;
			expandTo?: number;
			search?: string;
		};
	};
};
/**
 * Helper class for sap.ui.mdc.Table.
 * <h3><b>Note:</b></h3>
 * This class is experimental and not intended for productive usage, since the API/behavior has not been finalized.
 * @author SAP SE
 * @private
 * @experimental
 * @since 1.69.0
 * @alias sap.fe.macros.TableDelegate
 */
const TreeTableDelegate = Object.assign({}, TableDelegate, {
	apiVersion: 2,
	_internalUpdateBindingInfo: function (table: MDCTable, bindingInfo: V4AggregationBindingInfo) {
		TableDelegate._internalUpdateBindingInfo.apply(this, [table, bindingInfo]);

		const currentAggregation = table.getRowBinding()?.getAggregation() as { expandTo: number } | undefined;
		const payload = table.getPayload() as
			| { hierarchyQualifier: string; createInPlace: boolean; initialExpansionLevel: number }
			| undefined;
		bindingInfo.parameters.$$aggregation = {
			...bindingInfo.parameters.$$aggregation,
			...{ hierarchyQualifier: payload?.hierarchyQualifier, createInPlace: payload?.createInPlace ? true : undefined },
			// Setting the expandTo parameter to a high value forces the treeTable to expand all nodes when the search is applied
			...{
				expandTo: bindingInfo.parameters.$$aggregation?.search
					? Number.MAX_SAFE_INTEGER
					: currentAggregation?.expandTo ?? payload?.initialExpansionLevel
			}
		};

		// Flag to know if sorters are applied (used in drag & drop logic)
		const internalContext = table.getBindingContext("internal") as InternalModelContext;
		internalContext.setProperty("isSorted", bindingInfo.sorter !== undefined && (bindingInfo.sorter as Sorter[]).length > 0);
	},
	updateBindingInfoWithSearchQuery: function (bindingInfo: V4AggregationBindingInfo, filterInfo: { search?: string }, filter: Filter) {
		bindingInfo.filters = filter;
		if (filterInfo.search) {
			bindingInfo.parameters.$$aggregation = {
				...bindingInfo.parameters.$$aggregation,
				...{
					search: CommonUtils.normalizeSearchTerm(filterInfo.search)
				}
			};
		} else {
			delete bindingInfo.parameters?.$$aggregation?.search;
		}
	}
});

export default TreeTableDelegate;

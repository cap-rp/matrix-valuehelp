/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/ui/model/Filter"], function (deepClone, Filter) {
  "use strict";

  var _exports = {};
  /**
   * API to add parameters to the collection binding infos.
   * @hideconstructor
   * @alias sap.fe.macros.CollectionBindingInfo
   * @public
   */
  let CollectionBindingInfoAPI = /*#__PURE__*/function () {
    function CollectionBindingInfoAPI(bindingInfo) {
      this.collectionBindingInfo = bindingInfo;
    }

    /**
     * Recursive cloning of the Filter.
     * Filters have a parameter aFilters which contains more filters, so we use this method to recursively clone it.
     * cloneFilters should be called first, to have the Filter outside an array and avoid an empty filter.
     * @param cloning The filter to clone
     * @returns The cloned Filter
     */
    _exports = CollectionBindingInfoAPI;
    var _proto = CollectionBindingInfoAPI.prototype;
    _proto.cloneFiltersContent = function cloneFiltersContent(cloning) {
      const filterInfo = {
        path: cloning.getPath(),
        operator: cloning.getOperator(),
        value1: cloning.getValue1(),
        value2: cloning.getValue2(),
        variable: cloning.getVariable(),
        condition: cloning.getCondition(),
        and: cloning.isAnd(),
        caseSensitive: cloning.isCaseSensitive()
      };
      const testFn = cloning.getTest();
      if (testFn !== undefined) {
        filterInfo.test = testFn;
      }
      const comparatorFn = cloning.getComparator();
      if (comparatorFn !== undefined) {
        filterInfo.comparator = comparatorFn;
      }
      const filters = cloning.getFilters();
      const arrayFilter = filters?.map(singleFilter => {
        return this.cloneFiltersContent(singleFilter);
      });
      if (arrayFilter) {
        filterInfo.filters = arrayFilter;
      }
      return new Filter(filterInfo);
    }

    /**
     * Returns the current filters applied to the Table.
     * @public
     * @returns The {@link sap.ui.model.Filter "filters"} on the table
     */;
    _proto.getFilters = function getFilters() {
      if (this.collectionBindingInfo.filters) {
        return this.cloneFiltersContent(this.collectionBindingInfo.filters);
      }
      return undefined;
    }

    /**
     * Adds a filter to the filters already present in the binding info.
     * @param customFilter The {@link sap.ui.model.Filter "filter"} to add
     * @public
     */;
    _proto.addFilter = function addFilter(customFilter) {
      const filters = this.collectionBindingInfo.filters ? [this.collectionBindingInfo.filters] : [];
      filters.push(customFilter);
      this.collectionBindingInfo.filters = new Filter(filters, true);
    }

    /**
     * Returns the current sorters of the Table.
     * @returns The {@link sap.ui.model.Sorter "sorters"} on the table
     * @public
     */;
    _proto.getSorters = function getSorters() {
      return this.collectionBindingInfo.sorter;
    }

    /**
     * Adds parameters to the select query.
     * @param parameters The list or properties to add to the query
     * @public
     */;
    _proto.addSelect = function addSelect(parameters) {
      const parameterString = parameters.toString();
      if (this.collectionBindingInfo.parameters?.$select) {
        this.collectionBindingInfo.parameters.$select = this.collectionBindingInfo.parameters.$select + "," + parameterString;
      } else {
        this.collectionBindingInfo.parameters ??= {};
        this.collectionBindingInfo.parameters.$select = parameterString;
      }
    }

    /**
     * Retrieve the 'serialized' binding info, useful if you want to create your own binding
     * @returns {CollectionBindingInfo} The {@link sap.fe.macros.CollectionBindingInfo "CollectionBindingInfo"}
     * @public
     */;
    _proto.getBindingInfo = function getBindingInfo() {
      const clonedBindingInfo = {
        ...this.collectionBindingInfo
      };

      // Making deepClones of objects (except Sorters because we can't)
      if (this.collectionBindingInfo.events) {
        clonedBindingInfo.events = deepClone(this.collectionBindingInfo.events);
      }
      if (this.collectionBindingInfo.filters) {
        clonedBindingInfo.filters = this.cloneFiltersContent(this.collectionBindingInfo.filters);
      }
      if (this.collectionBindingInfo.parameters) {
        deepClone(this.collectionBindingInfo.parameters);
      }
      return clonedBindingInfo;
    }

    /**
     * Adds a sorter to the sorter(s) already present, or create one if none exists.
     * @param sorter The {@link sap.ui.model.Sorter "sorter"} to add to the query
     * @public
     */;
    _proto.addSorter = function addSorter(sorter) {
      if (!this.collectionBindingInfo.sorter) {
        this.collectionBindingInfo.sorter = [sorter];
      } else {
        this.collectionBindingInfo.sorter.push(sorter);
      }
    };
    return CollectionBindingInfoAPI;
  }();
  _exports = CollectionBindingInfoAPI;
  return _exports;
}, false);
//# sourceMappingURL=CollectionBindingInfo-dbg.js.map

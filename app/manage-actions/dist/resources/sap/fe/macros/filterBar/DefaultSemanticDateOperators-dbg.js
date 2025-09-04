/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/date/UniversalDateUtils", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/condition/Operator", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/ValidateException"], function (UniversalDateUtils, FilterOperatorUtil, Operator, Filter, ModelOperator, ValidateException) {
  "use strict";

  var _exports = {};
  const DYNAMIC_DATE_CATEGORY = "DYNAMIC.DATE";
  _exports.DYNAMIC_DATE_CATEGORY = DYNAMIC_DATE_CATEGORY;
  const FIXED_DATE_CATEGORY = "FIXED.DATE";
  const DYNAMIC_DATE_INT_CATEGORY = "DYNAMIC.DATE.INT";
  const DYNAMIC_DATERANGE_CATEGORY = "DYNAMIC.DATERANGE";
  const DYNAMIC_MONTH_CATEGORY = "DYNAMIC.MONTH";
  const FIXED_WEEK_CATEGORY = "FIXED.WEEK";
  const FIXED_MONTH_CATEGORY = "FIXED.MONTH";
  const FIXED_QUARTER_CATEGORY = "FIXED.QUARTER";
  const FIXED_YEAR_CATEGORY = "FIXED.YEAR";
  const DYNAMIC_WEEK_INT_CATEGORY = "DYNAMIC.WEEK.INT";
  const DYNAMIC_MONTH_INT_CATEGORY = "DYNAMIC.MONTH.INT";
  const DYNAMIC_QUARTER_INT_CATEGORY = "DYNAMIC.QUARTER.INT";
  const DYNAMIC_YEAR_INT_CATEGORY = "DYNAMIC.YEAR.INT";
  const DYNAMIC_MINUTE_INT_CATEGORY = "DYNAMIC.MINUTE.INT";
  const DYNAMIC_HOUR_INT_CATEGORY = "DYNAMIC.HOUR.INT";

  /**
   * Operations info to identify which operators the user wants to support.
   * Like:
   * {
   * 	<operator name>: {
   * 		key: <identifier>,
   * 		category: <type of operator>
   * 	},
   * 	<more operators>...
   * }
   */
  const basicDateTimeOps = {
    EQ: {
      key: "EQ",
      category: DYNAMIC_DATE_CATEGORY
    },
    BT: {
      key: "BT",
      category: DYNAMIC_DATERANGE_CATEGORY
    }
  };
  const defaultFixedDateSingleValueOperations = {
    YESTERDAY: {
      key: "YESTERDAY",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.yesterday
    },
    TODAY: {
      key: "TODAY",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.today
    },
    TOMORROW: {
      key: "TOMORROW",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.tomorrow
    }
  };
  const otherFixedDateSingleValueOperations = {
    FIRSTDAYWEEK: {
      key: "FIRSTDAYWEEK",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.firstDayOfWeek
    },
    LASTDAYWEEK: {
      key: "LASTDAYWEEK",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.lastDayOfWeek
    },
    FIRSTDAYMONTH: {
      key: "FIRSTDAYMONTH",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.firstDayOfMonth
    },
    LASTDAYMONTH: {
      key: "LASTDAYMONTH",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.lastDayOfMonth
    },
    FIRSTDAYQUARTER: {
      key: "FIRSTDAYQUARTER",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.firstDayOfQuarter
    },
    LASTDAYQUARTER: {
      key: "LASTDAYQUARTER",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.lastDayOfQuarter
    },
    FIRSTDAYYEAR: {
      key: "FIRSTDAYYEAR",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.firstDayOfYear
    },
    LASTDAYYEAR: {
      key: "LASTDAYYEAR",
      category: FIXED_DATE_CATEGORY,
      fnRanges: UniversalDateUtils.ranges.lastDayOfYear
    }
  };
  const defaultSemanticDateOperations = {
    ...defaultFixedDateSingleValueOperations,
    DATE: {
      key: "DATE",
      category: DYNAMIC_DATE_CATEGORY
    },
    FROM: {
      key: "FROM",
      category: DYNAMIC_DATE_CATEGORY
    },
    TO: {
      key: "TO",
      category: DYNAMIC_DATE_CATEGORY
    },
    DATERANGE: {
      key: "DATERANGE",
      category: DYNAMIC_DATERANGE_CATEGORY
    },
    SPECIFICMONTH: {
      key: "SPECIFICMONTH",
      category: DYNAMIC_MONTH_CATEGORY
    },
    TODAYFROMTO: {
      key: "TODAYFROMTO",
      category: DYNAMIC_DATE_INT_CATEGORY
    },
    LASTDAYS: {
      key: "LASTDAYS",
      category: DYNAMIC_DATE_INT_CATEGORY
    },
    NEXTDAYS: {
      key: "NEXTDAYS",
      category: DYNAMIC_DATE_INT_CATEGORY
    },
    THISWEEK: {
      key: "THISWEEK",
      category: FIXED_WEEK_CATEGORY
    },
    LASTWEEK: {
      key: "LASTWEEK",
      category: FIXED_WEEK_CATEGORY
    },
    LASTWEEKS: {
      key: "LASTWEEKS",
      category: DYNAMIC_WEEK_INT_CATEGORY
    },
    NEXTWEEK: {
      key: "NEXTWEEK",
      category: FIXED_WEEK_CATEGORY
    },
    NEXTWEEKS: {
      key: "NEXTWEEKS",
      category: DYNAMIC_WEEK_INT_CATEGORY
    },
    THISMONTH: {
      key: "THISMONTH",
      category: FIXED_MONTH_CATEGORY
    },
    LASTMONTH: {
      key: "LASTMONTH",
      category: FIXED_MONTH_CATEGORY
    },
    LASTMONTHS: {
      key: "LASTMONTHS",
      category: DYNAMIC_MONTH_INT_CATEGORY
    },
    NEXTMONTH: {
      key: "NEXTMONTH",
      category: FIXED_MONTH_CATEGORY
    },
    NEXTMONTHS: {
      key: "NEXTMONTHS",
      category: DYNAMIC_MONTH_INT_CATEGORY
    },
    THISQUARTER: {
      key: "THISQUARTER",
      category: FIXED_QUARTER_CATEGORY
    },
    LASTQUARTER: {
      key: "LASTQUARTER",
      category: FIXED_QUARTER_CATEGORY
    },
    LASTQUARTERS: {
      key: "LASTQUARTERS",
      category: DYNAMIC_QUARTER_INT_CATEGORY
    },
    NEXTQUARTER: {
      key: "NEXTQUARTER",
      category: FIXED_QUARTER_CATEGORY
    },
    NEXTQUARTERS: {
      key: "NEXTQUARTERS",
      category: DYNAMIC_QUARTER_INT_CATEGORY
    },
    QUARTER1: {
      key: "QUARTER1",
      category: FIXED_QUARTER_CATEGORY
    },
    QUARTER2: {
      key: "QUARTER2",
      category: FIXED_QUARTER_CATEGORY
    },
    QUARTER3: {
      key: "QUARTER3",
      category: FIXED_QUARTER_CATEGORY
    },
    QUARTER4: {
      key: "QUARTER4",
      category: FIXED_QUARTER_CATEGORY
    },
    THISYEAR: {
      key: "THISYEAR",
      category: FIXED_YEAR_CATEGORY
    },
    LASTYEAR: {
      key: "LASTYEAR",
      category: FIXED_YEAR_CATEGORY
    },
    LASTYEARS: {
      key: "LASTYEARS",
      category: DYNAMIC_YEAR_INT_CATEGORY
    },
    NEXTYEAR: {
      key: "NEXTYEAR",
      category: FIXED_YEAR_CATEGORY
    },
    NEXTYEARS: {
      key: "NEXTYEARS",
      category: DYNAMIC_YEAR_INT_CATEGORY
    },
    LASTMINUTES: {
      key: "LASTMINUTES",
      category: DYNAMIC_MINUTE_INT_CATEGORY
    },
    NEXTMINUTES: {
      key: "NEXTMINUTES",
      category: DYNAMIC_MINUTE_INT_CATEGORY
    },
    LASTHOURS: {
      key: "LASTHOURS",
      category: DYNAMIC_HOUR_INT_CATEGORY
    },
    NEXTHOURS: {
      key: "NEXTHOURS",
      category: DYNAMIC_HOUR_INT_CATEGORY
    },
    YEARTODATE: {
      key: "YEARTODATE",
      category: FIXED_YEAR_CATEGORY
    },
    DATETOYEAR: {
      key: "DATETOYEAR",
      category: FIXED_YEAR_CATEGORY
    }
  };

  /**
   * Creating date range operator instance.
   * @returns Date range operator
   */
  function _getDateRangeOperator() {
    return new Operator({
      name: "DATERANGE",
      filterOperator: ModelOperator.BT,
      alias: {
        Date: "DATERANGE",
        DateTime: "DATERANGE"
      },
      valueTypes: [{
        name: "sap.ui.model.odata.type.Date"
      }, {
        name: "sap.ui.model.odata.type.Date"
      }],
      // use date type to have no time part,
      getModelFilter: function (condition, fieldPath, type) {
        return getModelFilterForDateRange(condition, fieldPath, type, this);
      },
      validate: function (values, type) {
        if (values.length < 2) {
          throw new ValidateException("Date Range must have two values");
        } else {
          const fromDate = new Date(values[0]);
          const toDate = new Date(values[1]);
          if (fromDate.getTime() > toDate.getTime()) {
            throw new ValidateException("From Date Should Be Less Than To Date");
          }
        }
        Operator.prototype.validate?.apply(this, [values, type]);
      }
    });
  }

  /**
   * Creating normal date operator instance.
   * @returns Date operator
   */
  function _getDateOperator() {
    return new Operator({
      name: "DATE",
      alias: {
        Date: "DATE",
        DateTime: "DATE"
      },
      filterOperator: ModelOperator.EQ,
      valueTypes: [{
        name: "sap.ui.model.odata.type.Date"
      }],
      getModelFilter: function (condition, fieldPath, type) {
        return getModelFilterForDate(condition, fieldPath, type, this);
      }
    });
  }

  /**
   * Creating "FROM" operator with selected date as start anchor.
   * @returns Operator
   */
  function _getFromOperator() {
    return new Operator({
      name: "FROM",
      alias: {
        Date: "FROM",
        DateTime: "FROM"
      },
      filterOperator: ModelOperator.GE,
      valueTypes: [{
        name: "sap.ui.model.odata.type.Date"
      }],
      getModelFilter: function (condition, fieldPath, type) {
        return getModelFilterForFrom(condition, fieldPath, type, this);
      }
    });
  }

  /**
   * Creating "TO" operator with selected date as end anchor.
   * @returns Operator
   */
  function _getToOperator() {
    return new Operator({
      name: "TO",
      alias: {
        Date: "TO",
        DateTime: "TO"
      },
      filterOperator: ModelOperator.LE,
      valueTypes: [{
        name: "sap.ui.model.odata.type.Date"
      }],
      getModelFilter: function (condition, fieldPath, type) {
        return getModelFilterForTo(condition, fieldPath, type, this);
      }
    });
  }

  // Get the operators based on type
  function getOperatorsInfo(type) {
    return type === "Edm.DateTimeOffset" ? Object.assign({}, defaultSemanticDateOperations, basicDateTimeOps) : defaultSemanticDateOperations;
  }

  // Extending operators for Sematic Date Control
  _exports.getOperatorsInfo = getOperatorsInfo;
  function addSemanticDateOperators() {
    FilterOperatorUtil.addOperator(_getDateRangeOperator());
    FilterOperatorUtil.addOperator(_getDateOperator());
    FilterOperatorUtil.addOperator(_getFromOperator());
    FilterOperatorUtil.addOperator(_getToOperator());
  }
  _exports.addSemanticDateOperators = addSemanticDateOperators;
  function getSemanticDateOperations(type) {
    const operators = getOperatorsInfo(type);
    return Object.keys(operators);
  }

  /**
   * Get model filter for "DATE" operator.
   * @param condition
   * @param fieldPath
   * @param type
   * @param operator
   * @returns Filter
   */
  _exports.getSemanticDateOperations = getSemanticDateOperations;
  function getModelFilterForDate(condition, fieldPath, type, operator) {
    if (type.isA("sap.ui.model.odata.type.DateTimeOffset")) {
      const operatorType = operator._createLocalType(operator.valueTypes[0]);
      let from = condition.values[0];
      const operatorModelFormat = operatorType.getModelFormat();
      const dateInstance = operatorModelFormat.parse(from, false);
      from = type.getModelValue(dateInstance);
      dateInstance.setHours(23);
      dateInstance.setMinutes(59);
      dateInstance.setSeconds(59);
      dateInstance.setMilliseconds(999);
      const to = type.getModelValue(dateInstance);
      return new Filter({
        path: fieldPath,
        operator: ModelOperator.BT,
        value1: from,
        value2: to
      });
    } else {
      return new Filter({
        path: fieldPath,
        operator: operator.filterOperator,
        value1: condition.values[0]
      });
    }
  }

  /**
   * Get model filter for "TO" operator.
   * @param condition
   * @param fieldPath
   * @param type
   * @param operator
   * @returns Filter
   */
  _exports.getModelFilterForDate = getModelFilterForDate;
  function getModelFilterForTo(condition, fieldPath, type, operator) {
    if (type.isA("sap.ui.model.odata.type.DateTimeOffset")) {
      const operatorType = operator._createLocalType(operator.valueTypes[0]);
      const value = condition.values[0];
      const operatorModelFormat = operatorType.getModelFormat();
      const dateInstance = operatorModelFormat.parse(value, false);
      dateInstance.setHours(23);
      dateInstance.setMinutes(59);
      dateInstance.setSeconds(59);
      dateInstance.setMilliseconds(999);
      const to = type.getModelValue(dateInstance);
      return new Filter({
        path: fieldPath,
        operator: ModelOperator.LE,
        value1: to
      });
    } else {
      return new Filter({
        path: fieldPath,
        operator: operator.filterOperator,
        value1: condition.values[0]
      });
    }
  }

  /**
   * Get model filter for "TO" operator.
   * @param condition
   * @param fieldPath
   * @param type
   * @param operator
   * @returns Filter
   */
  _exports.getModelFilterForTo = getModelFilterForTo;
  function getModelFilterForFrom(condition, fieldPath, type, operator) {
    if (type.isA("sap.ui.model.odata.type.DateTimeOffset")) {
      const operatorType = operator._createLocalType(operator.valueTypes[0]);
      const value = condition.values[0];
      const operatorModelFormat = operatorType.getModelFormat();
      const dateInstance = operatorModelFormat.parse(value, false);
      dateInstance.setHours(0);
      dateInstance.setMinutes(0);
      dateInstance.setSeconds(0);
      dateInstance.setMilliseconds(0);
      const from = type.getModelValue(dateInstance);
      return new Filter({
        path: fieldPath,
        operator: ModelOperator.GE,
        value1: from
      });
    } else {
      return new Filter({
        path: fieldPath,
        operator: operator.filterOperator,
        value1: condition.values[0]
      });
    }
  }

  /**
   * Get model filter for date range operations.
   * @param condition
   * @param fieldPath
   * @param type
   * @param operator
   * @returns Filter
   */
  _exports.getModelFilterForFrom = getModelFilterForFrom;
  function getModelFilterForDateRange(condition, fieldPath, type, operator) {
    if (type.isA("sap.ui.model.odata.type.DateTimeOffset")) {
      let operatorType = operator._createLocalType(operator.valueTypes[0]);
      let from = condition.values[0];
      let operatorModelFormat = operatorType.getModelFormat(); // use ModelFormat to convert in JS-Date and add 23:59:59
      let dateInstance = operatorModelFormat.parse(from, false);
      from = type.getModelValue(dateInstance);
      operatorType = operator._createLocalType(operator.valueTypes[1]);
      operatorModelFormat = operatorType.getModelFormat(); // use ModelFormat to convert in JS-Date and add 23:59:59
      let to = condition.values[1];
      dateInstance = operatorModelFormat.parse(to, false);
      dateInstance.setHours(23);
      dateInstance.setMinutes(59);
      dateInstance.setSeconds(59);
      dateInstance.setMilliseconds(999);
      to = type.getModelValue(dateInstance);
      return new Filter({
        path: fieldPath,
        operator: ModelOperator.BT,
        value1: from,
        value2: to
      });
    } else {
      return new Filter({
        path: fieldPath,
        operator: operator.filterOperator,
        value1: condition.values[0],
        value2: condition.values[1]
      });
    }
  }

  /**
   * Get all single value date operations for properties with 'SingleValue' filter restriction.
   * @returns Array of operation names.
   */
  _exports.getModelFilterForDateRange = getModelFilterForDateRange;
  function getSingleValueDateOperations() {
    const fixedDateSingleValueOperations = getFixedDateSingleValueOperations();
    const dateOperation = defaultSemanticDateOperations.DATE.key;
    return [...Object.keys(fixedDateSingleValueOperations), dateOperation];
  }

  /**
   * Get fixed date single value operations.
   * @returns Array of operation names.
   */
  _exports.getSingleValueDateOperations = getSingleValueDateOperations;
  function getFixedDateSingleValueOperations() {
    return {
      ...defaultFixedDateSingleValueOperations,
      ...otherFixedDateSingleValueOperations
    };
  }
  _exports.getFixedDateSingleValueOperations = getFixedDateSingleValueOperations;
  return _exports;
}, false);
//# sourceMappingURL=DefaultSemanticDateOperators-dbg.js.map

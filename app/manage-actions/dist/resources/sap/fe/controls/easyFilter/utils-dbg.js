/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepEqual", "sap/ui/core/Lib", "sap/ui/core/format/DateFormat", "sap/ui/model/FilterOperator", "sap/ui/model/odata/type/DateTimeOffset"], function (deepEqual, Lib, DateFormat, FilterOperator, DateTimeOffset) {
  "use strict";

  const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
  const dateTimeOffset = new DateTimeOffset();
  function areItemsSame(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    // Compare elements of both arrays
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].operator !== arr2[i].operator || !arr1[i].selectedValues.every((value, index) => value === arr2[i].selectedValues[index] || typeof value === "object" && deepEqual(value.value, arr2[i].selectedValues[index].value) && value.description === arr2[i].selectedValues[index].description)) {
        return false;
      }
    }
    return true; // Arrays are the same
  }
  function areArraySame(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    // Compare elements of both arrays
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true; // Arrays are the same
  }
  async function areCodeListsSame(arr1, arr2) {
    const arrNew1 = await getCodeListArray(arr1);
    const arrNew2 = await getCodeListArray(arr2);
    const descriptionNew1 = arrNew1?.map(data => data.description);
    const descriptionNew2 = arrNew2?.map(data => data.description);
    const value1 = arrNew1?.map(data => data.value);
    const value2 = arrNew2?.map(data => data.value);
    if (!descriptionNew1 || !descriptionNew2) {
      return false;
    }
    return areArraySame(descriptionNew1, descriptionNew2) && areArraySame(value1, value2);
  }
  async function getCodeListArray(arr) {
    if (typeof arr === "function") {
      return arr();
    }
    return arr;
  }
  function convertDateToString(value, tokenType, isDateTimeOffset) {
    let formattedDateTime = "";
    if (isDateTimeOffset) {
      return dateTimeOffset.formatValue(value, "string");
    }
    switch (tokenType) {
      case "Calendar":
        formattedDateTime = DateFormat.getDateInstance().format(value);
        break;
      case "Time":
        formattedDateTime = DateFormat.getTimeInstance().format(value);
        break;
      default:
        break;
    }
    return formattedDateTime;
  }

  /**
   * Create a string representation of the operator and value.
   * @param operator The operator to represent
   * @param value The value to represent
   * @param tokenType The token's type
   * @param isDateTimeOffset Checks if the data type is of DateTimeOffset
   * @returns The string representation of the operator and value
   */
  function mapOperator(operator, value, tokenType, isDateTimeOffset) {
    let newValue = "";
    if (typeof value === "boolean") {
      newValue = convertBoolToString(value);
    } else if (value instanceof Date) {
      newValue = convertDateToString(value, tokenType, isDateTimeOffset);
    } else {
      newValue = value;
    }
    switch (operator) {
      case FilterOperator.GT:
        return `> ${newValue}`;
      case FilterOperator.LT:
        return `< ${newValue}`;
      case FilterOperator.GE:
        return `>= ${newValue}`;
      case FilterOperator.LE:
        return `<= ${newValue}`;
      case FilterOperator.EQ:
        return `${newValue}`;
      case FilterOperator.Contains:
        return `*${newValue}*`;
      case FilterOperator.EndsWith:
        return `*${newValue}`;
      case FilterOperator.StartsWith:
        return `${newValue}*`;
      case FilterOperator.NE:
        return `!=(${newValue})`;
      case FilterOperator.NotContains:
        return `!(*${newValue}*)`;
      case FilterOperator.NotEndsWith:
        return `!(*${newValue})`;
      case FilterOperator.NotStartsWith:
        return `!(${newValue}*)`;
      default:
        return newValue?.toString();
    }
  }
  function mapOperatorForValueHelp(operator, value, tokenType, isDateTimeOffset) {
    return mapOperator(operator, value.description, tokenType, isDateTimeOffset);
  }
  function mapOperatorForBetweenOperator(operator, values, tokenType, isDateTimeOffset) {
    let newValue1 = "";
    let newValue2 = "";
    if (typeof values[0] === "boolean") {
      newValue1 = convertBoolToString(values[0]);
    } else if (values[0] instanceof Date) {
      newValue1 = convertDateToString(values[0], tokenType, isDateTimeOffset);
    } else if (typeof values[0] === "object") {
      newValue1 = values[0].description;
    } else {
      newValue1 = values[0];
    }
    if (typeof values[1] === "boolean") {
      newValue2 = convertBoolToString(values[1]);
    } else if (values[1] instanceof Date) {
      newValue2 = convertDateToString(values[1], tokenType, isDateTimeOffset);
    } else if (typeof values[0] === "object") {
      newValue2 = values[1].description;
    } else {
      newValue2 = values[1];
    }
    if (operator === FilterOperator.BT) {
      return `${newValue1}...${newValue2}`;
    } else {
      return `!(${newValue1}...${newValue2})`;
    }
  }
  function isBetweenSelectedValues(operator) {
    return operator === FilterOperator.BT || operator === FilterOperator.NB;
  }
  function convertBoolToString(value) {
    return value ? resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_TRUE") : resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_FALSE");
  }
  function formatData(tokens, filterValues, filterBarMetadata) {
    if (filterValues) {
      const visitedMapForMandatoryTokens = {};
      for (const filterValue of filterValues) {
        const filterCriteria = filterBarMetadata.find(field => field.name === filterValue.name);
        if (filterCriteria) {
          const {
            type
          } = filterCriteria;
          const tokenIndex = tokens.findIndex(token => token.key === filterValue.name);
          const {
            operator,
            values
          } = filterValue;
          let keySpecificSelectedValues;
          if (EasyFilterUtils.isBetweenSelectedValues(operator)) {
            keySpecificSelectedValues = {
              operator,
              selectedValues: values
            };
          } else {
            keySpecificSelectedValues = {
              operator: operator,
              selectedValues: values
            };
          }
          if (tokenIndex === -1) {
            // Add new token if it doesn't exist
            const newToken = {
              key: filterValue.name,
              label: filterCriteria.label,
              keySpecificSelectedValues: [keySpecificSelectedValues],
              type: type,
              busy: type === "ValueHelp" ? true : false
            };
            tokens.push(newToken);
          } else {
            // Update existing token
            const currentToken = tokens[tokenIndex];
            //If its default value , override it
            if ((currentToken.isRequired ?? false) && !visitedMapForMandatoryTokens[currentToken.key]) {
              currentToken.keySpecificSelectedValues = [keySpecificSelectedValues];
              visitedMapForMandatoryTokens[currentToken.key] = true;
            } else {
              currentToken.keySpecificSelectedValues.push(keySpecificSelectedValues);
            }
          }
        }
      }
    }
  }
  const EasyFilterUtils = {
    areItemsSame,
    areCodeListsSame,
    getCodeListArray,
    areArraySame,
    mapOperator,
    mapOperatorForBetweenOperator,
    isBetweenSelectedValues,
    formatData,
    mapOperatorForValueHelp
  };
  return EasyFilterUtils;
}, false);
//# sourceMappingURL=utils-dbg.js.map

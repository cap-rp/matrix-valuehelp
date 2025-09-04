/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/type/EDM", "sap/fe/macros/field/FieldHelper", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/enums/ConditionValidated", "../CommonHelper", "./SemanticDateOperators"], function (Log, MetaModelConverter, PropertyHelper, EDM, FilterFieldHelper, Condition, ConditionValidated, CommonHelper, SemanticDateOperators) {
  "use strict";

  var _exports = {};
  var isTypeFilterable = EDM.isTypeFilterable;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const oExcludeMap = {
    Contains: "NotContains",
    StartsWith: "NotStartsWith",
    EndsWith: "NotEndsWith",
    Empty: "NotEmpty",
    NotEmpty: "Empty",
    LE: "NOTLE",
    GE: "NOTGE",
    LT: "NOTLT",
    GT: "NOTGT",
    BT: "NOTBT",
    NE: "EQ",
    EQ: "NE"
  };
  function _getDateTimeOffsetCompliantValue(sValue) {
    let oValue;
    if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})\+(\d{1,2}):(\d{1,2})/)) {
      oValue = sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})\+(\d{1,2}):(\d{1,2})/)[0];
    } else if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2}).(\d{1,7})[+-](\d{1,2}):(\d{1,2})/)) {
      oValue = sValue;
    } else if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})/)) {
      oValue = `${sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})/)[0]}+0000`;
    } else if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)) {
      oValue = `${sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)[0]}T00:00:00+0000`;
    } else if (sValue.indexOf("Z") === sValue.length - 1) {
      oValue = `${sValue.split("Z")[0]}+0100`;
    } else {
      oValue = undefined;
    }
    return oValue;
  }
  _exports._getDateTimeOffsetCompliantValue = _getDateTimeOffsetCompliantValue;
  function _getDateCompliantValue(sValue) {
    return sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/) ? sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)[0] : sValue.match(/^(\d{8})/) && sValue.match(/^(\d{8})/)[0];
  }

  /**
   * Method to get the compliant value type based on the data type.
   * @param  sValue Raw value
   * @param  sType The property type
   * @param  option The operation to consider
   * @returns Value to be propagated to the condition.
   */
  _exports._getDateCompliantValue = _getDateCompliantValue;
  function getTypeCompliantValue(value, edmType, option) {
    if (!isTypeFilterable(edmType) || !option) {
      return undefined;
    }
    if (value === undefined || value === null) {
      return value;
    }
    let retValue = value;
    switch (edmType) {
      case "Edm.Boolean":
        if (typeof value === "boolean") {
          retValue = value;
        } else {
          retValue = value === "true" || (value === "false" ? false : undefined);
        }
        break;
      case "Edm.Double":
      case "Edm.Single":
        if (value === "" && option === "EQ") {
          // the operator will be calulcated as empty
          break;
        }
        const numFloat = Number(value);
        retValue = isNaN(numFloat) ? undefined : parseFloat(value.toString());
        break;
      case "Edm.Byte":
      case "Edm.Int16":
      case "Edm.Int32":
      case "Edm.SByte":
        if (retValue === "" && option === "EQ") {
          // the operator will be calulcated as empty
          break;
        }
        const numInt = Number(value);
        retValue = isNaN(numInt) ? undefined : parseInt(value.toString(), 10);
        break;
      case "Edm.Date":
        retValue = _getDateCompliantValue(value.toString());
        break;
      case "Edm.DateTimeOffset":
        retValue = _getDateTimeOffsetCompliantValue(value.toString());
        break;
      case "Edm.TimeOfDay":
        retValue = value.toString().match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/) ? value.toString().match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/)?.[0] : undefined;
        break;
      default:
    }
    return retValue === null ? undefined : retValue;
  }

  /**
   * Method to create a condition.
   * @param  sOption Operator to be used.
   * @param  oV1 Lower value
   * @param  oV2 Higher value
   * @param sSign
   * @param validOperators Operators supported.
   * @returns Condition to be created
   */
  _exports.getTypeCompliantValue = getTypeCompliantValue;
  function resolveConditionValues(sOption, oV1, oV2, sSign) {
    let validOperators = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    let oValue = oV1,
      oValue2,
      sInternalOperation;
    if (oV1 === undefined || oV1 === null) {
      return undefined;
    }
    switch (sOption) {
      case "CP":
        sInternalOperation = "Contains";
        if (oValue) {
          const nIndexOf = oValue.indexOf("*");
          const nLastIndex = oValue.lastIndexOf("*");

          // only when there are '*' at all
          if (nIndexOf > -1) {
            if (nIndexOf === 0 && nLastIndex !== oValue.length - 1) {
              sInternalOperation = "EndsWith";
              oValue = oValue.substring(1, oValue.length);
            } else if (nIndexOf !== 0 && nLastIndex === oValue.length - 1) {
              sInternalOperation = "StartsWith";
              oValue = oValue.substring(0, oValue.length - 1);
            } else {
              oValue = oValue.substring(1, oValue.length - 1);
            }
          } else {
            Log.warning("Contains Option cannot be used without '*'.");
            return undefined;
          }
        }
        break;
      case "EQ":
        sInternalOperation = sOption;
        if (validOperators.length === 0 || validOperators.includes("Empty")) {
          sInternalOperation = oV1 === "" ? "Empty" : sOption;
        }
        break;
      case "NE":
        sInternalOperation = oV1 === "" ? "NotEmpty" : sOption;
        break;
      case "BT":
        if (oV2 === undefined || oV2 === null) {
          return;
        }
        oValue2 = oV2;
        sInternalOperation = sOption;
        break;
      case "LE":
      case "GE":
      case "GT":
      case "LT":
        sInternalOperation = sOption;
        break;
      default:
        Log.warning(`Selection Option is not supported : '${sOption}'`);
        return undefined;
    }
    if (sSign === "E") {
      sInternalOperation = oExcludeMap[sInternalOperation];
    }
    const condition = {
      values: [],
      isEmpty: null,
      operator: sInternalOperation
    };
    if (sInternalOperation !== "Empty") {
      condition.values.push(oValue);
      if (oValue2) {
        condition.values.push(oValue2);
      }
    }
    return condition;
  }

  /* Method to get the Range property from the Selection Option */
  _exports.resolveConditionValues = resolveConditionValues;
  function getRangeProperty(sProperty) {
    return sProperty.indexOf("/") > 0 ? sProperty.split("/")[1] : sProperty;
  }
  _exports.getRangeProperty = getRangeProperty;
  function _buildConditionsFromSelectionRanges(Ranges, property, propertyName, getCustomConditions) {
    const conditions = [];
    const hasValueHelpAnnotation = hasValueHelp(property);
    Ranges?.forEach(Range => {
      const oCondition = getCustomConditions ? getCustomConditions(Range, property, propertyName) : getConditions(Range, property.type, hasValueHelpAnnotation);
      if (oCondition) {
        conditions.push(oCondition);
      }
    });
    return conditions;
  }

  /**
   * Method to get the concerned property for the property path.
   * @param  propertyPath Relative property path from annotations
   * @param  metaModel Metamodel
   * @param  entitySetPath Filter bar entitySet path
   * @returns Property if found.
   */
  function _getProperty(propertyPath, metaModel, entitySetPath) {
    const propertyContext = metaModel.getMetaContext(`${entitySetPath}/${propertyPath}`),
      dataModelObjectPath = getInvolvedDataModelObjects(propertyContext);
    return dataModelObjectPath.targetObject;
  }
  function _buildFiltersConditionsFromSelectOption(selectOption, metaModel, entitySetPath, getCustomConditions) {
    const propertyName = selectOption.PropertyName,
      filterConditions = {},
      propertyPath = propertyName.value || propertyName?.$PropertyPath,
      Ranges = selectOption.Ranges ?? [];
    const targetProperty = _getProperty(propertyPath, metaModel, entitySetPath);
    if (targetProperty) {
      const conditions = _buildConditionsFromSelectionRanges(Ranges, targetProperty, propertyPath, getCustomConditions);
      if (conditions.length) {
        filterConditions[propertyPath] = (filterConditions[propertyPath] || []).concat(conditions);
      }
    }
    return filterConditions;
  }
  function getFiltersConditionsFromSelectionVariant(sEntitySetPath, oMetaModel, selectionVariant, getCustomConditions) {
    let oFilterConditions = {};
    if (!selectionVariant) {
      return oFilterConditions;
    }
    const aSelectOptions = selectionVariant.SelectOptions,
      aParameters = selectionVariant.Parameters;
    aSelectOptions?.forEach(selectOption => {
      const propertyName = selectOption.PropertyName;
      const sPropertyName = propertyName.value || propertyName.$PropertyPath;
      if (Object.keys(oFilterConditions).includes(sPropertyName)) {
        oFilterConditions[sPropertyName] = oFilterConditions[sPropertyName].concat(_buildFiltersConditionsFromSelectOption(selectOption, oMetaModel, sEntitySetPath, getCustomConditions)[sPropertyName]);
      } else {
        oFilterConditions = {
          ...oFilterConditions,
          ..._buildFiltersConditionsFromSelectOption(selectOption, oMetaModel, sEntitySetPath, getCustomConditions)
        };
      }
    });
    aParameters?.forEach(parameter => {
      const sPropertyPath = parameter.PropertyName.value || parameter.PropertyName.$PropertyPath;
      const oCondition = getCustomConditions ? {
        operator: "EQ",
        value1: parameter.PropertyValue,
        value2: null,
        path: sPropertyPath,
        isParameter: true
      } // FIXME path here is unexpected
      : {
        operator: "EQ",
        values: [parameter.PropertyValue],
        isEmpty: null,
        validated: ConditionValidated.Validated,
        isParameter: true
      };
      oFilterConditions[sPropertyPath] = [oCondition];
    });
    return oFilterConditions;
  }
  _exports.getFiltersConditionsFromSelectionVariant = getFiltersConditionsFromSelectionVariant;
  function getConditions(selectOption, edmType, hasValueHelpAnnotation) {
    let validOperators = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    let condition;
    try {
      const sign = getRangeProperty(selectOption.Sign);
      const option = getRangeProperty(selectOption.Option);
      const value1 = getTypeCompliantValue(selectOption.Low, edmType, option);
      const value2 = selectOption.High ? getTypeCompliantValue(selectOption.High, edmType, option) : undefined;
      const conditionValues = resolveConditionValues(option, value1, value2, sign, validOperators);
      if (conditionValues) {
        // 1. Conditions with EQ operator of properties with VH need to be set Validated, they are shown in VH Panel.
        // 2. Other conditions of properties without VH or non-EQ operators cannot be represented in VH panel, they will be in Define Conditions Panel. These are set NotValidated.
        const validated = hasValueHelpAnnotation && conditionValues.operator === "EQ" ? ConditionValidated.Validated : ConditionValidated.NotValidated;
        condition = Condition.createCondition(conditionValues.operator, conditionValues.values, null, null, validated);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Log.error(`FE : Core : FilterHelper : getConditions : ${message}`);
    }
    return condition;
  }
  _exports.getConditions = getConditions;
  const getDefaultValueFilters = function (oContext, properties) {
    const filterConditions = {};
    const entitySetPath = oContext.getInterface(1).getPath(),
      oMetaModel = oContext.getInterface(1).getModel();
    if (properties) {
      for (const key in properties) {
        const defaultFilterValue = oMetaModel.getObject(`${entitySetPath}/${key}@com.sap.vocabularies.Common.v1.FilterDefaultValue`);
        if (defaultFilterValue !== undefined) {
          const PropertyName = key;
          filterConditions[PropertyName] = [Condition.createCondition("EQ", [defaultFilterValue], null, null, ConditionValidated.Validated)];
        }
      }
    }
    return filterConditions;
  };
  const getDefaultSemanticDateFilters = function (oContext, defaultSemanticDates) {
    const filterConditions = {};
    const oInterface = oContext.getInterface(1);
    const oMetaModel = oInterface.getModel();
    const sEntityTypePath = oInterface.getPath();
    for (const key in defaultSemanticDates) {
      if (defaultSemanticDates[key][0]) {
        const aPropertyPathParts = key.split("::");
        let sPath = "";
        const iPropertyPathLength = aPropertyPathParts.length;
        const sNavigationPath = aPropertyPathParts.slice(0, aPropertyPathParts.length - 1).join("/");
        const sProperty = aPropertyPathParts[iPropertyPathLength - 1];
        if (sNavigationPath) {
          //Create Proper Condition Path e.g. _Item*/Property or _Item/Property
          const vProperty = oMetaModel.getObject(sEntityTypePath + "/" + sNavigationPath);
          if (vProperty.$kind === "NavigationProperty" && vProperty.$isCollection) {
            sPath += `${sNavigationPath}*/`;
          } else if (vProperty.$kind === "NavigationProperty") {
            sPath += `${sNavigationPath}/`;
          }
        }
        sPath += sProperty;
        const operatorParamsArr = "values" in defaultSemanticDates[key][0] ? defaultSemanticDates[key][0].values : [];
        filterConditions[sPath] = [Condition.createCondition(defaultSemanticDates[key][0].operator, operatorParamsArr, null, null, null)];
      }
    }
    return filterConditions;
  };
  function getEditStatusFilter() {
    const ofilterConditions = {};
    ofilterConditions["$editState"] = [Condition.createCondition("DRAFT_EDIT_STATE", ["ALL"], null, null, ConditionValidated.Validated)];
    return ofilterConditions;
  }
  _exports.getEditStatusFilter = getEditStatusFilter;
  function getFilterConditions(oContext, filterConditions, entitySet, viewData) {
    let showDraftEditState = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    let editStateFilter;
    const entitySetPath = oContext.getInterface(1).getPath(),
      oMetaModel = oContext.getInterface(1).getModel(),
      entityTypeAnnotations = oMetaModel?.getObject(`${entitySetPath}@`),
      entityTypeProperties = oMetaModel?.getObject(`${entitySetPath}/`);
    if (entityTypeAnnotations && (entityTypeAnnotations["@com.sap.vocabularies.Common.v1.DraftRoot"] || entityTypeAnnotations["@com.sap.vocabularies.Common.v1.DraftNode"]) && showDraftEditState) {
      editStateFilter = getEditStatusFilter();
    }
    const selectionVariant = filterConditions?.selectionVariant;
    const defaultSemanticDates = filterConditions?.defaultSemanticDates || {};
    const defaultFilters = getDefaultValueFilters(oContext, entityTypeProperties);
    const defaultSemanticDateFilters = getDefaultSemanticDateFilters(oContext, defaultSemanticDates);
    let retFilterConditions = {};
    if (selectionVariant) {
      retFilterConditions = getFiltersConditionsFromSelectionVariant(entitySetPath, oMetaModel, selectionVariant);
    } else if (defaultFilters) {
      retFilterConditions = defaultFilters;
    }
    if (defaultSemanticDateFilters) {
      // only for semantic date:
      // 1. value from manifest get merged with SV
      // 2. manifest value is given preference when there is same semantic date property in SV and manifest
      retFilterConditions = {
        ...retFilterConditions,
        ...defaultSemanticDateFilters
      };
    }
    if (editStateFilter) {
      retFilterConditions = {
        ...retFilterConditions,
        ...editStateFilter
      };
    }
    const filterConfigs = viewData?.controlConfiguration?.["@com.sap.vocabularies.UI.v1.SelectionFields"] ?? {};
    retFilterConditions = getConditionsOfSupportedOperators(oContext.getInterface(1), retFilterConditions, filterConfigs);
    return Object.keys(retFilterConditions).length > 0 ? JSON.stringify(retFilterConditions).replace(/([{}])/g, "\\$1") : undefined;
  }
  _exports.getFilterConditions = getFilterConditions;
  getFilterConditions.requiresIContext = true;

  /**
   * Get only the conditions with supported operators.
   * @param  entitySetContext EntitySet interface
   * @param  filterConditions All filter conditions
   * @param  controlConfigs FilterBar configuration
   * @returns Filter conditions.
   */
  function getConditionsOfSupportedOperators(entitySetContext, filterConditions, controlConfigs) {
    const metaModel = entitySetContext.getModel();
    const {
      filterFields = {},
      useSemanticDateRange = true
    } = controlConfigs;
    for (const property in filterConditions) {
      try {
        const propertyContext = metaModel.createBindingContext(`${entitySetContext.getPath()}/${property}`);
        const propertyMetaInfo = propertyContext?.getObject();
        const propertyFilterFieldConfig = filterFields[property]?.settings;
        if (propertyContext) {
          const operatorsString = FilterFieldHelper.operators(propertyContext, propertyMetaInfo, useSemanticDateRange, CommonHelper.stringifyCustomData(propertyFilterFieldConfig), entitySetContext.getPath() || "");
          const supportedOperators = operatorsString ? operatorsString.split(",") : [];
          filterConditions[property] = _updateConditionsForSupportedOperators(supportedOperators, filterConditions[property], property);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE : FilterBar : Error determining conditions for supported operators of property ${property} : ${message}`);
      }
    }
    return filterConditions;
  }

  /**
   * Filter conditions.
   * @param  supportedOperators Supported Operators for the filter field
   * @param  propertyConditions Conditions of the particular property
   * @param  propertyName Property name
   * @returns Filtered conditions.
   */
  _exports.getConditionsOfSupportedOperators = getConditionsOfSupportedOperators;
  function _updateConditionsForSupportedOperators(supportedOperators, propertyConditions, propertyName) {
    let retConditions = propertyConditions;
    const allSemanticDateOperators = SemanticDateOperators.getSemanticDateOperations();
    if (supportedOperators.length > 0) {
      retConditions = propertyConditions.filter(condition => {
        const operator = condition.operator;
        if (allSemanticDateOperators.includes(operator) && !supportedOperators.includes(operator)) {
          // If it is a semantic operator and is not supported.
          Log.warning(`FE : FilterBar : ${operator} not supported for property ${propertyName}. Hence, not applied to FilterBar.`);
          return false;
        }
        return true;
      }, []);
    }
    return retConditions;
  }
  return _exports;
}, false);
//# sourceMappingURL=FilterHelper-dbg.js.map

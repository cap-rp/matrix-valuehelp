/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/macros/filter/FilterOperatorUtils", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/enums/FieldDisplay", "sap/ui/model/SimpleType", "sap/ui/model/type/Boolean", "sap/ui/model/type/Date", "sap/ui/model/type/Float", "sap/ui/model/type/Integer", "sap/ui/model/type/String"], function (Log, ClassSupport, FilterOperatorUtils, FilterOperatorUtil, FieldDisplay, SimpleType, BooleanType, DateType, FloatType, IntegerType, StringType) {
  "use strict";

  var _dec, _class, _Value;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Handle format/parse of single value filter.
   */
  let Value = (_dec = defineUI5Class("sap.fe.macros.filter.type.Value"), _dec(_class = (_Value = /*#__PURE__*/function (_SimpleType) {
    /**
     * Creates a new value type instance with the given parameters.
     * @param formatOptions Format options for this value type
     * @param formatOptions.operator The name of a (possibly custom) operator to use
     * @param constraints Constraints for this value type
     * @protected
     */
    function Value(formatOptions, constraints) {
      var _this;
      _this = _SimpleType.call(this, formatOptions, constraints) || this;
      const operatorName = formatOptions?.operator || _this.getDefaultOperatorName();
      const operator = FilterOperatorUtil.getOperator(operatorName);
      _this.operator = operator;
      if (_this.operator === undefined && operatorName.includes(".")) {
        const operatorConfig = _this.getOperatorConfig(operatorName);
        _this.registerCustomOperator(operatorConfig);
      }
      return _this;
    }

    /**
     * Custom Operator Info.
     * @param operatorName The binding operator name
     * @returns Custom operator info
     * @private
     */
    _exports = Value;
    _inheritsLoose(Value, _SimpleType);
    var _proto = Value.prototype;
    _proto.getOperatorConfig = function getOperatorConfig(operatorName) {
      return {
        name: operatorName
      };
    }

    /**
     * Registers a custom binding operator.
     * @param operatorConfig The operator info
     * @private
     */;
    _proto.registerCustomOperator = function registerCustomOperator(operatorConfig) {
      FilterOperatorUtils.registerCustomOperators([operatorConfig]).then(operators => {
        if (operators[0]) {
          this.operator = operators[0];
        } else {
          Log.error(`Failed to register operator: ${operatorConfig.name}`);
        }
        return;
      }).catch(error => {
        Log.error(`Failed to register operator: ${operatorConfig.name}`, error);
      });
    }

    /**
     * Returns whether the specified operator is a multi-value operator.
     * @param operator The binding operator
     * @returns `true`, if multi-value operator (`false` otherwise)
     * @private
     */;
    _proto._isMultiValueOperator = function _isMultiValueOperator(operator) {
      return operator.valueTypes.filter(function (valueType) {
        return !!valueType && valueType !== Value.OPERATOR_VALUE_TYPE_STATIC;
      }).length > 1;
    }

    /**
     * Returns whether the specified operator is a custom operator.
     * @returns `true`, if custom operator (`false` otherwise)
     * @private
     */;
    _proto.hasCustomOperator = function hasCustomOperator() {
      return this.operator.name.includes(".");
    }

    /**
     * Parses the internal string value to the external value of type 'externalValueType'.
     * @param value The internal string value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @private
     */;
    _proto._stringToExternal = function _stringToExternal(value, externalValueType) {
      let externalValue;
      const externalType = this._getTypeInstance(externalValueType);
      if (externalValueType && Value._isArrayType(externalValueType)) {
        if (!Array.isArray(value)) {
          value = [value];
        }
        externalValue = value.map(valueElement => {
          return externalType ? externalType.parseValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
        });
      } else {
        externalValue = externalType ? externalType.parseValue(value, Value.INTERNAL_VALUE_TYPE) : value;
      }
      return externalValue;
    }

    /**
     * Returns whether target type is an array.
     * @param targetType The target type name
     * @returns `true`, if array type (`false` otherwise)
     * @private
     */;
    Value._isArrayType = function _isArrayType(targetType) {
      if (!targetType) {
        return false;
      }
      return targetType === "array" || targetType.endsWith("[]");
    }

    /**
     * Returns the external value formatted as the internal string value.
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @private
     */;
    _proto.externalToString = function externalToString(externalValue, externalValueType) {
      let value;
      const externalType = this._getTypeInstance(externalValueType);
      if (externalValueType && Value._isArrayType(externalValueType)) {
        if (!Array.isArray(externalValue)) {
          externalValue = [externalValue];
        }
        value = externalValue.map(valueElement => {
          return externalType ? externalType.formatValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
        });
      } else {
        value = externalType ? externalType.formatValue(externalValue, Value.INTERNAL_VALUE_TYPE) : externalValue;
      }
      return value;
    }

    /**
     * Retrieves the default type instance for given type name.
     * @param typeName The name of the type
     * @returns The type instance
     * @private
     */;
    _proto._getTypeInstance = function _getTypeInstance(typeName) {
      typeName = this.getElementTypeName(typeName) || typeName;
      switch (typeName) {
        case "string":
          return new StringType();
        case "number":
        case "int":
        case "integer":
          return new IntegerType();
        case "float":
          return new FloatType();
        case "date":
          return new DateType();
        case "boolean":
          return new BooleanType();
        default:
          Log.error("Unexpected filter type");
          throw new Error("Unexpected filter type");
      }
    }

    /**
     * Returns the default operator name ("EQ").
     * Should be overridden on demand.
     * @returns The default operator name
     * @protected
     */;
    _proto.getDefaultOperatorName = function getDefaultOperatorName() {
      return FilterOperatorUtil.getEQOperator().name;
    }

    /**
     * Returns the element type name.
     * @param typeName The actual type name
     * @returns The type of its elements
     * @protected
     */;
    _proto.getElementTypeName = function getElementTypeName(typeName) {
      if (typeName?.endsWith("[]")) {
        return typeName.substring(0, typeName.length - 2);
      }
      return undefined;
    }

    /**
     * Returns the string value parsed to the external value type 'this.operator'.
     * @param internalValue The internal string value to be formatted
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @protected
     */;
    _proto.formatValue = function formatValue(internalValue, externalValueType) {
      if (!internalValue) {
        return undefined;
      }
      const isMultiValueOperator = this._isMultiValueOperator(this.operator),
        internalType = this._getTypeInstance(Value.INTERNAL_VALUE_TYPE);

      //  from internal model string with operator
      const values = this.operator.parse(internalValue || "", internalType, FieldDisplay.Value, false);
      const value = !isMultiValueOperator && Array.isArray(values) ? values[0] : values;
      return this._stringToExternal(value, externalValueType); // The value bound to a custom filter
    }

    /**
     * Returns the value parsed to the internal string value.
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @protected
     */;
    _proto.parseValue = function parseValue(externalValue, externalValueType) {
      if (!externalValue) {
        return undefined;
      }
      const isMultiValueOperator = this._isMultiValueOperator(this.operator),
        externalType = this._getTypeInstance(externalValueType);
      const value = this.externalToString(externalValue, externalValueType);

      // Format to internal model string with operator
      const values = isMultiValueOperator ? value : [value];
      if (this.hasCustomOperator()) {
        // Return a complex object while parsing the bound value in sap.ui.model.PropertyBinding.js#_externalToRaw()
        return {
          operator: this.operator.name,
          values: [this.operator.format({
            values: values
          }, externalType)],
          validated: undefined
        };
      }
      // Return a simple string value to be stored in the internal 'filterValues' model
      return this.operator.format({
        values: values
      }, externalType);
    }

    /**
     * Validates whether the given value in model representation is valid.
     * @param externalValue The value to be validated
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.validateValue = function validateValue(externalValue) {
      /* Do Nothing */
    };
    return Value;
  }(SimpleType), _Value.INTERNAL_VALUE_TYPE = "string", _Value.OPERATOR_VALUE_TYPE_STATIC = "static", _Value)) || _class);
  _exports = Value;
  return _exports;
}, false);
//# sourceMappingURL=Value-dbg.js.map

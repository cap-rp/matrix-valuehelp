/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/filter/type/Value"], function (ClassSupport, Value) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Handle format/parse of multi value filters.
   */
  let MultiValue = (_dec = defineUI5Class("sap.fe.macros.filter.type.MultiValue"), _dec(_class = /*#__PURE__*/function (_Value) {
    function MultiValue() {
      return _Value.apply(this, arguments) || this;
    }
    _exports = MultiValue;
    _inheritsLoose(MultiValue, _Value);
    var _proto = MultiValue.prototype;
    /**
     * Custom Operator Info.
     * @param operatorName The binding operator name
     * @returns Custom operator info
     */
    _proto.getOperatorConfig = function getOperatorConfig(operatorName) {
      return {
        name: operatorName,
        multiValue: true
      };
    }

    /**
     * Returns the string value parsed to the external value type.
     * @param internalValue The internal string value to be formatted
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @protected
     */;
    _proto.formatValue = function formatValue(internalValue, externalValueType) {
      let result = internalValue;
      if (typeof result === "string") {
        result = result.split(",");
      }
      if (Array.isArray(result)) {
        result = result.map(value => _Value.prototype.formatValue.call(this, value, this.getElementTypeName(externalValueType))).filter(value => value !== undefined);
      }
      return result || [];
    }

    /**
     * Returns the value parsed to the internal string value.
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.parseValue = function parseValue(externalValue, externalValueType) {
      if (!externalValue) {
        externalValue = [];
      }
      const values = _Value.prototype.externalToString.call(this, externalValue, externalValueType);
      if (_Value.prototype.hasCustomOperator.call(this)) {
        // Returning the ConditionObject through CustomFilterFieldContentWrapper
        return {
          operator: this.operator.name,
          values: [values],
          validated: undefined
        };
      }
      return externalValue.map(value => {
        if (value === undefined) {
          value = [];
        } else if (!Array.isArray(value)) {
          value = [value];
        }
        return this.operator.format({
          values: value
        });
      });
    };
    return MultiValue;
  }(Value)) || _class);
  _exports = MultiValue;
  return _exports;
}, false);
//# sourceMappingURL=MultiValue-dbg.js.map

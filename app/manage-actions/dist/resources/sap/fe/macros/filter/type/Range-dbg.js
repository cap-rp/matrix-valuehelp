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
   * Type used to extend SimpleType with hidden fields
   * @typedef AugmentedSimpleType
   */
  /**
   * Handle format/parse of range filter values.
   */
  // eslint-disable-next-line new-cap
  let Range = (_dec = defineUI5Class("sap.fe.macros.filter.type.Range"), _dec(_class = /*#__PURE__*/function (_Value) {
    function Range() {
      return _Value.apply(this, arguments) || this;
    }
    _exports = Range;
    _inheritsLoose(Range, _Value);
    var _proto = Range.prototype;
    /**
     * Returns the default operator name for range filter values ("BT").
     * @returns The default operator name
     * @protected
     */
    _proto.getDefaultOperatorName = function getDefaultOperatorName() {
      return "BT";
    }

    /**
     * Returns the unchanged values.
     * @param values Input condition value
     * @returns Unchanged input condition value
     * @protected
     */;
    _proto.formatConditionValues = function formatConditionValues(values) {
      return values;
    }

    /**
     * Returns the string value parsed to the external value type.
     * @param internalValue The internal string value to be formatted
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @protected
     */;
    _proto.formatValue = function formatValue(internalValue, externalValueType) {
      let results = _Value.prototype.formatValue.call(this, internalValue, externalValueType);
      if (!results) {
        const minValue = this.oFormatOptions.min || Number.MIN_SAFE_INTEGER,
          maxValue = this.oFormatOptions.max || Number.MAX_SAFE_INTEGER;
        results = [minValue, maxValue];
      }
      return results;
    };
    return Range;
  }(Value)) || _class);
  _exports = Range;
  return _exports;
}, false);
//# sourceMappingURL=Range-dbg.js.map

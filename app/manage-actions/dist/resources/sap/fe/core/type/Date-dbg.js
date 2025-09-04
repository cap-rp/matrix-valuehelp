/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Lib", "sap/ui/model/CompositeType", "sap/ui/model/ValidateException", "sap/ui/model/odata/type/Date"], function (ClassSupport, Library, CompositeType, ValidateException, ODataDateType) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Define the UI5 class for a type of date picker validation.
   *
   */
  let DateType = (_dec = defineUI5Class("sap.fe.core.type.Date"), _dec(_class = /*#__PURE__*/function (_CompositeType) {
    function DateType(oFormatOptions, oConstraints) {
      var _this;
      _this = _CompositeType.call(this, oFormatOptions, oConstraints) || this;
      _this.bParseWithValues = true;
      _this.date = new ODataDateType();
      _this.bUseRawValues = true;
      return _this;
    }

    /**
     * Validate the input value whether it fall in the min and max range or not.
     * @param aValues String array with input value and minimum and maximum value.
     */
    _inheritsLoose(DateType, _CompositeType);
    var _proto = DateType.prototype;
    _proto.validateValue = function validateValue(aValues) {
      const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core");
      if (aValues[0]) {
        if (aValues[1]) {
          if (Date.parse(aValues[0]) < Date.parse(aValues[1])) {
            throw new ValidateException(coreResourceBundle.getText("C_ERROR_MINMAX_VALIDATION_DISPLAYED"));
          }
        }
        if (aValues[2]) {
          if (Date.parse(aValues[0]) > Date.parse(aValues[2])) {
            throw new ValidateException(coreResourceBundle.getText("C_ERROR_MINMAX_VALIDATION_DISPLAYED"));
          }
        }
      }
      this.date.validateValue(aValues[0]);
    }

    /**
     * Formats the input value.
     * @param value String array with input value and date range values.
     * @param sInternalType Represents type of the value.
     * @returns String | Date | UI5Date Returns the value from the extended Date function.
     */;
    _proto.formatValue = function formatValue(value, sInternalType) {
      return this.date.formatValue(value[0], sInternalType);
    }

    /**
     * Parses the input value.
     * @param value String with input value.
     * @param sInternalType Represents type of the value.
     * @returns String[] | Date | UI5Date Returns the value from the extended Date function.
     */;
    _proto.parseValue = function parseValue(value, sInternalType) {
      return [this.date.parseValue(value, sInternalType)];
    };
    return DateType;
  }(CompositeType)) || _class);
  return DateType;
}, false);
//# sourceMappingURL=Date-dbg.js.map

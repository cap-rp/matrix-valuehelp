/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Lib", "sap/ui/model/ValidateException", "sap/ui/model/odata/type/String"], function (ClassSupport, Library, ValidateException, ODataStringType) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let InputMaskType = (_dec = defineUI5Class("sap.fe.core.type.InputMask"), _dec(_class = /*#__PURE__*/function (_ODataStringType) {
    function InputMaskType(oFormatOptions) {
      return _ODataStringType.call(this, oFormatOptions) || this;
    }
    _inheritsLoose(InputMaskType, _ODataStringType);
    var _proto = InputMaskType.prototype;
    /**
     * Validates the value against the mask. If the value is not provided for any of the mask characters, it throws an error.
     * @param value String value received from the parseValue method without the mask.
     */
    _proto.validateValue = function validateValue(value) {
      // Reuse the formatValue to validate if the value does not match the mask and throw an error in that case
      const maskedValue = this.formatValue(value);
      if (maskedValue.includes(this.oFormatOptions.placeholderSymbol)) {
        let text = Library.getResourceBundleFor("sap.fe.core").getText("T_MASKEDINPUT_INVALID_VALUE");
        if (!text) {
          text = "";
        }
        throw new ValidateException(text);
      }
      _ODataStringType.prototype.validateValue.call(this, value);
    }
    /**
     * Parse the value by removing the mask characters.
     * @param value String value from the control with the mask
     * @returns String value without the mask
     */;
    _proto.parseValue = function parseValue(value) {
      // Remove the mask characters from the value
      let parsedValue = "";
      let parsedValueIndex = 0;
      const mask = this.oFormatOptions?.mask;
      if (mask) {
        for (let i = 0; i <= mask.length; i++) {
          if (this.doesMakingRuleExists(this.oFormatOptions.maskRule, mask[i])) {
            const maskRule = this.oFormatOptions.maskRule.find(rule => rule.symbol === mask[i]);
            if (value[parsedValueIndex] && maskRule && value[parsedValueIndex].match(new RegExp(maskRule.regex))) {
              parsedValue += value[parsedValueIndex++];
            }
          } else if (mask[i] === "^") {
            // check if the character is ^, then skip the next character in value and increment the loop i++ as we don't want to add the escaped character to the parsed value
            i++;
            parsedValueIndex++;
          } else {
            parsedValueIndex++;
          }
        }
      }
      return parsedValue;
    }
    /**
     * Checks if the mask rule exists for the given mask character.
     * @param maskRule Array of mask rules
     * @param maskCharacter Single mask character
     * @returns True or False based on the result
     */;
    _proto.doesMakingRuleExists = function doesMakingRuleExists(maskRule, maskCharacter) {
      for (const rule of maskRule) {
        if (rule.symbol === maskCharacter) {
          return true;
        }
      }
      return false;
    }
    /**
     * Format the value by applying the mask.
     * @param value String value from the model without the mask
     * @returns String value with the mask
     */;
    _proto.formatValue = function formatValue(value) {
      if (!value) return value;
      const maskRulesPerCharacter = {};
      let formatValue = "";
      // Create a map of mask rules per character
      if (this.oFormatOptions.maskRule) {
        for (const rule of this.oFormatOptions.maskRule) {
          maskRulesPerCharacter[rule.symbol] = rule.regex;
        }
        let valueIndex = 0;
        let formattedValue = "";
        const mask = this.oFormatOptions.mask;
        for (let i = 0; i < mask.length; i++) {
          // Process character by character, comparing with the mask rules
          // If the character matches a mask rule, replace it with the character from the value and increment the value index;
          // Otherwise replace it with the character from the mask
          if (maskRulesPerCharacter[mask[i]]) {
            if (value[valueIndex] && value[valueIndex].match(new RegExp(maskRulesPerCharacter[mask[i]]))) {
              formattedValue += value[valueIndex++];
            } else {
              formattedValue += this.oFormatOptions.placeholderSymbol;
            }
          } else if (mask[i] === "^") {
            // if the mask character is ^ then add the character after it to the formatted value and increment the value i++
            formattedValue += mask[i + 1];
            i++;
          } else {
            formattedValue += mask[i];
          }
        }
        formatValue = formattedValue;
      }
      return formatValue;
    };
    return InputMaskType;
  }(ODataStringType)) || _class);
  return InputMaskType;
}, false);
//# sourceMappingURL=InputMask-dbg.js.map

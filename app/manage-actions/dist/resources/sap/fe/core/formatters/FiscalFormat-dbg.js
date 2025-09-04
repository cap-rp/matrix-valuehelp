/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/i18n/Localization", "sap/ui/core/Locale", "sap/ui/core/LocaleData"], function (Localization, Locale, LocaleData) {
  "use strict";

  var _FiscalFormat;
  var _exports = {};
  /**
   * Constructor for a new FiscalFormat
   * @param formatOptions Object that defines format options
   * @param formatOptions.format String with fiscal format
   * @param formatOptions.calendarType String with calendar type
   * <h3>Overview</h3>
   *
   * Formatting, Validating and Parsing Fiscal Dates
   * @author SAP SE
   * @since 1.110.0
   * @experimental This module is only for internal/experimental use!
   * @hideconstructor
   */
  let FiscalFormat = /*#__PURE__*/function () {
    function FiscalFormat(formatOptions) {
      const locale = new Locale(Localization.getLanguage());
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const localeData = new LocaleData(locale);
      let format = formatOptions.format;
      if (formatOptions.format.length > 4) {
        format = "yM";
      } else if (formatOptions.format === "PPP") {
        format = "M";
      }
      let pattern = localeData.getCustomDateTimePattern(format, formatOptions.calendarType);
      pattern = pattern.replace(/([\u4e00-\u9faf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef])+/gi, "");
      // Parsing the "yM" format pattern to the pattern that would match the passed format
      if (formatOptions.format.length > 4) {
        pattern = pattern.replace(/y+/i, formatOptions.format.slice(0, formatOptions.format.lastIndexOf("Y") + 1));
        pattern = pattern.replace(/m+/i, formatOptions.format.slice(formatOptions.format.lastIndexOf("Y") + 1));
      } else if (formatOptions.format === "PPP") {
        pattern = "PPP";
      }
      const formatArray = this.parseCalendarDatePattern(pattern);
      this.pattern = formatArray.length > 1 ? pattern : undefined;
      this._setFormatRegex(formatArray);
      this._setParseRegex(formatArray);
      this._setValidationRegex(formatArray);
    }

    /**
     * Get a date instance of the <code>FiscalFormat</code> class, which can be used for formatting.
     * @param formatOptions Object that defines format options
     * @param formatOptions.format Fiscal format
     * @param formatOptions.calendarType Calendar type
     * @returns Instance of the FiscalFormat
     */
    _exports = FiscalFormat;
    FiscalFormat.getDateInstance = function getDateInstance(formatOptions) {
      return new FiscalFormat(formatOptions);
    };
    var _proto = FiscalFormat.prototype;
    _proto.getPattern = function getPattern() {
      return this.pattern;
    }

    /**
     * Format the raw fiscal data to a locale-dependent format.
     * @param value The parameter containing a raw fiscal value
     * @returns The formatted value
     */;
    _proto.format = function format(value) {
      if (value == null) {
        return "";
      }
      if (typeof value !== "string") {
        return value;
      }
      return value.replace(this.formatRegExPattern, this.formatRegExGroups);
    }

    /**
     * Parse from a locale-dependent format to a raw value.
     * @param value The string containing a parsed fiscal data value
     * @returns The raw value
     */;
    _proto.parse = function parse(value) {
      if (!value) {
        return "";
      }
      return value.replace(this.parseRegExPattern, this.parseRegExReplacer);
    }

    /**
     * Validates the data input.
     * @param value The raw fiscal data
     * @returns If <code>true</code> the validation passes, otherwise <code>false</code>
     */;
    _proto.validate = function validate(value) {
      return this.validationRegExPattern.test(value);
    }

    /**
     * Parse the date pattern string and create a format array from it.
     * Array is used for data parsing and formatting.
     * @param pattern The calendar date pattern string
     * @returns Format array
     */;
    _proto.parseCalendarDatePattern = function parseCalendarDatePattern(pattern) {
      const formatArray = [];
      let char,
        currentObject = {
          digits: 0,
          value: "",
          symbol: ""
        };
      for (const curChar of pattern) {
        if (char !== curChar) {
          currentObject = {
            digits: 0,
            value: "",
            symbol: ""
          };
        } else {
          currentObject.digits += 1;
          continue;
        }
        if (typeof FiscalFormat.symbols[curChar] === "undefined") {
          currentObject.value = curChar;
        } else {
          currentObject.symbol = curChar;
          currentObject.digits = 1;
        }
        char = curChar;
        formatArray.push(currentObject);
      }
      return formatArray;
    }

    /**
     * Creates the formatting regular expression based on the locale-dependent format.
     * @param formatArray An array with the locale-dependent format
     */;
    _proto._setFormatRegex = function _setFormatRegex(formatArray) {
      const regExPattern = [],
        regExGroups = [];
      let part, symbol, regex, year;
      for (let i = 0; i < formatArray.length; i++) {
        part = formatArray[i];
        symbol = part.symbol;
        regex = FiscalFormat.symbols[symbol].format;
        if (symbol === "") {
          regExGroups[i] = part.value;
        } else if (symbol.toLocaleLowerCase() === "y") {
          regExPattern.unshift("(" + regex.source + ")");
          regExGroups[i] = "$" + 1;
        } else {
          regExPattern.push("(" + regex.source + ")");
          year = formatArray.some(function (partEntry) {
            return partEntry.symbol.toLowerCase() === "y";
          });
          regExGroups[i] = year ? "$" + 2 : "$" + 1;
        }
      }
      this.formatRegExPattern = new RegExp(regExPattern.join(""));
      this.formatRegExGroups = regExGroups.join("");
    }

    /**
     * Creates the parsing regular expression based on the locale-dependent format.
     * @param formatArray An array with the locale-dependent format
     */;
    _proto._setParseRegex = function _setParseRegex(formatArray) {
      const regExPattern = [],
        filteredFormat = {};
      let symbol,
        regex,
        currGroup,
        group = 0;
      for (const part of formatArray) {
        symbol = part.symbol;
        if (symbol === "") {
          regExPattern.push("\\D+?");
        } else {
          regex = FiscalFormat.symbols[symbol].parse;
          regExPattern.push("(" + regex.source + ")");
          currGroup = ++group;
          filteredFormat[currGroup] = part;
        }
      }
      this.parseRegExPattern = new RegExp("^" + regExPattern.join("") + "$");
      this.parseRegExReplacer = this.getRegExReplacer(filteredFormat);
    }

    /**
     * Creates a function that is used to replace strings and then performs raw string parsing.
     * @param filteredFormat An array with the locale-dependent format
     * @returns Function that can be passed into the string.replace function
     */;
    _proto.getRegExReplacer = function getRegExReplacer(filteredFormat) {
      return function () {
        const result = [];
        let valuePart, stringGroup;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        for (const key in filteredFormat) {
          valuePart = filteredFormat[key];
          stringGroup = args[parseInt(key, 10)];
          if (stringGroup.length < valuePart.digits) {
            if (valuePart.symbol.toLowerCase() === "y") {
              stringGroup = parseYear(stringGroup);
            } else {
              stringGroup = stringGroup.padStart(valuePart.digits, "0");
            }
          }
          if (valuePart.symbol.toLowerCase() === "y") {
            result.unshift(stringGroup);
          } else {
            result.push(stringGroup);
          }
        }
        return result.join("");
      };
    }

    /**
     * Creates the validation regular expression based on the format.
     * @param formatArray An array with the locale-dependent format
     */;
    _proto._setValidationRegex = function _setValidationRegex(formatArray) {
      const regExPattern = [];
      let symbol, regex;
      for (const part of formatArray) {
        symbol = part.symbol;
        regex = FiscalFormat.symbols[symbol].format;
        if (symbol === "") {
          continue;
        } else if (symbol.toLowerCase() === "y") {
          regExPattern.unshift(regex.source);
        } else {
          regExPattern.push(regex.source);
        }
      }
      this.validationRegExPattern = new RegExp("^(" + regExPattern.join(")(") + ")$");
    }

    /**
     * Regular expression patterns used to format fiscal date strings
     */;
    return FiscalFormat;
  }();
  /**
   * Parses the Year format. This is how the DateFormat parses years, except those years consisting of 3 digits, since currency fiscal dates support only years consisting of 4 digits.
   * @param year Year string
   * @returns Year number
   */
  _FiscalFormat = FiscalFormat;
  _exports = FiscalFormat;
  FiscalFormat.regexFormatPatterns = {
    year: /[1-9]\d{3}/,
    period: /\d{3}/,
    quarter: /[1-4]/,
    week: /0[1-9]|[1-4]\d|5[0-3]/,
    day: /371|370|3[0-6]\d|[1-2]\d{2}|[1-9]\d|[1-9]/
  };
  /**
   * Regular expression patterns used for raw data parsing and validation
   */
  FiscalFormat.regexParsePatterns = {
    year: /\d{1,4}/,
    period: /\d{1,3}/,
    quarter: /[1-4]/,
    week: /\d{1,2}/,
    day: /[1-9]/
  };
  /**
   * Mapping from specific calendar type to corresponding formatting/parsing expression
   */
  FiscalFormat.symbols = {
    "": {
      format: / /,
      parse: / /
    },
    // "text"
    y: {
      format: _FiscalFormat.regexFormatPatterns.year,
      parse: _FiscalFormat.regexParsePatterns.year
    },
    // "year"
    Y: {
      format: _FiscalFormat.regexFormatPatterns.year,
      parse: _FiscalFormat.regexParsePatterns.year
    },
    // "weekYear"
    P: {
      format: _FiscalFormat.regexFormatPatterns.period,
      parse: _FiscalFormat.regexParsePatterns.period
    },
    // "period"
    W: {
      format: _FiscalFormat.regexFormatPatterns.week,
      parse: _FiscalFormat.regexParsePatterns.week
    },
    // "weekInYear"
    d: {
      format: _FiscalFormat.regexFormatPatterns.day,
      parse: _FiscalFormat.regexParsePatterns.day
    },
    // "dayInYear"
    Q: {
      format: _FiscalFormat.regexFormatPatterns.quarter,
      parse: _FiscalFormat.regexParsePatterns.quarter
    },
    // "quarter"
    q: {
      format: _FiscalFormat.regexFormatPatterns.quarter,
      parse: _FiscalFormat.regexParsePatterns.quarter
    } //"quarterStandalone"
  };
  function parseYear(year) {
    let parsedYear = Number.parseInt(year, 10);
    const currentYear = new Date().getUTCFullYear(),
      currentCentury = Math.floor(currentYear / 100),
      yearDiff = currentCentury * 100 + parsedYear - currentYear;
    if (year.length === 3) {
      parsedYear += Math.floor((currentCentury - 1) / 10) * 1000;
    } else if (yearDiff < -70) {
      parsedYear += (currentCentury + 1) * 100; // Take next century if "year" is 30 years in the future. Current year 1999 and we enter 28 it will we 2028
    } else if (yearDiff < 30) {
      parsedYear += currentCentury * 100; // Take next century if "year" is 30 years in the future. Current year 2000 and we enter 29 it will we 2029
    } else {
      parsedYear += (currentCentury - 1) * 100; // Any entered "year" that is more than 30 years in the future will be treated as from previous century
    }
    return parsedYear;
  }
  return _exports;
}, false);
//# sourceMappingURL=FiscalFormat-dbg.js.map

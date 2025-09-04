/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/strings/formatMessage", "sap/base/util/ObjectPath", "sap/fe/base/BindingToolkit", "sap/fe/core/controls/Any"], function (ui5FormatMessage, ObjectPath, BindingToolkit, Any) {
  "use strict";

  var transformRecursively = BindingToolkit.transformRecursively;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const evaluateComplexExpression = function (expressionAsString) {
    for (var _len = arguments.length, partsToConcat = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      partsToConcat[_key - 1] = arguments[_key];
    }
    const myExpression = JSON.parse(expressionAsString);
    transformRecursively(myExpression, "PathInModel", pathInModelDef => {
      if (pathInModelDef.modelName === "$") {
        return constant(partsToConcat[parseInt(pathInModelDef.path.substring(1), 10)]);
      }
      return pathInModelDef;
    }, true);
    transformRecursively(myExpression, "ComplexType", complexTypeDef => {
      const compiledExpression = compileExpression(complexTypeDef);
      if (compiledExpression) {
        return constant(getValue(compiledExpression, this));
      }
      return constant(compiledExpression);
    });
    const myCompiledExpression = compileExpression(myExpression);
    return getValue(myCompiledExpression, this);
  };
  const getValue = function (myExpression, target) {
    const myAny = new Any({
      anyText: myExpression
    });
    myAny.setModel(target.getModel());
    myAny.setBindingContext(target.getBindingContext());
    return myAny.getAnyText();
  };
  evaluateComplexExpression.__functionName = "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression";
  const concat = function () {
    for (var _len2 = arguments.length, partsToConcat = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      partsToConcat[_key2] = arguments[_key2];
    }
    return partsToConcat.join("");
  };
  concat.__functionName = "sap.fe.core.formatters.StandardFormatter#concat";
  const ifElse = function (condition, onTrue, onFalse) {
    return condition ? onTrue : onFalse;
  };
  ifElse.__functionName = "sap.fe.core.formatters.StandardFormatter#ifElse";
  const asArray = function (value) {
    if (value === undefined || value === null || value === "undefined" || value === "null") {
      return [];
    }
    return [value];
  };
  asArray.__functionName = "sap.fe.core.formatters.StandardFormatter#asArray";

  /**
   * Collection of table formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const standardFormatter = function (sName) {
    if (standardFormatter.hasOwnProperty(sName)) {
      for (var _len3 = arguments.length, oArgs = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        oArgs[_key3 - 1] = arguments[_key3];
      }
      return standardFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };

  /**
   * Dummy formatter to ensure complex binding paths are loaded.
   * @param args The arguments
   * @returns Returns null
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadProperties = function () {
    return null;
  };
  loadProperties.__functionName = "sap.fe.core.formatters.StandardFormatter#loadProperties";
  const formatPluralMessageConditionally = function (textSingular, textPlural, values) {
    return values === 1 ? textSingular : ui5FormatMessage(textPlural, [values]);
  };
  formatPluralMessageConditionally.__functionName = "sap.fe.core.formatters.StandardFormatter#formatPluralMessageConditionally";
  standardFormatter.evaluateComplexExpression = evaluateComplexExpression;
  standardFormatter.concat = concat;
  standardFormatter.ifElse = ifElse;
  standardFormatter.asArray = asArray;
  standardFormatter.loadProperties = loadProperties;
  standardFormatter.formatPluralMessageConditionally = formatPluralMessageConditionally;
  ObjectPath.set("sap.fe.core.formatters.StandardFormatter", standardFormatter);
  return standardFormatter;
}, false);
//# sourceMappingURL=StandardFormatter-dbg.js.map

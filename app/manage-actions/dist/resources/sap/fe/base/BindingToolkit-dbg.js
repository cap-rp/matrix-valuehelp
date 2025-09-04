/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/AnnotationEnum"], function (AnnotationEnum) {
  "use strict";

  var _exports = {};
  var resolveEnumValue = AnnotationEnum.resolveEnumValue;
  /**
   * @typedef PathInModelExpression
   */

  function isProperty(serviceObject) {
    return serviceObject?._type === "Property";
  }

  /**
   * An expression that evaluates to type T.
   * @typedef BindingToolkitExpression
   */
  _exports.isProperty = isProperty;
  const EDM_TYPE_MAPPING = {
    "Edm.Boolean": {
      type: "sap.ui.model.odata.type.Boolean"
    },
    "Edm.Byte": {
      type: "sap.ui.model.odata.type.Byte"
    },
    "Edm.Date": {
      type: "sap.ui.model.odata.type.Date"
    },
    "Edm.DateTimeOffset": {
      constraints: {
        $Precision: "precision",
        $V4: "V4"
      },
      type: "sap.ui.model.odata.type.DateTimeOffset"
    },
    "Edm.Decimal": {
      constraints: {
        "@Org.OData.Validation.V1.Minimum/$Decimal": "minimum",
        "@Org.OData.Validation.V1.Minimum@Org.OData.Validation.V1.Exclusive": "minimumExclusive",
        "@Org.OData.Validation.V1.Maximum/$Decimal": "maximum",
        "@Org.OData.Validation.V1.Maximum@Org.OData.Validation.V1.Exclusive": "maximumExclusive",
        $Precision: "precision",
        $Scale: "scale"
      },
      type: "sap.ui.model.odata.type.Decimal"
    },
    "Edm.Double": {
      type: "sap.ui.model.odata.type.Double"
    },
    "Edm.Guid": {
      type: "sap.ui.model.odata.type.Guid"
    },
    "Edm.Int16": {
      type: "sap.ui.model.odata.type.Int16"
    },
    "Edm.Int32": {
      type: "sap.ui.model.odata.type.Int32"
    },
    "Edm.Int64": {
      type: "sap.ui.model.odata.type.Int64"
    },
    "Edm.SByte": {
      type: "sap.ui.model.odata.type.SByte"
    },
    "Edm.Single": {
      type: "sap.ui.model.odata.type.Single"
    },
    "Edm.Stream": {
      type: "sap.ui.model.odata.type.Stream"
    },
    "Edm.Binary": {
      type: "sap.ui.model.odata.type.Stream"
    },
    "Edm.String": {
      constraints: {
        "@com.sap.vocabularies.Common.v1.IsDigitSequence": "isDigitSequence",
        $MaxLength: "maxLength",
        $Nullable: "nullable"
      },
      type: "sap.ui.model.odata.type.String"
    },
    "Edm.TimeOfDay": {
      constraints: {
        $Precision: "precision"
      },
      type: "sap.ui.model.odata.type.TimeOfDay"
    }
  };

  /**
   * An expression that evaluates to type T, or a constant value of type T
   */
  _exports.EDM_TYPE_MAPPING = EDM_TYPE_MAPPING;
  const unresolvableExpression = {
    _type: "Unresolvable"
  };
  _exports.unresolvableExpression = unresolvableExpression;
  function escapeXmlAttribute(inputString) {
    return inputString.replace(/'/g, "\\'");
  }
  _exports.escapeXmlAttribute = escapeXmlAttribute;
  function hasUnresolvableExpression() {
    for (var _len = arguments.length, expressions = new Array(_len), _key = 0; _key < _len; _key++) {
      expressions[_key] = arguments[_key];
    }
    return expressions.find(expr => expr._type === "Unresolvable") !== undefined;
  }
  /**
   * Check two expressions for (deep) equality.
   * @param a
   * @param b
   * @returns `true` if the two expressions are equal
   */
  _exports.hasUnresolvableExpression = hasUnresolvableExpression;
  function _checkExpressionsAreEqual(a, b) {
    if (a._type !== b._type) {
      return false;
    }
    switch (a._type) {
      case "Unresolvable":
        return false;
      // Unresolvable is never equal to anything even itself
      case "Constant":
      case "EmbeddedBinding":
      case "EmbeddedExpressionBinding":
        return a.value === b.value;
      case "Not":
        return _checkExpressionsAreEqual(a.operand, b.operand);
      case "Truthy":
        return _checkExpressionsAreEqual(a.operand, b.operand);
      case "Set":
        return a.operator === b.operator && a.operands.length === b.operands.length && a.operands.every(expression => b.operands.some(otherExpression => _checkExpressionsAreEqual(expression, otherExpression)));
      case "IfElse":
        return _checkExpressionsAreEqual(a.condition, b.condition) && _checkExpressionsAreEqual(a.onTrue, b.onTrue) && _checkExpressionsAreEqual(a.onFalse, b.onFalse);
      case "Comparison":
        return a.operator === b.operator && _checkExpressionsAreEqual(a.operand1, b.operand1) && _checkExpressionsAreEqual(a.operand2, b.operand2);
      case "Concat":
        const aExpressions = a.expressions;
        const bExpressions = b.expressions;
        if (aExpressions.length !== bExpressions.length) {
          return false;
        }
        return aExpressions.every((expression, index) => {
          return _checkExpressionsAreEqual(expression, bExpressions[index]);
        });
      case "Length":
        return _checkExpressionsAreEqual(a.pathInModel, b.pathInModel);
      case "PathInModel":
        return a.modelName === b.modelName && a.path === b.path && a.targetEntitySet === b.targetEntitySet;
      case "Formatter":
        return a.fn === b.fn && a.parameters.length === b.parameters.length && a.parameters.every((value, index) => _checkExpressionsAreEqual(b.parameters[index], value));
      case "ComplexType":
        return a.type === b.type && a.bindingParameters.length === b.bindingParameters.length && a.bindingParameters.every((value, index) => _checkExpressionsAreEqual(b.bindingParameters[index], value));
      case "Function":
        const otherFunction = b;
        if (a.obj === undefined || otherFunction.obj === undefined) {
          return a.obj === otherFunction;
        }
        return a.fn === otherFunction.fn && _checkExpressionsAreEqual(a.obj, otherFunction.obj) && a.parameters.length === otherFunction.parameters.length && a.parameters.every((value, index) => _checkExpressionsAreEqual(otherFunction.parameters[index], value));
      case "Ref":
        return a.ref === b.ref;
    }
    return false;
  }

  /**
   * Converts a nested SetExpression by inlining operands of type SetExpression with the same operator.
   * @param expression The expression to flatten
   * @returns A new SetExpression with the same operator
   */
  _exports._checkExpressionsAreEqual = _checkExpressionsAreEqual;
  function flattenSetExpression(expression) {
    return expression.operands.reduce((result, operand) => {
      const candidatesForFlattening = operand._type === "Set" && operand.operator === expression.operator ? operand.operands : [operand];
      candidatesForFlattening.forEach(candidate => {
        if (result.operands.every(e => !_checkExpressionsAreEqual(e, candidate))) {
          result.operands.push(candidate);
        }
      });
      return result;
    }, {
      _type: "Set",
      operator: expression.operator,
      operands: []
    });
  }

  /**
   * Detects whether an array of boolean expressions contains an expression and its negation.
   * @param expressions Array of expressions
   * @returns `true` if the set of expressions contains an expression and its negation
   */
  function hasOppositeExpressions(expressions) {
    const negatedExpressions = expressions.map(not);
    return expressions.some((expression, index) => {
      for (let i = index + 1; i < negatedExpressions.length; i++) {
        if (_checkExpressionsAreEqual(expression, negatedExpressions[i])) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Logical `and` expression.
   *
   * The expression is simplified to false if this can be decided statically (that is, if one operand is a constant
   * false or if the expression contains an operand and its negation).
   * @param operands Expressions to connect by `and`
   * @returns Expression evaluating to boolean
   */
  function and() {
    for (var _len2 = arguments.length, operands = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      operands[_key2] = arguments[_key2];
    }
    const expressions = flattenSetExpression({
      _type: "Set",
      operator: "&&",
      operands: operands.map(wrapPrimitive)
    }).operands;
    if (hasUnresolvableExpression(...expressions)) {
      return unresolvableExpression;
    }
    let isStaticFalse = false;
    const nonTrivialExpression = expressions.filter(expression => {
      if (isFalse(expression)) {
        isStaticFalse = true;
      }
      return !isConstant(expression);
    });
    if (isStaticFalse) {
      return constant(false);
    } else if (nonTrivialExpression.length === 0) {
      // Resolve the constant then
      const isValid = expressions.reduce((result, expression) => result && isTrue(expression), true);
      return constant(isValid);
    } else if (nonTrivialExpression.length === 1) {
      return nonTrivialExpression[0];
    } else if (hasOppositeExpressions(nonTrivialExpression)) {
      return constant(false);
    } else {
      return {
        _type: "Set",
        operator: "&&",
        operands: nonTrivialExpression
      };
    }
  }

  /**
   * Logical `or` expression.
   *
   * The expression is simplified to true if this can be decided statically (that is, if one operand is a constant
   * true or if the expression contains an operand and its negation).
   * @param operands Expressions to connect by `or`
   * @returns Expression evaluating to boolean
   */
  _exports.and = and;
  function or() {
    for (var _len3 = arguments.length, operands = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      operands[_key3] = arguments[_key3];
    }
    const expressions = flattenSetExpression({
      _type: "Set",
      operator: "||",
      operands: operands.map(wrapPrimitive)
    }).operands;
    if (hasUnresolvableExpression(...expressions)) {
      return unresolvableExpression;
    }
    let isStaticTrue = false;
    const nonTrivialExpression = expressions.filter(expression => {
      if (isTrue(expression)) {
        isStaticTrue = true;
      }
      return !isConstant(expression) || expression.value;
    });
    if (isStaticTrue) {
      return constant(true);
    } else if (nonTrivialExpression.length === 0) {
      // Resolve the constant then
      const isValid = expressions.reduce((result, expression) => result && isTrue(expression), true);
      return constant(isValid);
    } else if (nonTrivialExpression.length === 1) {
      return nonTrivialExpression[0];
    } else if (hasOppositeExpressions(nonTrivialExpression)) {
      return constant(true);
    } else {
      return {
        _type: "Set",
        operator: "||",
        operands: nonTrivialExpression
      };
    }
  }

  /**
   * Logical `not` operator.
   * @param operand The expression to reverse
   * @returns The resulting expression that evaluates to boolean
   */
  _exports.or = or;
  function not(operand) {
    operand = wrapPrimitive(operand);
    if (hasUnresolvableExpression(operand)) {
      return unresolvableExpression;
    } else if (isConstant(operand)) {
      return constant(!operand.value);
    } else if (typeof operand === "object" && operand._type === "Set" && operand.operator === "||" && operand.operands.every(expression => isConstant(expression) || isComparison(expression))) {
      return and(...operand.operands.map(expression => not(expression)));
    } else if (typeof operand === "object" && operand._type === "Set" && operand.operator === "&&" && operand.operands.every(expression => isConstant(expression) || isComparison(expression))) {
      return or(...operand.operands.map(expression => not(expression)));
    } else if (isComparison(operand)) {
      // Create the reverse comparison
      switch (operand.operator) {
        case "!==":
          return {
            ...operand,
            operator: "==="
          };
        case "<":
          return {
            ...operand,
            operator: ">="
          };
        case "<=":
          return {
            ...operand,
            operator: ">"
          };
        case "===":
          return {
            ...operand,
            operator: "!=="
          };
        case ">":
          return {
            ...operand,
            operator: "<="
          };
        case ">=":
          return {
            ...operand,
            operator: "<"
          };
      }
    } else if (operand._type === "Not") {
      return operand.operand;
    }
    return {
      _type: "Not",
      operand: operand
    };
  }

  /**
   * Evaluates whether a binding expression is equal to true with a loose equality.
   * @param operand The expression to check
   * @returns The resulting expression that evaluates to boolean
   */
  _exports.not = not;
  function isTruthy(operand) {
    if (isConstant(operand)) {
      return constant(!!operand.value);
    } else {
      return {
        _type: "Truthy",
        operand: operand
      };
    }
  }

  /**
   * Creates a binding expression that will be evaluated by the corresponding model.
   * @param path
   * @param modelName
   * @param visitedNavigationPaths
   * @param pathVisitor
   * @returns An expression representating that path in the model
   * @deprecated use pathInModel instead
   */
  _exports.isTruthy = isTruthy;
  function bindingExpression(path, modelName) {
    let visitedNavigationPaths = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    let pathVisitor = arguments.length > 3 ? arguments[3] : undefined;
    return pathInModel(path, modelName, visitedNavigationPaths, pathVisitor);
  }

  /**
   * Creates a binding expression that will be evaluated by the corresponding model.
   * @template TargetType
   * @param path The path on the model
   * @param [modelName] The name of the model
   * @param [visitedNavigationPaths] The paths from the root entitySet
   * @param [pathVisitor] A function to modify the resulting path
   * @returns An expression representating that path in the model
   */
  _exports.bindingExpression = bindingExpression;
  function pathInModel(path, modelName) {
    let visitedNavigationPaths = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    let pathVisitor = arguments.length > 3 ? arguments[3] : undefined;
    if (path === undefined) {
      return unresolvableExpression;
    }
    let targetPath;
    if (pathVisitor) {
      targetPath = pathVisitor(path);
      if (targetPath === undefined) {
        return unresolvableExpression;
      }
    } else {
      const localPath = visitedNavigationPaths.concat();
      localPath.push(path);
      targetPath = localPath.join("/");
    }
    return {
      _type: "PathInModel",
      modelName: modelName,
      path: targetPath
    };
  }
  _exports.pathInModel = pathInModel;
  /**
   * Creates a constant expression based on a primitive value.
   * @template T
   * @param value The constant to wrap in an expression
   * @returns The constant expression
   */
  function constant(value) {
    let constantValue;
    if (typeof value === "object" && value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        constantValue = value.map(wrapPrimitive);
      } else if (isPrimitiveObject(value)) {
        constantValue = value.valueOf();
      } else {
        constantValue = Object.entries(value).reduce((plainExpression, _ref) => {
          let [key, val] = _ref;
          const wrappedValue = wrapPrimitive(val);
          if (wrappedValue._type !== "Constant" || wrappedValue.value !== undefined) {
            plainExpression[key] = wrappedValue;
          }
          return plainExpression;
        }, {});
      }
    } else {
      constantValue = value;
    }
    return {
      _type: "Constant",
      value: constantValue
    };
  }
  _exports.constant = constant;
  function resolveBindingString(value, targetType) {
    if (value !== undefined && typeof value === "string" && value.startsWith("{")) {
      const pathInModelRegex = /^{(.*)>(.+)}$/; // Matches model paths like "model>path" or ">path" (default model)
      const pathInModelRegexMatch = pathInModelRegex.exec(value);
      if (value.startsWith("{=")) {
        // Expression binding, we can just remove the outer binding things
        return {
          _type: "EmbeddedExpressionBinding",
          value: value
        };
      } else if (pathInModelRegexMatch) {
        return pathInModel(pathInModelRegexMatch[2] || "", pathInModelRegexMatch[1] || undefined);
      } else {
        return {
          _type: "EmbeddedBinding",
          value: value
        };
      }
    } else if (targetType === "boolean" && typeof value === "string" && (value === "true" || value === "false")) {
      return constant(value === "true");
    } else if (targetType === "number" && typeof value === "string" && (!isNaN(Number(value)) || value === "NaN")) {
      return constant(Number(value));
    } else {
      return constant(value);
    }
  }

  /**
   * A named reference.
   * @see fn
   * @param reference Reference
   * @returns The object reference binding part
   */
  _exports.resolveBindingString = resolveBindingString;
  function ref(reference) {
    return {
      _type: "Ref",
      ref: reference
    };
  }

  /**
   * Wrap a state object into a path in model expression.
   * @template T
   * @param stateObjectProp The object to evaluate, if it's a constant it will be wrapped in a constant expression, if it's a state property it will be bound
   * @param key The key of the state object to bind
   * @returns The correct binding toolkit expression
   */
  _exports.ref = ref;
  function bindState(stateObjectProp, key) {
    if (typeof stateObjectProp === "object" && stateObjectProp.__bindingInfo) {
      return pathInModel("/" + key.toString(), stateObjectProp.__bindingInfo.model);
    } else {
      return constant(stateObjectProp);
    }
  }
  /**
   * Wrap a primitive into a constant expression if it is not already an expression.
   * @template T
   * @param something The object to wrap in a Constant expression
   * @returns Either the original object or the wrapped one depending on the case
   */
  _exports.bindState = bindState;
  function wrapPrimitive(something) {
    if (isBindingToolkitExpression(something)) {
      return something;
    }
    return constant(something);
  }

  /**
   * Checks if the expression or value provided is a binding tooling expression or not.
   *
   * Every object having a property named `_type` of some value is considered an expression, even if there is actually
   * no such expression type supported.
   * @param expression
   * @returns `true` if the expression is a binding toolkit expression
   */
  _exports.wrapPrimitive = wrapPrimitive;
  function isBindingToolkitExpression(expression) {
    return expression?._type !== undefined;
  }

  /**
   * Checks if the expression or value provided is constant or not.
   * @template T The target type
   * @param  maybeConstant The expression or primitive value that is to be checked
   * @returns `true` if it is constant
   */
  _exports.isBindingToolkitExpression = isBindingToolkitExpression;
  function isConstant(maybeConstant) {
    return typeof maybeConstant !== "object" || maybeConstant._type === "Constant";
  }
  _exports.isConstant = isConstant;
  function isTrue(expression) {
    return isConstant(expression) && expression.value === true;
  }
  function isFalse(expression) {
    return isConstant(expression) && expression.value === false;
  }

  /**
   * Checks if the expression or value provided is a path in model expression or not.
   * @template T The target type
   * @param  maybeBinding The expression or primitive value that is to be checked
   * @returns `true` if it is a path in model expression
   */
  function isPathInModelExpression(maybeBinding) {
    return maybeBinding?._type === "PathInModel";
  }

  /**
   * Checks if the expression or value provided is a complex type expression.
   * @template T The target type
   * @param  maybeBinding The expression or primitive value that is to be checked
   * @returns `true` if it is a path in model expression
   */
  _exports.isPathInModelExpression = isPathInModelExpression;
  function isComplexTypeExpression(maybeBinding) {
    return maybeBinding?._type === "ComplexType";
  }

  /**
   * Checks if the expression or value provided is a concat expression or not.
   * @param expression
   * @returns `true` if the expression is a ConcatExpression
   */
  _exports.isComplexTypeExpression = isComplexTypeExpression;
  function isConcatExpression(expression) {
    return expression?._type === "Concat";
  }

  /**
   * Checks if the expression or value provided is a IfElse expression or not.
   * @param expression
   * @returns `true` if the expression is a IfElseExpression
   */
  function isIfElseExpression(expression) {
    return expression?._type === "IfElse";
  }

  /**
   * Checks if the expression provided is a comparison or not.
   * @template T The target type
   * @param expression The expression
   * @returns `true` if the expression is a ComparisonExpression
   */
  function isComparison(expression) {
    return expression._type === "Comparison";
  }

  /**
   * Checks whether the input parameter is a constant expression of type undefined.
   * @param expression The input expression or object in general
   * @returns `true` if the input is constant which has undefined for value
   */
  function isUndefinedExpression(expression) {
    const expressionAsExpression = expression;
    return expressionAsExpression?._type === "Constant" && expressionAsExpression?.value === undefined;
  }
  _exports.isUndefinedExpression = isUndefinedExpression;
  function isPrimitiveObject(objectType) {
    switch (objectType.constructor.name) {
      case "String":
      case "Number":
      case "Boolean":
        return true;
      default:
        return false;
    }
  }
  /**
   * Check if the passed annotation annotationValue is a ComplexAnnotationExpression.
   * @template T The target type
   * @param  annotationValue The annotation annotationValue to evaluate
   * @returns `true` if the object is a {ComplexAnnotationExpression}
   */
  function isComplexAnnotationExpression(annotationValue) {
    return typeof annotationValue === "object" && !isPrimitiveObject(annotationValue);
  }

  /**
   * Generate the corresponding annotationValue for a given annotation annotationValue.
   * @template T The target type
   * @param annotationValue The source annotation annotationValue
   * @param visitedNavigationPaths The path from the root entity set
   * @param defaultValue Default value if the annotationValue is undefined
   * @param pathVisitor A function to modify the resulting path
   * @returns The annotationValue equivalent to that annotation annotationValue
   */
  function getExpressionFromAnnotation(annotationValue) {
    let visitedNavigationPaths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let defaultValue = arguments.length > 2 ? arguments[2] : undefined;
    let pathVisitor = arguments.length > 3 ? arguments[3] : undefined;
    if (annotationValue === undefined) {
      return wrapPrimitive(defaultValue);
    }
    annotationValue = annotationValue?.valueOf();
    if (!isComplexAnnotationExpression(annotationValue)) {
      return constant(annotationValue);
    }
    switch (annotationValue.type) {
      case "Path":
        return pathInModel(annotationValue.path, undefined, visitedNavigationPaths, pathVisitor);
      case "If":
        return annotationIfExpression(annotationValue.$If, visitedNavigationPaths, pathVisitor);
      case "Not":
        return not(parseAnnotationCondition(annotationValue.$Not, visitedNavigationPaths, pathVisitor));
      case "Eq":
        return equal(parseAnnotationCondition(annotationValue.$Eq[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Eq[1], visitedNavigationPaths, pathVisitor));
      case "Ne":
        return notEqual(parseAnnotationCondition(annotationValue.$Ne[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ne[1], visitedNavigationPaths, pathVisitor));
      case "Gt":
        return greaterThan(parseAnnotationCondition(annotationValue.$Gt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Gt[1], visitedNavigationPaths, pathVisitor));
      case "Ge":
        return greaterOrEqual(parseAnnotationCondition(annotationValue.$Ge[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ge[1], visitedNavigationPaths, pathVisitor));
      case "Lt":
        return lessThan(parseAnnotationCondition(annotationValue.$Lt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Lt[1], visitedNavigationPaths, pathVisitor));
      case "Le":
        return lessOrEqual(parseAnnotationCondition(annotationValue.$Le[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Le[1], visitedNavigationPaths, pathVisitor));
      case "Or":
        return or(...annotationValue.$Or.map(function (orCondition) {
          return parseAnnotationCondition(orCondition, visitedNavigationPaths, pathVisitor);
        }));
      case "And":
        return and(...annotationValue.$And.map(function (andCondition) {
          return parseAnnotationCondition(andCondition, visitedNavigationPaths, pathVisitor);
        }));
      case "Apply":
        return annotationApplyExpression(annotationValue, visitedNavigationPaths, pathVisitor);
      case "Constant":
        // Not a real case but the type system needs it
        return constant(annotationValue.value);
    }
    return unresolvableExpression;
  }

  /**
   * Parse the annotation condition into an expression.
   * @template T The target type
   * @param annotationValue The condition or value from the annotation
   * @param visitedNavigationPaths The path from the root entity set
   * @param pathVisitor A function to modify the resulting path
   * @returns An equivalent expression
   */
  _exports.getExpressionFromAnnotation = getExpressionFromAnnotation;
  function parseAnnotationCondition(annotationValue) {
    let visitedNavigationPaths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let pathVisitor = arguments.length > 2 ? arguments[2] : undefined;
    if (annotationValue === null || typeof annotationValue !== "object") {
      return constant(annotationValue);
    } else if (annotationValue.hasOwnProperty("$Or")) {
      return or(...annotationValue.$Or.map(function (orCondition) {
        return parseAnnotationCondition(orCondition, visitedNavigationPaths, pathVisitor);
      }));
    } else if (annotationValue.hasOwnProperty("$And")) {
      return and(...annotationValue.$And.map(function (andCondition) {
        return parseAnnotationCondition(andCondition, visitedNavigationPaths, pathVisitor);
      }));
    } else if (annotationValue.hasOwnProperty("$Not")) {
      return not(parseAnnotationCondition(annotationValue.$Not, visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Eq")) {
      return equal(parseAnnotationCondition(annotationValue.$Eq[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Eq[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Ne")) {
      return notEqual(parseAnnotationCondition(annotationValue.$Ne[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ne[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Gt")) {
      return greaterThan(parseAnnotationCondition(annotationValue.$Gt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Gt[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Ge")) {
      return greaterOrEqual(parseAnnotationCondition(annotationValue.$Ge[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ge[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Lt")) {
      return lessThan(parseAnnotationCondition(annotationValue.$Lt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Lt[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Le")) {
      return lessOrEqual(parseAnnotationCondition(annotationValue.$Le[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Le[1], visitedNavigationPaths, pathVisitor));
    } else if (annotationValue.hasOwnProperty("$Path")) {
      return pathInModel(annotationValue.$Path, undefined, visitedNavigationPaths, pathVisitor);
    } else if (annotationValue.hasOwnProperty("$Apply")) {
      return getExpressionFromAnnotation({
        type: "Apply",
        $Function: annotationValue.$Function,
        $Apply: annotationValue.$Apply
      }, visitedNavigationPaths, undefined, pathVisitor);
    } else if (annotationValue.hasOwnProperty("$If")) {
      return getExpressionFromAnnotation({
        type: "If",
        $If: annotationValue.$If
      }, visitedNavigationPaths, undefined, pathVisitor);
    } else if (annotationValue.hasOwnProperty("$EnumMember")) {
      return constant(resolveEnumValue(annotationValue.$EnumMember));
    }
    return constant(false);
  }

  /**
   * Process the {IfAnnotationExpressionValue} into an expression.
   * @template T The target type
   * @param annotationValue An If expression returning the type T
   * @param visitedNavigationPaths The path from the root entity set
   * @param pathVisitor A function to modify the resulting path
   * @returns The equivalent ifElse expression
   */
  function annotationIfExpression(annotationValue) {
    let visitedNavigationPaths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let pathVisitor = arguments.length > 2 ? arguments[2] : undefined;
    return ifElse(parseAnnotationCondition(annotationValue[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue[1], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue[2], visitedNavigationPaths, pathVisitor));
  }
  // This type is not recursively transformed from the metamodel content, as such we have some ugly things there
  _exports.annotationIfExpression = annotationIfExpression;
  function convertSubApplyParameters(applyParam) {
    let applyParamConverted = applyParam;
    if (applyParam.hasOwnProperty("$Path")) {
      applyParamConverted = {
        type: "Path",
        path: applyParam.$Path
      };
    } else if (applyParam.hasOwnProperty("$If")) {
      applyParamConverted = {
        type: "If",
        $If: applyParam.$If
      };
    } else if (applyParam.hasOwnProperty("$Apply")) {
      applyParamConverted = {
        type: "Apply",
        $Function: applyParam.$Function,
        $Apply: applyParam.$Apply
      };
    }
    return applyParamConverted;
  }
  function annotationApplyExpression(applyExpression) {
    let visitedNavigationPaths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let pathVisitor = arguments.length > 2 ? arguments[2] : undefined;
    switch (applyExpression.$Function) {
      case "odata.concat":
        return concat(...applyExpression.$Apply.map(applyParam => {
          return getExpressionFromAnnotation(convertSubApplyParameters(applyParam), visitedNavigationPaths, undefined, pathVisitor);
        }));
      case "odata.uriEncode":
        const parameter = getExpressionFromAnnotation(convertSubApplyParameters(applyExpression.$Apply[0]), visitedNavigationPaths, undefined, pathVisitor);
        // The second parameter for uriEncode is always a string since the target evaluation is against a formatValue call in ODataUtils which expect the target type as second parameter
        return fn("odata.uriEncode", [parameter, "Edm.String"], undefined, true);
      case "odata.fillUriTemplate":
        const template = applyExpression.$Apply[0];
        const templateParams = applyExpression.$Apply.slice(1);
        const targetObject = {};
        templateParams.forEach(applyParam => {
          targetObject[applyParam.$Name] = getExpressionFromAnnotation(convertSubApplyParameters(applyParam.$LabeledElement), visitedNavigationPaths, undefined, pathVisitor);
        });
        return fn("odata.fillUriTemplate", [template, targetObject], undefined, true);
    }
    return unresolvableExpression;
  }

  /**
   * Generic helper for the comparison operations (equal, notEqual, ...).
   * @template T The target type
   * @param operator The operator to apply
   * @param leftOperand The operand on the left side of the operator
   * @param rightOperand The operand on the right side of the operator
   * @returns An expression representing the comparison
   */
  _exports.annotationApplyExpression = annotationApplyExpression;
  function comparison(operator, leftOperand, rightOperand) {
    const leftExpression = wrapPrimitive(leftOperand);
    const rightExpression = wrapPrimitive(rightOperand);
    if (hasUnresolvableExpression(leftExpression, rightExpression)) {
      return unresolvableExpression;
    }
    if (isConstant(leftExpression) && isConstant(rightExpression)) {
      switch (operator) {
        case "!==":
          return constant(leftExpression.value !== rightExpression.value);
        case "===":
          return constant(leftExpression.value === rightExpression.value);
        case "<":
          if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
            return constant(false);
          }
          return constant(leftExpression.value < rightExpression.value);
        case "<=":
          if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
            return constant(false);
          }
          return constant(leftExpression.value <= rightExpression.value);
        case ">":
          if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
            return constant(false);
          }
          return constant(leftExpression.value > rightExpression.value);
        case ">=":
          if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
            return constant(false);
          }
          return constant(leftExpression.value >= rightExpression.value);
      }
    } else {
      return {
        _type: "Comparison",
        operator: operator,
        operand1: leftExpression,
        operand2: rightExpression
      };
    }
  }

  /**
   * Generic helper for the length of an expression.
   * @param expression The input expression pointing to an array
   * @param checkUndefined Is the array potentially undefined
   * @returns An expression representing the length
   */
  function length(expression) {
    let checkUndefined = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (expression._type === "Unresolvable") {
      return expression;
    }
    if (!checkUndefined) {
      return {
        _type: "Length",
        pathInModel: expression
      };
    }
    return ifElse(equal(expression, undefined), -1, length(expression));
  }

  /**
   * Comparison: "equal" (===).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.length = length;
  function equal(leftOperand, rightOperand) {
    const leftExpression = wrapPrimitive(leftOperand);
    const rightExpression = wrapPrimitive(rightOperand);
    if (hasUnresolvableExpression(leftExpression, rightExpression)) {
      return unresolvableExpression;
    }
    if (_checkExpressionsAreEqual(leftExpression, rightExpression)) {
      return constant(true);
    }
    function reduce(left, right) {
      if (left._type === "Comparison" && isTrue(right)) {
        // compare(a, b) === true ~~> compare(a, b)
        return left;
      } else if (left._type === "Comparison" && isFalse(right)) {
        // compare(a, b) === false ~~> !compare(a, b)
        return not(left);
      } else if (left._type === "IfElse" && _checkExpressionsAreEqual(left.onTrue, right)) {
        // (if (x) { a } else { b }) === a ~~> x || (b === a)
        return or(left.condition, equal(left.onFalse, right));
      } else if (left._type === "IfElse" && _checkExpressionsAreEqual(left.onFalse, right)) {
        // (if (x) { a } else { b }) === b ~~> !x || (a === b)
        return or(not(left.condition), equal(left.onTrue, right));
      } else if (left._type === "IfElse" && isConstant(left.onTrue) && isConstant(left.onFalse) && isConstant(right) && !_checkExpressionsAreEqual(left.onTrue, right) && !_checkExpressionsAreEqual(left.onFalse, right)) {
        return constant(false);
      }
      return undefined;
    }

    // exploit symmetry: a === b <~> b === a
    const reduced = reduce(leftExpression, rightExpression) ?? reduce(rightExpression, leftExpression);
    return reduced ?? comparison("===", leftExpression, rightExpression);
  }

  /**
   * Comparison: "not equal" (!==).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.equal = equal;
  function notEqual(leftOperand, rightOperand) {
    return not(equal(leftOperand, rightOperand));
  }

  /**
   * Comparison: "greater or equal" (>=).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.notEqual = notEqual;
  function greaterOrEqual(leftOperand, rightOperand) {
    return comparison(">=", leftOperand, rightOperand);
  }

  /**
   * Comparison: "greater than" (>).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.greaterOrEqual = greaterOrEqual;
  function greaterThan(leftOperand, rightOperand) {
    return comparison(">", leftOperand, rightOperand);
  }

  /**
   * Comparison: "less or equal" (<=).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.greaterThan = greaterThan;
  function lessOrEqual(leftOperand, rightOperand) {
    return comparison("<=", leftOperand, rightOperand);
  }

  /**
   * Comparison: "less than" (<).
   * @template T The target type
   * @param leftOperand The operand on the left side
   * @param rightOperand The operand on the right side of the comparison
   * @returns An expression representing the comparison
   */
  _exports.lessOrEqual = lessOrEqual;
  function lessThan(leftOperand, rightOperand) {
    return comparison("<", leftOperand, rightOperand);
  }

  /**
   * If-then-else expression.
   *
   * Evaluates to onTrue if the condition evaluates to true, else evaluates to onFalse.
   * @template T The target type
   * @param condition The condition to evaluate
   * @param onTrue Expression result if the condition evaluates to true
   * @param onFalse Expression result if the condition evaluates to false
   * @returns The expression that represents this conditional check
   */
  _exports.lessThan = lessThan;
  function ifElse(condition, onTrue, onFalse) {
    let conditionExpression = wrapPrimitive(condition);
    let onTrueExpression = wrapPrimitive(onTrue);
    let onFalseExpression = wrapPrimitive(onFalse);

    // swap branches if the condition is a negation
    if (conditionExpression._type === "Not") {
      // ifElse(not(X), a, b) --> ifElse(X, b, a)
      [onTrueExpression, onFalseExpression] = [onFalseExpression, onTrueExpression];
      conditionExpression = not(conditionExpression);
    }

    // inline nested if-else expressions: onTrue branch
    // ifElse(X, ifElse(X, a, b), c) ==> ifElse(X, a, c)
    if (onTrueExpression._type === "IfElse" && _checkExpressionsAreEqual(conditionExpression, onTrueExpression.condition)) {
      onTrueExpression = onTrueExpression.onTrue;
    }

    // inline nested if-else expressions: onFalse branch
    // ifElse(X, a, ifElse(X, b, c)) ==> ifElse(X, a, c)
    if (onFalseExpression._type === "IfElse" && _checkExpressionsAreEqual(conditionExpression, onFalseExpression.condition)) {
      onFalseExpression = onFalseExpression.onFalse;
    }

    // (if true then a else b)  ~~> a
    // (if false then a else b) ~~> b
    if (isConstant(conditionExpression)) {
      return conditionExpression.value ? onTrueExpression : onFalseExpression;
    }

    // if (isConstantBoolean(onTrueExpression) || isConstantBoolean(onFalseExpression)) {
    // 	return or(and(condition, onTrueExpression as Expression<boolean>), and(not(condition), onFalseExpression as Expression<boolean>)) as Expression<T>
    // }

    // (if X then a else a) ~~> a
    if (_checkExpressionsAreEqual(onTrueExpression, onFalseExpression)) {
      return onTrueExpression;
    }

    // if X then a else false ~~> X && a
    if (isFalse(onFalseExpression)) {
      return and(conditionExpression, onTrueExpression);
    }

    // if X then a else true ~~> !X || a
    if (isTrue(onFalseExpression)) {
      return or(not(conditionExpression), onTrueExpression);
    }

    // if X then false else a ~~> !X && a
    if (isFalse(onTrueExpression)) {
      return and(not(conditionExpression), onFalseExpression);
    }

    // if X then true else a ~~> X || a
    if (isTrue(onTrueExpression)) {
      return or(conditionExpression, onFalseExpression);
    }
    if (hasUnresolvableExpression(conditionExpression, onTrueExpression, onFalseExpression)) {
      return unresolvableExpression;
    }
    if (isComplexTypeExpression(condition) || isComplexTypeExpression(onTrue) || isComplexTypeExpression(onFalse)) {
      let pathIdx = 0;
      const myIfElseExpression = formatResult([condition, onTrue, onFalse], "sap.fe.core.formatters.StandardFormatter#ifElse");
      const allParts = [];
      transformRecursively(myIfElseExpression, "PathInModel", constantPath => {
        allParts.push(constantPath);
        return pathInModel(`$${pathIdx++}`, "$");
      }, true);
      allParts.unshift(constant(JSON.stringify(myIfElseExpression)));
      return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
    }
    return {
      _type: "IfElse",
      condition: conditionExpression,
      onTrue: onTrueExpression,
      onFalse: onFalseExpression
    };
  }

  /**
   * Checks whether the current expression has a reference to the default model (undefined).
   * @param expression The expression to evaluate
   * @returns `true` if there is a reference to the default context
   */
  _exports.ifElse = ifElse;
  function hasReferenceToDefaultContext(expression) {
    switch (expression._type) {
      case "Constant":
      case "Formatter":
      case "ComplexType":
        return false;
      case "Set":
        return expression.operands.some(hasReferenceToDefaultContext);
      case "PathInModel":
        return expression.modelName === undefined;
      case "Comparison":
        return hasReferenceToDefaultContext(expression.operand1) || hasReferenceToDefaultContext(expression.operand2);
      case "IfElse":
        return hasReferenceToDefaultContext(expression.condition) || hasReferenceToDefaultContext(expression.onTrue) || hasReferenceToDefaultContext(expression.onFalse);
      case "Not":
      case "Truthy":
        return hasReferenceToDefaultContext(expression.operand);
      default:
        return false;
    }
  }

  // This is one case where any does make sense...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  /**
   * @typedef WrappedTuple
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore

  // So, this works but I cannot get it to compile :D, but it still does what is expected...

  /**
   * A function reference or a function name.
   */

  /**
   * Function parameters, either derived from the function or an untyped array.
   */

  /**
   * Calls a formatter function to process the parameters.
   * If requireContext is set to true and no context is passed a default context will be added automatically.
   * @template T
   * @template U
   * @param parameters The list of parameter that should match the type and number of the formatter function
   * @param formatterFunction The function to call
   * @param [contextEntityType] If no parameter refers to the context then we use this information to add a reference to the keys from the entity type.
   * @param [ignoreComplexType] Whether to ignore the transgformation to the StandardFormatter or not
   * @returns The corresponding expression
   */
  function formatResult(parameters, formatterFunction, contextEntityType) {
    let ignoreComplexType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const parameterExpressions = parameters.map(wrapPrimitive);
    if (hasUnresolvableExpression(...parameterExpressions)) {
      return unresolvableExpression;
    }
    if (contextEntityType) {
      // Otherwise, if the context is required and no context is provided make sure to add the default binding
      if (!parameterExpressions.some(hasReferenceToDefaultContext)) {
        contextEntityType.keys.forEach(key => parameterExpressions.push(pathInModel(key.name, "")));
      }
    }
    let functionName = "";
    if (typeof formatterFunction === "string") {
      functionName = formatterFunction;
    } else {
      functionName = formatterFunction.__functionName;
    }
    // FormatterName can be of format sap.fe.core.xxx#methodName to have multiple formatter in one class
    const [formatterClass, formatterName] = functionName.split("#");

    // In some case we also cannot call directly a function because of too complex input, in that case we need to convert to a simpler function call
    if (!ignoreComplexType && (parameterExpressions.some(isComplexTypeExpression) || parameterExpressions.some(isConcatExpression) || parameterExpressions.some(isIfElseExpression))) {
      let pathIdx = 0;
      const myFormatExpression = formatResult(parameterExpressions, functionName, undefined, true);
      const allParts = [];
      transformRecursively(myFormatExpression, "PathInModel", constantPath => {
        allParts.push(constantPath);
        return pathInModel(`$${pathIdx++}`, "$");
      }, true);
      allParts.unshift(constant(JSON.stringify(myFormatExpression)));
      return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
    } else if (!!formatterName && formatterName.length > 0) {
      parameterExpressions.unshift(constant(formatterName));
    }
    return {
      _type: "Formatter",
      fn: formatterClass,
      parameters: parameterExpressions
    };
  }
  _exports.formatResult = formatResult;
  function setUpConstraints(targetMapping, property) {
    const constraints = {};
    if (targetMapping?.constraints?.$Scale && property.scale !== undefined) {
      constraints.scale = property.scale;
    }
    if (targetMapping?.constraints?.$Precision && property.precision !== undefined) {
      constraints.precision = property.precision;
    }
    if (targetMapping?.constraints?.$MaxLength && property.maxLength !== undefined) {
      constraints.maxLength = property.maxLength;
    }
    if (property.nullable === false) {
      constraints.nullable = false;
    }
    if (targetMapping?.constraints?.["@Org.OData.Validation.V1.Minimum/$Decimal"] && !isNaN(property.annotations?.Validation?.Minimum)) {
      constraints.minimum = `${property.annotations?.Validation?.Minimum}`;
    }
    if (targetMapping?.constraints?.["@Org.OData.Validation.V1.Maximum/$Decimal"] && !isNaN(property.annotations?.Validation?.Maximum)) {
      constraints.maximum = `${property.annotations?.Validation?.Maximum}`;
    }
    if (property.annotations?.Common?.IsDigitSequence && targetMapping.type === "sap.ui.model.odata.type.String" && targetMapping?.constraints?.["@com.sap.vocabularies.Common.v1.IsDigitSequence"]) {
      constraints.isDigitSequence = true;
    }
    if (targetMapping?.constraints?.$V4) {
      constraints.V4 = true;
    }
    return constraints;
  }

  /**
   * Generates the binding expression for the property, and sets up the formatOptions and constraints.
   * @param property The Property for which we are setting up the binding
   * @param propertyBindingExpression The BindingExpression of the property above. Serves as the basis to which information can be added
   * @param ignoreConstraints Ignore constraints of the property
   * @returns The binding expression for the property with formatOptions and constraints
   */
  _exports.setUpConstraints = setUpConstraints;
  function formatWithTypeInformation(property, propertyBindingExpression) {
    let ignoreConstraints = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const outExpression = propertyBindingExpression;
    if (property._type !== "Property" && property._type !== "ActionParameter") {
      return outExpression;
    }
    const targetMapping = EDM_TYPE_MAPPING[property.type];
    if (!targetMapping) {
      return outExpression;
    }
    if (!outExpression.formatOptions) {
      outExpression.formatOptions = {};
    }
    outExpression.constraints = {};
    outExpression.type = targetMapping.type;
    if (!ignoreConstraints) {
      outExpression.constraints = setUpConstraints(targetMapping, property);
    }
    if (outExpression?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 && outExpression?.type !== "sap.ui.model.odata.type.Int64" || outExpression?.type === "sap.ui.model.odata.type.Double") {
      outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
        parseAsString: false
      });
    }
    if (outExpression.type === "sap.ui.model.odata.type.String" && isProperty(property)) {
      if (outExpression.constraints?.isDigitSequence || outExpression.constraints?.nullable !== false && property.nullable === true) {
        outExpression.formatOptions.parseKeepsEmptyString = false;
      } else {
        outExpression.formatOptions.parseKeepsEmptyString = true;
      }
      const fiscalType = getFiscalType(property);
      if (fiscalType) {
        outExpression.formatOptions.fiscalType = fiscalType;
        outExpression.type = "sap.fe.core.type.FiscalDate";
      }
    }
    const typesSupportingParseEmptyValueToZero = ["sap.ui.model.odata.type.Int16", "sap.ui.model.odata.type.Int32", "sap.ui.model.odata.type.Int64", "sap.ui.model.odata.type.Single", "sap.ui.model.odata.type.Double", "sap.ui.model.odata.type.Decimal", "sap.ui.model.odata.type.Byte", "sap.ui.model.odata.type.SByte"];
    if (outExpression.constraints?.nullable === false && outExpression.type && typesSupportingParseEmptyValueToZero.includes(outExpression.type)) {
      outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
        parseEmptyValueToZero: true
      });
    }
    if (outExpression.constraints?.nullable !== false && (outExpression.type === "sap.ui.model.odata.type.Int64" || outExpression.type === "sap.ui.model.odata.type.Decimal")) {
      outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
        emptyString: ""
      });
    }
    return outExpression;
  }
  _exports.formatWithTypeInformation = formatWithTypeInformation;
  const getFiscalType = function (property) {
    if (property.annotations?.Common?.IsFiscalYear) {
      return "com.sap.vocabularies.Common.v1.IsFiscalYear";
    }
    if (property.annotations?.Common?.IsFiscalPeriod) {
      return "com.sap.vocabularies.Common.v1.IsFiscalPeriod";
    }
    if (property.annotations?.Common?.IsFiscalYearPeriod) {
      return "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod";
    }
    if (property.annotations?.Common?.IsFiscalQuarter) {
      return "com.sap.vocabularies.Common.v1.IsFiscalQuarter";
    }
    if (property.annotations?.Common?.IsFiscalYearQuarter) {
      return "com.sap.vocabularies.Common.v1.IsFiscalYearQuarter";
    }
    if (property.annotations?.Common?.IsFiscalWeek) {
      return "com.sap.vocabularies.Common.v1.IsFiscalWeek";
    }
    if (property.annotations?.Common?.IsFiscalYearWeek) {
      return "com.sap.vocabularies.Common.v1.IsFiscalYearWeek";
    }
    if (property.annotations?.Common?.IsDayOfFiscalYear) {
      return "com.sap.vocabularies.Common.v1.IsDayOfFiscalYear";
    }
  };

  /**
   * Calls a complex type to process the parameters.
   * If requireContext is set to true and no context is passed, a default context will be added automatically.
   * @template T
   * @template U
   * @param parameters The list of parameters that should match the type for the complex type=
   * @param type The complex type to use
   * @param [contextEntityType] The context entity type to consider
   * @param oFormatOptions
   * @param oConstraintOptions
   * @returns The corresponding expression
   */
  _exports.getFiscalType = getFiscalType;
  function addTypeInformation(parameters, type, contextEntityType, oFormatOptions, oConstraintOptions) {
    const parameterExpressions = parameters.map(wrapPrimitive);
    if (hasUnresolvableExpression(...parameterExpressions)) {
      return unresolvableExpression;
    }
    // If there is only one parameter and it is a constant and we don't expect the context then return the constant
    if (parameterExpressions.length === 1 && isConstant(parameterExpressions[0]) && !contextEntityType) {
      return parameterExpressions[0];
    } else if (contextEntityType) {
      // Otherwise, if the context is required and no context is provided make sure to add the default binding
      if (!parameterExpressions.some(hasReferenceToDefaultContext)) {
        contextEntityType.keys.forEach(key => parameterExpressions.push(pathInModel(key.name, "")));
      }
    }
    oFormatOptions = _getComplexTypeFormatOptionsFromFirstParam(parameters[0], oFormatOptions);
    if (type === "sap.ui.model.odata.type.Unit") {
      const uomPath = pathInModel("/##@@requestUnitsOfMeasure");
      uomPath.targetType = "any";
      uomPath.mode = "OneTime";
      oFormatOptions ??= {};
      oFormatOptions.preserveDecimals = oConstraintOptions?.skipDecimalsValidation ?? false;
      parameterExpressions.push(uomPath);
    } else if (type === "sap.ui.model.odata.type.Currency") {
      const currencyPath = pathInModel("/##@@requestCurrencyCodes");
      currencyPath.targetType = "any";
      currencyPath.mode = "OneTime";
      oFormatOptions ??= {};
      oFormatOptions.preserveDecimals = false; // default value since we don't have a CLDR
      parameterExpressions.push(currencyPath);
    }
    return {
      _type: "ComplexType",
      type: type,
      formatOptions: oFormatOptions || {},
      constraints: oConstraintOptions || {},
      parameters: {},
      bindingParameters: parameterExpressions
    };
  }
  _exports.addTypeInformation = addTypeInformation;
  /**
   * Process the formatOptions for a complexType based on the first parameter.
   * @param param The first parameter of the complex type
   * @param formatOptions Initial formatOptions
   * @returns The modified formatOptions
   */
  function _getComplexTypeFormatOptionsFromFirstParam(param, formatOptions) {
    // if showMeasure is set to false we want to not parse as string to see the 0
    // we do that also for all bindings because otherwise the mdc Field isn't editable
    if (!(formatOptions && formatOptions.showNumber === false) && (param?.type?.indexOf("sap.ui.model.odata.type.Int") === 0 || param?.type === "sap.ui.model.odata.type.Decimal" || param?.type === "sap.ui.model.odata.type.Double")) {
      if (param?.type === "sap.ui.model.odata.type.Int64" || param?.type === "sap.ui.model.odata.type.Decimal") {
        //sap.ui.model.odata.type.Int64 do not support parseAsString false
        formatOptions = formatOptions?.showMeasure === false ? {
          showMeasure: false,
          decimalPadding: formatOptions.decimalPadding
        } : {
          decimalPadding: formatOptions?.decimalPadding
        };
      } else {
        formatOptions = formatOptions?.showMeasure === false ? {
          parseAsString: false,
          showMeasure: false,
          decimalPadding: formatOptions.decimalPadding
        } : {
          parseAsString: false,
          decimalPadding: formatOptions?.decimalPadding
        };
      }
      if (param?.constraints?.nullable !== false) {
        formatOptions.emptyString = null;
      } else {
        formatOptions.emptyString = "";
      }
    }
    return formatOptions;
  }
  /**
   * Function call, optionally with arguments.
   * @param func Function name or reference to function
   * @param parameters Arguments
   * @param on Object to call the function on
   * @param isFormattingFn
   * @returns Expression representing the function call (not the result of the function call!)
   */
  function fn(func, parameters, on) {
    let isFormattingFn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const functionName = typeof func === "string" ? func : func.__functionName;
    return {
      _type: "Function",
      obj: on !== undefined ? wrapPrimitive(on) : undefined,
      fn: functionName,
      isFormattingFn: isFormattingFn,
      parameters: parameters.map(wrapPrimitive)
    };
  }

  /**
   * Shortcut function to determine if a binding value is null, undefined or empty.
   * @param expression
   * @returns A Boolean expression evaluating the fact that the current element is empty
   */
  _exports.fn = fn;
  function isEmpty(expression) {
    const aBindings = [];
    transformRecursively(expression, "PathInModel", expr => {
      const finalExpression = {
        ...expr,
        alwaysKeepTargetType: true
      };
      aBindings.push(or(equal(finalExpression, ""), equal(expr, undefined), equal(expr, null)));
      return expr;
    });
    return and(...aBindings);
  }
  _exports.isEmpty = isEmpty;
  function concat() {
    for (var _len4 = arguments.length, inExpressions = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      inExpressions[_key4] = arguments[_key4];
    }
    const expressions = inExpressions.map(wrapPrimitive);
    if (hasUnresolvableExpression(...expressions)) {
      return unresolvableExpression;
    }
    if (expressions.every(isConstant)) {
      return constant(expressions.reduce((concatenated, value) => {
        if (value.value !== undefined && value.value !== null) {
          return concatenated + value.value.toString();
        }
        return concatenated;
      }, ""));
    } else if (expressions.some(isComplexTypeExpression)) {
      let pathIdx = 0;
      const myConcatExpression = formatResult(expressions, "sap.fe.core.formatters.StandardFormatter#concat", undefined, true);
      const allParts = [];
      transformRecursively(myConcatExpression, "PathInModel", constantPath => {
        allParts.push(constantPath);
        return pathInModel(`$${pathIdx++}`, "$");
      });
      allParts.unshift(constant(JSON.stringify(myConcatExpression)));
      return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
    }
    return {
      _type: "Concat",
      expressions: expressions
    };
  }
  _exports.concat = concat;
  function transformRecursively(inExpression, expressionType, transformFunction) {
    let includeAllExpression = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let expression = inExpression;
    switch (expression._type) {
      case "Function":
      case "Formatter":
        expression.parameters = expression.parameters.map(parameter => transformRecursively(parameter, expressionType, transformFunction, includeAllExpression));
        break;
      case "Concat":
        expression.expressions = expression.expressions.map(subExpression => transformRecursively(subExpression, expressionType, transformFunction, includeAllExpression));
        expression = concat(...expression.expressions);
        break;
      case "ComplexType":
        expression.bindingParameters = expression.bindingParameters.map(bindingParameter => transformRecursively(bindingParameter, expressionType, transformFunction, includeAllExpression));
        break;
      case "IfElse":
        const onTrue = transformRecursively(expression.onTrue, expressionType, transformFunction, includeAllExpression);
        const onFalse = transformRecursively(expression.onFalse, expressionType, transformFunction, includeAllExpression);
        let condition = expression.condition;
        if (includeAllExpression) {
          condition = transformRecursively(expression.condition, expressionType, transformFunction, includeAllExpression);
        }
        expression = ifElse(condition, onTrue, onFalse);
        break;
      case "Not":
        if (includeAllExpression) {
          const operand = transformRecursively(expression.operand, expressionType, transformFunction, includeAllExpression);
          expression = not(operand);
        }
        break;
      case "Truthy":
        break;
      case "Set":
        if (includeAllExpression) {
          const operands = expression.operands.map(operand => transformRecursively(operand, expressionType, transformFunction, includeAllExpression));
          expression = expression.operator === "||" ? or(...operands) : and(...operands);
        }
        break;
      case "Comparison":
        if (includeAllExpression) {
          const operand1 = transformRecursively(expression.operand1, expressionType, transformFunction, includeAllExpression);
          const operand2 = transformRecursively(expression.operand2, expressionType, transformFunction, includeAllExpression);
          expression = comparison(expression.operator, operand1, operand2);
        }
        break;
      case "Constant":
        const constantValue = expression.value;
        if (typeof constantValue === "object" && constantValue) {
          Object.keys(constantValue).forEach(key => {
            constantValue[key] = transformRecursively(constantValue[key], expressionType, transformFunction, includeAllExpression);
          });
        }
        break;
      case "Ref":
      case "Length":
      case "PathInModel":
      case "EmbeddedBinding":
      case "EmbeddedExpressionBinding":
      case "Unresolvable":
        // Do nothing
        break;
    }
    if (expressionType === expression._type) {
      expression = transformFunction(inExpression);
    }
    return expression;
  }
  _exports.transformRecursively = transformRecursively;
  const needParenthesis = function (expr) {
    return !isConstant(expr) && !isPathInModelExpression(expr) && isBindingToolkitExpression(expr) && expr._type !== "IfElse" && expr._type !== "Function";
  };

  /**
   * Compiles a constant object to a string.
   * @param expr
   * @param isNullable
   * @returns The compiled string
   */
  function compileConstantObject(expr) {
    let isNullable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (isNullable && Object.keys(expr.value).length === 0) {
      return "";
    }
    const objects = expr.value;
    const properties = [];
    Object.keys(objects).forEach(key => {
      const value = objects[key];
      const childResult = compileExpression(value, true, false, isNullable);
      if (childResult && childResult.length > 0) {
        properties.push(`${key}: ${childResult}`);
      }
    });
    return `{${properties.join(", ")}}`;
  }

  /**
   * Compiles a Constant Binding Expression.
   * @param expr
   * @param embeddedInBinding
   * @param isNullable
   * @param doNotStringify
   * @returns The compiled string
   */

  function compileConstant(expr, embeddedInBinding) {
    let isNullable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let doNotStringify = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (expr.value === null) {
      return doNotStringify ? null : "null";
    }
    if (expr.value === undefined) {
      return doNotStringify ? undefined : "undefined";
    }
    if (typeof expr.value === "object") {
      if (Array.isArray(expr.value)) {
        const entries = expr.value.map(expression => compileExpression(expression, true));
        return `[${entries.join(", ")}]`;
      } else {
        return compileConstantObject(expr, isNullable);
      }
    }
    if (embeddedInBinding) {
      switch (typeof expr.value) {
        case "number":
        case "bigint":
        case "boolean":
          return expr.value.toString();
        case "string":
          return `'${escapeXmlAttribute(expr.value.toString())}'`;
        default:
          return "";
      }
    } else {
      return doNotStringify ? expr.value : expr.value.toString();
    }
  }

  /**
   * Generates the binding string for a Binding expression.
   * @param expressionForBinding The expression to compile
   * @param embeddedInBinding Whether the expression to compile is embedded into another expression
   * @param embeddedSeparator The binding value evaluator ($ or % depending on whether we want to force the type or not)
   * @returns The corresponding expression binding
   */
  _exports.compileConstant = compileConstant;
  function compilePathInModelExpression(expressionForBinding, embeddedInBinding, embeddedSeparator) {
    if (expressionForBinding.type || expressionForBinding.parameters || expressionForBinding.targetType || expressionForBinding.formatOptions || expressionForBinding.constraints) {
      // This is now a complex binding definition, let's prepare for it
      const complexBindingDefinition = {
        path: compilePathInModel(expressionForBinding),
        type: expressionForBinding.type,
        targetType: expressionForBinding.targetType,
        parameters: expressionForBinding.parameters,
        formatOptions: expressionForBinding.formatOptions,
        constraints: expressionForBinding.constraints
      };
      const outBinding = compileExpression(complexBindingDefinition, false, false, true);
      if (embeddedInBinding) {
        const separator = expressionForBinding.alwaysKeepTargetType ? "$" : embeddedSeparator;
        return `${separator}${outBinding}`;
      }
      return outBinding;
    } else if (embeddedInBinding) {
      return `${embeddedSeparator}{${compilePathInModel(expressionForBinding)}}`;
    } else {
      return `{${compilePathInModel(expressionForBinding)}}`;
    }
  }
  function compileComplexTypeExpression(expression) {
    if (expression.bindingParameters.length === 1) {
      return `{${compilePathParameter(expression.bindingParameters[0], true)}, type: '${expression.type}'}`;
    }
    let outputEnd = `], type: '${expression.type}'`;
    if (hasElements(expression.formatOptions)) {
      outputEnd += `, formatOptions: ${compileExpression(expression.formatOptions)}`;
    }
    if (hasElements(expression.constraints)) {
      outputEnd += `, constraints: ${compileExpression(expression.constraints)}`;
    }
    if (hasElements(expression.parameters)) {
      outputEnd += `, parameters: ${compileExpression(expression.parameters)}`;
    }
    outputEnd += "}";
    return `{mode:'TwoWay', parts:[${expression.bindingParameters.map(param => compilePathParameter(param)).join(",")}${outputEnd}`;
  }

  /**
   * Wrap the compiled binding string as required depending on its context.
   * @param expression The compiled expression
   * @param embeddedInBinding True if the compiled expression is to be embedded in a binding
   * @param parenthesisRequired True if the embedded binding needs to be wrapped in parethesis so that it is evaluated as one
   * @returns Finalized compiled expression
   */
  function wrapBindingExpression(expression, embeddedInBinding) {
    let parenthesisRequired = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (embeddedInBinding) {
      if (parenthesisRequired) {
        return `(${expression})`;
      } else {
        return expression;
      }
    } else {
      return `{= ${expression}}`;
    }
  }

  /**
   * Compile an expression into an expression binding.
   * @template T The target type
   * @param expression The expression to compile
   * @param embeddedInBinding Whether the expression to compile is embedded into another expression
   * @param keepTargetType Keep the target type of the embedded bindings instead of casting them to any
   * @param isNullable Whether binding expression can resolve to empty string or not
   * @returns The corresponding expression binding
   */
  _exports.wrapBindingExpression = wrapBindingExpression;
  function compileExpression(expression) {
    let embeddedInBinding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let keepTargetType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let isNullable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const expr = wrapPrimitive(expression);
    const embeddedSeparator = keepTargetType ? "$" : "%";
    switch (expr._type) {
      case "Unresolvable":
        return undefined;
      case "Constant":
        return compileConstant(expr, embeddedInBinding, isNullable);
      case "Ref":
        return expr.ref || "null";
      case "Function":
        let hasEmbeddedFunctionCallOrBinding = false;
        if (expr.isFormattingFn) {
          transformRecursively(expr, "Function", subFn => {
            if (subFn !== expr && subFn.obj === undefined) {
              hasEmbeddedFunctionCallOrBinding = true;
            }
            return subFn;
          }, true);
          transformRecursively(expr, "Constant", subFn => {
            if (subFn !== expr && typeof subFn.value === "object") {
              transformRecursively(subFn, "PathInModel", subSubFn => {
                hasEmbeddedFunctionCallOrBinding = true;
                return subSubFn;
              });
            }
            return subFn;
          }, true);
        }
        const argumentString = `${expr.parameters.map(arg => compileExpression(arg, true)).join(", ")}`;
        let fnCall = expr.obj === undefined ? `${expr.fn}(${argumentString})` : `${compileExpression(expr.obj, true)}.${expr.fn}(${argumentString})`;
        if (!embeddedInBinding && hasEmbeddedFunctionCallOrBinding) {
          fnCall = `{= ${fnCall}}`;
        }
        return fnCall;
      case "EmbeddedExpressionBinding":
        return embeddedInBinding ? `(${expr.value.substring(2, expr.value.length - 1)})` : `${expr.value}`;
      case "EmbeddedBinding":
        return embeddedInBinding ? `${embeddedSeparator}${expr.value}` : `${expr.value}`;
      case "PathInModel":
        return compilePathInModelExpression(expr, embeddedInBinding, embeddedSeparator);
      case "Comparison":
        const comparisonExpression = compileComparisonExpression(expr);
        return wrapBindingExpression(comparisonExpression, embeddedInBinding);
      case "IfElse":
        const ifElseExpression = `${compileExpression(expr.condition, true)} ? ${compileExpression(expr.onTrue, true, keepTargetType)} : ${compileExpression(expr.onFalse, true, keepTargetType)}`;
        return wrapBindingExpression(ifElseExpression, embeddedInBinding, true);
      case "Set":
        const setExpression = expr.operands.map(operand => compileExpression(operand, true)).join(` ${expr.operator} `);
        return wrapBindingExpression(setExpression, embeddedInBinding, true);
      case "Concat":
        const concatExpression = expr.expressions.map(nestedExpression => compileExpression(nestedExpression, true, true)).join(" + ");
        return wrapBindingExpression(concatExpression, embeddedInBinding);
      case "Length":
        const lengthExpression = `${compileExpression(expr.pathInModel, true)}.length`;
        return wrapBindingExpression(lengthExpression, embeddedInBinding);
      case "Not":
        const notExpression = `!${compileExpression(expr.operand, true)}`;
        return wrapBindingExpression(notExpression, embeddedInBinding);
      case "Truthy":
        const truthyExpression = `!!${compileExpression(expr.operand, true)}`;
        return wrapBindingExpression(truthyExpression, embeddedInBinding);
      case "Formatter":
        const formatterExpression = compileFormatterExpression(expr);
        return embeddedInBinding ? `$${formatterExpression}` : formatterExpression;
      case "ComplexType":
        const complexTypeExpression = compileComplexTypeExpression(expr);
        return embeddedInBinding ? `$${complexTypeExpression}` : complexTypeExpression;
      default:
        return "";
    }
  }

  /**
   * Compile a comparison expression.
   * @param expression The comparison expression.
   * @returns The compiled expression. Needs wrapping before it can be used as an expression binding.
   */
  _exports.compileExpression = compileExpression;
  function compileComparisonExpression(expression) {
    function compileOperand(operand) {
      const compiledOperand = compileExpression(operand, true) ?? "undefined";
      return wrapBindingExpression(compiledOperand, true, needParenthesis(operand));
    }
    return `${compileOperand(expression.operand1)} ${expression.operator} ${compileOperand(expression.operand2)}`;
  }

  /**
   * Compile a formatter expression.
   * @param expression The formatter expression.
   * @returns The compiled expression.
   */
  function compileFormatterExpression(expression) {
    if (expression.parameters.length === 1) {
      return `{${compilePathParameter(expression.parameters[0], true)}, formatter: '${expression.fn}'}`;
    } else {
      const parts = expression.parameters.map(param => {
        if (param._type === "ComplexType") {
          return compileComplexTypeExpression(param);
        } else {
          return compilePathParameter(param);
        }
      });
      return `{parts: [${parts.join(", ")}], formatter: '${expression.fn}'}`;
    }
  }

  /**
   * Compile the path parameter of a formatter call.
   * @param expression The binding part to evaluate
   * @param singlePath Whether there is one or multiple path to consider
   * @returns The string snippet to include in the overall binding definition
   */
  function compilePathParameter(expression) {
    let singlePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let outValue = "";
    if (expression._type === "Constant") {
      if (expression.value === undefined) {
        // Special case otherwise the JSTokenizer complains about incorrect content
        outValue = `value: 'undefined'`;
      } else {
        outValue = `value: ${compileConstant(expression, true)}`;
      }
    } else if (expression._type === "PathInModel") {
      outValue = `path: '${compilePathInModel(expression)}'`;
      outValue += expression.type ? `, type: '${expression.type}'` : `, targetType: 'any'`;
      if (expression.mode) {
        outValue += `, mode: '${compileExpression(expression.mode)}'`;
      }
      if (hasElements(expression.constraints)) {
        outValue += `, constraints: ${compileExpression(expression.constraints)}`;
      }
      if (hasElements(expression.formatOptions)) {
        outValue += `, formatOptions: ${compileExpression(expression.formatOptions)}`;
      }
      if (hasElements(expression.parameters)) {
        outValue += `, parameters: ${compileExpression(expression.parameters)}`;
      }
    } else {
      return "";
    }
    return singlePath ? outValue : `{${outValue}}`;
  }
  function hasElements(obj) {
    return !!obj && Object.keys(obj).length > 0;
  }

  /**
   * Compile a binding expression path.
   * @param expression The expression to compile.
   * @returns The compiled path.
   */
  function compilePathInModel(expression) {
    return `${expression.modelName ? expression.modelName + ">" : ""}${expression.path}`;
  }
  return _exports;
}, false);
//# sourceMappingURL=BindingToolkit-dbg.js.map

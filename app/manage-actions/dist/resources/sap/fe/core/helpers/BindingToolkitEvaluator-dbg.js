/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/fe/base/BindingToolkit"], function (ObjectPath, BindingToolkit) {
  "use strict";

  var _exports = {};
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var transformRecursively = BindingToolkit.transformRecursively;
  var isConstant = BindingToolkit.isConstant;
  var constant = BindingToolkit.constant;
  /**
   * Evaluates a binding toolkit expression based on available data and without data binding.
   *
   * This is an experimental feature that aims to replace code where we resolve $Path manually for a more complete solution.
   * It might not work in all scenario especially when multiple models are involved.
   * @param bindingToolkitExpression The expression to evaluate
   * @param modelData The data that will be used to resolve the expression
   * @returns The result of the expression or throws an error if the expression cannot be resolved
   * @experimental
   */
  function evaluateExpression(bindingToolkitExpression, modelData) {
    const missingModels = new Set();
    const transformedExpression = transformRecursively(bindingToolkitExpression, "PathInModel", pathInModel => {
      // undefined modelName needs to be treated as empty string for the lookup
      const modelName = pathInModel.modelName ?? "";
      const currentModelData = modelData[modelName];
      if (currentModelData === undefined) {
        missingModels.add(modelName);
        return unresolvableExpression;
      }
      return constant(ObjectPath.get(pathInModel.path.replace(/\//g, "."), currentModelData));
    }, true);
    if (isConstant(transformedExpression)) {
      return transformedExpression.value;
    } else {
      throw new Error(`Expression cannot be resolved not constant as data from the following models: ${Array.from(missingModels).join(",")} is missing`);
    }
  }
  _exports.evaluateExpression = evaluateExpression;
  return _exports;
}, false);
//# sourceMappingURL=BindingToolkitEvaluator-dbg.js.map

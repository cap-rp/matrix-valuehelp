/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "../converters/MetaModelConverter", "../helpers/BindingHelper", "./FieldControlHelper"], function (BindingToolkit, MetaModelConverter, BindingHelper, FieldControlHelper) {
  "use strict";

  var _exports = {};
  var isActionParameterRequiredExpression = FieldControlHelper.isActionParameterRequiredExpression;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var convertTypes = MetaModelConverter.convertTypes;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Get binding toolkit expressiono for 'is action critical'.
   * @param actionTarget Action
   * @param convertedTypes ConvertedMetadata
   * @returns BindingToolkitExpression
   */
  function getIsActionCriticalExpression(actionTarget, convertedTypes) {
    const bindingParameterFullName = actionTarget.isBound ? actionTarget.parameters[0]?.fullyQualifiedName : undefined;
    const isActionCriticalExp = getExpressionFromAnnotation(actionTarget.annotations.Common?.IsActionCritical, [], undefined, path => bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName));
    return equal(isActionCriticalExp, true);
  }

  /**
   * Checks whether action parameter is required.
   * @param context Interface context to function arguments' contexts.
   * @returns Compiled expression
   */
  _exports.getIsActionCriticalExpression = getIsActionCriticalExpression;
  const isActionParameterRequired = function (context) {
    const actionParameterPath = context.getInterface(0).getPath();
    const actionPath = context.getInterface(1).getPath();
    const metaModel = context.getInterface(0).getModel();
    if (actionParameterPath && actionPath && metaModel) {
      const convertedTypes = convertTypes(metaModel);
      const actionParameterTarget = convertedTypes.resolvePath(actionParameterPath);
      const actionParameter = actionParameterTarget.target;
      const actionTarget = convertedTypes.resolvePath(actionPath);
      const action = actionTarget.target;
      if (actionParameter && action) {
        return compileExpression(isActionParameterRequiredExpression(actionParameter, action, convertedTypes));
      }
    }
  };
  isActionParameterRequired.requiresIContext = true;
  _exports.isActionParameterRequired = isActionParameterRequired;
  return _exports;
}, false);
//# sourceMappingURL=ActionHelper-dbg.js.map

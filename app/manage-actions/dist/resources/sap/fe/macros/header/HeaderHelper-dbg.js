/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "../field/FieldTemplating"], function (BindingToolkit, FieldTemplating) {
  "use strict";

  var formatValueRecursively = FieldTemplating.formatValueRecursively;
  var addTextArrangementToBindingExpression = FieldTemplating.addTextArrangementToBindingExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  const HeaderHelper = {
    getDescriptionExpression(fullContextPath, headerInfo) {
      let descriptionBinding = getExpressionFromAnnotation(headerInfo?.Description?.Value);
      if (headerInfo?.Description?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement) {
        // consider text arrangement annotation in the description as well
        descriptionBinding = addTextArrangementToBindingExpression(descriptionBinding, fullContextPath);
      }
      const description = compileExpression(formatValueRecursively(descriptionBinding, fullContextPath));
      return description === "undefined" ? "" : description;
    }
  };
  return HeaderHelper;
}, false);
//# sourceMappingURL=HeaderHelper-dbg.js.map

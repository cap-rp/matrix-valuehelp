/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/m/AvatarShape"], function (BindingToolkit, AvatarShape) {
  "use strict";

  var _exports = {};
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  const isNaturalPersonExpression = converterContext => {
    return getExpressionFromAnnotation(converterContext.getEntityType().annotations.Common?.IsNaturalPerson);
  };
  const compileAvatarShape = expression => {
    return compileExpression(ifElse(expression, AvatarShape.Circle, AvatarShape.Square));
  };

  // The shape of the Avatar depends upon whether the entity instance represents a natural person.
  // This can depend upon a property in the entity. Unlike the shape of an avatar defined in a field, it
  // doesn't make sense to make the image at the object page header dependent upon the property containg
  // the image or imageURL.
  const compileFallBackIcon = expression => {
    return compileExpression(ifElse(expression, "sap-icon://person-placeholder", "sap-icon://product"));
  };
  const getFallBackIcon = converterContext => {
    const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
    if (!headerInfo || headerInfo && !headerInfo.ImageUrl && !headerInfo.TypeImageUrl) {
      return undefined;
    }
    if (headerInfo.ImageUrl && headerInfo.TypeImageUrl) {
      return compileExpression(getExpressionFromAnnotation(headerInfo.TypeImageUrl));
    }
    return compileFallBackIcon(isNaturalPersonExpression(converterContext));
  };
  const getSource = converterContext => {
    const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
    if (!headerInfo || !(headerInfo.ImageUrl || headerInfo.TypeImageUrl)) {
      return undefined;
    }
    return compileExpression(getExpressionFromAnnotation(headerInfo.ImageUrl || headerInfo.TypeImageUrl));
  };
  const getAvatar = converterContext => {
    const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
    const oSource = headerInfo && (headerInfo.ImageUrl || headerInfo.TypeImageUrl || headerInfo.Initials);
    if (!oSource) {
      return undefined;
    }
    return {
      src: getSource(converterContext),
      initials: compileExpression(getExpressionFromAnnotation(headerInfo?.Initials, [], "")),
      fallbackIcon: getFallBackIcon(converterContext),
      displayShape: compileAvatarShape(isNaturalPersonExpression(converterContext))
    };
  };
  _exports.getAvatar = getAvatar;
  return _exports;
}, false);
//# sourceMappingURL=Avatar-dbg.js.map

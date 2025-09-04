/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/BindingParser"], function (BindingParser) {
  "use strict";

  var _exports = {};
  function getObject(oObject, sPath) {
    if (!oObject) {
      return null;
    }
    const sPathSplit = sPath.split("/");
    if (sPathSplit.length === 1) {
      return oObject[sPath];
    } else {
      return getObject(oObject[sPathSplit[0]], sPathSplit.splice(1).join("/"));
    }
  }
  /**
   * Resolve a dynamic annotation path down to a standard annotation path.
   * @param sAnnotationPath
   * @param oMetaModel
   * @returns The non dynamic version of the annotation path
   */
  function resolveDynamicExpression(sAnnotationPath, oMetaModel) {
    if (sAnnotationPath.includes("[")) {
      const firstBracket = sAnnotationPath.indexOf("[");
      const sStableBracket = sAnnotationPath.substring(0, firstBracket);
      const sRest = sAnnotationPath.substring(firstBracket + 1);
      const lastBracket = sRest.indexOf("]");
      const aValue = oMetaModel.getObject(sStableBracket);
      const oExpression = BindingParser.parseExpression(sRest.substring(0, lastBracket));
      if (Array.isArray(aValue) && oExpression && oExpression.result && oExpression.result.parts && oExpression.result.parts[0] && oExpression.result.parts[0].path) {
        let i;
        let bFound = false;
        for (i = 0; i < aValue.length && !bFound; i++) {
          const oObjectValue = getObject(aValue[i], oExpression.result.parts[0].path);
          const bResult = oExpression.result.formatter(oObjectValue);
          if (bResult) {
            bFound = true;
          }
        }
        if (bFound) {
          sAnnotationPath = resolveDynamicExpression(sStableBracket + (i - 1) + sRest.substring(lastBracket + 1), oMetaModel);
        }
      }
    }
    return sAnnotationPath;
  }
  _exports.resolveDynamicExpression = resolveDynamicExpression;
  return _exports;
}, false);
//# sourceMappingURL=DynamicAnnotationPathHelper-dbg.js.map

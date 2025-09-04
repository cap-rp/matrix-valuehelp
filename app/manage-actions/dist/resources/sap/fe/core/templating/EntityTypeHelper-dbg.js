/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit"], function (Log, BindingToolkit) {
  "use strict";

  var _exports = {};
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var concat = BindingToolkit.concat;
  // Collection of helper functions to retrieve information from an EntityType.

  // This is still a work in progress

  /**
   * Retrieve the binding expression required to display the title of an entity.
   *
   * This is usually defined as:
   * - the HeaderInfo.Title value
   * - the SemanticKeys properties
   * - the keys properties.
   * @param entityType The target entityType
   * @returns The title binding expression
   */
  const getTitleExpression = entityType => {
    // HeaderInfo can be a [DataField] and any of its children, or a [DataFieldForAnnotation] targeting [ConnectedFields](#ConnectedFields).
    const headerInfoTitle = entityType.annotations?.UI?.HeaderInfo?.Title;
    if (headerInfoTitle) {
      switch (headerInfoTitle.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
          return getExpressionFromAnnotation(headerInfoTitle.Value);
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          Log.error("DataFieldForAnnotation with connected fields not supported for HeaderInfo.Title");
          return getExpressionFromAnnotation(entityType.annotations?.UI?.HeaderInfo?.TypeName);
      }
    }
    const semanticKeys = entityType.annotations?.Common?.SemanticKey;
    if (semanticKeys) {
      return concat(...semanticKeys.map(key => pathInModel(key.value)));
    }
  };
  _exports.getTitleExpression = getTitleExpression;
  return _exports;
}, false);
//# sourceMappingURL=EntityTypeHelper-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Function to return columnSet object for the adaptive cards.
   * @param columns Columns for creating the column set
   * @param visible Visible expression for the column
   * @returns ColumnSet Object
   */
  function getColumnSet(columns, visible) {
    const items = columns ?? [];
    return {
      type: "ColumnSet",
      columns: [...items],
      isVisible: visible ?? undefined
    };
  }

  /**
   * Function to return column object for the adaptive cards.
   * @param parameters Parameters for creating the column
   * @returns Column Object
   */
  _exports.getColumnSet = getColumnSet;
  function getColumn(parameters) {
    const items = parameters?.items ?? [];
    return {
      type: "Column",
      items: [...items],
      verticalContentAlignment: "Top",
      width: parameters?.width ?? 1,
      isVisible: parameters?.visible ?? undefined
    };
  }

  /**
   * Function to return image object for the adaptive cards.
   * @param url Image url
   * @returns Image Object
   */
  _exports.getColumn = getColumn;
  function getImage(url) {
    return {
      type: "Image",
      url: url,
      size: "Small"
    };
  }

  /**
   * Function to return TextBlock object for the adaptive cards.
   * @param parameters Parameters for creating the column
   * @returns TextBlock Object
   */
  _exports.getImage = getImage;
  function getTextBlock(parameters) {
    return {
      type: "TextBlock",
      size: parameters?.size ?? "Small",
      weight: parameters?.weight ?? "Default",
      text: parameters?.text,
      maxLines: parameters?.maxLines ?? 0,
      wrap: parameters?.wrap ?? false,
      spacing: parameters?.spacing ?? "Default",
      isVisible: parameters?.visible ?? undefined,
      color: parameters?.color ?? "Default",
      isSubtle: parameters.isSubtle ?? undefined,
      $when: parameters?.$when ?? undefined
    };
  }
  _exports.getTextBlock = getTextBlock;
  return _exports;
}, false);
//# sourceMappingURL=AdaptiveCardContent-dbg.js.map

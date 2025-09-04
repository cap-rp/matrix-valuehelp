/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["../../helpers/StableIdHelper"], function (StableIdHelper) {
  "use strict";

  var _exports = {};
  var getStableIdPartFromDataField = StableIdHelper.getStableIdPartFromDataField;
  /**
   * The KeyHelper is used for dealing with Key in the concern of the flexible programming model
   */
  let KeyHelper = /*#__PURE__*/function () {
    function KeyHelper() {}
    _exports.KeyHelper = KeyHelper;
    /**
     * Returns a generated key for DataFields to be used in the flexible programming model.
     * @param dataField DataField to generate the key for
     * @returns Returns a through StableIdHelper generated key
     */
    KeyHelper.generateKeyFromDataField = function generateKeyFromDataField(dataField) {
      return getStableIdPartFromDataField(dataField, true);
    }

    /**
     * Throws an Error if any other character then aA-zZ, 0-9, ':', '_' or '-' is used.
     * @param key String to check validity on
     */;
    KeyHelper.validateKey = function validateKey(key) {
      const pattern = /[^A-Za-z0-9_\-:]/;
      if (pattern.exec(key)) {
        throw new Error(`Invalid key: ${key} - only 'A-Za-z0-9_-:' are allowed`);
      }
    }

    /**
     * Returns the key for a selection field required for adaption.
     * @param fullPropertyPath The full property path (without entityType)
     * @returns The key of the selection field
     */;
    KeyHelper.getSelectionFieldKeyFromPath = function getSelectionFieldKeyFromPath(fullPropertyPath) {
      return fullPropertyPath.replace(/([*+])?\//g, "::");
    }

    /**
     * Returns the path for a selection field required for adaption.
     * @param selectionFieldKey The key of the selection field
     * @returns The full property path
     */;
    KeyHelper.getPathFromSelectionFieldKey = function getPathFromSelectionFieldKey(selectionFieldKey) {
      return selectionFieldKey.replace(/::/g, "/");
    };
    return KeyHelper;
  }();
  _exports.KeyHelper = KeyHelper;
  return _exports;
}, false);
//# sourceMappingURL=Key-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/macros/field/FieldHelper", "sap/m/plugins/UploadSetwithTable", "sap/m/upload/UploadItemConfiguration", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, FieldHelper, UploadSetwithTable, UploadItemConfiguration, _jsx) {
  "use strict";

  var _exports = {};
  var not = BindingToolkit.not;
  function getUploadButtonInvisible(tableDefinition) {
    if (tableDefinition.annotation?.uploadTable?.uploadAction?.isTemplated && tableDefinition.annotation?.uploadTable?.uploadAction?.visibleExpression) {
      return not(tableDefinition.annotation.uploadTable.uploadAction.visibleExpression);
    } else {
      // not create enabled, therefore upload button is always invisible
      return true;
    }
  }
  function getUploadPlugin(tableDefinition, id, handlerProvider) {
    return _jsx(UploadSetwithTable, {
      "core:require": "{UploadTableRuntime: 'sap/fe/macros/table/uploadTable/UploadTableRuntime'}",
      httpRequestMethod: "Put",
      multiple: false,
      uploadButtonInvisible: getUploadButtonInvisible(tableDefinition),
      itemValidationHandler: handlerProvider.uploadItemValidationHandler,
      mediaTypeMismatch: handlerProvider.uploadMediaTypeMismatch,
      fileSizeExceeded: handlerProvider.uploadFileSizeExceeded,
      maxFileSize: FieldHelper.calculateMBfromByte(tableDefinition.annotation?.uploadTable?.maxLength),
      uploadCompleted: handlerProvider.uploadCompleted,
      uploadEnabled: tableDefinition.annotation?.uploadTable?.uploadAction?.enabled,
      mediaTypes: tableDefinition.annotation?.uploadTable?.acceptableMediaTypes,
      actions: [`${id}-uploadButton`],
      uploadUrl: tableDefinition.annotation?.uploadTable?.stream,
      maxFileNameLength: tableDefinition.annotation?.uploadTable?.fileNameMaxLength,
      fileNameLengthExceeded: handlerProvider.uploadFileNameLengthExceeded,
      children: {
        rowConfiguration: _jsx(UploadItemConfiguration, {
          fileNamePath: tableDefinition.annotation?.uploadTable?.fileName
        })
      }
    });
  }
  _exports.getUploadPlugin = getUploadPlugin;
  return _exports;
}, false);
//# sourceMappingURL=UploadTableTemplate-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/MessageBox", "sap/ui/core/Item", "sap/ui/unified/FileUploaderParameter"], function (CommonUtils, ResourceModelHelper, MessageBox, Item, FileUploaderParameter) {
  "use strict";

  var _exports = {};
  var getResourceModel = ResourceModelHelper.getResourceModel;
  /**
   * Shows an error dialog in case of non supported type.
   * @param source The control that raises the error
   * @param givenType The type the user tried to upload
   * @param acceptedTypes Array of supported types
   */
  function showTypeMismatchDialog(source, givenType, acceptedTypes) {
    const resourceModel = getResourceModel(source);
    MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE"), {
      details: `<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_SELECTED")}</strong></p>${givenType}<br><br>` + `<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_ALLOWED")}</strong></p>${acceptedTypes.toString().replaceAll(",", ", ")}`,
      contentWidth: "150px"
    });
  }

  /**
   * Shows an error dialog in case the file size exceeded.
   * @param source The control that raises the error
   * @param maximumFileSize The supported maximum file size
   */
  _exports.showTypeMismatchDialog = showTypeMismatchDialog;
  function showFileSizeExceedDialog(source, maximumFileSize) {
    const resourceModel = getResourceModel(source);
    MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_FILE_TOO_BIG", [maximumFileSize]), {
      contentWidth: "150px"
    });
  }

  /**
   * Shows an error dialog in case the file name length exceeded.
   * @param source The control that raises the error
   * @param maximumFileNameLength The supported maximum file name length
   */
  _exports.showFileSizeExceedDialog = showFileSizeExceedDialog;
  function showFileNameLengthExceedDialog(source, maximumFileNameLength) {
    const resourceModel = getResourceModel(source);
    MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_FILENAME_TOO_BIG", [maximumFileNameLength]), {
      contentWidth: "150px"
    });
  }

  /**
   * Shows the back-end error message or a standard error text in a message box.
   * @param control The control that raises the error
   * @param error The error text
   */
  _exports.showFileNameLengthExceedDialog = showFileNameLengthExceedDialog;
  function displayMessageForFailedUpload(control, error) {
    let messageText, errorObject;
    try {
      errorObject = error && JSON.parse(error);
      messageText = errorObject.error?.message;
    } catch (e) {
      messageText = error || getResourceModel(control).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT");
    }
    MessageBox.error(messageText);
  }
  _exports.displayMessageForFailedUpload = displayMessageForFailedUpload;
  function addHeader(fileUploader, name, value) {
    if (fileUploader.isA("sap.ui.unified.FileUploader")) {
      const header = new FileUploaderParameter();
      header.setName(name);
      header.setValue(value);
      fileUploader.addHeaderParameter(header);
    } else if (fileUploader.isA("sap.m.upload.UploadItem")) {
      const header = new Item({
        key: name,
        text: value
      });
      fileUploader.addHeaderField(header);
    }
  }

  /**
   * Set request header for the file upload.
   * @param fileUploader The upload control
   * @param fileType The file type
   * @param eTagContext If the eTag is not in the context of the file uploader, it can be passed here
   */
  function setHeaderFields(fileUploader, fileType, eTagContext) {
    if (fileUploader.isA("sap.ui.unified.FileUploader")) {
      fileUploader.removeAllHeaderParameters();
    } else if (fileUploader.isA("sap.m.upload.UploadItem")) {
      fileUploader.removeAllHeaderFields();
    }
    const token = fileUploader.getModel()?.getHttpHeaders()?.["X-CSRF-Token"];
    if (token) {
      addHeader(fileUploader, "x-csrf-token", token);
    }
    const eTag = eTagContext?.getProperty("@odata.etag") ?? fileUploader.getBindingContext()?.getProperty("@odata.etag");
    if (eTag) {
      const view = CommonUtils.getTargetView(fileUploader);
      const collaborativeDraft = view.getController().collaborativeDraft;
      addHeader(fileUploader, "If-Match", collaborativeDraft.isConnected() ? "*" : eTag);
    }
    addHeader(fileUploader, "Accept", "application/json");
    addHeader(fileUploader, "Content-Type", fileType || "application/octet-stream");
  }
  _exports.setHeaderFields = setHeaderFields;
  return _exports;
}, false);
//# sourceMappingURL=Upload-dbg.js.map

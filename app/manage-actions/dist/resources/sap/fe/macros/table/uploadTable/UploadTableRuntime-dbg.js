/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/macros/internal/helpers/Upload", "../../field/FieldRuntimeHelper"], function (CommonUtils, Upload, FieldRuntimeHelper) {
  "use strict";

  var showTypeMismatchDialog = Upload.showTypeMismatchDialog;
  var showFileSizeExceedDialog = Upload.showFileSizeExceedDialog;
  var showFileNameLengthExceedDialog = Upload.showFileNameLengthExceedDialog;
  var setHeaderFields = Upload.setHeaderFields;
  var displayMessageForFailedUpload = Upload.displayMessageForFailedUpload;
  const UploadTableRuntime = {
    /**
     * Create a new instance and set the URL to upload the document.
     * @param uploadInfo Information sent by the UploadSet control
     * @param uploadInfo.oItem UploadItem with the file information
     * @param uploadInfo.oSource The UploadSetwithTable control
     * @returns A promise to be resolved with the uploadSetwithTableItem to be used to upload the document
     */
    async uploadFile(uploadInfo) {
      const uploadSetItem = uploadInfo.oItem,
        uploadSetTable = uploadInfo.oSource,
        mdcTable = uploadSetTable.getParent(),
        listBinding = mdcTable.getRowBinding(),
        fileNamePath = uploadSetTable.getRowConfiguration().getFileNamePath(),
        data = fileNamePath ? {
          [fileNamePath]: uploadSetItem.getFileName()
        } : {},
        newListEntity = listBinding.create(data, true);
      try {
        const internalContext = uploadSetTable.getBindingContext("internal");
        // we have to add the upload process to the sync task to avoid the user can save without the upload being completed
        const uploadPromise = new Promise((resolve, reject) => {
          internalContext.setProperty(`UploadPromises/${uploadSetItem.getId()}`, {
            resolve: resolve,
            reject: reject
          });
        });
        // we also need to store the new entity to be able to retrieve it later
        internalContext.setProperty("uploadInstance", newListEntity);
        const containingView = CommonUtils.getTargetView(uploadSetTable);
        const feController = FieldRuntimeHelper.getExtensionController(containingView.getController());
        feController.editFlow.syncTask(uploadPromise);
        await newListEntity.created();
        return await new Promise(resolve => {
          const uploadPath = uploadSetTable.getUploadUrl();
          let uploadUrl = newListEntity.getProperty(uploadPath);

          // set upload url as canonical url for NavigationProperties
          // this is a workaround as some backends cannot resolve NavigationsProperties for stream types
          uploadUrl = uploadUrl.replace(newListEntity.getPath(), newListEntity.getCanonicalPath());

          // set header fields like etag and token
          setHeaderFields(uploadSetItem, uploadSetItem.getMediaType(), newListEntity);

          // set the URL for PUT request
          uploadSetItem.setUploadUrl(uploadUrl);
          resolve(uploadSetItem);
        });
      } catch (error) {
        this.onUploadFailed(uploadSetTable, uploadSetItem, String(error));
        return Promise.reject("The new instance could not be created");
      }
    },
    /**
     * Inform the user that the upload failed due to any technical reasons.
     * @param uploadTable
     * @param uploadSetItem
     * @param error The error message
     */
    onUploadFailed(uploadTable, uploadSetItem, error) {
      displayMessageForFailedUpload(uploadTable, error);
      uploadTable.getBindingContext("internal").getProperty(`UploadPromises/${uploadSetItem.getId()}`).reject();
    },
    /**
     * Refresh the instance after upload.
     * This ensures we retrieve the correct mime type determined by the backend.
     * @param event Sent by uploadTable control
     */
    async onUploadCompleted(event) {
      const item = event.getParameter("item"),
        status = Number(event.getParameter("status")),
        internalContext = item.getBindingContext("internal");
      if (status === 0 || status >= 400) {
        const uploadTable = item.getParent();
        const error = event.getParameter("responseText") || event.getParameter("response");
        UploadTableRuntime.onUploadFailed(uploadTable, item, error);
        const uploadInstance = internalContext.getProperty("uploadInstance");
        if (uploadInstance) {
          // delete the upload instance so it disappears in the list
          await uploadInstance.delete();
        }
      } else {
        const context = item.getBindingContext();
        if (context && !context.hasPendingChanges()) {
          await context.requestRefresh();
        }
        internalContext.getProperty(`UploadPromises/${item.getId()}`).resolve();
      }
      internalContext.setProperty("uploadInstance", null);
    },
    /**
     * Show an error dialog to the user if the file doesn't fit to the accepted media types.
     * @param event Sent by uploadTable control
     */
    onMediaTypeMismatch(event) {
      const uploadTable = event.getSource();
      const givenType = event.getParameter("item").getProperty("mediaType");
      const acceptedTypes = uploadTable.getMediaTypes();
      showTypeMismatchDialog(uploadTable, givenType, acceptedTypes);
    },
    /**
     * Show an error dialog to the user if the file exceeds the maximum file size.
     * @param event Sent by uploadTable control
     */
    onFileSizeExceeded(event) {
      const uploadTable = event.getSource();
      showFileSizeExceedDialog(uploadTable, uploadTable.getMaxFileSize().toString());
    },
    /**
     * Show an error dialog to the user if the file exceeds the maximum file size.
     * @param event Sent by uploadTable control
     */
    onFileNameLengthExceeded(event) {
      const uploadTable = event.getSource();
      showFileNameLengthExceedDialog(uploadTable, uploadTable.getMaxFileNameLength().toString());
    }
  };
  return UploadTableRuntime;
}, false);
//# sourceMappingURL=UploadTableRuntime-dbg.js.map

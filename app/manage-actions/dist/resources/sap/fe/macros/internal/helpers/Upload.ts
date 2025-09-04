import CommonUtils from "sap/fe/core/CommonUtils";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import MessageBox from "sap/m/MessageBox";
import type UploadItem from "sap/m/upload/UploadItem";
import type Control from "sap/ui/core/Control";
import Item from "sap/ui/core/Item";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type FileUploader from "sap/ui/unified/FileUploader";
import FileUploaderParameter from "sap/ui/unified/FileUploaderParameter";

/**
 * Shows an error dialog in case of non supported type.
 * @param source The control that raises the error
 * @param givenType The type the user tried to upload
 * @param acceptedTypes Array of supported types
 */
export function showTypeMismatchDialog(source: Control, givenType: string, acceptedTypes: string[]): void {
	const resourceModel = getResourceModel(source);
	MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE"), {
		details:
			`<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_SELECTED")}</strong></p>${givenType}<br><br>` +
			`<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_ALLOWED")}</strong></p>${acceptedTypes
				.toString()
				.replaceAll(",", ", ")}`,
		contentWidth: "150px"
	} as object);
}

/**
 * Shows an error dialog in case the file size exceeded.
 * @param source The control that raises the error
 * @param maximumFileSize The supported maximum file size
 */
export function showFileSizeExceedDialog(source: Control, maximumFileSize: string): void {
	const resourceModel = getResourceModel(source);
	MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_FILE_TOO_BIG", [maximumFileSize]), {
		contentWidth: "150px"
	} as object);
}

/**
 * Shows an error dialog in case the file name length exceeded.
 * @param source The control that raises the error
 * @param maximumFileNameLength The supported maximum file name length
 */
export function showFileNameLengthExceedDialog(source: Control, maximumFileNameLength: string): void {
	const resourceModel = getResourceModel(source);
	MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_FILENAME_TOO_BIG", [maximumFileNameLength]), {
		contentWidth: "150px"
	} as object);
}

/**
 * Shows the back-end error message or a standard error text in a message box.
 * @param control The control that raises the error
 * @param error The error text
 */
export function displayMessageForFailedUpload(control: Control, error: string): void {
	let messageText, errorObject;
	try {
		errorObject = error && JSON.parse(error);
		messageText = errorObject.error?.message;
	} catch (e) {
		messageText = error || getResourceModel(control).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT");
	}
	MessageBox.error(messageText);
}

function addHeader(fileUploader: FileUploader | UploadItem, name: string, value: string): void {
	if (fileUploader.isA<FileUploader>("sap.ui.unified.FileUploader")) {
		const header = new FileUploaderParameter();
		header.setName(name);
		header.setValue(value);
		fileUploader.addHeaderParameter(header);
	} else if (fileUploader.isA<UploadItem>("sap.m.upload.UploadItem")) {
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
export function setHeaderFields(fileUploader: FileUploader | UploadItem, fileType: string, eTagContext?: Context): void {
	if (fileUploader.isA<FileUploader>("sap.ui.unified.FileUploader")) {
		fileUploader.removeAllHeaderParameters();
	} else if (fileUploader.isA<UploadItem>("sap.m.upload.UploadItem")) {
		fileUploader.removeAllHeaderFields();
	}
	const token = (fileUploader.getModel() as ODataModel)?.getHttpHeaders()?.["X-CSRF-Token"];

	if (token) {
		addHeader(fileUploader, "x-csrf-token", token);
	}
	const eTag =
		eTagContext?.getProperty("@odata.etag") ??
		(fileUploader.getBindingContext() as Context | undefined | null)?.getProperty("@odata.etag");
	if (eTag) {
		const view = CommonUtils.getTargetView(fileUploader);
		const collaborativeDraft = view.getController().collaborativeDraft;
		addHeader(fileUploader, "If-Match", collaborativeDraft.isConnected() ? "*" : eTag);
	}

	addHeader(fileUploader, "Accept", "application/json");
	addHeader(fileUploader, "Content-Type", fileType || "application/octet-stream");
}

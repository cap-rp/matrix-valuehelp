import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { not } from "sap/fe/base/BindingToolkit";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import UploadSetwithTable from "sap/m/plugins/UploadSetwithTable";
import UploadItemConfiguration from "sap/m/upload/UploadItemConfiguration";
import type TableEventHandlerProvider from "../TableEventHandlerProvider";

function getUploadButtonInvisible(tableDefinition: TableVisualization): BindingToolkitExpression<boolean> | boolean {
	if (
		tableDefinition.annotation?.uploadTable?.uploadAction?.isTemplated &&
		tableDefinition.annotation?.uploadTable?.uploadAction?.visibleExpression
	) {
		return not(tableDefinition.annotation.uploadTable.uploadAction.visibleExpression);
	} else {
		// not create enabled, therefore upload button is always invisible
		return true;
	}
}

export function getUploadPlugin(
	tableDefinition: TableVisualization,
	id: string,
	handlerProvider: TableEventHandlerProvider
): UploadSetwithTable {
	return (
		<UploadSetwithTable
			core:require="{UploadTableRuntime: 'sap/fe/macros/table/uploadTable/UploadTableRuntime'}"
			httpRequestMethod="Put"
			multiple={false}
			uploadButtonInvisible={getUploadButtonInvisible(tableDefinition)}
			itemValidationHandler={handlerProvider.uploadItemValidationHandler}
			mediaTypeMismatch={handlerProvider.uploadMediaTypeMismatch}
			fileSizeExceeded={handlerProvider.uploadFileSizeExceeded}
			maxFileSize={FieldHelper.calculateMBfromByte(tableDefinition.annotation?.uploadTable?.maxLength)}
			uploadCompleted={handlerProvider.uploadCompleted}
			uploadEnabled={tableDefinition.annotation?.uploadTable?.uploadAction?.enabled}
			mediaTypes={tableDefinition.annotation?.uploadTable?.acceptableMediaTypes}
			actions={[`${id}-uploadButton`]}
			uploadUrl={tableDefinition.annotation?.uploadTable?.stream}
			maxFileNameLength={tableDefinition.annotation?.uploadTable?.fileNameMaxLength}
			fileNameLengthExceeded={handlerProvider.uploadFileNameLengthExceeded}
		>
			{{
				rowConfiguration: <UploadItemConfiguration fileNamePath={tableDefinition.annotation?.uploadTable?.fileName} />
			}}
		</UploadSetwithTable>
	);
}

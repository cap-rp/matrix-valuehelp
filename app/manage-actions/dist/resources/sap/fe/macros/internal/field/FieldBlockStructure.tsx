import { generate } from "sap/fe/core/helpers/StableIdHelper";
import FieldFormatOptions from "sap/fe/macros/field/FieldFormatOptions";
import type { EventHandler } from "types/extension_types";
import Field from "../../Field";
import type { FieldBlockProperties } from "./FieldStructureHelper";

function createField(field: FieldBlockProperties, id?: string): string {
	return (
		<Field
			core:require="{TableAPI: 'sap/fe/macros/table/TableAPI'}"
			change={field.change as unknown as EventHandler}
			liveChange={field.onLiveChange as unknown as EventHandler}
			focusin={".collaborativeDraft.handleContentFocusIn" as unknown as EventHandler}
			id={id || field.id}
			_flexId={field._flexId}
			idPrefix={field.idPrefix}
			vhIdPrefix={field.vhIdPrefix}
			contextPath={field.contextPath?.getPath()}
			metaPath={field.metaPath.getPath()}
			metaModel={field.metaModel}
			navigateAfterAction={field.navigateAfterAction}
			editMode={field.editMode ?? field.computedEditMode}
			wrap={field.wrap}
			class={field.class}
			ariaLabelledBy={field.ariaLabelledBy}
			textAlign={field.textAlign}
			semanticObject={field.semanticObject}
			showErrorObjectStatus={field.showErrorObjectStatus}
			readOnly={field.readOnly}
			value={field.value}
			description={field.description}
			required={field.requiredExpression as unknown as boolean | undefined}
			editable={field.editableExpression as unknown as boolean | undefined}
			collaborationEnabled={field.collaborationEnabled}
			visible={field.visible as unknown as boolean | undefined}
			mainPropertyRelativePath={field.mainPropertyRelativePath}
			customValueBinding={field.value?.slice(0, 1) === "{" ? field.value : undefined} // we don't need the customValueBinding set if field.value is not a binding as this is only used to enable binding refreshes
		>
			{{ formatOptions: new FieldFormatOptions(field.formatOptions).serialize() }}
		</Field>
	);
}

export function getTemplateWithField(field: FieldBlockProperties): string {
	let id;

	if (field._apiId) {
		id = field._apiId;
	} else if (field.idPrefix) {
		id = generate([field.idPrefix, "Field"]);
	} else if (field.id) {
		id = field.id;
	} else {
		id = undefined;
	}

	if (field.change === null || field.change === "null") {
		field.change = undefined;
	}

	return createField(field, id);
}

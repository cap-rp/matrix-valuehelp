import type { EntityType } from "@sap-ux/vocabularies-types";
import type { DataField, DataFieldForAnnotation } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { concat, getExpressionFromAnnotation, pathInModel } from "sap/fe/base/BindingToolkit";

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
export const getTitleExpression = (entityType: EntityType): BindingToolkitExpression<unknown> | undefined => {
	// HeaderInfo can be a [DataField] and any of its children, or a [DataFieldForAnnotation] targeting [ConnectedFields](#ConnectedFields).
	const headerInfoTitle = entityType.annotations?.UI?.HeaderInfo?.Title as DataField | DataFieldForAnnotation;
	if (headerInfoTitle) {
		switch (headerInfoTitle.$Type) {
			case UIAnnotationTypes.DataField:
				return getExpressionFromAnnotation(headerInfoTitle.Value);
			case UIAnnotationTypes.DataFieldForAnnotation:
				Log.error("DataFieldForAnnotation with connected fields not supported for HeaderInfo.Title");
				return getExpressionFromAnnotation(entityType.annotations?.UI?.HeaderInfo?.TypeName);
		}
	}
	const semanticKeys = entityType.annotations?.Common?.SemanticKey;
	if (semanticKeys) {
		return concat(...semanticKeys.map((key) => pathInModel(key.value)));
	}
};

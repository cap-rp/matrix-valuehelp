import type { EntitySet } from "@sap-ux/vocabularies-types";
import type { DataFieldTypes, HeaderInfoType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { addTextArrangementToBindingExpression, formatValueRecursively } from "../field/FieldTemplating";

const HeaderHelper = {
	getDescriptionExpression(
		fullContextPath: DataModelObjectPath<EntitySet>,
		headerInfo?: HeaderInfoType
	): CompiledBindingToolkitExpression {
		let descriptionBinding = getExpressionFromAnnotation((headerInfo?.Description as DataFieldTypes)?.Value);
		if ((headerInfo?.Description as DataFieldTypes)?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement) {
			// consider text arrangement annotation in the description as well
			descriptionBinding = addTextArrangementToBindingExpression(descriptionBinding, fullContextPath);
		}
		const description = compileExpression(formatValueRecursively(descriptionBinding, fullContextPath));
		return description === "undefined" ? "" : description;
	}
};

export default HeaderHelper;

import type { AnnotationPath, PathAnnotationExpression, Property } from "@sap-ux/vocabularies-types/Edm";
import type {
	ConnectedFieldsTypeTypes,
	DataFieldAbstractTypes,
	DataFieldTypes,
	DataPointTypeTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { PropertyAnnotations_UI } from "@sap-ux/vocabularies-types/vocabularies/UI_Edm";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, concat, constant, equal, ifElse, not, or } from "sap/fe/base/BindingToolkit";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import { isAnnotationPath, isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import type { ComputedAnnotationInterface, MetaModelContext } from "sap/fe/core/templating/UIFormatters";
import { getConverterContext, isVisible } from "sap/fe/core/templating/UIFormatters";

export const getDataField = function (
	oContext: MetaModelContext,
	oInterface: ComputedAnnotationInterface
): DataFieldTypes | ConnectedFieldsTypeTypes | Property {
	const sPath = oInterface.context.getPath();
	if (!oContext) {
		throw new Error(`Unresolved context path ${sPath}`);
	}
	if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
		throw new Error(`Context does not resolve to a DataField object but to a ${oContext.$kind}`);
	}
	let oConverterContext = getConverterContext(oContext, oInterface) as
		| DataFieldTypes
		| Property
		| ConnectedFieldsTypeTypes
		| AnnotationPath<DataFieldTypes | ConnectedFieldsTypeTypes>
		| PathAnnotationExpression<DataFieldTypes | ConnectedFieldsTypeTypes>;
	if (isAnnotationPath(oConverterContext) || isPathAnnotationExpression(oConverterContext)) {
		oConverterContext = oConverterContext.$target!;
	}
	return oConverterContext;
};

export const getDataFieldObjectPath = function (
	oContext: MetaModelContext | string,
	oInterface: ComputedAnnotationInterface
): DataModelObjectPath<DataFieldTypes> {
	const sPath = oInterface.context.getPath();
	if (!oContext) {
		throw new Error(`Unresolved context path ${sPath}`);
	}
	if (typeof oContext === "object" && oContext.hasOwnProperty("$kind") && oContext.$kind !== "Property") {
		throw new Error(`Context does not resolve to a Property object but to a ${oContext.$kind}`);
	}
	let involvedDataModelObjects = getInvolvedDataModelObjects<DataFieldTypes>(oInterface.context);
	if (involvedDataModelObjects.targetObject && isPathAnnotationExpression(involvedDataModelObjects.targetObject)) {
		involvedDataModelObjects = enhanceDataModelPath<DataFieldTypes>(
			involvedDataModelObjects,
			involvedDataModelObjects.targetObject.path
		);
	}
	if (involvedDataModelObjects.targetObject && isAnnotationPath<DataFieldTypes>(involvedDataModelObjects.targetObject)) {
		// REVIEW -> The code below was never correct, i'm changing it to something that makes sense type wise
		involvedDataModelObjects = enhanceDataModelPath<DataFieldTypes>(
			involvedDataModelObjects,
			involvedDataModelObjects.targetObject.value
		);
	}
	if (sPath.endsWith("$Path") || sPath.endsWith("$AnnotationPath")) {
		involvedDataModelObjects = enhanceDataModelPath<DataFieldTypes>(involvedDataModelObjects, oContext as string);
	}
	return involvedDataModelObjects;
};

export const isSemanticallyConnectedFields = function (oContext: MetaModelContext, oInterface: ComputedAnnotationInterface): boolean {
	const oDataField = getDataField(oContext, oInterface);
	return (oDataField as ConnectedFieldsTypeTypes).$Type === UIAnnotationTypes.ConnectedFieldsType;
};

/**
 *
 * @param oContext The Context of the property
 * @param oInterface The interface instance
 * @returns True if the property has MultiLineText annotation
 */
export const isMultiLineText = function (oContext: MetaModelContext, oInterface: ComputedAnnotationInterface): boolean {
	const oDataField = getDataField(oContext, oInterface);
	return (oDataField.annotations?.UI as PropertyAnnotations_UI)?.MultiLineText?.valueOf() === true;
};

const connectedFieldsTemplateRegex = /(?:({[^}]+})[^{]*)/g;
const connectedFieldsTemplateSubRegex = /{([^}]+)}(.*)/;
export const getLabelForConnectedFields = function (
	connectedFieldsPath: DataModelObjectPath<ConnectedFieldsTypeTypes>,
	getTextBindingExpression: Function,
	compileBindingExpression = true
): BindingToolkitExpression<string> | CompiledBindingToolkitExpression {
	const connectedFields: ConnectedFieldsTypeTypes = connectedFieldsPath.targetObject!;
	// First we separate each group of `{TemplatePart} xxx`
	const templateMatches = connectedFields.Template.toString().match(connectedFieldsTemplateRegex);
	if (!templateMatches) {
		return "";
	}
	const partsToConcat = templateMatches.reduce((subPartsToConcat: BindingToolkitExpression<string>[], match) => {
		// Then for each sub-group, we retrieve the name of the data object and the remaining text, if it exists
		const subMatch = match.match(connectedFieldsTemplateSubRegex);
		if (subMatch && subMatch.length > 1) {
			const targetValue = subMatch[1];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const targetData = (connectedFields.Data as any)[targetValue];
			if (targetData) {
				const dataFieldPath = enhanceDataModelPath<DataFieldTypes>(
					connectedFieldsPath,
					// TODO Better type for the Edm.Dictionary
					targetData.fullyQualifiedName.replace(connectedFieldsPath.targetEntityType.fullyQualifiedName, "")
				);
				dataFieldPath.targetObject = dataFieldPath.targetObject!.Value;
				subPartsToConcat.push(getTextBindingExpression(dataFieldPath, {}));
				if (subMatch.length > 2) {
					subPartsToConcat.push(constant(subMatch[2]));
				}
			}
		}
		return subPartsToConcat;
	}, []);
	return compileBindingExpression ? compileExpression(concat(...partsToConcat)) : concat(...partsToConcat);
};

/**
 * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
 *
 * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
 * @param dataFieldModelPath The metapath referring to the annotation we are evaluating.
 * @param [formatOptions] FormatOptions optional.
 * @param formatOptions.isAnalytics This flag is set when using an analytical table.
 * @returns An expression that you can bind to the UI.
 */
export const generateVisibleExpression = function (
	dataFieldModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>,
	formatOptions?: { isAnalytics?: boolean }
): BindingToolkitExpression<boolean> {
	let propertyValue;
	let targetModelPath;
	const targetObject = dataFieldModelPath.targetObject;
	if (targetObject && !isProperty(targetObject)) {
		switch (targetObject.$Type) {
			case UIAnnotationTypes.DataField:
			case UIAnnotationTypes.DataFieldWithUrl:
			case UIAnnotationTypes.DataFieldWithNavigationPath:
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldWithAction:
			case UIAnnotationTypes.DataPointType:
				propertyValue = targetObject.Value.$target;
				targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject.Value.path);
				break;
			case UIAnnotationTypes.DataFieldForAnnotation:
				// if it is a DataFieldForAnnotation pointing to a DataPoint we look at the dataPoint's value
				if (targetObject?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType) {
					propertyValue = targetObject.Target.$target?.Value.$target;
					targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject.Target.value);
					targetModelPath = enhanceDataModelPath(targetModelPath, targetObject.Target.$target?.Value.path);
					break;
				}
			// eslint-disable-next-line no-fallthrough
			case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldForAction:
			default:
				propertyValue = undefined;
		}
	} else if (targetObject && isProperty(targetObject)) {
		targetModelPath = enhanceDataModelPath(dataFieldModelPath, targetObject);
	}

	const isAnalyticalGroupHeaderExpanded = formatOptions?.isAnalytics ? UI.IsExpanded : constant(false);
	const isAnalyticalLeaf = formatOptions?.isAnalytics ? equal(UI.NodeLevel, 0) : constant(false);
	// A data field is visible if:
	// - the UI.Hidden expression in the original annotation does not evaluate to 'true'
	// - the UI.Hidden expression in the target property does not evaluate to 'true'
	// - in case of Analytics it's not visible for an expanded GroupHeader
	return and(
		...[
			isVisible(dataFieldModelPath.targetObject, getRelativePaths(dataFieldModelPath)),
			ifElse(!!propertyValue, propertyValue && isVisible(propertyValue, getRelativePaths(targetModelPath)), true),
			or(not(isAnalyticalGroupHeaderExpanded), isAnalyticalLeaf)
		]
	);
};

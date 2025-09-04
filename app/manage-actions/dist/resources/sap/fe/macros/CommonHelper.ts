import type {
	Chart,
	ChartMeasureAttributeType,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	PresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, fn, ifElse, notEqual, pathInModel, ref } from "sap/fe/base/BindingToolkit";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { FilterSettings } from "sap/fe/core/converters/ManifestSettings";

import type { PropertyPath } from "@sap-ux/vocabularies-types";
import { aiIcon, type CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import { isPropertyFilterable } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type { ComputedAnnotationInterface } from "sap/fe/core/templating/UIFormatters";
import * as DefaultSemanticDateOperators from "sap/fe/macros/filterBar/DefaultSemanticDateOperators";
import ExtendedSemanticDateOperators from "sap/fe/macros/filterBar/ExtendedSemanticDateOperators";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import mLibrary from "sap/m/library";
import Device from "sap/ui/Device";
import FilterOperatorUtil from "sap/ui/mdc/condition/FilterOperatorUtil";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import Context from "sap/ui/model/Context";
import ODataModelAnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { MetaModelType } from "../../../../../../types/metamodel_types";

type MetaModelMeasure = {
	$PropertyPath: string;
};

function _getRestrictions(aDefaultOps: string[], aExpressionOps: string[]): string[] {
	// From the default set of Operators for the Base Type, select those that are defined in the Allowed Value.
	// In case that no operators are found, return undefined so that the default set is used.
	return aDefaultOps.filter(function (sElement) {
		return aExpressionOps.includes(sElement);
	});
}

function _getDefaultOperators(sPropertyType?: string): string[] {
	// mdc defines the full set of operations that are meaningful for each Edm Type
	// TODO Replace with model / internal way of retrieving the actual model type used for the property
	const oDataClass = TypeMap.getDataTypeClassName(sPropertyType);
	// TODO need to pass proper formatOptions, constraints here
	const oBaseType = TypeMap.getBaseType(oDataClass, {}, {});
	return FilterOperatorUtil.getOperatorsForType(oBaseType);
}

const ValueColor = mLibrary.ValueColor;
const CommonHelper = {
	getPathToKey: function (oCtx: Context): object {
		return oCtx.getObject();
	},

	/**
	 * Determine if field is editable.
	 * @param target Target instance
	 * @param oInterface Interface instance
	 * @returns A Binding Expression to determine if a field should be editable or not.
	 */
	getParameterEditMode: function (target: object, oInterface: ComputedAnnotationInterface): string {
		const oModel = oInterface.context.getModel(),
			sPropertyPath = oInterface.context.getPath(),
			oAnnotations = oModel.getObject(`${sPropertyPath}@`),
			fieldControl = oAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"],
			immutable = oAnnotations["@Org.OData.Core.V1.Immutable"],
			computed = oAnnotations["@Org.OData.Core.V1.Computed"];

		let sEditMode: FieldEditMode | string = FieldEditMode.Editable;

		if (immutable || computed) {
			sEditMode = FieldEditMode.ReadOnly;
		} else if (fieldControl) {
			if (fieldControl.$EnumMember) {
				if (fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly") {
					sEditMode = FieldEditMode.ReadOnly;
				}
				if (
					fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable" ||
					fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden"
				) {
					sEditMode = FieldEditMode.Disabled;
				}
			}
			if (fieldControl.$Path) {
				sEditMode =
					"{= %{" +
					fieldControl.$Path +
					"} < 3 ? (%{" +
					fieldControl.$Path +
					"} === 0 ? '" +
					FieldEditMode.Disabled +
					"' : '" +
					FieldEditMode.ReadOnly +
					"') : '" +
					FieldEditMode.Editable +
					"'}";
			}
		}

		return sEditMode;
	},
	/**
	 * Get the complete metapath to the target.
	 * @param target
	 * @param oInterface
	 * @returns The metapath
	 */
	getMetaPath: function (target: unknown, oInterface: ComputedAnnotationInterface): string | undefined {
		return (oInterface && oInterface.context && oInterface.context.getPath()) || undefined;
	},
	getMetaModelId: function (target: Context, oInterface: ComputedAnnotationInterface): string {
		convertTypes(oInterface.context.getModel());
		return oInterface.context.getModel().getId();
	},
	isDesktop: function (): boolean {
		return Device.system.desktop === true;
	},
	getTargetCollectionPath: function (context: Context, navCollection?: string): string {
		let sPath = context.getPath();
		if (
			(context.getObject("$kind") as unknown as string) === "EntitySet" ||
			(context.getObject("$ContainsTarget") as unknown as boolean) === true
		) {
			return sPath;
		}

		const model = context.getModel() as ODataModel | ODataMetaModel;
		const metaModel = model.isA<ODataMetaModel>("sap.ui.model.odata.v4.ODataMetaModel") ? model : model.getMetaModel();
		sPath = metaModel.getMetaPath(sPath);

		//Supporting sPath of any format, either '/<entitySet>/<navigationCollection>' <OR> '/<entitySet>/$Type/<navigationCollection>'
		const aParts = sPath.split("/").filter(function (sPart: string): boolean {
			return !!sPart && sPart != "$Type";
		}); //filter out empty strings and parts referring to '$Type'
		const entitySet = `/${aParts[0]}`;
		if (aParts.length === 1) {
			return entitySet;
		}
		const navigationCollection = navCollection === undefined ? aParts.slice(1).join("/$NavigationPropertyBinding/") : navCollection;
		return `${entitySet}/$NavigationPropertyBinding/${navigationCollection}`; // used in gotoTargetEntitySet method in the same file
	},

	isPropertyFilterable: function (
		context: Context,
		oDataField?: MetaModelType<DataFieldTypes>,
		skipHiddenFilters?: boolean
	): boolean | CompiledBindingToolkitExpression {
		const oModel = context.getModel() as ODataMetaModel,
			sPropertyPath = context.getPath(),
			// LoacationPath would be the prefix of sPropertyPath, example: sPropertyPath = '/Customer/Set/Name' -> sPropertyLocationPath = '/Customer/Set'
			sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
			sProperty = sPropertyPath.replace(`${sPropertyLocationPath}/`, "");

		if (
			oDataField &&
			(oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
				oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation")
		) {
			return false;
		}

		return isPropertyFilterable(oModel, sPropertyLocationPath, sProperty, skipHiddenFilters);
	},

	getLocationForPropertyPath: function (oModel: ODataMetaModel, sPropertyPath: string): string {
		let iLength;
		let sCollectionPath = sPropertyPath.slice(0, sPropertyPath.lastIndexOf("/"));
		if (oModel.getObject(`${sCollectionPath}/$kind`) === "EntityContainer") {
			iLength = sCollectionPath.length + 1;
			sCollectionPath = sPropertyPath.slice(iLength, sPropertyPath.indexOf("/", iLength));
		}
		return sCollectionPath;
	},
	gotoActionParameter: function (oContext: Context): string {
		const sPath = oContext.getPath(),
			sPropertyName = oContext.getObject(`${sPath}/$Name`);

		return CommonUtils.getParameterPath(sPath, sPropertyName);
	},
	/**
	 * Returns the entity set name from the entity type name.
	 * @param oMetaModel OData v4 metamodel instance
	 * @param sEntityType EntityType of the actiom
	 * @returns The EntitySet of the bound action
	 * @private
	 */
	getEntitySetName: function (oMetaModel: ODataMetaModel, sEntityType: string): string | undefined {
		const oEntityContainer = oMetaModel.getObject("/");
		for (const key in oEntityContainer) {
			if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
				return key;
			}
		}
		return undefined;
	},
	/**
	 * Returns the metamodel path correctly for bound actions if used with bReturnOnlyPath as true,
	 * else returns an object which has 3 properties related to the action. They are the entity set name,
	 * the $Path value of the OperationAvailable annotation and the binding parameter name. If
	 * bCheckStaticValue is true, returns the static value of OperationAvailable annotation, if present.
	 * e.g. for bound action someNameSpace.SomeBoundAction
	 * of entity set SomeEntitySet, the string "/SomeEntitySet/someNameSpace.SomeBoundAction" is returned.
	 * @param oAction The context object of the action
	 * @param bReturnOnlyPath If false, additional info is returned along with metamodel path to the bound action
	 * @param sActionName The name of the bound action of the form someNameSpace.SomeBoundAction
	 * @param bCheckStaticValue If true, the static value of OperationAvailable is returned, if present
	 * @returns The string or object as specified by bReturnOnlyPath
	 * @private
	 */
	getActionPath: function (
		oAction: Context,
		bReturnOnlyPath: boolean,
		sActionName?: string,
		bCheckStaticValue?: boolean
	):
		| string
		| {
				sContextPath: string;
				sProperty: string;
				sBindingParameter: string;
		  } {
		let sContextPath = oAction.getPath().split("/@")[0];

		sActionName = !sActionName ? oAction.getObject(oAction.getPath()) : sActionName;

		if (sActionName && sActionName.includes("(")) {
			// action bound to another entity type
			sActionName = sActionName.split("(")[0];
		} else if (oAction.getObject(sContextPath)) {
			// TODO: this logic sounds wrong, to be corrected
			const sEntityTypeName = oAction.getObject(sContextPath).$Type;
			const sEntityName = this.getEntitySetName(oAction.getModel(), sEntityTypeName);
			if (sEntityName) {
				sContextPath = `/${sEntityName}`;
			}
		} else {
			return sContextPath;
		}

		if (bCheckStaticValue) {
			return oAction.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable`);
		}
		if (bReturnOnlyPath) {
			return `${sContextPath}/${sActionName}`;
		} else {
			return {
				sContextPath: sContextPath,
				sProperty: oAction.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable/$Path`),
				sBindingParameter: oAction.getObject(`${sContextPath}/${sActionName}/@$ui5.overload/0/$Parameter/0/$Name`)
			};
		}
	},

	getNavigationContext: function (oContext: Context): string {
		return ODataModelAnnotationHelper.getNavigationPath(oContext.getPath());
	},

	/**
	 * Returns the path without the entity type (potentially first) and property (last) part (optional).
	 * The result can be an empty string if it is a simple direct property.
	 *
	 * If and only if the given property path starts with a slash (/), it is considered that the entity type
	 * is part of the path and will be stripped away.
	 * @param sPropertyPath
	 * @param bKeepProperty
	 * @returns The navigation path
	 */
	getNavigationPath: function (sPropertyPath: string, bKeepProperty?: boolean): string {
		const bStartsWithEntityType = sPropertyPath.startsWith("/");
		const aParts = sPropertyPath.split("/").filter(function (part: string) {
			return !!part;
		});
		if (bStartsWithEntityType) {
			aParts.shift();
		}
		if (!bKeepProperty) {
			aParts.pop();
		}
		return aParts.join("/");
	},

	/**
	 * Returns the correct metamodel path for bound actions.
	 *
	 * Since this method is called irrespective of the action type, this will be applied to unbound actions.
	 * In such a case, if an incorrect path is returned, it is ignored during templating.
	 *
	 * Example: for the bound action someNameSpace.SomeBoundAction of entity set SomeEntitySet,
	 * the string "/SomeEntitySet/someNameSpace.SomeBoundAction" is returned.
	 * @param oAction Context object for the action
	 * @returns Correct metamodel path for bound and incorrect path for unbound actions
	 * @private
	 */
	getActionContext: function (oAction: Context): string {
		return CommonHelper.getActionPath(oAction, true) as string;
	},
	/**
	 * Returns the metamodel path correctly for overloaded bound actions. For unbound actions,
	 * the incorrect path is returned, but ignored during templating.
	 * e.g. for bound action someNameSpace.SomeBoundAction of entity set SomeEntitySet,
	 * the string "/SomeEntitySet/someNameSpace.SomeBoundAction/@$ui5.overload/0" is returned.
	 * @param oAction The context object for the action
	 * @returns The correct metamodel path for bound action overload and incorrect path for unbound actions
	 * @private
	 */
	getPathToBoundActionOverload: function (oAction: Context): string {
		const sPath = CommonHelper.getActionPath(oAction, true);
		return `${sPath}/@$ui5.overload/0`;
	},

	/**
	 * Returns the string with single quotes.
	 * @param sValue Some string that needs to be converted into single quotes
	 * @param [bEscape] Should the string be escaped beforehand
	 * @returns - String with single quotes
	 */
	addSingleQuotes: function (sValue: string, bEscape?: boolean): string {
		if (bEscape && sValue) {
			sValue = this.escapeSingleQuotes(sValue);
		}
		return `'${sValue}'`;
	},

	/**
	 * Returns the string with escaped single quotes.
	 * @param sValue Some string that needs escaping of single quotes
	 * @returns - String with escaped single quotes
	 */
	escapeSingleQuotes: function (sValue: string): string {
		return sValue.replace(/[']/g, "\\'");
	},

	/**
	 * Returns the function string
	 * The first argument of generateFunction is name of the generated function string.
	 * Remaining arguments of generateFunction are arguments of the newly generated function string.
	 * @param sFuncName Some string for the function name
	 * @param args The remaining arguments
	 * @returns - Function string depends on arguments passed
	 */
	generateFunction: function (sFuncName: string, ...args: string[]): string {
		let sParams = "";
		for (let i = 0; i < args.length; i++) {
			sParams += args[i];
			if (i < args.length - 1) {
				sParams += ", ";
			}
		}

		let sFunction = `${sFuncName}()`;
		if (sParams) {
			sFunction = `${sFuncName}(${sParams})`;
		}
		return sFunction;
	},
	/*
	 * Returns the visibility expression for datapoint title/link
	 *
	 * @function
	 * @param {string} [path] annotation path of data point or Microchart
	 * @param {boolean} [isClickable] true if link is visible
	 * @returns {CompiledBindingToolkitExpression} visibilityExp Used to get the visibility binding for DataPoints title in the Header.
	 *
	 */

	getHeaderDataPointLinkVisibility: function (path: string, isClickable: boolean): CompiledBindingToolkitExpression {
		return compileExpression(
			ifElse(
				constant(isClickable),
				equal(pathInModel(`isHeaderDPLinkVisible/${path}`, "internal"), true),
				notEqual(pathInModel(`isHeaderDPLinkVisible/${path}`, "internal"), true)
			)
		);
	},

	/**
	 * Converts object to string(different from JSON.stringify or.toString).
	 * @param oParams Some object
	 * @returns - Object string
	 */
	objectToString: function (oParams: Record<string, unknown>): string {
		let iNumberOfKeys = Object.keys(oParams).length,
			sParams = "";

		for (const sKey in oParams) {
			let sValue = oParams[sKey];
			if (sValue && typeof sValue === "object") {
				sValue = this.objectToString(sValue as Record<string, unknown>);
			}
			sParams += `${sKey}: ${sValue}`;
			if (iNumberOfKeys > 1) {
				--iNumberOfKeys;
				sParams += ", ";
			}
		}

		return `{ ${sParams}}`;
	},

	/**
	 * Removes escape characters (\) from an expression.
	 * @param sExpression An expression with escape characters
	 * @returns Expression string without escape characters or undefined
	 */
	removeEscapeCharacters: function (sExpression?: string): string | undefined {
		return sExpression ? sExpression.replace(/\\?\\([{}])/g, "$1") : undefined;
	},

	/**
	 * Makes updates to a stringified object so that it works properly in a template by adding ui5Object:true.
	 * @param sStringified
	 * @returns The updated string representation of the object
	 */
	stringifyObject: function (sStringified: string): string | undefined {
		if (!sStringified || sStringified === "{}") {
			return undefined;
		} else {
			const oObject = JSON.parse(sStringified);
			if (typeof oObject === "object" && !Array.isArray(oObject)) {
				const oUI5Object = {
					ui5object: true
				};
				Object.assign(oUI5Object, oObject);
				return JSON.stringify(oUI5Object);
			} else {
				const sType = Array.isArray(oObject) ? "Array" : typeof oObject;
				Log.error(`Unexpected object type in stringifyObject (${sType}) - only works with object`);
				throw new Error("stringifyObject only works with objects!");
			}
		}
	},

	/**
	 * Create a string representation of the given data, taking care that it is not treated as a binding expression.
	 * @param vData The data to stringify
	 * @returns The string representation of the data.
	 */
	stringifyCustomData: function (vData: object | string | undefined): string {
		const oObject: { ui5object: true; customData?: unknown } = {
			ui5object: true
		};
		oObject["customData"] = vData instanceof Context ? vData.getObject() : vData;
		return JSON.stringify(oObject);
	},

	/**
	 * Parses the given data, potentially unwraps the data.
	 * @param vData The data to parse
	 * @param vData.ui5object
	 * @param vData.customData
	 * @returns The result of the data parsing
	 */
	parseCustomData: function (vData?: string | { ui5object: true; customData?: unknown }): unknown {
		vData = typeof vData === "string" ? JSON.parse(vData) : vData;
		if (vData && vData.hasOwnProperty("customData")) {
			return (vData as { ui5object: true; customData?: unknown })["customData"];
		}
		return vData;
	},
	getContextPath: function (oValue: unknown, oInterface: ComputedAnnotationInterface): string {
		const sPath = oInterface && oInterface.context && oInterface.context.getPath();
		return sPath[sPath.length - 1] === "/" ? sPath.slice(0, -1) : sPath;
	},
	/**
	 * Returns a stringified JSON object containing  Presentation Variant sort conditions.
	 * @param oContext
	 * @param oContext.getPath
	 * @param oContext.getModel
	 * @param oPresentationVariant Presentation variant Annotation
	 * @param sPresentationVariantPath
	 * @returns Stringified JSON object
	 */
	getSortConditions: function (
		oContext: { getPath(num: number): string; getModel(num: number): ODataMetaModel },
		oPresentationVariant: MetaModelType<PresentationVariant>,
		sPresentationVariantPath: string
	): string | undefined {
		if (
			oPresentationVariant &&
			CommonHelper._isPresentationVariantAnnotation(sPresentationVariantPath) &&
			oPresentationVariant.SortOrder
		) {
			const aSortConditions: { sorters: { name?: string; descending?: boolean }[] } = {
				sorters: []
			};

			const sEntityPath = oContext.getPath(0).split("@")[0];
			oPresentationVariant.SortOrder.forEach(function (oCondition = {}) {
				let oSortProperty: string | undefined;
				const oSorter: { name?: string; descending?: boolean } = {};
				if (oCondition.DynamicProperty) {
					oSortProperty = oContext.getModel(0).getObject(sEntityPath + oCondition.DynamicProperty.$AnnotationPath)?.Name;
				} else if (oCondition.Property) {
					oSortProperty = oCondition.Property.$PropertyPath;
				}
				if (oSortProperty) {
					oSorter.name = oSortProperty;
					oSorter.descending = !!oCondition.Descending;
					aSortConditions.sorters.push(oSorter);
				} else {
					throw new Error("Please define the right path to the sort property");
				}
			});
			return JSON.stringify(aSortConditions);
		}
		return undefined;
	},
	_isPresentationVariantAnnotation: function (annotationPath: string): boolean {
		return (
			annotationPath.includes(`@${UIAnnotationTerms.PresentationVariant}`) ||
			annotationPath.includes(`@${UIAnnotationTerms.SelectionPresentationVariant}`)
		);
	},
	createPresentationPathContext: function (oPresentationContext: Context): Context {
		const aPaths = oPresentationContext.getPath().split("@") || [];
		const oModel = oPresentationContext.getModel();
		if (aPaths.length && aPaths[aPaths.length - 1].includes("com.sap.vocabularies.UI.v1.SelectionPresentationVariant")) {
			const sPath = oPresentationContext.getPath().split("/PresentationVariant")[0];
			return oModel.createBindingContext(`${sPath}@sapui.name`);
		}
		return oModel.createBindingContext(`${oPresentationContext.getPath()}@sapui.name`);
	},
	getPressHandlerForDataFieldForIBN: function (
		oDataField: DataFieldForIntentBasedNavigation,
		sContext?: string,
		bNavigateWithConfirmationDialog?: boolean,
		forContextMenu = false
	): string | undefined {
		if (!oDataField) return undefined;
		const mNavigationParameters: {
			navigationContexts?: string;
			label?: string;
			applicableContexts?: string;
			notApplicableContexts?: string;
			semanticObjectMapping?: string;
		} = {
			navigationContexts: sContext ? sContext : "${$source>/}.getBindingContext()"
		};
		if (oDataField.RequiresContext && !oDataField.Inline && bNavigateWithConfirmationDialog) {
			const applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
			const notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
			mNavigationParameters.applicableContexts = `\${internal>ibn/${oDataField.SemanticObject}-${oDataField.Action}/${applicableProperty}/}`;
			mNavigationParameters.notApplicableContexts = `\${internal>ibn/${oDataField.SemanticObject}-${oDataField.Action}/${notApplicableProperty}/}`;
			mNavigationParameters.label = this.addSingleQuotes(oDataField.Label as string, true);
		}
		if (oDataField.Mapping) {
			mNavigationParameters.semanticObjectMapping = this.addSingleQuotes(JSON.stringify(oDataField.Mapping));
		}
		return this.generateFunction(
			bNavigateWithConfirmationDialog ? "._intentBasedNavigation.navigateWithConfirmationDialog" : "._intentBasedNavigation.navigate",
			this.addSingleQuotes(oDataField.SemanticObject as unknown as string),
			this.addSingleQuotes(oDataField.Action as unknown as string),
			this.objectToString(mNavigationParameters),
			"${$source>/}"
		);
	},
	getEntitySet: function (oContext: Context): string {
		const sPath = oContext.getPath();
		return ModelHelper.getEntitySetPath(sPath);
	},

	/**
	 * Method to do the calculation of criticality in case CriticalityCalculation present in the annotation
	 *
	 * The calculation is done by comparing a value to the threshold values relevant for the specified improvement direction.
	 * For improvement direction Target, the criticality is calculated using both low and high threshold values. It will be
	 *
	 * - Positive if the value is greater than or equal to AcceptanceRangeLowValue and lower than or equal to AcceptanceRangeHighValue
	 * - Neutral if the value is greater than or equal to ToleranceRangeLowValue and lower than AcceptanceRangeLowValue OR greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
	 * - Critical if the value is greater than or equal to DeviationRangeLowValue and lower than ToleranceRangeLowValue OR greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
	 * - Negative if the value is lower than DeviationRangeLowValue or greater than DeviationRangeHighValue
	 *
	 * For improvement direction Minimize, the criticality is calculated using the high threshold values. It is
	 * - Positive if the value is lower than or equal to AcceptanceRangeHighValue
	 * - Neutral if the value is greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
	 * - Critical if the value is greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
	 * - Negative if the value is greater than DeviationRangeHighValue
	 *
	 * For improvement direction Maximize, the criticality is calculated using the low threshold values. It is
	 *
	 * - Positive if the value is greater than or equal to AcceptanceRangeLowValue
	 * - Neutral if the value is less than AcceptanceRangeLowValue and greater than or equal to ToleranceRangeLowValue
	 * - Critical if the value is lower than ToleranceRangeLowValue and greater than or equal to DeviationRangeLowValue
	 * - Negative if the value is lower than DeviationRangeLowValue
	 *
	 * Thresholds are optional. For unassigned values, defaults are determined in this order:
	 *
	 * - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
	 * - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
	 * - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue.
	 * @param sImprovementDirection ImprovementDirection to be used for creating the criticality binding
	 * @param sValue Value from Datapoint to be measured
	 * @param sDeviationLow ExpressionBinding for Lower Deviation level
	 * @param sToleranceLow ExpressionBinding for Lower Tolerance level
	 * @param sAcceptanceLow ExpressionBinding for Lower Acceptance level
	 * @param sAcceptanceHigh ExpressionBinding for Higher Acceptance level
	 * @param sToleranceHigh ExpressionBinding for Higher Tolerance level
	 * @param sDeviationHigh ExpressionBinding for Higher Deviation level
	 * @returns Returns criticality calculation as expression binding
	 */
	getCriticalityCalculationBinding: function (
		sImprovementDirection: string,
		sValue: string,
		sDeviationLow: string | number,
		sToleranceLow: string | number,
		sAcceptanceLow: string | number,
		sAcceptanceHigh: string | number,
		sToleranceHigh: string | number,
		sDeviationHigh: string | number
	): string {
		let sCriticalityExpression: typeof ValueColor | string = ValueColor.Neutral; // Default Criticality State

		sValue = `%${sValue}`;

		// Setting Unassigned Values
		sDeviationLow = sDeviationLow || -Infinity;
		sToleranceLow = sToleranceLow || sDeviationLow;
		sAcceptanceLow = sAcceptanceLow || sToleranceLow;
		sDeviationHigh = sDeviationHigh || Infinity;
		sToleranceHigh = sToleranceHigh || sDeviationHigh;
		sAcceptanceHigh = sAcceptanceHigh || sToleranceHigh;

		// Dealing with Decimal and Path based bingdings
		sDeviationLow = sDeviationLow && (+sDeviationLow ? +sDeviationLow : `%${sDeviationLow}`);
		sToleranceLow = sToleranceLow && (+sToleranceLow ? +sToleranceLow : `%${sToleranceLow}`);
		sAcceptanceLow = sAcceptanceLow && (+sAcceptanceLow ? +sAcceptanceLow : `%${sAcceptanceLow}`);
		sAcceptanceHigh = sAcceptanceHigh && (+sAcceptanceHigh ? +sAcceptanceHigh : `%${sAcceptanceHigh}`);
		sToleranceHigh = sToleranceHigh && (+sToleranceHigh ? +sToleranceHigh : `%${sToleranceHigh}`);
		sDeviationHigh = sDeviationHigh && (+sDeviationHigh ? +sDeviationHigh : `%${sDeviationHigh}`);

		// Creating runtime expression binding from criticality calculation for Criticality State
		if (sImprovementDirection.includes("Minimize")) {
			sCriticalityExpression =
				"{= " +
				sValue +
				" <= " +
				sAcceptanceHigh +
				" ? '" +
				ValueColor.Good +
				"' : " +
				sValue +
				" <= " +
				sToleranceHigh +
				" ? '" +
				ValueColor.Neutral +
				"' : " +
				"(" +
				sDeviationHigh +
				" && " +
				sValue +
				" <= " +
				sDeviationHigh +
				") ? '" +
				ValueColor.Critical +
				"' : '" +
				ValueColor.Error +
				"' }";
		} else if (sImprovementDirection.includes("Maximize")) {
			sCriticalityExpression =
				"{= " +
				sValue +
				" >= " +
				sAcceptanceLow +
				" ? '" +
				ValueColor.Good +
				"' : " +
				sValue +
				" >= " +
				sToleranceLow +
				" ? '" +
				ValueColor.Neutral +
				"' : " +
				"(" +
				sDeviationLow +
				" && " +
				sValue +
				" >= " +
				sDeviationLow +
				") ? '" +
				ValueColor.Critical +
				"' : '" +
				ValueColor.Error +
				"' }";
		} else if (sImprovementDirection.includes("Target")) {
			sCriticalityExpression =
				"{= (" +
				sValue +
				" <= " +
				sAcceptanceHigh +
				" && " +
				sValue +
				" >= " +
				sAcceptanceLow +
				") ? '" +
				ValueColor.Good +
				"' : " +
				"((" +
				sValue +
				" >= " +
				sToleranceLow +
				" && " +
				sValue +
				" < " +
				sAcceptanceLow +
				") || (" +
				sValue +
				" > " +
				sAcceptanceHigh +
				" && " +
				sValue +
				" <= " +
				sToleranceHigh +
				")) ? '" +
				ValueColor.Neutral +
				"' : " +
				"((" +
				sDeviationLow +
				" && (" +
				sValue +
				" >= " +
				sDeviationLow +
				") && (" +
				sValue +
				" < " +
				sToleranceLow +
				")) || ((" +
				sValue +
				" > " +
				sToleranceHigh +
				") && " +
				sDeviationHigh +
				" && (" +
				sValue +
				" <= " +
				sDeviationHigh +
				"))) ? '" +
				ValueColor.Critical +
				"' : '" +
				ValueColor.Error +
				"' }";
		} else {
			Log.warning("Case not supported, returning the default Value Neutral");
		}

		return sCriticalityExpression;
	},
	/**
	 * To fetch measure attribute index.
	 * @param iMeasure Chart Annotations
	 * @param oChartAnnotations Chart Annotations
	 * @returns MeasureAttribute index.
	 * @private
	 */
	getMeasureAttributeIndex: function (iMeasure: number, oChartAnnotations: MetaModelType<Chart> | Chart, isMicroChart?: boolean): number {
		let aMeasures, sMeasurePropertyPath;
		if (oChartAnnotations?.Measures?.length && oChartAnnotations?.Measures?.length > 0) {
			aMeasures = oChartAnnotations.Measures;
			sMeasurePropertyPath = isMicroChart
				? (aMeasures[iMeasure] as PropertyPath).value
				: (aMeasures[iMeasure] as MetaModelMeasure).$PropertyPath;
		} else if (oChartAnnotations?.DynamicMeasures?.length && oChartAnnotations?.DynamicMeasures?.length > 0) {
			aMeasures = (oChartAnnotations as MetaModelType<Chart>).DynamicMeasures;
			sMeasurePropertyPath = aMeasures?.[iMeasure].$AnnotationPath;
		}
		let bMeasureAttributeExists;
		const aMeasureAttributes = oChartAnnotations.MeasureAttributes;
		let iMeasureAttribute = -1;
		const fnCheckMeasure = function (
			sMeasurePath: string | undefined,
			oMeasureAttribute: MetaModelType<ChartMeasureAttributeType> | ChartMeasureAttributeType,
			index: number
		): boolean {
			if (oMeasureAttribute) {
				const path = isMicroChart
					? (oMeasureAttribute as ChartMeasureAttributeType).Measure?.value
					: (oMeasureAttribute as MetaModelType<ChartMeasureAttributeType>).Measure?.$PropertyPath;
				if (oMeasureAttribute.Measure && path === sMeasurePath) {
					iMeasureAttribute = index;
					return true;
				} else if (
					oMeasureAttribute.DynamicMeasure &&
					(oMeasureAttribute as MetaModelType<ChartMeasureAttributeType>)?.DynamicMeasure?.$AnnotationPath === sMeasurePath
				) {
					iMeasureAttribute = index;
					return true;
				}
			}
			return false;
		};
		if (aMeasureAttributes) {
			bMeasureAttributeExists = aMeasureAttributes.some(fnCheckMeasure.bind(null, sMeasurePropertyPath));
		}
		return bMeasureAttributeExists && iMeasureAttribute > -1 ? iMeasureAttribute : -1;
	},

	getMeasureAttribute: async function (oContext: Context): Promise<string | undefined> {
		const oMetaModel = oContext.getModel() as ODataMetaModel,
			sChartAnnotationPath = oContext.getPath();
		return oMetaModel.requestObject(sChartAnnotationPath).then(function (oChartAnnotations: MetaModelType<Chart>) {
			const aMeasureAttributes = oChartAnnotations.MeasureAttributes,
				iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(0, oChartAnnotations);
			const sMeasureAttributePath =
				iMeasureAttribute > -1 && aMeasureAttributes?.[iMeasureAttribute] && aMeasureAttributes[iMeasureAttribute].DataPoint
					? `${sChartAnnotationPath}/MeasureAttributes/${iMeasureAttribute}/`
					: undefined;
			if (sMeasureAttributePath === undefined) {
				Log.warning("DataPoint missing for the measure");
			}
			return sMeasureAttributePath ? `${sMeasureAttributePath}DataPoint/$AnnotationPath/` : sMeasureAttributePath;
		});
	},
	/**
	 * This function returns the measureAttribute for the measure.
	 * @param oContext Context to the measure annotation
	 * @returns Path to the measureAttribute of the measure
	 */
	getMeasureAttributeForMeasure: function (oContext: Context): string | undefined {
		const oMetaModel = oContext.getModel() as ODataMetaModel,
			sMeasurePath = oContext.getPath(),
			sChartAnnotationPath = sMeasurePath.substring(0, sMeasurePath.lastIndexOf("Measure")),
			iMeasure = sMeasurePath.replace(/.*\//, "");

		const oChartAnnotations = oMetaModel.getObject(sChartAnnotationPath);
		const aMeasureAttributes = oChartAnnotations.MeasureAttributes,
			iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(iMeasure as unknown as number, oChartAnnotations);
		const sMeasureAttributePath =
			iMeasureAttribute > -1 && aMeasureAttributes[iMeasureAttribute] && aMeasureAttributes[iMeasureAttribute].DataPoint
				? `${sChartAnnotationPath}MeasureAttributes/${iMeasureAttribute}/`
				: undefined;
		if (sMeasureAttributePath === undefined) {
			Log.warning("DataPoint missing for the measure");
		}
		return sMeasureAttributePath ? `${sMeasureAttributePath}DataPoint/$AnnotationPath/` : sMeasureAttributePath;
	},
	/**
	 * Method to determine if the contained navigation property has a draft root/node parent entitySet.
	 * @param oTargetCollectionContainsTarget Target collection has ContainsTarget property
	 * @param oTableMetadata Table metadata for which draft support shall be checked
	 * @param oTableMetadata.parentEntitySet
	 * @param oTableMetadata.parentEntitySet.oModel
	 * @param oTableMetadata.parentEntitySet.sPath
	 * @returns Returns true if draft
	 */
	isDraftParentEntityForContainment: function (
		oTargetCollectionContainsTarget: object,
		oTableMetadata: {
			parentEntitySet?: {
				oModel: ODataMetaModel;
				sPath?: string;
			};
		}
	): boolean {
		if (oTargetCollectionContainsTarget) {
			if (oTableMetadata && oTableMetadata.parentEntitySet && oTableMetadata.parentEntitySet.sPath) {
				const sParentEntitySetPath = oTableMetadata.parentEntitySet.sPath;
				const oDraftRoot = oTableMetadata.parentEntitySet.oModel.getObject(
					`${sParentEntitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`
				);
				const oDraftNode = oTableMetadata.parentEntitySet.oModel.getObject(
					`${sParentEntitySetPath}@com.sap.vocabularies.Common.v1.DraftNode`
				);
				if (oDraftRoot || oDraftNode) {
					return true;
				} else {
					return false;
				}
			}
		}
		return false;
	},

	/**
	 * Ensures the data is processed as defined in the template.
	 * Since the property Data is of the type 'object', it may not be in the same order as required by the template.
	 * @param dataElement The data that is currently being processed.
	 * @returns The correct path according to the template.
	 */
	getDataFromTemplate: function (dataElement: Context): string {
		const splitPath = dataElement.getPath().split("/");
		const dataKey = splitPath[splitPath.length - 1];
		const connectedDataPath = `/${splitPath.slice(1, -2).join("/")}/@`;
		const connectedObject = dataElement.getObject(connectedDataPath);
		const template = connectedObject.Template;
		const splitTemp = template.split("}");
		const tempArray = [];
		for (let i = 0; i < splitTemp.length - 1; i++) {
			const key = splitTemp[i].split("{")[1].trim();
			tempArray.push(key);
		}
		Object.keys(connectedObject.Data).forEach(function (sKey: string) {
			if (sKey.startsWith("$")) {
				delete connectedObject.Data[sKey];
			}
		});
		const index = Object.keys(connectedObject.Data).indexOf(dataKey);
		return `/${splitPath.slice(1, -2).join("/")}/Data/${tempArray[index]}`;
	},

	/**
	 * Checks if the end of the template has been reached.
	 * @param target The target of the connected fields.
	 * @param target.Template
	 * @param target.Data
	 * @param element The element that is currently being processed.
	 * @returns True or False (depending on the template index).
	 */
	notLastIndex: function (target: { Template: string; Data: Record<string, unknown> }, element: object): boolean {
		const template = target.Template;
		const splitTemp = template.split("}");
		const tempArray: string[] = [];
		let isLastIndex = false;
		for (let i = 0; i < splitTemp.length - 1; i++) {
			const dataKey = splitTemp[i].split("{")[1].trim();
			tempArray.push(dataKey);
		}

		tempArray.forEach(function (templateInfo: string) {
			const lastIndex = tempArray.length - 1;
			if (target.Data[templateInfo] === element && tempArray.indexOf(templateInfo) < lastIndex) {
				isLastIndex = true;
			}
		});
		return isLastIndex;
	},

	/**
	 * Determines the delimiter from the template.
	 * @param template The template string.
	 * @returns The delimiter in the template string.
	 */
	getDelimiter: function (template: string): string {
		return template.split("}")[1].split("{")[0].trim();
	},

	oMetaModel: undefined as ODataMetaModel | undefined,
	setMetaModel: function (oMetaModel: ODataMetaModel): void {
		this.oMetaModel = oMetaModel;
	},

	getMetaModel: function (): ODataMetaModel {
		return this.oMetaModel!;
	},

	getParameters: function (sPath: string, metaModel?: ODataMetaModel): string[] {
		if (metaModel) {
			const oParameterInfo = CommonUtils.getParameterInfo(metaModel, sPath);
			if (oParameterInfo.parameterProperties) {
				return Object.keys(oParameterInfo.parameterProperties);
			}
		}
		return [];
	},

	/**
	 * Build an expression calling an action handler via the FPM helper's actionWrapper function
	 *
	 * This function assumes that the 'FPM.actionWrapper()' function is available at runtime.
	 * @param oAction Action metadata
	 * @param oAction.handlerModule Module containing the action handler method
	 * @param oAction.handlerMethod Action handler method name
	 * @param [oThis] `this` (if the function is called from a macro)
	 * @param oThis.id The table's ID
	 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
	 * @returns The action wrapper binding	expression
	 */
	buildActionWrapper: function (
		oAction: CustomAction,
		oThis: { id?: string } | undefined,
		forContextMenu = false
	): CompiledBindingToolkitExpression {
		const aParams: unknown[] = [ref("$event"), oAction.handlerModule, oAction.handlerMethod];

		if (oThis && oThis.id) {
			const internalModelPath = !forContextMenu ? "${internal>selectedContexts}" : "${internal>contextmenu/selectedContexts}";
			const oAdditionalParams = { contexts: ref(internalModelPath) };
			aParams.push(oAdditionalParams);
		}
		return compileExpression(fn("FPM.actionWrapper", aParams));
	},
	/**
	 * Returns the value whether or not the element should be visible depending on the Hidden annotation.
	 * It is inverted as the UI elements have a visible property instead of a hidden one.
	 * @param dataFieldAnnotations The dataField object
	 * @returns A path or a Boolean
	 */
	getHiddenPathExpression: function (dataFieldAnnotations: Record<string, { $Path?: string }>): string | boolean {
		if (dataFieldAnnotations["@com.sap.vocabularies.UI.v1.Hidden"] !== null) {
			const hidden = dataFieldAnnotations["@com.sap.vocabularies.UI.v1.Hidden"];
			return typeof hidden === "object" ? "{= !${" + hidden.$Path + "} }" : !hidden;
		}
		return true;
	},

	/**
	 * Method to fetch the correct operators based on the filter restrictions that can be annotated on an entity set or a navigation property.
	 * We return the correct operators based on the specified restriction and also check for the operators defined in the manifest to include or exclude them.
	 * @param sProperty String name of the property
	 * @param sEntitySetPath String path to the entity set
	 * @param oContext Context used during templating
	 * @param sType String data type od the property, for example edm.Date
	 * @param bUseSemanticDateRange Boolean passed from the manifest for semantic date range
	 * @param settings Stringified object of the property settings or property settings as a whole
	 * @returns An array of strings representing operators for filtering
	 */
	getOperatorsForProperty: function (
		sProperty: string,
		sEntitySetPath: string,
		oContext: ODataMetaModel,
		sType?: string,
		bUseSemanticDateRange?: boolean | string,
		settings?: FilterSettings | string
	): string[] {
		const oFilterRestrictions = CommonUtils.getFilterRestrictionsByPath(sEntitySetPath, oContext);
		const aEqualsOps = ["EQ"];
		const aSingleRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
		const aSingleRangeDTBasicOps = ["EQ", "BT"];
		const aMultiRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NE", "NOTBT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
		const aSearchExpressionOps = ["Contains", "NotContains", "StartsWith", "NotStartsWith", "EndsWith", "NotEndsWith"];
		const aBasicSemanticDateOps = SemanticDateOperators.getBasicSemanticDateOperations();
		const bSemanticDateRange = bUseSemanticDateRange === "true" || bUseSemanticDateRange === true;
		let aSemanticDateOps: string[] = [];
		const oSettings = settings && typeof settings === "string" ? JSON.parse(settings).customData : settings;

		if ((oContext.getObject(`${sEntitySetPath}/@com.sap.vocabularies.Common.v1.ResultContext`) as unknown) === true) {
			return aEqualsOps;
		}

		if (oSettings && oSettings.operatorConfiguration && oSettings.operatorConfiguration.length > 0) {
			aSemanticDateOps = SemanticDateOperators.getFilterOperations(oSettings.operatorConfiguration, sType);
		} else {
			aSemanticDateOps = DefaultSemanticDateOperators.getSemanticDateOperations(sType);
		}
		// Get the default Operators for this Property Type
		const aDefaultOperators = _getDefaultOperators(sType);
		let supportedOperators = aDefaultOperators;
		if (bSemanticDateRange) {
			const extendedSemanticDateOperators = ExtendedSemanticDateOperators.getSemanticDateOperations();
			supportedOperators = [...aBasicSemanticDateOps, ...aDefaultOperators, ...extendedSemanticDateOperators];
		}

		let restrictions: string[] = [];

		// Is there a Filter Restriction defined for this property?
		if (
			oFilterRestrictions &&
			oFilterRestrictions.FilterAllowedExpressions &&
			oFilterRestrictions.FilterAllowedExpressions[sProperty]
		) {
			// Extending the default operators list with Semantic Date options DATERANGE, DATE, FROM and TO
			const sAllowedExpression = CommonUtils.getSpecificAllowedExpression(oFilterRestrictions.FilterAllowedExpressions[sProperty]);
			// In case more than one Allowed Expressions has been defined for a property
			// choose the most restrictive Allowed Expression

			// MultiValue has same Operator as SingleValue, but there can be more than one (maxConditions)
			switch (sAllowedExpression) {
				case "SingleValue":
					const singleValueDateOps = DefaultSemanticDateOperators.getSingleValueDateOperations();
					const aSingleValueOps = sType === "Edm.Date" && bSemanticDateRange ? singleValueDateOps : aEqualsOps;
					restrictions = _getRestrictions(supportedOperators, aSingleValueOps);
					break;
				case "MultiValue":
					const multiValueOperators = [...aEqualsOps, "Empty", "NotEmpty"];
					restrictions = _getRestrictions(supportedOperators, multiValueOperators);
					break;
				case "SingleRange":
					let aExpressionOps: string[];
					if (bSemanticDateRange) {
						if (sType === "Edm.Date") {
							aExpressionOps = aSemanticDateOps;
						} else if (sType === "Edm.DateTimeOffset") {
							aExpressionOps = aSemanticDateOps;
						} else {
							aExpressionOps = aSingleRangeOps;
						}
					} else if (sType === "Edm.DateTimeOffset") {
						aExpressionOps = aSingleRangeDTBasicOps;
					} else {
						aExpressionOps = aSingleRangeOps;
					}
					const sOperators = _getRestrictions(supportedOperators, aExpressionOps);
					restrictions = sOperators;
					break;
				case "MultiRange":
					restrictions = _getRestrictions(supportedOperators, aMultiRangeOps);
					break;
				case "SearchExpression":
					restrictions = _getRestrictions(supportedOperators, aSearchExpressionOps);
					break;
				case "MultiRangeOrSearchExpression":
					restrictions = _getRestrictions(supportedOperators, aSearchExpressionOps.concat(aMultiRangeOps));
					break;
				default:
					break;
			}
			// In case AllowedExpressions is not recognised, undefined in return results in the default set of
			// operators for the type.
		}
		return restrictions;
	},
	getOperatorsForDateProperty: function (propertyType: string): string[] {
		// In case AllowedExpressions is not provided for type Edm.Date then all the default
		// operators for the type should be returned excluding semantic operators from the list.
		const aDefaultOperators = _getDefaultOperators(propertyType);
		const aMultiRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NE", "NOTBT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
		return _getRestrictions(aDefaultOperators, aMultiRangeOps);
	},
	getAIIcon: function (): string {
		return aiIcon;
	}
};
(CommonHelper.getSortConditions as { requiresIContext?: boolean }).requiresIContext = true;

export default CommonHelper;

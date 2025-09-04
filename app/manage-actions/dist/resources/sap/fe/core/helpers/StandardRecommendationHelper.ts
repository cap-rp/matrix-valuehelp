import type { Property } from "@sap-ux/vocabularies-types";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { RecommendationsRegistry } from "sap/fe/core/services/SideEffectsServiceFactory";
import type Context from "sap/ui/model/Context";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { AcceptAllParams } from "../controllerextensions/Recommendations";
import type { DataModelObjectPath } from "../templating/DataModelPathHelper";
import { getDisplayMode } from "../templating/UIFormatters";
import { evaluateExpression } from "./BindingToolkitEvaluator";
import type { RecommendationValueType } from "./RecommendationHelper";
import { isPathAnnotationExpression, isPropertyPathExpression } from "./TypeGuards";

export type StandardRecommendationResponse = {
	AIRecommendedFieldPath?: string;
	AIRecommendedFieldValue?: string;
	AIRecommendedFieldDescription?: string;
	_AIAltvRecmddFldVals?: AlternativeRecommendationResponseType[];
};

export type RecommendationContextsInfo = {
	context?: ODataV4Context;
	contextIdentifier?: string[];
};

export type AlternativeRecommendationResponseType = {
	AIRecommendedFieldValue: string;
	AIRecommendedFieldScoreValue?: number;
};

export type StandardRecommendationDataType = {
	value?: string;
	text?: string;
	additionalValues?: RecommendationValueType[];
};

type StandardBaseRecommendation = {
	version?: number;
	keys?: Record<string, string[]>;
};

export type BaseDynamicRecommendation = Record<string, StandardRecommendationDataType>;

export type RecommendationInfo = StandardBaseRecommendation & BaseDynamicRecommendation;

let rootContext: ODataV4Context;

export const standardRecommendationHelper = {
	/**
	 * This function will process and set the recommendations according to data received from backend.
	 * @param recommendations The data received from backend
	 * @param internalModel The internal json model
	 * @param recommendationsContexts The contexts for which recommendations are being fetched
	 */
	storeRecommendations: (
		recommendations: StandardRecommendationResponse[],
		internalModel: JSONModel,
		recommendationsContexts: ODataV4Context[]
	): void => {
		const recommendationsData = (internalModel.getProperty("/recommendationsData") as RecommendationInfo) || {};
		standardRecommendationHelper.clearRecommendationsDataFromModelForGivenContexts(recommendationsData, recommendationsContexts);
		standardRecommendationHelper.enhanceRecommendationModel(recommendations, recommendationsData);
		standardRecommendationHelper.updateFetchedContextPaths(recommendationsContexts, internalModel);
		standardRecommendationHelper.updateContextsKeysInModel(recommendationsData, recommendationsContexts);
		//Setting the version to 2.0 to segregate the processing
		recommendationsData["version"] = 2.0;
		internalModel.setProperty("/recommendationsData", recommendationsData);
		internalModel.refresh(true);
	},

	ignoreRecommendationForContexts: (contexts: ODataV4Context[], internalModel: JSONModel): void => {
		let recommendationContexts: RecommendationContextsInfo[] = internalModel.getProperty("/recommendationContexts") || [];
		const recommendationData = internalModel.getProperty("/recommendationsData");
		const ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
		contexts.forEach((context: ODataV4Context) => {
			const ignoredContextPath = context.getPath();
			ignoredContextPaths.push(ignoredContextPath);
			// delete recommendation data for a context or its children filter recommendationContexts which do not match
			// a path. This will be the list of recommendations contexts to be kept in model
			recommendationContexts = recommendationContexts.filter((contextInfo: RecommendationContextsInfo) => {
				return !(contextInfo?.context as ODataV4Context).getPath().startsWith(ignoredContextPath);
			});
			Object.keys(recommendationData).forEach((data) => {
				if (data.startsWith(ignoredContextPath)) {
					delete recommendationData[data];
				}
			});
		});
		internalModel.setProperty("/recommendationsData", recommendationData);
		internalModel.setProperty("/recommendationContexts", recommendationContexts);
		internalModel.setProperty("/ignoredContextPaths", ignoredContextPaths);
	},

	clearIgnoredContexts: (internalModel: JSONModel, contextPath: string): void => {
		let ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
		ignoredContextPaths = ignoredContextPaths.filter((ignoredContextPath: string) => {
			return !ignoredContextPath.startsWith(contextPath);
		});
		internalModel.setProperty("/ignoredContextPaths", ignoredContextPaths);
	},

	/**
	 * This function checks if there are recommendation roles for context entity type.
	 * @param contextInfo Contains context and contextIdentifier
	 * @param recommendationsRegistry Registry which holds the recommendation roles for all entity types
	 * @returns Boolean value based on whether recommendation role exists for entityType annotation or not
	 */
	checkIfRecommendationRoleExistsForContext: (
		contextInfo: RecommendationContextsInfo,
		recommendationsRegistry: RecommendationsRegistry
	): boolean => {
		const dataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(
			(contextInfo?.context as ODataV4Context).getPath(),
			(contextInfo?.context as ODataV4Context).getModel()?.getMetaModel()
		);
		const entityType = dataModelObject?.targetEntityType.name as string;
		return Object.keys(recommendationsRegistry.roles).includes(entityType);
	},

	/**
	 * This function updates recommendation data with keys of all contexts. This must be shown in the Accept Recommendations Dialog based on the use case.
	 * @param recommendationsData
	 * @param recommendationContexts
	 */
	updateContextsKeysInModel: (recommendationsData: RecommendationInfo, recommendationContexts: ODataV4Context[]): void => {
		if (!recommendationsData.hasOwnProperty("keys")) {
			recommendationsData["keys"] = {};
		}
		const keysData = recommendationsData["keys"];
		recommendationContexts.forEach((context: ODataV4Context) => {
			const metaModel = context.getModel()?.getMetaModel();
			const metaPath = metaModel.getMetaPath(context?.getPath());
			const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getMetaContext(metaPath));
			const semanticKeysForGivenMetaPath = dataModel.targetEntityType.annotations.Common?.SemanticKey;
			if (semanticKeysForGivenMetaPath) {
				if (keysData && !keysData.hasOwnProperty(metaPath) && semanticKeysForGivenMetaPath) {
					keysData[metaPath] = semanticKeysForGivenMetaPath.map((i) => i.value);
				}
			}
		});
	},

	/**
	 * This function clears the old recommendations for the context.
	 * @param recommendationsData The recommendation data which is stored
	 * @param recommendationsContexts The contexts for which recommendations are being fetched
	 */
	clearRecommendationsDataFromModelForGivenContexts: (
		recommendationsData: RecommendationInfo,
		recommendationsContexts?: ODataV4Context[]
	): void => {
		if (recommendationsContexts) {
			Object.keys(recommendationsData).forEach((target) => {
				const idx = target.lastIndexOf(")");
				if (
					recommendationsContexts.find((context) => {
						return context.getPath() === target.substring(0, idx + 1);
					})
				) {
					delete recommendationsData[target];
				}
			});
		}
	},

	/**
	 * This function will enhance the recommendations according to data received from backend.
	 * @param recommendations The data received from backend
	 * @param recommendationsData The existing recommendation Model
	 */
	enhanceRecommendationModel: (
		recommendations: Array<StandardRecommendationResponse>,
		recommendationsData: Record<string, object>
	): void => {
		recommendations?.forEach((recommendation: StandardRecommendationResponse) => {
			const target = recommendation.AIRecommendedFieldPath;
			if (target) {
				// loop through all the recommendations sent from backend
				const recommendationValues: RecommendationValueType[] = [];
				let isPlaceholderValueFound = false;

				// set the other alternatives as recommendations
				recommendation._AIAltvRecmddFldVals?.forEach((alternativeRecommendation: AlternativeRecommendationResponseType) => {
					const recommendationValue: RecommendationValueType = {
						value: alternativeRecommendation.AIRecommendedFieldValue,
						probability: alternativeRecommendation.AIRecommendedFieldScoreValue
					};
					if (recommendation.AIRecommendedFieldValue === alternativeRecommendation.AIRecommendedFieldValue) {
						isPlaceholderValueFound = true;
					}

					recommendationValues.push(recommendationValue);
				});
				recommendationsData[target] = {
					value: isPlaceholderValueFound ? recommendation.AIRecommendedFieldValue : undefined,
					text: isPlaceholderValueFound ? recommendation.AIRecommendedFieldDescription : undefined,
					additionalValues: recommendationValues
				};
			}
		});
	},

	/**
	 * This function returns recommendations from standard recommendations model.
	 * @param bindingContext Binding Context of the field
	 * @param propertyPath Property path of the field
	 * @param recommendationData Object containing recommendations
	 * @returns Recommendation data for the field
	 */
	getStandardRecommendations: function (
		bindingContext: Context,
		propertyPath: string,
		recommendationData: RecommendationInfo
	): StandardRecommendationDataType | undefined {
		if (bindingContext && propertyPath) {
			const fullPath = bindingContext.getPath() + "/" + propertyPath;
			return recommendationData[fullPath] || undefined;
		}
	},
	/**
	 * Fetches the display mode for a given target path.
	 * @param targetPath
	 * @param metaModel
	 * @returns Display mode for target path
	 */
	getDisplayModeForTargetPath(targetPath: string, metaModel: ODataMetaModel): string {
		const involvedDataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath<Property>(targetPath, metaModel);
		const displayMode = involvedDataModelObject && getDisplayMode(involvedDataModelObject);
		return displayMode ? displayMode : "DescriptionValue";
	},

	/**
	 * Function which informs whether a recommendation field is null or not.
	 * @param context
	 * @param key
	 * @param propertyPath
	 * @returns boolean value based on whether a recommendation field is null or not
	 */

	isRecommendationFieldNull(context: ODataV4Context, key: string, propertyPath: string): boolean {
		const property = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath<Property>(key, context.getModel()?.getMetaModel());
		if (!context?.getProperty(propertyPath)) {
			const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(key, context?.getModel()?.getMetaModel());
			if (displayMode && displayMode !== "Value") {
				const text =
					isPathAnnotationExpression(property?.targetObject?.annotations?.Common?.Text) &&
					property?.targetObject?.annotations?.Common?.Text?.path;
				return text ? !context?.getProperty(text) : true;
			}
			return true;
		}
		return false;
	},

	updateFetchedContextPaths: function (contexts: ODataV4Context[], internalModel: JSONModel): void {
		const fetchedContextPaths: string[] = [];
		contexts?.forEach((context) => {
			const contextPath = context?.getPath();
			if (contextPath && !fetchedContextPaths.includes(contextPath)) {
				fetchedContextPaths.push(contextPath);
			}
		});

		internalModel?.setProperty("/fetchedContextPaths", fetchedContextPaths);
		internalModel.refresh();
	},

	getContextsWithNoRecommendations: function (
		contextsInfo: RecommendationContextsInfo[],
		internalModel: JSONModel
	): RecommendationContextsInfo[] {
		const fetchedContextPaths = internalModel.getProperty("/fetchedContextPaths") || [];
		const ignoredContextPaths = internalModel.getProperty("/ignoredContextPaths") || [];
		return contextsInfo.filter((contextInfo) => {
			const contextPath = (contextInfo?.context as ODataV4Context).getPath();
			return !fetchedContextPaths.includes(contextPath) && !ignoredContextPaths.includes(contextPath);
		});
	},

	resetRecommendations: function (internalModel: JSONModel): void {
		// we have version key maintained only for standard solution of recommendations
		//and only if this is standard implementation, we should reset recommendations
		const recommendationsDataInModel = internalModel.getProperty("/recommendationsData");
		if (recommendationsDataInModel && recommendationsDataInModel.hasOwnProperty("version")) {
			internalModel.setProperty("/recommendationsData", {});
			internalModel?.setProperty("/fetchedContextPaths", []);
			internalModel?.setProperty("/ignoredContextPaths", []);
			internalModel.refresh(true);
		}
	},

	getCurrentRootContext: function (): ODataV4Context | undefined {
		return rootContext;
	},

	setCurrentRootContext: function (context: ODataV4Context): void {
		rootContext = context;
	},
	/**
	 * Adds the text of ContextIdentifier else will add its value to the acceptAllParams.
	 * @param params
	 * @param viewPath Context Path of view
	 */
	addContextIdentifierText(params: AcceptAllParams, viewPath: string | undefined): void {
		for (const recommendationData of params?.recommendationData || []) {
			let index = 0;
			const identifierValues: string[] = [];
			// for recommendation fields which are directly on page, we do not want to show identifier values
			// so we exclude that calculation
			if (recommendationData.context?.getPath() !== viewPath) {
				if (recommendationData.contextIdentifier && recommendationData.context) {
					recommendationData.contextIdentifier.forEach((contextIdentifier) => {
						const idPath = `${recommendationData.context?.getPath()})/${contextIdentifier}`;
						const contextText = this.getTextForKey(recommendationData.context as ODataV4Context, idPath, contextIdentifier);
						if (contextText) {
							identifierValues.push(index === 0 ? `${contextText}` : ` ${contextText}`);
							index = index + 1;
						}
					});
				}
			}
			recommendationData.contextIdentifierText = identifierValues;
		}
	},
	/**
	 * Fetches table name based on the context.
	 * @param context
	 * @returns Table name
	 */

	getEntityName(context: ODataV4Context): CompiledBindingToolkitExpression | undefined {
		const dataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(
			context.getPath(),
			context.getModel()?.getMetaModel()
		);
		const typeName = dataModelObject?.targetEntityType?.annotations?.UI?.HeaderInfo?.TypeName;
		return typeName && compileExpression(getExpressionFromAnnotation(typeName));
	},
	/**
	 * Fetches Text for key if it exists else will return its value.
	 * @param context
	 * @param keyPath
	 * @param key
	 * @returns Text or Value for a key
	 */

	getTextForKey(context: ODataV4Context, keyPath: string, key: string): string {
		let value = "";
		const involvedDataModelObject: DataModelObjectPath<Property> | undefined =
			MetaModelConverter.getInvolvedDataModelObjectsForTargetPath<Property>(keyPath, context?.getModel()?.getMetaModel());
		const targetObject = involvedDataModelObject?.targetObject;
		const property =
			((isPathAnnotationExpression(targetObject) || isPropertyPathExpression(targetObject)) && targetObject.$target) ||
			(targetObject as Property);
		const text = getExpressionFromAnnotation(property?.annotations?.Common?.Text);
		if (text) {
			try {
				value = evaluateExpression(text, { "": context.getObject() }) as string;
				value = value ? value : context.getProperty(key);
			} catch {
				value = context.getProperty(key);
			}
		}
		return value ?? context.getProperty(key);
	}
};

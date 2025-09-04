import type { FEView } from "sap/fe/core/BaseController";
import type Context from "sap/ui/model/Context";

export type RecommendationValueType = {
	value: string | number;
	probability: number | undefined;
};

export type RecommendationDataForNavPropertyType = {
	[key: string]: PropertyIncompletenessInfoType | InternalPropertyAdditionalValue | KeyPropertiesDataType;
};

export type KeyPropertiesDataType = {
	[key: string]: string | number;
};

type PropertyIncompletenessInfoType = {
	recommendations: RecommendationValueType[];
};

export type InternalPropertyAdditionalValue = {
	additionalValues: RecommendationValueType[];
	recommendations?: RecommendationValueType[];
};

type BaseStaticIncompletenessInfo = {
	keyProperties: Record<string, unknown>;
};

type BaseDynamicIncompletenessInfoType = Record<string, PropertyIncompletenessInfoType | RecommendationDataForNavPropertyType[]>;

export type InCompletenessInfoType = BaseStaticIncompletenessInfo & BaseDynamicIncompletenessInfoType;

export const recommendationHelper = {
	/**
	 * This function will take recommendation data for a field and sort it in descending order based on probability of the value.
	 * @param incompletenessInfo The set of recommended data for a field
	 */
	sortRecommendationsData(incompletenessInfo: PropertyIncompletenessInfoType): void {
		const recommendationDataSorted: RecommendationValueType[] = incompletenessInfo.recommendations;
		recommendationDataSorted.sort((param1: RecommendationValueType, param2: RecommendationValueType) => {
			if (param1.probability && param2.probability) {
				if (param1.probability < param2.probability) {
					return 1;
				} else if (param1.probability > param2.probability) {
					return -1;
				}
			}
			return 0;
		});

		const info: InternalPropertyAdditionalValue | PropertyIncompletenessInfoType =
			incompletenessInfo as InternalPropertyAdditionalValue;
		delete info.recommendations;
		info.additionalValues = recommendationDataSorted;
	},

	// The incompletenessinfo can be either for direct fields or fields through navigation property.
	// If the property is from the 1:n navigation then the information will be in the form of array of objects, where each object will be data
	// for a specific context in 1:n. The format of data for each object would be similar to that of fields at first level.
	// This may be the scenario for multiple levels i.e. 1:n navigation data inside another 1:n navigation and so on.
	// As we do not know the definite number of levels we use recursion to update data for all properties(for navigation properties as well, the data will
	// be nested but will follow same structure for each field info).
	// For reference of how data will look like, check CustomAction.js -> function setCustomRecommendation
	/**
	 * This function will go through entire recommendation data for both direct fields and fields from navigation property and for each field update the recommendation info in descending order.
	 * As with our use case we want recommendations that are in the order of probability for given value.
	 * @param data Incompleteness info data
	 */
	transformRecommendationsForInternalStorage(data: InCompletenessInfoType | PropertyIncompletenessInfoType): void {
		if (data.hasOwnProperty("recommendations")) {
			this.sortRecommendationsData(data as PropertyIncompletenessInfoType);
			return;
		} else if (Array.isArray(data)) {
			// we expect the data in array format for fields from 1:n navigation paths
			(data as RecommendationDataForNavPropertyType[]).forEach((dataObj: RecommendationDataForNavPropertyType) => {
				// for each entry in 1:n navigation we update the 'recommendations' object to sort in descending order of proability
				Object.values(dataObj).forEach(
					(valObj: PropertyIncompletenessInfoType | InternalPropertyAdditionalValue | KeyPropertiesDataType) => {
						if (typeof valObj === "object") {
							this.transformRecommendationsForInternalStorage(valObj as PropertyIncompletenessInfoType);
						}
					}
				);
			});
		} else {
			// for direct fields we check for the data value against the given Field and sort its recommendation data
			// from the given information
			Object.values(data).forEach((valObj: PropertyIncompletenessInfoType) => {
				if (typeof valObj === "object") {
					this.transformRecommendationsForInternalStorage(valObj);
				}
			});
		}
	},

	/**
	 * This function check if we are in create mode, then explicity empty recommendations data from model.
	 * Else if we are same page as before and after some actions then do not empty recommendations data.
	 * @param view
	 * @param inputBindingContext Context
	 */
	clearRecommendations: (view: FEView, inputBindingContext?: Context): void => {
		const internalModel = view.getModel("internal");
		const currentContext = internalModel.getProperty("/currentCtxt") as Context | undefined;
		const createMode = view.getBindingContext("pageInternal")?.getProperty("createMode") as boolean | undefined;
		if (currentContext?.getPath() !== inputBindingContext?.getPath() || createMode === true) {
			internalModel.setProperty("/recommendationsData", {});
		}
	}
};

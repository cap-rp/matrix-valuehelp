import Log from "sap/base/Log";
import type {
	InCompletenessInfoType,
	InternalPropertyAdditionalValue,
	KeyPropertiesDataType,
	RecommendationDataForNavPropertyType,
	RecommendationValueType
} from "sap/fe/core/helpers/RecommendationHelper";
import type { RecommendationInfo, StandardRecommendationDataType } from "sap/fe/core/helpers/StandardRecommendationHelper";
import { standardRecommendationHelper } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type { FieldDataType } from "sap/fe/core/services/ValueHelpHistoryServiceFactory";
import type { SorterType, ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type UI5Event from "sap/ui/base/Event";
import type EventProvider from "sap/ui/base/EventProvider";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import Library from "sap/ui/core/Lib";
import type Field from "sap/ui/mdc/Field";
import type FilterField from "sap/ui/mdc/FilterField";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type MTable from "sap/ui/mdc/valuehelp/content/MTable";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterType from "sap/ui/model/FilterType";
import Sorter from "sap/ui/model/Sorter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type { ContextErrorType } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

enum AdditionalValueGroupKey {
	recommendation = "recommendation",
	recentValue = "recentValue",
	other = "other"
}
export type AdditionalValueType = {
	propertyPath: string;
	values: (string | number | boolean)[];
	groupKey: AdditionalValueGroupKey; // unique identifier for the group
};
export type BindingInfoParameters = {
	$select: string[];
	$expand?: string[];
	$search: string;
	$count: boolean;
};

export type AdditionValueDefinition =
	| InCompletenessInfoType
	| RecommendationDataForNavPropertyType[]
	| InternalPropertyAdditionalValue
	| object;
const additionalValueHelper = {
	/**
	 * This function is responsible to create context based on additional value filters and custom sorter and request contexts from it.
	 * @param additionalValues Array of additional values
	 * @param valueHelpListBinding List binding
	 * @param valueHelpBindingInfo The binding info object to be used to bind the list to the model
	 * @param payload Payload of the value help
	 * @param sorters Sorters of the value help list binding
	 * @param field	Field for which the value help is requested
	 * @returns Additional value contexts
	 */
	requestForAdditionalValueContextData: async function (
		additionalValues: AdditionalValueType[],
		valueHelpListBinding: ODataListBinding,
		valueHelpBindingInfo: BaseAggregationBindingInfo,
		payload: ValueHelpPayload,
		sorters: SorterType[],
		field: FilterField | MultiValueField | Field
	): Promise<{
		recommendationValuesContextData: FieldDataType[];
		othersValuesContextData: FieldDataType[];
	}> {
		let allListBinding: ODataListBinding | undefined;
		const additionalValueContextPromise: Promise<V4Context[]>[] = [];
		// reverse the array so that while creating transient context first additional value is grouped first
		const reverseRecommendationValues = [
			...additionalValues.filter((value) => value.groupKey === AdditionalValueGroupKey.recommendation)
		].reverse();

		// logic to add $select for multi-level navigation properties as filling $select is sufficient for the model to create the expand calls
		(valueHelpBindingInfo.parameters as BindingInfoParameters).$select =
			payload.qualifiers[payload.valueHelpQualifier].vhProperties ?? [];

		// check if there is any input in the field
		// This information is used to determine to show the "others" section or not
		// and also to determine if typeAhead should open or not
		const searchTerm = (valueHelpBindingInfo.parameters as BindingInfoParameters).$search;
		(valueHelpBindingInfo.parameters as BindingInfoParameters).$search = searchTerm;
		if (payload.isValueListWithFixedValues) {
			(valueHelpBindingInfo.parameters as BindingInfoParameters).$count = true;
		}
		const listSorters: Sorter[] = [];
		sorters.forEach((sorter: SorterType) => listSorters.push(new Sorter(sorter.name ?? "", sorter.descending)));
		const valueHelpListModel: ODataModel = valueHelpListBinding.getModel() as ODataModel;
		// get the list binding for recommendation values and others values
		const additionalValueListBindings: ODataListBinding[] = this.getAdditionalValueContextBindings(
			reverseRecommendationValues,
			searchTerm,
			payload,
			valueHelpListModel,
			valueHelpBindingInfo,
			listSorters
		);
		if (additionalValueListBindings.length > 0) {
			if (additionalValueListBindings.length === 2) {
				additionalValueContextPromise.push(additionalValueListBindings[0].requestContexts(0, 10, "additionalValue"));
				allListBinding = additionalValueListBindings[1];
			} else {
				allListBinding = additionalValueListBindings[0];
			}
			// in case of dropdown, we fetch first 100 records on first load and then make subsequent requests upon user's scroll.
			additionalValueContextPromise.push(
				allListBinding.requestContexts(0, payload.isValueListWithFixedValues ? 100 : 10, "additionalValue")
			);
		}
		await valueHelpListModel.submitBatch("additionalValue");
		const additionalValuesContext = await Promise.all(additionalValueContextPromise);
		// we store this list bindings in order to be able to make subsequent requests on user's scroll
		const count = allListBinding?.getCount();
		if (count && count > 100) {
			field.getBindingContext("internal")?.setProperty("allListBinding", allListBinding);
		}
		let recommendationContexts: V4Context[] = [],
			allContexts: V4Context[] = [];
		if (reverseRecommendationValues.length > 0) {
			recommendationContexts = additionalValuesContext[0];
			if (searchTerm || payload.isValueListWithFixedValues) {
				allContexts = additionalValuesContext[1];
			}
		} else if (searchTerm || payload.isValueListWithFixedValues) {
			allContexts = additionalValuesContext[0];
		}

		const recommendationValuesContextData = recommendationContexts.map((context) => context.getObject() as FieldDataType);
		const othersValuesContextData: FieldDataType[] = allContexts.map((context) => context.getObject() as FieldDataType);

		return {
			recommendationValuesContextData,
			othersValuesContextData
		};
	},
	/**
	 * Method to retrieve all relevant list bindings (recommendation and others) that is needed to make a backend call.
	 * @param reverseRecommendationValues Reversed recommendation values
	 * @param searchTerm Search term entered by the user
	 * @param payload Payload of the value help
	 * @param valueHelpListModel Model of the value help
	 * @param valueHelpBindingInfo Binding info of the value help
	 * @param sorter Custom sorter which needs to be applied to the list binding
	 * @returns All the list binding which would be used to trigger calls to the backend.
	 */
	getAdditionalValueContextBindings: function (
		reverseRecommendationValues: AdditionalValueType[],
		searchTerm: string,
		payload: ValueHelpPayload,
		valueHelpListModel: ODataModel,
		valueHelpBindingInfo: BaseAggregationBindingInfo,
		sorter: Sorter[]
	): ODataListBinding[] {
		const additionalValueContextBindings: ODataListBinding[] = [];
		const valueHelpFilters: Filter[] = [...this.getValueHelpBindingFilters(valueHelpBindingInfo)];
		const recommendationValueFilters = this.getAdditionalValueFilters(reverseRecommendationValues, [...valueHelpFilters]);

		if (reverseRecommendationValues.length > 0) {
			// binding represent recommendation list binding.
			additionalValueContextBindings.push(
				valueHelpListModel.bindList(
					valueHelpBindingInfo.path,
					undefined,
					undefined,
					recommendationValueFilters,
					valueHelpBindingInfo.parameters
				)
			);
		}
		if (searchTerm || payload.isValueListWithFixedValues) {
			// binding represent all data list bindings.
			additionalValueContextBindings.push(
				valueHelpListModel.bindList(valueHelpBindingInfo.path, undefined, sorter, valueHelpFilters, valueHelpBindingInfo.parameters)
			);
		}

		return additionalValueContextBindings;
	},
	/**
	 * This function is responsible to fetch the valuehelp binding filters.
	 * @param valueHelpBindingInfo The binding info object to be used to bind the list to the model
	 * @returns Filters of valuehelp binding
	 */
	getValueHelpBindingFilters: function (valueHelpBindingInfo: BaseAggregationBindingInfo): Filter[] {
		// get all existing filters from the binding info
		// this + additional value filters will be used later on to fetch additional values from the backend
		if (valueHelpBindingInfo.filters) {
			if (Array.isArray(valueHelpBindingInfo.filters)) {
				return valueHelpBindingInfo.filters;
			} else {
				return [valueHelpBindingInfo.filters];
			}
		}
		return [];
	},
	/**
	 * This function resumes the suspended list binding and then resets changes on it.
	 * @param valueHelpListBinding List binding
	 */
	resumeValueListBindingAndResetChanges: async function (valueHelpListBinding: ODataListBinding): Promise<void> {
		if (valueHelpListBinding.isSuspended()) {
			await valueHelpListBinding.resumeAsync();
		}
		// get rid of existing transient contexts.

		// destroying causes issues sometimes, contexts are not always available to destroy but appear afterwards magically
		try {
			await valueHelpListBinding.resetChanges();
		} catch (error: unknown) {
			//We do not do anything here as we know the model will always throw an error and this will fill up the console with errors.
		}
	},
	/**
	 * This function is used for sorting and filtering the list binding.
	 * @param valueHelpListBinding List Binding
	 * @param sorters Sorters of the value help list binding
	 */
	sortAndFilterListBinding: function (valueHelpListBinding: ODataListBinding, sorters: SorterType[]): void {
		// In order to not show the list at all, we pass an empty filter which would render an empty list
		valueHelpListBinding.filter(Filter.NONE, FilterType.Application);

		if (sorters.length) {
			const modifiedSorters: Sorter[] = [];
			sorters.forEach((sorter: SorterType) =>
				modifiedSorters.push(new Sorter(sorter.name ?? "", sorter.descending, this.getSorterFunction))
			);
			valueHelpListBinding.sort(modifiedSorters);
		} else valueHelpListBinding.sort(new Sorter("", false, this.getSorterFunction));
	},
	/**
	 * This functions creates the filters for additional values.
	 * @param reverseAdditionalValues Array of additional values in reverse order
	 * @param filters Existing valuehelp binding filters
	 * @returns Additional value filters
	 */
	getAdditionalValueFilters: function (reverseAdditionalValues: AdditionalValueType[], filters: Filter[]): Filter[] {
		reverseAdditionalValues.forEach((additionalValue) => {
			if (additionalValue.values.length > 0) {
				const values = additionalValue.values;
				const propertyPath = additionalValue.propertyPath;
				// add additional value filters to existing filters from the binding info
				values.forEach((value) => {
					// update the value help binding info to get additional values from the backend
					filters.push(
						new Filter({
							path: propertyPath,
							value1: value,
							operator: "EQ"
						})
					);
				});
			}
		});
		return filters;
	},
	/**
	 * This function is a callback to the custom sorter.
	 * @param context Context of the Field
	 * @returns Group key that can be used for sorting
	 */
	getSorterFunction: function (context: V4Context): string {
		//eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const resourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
		//get the client side annotation to figure out the group key
		const groupKey = context.getProperty("@$fe.additionalValueGroupKey") as AdditionalValueGroupKey;
		if (groupKey === AdditionalValueGroupKey.recommendation) {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_RECOMMENDATIONS");
		} else if (groupKey === AdditionalValueGroupKey.recentValue) {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_RECENTVALUE");
		} else {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_OTHERS");
		}
	},
	/**
	 * Method to create transient contexts of the value help list binding for the given different types additional value context data.
	 * @param recommendationValuesContextData Recommendation values context data
	 * @param recentValuesContextData Recent values context data
	 * @param othersValuesContextData Other values context data
	 * @param valueHelpListBinding List binding
	 */
	createTransientContextsForAdditionalValueContextData: function (
		recommendationValuesContextData: FieldDataType[],
		recentValuesContextData: FieldDataType[],
		othersValuesContextData: FieldDataType[],
		valueHelpListBinding: ODataListBinding
	): void {
		this.createGroupedTransientContexts(othersValuesContextData, valueHelpListBinding, AdditionalValueGroupKey.other);
		this.createGroupedTransientContexts(recentValuesContextData, valueHelpListBinding, AdditionalValueGroupKey.recentValue);
		this.createGroupedTransientContexts(recommendationValuesContextData, valueHelpListBinding, AdditionalValueGroupKey.recommendation);
	},
	/**
	 * Method to create transient context for the given additional value context data. It also adds a key for each context which is used to group the newly created transient contexts accordingly.
	 * @param additionalValueContextData Additional value context data
	 * @param valueHelpListBinding List binding
	 * @param groupKey Key which indicates the group of the additional value context data
	 */
	createGroupedTransientContexts: function (
		additionalValueContextData: FieldDataType[],
		valueHelpListBinding: ODataListBinding,
		groupKey: AdditionalValueGroupKey
	): void {
		// reverse of the context data is required so that the context which needs to be shown below in the list gets created first
		[...additionalValueContextData].reverse().forEach(async (contextData: FieldDataType) => {
			// groupKey is added in order to properly group the transient contexts amongst all 3 groups
			contextData["@$fe.additionalValueGroupKey"] = groupKey;
			const context = valueHelpListBinding.create(contextData);
			try {
				await context.created();
			} catch (error) {
				// For transient contexts the canceled is set to true and for other cases it will be false. Atleast in recommendations
				// use case we do not face the scenario where canceled is set to false. For now we are just logging the error.
				if (!(error as ContextErrorType).canceled) {
					Log.error((error as ContextErrorType).name);
				}
			}
		});
	},
	/**
	 * This functions returns the relevant recommendations for the valuelist.
	 * @param data Object containing recommendation model data
	 * @param bindingContext Binding context of the Field
	 * @param propertyPath Property Path of the Field
	 * @param bindingPath
	 * @returns Relevant recommendations for the valuelist
	 */
	getRelevantRecommendations: function (
		data: InCompletenessInfoType | object,
		bindingContext: V4Context,
		propertyPath: string,
		bindingPath?: string
	): Array<string | number> | null | undefined {
		const values: Array<string | number> = [];
		let relevantRecommendations: InternalPropertyAdditionalValue | undefined;
		if (Object.keys(data).length > 0) {
			//get the right property path by eliminating the starting / and also main entityset name
			propertyPath = this.getRecommendationPropertyPath(propertyPath);
			if ((data as RecommendationInfo).version === 2.0 && bindingPath) {
				propertyPath = bindingPath;
			}
			//get the recommendations based on property path and binding context passed
			relevantRecommendations = this.getAdditionalValueFromPropertyPath(propertyPath, bindingContext, data) as
				| InternalPropertyAdditionalValue
				| undefined;
			//if we get recommendations then push the values
			if (relevantRecommendations && Object.keys(relevantRecommendations).length > 0) {
				relevantRecommendations.additionalValues.forEach((valueData: RecommendationValueType) => {
					values.push(valueData.value);
				});
				return values;
			} else {
				//if recommendations are not found then return null
				return null;
			}
		}
	},

	_checkForKeysInRecommendations: function (keyProperties: KeyPropertiesDataType, contextData: Record<string, string>): boolean {
		for (const key in keyProperties) {
			if (keyProperties[key] !== contextData[key]) {
				return false;
			}
		}
		return true;
	},
	/**
	 * This function is responsible to fetch the exact object from an array of objects that contains relevant recommendationData based on keys.
	 * @param recommendationData Array containing additional values
	 * @param bindingContext Binding context of the Field
	 * @returns Relevant object from an array of object that contains the additional value
	 */
	getAdditionalValueFromKeys: function (
		recommendationData: AdditionValueDefinition,
		bindingContext?: V4Context | Context
	): AdditionValueDefinition {
		const contextData = bindingContext?.getObject() as Record<string, string> | undefined;
		let result: AdditionValueDefinition = {};
		//loop through the recommendationData and check if the keyProperties match with the binding context data
		if (bindingContext && contextData) {
			if (Array.isArray(recommendationData)) {
				(recommendationData as RecommendationDataForNavPropertyType[]).forEach((recData) => {
					const keyProperties = recData.keyProperties as KeyPropertiesDataType;
					const allKeysMatch = this._checkForKeysInRecommendations(keyProperties, contextData);
					//if every key value matches with the binding context data then assign it to result which will be returned
					if (allKeysMatch) {
						result = recData as AdditionValueDefinition;
					}
				});
			}
		}
		return result;
	},

	_getRecommendation: function (
		propertyPath: string,
		bindingContext: Context,
		recommendationData: AdditionValueDefinition
	): AdditionValueDefinition {
		//create a copy of the recommendationData to store its previous value as it will change because of the recursive approach
		let oldData = Object.assign(recommendationData, {});
		//check if property path exists on the recommendationData object and if so then return the object pointing to the property path
		if (Object.keys(recommendationData).includes(propertyPath)) {
			return (recommendationData as InCompletenessInfoType)[propertyPath] as AdditionValueDefinition;
		} else {
			//if property path is not present then check if it is 1:n mapping and we need to do a recursive approach to land on the exact object containing the relevant recommendations
			//continue the while loop till the property path is found in the previous recommendationData
			while (Object.keys(oldData).length > 0 && !Object.keys(oldData).includes(propertyPath)) {
				// as it might be 1:n mapping so first seperate the navprop name and actual prop name to make sure we find the navprop first and then from its pointing object we find the property path
				//eg: _Item/Material will be first divided into _Item and we search for it and then from its relevant object we search for Material
				const propertyPaths = propertyPath.split("/");
				if (propertyPaths.length > 1) {
					//getting the navprop path
					const navPropPath = propertyPaths[0];
					//removing the navprop path from propertypaths so that we only check for actual property path
					propertyPaths.splice(0, 1);
					propertyPath = propertyPaths.join("/");
					//using getAdditionalValueFromPropertyPath and passing navPropPath we get the exact array of objects pointing to the navProp
					recommendationData = this.getAdditionalValueFromPropertyPath(
						navPropPath,
						bindingContext,
						recommendationData
					) as RecommendationDataForNavPropertyType[];
					//no pass the array of objects of navProp to getAdditionalValueFromKeys and get the exact object that contains the recommendationData based on keys
					recommendationData = this.getAdditionalValueFromKeys(recommendationData, bindingContext);
					if (Object.keys(recommendationData).length > 0) {
						//set the recommendationData to oldData before assigning the new value to it
						oldData = Object.assign(recommendationData, {});
						//here we check for the actual property path from the object we found from getAdditionalValueFromKeys
						//eg: Material can be found in the object which is part of array of objects of _Item
						recommendationData = this.getAdditionalValueFromPropertyPath(
							propertyPath,
							bindingContext,
							recommendationData
						) as AdditionValueDefinition;
					} else {
						return {};
					}
				} else {
					return {};
				}
			}
			return recommendationData;
		}
	},

	/**
	 * This function is responsible for getting the additional value based on property path and binding context passed.
	 * @param propertyPath Property path of the field
	 * @param bindingContext Binding context of the field
	 * @param recommendationData Object containing additional value
	 * @returns Additional value based on property path and binding context passed
	 */
	getAdditionalValueFromPropertyPath: function (
		propertyPath: string,
		bindingContext: V4Context | Context,
		recommendationData?: AdditionValueDefinition | RecommendationInfo
	): AdditionValueDefinition | StandardRecommendationDataType | undefined {
		if ((recommendationData as RecommendationInfo).version === 2) {
			return standardRecommendationHelper.getStandardRecommendations(
				bindingContext,
				propertyPath,
				recommendationData as RecommendationInfo
			);
		}
		if (recommendationData) {
			return this._getRecommendation(propertyPath, bindingContext, recommendationData);
		}
	},
	/**
	 * This function returns the property path of the field by removing the leading '/' and main entity set name.
	 * @param propertyPath Property Path of the Field
	 * @returns Property path of the field by removing the leading '/' and main entity set name.
	 */
	getRecommendationPropertyPath: function (propertyPath: string): string {
		//First we split the property path based on /
		const propertyPaths = propertyPath.split("/");
		//Now remove the first two elements of the array. As first element will always be '' and second element will be main entity set name
		propertyPaths.splice(0, 2);
		//Now join the remaining elements to create a new property path and return it
		return propertyPaths.join("/");
	},
	/**
	 * Method to filter Others values context data and remove values which are also present in Recently Used and Recommendation group.
	 * @param recommendationValuesContextData Recommendation values context data
	 * @param recentValuesContextData Recent values context data
	 * @param othersValuesContextData Others values context data
	 * @param valueHelpKeys ValueListProperty of the payload
	 * @returns Others values context data.
	 */
	getRelevantOthersValuesContextData: function (
		recommendationValuesContextData: FieldDataType[],
		recentValuesContextData: FieldDataType[],
		othersValuesContextData: FieldDataType[],
		valueHelpKeys: string[]
	): FieldDataType[] {
		return othersValuesContextData.filter(
			(contextData) =>
				!this.checkValuesMatch(contextData, recommendationValuesContextData, valueHelpKeys) &&
				!this.checkValuesMatch(contextData, recentValuesContextData, valueHelpKeys)
		);
	},
	/**
	 * Method to check whether recent values matches either with the search term or with the others values.
	 * @param othersValuesContextData Others values context data
	 * @param recentValuesContextData Recent values context data
	 * @param valueHelpKeys ValueListProperty of the payload
	 * @param searchTerm Search term entered by the user
	 * @param bindingInfo Binding info object of the value help
	 * @returns Recent values context data which needs to be show in the Recently Used group in the type ahead suggestion list.
	 */
	getRelevantRecentValuesContextData: function (
		othersValuesContextData: FieldDataType[],
		recentValuesContextData: FieldDataType[],
		valueHelpKeys: string[],
		searchTerm: string,
		bindingInfo: BaseAggregationBindingInfo
	): FieldDataType[] {
		// filter out recent value based on existing value help filters
		const recentValuesModel = new JSONModel({ recentValuesContextData });
		const recentValuesList = recentValuesModel.bindList(
			"/recentValuesContextData",
			undefined,
			undefined,
			this.getValueHelpBindingFilters(bindingInfo)
		);
		recentValuesContextData = recentValuesList.getAllCurrentContexts().map((context) => context.getObject() as FieldDataType);

		// consider only those recent values which either matches with the search term or with the response received from backend for the Others group.
		// Both the filters needs to be applied so that so that order of the recent values does not change, which is important for the order in which
		// the data would be shown in the type ahead suggestion list.
		return recentValuesContextData.filter((recentValueContextData) =>
			this.filterRecentValuesContextData(recentValueContextData, searchTerm, valueHelpKeys, othersValuesContextData)
		);
	},
	/**
	 * Method to check whether the given recent value context data matches with the given search term or the others values.
	 * @param recentValueContextData Recent values context data
	 * @param searchTerm Search term entered by the user
	 * @param valueHelpKeys ValueListProperty of the payload
	 * @param othersValuesContextData Others values context data
	 * @returns True if the given recent value context satisfies the filter condition.
	 */
	filterRecentValuesContextData: function (
		recentValueContextData: FieldDataType,
		searchTerm: string,
		valueHelpKeys: string[],
		othersValuesContextData: FieldDataType[]
	): boolean {
		for (const key in recentValueContextData) {
			if (typeof recentValueContextData[key] === "object") {
				if (
					this.filterRecentValuesContextData(
						recentValueContextData[key] as FieldDataType,
						searchTerm,
						valueHelpKeys,
						othersValuesContextData
					)
				) {
					return true;
				}
			} else if (typeof recentValueContextData[key] === "string") {
				if (
					(!searchTerm && othersValuesContextData.length === 0) || // Case where focus is just set to the value help field
					(recentValueContextData[key] as string).includes(searchTerm) ||
					(valueHelpKeys.includes(key) && this.checkValuesMatch(recentValueContextData, othersValuesContextData, valueHelpKeys))
				) {
					return true;
				}
			}
		}
		return false;
	},
	/**
	 * Checks if the values of specified keys in contextDataToBeMatched match with any object in contextDataList.
	 * @param contextDataToBeMatched The context data object to compare
	 * @param contextDataList The array of context data objects to compare against
	 * @param valueHelpKeys The keys to compare from contextDataToBeMatched with contextDataList objects
	 * @returns Returns true if any object in contextDataList matches the values of the specified keys in contextDataToBeMatched, otherwise false.
	 */
	checkValuesMatch: function (contextDataToBeMatched: FieldDataType, contextDataList: FieldDataType[], valueHelpKeys: string[]): boolean {
		for (const obj of contextDataList) {
			let match = true;
			for (const key of valueHelpKeys) {
				// Check if the value of the key in recentValuesContextData
				// matches the value of the key in the current object from othersValuesContextData
				if (contextDataToBeMatched[key] !== obj[key]) {
					match = false;
					break;
				}
			}
			if (match) {
				return true;
			}
		}

		return false;
	},
	/**
	 * Method to rearrange the given additional value context data as per the chronological order of the given additional values.
	 * This is to ensure that the recommendation data fetched from backend are shown in the same order of recommendation values fetched from recommendation service.
	 * @param recommendationValuesContextData Recommendation values context data
	 * @param recommendationValues Recommendation values
	 * @param valueListProperty Value list property of the value help
	 * @returns Recommendation values context data in the correct order.
	 */
	getRelevantRecommendationValuesContextData: function (
		recommendationValuesContextData: FieldDataType[],
		recommendationValues: (string | number | boolean)[] = [],
		valueListProperty: string
	): FieldDataType[] {
		const relevantRecommendationValuesContextData: FieldDataType[] = [];
		recommendationValues.forEach((value) => {
			const foundObject = recommendationValuesContextData.find((contextData) => contextData[valueListProperty] === value);
			if (foundObject) {
				relevantRecommendationValuesContextData.push(foundObject);
			}
		});

		return relevantRecommendationValuesContextData;
	},
	/**
	 * Method to make batch calls to support pagination.
	 * This is to ensure that the additional data fetched from the backend is displayed in the correct order.
	 * @param event An event object that consists of an ID, source, and a parameter map.
	 */
	updateFinished: async function name(event: UI5Event): Promise<void> {
		const source = event.getSource() as { source?: EventProvider } as MTable;
		const tableBindingContext: Context | undefined | null = source.getBindingContext("internal"),
			allListBinding = tableBindingContext?.getProperty("allListBinding") as ODataListBinding | undefined;
		const { actual, total, reason } = event.getParameters() as { actual: number; total: number; reason: string };
		// as user scrolls down and once we reach end of the list, we fetch the next set of data from the backend
		if (allListBinding && reason === "Growing" && actual === total) {
			const paginationData = await allListBinding.requestContexts(total, 100),
				additionalData = paginationData.map((data: V4Context) => data.getObject() as FieldDataType);
			additionalData.forEach(async (contextData: FieldDataType) => {
				const context = (source.getBinding("items") as ODataListBinding).create(contextData, undefined, true);
				try {
					await context.created();
				} catch (error) {
					if (error) {
						Log.error((error as ContextErrorType).name);
					}
				}
			});
		}
	}
};
export { AdditionalValueGroupKey, RecommendationValueType, additionalValueHelper };

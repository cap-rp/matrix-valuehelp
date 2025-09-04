import type { Property } from "@sap-ux/vocabularies-types";
import { EDM_TYPE_MAPPING } from "sap/fe/base/BindingToolkit";
import type {
	FilterFieldManifestConfiguration,
	FilterManifestConfiguration,
	FilterSettings
} from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { ODATA_TYPE_MAPPING } from "sap/fe/core/templating/DisplayModeFormatter";
import CommonHelper from "sap/fe/macros/CommonHelper";
import { maxConditions } from "sap/fe/macros/filter/FilterFieldHelper";
import { getConditions } from "sap/fe/macros/filterBar/FilterHelper";
import type { ControlPropertyInfo } from "sap/fe/macros/mdc/adapter/StateHelper";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type { SelectOption, SemanticDateConfiguration } from "sap/fe/navigation/SelectionVariant";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import type { StateToApply, Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import FilterUtil from "sap/ui/mdc/util/FilterUtil";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
export type FilterFieldsConfig = Record<string, FilterFieldManifestConfiguration>;

export type ConversionInfo = {
	metaModel: ODataMetaModel;
	contextPath: string;
	useSemanticDateRange?: boolean;
	filterFieldsConfig?: FilterFieldsConfig;
	selectionFieldsConfigs?: FilterManifestConfiguration;
	navigationProperties?: string[];
	showClearButton?: boolean;
};

type PropertyConversionInfo = {
	propertyName: string;
	navPath: string;
	propertyMetadata: ControlPropertyInfo;
	propertyContextPath: string;
	selectionVariant: SelectionVariant;
	controlInfo: ConversionInfo;
};

const IGNORED_PROPERTYNAMES: string[] = ["$search", "$editState"];

function getPropertyObjectPath(filteredPropertyPath: string, metaModel: ODataMetaModel): Property | undefined {
	const metaContext = metaModel.createBindingContext(filteredPropertyPath);
	return metaContext !== null ? (getInvolvedDataModelObjects(metaContext).targetObject as Property) : undefined;
}

/**
 * Function to add the description of a code in a filter (to avoid fetching it with a query).
 * @param filter The filter to update
 * @param propertyObjectPath Property object path
 * @param selectionVariant The whole selection variant where we look for the description
 */
function prefillDescriptionInFilter(filter: ConditionObject[], propertyObjectPath: Property, selectionVariant: SelectionVariant): void {
	if (filter.length !== 1 || filter[0].operator !== "EQ") {
		// We search for text properties only for single-value filters
		return;
	}

	const textProperty = propertyObjectPath.annotations.Common?.Text;
	if (textProperty && isPathAnnotationExpression(textProperty)) {
		// Search for the Text value in the selection variant definition
		const selectOnText = selectionVariant.getSelectOption(textProperty.path);
		if (selectOnText?.length === 1 && selectOnText[0].Option === "EQ" && selectOnText[0].Sign === "I") {
			// Adding a second value in the condition will be interpreted as the Text value by the field
			// In case this value is empty, we use " "
			filter[0].values.push(selectOnText[0].Low.length >= 1 ? selectOnText[0].Low : " ");
		}
	}
	if (
		filter[0].values.length === 1 &&
		filter[0].values[0] === "" &&
		propertyObjectPath.annotations.Common?.ValueListWithFixedValues?.valueOf() !== true
	) {
		// Special case: an empty property value was provided in the selection variant, and the VH is not with fixed values
		// --> we use a default string for the description (empty string doesn't work)
		filter[0].values.push(" ");
	}
}

const selectionVariantToStateFilters = {
	/**
	 * Get conditions from the selection variant.
	 * @param selectionVariant Selection variant
	 * @param controlInfoForConversion Control information needed for the conversion of the selection variant to conditions
	 * @param controlPropertyInfos Property information of the filterbar
	 * @param prefillDescriptions
	 * @param metaModel
	 * @returns Conditions after conversion of selection variant
	 */
	getStateFiltersFromSV: function (
		selectionVariant: SelectionVariant,
		controlInfoForConversion: ConversionInfo,
		controlPropertyInfos: ControlPropertyInfo[],
		prefillDescriptions: boolean,
		metaModel: ODataMetaModel
	): StateUtilFilter {
		const { contextPath } = controlInfoForConversion;
		const conditions: StateUtilFilter = {};

		controlPropertyInfos.forEach(function (propertyMetadata: ControlPropertyInfo) {
			if (!IGNORED_PROPERTYNAMES.includes(propertyMetadata.name)) {
				let filterPathConditions: ConditionObject[] = [];
				const { conditionPath, annotationPath } = propertyMetadata;
				const propPath = conditionPath.replaceAll("*", "");
				const navPath = propPath.substring(0, propPath.lastIndexOf("/"));
				const propertyName = propPath.substring(propPath.lastIndexOf("/") + 1);

				// Note: Conversion parameters
				const propertyConversionInfo: PropertyConversionInfo = {
					propertyName,
					navPath,
					propertyContextPath: `${contextPath}${navPath ? navPath + "/" : ""}`,
					propertyMetadata,
					selectionVariant,
					controlInfo: controlInfoForConversion
				};
				if (propertyMetadata.isParameter && annotationPath) {
					// parameter
					propertyConversionInfo.propertyContextPath = annotationPath.substring(0, annotationPath.lastIndexOf("/") + 1);
					filterPathConditions = selectionVariantToStateFilters._getConditionsForParameter(propertyConversionInfo);
				} else if (conditionPath.includes("/")) {
					// navigation property
					filterPathConditions = selectionVariantToStateFilters._getConditionsForNavProperty(propertyConversionInfo);
				} else {
					// normal property
					filterPathConditions = selectionVariantToStateFilters._getConditionsForProperty(propertyConversionInfo);
				}

				if (filterPathConditions.length > 0) {
					const propertyObjectPath = getPropertyObjectPath(annotationPath, metaModel);
					if (propertyObjectPath) {
						if (propertyObjectPath.annotations.Common?.ValueListWithFixedValues) {
							// In case of fixed values, we would convert Empty operator to EQ->''.
							filterPathConditions.forEach(selectionVariantToStateFilters._adjustValueListWithFixedValuesCondition);
						}
						if (prefillDescriptions) {
							prefillDescriptionInFilter(filterPathConditions, propertyObjectPath, selectionVariant);
						}
					}
					conditions[conditionPath] = filterPathConditions;
				}
			}
		});

		return conditions;
	},

	/**
	 * Method returns filters and filterfield items to apply and add. Also checks whether the property is configured with hiddenFilter.
	 * @param propertyInfos Property information of the control
	 * @param conditions Condtions to apply as filters to the control
	 * @returns The object containing filters and items.
	 */
	getStateToApply: (propertyInfos: ControlPropertyInfo[], conditions: StateUtilFilter): StateToApply => {
		const items: Record<"name", string>[] = Object.keys(conditions).reduce(
			(cummulativeItems, path) => {
				const propertyInfo = FilterUtil.getPropertyByKey(propertyInfos, path) as ControlPropertyInfo;
				if (propertyInfo.hiddenFilter === undefined || !propertyInfo.hiddenFilter) {
					cummulativeItems.push({
						name: path
					});
				}
				return cummulativeItems;
			},
			[] as Record<"name", string>[]
		);
		return {
			filter: conditions,
			items: items
		};
	},

	/**
	 * Get the filter field configuration of a property.
	 * @param property Filter field Path
	 * @param filterFieldsConfig Manifest Configuration of the control
	 * @returns The Filter Field Configuration
	 */
	_getPropertyFilterConfigurationSetting: function (property: string, filterFieldsConfig?: FilterFieldsConfig): FilterSettings {
		return filterFieldsConfig?.[property]?.settings ?? {};
	},

	/**
	 * Create filter conditions for a parameter property.
	 * @param propertyConversionInfo Property info used for conversion
	 * @returns The filter condtions for parameter property
	 */
	_getConditionsForParameter: function (propertyConversionInfo: PropertyConversionInfo): ConditionObject[] {
		let conditionObjects: ConditionObject[] = [];
		const { propertyMetadata, selectionVariant } = propertyConversionInfo;
		const conditionPath = propertyMetadata.name;
		const selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, conditionPath, true);
		if (selectOptionName) {
			conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, true);
		}
		return conditionObjects;
	},

	/**
	 * Create filter conditions for a normal property.
	 * @param propertyConversionInfo Property info used for conversion
	 * @returns The filter conditions for a normal property
	 */
	_getConditionsForProperty: function (propertyConversionInfo: PropertyConversionInfo): ConditionObject[] {
		const { propertyMetadata, selectionVariant } = propertyConversionInfo;
		const conditonPath = propertyMetadata.name;
		const selectOptionName = selectionVariantToStateFilters._getSelectOptionName(selectionVariant, conditonPath);

		let conditionObjects: ConditionObject[] = [];
		if (selectOptionName) {
			conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, false);
		}
		return conditionObjects;
	},

	/**
	 * Create filter conditions from navigation properties.
	 * @param propertyConversionInfo Property info used for conversion
	 * @returns The filter condtions for navigation property
	 */
	_getConditionsForNavProperty: function (propertyConversionInfo: PropertyConversionInfo): ConditionObject[] {
		const { controlInfo, selectionVariant, propertyName, navPath } = propertyConversionInfo;
		const { contextPath } = controlInfo;

		let conditionObjects: ConditionObject[] = [];

		// We check with '/SalesOrderManage/_Item/Name'.
		// '/SalesOrderManage/_Item' => 'SalesOrderManage._Item'
		let selectOptionPathPrefix = `${contextPath.substring(1)}${navPath}`.replaceAll("/", ".");
		let selectOptionName = selectionVariantToStateFilters._getSelectOptionName(
			selectionVariant,
			propertyName,
			false,
			selectOptionPathPrefix
		);

		if (!selectOptionName) {
			// We check with '_Item/Name'.
			selectOptionPathPrefix = navPath.replaceAll("/", ".");
			selectOptionName = selectionVariantToStateFilters._getSelectOptionName(
				selectionVariant,
				propertyName,
				false,
				selectOptionPathPrefix
			);
		}

		if (selectOptionName) {
			conditionObjects = selectionVariantToStateFilters._getPropertyConditions(propertyConversionInfo, selectOptionName, false);
		}

		return conditionObjects;
	},

	/**
	 * Get the possible select option name based on priority order.
	 * @param selectionVariant SelectionVariant to be converted.
	 * @param propertyName Metadata property name
	 * @param isParameter Property is a parameter
	 * @param navigationPath Navigation path to be considered
	 * @returns The correct select option name of a property to fetch the select options for conversion.
	 */
	_getSelectOptionName: function (
		selectionVariant: SelectionVariant,
		propertyName: string,
		isParameter?: boolean,
		navigationPath?: string
	): string {
		// possible SelectOption Names based on priority.
		const possibleSelectOptionNames: string[] = [];
		const selectOptionsPropertyNames = selectionVariant.getSelectOptionsPropertyNames();

		if (isParameter) {
			// Currency ==> $Parameter.Currency
			// P_Currency ==> $Parameter.P_Currency
			possibleSelectOptionNames.push(`$Parameter.${propertyName}`);

			// Currency ==> Currency
			// P_Currency ==> P_Currency
			possibleSelectOptionNames.push(propertyName);

			if (propertyName.startsWith("P_")) {
				// P_Currency ==> $Parameter.Currency
				possibleSelectOptionNames.push(`$Parameter.${propertyName.slice(2, propertyName.length)}`);

				// P_Currency ==> Currency
				possibleSelectOptionNames.push(propertyName.slice(2, propertyName.length));
			} else {
				// Currency ==> $Parameter.P_Currency
				possibleSelectOptionNames.push(`$Parameter.P_${propertyName}`);

				// Currency ==> P_Currency
				possibleSelectOptionNames.push(`P_${propertyName}`);
			}
		} else {
			// Name => Name
			possibleSelectOptionNames.push(propertyName);
			possibleSelectOptionNames.push(`$Parameter.${propertyName}`);

			if (propertyName.startsWith("P_")) {
				// P_Name => Name
				const temp1 = propertyName.slice(2, propertyName.length);

				// Name => $Parameter.Name
				possibleSelectOptionNames.push(`$Parameter.${temp1}`);

				// Name => Name
				possibleSelectOptionNames.push(temp1);
			} else {
				// Name => P_Name
				const temp2 = `P_${propertyName}`;

				// P_Name => $Parameter.P_Name
				possibleSelectOptionNames.push(`$Parameter.${temp2}`);

				// P_Name => P_Name
				possibleSelectOptionNames.push(temp2);
			}
		}

		let selectOptionName = "";
		// Find the correct select option name based on the priority
		possibleSelectOptionNames.some((testName: string) => {
			const pathToCheck = navigationPath ? `${navigationPath}.${testName}` : testName;
			// Name => Name
			// Name => _Item.Name (incase _Item is navigationPath)

			return selectOptionsPropertyNames.includes(pathToCheck) ? (selectOptionName = pathToCheck) : false;
		});

		return selectOptionName;
	},

	/**
	 * Get maximum conditions supported for a property as filter.
	 * @param propertyConversionInfo Property info used for conversion
	 * @returns Number of maximum conditions
	 */
	_getMaxConditions(propertyConversionInfo: PropertyConversionInfo): number {
		const { controlInfo, propertyContextPath, propertyName } = propertyConversionInfo;
		const { metaModel } = controlInfo;
		const completePropertyPath = `${propertyContextPath}${propertyName}`;
		const propertyContext = metaModel.createBindingContext(completePropertyPath);

		let maximumConditions = 0;
		if (propertyContext) {
			maximumConditions = maxConditions(propertyName, { context: propertyContext });
		}
		return maximumConditions;
	},

	/**
	 * Convert select options to property conditions.
	 * @param propertyConversionInfo Property info used for conversion
	 * @param selectOptionName Select option name
	 * @param isParameter Boolean which determines if a property is parameterized
	 * @returns The conditions of a property for control
	 */
	_getPropertyConditions: function (
		propertyConversionInfo: PropertyConversionInfo,
		selectOptionName: string,
		isParameter?: boolean
	): ConditionObject[] {
		const { controlInfo, propertyMetadata, selectionVariant, propertyContextPath, propertyName } = propertyConversionInfo;
		const selectOptions = selectionVariant.getSelectOption(selectOptionName);
		const { metaModel } = controlInfo;
		const maximumConditions = selectionVariantToStateFilters._getMaxConditions(propertyConversionInfo);

		let conditionObjects: ConditionObject[] = [];
		if (selectOptions?.length && maximumConditions !== 0) {
			const semanticDateOperators: string[] = selectionVariantToStateFilters._getSemanticDateOperators(
				propertyConversionInfo,
				isParameter
			);
			const propertyEntitySetPath = propertyContextPath.substring(0, propertyContextPath.length - 1);

			const validOperators = isParameter
				? ["EQ"]
				: CommonHelper.getOperatorsForProperty(propertyName, propertyEntitySetPath, metaModel);

			// multiple select options => multiple conditions

			conditionObjects = this._getConditionsFromSelectOptions(
				selectOptions,
				propertyMetadata,
				validOperators,
				semanticDateOperators,
				maximumConditions === 1
			);
		}
		return conditionObjects;
	},

	/**
	 * Fetch semantic date operators.
	 * @param propertyConversionInfo Object which is used for conversion
	 * @param isParameter Boolean which determines if a property is parameterized
	 * @returns The semantic date operators supported for a property
	 */
	_getSemanticDateOperators: function (propertyConversionInfo: PropertyConversionInfo, isParameter?: boolean): string[] {
		const { controlInfo, propertyMetadata, propertyName, propertyContextPath } = propertyConversionInfo;
		const conditionPath = propertyMetadata.name;
		let semanticDateOperators: string[] = [];
		const { useSemanticDateRange, filterFieldsConfig, metaModel } = controlInfo;
		if (useSemanticDateRange) {
			if (isParameter) {
				semanticDateOperators = ["EQ"];
			} else {
				const propertyEntitySetPath = propertyContextPath.substring(0, propertyContextPath.length - 1),
					filterSettings = selectionVariantToStateFilters._getPropertyFilterConfigurationSetting(
						conditionPath,
						filterFieldsConfig
					);
				semanticDateOperators = CommonHelper.getOperatorsForProperty(
					propertyName,
					propertyEntitySetPath,
					metaModel,
					ODATA_TYPE_MAPPING[propertyMetadata.dataType],
					useSemanticDateRange,
					filterSettings
				);
			}
		}
		return semanticDateOperators;
	},

	/**
	 * Get the filter conditions from selection options.
	 * @param selectOptions Select options array
	 * @param propertyMetadata Property metadata information
	 * @param validOperators All valid operators
	 * @param semanticDateOperators Semantic date operators
	 * @param singleCondition Boolean which determines if a property takes only one condtition
	 * @returns Converted filter conditions
	 */
	_getConditionsFromSelectOptions: function (
		selectOptions: SelectOption[],
		propertyMetadata: ControlPropertyInfo,
		validOperators: string[],
		semanticDateOperators: string[],
		singleCondition?: boolean
	): ConditionObject[] {
		let conditionObjects: ConditionObject[] = [];
		// Create conditions for all the selectOptions of the property
		if (selectOptions.length) {
			conditionObjects = singleCondition
				? selectionVariantToStateFilters._addConditionFromSelectOption(
						propertyMetadata,
						validOperators,
						semanticDateOperators,
						conditionObjects,
						selectOptions[0]
				  )
				: selectOptions.reduce(
						selectionVariantToStateFilters._addConditionFromSelectOption.bind(
							null,
							propertyMetadata,
							validOperators,
							semanticDateOperators
						),
						conditionObjects
				  );
		}
		return conditionObjects;
	},

	/**
	 * Cumulatively add select option to condition.
	 * @param propertyMetadata Property metadata information
	 * @param validOperators Operators for all the data types
	 * @param semanticDateOperators Operators for the Date type
	 * @param cumulativeConditions Filter conditions
	 * @param selectOption Selectoption of selection variant
	 * @returns The filter conditions
	 */
	_addConditionFromSelectOption: function (
		propertyMetadata: ControlPropertyInfo,
		validOperators: string[],
		semanticDateOperators: string[],
		cumulativeConditions: ConditionObject[],
		selectOption: SelectOption
	): ConditionObject[] {
		const { hasValueHelp, dataType } = propertyMetadata;

		const edmType = selectionVariantToStateFilters._getEdmType(dataType);
		const condition = getConditions(selectOption, edmType ?? dataType, !!hasValueHelp, validOperators);
		if (
			selectOption.SemanticDates &&
			semanticDateOperators.length &&
			semanticDateOperators.includes(selectOption.SemanticDates.operator)
		) {
			const semanticDates = selectionVariantToStateFilters._addSemanticDatesToConditions(selectOption.SemanticDates);
			if (Object.keys(semanticDates).length > 0) {
				cumulativeConditions.push(semanticDates);
			}
		} else if (condition) {
			if (validOperators.length === 0 || validOperators.includes(condition.operator)) {
				cumulativeConditions.push(condition);
			}
		}
		return cumulativeConditions;
	},

	/**
	 * Create filter conditions for a parameter property.
	 * @param semanticDates Semantic date infomation
	 * @returns The filter conditions containing semantic dates
	 */
	_addSemanticDatesToConditions: (semanticDates: SemanticDateConfiguration): ConditionObject => {
		const values: unknown[] = [];
		if (semanticDates.high !== null) {
			values.push(semanticDates.high);
		}
		if (semanticDates.low !== null) {
			values.push(semanticDates.low);
		}
		return {
			values: values,
			operator: semanticDates.operator,
			isEmpty: undefined
		};
	},

	/**
	 * Get EDM type from data type.
	 * @param dataType V4 model data type
	 * @returns EDM type equivalent of data type
	 */
	_getEdmType: (dataType: string): string => {
		const TYPE_EDM_MAPPING = Object.fromEntries(
			Object.entries(EDM_TYPE_MAPPING).map(([k, v]) => [(v as { type: unknown }).type, k])
		) as Record<string, unknown>;
		return TYPE_EDM_MAPPING[dataType] as string;
	},

	/**
	 * Change value depending on condition operator(Empty and NotEmpty) for properties with ValueList with fixed values.
	 * @param condition Condition to change
	 */
	_adjustValueListWithFixedValuesCondition: (condition: Record<string, unknown>): void => {
		// in case the condition is meant for a field having a VH, the format required by MDC differs
		condition.validated = ConditionValidated.Validated;
		if (condition.operator === "Empty") {
			condition.operator = "EQ";
			condition.values = [""];
		} else if (condition.operator === "NotEmpty") {
			condition.operator = "NE";
			condition.values = [""];
		}
		delete condition.isEmpty;
	}
};

export default selectionVariantToStateFilters;

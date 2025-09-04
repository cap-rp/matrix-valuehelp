import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type {
	BetweenSelectedValues,
	EasyFilterPropertyMetadata,
	TokenDefinition,
	TokenSelectedValuesDefinition,
	TokenType,
	ValueHelpSelectedValuesDefinition
} from "sap/fe/controls/easyFilter/EasyFilterBarContainer";
import EasyFilterBarContainer from "sap/fe/controls/easyFilter/EasyFilterBarContainer";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import type { ControlState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type { FilterField } from "sap/fe/core/definition/FEDefinition";
import type MetaPath from "sap/fe/core/helpers/MetaPath";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { hasValueHelpWithFixedValues } from "sap/fe/core/templating/PropertyHelper";
import {
	generateSelectParameter,
	mapValueListToCodeList,
	resolveTokenValue,
	unresolvedResult
} from "sap/fe/macros/ai/EasyFilterDataFetcher";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import DraftEditState from "sap/fe/macros/filterBar/DraftEditState";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import ValueListHelper, { type ValueListInfo } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type FilterBar from "sap/ui/mdc/FilterBar";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import Date1 from "sap/ui/model/odata/type/Date";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import type ODataType from "sap/ui/model/odata/type/ODataType";
import TimeOfDay from "sap/ui/model/odata/type/TimeOfDay";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { CodeListEntry } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";

type EasyFilterBarState = {};
/**
 * Delivery for beta release for the easy filter feature.
 * @experimental
 */
@defineUI5Class("sap.fe.macros.EasyFilterBar")
export default class EasyFilterBar extends BuildingBlock implements IViewStateContributor<EasyFilterBarState> {
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor!: boolean;

	@association({ type: "sap.fe.macros.filterBar.FilterBarAPI" })
	filterBar!: string;

	@association({ type: "sap.fe.macros.contentSwitcher.ContentSwitcher" })
	contentSwitcher!: string;

	@property({ type: "string" })
	contentSwitcherKey?: string;

	@property({ type: "string" })
	contextPath?: string;

	@aggregation({ type: "sap.fe.controls.easyFilter.EasyFilterBarContainer" })
	content?: EnhanceWithUI5<EasyFilterBarContainer>;

	_fetchedCodeList!: Record<string, unknown>;

	private filterBarMetadata!: (EasyFilterPropertyMetadata & { path?: string })[];

	private easyFilterPath?: string;

	private recommendedQueries?: string[];

	constructor(properties: $ControlSettings & PropertiesOf<EasyFilterBar>, others?: $ControlSettings) {
		super(properties, others);
		this.getAppComponent()
			?.getEnvironmentCapabilities()
			.prepareFeature("MagicFiltering")
			.then(() => {
				this.easyFilterPath = "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
				this.content?.setEasyFilterLib(this.easyFilterPath);
				return;
			})
			.catch((error) => {
				Log.debug("Error while loading EasyFilter", error);
				return undefined;
			});
	}

	async applyLegacyState(
		getContrilState?: (control: ManagedObject) => ControlState,
		oNavParameters?: NavigationParameter,
		_shouldApplyDiffState?: boolean,
		_skipMerge?: boolean
	): Promise<void> {
		if (oNavParameters?.selectionVariant) {
			const selectOptionsNames = oNavParameters.selectionVariant.getSelectOptionsPropertyNames();
			this.filterBarMetadata.forEach((field) => {
				if (selectOptionsNames.includes(field.name)) {
					field.defaultValue = oNavParameters.selectionVariant!.getSelectOption(field.name)?.map((option) => {
						if (option.Sign === "I") {
							if (option.Option === "BT") {
								return {
									operator: FilterOperator.BT,
									selectedValues: [{ value1: option.Low, value2: option.High }]
								};
							} else {
								return {
									operator: option.Option,
									selectedValues: [option.Low]
								};
							}
						} else {
							return {
								operator: FilterOperator.NE,
								selectedValues: [option.Low]
							};
						}
					}) as TokenSelectedValuesDefinition[];
				}
			});
			this.content?.resetState(false);
		}
		return Promise.resolve(undefined);
	}

	applyState(_state: EasyFilterBarState, _oNavParameters?: NavigationParameter): Promise<void> | void {
		return undefined;
	}

	retrieveState(): EasyFilterBarState | null {
		return {};
	}

	getApplicationId(): string {
		return this.getAppComponent()?.getManifestEntry("sap.app").id ?? "<unknownID>";
	}

	onMetadataAvailable(): void {
		this._fetchedCodeList ??= {};
		this.filterBarMetadata = this.prepareFilterBarMetadata();
		this.recommendedQueries = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.easyFilter?.recommendedQueries ?? [];
		this.content = this.createContent() as EnhanceWithUI5<EasyFilterBarContainer>;
		this.content.filterBarMetadata = this.filterBarMetadata;
	}

	prepareFilterBarMetadata(): EasyFilterPropertyMetadata[] {
		const owner = this._getOwner()!;
		const definitionForPage = owner.preprocessorContext?.getDefinitionForPage();
		let filterBarDef;
		if (definitionForPage) {
			filterBarDef = definitionForPage.getFilterBarDefinition({});

			const metaModel = owner.preprocessorContext?.models.metaModel as ODataMetaModel;

			const getType = (edmType: string, codeList: unknown): TokenType => {
				if (codeList) {
					return "MenuWithCheckBox";
				}
				switch (edmType) {
					case "Edm.Date":
						return "Calendar";
					case "Edm.TimeOfDay":
						return "Time";
					default:
						return "ValueHelp";
				}
			};
			const startupParameters = owner.getAppComponent().getComponentData()?.startupParameters ?? {};

			const filterFields = filterBarDef.getFilterFields();
			const result = filterFields.map((field: FilterField): EasyFilterPropertyMetadata => {
				// Exclude hidden filter fields. It is not possible to set a value for hidden filters, and users would not understand anyway as they cannot see these values.
				const propertyObject = field.getTarget();
				let codeList;
				const hasCodeList = hasValueHelpWithFixedValues(propertyObject);
				if (hasCodeList) {
					codeList = this._fetchedCodeList[field.name];
					if (!codeList) {
						codeList = async (): Promise<CodeListEntry[]> => this.getCodeListForProperty(field.name, field.annotationPath!);
					}
				}

				// Check if the filter field's target property has a currency or a unit. If so, look for the corresponding filter field (the
				// annotation has to be a path for that) and set the 'unit' property.
				const unitAnnotation = propertyObject.annotations.Measures?.ISOCurrency ?? propertyObject.annotations.Measures?.Unit;
				const unitProperty = isPathAnnotationExpression(unitAnnotation) ? unitAnnotation.$target : undefined;
				const unit = unitProperty ? filterFields.find((f) => f.getTarget() === unitProperty)?.name : undefined;
				let defaultValue;
				if (startupParameters.hasOwnProperty(field.name)) {
					defaultValue = [
						{
							operator: FilterOperator.EQ,
							selectedValues: startupParameters[field.name]
						}
					];
				} else if (field.isParameter && startupParameters.hasOwnProperty(field.name.substring(2))) {
					defaultValue = [
						{
							operator: FilterOperator.EQ,
							selectedValues: startupParameters[field.name.substring(2)]
						}
					];
				}
				return {
					name: field.name,
					path: field.annotationPath,
					label: field.label,
					dataType: propertyObject.type,
					required: field.required ?? false,
					defaultValue: defaultValue,
					filterable: true,
					sortable: !field.isParameter,
					codeList: codeList,
					type: getType(propertyObject.type, codeList),
					unit: unit
				} as EasyFilterPropertyMetadata;
			});

			// [Editing Status]

			if (ModelHelper.isMetaPathDraftSupported(definitionForPage.getMetaPath() as unknown as MetaPath<unknown>)) {
				// Assemble the code list for the editing status filter values:
				const props = new JSONModel({
					isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
				}).createBindingContext("/");

				const editingStatusCodeList = DraftEditState.getEditStatesContext(props)
					.getObject("/")
					.map((state: { id: string; display: string }) => ({ value: state.id, description: state.display }));

				result.push({
					name: "$editState",
					label: this.getTranslatedText("FILTERBAR_EDITING_STATUS"),
					dataType: "Edm.String",
					required: false,
					filterable: true,
					sortable: false,
					codeList: editingStatusCodeList,
					type: "MenuWithCheckBox"
				});
			}
			return result;
		}
		return [];
	}

	async getCodeListForProperty(key: string, propertyPath: string): Promise<CodeListEntry[]> {
		const defaultValueList = await this.getValueList(propertyPath);

		if (!defaultValueList) {
			return [];
		}

		const valueListInfo = defaultValueList.valueListInfo;

		const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, undefined, {
			$select: generateSelectParameter(defaultValueList)
		});
		const data = await listBinding.requestContexts();

		const filterGroupValues = data.map(mapValueListToCodeList(defaultValueList));
		this._fetchedCodeList[key] = filterGroupValues;
		const codeListProperty = this.filterBarMetadata.find((field) => field.name === key);
		if (codeListProperty) {
			codeListProperty.codeList = filterGroupValues;
		}
		return filterGroupValues;
	}

	async resolveTokenValuesForField(
		fieldName: string,
		values: TokenSelectedValuesDefinition[]
	): Promise<ValueHelpSelectedValuesDefinition[]> {
		const field = this.filterBarMetadata.find(({ name }) => name === fieldName);
		if (field?.path) {
			const valueList = await this.getValueList(field.path);

			if (valueList && ValueListHelper.isValueListSearchable(field.path, valueList)) {
				const resolvedTokenValues = await Promise.all(values.map(async (value) => resolveTokenValue(valueList, value)));
				return resolvedTokenValues.flat();
			}
		}

		// return original values converted to the expected format
		return unresolvedResult(values);
	}

	async getValueList(propertyPath: string): Promise<ValueListInfo | undefined> {
		const metaModel = this.getMetaModel()!;
		const valueLists = await ValueListHelper.getValueListInfo(undefined, propertyPath, undefined, metaModel);
		return valueLists[0];
	}

	async onTokensChanged(e: UI5Event<{ tokens: TokenDefinition[] }, EasyFilterBarContainer>): Promise<void> {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		const tokens = e.getParameter("tokens");
		const clearEditFilter = tokens.some((tokenDefinition) => tokenDefinition.key === "$editState");
		await filterBarAPI._clearFilterValuesWithOptions(filterBar, { clearEditFilter });
		this.formateDataTypes(tokens);

		for (const token of tokens) {
			if (token.key === "$editState") {
				// convert the $editState filter condition
				for (const tokenKeySpecification of token.keySpecificSelectedValues) {
					await FilterUtils.addFilterValues(
						filterBarAPI.content,
						token.key,
						"DRAFT_EDIT_STATE",
						tokenKeySpecification.selectedValues
					);
				}
			} else {
				//BT and NB case to be handled in future, currently its crashing
				for (const tokenKeySpecification of token.keySpecificSelectedValues) {
					const { operator, selectedValues } = tokenKeySpecification;
					await FilterUtils.addFilterValues(filterBarAPI.content, token.key, operator, selectedValues);
				}
			}
		}
		await filterBarAPI.triggerSearch();
	}

	//We need the below function so that the date objects and dateTimeOffsets would be converted to string type as the date object is not a valid type in V4 world
	formateDataTypes(tokens: TokenDefinition[]): void {
		const dateType = new Date1(),
			dateTimeOffsetType = new DateTimeOffset(undefined, { V4: true }),
			timeOfDayType = new TimeOfDay();
		tokens.forEach((token) => {
			const edmType = this.filterBarMetadata.find((data) => data.name === token.key)?.dataType;
			token.keySpecificSelectedValues.forEach((keySpecificSelectedValue) => {
				let requiredConverter: ODataType;
				switch (edmType) {
					case "Edm.Date":
						requiredConverter = dateType;
						break;
					case "Edm.TimeOfDay":
						requiredConverter = timeOfDayType;
						break;
					case "Edm.DateTimeOffset":
						requiredConverter = dateTimeOffsetType;
						break;
					default:
						return;
				}
				keySpecificSelectedValue.selectedValues.forEach((value, idx) => {
					keySpecificSelectedValue.selectedValues[idx] = requiredConverter.parseValue(value, "object");
				});
			});
		});
	}

	async showValueHelpForKey(key: string, _currentValue: unknown, fnCallback: Function): Promise<void> {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		await filterBarAPI.showFilterField(key);
		filterBarAPI.openValueHelpForFilterField(key, undefined, fnCallback);
	}

	onBeforeQueryProcessing(): void {
		const uiModel = this.getModel("ui") as JSONModel;
		BusyLocker.lock(uiModel);
	}

	onAfterQueryProcessing(): void {
		const uiModel = this.getModel("ui") as JSONModel;
		BusyLocker.unlock(uiModel);
	}

	async onClearFilters(): Promise<void> {
		// Empty input: clear the filters and refresh the list
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		await filterBarAPI._clearFilterValuesWithOptions(filterBar);
		await filterBarAPI.triggerSearch();
	}

	onQueryChanged(): void {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		filterBar.fireFiltersChanged({ conditionsBased: true });
	}

	createContent(): EasyFilterBarContainer {
		return (
			<EasyFilterBarContainer
				contextPath={this.getOwnerContextPath()}
				appId={this.getApplicationId()}
				filterBarMetadata={this.filterBarMetadata}
				easyFilterLib={this.easyFilterPath}
				showValueHelp={(e): void => {
					this.showValueHelpForKey(e.getParameter("key"), e.getParameter("values"), (selectedConditions: ConditionObject[]) => {
						const tokenSelectedValues: TokenSelectedValuesDefinition[] = selectedConditions.map((condition) => {
							if (condition.operator === FilterOperator.BT || condition.operator === FilterOperator.NB) {
								return {
									operator: condition.operator,
									selectedValues: condition.values as BetweenSelectedValues
								};
							} else {
								return {
									operator: condition.operator as Exclude<FilterOperator, FilterOperator.BT | FilterOperator.NB>,
									selectedValues: condition.values as string[] | boolean[] | number[] | Date[]
								};
							}
						});
						e.getParameter("resolve")(tokenSelectedValues);
					});
				}}
				dataFetcher={this.resolveTokenValuesForField.bind(this)}
				recommendedValues={this.recommendedQueries}
				queryChanged={this.onQueryChanged.bind(this)}
				tokensChanged={this.onTokensChanged.bind(this)}
				beforeQueryProcessing={this.onBeforeQueryProcessing.bind(this)}
				afterQueryProcessing={this.onAfterQueryProcessing.bind(this)}
				clearFilters={this.onClearFilters.bind(this)}
			/>
		) as EasyFilterBarContainer;
	}
}

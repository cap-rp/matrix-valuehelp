import type { EntitySet } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import CommonUtils from "sap/fe/core/CommonUtils";
import TemplateModel from "sap/fe/core/TemplateModel";
import {
	blockAggregation,
	blockAttribute,
	blockEvent,
	defineBuildingBlock
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { storeObjectValue } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getSelectionVariant } from "sap/fe/core/converters/controls/Common/DataVisualization";
import type { FilterField as ConvertedFilterField, ManifestFilterField } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { getSelectionFields } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { getSearchRestrictions } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { maxConditions } from "sap/fe/macros/filter/FilterFieldHelper";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import DraftEditState from "sap/fe/macros/filterBar/DraftEditState";
import type FilterField from "sap/fe/macros/filterBar/FilterField";
import { getFilterConditions } from "sap/fe/macros/filterBar/FilterHelper";
import CustomFragmentBlock from "sap/fe/macros/fpm/CustomFragment.block";
import InternalFilterField from "sap/fe/macros/internal/FilterField.block";
import Select from "sap/m/Select";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import ListItem from "sap/ui/core/ListItem";
import FieldHelpCustomData from "sap/ui/core/fieldhelp/FieldHelpCustomData";
import type { IContext } from "sap/ui/core/util/XMLPreprocessor";
import MDCFilterField from "sap/ui/mdc/FilterField";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type { FilterBarBase$FiltersChangedEvent, FilterBarBase$SearchEvent } from "sap/ui/mdc/filterbar/FilterBarBase";
import PersistenceProvider from "sap/ui/mdc/p13n/PersistenceProvider";
import type Context from "sap/ui/model/Context";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { PropertyInfo } from "../DelegateUtil";
import ValueHelp from "../ValueHelp";
import CustomFilterFieldContentWrapper from "../controls/CustomFilterFieldContentWrapper";
import FEFilterBar from "../controls/FilterBar";
import SlotColumn from "../table/SlotColumn";
import FilterBarAPI from "./FilterBarAPI";

const setCustomFilterFieldProperties = function (childFilterField: Element, aggregationObject: FilterField): FilterField {
	aggregationObject.slotName = aggregationObject.key;
	aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
	aggregationObject.property = childFilterField.getAttribute("property")!;
	aggregationObject.label = childFilterField.getAttribute("label")!;
	aggregationObject.required = childFilterField.getAttribute("required") === "true";
	aggregationObject.template = childFilterField.getAttribute("template") as unknown as Control; // But it's a string;
	return aggregationObject;
};

/**
 * Building block for creating a FilterBar based on the metadata provided by OData V4.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:FilterBar
 * id="SomeID"
 * showAdaptFiltersButton="true"
 * p13nMode=["Item","Value"]
 * listBindingNames = "sap.fe.tableBinding"
 * liveMode="true"
 * search=".handlers.onSearch"
 * filterChanged=".handlers.onFiltersChanged"
 * /&gt;
 * </pre>
 *
 * Building block for creating a FilterBar based on the metadata provided by OData V4.
 * @since 1.94.0
 */
@defineBuildingBlock({
	name: "FilterBar",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.fe.macros.filterBar.FilterBarAPI"]
})
export default class FilterBarBlock extends BuildingBlockTemplatingBase {
	/**
	 * ID of the FilterBar
	 */
	@blockAttribute({
		type: "string",
		isPublic: true
	})
	id?: string;

	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	visible?: string;

	/**
	 * selectionFields to be displayed
	 */
	@blockAttribute({
		type: "sap.ui.model.Context"
	})
	selectionFields?: ConvertedFilterField[] | Context;

	@blockAttribute({ type: "string" })
	filterBarDelegate?: string;

	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true
	})
	metaPath?: Context;

	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true
	})
	contextPath?: Context;

	/**
	 * Displays possible errors during the search in a message box
	 */
	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	showMessages = false;

	/**
	 * ID of the assigned variant management
	 */
	@blockAttribute({
		type: "string"
	})
	variantBackreference?: string;

	/**
	 * Don't show the basic search field
	 */
	@blockAttribute({
		type: "boolean"
	})
	hideBasicSearch?: boolean;

	/**
	 * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
	 */
	@blockAttribute({
		type: "boolean"
	})
	enableFallback = false;

	/**
	 * Handles visibility of the 'Adapt Filters' button on the FilterBar
	 */
	@blockAttribute({
		type: "boolean"
	})
	showAdaptFiltersButton = true;

	/**
	 * Specifies the personalization options for the filter bar.
	 */
	@blockAttribute({
		type: "string[]"
	})
	p13nMode = "Item,Value";

	@blockAttribute({
		type: "string"
	})
	propertyInfo?: string;

	/**
	 * Specifies the Sematic Date Range option for the filter bar.
	 */
	@blockAttribute({
		type: "boolean"
	})
	useSemanticDateRange = true;

	/**
	 * Specifies the navigation properties option for the filter bar.
	 */
	@blockAttribute({
		type: "string[]"
	})
	navigationProperties?: string[];

	/**
	 * If set, the search is automatically triggered when a filter value is changed.
	 */
	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	liveMode = false;

	/**
	 * Filter conditions to be applied to the filter bar
	 */
	@blockAttribute({
		type: "string",
		required: false
	})
	filterConditions?: string | undefined;

	/**
	 * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
	 * a search is triggered immediately if one or more search requests have been triggered in the meantime
	 * but were ignored based on the setting.
	 */
	@blockAttribute({
		type: "boolean"
	})
	suspendSelection = false;

	@blockAttribute({
		type: "boolean"
	})
	isDraftCollaborative = false;

	/**
	 * Id of control that will allow for switching between normal and visual filter
	 */
	@blockAttribute({
		type: "string"
	})
	toggleControlId?: string;

	@blockAttribute({
		type: "string"
	})
	initialLayout = "compact";

	/**
	 * Handles the visibility of the 'Clear' button on the FilterBar.
	 */
	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	showClearButton = false;

	@blockAttribute({
		type: "boolean"
	})
	_applyIdToContent = false;

	@blockAttribute({
		type: "boolean"
	})
	disableDraftEditStateFilter = false;

	/**
	 * Temporary workaround only
	 * path to contextPath to be used by child filterfields
	 */
	_internalContextPath!: Context;

	_parameters: string | undefined;

	_annotationPath: string | undefined;

	/**
	 * Event handler to react to the search event of the FilterBar
	 */
	@blockEvent()
	search?: string;

	/**
	 * Event handler to react to the filterChange event of the FilterBar
	 */
	@blockEvent()
	filterChanged?: string;

	/**
	 * Event handler to react to the filterChanged event of the FilterBar. Exposes parameters from the MDC filter bar
	 */
	@blockEvent()
	internalFilterChanged?: string;

	/**
	 * Event handler to react to the search event of the FilterBar. Exposes parameteres from the MDC filter bar
	 */
	@blockEvent()
	internalSearch?: string;

	/**
	 * Event handler to react to the afterClear event of the FilterBar
	 */
	@blockEvent()
	afterClear?: string;

	@blockAggregation({
		type: "sap.fe.macros.filterBar.FilterField",
		isPublic: true,
		hasVirtualNode: true,
		processAggregations: setCustomFilterFieldProperties
	})
	filterFields?: FilterField;

	_apiId: string | undefined;

	_contentId: string | undefined;

	_valueHelps: Array<string> | "" | undefined;

	_filterFields: Array<string> | "" | undefined;

	showDraftEditState = false;

	designtime?: string;

	/**
	 * This mode must be used when it is certain that a control must not persist it´s personalization state upon initialization.
	 * @experimental
	 * @since 1.136.0
	 */
	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	ignorePersonalizationChanges = false;

	constructor(props: PropertiesOf<FilterBarBlock>, configuration: unknown, mSettings: TemplateProcessorSettings) {
		super(props, configuration, mSettings);
		if (!this.metaPath) {
			Log.error("Context Path not available for FilterBar Macro.");
			return;
		}
		const sMetaPath = this.metaPath.getPath();
		let entityTypePath = "";
		const metaPathParts = sMetaPath?.split("/@com.sap.vocabularies.UI.v1.SelectionFields") || []; // [0]: entityTypePath, [1]: SF Qualifier.
		if (metaPathParts.length > 0) {
			entityTypePath = this.getEntityTypePath(metaPathParts);
		}
		const sEntitySetPath = ModelHelper.getEntitySetPath(entityTypePath);
		const oMetaModel = this.contextPath?.getModel();
		this._internalContextPath = oMetaModel?.createBindingContext(entityTypePath) as Context;
		const annotationPath: string = "@com.sap.vocabularies.UI.v1.SelectionFields" + ((metaPathParts.length && metaPathParts[1]) || "");
		const parentContextPath = mSettings?.fullContextPath as string;
		let sObjectPath = annotationPath;
		if (parentContextPath !== "" && this._internalContextPath.getPath()?.startsWith(parentContextPath)) {
			sObjectPath = sMetaPath.replace(parentContextPath, "");
		}
		this._annotationPath = annotationPath;
		const oExtraParams: Record<string, { filterFields?: FilterField }> = {};
		if (this.filterFields) {
			oExtraParams[sObjectPath] = {
				filterFields: this.filterFields
			};
		}

		const oVisualizationObjectPath = getInvolvedDataModelObjects(this._internalContextPath);
		const oConverterContext = this.getConverterContext(oVisualizationObjectPath, undefined, mSettings, oExtraParams);
		if (!this.propertyInfo) {
			this.propertyInfo = getSelectionFields(oConverterContext, [], annotationPath).sPropertyInfo;
		}

		const targetEntitySet = getInvolvedDataModelObjects(this.metaPath, this.contextPath).targetEntitySet as EntitySet;
		if (targetEntitySet?.annotations?.Common?.DraftRoot && !this.disableDraftEditStateFilter) {
			this.showDraftEditState = true;
			this.checkIfEditingFilterIsDisabled(targetEntitySet);
			this.checkIfCollaborationDraftSupported(oMetaModel as ODataMetaModel);
		}

		//Filter Fields and values to the field are filled based on the selectionFields and this would be empty in case of macro outside the FE template
		if (!this.selectionFields) {
			const oSelectionFields = getSelectionFields(oConverterContext, [], annotationPath).selectionFields;
			this.selectionFields = new TemplateModel(oSelectionFields, oMetaModel as ODataMetaModel).createBindingContext("/");
			const viewData = mSettings?.models?.viewData?.getData();
			const oEntityType = oConverterContext.getEntityType(),
				oSelectionVariant = getSelectionVariant(oEntityType, oConverterContext),
				oEntitySetContext = (oMetaModel as ODataMetaModel).getContext(sEntitySetPath) as ODataV4Context,
				oFilterConditions = getFilterConditions(
					oEntitySetContext as unknown as IContext, // Wrong but somehow works ?,
					{ selectionVariant: oSelectionVariant },
					oEntitySetContext.getObject(),
					viewData,
					this.showDraftEditState
				);
			this.filterConditions = oFilterConditions;
		}
		this._processPropertyInfos(this.propertyInfo, oMetaModel);

		if (this._applyIdToContent) {
			this._apiId = this.id + "::FilterBar";
			this._contentId = this.id;
		} else {
			this._apiId = this.id;
			this._contentId = this.getContentId(this.id + "");
		}

		if (this.hideBasicSearch !== true) {
			const oSearchRestrictionAnnotation = getSearchRestrictions(sEntitySetPath, oMetaModel as ODataMetaModel);
			this.hideBasicSearch = Boolean(oSearchRestrictionAnnotation && !oSearchRestrictionAnnotation.Searchable);
		}
		jsx.renderAsXML(() => this.processSelectionFields());

		this.designtime = this.getDesigntime();
	}

	_processPropertyInfos(propertyInfo: string, model: ODataMetaModel): void {
		const aParameterFields: string[] = [];
		if (propertyInfo) {
			const sFetchedProperties = propertyInfo.replace(/\\{/g, "{").replace(/\\}/g, "}");
			const aFetchedProperties = JSON.parse(sFetchedProperties);
			const editStateLabel = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
			aFetchedProperties.forEach(function (propInfo: PropertyInfo) {
				propInfo.key = propInfo.name;
				if (propInfo.isParameter) {
					aParameterFields.push(propInfo.name);
				}
				if (propInfo.path === "$editState") {
					propInfo.label = editStateLabel;
				}
				if (propInfo.key?.includes("/")) {
					//TO DO: Need to place this logic in common place when we cover filterRetrictions with this BLI FIORITECHP1-25080
					const annotationPath = (propInfo as ConvertedFilterField).annotationPath;
					const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, annotationPath);
					const propertyPath = annotationPath.replace(`${propertyLocationPath}/`, "");
					propInfo.required = CommonUtils.getFilterRestrictionsByPath(propertyLocationPath, model)?.RequiredProperties?.includes(
						propertyPath
					);
				}
			});

			this.propertyInfo = JSON.stringify(aFetchedProperties).replace(/\{/g, "\\{").replace(/\}/g, "\\}");
		}
		this._parameters = JSON.stringify(aParameterFields);
	}

	checkIfEditingFilterIsDisabled = (targetEntitySet: EntitySet): void => {
		if (
			targetEntitySet.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties?.some(
				(r) => r.NavigationProperty?.value === "DraftAdministrativeData" && r.FilterRestrictions?.Filterable === false
			) === true
		) {
			this.showDraftEditState = false;
		}
	};

	checkIfCollaborationDraftSupported = (oMetaModel: ODataMetaModel | undefined): void => {
		if (ModelHelper.isCollaborationDraftSupported(oMetaModel)) {
			this.isDraftCollaborative = true;
		}
	};

	getEntityTypePath = (metaPathParts: string[]): string => {
		return metaPathParts[0].endsWith("/") ? metaPathParts[0] : metaPathParts[0] + "/";
	};

	getSearch = (): string => {
		if (!this.hideBasicSearch) {
			return (
				<MDCFilterField
					id={generate([this.id, "BasicSearchField"])}
					placeholder="{sap.fe.i18n>M_FILTERBAR_SEARCH}"
					propertyKey="$search"
					conditions="{$filters>/conditions/$search}"
					dataType="sap.ui.model.odata.type.String"
					maxConditions="1"
					dataTypeConstraints="{'maxLength':1000}"
				/>
			);
		}
		return "";
	};

	processSelectionFields = (): void => {
		let draftEditState = "";
		if (this.showDraftEditState) {
			const draftStates = DraftEditState.getEditStates(this.isDraftCollaborative);
			const label = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
			draftEditState = (
				<MDCFilterField
					label={label}
					conditions="{$filters>/conditions/$editState}"
					maxConditions="1"
					id={generate([this.id, "FilterField", "DraftEditingStatus"])}
					operators="EQ"
					dataType="sap.ui.model.odata.type.String"
					propertyKey="$editState"
					display="Description"
				>
					{{
						contentEdit: (
							<Select
								id={generate([this.id, "FilterField", "DraftEditingStatusSelect"])}
								width="100%"
								forceSelection="true"
								selectedKey="{path: '$field>/conditions', type: 'sap.ui.mdc.field.ConditionsType'}"
							>
								{{ items: draftStates.map((state) => <ListItem key={state.id} text={state.display} />) }}
							</Select>
						)
					}}
				</MDCFilterField>
			);
		}
		this._valueHelps = [];
		this._filterFields = [];
		this._filterFields?.push(draftEditState);
		if (!Array.isArray(this.selectionFields)) {
			this.selectionFields = this.selectionFields!.getObject() as ConvertedFilterField[];
		}
		this.selectionFields?.forEach((selectionField: ConvertedFilterField) => {
			if (selectionField.availability === "Default") {
				this.setFilterFieldsAndValueHelps(selectionField);
			}
		});
		this._filterFields = this._filterFields?.length > 0 ? this._filterFields : "";
		this._valueHelps = this._valueHelps?.length > 0 ? this._valueHelps : "";
	};

	getPersistenceProvider(filterBarId: string): string | undefined {
		if (this.ignorePersonalizationChanges) {
			return <PersistenceProvider id={generate([filterBarId, "PersistenceProvider"])} for={filterBarId} mode={"Transient"} />;
		}
		return undefined;
	}

	setFilterFieldsAndValueHelps = (selectionField: ConvertedFilterField): void => {
		if (selectionField.template === undefined && selectionField.type !== "Slot") {
			this.pushFilterFieldsAndValueHelps(selectionField);
		} else if (Array.isArray(this._filterFields)) {
			const property = selectionField.annotationPath;
			const propertyContext = this.metaPath!.getModel().createBindingContext(property);
			const propertyObject = propertyContext?.getObject();
			let filterContent;
			if (selectionField.type === "Slot") {
				filterContent = (
					<SlotColumn templateId={selectionField.template}>
						<slot name={(selectionField as ManifestFilterField).slotName!} />
					</SlotColumn>
				);
			} else if (selectionField.template) {
				filterContent = (
					<CustomFragmentBlock
						fragmentName={selectionField.template}
						id={generate([this.id, "CustomFilterField", selectionField.key])}
						contextPath={"{contextPath>}" as unknown as Context}
					/>
				);
			}
			let maxConditionValue = -1;
			if (propertyContext) {
				maxConditionValue = maxConditions(selectionField.annotationPath, { context: propertyContext }) ?? -1;
			}
			this._filterFields?.push(
				<MDCFilterField
					id={generate([this.id, "CustomFilterField", selectionField.key])}
					delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate" }}
					propertyKey={selectionField.conditionPath}
					label={selectionField.label}
					dataType="Edm.String"
					maxConditions={maxConditionValue}
					conditions={`{$filters>/conditions/${selectionField.conditionPath}}`}
					operators={FieldHelper.operators(
						propertyContext,
						propertyObject,
						this.useSemanticDateRange,
						selectionField.settings as unknown as string,
						this.contextPath!.getPath()
					)}
					dataTypeConstraints={(selectionField as unknown as { constraints: unknown }).constraints}
					dataTypeFormatOptions={(selectionField as unknown as { formatOptions: unknown }).formatOptions}
					valueHelp={"undefined"}
					required={selectionField.required}
				>
					{{
						content: (
							<CustomFilterFieldContentWrapper
								core:require="{handler: 'sap/fe/macros/filter/FilterUtils'}"
								id={generate([this.id, "FilterFieldContentWrapper", selectionField.key])}
								binding={`{filterValues>/'${FilterUtils.conditionToModelPath(selectionField.conditionPath)}}`}
								conditions={"{path: '$field>/conditions'}" as unknown as ConditionObject[]}
							>
								{{ content: filterContent }}
							</CustomFilterFieldContentWrapper>
						),
						customData: [
							<CustomData key={"isSlot"} value={selectionField.type === "Slot"} />,
							<FieldHelpCustomData
								key={"sap-ui-DocumentationRef"}
								value={`{parts: [{value: 'asArray'}, {value: '${selectionField.documentRefText}'}], formatter: 'sap.fe.core.formatters.StandardFormatter'}`}
							/>
						]
					}}
				</MDCFilterField>
			);
		}
	};

	_getContextPathForFilterField(selectionField: ConvertedFilterField, filterBarContextPath: Context): string {
		let contextPath: string = filterBarContextPath?.getPath();
		if (selectionField.isParameter) {
			// Example:
			// FilterBarContextPath: /Customer/Set
			// ParameterPropertyPath: /Customer/P_CC
			// ContextPathForFilterField: /Customer
			const annoPath = selectionField.annotationPath;
			contextPath = annoPath.substring(0, annoPath.lastIndexOf("/") + 1);
		}
		return contextPath;
	}

	pushFilterFieldsAndValueHelps = (selectionField: ConvertedFilterField): void => {
		if (Array.isArray(this._filterFields)) {
			this._filterFields?.push(
				<InternalFilterField
					idPrefix={generate([this.id, "FilterField", CommonHelper.getNavigationPath(selectionField.annotationPath)])}
					vhIdPrefix={generate([this.id, "FilterFieldValueHelp"])}
					property={selectionField.annotationPath as unknown as Context}
					contextPath={this._getContextPathForFilterField(selectionField, this._internalContextPath) as unknown as Context}
					useSemanticDateRange={this.useSemanticDateRange}
					settings={CommonHelper.stringifyCustomData(selectionField.settings)}
					visualFilter={
						selectionField.visualFilter !== undefined
							? (storeObjectValue(selectionField.visualFilter) as unknown as Context)
							: undefined
					}
					editMode={`{internal>/${this.id}/filterFields/${selectionField.conditionPath}/editMode}`}
				/>
			);
		}
		if (Array.isArray(this._valueHelps)) {
			this._valueHelps?.push(
				<ValueHelp
					idPrefix={generate([this.id, "FilterFieldValueHelp"])}
					conditionModel="$filters"
					metaPath={selectionField.annotationPath}
					contextPath={this._getContextPathForFilterField(selectionField, this._internalContextPath)}
					filterFieldValueHelp={true}
					useSemanticDateRange={this.useSemanticDateRange}
				/>
			);
		}
	};

	/**
	 * Determines the design time for the MDC FilterBar.
	 * @returns The value to be assigned to dt:designtime
	 */
	getDesigntime(): string | undefined {
		return "sap/fe/macros/filterBar/designtime/FilterBar.designtime";
	}

	getTemplate(): string {
		const internalContextPath = this._internalContextPath?.getPath();
		let filterDelegate = "";
		if (this.filterBarDelegate) {
			filterDelegate = this.filterBarDelegate;
		} else {
			filterDelegate = "{name:'sap/fe/macros/filterBar/FilterBarDelegate', payload: {entityTypePath: '" + internalContextPath + "'}}";
		}
		// after removing the unwanted properties PropertyInfo is added to the control, and we also save the full version as custom data for FE internal use
		const _propertyInfoControl = FilterUtils.formatPropertyInfo(this.propertyInfo as string);
		return (
			<FilterBarAPI
				id={this._apiId}
				metaPath={this.metaPath!.getPath()}
				search={this.search}
				filterChanged={this.filterChanged}
				afterClear={this.afterClear}
				internalSearch={this.internalSearch}
				internalFilterChanged={this.internalFilterChanged}
			>
				{{
					content: (
						<FEFilterBar
							core:require="{API: 'sap/fe/macros/filterBar/FilterBarAPI'}"
							id={this._contentId}
							liveMode={this.liveMode}
							delegate={filterDelegate}
							variantBackreference={this.liveMode ? undefined : this.variantBackreference}
							showAdaptFiltersButton={this.showAdaptFiltersButton}
							showClearButton={this.showClearButton}
							p13nMode={this.p13nMode}
							search={"API.handleSearch($event)" as unknown as (e: FilterBarBase$SearchEvent) => void}
							filtersChanged={"API.handleFilterChanged($event)" as unknown as (e: FilterBarBase$FiltersChangedEvent) => void}
							filterConditions={this.filterConditions}
							suspendSelection={this.suspendSelection}
							showMessages={this.showMessages}
							toggleControl={this.toggleControlId}
							initialLayout={this.initialLayout}
							propertyInfo={_propertyInfoControl}
							visible={this.visible}
							dt:designtime={this.designtime}
							customData:entityType={internalContextPath}
						>
							{{
								customData: [
									<CustomData key={"localId"} value={this.id} />,
									<CustomData key={"hideBasicSearch"} value={this.hideBasicSearch} />,
									<CustomData key={"showDraftEditState"} value={this.showDraftEditState} />,
									<CustomData key={"useSemanticDateRange"} value={this.useSemanticDateRange} />,
									<CustomData key={"parameters"} value={this._parameters} />,
									<CustomData key={"feFilterInfo"} value={this.propertyInfo} />,
									<CustomData key={"annotationPath"} value={this._annotationPath} />
								],
								dependents: [this._valueHelps, this.getPersistenceProvider(this._contentId as string)],
								basicSearchField: this.getSearch(),
								filterItems: this._filterFields
							}}
						</FEFilterBar>
					)
				}}
			</FilterBarAPI>
		);
	}
}

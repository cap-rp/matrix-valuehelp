import type { ConvertedMetadata,Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import deepEqual from "sap/base/util/deepEqual";
import CommonUtils from "sap/fe/core/CommonUtils";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import type { PropertyInfo } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { FieldDataType,ValueHelpHistoryService } from "sap/fe/core/services/ValueHelpHistoryServiceFactory";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type { InOutParameter,SorterType,ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ValueListHelper from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type Dialog from "sap/m/Dialog";
import highlightDOMElements from "sap/m/inputUtils/highlightDOMElements";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type { default as Field } from "sap/ui/mdc/Field";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type FilterField from "sap/ui/mdc/FilterField";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import ValueHelpDelegate from "sap/ui/mdc/ValueHelpDelegate";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import Condition from "sap/ui/mdc/condition/Condition";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import type FieldBase from "sap/ui/mdc/field/FieldBase";
import type FilterBarBase from "sap/ui/mdc/filterbar/FilterBarBase";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type MDCPopover from "sap/ui/mdc/valuehelp/Popover";
import type Container from "sap/ui/mdc/valuehelp/base/Container";
import type Content from "sap/ui/mdc/valuehelp/base/Content";
import type FilterableListContent from "sap/ui/mdc/valuehelp/base/FilterableListContent";
import type MTable from "sap/ui/mdc/valuehelp/content/MTable";
import FilterType from "sap/ui/model/FilterType";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { Value } from "../field/FieldBaseDelegate";
import type { AdditionalValueType,BindingInfoParameters } from "../internal/valuehelp/AdditionalValueHelper";
import { AdditionalValueGroupKey,additionalValueHelper } from "../internal/valuehelp/AdditionalValueHelper";

const FeCoreControlsFilterBar = "sap.fe.macros.controls.FilterBar";
const AnnotationIsDigitSequence = "@com.sap.vocabularies.Common.v1.IsDigitSequence";

export type ConditionObjectMap = Record<string, ConditionObject[]>;

export type ExternalStateType = {
	items: { name: string }[];
	filter: ConditionObjectMap;
};

export type ConditionPayloadType = Record<string, string | boolean>;

export type ConditionPayloadMap = Record<string, ConditionPayloadType[]>;

type MDCConfigType = {
	value: unknown;
	parsedValue: unknown;
	context: object;
	control: Control; // Instance of the calling control
	bindingContext: ODataV4Context;
	checkKey: boolean;
	checkDescription: boolean;
};

export default Object.assign({}, ValueHelpDelegate, {
	apiVersion: 2,
	updateBindingDonePromises: new WeakMap<object, Promise<void>>(),

	/**
	 * Checks if a <code>ListBinding</code> supports $Search.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content Content element
	 * @param _listBinding
	 * @returns True if $search is supported
	 */
	isSearchSupported: function (valueHelp: ValueHelp, content: FilterableListContent, _listBinding: ODataListBinding) {
		return !!content.data("searchSupported");
	},

	/*
	 * Adjustable filtering for list-based contents.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content requesting conditions configuration
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 */
	updateBindingInfo: function (valueHelp: ValueHelp, content: FilterableListContent, bindingInfo: BaseAggregationBindingInfo) {
		ValueHelpDelegate.updateBindingInfo(valueHelp, content, bindingInfo);

		if (content.data("searchSupported")) {
			const search = content.getFilterValue();
			const normalizedSearch = CommonUtils.normalizeSearchTerm(search); // adjustSearch

			if (bindingInfo.parameters) {
				(bindingInfo.parameters as Record<string, unknown>).$search = normalizedSearch || undefined;
			}
		}
	},

	/**
	 * Get the value help history service from the app component.
	 * @param control Control to find the app component
	 * @returns ValueHelpHistoryService
	 */
	_getValueHelpHistoryService(control: Control): ValueHelpHistoryService {
		// For some reason we cannot use CommonUtils.getAppComponent(control) here but need to get the View first.
		const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(control));
		return appComponent.getValueHelpHistoryService();
	},

	/**
	 * Get the history data for the value list property from the history service.
	 * No history data is fetched for fields annotated with IsPotentiallySensitive.
	 * @param payload Payload for ValueHelp
	 * @param control Control to find the app component, e.g. the field
	 * @returns Promise which is resolved to a list of field data for the value list property
	 */
	_getHistoryData: async function (payload: ValueHelpPayload, control: Control): Promise<FieldDataType[]> {
		if (payload.history?.enabled && payload.isPotentiallySensitive !== true) {
			const valueListHistoryService = this._getValueHelpHistoryService(control);
			try {
				const fieldData = await valueListHistoryService.getFieldData(payload.propertyPath + "/" + payload.valueHelpQualifier);
				payload.history.data = fieldData;
				return fieldData;
			} catch (err) {
				Log.error(err instanceof Error ? err.message : String(err));
			}
		}
		return [];
	},

	/**
	 * Set the history data for the value list property in the history service.
	 * No history data is stored for fields annotated with IsPotentiallySensitive.
	 * @param payload Payload for ValueHelp
	 * @param conditions The condition object to get the selected data from
	 * @param control Control to find the app component, e.g. the field
	 * @returns Promise which is resolved when the data is set in the history service
	 */
	_setHistoryData: async function (payload: ValueHelpPayload, conditions: ConditionObject[], control: Control): Promise<void> {
		if (payload.history?.enabled && payload.isPotentiallySensitive !== true && conditions.length) {
			const valueListProperty = this._getValueListPropertyFromPayloadQualifier(payload);
			if (valueListProperty) {
				const data: FieldDataType[] = [];

				for (const condition of conditions) {
					if (payload.isUnitValueHelp || condition.validated === ConditionValidated.Validated) {
						const conditionPayloadMap = this._getConditionPayloadList(condition)?.[0];
						if (conditionPayloadMap) {
							data.push(this.convertConditionPayloadToNestedObject(conditionPayloadMap));
						}
					}
				}

				if (data.length) {
					const valueListHistoryService = this._getValueHelpHistoryService(control);

					try {
						await valueListHistoryService.setFieldData(payload.propertyPath + "/" + payload.valueHelpQualifier, data);
					} catch (err) {
						Log.error(err instanceof Error ? err.message : String(err));
					}
				}
			}
		}
	},

	/**
	 * Converting the condition payload to a nested object.
	 * @param conditionPayload The condition payload object to be converted
	 * @returns The converted nested object
	 */
	convertConditionPayloadToNestedObject: function (conditionPayload: ConditionPayloadType): ConditionPayloadType {
		const nestedObject: ConditionPayloadType = {};
		for (const key in conditionPayload) {
			ObjectPath.set(key.split("/"), conditionPayload[key], nestedObject);
		}
		return nestedObject;
	},

	/**
	 * Checks if field is recommendation relevant and calls either _updateBinding or _updateBindingForRecommendations.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param content Filterable List Content
	 */
	updateBinding: async function (
		valueHelp: ValueHelp,
		listBinding: ODataListBinding,
		bindingInfo: BaseAggregationBindingInfo,
		content: MTable
	): Promise<void> {
		// listBinding should be of type ODataListBinding
		if (!listBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			return;
		}

		//We fetch the valuelist property from the payload to make sure we pass the right property while making a call on valuelist entity set
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		if (content.isTypeahead()) {
			let updateBindingDonePromiseResolve: (() => void) | undefined;

			// create a promise to make sure checkListBindingPending is only completed once this promise is resolved
			const newPromise = new Promise<void>(function (resolve) {
				updateBindingDonePromiseResolve = resolve;
			});

			const existingUpdateBindingDonePromise = this.updateBindingDonePromises.get(listBinding);
			//build a promise chain if necessary
			this.updateBindingDonePromises.set(
				listBinding,
				existingUpdateBindingDonePromise ? existingUpdateBindingDonePromise.then(async () => newPromise) : newPromise
			);

			const valueListProperty = this._getValueListPropertyFromPayloadQualifier(payload);
			const field = content.getControl() as FilterField | MultiValueField | Field;
			const isFilterFieldOrMultiValuedField =
				field.isA<FilterField>("sap.ui.mdc.FilterField") || field.isA<MultiValueField>("sap.ui.mdc.MultiValueField");
			const fieldValue = !isFilterFieldOrMultiValuedField && field.getValue();
			const additionalValues: AdditionalValueType[] = [];

			// We need to show recommendations only when the field has empty value or when user is typing a value. Other times we should not show recommendations.
			// Check if the field has any pending user input and if it is then we show recommendations if any.
			const isDigitSequence =
				(field.getModel() as ODataModel).getMetaModel().getObject(`${payload.propertyPath}${AnnotationIsDigitSequence}`) ?? false;
			if (!fieldValue || field.hasPendingUserInput() || (isDigitSequence && fieldValue === "0")) {
				//get the recommendation data from the internal model
				const values = this.getRelevantRecommendations(content, payload);

				//if there are relevant recommendations then create additional value structure and call _updateBindingForRecommendations
				if (values.length) {
					additionalValues.push({ propertyPath: valueListProperty, values, groupKey: AdditionalValueGroupKey.recommendation });
				}
			}

			const sortersCustomData = content
				.getTable()
				.getCustomData()
				.filter((data) => data.getKey() === "sorters");
			let sorters: SorterType[] = [];
			if (sortersCustomData.length) sorters = sortersCustomData[0].getValue().sorters;

			await this._updateBindingWithTransientContexts(
				payload,
				listBinding,
				bindingInfo,
				additionalValues,
				valueListProperty,
				field,
				sorters
			);
			if (updateBindingDonePromiseResolve) {
				//resolve the promise as everything is completed
				updateBindingDonePromiseResolve();
			}
		} else {
			//call _updateBinding if there are no relevant recommendations
			this._updateBinding(listBinding, bindingInfo);
		}
	},
	/**
	 * Executes a filter in a <code>ListBinding</code>.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding List binding
	 * @param requestedItems Number of requested items
	 * @returns Promise that is resolved if search is executed
	 */
	executeFilter: async function (valueHelp: ValueHelp, listBinding: ODataListBinding, requestedItems: number) {
		listBinding.getContexts(0, requestedItems);

		await this.checkListBindingPending(valueHelp, listBinding, requestedItems);
		return listBinding;
	},

	/**
	 * Checks if the <code>ListBinding</code> is waiting for an update.
	 * As long as the context has not been set for <code>ListBinding</code>,
	 * <code>ValueHelp</code> needs to wait.
	 * @param _valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding ListBinding to check
	 * @param requestedItems Number of requested items
	 * @returns Promise that is resolved once ListBinding has been updated
	 */
	checkListBindingPending: async function (_valueHelp: ValueHelp, listBinding: ODataListBinding | undefined, requestedItems: number) {
		let isPending = false;
		if (listBinding && this.updateBindingDonePromises.has(listBinding)) {
			await this.updateBindingDonePromises.get(listBinding);
		}
		if (listBinding && !listBinding.isSuspended()) {
			try {
				const contexts = await listBinding.requestContexts(0, requestedItems);
				isPending = contexts.length === 0;
			} catch (error: unknown) {
				if (error && (error as { canceled?: boolean })?.canceled) {
					return isPending;
				}
				throw error;
			}
		}
		return isPending;
	},

	getTypeMap: function (_valueHelp: ValueHelp) {
		return TypeMap;
	},

	/**
	 * Requests the content of the value help.
	 *
	 * This function is called when the value help is opened or a key or description is requested.
	 *
	 * So, depending on the value help content used, all content controls and data need to be assigned.
	 * Once they are assigned and the data is set, the returned <code>Promise</code> needs to be resolved.
	 * Only then does the value help continue opening or reading data.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param container Container instance
	 * @param contentId Id of the content shown after this call to retrieveContent
	 * @returns Promise that is resolved if all content is available
	 */
	retrieveContent: async function (valueHelp: ValueHelp, container: Container, contentId: string) {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		return ValueListHelper.showValueList(payload, container, contentId);
	},

	_getConditionPayloadList: function (condition: ConditionObject) {
		const conditionPayloadMap = (condition.payload || {}) as ConditionPayloadMap,
			valueHelpQualifiers = Object.keys(conditionPayloadMap),
			conditionPayloadList = valueHelpQualifiers.length ? conditionPayloadMap[valueHelpQualifiers[0]] : [];

		return conditionPayloadList;
	},
	/**
	 * Returns ValueListProperty from Payload based on data from payload keys and parameters.
	 * @param payload Payload for delegate
	 * @returns ValueListProperty
	 */
	_getValueListPropertyFromPayloadQualifier: function (payload: ValueHelpPayload) {
		const params = payload.qualifiers[payload.valueHelpQualifier]?.vhParameters || [];
		const keys = payload.qualifiers[payload.valueHelpQualifier]?.vhKeys || [];
		const propertyKeyPath = payload.valueHelpKeyPath;
		let filteredKeys: string[] = [...keys];
		const helpPaths: string[] = [];
		if (params.length > 0) {
			//create helpPaths array which will only consist of params helppath
			params.forEach(function (param: InOutParameter) {
				helpPaths.push(param.helpPath);
			});
			//filter the keys based on helpPaths. If key is not present in helpPath then it is valuelistproperty
			filteredKeys = keys.filter((key: string) => {
				return !helpPaths.includes(key);
			});
		}

		// from filteredKeys return the key that matches the property name
		return propertyKeyPath && filteredKeys.includes(propertyKeyPath) ? propertyKeyPath : "";
	},

	_onConditionPropagationToFilterBar: async function (
		conditions: ConditionObject[],
		outParameters: InOutParameter[],
		filterBar: FilterBar,
		payload: ValueHelpPayload,
		listReportFilterBar: FilterBar
	) {
		try {
			const state: ExternalStateType = await StateUtil.retrieveExternalState(listReportFilterBar);
			const stateItems = state.items; // Visible FilterItems in the LR-FilterBar
			const filterBarProperties = FilterUtils.getFilterPropertyInfo(filterBar as unknown as IFilterControl);
			const metaModel = filterBar.getModel()?.getMetaModel() as ODataMetaModel;
			// Propagate OUT parameter only if the filter field is visible in the LR filterbar
			// LR FilterBar or LR AdaptFilter
			for (const outParameter of outParameters) {
				const filterBarProperty = this._findFilterBarPropertyByAnnotationPath(
					outParameter,
					payload.propertyPath,
					metaModel,
					filterBarProperties
				);
				if (filterBarProperty && stateItems?.find((item) => item.name === filterBarProperty.name)) {
					/* Reset the conditions before create new conditions otherwise it gets not updated */
					const conditionPath = filterBarProperty.conditionPath as string;
					state.filter[conditionPath]?.forEach((condition) => {
						condition.filtered = false;
					});
				}
			}
			// Propagate OUT parameter for each conditions
			for (const condition of conditions) {
				const conditionPayloadList = this._getConditionPayloadList(condition);
				for (const outParameter of outParameters) {
					const filterBarProperty = this._findFilterBarPropertyByAnnotationPath(
						outParameter,
						payload.propertyPath,
						metaModel,
						filterBarProperties
					);
					// Propagate OUT parameter only if the filter field is visible in the LR filterbar
					// LR FilterBar or LR AdaptFilter
					if (filterBarProperty && stateItems?.find((item) => item.name === filterBarProperty.name)) {
						for (const conditionPayload of conditionPayloadList) {
							const newCondition = Condition.createCondition(
								"EQ",
								[conditionPayload[outParameter.helpPath]],
								null,
								null,
								ConditionValidated.Validated
							);
							const conditionPath = filterBarProperty.conditionPath as string;
							const conditionAlreadyExists = state.filter[conditionPath]?.find((testCondition) => {
								delete testCondition.filtered;
								if (deepEqual(testCondition, newCondition)) {
									return true;
								}
								// reset filtered to false
								testCondition.filtered = false;
								return false;
							});
							if (!conditionAlreadyExists) {
								state.filter[conditionPath] ||= [];
								state.filter[conditionPath].push(newCondition);
							}
						}
					}
				}
			}
			// Apply to the parent of the FilterField
			StateUtil.applyExternalState(filterBar, state);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`ValueHelpDelegate: ${message}`);
		}
	},

	_findFilterBarPropertyByAnnotationPath: function (
		outParameter: InOutParameter,
		propertyPath: string,
		metaModel: ODataMetaModel,
		filterBarProperties: PropertyInfo[]
	) {
		const contextPath = `/${propertyPath.split("/")[1]}`;
		const filterTarget = outParameter.source.split("conditions/").pop() || "";
		const lastIndex = propertyPath.lastIndexOf("/");
		const filterTargetPath = lastIndex > 0 ? `${propertyPath.substring(0, lastIndex)}/${filterTarget}` : filterTarget;
		const annotationPath = metaModel?.getReducedPath(filterTargetPath, contextPath);
		return filterBarProperties.find((item) => item.annotationPath === annotationPath);
	},

	_onConditionPropagationToBindingContext: function (
		conditions: ConditionObject[],
		outParameters: InOutParameter[],
		context: ODataV4Context,
		valueHelp: ValueHelp
	) {
		const metaModel = context.getModel().getMetaModel();

		for (const condition of conditions) {
			const conditionPayloadList = this._getConditionPayloadList(condition),
				outValues = conditionPayloadList.length === 1 ? conditionPayloadList[0] : undefined;

			if (conditionPayloadList.length > 1) {
				Log.warning("ValueHelpDelegate: ParameterOut in multi-value-field not supported");
			}
			if (outValues) {
				this._onConditionPropagationUpdateProperty(metaModel, outValues, outParameters, context, valueHelp);
			}
		}
	},

	_onConditionPropagationUpdateProperty: function (
		metaModel: ODataMetaModel,
		outValues: ConditionPayloadType,
		outParameters: InOutParameter[],
		context: ODataV4Context,
		valueHelp: ValueHelp
	) {
		const convertedMetadata = convertTypes(metaModel);
		const rootPath = metaModel.getMetaContext(context.getPath()).getPath();
		const contextCanRequestSideEffects = context.isTransient() !== true && !context.isInactive();
		const outParameterSources: string[] = [];
		for (const outParameter of outParameters) {
			/* Updated property via out-parameter if value changed */
			if (context.getProperty(outParameter.source) !== outValues[outParameter.helpPath]) {
				this._updatePropertyViaOutParameter(
					convertedMetadata,
					rootPath,
					outValues,
					outParameter,
					context,
					contextCanRequestSideEffects
				);
			}
			outParameterSources.push(outParameter.source);
		}
		const view = CommonUtils.getTargetView(valueHelp);
		const collaborativeDraft = view.getController().collaborativeDraft;
		if (collaborativeDraft.isConnected()) {
			// we determine the binding that sends the request
			let binding;
			if (context.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding")) {
				binding = context.getBinding();
			} else {
				binding = view.getBindingContext().getBinding();
			}
			/* The out values have been changed --> wait until the request is sent to the server before sending a notification to the other collaborators
							 We attach the event on the right binding */
			binding.attachEventOnce("patchCompleted", () => {
				collaborativeDraft.send({
					action: Activity.Change,
					content: outParameterSources.map((source) => context.getPath() + "/" + source)
				});
			});
		}
	},

	_updatePropertyViaOutParameter: function (
		convertedMetadata: ConvertedMetadata,
		rootPath: string,
		outValues: ConditionPayloadType,
		outParameter: InOutParameter,
		context: ODataV4Context,
		contextCanRequestSideEffects: boolean
	) {
		/* Updated property via out-parameter if value changed */
		const propertyPath = `${rootPath}/${outParameter.source}`;
		const targetProperty = convertedMetadata.resolvePath<Property>(propertyPath).target;
		const fieldControl = targetProperty?.annotations?.Common?.FieldControl;
		const dynamicReadOnly = isPathAnnotationExpression(fieldControl) ? context.getProperty(fieldControl.path) === 1 : false;
		if (dynamicReadOnly && contextCanRequestSideEffects) {
			/* Non-Transient and active context */
			const lastIndex = outParameter.source.lastIndexOf("/");
			const sideEffectPath = lastIndex > 0 ? outParameter.source.substring(0, lastIndex) : outParameter.source;
			/* We send [<propertyName>] in case of a property path without any navigation involved */
			/* In case of a path involving navigations, we send [<navigationPath>] ending with a navigation property and not with a property */
			context.requestSideEffects([sideEffectPath]);
		} else {
			/* The fast creation row (transient context) can´t have instant specific (dynamic) read-only fields, therefore we don´t need to handle/consider this case specifically */
			/* Additional infos: */
			/* The fast creation row is only used by SD */
			/* The group ID (third argument of setProperty described api documentation of the Context) is used for the PATCH request, if not specified, the update group ID for the context's binding is used, 'null' to prevent the PATCH request */
			/* The Transient context cannot request SideEffects and  cannot patch via group 'null' */
			context.setProperty(outParameter.source, outValues[outParameter.helpPath]);
		}
		/* If the key gets updated via out-parameter, then the description needs also retrieved with requestSideEffects */
		const textPath = isPathAnnotationExpression(targetProperty?.annotations?.Common?.Text)
			? targetProperty?.annotations?.Common?.Text.path
			: undefined;
		if (textPath !== undefined && contextCanRequestSideEffects) {
			const lastIndex = textPath.lastIndexOf("/");
			const sideEffectPath = lastIndex > 0 ? textPath.substring(0, lastIndex) : textPath;
			/* The sideEffectPath can be [<propertyName>] or [<navigationPath>] */
			context.requestSideEffects([sideEffectPath]);
		}
	},

	/**
	 * Provides a map of conditions for the following situations:
	 * Initial set of conditions applied every time value help content is shown for the first time since opening its container.
	 * Detailed set of conditions in getItemForValue scenarios that allow you to find a specific value help item (indicated by config availability).
	 * @param valueHelp The ValueHelp control instance
	 * @param content ValueHelp content instance
	 * @param config Configuration object
	 * @returns Returns a promise resolving to a map of conditions
	 */
	getFilterConditions: function (valueHelp: ValueHelp, content: Content, config?: MDCConfigType) {
		if (this.getInitialFilterConditions) {
			return this.getInitialFilterConditions(valueHelp, content, (config && config.control) || (content && content.getControl()));
		}
		return {};
	},

	/**
	 * Callback invoked every time a {@link sap.ui.mdc.ValueHelp ValueHelp} fires a select event or the value of the corresponding field changes
	 * This callback may be used to update external fields.
	 * @param valueHelp ValueHelp control instance receiving the <code>controlChange</code>
	 * @param reason Reason why the method was invoked
	 * @param _config Current configuration provided by the calling control
	 * @since 1.101.0
	 */
	onConditionPropagation: async function (valueHelp: ValueHelp, reason: string, _config: unknown) {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		if (reason !== "ControlChange" || payload.isDefineConditionValueHelp) {
			// handle only ControlChange reason
			// also don't handle for define condition value help as propagating conditions on the value help
			// to define conditions does not make sense but would only confuse users by allowing recursive use
			// of the condition value help
			return;
		}
		const qualifier = payload.qualifiers[payload.valueHelpQualifier];
		const outParameters = qualifier?.vhParameters !== undefined ? ValueListHelper.getOutParameters(qualifier.vhParameters) : [],
			field = valueHelp.getControl() as FieldBase,
			fieldParent = field.getParent() as FilterBarBase | Control;

		let conditions = field.getConditions() as ConditionObject[];
		if (!payload.isValueListWithFixedValues) {
			this._setHistoryData(payload, conditions, field);
		}
		conditions = conditions.filter(function (condition) {
			const conditionPayloadMap = (condition.payload || {}) as ConditionPayloadMap;
			return conditionPayloadMap[payload.valueHelpQualifier];
		});

		const listReportFilterBar = field.getParent() as FilterBarBase | Control; // Control e.g. FormContainer
		if (listReportFilterBar.isA(FeCoreControlsFilterBar) && outParameters.length && conditions.length) {
			// Propagate the value only if the FilterField is part of the LR-FilterBar also inside in Adapt Filters dialog
			await this._onConditionPropagationToFilterBar(
				conditions,
				outParameters,
				fieldParent as FilterBar,
				payload,
				listReportFilterBar as FilterBar
			);
			// LR Settings Dialog or OP Settings Dialog shall not propagate value to the dialog filterfields or context
		} else {
			// Object Page
			/* To avoid timing issue we use the BindingContext of the control instead of the ValueHelp (BCP 2380057227) */
			const context = field.getBindingContext() as ODataV4Context | undefined;
			if (context) {
				const metaModel = (field.getModel() as ODataMetaModel).getMetaModel();
				const propertyName = metaModel?.getObject(`${payload.propertyPath}@sapui.name`);
				const condition = conditions.length > 0 ? conditions[0] : ({} as ConditionObject);
				const payloadKeys = condition?.payload ? Object.keys(condition.payload) : [];
				payloadKeys.forEach((payloadKey) => {
					const conditionPayloadMap = condition.payload as ConditionPayloadMap | undefined;
					const conditionPayload = conditionPayloadMap?.[payloadKey]?.[0] || {};
					const conditionValuekeys = Object.keys(conditionPayload);
					const conditionValuekey = conditionValuekeys.find((valueKey) => valueKey.includes("@$ui5.fe.@Common/ExternalID"));
					if (conditionValuekey) {
						const keyValue = conditionPayload[conditionValuekey];
						context.setProperty(propertyName, keyValue);
					}
				});
				this._onConditionPropagationToBindingContext(conditions, outParameters, context, valueHelp);
			}
		}
	},

	/**
	 * Creates an initial filter condition based on the provided value and flag indicating if the initial value is significant.
	 * @param value The value for the filter condition.
	 * @param initialValueIsSignificant Flag indicating if the initial value is significant.
	 * @returns The filter condition.
	 */
	_createInitialFilterCondition: function (value: Value, initialValueIsSignificant: boolean) {
		let condition: ConditionObject | undefined;

		if (value === undefined) {
			Log.error("ValueHelpDelegate: value of the property could not be requested");
		} else if ((value === "" || value === null) && initialValueIsSignificant) {
			condition = Condition.createCondition("Empty", [], null, null, ConditionValidated.Validated);
		} else if (value !== undefined && value !== "" && value !== null) {
			condition = Condition.createCondition("EQ", [value], null, null, ConditionValidated.Validated);
		}
		return condition;
	},

	_getInitialFilterConditionsFromBinding: async function (
		inConditions: ConditionObjectMap,
		control: Control,
		inParameters: InOutParameter[],
		payload: ValueHelpPayload
	) {
		const bindingContext = control.getBindingContext() as ODataV4Context | undefined;
		if (!bindingContext) {
			Log.error("ValueHelpDelegate: No BindingContext");
			return inConditions;
		}
		const metaModel = control.getModel()?.getMetaModel() as ODataMetaModel;
		const rootPath = metaModel.getMetaPath(bindingContext.getPath());
		let propertiesToRequest = inParameters.map((inParameter) => inParameter.source);
		/* In case of action parameter dialog, which can be identified by the path "$Parameter", the binding context is always relative to the in-parameters. */
		/* We need to request the in-parameter values relative to the binding context.
In some cases (e.g. multi value field), the binding context does not point to the
VH annotation target, thus we identify the needed navigation relation by
reducing the payload.propertyPath by the path derived from binding context.
This cannot happen in case of action parameter dialog, which can be identified by the path "$Parameter".
*/

		// Check whether the filter property with navigation path exists, otherwise the metadata are not well defined
		let metaDataError = false;
		const propertyName = payload.propertyPath.split("/").pop();
		let navigationPropertyPath;
		let navigationProperty;

		//For a VH on an action dialog parameter the following code would fill navigationPropertyPath
		//with the action even though no navigation property exists -> leave navigationPropertyPath empty
		if (bindingContext.getBinding().getPath() !== "$Parameter") {
			navigationPropertyPath = payload.propertyPath.replace(`/${propertyName}`, "");
			navigationProperty = metaModel.getObject(navigationPropertyPath);
		}

		if (control.isA("sap.ui.mdc.MultiValueField") && navigationProperty && navigationProperty.$Partner === undefined) {
			//Case mdc.MultiValueField: the $Partner (association to one) is a precondition to request the filter value
			//Exception: When the MultiValueField is an action parameter then the context of the action is used to fill the in parameter and
			//no $Partner association is needed. For such cases navigationPropertyPath is no filled
			Log.error(
				`ValueHelpDelegate: Because of missing partner definition, the filter value for ValueListParameterIn property can not requested.`
			);
			metaDataError = true;
		} else if (navigationProperty && navigationProperty.$kind === "NavigationProperty" && navigationProperty.$Partner !== undefined) {
			propertiesToRequest = this._buildPropertiesToRequest(propertiesToRequest, rootPath, metaModel, payload.propertyPath);
		}
		if (!metaDataError) {
			// UpdateGroupId is $auto is used in case of creation row.
			// UpdateGroupId is submitLater in case of create dialog.
			// We need to consider the case of isInactive context, which is not yet created.
			const contextUnderCreation =
				bindingContext.isTransient() === true &&
				!bindingContext.isInactive() &&
				bindingContext.getUpdateGroupId()?.startsWith("$auto");
			// We await creation if it is still in process.
			if (contextUnderCreation) {
				await bindingContext?.created();
			}
			// According to odata v4 api documentation for requestProperty: Property values that are not cached yet are requested from the back end
			const values = await bindingContext.requestProperty(propertiesToRequest);

			for (let i = 0; i < inParameters.length; i++) {
				const inParameter = inParameters[i];
				const condition = this._createInitialFilterCondition(values[i], inParameter.initialValueIsSignificant);

				if (condition) {
					inConditions[inParameter.helpPath] = [condition];
				}
			}
		}
		return inConditions;
	},

	_buildPropertiesToRequest: function (propertiesToRequest: string[], rootPath: string, metaModel: ODataMetaModel, propertyPath: string) {
		/*
				The inParameters are defined according to the value help definition, i.e. their source is a path relative to the annotation target (or more precisely the EntitySet the annotation target belongs to). The annotation target is the property the value help is defined for.
				To request the values for the inParameters from the bindingContext (the control is bound to), we need to translate this to a path relative to the bindingContext. This differs, if the field is not defined for a direct property, but with a path containing one or more navigation properties (esp. necessary to define multi value fields).
				To make this translation possible, the payload provides the propertyPath, which is an absolute metaPath to the property (i.e. including the corresponding metaPath for the binding context and the additional path the property is bound to).

				So far, this means we have to remove the corresponding metaPath of the bindingContext from the left side, and the last segment (the property itself) from the the right side of the propertyPath provided in the payload, to get a metaPath from the binding context to the annotation target.
				If this metaPath contains 1:n-navigations (which cannot be translated back to a path, as this would mean to add corresponding keys, which are not known), the source path in the inParameter definition of the value needs to point back using the corresponding partner navigation(s) to avoid ambiguous definition of how to get its value.
				Thus, we can and need to match and reduce the parts of this relative metaPath from the right side against the corresponding parts of the inParameters source definition from the left side by checking whether they are corresponding partner navigations. When we are done (no more parts in reduced relative metaPath, no more parts in reduced inParameter source path, or most right part in reduced relative metaPath is not the partner of most left part in reduced inParameter source), neither reduced relative metaPath nor reduced inParameter source path may contain any 1:n-navigation properties.
				If this condition is fulfilled, we can combine the and request from the given binding context. If not, the value help definition does not allow to retrieve the inParameters value in an unambiguous way, i.t. the value help is not defined correctly.
				*/
		// common for all inParameters
		let metaModelContext = metaModel.createBindingContext(rootPath) as ODataV4Context;
		const relativePathParts = propertyPath
			.slice(rootPath.length) // remove root path
			.split("/") // transform to array
			.slice(1, -1) // remove first (empty, as rootPath provided without ending "/"), and last (property the VH is attached to) part
			.map((part) => {
				// determine navigation property name and corresponding partner for each navigation step
				metaModelContext = metaModel.createBindingContext(part, metaModelContext) as ODataV4Context;
				return {
					part: part,
					partner: metaModelContext.getObject().$Partner
				};
			});
		// actual reduction per inParameter
		return propertiesToRequest.map((localDataPath) => {
			const localDataParts = localDataPath.split("/");
			const matchCount = localDataParts.findIndex(
				(
					part,
					index // find first non-matching index
				) => relativePathParts[-index]?.partner !== part
			); // relativePathParts to match from the end (=> "-index") to localDataParts from the beginning
			// last part of localData is a property name, thus it cannot match. Otherwise matchCount could be -1 if everything matches
			// (if we want to additionally secure against this situation, the most appropriate would be to set matchCount = localDataParts.length – 1)
			return relativePathParts
				.slice(0, -matchCount) // remove all matched parts (from the end)
				.map((part) => part.part)
				.concat(localDataParts.slice(matchCount)) // remove the matched parts from localData (from the beginning)
				.join("/"); // transfer back to string (but only once at the end ;) )
		});
	},

	_getInitialFilterConditionsFromFilterBar: async function (
		inConditions: ConditionObjectMap,
		control: Control,
		inParameters: InOutParameter[],
		payload: ValueHelpPayload
	) {
		const filterBar = control.getParent() as FilterBarBase;
		const filterBarProperties = FilterUtils.getFilterPropertyInfo(filterBar as unknown as IFilterControl);
		const state: ExternalStateType = await StateUtil.retrieveExternalState(filterBar);
		const metaModel = (filterBar.getModel() as ODataModel).getMetaModel();
		for (const inParameter of inParameters) {
			const filterBarProperty = this._findFilterBarPropertyByAnnotationPath(
				inParameter,
				payload.propertyPath,
				metaModel,
				filterBarProperties
			);
			const sourceField = filterBarProperty ? filterBarProperty.conditionPath : inParameter.source.split("conditions/").pop();

			const conditions = this._getConditionsFromInParameter(sourceField as string, state);
			if (conditions) {
				inConditions[inParameter.helpPath] = conditions;
			}
		}
		return inConditions;
	},

	/**
	 * Returns the filter conditions.
	 * Regarding a navigation path in the InOut parameters and disregarding prefixes in the navigation path like e.g. '$filters>/conditions/' or 'owner'.
	 * @param sourceField InParameter property of the filter field value help
	 * @param state The external filter state
	 * @returns The filter conditions
	 * @since 1.114.0
	 */
	_getConditionsFromInParameter: function (sourceField: string, state: ExternalStateType) {
		const key = Object.keys(state.filter).find((key) => key === sourceField); // condition path of the filter field
		return key && state.filter[key];
	},

	_partitionInParameters: function (inParameters: InOutParameter[]) {
		const inParameterMap: Record<string, InOutParameter[]> = {
			constant: [],
			binding: [],
			filter: []
		};

		for (const inParameter of inParameters) {
			if (inParameter.constantValue !== undefined) {
				inParameterMap.constant.push(inParameter);
			} else if (inParameter.source.indexOf("$filter") === 0) {
				inParameterMap.filter.push(inParameter);
			} else {
				inParameterMap.binding.push(inParameter);
			}
		}
		return inParameterMap;
	},

	_tableAfterRenderDelegate: {
		onAfterRendering: function (event: jQuery.Event & { srcControl: Control }) {
			const table = event.srcControl, // m.Table
				tableCellsDomRefs = table.$().find("tbody .sapMText"),
				mdcMTable = table.getParent() as MTable;

			highlightDOMElements(tableCellsDomRefs, mdcMTable.getFilterValue(), true);
		}
	},

	/**
	 * Provides an initial condition configuration everytime a value help content is shown.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content requesting conditions configuration
	 * @param control Instance of the calling control
	 * @returns Returns a map of conditions suitable for a sap.ui.mdc.FilterBar control
	 * @since 1.101.0
	 */
	getInitialFilterConditions: async function (valueHelp: ValueHelp, content: Content, control: Control | undefined) {
		// highlight text in ValueHelp popover
		if (content?.isA<MTable>("sap.ui.mdc.valuehelp.content.MTable")) {
			const popoverTable = content.getTable();
			popoverTable?.removeEventDelegate(this._tableAfterRenderDelegate);
			popoverTable?.addEventDelegate(this._tableAfterRenderDelegate, this);
		}

		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const inConditions: ConditionObjectMap = {};

		// For define conditions valuehelp initial filter conditions are not supported, because the control of the define conditions
		// is cloned and not the original one to which field valuehelp was attached. And as a result we cannot get in parameter value. For simplicity
		// we just skip the rest of the code related to filter conditions.
		if (payload.isDefineConditionValueHelp) {
			return inConditions;
		}

		if (!control) {
			Log.error("ValueHelpDelegate: Control undefined");
			return inConditions;
		}

		const qualifier = payload.qualifiers[payload.valueHelpQualifier];
		const inParameters = qualifier?.vhParameters !== undefined ? ValueListHelper.getInParameters(qualifier.vhParameters) : [];
		const inParameterMap = this._partitionInParameters(inParameters);
		const isObjectPage = control.getBindingContext();

		for (const inParameter of inParameterMap.constant) {
			const condition = this._createInitialFilterCondition(
				inParameter.constantValue,
				isObjectPage ? inParameter.initialValueIsSignificant : false // no filter with "empty" on ListReport
			);
			if (condition) {
				inConditions[inParameter.helpPath] = [condition];
			}
		}

		if (inParameterMap.binding.length) {
			await this._getInitialFilterConditionsFromBinding(inConditions, control, inParameterMap.binding, payload);
		}

		if (inParameterMap.filter.length) {
			await this._getInitialFilterConditionsFromFilterBar(inConditions, control, inParameterMap.filter, payload);
		}
		return inConditions;
	},

	/**
	 * Provides the possibility to convey custom data in conditions.
	 * This enables an application to enhance conditions with data relevant for combined key or outparameter scenarios.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content instance
	 * @param _values Description pair for the condition which is to be created
	 * @param context Optional additional context
	 * @returns Optionally returns a serializable object to be stored in the condition payload field
	 * @since 1.101.0
	 */
	createConditionPayload: function (
		valueHelp: ValueHelp,
		content: Content,
		_values: unknown[],
		context: ODataV4Context
	): ConditionPayloadMap | undefined {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const qualifier = payload.qualifiers[payload.valueHelpQualifier],
			entry: ConditionPayloadType = {},
			conditionPayload: ConditionPayloadMap = {};
		const control = content.getControl();
		const isMultiValueField = control?.isA("sap.ui.mdc.MultiValueField");

		/* EXTERNALID: we add the value of the FilterField to the conditionPayload */
		if (payload.externalIdPath && payload.valueHelpKeyPath) {
			const vhKeyProperty = payload.valueHelpKeyPath;
			const vhKeyValue = qualifier.vhKeys && context.getObject(qualifier.vhKeys[0] || vhKeyProperty);
			entry[payload.propertyPath + "@$ui5.fe.@Common/ExternalID"] = vhKeyValue;
			conditionPayload[payload.valueHelpQualifier] = [entry];
		} else if (!qualifier.vhProperties || isMultiValueField) {
			return undefined;
		}
		qualifier.vhProperties?.forEach(function (vhKey) {
			const value = context.getObject(vhKey);
			if (value != null) {
				entry[vhKey] = value?.length === 0 ? "" : value;
			}
		});
		if (Object.keys(entry).length) {
			/* vh qualifier as key for relevant condition */
			conditionPayload[payload.valueHelpQualifier] = [entry];
		}
		return conditionPayload;
	},

	/**
	 * Provides the possibility to customize selections in 'Select from list' scenarios.
	 * By default, only condition keys are considered. This may be extended with payload dependent filters.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content instance
	 * @param context Context of the selected item
	 * @param conditions Current conditions
	 * @returns Conditions or []
	 */
	findConditionsForContext: function (
		valueHelp: ValueHelp,
		content: FilterableListContent,
		context: ODataV4Context,
		conditions: ConditionObject[]
	) {
		//In value help dialogs of single value fields the row for the key shouldn´t be selected/highlight anymore BCP: 2270175246
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		if (payload.isValueListWithFixedValues !== true && (content.getConfig() as { maxConditions?: number })?.maxConditions === 1) {
			return [];
		}
		/* Do not consider "NotValidated" conditions */
		conditions = conditions.filter((condition) => condition.validated === ConditionValidated.Validated);

		const vhKeys = payload.qualifiers[payload.valueHelpQualifier]?.vhKeys || [];
		const keyPath = content.getKeyPath();
		const valueHelpQualifier = payload.valueHelpQualifier || "";
		const selectedCondition = conditions.find(function (condition) {
			if (context?.getObject(keyPath) === condition?.values[0]) {
				const conditionPayloadMap = condition.payload as ConditionPayloadMap;
				const conditionSelectedRow = conditionPayloadMap?.[valueHelpQualifier]?.[0] || {};
				if (vhKeys.length === 1 || payload?.useMultiValueField || !conditionPayloadMap) {
					return context?.getObject(keyPath) === condition?.values[0];
				} else {
					const contextKeys = Object.keys(context.getObject());
					return vhKeys.every(function (vhKey) {
						return !contextKeys.includes(vhKey) || context?.getObject(vhKey) === conditionSelectedRow[vhKey];
					});
				}
			}
		});

		return selectedCondition ? [selectedCondition] : [];
	},

	/**
	 * Creates contexts for additional values and resumes the list binding.
	 * @param payload Payload for delegate
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param additionalValues Array of AdditionalValues
	 * @param valueListProperty ValueListProperty of the payload
	 * @param field Control connected to value help
	 * @param sorters Sorters of the value help list binding
	 */
	_updateBindingWithTransientContexts: async function (
		payload: ValueHelpPayload,
		listBinding: ODataListBinding,
		bindingInfo: BaseAggregationBindingInfo,
		additionalValues: AdditionalValueType[],
		valueListProperty: string,
		field: FilterField | MultiValueField | Field,
		sorters: SorterType[]
	) {
		try {
			await this._updateBindingAttributes(listBinding, bindingInfo, sorters);

			const { recommendationValuesContextData, recentValuesContextData, othersValuesContextData } =
				await this._getRelevantAdditionalValueContextData(
					additionalValues,
					listBinding,
					bindingInfo,
					payload,
					valueListProperty,
					field,
					sorters
				);

			// no grouping should be shown in the suggestion list if the search result only contains values from the 'Others' group
			if (recommendationValuesContextData.length === 0 && recentValuesContextData.length === 0) {
				listBinding.sort();
			}

			if (payload?.history?.enabled) {
				payload.history.hasRelevantData = recentValuesContextData.length !== 0;
			}

			// add transient context to list binding after backend query is done
			additionalValueHelper.createTransientContextsForAdditionalValueContextData(
				recommendationValuesContextData,
				recentValuesContextData,
				othersValuesContextData,
				listBinding
			);
		} catch (error: unknown) {
			//Do nothing as we know that reset changes would throw an error in console and this will pile up a lot of console errors
		}
	},
	/**
	 * Method to change the attributes of the value help, such as sort, filter, parameters etc.
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param sorters Sorters of the value help list binding
	 */
	_updateBindingAttributes: async function (
		listBinding: ODataListBinding,
		bindingInfo: BaseAggregationBindingInfo,
		sorters: SorterType[]
	): Promise<void> {
		const rootBinding = listBinding.getRootBinding() || listBinding;
		if (!rootBinding.isSuspended()) {
			rootBinding.suspend();
		}
		//sort and filter value help binding to make sure we render others group
		additionalValueHelper.sortAndFilterListBinding(listBinding, sorters);
		if (bindingInfo.parameters) {
			listBinding.changeParameters(bindingInfo.parameters);
		}
		//resume the list binding and then reset the changes
		await additionalValueHelper.resumeValueListBindingAndResetChanges(listBinding);
	},
	/**
	 * Method used to determine the final list of all types of additional value context data (recommendation, recently used and others) to be used.
	 * @param additionalValues Array of AdditionalValues
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param payload Payload for delegate
	 * @param valueListProperty ValueListProperty of the payload
	 * @param field Control connected to value help
	 * @param sorters Sorters of the value help list binding
	 * @returns Object which contains recommendation, recently used and others context data.
	 */
	_getRelevantAdditionalValueContextData: async function (
		additionalValues: AdditionalValueType[],
		listBinding: ODataListBinding,
		bindingInfo: BaseAggregationBindingInfo,
		payload: ValueHelpPayload,
		valueListProperty: string,
		field: FilterField | MultiValueField | Field,
		sorters: SorterType[]
	): Promise<{
		recommendationValuesContextData: FieldDataType[];
		recentValuesContextData: FieldDataType[];
		othersValuesContextData: FieldDataType[];
	}> {
		let { recommendationValuesContextData, othersValuesContextData } = await additionalValueHelper.requestForAdditionalValueContextData(
			additionalValues,
			listBinding,
			bindingInfo,
			payload,
			sorters,
			field
		);

		// apply search and filters to additional values context data
		const valueHelpKeys = payload.qualifiers[payload.valueHelpQualifier].vhKeys || [];
		recommendationValuesContextData = additionalValueHelper.getRelevantRecommendationValuesContextData(
			recommendationValuesContextData,
			additionalValues[0]?.values,
			valueListProperty
		);

		let recentValuesContextData: FieldDataType[] = [];
		if (!payload.isValueListWithFixedValues) {
			// no history for values lists with fixed values (they are usually short)
			recentValuesContextData = await this._getHistoryData(payload, field);
			recentValuesContextData = additionalValueHelper.getRelevantRecentValuesContextData(
				othersValuesContextData,
				recentValuesContextData,
				valueHelpKeys,
				(bindingInfo.parameters as BindingInfoParameters).$search?.replaceAll('"', ""),
				bindingInfo
			);
		}

		othersValuesContextData = additionalValueHelper.getRelevantOthersValuesContextData(
			recommendationValuesContextData,
			recentValuesContextData,
			othersValuesContextData,
			valueHelpKeys
		);

		return {
			recommendationValuesContextData,
			recentValuesContextData,
			othersValuesContextData
		};
	},
	/**
	 * Executes a filter in a <code>ListBinding</code> and resumes it, if suspended.
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 */
	_updateBinding: function (listBinding: ODataListBinding, bindingInfo: BaseAggregationBindingInfo) {
		const rootBinding = listBinding.getRootBinding() || listBinding;
		if (!rootBinding.isSuspended()) {
			rootBinding.suspend();
		}
		if (bindingInfo.parameters) {
			listBinding.changeParameters(bindingInfo.parameters);
		}
		listBinding.filter(bindingInfo.filters, FilterType.Application);
		listBinding.sort(bindingInfo.sorter);

		if (rootBinding.isSuspended()) {
			rootBinding.resume();
			rootBinding.resetChanges();
		}
	},
	/**
	 * Returns an boolean value if additionalvalues exists which will contain different groups like recommendations.
	 * @param content Filterable List Content
	 * @param payload Payload for delegate
	 * @param checkRecommendations Defines if we shall check for recommendations
	 * @returns Boolean value
	 */
	_checkIfAdditionalValuesExists: async function (content: MTable, payload: ValueHelpPayload, checkRecommendations = true) {
		// For define conditions valuehelp recommendations are not supported because "internal" model is not available.
		if (payload.isDefineConditionValueHelp) {
			return false;
		}

		const recommendationValues = checkRecommendations ? this.getRelevantRecommendations(content, payload) : [];
		if (recommendationValues?.length > 0) {
			//if there are relevant recommendations then return true
			return true;
		}

		if (payload.history?.enabled) {
			// now check for recent values
			if (payload.history.hasRelevantData !== undefined) {
				return payload.history.hasRelevantData;
			}
			const recentValues = await this._getHistoryData(payload, content.getControl());
			if (recentValues.length) {
				//if there are recently entered values return true
				return true;
			}
		}
		return false;
	},

	/**
	 * Returns the relevant recommendations.
	 * @param content Filterable List Content
	 * @param payload Payload for delegate
	 * @returns Relevant recommendations
	 */
	getRelevantRecommendations(content: MTable, payload: ValueHelpPayload): (string | number)[] {
		let values: (string | number)[] = [];
		const isFilterFieldOrMultiValuedField =
			content.getControl().isA("sap.ui.mdc.FilterField") || content.getControl().isA("sap.ui.mdc.MultiValueField");

		if (!isFilterFieldOrMultiValuedField) {
			const contentModel = content.getModel() as ODataModel & { getLocalAnnotationModel: Function };
			const localAnnotationModel = contentModel.getLocalAnnotationModel && contentModel.getLocalAnnotationModel();
			if (localAnnotationModel) {
				const bindingContextPath = content.getControl().getBindingContext()?.getPath();
				const fieldPath = content.getControl().getBinding("value")?.getPath();
				values = localAnnotationModel.getObject(`${bindingContextPath}/${fieldPath}@$ui5.fe.recommendations.typeAheadValues`) ?? [];
			}
			if (!values.length) {
				const inputValues = (content.getModel("internal") as JSONModel).getProperty("/recommendationsData") || {};
				const bindingContext = content.getBindingContext() as ODataV4Context;
				values =
					additionalValueHelper.getRelevantRecommendations(
						inputValues,
						bindingContext,
						payload.propertyPath,
						content.getControl().getBinding("value")?.getPath()
					) || [];
			}
		}
		return values;
	},

	/**
	 * Returns a boolean value which will tell whether typeahead should be opened or not.
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content Filterable List Content
	 * @returns Boolean value whether to show typeahead or not
	 */
	showTypeahead: async function (valueHelp: ValueHelp, content: MTable) {
		let showIt = true;
		const filterValue = content?.getFilterValue();
		const field = content.getControl() as FilterField | MultiValueField | Field;
		const payload = valueHelp.getPayload() as ValueHelpPayload;

		if (field.isA<FilterField>("sap.ui.mdc.FilterField") || field.isA<MultiValueField>("sap.ui.mdc.MultiValueField")) {
			if (!filterValue) {
				// according to the current recommendation UX we don't check for recommendations but recently entered values only
				showIt = await this._checkIfAdditionalValuesExists(content, payload, false);
			}
		} else {
			const fieldValue = field.getValue();
			const fieldTextValue = field.getAdditionalValue();
			if (fieldValue || fieldTextValue) {
				// valuehelp had some value, but user cleared the value
				// in such case we get input value as '' and we will return false
				//Note: In SDs usecase we wanted to open the typeAhead if there are recommendations and value is blank, they should pass us a flag so that we can handle this accordingly
				const isDigitSequence =
					(field.getModel() as ODataModel).getMetaModel().getObject(`${payload.propertyPath}${AnnotationIsDigitSequence}`) ??
					false;
				if (field.hasPendingUserInput() || (isDigitSequence && fieldValue.match(/^0+$/))) {
					showIt = filterValue !== "" || (await this._checkIfAdditionalValuesExists(content, payload));
				} else {
					// check recently used only
					showIt = await this._checkIfAdditionalValuesExists(content, payload, false);
				}
			} else if (!filterValue) {
				showIt = await this._checkIfAdditionalValuesExists(content, payload);
				// else: the user types, we shall always show the other values
			}
		}
		return showIt;
	},

	shouldOpenOnFocus: async function (valueHelp: ValueHelp, content: MDCPopover) {
		try {
			const parentControl = valueHelp.getControl();
			if (parentControl && parentControl?.isA<FilterField>("sap.ui.mdc.FilterField")) {
				const fieldId = parentControl.getContent()?.getId();
				const isVisualFilter = fieldId ? fieldId.includes("VisualFilter") : false;
				//Visual Filter containing valueHelp should not open on focus for recently selected values o r recommendations
				if (isVisualFilter) {
					return false;
				}
			}

			const valueHelpTable = content?.getContent()[0] as MTable;
			let control: UI5Element | Dialog | undefined;
			const getParentDialog = function (innerContent: UI5Element): Dialog | undefined {
				control = innerContent?.getParent() as UI5Element;
				if (control && control.isA<Dialog>("sap.m.Dialog")) {
					return control;
				} else if (control === undefined || control === null) {
					return undefined;
				}
				return getParentDialog(control);
			};
			control = getParentDialog(content);
			if (
				control &&
				control.data("fe_InitialTypeAheadFocusDone") === null &&
				content.getControl().getDomRef()?.getElementsByTagName("input")[0].id === (control as Dialog).getInitialFocus()
			) {
				control.data("fe_InitialTypeAheadFocusDone", true);
				return false;
			} else {
				const payload = valueHelp.getPayload() as ValueHelpPayload;
				payload.history = payload.history || {};
				payload.history.hasRelevantData = undefined; // needs to be initialize
				payload.history.enabled = payload.history.enabled ?? ValueListHelper.checkHistoryEnabled(valueHelp, payload);
				return await this._checkIfAdditionalValuesExists(valueHelpTable, payload);
			}
		} catch (error: unknown) {
			Log.error(error as string);
		}
	}
});

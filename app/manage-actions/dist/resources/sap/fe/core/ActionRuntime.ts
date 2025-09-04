import type { ActionParameter as EdmActionParameter, PrimitiveType } from "@sap-ux/vocabularies-types";
import merge from "sap/base/util/merge";
import type { PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, transformRecursively } from "sap/fe/base/BindingToolkit";
import type { FEView } from "sap/fe/core/BaseController";
import type { _RequestedProperty } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Label from "sap/m/Label";
import type Event from "sap/ui/base/Event";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type View from "sap/ui/core/mvc/View";
import type Field from "sap/ui/mdc/Field";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type Table from "sap/ui/mdc/Table";
import type MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type FileUploader from "sap/ui/unified/FileUploader";
import AnyElement from "./controls/AnyElement";
import ConverterContext from "./converters/ConverterContext";
import type { BaseManifestSettings } from "./converters/ManifestSettings";
import { getEditButtonEnabled, getHiddenExpression } from "./converters/objectPage/HeaderAndFooterAction";

export type ActionParameterInfo = {
	parameter?: EdmActionParameter;
	field: Field | MultiValueField | FileUploader;
	isMultiValue: boolean;
	value?: string | MultiValueFieldItem[] | Record<string, string>;
	validationPromise?: Promise<string | MultiValueFieldItem[]>;
	hasError: boolean;
	propertyPath?: string;
};

const ActionRuntime = {
	/**
	 * Adds error messages for an action parameter field to the message manager.
	 * @param messageParameters Information identifying an action parameter and messages referring to this parameter
	 */
	_addMessageForActionParameter: function (messageParameters: { actionParameterInfo: ActionParameterInfo; message: string }[]): void {
		Messaging.addMessages(
			messageParameters.map((messageParameter) => {
				const binding = messageParameter.actionParameterInfo.field.getBinding(
					messageParameter.actionParameterInfo.isMultiValue ? "items" : "value"
				);
				return new Message({
					message: messageParameter.message,
					type: MessageType.Error,
					processor: binding?.getModel() ?? undefined, // getModel(): null | Model ~~> processor?: MessageProcessor
					persistent: true,
					target: binding?.getResolvedPath()
				});
			})
		);
	},

	/**
	 * Checks if all required action parameters contain data and checks for all action parameters if the
	 * contained data is valid.
	 * @param actionParameterInfos Information identifying an action parameter
	 * @param resourceModel The model to load text resources
	 * @returns The validation result can be true or false
	 */
	validateProperties: async function (actionParameterInfos: ActionParameterInfo[], resourceModel: ResourceModel): Promise<boolean> {
		await Promise.allSettled(
			actionParameterInfos.map(
				(actionParameterInfo): Promise<string | MultiValueFieldItem[]> | undefined => actionParameterInfo.validationPromise
			)
		);

		const requiredParameterInfos = actionParameterInfos.filter(
			(parameterInfo) =>
				(parameterInfo.field as Field | MultiValueField).getRequired &&
				(parameterInfo.field as Field | MultiValueField).getRequired()
		);

		const allMessages = Messaging.getMessageModel().getData();
		const emptyRequiredFields = requiredParameterInfos.filter((requiredParameterInfo) => {
			const fieldId = requiredParameterInfo.field.getId();
			const relevantMessages = allMessages.filter((msg: Message) =>
				msg.getControlIds().some((controlId: string) => controlId.includes(fieldId))
			);
			if (relevantMessages.length > 0) {
				return false;
			} else if (requiredParameterInfo.isMultiValue) {
				return requiredParameterInfo.value === undefined || !requiredParameterInfo.value.length;
			} else {
				const fieldValue = (requiredParameterInfo.field as Field).getValue();
				const isFieldArray = Array.isArray((requiredParameterInfo.field as Field).getValue());
				if (isFieldArray) {
					// only first value check is enough as the field value comes on [0] rest of the array includes currency and currency code
					// both of which can or cannot be null, so we shall check only the field value
					return fieldValue[0] === null || fieldValue[0] === "";
				}
				return fieldValue === undefined || fieldValue === null || fieldValue === "";
			}
		});
		/* Message for missing mandatory value of the action parameter */
		if (emptyRequiredFields.length) {
			this._addMessageForActionParameter(
				emptyRequiredFields.map((actionParameterInfo) => ({
					actionParameterInfo: actionParameterInfo,
					message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [
						(actionParameterInfo.field.getParent()?.getAggregation("label") as Label).getText()
					])
				}))
			);
		}
		/* Check value state of all parameters */
		const firstInvalidParameter = actionParameterInfos.find(
			(parameterInfo) =>
				parameterInfo.field.getVisible() &&
				(parameterInfo.hasError || parameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(parameterInfo))
		);
		if (firstInvalidParameter) {
			firstInvalidParameter.field.setVisible(true);
			firstInvalidParameter.field.focus();
			return false;
		} else {
			return true;
		}
	},

	/**
	 * Sets the action enablement.
	 * @param oInternalModelContext Object containing the context model
	 * @param oActionOperationAvailableMap Map containing the operation availability of actions
	 * @param aSelectedContexts Array containing selected contexts of the chart
	 * @param sControl Control name
	 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
	 * @returns The action enablement promises
	 */
	setActionEnablement: async function (
		oInternalModelContext: InternalModelContext,
		oActionOperationAvailableMap: Record<string, string>,
		aSelectedContexts: Context[],
		sControl: string,
		forContextMenu = false
	): Promise<void[]> {
		const aPromises = [];
		for (const sAction in oActionOperationAvailableMap) {
			let aRequestPromises: Promise<_RequestedProperty>[] = [];
			oInternalModelContext.setProperty(sAction, false);
			if (sControl === "table") {
				oInternalModelContext.setProperty(`dynamicActions/${sAction}/aApplicable`, []);
				oInternalModelContext.setProperty(`dynamicActions/${sAction}/aNotApplicable`, []);
				if (forContextMenu) {
					oInternalModelContext.setProperty(`dynamicActions/${sAction}/bEnabledForContextMenu`, false);
				} else {
					oInternalModelContext.setProperty(`dynamicActions/${sAction}/bEnabled`, false);
				}
			}
			const sProperty = oActionOperationAvailableMap[sAction];
			for (const element of aSelectedContexts) {
				const oSelectedContext = element;
				if (oSelectedContext) {
					const oContextData = oSelectedContext.getObject() as Record<string, unknown>;
					if (sControl === "chart") {
						if ((sProperty === null && !!oContextData[`#${sAction}`]) || oSelectedContext.getObject(sProperty)) {
							//look for action advertisement if present and its value is not null
							oInternalModelContext.setProperty(sAction, true);
							break;
						}
					} else if (sControl === "table") {
						aRequestPromises = this._setActionEnablementForTable(
							oSelectedContext,
							oInternalModelContext,
							sAction,
							sProperty,
							aRequestPromises,
							forContextMenu
						);
					}
				}
			}
			if (sControl === "table") {
				if (!aSelectedContexts.length) {
					oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
						bEnabled: false,
						aApplicable: [],
						aNotApplicable: []
					});
					aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, [], forContextMenu));
				} else if (aSelectedContexts.length && typeof sProperty === "string") {
					// When all property values have been retrieved, set
					// The applicable and not-applicable selected contexts for each action and
					// The enabled property of the dynamic action in internal model context.
					aPromises.push(
						CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises, forContextMenu)
					);
				}
			}
		}
		return Promise.all(aPromises);
	},
	setActionEnablementAfterPatch: function (
		oView: View,
		oListBinding: ODataListBinding,
		oInternalModelContext: InternalModelContext
	): void {
		const oInternalModelContextData = oInternalModelContext?.getObject() as Record<string, unknown>;
		const oControls = (oInternalModelContextData?.controls || {}) as Record<string, { controlId?: string }>;
		for (const sKey in oControls) {
			if (oControls[sKey] && oControls[sKey].controlId) {
				const oTable = oView.byId(sKey);
				if (oTable && oTable.isA<Table>("sap.ui.mdc.Table")) {
					const oRowBinding = oTable.getRowBinding();
					if (oRowBinding == oListBinding) {
						const tableAPI = oTable.getParent() as TableAPI;
						ActionRuntime.setActionEnablement(
							oTable.getBindingContext("internal") as InternalModelContext,
							JSON.parse(tableAPI.tableDefinition.operationAvailableMap),
							oTable.getSelectedContexts() as Context[],
							"table"
						);
					}
				}
			}
		}
	},

	updateEditButtonVisibilityAndEnablement(oView: FEView): void {
		const iViewLevel = (oView.getViewData() as BaseManifestSettings)?.viewLevel,
			isEditable = CommonUtils.getIsEditable(oView);
		if ((iViewLevel as number) > 1 && isEditable !== true) {
			const oContext = oView.getBindingContext();
			const oAppComponent = CommonUtils.getAppComponent(oView);
			const sMetaPath = ModelHelper.getMetaPathForContext(oContext);
			const sEntitySet = ModelHelper.getRootEntitySetPath(sMetaPath);
			const metaContext = oContext
				?.getModel()
				.getMetaModel()
				?.getContext(oContext?.getPath());
			const converterContext = ConverterContext?.createConverterContextForMacro(
				sEntitySet,
				metaContext,
				oAppComponent.getDiagnostics(),
				merge
			);
			const entitySet = converterContext.getEntitySet();
			const entityType = converterContext.getEntityType();
			let updateHidden;
			//Find the Update Hidden of the root entity set and bind the property to AnyElement, any changes in the path of the root UpdateHidden will be updated via the property, internal model context is updated based on the property
			const bUpdateHidden = isEntitySet(entitySet) && entitySet.annotations.UI?.UpdateHidden?.valueOf();
			if (bUpdateHidden !== true) {
				updateHidden = ModelHelper.isUpdateHidden(entitySet, entityType);
			}
			//Find the operation available property of the root edit configuration and fetch the property using AnyElement
			const sEditEnableBinding = getEditButtonEnabled(converterContext);
			const draftRootPath = ModelHelper.getDraftRootPath(oContext);
			const sStickyRootPath = ModelHelper.getStickyRootPath(oContext);
			const sPath = draftRootPath || sStickyRootPath;
			const oInternalModelContext = oView.getBindingContext("internal") as InternalModelContext;
			if (sPath) {
				const oRootContext = oView.getModel().bindContext(sPath).getBoundContext();
				if (updateHidden !== undefined) {
					const sHiddenExpression = compileExpression(equal(getHiddenExpression(converterContext, updateHidden), false));
					this.updateEditModelContext(sHiddenExpression, oView, oRootContext, "rootEditVisible", oInternalModelContext);
				}
				if (sEditEnableBinding) {
					this.updateEditModelContext(sEditEnableBinding, oView, oRootContext, "rootEditEnabled", oInternalModelContext);
				}
			}
		}
	},

	updateEditModelContext: function (
		sBindingExpression: string | undefined,
		oView: View,
		oRootContext: Context,
		sProperty: string,
		oInternalModelContext: InternalModelContext
	): void {
		if (sBindingExpression) {
			const oHiddenElement = new AnyElement({ anyText: sBindingExpression });
			oHiddenElement.setBindingContext(null);
			oView.addDependent(oHiddenElement);
			oHiddenElement.getBinding("anyText");
			const oContext = oHiddenElement
				.getModel()
				?.bindContext(oRootContext.getPath(), oRootContext, { $$groupId: "$auto.Heroes" })
				?.getBoundContext();
			oHiddenElement.setBindingContext(oContext);
			oHiddenElement?.getBinding("anyText")?.attachChange((oEvent: Event<{}, PropertyBinding>) => {
				const oNewValue = oEvent.getSource().getExternalValue();
				oInternalModelContext.setProperty(sProperty, oNewValue);
			});
		}
	},

	_setActionEnablementForTable: function (
		oSelectedContext: Context | undefined,
		oInternalModelContext: InternalModelContext,
		sAction: string,
		sProperty: string,
		aRequestPromises: Promise<_RequestedProperty>[],
		forContextMenu = false
	): Promise<_RequestedProperty>[] {
		// Retrieve previously checked contexts in case of !forContextMenu
		const sEnablementFieldName = forContextMenu ? "bEnabledForContextMenu" : "bEnabled",
			aApplicable: [Context | undefined] = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`) || [],
			aNotApplicable: [Context | undefined] = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`) || [];
		let bActionEnabled: boolean = oInternalModelContext.getProperty(`dynamicActions/${sAction}/${sEnablementFieldName}`) || false;

		if (!forContextMenu) {
			oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
				bEnabled: false,
				aApplicable: [],
				aNotApplicable: []
			});
		} else {
			oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
				// Do not change enabled, aApplicable and aNotApplicable property in case of context menu calculation
				// in case of context menu, only the clicked context goes into the processing - other selected contexts must be kept in the model
				bEnabled: oInternalModelContext.getProperty(`dynamicActions/${sAction}/bEnabled`),
				aApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`),
				aNotApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`),
				bEnabledForContextMenu: false,
				aApplicableForContextMenu: [],
				aNotApplicableForContextMenu: []
			});
		}
		// Note that non dynamic actions are not processed here. They are enabled because
		// one or more are selected and the second part of the condition in the templating
		// is then undefined and thus the button takes the default enabling, which is true!
		const sDynamicActionEnabledPath = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}/${sEnablementFieldName}`;

		if (typeof sProperty === "object" && sProperty !== null && sProperty !== undefined) {
			if (oSelectedContext) {
				const oContextData = oSelectedContext.getObject() as Record<string, PrimitiveType>;
				const oTransformedBinding = transformRecursively(
					sProperty,
					"PathInModel",
					// eslint-disable-next-line no-loop-func
					function (oBindingExpression: PathInModelExpression<PrimitiveType>) {
						return oContextData ? constant(oContextData[oBindingExpression.path]) : constant(false);
					},
					true
				);
				const sResult = compileExpression(oTransformedBinding);
				bActionEnabled = bActionEnabled || sResult === "true";
				oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, bActionEnabled);
				(sResult === "true" ? aApplicable : aNotApplicable).push(oSelectedContext);
			}
			CommonUtils.setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable, forContextMenu);
		} else {
			const oContextData = oSelectedContext?.getObject() as Record<string, PrimitiveType>;
			if (sProperty === null && !!oContextData[`#${sAction}`]) {
				//look for action advertisement if present and its value is not null
				oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
			} else if (oSelectedContext !== undefined) {
				// Collect promises to retrieve singleton or normal property value asynchronously
				aRequestPromises.push(CommonUtils.requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath));
			}
		}
		return aRequestPromises;
	}
};
export default ActionRuntime;

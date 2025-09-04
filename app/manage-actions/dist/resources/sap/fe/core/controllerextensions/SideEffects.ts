import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { defineUI5Class, extensible, finalExtension, methodOverride, privateExtension, publicExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import { getInvolvedDataModelObjectsForTargetPath } from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type {
	ControlSideEffectsType,
	ODataSideEffectsType,
	SideEffectsService,
	SideEffectsTarget,
	SideEffectsType
} from "sap/fe/core/services/SideEffectsServiceFactory";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import type { RadioButtonGroup$SelectEvent } from "sap/m/RadioButtonGroup";
import Text from "sap/m/Text";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import type { MultiValueField$ChangeEvent } from "sap/ui/mdc/MultiValueField";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import CommonUtils from "../CommonUtils";
import type PageController from "../PageController";

import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import Component from "sap/ui/core/Component";
import type TemplateComponent from "../TemplateComponent";

type BaseSideEffectPropertyType = {
	name: string;
	immediate?: boolean;
	sideEffects: SideEffectsType;
};

export type FieldSideEffectPropertyType = BaseSideEffectPropertyType & {
	context: Context;
};

export type FieldSideEffectDictionary = Record<string, FieldSideEffectPropertyType>;

export type MassEditFieldSideEffectDictionary = Record<string, BaseSideEffectPropertyType>;

type FailedSideEffectDictionary = Record<string, SideEffectsType[]>;

export type FieldGroupSideEffectType = {
	promise: Promise<unknown>;
	sideEffectProperty: FieldSideEffectPropertyType;
};

const IMMEDIATE_REQUEST = "$$ImmediateRequest";
@defineUI5Class("sap.fe.core.controllerextensions.SideEffects")
class SideEffectsControllerExtension extends ControllerExtension {
	protected base!: PageController;

	private _view!: FEView;

	private _pageComponent: EnhanceWithUI5<TemplateComponent> | undefined;

	private _registeredFieldGroupMap!: Record<string, FieldGroupSideEffectType>;

	private _fieldGroupInvalidity!: Record<string, Record<string, boolean>>;

	private _sideEffectsService!: SideEffectsService;

	private _registeredFailedSideEffects!: FailedSideEffectDictionary;

	private isConfirmationDialogOpen?: boolean;

	private readonly requestExecutions: Promise<unknown>[] = [];

	constructor() {
		super();
	}

	@methodOverride()
	onInit(): void {
		this._view = this.base.getView();
		this._pageComponent = Component.getOwnerComponentFor(this._view) as EnhanceWithUI5<TemplateComponent> | undefined;

		this._sideEffectsService = CommonUtils.getAppComponent(this._view).getSideEffectsService();
		this._registeredFieldGroupMap = {};
		this._fieldGroupInvalidity = {};
		this._registeredFailedSideEffects = {};
	}

	/**
	 * Adds a SideEffects control.
	 * @param entityType Name of the entity where the SideEffects control will be registered
	 * @param controlSideEffects SideEffects to register. Ensure the sourceControlId matches the associated SAPUI5 control ID.
	 */
	@publicExtension()
	@finalExtension()
	addControlSideEffects(entityType: string, controlSideEffects: Omit<ControlSideEffectsType, "fullyQualifiedName">): void {
		this._sideEffectsService.addControlSideEffects(entityType, controlSideEffects);
	}

	/**
	 * Removes SideEffects created by a control.
	 * @param control SAPUI5 Control
	 */
	@publicExtension()
	@finalExtension()
	removeControlSideEffects(control: Control): void {
		const controlId = control.isA?.("sap.ui.base.ManagedObject") && control.getId();

		if (controlId) {
			this._sideEffectsService.removeControlSideEffects(controlId);
		}
	}

	/**
	 * Gets the appropriate context on which SideEffects can be requested.
	 * The correct one must have the binding parameter $$patchWithoutSideEffects.
	 * @param bindingContext Initial binding context
	 * @param sideEffectEntityType EntityType of the sideEffects
	 * @returns SAPUI5 Context or undefined
	 */
	@publicExtension()
	@finalExtension()
	getContextForSideEffects(bindingContext: Context, sideEffectEntityType: string): Context | undefined {
		let contextForSideEffects = bindingContext,
			entityType = this._sideEffectsService.getEntityTypeFromContext(bindingContext);

		if (sideEffectEntityType !== entityType) {
			contextForSideEffects = bindingContext.getBinding().getContext() as Context;
			if (contextForSideEffects) {
				entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
				if (sideEffectEntityType !== entityType) {
					contextForSideEffects = contextForSideEffects.getBinding().getContext() as Context;
					if (contextForSideEffects) {
						entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
						if (sideEffectEntityType !== entityType) {
							return undefined;
						}
					}
				}
			}
		}

		return contextForSideEffects || undefined;
	}

	/**
	 * Wait For all sideEffects execution to be completed.
	 *
	 */
	@publicExtension()
	@finalExtension()
	async waitForSideEffectExecutions(): Promise<void> {
		await Promise.allSettled(this.requestExecutions);
	}

	/**
	 * Gets the SideEffects map for a field
	 * These SideEffects are
	 * - listed into FieldGroupIds (coming from an OData Service)
	 * - generated by a control or controls and that configure this field as SourceProperties.
	 * @param field Field control
	 * @returns SideEffects map
	 */
	@publicExtension()
	@finalExtension()
	getFieldSideEffectsMap(field: Control): FieldSideEffectDictionary {
		let sideEffectsMap: FieldSideEffectDictionary = {};
		if (this._pageComponent) {
			const entitySet = this._pageComponent.getEntitySet?.();
			const contextPath = this._pageComponent.getContextPath?.() || (entitySet && `/${entitySet}`);

			if (contextPath) {
				const fieldGroupIds = field.getFieldGroupIds(),
					contextDataModelObject = getInvolvedDataModelObjectsForTargetPath<EntitySet | NavigationProperty>(
						contextPath,
						this._view.getModel().getMetaModel()
					);

				// SideEffects coming from an OData Service
				sideEffectsMap = this.getSideEffectsMapForFieldGroups(
					fieldGroupIds,
					field.getBindingContext() as Context | null | undefined
				) as FieldSideEffectDictionary;

				// SideEffects coming from control(s)
				if (contextDataModelObject) {
					const viewEntityType = contextDataModelObject.targetEntityType.fullyQualifiedName,
						fieldPath = this.getTargetProperty(field),
						context = this.getContextForSideEffects(field.getBindingContext() as Context, viewEntityType);

					if (fieldPath && context) {
						const controlSideEffectsEntityType = this._sideEffectsService.getControlEntitySideEffects(viewEntityType);
						Object.keys(controlSideEffectsEntityType).forEach((sideEffectsName) => {
							const oControlSideEffects = controlSideEffectsEntityType[sideEffectsName];
							if (oControlSideEffects.sourceProperties.includes(fieldPath)) {
								const name = `${sideEffectsName}::${viewEntityType}`;
								sideEffectsMap[name] = {
									name: name,
									immediate: true,
									sideEffects: oControlSideEffects,
									context: context
								};
							}
						});
					}
				}
			}
		}
		return sideEffectsMap;
	}

	/**
	 * Gets the sideEffects map for fieldGroups.
	 * @param fieldGroupIds Field group ids
	 * @param fieldContext Field binding context
	 * @returns SideEffects map
	 */

	@publicExtension()
	@finalExtension()
	getSideEffectsMapForFieldGroups(
		fieldGroupIds: string[],
		fieldContext?: Context | null
	): MassEditFieldSideEffectDictionary | FieldSideEffectDictionary {
		const mSideEffectsMap: MassEditFieldSideEffectDictionary | FieldSideEffectDictionary = {};
		fieldGroupIds.forEach((fieldGroupId) => {
			const { name, immediate, sideEffects, sideEffectEntityType } = this._getSideEffectsPropertyForFieldGroup(fieldGroupId);
			const oContext = fieldContext ? (this.getContextForSideEffects(fieldContext, sideEffectEntityType) as Context) : undefined;
			if (sideEffects && (!fieldContext || (fieldContext && oContext))) {
				mSideEffectsMap[name] = {
					name,
					immediate,
					sideEffects
				};
				if (fieldContext) {
					(mSideEffectsMap[name] as FieldSideEffectPropertyType).context = oContext!;
				}
			}
		});
		return mSideEffectsMap;
	}

	/**
	 * Clear recorded validation status for all properties.
	 *
	 */
	@publicExtension()
	@finalExtension()
	clearFieldGroupsValidity(): void {
		this._fieldGroupInvalidity = {};
	}

	/**
	 * Clear recorded validation status for all properties.
	 * @param fieldGroupId Field group id
	 * @param context Context
	 * @returns SAPUI5 Context or undefined
	 */
	@publicExtension()
	@finalExtension()
	isFieldGroupValid(fieldGroupId: string, context: Context): boolean {
		const id = this._getFieldGroupIndex(fieldGroupId, context);
		return Object.keys(this._fieldGroupInvalidity[id] ?? {}).length === 0;
	}

	/**
	 * Gets the relative target property related to the Field.
	 * @param field Field control
	 * @returns Relative target property
	 */
	@publicExtension()
	@finalExtension()
	getTargetProperty(field: Control): string | undefined {
		const fieldPath = field.data("sourcePath") as string;
		const metaModel = this._view.getModel().getMetaModel();
		const viewBindingPath = this._view.getBindingContext()?.getPath();
		const viewMetaModelPath = viewBindingPath ? `${metaModel.getMetaPath(viewBindingPath)}/` : "";
		return fieldPath?.replace(viewMetaModelPath, "");
	}

	/**
	 * Caches deferred SideEffects that will be executed when the FieldGroup is unfocused.
	 * @param event SAPUI5 event that comes from a field change
	 * @param fieldValidity
	 * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
	 */
	@publicExtension()
	@finalExtension()
	prepareDeferredSideEffectsForField(
		event: Field$ChangeEvent | MultiValueField$ChangeEvent | RadioButtonGroup$SelectEvent,
		fieldValidity: boolean,
		fieldGroupPreRequisite?: Promise<unknown>
	): void {
		const field = (event as UI5Event<{}, Control>).getSource();
		this._saveFieldPropertiesStatus(field, fieldValidity);
		if (!fieldValidity) {
			return;
		}
		const sideEffectsMap = this.getFieldSideEffectsMap(field);

		// register field group SideEffects
		Object.keys(sideEffectsMap)
			.filter((sideEffectsName) => sideEffectsMap[sideEffectsName].immediate !== true)
			.forEach((sideEffectsName) => {
				const sideEffectsProperties = sideEffectsMap[sideEffectsName];
				this.registerFieldGroupSideEffects(sideEffectsProperties, fieldGroupPreRequisite);
			});
	}

	/**
	 * Manages the workflow for SideEffects with related changes to a field
	 * The following scenarios are managed:
	 * - Register: caches deferred SideEffects that will be executed when the FieldGroup is unfocused
	 * - Execute: triggers immediate SideEffects requests if the promise for the field event is fulfilled.
	 * @param event SAPUI5 event that comes from a field change
	 * @param fieldValidity
	 * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
	 * @param skipDeferredRegistration If true then deferred side effects are not registered. This is useful when the registration of deferred side effects and triggering needs to be done separately.
	 * @returns  Promise on SideEffects request(s)
	 */
	@publicExtension()
	@finalExtension()
	async handleFieldChange(
		event: Field$ChangeEvent | MultiValueField$ChangeEvent | RadioButtonGroup$SelectEvent,
		fieldValidity: boolean,
		fieldGroupPreRequisite?: Promise<unknown>,
		skipDeferredRegistration = false
	): Promise<void> {
		const field = (event as UI5Event<{}, Control>).getSource();
		if (!skipDeferredRegistration) {
			this.prepareDeferredSideEffectsForField(event, fieldValidity, fieldGroupPreRequisite);
		} else {
			this._saveFieldPropertiesStatus(field, fieldValidity);
			if (!fieldValidity) {
				return;
			}
		}
		return this._manageSideEffectsFromField(field);
	}

	/**
	 * Manages SideEffects with a related 'focus out' to a field group.
	 * @param event SAPUI5 Event
	 * @returns Promise returning true if the SideEffects have been successfully executed
	 */
	@publicExtension()
	@finalExtension()
	async handleFieldGroupChange(event: Control$ValidateFieldGroupEvent): Promise<void | void[]> {
		const field = event.getSource(),
			fieldGroupIds: string[] = event.getParameter("fieldGroupIds") ?? [],
			customSideEffectHandling = fieldGroupIds.some((fieldGroupId) => fieldGroupId.startsWith("fe_sideEffectHandling_"));

		let sideEffectRequestPromises = [];
		if (customSideEffectHandling) {
			const customImmediateSideEffectPromises = this.handleCustomFieldFieldGroupChange(event);
			if (customImmediateSideEffectPromises) {
				sideEffectRequestPromises.push(
					customImmediateSideEffectPromises.then(() => {
						return;
					})
				);
			}
		}

		const fieldGroupsSideEffects = fieldGroupIds.reduce((results: FieldGroupSideEffectType[], fieldGroupId) => {
			return results.concat(this.getRegisteredSideEffectsForFieldGroup(fieldGroupId));
		}, []);
		sideEffectRequestPromises = sideEffectRequestPromises.concat(
			fieldGroupsSideEffects.map(async (fieldGroupSideEffects) => {
				return this._requestFieldGroupSideEffects(fieldGroupSideEffects);
			})
		);

		return Promise.all(sideEffectRequestPromises).catch((error) => {
			const contextPath = field.getBindingContext()?.getPath();
			Log.debug(`Error while processing FieldGroup SideEffects on context ${contextPath}`, error);
		});
	}

	/**
	 * Manages SideEffects when the fieldGroupChange event is fired for a custom field.
	 * @param event
	 * @returns Promise of the immediate side effects request if there are any
	 */
	handleCustomFieldFieldGroupChange(event: Control$ValidateFieldGroupEvent): null | Promise<unknown> {
		const field = event.getSource();
		const controlSideEffects = Object.values(this.getFieldSideEffectsMap(field));

		// register the non immediate side effects
		controlSideEffects
			.filter((sideEffectDef) => sideEffectDef.immediate !== true)
			.forEach((sideEffectDef) => {
				this.registerFieldGroupSideEffects(sideEffectDef, Promise.resolve());
			});

		// execute the immediate side effects of the control
		const immediateSideEffects = controlSideEffects
			.filter((sideEffectDef) => sideEffectDef.immediate === true)
			.map((sideEffectDef) => sideEffectDef.sideEffects);
		const context = field.getBindingContext();

		if (immediateSideEffects.length && context) {
			return this.requestMultipleSideEffects(immediateSideEffects, context as Context);
		}
		return null;
	}

	/* Manages the deferred SideEffects which have to be executed when the context of the page changes (saving a document).
	 *
	 * @param context The context of the page
	 * @returns Promise returning true if the SideEffects have been successfully executed
	 */
	@publicExtension()
	@finalExtension()
	async handlePageChangeContext(context: Context): Promise<void | unknown[]> {
		await this.waitForSideEffectExecutions();
		const sideEffectsFieldGroupOnPage = this.getRegisteredSideEffectsForContext(context);
		return Promise.all(
			sideEffectsFieldGroupOnPage.map(async (fieldGroupSideEffects) => {
				return this._requestFieldGroupSideEffects(fieldGroupSideEffects);
			})
		).catch((error) => {
			Log.debug(`Error while processing on page context ${context.getPath()}`, error);
		});
	}

	/**
	 * Request SideEffects on a specific context.
	 * @param sideEffects SideEffects to be executed
	 * @param context Context where SideEffects need to be executed
	 * @param groupId
	 * @param fnGetTargets The callback function which will give us the targets and actions if it was coming through some specific handling.
	 * @param ignoreTriggerActions If true, we do not trigger actions defined in the side effect
	 * @returns SideEffects request on SAPUI5 context
	 */
	@publicExtension()
	@finalExtension()
	async requestSideEffects(
		sideEffects: SideEffectsType,
		context: Context,
		groupId?: string,
		fnGetTargets?: (sideEffectsDef: SideEffectsType) => { targets: SideEffectsTarget[]; triggerAction: string | undefined },
		ignoreTriggerActions = false
	): Promise<unknown> {
		const fnTriggerCallbacks = this.triggerCallbacks.bind(this);
		const { targets, triggerAction } = fnGetTargets
			? fnGetTargets(sideEffects)
			: {
					targets: [...(sideEffects.targetEntities ?? []), ...(sideEffects.targetProperties ?? [])],
					triggerAction: !this._sideEffectsService.isControlSideEffects(sideEffects) ? sideEffects.triggerAction : undefined
			  };
		if (triggerAction && !ignoreTriggerActions) {
			this.requestExecutions.push(this._sideEffectsService.executeAction(triggerAction, context, groupId));
		}

		if (targets.length) {
			const requestTargets = this._sideEffectsService
				.requestSideEffects(targets, context, groupId)
				.then(async function async() {
					return fnTriggerCallbacks(sideEffects.targetEntities?.map((target) => target.$NavigationPropertyPath) || []);
				})
				.catch((error: unknown) => {
					this.registerFailedSideEffects([sideEffects], context);
					throw error;
				});
			this.requestExecutions.push(requestTargets);
			return requestTargets;
		}
	}

	/**
	 * Requests the SideEffects for a sideEffect event.
	 *
	 * The default implementation is to execute the side effect on the page's context, but pages (like the LR) might override this method.
	 * @param eventName The SideEffects event that is triggered
	 * @param path The path for which this event was triggered
	 * @returns Promise on SideEffects request
	 */

	@publicExtension()
	@extensible(OverrideExecution.Instead)
	async requestSideEffectsForEvent(eventName: string, path: string): Promise<undefined> {
		if (this.isDataPathRelevant(path, eventName)) {
			// use the default implementation from the SideEffects Service
			const context = this._findRelevantContext(path, this.getView().getBindingContext() as Context);
			if (context) {
				return this._sideEffectsService.requestSideEffectsForEvent(eventName, context);
			}
		}
	}

	/**
	 * Checks whether a specific data path is visible on the page.
	 * @param path The path to be checked
	 * @param _eventName SideEffects event which was triggered
	 * @returns True if the data path is shown on the UI
	 */
	isDataPathRelevant(path: string, _eventName: string): boolean {
		const context = this.getView().getBindingContext() as Context;

		if (this._contextIsRelevant(path, context)) {
			return true;
		}

		return !!this._findRelevantContext(path, context);
	}

	/**
	 * Checks if a given context fits to a given path.
	 *
	 * This is done by checking both the navigation path and the canonical path.
	 * We also check dependent property bindings if they follow a navigation path to the given path.
	 * @param path The path to be checked
	 * @param context The context to be checked
	 * @returns True if the context fits to the given path
	 */
	_contextIsRelevant(path: string, context: Context): boolean {
		if (context?.getPath() === path || context?.getCanonicalPath() === path) {
			return true;
		}

		// check if a dependent binding follows a navigation path and fits to this path
		const model = context.getModel();
		const metaModel = model.getMetaModel();
		const dependentBindings = model.getDependentBindings(context);
		for (const binding of dependentBindings) {
			const bindingPath = binding.getPath() ?? "";

			if (
				bindingPath.startsWith("@$ui5") || // ignore UI5 internal bindings
				(context.getProperty("IsActiveEntity") === true && // ignore DraftAdministrativeData on active version
					bindingPath.includes("DraftAdministrativeData/"))
			) {
				continue;
			}
			try {
				const propertyTarget = metaModel.fetchUpdateData(bindingPath, context).getResult();
				if (propertyTarget?.entityPath === path || "/" + propertyTarget?.editUrl === path) {
					return true;
				}
			} catch (error: unknown) {
				Log.debug(`Error while checking ${bindingPath} on page context `, error as string | Error);
			}
		}
		return false;
	}

	/**
	 * Find context for a given path by checking dependent bindings.
	 * @param path The path to be checked
	 * @param context The parent context
	 * @returns Context if found, otherwise returns undefined
	 */
	_findRelevantContext(path: string, context: Context): Context | undefined {
		if (this._contextIsRelevant(path, context)) {
			return context;
		}

		const dependentBindings = context.getModel().getDependentBindings(context);
		for (const binding of dependentBindings) {
			if (binding.isA<ODataContextBinding>("sap.ui.model.odata.v4.ODataContextBinding")) {
				if (this._contextIsRelevant(path, binding.getBoundContext())) {
					return binding.getBoundContext();
				}
			} else if (binding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
				const listContexts = binding.getAllCurrentContexts();
				for (const listContext of listContexts) {
					if (this._contextIsRelevant(path, listContext)) {
						return listContext;
					}
				}
			}
		}
	}

	/**
	 * Get text to be shown for user to indicate data refresh.
	 *
	 * This is currently only used by SideEffects events. Pages (like the LR) might override this method.
	 * @returns Text to be shown to the user in case of a data refresh
	 */

	@publicExtension()
	@extensible(OverrideExecution.Instead)
	getDataRefreshText(): string {
		const resourceModel = getResourceModel(this.getView());
		return resourceModel.getText("C_SERVER_EVENTS_NEW_DATA_ITEM");
	}

	/**
	 * Notify the user that data was refreshed.
	 *
	 * This is currently only used by SideEffects events.
	 */

	notifyDataRefresh(): void {
		MessageToast.show(this.base.getView().getController()._sideEffects.getDataRefreshText());
	}

	/**
	 * Ask the user for confirmation of a data refresh.
	 *
	 * This is currently only used by SideEffects events.
	 * @returns Promise that is resolved if the user confirms and rejects if the user cancels.
	 */
	async confirmDataRefresh(): Promise<void> {
		if (!this.isConfirmationDialogOpen) {
			return new Promise<void>((resolve, reject) => {
				const text = this.getDataRefreshText();
				const resourceModel = getResourceModel(this.getView());

				const confirmationDialog = new Dialog({
					title: resourceModel.getText("WARNING"),
					state: "Warning",
					content: new Text({ text: text }),
					beginButton: new Button({
						text: resourceModel.getText("C_COMMON_SAPFE_REFRESH"),
						press: (): void => {
							confirmationDialog.close();
							resolve();
						}
					}),
					endButton: new Button({
						text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"),
						press: (): void => {
							confirmationDialog.close();
							reject();
						}
					}),
					afterClose: (): void => {
						confirmationDialog.destroy();
						this.isConfirmationDialogOpen = false;
					}
				});
				confirmationDialog.addStyleClass("sapUiContentPadding");
				this.isConfirmationDialogOpen = true;
				confirmationDialog.open();
			});
		}
		return Promise.reject();
	}

	/**
	 * Request multiple SideEffects on a specific context.
	 * @param multiSideEffects SideEffects to be executed
	 * @param context Context where SideEffects need to be executed
	 * @param groupId The group id of the batch
	 * @returns SideEffects request on SAPUI5 context
	 */
	async requestMultipleSideEffects(multiSideEffects: SideEffectsType[], context: Context, groupId?: string): Promise<unknown> {
		let properties = new Set<string>();
		let navigationProperties = new Set<string>();
		const actions = multiSideEffects.reduce((actions, sideEffects) => {
			const sideEffectAction = (sideEffects as ODataSideEffectsType).triggerAction;
			if (sideEffectAction) {
				actions.push(sideEffectAction);
			}
			return actions;
		}, [] as string[]);
		const fntriggerCallbacks = this.triggerCallbacks.bind(this);

		for (const action of actions) {
			this._sideEffectsService.executeAction(action, context, groupId);
		}

		for (const sideEffects of multiSideEffects) {
			properties = (sideEffects.targetProperties ?? []).reduce((mySet, property) => mySet.add(property), properties);
			navigationProperties = (sideEffects.targetEntities ?? []).reduce(
				(mySet, navigationProperty) => mySet.add(navigationProperty.$NavigationPropertyPath),
				navigationProperties
			);
		}

		return this._sideEffectsService
			.requestSideEffects(
				[
					...Array.from(properties),
					...Array.from(navigationProperties).map((navigationProperty) => {
						return { $NavigationPropertyPath: navigationProperty };
					})
				],
				context,
				groupId
			)
			.then(async function async() {
				return fntriggerCallbacks(Array.from(navigationProperties));
			})
			.catch((error: unknown) => {
				this.registerFailedSideEffects(multiSideEffects, context);
				throw error;
			});
	}

	/**
	 * Gets failed SideEffects.
	 * @returns Registered SideEffects requests that have failed
	 */
	@publicExtension()
	@finalExtension()
	public getRegisteredFailedRequests(): FailedSideEffectDictionary {
		return this._registeredFailedSideEffects;
	}

	/**
	 * Adds SideEffects to the queue of the failed SideEffects
	 * The SideEffects are retriggered on the next request on the same context.
	 * @param multiSideEffects SideEffects that need to be retriggered
	 * @param context Context where SideEffects have failed
	 */
	@privateExtension()
	@finalExtension()
	registerFailedSideEffects(multiSideEffects: SideEffectsType[], context: Context): void {
		const contextPath = context.getPath();
		this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath] ?? [];
		for (const sideEffects of multiSideEffects) {
			const isNotAlreadyListed = this._registeredFailedSideEffects[contextPath].every(
				(mFailedSideEffects) => sideEffects.fullyQualifiedName !== mFailedSideEffects.fullyQualifiedName
			);
			if (isNotAlreadyListed) {
				this._registeredFailedSideEffects[contextPath].push(sideEffects);
			}
		}
	}

	/**
	 * Deletes SideEffects in the queue of the failed SideEffects for a context.
	 * @param contextPath Context path where SideEffects have failed
	 */
	@publicExtension()
	@finalExtension()
	unregisterFailedSideEffectsForAContext(contextPath: string): void {
		delete this._registeredFailedSideEffects[contextPath];
	}

	/**
	 * Deletes SideEffects to the queue of the failed SideEffects.
	 * @param sideEffectsFullyQualifiedName SideEffects that need to be retriggered
	 * @param context Context where SideEffects have failed
	 */
	@publicExtension()
	@finalExtension()
	unregisterFailedSideEffects(sideEffectsFullyQualifiedName: string, context: Context): void {
		const contextPath = context.getPath();
		if (this._registeredFailedSideEffects[contextPath]?.length) {
			this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath].filter(
				(sideEffects) => sideEffects.fullyQualifiedName !== sideEffectsFullyQualifiedName
			);
		}
	}

	/**
	 * Adds SideEffects to the queue of a FieldGroup
	 * The SideEffects are triggered when event related to the field group change is fired.
	 * @param sideEffectsProperties SideEffects properties
	 * @param fieldGroupPreRequisite Promise to fullfil before executing the SideEffects
	 */
	@privateExtension()
	@finalExtension()
	registerFieldGroupSideEffects(sideEffectsProperties: FieldSideEffectPropertyType, fieldGroupPreRequisite?: Promise<unknown>): void {
		const id = this._getFieldGroupIndex(sideEffectsProperties.name, sideEffectsProperties.context);
		if (!this._registeredFieldGroupMap[id]) {
			this._registeredFieldGroupMap[id] = {
				promise: fieldGroupPreRequisite ?? Promise.resolve(),
				sideEffectProperty: sideEffectsProperties
			};
		}
	}

	/**
	 * Deletes SideEffects to the queue of a FieldGroup.
	 * @param sideEffectsProperties SideEffects properties
	 */
	@privateExtension()
	@finalExtension()
	unregisterFieldGroupSideEffects(sideEffectsProperties: FieldSideEffectPropertyType): void {
		const { context, name } = sideEffectsProperties;
		const id = this._getFieldGroupIndex(name, context);
		delete this._registeredFieldGroupMap[id];
	}

	/**
	 * Gets the registered SideEffects into the queue for a field group id.
	 * @param fieldGroupId Field group id
	 * @returns Array of registered SideEffects and their promise
	 */
	@publicExtension()
	@finalExtension()
	getRegisteredSideEffectsForFieldGroup(fieldGroupId: string): FieldGroupSideEffectType[] {
		const sideEffects = [];
		for (const registryIndex of Object.keys(this._registeredFieldGroupMap)) {
			if (registryIndex.startsWith(`${fieldGroupId}_`)) {
				sideEffects.push(this._registeredFieldGroupMap[registryIndex]);
			}
		}
		return sideEffects;
	}

	/**
	 * Gets the registered SideEffects into the queue for a context and its children.
	 * @param context The context
	 * @returns Array of registered SideEffects and their promise
	 */
	@publicExtension()
	@finalExtension()
	getRegisteredSideEffectsForContext(context: Context): FieldGroupSideEffectType[] {
		const sideEffects = [];
		for (const registryIndex of Object.keys(this._registeredFieldGroupMap)) {
			if (this._registeredFieldGroupMap)
				if (registryIndex.includes(`_${context.getPath()}`)) {
					sideEffects.push(this._registeredFieldGroupMap[registryIndex]);
				}
		}
		return sideEffects;
	}

	/**
	 * Gets a status index.
	 * @param fieldGroupId The field group id
	 * @param context SAPUI5 Context
	 * @returns Index
	 */
	private _getFieldGroupIndex(fieldGroupId: string, context: Context): string {
		return `${fieldGroupId}_${context.getPath()}`;
	}

	/**
	 * Gets sideEffects properties from a field group id
	 * The properties are:
	 * - name
	 * - sideEffects definition
	 * - sideEffects entity type
	 * - immediate sideEffects.
	 * @param fieldGroupId
	 * @returns SideEffects properties
	 */
	private _getSideEffectsPropertyForFieldGroup(fieldGroupId: string): {
		sideEffectEntityType: string;
		name: string;
		immediate: boolean;
		sideEffects: ODataSideEffectsType | undefined;
	} {
		/**
		 * string "$$ImmediateRequest" is added to the SideEffects name during templating to know
		 * if this SideEffects must be immediately executed requested (on field change) or must
		 * be deferred (on field group focus out)
		 *
		 */
		const immediate = fieldGroupId.includes(IMMEDIATE_REQUEST),
			name = fieldGroupId.replace(IMMEDIATE_REQUEST, ""),
			sideEffectParts = name.split("#"),
			sideEffectEntityType = sideEffectParts[0],
			sideEffectPath = `${sideEffectEntityType}@com.sap.vocabularies.Common.v1.SideEffects${
				sideEffectParts.length === 2 ? `#${sideEffectParts[1]}` : ""
			}`,
			sideEffects: ODataSideEffectsType | undefined =
				this._sideEffectsService.getODataEntitySideEffects(sideEffectEntityType)?.[sideEffectPath];
		return { name, immediate, sideEffects, sideEffectEntityType };
	}

	/**
	 * Manages the SideEffects for a field.
	 * @param field Field control
	 * @returns Promise related to the requested immediate sideEffects
	 */
	private async _manageSideEffectsFromField(field: Control): Promise<void> {
		const sideEffectsMap = this.getFieldSideEffectsMap(field);
		try {
			const sideEffectsToExecute: Record<string, { sideEffects: SideEffectsType[]; context: Context }> = {};
			const addSideEffects = (context: Context, sideEffects: SideEffectsType): void => {
				const contextPath = context.getPath();
				if (sideEffectsToExecute[contextPath]) {
					sideEffectsToExecute[contextPath].sideEffects.push(sideEffects);
				} else {
					sideEffectsToExecute[contextPath] = {
						context,
						sideEffects: [sideEffects]
					};
				}
			};

			//Get Immediate SideEffects
			for (const sideEffectsProperties of Object.values(sideEffectsMap).filter(
				(sideEffectsProperties) => sideEffectsProperties.immediate === true
			)) {
				// if this SideEffects is recorded as failed SideEffects, need to remove it.
				this.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, sideEffectsProperties.context);
				addSideEffects(sideEffectsProperties.context, sideEffectsProperties.sideEffects);
			}

			//Replay failed SideEffects related to the view or Field
			for (const context of [field.getBindingContext(), this._view.getBindingContext()].filter(
				(context): context is Context => !!context
			)) {
				const contextPath = context.getPath();
				const failedSideEffects = this._registeredFailedSideEffects[contextPath] ?? [];
				this.unregisterFailedSideEffectsForAContext(contextPath);
				for (const failedSideEffect of failedSideEffects) {
					addSideEffects(context, failedSideEffect);
				}
			}
			await Promise.all(
				Object.values(sideEffectsToExecute).map(async (sideEffectsProperties) =>
					sideEffectsProperties.sideEffects.length === 1
						? this.requestSideEffects(sideEffectsProperties.sideEffects[0], sideEffectsProperties.context)
						: this.requestMultipleSideEffects(sideEffectsProperties.sideEffects, sideEffectsProperties.context)
				)
			);
		} catch (e) {
			Log.debug(`Error while managing Field SideEffects`, e as string);
		}
	}

	async triggerCallbacks(navigation: string[]): Promise<undefined> {
		await Promise.all(
			navigation.map((nav) => {
				const registerCallBack = this._sideEffectsService.getRegisteredCallback(nav);
				if (registerCallBack) {
					return registerCallBack();
				}
				return Promise.resolve();
			})
		);
	}

	/**
	 * Requests the SideEffects for a fieldGroup.
	 * @param fieldGroupSideEffects Field group sideEffects with its promise
	 * @returns Promise returning true if the SideEffects have been successfully executed
	 */
	private async _requestFieldGroupSideEffects(fieldGroupSideEffects: FieldGroupSideEffectType): Promise<void> {
		this.unregisterFieldGroupSideEffects(fieldGroupSideEffects.sideEffectProperty);
		try {
			await fieldGroupSideEffects.promise;
		} catch (e) {
			Log.debug(`Error while processing FieldGroup SideEffects`, e as string);
			return;
		}
		try {
			const { sideEffects, context, name } = fieldGroupSideEffects.sideEffectProperty;
			if (this.isFieldGroupValid(name, context)) {
				await this.requestSideEffects(sideEffects, context);
			}
		} catch (e) {
			Log.debug(`Error while executing FieldGroup SideEffects`, e as string);
		}
	}

	/**
	 * Saves the validation status of properties related to a field control.
	 * @param field The field control
	 * @param success Status of the field validation
	 */
	private _saveFieldPropertiesStatus(field: Control, success: boolean): void {
		const sideEffectsMap = this.getFieldSideEffectsMap(field);
		Object.keys(sideEffectsMap).forEach((key) => {
			const { name, immediate, context } = sideEffectsMap[key];
			if (!immediate) {
				const id = this._getFieldGroupIndex(name, context);
				if (success) {
					delete this._fieldGroupInvalidity[id]?.[field.getId()];
				} else {
					this._fieldGroupInvalidity[id] = {
						...this._fieldGroupInvalidity[id],
						...{ [field.getId()]: true }
					};
				}
			}
		});
	}
}

export default SideEffectsControllerExtension;

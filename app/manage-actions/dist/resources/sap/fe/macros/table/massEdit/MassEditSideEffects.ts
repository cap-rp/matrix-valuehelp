import type { Property } from "@sap-ux/vocabularies-types";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { MassEditFieldSideEffectDictionary } from "sap/fe/core/controllerextensions/SideEffects";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isNavigationProperty, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type {
	SideEffectsEntityType,
	SideEffectsService,
	SideEffectsTarget,
	SideEffectsType
} from "sap/fe/core/services/SideEffectsServiceFactory";
import { enhanceDataModelPath, getTargetEntitySetInfo } from "sap/fe/core/templating/DataModelPathHelper";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import TableHelper from "sap/fe/macros/table/TableHelper";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type MassEditDialog from "./MassEditDialog";
import type MassEditField from "./MassEditField";

type MassEditSideEffectsProperties = {
	sideEffects: SideEffectsType;
	tableRefresh: {
		isRequested: boolean;
		targetEntity?: SideEffectsEntityType;
	};
	immediate: { targets: SideEffectsTarget[]; triggerAction: string | undefined };
	deferred: { targets: SideEffectsTarget[]; triggerAction: string | undefined };
};

export type MassEditSideEffectsExecutionProperties = MassEditSideEffectsProperties & { onRowContext: boolean };

export default class MassEditSideEffects {
	public readonly sideEffectsDefinition: Record<string, MassEditSideEffectsExecutionProperties[]>;

	private readonly view: FEView;

	private readonly table: Table;

	private readonly referenceRowContext: ODataV4Context;

	private readonly immediateActionExecution: Set<string> = new Set();

	constructor(private massEditDialog: MassEditDialog) {
		this.massEditDialog = massEditDialog;
		this.referenceRowContext = massEditDialog.contexts[0];
		this.table = massEditDialog.table;
		this.view = CommonUtils.getTargetView(this.table);
		this.sideEffectsDefinition = this.generateSideEffectsDefinition();
	}

	/**
	 * Manages the refresh of the description
	 * When a field is changed and this field has a text arrangement annotation, then description must be updated by the SideEffect
	 * if no SideEffect is configured to refresh the entire table (named genericField).
	 * @param fieldControl The field
	 * @param context The row context
	 * @param groupId The batch group id
	 * @returns Promise related to the SideEffects.
	 */
	async refreshDescription(fieldControl: MassEditField, context: ODataV4Context, groupId: string): Promise<void> {
		const propertyPath = fieldControl.properties.descriptionPath;
		if (propertyPath && !this.sideEffectsDefinition["genericField"]) {
			return CommonUtils.getAppComponent(this.table)
				.getSideEffectsService()
				.requestSideEffects(
					propertyPath.includes("/")
						? [{ $NavigationPropertyPath: propertyPath.substring(0, propertyPath.lastIndexOf("/")) }]
						: [propertyPath],
					context,
					groupId
				);
		}
	}

	/**
	 * Generates the SideEffects execution definition
	 * This dictionary is used by the dialog to execute immediate and deferred SideEffects on the relevant contexts.
	 * @returns The SideEffects execution properties.
	 */
	generateSideEffectsDefinition(): Record<string, MassEditSideEffectsExecutionProperties[]> {
		const sideEffectsMap = this.getSideEffectsMap();
		const sideEffectsDefinition: Record<string, MassEditSideEffectsExecutionProperties[]> = {};
		const tableDefinition = (this.table.getParent() as TableAPI).getTableDefinition();
		const view = CommonUtils.getTargetView(this.table);

		for (const key in sideEffectsMap) {
			const keySideEffects = sideEffectsMap[key];
			for (const sideEffectsName in keySideEffects) {
				const sideEffectsProperties = keySideEffects[sideEffectsName];
				const sideEffectsEntityType = sideEffectsName.split("#")[0];
				const sideEffectsContext = view
					.getController()
					._sideEffects.getContextForSideEffects(this.referenceRowContext, sideEffectsEntityType);
				if (sideEffectsContext) {
					const massSideEffectsProperties = this.getSpecificTargetsAndActions(
						sideEffectsProperties.sideEffects,
						sideEffectsContext,
						(this.table.getModel() as ODataModel).getMetaModel().getContext(tableDefinition.annotation.collection),
						CommonUtils.getAppComponent(this.table).getSideEffectsService()
					);
					const massSideEffectsExecutionProperties = {
						...massSideEffectsProperties,
						...{ onRowContext: this.referenceRowContext === sideEffectsContext }
					};
					sideEffectsDefinition[key] = sideEffectsDefinition[key] || [];
					sideEffectsDefinition[key].push(massSideEffectsExecutionProperties);
					if (!sideEffectsDefinition["genericField"] && massSideEffectsProperties.tableRefresh.isRequested) {
						sideEffectsDefinition["genericField"] = [massSideEffectsExecutionProperties];
					}
				}
			}
		}
		return sideEffectsDefinition;
	}

	/**
	 * Gets the SideEffects information
	 *  This information is
	 * - immediateTargets: contains the immediate targets which must be executed on each row
	 * - isImmediateTriggerAction: is the action is immediate or deferred
	 * - isRequestingTableEntityRefresh: is the refresh is requested on the table entity by a TargetEntity
	 * - tableTargetEntity: the target entity which requests the refresh on the table.
	 * @param oDataSideEffect The SideEffect
	 * @param sideEffectsContext The context where the SideEffects is executed
	 * @param entitySetContext  The entitySet context of the dialog
	 * @param sideEffectsService The SideEffects service
	 * @returns The SideEffects information.
	 */
	private getSideEffectsInformation(
		oDataSideEffect: SideEffectsType,
		sideEffectsContext: ODataV4Context,
		entitySetContext: Context,
		sideEffectsService: SideEffectsService
	): {
		immediateTargets: SideEffectsTarget[];
		isImmediateTriggerAction: boolean;
		isRequestingTableEntityRefresh: boolean;
		tableTargetEntity: SideEffectsEntityType | undefined;
	} {
		const metaModel = entitySetContext.getModel();
		const targetProperties = oDataSideEffect.targetProperties ?? [];
		const targetEntities = oDataSideEffect.targetEntities ?? [];
		const actionName = !sideEffectsService.isControlSideEffects(oDataSideEffect) ? oDataSideEffect.triggerAction : undefined;
		let immediateTargets: SideEffectsTarget[] = [];
		const entitySetDataModelPath = getInvolvedDataModelObjects(entitySetContext);
		const sideEffectsDataModelPath = getInvolvedDataModelObjects(
			metaModel.getContext(metaModel.getMetaPath(sideEffectsContext.getPath()))
		);
		const { parentEntitySet } = getTargetEntitySetInfo(entitySetDataModelPath);
		let isRequestingTableEntityRefresh = false;
		let tableTargetEntity: SideEffectsEntityType | undefined;

		immediateTargets = targetEntities.reduce((entities: SideEffectsEntityType[], targetEntity) => {
			const target = sideEffectsDataModelPath.targetEntityType.resolvePath(targetEntity.$NavigationPropertyPath);
			if (isNavigationProperty(target)) {
				if (target.targetType == entitySetDataModelPath.targetEntityType) {
					//The refresh is requested on the table entity
					isRequestingTableEntityRefresh = true;
					tableTargetEntity = targetEntity;
					return entities;
				}
				if (sideEffectsDataModelPath.targetEntityType === parentEntitySet?.entityType) {
					// The side effects context is the parent entity (the entitySet of the view)
					return entities;
				}
				if (target.targetType !== parentEntitySet?.entityType) {
					//The refresh is not requested on the parent entity (the entitySet of the view)
					entities.push(targetEntity);
				}
			}
			return entities;
		}, []);

		for (const targetProperty of targetProperties) {
			const propertyDataModelPath = enhanceDataModelPath(sideEffectsDataModelPath, targetProperty);
			if (isProperty(propertyDataModelPath.targetObject) || targetProperty === "*") {
				// if target entity is not from the parent
				if (parentEntitySet?.entityType !== propertyDataModelPath.targetEntityType) {
					immediateTargets.push(targetProperty);
				}
			}
		}
		// if entity is other than items table then action is deferred or the static action is on collection
		const isImmediateTriggerAction =
			!!actionName &&
			sideEffectsDataModelPath.targetEntityType === entitySetDataModelPath.targetEntityType &&
			!TableHelper._isStaticAction(metaModel.getObject(`/${actionName}`), actionName);

		return {
			immediateTargets,
			isImmediateTriggerAction,
			isRequestingTableEntityRefresh,
			tableTargetEntity
		};
	}

	/**
	 * Gets the properties of the SideEffects
	 * These properties are
	 * - tableRefresh: is the whole table is refreshed by the SideEffects
	 * - immediate: contains the immediate targets and action. They are immediate when these properties must be executed
	 * on each row
	 * - deferred: contains the deferred targets and action. They are deferred when these properties must be executed
	 * only once even if multiple rows has been processed.
	 * @param oDataSideEffect The SideEffect
	 * @param sideEffectsContext The context where the SideEffects is executed
	 * @param entitySetContext  The entitySet context of the dialog
	 * @param sideEffectsService The SideEffects service
	 * @returns The SideEffects properties.
	 */
	getSpecificTargetsAndActions(
		oDataSideEffect: SideEffectsType,
		sideEffectsContext: ODataV4Context,
		entitySetContext: Context,
		sideEffectsService: SideEffectsService
	): MassEditSideEffectsProperties {
		const sideEffectsInformation = this.getSideEffectsInformation(
			oDataSideEffect,
			sideEffectsContext,
			entitySetContext,
			sideEffectsService
		);
		const actionName = !sideEffectsService.isControlSideEffects(oDataSideEffect) ? oDataSideEffect.triggerAction : undefined;

		const deferredTargets = [...(oDataSideEffect.targetProperties ?? []), ...(oDataSideEffect.targetEntities ?? [])].filter(
			(target) => !sideEffectsInformation.immediateTargets.includes(target) && target !== sideEffectsInformation.tableTargetEntity
		);

		return {
			sideEffects: oDataSideEffect,
			tableRefresh: {
				isRequested: sideEffectsInformation.isRequestingTableEntityRefresh,
				targetEntity: sideEffectsInformation.tableTargetEntity
			},
			immediate: {
				targets: sideEffectsInformation.isRequestingTableEntityRefresh ? [] : sideEffectsInformation.immediateTargets,
				triggerAction: sideEffectsInformation.isImmediateTriggerAction ? actionName : undefined
			},
			deferred: {
				targets: deferredTargets,
				triggerAction: !sideEffectsInformation.isImmediateTriggerAction ? actionName : undefined
			}
		};
	}

	/**
	 * Generates the side effects map according to the fields into the dialog.
	 * @returns The SideEffects map.
	 */
	getSideEffectsMap(): Record<string, MassEditFieldSideEffectDictionary> {
		const model = this.table.getModel() as ODataModel,
			metaModel = model.getMetaModel(),
			metaPath = metaModel.getMetaPath(this.massEditDialog.bindingContext.getPath()),
			entitySetContext = metaModel.getContext(metaPath);
		const entitySetDataModelPath = getInvolvedDataModelObjects(entitySetContext);
		const baseSideEffectsMapArray: Record<string, MassEditFieldSideEffectDictionary> = {};
		const appComponent = CommonUtils.getAppComponent(this.view);
		const properties = this.massEditDialog.fieldProperties
			.filter((field) => field.visible)
			.map((property) => [property.propertyInfo.relativePath, property.propertyInfo.unitOrCurrencyPropertyPath])
			.flat()
			.filter((property): property is string => !!property);

		for (const property of properties) {
			const propertyDataModel = enhanceDataModelPath<Property>(entitySetDataModelPath, property);
			const fieldGroupIds =
				appComponent
					.getSideEffectsService()
					.computeFieldGroupIds(
						entitySetDataModelPath.targetEntityType.fullyQualifiedName,
						propertyDataModel.targetObject!.fullyQualifiedName
					) ?? [];
			baseSideEffectsMapArray[property] = this.view.getController()._sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds);
		}
		return baseSideEffectsMapArray;
	}

	/**
	 * Executes the immediate SideEffects.
	 * These sideEffects are
	 * - The ones registered as immediate into the SideEffects dictionary
	 * - The previous failed SideEffects on the row context or view bindingContext.
	 * If there are any generic SideEffects (sideEffects which refresh the whole table) stored in the SideEffects
	 * dictionary, the targets of all immediate SideEffects are ignored (no need to execute them since the table
	 * is going to be refreshed by the generic SideEffects).
	 * @param rowContext The context of the row
	 * @param field  The property name of the field
	 * @param groupId The groupId for the batch request
	 * @returns A promise containing all SideEffects requests
	 */
	async executeImmediateSideEffects(
		rowContext: ODataV4Context,
		field: string,
		groupId: string
	): Promise<PromiseSettledResult<unknown>[]> {
		const sideEffectsPromises = [];
		const controller = this.view.getController();
		//Execute the SideEffects defined into the annotations
		for (const sideEffectsProperties of (this.sideEffectsDefinition[field] ?? []).filter(
			(sideEffects) => sideEffects.immediate.targets.length || sideEffects.immediate.triggerAction
		)) {
			const context = sideEffectsProperties.onRowContext
				? rowContext
				: controller._sideEffects.getContextForSideEffects(
						rowContext,
						sideEffectsProperties.sideEffects.fullyQualifiedName.split("@")[0]
				  );
			if (context) {
				const action = sideEffectsProperties.immediate.triggerAction;
				const contextPath = context.getPath();
				sideEffectsPromises.push(
					controller._sideEffects.requestSideEffects(sideEffectsProperties.sideEffects, context, groupId, () => {
						let isActionAlreadyTriggered = false;
						if (action) {
							isActionAlreadyTriggered = this.immediateActionExecution.has(`${contextPath}_${action}`);
							this.immediateActionExecution.add(`${contextPath}_${action}`);
						}
						return {
							targets: this.sideEffectsDefinition["genericField"] ? [] : sideEffectsProperties.immediate.targets,
							triggerAction: action && !isActionAlreadyTriggered ? sideEffectsProperties.immediate.triggerAction : undefined
						};
					})
				);
				controller._sideEffects.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, context);
			}
		}

		//Execute the previous failed SideEffects requests
		const allFailedSideEffects = controller._sideEffects.getRegisteredFailedRequests();
		for (const context of [rowContext, this.view.getBindingContext()]) {
			if (context) {
				const contextPath = context.getPath();
				const failedSideEffects = allFailedSideEffects[contextPath] ?? [];
				controller._sideEffects.unregisterFailedSideEffectsForAContext(contextPath);
				for (const failedSideEffect of failedSideEffects) {
					sideEffectsPromises.push(controller._sideEffects.requestSideEffects(failedSideEffect, context));
				}
			}
		}

		return Promise.allSettled(sideEffectsPromises);
	}

	/**
	 * Executes the deferred SideEffects
	 * These sideEffects are
	 * - The ones registered as deferred into the SideEffects dictionary
	 * - The one registered as generic since the whole table is refreshed.
	 * @param updatedFields All the updated fields by the MassEdit
	 */
	executeDeferredSideEffects(updatedFields: Set<string>): void {
		const genericSideEffects = this.sideEffectsDefinition["genericField"]?.[0];
		const genericTargetEntity = genericSideEffects?.tableRefresh.targetEntity;
		const sideEffectsExecuted = new Set<string>();
		const controller = this.view.getController();

		for (const sourceProperty of Object.keys(this.sideEffectsDefinition).filter((propertyName) => updatedFields.has(propertyName))) {
			for (const sideEffectsProperties of this.sideEffectsDefinition[sourceProperty].filter(
				(sideEffects) => sideEffects.deferred.targets.length || sideEffects.deferred.triggerAction
			)) {
				const context = sideEffectsProperties.onRowContext
					? this.referenceRowContext
					: controller._sideEffects.getContextForSideEffects(
							this.referenceRowContext,
							sideEffectsProperties.sideEffects.fullyQualifiedName.split("@")[0]
					  );
				if (context && !sideEffectsExecuted.has(sideEffectsProperties.sideEffects.fullyQualifiedName)) {
					sideEffectsExecuted.add(sideEffectsProperties.sideEffects.fullyQualifiedName);
					controller._sideEffects.requestSideEffects(sideEffectsProperties.sideEffects, context, "$auto.massEditDeferred", () => {
						return {
							targets: genericTargetEntity
								? sideEffectsProperties.deferred.targets.filter(
										(target) => typeof target === "string" || target !== genericTargetEntity
								  )
								: sideEffectsProperties.deferred.targets,
							triggerAction: sideEffectsProperties.deferred.triggerAction
						};
					});
				}
			}
		}

		if (genericSideEffects && genericTargetEntity) {
			const context = controller._sideEffects.getContextForSideEffects(
				this.referenceRowContext,
				genericSideEffects.sideEffects.fullyQualifiedName.split("@")[0]
			);
			if (context) {
				controller._sideEffects.requestSideEffects(genericSideEffects.sideEffects, context, "$auto.massEditDeferred", () => {
					return {
						targets: [genericTargetEntity],
						triggerAction: undefined
					};
				});
			}
		}
	}
}

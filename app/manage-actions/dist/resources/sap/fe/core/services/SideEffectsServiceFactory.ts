import type {
	Action,
	ConvertedMetadata,
	EntitySet,
	EntityType,
	NavigationProperty,
	NavigationPropertyPath,
	Property,
	PropertyPath
} from "@sap-ux/vocabularies-types";
import type * as Edm from "@sap-ux/vocabularies-types/Edm";
import type { PathAnnotationExpression } from "@sap-ux/vocabularies-types/Edm";
import type { SideEffectsType as CommonSideEffectsType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import Log from "sap/base/Log";
import type PageController from "sap/fe/core/PageController";
import type {
	SideEffectsEventsInteractionManifestSetting,
	SideEffectsEventsInteractionType
} from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import {
	isComplexType,
	isEntitySet,
	isEntityType,
	isNavigationProperty,
	isProperty,
	isPropertyPathExpression
} from "sap/fe/core/helpers/TypeGuards";
import { ChannelType, WEBSOCKET_STATUS, createWebSocket, getWebSocketBaseUrl, getWebSocketChannelUrl } from "sap/fe/core/helpers/WebSocket";
import { getAssociatedTextPropertyPath } from "sap/fe/core/templating/PropertyHelper";
import MessageBox from "sap/m/MessageBox";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type SapPcpWebSocket from "sap/ui/core/ws/SapPcpWebSocket";
import type { WebSocket$CloseEvent, WebSocket$MessageEvent } from "sap/ui/core/ws/WebSocket";
import type { default as Context } from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";
import type { DataModelObjectPath } from "../templating/DataModelPathHelper";
import { enhanceDataModelPath, getTargetNavigationPath, getTargetObjectPath } from "../templating/DataModelPathHelper";
import type { EnvironmentCapabilities, EnvironmentCapabilitiesService } from "./EnvironmentServiceFactory";

export type PropertyAnnotationsWithRecommendation = PropertyAnnotations_Common & {
	RecommendationRole?: string;
};

type SideEffectsSettings = {};

export type SideEffectsEntityType = {
	$NavigationPropertyPath: string;
};
export type SideEffectsTarget = SideEffectsEntityType | string;

export type SideEffectsTargetType = {
	targetProperties: string[];
	targetEntities: SideEffectsEntityType[];
};

type BaseSideEffectsType = {
	sourceProperties?: string[];
	sourceEntities?: SideEffectsEntityType[];
	sourceEvents?: string[];
	fullyQualifiedName: string;
} & SideEffectsTargetType;

export type ODataSideEffectsType = BaseSideEffectsType & {
	triggerAction?: string;
};

export type ActionSideEffectsType = {
	pathExpressions?: SideEffectsTarget[];
	triggerActions?: string[];
};

export type ControlSideEffectsType = Partial<BaseSideEffectsType> & {
	fullyQualifiedName: string;
	sourceProperties: string[];
	sourceControlId: string;
};

export type SideEffectsType = ControlSideEffectsType | ODataSideEffectsType;

//TODO fix this type in the ux vocabularies
//TODO: Source Events are still experimental, remove once public
type CommonSideEffectTypeWithQualifier = CommonSideEffectsType & { qualifier?: string; SourceEvents?: Edm.String[] };

export type SideEffectInfoForSource = { entity: string; qualifier?: string; hasUniqueSourceProperty?: boolean };

type SideEffectsOriginRegistry = {
	oData: {
		entities: {
			[entity: string]: Record<string, ODataSideEffectsType>;
		};
		actions: {
			boundActions: {
				[entity: string]: Record<string, ActionSideEffectsType>;
			};
			unBoundActions: {
				[action: string]: ActionSideEffectsType;
			};
		};
	};
	control: {
		[entity: string]: Record<string, ControlSideEffectsType>;
	};
};

type RecommendationsRoles = {
	input: string[];
	output: string[];
	required?: string[];
};

export type RecommendationsRegistry = {
	roles: Record<string, RecommendationsRoles>;
};

type WebSocketMessage = {
	serverAction: "RaiseSideEffect";
	sideEffectEventName: string;
	sideEffectSource: string;
};

export class SideEffectsService extends Service<SideEffectsSettings> {
	appComponent!: AppComponent;

	private sideEffectsRegistry!: SideEffectsOriginRegistry;

	private recommendationRegistry!: RecommendationsRegistry;

	private capabilities!: EnvironmentCapabilities | undefined;

	private sourcesToSideEffectMappings!: {
		entities: Record<string, SideEffectInfoForSource[]>;
		properties: Record<string, SideEffectInfoForSource[]>;
		events: Record<string, SideEffectInfoForSource[]>;
	};

	// Callback methods to be called whenever a side effect target is hit
	private targetCallbacks!: Record<string, Function>;

	// WebSocket connection to retrieve SideEffects events
	private webSocket?: SapPcpWebSocket;

	private containerName?: string;

	private containerRegexPattern!: RegExp;

	private entityTypeRegexPattern!: RegExp;

	private webSocketStatus!: WEBSOCKET_STATUS;
	// Interaction type for SideEffects events
	private interactionTypeDefinition?: SideEffectsEventsInteractionManifestSetting;

	// !: means that we know it will be assigned before usage
	init(): void {
		const context = this.getContext();
		this.appComponent = context?.scopeObject as AppComponent;
		this.sideEffectsRegistry = {
			oData: {
				entities: {},
				actions: {
					boundActions: {},
					unBoundActions: {}
				}
			},
			control: {}
		};

		this.recommendationRegistry = {
			roles: {}
		};
		this.targetCallbacks = {};
	}

	/**
	 * Connects to a given WebSocket connection to retrieve SideEffects events.
	 *
	 */
	initializeWebSocketConnection(): void {
		const model = this.appComponent.getModel();
		const url = getWebSocketBaseUrl(model);
		const channel = getWebSocketChannelUrl(ChannelType.SideEffectsEvents, model);

		if (url && channel) {
			this.webSocket = createWebSocket(ChannelType.SideEffectsEvents, model);
			this.webSocket.attachMessage(this.onSideEffectsEventReceived.bind(this));
			this.webSocketStatus = WEBSOCKET_STATUS.CONNECTED;

			const showConnectionLostDialog = (): void => {
				if ([WEBSOCKET_STATUS.CLOSED, WEBSOCKET_STATUS.ERROR].includes(this.webSocketStatus)) {
					const resourceModel = getResourceModel(this.appComponent);
					const lostOfConnectionText = resourceModel.getText("C_SIDEEFFECT_CONNECTION_LOST");

					MessageBox.warning(lostOfConnectionText, {
						actions: [MessageBox.Action.OK],
						emphasizedAction: MessageBox.Action.OK
					});
				}
			};

			this.webSocket.attachError(() => {
				this.webSocketStatus = WEBSOCKET_STATUS.ERROR;
				showConnectionLostDialog();
			});

			this.webSocket.attachClose((evt: WebSocket$CloseEvent) => {
				this.webSocketStatus = WEBSOCKET_STATUS.CLOSED;
				// RFC 6455 defines the status codes when closing an established connection :  https://datatracker.ietf.org/doc/html/rfc6455#section-7.4
				// status code 1000 means normal closure
				if ((evt.getParameter("code") as number | undefined) !== 1000) {
					showConnectionLostDialog();
				}
			});
		}
	}

	/**
	 * This method is called whenever the connected WebSocket sends a message.
	 * @param event The event with the relevant sideEffect information
	 */
	async onSideEffectsEventReceived(event: WebSocket$MessageEvent & Event<{ pcpFields?: WebSocketMessage }>): Promise<void> {
		const message = event.getParameter("pcpFields");

		if (message?.serverAction !== "RaiseSideEffect" || !message.sideEffectEventName || !message.sideEffectSource) {
			// message is not relevant
			return;
		}

		const metaPath = this.getMetaModel().getMetaContext(message.sideEffectSource);
		const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaPath);
		const relevantSideEffects = this.getSideEffectWhereEventIsSource(
			dataModel.targetEntityType.fullyQualifiedName,
			message.sideEffectEventName
		);

		if (relevantSideEffects.length === 0) {
			// no side effect for this source
			return;
		}

		const relevantPages: PageController[] = [];
		const pages = this.appComponent.getRootViewController().getVisibleViews();
		for (const page of pages) {
			const pageController = page.getController();
			if (
				pageController.isA<PageController>("sap.fe.core.PageController") &&
				pageController._sideEffects.isDataPathRelevant(message.sideEffectSource, message.sideEffectEventName)
			) {
				relevantPages.push(pageController);
			}
		}

		if (relevantPages.length === 0) {
			// no relevant page found for this source
			return;
		}

		// we ask the user to confirm the refresh or notify the user, we use the most specific page
		const sideEffectsControllerExtension = relevantPages[relevantPages.length - 1]._sideEffects;
		const onlyRecommendations = this.isOnlyRecommendations(dataModel, relevantSideEffects);
		const interactionType = this.getSideEffectsInteractionType(message.sideEffectEventName, onlyRecommendations);

		switch (interactionType) {
			case "Confirmation":
				try {
					await sideEffectsControllerExtension.confirmDataRefresh();
				} catch (error) {
					return;
				}
				break;
			case "Notification":
				sideEffectsControllerExtension.notifyDataRefresh();
				break;
			case "None":
				break;
		}

		// now refresh the pages, forward this task to the side effects controller extensions to allow overriding per page (i.e. LR)
		for (const page of relevantPages) {
			await page._sideEffects.requestSideEffectsForEvent(message.sideEffectEventName, message.sideEffectSource);
		}
	}

	/**
	 * Check if only recommendations are defined for a specific event.
	 * @param dataModel The data model object path
	 * @param relevantSideEffects The relevant side effects for the source
	 * @returns True if only recommendations are defined for the event
	 */
	isOnlyRecommendations(dataModel: DataModelObjectPath<unknown>, relevantSideEffects: SideEffectInfoForSource[]): boolean {
		const recommendationPath = (
			dataModel.targetEntityType.annotations.UI?.Recommendations as PathAnnotationExpression<string> | undefined
		)?.path;
		for (const sideEffect of relevantSideEffects) {
			const annotation =
				this.sideEffectsRegistry.oData.entities[dataModel.targetEntityType.fullyQualifiedName]?.[
					`${sideEffect.entity}@com.sap.vocabularies.Common.v1.SideEffects#${sideEffect.qualifier}`
				];
			// check if the side effect is only a recommendation
			if (
				annotation?.targetProperties.length === 1 &&
				annotation?.targetEntities.length === 0 &&
				annotation?.targetProperties[0] === recommendationPath
			) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Retrieve the side effects interaction type from the manifest.
	 *  @param event The side effects event name
	 *  @param onlyRecommendations Indicator if only recommendations are shown
	 * @returns The side effects interaction type
	 */
	getSideEffectsInteractionType(event: string, onlyRecommendations = false): SideEffectsEventsInteractionType {
		if (!this.interactionTypeDefinition) {
			this.interactionTypeDefinition = this.appComponent.getManifestEntry("sap.fe")?.app?.sideEffectsEventsInteractionType;
		}
		if (onlyRecommendations) {
			// In case of only recommendations, we do not show any notification
			return "None";
		}

		if (typeof this.interactionTypeDefinition === "string") {
			// a global interaction type is defined
			return this.interactionTypeDefinition;
		}

		if (event && this.interactionTypeDefinition?.events?.[event]) {
			// an interaction type is defined for the event
			return this.interactionTypeDefinition.events[event];
		}

		if (this.interactionTypeDefinition?.default) {
			// a default interaction type is defined for the event
			return this.interactionTypeDefinition.default;
		}

		return "Notification";
	}

	/**
	 * Adds a SideEffects control
	 * SideEffects definition is added by a control to keep data up to date
	 * These SideEffects get limited scope compared with SideEffects coming from an OData service:
	 * - Only one SideEffects definition can be defined for the combination entity type - control Id
	 * - Only SideEffects source properties are recognized and used to trigger SideEffects
	 *
	 * Ensure the sourceControlId matches the associated SAPUI5 control ID.
	 * @param entityType Name of the entity type
	 * @param sideEffect SideEffects definition
	 */
	public addControlSideEffects(entityType: string, sideEffect: Omit<ControlSideEffectsType, "fullyQualifiedName">): void {
		if (sideEffect.sourceControlId) {
			const controlSideEffect: ControlSideEffectsType = {
				...sideEffect,
				fullyQualifiedName: `${entityType}/SideEffectsForControl/${sideEffect.sourceControlId}`
			};
			const entityControlSideEffects = this.sideEffectsRegistry.control[entityType] || {};
			entityControlSideEffects[controlSideEffect.sourceControlId] = controlSideEffect;
			this.sideEffectsRegistry.control[entityType] = entityControlSideEffects;
		}
	}

	/**
	 * Executes SideEffects action.
	 * @param triggerAction Name of the action
	 * @param context Context
	 * @param groupId The group ID to be used for the request
	 * @returns A promise that is resolved without data or with a return value context when the action call succeeds
	 */
	public async executeAction(triggerAction: string, context: Context, groupId?: string): Promise<void> {
		const action = context.getModel().bindContext(`${triggerAction}(...)`, context);
		groupId = groupId || context.getBinding().getUpdateGroupId();
		// the triggerAction is executed in same $batch but different changeset
		context.getModel().submitBatch(groupId);
		await action.execute(groupId, true);
	}

	/**
	 * Gets converted OData metaModel.
	 * @returns Converted OData metaModel
	 */
	public getConvertedMetaModel(): ConvertedMetadata {
		return convertTypes(this.getMetaModel(), this.capabilities);
	}

	/**
	 * Gets the entity type of a context.
	 * @param context Context
	 * @returns Entity Type
	 */
	public getEntityTypeFromContext(context: Context): string | undefined {
		const metaModel = context.getModel().getMetaModel(),
			metaPath = metaModel.getMetaPath(context.getPath()),
			entityType = metaModel.getObject(metaPath)["$Type"];
		return entityType;
	}

	/**
	 * Gets the SideEffects that come from an OData service.
	 * @param entityTypeName Name of the entity type
	 * @returns SideEffects dictionary
	 */
	public getODataEntitySideEffects(entityTypeName: string): Record<string, ODataSideEffectsType> {
		return this.sideEffectsRegistry.oData.entities[entityTypeName] || {};
	}

	/**
	 * Is a SideEffects generated by a control.
	 * @param sideEffects The SideEffects
	 * @returns True if the SideEffects is generated by a control, otherwise false
	 */
	public isControlSideEffects(sideEffects: SideEffectsType): sideEffects is ControlSideEffectsType {
		return !!(sideEffects as ControlSideEffectsType).sourceControlId;
	}

	/**
	 * Gets the global SideEffects that come from an OData service.
	 * @param entityTypeName Name of the entity type
	 * @returns Global SideEffects
	 */
	public getGlobalODataEntitySideEffects(entityTypeName: string): ODataSideEffectsType[] {
		const entitySideEffects = this.getODataEntitySideEffects(entityTypeName);
		const globalSideEffects: ODataSideEffectsType[] = [];
		for (const key in entitySideEffects) {
			const sideEffects = entitySideEffects[key];
			if (!sideEffects.sourceEntities && !sideEffects.sourceProperties && !sideEffects.sourceEvents) {
				globalSideEffects.push(sideEffects);
			}
		}
		return globalSideEffects;
	}

	/**
	 * Gets the SideEffects that come from an OData service.
	 * @param actionName Name of the action
	 * @param context Context
	 * @returns SideEffects definition
	 */
	public getODataActionSideEffects(actionName: string, context?: Context): ActionSideEffectsType | undefined {
		if (context) {
			const entityType = this.getEntityTypeFromContext(context);
			if (entityType) {
				return this.sideEffectsRegistry.oData.actions.boundActions[entityType]?.[actionName];
			}
		} else {
			return this.sideEffectsRegistry.oData.actions.unBoundActions?.[actionName];
		}
		return undefined;
	}

	/**
	 * Gets the SideEffects for the context and the event.
	 * @param context The context of the SideEffects
	 * @param event The SideEffects of the event
	 * @returns An array containing the SideEffects matching with the context and the event
	 */
	public getODataSideEffectsFromContextEvent(context: Context, event: string): ODataSideEffectsType[] {
		const metaPath = context.getModel().getMetaModel().getMetaContext(context.getPath());
		const dataModel = getInvolvedDataModelObjects(metaPath);
		const sideEffectsInfo = this.getSideEffectWhereEventIsSource(dataModel.targetEntityType.fullyQualifiedName, event);
		return sideEffectsInfo.map(
			(sideEffect) =>
				this.sideEffectsRegistry.oData.entities[dataModel.targetEntityType.fullyQualifiedName]?.[
					`${sideEffect.entity}@com.sap.vocabularies.Common.v1.SideEffects#${sideEffect.qualifier}`
				]
		);
	}

	/**
	 * Generates the dictionary for the SideEffects.
	 *  @returns Promise resolving with the SideEffects service once data has been written
	 */
	async initialize(): Promise<this> {
		const sideEffectSources: {
			entities: Record<string, SideEffectInfoForSource[]>;
			properties: Record<string, SideEffectInfoForSource[]>;
			events: Record<string, SideEffectInfoForSource[]>;
		} = {
			entities: {},
			properties: {},
			events: {}
		};
		const environmentCapabilitiesService = (await this.appComponent.getService(
			"environmentCapabilities"
		)) as EnvironmentCapabilitiesService;
		const model = this.appComponent.getModel();
		if (model?.isA?.<ODataModel>("sap.ui.model.odata.v4.ODataModel")) {
			// We need to wait for the MetaModel to be requested
			await model.getMetaModel().requestObject("/$EntityContainer/");
			this.capabilities = environmentCapabilitiesService.getCapabilities();

			const convertedMetaModel = this.getConvertedMetaModel();
			this.containerName = convertedMetaModel.entityContainer.fullyQualifiedName;
			this.containerRegexPattern = new RegExp(`^\\/${this.containerName}\\/[^/]+\\/(.+)?$`);
			this.entityTypeRegexPattern = new RegExp(`^/${this.containerName}/([^/]+)`);
			convertedMetaModel.entityTypes.forEach((entityType: EntityType) => {
				this.mapFieldAnnotations(entityType);
				this.sideEffectsRegistry.oData.entities[entityType.fullyQualifiedName] = this.retrieveODataEntitySideEffects(entityType);
				this.mapSideEffectSources(entityType, sideEffectSources);
			});
			convertedMetaModel.actions.forEach((action: Action) => {
				if (action.isBound) {
					this.sideEffectsRegistry.oData.actions.boundActions[action.sourceEntityType!.fullyQualifiedName] = {
						...this.sideEffectsRegistry.oData.actions.boundActions[action.sourceEntityType!.fullyQualifiedName],
						...this.retrieveODataActionsSideEffects(action)
					};
				} else {
					this.sideEffectsRegistry.oData.actions.unBoundActions = {
						...this.sideEffectsRegistry.oData.actions.unBoundActions,
						...this.retrieveODataActionsSideEffects(action)
					};
				}
			});
			if (Object.keys(sideEffectSources.events).length > 0) {
				this.initializeWebSocketConnection();
			}
		}
		this.sourcesToSideEffectMappings = sideEffectSources;
		return this;
	}

	private mapFieldAnnotations(source: EntityType): void {
		const addRecommendationRoles = (sourceName: string): void => {
			if (!this.recommendationRegistry.roles.hasOwnProperty(`${sourceName}`)) {
				this.recommendationRegistry.roles[`${sourceName}`] = {
					input: [],
					output: []
				};
			}
		};
		source.entityProperties.forEach((property) => {
			const commonAnno = property.annotations.Common as PropertyAnnotationsWithRecommendation;
			if (commonAnno?.RecommendationRole) {
				const roleType = commonAnno.RecommendationRole;
				if (roleType.valueOf().includes("Input")) {
					addRecommendationRoles(`${source.name}`);
					this.recommendationRegistry.roles[`${source.name}`].input.push(property.name);
				}
				if (roleType.valueOf().includes("Output")) {
					addRecommendationRoles(`${source.name}`);
					this.recommendationRegistry.roles[`${source.name}`].output.push(property.name);
				}
			}
		});
	}

	public getRecommendationsMapping(): RecommendationsRegistry {
		return this.recommendationRegistry;
	}

	/**
	 * This function will return true if field is part of Recommendation's input mapping and from the same entity.
	 * Otherwise return false.
	 * @param field
	 * @returns True if field is has recommendation role - Input annotation
	 */
	public checkIfFieldIsRecommendationRelevant(field: Control): boolean {
		const context = field.getBindingContext();
		const propertyName = field.data().sourcePath.split("/").pop();
		if (context) {
			const metaModel = context?.getModel().getMetaModel();
			const metaContext = (metaModel as ODataMetaModel)?.getMetaContext(context.getPath());
			const targetDataModelObject = MetaModelConverter.getInvolvedDataModelObjects<EntitySet | NavigationProperty>(metaContext)
				.targetObject!;
			let targetEntityTypeName;
			if (isEntitySet(targetDataModelObject)) {
				targetEntityTypeName = targetDataModelObject.entityType?.name;
			} else if (isNavigationProperty(targetDataModelObject)) {
				targetEntityTypeName = targetDataModelObject.targetType?.name;
			}
			const recommendationRolesForEntity = targetEntityTypeName && this.recommendationRegistry.roles[targetEntityTypeName];
			if (recommendationRolesForEntity && recommendationRolesForEntity?.input?.includes(propertyName)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Method returns the properties in a specific entity type which are marked as RecommendationRole Output.
	 * @param entityTypeName Entity type for which recommendation Output fields needs to be figured
	 * @returns Array of property names which are marked RecommendationRole Output
	 */
	public getRecommendationOutputFields(entityTypeName: string): string[] {
		//TODO: We have to consider 1:1 navigation properties as well.
		const recommendationRolesForEntity = this.recommendationRegistry.roles[entityTypeName];
		if (recommendationRolesForEntity?.output?.length > 0) {
			return recommendationRolesForEntity.output;
		}

		return [];
	}

	/**
	 * Removes all SideEffects related to a control.
	 * @param controlId Control Id
	 */
	public removeControlSideEffects(controlId: string): void {
		Object.keys(this.sideEffectsRegistry.control).forEach((sEntityType) => {
			if (this.sideEffectsRegistry.control[sEntityType][controlId]) {
				delete this.sideEffectsRegistry.control[sEntityType][controlId];
			}
		});
	}

	/**
	 * Requests the SideEffects on a specific context.
	 * @param pathExpressions Targets of SideEffects to be executed
	 * @param context Context where SideEffects need to be executed
	 * @param groupId The group ID to be used for the request
	 * @returns Promise on SideEffects request
	 */
	public async requestSideEffects(pathExpressions: SideEffectsTarget[], context: Context, groupId?: string): Promise<void> {
		if (pathExpressions.length) {
			this.logRequest(pathExpressions, context);
			await context.requestSideEffects(pathExpressions, groupId);
		}
	}

	/**
	 * Requests the SideEffects for an OData action.
	 * @param sideEffects SideEffects definition
	 * @param context Context where SideEffects need to be executed
	 * @returns Promise on SideEffects requests and action execution
	 */
	public async requestSideEffectsForODataAction(sideEffects: ActionSideEffectsType, context: Context): Promise<(void | undefined)[]> {
		let promises: Promise<void | undefined>[];

		if (sideEffects.triggerActions?.length) {
			promises = sideEffects.triggerActions.map(async (actionName): Promise<void> => {
				return this.executeAction(actionName, context);
			});
		} else {
			promises = [];
		}

		if (sideEffects.pathExpressions?.length) {
			promises.push(this.requestSideEffects(sideEffects.pathExpressions, context));
		}

		return promises.length ? Promise.all(promises) : Promise.resolve([]);
	}

	/**
	 * Requests the SideEffects for a navigation property on a specific context.
	 * @param navigationProperty Navigation property
	 * @param context Context where SideEffects need to be executed
	 * @param groupId Batch group for the query
	 * @param ignoreTriggerActions If true, we do not trigger actions defined in the side effect
	 * @returns SideEffects request on SAPUI5 context
	 */
	public async requestSideEffectsForNavigationProperty(
		navigationProperty: string,
		context: Context,
		groupId?: string,
		ignoreTriggerActions = false
	): Promise<void | undefined> {
		const baseEntityType = this.getEntityTypeFromContext(context);
		if (baseEntityType) {
			const navigationPath = `${navigationProperty}/`;
			const entitySideEffects = this.getODataEntitySideEffects(baseEntityType);
			let targetProperties: string[] = [];
			let targetEntities: SideEffectsEntityType[] = [];
			let sideEffectsTargets: SideEffectsTarget[] = [];
			Object.keys(entitySideEffects)
				.filter(
					// Keep relevant SideEffects
					// 1. SourceEntities match OR
					// 2. Only 1 SourceProperties and match
					(annotationName) => {
						const sideEffects: ODataSideEffectsType = entitySideEffects[annotationName];
						return (
							(sideEffects.sourceEntities || []).some(
								(navigation) => navigation.$NavigationPropertyPath === navigationProperty
							) ||
							(sideEffects.sourceProperties?.length === 1 &&
								sideEffects.sourceProperties.some(
									(propertyPath) =>
										propertyPath.startsWith(navigationPath) && !propertyPath.replace(navigationPath, "").includes("/")
								))
						);
					}
				)
				.forEach((sAnnotationName) => {
					const sideEffects = entitySideEffects[sAnnotationName];
					if (sideEffects.triggerAction && !ignoreTriggerActions) {
						this.executeAction(sideEffects.triggerAction, context, groupId);
					}
					targetProperties = targetProperties.concat(sideEffects.targetProperties);
					targetEntities = targetEntities.concat(sideEffects.targetEntities);
				});
			// Remove duplicate targets
			const sideEffectsTargetDefinition = this.removeDuplicateTargets({
				targetProperties: targetProperties,
				targetEntities: targetEntities
			});
			sideEffectsTargets = [...sideEffectsTargetDefinition.targetProperties, ...sideEffectsTargetDefinition.targetEntities];
			if (sideEffectsTargets.length) {
				return this.requestSideEffects(sideEffectsTargets, context, groupId).catch((error) =>
					Log.error(`SideEffects - Error while processing SideEffects for Navigation Property ${navigationProperty}`, error)
				);
			}
		}
		return Promise.resolve();
	}

	/**
	 * Gets the SideEffects that come from controls.
	 * @param entityTypeName Entity type Name
	 * @returns SideEffects dictionary
	 */
	public getControlEntitySideEffects(entityTypeName: string): Record<string, ControlSideEffectsType> {
		return this.sideEffectsRegistry.control[entityTypeName] || {};
	}

	/**
	 * Gets SideEffects' qualifier and owner entity where this entity is used as source.
	 * @param entityTypeName Entity type fully qualified name
	 * @returns Array of sideEffects info
	 */
	public getSideEffectWhereEntityIsSource(entityTypeName: string): SideEffectInfoForSource[] {
		return this.sourcesToSideEffectMappings.entities[entityTypeName] || [];
	}

	/**
	 * Gets SideEffects' qualifiers where this event is used as source.
	 * @param entityTypeName Entity type fully qualified
	 * @param eventName Side Effect event name
	 * @returns Array of sideEffects info
	 */
	public getSideEffectWhereEventIsSource(entityTypeName: string, eventName: string): SideEffectInfoForSource[] {
		return this.sourcesToSideEffectMappings.events[eventName]?.filter((event) => event.entity === entityTypeName) || [];
	}

	/**
	 * Requests the SideEffects for a sideEffect event on a specific context.
	 * @param event SideEffects event which should be
	 * @param context Context where SideEffects need to be executed
	 * @param groupId The group ID to be used for the request
	 * @returns Promise on SideEffects request
	 */
	async requestSideEffectsForEvent(event: string, context: Context, groupId?: string): Promise<undefined> {
		const sideEffects = this.getODataSideEffectsFromContextEvent(context, event);
		let targetProperties: string[] = [];
		let targetEntities: SideEffectsEntityType[] = [];

		sideEffects.forEach((sideEffect) => {
			targetProperties = targetProperties.concat(sideEffect.targetProperties);
			targetEntities = targetEntities.concat(sideEffect.targetEntities);
		});

		const sideEffectsTargetDefinition = this.removeDuplicateTargets({
			targetProperties: targetProperties,
			targetEntities: targetEntities
		});
		const sideEffectsTargets = [...sideEffectsTargetDefinition.targetProperties, ...sideEffectsTargetDefinition.targetEntities];
		if (sideEffectsTargets.length) {
			try {
				await this.requestSideEffects(sideEffectsTargets, context, groupId);
			} catch (error) {
				Log.error(`SideEffects - Error while processing SideEffects for Event ${event}`, error as string);
			}
		}
	}

	/**
	 * Common method to get the field groupIds for a source entity and a source property.
	 * @param sourceEntityType
	 * @param sourceProperty
	 * @returns A collection of fieldGroupIds
	 */
	public computeFieldGroupIds(sourceEntityType: string, sourceProperty: string): string[] {
		const entityFieldGroupIds = this.getSideEffectWhereEntityIsSource(sourceEntityType).map((sideEffectInfo) =>
			this.getFieldGroupIdForSideEffect(sideEffectInfo, true)
		);
		return entityFieldGroupIds.concat(
			this.getSideEffectWherePropertyIsSource(sourceProperty).map((sideEffectInfo) =>
				this.getFieldGroupIdForSideEffect(sideEffectInfo)
			)
		);
	}

	/**
	 * Gets SideEffects' qualifier and owner entity where this property is used as source.
	 * @param propertyName Property fully qualified name
	 * @returns Array of sideEffects info
	 */
	public getSideEffectWherePropertyIsSource(propertyName: string): SideEffectInfoForSource[] {
		return this.sourcesToSideEffectMappings.properties[propertyName] || [];
	}

	// check if can define whether callbacks are async. Otherwise comment
	// only one callback for one target
	public registerTargetCallback(target: string, callback: Function): void {
		this.targetCallbacks[target] = callback;
	}

	public deregisterTargetCallback(target: string): void {
		delete this.targetCallbacks[target];
	}

	// pass parameter
	public getRegisteredCallback(target: string): Function | undefined {
		return this.targetCallbacks[target];
	}

	/**
	 * Returns updated side effects definition with all text related properties.
	 * @param sideEffectsTargets The targets of the side effect
	 * @param entityType Name of the entity where the side effect is registered
	 * @returns Updated side effects' targets with added text properties or entities
	 */
	private addTextProperties(sideEffectsTargets: SideEffectsTargetType, entityType?: EntityType): SideEffectsTargetType {
		const setOfProperties = new Set(sideEffectsTargets.targetProperties);
		const setOfEntities = new Set(sideEffectsTargets.targetEntities.map((target) => target.$NavigationPropertyPath));
		// Generate all paths related to the text properties and not already covered by the SideEffects
		for (const propertyPath of sideEffectsTargets.targetProperties) {
			for (const dataModelPropertyPath of this.getDataModelPropertiesFromAPath(propertyPath, entityType)) {
				const associatedTextPath = getAssociatedTextPropertyPath(dataModelPropertyPath.targetObject);
				if (associatedTextPath) {
					this.addTextProperty(dataModelPropertyPath, propertyPath, associatedTextPath, setOfProperties, setOfEntities);
				}
			}
		}
		return {
			targetProperties: Array.from(setOfProperties),
			targetEntities: Array.from(setOfEntities).map((navigation) => {
				return { $NavigationPropertyPath: navigation };
			})
		};
	}

	/**
	 * Adds text related property to the side effects targets
	 * If the property has an associated text then this text needs to be added if it's not already reflected in the side effects definition:
	 * - as targetProperties if the property and its associated text are on the same entitySet
	 * - as targetEntities if they are defined on different entitySets.
	 * @param dataModelPropertyPath The model object path of the property
	 * @param propertyPath The property path
	 * @param associatedTextPath The associated text property path
	 * @param setOfProperties Set of existing sideEffect's target properties
	 * @param setOfEntities Set of existing sideEffect's target entities
	 */
	private addTextProperty(
		dataModelPropertyPath: DataModelObjectPath<Property>,
		propertyPath: string,
		associatedTextPath: string,
		setOfProperties: Set<string>,
		setOfEntities: Set<string>
	): void {
		const dataModelTextPath = enhanceDataModelPath<Property>(dataModelPropertyPath, associatedTextPath);
		const relativeNavigation =
			propertyPath.startsWith("/") &&
			dataModelTextPath.targetEntitySet &&
			dataModelTextPath.targetEntitySet.name !== dataModelPropertyPath.targetEntitySet?.name
				? `/${dataModelTextPath.targetEntitySet?.fullyQualifiedName}`
				: getTargetNavigationPath(dataModelTextPath, true);
		const targetPath = propertyPath.startsWith("/")
			? `/${dataModelTextPath.targetEntitySet?.fullyQualifiedName}/${dataModelTextPath.targetObject!.name}`
			: getTargetObjectPath(dataModelTextPath, true);
		if (
			this.isAssociatedTextListedInSideEffectTargets(
				dataModelTextPath,
				relativeNavigation,
				targetPath,
				setOfProperties,
				setOfEntities
			)
		) {
			if (this.isPropertyAssociatedTextOnDifferentEntitySet(dataModelPropertyPath, dataModelTextPath)) {
				setOfEntities.add(relativeNavigation);
			} else {
				setOfProperties.add(targetPath);
			}
		}
	}

	/**
	 * Checks if the associated text property needs to be added if it's not already reflected in the side effects definition:
	 * - as targetProperties if the property and its associated text are on the same entitySet
	 * - as targetEntities if they are defined on different entitySets.
	 * @param dataModelTextPath The model object path of the associated text
	 * @param relativeNavigation The navigation to the text property
	 * @param targetPath The associated text property path
	 * @param setOfProperties Set of existing sideEffect's target properties
	 * @param setOfEntities Set of existing sideEffect's target entities
	 * @returns Updated side effects' targets with added text property or entity
	 */
	private isAssociatedTextListedInSideEffectTargets(
		dataModelTextPath: DataModelObjectPath<Property>,
		relativeNavigation: string,
		targetPath: string,
		setOfProperties: Set<string>,
		setOfEntities: Set<string>
	): boolean {
		return (
			isProperty(dataModelTextPath.targetObject) &&
			!setOfProperties.has(targetPath) && // the property is already listed
			!setOfProperties.has(`${relativeNavigation}${dataModelTextPath.navigationProperties.length ? "/" : ""}*`) && // the property is already listed thanks to the "*"
			!setOfEntities.has(`${relativeNavigation}`) // the property is not part of a TargetEntities
		);
	}

	/**
	 * Checks if the property and its associated text property are on different entitySet.
	 * @param dataModelPropertyPath The model object path of the property
	 * @param dataModelTextPath The model object path of the associated text property
	 * @returns True if the entitySet is different
	 */
	private isPropertyAssociatedTextOnDifferentEntitySet(
		dataModelPropertyPath: DataModelObjectPath<Property>,
		dataModelTextPath: DataModelObjectPath<Property>
	): boolean {
		return (
			dataModelPropertyPath.targetEntitySet !== dataModelTextPath.targetEntitySet &&
			!!dataModelTextPath.navigationProperties &&
			!!dataModelTextPath.targetEntityType
		);
	}

	/**
	 * Converts the SideEffects to expected format
	 * - Set TriggerAction as string
	 * - Converts SideEffects targets to expected format
	 * - Removes binding parameter from SideEffects targets properties
	 * - Adds the text properties
	 * - Replaces TargetProperties having reference to Source Properties for a SideEffects.
	 * @param sideEffects SideEffects definition
	 * @param entityType Entity type
	 * @param bindingParameter Name of the binding parameter
	 * @returns SideEffects definition
	 */
	private convertSideEffects(
		sideEffects: CommonSideEffectsType,
		entityType?: EntityType,
		bindingParameter?: string
	): ODataSideEffectsType {
		const triggerAction = sideEffects.TriggerAction as string;
		const newSideEffects = this.convertSideEffectsFormat(sideEffects);
		let sideEffectsTargets = { targetProperties: newSideEffects.targetProperties, targetEntities: newSideEffects.targetEntities };
		sideEffectsTargets = this.removeBindingParameter(sideEffectsTargets, bindingParameter);
		sideEffectsTargets = this.addTextProperties(sideEffectsTargets, entityType);
		sideEffectsTargets = this.removeDuplicateTargets(sideEffectsTargets);
		return {
			...newSideEffects,
			...{ targetEntities: sideEffectsTargets.targetEntities, targetProperties: sideEffectsTargets.targetProperties, triggerAction }
		};
	}

	/**
	 * Converts the SideEffects targets (TargetEntities and TargetProperties) to expected format
	 * - TargetProperties as array of string
	 * - TargetEntities as array of object with property $NavigationPropertyPath.
	 * @param sideEffects SideEffects definition
	 * @returns Converted SideEffects
	 */
	private convertSideEffectsFormat(sideEffects: CommonSideEffectsType): ODataSideEffectsType {
		const formatProperties = (properties?: (string | PropertyPath)[]): string[] | undefined => {
			return properties
				? properties.reduce((targetProperties: string[], target) => {
						let path = "";
						if (isPropertyPathExpression(target)) {
							path = target.value;
						} else if (typeof target === "string") {
							path = target;
						}
						if (path) {
							targetProperties.push(path);
						} else {
							Log.error(
								`SideEffects - Error while processing TargetProperties for SideEffects ${sideEffects.fullyQualifiedName}`
							);
						}
						return targetProperties;
				  }, [])
				: properties;
		};
		const formatEntities = (entities?: NavigationPropertyPath[]): { $NavigationPropertyPath: string }[] | undefined => {
			return entities
				? entities.map((targetEntity) => {
						return { $NavigationPropertyPath: targetEntity.value };
				  })
				: entities;
		};

		// TODO: SourceEvents are still experimental, remove once public
		type CommonSideEffectTypeWithSourceEvents = CommonSideEffectsType & { SourceEvents?: Edm.String[] };

		return {
			fullyQualifiedName: sideEffects.fullyQualifiedName,
			sourceProperties: formatProperties(sideEffects.SourceProperties),
			sourceEntities: formatEntities(sideEffects.SourceEntities),
			sourceEvents: (sideEffects as CommonSideEffectTypeWithSourceEvents).SourceEvents as string[],
			targetProperties: formatProperties(sideEffects.TargetProperties as (string | PropertyPath)[]) ?? [],
			targetEntities: formatEntities(sideEffects.TargetEntities) ?? []
		};
	}

	/**
	 * Gets all dataModelObjectPath related to properties listed by a path
	 *
	 * The path can be:
	 * - a path targeting a property on a complexType or an EntityType
	 * - a path with a star targeting all properties on a complexType or an EntityType.
	 * - absolute.
	 * @param propertyPath The path to analyze
	 * @param entityType Entity type
	 * @returns Array of dataModelObjectPath representing the properties
	 */
	private getDataModelPropertiesFromAPath(propertyPath: string, entityType?: EntityType): DataModelObjectPath<Property>[] {
		let dataModelObjectPaths: DataModelObjectPath<Property>[] = [];
		const convertedMetaModel = this.getConvertedMetaModel();

		let propertyRelativePath: string | undefined, testEntityTypeName: string | undefined, match: RegExpMatchArray | null;
		if (propertyPath.startsWith(`/${this.containerName}/`)) {
			match = propertyPath.match(this.containerRegexPattern);
			propertyRelativePath = match ? match[1] : undefined;
		}
		if (!entityType) {
			match = propertyPath.match(this.entityTypeRegexPattern);
			testEntityTypeName = match ? match[1] : undefined;
		}
		const testEntityType =
			entityType ??
			((testEntityTypeName ? convertedMetaModel.resolvePath(`/${testEntityTypeName}/`).target : undefined) as EntityType | undefined);
		const entitySet =
			convertedMetaModel.entitySets.find((relatedEntitySet) => relatedEntitySet.entityType === testEntityType) ??
			convertedMetaModel.singletons.find((singleton) => singleton.entityType === testEntityType);
		if (entitySet) {
			const metaModel = this.getMetaModel(),
				entitySetContext = metaModel.createBindingContext(`/${entitySet.name}`);
			if (entitySetContext) {
				const dataModelEntitySet = getInvolvedDataModelObjects(entitySetContext);
				const dataModelObjectPath = enhanceDataModelPath<Property | EntityType>(
						dataModelEntitySet,
						(propertyRelativePath || propertyPath).replace("*", "") || "/"
					), // "*" is replaced by "/" to target the current EntityType
					targetObject = dataModelObjectPath.targetObject;
				if (isProperty(targetObject)) {
					if (isComplexType(targetObject.targetType)) {
						dataModelObjectPaths = dataModelObjectPaths.concat(
							targetObject.targetType.properties.map((property) =>
								enhanceDataModelPath<Property>(dataModelObjectPath, property.name)
							)
						);
					} else {
						dataModelObjectPaths.push(dataModelObjectPath as DataModelObjectPath<Property>);
					}
				} else if (isEntityType(targetObject)) {
					dataModelObjectPaths = dataModelObjectPaths.concat(
						dataModelObjectPath.targetEntityType.entityProperties.map((entityProperty) => {
							return enhanceDataModelPath<Property>(dataModelObjectPath, entityProperty.name);
						})
					);
				}
				entitySetContext.destroy();
			}
		}
		return dataModelObjectPaths.filter((dataModelObjectPath) => dataModelObjectPath.targetObject);
	}

	/**
	 * Gets the Odata metamodel.
	 * @returns The OData metamodel
	 */
	private getMetaModel(): ODataMetaModel {
		return this.appComponent.getModel().getMetaModel();
	}

	/**
	 * Gets the SideEffects related to an entity type or action that come from an OData Service
	 * Internal routine to get, from converted oData metaModel, SideEffects related to a specific entity type or action
	 * and to convert these SideEffects with expected format.
	 * @param source Entity type or action
	 * @returns Array of SideEffects
	 */
	private getSideEffectsFromSource(source: EntityType | Action): ODataSideEffectsType[] {
		let bindingAlias = "";
		const isSourceEntityType = isEntityType(source);
		const entityType: EntityType | undefined = isSourceEntityType ? source : source.sourceEntityType;
		const commonAnnotation = source.annotations?.Common as undefined | unknown as Record<string, CommonAnnotationTypes>;
		if (commonAnnotation) {
			if (entityType && !isSourceEntityType) {
				const bindingParameter = source.parameters?.find((parameter) => parameter.type === entityType.fullyQualifiedName);
				bindingAlias = bindingParameter?.fullyQualifiedName.split("/")[1] ?? "";
			}
			return this.getSideEffectsAnnotationFromSource(source).map((sideEffectAnno) =>
				this.convertSideEffects(sideEffectAnno, entityType, bindingAlias)
			);
		}
		return [];
	}

	/**
	 * Gets the SideEffects related to an entity type or action that come from an OData Service
	 * Internal routine to get, from converted oData metaModel, SideEffects related to a specific entity type or action.
	 * @param source Entity type or action
	 * @returns Array of SideEffects
	 */
	private getSideEffectsAnnotationFromSource(source: EntityType | Action): CommonSideEffectTypeWithQualifier[] {
		const sideEffects: CommonSideEffectsType[] = [];
		const commonAnnotation = source.annotations?.Common as undefined | unknown as Record<string, CommonSideEffectTypeWithQualifier>;
		for (const key in commonAnnotation) {
			const annotation = commonAnnotation[key];
			if (this.isSideEffectsAnnotation(annotation)) {
				sideEffects.push(annotation);
			}
		}
		return sideEffects;
	}

	/**
	 * Checks if the annotation is a SideEffects annotation.
	 * @param annotation Annotation
	 * @returns Boolean
	 */
	private isSideEffectsAnnotation(annotation: unknown): annotation is CommonSideEffectsType {
		return (annotation as CommonSideEffectsType)?.$Type === CommonAnnotationTypes.SideEffectsType;
	}

	/**
	 * Logs the SideEffects request.
	 * @param pathExpressions SideEffects targets
	 * @param context Context
	 */
	private logRequest(pathExpressions: SideEffectsTarget[], context: Context): void {
		const targetPaths = pathExpressions.reduce(function (paths, target) {
			return `${paths}\n\t\t${(target as SideEffectsEntityType).$NavigationPropertyPath || target || ""}`;
		}, "");
		Log.debug(`SideEffects - Request:\n\tContext path : ${context.getPath()}\n\tProperty paths :${targetPaths}`);
	}

	/**
	 * Removes the name of the binding parameter on the SideEffects targets.
	 * @param sideEffectsTargets SideEffects Targets
	 * @param bindingParameterName Name of binding parameter
	 * @returns SideEffects definition
	 */
	private removeBindingParameter(sideEffectsTargets: SideEffectsTargetType, bindingParameterName?: string): SideEffectsTargetType {
		if (bindingParameterName) {
			const replaceBindingParameter = function (value: string): string {
				return value.replace(new RegExp(`^${bindingParameterName}/?`), "");
			};
			return {
				targetProperties: sideEffectsTargets.targetProperties.map((targetProperty) => replaceBindingParameter(targetProperty)),
				targetEntities: sideEffectsTargets.targetEntities.map((targetEntity) => {
					return { $NavigationPropertyPath: replaceBindingParameter(targetEntity.$NavigationPropertyPath) };
				})
			};
		}
		return {
			targetProperties: sideEffectsTargets.targetProperties,
			targetEntities: sideEffectsTargets.targetEntities
		};
	}

	/**
	 * Remove duplicates in SideEffects targets.
	 * @param sideEffectsTargets SideEffects Targets
	 * @returns SideEffects targets without duplicates
	 */
	private removeDuplicateTargets(sideEffectsTargets: SideEffectsTargetType): SideEffectsTargetType {
		const targetEntitiesPaths = sideEffectsTargets.targetEntities.map((targetEntity) => targetEntity.$NavigationPropertyPath);
		const uniqueTargetedEntitiesPath = new Set<string>(targetEntitiesPaths);
		const uniqueTargetProperties = new Set<string>(sideEffectsTargets.targetProperties);

		const uniqueTargetedEntities = Array.from(uniqueTargetedEntitiesPath).map((entityPath) => {
			return {
				$NavigationPropertyPath: entityPath
			};
		});

		return { targetProperties: Array.from(uniqueTargetProperties), targetEntities: uniqueTargetedEntities };
	}

	/**
	 * Gets SideEffects action type that come from an OData Service
	 * Internal routine to get, from converted oData metaModel, SideEffects on actions
	 * related to a specific entity type and to convert these SideEffects with
	 * expected format.
	 * @param action Action
	 * @returns Entity type SideEffects dictionary
	 */
	private retrieveODataActionsSideEffects(action: Action): Record<string, ActionSideEffectsType> {
		const sideEffects: Record<string, ActionSideEffectsType> = {};
		const triggerActions = new Set<string>();
		let targetProperties: string[] = [];
		let targetEntities: SideEffectsEntityType[] = [];

		this.getSideEffectsFromSource(action).forEach((oDataSideEffect) => {
			const triggerAction = oDataSideEffect.triggerAction;
			targetProperties = targetProperties.concat(oDataSideEffect.targetProperties);
			targetEntities = targetEntities.concat(oDataSideEffect.targetEntities);
			if (triggerAction) {
				triggerActions.add(triggerAction);
			}
		});
		const sideEffectsTargets = this.removeDuplicateTargets({ targetProperties, targetEntities });
		const actionName = action.isBound ? action.fullyQualifiedName.match(/^[^(]+/)?.[0] : action.name;
		sideEffects[actionName!] = {
			pathExpressions: [...sideEffectsTargets.targetProperties, ...sideEffectsTargets.targetEntities],
			triggerActions: Array.from(triggerActions)
		};
		return sideEffects;
	}

	/**
	 * Gets SideEffects entity type that come from an OData Service
	 * Internal routine to get, from converted oData metaModel, SideEffects
	 * related to a specific entity type and to convert these SideEffects with
	 * expected format.
	 * @param entityType Entity type
	 * @returns Entity type SideEffects dictionary
	 */
	private retrieveODataEntitySideEffects(entityType: EntityType): Record<string, ODataSideEffectsType> {
		const entitySideEffects: Record<string, ODataSideEffectsType> = {};
		this.getSideEffectsFromSource(entityType).forEach((sideEffects) => {
			entitySideEffects[sideEffects.fullyQualifiedName] = sideEffects;
		});
		return entitySideEffects;
	}

	/**
	 * Defines a map for the Sources of sideEffect on the entity to track where those sources are used in SideEffects annotation.
	 * @param entityType The entityType we look for side Effects annotation
	 * @param sideEffectsSources The mapping object in construction
	 * @param sideEffectsSources.entities
	 * @param sideEffectsSources.properties
	 * @param sideEffectsSources.events
	 */
	private mapSideEffectSources(
		entityType: EntityType,
		sideEffectsSources: {
			entities: Record<string, SideEffectInfoForSource[]>;
			properties: Record<string, SideEffectInfoForSource[]>;
			events: Record<string, SideEffectInfoForSource[]>;
		}
	): void {
		for (const sideEffectDefinition of this.getSideEffectsAnnotationFromSource(entityType)) {
			this.mapSideEffectSourceEntities(entityType, sideEffectsSources, sideEffectDefinition);
			this.mapSideEffectSourceProperties(entityType, sideEffectsSources, sideEffectDefinition);
			this.mapSideEffectSourceEvents(entityType, sideEffectsSources, sideEffectDefinition);
		}
	}

	/**
	 * Fills the map for the Sources of sideEffect with source entities.
	 * @param entityType The entityType we look for side Effects annotation
	 * @param sideEffectsSources The mapping object in construction
	 * @param sideEffectsSources.entities
	 * @param sideEffectsSources.properties
	 * @param sideEffectsSources.events
	 * @param sideEffectDefinition The side effect definition to be evaluated
	 */
	private mapSideEffectSourceEntities(
		entityType: EntityType,
		sideEffectsSources: {
			entities: Record<string, SideEffectInfoForSource[]>;
			properties: Record<string, SideEffectInfoForSource[]>;
			events: Record<string, SideEffectInfoForSource[]>;
		},
		sideEffectDefinition: CommonSideEffectTypeWithQualifier
	): void {
		for (const sourceEntity of sideEffectDefinition.SourceEntities ?? []) {
			const targetEntityType = sourceEntity.value ? sourceEntity.$target?.targetType : entityType;
			if (targetEntityType) {
				if (!sideEffectsSources.entities[targetEntityType.fullyQualifiedName]) {
					sideEffectsSources.entities[targetEntityType.fullyQualifiedName] = [];
				}
				sideEffectsSources.entities[targetEntityType.fullyQualifiedName].push({
					entity: entityType.fullyQualifiedName,
					qualifier: sideEffectDefinition.qualifier
				});
			}
		}
	}

	/**
	 * Fills the map for the Sources of sideEffect with source properties.
	 * @param entityType The entityType we look for side Effects annotation
	 * @param sideEffectsSources The mapping object in construction
	 * @param sideEffectsSources.entities
	 * @param sideEffectsSources.properties
	 * @param sideEffectsSources.events
	 * @param sideEffectDefinition The side effect definition to be evaluated
	 */
	private mapSideEffectSourceProperties(
		entityType: EntityType,
		sideEffectsSources: {
			entities: Record<string, SideEffectInfoForSource[]>;
			properties: Record<string, SideEffectInfoForSource[]>;
			events: Record<string, SideEffectInfoForSource[]>;
		},
		sideEffectDefinition: CommonSideEffectTypeWithQualifier
	): void {
		const hasUniqueSourceProperty = sideEffectDefinition.SourceProperties?.length === 1;
		for (const sourceProperty of sideEffectDefinition.SourceProperties ?? []) {
			if (sourceProperty.$target) {
				if (!sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName]) {
					sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName] = [];
				}
				sideEffectsSources.properties[sourceProperty.$target.fullyQualifiedName].push({
					entity: entityType.fullyQualifiedName,
					qualifier: sideEffectDefinition.qualifier,
					hasUniqueSourceProperty
				});
			}
		}
	}

	/**
	 * Fills the map for the Sources of sideEffect with source events.
	 * @param entityType The entityType we look for side Effects annotation
	 * @param sideEffectsSources The mapping object in construction
	 * @param sideEffectsSources.entities
	 * @param sideEffectsSources.properties
	 * @param sideEffectsSources.events
	 * @param sideEffectDefinition The side effect definition to be evaluated
	 */
	private mapSideEffectSourceEvents(
		entityType: EntityType,
		sideEffectsSources: {
			entities: Record<string, SideEffectInfoForSource[]>;
			properties: Record<string, SideEffectInfoForSource[]>;
			events: Record<string, SideEffectInfoForSource[]>;
		},
		sideEffectDefinition: CommonSideEffectTypeWithQualifier
	): void {
		for (const sourceEvent of sideEffectDefinition.SourceEvents ?? []) {
			if (!sideEffectsSources.events[sourceEvent.toString()]) {
				sideEffectsSources.events[sourceEvent.toString()] = [];
			}
			sideEffectsSources.events[sourceEvent.toString()].push({
				entity: entityType.fullyQualifiedName,
				qualifier: sideEffectDefinition.qualifier
			});
		}
	}

	/**
	 * Get the fieldGroupId based on the stored information on th side effect.
	 * @param sideEffectInfo
	 * @param isImmediate
	 * @returns A string for the fieldGroupId.
	 */
	private getFieldGroupIdForSideEffect(sideEffectInfo: SideEffectInfoForSource, isImmediate = false): string {
		const sideEffectWithQualifier = sideEffectInfo.qualifier
			? `${sideEffectInfo.entity}#${sideEffectInfo.qualifier}`
			: sideEffectInfo.entity;
		return isImmediate || sideEffectInfo.hasUniqueSourceProperty === true
			? `${sideEffectWithQualifier}$$ImmediateRequest`
			: sideEffectWithQualifier;
	}

	getInterface(): SideEffectsService {
		return this;
	}
}

class SideEffectsServiceFactory extends ServiceFactory<SideEffectsSettings> {
	async createInstance(oServiceContext: ServiceContext<SideEffectsSettings>): Promise<SideEffectsService> {
		const SideEffectsServiceService = new SideEffectsService(oServiceContext);
		return SideEffectsServiceService.initialize();
	}
}

export default SideEffectsServiceFactory;

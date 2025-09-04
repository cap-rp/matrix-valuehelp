import type { Action as EdmAction } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import draftDataLossPopup from "sap/fe/core/controllerextensions/editFlow/draftDataLossPopup";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { SideEffectsService } from "sap/fe/core/services/SideEffectsServiceFactory";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import Text from "sap/m/Text";
import Library from "sap/ui/core/Lib";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import type { ContextErrorType } from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type { FEView } from "../../BaseController";
import ModelHelper from "../../helpers/ModelHelper";
import type MessageHandler from "../MessageHandler";
import Operation from "./operations/Operation";

export type SiblingInformation = {
	targetContext: Context;
	pathMapping: { oldPath: string; newPath: string }[];
};

export type RootContextInfo = {
	rootSiblingPathPromise: Promise<Context | undefined>;
};

export type BindContextParameters = {
	/**
	 * The value for the "5.1.2 System Query Option $expand" or an object which determines that value. The object
	 * is a map from expand path to expand options, where the options are again maps of system query options,
	 * typically with string values. $count can also be given as a `boolean` value, $expand can recursively
	 * be given as a map, $levels can also be given as a `number` value, and $select can also be given as an
	 * array (but without navigation paths). An empty map can also be given as `null` or `true`. See also {@link https://ui5.sap.com/#/topic/1ab4f62de6ab467096a2a98b363a1373 Parameters}.
	 */
	$expand?: string | object;
	/**
	 * A comma separated list or an array of items which determine the value for the "5.1.3 System Query Option
	 * $select". Since 1.75.0, when using the "autoExpandSelect" model parameter (see {@link sap.ui.model.odata.v4.ODataModel#constructor}),
	 * paths with navigation properties can be included and will contribute to the "5.1.2 System Query Option
	 * $expand".
	 */
	$select?: string;
	/**
	 * Whether a binding relative to an {@link sap.ui.model.odata.v4.Context} uses the canonical path computed
	 * from its context's path for data service requests; only the value `true` is allowed.
	 */
	$$canonicalPath?: boolean;
	/**
	 * The group ID to be used for **read** requests triggered by this binding; if not specified, either the
	 * parent binding's group ID (if the binding is relative) or the model's group ID is used, see {@link sap.ui.model.odata.v4.ODataModel#constructor}.
	 * Valid values are `undefined`, '$auto', '$auto.*', '$direct' or application group IDs as specified in
	 * {@link sap.ui.model.odata.v4.ODataModel}.
	 */
	$$groupId?: string;
	/**
	 * For operation bindings only: Whether $expand and $select from the parent binding are used in the request
	 * sent on {@link #execute}. If set to `true`, the binding must not set the $expand itself, the operation
	 * must be bound, and the return value and the binding parameter must belong to the same entity set.
	 */
	$$inheritExpandSelect?: boolean;
	/**
	 * Whether the binding always uses an own service request to read its data; only the value `true` is allowed.
	 */
	$$ownRequest?: boolean;
	/**
	 * Whether implicit loading of side effects via PATCH requests is switched off; only the value `true` is
	 * allowed. This sets the preference "return=minimal" and requires the service to return an ETag header
	 * for "204 No Content" responses. If not specified, the value of the parent binding is used.
	 */
	$$patchWithoutSideEffects?: boolean;
	/**
	 * The group ID to be used for **update** requests triggered by this binding; if not specified, either the
	 * parent binding's update group ID (if the binding is relative) or the model's update group ID is used,
	 * see {@link sap.ui.model.odata.v4.ODataModel#constructor}. For valid values, see parameter "$$groupId".
	 */
	$$updateGroupId?: string;
};

/* Constants for draft operations */
const draftOperations = {
	EDIT: "EditAction",
	ACTIVATION: "ActivationAction",
	DISCARD: "DiscardAction",
	PREPARE: "PreparationAction"
};

/**
 * Static functions for the draft programming model
 * @namespace
 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
 * @since 1.54.0
 */

/**
 * Determines the action name for a draft operation.
 * @param oContext The context that should be bound to the operation
 * @param sOperation The operation name
 * @returns The name of the draft operation
 */
function getActionName(oContext: Context, sOperation: string): string {
	const oModel = oContext.getModel(),
		oMetaModel = oModel.getMetaModel(),
		sEntitySetPath = oMetaModel.getMetaPath(oContext.getPath());

	return oMetaModel.getObject(`${sEntitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot/${sOperation}`);
}
/**
 * Creates an operation context binding for the given context and operation.
 * @param oContext The context that should be bound to the operation
 * @param sOperation The operation (action or function import)
 * @param oOptions Options to create the operation context
 * @returns The context binding of the bound operation
 */
function createOperation(oContext: Context, sOperation: string, oOptions?: BindContextParameters): ODataContextBinding {
	const sOperationName = getActionName(oContext, sOperation);

	return oContext.getModel().bindContext(`${sOperationName}(...)`, oContext, oOptions);
}

/**
 * Gets the converted action for a given context and operation.
 * @param context  The context that should be bound to the operation
 * @param operation The operation name
 * @returns The converted action
 */
function getConvertedAction(context: Context, operation: string): EdmAction | undefined {
	const operationName = getActionName(context, operation);
	const metaModel = context.getModel().getMetaModel(),
		actionPath = `${metaModel.getMetaPath(context.getPath())}/${operationName}`,
		boundAction = metaModel.createBindingContext(actionPath)!;
	return convertTypes(metaModel).resolvePath<EdmAction | undefined>(boundAction.getPath()).target;
}

/**
 * Determines the return type for a draft operation.
 * @param oContext The context that should be bound to the operation
 * @param sOperation The operation name
 * @returns The return type of the draft operation
 */
function getReturnType(oContext: Context, sOperation: string): unknown {
	const oModel = oContext.getModel(),
		oMetaModel = oModel.getMetaModel(),
		sEntitySetPath = oMetaModel.getMetaPath(oContext.getPath());

	return oMetaModel.getObject(`${sEntitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot/${sOperation}/$ReturnType`);
}
/**
 * Check if optional draft prepare action exists.
 * @param oContext The context that should be bound to the operation
 * @returns True if a a prepare action exists
 */
function hasPrepareAction(oContext: Context): boolean {
	return !!getActionName(oContext, draftOperations.PREPARE);
}
/**
 * Creates a new draft from an active document.
 * @param oContext Context for which the action should be performed
 * @param bPreserveChanges If true - existing changes from another user that are not locked are preserved and an error is sent from the backend, otherwise false - existing changes from another user that are not locked are overwritten</li>
 * @param oView If true - existing changes from another
 * @param groupId The batch groupId for post call of edit action
 * @param messageHandler  The message handler controller extension
 * @param overwriteChange
 * @returns Resolve function returns the context of the operation
 */
async function executeDraftEditAction(
	oContext: Context,
	bPreserveChanges: boolean,
	oView: View,
	groupId: string,
	messageHandler: MessageHandler,
	overwriteChange?: boolean
): Promise<Context | undefined> {
	// If the context is not loaded (i.e. oContext.getObject() == undefined), we assume it corresponds to an active context
	// This situation happens when opening an OP directly in edit mode (InternalRouting._bindPageForEdit)
	const convertedAction = getConvertedAction(oContext, draftOperations.EDIT);
	if (convertedAction) {
		const operation = new Operation(CommonUtils.getAppComponent(oView), oContext.getModel(), convertedAction, {
			messageHandler: messageHandler,
			contexts: [oContext],
			label: getResourceModel(oView).getText("C_COMMON_OBJECT_PAGE_EDIT"),
			bindingParameters: { $$inheritExpandSelect: true, $$updateGroupId: "$auto" },
			skipMessages: true,
			oDataProperties: {
				disableSideEffects: true,
				ignoreETag: oContext.getObject() === undefined, // If the context has not been loaded yet, we can ignore the ETag (as no previous ETag is available)
				groupId: groupId,
				replaceWithRVC: oContext.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding"),
				deferredSubmit: overwriteChange !== true //	If the context is coming from a list binding we pass the flag true to replace the context by the active one
			}
		});
		operation.setDefaultParametersValues({ PreserveChanges: bPreserveChanges });
		const result = await operation.execute();
		if (result[0].status === "rejected") {
			const modifiedError = new Error(result[0].reason) as Error & { status?: number };
			// we need to persist the status in the error to be able to show the locked by another user dialog
			modifiedError.status = result[0].reason.status;
			throw modifiedError;
		} else {
			return result[0].value.returnedContext;
		}
	} else {
		throw new Error("The edit action not found");
	}
}

/**
 * Executes the validation of the draft. The PrepareAction is triggered if the messages are annotated and entitySet gets a PreparationAction annotated.
 * If the operation succeeds and operation doesn't get a return type (RAP system) the messages are requested.
 * @param context Context for which the PrepareAction should be performed
 * @param appComponent The AppComponent
 * @param ignoreETag If set to true, ETags are ignored when executing the action
 * @returns Resolve function returns
 *  - the context of the operation if the action has been successfully executed
 *  - void if the action has failed
 *  - undefined if the action has not been triggered since the prerequisites are not met
 */
async function executeDraftValidation(
	context: Context,
	appComponent: AppComponent,
	ignoreETag: boolean
): Promise<ODataContextBinding | void | undefined> {
	if (ModelHelper.getMessagesPath(context.getModel().getMetaModel(), context.getPath()) && draft.hasPrepareAction(context)) {
		try {
			if (!ignoreETag && !context.isKeepAlive()) {
				// We need to wait for the entity related to the context to post the action with the If-Match header
				// Some triggers (enter on table) can generate a promise in the cache so if we don't wait for the entity
				// the POST will be sent without If-Match and will generate an error on backend side.
				await (context.getBinding() as ODataContextBinding).requestObject("");
			}
			const operation = draft.executeDraftPreparationAction(context, context.getUpdateGroupId(), true, ignoreETag);
			if (!getReturnType(context, draftOperations.PREPARE)) {
				requestMessages(context, appComponent.getSideEffectsService());
			}

			return await operation;
		} catch (error: unknown) {
			Log.error("Error while requesting messages", error as string);
		}
	}

	return undefined;
}

/**
 * Activates a draft document. The draft will replace the sibling entity and will be deleted by the back end.
 * @param oContext Context for which the action should be performed
 * @param oAppComponent The AppComponent
 * @param messageHandler
 * @param [sGroupId] The optional batch group in which the operation is to be executed
 * @param [oPreparePromise] The promise of the prepare action
 * @returns Resolve function returns the context of the operation
 */
async function executeDraftActivationAction(
	oContext: Context,
	oAppComponent: AppComponent,
	messageHandler: MessageHandler,
	sGroupId?: string,
	oPreparePromise?: Promise<void | ODataContextBinding>
): Promise<Context> {
	const bHasPrepareAction = hasPrepareAction(oContext);
	// According to the draft spec if the service contains a prepare action and we trigger both prepare and
	// activate in one $batch the activate action is called with iF-Match=*
	const bIgnoreEtag = bHasPrepareAction;
	let operation: Operation | undefined;
	if (!oContext.getProperty("IsActiveEntity")) {
		const convertedAction = getConvertedAction(oContext, draftOperations.ACTIVATION);
		if (convertedAction) {
			try {
				operation = new Operation(oAppComponent, oContext.getModel(), convertedAction, {
					messageHandler: messageHandler,
					contexts: [oContext],
					label: getResourceModel(oAppComponent).getText("C_OP_OBJECT_PAGE_SAVE"),
					bindingParameters: { $$inheritExpandSelect: true },
					skipMessages: true,
					oDataProperties: {
						disableSideEffects: true,
						groupId: sGroupId,
						ignoreETag: bIgnoreEtag,
						replaceWithRVC: oContext.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding")
					}
				});
				const result = await operation.execute();
				if (result[0].status === "rejected") {
					throw new Error(result[0].reason);
				} else if (result[0].value.returnedContext === undefined) {
					throw new Error("No context returned by the action");
				}
				return result[0].value.returnedContext;
			} catch (e) {
				if (bHasPrepareAction) {
					// destroy the operation bindings to avoid additional message requests sent by the model
					const prepareOperation = await oPreparePromise;
					prepareOperation?.destroy();
					operation?.clear();

					const actionName = getActionName(oContext, draftOperations.PREPARE),
						oSideEffectsService = oAppComponent.getSideEffectsService(),
						oBindingParameters = oSideEffectsService.getODataActionSideEffects(actionName, oContext),
						aTargetPaths = oBindingParameters && oBindingParameters.pathExpressions;
					if (aTargetPaths && aTargetPaths.length > 0) {
						try {
							await oSideEffectsService.requestSideEffects(aTargetPaths, oContext);
						} catch (oError: unknown) {
							Log.error("Error while requesting side effects", oError as string);
						}
					} else {
						try {
							await requestMessages(oContext, oSideEffectsService, true);
						} catch (oError: unknown) {
							Log.error("Error while requesting messages", oError as string);
						}
					}
				}
				throw e;
			}
		} else {
			throw new Error("The activation action not found");
		}
	} else {
		throw new Error("The activation action cannot be executed on an active document");
	}
}

/**
 * Gets the supported message property path on the PrepareAction for a context.
 * @param context Context to be checked
 * @returns Path to the message
 */
function getMessagePathForPrepare(context: Context): string | undefined {
	// If there is no return parameter, it is not possible to request Messages.
	// RAP draft prepare has no return parameter
	return getReturnType(context, draftOperations.PREPARE) ? getMessagePathForContext(context) : undefined;
}

/**
 * Gets the supported message property path for a context.
 * @param context Context to be checked
 * @returns Path to the message
 */
function getMessagePathForContext(context: Context): string | undefined {
	const metaContext = context.getModel().getMetaModel().getMetaContext(context.getPath());
	const convertedContext = getInvolvedDataModelObjects(metaContext);
	const messages = convertedContext.targetEntityType.annotations.Common?.Messages;
	return isPathAnnotationExpression(messages) ? messages.path : undefined;
}

/**
 * Execute a preparation action.
 * @param oContext Context for which the action should be performed
 * @param groupId The optional batch group in which we want to execute the operation
 * @param bMessages If set to true, the PREPARE action retrieves SAP_Messages
 * @param ignoreETag If set to true, ETag information is ignored when the action is executed
 * @returns Resolve function returns the context of the operation
 */
async function executeDraftPreparationAction(
	oContext: Context,
	groupId?: string,
	bMessages?: boolean,
	ignoreETag?: boolean
): Promise<void | ODataContextBinding> {
	if (!oContext.getProperty("IsActiveEntity")) {
		const sMessagesPath = bMessages ? getMessagePathForPrepare(oContext) : undefined;
		const oOperation = createOperation(oContext, draftOperations.PREPARE, sMessagesPath ? { $select: sMessagesPath } : undefined);

		// TODO: side effects qualifier shall be even deprecated to be checked
		oOperation.setParameter("SideEffectsQualifier", "");

		const sGroupId = groupId || oOperation.getGroupId();
		return oOperation
			.invoke(sGroupId, ignoreETag)
			.then(function () {
				return oOperation;
			})
			.catch(function (oError: unknown) {
				Log.error("Error while executing the operation", oError as string);
				return oOperation;
			});
	} else {
		throw new Error("The preparation action cannot be executed on an active document");
	}
}

/**
 * Requests the messages if annotated for a given context.
 * @param oContext Context for which the messages shall be requested
 * @param oSideEffectsService Service for the SideEffects on SAP Fiori elements
 * @param removeTransitionMessages If set to true, transition messages are removed if state messages exist
 * @returns Promise which is resolved once messages were requested
 */
async function requestMessages(
	oContext: Context,
	oSideEffectsService: SideEffectsService,
	removeTransitionMessages = false
): Promise<void> {
	const sMessagesPath = ModelHelper.getMessagesPath(oContext.getModel().getMetaModel(), oContext.getPath());
	if (sMessagesPath) {
		await oSideEffectsService.requestSideEffects([sMessagesPath], oContext);
		if (removeTransitionMessages) {
			const data = await oContext.requestObject();
			if (data[sMessagesPath].length > 0) {
				//if state messages are available from the PREPARATION action, then previous transition messages are removed
				messageHandling.removeUnboundTransitionMessages();
				messageHandling.removeBoundTransitionMessages();
			}
		}
	}
	return;
}
/**
 * Executes discard of a draft function using HTTP Post.
 * @param oContext Context for which the action should be performed
 * @param messageHandler The message handler controller extension
 * @param oAppComponent App Component
 * @param bEnableStrictHandling
 * @returns Resolve function returns the context of the operation
 */
async function executeDraftDiscardAction(
	oContext: Context,
	messageHandler: MessageHandler,
	oAppComponent: AppComponent,
	bEnableStrictHandling?: boolean
): Promise<void> {
	if (!oContext.getProperty("IsActiveEntity")) {
		const convertedAction = getConvertedAction(oContext, draftOperations.DISCARD);
		if (convertedAction) {
			const result = await new Operation(oAppComponent, oContext.getModel(), convertedAction, {
				messageHandler: messageHandler,
				label: getResourceModel(oAppComponent)?.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_BUTTON") || "",
				contexts: [oContext],
				skipMessages: true,
				oDataProperties: {
					disableSideEffects: true,
					disableStrictHandling: !bEnableStrictHandling,
					ignoreETag: oContext.getObject() === undefined, // If the context has not been loaded yet, we can ignore the ETag (as no previous ETag is available)
					groupId: "direct",
					replaceWithRVC: undefined,
					deferredSubmit: false
				}
			}).execute();
			if (result[0].status === "rejected") {
				throw new Error(result[0].reason);
			}
		} else {
			throw new Error("The discard action not found");
		}
	} else {
		throw new Error("The discard action cannot be executed on an active document");
	}
}

/**
 * This method creates a sibling context for a subobject page and calculates a sibling path for all intermediate paths
 * between the object page and the subobject page.
 * @param rootCurrentContext The context for the root of the draft
 * @param rightmostCurrentContext The context of the subobject page
 * @param rootContextInfo The context info of root of the draft
 * @param groupId
 * @returns The siblingInformation object
 */
async function computeSiblingInformation(
	rootCurrentContext: Context,
	rightmostCurrentContext: Context,
	rootContextInfo?: RootContextInfo,
	groupId?: string
): Promise<SiblingInformation | undefined> {
	if (!rightmostCurrentContext.getPath().startsWith(rootCurrentContext.getPath())) {
		// Wrong usage !!
		Log.error("Cannot compute rightmost sibling context");
		throw new Error("Cannot compute rightmost sibling context");
	}

	if (
		rightmostCurrentContext.getProperty("IsActiveEntity") === false &&
		rightmostCurrentContext.getProperty("HasActiveEntity") === false
	) {
		// We already know the sibling for rightmostCurrentContext doesn't exist
		// --> No need to check canonical paths etc...
		return undefined;
	}

	const model = rootCurrentContext.getModel();
	try {
		// //////////////////////////////////////////////////////////////////
		// 1. Find all segments between the root object and the sub-object
		// Example: for root = /Param(aa)/Entity(bb) and rightMost = /Param(aa)/Entity(bb)/_Nav(cc)/_SubNav(dd)
		// ---> ["Param(aa)/Entity(bb)", "_Nav(cc)", "_SubNav(dd)"]

		// Find all segments in the rightmost path
		const additionalPath = rightmostCurrentContext.getPath().replace(rootCurrentContext.getPath(), "");
		const segments = additionalPath ? additionalPath.substring(1).split("/") : [];
		// First segment is always the full path of the root object, which can contain '/' in case of a parametrized entity
		segments.unshift(rootCurrentContext.getPath().substring(1));

		// //////////////////////////////////////////////////////////////////
		// 2. Request canonical paths of the sibling entity for each segment
		// Example: for ["Param(aa)/Entity(bb)", "_Nav(cc)", "_SubNav(dd)"]
		// --> request canonical paths for "Param(aa)/Entity(bb)/SiblingEntity", "Param(aa)/Entity(bb)/_Nav(cc)/SiblingEntity", "Param(aa)/Entity(bb)/_Nav(cc)/_SubNav(dd)/SiblingEntity"
		const oldPaths: string[] = [];
		const newPaths: string[] = [];
		let currentPath = "";

		// Computing sibling entity of root of the draft context is not required if the context is already in the sub-OP
		// Example: Edit in Sub-OP where new context is already available
		const paths = [...segments];
		if (rootContextInfo?.rootSiblingPathPromise) {
			paths.shift();
			currentPath = "/" + rootCurrentContext?.getPath()?.substring(1);
		}
		const canonicalPathPromises = paths.map(async (segment) => {
			currentPath += `/${segment}`;
			oldPaths.unshift(currentPath);
			if (currentPath.endsWith(")")) {
				const siblingContext = model
					.bindContext(`${currentPath}/SiblingEntity`, undefined, groupId ? { $$groupId: groupId } : undefined)
					.getBoundContext();
				return siblingContext.requestCanonicalPath();
			} else {
				return Promise.resolve(undefined); // 1-1 relation
			}
		});

		// //////////////////////////////////////////////////////////////////
		// 3. Reconstruct the full paths from canonical paths (for path mapping)
		// Example: for canonical paths "/Param(aa)/Entity(bb-sibling)", "/Entity2(cc-sibling)", "/Entity3(dd-sibling)"
		// --> ["Param(aa)/Entity(bb-sibling)", "Param(aa)/Entity(bb-sibling)/_Nav(cc-sibling)", "Param(aa)/Entity(bb-sibling)/_Nav(cc-sibling)/_SubNav(dd-sibling)"]
		const canonicalPaths = (await Promise.all(canonicalPathPromises)) as string[];

		// Workaround (temporary ?): when the sibling doesn't exist, requestCanonicalPath returns the same path
		if (
			canonicalPaths.some((path) => {
				return path && path.endsWith("/SiblingEntity");
			})
		) {
			// At least one sibling entity doesn't exist
			return undefined;
		}

		if (rootContextInfo?.rootSiblingPathPromise) {
			const rootSiblingPath = (await rootContextInfo.rootSiblingPathPromise)?.getPath() as string;
			canonicalPaths.unshift(rootSiblingPath);
			oldPaths.push(rootCurrentContext.getPath());
		}
		let siblingPath = "";
		canonicalPaths.forEach((canonicalPath, index) => {
			if (index !== 0) {
				if (segments[index].endsWith(")")) {
					const navigation = segments[index].replace(/\(.*$/, ""); // Keep only navigation name from the segment, i.e. aaa(xxx) --> aaa
					const keys = canonicalPath.replace(/.*\(/, "("); // Keep only the keys from the canonical path, i.e. aaa(xxx) --> (xxx)
					siblingPath += `/${navigation}${keys}`;
				} else {
					siblingPath += `/${segments[index]}`; // 1-1 relation
				}
			} else {
				siblingPath = canonicalPath; // To manage parametrized entities
			}
			newPaths.unshift(siblingPath);
		});

		return {
			targetContext: model
				.bindContext(siblingPath, undefined, {
					$select: getMessagePathForContext(rightmostCurrentContext),
					$$groupId: "$auto.Heroes"
				})
				.getBoundContext(), // Create the rightmost sibling context from its path
			pathMapping: oldPaths.map((oldPath, index) => {
				return {
					oldPath,
					newPath: newPaths[index]
				};
			})
		};
	} catch (error) {
		// A canonical path couldn't be resolved (because a sibling doesn't exist)
		return undefined;
	}
}

/**
 * Creates a draft document from an existing document.
 *
 * The function supports several hooks as there is a certain coreography defined.
 * @param oContext Context of the active document for the new draft
 * @param oAppComponent The AppComponent
 * @param mParameters The parameters
 * @param [mParameters.oView] The view
 * @param [mParameters.bPreserveChanges] Preserve changes of an existing draft of another user
 * @param groupId The batch groupId for post call of edit action
 * @param messageHandler The message handler controller extension
 * @returns Promise resolves with the {@link sap.ui.model.odata.v4.Context context} of the new draft document
 */
async function createDraftFromActiveDocument(
	oContext: Context,
	oAppComponent: AppComponent,
	mParameters: {
		oView: FEView;
		bPreserveChanges?: boolean | undefined;
	},
	groupId: string,
	messageHandler: MessageHandler
): Promise<Context | undefined> {
	const mParam = mParameters || {},
		bRunPreserveChangesFlow =
			typeof mParam.bPreserveChanges === "undefined" || (typeof mParam.bPreserveChanges === "boolean" && mParam.bPreserveChanges); //default true

	/**
	 * Overwrite the existing change.
	 * @param response Context of the active document for the new draft or the error retrieved
	 * @returns Resolves with result of {@link sap.fe.core.actions#executeDraftEditAction}
	 */
	async function overwriteChange(response: Context | ContextErrorType): Promise<Context | ContextErrorType | undefined> {
		//Overwrite existing changes
		const oModel = oContext.getModel();
		const draftDataContext = oModel.bindContext(`${oContext.getPath()}/DraftAdministrativeData`).getBoundContext();
		const resourceModel = getResourceModel(mParameters.oView);
		const draftAdminData = await draftDataContext.requestObject();
		if (draftAdminData) {
			// remove all unbound transition messages as we show a special dialog
			messageHandling.removeUnboundTransitionMessages();
			let sInfo = draftAdminData.InProcessByUserDescription || draftAdminData.InProcessByUser;
			const sEntitySet = mParameters.oView.getViewData().entitySet;
			if (sInfo) {
				const sLockedByUserMsg = resourceModel.getText("C_DRAFT_OBJECT_PAGE_DRAFT_LOCKED_BY_USER", sInfo, sEntitySet);
				MessageBox.error(sLockedByUserMsg);
				throw new Error(sLockedByUserMsg);
			} else {
				sInfo = draftAdminData.CreatedByUserDescription || draftAdminData.CreatedByUser;
				const sUnsavedChangesMsg = resourceModel.getText("C_DRAFT_OBJECT_PAGE_DRAFT_UNSAVED_CHANGES", sInfo, sEntitySet);
				await draft.showEditConfirmationMessageBox(sUnsavedChangesMsg, oContext);
				return draft.executeDraftEditAction(oContext, false, mParameters.oView, groupId, messageHandler, true); // true because we overwrite changes
			}
		} else if ((response as ContextErrorType)?.message) {
			MessageBox.error((response as ContextErrorType).message);
		}
		throw new Error(`Draft creation aborted for document: ${oContext.getPath()}`);
	}

	if (!oContext) {
		throw new Error("Binding context to active document is required");
	}
	let oDraftContext: Context | ContextErrorType | undefined;
	try {
		oDraftContext = await draft.executeDraftEditAction(oContext, bRunPreserveChangesFlow, mParameters.oView, groupId, messageHandler);
	} catch (oResponse) {
		if ((oResponse as ContextErrorType).status === 409 || (oResponse as ContextErrorType).status === 423) {
			messageHandling.removeBoundTransitionMessages();
			messageHandling.removeUnboundTransitionMessages();
			const siblingInfo = await draft.computeSiblingInformation(oContext, oContext);
			if (siblingInfo?.targetContext) {
				//there is a context authorized to be edited by the current user
				await CommonUtils.waitForContextRequested(siblingInfo.targetContext);
				return siblingInfo.targetContext;
			} else {
				//there is no draft owned by the current user
				oDraftContext = await overwriteChange(oResponse as ContextErrorType);
			}
		} else if (!(oResponse && (oResponse as ContextErrorType).canceled)) {
			throw new Error(oResponse as string);
		}
	}

	if (oDraftContext) {
		const sEditActionName = draft.getActionName(oDraftContext as Context, draftOperations.EDIT);
		const oSideEffects = oAppComponent.getSideEffectsService().getODataActionSideEffects(sEditActionName, oDraftContext as Context);
		if (oSideEffects?.triggerActions?.length) {
			await oAppComponent.getSideEffectsService().requestSideEffectsForODataAction(oSideEffects, oDraftContext as Context);
			return oDraftContext as Context;
		} else {
			return oDraftContext as Context;
		}
	} else {
		return undefined;
	}
}
/**
 * Creates an active document from a draft document.
 *
 * The function supports several hooks as there is a certain choreography defined.
 * @param oContext Context of the active document for the new draft
 * @param oAppComponent The AppComponent
 * @param mParameters The parameters
 * @param [mParameters.fnBeforeActivateDocument] Callback that allows a veto before the 'Create' request is executed
 * @param [mParameters.fnAfterActivateDocument] Callback for postprocessing after document was activated.
 * @param messageHandler The message handler controller extension
 * @returns Promise resolves with the {@link sap.ui.model.odata.v4.Context context} of the new draft document
 */
async function activateDocument(
	oContext: Context,
	oAppComponent: AppComponent,
	mParameters: { fnBeforeActivateDocument?: Function; fnAfterActivateDocument?: Function },
	messageHandler: MessageHandler
): Promise<Context> {
	const mParam = mParameters || {};
	if (!oContext) {
		throw new Error("Binding context to draft document is required");
	}

	const bExecute = mParam.fnBeforeActivateDocument ? await mParam.fnBeforeActivateDocument(oContext) : true;
	if (!bExecute) {
		throw new Error(`Activation of the document was aborted by extension for document: ${oContext.getPath()}`);
	}

	let oActiveDocumentContext: Context;
	if (!hasPrepareAction(oContext)) {
		oActiveDocumentContext = await executeDraftActivationAction(oContext, oAppComponent, messageHandler);
	} else {
		/* activation requires preparation */
		const sBatchGroup = "$auto";
		//when there are pending changes there will be a patch request merged together with the draftPrepare and draftAcivate.
		//The patch changes the Etag, therfore the prepare needs to ignore Etags
		const ignoreEtag: boolean = oContext.getModel().hasPendingChanges("$auto") ? true : false;
		// we use the same batchGroup to force prepare and activate in a same batch but with different changeset
		const oPreparePromise = draft.executeDraftPreparationAction(oContext, sBatchGroup, undefined, ignoreEtag);
		oContext.getModel().submitBatch(sBatchGroup);
		const oActivatePromise = draft.executeDraftActivationAction(oContext, oAppComponent, messageHandler, sBatchGroup, oPreparePromise);

		const values = await Promise.all([oPreparePromise, oActivatePromise]);
		oActiveDocumentContext = values[1];
	}
	return mParam.fnAfterActivateDocument ? mParam.fnAfterActivateDocument(oContext, oActiveDocumentContext) : oActiveDocumentContext;
}

/**
 * Display the confirmation dialog box after pressing the edit button of an object page with unsaved changes.
 * @param sUnsavedChangesMsg Dialog box message informing the user that if he starts editing, the previous unsaved changes will be lost
 * @param oContext Context of the active document for the new draft
 * @returns Promise resolves
 */
async function showEditConfirmationMessageBox(sUnsavedChangesMsg: string, oContext: Context): Promise<boolean> {
	const localI18nRef = Library.getResourceBundleFor("sap.fe.core")!;
	return new Promise(function (resolve: (value: boolean) => void, reject: (reason?: unknown) => void) {
		const oDialog = new Dialog({
			title: localI18nRef.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_WARNING"),
			state: "Warning",
			content: new Text({
				text: sUnsavedChangesMsg
			}),
			beginButton: new Button({
				text: localI18nRef.getText("C_COMMON_OBJECT_PAGE_EDIT"),
				type: "Emphasized",
				press: function (): void {
					oDialog.close();
					resolve(true);
				}
			}),
			endButton: new Button({
				text: localI18nRef.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
				press: function (): void {
					oDialog.close();
					reject(`Draft creation aborted for document: ${oContext.getPath()}`);
				}
			}),
			afterClose: function (): void {
				oDialog.destroy();
			}
		});
		oDialog.addStyleClass("sapUiContentPadding");
		oDialog.open();
	});
}

/**
 * HTTP POST call when DraftAction is present for Draft Delete; HTTP DELETE call when there is no DraftAction
 * and Active Instance always uses DELETE.
 * @param oContext Context of the document to be discarded
 * @param messageHandler The message handler controller extension
 * @param oAppComponent Context of the document to be discarded
 * @param bEnableStrictHandling
 * @returns A Promise resolved when the context is deleted
 */
async function deleteDraft(
	oContext: Context,
	messageHandler: MessageHandler,
	oAppComponent: AppComponent,
	bEnableStrictHandling?: boolean
): Promise<void> {
	if (oContext.isTransient()) {
		// Transient contexts (e.g. when trying to delete a context which couldn't be created because of an error) can be deleted immediately
		return oContext.delete();
	}
	const sDiscardAction = getActionName(oContext, draftOperations.DISCARD);
	const bIsActiveEntity = oContext.getObject().IsActiveEntity;

	if (bIsActiveEntity || (!bIsActiveEntity && !sDiscardAction)) {
		//Use Delete in case of active entity and no discard action available for draft
		if (oContext.hasPendingChanges() && !oContext.isInactive()) {
			await oContext.getBinding().resetChanges();
			return oContext.delete();
		} else {
			// When cancelling an edit draft root node, use model.delete instead of context.delete, to only send deletion to backend,
			// but keep context alive (including bindings). Thus, we can ensure seamless transistion from draft to active instance
			// (without intermediate undefined bindings e.g. leading to flickering).
			// In other cases (deleting active, discarding create draft or discarding draft node), stay with context.delete.
			// When cancelling a create draft, page is closed, thus the problem of flickering cannot occur.
			// In case of discarding a draft node, theoretically the same problem could
			// occur, but needs quite specific modelling (button visibility on item level bound against service property in an FCL app)
			// and acting (looking at button on third column while discarding on 2nd column). Currently, model seems not to be prepared
			// for that case, thus due to the minimal impact (only intermediate visual state), accepting this for the time being.
			return !oContext.getProperty("IsActiveEntity") &&
				ModelHelper.isDraftRoot(
					getInvolvedDataModelObjects(oContext.getModel().getMetaModel().getMetaContext(oContext.getPath()))?.targetEntitySet
				) &&
				oContext.getProperty("HasActiveEntity")
				? oContext.getModel().delete(oContext)
				: oContext.delete();
		}
	} else {
		//Use Discard Post Action if it is a draft entity and discard action exists
		await executeDraftDiscardAction(oContext, messageHandler, oAppComponent, bEnableStrictHandling);
	}
}

const draft = {
	createDraftFromActiveDocument: createDraftFromActiveDocument,
	activateDocument: activateDocument,
	deleteDraft: deleteDraft,
	executeDraftEditAction: executeDraftEditAction,
	executeDraftValidation: executeDraftValidation,
	executeDraftPreparationAction: executeDraftPreparationAction,
	executeDraftActivationAction: executeDraftActivationAction,
	hasPrepareAction: hasPrepareAction,
	computeSiblingInformation: computeSiblingInformation,
	processDataLossOrDraftDiscardConfirmation: draftDataLossPopup.processDataLossOrDraftDiscardConfirmation,
	silentlyKeepDraftOnForwardNavigation: draftDataLossPopup.silentlyKeepDraftOnForwardNavigation,
	createOperation: createOperation,
	executeDraftDiscardAction: executeDraftDiscardAction,
	NavigationType: draftDataLossPopup.NavigationType,
	getActionName: getActionName,
	showEditConfirmationMessageBox: showEditConfirmationMessageBox
};

export default draft;

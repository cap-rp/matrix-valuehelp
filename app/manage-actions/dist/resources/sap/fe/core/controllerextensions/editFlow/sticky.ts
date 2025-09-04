import type { Action as EdmAction } from "@sap-ux/vocabularies-types";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import FELibrary from "sap/fe/core/library";
import MessageBox from "sap/m/MessageBox";
import Library from "sap/ui/core/Lib";
import type Context from "sap/ui/model/odata/v4/Context";
import { convertTypes } from "../../converters/MetaModelConverter";
import type MessageHandler from "../MessageHandler";
import Operation from "./operations/Operation";

const ProgrammingModel = FELibrary.ProgrammingModel;

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
 * Determines the action name for a draft operation.
 * @param context The context that should be bound to the operation
 * @param operation The operation name
 * @returns The name of the draft operation
 */
function getActionName(context: Context, operation: string): string {
	const model = context.getModel(),
		metaModel = model.getMetaModel(),
		sEntitySetPath = metaModel.getMetaPath(context.getPath());

	return metaModel.getObject(`${sEntitySetPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/${operation}`);
}

/**
 * Opens a sticky session to edit a document.
 * @param context Context of the document to be edited
 * @param appComponent The AppComponent
 * @param messageHandler The message handler controller extension
 * @returns A Promise resolved when the sticky session is in edit mode
 */
async function editDocumentInStickySession(
	context: Context,
	appComponent: AppComponent,
	messageHandler: MessageHandler
): Promise<Context | undefined> {
	const operation = "EditAction";
	const convertedAction = getConvertedAction(context, operation);
	if (convertedAction) {
		const result = await new Operation(appComponent, context.getModel(), convertedAction, {
			messageHandler: messageHandler,
			contexts: [context],
			label: getResourceModel(appComponent).getText("C_COMMON_OBJECT_PAGE_EDIT"),
			skipMessages: true,
			oDataProperties: {
				disableSideEffects: true,
				ignoreETag: context.getObject() === undefined, // If the context has not been loaded yet, we can ignore the ETag (as no previous ETag is available)
				groupId: "direct",
				replaceWithRVC: context.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding"),
				deferredSubmit: false
			},
			bindingParameters: { $$inheritExpandSelect: true }
		}).execute();
		if (result[0].status === "rejected") {
			throw new Error(result[0].reason);
		} else {
			const newContext = result[0].value.returnedContext;
			if (newContext) {
				const sideEffects = appComponent
					.getSideEffectsService()
					.getODataActionSideEffects(getActionName(context, operation), newContext);
				if (sideEffects?.triggerActions && sideEffects.triggerActions.length) {
					await appComponent.getSideEffectsService().requestSideEffectsForODataAction(sideEffects, newContext);
				}
			}
			return newContext;
		}
	} else {
		throw new Error(`Edit Action for Sticky Session not found for ${operation}`);
	}
}
/**
 * Activates a document and closes the sticky session.
 * @param context Context of the document to be activated
 * @param appComponent Context of the document to be activated
 * @param messageHandler The message handler controller extension
 * @returns A promise resolve when the sticky session is activated
 */
async function activateDocument(context: Context, appComponent: AppComponent, messageHandler: MessageHandler): Promise<Context> {
	const operation = "SaveAction";
	const model = context.getModel(),
		metaModel = model.getMetaModel(),
		metaPath = metaModel.getMetaPath(context.getPath());

	const convertedAction = getConvertedAction(context, operation);
	if (convertedAction) {
		const result = await new Operation(appComponent, context.getModel(), convertedAction, {
			messageHandler: messageHandler,
			contexts: [context],
			label: getResourceModel(appComponent).getText("C_OP_OBJECT_PAGE_SAVE"),
			skipMessages: true,
			oDataProperties: {
				disableSideEffects: true,
				ignoreETag: context.getObject() === undefined, // If the context has not been loaded yet, we can ignore the ETag (as no previous ETag is available)
				groupId: "direct",
				replaceWithRVC: context.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding"),
				deferredSubmit: false
			}
		}).execute();

		if (result[0].status === "rejected") {
			const messagesPath = metaModel.getObject(`${metaPath}/@${CommonAnnotationTerms.Messages}/$Path`) as string | undefined;

			if (messagesPath) {
				try {
					await appComponent.getSideEffectsService().requestSideEffects([messagesPath], context);
				} catch (error: unknown) {
					Log.error("Error while requesting side effects", error as string);
				}
			}
			throw new Error(result[0].reason);
		} else if (result[0].value.returnedContext === undefined) {
			throw new Error(`Save Action for Sticky Session doesn't return a context for ${metaPath}`);
		}
		return result[0].value.returnedContext;
	} else {
		throw new Error(`Save Action for Sticky Session not found for ${metaPath}`);
	}
}
/**
 * Discards a document and closes sticky session.
 * @param context Context of the document to be discarded
 * @returns A promise resolved when the document is dicarded
 */
async function discardDocument(context: Context): Promise<Context> {
	const model = context.getModel(),
		metaModel = model.getMetaModel(),
		metaPath = metaModel.getMetaPath(context.getPath()),
		discardActionAnnotation = metaModel.getObject(`${metaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/DiscardAction`);

	if (!discardActionAnnotation) {
		throw new Error(`Discard Action for Sticky Session not found for ${metaPath}`);
	}

	const discardAction = model.bindContext(`/${discardActionAnnotation}(...)`);
	return discardAction.execute("$single").then(function () {
		return context;
	});
}

/**
 * Process the Data loss confirmation.
 * @param fnProcess Function to execute after confirmation
 * @param view Current view
 * @param programmingModel Programming Model of the current page
 * @returns `void` i think
 */
function processDataLossConfirmation(fnProcess: Function, view: FEView, programmingModel: string): void {
	const uiEditable = CommonUtils.getIsEditable(view),
		resourceBundle = Library.getResourceBundleFor("sap.fe.templates")!,
		warningMsg = resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_MSG"),
		confirmButtonTxt = resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CONFIRM_BUTTON"),
		cancelButtonTxt = resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CANCEL_BUTTON");

	if (programmingModel === ProgrammingModel.Sticky && uiEditable) {
		return MessageBox.warning(warningMsg, {
			actions: [confirmButtonTxt, cancelButtonTxt],
			emphasizedAction: confirmButtonTxt,
			onClose: function (actionText: string) {
				if (actionText === confirmButtonTxt) {
					Log.info("Navigation confirmed.");
					fnProcess();
				} else {
					Log.info("Navigation rejected.");
				}
			}
		});
	}
	return fnProcess();
}

/**
 * Static functions for the sticky session programming model
 * @namespace
 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
 * @since 1.54.0
 */
const sticky = {
	editDocumentInStickySession: editDocumentInStickySession,
	activateDocument: activateDocument,
	discardDocument: discardDocument,
	processDataLossConfirmation: processDataLossConfirmation
};

export default sticky;

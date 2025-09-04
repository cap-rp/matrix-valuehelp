import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import type { SiblingInformation } from "sap/fe/core/controllerextensions/editFlow/draft";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import type { CheckBox$SelectEvent } from "sap/m/CheckBox";
import CheckBox from "sap/m/CheckBox";
import MessageToast from "sap/m/MessageToast";
import Text from "sap/m/Text";

import type ResourceModel from "sap/fe/core/ResourceModel";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Control from "sap/ui/core/Control";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import Messaging from "sap/ui/core/Messaging";
import type Table from "sap/ui/mdc/Table";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type { InternalModelContext } from "./ModelHelper";

enum DeleteOptionTypes {
	deletableContexts = "deletableContexts",
	draftsWithDeletableActive = "draftsWithDeletableActive",
	unSavedContexts = "unSavedContexts",
	draftsWithNonDeletableActive = "draftsWithNonDeletableActive",
	draftsToDeleteBeforeActive = "draftsToDeleteBeforeActive"
}

enum DeleteDialogContentControl {
	CHECKBOX = "checkBox",
	TEXT = "text"
}

export type DraftSiblingPair = {
	draft: ODataV4Context;
	siblingInfo: SiblingInformation;
};

export type DeleteOption = {
	type: DeleteOptionTypes;
	contexts: ODataV4Context[];
	selected: boolean;
	text?: string;
	control?: DeleteDialogContentControl;
};

export type ContextInfo = {
	context: ODataV4Context;
	siblingInfo: SiblingInformation | undefined;
	isDraftRoot: boolean;
	isDraftNode: boolean;
	isActive: boolean;
	hasActive: boolean;
	hasDraft: boolean;
	locked: boolean;
	deletable: boolean;
	siblingDeletable: boolean;
	isInactiveContext: boolean;
};

export type DraftAdministrativeDataType = {
	DraftUUID: string;
	InProcessByUser?: string;
	InProcessByUserDescription?: string;
	CreatedByUserDescription?: string;
	CreatedByUser?: string;
	LastChangedByUserDescription?: string;
	LastChangedByUser?: string;
};

export type DeleteParameters = {
	internalModelContext?: InternalModelContext | null;
	numberOfSelectedContexts?: number;
	entitySetName?: string;
	parentControl?: Control;
	description?: string | { path: string };
	beforeDeleteCallBack?: Function;
	unSavedContexts?: ODataV4Context[];
	draftsWithNonDeletableActive?: ODataV4Context[];
	lockedContexts?: ODataV4Context[];
	draftsWithDeletableActive?: DraftSiblingPair[];
	silentMode?: boolean;
};

export type DeleteTextInfo = {
	infoTxt?: string;
	optionTxt?: string;
	optionWithoutTxt?: boolean;
};

function getUpdatedSelections(
	internalModelContext: InternalModelContext,
	type: DeleteOptionTypes,
	selectedContexts: ODataV4Context[],
	contextsToRemove: ODataV4Context[]
): ODataV4Context[] {
	const retSelectedContexts: ODataV4Context[] = [...selectedContexts];
	contextsToRemove.forEach((context: ODataV4Context) => {
		const idx = retSelectedContexts.indexOf(context);
		if (idx !== -1) {
			retSelectedContexts.splice(idx, 1);
		}
	});
	internalModelContext.setProperty(type, []);

	return retSelectedContexts;
}

function clearSelectedContextsForOption(internalModelContext: InternalModelContext, option: DeleteOption): void {
	let selectedContexts = (internalModelContext.getProperty("selectedContexts") as ODataV4Context[]) || [];

	if (option.type === DeleteOptionTypes.deletableContexts) {
		selectedContexts = getUpdatedSelections(
			internalModelContext,
			DeleteOptionTypes.deletableContexts,
			selectedContexts,
			internalModelContext.getProperty(DeleteOptionTypes.deletableContexts) || []
		);

		const draftSiblingPairs = internalModelContext.getProperty(DeleteOptionTypes.draftsWithDeletableActive) || [];
		const drafts = draftSiblingPairs.map((contextPair: DraftSiblingPair) => {
			return contextPair.draft;
		});
		selectedContexts = getUpdatedSelections(
			internalModelContext,
			DeleteOptionTypes.draftsWithDeletableActive,
			selectedContexts,
			drafts
		);
	} else {
		const contextsToRemove = internalModelContext.getProperty(option.type) || [];
		selectedContexts = getUpdatedSelections(internalModelContext, option.type, selectedContexts, contextsToRemove);
	}
	internalModelContext.setProperty("selectedContexts", selectedContexts);
	internalModelContext.setProperty("numberOfSelectedContexts", selectedContexts.length);
}

function afterDeleteProcess(
	parameters: DeleteParameters,
	options: DeleteOption[],
	contexts: ODataV4Context[],
	resourceModel: ResourceModel,
	lastDeletedRowIndex: number
): void {
	const { internalModelContext, entitySetName } = parameters;
	if (internalModelContext) {
		if (internalModelContext.getProperty("deleteEnabled") != undefined) {
			options.forEach((option) => {
				// if an option is selected, then it is deleted. So, we need to remove them from selected contexts.
				if (option.selected) {
					clearSelectedContextsForOption(internalModelContext, option);
				}
			});
		}
		// if at least one of the options is not selected, then the delete button needs to be enabled.
		internalModelContext.setProperty(
			"deleteEnabled",
			options.some((option) => !option.selected)
		);
	}

	if (parameters.silentMode !== true) {
		if (contexts.length === 1) {
			MessageToast.show(resourceModel.getText("C_TRANSACTION_HELPER_DELETE_TOAST_SINGULAR", undefined, entitySetName));
		} else {
			MessageToast.show(resourceModel.getText("C_TRANSACTION_HELPER_DELETE_TOAST_PLURAL", undefined, entitySetName));
		}
	}

	// The MultiValueField does not need resetting of focus like the table, with the resetting we get console errors we avoid trough this check
	if (parameters.parentControl !== undefined && parameters.parentControl.getMetadata().getName() !== "sap.ui.mdc.MultiValueField") {
		deleteHelper.setFocusAfterDelete(parameters.parentControl as Table, contexts.length, lastDeletedRowIndex);
	}
}

async function setFocusAfterDelete(table: Table, deletedRowsCount: number, lastDeletedRowIndex: number): Promise<void> {
	const tableRowsCount = table.getRowBinding?.()?.getCount();
	const originalTableRowsCount = (tableRowsCount ?? 0) + deletedRowsCount;
	let nextFocusRowIndex;

	if (lastDeletedRowIndex !== -1 && tableRowsCount !== undefined && tableRowsCount > 0) {
		//If the last row is deleted, move the focus to previous row to it
		if (lastDeletedRowIndex === originalTableRowsCount - 1) {
			nextFocusRowIndex = tableRowsCount - 1;
			//For the normal scenario, move the focus to the next row
		} else {
			nextFocusRowIndex = lastDeletedRowIndex - deletedRowsCount + 1;
		}
		await table.focusRow(nextFocusRowIndex, false);
	} else {
		// For zero rows or default case, move focus to table
		table.focus();
	}
}

function getLockedContextUser(lockedContext: ODataV4Context): string {
	const draftAdminData = lockedContext.getObject()["DraftAdministrativeData"] as DraftAdministrativeDataType;
	return (draftAdminData && draftAdminData["InProcessByUser"]) || "";
}

function getLockedObjectsText(resourceModel: ResourceModel, numberOfSelectedContexts: number, lockedContexts: ODataV4Context[]): string {
	let retTxt = "";

	if (numberOfSelectedContexts === 1 && lockedContexts.length === 1) {
		//only one unsaved object
		const lockedUser = getLockedContextUser(lockedContexts[0]);
		retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_SINGLE_OBJECT_LOCKED", [lockedUser]);
	} else if (lockedContexts.length == 1) {
		const lockedUser = getLockedContextUser(lockedContexts[0]);
		retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_ONE_OBJECT_LOCKED", [
			numberOfSelectedContexts,
			lockedUser
		]);
	} else if (lockedContexts.length > 1) {
		retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_FEW_OBJECTS_LOCKED", [
			lockedContexts.length,
			numberOfSelectedContexts
		]);
	}

	return retTxt;
}

function getNonDeletableActivesOfDraftsText(resourceModel: ResourceModel, numberOfDrafts: number, totalDeletable: number): string {
	let retTxt = "";

	if (totalDeletable === numberOfDrafts) {
		if (numberOfDrafts === 1) {
			retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_ONLY_DRAFT_OF_NON_DELETABLE_ACTIVE");
		} else {
			retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_ONLY_DRAFTS_OF_NON_DELETABLE_ACTIVE");
		}
	} else if (numberOfDrafts === 1) {
		retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_DRAFT_OF_NON_DELETABLE_ACTIVE");
	} else {
		retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_DRAFTS_OF_NON_DELETABLE_ACTIVE");
	}

	return retTxt;
}

function getUnSavedContextUser(unSavedContext: ODataV4Context): string {
	const draftAdminData = unSavedContext.getObject()["DraftAdministrativeData"] as DraftAdministrativeDataType;
	let sLastChangedByUser = "";
	if (draftAdminData) {
		sLastChangedByUser = draftAdminData["LastChangedByUserDescription"] || draftAdminData["LastChangedByUser"] || "";
	}

	return sLastChangedByUser;
}

function getUnsavedContextsText(
	resourceModel: ResourceModel,
	numberOfSelectedContexts: number,
	unSavedContexts: ODataV4Context[],
	totalDeletable: number
): DeleteTextInfo {
	let infoTxt = "",
		optionTxt = "",
		optionWithoutTxt = false;
	if (numberOfSelectedContexts === 1 && unSavedContexts.length === 1) {
		//only one unsaved object are selected
		const lastChangedByUser = getUnSavedContextUser(unSavedContexts[0]);
		infoTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_CHANGES", [lastChangedByUser]);
		optionWithoutTxt = true;
	} else if (numberOfSelectedContexts === unSavedContexts.length) {
		//only multiple unsaved objects are selected
		infoTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_CHANGES_MULTIPLE_OBJECTS");
		optionWithoutTxt = true;
	} else if (totalDeletable === unSavedContexts.length) {
		// non-deletable/locked exists, all deletable are unsaved by others
		if (unSavedContexts.length === 1) {
			const lastChangedByUser = getUnSavedContextUser(unSavedContexts[0]);
			infoTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_AND_FEW_OBJECTS_LOCKED_SINGULAR", [
				lastChangedByUser
			]);
		} else {
			infoTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_AND_FEW_OBJECTS_LOCKED_PLURAL");
		}
		optionWithoutTxt = true;
	} else if (totalDeletable > unSavedContexts.length) {
		// non-deletable/locked exists, deletable include unsaved and other types.
		if (unSavedContexts.length === 1) {
			const lastChangedByUser = getUnSavedContextUser(unSavedContexts[0]);
			optionTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_FEW_OBJECTS_UNSAVED_SINGULAR", [
				lastChangedByUser
			]);
		} else {
			optionTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_FEW_OBJECTS_UNSAVED_PLURAL");
		}
	}

	return { infoTxt, optionTxt, optionWithoutTxt };
}

function getNonDeletableText(
	mParameters: DeleteParameters,
	totalNumDeletableContexts: number,
	resourceModel: ResourceModel
): Text | undefined {
	const { numberOfSelectedContexts, entitySetName, lockedContexts = [], draftsWithNonDeletableActive = [] } = mParameters;
	const nonDeletableContexts =
		numberOfSelectedContexts! - (lockedContexts.length + totalNumDeletableContexts - draftsWithNonDeletableActive.length);
	let retTxt = "";

	if (
		nonDeletableContexts > 0 &&
		(totalNumDeletableContexts === 0 || draftsWithNonDeletableActive.length === totalNumDeletableContexts)
	) {
		// 1. None of the ccontexts are deletable
		// 2. Only drafts of non deletable contexts exist.
		if (lockedContexts.length > 0) {
			// Locked contexts exist
			if (nonDeletableContexts === 1) {
				retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_ALL_REMAINING_NON_DELETABLE_SINGULAR");
			} else {
				retTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_ALL_REMAINING_NON_DELETABLE_PLURAL");
			}
		} else if (nonDeletableContexts === 1) {
			// Only pure non-deletable contexts exist single
			retTxt = resourceModel.getText(
				"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_SINGLE_AND_ONE_OBJECT_NON_DELETABLE",
				undefined,
				entitySetName
			);
		} else {
			// Only pure non-deletable contexts exist multiple
			retTxt = resourceModel.getText(
				"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_MULTIPLE_AND_ALL_OBJECT_NON_DELETABLE",
				undefined,
				entitySetName
			);
		}
	} else if (nonDeletableContexts === 1) {
		// deletable and non-deletable exists together, single
		retTxt = resourceModel.getText(
			"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_ONE_OBJECT_NON_DELETABLE",
			[numberOfSelectedContexts],
			entitySetName
		);
	} else if (nonDeletableContexts > 1) {
		// deletable and non-deletable exists together, multiple
		retTxt = resourceModel.getText(
			"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO_AND_FEW_OBJECTS_NON_DELETABLE",
			[nonDeletableContexts, numberOfSelectedContexts],
			entitySetName
		);
	}

	return retTxt ? new Text({ text: retTxt }) : undefined;
}

function getConfirmedDeletableContext(contexts: ODataV4Context[], options: DeleteOption[]): ODataV4Context[] {
	return options.reduce((result, option) => {
		return option.selected && option.type !== DeleteOptionTypes.draftsToDeleteBeforeActive ? result.concat(option.contexts) : result;
	}, contexts);
}

function getDraftsToDeleteBeforeActive(options: DeleteOption[]): ODataV4Context[] {
	const contexts: ODataV4Context[] = [];
	return options.reduce((result, option) => {
		return option.selected && option.type === DeleteOptionTypes.draftsToDeleteBeforeActive ? result.concat(option.contexts) : result;
	}, contexts);
}

function updateDraftOptionsForDeletableTexts(
	mParameters: DeleteParameters,
	vContexts: ODataV4Context[],
	totalDeletable: number,
	resourceModel: ResourceModel,
	items: Control[],
	options: DeleteOption[]
): void {
	let { numberOfSelectedContexts, draftsWithDeletableActive, unSavedContexts, lockedContexts, draftsWithNonDeletableActive } =
		mParameters;
	draftsWithDeletableActive ??= [];
	unSavedContexts ??= [];
	lockedContexts ??= [];
	draftsWithNonDeletableActive ??= [];
	numberOfSelectedContexts ??= 0;
	let lockedContextsTxt = "";

	// drafts with active
	if (draftsWithDeletableActive.length > 0) {
		const draftsToDeleteBeforeActive: ODataV4Context[] = [];
		draftsWithDeletableActive.forEach((deletableDraftInfo: DraftSiblingPair) => {
			// In either cases, if an own draft is locked or not the draft needs to be discarded before deleting active record.
			draftsToDeleteBeforeActive.push(deletableDraftInfo.draft);
			vContexts.push(deletableDraftInfo.siblingInfo.targetContext);
		});
		if (draftsToDeleteBeforeActive.length > 0) {
			options.push({
				type: DeleteOptionTypes.draftsToDeleteBeforeActive,
				contexts: draftsToDeleteBeforeActive,
				selected: true
			});
		}
	}

	// items locked msg
	if (lockedContexts.length > 0) {
		lockedContextsTxt = deleteHelper.getLockedObjectsText(resourceModel, numberOfSelectedContexts, lockedContexts) || "";
		items.push(new Text({ text: lockedContextsTxt }));
	}

	// non deletable msg
	const nonDeletableExists = numberOfSelectedContexts != totalDeletable - draftsWithNonDeletableActive.length + lockedContexts.length;
	const nonDeletableTextCtrl = nonDeletableExists && deleteHelper.getNonDeletableText(mParameters, totalDeletable, resourceModel);
	if (nonDeletableTextCtrl) {
		items.push(nonDeletableTextCtrl);
	}

	// option: unsaved changes by others
	if (unSavedContexts.length > 0) {
		const unsavedChangesTxts =
			deleteHelper.getUnsavedContextsText(resourceModel, numberOfSelectedContexts, unSavedContexts, totalDeletable) || {};
		if (unsavedChangesTxts.infoTxt) {
			items.push(new Text({ text: unsavedChangesTxts.infoTxt }));
		}
		if (unsavedChangesTxts.optionTxt || unsavedChangesTxts.optionWithoutTxt) {
			options.push({
				type: DeleteOptionTypes.unSavedContexts,
				contexts: unSavedContexts,
				text: unsavedChangesTxts.optionTxt,
				selected: true,
				control: DeleteDialogContentControl.CHECKBOX
			});
		}
	}

	// option: drafts with active not deletable
	if (draftsWithNonDeletableActive.length > 0) {
		const nonDeletableActivesOfDraftsText =
			deleteHelper.getNonDeletableActivesOfDraftsText(resourceModel, draftsWithNonDeletableActive.length, totalDeletable) || "";
		if (nonDeletableActivesOfDraftsText) {
			options.push({
				type: DeleteOptionTypes.draftsWithNonDeletableActive,
				contexts: draftsWithNonDeletableActive,
				text: nonDeletableActivesOfDraftsText,
				selected: true,
				control: totalDeletable > 0 ? DeleteDialogContentControl.CHECKBOX : DeleteDialogContentControl.TEXT
			});
		}
	}
}

function updateContentForDeleteDialog(options: DeleteOption[], items: Control[]): void {
	if (options.length === 1) {
		// Single option doesn't need checkBox
		const option = options[0];
		if (option.text) {
			const text = new Text();
			text.setText(option.text);
			items.push(text);
		}
	} else if (options.length > 1) {
		// Multiple Options

		// Texts
		options.forEach((option: DeleteOption) => {
			if (option.control === "text" && option.text) {
				const text = new Text();
				text.setText(option.text);
				items.push(text);
			}
		});
		// CheckBoxs
		options.forEach((option: DeleteOption) => {
			if (option.control === "checkBox" && option.text) {
				items.push(
					new CheckBox({
						text: option.text,
						selected: true,
						select: function (oEvent: CheckBox$SelectEvent): void {
							const checkBox = oEvent.getSource();
							const selected = checkBox.getSelected();
							option.selected = selected;
						}
					})
				);
			}
		});
	}
}

/**
 * Get the original record selected on the UI.
 *
 * In the case the context to delete is an active record but the selected context is a draft record.
 * @param mParameters Delete parameters and information of selected contexts.
 * @param contextToDelete ODataV4Context to check.
 * @returns ODataV4Context for delete.
 */
function _getOriginalSelectedRecord(mParameters: DeleteParameters, contextToDelete: ODataV4Context): ODataV4Context {
	const { draftsWithDeletableActive } = mParameters;
	const ret = draftsWithDeletableActive?.find((draftSiblingPair) => draftSiblingPair.siblingInfo.targetContext === contextToDelete);
	return ret?.draft ? ret.draft : contextToDelete;
}

/**
 * Get the possible options for deletion of the selected contexts.
 * @param mParameters Delete parameters and information of selected contexts.
 * @param directDeletableContexts Contexts that can be deletable directly.
 * @param resourceModel Resource model.
 * @returns Options that are possible for selected records.
 */
function getOptionsForDeletableTexts(
	mParameters: DeleteParameters,
	directDeletableContexts: ODataV4Context[],
	resourceModel: ResourceModel
): DeleteOption[] {
	let { numberOfSelectedContexts, lockedContexts, draftsWithNonDeletableActive, unSavedContexts } = mParameters;
	const { entitySetName, parentControl, description } = mParameters;
	draftsWithNonDeletableActive ??= [];
	unSavedContexts ??= [];
	lockedContexts ??= [];
	draftsWithNonDeletableActive ??= [];
	numberOfSelectedContexts ??= 0;
	const totalDeletable = directDeletableContexts.length + draftsWithNonDeletableActive.length + unSavedContexts.length;
	const nonDeletableContexts = numberOfSelectedContexts - (lockedContexts.length + totalDeletable - draftsWithNonDeletableActive.length);
	const options: DeleteOption[] = [];

	if (numberOfSelectedContexts === 1 && numberOfSelectedContexts === directDeletableContexts.length) {
		// single deletable context
		const oTable = parentControl as Table;
		const sKey = oTable && ((oTable.getParent() as TableAPI).getIdentifierColumn() as string);
		let txt;
		if (sKey) {
			const descriptionPath = description && (description as { path?: string }).path;
			// In case the selected record is draft(in UI). The Active record needs to be deleted(directDeletableContexts has active record), but data is not requested or partial. We get data from the draft.
			const oLineContextData = _getOriginalSelectedRecord(mParameters, directDeletableContexts[0]).getObject();
			const sKeyValue = sKey ? oLineContextData[sKey] : undefined;
			const sDescription = descriptionPath && oLineContextData[descriptionPath];
			if (sKeyValue) {
				if (description && sKey !== (description as { path?: string }).path) {
					txt = resourceModel.getText(
						"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO",
						[sKeyValue, sDescription],
						entitySetName
					);
				} else {
					txt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_ONLY", [sKeyValue], entitySetName);
				}
			} else {
				txt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR", undefined, entitySetName);
			}
		} else {
			txt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR", undefined, entitySetName);
		}
		options.push({
			type: DeleteOptionTypes.deletableContexts,
			contexts: directDeletableContexts,
			text: txt,
			selected: true,
			control: DeleteDialogContentControl.TEXT
		});
	} else if (
		unSavedContexts.length !== totalDeletable &&
		numberOfSelectedContexts > 0 &&
		(directDeletableContexts.length > 0 || (unSavedContexts.length > 0 && draftsWithNonDeletableActive.length > 0))
	) {
		if (numberOfSelectedContexts > directDeletableContexts.length && nonDeletableContexts + lockedContexts.length > 0) {
			// other types exists with pure deletable ones
			let deletableOptionTxt = "";
			if (totalDeletable === 1) {
				deletableOptionTxt = resourceModel.getText(
					"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR_NON_DELETABLE",
					undefined,
					entitySetName
				);
			} else {
				deletableOptionTxt = resourceModel.getText(
					"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_PLURAL_NON_DELETABLE",
					undefined,
					entitySetName
				);
			}
			options.unshift({
				type: DeleteOptionTypes.deletableContexts,
				contexts: directDeletableContexts,
				text: deletableOptionTxt,
				selected: true,
				control: DeleteDialogContentControl.TEXT
			});
		} else {
			// only deletable
			const allDeletableTxt =
				totalDeletable === 1
					? resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR", undefined, entitySetName)
					: resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_PLURAL", undefined, entitySetName);
			options.push({
				type: DeleteOptionTypes.deletableContexts,
				contexts: directDeletableContexts,
				text: allDeletableTxt,
				selected: true,
				control: DeleteDialogContentControl.TEXT
			});
		}
	}

	return options;
}

async function deleteDraftsBeforeActivesAndGetErrors(
	draftsToDeleteBeforeActive: ODataV4Context[],
	messageHandler: MessageHandler,
	appComponent: AppComponent,
	enableStrictHandling: boolean
): Promise<unknown[]> {
	const draftErrors: unknown[] = [];
	await Promise.allSettled(
		draftsToDeleteBeforeActive.map(async function (context: ODataV4Context) {
			try {
				return await draft.deleteDraft(context, messageHandler, appComponent, enableStrictHandling);
			} catch (e: unknown) {
				Log.error(`FE : core : DeleteHelper : Error while discarding draft with path : ${context.getPath()}`);
				draftErrors.push(e);
			}
		})
	);
	return draftErrors;
}

/**
 * In case of a tree table, we shall not delete a context if one if its ancestors is also to be deleted.
 * This functions filters out such contexts.
 * @param contexts
 * @returns The filtered contexts
 */
function removeDescendantContexts(contexts: ODataV4Context[]): ODataV4Context[] {
	const tempContexts: (ODataV4Context | undefined)[] = [...contexts];
	// Filter out contexts whose ancestor is also deleted, as they will be deleted with their ancestor
	tempContexts.forEach((parentContext, parentIndex) => {
		if (parentContext === undefined) {
			return;
		}

		for (let childIndex = parentIndex + 1; childIndex < tempContexts.length; childIndex++) {
			const childContext = tempContexts[childIndex];
			if (childContext && parentContext.isAncestorOf(childContext)) {
				tempContexts[childIndex] = undefined;
			}
		}
	});

	return tempContexts.filter((context) => context !== undefined) as ODataV4Context[];
}

async function deleteConfirmHandler(
	options: DeleteOption[],
	mParameters: DeleteParameters,
	messageHandler: MessageHandler,
	resourceModel: ResourceModel,
	appComponent: AppComponent,
	draftEnabled: boolean,
	bindingType?: "Tree" | "Analytical"
): Promise<void> {
	const messageHandlingKey = messageHandler.registerToHoldMessages();
	let contexts: ODataV4Context[] = [];
	try {
		contexts = deleteHelper.getConfirmedDeletableContext([], options);
		const lastDeletedRowIndex = contexts[contexts.length - 1].getIndex() ?? -1;
		const draftsToDeleteBeforeActive = getDraftsToDeleteBeforeActive(options);

		const { beforeDeleteCallBack } = mParameters;
		if (beforeDeleteCallBack) {
			await beforeDeleteCallBack({ contexts: contexts });
		}

		if (contexts.length) {
			const enableStrictHandling = contexts.length === 1 ? true : false;
			const draftErrors: unknown[] = await deleteDraftsBeforeActivesAndGetErrors(
				draftsToDeleteBeforeActive,
				messageHandler,
				appComponent,
				enableStrictHandling
			);

			let contextsToDelete = contexts;
			if (bindingType === "Tree") {
				contextsToDelete = removeDescendantContexts(contexts);
			}

			await Promise.all(
				contextsToDelete.map(async function (context: ODataV4Context) {
					// If the context to delete is a draft (i.e. acutally we just wnat to discard), we should use draft.deleteDraft in order to use a discard action if defined
					// However, draft.deleteDraft uses getProperty, which returns undefined if the context is not read from the backend.
					// This can be the case, if we have retrieved this context via the sibling (e.g. when a draft existed and we want to delete both - in that case
					// we have already discarded the draft above, and now need to delete the active one). To identify this situation, we must not use getProperty
					// (as the context is not read), but check the same in the mParameters.
					// In this case, we can just delete the context. But we should not use context.delete (also updating bindings, which fails in the described situation),
					// but model.delete (only sending the delete). In other cases (e.g. non-draft), this is also sufficient, as we anyway take care of setting
					// correct bidnings with the navigation triggered by the deletion.
					// In case on analytical table, we also don't want to call context.delete, as it will fail.
					if (
						!draftEnabled ||
						mParameters.draftsWithDeletableActive?.find(
							(draftWithDeletableActive) => draftWithDeletableActive.siblingInfo.targetContext === context
						) ||
						bindingType === "Analytical"
					) {
						context.resetChanges();
						return context.getModel().delete(context.getCanonicalPath());
					} else {
						return draft.deleteDraft(context, messageHandler, appComponent, enableStrictHandling);
					}
				})
			);
			deleteHelper.afterDeleteProcess(mParameters, options, contexts, resourceModel, lastDeletedRowIndex);
			if (draftErrors.length > 0) {
				throw Error(`FE : core : DeleteHelper : Errors on draft delete : ${draftErrors}`);
			}
		}
		messageHandler.removeHoldKey(messageHandlingKey);
	} catch (oError) {
		if (contexts.length > 1) {
			deleteHelper.addGenericDeleteFailureMessage(resourceModel);
		}
		await messageHandler.showMessages({ unHoldKey: messageHandlingKey });
		// re-throw error to enforce rejecting the general promise
		throw oError;
	}
}

/**
 * Adding a generic delete failure message to message model for readability.
 * @param resourceModel Resource model for message text
 */
function addGenericDeleteFailureMessage(resourceModel: ResourceModel): void {
	Messaging.addMessages(
		new Message({
			message: resourceModel.getText("C_COMMON_DELETE_CHANGESET_FAILURE_MULTIPLE_ERRORS_TEXT"),
			type: MessageType.Error,
			target: undefined,
			persistent: true,
			code: "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED",
			description: resourceModel.getText("C_COMMON_DELETE_CHANGESET_FAILURE_MULTIPLE_ERRORS_DETAILS_TEXT"),
			technicalDetails: {
				fe: {
					changeSetPreTextForSingleError: resourceModel.getText("C_COMMON_DELETE_CHANGESET_FAILURE_SINGLE_ERROR_TEXT")
				}
			}
		})
	);
}

/**
 * Updates a ContextInfo using its sibling context, if needed.
 * Requests the sibling context and updates the siblingDeletable property.
 * Also manages the case where the main context is active but has a draft sibling (--> swap between main and sibling context).
 * @param info
 * @param deletablePath
 * @param staticDeletable
 */
async function updateInfoFromSibling(info: ContextInfo, deletablePath: string | undefined, staticDeletable: boolean): Promise<void> {
	try {
		if (!info.isActive && info.hasActive) {
			// Case 1: the context is a draft, we need to get its active sibling
			const siblingInformation = await draft.computeSiblingInformation(info.context, info.context);
			info.siblingInfo = siblingInformation;
			info.siblingDeletable = deletablePath
				? await siblingInformation?.targetContext?.requestProperty(deletablePath)
				: staticDeletable;
		} else if (info.isActive && info.hasDraft) {
			// Case 2: the context is active, we need to get its draft sibling
			const siblingInformation = await draft.computeSiblingInformation(info.context, info.context);
			if (siblingInformation?.targetContext) {
				// We were able to retrieve the draft sibling from the active instance --> fallback to case 1
				// by exchanging the context with the sibling context in the info object.
				const propertiesToFetch = ["IsActiveEntity", "HasActiveEntity"];
				if (deletablePath) {
					propertiesToFetch.push(deletablePath);
				}
				await siblingInformation.targetContext.requestProperty(propertiesToFetch);
				info.locked = false;
				info.hasDraft = false;
				info.isActive = false;
				info.hasActive = true;
				// Exchange context with sibling context
				info.siblingInfo = { targetContext: info.context, pathMapping: [] };
				info.context = siblingInformation.targetContext;
				// Exchange deletable with sibling deletable
				info.siblingDeletable = info.deletable;
				info.deletable = deletablePath ? siblingInformation.targetContext.getProperty(deletablePath) : staticDeletable;
			}
		}
	} catch (_e) {
		// Do nothing
	}
}

/**
 * Collect context information (isDraftRoot, isDraftNode, HasDraftEntity, IsActiveEntity, HasActiveEntity, isLocked, isInactive).
 * @param context Context to evaluate.
 * @returns The context info promise.
 */
async function getContextInfos(context: ODataV4Context): Promise<ContextInfo> {
	const isTransient = !!context?.getObject()["@$ui5.context.isTransient"];
	const isInactive = context?.isInactive();
	const metaContext =
		isInactive || (!isInactive && isTransient)
			? undefined
			: context.getModel().getMetaModel().getMetaContext(context.getCanonicalPath());
	const deletablePath = metaContext?.getProperty("@Org.OData.Capabilities.V1.DeleteRestrictions/Deletable/$Path");
	const staticDeletable = !deletablePath && metaContext?.getProperty("@Org.OData.Capabilities.V1.DeleteRestrictions/Deletable") !== false;
	const deletable = deletablePath ? context.getProperty(deletablePath) : staticDeletable;

	const info: ContextInfo = {
		context: context,
		isDraftRoot: !!metaContext?.getProperty("@com.sap.vocabularies.Common.v1.DraftRoot"),
		isDraftNode: !!metaContext?.getProperty("@com.sap.vocabularies.Common.v1.DraftNode"),
		isActive: true,
		hasActive: false,
		hasDraft: false,
		locked: false,
		// for an emptyRow (inactive context) it's always deletable as long as the context kept inactive..
		deletable: deletable,
		siblingInfo: undefined,
		siblingDeletable: false,
		isInactiveContext: !!context.isInactive()
	};
	if (!context.isInactive() && info.isDraftRoot) {
		const contextData = context.getObject();
		info.locked = !!contextData.DraftAdministrativeData?.InProcessByUser;
		info.hasDraft = contextData.HasDraftEntity;
		info.isActive = contextData.IsActiveEntity;
		info.hasActive = contextData.HasActiveEntity;
		await updateInfoFromSibling(info, deletablePath, staticDeletable);
	}
	return info;
}

// Table Runtime Helpers:

/* refreshes data in internal model relevant for enablement of delete button according to selected contexts
relevant data are: deletableContexts, draftsWithDeletableActive, draftsWithNonDeletableActive, unSavedContexts, deleteEnabled
not relevant: lockedContexts
*/
async function updateDeleteInfoForSelectedContexts(
	internalModelContext: InternalModelContext,
	selectedContexts: ODataV4Context[],
	forContextMenu = false
): Promise<void> {
	const contextInfos = await Promise.all(selectedContexts.map(getContextInfos));

	const buckets = [
		{
			key: "draftsWithDeletableActive",
			// only for draft root: In that case, the delete request needs to be sent for the active (i.e. the sibling),
			// while in draft node, the delete request needs to be send for the draft itself
			value: contextInfos.filter(
				(info) => !info.isInactiveContext && info.isDraftRoot && !info.isActive && info.hasActive && info.siblingDeletable
			)
		},
		{
			key: "draftsWithNonDeletableActive",
			// only for draft root: For draft node, we only rely on information in the draft itself (not its active sibling)
			// application has to take care to set this correctly (in case active sibling must not be deletable, activation
			// of draft with deleted node would also delte active sibling => deletion of draft node to be avoided)
			value: contextInfos.filter(
				(info) => !info.isInactiveContext && info.isDraftRoot && !info.isActive && info.hasActive && !info.siblingDeletable
			)
		},
		{
			key: "lockedContexts",
			value: contextInfos.filter(
				(info) => !info.isInactiveContext && info.isDraftRoot && info.isActive && info.hasDraft && info.locked
			)
		},
		{
			key: "unSavedContexts",
			value: contextInfos.filter(
				(info) => !info.isInactiveContext && info.isDraftRoot && info.isActive && info.hasDraft && !info.locked
			)
		},
		// non-draft/sticky and deletable
		// active draft root without any draft and deletable
		// created draft root (regardless of deletable)
		// draft node only according to its annotation
		{
			key: "deletableContexts",
			value: contextInfos.filter(
				(info) =>
					info.isInactiveContext ||
					(!info.isDraftRoot && !info.isDraftNode && info.deletable) ||
					(info.isDraftRoot && info.isActive && !info.hasDraft && info.deletable) ||
					(info.isDraftRoot && !info.isActive && !info.hasActive) ||
					(info.isDraftNode && info.deletable)
			)
		}
	];
	const contextPath = !forContextMenu ? "" : "contextmenu/";
	for (const { key, value } of buckets) {
		internalModelContext.setProperty(
			contextPath + key,
			// Currently, bucket draftsWithDeletableActive has a different structure (containing also sibling information, which is used
			// in case of deletion). Possible improvement: Read sibling information only when needed, and build all buckets with same
			// structure. However, in that case siblingInformation might need to be read twice (if already needed for button enablement),
			// thus a buffer probably would make sense.
			value.map((info) =>
				key === "draftsWithDeletableActive" ? { draft: info.context, siblingInfo: info.siblingInfo } : info.context
			)
		);
	}
}

const deleteHelper = {
	getNonDeletableText,
	deleteConfirmHandler,
	getOptionsForDeletableTexts,
	updateContentForDeleteDialog,
	updateDraftOptionsForDeletableTexts,
	getConfirmedDeletableContext,
	getLockedObjectsText,
	getUnsavedContextsText,
	getNonDeletableActivesOfDraftsText,
	afterDeleteProcess,
	updateDeleteInfoForSelectedContexts,
	DeleteOptionTypes,
	DeleteDialogContentControl,
	setFocusAfterDelete,
	getContextInfos,
	addGenericDeleteFailureMessage,
	removeDescendantContexts
};

export default deleteHelper;

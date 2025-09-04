import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import { defineUI5Class, methodOverride, type EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { hookable } from "sap/fe/base/HookSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import BaseControllerExtension from "sap/fe/core/controllerextensions/BaseControllerExtension";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import BeforeActionDialog from "sap/fe/core/controls/inlineEditFlow/BeforeActionDialog";
import BeforeNavigationDialog, { type DIALOGRESULT } from "sap/fe/core/controls/inlineEditFlow/BeforeNavigationDialog";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import { type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type Field from "sap/fe/macros/Field";
import type InlineEdit from "sap/fe/macros/inlineEdit/InlineEdit";
import MessageToast from "sap/m/MessageToast";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import type { ODataContextBinding$PatchSentEvent } from "sap/ui/model/odata/v4/ODataContextBinding";
import DraftExistsDialog from "../controls/inlineEditFlow/DraftExistsDialog";

@defineUI5Class("sap.fe.core.controllerextensions.InlineEditFlow")
export default class InlineEditFlow extends BaseControllerExtension {
	protected base!: PageController;

	private inlineEditControls: Control[] = [];

	private inlineEditBindingContextPath?: string;

	private abortTimerBeforeSave?: Function;

	private patchPromise?: Promise<UI5Event>;

	/**
	 * Method to know if there can be inline edit on the page.
	 * @returns True if inline edit is possible
	 */
	isInlineEditPossible(): boolean {
		return this.base.getAppComponent().getInlineEditService().doesPageHaveInlineEdit(this.base.getRoutingTargetName());
	}

	/**
	 * Save the inline edit changes.
	 * @returns A promise that resolved once the batch has returned.
	 */
	async inlineEditSave(): Promise<void> {
		const model = this.base.getView().getModel();

		const messages = Messaging.getMessageModel().getData();
		const hasTechnicalMessages = messages.some((message: Message) => !messageHandling.isNonTechnicalMessage(message));
		if (hasTechnicalMessages) {
			this.base.setShowFooter(true);
			// if there are invalid types we should not try to save
			return;
		}
		if (!model.hasPendingChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID)) {
			this.inlineEditEnd();
			return;
		}
		try {
			Messaging.removeAllMessages();
			await model.submitBatch(CommonUtils.INLINEEDIT_UPDATEGROUPID);
		} catch (error: unknown) {
			Log.warning("Error while saving inline edit changes");
		}
	}

	/**
	 * Discard the inline edit changes.
	 */
	inlineEditDiscard(): void {
		this.base.getView().getModel().resetChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID);
		this.inlineEditEnd(true);
	}

	/**
	 * End the inline edit.
	 * @param refreshDescription
	 */
	inlineEditEnd(refreshDescription?: boolean): void {
		Messaging.removeAllMessages();
		this.base.setShowFooter(false);
		for (const control of this.inlineEditControls) {
			(control as EnhanceWithUI5<Field> & InlineEdit).inlineEditEnd(refreshDescription);
		}
		this.inlineEditControls = [];
		this.base.getView().getModel("ui").setProperty("/isInlineEditActive", false);
	}

	/**
	 * Start the inline edit on the bindingContextPath for the propertyFullyQualifiedName.
	 * @param propertyFullyQualifiedName
	 * @param bindingContextPath
	 * @param controlTrigger
	 */
	startInlineEdit(
		propertyFullyQualifiedName: string,
		bindingContextPath: string,
		controlTrigger?: EnhanceWithUI5<Field> & InlineEdit
	): void {
		if (controlTrigger?.getBindingContext()?.getProperty("HasDraftEntity")) {
			// there is already a draft on the entity. We should not start inline edit
			new DraftExistsDialog(this.base.getView()).open();
			controlTrigger?.resetIndicatorPopup();
			return;
		}
		const inlineEditService = this.base.getAppComponent().getInlineEditService();
		const dependentProperties = inlineEditService.getInlineConnectedProperties(
			this.base.getRoutingTargetName(),
			propertyFullyQualifiedName
		);

		this.inlineEditStart([], dependentProperties?.length ? dependentProperties : [propertyFullyQualifiedName], bindingContextPath);
		this.base.getView().getModel("ui").setProperty("/isInlineEditActive", true);
	}

	/**
	 * Focus handling for inline edit. When one field gets focus, all other inline edit popups, that are currently opened, should be closed.
	 * @param inlineEditControl Controls which are currently in inline edit mode.
	 */
	focusHandling(inlineEditControl: Control): void {
		for (const control of this.inlineEditControls) {
			if (control !== inlineEditControl) {
				(control as EnhanceWithUI5<Field> & InlineEdit).closeInlineEditPopupEditMode();
			} else if (control === inlineEditControl) {
				control.focus();
			}
		}
	}

	/**
	 * Confirm the start of the inline edit on the bindingContextPath for the properties.
	 * @param inlineEditControls The fields that are currently in inline edit mode.
	 * @param properties
	 * @param bindingContextPath
	 */
	@hookable("Before")
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async inlineEditStart(inlineEditControls: Control[], properties: string[], bindingContextPath: string): Promise<void> {
		if (this.abortTimerBeforeSave) {
			// if there is  a timer to save
			this.abortTimerBeforeSave();
			this.abortTimerBeforeSave = undefined;
			await this.inlineEditSave();
		}
		const alreadyRegisteredControls = this.inlineEditControls.map((control: Control) => control.getId());
		for (const control of inlineEditControls) {
			if (!alreadyRegisteredControls.includes(control.getId())) {
				this.inlineEditControls.push(control);
			}
		}
		this.inlineEditBindingContextPath = bindingContextPath;
		return;
	}

	/**
	 * Convenience method to determine if a property should be considered for inline edit.
	 * @param propertyFullyQualifiedName
	 * @returns True when the property is considered for Inline edit.
	 */
	isPropertyConsideredForInlineEdit(propertyFullyQualifiedName: string): boolean {
		return this.base
			.getAppComponent()
			.getInlineEditService()
			.isPropertyConsideredForInlineEdit(this.base.getRoutingTargetName(), propertyFullyQualifiedName);
	}

	/**
	 * Handles the patchSent event: handle inline edit save success or failure.
	 * @param event The event sent by the binding
	 */
	async handleInlineEditPatchSent(event: ODataContextBinding$PatchSentEvent): Promise<void> {
		this.patchPromise = new Promise<UI5Event>((resolve, reject) => {
			event.getSource().attachEventOnce("patchCompleted", (patchCompletedEvent: UI5Event<{ success: boolean }>) => {
				const bSuccess = patchCompletedEvent.getParameter("success");
				if (bSuccess) {
					resolve(patchCompletedEvent);
				} else {
					reject(patchCompletedEvent);
				}
			});
		});
		try {
			await this.patchPromise;
			this.patchPromise = undefined;
			const resourceBundle = Lib.getResourceBundleFor("sap.fe.core");
			if (resourceBundle) {
				MessageToast.show(resourceBundle.getText("C_INLINE_EDIT_SAVED"));
			}
			this.inlineEditEnd();
		} catch (patchCompletedEvent) {
			this.patchPromise = undefined;
			this.handleInlineEditSaveFailed();
		}
	}

	/**
	 * Method to show the errors when the inline edit save fails.
	 */
	handleInlineEditSaveFailed(): void {
		const metaModel = this.base.getView().getModel().getMetaModel();

		const messages = Messaging.getMessageModel().getData();
		if (messages.length) {
			this.base.setShowFooter(true);
			this.propagateInlineFieldGroupIdToMessageButton();
		}
		if (!this.inlineEditBindingContextPath) {
			return;
		}
		for (const message of messages) {
			for (const target of message.getTargets()) {
				const targetMetaContext = metaModel.createBindingContext(metaModel.getMetaPath(target));
				const messageTargetDataModelObject = targetMetaContext
					? MetaModelConverter.getInvolvedDataModelObjects<unknown>(targetMetaContext)
					: null;
				if (isProperty(messageTargetDataModelObject?.targetObject)) {
					const targetFullyQualifiedName =
						(messageTargetDataModelObject as unknown as DataModelObjectPath<Property>)?.targetObject?.fullyQualifiedName ?? "";
					if (this.isPropertyConsideredForInlineEdit(targetFullyQualifiedName)) {
						this.startInlineEdit(targetFullyQualifiedName, this.inlineEditBindingContextPath);
					}
				}
			}
		}
	}

	/**
	 * Performs a delayedCall when you focus out of a field.
	 */
	async delayedCallToSave(): Promise<void> {
		if (this.abortTimerBeforeSave || this.patchPromise) {
			// if there is already a timer running or a save in process do nothing
			return;
		}
		const timerBeforeSave = new Promise<void>((resolve, reject) => {
			this.abortTimerBeforeSave = reject;
			setTimeout(() => resolve(), 500);
		});
		try {
			await timerBeforeSave;
			this.abortTimerBeforeSave = undefined;
			this.inlineEditSave();
		} catch (e) {
			// Nothing to see it is just someone that cancelled the timer
		}
	}

	/**
	 * Method to ensure we leave inline edit before any navigation..
	 * @returns Promise that retruns true if we need to cancel navigation and stay in inline edit
	 */
	@methodOverride("routing")
	async onBeforeNavigation(): Promise<boolean> {
		if (this.inlineEditControls.length > 0) {
			// there are controls in inline edit we need to prevent the navigation and show the dialog
			if (this.abortTimerBeforeSave) {
				this.abortTimerBeforeSave();
				this.abortTimerBeforeSave = undefined;
			}
			if (!this.base.getView().getModel().hasPendingChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID)) {
				// fields are in inline edit and there are no pending changes. We need to show the dialog
				this.inlineEditEnd();
				return false;
			}
			try {
				if (this.patchPromise) {
					await this.patchPromise;
				} else {
					const dialogResult = await this.openInlineEditBeforeNavigationDialogAndWaitForResult();
					if (dialogResult === "Save") {
						// we save and wait for the patchPromise
						await this.inlineEditSave();
						if (this.base.getView().getModel().hasPendingChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID)) {
							// if after saves there are still changes this means save has failed. we need to cancel navigation
							this.focusHandling(this.inlineEditControls[0]);
							return true;
						}
					} else if (dialogResult === "Cancel") {
						this.focusHandling(this.inlineEditControls[0]);
						return true;
					} else {
						// we discard the changes
						this.inlineEditDiscard();
					}
					return false;
				}
			} catch (e) {
				this.focusHandling(this.inlineEditControls[0]);
				return true;
			}
		}
		return false;
	}

	/**
	 * Method to open the dialog before navigation.
	 * @returns Promise that returns the dialog choice once the user has clicked on ok or cancel
	 */
	async openInlineEditBeforeNavigationDialogAndWaitForResult(): Promise<DIALOGRESULT> {
		return new Promise<DIALOGRESULT>((resolve) => {
			new BeforeNavigationDialog(this.base.getView(), resolve).open();
		});
	}

	/**
	 * Method to ensure we leave inline edit before any standard edit flowaction.
	 * @returns Promise that reject and triggers save or discard if we are in inline edit
	 */
	async onBeforeAnyEditFlowAction(): Promise<void> {
		if (this.inlineEditControls.length > 0) {
			if (this.abortTimerBeforeSave) {
				this.abortTimerBeforeSave();
				this.abortTimerBeforeSave = undefined;
			}
			if (!this.base.getView().getModel().hasPendingChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID)) {
				// fields are in inline edit and there are no pending changes. We don't need to show the dialog
				this.inlineEditEnd();
				return Promise.resolve();
			}
			new BeforeActionDialog(this.base.getView()).open();
			// there are controls in inline edit we need to prevent the action and show the dialog
			return Promise.reject();
		}
		return Promise.resolve();
	}

	/**
	 * Handle before edit.
	 * @returns Promise that reject if edit needs to be cancelled
	 */
	@methodOverride("editFlow")
	async onBeforeEdit(): Promise<void> {
		return this.onBeforeAnyEditFlowAction();
	}

	/**
	 * Handle before create.
	 * @returns Promise that reject if cretae needs to be cancelled
	 */
	@methodOverride("editFlow")
	async onBeforeCreate(): Promise<void> {
		return this.onBeforeAnyEditFlowAction();
	}

	/**
	 * Handle before delete.
	 * @returns Promise that reject if delete needs to be cancelled
	 */
	@methodOverride("editFlow")
	async onBeforeDelete(): Promise<void> {
		return this.onBeforeAnyEditFlowAction();
	}

	/**
	 * Handle before action.
	 * @returns Promise that reject if delete needs to be cancelled
	 */
	@methodOverride("editFlow")
	async onBeforeExecuteAction(): Promise<void> {
		return this.onBeforeAnyEditFlowAction();
	}

	/**
	 * Propagate the field group id to the message button.
	 */
	private propagateInlineFieldGroupIdToMessageButton(): void {
		// we propagate the fieldgroupId to the footer and all its descendants to ensure that
		// clicking on the footer does not trigger a focusout and a save for the inline edit
		const footerControls =
			(this.base
				.getFooter()
				?.findAggregatedObjects(true, (managedObject: ManagedObject) => managedObject.isA<Control>("sap.ui.core.Control")) as
				| Control[]
				| undefined) ?? [];

		for (const control of footerControls) {
			const childFieldGroupIds = new Set(control.getFieldGroupIds());
			childFieldGroupIds.add("InlineEdit");
			control.setFieldGroupIds(Array.from(childFieldGroupIds));
		}
	}
}

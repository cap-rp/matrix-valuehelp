import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type Field from "sap/fe/macros/Field";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type Tokenizer from "sap/m/Tokenizer";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type Context from "sap/ui/model/odata/v4/Context";
import type { FEView } from "../BaseController";
import type PageController from "../PageController";
import type { CollaborativeDraftService } from "../services/collaborativeDraftServiceFactory";
import { FieldEditMode } from "../templating/UIFormatters";
import BaseControllerExtension from "./BaseControllerExtension";
import { Activity, CollaborationFieldGroupPrefix } from "./collaboration/CollaborationCommon";

@defineUI5Class("sap.fe.core.controllerextensions.CollaborationDraft")
export default class CollaborationDraft extends BaseControllerExtension {
	private base!: PageController;

	private lastFocusId: string | undefined;

	private lastFocusFieldGroups: string | undefined;

	private collaborativeDraftService!: CollaborativeDraftService;

	private getCollaborativeDraftService(): CollaborativeDraftService {
		this.collaborativeDraftService = this.collaborativeDraftService ?? this.base.getAppComponent().getCollaborativeDraftService();
		return this.collaborativeDraftService;
	}

	/**
	 * Callback when the focus is set in the Field or one of its children.
	 * @param source
	 * @param focusEvent
	 */
	public handleContentFocusIn(source: Field | MultiValueField, focusEvent?: FocusEvent): void {
		// We send the event only if the focus was previously out of the Field
		if (source.isA<Tokenizer>("sap.m.Tokenizer")) {
			source = source.getParent()?.getParent() as MultiValueField;
		}
		let targetOutsideOfControlDomRef = false;
		if (focusEvent) {
			targetOutsideOfControlDomRef = !source.getDomRef()?.contains(focusEvent.relatedTarget as Node);
		}
		if (source.isA<MultiValueField>("sap.ui.mdc.MultiValueField") || targetOutsideOfControlDomRef) {
			// We need to handle the case where the newly focused Field is different from the previous one, but they share the same fieldGroupIDs
			// (e.g. fields in different rows in the same column of a table)
			// In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
			const lastFocusId = this.getLastFocusId();
			if (lastFocusId && lastFocusId !== source.getId() && this.getLastFocusFieldGroups() === source.getFieldGroupIds().join(",")) {
				const lastFocused = Element.getElementById(lastFocusId) as Field;
				this?.sendFocusOutMessage(lastFocused);
			}

			this.setLastFocusInformation(source);

			this.sendFocusInMessage(source);
		}
	}

	/**
	 * Callback when the focus is removed from the Field or one of its children.
	 * @param fieldGroupEvent
	 */
	public handleContentFocusOut(fieldGroupEvent: Control$ValidateFieldGroupEvent): void {
		let control: ManagedObject | null = fieldGroupEvent.getSource();
		if (control.isA<Tokenizer>("sap.m.Tokenizer")) {
			control = control.getParent()?.getParent() as MultiValueField;
		}
		if (!control.isA<MultiValueField>("sap.ui.mdc.MultiValueField")) {
			while (control && !control?.isA<Field>("sap.fe.macros.Field")) {
				control = control?.getParent();
			}
			if (!control) return;
		}

		const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds") as string[];

		// We send the event only if the validated fieldCroup corresponds to a collaboration group
		if (
			fieldGroupIds.some((groupId) => {
				return groupId.startsWith(CollaborationFieldGroupPrefix);
			})
		) {
			const sourceControl: Control = fieldGroupEvent.getSource();

			// Determine if the control that sent the event still has the focus (or one of its children).
			// This could happen e.g. if the user pressed <Enter> to validate the input.
			let currentFocusedControl: ManagedObject | null | undefined = Element.getActiveElement();
			while (currentFocusedControl && currentFocusedControl !== sourceControl) {
				currentFocusedControl = currentFocusedControl.getParent();
			}
			if (currentFocusedControl !== sourceControl) {
				// The control that sent the event isn't focused anymore
				this.sendFocusOutMessage(control);
				if (this.getLastFocusId() === control.getId()) {
					this.setLastFocusInformation(undefined);
				}
			}
		}
	}

	/**
	 * Gets the id of the last focused Field (if any).
	 * @returns ID
	 */
	private getLastFocusId(): string | undefined {
		return this.lastFocusId;
	}

	/**
	 * Gets the fieldgroups of the last focused Field (if any).
	 * @returns A string containing the fieldgroups separated by ','
	 */
	private getLastFocusFieldGroups(): string | undefined {
		return this.lastFocusFieldGroups;
	}

	/**
	 * Stores information about the last focused Field (id and fieldgroups).
	 * @param focusedField
	 */
	private setLastFocusInformation(focusedField: Field | MultiValueField | undefined): void {
		this.lastFocusId = focusedField?.getId();
		this.lastFocusFieldGroups = focusedField?.getFieldGroupIds().join(",");
	}

	/**
	 * If collaboration is enabled, send a Lock collaboration message.
	 * @param fieldpAPI
	 */
	private sendFocusInMessage(fieldpAPI: Field | MultiValueField): void {
		const collaborationPath = this.getCollaborationPath(fieldpAPI);

		if (collaborationPath) {
			this.send({ action: Activity.Lock, content: collaborationPath });
		}
	}

	/**
	 * If collaboration is enabled, send an Unlock collaboration message.
	 * @param fieldpAPI
	 */
	private sendFocusOutMessage(fieldpAPI: Field | MultiValueField | undefined): void {
		if (!fieldpAPI) {
			return;
		}
		const collaborationPath = this.getCollaborationPath(fieldpAPI);
		if (collaborationPath) {
			this.send({ action: Activity.Unlock, content: collaborationPath });
		}
	}

	/**
	 * Gets the path used to send collaboration messages.
	 * @param field
	 * @returns The path (or undefined is no valid path could be found)
	 */
	private getCollaborationPath(field: Field | MultiValueField): string | undefined {
		// Note: we send messages even if the context is inactive (empty creation rows),
		// otherwise we can't update the corresponding locks when the context is activated.
		const bindingContext = field?.getBindingContext() as Context | undefined;
		if (!bindingContext) {
			return;
		}
		if (field.isA<Field>("sap.fe.macros.Field")) {
			if (!field.getMainPropertyRelativePath()) {
				return undefined;
			}

			const fieldWrapper = field.content as FieldWrapper | undefined;
			if (
				![FieldEditMode.Editable, FieldEditMode.EditableDisplay, FieldEditMode.EditableReadOnly].includes(
					fieldWrapper?.getProperty("editMode")
				)
			) {
				// The field is not in edit mode --> no collaboration messages
				return undefined;
			}

			return `${bindingContext.getPath()}/${field.getMainPropertyRelativePath()}`;
		} else if (field.isA<MultiValueField>("sap.ui.mdc.MultiValueField")) {
			const keypath = field.getBindingInfo("items").template.getBindingPath("key");
			return `${bindingContext.getPath()}/${field.getBindingInfo("items").path}/${keypath}`;
		}
	}

	public send(message: {
		action: Activity;
		content: string | string[] | undefined;
		triggeredActionName?: string;
		refreshListBinding?: boolean;
		actionRequestedProperties?: string[];
	}): void {
		this.getCollaborativeDraftService().send(this.getView(), message);
	}

	public isConnected(): boolean {
		return this.getCollaborativeDraftService().isConnected(this.getView());
	}

	public async connect(): Promise<void> {
		return this.getCollaborativeDraftService().connect(this.getView() as FEView);
	}

	public disconnect(): void {
		return this.getCollaborativeDraftService().disconnect(this.getView() as FEView);
	}

	public isCollaborationEnabled(): boolean {
		return this.getCollaborativeDraftService().isCollaborationEnabled(this.getView());
	}

	public retainAsyncMessages(activityPaths: string | string[]): void {
		return this.getCollaborativeDraftService().retainAsyncMessages(this.getView(), activityPaths);
	}

	public releaseAsyncMessages(activityPaths: string | string[]): void {
		return this.getCollaborativeDraftService().releaseAsyncMessages(this.getView(), activityPaths);
	}

	public updateLocksForContextPath(oldContextPath: string, newContextPath: string): void {
		return this.getCollaborativeDraftService().updateLocksForContextPath(this.getView(), oldContextPath, newContextPath);
	}
}

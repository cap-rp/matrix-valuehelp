import type { Property } from "@sap-ux/vocabularies-types";
import { type EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import InlineEditIndicator from "sap/fe/controls/inlineEdit/InlineEditIndicator";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import type Field from "sap/fe/macros/Field";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type Label from "sap/m/Label";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import Popup from "sap/ui/core/Popup";
import findTabbable from "sap/ui/dom/findTabbable";
import type { default as MdcField } from "sap/ui/mdc/Field";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type FileWrapper from "../controls/FileWrapper";

enum FieldGroupIdAction {
	Add = "Add",
	Remove = "Remove"
}

export default class InlineEdit {
	private inlineEditState: "Editable" | "Display" | "Closed" | "VH" = "Closed";

	private _inlineEditIndicator: EnhanceWithUI5<InlineEditIndicator> | undefined;

	private _inlineEditIndicatorPopup: Popup | undefined;

	private _source: Element | undefined;

	private _isInlineEditSource = false;

	/**
	 * Mixin to enable inline edit on a control.
	 * @param baseClass The class.
	 */
	setupMixin(baseClass: Function): void {
		const baseBeforeRendering = baseClass.prototype.onBeforeRendering;
		const baseMetadataAvailable = baseClass.prototype.onMetadataAvailable;
		const baseDestroy = baseClass.prototype.destroy;

		baseClass.prototype.onBeforeRendering = function (): void {
			baseBeforeRendering?.call(this);
			if (this.inlineEditEnabled) {
				this.addAriaAttributes();
			}
		};

		baseClass.prototype.onMetadataAvailable = function (): void {
			baseMetadataAvailable?.call(this);
			if (this.inlineEditEnabled) {
				const propertyInlineEditEnabled = this.getPageController()?.inlineEditFlow.isPropertyConsideredForInlineEdit(
					this.getInlineEditPropertyName() ?? ""
				);
				if (!propertyInlineEditEnabled) {
					//let's make sure we don't keep a binding unnecessarily
					this.hasInlineEdit = undefined;
					return;
				}
				this._inlineEditIndicator = new InlineEditIndicator({
					visible: true,
					pressEdit: this.triggerInlineEdit.bind(this)
				});
				this._inlineEditFieldGroupId = "InlineEdit";
				this._inlineEditIndicator.attachEvent("mouseout", (event: UI5Event<{ relatedTarget: Element }>) => {
					this.closeInlineEditPopupMouseEvent(event.getParameter("relatedTarget"));
				});
				this._inlineEditIndicator.editButton.attachBrowserEvent("blur", (event: FocusEvent) => {
					// if focus is still on inline editable field the popup should not be closed
					if (!this.getDomRef()?.contains(event.relatedTarget)) {
						this.closeInlineEditPopupNoEditMode();
					}
				});
				this._inlineEditIndicator.attachEvent("pressTab", () => {
					this.pressTabKey();
				});

				this._inlineEditIndicator.attachEvent("pressShiftTab", () => {
					this.pressShiftAndTabKey(this.getContent().getContentEdit()[0]);
				});

				this._inlineEditIndicatorPopup = new Popup(this._inlineEditIndicator, false, false, false);
				const inlineEditSaveFunction = this.triggerInlineEditSave.bind(this);
				const inlineEditDiscardFunction = this.triggerInlineEditDiscard.bind(this);
				this._inlineEditIndicator.addDependent(
					new CommandExecution({
						execute: inlineEditSaveFunction,
						enabled: true,
						visible: true,
						command: "Save"
					})
				);
				this._inlineEditIndicator.addDependent(
					new CommandExecution({
						execute: inlineEditDiscardFunction,
						enabled: true,
						visible: true,
						command: "Cancel"
					})
				);
				// function to check following behaviour of popup
				this._inlineEditIndicatorPopup.setFollowOf(() => {
					this.popupBehaviour();
				});
				this.attachBrowserEvent("dblclick", this.triggerInlineEdit.bind(this));
				this.attachBrowserEvent("mouseover", this.openInlineEditPopup.bind(this));
				this.attachBrowserEvent("mouseout", (event: MouseEvent) => {
					this.closeInlineEditPopupMouseEvent(event.relatedTarget as Element);
				});
				this.attachBrowserEvent("focus", (event: FocusEvent) => {
					this.focusEvent(event, this.getContent().contentDisplay?.getDomRef());
				});

				this.attachBrowserEvent("keydown", (event: KeyboardEvent) => {
					this.keydownEvent(event, this.getContent().contentDisplay?.getDomRef());
				});

				this.attachEvent("validateFieldGroup", (_event: Control$ValidateFieldGroupEvent) => {
					const fieldGroupIds = _event.getParameter("fieldGroupIds");
					fieldGroupIds?.forEach((fieldGroupId) => {
						if (fieldGroupId === "InlineEdit") {
							this.getPageController()?.inlineEditFlow.delayedCallToSave();
						}
					});
				});
				this.attachBrowserEvent("focusin", (event: MouseEvent) => {
					// only goes into condition for currently editable fields, e.g. connected fields
					if (this.inlineEditState === "Editable" && !this._inlineEditIndicatorPopup.isOpen()) {
						this.openInlineEditPopupForFocus(event);
						this.setInlineEditFocus();
					}
				});
			}
		};

		baseClass.prototype.onDestroy = function (): void {
			this._inlineEditIndicator?.destroy();
			this._inlineEditIndicatorPopup?.destroy();
			baseDestroy?.call(this);
		};
	}

	/*
	 * Adds aria attributes to the inline edit indicator.
	 * @param this The current instance of the class.
	 */
	addAriaAttributes(this: EnhanceWithUI5<Field> & InlineEdit): void {
		if (this._inlineEditIndicator) {
			this._inlineEditIndicator.removeAllEditButtonAriaDescribedBy();
			// add the label controls of the field
			this.getLabelControls().forEach((labelControl: Label) => {
				this._inlineEditIndicator?.addEditButtonAriaDescribedBy(labelControl);
			});
			// add the field itself
			this._inlineEditIndicator.addEditButtonAriaDescribedBy(this.getIdForLabel());
		}
	}

	/**
	 * Retrieves the DOM reference of the field associated with the inline edit.
	 * @returns The DOM reference of the field or null if not found.
	 */
	getDomRefOfField(this: EnhanceWithUI5<Field> & InlineEdit): Element | null {
		const fieldWrapper = this.getContent() as FieldWrapper;
		if (fieldWrapper?.contentEdit?.length > 0 && fieldWrapper?.contentEdit[0]?.getDomRef()) {
			return fieldWrapper.contentEdit[0].getDomRef();
		} else if (fieldWrapper?.contentDisplay && fieldWrapper.contentDisplay.getDomRef()) {
			return fieldWrapper.contentDisplay.getDomRef();
		} else if (fieldWrapper?.isA("sap.fe.macros.controls.FileWrapper")) {
			return (fieldWrapper as FileWrapper).fileUploader.getDomRef();
		}
		return null;
	}

	/**
	 * Determines the behavior of the inline edit popup relative to its associated field.
	 */
	popupBehaviour(this: EnhanceWithUI5<Field> & InlineEdit): void {
		const currentField = this.getDomRefOfField();
		if (currentField) {
			// check if element is obscured by other section/element
			const overlappingElement = this.getOverlappingElement(currentField);
			// If the element is obscured by another element/section, close it and set up an interval to check every 200 ms if it remains obscured
			if (overlappingElement !== currentField && !currentField.contains(overlappingElement)) {
				this._inlineEditIndicatorPopup?.close();
				// only if it is editable, we set up the interval, otherwise we close the popup if it is obscured by another element
				if (this.inlineEditState === "Editable") {
					const popupInterval = setInterval(() => {
						this.popupIntervallHandler(currentField, popupInterval);
					}, 200);
				}
				// If the element is not blocked by another section/element, update its position to align with the element that has the Inline Edit
			} else {
				this._inlineEditIndicatorPopup?.setPosition(Popup.Dock.EndTop, Popup.Dock.EndBottom, this._source, "0 -4");
			}
		}
	}

	/**
	 * Retrieves the current element located at the lowest vertical point of the currentField.
	 * If the currentField is overlapped, it returns the overlapping element instead.
	 * @param currentField The field where the inline edit popup is opened.
	 * @returns The element determined to be at the lowest vertical point of the current field.
	 */
	getOverlappingElement(currentField: Element): Element | null {
		return document.elementFromPoint(
			currentField.getBoundingClientRect().x + currentField.getBoundingClientRect().width / 2,
			// We take a point in the middle of the field and 2/3 of the height to retrieve the overlappingElement
			currentField.getBoundingClientRect().y + 0.66 * currentField.getBoundingClientRect().height
		);
	}

	/**
	 * Interval handler for managing the interval when the popup is overlapped by an element.
	 * @param currentField The field where the inline edit popup is opened.
	 * @param popupInterval The interval constant.
	 */
	popupIntervallHandler(this: EnhanceWithUI5<Field> & InlineEdit, currentField: Element, popupInterval: NodeJS.Timeout): void {
		// Check if element is still obscured by other section/element
		const overlappedElement = this.getOverlappingElement(currentField);
		if (overlappedElement === currentField || currentField.contains(overlappedElement)) {
			// If element is visible again, open Popup
			this._inlineEditIndicatorPopup?.open(0, Popup.Dock.EndTop, Popup.Dock.EndBottom, this);
			clearInterval(popupInterval);
		}
	}

	/**
	 * Focus handler for inline edit.
	 * @param potentialFocusOut Potential focus out. Applies for Shift + Tab on field and Tab on discard button.
	 * @param focusForward If focus should be set forward or backward.
	 */
	focusHandlingInlineEdit(this: EnhanceWithUI5<Field> & InlineEdit, potentialFocusOut: boolean, focusForward?: boolean): void {
		const focusedElement = findTabbable(this.getDomRef(), {
			skipChild: true,
			forward: focusForward
		});
		focusedElement?.element.focus();
		this._inlineEditIndicatorPopup?.close();
		if (potentialFocusOut) {
			// only closes the inline edit completely if the focus is not on the same inline edit anymore
			// connected fields won't be closed if switching focus between them
			if (this._isInlineEditSource) {
				this.triggerInlineEditSave();
			}
		}
	}

	/**
	 * Sets the focus on the measure field of a field.
	 */
	focusMeasureField(this: EnhanceWithUI5<Field> & InlineEdit): void {
		const rootField = findTabbable(this.getDomRef(), {
			skipChild: false,
			forward: true
		});
		const measureField = findTabbable(rootField.element, {
			skipChild: true,
			forward: true
		});
		measureField?.element?.focus();
	}

	/**
	 * Implement focus handling for fields with measure fields when navigating via tab or shift-tab within an inline editable field.
	 * @param focusForward If focus should be set forward or backward.
	 */
	focusHandlingMeasureField(this: EnhanceWithUI5<Field> & InlineEdit, focusForward: boolean): void {
		const focusableElement = findTabbable(document.activeElement, {
			skipChild: true,
			forward: focusForward
		});
		// Check if the next/previous focusable element is within the inline edit popup
		if (this.getDomRef()?.contains(focusableElement.element)) {
			// If it is, focus on the next/previous focusable element
			focusableElement.element?.focus();
		}

		// If next element is outside of current inline editable field and focus is set forward, focus on the save button
		else if (focusForward) {
			this._inlineEditIndicator?.getSaveButton().focus();
		}
		// If focus is set backward, focus on the previous focusable element
		else {
			focusableElement.element?.focus();
		}
	}

	/**
	 * Processes keydown events for the inline edit component, handling various scenarios, like Tab or Escape.
	 * @param event The keydown event triggered within the inline edit.
	 * @param displayedField DomRef of contentDisplay of the field.
	 */
	inlineEditKeydown(this: EnhanceWithUI5<Field> & InlineEdit, event: KeyboardEvent, displayedField: HTMLElement): void {
		if (event.key === "Escape") {
			event.preventDefault();
			this.triggerInlineEditDiscard();
		} else if (event.key === "Tab" && !event.shiftKey) {
			event.preventDefault();
			this.pressTabKeyOnField(displayedField, event);
		} else if (event.key === "Tab" && event.shiftKey) {
			event.preventDefault();
			this.pressShiftTabKeyOnField(displayedField);
		} else if (event.key === "Enter") {
			event.preventDefault();
			this.triggerInlineEditSave();
		}
	}

	/**
	 * Handles the Tab key press event when focus is on the edit, save, or discard buttons.
	 */
	pressTabKey(this: EnhanceWithUI5<Field> & InlineEdit): void {
		if (this._inlineEditIndicator) {
			switch (document.activeElement) {
				case document.getElementById(this._inlineEditIndicator?.getEditButton().getId()):
					this.focusHandlingInlineEdit(false, true);
					break;
				case document.getElementById(this._inlineEditIndicator?.getSaveButton().getId()):
					this._inlineEditIndicator?.getDiscardButton().focus();
					break;
				case document.getElementById(this._inlineEditIndicator?.getDiscardButton().getId()):
					this.focusHandlingInlineEdit(true, true);
					break;
				default:
			}
		}
	}

	/**
	 * Handles the Tab key press event when focus is on the edit, save, or discard buttons.
	 * @param rootField The element with inline editing enabled.
	 */
	pressShiftAndTabKey(this: EnhanceWithUI5<Field> & InlineEdit, rootField: UI5Element): void {
		if (this._inlineEditIndicator) {
			switch (document.activeElement) {
				case document.getElementById(this._inlineEditIndicator?.getEditButton().getId()):
					this.focusHandlingInlineEdit(false, false);
					break;
				case document.getElementById(this._inlineEditIndicator?.getSaveButton().getId()):
					if (this.checkForMeasureField()) {
						this.focusMeasureField();
					} else {
						rootField.focus();
					}
					break;
				case document.getElementById(this._inlineEditIndicator?.getDiscardButton().getId()):
					this._inlineEditIndicator?.getSaveButton().focus();
					break;
				default:
			}
		}
	}

	/**
	 * Focus handler for the Tab key on the field.
	 * @param displayedField DomRef of contentDisplay of the field.
	 * @param event Current keyboard event.
	 */
	pressTabKeyOnField(this: EnhanceWithUI5<Field> & InlineEdit, displayedField: HTMLElement, event: KeyboardEvent): void {
		// Check that the focus of the field is on the contentDisplay
		if (document.activeElement === displayedField) {
			this.openInlineEditPopup(event);
			this._inlineEditIndicator?.getEditButton().focus();
		} else if (!this.checkForMeasureField()) {
			this._inlineEditIndicator?.getSaveButton().focus();
		} else {
			this.focusHandlingMeasureField(true);
		}
	}

	/**
	 * Focus handler for the Tab + Shift key on the field.
	 * @param displayedField DomRef of contentDisplay of the field.
	 */
	pressShiftTabKeyOnField(this: EnhanceWithUI5<Field> & InlineEdit, displayedField: HTMLElement): void {
		// Check that the focus of the field is on the contentDisplay
		if (document.activeElement === displayedField) {
			// focus to the previous interactive element
			this.focusHandlingInlineEdit(true, false);
		} else if (!this.checkForMeasureField()) {
			this.focusHandlingInlineEdit(true, false);
		} else {
			this.focusHandlingMeasureField(false);
		}
	}

	/**
	 * Handles the focus event for the inline edit field.
	 * @param event Focus event for the field
	 * @param displayedField DomRef of contentDisplay of the field.
	 */
	focusEvent(this: EnhanceWithUI5<Field> & InlineEdit, event: FocusEvent, displayedField: HTMLElement): void {
		if (this.hasInlineEdit) {
			event.preventDefault();
			if (this.checkForSemanticObject()) {
				// if the field has a Semantic Object, we don't want to focus on the edit button of the field
				// but onto the contentDisplay
				displayedField.focus();
			} else {
				this.openInlineEditPopup(event);
				this._inlineEditIndicator?.getEditButton().focus();
			}
		}
	}

	/**
	 * Handles the keydown event for the inline edit field.
	 * @param event Keyboard event for the field
	 * @param displayedField DomRef of contentDisplay of the field.
	 */
	keydownEvent(this: EnhanceWithUI5<Field> & InlineEdit, event: KeyboardEvent, displayedField: HTMLElement): void {
		if (
			(this.inlineEditState === "Editable" || (document.activeElement === displayedField && this.checkForSemanticObject())) &&
			this.hasInlineEdit
		) {
			this.inlineEditKeydown(event, displayedField);
		}
	}

	/**
	 * Updates the field group ids of the control to include or remove the inline edit field group id.
	 * @param action Add or Remove the id
	 */
	toggleInlineEditFieldGroupId(this: EnhanceWithUI5<Field> & InlineEdit, action: FieldGroupIdAction): void {
		const shouldAdd = action === FieldGroupIdAction.Add;
		const fieldGroupIds = new Set(this.getFieldGroupIds());

		if (shouldAdd) {
			fieldGroupIds.add("InlineEdit");
		} else {
			fieldGroupIds.delete("InlineEdit");
		}

		this.setFieldGroupIds(Array.from(fieldGroupIds));

		const childrenControls =
			(this.content?.findAggregatedObjects(true, (managedObject: ManagedObject) =>
				managedObject.isA<Control>("sap.ui.core.Control")
			) as Control[] | undefined) ?? [];

		for (const control of childrenControls) {
			const childFieldGroupIds = new Set(control.getFieldGroupIds());

			if (shouldAdd) {
				childFieldGroupIds.add("InlineEdit");
			} else {
				childFieldGroupIds.delete("InlineEdit");
			}
			control.setFieldGroupIds(Array.from(childFieldGroupIds));
		}
	}

	/**
	 * Opens the inline edit popup.
	 * @param event The event.
	 */
	openInlineEditPopup(this: EnhanceWithUI5<Field> & InlineEdit, event: Event): void {
		if (this.hasInlineEdit && this.inlineEditState !== "Editable" && this.editMode === "Display" && !this.readOnly) {
			this._inlineEditIndicatorPopup?.open(0, Popup.Dock.EndTop, Popup.Dock.EndBottom, event.currentTarget as Element);
			this._source = event.currentTarget as Element;
			this._inlineEditIndicator?.setWidth((event.currentTarget as Element)?.getBoundingClientRect().width);
		}
	}

	/**
	 * Closes the inline edit popup for mouse events.
	 * @param relatedTarget The related target.
	 */
	closeInlineEditPopupMouseEvent(this: EnhanceWithUI5<Field> & InlineEdit, relatedTarget: Element): void {
		if (
			relatedTarget &&
			!this._inlineEditIndicator?.getDomRef()?.contains(relatedTarget) &&
			!this.getDomRef()?.contains(relatedTarget)
		) {
			this.closeInlineEditPopupNoEditMode();
		}
	}

	/**
	 * Checks if the field has a measure field.
	 * @returns True if the field has a measure field, false otherwise.
	 */
	checkForMeasureField(this: EnhanceWithUI5<Field> & InlineEdit): boolean {
		const targetproperty: Property | undefined = this.getInlineEditProperty();
		return !!targetproperty?.annotations.Measures;
	}

	/**
	 * Checks if the field has a Semantic Object if clicking on it.
	 * @returns True if the field has a SemanticObject, false otherwise.
	 */
	checkForSemanticObject(this: EnhanceWithUI5<Field> & InlineEdit): boolean {
		const targetproperty: Property | undefined = this.getInlineEditProperty();
		return !!targetproperty?.annotations.Common?.SemanticObject;
	}

	/**
	 * Closes the inline edit popup for fields that are not in edit mode.
	 */
	closeInlineEditPopupNoEditMode(this: EnhanceWithUI5<Field> & InlineEdit): void {
		if (!this._inlineEditIndicator?.getEditMode()) {
			this._inlineEditIndicatorPopup?.close();
		}
	}

	/**
	 * Closes the inline edit popup for fields in edit mode.
	 */
	closeInlineEditPopupEditMode(this: EnhanceWithUI5<Field> & InlineEdit): void {
		if (this._inlineEditIndicator?.getEditMode()) {
			this._inlineEditIndicatorPopup?.close();
			this._isInlineEditSource = false;
		}
	}

	/**
	 * Opens the inline edit popup for focus handling.
	 * @param event Focusin event for the field.
	 */
	openInlineEditPopupForFocus(this: EnhanceWithUI5<Field> & InlineEdit, event: Event): void {
		this._inlineEditIndicator?.setEditMode(true);
		this._inlineEditIndicatorPopup?.open(
			0,
			Popup.Dock.EndTop,
			Popup.Dock.EndBottom,
			(event.currentTarget as Element) || this._source,
			"0 -4"
		);
		this._isInlineEditSource = true;
	}

	/**
	 * Focus handling for connected fields.
	 */
	setInlineEditFocus(this: EnhanceWithUI5<Field> & InlineEdit): void {
		this.getPageController()?.inlineEditFlow.focusHandling(this);
	}

	/**
	 * Triggers the inline edit and calls the toggleControlLocalEdit method to set the control to edit mode.
	 */
	triggerInlineEdit(this: EnhanceWithUI5<Field> & InlineEdit): void {
		if (!this.inlineEditEnabled || this.editMode !== "Display" || this.readOnly) {
			// if the field is already in edit mode do nothing
			return;
		}
		this._isInlineEditSource = true;
		this._inlineEditIndicator?.setEditMode(true);
		this._inlineEditIndicatorPopup?.setPosition(Popup.Dock.EndTop, Popup.Dock.EndBottom, this._source, "0 -4");

		const bindingContextPath = (this.getBindingContext() as Context | undefined)?.getCanonicalPath() ?? "";
		const propertyFullyQualifiedName = this.getInlineEditPropertyName();
		if (propertyFullyQualifiedName) {
			this.getPageController()?.inlineEditFlow.startInlineEdit(propertyFullyQualifiedName, bindingContextPath, this);
		}
	}

	/**
	 * Triggers the inline edit discard.
	 */
	triggerInlineEditDiscard(this: EnhanceWithUI5<Field> & InlineEdit): void {
		this.getPageController()?.inlineEditFlow.inlineEditDiscard();
	}

	/**
	 * Triggers the inline edit save.
	 * @returns The inlineEditFlow save promise.
	 */
	triggerInlineEditSave(this: EnhanceWithUI5<Field> & InlineEdit): Promise<void> | undefined {
		return this.getPageController()?.inlineEditFlow.inlineEditSave();
	}

	/**
	 * Hook to react to an inline edit start notification form the inlineEditFlow.
	 * @param inlineEditControls The fields that are currently in inline edit mode.
	 * @param propertiesForInlineEdit
	 * @param bindingContextPathForInlineEdit
	 */
	@controllerExtensionHandler("inlineEditFlow", "inlineEditStart")
	inlineEditStart(
		this: EnhanceWithUI5<Field> & InlineEdit,
		inlineEditControls: Control[],
		propertiesForInlineEdit: string[],
		bindingContextPathForInlineEdit: string
	): void {
		if (this.hasInlineEdit) {
			const bindingContextPath = (this.getBindingContext() as Context | undefined)?.getCanonicalPath() ?? "";
			const propertyFullyQualifiedName = this.getInlineEditPropertyName() ?? "";
			if (!propertiesForInlineEdit.includes(propertyFullyQualifiedName) || bindingContextPathForInlineEdit !== bindingContextPath) {
				return;
			}
			this.toggleInlineEditFieldGroupId(FieldGroupIdAction.Add);
			const uiModel = this.getModel("ui") as JSONModel;
			const path = `/${this.getId()}`;
			uiModel.setProperty(path, { isEditable: true });
			this.bindElement({ path, model: "ui" });
			//In case of connected fields, we set the focus on the element that was clicked
			if (this._isInlineEditSource) {
				setTimeout(() => {
					(this.getContent() as EnhanceWithUI5<FieldWrapper>)?.getContentEdit()[0]?.focus();
					this.invalidate();
				}, 200);
			}
			if (propertiesForInlineEdit.includes(propertyFullyQualifiedName)) {
				this.inlineEditState = "Editable";
			}
			if (!inlineEditControls.includes(this)) {
				inlineEditControls.push(this);
			}
		}
	}

	/**
	 * Reset the indicator popup.
	 */
	resetIndicatorPopup(this: EnhanceWithUI5<Field> & InlineEdit): void {
		this._inlineEditIndicatorPopup?.close();
		this._inlineEditIndicator?.setEditMode(false);
		this._isInlineEditSource = false;
	}

	/**
	 * Closes the inline edit popup after save or discard.
	 * @param refreshDescription If the description should be refreshed.
	 */
	inlineEditEnd(this: EnhanceWithUI5<Field> & InlineEdit, refreshDescription?: boolean): void {
		if (this.hasInlineEdit && this.inlineEditState === "Editable") {
			if (refreshDescription) {
				this.refreshDescriptionIfNeeded();
			}
			this.toggleInlineEditFieldGroupId(FieldGroupIdAction.Remove);
			this.unbindElement("ui");
			this.inlineEditState = "Closed";
			this.resetIndicatorPopup();
		}
	}

	/**
	 * Method to force the model refresh for the description if it may have been modified via  a binding with a $$noPatch parameter.
	 */
	refreshDescriptionIfNeeded(this: EnhanceWithUI5<Field> & InlineEdit): void {
		// when the field uses a mdc field the description is updated via the additionalValue binding
		// that has a noPatch parameter so it doesn't get reverted bya resetChanges
		if (this.isA<Field>("sap.fe.macros.Field")) {
			const content = this.content?.isA<EnhanceWithUI5<FieldWrapper>>("sap.fe.macros.controls.FieldWrapper")
				? this.content.getContentEdit()[0]
				: null;
			if (content && content.isA<MdcField>("sap.ui.mdc.Field")) {
				const descriptionPath = content.getBinding("additionalValue")?.getPath();
				if (descriptionPath) {
					(this.getBindingContext() as Context)?.requestSideEffects([descriptionPath], "$auto");
				}
			}
		}
	}
}

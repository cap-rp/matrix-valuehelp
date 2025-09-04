/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/HookSupport", "sap/fe/controls/inlineEdit/InlineEditIndicator", "sap/fe/core/controls/CommandExecution", "sap/ui/core/Popup", "sap/ui/dom/findTabbable"], function (HookSupport, InlineEditIndicator, CommandExecution, Popup, findTabbable) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  var FieldGroupIdAction = /*#__PURE__*/function (FieldGroupIdAction) {
    FieldGroupIdAction["Add"] = "Add";
    FieldGroupIdAction["Remove"] = "Remove";
    return FieldGroupIdAction;
  }(FieldGroupIdAction || {});
  let InlineEdit = (_dec = controllerExtensionHandler("inlineEditFlow", "inlineEditStart"), _class = /*#__PURE__*/function () {
    function InlineEdit() {
      this.inlineEditState = "Closed";
      this._isInlineEditSource = false;
    }
    _exports = InlineEdit;
    var _proto = InlineEdit.prototype;
    /**
     * Mixin to enable inline edit on a control.
     * @param baseClass The class.
     */
    _proto.setupMixin = function setupMixin(baseClass) {
      const baseBeforeRendering = baseClass.prototype.onBeforeRendering;
      const baseMetadataAvailable = baseClass.prototype.onMetadataAvailable;
      const baseDestroy = baseClass.prototype.destroy;
      baseClass.prototype.onBeforeRendering = function () {
        baseBeforeRendering?.call(this);
        if (this.inlineEditEnabled) {
          this.addAriaAttributes();
        }
      };
      baseClass.prototype.onMetadataAvailable = function () {
        baseMetadataAvailable?.call(this);
        if (this.inlineEditEnabled) {
          const propertyInlineEditEnabled = this.getPageController()?.inlineEditFlow.isPropertyConsideredForInlineEdit(this.getInlineEditPropertyName() ?? "");
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
          this._inlineEditIndicator.attachEvent("mouseout", event => {
            this.closeInlineEditPopupMouseEvent(event.getParameter("relatedTarget"));
          });
          this._inlineEditIndicator.editButton.attachBrowserEvent("blur", event => {
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
          this._inlineEditIndicator.addDependent(new CommandExecution({
            execute: inlineEditSaveFunction,
            enabled: true,
            visible: true,
            command: "Save"
          }));
          this._inlineEditIndicator.addDependent(new CommandExecution({
            execute: inlineEditDiscardFunction,
            enabled: true,
            visible: true,
            command: "Cancel"
          }));
          // function to check following behaviour of popup
          this._inlineEditIndicatorPopup.setFollowOf(() => {
            this.popupBehaviour();
          });
          this.attachBrowserEvent("dblclick", this.triggerInlineEdit.bind(this));
          this.attachBrowserEvent("mouseover", this.openInlineEditPopup.bind(this));
          this.attachBrowserEvent("mouseout", event => {
            this.closeInlineEditPopupMouseEvent(event.relatedTarget);
          });
          this.attachBrowserEvent("focus", event => {
            this.focusEvent(event, this.getContent().contentDisplay?.getDomRef());
          });
          this.attachBrowserEvent("keydown", event => {
            this.keydownEvent(event, this.getContent().contentDisplay?.getDomRef());
          });
          this.attachEvent("validateFieldGroup", _event => {
            const fieldGroupIds = _event.getParameter("fieldGroupIds");
            fieldGroupIds?.forEach(fieldGroupId => {
              if (fieldGroupId === "InlineEdit") {
                this.getPageController()?.inlineEditFlow.delayedCallToSave();
              }
            });
          });
          this.attachBrowserEvent("focusin", event => {
            // only goes into condition for currently editable fields, e.g. connected fields
            if (this.inlineEditState === "Editable" && !this._inlineEditIndicatorPopup.isOpen()) {
              this.openInlineEditPopupForFocus(event);
              this.setInlineEditFocus();
            }
          });
        }
      };
      baseClass.prototype.onDestroy = function () {
        this._inlineEditIndicator?.destroy();
        this._inlineEditIndicatorPopup?.destroy();
        baseDestroy?.call(this);
      };
    }

    /*
     * Adds aria attributes to the inline edit indicator.
     * @param this The current instance of the class.
     */;
    _proto.addAriaAttributes = function addAriaAttributes() {
      if (this._inlineEditIndicator) {
        this._inlineEditIndicator.removeAllEditButtonAriaDescribedBy();
        // add the label controls of the field
        this.getLabelControls().forEach(labelControl => {
          this._inlineEditIndicator?.addEditButtonAriaDescribedBy(labelControl);
        });
        // add the field itself
        this._inlineEditIndicator.addEditButtonAriaDescribedBy(this.getIdForLabel());
      }
    }

    /**
     * Retrieves the DOM reference of the field associated with the inline edit.
     * @returns The DOM reference of the field or null if not found.
     */;
    _proto.getDomRefOfField = function getDomRefOfField() {
      const fieldWrapper = this.getContent();
      if (fieldWrapper?.contentEdit?.length > 0 && fieldWrapper?.contentEdit[0]?.getDomRef()) {
        return fieldWrapper.contentEdit[0].getDomRef();
      } else if (fieldWrapper?.contentDisplay && fieldWrapper.contentDisplay.getDomRef()) {
        return fieldWrapper.contentDisplay.getDomRef();
      } else if (fieldWrapper?.isA("sap.fe.macros.controls.FileWrapper")) {
        return fieldWrapper.fileUploader.getDomRef();
      }
      return null;
    }

    /**
     * Determines the behavior of the inline edit popup relative to its associated field.
     */;
    _proto.popupBehaviour = function popupBehaviour() {
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
     */;
    _proto.getOverlappingElement = function getOverlappingElement(currentField) {
      return document.elementFromPoint(currentField.getBoundingClientRect().x + currentField.getBoundingClientRect().width / 2,
      // We take a point in the middle of the field and 2/3 of the height to retrieve the overlappingElement
      currentField.getBoundingClientRect().y + 0.66 * currentField.getBoundingClientRect().height);
    }

    /**
     * Interval handler for managing the interval when the popup is overlapped by an element.
     * @param currentField The field where the inline edit popup is opened.
     * @param popupInterval The interval constant.
     */;
    _proto.popupIntervallHandler = function popupIntervallHandler(currentField, popupInterval) {
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
     */;
    _proto.focusHandlingInlineEdit = function focusHandlingInlineEdit(potentialFocusOut, focusForward) {
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
     */;
    _proto.focusMeasureField = function focusMeasureField() {
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
     */;
    _proto.focusHandlingMeasureField = function focusHandlingMeasureField(focusForward) {
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
     */;
    _proto.inlineEditKeydown = function inlineEditKeydown(event, displayedField) {
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
     */;
    _proto.pressTabKey = function pressTabKey() {
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
     */;
    _proto.pressShiftAndTabKey = function pressShiftAndTabKey(rootField) {
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
     */;
    _proto.pressTabKeyOnField = function pressTabKeyOnField(displayedField, event) {
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
     */;
    _proto.pressShiftTabKeyOnField = function pressShiftTabKeyOnField(displayedField) {
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
     */;
    _proto.focusEvent = function focusEvent(event, displayedField) {
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
     */;
    _proto.keydownEvent = function keydownEvent(event, displayedField) {
      if ((this.inlineEditState === "Editable" || document.activeElement === displayedField && this.checkForSemanticObject()) && this.hasInlineEdit) {
        this.inlineEditKeydown(event, displayedField);
      }
    }

    /**
     * Updates the field group ids of the control to include or remove the inline edit field group id.
     * @param action Add or Remove the id
     */;
    _proto.toggleInlineEditFieldGroupId = function toggleInlineEditFieldGroupId(action) {
      const shouldAdd = action === FieldGroupIdAction.Add;
      const fieldGroupIds = new Set(this.getFieldGroupIds());
      if (shouldAdd) {
        fieldGroupIds.add("InlineEdit");
      } else {
        fieldGroupIds.delete("InlineEdit");
      }
      this.setFieldGroupIds(Array.from(fieldGroupIds));
      const childrenControls = this.content?.findAggregatedObjects(true, managedObject => managedObject.isA("sap.ui.core.Control")) ?? [];
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
     */;
    _proto.openInlineEditPopup = function openInlineEditPopup(event) {
      if (this.hasInlineEdit && this.inlineEditState !== "Editable" && this.editMode === "Display" && !this.readOnly) {
        this._inlineEditIndicatorPopup?.open(0, Popup.Dock.EndTop, Popup.Dock.EndBottom, event.currentTarget);
        this._source = event.currentTarget;
        this._inlineEditIndicator?.setWidth(event.currentTarget?.getBoundingClientRect().width);
      }
    }

    /**
     * Closes the inline edit popup for mouse events.
     * @param relatedTarget The related target.
     */;
    _proto.closeInlineEditPopupMouseEvent = function closeInlineEditPopupMouseEvent(relatedTarget) {
      if (relatedTarget && !this._inlineEditIndicator?.getDomRef()?.contains(relatedTarget) && !this.getDomRef()?.contains(relatedTarget)) {
        this.closeInlineEditPopupNoEditMode();
      }
    }

    /**
     * Checks if the field has a measure field.
     * @returns True if the field has a measure field, false otherwise.
     */;
    _proto.checkForMeasureField = function checkForMeasureField() {
      const targetproperty = this.getInlineEditProperty();
      return !!targetproperty?.annotations.Measures;
    }

    /**
     * Checks if the field has a Semantic Object if clicking on it.
     * @returns True if the field has a SemanticObject, false otherwise.
     */;
    _proto.checkForSemanticObject = function checkForSemanticObject() {
      const targetproperty = this.getInlineEditProperty();
      return !!targetproperty?.annotations.Common?.SemanticObject;
    }

    /**
     * Closes the inline edit popup for fields that are not in edit mode.
     */;
    _proto.closeInlineEditPopupNoEditMode = function closeInlineEditPopupNoEditMode() {
      if (!this._inlineEditIndicator?.getEditMode()) {
        this._inlineEditIndicatorPopup?.close();
      }
    }

    /**
     * Closes the inline edit popup for fields in edit mode.
     */;
    _proto.closeInlineEditPopupEditMode = function closeInlineEditPopupEditMode() {
      if (this._inlineEditIndicator?.getEditMode()) {
        this._inlineEditIndicatorPopup?.close();
        this._isInlineEditSource = false;
      }
    }

    /**
     * Opens the inline edit popup for focus handling.
     * @param event Focusin event for the field.
     */;
    _proto.openInlineEditPopupForFocus = function openInlineEditPopupForFocus(event) {
      this._inlineEditIndicator?.setEditMode(true);
      this._inlineEditIndicatorPopup?.open(0, Popup.Dock.EndTop, Popup.Dock.EndBottom, event.currentTarget || this._source, "0 -4");
      this._isInlineEditSource = true;
    }

    /**
     * Focus handling for connected fields.
     */;
    _proto.setInlineEditFocus = function setInlineEditFocus() {
      this.getPageController()?.inlineEditFlow.focusHandling(this);
    }

    /**
     * Triggers the inline edit and calls the toggleControlLocalEdit method to set the control to edit mode.
     */;
    _proto.triggerInlineEdit = function triggerInlineEdit() {
      if (!this.inlineEditEnabled || this.editMode !== "Display" || this.readOnly) {
        // if the field is already in edit mode do nothing
        return;
      }
      this._isInlineEditSource = true;
      this._inlineEditIndicator?.setEditMode(true);
      this._inlineEditIndicatorPopup?.setPosition(Popup.Dock.EndTop, Popup.Dock.EndBottom, this._source, "0 -4");
      const bindingContextPath = this.getBindingContext()?.getCanonicalPath() ?? "";
      const propertyFullyQualifiedName = this.getInlineEditPropertyName();
      if (propertyFullyQualifiedName) {
        this.getPageController()?.inlineEditFlow.startInlineEdit(propertyFullyQualifiedName, bindingContextPath, this);
      }
    }

    /**
     * Triggers the inline edit discard.
     */;
    _proto.triggerInlineEditDiscard = function triggerInlineEditDiscard() {
      this.getPageController()?.inlineEditFlow.inlineEditDiscard();
    }

    /**
     * Triggers the inline edit save.
     * @returns The inlineEditFlow save promise.
     */;
    _proto.triggerInlineEditSave = function triggerInlineEditSave() {
      return this.getPageController()?.inlineEditFlow.inlineEditSave();
    }

    /**
     * Hook to react to an inline edit start notification form the inlineEditFlow.
     * @param inlineEditControls The fields that are currently in inline edit mode.
     * @param propertiesForInlineEdit
     * @param bindingContextPathForInlineEdit
     */;
    _proto.inlineEditStart = function inlineEditStart(inlineEditControls, propertiesForInlineEdit, bindingContextPathForInlineEdit) {
      if (this.hasInlineEdit) {
        const bindingContextPath = this.getBindingContext()?.getCanonicalPath() ?? "";
        const propertyFullyQualifiedName = this.getInlineEditPropertyName() ?? "";
        if (!propertiesForInlineEdit.includes(propertyFullyQualifiedName) || bindingContextPathForInlineEdit !== bindingContextPath) {
          return;
        }
        this.toggleInlineEditFieldGroupId(FieldGroupIdAction.Add);
        const uiModel = this.getModel("ui");
        const path = `/${this.getId()}`;
        uiModel.setProperty(path, {
          isEditable: true
        });
        this.bindElement({
          path,
          model: "ui"
        });
        //In case of connected fields, we set the focus on the element that was clicked
        if (this._isInlineEditSource) {
          setTimeout(() => {
            this.getContent()?.getContentEdit()[0]?.focus();
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
     */;
    _proto.resetIndicatorPopup = function resetIndicatorPopup() {
      this._inlineEditIndicatorPopup?.close();
      this._inlineEditIndicator?.setEditMode(false);
      this._isInlineEditSource = false;
    }

    /**
     * Closes the inline edit popup after save or discard.
     * @param refreshDescription If the description should be refreshed.
     */;
    _proto.inlineEditEnd = function inlineEditEnd(refreshDescription) {
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
     */;
    _proto.refreshDescriptionIfNeeded = function refreshDescriptionIfNeeded() {
      // when the field uses a mdc field the description is updated via the additionalValue binding
      // that has a noPatch parameter so it doesn't get reverted bya resetChanges
      if (this.isA("sap.fe.macros.Field")) {
        const content = this.content?.isA("sap.fe.macros.controls.FieldWrapper") ? this.content.getContentEdit()[0] : null;
        if (content && content.isA("sap.ui.mdc.Field")) {
          const descriptionPath = content.getBinding("additionalValue")?.getPath();
          if (descriptionPath) {
            this.getBindingContext()?.requestSideEffects([descriptionPath], "$auto");
          }
        }
      }
    };
    return InlineEdit;
  }(), _applyDecoratedDescriptor(_class.prototype, "inlineEditStart", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "inlineEditStart"), _class.prototype), _class);
  _exports = InlineEdit;
  return _exports;
}, false);
//# sourceMappingURL=InlineEdit-dbg.js.map

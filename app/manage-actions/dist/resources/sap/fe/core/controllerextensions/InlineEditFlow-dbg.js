/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BaseControllerExtension", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/controls/inlineEditFlow/BeforeActionDialog", "sap/fe/core/controls/inlineEditFlow/BeforeNavigationDialog", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/m/MessageToast", "sap/ui/core/Lib", "sap/ui/core/Messaging", "../controls/inlineEditFlow/DraftExistsDialog"], function (Log, ClassSupport, HookSupport, CommonUtils, BaseControllerExtension, messageHandling, BeforeActionDialog, BeforeNavigationDialog, MetaModelConverter, TypeGuards, MessageToast, Lib, Messaging, DraftExistsDialog) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2;
  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var hookable = HookSupport.hookable;
  var methodOverride = ClassSupport.methodOverride;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  let InlineEditFlow = (_dec = defineUI5Class("sap.fe.core.controllerextensions.InlineEditFlow"), _dec2 = hookable("Before"), _dec3 = methodOverride("routing"), _dec4 = methodOverride("editFlow"), _dec5 = methodOverride("editFlow"), _dec6 = methodOverride("editFlow"), _dec7 = methodOverride("editFlow"), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseControllerExtens) {
    function InlineEditFlow() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseControllerExtens.call(this, ...args) || this;
      _this.inlineEditControls = [];
      return _this;
    }
    _exports = InlineEditFlow;
    _inheritsLoose(InlineEditFlow, _BaseControllerExtens);
    var _proto = InlineEditFlow.prototype;
    /**
     * Method to know if there can be inline edit on the page.
     * @returns True if inline edit is possible
     */
    _proto.isInlineEditPossible = function isInlineEditPossible() {
      return this.base.getAppComponent().getInlineEditService().doesPageHaveInlineEdit(this.base.getRoutingTargetName());
    }

    /**
     * Save the inline edit changes.
     * @returns A promise that resolved once the batch has returned.
     */;
    _proto.inlineEditSave = async function inlineEditSave() {
      const model = this.base.getView().getModel();
      const messages = Messaging.getMessageModel().getData();
      const hasTechnicalMessages = messages.some(message => !messageHandling.isNonTechnicalMessage(message));
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
      } catch (error) {
        Log.warning("Error while saving inline edit changes");
      }
    }

    /**
     * Discard the inline edit changes.
     */;
    _proto.inlineEditDiscard = function inlineEditDiscard() {
      this.base.getView().getModel().resetChanges(CommonUtils.INLINEEDIT_UPDATEGROUPID);
      this.inlineEditEnd(true);
    }

    /**
     * End the inline edit.
     * @param refreshDescription
     */;
    _proto.inlineEditEnd = function inlineEditEnd(refreshDescription) {
      Messaging.removeAllMessages();
      this.base.setShowFooter(false);
      for (const control of this.inlineEditControls) {
        control.inlineEditEnd(refreshDescription);
      }
      this.inlineEditControls = [];
      this.base.getView().getModel("ui").setProperty("/isInlineEditActive", false);
    }

    /**
     * Start the inline edit on the bindingContextPath for the propertyFullyQualifiedName.
     * @param propertyFullyQualifiedName
     * @param bindingContextPath
     * @param controlTrigger
     */;
    _proto.startInlineEdit = function startInlineEdit(propertyFullyQualifiedName, bindingContextPath, controlTrigger) {
      if (controlTrigger?.getBindingContext()?.getProperty("HasDraftEntity")) {
        // there is already a draft on the entity. We should not start inline edit
        new DraftExistsDialog(this.base.getView()).open();
        controlTrigger?.resetIndicatorPopup();
        return;
      }
      const inlineEditService = this.base.getAppComponent().getInlineEditService();
      const dependentProperties = inlineEditService.getInlineConnectedProperties(this.base.getRoutingTargetName(), propertyFullyQualifiedName);
      this.inlineEditStart([], dependentProperties?.length ? dependentProperties : [propertyFullyQualifiedName], bindingContextPath);
      this.base.getView().getModel("ui").setProperty("/isInlineEditActive", true);
    }

    /**
     * Focus handling for inline edit. When one field gets focus, all other inline edit popups, that are currently opened, should be closed.
     * @param inlineEditControl Controls which are currently in inline edit mode.
     */;
    _proto.focusHandling = function focusHandling(inlineEditControl) {
      for (const control of this.inlineEditControls) {
        if (control !== inlineEditControl) {
          control.closeInlineEditPopupEditMode();
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
     */;
    _proto.inlineEditStart = async function inlineEditStart(inlineEditControls, properties, bindingContextPath) {
      if (this.abortTimerBeforeSave) {
        // if there is  a timer to save
        this.abortTimerBeforeSave();
        this.abortTimerBeforeSave = undefined;
        await this.inlineEditSave();
      }
      const alreadyRegisteredControls = this.inlineEditControls.map(control => control.getId());
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
     */;
    _proto.isPropertyConsideredForInlineEdit = function isPropertyConsideredForInlineEdit(propertyFullyQualifiedName) {
      return this.base.getAppComponent().getInlineEditService().isPropertyConsideredForInlineEdit(this.base.getRoutingTargetName(), propertyFullyQualifiedName);
    }

    /**
     * Handles the patchSent event: handle inline edit save success or failure.
     * @param event The event sent by the binding
     */;
    _proto.handleInlineEditPatchSent = async function handleInlineEditPatchSent(event) {
      this.patchPromise = new Promise((resolve, reject) => {
        event.getSource().attachEventOnce("patchCompleted", patchCompletedEvent => {
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
     */;
    _proto.handleInlineEditSaveFailed = function handleInlineEditSaveFailed() {
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
          const messageTargetDataModelObject = targetMetaContext ? MetaModelConverter.getInvolvedDataModelObjects(targetMetaContext) : null;
          if (isProperty(messageTargetDataModelObject?.targetObject)) {
            const targetFullyQualifiedName = messageTargetDataModelObject?.targetObject?.fullyQualifiedName ?? "";
            if (this.isPropertyConsideredForInlineEdit(targetFullyQualifiedName)) {
              this.startInlineEdit(targetFullyQualifiedName, this.inlineEditBindingContextPath);
            }
          }
        }
      }
    }

    /**
     * Performs a delayedCall when you focus out of a field.
     */;
    _proto.delayedCallToSave = async function delayedCallToSave() {
      if (this.abortTimerBeforeSave || this.patchPromise) {
        // if there is already a timer running or a save in process do nothing
        return;
      }
      const timerBeforeSave = new Promise((resolve, reject) => {
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
     */;
    _proto.onBeforeNavigation = async function onBeforeNavigation() {
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
     */;
    _proto.openInlineEditBeforeNavigationDialogAndWaitForResult = async function openInlineEditBeforeNavigationDialogAndWaitForResult() {
      return new Promise(resolve => {
        new BeforeNavigationDialog(this.base.getView(), resolve).open();
      });
    }

    /**
     * Method to ensure we leave inline edit before any standard edit flowaction.
     * @returns Promise that reject and triggers save or discard if we are in inline edit
     */;
    _proto.onBeforeAnyEditFlowAction = async function onBeforeAnyEditFlowAction() {
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
     */;
    _proto.onBeforeEdit = async function onBeforeEdit() {
      return this.onBeforeAnyEditFlowAction();
    }

    /**
     * Handle before create.
     * @returns Promise that reject if cretae needs to be cancelled
     */;
    _proto.onBeforeCreate = async function onBeforeCreate() {
      return this.onBeforeAnyEditFlowAction();
    }

    /**
     * Handle before delete.
     * @returns Promise that reject if delete needs to be cancelled
     */;
    _proto.onBeforeDelete = async function onBeforeDelete() {
      return this.onBeforeAnyEditFlowAction();
    }

    /**
     * Handle before action.
     * @returns Promise that reject if delete needs to be cancelled
     */;
    _proto.onBeforeExecuteAction = async function onBeforeExecuteAction() {
      return this.onBeforeAnyEditFlowAction();
    }

    /**
     * Propagate the field group id to the message button.
     */;
    _proto.propagateInlineFieldGroupIdToMessageButton = function propagateInlineFieldGroupIdToMessageButton() {
      // we propagate the fieldgroupId to the footer and all its descendants to ensure that
      // clicking on the footer does not trigger a focusout and a save for the inline edit
      const footerControls = this.base.getFooter()?.findAggregatedObjects(true, managedObject => managedObject.isA("sap.ui.core.Control")) ?? [];
      for (const control of footerControls) {
        const childFieldGroupIds = new Set(control.getFieldGroupIds());
        childFieldGroupIds.add("InlineEdit");
        control.setFieldGroupIds(Array.from(childFieldGroupIds));
      }
    };
    return InlineEditFlow;
  }(BaseControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "inlineEditStart", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "inlineEditStart"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeNavigation", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeEdit", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeEdit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeCreate", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeCreate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeDelete", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeDelete"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeExecuteAction", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeExecuteAction"), _class2.prototype), _class2)) || _class);
  _exports = InlineEditFlow;
  return _exports;
}, false);
//# sourceMappingURL=InlineEditFlow-dbg.js.map

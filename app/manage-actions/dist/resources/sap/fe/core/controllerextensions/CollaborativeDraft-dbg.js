/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element", "../templating/UIFormatters", "./BaseControllerExtension", "./collaboration/CollaborationCommon"], function (ClassSupport, Element, UIFormatters, BaseControllerExtension, CollaborationCommon) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var Activity = CollaborationCommon.Activity;
  var FieldEditMode = UIFormatters.FieldEditMode;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let CollaborationDraft = (_dec = defineUI5Class("sap.fe.core.controllerextensions.CollaborationDraft"), _dec(_class = /*#__PURE__*/function (_BaseControllerExtens) {
    function CollaborationDraft() {
      return _BaseControllerExtens.apply(this, arguments) || this;
    }
    _exports = CollaborationDraft;
    _inheritsLoose(CollaborationDraft, _BaseControllerExtens);
    var _proto = CollaborationDraft.prototype;
    _proto.getCollaborativeDraftService = function getCollaborativeDraftService() {
      this.collaborativeDraftService = this.collaborativeDraftService ?? this.base.getAppComponent().getCollaborativeDraftService();
      return this.collaborativeDraftService;
    }

    /**
     * Callback when the focus is set in the Field or one of its children.
     * @param source
     * @param focusEvent
     */;
    _proto.handleContentFocusIn = function handleContentFocusIn(source, focusEvent) {
      // We send the event only if the focus was previously out of the Field
      if (source.isA("sap.m.Tokenizer")) {
        source = source.getParent()?.getParent();
      }
      let targetOutsideOfControlDomRef = false;
      if (focusEvent) {
        targetOutsideOfControlDomRef = !source.getDomRef()?.contains(focusEvent.relatedTarget);
      }
      if (source.isA("sap.ui.mdc.MultiValueField") || targetOutsideOfControlDomRef) {
        // We need to handle the case where the newly focused Field is different from the previous one, but they share the same fieldGroupIDs
        // (e.g. fields in different rows in the same column of a table)
        // In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
        const lastFocusId = this.getLastFocusId();
        if (lastFocusId && lastFocusId !== source.getId() && this.getLastFocusFieldGroups() === source.getFieldGroupIds().join(",")) {
          const lastFocused = Element.getElementById(lastFocusId);
          this?.sendFocusOutMessage(lastFocused);
        }
        this.setLastFocusInformation(source);
        this.sendFocusInMessage(source);
      }
    }

    /**
     * Callback when the focus is removed from the Field or one of its children.
     * @param fieldGroupEvent
     */;
    _proto.handleContentFocusOut = function handleContentFocusOut(fieldGroupEvent) {
      let control = fieldGroupEvent.getSource();
      if (control.isA("sap.m.Tokenizer")) {
        control = control.getParent()?.getParent();
      }
      if (!control.isA("sap.ui.mdc.MultiValueField")) {
        while (control && !control?.isA("sap.fe.macros.Field")) {
          control = control?.getParent();
        }
        if (!control) return;
      }
      const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds");

      // We send the event only if the validated fieldCroup corresponds to a collaboration group
      if (fieldGroupIds.some(groupId => {
        return groupId.startsWith(CollaborationFieldGroupPrefix);
      })) {
        const sourceControl = fieldGroupEvent.getSource();

        // Determine if the control that sent the event still has the focus (or one of its children).
        // This could happen e.g. if the user pressed <Enter> to validate the input.
        let currentFocusedControl = Element.getActiveElement();
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
     */;
    _proto.getLastFocusId = function getLastFocusId() {
      return this.lastFocusId;
    }

    /**
     * Gets the fieldgroups of the last focused Field (if any).
     * @returns A string containing the fieldgroups separated by ','
     */;
    _proto.getLastFocusFieldGroups = function getLastFocusFieldGroups() {
      return this.lastFocusFieldGroups;
    }

    /**
     * Stores information about the last focused Field (id and fieldgroups).
     * @param focusedField
     */;
    _proto.setLastFocusInformation = function setLastFocusInformation(focusedField) {
      this.lastFocusId = focusedField?.getId();
      this.lastFocusFieldGroups = focusedField?.getFieldGroupIds().join(",");
    }

    /**
     * If collaboration is enabled, send a Lock collaboration message.
     * @param fieldpAPI
     */;
    _proto.sendFocusInMessage = function sendFocusInMessage(fieldpAPI) {
      const collaborationPath = this.getCollaborationPath(fieldpAPI);
      if (collaborationPath) {
        this.send({
          action: Activity.Lock,
          content: collaborationPath
        });
      }
    }

    /**
     * If collaboration is enabled, send an Unlock collaboration message.
     * @param fieldpAPI
     */;
    _proto.sendFocusOutMessage = function sendFocusOutMessage(fieldpAPI) {
      if (!fieldpAPI) {
        return;
      }
      const collaborationPath = this.getCollaborationPath(fieldpAPI);
      if (collaborationPath) {
        this.send({
          action: Activity.Unlock,
          content: collaborationPath
        });
      }
    }

    /**
     * Gets the path used to send collaboration messages.
     * @param field
     * @returns The path (or undefined is no valid path could be found)
     */;
    _proto.getCollaborationPath = function getCollaborationPath(field) {
      // Note: we send messages even if the context is inactive (empty creation rows),
      // otherwise we can't update the corresponding locks when the context is activated.
      const bindingContext = field?.getBindingContext();
      if (!bindingContext) {
        return;
      }
      if (field.isA("sap.fe.macros.Field")) {
        if (!field.getMainPropertyRelativePath()) {
          return undefined;
        }
        const fieldWrapper = field.content;
        if (![FieldEditMode.Editable, FieldEditMode.EditableDisplay, FieldEditMode.EditableReadOnly].includes(fieldWrapper?.getProperty("editMode"))) {
          // The field is not in edit mode --> no collaboration messages
          return undefined;
        }
        return `${bindingContext.getPath()}/${field.getMainPropertyRelativePath()}`;
      } else if (field.isA("sap.ui.mdc.MultiValueField")) {
        const keypath = field.getBindingInfo("items").template.getBindingPath("key");
        return `${bindingContext.getPath()}/${field.getBindingInfo("items").path}/${keypath}`;
      }
    };
    _proto.send = function send(message) {
      this.getCollaborativeDraftService().send(this.getView(), message);
    };
    _proto.isConnected = function isConnected() {
      return this.getCollaborativeDraftService().isConnected(this.getView());
    };
    _proto.connect = async function connect() {
      return this.getCollaborativeDraftService().connect(this.getView());
    };
    _proto.disconnect = function disconnect() {
      return this.getCollaborativeDraftService().disconnect(this.getView());
    };
    _proto.isCollaborationEnabled = function isCollaborationEnabled() {
      return this.getCollaborativeDraftService().isCollaborationEnabled(this.getView());
    };
    _proto.retainAsyncMessages = function retainAsyncMessages(activityPaths) {
      return this.getCollaborativeDraftService().retainAsyncMessages(this.getView(), activityPaths);
    };
    _proto.releaseAsyncMessages = function releaseAsyncMessages(activityPaths) {
      return this.getCollaborativeDraftService().releaseAsyncMessages(this.getView(), activityPaths);
    };
    _proto.updateLocksForContextPath = function updateLocksForContextPath(oldContextPath, newContextPath) {
      return this.getCollaborativeDraftService().updateLocksForContextPath(this.getView(), oldContextPath, newContextPath);
    };
    return CollaborationDraft;
  }(BaseControllerExtension)) || _class);
  _exports = CollaborationDraft;
  return _exports;
}, false);
//# sourceMappingURL=CollaborativeDraft-dbg.js.map

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/ActionRuntime", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating", "sap/m/Button", "sap/m/Dialog", "sap/m/Label", "sap/ui/base/EventProvider", "sap/ui/core/CustomData", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType", "sap/ui/layout/form/SimpleForm", "sap/ui/mdc/Field", "sap/ui/mdc/ValueHelp", "sap/ui/mdc/valuehelp/Dialog", "sap/ui/mdc/valuehelp/Popover", "sap/ui/mdc/valuehelp/content/MTable", "sap/ui/model/odata/v4/AnnotationHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, ClassSupport, ActionRuntime, BusyLocker, MetaModelConverter, MetaModelFunction, ResourceModelHelper, StableIdHelper, DataModelPathHelper, FieldControlHelper, PropertyHelper, FieldHelper, ValueHelpTemplating, Button, Dialog, Label, EventProvider, CustomData, Messaging, MessageType, SimpleForm, MDCField, ValueHelp, VHDialog, Popover, MTable, AnnotationHelper, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var useCaseSensitiveFilterRequests = ValueHelpTemplating.useCaseSensitiveFilterRequests;
  var requiresValidation = ValueHelpTemplating.requiresValidation;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getRequiredPropertiesFromInsertRestrictions = MetaModelFunction.getRequiredPropertiesFromInsertRestrictions;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var or = BindingToolkit.or;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ContextUpdateDialogEventProvider = (_dec = defineUI5Class("sap.fe.core.services.RoutingServiceEventing"), _dec2 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_EventProvider) {
    function ContextUpdateDialogEventProvider() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _EventProvider.call(this, ...args) || this;
      _initializerDefineProperty(_this, "exitDialog", _descriptor, _this);
      return _this;
    }
    _inheritsLoose(ContextUpdateDialogEventProvider, _EventProvider);
    return ContextUpdateDialogEventProvider;
  }(EventProvider), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "exitDialog", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  let CreateDialog = /*#__PURE__*/function () {
    function CreateDialog(contextToUpdate, fieldNames, appComponent, mode, parentControl) {
      this.actionParameterInfos = [];
      this.eventProvider = new ContextUpdateDialogEventProvider();
      this.contextToUpdate = contextToUpdate;
      this.fieldNames = fieldNames;
      this.appComponent = appComponent;
      this.mode = mode;
      this.parentControl = parentControl;
      const model = contextToUpdate.getModel();
      this.metaModel = model.getMetaModel();
      const metaPath = this.metaModel.getMetaPath(contextToUpdate.getPath());
      this.requiredFieldNames = getRequiredPropertiesFromInsertRestrictions(metaPath, this.metaModel);
    }

    /**
     * Attaches an event handler called when the user closes the dialog (either with OK or Cancel).
     *
     * The event has an 'accept' parameter that is true (resp. false) if the user clicked on OK (resp. Cancel).
     * @param oData Payload object that will be passed to the event handler along with the event object when firing the event
     * @param fnFunction The function to be called when the event occurs
     * @param oListener Context object to call the event handler with
     */
    _exports = CreateDialog;
    var _proto = CreateDialog.prototype;
    _proto.attachExitDialog = function attachExitDialog(oData, fnFunction, oListener) {
      this.eventProvider.attachEvent("exitDialog", oData, fnFunction, oListener);
    };
    _proto.fireExitDialog = function fireExitDialog(accept) {
      this.eventProvider.fireEvent("exitDialog", {
        accept
      });
    }

    /**
     * Returns the editMode for a property.
     * @param property
     * @returns Display or Editable
     */;
    _proto.getEditMode = function getEditMode(property) {
      if (property.annotations.Common?.FieldControl) {
        const fieldControl = property.annotations.Common.FieldControl;
        return fieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly" ? "Display" : "Editable";
      } else {
        return "Editable";
      }
    }

    /**
     * Returns the popover for the VH typeahead.
     * @param fieldName
     * @param property
     * @param propertyObjectPath
     * @returns The popover
     */;
    _proto.getFieldVHTypeAhead = function getFieldVHTypeAhead(fieldName, property, propertyObjectPath) {
      return _jsx(Popover, {
        children: _jsx(MTable, {
          id: generate([fieldName, "VH", "Popover", "qualifier"]),
          caseSensitive: useCaseSensitiveFilterRequests(propertyObjectPath, propertyObjectPath.convertedTypes.entityContainer.annotations.Capabilities?.FilterFunctions ?? []),
          useAsValueHelp: !!property.annotations.Common?.ValueListWithFixedValues
        })
      });
    }

    /**
     * Returns the VH dialog for a given property.
     * @param property
     * @returns A dialog if the property has a VH, undefined otherwise
     */;
    _proto.getFieldVHDialog = function getFieldVHDialog(property) {
      if (property.annotations.Common?.ValueListWithFixedValues?.valueOf() !== true) {
        return _jsx(VHDialog, {});
      } else {
        return undefined;
      }
    }

    /**
     * Returns the VH for a given field.
     * @param fieldName
     * @param property
     * @param propertyObjectPath
     * @returns The ValueHelp control if the property has a VH, undefined otherwise
     */;
    _proto.getFieldValueHelp = function getFieldValueHelp(fieldName, property, propertyObjectPath) {
      if (!hasValueHelp(property)) {
        return undefined;
      }
      const vhDelegate = {
        name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
        payload: {
          propertyPath: getTargetObjectPath(propertyObjectPath),
          qualifiers: {},
          valueHelpQualifier: ""
        }
      };
      return _jsx(ValueHelp, {
        id: generate([fieldName, "VH"]),
        delegate: vhDelegate,
        validateInput: requiresValidation(property),
        typeahead: this.getFieldVHTypeAhead(fieldName, property, propertyObjectPath),
        dialog: this.getFieldVHDialog(property)
      });
    }

    /**
     * Returns the Form element (label + field) for a given property name.
     * @param fieldName
     * @param listObjectPath
     * @param listMetaPath
     * @returns The element
     */;
    _proto.createFormElement = function createFormElement(fieldName, listObjectPath, listMetaPath) {
      const propertyObjectPath = enhanceDataModelPath(listObjectPath, fieldName);
      const property = propertyObjectPath.targetObject;
      const propertyMetaContext = this.metaModel.createBindingContext(`${listMetaPath}/${fieldName}`);
      const propertyPlaceHolderMetaContext = this.metaModel.createBindingContext(`${listMetaPath}/${fieldName}@com.sap.vocabularies.UI.v1.Placeholder`);
      const field = _jsx(MDCField, {
        delegate: {
          name: "sap/fe/macros/field/FieldBaseDelegate",
          payload: {
            retrieveTextFromValueList: true
          }
        },
        id: generate(["CreateDialog", listObjectPath.targetEntityType.name, fieldName]),
        value: AnnotationHelper.format(propertyMetaContext.getObject(), {
          context: propertyMetaContext
        }),
        placeholder: AnnotationHelper.value(propertyPlaceHolderMetaContext.getObject(), {
          context: propertyPlaceHolderMetaContext
        }),
        width: "100%",
        required: compileExpression(or(isRequiredExpression(property), this.requiredFieldNames.includes(fieldName))),
        display: FieldHelper.getAPDialogDisplayFormat(propertyMetaContext.getObject(), {
          context: propertyMetaContext
        }),
        valueHelp: hasValueHelp(property) ? generate([fieldName, "VH"]) : undefined,
        editMode: this.getEditMode(property),
        dependents: this.getFieldValueHelp(fieldName, property, propertyObjectPath),
        customData: _jsx(CustomData, {
          value: fieldName
        }, "fieldName"),
        liveChange: this.handleLiveChange.bind(this),
        change: this.handleChange.bind(this)
      });
      this.actionParameterInfos.push({
        isMultiValue: false,
        field: field,
        value: field.getValue(),
        validationPromise: undefined,
        hasError: false,
        propertyPath: fieldName
      });
      return _jsxs(_Fragment, {
        children: [_jsx(Label, {
          text: property.annotations.Common?.Label
        }), field]
      });
    }

    /**
     * Callback when the dialog is opened. Sets the focus on the first field without opening the VH dialog.
     */;
    _proto.afterOpen = function afterOpen() {
      const firstField = this.actionParameterInfos[0].field;
      const focusInfo = firstField.getFocusInfo();
      focusInfo.targetInfo = {
        silent: true
      };
      firstField.focus(focusInfo);
    }

    /**
     * Internal method to create the Dialog control and its content.
     * @returns The dialog control
     */;
    _proto.createDialog = function createDialog() {
      const resourceModel = getResourceModel(this.appComponent);
      const metaPath = this.metaModel.getMetaPath(this.contextToUpdate.getPath());
      const metaContext = this.metaModel.createBindingContext(metaPath);
      const objectPath = getInvolvedDataModelObjects(metaContext);
      this.actionParameterInfos = [];
      const beginButtonLabel = resourceModel.getText(this.mode === "Standalone" ? "C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON_CREATE" : "C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON_CONTINUE");
      const endButton = _jsx(Button, {
        text: resourceModel.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL"),
        press: this.onCancel.bind(this)
      });
      return _jsx(Dialog, {
        id: generate(["CreateDialog", metaPath]),
        title: resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE"),
        afterOpen: () => {
          this.afterOpen();
        },
        resizable: true,
        draggable: true,
        initialFocus: endButton // The initial focus is set programmatically in afterOpen, to avoid opening the VH dialog
        ,
        children: {
          beginButton: _jsx(Button, {
            text: beginButtonLabel,
            press: this.onOK.bind(this),
            type: "Emphasized"
          }),
          endButton: endButton,
          content: _jsx(SimpleForm, {
            children: this.fieldNames.map(name => {
              return this.createFormElement(name, objectPath, metaPath);
            })
          })
        }
      });
    }

    /**
     * Sets the error state in the dialog fields that correspond to an error in the given messages.
     * @param messages
     */;
    _proto.displayErrorMessages = function displayErrorMessages(messages) {
      // Iterate over all messages and set the error state for the corresponding field
      // We cannot compare the paths directly, as the context in the dialog is a temporary one, and different from the one that is saved
      // Therefore we compare the metapaths
      const contextMetaPath = this.metaModel.getMetaPath(this.contextToUpdate.getPath());
      for (const message of messages) {
        for (const target of message.getTargets()) {
          const targetMetaPath = this.metaModel.getMetaPath(target);
          const parameterInfo = this.actionParameterInfos.find(actionParameterInfo => `${contextMetaPath}/${actionParameterInfo.propertyPath}` === targetMetaPath);
          if (parameterInfo) {
            parameterInfo.hasError = true;
            parameterInfo.field.setValueState(message.getType() || MessageType.Error);
            parameterInfo.field.setValueStateText(message.getMessage());
            const messageControlIDs = message.getControlIds();
            if (!messageControlIDs.includes(parameterInfo.field.getId())) {
              messageControlIDs.push(parameterInfo.field.getId());
            }
          }
        }
      }
    }

    /**
     * Removes the error messages for a given field.
     * @param messageControlId The ID of the field
     */;
    _proto.removeMessagesForActionParameter = function removeMessagesForActionParameter(messageControlId) {
      const allMessages = Messaging.getMessageModel().getData();
      // also remove messages assigned to inner controls, but avoid removing messages for different parameters (with name being substring of another parameter name)
      const relevantMessages = allMessages.filter(msg => msg.getControlIds().some(controlId => controlId.includes(messageControlId)));
      Messaging.removeMessages(relevantMessages);
    }

    /**
     * Callback when the user is doing some live changes in a field.
     * @param liveChangeEvent
     */;
    _proto.handleLiveChange = function handleLiveChange(liveChangeEvent) {
      const fieldId = liveChangeEvent.getSource().getId();
      this.removeMessagesForActionParameter(fieldId);
    }

    /**
     * Callback when the user has changed a field value.
     * @param changeEvent
     */;
    _proto.handleChange = async function handleChange(changeEvent) {
      const field = changeEvent.getSource();
      const actionParameterInfo = this.actionParameterInfos.find(actionParameterInfo => actionParameterInfo.field === field);
      if (actionParameterInfo !== undefined) {
        this.removeMessagesForActionParameter(field.getId());
        actionParameterInfo.validationPromise = changeEvent.getParameter("promise");
        try {
          actionParameterInfo.value = await actionParameterInfo.validationPromise;
          actionParameterInfo.hasError = false;
          actionParameterInfo.field.setValueState(MessageType.None);
        } catch (error) {
          delete actionParameterInfo.value;
          actionParameterInfo.hasError = true;
        }
      }
    }

    /**
     * Callback when the user clicked 'OK'.
     */;
    _proto.onOK = async function onOK() {
      // Validation of mandatory and value state for action parameters
      const resourceModel = getResourceModel(this.appComponent);
      if (await ActionRuntime.validateProperties(this.actionParameterInfos, resourceModel)) {
        this.fireExitDialog(true);
      }
    }

    /**
     * Callback when the use clicked 'Cancel'.
     */;
    _proto.onCancel = function onCancel() {
      this.fireExitDialog(false);
    }

    /**
     * Escape handler (called when the user typed 'Escape' to leave the dialog).
     * @param p
     * @param p.resolve
     * @param p.reject
     */;
    _proto.onEscape = function onEscape(p) {
      p.reject(); // Do not close the dialog
      this.onCancel();
    }

    /**
     * Opens the dialog.
     * @returns The internal Dialog control
     */;
    _proto.openDialog = function openDialog() {
      if (this.dialog) {
        throw new Error("Cannot open the Create dialog twice");
      }
      this.dialog = this.createDialog();
      this.dialog.setEscapeHandler(this.onEscape.bind(this));
      this.parentControl?.addDependent(this.dialog);
      this.dialog.setBindingContext(this.contextToUpdate);
      this.dialog.open();
      return this.dialog;
    }

    /**
     * Closes and destroys the dialog.
     */;
    _proto.closeDialog = function closeDialog() {
      /* When the dialog is cancelled, messages need to be removed in case the same action should be executed again */
      for (const actionParameterInfo of this.actionParameterInfos) {
        const fieldId = actionParameterInfo.field.getId();
        this.removeMessagesForActionParameter(fieldId);
      }
      if (this.dialog && BusyLocker.isLocked(this.dialog)) {
        BusyLocker.unlock(this.dialog); // To avoid an error in the console
      }
      this.dialog?.close();
      this.dialog?.destroy();
      this.dialog = undefined;
    }

    /**
     * Displays or removes a busy indicator on the dialog.
     * @param busy
     */;
    _proto.setBusy = function setBusy(busy) {
      if (!this.dialog) {
        return; // Nothing to set busy
      }
      if (busy) {
        BusyLocker.lock(this.dialog);
      } else {
        BusyLocker.unlock(this.dialog);
      }
    }

    /**
     * Is Dialog open.
     * @returns Boolean
     */;
    _proto.isOpen = function isOpen() {
      return this.dialog?.isOpen() ?? false;
    };
    return CreateDialog;
  }();
  _exports = CreateDialog;
  return _exports;
}, false);
//# sourceMappingURL=CreateDialog-dbg.js.map

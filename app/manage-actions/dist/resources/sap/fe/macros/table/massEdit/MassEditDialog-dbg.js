/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/library", "sap/m/Button", "sap/m/Dialog", "sap/m/Label", "sap/m/MessageBox", "sap/m/MessageStrip", "sap/m/MessageToast", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/util/XMLPreprocessor", "sap/ui/layout/form/Form", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement", "sap/ui/layout/form/ResponsiveGridLayout", "sap/ui/model/json/JSONModel", "./MassEditField", "./MassEditSideEffects", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Log, CommonUtils, messageHandling, ManifestSettings, PromiseKeeper, ID, FELibrary, Button, Dialog, Label, MessageBox, MessageStrip, MessageToast, Fragment, Library, XMLPreprocessor, Form, FormContainer, FormElement, ResponsiveGridLayout, JSONModel, MassEditField, MassEditSideEffects, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _exports = {};
  var OperationGroupingMode = ManifestSettings.OperationGroupingMode;
  let MassEditDialog = /*#__PURE__*/function () {
    /**
     * Constructor of the MassEdit dialog.
     * @param props Contains the following attributes
     * @param props.table The table where the changes need to be applied
     * @param props.contexts The row contexts where the changes need to be applied
     * @param props.fieldProperties The properties ot the fields
     */
    function MassEditDialog(props) {
      this.requiredDataPromise = new PromiseKeeper();
      this.updatedProperties = new Set();
      this.dialog = undefined;
      this.table = props.table;
      this.contexts = props.contexts;
      this.isAdaptation = CommonUtils.getAppComponent(this.table).isAdaptationMode();
      this.fieldProperties = props.fieldProperties;
      this.view = CommonUtils.getTargetView(this.table);
      this.transientListBinding = this.generateListBinding();
      this.bindingContext = this.transientListBinding.create({}, true);
      this.resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      this.contextsOnError = [];
      this.fieldControls = [];
    }

    /**
     * Creates the context for the dialog.
     * @returns The context.
     */
    _exports = MassEditDialog;
    var _proto = MassEditDialog.prototype;
    _proto.generateListBinding = function generateListBinding() {
      const listBinding = this.table.getRowBinding();
      const transientListBinding = this.table.getModel().bindList(listBinding.getPath(), listBinding.getContext(), [], [], {
        $$updateGroupId: "submitLater"
      });
      transientListBinding.refreshInternal = () => {
        /* */
      };
      return transientListBinding;
    }

    /**
     * Creates the dialog.
     * @returns The instance of dialog.
     */;
    _proto.create = async function create() {
      if (!this.dialog) {
        const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core");
        const applyButtonText = this.view.getViewData().converterType === "ListReport" ? this.resourceBundle.getText("C_MASS_EDIT_SAVE_BUTTON_TEXT") : coreResourceBundle.getText("C_COMMON_DIALOG_OK");
        const dialogContent = await this.createContent();
        const dialog = _jsx(Dialog, {
          "dt:designtime": "sap/fe/macros/table/massEdit/designtime/MassEdit.designtime",
          id: ID.generate([this.table.getId(), "MED_", "Dialog"]),
          contentWidth: "27rem",
          class: "sapUiContentPadding",
          horizontalScrolling: "false",
          title: this.resourceBundle.getText("C_MASS_EDIT_DIALOG_TITLE", [this.contexts.length.toString()]),
          content: dialogContent,
          escapeHandler: this.onClose.bind(this),
          beforeOpen: this.beforeOpen.bind(this),
          beginButton: _jsx(Button, {
            text: applyButtonText,
            type: "Emphasized",
            press: this.onApply.bind(this)
          }),
          endButton: _jsx(Button, {
            text: coreResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
            press: this.onClose.bind(this)
          })
        });
        this.dialog = dialog;
        // We don't want to inherit from the PageComponent for the ui model -> into this dialog, fields are editable
        dialog.setModel(new JSONModel({
          isEditable: true
        }), "ui");
        dialog.bindElement({
          path: "/",
          model: "ui"
        });
        return dialog;
      }
      return this.dialog;
    }

    /**
     * Sets the last configuration before opening the dialog:
     *  - set the runtime model
     *  - set the OdataModel
     *  - add the dialog as dependent of the table.
     * @param event The ui5 event
     */;
    _proto.beforeOpen = function beforeOpen(event) {
      const dialog = event.getSource();
      dialog.setModel(this.table.getModel());
      dialog.setBindingContext(this.bindingContext);
      this.table.addDependent(dialog);
    }

    /**
     * Closes and destroys the dialog.
     */;
    _proto.onClose = function onClose() {
      this.transientListBinding.destroy();
      if (this.dialog) {
        this.dialog.close();
        this.dialog.destroy();
      }
    }

    /**
     * Gets the promise of the required data.
     * This promise is resolved when the required data is loaded.
     * This data are used on the save workflow to determine if the new data has to be saved or not.
     * The save workflow is executed only if this promise is resolved.
     * @returns The promise of the required data.
     */;
    _proto.getRequiredDataPromise = function getRequiredDataPromise() {
      return this.requiredDataPromise;
    }

    /**
     * Manages the messages according to the contexts on error.
     */;
    _proto.manageMessage = async function manageMessage() {
      const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core");
      const controller = this.view.getController();
      const DraftStatus = FELibrary.DraftStatus;
      const internalModelContext = this.view.getBindingContext("internal");
      internalModelContext?.setProperty("getBoundMessagesForMassEdit", true);
      await controller.messageHandler.showMessages({
        onBeforeShowMessage: (messages, showMessageParameters) => {
          showMessageParameters.fnGetMessageSubtitle = messageHandling.setMessageSubtitle.bind({}, this.table, this.contexts);
          if (!this.contextsOnError.length) {
            if (this.updatedProperties.size > 0) {
              //There is at least one new value set
              controller.editFlow.setDraftStatus(DraftStatus.Saved);
              if (this.view.getViewData().converterType === "ListReport") {
                MessageToast.show(this.resourceBundle.getText("C_MASS_EDIT_SUCCESS_TOAST"));
              } else {
                MessageToast.show(this.resourceBundle.getText("C_OBJECT_PAGE_MASS_EDIT_SUCCESS_TOAST"));
              }
            } else {
              MessageToast.show(this.resourceBundle.getText("C_MASS_EDIT_NO_CHANGE"));
            }
          } else if (this.contextsOnError.length < this.contexts.length) {
            controller.editFlow.setDraftStatus(DraftStatus.Saved);
          } else if (this.contextsOnError.length === this.contexts.length) {
            controller.editFlow.setDraftStatus(DraftStatus.Clear);
          }
          if (CommonUtils.getIsEditable(controller) && !messages.some(message => !message.getTargets())) {
            showMessageParameters.showMessageBox = false;
            showMessageParameters.showMessageDialog = false;
          }
          return showMessageParameters;
        }
      });
      if (!!this.contextsOnError.length && this.contextsOnError.length < this.contexts.length) {
        const confirmButtonTxt = coreResourceBundle.getText("C_COMMON_DIALOG_OK");
        MessageBox.success(this.resourceBundle.getText("C_MASS_EDIT_CHANGES_WITH_ERROR", [this.contexts.length - this.contextsOnError.length, this.contexts.length]), {
          actions: [confirmButtonTxt],
          emphasizedAction: confirmButtonTxt
        });
      }
      internalModelContext?.setProperty("getBoundMessagesForMassEdit", false);
    }

    /**
     * Saves the relevant contexts and refreshes the associated properties.
     * @param fieldValuesInfo The information of the values for all mass edit fields.
     * @returns A Promise.
     */;
    _proto.saveChanges = async function saveChanges(fieldValuesInfo) {
      const manifestSettings = this.table.getParent().getTableDefinition().control.massEdit;
      const isIsolated = manifestSettings.operationGroupingMode === OperationGroupingMode.Isolated;
      const isolatedGroupId = "$auto.Isolated";
      const massEditSideEffects = new MassEditSideEffects(this); // Use the first line as reference context to calculate the map of side effects
      const fieldPromises = [];
      const model = this.table.getModel();
      if (isIsolated) {
        model.setContinueOnError(isolatedGroupId);
      }
      this.contexts.forEach(selectedContext => {
        const immediateSideEffects = [];
        const refreshDescriptions = [];
        for (const {
          control,
          values
        } of fieldValuesInfo.fieldControlReference) {
          let valueHasChanged = false;
          if (!control.isReadOnlyOnContext(selectedContext)) {
            const groupId = isIsolated ? isolatedGroupId : "$auto";
            for (const propertyPath in values) {
              if (selectedContext.getProperty(propertyPath) !== values[propertyPath]) {
                valueHasChanged = true;
                fieldPromises.push(selectedContext.setProperty(propertyPath, values[propertyPath], groupId).then(() => this.updatedProperties.add(propertyPath)).catch(error => {
                  this.contextsOnError.push(selectedContext);
                  Log.error("Mass Edit: Something went wrong in updating entries.", error);
                }));
                immediateSideEffects.push({
                  propertyPath,
                  groupId
                });
              }
            }
            if (valueHasChanged) {
              refreshDescriptions.push({
                control,
                groupId
              });
            }
          }
        }
        fieldPromises.push(...immediateSideEffects.map(async immediateSideEffect => massEditSideEffects.executeImmediateSideEffects(selectedContext, immediateSideEffect.propertyPath, immediateSideEffect.groupId)));
        fieldPromises.push(...refreshDescriptions.map(async refreshDescription => massEditSideEffects.refreshDescription(refreshDescription.control, selectedContext, refreshDescription.groupId)));
        if (isIsolated) {
          //Create a new ChangeSet for the next requests
          model.submitBatch(isolatedGroupId);
        }
      });
      await Promise.allSettled(fieldPromises);
      if (this.updatedProperties.size) {
        massEditSideEffects.executeDeferredSideEffects(new Set(["genericField", ...Array.from(this.updatedProperties)]));
      }
    }

    /**
     * Gets the information of the values for all mass edit fields.
     * @returns The information.
     */;
    _proto.getFieldValuesInfos = function getFieldValuesInfos() {
      const result = {
        values: {},
        fieldControlReference: []
      };
      for (const fieldControl of this.fieldControls) {
        const fieldValues = fieldControl.getFieldValues();
        result.values = {
          ...result.values,
          ...fieldValues
        };
        result.fieldControlReference.push({
          control: fieldControl,
          values: fieldValues
        });
      }
      return result;
    }

    /**
     * Updates the table fields according to the dialog entries.
     * @returns `true` if the custom save is executed, `false` otherwise.
     */;
    _proto.applyChanges = async function applyChanges() {
      await this.requiredDataPromise.promise; // We need to wait for the required data to be loaded before saving.
      //We want to skip the patch handler(specific workflow done into the EditFlow) since the patch is managed here
      this.view.getBindingContext("internal")?.setProperty("skipPatchHandlers", true);
      const fieldsValuesInfo = this.getFieldValuesInfos();
      let customSave = false;
      try {
        customSave = await this.view.getController().editFlow.customMassEditSave({
          aContexts: this.contexts,
          oUpdateData: fieldsValuesInfo.values
        });
      } catch (error) {
        Log.error("Mass Edit: Something went wrong in updating entries.", error);
      }
      if (!customSave) {
        await this.saveChanges(fieldsValuesInfo);
      }
      this.view.getBindingContext("internal")?.setProperty("skipPatchHandlers", false);
      return customSave;
    }

    /**
     * Manages the press on the Apply Button.
     * @returns A promise.
     */;
    _proto.onApply = async function onApply() {
      if (this.fieldControls.some(fieldControl => !fieldControl.isFieldValid())) {
        return;
      }
      if (!this.isAdaptation) {
        messageHandling.removeBoundTransitionMessages();
        messageHandling.removeUnboundTransitionMessages();
        const isCustomSave = await this.applyChanges();
        if (!isCustomSave) {
          this.manageMessage();
        }
      }
      this.onClose();
    }

    /**
     * Creates the dialog content.
     * @returns Promise returning instance of fragment.
     */;
    _proto.createContent = async function createContent() {
      const customFormContainer = await this.createCustomContainer();
      return _jsxs(_Fragment, {
        children: [this.getAdaptationMessage(), _jsx(Form, {
          children: {
            layout: _jsx(ResponsiveGridLayout, {
              labelSpanM: "12",
              labelSpanL: "12",
              labelSpanXL: "12"
            }),
            formContainers: _jsxs(_Fragment, {
              children: [customFormContainer, _jsx(FormContainer, {
                children: {
                  formElements: this.createFormElements()
                }
              })]
            })
          }
        })]
      });
    }

    /**
     * Gets the adaptation message.
     * @returns The message strip if the dialog is displayed in adaptation mode.
     */;
    _proto.getAdaptationMessage = function getAdaptationMessage() {
      if (this.isAdaptation) {
        return _jsx(MessageStrip, {
          text: this.resourceBundle.getText("C_MASS_EDIT_ADAPTATION_MODE")
        });
      }
      return undefined;
    }

    /**
     * Creates the custom form container according to the manifest settings.
     * @returns The custom form container.
     */;
    _proto.createCustomContainer = async function createCustomContainer() {
      const manifestSettings = this.table.getParent().getTableDefinition().control.massEdit;
      if (manifestSettings.customFragment) {
        if (manifestSettings.fromInline === true) {
          // Inline configuration from a V2 block: the fragment is a string
          if (typeof manifestSettings.customFragment === "string") {
            const resultXML = await XMLPreprocessor.process(new DOMParser().parseFromString(manifestSettings.customFragment, "text/xml").firstElementChild, {
              models: {}
            }, this.view.getController().getOwnerComponent().getPreprocessorContext());
            return await Fragment.load({
              type: "XML",
              definition: resultXML,
              controller: this.view.getController()
            });
          } else {
            // Inline configuration from a V4 block: the fragment is already a FormContainer
            return manifestSettings.customFragment.clone();
          }
        }
        return await this.view.getController().getExtensionAPI().loadFragment({
          id: "customMassEdit",
          name: manifestSettings.customFragment,
          contextPath: this.transientListBinding.getModel().getMetaModel().getMetaPath(this.transientListBinding.getResolvedPath())
        });
      }
      return undefined;
    }

    /**
     * Creates the form elements of the dialog.
     * @returns The form elements.
     */;
    _proto.createFormElements = function createFormElements() {
      return this.fieldProperties.map(this.createFormElement.bind(this));
    }

    /**
     * Creates the form elements of a Field.
     * @param fieldInfo The field properties
     * @returns The form element.
     */;
    _proto.createFormElement = function createFormElement(fieldInfo) {
      return _jsx(FormElement, {
        visible: fieldInfo.visible,
        children: {
          label: _jsx(Label, {
            text: fieldInfo.label,
            id: ID.generate(["MED_", fieldInfo.propertyInfo.key, "Label"])
          }),
          fields: this.createFields(fieldInfo)
        }
      });
    }

    /**
     * Creates the fields of the dialog.
     * @param fieldInfo The field properties
     * @returns The fields.
     */;
    _proto.createFields = function createFields(fieldInfo) {
      const metaModel = this.table.getModel().getMetaModel();
      const context = metaModel.createBindingContext(metaModel.getMetaPath(this.bindingContext.getPath()));
      const massEditField = new MassEditField(fieldInfo, context);
      this.fieldControls.push(massEditField);
      return massEditField.getControls();
    };
    return MassEditDialog;
  }();
  _exports = MassEditDialog;
  return _exports;
}, false);
//# sourceMappingURL=MassEditDialog-dbg.js.map

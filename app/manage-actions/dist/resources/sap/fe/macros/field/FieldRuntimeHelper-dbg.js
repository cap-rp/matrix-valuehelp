/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageSize", "sap/m/IllustratedMessageType", "sap/m/Label", "sap/m/MessageBox", "sap/m/ResponsivePopover", "sap/m/library", "sap/ui/Device", "sap/ui/core/Element", "sap/ui/core/IconPool", "sap/ui/util/openWindow", "../controls/FieldWrapper", "../internal/helpers/Upload"], function (Log, CommonUtils, CollaborationCommon, draft, KeepAliveHelper, ModelHelper, ResourceModelHelper, IllustratedMessage, IllustratedMessageSize, IllustratedMessageType, Label, MessageBox, ResponsivePopover, mobilelibrary, Device, Element, IconPool, openWindow, FieldWrapper, Upload) {
  "use strict";

  var showTypeMismatchDialog = Upload.showTypeMismatchDialog;
  var showFileSizeExceedDialog = Upload.showFileSizeExceedDialog;
  var setHeaderFields = Upload.setHeaderFields;
  var displayMessageForFailedUpload = Upload.displayMessageForFailedUpload;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getActivityKeyFromPath = CollaborationCommon.getActivityKeyFromPath;
  var Activity = CollaborationCommon.Activity;
  const FieldRuntimeHelper = {
    uploadPromises: {},
    creatingInactiveRow: false,
    fetchRecommendations: function (field, controller) {
      const view = CommonUtils.getTargetView(field);
      const fieldBindingContext = field.getBindingContext();
      let recommendationsContext;

      // determine recommendation context to use
      const fieldBinding = fieldBindingContext?.getBinding();
      if (fieldBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        // inside a table, use the row
        recommendationsContext = fieldBindingContext;
      } else {
        // inside a form now
        // can have 1-1 navigation property/direct property - use view context
        recommendationsContext = view.getBindingContext();
      }
      const feController = FieldRuntimeHelper.getExtensionController(controller);
      const valueHelpId = field.isA("sap.ui.mdc.Field") && field.getValueHelp();
      // update telemetry data as per user selection
      const metaPath = ModelHelper.getMetaPathForContext(field.getBindingContext());
      const propertyPath = field.data("sourcePath").replace(metaPath, "");
      const fieldPath = `${field.getBindingContext()?.getPath()}${propertyPath}`;
      const selectedValue = field.isA("sap.ui.mdc.Field") && field.getValue();
      feController.recommendations.updateTelemetryDataBasedOnUserSelection(fieldPath, selectedValue);
      if (valueHelpId && valueHelpId.includes("::TableValueHelp::")) {
        const tableId = valueHelpId.substring(0, valueHelpId.indexOf("::TableValueHelp::"));
        const table = view.byId(tableId);
        const contextIdentifier = table?.getParent()?.getIdentifierColumn();
        feController.recommendations.fetchAndApplyRecommendationsOnFieldChange(field, {
          context: recommendationsContext,
          contextIdentifier
        });
      } else {
        feController.recommendations.fetchAndApplyRecommendationsOnFieldChange(field, {
          context: recommendationsContext
        });
      }
    },
    getExtensionController: function (oController) {
      return oController.isA("sap.fe.core.ExtensionAPI") ? oController._controller : oController;
    },
    /**
     * Gets the field value and validity on a change event.
     * @param oEvent The event object passed by the change event
     * @returns Field value and validity
     */
    getFieldStateOnChange: function (oEvent) {
      let oSourceField = oEvent.getSource(),
        mFieldState;
      const _isBindingStateMessages = function (oBinding) {
        return oBinding && oBinding.getDataState() ? oBinding.getDataState().getInvalidValue() === undefined : true;
      };
      if (oSourceField.isA("sap.fe.macros.field.Field")) {
        oSourceField = oSourceField.getContent();
      }
      if (oSourceField.isA("sap.fe.macros.Field")) {
        oSourceField = oSourceField.getContent();
      }
      if (oSourceField.isA(FieldWrapper.getMetadata().getName()) && oSourceField.getEditMode() === "Editable") {
        oSourceField = oSourceField.getContentEdit()[0];
      }
      if (oSourceField.isA("sap.ui.mdc.Field")) {
        let bIsValid = oEvent.getParameter("valid") || oEvent.getParameter("isValid");
        if (bIsValid === undefined) {
          if (oSourceField.getMaxConditions() === 1) {
            const oValueBindingInfo = oSourceField.getBindingInfo("value");
            bIsValid = _isBindingStateMessages(oValueBindingInfo && oValueBindingInfo.binding);
          }
          if (oSourceField.getValue() === "" && !oSourceField.getProperty("required")) {
            bIsValid = true;
          }
        }
        mFieldState = {
          fieldValue: oSourceField.getValue(),
          validity: !!bIsValid
        };
      } else {
        // oSourceField extends from a FileUploader || Input || is a CheckBox
        const oBinding = oSourceField.getBinding("uploadUrl") || oSourceField.getBinding("value") || oSourceField.getBinding("selected");
        mFieldState = {
          fieldValue: oBinding && oBinding.getValue(),
          validity: _isBindingStateMessages(oBinding)
        };
      }
      return {
        field: oSourceField,
        state: mFieldState
      };
    },
    /**
     * Handles the press event for a link.
     * @param oEvent The press event
     * @returns The pressed link
     */
    pressLink: async function (oEvent) {
      const oSource = oEvent.getSource();
      let sapmLink = oSource.isA("sap.m.ObjectIdentifier") ? oSource.findElements(false, elem => {
        return elem.isA("sap.m.Link");
      })[0] : oSource;
      if (oSource?.isA("sap.fe.macros.controls.TextLink")) {
        //when the link is inside a TextLink control, the dependent will be on the TextLink
        sapmLink = oSource.getContent();
      }
      if (oSource.getDependents() && oSource.getDependents().length > 0 && sapmLink.getProperty("text") !== "") {
        const oFieldInfo = oSource.getDependents()[0];
        if (oFieldInfo && oFieldInfo.isA("sap.ui.mdc.Link")) {
          await FieldRuntimeHelper.openLink(oFieldInfo, sapmLink);
        }
      }
      return sapmLink;
    },
    openLink: async function (mdcLink, sapmLink) {
      try {
        const hRef = await mdcLink.getTriggerHref();
        if (!hRef) {
          try {
            await mdcLink._useDelegateItems();
            const linkItems = await mdcLink.retrieveLinkItems();
            if (linkItems?.length === 0 && mdcLink.getPayload().hasQuickViewFacets === "false") {
              const popover = FieldRuntimeHelper.createPopoverWithNoTargets(mdcLink);
              mdcLink.addDependent(popover);
              popover.openBy(sapmLink);
            } else {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              await mdcLink.open(sapmLink);
            }
          } catch (error) {
            Log.error(`Cannot retrieve the QuickView Popover dialog: ${error}`);
          }
        } else {
          const view = CommonUtils.getTargetView(sapmLink);
          const appComponent = CommonUtils.getAppComponent(view);
          const shellService = appComponent.getShellServices();
          const shellHash = shellService.parseShellHash(hRef);
          const navArgs = {
            target: {
              semanticObject: shellHash.semanticObject,
              action: shellHash.action
            },
            params: shellHash.params
          };
          KeepAliveHelper.storeControlRefreshStrategyForHash(view, shellHash);
          if (CommonUtils.isStickyEditMode(sapmLink) !== true) {
            //URL params and xappState has been generated earlier hence using navigate
            await shellService.navigate(navArgs, appComponent);
          } else {
            try {
              const newHref = await shellService.hrefForExternal(navArgs, appComponent);
              openWindow(newHref);
            } catch (error) {
              Log.error(`Error while retireving hrefForExternal : ${error}`);
            }
          }
        }
      } catch (error) {
        Log.error(`Error triggering link Href: ${error}`);
      }
    },
    createPopoverWithNoTargets: function (mdcLink) {
      const mdcLinkId = mdcLink.getId();
      const illustratedMessageSettings = {
        title: getResourceModel(mdcLink).getText("M_ILLUSTRATEDMESSAGE_TITLE"),
        description: getResourceModel(mdcLink).getText("M_ILLUSTRATEDMESSAGE_DESCRIPTION"),
        enableFormattedText: true,
        illustrationSize: IllustratedMessageSize.ExtraSmall,
        illustrationType: IllustratedMessageType.NoData
      };
      const illustratedMessage = new IllustratedMessage(`${mdcLinkId}-illustratedmessage`, illustratedMessageSettings);
      const popoverSettings = {
        horizontalScrolling: false,
        showHeader: Device.system.phone,
        placement: mobilelibrary.PlacementType.Auto,
        content: [illustratedMessage],
        afterClose: function (event) {
          if (event.getSource()) {
            event.getSource().destroy();
          }
        }
      };
      return new ResponsivePopover(`${mdcLinkId}-popover`, popoverSettings);
    },
    /**
     * Handles the type mismatch event for a file uploader.
     *
     * Displays a dialog to inform the user about the type mismatch.
     * @param event The event object containing details about the type mismatch
     */
    handleTypeMissmatch: function (event) {
      const fileUploader = event.getSource();
      const givenType = event.getParameter("mimeType");
      const acceptedTypes = fileUploader.getMimeType();
      if (givenType) {
        showTypeMismatchDialog(fileUploader, givenType, acceptedTypes);
      }
    },
    /**
     * Handles the file size exceed event for a file uploader.
     *
     * Displays a dialog to inform the user about the file size exceed.
     * @param event The event object containing details about the file size exceed
     */
    handleFileSizeExceed: function (event) {
      const fileUploader = event.getSource();
      showFileSizeExceedDialog(fileUploader, fileUploader.getMaximumFileSize().toFixed(3));
    },
    /**
     * Handles the upload complete event for a file uploader.
     *
     * Displays a message for a failed upload and resolves or rejects the upload promise.
     * @param event The event object containing details about the upload
     * @param propertyFileName The property name for the file name
     * @param propertyPath The property path for the file
     * @param controller The page controller
     */
    handleUploadComplete: function (event, propertyFileName, propertyPath, controller) {
      const status = Number(event.getParameter("status")),
        fileUploader = event.getSource(),
        fileWrapper = fileUploader.getParent(),
        field = fileWrapper.getParent();
      fileWrapper.setUIBusy(false);
      const context = fileUploader.getBindingContext();
      if (status === 0 || status >= 400) {
        const error = event.getParameter("responseRaw") || event.getParameter("response");
        displayMessageForFailedUpload(fileUploader, error);
        FieldRuntimeHelper.uploadPromises[fileUploader.getId()].reject();
      } else {
        const newETag = event.getParameter("headers")?.etag;
        if (newETag) {
          // set new etag for filename update, but without sending patch request
          context?.setProperty("@odata.etag", newETag, null);
        }

        // set filename for link text
        if (propertyFileName?.path) {
          context?.setProperty(propertyFileName.path, fileUploader.getValue());
        }

        // delete the avatar cache that not gets updated otherwise
        fileWrapper.avatar?.refreshAvatarCacheBusting();
        FieldRuntimeHelper._callSideEffectsForStream(event, fileWrapper, controller);
        this.uploadPromises[fileUploader.getId()].resolve();
        field?.fireEvent("change", event);
      }
      delete this.uploadPromises[fileUploader.getId()];

      // Collaboration Draft Activity Sync
      const isCollaborationEnabled = controller.collaborativeDraft?.isConnected();
      if (!isCollaborationEnabled || !context) {
        return;
      }
      const notificationData = [`${context.getPath()}/${propertyPath}`];
      if (propertyFileName?.path) {
        notificationData.push(`${context.getPath()}/${propertyFileName.path}`);
      }
      let binding = context.getBinding();
      if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        const oView = CommonUtils.getTargetView(fileUploader);
        binding = oView.getBindingContext().getBinding();
      }
      if (binding.hasPendingChanges()) {
        binding.attachEventOnce("patchCompleted", () => {
          controller.collaborativeDraft.send({
            action: Activity.Change,
            content: notificationData
          });
          controller.collaborativeDraft.send({
            action: Activity.Unlock,
            content: notificationData
          });
        });
      } else {
        controller.collaborativeDraft.send({
          action: Activity.Change,
          content: notificationData
        });
        controller.collaborativeDraft.send({
          action: Activity.Unlock,
          content: notificationData
        });
      }
    },
    /**
     * Removes a stream from a file property.
     *
     * Sets the property to null and then undefined to recreate the upload URL.
     * Handles collaboration draft activity sync if enabled.
     * @param event The change event object
     * @param  propertyFileName The property name for the file name.
     * @param propertyPath The property path for the file.
     * @param controller The page controller.
     */
    removeStream: function (event, propertyFileName, propertyPath, controller) {
      const deleteButton = event.getSource();
      const fileWrapper = deleteButton.getParent();
      const context = fileWrapper.getBindingContext();
      const field = fileWrapper.getParent();

      // streams are removed by assigning the null value
      context.setProperty(propertyPath, null);
      // When setting the property to null, the uploadUrl (@@MODEL.format) is set to "" by the model
      //	with that another upload is not possible before refreshing the page
      // (refreshing the page would recreate the URL)
      //	This is the workaround:
      //	We set the property to undefined only on the frontend which will recreate the uploadUrl
      context.setProperty(propertyPath, undefined, null);
      FieldRuntimeHelper._callSideEffectsForStream(event, fileWrapper, controller);

      // Collaboration Draft Activity Sync
      const bCollaborationEnabled = controller.collaborativeDraft?.isConnected();
      if (bCollaborationEnabled) {
        let binding = context.getBinding();
        if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          const oView = CommonUtils.getTargetView(deleteButton);
          binding = oView.getBindingContext().getBinding();
        }
        const data = [`${context.getPath()}/${propertyPath}`];
        if (propertyFileName?.path) {
          data.push(`${context.getPath()}/${propertyFileName.path}`);
        }
        controller.collaborativeDraft.send({
          action: Activity.Lock,
          content: data
        });
        binding.attachEventOnce("patchCompleted", function () {
          controller.collaborativeDraft.send({
            action: Activity.Change,
            content: data
          });
          controller.collaborativeDraft.send({
            action: Activity.Unlock,
            content: data
          });
        });
      }
      field?.fireEvent("change", event);
    },
    _callSideEffectsForStream: function (oEvent, oControl, oController) {
      const oFEController = FieldRuntimeHelper.getExtensionController(oController);
      if (oControl && oControl.getBindingContext().isTransient()) {
        return;
      }
      if (oControl) {
        oEvent.oSource = oControl;
      }
      oFEController._sideEffects.handleFieldChange(oEvent, FieldRuntimeHelper.getFieldStateOnChange(oEvent).state["validity"]);
    },
    /**
     * Uploads a stream using the file uploader.
     *
     * Sets the upload URL, synchronizes the upload with other requests, and handles collaboration draft activity sync if enabled.
     * @param controller The page controller.
     * @param event The change event object of the file uploader.
     */
    uploadStream: function (controller, event) {
      const fileUploader = event.getSource(),
        FEController = FieldRuntimeHelper.getExtensionController(controller),
        fileWrapper = fileUploader.getParent(),
        uploadUrl = fileWrapper.getUploadUrl();
      if (uploadUrl !== "") {
        fileWrapper.setUIBusy(true);

        // use uploadUrl from FileWrapper which returns a canonical URL
        fileUploader.setUploadUrl(uploadUrl);

        // set the request header for the upload
        const files = event.getParameter("files");
        // there is only one file as we allow selecting only one
        const fileType = files && files[0].type;
        setHeaderFields(fileUploader, fileType);

        // synchronize upload with other requests
        const uploadPromise = new Promise((resolve, reject) => {
          this.uploadPromises = this.uploadPromises || {};
          this.uploadPromises[fileUploader.getId()] = {
            resolve: resolve,
            reject: reject
          };
          fileUploader.upload();
        });
        FEController.editFlow.syncTask(uploadPromise);
      } else {
        MessageBox.error(getResourceModel(controller).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT"));
      }
    },
    /**
     * Handler when a FileUpload dialog is opened.
     * @param event
     */
    handleOpenUploader: function (event) {
      const fileUploader = event.getSource();
      FieldRuntimeHelper._sendCollaborationMessageForFileUploader(fileUploader, Activity.Lock);
    },
    /**
     * Method to send collaboration messages from a FileUploader.
     * @param fileUploader
     * @param action
     */
    _sendCollaborationMessageForFileUploader(fileUploader, action) {
      const view = CommonUtils.getTargetView(fileUploader);
      const collaborativeDraft = view.getController().collaborativeDraft;
      if (collaborativeDraft.isConnected()) {
        const bindingPath = fileUploader.getParent()?.getProperty("propertyPath");
        const fullPath = `${fileUploader.getBindingContext()?.getPath()}/${bindingPath}`;
        collaborativeDraft.send({
          action,
          content: fullPath
        });
      }
    },
    /**
     * Handler when a FileUpload dialog is closed.
     * @param event
     */
    handleCloseUploader: function (event) {
      const fileUploader = event.getSource();
      FieldRuntimeHelper._sendCollaborationMessageForFileUploader(fileUploader, Activity.Unlock);
    },
    /**
     * Opens an external link in the same tab.
     *
     * This function retrieves the URL from the link's data and opens it in the same tab.
     * @param event The event object containing details about the link click.
     */
    openExternalLink: function (event) {
      const source = event.getSource();
      if (source.data("url") && source.getProperty("text") !== "") {
        // This opens the link in the same tab as the link. It was done to be more consistent with other type of links.
        openWindow(source.data("url"), "_self");
      }
    },
    /**
     * Retrieves the icon for a given MIME type.
     *
     * This function uses the `IconPool` to get the appropriate icon for the specified MIME type.
     * @param mimeType The MIME type for which the icon is to be retrieved
     * @returns The icon corresponding to the given MIME type
     */
    getIconForMimeType: function (mimeType) {
      return IconPool.getIconForMimeType(mimeType);
    },
    /**
     * Triggers an internal navigation on the link pertaining to DataFieldWithNavigationPath.
     * @param source Source of the press event
     * @param controller Instance of the controller
     * @param navPath The navigation path
     */
    onDataFieldWithNavigationPath: async function (source, controller, navPath) {
      if (controller._routing) {
        const bindingContext = source.getBindingContext();
        const view = CommonUtils.getTargetView(source),
          metaModel = bindingContext.getModel().getMetaModel();
        const viewData = view.getViewData();
        const draftRootPath = ModelHelper.getDraftRootPath(bindingContext) ?? bindingContext.getPath();
        let urlNavigation = await controller._routing.getHashForNavigation(bindingContext, navPath);
        const navigateFn = () => {
          controller.getAppComponent().getRouterProxy().navToHash(urlNavigation, true, false, false, !ModelHelper.isStickySessionSupported(bindingContext.getModel().getMetaModel()));
        };

        // To know if we're navigating on the same OP Entity
        if (!urlNavigation?.startsWith("/")) {
          urlNavigation = `/${urlNavigation}`;
        }
        const sameOPNavigation = urlNavigation.startsWith(draftRootPath);

        // Show draft loss confirmation dialog in case of Object page
        if (viewData.converterType === "ObjectPage" && !ModelHelper.isStickySessionSupported(metaModel) && !sameOPNavigation) {
          draft.processDataLossOrDraftDiscardConfirmation(navigateFn, Function.prototype, bindingContext, view.getController(), true, draft.NavigationType.ForwardNavigation);
        } else {
          navigateFn();
        }
      } else {
        Log.error("FieldRuntime: No routing listener controller extension found. Internal navigation aborted.", "sap.fe.macros.field.FieldRuntime", "onDataFieldWithNavigationPath");
      }
    },
    /**
     * Event handler to create and show who is editing the field popover.
     * @param source The avatar which is next to the field locked
     * @param view Current view
     */
    showCollaborationEditUser: function (source, view) {
      const resourceModel = ResourceModelHelper.getResourceModel(view);
      let popover = Element.getElementById(`manageCollaborationDraft--editUser`);
      if (!popover) {
        popover = new ResponsivePopover("manageCollaborationDraft--editUser", {
          showHeader: false,
          placement: "Bottom"
        });
        popover.addStyleClass("sapUiContentPadding");
        view.addDependent(popover);
      }
      const bindingPath = source.getBinding("initials")?.getBindings().find(binding => binding?.getPath()?.startsWith("/collaboration/activities")).getPath();
      const activities = source.getBindingContext("internal")?.getObject(bindingPath);
      let editingActivity;
      if (activities && activities.length > 0) {
        editingActivity = activities.find(activity => {
          return activity.key === getActivityKeyFromPath(source.getBindingContext().getPath());
        });
      }
      popover.destroyContent();
      popover.addContent(new Label({
        text: resourceModel.getText("C_COLLABORATIONAVATAR_USER_EDIT_FIELD", [`${editingActivity?.name}`])
      }));
      popover.openBy(source);
    }
  };
  return FieldRuntimeHelper;
}, false);
//# sourceMappingURL=FieldRuntimeHelper-dbg.js.map

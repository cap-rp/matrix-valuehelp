/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/EditState", "sap/fe/core/helpers/ModelHelper", "../../controls/DataLossOrDraftDiscard/DraftDataLossDialog", "../../controls/Recommendations/ConfirmRecommendationDialog"], function (Log, CommonUtils, EditState, ModelHelper, DraftDataLossDialog, ConfirmRecommendationDialog) {
  "use strict";

  var RecommendationDialogDecision = ConfirmRecommendationDialog.RecommendationDialogDecision;
  /* Enum for navigation types */
  var NavigationType = /*#__PURE__*/function (NavigationType) {
    NavigationType["BackNavigation"] = "BackNavigation";
    NavigationType["ForwardNavigation"] = "ForwardNavigation";
    return NavigationType;
  }(NavigationType || {});
  /* Enum types for the data loss dialog options */
  var DraftDataLossOptions = /*#__PURE__*/function (DraftDataLossOptions) {
    DraftDataLossOptions["Save"] = "draftDataLossOptionSave";
    DraftDataLossOptions["Keep"] = "draftDataLossOptionKeep";
    DraftDataLossOptions["Discard"] = "draftDataLossOptionDiscard";
    return DraftDataLossOptions;
  }(DraftDataLossOptions || {});
  /*Create the data loss dialog*/
  const dataLossDialog = new DraftDataLossDialog("fe::DraftDataLossPopup");

  /**
   * The method checks whether an optional parameter in the manifest is set to silently keep the draft in case a forward navigation is triggered.
   * @param pageController The reference to the current PageController instance
   * @returns Boolean value with true or false to silently keep the draft
   */
  function silentlyKeepDraftOnForwardNavigation(pageController) {
    const oManifest = pageController.getAppComponent().getManifestEntry("sap.fe");
    return oManifest?.app?.silentlyKeepDraftOnForwardNavigation || false;
  }

  /**
   * Logic to process the FCL mode.
   * @param draftAdminData Admin data
   * @param fnCancelFunction The cancel function
   * @param oController The current controller referenced
   * @param processFunctionForDrafts The function to process the handler
   * @param bSkipBindingToView The optional parameter to skip the binding to the view
   * @param context The context to be used for the draft operation
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   * @returns Nothing
   */
  async function processFclMode(draftAdminData, fnCancelFunction, oController, processFunctionForDrafts, bSkipBindingToView, context, hiddenDraft) {
    // The application is running in FCL mode so in this case we fall back to
    // the old logic since the dirty state handling is not properly working
    // for FCL.
    if (draftAdminData.CreationDateTime === draftAdminData.LastChangeDateTime && !oController.editFlow.isDocumentModified()) {
      processFunctionForDrafts();
    } else {
      return dataLossDialog.open(oController).then(selectedKey => draftDataLossPopup.handleDialogSelection(selectedKey, processFunctionForDrafts, fnCancelFunction, oController, bSkipBindingToView, context, hiddenDraft));
    }
  }

  /**
   * Logic to process the mode with no active entity.
   * @param draftAdminData Admin data
   * @param fnCancelFunction The cancel function
   * @param oController The current controller referenced
   * @param processFunctionForDrafts The function to process the handler
   * @param navigationType The navigation type for which the function should be called
   * @param bSilentlyKeepDraftOnForwardNavigation The parameter to determine whether to skip the popup appearance in forward case
   * @param bSkipBindingToView The optional parameter to skip the binding to the view
   * @param context The context to be used for the draft operations
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   * @returns Nothing
   */
  async function processNoActiveEntityMode(draftAdminData, fnCancelFunction, oController, processFunctionForDrafts, navigationType, bSilentlyKeepDraftOnForwardNavigation, bSkipBindingToView, context, hiddenDraft) {
    // There is no active entity so, we are editing either newly created data or
    // a draft which has never been saved to active version
    // Since we want to react differently in the two situations, we have to check the
    // dirty state
    if (EditState.isEditStateDirty()) {
      if (draftAdminData.CreationDateTime === draftAdminData.LastChangeDateTime && !oController.editFlow.isDocumentModified() && navigationType === NavigationType.BackNavigation) {
        // in case we have untouched changes for the draft and a "back"
        // navigation we can silently discard the draft again
        // eslint-disable-next-line promise/no-nesting
        try {
          await draftDataLossPopup.discardDraft(oController, bSkipBindingToView, context);
          processFunctionForDrafts();
        } catch (error) {
          Log.error("Error while canceling the document", error);
        }
      } else if (navigationType === NavigationType.ForwardNavigation && bSilentlyKeepDraftOnForwardNavigation) {
        // In case we have a "forward navigation" and an additional parameter set in the manifest
        // we "silently" keep the draft
        processFunctionForDrafts();
      } else {
        // In this case data is being changed or a forward navigation is triggered
        // and, we always want to show the data loss dialog on navigation
        return dataLossDialog.open(oController).then(selectedKey => draftDataLossPopup.handleDialogSelection(selectedKey, processFunctionForDrafts, fnCancelFunction, oController, bSkipBindingToView, context, hiddenDraft));
      }
    } else {
      // We are editing a draft which has been created earlier but never saved to active
      // version and since the edit state is not dirty, there have been no user changes
      // so in this case we want to silently navigate and do nothing
      processFunctionForDrafts();
    }
  }

  /**
   * Logic to process the draft editing for existing entity.
   * @param oController The current controller referenced.
   * @param oContext The context of the current call
   * @param processFunctionForDrafts The function to process the handler
   * @param navigationType The navigation type for which the function should be called
   */
  async function processEditingDraftForExistingEntity(oController, oContext, processFunctionForDrafts, navigationType) {
    // We are editing a draft for an existing active entity
    // The CreationDateTime and LastChangeDateTime are equal, so this draft was
    // never saved before, hence we're currently editing a newly created draft for
    // an existing active entity for the first time.
    // Also, there have so far been no changes made to the draft and in this
    // case we want to silently navigate and delete the draft in case of a back
    // navigation but in case of a forward navigation we want to silently keep it!
    if (navigationType === NavigationType.BackNavigation) {
      const mParameters = {
        skipDiscardPopover: true,
        skipBindingToView: true
      };
      try {
        await oController.editFlow.cancelDocument(oContext, mParameters);
        processFunctionForDrafts();
      } catch (error) {
        Log.error("Error while canceling the document", error);
      }
    } else {
      // In case of a forward navigation we silently keep the draft and only
      // execute the followup function.
      processFunctionForDrafts();
    }
  }

  /**
   * Logic to process the context when the edit state is in dirty mode.
   * @param oController The current controller referenced.
   * @param fnCancelFunction The cancel function
   * @param processFunctionForDrafts The function to process the handler
   * @param navigationType The navigation type for which the function should be called
   * @param bSilentlyKeepDraftOnForwardNavigation The parameter to determine whether to skip the popup appearance in forward case
   * @param bSkipBindingToView The optional parameter to skip the binding to the view.
   * @param context The context to be used for the draft operations
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   * @returns Nothing
   */
  async function processEditStateDirty(oController, fnCancelFunction, processFunctionForDrafts, navigationType, bSilentlyKeepDraftOnForwardNavigation, bSkipBindingToView, context, hiddenDraft) {
    if (navigationType === NavigationType.ForwardNavigation && bSilentlyKeepDraftOnForwardNavigation) {
      // In case we have a "forward navigation" and an additional parameter set in the manifest
      // we "silently" keep the draft
      processFunctionForDrafts();
    } else {
      // The CreationDateTime and LastChangeDateTime are NOT equal, so we are currently editing
      // an existing draft and need to distinguish depending on if any changes
      // have been made in the current editing session or not
      // Changes have been made in the current editing session, so we want
      // to show the data loss dialog and let the user decide
      return dataLossDialog.open(oController).then(selectedKey => draftDataLossPopup.handleDialogSelection(selectedKey, processFunctionForDrafts, fnCancelFunction, oController, bSkipBindingToView, context, hiddenDraft));
    }
  }

  /**
   * Logic to process the admin data.
   * @param draftAdminData Admin data
   * @param fnProcessFunction The function to process the handler
   * @param fnCancelFunction The cancel function
   * @param context Context
   * @param oController The current controller referenced
   * @param bSkipBindingToView The optional parameter to skip the binding to the view
   * @param navigationType The navigation type for which the function should be called
   * @param hasActiveEntity Boolean value which mentions if root context has active entity or not
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   * @returns Nothing
   */
  async function processDraftAdminData(draftAdminData, fnProcessFunction, fnCancelFunction, context, oController, bSkipBindingToView) {
    let navigationType = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : NavigationType.BackNavigation;
    let hasActiveEntity = arguments.length > 7 ? arguments[7] : undefined;
    let hiddenDraft = arguments.length > 8 ? arguments[8] : undefined;
    const collaborationConnected = oController.collaborativeDraft.isConnected();
    const processFunctionForDrafts = !collaborationConnected ? fnProcessFunction : function () {
      oController.collaborativeDraft.disconnect();
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      fnProcessFunction.apply(null, ...args);
    };
    const bSilentlyKeepDraftOnForwardNavigation = silentlyKeepDraftOnForwardNavigation(oController);
    if (draftAdminData) {
      if (oController.getAppComponent().getRootViewController().isFclEnabled()) {
        await processFclMode(draftAdminData, fnCancelFunction, oController, processFunctionForDrafts, bSkipBindingToView, context, hiddenDraft);
      } else if (!hasActiveEntity) {
        processNoActiveEntityMode(draftAdminData, fnCancelFunction, oController, processFunctionForDrafts, navigationType, bSilentlyKeepDraftOnForwardNavigation, bSkipBindingToView, undefined, hiddenDraft);
      } else if (draftAdminData.CreationDateTime === draftAdminData.LastChangeDateTime && (!hiddenDraft || hiddenDraft && !oController.editFlow.isDocumentModified())) {
        processEditingDraftForExistingEntity(oController, context, processFunctionForDrafts, navigationType);
      } else if (EditState.isEditStateDirty()) {
        processEditStateDirty(oController, fnCancelFunction, processFunctionForDrafts, navigationType, bSilentlyKeepDraftOnForwardNavigation, bSkipBindingToView, context, hiddenDraft);
      } else {
        // The user started editing the existing draft but did not make any changes
        // in the current editing session, so in this case we do not want
        // to show the data loss dialog but just keep the draft
        processFunctionForDrafts();
      }
    } else {
      fnProcessFunction();
    }
  }

  /**
   * The general handler in which the individual steps are called.
   * @param fnProcessFunction
   * @param fnCancelFunction
   * @param oContext
   * @param oController
   * @param bSkipBindingToView
   * @param navigationType
   * @param alwaysShowInHiddenDraft
   */
  async function processDataLossOrDraftDiscardConfirmation(fnProcessFunction, fnCancelFunction, oContext, oController, bSkipBindingToView) {
    let navigationType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : NavigationType.BackNavigation;
    let alwaysShowInHiddenDraft = arguments.length > 6 ? arguments[6] : undefined;
    const oView = oController.getView();
    const oModel = oView.getBindingContext().getModel();
    const oMetaModel = oModel.getMetaModel();
    const viewData = oView.getViewData();
    const contextPath = viewData.contextPath || (viewData.entitySet ? `/${viewData.entitySet}` : undefined);
    const isDraftRoot = contextPath ? !!oMetaModel.getObject(`${contextPath}@com.sap.vocabularies.Common.v1.DraftRoot`) : false;
    const bIsEditable = CommonUtils.getIsEditable(oView);
    const originalContext = oContext;
    let draftRootPath = oContext.getPath();
    if (!isDraftRoot) {
      draftRootPath = ModelHelper.getDraftRootPath(oContext) ?? draftRootPath;
      oContext = oModel.bindContext(draftRootPath, undefined, {
        $expand: "DraftAdministrativeData"
      }).getBoundContext();
    }
    const hiddenDraft = oController.getAppComponent().getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
    // Shouldn't display data loss popover on shell back navigation from sub-object pages (unless there's no page before in the history because of deep linking)
    // or when object page is in display mode, or when the object is deleted
    const backNavShowsDialog = isDraftRoot || oController.getAppComponent().getRouterProxy().checkIfBackExitsApp() || hiddenDraft && alwaysShowInHiddenDraft;
    if (originalContext.isDeleted() || !backNavShowsDialog && navigationType === NavigationType.BackNavigation || !bIsEditable) {
      fnProcessFunction();
    } else {
      try {
        // The following 3 properties are needed to determine the state of the draft, so we ensure they are loaded
        await oContext.requestProperty(["DraftAdministrativeData/CreationDateTime", "DraftAdministrativeData/LastChangeDateTime", "HasActiveEntity"]);
        const draftAdminData = oContext.getObject("DraftAdministrativeData");
        await processDraftAdminData(draftAdminData, fnProcessFunction, fnCancelFunction, hiddenDraft ? originalContext : oContext, oController, bSkipBindingToView, navigationType, oContext.getProperty("HasActiveEntity"), hiddenDraft);
      } catch (oError) {
        Log.error("Cannot retrieve draftDataContext information", oError);
        fnProcessFunction();
      }
    }
  }

  /**
   * Saves the document. If the controller is of type ObjectPage, then internal _saveDocument is called, otherwise saveDocument
   * from EditFlow is called.
   * @param controller Controller of the current view
   * @param context The context to be used for the draft operations
   * @param skipBindingToView The parameter to skip the binding to the view
   * @returns A promise resolved if the save was successful
   */
  async function saveDocument(controller, context, skipBindingToView) {
    const hasInitialContext = context !== undefined;
    context = context ?? controller.getView().getBindingContext();
    if (!hasInitialContext && controller.isA("sap.fe.templates.ObjectPage.ObjectPageController")) {
      return controller._saveDocument(skipBindingToView);
    } else {
      return controller.editFlow.saveDocument(context, {
        skipBindingToView
      });
    }
  }

  /**
   * Discards the draft.
   * @param controller Controller of the current view
   * @param skipBindingToView The parameter to skip the binding to the view
   * @param context The context to be used for the draft operations
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   * @returns A promise resolved if cancelDocument was successful
   */
  async function discardDraft(controller, skipBindingToView, context, hiddenDraft) {
    context = context ?? controller.getView().getBindingContext();
    const params = {
      skipBackNavigation: hiddenDraft && !context.getProperty("HasActiveEntity") ? false : true,
      skipDiscardPopover: true,
      skipBindingToView: skipBindingToView !== undefined ? skipBindingToView : true
    };
    return controller.editFlow.cancelDocument(context, params);
  }

  /**
   * Executes the follow-up functions after an option was selected in the data loss dialog.
   * @param selectedKey The key of the selected option from the data loss dialog
   * @param processFunctionForDrafts The function to process the handler
   * @param fnCancelFunction The function to process the handler
   * @param controller Controller of the current view
   * @param skipBindingToView The parameter to skip the binding to the view
   * @param context The context to be used for the binding
   * @param hiddenDraft Boolean value which mentions if hidden draft is enabled or not
   */
  function handleDialogSelection(selectedKey, processFunctionForDrafts, fnCancelFunction, controller, skipBindingToView, context, hiddenDraft) {
    switch (selectedKey) {
      case DraftDataLossOptions.Save:
        draftDataLossPopup.saveDocument(controller, context, skipBindingToView).then(savedContext => processFunctionForDrafts(savedContext)).catch(function (error) {
          if (error === RecommendationDialogDecision.Continue) {
            return fnCancelFunction();
          }
          Log.error("Error while saving document", error);
        });
        dataLossDialog.close();
        break;
      case DraftDataLossOptions.Keep:
        processFunctionForDrafts();
        dataLossDialog.close();
        break;
      case DraftDataLossOptions.Discard:
        draftDataLossPopup.discardDraft(controller, skipBindingToView, context, hiddenDraft).then(discardedDraft => processFunctionForDrafts(discardedDraft)).catch(function (error) {
          Log.error("Error while discarding draft", error);
        });
        dataLossDialog.close();
        break;
      default:
        fnCancelFunction();
        dataLossDialog.close();
    }
  }
  const draftDataLossPopup = {
    processDataLossOrDraftDiscardConfirmation: processDataLossOrDraftDiscardConfirmation,
    silentlyKeepDraftOnForwardNavigation: silentlyKeepDraftOnForwardNavigation,
    NavigationType: NavigationType,
    processFclMode: processFclMode,
    processNoActiveEntityMode: processNoActiveEntityMode,
    processEditingDraftForExistingEntity: processEditingDraftForExistingEntity,
    processEditStateDirty: processEditStateDirty,
    handleDialogSelection: handleDialogSelection,
    saveDocument: saveDocument,
    discardDraft: discardDraft
  };
  return draftDataLossPopup;
}, false);
//# sourceMappingURL=draftDataLossPopup-dbg.js.map

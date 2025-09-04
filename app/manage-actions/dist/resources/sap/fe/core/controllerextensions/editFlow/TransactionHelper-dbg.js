/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/UIProvider", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/controllerextensions/editFlow/editFlowConstants", "sap/fe/core/controllerextensions/editFlow/operations", "sap/fe/core/controllerextensions/editFlow/sticky", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/ToES6Promise", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/library", "sap/m/Button", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast", "sap/m/Popover", "sap/m/Text", "sap/m/VBox", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType", "../../ActionRuntime", "./operations/Operation", "./operations/actionHelper"], function (Log, CommonUtils, UIProvider, BusyLocker, draft, UiModelConstants, operations, sticky, messageHandling, MetaModelConverter, DataField, deleteHelper, FPMHelper, MetaModelFunction, ModelHelper, PromiseKeeper, toES6Promise, TypeGuards, FELibrary, Button, Dialog, MessageBox, MessageToast, Popover, Text, VBox, Library, Messaging, MessageType, ActionRuntime, Operation, actionHelper) {
  "use strict";

  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var getCreatePopupFields = MetaModelFunction.getCreatePopupFields;
  var isDataFieldForAction = DataField.isDataFieldForAction;
  var convertTypes = MetaModelConverter.convertTypes;
  var getCoreUIFactory = UIProvider.getCoreUIFactory;
  const CreationMode = FELibrary.CreationMode;
  const ProgrammingModel = FELibrary.ProgrammingModel;

  //Enums for delete text calculations for delete confirm dialog.
  const DeleteOptionTypes = deleteHelper.DeleteOptionTypes;
  const DeleteDialogContentControl = deleteHelper.DeleteDialogContentControl;

  /* Make sure that the mParameters is not the oEvent */
  function getParameters(mParameters) {
    if (mParameters && mParameters.getMetadata && mParameters.getMetadata().getName() === "sap.ui.base.Event") {
      mParameters = {};
    }
    return mParameters || {};
  }
  let TransactionHelper = /*#__PURE__*/function () {
    function TransactionHelper() {}
    var _proto = TransactionHelper.prototype;
    _proto.busyLock = function busyLock(appComponent, busyPath) {
      BusyLocker.lock(appComponent.getModel("ui"), busyPath);
    };
    _proto.busyUnlock = function busyUnlock(appComponent, busyPath) {
      BusyLocker.unlock(appComponent.getModel("ui"), busyPath);
    };
    _proto.getProgrammingModel = function getProgrammingModel(source) {
      let path;
      if (source.isA("sap.ui.model.odata.v4.Context")) {
        path = source.getPath();
      } else {
        path = (source.isRelative() ? source.getResolvedPath() : source.getPath()) ?? "";
      }
      const metaModel = source.getModel()?.getMetaModel();
      if (metaModel && ModelHelper.isDraftSupported(metaModel, path)) {
        return ProgrammingModel.Draft;
      } else if (metaModel && ModelHelper.isStickySessionSupported(metaModel)) {
        return ProgrammingModel.Sticky;
      } else {
        return ProgrammingModel.NonDraft;
      }
    }

    /**
     * Validates a document.
     * @param oContext Context of the document to be validated
     * @param [mParameters] Can contain the following attributes:
     * @param [mParameters.data] A map of data that should be validated
     * @param [mParameters.customValidationFunction] A string representing the path to the validation function
     * @param oView Contains the object of the current view
     * @returns Promise resolves with result of the custom validation function
     * @final
     */;
    _proto.validateDocument = async function validateDocument(oContext, mParameters, oView) {
      const sCustomValidationFunction = mParameters && mParameters.customValidationFunction;
      if (sCustomValidationFunction) {
        const sModule = sCustomValidationFunction.substring(0, sCustomValidationFunction.lastIndexOf(".") || -1).replace(/\./gi, "/"),
          sFunctionName = sCustomValidationFunction.substring(sCustomValidationFunction.lastIndexOf(".") + 1, sCustomValidationFunction.length),
          mData = mParameters.data;
        delete mData["@$ui5.context.isTransient"];
        return FPMHelper.validationWrapper(sModule, sFunctionName, mData, oView, oContext);
      }
      return Promise.resolve([]);
    }

    /**
     * Retrieves defatul values from the DefaultValue function.
     * @param listBinding The list binding to be used for creation
     * @returns A promise with an object containing the default values (or undefined if there's no default value function)
     */;
    _proto.getDataFromDefaultValueFunction = async function getDataFromDefaultValueFunction(listBinding) {
      const model = listBinding.getModel();
      const metaModel = model.getMetaModel();
      const metaContext = metaModel.getMetaContext(listBinding.getResolvedPath());
      const listBindingObjectPath = MetaModelConverter.getInvolvedDataModelObjects(metaContext);
      const defaultFuncOnTargetObject = listBindingObjectPath.targetObject.annotations.Common?.DefaultValuesFunction;
      const defaultFuncOnTargetEntitySet = listBindingObjectPath.targetEntitySet?.annotations.Common?.DefaultValuesFunction;
      const defaultFunctionName = defaultFuncOnTargetObject ?? defaultFuncOnTargetEntitySet;
      if (!defaultFunctionName) {
        // No default value function
        return undefined;
      }
      const functionOnNavProp = isNavigationProperty(listBindingObjectPath.targetObject) && defaultFuncOnTargetObject !== undefined;
      const defaultFunctionContext = functionOnNavProp ? listBinding.getContext() : listBinding.getHeaderContext();
      if (!defaultFunctionContext) {
        return undefined;
      }
      const defaultFunctionPath = `${metaModel.getMetaPath(defaultFunctionContext.getPath())}/${defaultFunctionName}`;
      const defaultFunctionObjectPath = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getMetaContext(defaultFunctionPath));
      const defaultFunctionResult = defaultFunctionObjectPath.targetObject?.isBound ? await operations.callBoundFunction(defaultFunctionName.toString(), defaultFunctionContext, model) : await operations.callFunctionImport(defaultFunctionName.toString(), model);
      return defaultFunctionResult.getObject();
    }

    /**
     * Checks if a list binding corresponds to a hierarchy.
     * @param listBinding
     * @returns True if the list binding is hierarchical.
     */;
    _proto.isListBindingHierarchical = function isListBindingHierarchical(listBinding) {
      return listBinding.getAggregation()?.hierarchyQualifier ? true : false;
    }

    /**
     * Checks if the given list binding is analytical.
     * @param listBinding The list binding to check
     * @returns TRUE if the list binding is analytical, `false` otherwise.
     */;
    _proto.isListBindingAnalytical = function isListBindingAnalytical(listBinding) {
      const aggregation = listBinding.getAggregation();
      return aggregation !== undefined && !aggregation.hierarchyQualifier;
    }

    /**
     * Creates a new context in a list binding. Handles both flat and hierarchical cases.
     * @param listBinding
     * @param initialData Initial data to create the context.
     * @param options Creation options.
     * @param options.createAtEnd Create the context at the end of the list (ignored in case of a hierarchy).
     * @param options.createInactive Create the context as inactive (ignored in case of a hierarchy).
     * @param options.parentContext Create the context as a	 child of this context (ony used in case of a hierarchy).
     * @returns The created context.
     */;
    _proto.createContext = async function createContext(listBinding, initialData, options) {
      const dataForCreation = initialData ?? {};
      if (this.isListBindingHierarchical(listBinding)) {
        let listBindingForCreation;
        if (options.parentContext?.isExpanded() === false) {
          // If the parent context already has children and is collapsed, we expand it first
          await listBinding.expand(options.parentContext);
        }
        if (listBinding.isRelative()) {
          Object.assign(dataForCreation, {
            "@$ui5.node.parent": options.parentContext
          });
          listBindingForCreation = listBinding;
        } else {
          // Absolute binding: creation from the ListReport
          // We use a temporary flat listBinding for the creation, to avoid adding the new context in the table (we don't want to display it until it's saved)
          const model = listBinding.getModel();
          const metaModel = model.getMetaModel();
          listBindingForCreation = model.bindList(listBinding.getPath(), undefined, undefined, undefined, {
            $$groupId: listBinding.getGroupId(),
            $$updateGroupId: listBinding.getUpdateGroupId()
          });

          // Add the parent path in the initial data if a parent is provided
          if (options.parentContext) {
            const objectPath = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getMetaContext(listBinding.getPath()));
            const hierarchyQualifier = listBinding.getAggregation().hierarchyQualifier;
            const parentNavigation = objectPath.targetEntityType.annotations.Aggregation?.[`RecursiveHierarchy#${hierarchyQualifier}`]?.ParentNavigationProperty.value;
            if (!parentNavigation) {
              throw new Error(`Cannot find parent navigation property for ${listBinding.getPath()}`);
            }
            const parentBindingData = {};
            parentBindingData[`${parentNavigation}@odata.bind`] = options.parentContext.getPath().replace(/^\//, ""); // Remove leading "/" from the path
            Object.assign(dataForCreation, parentBindingData);
          }
        }
        return listBindingForCreation.create(dataForCreation, true);
      } else if (this.isListBindingAnalytical(listBinding)) {
        if (listBinding.isRelative()) {
          throw new Error("Creating a new document in a analytical table is supported only in a ListReport");
        } else {
          // We use a temporary flat listBinding for the creation, to avoid adding the new context in the table (we don't want to display it until it's saved)
          const model = listBinding.getModel();
          const listBindingForCreation = model.bindList(listBinding.getPath(), undefined, undefined, undefined, {
            $$groupId: listBinding.getGroupId(),
            $$updateGroupId: listBinding.getUpdateGroupId()
          });
          return listBindingForCreation.create(dataForCreation, true);
        }
      } else {
        return listBinding.create(dataForCreation, true, options.createAtEnd, options.createInactive);
      }
    };
    _proto.getCreationParameters = function getCreationParameters(listBinding, createData, appComponent) {
      const metaModel = listBinding.getModel().getMetaModel();
      const metaPath = metaModel.getMetaPath(listBinding.getHeaderContext().getPath());
      const nonComputedVisibleFields = getCreatePopupFields(metaModel, metaPath, appComponent);
      // Do not consider fields for which we provide some initial data
      return nonComputedVisibleFields.filter(fieldName => {
        return !(fieldName in (createData ?? {}));
      });
    }

    /**
     * Creates a new document.
     * @param mainListBinding OData V4 ListBinding object
     * @param [inParameters] Optional, can contain the following attributes:
     * @param [inParameters.data] A map of data that should be sent within the POST
     * @param [inParameters.busyMode] Global (default), Local, None TODO: to be refactored
     * @param [inParameters.busyId] ID of the local busy indicator
     * @param [inParameters.keepTransientContextOnFailed] If set, the context stays in the list if the POST failed and POST will be repeated with the next change
     * @param [inParameters.inactive] If set, the context is set as inactive for empty rows
     * @param [inParameters.skipParameterDialog] Skips the action parameter dialog
     * @param appComponent The app component
     * @param resourceModel The resource model
     * @param messageHandler The message handler extension
     * @param fromCopyPaste True if the creation has been triggered by a paste action
     * @returns Promise resolves with new binding context
     * @final
     */;
    _proto.createDocument = async function createDocument(mainListBinding, inParameters, appComponent, resourceModel, messageHandler, fromCopyPaste) {
      let newDocumentContext;
      const parameters = getParameters(inParameters);
      if (!mainListBinding) {
        throw new Error("Binding required for new document creation");
      }
      const programmingModel = this.getProgrammingModel(mainListBinding);
      if (programmingModel !== ProgrammingModel.Draft && programmingModel !== ProgrammingModel.Sticky) {
        throw new Error("Create document only allowed for draft or sticky session supported services");
      }
      const busyPath = this.getBusyPath(parameters);
      parameters.beforeCreateCallBack = fromCopyPaste ? undefined : parameters.beforeCreateCallBack;
      if (!inParameters?.inactive) {
        this.busyLock(appComponent, busyPath);
      }
      const messageHandlingKey = messageHandler.registerToHoldMessages();
      try {
        newDocumentContext = await this.performCreation(mainListBinding, parameters, appComponent, messageHandler, resourceModel, fromCopyPaste);
        await messageHandler.showMessageDialog({
          control: parameters.parentControl,
          unHoldKey: messageHandlingKey
        });
        return newDocumentContext;
      } catch (error) {
        // TODO: currently, the only errors handled here are raised as string - should be changed to Error objects
        await messageHandler.showMessageDialog({
          control: parameters.parentControl,
          unHoldKey: messageHandlingKey
        });
        if ((error === FELibrary.Constants.ActionExecutionFailed || error === FELibrary.Constants.CancelActionDialog) && newDocumentContext?.isTransient()) {
          // This is a workaround suggested by model as Context.delete results in an error
          // TODO: remove the $direct once model resolves this issue
          // this line shows the expected console error Uncaught (in promise) Error: Request canceled: POST Travel; group: submitLater
          newDocumentContext.delete("$direct");
        }
        throw error;
      } finally {
        if (!inParameters?.inactive) {
          this.busyUnlock(appComponent, busyPath);
        }
      }
    };
    _proto.getBusyPath = function getBusyPath(mParameters) {
      return mParameters.busyMode === "Local" ? `/busyLocal/${mParameters.busyId}` : "/busy";
    }

    /**
     * Creates a new document.
     * @param mainListBinding OData V4 ListBinding object.
     * @param parameters Contains the following attributes
     * @param parameters.data A map of data that should be sent within the POST
     * @param parameters.busyMode Global (default), Local, None
     * @param parameters.busyId ID of the local busy indicator
     * @param parameters.keepTransientContextOnFailed If set, the context stays in the list if the POST failed and POST will be repeated with the next change
     * @param parameters.parentControl
     * @param parameters.inactive If set, the context is set as inactive for empty rows
     * @param parameters.beforeCreateCallBack Callback to be called before the creation
     * @param parameters.skipParameterDialog Skips the action parameter dialog
     * @param parameters.createAtEnd Create the context at the end of the list (ignored in case of a hierarchy).
     * @param parameters.createInactive Create the context as inactive (ignored in case of a hierarchy).
     * @param parameters.parentContext Create the context as a child of this context (only used in case of a hierarchy).
     * @returns Promise resolves with new binding context
     */;
    _proto.createDocumentContext = async function createDocumentContext(mainListBinding, parameters) {
      if (parameters.beforeCreateCallBack) {
        //beforeCreateCallBack expects createParameters of type any[]
        const createParameters = parameters.data ? Object.entries(parameters.data).map(_ref => {
          let [key, value] = _ref;
          return {
            [key]: value
          };
        }) : [];
        try {
          await toES6Promise(parameters.beforeCreateCallBack({
            contextPath: mainListBinding && mainListBinding.getPath(),
            createParameters: createParameters
          }));
        } catch (error) {
          Log.error(error);
          throw FELibrary.Constants.OnBeforeCreateFailed;
        }
        parameters.data = createParameters.reduce((result, currentObject) => {
          return {
            ...result,
            ...currentObject
          };
        }, {});
      }
      const createPromise = this.createContext(mainListBinding, parameters.data, {
        createAtEnd: !!parameters.createAtEnd,
        createInactive: !!parameters.inactive,
        parentContext: parameters.parentContext
      });
      if (mainListBinding.getUpdateGroupId() === CommonUtils.INLINEEDIT_UPDATEGROUPID) {
        mainListBinding.getModel().submitBatch(CommonUtils.INLINEEDIT_UPDATEGROUPID);
      }
      return createPromise;
    }

    /**
     * Creates a new document either via new Action or standard POST create.
     * @param mainListBinding OData V4 ListBinding object
     * @param parameters Contains the following attributes
     * @param parameters.data A map of data that should be sent within the POST
     * @param parameters.busyMode Global (default), Local, None
     * @param parameters.busyId ID of the local busy indicator
     * @param parameters.keepTransientContextOnFailed If set, the context stays in the list if the POST failed and POST will be repeated with the next change
     * @param parameters.parentControl
     * @param parameters.inactive If set, the context is set as inactive for empty rows
     * @param parameters.beforeCreateCallBack Callback to be called before the creation
     * @param parameters.skipParameterDialog Skips the action parameter dialog
     * @param parameters.createAtEnd Create the context at the end of the list (ignored in case of a hierarchy).
     * @param parameters.createInactive Create the context as inactive (ignored in case of a hierarchy).
     * @param parameters.parentContext Create the context as a child of this context (only used in case of a hierarchy).
     * @param appComponent The app component
     * @param messageHandler The message handler extension
     * @param resourceModel
     * @param fromCopyPaste True if the creation has been triggered by a paste action
     * @returns Promise resolves with new binding context
     */;
    _proto.performCreation = async function performCreation(mainListBinding, parameters, appComponent, messageHandler, resourceModel, fromCopyPaste) {
      const metaModel = mainListBinding.getModel().getMetaModel();
      const metaPath = metaModel.getMetaPath(mainListBinding.getHeaderContext().getPath());
      const createHash = appComponent.getRouterProxy().getHash();
      const componentData = appComponent.getComponentData();
      const startupParameters = componentData?.startupParameters ?? {};
      const newAction = !mainListBinding.isRelative() ? this._getNewAction(startupParameters, createHash, metaModel, metaPath) : undefined;
      if (newAction) {
        const result = await this.performCreationWithAction(newAction, mainListBinding, parameters, appComponent, resourceModel, messageHandler);
        if (result.status === "rejected") {
          throw result.reason;
        }
        return result.value.returnedContext;
      } else {
        return this.performCreationWithPOST(mainListBinding, parameters, appComponent, resourceModel, messageHandler, fromCopyPaste);
      }
    }

    /**
     * Creates a document with an action.
     * @param actionName
     * @param mainListBinding
     * @param parameters
     * @param appComponent
     * @param resourceModel
     * @param messageHandler
     * @returns The created context.
     */;
    _proto.performCreationWithAction = async function performCreationWithAction(actionName, mainListBinding, parameters, appComponent, resourceModel, messageHandler) {
      const headerContextPath = mainListBinding.getHeaderContext().getPath();
      const metaModel = mainListBinding.getModel().getMetaModel();
      const metaPath = metaModel.getMetaPath(headerContextPath);
      const messagesPath = ModelHelper.getMessagesPath(metaModel, metaPath);
      const bindingParameters = {
        $$patchWithoutSideEffects: true,
        $$updateGroupId: "$auto"
      };
      const selectedProperties = [];
      if (messagesPath) {
        selectedProperties.push(messagesPath);
      }
      if (this.getProgrammingModel(mainListBinding) === ProgrammingModel.Draft) {
        selectedProperties.push("IsActiveEntity", "HasDraftEntity", "HasActiveEntity"); // Needed for our internal logic (e.g. navigation)
      }
      if (selectedProperties.length > 0) {
        bindingParameters["$select"] = selectedProperties.join(",");
      }
      const result = await this.callAction(actionName, {
        contexts: mainListBinding.getHeaderContext(),
        showActionParameterDialog: true,
        label: this._getSpecificCreateActionDialogLabel(metaModel, metaPath, actionName, resourceModel),
        bindingParameters: bindingParameters,
        view: parameters.parentControl,
        isCreateAction: true,
        skipParameterDialog: parameters.skipParameterDialog
      }, appComponent, messageHandler);
      return result[0];
    }

    /**
     * Creates a docuemnt with a standard POST request.
     * @param mainListBinding
     * @param parameters
     * @param appComponent
     * @param resourceModel
     * @param messageHandler
     * @param fromCopyPaste
     * @returns The created context.
     */;
    _proto.performCreationWithPOST = async function performCreationWithPOST(mainListBinding, parameters, appComponent, resourceModel, messageHandler, fromCopyPaste) {
      try {
        let newDocumentContext;
        const initialData = parameters.data;
        if (!fromCopyPaste) {
          const defaultValueFunctionData = await this.getDataFromDefaultValueFunction(mainListBinding);
          parameters.data = Object.assign({}, defaultValueFunctionData, parameters.data);
        }
        if (parameters.data) {
          delete parameters.data["@odata.context"];
        }
        const canHaveDialog = parameters.creationMode !== CreationMode.CreationRow && parameters.creationMode !== CreationMode.Inline;
        const creationDialogFields = canHaveDialog ? this.getCreationParameters(mainListBinding, initialData, appComponent) : [];
        if (parameters.creationMode === CreationMode.CreationDialog) {
          parameters.creationDialogFields?.forEach(fieldName => {
            if (!creationDialogFields.includes(fieldName)) {
              creationDialogFields.push(fieldName);
            }
          });
          if (creationDialogFields.length === 0) {
            // In CreationDialog mode, the dialog is mandatory
            throw new Error("No fields available for the creation dialog");
          }
        }
        if (creationDialogFields.length > 0) {
          newDocumentContext = await this.createWithDialog(mainListBinding, creationDialogFields, parameters, appComponent, resourceModel, messageHandler);
        } else {
          newDocumentContext = await this.createDocumentContext(mainListBinding, parameters);
          if (!parameters.inactive) {
            await this.waitForCreateCompletion(newDocumentContext, parameters.keepTransientContextOnFailed === true);
          }
        }
        return newDocumentContext;
      } catch (error) {
        const msg = error.message ?? error;
        Log.error("Error while creating the new document", msg);
        throw msg;
      }
    };
    _proto._isDraftEnabled = function _isDraftEnabled(vContexts) {
      const contextForDraftModel = vContexts[0];
      const sProgrammingModel = this.getProgrammingModel(contextForDraftModel);
      return sProgrammingModel === ProgrammingModel.Draft;
    }

    /**
     * Delete one or multiple document(s).
     * @param contexts Contexts Either one context or an array with contexts to be deleted
     * @param mParameters Optional, can contain the following attributes:
     * @param mParameters.title Title of the object to be deleted
     * @param mParameters.description Description of the object to be deleted
     * @param mParameters.numberOfSelectedContexts Number of objects selected
     * @param mParameters.noDialog To disable the confirmation dialog
     * @param appComponent The appComponent
     * @param resourceModel The resource model to load text resources
     * @param messageHandler The message handler extension
     * @returns A Promise resolved once the documents are deleted
     */;
    _proto.deleteDocument = async function deleteDocument(contexts, mParameters, appComponent, resourceModel, messageHandler) {
      // delete document lock
      this.busyLock(appComponent);
      const contextsToDelete = Array.isArray(contexts) ? [...contexts] : [contexts];
      const firstContext = (mParameters.selectedContexts ?? contextsToDelete)[0];
      return new Promise((resolve, reject) => {
        try {
          const draftEnabled = this._isDraftEnabled(mParameters.selectedContexts || contextsToDelete);
          const items = [];
          let options = [];
          let unSavedContext;
          // items(texts) and options(checkBoxes and single default option) for confirm dialog.
          if (mParameters) {
            mParameters = getParameters(mParameters);
            mParameters.entitySetName = this.getCollectionNameFromContext(firstContext);
            if (!mParameters.numberOfSelectedContexts) {
              // non-Table
              if (draftEnabled) {
                // Check if 1 of the drafts is locked by another user
                const lockedContext = contextsToDelete.find(context => {
                  const contextData = context.getObject();
                  return contextData.IsActiveEntity === true && contextData.HasDraftEntity === true && contextData.DraftAdministrativeData && contextData.DraftAdministrativeData.InProcessByUser && !contextData.DraftAdministrativeData.DraftIsCreatedByMe;
                });
                if (lockedContext) {
                  // Show message box with the name of the locking user and return
                  const lockingUserName = lockedContext.getObject().DraftAdministrativeData.InProcessByUser;
                  MessageBox.show(resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_SINGLE_OBJECT_LOCKED", [lockingUserName]), {
                    title: resourceModel.getText("C_COMMON_DELETE"),
                    onClose: reject
                  });
                  return;
                } else {
                  unSavedContext = contextsToDelete.find(context => {
                    const {
                      IsActiveEntity,
                      HasDraftEntity,
                      DraftAdministrativeData
                    } = context.getObject() || {};
                    return IsActiveEntity === true && HasDraftEntity === true && !!DraftAdministrativeData?.InProcessByUser;
                  });
                }
              }
              let nonTableTxt = "";
              if (unSavedContext) {
                const unSavedContextUser = unSavedContext.getObject().DraftAdministrativeData.InProcessByUser;
                nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_CHANGES", [unSavedContextUser], mParameters.entitySetName);
              } else if (mParameters.title) {
                if (mParameters.description) {
                  nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO", [mParameters.title, mParameters.description], mParameters.entitySetName);
                } else {
                  nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_ONLY", [mParameters.title], mParameters.entitySetName);
                }
              } else {
                nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR", undefined, mParameters.entitySetName);
              }
              options.push({
                type: DeleteOptionTypes.deletableContexts,
                contexts: contextsToDelete,
                text: nonTableTxt,
                selected: true,
                control: DeleteDialogContentControl.TEXT
              });
            } else {
              // Table
              let totalDeletable = contextsToDelete.length;
              if (draftEnabled) {
                totalDeletable += (mParameters.draftsWithNonDeletableActive?.length ?? 0) + (mParameters.draftsWithDeletableActive?.length ?? 0) + (mParameters.unSavedContexts?.length ?? 0);
                deleteHelper.updateDraftOptionsForDeletableTexts(mParameters, contextsToDelete, totalDeletable, resourceModel, items, options);
              } else {
                const nonDeletableText = deleteHelper.getNonDeletableText(mParameters, totalDeletable, resourceModel);
                if (nonDeletableText) {
                  items.push(nonDeletableText);
                }
              }
              const optionsDeletableTexts = deleteHelper.getOptionsForDeletableTexts(mParameters, contextsToDelete, resourceModel);
              options = [...options, ...optionsDeletableTexts];
            }
          }
          const commonBinding = firstContext.getBinding();
          let bindingType;
          if (commonBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
            if (this.isListBindingHierarchical(commonBinding)) {
              bindingType = "Tree";
            } else if (this.isListBindingAnalytical(commonBinding)) {
              bindingType = "Analytical";
            }
          }

          // Content of Delete Dialog
          deleteHelper.updateContentForDeleteDialog(options, items);
          const fnConfirm = async () => {
            messageHandling.removeBoundTransitionMessages();
            this.busyLock(appComponent);
            try {
              await deleteHelper.deleteConfirmHandler(options, mParameters, messageHandler, resourceModel, appComponent, draftEnabled, bindingType);
              resolve();
            } catch (oError) {
              reject();
            } finally {
              this.busyUnlock(appComponent);
            }
          };
          const dialog = this.createDeleteDialog(items, mParameters, resourceModel, fnConfirm, reject);
          if (mParameters.noDialog === true || mParameters.silentMode === true) {
            fnConfirm();
          } else {
            dialog.addStyleClass("sapUiContentPadding");
            dialog.open();
          }
        } finally {
          // delete document unlock
          this.busyUnlock(appComponent);
        }
      });
    }

    /**
     * Create the confirmation dialog fo the deletion.
     * @param items An array of controls used for the dialog content
     * @param parameters Contains the following attributes:
     * @param parameters.parentControl Parent control of the delete button if any
     * @param parameters.entitySetName Name of the current entitySet
     * @param resourceModel The resource model to load text resources
     * @param fnConfirm Function executed upon the validation of the deletion
     * @param fnReject Function executed if the dialog is closed via Cancel or Escape button
     * @returns The created delete confirmation dialog
     */;
    _proto.createDeleteDialog = function createDeleteDialog(items, parameters, resourceModel, fnConfirm, fnReject) {
      let dialogConfirmed = false;
      const vBox = new VBox({
        items: items
      });
      const resourceBundleCore = Library.getResourceBundleFor("sap.fe.core");
      let title;
      if (parameters.parentControl?.isA("sap.ui.mdc.Table")) {
        title = resourceModel.getText("M_COMMON_TABLE_DELETE", undefined, parameters.entitySetName);
      } else {
        title = resourceBundleCore.getText("C_COMMON_DELETE");
      }
      const dialog = new Dialog({
        title: title,
        state: "Warning",
        content: [vBox],
        ariaLabelledBy: items,
        beginButton: new Button({
          text: title,
          type: "Emphasized",
          press: function () {
            dialogConfirmed = true;
            dialog.close();
            fnConfirm();
          }
        }),
        endButton: new Button({
          text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"),
          press: function () {
            dialog.close();
          }
        }),
        afterClose: function () {
          dialog.destroy();
          // if dialog is closed unconfirmed (e.g. via "Cancel" or Escape button), ensure to reject promise
          if (!dialogConfirmed) {
            fnReject();
          }
        }
      });
      return dialog;
    }

    /**
     * Edits a document.
     * @param oContext Context of the active document
     * @param oView Current view
     * @param appComponent The appComponent
     * @param messageHandler The message handler extension
     * @param groupId The batch groupId for post call of edit action
     * @returns Promise resolves with the new draft context in case of draft programming model
     * @final
     */;
    _proto.editDocument = async function editDocument(oContext, oView, appComponent, messageHandler, groupId) {
      const sProgrammingModel = this.getProgrammingModel(oContext);
      if (!oContext) {
        throw new Error("Binding context to active document is required");
      }
      if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
        throw new Error("Edit is only allowed for draft or sticky session supported services");
      }
      this.busyLock(appComponent);
      // before triggering the edit action we'll have to remove all bound transition messages
      messageHandler.removeTransitionMessages();
      const messageHandlingKey = messageHandler.registerToHoldMessages();
      try {
        const oNewContext = sProgrammingModel === ProgrammingModel.Draft ? await draft.createDraftFromActiveDocument(oContext, appComponent, {
          bPreserveChanges: true,
          oView: oView
        }, groupId, messageHandler) : await sticky.editDocumentInStickySession(oContext, appComponent, messageHandler);
        await messageHandler.showMessageDialog({
          unHoldKey: messageHandlingKey
        });
        return oNewContext;
      } catch (err) {
        await messageHandler.showMessages({
          concurrentEditFlag: true,
          unHoldKey: messageHandlingKey
        });
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Cancel 'edit' mode of a document.
     * @param oContext Context of the document to be canceled or deleted
     * @param [mInParameters] Optional, can contain the following attributes:
     * @param mInParameters.cancelButton Cancel Button of the discard popover (mandatory for now)
     * @param mInParameters.skipDiscardPopover Optional, supresses the discard popover incase of draft applications while navigating out of OP
     * @param appComponent The appComponent
     * @param resourceModel The model to load text resources
     * @param messageHandler The message handler extension
     * @param isNewObject True if we're trying to cancel a newly created object
     * @param isObjectModified True if the object has been modified by the user
     * @returns Promise resolves with ???
     * @final
     */;
    _proto.cancelDocument = async function cancelDocument(oContext, mInParameters, appComponent, resourceModel, messageHandler, isNewObject, isObjectModified) {
      //context must always be passed - mandatory parameter
      if (!oContext) {
        throw new Error("No context exists. Pass a meaningful context");
      }
      const mParameters = getParameters(mInParameters);
      const oModel = oContext.getModel();
      const sProgrammingModel = this.getProgrammingModel(oContext);
      if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
        throw new Error("Cancel document only allowed for draft or sticky session supported services");
      }
      this.busyLock(appComponent);
      try {
        let returnedValue;
        if (sProgrammingModel === ProgrammingModel.Draft && !isObjectModified) {
          const draftDataContext = oModel.bindContext(`${oContext.getPath()}/DraftAdministrativeData`).getBoundContext();
          const draftAdminData = await draftDataContext.requestObject();
          if (draftAdminData) {
            isObjectModified = draftAdminData.CreationDateTime !== draftAdminData.LastChangeDateTime;
          }
        }
        if (!mParameters.skipDiscardPopover) {
          await this._confirmDiscard(mParameters.cancelButton, isObjectModified, resourceModel);
        }
        if (oContext.isKeepAlive()) {
          // if the context is kept alive we set it again to detach the onBeforeDestroy callback and handle navigation here
          // the context needs to still be kept alive to be able to reset changes properly
          oContext.setKeepAlive(true, undefined);
        }
        if (mParameters.beforeCancelCallBack) {
          await mParameters.beforeCancelCallBack({
            context: oContext
          });
        }
        if (sProgrammingModel === ProgrammingModel.Draft) {
          if (isNewObject) {
            if (oContext.hasPendingChanges()) {
              oContext.getBinding().resetChanges();
            }
            await draft.deleteDraft(oContext, messageHandler, appComponent);
          } else {
            const oSiblingContext = oModel.bindContext(`${oContext.getPath()}/SiblingEntity`).getBoundContext();
            try {
              const sCanonicalPath = await oSiblingContext.requestCanonicalPath();
              if (oContext.hasPendingChanges()) {
                oContext.getBinding().resetChanges();
              }
              returnedValue = oModel.bindContext(sCanonicalPath).getBoundContext();
            } finally {
              await draft.deleteDraft(oContext, messageHandler, appComponent);
            }
          }
        } else {
          const discardedContext = await sticky.discardDocument(oContext);
          if (discardedContext) {
            if (discardedContext.hasPendingChanges()) {
              discardedContext.getBinding().resetChanges();
            }
            if (!isNewObject) {
              discardedContext.refresh();
              returnedValue = discardedContext;
            }
          }
        }

        // remove existing bound transition messages
        messageHandler.removeTransitionMessages();
        // show unbound messages
        await messageHandler.showMessages();
        return returnedValue;
      } catch (err) {
        await messageHandler.showMessages();
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Saves the document.
     * @param context Context of the document to be saved
     * @param appComponent The appComponent
     * @param resourceModel The model to load text resources
     * @param executeSideEffectsOnError True if we should execute side effects in case of an error
     * @param bindingsForSideEffects The listBindings to be used for executing side effects on error
     * @param messageHandler The message handler extension
     * @param isNewObject True if we're trying to cancel a newly created object
     * @param skipConfirmationMsg
     * @returns Promise resolves with ???
     * @final
     */;
    _proto.saveDocument = async function saveDocument(context, appComponent, resourceModel, executeSideEffectsOnError, bindingsForSideEffects, messageHandler, isNewObject) {
      let skipConfirmationMsg = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
      const sProgrammingModel = this.getProgrammingModel(context);
      if (sProgrammingModel !== ProgrammingModel.Sticky && sProgrammingModel !== ProgrammingModel.Draft) {
        throw new Error("Save is only allowed for draft or sticky session supported services");
      }
      try {
        this.busyLock(appComponent);
        const entitySetName = this.getCollectionNameFromContext(context);
        const oActiveDocument = sProgrammingModel === ProgrammingModel.Draft ? await draft.activateDocument(context, appComponent, {}, messageHandler) : await sticky.activateDocument(context, appComponent, messageHandler);
        const messagesReceived = messageHandling.getMessages().concat(messageHandling.getMessages(true, true)); // get unbound and bound messages present in the model
        if (!skipConfirmationMsg && !(messagesReceived.length === 1 && messagesReceived[0].getType() === MessageType.Success)) {
          // show our object creation toast only if it is not coming from backend
          MessageToast.show(isNewObject ? resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_CREATED", undefined, entitySetName) : resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_SAVED", undefined, entitySetName));
        }
        return oActiveDocument;
      } catch (err) {
        if (executeSideEffectsOnError && bindingsForSideEffects?.length > 0) {
          /* The sideEffects are executed only for table items in transient state */
          bindingsForSideEffects.forEach(listBinding => {
            if (!CommonUtils.hasTransientContext(listBinding)) {
              appComponent.getSideEffectsService().requestSideEffectsForNavigationProperty(listBinding.getPath(), context);
            }
          });
        }
        await messageHandler.showMessages();
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Calls a bound or unbound action.
     * @param sActionName The name of the action to be called
     * @param [mParameters] Contains the following attributes:
     * @param [mParameters.parameterValues] A map of action parameter names and provided values
     * @param [mParameters.skipParameterDialog] Skips the parameter dialog if values are provided for all of them
     * @param [mParameters.contexts] Mandatory for a bound action: Either one context or an array with contexts for which the action is to be called
     * @param [mParameters.model] Mandatory for an unbound action: An instance of an OData V4 model
     * @param [mParameters.invocationGrouping] Mode how actions are to be called: 'ChangeSet' to put all action calls into one changeset, 'Isolated' to put them into separate changesets
     * @param [mParameters.label] A human-readable label for the action
     * @param mParameters.bindingParameters
     * @param mParameters.showActionParameterDialog
     * @param mParameters.entitySetName
     * @param mParameters.view
     * @param mParameters.controlId
     * @param mParameters.isCreateAction
     * @param mParameters.operationAvailableMap
     * @param mParameters.internalModelContext
     * @param mParameters.groupId
     * @param mParameters.defaultValuesExtensionFunction
     * @param mParameters.ignoreETag If specified, the action is called without ETag handling
     * @param mParameters.feFrameworkCall
     * @param appComponent The appComponent
     * @param messageHandler The message handler extension
     * @returns Promise resolves with an array of response objects (TODO: to be changed)
     * @final
     */;
    _proto.callAction = async function callAction(sActionName, mParameters, appComponent, messageHandler) {
      mParameters = getParameters(mParameters);
      let contextToProcess;
      let oModel;
      if (!sActionName) {
        throw new Error("Provide name of action to be executed");
      }
      // action imports are not directly obtained from the metaModel by it is present inside the entityContainer
      // and the acions it refers to present outside the entitycontainer, hence to obtain kind of the action
      // split() on its name was required
      const sName = sActionName.split("/")[1];
      contextToProcess = sName ? undefined : mParameters.contexts;
      //checking whether the context is an array with more than 0 length or not an array(create action)
      if (contextToProcess && (Array.isArray(contextToProcess) && contextToProcess.length || !Array.isArray(contextToProcess))) {
        contextToProcess = Array.isArray(contextToProcess) ? contextToProcess[0] : contextToProcess;
        oModel = contextToProcess.getModel();
      }
      if (mParameters.model) {
        oModel = mParameters.model;
      }
      if (!oModel) {
        throw new Error("Pass a context for a bound action or pass the model for an unbound action");
      }
      try {
        const control = mParameters.controlId ? mParameters.view.byId(mParameters.controlId) : mParameters.view;
        let oResult;
        if (contextToProcess && mParameters.contexts) {
          const contexts = Array.isArray(mParameters.contexts) ? mParameters.contexts : [mParameters.contexts]; // Ensure that contexts is an array (for static actions it's not an we need to fix it)

          const metaModel = oModel.getMetaModel(),
            actionPath = `${metaModel.getMetaPath(contexts[0].getPath())}/${sActionName}`,
            boundAction = metaModel.createBindingContext(`${actionPath}/@$ui5.overload/0`);
          const convertedTypes = convertTypes(oModel.getMetaModel());
          const convertedAction = convertedTypes.resolvePath(boundAction.getPath()).target;
          if (!convertedAction) {
            throw new Error("Unknown bound action");
          }
          oResult = await new Operation(appComponent, oModel, convertedAction, {
            parameterValues: mParameters.parameterValues,
            contexts,
            invocationGrouping: mParameters.invocationGrouping,
            label: mParameters.label,
            skipParameterDialog: mParameters.skipParameterDialog,
            bindingParameters: mParameters.bindingParameters,
            entitySetName: mParameters.entitySetName,
            oDataProperties: {
              ghostContextBindingProtection: true,
              enhance$select: mParameters.feFrameworkCall === true,
              groupId: mParameters.groupId,
              ignoreETag: mParameters.ignoreETag
            },
            oDataEvents: {
              onODataSubmit: () => {
                messageHandler?.removeTransitionMessages();
                this.busyLock(appComponent);
              },
              onODataResponse: () => {
                this.busyUnlock(appComponent);
              },
              onRequestSideEffects: () => {
                this.handleActionEnablementOnOperation({
                  internalModelContext: mParameters.internalModelContext,
                  operationAvailableMap: mParameters.operationAvailableMap,
                  control: control,
                  contexts,
                  convertedAction
                });
              }
            },
            view: mParameters.view,
            isCreateAction: mParameters.isCreateAction,
            messageHandler: messageHandler,
            defaultValuesExtensionFunction: mParameters.defaultValuesExtensionFunction
          }).execute();
        } else {
          oResult = await operations.callActionImport(sActionName, oModel, appComponent, {
            parameterValues: mParameters.parameterValues,
            label: mParameters.label,
            skipParameterDialog: mParameters.skipParameterDialog,
            bindingParameters: mParameters.bindingParameters,
            entitySetName: mParameters.entitySetName,
            oDataEvents: {
              onODataSubmit: () => {
                this.busyLock(appComponent);
              },
              onODataResponse: () => {
                this.busyUnlock(appComponent);
              }
            },
            oDataProperties: {
              ignoreETag: mParameters.ignoreETag
            },
            messageHandler: messageHandler,
            view: mParameters.view
          });
        }
        if (messageHandler) {
          this._handleActionResponse(mParameters, sActionName);
        }
        return oResult;
      } catch (err) {
        if (messageHandler) {
          this._handleActionResponse(mParameters, sActionName);
        }
        throw err;
      }
    }

    /**
     * Gets the collection name from the context.
     * @param context The context
     * @returns The collection name
     */;
    _proto.getCollectionNameFromContext = function getCollectionNameFromContext(context) {
      const metaContext = context.getModel().getMetaModel().getMetaContext(context.getPath());
      return MetaModelConverter.getInvolvedDataModelObjects(metaContext).targetObject?.name;
    };
    _proto.handleActionEnablementOnOperation = function handleActionEnablementOnOperation(parameters) {
      if (parameters.internalModelContext && parameters.operationAvailableMap) {
        let selectedContexts = [];
        //check for skipping static actions
        if (!actionHelper.isStaticAction(parameters.convertedAction)) {
          selectedContexts = parameters.internalModelContext.getProperty("selectedContexts") || [];
          ActionRuntime.setActionEnablement(parameters.internalModelContext, JSON.parse(parameters.operationAvailableMap), selectedContexts, "table");
        } else if (parameters.control) {
          if (parameters.control.isA("sap.ui.mdc.Table")) {
            selectedContexts = parameters.control.getSelectedContexts();
            ActionRuntime.setActionEnablement(parameters.internalModelContext, JSON.parse(parameters.operationAvailableMap), selectedContexts, "table");
          }
        }
        //update delete button
        deleteHelper.updateDeleteInfoForSelectedContexts(parameters.internalModelContext, selectedContexts);
      }
    };
    _proto._handleActionResponse = function _handleActionResponse(mParameters, sActionName) {
      const aTransientMessages = messageHandling.getMessages(true, true);
      if (aTransientMessages.length > 0 && mParameters && mParameters.internalModelContext) {
        mParameters.internalModelContext.setProperty("sActionName", mParameters.label ? mParameters.label : sActionName);
      }
    }

    /**
     * Handles validation errors for the 'Discard' action.
     * @final
     */;
    _proto.handleValidationError = function handleValidationError() {
      const errorToRemove = Messaging.getMessageModel().getData().filter(error => error.validation); // only needs to handle validation messages, technical and persistent errors needs not to be checked here.
      Messaging.removeMessages(errorToRemove);
    }

    /**
     * Creates a new Popover. Factory method to make unit tests easier.
     * @param settings Initial parameters for the popover
     * @returns A new Popover
     */;
    _proto._createPopover = function _createPopover(settings) {
      return new Popover(settings);
    }

    /**
     * Shows a popover to confirm discard if needed.
     * @param cancelButton The control which will open the popover
     * @param isModified True if the object has been modified and a confirmation popover must be shown
     * @param resourceModel The model to load text resources
     * @returns Promise resolves if user confirms discard, rejects if otherwise, rejects if no control passed to open popover
     * @final
     */;
    _proto._confirmDiscard = async function _confirmDiscard(cancelButton, isModified, resourceModel) {
      // If the data isn't modified, do not show any confirmation popover
      if (!isModified) {
        this.handleValidationError();
        return Promise.resolve();
      }
      cancelButton.setEnabled(false);
      return new Promise((resolve, reject) => {
        const confirmationPopover = this._createPopover({
          showHeader: false,
          placement: "Top"
        });
        confirmationPopover.addStyleClass("sapUiContentPadding");

        // Create the content of the popover
        const title = new Text({
          text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_MESSAGE")
        });
        const confirmButton = new Button({
          text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_BUTTON"),
          width: "100%",
          press: () => {
            this.handleValidationError();
            confirmationPopover.data("continueDiscard", true);
            confirmationPopover.close();
          }
        });
        confirmationPopover.addContent(new VBox({
          items: [title, confirmButton]
        }));

        // Attach handler
        confirmationPopover.attachBeforeOpen(() => {
          confirmationPopover.setInitialFocus(confirmButton);
        });
        confirmationPopover.attachAfterClose(() => {
          cancelButton.setEnabled(true);
          if (confirmationPopover.data("continueDiscard")) {
            resolve();
          } else {
            reject();
          }
        });
        confirmationPopover.openBy(cancelButton, false);
      });
    }

    /**
     * Reloads data for an ODataListBinding.
     * @param listBinding The listbinding to refresh
     * @param appComponent
     * @returns The corresponding promise
     */;
    _proto.refreshListBinding = async function refreshListBinding(listBinding, appComponent) {
      try {
        if (listBinding.isRoot()) {
          if (this.isListBindingHierarchical(listBinding)) {
            // We use a side-effect refresh for a TreeTable, to preserve expansion states
            await appComponent.getSideEffectsService().requestSideEffects([{
              $NavigationPropertyPath: ""
            }], listBinding.getHeaderContext());
          } else {
            await listBinding.requestRefresh();
          }
        } else {
          await appComponent.getSideEffectsService().requestSideEffects([{
            $NavigationPropertyPath: listBinding.getPath()
          }], listBinding.getContext());
        }
      } catch (error) {
        Log.error(`Error while refreshing list binding ${listBinding.getPath()}`, error);
      }
    };
    _proto.createWithDialog = async function createWithDialog(listBinding, fieldNames, parameters, appComponent, resourceModel, messageHandler) {
      const model = listBinding.getModel();
      const metaModel = model.getMetaModel();
      const listMetaPath = metaModel.getMetaPath(listBinding.getResolvedPath());

      // Create a fake (transient) listBinding and context, just for the binding context of the dialog
      const transientListBinding = model.bindList(listBinding.getPath(), listBinding.getContext(), undefined, undefined, {
        $$updateGroupId: "submitLater"
      });
      transientListBinding.refreshInternal = function () {
        /* */
      };
      const transientContext = transientListBinding.create(parameters.data, true);
      const fieldMetaContexts = fieldNames.map(name => {
        return metaModel.createBindingContext(`${listMetaPath}/${name}`);
      });
      const createDialog = getCoreUIFactory().newCreateDialog(transientContext, fieldNames, appComponent, parameters.creationMode === CreationMode.CreationDialog ? "Standalone" : "WithNavigation", parameters.parentControl);
      try {
        await CommonUtils.setUserDefaults(appComponent, fieldMetaContexts, transientContext, false, parameters.createAction, parameters.data);
        createDialog.openDialog();
      } catch (e) {
        await messageHandler.showMessages();
        throw e;
      }
      const resultPromiseKeeper = new PromiseKeeper();
      const onExitDialog = async event => {
        if (!event.getParameter("accept")) {
          // User has cancelled creation: destroy the transient list binding and close the dialog
          transientListBinding.destroy();
          createDialog.closeDialog();
          resultPromiseKeeper.reject(FELibrary.Constants.CancelActionDialog);
          return;
        }
        createDialog.setBusy(true);
        parameters.bIsCreateDialog = true;
        try {
          const transientData = transientContext.getObject();
          let createData = {};
          Object.keys(transientData).forEach(propertyPath => {
            const oProperty = metaModel.getObject(`${listMetaPath}/${propertyPath}`);
            // Ensure navigation properties are not part of the payload, as deep create not supported
            // And remove any property starting by @$ui5 as they are not property created by filling the form
            if (oProperty && oProperty.$kind !== "NavigationProperty" && !propertyPath?.startsWith("@$ui5")) {
              createData[propertyPath] = transientData[propertyPath];
            }
          });
          if (parameters.beforeCreateCallBack) {
            //beforeCreateCallBack expects createParameters of type any[]
            const createDataAsArray = Object.entries(createData).map(_ref2 => {
              let [key, value] = _ref2;
              return {
                [key]: value
              };
            });
            try {
              await toES6Promise(parameters.beforeCreateCallBack({
                contextPath: listBinding.getPath(),
                createParameters: createDataAsArray
              }));
            } catch (error) {
              Log.error("Error while creating the new document", error);
              throw FELibrary.Constants.OnBeforeCreateFailed;
            }
            createData = createDataAsArray.reduce((result, currentObject) => {
              return {
                ...result,
                ...currentObject
              };
            }, {});
          }
          if (Object.keys(createData).length > 0) {
            appComponent.getModel("ui").setProperty(UiModelConstants.DocumentModified, true);
          }
          const newContext = await this.createContext(listBinding, createData, {
            createAtEnd: parameters.createAtEnd,
            createInactive: parameters.inactive,
            parentContext: parameters.parentContext
          });
          const creationSuccess = await this.waitForCreateCompletion(newContext, parameters.keepTransientContextOnFailed === true);
          if (creationSuccess) {
            try {
              await parameters.afterCreateCallBack?.(newContext);
            } catch (error) {
              createDialog.displayErrorMessages(Messaging.getMessageModel().getData());
              await messageHandler.showMessageDialog({
                showBoundStateMessages: true
              });

              // Delete the created document and refresh its list binding (otherwise the created document is still visible in the list)
              await this.deleteDocument(newContext, {
                silentMode: true
              }, appComponent, resourceModel, messageHandler);
              await this.refreshListBinding(listBinding, appComponent);
              Log.error("Error while creating/saving the new document", error);
              throw FELibrary.Constants.CreationFailed;
            }
            transientListBinding.destroy();
            createDialog.closeDialog();
            resultPromiseKeeper.resolve(newContext);
          }
        } catch (error) {
          // in case of creation failed, dialog should stay open - to achieve the same, nothing has to be done (like in case of success with bKeepDialogOpen)
          if (![FELibrary.Constants.OnBeforeCreateFailed, FELibrary.Constants.CreationFailed].includes(error)) {
            // other errors are not expected
            transientListBinding.destroy();
            createDialog.closeDialog();
            resultPromiseKeeper.reject(error);
          }
        } finally {
          createDialog.setBusy(false);
          messageHandler.showMessages({
            isOperationDialogOpen: createDialog.isOpen()
          });
        }
      };
      createDialog.attachExitDialog({}, onExitDialog);
      return resultPromiseKeeper.promise;
    }

    /**
     * Waits for the creation of a context to be finished.
     * @param newContext The context being created
     * @param keepTransientContextOnFailed
     * @returns True if the creation was successful
     */;
    _proto.waitForCreateCompletion = async function waitForCreateCompletion(newContext, keepTransientContextOnFailed) {
      const promiseKeeper = new PromiseKeeper();
      const parentListBinding = newContext.getBinding();
      const onCreateCompleted = event => {
        const createdContext = event.getParameter("context");
        const success = event.getParameter("success");
        if (createdContext === newContext) {
          parentListBinding.detachCreateCompleted(onCreateCompleted);
          promiseKeeper.resolve(success === true);
        }
      };
      parentListBinding.attachCreateCompleted(onCreateCompleted);
      const creationSuccessful = await promiseKeeper.promise;
      if (!creationSuccessful) {
        if (!keepTransientContextOnFailed) {
          // Cancel the pending POST and delete the context in the listBinding
          (newContext.created() ?? Promise.resolve()).catch(function (contextError) {
            Log.trace("transient creation context deletion error", contextError);
          });
          parentListBinding.resetChanges();
          parentListBinding.getModel().resetChanges(parentListBinding.getUpdateGroupId());
          throw FELibrary.Constants.CreationFailed;
        }
        return false;
      } else {
        await newContext.created();
        return true;
      }
    }

    /**
     * Retrieves the name of the NewAction to be executed.
     * @param oStartupParameters Startup parameters of the application
     * @param [oStartupParameters.preferredMode]
     * @param sCreateHash Hash to be checked for action type
     * @param oMetaModel The MetaModel used to check for NewAction parameter
     * @param sMetaPath The MetaPath
     * @returns The name of the action
     * @final
     */;
    _proto._getNewAction = function _getNewAction(oStartupParameters, sCreateHash, oMetaModel, sMetaPath) {
      let sNewAction;
      if (oStartupParameters && oStartupParameters.preferredMode && sCreateHash.toUpperCase().includes("I-ACTION=CREATEWITH")) {
        const sPreferredMode = oStartupParameters.preferredMode[0];
        sNewAction = sPreferredMode.toUpperCase().includes("CREATEWITH:") ? sPreferredMode.substring(sPreferredMode.lastIndexOf(":") + 1) : undefined;
      } else if (oStartupParameters && oStartupParameters.preferredMode && sCreateHash.toUpperCase().includes("I-ACTION=AUTOCREATEWITH")) {
        const sPreferredMode = oStartupParameters.preferredMode[0];
        sNewAction = sPreferredMode.toUpperCase().includes("AUTOCREATEWITH:") ? sPreferredMode.substring(sPreferredMode.lastIndexOf(":") + 1) : undefined;
      } else {
        sNewAction = oMetaModel && oMetaModel.getObject !== undefined ? oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/NewAction`) || oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Common.v1.DraftRoot/NewAction`) : undefined;
      }
      return sNewAction;
    }

    /**
     * Retrieves the label for the title of a specific create action dialog, e.g. Create Sales Order from Quotation.
     *
     * The following priority is applied:
     * 1. label of line-item annotation.
     * 2. label annotated in the action.
     * 3. "Create" as a constant from i18n.
     * @param oMetaModel The MetaModel used to check for the NewAction parameter
     * @param sMetaPath The MetaPath
     * @param sNewAction Contains the name of the action to be executed
     * @param resourceModel ResourceBundle to access the default Create label
     * @returns The label for the Create Action Dialog
     * @final
     */;
    _proto._getSpecificCreateActionDialogLabel = function _getSpecificCreateActionDialogLabel(oMetaModel, sMetaPath, sNewAction, resourceModel) {
      const lineItems = oMetaModel?.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.LineItem`);
      const label = lineItems?.find(lineItem => isDataFieldForAction(lineItem) && lineItem.Action.split("(", 1)[0] === sNewAction)?.Label;
      return label || oMetaModel?.getObject(`${sMetaPath}/${sNewAction}@com.sap.vocabularies.Common.v1.Label`) || resourceModel?.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE");
    };
    return TransactionHelper;
  }();
  const singleton = new TransactionHelper();
  return singleton;
}, false);
//# sourceMappingURL=TransactionHelper-dbg.js.map

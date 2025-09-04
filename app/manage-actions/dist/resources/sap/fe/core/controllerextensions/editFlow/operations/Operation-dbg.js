/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/controls/Any", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/library", "sap/fe/core/templating/ActionHelper", "sap/m/MessageBox", "../../../converters/MetaModelConverter", "../../../helpers/ResourceModelHelper", "./ODataOperation", "./OperationMessage", "./OperationParameters", "./actionHelper"], function (BindingToolkit, Any, TypeGuards, FELibrary, ActionHelper, MessageBox, MetaModelConverter, ResourceModelHelper, ODataOperation, OperationMessage, OperationParameters, actionHelper) {
  "use strict";

  var _exports = {};
  var convertTypes = MetaModelConverter.convertTypes;
  var getIsActionCriticalExpression = ActionHelper.getIsActionCriticalExpression;
  var isRejected = TypeGuards.isRejected;
  var isConstant = BindingToolkit.isConstant;
  var compileExpression = BindingToolkit.compileExpression;
  var compileConstant = BindingToolkit.compileConstant;
  const InvocationGrouping = FELibrary.InvocationGrouping;
  let Operation = /*#__PURE__*/function () {
    function Operation(appComponent, model, convertedAction, parameters) {
      this.executionPromise = new Promise((resolve, reject) => {
        this.executionResolve = resolve;
        this.executionReject = reject;
      });
      this.parametersValues = {};
      this.numberOfODataExecutions = 0;
      this.externalParametersValues = false;
      this.appComponent = appComponent;
      this.model = model;
      this.convertedAction = convertedAction;
      this.parameters = parameters;
      this.contexts = parameters.contexts ?? [];
      this.setMessageCollectedPromise();
      this.operationMessage = new OperationMessage({
        messageHandler: this.parameters.messageHandler,
        action: this.convertedAction,
        contexts: this.contexts,
        label: this.parameters.label,
        invocationGrouping: this.parameters.invocationGrouping,
        disableNotification: this.parameters.skipMessages,
        entitySetName: this.parameters.entitySetName,
        events: {
          onMessageCollected: () => {
            // Due to the mess into the message handling
            // the dialog should be closed or not only after the messages are collected
            // it means in the middle of the message handling workflow via
            // a callback function
            this.manageDialogOnMessages();
            this.messageCollectedResolve();
          },
          onMessagePageNavigationCallback: () => {
            this.operationParameters.closeParameterDialog();
          }
        }
      });
      this.operationParameters = new OperationParameters(this.appComponent, this.model, this.convertedAction, this.parameters.skipParameterDialog, {
        contexts: this.contexts,
        defaultValuesExtensionFunction: this.parameters.defaultValuesExtensionFunction,
        isCreateAction: this.parameters.isCreateAction,
        label: this.parameters.label,
        parameterValues: this.parameters.parameterValues,
        entitySetName: this.parameters.entitySetName,
        view: this.parameters.view,
        messageHandler: this.parameters.messageHandler,
        events: {
          onParameterDialogOpened: this.operationMessage.onParameterDialogOpened.bind(this.operationMessage),
          onParameterDialogClosed: this.operationMessage.onParameterDialogClosed.bind(this.operationMessage)
        }
      });
    }
    _exports = Operation;
    var _proto = Operation.prototype;
    _proto.clear = function clear() {
      this.operationParameters.closeParameterDialog();
      this.odataOperation?.clear();
    }

    /**
     * Set the values related to the parameters  for the operation
     * If the values are set the operation parameter dialog is skipped.
     * @param parametersValues The values for the parameters
     */;
    _proto.setDefaultParametersValues = function setDefaultParametersValues(parametersValues) {
      this.parametersValues = parametersValues;
      this.externalParametersValues = true;
    }

    /**
     * Executes the operation.
     * @returns A promise containing the results
     */;
    _proto.execute = async function execute() {
      this.internalExecution();
      return this.executionPromise;
    }

    /**
     * Executes the operation.
     */;
    _proto.internalExecution = async function internalExecution() {
      let operationResult = [];
      try {
        this.numberOfODataExecutions++;
        if (!this.externalParametersValues) {
          this.parametersValues = await this.operationParameters.getOperationParameters();
        }
        if (this.numberOfODataExecutions === 1) {
          await this.confirmAction();
        }
        this.odataOperation = new ODataOperation(this.convertedAction, {
          appComponent: this.appComponent,
          contexts: this.contexts,
          model: this.model,
          label: this.parameters.label,
          invocationGrouping: this.parameters.invocationGrouping,
          disableStrictHandling: this.parameters.oDataProperties?.disableStrictHandling,
          disableSideEffects: this.parameters.oDataProperties?.disableSideEffects,
          ghostContextBindingProtection: this.parameters.oDataProperties?.ghostContextBindingProtection,
          events: {
            onStrictValidation: this.parameters.oDataEvents?.onStrictValidation,
            onStrictCancel: this.parameters.oDataEvents?.onStrictCancel,
            onStrictResponse: messages412 => {
              this.parameters.messageHandler.addWarningMessagesToMessageHandler(messages412);
              this.operationMessage.onStrictHandling();
            },
            onODataResponse: this.parameters.oDataEvents?.onODataResponse,
            onODataSubmit: this.parameters.oDataEvents?.onODataSubmit,
            onRequestSideEffects: this.parameters.oDataEvents?.onRequestSideEffects
          },
          parametersValues: this.parametersValues
        }, {
          enhance$select: this.parameters.oDataProperties?.enhance$select,
          groupId: this.parameters.oDataProperties?.groupId,
          replaceWithRVC: this.parameters.oDataProperties?.replaceWithRVC,
          ignoreETag: this.parameters.oDataProperties?.ignoreETag,
          bindingParameters: this.parameters.bindingParameters,
          deferredSubmit: this.parameters.oDataProperties?.deferredSubmit
        });
        operationResult = await this.odataOperation.execute();
        this.operationMessage.reactToOperations(operationResult);
        if (this.operationParameters.isParameterDialog()) {
          if (!operationResult.some(isRejected)) {
            this.closeDialog();
          } else {
            await this.messageCollectedPromise;
          }
        }
        if (this.operationParameters.isParameterDialogOpened()) {
          this.setMessageCollectedPromise();
          this.internalExecution();
        } else {
          this.executionResolve(operationResult);
        }
      } catch (e) {
        this.executionReject(e);
      }
    }

    /**
     * Manages the parameter dialog after the messages.
     */;
    _proto.manageDialogOnMessages = function manageDialogOnMessages() {
      const isErrorIntoParameterDialog = this.operationMessage.isErrorIntoParameterDialog();
      if (actionHelper.isStaticAction(this.convertedAction) || this.contexts.length === 0) {
        // Don't close the dialog if the action is static or an import
        return this.resetDialog();
      } else if (this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
        // When the end user cancel the process on the strict dialog, we need to keep the parameter dialog (only on ChangeSet) #6376592
        if (isErrorIntoParameterDialog || this.odataOperation?.isStrictCanceled() === true) {
          return this.resetDialog();
        } else {
          return this.closeDialog();
        }
      } else if (this.parameters.contexts && this.parameters.contexts.length > 1 || !isErrorIntoParameterDialog) {
        // does not matter if error is in APD or not, if there are multiple contexts selected or if the error is not the APD, we close it.
        return this.closeDialog();
      }
      return this.resetDialog();
    }

    /**
     * Sets the message collected promise.
     * This promise is resolved when the messages are collected.
     */;
    _proto.setMessageCollectedPromise = function setMessageCollectedPromise() {
      this.messageCollectedPromise = new Promise(resolve => {
        this.messageCollectedResolve = resolve;
      });
    }

    /**
     * Closes the parameter dialog.
     */;
    _proto.closeDialog = function closeDialog() {
      this.operationParameters.closeParameterDialog();
    }

    /**
     * Resets the parameter dialog.
     */;
    _proto.resetDialog = function resetDialog() {
      this.operationParameters.resetParameterDialogState();
    }

    /**
     * Gets the result of the operation.
     * @returns The result
     */;
    _proto.getOperationResults = async function getOperationResults() {
      return this.executionPromise;
    }

    /**
     * Checks if action is critical.
     * @returns True if the action is critical, otherwise false
     */;
    _proto.isActionCritical = async function isActionCritical() {
      //only works with single context (as former code);
      const context = this.parameters.contexts?.[0];
      // default is true.
      let isActionCriticalValue = true;
      const isActionCriticalBindingExp = getIsActionCriticalExpression(this.convertedAction, convertTypes(this.model.getMetaModel()));
      if (isConstant(isActionCriticalBindingExp)) {
        isActionCriticalValue = compileConstant(isActionCriticalBindingExp, false, undefined, true);
      } else if (context) {
        const anyObject = new Any({
          anyBoolean: compileExpression(isActionCriticalBindingExp)
        });
        anyObject.setModel(context.getModel());
        anyObject.setBindingContext(context);
        const booleanBinding = anyObject.getBinding("anyBoolean");
        if (booleanBinding) {
          if (booleanBinding.isA("sap.ui.model.CompositeBinding")) {
            await Promise.all(booleanBinding.getBindings().map(nestedBinding => nestedBinding.requestValue?.()));
          } else {
            await booleanBinding.requestValue?.();
          }
        }
      }
      return isActionCriticalValue;
    }

    /**
     * Manages the message box to display when an action is critical.
     * @returns A promise which is resolved if the action is not critical or the message box is closed.
     */;
    _proto.confirmAction = async function confirmAction() {
      if (!this.operationParameters.isParameterDialog()) {
        const isCritical = await this.isActionCritical();
        if (isCritical) {
          const actionName = actionHelper.getActionName(this.convertedAction);
          await new Promise((resolve, reject) => {
            const boundActionName = actionName.includes(".") ? actionName.split(".")[actionName.split(".").length - 1] : actionName;
            const suffixResourceKey = boundActionName && this.parameters.entitySetName ? `${this.parameters.entitySetName}|${boundActionName}` : "";
            MessageBox.confirm(ResourceModelHelper.getResourceModel(this.parameters.view ?? this.appComponent).getText("C_OPERATIONS_ACTION_CONFIRM_MESSAGE", undefined, suffixResourceKey), {
              title: this.getConfirmTitle(suffixResourceKey),
              onClose: action => {
                if (action === MessageBox.Action.OK) {
                  resolve(true);
                } else {
                  reject(new Error(FELibrary.Constants.CancelActionDialog));
                }
              }
            });
          });
        }
      }
    };
    _proto.getConfirmTitle = function getConfirmTitle(suffixResourceKey) {
      // A title only exists if it has been defined in the extension. Otherwise "Confirmation"
      // is used from the MessageBox control.
      if (!this.parameters.view) {
        return undefined;
      }
      const key = "C_OPERATIONS_ACTION_CONFIRM_TITLE";
      const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.view ?? this.appComponent);
      const titleOverrideExists = resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`);
      if (titleOverrideExists) {
        return resourceModel.getText(key, undefined, suffixResourceKey);
      }
    };
    return Operation;
  }();
  _exports = Operation;
  return _exports;
}, false);
//# sourceMappingURL=Operation-dbg.js.map
